// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::collections::HashMap;
use std::sync::Arc;
use tauri::{Manager, State, Window, AppHandle, WindowEvent, CustomMenuItem, Menu, MenuItem, Submenu, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem};
use serde::{Deserialize, Serialize};
use tokio::sync::{Mutex, mpsc};
use uuid::Uuid;

// Import new security and error handling modules
mod errors;
mod validation;
mod memory;
mod error_boundary;

// Import integration modules
mod integrations {
    pub mod voice_recognition;
    pub mod ai_text_processor;
    pub mod ai_ml_api;
    pub use ai_ml_api::*;
}

use errors::{AppError, Result, VoiceError, TextProcessingError, ValidationError};
use validation::{validate_text, validate_language_code, validate_hotkey, validate_config_value, validate_numeric_value};
use memory::{get_resource_manager, start_cleanup_task, ResourceManager};
use error_boundary::{ErrorBoundary, ErrorBoundaryConfig, get_error_boundary_registry, start_error_monitoring_task, with_error_boundary, CircuitBreakerState};

// Re-export integration types for easy access
use integrations::voice_recognition::{
    VoiceRecognitionEngine, VoiceRecognitionConfig, VoiceEvent, SpeechRecognitionResult,
    get_supported_languages, is_language_supported, Language,
};
use integrations::ai_text_processor::{
    AITextProcessor, TextProcessingConfig, ProcessingRequest, ProcessingResult, 
    ProcessingContext, ToneType, ProcessingEvent, get_default_config_for_context,
};

use self::integrations::ai_text_processor::ProcessingOptions;

