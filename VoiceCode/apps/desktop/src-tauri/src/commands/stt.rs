//! STT Commands - Tauri commands for native Speech-to-Text
//!
//! Exposes Deepgram and Whisper providers to the frontend,
//! replacing Web Speech API with native implementations.
//! API keys are stored securely in the backend.

use serde::{Deserialize, Serialize};
use tauri::command;
use std::sync::Arc;
use tokio::sync::RwLock;
use once_cell::sync::Lazy;

use crate::stt::{
    SttProviderManager, SttConfig, DeepgramProvider, WhisperProvider,
    AudioData, AudioFormat,
};
use crate::stt::deepgram::DeepgramConfig;
use crate::stt::whisper::WhisperConfig;

/// Global STT provider manager
static STT_MANAGER: Lazy<RwLock<Option<SttProviderManager>>> = Lazy::new(|| RwLock::new(None));

/// Secure API key storage (in-memory, loaded from encrypted storage)
static API_KEYS: Lazy<RwLock<ApiKeyStore>> = Lazy::new(|| RwLock::new(ApiKeyStore::default()));

#[derive(Debug, Clone, Default)]
struct ApiKeyStore {
    deepgram_key: Option<String>,
    openai_key: Option<String>,
}

/// STT Provider types
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum SttProviderType {
    Deepgram,
    Whisper,
    Local,
}

/// STT configuration for frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SttSettings {
    pub provider: SttProviderType,
    pub language: String,
    pub enable_streaming: bool,
    pub vocabulary_boost: Vec<String>,
    pub punctuate: bool,
    pub interim_results: bool,
}

impl Default for SttSettings {
    fn default() -> Self {
        Self {
            provider: SttProviderType::Deepgram,
            language: "en-US".to_string(),
            enable_streaming: true,
            vocabulary_boost: Vec::new(),
            punctuate: true,
            interim_results: true,
        }
    }
}

/// Transcription result for frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranscriptionResponse {
    pub success: bool,
    pub text: String,
    pub confidence: f32,
    pub words: Vec<WordInfo>,
    pub provider: String,
    pub latency_ms: u64,
    pub detected_language: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WordInfo {
    pub word: String,
    pub start_ms: u64,
    pub end_ms: u64,
    pub confidence: f32,
}

/// Provider status for frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderStatus {
    pub name: String,
    pub available: bool,
    pub has_api_key: bool,
    pub supports_streaming: bool,
    pub estimated_latency_ms: u64,
}

/// Initialize STT system with secure API keys
#[command]
pub async fn init_stt(
    deepgram_key: Option<String>,
    openai_key: Option<String>,
) -> Result<bool, String> {
    log::info!("Initializing native STT system");

    // Store API keys securely
    {
        let mut keys = API_KEYS.write().await;
        if let Some(key) = deepgram_key {
            keys.deepgram_key = Some(key);
        }
        if let Some(key) = openai_key {
            keys.openai_key = Some(key);
        }
    }

    // Initialize provider manager
    let post_processor = crate::stt::PostProcessor::new();
    let mut manager = SttProviderManager::new(post_processor);

    // Register Deepgram provider
    let keys = API_KEYS.read().await;
    if let Some(ref api_key) = keys.deepgram_key {
        let config = DeepgramConfig {
            api_key: api_key.clone(),
            ..DeepgramConfig::default()
        };
        let provider = Arc::new(DeepgramProvider::new(config));
        manager.register_provider(provider);
        log::info!("Registered Deepgram provider");
    }

    // Register Whisper provider
    if let Some(ref api_key) = keys.openai_key {
        let config = WhisperConfig {
            api_key: api_key.clone(),
            ..WhisperConfig::default()
        };
        let provider = Arc::new(WhisperProvider::new(config));
        manager.register_provider(provider);
        log::info!("Registered Whisper provider");
    }

    // Set default provider (prefer Deepgram for streaming)
    if keys.deepgram_key.is_some() {
        manager.set_active_provider("deepgram").await.ok();
    } else if keys.openai_key.is_some() {
        manager.set_active_provider("whisper").await.ok();
    }

    // Store manager
    let mut global_manager = STT_MANAGER.write().await;
    *global_manager = Some(manager);

    Ok(true)
}

