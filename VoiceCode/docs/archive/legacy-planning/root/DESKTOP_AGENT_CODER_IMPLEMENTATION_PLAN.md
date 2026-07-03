# VoiceCode Desktop Agent Coder: Comprehensive Implementation Plan

## Executive Summary

This document provides a **complete, production-ready implementation tasklist** for building a world-class desktop coding agent with:
- **Robust Context Engine** (Cursor/Augment-level codebase understanding)
- **Large Codebase Intelligence** (AST parsing, semantic search, symbol resolution)
- **Adaptive Voice-Controlled Coding** (AquaVoice parity + agent capabilities)
- **Manus-level Agentic Abilities** (multi-step task execution, autonomous coding)

> **Note**: VS Code Extension is a **separate repository/project** and will be covered in integration points only.

---

## Current State Assessment

### What Exists (Implemented)

| Component | File | Quality | Gaps |
|-----------|------|---------|------|
| Coding Agent Core | `coding_agent.rs` | Good | Template-only generation, no real LLM |
| Context Processor | `context_processor.rs` | Solid | Placeholder analysis, needs real parsing |
| Screen Context | `screen_context.rs` | Good | Mock window detection, needs platform APIs |
| Natural Language Commands | `natural_language_commands.rs` | Excellent | Production-ready |
| Code Vocabulary | `code_vocabulary.rs` | Excellent | 800+ terms, comprehensive |
| Context Management (Web) | `contextManagement.service.ts` | Good | Token-aware, needs enhancement |

### Critical Missing Components

| Component | Priority | Impact |
|-----------|----------|--------|
| **AST-based Code Parsing** | Critical | No code understanding |
| **Semantic Code Index** | Critical | No intelligent search |
| **Symbol Resolution** | Critical | No cross-file references |
| **Embedding Search** | Critical | No semantic similarity |
| **Real LLM Integration** | Critical | Only templates, no AI generation |
| **Incremental Indexer** | High | No real-time updates |
| **Multi-file Context** | High | Single-file only |
| **Streaming Generation** | High | No progressive output |
| **IDE IPC Bridge** | High | No VS Code communication |
| **Git Context** | Medium | Basic only |

---

## Architecture Overview

```
                          VOICECODE DESKTOP AGENT CODER
+===========================================================================+
|                                                                           |
|  +---------------------------------------------------------------------+  |
|  |                    LAYER 1: CODE INTELLIGENCE                       |  |
|  |  +-------------+  +-------------+  +-------------+  +------------+  |  |
|  |  | TreeSitter  |  | Symbol      |  | Dependency  |  | Type       |  |  |
|  |  | AST Parser  |  | Index       |  | Graph       |  | Inference  |  |  |
|  |  +-------------+  +-------------+  +-------------+  +------------+  |  |
|  +---------------------------------------------------------------------+  |
|                                                                           |
|  +---------------------------------------------------------------------+  |
|  |                    LAYER 2: SEMANTIC SEARCH                         |  |
|  |  +-------------+  +-------------+  +-------------+  +------------+  |  |
|  |  | Embedding   |  | Vector DB   |  | Chunking    |  | Reranking  |  |  |
|  |  | (fastembed) |  | (lancedb)   |  | Strategy    |  | Pipeline   |  |  |
|  |  +-------------+  +-------------+  +-------------+  +------------+  |  |
|  +---------------------------------------------------------------------+  |
|                                                                           |
|  +---------------------------------------------------------------------+  |
|  |                    LAYER 3: CONTEXT AGGREGATION                     |  |
|  |  +-------------+  +-------------+  +-------------+  +------------+  |  |
|  |  | Multi-file  |  | Priority    |  | Token       |  | Project    |  |  |
|  |  | Context     |  | Scoring     |  | Budget      |  | Structure  |  |  |
|  |  +-------------+  +-------------+  +-------------+  +------------+  |  |
|  +---------------------------------------------------------------------+  |
|                                                                           |
|  +---------------------------------------------------------------------+  |
|  |                    LAYER 4: VOICE INTELLIGENCE                      |  |
|  |  +-------------+  +-------------+  +-------------+  +------------+  |  |
|  |  | STT Engine  |  | Intent      |  | Multi-turn  |  | Command    |  |  |
|  |  | (Deepgram)  |  | Classifier  |  | Memory      |  | Executor   |  |  |
|  |  +-------------+  +-------------+  +-------------+  +------------+  |  |
|  +---------------------------------------------------------------------+  |
|                                                                           |
|  +---------------------------------------------------------------------+  |
|  |                    LAYER 5: AGENT EXECUTION                         |  |
|  |  +-------------+  +-------------+  +-------------+  +------------+  |  |
|  |  | Task        |  | Step        |  | Rollback    |  | Terminal   |  |  |
|  |  | Planner     |  | Executor    |  | Manager     |  | Sandbox    |  |  |
|  |  +-------------+  +-------------+  +-------------+  +------------+  |  |
|  +---------------------------------------------------------------------+  |
|                                                                           |
|  +---------------------------------------------------------------------+  |
|  |                    LAYER 6: EXTERNAL INTEGRATION                    |  |
|  |  +-------------+  +-------------+  +-------------+  +------------+  |  |
|  |  | IPC Server  |  | LSP Client  |  | Git Client  |  | AIML API   |  |  |
|  |  | (for IDE)   |  | (optional)  |  |             |  | Gateway    |  |  |
|  |  +-------------+  +-------------+  +-------------+  +------------+  |  |
|  +---------------------------------------------------------------------+  |
|                                                                           |
+===========================================================================+
```

---

## Phase 1: Core Code Intelligence Engine

**Duration**: 3-4 weeks
**Priority**: CRITICAL
**Goal**: Build AST-based code understanding with cross-file symbol resolution

