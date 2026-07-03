#![allow(dead_code, unused_variables, unused_imports)]
// Voice Streaming with Interruption Support
// Real-time voice processing with ability to interrupt ongoing operations

use std::sync::Arc;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::time::Instant;
use tokio::sync::{broadcast, mpsc, RwLock};
use serde::{Deserialize, Serialize};

/// Voice streaming manager with interruption support
pub struct VoiceStreamManager {
    state: Arc<StreamState>,
    config: StreamConfig,
    event_tx: broadcast::Sender<StreamEvent>,
    command_tx: mpsc::Sender<StreamCommand>,
}

struct StreamState {
    is_listening: AtomicBool,
    is_processing: AtomicBool,
    is_interrupted: AtomicBool,
    current_session_id: AtomicU64,
    partial_transcript: RwLock<String>,
    pending_operations: RwLock<Vec<PendingOperation>>,
    interrupt_handlers: RwLock<Vec<Box<dyn Fn() + Send + Sync>>>,
}

/// Configuration for voice streaming
#[derive(Debug, Clone)]
pub struct StreamConfig {
    pub silence_threshold_ms: u64,
    pub max_recording_ms: u64,
    pub interrupt_keywords: Vec<String>,
    pub enable_partial_results: bool,
    pub min_confidence_threshold: f32,
    pub auto_execute_threshold: f32,
}

impl Default for StreamConfig {
    fn default() -> Self {
        Self {
            silence_threshold_ms: 1500,
            max_recording_ms: 30000,
            interrupt_keywords: vec![
                "stop".to_string(), "cancel".to_string(), "wait".to_string(),
                "hold on".to_string(), "never mind".to_string(), "undo".to_string(),
            ],
            enable_partial_results: true,
            min_confidence_threshold: 0.6,
            auto_execute_threshold: 0.9,
        }
    }
}

/// Events emitted during voice streaming
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum StreamEvent {
    ListeningStarted { session_id: u64 },
    ListeningStopped { session_id: u64 },
    PartialTranscript { text: String, confidence: f32 },
    FinalTranscript { text: String, confidence: f32, duration_ms: u64 },
    ProcessingStarted { task_id: String },
    ProcessingProgress { task_id: String, progress: f32, message: String },
    ProcessingCompleted { task_id: String, result: String },
    ProcessingFailed { task_id: String, error: String },
    Interrupted { reason: String, session_id: u64 },
    Error { message: String },
}

/// Commands for controlling the stream
#[derive(Debug, Clone)]
pub enum StreamCommand {
    StartListening,
    StopListening,
    Interrupt,
    CancelCurrent,
    SetConfig(StreamConfig),
}

/// A pending operation that can be interrupted
#[derive(Debug, Clone)]
pub struct PendingOperation {
    pub id: String,
    pub task: String,
    pub started_at: Instant,
    pub interruptible: bool,
    pub cancel_token: Arc<AtomicBool>,
}

/// Result of voice processing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VoiceProcessingResult {
    pub session_id: u64,
    pub transcript: String,
    pub confidence: f32,
    pub duration_ms: u64,
    pub was_interrupted: bool,
    pub parsed_command: Option<ParsedVoiceCommand>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedVoiceCommand {
    pub action: String,
    pub target: Option<String>,
    pub parameters: std::collections::HashMap<String, String>,
    pub confidence: f32,
}

impl VoiceStreamManager {
    pub fn new(config: StreamConfig) -> Self {
        let (event_tx, _) = broadcast::channel(100);
        let (command_tx, _command_rx) = mpsc::channel(32);

        Self {
            state: Arc::new(StreamState {
                is_listening: AtomicBool::new(false),
                is_processing: AtomicBool::new(false),
                is_interrupted: AtomicBool::new(false),
                current_session_id: AtomicU64::new(0),
                partial_transcript: RwLock::new(String::new()),
                pending_operations: RwLock::new(Vec::new()),
                interrupt_handlers: RwLock::new(Vec::new()),
            }),
            config,
            event_tx,
            command_tx,
        }
    }

    /// Subscribe to stream events
    pub fn subscribe(&self) -> broadcast::Receiver<StreamEvent> {
        self.event_tx.subscribe()
    }

