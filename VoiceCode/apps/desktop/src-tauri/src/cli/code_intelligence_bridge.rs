#![allow(dead_code, unused_variables, unused_imports)]
// Code Intelligence Bridge - Connects CLI with Code Intelligence Modules
// Provides seamless integration between CLI commands and advanced code analysis

use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::code_intelligence::{
    UnifiedContextEngine, UnifiedContextConfig, UnifiedContextRequest,
    VoiceGrammarParser, VoiceCommand, VoiceAction,
    MetaAgentOrchestrator, MetaAgentConfig, TaskType,
    TribalKnowledgeExtractor,
    RecitationValidator, RecitationResult,
    DynamicBudgetManager, ContextCategory, BudgetPlan, TaskProfile,
    MultiRepoManager, WorkspaceInfo,
    SandboxManager, SandboxConfig, CommandAnalysis,
    PromptEngineer, PromptType, BuiltPrompt,
    VoiceStreamManager, StreamConfig,
    ASTEngine, SymbolTable,
};

use super::commands::{CommandContext, CommandResult};

/// Bridge between CLI and Code Intelligence systems
pub struct CodeIntelligenceBridge {
    context_engine: Arc<RwLock<Option<UnifiedContextEngine>>>,
    voice_parser: Arc<VoiceGrammarParser>,
    meta_agent: Arc<RwLock<Option<MetaAgentOrchestrator>>>,
    tribal_extractor: Arc<RwLock<Option<TribalKnowledgeExtractor>>>,
    recitation_validator: Arc<RwLock<Option<RecitationValidator>>>,
    budget_manager: Arc<RwLock<DynamicBudgetManager>>,
    multi_repo: Arc<RwLock<Option<MultiRepoManager>>>,
    sandbox: Arc<RwLock<Option<SandboxManager>>>,
    prompt_engineer: Arc<PromptEngineer>,
    voice_stream: Arc<RwLock<Option<VoiceStreamManager>>>,
    project_root: Arc<RwLock<Option<PathBuf>>>,
    initialized: Arc<RwLock<bool>>,
}

impl CodeIntelligenceBridge {
    pub fn new() -> Self {
        Self {
            context_engine: Arc::new(RwLock::new(None)),
            voice_parser: Arc::new(VoiceGrammarParser::new()),
            meta_agent: Arc::new(RwLock::new(None)),
            tribal_extractor: Arc::new(RwLock::new(None)),
            recitation_validator: Arc::new(RwLock::new(None)),
            budget_manager: Arc::new(RwLock::new(DynamicBudgetManager::for_model("claude-3-sonnet"))),
            multi_repo: Arc::new(RwLock::new(None)),
            sandbox: Arc::new(RwLock::new(None)),
            prompt_engineer: Arc::new(PromptEngineer::new()),
            voice_stream: Arc::new(RwLock::new(None)),
            project_root: Arc::new(RwLock::new(None)),
            initialized: Arc::new(RwLock::new(false)),
        }
    }

    /// Initialize the bridge for a project
    pub async fn initialize(&self, project_root: PathBuf) -> Result<InitializationResult, String> {
        // Initialize context engine
        let config = UnifiedContextConfig::default();
        let engine = UnifiedContextEngine::new(project_root.clone(), config).await
            .map_err(|e| format!("Failed to create context engine: {}", e))?;
        
        let index_stats = engine.initialize().await
            .map_err(|e| format!("Failed to initialize: {}", e))?;

        *self.context_engine.write().await = Some(engine);

        // Initialize meta-agent
        let agent_config = MetaAgentConfig::default();
        let meta_agent = MetaAgentOrchestrator::new(project_root.clone(), agent_config);
        let agents = meta_agent.detect_agents().await;
        *self.meta_agent.write().await = Some(meta_agent);

        // Initialize multi-repo
        let mut multi_repo = MultiRepoManager::new();
        let workspace_info = multi_repo.discover_workspace(&project_root).await.ok();
        *self.multi_repo.write().await = Some(multi_repo);

        // Initialize sandbox
        let sandbox = SandboxManager::new(project_root.clone(), SandboxConfig::default());
        *self.sandbox.write().await = Some(sandbox);

        // Initialize voice streaming
        let voice_stream = VoiceStreamManager::new(StreamConfig::default());
        *self.voice_stream.write().await = Some(voice_stream);

        // Initialize recitation validator
        let ast_engine = Arc::new(ASTEngine::new());
        let symbol_table = Arc::new(SymbolTable::new());
        let validator = RecitationValidator::new(symbol_table, ast_engine);
        *self.recitation_validator.write().await = Some(validator);

        *self.project_root.write().await = Some(project_root);
        *self.initialized.write().await = true;

        Ok(InitializationResult {
            files_indexed: index_stats.files_indexed,
            symbols_found: index_stats.symbols_found,
            agents_detected: agents.len(),
            workspace_type: workspace_info.as_ref().map(|w| format!("{:?}", w.workspace_type)),
            packages_found: workspace_info.map(|w| w.total_packages).unwrap_or(1),
        })
    }

