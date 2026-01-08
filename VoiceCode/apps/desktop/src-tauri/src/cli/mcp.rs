// MCP (Model Context Protocol) Integration
// Implements STDIO, HTTP, SSE transports with OAuth support
// Following the MCP specification for tool discovery and execution

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::process::{Child, Command};
use tokio::sync::{mpsc, oneshot, Mutex, RwLock};

// ============================================================================
// MCP Protocol Types
// ============================================================================

/// JSON-RPC 2.0 Request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonRpcRequest {
    pub jsonrpc: String,
    pub id: Option<JsonRpcId>,
    pub method: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub params: Option<serde_json::Value>,
}

/// JSON-RPC 2.0 Response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonRpcResponse {
    pub jsonrpc: String,
    pub id: Option<JsonRpcId>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub result: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<JsonRpcError>,
}

/// JSON-RPC ID (can be string or number)
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(untagged)]
pub enum JsonRpcId {
    String(String),
    Number(i64),
}

/// JSON-RPC Error
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonRpcError {
    pub code: i32,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<serde_json::Value>,
}

impl JsonRpcRequest {
    pub fn new(method: &str, params: Option<serde_json::Value>) -> Self {
        Self {
            jsonrpc: "2.0".to_string(),
            id: Some(JsonRpcId::Number(rand::random::<i64>().abs())),
            method: method.to_string(),
            params,
        }
    }

    pub fn notification(method: &str, params: Option<serde_json::Value>) -> Self {
        Self {
            jsonrpc: "2.0".to_string(),
            id: None,
            method: method.to_string(),
            params,
        }
    }
}

// ============================================================================
// Transport Types
// ============================================================================

/// Transport type for MCP connections
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TransportType {
    Stdio,
    Http,
    Sse,
    WebSocket,
}

/// Transport configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransportConfig {
    pub transport_type: TransportType,
    /// For STDIO: command to execute
    pub command: Option<String>,
    /// For STDIO: command arguments
    pub args: Option<Vec<String>>,
    /// For STDIO: environment variables
    pub env: Option<HashMap<String, String>>,
    /// For HTTP/SSE: base URL
    pub url: Option<String>,
    /// For HTTP: headers
    pub headers: Option<HashMap<String, String>>,
    /// Connection timeout in milliseconds
    pub timeout_ms: Option<u64>,
    /// For SSE: reconnect delay
    pub reconnect_delay_ms: Option<u64>,
}

impl Default for TransportConfig {
    fn default() -> Self {
        Self {
            transport_type: TransportType::Stdio,
            command: None,
            args: None,
            env: None,
            url: None,
            headers: None,
            timeout_ms: Some(30000),
            reconnect_delay_ms: Some(1000),
        }
    }
}

// ============================================================================
// MCP Server Configuration
// ============================================================================

/// MCP Server definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpServerConfig {
    pub name: String,
    pub description: Option<String>,
    pub transport: TransportConfig,
    /// OAuth configuration if required
    pub oauth: Option<OAuthConfig>,
    /// Auto-start on connection
    pub auto_start: bool,
    /// Restart on failure
    pub restart_on_failure: bool,
    /// Maximum restart attempts
    pub max_restarts: u32,
}

/// OAuth configuration for MCP servers
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OAuthConfig {
    pub client_id: String,
    pub client_secret: Option<String>,
    pub auth_url: String,
    pub token_url: String,
    pub redirect_uri: String,
    pub scopes: Vec<String>,
    /// PKCE support
    pub use_pkce: bool,
}

// ============================================================================
// MCP Capabilities and Tools
// ============================================================================

