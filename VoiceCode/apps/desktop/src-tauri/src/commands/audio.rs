// Audio Commands - Tauri commands for audio capture
// Provides microphone recording functionality using cpal

use serde::{Deserialize, Serialize};
use tauri::command;
use std::path::PathBuf;

use crate::audio_capture::{
    AudioCaptureConfig, AudioDeviceInfo,
    get_audio_service, init_audio_service,
};

/// Audio device information for the frontend
#[derive(Debug, Serialize, Deserialize)]
pub struct AudioDevice {
    pub id: String,
    pub name: String,
    pub is_default: bool,
    pub supported_sample_rates: Vec<u32>,
}

impl From<AudioDeviceInfo> for AudioDevice {
    fn from(info: AudioDeviceInfo) -> Self {
        // Extract unique sample rates from supported configs
        let mut sample_rates: Vec<u32> = info
            .supported_configs
            .iter()
            .flat_map(|c| vec![c.min_sample_rate, c.max_sample_rate])
            .collect();
        sample_rates.sort();
        sample_rates.dedup();

        Self {
            id: info.id,
            name: info.name,
            is_default: info.is_default,
            supported_sample_rates: sample_rates,
        }
    }
}

/// Result of a recording operation
#[derive(Debug, Serialize, Deserialize)]
pub struct RecordingResult {
    pub success: bool,
    pub file_path: Option<String>,
    pub duration_ms: Option<u64>,
    pub error: Option<String>,
}

impl RecordingResult {
    fn success(file_path: PathBuf, duration_ms: u64) -> Self {
        Self {
            success: true,
            file_path: Some(file_path.to_string_lossy().to_string()),
            duration_ms: Some(duration_ms),
            error: None,
        }
    }

    fn error(message: String) -> Self {
        Self {
            success: false,
            file_path: None,
            duration_ms: None,
            error: Some(message),
        }
    }

    fn in_progress() -> Self {
        Self {
            success: true,
            file_path: None,
            duration_ms: None,
            error: None,
        }
    }
}

/// Recording status
#[derive(Debug, Serialize, Deserialize)]
pub struct RecordingStatus {
    pub is_recording: bool,
    pub file_path: Option<String>,
    pub duration_ms: u64,
}

/// Audio settings
#[derive(Debug, Serialize, Deserialize)]
pub struct AudioSettings {
    pub sample_rate: u32,
    pub channels: u16,
    pub bits_per_sample: u16,
    pub output_dir: Option<String>,
}

impl Default for AudioSettings {
    fn default() -> Self {
        Self {
            sample_rate: 16000,
            channels: 1,
            bits_per_sample: 16,
            output_dir: None,
        }
    }
}

/// Initialize the audio capture service
#[command]
pub async fn init_audio(settings: Option<AudioSettings>) -> Result<bool, String> {
    let settings = settings.unwrap_or_default();

    let config = AudioCaptureConfig {
        sample_rate: settings.sample_rate,
        channels: settings.channels,
        bits_per_sample: settings.bits_per_sample,
        output_dir: settings
            .output_dir
            .map(PathBuf::from)
            .unwrap_or_else(std::env::temp_dir),
    };

    init_audio_service(config).map_err(|e| e.to_string())?;
    log::info!("Audio capture service initialized");
    Ok(true)
}

/// Start recording audio from the microphone
#[command]
pub async fn start_recording(device_id: Option<String>) -> Result<RecordingResult, String> {
    log::info!("Starting recording with device: {:?}", device_id);

    // Ensure service is initialized
    let mut guard = get_audio_service().map_err(|e| e.to_string())?;

    // Initialize with defaults if not yet initialized
    if guard.is_none() {
        drop(guard);
        init_audio_service(AudioCaptureConfig::default()).map_err(|e| e.to_string())?;
        guard = get_audio_service().map_err(|e| e.to_string())?;
    }

    let service = guard.as_ref().ok_or("Audio service not initialized")?;

    match service.start_recording(device_id.as_deref()) {
        Ok(file_path) => {
            log::info!("Recording started: {:?}", file_path);
            Ok(RecordingResult::in_progress())
        }
        Err(e) => {
            log::error!("Failed to start recording: {}", e);
            Ok(RecordingResult::error(e.to_string()))
        }
    }
}