    /// Start listening for voice input
    pub async fn start_listening(&self) -> Result<u64, String> {
        if self.state.is_listening.load(Ordering::SeqCst) {
            return Err("Already listening".to_string());
        }

        let session_id = self.state.current_session_id.fetch_add(1, Ordering::SeqCst) + 1;
        self.state.is_listening.store(true, Ordering::SeqCst);
        self.state.is_interrupted.store(false, Ordering::SeqCst);
        *self.state.partial_transcript.write().await = String::new();

        let _ = self.event_tx.send(StreamEvent::ListeningStarted { session_id });

        Ok(session_id)
    }

    /// Stop listening
    pub async fn stop_listening(&self) -> Result<VoiceProcessingResult, String> {
        if !self.state.is_listening.load(Ordering::SeqCst) {
            return Err("Not listening".to_string());
        }

        self.state.is_listening.store(false, Ordering::SeqCst);
        let session_id = self.state.current_session_id.load(Ordering::SeqCst);
        let transcript = self.state.partial_transcript.read().await.clone();
        let was_interrupted = self.state.is_interrupted.load(Ordering::SeqCst);

        let _ = self.event_tx.send(StreamEvent::ListeningStopped { session_id });

        Ok(VoiceProcessingResult {
            session_id,
            transcript,
            confidence: 0.85,
            duration_ms: 0,
            was_interrupted,
            parsed_command: None,
        })
    }

    /// Process partial transcript (called during real-time transcription)
    pub async fn process_partial(&self, text: &str, confidence: f32) {
        *self.state.partial_transcript.write().await = text.to_string();

        // Check for interrupt keywords
        if self.check_for_interrupt(text) {
            self.interrupt("Interrupt keyword detected").await;
            return;
        }

        let _ = self.event_tx.send(StreamEvent::PartialTranscript {
            text: text.to_string(),
            confidence,
        });
    }

    /// Process final transcript
    pub async fn process_final(&self, text: &str, confidence: f32, duration_ms: u64) -> VoiceProcessingResult {
        let session_id = self.state.current_session_id.load(Ordering::SeqCst);
        let was_interrupted = self.state.is_interrupted.load(Ordering::SeqCst);

        let _ = self.event_tx.send(StreamEvent::FinalTranscript {
            text: text.to_string(),
            confidence,
            duration_ms,
        });

        VoiceProcessingResult {
            session_id,
            transcript: text.to_string(),
            confidence,
            duration_ms,
            was_interrupted,
            parsed_command: None,
        }
    }

    /// Interrupt current operation
    pub async fn interrupt(&self, reason: &str) {
        self.state.is_interrupted.store(true, Ordering::SeqCst);
        let session_id = self.state.current_session_id.load(Ordering::SeqCst);

        // Cancel all pending operations
        let operations = self.state.pending_operations.read().await;
        for op in operations.iter() {
            if op.interruptible {
                op.cancel_token.store(true, Ordering::SeqCst);
            }
        }

        // Call interrupt handlers
        let handlers = self.state.interrupt_handlers.read().await;
        for handler in handlers.iter() {
            handler();
        }

        let _ = self.event_tx.send(StreamEvent::Interrupted {
            reason: reason.to_string(),
            session_id,
        });
    }

    /// Check if text contains interrupt keywords
    fn check_for_interrupt(&self, text: &str) -> bool {
        let text_lower = text.to_lowercase();
        self.config.interrupt_keywords.iter()
            .any(|kw| text_lower.contains(&kw.to_lowercase()))
    }

    /// Register a pending operation
    pub async fn register_operation(&self, task: &str, interruptible: bool) -> PendingOperation {
        let op = PendingOperation {
            id: uuid::Uuid::new_v4().to_string(),
            task: task.to_string(),
            started_at: Instant::now(),
            interruptible,
            cancel_token: Arc::new(AtomicBool::new(false)),
        };

        self.state.pending_operations.write().await.push(op.clone());

        let _ = self.event_tx.send(StreamEvent::ProcessingStarted {
            task_id: op.id.clone(),
        });

        op
    }

    /// Complete an operation
    pub async fn complete_operation(&self, op_id: &str, result: &str) {
        self.state.pending_operations.write().await
            .retain(|op| op.id != op_id);

        let _ = self.event_tx.send(StreamEvent::ProcessingCompleted {
            task_id: op_id.to_string(),
            result: result.to_string(),
        });
    }

    /// Report operation failure
    pub async fn fail_operation(&self, op_id: &str, error: &str) {
        self.state.pending_operations.write().await
            .retain(|op| op.id != op_id);

        let _ = self.event_tx.send(StreamEvent::ProcessingFailed {
            task_id: op_id.to_string(),
            error: error.to_string(),
        });
    }