/// Server capabilities returned during initialization
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ServerCapabilities {
    pub tools: Option<ToolsCapability>,
    pub resources: Option<ResourcesCapability>,
    pub prompts: Option<PromptsCapability>,
    pub logging: Option<LoggingCapability>,
    pub experimental: Option<HashMap<String, serde_json::Value>>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ToolsCapability {
    #[serde(default)]
    pub list_changed: bool,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ResourcesCapability {
    #[serde(default)]
    pub subscribe: bool,
    #[serde(default)]
    pub list_changed: bool,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct PromptsCapability {
    #[serde(default)]
    pub list_changed: bool,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct LoggingCapability {}

/// MCP Tool definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpTool {
    pub name: String,
    pub description: Option<String>,
    #[serde(rename = "inputSchema")]
    pub input_schema: serde_json::Value,
}

/// MCP Resource definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpResource {
    pub uri: String,
    pub name: String,
    pub description: Option<String>,
    #[serde(rename = "mimeType")]
    pub mime_type: Option<String>,
}

/// MCP Prompt definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpPrompt {
    pub name: String,
    pub description: Option<String>,
    pub arguments: Option<Vec<PromptArgument>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PromptArgument {
    pub name: String,
    pub description: Option<String>,
    pub required: Option<bool>,
}

// ============================================================================
// Transport Trait and Implementations
// ============================================================================

/// Message from transport
#[derive(Debug, Clone)]
pub enum TransportMessage {
    Request(JsonRpcRequest),
    Response(JsonRpcResponse),
    Notification(JsonRpcRequest),
    Error(String),
    Closed,
}

/// Transport trait for different connection types
#[async_trait::async_trait]
pub trait Transport: Send + Sync {
    /// Start the transport
    async fn start(&mut self) -> Result<(), McpError>;

    /// Send a request and wait for response
    async fn send_request(&self, request: JsonRpcRequest) -> Result<JsonRpcResponse, McpError>;

    /// Send a notification (no response expected)
    async fn send_notification(&self, notification: JsonRpcRequest) -> Result<(), McpError>;

    /// Check if transport is connected
    fn is_connected(&self) -> bool;

    /// Close the transport
    async fn close(&mut self) -> Result<(), McpError>;

    /// Get transport type
    fn transport_type(&self) -> TransportType;
}

// ============================================================================
// STDIO Transport
// ============================================================================

/// STDIO transport for subprocess-based MCP servers
pub struct StdioTransport {
    config: TransportConfig,
    process: Option<Child>,
    stdin_tx: Option<mpsc::Sender<String>>,
    pending_requests: Arc<RwLock<HashMap<JsonRpcId, oneshot::Sender<JsonRpcResponse>>>>,
    connected: Arc<RwLock<bool>>,
    notification_handler: Option<Arc<dyn Fn(JsonRpcRequest) + Send + Sync>>,
}

impl StdioTransport {
    pub fn new(config: TransportConfig) -> Self {
        Self {
            config,
            process: None,
            stdin_tx: None,
            pending_requests: Arc::new(RwLock::new(HashMap::new())),
            connected: Arc::new(RwLock::new(false)),
            notification_handler: None,
        }
    }

    pub fn with_notification_handler<F>(mut self, handler: F) -> Self
    where
        F: Fn(JsonRpcRequest) + Send + Sync + 'static,
    {
        self.notification_handler = Some(Arc::new(handler));
        self
    }

    async fn spawn_process(&mut self) -> Result<(), McpError> {
        let command = self.config.command.as_ref().ok_or_else(|| {
            McpError::Configuration("No command specified for STDIO transport".into())
        })?;

        let mut cmd = Command::new(command);

        if let Some(args) = &self.config.args {
            cmd.args(args);
        }

        if let Some(env) = &self.config.env {
            for (key, value) in env {
                cmd.env(key, value);
            }
        }

        cmd.stdin(std::process::Stdio::piped());
        cmd.stdout(std::process::Stdio::piped());
        cmd.stderr(std::process::Stdio::piped());

        let mut child = cmd
            .spawn()
            .map_err(|e| McpError::Transport(format!("Failed to spawn process: {}", e)))?;

        let stdin = child
            .stdin
            .take()
            .ok_or_else(|| McpError::Transport("Failed to capture stdin".into()))?;
        let stdout = child
            .stdout
            .take()
            .ok_or_else(|| McpError::Transport("Failed to capture stdout".into()))?;

        // Create channels for stdin writing
        let (stdin_tx, mut stdin_rx) = mpsc::channel::<String>(100);
        self.stdin_tx = Some(stdin_tx);

        // Spawn stdin writer task
        let mut stdin = tokio::io::BufWriter::new(stdin);
        tokio::spawn(async move {
            while let Some(message) = stdin_rx.recv().await {
                if let Err(e) = stdin.write_all(message.as_bytes()).await {
                    eprintln!("STDIO write error: {}", e);
                    break;
                }
                if let Err(e) = stdin.write_all(b"\n").await {
                    eprintln!("STDIO write error: {}", e);
                    break;
                }
                if let Err(e) = stdin.flush().await {
                    eprintln!("STDIO flush error: {}", e);
                    break;
                }
            }
        });

        // Spawn stdout reader task
        let pending = self.pending_requests.clone();
        let connected = self.connected.clone();
        let notification_handler = self.notification_handler.clone();

        tokio::spawn(async move {
            let reader = BufReader::new(stdout);
            let mut lines = reader.lines();

            while let Ok(Some(line)) = lines.next_line().await {
                // Try to parse as JSON-RPC response
                if let Ok(response) = serde_json::from_str::<JsonRpcResponse>(&line) {
                    if let Some(id) = &response.id {
                        let mut pending_guard = pending.write().await;
                        if let Some(sender) = pending_guard.remove(id) {
                            let _ = sender.send(response);
                        }
                    }
                }
                // Try to parse as notification
                else if let Ok(request) = serde_json::from_str::<JsonRpcRequest>(&line) {
                    if request.id.is_none() {
                        if let Some(ref handler) = notification_handler {
                            handler(request);
                        }
                    }
                }
            }

            *connected.write().await = false;
        });

        self.process = Some(child);
        *self.connected.write().await = true;

        Ok(())
    }
}

#[async_trait::async_trait]
impl Transport for StdioTransport {
    async fn start(&mut self) -> Result<(), McpError> {
        self.spawn_process().await
    }

    async fn send_request(&self, request: JsonRpcRequest) -> Result<JsonRpcResponse, McpError> {
        let stdin_tx = self
            .stdin_tx
            .as_ref()
            .ok_or_else(|| McpError::Transport("Transport not started".into()))?;

        let id = request
            .id
            .clone()
            .ok_or_else(|| McpError::Protocol("Request must have an ID".into()))?;

        // Create response channel
        let (response_tx, response_rx) = oneshot::channel();

        {
            let mut pending = self.pending_requests.write().await;
            pending.insert(id.clone(), response_tx);
        }

        // Serialize and send
        let json =
            serde_json::to_string(&request).map_err(|e| McpError::Serialization(e.to_string()))?;

        stdin_tx
            .send(json)
            .await
            .map_err(|e| McpError::Transport(format!("Failed to send request: {}", e)))?;

        // Wait for response with timeout
        let timeout = Duration::from_millis(self.config.timeout_ms.unwrap_or(30000));

        match tokio::time::timeout(timeout, response_rx).await {
            Ok(Ok(response)) => Ok(response),
            Ok(Err(_)) => Err(McpError::Transport("Response channel closed".into())),
            Err(_) => {
                // Remove pending request on timeout
                self.pending_requests.write().await.remove(&id);
                Err(McpError::Timeout)
            }
        }
    }

    async fn send_notification(&self, notification: JsonRpcRequest) -> Result<(), McpError> {
        let stdin_tx = self
            .stdin_tx
            .as_ref()
            .ok_or_else(|| McpError::Transport("Transport not started".into()))?;

        let json = serde_json::to_string(&notification)
            .map_err(|e| McpError::Serialization(e.to_string()))?;

        stdin_tx
            .send(json)
            .await
            .map_err(|e| McpError::Transport(format!("Failed to send notification: {}", e)))?;

        Ok(())
    }

    fn is_connected(&self) -> bool {
        // Use try_read to avoid blocking
        self.connected.try_read().map(|g| *g).unwrap_or(false)
    }

    async fn close(&mut self) -> Result<(), McpError> {
        *self.connected.write().await = false;

        if let Some(mut process) = self.process.take() {
            let _ = process.kill().await;
        }

        self.stdin_tx = None;
        self.pending_requests.write().await.clear();

        Ok(())
    }

    fn transport_type(&self) -> TransportType {
        TransportType::Stdio
    }
}

// ============================================================================
// HTTP Transport
// ============================================================================

/// HTTP transport for HTTP-based MCP servers
pub struct HttpTransport {
    config: TransportConfig,
    client: reqwest::Client,
    connected: Arc<RwLock<bool>>,
    auth_token: Arc<RwLock<Option<String>>>,
}

impl HttpTransport {
    pub fn new(config: TransportConfig) -> Result<Self, McpError> {
        let timeout = Duration::from_millis(config.timeout_ms.unwrap_or(30000));

        let client = reqwest::Client::builder()
            .timeout(timeout)
            .build()
            .map_err(|e| McpError::Transport(format!("Failed to create HTTP client: {}", e)))?;

        Ok(Self {
            config,
            client,
            connected: Arc::new(RwLock::new(false)),
            auth_token: Arc::new(RwLock::new(None)),
        })
    }

    pub async fn set_auth_token(&self, token: String) {
        *self.auth_token.write().await = Some(token);
    }

    fn get_url(&self) -> Result<&str, McpError> {
        self.config
            .url
            .as_deref()
            .ok_or_else(|| McpError::Configuration("No URL specified for HTTP transport".into()))
    }
}

#[async_trait::async_trait]
impl Transport for HttpTransport {
    async fn start(&mut self) -> Result<(), McpError> {
        // Verify URL is configured
        let _ = self.get_url()?;
        *self.connected.write().await = true;
        Ok(())
    }

    async fn send_request(&self, request: JsonRpcRequest) -> Result<JsonRpcResponse, McpError> {
        let url = self.get_url()?;

        let mut req_builder = self.client.post(url);

        // Add custom headers
        if let Some(headers) = &self.config.headers {
            for (key, value) in headers {
                req_builder = req_builder.header(key, value);
            }
        }

        // Add auth token if present
        if let Some(token) = self.auth_token.read().await.as_ref() {
            req_builder = req_builder.header("Authorization", format!("Bearer {}", token));
        }

        req_builder = req_builder.header("Content-Type", "application/json");

        let response = req_builder
            .json(&request)
            .send()
            .await
            .map_err(|e| McpError::Transport(format!("HTTP request failed: {}", e)))?;

        if !response.status().is_success() {
            return Err(McpError::Transport(format!(
                "HTTP error: {} {}",
                response.status().as_u16(),
                response.status().canonical_reason().unwrap_or("Unknown")
            )));
        }

        response
            .json::<JsonRpcResponse>()
            .await
            .map_err(|e| McpError::Serialization(format!("Failed to parse response: {}", e)))
    }

    async fn send_notification(&self, notification: JsonRpcRequest) -> Result<(), McpError> {
        // For HTTP, notifications are sent the same way as requests
        // but we don't wait for or process the response
        let _ = self.send_request(notification).await?;
        Ok(())
    }

    fn is_connected(&self) -> bool {
        self.connected.try_read().map(|g| *g).unwrap_or(false)
    }

    async fn close(&mut self) -> Result<(), McpError> {
        *self.connected.write().await = false;
        Ok(())
    }

    fn transport_type(&self) -> TransportType {
        TransportType::Http
    }
}

// ============================================================================
// SSE Transport
// ============================================================================

/// SSE (Server-Sent Events) transport for streaming MCP servers
pub struct SseTransport {
    config: TransportConfig,
    client: reqwest::Client,
    connected: Arc<RwLock<bool>>,
    auth_token: Arc<RwLock<Option<String>>>,
    event_tx: Option<mpsc::Sender<SseEvent>>,
    pending_requests: Arc<RwLock<HashMap<JsonRpcId, oneshot::Sender<JsonRpcResponse>>>>,
    post_url: Arc<RwLock<Option<String>>>,
}

#[derive(Debug, Clone)]
pub struct SseEvent {
    pub event: Option<String>,
    pub data: String,
    pub id: Option<String>,
}

impl SseTransport {
    pub fn new(config: TransportConfig) -> Result<Self, McpError> {
        let timeout = Duration::from_millis(config.timeout_ms.unwrap_or(30000));

        let client = reqwest::Client::builder()
            .timeout(timeout)
            .build()
            .map_err(|e| McpError::Transport(format!("Failed to create HTTP client: {}", e)))?;

        Ok(Self {
            config,
            client,
            connected: Arc::new(RwLock::new(false)),
            auth_token: Arc::new(RwLock::new(None)),
            event_tx: None,
            pending_requests: Arc::new(RwLock::new(HashMap::new())),
            post_url: Arc::new(RwLock::new(None)),
        })
    }

    pub async fn set_auth_token(&self, token: String) {
        *self.auth_token.write().await = Some(token);
    }

    fn get_url(&self) -> Result<&str, McpError> {
        self.config
            .url
            .as_deref()
            .ok_or_else(|| McpError::Configuration("No URL specified for SSE transport".into()))
    }

    async fn connect_sse(&mut self) -> Result<(), McpError> {
        let url = self.get_url()?.to_string();

        let mut req_builder = self.client.get(&url);
        req_builder = req_builder.header("Accept", "text/event-stream");

        if let Some(token) = self.auth_token.read().await.as_ref() {
            req_builder = req_builder.header("Authorization", format!("Bearer {}", token));
        }

        let response = req_builder
            .send()
            .await
            .map_err(|e| McpError::Transport(format!("SSE connection failed: {}", e)))?;

        if !response.status().is_success() {
            return Err(McpError::Transport(format!(
                "SSE error: {} {}",
                response.status().as_u16(),
                response.status().canonical_reason().unwrap_or("Unknown")
            )));
        }

        let (event_tx, mut event_rx) = mpsc::channel::<SseEvent>(100);
        self.event_tx = Some(event_tx.clone());

        let connected = self.connected.clone();
        let pending = self.pending_requests.clone();
        let post_url = self.post_url.clone();
        let reconnect_delay = self.config.reconnect_delay_ms.unwrap_or(1000);

        // Spawn SSE reader task
        tokio::spawn(async move {
            let mut stream = response.bytes_stream();
            let mut buffer = String::new();
            let mut current_event: Option<String> = None;
            let mut current_id: Option<String> = None;

            use futures_util::StreamExt;

            while let Some(chunk_result) = stream.next().await {
                match chunk_result {
                    Ok(chunk) => {
                        let text = String::from_utf8_lossy(&chunk);
                        buffer.push_str(&text);

                        // Process complete events
                        while let Some(idx) = buffer.find("\n\n") {
                            let event_text = buffer[..idx].to_string();
                            buffer = buffer[idx + 2..].to_string();

                            let mut data_lines = Vec::new();

                            for line in event_text.lines() {
                                if let Some(value) = line.strip_prefix("event:") {
                                    current_event = Some(value.trim().to_string());
                                } else if let Some(value) = line.strip_prefix("data:") {
                                    data_lines.push(value.trim().to_string());
                                } else if let Some(value) = line.strip_prefix("id:") {
                                    current_id = Some(value.trim().to_string());
                                }
                            }

                            if !data_lines.is_empty() {
                                let data = data_lines.join("\n");

                                // Handle endpoint event (MCP specific)
                                if current_event.as_deref() == Some("endpoint") {
                                    *post_url.write().await = Some(data.clone());
                                }
                                // Handle message events
                                else if let Ok(response) =
                                    serde_json::from_str::<JsonRpcResponse>(&data)
                                {
                                    if let Some(id) = &response.id {
                                        let mut pending_guard = pending.write().await;
                                        if let Some(sender) = pending_guard.remove(id) {
                                            let _ = sender.send(response);
                                        }
                                    }
                                }
                            }

                            current_event = None;
                            current_id = None;
                        }
                    }
                    Err(e) => {
                        eprintln!("SSE stream error: {}", e);
                        break;
                    }
                }
            }

            *connected.write().await = false;
        });

        *self.connected.write().await = true;
        Ok(())
    }
}

#[async_trait::async_trait]
impl Transport for SseTransport {
    async fn start(&mut self) -> Result<(), McpError> {
        self.connect_sse().await
    }

    async fn send_request(&self, request: JsonRpcRequest) -> Result<JsonRpcResponse, McpError> {
        let post_url = self
            .post_url
            .read()
            .await
            .clone()
            .ok_or_else(|| McpError::Transport("No POST endpoint available".into()))?;

        let id = request
            .id
            .clone()
            .ok_or_else(|| McpError::Protocol("Request must have an ID".into()))?;

        // Create response channel
        let (response_tx, response_rx) = oneshot::channel();

        {
            let mut pending = self.pending_requests.write().await;
            pending.insert(id.clone(), response_tx);
        }

        // Send request via HTTP POST
        let mut req_builder = self.client.post(&post_url);
        req_builder = req_builder.header("Content-Type", "application/json");

        if let Some(token) = self.auth_token.read().await.as_ref() {
            req_builder = req_builder.header("Authorization", format!("Bearer {}", token));
        }

        let response = req_builder
            .json(&request)
            .send()
            .await
            .map_err(|e| McpError::Transport(format!("HTTP POST failed: {}", e)))?;

        if !response.status().is_success() {
            self.pending_requests.write().await.remove(&id);
            return Err(McpError::Transport(format!(
                "HTTP error: {}",
                response.status()
            )));
        }

        // Wait for response via SSE
        let timeout = Duration::from_millis(self.config.timeout_ms.unwrap_or(30000));

        match tokio::time::timeout(timeout, response_rx).await {
            Ok(Ok(response)) => Ok(response),
            Ok(Err(_)) => Err(McpError::Transport("Response channel closed".into())),
            Err(_) => {
                self.pending_requests.write().await.remove(&id);
                Err(McpError::Timeout)
            }
        }
    }

    async fn send_notification(&self, notification: JsonRpcRequest) -> Result<(), McpError> {
        let post_url = self
            .post_url
            .read()
            .await
            .clone()
            .ok_or_else(|| McpError::Transport("No POST endpoint available".into()))?;

        let mut req_builder = self.client.post(&post_url);
        req_builder = req_builder.header("Content-Type", "application/json");

        if let Some(token) = self.auth_token.read().await.as_ref() {
            req_builder = req_builder.header("Authorization", format!("Bearer {}", token));
        }

        req_builder
            .json(&notification)
            .send()
            .await
            .map_err(|e| McpError::Transport(format!("HTTP POST failed: {}", e)))?;

        Ok(())
    }

    fn is_connected(&self) -> bool {
        self.connected.try_read().map(|g| *g).unwrap_or(false)
    }

    async fn close(&mut self) -> Result<(), McpError> {
        *self.connected.write().await = false;
        self.event_tx = None;
        self.pending_requests.write().await.clear();
        Ok(())
    }

    fn transport_type(&self) -> TransportType {
        TransportType::Sse
    }
}

// ============================================================================
// MCP Error Types
// ============================================================================

#[derive(Debug, Clone)]
pub enum McpError {
    Configuration(String),
    Transport(String),
    Protocol(String),
    Serialization(String),
    Timeout,
    NotConnected,
    NotInitialized,
    ToolNotFound(String),
    ResourceNotFound(String),
    PromptNotFound(String),
    AuthenticationRequired,
    AuthenticationFailed(String),
    PermissionDenied(String),
    ServerError(i32, String),
}

impl std::fmt::Display for McpError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            McpError::Configuration(msg) => write!(f, "Configuration error: {}", msg),
            McpError::Transport(msg) => write!(f, "Transport error: {}", msg),
            McpError::Protocol(msg) => write!(f, "Protocol error: {}", msg),
            McpError::Serialization(msg) => write!(f, "Serialization error: {}", msg),
            McpError::Timeout => write!(f, "Request timeout"),
            McpError::NotConnected => write!(f, "Not connected"),
            McpError::NotInitialized => write!(f, "Server not initialized"),
            McpError::ToolNotFound(name) => write!(f, "Tool not found: {}", name),
            McpError::ResourceNotFound(uri) => write!(f, "Resource not found: {}", uri),
            McpError::PromptNotFound(name) => write!(f, "Prompt not found: {}", name),
            McpError::AuthenticationRequired => write!(f, "Authentication required"),
            McpError::AuthenticationFailed(msg) => write!(f, "Authentication failed: {}", msg),
            McpError::PermissionDenied(msg) => write!(f, "Permission denied: {}", msg),
            McpError::ServerError(code, msg) => write!(f, "Server error {}: {}", code, msg),
        }
    }
}

