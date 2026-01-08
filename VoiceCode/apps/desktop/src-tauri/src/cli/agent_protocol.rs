// Agent Protocol - Standard communication protocol for multi-agent collaboration
// Compatible with Claude Code, Codex, Gemini, and other CLI agents

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

/// Agent capability types
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AgentCapability {
    /// Code generation
    CodeGeneration,
    /// Code review and analysis
    CodeReview,
    /// Bug fixing
    BugFix,
    /// Refactoring
    Refactoring,
    /// Test generation
    TestGeneration,
    /// Documentation
    Documentation,
    /// Code explanation
    Explanation,
    /// File operations
    FileOperations,
    /// Terminal/shell operations
    Terminal,
    /// Git operations
    Git,
    /// Search (semantic/keyword)
    Search,
    /// Multi-file editing
    MultiFileEdit,
    /// Project scaffolding
    Scaffolding,
    /// Dependency management
    Dependencies,
    /// Code completion
    Completion,
    /// Voice input processing
    VoiceInput,
    /// Context understanding
    ContextUnderstanding,
    /// Task planning
    TaskPlanning,
    /// Agentic execution
    AgenticExecution,
    /// Custom capability
    Custom(String),
}

/// Message types in the agent protocol
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum AgentMessage {
    // Discovery & Handshake
    #[serde(rename = "agent.hello")]
    Hello {
        agent_id: String,
        agent_name: String,
        version: String,
        capabilities: Vec<AgentCapability>,
        protocol_version: String,
    },

    #[serde(rename = "agent.welcome")]
    Welcome {
        session_id: String,
        accepted: bool,
        message: Option<String>,
    },

    #[serde(rename = "agent.goodbye")]
    Goodbye {
        agent_id: String,
        reason: Option<String>,
    },

    // Task delegation
    #[serde(rename = "task.request")]
    TaskRequest {
        task_id: String,
        from_agent: String,
        to_agent: Option<String>, // None = broadcast
        task_type: TaskType,
        description: String,
        context: TaskContext,
        priority: TaskPriority,
        timeout_ms: Option<u64>,
    },

    #[serde(rename = "task.accept")]
    TaskAccept {
        task_id: String,
        agent_id: String,
        estimated_time_ms: Option<u64>,
    },

    #[serde(rename = "task.reject")]
    TaskReject {
        task_id: String,
        agent_id: String,
        reason: String,
    },

    #[serde(rename = "task.progress")]
    TaskProgress {
        task_id: String,
        agent_id: String,
        progress: f32, // 0.0 - 1.0
        status: String,
        partial_result: Option<String>,
    },

    #[serde(rename = "task.complete")]
    TaskComplete {
        task_id: String,
        agent_id: String,
        result: TaskResult,
    },

    #[serde(rename = "task.error")]
    TaskError {
        task_id: String,
        agent_id: String,
        error: String,
        recoverable: bool,
    },

    // Collaboration
    #[serde(rename = "collab.share_context")]
    ShareContext {
        from_agent: String,
        context_type: ContextType,
        content: String,
        metadata: HashMap<String, String>,
    },

    #[serde(rename = "collab.request_context")]
    RequestContext {
        from_agent: String,
        context_type: ContextType,
        query: String,
    },

    #[serde(rename = "collab.suggestion")]
    Suggestion {
        from_agent: String,
        suggestion_type: SuggestionType,
        content: String,
        confidence: f32,
        applies_to: Option<String>, // file path or task id
    },

    #[serde(rename = "collab.feedback")]
    Feedback {
        from_agent: String,
        regarding: String, // task_id or suggestion_id
        accepted: bool,
        comment: Option<String>,
    },

    // Code operations
    #[serde(rename = "code.edit")]
    CodeEdit {
        request_id: String,
        from_agent: String,
        file_path: String,
        edits: Vec<TextEdit>,
        description: String,
    },

    #[serde(rename = "code.edit_result")]
    CodeEditResult {
        request_id: String,
        success: bool,
        error: Option<String>,
    },

    #[serde(rename = "code.read")]
    CodeRead {
        request_id: String,
        from_agent: String,
        file_path: String,
        line_range: Option<(usize, usize)>,
    },

    #[serde(rename = "code.read_result")]
    CodeReadResult {
        request_id: String,
        content: Option<String>,
        error: Option<String>,
    },

    // Streaming
    #[serde(rename = "stream.start")]
    StreamStart {
        stream_id: String,
        from_agent: String,
        stream_type: StreamType,
    },

    #[serde(rename = "stream.chunk")]
    StreamChunk {
        stream_id: String,
        content: String,
        index: usize,
    },

    #[serde(rename = "stream.end")]
    StreamEnd {
        stream_id: String,
        total_chunks: usize,
    },

    // System
    #[serde(rename = "system.ping")]
    Ping { timestamp: u64 },

    #[serde(rename = "system.pong")]
    Pong { timestamp: u64 },

    #[serde(rename = "system.error")]
    Error {
        code: String,
        message: String,
        details: Option<HashMap<String, String>>,
    },
}

