// AI/ML API Integration Layer for VoiceFlow Pro
// Provides unified access to multiple AI services via aimlapi.com

use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use uuid::Uuid;
use reqwest::Client as HttpClient;
use tokio::time::{timeout, Duration};

// Re-export AI service types for easy access
pub use ai_ml_core::{AIMLClient, AIMLConfig, AIMLError, AIMLService};
pub use text_enhancement::{TextEnhancer, EnhancementRequest, EnhancementResult, TextEnhancementService};
pub use voice_generation::{VoiceGenerator, VoiceRequest, VoiceResult, VoiceGenerationService};
pub use translation_service::{Translator, TranslationRequest, TranslationResult, TranslationService};
pub use context_processor::{ContextProcessor, ContextAwareRequest, ContextAwareResult, ContextProcessingService};

// Core AI ML API module
mod ai_ml_core;
mod text_enhancement;
mod voice_generation;
mod translation_service;
mod context_processor;

/// AI ML API Gateway - Main entry point for all AI services
#[derive(Debug)]
pub struct AIMLAPIGateway {
    client: Arc<Mutex<AIMLClient>>,
    text_enhancer: Arc<Mutex<TextEnhancer>>,
    voice_generator: Arc<Mutex<VoiceGenerator>>,
    translator: Arc<Mutex<Translator>>,
    context_processor: Arc<Mutex<ContextProcessor>>,
    config: AIMLGatewayConfig,
    health_status: Arc<Mutex<HealthStatus>>,
}

/// Configuration for AI ML API Gateway
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIMLGatewayConfig {
    pub api_key: String,
    pub base_url: String,
    pub timeout_seconds: u64,
    pub max_retries: u32,
    pub retry_delay_ms: u64,
    pub enable_fallback: bool,
    pub cache_results: bool,
    pub max_cache_size: usize,
    pub default_model: String,
    pub text_model: String,
    pub voice_model: String,
    pub translation_model: String,
    pub context_model: String,
}

/// Health status monitoring for AI services
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthStatus {
    pub overall_healthy: bool,
    pub last_check: u64,
    pub text_enhancement_healthy: bool,
    pub voice_generation_healthy: bool,
    pub translation_healthy: bool,
    pub context_processing_healthy: bool,
    pub response_times: HashMap<String, u64>,
    pub error_counts: HashMap<String, u32>,
}

/// Unified API response for all AI operations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AIMLResponse<T> {
    Success(T),
    Failure(String),
    Partial(T, Vec<String>),
    Cached(T),
}

/// Enhanced text processing request combining multiple AI capabilities
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnhancedTextRequest {
    pub id: String,
    pub text: String,
    pub operations: Vec<TextOperation>,
    pub source_language: Option<String>,
    pub target_language: Option<String>,
    pub context: EnhancedContext,
    pub options: EnhancedProcessingOptions,
    pub timestamp: u64,
}

/// Available text operations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TextOperation {
    Enhance,
    Translate,
    Summarize,
    Analyze,
    Rewrite,
    ToneAdjust(String),
    GrammarCheck,
    StyleImprove,
}

/// Enhanced context for AI processing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnhancedContext {
    pub user_intent: Option<String>,
    pub domain: Option<String>,
    pub audience: Option<String>,
    pub purpose: Option<String>,
    pub constraints: Vec<String>,
    pub previous_messages: Vec<String>,
    pub conversation_history: Vec<String>,
}

/// Enhanced processing options
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnhancedProcessingOptions {
    pub include_confidence_scores: bool,
    pub include_suggestions: bool,
    pub preserve_formatting: bool,
    pub generate_alternatives: bool,
    pub number_of_alternatives: u8,
    pub apply_multilingual_optimization: bool,
    pub enable_real_time_processing: bool,
}

/// Comprehensive result from AI processing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnhancedTextResult {
    pub id: String,
    pub original_text: String,
    pub processed_text: String,
    pub applied_operations: Vec<TextOperationResult>,
    pub translation: Option<TranslationResult>,
    pub confidence_scores: HashMap<String, f32>,
    pub processing_time_ms: u64,
    pub alternative_versions: Vec<String>,
    pub suggestions: Vec<String>,
    pub metadata: EnhancedMetadata,
}

/// Result of individual text operations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TextOperationResult {
    pub operation: TextOperation,
    pub success: bool,
    pub result: String,
    pub confidence: f32,
    pub processing_time_ms: u64,
    pub errors: Vec<String>,
}

