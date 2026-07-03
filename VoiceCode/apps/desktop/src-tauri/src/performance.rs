#![allow(dead_code, unused_variables, unused_imports)]
// Phase 1.1: Performance Optimization Module
// Target: <100ms startup time (AquaVoice: <50ms)

use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant};
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use tokio::sync::RwLock;

/// Global performance metrics singleton
static PERFORMANCE_METRICS: Lazy<Arc<PerformanceMetrics>> = Lazy::new(|| {
    Arc::new(PerformanceMetrics::new())
});

/// Get global performance metrics
pub fn get_performance_metrics() -> Arc<PerformanceMetrics> {
    PERFORMANCE_METRICS.clone()
}

/// Performance configuration for startup optimization
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceConfig {
    /// Enable lazy loading of non-critical modules
    pub lazy_loading: bool,
    /// Pre-warm STT engine at startup
    pub prewarm_stt: bool,
    /// Cache frequently used resources
    pub resource_caching: bool,
    /// Target startup time in milliseconds
    pub target_startup_ms: u64,
    /// Enable async initialization
    pub async_init: bool,
    /// Parallel initialization of independent modules
    pub parallel_init: bool,
}

impl Default for PerformanceConfig {
    fn default() -> Self {
        Self {
            lazy_loading: true,
            prewarm_stt: true,
            resource_caching: true,
            target_startup_ms: 100, // Target <100ms, AquaVoice is <50ms
            async_init: true,
            parallel_init: true,
        }
    }
}

/// Performance metrics for tracking and optimization
#[derive(Debug)]
pub struct PerformanceMetrics {
    /// Startup time in milliseconds
    startup_time_ms: AtomicU64,
    /// Voice recognition initialization time
    voice_init_time_ms: AtomicU64,
    /// AI API initialization time
    ai_init_time_ms: AtomicU64,
    /// UI render time
    ui_render_time_ms: AtomicU64,
    /// STT request latency (average)
    stt_latency_ms: AtomicU64,
    /// STT request count for averaging
    stt_request_count: AtomicU64,
    /// Text insertion latency (target: 450ms instant, 850ms streaming)
    text_insertion_latency_ms: AtomicU64,
    /// App is fully initialized
    is_initialized: AtomicBool,
    /// Startup timestamp
    startup_timestamp: RwLock<Option<Instant>>,
    /// Latency history for percentile calculations
    latency_history: RwLock<Vec<u64>>,
}

impl PerformanceMetrics {
    pub fn new() -> Self {
        Self {
            startup_time_ms: AtomicU64::new(0),
            voice_init_time_ms: AtomicU64::new(0),
            ai_init_time_ms: AtomicU64::new(0),
            ui_render_time_ms: AtomicU64::new(0),
            stt_latency_ms: AtomicU64::new(0),
            stt_request_count: AtomicU64::new(0),
            text_insertion_latency_ms: AtomicU64::new(0),
            is_initialized: AtomicBool::new(false),
            startup_timestamp: RwLock::new(None),
            latency_history: RwLock::new(Vec::with_capacity(1000)),
        }
    }

    /// Mark startup begin
    pub async fn start_timing(&self) {
        let mut ts = self.startup_timestamp.write().await;
        *ts = Some(Instant::now());
    }

    /// Mark startup complete and record time
    pub async fn finish_startup(&self) {
        if let Some(start) = *self.startup_timestamp.read().await {
            let elapsed = start.elapsed().as_millis() as u64;
            self.startup_time_ms.store(elapsed, Ordering::SeqCst);
            self.is_initialized.store(true, Ordering::SeqCst);
            tracing::info!("Startup completed in {}ms (target: <100ms)", elapsed);
        }
    }

    /// Record voice initialization time
    pub fn record_voice_init(&self, duration: Duration) {
        self.voice_init_time_ms.store(duration.as_millis() as u64, Ordering::SeqCst);
    }

    /// Record AI initialization time
    pub fn record_ai_init(&self, duration: Duration) {
        self.ai_init_time_ms.store(duration.as_millis() as u64, Ordering::SeqCst);
    }

