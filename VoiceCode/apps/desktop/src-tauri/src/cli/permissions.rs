#![allow(dead_code, unused_variables, unused_imports)]
// Permission System - Tiered permission modes with sandbox execution
// Inspired by Claude Code's permission model and Codex CLI's safety features

use globset::{Glob, GlobSet, GlobSetBuilder};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::path::PathBuf;
use std::sync::{Arc, RwLock};

/// Permission mode controlling agent autonomy level
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum PermissionMode {
    /// Plan mode: Agent can only read and suggest, no modifications
    Plan,
    /// Default mode: Ask permission for each operation
    Default,
    /// AcceptEdits mode: Auto-approve file edits, ask for commands
    AcceptEdits,
    /// Autonomous mode: Auto-approve all operations (dangerous)
    Autonomous,
}

impl Default for PermissionMode {
    fn default() -> Self {
        Self::Default
    }
}

impl std::fmt::Display for PermissionMode {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Plan => write!(f, "plan"),
            Self::Default => write!(f, "default"),
            Self::AcceptEdits => write!(f, "accept-edits"),
            Self::Autonomous => write!(f, "autonomous"),
        }
    }
}

impl std::str::FromStr for PermissionMode {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "plan" | "read-only" => Ok(Self::Plan),
            "default" | "ask" => Ok(Self::Default),
            "accept-edits" | "acceptedits" | "auto-edit" => Ok(Self::AcceptEdits),
            "autonomous" | "yolo" | "dontask" | "dont-ask" => Ok(Self::Autonomous),
            _ => Err(format!("Unknown permission mode: {}", s)),
        }
    }
}

/// Type of operation requiring permission
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum OperationType {
    /// Read a file
    FileRead,
    /// Write/modify a file
    FileWrite,
    /// Create a new file
    FileCreate,
    /// Delete a file
    FileDelete,
    /// Execute a shell command
    CommandExecute,
    /// Make a network request
    NetworkRequest,
    /// Access system resources (env vars, etc.)
    SystemAccess,
    /// Install packages or dependencies
    PackageInstall,
    /// Git operations
    GitOperation,
    /// Database operations
    DatabaseAccess,
}

impl std::fmt::Display for OperationType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::FileRead => write!(f, "file:read"),
            Self::FileWrite => write!(f, "file:write"),
            Self::FileCreate => write!(f, "file:create"),
            Self::FileDelete => write!(f, "file:delete"),
            Self::CommandExecute => write!(f, "command:execute"),
            Self::NetworkRequest => write!(f, "network:request"),
            Self::SystemAccess => write!(f, "system:access"),
            Self::PackageInstall => write!(f, "package:install"),
            Self::GitOperation => write!(f, "git:operation"),
            Self::DatabaseAccess => write!(f, "database:access"),
        }
    }
}

/// Permission decision
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum PermissionDecision {
    /// Operation is allowed
    Allow,
    /// Operation is denied
    Deny,
    /// Ask user for permission
    Ask,
    /// Operation is sandboxed (safe preview)
    Sandbox,
}

/// A permission request with context
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PermissionRequest {
    /// Type of operation
    pub operation: OperationType,
    /// Target resource (file path, command, URL, etc.)
    pub target: String,
    /// Human-readable description
    pub description: String,
    /// Agent requesting the permission
    pub agent_id: String,
    /// Risk level (0-10)
    pub risk_level: u8,
    /// Whether the operation is reversible
    pub reversible: bool,
    /// Preview of changes (for file operations)
    pub preview: Option<String>,
}

/// Allowlist entry for pre-approved operations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AllowlistEntry {
    /// Pattern to match (glob for files, regex for commands)
    pub pattern: String,
    /// Operation types this entry applies to
    pub operations: Vec<OperationType>,
    /// Whether pattern is a glob (true) or regex (false)
    pub is_glob: bool,
    /// Description of why this is allowed
    pub reason: String,
    /// Session-only (not persisted)
    pub session_only: bool,
}