    /// Report progress
    pub fn report_progress(&self, op_id: &str, progress: f32, message: &str) {
        let _ = self.event_tx.send(StreamEvent::ProcessingProgress {
            task_id: op_id.to_string(),
            progress,
            message: message.to_string(),
        });
    }

    /// Register an interrupt handler
    pub async fn on_interrupt<F>(&self, handler: F)
    where
        F: Fn() + Send + Sync + 'static,
    {
        self.state.interrupt_handlers.write().await.push(Box::new(handler));
    }

    /// Check if operation was cancelled
    pub fn is_cancelled(&self, op: &PendingOperation) -> bool {
        op.cancel_token.load(Ordering::SeqCst)
    }

    /// Get current state
    pub fn is_listening(&self) -> bool {
        self.state.is_listening.load(Ordering::SeqCst)
    }

    pub fn is_processing(&self) -> bool {
        self.state.is_processing.load(Ordering::SeqCst)
    }

    pub fn is_interrupted(&self) -> bool {
        self.state.is_interrupted.load(Ordering::SeqCst)
    }

    /// Update configuration
    pub fn set_config(&mut self, config: StreamConfig) {
        self.config = config;
    }

    /// Get pending operations
    pub async fn get_pending_operations(&self) -> Vec<PendingOperation> {
        self.state.pending_operations.read().await.clone()
    }
}

/// Cancellation token for async operations
#[derive(Clone)]
pub struct CancellationToken {
    cancelled: Arc<AtomicBool>,
}

impl CancellationToken {
    pub fn new() -> Self {
        Self {
            cancelled: Arc::new(AtomicBool::new(false)),
        }
    }

    pub fn cancel(&self) {
        self.cancelled.store(true, Ordering::SeqCst);
    }

    pub fn is_cancelled(&self) -> bool {
        self.cancelled.load(Ordering::SeqCst)
    }

    /// Check cancellation and return error if cancelled
    pub fn check(&self) -> Result<(), String> {
        if self.is_cancelled() {
            Err("Operation cancelled".to_string())
        } else {
            Ok(())
        }
    }
}

impl Default for CancellationToken {
    fn default() -> Self {
        Self::new()
    }
}

/// Helper for running interruptible operations
pub async fn run_interruptible<F, T>(
    stream_manager: &VoiceStreamManager,
    task_name: &str,
    operation: F,
) -> Result<T, String>
where
    F: std::future::Future<Output = Result<T, String>>,
{
    let op = stream_manager.register_operation(task_name, true).await;
    let cancel_token = op.cancel_token.clone();

    tokio::select! {
        result = operation => {
            if cancel_token.load(Ordering::SeqCst) {
                stream_manager.fail_operation(&op.id, "Cancelled by user").await;
                Err("Operation cancelled".to_string())
            } else {
                match &result {
                    Ok(_) => stream_manager.complete_operation(&op.id, "Success").await,
                    Err(e) => stream_manager.fail_operation(&op.id, e).await,
                }
                result
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_stream_manager_creation() {
        let manager = VoiceStreamManager::new(StreamConfig::default());
        assert!(!manager.is_listening());
        assert!(!manager.is_processing());
    }

    #[tokio::test]
    async fn test_start_stop_listening() {
        let manager = VoiceStreamManager::new(StreamConfig::default());
        
        let session_id = manager.start_listening().await.unwrap();
        assert!(session_id > 0);
        assert!(manager.is_listening());

        let result = manager.stop_listening().await.unwrap();
        assert!(!manager.is_listening());
        assert_eq!(result.session_id, session_id);
    }

    #[tokio::test]
    async fn test_interrupt_detection() {
        let manager = VoiceStreamManager::new(StreamConfig::default());
        
        assert!(manager.check_for_interrupt("please stop"));
        assert!(manager.check_for_interrupt("CANCEL that"));
        assert!(manager.check_for_interrupt("wait a moment"));
        assert!(!manager.check_for_interrupt("continue working"));
    }

    #[test]
    fn test_cancellation_token() {
        let token = CancellationToken::new();
        assert!(!token.is_cancelled());
        assert!(token.check().is_ok());

        token.cancel();
        assert!(token.is_cancelled());
        assert!(token.check().is_err());
    }
}
