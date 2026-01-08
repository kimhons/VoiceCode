// REPL (Read-Eval-Print-Loop) Interface for VoiceCode CLI
// Provides interactive command-line coding experience similar to Claude Code

use colored::Colorize;
use rustyline::error::ReadlineError;
use rustyline::{CompletionType, Config, DefaultEditor, EditMode};
use std::collections::HashMap;
use std::io::{self, Write};
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::mpsc;

use super::agent_registry::AgentRegistry;
use super::commands::{CommandContext, CommandHandler, CommandResult};
use super::orchestrator::{AgentOrchestrator, OrchestrationStrategy};

/// REPL configuration
#[derive(Debug, Clone)]
pub struct ReplConfig {
    /// Prompt string
    pub prompt: String,
    /// Continuation prompt for multi-line input
    pub continuation_prompt: String,
    /// History file path
    pub history_file: Option<PathBuf>,
    /// Maximum history entries
    pub max_history: usize,
    /// Enable syntax highlighting
    pub syntax_highlighting: bool,
    /// Enable auto-suggestions
    pub auto_suggestions: bool,
    /// Working directory
    pub working_dir: PathBuf,
    /// Default orchestration strategy
    pub default_strategy: OrchestrationStrategy,
}

impl Default for ReplConfig {
    fn default() -> Self {
        Self {
            prompt: "voicecode> ".to_string(),
            continuation_prompt: "... ".to_string(),
            history_file: dirs::data_dir().map(|d| d.join("voicecode").join("history.txt")),
            max_history: 1000,
            syntax_highlighting: true,
            auto_suggestions: true,
            working_dir: std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")),
            default_strategy: OrchestrationStrategy::SingleAgent,
        }
    }
}

/// REPL session state
pub struct ReplSession {
    config: ReplConfig,
    command_handler: Arc<CommandHandler>,
    orchestrator: Arc<AgentOrchestrator>,
    registry: Arc<AgentRegistry>,
    context: CommandContext,
    running: bool,
}

impl ReplSession {
    pub fn new(
        config: ReplConfig,
        registry: Arc<AgentRegistry>,
        orchestrator: Arc<AgentOrchestrator>,
    ) -> Self {
        let command_handler = Arc::new(CommandHandler::new(
            Arc::clone(&registry),
            Arc::clone(&orchestrator),
        ));

        let context = CommandContext {
            working_dir: config.working_dir.clone(),
            current_file: None,
            selected_agent: None,
            variables: HashMap::new(),
            last_result: None,
            conversation_history: Vec::new(),
        };

        Self {
            config,
            command_handler,
            orchestrator,
            registry,
            context,
            running: false,
        }
    }

    /// Start the REPL loop
    pub async fn run(&mut self) -> Result<(), String> {
        self.running = true;
        self.print_welcome();

        // Configure rustyline
        let config = Config::builder()
            .history_ignore_space(true)
            .completion_type(CompletionType::List)
            .edit_mode(EditMode::Emacs)
            .build();

        let mut rl = DefaultEditor::with_config(config)
            .map_err(|e| format!("Failed to create editor: {}", e))?;

        // Load history
        if let Some(ref history_path) = self.config.history_file {
            if let Some(parent) = history_path.parent() {
                let _ = std::fs::create_dir_all(parent);
            }
            let _ = rl.load_history(history_path);
        }

        loop {
            let prompt = self.get_prompt();

            match rl.readline(&prompt) {
                Ok(line) => {
                    let line = line.trim();

                    if line.is_empty() {
                        continue;
                    }

                    // Add to history
                    let _ = rl.add_history_entry(line);

                    // Check for exit commands
                    if self.is_exit_command(line) {
                        self.print_goodbye();
                        break;
                    }

                    // Process the input
                    match self.process_input(line).await {
                        Ok(result) => {
                            self.display_result(&result);
                            self.context.last_result = Some(result);
                        }
                        Err(e) => {
                            eprintln!("{} {}", "Error:".red().bold(), e);
                        }
                    }
                }
                Err(ReadlineError::Interrupted) => {
                    println!("{}", "^C".yellow());
                    continue;
                }
                Err(ReadlineError::Eof) => {
                    println!("{}", "^D".yellow());
                    break;
                }
                Err(err) => {
                    eprintln!("{} {:?}", "Error:".red().bold(), err);
                    break;
                }
            }
        }

        // Save history
        if let Some(ref history_path) = self.config.history_file {
            let _ = rl.save_history(history_path);
        }

        self.running = false;
        Ok(())
    }