impl std::error::Error for McpError {}

// ============================================================================
// OAuth Authentication
// ============================================================================

/// OAuth state for PKCE flow
#[derive(Debug, Clone)]
pub struct OAuthState {
    pub code_verifier: String,
    pub code_challenge: String,
    pub state: String,
}

/// OAuth tokens
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OAuthTokens {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub token_type: String,
    pub expires_in: Option<u64>,
    pub scope: Option<String>,
    #[serde(skip)]
    pub obtained_at: Option<Instant>,
}

impl OAuthTokens {
    pub fn is_expired(&self) -> bool {
        if let (Some(expires_in), Some(obtained_at)) = (self.expires_in, self.obtained_at) {
            obtained_at.elapsed().as_secs() >= expires_in
        } else {
            false
        }
    }
}

/// OAuth manager for MCP authentication
pub struct OAuthManager {
    config: OAuthConfig,
    tokens: RwLock<Option<OAuthTokens>>,
    state: RwLock<Option<OAuthState>>,
    http_client: reqwest::Client,
}

impl OAuthManager {
    pub fn new(config: OAuthConfig) -> Self {
        Self {
            config,
            tokens: RwLock::new(None),
            state: RwLock::new(None),
            http_client: reqwest::Client::new(),
        }
    }

    /// Generate authorization URL for OAuth flow
    pub async fn get_authorization_url(&self) -> Result<String, McpError> {
        use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine as _};
        use sha2::{Digest, Sha256};

