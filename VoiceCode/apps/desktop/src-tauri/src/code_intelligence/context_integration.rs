#![allow(dead_code, unused_variables, unused_imports)]
// Context Integration - Connects CLI systems with Code Intelligence
// Bridges memory, permissions, and MCP with the unified context engine

use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use serde::{Deserialize, Serialize};
use parking_lot::RwLock;
use tokio::sync::broadcast;

use crate::cli::memory::{MemorySystem, AutoMemoryType};
use crate::cli::permissions::{PermissionSystem, PermissionMode, PermissionRequest, OperationType, PermissionDecision};
use crate::cli::mcp::{McpClient, McpServerConfig};

use super::unified_context::{UnifiedContextEngine, UnifiedContextRequest};
use super::meta_agent::{MetaAgentOrchestrator, MetaAgentConfig, TaskType, CollaborationStrategy};
use super::voice_grammar::{VoiceGrammarParser, VoiceCommand, VoiceAction};
use super::llm_client::LLMClient;

/// Integrated context system combining all VoiceCode components
pub struct IntegratedContextSystem {
    /// Unified context engine
    context_engine: Arc<UnifiedContextEngine>,
    /// Memory system
    memory_system: Arc<RwLock<MemorySystem>>,
    /// Permission manager
    permission_manager: Arc<PermissionSystem>,
    /// Meta-agent orchestrator
    meta_agent: Arc<MetaAgentOrchestrator>,
    /// Voice grammar parser
    voice_parser: Arc<VoiceGrammarParser>,
    /// MCP clients
    mcp_clients: RwLock<HashMap<String, Arc<McpClient>>>,
    /// LLM client
    llm_client: Option<Arc<LLMClient>>,
    /// Event broadcaster
    event_tx: broadcast::Sender<IntegrationEvent>,
    /// Configuration
    config: IntegrationConfig,
    /// Project root
    project_root: PathBuf,
}

/// Events from the integrated system
#[derive(Debug, Clone)]
pub enum IntegrationEvent {
    MemoryLoaded { scope: String, entries: usize },
    PermissionChanged { mode: String },
    McpServerConnected { name: String },
    McpServerDisconnected { name: String },
    ContextBuilt { tokens: usize, sources: Vec<String> },
    VoiceCommandParsed { action: String, confidence: f32 },
    AgentTaskStarted { task_id: String, agent: String },
    AgentTaskCompleted { task_id: String, success: bool },
    Error { component: String, message: String },
}

/// Configuration for the integrated system
#[derive(Debug, Clone)]
pub struct IntegrationConfig {
    /// Include memory in context
    pub include_memory: bool,
    /// Include git history in context
    pub include_history: bool,
    /// Maximum memory tokens
    pub max_memory_tokens: usize,
    /// Permission mode
    pub permission_mode: PermissionMode,
    /// Auto-connect MCP servers
    pub auto_connect_mcp: bool,
    /// Default collaboration strategy
    pub default_strategy: CollaborationStrategy,
}

impl Default for IntegrationConfig {
    fn default() -> Self {
        Self {
            include_memory: true,
            include_history: true,
            max_memory_tokens: 2000,
            permission_mode: PermissionMode::Default,
            auto_connect_mcp: true,
            default_strategy: CollaborationStrategy::Auto,
        }
    }
}

impl IntegratedContextSystem {
    /// Create a new integrated context system
    pub async fn new(
        project_root: PathBuf,
        config: IntegrationConfig,
    ) -> Result<Self, String> {
        let (event_tx, _) = broadcast::channel(100);

        // Load memory system
        let memory_result = MemorySystem::load(&project_root).await;
        let memory_system = Arc::new(RwLock::new(memory_result.memory_system));

        // Create permission manager
        let permission_manager = Arc::new(PermissionSystem::with_mode(project_root.clone(), config.permission_mode));

        // Create unified context engine
        let context_config = super::unified_context::UnifiedContextConfig {
            include_history: config.include_history,
            ..Default::default()
        };
        let context_engine = Arc::new(
            UnifiedContextEngine::new(project_root.clone(), context_config).await?
        );

        // Create meta-agent orchestrator
        let agent_config = MetaAgentConfig {
            default_strategy: config.default_strategy.clone(),
            ..Default::default()
        };
        let meta_agent = Arc::new(MetaAgentOrchestrator::new(
            project_root.clone(),
            agent_config,
        ));

        // Create voice parser
        let voice_parser = Arc::new(VoiceGrammarParser::new());

        let system = Self {
            context_engine,
            memory_system,
            permission_manager,
            meta_agent,
            voice_parser,
            mcp_clients: RwLock::new(HashMap::new()),
            llm_client: None,
            event_tx,
            config,
            project_root,
        };

        Ok(system)
    }