    /// Process user input
    async fn process_input(&mut self, input: &str) -> Result<CommandResult, String> {
        // Check for special commands
        if input.starts_with('/') {
            return self.handle_slash_command(input).await;
        }

        if input.starts_with('!') {
            return self.handle_shell_command(input).await;
        }

        // Natural language or code input - send to agent
        self.command_handler
            .handle_natural_input(input, &mut self.context)
            .await
    }

    /// Handle slash commands (/help, /agents, /config, etc.)
    async fn handle_slash_command(&mut self, input: &str) -> Result<CommandResult, String> {
        let parts: Vec<&str> = input[1..].splitn(2, ' ').collect();
        let command = parts[0];
        let args = parts.get(1).map(|s| s.to_string());

        match command {
            "help" | "h" | "?" => Ok(self.show_help()),
            "agents" | "a" => self.command_handler.list_agents(&self.context).await,
            "discover" => {
                self.command_handler
                    .discover_agents(&mut self.context)
                    .await
            }
            "select" => {
                let agent_id = args.ok_or("Agent ID required")?;
                self.command_handler
                    .select_agent(&agent_id, &mut self.context)
                    .await
            }
            "status" => self.command_handler.show_status(&self.context).await,
            "cd" => {
                let path = args.ok_or("Path required")?;
                self.change_directory(&path)
            }
            "pwd" => Ok(CommandResult::success(format!(
                "{}",
                self.context.working_dir.display()
            ))),
            "ls" | "dir" => self.list_directory(args.as_deref()),
            "open" | "edit" => {
                let path = args.ok_or("File path required")?;
                self.command_handler
                    .open_file(&path, &mut self.context)
                    .await
            }
            "close" => self.command_handler.close_file(&mut self.context).await,
            "generate" | "gen" => {
                let desc = args.ok_or("Description required")?;
                self.command_handler
                    .generate_code(&desc, &mut self.context)
                    .await
            }
            "review" => self.command_handler.review_code(&mut self.context).await,
            "fix" => {
                let error = args;
                self.command_handler
                    .fix_bug(error.as_deref(), &mut self.context)
                    .await
            }
            "refactor" => {
                let target = args.ok_or("Refactor type required")?;
                self.command_handler
                    .refactor(&target, &mut self.context)
                    .await
            }
            "test" => {
                let test_type = args.as_deref().unwrap_or("unit");
                self.command_handler
                    .generate_tests(test_type, &mut self.context)
                    .await
            }
            "explain" => self.command_handler.explain_code(&mut self.context).await,
            "search" => {
                let query = args.ok_or("Search query required")?;
                self.command_handler.search(&query, &mut self.context).await
            }
            "git" => {
                let cmd = args.ok_or("Git command required")?;
                self.command_handler
                    .git_command(&cmd, &mut self.context)
                    .await
            }
            "run" | "exec" => {
                let cmd = args.ok_or("Command required")?;
                self.command_handler
                    .run_command(&cmd, &mut self.context)
                    .await
            }
            "strategy" => {
                let strategy = args.ok_or("Strategy required")?;
                self.set_strategy(&strategy)
            }
            "history" => Ok(self.show_history()),
            "clear" => {
                self.clear_screen();
                Ok(CommandResult::success(""))
            }
            "config" => {
                let setting = args;
                self.handle_config(setting.as_deref())
            }
            "exit" | "quit" | "q" => {
                self.running = false;
                Ok(CommandResult::success("Goodbye!"))
            }
            _ => Err(format!(
                "Unknown command: /{}. Type /help for available commands.",
                command
            )),
        }
    }

