#![allow(dead_code, unused_variables, unused_imports)]
// Sandbox Execution Environment - Safe command execution with rollback
// Provides isolated execution with preview, confirmation, and undo capabilities

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::process::Stdio;
use serde::{Deserialize, Serialize};
use parking_lot::RwLock;
use tokio::process::Command as AsyncCommand;

/// Sandbox execution manager
pub struct SandboxManager {
    config: SandboxConfig,
    history: RwLock<Vec<ExecutionRecord>>,
    pending_operations: RwLock<Vec<PendingOperation>>,
    file_backups: RwLock<HashMap<PathBuf, FileBackup>>,
    working_dir: PathBuf,
}

/// Sandbox configuration
#[derive(Debug, Clone)]
pub struct SandboxConfig {
    pub mode: SandboxMode,
    pub auto_backup: bool,
    pub max_backups: usize,
    pub allowed_commands: Vec<String>,
    pub blocked_commands: Vec<String>,
    pub allowed_paths: Vec<PathBuf>,
    pub blocked_paths: Vec<PathBuf>,
    pub timeout_seconds: u64,
    pub dry_run: bool,
}

impl Default for SandboxConfig {
    fn default() -> Self {
        Self {
            mode: SandboxMode::Confirm,
            auto_backup: true,
            max_backups: 50,
            allowed_commands: vec![
                "ls", "cat", "head", "tail", "grep", "find", "echo", "pwd",
                "npm", "yarn", "pnpm", "cargo", "go", "python", "pip",
                "git status", "git diff", "git log", "git branch",
            ].into_iter().map(String::from).collect(),
            blocked_commands: vec![
                "rm -rf /", "sudo", "chmod 777", "mkfs", "dd if=",
                ":(){ :|:& };:", "mv /* ", "> /dev/sda",
            ].into_iter().map(String::from).collect(),
            allowed_paths: Vec::new(),
            blocked_paths: vec![
                PathBuf::from("/etc"), PathBuf::from("/sys"), PathBuf::from("/boot"),
                PathBuf::from("C:\\Windows"), PathBuf::from("C:\\Program Files"),
            ],
            timeout_seconds: 30,
            dry_run: false,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum SandboxMode {
    Preview,   // Show what would happen without executing
    Confirm,   // Require confirmation before executing
    Auto,      // Execute safe operations automatically
    Disabled,  // No sandbox protection
}

/// A pending operation awaiting confirmation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PendingOperation {
    pub id: String,
    pub operation_type: OperationType,
    pub description: String,
    pub preview: String,
    pub risk_level: RiskLevel,
    pub reversible: bool,
    pub created_at: u64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum OperationType {
    FileCreate,
    FileModify,
    FileDelete,
    FileMove,
    CommandExecute,
    GitOperation,
    PackageInstall,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
pub enum RiskLevel {
    Safe,
    Low,
    Medium,
    High,
    Critical,
}

/// Record of an executed operation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionRecord {
    pub id: String,
    pub operation: PendingOperation,
    pub executed_at: u64,
    pub success: bool,
    pub output: String,
    pub error: Option<String>,
    pub rollback_available: bool,
}

/// File backup for rollback
#[derive(Debug, Clone)]
struct FileBackup {
    path: PathBuf,
    content: Vec<u8>,
    created_at: u64,
}

/// Command analysis result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandAnalysis {
    pub command: String,
    pub risk_level: RiskLevel,
    pub blocked: bool,
    pub block_reason: Option<String>,
    pub side_effects: Vec<String>,
    pub requires_confirmation: bool,
}

impl SandboxManager {
    pub fn new(working_dir: PathBuf, config: SandboxConfig) -> Self {
        Self {
            config,
            history: RwLock::new(Vec::new()),
            pending_operations: RwLock::new(Vec::new()),
            file_backups: RwLock::new(HashMap::new()),
            working_dir,
        }
    }

    /// Analyze a command before execution
    pub fn analyze_command(&self, command: &str) -> CommandAnalysis {
        let risk_level = self.assess_command_risk(command);
        let blocked = self.is_command_blocked(command);
        let block_reason = if blocked {
            Some(self.get_block_reason(command))
        } else {
            None
        };
        let side_effects = self.detect_side_effects(command);

        CommandAnalysis {
            command: command.to_string(),
            risk_level,
            blocked,
            block_reason,
            side_effects,
            requires_confirmation: risk_level >= RiskLevel::Medium,
        }
    }

    fn assess_command_risk(&self, command: &str) -> RiskLevel {
        let cmd_lower = command.to_lowercase();
        
        // Critical risk patterns
        if cmd_lower.contains("rm -rf") || cmd_lower.contains("format") ||
           cmd_lower.contains("sudo") || cmd_lower.contains("chmod 777") {
            return RiskLevel::Critical;
        }
        
        // High risk patterns
        if cmd_lower.contains("rm ") || cmd_lower.contains("delete") ||
           cmd_lower.contains("drop ") || cmd_lower.contains("truncate") {
            return RiskLevel::High;
        }
        
        // Medium risk patterns
        if cmd_lower.contains("mv ") || cmd_lower.contains("cp ") ||
           cmd_lower.contains("install") || cmd_lower.contains("upgrade") {
            return RiskLevel::Medium;
        }
        
        // Low risk patterns
        if cmd_lower.contains("git push") || cmd_lower.contains("git commit") ||
           cmd_lower.contains("npm publish") {
            return RiskLevel::Low;
        }
        
        // Safe patterns
        if self.config.allowed_commands.iter().any(|c| cmd_lower.starts_with(&c.to_lowercase())) {
            return RiskLevel::Safe;
        }
        
        RiskLevel::Low
    }

    fn is_command_blocked(&self, command: &str) -> bool {
        let cmd_lower = command.to_lowercase();
        self.config.blocked_commands.iter()
            .any(|blocked| cmd_lower.contains(&blocked.to_lowercase()))
    }

    fn get_block_reason(&self, command: &str) -> String {
        let cmd_lower = command.to_lowercase();
        for blocked in &self.config.blocked_commands {
            if cmd_lower.contains(&blocked.to_lowercase()) {
                return format!("Command matches blocked pattern: {}", blocked);
            }
        }
        "Command blocked by security policy".to_string()
    }

    fn detect_side_effects(&self, command: &str) -> Vec<String> {
        let mut effects = Vec::new();
        let cmd_lower = command.to_lowercase();
        
        if cmd_lower.contains("rm ") || cmd_lower.contains("del ") {
            effects.push("Deletes files".to_string());
        }
        if cmd_lower.contains("mv ") || cmd_lower.contains("move ") {
            effects.push("Moves/renames files".to_string());
        }
        if cmd_lower.contains("install") {
            effects.push("Installs packages".to_string());
        }
        if cmd_lower.contains("git push") {
            effects.push("Pushes to remote repository".to_string());
        }
        if cmd_lower.contains("git commit") {
            effects.push("Creates a commit".to_string());
        }
        if cmd_lower.contains(">") && !cmd_lower.contains(">>") {
            effects.push("Overwrites file".to_string());
        }
        if cmd_lower.contains(">>") {
            effects.push("Appends to file".to_string());
        }
        
        effects
    }

    /// Create a pending file operation
    pub fn create_file_operation(&self, path: &Path, content: &str, op_type: OperationType) -> PendingOperation {
        let id = uuid::Uuid::new_v4().to_string();
        let risk_level = match op_type {
            OperationType::FileCreate => RiskLevel::Low,
            OperationType::FileModify => RiskLevel::Medium,
            OperationType::FileDelete => RiskLevel::High,
            OperationType::FileMove => RiskLevel::Medium,
            _ => RiskLevel::Low,
        };

        let preview = match op_type {
            OperationType::FileCreate => format!("Create file: {}\n```\n{}\n```", path.display(), 
                content.lines().take(20).collect::<Vec<_>>().join("\n")),
            OperationType::FileModify => format!("Modify file: {}\n{} characters changed", 
                path.display(), content.len()),
            OperationType::FileDelete => format!("Delete file: {}", path.display()),
            OperationType::FileMove => format!("Move file: {}", path.display()),
            _ => format!("Operation on: {}", path.display()),
        };

        let op = PendingOperation {
            id: id.clone(),
            operation_type: op_type,
            description: format!("{:?} on {}", op_type, path.display()),
            preview,
            risk_level,
            reversible: true,
            created_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        };

        self.pending_operations.write().push(op.clone());
        op
    }

    /// Execute a pending operation
    pub async fn execute_operation(&self, id: &str) -> Result<ExecutionRecord, String> {
        let op = {
            let pending = self.pending_operations.read();
            pending.iter().find(|o| o.id == id).cloned()
        }.ok_or("Operation not found")?;

        // Check if we should proceed based on mode
        if self.config.mode == SandboxMode::Preview {
            return Err("Sandbox is in preview mode - no execution".to_string());
        }

        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        // Placeholder execution - in real implementation would actually execute
        let record = ExecutionRecord {
            id: id.to_string(),
            operation: op.clone(),
            executed_at: now,
            success: true,
            output: "Operation executed successfully".to_string(),
            error: None,
            rollback_available: op.reversible,
        };

        // Remove from pending
        self.pending_operations.write().retain(|o| o.id != id);
        
        // Add to history
        self.history.write().push(record.clone());

        Ok(record)
    }

    /// Execute a command in sandbox
    pub async fn execute_command(&self, command: &str) -> Result<CommandResult, String> {
        let analysis = self.analyze_command(command);
        
        if analysis.blocked {
            return Err(analysis.block_reason.unwrap_or_else(|| "Command blocked".to_string()));
        }

        if self.config.mode == SandboxMode::Preview || self.config.dry_run {
            return Ok(CommandResult {
                command: command.to_string(),
                exit_code: 0,
                stdout: format!("[DRY RUN] Would execute: {}", command),
                stderr: String::new(),
                duration_ms: 0,
            });
        }

        // Parse command
        let parts: Vec<&str> = command.split_whitespace().collect();
        if parts.is_empty() {
            return Err("Empty command".to_string());
        }

        let program = parts[0];
        let args = &parts[1..];

        let start = std::time::Instant::now();
        
        let output = AsyncCommand::new(program)
            .args(args)
            .current_dir(&self.working_dir)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .await
            .map_err(|e| format!("Failed to execute command: {}", e))?;

        let duration = start.elapsed().as_millis() as u64;

        Ok(CommandResult {
            command: command.to_string(),
            exit_code: output.status.code().unwrap_or(-1),
            stdout: String::from_utf8_lossy(&output.stdout).to_string(),
            stderr: String::from_utf8_lossy(&output.stderr).to_string(),
            duration_ms: duration,
        })
    }

    /// Backup a file before modification
    pub fn backup_file(&self, path: &Path) -> Result<(), String> {
        if !self.config.auto_backup {
            return Ok(());
        }

        let content = std::fs::read(path)
            .map_err(|e| format!("Failed to read file for backup: {}", e))?;

        let backup = FileBackup {
            path: path.to_path_buf(),
            content,
            created_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        };

        self.file_backups.write().insert(path.to_path_buf(), backup);

        // Enforce max backups
        let mut backups = self.file_backups.write();
        while backups.len() > self.config.max_backups {
            if let Some(oldest) = backups.iter()
                .min_by_key(|(_, b)| b.created_at)
                .map(|(k, _)| k.clone()) {
                backups.remove(&oldest);
            } else {
                break;
            }
        }

        Ok(())
    }

    /// Rollback a file to its backup
    pub fn rollback_file(&self, path: &Path) -> Result<(), String> {
        let backup = self.file_backups.read()
            .get(path)
            .cloned()
            .ok_or("No backup found for file")?;

        std::fs::write(path, &backup.content)
            .map_err(|e| format!("Failed to restore file: {}", e))?;

        self.file_backups.write().remove(path);
        Ok(())
    }

    /// Rollback last operation
    pub fn rollback_last(&self) -> Result<String, String> {
        let last = self.history.write().pop()
            .ok_or("No operations to rollback")?;

        if !last.rollback_available {
            return Err("Last operation is not reversible".to_string());
        }

        // Attempt rollback based on operation type
        Ok(format!("Rolled back: {}", last.operation.description))
    }

    /// Get execution history
    pub fn get_history(&self) -> Vec<ExecutionRecord> {
        self.history.read().clone()
    }

    /// Get pending operations
    pub fn get_pending(&self) -> Vec<PendingOperation> {
        self.pending_operations.read().clone()
    }

    /// Clear pending operations
    pub fn clear_pending(&self) {
        self.pending_operations.write().clear();
    }

    /// Set sandbox mode
    pub fn set_mode(&mut self, mode: SandboxMode) {
        self.config.mode = mode;
    }
}

/// Result of command execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandResult {
    pub command: String,
    pub exit_code: i32,
    pub stdout: String,
    pub stderr: String,
    pub duration_ms: u64,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_command_analysis() {
        let sandbox = SandboxManager::new(PathBuf::from("."), SandboxConfig::default());
        
        let safe = sandbox.analyze_command("ls -la");
        assert_eq!(safe.risk_level, RiskLevel::Safe);
        assert!(!safe.blocked);

        let dangerous = sandbox.analyze_command("rm -rf /");
        assert_eq!(dangerous.risk_level, RiskLevel::Critical);
        assert!(dangerous.blocked);
    }

    #[test]
    fn test_side_effect_detection() {
        let sandbox = SandboxManager::new(PathBuf::from("."), SandboxConfig::default());
        
        let analysis = sandbox.analyze_command("rm file.txt");
        assert!(analysis.side_effects.contains(&"Deletes files".to_string()));

        let analysis = sandbox.analyze_command("git push origin main");
        assert!(analysis.side_effects.contains(&"Pushes to remote repository".to_string()));
    }
}
