#![allow(dead_code, unused_variables, unused_imports)]
//! STT Provider Trait and Manager
//!
//! Defines the core abstraction for speech-to-text providers
//! and manages provider selection with fallback chain.

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use serde::{Deserialize, Serialize};
use async_trait::async_trait;

use crate::stt::post_processor::PostProcessor;

/// Audio data formats supported by STT providers
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum AudioFormat {
    /// WAV format (PCM)
    Wav,
    /// MP3 format
    Mp3,
    /// FLAC format (lossless)
    Flac,
    /// WebM format (Opus codec)
    WebM,
    /// OGG format (Vorbis/Opus codec)
    Ogg,
    /// Raw PCM (16-bit, 16kHz, mono)
    RawPcm16k,
}

impl AudioFormat {
    pub fn mime_type(&self) -> &'static str {
        match self {
            AudioFormat::Wav => "audio/wav",
            AudioFormat::Mp3 => "audio/mpeg",
            AudioFormat::Flac => "audio/flac",
            AudioFormat::WebM => "audio/webm",
            AudioFormat::Ogg => "audio/ogg",
            AudioFormat::RawPcm16k => "audio/pcm",
        }
    }

    pub fn extension(&self) -> &'static str {
        match self {
            AudioFormat::Wav => "wav",
            AudioFormat::Mp3 => "mp3",
            AudioFormat::Flac => "flac",
            AudioFormat::WebM => "webm",
            AudioFormat::Ogg => "ogg",
            AudioFormat::RawPcm16k => "pcm",
        }
    }
}

/// Audio data for transcription
#[derive(Debug, Clone)]
pub struct AudioData {
    /// Raw audio bytes
    pub bytes: Vec<u8>,
    /// Audio format
    pub format: AudioFormat,
    /// Sample rate in Hz (e.g., 16000, 44100)
    pub sample_rate: u32,
    /// Number of audio channels (1 = mono, 2 = stereo)
    pub channels: u8,
    /// Duration in milliseconds (if known)
    pub duration_ms: Option<u64>,
}

impl AudioData {
    pub fn new(bytes: Vec<u8>, format: AudioFormat, sample_rate: u32, channels: u8) -> Self {
        Self {
            bytes,
            format,
            sample_rate,
            channels,
            duration_ms: None,
        }
    }

    pub fn with_duration(mut self, duration_ms: u64) -> Self {
        self.duration_ms = Some(duration_ms);
        self
    }
}

/// Word-level timing information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WordTiming {
    /// The transcribed word
    pub word: String,
    /// Start time in milliseconds
    pub start_ms: u64,
    /// End time in milliseconds
    pub end_ms: u64,
    /// Confidence score (0.0 - 1.0)
    pub confidence: f32,
}

/// Detected file reference in transcription
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileReference {
    /// Original text that triggered detection (e.g., "at config.ts")
    pub original_text: String,
    /// Extracted file reference (e.g., "config.ts")
    pub file_ref: String,
    /// Resolved file path (if found)
    pub resolved_path: Option<String>,
    /// Position in transcript (start, end)
    pub position: (usize, usize),
    /// Detection confidence
    pub confidence: f32,
}

/// Transcription result from STT provider
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranscriptionResult {
    /// Unique ID for this transcription
    pub id: String,
    /// Final transcribed text
    pub text: String,
    /// Whether this is a final (vs interim) result
    pub is_final: bool,
    /// Overall confidence score (0.0 - 1.0)
    pub confidence: f32,
    /// Word-level timings (if available)
    pub words: Vec<WordTiming>,
    /// Detected file references
    pub file_references: Vec<FileReference>,
    /// Processing latency in milliseconds
    pub latency_ms: u64,
    /// Provider that generated this result
    pub provider: String,
    /// Original text before post-processing (if different)
    pub original_text: Option<String>,
    /// Corrections applied during post-processing
    pub corrections: Vec<CorrectionRecord>,
    /// Detected language (if auto-detected)
    pub detected_language: Option<String>,
}

