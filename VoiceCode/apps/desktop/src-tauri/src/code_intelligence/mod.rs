// Phase 1-6: Code Intelligence Engine
// Provides AST parsing, symbol resolution, semantic search, context aggregation,
// LLM integration, agentic task planning, and IDE communication

pub mod ast_engine;
pub mod symbol_table;
pub mod project_indexer;
pub mod chunker;
pub mod context_builder;
pub mod token_budget;
pub mod semantic_search;
pub mod llm_client;
pub mod intent_classifier;
pub mod task_planner;
pub mod ide_bridge;

// Re-exports for convenience
pub use ast_engine::{ASTEngine, CodeStructure, ParsedFile, Language};
pub use symbol_table::{SymbolTable, Symbol, SymbolKind, SymbolReference};
pub use project_indexer::{ProjectIndexer, ProjectIndex, IndexStatus};
pub use chunker::{CodeChunker, CodeChunk, ChunkType};
pub use context_builder::{ContextBuilder, ProjectContext, ContextPriority};
pub use token_budget::{TokenBudget, TokenCounter, TruncationStrategy};
pub use semantic_search::{EmbeddingService, SearchResult, HybridSearcher, Reranker};
pub use llm_client::{LLMClient, LLMRequest, LLMResponse, Message, MessageRole, StreamEvent};
pub use intent_classifier::{IntentClassifier, ClassifiedIntent, CodingIntent, CodeEntity};
pub use task_planner::{TaskPlanner, TaskPlan, TaskStep, StepExecutor, PlannerConfig};
pub use ide_bridge::{IDEBridge, ProtocolMessage, IDEClient, IDEType, BridgeConfig};
