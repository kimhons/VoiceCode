// Core AI ML API Client for aimlapi.com integration
// Provides HTTP client and authentication for all AI services

use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashMap;
use reqwest::Client as HttpClient;
use tokio::time::{timeout, Duration};

/// Error types for AI ML API operations
#[derive(Debug, thiserror::Error)]
pub enum AIMLError {
    #[error("HTTP client error: {0}")]
    HttpClientError(reqwest::Error),
    
    #[error("API request failed: {status} - {message}")]
    ApiError { status: u16, message: String },
    
    #[error("Authentication failed: {0}")]
    AuthError(String),
    
    #[error("Rate limit exceeded")]
    RateLimitExceeded,
    
    #[error("Invalid model: {0}")]
    InvalidModel(String),
    
    #[error("Missing parameter: {0}")]
    MissingParameter(String),
    
    #[error("JSON parsing error: {0}")]
    JsonError(serde_json::Error),
    
    #[error("Timeout: {0}")]
    Timeout(String),
    
    #[error("Network error: {0}")]
    NetworkError(String),
    
    #[error("Service unavailable: {0}")]
    ServiceUnavailable(String),
}

/// Core AI ML API client
#[derive(Debug)]
pub struct AIMLClient {
    api_key: String,
    base_url: String,
    http_client: HttpClient,
    request_count: u64,
    rate_limit_remaining: Option<u32>,
    rate_limit_reset: Option<u64>,
}

/// API request structure
#[derive(Debug, Serialize)]
pub struct AIMLRequest {
    pub model: String,
    pub messages: Vec<AIMLMessage>,
    pub max_tokens: Option<u32>,
    pub temperature: Option<f32>,
    pub stream: Option<bool>,
    pub top_p: Option<f32>,
    pub frequency_penalty: Option<f32>,
    pub presence_penalty: Option<f32>,
    pub stop: Option<Vec<String>>,
}

/// Chat message format
#[derive(Debug, Serialize, Deserialize)]
pub struct AIMLMessage {
    pub role: String, // "system", "user", "assistant"
    pub content: String,
}

/// API response structure
#[derive(Debug, Deserialize)]
pub struct AIMLResponse {
    pub id: String,
    pub object: String,
    pub created: u64,
    pub model: String,
    pub choices: Vec<AIMLChoice>,
    pub usage: Option<AIMLUsage>,
}

/// Choice in response
#[derive(Debug, Deserialize)]
pub struct AIMLChoice {
    pub index: u32,
    pub message: AIMLMessage,
    pub finish_reason: Option<String>,
}

/// Usage statistics
#[derive(Debug, Deserialize)]
pub struct AIMLUsage {
    pub prompt_tokens: u32,
    pub completion_tokens: u32,
    pub total_tokens: u32,
}

/// AI service types
#[derive(Debug, Clone)]
pub enum AIMLService {
    TextGeneration,
    TextEnhancement,
    VoiceGeneration,
    Translation,
    TextToSpeech,
    ImageGeneration,
    VideoGeneration,
    CodeGeneration,
    ContextUnderstanding,
}

impl AIMLClient {
    /// Create new AI ML client
    pub fn new(api_key: String, base_url: String, http_client: HttpClient) -> Self {
        Self {
            api_key,
            base_url,
            http_client,
            request_count: 0,
            rate_limit_remaining: None,
            rate_limit_reset: None,
        }
    }

    /// Initialize the client
    pub async fn initialize(&self) -> Result<(), AIMLError> {
        // Test API connectivity
        let test_request = self.create_chat_request(
            "gpt-4o".to_string(),
            vec![AIMLMessage {
                role: "user".to_string(),
                content: "Hello".to_string(),
            }],
            Some(10),
        )?;

        let response = self.send_request(test_request).await?;
        
        if response.choices.is_empty() {
            return Err(AIMLError::ServiceUnavailable("No choices in response".to_string()));
        }

        log::info!("AI ML API client initialized successfully");
        Ok(())
    }

    /// Send a chat completion request
    pub async fn chat_completion(&self, request: AIMLRequest) -> Result<AIMLResponse, AIMLError> {
        self.send_request(request).await
    }

