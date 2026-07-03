#![allow(dead_code, unused_variables, unused_imports)]
//! Memory management module for VoiceFlow Pro
//! Provides proper resource cleanup and memory management
//! OPTIMIZED VERSION - Phase 1.1.4: Memory Management Optimization

use std::sync::Arc;
use std::sync::atomic::{AtomicBool, AtomicU64, AtomicUsize, Ordering};
use tokio::sync::{Mutex, RwLock};
use std::time::{Duration, Instant};
use std::collections::HashMap;
use tracing::{info, warn, debug};

/// Resource management structure
#[derive(Debug)]
pub struct ResourceManager {
    /// Active voice engines
    voice_engines: HashMap<String, Arc<Mutex<VoiceEngineResource>>>,
    /// Active text processors
    text_processors: HashMap<String, Arc<Mutex<TextProcessorResource>>>,
    /// Resource cleanup interval
    cleanup_interval: Duration,
    /// Last cleanup time
    last_cleanup: std::sync::Mutex<Instant>,
    /// Total allocated memory (estimated)
    total_memory: AtomicU64,
    /// Cleanup in progress flag
    cleanup_running: AtomicBool,
}

impl Default for ResourceManager {
    fn default() -> Self {
        Self::new()
    }
}

impl ResourceManager {
    pub fn new() -> Self {
        Self {
            voice_engines: HashMap::new(),
            text_processors: HashMap::new(),
            cleanup_interval: Duration::from_secs(30), // Clean up every 30 seconds
            last_cleanup: std::sync::Mutex::new(Instant::now()),
            total_memory: AtomicU64::new(0),
            cleanup_running: AtomicBool::new(false),
        }
    }

    /// Register a voice engine resource
    pub fn register_voice_engine(&mut self, id: String, engine: Arc<Mutex<VoiceEngineResource>>) {
        info!("Registering voice engine: {}", id);
        self.voice_engines.insert(id, engine);
        self.update_memory_estimate();
    }

    /// Unregister a voice engine resource
    pub fn unregister_voice_engine(&mut self, id: &str) {
        info!("Unregistering voice engine: {}", id);
        self.voice_engines.remove(id);
        self.update_memory_estimate();
    }

    /// Register a text processor resource
    pub fn register_text_processor(&mut self, id: String, processor: Arc<Mutex<TextProcessorResource>>) {
        info!("Registering text processor: {}", id);
        self.text_processors.insert(id, processor);
        self.update_memory_estimate();
    }

    /// Unregister a text processor resource
    pub fn unregister_text_processor(&mut self, id: &str) {
        info!("Unregistering text processor: {}", id);
        self.text_processors.remove(id);
        self.update_memory_estimate();
    }

    /// Perform cleanup of stale resources
    pub async fn cleanup(&mut self) {
        if self.cleanup_running.compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst).is_err() {
            warn!("Cleanup already in progress");
            return;
        }

        info!("Starting resource cleanup");

        // Clean up stale voice engines
        let mut stale_engines = Vec::new();
        for (id, engine) in &self.voice_engines {
            let engine_data = engine.lock().await;
            if engine_data.is_stale() {
                stale_engines.push(id.clone());
            }
        }

        for id in stale_engines {
            warn!("Removing stale voice engine: {}", id);
            self.voice_engines.remove(&id);
        }

        // Clean up stale text processors
        let mut stale_processors = Vec::new();
        for (id, processor) in &self.text_processors {
            let processor_data = processor.lock().await;
            if processor_data.is_stale() {
                stale_processors.push(id.clone());
            }
        }

        for id in stale_processors {
            warn!("Removing stale text processor: {}", id);
            self.text_processors.remove(&id);
        }

        // Force garbage collection for cleanup
        self.force_cleanup().await;

        *self.last_cleanup.lock().unwrap() = Instant::now();
        self.cleanup_running.store(false, Ordering::SeqCst);
        self.update_memory_estimate();

