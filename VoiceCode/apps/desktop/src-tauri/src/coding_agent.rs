// Phase 4 & 5: Coding Agent Core
// Voice-controlled code generation, editing, navigation, and execution

use std::sync::Arc;
use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use tokio::sync::{RwLock, mpsc, broadcast};
use once_cell::sync::Lazy;
use uuid::Uuid;

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
            regex::Regex::new(r"rm\s+-rf\s+/").unwrap(),
            regex::Regex::new(r"rm\s+-rf\s+\*").unwrap(),
            regex::Regex::new(r">\s*/dev/").unwrap(),
            regex::Regex::new(r"chmod\s+777").unwrap(),
            regex::Regex::new(r"curl.*\|.*sh").unwrap(),
            regex::Regex::new(r"wget.*\|.*sh").unwrap(),
            regex::Regex::new(r"sudo\s+rm").unwrap(),
            regex::Regex::new(r"git\s+push.*--force\s+(origin\s+)?(main|master)").unwrap(),
            regex::Regex::new(r"drop\s+database", ).unwrap(),
            regex::Regex::new(r"truncate\s+table").unwrap(),
            regex::Regex::new(r"npm\s+publish").unwrap(),
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

        // In production, this would call an AI service to generate code
        // For now, return a template based on the detected language
        let language = context.language.as_deref().unwrap_or("typescript");

        let generated_code = match (code_type.as_str(), language) {
            ("function", "typescript" | "javascript") => {
                format!(r#"/**
 * {}
 */
export function generatedFunction(params: unknown): unknown {{
  // TODO: Implement {}
  throw new Error('Not implemented');
}}"#, description, description)
            }
            ("function", "python") => {
                format!(r#"def generated_function(params):
    """{}"""
    # TODO: Implement {}
    raise NotImplementedError()"#, description, description)
            }
            ("function", "rust") => {
                format!(r#"/// {}
pub fn generated_function(params: ()) -> Result<(), Box<dyn std::error::Error>> {{
    // TODO: Implement {}
    todo!()
}}"#, description, description)
            }
            ("class", "typescript" | "javascript") => {
                format!(r#"/**
 * {}
 */
export class GeneratedClass {{
  constructor() {{
    // TODO: Initialize
  }}

  // TODO: Add methods
}}"#, description)
            }
            ("test", "typescript" | "javascript") => {
                format!(r#"describe('Generated Test', () => {{
  it('should {}', () => {{
    // TODO: Implement test
    expect(true).toBe(true);
  }});
}});"#, description)
            }
            _ => format!("// Generated code for: {}\n// Language: {}", description, language),
        };

        CodingCommandResult {
            command_id: command.id.clone(),
            success: true,
            result_type: ResultType::CodeGenerated,
            code: Some(generated_code),
            explanation: Some(format!("Generated {} for: {}", code_type, description)),
            changes: vec![],
            error: None,
            suggestions: vec![
                "Review the generated code".to_string(),
                "Customize the implementation".to_string(),
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

        // In production, this would call an AI service for explanation
        let explanation = format!(
            "This code appears to be written in {}.\n\n\
            To provide a detailed explanation, I would analyze the following:\n\
            - Function/class purpose and behavior\n\
            - Input parameters and return types\n\
            - Side effects and dependencies\n\
            - Usage patterns and best practices\n\n\
            Target: {}",
            context.language.as_deref().unwrap_or("unknown language"),
            if target.len() > 100 { &target[..100] } else { &target }
        );

        CodingCommandResult {
            command_id: command.id.clone(),
            success: true,
            result_type: ResultType::Explanation,
            code: None,
            explanation: Some(explanation),
            changes: vec![],
            error: None,
            suggestions: vec![],
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

        // In production, this would actually execute the command
        CodingCommandResult {
            command_id: command.id.clone(),
            success: true,
            result_type: ResultType::CommandExecuted,
            code: None,
            explanation: Some(format!("Would execute: {}\nRisk level: {:?}", cmd, terminal_cmd.risk_level)),
            changes: vec![],
            error: None,
            suggestions: if terminal_cmd.requires_confirmation {
                vec!["This command requires confirmation before execution".to_string()]
            } else {
                vec![]
            },
            undoable: false,
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
        } else {
            format!("git {}", git_cmd)
        };

        CodingCommandResult {
            command_id: command.id.clone(),
            success: true,
            result_type: ResultType::CommandExecuted,
            code: None,
            explanation: Some(format!("Git command: {}", full_command)),
            changes: vec![],
            error: None,
            suggestions: vec![],
            undoable: false,
        }
    }

    async fn execute_debug(&self, command: &CodingCommand) -> CodingCommandResult {
        let context = self.context.read().await.clone();

        let debug_info = format!(
            "Debug Analysis:\n\n\
            Recent Errors: {:?}\n\n\
            Current File: {:?}\n\n\
            Suggestions:\n\
            1. Check the error message for specific line numbers\n\
            2. Review recent changes in git\n\
            3. Verify dependencies are up to date\n\
            4. Check for type mismatches\n\
            5. Review async/await patterns",
            context.recent_errors,
            context.file_path
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
                "Would you like me to attempt to fix the issue?".to_string(),
                "Should I search for similar issues online?".to_string(),
            ],
            undoable: false,
        }
    }

    async fn execute_refactor(&self, command: &CodingCommand) -> CodingCommandResult {
        let description = command.parameters.get("description").cloned().unwrap_or_default();

        CodingCommandResult {
            command_id: command.id.clone(),
            success: true,
            result_type: ResultType::CodeModified,
            code: Some("// Refactored code would appear here".to_string()),
            explanation: Some(format!("Refactoring: {}", description)),
            changes: vec![],
            error: None,
            suggestions: vec![
                "Review the refactored code".to_string(),
                "Run tests to verify behavior".to_string(),
            ],
            undoable: true,
        }
    }

    async fn execute_document(&self, command: &CodingCommand) -> CodingCommandResult {
        let context = self.context.read().await.clone();
        let language = context.language.as_deref().unwrap_or("typescript");

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
            explanation: Some("Generated documentation template".to_string()),
            changes: vec![],
            error: None,
            suggestions: vec!["Customize the documentation with actual descriptions".to_string()],
            undoable: true,
        }
    }

    async fn execute_test(&self, command: &CodingCommand) -> CodingCommandResult {
        let context = self.context.read().await.clone();
        let language = context.language.as_deref().unwrap_or("typescript");

        let test_code = match language {
            "typescript" | "javascript" => {
                r#"import { describe, it, expect } from 'vitest';

describe('FunctionName', () => {
  it('should handle normal input', () => {
    // Arrange
    const input = {};

    // Act
    const result = functionName(input);

    // Assert
    expect(result).toBeDefined();
  });

  it('should handle edge cases', () => {
    // Test edge cases
  });

  it('should throw on invalid input', () => {
    expect(() => functionName(null)).toThrow();
  });
});"#.to_string()
            }
            "python" => {
                r#"import pytest

class TestFunctionName:
    def test_normal_input(self):
        """Test with normal input."""
        # Arrange
        input_data = {}

        # Act
        result = function_name(input_data)

        # Assert
        assert result is not None

    def test_edge_cases(self):
        """Test edge cases."""
        pass

    def test_invalid_input(self):
        """Test with invalid input."""
        with pytest.raises(ValueError):
            function_name(None)"#.to_string()
            }
            "rust" => {
                r#"#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_normal_input() {
        // Arrange
        let input = ();

        // Act
        let result = function_name(input);

        // Assert
        assert!(result.is_ok());
    }

    #[test]
    fn test_edge_cases() {
        // Test edge cases
    }

    #[test]
    #[should_panic]
    fn test_invalid_input() {
        function_name(());
    }
}"#.to_string()
            }
            _ => "// Test code".to_string(),
        };

        CodingCommandResult {
            command_id: command.id.clone(),
            success: true,
            result_type: ResultType::CodeGenerated,
            code: Some(test_code),
            explanation: Some("Generated test template".to_string()),
            changes: vec![],
            error: None,
            suggestions: vec![
                "Customize the test cases".to_string(),
                "Add specific assertions".to_string(),
            ],
            undoable: true,
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
        let result = agent.execute_command(&command).await;
        assert!(result.success);
    }
}
