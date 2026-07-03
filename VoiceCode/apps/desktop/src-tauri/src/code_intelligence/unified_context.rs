#![allow(dead_code, unused_variables, unused_imports)]
// Unified Context Engine - Augment-Style Context Aggregation
// Combines semantic code graph, context lineage, symbol table, and RAG for comprehensive context

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use serde::{Deserialize, Serialize};
use parking_lot::RwLock;
use tokio::sync::broadcast;

use super::ast_engine::ASTEngine;
use super::code_graph::{CodeGraphManager, GraphNode};
use super::context_builder::{ContextBuilder, ContextBuilderConfig, ContextItem, ContextPriority, ContextType};
use super::context_lineage::{ContextLineage, LineageConfig};
use super::llm_client::LLMClient;
use super::project_indexer::{ProjectIndexer, IndexStatus, IndexerConfig};
use super::semantic_search::EmbeddingService;
use super::symbol_table::SymbolTable;
use super::token_budget::{TokenBudget, LLMModel};

/// Events emitted by the context engine
#[derive(Debug, Clone)]
pub enum ContextEvent {
    IndexingStarted { project_root: PathBuf },
    IndexingProgress { files_indexed: usize, total_files: usize },
    IndexingComplete { stats: IndexStats },
    GraphBuilt { nodes: usize, edges: usize },
    LineageHarvested { commits: usize },
    ContextBuilt { tokens: usize, items: usize },
    Error { message: String },
}

/// Unified context engine combining all context sources
pub struct UnifiedContextEngine {
    /// Project root directory
    project_root: PathBuf,
    /// AST parsing engine
    ast_engine: Arc<ASTEngine>,
    /// Symbol table for lookups
    symbol_table: Arc<SymbolTable>,
    /// Semantic code graph
    code_graph: Arc<CodeGraphManager>,
    /// Context lineage (git history) - uses interior mutability, no outer lock needed
    context_lineage: Arc<ContextLineage>,
    /// Context builder for aggregation
    context_builder: Arc<ContextBuilder>,
    /// Project indexer
    project_indexer: Arc<ProjectIndexer>,
    /// Embedding service for semantic search
    embedding_service: Option<Arc<EmbeddingService>>,
    /// LLM client for summaries
    llm_client: Option<Arc<LLMClient>>,
    /// Event broadcaster
    event_tx: broadcast::Sender<ContextEvent>,
    /// Configuration
    config: UnifiedContextConfig,
    /// Index status
    index_status: RwLock<IndexStatus>,
}

/// Configuration for the unified context engine
#[derive(Debug, Clone)]
pub struct UnifiedContextConfig {
    /// Target LLM model for context optimization
    pub target_model: LLMModel,
    /// Maximum context tokens
    pub max_context_tokens: usize,
    /// Include git history context
    pub include_history: bool,
    /// Include semantic graph context
    pub include_graph: bool,
    /// Include external documentation
    pub include_external_docs: bool,
    /// Days of git history to include
    pub history_days: u32,
    /// Maximum files in context
    pub max_files: usize,
    /// Maximum symbols in context
    pub max_symbols: usize,
    /// Graph traversal depth
    pub graph_depth: usize,
    /// Auto-index on initialization
    pub auto_index: bool,
    /// Watch for file changes
    pub watch_changes: bool,
}

impl Default for UnifiedContextConfig {
    fn default() -> Self {
        Self {
            target_model: LLMModel::Claude3Sonnet,
            max_context_tokens: 100000,
            include_history: true,
            include_graph: true,
            include_external_docs: true,
            history_days: 30,
            max_files: 50,
            max_symbols: 200,
            graph_depth: 3,
            auto_index: true,
            watch_changes: true,
        }
    }
}

