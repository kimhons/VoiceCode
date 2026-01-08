// CLI Command Handler - Processes user commands and delegates to agents
// Supports both slash commands and natural language input

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::process::Stdio;
use std::sync::Arc;
use tokio::process::Command;

use super::agent_protocol::{TaskContext, TaskStatus, TaskType};
use super::agent_registry::{AgentInfo, AgentRegistry};
use super::orchestrator::{AgentOrchestrator, OrchestrationStrategy};

/// Result of a command execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandResult {
    pub success: bool,
    pub output: String,
    pub error: Option<String>,
    pub changes: Vec<FileChange>,
    pub suggestions: Vec<String>,
}

impl CommandResult {
    pub fn success(output: impl Into<String>) -> Self {
        Self {
            success: true,
            output: output.into(),
            error: None,
            changes: vec![],
            suggestions: vec![],
        }
    }

    pub fn failure(error: impl Into<String>) -> Self {
        Self {
            success: false,
            output: String::new(),
            error: Some(error.into()),
            changes: vec![],
            suggestions: vec![],
        }
    }

    pub fn with_changes(mut self, changes: Vec<FileChange>) -> Self {
        self.changes = changes;
        self
    }

    pub fn with_suggestions(mut self, suggestions: Vec<String>) -> Self {
        self.suggestions = suggestions;
        self
    }
}