    /// Record UI render time
    pub fn record_ui_render(&self, duration: Duration) {
        self.ui_render_time_ms.store(duration.as_millis() as u64, Ordering::SeqCst);
    }

    /// Record STT request latency
    pub async fn record_stt_latency(&self, latency_ms: u64) {
        // Update running average
        let count = self.stt_request_count.fetch_add(1, Ordering::SeqCst) + 1;
        let current_avg = self.stt_latency_ms.load(Ordering::SeqCst);
        let new_avg = (current_avg * (count - 1) + latency_ms) / count;
        self.stt_latency_ms.store(new_avg, Ordering::SeqCst);

        // Add to history for percentile calculations
        let mut history = self.latency_history.write().await;
        if history.len() >= 1000 {
            history.remove(0);
        }
        history.push(latency_ms);
    }

    /// Record text insertion latency (from speech end to text insertion)
    pub fn record_text_insertion_latency(&self, latency_ms: u64) {
        self.text_insertion_latency_ms.store(latency_ms, Ordering::SeqCst);
    }

    /// Get startup time
    pub fn get_startup_time(&self) -> u64 {
        self.startup_time_ms.load(Ordering::SeqCst)
    }

    /// Get average STT latency
    pub fn get_avg_stt_latency(&self) -> u64 {
        self.stt_latency_ms.load(Ordering::SeqCst)
    }

    /// Get text insertion latency
    pub fn get_text_insertion_latency(&self) -> u64 {
        self.text_insertion_latency_ms.load(Ordering::SeqCst)
    }

    /// Check if meeting AquaVoice latency targets
    pub fn is_meeting_latency_targets(&self) -> LatencyTargetStatus {
        let insertion_latency = self.get_text_insertion_latency();
        let stt_latency = self.get_avg_stt_latency();

        LatencyTargetStatus {
            instant_mode_met: insertion_latency <= 450,  // AquaVoice instant: 450ms
            streaming_mode_met: insertion_latency <= 850, // AquaVoice streaming: 850ms
            startup_met: self.get_startup_time() <= 100,  // Target: <100ms
            current_insertion_ms: insertion_latency,
            current_stt_ms: stt_latency,
            current_startup_ms: self.get_startup_time(),
        }
    }

    /// Get P95 latency
    pub async fn get_p95_latency(&self) -> u64 {
        let history = self.latency_history.read().await;
        if history.is_empty() {
            return 0;
        }
        let mut sorted: Vec<u64> = history.clone();
        sorted.sort();
        let p95_idx = (sorted.len() as f64 * 0.95) as usize;
        sorted.get(p95_idx).copied().unwrap_or(0)
    }