impl UnifiedContextEngine {
    pub async fn new(
        project_root: PathBuf,
        config: UnifiedContextConfig,
    ) -> Result<Self, String> {
        let (event_tx, _) = broadcast::channel(100);

        // Initialize AST engine
        let ast_engine = Arc::new(ASTEngine::new());

        // Initialize symbol table
        let symbol_table = Arc::new(SymbolTable::new());
        symbol_table.set_project_root(project_root.clone());

        // Initialize code graph
        let code_graph = Arc::new(CodeGraphManager::new(
            project_root.clone(),
            Arc::clone(&ast_engine),
            Arc::clone(&symbol_table),
        ));

        // Initialize context lineage
        let lineage_config = LineageConfig {
            history_days: config.history_days,
            ..Default::default()
        };
        let context_lineage = Arc::new(
            ContextLineage::new(project_root.clone(), lineage_config)
        );

        // Initialize context builder
        let builder_config = ContextBuilderConfig {
            model: config.target_model,
            max_files: config.max_files,
            max_symbols: config.max_symbols,
            ..Default::default()
        };
        let context_builder = Arc::new(ContextBuilder::new(
            builder_config,
            Arc::clone(&ast_engine),
            Arc::clone(&symbol_table),
        ));

        // Initialize project indexer
        let indexer_config = IndexerConfig::default();
        let project_indexer = Arc::new(ProjectIndexer::new(
            project_root.clone(),
            indexer_config,
        ));

        let engine = Self {
            project_root,
            ast_engine,
            symbol_table,
            code_graph,
            context_lineage,
            context_builder,
            project_indexer,
            embedding_service: None,
            llm_client: None,
            event_tx,
            config,
            index_status: RwLock::new(IndexStatus::Idle),
        };

        Ok(engine)
    }

    pub fn with_llm(mut self, client: Arc<LLMClient>) -> Self {
        self.llm_client = Some(client);
        self
    }

    pub fn with_embeddings(mut self, service: Arc<EmbeddingService>) -> Self {
        self.embedding_service = Some(service);
        self
    }

    /// Subscribe to context events
    pub fn subscribe(&self) -> broadcast::Receiver<ContextEvent> {
        self.event_tx.subscribe()
    }

    /// Initialize and index the project
    pub async fn initialize(&self) -> Result<IndexStats, String> {
        let _ = self.event_tx.send(ContextEvent::IndexingStarted {
            project_root: self.project_root.clone(),
        });

        *self.index_status.write() = IndexStatus::Indexing;

        // Index project files
        let index_result = self.project_indexer.index_project().await?;

        let _ = self.event_tx.send(ContextEvent::IndexingProgress {
            files_indexed: index_result.indexed_files,
            total_files: index_result.total_files,
        });

        // Build semantic code graph - collect indexed files from symbol table
        let files: Vec<PathBuf> = self.symbol_table
            .get_all_exports()
            .iter()
            .map(|s| s.file_path.clone())
            .collect::<std::collections::HashSet<_>>()
            .into_iter()
            .collect();
        let graph_stats = self.code_graph.build(&files)?;

        let _ = self.event_tx.send(ContextEvent::GraphBuilt {
            nodes: graph_stats.nodes_created,
            edges: graph_stats.edges_created,
        });

        // Harvest git history
        if self.config.include_history {
            let harvest_stats = self.context_lineage.harvest_commits().await?;
            let _ = self.event_tx.send(ContextEvent::LineageHarvested {
                commits: harvest_stats.commits_processed,
            });
        }

        *self.index_status.write() = IndexStatus::Idle;

        let stats = IndexStats {
            files_indexed: index_result.indexed_files,
            symbols_found: index_result.total_symbols,
            graph_nodes: graph_stats.nodes_created,
            graph_edges: graph_stats.edges_created,
            commits_indexed: self.context_lineage.stats().total_commits,
        };

        let _ = self.event_tx.send(ContextEvent::IndexingComplete {
            stats: stats.clone(),
        });

        Ok(stats)
    }