/// Stop the current recording and save the file
#[command]
pub async fn stop_recording() -> Result<RecordingResult, String> {
    log::info!("Stopping recording");

    let guard = get_audio_service().map_err(|e| e.to_string())?;
    let service = guard.as_ref().ok_or("Audio service not initialized")?;

    match service.stop_recording() {
        Ok((file_path, duration_ms)) => {
            log::info!("Recording saved: {:?} ({} ms)", file_path, duration_ms);
            Ok(RecordingResult::success(file_path, duration_ms))
        }
        Err(e) => {
            log::error!("Failed to stop recording: {}", e);
            Ok(RecordingResult::error(e.to_string()))
        }
    }
}

/// Cancel the current recording without saving
#[command]
pub async fn cancel_recording() -> Result<bool, String> {
    log::info!("Cancelling recording");

    let guard = get_audio_service().map_err(|e| e.to_string())?;
    let service = guard.as_ref().ok_or("Audio service not initialized")?;

    service.cancel_recording();
    Ok(true)
}

/// Get the current recording status
#[command]
pub async fn get_recording_status() -> Result<RecordingStatus, String> {
    let guard = get_audio_service().map_err(|e| e.to_string())?;
    let service = guard.as_ref().ok_or("Audio service not initialized")?;

    let state = service.get_state();
    let duration_ms = service.get_duration_ms();

    Ok(RecordingStatus {
        is_recording: state.is_recording,
        file_path: state.file_path.map(|p| p.to_string_lossy().to_string()),
        duration_ms,
    })
}

/// Get list of available audio input devices
#[command]
pub async fn get_audio_devices() -> Result<Vec<AudioDevice>, String> {
    log::info!("Getting audio devices");

    // Ensure service is initialized
    let mut guard = get_audio_service().map_err(|e| e.to_string())?;

    // Initialize with defaults if not yet initialized
    if guard.is_none() {
        drop(guard);
        init_audio_service(AudioCaptureConfig::default()).map_err(|e| e.to_string())?;
        guard = get_audio_service().map_err(|e| e.to_string())?;
    }

    let service = guard.as_ref().ok_or("Audio service not initialized")?;

    match service.list_devices() {
        Ok(devices) => {
            log::info!("Found {} audio devices", devices.len());
            Ok(devices.into_iter().map(AudioDevice::from).collect())
        }
        Err(e) => {
            log::error!("Failed to list audio devices: {}", e);
            // Return empty list with an error log instead of failing
            Ok(vec![])
        }
    }
}

/// Get the default audio input device
#[command]
pub async fn get_default_audio_device() -> Result<Option<AudioDevice>, String> {
    log::info!("Getting default audio device");

    let mut guard = get_audio_service().map_err(|e| e.to_string())?;

    if guard.is_none() {
        drop(guard);
        init_audio_service(AudioCaptureConfig::default()).map_err(|e| e.to_string())?;
        guard = get_audio_service().map_err(|e| e.to_string())?;
    }

    let service = guard.as_ref().ok_or("Audio service not initialized")?;

    match service.default_device() {
        Ok(device) => {
            log::info!("Default device: {}", device.name);
            Ok(Some(AudioDevice::from(device)))
        }
        Err(e) => {
            log::warn!("No default audio device: {}", e);
            Ok(None)
        }
    }
}

/// Check if audio recording is available
#[command]
pub async fn is_audio_available() -> Result<bool, String> {
    let mut guard = get_audio_service().map_err(|e| e.to_string())?;

    if guard.is_none() {
        drop(guard);
        match init_audio_service(AudioCaptureConfig::default()) {
            Ok(_) => {
                guard = get_audio_service().map_err(|e| e.to_string())?;
            }
            Err(_) => return Ok(false),
        }
    }

    let service = guard.as_ref().ok_or("Audio service not initialized")?;

    // Check if we have at least one input device
    match service.list_devices() {
        Ok(devices) => Ok(!devices.is_empty()),
        Err(_) => Ok(false),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_audio_settings_default() {
        let settings = AudioSettings::default();
        assert_eq!(settings.sample_rate, 16000);
        assert_eq!(settings.channels, 1);
        assert_eq!(settings.bits_per_sample, 16);
    }

    #[test]
    fn test_recording_result_success() {
        let result = RecordingResult::success(PathBuf::from("test.wav"), 5000);
        assert!(result.success);
        assert_eq!(result.file_path.unwrap(), "test.wav");
        assert_eq!(result.duration_ms.unwrap(), 5000);
    }

    #[test]
    fn test_recording_result_error() {
        let result = RecordingResult::error("Test error".to_string());
        assert!(!result.success);
        assert!(result.file_path.is_none());
        assert_eq!(result.error.unwrap(), "Test error");
    }
}