/// Task types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TaskType {
    GenerateCode,
    ModifyCode,
    ReviewCode,
    FixBug,
    Refactor,
    WriteTests,
    WriteDocumentation,
    ExplainCode,
    SearchCode,
    ExecuteCommand,
    GitOperation,
    CreateFile,
    DeleteFile,
    RenameFile,
    AnalyzeProject,
    PlanImplementation,
    Custom(String),
}

/// Task priority
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TaskPriority {
    Low,
    Normal,
    High,
    Critical,
}

/// Context for a task
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskContext {
    pub project_root: Option<String>,
    pub current_file: Option<String>,
    pub cursor_position: Option<(usize, usize)>,
    pub selection: Option<String>,
    pub related_files: Vec<String>,
    pub symbols: Vec<String>,
    pub conversation_history: Vec<ConversationTurn>,
    pub metadata: HashMap<String, String>,
}

impl Default for TaskContext {
    fn default() -> Self {
        Self {
            project_root: None,
            current_file: None,
            cursor_position: None,
            selection: None,
            related_files: Vec::new(),
            symbols: Vec::new(),
            conversation_history: Vec::new(),
            metadata: HashMap::new(),
        }
    }
}

/// Conversation turn
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversationTurn {
    pub role: String,
    pub content: String,
    pub timestamp: u64,
}

/// Task result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskResult {
    pub success: bool,
    pub output: Option<String>,
    pub code_changes: Vec<CodeChange>,
    pub files_created: Vec<String>,
    pub files_modified: Vec<String>,
    pub files_deleted: Vec<String>,
    pub commands_executed: Vec<String>,
    pub suggestions: Vec<String>,
    pub duration_ms: u64,
}

impl Default for TaskResult {
    fn default() -> Self {
        Self {
            success: false,
            output: None,
            code_changes: Vec::new(),
            files_created: Vec::new(),
            files_modified: Vec::new(),
            files_deleted: Vec::new(),
            commands_executed: Vec::new(),
            suggestions: Vec::new(),
            duration_ms: 0,
        }
    }
}

/// Code change
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodeChange {
    pub file_path: String,
    pub change_type: ChangeType,
    pub before: Option<String>,
    pub after: Option<String>,
    pub line_range: Option<(usize, usize)>,
}

/// Change type
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ChangeType {
    Insert,
    Delete,
    Replace,
    Create,
}

/// Text edit
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TextEdit {
    pub start_line: usize,
    pub start_col: usize,
    pub end_line: usize,
    pub end_col: usize,
    pub new_text: String,
}

/// Context type
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ContextType {
    FileContent,
    ProjectStructure,
    SymbolDefinitions,
    Dependencies,
    GitHistory,
    TestResults,
    BuildErrors,
    RuntimeLogs,
    Documentation,
    Custom(String),
}

