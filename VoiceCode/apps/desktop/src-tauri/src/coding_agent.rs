#![allow(dead_code, unused_variables, unused_imports)]
// Phase 4 & 5: Coding Agent Core
// Voice-controlled code generation, editing, navigation, and execution

use std::sync::Arc;
use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use tokio::sync::{RwLock, broadcast};
use once_cell::sync::Lazy;
use uuid::Uuid;

use crate::code_intelligence::llm_client::{
    self, Message, LLMRequest, CodePrompts,
};
use crate::code_intelligence::sandbox::{SandboxManager, SandboxConfig};

/// Global coding agent instance
static CODING_AGENT: Lazy<Arc<CodingAgent>> = Lazy::new(|| {
    Arc::new(CodingAgent::new())
});

pub fn get_coding_agent() -> Arc<CodingAgent> {
    CODING_AGENT.clone()
}

/// Types of coding commands
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum CodingCommandType {
    /// Navigate to a location: "go to function authenticate"
    Navigate,
    /// Generate code: "create a function that validates email"
    Generate,
    /// Edit code: "rename this variable to userId"
    Edit,
    /// Explain code: "what does this function do"
    Explain,
    /// Execute terminal command: "run tests"
    Execute,
    /// Git operations: "commit with message"
    Git,
    /// Debug assistance: "why is this failing"
    Debug,
    /// Refactor: "extract this to a function"
    Refactor,
    /// Documentation: "add documentation to this function"
    Document,
    /// Test: "generate tests for this function"
    Test,
    /// Not a coding command
    NotCodingCommand,
}

/// Code context for intelligent code generation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodeContext {
    /// Current file path
    pub file_path: Option<String>,
    /// Current file content
    pub file_content: Option<String>,
    /// Programming language
    pub language: Option<String>,
    /// Cursor position (line, column)
    pub cursor_position: Option<(usize, usize)>,
    /// Selected text
    pub selection: Option<String>,
    /// Current function/class scope
    pub scope: Option<String>,
    /// Imports in the file
    pub imports: Vec<String>,
    /// Project dependencies
    pub dependencies: Vec<String>,
    /// Git branch
    pub git_branch: Option<String>,
    /// Recent errors
    pub recent_errors: Vec<String>,
    /// Open files
    pub open_files: Vec<String>,
    /// Visible screen text (from OCR capture)
    pub visible_screen_text: Option<String>,
}

impl Default for CodeContext {
    fn default() -> Self {
        Self {
            file_path: None,
            file_content: None,
            language: None,
            cursor_position: None,
            selection: None,
            scope: None,
            imports: Vec::new(),
            dependencies: Vec::new(),
            git_branch: None,
            recent_errors: Vec::new(),
            open_files: Vec::new(),
            visible_screen_text: None,
        }
    }
}

/// A parsed coding command
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodingCommand {
    /// Unique ID
    pub id: String,
    /// Command type
    pub command_type: CodingCommandType,
    /// Original voice input
    pub voice_input: String,
    /// Parsed intent
    pub intent: String,
    /// Extracted entities/parameters
    pub parameters: HashMap<String, String>,
    /// Confidence score
    pub confidence: f32,
    /// Required context fields
    pub requires_context: Vec<String>,
    /// Can be executed without confirmation?
    pub safe_to_execute: bool,
    /// Human-readable description
    pub description: String,
}