/// Record of a correction applied during post-processing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CorrectionRecord {
    /// Original text
    pub from: String,
    /// Corrected text
    pub to: String,
    /// Position in text (start, end)
    pub position: (usize, usize),
    /// Type of correction
    pub correction_type: CorrectionType,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum CorrectionType {
    /// Vocabulary correction (e.g., "high torch" -> "PyTorch")
    Vocabulary,
    /// Technical term correction
    TechnicalTerm,
    /// Casing correction (e.g., "react" -> "React")
    Casing,
    /// Context-based correction
    Context,
}

/// STT configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SttConfig {
    /// Language code (e.g., "en-US")
    pub language: String,
    /// Vocabulary terms to boost recognition
    pub vocabulary_boost: Vec<String>,
    /// Enable post-processing pipeline
    pub enable_post_processing: bool,
    /// Maximum acceptable latency in milliseconds
    pub max_latency_ms: u64,
    /// Enable interim (partial) results
    pub interim_results: bool,
    /// Enable punctuation
    pub punctuate: bool,
    /// Enable profanity filter
    pub profanity_filter: bool,
    /// Custom model hint (provider-specific)
    pub model_hint: Option<String>,
    /// Number of alternative transcriptions to return
    pub alternatives: u8,
}

impl Default for SttConfig {
    fn default() -> Self {
        Self {
            language: "en-US".to_string(),
            vocabulary_boost: Vec::new(),
            enable_post_processing: true,
            max_latency_ms: 500,
            interim_results: true,
            punctuate: true,
            profanity_filter: false,
            model_hint: None,
            alternatives: 1,
        }
    }
}

/// Result type for STT operations
pub type SttResult<T> = Result<T, SttError>;

/// STT-specific errors
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SttError {
    pub code: SttErrorCode,
    pub message: String,
    pub provider: Option<String>,
    pub retryable: bool,
}

impl std::fmt::Display for SttError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}: {}", self.code, self.message)
    }
}

impl std::error::Error for SttError {}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum SttErrorCode {
    /// Network error (connection failed, timeout)
    Network,
    /// Authentication failed (invalid API key)
    Authentication,
    /// Rate limit exceeded
    RateLimit,
    /// Invalid audio format
    InvalidAudio,
    /// Language not supported
    UnsupportedLanguage,
    /// Provider not available
    ProviderUnavailable,
    /// Internal provider error
    ProviderError,
    /// Timeout waiting for result
    Timeout,
    /// Unknown error
    Unknown,
}

impl std::fmt::Display for SttErrorCode {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SttErrorCode::Network => write!(f, "NETWORK_ERROR"),
            SttErrorCode::Authentication => write!(f, "AUTH_ERROR"),
            SttErrorCode::RateLimit => write!(f, "RATE_LIMIT"),
            SttErrorCode::InvalidAudio => write!(f, "INVALID_AUDIO"),
            SttErrorCode::UnsupportedLanguage => write!(f, "UNSUPPORTED_LANGUAGE"),
            SttErrorCode::ProviderUnavailable => write!(f, "PROVIDER_UNAVAILABLE"),
            SttErrorCode::ProviderError => write!(f, "PROVIDER_ERROR"),
            SttErrorCode::Timeout => write!(f, "TIMEOUT"),
            SttErrorCode::Unknown => write!(f, "UNKNOWN"),
        }
    }
}

/// Supported languages with metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LanguageCode {
    pub code: String,
    pub name: String,
    pub native_name: String,
}

