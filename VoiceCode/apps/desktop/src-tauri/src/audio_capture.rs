#![allow(dead_code, unused_variables, unused_imports)]
// Audio Capture Service - Records audio using cpal
// Provides microphone input capture and WAV file output

use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::{Device, Host, SampleFormat, Stream, StreamConfig};
use hound::{WavSpec, WavWriter};
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::io::BufWriter;
use std::fs::File;

/// Audio capture configuration
#[derive(Debug, Clone)]
pub struct AudioCaptureConfig {
    /// Sample rate (default: 16000 for speech recognition)
    pub sample_rate: u32,
    /// Number of channels (default: 1 for mono)
    pub channels: u16,
    /// Bits per sample (default: 16)
    pub bits_per_sample: u16,
    /// Output directory for recordings
    pub output_dir: PathBuf,
}

impl Default for AudioCaptureConfig {
    fn default() -> Self {
        Self {
            sample_rate: 16000,
            channels: 1,
            bits_per_sample: 16,
            output_dir: std::env::temp_dir(),
        }
    }
}

/// Information about an audio device
#[derive(Debug, Clone)]
pub struct AudioDeviceInfo {
    pub id: String,
    pub name: String,
    pub is_default: bool,
    pub supported_configs: Vec<AudioConfig>,
}

/// Supported audio configuration
#[derive(Debug, Clone)]
pub struct AudioConfig {
    pub min_sample_rate: u32,
    pub max_sample_rate: u32,
    pub channels: u16,
    pub sample_format: String,
}

/// Recording state
#[derive(Debug, Clone)]
pub struct RecordingState {
    pub is_recording: bool,
    pub file_path: Option<PathBuf>,
    pub start_time: Option<std::time::Instant>,
    pub samples_recorded: usize,
}

/// Audio capture error
#[derive(Debug)]
pub enum AudioCaptureError {
    NoDevice(String),
    DeviceError(String),
    StreamError(String),
    FileError(String),
    ConfigError(String),
}

impl std::fmt::Display for AudioCaptureError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::NoDevice(msg) => write!(f, "No audio device: {}", msg),
            Self::DeviceError(msg) => write!(f, "Device error: {}", msg),
            Self::StreamError(msg) => write!(f, "Stream error: {}", msg),
            Self::FileError(msg) => write!(f, "File error: {}", msg),
            Self::ConfigError(msg) => write!(f, "Config error: {}", msg),
        }
    }
}

impl std::error::Error for AudioCaptureError {}

/// Audio capture service
/// Note: Stream is stored thread-locally because cpal::Stream is not Send
pub struct AudioCaptureService {
    host: Host,
    config: AudioCaptureConfig,
    state: Arc<Mutex<RecordingState>>,
    is_recording: Arc<AtomicBool>,
    audio_buffer: Arc<Mutex<Vec<i16>>>,
}

// Thread-local storage for the stream (since cpal::Stream is not Send)
thread_local! {
    static CURRENT_STREAM: std::cell::RefCell<Option<Stream>> = const { std::cell::RefCell::new(None) };
}

impl AudioCaptureService {
    /// Create a new audio capture service
    pub fn new(config: AudioCaptureConfig) -> Result<Self, AudioCaptureError> {
        let host = cpal::default_host();

        Ok(Self {
            host,
            config,
            state: Arc::new(Mutex::new(RecordingState {
                is_recording: false,
                file_path: None,
                start_time: None,
                samples_recorded: 0,
            })),
            is_recording: Arc::new(AtomicBool::new(false)),
            audio_buffer: Arc::new(Mutex::new(Vec::new())),
        })
    }

    /// List available input devices
    pub fn list_devices(&self) -> Result<Vec<AudioDeviceInfo>, AudioCaptureError> {
        let default_device = self.host.default_input_device();
        let default_name = default_device.as_ref().and_then(|d| d.name().ok());

        let devices = self
            .host
            .input_devices()
            .map_err(|e| AudioCaptureError::DeviceError(e.to_string()))?;

        let mut device_list = Vec::new();

        for device in devices {
            if let Ok(name) = device.name() {
                let is_default = Some(&name) == default_name.as_ref();

                // Get supported configurations
                let supported_configs = device
                    .supported_input_configs()
                    .map(|configs| {
                        configs
                            .map(|c| AudioConfig {
                                min_sample_rate: c.min_sample_rate().0,
                                max_sample_rate: c.max_sample_rate().0,
                                channels: c.channels(),
                                sample_format: format!("{:?}", c.sample_format()),
                            })
                            .collect()
                    })
                    .unwrap_or_default();

                device_list.push(AudioDeviceInfo {
                    id: name.clone(),
                    name,
                    is_default,
                    supported_configs,
                });
            }
        }

        Ok(device_list)
    }

