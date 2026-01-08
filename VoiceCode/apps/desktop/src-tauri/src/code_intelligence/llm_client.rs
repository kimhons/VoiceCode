// Phase 4: LLM Client Service
// Unified interface for multiple LLM providers with streaming support

use std::collections::HashMap;
use std::sync::Arc;
use serde::{Deserialize, Serialize};
use tokio::sync::mpsc;
use parking_lot::RwLock;
use reqwest::Client;

use super::context_builder::ProjectContext;
use super::token_budget::LLMModel;

/// Supported LLM providers
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum LLMProvider {
    /// Anthropic Claude
    Anthropic,
    /// OpenAI GPT
    OpenAI,
    /// Google Gemini
    Google,
    /// Local LLM (Ollama, LM Studio)
    Local,
    /// AI/ML API aggregator
    AIML,
}

/// LLM model configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelConfig {
    pub provider: LLMProvider,
    pub model_id: String,
    pub max_tokens: usize,
    pub temperature: f32,
    pub top_p: Option<f32>,
    pub top_k: Option<usize>,
    pub stop_sequences: Vec<String>,
}

impl Default for ModelConfig {
    fn default() -> Self {
        Self {
            provider: LLMProvider::Anthropic,
            model_id: "claude-sonnet-4-20250514".to_string(),
            max_tokens: 4096,
            temperature: 0.7,
            top_p: Some(0.9),
            top_k: None,
            stop_sequences: vec![],
        }
    }
}

/// LLM client configuration
#[derive(Debug, Clone)]
pub struct LLMClientConfig {
    /// API keys per provider
    pub api_keys: HashMap<LLMProvider, String>,
    /// Base URLs (for custom endpoints)
    pub base_urls: HashMap<LLMProvider, String>,
    /// Default model to use
    pub default_model: ModelConfig,
    /// Request timeout in seconds
    pub timeout_seconds: u64,
    /// Max retries on failure
    pub max_retries: u32,
    /// Enable response caching
    pub cache_enabled: bool,
}

impl Default for LLMClientConfig {
    fn default() -> Self {
        let mut base_urls = HashMap::new();
        base_urls.insert(LLMProvider::Anthropic, "https://api.anthropic.com".to_string());
        base_urls.insert(LLMProvider::OpenAI, "https://api.openai.com".to_string());
        base_urls.insert(LLMProvider::Google, "https://generativelanguage.googleapis.com".to_string());
        base_urls.insert(LLMProvider::Local, "http://localhost:11434".to_string());
        base_urls.insert(LLMProvider::AIML, "https://api.aimlapi.com".to_string());

        Self {
            api_keys: HashMap::new(),
            base_urls,
            default_model: ModelConfig::default(),
            timeout_seconds: 60,
            max_retries: 3,
            cache_enabled: true,
        }
    }
}

/// Message role in conversation
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum MessageRole {
    System,
    User,
    Assistant,
    Tool,
}

/// A message in the conversation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub role: MessageRole,
    pub content: String,
    pub name: Option<String>,
    pub tool_call_id: Option<String>,
}

impl Message {
    pub fn system(content: impl Into<String>) -> Self {
        Self {
            role: MessageRole::System,
            content: content.into(),
            name: None,
            tool_call_id: None,
        }
    }

    pub fn user(content: impl Into<String>) -> Self {
        Self {
            role: MessageRole::User,
            content: content.into(),
            name: None,
            tool_call_id: None,
        }
    }

    pub fn assistant(content: impl Into<String>) -> Self {
        Self {
            role: MessageRole::Assistant,
            content: content.into(),
            name: None,
            tool_call_id: None,
        }
    }
}

/// Tool definition for function calling
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolDefinition {
    pub name: String,
    pub description: String,
    pub parameters: serde_json::Value,
}

/// Tool call from LLM
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolCall {
    pub id: String,
    pub name: String,
    pub arguments: serde_json::Value,
}

/// Request to LLM
#[derive(Debug, Clone)]
pub struct LLMRequest {
    pub id: String,
    pub messages: Vec<Message>,
    pub model: Option<ModelConfig>,
    pub tools: Vec<ToolDefinition>,
    pub stream: bool,
    pub context: Option<ProjectContext>,
}

