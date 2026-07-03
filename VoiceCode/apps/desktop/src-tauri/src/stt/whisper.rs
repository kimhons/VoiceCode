#![allow(dead_code, unused_variables, unused_imports)]
//! Whisper STT Provider
//!
//! OpenAI Whisper integration supporting both API and local inference.
//! Provides high accuracy transcription with multi-language support.
//!
//! Features:
//! - OpenAI Whisper API integration
//! - Optional local whisper.cpp support
//! - 50+ languages supported
//! - Automatic language detection

use async_trait::async_trait;
use serde::{Deserialize, Serialize};

use super::provider::{
    AudioData, AudioFormat, LanguageCode, ProviderCapabilities,
    SttConfig, SttError, SttErrorCode, SttProvider, SttResult,
    StreamingSession, TranscriptionResult, WordTiming,
};

/// Whisper provider mode
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum WhisperMode {
    /// Use OpenAI Whisper API (cloud)
    Api,
    /// Use local whisper.cpp (on-device)
    Local,
    /// Try local first, fall back to API
    Hybrid,
}

/// Whisper model size for local inference
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum WhisperModelSize {
    /// Tiny model (~39M params, fastest)
    Tiny,
    /// Base model (~74M params)
    Base,
    /// Small model (~244M params)
    Small,
    /// Medium model (~769M params)
    Medium,
    /// Large model (~1.5B params, most accurate)
    Large,
    /// Large-v3 (latest, best accuracy)
    LargeV3,
}

impl WhisperModelSize {
    fn as_str(&self) -> &'static str {
        match self {
            WhisperModelSize::Tiny => "tiny",
            WhisperModelSize::Base => "base",
            WhisperModelSize::Small => "small",
            WhisperModelSize::Medium => "medium",
            WhisperModelSize::Large => "large",
            WhisperModelSize::LargeV3 => "large-v3",
        }
    }

    fn estimated_latency_ms(&self) -> u64 {
        match self {
            WhisperModelSize::Tiny => 200,
            WhisperModelSize::Base => 350,
            WhisperModelSize::Small => 500,
            WhisperModelSize::Medium => 800,
            WhisperModelSize::Large => 1200,
            WhisperModelSize::LargeV3 => 1500,
        }
    }
}

/// Whisper API configuration
#[derive(Debug, Clone)]
pub struct WhisperConfig {
    /// OpenAI API key
    pub api_key: String,
    /// API base URL
    pub base_url: String,
    /// Operation mode
    pub mode: WhisperMode,
    /// Model size for local inference
    pub local_model_size: WhisperModelSize,
    /// Path to local model files
    pub local_model_path: Option<String>,
    /// Timeout in seconds
    pub timeout_seconds: u32,
    /// Response format
    pub response_format: WhisperResponseFormat,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum WhisperResponseFormat {
    Json,
    Text,
    Srt,
    VerboseJson,
    Vtt,
}

impl WhisperResponseFormat {
    fn as_str(&self) -> &'static str {
        match self {
            WhisperResponseFormat::Json => "json",
            WhisperResponseFormat::Text => "text",
            WhisperResponseFormat::Srt => "srt",
            WhisperResponseFormat::VerboseJson => "verbose_json",
            WhisperResponseFormat::Vtt => "vtt",
        }
    }
}

impl Default for WhisperConfig {
    fn default() -> Self {
        Self {
            api_key: std::env::var("OPENAI_API_KEY").unwrap_or_default(),
            base_url: "https://api.openai.com/v1".to_string(),
            mode: WhisperMode::Api,
            local_model_size: WhisperModelSize::Base,
            local_model_path: None,
            timeout_seconds: 60,
            response_format: WhisperResponseFormat::VerboseJson,
        }
    }
}

/// Whisper STT Provider
pub struct WhisperProvider {
    config: WhisperConfig,
    http_client: reqwest::Client,
}

impl WhisperProvider {
    /// Create a new Whisper provider
    pub fn new(config: WhisperConfig) -> Self {
        let http_client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(config.timeout_seconds as u64))
            .build()
            .expect("Failed to create HTTP client");

