//! Error boundary and recovery module for VoiceFlow Pro
//! Provides comprehensive error handling and recovery mechanisms

use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::{Mutex, oneshot};
use std::collections::{VecDeque, HashMap};
use serde::{Deserialize, Serialize};
use crate::errors::{AppError, ErrorReporter};

/// Error recovery strategy
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RecoveryStrategy {
    /// Retry the operation
    Retry {
        max_attempts: usize,
        delay_ms: u64,
        exponential_backoff: bool,
    },
    /// Fallback to alternative implementation
    Fallback(String),
    /// Skip the operation
    Skip,
    /// Shutdown and restart component
    Restart,
    /// Custom recovery action
    Custom(String),
}

/// Error boundary configuration
#[derive(Debug, Clone)]
pub struct ErrorBoundaryConfig {
    /// Maximum recovery attempts per error
    pub max_recovery_attempts: usize,
    /// Default recovery delay
    pub default_recovery_delay: Duration,
    /// Enable automatic recovery
    pub enable_automatic_recovery: bool,
    /// Maximum errors per minute before circuit breaker opens
    pub error_threshold: usize,
    /// Circuit breaker timeout
    pub circuit_breaker_timeout: Duration,
}

impl Default for ErrorBoundaryConfig {
    fn default() -> Self {
        Self {
            max_recovery_attempts: 3,
            default_recovery_delay: Duration::from_millis(1000),
            enable_automatic_recovery: true,
            error_threshold: 10,
            circuit_breaker_timeout: Duration::from_secs(60),
        }
    }
}

/// Circuit breaker state
#[derive(Debug, Clone, PartialEq)]
pub enum CircuitBreakerState {
    Closed,   // Normal operation
    Open,     // Blocking requests
    HalfOpen, // Testing if service recovered
}

/// Error boundary for a component
pub struct ErrorBoundary {
    /// Component name
    name: String,
    /// Current circuit breaker state
    circuit_breaker_state: Arc<Mutex<CircuitBreakerState>>,
    /// Error count (rolling window)
    error_count: Arc<Mutex<VecDeque<Instant>>>,
    /// Last error timestamp
    last_error: Arc<Mutex<Option<Instant>>>,
    /// Recovery attempts for current error
    recovery_attempts: Arc<Mutex<usize>>,
    /// Configuration
    config: ErrorBoundaryConfig,
    /// Error reporter
    error_reporter: Arc<Mutex<ErrorReporter>>,
}

impl ErrorBoundary {
    /// Create a new error boundary
    pub fn new(name: String, config: Option<ErrorBoundaryConfig>) -> Self {
        Self {
            name,
            circuit_breaker_state: Arc::new(Mutex::new(CircuitBreakerState::Closed)),
            error_count: Arc::new(Mutex::new(VecDeque::new())),
            last_error: Arc::new(Mutex::new(None)),
            recovery_attempts: Arc::new(Mutex::new(0)),
            config: config.unwrap_or_default(),
            error_reporter: Arc::new(Mutex::new(ErrorReporter::new())),
        }
    }

    /// Execute an operation with error boundary protection
    pub async fn execute<T, F, R, E>(&self, operation: F) -> Result<T, E>
    where
        F: FnOnce() -> R,
        R: std::future::Future<Output = Result<T, E>>,
        E: From<AppError> + std::fmt::Display,
    {
        // Check circuit breaker state
        let state = *self.circuit_breaker_state.lock().await;
        match state {
            CircuitBreakerState::Open => {
                // Check if timeout has elapsed to try half-open state
                if let Some(last_error) = *self.last_error.lock().await {
                    if last_error.elapsed() > self.config.circuit_breaker_timeout {
                        // Transition to half-open
                        *self.circuit_breaker_state.lock().await = CircuitBreakerState::HalfOpen;
                    } else {
                        return Err(E::from(AppError::Internal(
                            format!("Circuit breaker is open for component: {}", self.name)
                        )));
                    }
                }
            }
            CircuitBreakerState::HalfOpen => {
                // Allow one trial request
                *self.circuit_breaker_state.lock().await = CircuitBreakerState::Closed;
            }
            CircuitBreakerState::Closed => {
                // Normal operation
            }
        }

        // Execute the operation
        let result = operation().await;

        match result {
            Ok(value) => {
                // Success - reset error tracking
                self.on_success().await;
                Ok(value)
            }
            Err(error) => {
                // Error - handle with recovery strategy
                self.on_error(error).await
            }
        }
    }

    /// Handle successful operation
    async fn on_success(&self) {
        // Reset error count
        {
            let mut error_count = self.error_count.lock().await;
            error_count.clear();
        }

        // Reset recovery attempts
        {
            let mut recovery_attempts = self.recovery_attempts.lock().await;
            *recovery_attempts = 0;
        }

        // Clear last error
        {
            let mut last_error = self.last_error.lock().await;
            *last_error = None;
        }

        // Ensure circuit breaker is closed
        if *self.circuit_breaker_state.lock().await != CircuitBreakerState::Closed {
            *self.circuit_breaker_state.lock().await = CircuitBreakerState::Closed;
        }
    }

