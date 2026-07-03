// Global Dictation Module
// Enables system-wide dictation into any text field (like Dragon NaturallySpeaking)

use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex;
use tauri::{AppHandle, GlobalShortcutManager, Manager};
use clipboard::{ClipboardContext, ClipboardProvider};
use enigo::{Enigo, Key, Settings, Keyboard, Direction};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GlobalDictationConfig {
    pub enabled: bool,
    pub hotkey: String,
    pub auto_paste: bool,
    pub show_notification: bool,
    pub language: String,
    pub save_history: bool,
    pub max_history_items: usize,
    pub auto_punctuation: bool,
    pub voice_commands_enabled: bool,
}

impl Default for GlobalDictationConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            hotkey: "CmdOrCtrl+Shift+D".to_string(),
            auto_paste: true,
            show_notification: true,
            language: "en-US".to_string(),
            save_history: true,
            max_history_items: 100,
            auto_punctuation: true,
            voice_commands_enabled: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DictationSession {
    pub id: String,
    pub is_active: bool,
    pub text: String,
    pub start_time: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DictationHistoryItem {
    pub id: String,
    pub text: String,
    pub timestamp: u64,
    pub language: String,
    pub word_count: usize,
    pub duration_ms: u64,
    pub application: Option<String>,
}

#[derive(Debug)]
pub struct GlobalDictationManager {
    config: Arc<Mutex<GlobalDictationConfig>>,
    session: Arc<Mutex<Option<DictationSession>>>,
    history: Arc<Mutex<Vec<DictationHistoryItem>>>,
    app_handle: AppHandle,
}

impl GlobalDictationManager {
    pub fn new(app_handle: AppHandle) -> Self {
        Self {
            config: Arc::new(Mutex::new(GlobalDictationConfig::default())),
            session: Arc::new(Mutex::new(None)),
            history: Arc::new(Mutex::new(Vec::new())),
            app_handle,
        }
    }

    /// Register the global hotkey for dictation
    pub async fn register_hotkey(&self) -> Result<(), String> {
        let config = self.config.lock().await;
        
        if !config.enabled {
            return Ok(());
        }

        let hotkey = config.hotkey.clone();
        let app_handle = self.app_handle.clone();
        
        // Register global shortcut
        let mut shortcut_manager = app_handle.global_shortcut_manager();
        
        shortcut_manager
            .register(&hotkey, move || {
                // Trigger dictation start/stop
                let _ = app_handle.emit_all("global-dictation-toggle", ());
            })
            .map_err(|e| format!("Failed to register global hotkey: {}", e))?;

        Ok(())
    }

    /// Unregister the global hotkey
    pub async fn unregister_hotkey(&self) -> Result<(), String> {
        let config = self.config.lock().await;
        let hotkey = config.hotkey.clone();
        
        let mut shortcut_manager = self.app_handle.global_shortcut_manager();
        shortcut_manager
            .unregister(&hotkey)
            .map_err(|e| format!("Failed to unregister global hotkey: {}", e))?;

        Ok(())
    }

    /// Start a global dictation session
    pub async fn start_session(&self) -> Result<(), String> {
        let mut session = self.session.lock().await;
        
        if session.is_some() {
            return Err("Dictation session already active".to_string());
        }

        *session = Some(DictationSession {
            id: uuid::Uuid::new_v4().to_string(),
            is_active: true,
            text: String::new(),
            start_time: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        });

        // Show notification
        let config = self.config.lock().await;
        if config.show_notification {
            let _ = tauri::api::notification::Notification::new(&self.app_handle.config().tauri.bundle.identifier)
                .title("VoiceFlow Pro")
                .body("🎤 Global dictation started - speak now!")
                .show();
        }

        Ok(())
    }

    /// Stop the dictation session and paste the text
    pub async fn stop_session(&self) -> Result<String, String> {
        let mut session = self.session.lock().await;

        let dictation_session = session.take().ok_or("No active dictation session")?;

        let text = dictation_session.text.clone();
        let start_time = dictation_session.start_time;

        // Calculate duration
        let duration_ms = (std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs() - start_time) * 1000;

        // Save to history if enabled
        let config = self.config.lock().await;
        if config.save_history && !text.is_empty() {
            let history_item = DictationHistoryItem {
                id: dictation_session.id.clone(),
                text: text.clone(),
                timestamp: start_time,
                language: config.language.clone(),
                word_count: text.split_whitespace().count(),
                duration_ms,
                application: None, // TODO: Detect active application
            };

            let mut history = self.history.lock().await;
            history.push(history_item);

            // Trim history to max items
            let history_len = history.len();
            if history_len > config.max_history_items {
                history.drain(0..history_len - config.max_history_items);
            }
        }

        // Auto-paste if enabled
        if config.auto_paste && !text.is_empty() {
            self.paste_text(&text).await?;
        }

        // Show notification
        if config.show_notification {
            let _ = tauri::api::notification::Notification::new(&self.app_handle.config().tauri.bundle.identifier)
                .title("VoiceFlow Pro")
                .body(&format!("✅ Dictation complete - {} words", text.split_whitespace().count()))
                .show();
        }

        Ok(text)
    }

    /// Update the dictation text in real-time
    pub async fn update_text(&self, text: String) -> Result<(), String> {
        let mut session = self.session.lock().await;
        
        if let Some(ref mut s) = *session {
            s.text = text;
            Ok(())
        } else {
            Err("No active dictation session".to_string())
        }
    }

    /// Paste text into the active application using clipboard + Ctrl+V
    async fn paste_text(&self, text: &str) -> Result<(), String> {
        // Copy to clipboard
        let mut ctx: ClipboardContext = ClipboardProvider::new()
            .map_err(|e| format!("Failed to access clipboard: {}", e))?;

        ctx.set_contents(text.to_string())
            .map_err(|e| format!("Failed to set clipboard: {}", e))?;

        // Small delay to ensure clipboard is set
        tokio::time::sleep(tokio::time::Duration::from_millis(50)).await;

        // Simulate Ctrl+V (or Cmd+V on macOS) using enigo 0.2 API
        let settings = Settings::default();
        let mut enigo = Enigo::new(&settings)
            .map_err(|e| format!("Failed to create enigo instance: {}", e))?;

        #[cfg(target_os = "macos")]
        {
            enigo.key(Key::Meta, Direction::Press)
                .map_err(|e| format!("Failed to press Meta key: {}", e))?;
            enigo.key(Key::Unicode('v'), Direction::Click)
                .map_err(|e| format!("Failed to click V key: {}", e))?;
            enigo.key(Key::Meta, Direction::Release)
                .map_err(|e| format!("Failed to release Meta key: {}", e))?;
        }

        #[cfg(not(target_os = "macos"))]
        {
            enigo.key(Key::Control, Direction::Press)
                .map_err(|e| format!("Failed to press Control key: {}", e))?;
            enigo.key(Key::Unicode('v'), Direction::Click)
                .map_err(|e| format!("Failed to click V key: {}", e))?;
            enigo.key(Key::Control, Direction::Release)
                .map_err(|e| format!("Failed to release Control key: {}", e))?;
        }

        Ok(())
    }

    /// Get current session status
    pub async fn get_session_status(&self) -> Option<DictationSession> {
        let session = self.session.lock().await;
        session.clone()
    }

    /// Update configuration
    pub async fn update_config(&self, config: GlobalDictationConfig) -> Result<(), String> {
        // Unregister old hotkey
        self.unregister_hotkey().await?;
        
        // Update config
        let mut current_config = self.config.lock().await;
        *current_config = config;
        
        // Register new hotkey
        drop(current_config);
        self.register_hotkey().await?;

        Ok(())
    }

    /// Get current configuration
    pub async fn get_config(&self) -> GlobalDictationConfig {
        self.config.lock().await.clone()
    }

    /// Get dictation history
    pub async fn get_history(&self) -> Vec<DictationHistoryItem> {
        self.history.lock().await.clone()
    }

    /// Clear dictation history
    pub async fn clear_history(&self) -> Result<(), String> {
        let mut history = self.history.lock().await;
        history.clear();
        Ok(())
    }

    /// Delete specific history item
    pub async fn delete_history_item(&self, id: String) -> Result<(), String> {
        let mut history = self.history.lock().await;
        history.retain(|item| item.id != id);
        Ok(())
    }

    /// Get history statistics
    pub async fn get_history_stats(&self) -> HistoryStats {
        let history = self.history.lock().await;
        let total_words: usize = history.iter().map(|item| item.word_count).sum();
        let total_duration_ms: u64 = history.iter().map(|item| item.duration_ms).sum();

        HistoryStats {
            total_sessions: history.len(),
            total_words,
            total_duration_ms,
            average_words_per_session: if history.is_empty() { 0 } else { total_words / history.len() },
            average_duration_ms: if history.is_empty() { 0 } else { total_duration_ms / history.len() as u64 },
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoryStats {
    pub total_sessions: usize,
    pub total_words: usize,
    pub total_duration_ms: u64,
    pub average_words_per_session: usize,
    pub average_duration_ms: u64,
}

// Tauri commands for global dictation

#[tauri::command]
pub async fn start_global_dictation(
    state: tauri::State<'_, Arc<Mutex<GlobalDictationManager>>>,
) -> Result<(), String> {
    let manager = state.lock().await;
    manager.start_session().await
}

#[tauri::command]
pub async fn stop_global_dictation(
    state: tauri::State<'_, Arc<Mutex<GlobalDictationManager>>>,
) -> Result<String, String> {
    let manager = state.lock().await;
    manager.stop_session().await
}

#[tauri::command]
pub async fn update_global_dictation_text(
    state: tauri::State<'_, Arc<Mutex<GlobalDictationManager>>>,
    text: String,
) -> Result<(), String> {
    let manager = state.lock().await;
    manager.update_text(text).await
}

#[tauri::command]
pub async fn get_global_dictation_status(
    state: tauri::State<'_, Arc<Mutex<GlobalDictationManager>>>,
) -> Result<Option<DictationSession>, String> {
    let manager = state.lock().await;
    Ok(manager.get_session_status().await)
}

#[tauri::command]
pub async fn update_global_dictation_config(
    state: tauri::State<'_, Arc<Mutex<GlobalDictationManager>>>,
    config: GlobalDictationConfig,
) -> Result<(), String> {
    let manager = state.lock().await;
    manager.update_config(config).await
}

#[tauri::command]
pub async fn get_global_dictation_config(
    state: tauri::State<'_, Arc<Mutex<GlobalDictationManager>>>,
) -> Result<GlobalDictationConfig, String> {
    let manager = state.lock().await;
    Ok(manager.get_config().await)
}

#[tauri::command]
pub async fn get_dictation_history(
    state: tauri::State<'_, Arc<Mutex<GlobalDictationManager>>>,
) -> Result<Vec<DictationHistoryItem>, String> {
    let manager = state.lock().await;
    Ok(manager.get_history().await)
}

#[tauri::command]
pub async fn clear_dictation_history(
    state: tauri::State<'_, Arc<Mutex<GlobalDictationManager>>>,
) -> Result<(), String> {
    let manager = state.lock().await;
    manager.clear_history().await
}

#[tauri::command]
pub async fn delete_dictation_history_item(
    state: tauri::State<'_, Arc<Mutex<GlobalDictationManager>>>,
    id: String,
) -> Result<(), String> {
    let manager = state.lock().await;
    manager.delete_history_item(id).await
}

#[tauri::command]
pub async fn get_dictation_history_stats(
    state: tauri::State<'_, Arc<Mutex<GlobalDictationManager>>>,
) -> Result<HistoryStats, String> {
    let manager = state.lock().await;
    Ok(manager.get_history_stats().await)
}

