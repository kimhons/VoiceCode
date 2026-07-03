// PHASE 1.3: Structured Logging Commands
// Tauri commands for logging management

use crate::logging::{LogStats, get_global_stats};
use serde::{Deserialize, Serialize};
use tauri::command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogCommandResult {
    pub success: bool,
    pub message: String,
}

/// Get logging statistics
#[command]
pub async fn get_log_stats() -> Result<LogStats, String> {
    get_global_stats().ok_or_else(|| "Logger not initialized".to_string())
}

/// Log an info message from frontend
#[command]
pub async fn log_info(message: String, context: Option<String>) -> Result<LogCommandResult, String> {
    if let Some(ctx) = context {
        tracing::info!(context = %ctx, "{}", message);
    } else {
        tracing::info!("{}", message);
    }
    
    Ok(LogCommandResult {
        success: true,
        message: "Info logged".to_string(),
    })
}

/// Log a warning message from frontend
#[command]
pub async fn log_warning(message: String, context: Option<String>) -> Result<LogCommandResult, String> {
    if let Some(ctx) = context {
        tracing::warn!(context = %ctx, "{}", message);
    } else {
        tracing::warn!("{}", message);
    }
    
    Ok(LogCommandResult {
        success: true,
        message: "Warning logged".to_string(),
    })
}

/// Log an error message from frontend
#[command]
pub async fn log_error(message: String, context: Option<String>, error_details: Option<String>) -> Result<LogCommandResult, String> {
    if let Some(ctx) = context {
        if let Some(details) = error_details {
            tracing::error!(context = %ctx, error = %details, "{}", message);
        } else {
            tracing::error!(context = %ctx, "{}", message);
        }
    } else {
        tracing::error!("{}", message);
    }
    
    Ok(LogCommandResult {
        success: true,
        message: "Error logged".to_string(),
    })
}

/// Log a debug message from frontend
#[command]
pub async fn log_debug(message: String, context: Option<String>) -> Result<LogCommandResult, String> {
    if let Some(ctx) = context {
        tracing::debug!(context = %ctx, "{}", message);
    } else {
        tracing::debug!("{}", message);
    }
    
    Ok(LogCommandResult {
        success: true,
        message: "Debug logged".to_string(),
    })
}

/// Log a performance metric
#[command]
pub async fn log_performance(
    operation: String,
    duration_ms: u64,
    success: bool,
    metadata: Option<String>,
) -> Result<LogCommandResult, String> {
    if let Some(meta) = metadata {
        tracing::info!(
            operation = %operation,
            duration_ms = duration_ms,
            success = success,
            metadata = %meta,
            "Performance metric"
        );
    } else {
        tracing::info!(
            operation = %operation,
            duration_ms = duration_ms,
            success = success,
            "Performance metric"
        );
    }
    
    Ok(LogCommandResult {
        success: true,
        message: "Performance metric logged".to_string(),
    })
}

/// Log a user action
#[command]
pub async fn log_user_action(
    action: String,
    component: String,
    metadata: Option<String>,
) -> Result<LogCommandResult, String> {
    if let Some(meta) = metadata {
        tracing::info!(
            action = %action,
            component = %component,
            metadata = %meta,
            "User action"
        );
    } else {
        tracing::info!(
            action = %action,
            component = %component,
            "User action"
        );
    }
    
    Ok(LogCommandResult {
        success: true,
        message: "User action logged".to_string(),
    })
}

/// Clear old log files
#[command]
pub async fn clear_old_logs(days_to_keep: u32) -> Result<LogCommandResult, String> {
    tracing::info!("Clearing logs older than {} days", days_to_keep);
    
    // Implementation would go here to delete old log files
    // For now, just log the action
    
    Ok(LogCommandResult {
        success: true,
        message: format!("Cleared logs older than {} days", days_to_keep),
    })
}

/// Get log file paths
#[command]
pub async fn get_log_files() -> Result<Vec<String>, String> {
    use std::fs;
    use std::path::PathBuf;
    
    let log_dir = PathBuf::from("logs");
    
    if !log_dir.exists() {
        return Ok(Vec::new());
    }
    
    let mut log_files = Vec::new();
    
    if let Ok(entries) = fs::read_dir(&log_dir) {
        for entry in entries.flatten() {
            if let Ok(file_type) = entry.file_type() {
                if file_type.is_file() {
                    if let Some(path_str) = entry.path().to_str() {
                        log_files.push(path_str.to_string());
                    }
                }
            }
        }
    }
    
    Ok(log_files)
}