    /// Handle shell commands (! prefix)
    async fn handle_shell_command(&mut self, input: &str) -> Result<CommandResult, String> {
        let cmd = &input[1..].trim();
        self.command_handler
            .run_command(cmd, &mut self.context)
            .await
    }

    /// Show help message
    fn show_help(&self) -> CommandResult {
        let help = r#"
VoiceCode CLI - Interactive AI-Powered Coding Assistant

NAVIGATION:
  /cd <path>        Change working directory
  /pwd              Print working directory
  /ls [path]        List directory contents
  /open <file>      Open file for editing
  /close            Close current file

CODE OPERATIONS:
  /generate <desc>  Generate code from description
  /review           Review current code
  /fix [error]      Fix bugs in current code
  /refactor <type>  Refactor code (rename, extract, inline, etc.)
  /test [type]      Generate tests (unit, integration, e2e)
  /explain          Explain current code
  /search <query>   Search codebase

AGENT MANAGEMENT:
  /agents           List available agents
  /discover         Discover external agents
  /select <id>      Select specific agent
  /status           Show current status
  /strategy <name>  Set orchestration strategy
                    (single, race, consensus, pipeline, decompose)

UTILITIES:
  /git <command>    Run git command
  /run <command>    Run shell command
  !<command>        Shell command shortcut
  /history          Show command history
  /config [key=val] View/set configuration
  /clear            Clear screen
  /help             Show this help
  /exit             Exit REPL

NATURAL LANGUAGE:
  Just type your request naturally, e.g.:
  > Create a function that sorts an array
  > Fix the null pointer error in user.rs
  > Add error handling to the API endpoints

TIPS:
  - Use Tab for auto-completion
  - Use Up/Down arrows for history
  - Use Ctrl+C to cancel current operation
  - Use Ctrl+D or /exit to quit
"#;
        CommandResult::success(help.trim())
    }

    /// Get dynamic prompt
    fn get_prompt(&self) -> String {
        let mut prompt = String::new();

        // Add working directory (shortened)
        let dir = self
            .context
            .working_dir
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("~");
        prompt.push_str(&format!("{}", dir.blue()));

        // Add current file if any
        if let Some(ref file) = self.context.current_file {
            let filename = PathBuf::from(file)
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or(file);
            prompt.push_str(&format!(" {}", format!("[{}]", filename).cyan()));
        }

        // Add selected agent if not default
        if let Some(ref agent) = self.context.selected_agent {
            prompt.push_str(&format!(" {}", format!("({})", agent).yellow()));
        }

        prompt.push_str(&format!(" {} ", ">".green().bold()));
        prompt
    }

    /// Print welcome message
    fn print_welcome(&self) {
        let banner = r#"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ██╗   ██╗ ██████╗ ██╗ ██████╗███████╗ ██████╗ ██████╗   ║
║   ██║   ██║██╔═══██╗██║██╔════╝██╔════╝██╔════╝██╔═══██╗  ║
║   ██║   ██║██║   ██║██║██║     █████╗  ██║     ██║   ██║  ║
║   ╚██╗ ██╔╝██║   ██║██║██║     ██╔══╝  ██║     ██║   ██║  ║
║    ╚████╔╝ ╚██████╔╝██║╚██████╗███████╗╚██████╗╚██████╔╝  ║
║     ╚═══╝   ╚═════╝ ╚═╝ ╚═════╝╚══════╝ ╚═════╝ ╚═════╝   ║
║                                                           ║
║         AI-Powered Voice & Text Coding Assistant          ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
"#;
        println!("{}", banner.bright_magenta());
        println!(
            "  Type {} for available commands, {} to exit\n",
            "/help".green(),
            "/exit".red()
        );
        println!(
            "  Working directory: {}\n",
            self.context.working_dir.display().to_string().blue()
        );
    }

