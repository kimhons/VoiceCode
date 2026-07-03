#![allow(dead_code, unused_variables, unused_imports)]
// Phase 3: Context Aggregation System
// Intelligent context building for LLM-powered coding assistance

use std::collections::{HashMap, HashSet};
use std::path::{Path, PathBuf};
use std::sync::Arc;
use serde::{Deserialize, Serialize};
use parking_lot::RwLock;

use super::ast_engine::{ASTEngine, CodeStructure, ParsedFile};
use super::symbol_table::SymbolTable;
use super::chunker::{CodeChunker, ChunkType};
use super::token_budget::{TokenBudget, ContentCategory, LLMModel};

/// Priority level for context items
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
pub enum ContextPriority {
    /// Critical - must include (current file, direct dependencies)
    Critical = 100,
    /// High - strongly prefer (referenced symbols, imported modules)
    High = 80,
    /// Medium - include if space permits (related files, parent classes)
    Medium = 60,
    /// Low - optional context (documentation, examples)
    Low = 40,
    /// Minimal - only if abundant space (tangential files)
    Minimal = 20,
}

impl ContextPriority {
    pub fn from_score(score: f32) -> Self {
        if score >= 0.9 {
            ContextPriority::Critical
        } else if score >= 0.7 {
            ContextPriority::High
        } else if score >= 0.5 {
            ContextPriority::Medium
        } else if score >= 0.3 {
            ContextPriority::Low
        } else {
            ContextPriority::Minimal
        }
    }
}

/// A single piece of context
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContextItem {
    /// Unique identifier
    pub id: String,
    /// Source file path
    pub file_path: PathBuf,
    /// Type of context
    pub context_type: ContextType,
    /// Priority level
    pub priority: ContextPriority,
    /// Relevance score (0.0 - 1.0)
    pub relevance: f32,
    /// The actual content
    pub content: String,
    /// Token count
    pub tokens: usize,
    /// Start line in source
    pub start_line: usize,
    /// End line in source
    pub end_line: usize,
    /// Symbol name if applicable
    pub symbol_name: Option<String>,
    /// Additional metadata
    pub metadata: HashMap<String, String>,
}

/// Type of context item
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ContextType {
    /// Current file being edited
    CurrentFile,
    /// Current function/class being edited
    CurrentScope,
    /// Imported module/file
    Import,
    /// Symbol definition
    Definition,
    /// Symbol usage/reference
    Reference,
    /// Parent class/trait
    Inheritance,
    /// Interface implementation
    Implementation,
    /// Test file
    Test,
    /// Documentation
    Documentation,
    /// Configuration file
    Configuration,
    /// Related by name/semantics
    Semantic,
    /// Retrieved from vector search
    Retrieved,
    /// User-specified context
    UserSpecified,
}

/// Aggregated project context for LLM
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectContext {
    /// Project root path
    pub project_root: PathBuf,
    /// Current file path
    pub current_file: Option<PathBuf>,
    /// Current cursor position (line, column)
    pub cursor_position: Option<(usize, usize)>,
    /// User's query/intent
    pub query: Option<String>,
    /// Selected/highlighted code
    pub selection: Option<String>,
    /// Context items sorted by priority
    pub items: Vec<ContextItem>,
    /// Total token count
    pub total_tokens: usize,
    /// Model used for context
    pub model: String,
    /// Summary statistics
    pub stats: ContextStats,
}

/// Statistics about the context
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ContextStats {
    pub files_included: usize,
    pub symbols_included: usize,
    pub imports_resolved: usize,
    pub definitions_found: usize,
    pub references_found: usize,
    pub chunks_included: usize,
    pub total_tokens: usize,
    pub budget_used_pct: f32,
}