impl LLMRequest {
    pub fn new(messages: Vec<Message>) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            messages,
            model: None,
            tools: vec![],
            stream: false,
            context: None,
        }
    }

    pub fn with_model(mut self, model: ModelConfig) -> Self {
        self.model = Some(model);
        self
    }

    pub fn with_tools(mut self, tools: Vec<ToolDefinition>) -> Self {
        self.tools = tools;
        self
    }

    pub fn with_streaming(mut self) -> Self {
        self.stream = true;
        self
    }

    pub fn with_context(mut self, context: ProjectContext) -> Self {
        self.context = Some(context);
        self
    }
}

/// Response from LLM
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LLMResponse {
    pub id: String,
    pub content: String,
    pub tool_calls: Vec<ToolCall>,
    pub finish_reason: FinishReason,
    pub usage: TokenUsage,
    pub model: String,
    pub latency_ms: u64,
}

/// Reason for response completion
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum FinishReason {
    Stop,
    MaxTokens,
    ToolUse,
    ContentFilter,
    Error,
}

/// Token usage statistics
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct TokenUsage {
    pub prompt_tokens: usize,
    pub completion_tokens: usize,
    pub total_tokens: usize,
    pub cached_tokens: Option<usize>,
}

/// Streaming event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum StreamEvent {
    Start { id: String, model: String },
    Delta { content: String },
    ToolCall { tool_call: ToolCall },
    Usage { usage: TokenUsage },
    Done { finish_reason: FinishReason },
    Error { error: String },
}

/// LLM Client for code generation
pub struct LLMClient {
    config: LLMClientConfig,
    http_client: Client,
    conversation_cache: RwLock<HashMap<String, Vec<Message>>>,
}

impl LLMClient {
    pub fn new(config: LLMClientConfig) -> Result<Self, String> {
        let http_client = Client::builder()
            .timeout(std::time::Duration::from_secs(config.timeout_seconds))
            .build()
            .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

        Ok(Self {
            config,
            http_client,
            conversation_cache: RwLock::new(HashMap::new()),
        })
    }

    /// Send a request and get a complete response
    pub async fn complete(&self, request: LLMRequest) -> Result<LLMResponse, String> {
        let model = request.model.as_ref().unwrap_or(&self.config.default_model);
        let start = std::time::Instant::now();

        let response = match model.provider {
            LLMProvider::Anthropic => self.complete_anthropic(&request, model).await,
            LLMProvider::OpenAI => self.complete_openai(&request, model).await,
            LLMProvider::AIML => self.complete_aiml(&request, model).await,
            LLMProvider::Local => self.complete_local(&request, model).await,
            LLMProvider::Google => self.complete_google(&request, model).await,
        }?;

        let latency = start.elapsed().as_millis() as u64;

        Ok(LLMResponse {
            latency_ms: latency,
            ..response
        })
    }

    /// Send a streaming request
    pub async fn stream(
        &self,
        request: LLMRequest,
        tx: mpsc::Sender<StreamEvent>,
    ) -> Result<(), String> {
        let model = request.model.as_ref().unwrap_or(&self.config.default_model);

        match model.provider {
            LLMProvider::Anthropic => self.stream_anthropic(&request, model, tx).await,
            LLMProvider::OpenAI => self.stream_openai(&request, model, tx).await,
            LLMProvider::AIML => self.stream_aiml(&request, model, tx).await,
            LLMProvider::Local => self.stream_local(&request, model, tx).await,
            LLMProvider::Google => self.stream_google(&request, model, tx).await,
        }
    }