    /// Process a CLI command with code intelligence
    pub async fn process_command(&self, input: &str, context: &CommandContext) -> Result<EnhancedCommandResult, String> {
        // First, analyze if this is a voice-style natural language command
        let voice_cmd = self.voice_parser.parse(input);
        
        // Check if command needs sandboxing
        let sandbox_analysis = if let Some(ref sandbox) = *self.sandbox.read().await {
            if self.looks_like_shell_command(input) {
                Some(sandbox.analyze_command(input))
            } else {
                None
            }
        } else {
            None
        };

        // Build context for the task
        let unified_context = self.build_context_for_task(&voice_cmd, context).await?;

        // Generate optimized prompt
        let prompt = self.generate_prompt(&voice_cmd, &unified_context).await?;

        Ok(EnhancedCommandResult {
            voice_command: Some(voice_cmd),
            sandbox_analysis,
            context_summary: unified_context,
            generated_prompt: prompt,
            requires_confirmation: false,
        })
    }

    /// Process voice input with streaming support
    pub async fn process_voice_input(&self, audio_text: &str) -> Result<VoiceProcessingResult, String> {
        let voice_stream = self.voice_stream.read().await;
        let stream = voice_stream.as_ref().ok_or("Voice stream not initialized")?;

        // Parse the voice command
        let command = self.voice_parser.parse(audio_text);
        
        // Check for interrupt keywords
        if self.is_interrupt_command(&command) {
            return Ok(VoiceProcessingResult {
                command: command.clone(),
                action_type: ActionType::Interrupt,
                requires_confirmation: false,
                confidence: command.confidence,
            });
        }

        // Determine action type
        let action_type = match command.action {
            VoiceAction::Create | VoiceAction::Generate => ActionType::Generate,
            VoiceAction::Edit | VoiceAction::Modify => ActionType::Edit,
            VoiceAction::Delete | VoiceAction::Remove => ActionType::Delete,
            VoiceAction::Navigate | VoiceAction::GoTo => ActionType::Navigate,
            VoiceAction::Run | VoiceAction::Execute => ActionType::Execute,
            VoiceAction::Commit | VoiceAction::Push | VoiceAction::Pull => ActionType::Git,
            VoiceAction::Refactor => ActionType::Refactor,
            VoiceAction::Explain => ActionType::Explain,
            VoiceAction::Fix | VoiceAction::Debug => ActionType::Fix,
            VoiceAction::Test => ActionType::Test,
            _ => ActionType::Unknown,
        };

        // Check if this requires confirmation
        let requires_confirmation = command.requires_confirmation || 
            matches!(action_type, ActionType::Delete | ActionType::Execute | ActionType::Git);

        Ok(VoiceProcessingResult {
            command,
            action_type,
            requires_confirmation,
            confidence: 0.0, // Will be updated from command
        })
    }

