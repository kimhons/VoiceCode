// Phase 1-6: Code Intelligence Engine
// Provides AST parsing, symbol resolution, semantic search, context aggregation,
// LLM integration, agentic task planning, and IDE communication
// Phase 7: Semantic Code Graph and Context Lineage (Augment-style)

pub mod ast_engine;
pub mod chunker;
pub mod code_graph;
pub mod context_integration;
pub mod voice_grammar;

// Phase 3-5: Advanced Context and Anti-Hallucination
pub mod context_lineage;
pub mod dynamic_budget;
pub mod ide_bridge;
pub mod intent_classifier;
pub mod llm_client;
pub mod meta_agent;
pub mod multi_repo;
pub mod prompt_engineering;
pub mod recitation;
pub mod sandbox;
pub mod tribal_knowledge;
pub mod voice_streaming;

// Phase 6-8: Enterprise Features
pub mod agent_skills;
pub mod ambient_intelligence;
pub mod analytics;
pub mod doc_indexer;
pub mod feedback_system;
pub mod few_shot_db;
pub mod mcp_oauth;
pub mod mcp_servers;
pub mod offline_mode;
pub mod plugin_system;
pub mod self_verification;
pub mod team_knowledge;

pub mod context_builder;
pub mod project_indexer;
pub mod semantic_search;
pub mod symbol_table;
pub mod task_planner;
pub mod token_budget;
pub mod unified_context;

// Re-exports for convenience
pub use ast_engine::ASTEngine;
pub use code_graph::SymbolContext;
pub use meta_agent::{
    CollaborationStrategy,
    ExternalAgentType, MetaAgentConfig, MetaAgentOrchestrator,
    TaskType,
};
pub use symbol_table::SymbolTable;
pub use unified_context::{
    UnifiedContextConfig,
    UnifiedContextEngine, UnifiedContextRequest,
};
pub use voice_grammar::{
    VoiceAction, VoiceCommand,
    VoiceGrammarParser,
};

// Phase 3-5 re-exports
pub use dynamic_budget::{BudgetPlan, ContextCategory, DynamicBudgetManager, TaskProfile};
pub use multi_repo::{MultiRepoManager, WorkspaceInfo, WorkspaceType};
pub use prompt_engineering::{BuiltPrompt, PromptEngineer, PromptType};
pub use recitation::{
    RecitationResult, RecitationValidator,
};
pub use sandbox::{
    CommandAnalysis, CommandResult, SandboxConfig,
    SandboxManager, SandboxMode,
};
pub use tribal_knowledge::{
    TribalKnowledge,
    TribalKnowledgeExtractor,
};
pub use voice_streaming::{
    StreamConfig, VoiceStreamManager,
};

// Phase 6-8 re-exports
