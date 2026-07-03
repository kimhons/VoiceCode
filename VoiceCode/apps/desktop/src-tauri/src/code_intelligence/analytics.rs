#![allow(dead_code, unused_variables, unused_imports)]
// Analytics & Observability - Track effectiveness and usage patterns
// Metrics for understanding VoiceCode performance

use std::collections::HashMap;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use parking_lot::RwLock;
use chrono::{DateTime, Utc, Duration};

/// Analytics system for VoiceCode
pub struct Analytics {
    storage_path: PathBuf,
    metrics: RwLock<MetricsStore>,
    sessions: RwLock<Vec<Session>>,
    current_session: RwLock<Option<Session>>,
    config: AnalyticsConfig,
}

#[derive(Debug, Clone)]
pub struct AnalyticsConfig {
    pub enabled: bool,
    pub anonymous: bool,
    pub retention_days: u32,
    pub sample_rate: f32,
}

impl Default for AnalyticsConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            anonymous: true,
            retention_days: 30,
            sample_rate: 1.0,
        }
    }
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct MetricsStore {
    pub commands: CommandMetrics,
    pub completions: CompletionMetrics,
    pub voice: VoiceMetrics,
    pub performance: PerformanceMetrics,
    pub errors: ErrorMetrics,
    pub usage: UsageMetrics,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct CommandMetrics {
    pub total_commands: u64,
    pub successful_commands: u64,
    pub failed_commands: u64,
    pub by_type: HashMap<String, u64>,
    pub avg_response_time_ms: f64,
    pub correction_count: u64,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct CompletionMetrics {
    pub total_completions: u64,
    pub accepted_completions: u64,
    pub rejected_completions: u64,
    pub acceptance_rate: f32,
    pub avg_tokens_generated: f64,
    pub by_model: HashMap<String, u64>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct VoiceMetrics {
    pub total_voice_commands: u64,
    pub successful_transcriptions: u64,
    pub failed_transcriptions: u64,
    pub avg_confidence: f32,
    pub interruption_count: u64,
    pub avg_duration_ms: f64,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct PerformanceMetrics {
    pub avg_latency_ms: f64,
    pub p95_latency_ms: f64,
    pub p99_latency_ms: f64,
    pub context_build_time_ms: f64,
    pub token_usage: TokenUsageMetrics,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct TokenUsageMetrics {
    pub total_input_tokens: u64,
    pub total_output_tokens: u64,
    pub wasted_tokens: u64,
    pub efficiency_rate: f32,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ErrorMetrics {
    pub total_errors: u64,
    pub by_type: HashMap<String, u64>,
    pub recent_errors: Vec<ErrorRecord>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorRecord {
    pub timestamp: DateTime<Utc>,
    pub error_type: String,
    pub message: String,
    pub context: Option<String>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct UsageMetrics {
    pub total_sessions: u64,
    pub total_time_minutes: f64,
    pub daily_active_hours: HashMap<String, f64>,
    pub feature_usage: HashMap<String, u64>,
    pub files_modified: u64,
    pub lines_generated: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    pub id: String,
    pub started_at: DateTime<Utc>,
    pub ended_at: Option<DateTime<Utc>>,
    pub commands: u32,
    pub completions: u32,
    pub voice_commands: u32,
    pub errors: u32,
}

/// Event to track
#[derive(Debug, Clone)]
pub enum AnalyticsEvent {
    CommandExecuted { command_type: String, success: bool, duration_ms: u64 },
    CompletionGenerated { model: String, tokens: u32, accepted: bool },
    VoiceCommand { success: bool, confidence: f32, duration_ms: u64 },
    Error { error_type: String, message: String },
    FeatureUsed { feature: String },
    FileModified { lines_changed: u32 },
    SessionStarted,
    SessionEnded,
}

impl Analytics {
    pub fn new(storage_path: PathBuf, config: AnalyticsConfig) -> Self {
        Self {
            storage_path,
            metrics: RwLock::new(MetricsStore::default()),
            sessions: RwLock::new(Vec::new()),
            current_session: RwLock::new(None),
            config,
        }
    }

    /// Track an event
    pub fn track(&self, event: AnalyticsEvent) {
        if !self.config.enabled {
            return;
        }

        // Sample rate check
        if self.config.sample_rate < 1.0 {
            let sample: f32 = rand::random();
            if sample > self.config.sample_rate {
                return;
            }
        }

        let mut metrics = self.metrics.write();

        match event {
            AnalyticsEvent::CommandExecuted { command_type, success, duration_ms } => {
                metrics.commands.total_commands += 1;
                if success {
                    metrics.commands.successful_commands += 1;
                } else {
                    metrics.commands.failed_commands += 1;
                }
                *metrics.commands.by_type.entry(command_type).or_insert(0) += 1;
                
                // Update rolling average
                let n = metrics.commands.total_commands as f64;
                metrics.commands.avg_response_time_ms = 
                    (metrics.commands.avg_response_time_ms * (n - 1.0) + duration_ms as f64) / n;

                if let Some(ref mut session) = *self.current_session.write() {
                    session.commands += 1;
                }
            }
            AnalyticsEvent::CompletionGenerated { model, tokens, accepted } => {
                metrics.completions.total_completions += 1;
                if accepted {
                    metrics.completions.accepted_completions += 1;
                } else {
                    metrics.completions.rejected_completions += 1;
                }
                *metrics.completions.by_model.entry(model).or_insert(0) += 1;
                
                let n = metrics.completions.total_completions as f64;
                metrics.completions.avg_tokens_generated = 
                    (metrics.completions.avg_tokens_generated * (n - 1.0) + tokens as f64) / n;
                
                metrics.completions.acceptance_rate = 
                    metrics.completions.accepted_completions as f32 / 
                    metrics.completions.total_completions.max(1) as f32;

                if let Some(ref mut session) = *self.current_session.write() {
                    session.completions += 1;
                }
            }
            AnalyticsEvent::VoiceCommand { success, confidence, duration_ms } => {
                metrics.voice.total_voice_commands += 1;
                if success {
                    metrics.voice.successful_transcriptions += 1;
                } else {
                    metrics.voice.failed_transcriptions += 1;
                }
                
                let n = metrics.voice.total_voice_commands as f64;
                metrics.voice.avg_confidence = 
                    (metrics.voice.avg_confidence * (n as f32 - 1.0) + confidence) / n as f32;
                metrics.voice.avg_duration_ms = 
                    (metrics.voice.avg_duration_ms * (n - 1.0) + duration_ms as f64) / n;

                if let Some(ref mut session) = *self.current_session.write() {
                    session.voice_commands += 1;
                }
            }
            AnalyticsEvent::Error { error_type, message } => {
                metrics.errors.total_errors += 1;
                *metrics.errors.by_type.entry(error_type.clone()).or_insert(0) += 1;
                
                metrics.errors.recent_errors.push(ErrorRecord {
                    timestamp: Utc::now(),
                    error_type,
                    message,
                    context: None,
                });
                
                // Keep only recent errors
                if metrics.errors.recent_errors.len() > 100 {
                    metrics.errors.recent_errors.remove(0);
                }

                if let Some(ref mut session) = *self.current_session.write() {
                    session.errors += 1;
                }
            }
            AnalyticsEvent::FeatureUsed { feature } => {
                *metrics.usage.feature_usage.entry(feature).or_insert(0) += 1;
            }
            AnalyticsEvent::FileModified { lines_changed } => {
                metrics.usage.files_modified += 1;
                metrics.usage.lines_generated += lines_changed as u64;
            }
            AnalyticsEvent::SessionStarted => {
                let session = Session {
                    id: uuid::Uuid::new_v4().to_string(),
                    started_at: Utc::now(),
                    ended_at: None,
                    commands: 0,
                    completions: 0,
                    voice_commands: 0,
                    errors: 0,
                };
                *self.current_session.write() = Some(session);
                metrics.usage.total_sessions += 1;
            }
            AnalyticsEvent::SessionEnded => {
                if let Some(mut session) = self.current_session.write().take() {
                    session.ended_at = Some(Utc::now());
                    
                    let duration = session.ended_at.unwrap() - session.started_at;
                    metrics.usage.total_time_minutes += duration.num_minutes() as f64;
                    
                    let date = session.started_at.format("%Y-%m-%d").to_string();
                    *metrics.usage.daily_active_hours.entry(date).or_insert(0.0) += 
                        duration.num_minutes() as f64 / 60.0;
                    
                    self.sessions.write().push(session);
                }
            }
        }
    }

    /// Track latency
    pub fn track_latency(&self, latency_ms: u64) {
        let mut metrics = self.metrics.write();
        let n = (metrics.commands.total_commands + 1) as f64;
        metrics.performance.avg_latency_ms = 
            (metrics.performance.avg_latency_ms * (n - 1.0) + latency_ms as f64) / n;
    }

    /// Track token usage
    pub fn track_tokens(&self, input: u64, output: u64, wasted: u64) {
        let mut metrics = self.metrics.write();
        metrics.performance.token_usage.total_input_tokens += input;
        metrics.performance.token_usage.total_output_tokens += output;
        metrics.performance.token_usage.wasted_tokens += wasted;
        
        let total = metrics.performance.token_usage.total_input_tokens + 
                   metrics.performance.token_usage.total_output_tokens;
        metrics.performance.token_usage.efficiency_rate = 
            1.0 - (metrics.performance.token_usage.wasted_tokens as f32 / total.max(1) as f32);
    }

    /// Get current metrics
    pub fn get_metrics(&self) -> MetricsStore {
        self.metrics.read().clone()
    }

    /// Get summary report
    pub fn get_summary(&self) -> AnalyticsSummary {
        let metrics = self.metrics.read();
        
        AnalyticsSummary {
            total_commands: metrics.commands.total_commands,
            success_rate: metrics.commands.successful_commands as f32 / 
                         metrics.commands.total_commands.max(1) as f32,
            completion_acceptance_rate: metrics.completions.acceptance_rate,
            voice_accuracy: metrics.voice.successful_transcriptions as f32 / 
                           metrics.voice.total_voice_commands.max(1) as f32,
            avg_latency_ms: metrics.performance.avg_latency_ms,
            token_efficiency: metrics.performance.token_usage.efficiency_rate,
            error_rate: metrics.errors.total_errors as f32 / 
                       metrics.commands.total_commands.max(1) as f32,
            total_time_saved_minutes: self.estimate_time_saved(&metrics),
        }
    }

    fn estimate_time_saved(&self, metrics: &MetricsStore) -> f64 {
        // Rough estimate: each successful command saves ~2 minutes
        // Each accepted completion saves ~1 minute
        let command_savings = metrics.commands.successful_commands as f64 * 2.0;
        let completion_savings = metrics.completions.accepted_completions as f64 * 1.0;
        command_savings + completion_savings
    }

    /// Save metrics to disk
    pub async fn save(&self) -> Result<(), String> {
        let data = AnalyticsData {
            metrics: self.metrics.read().clone(),
            sessions: self.sessions.read().clone(),
            saved_at: Utc::now(),
        };

        let json = serde_json::to_string_pretty(&data)
            .map_err(|e| format!("Serialization error: {}", e))?;

        tokio::fs::write(&self.storage_path, json).await
            .map_err(|e| format!("Write error: {}", e))
    }

    /// Load metrics from disk
    pub async fn load(&self) -> Result<(), String> {
        if !self.storage_path.exists() {
            return Ok(());
        }

        let json = tokio::fs::read_to_string(&self.storage_path).await
            .map_err(|e| format!("Read error: {}", e))?;

        let data: AnalyticsData = serde_json::from_str(&json)
            .map_err(|e| format!("Parse error: {}", e))?;

        *self.metrics.write() = data.metrics;
        *self.sessions.write() = data.sessions;

        // Cleanup old data
        self.cleanup_old_data();

        Ok(())
    }

    fn cleanup_old_data(&self) {
        let cutoff = Utc::now() - Duration::days(self.config.retention_days as i64);
        
        let mut sessions = self.sessions.write();
        sessions.retain(|s| s.started_at > cutoff);

        let mut metrics = self.metrics.write();
        metrics.errors.recent_errors.retain(|e| e.timestamp > cutoff);
    }

    /// Export metrics as JSON
    pub fn export_json(&self) -> String {
        let metrics = self.metrics.read();
        serde_json::to_string_pretty(&*metrics).unwrap_or_default()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct AnalyticsData {
    metrics: MetricsStore,
    sessions: Vec<Session>,
    saved_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalyticsSummary {
    pub total_commands: u64,
    pub success_rate: f32,
    pub completion_acceptance_rate: f32,
    pub voice_accuracy: f32,
    pub avg_latency_ms: f64,
    pub token_efficiency: f32,
    pub error_rate: f32,
    pub total_time_saved_minutes: f64,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_analytics_creation() {
        let analytics = Analytics::new(
            PathBuf::from("/tmp/analytics.json"),
            AnalyticsConfig::default(),
        );
        
        let metrics = analytics.get_metrics();
        assert_eq!(metrics.commands.total_commands, 0);
    }

    #[test]
    fn test_track_command() {
        let analytics = Analytics::new(
            PathBuf::from("/tmp/analytics.json"),
            AnalyticsConfig::default(),
        );

        analytics.track(AnalyticsEvent::CommandExecuted {
            command_type: "generate".to_string(),
            success: true,
            duration_ms: 100,
        });

        let metrics = analytics.get_metrics();
        assert_eq!(metrics.commands.total_commands, 1);
        assert_eq!(metrics.commands.successful_commands, 1);
    }

    #[test]
    fn test_session_tracking() {
        let analytics = Analytics::new(
            PathBuf::from("/tmp/analytics.json"),
            AnalyticsConfig::default(),
        );

        analytics.track(AnalyticsEvent::SessionStarted);
        analytics.track(AnalyticsEvent::CommandExecuted {
            command_type: "test".to_string(),
            success: true,
            duration_ms: 50,
        });
        analytics.track(AnalyticsEvent::SessionEnded);

        let metrics = analytics.get_metrics();
        assert_eq!(metrics.usage.total_sessions, 1);
    }
}
