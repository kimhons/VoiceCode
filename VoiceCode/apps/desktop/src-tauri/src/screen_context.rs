// Phase 1.4: Screen Context Awareness
// Read screen content to improve STT accuracy - matching AquaVoice's context-aware features

use std::sync::Arc;
use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use tokio::sync::RwLock;
use once_cell::sync::Lazy;

/// Global screen context manager
static SCREEN_CONTEXT: Lazy<Arc<ScreenContextManager>> = Lazy::new(|| {
    Arc::new(ScreenContextManager::new())
});

pub fn get_screen_context() -> Arc<ScreenContextManager> {
    SCREEN_CONTEXT.clone()
}

/// Type of application detected
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ApplicationType {
    /// Code editor (VS Code, Cursor, etc.)
    CodeEditor,
    /// Terminal/shell
    Terminal,
    /// Web browser
    Browser,
    /// Email client
    Email,
    /// Messaging app (Slack, Discord, etc.)
    Messaging,
    /// Document editor (Word, Docs, etc.)
    Document,
    /// Spreadsheet
    Spreadsheet,
    /// Notes app
    Notes,
    /// Calendar
    Calendar,
    /// Unknown/other
    Unknown,
}

impl Default for ApplicationType {
    fn default() -> Self {
        ApplicationType::Unknown
    }
}

/// Detected programming language in code editors
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DetectedLanguage {
    JavaScript,
    TypeScript,
    Python,
    Rust,
    Go,
    Java,
    CSharp,
    Cpp,
    Ruby,
    PHP,
    Swift,
    Kotlin,
    Shell,
    SQL,
    HTML,
    CSS,
    Markdown,
    JSON,
    YAML,
    Unknown,
}

/// Screen context information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScreenContext {
    /// Active application name
    pub app_name: String,
    /// Application type
    pub app_type: ApplicationType,
    /// Window title
    pub window_title: String,
    /// Detected programming language (for code editors)
    pub detected_language: Option<DetectedLanguage>,
    /// File path being edited (if applicable)
    pub file_path: Option<String>,
    /// Git branch (if in a git repository)
    pub git_branch: Option<String>,
    /// Visible text on screen (limited for privacy)
    pub visible_text: Option<String>,
    /// Extracted keywords for STT context
    pub context_keywords: Vec<String>,
    /// Timestamp
    pub timestamp: u64,
    /// Is this a sensitive context (should limit context capture)
    pub is_sensitive: bool,
}

impl Default for ScreenContext {
    fn default() -> Self {
        Self {
            app_name: String::new(),
            app_type: ApplicationType::Unknown,
            window_title: String::new(),
            detected_language: None,
            file_path: None,
            git_branch: None,
            visible_text: None,
            context_keywords: Vec::new(),
            timestamp: 0,
            is_sensitive: false,
        }
    }
}

/// Configuration for screen context capture
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScreenContextConfig {
    /// Enable screen context capture
    pub enabled: bool,
    /// Capture visible text (limited for privacy)
    pub capture_text: bool,
    /// Maximum characters to capture
    pub max_text_chars: usize,
    /// Apps to exclude from context capture (privacy)
    pub excluded_apps: Vec<String>,
    /// Enable OCR for screen text extraction
    pub enable_ocr: bool,
    /// Refresh interval in milliseconds
    pub refresh_interval_ms: u64,
}

impl Default for ScreenContextConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            capture_text: true,
            max_text_chars: 1000,
            excluded_apps: vec![
                "1Password".to_string(),
                "Keychain Access".to_string(),
                "LastPass".to_string(),
                "Bitwarden".to_string(),
                "KeePass".to_string(),
                "Authy".to_string(),
                "Banking".to_string(),
            ],
            enable_ocr: false, // OCR is resource-intensive, disabled by default
            refresh_interval_ms: 1000,
        }
    }
}