/// Enhanced metadata for AI processing results
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnhancedMetadata {
    pub model_used: String,
    pub tokens_consumed: u32,
    pub cache_hit: bool,
    pub error_count: u32,
    pub service_health: HealthStatus,
    pub processing_pipeline: Vec<String>,
}

/// Voice generation with enhanced AI capabilities
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnhancedVoiceRequest {
    pub id: String,
    pub text: String,
    pub voice_config: VoiceConfiguration,
    pub language: String,
    pub emotion: Option<String>,
    pub speed: Option<f32>,
    pub pitch: Option<f32>,
    pub output_format: VoiceOutputFormat,
    pub post_processing: Vec<VoicePostProcessing>,
}

/// Voice configuration for AI synthesis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VoiceConfiguration {
    pub model: String,
    pub voice_id: Option<String>,
    pub language_code: String,
    pub use_neural_voices: bool,
    pub apply_ssml: bool,
    pub enable_emotion: bool,
    pub quality_level: VoiceQuality,
}

/// Voice output formats
#[derive(Debug, Clone, Serialize, Deserialize)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum VoiceOutputFormat {
    MP3 { bitrate: Option<u16> },
    WAV { sample_rate: Option<u32> },
    OGG { quality: Option<u8> },
    FLAC { compression_level: Option<u8> },
}

/// Voice quality levels
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum VoiceQuality {
    Low,
    Medium,
    High,
    Ultra,
}

/// Voice post-processing options
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum VoicePostProcessing {
    NoiseReduction,
    AudioNormalization,
    EchoRemoval,
    DynamicRangeCompression,
    SpeedAdjustment(f32),
    PitchAdjustment(f32),
    VolumeNormalization,
}

impl AIMLAPIGateway {
    /// Create a new AI ML API Gateway
    pub async fn new(config: AIMLGatewayConfig) -> Result<Self, AIMLError> {
        let http_client = HttpClient::builder()
            .timeout(Duration::from_secs(config.timeout_seconds))
            .build()
            .map_err(AIMLError::HttpClientError)?;

        let client = Arc::new(Mutex::new(AIMLClient::new(
            config.api_key.clone(),
            config.base_url.clone(),
            http_client,
        )));

        let text_enhancer = Arc::new(Mutex::new(TextEnhancer::new(client.clone(), config.text_model.clone())));
        let voice_generator = Arc::new(Mutex::new(VoiceGenerator::new(client.clone(), config.voice_model.clone())));
        let translator = Arc::new(Mutex::new(Translator::new(client.clone(), config.translation_model.clone())));
        let context_processor = Arc::new(Mutex::new(ContextProcessor::new(client.clone(), config.context_model.clone())));

        Ok(Self {
            client,
            text_enhancer,
            voice_generator,
            translator,
            context_processor,
            config: config.clone(),
            health_status: Arc::new(Mutex::new(HealthStatus {
                overall_healthy: false,
                last_check: 0,
                text_enhancement_healthy: false,
                voice_generation_healthy: false,
                translation_healthy: false,
                context_processing_healthy: false,
                response_times: HashMap::new(),
                error_counts: HashMap::new(),
            })),
        })
    }

    /// Initialize all AI services
    pub async fn initialize(&self) -> Result<(), AIMLError> {
        let start_time = std::time::Instant::now();

        // Initialize core client
        {
            let client = self.client.lock().await;
            client.initialize().await.map_err(AIMLError::from)?;
        }

        // Initialize individual services
        let mut all_healthy = true;

        // Test text enhancement
        {
            let enhancer = self.text_enhancer.lock().await;
            if let Err(e) = enhancer.health_check().await {
                log::warn!("Text enhancement service health check failed: {:?}", e);
                all_healthy = false;
            }
        }

        // Test voice generation
        {
            let generator = self.voice_generator.lock().await;
            if let Err(e) = generator.health_check().await {
                log::warn!("Voice generation service health check failed: {:?}", e);
                all_healthy = false;
            }
        }

        // Test translation
        {
            let translator = self.translator.lock().await;
            if let Err(e) = translator.health_check().await {
                log::warn!("Translation service health check failed: {:?}", e);
                all_healthy = false;
            }
        }

        // Test context processing
        {
            let processor = self.context_processor.lock().await;
            if let Err(e) = processor.health_check().await {
                log::warn!("Context processing service health check failed: {:?}", e);
                all_healthy = false;
            }
        }

        // Update health status
        {
            let mut status = self.health_status.lock().await;
            status.overall_healthy = all_healthy;
            status.last_check = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs();
        }

        log::info!("AI ML API Gateway initialized in {:?}", start_time.elapsed());
        Ok(())
    }

