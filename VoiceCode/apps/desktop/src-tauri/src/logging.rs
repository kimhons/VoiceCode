#![allow(dead_code, unused_variables, unused_imports)]
// PHASE 1.3: Structured Logging Implementation
// Comprehensive logging system with tracing library

use std::path::PathBuf;
use std::sync::Arc;
use tracing::{info, Level};
use tracing_subscriber::{
    fmt::{self, format::FmtSpan},
    layer::SubscriberExt,
    util::SubscriberInitExt,
    EnvFilter, Layer,
};
use tracing_appender::{non_blocking, rolling};
use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicU64, Ordering};

/// Log level configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum LogLevel {
    Trace,
    Debug,
    Info,
    Warn,
    Error,
}

impl From<LogLevel> for Level {
    fn from(level: LogLevel) -> Self {
        match level {
            LogLevel::Trace => Level::TRACE,
            LogLevel::Debug => Level::DEBUG,
            LogLevel::Info => Level::INFO,
            LogLevel::Warn => Level::WARN,
            LogLevel::Error => Level::ERROR,
        }
    }
}

/// Logging configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogConfig {
    pub level: LogLevel,
    pub log_to_file: bool,
    pub log_to_console: bool,
    pub log_dir: PathBuf,
    pub max_file_size_mb: u64,
    pub max_files: usize,
    pub json_format: bool,
}

impl Default for LogConfig {
    fn default() -> Self {
        Self {
            level: LogLevel::Info,
            log_to_file: true,
            log_to_console: true,
            log_dir: PathBuf::from("logs"),
            max_file_size_mb: 10,
            max_files: 7,
            json_format: false,
        }
    }
}

/// Log statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogStats {
    pub total_logs: u64,
    pub error_count: u64,
    pub warn_count: u64,
    pub info_count: u64,
    pub debug_count: u64,
}

/// Logger manager
pub struct LoggerManager {
    config: Arc<LogConfig>,
    stats: Arc<LogStatistics>,
}

struct LogStatistics {
    total: AtomicU64,
    errors: AtomicU64,
    warnings: AtomicU64,
    info: AtomicU64,
    debug: AtomicU64,
}

impl LogStatistics {
    fn new() -> Self {
        Self {
            total: AtomicU64::new(0),
            errors: AtomicU64::new(0),
            warnings: AtomicU64::new(0),
            info: AtomicU64::new(0),
            debug: AtomicU64::new(0),
        }
    }

    fn increment_total(&self) {
        self.total.fetch_add(1, Ordering::Relaxed);
    }

    fn increment_error(&self) {
        self.errors.fetch_add(1, Ordering::Relaxed);
        self.increment_total();
    }

    fn increment_warning(&self) {
        self.warnings.fetch_add(1, Ordering::Relaxed);
        self.increment_total();
    }

    fn increment_info(&self) {
        self.info.fetch_add(1, Ordering::Relaxed);
        self.increment_total();
    }

    fn increment_debug(&self) {
        self.debug.fetch_add(1, Ordering::Relaxed);
        self.increment_total();
    }

    fn get_stats(&self) -> LogStats {
        LogStats {
            total_logs: self.total.load(Ordering::Relaxed),
            error_count: self.errors.load(Ordering::Relaxed),
            warn_count: self.warnings.load(Ordering::Relaxed),
            info_count: self.info.load(Ordering::Relaxed),
            debug_count: self.debug.load(Ordering::Relaxed),
        }
    }
}

