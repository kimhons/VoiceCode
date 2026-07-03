#![allow(dead_code, unused_variables, unused_imports)]
// File System Agent - Safe file operations with undo capability
// Provides sandboxed file management with rollback support

use std::path::{Path, PathBuf};
use std::io::{Read, Write};
use serde::{Deserialize, Serialize};
use parking_lot::RwLock;
use chrono::{DateTime, Utc};

/// File operation types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FileOperation {
    Read { path: PathBuf },
    Write { path: PathBuf, content: Vec<u8> },
    Append { path: PathBuf, content: Vec<u8> },
    Create { path: PathBuf, content: Option<Vec<u8>> },
    Delete { path: PathBuf },
    Move { from: PathBuf, to: PathBuf },
    Copy { from: PathBuf, to: PathBuf },
    Rename { from: PathBuf, to: PathBuf },
    Mkdir { path: PathBuf, recursive: bool },
    Rmdir { path: PathBuf, recursive: bool },
    List { path: PathBuf, recursive: bool },
    Search { pattern: String, root: PathBuf },
    Exists { path: PathBuf },
    Metadata { path: PathBuf },
}

/// File operation result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileResult {
    pub success: bool,
    pub operation: FileOperation,
    pub data: Option<FileData>,
    pub error: Option<String>,
    pub timestamp: DateTime<Utc>,
}