/// Denylist entry for blocked operations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DenylistEntry {
    /// Pattern to match
    pub pattern: String,
    /// Operation types this entry blocks
    pub operations: Vec<OperationType>,
    /// Whether pattern is a glob
    pub is_glob: bool,
    /// Reason for denial
    pub reason: String,
}

/// Session permission state
#[derive(Debug, Default)]
pub struct SessionPermissions {
    /// Operations approved this session
    approved: HashSet<String>,
    /// Operations denied this session
    denied: HashSet<String>,
    /// "Always allow" grants for this session
    session_allowlist: Vec<AllowlistEntry>,
    /// "Always deny" for this session
    session_denylist: Vec<DenylistEntry>,
}

/// Dangerous commands that should never be auto-approved
const DANGEROUS_COMMANDS: &[&str] = &[
    "rm -rf /",
    "rm -rf /*",
    "dd if=",
    "mkfs.",
    ":(){:|:&};:",
    "chmod -R 777 /",
    "chmod 777 /",
    "sudo rm -rf",
    "format c:",
    "del /f /s /q",
    "> /dev/sda",
    "curl | sh",
    "wget | sh",
    "curl | bash",
    "wget | bash",
];

/// Sensitive paths that require explicit permission
const SENSITIVE_PATHS: &[&str] = &[
    "~/.ssh",
    "~/.gnupg",
    "~/.aws",
    "~/.config",
    "/etc/passwd",
    "/etc/shadow",
    "~/.bashrc",
    "~/.zshrc",
    "~/.profile",
    ".env",
    ".env.local",
    ".env.production",
    "secrets",
    "credentials",
    "private",
];

/// Permission system managing access control
pub struct PermissionSystem {
    /// Current permission mode
    mode: RwLock<PermissionMode>,
    /// Persistent allowlist
    allowlist: RwLock<Vec<AllowlistEntry>>,
    /// Persistent denylist
    denylist: RwLock<Vec<DenylistEntry>>,
    /// Session-specific permissions
    session: RwLock<SessionPermissions>,
    /// Working directory for relative path resolution
    working_dir: PathBuf,
    /// Compiled glob patterns for allowlist
    allowlist_globs: RwLock<Option<GlobSet>>,
    /// Compiled glob patterns for denylist
    denylist_globs: RwLock<Option<GlobSet>>,
    /// Permission request callback
    ask_callback: Option<Arc<dyn Fn(&PermissionRequest) -> PermissionDecision + Send + Sync>>,
    /// Operation history for audit
    history: RwLock<Vec<PermissionAuditEntry>>,
}

impl std::fmt::Debug for PermissionSystem {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("PermissionSystem")
            .field("working_dir", &self.working_dir)
            .field("has_ask_callback", &self.ask_callback.is_some())
            .finish()
    }
}

/// Audit entry for permission history
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PermissionAuditEntry {
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub request: PermissionRequest,
    pub decision: PermissionDecision,
    pub reason: String,
}

impl PermissionSystem {
    /// Create a new permission system
    pub fn new(working_dir: PathBuf) -> Self {
        Self {
            mode: RwLock::new(PermissionMode::Default),
            allowlist: RwLock::new(Vec::new()),
            denylist: RwLock::new(Self::default_denylist()),
            session: RwLock::new(SessionPermissions::default()),
            working_dir,
            allowlist_globs: RwLock::new(None),
            denylist_globs: RwLock::new(None),
            ask_callback: None,
            history: RwLock::new(Vec::new()),
        }
    }

    /// Create with a specific permission mode
    pub fn with_mode(working_dir: PathBuf, mode: PermissionMode) -> Self {
        let system = Self::new(working_dir);
        *system.mode.write().unwrap() = mode;
        system
    }

    /// Set the permission mode
    pub fn set_mode(&self, mode: PermissionMode) {
        *self.mode.write().unwrap() = mode;
    }