        Self { config, http_client }
    }

    /// Create with default configuration (uses OPENAI_API_KEY env var)
    pub fn with_defaults() -> Self {
        Self::new(WhisperConfig::default())
    }

    /// Transcribe using OpenAI Whisper API
    async fn transcribe_api(
        &self,
        audio: &AudioData,
        config: &SttConfig,
    ) -> SttResult<TranscriptionResult> {
        use reqwest::multipart::{Form, Part};

        let url = format!("{}/audio/transcriptions", self.config.base_url);

        // Create multipart form
        let file_part = Part::bytes(audio.bytes.clone())
            .file_name(format!("audio.{}", audio.format.extension()))
            .mime_str(audio.format.mime_type())
            .map_err(|e| SttError {
                code: SttErrorCode::InvalidAudio,
                message: format!("Failed to create audio part: {}", e),
                provider: Some("whisper".to_string()),
                retryable: false,
            })?;

        let mut form = Form::new()
            .text("model", "whisper-1")
            .text("response_format", self.config.response_format.as_str())
            .part("file", file_part);

        // Add language if specified (not auto-detect)
        if !config.language.is_empty() && config.language != "auto" {
            // Whisper uses ISO 639-1 codes (2-letter)
            let lang_code = config.language.split('-').next().unwrap_or(&config.language);
            form = form.text("language", lang_code.to_string());
        }

        // Add prompt for vocabulary boosting
        if !config.vocabulary_boost.is_empty() {
            let prompt = config.vocabulary_boost.join(", ");
            form = form.text("prompt", prompt);
        }

        let response = self.http_client
            .post(&url)
            .header("Authorization", format!("Bearer {}", self.config.api_key))
            .multipart(form)
            .send()
            .await
            .map_err(|e| SttError {
                code: SttErrorCode::Network,
                message: format!("Request failed: {}", e),
                provider: Some("whisper".to_string()),
                retryable: true,
            })?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();

            let code = match status.as_u16() {
                401 => SttErrorCode::Authentication,
                429 => SttErrorCode::RateLimit,
                400 => SttErrorCode::InvalidAudio,
                _ => SttErrorCode::ProviderError,
            };

            return Err(SttError {
                code,
                message: format!("Whisper API error ({}): {}", status, body),
                provider: Some("whisper".to_string()),
                retryable: code == SttErrorCode::RateLimit,
            });
        }

        // Parse response based on format
        match self.config.response_format {
            WhisperResponseFormat::VerboseJson => {
                let whisper_response: WhisperVerboseResponse = response
                    .json()
                    .await
                    .map_err(|e| SttError {
                        code: SttErrorCode::ProviderError,
                        message: format!("Failed to parse response: {}", e),
                        provider: Some("whisper".to_string()),
                        retryable: false,
                    })?;

                Ok(self.parse_verbose_response(&whisper_response))
            }
            WhisperResponseFormat::Json => {
                let whisper_response: WhisperJsonResponse = response
                    .json()
                    .await
                    .map_err(|e| SttError {
                        code: SttErrorCode::ProviderError,
                        message: format!("Failed to parse response: {}", e),
                        provider: Some("whisper".to_string()),
                        retryable: false,
                    })?;

                Ok(TranscriptionResult {
                    id: uuid::Uuid::new_v4().to_string(),
                    text: whisper_response.text,
                    is_final: true,
                    confidence: 0.95, // Whisper doesn't return confidence
                    words: Vec::new(),
                    file_references: Vec::new(),
                    latency_ms: 0,
                    provider: "whisper".to_string(),
                    original_text: None,
                    corrections: Vec::new(),
                    detected_language: None,
                })
            }
            _ => {
                let text = response.text().await.map_err(|e| SttError {
                    code: SttErrorCode::ProviderError,
                    message: format!("Failed to read response: {}", e),
                    provider: Some("whisper".to_string()),
                    retryable: false,
                })?;

                Ok(TranscriptionResult {
                    id: uuid::Uuid::new_v4().to_string(),
                    text,
                    is_final: true,
                    confidence: 0.95,
                    words: Vec::new(),
                    file_references: Vec::new(),
                    latency_ms: 0,
                    provider: "whisper".to_string(),
                    original_text: None,
                    corrections: Vec::new(),
                    detected_language: None,
                })
            }
        }
    }

    /// Parse verbose JSON response with word timestamps
    fn parse_verbose_response(&self, response: &WhisperVerboseResponse) -> TranscriptionResult {
        let words: Vec<WordTiming> = response.words
            .as_ref()
            .map(|ws| {
                ws.iter().map(|w| WordTiming {
                    word: w.word.clone(),
                    start_ms: (w.start * 1000.0) as u64,
                    end_ms: (w.end * 1000.0) as u64,
                    confidence: 0.95, // Whisper doesn't provide per-word confidence
                }).collect()
            })
            .unwrap_or_default();

        TranscriptionResult {
            id: uuid::Uuid::new_v4().to_string(),
            text: response.text.clone(),
            is_final: true,
            confidence: 0.95,
            words,
            file_references: Vec::new(),
            latency_ms: 0,
            provider: "whisper".to_string(),
            original_text: None,
            corrections: Vec::new(),
            detected_language: response.language.clone(),
        }
    }

    /// Transcribe using local whisper.cpp (placeholder)
    async fn transcribe_local(
        &self,
        _audio: &AudioData,
        _config: &SttConfig,
    ) -> SttResult<TranscriptionResult> {
        // This would use whisper-rs crate for local inference
        // Placeholder for now
        Err(SttError {
            code: SttErrorCode::ProviderUnavailable,
            message: "Local Whisper not yet implemented".to_string(),
            provider: Some("whisper-local".to_string()),
            retryable: false,
        })
    }
}

