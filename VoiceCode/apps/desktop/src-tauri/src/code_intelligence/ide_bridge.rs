#![allow(dead_code, unused_variables, unused_imports, unused_assignments)]
// Phase 6: IDE IPC Integration
// WebSocket server for communication with IDE extensions

use std::collections::HashMap;
use std::net::SocketAddr;
use std::sync::Arc;
use serde::{Deserialize, Serialize};
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::{RwLock, broadcast};
use tokio_tungstenite::{accept_async, tungstenite::Message as WsMessage};
use futures_util::{StreamExt, SinkExt};
use uuid::Uuid;

/// IDE client connection
#[derive(Debug, Clone)]
pub struct IDEClient {
    pub id: String,
    pub client_type: IDEType,
    pub capabilities: Vec<Capability>,
    pub connected_at: u64,
    pub last_ping: u64,
}

/// Type of IDE client
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum IDEType {
    VSCode,
    JetBrains,
    Neovim,
    Sublime,
    Emacs,
    Unknown,
}

/// Client capabilities
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum Capability {
    /// Can receive text insertions
    TextInsertion,
    /// Can execute commands
    CommandExecution,
    /// Supports code actions
    CodeActions,
    /// Can provide file content
    FileProvider,
    /// Supports diagnostics
    Diagnostics,
    /// Can show notifications
    Notifications,
    /// Supports multi-cursor
    MultiCursor,
    /// Can refactor code
    Refactoring,
}

/// Protocol message types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum ProtocolMessage {
    // Connection messages
    #[serde(rename = "hello")]
    Hello {
        client_id: String,
        client_type: IDEType,
        capabilities: Vec<Capability>,
        version: String,
    },

    #[serde(rename = "welcome")]
    Welcome {
        session_id: String,
        server_version: String,
    },

    #[serde(rename = "ping")]
    Ping { timestamp: u64 },

    #[serde(rename = "pong")]
    Pong { timestamp: u64 },

    // Context messages
    #[serde(rename = "context_update")]
    ContextUpdate {
        file_path: String,
        cursor_line: usize,
        cursor_col: usize,
        selection: Option<String>,
        visible_range: Option<(usize, usize)>,
        language: String,
    },

    #[serde(rename = "file_content")]
    FileContent {
        request_id: String,
        file_path: String,
        content: String,
        version: u64,
    },

    #[serde(rename = "request_file")]
    RequestFile {
        request_id: String,
        file_path: String,
    },

    // Voice/Command messages
    #[serde(rename = "voice_command")]
    VoiceCommand {
        command_id: String,
        transcript: String,
        confidence: f32,
    },

    #[serde(rename = "command_result")]
    CommandResult {
        command_id: String,
        success: bool,
        message: Option<String>,
    },

    // Code editing messages
    #[serde(rename = "insert_text")]
    InsertText {
        request_id: String,
        text: String,
        position: Option<Position>,
        replace_selection: bool,
    },

    #[serde(rename = "apply_edit")]
    ApplyEdit {
        request_id: String,
        edits: Vec<TextEdit>,
    },

    #[serde(rename = "edit_applied")]
    EditApplied {
        request_id: String,
        success: bool,
        error: Option<String>,
    },

    // Code action messages
    #[serde(rename = "code_action")]
    CodeAction {
        action_id: String,
        action_type: CodeActionType,
        target: Option<String>,
        parameters: HashMap<String, String>,
    },

    #[serde(rename = "action_result")]
    ActionResult {
        action_id: String,
        success: bool,
        output: Option<String>,
        error: Option<String>,
    },

    // Navigation messages
    #[serde(rename = "goto")]
    Goto {
        request_id: String,
        target: GotoTarget,
    },

    #[serde(rename = "goto_result")]
    GotoResult {
        request_id: String,
        success: bool,
        location: Option<Location>,
    },

    // Completion messages
    #[serde(rename = "completion_request")]
    CompletionRequest {
        request_id: String,
        prefix: String,
        context: String,
    },

    #[serde(rename = "completion_response")]
    CompletionResponse {
        request_id: String,
        completions: Vec<CompletionItem>,
    },

    // Streaming messages
    #[serde(rename = "stream_start")]
    StreamStart {
        stream_id: String,
        total_expected: Option<usize>,
    },

    #[serde(rename = "stream_chunk")]
    StreamChunk {
        stream_id: String,
        chunk: String,
        index: usize,
    },

    #[serde(rename = "stream_end")]
    StreamEnd {
        stream_id: String,
        total_chunks: usize,
    },

    // Error message
    #[serde(rename = "error")]
    Error {
        code: String,
        message: String,
        request_id: Option<String>,
    },
}

/// Position in a file
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    pub line: usize,
    pub character: usize,
}