    /// Print goodbye message
    fn print_goodbye(&self) {
        println!(
            "\n{}",
            "Thanks for using VoiceCode! Goodbye! 👋".bright_cyan()
        );
    }

    /// Check if input is an exit command
    fn is_exit_command(&self, input: &str) -> bool {
        matches!(
            input.to_lowercase().as_str(),
            "exit" | "quit" | "q" | "/exit" | "/quit" | "/q"
        )
    }

    /// Display command result
    fn display_result(&self, result: &CommandResult) {
        if result.success {
            if !result.output.is_empty() {
                println!("{}", result.output);
            }
        } else {
            if let Some(ref error) = result.error {
                eprintln!("{} {}", "Error:".red().bold(), error);
            }
        }

        // Show any code changes
        for change in &result.changes {
            println!("\n{} {}", "Modified:".yellow(), change.file_path.cyan());
            if let Some(ref preview) = change.preview {
                println!("{}", preview.dimmed());
            }
        }
    }

    /// Change working directory
    fn change_directory(&mut self, path: &str) -> Result<CommandResult, String> {
        let new_path = if path.starts_with('/') || path.starts_with('\\') || path.contains(':') {
            PathBuf::from(path)
        } else if path == "~" {
            dirs::home_dir().ok_or("Cannot find home directory")?
        } else if path == "-" {
            // Go to previous directory (would need to track this)
            self.context.working_dir.clone()
        } else {
            self.context.working_dir.join(path)
        };

        let canonical = new_path
            .canonicalize()
            .map_err(|_| format!("Directory not found: {}", path))?;

        if !canonical.is_dir() {
            return Err(format!("Not a directory: {}", path));
        }

        self.context.working_dir = canonical.clone();
        Ok(CommandResult::success(format!(
            "Changed to: {}",
            canonical.display()
        )))
    }

    /// List directory contents
    fn list_directory(&self, path: Option<&str>) -> Result<CommandResult, String> {
        let target = match path {
            Some(p) => self.context.working_dir.join(p),
            None => self.context.working_dir.clone(),
        };

        let entries =
            std::fs::read_dir(&target).map_err(|e| format!("Cannot read directory: {}", e))?;

        let mut dirs = Vec::new();
        let mut files = Vec::new();

        for entry in entries.flatten() {
            let name = entry.file_name().to_string_lossy().to_string();
            if entry.file_type().map(|t| t.is_dir()).unwrap_or(false) {
                dirs.push(format!("{}/", name).blue().to_string());
            } else {
                files.push(name);
            }
        }

        dirs.sort();
        files.sort();

        let mut output = dirs;
        output.extend(files);

        Ok(CommandResult::success(output.join("  ")))
    }

    /// Set orchestration strategy
    fn set_strategy(&mut self, strategy: &str) -> Result<CommandResult, String> {
        let new_strategy = match strategy.to_lowercase().as_str() {
            "single" | "s" => OrchestrationStrategy::SingleAgent,
            "race" | "r" => OrchestrationStrategy::RaceExecution,
            "consensus" | "c" => OrchestrationStrategy::Consensus,
            "pipeline" | "p" => OrchestrationStrategy::Pipeline,
            "decompose" | "d" => OrchestrationStrategy::Decomposition,
            _ => {
                return Err(format!(
                    "Unknown strategy: {}. Options: single, race, consensus, pipeline, decompose",
                    strategy
                ))
            }
        };

        self.config.default_strategy = new_strategy.clone();
        Ok(CommandResult::success(format!(
            "Strategy set to: {:?}",
            new_strategy
        )))
    }

    /// Show command history
    fn show_history(&self) -> CommandResult {
        let history: Vec<String> = self
            .context
            .conversation_history
            .iter()
            .enumerate()
            .map(|(i, h)| format!("{:4}  {}", i + 1, h))
            .collect();

        CommandResult::success(history.join("\n"))
    }