    /// Execute a voice command
    pub async fn execute_voice_command(&self, command: &VoiceCommand, context: &CommandContext) -> Result<CommandResult, String> {
        let meta_agent = self.meta_agent.read().await;
        let meta_agent = meta_agent.as_ref().ok_or("Meta agent not initialized")?;

        // Convert voice action to task type
        let task_type = match command.action {
            VoiceAction::Create | VoiceAction::Generate => TaskType::Generate,
            VoiceAction::Edit | VoiceAction::Modify => TaskType::Generate,
            VoiceAction::Fix | VoiceAction::Debug => TaskType::Fix,
            VoiceAction::Refactor => TaskType::Refactor,
            VoiceAction::Explain => TaskType::Explain,
            VoiceAction::Test => TaskType::Test,
            VoiceAction::Document => TaskType::Document,
            _ => TaskType::Generate,
        };

        let project_root = self.project_root.read().await.clone();
        let task = meta_agent.create_task(task_type, &command.raw_input, project_root);
        
        let result = meta_agent.execute_task(task, None).await
            .map_err(|e| format!("Task execution failed: {}", e))?;

        if result.success {
            Ok(CommandResult::success(result.output))
        } else {
            Ok(CommandResult::failure(result.error.unwrap_or_else(|| "Unknown error".to_string())))
        }
    }

    /// Validate LLM response for hallucinations
    pub async fn validate_response(&self, response: &str, context_file: Option<&str>) -> Result<RecitationResult, String> {
        let validator = self.recitation_validator.read().await;
        let validator = validator.as_ref().ok_or("Recitation validator not initialized")?;

        let file_path = context_file.map(PathBuf::from);
        Ok(validator.validate_response(response, file_path.as_deref()))
    }

    /// Get tribal knowledge for the project
    pub async fn get_tribal_knowledge(&self) -> Result<String, String> {
        let extractor = self.tribal_extractor.read().await;
        if let Some(ref ext) = *extractor {
            Ok(ext.format_for_llm())
        } else {
            Ok(String::new())
        }
    }

    /// Calculate token budget for a task
    pub async fn calculate_budget(&self, task_type: &str, content_sizes: HashMap<String, usize>) -> Result<BudgetPlan, String> {
        let mut manager = self.budget_manager.write().await;
        
        let profile = TaskProfile::default();
        manager.set_task_profile(profile);

        let mut sizes = HashMap::new();
        for (key, value) in content_sizes {
            let category = match key.as_str() {
                "code" => ContextCategory::CodeContext,
                "memory" => ContextCategory::ProjectMemory,
                "history" => ContextCategory::GitHistory,
                "symbols" => ContextCategory::SymbolDefinitions,
                "examples" => ContextCategory::Examples,
                _ => continue,
            };
            sizes.insert(category, value);
        }

        Ok(manager.calculate_budget(&sizes))
    }

    /// Get workspace information
    pub async fn get_workspace_info(&self) -> Result<Option<WorkspaceInfo>, String> {
        let multi_repo = self.multi_repo.read().await;
        let project_root = self.project_root.read().await;
        
        if let (Some(mr), Some(root)) = (multi_repo.as_ref(), project_root.as_ref()) {
            Ok(Some(WorkspaceInfo {
                workspace_type: crate::code_intelligence::WorkspaceType::Single,
                root: root.clone(),
                repos: mr.get_repos(),
                total_packages: mr.get_repos().len(),
            }))
        } else {
            Ok(None)
        }
    }

    /// Analyze a shell command before execution
    pub async fn analyze_shell_command(&self, command: &str) -> Result<CommandAnalysis, String> {
        let sandbox = self.sandbox.read().await;
        let sandbox = sandbox.as_ref().ok_or("Sandbox not initialized")?;
        Ok(sandbox.analyze_command(command))
    }

    /// Execute a shell command through sandbox
    pub async fn execute_shell_command(&self, command: &str) -> Result<crate::code_intelligence::CommandResult, String> {
        let sandbox = self.sandbox.read().await;
        let sandbox = sandbox.as_ref().ok_or("Sandbox not initialized")?;
        sandbox.execute_command(command).await
    }

    // Helper methods

