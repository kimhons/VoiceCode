//! Memory management module for VoiceFlow Pro
//! Provides proper resource cleanup and memory management

use std::sync::{Arc, Weak};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use tokio::sync::{Mutex, OwnedMutexGuard, MutexGuard};
use std::time::{Duration, Instant};
use std::collections::HashMap;
use tracing::{info, warn, error};

/// Resource management structure
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
            let mut engine_data = engine.lock().blocking_lock();
            engine_data.clear_cache();
        }

        // Clear caches in text processors
        for processor in self.text_processors.values() {
            let mut processor_data = processor.lock().blocking_lock();
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

/// Audio buffer pool for efficient memory management
pub struct AudioBufferPool {
    /// Available buffers
    available_buffers: Mutex<Vec<Vec<f32>>>,
    /// Buffer size
    buffer_size: usize,
    /// Maximum pool size
    max_pool_size: usize,
}

impl AudioBufferPool {
    pub fn new(buffer_size: usize, max_pool_size: usize) -> Self {
        Self {
            available_buffers: Mutex::new(Vec::new()),
            buffer_size,
            max_pool_size,
        }
    }

    /// Get a buffer from the pool
    pub async fn get_buffer(&self) -> Vec<f32> {
        let mut available = self.available_buffers.lock().await;
        if let Some(buffer) = available.pop() {
            buffer
        } else {
            vec![0.0; self.buffer_size]
        }
    }

    /// Return a buffer to the pool
    pub async fn return_buffer(&self, mut buffer: Vec<f32>) {
        let mut available = self.available_buffers.lock().await;
        if available.len() < self.max_pool_size && buffer.len() == self.buffer_size {
            buffer.fill(0.0); // Clear the buffer
            available.push(buffer);
        }
    }

    /// Clear all buffers
    pub async fn clear_pool(&self) {
        let mut available = self.available_buffers.lock().await;
        available.clear();
    }
}

/// Shared resource manager instance
static RESOURCE_MANAGER: std::sync::OnceLock<Arc<Mutex<ResourceManager>>> = std::sync::OnceLock::new();

/// Get the global resource manager
pub fn get_resource_manager() -> &'static Arc<Mutex<ResourceManager>> {
    RESOURCE_MANAGER.get_or_init(|| Arc::new(Mutex::new(ResourceManager::new())))
}

/// Background task for periodic cleanup
pub async fn start_cleanup_task() {
    let resource_manager = get_resource_manager().clone();
    
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_secs(30));
        
        loop {
            interval.tick().await;
            
            let mut manager = resource_manager.lock().await;
            if manager.needs_cleanup() {
                tokio::spawn(async move {
                    let mut manager = resource_manager.lock().await;
                    manager.cleanup().await;
                });
            }
        }
    });
}