impl LoggerManager {
    /// Initialize the logging system
    pub fn init(config: LogConfig) -> Result<Self, String> {
        let stats = Arc::new(LogStatistics::new());
        
        // Create log directory if it doesn't exist
        if config.log_to_file {
            std::fs::create_dir_all(&config.log_dir)
                .map_err(|e| format!("Failed to create log directory: {}", e))?;
        }

        // Build the subscriber
        let env_filter = EnvFilter::try_from_default_env()
            .unwrap_or_else(|_| {
                let level: Level = config.level.clone().into();
                EnvFilter::new(level.to_string())
            });

        let mut layers = Vec::new();

        // Console layer
        if config.log_to_console {
            let console_layer = fmt::layer()
                .with_target(true)
                .with_thread_ids(true)
                .with_thread_names(true)
                .with_span_events(FmtSpan::CLOSE)
                .with_filter(env_filter.clone());
            
            layers.push(console_layer.boxed());
        }

        // File layer
        if config.log_to_file {
            let file_appender = rolling::daily(&config.log_dir, "voiceflow-pro.log");
            let (non_blocking, _guard) = non_blocking(file_appender);
            
            let file_layer = if config.json_format {
                fmt::layer()
                    .json()
                    .with_writer(non_blocking)
                    .with_filter(env_filter.clone())
                    .boxed()
            } else {
                fmt::layer()
                    .with_writer(non_blocking)
                    .with_target(true)
                    .with_thread_ids(true)
                    .with_span_events(FmtSpan::CLOSE)
                    .with_filter(env_filter)
                    .boxed()
            };
            
            layers.push(file_layer);
        }

        // Initialize the subscriber
        tracing_subscriber::registry()
            .with(layers)
            .init();

        info!("Logging system initialized");
        info!("Log level: {:?}", config.level);
        info!("Log to file: {}", config.log_to_file);
        info!("Log to console: {}", config.log_to_console);

        Ok(Self {
            config: Arc::new(config),
            stats,
        })
    }

    /// Get logging statistics
    pub fn get_stats(&self) -> LogStats {
        self.stats.get_stats()
    }

    /// Get current configuration
    pub fn get_config(&self) -> LogConfig {
        (*self.config).clone()
    }

    /// Update log level
    pub fn set_level(&mut self, level: LogLevel) {
        info!("Changing log level to: {:?}", level);
        Arc::get_mut(&mut self.config).unwrap().level = level;
    }
}

/// Convenience macros for structured logging
#[macro_export]
macro_rules! log_info {
    ($($arg:tt)*) => {
        tracing::info!($($arg)*);
    };
}

#[macro_export]
macro_rules! log_warn {
    ($($arg:tt)*) => {
        tracing::warn!($($arg)*);
    };
}

#[macro_export]
macro_rules! log_error {
    ($($arg:tt)*) => {
        tracing::error!($($arg)*);
    };
}

#[macro_export]
macro_rules! log_debug {
    ($($arg:tt)*) => {
        tracing::debug!($($arg)*);
    };
}

/// Log an operation with timing
#[macro_export]
macro_rules! log_operation {
    ($name:expr, $operation:expr) => {{
        let start = std::time::Instant::now();
        tracing::info!(operation = $name, "Starting operation");
        
        let result = $operation;
        
        let duration = start.elapsed();
        tracing::info!(
            operation = $name,
            duration_ms = duration.as_millis(),
            "Operation completed"
        );
        
        result
    }};
}

/// Global logger instance
static LOGGER: once_cell::sync::OnceCell<Arc<std::sync::Mutex<LoggerManager>>> = once_cell::sync::OnceCell::new();

/// Initialize global logger
pub fn init_global_logger(config: LogConfig) -> Result<(), String> {
    let logger = LoggerManager::init(config)?;
    LOGGER.set(Arc::new(std::sync::Mutex::new(logger)))
        .map_err(|_| "Logger already initialized".to_string())?;
    Ok(())
}

/// Get global logger stats
pub fn get_global_stats() -> Option<LogStats> {
    LOGGER.get().map(|logger| {
        logger.lock().unwrap().get_stats()
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_log_config_default() {
        let config = LogConfig::default();
        assert_eq!(config.max_files, 7);
        assert_eq!(config.max_file_size_mb, 10);
    }

    #[test]
    fn test_log_statistics() {
        let stats = LogStatistics::new();
        stats.increment_error();
        stats.increment_warning();
        stats.increment_info();
        
        let result = stats.get_stats();
        assert_eq!(result.error_count, 1);
        assert_eq!(result.warn_count, 1);
        assert_eq!(result.info_count, 1);
        assert_eq!(result.total_logs, 3);
    }
}