#[async_trait]
impl SttProvider for WhisperProvider {
    fn name(&self) -> &str {
        "whisper"
    }

    fn capabilities(&self) -> ProviderCapabilities {
        ProviderCapabilities {
            streaming: false, // Whisper API doesn't support streaming
            word_timestamps: true, // With verbose_json format
            diarization: false,
            custom_vocabulary: true, // Via prompt
            max_duration_seconds: 7200, // 2 hours (file size limit 25MB)
            supported_formats: vec![
                AudioFormat::Wav,
                AudioFormat::Mp3,
                AudioFormat::Flac,
                AudioFormat::WebM,
                AudioFormat::Ogg,
            ],
            estimated_latency_ms: 1000, // API typically takes 1-3 seconds
            cost_per_minute_usd: 0.006, // $0.006/minute
        }
    }

    fn supported_languages(&self) -> Vec<LanguageCode> {
        // Whisper supports 50+ languages
        vec![
            LanguageCode { code: "en".to_string(), name: "English".to_string(), native_name: "English".to_string() },
            LanguageCode { code: "zh".to_string(), name: "Chinese".to_string(), native_name: "中文".to_string() },
            LanguageCode { code: "de".to_string(), name: "German".to_string(), native_name: "Deutsch".to_string() },
            LanguageCode { code: "es".to_string(), name: "Spanish".to_string(), native_name: "Español".to_string() },
            LanguageCode { code: "ru".to_string(), name: "Russian".to_string(), native_name: "Русский".to_string() },
            LanguageCode { code: "ko".to_string(), name: "Korean".to_string(), native_name: "한국어".to_string() },
            LanguageCode { code: "fr".to_string(), name: "French".to_string(), native_name: "Français".to_string() },
            LanguageCode { code: "ja".to_string(), name: "Japanese".to_string(), native_name: "日本語".to_string() },
            LanguageCode { code: "pt".to_string(), name: "Portuguese".to_string(), native_name: "Português".to_string() },
            LanguageCode { code: "tr".to_string(), name: "Turkish".to_string(), native_name: "Türkçe".to_string() },
            LanguageCode { code: "pl".to_string(), name: "Polish".to_string(), native_name: "Polski".to_string() },
            LanguageCode { code: "ca".to_string(), name: "Catalan".to_string(), native_name: "Català".to_string() },
            LanguageCode { code: "nl".to_string(), name: "Dutch".to_string(), native_name: "Nederlands".to_string() },
            LanguageCode { code: "ar".to_string(), name: "Arabic".to_string(), native_name: "العربية".to_string() },
            LanguageCode { code: "sv".to_string(), name: "Swedish".to_string(), native_name: "Svenska".to_string() },
            LanguageCode { code: "it".to_string(), name: "Italian".to_string(), native_name: "Italiano".to_string() },
            LanguageCode { code: "id".to_string(), name: "Indonesian".to_string(), native_name: "Bahasa Indonesia".to_string() },
            LanguageCode { code: "hi".to_string(), name: "Hindi".to_string(), native_name: "हिन्दी".to_string() },
            LanguageCode { code: "fi".to_string(), name: "Finnish".to_string(), native_name: "Suomi".to_string() },
            LanguageCode { code: "vi".to_string(), name: "Vietnamese".to_string(), native_name: "Tiếng Việt".to_string() },
            LanguageCode { code: "he".to_string(), name: "Hebrew".to_string(), native_name: "עברית".to_string() },
            LanguageCode { code: "uk".to_string(), name: "Ukrainian".to_string(), native_name: "Українська".to_string() },
            LanguageCode { code: "el".to_string(), name: "Greek".to_string(), native_name: "Ελληνικά".to_string() },
            LanguageCode { code: "ms".to_string(), name: "Malay".to_string(), native_name: "Bahasa Melayu".to_string() },
            LanguageCode { code: "cs".to_string(), name: "Czech".to_string(), native_name: "Čeština".to_string() },
            LanguageCode { code: "ro".to_string(), name: "Romanian".to_string(), native_name: "Română".to_string() },
            LanguageCode { code: "da".to_string(), name: "Danish".to_string(), native_name: "Dansk".to_string() },
            LanguageCode { code: "hu".to_string(), name: "Hungarian".to_string(), native_name: "Magyar".to_string() },
            LanguageCode { code: "ta".to_string(), name: "Tamil".to_string(), native_name: "தமிழ்".to_string() },
            LanguageCode { code: "no".to_string(), name: "Norwegian".to_string(), native_name: "Norsk".to_string() },
            LanguageCode { code: "th".to_string(), name: "Thai".to_string(), native_name: "ไทย".to_string() },
            LanguageCode { code: "ur".to_string(), name: "Urdu".to_string(), native_name: "اردو".to_string() },
            LanguageCode { code: "hr".to_string(), name: "Croatian".to_string(), native_name: "Hrvatski".to_string() },
            LanguageCode { code: "bg".to_string(), name: "Bulgarian".to_string(), native_name: "Български".to_string() },
            LanguageCode { code: "lt".to_string(), name: "Lithuanian".to_string(), native_name: "Lietuvių".to_string() },
            LanguageCode { code: "la".to_string(), name: "Latin".to_string(), native_name: "Latina".to_string() },
            LanguageCode { code: "mi".to_string(), name: "Maori".to_string(), native_name: "Te Reo Māori".to_string() },
            LanguageCode { code: "ml".to_string(), name: "Malayalam".to_string(), native_name: "മലയാളം".to_string() },
            LanguageCode { code: "cy".to_string(), name: "Welsh".to_string(), native_name: "Cymraeg".to_string() },
            LanguageCode { code: "sk".to_string(), name: "Slovak".to_string(), native_name: "Slovenčina".to_string() },
            LanguageCode { code: "te".to_string(), name: "Telugu".to_string(), native_name: "తెలుగు".to_string() },
            LanguageCode { code: "fa".to_string(), name: "Persian".to_string(), native_name: "فارسی".to_string() },
            LanguageCode { code: "lv".to_string(), name: "Latvian".to_string(), native_name: "Latviešu".to_string() },
            LanguageCode { code: "bn".to_string(), name: "Bengali".to_string(), native_name: "বাংলা".to_string() },
            LanguageCode { code: "sr".to_string(), name: "Serbian".to_string(), native_name: "Српски".to_string() },
            LanguageCode { code: "az".to_string(), name: "Azerbaijani".to_string(), native_name: "Azərbaycan".to_string() },
            LanguageCode { code: "sl".to_string(), name: "Slovenian".to_string(), native_name: "Slovenščina".to_string() },
            LanguageCode { code: "kn".to_string(), name: "Kannada".to_string(), native_name: "ಕನ್ನಡ".to_string() },
            LanguageCode { code: "et".to_string(), name: "Estonian".to_string(), native_name: "Eesti".to_string() },
            LanguageCode { code: "mk".to_string(), name: "Macedonian".to_string(), native_name: "Македонски".to_string() },
            LanguageCode { code: "br".to_string(), name: "Breton".to_string(), native_name: "Brezhoneg".to_string() },
            LanguageCode { code: "eu".to_string(), name: "Basque".to_string(), native_name: "Euskara".to_string() },
            LanguageCode { code: "is".to_string(), name: "Icelandic".to_string(), native_name: "Íslenska".to_string() },
            LanguageCode { code: "hy".to_string(), name: "Armenian".to_string(), native_name: "Հայերdelays".to_string() },
            LanguageCode { code: "ne".to_string(), name: "Nepali".to_string(), native_name: "नेपाली".to_string() },
            LanguageCode { code: "mn".to_string(), name: "Mongolian".to_string(), native_name: "Монгол".to_string() },
            LanguageCode { code: "bs".to_string(), name: "Bosnian".to_string(), native_name: "Bosanski".to_string() },
            LanguageCode { code: "kk".to_string(), name: "Kazakh".to_string(), native_name: "Қазақ".to_string() },
            LanguageCode { code: "sq".to_string(), name: "Albanian".to_string(), native_name: "Shqip".to_string() },
            LanguageCode { code: "sw".to_string(), name: "Swahili".to_string(), native_name: "Kiswahili".to_string() },
            LanguageCode { code: "gl".to_string(), name: "Galician".to_string(), native_name: "Galego".to_string() },
            LanguageCode { code: "mr".to_string(), name: "Marathi".to_string(), native_name: "मराठी".to_string() },
            LanguageCode { code: "pa".to_string(), name: "Punjabi".to_string(), native_name: "ਪੰਜਾਬੀ".to_string() },
            LanguageCode { code: "si".to_string(), name: "Sinhala".to_string(), native_name: "සිංහල".to_string() },
            LanguageCode { code: "km".to_string(), name: "Khmer".to_string(), native_name: "ខ្មែរ".to_string() },
            LanguageCode { code: "sn".to_string(), name: "Shona".to_string(), native_name: "chiShona".to_string() },
            LanguageCode { code: "yo".to_string(), name: "Yoruba".to_string(), native_name: "Yorùbá".to_string() },
            LanguageCode { code: "so".to_string(), name: "Somali".to_string(), native_name: "Soomaali".to_string() },
            LanguageCode { code: "af".to_string(), name: "Afrikaans".to_string(), native_name: "Afrikaans".to_string() },
            LanguageCode { code: "oc".to_string(), name: "Occitan".to_string(), native_name: "Occitan".to_string() },
            LanguageCode { code: "ka".to_string(), name: "Georgian".to_string(), native_name: "ქართული".to_string() },
            LanguageCode { code: "be".to_string(), name: "Belarusian".to_string(), native_name: "Беларуская".to_string() },
            LanguageCode { code: "tg".to_string(), name: "Tajik".to_string(), native_name: "Тоҷикӣ".to_string() },
            LanguageCode { code: "sd".to_string(), name: "Sindhi".to_string(), native_name: "سنڌي".to_string() },
            LanguageCode { code: "gu".to_string(), name: "Gujarati".to_string(), native_name: "ગુજરાતી".to_string() },
            LanguageCode { code: "am".to_string(), name: "Amharic".to_string(), native_name: "አማርኛ".to_string() },
            LanguageCode { code: "yi".to_string(), name: "Yiddish".to_string(), native_name: "ייִדיש".to_string() },
            LanguageCode { code: "lo".to_string(), name: "Lao".to_string(), native_name: "ລາວ".to_string() },
            LanguageCode { code: "uz".to_string(), name: "Uzbek".to_string(), native_name: "Oʻzbek".to_string() },
            LanguageCode { code: "fo".to_string(), name: "Faroese".to_string(), native_name: "Føroyskt".to_string() },
            LanguageCode { code: "ht".to_string(), name: "Haitian Creole".to_string(), native_name: "Kreyòl ayisyen".to_string() },
            LanguageCode { code: "ps".to_string(), name: "Pashto".to_string(), native_name: "پښتو".to_string() },
            LanguageCode { code: "tk".to_string(), name: "Turkmen".to_string(), native_name: "Türkmen".to_string() },
            LanguageCode { code: "nn".to_string(), name: "Nynorsk".to_string(), native_name: "Nynorsk".to_string() },
            LanguageCode { code: "mt".to_string(), name: "Maltese".to_string(), native_name: "Malti".to_string() },
            LanguageCode { code: "sa".to_string(), name: "Sanskrit".to_string(), native_name: "संस्कृतम्".to_string() },
            LanguageCode { code: "lb".to_string(), name: "Luxembourgish".to_string(), native_name: "Lëtzebuergesch".to_string() },
            LanguageCode { code: "my".to_string(), name: "Myanmar".to_string(), native_name: "မြန်မာ".to_string() },
            LanguageCode { code: "bo".to_string(), name: "Tibetan".to_string(), native_name: "བོད་སྐད".to_string() },
            LanguageCode { code: "tl".to_string(), name: "Tagalog".to_string(), native_name: "Tagalog".to_string() },
            LanguageCode { code: "mg".to_string(), name: "Malagasy".to_string(), native_name: "Malagasy".to_string() },
            LanguageCode { code: "as".to_string(), name: "Assamese".to_string(), native_name: "অসমীয়া".to_string() },
            LanguageCode { code: "tt".to_string(), name: "Tatar".to_string(), native_name: "Татар".to_string() },
            LanguageCode { code: "haw".to_string(), name: "Hawaiian".to_string(), native_name: "ʻŌlelo Hawaiʻi".to_string() },
            LanguageCode { code: "ln".to_string(), name: "Lingala".to_string(), native_name: "Lingála".to_string() },
            LanguageCode { code: "ha".to_string(), name: "Hausa".to_string(), native_name: "Hausa".to_string() },
            LanguageCode { code: "ba".to_string(), name: "Bashkir".to_string(), native_name: "Башҡорт".to_string() },
            LanguageCode { code: "jw".to_string(), name: "Javanese".to_string(), native_name: "Basa Jawa".to_string() },
            LanguageCode { code: "su".to_string(), name: "Sundanese".to_string(), native_name: "Basa Sunda".to_string() },
        ]
    }