    /// Process enhanced text with multiple AI operations
    pub async fn process_enhanced_text(&self, request: EnhancedTextRequest) -> AIMLResponse<EnhancedTextResult> {
        let start_time = std::time::Instant::now();
        let request_id = request.id.clone();
        
        log::info!("Processing enhanced text request: {}", request_id);

        // Collect results and errors
        let mut applied_operations = Vec::new();
        let mut alternative_versions = Vec::new();
        let mut suggestions = Vec::new();
        let mut confidence_scores = HashMap::new();
        let mut errors = Vec::new();
        let mut translation_result = None;

        // Process each requested operation
        for operation in &request.operations {
            let operation_start = std::time::Instant::now();
            
            match self.execute_operation(operation.clone(), &request).await {
                Ok(result) => {
                    applied_operations.push(result.clone());
                    confidence_scores.insert(format!("{:?}", operation), result.confidence);
                    
                    // Store alternative versions if requested
                    if request.options.generate_alternatives {
                        alternative_versions.push(result.result.clone());
                    }
                }
                Err(e) => {
                    let error_msg = format!("Failed to execute {:?}: {}", operation, e);
                    log::error!("{}", error_msg);
                    errors.push(error_msg);
                }
            }

            let op_time = operation_start.elapsed().as_millis() as u64;
            log::debug!("Operation {:?} completed in {}ms", operation, op_time);
        }

        // Get context-aware insights if context is available
        if let Some(context) = self.get_context_for_request(&request).await {
            if let Ok(context_result) = self.process_context(context).await {
                suggestions.extend(context_result.suggestions);
                confidence_scores.insert("context".to_string(), context_result.confidence);
            }
        }

        // Determine success criteria
        let successful_operations = applied_operations.len();
        let total_operations = request.operations.len();
        let success_rate = successful_operations as f32 / total_operations as f32;

        // Build final result
        let processed_text = if successful_operations > 0 {
            // Use the result from the most important operation (usually enhancement)
            applied_operations
                .iter()
                .find(|op| op.operation == TextOperation::Enhance)
                .or(applied_operations.first())
                .map(|op| op.result.clone())
                .unwrap_or_else(|| request.text.clone())
        } else {
            request.text.clone()
        };

        let result = EnhancedTextResult {
            id: request_id,
            original_text: request.text,
            processed_text,
            applied_operations,
            translation: translation_result,
            confidence_scores,
            processing_time_ms: start_time.elapsed().as_millis() as u64,
            alternative_versions,
            suggestions,
            metadata: EnhancedMetadata {
                model_used: self.config.default_model.clone(),
                tokens_consumed: self.estimate_tokens(&processed_text),
                cache_hit: false, // TODO: Implement caching
                error_count: errors.len() as u32,
                service_health: self.health_status.lock().await.clone(),
                processing_pipeline: request.operations.iter().map(|op| format!("{:?}", op)).collect(),
            },
        };

        // Return appropriate response based on success rate
        if success_rate >= 0.8 {
            AIMLResponse::Success(result)
        } else if success_rate > 0.0 {
            AIMLResponse::Partial(result, errors)
        } else {
            AIMLResponse::Failure(format!("All operations failed. Errors: {:?}", errors))
        }
    }

    /// Generate enhanced voice synthesis
    pub async fn generate_enhanced_voice(&self, request: EnhancedVoiceRequest) -> Result<VoiceResult, AIMLError> {
        let generator = self.voice_generator.lock().await;
        generator.generate_voice(request).await
    }

    /// Translate text with AI enhancement
    pub async fn translate_with_enhancement(&self, text: String, from: Option<String>, to: String) -> Result<TranslationResult, AIMLError> {
        let translator = self.translator.lock().await;
        translator.translate_with_enhancement(text, from, to).await
    }

    /// Perform context-aware processing
    pub async fn process_context_aware(&self, request: ContextAwareRequest) -> Result<ContextAwareResult, AIMLError> {
        let processor = self.context_processor.lock().await;
        processor.process_with_context(request).await
    }

