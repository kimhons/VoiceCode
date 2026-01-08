// Phase 1.7: App-Aware Formatting
// Automatically adjust output formatting based on target application

use std::sync::Arc;
use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use tokio::sync::RwLock;
use once_cell::sync::Lazy;

use crate::screen_context::{ApplicationType, get_screen_context};

/// Global app-aware formatter instance
static APP_FORMATTER: Lazy<Arc<AppAwareFormatter>> = Lazy::new(|| {
    Arc::new(AppAwareFormatter::new())
});

pub fn get_app_formatter() -> Arc<AppAwareFormatter> {
    APP_FORMATTER.clone()
}

/// Formatting style for different contexts
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FormattingStyle {
    /// Use all lowercase
    pub lowercase: bool,
    /// Use all uppercase
    pub uppercase: bool,
    /// Add punctuation automatically
    pub auto_punctuate: bool,
    /// Type of punctuation style
    pub punctuation_style: PunctuationStyle,
    /// Add paragraph breaks automatically
    pub auto_paragraph: bool,
    /// Capitalization style
    pub capitalization: CapitalizationStyle,
    /// Remove filler words
    pub remove_fillers: bool,
    /// Allow emoji insertion
    pub allow_emoji: bool,
    /// Markdown formatting enabled
    pub markdown_enabled: bool,
    /// Code formatting enabled
    pub code_formatting: bool,
    /// Smart quotes
    pub smart_quotes: bool,
    /// Em dash substitution
    pub em_dash: bool,
    /// Ellipsis substitution
    pub ellipsis: bool,
    /// Prefix to add to each dictation
    pub prefix: Option<String>,
    /// Suffix to add to each dictation
    pub suffix: Option<String>,
}