        let state = self.generate_random_string(32);

        let (code_verifier, code_challenge) = if self.config.use_pkce {
            let verifier = self.generate_random_string(64);
            let mut hasher = Sha256::new();
            hasher.update(verifier.as_bytes());
            let challenge = URL_SAFE_NO_PAD.encode(hasher.finalize());
            (verifier, challenge)
        } else {
            (String::new(), String::new())
        };

        *self.state.write().await = Some(OAuthState {
            code_verifier: code_verifier.clone(),
            code_challenge: code_challenge.clone(),
            state: state.clone(),
        });

        let mut url = format!(
            "{}?client_id={}&redirect_uri={}&response_type=code&state={}",
            self.config.auth_url,
            urlencoding::encode(&self.config.client_id),
            urlencoding::encode(&self.config.redirect_uri),
            urlencoding::encode(&state)
        );

        if !self.config.scopes.is_empty() {
            url.push_str(&format!(
                "&scope={}",
                urlencoding::encode(&self.config.scopes.join(" "))
            ));
        }

        if self.config.use_pkce {
            url.push_str(&format!(
                "&code_challenge={}&code_challenge_method=S256",
                urlencoding::encode(&code_challenge)
            ));
        }

        Ok(url)
    }

    /// Exchange authorization code for tokens
    pub async fn exchange_code(&self, code: &str, state: &str) -> Result<OAuthTokens, McpError> {
        let oauth_state = self
            .state
            .read()
            .await
            .clone()
            .ok_or(McpError::AuthenticationFailed("No OAuth state".into()))?;

        if oauth_state.state != state {
            return Err(McpError::AuthenticationFailed("State mismatch".into()));
        }

        let mut params = vec![
            ("grant_type", "authorization_code".to_string()),
            ("code", code.to_string()),
            ("redirect_uri", self.config.redirect_uri.clone()),
            ("client_id", self.config.client_id.clone()),
        ];

        if let Some(secret) = &self.config.client_secret {
            params.push(("client_secret", secret.clone()));
        }

        if self.config.use_pkce {
            params.push(("code_verifier", oauth_state.code_verifier.clone()));
        }

        let response = self
            .http_client
            .post(&self.config.token_url)
            .form(&params)
            .send()
            .await
            .map_err(|e| McpError::AuthenticationFailed(e.to_string()))?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(McpError::AuthenticationFailed(error_text));
        }

        let mut tokens: OAuthTokens = response
            .json()
            .await
            .map_err(|e| McpError::AuthenticationFailed(e.to_string()))?;

        tokens.obtained_at = Some(Instant::now());
        *self.tokens.write().await = Some(tokens.clone());

        Ok(tokens)
    }

    /// Refresh access token
    pub async fn refresh_tokens(&self) -> Result<OAuthTokens, McpError> {
        let current = self
            .tokens
            .read()
            .await
            .clone()
            .ok_or(McpError::AuthenticationFailed(
                "No tokens to refresh".into(),
            ))?;

        let refresh_token = current
            .refresh_token
            .ok_or(McpError::AuthenticationFailed("No refresh token".into()))?;

        let mut params = vec![
            ("grant_type", "refresh_token".to_string()),
            ("refresh_token", refresh_token),
            ("client_id", self.config.client_id.clone()),
        ];

        if let Some(secret) = &self.config.client_secret {
            params.push(("client_secret", secret.clone()));
        }

        let response = self
            .http_client
            .post(&self.config.token_url)
            .form(&params)
            .send()
            .await
            .map_err(|e| McpError::AuthenticationFailed(e.to_string()))?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(McpError::AuthenticationFailed(error_text));
        }

        let mut tokens: OAuthTokens = response
            .json()
            .await
            .map_err(|e| McpError::AuthenticationFailed(e.to_string()))?;

        tokens.obtained_at = Some(Instant::now());
        *self.tokens.write().await = Some(tokens.clone());

        Ok(tokens)
    }

    /// Get current access token, refreshing if needed
    pub async fn get_access_token(&self) -> Result<String, McpError> {
        let tokens = self
            .tokens
            .read()
            .await
            .clone()
            .ok_or(McpError::AuthenticationRequired)?;

        if tokens.is_expired() {
            drop(tokens);
            let new_tokens = self.refresh_tokens().await?;
            return Ok(new_tokens.access_token);
        }

        Ok(tokens.access_token)
    }

    fn generate_random_string(&self, len: usize) -> String {
        use rand::Rng;
        const CHARSET: &[u8] =
            b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
        let mut rng = rand::thread_rng();
        (0..len)
            .map(|_| {
                let idx = rng.gen_range(0..CHARSET.len());
                CHARSET[idx] as char
            })
            .collect()
    }
}