    /// Execute individual text operations
    async fn execute_operation(&self, operation: TextOperation, request: &EnhancedTextRequest) -> Result<TextOperationResult, AIMLError> {
        let start_time = std::time::Instant::now();

        match operation {
            TextOperation::Enhance => {
                let enhancer = self.text_enhancer.lock().await;
                let enhancement_req = EnhancementRequest {
                    id: Uuid::new_v4().to_string(),
                    text: request.text.clone(),
                    context: request.context.clone().into(),
                    tone: "professional".to_string(),
                    options: request.options.clone().into(),
                };
                
                let enhancement = enhancer.enhance_text(enhancement_req).await?;
                
                Ok(TextOperationResult {
                    operation: TextOperation::Enhance,
                    success: true,
                    result: enhancement.enhanced_text,
                    confidence: enhancement.confidence_score,
                    processing_time_ms: start_time.elapsed().as_millis() as u64,
                    errors: vec![],
                })
            }
            
            TextOperation::Translate => {
                if let Some(target_lang) = &request.target_language {
                    let translator = self.translator.lock().await;
                    let translation_req = TranslationRequest {
                        id: Uuid::new_v4().to_string(),
                        text: request.text.clone(),
                        source_language: request.source_language.clone(),
                        target_language: target_lang.clone(),
                        preserve_formatting: request.options.preserve_formatting,
                    };
                    
                    let translation = translator.translate(translation_req).await?;
                    
                    Ok(TextOperationResult {
                        operation: TextOperation::Translate,
                        success: true,
                        result: translation.translated_text,
                        confidence: translation.confidence,
                        processing_time_ms: start_time.elapsed().as_millis() as u64,
                        errors: vec![],
                    })
                } else {
                    Err(AIMLError::MissingParameter("target_language".to_string()))
                }
            }
            
            TextOperation::Summarize => {
                let enhancer = self.text_enhancer.lock().await;
                enhancer.summarize_text(request.text.clone()).await
                    .map(|summary| TextOperationResult {
                        operation: TextOperation::Summarize,
                        success: true,
                        result: summary.summary,
                        confidence: 0.85,
                        processing_time_ms: start_time.elapsed().as_millis() as u64,
                        errors: vec![],
                    })
            }
            
            TextOperation::Analyze => {
                let enhancer = self.text_enhancer.lock().await;
                enhancer.analyze_text(request.text.clone()).await
                    .map(|analysis| TextOperationResult {
                        operation: TextOperation::Analyze,
                        success: true,
                        result: serde_json::to_string(&analysis).unwrap_or_default(),
                        confidence: 0.90,
                        processing_time_ms: start_time.elapsed().as_millis() as u64,
                        errors: vec![],
                    })
            }
            
            TextOperation::Rewrite => {
                let enhancer = self.text_enhancer.lock().await;
                let rewrite_req = EnhancementRequest {
                    id: Uuid::new_v4().to_string(),
                    text: request.text.clone(),
                    context: request.context.clone().into(),
                    tone: "neutral".to_string(),
                    options: request.options.clone().into(),
                };
                
                enhancer.rewrite_text(rewrite_req).await
                    .map(|rewrite| TextOperationResult {
                        operation: TextOperation::Rewrite,
                        success: true,
                        result: rewrite.enhanced_text,
                        confidence: rewrite.confidence_score,
                        processing_time_ms: start_time.elapsed().as_millis() as u64,
                        errors: vec![],
                    })
            }
            
            TextOperation::ToneAdjust(ref tone) => {
                let enhancer = self.text_enhancer.lock().await;
                let tone_req = EnhancementRequest {
                    id: Uuid::new_v4().to_string(),
                    text: request.text.clone(),
                    context: request.context.clone().into(),
                    tone: tone.clone(),
                    options: request.options.clone().into(),
                };
                
                enhancer.adjust_tone(tone_req).await
                    .map(|tone_result| TextOperationResult {
                        operation: TextOperation::ToneAdjust(tone.clone()),
                        success: true,
                        result: tone_result.enhanced_text,
                        confidence: tone_result.confidence_score,
                        processing_time_ms: start_time.elapsed().as_millis() as u64,
                        errors: vec![],
                    })
            }
            
            TextOperation::GrammarCheck => {
                let enhancer = self.text_enhancer.lock().await;
                enhancer.check_grammar(request.text.clone()).await
                    .map(|check| TextOperationResult {
                        operation: TextOperation::GrammarCheck,
                        success: true,
                        result: check.corrected_text,
                        confidence: check.confidence_score,
                        processing_time_ms: start_time.elapsed().as_millis() as u64,
                        errors: vec![],
                    })
            }
            
            TextOperation::StyleImprove => {
                let enhancer = self.text_enhancer.lock().await;
                let style_req = EnhancementRequest {
                    id: Uuid::new_v4().to_string(),
                    text: request.text.clone(),
                    context: request.context.clone().into(),
                    tone: "professional".to_string(),
                    options: request.options.clone().into(),
                };
                
                enhancer.improve_style(style_req).await
                    .map(|style_result| TextOperationResult {
                        operation: TextOperation::StyleImprove,
                        success: true,
                        result: style_result.enhanced_text,
                        confidence: style_result.confidence_score,
                        processing_time_ms: start_time.elapsed().as_millis() as u64,
                        errors: vec![],
                    })
            }
        }
    }