    /// Handle error and attempt recovery
    async fn on_error<T, E>(&self, error: E) -> Result<T, E>
    where
        E: From<AppError> + std::fmt::Display,
    {
        let error_str = error.to_string();
        let error_app = AppError::Internal(format!("{}: {}", self.name, error_str.clone()));

        // Record error
        self.record_error().await;

        // Report error
        {
            let mut reporter = self.error_reporter.lock().await;
            reporter.report_error(&error_app);
        }

        // Check if we should attempt recovery
        if !self.config.enable_automatic_recovery {
            return Err(error);
        }

        let recovery_attempts = *self.recovery_attempts.lock().await;
        if recovery_attempts >= self.config.max_recovery_attempts {
            // Max recovery attempts reached
            self.open_circuit_breaker().await;
            return Err(error);
        }

        // Increment recovery attempts
        {
            let mut recovery_attempts = self.recovery_attempts.lock().await;
            *recovery_attempts += 1;
        }

        // Attempt recovery
        if let Some(strategy) = self.determine_recovery_strategy(&error_str).await {
            self.attempt_recovery(&strategy).await;
        }

        Err(error)
    }

    /// Record an error
    async fn record_error(&self) {
        let now = Instant::now();
        
        {
            let mut error_count = self.error_count.lock().await;
            error_count.push_back(now);
            
            // Remove old errors (older than 1 minute)
            while let Some(&first_error) = error_count.front() {
                if first_error.elapsed() > Duration::from_secs(60) {
                    error_count.pop_front();
                } else {
                    break;
                }
            }
        }

        // Update last error
        {
            let mut last_error = self.last_error.lock().await;
            *last_error = Some(now);
        }

        // Check error threshold
        let error_count = {
            let error_count = self.error_count.lock().await;
            error_count.len()
        };

        if error_count >= self.config.error_threshold {
            self.open_circuit_breaker().await;
        }
    }

    /// Open the circuit breaker
    async fn open_circuit_breaker(&self) {
        *self.circuit_breaker_state.lock().await = CircuitBreakerState::Open;
        let mut last_error = self.last_error.lock().await;
        *last_error = Some(Instant::now());
    }

    /// Determine appropriate recovery strategy
    async fn determine_recovery_strategy(&self, error_msg: &str) -> Option<RecoveryStrategy> {
        // Analyze error type and determine recovery strategy
        let error_lower = error_msg.to_lowercase();

        if error_lower.contains("memory") || error_lower.contains("allocation") {
            Some(RecoveryStrategy::Restart)
        } else if error_lower.contains("timeout") {
            Some(RecoveryStrategy::Retry {
                max_attempts: 3,
                delay_ms: 2000,
                exponential_backoff: true,
            })
        } else if error_lower.contains("network") || error_lower.contains("connection") {
            Some(RecoveryStrategy::Fallback("cache".to_string()))
        } else if error_lower.contains("validation") {
            Some(RecoveryStrategy::Skip)
        } else {
            Some(RecoveryStrategy::Retry {
                max_attempts: 1,
                delay_ms: 1000,
                exponential_backoff: false,
            })
        }
    }

    /// Attempt recovery using specified strategy
    async fn attempt_recovery(&self, strategy: &RecoveryStrategy) {
        match strategy {
            RecoveryStrategy::Retry { max_attempts, delay_ms, exponential_backoff } => {
                let delay = if *exponential_backoff {
                    let attempts = *self.recovery_attempts.lock().await;
                    Duration::from_millis(*delay_ms * (2u64.saturating_pow(attempts as u32 - 1)))
                } else {
                    Duration::from_millis(*delay_ms)
                };

                tokio::time::sleep(delay).await;
                // In a real implementation, you'd retry the operation here
            }
            RecoveryStrategy::Fallback(_) => {
                // Activate fallback mechanism
                tokio::time::sleep(Duration::from_millis(500)).await;
            }
            RecoveryStrategy::Skip => {
                // Log the skip and continue
                tokio::time::sleep(Duration::from_millis(100)).await;
            }
            RecoveryStrategy::Restart => {
                // Restart the component
                tokio::time::sleep(Duration::from_millis(2000)).await;
                self.force_restart().await;
            }
            RecoveryStrategy::Custom(_) => {
                // Execute custom recovery
                tokio::time::sleep(Duration::from_millis(1000)).await;
            }
        }
    }

    /// Force restart the component
    async fn force_restart(&self) {
        // Reset all state
        {
            let mut error_count = self.error_count.lock().await;
            error_count.clear();
        }
        {
            let mut recovery_attempts = self.recovery_attempts.lock().await;
            *recovery_attempts = 0;
        }
        {
            let mut last_error = self.last_error.lock().await;
            *last_error = None;
        }

        // Open circuit breaker
        self.open_circuit_breaker().await;
    }