    /// Get the current permission mode
    pub fn get_mode(&self) -> PermissionMode {
        *self.mode.read().unwrap()
    }

    /// Set callback for asking user permission
    pub fn set_ask_callback<F>(&mut self, callback: F)
    where
        F: Fn(&PermissionRequest) -> PermissionDecision + Send + Sync + 'static,
    {
        self.ask_callback = Some(Arc::new(callback));
    }

    /// Check if an operation is allowed
    pub fn check_permission(&self, request: &PermissionRequest) -> PermissionDecision {
        let mode = self.get_mode();

        // Always check denylist first
        if self.is_denylisted(request) {
            self.record_decision(request, PermissionDecision::Deny, "Denylisted");
            return PermissionDecision::Deny;
        }

        // Check for dangerous operations
        if self.is_dangerous(request) {
            self.record_decision(request, PermissionDecision::Deny, "Dangerous operation");
            return PermissionDecision::Deny;
        }

        // Check session denials
        if self.is_session_denied(request) {
            self.record_decision(request, PermissionDecision::Deny, "Denied this session");
            return PermissionDecision::Deny;
        }

        // Check session approvals
        if self.is_session_approved(request) {
            self.record_decision(request, PermissionDecision::Allow, "Approved this session");
            return PermissionDecision::Allow;
        }

        // Check allowlist
        if self.is_allowlisted(request) {
            self.record_decision(request, PermissionDecision::Allow, "Allowlisted");
            return PermissionDecision::Allow;
        }

        // Apply mode-based rules
        let decision = match mode {
            PermissionMode::Plan => match request.operation {
                OperationType::FileRead => PermissionDecision::Allow,
                _ => PermissionDecision::Deny,
            },
            PermissionMode::Default => PermissionDecision::Ask,
            PermissionMode::AcceptEdits => match request.operation {
                OperationType::FileRead | OperationType::FileWrite | OperationType::FileCreate => {
                    PermissionDecision::Allow
                }
                OperationType::CommandExecute => {
                    if self.is_safe_command(&request.target) {
                        PermissionDecision::Allow
                    } else {
                        PermissionDecision::Ask
                    }
                }
                _ => PermissionDecision::Ask,
            },
            PermissionMode::Autonomous => {
                // Even in autonomous mode, some operations need confirmation
                if request.risk_level > 7 || !request.reversible {
                    PermissionDecision::Ask
                } else {
                    PermissionDecision::Allow
                }
            }
        };

        self.record_decision(request, decision.clone(), &format!("Mode: {}", mode));
        decision
    }

    /// Request permission (may prompt user)
    pub fn request_permission(&self, request: &PermissionRequest) -> PermissionDecision {
        let decision = self.check_permission(request);

        if decision == PermissionDecision::Ask {
            if let Some(callback) = &self.ask_callback {
                let user_decision = callback(request);
                self.record_decision(request, user_decision.clone(), "User decision");
                return user_decision;
            }
            // No callback, default to deny for safety
            return PermissionDecision::Deny;
        }

        decision
    }

    /// Add an entry to the allowlist
    pub fn add_to_allowlist(&self, entry: AllowlistEntry) {
        if entry.session_only {
            self.session.write().unwrap().session_allowlist.push(entry);
        } else {
            self.allowlist.write().unwrap().push(entry);
            self.rebuild_allowlist_globs();
        }
    }

    /// Add an entry to the denylist
    pub fn add_to_denylist(&self, entry: DenylistEntry) {
        self.denylist.write().unwrap().push(entry);
        self.rebuild_denylist_globs();
    }

    /// Grant session-wide approval for a specific operation
    pub fn approve_for_session(&self, operation: &OperationType, target: &str) {
        let key = format!("{}:{}", operation, target);
        self.session.write().unwrap().approved.insert(key);
    }