/// Configuration for context building
#[derive(Debug, Clone)]
pub struct ContextBuilderConfig {
    /// LLM model to optimize for
    pub model: LLMModel,
    /// Maximum files to include
    pub max_files: usize,
    /// Maximum symbols to include
    pub max_symbols: usize,
    /// Include test files
    pub include_tests: bool,
    /// Include documentation
    pub include_docs: bool,
    /// Depth for import resolution
    pub import_depth: usize,
    /// Depth for inheritance chain
    pub inheritance_depth: usize,
    /// Include node_modules/vendor
    pub include_vendor: bool,
    /// Prioritize recent files
    pub recency_boost: bool,
    /// File patterns to always include
    pub always_include: Vec<String>,
    /// File patterns to always exclude
    pub always_exclude: Vec<String>,
}

impl Default for ContextBuilderConfig {
    fn default() -> Self {
        Self {
            model: LLMModel::Claude3Sonnet,
            max_files: 50,
            max_symbols: 200,
            include_tests: true,
            include_docs: true,
            import_depth: 3,
            inheritance_depth: 5,
            include_vendor: false,
            recency_boost: true,
            always_include: vec![],
            always_exclude: vec![
                "**/node_modules/**".to_string(),
                "**/target/**".to_string(),
                "**/dist/**".to_string(),
                "**/.git/**".to_string(),
                "**/vendor/**".to_string(),
            ],
        }
    }
}

/// Context builder for aggregating relevant code context
pub struct ContextBuilder {
    config: ContextBuilderConfig,
    ast_engine: Arc<ASTEngine>,
    symbol_table: Arc<SymbolTable>,
    chunker: CodeChunker,
    file_cache: RwLock<HashMap<PathBuf, Arc<ParsedFile>>>,
    structure_cache: RwLock<HashMap<PathBuf, CodeStructure>>,
}

impl ContextBuilder {
    pub fn new(
        config: ContextBuilderConfig,
        ast_engine: Arc<ASTEngine>,
        symbol_table: Arc<SymbolTable>,
    ) -> Self {
        Self {
            config,
            ast_engine,
            symbol_table,
            chunker: CodeChunker::with_defaults(),
            file_cache: RwLock::new(HashMap::new()),
            structure_cache: RwLock::new(HashMap::new()),
        }
    }

    /// Build context for a coding task
    pub fn build_context(
        &self,
        request: ContextRequest,
    ) -> Result<ProjectContext, String> {
        let mut budget = TokenBudget::for_coding_assistant(self.config.model)?;
        let mut items: Vec<ContextItem> = Vec::new();
        let mut stats = ContextStats::default();
        let mut included_files: HashSet<PathBuf> = HashSet::new();

        // 1. Add current file context (highest priority)
        if let Some(ref current_file) = request.current_file {
            if let Ok(file_items) = self.add_current_file_context(
                current_file,
                request.cursor_position,
                request.selection.as_deref(),
                &mut budget,
            ) {
                included_files.insert(current_file.clone());
                stats.files_included += 1;
                for item in file_items {
                    stats.total_tokens += item.tokens;
                    items.push(item);
                }
            }
        }

        // 2. Add user-specified context files
        for path in &request.context_files {
            if included_files.contains(path) {
                continue;
            }
            if let Ok(file_items) = self.add_file_context(path, ContextPriority::High, &mut budget) {
                included_files.insert(path.clone());
                stats.files_included += 1;
                for item in file_items {
                    stats.total_tokens += item.tokens;
                    items.push(item);
                }
            }
        }

        // 3. Resolve imports and add import context
        if let Some(ref current_file) = request.current_file {
            if let Ok(import_items) = self.resolve_imports(
                current_file,
                &mut included_files,
                &mut budget,
                self.config.import_depth,
            ) {
                stats.imports_resolved += import_items.len();
                for item in import_items {
                    stats.total_tokens += item.tokens;
                    items.push(item);
                }
            }
        }

        // 4. Add symbol definitions
        if let Some(ref current_file) = request.current_file {
            if let Ok(def_items) = self.add_symbol_definitions(
                current_file,
                &mut included_files,
                &mut budget,
            ) {
                stats.definitions_found += def_items.len();
                stats.symbols_included += def_items.len();
                for item in def_items {
                    stats.total_tokens += item.tokens;
                    items.push(item);
                }
            }
        }

        // 5. Add related files based on query
        if let Some(ref query) = request.query {
            if let Ok(related_items) = self.add_related_context(
                query,
                &request.project_root,
                &mut included_files,
                &mut budget,
            ) {
                for item in related_items {
                    stats.files_included += 1;
                    stats.total_tokens += item.tokens;
                    items.push(item);
                }
            }
        }

        // 6. Sort by priority and relevance
        items.sort_by(|a, b| {
            let priority_cmp = b.priority.cmp(&a.priority);
            if priority_cmp == std::cmp::Ordering::Equal {
                b.relevance.partial_cmp(&a.relevance).unwrap_or(std::cmp::Ordering::Equal)
            } else {
                priority_cmp
            }
        });

        stats.chunks_included = items.len();
        stats.budget_used_pct = (stats.total_tokens as f32) / (self.config.model.max_tokens() as f32) * 100.0;

        Ok(ProjectContext {
            project_root: request.project_root,
            current_file: request.current_file,
            cursor_position: request.cursor_position,
            query: request.query,
            selection: request.selection,
            items,
            total_tokens: stats.total_tokens,
            model: format!("{:?}", self.config.model),
            stats,
        })
    }