    /// Get context for processing (placeholder for more sophisticated context management)
    async fn get_context_for_request(&self, request: &EnhancedTextRequest) -> Option<ContextAwareRequest> {
        if request.context.user_intent.is_some() || request.context.domain.is_some() {
            Some(ContextAwareRequest {
                id: request.id.clone(),
                text: request.text.clone(),
                context: request.context.clone(),
                requires_understanding: true,
                include_sentiment: true,
                include_intent: true,
            })
        } else {
            None
        }
    }

    /// Process context-aware requests
    async fn process_context(&self, context_request: ContextAwareRequest) -> Result<ContextAwareResult, AIMLError> {
        let processor = self.context_processor.lock().await;
        processor.process_with_context(context_request).await
    }

    /// Check health status of all AI services
    pub async fn check_health(&self) -> HealthStatus {
        let mut status = self.health_status.lock().await.clone();
        status.last_check = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        // Check each service
        let services = vec![
            ("text_enhancement", &self.text_enhancer),
            ("voice_generation", &self.voice_generator),
            ("translation", &self.translator),
            ("context_processing", &self.context_processor),
        ];

        for (service_name, service) in services {
            let health_start = std::time::Instant::now();
            
            let is_healthy = match service_name {
                "text_enhancement" => {
                    let enhancer = service.lock().await;
                    enhancer.health_check().await.is_ok()
                }
                "voice_generation" => {
                    let generator = service.lock().await;
                    generator.health_check().await.is_ok()
                }
                "translation" => {
                    let translator = service.lock().await;
                    translator.health_check().await.is_ok()
                }
                "context_processing" => {
                    let processor = service.lock().await;
                    processor.health_check().await.is_ok()
                }
                _ => false,
            };

            let response_time = health_start.elapsed().as_millis() as u64;
            status.response_times.insert(service_name.to_string(), response_time);
            
            match service_name {
                "text_enhancement" => status.text_enhancement_healthy = is_healthy,
                "voice_generation" => status.voice_generation_healthy = is_healthy,
                "translation" => status.translation_healthy = is_healthy,
                "context_processing" => status.context_processing_healthy = is_healthy,
                _ => {}
            }

            if !is_healthy {
                *status.error_counts.entry(service_name.to_string()).or_insert(0) += 1;
            }
        }

        status.overall_healthy = status.text_enhancement_healthy 
            && status.voice_generation_healthy 
            && status.translation_healthy 
            && status.context_processing_healthy;

        *self.health_status.lock().await = status.clone();
        status
    }

    /// Estimate token count for text (rough approximation)
    fn estimate_tokens(&self, text: &str) -> u32 {
        // Rough estimation: ~4 characters per token
        (text.len() / 4) as u32
    }

    /// Get current configuration
    pub fn get_config(&self) -> &AIMLGatewayConfig {
        &self.config
    }

    /// Update configuration
    pub async fn update_config(&mut self, new_config: AIMLGatewayConfig) {
        self.config = new_config;
    }
}

/// Create default configuration for AI ML API Gateway
pub fn create_default_config() -> AIMLGatewayConfig {
    AIMLGatewayConfig {
        api_key: std::env::var("AIML_API_KEY").unwrap_or_default(),
        base_url: "https://api.aimlapi.com".to_string(),
        timeout_seconds: 30,
        max_retries: 3,
        retry_delay_ms: 1000,
        enable_fallback: true,
        cache_results: true,
        max_cache_size: 1000,
        default_model: "gpt-4o".to_string(),
        text_model: "gpt-4o".to_string(),
        voice_model: "gpt-4o-mini-tts".to_string(),
        translation_model: "claude-3-5-haiku".to_string(),
        context_model: "gpt-5-pro".to_string(),
    }
}