    /// Build comprehensive context for a coding task
    pub async fn build_context(&self, request: UnifiedContextRequest) -> Result<UnifiedContext, String> {
        let mut context = UnifiedContext {
            request: request.clone(),
            ..Default::default()
        };

        let mut budget = TokenBudget::for_coding_assistant(self.config.target_model)?;

        // 1. Current file and scope context (highest priority)
        if let Some(ref current_file) = request.current_file {
            context.current_file_context = self.get_current_file_context(
                current_file,
                request.cursor_position,
                request.selection.as_deref(),
                &mut budget,
            ).await?;
        }

        // 2. Semantic graph context (dependencies, callers, callees)
        if self.config.include_graph {
            if let Some(ref symbol) = request.focus_symbol {
                context.graph_context = self.get_graph_context(symbol, &mut budget).await?;
            } else if let Some(ref file) = request.current_file {
                // Get graph context for current file symbols
                context.graph_context = self.get_file_graph_context(file, &mut budget).await?;
            }
        }

        // 3. Git history context (why things changed)
        if self.config.include_history && request.include_history {
            context.history_context = self.get_history_context(&request, &mut budget).await?;
        }

        // 4. Related files based on query
        if let Some(ref query) = request.query {
            context.semantic_context = self.get_semantic_context(query, &mut budget).await?;
        }

        // 5. User-specified additional files
        for file in &request.additional_files {
            if let Ok(file_context) = self.get_file_context(file, ContextPriority::High, &mut budget).await {
                context.additional_context.push(file_context);
            }
        }

        // Calculate totals
        context.total_tokens = context.current_file_context.iter().map(|c| c.tokens).sum::<usize>()
            + context.graph_context.iter().map(|c| c.tokens).sum::<usize>()
            + context.history_context.iter().map(|c| c.tokens).sum::<usize>()
            + context.semantic_context.iter().map(|c| c.tokens).sum::<usize>()
            + context.additional_context.iter().map(|c| c.tokens).sum::<usize>();

        context.total_items = context.current_file_context.len()
            + context.graph_context.len()
            + context.history_context.len()
            + context.semantic_context.len()
            + context.additional_context.len();

        let _ = self.event_tx.send(ContextEvent::ContextBuilt {
            tokens: context.total_tokens,
            items: context.total_items,
        });

        Ok(context)
    }

    /// Get context for current file and cursor position
    async fn get_current_file_context(
        &self,
        file_path: &Path,
        cursor_position: Option<(usize, usize)>,
        selection: Option<&str>,
        budget: &mut TokenBudget,
    ) -> Result<Vec<ContextItem>, String> {
        let mut items = Vec::new();

        let content = std::fs::read_to_string(file_path)
            .map_err(|e| format!("Failed to read file: {}", e))?;

        // Get code structure
        let parsed = self.ast_engine.parse_file(file_path, &content)?;
        let structure = self.ast_engine.extract_structure(&parsed)?;

        // If cursor position provided, get the enclosing scope
        if let Some((line, _col)) = cursor_position {
            // Find enclosing function/class
            for func in &structure.functions {
                if func.start_line() <= line && func.end_line() >= line {
                    let func_content = extract_lines(&content, func.start_line(), func.end_line());
                    items.push(ContextItem {
                        id: format!("scope_{}_{}", file_path.to_string_lossy(), func.name),
                        file_path: file_path.to_path_buf(),
                        context_type: ContextType::CurrentScope,
                        priority: ContextPriority::Critical,
                        relevance: 1.0,
                        content: func_content.clone(),
                        tokens: budget.count_tokens(&func_content),
                        start_line: func.start_line(),
                        end_line: func.end_line(),
                        symbol_name: Some(func.name.clone()),
                        metadata: HashMap::from([
                            ("type".to_string(), "function".to_string()),
                            ("async".to_string(), func.is_async.to_string()),
                        ]),
                    });
                    break;
                }
            }

            for class in &structure.classes {
                if class.start_line() <= line && class.end_line() >= line {
                    let class_content = extract_lines(&content, class.start_line(), class.end_line());
                    items.push(ContextItem {
                        id: format!("scope_{}_{}", file_path.to_string_lossy(), class.name),
                        file_path: file_path.to_path_buf(),
                        context_type: ContextType::CurrentScope,
                        priority: ContextPriority::Critical,
                        relevance: 1.0,
                        content: class_content.clone(),
                        tokens: budget.count_tokens(&class_content),
                        start_line: class.start_line(),
                        end_line: class.end_line(),
                        symbol_name: Some(class.name.clone()),
                        metadata: HashMap::from([
                            ("type".to_string(), "class".to_string()),
                        ]),
                    });
                    break;
                }
            }
        }

        // Add selection if provided
        if let Some(sel) = selection {
            items.push(ContextItem {
                id: format!("selection_{}", file_path.to_string_lossy()),
                file_path: file_path.to_path_buf(),
                context_type: ContextType::CurrentScope,
                priority: ContextPriority::Critical,
                relevance: 1.0,
                content: sel.to_string(),
                tokens: budget.count_tokens(sel),
                start_line: 0,
                end_line: 0,
                symbol_name: None,
                metadata: HashMap::from([
                    ("type".to_string(), "selection".to_string()),
                ]),
            });
        }

        // Add file imports
        for import in &structure.imports {
            items.push(ContextItem {
                id: format!("import_{}_{}", file_path.to_string_lossy(), import.source),
                file_path: file_path.to_path_buf(),
                context_type: ContextType::Import,
                priority: ContextPriority::High,
                relevance: 0.8,
                content: format!("import {{...}} from '{}'", import.source),
                tokens: budget.count_tokens(&import.source),
                start_line: import.line(),
                end_line: import.line(),
                symbol_name: None,
                metadata: HashMap::new(),
            });
        }

        Ok(items)
    }