/// Range in a file
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Range {
    pub start: Position,
    pub end: Position,
}

/// Location (file + position)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Location {
    pub file_path: String,
    pub range: Range,
}

/// Text edit
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TextEdit {
    pub range: Range,
    pub new_text: String,
}

/// Code action types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CodeActionType {
    Format,
    Refactor,
    QuickFix,
    Extract,
    Inline,
    Rename,
    OrganizeImports,
    GenerateCode,
}

/// Goto target
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum GotoTarget {
    Definition(String),
    References(String),
    TypeDefinition(String),
    Implementation(String),
    File(String),
    Line(usize),
    Symbol(String),
}

/// Completion item
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompletionItem {
    pub label: String,
    pub kind: CompletionKind,
    pub detail: Option<String>,
    pub insert_text: String,
    pub documentation: Option<String>,
}

/// Completion item kind
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CompletionKind {
    Text,
    Method,
    Function,
    Constructor,
    Field,
    Variable,
    Class,
    Interface,
    Module,
    Property,
    Keyword,
    Snippet,
}

/// IDE Bridge server configuration
#[derive(Debug, Clone)]
pub struct BridgeConfig {
    /// Server address
    pub address: String,
    /// Server port
    pub port: u16,
    /// Maximum clients
    pub max_clients: usize,
    /// Ping interval in seconds
    pub ping_interval_secs: u64,
    /// Connection timeout in seconds
    pub connection_timeout_secs: u64,
}

impl Default for BridgeConfig {
    fn default() -> Self {
        Self {
            address: "127.0.0.1".to_string(),
            port: 9876,
            max_clients: 10,
            ping_interval_secs: 30,
            connection_timeout_secs: 60,
        }
    }
}

/// IDE Bridge server
pub struct IDEBridge {
    config: BridgeConfig,
    clients: Arc<RwLock<HashMap<String, IDEClient>>>,
    message_tx: broadcast::Sender<(String, ProtocolMessage)>,
    command_handlers: Arc<RwLock<HashMap<String, CommandHandler>>>,
}

type CommandHandler = Box<dyn Fn(ProtocolMessage) -> Option<ProtocolMessage> + Send + Sync>;

