// Phase 1.3: Project Indexer with File Watching
// Provides full project indexing with incremental updates

use std::collections::HashSet;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::{Duration, Instant};
use serde::{Deserialize, Serialize};
use tokio::sync::{mpsc, RwLock, broadcast};
use dashmap::DashMap;
use ignore::WalkBuilder;

use super::ast_engine::{ASTEngine, CodeStructure, Language};
use super::symbol_table::SymbolTable;

/// Project type detection
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ProjectType {
    NodeJs,
    TypeScript,
    Python,
    Rust,
    Go,
    Java,
    CSharp,
    Ruby,
    PHP,
    Mixed,
    Unknown,
}

impl ProjectType {
    /// Detect project type from root directory
    pub fn detect(root: &Path) -> Self {
        if root.join("Cargo.toml").exists() {
            return ProjectType::Rust;
        }
        if root.join("go.mod").exists() {
            return ProjectType::Go;
        }
        if root.join("pyproject.toml").exists() || root.join("setup.py").exists() {
            return ProjectType::Python;
        }
        if root.join("pom.xml").exists() || root.join("build.gradle").exists() {
            return ProjectType::Java;
        }
        if root.join("tsconfig.json").exists() {
            return ProjectType::TypeScript;
        }
        if root.join("package.json").exists() {
            return ProjectType::NodeJs;
        }
        if root.join("Gemfile").exists() {
            return ProjectType::Ruby;
        }
        if root.join("composer.json").exists() {
            return ProjectType::PHP;
        }
        if root.join("*.csproj").exists() || root.join("*.sln").exists() {
            return ProjectType::CSharp;
        }

        ProjectType::Unknown
    }

    /// Get primary language for project type
    pub fn primary_language(&self) -> Language {
        match self {
            ProjectType::NodeJs => Language::JavaScript,
            ProjectType::TypeScript => Language::TypeScript,
            ProjectType::Python => Language::Python,
            ProjectType::Rust => Language::Rust,
            ProjectType::Go => Language::Go,
            ProjectType::Java => Language::Java,
            ProjectType::CSharp => Language::CSharp,
            ProjectType::Ruby => Language::Ruby,
            ProjectType::PHP => Language::PHP,
            _ => Language::Unknown,
        }
    }
}

/// Indexing status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum IndexStatus {
    Idle,
    Indexing,
    Updating,
    Error,
}

/// Index statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IndexStats {
    pub total_files: usize,
    pub indexed_files: usize,
    pub failed_files: usize,
    pub total_symbols: usize,
    pub index_time_ms: u64,
    pub last_updated: Option<u64>,
}

/// Indexer events
#[derive(Debug, Clone)]
pub enum IndexerEvent {
    /// Started indexing
    IndexingStarted { total_files: usize },
    /// Progress update
    Progress { indexed: usize, total: usize, current_file: PathBuf },
    /// File indexed
    FileIndexed { path: PathBuf, symbols: usize },
    /// File failed
    FileFailed { path: PathBuf, error: String },
    /// Indexing completed
    IndexingCompleted { stats: IndexStats },
    /// File changed
    FileChanged { path: PathBuf },
    /// File created
    FileCreated { path: PathBuf },
    /// File deleted
    FileDeleted { path: PathBuf },
    /// Error occurred
    Error { message: String },
}

/// Project index
#[derive(Debug)]
pub struct ProjectIndex {
    /// Project root
    pub root: PathBuf,
    /// Project type
    pub project_type: ProjectType,
    /// Indexed files with their last modified time
    pub files: DashMap<PathBuf, u64>,
    /// AST engine
    pub ast_engine: Arc<ASTEngine>,
    /// Symbol table
    pub symbol_table: Arc<SymbolTable>,
    /// Index status
    status: RwLock<IndexStatus>,
    /// Last index stats
    stats: RwLock<Option<IndexStats>>,
}

impl ProjectIndex {
    pub fn new(root: PathBuf) -> Self {
        let project_type = ProjectType::detect(&root);
        let symbol_table = Arc::new(SymbolTable::new());
        symbol_table.set_project_root(root.clone());

        Self {
            root,
            project_type,
            files: DashMap::new(),
            ast_engine: Arc::new(ASTEngine::new()),
            symbol_table,
            status: RwLock::new(IndexStatus::Idle),
            stats: RwLock::new(None),
        }
    }

    pub async fn status(&self) -> IndexStatus {
        *self.status.read().await
    }