    /// Set the LLM client
    pub fn with_llm(mut self, client: Arc<LLMClient>) -> Self {
        self.llm_client = Some(client);
        self
    }

    /// Subscribe to events
    pub fn subscribe(&self) -> broadcast::Receiver<IntegrationEvent> {
        self.event_tx.subscribe()
    }

    /// Initialize the system (index project, detect agents, etc.)
    pub async fn initialize(&self) -> Result<InitializationStats, String> {
        let mut stats = InitializationStats::default();

        // Initialize context engine
        let index_stats = self.context_engine.initialize().await?;
        stats.files_indexed = index_stats.files_indexed;
        stats.symbols_found = index_stats.symbols_found;

        // Detect external agents
        let agents = self.meta_agent.detect_agents().await;
        stats.agents_detected = agents.len();

        // Report memory stats
        let memory = self.memory_system.read();
        if memory.get_all_context().is_some() {
            stats.memory_loaded = true;
        }

        let _ = self.event_tx.send(IntegrationEvent::MemoryLoaded {
            scope: "all".to_string(),
            entries: stats.symbols_found,
        });

        Ok(stats)
    }

    /// Build comprehensive context for a coding task
    pub async fn build_context(
        &self,
        request: ContextRequest,
    ) -> Result<ComprehensiveContext, String> {
        let mut context = ComprehensiveContext::default();

        // 1. Build unified context from code
        let unified_request = UnifiedContextRequest {
            current_file: request.current_file.clone(),
            cursor_position: request.cursor_position,
            selection: request.selection.clone(),
            query: request.query.clone(),
            include_history: self.config.include_history,
            ..Default::default()
        };

        let unified_context = self.context_engine.build_context(unified_request).await?;
        context.code_context = self.context_engine.format_for_llm(&unified_context);

        // 2. Add memory context
        if self.config.include_memory {
            let memory = self.memory_system.read();
            if let Some(memory_context) = memory.get_all_context() {
                context.memory_context = Some(self.format_memory_context(&memory_context));
            }
        }

        // 3. Add permission context
        context.permission_mode = self.config.permission_mode;

        // 4. Add MCP tool context
        let mcp_tools = self.get_available_mcp_tools().await;
        if !mcp_tools.is_empty() {
            context.available_tools = mcp_tools;
        }

        let _ = self.event_tx.send(IntegrationEvent::ContextBuilt {
            tokens: context.estimate_tokens(),
            sources: context.list_sources(),
        });

        Ok(context)
    }

    /// Process a voice command
    pub async fn process_voice_command(
        &self,
        input: &str,
    ) -> Result<VoiceCommandResult, String> {
        // Parse the voice command
        let command = self.voice_parser.parse(input);

        let _ = self.event_tx.send(IntegrationEvent::VoiceCommandParsed {
            action: format!("{:?}", command.action),
            confidence: command.confidence,
        });

        // Check if command requires confirmation
        if command.requires_confirmation {
            return Ok(VoiceCommandResult {
                command: command.clone(),
                requires_confirmation: true,
                confirmation_prompt: Some(self.voice_parser.generate_confirmation(&command)),
                executed: false,
                result: None,
            });
        }

        // Check permissions for the action
        let permission = self.check_voice_action_permission(&command).await?;
        if permission != PermissionDecision::Allow {
            return Ok(VoiceCommandResult {
                command: command.clone(),
                requires_confirmation: true,
                confirmation_prompt: Some(format!(
                    "Permission required: {:?}. Allow?",
                    command.action
                )),
                executed: false,
                result: None,
            });
        }

        // Execute the command
        let result = self.execute_voice_command(&command).await?;

        Ok(VoiceCommandResult {
            command,
            requires_confirmation: false,
            confirmation_prompt: None,
            executed: true,
            result: Some(result),
        })
    }