impl Default for FormattingStyle {
    fn default() -> Self {
        Self {
            lowercase: false,
            uppercase: false,
            auto_punctuate: true,
            punctuation_style: PunctuationStyle::Standard,
            auto_paragraph: false,
            capitalization: CapitalizationStyle::Sentence,
            remove_fillers: true,
            allow_emoji: true,
            markdown_enabled: false,
            code_formatting: false,
            smart_quotes: true,
            em_dash: true,
            ellipsis: true,
            prefix: None,
            suffix: None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum PunctuationStyle {
    /// Standard punctuation
    Standard,
    /// Minimal punctuation (no periods at end)
    Minimal,
    /// No punctuation
    None,
    /// Full punctuation with oxford commas
    Formal,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum CapitalizationStyle {
    /// Capitalize first letter of sentences
    Sentence,
    /// Capitalize first letter of each word (Title Case)
    Title,
    /// All lowercase
    Lower,
    /// ALL UPPERCASE
    Upper,
    /// Preserve original (no changes)
    Preserve,
}

/// Application-specific formatting profile
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FormattingProfile {
    /// Profile name
    pub name: String,
    /// Application type this profile applies to
    pub app_type: ApplicationType,
    /// Optional specific app name pattern
    pub app_name_pattern: Option<String>,
    /// The formatting style to apply
    pub style: FormattingStyle,
    /// Is this a custom user profile?
    pub is_custom: bool,
    /// Priority (higher wins when multiple profiles match)
    pub priority: i32,
}

/// App-aware formatter
pub struct AppAwareFormatter {
    /// Registered formatting profiles
    profiles: RwLock<Vec<FormattingProfile>>,
    /// Default profiles by app type
    default_profiles: HashMap<ApplicationType, FormattingStyle>,
    /// Learning data - tracks user corrections per app
    learning_data: RwLock<HashMap<String, LearningEntry>>,
}

#[derive(Debug, Clone, Default)]
struct LearningEntry {
    /// Number of times user corrected to lowercase
    lowercase_corrections: u32,
    /// Number of times user corrected to uppercase
    uppercase_corrections: u32,
    /// Number of times user removed punctuation
    punctuation_removals: u32,
    /// Number of times user added punctuation
    punctuation_additions: u32,
    /// Total samples
    total_samples: u32,
}

impl AppAwareFormatter {
    pub fn new() -> Self {
        let mut default_profiles = HashMap::new();

        // Terminal - lowercase, no punctuation
        default_profiles.insert(ApplicationType::Terminal, FormattingStyle {
            lowercase: true,
            uppercase: false,
            auto_punctuate: false,
            punctuation_style: PunctuationStyle::None,
            auto_paragraph: false,
            capitalization: CapitalizationStyle::Lower,
            remove_fillers: true,
            allow_emoji: false,
            markdown_enabled: false,
            code_formatting: true,
            smart_quotes: false,
            em_dash: false,
            ellipsis: false,
            prefix: None,
            suffix: None,
        });

        // Code Editor - code-aware formatting
        default_profiles.insert(ApplicationType::CodeEditor, FormattingStyle {
            lowercase: false,
            uppercase: false,
            auto_punctuate: false,
            punctuation_style: PunctuationStyle::Minimal,
            auto_paragraph: false,
            capitalization: CapitalizationStyle::Preserve,
            remove_fillers: true,
            allow_emoji: false,
            markdown_enabled: true,
            code_formatting: true,
            smart_quotes: false,
            em_dash: false,
            ellipsis: false,
            prefix: None,
            suffix: None,
        });

        // Messaging - casual, emoji-friendly
        default_profiles.insert(ApplicationType::Messaging, FormattingStyle {
            lowercase: false,
            uppercase: false,
            auto_punctuate: true,
            punctuation_style: PunctuationStyle::Minimal,
            auto_paragraph: false,
            capitalization: CapitalizationStyle::Sentence,
            remove_fillers: false, // Keep casual speech patterns
            allow_emoji: true,
            markdown_enabled: false,
            code_formatting: false,
            smart_quotes: false,
            em_dash: false,
            ellipsis: true,
            prefix: None,
            suffix: None,
        });

        // Email - professional, proper punctuation
        default_profiles.insert(ApplicationType::Email, FormattingStyle {
            lowercase: false,
            uppercase: false,
            auto_punctuate: true,
            punctuation_style: PunctuationStyle::Formal,
            auto_paragraph: true,
            capitalization: CapitalizationStyle::Sentence,
            remove_fillers: true,
            allow_emoji: false,
            markdown_enabled: false,
            code_formatting: false,
            smart_quotes: true,
            em_dash: true,
            ellipsis: true,
            prefix: None,
            suffix: None,
        });

        // Document - formal, full formatting
        default_profiles.insert(ApplicationType::Document, FormattingStyle {
            lowercase: false,
            uppercase: false,
            auto_punctuate: true,
            punctuation_style: PunctuationStyle::Formal,
            auto_paragraph: true,
            capitalization: CapitalizationStyle::Sentence,
            remove_fillers: true,
            allow_emoji: false,
            markdown_enabled: true,
            code_formatting: false,
            smart_quotes: true,
            em_dash: true,
            ellipsis: true,
            prefix: None,
            suffix: None,
        });

        // Notes - flexible, markdown-enabled
        default_profiles.insert(ApplicationType::Notes, FormattingStyle {
            lowercase: false,
            uppercase: false,
            auto_punctuate: true,
            punctuation_style: PunctuationStyle::Standard,
            auto_paragraph: true,
            capitalization: CapitalizationStyle::Sentence,
            remove_fillers: true,
            allow_emoji: true,
            markdown_enabled: true,
            code_formatting: false,
            smart_quotes: true,
            em_dash: true,
            ellipsis: true,
            prefix: None,
            suffix: None,
        });

        // Browser - balanced
        default_profiles.insert(ApplicationType::Browser, FormattingStyle {
            lowercase: false,
            uppercase: false,
            auto_punctuate: true,
            punctuation_style: PunctuationStyle::Standard,
            auto_paragraph: false,
            capitalization: CapitalizationStyle::Sentence,
            remove_fillers: true,
            allow_emoji: true,
            markdown_enabled: false,
            code_formatting: false,
            smart_quotes: true,
            em_dash: true,
            ellipsis: true,
            prefix: None,
            suffix: None,
        });

        // Default/Unknown
        default_profiles.insert(ApplicationType::Unknown, FormattingStyle::default());

        Self {
            profiles: RwLock::new(Vec::new()),
            default_profiles,
            learning_data: RwLock::new(HashMap::new()),
        }
    }

    /// Get the formatting style for the current application context
    pub async fn get_style_for_context(&self) -> FormattingStyle {
        let context = get_screen_context().get_context().await;

        // First check custom profiles
        let profiles = self.profiles.read().await;
        let mut matching_profiles: Vec<&FormattingProfile> = profiles
            .iter()
            .filter(|p| {
                // Check app type match
                if p.app_type != context.app_type && p.app_type != ApplicationType::Unknown {
                    return false;
                }

                // Check app name pattern if specified
                if let Some(pattern) = &p.app_name_pattern {
                    if !context.app_name.to_lowercase().contains(&pattern.to_lowercase()) {
                        return false;
                    }
                }

                true
            })
            .collect();

        // Sort by priority
        matching_profiles.sort_by(|a, b| b.priority.cmp(&a.priority));

        // Return first matching profile, or default
        if let Some(profile) = matching_profiles.first() {
            return profile.style.clone();
        }

        // Fall back to default profile for app type
        self.default_profiles
            .get(&context.app_type)
            .cloned()
            .unwrap_or_default()
    }

    /// Format text according to current context
    pub async fn format_text(&self, text: &str) -> FormattedText {
        let style = self.get_style_for_context().await;
        self.apply_style(text, &style)
    }

    /// Format text with a specific style
    pub fn apply_style(&self, text: &str, style: &FormattingStyle) -> FormattedText {
        let mut result = text.to_string();
        let mut changes = Vec::new();

        // Apply prefix
        if let Some(prefix) = &style.prefix {
            result = format!("{}{}", prefix, result);
            changes.push(format!("Added prefix: {}", prefix));
        }

        // Remove filler words
        if style.remove_fillers {
            let before = result.clone();
            result = self.remove_filler_words(&result);
            if result != before {
                changes.push("Removed filler words".to_string());
            }
        }

        // Apply capitalization
        result = match style.capitalization {
            CapitalizationStyle::Sentence => self.sentence_case(&result),
            CapitalizationStyle::Title => self.title_case(&result),
            CapitalizationStyle::Lower => result.to_lowercase(),
            CapitalizationStyle::Upper => result.to_uppercase(),
            CapitalizationStyle::Preserve => result,
        };
        if style.capitalization != CapitalizationStyle::Preserve {
            changes.push(format!("Applied {:?} capitalization", style.capitalization));
        }

        // Handle lowercase/uppercase overrides
        if style.lowercase {
            result = result.to_lowercase();
            changes.push("Converted to lowercase".to_string());
        } else if style.uppercase {
            result = result.to_uppercase();
            changes.push("Converted to uppercase".to_string());
        }

        // Apply punctuation
        if style.auto_punctuate && style.punctuation_style != PunctuationStyle::None {
            let before = result.clone();
            result = self.apply_punctuation(&result, &style.punctuation_style);
            if result != before {
                changes.push("Applied punctuation".to_string());
            }
        } else if style.punctuation_style == PunctuationStyle::None {
            let before = result.clone();
            result = self.remove_punctuation(&result);
            if result != before {
                changes.push("Removed punctuation".to_string());
            }
        }

        // Apply smart typography
        if style.smart_quotes {
            result = self.apply_smart_quotes(&result);
        }
        if style.em_dash {
            result = result.replace(" - ", " — ");
            result = result.replace("--", "—");
        }
        if style.ellipsis {
            result = result.replace("...", "…");
        }

        // Apply suffix
        if let Some(suffix) = &style.suffix {
            result = format!("{}{}", result, suffix);
            changes.push(format!("Added suffix: {}", suffix));
        }

        // Trim and clean up
        result = result.trim().to_string();
        result = self.normalize_whitespace(&result);

        FormattedText {
            original: text.to_string(),
            formatted: result,
            style_applied: style.clone(),
            changes,
        }
    }

    fn remove_filler_words(&self, text: &str) -> String {
        let fillers = [
            "um", "uh", "er", "ah", "like", "you know", "basically",
            "actually", "literally", "sort of", "kind of", "I mean",
            "so yeah", "yeah so", "right so", "okay so", "well um",
        ];

        let mut result = text.to_string();
        for filler in &fillers {
            // Match filler words with word boundaries
            let pattern = regex::Regex::new(&format!(r"(?i)\b{}\b,?\s*", regex::escape(filler))).unwrap();
            result = pattern.replace_all(&result, " ").to_string();
        }

        // Clean up multiple spaces
        self.normalize_whitespace(&result)
    }

    fn sentence_case(&self, text: &str) -> String {
        let mut result = String::new();
        let mut capitalize_next = true;

        for c in text.chars() {
            if capitalize_next && c.is_alphabetic() {
                result.push(c.to_uppercase().next().unwrap_or(c));
                capitalize_next = false;
            } else {
                result.push(c);
                if c == '.' || c == '!' || c == '?' || c == '\n' {
                    capitalize_next = true;
                }
            }
        }

        result
    }

    fn title_case(&self, text: &str) -> String {
        let small_words = ["a", "an", "the", "and", "but", "or", "for", "nor", "on", "at", "to", "by", "of", "in"];

        text.split_whitespace()
            .enumerate()
            .map(|(i, word)| {
                if i == 0 || !small_words.contains(&word.to_lowercase().as_str()) {
                    let mut chars: Vec<char> = word.chars().collect();
                    if let Some(first) = chars.first_mut() {
                        *first = first.to_uppercase().next().unwrap_or(*first);
                    }
                    chars.iter().collect()
                } else {
                    word.to_lowercase()
                }
            })
            .collect::<Vec<_>>()
            .join(" ")
    }

    fn apply_punctuation(&self, text: &str, style: &PunctuationStyle) -> String {
        let mut result = text.trim().to_string();

        match style {
            PunctuationStyle::Standard | PunctuationStyle::Formal => {
                // Ensure sentence ends with punctuation
                if !result.is_empty() && !result.ends_with('.') && !result.ends_with('!') && !result.ends_with('?') {
                    result.push('.');
                }
            }
            PunctuationStyle::Minimal => {
                // Don't add ending punctuation, but preserve internal
            }
            PunctuationStyle::None => {
                // Remove all punctuation
                result = self.remove_punctuation(&result);
            }
        }

        result
    }

    fn remove_punctuation(&self, text: &str) -> String {
        text.chars()
            .filter(|c| !c.is_ascii_punctuation() || *c == '\'' || *c == '-')
            .collect()
    }

    fn apply_smart_quotes(&self, text: &str) -> String {
        let mut result = String::new();
        let mut in_quote = false;

        for c in text.chars() {
            match c {
                '"' => {
                    if in_quote {
                        result.push('"');
                    } else {
                        result.push('"');
                    }
                    in_quote = !in_quote;
                }
                '\'' => {
                    // Check if it's a contraction or quote
                    if result.chars().last().map(|c| c.is_alphabetic()).unwrap_or(false) {
                        result.push(''');
                    } else {
                        result.push(''');
                    }
                }
                _ => result.push(c),
            }
        }

        result
    }

    fn normalize_whitespace(&self, text: &str) -> String {
        let re = regex::Regex::new(r"\s+").unwrap();
        re.replace_all(text, " ").trim().to_string()
    }

    /// Add a custom formatting profile
    pub async fn add_profile(&self, profile: FormattingProfile) {
        let mut profiles = self.profiles.write().await;
        profiles.push(profile);
    }

    /// Remove a custom formatting profile
    pub async fn remove_profile(&self, name: &str) -> bool {
        let mut profiles = self.profiles.write().await;
        let len_before = profiles.len();
        profiles.retain(|p| p.name != name);
        profiles.len() < len_before
    }

    /// Get all custom profiles
    pub async fn get_profiles(&self) -> Vec<FormattingProfile> {
        self.profiles.read().await.clone()
    }

    /// Record a user correction to improve future formatting
    pub async fn record_correction(&self, app_name: &str, original: &str, corrected: &str) {
        let mut learning_data = self.learning_data.write().await;
        let entry = learning_data.entry(app_name.to_string()).or_default();

        entry.total_samples += 1;

        // Analyze what kind of correction was made
        if original.chars().any(|c| c.is_uppercase()) && corrected.chars().all(|c| !c.is_uppercase() || !c.is_alphabetic()) {
            entry.lowercase_corrections += 1;
        }
        if original.chars().any(|c| c.is_lowercase()) && corrected.chars().all(|c| !c.is_lowercase() || !c.is_alphabetic()) {
            entry.uppercase_corrections += 1;
        }

        let orig_punct = original.chars().filter(|c| c.is_ascii_punctuation()).count();
        let corr_punct = corrected.chars().filter(|c| c.is_ascii_punctuation()).count();

        if corr_punct < orig_punct {
            entry.punctuation_removals += 1;
        } else if corr_punct > orig_punct {
            entry.punctuation_additions += 1;
        }
    }

    /// Get suggested style adjustments based on learning data
    pub async fn get_learned_adjustments(&self, app_name: &str) -> Option<LearnedAdjustments> {
        let learning_data = self.learning_data.read().await;

        learning_data.get(app_name).and_then(|entry| {
            if entry.total_samples < 10 {
                return None; // Not enough data
            }

            let lowercase_ratio = entry.lowercase_corrections as f32 / entry.total_samples as f32;
            let uppercase_ratio = entry.uppercase_corrections as f32 / entry.total_samples as f32;
            let punct_removal_ratio = entry.punctuation_removals as f32 / entry.total_samples as f32;

            Some(LearnedAdjustments {
                suggest_lowercase: lowercase_ratio > 0.5,
                suggest_uppercase: uppercase_ratio > 0.5,
                suggest_no_punctuation: punct_removal_ratio > 0.5,
                confidence: entry.total_samples.min(100) as f32 / 100.0,
            })
        })
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FormattedText {
    pub original: String,
    pub formatted: String,
    pub style_applied: FormattingStyle,
    pub changes: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LearnedAdjustments {
    pub suggest_lowercase: bool,
    pub suggest_uppercase: bool,
    pub suggest_no_punctuation: bool,
    pub confidence: f32,
}

// Tauri commands

#[tauri::command]
pub async fn format_text_for_context(text: String) -> Result<FormattedText, String> {
    Ok(get_app_formatter().format_text(&text).await)
}

#[tauri::command]
pub async fn get_current_formatting_style() -> Result<FormattingStyle, String> {
    Ok(get_app_formatter().get_style_for_context().await)
}

#[tauri::command]
pub async fn apply_formatting_style(text: String, style: FormattingStyle) -> Result<FormattedText, String> {
    Ok(get_app_formatter().apply_style(&text, &style))
}

#[tauri::command]
pub async fn add_formatting_profile(profile: FormattingProfile) -> Result<(), String> {
    get_app_formatter().add_profile(profile).await;
    Ok(())
}

#[tauri::command]
pub async fn remove_formatting_profile(name: String) -> Result<bool, String> {
    Ok(get_app_formatter().remove_profile(&name).await)
}

#[tauri::command]
pub async fn get_formatting_profiles() -> Result<Vec<FormattingProfile>, String> {
    Ok(get_app_formatter().get_profiles().await)
}

#[tauri::command]
pub async fn record_formatting_correction(
    app_name: String,
    original: String,
    corrected: String,
) -> Result<(), String> {
    get_app_formatter().record_correction(&app_name, &original, &corrected).await;
    Ok(())
}

#[tauri::command]
pub async fn get_learned_formatting_adjustments(app_name: String) -> Result<Option<LearnedAdjustments>, String> {
    Ok(get_app_formatter().get_learned_adjustments(&app_name).await)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_filler_word_removal() {
        let formatter = AppAwareFormatter::new();
        let style = FormattingStyle {
            remove_fillers: true,
            ..Default::default()
        };

        let result = formatter.apply_style("um so like I was thinking you know", &style);
        assert!(!result.formatted.contains("um"));
        assert!(!result.formatted.contains("like"));
        assert!(!result.formatted.contains("you know"));
    }

    #[tokio::test]
    async fn test_terminal_formatting() {
        let formatter = AppAwareFormatter::new();
        let style = formatter.default_profiles.get(&ApplicationType::Terminal).unwrap();

        let result = formatter.apply_style("Docker Pull Nginx", style);
        assert_eq!(result.formatted.to_lowercase(), result.formatted);
    }

    #[tokio::test]
    async fn test_email_formatting() {
        let formatter = AppAwareFormatter::new();
        let style = formatter.default_profiles.get(&ApplicationType::Email).unwrap();

        let result = formatter.apply_style("hello how are you", style);
        assert!(result.formatted.starts_with('H')); // Should be capitalized
        assert!(result.formatted.ends_with('.')); // Should have period
    }

    #[tokio::test]
    async fn test_smart_quotes() {
        let formatter = AppAwareFormatter::new();
        let style = FormattingStyle {
            smart_quotes: true,
            ..Default::default()
        };

        let result = formatter.apply_style("He said \"hello\" to me", &style);
        assert!(result.formatted.contains('"'));
        assert!(result.formatted.contains('"'));
    }

    #[tokio::test]
    async fn test_custom_profile() {
        let formatter = AppAwareFormatter::new();

        let profile = FormattingProfile {
            name: "SlackCasual".to_string(),
            app_type: ApplicationType::Messaging,
            app_name_pattern: Some("slack".to_string()),
            style: FormattingStyle {
                lowercase: true,
                auto_punctuate: false,
                ..Default::default()
            },
            is_custom: true,
            priority: 100,
        };

        formatter.add_profile(profile).await;

        let profiles = formatter.get_profiles().await;
        assert_eq!(profiles.len(), 1);
        assert_eq!(profiles[0].name, "SlackCasual");
    }
}