    pub async fn stats(&self) -> Option<IndexStats> {
        self.stats.read().await.clone()
    }
}

/// Project indexer configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IndexerConfig {
    /// File extensions to index
    pub extensions: Vec<String>,
    /// Directories to exclude
    pub exclude_dirs: Vec<String>,
    /// Maximum file size in bytes
    pub max_file_size: usize,
    /// Enable file watching
    pub watch_enabled: bool,
    /// Debounce time for file changes in ms
    pub debounce_ms: u64,
    /// Number of parallel indexing threads
    pub parallel_threads: usize,
}

impl Default for IndexerConfig {
    fn default() -> Self {
        Self {
            extensions: vec![
                "ts".into(), "tsx".into(), "js".into(), "jsx".into(),
                "py".into(), "rs".into(), "go".into(),
                "java".into(), "cs".into(), "rb".into(), "php".into(),
                "html".into(), "css".into(), "scss".into(),
                "json".into(), "yaml".into(), "yml".into(), "toml".into(),
                "md".into(), "sql".into(), "sh".into(),
            ],
            exclude_dirs: vec![
                "node_modules".into(), "target".into(), "dist".into(),
                "build".into(), ".git".into(), "__pycache__".into(),
                ".next".into(), ".nuxt".into(), "vendor".into(),
                "venv".into(), ".venv".into(), "env".into(),
                ".idea".into(), ".vscode".into(), "coverage".into(),
            ],
            max_file_size: 1024 * 1024, // 1MB
            watch_enabled: true,
            debounce_ms: 100,
            parallel_threads: 4,
        }
    }
}

/// Project indexer
pub struct ProjectIndexer {
    /// Project index
    index: Arc<ProjectIndex>,
    /// Configuration
    config: IndexerConfig,
    /// Event broadcaster
    event_tx: broadcast::Sender<IndexerEvent>,
    /// File watcher shutdown signal
    watcher_shutdown: Option<mpsc::Sender<()>>,
    /// Pending file changes (for debouncing)
    pending_changes: Arc<DashMap<PathBuf, Instant>>,
}

impl ProjectIndexer {
    pub fn new(root: PathBuf, config: IndexerConfig) -> Self {
        let (event_tx, _) = broadcast::channel(1000);

        Self {
            index: Arc::new(ProjectIndex::new(root)),
            config,
            event_tx,
            watcher_shutdown: None,
            pending_changes: Arc::new(DashMap::new()),
        }
    }

    /// Get the project index
    pub fn index(&self) -> Arc<ProjectIndex> {
        self.index.clone()
    }

    /// Subscribe to indexer events
    pub fn subscribe(&self) -> broadcast::Receiver<IndexerEvent> {
        self.event_tx.subscribe()
    }

    /// Perform full project index
    pub async fn index_project(&self) -> Result<IndexStats, String> {
        let start = Instant::now();

        // Set status to indexing
        *self.index.status.write().await = IndexStatus::Indexing;

        // Collect files to index
        let files = self.collect_files().await?;
        let total_files = files.len();

        let _ = self.event_tx.send(IndexerEvent::IndexingStarted { total_files });

        let mut indexed_files = 0;
        let mut failed_files = 0;

        // Index files
        for (i, path) in files.iter().enumerate() {
            let _ = self.event_tx.send(IndexerEvent::Progress {
                indexed: i,
                total: total_files,
                current_file: path.clone(),
            });

            match self.index_file(path).await {
                Ok(symbols) => {
                    indexed_files += 1;
                    let _ = self.event_tx.send(IndexerEvent::FileIndexed {
                        path: path.clone(),
                        symbols,
                    });
                }
                Err(e) => {
                    failed_files += 1;
                    let _ = self.event_tx.send(IndexerEvent::FileFailed {
                        path: path.clone(),
                        error: e,
                    });
                }
            }
        }

        let stats = IndexStats {
            total_files,
            indexed_files,
            failed_files,
            total_symbols: self.index.symbol_table.symbol_count(),
            index_time_ms: start.elapsed().as_millis() as u64,
            last_updated: Some(
                std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs()
            ),
        };

        *self.index.stats.write().await = Some(stats.clone());
        *self.index.status.write().await = IndexStatus::Idle;

        let _ = self.event_tx.send(IndexerEvent::IndexingCompleted { stats: stats.clone() });

        Ok(stats)
    }