        info!("Resource cleanup completed");
    }

    /// Force cleanup of all resources
    pub async fn force_cleanup(&mut self) {
        info!("Forcing cleanup of all resources");

        // Stop all voice engines
        for (id, engine) in &self.voice_engines {
            let mut engine_data = engine.lock().await;
            engine_data.cleanup().await;
            info!("Cleaned up voice engine: {}", id);
        }

        // Stop all text processors
        for (id, processor) in &self.text_processors {
            let mut processor_data = processor.lock().await;
            processor_data.cleanup().await;
            info!("Cleaned up text processor: {}", id);
        }

        // Clear all caches
        self.clear_all_caches();
    }

    /// Get current memory usage estimate (in bytes)
    pub fn get_memory_usage(&self) -> u64 {
        self.total_memory.load(Ordering::SeqCst)
    }

    /// Get number of active resources
    pub fn get_active_resources(&self) -> (usize, usize) {
        (self.voice_engines.len(), self.text_processors.len())
    }

    /// Clear all caches
    fn clear_all_caches(&mut self) {
        // Clear caches in voice engines
        for engine in self.voice_engines.values() {
            let mut engine_data = engine.blocking_lock();
            engine_data.clear_cache();
        }

        // Clear caches in text processors
        for processor in self.text_processors.values() {
            let mut processor_data = processor.blocking_lock();
            processor_data.clear_cache();
        }

        info!("Cleared all caches");
    }

    /// Update memory estimate
    fn update_memory_estimate(&mut self) {
        let mut estimate = 0u64;
        
        // Estimate voice engine memory
        for engine in self.voice_engines.values() {
            estimate += engine.blocking_lock().estimate_memory_usage();
        }

        // Estimate text processor memory
        for processor in self.text_processors.values() {
            estimate += processor.blocking_lock().estimate_memory_usage();
        }

        self.total_memory.store(estimate, Ordering::SeqCst);
    }

    /// Check if cleanup is needed
    pub fn needs_cleanup(&self) -> bool {
        let last_cleanup = *self.last_cleanup.lock().unwrap();
        last_cleanup.elapsed() > self.cleanup_interval
    }
}

/// Voice engine resource with automatic cleanup
#[derive(Debug)]
pub struct VoiceEngineResource {
    /// Engine ID
    pub id: String,
    /// Last activity timestamp
    pub last_activity: std::sync::Mutex<Instant>,
    /// Audio buffer size
    pub buffer_size: usize,
    /// Memory pool for audio data
    pub audio_pool: Vec<Vec<f32>>,
    /// Is initialized
    pub initialized: AtomicBool,
    /// Estimated memory usage
    pub memory_usage: AtomicU64,
}

impl VoiceEngineResource {
    pub fn new(id: String) -> Self {
        let now = Instant::now();
        Self {
            id,
            last_activity: std::sync::Mutex::new(now),
            buffer_size: 0,
            audio_pool: Vec::new(),
            initialized: AtomicBool::new(false),
            memory_usage: AtomicU64::new(0),
        }
    }

    /// Mark activity
    pub fn mark_activity(&self) {
        *self.last_activity.lock().unwrap() = Instant::now();
    }

    /// Check if resource is stale (inactive for too long)
    pub fn is_stale(&self) -> bool {
        let last_activity = *self.last_activity.lock().unwrap();
        last_activity.elapsed() > Duration::from_secs(300) // 5 minutes
    }

    /// Clean up resources
    pub async fn cleanup(&mut self) {
        info!("Cleaning up voice engine: {}", self.id);
        
        // Clear audio buffers
        self.audio_pool.clear();
        self.buffer_size = 0;
        
        // Reset memory usage
        self.memory_usage.store(0, Ordering::SeqCst);
        
        self.initialized.store(false, Ordering::SeqCst);
    }

    /// Clear cache
    pub fn clear_cache(&mut self) {
        self.audio_pool.clear();
        self.buffer_size = 0;
        self.memory_usage.store(0, Ordering::SeqCst);
    }

    /// Estimate memory usage
    pub fn estimate_memory_usage(&self) -> u64 {
        self.memory_usage.load(Ordering::SeqCst)
    }
}

/// Text processor resource with automatic cleanup
#[derive(Debug)]
pub struct TextProcessorResource {
    /// Processor ID
    pub id: String,
    /// Last activity timestamp
    pub last_activity: std::sync::Mutex<Instant>,
    /// Cache size
    pub cache_size: usize,
    /// Processing queue
    pub processing_queue: Vec<String>,
    /// Is initialized
    pub initialized: AtomicBool,
    /// Estimated memory usage
    pub memory_usage: AtomicU64,
}