/// Screen context manager
pub struct ScreenContextManager {
    /// Current context
    current_context: RwLock<ScreenContext>,
    /// Configuration
    config: RwLock<ScreenContextConfig>,
    /// Application type detection patterns
    app_patterns: HashMap<&'static str, ApplicationType>,
    /// Is context capture running
    is_running: RwLock<bool>,
}

impl ScreenContextManager {
    pub fn new() -> Self {
        let mut app_patterns = HashMap::new();

        // Code editors
        app_patterns.insert("Code", ApplicationType::CodeEditor);
        app_patterns.insert("Visual Studio Code", ApplicationType::CodeEditor);
        app_patterns.insert("VSCode", ApplicationType::CodeEditor);
        app_patterns.insert("Cursor", ApplicationType::CodeEditor);
        app_patterns.insert("Zed", ApplicationType::CodeEditor);
        app_patterns.insert("Sublime Text", ApplicationType::CodeEditor);
        app_patterns.insert("Atom", ApplicationType::CodeEditor);
        app_patterns.insert("IntelliJ", ApplicationType::CodeEditor);
        app_patterns.insert("WebStorm", ApplicationType::CodeEditor);
        app_patterns.insert("PyCharm", ApplicationType::CodeEditor);
        app_patterns.insert("RustRover", ApplicationType::CodeEditor);
        app_patterns.insert("GoLand", ApplicationType::CodeEditor);
        app_patterns.insert("Android Studio", ApplicationType::CodeEditor);
        app_patterns.insert("Xcode", ApplicationType::CodeEditor);
        app_patterns.insert("Vim", ApplicationType::CodeEditor);
        app_patterns.insert("Neovim", ApplicationType::CodeEditor);
        app_patterns.insert("Emacs", ApplicationType::CodeEditor);

        // Terminals
        app_patterns.insert("Terminal", ApplicationType::Terminal);
        app_patterns.insert("iTerm", ApplicationType::Terminal);
        app_patterns.insert("Alacritty", ApplicationType::Terminal);
        app_patterns.insert("Warp", ApplicationType::Terminal);
        app_patterns.insert("Hyper", ApplicationType::Terminal);
        app_patterns.insert("Kitty", ApplicationType::Terminal);
        app_patterns.insert("Windows Terminal", ApplicationType::Terminal);
        app_patterns.insert("PowerShell", ApplicationType::Terminal);
        app_patterns.insert("cmd", ApplicationType::Terminal);
        app_patterns.insert("Command Prompt", ApplicationType::Terminal);

        // Browsers
        app_patterns.insert("Chrome", ApplicationType::Browser);
        app_patterns.insert("Firefox", ApplicationType::Browser);
        app_patterns.insert("Safari", ApplicationType::Browser);
        app_patterns.insert("Edge", ApplicationType::Browser);
        app_patterns.insert("Brave", ApplicationType::Browser);
        app_patterns.insert("Arc", ApplicationType::Browser);
        app_patterns.insert("Opera", ApplicationType::Browser);

        // Email
        app_patterns.insert("Mail", ApplicationType::Email);
        app_patterns.insert("Outlook", ApplicationType::Email);
        app_patterns.insert("Gmail", ApplicationType::Email);
        app_patterns.insert("Thunderbird", ApplicationType::Email);
        app_patterns.insert("Spark", ApplicationType::Email);
        app_patterns.insert("Superhuman", ApplicationType::Email);

        // Messaging
        app_patterns.insert("Slack", ApplicationType::Messaging);
        app_patterns.insert("Discord", ApplicationType::Messaging);
        app_patterns.insert("Teams", ApplicationType::Messaging);
        app_patterns.insert("Messages", ApplicationType::Messaging);
        app_patterns.insert("Telegram", ApplicationType::Messaging);
        app_patterns.insert("WhatsApp", ApplicationType::Messaging);
        app_patterns.insert("Signal", ApplicationType::Messaging);
        app_patterns.insert("Zoom", ApplicationType::Messaging);

        // Documents
        app_patterns.insert("Word", ApplicationType::Document);
        app_patterns.insert("Google Docs", ApplicationType::Document);
        app_patterns.insert("Pages", ApplicationType::Document);
        app_patterns.insert("LibreOffice Writer", ApplicationType::Document);
        app_patterns.insert("Notion", ApplicationType::Document);

        // Spreadsheets
        app_patterns.insert("Excel", ApplicationType::Spreadsheet);
        app_patterns.insert("Google Sheets", ApplicationType::Spreadsheet);
        app_patterns.insert("Numbers", ApplicationType::Spreadsheet);

        // Notes
        app_patterns.insert("Notes", ApplicationType::Notes);
        app_patterns.insert("Obsidian", ApplicationType::Notes);
        app_patterns.insert("Bear", ApplicationType::Notes);
        app_patterns.insert("Notion", ApplicationType::Notes);
        app_patterns.insert("Evernote", ApplicationType::Notes);

        // Calendar
        app_patterns.insert("Calendar", ApplicationType::Calendar);
        app_patterns.insert("Google Calendar", ApplicationType::Calendar);
        app_patterns.insert("Fantastical", ApplicationType::Calendar);

        Self {
            current_context: RwLock::new(ScreenContext::default()),
            config: RwLock::new(ScreenContextConfig::default()),
            app_patterns,
            is_running: RwLock::new(false),
        }
    }

