// Phase 1.2: Real-Time Streaming Mode
// Target: 450ms (Instant Mode) / 850ms (Streaming Mode) - matching AquaVoice

use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant};
use serde::{Deserialize, Serialize};
use tokio::sync::{mpsc, RwLock, broadcast};
use uuid::Uuid;

/// Streaming mode types matching AquaVoice
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum StreamingMode {
    /// Instant mode - 450ms target latency, minimal processing
    Instant,
    /// Streaming mode - 850ms target latency, with LLM enhancement
    Enhanced,
    /// Hybrid mode - starts instant, enhances in background
    Hybrid,
}

impl Default for StreamingMode {
    fn default() -> Self {
        StreamingMode::Hybrid
    }
}

/// Configuration for streaming STT
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StreamingConfig {
    /// Current streaming mode
    pub mode: StreamingMode,
    /// Language for recognition
    pub language: String,
    /// Enable interim results
    pub interim_results: bool,
    /// Punctuation enhancement
    pub punctuate: bool,
    /// Speaker diarization
    pub diarize: bool,
    /// Code-aware vocabulary
    pub code_vocabulary: bool,
    /// Custom dictionary terms
    pub custom_terms: Vec<String>,
    /// Target latency in milliseconds
    pub target_latency_ms: u64,
    /// Audio buffer size in milliseconds
    pub buffer_size_ms: u64,
    /// Enable voice activity detection
    pub vad_enabled: bool,
    /// VAD sensitivity (0.0 - 1.0)
    pub vad_sensitivity: f32,
}

impl Default for StreamingConfig {
    fn default() -> Self {
        Self {
            mode: StreamingMode::Hybrid,
            language: "en-US".to_string(),
            interim_results: true,
            punctuate: true,
            diarize: false,
            code_vocabulary: true,
            custom_terms: Vec::new(),
            target_latency_ms: 450, // AquaVoice instant mode target
            buffer_size_ms: 100,
            vad_enabled: true,
            vad_sensitivity: 0.5,
        }
    }
}

/// Real-time streaming result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StreamingResult {
    /// Unique result ID
    pub id: String,
    /// Transcribed text
    pub text: String,
    /// Is this a final result?
    pub is_final: bool,
    /// Confidence score (0.0 - 1.0)
    pub confidence: f32,
    /// Processing latency in milliseconds
    pub latency_ms: u64,
    /// Streaming mode used
    pub mode: StreamingMode,
    /// Word-level timestamps
    pub words: Vec<WordTiming>,
    /// Was enhanced by LLM?
    pub enhanced: bool,
    /// Original text before enhancement
    pub original_text: Option<String>,
    /// Timestamp
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WordTiming {
    pub word: String,
    pub start_ms: u64,
    pub end_ms: u64,
    pub confidence: f32,
}

/// Streaming events
#[derive(Debug, Clone)]
pub enum StreamingEvent {
    /// Connection established
    Connected,
    /// Disconnected
    Disconnected,
    /// Interim result (not final)
    InterimResult(StreamingResult),
    /// Final result
    FinalResult(StreamingResult),
    /// Enhanced result (after LLM processing)
    EnhancedResult(StreamingResult),
    /// Audio level update
    AudioLevel(f32),
    /// Error occurred
    Error(String),
    /// Voice activity detected
    VoiceActivityStart,
    /// Voice activity ended
    VoiceActivityEnd,
}

/// Real-time streaming engine
pub struct StreamingEngine {
    /// Configuration
    config: RwLock<StreamingConfig>,
    /// Is streaming active?
    is_streaming: AtomicBool,
    /// Current session ID
    session_id: RwLock<Option<String>>,
    /// Event sender
    event_tx: broadcast::Sender<StreamingEvent>,
    /// Audio buffer for streaming
    audio_buffer: RwLock<Vec<u8>>,
    /// Last result timestamp for latency calculation
    last_audio_timestamp: AtomicU64,
    /// Latency measurements
    latency_samples: RwLock<Vec<u64>>,
    /// WebSocket connection status
    ws_connected: AtomicBool,
}

impl StreamingEngine {
    pub fn new() -> Self {
        let (event_tx, _) = broadcast::channel(100);

        Self {
            config: RwLock::new(StreamingConfig::default()),
            is_streaming: AtomicBool::new(false),
            session_id: RwLock::new(None),
            event_tx,
            audio_buffer: RwLock::new(Vec::with_capacity(16000 * 2)), // 1 second at 16kHz 16-bit
            last_audio_timestamp: AtomicU64::new(0),
            latency_samples: RwLock::new(Vec::new()),
            ws_connected: AtomicBool::new(false),
        }
    }

    /// Get event receiver
    pub fn subscribe(&self) -> broadcast::Receiver<StreamingEvent> {
        self.event_tx.subscribe()
    }

    /// Update configuration
    pub async fn set_config(&self, config: StreamingConfig) {
        *self.config.write().await = config;
    }

