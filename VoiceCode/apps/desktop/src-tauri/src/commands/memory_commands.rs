//! Memory management commands for VoiceFlow Pro
//! OPTIMIZED VERSION - Phase 1.1.4: Memory Management Optimization

use crate::memory::{
    get_audio_buffer_pool, get_audio_pool_stats, clear_audio_pool,
    get_resource_manager, AudioBufferPoolStats,
};
use serde::{Deserialize, Serialize};
use tauri::State;
use tracing::{info, warn};

/// Memory statistics response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryStats {
    /// Audio buffer pool statistics
    pub audio_pool: AudioPoolStats,
    /// System memory statistics
    pub system: SystemMemoryStats,
}

/// Audio pool statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioPoolStats {
    pub buffer_size: usize,
    pub max_pool_size: usize,
    pub available_buffers: usize,
    pub total_created: usize,
    pub total_returned: usize,
    pub total_acquired: usize,
    pub memory_usage_mb: f64,
    pub peak_memory_usage_mb: f64,
    pub unreturned_buffers: usize,
    pub pool_utilization_percent: f64,
    pub leak_detected: bool,
}

/// System memory statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemMemoryStats {
    pub total_memory_mb: u64,
    pub used_memory_mb: u64,
    pub available_memory_mb: u64,
    pub memory_usage_percent: f64,
}

/// OPTIMIZATION: Get comprehensive memory statistics
#[tauri::command]
pub async fn get_memory_stats() -> Result<MemoryStats, String> {
    info!("Getting memory statistics");
    
    // Get audio pool stats
    let pool_stats = get_audio_pool_stats().await;
    
    let memory_usage_mb = pool_stats.memory_usage_bytes as f64 / 1_048_576.0;
    let peak_memory_usage_mb = pool_stats.peak_memory_usage_bytes as f64 / 1_048_576.0;
    
    let pool_utilization = if pool_stats.max_pool_size > 0 {
        (pool_stats.available_buffers as f64 / pool_stats.max_pool_size as f64) * 100.0
    } else {
        0.0
    };
    
    let leak_detected = pool_stats.unreturned_buffers > pool_stats.max_pool_size * 2;
    
    let audio_pool = AudioPoolStats {
        buffer_size: pool_stats.buffer_size,
        max_pool_size: pool_stats.max_pool_size,
        available_buffers: pool_stats.available_buffers,
        total_created: pool_stats.total_created,
        total_returned: pool_stats.total_returned,
        total_acquired: pool_stats.total_acquired,
        memory_usage_mb,
        peak_memory_usage_mb,
        unreturned_buffers: pool_stats.unreturned_buffers,
        pool_utilization_percent: pool_utilization,
        leak_detected,
    };
    
    // Get system memory stats (using sysinfo crate would be better, but for now we'll estimate)
    let system = SystemMemoryStats {
        total_memory_mb: 8192, // Placeholder
        used_memory_mb: (memory_usage_mb as u64),
        available_memory_mb: 8192 - (memory_usage_mb as u64),
        memory_usage_percent: (memory_usage_mb / 8192.0) * 100.0,
    };
    
    Ok(MemoryStats {
        audio_pool,
        system,
    })
}

/// OPTIMIZATION: Clear audio buffer pool
#[tauri::command]
pub async fn clear_audio_buffer_pool() -> Result<String, String> {
    info!("Clearing audio buffer pool");
    
    clear_audio_pool().await;
    
    Ok("Audio buffer pool cleared successfully".to_string())
}

/// OPTIMIZATION: Trigger manual garbage collection
#[tauri::command]
pub async fn trigger_gc() -> Result<String, String> {
    info!("Triggering manual garbage collection");

    // Note: Actual GC is handled by Rust's allocator
    // We can clear the audio buffer pool to free memory
    clear_audio_pool().await;

    Ok("Garbage collection triggered successfully".to_string())
}

/// OPTIMIZATION: Set auto GC enabled/disabled
#[tauri::command]
pub async fn set_auto_gc(enabled: bool) -> Result<String, String> {
    info!("Setting auto GC: {}", enabled);
    
    let pool = get_audio_buffer_pool();
    pool.set_auto_gc(enabled);
    
    Ok(format!("Auto GC {}", if enabled { "enabled" } else { "disabled" }))
}

