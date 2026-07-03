#![allow(dead_code, unused_variables, unused_imports)]
// Ambient Intelligence - Proactive suggestions without explicit commands
// Background analysis and anticipation of user needs

use parking_lot::RwLock;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::broadcast;

/// Ambient intelligence engine
pub struct AmbientIntelligence {
    state: Arc<AmbientState>,
    config: AmbientConfig,
    suggestion_tx: broadcast::Sender<Suggestion>,
}

struct AmbientState {
    current_file: RwLock<Option<PathBuf>>,
    cursor_position: RwLock<Option<(u32, u32)>>,
    recent_edits: RwLock<Vec<EditEvent>>,
    recent_errors: RwLock<Vec<ErrorEvent>>,
    pending_suggestions: RwLock<Vec<Suggestion>>,
    context_cache: RwLock<HashMap<String, CachedContext>>,
    last_activity: RwLock<Instant>,
    is_active: RwLock<bool>,
}

#[derive(Debug, Clone)]
pub struct AmbientConfig {
    pub enable_auto_suggestions: bool,
    pub suggestion_delay_ms: u64,
    pub max_pending_suggestions: usize,
    pub error_pattern_threshold: u32,
    pub idle_trigger_seconds: u64,
    pub watch_patterns: Vec<String>,
}