    /// Get current configuration
    pub async fn get_config(&self) -> StreamingConfig {
        self.config.read().await.clone()
    }

    /// Start streaming session
    pub async fn start_streaming(&self) -> Result<String, String> {
        if self.is_streaming.load(Ordering::SeqCst) {
            return Err("Streaming already active".to_string());
        }

        let session_id = Uuid::new_v4().to_string();
        *self.session_id.write().await = Some(session_id.clone());
        self.is_streaming.store(true, Ordering::SeqCst);

        // Connect to WebSocket STT service
        self.connect_websocket().await?;

        // Start audio capture loop
        self.start_audio_capture().await;

        let _ = self.event_tx.send(StreamingEvent::Connected);

        tracing::info!("Streaming started with session: {}", session_id);
        Ok(session_id)
    }

    /// Stop streaming session
    pub async fn stop_streaming(&self) -> Result<(), String> {
        if !self.is_streaming.load(Ordering::SeqCst) {
            return Ok(());
        }

        self.is_streaming.store(false, Ordering::SeqCst);
        self.ws_connected.store(false, Ordering::SeqCst);
        *self.session_id.write().await = None;

        // Clear audio buffer
        self.audio_buffer.write().await.clear();

        let _ = self.event_tx.send(StreamingEvent::Disconnected);

        tracing::info!("Streaming stopped");
        Ok(())
    }

    /// Process audio chunk
    pub async fn process_audio(&self, audio_data: Vec<u8>) -> Result<(), String> {
        if !self.is_streaming.load(Ordering::SeqCst) {
            return Err("Streaming not active".to_string());
        }

        // Record timestamp for latency measurement
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64;
        self.last_audio_timestamp.store(now, Ordering::SeqCst);

        // Add to buffer
        {
            let mut buffer = self.audio_buffer.write().await;
            buffer.extend_from_slice(&audio_data);

            let config = self.config.read().await;
            let buffer_threshold = (config.buffer_size_ms as usize * 16 * 2) as usize; // 16kHz, 16-bit

            // If buffer exceeds threshold, send to STT
            if buffer.len() >= buffer_threshold {
                let chunk = buffer.drain(..).collect::<Vec<_>>();
                drop(buffer);
                self.send_to_stt(chunk).await?;
            }
        }

        // Calculate and emit audio level
        let level = self.calculate_audio_level(&audio_data);
        let _ = self.event_tx.send(StreamingEvent::AudioLevel(level));

        Ok(())
    }

    /// Connect to WebSocket STT service
    async fn connect_websocket(&self) -> Result<(), String> {
        // In production, this would establish a WebSocket connection to the STT service
        // For now, we simulate the connection
        tokio::time::sleep(Duration::from_millis(10)).await;
        self.ws_connected.store(true, Ordering::SeqCst);
        Ok(())
    }

    /// Start audio capture loop
    async fn start_audio_capture(&self) {
        let is_streaming = self.is_streaming.clone();
        let event_tx = self.event_tx.clone();

        tokio::spawn(async move {
            let mut vad_active = false;

            while is_streaming.load(Ordering::SeqCst) {
                // Simulate audio capture and VAD
                tokio::time::sleep(Duration::from_millis(50)).await;

                // Simulate VAD state changes
                let should_be_active = rand::random::<f32>() > 0.3;

                if should_be_active && !vad_active {
                    vad_active = true;
                    let _ = event_tx.send(StreamingEvent::VoiceActivityStart);
                } else if !should_be_active && vad_active {
                    vad_active = false;
                    let _ = event_tx.send(StreamingEvent::VoiceActivityEnd);
                }
            }
        });
    }

    /// Send audio chunk to STT service
    async fn send_to_stt(&self, audio_chunk: Vec<u8>) -> Result<(), String> {
        let config = self.config.read().await.clone();
        let start = Instant::now();

        // Simulate STT processing based on mode
        let processing_time = match config.mode {
            StreamingMode::Instant => Duration::from_millis(50),
            StreamingMode::Enhanced => Duration::from_millis(150),
            StreamingMode::Hybrid => Duration::from_millis(50),
        };

        tokio::time::sleep(processing_time).await;

        // Calculate latency
        let audio_timestamp = self.last_audio_timestamp.load(Ordering::SeqCst);
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64;
        let latency = now - audio_timestamp;

        // Record latency sample
        {
            let mut samples = self.latency_samples.write().await;
            if samples.len() >= 100 {
                samples.remove(0);
            }
            samples.push(latency);
        }

        // Create result
        let result = StreamingResult {
            id: Uuid::new_v4().to_string(),
            text: "Simulated transcription".to_string(),
            is_final: true,
            confidence: 0.95,
            latency_ms: latency,
            mode: config.mode,
            words: vec![],
            enhanced: false,
            original_text: None,
            timestamp: now,
        };

        let _ = self.event_tx.send(StreamingEvent::FinalResult(result.clone()));

        // If hybrid mode, trigger background enhancement
        if config.mode == StreamingMode::Hybrid {
            let event_tx = self.event_tx.clone();
            let mut enhanced_result = result.clone();

            tokio::spawn(async move {
                // Simulate LLM enhancement
                tokio::time::sleep(Duration::from_millis(300)).await;

                enhanced_result.enhanced = true;
                enhanced_result.original_text = Some(enhanced_result.text.clone());
                enhanced_result.text = format!("{} (enhanced)", enhanced_result.text);

                let _ = event_tx.send(StreamingEvent::EnhancedResult(enhanced_result));
            });
        }

        Ok(())
    }