/// Set API key securely (called from settings UI)
#[command]
pub async fn set_stt_api_key(
    provider: SttProviderType,
    api_key: String,
) -> Result<bool, String> {
    if api_key.is_empty() {
        return Err("API key cannot be empty".to_string());
    }

    // Validate key format
    if api_key.len() < 20 {
        return Err("API key appears invalid (too short)".to_string());
    }

    {
        let mut keys = API_KEYS.write().await;
        match provider {
            SttProviderType::Deepgram => {
                keys.deepgram_key = Some(api_key.clone());
            }
            SttProviderType::Whisper => {
                keys.openai_key = Some(api_key.clone());
            }
            SttProviderType::Local => {
                return Err("Local provider does not require API key".to_string());
            }
        }
    }

    // Re-initialize with new key
    let keys = API_KEYS.read().await;
    init_stt(keys.deepgram_key.clone(), keys.openai_key.clone()).await?;

    log::info!("Updated API key for {:?} provider", provider);
    Ok(true)
}

/// Get available STT providers and their status
#[command]
pub async fn get_native_stt_providers() -> Result<Vec<ProviderStatus>, String> {
    let keys = API_KEYS.read().await;
    let manager = STT_MANAGER.read().await;

    let mut providers = vec![
        ProviderStatus {
            name: "deepgram".to_string(),
            available: keys.deepgram_key.is_some(),
            has_api_key: keys.deepgram_key.is_some(),
            supports_streaming: true,
            estimated_latency_ms: 300,
        },
        ProviderStatus {
            name: "whisper".to_string(),
            available: keys.openai_key.is_some(),
            has_api_key: keys.openai_key.is_some(),
            supports_streaming: false,
            estimated_latency_ms: 1000,
        },
        ProviderStatus {
            name: "local".to_string(),
            available: false, // TODO: Check for local whisper.cpp
            has_api_key: true, // Not required
            supports_streaming: false,
            estimated_latency_ms: 500,
        },
    ];

    // Update availability based on actual provider checks
    if let Some(ref mgr) = *manager {
        for provider in &mut providers {
            if let Some(caps) = mgr.get_provider_capabilities(&provider.name) {
                provider.supports_streaming = caps.streaming;
                provider.estimated_latency_ms = caps.estimated_latency_ms;
            }
        }
    }

    Ok(providers)
}

/// Set the active STT provider
#[command]
pub async fn set_stt_provider(provider: SttProviderType) -> Result<bool, String> {
    let mut manager = STT_MANAGER.write().await;
    
    let mgr = manager.as_mut()
        .ok_or("STT system not initialized. Call init_stt first.")?;

    let provider_name = match provider {
        SttProviderType::Deepgram => "deepgram",
        SttProviderType::Whisper => "whisper",
        SttProviderType::Local => "whisper-local",
    };

    mgr.set_active_provider(provider_name).await
        .map_err(|e| format!("Failed to set provider: {}", e.message))?;

    log::info!("Active STT provider set to: {}", provider_name);
    Ok(true)
}

