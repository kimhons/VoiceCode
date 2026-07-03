//! Error handling module for VoiceFlow Pro
//! Defines comprehensive error types for all application components

use thiserror::Error;
use std::fmt;

/// Application-level error type
#[derive(Error, Debug)]
pub enum AppError {
    #[error("Voice recognition error: {0}")]
    VoiceRecognition(#[from] VoiceError),
    
    #[error("Text processing error: {0}")]
    TextProcessing(#[from] TextProcessingError),
    
    #[error("Configuration error: {0}")]
    Configuration(String),
    
    #[error("Input validation error: {0}")]
    Validation(#[from] ValidationError),
    
    #[error("Resource management error: {0}")]
    Resource(#[from] ResourceError),
    
    #[error("Security violation: {0}")]
    Security(String),
    
    #[error("Network error: {0}")]
    Network(String),
    
    #[error("Permission denied: {0}")]
    Permission(String),
    
    #[error("Internal error: {0}")]
    Internal(String),
}

/// Voice recognition specific errors
#[derive(Error, Debug)]
pub enum VoiceError {
    #[error("Engine not initialized")]
    NotInitialized,
    
    #[error("Engine already initialized")]
    AlreadyInitialized,
    
    #[error("Invalid language code: {0}")]
    InvalidLanguage(String),
    
    #[error("Audio capture failed: {0}")]
    AudioCaptureFailed(String),
    
    #[error("Speech recognition timeout")]
    Timeout,
    
    #[error("No audio input detected")]
    NoAudioInput,
    
    #[error("Audio quality too low")]
    LowAudioQuality,
    
    #[error("Unsupported audio format")]
    UnsupportedFormat,
    
    #[error("Memory allocation failed for audio buffer")]
    AudioMemoryError,
}

/// Text processing specific errors
#[derive(Error, Debug)]
pub enum TextProcessingError {
    #[error("Text processor not initialized")]
    NotInitialized,
    
    #[error("Text too long: {0} characters (max: {1})")]
    TextTooLong(usize, usize),
    
    #[error("Text too short: {0} characters (min: {1})")]
    TextTooShort(usize, usize),
    
    #[error("Invalid context: {0}")]
    InvalidContext(String),
    
    #[error("Invalid tone: {0}")]
    InvalidTone(String),
    
    #[error("Processing timeout after {0}ms")]
    ProcessingTimeout(u64),
    
    #[error("Python process communication failed: {0}")]
    ProcessCommunicationFailed(String),
    
    #[error("Invalid processing options: {0}")]
    InvalidOptions(String),
}

/// Input validation errors
#[derive(Error, Debug)]
pub enum ValidationError {
    #[error("Empty input provided")]
    EmptyInput,
    
    #[error("Input too long: {0} characters (max: {1})")]
    InputTooLong(usize, usize),
    
    #[error("Input contains invalid characters: {0}")]
    InvalidCharacters(String),
    
    #[error("Path traversal detected: {0}")]
    PathTraversal(String),
    
    #[error("Invalid file type: {0}")]
    InvalidFileType(String),
    
    #[error("File size too large: {0} bytes (max: {1} bytes)")]
    FileTooLarge(u64, u64),
    
    #[error("Invalid configuration value: {0}")]
    InvalidConfigValue(String),
    
    #[error("Invalid hotkey format: {0}")]
    InvalidHotkey(String),
}

/// Resource management errors
#[derive(Error, Debug)]
pub enum ResourceError {
    #[error("Memory allocation failed")]
    MemoryAllocationFailed,
    
    #[error("Resource cleanup failed: {0}")]
    CleanupFailed(String),
    
    #[error("Resource not found: {0}")]
    NotFound(String),
    
    #[error("Resource already exists: {0}")]
    AlreadyExists(String),
    
    #[error("Resource locked: {0}")]
    ResourceLocked(String),
    
    #[error("Resource limit exceeded: {0}")]
    ResourceLimitExceeded(String),
}

/// Result type alias for application errors
pub type Result<T> = std::result::Result<T, AppError>;

/// Convert various error types to AppError
impl From<std::io::Error> for AppError {
    fn from(error: std::io::Error) -> Self {
        AppError::Internal(format!("IO error: {}", error))
    }
}

impl From<serde_json::Error> for AppError {
    fn from(error: serde_json::Error) -> Self {
        AppError::Internal(format!("JSON serialization error: {}", error))
    }
}

impl From<tokio::sync::mpsc::error::SendError<VoiceEvent>> for AppError {
    fn from(error: tokio::sync::mpsc::error::SendError<VoiceEvent>) -> Self {
        AppError::Internal(format!("Event send error: {}", error))
    }
}

impl From<tokio::sync::mpsc::error::SendError<ProcessingEvent>> for AppError {
    fn from(error: tokio::sync::mpsc::error::SendError<ProcessingEvent>) -> Self {
        AppError::Internal(format!("Event send error: {}", error))
    }
}

impl From<crossbeam_channel::RecvError> for AppError {
    fn from(error: crossbeam_channel::RecvError) -> Self {
        AppError::Internal(format!("Channel receive error: {}", error))
    }
}

impl From<crossbeam_channel::SendError<std::string::String>> for AppError {
    fn from(error: crossbeam_channel::SendError<std::string::String>) -> Self {
        AppError::Internal(format!("Channel send error: {}", error))
    }
}

/// Error logging and reporting
pub struct ErrorReporter {
    error_count: std::sync::atomic::AtomicU64,
    last_errors: std::collections::VecDeque<String>,
    max_errors: usize,
}

impl Default for ErrorReporter {
    fn default() -> Self {
        Self::new()
    }
}

impl ErrorReporter {
    pub fn new() -> Self {
        Self {
            error_count: std::sync::atomic::AtomicU64::new(0),
            last_errors: std::collections::VecDeque::new(),
            max_errors: 100,
        }
    }
    
    pub fn report_error(&mut self, error: &dyn std::fmt::Display) {
        let error_count = self.error_count.fetch_add(1, std::sync::atomic::Ordering::SeqCst);
        let error_msg = format!("[{}] {}", error_count, error);
        
        self.last_errors.push_back(error_msg);
        if self.last_errors.len() > self.max_errors {
            self.last_errors.pop_front();
        }
        
        // Log to stderr in debug mode
        #[cfg(debug_assertions)]
        eprintln!("ERROR: {}", error);
    }
    
    pub fn get_error_count(&self) -> u64 {
        self.error_count.load(std::sync::atomic::Ordering::SeqCst)
    }
    
    pub fn get_recent_errors(&self) -> Vec<String> {
        self.last_errors.iter().cloned().collect()
    }
    
    pub fn clear_errors(&mut self) {
        self.last_errors.clear();
        self.error_count.store(0, std::sync::atomic::Ordering::SeqCst);
    }
}