    /// Execute a voice command
    async fn execute_voice_command(&self, command: &VoiceCommand) -> Result<String, String> {
        // Convert voice command to agent task
        let task_type = match command.action {
            VoiceAction::Create | VoiceAction::Generate | VoiceAction::Add | VoiceAction::Write => TaskType::Generate,
            VoiceAction::Edit | VoiceAction::Modify | VoiceAction::Change | VoiceAction::Update => TaskType::Generate,
            VoiceAction::Delete | VoiceAction::Remove => TaskType::Execute,
            VoiceAction::Refactor | VoiceAction::Rename | VoiceAction::Replace => TaskType::Refactor,
            VoiceAction::Fix | VoiceAction::Debug => TaskType::Fix,
            VoiceAction::Explain => TaskType::Explain,
            VoiceAction::Document => TaskType::Document,
            VoiceAction::Test => TaskType::Test,
            VoiceAction::Run | VoiceAction::Execute | VoiceAction::Build | VoiceAction::Deploy => TaskType::Execute,
            _ => TaskType::Generate,
        };

        let task = self.meta_agent.create_task(
            task_type,
            &command.raw_input,
            command.target.as_ref().and_then(|t| t.location.as_ref())
                .map(|l| PathBuf::from(&l.value)),
        );

        let _ = self.event_tx.send(IntegrationEvent::AgentTaskStarted {
            task_id: task.id.clone(),
            agent: "auto".to_string(),
        });

        // Execute with meta-agent
        let result = self.meta_agent.execute_task(task, None).await?;

        let _ = self.event_tx.send(IntegrationEvent::AgentTaskCompleted {
            task_id: result.task_id.clone(),
            success: result.success,
        });

        if result.success {
            Ok(result.output)
        } else {
            Err(result.error.unwrap_or_else(|| "Unknown error".to_string()))
        }
    }

    /// Check permission for a voice action
    async fn check_voice_action_permission(
        &self,
        command: &VoiceCommand,
    ) -> Result<PermissionDecision, String> {
        let operation = match command.action {
            VoiceAction::Create | VoiceAction::Generate | VoiceAction::Add | VoiceAction::Write => {
                OperationType::FileCreate
            }
            VoiceAction::Edit | VoiceAction::Modify | VoiceAction::Change | VoiceAction::Update => {
                OperationType::FileWrite
            }
            VoiceAction::Delete | VoiceAction::Remove => OperationType::FileDelete,
            VoiceAction::Run | VoiceAction::Execute | VoiceAction::Build | VoiceAction::Deploy => {
                OperationType::CommandExecute
            }
            VoiceAction::Commit | VoiceAction::Push | VoiceAction::Pull | 
            VoiceAction::Merge | VoiceAction::Branch | VoiceAction::Checkout => {
                OperationType::GitOperation
            }
            _ => OperationType::FileRead,
        };

        let request = PermissionRequest {
            operation,
            target: command.target.as_ref()
                .and_then(|t| t.name.clone())
                .unwrap_or_else(|| "unknown".to_string()),
            description: command.raw_input.clone(),
            agent_id: "voicecode".to_string(),
            risk_level: if command.action.is_destructive() { 8 } else { 3 },
            reversible: !command.action.is_destructive(),
            preview: None,
        };

        Ok(self.permission_manager.check_permission(&request))
    }

    /// Connect to an MCP server
    pub async fn connect_mcp_server(&self, config: McpServerConfig) -> Result<(), String> {
        let name = config.name.clone();
        let client = McpClient::new(config).await.map_err(|e| e.to_string())?;
        client.connect().await.map_err(|e| e.to_string())?;

        self.mcp_clients.write().insert(name.clone(), Arc::new(client));

        let _ = self.event_tx.send(IntegrationEvent::McpServerConnected { name });

        Ok(())
    }

    /// Get available MCP tools
    async fn get_available_mcp_tools(&self) -> Vec<ToolInfo> {
        let mut tools = Vec::new();

        for (server_name, client) in self.mcp_clients.read().iter() {
            if let Ok(server_tools) = client.list_tools().await {
                for tool in server_tools {
                    tools.push(ToolInfo {
                        name: tool.name.clone(),
                        description: tool.description.clone(),
                        server: server_name.clone(),
                        input_schema: Some(tool.input_schema.clone()),
                    });
                }
            }
        }

        tools
    }

    /// Format memory context for LLM
    fn format_memory_context(&self, memory: &str) -> String {
        format!(
            "# Project Context (from VOICECODE.md)\n\n{}\n",
            memory
        )
    }

    /// Set permission mode
    pub fn set_permission_mode(&self, mode: PermissionMode) {
        self.permission_manager.set_mode(mode);
        let _ = self.event_tx.send(IntegrationEvent::PermissionChanged {
            mode: format!("{}", mode),
        });
    }

    /// Get current permission mode
    pub fn permission_mode(&self) -> PermissionMode {
        self.permission_manager.get_mode()
    }