    /// Collect files to index
    async fn collect_files(&self) -> Result<Vec<PathBuf>, String> {
        let root = &self.index.root;
        let config = &self.config;
        let mut files = Vec::new();

        let walker = WalkBuilder::new(root)
            .hidden(false)
            .git_ignore(true)
            .git_global(true)
            .git_exclude(true)
            .build();

        for entry in walker {
            let entry = entry.map_err(|e| e.to_string())?;
            let path = entry.path();

            // Skip directories
            if path.is_dir() {
                continue;
            }

            // Check if in excluded directory
            let path_str = path.to_string_lossy();
            if config.exclude_dirs.iter().any(|d| path_str.contains(d)) {
                continue;
            }

            // Check extension
            if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                if config.extensions.contains(&ext.to_lowercase()) {
                    // Check file size
                    if let Ok(metadata) = std::fs::metadata(path) {
                        if metadata.len() as usize <= config.max_file_size {
                            files.push(path.to_path_buf());
                        }
                    }
                }
            }
        }

        Ok(files)
    }

    /// Index a single file
    pub async fn index_file(&self, path: &Path) -> Result<usize, String> {
        // Read file content
        let content = std::fs::read_to_string(path)
            .map_err(|e| format!("Failed to read file: {}", e))?;

        // Get file modified time
        let modified = std::fs::metadata(path)
            .map(|m| {
                m.modified()
                    .ok()
                    .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                    .map(|d| d.as_secs())
                    .unwrap_or(0)
            })
            .unwrap_or(0);

        // Parse and extract structure
        let structure = self.index.ast_engine.parse_structure(path, &content)?;

        // Count symbols before indexing
        let symbol_count = structure.functions.len()
            + structure.classes.len()
            + structure.types.len()
            + structure.variables.len();

        // Index into symbol table
        self.index.symbol_table.index_structure(&structure);

        // Store file entry
        self.index.files.insert(path.to_path_buf(), modified);

        Ok(symbol_count)
    }

    /// Reindex a file
    pub async fn reindex_file(&self, path: &Path) -> Result<usize, String> {
        // Set status
        *self.index.status.write().await = IndexStatus::Updating;

        // Remove old symbols
        self.index.symbol_table.remove_file_symbols(path);

        // Invalidate AST cache
        self.index.ast_engine.invalidate_file(path);

        // Reindex
        let result = self.index_file(path).await;

        // Reset status
        *self.index.status.write().await = IndexStatus::Idle;

        result
    }

    /// Remove a file from the index
    pub async fn remove_file(&self, path: &Path) {
        self.index.symbol_table.remove_file_symbols(path);
        self.index.ast_engine.invalidate_file(path);
        self.index.files.remove(path);
    }

    /// Handle file change
    pub async fn handle_file_change(&self, path: &Path) {
        // Check if file should be indexed
        if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
            if !self.config.extensions.contains(&ext.to_lowercase()) {
                return;
            }
        } else {
            return;
        }

        if path.exists() {
            match self.reindex_file(path).await {
                Ok(symbols) => {
                    let _ = self.event_tx.send(IndexerEvent::FileIndexed {
                        path: path.to_path_buf(),
                        symbols,
                    });
                }
                Err(e) => {
                    let _ = self.event_tx.send(IndexerEvent::FileFailed {
                        path: path.to_path_buf(),
                        error: e,
                    });
                }
            }
        } else {
            self.remove_file(path).await;
            let _ = self.event_tx.send(IndexerEvent::FileDeleted {
                path: path.to_path_buf(),
            });
        }
    }

    /// Start file watcher (non-blocking)
    pub async fn start_watcher(&mut self) -> Result<(), String> {
        if !self.config.watch_enabled {
            return Ok(());
        }

        // Check if already running
        if self.watcher_shutdown.is_some() {
            return Ok(());
        }

        let (shutdown_tx, mut shutdown_rx) = mpsc::channel::<()>(1);
        self.watcher_shutdown = Some(shutdown_tx);

        let root = self.index.root.clone();
        let event_tx = self.event_tx.clone();
        let pending_changes = self.pending_changes.clone();
        let debounce_ms = self.config.debounce_ms;
        let index = self.index.clone();
        let extensions = self.config.extensions.clone();
        let exclude_dirs = self.config.exclude_dirs.clone();

        // Start watcher in background task
        tokio::spawn(async move {
            use notify::{Watcher, RecursiveMode, Event, EventKind};
            use std::sync::mpsc::channel;

            let (tx, rx) = channel::<notify::Result<Event>>();

            let mut watcher = match notify::recommended_watcher(tx) {
                Ok(w) => w,
                Err(e) => {
                    let _ = event_tx.send(IndexerEvent::Error {
                        message: format!("Failed to create watcher: {}", e),
                    });
                    return;
                }
            };

            if let Err(e) = watcher.watch(&root, RecursiveMode::Recursive) {
                let _ = event_tx.send(IndexerEvent::Error {
                    message: format!("Failed to watch directory: {}", e),
                });
                return;
            }

            loop {
                tokio::select! {
                    _ = shutdown_rx.recv() => {
                        break;
                    }
                    _ = tokio::time::sleep(Duration::from_millis(50)) => {
                        // Check for file events
                        while let Ok(event) = rx.try_recv() {
                            if let Ok(event) = event {
                                for path in event.paths {
                                    // Skip excluded directories
                                    let path_str = path.to_string_lossy();
                                    if exclude_dirs.iter().any(|d| path_str.contains(d)) {
                                        continue;
                                    }

                                    // Check extension
                                    if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                                        if !extensions.contains(&ext.to_lowercase()) {
                                            continue;
                                        }
                                    } else if path.is_file() {
                                        continue;
                                    }

                                    // Debounce
                                    pending_changes.insert(path.clone(), Instant::now());

                                    match event.kind {
                                        EventKind::Create(_) => {
                                            let _ = event_tx.send(IndexerEvent::FileCreated {
                                                path: path.clone(),
                                            });
                                        }
                                        EventKind::Modify(_) => {
                                            let _ = event_tx.send(IndexerEvent::FileChanged {
                                                path: path.clone(),
                                            });
                                        }
                                        EventKind::Remove(_) => {
                                            let _ = event_tx.send(IndexerEvent::FileDeleted {
                                                path: path.clone(),
                                            });
                                        }
                                        _ => {}
                                    }
                                }
                            }
                        }

                        // Process debounced changes
                        let debounce_duration = Duration::from_millis(debounce_ms);
                        let mut to_process = Vec::new();

                        pending_changes.retain(|path, instant| {
                            if instant.elapsed() >= debounce_duration {
                                to_process.push(path.clone());
                                false
                            } else {
                                true
                            }
                        });

                        for path in to_process {
                            // Reindex the file
                            if path.exists() {
                                if let Ok(content) = std::fs::read_to_string(&path) {
                                    if let Ok(structure) = index.ast_engine.parse_structure(&path, &content) {
                                        index.symbol_table.index_structure(&structure);
                                    }
                                }
                            } else {
                                index.symbol_table.remove_file_symbols(&path);
                                index.ast_engine.invalidate_file(&path);
                                index.files.remove(&path);
                            }
                        }
                    }
                }
            }
        });

        Ok(())
    }

    /// Stop file watcher
    pub async fn stop_watcher(&mut self) {
        if let Some(tx) = self.watcher_shutdown.take() {
            let _ = tx.send(()).await;
        }
    }

    /// Get project root
    pub fn root(&self) -> &Path {
        &self.index.root
    }

    /// Get project type
    pub fn project_type(&self) -> ProjectType {
        self.index.project_type
    }

    /// Get symbol table
    pub fn symbol_table(&self) -> Arc<SymbolTable> {
        self.index.symbol_table.clone()
    }

    /// Get AST engine
    pub fn ast_engine(&self) -> Arc<ASTEngine> {
        self.index.ast_engine.clone()
    }

    /// Search for symbols
    pub fn search_symbols(&self, query: &str, limit: usize) -> Vec<super::symbol_table::Symbol> {
        self.index.symbol_table.search(query, limit)
    }

    /// Find definition
    pub fn find_definition(&self, file: &Path, name: &str) -> Option<super::symbol_table::Symbol> {
        self.index.symbol_table.find_definition(file, name)
    }

    /// Get file count
    pub fn file_count(&self) -> usize {
        self.index.files.len()
    }

    /// Get symbol count
    pub fn symbol_count(&self) -> usize {
        self.index.symbol_table.symbol_count()
    }

    /// Check if a file is indexed
    pub fn is_file_indexed(&self, path: &Path) -> bool {
        self.index.files.contains_key(path)
    }
}