/// Provider capabilities
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderCapabilities {
    /// Supports real-time streaming
    pub streaming: bool,
    /// Supports word-level timestamps
    pub word_timestamps: bool,
    /// Supports speaker diarization
    pub diarization: bool,
    /// Supports custom vocabulary
    pub custom_vocabulary: bool,
    /// Maximum audio duration in seconds
    pub max_duration_seconds: u32,
    /// Supported audio formats
    pub supported_formats: Vec<AudioFormat>,
    /// Estimated latency (best-case) in milliseconds
    pub estimated_latency_ms: u64,
    /// Cost per minute in USD (approximate)
    pub cost_per_minute_usd: f32,
}

/// STT Provider trait
#[async_trait]
pub trait SttProvider: Send + Sync {
    /// Get provider name
    fn name(&self) -> &str;

    /// Get provider capabilities
    fn capabilities(&self) -> ProviderCapabilities;

    /// Get supported languages
    fn supported_languages(&self) -> Vec<LanguageCode>;

    /// Check if provider is available (API key configured, etc.)
    async fn is_available(&self) -> bool;

    /// Transcribe audio data (batch mode)
    async fn transcribe(
        &self,
        audio: &AudioData,
        config: &SttConfig,
    ) -> SttResult<TranscriptionResult>;

    /// Start streaming transcription session
    async fn start_stream(
        &self,
        config: &SttConfig,
    ) -> SttResult<Box<dyn StreamingSession>>;
}

/// Streaming transcription session
#[async_trait]
pub trait StreamingSession: Send + Sync {
    /// Send audio chunk to the stream
    async fn send_audio(&mut self, chunk: &[u8]) -> SttResult<()>;

    /// Receive next transcription result (blocking)
    async fn receive(&mut self) -> SttResult<Option<TranscriptionResult>>;

    /// Close the streaming session
    async fn close(&mut self) -> SttResult<()>;

    /// Check if session is still active
    fn is_active(&self) -> bool;
}

/// STT Provider Manager
///
/// Manages multiple STT providers with fallback chain and post-processing.
pub struct SttProviderManager {
    /// Registered providers
    providers: HashMap<String, Arc<dyn SttProvider>>,
    /// Active provider name
    active_provider: RwLock<String>,
    /// Fallback chain (provider names in order)
    fallback_chain: RwLock<Vec<String>>,
    /// Post-processor for vocabulary corrections
    post_processor: Arc<PostProcessor>,
    /// Default configuration
    default_config: RwLock<SttConfig>,
}

impl SttProviderManager {
    /// Create a new provider manager
    pub fn new(post_processor: PostProcessor) -> Self {
        Self {
            providers: HashMap::new(),
            active_provider: RwLock::new(String::new()),
            fallback_chain: RwLock::new(Vec::new()),
            post_processor: Arc::new(post_processor),
            default_config: RwLock::new(SttConfig::default()),
        }
    }

    /// Register a provider
    pub fn register_provider(&mut self, provider: Arc<dyn SttProvider>) {
        let name = provider.name().to_string();
        self.providers.insert(name, provider);
    }

    /// Set the active provider
    pub async fn set_active_provider(&self, name: &str) -> SttResult<()> {
        if !self.providers.contains_key(name) {
            return Err(SttError {
                code: SttErrorCode::ProviderUnavailable,
                message: format!("Provider '{}' not registered", name),
                provider: Some(name.to_string()),
                retryable: false,
            });
        }

        let mut active = self.active_provider.write().await;
        *active = name.to_string();
        Ok(())
    }

    /// Set the fallback chain
    pub async fn set_fallback_chain(&self, chain: Vec<String>) {
        let mut fallback = self.fallback_chain.write().await;
        *fallback = chain;
    }

    /// Get available providers
    pub fn get_providers(&self) -> Vec<String> {
        self.providers.keys().cloned().collect()
    }

    /// Get the active provider
    pub async fn get_active_provider(&self) -> String {
        self.active_provider.read().await.clone()
    }