    /// Complete with Anthropic API
    async fn complete_anthropic(
        &self,
        request: &LLMRequest,
        model: &ModelConfig,
    ) -> Result<LLMResponse, String> {
        let api_key = self.config.api_keys.get(&LLMProvider::Anthropic)
            .ok_or("Anthropic API key not configured")?;

        let base_url = self.config.base_urls.get(&LLMProvider::Anthropic)
            .unwrap();

        // Build messages payload
        let (system_message, messages): (Option<String>, Vec<serde_json::Value>) = {
            let mut system = None;
            let msgs: Vec<serde_json::Value> = request.messages.iter()
                .filter_map(|m| {
                    match m.role {
                        MessageRole::System => {
                            system = Some(m.content.clone());
                            None
                        }
                        MessageRole::User => Some(serde_json::json!({
                            "role": "user",
                            "content": m.content
                        })),
                        MessageRole::Assistant => Some(serde_json::json!({
                            "role": "assistant",
                            "content": m.content
                        })),
                        MessageRole::Tool => None, // Handle tool results differently
                    }
                })
                .collect();
            (system, msgs)
        };

        let mut body = serde_json::json!({
            "model": model.model_id,
            "max_tokens": model.max_tokens,
            "temperature": model.temperature,
            "messages": messages,
        });

        if let Some(system) = system_message {
            body["system"] = serde_json::json!(system);
        }

        if let Some(top_p) = model.top_p {
            body["top_p"] = serde_json::json!(top_p);
        }

        if let Some(top_k) = model.top_k {
            body["top_k"] = serde_json::json!(top_k);
        }

        // Add tools if any
        if !request.tools.is_empty() {
            let tools: Vec<serde_json::Value> = request.tools.iter()
                .map(|t| serde_json::json!({
                    "name": t.name,
                    "description": t.description,
                    "input_schema": t.parameters
                }))
                .collect();
            body["tools"] = serde_json::json!(tools);
        }

        let response = self.http_client
            .post(format!("{}/v1/messages", base_url))
            .header("x-api-key", api_key)
            .header("anthropic-version", "2023-06-01")
            .header("content-type", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(format!("API error: {}", error_text));
        }

        let result: serde_json::Value = response.json().await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        // Extract content
        let content = result["content"]
            .as_array()
            .and_then(|arr| arr.first())
            .and_then(|c| c["text"].as_str())
            .unwrap_or("")
            .to_string();

        // Extract tool calls
        let tool_calls: Vec<ToolCall> = result["content"]
            .as_array()
            .map(|arr| {
                arr.iter()
                    .filter(|c| c["type"] == "tool_use")
                    .map(|c| ToolCall {
                        id: c["id"].as_str().unwrap_or("").to_string(),
                        name: c["name"].as_str().unwrap_or("").to_string(),
                        arguments: c["input"].clone(),
                    })
                    .collect()
            })
            .unwrap_or_default();

        let finish_reason = match result["stop_reason"].as_str() {
            Some("end_turn") => FinishReason::Stop,
            Some("max_tokens") => FinishReason::MaxTokens,
            Some("tool_use") => FinishReason::ToolUse,
            _ => FinishReason::Stop,
        };

        let usage = TokenUsage {
            prompt_tokens: result["usage"]["input_tokens"].as_u64().unwrap_or(0) as usize,
            completion_tokens: result["usage"]["output_tokens"].as_u64().unwrap_or(0) as usize,
            total_tokens: (result["usage"]["input_tokens"].as_u64().unwrap_or(0)
                + result["usage"]["output_tokens"].as_u64().unwrap_or(0)) as usize,
            cached_tokens: result["usage"]["cache_read_input_tokens"]
                .as_u64()
                .map(|v| v as usize),
        };

        Ok(LLMResponse {
            id: result["id"].as_str().unwrap_or("").to_string(),
            content,
            tool_calls,
            finish_reason,
            usage,
            model: model.model_id.clone(),
            latency_ms: 0,
        })
    }

    /// Stream with Anthropic API
    async fn stream_anthropic(
        &self,
        request: &LLMRequest,
        model: &ModelConfig,
        tx: mpsc::Sender<StreamEvent>,
    ) -> Result<(), String> {
        let api_key = self.config.api_keys.get(&LLMProvider::Anthropic)
            .ok_or("Anthropic API key not configured")?;

        let base_url = self.config.base_urls.get(&LLMProvider::Anthropic).unwrap();

        // Build streaming request
        let (system_message, messages): (Option<String>, Vec<serde_json::Value>) = {
            let mut system = None;
            let msgs: Vec<serde_json::Value> = request.messages.iter()
                .filter_map(|m| {
                    match m.role {
                        MessageRole::System => {
                            system = Some(m.content.clone());
                            None
                        }
                        MessageRole::User => Some(serde_json::json!({
                            "role": "user",
                            "content": m.content
                        })),
                        MessageRole::Assistant => Some(serde_json::json!({
                            "role": "assistant",
                            "content": m.content
                        })),
                        _ => None,
                    }
                })
                .collect();
            (system, msgs)
        };

        let mut body = serde_json::json!({
            "model": model.model_id,
            "max_tokens": model.max_tokens,
            "temperature": model.temperature,
            "messages": messages,
            "stream": true,
        });

        if let Some(system) = system_message {
            body["system"] = serde_json::json!(system);
        }

        let response = self.http_client
            .post(format!("{}/v1/messages", base_url))
            .header("x-api-key", api_key)
            .header("anthropic-version", "2023-06-01")
            .header("content-type", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            let _ = tx.send(StreamEvent::Error { error: error_text }).await;
            return Err("Stream failed".to_string());
        }

        // Process SSE stream
        let mut stream = response.bytes_stream();
        use futures_util::StreamExt;

        let mut buffer = String::new();

        while let Some(chunk_result) = stream.next().await {
            match chunk_result {
                Ok(chunk) => {
                    buffer.push_str(&String::from_utf8_lossy(&chunk));

                    // Process complete events
                    while let Some(event_end) = buffer.find("\n\n") {
                        let event_str = buffer[..event_end].to_string();
                        buffer = buffer[event_end + 2..].to_string();

                        if let Some(event) = self.parse_sse_event(&event_str) {
                            if tx.send(event).await.is_err() {
                                return Ok(());
                            }
                        }
                    }
                }
                Err(e) => {
                    let _ = tx.send(StreamEvent::Error {
                        error: format!("Stream error: {}", e),
                    }).await;
                    break;
                }
            }
        }

        Ok(())
    }