    /// Get context from the semantic code graph
    async fn get_graph_context(
        &self,
        symbol: &str,
        budget: &mut TokenBudget,
    ) -> Result<Vec<ContextItem>, String> {
        let mut items = Vec::new();

        // Get symbol context from graph
        let symbol_context = self.code_graph.get_context(symbol, self.config.graph_depth);

        // Add the symbol itself
        if let Some(node) = symbol_context.symbol {
            if let Some(file_path) = &node.file_path {
                if let (Some(start), Some(end)) = (node.start_line, node.end_line) {
                    if let Ok(content) = std::fs::read_to_string(file_path) {
                        let symbol_content = extract_lines(&content, start, end);
                        items.push(ContextItem {
                            id: node.id.clone(),
                            file_path: file_path.clone(),
                            context_type: ContextType::Definition,
                            priority: ContextPriority::High,
                            relevance: 0.95,
                            content: symbol_content.clone(),
                            tokens: budget.count_tokens(&symbol_content),
                            start_line: start,
                            end_line: end,
                            symbol_name: Some(node.name.clone()),
                            metadata: HashMap::from([
                                ("graph_node_type".to_string(), format!("{:?}", node.node_type)),
                            ]),
                        });
                    }
                }
            }
        }

        // Add callers (who uses this symbol)
        for related in symbol_context.incoming.iter().take(10) {
            if let Some(file_path) = &related.node.file_path {
                if let (Some(start), Some(end)) = (related.node.start_line, related.node.end_line) {
                    if let Ok(content) = std::fs::read_to_string(file_path) {
                        let caller_content = extract_lines(&content, start, end);
                        items.push(ContextItem {
                            id: related.node.id.clone(),
                            file_path: file_path.clone(),
                            context_type: ContextType::Reference,
                            priority: ContextPriority::Medium,
                            relevance: 0.7 - (related.distance as f32 * 0.1),
                            content: caller_content.clone(),
                            tokens: budget.count_tokens(&caller_content),
                            start_line: start,
                            end_line: end,
                            symbol_name: Some(related.node.name.clone()),
                            metadata: HashMap::from([
                                ("relationship".to_string(), format!("{:?}", related.relationship)),
                                ("distance".to_string(), related.distance.to_string()),
                            ]),
                        });
                    }
                }
            }
        }

        // Add callees (what this symbol calls)
        for related in symbol_context.outgoing.iter().take(10) {
            if let Some(file_path) = &related.node.file_path {
                if let (Some(start), Some(end)) = (related.node.start_line, related.node.end_line) {
                    if let Ok(content) = std::fs::read_to_string(file_path) {
                        let callee_content = extract_lines(&content, start, end);
                        items.push(ContextItem {
                            id: related.node.id.clone(),
                            file_path: file_path.clone(),
                            context_type: ContextType::Definition,
                            priority: ContextPriority::Medium,
                            relevance: 0.65 - (related.distance as f32 * 0.1),
                            content: callee_content.clone(),
                            tokens: budget.count_tokens(&callee_content),
                            start_line: start,
                            end_line: end,
                            symbol_name: Some(related.node.name.clone()),
                            metadata: HashMap::from([
                                ("relationship".to_string(), format!("{:?}", related.relationship)),
                                ("distance".to_string(), related.distance.to_string()),
                            ]),
                        });
                    }
                }
            }
        }

        Ok(items)
    }