    /// Set configuration
    pub async fn set_config(&self, config: ScreenContextConfig) {
        *self.config.write().await = config;
    }

    /// Get configuration
    pub async fn get_config(&self) -> ScreenContextConfig {
        self.config.read().await.clone()
    }

    /// Get current screen context
    pub async fn get_context(&self) -> ScreenContext {
        self.current_context.read().await.clone()
    }

    /// Start context capture loop
    pub async fn start_capture(&self) -> Result<(), String> {
        let config = self.config.read().await.clone();
        if !config.enabled {
            return Err("Screen context capture is disabled".to_string());
        }

        *self.is_running.write().await = true;

        // Start background capture loop
        let manager = get_screen_context();
        tokio::spawn(async move {
            manager.capture_loop().await;
        });

        tracing::info!("Screen context capture started");
        Ok(())
    }

    /// Stop context capture
    pub async fn stop_capture(&self) {
        *self.is_running.write().await = false;
        tracing::info!("Screen context capture stopped");
    }

    /// Background capture loop
    async fn capture_loop(&self) {
        loop {
            if !*self.is_running.read().await {
                break;
            }

            let config = self.config.read().await.clone();

            // Capture context
            if let Ok(context) = self.capture_context().await {
                *self.current_context.write().await = context;
            }

            // Wait for next refresh
            tokio::time::sleep(tokio::time::Duration::from_millis(config.refresh_interval_ms)).await;
        }
    }

    /// Capture current screen context
    pub async fn capture_context(&self) -> Result<ScreenContext, String> {
        let config = self.config.read().await.clone();

        // Get active window information
        // In production, this would use platform-specific APIs:
        // - macOS: CGWindowListCopyWindowInfo, NSWorkspace
        // - Windows: GetForegroundWindow, GetWindowText
        // - Linux: X11/Wayland APIs

        let (app_name, window_title) = self.get_active_window().await?;

        // Check if app is excluded
        if config.excluded_apps.iter().any(|e| app_name.contains(e)) {
            return Ok(ScreenContext {
                app_name,
                window_title,
                is_sensitive: true,
                timestamp: self.get_timestamp(),
                ..Default::default()
            });
        }

        // Detect application type
        let app_type = self.detect_app_type(&app_name);

        // Detect programming language from window title
        let detected_language = self.detect_language(&window_title);

        // Extract file path from window title
        let file_path = self.extract_file_path(&window_title);

        // Extract git branch
        let git_branch = self.extract_git_branch(&window_title);

        // Extract context keywords
        let context_keywords = self.extract_keywords(&app_name, &window_title, &detected_language);

        // Capture visible text if enabled
        let visible_text = if config.capture_text && config.enable_ocr {
            self.capture_visible_text(config.max_text_chars).await.ok()
        } else {
            None
        };

        Ok(ScreenContext {
            app_name,
            app_type,
            window_title,
            detected_language,
            file_path,
            git_branch,
            visible_text,
            context_keywords,
            timestamp: self.get_timestamp(),
            is_sensitive: false,
        })
    }