impl TextProcessorResource {
    pub fn new(id: String) -> Self {
        let now = Instant::now();
        Self {
            id,
            last_activity: std::sync::Mutex::new(now),
            cache_size: 0,
            processing_queue: Vec::new(),
            initialized: AtomicBool::new(false),
            memory_usage: AtomicU64::new(0),
        }
    }

    /// Mark activity
    pub fn mark_activity(&self) {
        *self.last_activity.lock().unwrap() = Instant::now();
    }

    /// Check if resource is stale
    pub fn is_stale(&self) -> bool {
        let last_activity = *self.last_activity.lock().unwrap();
        last_activity.elapsed() > Duration::from_secs(300) // 5 minutes
    }

    /// Clean up resources
    pub async fn cleanup(&mut self) {
        info!("Cleaning up text processor: {}", self.id);
        
        // Clear processing queue
        self.processing_queue.clear();
        self.cache_size = 0;
        
        // Reset memory usage
        self.memory_usage.store(0, Ordering::SeqCst);
        
        self.initialized.store(false, Ordering::SeqCst);
    }

    /// Clear cache
    pub fn clear_cache(&mut self) {
        self.processing_queue.clear();
        self.cache_size = 0;
        self.memory_usage.store(0, Ordering::SeqCst);
    }

    /// Estimate memory usage
    pub fn estimate_memory_usage(&self) -> u64 {
        self.memory_usage.load(Ordering::SeqCst)
    }
}

/// OPTIMIZATION: Enhanced audio buffer pool with memory monitoring and leak detection
pub struct AudioBufferPool {
    /// Available buffers
    available_buffers: Mutex<Vec<Vec<f32>>>,
    /// Buffer size
    buffer_size: usize,
    /// Maximum pool size
    max_pool_size: usize,
    /// Total buffers created (for leak detection)
    total_created: AtomicUsize,
    /// Total buffers returned (for leak detection)
    total_returned: AtomicUsize,
    /// Total buffers acquired (for leak detection)
    total_acquired: AtomicUsize,
    /// Current memory usage in bytes
    memory_usage: AtomicU64,
    /// Peak memory usage in bytes
    peak_memory_usage: AtomicU64,
    /// Last cleanup time
    last_cleanup: RwLock<Instant>,
    /// Memory leak threshold (number of unreturned buffers)
    leak_threshold: usize,
    /// Enable automatic GC trigger
    auto_gc_enabled: AtomicBool,
    /// GC threshold (memory usage in MB)
    gc_threshold_mb: u64,
}

impl AudioBufferPool {
    pub fn new(buffer_size: usize, max_pool_size: usize) -> Self {
        Self {
            available_buffers: Mutex::new(Vec::new()),
            buffer_size,
            max_pool_size,
            total_created: AtomicUsize::new(0),
            total_returned: AtomicUsize::new(0),
            total_acquired: AtomicUsize::new(0),
            memory_usage: AtomicU64::new(0),
            peak_memory_usage: AtomicU64::new(0),
            last_cleanup: RwLock::new(Instant::now()),
            leak_threshold: max_pool_size * 2, // Alert if 2x pool size unreturned
            auto_gc_enabled: AtomicBool::new(true),
            gc_threshold_mb: 100, // Trigger GC at 100MB
        }
    }

    /// OPTIMIZATION: Get a buffer from the pool with memory tracking
    pub async fn get_buffer(&self) -> Vec<f32> {
        let mut available = self.available_buffers.lock().await;

        let buffer = if let Some(buffer) = available.pop() {
            debug!("Reusing buffer from pool (available: {})", available.len());
            buffer
        } else {
            // Create new buffer
            let buffer = vec![0.0; self.buffer_size];
            let buffer_size_bytes = (self.buffer_size * std::mem::size_of::<f32>()) as u64;

            // Update memory tracking
            self.total_created.fetch_add(1, Ordering::Relaxed);
            let new_usage = self.memory_usage.fetch_add(buffer_size_bytes, Ordering::Relaxed) + buffer_size_bytes;

            // Update peak memory usage
            let mut peak = self.peak_memory_usage.load(Ordering::Relaxed);
            while new_usage > peak {
                match self.peak_memory_usage.compare_exchange_weak(
                    peak,
                    new_usage,
                    Ordering::Relaxed,
                    Ordering::Relaxed
                ) {
                    Ok(_) => break,
                    Err(x) => peak = x,
                }
            }

            debug!("Created new buffer (total: {}, memory: {} MB)",
                   self.total_created.load(Ordering::Relaxed),
                   new_usage / 1_048_576);

            buffer
        };

        self.total_acquired.fetch_add(1, Ordering::Relaxed);

        // Check for memory leaks
        self.check_for_leaks().await;

        // Check if GC should be triggered
        self.maybe_trigger_gc().await;

        buffer
    }

