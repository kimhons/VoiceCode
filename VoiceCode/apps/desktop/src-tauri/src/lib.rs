// VoiceCode Desktop Library
// Exposes modules for both the Tauri desktop app and the CLI binary

// Security and error handling
pub mod errors;
pub mod validation;
pub mod memory;
pub mod error_boundary;
pub mod logging;
pub mod encryption;
pub mod global_dictation;

// AquaVoice Parity & Coding Agent Modules
pub mod performance;
pub mod streaming;
pub mod code_vocabulary;
pub mod screen_context;
pub mod natural_language_commands;
pub mod app_aware_formatting;
pub mod coding_agent;

// Code Intelligence Engine
pub mod code_intelligence;

// CLI Module - Multi-agent coding interface
pub mod cli;

// Commands
pub mod commands {
    pub mod memory_commands;
    pub mod cache_commands;
    pub mod logging_commands;
    pub mod encryption_commands;
}

// Integrations
pub mod integrations {
    pub mod voice_recognition;
    pub mod ai_text_processor;
    pub mod ai_ml_api;
    pub mod ai_ml_core;
    pub mod text_enhancement;
    pub mod voice_generation;
    pub mod translation_service;
    pub mod context_processor;
    pub use ai_ml_api::*;
}

// Re-exports for convenience
pub use errors::{AppError, Result};
pub use cli::{
    ReplSession, ReplConfig, BatchMode,
    CommandHandler, CommandResult, CommandContext,
    AgentRegistry, AgentInfo, AgentStatus, AgentType,
    AgentOrchestrator, OrchestrationStrategy, OrchestratorConfig,
    ExternalAgentFactory, ExternalAgentType,
};