### 1.1 TreeSitter AST Parser Integration

**Location**: `apps/desktop/src-tauri/src/code_intelligence/ast_engine.rs`

#### Tasks

- [ ] **1.1.1** Add TreeSitter dependencies to `Cargo.toml`
  ```toml
  tree-sitter = "0.22"
  tree-sitter-typescript = "0.21"
  tree-sitter-javascript = "0.21"
  tree-sitter-python = "0.21"
  tree-sitter-rust = "0.21"
  tree-sitter-go = "0.21"
  tree-sitter-java = "0.21"
  tree-sitter-c = "0.21"
  tree-sitter-cpp = "0.22"
  ```

- [ ] **1.1.2** Create `ASTEngine` struct with language registry
  - Lazy-load parsers per language
  - Support 10+ languages (TS, JS, Python, Rust, Go, Java, C, C++, Ruby, PHP)
  - Implement language detection from file extension

- [ ] **1.1.3** Implement `parse_file()` function
  - Parse source code to TreeSitter AST
  - Extract all nodes with their ranges
  - Handle parse errors gracefully
  - Return structured `ParsedFile` with tree reference

- [ ] **1.1.4** Implement semantic extraction functions
  - `extract_functions()` - Get all function definitions with signatures
  - `extract_classes()` - Get all class/struct definitions
  - `extract_imports()` - Get all import/require statements
  - `extract_exports()` - Get all export statements
  - `extract_variables()` - Get top-level and important variables
  - `extract_types()` - Get type/interface definitions (TS, Rust, Go)

- [ ] **1.1.5** Create `CodeStructure` output type
  ```rust
  pub struct CodeStructure {
      pub file_path: PathBuf,
      pub language: Language,
      pub imports: Vec<ImportDeclaration>,
      pub exports: Vec<ExportDeclaration>,
      pub functions: Vec<FunctionDefinition>,
      pub classes: Vec<ClassDefinition>,
      pub types: Vec<TypeDefinition>,
      pub variables: Vec<VariableDeclaration>,
      pub comments: Vec<Comment>,
      pub complexity_score: u32,
      pub lines_of_code: u32,
  }
  ```

- [ ] **1.1.6** Implement function-level analysis
  - Extract parameters with types (where available)
  - Extract return types
  - Identify called functions (call graph)
  - Calculate cyclomatic complexity
  - Extract docstrings/comments

- [ ] **1.1.7** Add incremental parsing support
  - Cache parsed trees
  - Support `edit()` for incremental updates
  - Only re-parse changed portions

- [ ] **1.1.8** Create Tauri commands for AST operations
  - `parse_file_ast(path: String) -> CodeStructure`
  - `get_symbols_at_position(path: String, line: u32, col: u32) -> Vec<Symbol>`
  - `get_function_at_cursor(path: String, line: u32) -> Option<FunctionDefinition>`

#### Acceptance Criteria
- [ ] Can parse 10+ languages without errors
- [ ] Extracts functions, classes, imports accurately for TS/JS/Python/Rust
- [ ] Incremental parsing updates in <50ms
- [ ] Memory usage <100MB for 100 file parse cache

---

### 1.2 Symbol Table & Cross-File Resolution

**Location**: `apps/desktop/src-tauri/src/code_intelligence/symbol_table.rs`

#### Tasks

- [ ] **1.2.1** Create `Symbol` type hierarchy
  ```rust
  pub enum SymbolKind {
      Function, Class, Interface, Type, Variable, Constant,
      Enum, EnumMember, Module, Namespace, Method, Property,
  }

  pub struct Symbol {
      pub name: String,
      pub kind: SymbolKind,
      pub file_path: PathBuf,
      pub range: Range,
      pub signature: Option<String>,
      pub documentation: Option<String>,
      pub visibility: Visibility,
      pub parent: Option<Box<Symbol>>,
  }
  ```

- [ ] **1.2.2** Create `SymbolTable` for project-wide indexing
  - HashMap by qualified name → Symbol
  - HashMap by file → Vec<Symbol>
  - Support fuzzy name matching
  - Support scope-aware lookups

- [ ] **1.2.3** Implement import resolution
  - Resolve relative imports (`./foo`, `../bar`)
  - Resolve package imports (`react`, `lodash`)
  - Handle aliased imports (`import { foo as bar }`)
  - Handle wildcard imports (`import * as utils`)

- [ ] **1.2.4** Implement export resolution
  - Track named exports
  - Track default exports
  - Handle re-exports (`export { foo } from './bar'`)

- [ ] **1.2.5** Build dependency graph
  - File → Files it imports
  - File → Files that import it
  - Calculate import depth
  - Detect circular dependencies

- [ ] **1.2.6** Create `find_definition()` function
  - Given symbol name and location, find its definition
  - Cross-file resolution
  - Handle multiple definitions (overloads)

- [ ] **1.2.7** Create `find_references()` function
  - Find all usages of a symbol across project
  - Differentiate read vs write references
  - Return with context (surrounding lines)

- [ ] **1.2.8** Add Tauri commands
  - `find_symbol_definition(name: String, file: String, line: u32)`
  - `find_symbol_references(name: String)`
  - `get_file_symbols(path: String) -> Vec<Symbol>`
  - `search_symbols(query: String, limit: u32) -> Vec<Symbol>`

#### Acceptance Criteria
- [ ] Can resolve imports across TypeScript/JavaScript project
- [ ] Find definition works for 90%+ of symbols
- [ ] Symbol search returns results in <100ms
- [ ] Handles node_modules resolution correctly

---

### 1.3 Project Indexer with File Watching

**Location**: `apps/desktop/src-tauri/src/code_intelligence/project_indexer.rs`

#### Tasks