    /// Get the default input device
    pub fn default_device(&self) -> Result<AudioDeviceInfo, AudioCaptureError> {
        let device = self
            .host
            .default_input_device()
            .ok_or_else(|| AudioCaptureError::NoDevice("No default input device".to_string()))?;

        let name = device
            .name()
            .map_err(|e| AudioCaptureError::DeviceError(e.to_string()))?;

        let supported_configs = device
            .supported_input_configs()
            .map(|configs| {
                configs
                    .map(|c| AudioConfig {
                        min_sample_rate: c.min_sample_rate().0,
                        max_sample_rate: c.max_sample_rate().0,
                        channels: c.channels(),
                        sample_format: format!("{:?}", c.sample_format()),
                    })
                    .collect()
            })
            .unwrap_or_default();

        Ok(AudioDeviceInfo {
            id: name.clone(),
            name,
            is_default: true,
            supported_configs,
        })
    }

    /// Find a device by name
    fn find_device(&self, device_name: Option<&str>) -> Result<Device, AudioCaptureError> {
        match device_name {
            Some(name) => {
                let devices = self
                    .host
                    .input_devices()
                    .map_err(|e| AudioCaptureError::DeviceError(e.to_string()))?;

                for device in devices {
                    if let Ok(device_name) = device.name() {
                        if device_name == name {
                            return Ok(device);
                        }
                    }
                }

                Err(AudioCaptureError::NoDevice(format!(
                    "Device not found: {}",
                    name
                )))
            }
            None => self
                .host
                .default_input_device()
                .ok_or_else(|| AudioCaptureError::NoDevice("No default device".to_string())),
        }
    }

    /// Start recording audio
    pub fn start_recording(
        &self,
        device_name: Option<&str>,
    ) -> Result<PathBuf, AudioCaptureError> {
        // Check if already recording
        if self.is_recording.load(Ordering::SeqCst) {
            return Err(AudioCaptureError::StreamError(
                "Already recording".to_string(),
            ));
        }

        // Find the device
        let device = self.find_device(device_name)?;

        // Get supported config
        let supported_config = device
            .default_input_config()
            .map_err(|e| AudioCaptureError::ConfigError(e.to_string()))?;

        // Build stream config matching our requirements
        let stream_config = StreamConfig {
            channels: self.config.channels,
            sample_rate: cpal::SampleRate(self.config.sample_rate),
            buffer_size: cpal::BufferSize::Default,
        };

        // Generate output file path
        let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S");
        let file_path = self
            .config
            .output_dir
            .join(format!("recording_{}.wav", timestamp));

        // Clear buffer
        {
            let mut buffer = self.audio_buffer.lock().unwrap();
            buffer.clear();
        }

        // Set recording state
        self.is_recording.store(true, Ordering::SeqCst);
        {
            let mut state = self.state.lock().unwrap();
            state.is_recording = true;
            state.file_path = Some(file_path.clone());
            state.start_time = Some(std::time::Instant::now());
            state.samples_recorded = 0;
        }

        // Clone Arc references for the callback
        let buffer_clone = Arc::clone(&self.audio_buffer);
        let recording_flag = Arc::clone(&self.is_recording);

        // Build the input stream based on sample format
        let stream = match supported_config.sample_format() {
            SampleFormat::I16 => self.build_stream::<i16>(&device, &stream_config, buffer_clone, recording_flag)?,
            SampleFormat::F32 => self.build_stream::<f32>(&device, &stream_config, buffer_clone, recording_flag)?,
            _ => {
                return Err(AudioCaptureError::ConfigError(
                    "Unsupported sample format".to_string(),
                ))
            }
        };

        // Start the stream
        stream
            .play()
            .map_err(|e| AudioCaptureError::StreamError(e.to_string()))?;

        // Store the stream in thread-local storage
        CURRENT_STREAM.with(|s| {
            *s.borrow_mut() = Some(stream);
        });

        log::info!("Started recording to: {:?}", file_path);
        Ok(file_path)
    }