    fn looks_like_shell_command(&self, input: &str) -> bool {
        let shell_prefixes = ["!", "$", "run ", "exec ", "shell "];
        let shell_commands = ["npm", "yarn", "pnpm", "cargo", "go", "python", "pip", "git", "ls", "cat", "mkdir", "rm", "mv", "cp"];
        
        let trimmed = input.trim();
        shell_prefixes.iter().any(|p| trimmed.starts_with(p)) ||
        shell_commands.iter().any(|c| trimmed.starts_with(c))
    }

    fn is_interrupt_command(&self, command: &VoiceCommand) -> bool {
        matches!(command.action, VoiceAction::Stop | VoiceAction::Cancel | VoiceAction::Undo)
    }

    async fn build_context_for_task(&self, command: &VoiceCommand, context: &CommandContext) -> Result<String, String> {
        let engine = self.context_engine.read().await;
        if let Some(ref eng) = *engine {
            let request = UnifiedContextRequest {
                current_file: context.current_file.as_ref().map(PathBuf::from),
                cursor_position: None,
                query: Some(command.raw_input.clone()),
                include_history: true,
                ..Default::default()
            };

            let unified_context = eng.build_context(request).await
                .map_err(|e| format!("Failed to build context: {}", e))?;

            Ok(eng.format_for_llm(&unified_context))
        } else {
            Ok(String::new())
        }
    }

    async fn generate_prompt(&self, command: &VoiceCommand, context: &str) -> Result<BuiltPrompt, String> {
        let prompt_type = match command.action {
            VoiceAction::Create | VoiceAction::Generate => PromptType::CodeGeneration,
            VoiceAction::Refactor => PromptType::CodeRefactor,
            VoiceAction::Fix | VoiceAction::Debug => PromptType::BugFix,
            VoiceAction::Test => PromptType::TestGeneration,
            VoiceAction::Explain => PromptType::Explanation,
            VoiceAction::Document => PromptType::Documentation,
            _ => PromptType::CodeGeneration,
        };

        let mut vars = HashMap::new();
        vars.insert("task".to_string(), command.raw_input.clone());
        if let Some(ref target) = command.target {
            if let Some(ref name) = target.name {
                vars.insert("target".to_string(), name.clone());
            }
        }

        Ok(self.prompt_engineer.build_prompt(prompt_type, &vars, Some(context)))
    }
}

impl Default for CodeIntelligenceBridge {
    fn default() -> Self {
        Self::new()
    }
}

/// Result of bridge initialization
#[derive(Debug, Clone)]
pub struct InitializationResult {
    pub files_indexed: usize,
    pub symbols_found: usize,
    pub agents_detected: usize,
    pub workspace_type: Option<String>,
    pub packages_found: usize,
}

/// Enhanced command result with code intelligence data
#[derive(Debug)]
pub struct EnhancedCommandResult {
    pub voice_command: Option<VoiceCommand>,
    pub sandbox_analysis: Option<CommandAnalysis>,
    pub context_summary: String,
    pub generated_prompt: BuiltPrompt,
    pub requires_confirmation: bool,
}

/// Result of voice processing
#[derive(Debug)]
pub struct VoiceProcessingResult {
    pub command: VoiceCommand,
    pub action_type: ActionType,
    pub requires_confirmation: bool,
    pub confidence: f32,
}

/// Types of actions from voice commands
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ActionType {
    Generate,
    Edit,
    Delete,
    Navigate,
    Execute,
    Git,
    Refactor,
    Explain,
    Fix,
    Test,
    Interrupt,
    Unknown,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_bridge_creation() {
        let bridge = CodeIntelligenceBridge::new();
        // Bridge should be created successfully
    }

    #[test]
    fn test_shell_command_detection() {
        let bridge = CodeIntelligenceBridge::new();
        
        assert!(bridge.looks_like_shell_command("npm install"));
        assert!(bridge.looks_like_shell_command("!ls -la"));
        assert!(bridge.looks_like_shell_command("git status"));
        assert!(!bridge.looks_like_shell_command("create a function"));
    }
}