// ============================================================================
// MCP Client
// ============================================================================

/// MCP Client for connecting to MCP servers
pub struct McpClient {
    config: McpServerConfig,
    transport: Arc<Mutex<Box<dyn Transport>>>,
    capabilities: RwLock<Option<ServerCapabilities>>,
    tools: RwLock<Vec<McpTool>>,
    resources: RwLock<Vec<McpResource>>,
    prompts: RwLock<Vec<McpPrompt>>,
    oauth: Option<OAuthManager>,
    initialized: RwLock<bool>,
    client_info: ClientInfo,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClientInfo {
    pub name: String,
    pub version: String,
}

impl Default for ClientInfo {
    fn default() -> Self {
        Self {
            name: "VoiceCode".to_string(),
            version: env!("CARGO_PKG_VERSION").to_string(),
        }
    }
}

impl McpClient {
    pub async fn new(config: McpServerConfig) -> Result<Self, McpError> {
        let transport: Box<dyn Transport> = match config.transport.transport_type {
            TransportType::Stdio => Box::new(StdioTransport::new(config.transport.clone())),
            TransportType::Http => Box::new(HttpTransport::new(config.transport.clone())?),
            TransportType::Sse => Box::new(SseTransport::new(config.transport.clone())?),
            TransportType::WebSocket => {
                return Err(McpError::Configuration(
                    "WebSocket transport not yet implemented".into(),
                ));
            }
        };

        let oauth = config.oauth.as_ref().map(|c| OAuthManager::new(c.clone()));

        Ok(Self {
            config,
            transport: Arc::new(Mutex::new(transport)),
            capabilities: RwLock::new(None),
            tools: RwLock::new(Vec::new()),
            resources: RwLock::new(Vec::new()),
            prompts: RwLock::new(Vec::new()),
            oauth,
            initialized: RwLock::new(false),
            client_info: ClientInfo::default(),
        })
    }