    /// Deny for the rest of the session
    pub fn deny_for_session(&self, operation: &OperationType, target: &str) {
        let key = format!("{}:{}", operation, target);
        self.session.write().unwrap().denied.insert(key);
    }

    /// Check if operation is on the denylist
    fn is_denylisted(&self, request: &PermissionRequest) -> bool {
        let denylist = self.denylist.read().unwrap();

        for entry in denylist.iter() {
            if !entry.operations.contains(&request.operation) {
                continue;
            }

            if entry.is_glob {
                if let Ok(glob) = Glob::new(&entry.pattern) {
                    if glob.compile_matcher().is_match(&request.target) {
                        return true;
                    }
                }
            } else if let Ok(regex) = regex::Regex::new(&entry.pattern) {
                if regex.is_match(&request.target) {
                    return true;
                }
            }
        }

        false
    }

    /// Check if operation is on the allowlist
    fn is_allowlisted(&self, request: &PermissionRequest) -> bool {
        // Check session allowlist first
        let session = self.session.read().unwrap();
        for entry in &session.session_allowlist {
            if entry.operations.contains(&request.operation) {
                if entry.is_glob {
                    if let Ok(glob) = Glob::new(&entry.pattern) {
                        if glob.compile_matcher().is_match(&request.target) {
                            return true;
                        }
                    }
                }
            }
        }
        drop(session);

        // Check persistent allowlist
        let allowlist = self.allowlist.read().unwrap();
        for entry in allowlist.iter() {
            if !entry.operations.contains(&request.operation) {
                continue;
            }

            if entry.is_glob {
                if let Ok(glob) = Glob::new(&entry.pattern) {
                    if glob.compile_matcher().is_match(&request.target) {
                        return true;
                    }
                }
            } else if let Ok(regex) = regex::Regex::new(&entry.pattern) {
                if regex.is_match(&request.target) {
                    return true;
                }
            }
        }

        false
    }

    /// Check if operation is dangerous
    fn is_dangerous(&self, request: &PermissionRequest) -> bool {
        match request.operation {
            OperationType::CommandExecute => {
                let cmd = request.target.to_lowercase();
                for dangerous in DANGEROUS_COMMANDS {
                    if cmd.contains(dangerous) {
                        return true;
                    }
                }
            }
            OperationType::FileWrite | OperationType::FileDelete => {
                for sensitive in SENSITIVE_PATHS {
                    let pattern = sensitive.replace("~", "");
                    if request.target.contains(&pattern) {
                        return true;
                    }
                }
            }
            _ => {}
        }

        false
    }

    /// Check if a command is considered safe
    fn is_safe_command(&self, command: &str) -> bool {
        const SAFE_COMMANDS: &[&str] = &[
            "ls",
            "dir",
            "pwd",
            "cd",
            "cat",
            "head",
            "tail",
            "less",
            "more",
            "grep",
            "find",
            "which",
            "whereis",
            "file",
            "stat",
            "wc",
            "echo",
            "printf",
            "date",
            "cal",
            "uptime",
            "whoami",
            "id",
            "git status",
            "git log",
            "git diff",
            "git branch",
            "git remote",
            "npm list",
            "npm outdated",
            "yarn list",
            "pnpm list",
            "cargo check",
            "cargo build",
            "cargo test",
            "cargo clippy",
            "python --version",
            "node --version",
            "rustc --version",
            "tree",
            "du -sh",
            "df -h",
        ];

        let cmd_lower = command.to_lowercase();
        SAFE_COMMANDS.iter().any(|safe| cmd_lower.starts_with(safe))
    }

    /// Check session approval
    fn is_session_approved(&self, request: &PermissionRequest) -> bool {
        let key = format!("{}:{}", request.operation, request.target);
        self.session.read().unwrap().approved.contains(&key)
    }

    /// Check session denial
    fn is_session_denied(&self, request: &PermissionRequest) -> bool {
        let key = format!("{}:{}", request.operation, request.target);
        self.session.read().unwrap().denied.contains(&key)
    }