    /// Get current circuit breaker state
    pub async fn get_circuit_breaker_state(&self) -> CircuitBreakerState {
        *self.circuit_breaker_state.lock().await
    }

    /// Get error statistics
    pub async fn get_error_stats(&self) -> ErrorStats {
        let error_count = {
            let error_count = self.error_count.lock().await;
            error_count.len()
        };

        let last_error = {
            let last_error = self.last_error.lock().await;
            last_error.map(|t| t.elapsed())
        };

        let recovery_attempts = *self.recovery_attempts.lock().await;
        let circuit_breaker_state = *self.circuit_breaker_state.lock().await;

        ErrorStats {
            name: self.name.clone(),
            error_count,
            last_error_duration: last_error,
            recovery_attempts,
            circuit_breaker_state,
            total_errors: self.error_reporter.lock().await.get_error_count(),
            recent_errors: self.error_reporter.lock().await.get_recent_errors(),
        }
    }

    /// Manually reset the error boundary
    pub async fn reset(&self) {
        {
            let mut error_count = self.error_count.lock().await;
            error_count.clear();
        }
        {
            let mut recovery_attempts = self.recovery_attempts.lock().await;
            *recovery_attempts = 0;
        }
        {
            let mut last_error = self.last_error.lock().await;
            *last_error = None;
        }

        *self.circuit_breaker_state.lock().await = CircuitBreakerState::Closed;

        let mut reporter = self.error_reporter.lock().await;
        reporter.clear_errors();
    }
}

/// Error statistics for monitoring
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorStats {
    pub name: String,
    pub error_count: usize,
    pub last_error_duration: Option<Duration>,
    pub recovery_attempts: usize,
    pub circuit_breaker_state: CircuitBreakerState,
    pub total_errors: u64,
    pub recent_errors: Vec<String>,
}

/// Error boundary registry for managing multiple components
pub struct ErrorBoundaryRegistry {
    boundaries: Arc<Mutex<HashMap<String, Arc<ErrorBoundary>>>>,
}

impl Default for ErrorBoundaryRegistry {
    fn default() -> Self {
        Self::new()
    }
}

impl ErrorBoundaryRegistry {
    pub fn new() -> Self {
        Self {
            boundaries: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    /// Register an error boundary
    pub async fn register(&self, name: String, boundary: Arc<ErrorBoundary>) {
        let mut boundaries = self.boundaries.lock().await;
        boundaries.insert(name, boundary);
    }

    /// Get an error boundary by name
    pub async fn get(&self, name: &str) -> Option<Arc<ErrorBoundary>> {
        let boundaries = self.boundaries.lock().await;
        boundaries.get(name).cloned()
    }

    /// Remove an error boundary
    pub async fn remove(&self, name: &str) {
        let mut boundaries = self.boundaries.lock().await;
        boundaries.remove(name);
    }

    /// Get all error statistics
    pub async fn get_all_stats(&self) -> Vec<ErrorStats> {
        let boundaries = self.boundaries.lock().await;
        let mut stats = Vec::new();

        for (name, boundary) in boundaries.iter() {
            stats.push(boundary.get_error_stats().await);
        }

        stats
    }

    /// Reset all error boundaries
    pub async fn reset_all(&self) {
        let boundaries = self.boundaries.lock().await;
        for boundary in boundaries.values() {
            boundary.reset().await;
        }
    }
}

/// Global error boundary registry
static ERROR_BOUNDARY_REGISTRY: std::sync::OnceLock<Arc<ErrorBoundaryRegistry>> = std::sync::OnceLock::new();

/// Get the global error boundary registry
pub fn get_error_boundary_registry() -> &'static Arc<ErrorBoundaryRegistry> {
    ERROR_BOUNDARY_REGISTRY.get_or_init(|| Arc::new(ErrorBoundaryRegistry::new()))
}

/// Helper macro for error boundary protected operations
#[macro_export]
macro_rules! with_error_boundary {
    ($boundary:expr, $operation:expr) => {
        $boundary.execute(|| async { $operation }).await
    };
}

/// Background task for error boundary monitoring
pub async fn start_error_monitoring_task() {
    let registry = get_error_boundary_registry().clone();
    
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_secs(10));
        
        loop {
            interval.tick().await;
            
            // Get all error statistics
            let stats = registry.get_all_stats().await;
            
            // Log high error count components
            for stat in stats {
                if stat.error_count > 5 {
                    tracing::warn!(
                        component = stat.name,
                        error_count = stat.error_count,
                        circuit_breaker_state = ?stat.circuit_breaker_state,
                        "Component has high error count"
                    );
                }
                
                if stat.circuit_breaker_state == CircuitBreakerState::Open {
                    tracing::error!(
                        component = stat.name,
                        "Circuit breaker is open for component"
                    );
                }
            }
        }
    });
}