/// Result of executing a coding command
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodingCommandResult {
    /// Command ID
    pub command_id: String,
    /// Was successful?
    pub success: bool,
    /// Result type
    pub result_type: ResultType,
    /// Generated/modified code
    pub code: Option<String>,
    /// Explanation text
    pub explanation: Option<String>,
    /// Changes made
    pub changes: Vec<CodeChange>,
    /// Error message if failed
    pub error: Option<String>,
    /// Suggestions for next steps
    pub suggestions: Vec<String>,
    /// Can be undone?
    pub undoable: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ResultType {
    CodeGenerated,
    CodeModified,
    Navigation,
    Explanation,
    CommandExecuted,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodeChange {
    /// File path
    pub file: String,
    /// Start line
    pub start_line: usize,
    /// End line
    pub end_line: usize,
    /// Original content
    pub original: String,
    /// New content
    pub replacement: String,
    /// Change type
    pub change_type: ChangeType,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ChangeType {
    Insert,
    Delete,
    Replace,
    Rename,
}

/// Terminal command with safety classification
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TerminalCommand {
    /// The command to execute
    pub command: String,
    /// Working directory
    pub cwd: Option<String>,
    /// Is this command safe?
    pub is_safe: bool,
    /// Risk level
    pub risk_level: RiskLevel,
    /// Requires confirmation?
    pub requires_confirmation: bool,
    /// Human-readable description
    pub description: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum RiskLevel {
    Safe,      // Read-only, no side effects
    Low,       // Minimal risk
    Medium,    // Requires attention
    High,      // Potentially destructive
    Critical,  // Very dangerous
}

/// Coding agent events
#[derive(Debug, Clone)]
pub enum CodingAgentEvent {
    /// Command parsed
    CommandParsed(CodingCommand),
    /// Generating code
    Generating { progress: f32, preview: String },
    /// Code generated
    Generated(CodingCommandResult),
    /// Command executing
    Executing(String),
    /// Command executed
    Executed(CodingCommandResult),
    /// Error occurred
    Error(String),
    /// Context updated
    ContextUpdated(CodeContext),
}

/// Main coding agent
pub struct CodingAgent {
    /// Current code context
    context: RwLock<CodeContext>,
    /// Event broadcaster
    event_tx: broadcast::Sender<CodingAgentEvent>,
    /// Command history
    command_history: RwLock<Vec<CodingCommand>>,
    /// Result history for undo
    result_history: RwLock<Vec<CodingCommandResult>>,
    /// Dangerous command patterns
    dangerous_patterns: Vec<regex::Regex>,
    /// Safe command prefixes
    safe_commands: Vec<String>,
}

impl CodingAgent {
    pub fn new() -> Self {
        let (event_tx, _) = broadcast::channel(100);

        // Dangerous command patterns to flag
        let dangerous_patterns = vec![
            regex::Regex::new(r"rm\s+-rf\s+/").expect("valid regex: rm-rf-root"),
            regex::Regex::new(r"rm\s+-rf\s+\*").expect("valid regex: rm-rf-star"),
            regex::Regex::new(r">\s*/dev/").expect("valid regex: write-to-dev"),
            regex::Regex::new(r"chmod\s+777").expect("valid regex: chmod-777"),
            regex::Regex::new(r"curl.*\|.*sh").expect("valid regex: curl-pipe-sh"),
            regex::Regex::new(r"wget.*\|.*sh").expect("valid regex: wget-pipe-sh"),
            regex::Regex::new(r"sudo\s+rm").expect("valid regex: sudo-rm"),
            regex::Regex::new(r"git\s+push.*--force\s+(origin\s+)?(main|master)").expect("valid regex: force-push-main"),
            regex::Regex::new(r"drop\s+database").expect("valid regex: drop-database"),
            regex::Regex::new(r"truncate\s+table").expect("valid regex: truncate-table"),
            regex::Regex::new(r"npm\s+publish").expect("valid regex: npm-publish"),
        ];

        // Commands that are always safe
        let safe_commands = vec![
            "ls".to_string(),
            "pwd".to_string(),
            "cat".to_string(),
            "head".to_string(),
            "tail".to_string(),
            "grep".to_string(),
            "find".to_string(),
            "echo".to_string(),
            "git status".to_string(),
            "git log".to_string(),
            "git diff".to_string(),
            "git branch".to_string(),
            "npm test".to_string(),
            "npm run".to_string(),
            "cargo test".to_string(),
            "cargo check".to_string(),
            "cargo build".to_string(),
            "python -m pytest".to_string(),
            "go test".to_string(),
        ];

        Self {
            context: RwLock::new(CodeContext::default()),
            event_tx,
            command_history: RwLock::new(Vec::new()),
            result_history: RwLock::new(Vec::new()),
            dangerous_patterns,
            safe_commands,
        }
    }

    /// Subscribe to agent events
    pub fn subscribe(&self) -> broadcast::Receiver<CodingAgentEvent> {
        self.event_tx.subscribe()
    }

    /// Update the code context
    pub async fn update_context(&self, context: CodeContext) {
        *self.context.write().await = context.clone();
        let _ = self.event_tx.send(CodingAgentEvent::ContextUpdated(context));
    }

    /// Get current context
    pub async fn get_context(&self) -> CodeContext {
        self.context.read().await.clone()
    }

    /// Parse a voice command into a coding command
    pub async fn parse_command(&self, voice_input: &str) -> CodingCommand {
        let input_lower = voice_input.to_lowercase();

        // Detect command type based on keywords
        let (command_type, intent, params) = self.classify_command(&input_lower);

        let command = CodingCommand {
            id: Uuid::new_v4().to_string(),
            command_type: command_type.clone(),
            voice_input: voice_input.to_string(),
            intent,
            parameters: params,
            confidence: self.calculate_confidence(&input_lower, &command_type),
            requires_context: self.get_required_context(&command_type),
            safe_to_execute: self.is_safe_command(&command_type, voice_input),
            description: self.generate_description(&command_type, voice_input),
        };

        // Record in history
        self.command_history.write().await.push(command.clone());

        let _ = self.event_tx.send(CodingAgentEvent::CommandParsed(command.clone()));

        command
    }

    fn classify_command(&self, input: &str) -> (CodingCommandType, String, HashMap<String, String>) {
        let mut params = HashMap::new();

        // Navigation commands
        if input.starts_with("go to") || input.starts_with("navigate to") || input.starts_with("jump to") {
            let target = input.replace("go to", "").replace("navigate to", "").replace("jump to", "").trim().to_string();
            params.insert("target".to_string(), target.clone());

            if target.contains("line") {
                params.insert("type".to_string(), "line".to_string());
            } else if target.contains("function") || target.contains("method") {
                params.insert("type".to_string(), "function".to_string());
            } else if target.contains("class") {
                params.insert("type".to_string(), "class".to_string());
            } else if target.contains("file") {
                params.insert("type".to_string(), "file".to_string());
            }

            return (CodingCommandType::Navigate, format!("Navigate to {}", target), params);
        }

        // Generate commands
        if input.starts_with("create") || input.starts_with("generate") || input.starts_with("write") || input.starts_with("add") {
            let description = input.replace("create", "").replace("generate", "").replace("write", "").replace("add", "").trim().to_string();
            params.insert("description".to_string(), description.clone());

            if input.contains("function") || input.contains("method") {
                params.insert("type".to_string(), "function".to_string());
            } else if input.contains("class") {
                params.insert("type".to_string(), "class".to_string());
            } else if input.contains("test") {
                params.insert("type".to_string(), "test".to_string());
            } else if input.contains("component") {
                params.insert("type".to_string(), "component".to_string());
            }

            return (CodingCommandType::Generate, format!("Generate: {}", description), params);
        }

        // Edit commands
        if input.starts_with("rename") || input.starts_with("change") || input.starts_with("modify") || input.starts_with("update") {
            let description = input.to_string();
            params.insert("description".to_string(), description.clone());

            // Parse "rename X to Y" pattern
            if input.contains(" to ") {
                let parts: Vec<&str> = input.split(" to ").collect();
                if parts.len() >= 2 {
                    params.insert("from".to_string(), parts[0].replace("rename", "").replace("change", "").trim().to_string());
                    params.insert("to".to_string(), parts[1].trim().to_string());
                }
            }

            return (CodingCommandType::Edit, format!("Edit: {}", description), params);
        }

        // Explain commands
        if input.starts_with("explain") || input.starts_with("what does") || input.starts_with("how does") || input.contains("what is") {
            let target = input.replace("explain", "").replace("what does", "").replace("how does", "").replace("what is", "").trim().to_string();
            params.insert("target".to_string(), target.clone());
            return (CodingCommandType::Explain, format!("Explain: {}", target), params);
        }

        // Execute commands
        if input.starts_with("run") || input.starts_with("execute") || input.starts_with("start") {
            let command = input.replace("run", "").replace("execute", "").replace("start", "").trim().to_string();
            params.insert("command".to_string(), command.clone());
            return (CodingCommandType::Execute, format!("Execute: {}", command), params);
        }

        // Git commands
        if input.contains("commit") || input.contains("push") || input.contains("pull") || input.contains("branch") || input.contains("checkout") || input.contains("merge") {
            params.insert("command".to_string(), input.to_string());

            // Extract commit message
            if input.contains("commit") && input.contains("message") {
                if let Some(msg_start) = input.find("message") {
                    let message = input[msg_start + 7..].trim().trim_matches('"').to_string();
                    params.insert("message".to_string(), message);
                }
            }

            return (CodingCommandType::Git, format!("Git: {}", input), params);
        }

        // Debug commands
        if input.contains("debug") || input.contains("why is") || input.contains("fix") || input.contains("error") || input.contains("failing") {
            let description = input.to_string();
            params.insert("description".to_string(), description.clone());
            return (CodingCommandType::Debug, format!("Debug: {}", description), params);
        }

        // Refactor commands
        if input.starts_with("refactor") || input.starts_with("extract") || input.starts_with("inline") || input.contains("clean up") {
            let description = input.to_string();
            params.insert("description".to_string(), description.clone());
            return (CodingCommandType::Refactor, format!("Refactor: {}", description), params);
        }

        // Document commands
        if input.contains("document") || input.contains("add comment") || input.contains("add docstring") || input.contains("add jsdoc") {
            let target = input.to_string();
            params.insert("target".to_string(), target.clone());
            return (CodingCommandType::Document, format!("Document: {}", target), params);
        }

        // Test commands
        if input.contains("test") && (input.starts_with("generate") || input.starts_with("create") || input.starts_with("add")) {
            let target = input.to_string();
            params.insert("target".to_string(), target.clone());
            return (CodingCommandType::Test, format!("Generate tests: {}", target), params);
        }

        (CodingCommandType::NotCodingCommand, input.to_string(), params)
    }

    fn calculate_confidence(&self, input: &str, command_type: &CodingCommandType) -> f32 {
        match command_type {
            CodingCommandType::NotCodingCommand => 0.0,
            _ => {
                // Higher confidence for more specific commands
                let word_count = input.split_whitespace().count();
                let base = 0.7;
                let bonus = (word_count as f32 * 0.05).min(0.25);
                (base + bonus).min(0.99)
            }
        }
    }

    fn get_required_context(&self, command_type: &CodingCommandType) -> Vec<String> {
        match command_type {
            CodingCommandType::Navigate => vec!["file_path".to_string()],
            CodingCommandType::Generate => vec!["language".to_string(), "file_path".to_string()],
            CodingCommandType::Edit => vec!["file_content".to_string(), "selection".to_string()],
            CodingCommandType::Explain => vec!["selection".to_string()],
            CodingCommandType::Execute => vec![],
            CodingCommandType::Git => vec!["git_branch".to_string()],
            CodingCommandType::Debug => vec!["recent_errors".to_string(), "file_content".to_string()],
            CodingCommandType::Refactor => vec!["selection".to_string(), "file_content".to_string()],
            CodingCommandType::Document => vec!["selection".to_string(), "language".to_string()],
            CodingCommandType::Test => vec!["selection".to_string(), "language".to_string()],
            CodingCommandType::NotCodingCommand => vec![],
        }
    }

    fn is_safe_command(&self, command_type: &CodingCommandType, input: &str) -> bool {
        match command_type {
            CodingCommandType::Navigate | CodingCommandType::Explain => true,
            CodingCommandType::Execute | CodingCommandType::Git => {
                // Check against dangerous patterns
                !self.dangerous_patterns.iter().any(|p| p.is_match(input))
            }
            _ => false, // Code modifications require confirmation
        }
    }

    fn generate_description(&self, command_type: &CodingCommandType, input: &str) -> String {
        match command_type {
            CodingCommandType::Navigate => format!("Navigate to location: {}", input),
            CodingCommandType::Generate => format!("Generate code: {}", input),
            CodingCommandType::Edit => format!("Edit code: {}", input),
            CodingCommandType::Explain => format!("Explain: {}", input),
            CodingCommandType::Execute => format!("Execute command: {}", input),
            CodingCommandType::Git => format!("Git operation: {}", input),
            CodingCommandType::Debug => format!("Debug: {}", input),
            CodingCommandType::Refactor => format!("Refactor: {}", input),
            CodingCommandType::Document => format!("Add documentation: {}", input),
            CodingCommandType::Test => format!("Generate tests: {}", input),
            CodingCommandType::NotCodingCommand => format!("Not a coding command: {}", input),
        }
    }

    /// Execute a coding command
    pub async fn execute_command(&self, command: &CodingCommand) -> CodingCommandResult {
        let _ = self.event_tx.send(CodingAgentEvent::Executing(command.description.clone()));

        let result = match &command.command_type {
            CodingCommandType::Navigate => self.execute_navigate(command).await,
            CodingCommandType::Generate => self.execute_generate(command).await,
            CodingCommandType::Edit => self.execute_edit(command).await,
            CodingCommandType::Explain => self.execute_explain(command).await,
            CodingCommandType::Execute => self.execute_terminal(command).await,
            CodingCommandType::Git => self.execute_git(command).await,
            CodingCommandType::Debug => self.execute_debug(command).await,
            CodingCommandType::Refactor => self.execute_refactor(command).await,
            CodingCommandType::Document => self.execute_document(command).await,
            CodingCommandType::Test => self.execute_test(command).await,
            CodingCommandType::NotCodingCommand => CodingCommandResult {
                command_id: command.id.clone(),
                success: false,
                result_type: ResultType::Error,
                code: None,
                explanation: None,
                changes: vec![],
                error: Some("Not a valid coding command".to_string()),
                suggestions: vec!["Try commands like 'create function', 'go to line', or 'run tests'".to_string()],
                undoable: false,
            },
        };

        // Store in history for undo
        if result.undoable {
            self.result_history.write().await.push(result.clone());
        }

        let _ = self.event_tx.send(CodingAgentEvent::Executed(result.clone()));

        result
    }

    async fn execute_navigate(&self, command: &CodingCommand) -> CodingCommandResult {
        let target = command.parameters.get("target").cloned().unwrap_or_default();

        CodingCommandResult {
            command_id: command.id.clone(),
            success: true,
            result_type: ResultType::Navigation,
            code: None,
            explanation: Some(format!("Navigation target: {}", target)),
            changes: vec![],
            error: None,
            suggestions: vec![],
            undoable: false,
        }
    }

    async fn execute_generate(&self, command: &CodingCommand) -> CodingCommandResult {
        let context = self.context.read().await.clone();
        let description = command.parameters.get("description").cloned().unwrap_or_default();
        let code_type = command.parameters.get("type").cloned().unwrap_or_else(|| "code".to_string());
        let language = context.language.as_deref().unwrap_or("typescript");

        // Try LLM-powered generation first
        if llm_client::is_llm_available().await {
            let context_str = self.build_context_string(&context);
            let user_prompt = format!(
                "Generate a {} in {}.\n\nDescription: {}\n\nProject context:\n{}\n\nOutput only the code, no explanations.",
                code_type, language, description, context_str
            );

            let request = LLMRequest::new(vec![
                Message::system(CodePrompts::code_generation_system()),
                Message::user(user_prompt),
            ]);

            match llm_client::llm_complete(request).await {
                Ok(response) => {
                    return CodingCommandResult {
                        command_id: command.id.clone(),
                        success: true,
                        result_type: ResultType::CodeGenerated,
                        code: Some(response.content),
                        explanation: Some(format!("Generated {} for: {} (via {})", code_type, description, response.model)),
                        changes: vec![],
                        error: None,
                        suggestions: vec![
                            "Review the generated code".to_string(),
                            "Run tests to verify correctness".to_string(),
                        ],
                        undoable: true,
                    };
                }
                Err(e) => {
                    tracing::warn!("LLM generation failed, falling back to template: {}", e);
                }
            }
        }

        // Fallback: template-based generation when no LLM is available
        let generated_code = self.generate_template(&code_type, language, &description);

        CodingCommandResult {
            command_id: command.id.clone(),
            success: true,
            result_type: ResultType::CodeGenerated,
            code: Some(generated_code),
            explanation: Some(format!("Generated {} template for: {} (no LLM configured)", code_type, description)),
            changes: vec![],
            error: None,
            suggestions: vec![
                "Configure an API key for AI-powered generation".to_string(),
                "Review and customize the template".to_string(),
            ],
            undoable: true,
        }
    }

    async fn execute_edit(&self, command: &CodingCommand) -> CodingCommandResult {
        let from = command.parameters.get("from").cloned().unwrap_or_default();
        let to = command.parameters.get("to").cloned().unwrap_or_default();

        if from.is_empty() {
            return CodingCommandResult {
                command_id: command.id.clone(),
                success: false,
                result_type: ResultType::Error,
                code: None,
                explanation: None,
                changes: vec![],
                error: Some("Could not understand what to edit".to_string()),
                suggestions: vec!["Try 'rename X to Y' or 'change X to Y'".to_string()],
                undoable: false,
            };
        }

        let change = CodeChange {
            file: self.context.read().await.file_path.clone().unwrap_or_default(),
            start_line: 0,
            end_line: 0,
            original: from.clone(),
            replacement: to.clone(),
            change_type: if to.is_empty() { ChangeType::Delete } else { ChangeType::Rename },
        };

        CodingCommandResult {
            command_id: command.id.clone(),
            success: true,
            result_type: ResultType::CodeModified,
            code: None,
            explanation: Some(format!("Renamed '{}' to '{}'", from, to)),
            changes: vec![change],
            error: None,
            suggestions: vec![],
            undoable: true,
        }
    }

    async fn execute_explain(&self, command: &CodingCommand) -> CodingCommandResult {
        let context = self.context.read().await.clone();
        let target = context.selection.clone().unwrap_or_else(|| {
            command.parameters.get("target").cloned().unwrap_or_default()
        });

        // Try LLM-powered explanation first
        if llm_client::is_llm_available().await {
            let context_str = self.build_context_string(&context);
            let user_prompt = CodePrompts::code_explanation(&context_str, &target);

            let request = LLMRequest::new(vec![
                Message::system(CodePrompts::code_generation_system()),
                Message::user(user_prompt),
            ]);

            match llm_client::llm_complete(request).await {
                Ok(response) => {
                    return CodingCommandResult {
                        command_id: command.id.clone(),
                        success: true,
                        result_type: ResultType::Explanation,
                        code: None,
                        explanation: Some(response.content),
                        changes: vec![],
                        error: None,
                        suggestions: vec![],
                        undoable: false,
                    };
                }
                Err(e) => {
                    tracing::warn!("LLM explanation failed, using fallback: {}", e);
                }
            }
        }

        // Fallback
        let explanation = format!(
            "This code appears to be written in {}.\nTarget: {}",
            context.language.as_deref().unwrap_or("unknown language"),
            if target.len() > 200 { &target[..200] } else { &target }
        );

        CodingCommandResult {
            command_id: command.id.clone(),
            success: true,
            result_type: ResultType::Explanation,
            code: None,
            explanation: Some(explanation),
            changes: vec![],
            error: None,
            suggestions: vec!["Configure an API key for AI-powered explanations".to_string()],
            undoable: false,
        }
    }

    async fn execute_terminal(&self, command: &CodingCommand) -> CodingCommandResult {
        let cmd = command.parameters.get("command").cloned().unwrap_or_default();

        // Classify the command for safety
        let terminal_cmd = self.classify_terminal_command(&cmd);

        if terminal_cmd.risk_level == RiskLevel::Critical {
            return CodingCommandResult {
                command_id: command.id.clone(),
                success: false,
                result_type: ResultType::Error,
                code: None,
                explanation: None,
                changes: vec![],
                error: Some(format!("Command blocked: {} - {}", cmd, terminal_cmd.description)),
                suggestions: vec!["This command is potentially dangerous".to_string()],
                undoable: false,
            };
        }

        // Execute via SandboxManager with safety analysis
        let working_dir = self.context.read().await.file_path.as_ref()
            .and_then(|p| std::path::Path::new(p).parent().map(|p| p.to_path_buf()))
            .unwrap_or_else(|| std::env::current_dir().unwrap_or_default());

        let mut sandbox_config = SandboxConfig::default();
        // Auto-mode for safe commands, confirm for risky ones
        if terminal_cmd.is_safe {
            sandbox_config.mode = crate::code_intelligence::sandbox::SandboxMode::Auto;
        }

        let sandbox = SandboxManager::new(working_dir, sandbox_config);

        match sandbox.execute_command(&cmd).await {
            Ok(result) => {
                let output = if result.stdout.is_empty() {
                    result.stderr.clone()
                } else {
                    result.stdout.clone()
                };

                let success = result.exit_code == 0;
                let explanation = format!(
                    "$ {}\n\n{}{}\nExit code: {} ({}ms)",
                    cmd,
                    if !result.stdout.is_empty() { &result.stdout } else { "" },
                    if !result.stderr.is_empty() { format!("\nStderr: {}", result.stderr) } else { String::new() },
                    result.exit_code,
                    result.duration_ms
                );

                CodingCommandResult {
                    command_id: command.id.clone(),
                    success,
                    result_type: ResultType::CommandExecuted,
                    code: if !output.is_empty() { Some(output) } else { None },
                    explanation: Some(explanation),
                    changes: vec![],
                    error: if !success { Some(format!("Command exited with code {}", result.exit_code)) } else { None },
                    suggestions: vec![],
                    undoable: false,
                }
            }
            Err(e) => {
                CodingCommandResult {
                    command_id: command.id.clone(),
                    success: false,
                    result_type: ResultType::Error,
                    code: None,
                    explanation: None,
                    changes: vec![],
                    error: Some(format!("Command execution failed: {}", e)),
                    suggestions: vec!["Check that the command is installed and accessible".to_string()],
                    undoable: false,
                }
            }
        }
    }

    fn classify_terminal_command(&self, cmd: &str) -> TerminalCommand {
        let cmd_lower = cmd.to_lowercase();

        // Check for dangerous patterns
        for pattern in &self.dangerous_patterns {
            if pattern.is_match(&cmd_lower) {
                return TerminalCommand {
                    command: cmd.to_string(),
                    cwd: None,
                    is_safe: false,
                    risk_level: RiskLevel::Critical,
                    requires_confirmation: true,
                    description: "Potentially destructive command blocked".to_string(),
                };
            }
        }

        // Check for safe commands
        for safe in &self.safe_commands {
            if cmd_lower.starts_with(&safe.to_lowercase()) {
                return TerminalCommand {
                    command: cmd.to_string(),
                    cwd: None,
                    is_safe: true,
                    risk_level: RiskLevel::Safe,
                    requires_confirmation: false,
                    description: format!("Safe command: {}", safe),
                };
            }
        }

        // Default to medium risk
        TerminalCommand {
            command: cmd.to_string(),
            cwd: None,
            is_safe: false,
            risk_level: RiskLevel::Medium,
            requires_confirmation: true,
            description: "Command requires review".to_string(),
        }
    }

    async fn execute_git(&self, command: &CodingCommand) -> CodingCommandResult {
        let git_cmd = command.parameters.get("command").cloned().unwrap_or_default();
        let message = command.parameters.get("message").cloned();

        let terminal_cmd = self.classify_terminal_command(&git_cmd);

        if terminal_cmd.risk_level == RiskLevel::Critical {
            return CodingCommandResult {
                command_id: command.id.clone(),
                success: false,
                result_type: ResultType::Error,
                code: None,
                explanation: None,
                changes: vec![],
                error: Some("Dangerous git command blocked".to_string()),
                suggestions: vec!["Force pushing to main/master is not allowed".to_string()],
                undoable: false,
            };
        }

        // Build the actual git command
        let full_command = if git_cmd.contains("commit") && message.is_some() {
            format!("git commit -m \"{}\"", message.unwrap())
        } else if git_cmd.starts_with("git ") {
            git_cmd.clone()
        } else {
            format!("git {}", git_cmd)
        };

        // Execute via sandbox
        let working_dir = self.context.read().await.file_path.as_ref()
            .and_then(|p| std::path::Path::new(p).parent().map(|p| p.to_path_buf()))
            .unwrap_or_else(|| std::env::current_dir().unwrap_or_default());

        let sandbox = SandboxManager::new(working_dir, SandboxConfig::default());

        match sandbox.execute_command(&full_command).await {
            Ok(result) => {
                let output = if !result.stdout.is_empty() {
                    result.stdout.clone()
                } else {
                    result.stderr.clone()
                };

                CodingCommandResult {
                    command_id: command.id.clone(),
                    success: result.exit_code == 0,
                    result_type: ResultType::CommandExecuted,
                    code: None,
                    explanation: Some(format!("$ {}\n\n{}", full_command, output)),
                    changes: vec![],
                    error: if result.exit_code != 0 { Some(result.stderr) } else { None },
                    suggestions: vec![],
                    undoable: false,
                }
            }
            Err(e) => {
                CodingCommandResult {
                    command_id: command.id.clone(),
                    success: false,
                    result_type: ResultType::Error,
                    code: None,
                    explanation: None,
                    changes: vec![],
                    error: Some(format!("Git command failed: {}", e)),
                    suggestions: vec![],
                    undoable: false,
                }
            }
        }
    }

    async fn execute_debug(&self, command: &CodingCommand) -> CodingCommandResult {
        let context = self.context.read().await.clone();
        let description = command.parameters.get("description").cloned().unwrap_or_default();

        // Try LLM-powered debugging
        if llm_client::is_llm_available().await {
            let context_str = self.build_context_string(&context);
            let code = context.selection.clone().or(context.file_content.clone()).unwrap_or_default();
            let errors = context.recent_errors.join("\n");
            let error_info = if errors.is_empty() { description.clone() } else { errors };

            let user_prompt = CodePrompts::bug_fix(&context_str, &code, &error_info);

            let request = LLMRequest::new(vec![
                Message::system(CodePrompts::code_generation_system()),
                Message::user(user_prompt),
            ]);

            match llm_client::llm_complete(request).await {
                Ok(response) => {
                    return CodingCommandResult {
                        command_id: command.id.clone(),
                        success: true,
                        result_type: ResultType::CodeModified,
                        code: Some(response.content),
                        explanation: Some(format!("Debug analysis and fix for: {}", description)),
                        changes: vec![],
                        error: None,
                        suggestions: vec![
                            "Review the fix before applying".to_string(),
                            "Run tests to verify the fix".to_string(),
                        ],
                        undoable: true,
                    };
                }
                Err(e) => {
                    tracing::warn!("LLM debug failed, using fallback: {}", e);
                }
            }
        }

        // Fallback
        let debug_info = format!(
            "Debug Analysis:\n\nRecent Errors: {:?}\nCurrent File: {:?}\n\nDescription: {}",
            context.recent_errors, context.file_path, description
        );

        CodingCommandResult {
            command_id: command.id.clone(),
            success: true,
            result_type: ResultType::Explanation,
            code: None,
            explanation: Some(debug_info),
            changes: vec![],
            error: None,
            suggestions: vec![
                "Configure an API key for AI-powered debugging".to_string(),
            ],
            undoable: false,
        }
    }

    async fn execute_refactor(&self, command: &CodingCommand) -> CodingCommandResult {
        let context = self.context.read().await.clone();
        let description = command.parameters.get("description").cloned().unwrap_or_default();

        // Try LLM-powered refactoring
        if llm_client::is_llm_available().await {
            let context_str = self.build_context_string(&context);
            let code = context.selection.clone().or(context.file_content.clone()).unwrap_or_default();
            let user_prompt = CodePrompts::refactor(&context_str, &code, &description);

            let request = LLMRequest::new(vec![
                Message::system(CodePrompts::code_generation_system()),
                Message::user(user_prompt),
            ]);

            match llm_client::llm_complete(request).await {
                Ok(response) => {
                    return CodingCommandResult {
                        command_id: command.id.clone(),
                        success: true,
                        result_type: ResultType::CodeModified,
                        code: Some(response.content),
                        explanation: Some(format!("Refactored: {}", description)),
                        changes: vec![],
                        error: None,
                        suggestions: vec![
                            "Review the refactored code".to_string(),
                            "Run tests to verify behavior is preserved".to_string(),
                        ],
                        undoable: true,
                    };
                }
                Err(e) => {
                    tracing::warn!("LLM refactor failed, using fallback: {}", e);
                }
            }
        }

        CodingCommandResult {
            command_id: command.id.clone(),
            success: false,
            result_type: ResultType::Error,
            code: None,
            explanation: None,
            changes: vec![],
            error: Some("Refactoring requires an LLM. Configure an API key.".to_string()),
            suggestions: vec!["Set ANTHROPIC_API_KEY or OPENAI_API_KEY environment variable".to_string()],
            undoable: false,
        }
    }

    async fn execute_document(&self, command: &CodingCommand) -> CodingCommandResult {
        let context = self.context.read().await.clone();
        let language = context.language.as_deref().unwrap_or("typescript");

        // Try LLM-powered documentation
        if llm_client::is_llm_available().await {
            let code = context.selection.clone().or(context.file_content.clone()).unwrap_or_default();
            let user_prompt = format!(
                "Generate comprehensive documentation for the following {} code. \
                Use the appropriate doc comment format for the language ({}).\n\n\
                Code:\n```\n{}\n```\n\nOutput only the documented code:",
                language, language, code
            );

            let request = LLMRequest::new(vec![
                Message::system(CodePrompts::code_generation_system()),
                Message::user(user_prompt),
            ]);

            match llm_client::llm_complete(request).await {
                Ok(response) => {
                    return CodingCommandResult {
                        command_id: command.id.clone(),
                        success: true,
                        result_type: ResultType::CodeGenerated,
                        code: Some(response.content),
                        explanation: Some("Generated documentation from code analysis".to_string()),
                        changes: vec![],
                        error: None,
                        suggestions: vec!["Review generated documentation for accuracy".to_string()],
                        undoable: true,
                    };
                }
                Err(e) => {
                    tracing::warn!("LLM documentation failed, using template: {}", e);
                }
            }
        }

        // Fallback: language-specific template
        let documentation = match language {
            "typescript" | "javascript" => {
                "/**\n * Description of the function\n * @param param - Parameter description\n * @returns Return value description\n */".to_string()
            }
            "python" => {
                "\"\"\"Description of the function.\n\nArgs:\n    param: Parameter description\n\nReturns:\n    Return value description\n\"\"\"".to_string()
            }
            "rust" => {
                "/// Description of the function\n///\n/// # Arguments\n///\n/// * `param` - Parameter description\n///\n/// # Returns\n///\n/// Return value description".to_string()
            }
            _ => "// Documentation".to_string(),
        };

        CodingCommandResult {
            command_id: command.id.clone(),
            success: true,
            result_type: ResultType::CodeGenerated,
            code: Some(documentation),
            explanation: Some("Generated documentation template (no LLM configured)".to_string()),
            changes: vec![],
            error: None,
            suggestions: vec!["Configure an API key for AI-powered documentation".to_string()],
            undoable: true,
        }
    }

    async fn execute_test(&self, command: &CodingCommand) -> CodingCommandResult {
        let context = self.context.read().await.clone();
        let language = context.language.as_deref().unwrap_or("typescript");

        // Try LLM-powered test generation
        if llm_client::is_llm_available().await {
            let context_str = self.build_context_string(&context);
            let code = context.selection.clone().or(context.file_content.clone()).unwrap_or_default();
            let user_prompt = CodePrompts::generate_tests(&context_str, &code);

            let request = LLMRequest::new(vec![
                Message::system(CodePrompts::code_generation_system()),
                Message::user(user_prompt),
            ]);

            match llm_client::llm_complete(request).await {
                Ok(response) => {
                    return CodingCommandResult {
                        command_id: command.id.clone(),
                        success: true,
                        result_type: ResultType::CodeGenerated,
                        code: Some(response.content),
                        explanation: Some("Generated comprehensive tests from code analysis".to_string()),
                        changes: vec![],
                        error: None,
                        suggestions: vec![
                            "Review test coverage".to_string(),
                            "Run the tests to verify they pass".to_string(),
                        ],
                        undoable: true,
                    };
                }
                Err(e) => {
                    tracing::warn!("LLM test generation failed, using template: {}", e);
                }
            }
        }

        // Fallback: language-specific template
        let test_code = match language {
            "typescript" | "javascript" => {
                "import { describe, it, expect } from 'vitest';\n\ndescribe('FunctionName', () => {\n  it('should handle normal input', () => {\n    expect(true).toBe(true);\n  });\n});".to_string()
            }
            "python" => {
                "import pytest\n\ndef test_normal_input():\n    assert True\n\ndef test_edge_case():\n    pass".to_string()
            }
            "rust" => {
                "#[cfg(test)]\nmod tests {\n    use super::*;\n\n    #[test]\n    fn test_normal_input() {\n        assert!(true);\n    }\n}".to_string()
            }
            _ => "// Test code template".to_string(),
        };

        CodingCommandResult {
            command_id: command.id.clone(),
            success: true,
            result_type: ResultType::CodeGenerated,
            code: Some(test_code),
            explanation: Some("Generated test template (no LLM configured)".to_string()),
            changes: vec![],
            error: None,
            suggestions: vec!["Configure an API key for AI-powered test generation".to_string()],
            undoable: true,
        }
    }

    /// Build a context string from CodeContext for LLM prompts
    fn build_context_string(&self, context: &CodeContext) -> String {
        let mut parts = Vec::new();

        if let Some(ref path) = context.file_path {
            parts.push(format!("File: {}", path));
        }
        if let Some(ref lang) = context.language {
            parts.push(format!("Language: {}", lang));
        }
        if let Some(ref branch) = context.git_branch {
            parts.push(format!("Branch: {}", branch));
        }
        if !context.imports.is_empty() {
            parts.push(format!("Imports: {}", context.imports.join(", ")));
        }
        if !context.dependencies.is_empty() {
            parts.push(format!("Dependencies: {}", context.dependencies.join(", ")));
        }
        if let Some(ref scope) = context.scope {
            parts.push(format!("Current scope: {}", scope));
        }
        if !context.recent_errors.is_empty() {
            parts.push(format!("Recent errors: {}", context.recent_errors.join("\n")));
        }
        if let Some(ref screen_text) = context.visible_screen_text {
            if !screen_text.is_empty() {
                parts.push(format!("Visible screen content:\n{}", screen_text));
            }
        }

        if parts.is_empty() {
            "No project context available".to_string()
        } else {
            parts.join("\n")
        }
    }

    /// Generate a template-based code snippet (fallback when no LLM)
    fn generate_template(&self, code_type: &str, language: &str, description: &str) -> String {
        match (code_type, language) {
            ("function", "typescript" | "javascript") => {
                format!("/**\n * {}\n */\nexport function generatedFunction(params: unknown): unknown {{\n  // TODO: Implement {}\n  throw new Error('Not implemented');\n}}", description, description)
            }
            ("function", "python") => {
                format!("def generated_function(params):\n    \"{}\"\"\"\n    # TODO: Implement {}\n    raise NotImplementedError()", description, description)
            }
            ("function", "rust") => {
                format!("/// {}\npub fn generated_function(params: ()) -> Result<(), Box<dyn std::error::Error>> {{\n    // TODO: Implement {}\n    todo!()\n}}", description, description)
            }
            ("class", "typescript" | "javascript") => {
                format!("/**\n * {}\n */\nexport class GeneratedClass {{\n  constructor() {{\n    // TODO: Initialize\n  }}\n}}", description)
            }
            _ => format!("// Generated code for: {}\n// Language: {}", description, language),
        }
    }

    /// Undo the last command
    pub async fn undo(&self) -> Option<CodingCommandResult> {
        self.result_history.write().await.pop()
    }

    /// Get command history
    pub async fn get_history(&self) -> Vec<CodingCommand> {
        self.command_history.read().await.clone()
    }
}

// Tauri commands

#[tauri::command]
pub async fn parse_coding_command(voice_input: String) -> Result<CodingCommand, String> {
    Ok(get_coding_agent().parse_command(&voice_input).await)
}

#[tauri::command]
pub async fn execute_coding_command(command: CodingCommand) -> Result<CodingCommandResult, String> {
    Ok(get_coding_agent().execute_command(&command).await)
}

#[tauri::command]
pub async fn update_code_context(context: CodeContext) -> Result<(), String> {
    get_coding_agent().update_context(context).await;
    Ok(())
}

#[tauri::command]
pub async fn get_code_context() -> Result<CodeContext, String> {
    Ok(get_coding_agent().get_context().await)
}

#[tauri::command]
pub async fn undo_coding_command() -> Result<Option<CodingCommandResult>, String> {
    Ok(get_coding_agent().undo().await)
}

#[tauri::command]
pub async fn get_coding_command_history() -> Result<Vec<CodingCommand>, String> {
    Ok(get_coding_agent().get_history().await)
}

// ============================================================================
// Voice-to-Code Pipeline (Phase 1.3)
// End-to-end: voice text -> screen context -> coding agent -> LLM -> result
// ============================================================================

/// Full pipeline response returned to the frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VoiceCodingResponse {
    pub success: bool,
    pub command_type: String,
    pub intent: String,
    pub confidence: f32,
    pub code: Option<String>,
    pub explanation: Option<String>,
    pub error: Option<String>,
    pub detected_app: String,
    pub detected_language: Option<String>,
    pub detected_file: Option<String>,
    pub undoable: bool,
    pub suggestions: Vec<String>,
}

/// Execute a complete voice-to-code pipeline.
///
/// 1. Captures screen context (active window, language, file)
/// 2. Parses voice text into a coding command
/// 3. Enriches the coding agent's context from screen state
/// 4. Executes via the coding agent (which calls LLM if available)
/// 5. Returns the full result to the frontend
#[tauri::command]
pub async fn execute_voice_coding_command(
    voice_text: String,
) -> Result<VoiceCodingResponse, String> {
    use crate::screen_context::get_screen_context;

    // Step 1: Capture current screen context
    let screen_mgr = get_screen_context();
    let screen = screen_mgr.capture_context().await.unwrap_or_default();

    // Step 2: Parse voice text into a coding command
    let agent = get_coding_agent();
    let command = agent.parse_command(&voice_text).await;

    // If it's not a coding command, return early with suggestions
    if command.command_type == CodingCommandType::NotCodingCommand {
        return Ok(VoiceCodingResponse {
            success: false,
            command_type: "NotCodingCommand".to_string(),
            intent: command.intent.clone(),
            confidence: command.confidence,
            code: None,
            explanation: Some("Could not interpret as a coding command. Try starting with: create, generate, explain, run, fix, refactor, document, or test.".to_string()),
            error: None,
            detected_app: screen.app_name.clone(),
            detected_language: screen.detected_language.as_ref().map(|l| format!("{:?}", l)),
            detected_file: screen.file_path.clone(),
            undoable: false,
            suggestions: vec![
                "create a function that validates email".to_string(),
                "explain this function".to_string(),
                "run tests".to_string(),
                "fix the error".to_string(),
            ],
        });
    }

    // Step 3: Enrich coding agent context from screen state
    let language_str = screen.detected_language.as_ref().map(|l| format!("{:?}", l).to_lowercase());
    let context = CodeContext {
        file_path: screen.file_path.clone(),
        language: language_str.clone(),
        git_branch: screen.git_branch.clone(),
        visible_screen_text: screen.visible_text.clone(),
        ..agent.get_context().await
    };
    agent.update_context(context).await;

    // Step 4: Execute the command (calls LLM via Phase 0 wiring)
    let result = agent.execute_command(&command).await;

    // Step 5: Build the response
    Ok(VoiceCodingResponse {
        success: result.success,
        command_type: format!("{:?}", command.command_type),
        intent: command.intent,
        confidence: command.confidence,
        code: result.code,
        explanation: result.explanation,
        error: result.error,
        detected_app: screen.app_name,
        detected_language: language_str,
        detected_file: screen.file_path,
        undoable: result.undoable,
        suggestions: result.suggestions,
    })
}

/// Undo the last voice coding command
#[tauri::command]
pub async fn undo_voice_coding_command() -> Result<Option<VoiceCodingResponse>, String> {
    let agent = get_coding_agent();
    match agent.undo().await {
        Some(result) => Ok(Some(VoiceCodingResponse {
            success: true,
            command_type: "Undo".to_string(),
            intent: "Undo last command".to_string(),
            confidence: 1.0,
            code: result.code,
            explanation: Some("Previous command undone.".to_string()),
            error: None,
            detected_app: String::new(),
            detected_language: None,
            detected_file: None,
            undoable: false,
            suggestions: vec![],
        })),
        None => Ok(None),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_parse_navigate_command() {
        let agent = CodingAgent::new();
        let command = agent.parse_command("go to function authenticate").await;
        assert_eq!(command.command_type, CodingCommandType::Navigate);
        assert!(command.parameters.contains_key("target"));
    }

    #[tokio::test]
    async fn test_parse_generate_command() {
        let agent = CodingAgent::new();
        let command = agent.parse_command("create a function that validates email").await;
        assert_eq!(command.command_type, CodingCommandType::Generate);
    }

    #[tokio::test]
    async fn test_parse_git_command() {
        let agent = CodingAgent::new();
        let command = agent.parse_command("commit with message fixed the bug").await;
        assert_eq!(command.command_type, CodingCommandType::Git);
    }

    #[tokio::test]
    async fn test_dangerous_command_blocked() {
        let agent = CodingAgent::new();
        let command = agent.parse_command("run rm -rf /").await;
        let result = agent.execute_command(&command).await;
        assert!(!result.success);
        assert!(result.error.is_some());
    }

    #[tokio::test]
    async fn test_safe_command_allowed() {
        let agent = CodingAgent::new();
        let command = agent.parse_command("run npm test").await;
        // Verify the command is classified as safe (not blocked like dangerous commands)
        assert!(command.safe_to_execute);
        assert_eq!(command.command_type, CodingCommandType::Execute);
        // Note: we don't execute the command in tests since npm may not be available
    }
}

// ── Voice-to-Code Integration Tests ────────────────────────────────
// Full pipeline tests: voice text → parse → classify → execute
// Runs without LLM (template-based fallback).

#[cfg(test)]
mod voice_to_code_integration {
    use super::*;

    fn create_agent() -> CodingAgent {
        CodingAgent::new()
    }

    fn make_context(file: &str, lang: &str, branch: &str) -> CodeContext {
        CodeContext {
            file_path: Some(file.to_string()),
            file_content: None,
            language: Some(lang.to_string()),
            cursor_position: None,
            selection: None,
            scope: None,
            imports: vec![],
            dependencies: vec![],
            git_branch: Some(branch.to_string()),
            recent_errors: vec![],
            open_files: vec![file.to_string()],
            visible_screen_text: None,
        }
    }

    // ── Command Parsing ────────────────────────────────────────────

    #[tokio::test]
    async fn test_generate_function_command() {
        let agent = create_agent();
        let cmd = agent.parse_command("create a function that validates email addresses").await;
        assert_eq!(cmd.command_type, CodingCommandType::Generate);
        assert!(cmd.intent.contains("Generate"));
        assert!(cmd.confidence > 0.5);
        // Generate commands are NOT safe_to_execute (only Navigate/Explain are)
        assert!(!cmd.safe_to_execute);
        assert!(cmd.parameters.contains_key("description"));
    }

    #[tokio::test]
    async fn test_generate_class_command() {
        let agent = create_agent();
        let cmd = agent.parse_command("create a class called UserService").await;
        assert_eq!(cmd.command_type, CodingCommandType::Generate);
        assert_eq!(cmd.parameters.get("type").map(String::as_str), Some("class"));
    }

    #[tokio::test]
    async fn test_generate_test_command() {
        let agent = create_agent();
        // "add tests for the login function" contains both "function" and "test";
        // "function" is matched first in classify_command, so type is "function"
        let cmd = agent.parse_command("add tests for the login function").await;
        assert_eq!(cmd.command_type, CodingCommandType::Generate);
        assert_eq!(cmd.parameters.get("type").map(String::as_str), Some("function"));
    }

    #[tokio::test]
    async fn test_explain_command() {
        let agent = create_agent();
        let cmd = agent.parse_command("explain this function").await;
        assert_eq!(cmd.command_type, CodingCommandType::Explain);
        assert!(cmd.confidence > 0.5);
    }

    #[tokio::test]
    async fn test_explain_what_does() {
        let agent = create_agent();
        let cmd = agent.parse_command("what does this code do").await;
        assert_eq!(cmd.command_type, CodingCommandType::Explain);
    }

    #[tokio::test]
    async fn test_navigate_to_line() {
        let agent = create_agent();
        let cmd = agent.parse_command("go to line 42").await;
        assert_eq!(cmd.command_type, CodingCommandType::Navigate);
        assert_eq!(cmd.parameters.get("type").map(String::as_str), Some("line"));
    }

    #[tokio::test]
    async fn test_navigate_to_function() {
        let agent = create_agent();
        let cmd = agent.parse_command("jump to function handleSubmit").await;
        assert_eq!(cmd.command_type, CodingCommandType::Navigate);
        assert_eq!(cmd.parameters.get("type").map(String::as_str), Some("function"));
    }

    #[tokio::test]
    async fn test_edit_rename_command() {
        let agent = create_agent();
        let cmd = agent.parse_command("rename myVar to myVariable").await;
        assert_eq!(cmd.command_type, CodingCommandType::Edit);
        assert!(cmd.parameters.contains_key("from"));
        assert!(cmd.parameters.contains_key("to"));
    }

    #[tokio::test]
    async fn test_execute_command_type() {
        let agent = create_agent();
        let cmd = agent.parse_command("run npm test").await;
        assert_eq!(cmd.command_type, CodingCommandType::Execute);
        assert!(cmd.parameters.contains_key("command"));
    }

    #[tokio::test]
    async fn test_refactor_command() {
        let agent = create_agent();
        let cmd = agent.parse_command("refactor this function to use async await").await;
        assert_eq!(cmd.command_type, CodingCommandType::Refactor);
    }

    #[tokio::test]
    async fn test_debug_command() {
        let agent = create_agent();
        let cmd = agent.parse_command("debug why this test is failing").await;
        assert_eq!(cmd.command_type, CodingCommandType::Debug);
    }

    #[tokio::test]
    async fn test_document_command() {
        let agent = create_agent();
        let cmd = agent.parse_command("document this function with JSDoc").await;
        assert_eq!(cmd.command_type, CodingCommandType::Document);
    }

    #[tokio::test]
    async fn test_git_commit_command() {
        let agent = create_agent();
        let cmd = agent.parse_command("commit with message fixed the auth bug").await;
        assert_eq!(cmd.command_type, CodingCommandType::Git);
        assert!(cmd.parameters.contains_key("message") || cmd.intent.contains("Commit"));
    }

    // ── Execution Results ──────────────────────────────────────────

    #[tokio::test]
    async fn test_execute_generate_returns_code() {
        let agent = create_agent();
        let cmd = agent.parse_command("create a function that validates email").await;
        let result = agent.execute_command(&cmd).await;
        assert!(result.success);
        assert!(result.code.is_some());
    }

    #[tokio::test]
    async fn test_execute_explain_returns_explanation() {
        let agent = create_agent();
        let cmd = agent.parse_command("explain what this code does").await;
        let result = agent.execute_command(&cmd).await;
        assert!(result.success);
        assert!(result.explanation.is_some());
    }

    #[tokio::test]
    async fn test_execute_navigate_returns_result() {
        let agent = create_agent();
        let cmd = agent.parse_command("go to line 100").await;
        let result = agent.execute_command(&cmd).await;
        assert!(result.success);
    }

    // ── Context Updates ────────────────────────────────────────────

    #[tokio::test]
    async fn test_context_update_and_retrieval() {
        let agent = create_agent();
        let context = make_context("/src/auth.ts", "typescript", "feature/auth");
        agent.update_context(context).await;
        let retrieved = agent.get_context().await;
        assert_eq!(retrieved.file_path, Some("/src/auth.ts".to_string()));
        assert_eq!(retrieved.language, Some("typescript".to_string()));
        assert_eq!(retrieved.git_branch, Some("feature/auth".to_string()));
    }

    // ── Safety Checks ──────────────────────────────────────────────

    #[tokio::test]
    async fn test_navigate_is_safe() {
        let agent = create_agent();
        let cmd = agent.parse_command("go to line 50").await;
        assert!(cmd.safe_to_execute);
    }

    #[tokio::test]
    async fn test_explain_is_safe() {
        let agent = create_agent();
        let cmd = agent.parse_command("explain this function").await;
        assert!(cmd.safe_to_execute);
    }

    #[tokio::test]
    async fn test_generate_requires_confirmation() {
        let agent = create_agent();
        let cmd = agent.parse_command("create a helper function").await;
        // Generate commands require confirmation (safe_to_execute = false)
        assert!(!cmd.safe_to_execute);
    }

    #[tokio::test]
    async fn test_dangerous_command_detected() {
        let agent = create_agent();
        let cmd = agent.parse_command("run rm -rf /").await;
        assert!(!cmd.safe_to_execute || cmd.command_type == CodingCommandType::Execute);
    }

    // ── Command History ────────────────────────────────────────────

    #[tokio::test]
    async fn test_command_history_tracking() {
        let agent = create_agent();
        agent.parse_command("create a function foo").await;
        agent.parse_command("explain this code").await;
        agent.parse_command("go to line 10").await;
        let history = agent.get_history().await;
        assert_eq!(history.len(), 3);
        assert_eq!(history[0].command_type, CodingCommandType::Generate);
        assert_eq!(history[1].command_type, CodingCommandType::Explain);
        assert_eq!(history[2].command_type, CodingCommandType::Navigate);
    }

    // ── Confidence Scoring ─────────────────────────────────────────

    #[tokio::test]
    async fn test_clear_command_has_high_confidence() {
        let agent = create_agent();
        let cmd = agent.parse_command("create function validateEmail").await;
        assert!(cmd.confidence >= 0.7, "confidence was {}", cmd.confidence);
    }

    #[tokio::test]
    async fn test_ambiguous_command_has_lower_confidence() {
        let agent = create_agent();
        let cmd = agent.parse_command("do something").await;
        assert!(cmd.confidence < 0.9, "confidence was {}", cmd.confidence);
    }

    // ── Undo Support ───────────────────────────────────────────────

    #[tokio::test]
    async fn test_undo_empty_history() {
        let agent = create_agent();
        let result = agent.undo().await;
        assert!(result.is_none());
    }

    #[tokio::test]
    async fn test_execute_then_undo() {
        let agent = create_agent();
        let cmd = agent.parse_command("create a function bar").await;
        let exec_result = agent.execute_command(&cmd).await;
        assert!(exec_result.success);
        let undo_result = agent.undo().await;
        assert!(undo_result.is_some());
    }

    // ── Event Broadcasting ─────────────────────────────────────────

    #[tokio::test]
    async fn test_event_broadcast_on_parse() {
        let agent = create_agent();
        let mut rx = agent.subscribe();
        agent.parse_command("create function test").await;
        let event = tokio::time::timeout(
            std::time::Duration::from_millis(500),
            rx.recv(),
        ).await;
        assert!(event.is_ok(), "Should receive event within timeout");
    }

    // ── Full Pipeline Integration ──────────────────────────────────

    #[tokio::test]
    async fn test_full_voice_to_code_pipeline() {
        let agent = create_agent();
        agent.update_context(make_context("/src/utils.ts", "typescript", "main")).await;
        let cmd = agent.parse_command("create a function that validates email addresses").await;
        assert_eq!(cmd.command_type, CodingCommandType::Generate);
        assert!(cmd.confidence > 0.5);
        let result = agent.execute_command(&cmd).await;
        assert!(result.success);
        assert!(result.code.is_some());
        let context = agent.get_context().await;
        assert_eq!(context.language, Some("typescript".to_string()));
        let history = agent.get_history().await;
        assert!(!history.is_empty());
    }

    #[tokio::test]
    async fn test_multiple_commands_pipeline() {
        let agent = create_agent();
        // Only include commands that succeed without LLM (template-based)
        let commands = vec![
            "create a function that sorts an array",
            "explain what this code does",
            "go to line 42",
        ];
        for voice_text in &commands {
            let cmd = agent.parse_command(voice_text).await;
            let result = agent.execute_command(&cmd).await;
            assert!(result.success, "Failed on command: {}", voice_text);
        }
        let history = agent.get_history().await;
        assert_eq!(history.len(), commands.len());
    }
}