    /// Record a permission decision for audit
    fn record_decision(
        &self,
        request: &PermissionRequest,
        decision: PermissionDecision,
        reason: &str,
    ) {
        let entry = PermissionAuditEntry {
            timestamp: chrono::Utc::now(),
            request: request.clone(),
            decision,
            reason: reason.to_string(),
        };
        self.history.write().unwrap().push(entry);
    }

    /// Rebuild allowlist glob patterns
    fn rebuild_allowlist_globs(&self) {
        let allowlist = self.allowlist.read().unwrap();
        let mut builder = GlobSetBuilder::new();

        for entry in allowlist.iter() {
            if entry.is_glob {
                if let Ok(glob) = Glob::new(&entry.pattern) {
                    builder.add(glob);
                }
            }
        }

        if let Ok(set) = builder.build() {
            *self.allowlist_globs.write().unwrap() = Some(set);
        }
    }

    /// Rebuild denylist glob patterns
    fn rebuild_denylist_globs(&self) {
        let denylist = self.denylist.read().unwrap();
        let mut builder = GlobSetBuilder::new();

        for entry in denylist.iter() {
            if entry.is_glob {
                if let Ok(glob) = Glob::new(&entry.pattern) {
                    builder.add(glob);
                }
            }
        }

        if let Ok(set) = builder.build() {
            *self.denylist_globs.write().unwrap() = Some(set);
        }
    }

    /// Get the default denylist
    fn default_denylist() -> Vec<DenylistEntry> {
        vec![
            DenylistEntry {
                pattern: "**/.ssh/**".to_string(),
                operations: vec![OperationType::FileWrite, OperationType::FileDelete],
                is_glob: true,
                reason: "SSH keys are sensitive".to_string(),
            },
            DenylistEntry {
                pattern: "**/.gnupg/**".to_string(),
                operations: vec![OperationType::FileWrite, OperationType::FileDelete],
                is_glob: true,
                reason: "GPG keys are sensitive".to_string(),
            },
            DenylistEntry {
                pattern: "**/.aws/**".to_string(),
                operations: vec![OperationType::FileWrite, OperationType::FileDelete],
                is_glob: true,
                reason: "AWS credentials are sensitive".to_string(),
            },
            DenylistEntry {
                pattern: r"rm\s+-rf\s+[/~]".to_string(),
                operations: vec![OperationType::CommandExecute],
                is_glob: false,
                reason: "Recursive deletion from root is dangerous".to_string(),
            },
            DenylistEntry {
                pattern: r">\s*/dev/(sda|nvme|disk)".to_string(),
                operations: vec![OperationType::CommandExecute],
                is_glob: false,
                reason: "Writing to block devices is dangerous".to_string(),
            },
        ]
    }

    /// Get audit history
    pub fn get_history(&self) -> Vec<PermissionAuditEntry> {
        self.history.read().unwrap().clone()
    }

    /// Clear session permissions
    pub fn clear_session(&self) {
        let mut session = self.session.write().unwrap();
        session.approved.clear();
        session.denied.clear();
        session.session_allowlist.clear();
        session.session_denylist.clear();
    }

    /// Export permissions to JSON
    pub fn export_config(&self) -> Result<String, serde_json::Error> {
        #[derive(Serialize)]
        struct PermissionConfig {
            mode: PermissionMode,
            allowlist: Vec<AllowlistEntry>,
            denylist: Vec<DenylistEntry>,
        }

        let config = PermissionConfig {
            mode: self.get_mode(),
            allowlist: self.allowlist.read().unwrap().clone(),
            denylist: self.denylist.read().unwrap().clone(),
        };

        serde_json::to_string_pretty(&config)
    }