    /// Add context from the current file
    fn add_current_file_context(
        &self,
        file_path: &Path,
        cursor_position: Option<(usize, usize)>,
        selection: Option<&str>,
        budget: &mut TokenBudget,
    ) -> Result<Vec<ContextItem>, String> {
        let mut items = Vec::new();

        // Read and parse file
        let content = std::fs::read_to_string(file_path)
            .map_err(|e| format!("Failed to read file: {}", e))?;

        let parsed = self.ast_engine.parse_file(file_path, &content)?;
        let structure = self.ast_engine.extract_structure(&parsed)?;

        // Cache for later use
        self.file_cache.write().insert(file_path.to_path_buf(), parsed.clone());
        self.structure_cache.write().insert(file_path.to_path_buf(), structure.clone());

        // Chunk the file
        let chunks = self.chunker.chunk_file(&parsed, &structure);

        // If cursor position provided, prioritize the containing scope
        let current_scope_chunk = if let Some((line, _col)) = cursor_position {
            chunks.iter()
                .filter(|c| c.start_line <= line && c.end_line >= line)
                .filter(|c| matches!(c.chunk_type, ChunkType::Function | ChunkType::Class))
                .max_by_key(|c| c.chunk_type.priority_weight() as i32)
                .cloned()
        } else {
            None
        };

        // Add current scope with highest priority
        if let Some(ref scope) = current_scope_chunk {
            let processed = budget.add_content(ContentCategory::CurrentFile, &scope.content);
            items.push(ContextItem {
                id: scope.id.clone(),
                file_path: file_path.to_path_buf(),
                context_type: ContextType::CurrentScope,
                priority: ContextPriority::Critical,
                relevance: 1.0,
                content: processed,
                tokens: budget.count_tokens(&scope.content),
                start_line: scope.start_line,
                end_line: scope.end_line,
                symbol_name: Some(scope.name.clone()),
                metadata: HashMap::new(),
            });
        }

        // Add selected code if any
        if let Some(selection) = selection {
            let processed = budget.add_content(ContentCategory::CurrentFile, selection);
            items.push(ContextItem {
                id: format!("selection_{}", file_path.to_string_lossy()),
                file_path: file_path.to_path_buf(),
                context_type: ContextType::CurrentScope,
                priority: ContextPriority::Critical,
                relevance: 1.0,
                content: processed,
                tokens: budget.count_tokens(selection),
                start_line: 0,
                end_line: 0,
                symbol_name: None,
                metadata: HashMap::new(),
            });
        }

        // Add remaining file content with lower priority
        let remaining_content = if let Some(ref scope) = current_scope_chunk {
            // Exclude the current scope to avoid duplication
            chunks.iter()
                .filter(|c| c.id != scope.id)
                .filter(|c| !matches!(c.chunk_type, ChunkType::Module))
                .map(|c| c.content.clone())
                .collect::<Vec<_>>()
                .join("\n\n")
        } else {
            content.clone()
        };

        if !remaining_content.is_empty() {
            let processed = budget.add_content(ContentCategory::CurrentFile, &remaining_content);
            items.push(ContextItem {
                id: format!("file_{}", file_path.to_string_lossy()),
                file_path: file_path.to_path_buf(),
                context_type: ContextType::CurrentFile,
                priority: ContextPriority::High,
                relevance: 0.9,
                content: processed,
                tokens: budget.count_tokens(&remaining_content),
                start_line: 1,
                end_line: content.lines().count(),
                symbol_name: None,
                metadata: HashMap::new(),
            });
        }

        Ok(items)
    }