/// Suggestion type
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SuggestionType {
    CodeImprovement,
    BugFix,
    Performance,
    Security,
    Style,
    Architecture,
    Testing,
    Documentation,
}

/// Stream type
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum StreamType {
    CodeGeneration,
    Explanation,
    Analysis,
    CommandOutput,
}

/// Agent protocol handler
pub struct AgentProtocol {
    pub agent_id: String,
    pub agent_name: String,
    pub version: String,
    pub capabilities: Vec<AgentCapability>,
    pub protocol_version: String,
}

impl AgentProtocol {
    pub const PROTOCOL_VERSION: &'static str = "1.0.0";

    pub fn new(agent_name: impl Into<String>, capabilities: Vec<AgentCapability>) -> Self {
        Self {
            agent_id: Uuid::new_v4().to_string(),
            agent_name: agent_name.into(),
            version: env!("CARGO_PKG_VERSION").to_string(),
            capabilities,
            protocol_version: Self::PROTOCOL_VERSION.to_string(),
        }
    }

    /// Create hello message
    pub fn create_hello(&self) -> AgentMessage {
        AgentMessage::Hello {
            agent_id: self.agent_id.clone(),
            agent_name: self.agent_name.clone(),
            version: self.version.clone(),
            capabilities: self.capabilities.clone(),
            protocol_version: self.protocol_version.clone(),
        }
    }

    /// Create task request
    pub fn create_task_request(
        &self,
        task_type: TaskType,
        description: impl Into<String>,
        context: TaskContext,
        to_agent: Option<String>,
    ) -> AgentMessage {
        AgentMessage::TaskRequest {
            task_id: Uuid::new_v4().to_string(),
            from_agent: self.agent_id.clone(),
            to_agent,
            task_type,
            description: description.into(),
            context,
            priority: TaskPriority::Normal,
            timeout_ms: Some(60000),
        }
    }

    /// Parse incoming message
    pub fn parse_message(json: &str) -> Result<AgentMessage, String> {
        serde_json::from_str(json).map_err(|e| format!("Failed to parse message: {}", e))
    }

    /// Serialize message to JSON
    pub fn serialize_message(message: &AgentMessage) -> Result<String, String> {
        serde_json::to_string(message).map_err(|e| format!("Failed to serialize message: {}", e))
    }

    /// Check if agent has capability
    pub fn has_capability(&self, capability: &AgentCapability) -> bool {
        self.capabilities.contains(capability)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_protocol_creation() {
        let protocol = AgentProtocol::new(
            "TestAgent",
            vec![AgentCapability::CodeGeneration, AgentCapability::CodeReview],
        );

        assert!(!protocol.agent_id.is_empty());
        assert_eq!(protocol.agent_name, "TestAgent");
        assert!(protocol.has_capability(&AgentCapability::CodeGeneration));
        assert!(!protocol.has_capability(&AgentCapability::BugFix));
    }

    #[test]
    fn test_message_serialization() {
        let msg = AgentMessage::Ping { timestamp: 12345 };

        let json = AgentProtocol::serialize_message(&msg).unwrap();
        let parsed = AgentProtocol::parse_message(&json).unwrap();

        if let AgentMessage::Ping { timestamp } = parsed {
            assert_eq!(timestamp, 12345);
        } else {
            panic!("Wrong message type");
        }
    }

    #[test]
    fn test_task_request_creation() {
        let protocol = AgentProtocol::new("Test", vec![]);
        let msg = protocol.create_task_request(
            TaskType::GenerateCode,
            "Create a function",
            TaskContext::default(),
            None,
        );

        if let AgentMessage::TaskRequest {
            task_type,
            description,
            ..
        } = msg
        {
            assert!(matches!(task_type, TaskType::GenerateCode));
            assert_eq!(description, "Create a function");
        } else {
            panic!("Wrong message type");
        }
    }
}