    async fn is_available(&self) -> bool {
        match self.config.mode {
            WhisperMode::Api | WhisperMode::Hybrid => !self.config.api_key.is_empty(),
            WhisperMode::Local => {
                // Check if local model is available
                if let Some(ref path) = self.config.local_model_path {
                    std::path::Path::new(path).exists()
                } else {
                    false
                }
            }
        }
    }

    async fn transcribe(
        &self,
        audio: &AudioData,
        config: &SttConfig,
    ) -> SttResult<TranscriptionResult> {
        match self.config.mode {
            WhisperMode::Api => self.transcribe_api(audio, config).await,
            WhisperMode::Local => self.transcribe_local(audio, config).await,
            WhisperMode::Hybrid => {
                // Try local first, fall back to API
                match self.transcribe_local(audio, config).await {
                    Ok(result) => Ok(result),
                    Err(_) => self.transcribe_api(audio, config).await,
                }
            }
        }
    }

    async fn start_stream(
        &self,
        _config: &SttConfig,
    ) -> SttResult<Box<dyn StreamingSession>> {
        Err(SttError {
            code: SttErrorCode::ProviderError,
            message: "Whisper API does not support streaming. Use Deepgram for real-time transcription.".to_string(),
            provider: Some("whisper".to_string()),
            retryable: false,
        })
    }
}