impl IDEBridge {
    pub fn new(config: BridgeConfig) -> Self {
        let (tx, _) = broadcast::channel(1000);
        Self {
            config,
            clients: Arc::new(RwLock::new(HashMap::new())),
            message_tx: tx,
            command_handlers: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Start the WebSocket server
    pub async fn start(&self) -> Result<(), String> {
        let addr = format!("{}:{}", self.config.address, self.config.port);
        let listener = TcpListener::bind(&addr).await
            .map_err(|e| format!("Failed to bind: {}", e))?;

        tracing::info!("IDE Bridge listening on {}", addr);

        let clients = self.clients.clone();
        let message_tx = self.message_tx.clone();
        let handlers = self.command_handlers.clone();
        let max_clients = self.config.max_clients;

        tokio::spawn(async move {
            while let Ok((stream, addr)) = listener.accept().await {
                let clients = clients.clone();
                let tx = message_tx.clone();
                let handlers = handlers.clone();

                // Check max clients
                if clients.read().await.len() >= max_clients {
                    tracing::warn!("Max clients reached, rejecting connection from {}", addr);
                    continue;
                }

                tokio::spawn(async move {
                    if let Err(e) = handle_connection(stream, addr, clients, tx, handlers).await {
                        tracing::error!("Connection error: {}", e);
                    }
                });
            }
        });

        Ok(())
    }

    /// Send message to a specific client
    pub async fn send_to_client(&self, client_id: &str, message: ProtocolMessage) -> Result<(), String> {
        self.message_tx.send((client_id.to_string(), message))
            .map_err(|e| format!("Failed to send message: {}", e))?;
        Ok(())
    }

    /// Broadcast message to all clients
    pub async fn broadcast(&self, message: ProtocolMessage) -> Result<(), String> {
        let clients = self.clients.read().await;
        for client_id in clients.keys() {
            self.message_tx.send((client_id.clone(), message.clone()))
                .map_err(|e| format!("Failed to broadcast: {}", e))?;
        }
        Ok(())
    }

    /// Send message to clients with specific capability
    pub async fn send_to_capable(&self, capability: Capability, message: ProtocolMessage) -> Result<(), String> {
        let clients = self.clients.read().await;
        for (id, client) in clients.iter() {
            if client.capabilities.contains(&capability) {
                self.message_tx.send((id.clone(), message.clone()))
                    .map_err(|e| format!("Failed to send: {}", e))?;
            }
        }
        Ok(())
    }

    /// Get connected clients
    pub async fn get_clients(&self) -> Vec<IDEClient> {
        self.clients.read().await.values().cloned().collect()
    }

    /// Register command handler
    pub async fn register_handler<F>(&self, command: &str, handler: F)
    where
        F: Fn(ProtocolMessage) -> Option<ProtocolMessage> + Send + Sync + 'static,
    {
        self.command_handlers.write().await
            .insert(command.to_string(), Box::new(handler));
    }

    /// Insert text at current cursor in active IDE
    pub async fn insert_text(&self, text: &str, replace_selection: bool) -> Result<(), String> {
        let message = ProtocolMessage::InsertText {
            request_id: Uuid::new_v4().to_string(),
            text: text.to_string(),
            position: None,
            replace_selection,
        };

        self.send_to_capable(Capability::TextInsertion, message).await
    }

    /// Apply code edits
    pub async fn apply_edits(&self, edits: Vec<TextEdit>) -> Result<(), String> {
        let message = ProtocolMessage::ApplyEdit {
            request_id: Uuid::new_v4().to_string(),
            edits,
        };

        self.send_to_capable(Capability::TextInsertion, message).await
    }

    /// Request file content from IDE
    pub async fn request_file(&self, file_path: &str) -> Result<(), String> {
        let message = ProtocolMessage::RequestFile {
            request_id: Uuid::new_v4().to_string(),
            file_path: file_path.to_string(),
        };

        self.send_to_capable(Capability::FileProvider, message).await
    }

    /// Navigate to location
    pub async fn goto(&self, target: GotoTarget) -> Result<(), String> {
        let message = ProtocolMessage::Goto {
            request_id: Uuid::new_v4().to_string(),
            target,
        };

        self.broadcast(message).await
    }

    /// Execute code action
    pub async fn code_action(&self, action_type: CodeActionType, target: Option<String>) -> Result<(), String> {
        let message = ProtocolMessage::CodeAction {
            action_id: Uuid::new_v4().to_string(),
            action_type,
            target,
            parameters: HashMap::new(),
        };

        self.send_to_capable(Capability::CodeActions, message).await
    }

    /// Start streaming text
    pub async fn start_stream(&self, stream_id: &str, total: Option<usize>) -> Result<(), String> {
        let message = ProtocolMessage::StreamStart {
            stream_id: stream_id.to_string(),
            total_expected: total,
        };

        self.broadcast(message).await
    }

    /// Send stream chunk
    pub async fn send_chunk(&self, stream_id: &str, chunk: &str, index: usize) -> Result<(), String> {
        let message = ProtocolMessage::StreamChunk {
            stream_id: stream_id.to_string(),
            chunk: chunk.to_string(),
            index,
        };

        self.broadcast(message).await
    }

    /// End stream
    pub async fn end_stream(&self, stream_id: &str, total: usize) -> Result<(), String> {
        let message = ProtocolMessage::StreamEnd {
            stream_id: stream_id.to_string(),
            total_chunks: total,
        };

        self.broadcast(message).await
    }
}

/// Handle a single client connection
async fn handle_connection(
    stream: TcpStream,
    addr: SocketAddr,
    clients: Arc<RwLock<HashMap<String, IDEClient>>>,
    message_tx: broadcast::Sender<(String, ProtocolMessage)>,
    handlers: Arc<RwLock<HashMap<String, CommandHandler>>>,
) -> Result<(), String> {
    let ws_stream = accept_async(stream).await
        .map_err(|e| format!("WebSocket handshake failed: {}", e))?;

    let (mut ws_sender, mut ws_receiver) = ws_stream.split();
    let mut message_rx = message_tx.subscribe();

    let client_id = Uuid::new_v4().to_string();
    let mut registered = false;

    tracing::info!("New connection from {} (pending registration)", addr);

    loop {
        tokio::select! {
            // Handle incoming messages from client
            msg = ws_receiver.next() => {
                match msg {
                    Some(Ok(WsMessage::Text(text))) => {
                        match serde_json::from_str::<ProtocolMessage>(&text) {
                            Ok(message) => {
                                match &message {
                                    ProtocolMessage::Hello { client_type, capabilities, .. } => {
                                        // Register client
                                        let client = IDEClient {
                                            id: client_id.clone(),
                                            client_type: client_type.clone(),
                                            capabilities: capabilities.clone(),
                                            connected_at: std::time::SystemTime::now()
                                                .duration_since(std::time::UNIX_EPOCH)
                                                .unwrap_or_default()
                                                .as_secs(),
                                            last_ping: 0,
                                        };
                                        clients.write().await.insert(client_id.clone(), client);
                                        registered = true;

                                        // Send welcome
                                        let welcome = ProtocolMessage::Welcome {
                                            session_id: client_id.clone(),
                                            server_version: "1.0.0".to_string(),
                                        };
                                        if let Ok(json) = serde_json::to_string(&welcome) {
                                            let _ = ws_sender.send(WsMessage::Text(json.into())).await;
                                        }

                                        tracing::info!("Client {} registered as {:?}", client_id, client_type);
                                    }
                                    ProtocolMessage::Ping { timestamp } => {
                                        let pong = ProtocolMessage::Pong { timestamp: *timestamp };
                                        if let Ok(json) = serde_json::to_string(&pong) {
                                            let _ = ws_sender.send(WsMessage::Text(json.into())).await;
                                        }

                                        // Update last ping
                                        if let Some(client) = clients.write().await.get_mut(&client_id) {
                                            client.last_ping = *timestamp;
                                        }
                                    }
                                    _ => {
                                        // Handle other messages through handlers
                                        let handlers = handlers.read().await;
                                        let msg_type = match &message {
                                            ProtocolMessage::VoiceCommand { .. } => "voice_command",
                                            ProtocolMessage::ContextUpdate { .. } => "context_update",
                                            ProtocolMessage::FileContent { .. } => "file_content",
                                            ProtocolMessage::EditApplied { .. } => "edit_applied",
                                            ProtocolMessage::ActionResult { .. } => "action_result",
                                            ProtocolMessage::GotoResult { .. } => "goto_result",
                                            ProtocolMessage::CompletionResponse { .. } => "completion_response",
                                            _ => "unknown",
                                        };

                                        if let Some(handler) = handlers.get(msg_type) {
                                            if let Some(response) = handler(message) {
                                                if let Ok(json) = serde_json::to_string(&response) {
                                                    let _ = ws_sender.send(WsMessage::Text(json.into())).await;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            Err(e) => {
                                let error = ProtocolMessage::Error {
                                    code: "PARSE_ERROR".to_string(),
                                    message: format!("Failed to parse message: {}", e),
                                    request_id: None,
                                };
                                if let Ok(json) = serde_json::to_string(&error) {
                                    let _ = ws_sender.send(WsMessage::Text(json.into())).await;
                                }
                            }
                        }
                    }
                    Some(Ok(WsMessage::Close(_))) | None => {
                        break;
                    }
                    Some(Err(e)) => {
                        tracing::error!("WebSocket error: {}", e);
                        break;
                    }
                    _ => {}
                }
            }

            // Handle outgoing messages to this client
            msg = message_rx.recv() => {
                if let Ok((target_id, message)) = msg {
                    if target_id == client_id || target_id == "*" {
                        let json = match serde_json::to_string(&message) {
                            Ok(j) => j,
                            Err(_) => break,
                        };
                        if ws_sender.send(WsMessage::Text(json.into())).await.is_err() {
                            break;
                        }
                    }
                }
            }
        }
    }

    // Cleanup
    clients.write().await.remove(&client_id);
    tracing::info!("Client {} disconnected", client_id);

    Ok(())
}

// Tauri commands for IDE bridge

#[tauri::command]
pub async fn start_ide_bridge(port: Option<u16>) -> Result<String, String> {
    let config = BridgeConfig {
        port: port.unwrap_or(9876),
        ..Default::default()
    };

    let bridge = IDEBridge::new(config.clone());
    bridge.start().await?;

    Ok(format!("IDE Bridge started on port {}", config.port))
}

#[tauri::command]
pub async fn get_connected_ides() -> Result<Vec<IDEClient>, String> {
    // Would need access to the bridge instance
    Err("Bridge instance not available in this context".to_string())
}

#[tauri::command]
pub async fn send_to_ide(client_id: String, message_type: String, payload: String) -> Result<(), String> {
    // Would need access to the bridge instance
    Err("Bridge instance not available in this context".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_protocol_message_serialization() {
        let msg = ProtocolMessage::Hello {
            client_id: "test".to_string(),
            client_type: IDEType::VSCode,
            capabilities: vec![Capability::TextInsertion],
            version: "1.0.0".to_string(),
        };

        let json = serde_json::to_string(&msg).unwrap();
        assert!(json.contains("hello"));
        assert!(json.contains("VSCode"));
    }

    #[test]
    fn test_text_edit() {
        let edit = TextEdit {
            range: Range {
                start: Position { line: 1, character: 0 },
                end: Position { line: 1, character: 10 },
            },
            new_text: "replaced".to_string(),
        };

        let json = serde_json::to_string(&edit).unwrap();
        let parsed: TextEdit = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.new_text, "replaced");
    }

    #[test]
    fn test_bridge_config_default() {
        let config = BridgeConfig::default();
        assert_eq!(config.port, 9876);
        assert_eq!(config.max_clients, 10);
    }
}