    /// OPTIMIZATION: Return a buffer to the pool with validation
    pub async fn return_buffer(&self, mut buffer: Vec<f32>) {
        // Validate buffer size
        if buffer.len() != self.buffer_size {
            warn!("Buffer size mismatch: expected {}, got {}", self.buffer_size, buffer.len());
            return;
        }

        let mut available = self.available_buffers.lock().await;

        if available.len() < self.max_pool_size {
            buffer.fill(0.0); // Clear the buffer
            available.push(buffer);
            self.total_returned.fetch_add(1, Ordering::Relaxed);
            debug!("Returned buffer to pool (available: {})", available.len());
        } else {
            // Pool is full, drop the buffer and update memory tracking
            let buffer_size_bytes = (self.buffer_size * std::mem::size_of::<f32>()) as u64;
            self.memory_usage.fetch_sub(buffer_size_bytes, Ordering::Relaxed);
            debug!("Pool full, dropping buffer");
        }
    }

    /// OPTIMIZATION: Check for memory leaks
    async fn check_for_leaks(&self) {
        let created = self.total_created.load(Ordering::Relaxed);
        let returned = self.total_returned.load(Ordering::Relaxed);
        let unreturned = created.saturating_sub(returned);

        if unreturned > self.leak_threshold {
            warn!("Potential memory leak detected: {} unreturned buffers (threshold: {})",
                  unreturned, self.leak_threshold);
            warn!("Created: {}, Returned: {}, Acquired: {}",
                  created, returned, self.total_acquired.load(Ordering::Relaxed));
        }
    }

    /// OPTIMIZATION: Maybe trigger garbage collection
    async fn maybe_trigger_gc(&self) {
        if !self.auto_gc_enabled.load(Ordering::Relaxed) {
            return;
        }

        let memory_mb = self.memory_usage.load(Ordering::Relaxed) / 1_048_576;

        if memory_mb > self.gc_threshold_mb {
            info!("Memory usage ({} MB) exceeds threshold ({} MB), suggesting GC",
                  memory_mb, self.gc_threshold_mb);

            // In Rust, we can't force GC, but we can drop unused buffers
            self.shrink_pool().await;
        }
    }

    /// OPTIMIZATION: Shrink pool to reduce memory usage
    async fn shrink_pool(&self) {
        let mut available = self.available_buffers.lock().await;
        let original_size = available.len();

        // Keep only half of the buffers
        let target_size = self.max_pool_size / 2;

        if available.len() > target_size {
            let to_remove = available.len() - target_size;
            available.truncate(target_size);

            let buffer_size_bytes = (self.buffer_size * std::mem::size_of::<f32>() * to_remove) as u64;
            self.memory_usage.fetch_sub(buffer_size_bytes, Ordering::Relaxed);

            info!("Shrunk pool from {} to {} buffers (freed {} MB)",
                  original_size, target_size, buffer_size_bytes / 1_048_576);
        }

        *self.last_cleanup.write().await = Instant::now();
    }

    /// Clear all buffers
    pub async fn clear_pool(&self) {
        let mut available = self.available_buffers.lock().await;
        let count = available.len();
        available.clear();

        let buffer_size_bytes = (self.buffer_size * std::mem::size_of::<f32>() * count) as u64;
        self.memory_usage.fetch_sub(buffer_size_bytes, Ordering::Relaxed);

        info!("Cleared pool: {} buffers (freed {} MB)", count, buffer_size_bytes / 1_048_576);
    }