    /// Transcribe audio with automatic fallback
    pub async fn transcribe(
        &self,
        audio: &AudioData,
        config: Option<&SttConfig>,
    ) -> SttResult<TranscriptionResult> {
        let start_time = std::time::Instant::now();

        let config = match config {
            Some(c) => c.clone(),
            None => self.default_config.read().await.clone(),
        };

        // Get providers to try (active + fallback chain)
        let active = self.active_provider.read().await.clone();
        let fallback = self.fallback_chain.read().await.clone();

        let mut providers_to_try = vec![active];
        providers_to_try.extend(fallback);

        // Remove duplicates while preserving order
        let mut seen = std::collections::HashSet::new();
        providers_to_try.retain(|p| !p.is_empty() && seen.insert(p.clone()));

        let mut last_error: Option<SttError> = None;

        for provider_name in providers_to_try {
            if let Some(provider) = self.providers.get(&provider_name) {
                // Check if provider is available
                if !provider.is_available().await {
                    continue;
                }

                match provider.transcribe(audio, &config).await {
                    Ok(mut result) => {
                        // Apply post-processing if enabled
                        if config.enable_post_processing {
                            result = self.post_processor.process(result).await;
                        }

                        // Update latency
                        result.latency_ms = start_time.elapsed().as_millis() as u64;
                        result.provider = provider_name;

                        return Ok(result);
                    }
                    Err(e) => {
                        // Log error and try next provider
                        log::warn!(
                            "Provider '{}' failed: {} ({})",
                            provider_name,
                            e.message,
                            e.code
                        );
                        last_error = Some(e);

                        // Don't retry for non-retryable errors
                        if let Some(ref err) = last_error {
                            if !err.retryable {
                                break;
                            }
                        }
                    }
                }
            }
        }

        Err(last_error.unwrap_or(SttError {
            code: SttErrorCode::ProviderUnavailable,
            message: "No providers available".to_string(),
            provider: None,
            retryable: false,
        }))
    }

    /// Start a streaming session with the active provider
    pub async fn start_stream(
        &self,
        config: Option<&SttConfig>,
    ) -> SttResult<Box<dyn StreamingSession>> {
        let config = match config {
            Some(c) => c.clone(),
            None => self.default_config.read().await.clone(),
        };

        let active = self.active_provider.read().await.clone();

        if let Some(provider) = self.providers.get(&active) {
            if !provider.capabilities().streaming {
                return Err(SttError {
                    code: SttErrorCode::ProviderError,
                    message: format!("Provider '{}' does not support streaming", active),
                    provider: Some(active),
                    retryable: false,
                });
            }

            provider.start_stream(&config).await
        } else {
            Err(SttError {
                code: SttErrorCode::ProviderUnavailable,
                message: "No active provider configured".to_string(),
                provider: None,
                retryable: false,
            })
        }
    }

    /// Update the default configuration
    pub async fn set_default_config(&self, config: SttConfig) {
        let mut default = self.default_config.write().await;
        *default = config;
    }

    /// Get provider capabilities
    pub fn get_provider_capabilities(&self, name: &str) -> Option<ProviderCapabilities> {
        self.providers.get(name).map(|p| p.capabilities())
    }

    /// Get reference to post-processor
    pub fn post_processor(&self) -> Arc<PostProcessor> {
        Arc::clone(&self.post_processor)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_audio_format() {
        assert_eq!(AudioFormat::Wav.mime_type(), "audio/wav");
        assert_eq!(AudioFormat::Mp3.extension(), "mp3");
    }

    #[test]
    fn test_stt_config_default() {
        let config = SttConfig::default();
        assert_eq!(config.language, "en-US");
        assert!(config.enable_post_processing);
        assert!(config.interim_results);
    }

    #[test]
    fn test_stt_error_display() {
        let error = SttError {
            code: SttErrorCode::Network,
            message: "Connection failed".to_string(),
            provider: Some("deepgram".to_string()),
            retryable: true,
        };
        assert!(error.to_string().contains("NETWORK_ERROR"));
    }
}