    /// Calculate audio level from samples
    fn calculate_audio_level(&self, audio_data: &[u8]) -> f32 {
        if audio_data.len() < 2 {
            return 0.0;
        }

        // Convert bytes to 16-bit samples and calculate RMS
        let samples: Vec<i16> = audio_data
            .chunks_exact(2)
            .map(|chunk| i16::from_le_bytes([chunk[0], chunk[1]]))
            .collect();

        let sum_squares: f64 = samples.iter().map(|&s| (s as f64).powi(2)).sum();
        let rms = (sum_squares / samples.len() as f64).sqrt();

        // Normalize to 0.0 - 1.0
        (rms / 32768.0) as f32
    }

    /// Get streaming statistics
    pub async fn get_stats(&self) -> StreamingStats {
        let samples = self.latency_samples.read().await;
        let avg_latency = if samples.is_empty() {
            0
        } else {
            samples.iter().sum::<u64>() / samples.len() as u64
        };

        let config = self.config.read().await;

        StreamingStats {
            is_streaming: self.is_streaming.load(Ordering::SeqCst),
            session_id: self.session_id.read().await.clone(),
            mode: config.mode,
            avg_latency_ms: avg_latency,
            target_latency_ms: config.target_latency_ms,
            meeting_target: avg_latency <= config.target_latency_ms,
            ws_connected: self.ws_connected.load(Ordering::SeqCst),
            samples_processed: samples.len() as u64,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StreamingStats {
    pub is_streaming: bool,
    pub session_id: Option<String>,
    pub mode: StreamingMode,
    pub avg_latency_ms: u64,
    pub target_latency_ms: u64,
    pub meeting_target: bool,
    pub ws_connected: bool,
    pub samples_processed: u64,
}

// Global streaming engine instance
use once_cell::sync::Lazy;

static STREAMING_ENGINE: Lazy<Arc<StreamingEngine>> = Lazy::new(|| {
    Arc::new(StreamingEngine::new())
});

pub fn get_streaming_engine() -> Arc<StreamingEngine> {
    STREAMING_ENGINE.clone()
}

// Tauri commands for streaming

#[tauri::command]
pub async fn start_streaming_session() -> Result<String, String> {
    get_streaming_engine().start_streaming().await
}

#[tauri::command]
pub async fn stop_streaming_session() -> Result<(), String> {
    get_streaming_engine().stop_streaming().await
}

#[tauri::command]
pub async fn set_streaming_mode(mode: String) -> Result<(), String> {
    let streaming_mode = match mode.as_str() {
        "instant" => StreamingMode::Instant,
        "enhanced" => StreamingMode::Enhanced,
        "hybrid" => StreamingMode::Hybrid,
        _ => return Err(format!("Invalid streaming mode: {}", mode)),
    };

    let engine = get_streaming_engine();
    let mut config = engine.get_config().await;
    config.mode = streaming_mode;
    engine.set_config(config).await;

    Ok(())
}

#[tauri::command]
pub async fn get_streaming_stats() -> Result<StreamingStats, String> {
    Ok(get_streaming_engine().get_stats().await)
}

#[tauri::command]
pub async fn set_streaming_config(config: StreamingConfig) -> Result<(), String> {
    get_streaming_engine().set_config(config).await;
    Ok(())
}

#[tauri::command]
pub async fn get_streaming_config() -> Result<StreamingConfig, String> {
    Ok(get_streaming_engine().get_config().await)
}

#[tauri::command]
pub async fn process_audio_chunk(audio_data: Vec<u8>) -> Result<(), String> {
    get_streaming_engine().process_audio(audio_data).await
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_streaming_engine() {
        let engine = StreamingEngine::new();

        let session_id = engine.start_streaming().await.unwrap();
        assert!(!session_id.is_empty());

        let stats = engine.get_stats().await;
        assert!(stats.is_streaming);

        engine.stop_streaming().await.unwrap();
        let stats = engine.get_stats().await;
        assert!(!stats.is_streaming);
    }

    #[tokio::test]
    async fn test_streaming_modes() {
        let engine = StreamingEngine::new();

        let mut config = engine.get_config().await;
        assert_eq!(config.mode, StreamingMode::Hybrid);

        config.mode = StreamingMode::Instant;
        config.target_latency_ms = 450;
        engine.set_config(config).await;

        let updated_config = engine.get_config().await;
        assert_eq!(updated_config.mode, StreamingMode::Instant);
        assert_eq!(updated_config.target_latency_ms, 450);
    }
}