    /// Connect and initialize the MCP server
    pub async fn connect(&self) -> Result<(), McpError> {
        // Start transport
        {
            let mut transport = self.transport.lock().await;
            transport.start().await?;
        }

        // Set auth token if OAuth is configured
        if let Some(oauth) = &self.oauth {
            let token = oauth.get_access_token().await?;

            let transport = self.transport.lock().await;
            match transport.transport_type() {
                TransportType::Http => {
                    // Would need to downcast - simplified for now
                }
                TransportType::Sse => {
                    // Would need to downcast - simplified for now
                }
                _ => {}
            }
        }

        // Initialize
        self.initialize().await?;

        Ok(())
    }

    /// Initialize the MCP session
    async fn initialize(&self) -> Result<(), McpError> {
        let params = serde_json::json!({
            "protocolVersion": "2024-11-05",
            "capabilities": {
                "roots": {
                    "listChanged": true
                },
                "sampling": {}
            },
            "clientInfo": self.client_info
        });

        let request = JsonRpcRequest::new("initialize", Some(params));
        let response = self.send_request(request).await?;

        if let Some(error) = response.error {
            return Err(McpError::ServerError(error.code, error.message));
        }

        if let Some(result) = response.result {
            if let Ok(caps) = serde_json::from_value::<ServerCapabilities>(
                result.get("capabilities").cloned().unwrap_or_default(),
            ) {
                *self.capabilities.write().await = Some(caps);
            }
        }

        // Send initialized notification
        let notification = JsonRpcRequest::notification("notifications/initialized", None);
        self.send_notification(notification).await?;

        *self.initialized.write().await = true;

        // Discover tools, resources, prompts
        self.discover_all().await?;

        Ok(())
    }

    /// Discover all available tools, resources, and prompts
    async fn discover_all(&self) -> Result<(), McpError> {
        let caps = self.capabilities.read().await.clone().unwrap_or_default();

        // Discover tools
        if caps.tools.is_some() {
            self.list_tools().await?;
        }

        // Discover resources
        if caps.resources.is_some() {
            self.list_resources().await?;
        }

        // Discover prompts
        if caps.prompts.is_some() {
            self.list_prompts().await?;
        }

        Ok(())
    }

    /// List available tools
    pub async fn list_tools(&self) -> Result<Vec<McpTool>, McpError> {
        let request = JsonRpcRequest::new("tools/list", None);
        let response = self.send_request(request).await?;

        if let Some(error) = response.error {
            return Err(McpError::ServerError(error.code, error.message));
        }

        let tools: Vec<McpTool> = if let Some(result) = response.result {
            serde_json::from_value(result.get("tools").cloned().unwrap_or_default())
                .unwrap_or_default()
        } else {
            Vec::new()
        };

        *self.tools.write().await = tools.clone();
        Ok(tools)
    }

    /// List available resources
    pub async fn list_resources(&self) -> Result<Vec<McpResource>, McpError> {
        let request = JsonRpcRequest::new("resources/list", None);
        let response = self.send_request(request).await?;

        if let Some(error) = response.error {
            return Err(McpError::ServerError(error.code, error.message));
        }

        let resources: Vec<McpResource> = if let Some(result) = response.result {
            serde_json::from_value(result.get("resources").cloned().unwrap_or_default())
                .unwrap_or_default()
        } else {
            Vec::new()
        };

        *self.resources.write().await = resources.clone();
        Ok(resources)
    }

    /// List available prompts
    pub async fn list_prompts(&self) -> Result<Vec<McpPrompt>, McpError> {
        let request = JsonRpcRequest::new("prompts/list", None);
        let response = self.send_request(request).await?;

        if let Some(error) = response.error {
            return Err(McpError::ServerError(error.code, error.message));
        }

        let prompts: Vec<McpPrompt> = if let Some(result) = response.result {
            serde_json::from_value(result.get("prompts").cloned().unwrap_or_default())
                .unwrap_or_default()
        } else {
            Vec::new()
        };

        *self.prompts.write().await = prompts.clone();
        Ok(prompts)
    }

    /// Call a tool
    pub async fn call_tool(
        &self,
        name: &str,
        arguments: serde_json::Value,
    ) -> Result<ToolResult, McpError> {
        if !*self.initialized.read().await {
            return Err(McpError::NotInitialized);
        }

        // Verify tool exists
        let tools = self.tools.read().await;
        if !tools.iter().any(|t| t.name == name) {
            return Err(McpError::ToolNotFound(name.to_string()));
        }
        drop(tools);

        let params = serde_json::json!({
            "name": name,
            "arguments": arguments
        });

        let request = JsonRpcRequest::new("tools/call", Some(params));
        let response = self.send_request(request).await?;

        if let Some(error) = response.error {
            return Err(McpError::ServerError(error.code, error.message));
        }

        if let Some(result) = response.result {
            Ok(serde_json::from_value(result).unwrap_or_default())
        } else {
            Ok(ToolResult::default())
        }
    }