// Tauri commands for the indexer

use once_cell::sync::Lazy;
use parking_lot::Mutex;

/// Global indexer instance
static INDEXER: Lazy<Mutex<Option<Arc<ProjectIndexer>>>> = Lazy::new(|| Mutex::new(None));

/// Initialize the project indexer
#[tauri::command]
pub async fn init_project_indexer(root_path: String) -> Result<IndexStats, String> {
    let root = PathBuf::from(root_path);

    if !root.exists() {
        return Err("Project root does not exist".to_string());
    }

    let config = IndexerConfig::default();
    let indexer = ProjectIndexer::new(root, config);

    // Perform initial index
    let stats = indexer.index_project().await?;

    // Store indexer
    let indexer = Arc::new(indexer);
    *INDEXER.lock() = Some(indexer);

    Ok(stats)
}

/// Get index status
#[tauri::command]
pub async fn get_index_status() -> Result<IndexStatus, String> {
    let guard = INDEXER.lock();
    if let Some(ref indexer) = *guard {
        Ok(indexer.index().status().await)
    } else {
        Err("Indexer not initialized".to_string())
    }
}

/// Get index stats
#[tauri::command]
pub async fn get_index_stats() -> Result<Option<IndexStats>, String> {
    let guard = INDEXER.lock();
    if let Some(ref indexer) = *guard {
        Ok(indexer.index().stats().await)
    } else {
        Err("Indexer not initialized".to_string())
    }
}