    /// OPTIMIZATION: Get memory statistics
    pub async fn get_stats(&self) -> AudioBufferPoolStats {
        let available = self.available_buffers.lock().await;

        AudioBufferPoolStats {
            buffer_size: self.buffer_size,
            max_pool_size: self.max_pool_size,
            available_buffers: available.len(),
            total_created: self.total_created.load(Ordering::Relaxed),
            total_returned: self.total_returned.load(Ordering::Relaxed),
            total_acquired: self.total_acquired.load(Ordering::Relaxed),
            memory_usage_bytes: self.memory_usage.load(Ordering::Relaxed),
            peak_memory_usage_bytes: self.peak_memory_usage.load(Ordering::Relaxed),
            unreturned_buffers: self.total_created.load(Ordering::Relaxed)
                .saturating_sub(self.total_returned.load(Ordering::Relaxed)),
        }
    }

    /// OPTIMIZATION: Enable/disable automatic GC
    pub fn set_auto_gc(&self, enabled: bool) {
        self.auto_gc_enabled.store(enabled, Ordering::Relaxed);
        info!("Automatic GC {}", if enabled { "enabled" } else { "disabled" });
    }

    /// OPTIMIZATION: Set GC threshold
    pub fn set_gc_threshold_mb(&mut self, threshold_mb: u64) {
        self.gc_threshold_mb = threshold_mb;
        info!("GC threshold set to {} MB", threshold_mb);
    }
}

/// OPTIMIZATION: Audio buffer pool statistics
#[derive(Debug, Clone)]
pub struct AudioBufferPoolStats {
    pub buffer_size: usize,
    pub max_pool_size: usize,
    pub available_buffers: usize,
    pub total_created: usize,
    pub total_returned: usize,
    pub total_acquired: usize,
    pub memory_usage_bytes: u64,
    pub peak_memory_usage_bytes: u64,
    pub unreturned_buffers: usize,
}

/// Shared resource manager instance
static RESOURCE_MANAGER: std::sync::OnceLock<Arc<Mutex<ResourceManager>>> = std::sync::OnceLock::new();

/// OPTIMIZATION: Global audio buffer pool instance
static AUDIO_BUFFER_POOL: std::sync::OnceLock<Arc<AudioBufferPool>> = std::sync::OnceLock::new();

/// Get the global resource manager
pub fn get_resource_manager() -> &'static Arc<Mutex<ResourceManager>> {
    RESOURCE_MANAGER.get_or_init(|| Arc::new(Mutex::new(ResourceManager::new())))
}

/// OPTIMIZATION: Get the global audio buffer pool
pub fn get_audio_buffer_pool() -> &'static Arc<AudioBufferPool> {
    AUDIO_BUFFER_POOL.get_or_init(|| {
        info!("Initializing global audio buffer pool (buffer_size: 4096, max_pool_size: 20)");
        Arc::new(AudioBufferPool::new(4096, 20))
    })
}

/// OPTIMIZATION: Get audio buffer pool statistics
pub async fn get_audio_pool_stats() -> AudioBufferPoolStats {
    let pool = get_audio_buffer_pool();
    pool.get_stats().await
}

/// OPTIMIZATION: Clear audio buffer pool
pub async fn clear_audio_pool() {
    let pool = get_audio_buffer_pool();
    pool.clear_pool().await;
}

/// Background task for periodic cleanup
pub async fn start_cleanup_task() {
    let resource_manager = get_resource_manager().clone();
    let audio_pool = get_audio_buffer_pool().clone();

    tokio::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_secs(30));

        loop {
            interval.tick().await;

            // Resource manager cleanup
            let manager = resource_manager.lock().await;
            if manager.needs_cleanup() {
                let rm = resource_manager.clone();
                tokio::spawn(async move {
                    let mut manager = rm.lock().await;
                    manager.cleanup().await;
                });
            }
            drop(manager);

            // OPTIMIZATION: Audio buffer pool monitoring
            let stats = audio_pool.get_stats().await;
            debug!("Audio pool stats: available={}, created={}, returned={}, unreturned={}, memory={} MB",
                   stats.available_buffers,
                   stats.total_created,
                   stats.total_returned,
                   stats.unreturned_buffers,
                   stats.memory_usage_bytes / 1_048_576);

            // OPTIMIZATION: Shrink pool if needed (every 5 minutes)
            if stats.available_buffers > stats.max_pool_size / 2 {
                audio_pool.shrink_pool().await;
            }
        }
    });
}