    /// Get graph context for all symbols in a file
    async fn get_file_graph_context(
        &self,
        file_path: &Path,
        budget: &mut TokenBudget,
    ) -> Result<Vec<ContextItem>, String> {
        let items = Vec::new();

        // Get file dependencies from graph
        let dependencies = self.code_graph.stats();
        // In a full implementation, we'd query the graph for this file's relationships

        Ok(items)
    }

    /// Get git history context
    async fn get_history_context(
        &self,
        request: &UnifiedContextRequest,
        budget: &mut TokenBudget,
    ) -> Result<Vec<ContextItem>, String> {
        let mut items = Vec::new();
        let lineage = &*self.context_lineage;

        // If we have a current file, get its history
        if let Some(ref file_path) = request.current_file {
            let file_history = lineage.get_file_history(file_path);
            
            for commit in file_history.iter().take(5) {
                let commit_context = format!(
                    "Commit {} by {} on {}:\n{}\n\nFiles: {}",
                    commit.short_hash,
                    commit.author,
                    commit.date.format("%Y-%m-%d"),
                    commit.message,
                    commit.files_changed.iter()
                        .map(|f| f.path.to_string_lossy().to_string())
                        .collect::<Vec<_>>()
                        .join(", ")
                );

                items.push(ContextItem {
                    id: format!("history_{}", commit.hash),
                    file_path: file_path.clone(),
                    context_type: ContextType::Documentation, // Using Documentation for history
                    priority: ContextPriority::Low,
                    relevance: 0.5,
                    content: commit_context.clone(),
                    tokens: budget.count_tokens(&commit_context),
                    start_line: 0,
                    end_line: 0,
                    symbol_name: None,
                    metadata: HashMap::from([
                        ("type".to_string(), "git_history".to_string()),
                        ("commit_hash".to_string(), commit.hash.clone()),
                        ("author".to_string(), commit.author.clone()),
                    ]),
                });
            }
        }

        // If we have a query, search history for relevant commits
        if let Some(ref query) = request.query {
            let search_results = lineage.search_commits(query, 3);
            
            for result in search_results {
                let summary_context = format!(
                    "Related commit {} ({}):\n{}\nGoal: {}\nKeywords: {}",
                    result.summary.commit_hash,
                    result.summary.date.format("%Y-%m-%d"),
                    result.summary.summary,
                    result.summary.goal,
                    result.summary.keywords.join(", ")
                );

                items.push(ContextItem {
                    id: format!("history_search_{}", result.summary.commit_hash),
                    file_path: PathBuf::new(),
                    context_type: ContextType::Retrieved,
                    priority: ContextPriority::Low,
                    relevance: result.score * 0.5,
                    content: summary_context.clone(),
                    tokens: budget.count_tokens(&summary_context),
                    start_line: 0,
                    end_line: 0,
                    symbol_name: None,
                    metadata: HashMap::from([
                        ("type".to_string(), "git_search_result".to_string()),
                        ("score".to_string(), result.score.to_string()),
                    ]),
                });
            }
        }

        Ok(items)
    }