    /// Add to memory
    pub async fn add_memory(&self, key: &str, value: &str, memory_type: AutoMemoryType) -> Result<(), String> {
        self.memory_system.write().add_auto_memory(key, value, memory_type).await
    }

    /// Get the meta-agent orchestrator
    pub fn meta_agent(&self) -> Arc<MetaAgentOrchestrator> {
        Arc::clone(&self.meta_agent)
    }

    /// Get the context engine
    pub fn context_engine(&self) -> Arc<UnifiedContextEngine> {
        Arc::clone(&self.context_engine)
    }
}

/// Request for building context
#[derive(Debug, Clone, Default)]
pub struct ContextRequest {
    pub current_file: Option<PathBuf>,
    pub cursor_position: Option<(usize, usize)>,
    pub selection: Option<String>,
    pub query: Option<String>,
}

/// Comprehensive context result
#[derive(Debug, Clone, Default)]
pub struct ComprehensiveContext {
    pub code_context: String,
    pub memory_context: Option<String>,
    pub permission_mode: PermissionMode,
    pub available_tools: Vec<ToolInfo>,
}

impl ComprehensiveContext {
    pub fn estimate_tokens(&self) -> usize {
        let total_chars = self.code_context.len()
            + self.memory_context.as_ref().map(|s| s.len()).unwrap_or(0);
        total_chars / 4 // Rough token estimate
    }

    pub fn list_sources(&self) -> Vec<String> {
        let mut sources = vec!["code_graph".to_string(), "symbol_table".to_string()];
        if self.memory_context.is_some() {
            sources.push("memory".to_string());
        }
        if !self.available_tools.is_empty() {
            sources.push("mcp_tools".to_string());
        }
        sources
    }

    pub fn to_llm_prompt(&self) -> String {
        let mut prompt = String::new();

        // Add memory context first (project rules)
        if let Some(ref memory) = self.memory_context {
            prompt.push_str(memory);
            prompt.push_str("\n\n");
        }

        // Add code context
        prompt.push_str(&self.code_context);

        // Add tool info if available
        if !self.available_tools.is_empty() {
            prompt.push_str("\n\n# Available Tools\n\n");
            for tool in &self.available_tools {
                prompt.push_str(&format!("- **{}** ({}): {}\n",
                    tool.name, tool.server,
                    tool.description.as_deref().unwrap_or("No description")
                ));
            }
        }

        prompt
    }
}

/// Tool information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolInfo {
    pub name: String,
    pub description: Option<String>,
    pub server: String,
    pub input_schema: Option<serde_json::Value>,
}

/// Result of voice command processing
#[derive(Debug, Clone)]
pub struct VoiceCommandResult {
    pub command: VoiceCommand,
    pub requires_confirmation: bool,
    pub confirmation_prompt: Option<String>,
    pub executed: bool,
    pub result: Option<String>,
}

/// Initialization statistics
#[derive(Debug, Clone, Default)]
pub struct InitializationStats {
    pub files_indexed: usize,
    pub symbols_found: usize,
    pub agents_detected: usize,
    pub memory_loaded: bool,
    pub mcp_servers_connected: usize,
}

// Tauri commands

#[tauri::command]
pub async fn init_integrated_system(project_root: String) -> Result<InitializationStats, String> {
    let root = PathBuf::from(project_root);
    let config = IntegrationConfig::default();
    let system = IntegratedContextSystem::new(root, config).await?;
    system.initialize().await
}

#[tauri::command]
pub async fn process_voice_input(input: String) -> Result<VoiceCommandResult, String> {
    Err("System not initialized. Call init_integrated_system first.".to_string())
}

#[tauri::command]
pub async fn build_coding_context(
    current_file: Option<String>,
    cursor_line: Option<usize>,
    cursor_col: Option<usize>,
    selection: Option<String>,
    query: Option<String>,
) -> Result<ComprehensiveContext, String> {
    Err("System not initialized. Call init_integrated_system first.".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_context_request_default() {
        let request = ContextRequest::default();
        assert!(request.current_file.is_none());
        assert!(request.query.is_none());
    }

    #[test]
    fn test_comprehensive_context_token_estimate() {
        let context = ComprehensiveContext {
            code_context: "a".repeat(400),
            memory_context: Some("b".repeat(100)),
            ..Default::default()
        };
        assert_eq!(context.estimate_tokens(), 125); // 500 / 4
    }

    #[test]
    fn test_integration_config_default() {
        let config = IntegrationConfig::default();
        assert!(config.include_memory);
        assert!(config.include_history);
        assert_eq!(config.permission_mode, PermissionMode::Default);
    }
}