/// OPTIMIZATION: Get audio buffer from pool
#[tauri::command]
pub async fn get_audio_buffer() -> Result<Vec<f32>, String> {
    let pool = get_audio_buffer_pool();
    let buffer = pool.get_buffer().await;
    Ok(buffer)
}

/// OPTIMIZATION: Return audio buffer to pool
#[tauri::command]
pub async fn return_audio_buffer(buffer: Vec<f32>) -> Result<String, String> {
    let pool = get_audio_buffer_pool();
    pool.return_buffer(buffer).await;
    Ok("Buffer returned to pool".to_string())
}

/// OPTIMIZATION: Check for memory leaks
#[tauri::command]
pub async fn check_memory_leaks() -> Result<MemoryLeakReport, String> {
    info!("Checking for memory leaks");
    
    let stats = get_audio_pool_stats().await;
    
    let leak_detected = stats.unreturned_buffers > stats.max_pool_size * 2;
    let leak_severity = if stats.unreturned_buffers > stats.max_pool_size * 5 {
        "critical"
    } else if stats.unreturned_buffers > stats.max_pool_size * 3 {
        "high"
    } else if stats.unreturned_buffers > stats.max_pool_size * 2 {
        "medium"
    } else {
        "low"
    };
    
    let recommendations = if leak_detected {
        vec![
            "Consider clearing the audio buffer pool".to_string(),
            "Check for unreturned buffers in your code".to_string(),
            "Enable auto GC to automatically manage memory".to_string(),
        ]
    } else {
        vec!["No memory leaks detected".to_string()]
    };
    
    Ok(MemoryLeakReport {
        leak_detected,
        leak_severity: leak_severity.to_string(),
        unreturned_buffers: stats.unreturned_buffers,
        threshold: stats.max_pool_size * 2,
        memory_usage_mb: stats.memory_usage_bytes as f64 / 1_048_576.0,
        recommendations,
    })
}

/// Memory leak report
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryLeakReport {
    pub leak_detected: bool,
    pub leak_severity: String,
    pub unreturned_buffers: usize,
    pub threshold: usize,
    pub memory_usage_mb: f64,
    pub recommendations: Vec<String>,
}

/// OPTIMIZATION: Get memory usage alerts
#[tauri::command]
pub async fn get_memory_alerts() -> Result<Vec<MemoryAlert>, String> {
    let stats = get_audio_pool_stats().await;
    let mut alerts = Vec::new();
    
    // Check for high memory usage
    let memory_mb = stats.memory_usage_bytes as f64 / 1_048_576.0;
    if memory_mb > 100.0 {
        alerts.push(MemoryAlert {
            level: "warning".to_string(),
            message: format!("High memory usage: {:.2} MB", memory_mb),
            timestamp: chrono::Utc::now().to_rfc3339(),
        });
    }
    
    // Check for memory leaks
    if stats.unreturned_buffers > stats.max_pool_size * 2 {
        alerts.push(MemoryAlert {
            level: "error".to_string(),
            message: format!("Potential memory leak: {} unreturned buffers", stats.unreturned_buffers),
            timestamp: chrono::Utc::now().to_rfc3339(),
        });
    }
    
    // Check for low pool utilization
    let utilization = (stats.available_buffers as f64 / stats.max_pool_size as f64) * 100.0;
    if utilization < 20.0 {
        alerts.push(MemoryAlert {
            level: "info".to_string(),
            message: format!("Low pool utilization: {:.1}%", utilization),
            timestamp: chrono::Utc::now().to_rfc3339(),
        });
    }
    
    Ok(alerts)
}

/// Memory alert
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryAlert {
    pub level: String,
    pub message: String,
    pub timestamp: String,
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_get_memory_stats() {
        let result = get_memory_stats().await;
        assert!(result.is_ok());
        
        let stats = result.unwrap();
        assert!(stats.audio_pool.buffer_size > 0);
        assert!(stats.audio_pool.max_pool_size > 0);
    }
    
    #[tokio::test]
    async fn test_clear_audio_buffer_pool() {
        let result = clear_audio_buffer_pool().await;
        assert!(result.is_ok());
    }
    
    #[tokio::test]
    async fn test_check_memory_leaks() {
        let result = check_memory_leaks().await;
        assert!(result.is_ok());
        
        let report = result.unwrap();
        assert!(report.threshold > 0);
    }
}