- [ ] **1.3.1** Create `ProjectIndex` struct
  ```rust
  pub struct ProjectIndex {
      pub root_path: PathBuf,
      pub project_type: ProjectType, // npm, cargo, pip, etc.
      pub files: HashMap<PathBuf, IndexedFile>,
      pub symbol_table: SymbolTable,
      pub dependency_graph: DependencyGraph,
      pub git_info: Option<GitInfo>,
      pub last_indexed: DateTime<Utc>,
  }
  ```

- [ ] **1.3.2** Implement project type detection
  - Detect from config files (package.json, Cargo.toml, pyproject.toml, etc.)
  - Infer primary language
  - Identify build system

- [ ] **1.3.3** Implement full project scan
  - Respect .gitignore patterns
  - Exclude common directories (node_modules, target, __pycache__, etc.)
  - Configurable include/exclude patterns
  - Progress reporting via events

- [ ] **1.3.4** Implement file watcher integration
  - Use `notify` crate for file system events
  - Debounce rapid changes (100ms)
  - Queue changed files for re-indexing
  - Emit events for index updates

- [ ] **1.3.5** Implement incremental re-indexing
  - Only re-parse changed files
  - Update symbol table incrementally
  - Recalculate affected dependency edges
  - Invalidate affected caches

- [ ] **1.3.6** Create index persistence
  - Serialize index to disk on shutdown
  - Load index on startup if valid
  - Validate index freshness against file mtimes
  - Partial load for faster startup

- [ ] **1.3.7** Add indexing status and progress
  - Track indexing state (idle, indexing, error)
  - Report progress percentage
  - Report indexed file count
  - Report errors per file

- [ ] **1.3.8** Add Tauri commands
  - `index_project(root_path: String) -> IndexStats`
  - `get_index_status() -> IndexStatus`
  - `reindex_file(path: String)`
  - `get_project_structure() -> ProjectStructure`

#### Acceptance Criteria
- [ ] Full index of 10,000 file project in <30 seconds
- [ ] Incremental update in <100ms per file
- [ ] File watcher triggers reindex within 500ms
- [ ] Index persists across app restarts

---

## Phase 2: Semantic Search Infrastructure

**Duration**: 2-3 weeks
**Priority**: CRITICAL
**Goal**: Enable embedding-based semantic code search

### 2.1 Code Chunking Strategy

**Location**: `apps/desktop/src-tauri/src/semantic_search/chunker.rs`

#### Tasks

- [ ] **2.1.1** Define chunk types
  ```rust
  pub enum ChunkType {
      Function,      // Individual function
      Class,         // Class with methods
      Module,        // Entire file/module
      Block,         // Logical block (if/for/match)
      Documentation, // Docstring or comment block
      Custom(usize), // Fixed line count
  }
  ```