/// Search symbols
#[tauri::command]
pub async fn search_project_symbols(query: String, limit: Option<usize>) -> Result<Vec<super::symbol_table::Symbol>, String> {
    let guard = INDEXER.lock();
    if let Some(ref indexer) = *guard {
        Ok(indexer.search_symbols(&query, limit.unwrap_or(20)))
    } else {
        Err("Indexer not initialized".to_string())
    }
}

/// Find symbol definition
#[tauri::command]
pub async fn find_symbol_definition(file_path: String, symbol_name: String) -> Result<Option<super::symbol_table::Symbol>, String> {
    let guard = INDEXER.lock();
    if let Some(ref indexer) = *guard {
        Ok(indexer.find_definition(Path::new(&file_path), &symbol_name))
    } else {
        Err("Indexer not initialized".to_string())
    }
}

/// Reindex a file
#[tauri::command]
pub async fn reindex_file(file_path: String) -> Result<usize, String> {
    let guard = INDEXER.lock();
    if let Some(ref indexer) = *guard {
        // Note: This is a simplified version. In production, we'd need
        // proper async handling
        Err("Reindex requires async context - use file watcher".to_string())
    } else {
        Err("Indexer not initialized".to_string())
    }
}

/// Get project type
#[tauri::command]
pub async fn get_project_type() -> Result<ProjectType, String> {
    let guard = INDEXER.lock();
    if let Some(ref indexer) = *guard {
        Ok(indexer.project_type())
    } else {
        Err("Indexer not initialized".to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;
    use std::fs;

    #[tokio::test]
    async fn test_project_indexer() {
        let dir = tempdir().unwrap();
        let root = dir.path();

        // Create test files
        fs::write(root.join("test.ts"), r#"
export function hello(): string {
    return "Hello!";
}
"#).unwrap();

        fs::write(root.join("test.py"), r#"
def greet(name: str) -> str:
    return f"Hello, {name}!"
"#).unwrap();

        // Create package.json for project type detection
        fs::write(root.join("package.json"), "{}").unwrap();

        let config = IndexerConfig::default();
        let indexer = ProjectIndexer::new(root.to_path_buf(), config);

        let stats = indexer.index_project().await.unwrap();

        assert!(stats.indexed_files > 0);
        assert!(stats.total_symbols > 0);

        // Search for symbols
        let results = indexer.search_symbols("hello", 10);
        assert!(!results.is_empty());
    }

    #[test]
    fn test_project_type_detection() {
        let dir = tempdir().unwrap();
        let root = dir.path();

        // Test TypeScript project
        fs::write(root.join("tsconfig.json"), "{}").unwrap();
        assert_eq!(ProjectType::detect(root), ProjectType::TypeScript);

        fs::remove_file(root.join("tsconfig.json")).unwrap();

        // Test Rust project
        fs::write(root.join("Cargo.toml"), "").unwrap();
        assert_eq!(ProjectType::detect(root), ProjectType::Rust);

        fs::remove_file(root.join("Cargo.toml")).unwrap();

        // Test Python project
        fs::write(root.join("pyproject.toml"), "").unwrap();
        assert_eq!(ProjectType::detect(root), ProjectType::Python);
    }
}