    /// Get semantic search context
    async fn get_semantic_context(
        &self,
        query: &str,
        budget: &mut TokenBudget,
    ) -> Result<Vec<ContextItem>, String> {
        let mut items = Vec::new();

        // Search code graph
        let graph_results = self.code_graph.search(query, 10);

        for node in graph_results {
            if let Some(file_path) = &node.file_path {
                if let (Some(start), Some(end)) = (node.start_line, node.end_line) {
                    if let Ok(content) = std::fs::read_to_string(file_path) {
                        let symbol_content = extract_lines(&content, start, end);
                        items.push(ContextItem {
                            id: node.id.clone(),
                            file_path: file_path.clone(),
                            context_type: ContextType::Semantic,
                            priority: ContextPriority::Medium,
                            relevance: 0.6,
                            content: symbol_content.clone(),
                            tokens: budget.count_tokens(&symbol_content),
                            start_line: start,
                            end_line: end,
                            symbol_name: Some(node.name.clone()),
                            metadata: HashMap::from([
                                ("search_query".to_string(), query.to_string()),
                            ]),
                        });
                    }
                }
            }
        }

        // If embedding service available, do semantic search
        if let Some(ref embedding_service) = self.embedding_service {
            // Would perform semantic search here
        }

        Ok(items)
    }

    /// Get context for a specific file
    async fn get_file_context(
        &self,
        file_path: &Path,
        priority: ContextPriority,
        budget: &mut TokenBudget,
    ) -> Result<ContextItem, String> {
        let content = std::fs::read_to_string(file_path)
            .map_err(|e| format!("Failed to read file: {}", e))?;

        Ok(ContextItem {
            id: format!("file_{}", file_path.to_string_lossy()),
            file_path: file_path.to_path_buf(),
            context_type: ContextType::UserSpecified,
            priority,
            relevance: priority as u8 as f32 / 100.0,
            content: content.clone(),
            tokens: budget.count_tokens(&content),
            start_line: 1,
            end_line: content.lines().count(),
            symbol_name: None,
            metadata: HashMap::new(),
        })
    }

    /// Format context for LLM consumption
    pub fn format_for_llm(&self, context: &UnifiedContext) -> String {
        let mut output = String::new();

        // Header
        output.push_str("# Context\n\n");

        // Current scope (highest priority)
        if !context.current_file_context.is_empty() {
            output.push_str("## Current Context\n\n");
            for item in &context.current_file_context {
                if item.context_type == ContextType::CurrentScope {
                    if let Some(ref name) = item.symbol_name {
                        output.push_str(&format!("### {} ({}:{})\n", 
                            name, 
                            item.file_path.display(), 
                            item.start_line
                        ));
                    }
                    output.push_str("```\n");
                    output.push_str(&item.content);
                    output.push_str("\n```\n\n");
                }
            }
        }

        // Graph context (dependencies)
        if !context.graph_context.is_empty() {
            output.push_str("## Related Code\n\n");
            for item in context.graph_context.iter().take(5) {
                if let Some(ref name) = item.symbol_name {
                    let relationship = item.metadata.get("relationship").map(|s| s.as_str()).unwrap_or("related");
                    output.push_str(&format!("### {} ({}) - {}\n", 
                        name, 
                        item.file_path.display(),
                        relationship
                    ));
                }
                output.push_str("```\n");
                output.push_str(&item.content);
                output.push_str("\n```\n\n");
            }
        }

        // History context
        if !context.history_context.is_empty() {
            output.push_str("## Recent Changes\n\n");
            for item in context.history_context.iter().take(3) {
                output.push_str(&item.content);
                output.push_str("\n\n");
            }
        }

        // Semantic search results
        if !context.semantic_context.is_empty() {
            output.push_str("## Related Symbols\n\n");
            for item in context.semantic_context.iter().take(5) {
                if let Some(ref name) = item.symbol_name {
                    output.push_str(&format!("### {}\n", name));
                }
                output.push_str("```\n");
                output.push_str(&item.content);
                output.push_str("\n```\n\n");
            }
        }

        output
    }

    /// Get current index status
    pub fn get_status(&self) -> IndexStatus {
        self.index_status.read().clone()
    }

    /// Update file in index
    pub async fn update_file(&self, file_path: &Path) -> Result<(), String> {
        let _ = self.project_indexer.reindex_file(file_path).await?;
        self.code_graph.update_file(file_path)?;
        Ok(())
    }

    /// Search across all context sources
    pub async fn search(&self, query: &str, limit: usize) -> SearchResults {
        let mut results = SearchResults::default();

        // Search code graph
        results.symbols = self.code_graph.search(query, limit);

        // Search git history
        results.commits = self.context_lineage.search_commits(query, limit);

        results
    }

