#![allow(dead_code, unused_variables, unused_imports)]
// Persistence Layer for VoiceCode CLI
// Handles settings, session state, and conversation history persistence

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::RwLock;
use tokio::fs;
use chrono::{DateTime, Utc};

// ============================================================================
// Configuration Types
// ============================================================================

/// Global CLI settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CliSettings {
    /// Default agent to use
    pub default_agent: String,
    /// Permission mode
    pub permission_mode: PermissionModeConfig,
    /// Model preferences
    pub model_preferences: ModelPreferences,
    /// Output preferences
    pub output_preferences: OutputPreferences,
    /// Agent-specific settings
    pub agent_settings: HashMap<String, AgentSettings>,
    /// Custom aliases
    pub aliases: HashMap<String, String>,
    /// Hooks (pre/post command)
    pub hooks: HooksConfig,
    /// Theme/display settings
    pub theme: ThemeConfig,
    /// API keys (stored securely)
    pub api_keys: ApiKeysConfig,
    /// Telemetry settings
    pub telemetry: TelemetryConfig,
}

impl Default for CliSettings {
    fn default() -> Self {
        Self {
            default_agent: "voicecode".to_string(),
            permission_mode: PermissionModeConfig::default(),
            model_preferences: ModelPreferences::default(),
            output_preferences: OutputPreferences::default(),
            agent_settings: HashMap::new(),
            aliases: Self::default_aliases(),
            hooks: HooksConfig::default(),
            theme: ThemeConfig::default(),
            api_keys: ApiKeysConfig::default(),
            telemetry: TelemetryConfig::default(),
        }
    }
}