// Application state with integrated engines and security features
#[derive(Debug, Clone)]
pub struct AppState {
    pub voice_engine: Arc<Mutex<Option<VoiceRecognitionEngine>>>,
    pub text_processor: Arc<Mutex<Option<AITextProcessor>>>,
    pub ai_ml_gateway: Arc<Mutex<Option<AIMLAPIGateway>>>,
    pub settings: Arc<Mutex<Settings>>,
    pub shortcuts: Arc<Mutex<HashMap<String, String>>>,
    pub event_handlers: Arc<Mutex<Vec<tokio::sync::mpsc::UnboundedReceiver<VoiceEvent>>>>,
    pub resource_manager: Arc<Mutex<ResourceManager>>,
    pub error_boundaries: Arc<error_boundary::ErrorBoundaryRegistry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub language: String,
    pub voice_model: String,
    pub hotkey: String,
    pub auto_start: bool,
    pub theme: String,
    pub notifications: bool,
    pub voice_recognition: VoiceRecognitionSettings,
    pub text_processing: TextProcessingSettings,
    pub ai_ml_settings: AIMLSettings,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VoiceRecognitionSettings {
    pub continuous: bool,
    pub interim_results: bool,
    pub max_alternatives: u32,
    pub confidence_threshold: f32,
    pub noise_reduction: bool,
    pub privacy_mode: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TextProcessingSettings {
    pub context: String,
    pub tone: String,
    pub aggressiveness: f32,
    pub remove_fillers: bool,
    pub enable_caching: bool,
    pub smart_punctuation: bool,
    pub auto_correct: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIMLSettings {
    pub api_key: String,
    pub base_url: String,
    pub timeout_seconds: u64,
    pub max_retries: u32,
    pub enable_fallback: bool,
    pub cache_results: bool,
    pub default_model: String,
    pub text_model: String,
    pub voice_model: String,
    pub translation_model: String,
    pub context_model: String,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            language: "en-US".to_string(),
            voice_model: "whisper-base".to_string(),
            hotkey: "CmdOrCtrl+Space".to_string(),
            auto_start: false,
            theme: "light".to_string(),
            notifications: true,
            voice_recognition: VoiceRecognitionSettings {
                continuous: true,
                interim_results: true,
                max_alternatives: 3,
                confidence_threshold: 0.7,
                noise_reduction: true,
                privacy_mode: false,
            },
            text_processing: TextProcessingSettings {
                context: "email".to_string(),
                tone: "professional".to_string(),
                aggressiveness: 0.7,
                remove_fillers: true,
                enable_caching: true,
                smart_punctuation: true,
                auto_correct: true,
            },
            ai_ml_settings: AIMLSettings {
                api_key: std::env::var("AIML_API_KEY").unwrap_or_default(),
                base_url: "https://api.aimlapi.com".to_string(),
                timeout_seconds: 30,
                max_retries: 3,
                enable_fallback: true,
                cache_results: true,
                default_model: "gpt-4o".to_string(),
                text_model: "gpt-5-pro".to_string(),
                voice_model: "gpt-4o-mini-tts".to_string(),
                translation_model: "claude-3-5-haiku".to_string(),
                context_model: "gpt-5-pro".to_string(),
            },
        }
    }
}

// Enhanced voice engine with integrated processing
#[derive(Debug, Clone)]
pub struct EnhancedVoiceEngine {
    pub voice_engine: Arc<Mutex<Option<VoiceRecognitionEngine>>>,
    pub text_processor: Arc<Mutex<Option<AITextProcessor>>>,
    pub current_session: Arc<Mutex<Option<String>>>,
    pub window: Window,
}

// Tauri Commands for voice recognition with proper error handling and validation
#[tauri::command]
async fn initialize_voice_recognition(
    state: State<'_, AppState>,
    window: Window,
) -> Result<(), AppError> {
    let registry = get_error_boundary_registry();
    let boundary = registry.get("voice_recognition").await
        .unwrap_or_else(|| Arc::new(ErrorBoundary::new("voice_recognition".to_string(), None)));

    with_error_boundary!(boundary, async {
        let mut voice_engine_state = state.voice_engine.lock().await;
        
        // Check if already initialized
        if voice_engine_state.is_some() {
            return Err(AppError::VoiceRecognition(VoiceError::AlreadyInitialized));
        }

        let config = VoiceRecognitionConfig {
            language: "en-US".to_string(),
            continuous: true,
            interim_results: true,
            max_alternatives: 3,
            confidence_threshold: 0.7,
            noise_reduction: true,
            privacy_mode: false,
        };

        let (event_sender, event_receiver) = mpsc::unbounded_channel();
        
        // Store event receiver for the app state
        {
            let mut handlers = state.event_handlers.lock().await;
            handlers.push(event_receiver);
        }

        let engine = VoiceRecognitionEngine::new(config, event_sender);
        *voice_engine_state = Some(engine);

        // Start event handling loop with error boundary protection
        let voice_engine_clone = state.voice_engine.clone();
        let window_clone = window.clone();
        tokio::spawn(async move {
            if let Err(e) = handle_voice_events(voice_engine_clone, window_clone).await {
                tracing::error!("Voice event handling error: {}", e);
            }
        });

        Ok(())
    }).await
}

#[tauri::command]
async fn start_voice_listening(
    state: State<'_, AppState>,
    window: Window,
) -> Result<(), String> {
    let voice_engine_state = state.voice_engine.lock().await;
    
    if let Some(ref engine) = *voice_engine_state {
        let mut engine_clone = engine.clone();
        tokio::spawn(async move {
            let _ = engine_clone.start_listening().await;
        });
        
        let _ = window.emit("voice-status", "listening");
    }
    
    Ok(())
}

#[tauri::command]
async fn stop_voice_listening(
    state: State<'_, AppState>,
) -> Result<(), String> {
    let voice_engine_state = state.voice_engine.lock().await;
    
    if let Some(ref engine) = *voice_engine_state {
        let mut engine_clone = engine.clone();
        tokio::spawn(async move {
            let _ = engine_clone.stop_listening().await;
        });
    }
    
    Ok(())
}

#[tauri::command]
async fn process_speech_with_ai(
    transcript: String,
    state: State<'_, AppState>,
    window: Window,
) -> Result<ProcessingResult, AppError> {
    // Validate and sanitize input transcript
    let validated_transcript = validate_text(&transcript, Some(1), Some(5000))
        .map_err(|e| AppError::Validation(e.to_string().into()))?;

    let registry = get_error_boundary_registry();
    let boundary = registry.get("text_processor").await
        .unwrap_or_else(|| Arc::new(ErrorBoundary::new("text_processor".to_string(), None)));

    with_error_boundary!(boundary, async {
        let text_processor_state = state.text_processor.lock().await;
        
        // Send sanitized transcript to frontend
        let _ = window.emit("speech-transcript", validated_transcript.clone());
        
        if let Some(ref processor) = *text_processor_state {
            let request = ProcessingRequest {
                id: Uuid::new_v4().to_string(),
                text: validated_transcript,
                context: ProcessingContext::Email, // Could be configurable
                tone: ToneType::Professional,
                options: ProcessingOptions {
                    aggressiveness: 0.7,
                    remove_fillers: true,
                    preserve_formatting: false,
                    smart_punctuation: true,
                    auto_correct: true,
                },
                timestamp: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
            };

            let result = processor.process_text(request).await
                .map_err(|e| AppError::TextProcessing(e.to_string().into()))?;
            
            // Send processed result to frontend
            let _ = window.emit("voice-response", result.processed_text.clone());
            
            Ok(result)
        } else {
            // Fallback if text processor not initialized
            let fallback_result = ProcessingResult {
                id: Uuid::new_v4().to_string(),
                original_text: validated_transcript.clone(),
                processed_text: validated_transcript,
                changes_made: Vec::new(),
                confidence_score: 1.0,
                processing_time_ms: 0,
                context_used: ProcessingContext::Email,
                tone_applied: ToneType::Professional,
                metadata: integrations::ai_text_processor::ProcessingMetadata {
                    readability_before: 0.0,
                    readability_after: 0.0,
                    word_count_before: 0,
                    word_count_after: 0,
                    sentences_processed: 0,
                    errors_corrected: 0,
                    filler_words_removed: 0,
                },
            };
            
            let _ = window.emit("voice-response", fallback_result.processed_text.clone());
            Ok(fallback_result)
        }
    }).await
}

// AI ML API Commands with Error Handling and Validation
#[tauri::command]
async fn initialize_ai_ml_api(
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    let registry = get_error_boundary_registry();
    let boundary = registry.get("ai_ml_api").await
        .unwrap_or_else(|| Arc::new(ErrorBoundary::new("ai_ml_api".to_string(), None)));

    with_error_boundary!(boundary, async {
        let mut ai_ml_gateway_state = state.ai_ml_gateway.lock().await;
        
        // Check if already initialized
        if ai_ml_gateway_state.is_some() {
            return Err(AppError::Custom("AI ML API Gateway already initialized".to_string()));
        }

        let settings = state.settings.lock().await;
        let config = AIMLGatewayConfig {
            api_key: settings.ai_ml_settings.api_key.clone(),
            base_url: settings.ai_ml_settings.base_url.clone(),
            timeout_seconds: settings.ai_ml_settings.timeout_seconds,
            max_retries: settings.ai_ml_settings.max_retries,
            retry_delay_ms: 1000,
            enable_fallback: settings.ai_ml_settings.enable_fallback,
            cache_results: settings.ai_ml_settings.cache_results,
            max_cache_size: 1000,
            default_model: settings.ai_ml_settings.default_model.clone(),
            text_model: settings.ai_ml_settings.text_model.clone(),
            voice_model: settings.ai_ml_settings.voice_model.clone(),
            translation_model: settings.ai_ml_settings.translation_model.clone(),
            context_model: settings.ai_ml_settings.context_model.clone(),
        };

        let gateway = AIMLAPIGateway::new(config)
            .await
            .map_err(|e| AppError::Custom(format!("Failed to initialize AI ML API: {}", e)))?;
        
        gateway.initialize()
            .await
            .map_err(|e| AppError::Custom(format!("Failed to initialize AI ML services: {}", e)))?;

        *ai_ml_gateway_state = Some(gateway);
        
        tracing::info!("AI ML API Gateway initialized successfully");
        Ok(())
    }).await
}

#[tauri::command]
async fn process_enhanced_text(
    text: String,
    operations: Vec<TextOperation>,
    source_language: Option<String>,
    target_language: Option<String>,
    context: EnhancedContext,
    options: EnhancedProcessingOptions,
    state: State<'_, AppState>,
) -> Result<AIMLResponse<EnhancedTextResult>, AppError> {
    // Validate and sanitize input
    let validated_text = validate_text(&text, Some(1), Some(10000))
        .map_err(|e| AppError::Validation(e.to_string().into()))?;

    let registry = get_error_boundary_registry();
    let boundary = registry.get("ai_ml_api").await
        .unwrap_or_else(|| Arc::new(ErrorBoundary::new("ai_ml_api".to_string(), None)));

    with_error_boundary!(boundary, async {
        let ai_ml_gateway_state = state.ai_ml_gateway.lock().await;
        
        if let Some(ref gateway) = *ai_ml_gateway_state {
            let request = EnhancedTextRequest {
                id: Uuid::new_v4().to_string(),
                text: validated_text,
                operations,
                source_language,
                target_language,
                context,
                options,
                timestamp: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
            };

            let result = gateway.process_enhanced_text(request).await
                .map_err(|e| AppError::Custom(format!("Enhanced text processing failed: {}", e)))?;
            
            Ok(result)
        } else {
            Err(AppError::Custom("AI ML API Gateway not initialized".to_string()))
        }
    }).await
}

#[tauri::command]
async fn generate_enhanced_voice(
    text: String,
    voice_config: VoiceConfiguration,
    language: String,
    emotion: Option<String>,
    speed: Option<f32>,
    pitch: Option<f32>,
    output_format: VoiceOutputFormat,
    post_processing: Vec<VoicePostProcessing>,
    state: State<'_, AppState>,
) -> Result<VoiceResult, AppError> {
    // Validate input
    let validated_text = validate_text(&text, Some(1), Some(5000))
        .map_err(|e| AppError::Validation(e.to_string().into()))?;

    let registry = get_error_boundary_registry();
    let boundary = registry.get("ai_ml_api").await
        .unwrap_or_else(|| Arc::new(ErrorBoundary::new("ai_ml_api".to_string(), None)));

    with_error_boundary!(boundary, async {
        let ai_ml_gateway_state = state.ai_ml_gateway.lock().await;
        
        if let Some(ref gateway) = *ai_ml_gateway_state {
            let request = EnhancedVoiceRequest {
                id: Uuid::new_v4().to_string(),
                text: validated_text,
                voice_config,
                language,
                emotion,
                speed,
                pitch,
                output_format,
                post_processing,
            };

            let result = gateway.generate_enhanced_voice(request).await
                .map_err(|e| AppError::Custom(format!("Voice generation failed: {}", e)))?;
            
            Ok(result)
        } else {
            Err(AppError::Custom("AI ML API Gateway not initialized".to_string()))
        }
    }).await
}

#[tauri::command]
async fn translate_with_enhancement(
    text: String,
    from: Option<String>,
    to: String,
    state: State<'_, AppState>,
) -> Result<TranslationResult, AppError> {
    // Validate input
    let validated_text = validate_text(&text, Some(1), Some(8000))
        .map_err(|e| AppError::Validation(e.to_string().into()))?;

    let registry = get_error_boundary_registry();
    let boundary = registry.get("ai_ml_api").await
        .unwrap_or_else(|| Arc::new(ErrorBoundary::new("ai_ml_api".to_string(), None)));

    with_error_boundary!(boundary, async {
        let ai_ml_gateway_state = state.ai_ml_gateway.lock().await;
        
        if let Some(ref gateway) = *ai_ml_gateway_state {
            let result = gateway.translate_with_enhancement(validated_text, from, to).await
                .map_err(|e| AppError::Custom(format!("Translation failed: {}", e)))?;
            
            Ok(result)
        } else {
            Err(AppError::Custom("AI ML API Gateway not initialized".to_string()))
        }
    }).await
}

#[tauri::command]
async fn process_context_aware(
    text: String,
    context: EnhancedContext,
    requires_understanding: bool,
    include_sentiment: bool,
    include_intent: bool,
    memory_retention: bool,
    state: State<'_, AppState>,
) -> Result<ContextAwareResult, AppError> {
    // Validate input
    let validated_text = validate_text(&text, Some(1), Some(6000))
        .map_err(|e| AppError::Validation(e.to_string().into()))?;

    let registry = get_error_boundary_registry();
    let boundary = registry.get("ai_ml_api").await
        .unwrap_or_else(|| Arc::new(ErrorBoundary::new("ai_ml_api".to_string(), None)));

    with_error_boundary!(boundary, async {
        let ai_ml_gateway_state = state.ai_ml_gateway.lock().await;
        
        if let Some(ref gateway) = *ai_ml_gateway_state {
            let request = ContextAwareRequest {
                id: Uuid::new_v4().to_string(),
                text: validated_text,
                context,
                requires_understanding,
                include_sentiment,
                include_intent,
                memory_retention,
            };

            let result = gateway.process_context_aware(request).await
                .map_err(|e| AppError::Custom(format!("Context processing failed: {}", e)))?;
            
            Ok(result)
        } else {
            Err(AppError::Custom("AI ML API Gateway not initialized".to_string()))
        }
    }).await
}

#[tauri::command]
async fn get_ai_ml_health_status(
    state: State<'_, AppState>,
) -> Result<HealthStatus, AppError> {
    let ai_ml_gateway_state = state.ai_ml_gateway.lock().await;
    
    if let Some(ref gateway) = *ai_ml_gateway_state {
        let health_status = gateway.check_health().await
            .map_err(|e| AppError::Custom(format!("Health check failed: {}", e)))?;
        
        Ok(health_status)
    } else {
        Err(AppError::Custom("AI ML API Gateway not initialized".to_string()))
    }
}

// Tauri Commands for text processing
#[tauri::command]
async fn initialize_text_processor(
    state: State<'_, AppState>,
) -> Result<(), String> {
    let mut text_processor_state = state.text_processor.lock().await;
    
    let config = get_default_config_for_context(ProcessingContext::Email);
    let (event_sender, _event_receiver) = mpsc::unbounded_channel();
    
    let processor = AITextProcessor::new(config, event_sender);
    *text_processor_state = Some(processor);

    Ok(())
}

#[tauri::command]
async fn process_text(
    text: String,
    context: String,
    tone: String,
    state: State<'_, AppState>,
) -> Result<ProcessingResult, AppError> {
    // Validate and sanitize all inputs
    let validated_text = validate_text(&text, Some(1), Some(50000))
        .map_err(|e| AppError::Validation(e.to_string().into()))?;
    
    let validated_context = validate_config_value(&context, "context")
        .map_err(|e| AppError::Validation(e.to_string().into()))?;
    
    let validated_tone = validate_config_value(&tone, "tone")
        .map_err(|e| AppError::Validation(e.to_string().into()))?;

    let registry = get_error_boundary_registry();
    let boundary = registry.get("text_processor").await
        .unwrap_or_else(|| Arc::new(ErrorBoundary::new("text_processor".to_string(), None)));

    with_error_boundary!(boundary, async {
        let text_processor_state = state.text_processor.lock().await;
        
        if let Some(ref processor) = *text_processor_state {
            let processing_context = match validated_context.as_str() {
                "email" => ProcessingContext::Email,
                "code" => ProcessingContext::Code,
                "document" => ProcessingContext::Document,
                "social" => ProcessingContext::Social,
                "formal" => ProcessingContext::Formal,
                "casual" => ProcessingContext::Casual,
                "technical" => ProcessingContext::Technical,
                "creative" => ProcessingContext::Creative,
                _ => ProcessingContext::Email,
            };

            let tone_type = match validated_tone.as_str() {
                "professional" => ToneType::Professional,
                "friendly" => ToneType::Friendly,
                "formal" => ToneType::Formal,
                "casual" => ToneType::Casual,
                "empathetic" => ToneType::Empathetic,
                "confident" => ToneType::Confident,
                "persuasive" => ToneType::Persuasive,
                "neutral" => ToneType::Neutral,
                _ => ToneType::Professional,
            };

            let request = ProcessingRequest {
                id: Uuid::new_v4().to_string(),
                text: validated_text,
                context: processing_context,
                tone: tone_type,
                options: ProcessingOptions {
                    aggressiveness: 0.7,
                    remove_fillers: true,
                    preserve_formatting: false,
                    smart_punctuation: true,
                    auto_correct: true,
                },
                timestamp: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
            };

            let result = processor.process_text(request).await
                .map_err(|e| AppError::TextProcessing(e.to_string().into()))?;
            Ok(result)
        } else {
            Err(AppError::TextProcessing(TextProcessingError::NotInitialized))
        }
    }).await
}

#[tauri::command]
async fn get_supported_languages_tauri() -> Result<Vec<Language>, String> {
    Ok(get_supported_languages())
}

#[tauri::command]
async fn is_language_supported_tauri(language_code: String) -> Result<bool, AppError> {
    // Validate language code input
    let validated_code = validate_language_code(&language_code)
        .map_err(|e| AppError::Validation(e.to_string().into()))?;
    
    Ok(is_language_supported(&validated_code))
}

// Original Tauri commands (updated)
#[tauri::command]
async fn get_settings(state: State<'_, AppState>) -> Result<Settings, AppError> {
    let settings = state.settings.lock().await;
    Ok(settings.clone())
}

#[tauri::command]
async fn update_settings(new_settings: Settings, state: State<'_, AppState>) -> Result<(), AppError> {
    // Validate settings inputs
    let validated_language = validate_language_code(&new_settings.language)
        .map_err(|e| AppError::Validation(e.to_string().into()))?;
    
    let validated_hotkey = validate_hotkey(&new_settings.hotkey)
        .map_err(|e| AppError::Validation(e.to_string().into()))?;
    
    let validated_theme = validate_config_value(&new_settings.theme, "theme")
        .map_err(|e| AppError::Validation(e.to_string().into()))?;

    let mut settings = state.settings.lock().await;
    
    // Update with validated values
    let mut validated_settings = new_settings;
    validated_settings.language = validated_language;
    validated_settings.hotkey = validated_hotkey;
    validated_settings.theme = validated_theme;
    
    *settings = validated_settings;
    Ok(())
}

#[tauri::command]
async fn get_voice_status(state: State<'_, AppState>) -> Result<HashMap<String, serde_json::Value>, String> {
    let voice_engine_state = state.voice_engine.lock().await;
    
    let mut status = HashMap::new();
    if let Some(ref engine) = *voice_engine_state {
        let engine_status = engine.get_status();
        status.insert("is_listening".to_string(), serde_json::Value::Bool(engine_status.is_listening));
        status.insert("engine_type".to_string(), serde_json::Value::String(engine_status.engine_type));
        status.insert("session_id".to_string(), serde_json::Value::String(engine_status.session_id));
        status.insert("language".to_string(), serde_json::Value::String(engine_status.config.language));
    } else {
        status.insert("is_listening".to_string(), serde_json::Value::Bool(false));
        status.insert("engine_type".to_string(), serde_json::Value::String("none".to_string()));
    }
    
    Ok(status)
}

#[tauri::command]
async fn register_global_shortcut(shortcut: String, action: String, state: State<'_, AppState>) -> Result<(), String> {
    let mut shortcuts = state.shortcuts.lock().await;
    shortcuts.insert(shortcut, action);
    Ok(())
}

#[tauri::command]
async fn get_app_info() -> Result<HashMap<String, String>, String> {
    let mut info = HashMap::new();
    info.insert("name".to_string(), "VoiceFlow Pro".to_string());
    info.insert("version".to_string(), "1.0.0".to_string());
    info.insert("platform".to_string(), std::env::consts::OS.to_string());
    info.insert("description".to_string(), "Advanced cross-platform voice productivity assistant".to_string());
    Ok(info)
}

// Event handling functions with proper error handling
async fn handle_voice_events(
    voice_engine_state: Arc<Mutex<Option<VoiceRecognitionEngine>>>,
    window: Window,
) -> Result<(), AppError> {
    let registry = get_error_boundary_registry();
    let boundary = registry.get("voice_events").await
        .unwrap_or_else(|| Arc::new(ErrorBoundary::new("voice_events".to_string(), None)));

    with_error_boundary!(boundary, async {
        let mut interval = tokio::time::interval(tokio::time::Duration::from_millis(100));
        let mut event_counter = 0u64;
        
        loop {
            interval.tick().await;
            event_counter = event_counter.wrapping_add(1);
            
            // Simulate voice events with error handling
            if let Err(e) = window.emit("audio-metrics", serde_json::json!({
                "volume": 0.5 + (event_counter % 10) as f32 * 0.01,
                "signal_to_noise_ratio": 0.8,
                "clipping": false,
                "latency": 150 + (event_counter % 100) as u64,
                "timestamp": std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
            })) {
                tracing::warn!("Failed to emit audio metrics: {}", e);
                // Continue processing - emit failures shouldn't stop the loop
            }
        }
        
        // This will never be reached due to the infinite loop, but satisfies the compiler
        Ok(())
    }).await
}

fn create_menu() -> Menu {
    let macos = std::env::consts::OS == "macos";
    
    let app_menu = if macos {
        Submenu::new(
            &"VoiceFlow Pro",
            Menu::new()
                .add_native_item(MenuItem::About("VoiceFlow Pro".to_string()))
                .add_native_item(MenuItem::Separator)
                .add_native_item(MenuItem::Services)
                .add_native_item(MenuItem::Separator)
                .add_native_item(MenuItem::Hide)
                .add_native_item(MenuItem::HideOthers)
                .add_native_item(MenuItem::ShowAll)
                .add_native_item(MenuItem::Separator)
                .add_native_item(MenuItem::Quit),
        )
    } else {
        Submenu::new(
            "File",
            Menu::new()
                .add_native_item(MenuItem::Separator)
                .add_native_item(MenuItem::Quit),
        )
    };

    let voice_menu = Submenu::new(
        "Voice",
        Menu::new()
            .add_native_item(MenuItem::Separator)
            .add_item(CustomMenuItem::new("start_listening", "Start Listening"))
            .add_item(CustomMenuItem::new("stop_listening", "Stop Listening")),
    );

    let view_menu = Submenu::new(
        "View",
        Menu::new()
            .add_native_item(MenuItem::EnterFullScreen)
            .add_native_item(MenuItem::Separator)
            .add_native_item(MenuItem::Reload),
    );

    let window_menu = Submenu::new(
        "Window",
        Menu::new()
            .add_native_item(MenuItem::Minimize)
            .add_native_item(MenuItem::Zoom),
    );

    let help_menu = Submenu::new(
        "Help",
        Menu::new()
            .add_native_item(MenuItem::About("VoiceFlow Pro".to_string())),
    );

    Menu::new()
        .add_submenu(app_menu)
        .add_submenu(voice_menu)
        .add_submenu(view_menu)
        .add_submenu(window_menu)
        .add_submenu(help_menu)
}

fn create_system_tray() -> SystemTray {
    let tray_menu = SystemTrayMenu::new()
        .add_item(CustomMenuItem::new("show", "Show Window"))
        .add_item(CustomMenuItem::new("hide", "Hide Window"))
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(CustomMenuItem::new("start_listening", "🎤 Start Listening"))
        .add_item(CustomMenuItem::new("stop_listening", "⏹️ Stop Listening"))
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(CustomMenuItem::new("settings", "⚙️ Settings"))
        .add_item(CustomMenuItem::new("quit", "🚪 Quit"));

    SystemTray::new().with_menu(tray_menu)
}

fn handle_system_tray_event(event: SystemTrayEvent, app: &AppHandle) {
    match event {
        SystemTrayEvent::LeftClick { .. } => {
            if let Some(window) = app.get_window("main") {
                if window.is_visible().unwrap_or(false) {
                    let _ = window.hide();
                } else {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        }
        SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
            "show" => {
                if let Some(window) = app.get_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "hide" => {
                if let Some(window) = app.get_window("main") {
                    let _ = window.hide();
                }
            }
            "start_listening" => {
                if let Some(window) = app.get_window("main") {
                    let _ = window.emit("tray-action", "start_listening");
                }
            }
            "stop_listening" => {
                if let Some(window) = app.get_window("main") {
                    let _ = window.emit("tray-action", "stop_listening");
                }
            }
            "settings" => {
                if let Some(window) = app.get_window("main") {
                    let _ = window.emit("tray-action", "settings");
                }
            }
            "quit" => {
                std::process::exit(0);
            }
            _ => {}
        },
        _ => {}
    }
}

fn handle_window_event(event: WindowEvent, app: &AppHandle) {
    match event {
        WindowEvent::CloseRequested { api, .. } => {
            if let Some(window) = app.get_window("main") {
                let _ = window.hide();
                api.prevent_close();
            }
        }
        _ => {}
    }
}

#[tokio::main]
async fn main() {
    // Initialize global components
    let resource_manager = get_resource_manager().clone();
    let error_registry = get_error_boundary_registry().clone();

    // Initialize error boundaries for all components
    error_registry.register("voice_recognition".to_string(), 
        Arc::new(ErrorBoundary::new("voice_recognition".to_string(), None))).await;
    error_registry.register("text_processor".to_string(), 
        Arc::new(ErrorBoundary::new("text_processor".to_string(), None))).await;
    error_registry.register("ai_ml_api".to_string(), 
        Arc::new(ErrorBoundary::new("ai_ml_api".to_string(), None))).await;
    error_registry.register("voice_events".to_string(), 
        Arc::new(ErrorBoundary::new("voice_events".to_string(), None))).await;

    // Start background tasks for memory management and error monitoring
    tokio::spawn(start_cleanup_task());
    tokio::spawn(start_error_monitoring_task());

    tracing::info!("VoiceFlow Pro backend initialized with security features");

    tauri::Builder::default()
        .menu(create_menu())
        .system_tray(create_system_tray())
        .on_system_tray_event(handle_system_tray_event)
        .on_window_event(handle_window_event)
        .manage(AppState {
            voice_engine: Arc::new(Mutex::new(None)),
            text_processor: Arc::new(Mutex::new(None)),
            ai_ml_gateway: Arc::new(Mutex::new(None)),
            settings: Arc::new(Mutex::new(Settings::default())),
            shortcuts: Arc::new(Mutex::new(HashMap::new())),
            event_handlers: Arc::new(Mutex::new(Vec::new())),
            resource_manager: resource_manager.clone(),
            error_boundaries: error_registry.clone(),
        })
        .invoke_handler(tauri::generate_handler![
            // Voice recognition commands
            initialize_voice_recognition,
            start_voice_listening,
            stop_voice_listening,
            
            // Text processing commands
            initialize_text_processor,
            process_text,
            process_speech_with_ai,
            
            // AI ML API commands
            initialize_ai_ml_api,
            process_enhanced_text,
            generate_enhanced_voice,
            translate_with_enhancement,
            process_context_aware,
            get_ai_ml_health_status,
            
            // Language commands
            get_supported_languages_tauri,
            is_language_supported_tauri,
            
            // Original commands
            get_settings,
            update_settings,
            get_voice_status,
            register_global_shortcut,
            get_app_info
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}