    /// Add context from a specific file
    fn add_file_context(
        &self,
        file_path: &Path,
        priority: ContextPriority,
        budget: &mut TokenBudget,
    ) -> Result<Vec<ContextItem>, String> {
        let mut items = Vec::new();

        let content = std::fs::read_to_string(file_path)
            .map_err(|e| format!("Failed to read file: {}", e))?;

        let processed = budget.add_content(ContentCategory::RelatedFiles, &content);
        let tokens = budget.count_tokens(&content);

        items.push(ContextItem {
            id: format!("file_{}", file_path.to_string_lossy()),
            file_path: file_path.to_path_buf(),
            context_type: ContextType::Import,
            priority,
            relevance: priority as u8 as f32 / 100.0,
            content: processed,
            tokens,
            start_line: 1,
            end_line: content.lines().count(),
            symbol_name: None,
            metadata: HashMap::new(),
        });

        Ok(items)
    }

    /// Resolve imports and add their context
    fn resolve_imports(
        &self,
        current_file: &Path,
        included: &mut HashSet<PathBuf>,
        budget: &mut TokenBudget,
        depth: usize,
    ) -> Result<Vec<ContextItem>, String> {
        if depth == 0 {
            return Ok(Vec::new());
        }

        let mut items = Vec::new();

        // Get structure from cache or parse
        let structure = {
            if let Some(s) = self.structure_cache.read().get(current_file) {
                s.clone()
            } else {
                let content = std::fs::read_to_string(current_file)
                    .map_err(|e| format!("Failed to read: {}", e))?;
                let parsed = self.ast_engine.parse_file(current_file, &content)?;
                let structure = self.ast_engine.extract_structure(&parsed)?;
                self.structure_cache.write().insert(current_file.to_path_buf(), structure.clone());
                structure
            }
        };

        // Resolve each import
        for import in &structure.imports {
            if let Some(resolved_path) = self.resolve_import_path(current_file, &import.source) {
                if included.contains(&resolved_path) {
                    continue;
                }
                if !resolved_path.exists() {
                    continue;
                }
                if self.should_exclude(&resolved_path) {
                    continue;
                }

                // Add import file context
                if let Ok(import_items) = self.add_file_context(
                    &resolved_path,
                    ContextPriority::Medium,
                    budget,
                ) {
                    included.insert(resolved_path.clone());
                    items.extend(import_items);
                }

                // Recursively resolve (with reduced depth)
                if depth > 1 && included.len() < self.config.max_files {
                    if let Ok(nested) = self.resolve_imports(&resolved_path, included, budget, depth - 1) {
                        items.extend(nested);
                    }
                }
            }
        }

        Ok(items)
    }