impl CliSettings {
    fn default_aliases() -> HashMap<String, String> {
        let mut aliases = HashMap::new();
        aliases.insert("g".to_string(), "generate".to_string());
        aliases.insert("r".to_string(), "review".to_string());
        aliases.insert("f".to_string(), "fix".to_string());
        aliases.insert("e".to_string(), "explain".to_string());
        aliases.insert("t".to_string(), "test".to_string());
        aliases.insert("d".to_string(), "docs".to_string());
        aliases
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PermissionModeConfig {
    pub mode: String,
    pub auto_approve_patterns: Vec<String>,
    pub deny_patterns: Vec<String>,
    pub require_confirmation_for_writes: bool,
    pub require_confirmation_for_deletes: bool,
    pub require_confirmation_for_commands: bool,
}

impl Default for PermissionModeConfig {
    fn default() -> Self {
        Self {
            mode: "default".to_string(),
            auto_approve_patterns: vec![
                "*.test.*".to_string(),
                "*.spec.*".to_string(),
            ],
            deny_patterns: vec![
                ".env*".to_string(),
                "*secret*".to_string(),
                "*password*".to_string(),
            ],
            require_confirmation_for_writes: true,
            require_confirmation_for_deletes: true,
            require_confirmation_for_commands: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelPreferences {
    pub default_model: String,
    pub fast_model: String,
    pub reasoning_model: String,
    pub max_tokens: usize,
    pub temperature: f32,
    pub prefer_streaming: bool,
}

impl Default for ModelPreferences {
    fn default() -> Self {
        Self {
            default_model: "claude-sonnet-4-20250514".to_string(),
            fast_model: "claude-haiku".to_string(),
            reasoning_model: "claude-opus-4-20250514".to_string(),
            max_tokens: 8192,
            temperature: 0.7,
            prefer_streaming: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OutputPreferences {
    pub format: OutputFormat,
    pub color_enabled: bool,
    pub show_thinking: bool,
    pub show_tool_calls: bool,
    pub show_usage: bool,
    pub show_timing: bool,
    pub diff_format: DiffFormat,
    pub verbose: bool,
}

impl Default for OutputPreferences {
    fn default() -> Self {
        Self {
            format: OutputFormat::Pretty,
            color_enabled: true,
            show_thinking: false,
            show_tool_calls: true,
            show_usage: true,
            show_timing: true,
            diff_format: DiffFormat::Unified,
            verbose: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum OutputFormat {
    Pretty,
    Json,
    Plain,
    Markdown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DiffFormat {
    Unified,
    SideBySide,
    Inline,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentSettings {
    pub enabled: bool,
    pub priority: i32,
    pub max_concurrent: usize,
    pub timeout_ms: u64,
    pub custom_args: Vec<String>,
    pub environment: HashMap<String, String>,
}

impl Default for AgentSettings {
    fn default() -> Self {
        Self {
            enabled: true,
            priority: 50,
            max_concurrent: 3,
            timeout_ms: 300000,
            custom_args: Vec::new(),
            environment: HashMap::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HooksConfig {
    pub pre_command: Vec<String>,
    pub post_command: Vec<String>,
    pub on_file_change: Vec<String>,
    pub on_error: Vec<String>,
}

impl Default for HooksConfig {
    fn default() -> Self {
        Self {
            pre_command: Vec::new(),
            post_command: Vec::new(),
            on_file_change: Vec::new(),
            on_error: Vec::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThemeConfig {
    pub prompt_style: String,
    pub highlight_syntax: bool,
    pub show_icons: bool,
    pub compact_mode: bool,
}

impl Default for ThemeConfig {
    fn default() -> Self {
        Self {
            prompt_style: "default".to_string(),
            highlight_syntax: true,
            show_icons: true,
            compact_mode: false,
        }
    }
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ApiKeysConfig {
    /// Encrypted API keys (never stored in plain text)
    pub encrypted_keys: HashMap<String, String>,
    /// Use system keychain
    pub use_keychain: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TelemetryConfig {
    pub enabled: bool,
    pub share_usage: bool,
    pub share_errors: bool,
}

impl Default for TelemetryConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            share_usage: false,
            share_errors: true,
        }
    }
}

// ============================================================================
// Session State
// ============================================================================

/// Session state for resumable sessions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionState {
    pub id: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub working_directory: PathBuf,
    pub current_file: Option<String>,
    pub selected_agent: Option<String>,
    pub variables: HashMap<String, String>,
    pub conversation_history: Vec<ConversationEntry>,
    pub task_history: Vec<TaskHistoryEntry>,
    pub files_modified: Vec<String>,
    pub checkpoint: Option<SessionCheckpoint>,
}

impl SessionState {
    pub fn new(working_dir: PathBuf) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            created_at: Utc::now(),
            updated_at: Utc::now(),
            working_directory: working_dir,
            current_file: None,
            selected_agent: None,
            variables: HashMap::new(),
            conversation_history: Vec::new(),
            task_history: Vec::new(),
            files_modified: Vec::new(),
            checkpoint: None,
        }
    }

    pub fn add_message(&mut self, role: MessageRole, content: String) {
        self.conversation_history.push(ConversationEntry {
            role,
            content,
            timestamp: Utc::now(),
            metadata: HashMap::new(),
        });
        self.updated_at = Utc::now();
    }

    pub fn add_task(&mut self, task_type: String, result: TaskResult) {
        self.task_history.push(TaskHistoryEntry {
            task_type,
            result,
            timestamp: Utc::now(),
            duration_ms: 0,
        });
        self.updated_at = Utc::now();
    }

    pub fn create_checkpoint(&mut self) -> SessionCheckpoint {
        let checkpoint = SessionCheckpoint {
            id: uuid::Uuid::new_v4().to_string(),
            created_at: Utc::now(),
            conversation_length: self.conversation_history.len(),
            task_count: self.task_history.len(),
            files_snapshot: self.files_modified.clone(),
        };
        self.checkpoint = Some(checkpoint.clone());
        checkpoint
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversationEntry {
    pub role: MessageRole,
    pub content: String,
    pub timestamp: DateTime<Utc>,
    pub metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum MessageRole {
    User,
    Assistant,
    System,
    Tool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskHistoryEntry {
    pub task_type: String,
    pub result: TaskResult,
    pub timestamp: DateTime<Utc>,
    pub duration_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TaskResult {
    Success(String),
    Failure(String),
    Partial(String),
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionCheckpoint {
    pub id: String,
    pub created_at: DateTime<Utc>,
    pub conversation_length: usize,
    pub task_count: usize,
    pub files_snapshot: Vec<String>,
}

// ============================================================================
// Project Memory
// ============================================================================

/// Project-specific memory/context
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectMemory {
    pub project_root: PathBuf,
    pub project_type: Option<String>,
    pub discovered_patterns: Vec<ProjectPattern>,
    pub file_summaries: HashMap<String, FileSummary>,
    pub symbol_index: HashMap<String, SymbolInfo>,
    pub dependency_graph: HashMap<String, Vec<String>>,
    pub recent_changes: Vec<RecentChange>,
    pub user_preferences: HashMap<String, String>,
}

impl ProjectMemory {
    pub fn new(project_root: PathBuf) -> Self {
        Self {
            project_root,
            project_type: None,
            discovered_patterns: Vec::new(),
            file_summaries: HashMap::new(),
            symbol_index: HashMap::new(),
            dependency_graph: HashMap::new(),
            recent_changes: Vec::new(),
            user_preferences: HashMap::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectPattern {
    pub pattern_type: String,
    pub description: String,
    pub files: Vec<String>,
    pub confidence: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileSummary {
    pub path: String,
    pub language: Option<String>,
    pub line_count: usize,
    pub symbols: Vec<String>,
    pub imports: Vec<String>,
    pub exports: Vec<String>,
    pub last_analyzed: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SymbolInfo {
    pub name: String,
    pub kind: String,
    pub file: String,
    pub line: usize,
    pub documentation: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecentChange {
    pub file: String,
    pub change_type: String,
    pub summary: String,
    pub timestamp: DateTime<Utc>,
}

// ============================================================================
// Persistence Manager
// ============================================================================

/// Manages persistence of settings and sessions
pub struct PersistenceManager {
    config_dir: PathBuf,
    settings: Arc<RwLock<CliSettings>>,
    current_session: Arc<RwLock<Option<SessionState>>>,
    project_memory: Arc<RwLock<HashMap<PathBuf, ProjectMemory>>>,
}

impl PersistenceManager {
    pub async fn new() -> Result<Self, String> {
        let config_dir = Self::get_config_dir()?;

        // Ensure config directory exists
        fs::create_dir_all(&config_dir)
            .await
            .map_err(|e| format!("Failed to create config directory: {}", e))?;

        let settings = Self::load_settings(&config_dir).await?;

        Ok(Self {
            config_dir,
            settings: Arc::new(RwLock::new(settings)),
            current_session: Arc::new(RwLock::new(None)),
            project_memory: Arc::new(RwLock::new(HashMap::new())),
        })
    }

    /// Get platform-specific config directory
    fn get_config_dir() -> Result<PathBuf, String> {
        #[cfg(target_os = "windows")]
        {
            if let Some(app_data) = std::env::var_os("APPDATA") {
                Ok(PathBuf::from(app_data).join("VoiceCode"))
            } else {
                Ok(PathBuf::from(".voicecode"))
            }
        }

        #[cfg(target_os = "macos")]
        {
            if let Some(home) = std::env::var_os("HOME") {
                Ok(PathBuf::from(home).join("Library/Application Support/VoiceCode"))
            } else {
                Ok(PathBuf::from(".voicecode"))
            }
        }

        #[cfg(target_os = "linux")]
        {
            if let Some(config) = std::env::var_os("XDG_CONFIG_HOME") {
                Ok(PathBuf::from(config).join("voicecode"))
            } else if let Some(home) = std::env::var_os("HOME") {
                Ok(PathBuf::from(home).join(".config/voicecode"))
            } else {
                Ok(PathBuf::from(".voicecode"))
            }
        }

        #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
        {
            Ok(PathBuf::from(".voicecode"))
        }
    }

    /// Load settings from file
    async fn load_settings(config_dir: &PathBuf) -> Result<CliSettings, String> {
        let settings_path = config_dir.join("settings.json");

        if settings_path.exists() {
            let content = fs::read_to_string(&settings_path)
                .await
                .map_err(|e| format!("Failed to read settings: {}", e))?;

            serde_json::from_str(&content)
                .map_err(|e| format!("Failed to parse settings: {}", e))
        } else {
            Ok(CliSettings::default())
        }
    }

    /// Save settings to file
    pub async fn save_settings(&self) -> Result<(), String> {
        let settings = self.settings.read().await;
        let settings_path = self.config_dir.join("settings.json");

        let content = serde_json::to_string_pretty(&*settings)
            .map_err(|e| format!("Failed to serialize settings: {}", e))?;

        fs::write(&settings_path, content)
            .await
            .map_err(|e| format!("Failed to write settings: {}", e))?;

        Ok(())
    }

    /// Get current settings
    pub async fn get_settings(&self) -> CliSettings {
        self.settings.read().await.clone()
    }

    /// Update settings
    pub async fn update_settings<F>(&self, update_fn: F) -> Result<(), String>
    where
        F: FnOnce(&mut CliSettings),
    {
        {
            let mut settings = self.settings.write().await;
            update_fn(&mut settings);
        }
        self.save_settings().await
    }

    /// Start a new session
    pub async fn start_session(&self, working_dir: PathBuf) -> SessionState {
        let session = SessionState::new(working_dir);
        *self.current_session.write().await = Some(session.clone());
        session
    }

    /// Get current session
    pub async fn get_session(&self) -> Option<SessionState> {
        self.current_session.read().await.clone()
    }

    /// Update current session
    pub async fn update_session<F>(&self, update_fn: F)
    where
        F: FnOnce(&mut SessionState),
    {
        let mut session = self.current_session.write().await;
        if let Some(ref mut s) = *session {
            update_fn(s);
        }
    }

    /// Save session to file
    pub async fn save_session(&self) -> Result<(), String> {
        let session = self.current_session.read().await;

        if let Some(ref s) = *session {
            let sessions_dir = self.config_dir.join("sessions");
            fs::create_dir_all(&sessions_dir)
                .await
                .map_err(|e| format!("Failed to create sessions directory: {}", e))?;

            let session_path = sessions_dir.join(format!("{}.json", s.id));
            let content = serde_json::to_string_pretty(s)
                .map_err(|e| format!("Failed to serialize session: {}", e))?;

            fs::write(&session_path, content)
                .await
                .map_err(|e| format!("Failed to write session: {}", e))?;
        }

        Ok(())
    }

    /// Load a previous session
    pub async fn load_session(&self, session_id: &str) -> Result<SessionState, String> {
        let session_path = self.config_dir.join("sessions").join(format!("{}.json", session_id));

        let content = fs::read_to_string(&session_path)
            .await
            .map_err(|e| format!("Failed to read session: {}", e))?;

        let session: SessionState = serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse session: {}", e))?;

        *self.current_session.write().await = Some(session.clone());

        Ok(session)
    }

    /// List available sessions
    pub async fn list_sessions(&self) -> Result<Vec<SessionSummary>, String> {
        let sessions_dir = self.config_dir.join("sessions");

        if !sessions_dir.exists() {
            return Ok(Vec::new());
        }

        let mut sessions = Vec::new();
        let mut dir = fs::read_dir(&sessions_dir)
            .await
            .map_err(|e| format!("Failed to read sessions directory: {}", e))?;

        while let Some(entry) = dir.next_entry().await.map_err(|e| e.to_string())? {
            if entry.path().extension().map_or(false, |ext| ext == "json") {
                if let Ok(content) = fs::read_to_string(entry.path()).await {
                    if let Ok(session) = serde_json::from_str::<SessionState>(&content) {
                        sessions.push(SessionSummary {
                            id: session.id,
                            created_at: session.created_at,
                            updated_at: session.updated_at,
                            working_directory: session.working_directory,
                            message_count: session.conversation_history.len(),
                            task_count: session.task_history.len(),
                        });
                    }
                }
            }
        }

        // Sort by most recent
        sessions.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));

        Ok(sessions)
    }

    /// Get or create project memory
    pub async fn get_project_memory(&self, project_root: PathBuf) -> ProjectMemory {
        let mut memory = self.project_memory.write().await;

        if let Some(pm) = memory.get(&project_root) {
            pm.clone()
        } else {
            // Try to load from disk
            let memory_path = self.config_dir
                .join("projects")
                .join(Self::hash_path(&project_root))
                .join("memory.json");

            let pm = if memory_path.exists() {
                fs::read_to_string(&memory_path)
                    .await
                    .ok()
                    .and_then(|content| serde_json::from_str(&content).ok())
                    .unwrap_or_else(|| ProjectMemory::new(project_root.clone()))
            } else {
                ProjectMemory::new(project_root.clone())
            };

            memory.insert(project_root, pm.clone());
            pm
        }
    }

    /// Save project memory
    pub async fn save_project_memory(&self, project_root: &PathBuf) -> Result<(), String> {
        let memory = self.project_memory.read().await;

        if let Some(pm) = memory.get(project_root) {
            let projects_dir = self.config_dir
                .join("projects")
                .join(Self::hash_path(project_root));

            fs::create_dir_all(&projects_dir)
                .await
                .map_err(|e| format!("Failed to create projects directory: {}", e))?;

            let memory_path = projects_dir.join("memory.json");
            let content = serde_json::to_string_pretty(pm)
                .map_err(|e| format!("Failed to serialize project memory: {}", e))?;

            fs::write(&memory_path, content)
                .await
                .map_err(|e| format!("Failed to write project memory: {}", e))?;
        }

        Ok(())
    }

    /// Hash a path for directory name
    fn hash_path(path: &PathBuf) -> String {
        use std::hash::{Hash, Hasher};
        let mut hasher = std::collections::hash_map::DefaultHasher::new();
        path.hash(&mut hasher);
        format!("{:016x}", hasher.finish())
    }

    /// Export conversation history
    pub async fn export_conversation(&self, format: ExportFormat) -> Result<String, String> {
        let session = self.current_session.read().await;

        let session = session.as_ref().ok_or("No active session")?;

        match format {
            ExportFormat::Json => {
                serde_json::to_string_pretty(&session.conversation_history)
                    .map_err(|e| e.to_string())
            }
            ExportFormat::Markdown => {
                let mut output = String::new();
                output.push_str(&format!("# VoiceCode Session: {}\n\n", session.id));
                output.push_str(&format!("Created: {}\n\n", session.created_at));

                for entry in &session.conversation_history {
                    let role = match entry.role {
                        MessageRole::User => "**User**",
                        MessageRole::Assistant => "**Assistant**",
                        MessageRole::System => "**System**",
                        MessageRole::Tool => "**Tool**",
                    };
                    output.push_str(&format!("{}: {}\n\n", role, entry.content));
                }

                Ok(output)
            }
            ExportFormat::Plain => {
                let mut output = String::new();
                for entry in &session.conversation_history {
                    let role = match entry.role {
                        MessageRole::User => "User",
                        MessageRole::Assistant => "Assistant",
                        MessageRole::System => "System",
                        MessageRole::Tool => "Tool",
                    };
                    output.push_str(&format!("[{}] {}\n\n", role, entry.content));
                }
                Ok(output)
            }
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionSummary {
    pub id: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub working_directory: PathBuf,
    pub message_count: usize,
    pub task_count: usize,
}

#[derive(Debug, Clone, Copy)]
pub enum ExportFormat {
    Json,
    Markdown,
    Plain,
}

// ============================================================================
// Global Instance
// ============================================================================

use tokio::sync::OnceCell;

static PERSISTENCE_MANAGER: OnceCell<PersistenceManager> = OnceCell::const_new();

/// Get global persistence manager
pub async fn get_persistence_manager() -> Result<&'static PersistenceManager, String> {
    PERSISTENCE_MANAGER
        .get_or_try_init(|| async {
            PersistenceManager::new().await
        })
        .await
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_settings() {
        let settings = CliSettings::default();
        assert_eq!(settings.default_agent, "voicecode");
        assert!(settings.output_preferences.color_enabled);
    }

    #[test]
    fn test_session_creation() {
        let session = SessionState::new(PathBuf::from("/tmp/test"));
        assert!(!session.id.is_empty());
        assert!(session.conversation_history.is_empty());
    }

    #[test]
    fn test_session_add_message() {
        let mut session = SessionState::new(PathBuf::from("/tmp/test"));
        session.add_message(MessageRole::User, "Hello".to_string());
        session.add_message(MessageRole::Assistant, "Hi there!".to_string());

        assert_eq!(session.conversation_history.len(), 2);
        assert_eq!(session.conversation_history[0].role, MessageRole::User);
    }
}
