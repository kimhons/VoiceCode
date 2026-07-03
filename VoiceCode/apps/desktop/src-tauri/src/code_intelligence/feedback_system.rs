#![allow(dead_code, unused_variables, unused_imports)]
// Feedback Persistence System - Learn from user corrections
// Persists learnings to improve future suggestions

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use serde::{Deserialize, Serialize};
use parking_lot::RwLock;
use chrono::{DateTime, Utc};

/// Feedback learning system
pub struct FeedbackSystem {
    storage_path: PathBuf,
    corrections: RwLock<Vec<Correction>>,
    patterns: RwLock<Vec<LearnedPattern>>,
    anti_patterns: RwLock<Vec<AntiPattern>>,
    preferences: RwLock<UserPreferences>,
    stats: RwLock<FeedbackStats>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Correction {
    pub id: String,
    pub timestamp: DateTime<Utc>,
    pub original_output: String,
    pub corrected_output: String,
    pub context: String,
    pub file_type: Option<String>,
    pub correction_type: CorrectionType,
    pub applied: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CorrectionType {
    Syntax,
    Style,
    Logic,
    Naming,
    Import,
    TypeAnnotation,
    ErrorHandling,
    Other,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LearnedPattern {
    pub id: String,
    pub pattern_type: PatternType,
    pub description: String,
    pub example: String,
    pub frequency: u32,
    pub confidence: f32,
    pub file_types: Vec<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PatternType {
    NamingConvention,
    CodeStructure,
    ImportOrder,
    ErrorHandling,
    TestPattern,
    CommentStyle,
    TypeUsage,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AntiPattern {
    pub id: String,
    pub description: String,
    pub bad_example: String,
    pub good_example: Option<String>,
    pub occurrences: u32,
    pub file_types: Vec<String>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct UserPreferences {
    pub preferred_quote_style: Option<String>,
    pub preferred_indent: Option<String>,
    pub semicolons: Option<bool>,
    pub trailing_commas: Option<bool>,
    pub max_line_length: Option<u32>,
    pub import_style: Option<String>,
    pub error_handling_style: Option<String>,
    pub test_framework: Option<String>,
    pub custom_rules: HashMap<String, String>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct FeedbackStats {
    pub total_corrections: u32,
    pub total_acceptances: u32,
    pub total_rejections: u32,
    pub correction_rate: f32,
    pub by_type: HashMap<String, u32>,
    pub by_file_type: HashMap<String, u32>,
}

impl FeedbackSystem {
    pub fn new(storage_path: PathBuf) -> Self {
        Self {
            storage_path,
            corrections: RwLock::new(Vec::new()),
            patterns: RwLock::new(Vec::new()),
            anti_patterns: RwLock::new(Vec::new()),
            preferences: RwLock::new(UserPreferences::default()),
            stats: RwLock::new(FeedbackStats::default()),
        }
    }

    /// Record a user correction
    pub fn record_correction(&self, original: &str, corrected: &str, context: &str, file_type: Option<&str>) {
        let correction_type = self.detect_correction_type(original, corrected);
        
        let correction = Correction {
            id: uuid::Uuid::new_v4().to_string(),
            timestamp: Utc::now(),
            original_output: original.to_string(),
            corrected_output: corrected.to_string(),
            context: context.to_string(),
            file_type: file_type.map(String::from),
            correction_type: correction_type.clone(),
            applied: true,
        };

        self.corrections.write().push(correction);
        
        // Update stats
        let mut stats = self.stats.write();
        stats.total_corrections += 1;
        *stats.by_type.entry(format!("{:?}", correction_type)).or_insert(0) += 1;
        if let Some(ft) = file_type {
            *stats.by_file_type.entry(ft.to_string()).or_insert(0) += 1;
        }
        stats.correction_rate = stats.total_corrections as f32 / 
            (stats.total_corrections + stats.total_acceptances).max(1) as f32;

        // Try to learn from correction
        self.learn_from_correction(original, corrected, file_type);
    }

    /// Record an acceptance (no correction needed)
    pub fn record_acceptance(&self, _output: &str, file_type: Option<&str>) {
        let mut stats = self.stats.write();
        stats.total_acceptances += 1;
        if let Some(ft) = file_type {
            *stats.by_file_type.entry(ft.to_string()).or_insert(0) += 1;
        }
        stats.correction_rate = stats.total_corrections as f32 / 
            (stats.total_corrections + stats.total_acceptances).max(1) as f32;
    }

    /// Record a rejection
    pub fn record_rejection(&self, output: &str, reason: Option<&str>) {
        let anti_pattern = AntiPattern {
            id: uuid::Uuid::new_v4().to_string(),
            description: reason.unwrap_or("User rejected output").to_string(),
            bad_example: output.to_string(),
            good_example: None,
            occurrences: 1,
            file_types: vec![],
        };

        self.anti_patterns.write().push(anti_pattern);
        self.stats.write().total_rejections += 1;
    }

    fn detect_correction_type(&self, original: &str, corrected: &str) -> CorrectionType {
        // Detect what kind of correction was made
        if original.len() != corrected.len() && 
           (corrected.contains("import") || corrected.contains("use ") || corrected.contains("require")) {
            return CorrectionType::Import;
        }

        // Check for naming changes
        let orig_words: Vec<&str> = original.split_whitespace().collect();
        let corr_words: Vec<&str> = corrected.split_whitespace().collect();
        let naming_changes = orig_words.iter().zip(corr_words.iter())
            .filter(|(a, b)| a != b && a.chars().all(|c| c.is_alphanumeric() || c == '_'))
            .count();
        if naming_changes > 0 && naming_changes < 5 {
            return CorrectionType::Naming;
        }

        // Check for type annotation changes
        if corrected.contains(':') && !original.contains(':') {
            return CorrectionType::TypeAnnotation;
        }

        // Check for error handling
        if (corrected.contains("try") || corrected.contains("catch") || 
            corrected.contains("Result") || corrected.contains("Error")) &&
           (!original.contains("try") && !original.contains("catch")) {
            return CorrectionType::ErrorHandling;
        }

        // Check for style differences
        let orig_style = self.analyze_style(original);
        let corr_style = self.analyze_style(corrected);
        if orig_style != corr_style {
            return CorrectionType::Style;
        }

        CorrectionType::Other
    }

    fn analyze_style(&self, code: &str) -> HashMap<&str, bool> {
        let mut style = HashMap::new();
        style.insert("semicolons", code.contains(';'));
        style.insert("single_quotes", code.contains('\''));
        style.insert("double_quotes", code.contains('"'));
        style.insert("tabs", code.contains('\t'));
        style.insert("trailing_commas", code.contains(",\n") || code.contains(",]") || code.contains(",}"));
        style
    }

    fn learn_from_correction(&self, original: &str, corrected: &str, file_type: Option<&str>) {
        let mut preferences = self.preferences.write();

        // Learn quote style
        let orig_single = original.matches('\'').count();
        let orig_double = original.matches('"').count();
        let corr_single = corrected.matches('\'').count();
        let corr_double = corrected.matches('"').count();

        if corr_single > orig_single && corr_double < orig_double {
            preferences.preferred_quote_style = Some("single".to_string());
        } else if corr_double > orig_double && corr_single < orig_single {
            preferences.preferred_quote_style = Some("double".to_string());
        }

        // Learn semicolon preference
        let orig_semi = original.matches(';').count();
        let corr_semi = corrected.matches(';').count();
        if corr_semi > orig_semi + 2 {
            preferences.semicolons = Some(true);
        } else if orig_semi > corr_semi + 2 {
            preferences.semicolons = Some(false);
        }

        // Learn indentation
        if corrected.contains("    ") && original.contains("\t") {
            preferences.preferred_indent = Some("spaces".to_string());
        } else if corrected.contains("\t") && original.contains("    ") {
            preferences.preferred_indent = Some("tabs".to_string());
        }

        // Extract patterns
        self.extract_patterns(corrected, file_type);
    }

    fn extract_patterns(&self, code: &str, file_type: Option<&str>) {
        let mut patterns = self.patterns.write();
        let now = Utc::now();
        let file_types = file_type.map(|f| vec![f.to_string()]).unwrap_or_default();

        // Extract import patterns
        if code.contains("import") {
            let import_lines: Vec<&str> = code.lines()
                .filter(|l| l.trim().starts_with("import"))
                .collect();
            
            if !import_lines.is_empty() {
                let existing = patterns.iter_mut()
                    .find(|p| matches!(p.pattern_type, PatternType::ImportOrder));
                
                if let Some(p) = existing {
                    p.frequency += 1;
                    p.updated_at = now;
                } else {
                    patterns.push(LearnedPattern {
                        id: uuid::Uuid::new_v4().to_string(),
                        pattern_type: PatternType::ImportOrder,
                        description: "Import ordering pattern".to_string(),
                        example: import_lines.join("\n"),
                        frequency: 1,
                        confidence: 0.5,
                        file_types: file_types.clone(),
                        created_at: now,
                        updated_at: now,
                    });
                }
            }
        }
    }

    /// Get learned preferences as system prompt additions
    pub fn get_preference_prompt(&self) -> String {
        let prefs = self.preferences.read();
        let mut prompt = String::from("## User Code Preferences (Learned)\n\n");

        if let Some(ref quotes) = prefs.preferred_quote_style {
            prompt.push_str(&format!("- Use {} quotes for strings\n", quotes));
        }
        if let Some(semi) = prefs.semicolons {
            prompt.push_str(&format!("- {} semicolons at end of statements\n", if semi { "Include" } else { "Omit" }));
        }
        if let Some(ref indent) = prefs.preferred_indent {
            prompt.push_str(&format!("- Use {} for indentation\n", indent));
        }
        if let Some(trailing) = prefs.trailing_commas {
            prompt.push_str(&format!("- {} trailing commas\n", if trailing { "Include" } else { "Omit" }));
        }

        for (key, value) in &prefs.custom_rules {
            prompt.push_str(&format!("- {}: {}\n", key, value));
        }

        prompt
    }

    /// Get anti-patterns to avoid
    pub fn get_anti_pattern_prompt(&self) -> String {
        let anti_patterns = self.anti_patterns.read();
        if anti_patterns.is_empty() {
            return String::new();
        }

        let mut prompt = String::from("## Patterns to AVOID (User Rejected)\n\n");
        for ap in anti_patterns.iter().take(5) {
            prompt.push_str(&format!("- {}\n", ap.description));
            if ap.bad_example.len() < 200 {
                prompt.push_str(&format!("  Bad: `{}`\n", ap.bad_example.replace('\n', " ")));
            }
        }
        prompt
    }

    /// Save all feedback data to disk
    pub async fn save(&self) -> Result<(), String> {
        let data = FeedbackData {
            corrections: self.corrections.read().clone(),
            patterns: self.patterns.read().clone(),
            anti_patterns: self.anti_patterns.read().clone(),
            preferences: self.preferences.read().clone(),
            stats: self.stats.read().clone(),
        };

        let json = serde_json::to_string_pretty(&data)
            .map_err(|e| format!("Serialization error: {}", e))?;

        tokio::fs::create_dir_all(self.storage_path.parent().unwrap_or(Path::new(".")))
            .await.ok();
        
        tokio::fs::write(&self.storage_path, json)
            .await
            .map_err(|e| format!("Write error: {}", e))
    }

    /// Load feedback data from disk
    pub async fn load(&self) -> Result<(), String> {
        if !self.storage_path.exists() {
            return Ok(());
        }

        let json = tokio::fs::read_to_string(&self.storage_path)
            .await
            .map_err(|e| format!("Read error: {}", e))?;

        let data: FeedbackData = serde_json::from_str(&json)
            .map_err(|e| format!("Parse error: {}", e))?;

        *self.corrections.write() = data.corrections;
        *self.patterns.write() = data.patterns;
        *self.anti_patterns.write() = data.anti_patterns;
        *self.preferences.write() = data.preferences;
        *self.stats.write() = data.stats;

        Ok(())
    }

    pub fn get_stats(&self) -> FeedbackStats {
        self.stats.read().clone()
    }

    pub fn get_recent_corrections(&self, limit: usize) -> Vec<Correction> {
        let corrections = self.corrections.read();
        corrections.iter().rev().take(limit).cloned().collect()
    }
}

#[derive(Debug, Serialize, Deserialize)]
struct FeedbackData {
    corrections: Vec<Correction>,
    patterns: Vec<LearnedPattern>,
    anti_patterns: Vec<AntiPattern>,
    preferences: UserPreferences,
    stats: FeedbackStats,
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn test_feedback_system_creation() {
        let system = FeedbackSystem::new(PathBuf::from("/tmp/feedback.json"));
        assert_eq!(system.get_stats().total_corrections, 0);
    }

    #[test]
    fn test_record_correction() {
        let system = FeedbackSystem::new(PathBuf::from("/tmp/feedback.json"));
        
        system.record_correction(
            "const x = 'hello'",
            "const x = \"hello\"",
            "variable declaration",
            Some("typescript"),
        );

        assert_eq!(system.get_stats().total_corrections, 1);
    }

    #[test]
    fn test_preference_learning() {
        let system = FeedbackSystem::new(PathBuf::from("/tmp/feedback.json"));
        
        // Multiple corrections with double quotes
        for _ in 0..3 {
            system.record_correction(
                "const x = 'hello'",
                "const x = \"hello\"",
                "test",
                Some("typescript"),
            );
        }

        let prompt = system.get_preference_prompt();
        assert!(prompt.contains("double") || prompt.contains("quote"));
    }
}