// Whisper API response types
#[derive(Debug, Deserialize)]
struct WhisperJsonResponse {
    text: String,
}

#[derive(Debug, Deserialize)]
struct WhisperVerboseResponse {
    text: String,
    language: Option<String>,
    duration: Option<f64>,
    words: Option<Vec<WhisperWord>>,
    segments: Option<Vec<WhisperSegment>>,
}

#[derive(Debug, Deserialize)]
struct WhisperWord {
    word: String,
    start: f64,
    end: f64,
}

#[derive(Debug, Deserialize)]
struct WhisperSegment {
    id: i32,
    start: f64,
    end: f64,
    text: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_whisper_model_size() {
        assert_eq!(WhisperModelSize::LargeV3.as_str(), "large-v3");
        assert!(WhisperModelSize::Tiny.estimated_latency_ms() < WhisperModelSize::Large.estimated_latency_ms());
    }

    #[test]
    fn test_whisper_config_default() {
        let config = WhisperConfig::default();
        assert_eq!(config.mode, WhisperMode::Api);
        assert_eq!(config.response_format, WhisperResponseFormat::VerboseJson);
    }

    #[tokio::test]
    async fn test_whisper_provider_capabilities() {
        let provider = WhisperProvider::with_defaults();
        let caps = provider.capabilities();
        assert!(!caps.streaming); // Whisper doesn't support streaming
        assert!(caps.word_timestamps);
    }

    #[tokio::test]
    async fn test_whisper_languages() {
        let provider = WhisperProvider::with_defaults();
        let languages = provider.supported_languages();
        assert!(languages.len() >= 90); // Whisper supports 90+ languages
    }
}