    /// Resolve an import path to an actual file path
    fn resolve_import_path(&self, from_file: &Path, import_source: &str) -> Option<PathBuf> {
        let parent = from_file.parent()?;

        // Handle relative imports
        if import_source.starts_with("./") || import_source.starts_with("../") {
            let base_path = parent.join(import_source);

            // Try with various extensions
            let extensions = ["", ".ts", ".tsx", ".js", ".jsx", ".rs", ".py", ".go"];
            for ext in &extensions {
                let path = base_path.with_extension(ext.trim_start_matches('.'));
                if path.exists() && path.is_file() {
                    return Some(path);
                }
            }

            // Try as directory with index
            let index_files = ["index.ts", "index.tsx", "index.js", "mod.rs", "__init__.py"];
            for index in &index_files {
                let path = base_path.join(index);
                if path.exists() {
                    return Some(path);
                }
            }
        }

        // Handle absolute imports (from project root)
        if let Some(root) = self.symbol_table.project_root() {
            let project_path = root.join(import_source);
            if project_path.exists() {
                return Some(project_path);
            }

            // Try src/ prefix
            let src_path = root.join("src").join(import_source);
            if src_path.exists() {
                return Some(src_path);
            }
        }

        None
    }

    /// Add symbol definitions context
    fn add_symbol_definitions(
        &self,
        current_file: &Path,
        included: &mut HashSet<PathBuf>,
        budget: &mut TokenBudget,
    ) -> Result<Vec<ContextItem>, String> {
        let mut items = Vec::new();

        // Get structure from cache
        let structure = {
            self.structure_cache.read().get(current_file).cloned()
        };

        let structure = match structure {
            Some(s) => s,
            None => return Ok(items),
        };

        // Find definitions for referenced symbols
        let mut referenced_symbols: HashSet<String> = HashSet::new();

        // Collect references from functions
        for func in &structure.functions {
            for reference in func.references() {
                referenced_symbols.insert(reference.clone());
            }
        }

        // Collect references from classes
        for class in &structure.classes {
            for ext in &class.extends {
                referenced_symbols.insert(ext.clone());
            }
            for impl_name in &class.implements {
                referenced_symbols.insert(impl_name.clone());
            }
            for method in &class.methods {
                for reference in method.references() {
                    referenced_symbols.insert(reference.clone());
                }
            }
        }

        // Find definitions in symbol table
        for symbol_name in referenced_symbols.iter().take(self.config.max_symbols) {
            if let Some(symbol) = self.symbol_table.find_definition(current_file, symbol_name) {
                if included.contains(&symbol.file_path) {
                    continue;
                }
                if symbol.file_path == current_file {
                    continue;
                }
                if self.should_exclude(&symbol.file_path) {
                    continue;
                }

                // Read the symbol's content
                if let Ok(content) = std::fs::read_to_string(&symbol.file_path) {
                    let symbol_start = symbol.line();
                    let symbol_end = symbol.end_line();
                    let symbol_content = extract_lines(&content, symbol_start, symbol_end);
                    let processed = budget.add_content(ContentCategory::Definitions, &symbol_content);
                    let tokens = budget.count_tokens(&symbol_content);

                    items.push(ContextItem {
                        id: symbol.id.clone(),
                        file_path: symbol.file_path.clone(),
                        context_type: ContextType::Definition,
                        priority: ContextPriority::High,
                        relevance: 0.85,
                        content: processed,
                        tokens,
                        start_line: symbol_start,
                        end_line: symbol_end,
                        symbol_name: Some(symbol.name.clone()),
                        metadata: HashMap::from([
                            ("kind".to_string(), format!("{:?}", symbol.kind)),
                        ]),
                    });
                }
            }
        }

        Ok(items)
    }

    /// Add context related to the query
    fn add_related_context(
        &self,
        query: &str,
        project_root: &Path,
        included: &mut HashSet<PathBuf>,
        budget: &mut TokenBudget,
    ) -> Result<Vec<ContextItem>, String> {
        let mut items = Vec::new();

        // Search symbols by query
        let matching_symbols = self.symbol_table.search(query, 20);

        for symbol in matching_symbols {
            if included.contains(&symbol.file_path) {
                continue;
            }
            if self.should_exclude(&symbol.file_path) {
                continue;
            }
            if included.len() >= self.config.max_files {
                break;
            }

            if let Ok(content) = std::fs::read_to_string(&symbol.file_path) {
                let sym_start = symbol.line();
                let sym_end = symbol.end_line();
                let symbol_content = extract_lines(&content, sym_start, sym_end);
                let processed = budget.add_content(ContentCategory::Retrieved, &symbol_content);
                let tokens = budget.count_tokens(&symbol_content);

                included.insert(symbol.file_path.clone());
                items.push(ContextItem {
                    id: symbol.id.clone(),
                    file_path: symbol.file_path.clone(),
                    context_type: ContextType::Semantic,
                    priority: ContextPriority::Medium,
                    relevance: 0.6,
                    content: processed,
                    tokens,
                    start_line: sym_start,
                    end_line: sym_end,
                    symbol_name: Some(symbol.name.clone()),
                    metadata: HashMap::new(),
                });
            }
        }

        Ok(items)
    }