    /// Get comprehensive stats
    pub async fn get_stats(&self) -> PerformanceStats {
        PerformanceStats {
            startup_time_ms: self.startup_time_ms.load(Ordering::SeqCst),
            voice_init_time_ms: self.voice_init_time_ms.load(Ordering::SeqCst),
            ai_init_time_ms: self.ai_init_time_ms.load(Ordering::SeqCst),
            ui_render_time_ms: self.ui_render_time_ms.load(Ordering::SeqCst),
            avg_stt_latency_ms: self.stt_latency_ms.load(Ordering::SeqCst),
            p95_stt_latency_ms: self.get_p95_latency().await,
            text_insertion_latency_ms: self.text_insertion_latency_ms.load(Ordering::SeqCst),
            stt_request_count: self.stt_request_count.load(Ordering::SeqCst),
            is_initialized: self.is_initialized.load(Ordering::SeqCst),
            latency_targets: self.is_meeting_latency_targets(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LatencyTargetStatus {
    /// Meeting AquaVoice instant mode (450ms)
    pub instant_mode_met: bool,
    /// Meeting AquaVoice streaming mode (850ms)
    pub streaming_mode_met: bool,
    /// Meeting startup target (<100ms)
    pub startup_met: bool,
    /// Current text insertion latency
    pub current_insertion_ms: u64,
    /// Current STT latency
    pub current_stt_ms: u64,
    /// Current startup time
    pub current_startup_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceStats {
    pub startup_time_ms: u64,
    pub voice_init_time_ms: u64,
    pub ai_init_time_ms: u64,
    pub ui_render_time_ms: u64,
    pub avg_stt_latency_ms: u64,
    pub p95_stt_latency_ms: u64,
    pub text_insertion_latency_ms: u64,
    pub stt_request_count: u64,
    pub is_initialized: bool,
    pub latency_targets: LatencyTargetStatus,
}

/// Lazy initialization manager for deferred module loading
pub struct LazyInitManager {
    /// Modules that have been initialized
    initialized_modules: RwLock<std::collections::HashSet<String>>,
    /// Module initialization functions (stored as closures would be complex, using flags)
    pending_modules: RwLock<Vec<String>>,
}

impl LazyInitManager {
    pub fn new() -> Self {
        Self {
            initialized_modules: RwLock::new(std::collections::HashSet::new()),
            pending_modules: RwLock::new(vec![
                "encryption".to_string(),
                "advanced_ai".to_string(),
                "video_transcription".to_string(),
                "export_formats".to_string(),
                "analytics".to_string(),
            ]),
        }
    }

    /// Check if a module is initialized
    pub async fn is_initialized(&self, module: &str) -> bool {
        self.initialized_modules.read().await.contains(module)
    }

    /// Mark a module as initialized
    pub async fn mark_initialized(&self, module: &str) {
        self.initialized_modules.write().await.insert(module.to_string());
    }

    /// Get list of pending modules
    pub async fn get_pending(&self) -> Vec<String> {
        let initialized = self.initialized_modules.read().await;
        self.pending_modules
            .read()
            .await
            .iter()
            .filter(|m| !initialized.contains(*m))
            .cloned()
            .collect()
    }
}

/// Pre-warming service for STT engine
pub struct STTPrewarmer {
    is_warmed: AtomicBool,
    warmup_time_ms: AtomicU64,
}

impl STTPrewarmer {
    pub fn new() -> Self {
        Self {
            is_warmed: AtomicBool::new(false),
            warmup_time_ms: AtomicU64::new(0),
        }
    }

    /// Pre-warm the STT engine with a dummy request
    pub async fn prewarm(&self) -> Result<(), String> {
        if self.is_warmed.load(Ordering::SeqCst) {
            return Ok(());
        }

        let start = Instant::now();

        // Simulate pre-warming by initializing audio context
        // In production, this would:
        // 1. Initialize WebSocket connection to STT service
        // 2. Send a small test audio chunk
        // 3. Warm up any local audio processing pipelines
        tokio::time::sleep(Duration::from_millis(10)).await;

        let elapsed = start.elapsed().as_millis() as u64;
        self.warmup_time_ms.store(elapsed, Ordering::SeqCst);
        self.is_warmed.store(true, Ordering::SeqCst);

        tracing::info!("STT engine pre-warmed in {}ms", elapsed);
        Ok(())
    }

    pub fn is_warmed(&self) -> bool {
        self.is_warmed.load(Ordering::SeqCst)
    }

    pub fn get_warmup_time(&self) -> u64 {
        self.warmup_time_ms.load(Ordering::SeqCst)
    }
}

/// Startup optimizer that parallelizes independent initializations
pub struct StartupOptimizer {
    config: PerformanceConfig,
    lazy_init: LazyInitManager,
    stt_prewarmer: STTPrewarmer,
    metrics: Arc<PerformanceMetrics>,
}

impl StartupOptimizer {
    pub fn new(config: PerformanceConfig) -> Self {
        Self {
            config,
            lazy_init: LazyInitManager::new(),
            stt_prewarmer: STTPrewarmer::new(),
            metrics: get_performance_metrics(),
        }
    }

    /// Run optimized startup sequence
    pub async fn run_optimized_startup(&self) -> Result<(), String> {
        self.metrics.start_timing().await;

        if self.config.parallel_init {
            // Run critical initializations in parallel
            let (voice_result, ui_result) = tokio::join!(
                self.init_voice_critical(),
                self.init_ui_critical()
            );

            voice_result?;
            ui_result?;
        } else {
            self.init_voice_critical().await?;
            self.init_ui_critical().await?;
        }

        // Pre-warm STT if enabled (non-blocking)
        if self.config.prewarm_stt {
            let prewarmer = STTPrewarmer::new();
            tokio::spawn(async move {
                let _ = prewarmer.prewarm().await;
            });
        }

        self.metrics.finish_startup().await;

        // Schedule lazy initialization of non-critical modules
        if self.config.lazy_loading {
            self.schedule_lazy_init().await;
        }

        Ok(())
    }

    async fn init_voice_critical(&self) -> Result<(), String> {
        let start = Instant::now();

        // Critical voice initialization - just the essentials
        // Full STT model loading happens lazily on first use
        tokio::time::sleep(Duration::from_millis(5)).await; // Simulate minimal init

        self.metrics.record_voice_init(start.elapsed());
        Ok(())
    }

    async fn init_ui_critical(&self) -> Result<(), String> {
        let start = Instant::now();

        // Critical UI initialization
        tokio::time::sleep(Duration::from_millis(5)).await; // Simulate minimal init

        self.metrics.record_ui_render(start.elapsed());
        Ok(())
    }

    async fn schedule_lazy_init(&self) {
        // Schedule lazy initialization after main startup
        let pending = self.lazy_init.get_pending().await;

        for module in pending {
            let lazy_init = &self.lazy_init;
            tokio::spawn(async move {
                // Delay non-critical initialization
                tokio::time::sleep(Duration::from_millis(500)).await;
                tracing::debug!("Lazy initializing module: {}", module);
            });
        }
    }

    pub fn get_metrics(&self) -> Arc<PerformanceMetrics> {
        self.metrics.clone()
    }
}

// Tauri commands for performance monitoring

#[tauri::command]
pub async fn get_performance_stats() -> Result<PerformanceStats, String> {
    Ok(get_performance_metrics().get_stats().await)
}

#[tauri::command]
pub async fn get_latency_targets() -> Result<LatencyTargetStatus, String> {
    Ok(get_performance_metrics().is_meeting_latency_targets())
}

#[tauri::command]
pub async fn record_stt_latency(latency_ms: u64) -> Result<(), String> {
    get_performance_metrics().record_stt_latency(latency_ms).await;
    Ok(())
}

#[tauri::command]
pub async fn record_text_insertion_latency(latency_ms: u64) -> Result<(), String> {
    get_performance_metrics().record_text_insertion_latency(latency_ms);
    Ok(())
}

#[tauri::command]
pub async fn start_performance_monitoring() -> Result<(), String> {
    get_performance_metrics().start_timing().await;
    tracing::info!("Performance monitoring started");
    Ok(())
}

#[tauri::command]
pub async fn stop_performance_monitoring() -> Result<PerformanceStats, String> {
    get_performance_metrics().finish_startup().await;
    tracing::info!("Performance monitoring stopped");
    Ok(get_performance_metrics().get_stats().await)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_performance_metrics() {
        let metrics = PerformanceMetrics::new();

        metrics.start_timing().await;
        tokio::time::sleep(Duration::from_millis(10)).await;
        metrics.finish_startup().await;

        assert!(metrics.get_startup_time() >= 10);
    }

    #[tokio::test]
    async fn test_latency_recording() {
        let metrics = PerformanceMetrics::new();

        metrics.record_stt_latency(100).await;
        metrics.record_stt_latency(200).await;
        metrics.record_stt_latency(150).await;

        assert_eq!(metrics.get_avg_stt_latency(), 150);
    }

    #[tokio::test]
    async fn test_startup_optimizer() {
        let config = PerformanceConfig::default();
        let optimizer = StartupOptimizer::new(config);

        let result = optimizer.run_optimized_startup().await;
        assert!(result.is_ok());

        let stats = optimizer.get_metrics().get_stats().await;
        assert!(stats.is_initialized);
    }
}