    /// Send a text enhancement request
    pub async fn enhance_text(&self, text: String, context: String, instructions: String) -> Result<String, AIMLError> {
        let messages = vec![
            AIMLMessage {
                role: "system".to_string(),
                content: format!(
                    "You are an expert text enhancer. Context: {}. Instructions: {}. \
                     Enhance the given text while preserving its meaning and improving clarity, \
                     grammar, and style. Return only the enhanced text without explanations.",
                    context, instructions
                ),
            },
            AIMLMessage {
                role: "user".to_string(),
                content: text,
            },
        ];

        let request = self.create_chat_request(
            "gpt-5-pro".to_string(),
            messages,
            Some(1000),
        )?;

        let response = self.send_request(request).await?;
        
        if let Some(choice) = response.choices.first() {
            Ok(choice.message.content.clone())
        } else {
            Err(AIMLError::ServiceUnavailable("No response from text enhancement".to_string()))
        }
    }

    /// Generate voice using TTS
    pub async fn generate_voice(&self, text: String, voice_config: VoiceConfig) -> Result<Vec<u8>, AIMLError> {
        let endpoint = format!("{}/audio/speech", self.base_url);
        
        let request_body = json!({
            "model": voice_config.model,
            "input": text,
            "voice": voice_config.voice_id,
            "response_format": voice_config.output_format,
            "speed": voice_config.speed.unwrap_or(1.0),
        });

        let response = self.send_audio_request(&endpoint, request_body).await?;
        Ok(response)
    }

    /// Translate text
    pub async fn translate_text(&self, text: String, source_lang: Option<String>, target_lang: String) -> Result<String, AIMLError> {
        let source_context = source_lang.map(|s| format!(" from {}", s)).unwrap_or_default();
        let messages = vec![
            AIMLMessage {
                role: "system".to_string(),
                content: format!(
                    "You are a professional translator. Translate the given text{} to {}. \
                     Preserve the original meaning, tone, and formatting. \
                     Return only the translation without explanations.",
                    source_context, target_lang
                ),
            },
            AIMLMessage {
                role: "user".to_string(),
                content: text,
            },
        ];

        let request = self.create_chat_request(
            "claude-3-5-haiku".to_string(),
            messages,
            Some(2000),
        )?;

        let response = self.send_request(request).await?;
        
        if let Some(choice) = response.choices.first() {
            Ok(choice.message.content.clone())
        } else {
            Err(AIMLError::ServiceUnavailable("No response from translation".to_string()))
        }
    }

    /// Analyze context and intent
    pub async fn analyze_context(&self, text: String, context_type: String) -> Result<ContextAnalysis, AIMLError> {
        let messages = vec![
            AIMLMessage {
                role: "system".to_string(),
                content: format!(
                    "You are an expert in context analysis for {}. Analyze the given text and provide:\n\
                     1. Intent classification\n\
                     2. Sentiment analysis\n\
                     3. Key entities\n\
                     4. Topic classification\n\
                     5. Suggested improvements\n\
                     Return the analysis in JSON format.",
                    context_type
                ),
            },
            AIMLMessage {
                role: "user".to_string(),
                content: text,
            },
        ];

        let request = self.create_chat_request(
            "gpt-5-pro".to_string(),
            messages,
            Some(1500),
        )?;

        let response = self.send_request(request).await?;
        
        if let Some(choice) = response.choices.first() {
            let content = &choice.message.content;
            
            // Try to parse as JSON, fallback to text analysis
            match serde_json::from_str::<ContextAnalysis>(content) {
                Ok(analysis) => Ok(analysis),
                Err(_) => {
                    // Fallback to simple text parsing
                    Ok(ContextAnalysis {
                        intent: "general".to_string(),
                        sentiment: "neutral".to_string(),
                        entities: vec![],
                        topics: vec!["text".to_string()],
                        confidence: 0.5,
                        suggestions: vec!["Consider adding more context".to_string()],
                    })
                }
            }
        } else {
            Err(AIMLError::ServiceUnavailable("No response from context analysis".to_string()))
        }
    }

    /// Check API health
    pub async fn health_check(&self) -> Result<bool, AIMLError> {
        let test_request = self.create_chat_request(
            "gpt-4o".to_string(),
            vec![AIMLMessage {
                role: "user".to_string(),
                content: "Status check".to_string(),
            }],
            Some(5),
        )?;

        let response = self.send_request(test_request).await?;
        Ok(!response.choices.is_empty())
    }