    /// Import permissions from JSON
    pub fn import_config(&self, json: &str) -> Result<(), serde_json::Error> {
        #[derive(Deserialize)]
        struct PermissionConfig {
            mode: PermissionMode,
            allowlist: Vec<AllowlistEntry>,
            denylist: Vec<DenylistEntry>,
        }

        let config: PermissionConfig = serde_json::from_str(json)?;

        *self.mode.write().unwrap() = config.mode;
        *self.allowlist.write().unwrap() = config.allowlist;
        *self.denylist.write().unwrap() = config.denylist;

        self.rebuild_allowlist_globs();
        self.rebuild_denylist_globs();

        Ok(())
    }
}

/// Sandbox execution environment for safe command previews
#[derive(Debug)]
pub struct SandboxEnvironment {
    /// Temporary directory for sandbox operations
    temp_dir: PathBuf,
    /// Captured stdout
    stdout: RwLock<Vec<String>>,
    /// Captured stderr
    stderr: RwLock<Vec<String>>,
    /// File system changes (virtual)
    fs_changes: RwLock<HashMap<PathBuf, SandboxFileChange>>,
    /// Whether sandbox is active
    active: RwLock<bool>,
}

/// A sandboxed file change
#[derive(Debug, Clone)]
pub struct SandboxFileChange {
    pub path: PathBuf,
    pub operation: SandboxOperation,
    pub original_content: Option<String>,
    pub new_content: Option<String>,
}

/// Sandbox operation type
#[derive(Debug, Clone, PartialEq)]
pub enum SandboxOperation {
    Create,
    Modify,
    Delete,
}