/// File change from a command
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileChange {
    pub file_path: String,
    pub change_type: ChangeType,
    pub preview: Option<String>,
    pub applied: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ChangeType {
    Created,
    Modified,
    Deleted,
}

/// Context for command execution
#[derive(Debug, Clone)]
pub struct CommandContext {
    pub working_dir: PathBuf,
    pub current_file: Option<String>,
    pub selected_agent: Option<String>,
    pub variables: HashMap<String, String>,
    pub last_result: Option<CommandResult>,
    pub conversation_history: Vec<String>,
}

impl CommandContext {
    /// Get task context for agent execution
    pub fn to_task_context(&self) -> TaskContext {
        let code_content = if let Some(ref file) = self.current_file {
            let path = self.working_dir.join(file);
            std::fs::read_to_string(&path).ok()
        } else {
            None
        };

        TaskContext {
            file_path: self.current_file.clone(),
            code_content,
            cursor_position: None,
            selection: None,
            related_files: None,
            project_root: Some(self.working_dir.to_string_lossy().to_string()),
            additional_context: self.variables.clone(),
        }
    }
}

/// Command handler for processing CLI commands
pub struct CommandHandler {
    registry: Arc<AgentRegistry>,
    orchestrator: Arc<AgentOrchestrator>,
}

impl CommandHandler {
    pub fn new(registry: Arc<AgentRegistry>, orchestrator: Arc<AgentOrchestrator>) -> Self {
        Self {
            registry,
            orchestrator,
        }
    }

    /// Handle natural language input
    pub async fn handle_natural_input(
        &self,
        input: &str,
        context: &mut CommandContext,
    ) -> Result<CommandResult, String> {
        // Add to conversation history
        context
            .conversation_history
            .push(format!("user: {}", input));

        // Classify the intent from natural language
        let intent = self.classify_intent(input);

        // Convert to task type and execute
        let task_type = self.intent_to_task_type(&intent, input);
        let task_context = context.to_task_context();

        let result = self
            .orchestrator
            .execute_task(task_type, task_context, OrchestrationStrategy::SingleAgent)
            .await?;

        // Extract output from aggregated result
        let output = result
            .consensus_result
            .and_then(|r| r.output)
            .unwrap_or_else(|| "Task completed.".to_string());

        // Convert code changes
        let changes: Vec<FileChange> = result
            .results
            .iter()
            .flat_map(|r| r.changes.iter())
            .map(|c| FileChange {
                file_path: c.file_path.clone(),
                change_type: match c.change_type {
                    super::agent_protocol::ChangeType::Create => ChangeType::Created,
                    super::agent_protocol::ChangeType::Modify => ChangeType::Modified,
                    super::agent_protocol::ChangeType::Delete => ChangeType::Deleted,
                    _ => ChangeType::Modified,
                },
                preview: Some(c.new_content.chars().take(200).collect()),
                applied: false,
            })
            .collect();

        // Add response to history
        context
            .conversation_history
            .push(format!("assistant: {}", &output));

        Ok(CommandResult::success(output).with_changes(changes))
    }

    /// Classify intent from natural language
    fn classify_intent(&self, input: &str) -> Intent {
        let input_lower = input.to_lowercase();

        // Code generation patterns
        if input_lower.contains("create")
            || input_lower.contains("generate")
            || input_lower.contains("write")
            || input_lower.contains("make")
            || input_lower.contains("add a")
            || input_lower.contains("implement")
        {
            return Intent::Generate;
        }

        // Bug fix patterns
        if input_lower.contains("fix")
            || input_lower.contains("bug")
            || input_lower.contains("error")
            || input_lower.contains("debug")
            || input_lower.contains("issue")
            || input_lower.contains("problem")
        {
            return Intent::Fix;
        }

        // Review patterns
        if input_lower.contains("review")
            || input_lower.contains("check")
            || input_lower.contains("analyze")
            || input_lower.contains("audit")
        {
            return Intent::Review;
        }

        // Refactor patterns
        if input_lower.contains("refactor")
            || input_lower.contains("rename")
            || input_lower.contains("extract")
            || input_lower.contains("move")
            || input_lower.contains("restructure")
        {
            return Intent::Refactor;
        }

        // Test patterns
        if input_lower.contains("test")
            || input_lower.contains("spec")
            || input_lower.contains("coverage")
        {
            return Intent::Test;
        }

        // Explain patterns
        if input_lower.contains("explain")
            || input_lower.contains("what does")
            || input_lower.contains("how does")
            || input_lower.contains("why")
            || input_lower.contains("understand")
        {
            return Intent::Explain;
        }

        // Search patterns
        if input_lower.contains("find")
            || input_lower.contains("search")
            || input_lower.contains("where is")
            || input_lower.contains("look for")
        {
            return Intent::Search;
        }

        // Document patterns
        if input_lower.contains("document")
            || input_lower.contains("comment")
            || input_lower.contains("docstring")
            || input_lower.contains("readme")
        {
            return Intent::Document;
        }

        // Default to general chat/code assistance
        Intent::Chat
    }

    /// Convert intent to task type
    fn intent_to_task_type(&self, intent: &Intent, input: &str) -> TaskType {
        match intent {
            Intent::Generate => TaskType::CodeGeneration {
                language: self.detect_language(input).unwrap_or("auto".to_string()),
                description: input.to_string(),
            },
            Intent::Fix => TaskType::BugFix {
                error_message: Some(input.to_string()),
                stack_trace: None,
            },
            Intent::Review => TaskType::CodeReview {
                focus_areas: vec![],
            },
            Intent::Refactor => TaskType::Refactoring {
                refactor_type: self.extract_refactor_type(input),
                scope: "file".to_string(),
            },
            Intent::Test => TaskType::TestGeneration {
                test_type: self.extract_test_type(input),
                coverage_target: 80,
            },
            Intent::Explain => TaskType::Explanation {
                detail_level: "detailed".to_string(),
            },
            Intent::Search => TaskType::Search {
                query: input.to_string(),
                scope: "project".to_string(),
            },
            Intent::Document => TaskType::Documentation {
                doc_type: "inline".to_string(),
                format: "markdown".to_string(),
            },
            Intent::Chat => TaskType::Custom {
                name: "chat".to_string(),
                params: {
                    let mut params = HashMap::new();
                    params.insert("message".to_string(), input.to_string());
                    params
                },
            },
        }
    }

    /// Detect programming language from input
    fn detect_language(&self, input: &str) -> Option<String> {
        let input_lower = input.to_lowercase();

        let languages = [
            ("rust", vec!["rust", "rs", "cargo"]),
            ("typescript", vec!["typescript", "ts", "tsx"]),
            ("javascript", vec!["javascript", "js", "jsx", "node"]),
            ("python", vec!["python", "py", "pip"]),
            ("go", vec!["go", "golang"]),
            ("java", vec!["java", "jvm"]),
            ("csharp", vec!["c#", "csharp", "dotnet", ".net"]),
            ("cpp", vec!["c++", "cpp"]),
            ("ruby", vec!["ruby", "rb", "rails"]),
            ("php", vec!["php"]),
            ("swift", vec!["swift", "ios"]),
            ("kotlin", vec!["kotlin", "android"]),
        ];

        for (lang, patterns) in &languages {
            for pattern in patterns {
                if input_lower.contains(pattern) {
                    return Some(lang.to_string());
                }
            }
        }

        None
    }

    /// Extract refactor type from input
    fn extract_refactor_type(&self, input: &str) -> String {
        let input_lower = input.to_lowercase();

        if input_lower.contains("rename") {
            "rename".to_string()
        } else if input_lower.contains("extract") {
            "extract".to_string()
        } else if input_lower.contains("inline") {
            "inline".to_string()
        } else if input_lower.contains("move") {
            "move".to_string()
        } else {
            "general".to_string()
        }
    }

    /// Extract test type from input
    fn extract_test_type(&self, input: &str) -> String {
        let input_lower = input.to_lowercase();

        if input_lower.contains("integration") {
            "integration".to_string()
        } else if input_lower.contains("e2e") || input_lower.contains("end-to-end") {
            "e2e".to_string()
        } else {
            "unit".to_string()
        }
    }

    /// List available agents
    pub async fn list_agents(&self, _context: &CommandContext) -> Result<CommandResult, String> {
        let agents = self.registry.list().await;

        let output: Vec<String> = agents
            .iter()
            .map(|a| {
                format!(
                    "{} [{}] - {} ({:?}) Priority: {}",
                    if a.status == super::agent_registry::AgentStatus::Available {
                        "●"
                    } else {
                        "○"
                    },
                    a.id,
                    a.name,
                    a.agent_type,
                    a.priority
                )
            })
            .collect();

        Ok(CommandResult::success(format!(
            "Available Agents ({}):\n{}",
            agents.len(),
            output.join("\n")
        )))
    }

    /// Discover external agents
    pub async fn discover_agents(
        &self,
        _context: &mut CommandContext,
    ) -> Result<CommandResult, String> {
        let discovered = self.registry.discover().await;

        if discovered.is_empty() {
            Ok(CommandResult::success("No new agents discovered."))
        } else {
            let names: Vec<String> = discovered
                .iter()
                .map(|a| {
                    format!(
                        "  - {} ({})",
                        a.name,
                        a.endpoint.as_deref().unwrap_or("local")
                    )
                })
                .collect();

            Ok(CommandResult::success(format!(
                "Discovered {} agent(s):\n{}",
                discovered.len(),
                names.join("\n")
            )))
        }
    }

    /// Select a specific agent
    pub async fn select_agent(
        &self,
        agent_id: &str,
        context: &mut CommandContext,
    ) -> Result<CommandResult, String> {
        let agent = self
            .registry
            .get(agent_id)
            .await
            .ok_or_else(|| format!("Agent not found: {}", agent_id))?;

        context.selected_agent = Some(agent.id.clone());

        Ok(CommandResult::success(format!(
            "Selected agent: {} ({})",
            agent.name, agent.id
        )))
    }

    /// Show current status
    pub async fn show_status(&self, context: &CommandContext) -> Result<CommandResult, String> {
        let agents = self.registry.list_available().await;
        let active_tasks = self.orchestrator.active_tasks().await;

        let mut status = String::new();
        status.push_str(&format!(
            "Working Directory: {}\n",
            context.working_dir.display()
        ));

        if let Some(ref file) = context.current_file {
            status.push_str(&format!("Current File: {}\n", file));
        }

        if let Some(ref agent) = context.selected_agent {
            status.push_str(&format!("Selected Agent: {}\n", agent));
        }

        status.push_str(&format!("\nAvailable Agents: {}\n", agents.len()));
        status.push_str(&format!("Active Tasks: {}\n", active_tasks.len()));

        Ok(CommandResult::success(status))
    }

    /// Open a file for editing
    pub async fn open_file(
        &self,
        path: &str,
        context: &mut CommandContext,
    ) -> Result<CommandResult, String> {
        let full_path = context.working_dir.join(path);

        if !full_path.exists() {
            return Err(format!("File not found: {}", path));
        }

        let content = std::fs::read_to_string(&full_path)
            .map_err(|e| format!("Failed to read file: {}", e))?;

        context.current_file = Some(path.to_string());

        // Show preview
        let preview: String = content.lines().take(20).collect::<Vec<_>>().join("\n");
        let line_count = content.lines().count();

        Ok(CommandResult::success(format!(
            "Opened: {} ({} lines)\n\n{}{}",
            path,
            line_count,
            preview,
            if line_count > 20 { "\n..." } else { "" }
        )))
    }

    /// Close current file
    pub async fn close_file(&self, context: &mut CommandContext) -> Result<CommandResult, String> {
        if context.current_file.is_none() {
            return Ok(CommandResult::success("No file currently open."));
        }

        let file = context.current_file.take().unwrap();
        Ok(CommandResult::success(format!("Closed: {}", file)))
    }

    /// Generate code
    pub async fn generate_code(
        &self,
        description: &str,
        context: &mut CommandContext,
    ) -> Result<CommandResult, String> {
        let task_type = TaskType::CodeGeneration {
            language: self
                .detect_language(description)
                .unwrap_or("auto".to_string()),
            description: description.to_string(),
        };

        let task_context = context.to_task_context();

        let result = self
            .orchestrator
            .execute_task(task_type, task_context, OrchestrationStrategy::SingleAgent)
            .await?;

        let output = result
            .consensus_result
            .and_then(|r| r.output)
            .unwrap_or_else(|| "Code generated.".to_string());

        Ok(CommandResult::success(output))
    }

    /// Review current code
    pub async fn review_code(&self, context: &mut CommandContext) -> Result<CommandResult, String> {
        if context.current_file.is_none() {
            return Err("No file open. Use /open <file> first.".to_string());
        }

        let task_type = TaskType::CodeReview {
            focus_areas: vec![],
        };

        let task_context = context.to_task_context();

        let result = self
            .orchestrator
            .execute_task(task_type, task_context, OrchestrationStrategy::SingleAgent)
            .await?;

        let output = result
            .consensus_result
            .and_then(|r| r.output)
            .unwrap_or_else(|| "Review completed.".to_string());

        Ok(CommandResult::success(output))
    }

    /// Fix a bug
    pub async fn fix_bug(
        &self,
        error: Option<&str>,
        context: &mut CommandContext,
    ) -> Result<CommandResult, String> {
        let task_type = TaskType::BugFix {
            error_message: error.map(|e| e.to_string()),
            stack_trace: None,
        };

        let task_context = context.to_task_context();

        let result = self
            .orchestrator
            .execute_task(task_type, task_context, OrchestrationStrategy::SingleAgent)
            .await?;

        let output = result
            .consensus_result
            .and_then(|r| r.output)
            .unwrap_or_else(|| "Fix applied.".to_string());

        Ok(CommandResult::success(output))
    }

    /// Refactor code
    pub async fn refactor(
        &self,
        refactor_type: &str,
        context: &mut CommandContext,
    ) -> Result<CommandResult, String> {
        let task_type = TaskType::Refactoring {
            refactor_type: refactor_type.to_string(),
            scope: "file".to_string(),
        };

        let task_context = context.to_task_context();

        let result = self
            .orchestrator
            .execute_task(task_type, task_context, OrchestrationStrategy::SingleAgent)
            .await?;

        let output = result
            .consensus_result
            .and_then(|r| r.output)
            .unwrap_or_else(|| "Refactoring completed.".to_string());

        Ok(CommandResult::success(output))
    }

    /// Generate tests
    pub async fn generate_tests(
        &self,
        test_type: &str,
        context: &mut CommandContext,
    ) -> Result<CommandResult, String> {
        if context.current_file.is_none() {
            return Err("No file open. Use /open <file> first.".to_string());
        }

        let task_type = TaskType::TestGeneration {
            test_type: test_type.to_string(),
            coverage_target: 80,
        };

        let task_context = context.to_task_context();

        let result = self
            .orchestrator
            .execute_task(task_type, task_context, OrchestrationStrategy::SingleAgent)
            .await?;

        let output = result
            .consensus_result
            .and_then(|r| r.output)
            .unwrap_or_else(|| "Tests generated.".to_string());

        Ok(CommandResult::success(output))
    }

    /// Explain code
    pub async fn explain_code(
        &self,
        context: &mut CommandContext,
    ) -> Result<CommandResult, String> {
        if context.current_file.is_none() {
            return Err("No file open. Use /open <file> first.".to_string());
        }

        let task_type = TaskType::Explanation {
            detail_level: "detailed".to_string(),
        };

        let task_context = context.to_task_context();

        let result = self
            .orchestrator
            .execute_task(task_type, task_context, OrchestrationStrategy::SingleAgent)
            .await?;

        let output = result
            .consensus_result
            .and_then(|r| r.output)
            .unwrap_or_else(|| "Explanation generated.".to_string());

        Ok(CommandResult::success(output))
    }

    /// Search codebase
    pub async fn search(
        &self,
        query: &str,
        context: &mut CommandContext,
    ) -> Result<CommandResult, String> {
        let task_type = TaskType::Search {
            query: query.to_string(),
            scope: "project".to_string(),
        };

        let task_context = context.to_task_context();

        let result = self
            .orchestrator
            .execute_task(task_type, task_context, OrchestrationStrategy::SingleAgent)
            .await?;

        let output = result
            .consensus_result
            .and_then(|r| r.output)
            .unwrap_or_else(|| "Search completed.".to_string());

        Ok(CommandResult::success(output))
    }

    /// Run git command
    pub async fn git_command(
        &self,
        cmd: &str,
        context: &mut CommandContext,
    ) -> Result<CommandResult, String> {
        let args: Vec<&str> = cmd.split_whitespace().collect();

        let output = Command::new("git")
            .args(&args)
            .current_dir(&context.working_dir)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .await
            .map_err(|e| format!("Failed to run git: {}", e))?;

        if output.status.success() {
            Ok(CommandResult::success(
                String::from_utf8_lossy(&output.stdout).to_string(),
            ))
        } else {
            Err(String::from_utf8_lossy(&output.stderr).to_string())
        }
    }

    /// Run shell command
    pub async fn run_command(
        &self,
        cmd: &str,
        context: &mut CommandContext,
    ) -> Result<CommandResult, String> {
        let shell = if cfg!(windows) { "cmd" } else { "sh" };
        let shell_arg = if cfg!(windows) { "/C" } else { "-c" };

        let output = Command::new(shell)
            .args([shell_arg, cmd])
            .current_dir(&context.working_dir)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .await
            .map_err(|e| format!("Failed to run command: {}", e))?;

        let stdout = String::from_utf8_lossy(&output.stdout);
        let stderr = String::from_utf8_lossy(&output.stderr);

        if output.status.success() {
            Ok(CommandResult::success(stdout.to_string()))
        } else {
            Ok(CommandResult::success(format!("{}\n{}", stdout, stderr)))
        }
    }
}

/// User intent classification
#[derive(Debug, Clone, PartialEq, Eq)]
enum Intent {
    Generate,
    Fix,
    Review,
    Refactor,
    Test,
    Explain,
    Search,
    Document,
    Chat,
}

#[cfg(test)]
mod tests {
    use super::super::orchestrator::OrchestratorConfig;
    use super::*;

    #[tokio::test]
    async fn test_command_handler_creation() {
        let registry = Arc::new(AgentRegistry::with_voicecode_agent());
        let orchestrator = Arc::new(AgentOrchestrator::new(
            Arc::clone(&registry),
            OrchestratorConfig::default(),
        ));

        let handler = CommandHandler::new(registry, orchestrator);
        assert!(handler.detect_language("create a rust function").unwrap() == "rust");
    }

    #[test]
    fn test_intent_classification() {
        let registry = Arc::new(AgentRegistry::with_voicecode_agent());
        let orchestrator = Arc::new(AgentOrchestrator::new(
            registry.clone(),
            OrchestratorConfig::default(),
        ));
        let handler = CommandHandler::new(registry, orchestrator);

        assert_eq!(
            handler.classify_intent("create a function"),
            Intent::Generate
        );
        assert_eq!(handler.classify_intent("fix the bug"), Intent::Fix);
        assert_eq!(handler.classify_intent("review this code"), Intent::Review);
        assert_eq!(
            handler.classify_intent("refactor the module"),
            Intent::Refactor
        );
        assert_eq!(
            handler.classify_intent("explain how it works"),
            Intent::Explain
        );
    }

    #[test]
    fn test_language_detection() {
        let registry = Arc::new(AgentRegistry::with_voicecode_agent());
        let orchestrator = Arc::new(AgentOrchestrator::new(
            registry.clone(),
            OrchestratorConfig::default(),
        ));
        let handler = CommandHandler::new(registry, orchestrator);

        assert_eq!(
            handler.detect_language("rust function"),
            Some("rust".to_string())
        );
        assert_eq!(
            handler.detect_language("python script"),
            Some("python".to_string())
        );
        assert_eq!(
            handler.detect_language("typescript class"),
            Some("typescript".to_string())
        );
    }
}