    /// Check if file should be excluded
    fn should_exclude(&self, path: &Path) -> bool {
        let path_str = path.to_string_lossy();

        for pattern in &self.config.always_exclude {
            if globset::Glob::new(pattern)
                .ok()
                .and_then(|g| g.compile_matcher().is_match(&*path_str).then_some(true))
                .is_some()
            {
                return true;
            }
        }

        // Check common vendor directories
        if !self.config.include_vendor {
            let vendor_patterns = ["node_modules", "vendor", "target", "dist", "build", ".git"];
            for pattern in &vendor_patterns {
                if path_str.contains(pattern) {
                    return true;
                }
            }
        }

        false
    }

    /// Build context specifically for code generation
    pub fn build_generation_context(
        &self,
        request: GenerationRequest,
    ) -> Result<GenerationContext, String> {
        let context = self.build_context(ContextRequest {
            project_root: request.project_root.clone(),
            current_file: request.current_file.clone(),
            cursor_position: request.cursor_position,
            selection: request.selection.clone(),
            query: Some(request.intent.clone()),
            context_files: request.additional_files.clone(),
        })?;

        Ok(GenerationContext {
            project_context: context,
            intent: request.intent,
            generation_type: request.generation_type,
            constraints: request.constraints,
        })
    }

    /// Build context for code explanation
    pub fn build_explanation_context(
        &self,
        file_path: &Path,
        selection: Option<&str>,
    ) -> Result<ProjectContext, String> {
        let project_root = self.symbol_table.project_root()
            .unwrap_or_else(|| file_path.parent().unwrap_or(Path::new(".")).to_path_buf());

        self.build_context(ContextRequest {
            project_root,
            current_file: Some(file_path.to_path_buf()),
            cursor_position: None,
            selection: selection.map(|s| s.to_string()),
            query: Some("explain code".to_string()),
            context_files: Vec::new(),
        })
    }

    /// Serialize context to a prompt-ready format
    pub fn serialize_context(&self, context: &ProjectContext) -> String {
        let mut output = String::new();

        // Add project info
        output.push_str(&format!("# Project: {}\n\n", context.project_root.display()));

        if let Some(ref file) = context.current_file {
            output.push_str(&format!("## Current File: {}\n\n", file.display()));
        }

        // Group items by type
        let mut by_type: HashMap<ContextType, Vec<&ContextItem>> = HashMap::new();
        for item in &context.items {
            by_type.entry(item.context_type.clone()).or_default().push(item);
        }

        // Add current scope/selection first
        if let Some(current_items) = by_type.get(&ContextType::CurrentScope) {
            output.push_str("## Current Context\n\n");
            for item in current_items {
                if let Some(ref name) = item.symbol_name {
                    output.push_str(&format!("### {} ({}:{})\n", name, item.file_path.display(), item.start_line));
                }
                output.push_str("```\n");
                output.push_str(&item.content);
                output.push_str("\n```\n\n");
            }
        }

        // Add definitions
        if let Some(def_items) = by_type.get(&ContextType::Definition) {
            output.push_str("## Related Definitions\n\n");
            for item in def_items {
                if let Some(ref name) = item.symbol_name {
                    output.push_str(&format!("### {} ({})\n", name, item.file_path.display()));
                }
                output.push_str("```\n");
                output.push_str(&item.content);
                output.push_str("\n```\n\n");
            }
        }

        // Add imports
        if let Some(import_items) = by_type.get(&ContextType::Import) {
            output.push_str("## Imported Modules\n\n");
            for item in import_items.iter().take(5) {
                output.push_str(&format!("### {}\n", item.file_path.display()));
                output.push_str("```\n");
                output.push_str(&item.content);
                output.push_str("\n```\n\n");
            }
        }

        // Add remaining context
        let other_types = [ContextType::Semantic, ContextType::Retrieved, ContextType::CurrentFile];
        for context_type in &other_types {
            if let Some(items) = by_type.get(context_type) {
                for item in items.iter().take(3) {
                    output.push_str(&format!("## {} - {}\n\n", format!("{:?}", context_type), item.file_path.display()));
                    output.push_str("```\n");
                    output.push_str(&item.content);
                    output.push_str("\n```\n\n");
                }
            }
        }

        output
    }