    /// Get active window information
    async fn get_active_window(&self) -> Result<(String, String), String> {
        // Platform-specific implementation would go here
        // For now, return simulated values

        #[cfg(target_os = "macos")]
        {
            // Would use CGWindowListCopyWindowInfo and NSWorkspace
            Ok(("Visual Studio Code".to_string(), "main.rs - VoiceCode".to_string()))
        }

        #[cfg(target_os = "windows")]
        {
            // Would use GetForegroundWindow and GetWindowText
            Ok(("Visual Studio Code".to_string(), "main.rs - VoiceCode".to_string()))
        }

        #[cfg(target_os = "linux")]
        {
            // Would use X11/Wayland APIs
            Ok(("Visual Studio Code".to_string(), "main.rs - VoiceCode".to_string()))
        }

        #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
        {
            Ok(("Unknown".to_string(), "".to_string()))
        }
    }

    /// Detect application type from app name
    fn detect_app_type(&self, app_name: &str) -> ApplicationType {
        for (pattern, app_type) in &self.app_patterns {
            if app_name.contains(pattern) {
                return *app_type;
            }
        }
        ApplicationType::Unknown
    }

    /// Detect programming language from window title
    fn detect_language(&self, window_title: &str) -> Option<DetectedLanguage> {
        let title_lower = window_title.to_lowercase();

        // Check file extension patterns
        if title_lower.contains(".rs") {
            return Some(DetectedLanguage::Rust);
        }
        if title_lower.contains(".ts") && !title_lower.contains(".tsx") {
            return Some(DetectedLanguage::TypeScript);
        }
        if title_lower.contains(".tsx") {
            return Some(DetectedLanguage::TypeScript);
        }
        if title_lower.contains(".js") && !title_lower.contains(".jsx") && !title_lower.contains(".json") {
            return Some(DetectedLanguage::JavaScript);
        }
        if title_lower.contains(".jsx") {
            return Some(DetectedLanguage::JavaScript);
        }
        if title_lower.contains(".py") {
            return Some(DetectedLanguage::Python);
        }
        if title_lower.contains(".go") {
            return Some(DetectedLanguage::Go);
        }
        if title_lower.contains(".java") {
            return Some(DetectedLanguage::Java);
        }
        if title_lower.contains(".cs") {
            return Some(DetectedLanguage::CSharp);
        }
        if title_lower.contains(".cpp") || title_lower.contains(".cc") || title_lower.contains(".c") {
            return Some(DetectedLanguage::Cpp);
        }
        if title_lower.contains(".rb") {
            return Some(DetectedLanguage::Ruby);
        }
        if title_lower.contains(".php") {
            return Some(DetectedLanguage::PHP);
        }
        if title_lower.contains(".swift") {
            return Some(DetectedLanguage::Swift);
        }
        if title_lower.contains(".kt") || title_lower.contains(".kts") {
            return Some(DetectedLanguage::Kotlin);
        }
        if title_lower.contains(".sh") || title_lower.contains(".bash") || title_lower.contains(".zsh") {
            return Some(DetectedLanguage::Shell);
        }
        if title_lower.contains(".sql") {
            return Some(DetectedLanguage::SQL);
        }
        if title_lower.contains(".html") || title_lower.contains(".htm") {
            return Some(DetectedLanguage::HTML);
        }
        if title_lower.contains(".css") || title_lower.contains(".scss") || title_lower.contains(".sass") {
            return Some(DetectedLanguage::CSS);
        }
        if title_lower.contains(".md") || title_lower.contains(".markdown") {
            return Some(DetectedLanguage::Markdown);
        }
        if title_lower.contains(".json") {
            return Some(DetectedLanguage::JSON);
        }
        if title_lower.contains(".yaml") || title_lower.contains(".yml") {
            return Some(DetectedLanguage::YAML);
        }

        None
    }