    /// Read a resource
    pub async fn read_resource(&self, uri: &str) -> Result<ResourceContent, McpError> {
        if !*self.initialized.read().await {
            return Err(McpError::NotInitialized);
        }

        let params = serde_json::json!({
            "uri": uri
        });

        let request = JsonRpcRequest::new("resources/read", Some(params));
        let response = self.send_request(request).await?;

        if let Some(error) = response.error {
            return Err(McpError::ServerError(error.code, error.message));
        }

        if let Some(result) = response.result {
            Ok(serde_json::from_value(result).unwrap_or_default())
        } else {
            Ok(ResourceContent::default())
        }
    }

    /// Get a prompt
    pub async fn get_prompt(
        &self,
        name: &str,
        arguments: Option<HashMap<String, String>>,
    ) -> Result<PromptResult, McpError> {
        if !*self.initialized.read().await {
            return Err(McpError::NotInitialized);
        }

        let params = serde_json::json!({
            "name": name,
            "arguments": arguments
        });

        let request = JsonRpcRequest::new("prompts/get", Some(params));
        let response = self.send_request(request).await?;

        if let Some(error) = response.error {
            return Err(McpError::ServerError(error.code, error.message));
        }

        if let Some(result) = response.result {
            Ok(serde_json::from_value(result).unwrap_or_default())
        } else {
            Ok(PromptResult::default())
        }
    }

    /// Send a request through the transport
    async fn send_request(&self, request: JsonRpcRequest) -> Result<JsonRpcResponse, McpError> {
        let transport = self.transport.lock().await;
        if !transport.is_connected() {
            return Err(McpError::NotConnected);
        }
        transport.send_request(request).await
    }

    /// Send a notification through the transport
    async fn send_notification(&self, notification: JsonRpcRequest) -> Result<(), McpError> {
        let transport = self.transport.lock().await;
        if !transport.is_connected() {
            return Err(McpError::NotConnected);
        }
        transport.send_notification(notification).await
    }

    /// Disconnect from the server
    pub async fn disconnect(&self) -> Result<(), McpError> {
        *self.initialized.write().await = false;
        let mut transport = self.transport.lock().await;
        transport.close().await
    }

    /// Check if connected
    pub fn is_connected(&self) -> bool {
        // Use blocking lock since this should be quick
        match self.transport.try_lock() {
            Ok(t) => t.is_connected(),
            Err(_) => false,
        }
    }

    /// Get cached tools
    pub async fn get_tools(&self) -> Vec<McpTool> {
        self.tools.read().await.clone()
    }

    /// Get cached resources
    pub async fn get_resources(&self) -> Vec<McpResource> {
        self.resources.read().await.clone()
    }

    /// Get cached prompts
    pub async fn get_prompts(&self) -> Vec<McpPrompt> {
        self.prompts.read().await.clone()
    }