impl Default for AmbientConfig {
    fn default() -> Self {
        Self {
            enable_auto_suggestions: true,
            suggestion_delay_ms: 2000,
            max_pending_suggestions: 5,
            error_pattern_threshold: 3,
            idle_trigger_seconds: 5,
            watch_patterns: vec![
                "TODO".to_string(),
                "FIXME".to_string(),
                "HACK".to_string(),
                "BUG".to_string(),
            ],
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Suggestion {
    pub id: String,
    pub suggestion_type: SuggestionType,
    pub title: String,
    pub description: String,
    pub action: Option<SuggestedAction>,
    pub priority: Priority,
    pub confidence: f32,
    pub context: SuggestionContext,
    pub created_at: u64,
    pub expires_at: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SuggestionType {
    CodeCompletion,
    Refactoring,
    ErrorFix,
    Import,
    Documentation,
    Test,
    Performance,
    Security,
    Accessibility,
    BestPractice,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Priority {
    Low,
    Medium,
    High,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SuggestedAction {
    pub action_type: ActionType,
    pub target_file: Option<String>,
    pub target_line: Option<u32>,
    pub code_change: Option<String>,
    pub command: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ActionType {
    InsertCode,
    ReplaceCode,
    DeleteCode,
    RunCommand,
    OpenFile,
    ShowDocs,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SuggestionContext {
    pub file: Option<String>,
    pub line: Option<u32>,
    pub symbol: Option<String>,
    pub related_files: Vec<String>,
}

#[derive(Debug, Clone)]
struct EditEvent {
    file: PathBuf,
    line: u32,
    change_type: EditType,
    content: String,
    timestamp: Instant,
}

#[derive(Debug, Clone)]
enum EditType {
    Insert,
    Delete,
    Modify,
}

#[derive(Debug, Clone)]
struct ErrorEvent {
    file: PathBuf,
    line: u32,
    message: String,
    error_type: String,
    timestamp: Instant,
}

#[derive(Debug, Clone)]
struct CachedContext {
    content: String,
    symbols: Vec<String>,
    imports: Vec<String>,
    cached_at: Instant,
}

impl AmbientIntelligence {
    pub fn new(config: AmbientConfig) -> Self {
        let (suggestion_tx, _) = broadcast::channel(100);

        Self {
            state: Arc::new(AmbientState {
                current_file: RwLock::new(None),
                cursor_position: RwLock::new(None),
                recent_edits: RwLock::new(Vec::new()),
                recent_errors: RwLock::new(Vec::new()),
                pending_suggestions: RwLock::new(Vec::new()),
                context_cache: RwLock::new(HashMap::new()),
                last_activity: RwLock::new(Instant::now()),
                is_active: RwLock::new(true),
            }),
            config,
            suggestion_tx,
        }
    }

    /// Subscribe to suggestions
    pub fn subscribe(&self) -> broadcast::Receiver<Suggestion> {
        self.suggestion_tx.subscribe()
    }

    /// Update current file context
    pub fn set_current_file(&self, file: PathBuf) {
        *self.state.current_file.write() = Some(file.clone());
        *self.state.last_activity.write() = Instant::now();

        // Trigger file analysis
        self.analyze_file(&file);
    }

    /// Update cursor position
    pub fn set_cursor_position(&self, line: u32, column: u32) {
        *self.state.cursor_position.write() = Some((line, column));
        *self.state.last_activity.write() = Instant::now();
    }

    /// Record an edit event
    pub fn record_edit(&self, file: &Path, line: u32, change_type: &str, content: &str) {
        let edit = EditEvent {
            file: file.to_path_buf(),
            line,
            change_type: match change_type {
                "insert" => EditType::Insert,
                "delete" => EditType::Delete,
                _ => EditType::Modify,
            },
            content: content.to_string(),
            timestamp: Instant::now(),
        };

        let mut edits = self.state.recent_edits.write();
        edits.push(edit);

        // Keep only recent edits
        let cutoff = Instant::now() - Duration::from_secs(60);
        edits.retain(|e| e.timestamp > cutoff);

        *self.state.last_activity.write() = Instant::now();

        // Analyze edit patterns
        self.analyze_edit_patterns();
    }

    /// Record an error
    pub fn record_error(&self, file: &Path, line: u32, message: &str, error_type: &str) {
        let error = ErrorEvent {
            file: file.to_path_buf(),
            line,
            message: message.to_string(),
            error_type: error_type.to_string(),
            timestamp: Instant::now(),
        };

        let mut errors = self.state.recent_errors.write();
        errors.push(error);

        // Check for error patterns
        self.check_error_patterns();
    }

    fn analyze_file(&self, file: &Path) {
        if !self.config.enable_auto_suggestions {
            return;
        }

        // Read file and check for patterns
        if let Ok(content) = std::fs::read_to_string(file) {
            // Check for TODO/FIXME patterns
            for (i, line) in content.lines().enumerate() {
                for pattern in &self.config.watch_patterns {
                    if line.contains(pattern) {
                        self.emit_suggestion(Suggestion {
                            id: uuid::Uuid::new_v4().to_string(),
                            suggestion_type: SuggestionType::BestPractice,
                            title: format!("{} found", pattern),
                            description: line.trim().to_string(),
                            action: None,
                            priority: if pattern == "BUG" || pattern == "FIXME" {
                                Priority::High
                            } else {
                                Priority::Low
                            },
                            confidence: 1.0,
                            context: SuggestionContext {
                                file: Some(file.to_string_lossy().to_string()),
                                line: Some(i as u32 + 1),
                                symbol: None,
                                related_files: vec![],
                            },
                            created_at: self.now(),
                            expires_at: None,
                        });
                    }
                }
            }

            // Check for missing imports
            self.check_missing_imports(&content, file);

            // Check for potential issues
            self.check_potential_issues(&content, file);
        }
    }

    fn check_missing_imports(&self, content: &str, file: &Path) {
        let extension = file.extension().and_then(|e| e.to_str()).unwrap_or("");

        // Simple heuristic: check for common patterns used without imports
        let patterns: Vec<(&str, &str)> = match extension {
            "ts" | "tsx" => vec![
                ("useState", "import { useState } from 'react';"),
                ("useEffect", "import { useEffect } from 'react';"),
                ("useCallback", "import { useCallback } from 'react';"),
                ("useMemo", "import { useMemo } from 'react';"),
            ],
            "rs" => vec![
                ("HashMap", "use std::collections::HashMap;"),
                ("HashSet", "use std::collections::HashSet;"),
                ("Arc", "use std::sync::Arc;"),
                ("Mutex", "use std::sync::Mutex;"),
            ],
            "py" => vec![
                ("Path", "from pathlib import Path"),
                ("datetime", "from datetime import datetime"),
                ("json", "import json"),
            ],
            _ => vec![],
        };

        for (symbol, import) in patterns {
            if content.contains(symbol)
                && !content.contains(import)
                && !content.contains(&format!("import {}", symbol))
            {
                self.emit_suggestion(Suggestion {
                    id: uuid::Uuid::new_v4().to_string(),
                    suggestion_type: SuggestionType::Import,
                    title: format!("Missing import for {}", symbol),
                    description: format!("Add: {}", import),
                    action: Some(SuggestedAction {
                        action_type: ActionType::InsertCode,
                        target_file: Some(file.to_string_lossy().to_string()),
                        target_line: Some(1),
                        code_change: Some(import.to_string()),
                        command: None,
                    }),
                    priority: Priority::Medium,
                    confidence: 0.8,
                    context: SuggestionContext {
                        file: Some(file.to_string_lossy().to_string()),
                        line: None,
                        symbol: Some(symbol.to_string()),
                        related_files: vec![],
                    },
                    created_at: self.now(),
                    expires_at: Some(self.now() + 300),
                });
            }
        }
    }

    fn check_potential_issues(&self, content: &str, file: &Path) {
        // Check for potential security issues
        let security_patterns = [
            ("eval(", "Avoid using eval() - security risk"),
            (
                "innerHTML",
                "innerHTML can lead to XSS - consider textContent",
            ),
            (
                "dangerouslySetInnerHTML",
                "Verify sanitization of dangerouslySetInnerHTML",
            ),
            (".unwrap()", "Consider handling errors instead of unwrap()"),
            ("password", "Ensure passwords are not logged or exposed"),
        ];

        for (pattern, message) in security_patterns {
            if content.contains(pattern) {
                self.emit_suggestion(Suggestion {
                    id: uuid::Uuid::new_v4().to_string(),
                    suggestion_type: SuggestionType::Security,
                    title: "Potential security concern".to_string(),
                    description: message.to_string(),
                    action: None,
                    priority: Priority::High,
                    confidence: 0.7,
                    context: SuggestionContext {
                        file: Some(file.to_string_lossy().to_string()),
                        line: None,
                        symbol: None,
                        related_files: vec![],
                    },
                    created_at: self.now(),
                    expires_at: Some(self.now() + 600),
                });
            }
        }
    }

    fn analyze_edit_patterns(&self) {
        let edits = self.state.recent_edits.read();

        // Check for repeated similar edits (might benefit from refactoring)
        if edits.len() >= 3 {
            let recent: Vec<_> = edits.iter().rev().take(5).collect();
            let similar_count = recent
                .iter()
                .filter(|e| {
                    recent[0].content.len() > 10
                        && e.content
                            .contains(&recent[0].content[..10.min(recent[0].content.len())])
                })
                .count();

            if similar_count >= 3 {
                self.emit_suggestion(Suggestion {
                    id: uuid::Uuid::new_v4().to_string(),
                    suggestion_type: SuggestionType::Refactoring,
                    title: "Repeated code pattern detected".to_string(),
                    description:
                        "Consider extracting this repeated pattern into a reusable function"
                            .to_string(),
                    action: None,
                    priority: Priority::Low,
                    confidence: 0.6,
                    context: SuggestionContext {
                        file: recent[0].file.to_string_lossy().to_string().into(),
                        line: Some(recent[0].line),
                        symbol: None,
                        related_files: vec![],
                    },
                    created_at: self.now(),
                    expires_at: Some(self.now() + 120),
                });
            }
        }
    }

    fn check_error_patterns(&self) {
        let errors = self.state.recent_errors.read();

        // Group errors by type
        let mut by_type: HashMap<&str, u32> = HashMap::new();
        for error in errors.iter() {
            *by_type.entry(&error.error_type).or_insert(0) += 1;
        }

        // Suggest fixes for repeated errors
        for (error_type, count) in by_type {
            if count >= self.config.error_pattern_threshold {
                self.emit_suggestion(Suggestion {
                    id: uuid::Uuid::new_v4().to_string(),
                    suggestion_type: SuggestionType::ErrorFix,
                    title: format!("Recurring {} errors", error_type),
                    description: format!(
                        "{} errors of type '{}' detected. Consider addressing the root cause.",
                        count, error_type
                    ),
                    action: None,
                    priority: Priority::High,
                    confidence: 0.9,
                    context: SuggestionContext {
                        file: None,
                        line: None,
                        symbol: None,
                        related_files: vec![],
                    },
                    created_at: self.now(),
                    expires_at: Some(self.now() + 300),
                });
            }
        }
    }

    fn emit_suggestion(&self, suggestion: Suggestion) {
        // Check if we already have too many pending suggestions
        let mut pending = self.state.pending_suggestions.write();
        if pending.len() >= self.config.max_pending_suggestions {
            // Remove oldest low-priority suggestion
            if let Some(idx) = pending
                .iter()
                .position(|s| matches!(s.priority, Priority::Low))
            {
                pending.remove(idx);
            } else {
                return; // All high priority, don't add more
            }
        }

        pending.push(suggestion.clone());
        let _ = self.suggestion_tx.send(suggestion);
    }

    /// Get pending suggestions
    pub fn get_pending_suggestions(&self) -> Vec<Suggestion> {
        let now = self.now();
        self.state
            .pending_suggestions
            .read()
            .iter()
            .filter(|s| s.expires_at.map(|e| e > now).unwrap_or(true))
            .cloned()
            .collect()
    }

    /// Dismiss a suggestion
    pub fn dismiss_suggestion(&self, id: &str) {
        self.state
            .pending_suggestions
            .write()
            .retain(|s| s.id != id);
    }

    /// Accept a suggestion
    pub fn accept_suggestion(&self, id: &str) -> Option<Suggestion> {
        let mut pending = self.state.pending_suggestions.write();
        if let Some(idx) = pending.iter().position(|s| s.id == id) {
            Some(pending.remove(idx))
        } else {
            None
        }
    }

    /// Enable/disable ambient intelligence
    pub fn set_active(&self, active: bool) {
        *self.state.is_active.write() = active;
    }

    pub fn is_active(&self) -> bool {
        *self.state.is_active.read()
    }

    fn now(&self) -> u64 {
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ambient_intelligence_creation() {
        let ai = AmbientIntelligence::new(AmbientConfig::default());
        assert!(ai.is_active());
    }

    #[test]
    fn test_suggestion_lifecycle() {
        let ai = AmbientIntelligence::new(AmbientConfig::default());

        ai.emit_suggestion(Suggestion {
            id: "test1".to_string(),
            suggestion_type: SuggestionType::BestPractice,
            title: "Test".to_string(),
            description: "Test description".to_string(),
            action: None,
            priority: Priority::Low,
            confidence: 0.5,
            context: SuggestionContext {
                file: None,
                line: None,
                symbol: None,
                related_files: vec![],
            },
            created_at: 0,
            expires_at: None,
        });

        let pending = ai.get_pending_suggestions();
        assert_eq!(pending.len(), 1);

        ai.dismiss_suggestion("test1");
        let pending = ai.get_pending_suggestions();
        assert_eq!(pending.len(), 0);
    }
}