    /// Extract file path from window title
    fn extract_file_path(&self, window_title: &str) -> Option<String> {
        // Common patterns: "filename.ext - Project" or "Project - filename.ext"
        let parts: Vec<&str> = window_title.split(" - ").collect();

        for part in parts {
            let trimmed = part.trim();
            // Check if it looks like a file path
            if trimmed.contains('.') && !trimmed.contains(' ') {
                return Some(trimmed.to_string());
            }
            // Check for full path
            if trimmed.starts_with('/') || trimmed.starts_with("C:") || trimmed.starts_with("~") {
                return Some(trimmed.to_string());
            }
        }

        None
    }

    /// Extract git branch from window title
    fn extract_git_branch(&self, window_title: &str) -> Option<String> {
        // Common patterns: "(branch-name)" or "[branch-name]"
        let title = window_title;

        // Check for parentheses pattern
        if let Some(start) = title.find('(') {
            if let Some(end) = title[start..].find(')') {
                let branch = &title[start + 1..start + end];
                // Validate it looks like a branch name
                if !branch.contains(' ') && branch.len() < 50 {
                    return Some(branch.to_string());
                }
            }
        }

        // Check for brackets pattern
        if let Some(start) = title.find('[') {
            if let Some(end) = title[start..].find(']') {
                let branch = &title[start + 1..start + end];
                if !branch.contains(' ') && branch.len() < 50 {
                    return Some(branch.to_string());
                }
            }
        }

        None
    }

    /// Extract keywords for STT context
    fn extract_keywords(
        &self,
        app_name: &str,
        window_title: &str,
        detected_language: &Option<DetectedLanguage>,
    ) -> Vec<String> {
        let mut keywords = Vec::new();

        // Add app-specific keywords
        keywords.push(app_name.to_string());

        // Add language-specific keywords
        if let Some(lang) = detected_language {
            match lang {
                DetectedLanguage::Rust => {
                    keywords.extend(vec![
                        "fn".to_string(), "let".to_string(), "mut".to_string(),
                        "impl".to_string(), "struct".to_string(), "enum".to_string(),
                        "trait".to_string(), "pub".to_string(), "use".to_string(),
                        "mod".to_string(), "async".to_string(), "await".to_string(),
                        "Result".to_string(), "Option".to_string(), "Vec".to_string(),
                    ]);
                }
                DetectedLanguage::TypeScript | DetectedLanguage::JavaScript => {
                    keywords.extend(vec![
                        "const".to_string(), "let".to_string(), "function".to_string(),
                        "async".to_string(), "await".to_string(), "import".to_string(),
                        "export".to_string(), "interface".to_string(), "type".to_string(),
                        "React".to_string(), "useState".to_string(), "useEffect".to_string(),
                    ]);
                }
                DetectedLanguage::Python => {
                    keywords.extend(vec![
                        "def".to_string(), "class".to_string(), "import".to_string(),
                        "from".to_string(), "async".to_string(), "await".to_string(),
                        "self".to_string(), "None".to_string(), "True".to_string(),
                        "False".to_string(), "lambda".to_string(), "yield".to_string(),
                    ]);
                }
                DetectedLanguage::Go => {
                    keywords.extend(vec![
                        "func".to_string(), "var".to_string(), "const".to_string(),
                        "type".to_string(), "struct".to_string(), "interface".to_string(),
                        "go".to_string(), "chan".to_string(), "defer".to_string(),
                        "goroutine".to_string(), "nil".to_string(), "make".to_string(),
                    ]);
                }
                _ => {}
            }
        }

        // Extract words from window title
        for word in window_title.split(|c: char| !c.is_alphanumeric()) {
            if word.len() > 2 {
                keywords.push(word.to_string());
            }
        }

        keywords
    }