    /// Get server name
    pub fn name(&self) -> &str {
        &self.config.name
    }
}

// ============================================================================
// Tool and Resource Result Types
// ============================================================================

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ToolResult {
    pub content: Vec<ContentItem>,
    #[serde(rename = "isError", default)]
    pub is_error: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum ContentItem {
    #[serde(rename = "text")]
    Text { text: String },
    #[serde(rename = "image")]
    Image { data: String, mime_type: String },
    #[serde(rename = "resource")]
    Resource { resource: EmbeddedResource },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmbeddedResource {
    pub uri: String,
    pub mime_type: Option<String>,
    pub text: Option<String>,
    pub blob: Option<String>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ResourceContent {
    pub contents: Vec<ResourceContentItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceContentItem {
    pub uri: String,
    pub mime_type: Option<String>,
    pub text: Option<String>,
    pub blob: Option<String>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct PromptResult {
    pub description: Option<String>,
    pub messages: Vec<PromptMessage>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PromptMessage {
    pub role: String,
    pub content: PromptContent,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum PromptContent {
    Text(String),
    Items(Vec<ContentItem>),
}

// ============================================================================
// MCP Server Manager
// ============================================================================

/// Manages multiple MCP server connections
pub struct McpServerManager {
    servers: RwLock<HashMap<String, Arc<McpClient>>>,
    configs: RwLock<Vec<McpServerConfig>>,
    auto_reconnect: bool,
}

impl McpServerManager {
    pub fn new() -> Self {
        Self {
            servers: RwLock::new(HashMap::new()),
            configs: RwLock::new(Vec::new()),
            auto_reconnect: true,
        }
    }

    /// Load server configurations from a file
    pub async fn load_configs(&self, path: &PathBuf) -> Result<(), McpError> {
        let content = std::fs::read_to_string(path)
            .map_err(|e| McpError::Configuration(format!("Failed to read config: {}", e)))?;

        let configs: Vec<McpServerConfig> = serde_json::from_str(&content)
            .map_err(|e| McpError::Configuration(format!("Failed to parse config: {}", e)))?;

        *self.configs.write().await = configs;
        Ok(())
    }

    /// Add a server configuration
    pub async fn add_config(&self, config: McpServerConfig) {
        self.configs.write().await.push(config);
    }

    /// Connect to a server by name
    pub async fn connect(&self, name: &str) -> Result<Arc<McpClient>, McpError> {
        // Check if already connected
        if let Some(client) = self.servers.read().await.get(name) {
            if client.is_connected() {
                return Ok(client.clone());
            }
        }

        // Find config
        let config = self
            .configs
            .read()
            .await
            .iter()
            .find(|c| c.name == name)
            .cloned()
            .ok_or_else(|| McpError::Configuration(format!("Server '{}' not configured", name)))?;

        // Create and connect client
        let client = Arc::new(McpClient::new(config).await?);
        client.connect().await?;

        self.servers
            .write()
            .await
            .insert(name.to_string(), client.clone());
        Ok(client)
    }

    /// Connect to all configured servers
    pub async fn connect_all(&self) -> Vec<Result<Arc<McpClient>, McpError>> {
        let configs = self.configs.read().await.clone();
        let mut results = Vec::new();

        for config in configs {
            if config.auto_start {
                results.push(self.connect(&config.name).await);
            }
        }

        results
    }

    /// Disconnect from a server
    pub async fn disconnect(&self, name: &str) -> Result<(), McpError> {
        if let Some(client) = self.servers.write().await.remove(name) {
            client.disconnect().await?;
        }
        Ok(())
    }

    /// Disconnect from all servers
    pub async fn disconnect_all(&self) -> Vec<Result<(), McpError>> {
        let mut results = Vec::new();
        let names: Vec<String> = self.servers.read().await.keys().cloned().collect();

        for name in names {
            results.push(self.disconnect(&name).await);
        }

        results
    }

    /// Get a connected server
    pub async fn get(&self, name: &str) -> Option<Arc<McpClient>> {
        self.servers.read().await.get(name).cloned()
    }

    /// List all connected servers
    pub async fn list_connected(&self) -> Vec<String> {
        self.servers.read().await.keys().cloned().collect()
    }

    /// List all available tools across servers
    pub async fn list_all_tools(&self) -> Vec<(String, McpTool)> {
        let mut all_tools = Vec::new();

        for (name, client) in self.servers.read().await.iter() {
            for tool in client.get_tools().await {
                all_tools.push((name.clone(), tool));
            }
        }

        all_tools
    }

    /// Call a tool on a specific server
    pub async fn call_tool(
        &self,
        server: &str,
        tool: &str,
        arguments: serde_json::Value,
    ) -> Result<ToolResult, McpError> {
        let client = self
            .get(server)
            .await
            .ok_or_else(|| McpError::NotConnected)?;

        client.call_tool(tool, arguments).await
    }

    /// Find and call a tool across all servers
    pub async fn call_tool_any(
        &self,
        tool: &str,
        arguments: serde_json::Value,
    ) -> Result<(String, ToolResult), McpError> {
        for (server, client) in self.servers.read().await.iter() {
            let tools = client.get_tools().await;
            if tools.iter().any(|t| t.name == tool) {
                let result = client.call_tool(tool, arguments).await?;
                return Ok((server.clone(), result));
            }
        }

        Err(McpError::ToolNotFound(tool.to_string()))
    }
}

impl Default for McpServerManager {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// Resource Cache
// ============================================================================

/// Cached resource with metadata
#[derive(Debug, Clone)]
pub struct CachedResource {
    pub content: ResourceContent,
    pub fetched_at: Instant,
    pub ttl: Duration,
}

impl CachedResource {
    pub fn is_expired(&self) -> bool {
        self.fetched_at.elapsed() > self.ttl
    }
}

/// Resource cache for MCP resources
pub struct ResourceCache {
    cache: RwLock<HashMap<String, CachedResource>>,
    default_ttl: Duration,
    max_size: usize,
}

impl ResourceCache {
    pub fn new(default_ttl: Duration, max_size: usize) -> Self {
        Self {
            cache: RwLock::new(HashMap::new()),
            default_ttl,
            max_size,
        }
    }

    /// Get a cached resource
    pub async fn get(&self, uri: &str) -> Option<ResourceContent> {
        let cache = self.cache.read().await;
        cache.get(uri).and_then(|r| {
            if r.is_expired() {
                None
            } else {
                Some(r.content.clone())
            }
        })
    }

    /// Store a resource in cache
    pub async fn put(&self, uri: String, content: ResourceContent, ttl: Option<Duration>) {
        let mut cache = self.cache.write().await;

        // Evict old entries if at capacity
        if cache.len() >= self.max_size {
            self.evict_expired(&mut cache);

            // If still at capacity, remove oldest
            if cache.len() >= self.max_size {
                if let Some(oldest) = cache
                    .iter()
                    .min_by_key(|(_, r)| r.fetched_at)
                    .map(|(k, _)| k.clone())
                {
                    cache.remove(&oldest);
                }
            }
        }

        cache.insert(
            uri,
            CachedResource {
                content,
                fetched_at: Instant::now(),
                ttl: ttl.unwrap_or(self.default_ttl),
            },
        );
    }

    /// Invalidate a cached resource
    pub async fn invalidate(&self, uri: &str) {
        self.cache.write().await.remove(uri);
    }

    /// Clear all cached resources
    pub async fn clear(&self) {
        self.cache.write().await.clear();
    }

    fn evict_expired(&self, cache: &mut HashMap<String, CachedResource>) {
        cache.retain(|_, r| !r.is_expired());
    }
}

impl Default for ResourceCache {
    fn default() -> Self {
        Self::new(Duration::from_secs(300), 1000)
    }
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_json_rpc_request() {
        let req = JsonRpcRequest::new("test/method", Some(serde_json::json!({"key": "value"})));
        assert_eq!(req.jsonrpc, "2.0");
        assert_eq!(req.method, "test/method");
        assert!(req.id.is_some());
    }

    #[test]
    fn test_json_rpc_notification() {
        let notif = JsonRpcRequest::notification("test/notify", None);
        assert!(notif.id.is_none());
    }

    #[test]
    fn test_transport_config_default() {
        let config = TransportConfig::default();
        assert_eq!(config.transport_type, TransportType::Stdio);
        assert_eq!(config.timeout_ms, Some(30000));
    }

    #[test]
    fn test_oauth_tokens_expiry() {
        let tokens = OAuthTokens {
            access_token: "test".to_string(),
            refresh_token: None,
            token_type: "Bearer".to_string(),
            expires_in: Some(3600),
            scope: None,
            obtained_at: Some(Instant::now()),
        };
        assert!(!tokens.is_expired());
    }

    #[tokio::test]
    async fn test_resource_cache() {
        let cache = ResourceCache::new(Duration::from_secs(60), 100);

        let content = ResourceContent {
            contents: vec![ResourceContentItem {
                uri: "test://resource".to_string(),
                mime_type: Some("text/plain".to_string()),
                text: Some("test content".to_string()),
                blob: None,
            }],
        };

        cache
            .put("test://resource".to_string(), content.clone(), None)
            .await;

        let cached = cache.get("test://resource").await;
        assert!(cached.is_some());
        assert_eq!(cached.unwrap().contents.len(), 1);

        cache.invalidate("test://resource").await;
        assert!(cache.get("test://resource").await.is_none());
    }

    #[tokio::test]
    async fn test_mcp_server_manager() {
        let manager = McpServerManager::new();

        let config = McpServerConfig {
            name: "test-server".to_string(),
            description: Some("Test server".to_string()),
            transport: TransportConfig {
                transport_type: TransportType::Stdio,
                command: Some("echo".to_string()),
                args: Some(vec!["hello".to_string()]),
                ..Default::default()
            },
            oauth: None,
            auto_start: false,
            restart_on_failure: false,
            max_restarts: 3,
        };

        manager.add_config(config).await;

        // Note: actual connection would require a real MCP server
        let connected = manager.list_connected().await;
        assert!(connected.is_empty());
    }
}