    /// Handle config command
    fn handle_config(&mut self, setting: Option<&str>) -> Result<CommandResult, String> {
        match setting {
            None => {
                // Show current config
                let config = format!(
                    "prompt: {}\nworking_dir: {}\nstrategy: {:?}\nsyntax_highlighting: {}\nauto_suggestions: {}",
                    self.config.prompt,
                    self.config.working_dir.display(),
                    self.config.default_strategy,
                    self.config.syntax_highlighting,
                    self.config.auto_suggestions,
                );
                Ok(CommandResult::success(config))
            }
            Some(setting) => {
                let parts: Vec<&str> = setting.splitn(2, '=').collect();
                if parts.len() != 2 {
                    return Err("Format: /config key=value".to_string());
                }

                let key = parts[0].trim();
                let value = parts[1].trim();

                match key {
                    "prompt" => {
                        self.config.prompt = value.to_string();
                        Ok(CommandResult::success(format!("prompt set to: {}", value)))
                    }
                    "syntax_highlighting" => {
                        self.config.syntax_highlighting = value.parse().unwrap_or(true);
                        Ok(CommandResult::success(format!(
                            "syntax_highlighting: {}",
                            self.config.syntax_highlighting
                        )))
                    }
                    "auto_suggestions" => {
                        self.config.auto_suggestions = value.parse().unwrap_or(true);
                        Ok(CommandResult::success(format!(
                            "auto_suggestions: {}",
                            self.config.auto_suggestions
                        )))
                    }
                    _ => Err(format!("Unknown config key: {}", key)),
                }
            }
        }
    }

    /// Clear terminal screen
    fn clear_screen(&self) {
        print!("\x1B[2J\x1B[1;1H");
        let _ = io::stdout().flush();
    }
}

/// Non-interactive CLI mode for scripting
pub struct BatchMode {
    command_handler: Arc<CommandHandler>,
    context: CommandContext,
}

impl BatchMode {
    pub fn new(registry: Arc<AgentRegistry>, orchestrator: Arc<AgentOrchestrator>) -> Self {
        let command_handler = Arc::new(CommandHandler::new(registry, orchestrator));

        let context = CommandContext {
            working_dir: std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")),
            current_file: None,
            selected_agent: None,
            variables: HashMap::new(),
            last_result: None,
            conversation_history: Vec::new(),
        };

        Self {
            command_handler,
            context,
        }
    }

    /// Execute a single command
    pub async fn execute(&mut self, input: &str) -> Result<CommandResult, String> {
        if input.starts_with('/') {
            // Slash command - not fully implemented in batch mode
            Err("Slash commands not supported in batch mode. Use natural language.".to_string())
        } else {
            self.command_handler
                .handle_natural_input(input, &mut self.context)
                .await
        }
    }

    /// Execute from file
    pub async fn execute_file(&mut self, path: &str) -> Result<Vec<CommandResult>, String> {
        let content =
            std::fs::read_to_string(path).map_err(|e| format!("Failed to read file: {}", e))?;

        let mut results = Vec::new();

        for line in content.lines() {
            let line = line.trim();
            if line.is_empty() || line.starts_with('#') {
                continue;
            }

            match self.execute(line).await {
                Ok(result) => results.push(result),
                Err(e) => {
                    results.push(CommandResult::failure(e));
                    break;
                }
            }
        }

        Ok(results)
    }
}

#[cfg(test)]
mod tests {
    use super::super::orchestrator::OrchestratorConfig;
    use super::*;

    #[test]
    fn test_repl_config_default() {
        let config = ReplConfig::default();
        assert_eq!(config.prompt, "voicecode> ");
        assert!(config.syntax_highlighting);
    }

    #[tokio::test]
    async fn test_batch_mode_creation() {
        let registry = Arc::new(AgentRegistry::with_voicecode_agent());
        let orchestrator = Arc::new(AgentOrchestrator::new(
            Arc::clone(&registry),
            OrchestratorConfig::default(),
        ));

        let batch = BatchMode::new(registry, orchestrator);
        assert!(batch.context.current_file.is_none());
    }
}
