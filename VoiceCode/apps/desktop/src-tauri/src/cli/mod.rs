// CLI Module - Command Line Interface for VoiceCode
// Provides Claude Code-like CLI experience with multi-agent collaboration

pub mod agent_protocol;
pub mod agent_registry;
pub mod commands;
pub mod external_agents;
pub mod mcp;
pub mod memory;
pub mod multi_agent;
pub mod orchestrator;
pub mod permissions;
pub mod repl;
pub mod subagents;
pub mod templates;
pub mod validation;

// Re-exports for convenience
pub use agent_protocol::{
    AgentCapability, AgentMessage, AgentProtocol, CodeChange, TaskContext, TaskResult, TaskStatus,
    TaskType,
};
pub use agent_registry::{
    known_agents, AgentInfo, AgentRegistry, AgentStatus, AgentType, DiscoveryConfig,
};
pub use commands::{ChangeType, CommandContext, CommandHandler, CommandResult, FileChange};
pub use external_agents::{
    AiderAdapter, ClaudeCodeAdapter, ExternalAgentAdapter, ExternalAgentConfig,
    ExternalAgentFactory, ExternalAgentType, GenericCliAdapter, InteractiveSession,
};
pub use mcp::{
    ContentItem, JsonRpcRequest, JsonRpcResponse, McpClient, McpError, McpPrompt, McpResource,
    McpServerConfig, McpServerManager, McpTool, OAuthConfig, OAuthManager, OAuthTokens,
    PromptResult, ResourceCache, ResourceContent, ServerCapabilities, ToolResult, TransportConfig,
    TransportType,
};
pub use memory::{
    AutoMemory, AutoMemoryType, Interaction, MemoryContext, MemoryFile, MemorySection,
    MemorySystem, PathRule,
};
pub use multi_agent::{
    AgentCapability as ExternalCapability, AgentError, AgentInstance, CollaborationMode,
    CollaborationPresets, CollaborativeTask, CompetitiveConfig, EnsembleConfig,
    ExternalAgentConfig as MultiAgentConfig, ExternalAgentType, LeadReviewConfig, MergeStrategy,
    MultiAgentOrchestrator, ParallelConfig, PipelineConfig, SequentialConfig, TaskCategory,
    WaitStrategy,
};
pub use orchestrator::{
    AgentOrchestrator, AggregatedResult, ExecutionResult, OrchestrationStrategy,
    OrchestratorConfig, TaskAssignment,
};
pub use permissions::{
    AllowlistEntry, CommandAllowlist, DenylistEntry, OperationType, PermissionAuditEntry,
    PermissionDecision, PermissionMode, PermissionRequest, PermissionSystem, SandboxEnvironment,
};
pub use repl::{BatchMode, ReplConfig, ReplSession};
pub use subagents::{
    AgentSkill, ModelRouter, ModelTier, SubagentArtifact, SubagentConfig, SubagentManager,
    SubagentPipeline, SubagentResult, SubagentType, TokenUsage,
};
pub use templates::{
    Achievement, GenerationResult, ProgressTracker, ProjectTemplate, ProjectWizard,
    TemplateCategory, TemplateLibrary, UsageStats, WizardOption, WizardState, WizardStep,
};
pub use validation::{
    CommandValidator, ContentType, EvidenceType, FileReferenceValidator, HallucinationDetector,
    IssueCategory, IssueSeverity, SymbolValidator, SyntaxValidator, ValidationContext,
    ValidationEvidence, ValidationIssue, ValidationPipeline, ValidationResult, Validator,
};

use std::sync::Arc;

/// Initialize CLI with default configuration
pub fn init_cli() -> (Arc<AgentRegistry>, Arc<AgentOrchestrator>) {
    let registry = Arc::new(AgentRegistry::with_voicecode_agent());
    let orchestrator = Arc::new(AgentOrchestrator::new(
        Arc::clone(&registry),
        OrchestratorConfig::default(),
    ));

    (registry, orchestrator)
}

/// Start interactive REPL session
pub async fn start_repl() -> Result<(), String> {
    let (registry, orchestrator) = init_cli();
    let config = ReplConfig::default();

    let mut session = ReplSession::new(config, registry, orchestrator);
    session.run().await
}

/// Execute a single command in batch mode
pub async fn execute_command(command: &str) -> Result<CommandResult, String> {
    let (registry, orchestrator) = init_cli();
    let mut batch = BatchMode::new(registry, orchestrator);
    batch.execute(command).await
}

/// Execute commands from a file
pub async fn execute_script(path: &str) -> Result<Vec<CommandResult>, String> {
    let (registry, orchestrator) = init_cli();
    let mut batch = BatchMode::new(registry, orchestrator);
    batch.execute_file(path).await
}
