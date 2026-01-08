use serde::{Deserialize, Serialize};
use tauri::command;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppSettings {
    pub language: String,
    pub audio_quality: String,
    pub auto_transcribe: bool,
    pub dark_mode: bool,
    pub hotkey_start_recording: String,
    pub hotkey_stop_recording: String,
    pub output_directory: String,
    pub cloud_sync_enabled: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            language: "en-US".to_string(),
            audio_quality: "high".to_string(),
            auto_transcribe: true,
            dark_mode: false,
            hotkey_start_recording: "Ctrl+Shift+R".to_string(),
            hotkey_stop_recording: "Ctrl+Shift+S".to_string(),
            output_directory: "".to_string(),
            cloud_sync_enabled: false,
        }
    }
}

#[command]
pub async fn get_settings() -> Result<AppSettings, String> {
    log::info!("Getting application settings");
    
    // TODO: Load settings from persistent storage
    Ok(AppSettings::default())
}

#[command]
pub async fn save_settings(settings: AppSettings) -> Result<bool, String> {
    log::info!("Saving application settings: {:?}", settings);
    
    // TODO: Save settings to persistent storage
    Ok(true)
}