    /// Parse SSE event from Anthropic
    fn parse_sse_event(&self, event_str: &str) -> Option<StreamEvent> {
        let mut event_type = "";
        let mut data = "";

        for line in event_str.lines() {
            if let Some(et) = line.strip_prefix("event: ") {
                event_type = et;
            } else if let Some(d) = line.strip_prefix("data: ") {
                data = d;
            }
        }

        let json: serde_json::Value = serde_json::from_str(data).ok()?;

        match event_type {
            "message_start" => Some(StreamEvent::Start {
                id: json["message"]["id"].as_str()?.to_string(),
                model: json["message"]["model"].as_str()?.to_string(),
            }),
            "content_block_delta" => {
                if let Some(text) = json["delta"]["text"].as_str() {
                    Some(StreamEvent::Delta { content: text.to_string() })
                } else {
                    None
                }
            }
            "message_delta" => {
                let finish_reason = match json["delta"]["stop_reason"].as_str() {
                    Some("end_turn") => FinishReason::Stop,
                    Some("max_tokens") => FinishReason::MaxTokens,
                    Some("tool_use") => FinishReason::ToolUse,
                    _ => FinishReason::Stop,
                };
                Some(StreamEvent::Done { finish_reason })
            }
            "message_stop" => Some(StreamEvent::Done {
                finish_reason: FinishReason::Stop,
            }),
            "error" => Some(StreamEvent::Error {
                error: json["error"]["message"].as_str().unwrap_or("Unknown error").to_string(),
            }),
            _ => None,
        }
    }

    /// Complete with OpenAI API (placeholder)
    async fn complete_openai(
        &self,
        request: &LLMRequest,
        model: &ModelConfig,
    ) -> Result<LLMResponse, String> {
        // Implementation similar to Anthropic but with OpenAI format
        Err("OpenAI provider not yet implemented".to_string())
    }

    /// Stream with OpenAI API (placeholder)
    async fn stream_openai(
        &self,
        request: &LLMRequest,
        model: &ModelConfig,
        tx: mpsc::Sender<StreamEvent>,
    ) -> Result<(), String> {
        Err("OpenAI streaming not yet implemented".to_string())
    }

    /// Complete with AI/ML API
    async fn complete_aiml(
        &self,
        request: &LLMRequest,
        model: &ModelConfig,
    ) -> Result<LLMResponse, String> {
        // Similar to OpenAI format
        Err("AIML provider not yet implemented".to_string())
    }

    /// Stream with AI/ML API
    async fn stream_aiml(
        &self,
        request: &LLMRequest,
        model: &ModelConfig,
        tx: mpsc::Sender<StreamEvent>,
    ) -> Result<(), String> {
        Err("AIML streaming not yet implemented".to_string())
    }

    /// Complete with local LLM (Ollama)
    async fn complete_local(
        &self,
        request: &LLMRequest,
        model: &ModelConfig,
    ) -> Result<LLMResponse, String> {
        Err("Local provider not yet implemented".to_string())
    }

    /// Stream with local LLM
    async fn stream_local(
        &self,
        request: &LLMRequest,
        model: &ModelConfig,
        tx: mpsc::Sender<StreamEvent>,
    ) -> Result<(), String> {
        Err("Local streaming not yet implemented".to_string())
    }

    /// Complete with Google API
    async fn complete_google(
        &self,
        request: &LLMRequest,
        model: &ModelConfig,
    ) -> Result<LLMResponse, String> {
        Err("Google provider not yet implemented".to_string())
    }