    /// Get symbol context from code graph
    pub fn get_symbol_context(&self, symbol_name: &str) -> Option<super::SymbolContext> {
        let ctx = self.code_graph.get_context(symbol_name, 2);
        if ctx.symbol.is_none() && ctx.incoming.is_empty() && ctx.outgoing.is_empty() {
            None
        } else {
            Some(ctx)
        }
    }

    /// Search git history commits
    pub fn search_history(&self, query: &str, limit: usize) -> Vec<super::context_lineage::CommitSearchResult> {
        self.context_lineage.search_commits(query, limit)
    }

    /// Explain file change history
    pub fn explain_file_history(&self, file_path: &std::path::Path) -> Result<String, String> {
        let lineage = &*self.context_lineage;
        let history = lineage.get_file_history(file_path);
        if history.is_empty() {
            return Err("No history found for this file".to_string());
        }
        let mut output = format!("File: {}\n", file_path.display());
        output.push_str(&format!("Total changes: {}\n\n", history.len()));
        for commit in history.iter().take(10) {
            output.push_str(&format!("- {} ({}): {}\n",
                commit.hash.get(..7).unwrap_or(&commit.hash),
                commit.author,
                commit.message.lines().next().unwrap_or(&commit.message)));
        }
        Ok(output)
    }
}

/// Request for building unified context
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnifiedContextRequest {
    pub current_file: Option<PathBuf>,
    pub cursor_position: Option<(usize, usize)>,
    pub selection: Option<String>,
    pub focus_symbol: Option<String>,
    pub query: Option<String>,
    pub additional_files: Vec<PathBuf>,
    pub include_history: bool,
    pub max_tokens: Option<usize>,
}

/// Unified context result
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct UnifiedContext {
    pub request: UnifiedContextRequest,
    pub current_file_context: Vec<ContextItem>,
    pub graph_context: Vec<ContextItem>,
    pub history_context: Vec<ContextItem>,
    pub semantic_context: Vec<ContextItem>,
    pub additional_context: Vec<ContextItem>,
    pub total_tokens: usize,
    pub total_items: usize,
}

impl Default for UnifiedContextRequest {
    fn default() -> Self {
        Self {
            current_file: None,
            cursor_position: None,
            selection: None,
            focus_symbol: None,
            query: None,
            additional_files: Vec::new(),
            include_history: true,
            max_tokens: None,
        }
    }
}

/// Index statistics
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct IndexStats {
    pub files_indexed: usize,
    pub symbols_found: usize,
    pub graph_nodes: usize,
    pub graph_edges: usize,
    pub commits_indexed: usize,
}

/// Search results across all sources
#[derive(Debug, Clone, Default)]
pub struct SearchResults {
    pub symbols: Vec<GraphNode>,
    pub commits: Vec<super::context_lineage::CommitSearchResult>,
}

/// Extract lines from content (1-indexed, inclusive)
fn extract_lines(content: &str, start: usize, end: usize) -> String {
    content
        .lines()
        .enumerate()
        .filter(|(i, _)| *i + 1 >= start && *i + 1 <= end)
        .map(|(_, line)| line)
        .collect::<Vec<_>>()
        .join("\n")
}

// Tauri commands

#[tauri::command]
pub async fn initialize_context_engine(project_root: String) -> Result<IndexStats, String> {
    let engine = UnifiedContextEngine::new(
        PathBuf::from(project_root),
        UnifiedContextConfig::default(),
    ).await?;
    
    engine.initialize().await
}

pub async fn build_unified_context_stub(
    current_file: Option<String>,
    query: Option<String>,
    include_history: bool,
) -> Result<String, String> {
    Err("Context engine not initialized".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_lines() {
        let content = "line 1\nline 2\nline 3\nline 4\nline 5";
        let extracted = extract_lines(content, 2, 4);
        assert_eq!(extracted, "line 2\nline 3\nline 4");
    }

    #[test]
    fn test_unified_context_config_default() {
        let config = UnifiedContextConfig::default();
        assert_eq!(config.max_context_tokens, 100000);
        assert!(config.include_history);
        assert!(config.include_graph);
    }
}