    /// Clear all caches
    pub fn clear_caches(&self) {
        self.file_cache.write().clear();
        self.structure_cache.write().clear();
    }
}

/// Request for building context
#[derive(Debug, Clone)]
pub struct ContextRequest {
    pub project_root: PathBuf,
    pub current_file: Option<PathBuf>,
    pub cursor_position: Option<(usize, usize)>,
    pub selection: Option<String>,
    pub query: Option<String>,
    pub context_files: Vec<PathBuf>,
}

/// Request for code generation context
#[derive(Debug, Clone)]
pub struct GenerationRequest {
    pub project_root: PathBuf,
    pub current_file: Option<PathBuf>,
    pub cursor_position: Option<(usize, usize)>,
    pub selection: Option<String>,
    pub intent: String,
    pub generation_type: GenerationType,
    pub constraints: Vec<String>,
    pub additional_files: Vec<PathBuf>,
}

/// Type of code generation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum GenerationType {
    /// Generate new code
    Create,
    /// Modify existing code
    Modify,
    /// Fix a bug
    Fix,
    /// Refactor code
    Refactor,
    /// Add tests
    Test,
    /// Add documentation
    Document,
    /// Complete partial code
    Complete,
}

/// Context prepared for code generation
#[derive(Debug, Clone, Serialize)]
pub struct GenerationContext {
    pub project_context: ProjectContext,
    pub intent: String,
    pub generation_type: GenerationType,
    pub constraints: Vec<String>,
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
pub async fn build_context(
    project_root: String,
    current_file: Option<String>,
    cursor_line: Option<usize>,
    cursor_col: Option<usize>,
    selection: Option<String>,
    query: Option<String>,
) -> Result<ProjectContext, String> {
    // This would be called with actual state in production
    // For now, return a placeholder
    Err("Context builder not initialized. Call init_context_engine first.".to_string())
}

#[tauri::command]
pub async fn serialize_context(context: ProjectContext) -> Result<String, String> {
    // Placeholder - actual implementation would use the ContextBuilder instance
    Ok(format!("# Context for {}\n\nTotal tokens: {}", context.project_root.display(), context.total_tokens))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_context_priority_ordering() {
        assert!(ContextPriority::Critical > ContextPriority::High);
        assert!(ContextPriority::High > ContextPriority::Medium);
        assert!(ContextPriority::Medium > ContextPriority::Low);
    }

    #[test]
    fn test_extract_lines() {
        let content = "line1\nline2\nline3\nline4\nline5";
        assert_eq!(extract_lines(content, 2, 4), "line2\nline3\nline4");
    }

    #[test]
    fn test_context_type() {
        let item = ContextItem {
            id: "test".to_string(),
            file_path: PathBuf::from("/test.ts"),
            context_type: ContextType::CurrentFile,
            priority: ContextPriority::Critical,
            relevance: 1.0,
            content: "test content".to_string(),
            tokens: 10,
            start_line: 1,
            end_line: 5,
            symbol_name: None,
            metadata: HashMap::new(),
        };

        assert_eq!(item.priority, ContextPriority::Critical);
    }
}