    /// Stream with Google API
    async fn stream_google(
        &self,
        request: &LLMRequest,
        model: &ModelConfig,
        tx: mpsc::Sender<StreamEvent>,
    ) -> Result<(), String> {
        Err("Google streaming not yet implemented".to_string())
    }

    /// Store conversation for multi-turn
    pub fn store_conversation(&self, conversation_id: &str, messages: Vec<Message>) {
        self.conversation_cache.write().insert(
            conversation_id.to_string(),
            messages,
        );
    }

    /// Get stored conversation
    pub fn get_conversation(&self, conversation_id: &str) -> Option<Vec<Message>> {
        self.conversation_cache.read().get(conversation_id).cloned()
    }

    /// Clear conversation
    pub fn clear_conversation(&self, conversation_id: &str) {
        self.conversation_cache.write().remove(conversation_id);
    }
}

/// Code generation prompts
pub struct CodePrompts;

impl CodePrompts {
    /// System prompt for code generation
    pub fn code_generation_system() -> String {
        r#"You are an expert software engineer and coding assistant. You help users write, modify, and understand code.

Key principles:
1. Write clean, readable, and maintainable code
2. Follow the existing code style and conventions in the project
3. Use type annotations where appropriate
4. Include helpful comments for complex logic
5. Handle errors gracefully
6. Consider edge cases
7. Write efficient code without premature optimization

When generating code:
- Match the language and style of the provided context
- Use consistent naming conventions
- Follow best practices for the language/framework
- Include necessary imports
- Consider security implications

When explaining code:
- Be concise but thorough
- Use examples where helpful
- Explain the "why" not just the "what""#.to_string()
    }

    /// Prompt for code completion
    pub fn code_completion(context: &str, prefix: &str, suffix: &str) -> String {
        format!(
            r#"Complete the code at the cursor position. Only output the code to insert, nothing else.

Context from project:
```
{}
```

Code before cursor:
```
{}
```

Code after cursor:
```
{}
```

Complete the code:"#,
            context, prefix, suffix
        )
    }

    /// Prompt for code modification
    pub fn code_modification(context: &str, code: &str, instruction: &str) -> String {
        format!(
            r#"Modify the following code according to the instruction.

Project context:
```
{}
```

Code to modify:
```
{}
```

Instruction: {}

Output only the modified code:"#,
            context, code, instruction
        )
    }

    /// Prompt for code explanation
    pub fn code_explanation(context: &str, code: &str) -> String {
        format!(
            r#"Explain the following code clearly and concisely.

Project context:
```
{}
```

Code to explain:
```
{}
```

Provide a clear explanation:"#,
            context, code
        )
    }

    /// Prompt for bug fixing
    pub fn bug_fix(context: &str, code: &str, error: &str) -> String {
        format!(
            r#"Fix the bug in the following code.

Project context:
```
{}
```

Code with bug:
```
{}
```

Error/Issue: {}

Output the fixed code:"#,
            context, code, error
        )
    }

    /// Prompt for refactoring
    pub fn refactor(context: &str, code: &str, goal: &str) -> String {
        format!(
            r#"Refactor the following code to achieve the goal while maintaining the same functionality.

Project context:
```
{}
```

Code to refactor:
```
{}
```

Refactoring goal: {}

Output the refactored code:"#,
            context, code, goal
        )
    }

    /// Prompt for test generation
    pub fn generate_tests(context: &str, code: &str) -> String {
        format!(
            r#"Generate comprehensive unit tests for the following code.

Project context:
```
{}
```

Code to test:
```
{}
```

Generate tests that cover:
- Normal cases
- Edge cases
- Error cases

Output the test code:"#,
            context, code
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_message_creation() {
        let msg = Message::user("Hello");
        assert_eq!(msg.role, MessageRole::User);
        assert_eq!(msg.content, "Hello");
    }

    #[test]
    fn test_llm_request_builder() {
        let request = LLMRequest::new(vec![Message::user("Hello")])
            .with_streaming()
            .with_tools(vec![]);

        assert!(request.stream);
        assert!(request.tools.is_empty());
    }

    #[test]
    fn test_model_config_default() {
        let config = ModelConfig::default();
        assert_eq!(config.provider, LLMProvider::Anthropic);
        assert!(config.temperature >= 0.0 && config.temperature <= 1.0);
    }
}