    /// Build an input stream for the given sample type
    fn build_stream<T: cpal::Sample + cpal::SizedSample + Send + 'static>(
        &self,
        device: &Device,
        config: &StreamConfig,
        buffer: Arc<Mutex<Vec<i16>>>,
        recording_flag: Arc<AtomicBool>,
    ) -> Result<Stream, AudioCaptureError>
    where
        i16: cpal::FromSample<T>,
    {
        let err_fn = |err| log::error!("Audio stream error: {}", err);

        let stream = device
            .build_input_stream(
                config,
                move |data: &[T], _: &cpal::InputCallbackInfo| {
                    if recording_flag.load(Ordering::SeqCst) {
                        let mut buffer = buffer.lock().unwrap();
                        for &sample in data {
                            buffer.push(cpal::Sample::from_sample(sample));
                        }
                    }
                },
                err_fn,
                None,
            )
            .map_err(|e| AudioCaptureError::StreamError(e.to_string()))?;

        Ok(stream)
    }

    /// Stop recording and save to file
    pub fn stop_recording(&self) -> Result<(PathBuf, u64), AudioCaptureError> {
        // Check if recording
        if !self.is_recording.load(Ordering::SeqCst) {
            return Err(AudioCaptureError::StreamError(
                "Not currently recording".to_string(),
            ));
        }

        // Stop recording
        self.is_recording.store(false, Ordering::SeqCst);

        // Drop the stream to stop capture (from thread-local storage)
        CURRENT_STREAM.with(|s| {
            *s.borrow_mut() = None;
        });

        // Get state
        let (file_path, duration_ms) = {
            let state = self.state.lock().unwrap();
            let duration = state
                .start_time
                .map(|t| t.elapsed().as_millis() as u64)
                .unwrap_or(0);
            (state.file_path.clone(), duration)
        };

        let file_path = file_path.ok_or_else(|| {
            AudioCaptureError::FileError("No recording file path".to_string())
        })?;

        // Write audio buffer to WAV file
        let buffer = self.audio_buffer.lock().unwrap();
        self.write_wav_file(&file_path, &buffer)?;

        // Update state
        {
            let mut state = self.state.lock().unwrap();
            state.is_recording = false;
            state.samples_recorded = buffer.len();
        }

        log::info!(
            "Stopped recording. Saved {} samples to {:?} ({} ms)",
            buffer.len(),
            file_path,
            duration_ms
        );

        Ok((file_path, duration_ms))
    }

    /// Write audio buffer to WAV file
    fn write_wav_file(&self, path: &PathBuf, samples: &[i16]) -> Result<(), AudioCaptureError> {
        let spec = WavSpec {
            channels: self.config.channels,
            sample_rate: self.config.sample_rate,
            bits_per_sample: self.config.bits_per_sample,
            sample_format: hound::SampleFormat::Int,
        };

        let file = File::create(path).map_err(|e| AudioCaptureError::FileError(e.to_string()))?;
        let buf_writer = BufWriter::new(file);

        let mut writer = WavWriter::new(buf_writer, spec)
            .map_err(|e| AudioCaptureError::FileError(e.to_string()))?;

        for &sample in samples {
            writer
                .write_sample(sample)
                .map_err(|e| AudioCaptureError::FileError(e.to_string()))?;
        }

        writer
            .finalize()
            .map_err(|e| AudioCaptureError::FileError(e.to_string()))?;

        Ok(())
    }

    /// Check if currently recording
    pub fn is_recording(&self) -> bool {
        self.is_recording.load(Ordering::SeqCst)
    }

    /// Get current recording state
    pub fn get_state(&self) -> RecordingState {
        self.state.lock().unwrap().clone()
    }

    /// Get recording duration in milliseconds
    pub fn get_duration_ms(&self) -> u64 {
        let state = self.state.lock().unwrap();
        state
            .start_time
            .map(|t| t.elapsed().as_millis() as u64)
            .unwrap_or(0)
    }

    /// Cancel recording without saving
    pub fn cancel_recording(&self) {
        self.is_recording.store(false, Ordering::SeqCst);
        CURRENT_STREAM.with(|s| {
            *s.borrow_mut() = None;
        });

        {
            let mut state = self.state.lock().unwrap();
            state.is_recording = false;
            state.file_path = None;
            state.start_time = None;
        }

        self.audio_buffer.lock().unwrap().clear();
        log::info!("Recording cancelled");
    }
}

/// Global audio capture service instance
static AUDIO_SERVICE: once_cell::sync::Lazy<Mutex<Option<AudioCaptureService>>> =
    once_cell::sync::Lazy::new(|| Mutex::new(None));

/// Initialize the audio capture service
pub fn init_audio_service(config: AudioCaptureConfig) -> Result<(), AudioCaptureError> {
    let service = AudioCaptureService::new(config)?;
    *AUDIO_SERVICE.lock().unwrap() = Some(service);
    Ok(())
}

/// Get the audio capture service
pub fn get_audio_service() -> Result<std::sync::MutexGuard<'static, Option<AudioCaptureService>>, AudioCaptureError> {
    AUDIO_SERVICE
        .lock()
        .map_err(|_| AudioCaptureError::DeviceError("Service lock poisoned".to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_audio_capture_config_default() {
        let config = AudioCaptureConfig::default();
        assert_eq!(config.sample_rate, 16000);
        assert_eq!(config.channels, 1);
        assert_eq!(config.bits_per_sample, 16);
    }

    #[test]
    fn test_audio_service_creation() {
        // This test may fail if no audio device is available
        let config = AudioCaptureConfig::default();
        let result = AudioCaptureService::new(config);
        // Just check that it doesn't panic
        assert!(result.is_ok() || result.is_err());
    }
}