    /// Send HTTP request to AI ML API
    async fn send_request(&self, request: AIMLRequest) -> Result<AIMLResponse, AIMLError> {
        let url = format!("{}/chat/completions", self.base_url);
        
        let response = timeout(Duration::from_secs(30), async {
            self.http_client
                .post(&url)
                .header("Authorization", format!("Bearer {}", self.api_key))
                .header("Content-Type", "application/json")
                .json(&request)
                .send()
                .await
        }).await.map_err(|_| AIMLError::Timeout("Request timeout".to_string()))?
        .map_err(AIMLError::HttpClientError)?;

        let status = response.status();
        
        if !status.is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return match status.as_u16() {
                401 => Err(AIMLError::AuthError("Invalid API key".to_string())),
                429 => Err(AIMLError::RateLimitExceeded),
                503 => Err(AIMLError::ServiceUnavailable("Service temporarily unavailable".to_string())),
                _ => Err(AIMLError::ApiError {
                    status: status.as_u16(),
                    message: error_text,
                }),
            };
        }

        let response_text = response.text().await.map_err(AIMLError::HttpClientError)?;
        
        match serde_json::from_str::<AIMLResponse>(&response_text) {
            Ok(parsed) => {
                log::debug!("API request completed successfully, tokens used: {:?}", parsed.usage);
                Ok(parsed)
            }
            Err(e) => {
                log::error!("Failed to parse API response: {}", response_text);
                Err(AIMLError::JsonError(e))
            }
        }
    }

    /// Send audio request for TTS
    async fn send_audio_request(&self, endpoint: &str, body: Value) -> Result<Vec<u8>, AIMLError> {
        let response = timeout(Duration::from_secs(30), async {
            self.http_client
                .post(endpoint)
                .header("Authorization", format!("Bearer {}", self.api_key))
                .header("Content-Type", "application/json")
                .json(&body)
                .send()
                .await
        }).await.map_err(|_| AIMLError::Timeout("TTS request timeout".to_string()))?
        .map_err(AIMLError::HttpClientError)?;

        let status = response.status();
        
        if !status.is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(AIMLError::ApiError {
                status: status.as_u16(),
                message: error_text,
            });
        }

        response.bytes().await.map_err(AIMLError::HttpClientError).map(|b| b.to_vec())
    }

    /// Create a chat completion request
    fn create_chat_request(&self, model: String, messages: Vec<AIMLMessage>, max_tokens: Option<u32>) -> Result<AIMLRequest, AIMLError> {
        if model.trim().is_empty() {
            return Err(AIMLError::InvalidModel("Model cannot be empty".to_string()));
        }

        Ok(AIMLRequest {
            model,
            messages,
            max_tokens,
            temperature: Some(0.7),
            stream: Some(false),
            top_p: Some(1.0),
            frequency_penalty: Some(0.0),
            presence_penalty: Some(0.0),
            stop: None,
        })
    }

    /// Get request statistics
    pub fn get_stats(&self) -> AIMLStats {
        AIMLStats {
            total_requests: self.request_count,
            rate_limit_remaining: self.rate_limit_remaining,
            rate_limit_reset: self.rate_limit_reset,
        }
    }
}

/// Voice configuration for TTS
#[derive(Debug, Clone)]
pub struct VoiceConfig {
    pub model: String,
    pub voice_id: String,
    pub output_format: String,
    pub speed: Option<f32>,
    pub pitch: Option<f32>,
}

/// Context analysis result
#[derive(Debug, Serialize, Deserialize)]
pub struct ContextAnalysis {
    pub intent: String,
    pub sentiment: String,
    pub entities: Vec<String>,
    pub topics: Vec<String>,
    pub confidence: f32,
    pub suggestions: Vec<String>,
}

/// Client statistics
#[derive(Debug, Serialize, Deserialize)]
pub struct AIMLStats {
    pub total_requests: u64,
    pub rate_limit_remaining: Option<u32>,
    pub rate_limit_reset: Option<u64>,
}

/// Configuration for AIML client
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIMLConfig {
    pub api_key: String,
    pub base_url: String,
    pub timeout_seconds: u64,
    pub max_retries: u32,
    pub retry_delay_ms: u64,
}
