#![allow(dead_code, unused_variables, unused_imports)]
// CLI Module - Command Line Interface for VoiceCode
// Provides Claude Code-like CLI experience with multi-agent collaboration

pub mod agent_protocol;
pub mod agent_registry;
pub mod commands;
pub mod consensus;
pub mod enhanced_agents;
pub mod external_agents;
pub mod internal_agents;
pub mod mcp;
pub mod memory;
pub mod multi_agent;
pub mod orchestrator;
pub mod permissions;
pub mod persistence;
pub mod pipeline;
pub mod repl;
pub mod streaming_parser;
pub mod subagents;
pub mod templates;
pub mod validation;
pub mod code_intelligence_bridge;

// Re-exports for convenience
pub use agent_registry::{AgentRegistry, AgentInfo, AgentStatus, AgentType};
pub use commands::{CommandHandler, CommandResult, CommandContext};
pub use enhanced_agents::EnhancedAgentAdapter;
pub use external_agents::{ExternalAgentAdapter, ExternalAgentFactory, ExternalAgentType};
pub use multi_agent::MultiAgentOrchestrator;
pub use orchestrator::{
    AgentOrchestrator,
    OrchestratorConfig,
    OrchestrationStrategy,
};
pub use repl::{BatchMode, ReplConfig, ReplSession};

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

/// Initialize CLI with automatic detection of installed external agents.
/// Probes the system PATH for Claude Code, Gemini CLI, Codex CLI, Aider, and
/// GitHub Copilot CLI, registering only the agents that are actually installed.
pub async fn init_cli_with_detection() -> (Arc<AgentRegistry>, Arc<AgentOrchestrator>, Arc<MultiAgentOrchestrator>) {
    let (registry, orchestrator) = init_cli();

    let multi_agent = Arc::new(MultiAgentOrchestrator::new());
    let installed = multi_agent.detect_and_register().await;

    if !installed.is_empty() {
        tracing::info!(
            "Auto-registered {} external agent(s): {}",
            installed.len(),
            installed.iter().map(|a| a.default_command()).collect::<Vec<_>>().join(", ")
        );
    }

    // Attach multi-agent orchestrator to the main orchestrator for CLI dispatch
    orchestrator.set_multi_agent(Arc::clone(&multi_agent)).await;

    (registry, orchestrator, multi_agent)
}

/// Start interactive REPL session
pub async fn start_repl() -> Result<(), String> {
    let (registry, orchestrator, _multi_agent) = init_cli_with_detection().await;
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