/// Data returned from file operations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FileData {
    Content(Vec<u8>),
    Text(String),
    Entries(Vec<FileEntry>),
    Metadata(FileMetadata),
    Boolean(bool),
    SearchResults(Vec<SearchMatch>),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileEntry {
    pub path: PathBuf,
    pub name: String,
    pub is_dir: bool,
    pub size: u64,
    pub modified: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileMetadata {
    pub path: PathBuf,
    pub size: u64,
    pub is_dir: bool,
    pub is_file: bool,
    pub is_symlink: bool,
    pub readonly: bool,
    pub created: Option<DateTime<Utc>>,
    pub modified: Option<DateTime<Utc>>,
    pub accessed: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchMatch {
    pub path: PathBuf,
    pub line_number: Option<u32>,
    pub line_content: Option<String>,
}

/// Undoable operation with backup
#[derive(Debug, Clone)]
pub struct UndoableOperation {
    pub operation: FileOperation,
    pub backup: Option<BackupData>,
    pub timestamp: DateTime<Utc>,
    pub description: String,
}

#[derive(Debug, Clone)]
pub struct BackupData {
    pub path: PathBuf,
    pub content: Vec<u8>,
    pub metadata: Option<FileMetadata>,
}

/// File agent configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileAgentConfig {
    pub sandbox_enabled: bool,
    pub allowed_paths: Vec<PathBuf>,
    pub denied_paths: Vec<PathBuf>,
    pub max_file_size: u64,
    pub backup_enabled: bool,
    pub max_undo_history: usize,
    pub confirm_destructive: bool,
}

impl Default for FileAgentConfig {
    fn default() -> Self {
        Self {
            sandbox_enabled: true,
            allowed_paths: vec![],
            denied_paths: vec![
                PathBuf::from("C:\\Windows"),
                PathBuf::from("C:\\Program Files"),
                PathBuf::from("/usr"),
                PathBuf::from("/bin"),
                PathBuf::from("/sbin"),
                PathBuf::from("/etc"),
            ],
            max_file_size: 100 * 1024 * 1024,  // 100 MB
            backup_enabled: true,
            max_undo_history: 50,
            confirm_destructive: true,
        }
    }
}

/// File System Agent
pub struct FileAgent {
    config: RwLock<FileAgentConfig>,
    undo_stack: RwLock<Vec<UndoableOperation>>,
    redo_stack: RwLock<Vec<UndoableOperation>>,
    operation_log: RwLock<Vec<FileResult>>,
    working_dir: RwLock<PathBuf>,
}

impl FileAgent {
    pub fn new(config: FileAgentConfig) -> Self {
        Self {
            config: RwLock::new(config),
            undo_stack: RwLock::new(Vec::new()),
            redo_stack: RwLock::new(Vec::new()),
            operation_log: RwLock::new(Vec::new()),
            working_dir: RwLock::new(std::env::current_dir().unwrap_or_default()),
        }
    }

    /// Execute a file operation
    pub async fn execute(&self, operation: FileOperation) -> Result<FileResult, String> {
        // Validate operation
        self.validate_operation(&operation)?;

        // Create backup if needed
        let backup = if self.config.read().backup_enabled {
            self.create_backup(&operation).await?
        } else {
            None
        };

        // Execute operation
        let result = self.do_execute(&operation).await;

        // Record for undo if successful and modifying
        if result.is_ok() && self.is_modifying_operation(&operation) {
            let mut undo_stack = self.undo_stack.write();
            
            // Limit undo history
            let max_history = self.config.read().max_undo_history;
            while undo_stack.len() >= max_history {
                undo_stack.remove(0);
            }

            undo_stack.push(UndoableOperation {
                operation: operation.clone(),
                backup,
                timestamp: Utc::now(),
                description: self.describe_operation(&operation),
            });

            // Clear redo stack on new operation
            self.redo_stack.write().clear();
        }

        // Log operation
        if let Ok(ref r) = result {
            self.operation_log.write().push(r.clone());
        }

        result
    }

    async fn do_execute(&self, operation: &FileOperation) -> Result<FileResult, String> {
        let result = match operation {
            FileOperation::Read { path } => self.read_file(path).await,
            FileOperation::Write { path, content } => self.write_file(path, content).await,
            FileOperation::Append { path, content } => self.append_file(path, content).await,
            FileOperation::Create { path, content } => self.create_file(path, content.as_deref()).await,
            FileOperation::Delete { path } => self.delete_file(path).await,
            FileOperation::Move { from, to } => self.move_file(from, to).await,
            FileOperation::Copy { from, to } => self.copy_file(from, to).await,
            FileOperation::Rename { from, to } => self.rename_file(from, to).await,
            FileOperation::Mkdir { path, recursive } => self.create_dir(path, *recursive).await,
            FileOperation::Rmdir { path, recursive } => self.remove_dir(path, *recursive).await,
            FileOperation::List { path, recursive } => self.list_dir(path, *recursive).await,
            FileOperation::Search { pattern, root } => self.search_files(pattern, root).await,
            FileOperation::Exists { path } => self.check_exists(path).await,
            FileOperation::Metadata { path } => self.get_metadata(path).await,
        };

        let (data, error) = match result {
            Ok(d) => (Some(d), None),
            Err(e) => (None, Some(e)),
        };
        
        Ok(FileResult {
            success: data.is_some(),
            operation: operation.clone(),
            data,
            error,
            timestamp: Utc::now(),
        })
    }

    async fn read_file(&self, path: &Path) -> Result<FileData, String> {
        let content = tokio::fs::read(path).await
            .map_err(|e| format!("Read error: {}", e))?;
        
        // Try to convert to string if UTF-8
        if let Ok(text) = String::from_utf8(content.clone()) {
            Ok(FileData::Text(text))
        } else {
            Ok(FileData::Content(content))
        }
    }

    async fn write_file(&self, path: &Path, content: &[u8]) -> Result<FileData, String> {
        // Check file size
        if content.len() as u64 > self.config.read().max_file_size {
            return Err("File size exceeds limit".to_string());
        }

        tokio::fs::write(path, content).await
            .map_err(|e| format!("Write error: {}", e))?;
        
        Ok(FileData::Boolean(true))
    }

    async fn append_file(&self, path: &Path, content: &[u8]) -> Result<FileData, String> {
        use tokio::io::AsyncWriteExt;
        
        let mut file = tokio::fs::OpenOptions::new()
            .append(true)
            .create(true)
            .open(path)
            .await
            .map_err(|e| format!("Open error: {}", e))?;
        
        file.write_all(content).await
            .map_err(|e| format!("Write error: {}", e))?;
        
        Ok(FileData::Boolean(true))
    }

    async fn create_file(&self, path: &Path, content: Option<&[u8]>) -> Result<FileData, String> {
        if path.exists() {
            return Err("File already exists".to_string());
        }

        let content = content.unwrap_or(&[]);
        tokio::fs::write(path, content).await
            .map_err(|e| format!("Create error: {}", e))?;
        
        Ok(FileData::Boolean(true))
    }

    async fn delete_file(&self, path: &Path) -> Result<FileData, String> {
        tokio::fs::remove_file(path).await
            .map_err(|e| format!("Delete error: {}", e))?;
        
        Ok(FileData::Boolean(true))
    }

    async fn move_file(&self, from: &Path, to: &Path) -> Result<FileData, String> {
        tokio::fs::rename(from, to).await
            .map_err(|e| format!("Move error: {}", e))?;
        
        Ok(FileData::Boolean(true))
    }

    async fn copy_file(&self, from: &Path, to: &Path) -> Result<FileData, String> {
        tokio::fs::copy(from, to).await
            .map_err(|e| format!("Copy error: {}", e))?;
        
        Ok(FileData::Boolean(true))
    }

    async fn rename_file(&self, from: &Path, to: &Path) -> Result<FileData, String> {
        self.move_file(from, to).await
    }

    async fn create_dir(&self, path: &Path, recursive: bool) -> Result<FileData, String> {
        if recursive {
            tokio::fs::create_dir_all(path).await
        } else {
            tokio::fs::create_dir(path).await
        }.map_err(|e| format!("Mkdir error: {}", e))?;
        
        Ok(FileData::Boolean(true))
    }

    async fn remove_dir(&self, path: &Path, recursive: bool) -> Result<FileData, String> {
        if recursive {
            tokio::fs::remove_dir_all(path).await
        } else {
            tokio::fs::remove_dir(path).await
        }.map_err(|e| format!("Rmdir error: {}", e))?;
        
        Ok(FileData::Boolean(true))
    }

    async fn list_dir(&self, path: &Path, recursive: bool) -> Result<FileData, String> {
        let mut entries = Vec::new();
        
        if recursive {
            self.list_recursive(path, &mut entries).await?;
        } else {
            let mut read_dir = tokio::fs::read_dir(path).await
                .map_err(|e| format!("Read dir error: {}", e))?;
            
            while let Some(entry) = read_dir.next_entry().await.map_err(|e| e.to_string())? {
                let metadata = entry.metadata().await.ok();
                entries.push(FileEntry {
                    path: entry.path(),
                    name: entry.file_name().to_string_lossy().to_string(),
                    is_dir: entry.file_type().await.map(|t| t.is_dir()).unwrap_or(false),
                    size: metadata.as_ref().map(|m| m.len()).unwrap_or(0),
                    modified: metadata.and_then(|m| m.modified().ok()).map(|t| DateTime::from(t)),
                });
            }
        }
        
        Ok(FileData::Entries(entries))
    }

    async fn list_recursive(&self, path: &Path, entries: &mut Vec<FileEntry>) -> Result<(), String> {
        let mut read_dir = tokio::fs::read_dir(path).await
            .map_err(|e| format!("Read dir error: {}", e))?;
        
        while let Some(entry) = read_dir.next_entry().await.map_err(|e| e.to_string())? {
            let metadata = entry.metadata().await.ok();
            let is_dir = entry.file_type().await.map(|t| t.is_dir()).unwrap_or(false);
            
            entries.push(FileEntry {
                path: entry.path(),
                name: entry.file_name().to_string_lossy().to_string(),
                is_dir,
                size: metadata.as_ref().map(|m| m.len()).unwrap_or(0),
                modified: metadata.and_then(|m| m.modified().ok()).map(|t| DateTime::from(t)),
            });
            
            if is_dir {
                Box::pin(self.list_recursive(&entry.path(), entries)).await?;
            }
        }
        
        Ok(())
    }

    async fn search_files(&self, pattern: &str, root: &Path) -> Result<FileData, String> {
        let mut matches = Vec::new();
        
        // Simple glob-like search
        self.search_recursive(root, pattern, &mut matches).await?;
        
        Ok(FileData::SearchResults(matches))
    }

    async fn search_recursive(&self, path: &Path, pattern: &str, matches: &mut Vec<SearchMatch>) -> Result<(), String> {
        let mut read_dir = tokio::fs::read_dir(path).await
            .map_err(|e| format!("Read dir error: {}", e))?;
        
        while let Some(entry) = read_dir.next_entry().await.map_err(|e| e.to_string())? {
            let entry_path = entry.path();
            let file_name = entry.file_name().to_string_lossy().to_string();
            
            // Check if name matches pattern
            if self.matches_pattern(&file_name, pattern) {
                matches.push(SearchMatch {
                    path: entry_path.clone(),
                    line_number: None,
                    line_content: None,
                });
            }
            
            // Recurse into directories
            if entry.file_type().await.map(|t| t.is_dir()).unwrap_or(false) {
                Box::pin(self.search_recursive(&entry_path, pattern, matches)).await?;
            }
        }
        
        Ok(())
    }

    fn matches_pattern(&self, name: &str, pattern: &str) -> bool {
        // Simple wildcard matching
        if pattern == "*" {
            return true;
        }
        
        if pattern.starts_with('*') && pattern.ends_with('*') {
            let inner = &pattern[1..pattern.len()-1];
            return name.contains(inner);
        }
        
        if pattern.starts_with('*') {
            let suffix = &pattern[1..];
            return name.ends_with(suffix);
        }
        
        if pattern.ends_with('*') {
            let prefix = &pattern[..pattern.len()-1];
            return name.starts_with(prefix);
        }
        
        name == pattern
    }

    async fn check_exists(&self, path: &Path) -> Result<FileData, String> {
        Ok(FileData::Boolean(path.exists()))
    }

    async fn get_metadata(&self, path: &Path) -> Result<FileData, String> {
        let meta = tokio::fs::metadata(path).await
            .map_err(|e| format!("Metadata error: {}", e))?;
        
        Ok(FileData::Metadata(FileMetadata {
            path: path.to_path_buf(),
            size: meta.len(),
            is_dir: meta.is_dir(),
            is_file: meta.is_file(),
            is_symlink: meta.file_type().is_symlink(),
            readonly: meta.permissions().readonly(),
            created: meta.created().ok().map(|t| DateTime::from(t)),
            modified: meta.modified().ok().map(|t| DateTime::from(t)),
            accessed: meta.accessed().ok().map(|t| DateTime::from(t)),
        }))
    }

    async fn create_backup(&self, operation: &FileOperation) -> Result<Option<BackupData>, String> {
        let path = match operation {
            FileOperation::Write { path, .. } |
            FileOperation::Append { path, .. } |
            FileOperation::Delete { path } |
            FileOperation::Move { from: path, .. } |
            FileOperation::Rename { from: path, .. } => path,
            _ => return Ok(None),
        };

        if !path.exists() {
            return Ok(None);
        }

        let content = tokio::fs::read(path).await
            .map_err(|e| format!("Backup read error: {}", e))?;

        Ok(Some(BackupData {
            path: path.clone(),
            content,
            metadata: None,
        }))
    }

    /// Undo the last operation
    pub async fn undo(&self) -> Result<FileResult, String> {
        let undoable = self.undo_stack.write().pop()
            .ok_or("Nothing to undo")?;

        // Restore from backup
        if let Some(ref backup) = undoable.backup {
            tokio::fs::write(&backup.path, &backup.content).await
                .map_err(|e| format!("Undo restore error: {}", e))?;
        }

        // Push to redo stack
        self.redo_stack.write().push(undoable.clone());

        Ok(FileResult {
            success: true,
            operation: undoable.operation,
            data: None,
            error: None,
            timestamp: Utc::now(),
        })
    }

    /// Redo the last undone operation
    pub async fn redo(&self) -> Result<FileResult, String> {
        let redoable = self.redo_stack.write().pop()
            .ok_or("Nothing to redo")?;

        let result = self.do_execute(&redoable.operation).await?;
        
        self.undo_stack.write().push(redoable);

        Ok(result)
    }

    fn validate_operation(&self, operation: &FileOperation) -> Result<(), String> {
        let config = self.config.read();
        
        if !config.sandbox_enabled {
            return Ok(());
        }

        let paths = self.get_operation_paths(operation);
        
        for path in paths {
            // Check denied paths
            for denied in &config.denied_paths {
                if path.starts_with(denied) {
                    return Err(format!("Access denied: {:?}", path));
                }
            }

            // Check allowed paths if specified
            if !config.allowed_paths.is_empty() {
                let in_allowed = config.allowed_paths.iter().any(|allowed| {
                    path.starts_with(allowed)
                });
                if !in_allowed {
                    return Err(format!("Path not in allowed list: {:?}", path));
                }
            }
        }

        Ok(())
    }

    fn get_operation_paths<'a>(&self, operation: &'a FileOperation) -> Vec<&'a PathBuf> {
        match operation {
            FileOperation::Read { path } |
            FileOperation::Write { path, .. } |
            FileOperation::Append { path, .. } |
            FileOperation::Create { path, .. } |
            FileOperation::Delete { path } |
            FileOperation::Mkdir { path, .. } |
            FileOperation::Rmdir { path, .. } |
            FileOperation::List { path, .. } |
            FileOperation::Exists { path } |
            FileOperation::Metadata { path } => vec![path],
            
            FileOperation::Move { from, to } |
            FileOperation::Copy { from, to } |
            FileOperation::Rename { from, to } => vec![from, to],
            
            FileOperation::Search { root, .. } => vec![root],
        }
    }

    fn is_modifying_operation(&self, operation: &FileOperation) -> bool {
        matches!(
            operation,
            FileOperation::Write { .. } |
            FileOperation::Append { .. } |
            FileOperation::Create { .. } |
            FileOperation::Delete { .. } |
            FileOperation::Move { .. } |
            FileOperation::Rename { .. } |
            FileOperation::Mkdir { .. } |
            FileOperation::Rmdir { .. }
        )
    }

    fn describe_operation(&self, operation: &FileOperation) -> String {
        match operation {
            FileOperation::Read { path } => format!("Read {:?}", path),
            FileOperation::Write { path, .. } => format!("Write to {:?}", path),
            FileOperation::Append { path, .. } => format!("Append to {:?}", path),
            FileOperation::Create { path, .. } => format!("Create {:?}", path),
            FileOperation::Delete { path } => format!("Delete {:?}", path),
            FileOperation::Move { from, to } => format!("Move {:?} to {:?}", from, to),
            FileOperation::Copy { from, to } => format!("Copy {:?} to {:?}", from, to),
            FileOperation::Rename { from, to } => format!("Rename {:?} to {:?}", from, to),
            FileOperation::Mkdir { path, .. } => format!("Create directory {:?}", path),
            FileOperation::Rmdir { path, .. } => format!("Remove directory {:?}", path),
            FileOperation::List { path, .. } => format!("List {:?}", path),
            FileOperation::Search { pattern, root } => format!("Search '{}' in {:?}", pattern, root),
            FileOperation::Exists { path } => format!("Check exists {:?}", path),
            FileOperation::Metadata { path } => format!("Get metadata {:?}", path),
        }
    }

    pub fn set_working_dir(&self, path: PathBuf) {
        *self.working_dir.write() = path;
    }

    pub fn get_working_dir(&self) -> PathBuf {
        self.working_dir.read().clone()
    }

    pub fn can_undo(&self) -> bool {
        !self.undo_stack.read().is_empty()
    }

    pub fn can_redo(&self) -> bool {
        !self.redo_stack.read().is_empty()
    }

    pub fn get_undo_description(&self) -> Option<String> {
        self.undo_stack.read().last().map(|u| u.description.clone())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_file_agent_config() {
        let config = FileAgentConfig::default();
        assert!(config.sandbox_enabled);
        assert!(config.backup_enabled);
    }

    #[test]
    fn test_pattern_matching() {
        let agent = FileAgent::new(FileAgentConfig::default());
        
        assert!(agent.matches_pattern("test.rs", "*.rs"));
        assert!(agent.matches_pattern("test.rs", "test*"));
        assert!(agent.matches_pattern("test.rs", "*test*"));
        assert!(!agent.matches_pattern("test.rs", "*.js"));
    }
}