    /// Capture visible text using OCR (resource-intensive)
    async fn capture_visible_text(&self, max_chars: usize) -> Result<String, String> {
        // In production, this would:
        // 1. Capture screenshot of active window
        // 2. Run OCR (using tesseract or similar)
        // 3. Extract and return text

        // For now, return empty - OCR integration would go here
        Ok(String::new())
    }

    fn get_timestamp(&self) -> u64 {
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs()
    }

    /// Generate STT context prompt from current screen context
    pub async fn generate_stt_prompt(&self) -> String {
        let context = self.current_context.read().await.clone();

        if context.is_sensitive {
            return String::new();
        }

        let mut prompt_parts = Vec::new();

        // Add application context
        prompt_parts.push(format!("Application: {}", context.app_name));

        // Add language context
        if let Some(lang) = &context.detected_language {
            prompt_parts.push(format!("Programming language: {:?}", lang));
        }

        // Add file context
        if let Some(file) = &context.file_path {
            prompt_parts.push(format!("File: {}", file));
        }

        // Add keywords
        if !context.context_keywords.is_empty() {
            prompt_parts.push(format!(
                "Context keywords: {}",
                context.context_keywords.join(", ")
            ));
        }

        prompt_parts.join("\n")
    }
}

// Tauri commands

#[tauri::command]
pub async fn get_screen_context_config() -> Result<ScreenContextConfig, String> {
    Ok(get_screen_context().get_config().await)
}

#[tauri::command]
pub async fn set_screen_context_config(config: ScreenContextConfig) -> Result<(), String> {
    get_screen_context().set_config(config).await;
    Ok(())
}

#[tauri::command]
pub async fn start_screen_context_capture() -> Result<(), String> {
    get_screen_context().start_capture().await
}

#[tauri::command]
pub async fn stop_screen_context_capture() -> Result<(), String> {
    get_screen_context().stop_capture().await;
    Ok(())
}

#[tauri::command]
pub async fn get_current_screen_context() -> Result<ScreenContext, String> {
    Ok(get_screen_context().get_context().await)
}

#[tauri::command]
pub async fn capture_screen_context_now() -> Result<ScreenContext, String> {
    get_screen_context().capture_context().await
}

#[tauri::command]
pub async fn generate_stt_context_prompt() -> Result<String, String> {
    Ok(get_screen_context().generate_stt_prompt().await)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_screen_context_manager() {
        let manager = ScreenContextManager::new();

        let context = manager.capture_context().await.unwrap();
        assert!(!context.app_name.is_empty());
    }

    #[tokio::test]
    async fn test_app_type_detection() {
        let manager = ScreenContextManager::new();

        assert_eq!(
            manager.detect_app_type("Visual Studio Code"),
            ApplicationType::CodeEditor
        );
        assert_eq!(
            manager.detect_app_type("Terminal"),
            ApplicationType::Terminal
        );
        assert_eq!(
            manager.detect_app_type("Chrome"),
            ApplicationType::Browser
        );
    }

    #[tokio::test]
    async fn test_language_detection() {
        let manager = ScreenContextManager::new();

        assert!(matches!(
            manager.detect_language("main.rs - VoiceCode"),
            Some(DetectedLanguage::Rust)
        ));
        assert!(matches!(
            manager.detect_language("App.tsx - React"),
            Some(DetectedLanguage::TypeScript)
        ));
        assert!(matches!(
            manager.detect_language("script.py - Python"),
            Some(DetectedLanguage::Python)
        ));
    }
}