/// Transcribe audio bytes (for recorded audio)
#[command]
pub async fn transcribe_audio_bytes(
    audio_data: Vec<u8>,
    format: String,
    sample_rate: u32,
    language: Option<String>,
) -> Result<TranscriptionResponse, String> {
    let manager = STT_MANAGER.read().await;
    let mgr = manager.as_ref()
        .ok_or("STT system not initialized. Call init_stt first.")?;

    // Parse audio format
    let audio_format = match format.to_lowercase().as_str() {
        "wav" => AudioFormat::Wav,
        "mp3" => AudioFormat::Mp3,
        "flac" => AudioFormat::Flac,
        "webm" => AudioFormat::WebM,
        "ogg" => AudioFormat::Ogg,
        "pcm" | "raw" => AudioFormat::RawPcm16k,
        _ => return Err(format!("Unsupported audio format: {}", format)),
    };

    let audio = AudioData::new(audio_data, audio_format, sample_rate, 1);

    let config = SttConfig {
        language: language.unwrap_or_else(|| "en-US".to_string()),
        enable_post_processing: true,
        punctuate: true,
        interim_results: false,
        ..SttConfig::default()
    };

    let start = std::time::Instant::now();
    
    match mgr.transcribe(&audio, Some(&config)).await {
        Ok(result) => {
            let latency = start.elapsed().as_millis() as u64;
            Ok(TranscriptionResponse {
                success: true,
                text: result.text,
                confidence: result.confidence,
                words: result.words.into_iter().map(|w| WordInfo {
                    word: w.word,
                    start_ms: w.start_ms,
                    end_ms: w.end_ms,
                    confidence: w.confidence,
                }).collect(),
                provider: result.provider,
                latency_ms: latency,
                detected_language: result.detected_language,
                error: None,
            })
        }
        Err(e) => {
            log::error!("Transcription failed: {}", e);
            Ok(TranscriptionResponse {
                success: false,
                text: String::new(),
                confidence: 0.0,
                words: Vec::new(),
                provider: e.provider.unwrap_or_default(),
                latency_ms: 0,
                detected_language: None,
                error: Some(e.message),
            })
        }
    }
}

/// Transcribe audio file
#[command]
pub async fn transcribe_audio_file(
    file_path: String,
    language: Option<String>,
) -> Result<TranscriptionResponse, String> {
    log::info!("Transcribing audio file: {}", file_path);

    // Read file
    let audio_bytes = tokio::fs::read(&file_path).await
        .map_err(|e| format!("Failed to read audio file: {}", e))?;

    // Detect format from extension
    let format = std::path::Path::new(&file_path)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("wav")
        .to_string();

    // Default sample rate (will be overridden by actual audio header)
    let sample_rate = 16000;

    transcribe_audio_bytes(audio_bytes, format, sample_rate, language).await
}

/// Get current STT settings
#[command]
pub async fn get_stt_settings() -> Result<SttSettings, String> {
    let manager = STT_MANAGER.read().await;
    
    if let Some(ref mgr) = *manager {
        let active = mgr.get_active_provider().await;
        let provider = match active.as_str() {
            "deepgram" => SttProviderType::Deepgram,
            "whisper" => SttProviderType::Whisper,
            _ => SttProviderType::Local,
        };

        Ok(SttSettings {
            provider,
            language: "en-US".to_string(),
            enable_streaming: provider == SttProviderType::Deepgram,
            vocabulary_boost: Vec::new(),
            punctuate: true,
            interim_results: true,
        })
    } else {
        Ok(SttSettings::default())
    }
}

/// Update STT settings
#[command]
pub async fn update_stt_settings(settings: SttSettings) -> Result<bool, String> {
    // Set the active provider
    set_stt_provider(settings.provider).await?;

    // Update default config in manager
    let manager = STT_MANAGER.read().await;
    if let Some(ref mgr) = *manager {
        let config = SttConfig {
            language: settings.language,
            vocabulary_boost: settings.vocabulary_boost,
            enable_post_processing: true,
            punctuate: settings.punctuate,
            interim_results: settings.interim_results,
            ..SttConfig::default()
        };
        mgr.set_default_config(config).await;
    }

    Ok(true)
}

/// Check if API keys are configured (without exposing them)
#[command]
pub async fn check_stt_api_keys() -> Result<std::collections::HashMap<String, bool>, String> {
    let keys = API_KEYS.read().await;
    
    let mut result = std::collections::HashMap::new();
    result.insert("deepgram".to_string(), keys.deepgram_key.is_some());
    result.insert("openai".to_string(), keys.openai_key.is_some());
    
    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_stt_settings_default() {
        let settings = SttSettings::default();
        assert_eq!(settings.provider, SttProviderType::Deepgram);
        assert_eq!(settings.language, "en-US");
        assert!(settings.enable_streaming);
    }

    #[test]
    fn test_provider_type_serialization() {
        let provider = SttProviderType::Deepgram;
        let json = serde_json::to_string(&provider).unwrap();
        assert_eq!(json, "\"deepgram\"");
    }
}