impl SandboxEnvironment {
    /// Create a new sandbox environment
    pub fn new() -> std::io::Result<Self> {
        let temp_dir =
            std::env::temp_dir().join(format!("voicecode-sandbox-{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&temp_dir)?;

        Ok(Self {
            temp_dir,
            stdout: RwLock::new(Vec::new()),
            stderr: RwLock::new(Vec::new()),
            fs_changes: RwLock::new(HashMap::new()),
            active: RwLock::new(false),
        })
    }

    /// Start sandbox mode
    pub fn start(&self) {
        *self.active.write().unwrap() = true;
    }

    /// Stop sandbox mode
    pub fn stop(&self) {
        *self.active.write().unwrap() = false;
    }

    /// Check if sandbox is active
    pub fn is_active(&self) -> bool {
        *self.active.read().unwrap()
    }

    /// Record a file creation in sandbox
    pub fn record_create(&self, path: PathBuf, content: String) {
        self.fs_changes.write().unwrap().insert(
            path.clone(),
            SandboxFileChange {
                path,
                operation: SandboxOperation::Create,
                original_content: None,
                new_content: Some(content),
            },
        );
    }

    /// Record a file modification in sandbox
    pub fn record_modify(&self, path: PathBuf, original: String, new_content: String) {
        self.fs_changes.write().unwrap().insert(
            path.clone(),
            SandboxFileChange {
                path,
                operation: SandboxOperation::Modify,
                original_content: Some(original),
                new_content: Some(new_content),
            },
        );
    }

    /// Record a file deletion in sandbox
    pub fn record_delete(&self, path: PathBuf, original: String) {
        self.fs_changes.write().unwrap().insert(
            path.clone(),
            SandboxFileChange {
                path,
                operation: SandboxOperation::Delete,
                original_content: Some(original),
                new_content: None,
            },
        );
    }

    /// Get all pending changes
    pub fn get_changes(&self) -> Vec<SandboxFileChange> {
        self.fs_changes.read().unwrap().values().cloned().collect()
    }

    /// Apply sandboxed changes to real file system
    pub fn apply_changes(&self) -> std::io::Result<Vec<PathBuf>> {
        let changes = self.fs_changes.read().unwrap();
        let mut applied = Vec::new();

        for (path, change) in changes.iter() {
            match change.operation {
                SandboxOperation::Create | SandboxOperation::Modify => {
                    if let Some(content) = &change.new_content {
                        if let Some(parent) = path.parent() {
                            std::fs::create_dir_all(parent)?;
                        }
                        std::fs::write(path, content)?;
                        applied.push(path.clone());
                    }
                }
                SandboxOperation::Delete => {
                    if path.exists() {
                        std::fs::remove_file(path)?;
                        applied.push(path.clone());
                    }
                }
            }
        }

        Ok(applied)
    }

    /// Discard all sandboxed changes
    pub fn discard_changes(&self) {
        self.fs_changes.write().unwrap().clear();
    }

    /// Get a diff preview of all changes
    pub fn get_diff_preview(&self) -> String {
        let changes = self.fs_changes.read().unwrap();
        let mut preview = String::new();

        for change in changes.values() {
            preview.push_str(&format!("\n=== {} ===\n", change.path.display()));

            match change.operation {
                SandboxOperation::Create => {
                    preview.push_str("[NEW FILE]\n");
                    if let Some(content) = &change.new_content {
                        for line in content.lines() {
                            preview.push_str(&format!("+ {}\n", line));
                        }
                    }
                }
                SandboxOperation::Modify => {
                    preview.push_str("[MODIFIED]\n");
                    // Simple diff - could use proper diff algorithm
                    if let (Some(orig), Some(new)) = (&change.original_content, &change.new_content)
                    {
                        let orig_lines: Vec<&str> = orig.lines().collect();
                        let new_lines: Vec<&str> = new.lines().collect();

                        for (i, line) in orig_lines.iter().enumerate() {
                            if i >= new_lines.len() || line != &new_lines[i] {
                                preview.push_str(&format!("- {}\n", line));
                            }
                        }
                        for (i, line) in new_lines.iter().enumerate() {
                            if i >= orig_lines.len() || line != &orig_lines[i] {
                                preview.push_str(&format!("+ {}\n", line));
                            }
                        }
                    }
                }
                SandboxOperation::Delete => {
                    preview.push_str("[DELETED]\n");
                    if let Some(content) = &change.original_content {
                        for line in content.lines() {
                            preview.push_str(&format!("- {}\n", line));
                        }
                    }
                }
            }
        }

        preview
    }

    /// Clean up sandbox temp directory
    pub fn cleanup(&self) -> std::io::Result<()> {
        if self.temp_dir.exists() {
            std::fs::remove_dir_all(&self.temp_dir)?;
        }
        Ok(())
    }
}

impl Drop for SandboxEnvironment {
    fn drop(&mut self) {
        let _ = self.cleanup();
    }
}

/// Command allowlist for specific safe operations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandAllowlist {
    /// Exact commands that are always allowed
    pub exact: Vec<String>,
    /// Command prefixes that are allowed
    pub prefixes: Vec<String>,
    /// Regex patterns for allowed commands
    pub patterns: Vec<String>,
}

impl Default for CommandAllowlist {
    fn default() -> Self {
        Self {
            exact: vec!["pwd".to_string(), "whoami".to_string(), "date".to_string()],
            prefixes: vec![
                "ls".to_string(),
                "cat".to_string(),
                "head".to_string(),
                "tail".to_string(),
                "grep".to_string(),
                "find".to_string(),
                "git status".to_string(),
                "git log".to_string(),
                "git diff".to_string(),
                "cargo check".to_string(),
                "cargo build".to_string(),
                "cargo test".to_string(),
                "npm run".to_string(),
                "npm test".to_string(),
                "yarn".to_string(),
                "pnpm".to_string(),
            ],
            patterns: vec![
                r#"^echo\s+['"].*['"]$"#.to_string(), // Simple echo with quoted string
            ],
        }
    }
}

impl CommandAllowlist {
    /// Check if a command is allowed
    pub fn is_allowed(&self, command: &str) -> bool {
        let cmd = command.trim();

        // Check exact matches
        if self.exact.contains(&cmd.to_string()) {
            return true;
        }

        // Check prefixes
        for prefix in &self.prefixes {
            if cmd.starts_with(prefix) {
                return true;
            }
        }

        // Check patterns
        for pattern in &self.patterns {
            if let Ok(regex) = regex::Regex::new(pattern) {
                if regex.is_match(cmd) {
                    return true;
                }
            }
        }

        false
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_permission_mode_parsing() {
        assert_eq!(
            "plan".parse::<PermissionMode>().unwrap(),
            PermissionMode::Plan
        );
        assert_eq!(
            "default".parse::<PermissionMode>().unwrap(),
            PermissionMode::Default
        );
        assert_eq!(
            "accept-edits".parse::<PermissionMode>().unwrap(),
            PermissionMode::AcceptEdits
        );
        assert_eq!(
            "autonomous".parse::<PermissionMode>().unwrap(),
            PermissionMode::Autonomous
        );
        assert_eq!(
            "yolo".parse::<PermissionMode>().unwrap(),
            PermissionMode::Autonomous
        );
    }

    #[test]
    fn test_dangerous_command_detection() {
        let system = PermissionSystem::new(PathBuf::from("."));

        let request = PermissionRequest {
            operation: OperationType::CommandExecute,
            target: "rm -rf /".to_string(),
            description: "Delete everything".to_string(),
            agent_id: "test".to_string(),
            risk_level: 10,
            reversible: false,
            preview: None,
        };

        assert_eq!(system.check_permission(&request), PermissionDecision::Deny);
    }

    #[test]
    fn test_safe_command_detection() {
        let system = PermissionSystem::with_mode(PathBuf::from("."), PermissionMode::AcceptEdits);

        let request = PermissionRequest {
            operation: OperationType::CommandExecute,
            target: "ls -la".to_string(),
            description: "List files".to_string(),
            agent_id: "test".to_string(),
            risk_level: 1,
            reversible: true,
            preview: None,
        };

        assert_eq!(system.check_permission(&request), PermissionDecision::Allow);
    }

    #[test]
    fn test_plan_mode_read_only() {
        let system = PermissionSystem::with_mode(PathBuf::from("."), PermissionMode::Plan);

        let read_request = PermissionRequest {
            operation: OperationType::FileRead,
            target: "src/main.rs".to_string(),
            description: "Read file".to_string(),
            agent_id: "test".to_string(),
            risk_level: 1,
            reversible: true,
            preview: None,
        };

        let write_request = PermissionRequest {
            operation: OperationType::FileWrite,
            target: "src/main.rs".to_string(),
            description: "Write file".to_string(),
            agent_id: "test".to_string(),
            risk_level: 3,
            reversible: true,
            preview: None,
        };

        assert_eq!(
            system.check_permission(&read_request),
            PermissionDecision::Allow
        );
        assert_eq!(
            system.check_permission(&write_request),
            PermissionDecision::Deny
        );
    }

    #[test]
    fn test_command_allowlist() {
        let allowlist = CommandAllowlist::default();

        assert!(allowlist.is_allowed("ls -la"));
        assert!(allowlist.is_allowed("git status"));
        assert!(allowlist.is_allowed("cargo test"));
        assert!(!allowlist.is_allowed("rm -rf /"));
        assert!(!allowlist.is_allowed("sudo su"));
    }

    #[test]
    fn test_sandbox_changes() {
        let sandbox = SandboxEnvironment::new().unwrap();
        sandbox.start();

        sandbox.record_create(PathBuf::from("test.txt"), "Hello, World!".to_string());
        sandbox.record_modify(
            PathBuf::from("existing.txt"),
            "old content".to_string(),
            "new content".to_string(),
        );

        let changes = sandbox.get_changes();
        assert_eq!(changes.len(), 2);

        let preview = sandbox.get_diff_preview();
        assert!(preview.contains("test.txt"));
        assert!(preview.contains("existing.txt"));

        sandbox.discard_changes();
        assert!(sandbox.get_changes().is_empty());
    }
}