- [ ] **2.1.2** Implement semantic chunking
  - Use AST boundaries for chunk splits
  - Keep functions intact (don't split mid-function)
  - Include function signature with body
  - Add surrounding context (imports used, class context)

- [ ] **2.1.3** Implement chunk metadata
  ```rust
  pub struct CodeChunk {
      pub id: Uuid,
      pub file_path: PathBuf,
      pub chunk_type: ChunkType,
      pub content: String,
      pub start_line: u32,
      pub end_line: u32,
      pub symbols: Vec<String>,    // Symbols defined in chunk
      pub references: Vec<String>, // Symbols referenced
      pub language: Language,
      pub token_count: u32,
  }
  ```

- [ ] **2.1.4** Implement overlap strategy
  - Add N lines of context before/after
  - Handle chunk boundaries at logical breaks
  - Configurable overlap percentage

- [ ] **2.1.5** Implement large file handling
  - Split very long functions if needed
  - Group related small functions
  - Handle generated/minified code detection

- [ ] **2.1.6** Add chunk deduplication
  - Hash chunk content
  - Skip unchanged chunks on re-index
  - Track chunk versions

#### Acceptance Criteria
- [ ] Chunks respect semantic boundaries (no mid-function splits)
- [ ] Average chunk size 50-500 lines
- [ ] Chunks include necessary context for understanding
- [ ] Re-chunking only processes changed files

---

### 2.2 Embedding Generation

**Location**: `apps/desktop/src-tauri/src/semantic_search/embedder.rs`

#### Tasks

- [ ] **2.2.1** Integrate embedding library
  - Option A: `fastembed-rs` (local, fast)
  - Option B: AIML API embeddings (cloud, higher quality)
  - Implement trait for swappable backends

- [ ] **2.2.2** Select embedding model
  - Primary: `BAAI/bge-small-en-v1.5` (384 dims, fast)
  - Alternative: `jina-embeddings-v2-base-code` (768 dims, code-optimized)
  - Support model switching

- [ ] **2.2.3** Implement batch embedding
  - Process chunks in batches (32-64)
  - Parallelize embedding generation
  - Handle rate limits (cloud)
  - Report progress

- [ ] **2.2.4** Implement caching
  - Cache embeddings by chunk hash
  - Skip re-embedding unchanged chunks
  - Persist cache to disk

- [ ] **2.2.5** Create embedding for different content types
  - Code embedding (function body)
  - Docstring embedding (documentation)
  - Signature embedding (function signature only)
  - Combined embedding (weighted average)

- [ ] **2.2.6** Add query embedding
  - Embed user queries
  - Support query expansion (synonyms, related terms)
  - Handle code vs natural language queries differently

#### Acceptance Criteria
- [ ] Embed 1000 chunks in <10 seconds (local)
- [ ] Cache hit rate >90% on re-index
- [ ] Embedding quality validated on code search benchmark
- [ ] Supports both local and cloud backends

---

### 2.3 Vector Database Integration

**Location**: `apps/desktop/src-tauri/src/semantic_search/vector_store.rs`

#### Tasks

- [ ] **2.3.1** Integrate vector database
  - Primary: `lancedb` (embedded, no server needed)
  - Alternative: `qdrant-client` (if external server preferred)
  - Implement trait for swappable backends

- [ ] **2.3.2** Create vector schema
  ```rust
  pub struct VectorRecord {
      pub id: String,
      pub embedding: Vec<f32>,
      pub file_path: String,
      pub chunk_type: String,
      pub start_line: u32,
      pub end_line: u32,
      pub content: String,
      pub symbols: Vec<String>,
      pub language: String,
  }
  ```

- [ ] **2.3.3** Implement CRUD operations
  - Insert chunks with embeddings
  - Update existing chunks
  - Delete by file path (for re-indexing)
  - Bulk operations

- [ ] **2.3.4** Implement similarity search
  - k-NN search with configurable k
  - Support cosine similarity
  - Filter by language, file path, chunk type
  - Return with relevance scores

- [ ] **2.3.5** Implement hybrid search
  - Combine vector similarity + keyword matching
  - Configurable weighting
  - Boost exact matches

- [ ] **2.3.6** Add metadata filtering
  - Filter by file path prefix
  - Filter by language
  - Filter by chunk type
  - Filter by symbol names

- [ ] **2.3.7** Implement persistence
  - Save database to project directory (`.voicecode/`)
  - Load on project open
  - Handle version migrations

#### Acceptance Criteria
- [ ] Search 100,000 vectors in <50ms
- [ ] Supports filtering without full scan
- [ ] Database size <500MB for 10,000 files
- [ ] Persists across sessions

---

### 2.4 Search Pipeline & Reranking

**Location**: `apps/desktop/src-tauri/src/semantic_search/search_pipeline.rs`

#### Tasks

- [ ] **2.4.1** Create search pipeline
  ```rust
  pub struct SearchPipeline {
      embedder: Box<dyn Embedder>,
      vector_store: Box<dyn VectorStore>,
      reranker: Option<Box<dyn Reranker>>,
      config: SearchConfig,
  }
  ```

- [ ] **2.4.2** Implement multi-stage retrieval
  - Stage 1: Fast vector search (top 100)
  - Stage 2: Rerank with cross-encoder (top 20)
  - Stage 3: Diversity sampling (top 10)

- [ ] **2.4.3** Implement query understanding
  - Detect query type (code vs explanation vs navigation)
  - Extract entities (function names, variable names)
  - Expand with synonyms

- [ ] **2.4.4** Implement reranking
  - Use cross-encoder for relevance scoring
  - Consider recency (recent files higher)
  - Consider edit distance for exact matches

- [ ] **2.4.5** Implement result deduplication
  - Remove near-duplicate chunks
  - Merge overlapping chunks
  - Group by file

- [ ] **2.4.6** Add search result type
  ```rust
  pub struct SearchResult {
      pub chunk: CodeChunk,
      pub score: f32,
      pub highlights: Vec<Highlight>,
      pub context_before: Option<String>,
      pub context_after: Option<String>,
  }
  ```

- [ ] **2.4.7** Add Tauri commands
  - `semantic_search(query: String, limit: u32) -> Vec<SearchResult>`
  - `search_by_symbol(symbol: String) -> Vec<SearchResult>`
  - `find_similar_code(code: String) -> Vec<SearchResult>`

#### Acceptance Criteria
- [ ] Relevant results in top 5 for 80%+ of queries
- [ ] End-to-end search latency <500ms
- [ ] Handles natural language and code queries
- [ ] Returns useful context with results

---

## Phase 3: Context Aggregation System

**Duration**: 2 weeks
**Priority**: HIGH
**Goal**: Build rich, multi-file context for LLM prompts

### 3.1 Context Builder

**Location**: `apps/desktop/src-tauri/src/context/context_builder.rs`

#### Tasks

- [ ] **3.1.1** Create `ContextBuilder` struct
  ```rust
  pub struct ContextBuilder {
      project_index: Arc<ProjectIndex>,
      search_pipeline: Arc<SearchPipeline>,
      token_counter: TokenCounter,
      config: ContextConfig,
  }
  ```

- [ ] **3.1.2** Define context components
  ```rust
  pub struct ContextComponents {
      pub active_file: FileContext,
      pub cursor_context: CursorContext,
      pub related_files: Vec<FileContext>,
      pub imported_symbols: Vec<SymbolContext>,
      pub search_results: Vec<SearchResult>,
      pub git_context: GitContext,
      pub project_context: ProjectContext,
  }
  ```

- [ ] **3.1.3** Implement active file context
  - Full file content (if small enough)
  - Truncated with cursor-centered window
  - Function/class at cursor
  - Imports relevant to cursor position

- [ ] **3.1.4** Implement cursor context
  - Current function/method
  - Parameters and local variables in scope
  - Type of expression at cursor
  - Available completions

- [ ] **3.1.5** Implement related file discovery
  - Files imported by current file
  - Files importing current file
  - Test files for current file
  - Files with similar names

- [ ] **3.1.6** Implement symbol context extraction
  - Get definitions for all used symbols
  - Include type definitions
  - Include relevant method signatures

- [ ] **3.1.7** Implement project context
  - Project type and structure
  - Key configuration files (package.json, etc.)
  - Available scripts/commands
  - Installed dependencies

#### Acceptance Criteria
- [ ] Builds complete context in <200ms
- [ ] Includes all relevant imports and types
- [ ] Respects token budget
- [ ] Handles missing files gracefully

---

### 3.2 Token Budget Manager

**Location**: `apps/desktop/src-tauri/src/context/token_budget.rs`

#### Tasks

- [ ] **3.2.1** Implement token counting
  - Use tiktoken-rs for accurate counts
  - Cache token counts by content hash
  - Support multiple tokenizers (GPT-4, Claude)

- [ ] **3.2.2** Define priority levels
  ```rust
  pub enum ContextPriority {
      Critical,  // System prompt, current function
      High,      // Direct imports, type definitions
      Medium,    // Related files, search results
      Low,       // Project context, git info
  }
  ```

- [ ] **3.2.3** Implement budget allocation
  - Allocate by priority level
  - Reserve space for response
  - Dynamic reallocation if under budget

- [ ] **3.2.4** Implement truncation strategies
  - Truncate from end (keep beginning)
  - Truncate from beginning (keep recent)
  - Truncate middle (keep start + end)
  - Smart truncation (keep important parts)

- [ ] **3.2.5** Implement content compression
  - Remove excessive whitespace
  - Collapse long comment blocks
  - Summarize repetitive code
  - Remove debug statements

- [ ] **3.2.6** Add budget reporting
  - Report allocation per component
  - Report truncation applied
  - Report compression ratio

#### Acceptance Criteria
- [ ] Token count accuracy within 5% of actual
- [ ] Never exceeds budget
- [ ] Truncation preserves most important content
- [ ] Compression saves 10-30% tokens

---

### 3.3 Context Serialization

**Location**: `apps/desktop/src-tauri/src/context/serializer.rs`

#### Tasks

- [ ] **3.3.1** Create context output format
  - XML-style tags for structure
  - Clear section markers
  - File path and line number annotations

- [ ] **3.3.2** Implement file content serialization
  ```
  <file path="src/auth/login.ts" language="typescript">
  // Line 1-50 of 200
  import { supabase } from '../lib/supabase';

  export async function login(email: string, password: string) {
    // ... function body
  }
  </file>
  ```

- [ ] **3.3.3** Implement symbol context serialization
  ```
  <definitions>
  // From src/types/auth.ts
  interface User {
    id: string;
    email: string;
  }
  </definitions>
  ```

- [ ] **3.3.4** Implement project context serialization
  ```
  <project>
  Type: Node.js/TypeScript
  Dependencies: react@18.2, supabase@2.0
  Scripts: build, test, lint
  </project>
  ```

- [ ] **3.3.5** Add configurable verbosity levels
  - Minimal: Just code, no annotations
  - Normal: Code with file paths
  - Verbose: Full context with metadata

#### Acceptance Criteria
- [ ] LLM can parse context structure
- [ ] File references are clickable/navigable
- [ ] Context is human-readable for debugging
- [ ] Supports multiple output formats

---

## Phase 4: Enhanced Voice Pipeline

**Duration**: 2-3 weeks
**Priority**: HIGH
**Goal**: Production-ready voice-controlled coding

### 4.1 Real LLM Integration

**Location**: `apps/desktop/src-tauri/src/llm/llm_client.rs`

#### Tasks

- [ ] **4.1.1** Create LLM client abstraction
  ```rust
  #[async_trait]
  pub trait LLMClient: Send + Sync {
      async fn generate(&self, request: GenerateRequest) -> Result<GenerateResponse>;
      async fn stream(&self, request: GenerateRequest) -> Result<impl Stream<Item = String>>;
  }
  ```

- [ ] **4.1.2** Implement AIML API client
  - Support all AIML models (GPT-5, Claude, Gemini)
  - Handle rate limits with backoff
  - Support streaming responses
  - Add request timeout handling

- [ ] **4.1.3** Implement request building
  - System prompt with context
  - User message with intent
  - Few-shot examples
  - Output format specification

- [ ] **4.1.4** Implement streaming response handling
  - Parse SSE events
  - Emit partial responses
  - Handle errors mid-stream
  - Support cancellation

- [ ] **4.1.5** Add response post-processing
  - Extract code blocks from response
  - Validate syntax before applying
  - Extract explanations
  - Parse structured outputs

- [ ] **4.1.6** Add model selection logic
  - Fast model for quick edits (GPT-4o-mini)
  - Powerful model for complex generation (Claude)
  - Specialized model for code (Claude-4.5-Sonnet)

#### Acceptance Criteria
- [ ] Streaming works with all AIML models
- [ ] Error handling is robust
- [ ] Response time <2s for first token
- [ ] Can switch models dynamically

---

### 4.2 Intent Classification Enhancement

**Location**: `apps/desktop/src-tauri/src/voice/intent_classifier.rs`

#### Tasks

- [ ] **4.2.1** Expand intent categories
  ```rust
  pub enum Intent {
      // Dictation
      Dictation { text: String },

      // Navigation
      GoToFile { file: String },
      GoToLine { line: u32 },
      GoToSymbol { symbol: String },

      // Code Generation
      GenerateFunction { description: String },
      GenerateClass { description: String },
      GenerateTest { target: String },

      // Code Editing
      Rename { from: String, to: String },
      Refactor { instruction: String },
      FixError { error: Option<String> },
      AddImport { module: String },

      // Explanation
      ExplainCode { target: Option<String> },
      ExplainError { error: String },

      // Execution
      RunCommand { command: String },
      RunTests { target: Option<String> },
      GitCommand { command: String },

      // Meta
      Undo,
      Redo,
      Cancel,
      Confirm,
      Help,
  }
  ```

- [ ] **4.2.2** Implement pattern-based classification
  - Regex patterns for common commands
  - High confidence for exact matches
  - Fast path for simple intents

- [ ] **4.2.3** Implement LLM-based classification
  - Use small model for ambiguous inputs
  - Extract parameters from natural language
  - Handle multi-part commands

- [ ] **4.2.4** Implement context-aware classification
  - Consider current file type
  - Consider cursor position
  - Consider recent commands

- [ ] **4.2.5** Add confidence thresholds
  - High confidence: Execute immediately
  - Medium confidence: Confirm with user
  - Low confidence: Ask for clarification

#### Acceptance Criteria
- [ ] 95%+ accuracy on common commands
- [ ] Handles natural variations
- [ ] Classification latency <100ms
- [ ] Graceful handling of ambiguity

---

### 4.3 Multi-turn Conversation Memory

**Location**: `apps/desktop/src-tauri/src/voice/conversation_memory.rs`

#### Tasks

- [ ] **4.3.1** Create conversation session
  ```rust
  pub struct ConversationSession {
      pub id: Uuid,
      pub started_at: DateTime<Utc>,
      pub messages: Vec<ConversationMessage>,
      pub context_snapshots: Vec<ContextSnapshot>,
      pub pending_actions: Vec<PendingAction>,
  }
  ```

- [ ] **4.3.2** Implement message history
  - Store user inputs (voice transcripts)
  - Store assistant responses
  - Store executed actions
  - Store errors/failures

- [ ] **4.3.3** Implement context snapshots
  - Save code state before changes
  - Track file modifications
  - Enable undo to specific point

- [ ] **4.3.4** Implement reference resolution
  - "that function" → last mentioned function
  - "this file" → current file
  - "the error" → last error message
  - Track entity mentions across turns

- [ ] **4.3.5** Implement session management
  - Auto-expire old sessions
  - Persist active sessions
  - Resume interrupted sessions

- [ ] **4.3.6** Add conversation summarization
  - Summarize old messages to save tokens
  - Keep key decisions and context
  - Compress action history

#### Acceptance Criteria
- [ ] Resolves references across 5+ turns
- [ ] Session persists across app restarts
- [ ] Memory usage bounded
- [ ] Undo works across conversation

---

### 4.4 Streaming Code Generation

**Location**: `apps/desktop/src-tauri/src/voice/code_generator.rs`

#### Tasks

- [ ] **4.4.1** Implement streaming generation
  - Stream tokens to frontend
  - Show progress indicator
  - Allow cancellation
  - Handle partial code gracefully

- [ ] **4.4.2** Implement preview mode
  - Show generated code in diff view
  - Highlight insertions/deletions
  - Allow editing before apply
  - Support partial accept

- [ ] **4.4.3** Implement syntax validation
  - Parse generated code with tree-sitter
  - Detect syntax errors
  - Attempt auto-fix for common issues
  - Report validation errors to user

- [ ] **4.4.4** Implement multi-file generation
  - Generate code for multiple files
  - Show all changes in preview
  - Apply atomically (all or nothing)
  - Create backup before applying

- [ ] **4.4.5** Add generation templates
  - Function templates per language
  - Test templates
  - Component templates (React, Vue)
  - API endpoint templates

- [ ] **4.4.6** Implement iterative refinement
  - "Make it shorter"
  - "Add error handling"
  - "Use async/await"
  - Track refinement history

#### Acceptance Criteria
- [ ] First token streams in <1s
- [ ] Preview shows accurate diff
- [ ] Syntax validation catches 95%+ errors
- [ ] Multi-file generation works atomically

---

## Phase 5: Agentic Capabilities (Manus-Level)

**Duration**: 3-4 weeks
**Priority**: MEDIUM-HIGH
**Goal**: Autonomous multi-step task execution

### 5.1 Task Planning Engine

**Location**: `apps/desktop/src-tauri/src/agent/task_planner.rs`

#### Tasks

- [ ] **5.1.1** Create task representation
  ```rust
  pub struct TaskPlan {
      pub id: Uuid,
      pub goal: String,
      pub steps: Vec<TaskStep>,
      pub dependencies: HashMap<usize, Vec<usize>>,
      pub estimated_duration: Duration,
      pub risk_level: RiskLevel,
  }

  pub struct TaskStep {
      pub id: usize,
      pub description: String,
      pub action: TaskAction,
      pub preconditions: Vec<Precondition>,
      pub expected_outcome: String,
      pub rollback: Option<RollbackAction>,
  }
  ```

- [ ] **5.1.2** Implement task decomposition
  - Break complex requests into steps
  - Identify dependencies between steps
  - Estimate effort per step
  - Identify risks

- [ ] **5.1.3** Implement task validation
  - Check preconditions are met
  - Validate file paths exist
  - Check for conflicting changes
  - Identify potential issues

- [ ] **5.1.4** Add plan presentation
  - Show plan to user before execution
  - Allow step modification
  - Allow step reordering
  - Allow step removal

- [ ] **5.1.5** Implement common task templates
  - "Add new API endpoint"
  - "Create CRUD operations"
  - "Set up authentication"
  - "Add testing to module"
  - "Refactor to new pattern"

#### Acceptance Criteria
- [ ] Decomposes complex tasks into 5-15 steps
- [ ] Dependencies are correctly identified
- [ ] Plans are executable without errors 80%+
- [ ] Users can modify plans before execution

---

### 5.2 Step Executor

**Location**: `apps/desktop/src-tauri/src/agent/step_executor.rs`

#### Tasks

- [ ] **5.2.1** Create executor framework
  ```rust
  pub struct StepExecutor {
      llm_client: Arc<dyn LLMClient>,
      context_builder: Arc<ContextBuilder>,
      file_system: Arc<dyn FileSystem>,
      terminal: Arc<TerminalExecutor>,
  }
  ```

- [ ] **5.2.2** Implement action types
  - `CreateFile { path, content }`
  - `ModifyFile { path, changes }`
  - `DeleteFile { path }`
  - `RunCommand { command }`
  - `GitOperation { operation }`
  - `WaitForUser { prompt }`

- [ ] **5.2.3** Implement execution loop
  - Execute steps in order
  - Respect dependencies
  - Handle step failures
  - Support pause/resume

- [ ] **5.2.4** Add progress reporting
  - Current step indicator
  - Step status (pending, running, success, failed)
  - Elapsed time
  - Estimated remaining

- [ ] **5.2.5** Implement confirmation checkpoints
  - Pause before risky steps
  - Show what will happen
  - Allow skip or modify
  - Allow abort

- [ ] **5.2.6** Add error recovery
  - Retry failed steps
  - Suggest alternatives
  - Rollback on critical failure
  - Save partial progress

#### Acceptance Criteria
- [ ] Executes multi-step tasks autonomously
- [ ] Reports progress in real-time
- [ ] Handles failures gracefully
- [ ] Respects user confirmation requirements

---

### 5.3 Rollback Manager

**Location**: `apps/desktop/src-tauri/src/agent/rollback_manager.rs`

#### Tasks

- [ ] **5.3.1** Create rollback point system
  ```rust
  pub struct RollbackPoint {
      pub id: Uuid,
      pub created_at: DateTime<Utc>,
      pub description: String,
      pub file_snapshots: HashMap<PathBuf, FileSnapshot>,
      pub git_state: Option<GitState>,
  }
  ```

- [ ] **5.3.2** Implement file snapshotting
  - Snapshot files before modification
  - Store diffs for efficiency
  - Compress snapshots
  - Prune old snapshots

- [ ] **5.3.3** Implement rollback execution
  - Restore files to snapshot state
  - Handle deleted files
  - Handle new files
  - Preserve unrelated changes

- [ ] **5.3.4** Implement partial rollback
  - Rollback specific files
  - Rollback specific steps
  - Preview rollback changes

- [ ] **5.3.5** Add git integration
  - Create rollback commits
  - Use git stash for safety
  - Support branch-based rollback

#### Acceptance Criteria
- [ ] Full rollback restores exact state
- [ ] Partial rollback works correctly
- [ ] Rollback is fast (<1s for typical task)
- [ ] Works with git repositories

---

### 5.4 Terminal Sandbox

**Location**: `apps/desktop/src-tauri/src/agent/terminal_sandbox.rs`

#### Tasks

- [ ] **5.4.1** Create sandboxed executor
  - Run commands in isolated environment
  - Capture stdout/stderr
  - Support timeout
  - Support cancellation

- [ ] **5.4.2** Implement command safety analysis
  ```rust
  pub enum SafetyLevel {
      Safe,       // Read-only, no side effects
      Low,        // Reversible side effects
      Medium,     // Significant but recoverable
      High,       // Potentially destructive
      Critical,   // Highly dangerous, requires confirmation
  }
  ```

- [ ] **5.4.3** Implement safety rules
  - Block dangerous patterns (rm -rf /, etc.)
  - Require confirmation for destructive ops
  - Whitelist known safe commands
  - Analyze command arguments

- [ ] **5.4.4** Implement output streaming
  - Stream stdout/stderr to UI
  - Support interactive commands (with timeout)
  - Handle large output

- [ ] **5.4.5** Add command suggestions
  - Suggest based on context
  - Remember frequently used commands
  - Auto-complete paths

#### Acceptance Criteria
- [ ] Blocks known dangerous commands
- [ ] Safety classification is accurate
- [ ] Output streams in real-time
- [ ] Supports project-specific commands

---

## Phase 6: IDE Integration (IPC Bridge)

**Duration**: 2 weeks
**Priority**: HIGH
**Goal**: Enable VS Code extension communication

> **Note**: VS Code Extension is a separate repository. This phase focuses on the desktop app's IPC server.

### 6.1 IPC Server

**Location**: `apps/desktop/src-tauri/src/ipc/server.rs`

#### Tasks

- [ ] **6.1.1** Create IPC server
  - WebSocket server on localhost
  - Authentication with tokens
  - Multiple client support
  - Heartbeat/keepalive

- [ ] **6.1.2** Define IPC protocol
  ```typescript
  interface IPCMessage {
      id: string;
      type: 'request' | 'response' | 'event';
      method: string;
      params?: any;
      result?: any;
      error?: { code: number; message: string };
  }
  ```

- [ ] **6.1.3** Implement context sync
  - Receive cursor position from IDE
  - Receive file content from IDE
  - Receive selection from IDE
  - Send context requests

- [ ] **6.1.4** Implement action dispatch
  - Send code insertions
  - Send file modifications
  - Send navigation commands
  - Send terminal commands

- [ ] **6.1.5** Add event subscriptions
  - Voice activation events
  - Transcription events
  - Generation progress events
  - Error events

- [ ] **6.1.6** Document IPC API
  - List all methods
  - Request/response schemas
  - Event schemas
  - Error codes

#### Acceptance Criteria
- [ ] VS Code extension can connect
- [ ] Bi-directional communication works
- [ ] Latency <50ms for local IPC
- [ ] Handles disconnection gracefully

---

### 6.2 IDE Protocol Definition

**Location**: `apps/desktop/src-tauri/src/ipc/protocol.rs`

#### Tasks

- [ ] **6.2.1** Define context sync methods
  ```
  ide/updateContext
  ide/getContext
  ide/syncFile
  ```

- [ ] **6.2.2** Define action methods
  ```
  ide/insertCode
  ide/replaceSelection
  ide/applyDiff
  ide/navigateToFile
  ide/navigateToSymbol
  ide/executeCommand
  ```

- [ ] **6.2.3** Define voice control methods
  ```
  voice/start
  voice/stop
  voice/status
  voice/configure
  ```

- [ ] **6.2.4** Define event types
  ```
  event/voiceActivated
  event/transcriptionStarted
  event/transcriptionComplete
  event/generationProgress
  event/generationComplete
  event/error
  ```

- [ ] **6.2.5** Create TypeScript SDK
  - Type definitions for all messages
  - Client class for extension use
  - Event emitter for subscriptions
  - Reconnection logic

#### Acceptance Criteria
- [ ] Protocol is well-documented
- [ ] TypeScript types are accurate
- [ ] SDK is easy to use
- [ ] Backwards compatible versioning

---

## Implementation Dependencies

```
Phase 1 (Code Intelligence)
    ├── 1.1 AST Parser
    │   └── 1.2 Symbol Table (depends on 1.1)
    │       └── 1.3 Project Indexer (depends on 1.2)
    │
Phase 2 (Semantic Search)
    ├── 2.1 Chunker (depends on 1.1)
    │   └── 2.2 Embedder
    │       └── 2.3 Vector Store
    │           └── 2.4 Search Pipeline (depends on 2.1, 2.2, 2.3)
    │
Phase 3 (Context Aggregation)
    ├── 3.1 Context Builder (depends on 1.3, 2.4)
    │   └── 3.2 Token Budget
    │       └── 3.3 Serializer
    │
Phase 4 (Voice Pipeline)
    ├── 4.1 LLM Client
    ├── 4.2 Intent Classifier (depends on existing code_vocabulary.rs)
    ├── 4.3 Conversation Memory
    └── 4.4 Code Generator (depends on 3.1, 4.1)

Phase 5 (Agent)
    ├── 5.1 Task Planner (depends on 3.1, 4.1)
    │   └── 5.2 Step Executor (depends on 5.1)
    │       └── 5.3 Rollback Manager
    └── 5.4 Terminal Sandbox

Phase 6 (IPC)
    └── 6.1 IPC Server
        └── 6.2 Protocol Definition
```

---

## Rust Crate Dependencies

Add to `apps/desktop/src-tauri/Cargo.toml`:

```toml
[dependencies]
# AST Parsing
tree-sitter = "0.22"
tree-sitter-typescript = "0.21"
tree-sitter-javascript = "0.21"
tree-sitter-python = "0.21"
tree-sitter-rust = "0.21"
tree-sitter-go = "0.21"

# Embeddings & Vector Search
fastembed = "3"
lancedb = "0.4"
arrow = "51"

# Token Counting
tiktoken-rs = "0.5"

# File Watching
notify = "6.1"
notify-debouncer-mini = "0.4"

# Async Runtime
tokio = { version = "1", features = ["full"] }
tokio-stream = "0.1"
async-trait = "0.1"

# IPC/WebSocket
tokio-tungstenite = "0.21"
futures-util = "0.3"

# Serialization
serde = { version = "1", features = ["derive"] }
serde_json = "1"

# Utilities
uuid = { version = "1", features = ["v4", "serde"] }
chrono = { version = "0.4", features = ["serde"] }
walkdir = "2"
ignore = "0.4"  # gitignore support
dashmap = "5"  # concurrent hashmap
parking_lot = "0.12"  # better mutexes
```

---

## VS Code Extension Integration Points

> **Note**: The VS Code extension is a separate repository/project. These are the integration points the desktop app exposes.

### Required Extension Capabilities

1. **Context Provider**
   - Send current file content
   - Send cursor position
   - Send selection
   - Send visible range
   - Send diagnostics (errors/warnings)

2. **Action Executor**
   - Insert code at position
   - Replace selection
   - Apply TextEdit array
   - Navigate to location
   - Execute VS Code commands

3. **Event Listener**
   - Listen for voice activation
   - Listen for transcription updates
   - Listen for generation progress
   - Listen for errors

### Extension Development Separate Tasks

- [ ] Create VS Code extension repository
- [ ] Implement WebSocket client
- [ ] Implement context provider
- [ ] Implement action executor
- [ ] Implement UI (status bar, quick pick, etc.)
- [ ] Publish to VS Code Marketplace

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Code Understanding** |  |  |
| Symbol resolution accuracy | >95% | Test suite |
| Cross-file reference accuracy | >90% | Test suite |
| Parse success rate | >99% | Error logs |
| **Semantic Search** |  |  |
| Relevant result in top 5 | >80% | User studies |
| Search latency | <500ms | Performance logs |
| Index build time (10k files) | <60s | Benchmarks |
| **Voice Pipeline** |  |  |
| Intent classification accuracy | >95% | Test suite |
| End-to-end latency | <2s | Performance logs |
| Command success rate | >85% | User studies |
| **Agent Execution** |  |  |
| Task completion rate | >80% | User studies |
| Rollback success rate | 100% | Test suite |
| Safety rule accuracy | 100% | Security audit |

---

## Timeline Summary

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Code Intelligence | 3-4 weeks | None |
| Phase 2: Semantic Search | 2-3 weeks | Phase 1.1 |
| Phase 3: Context Aggregation | 2 weeks | Phase 1, 2 |
| Phase 4: Voice Pipeline | 2-3 weeks | Phase 3 |
| Phase 5: Agent Capabilities | 3-4 weeks | Phase 3, 4 |
| Phase 6: IDE Integration | 2 weeks | Phase 4 |

**Total Estimated Duration**: 14-18 weeks (3.5-4.5 months)

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| TreeSitter language grammar issues | Use well-maintained grammars, fallback to basic parsing |
| Embedding quality issues | Support multiple embedding models, use reranking |
| LLM rate limits | Implement caching, request batching, fallback models |
| Large codebase performance | Incremental indexing, background processing, caching |
| IDE extension complexity | Start with minimal feature set, iterate |
| Security vulnerabilities | Sandboxing, confirmation dialogs, audit logging |

---

*Document Version: 1.0*
*Created: January 2026*
*Author: AI Code Assistant*
