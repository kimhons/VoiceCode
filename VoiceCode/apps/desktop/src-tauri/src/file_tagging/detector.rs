#![allow(dead_code, unused_variables, unused_imports)]
//! File Tag Detector
//!
//! Detects file references in transcribed speech using multiple patterns.
//! Handles various ways users might reference files while dictating.

use regex::Regex;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// Check if two position ranges overlap
fn ranges_overlap(a: (usize, usize), b: (usize, usize)) -> bool {
    a.0 < b.1 && b.0 < a.1
}

/// Detected file tag in transcription
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetectedFileTag {
    /// Original text that triggered detection (e.g., "at config.ts")
    pub original_text: String,
    /// Extracted file reference (e.g., "config.ts")
    pub file_ref: String,
    /// Resolved file path (if found in workspace)
    pub resolved_path: Option<PathBuf>,
    /// Position in transcript (start, end)
    pub position: (usize, usize),
    /// Detection confidence (0.0 - 1.0)
    pub confidence: f32,
    /// Pattern that matched
    pub pattern_type: TagPatternType,
}

/// Types of tag patterns
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TagPatternType {
    /// @ symbol prefix (e.g., "@config.ts")
    AtSymbol,
    /// "at" keyword (e.g., "at config.ts")
    AtKeyword,
    /// "tag" keyword (e.g., "tag config.ts")
    TagKeyword,
    /// "include" keyword (e.g., "include config.ts")
    IncludeKeyword,
    /// "from" keyword (e.g., "from config.ts")
    FromKeyword,
    /// "file" keyword (e.g., "file config.ts")
    FileKeyword,
    /// "in" keyword with file extension (e.g., "in config.ts")
    InKeyword,
    /// Direct file path mention
    DirectPath,
}

/// Pattern definition for file detection
#[derive(Debug, Clone)]
pub struct TagPattern {
    /// Pattern name
    pub name: &'static str,
    /// Regex pattern
    pub regex: Regex,
    /// Pattern type
    pub pattern_type: TagPatternType,
    /// Base confidence for this pattern
    pub confidence: f32,
    /// Group index for file reference extraction
    pub file_group: usize,
}

/// File tag detector
pub struct FileTagDetector {
    /// Detection patterns
    patterns: Vec<TagPattern>,
    /// Common file extensions (boost confidence)
    known_extensions: Vec<&'static str>,
    /// Recently mentioned files (boost confidence)
    recent_files: Vec<String>,
    /// Maximum recent files to track
    max_recent: usize,
}

impl FileTagDetector {
    /// Create a new file tag detector with default patterns
    pub fn new() -> Self {
        let patterns = Self::build_default_patterns();
        let known_extensions = Self::build_known_extensions();

        Self {
            patterns,
            known_extensions,
            recent_files: Vec::new(),
            max_recent: 20,
        }
    }

    /// Build default detection patterns
    fn build_default_patterns() -> Vec<TagPattern> {
        vec![
            // @ symbol prefix: @config.ts, @src/main.rs
            TagPattern {
                name: "at_symbol",
                regex: Regex::new(r"@([a-zA-Z0-9_\-./\\]+\.[a-zA-Z0-9]+)").expect("valid regex: at-symbol file reference pattern"),
                pattern_type: TagPatternType::AtSymbol,
                confidence: 0.95,
                file_group: 1,
            },
            // "at" keyword: at config.ts, at the config file
            TagPattern {
                name: "at_keyword",
                regex: Regex::new(r"\bat\s+([a-zA-Z0-9_\-./\\]+\.[a-zA-Z0-9]+)").expect("valid regex: at-keyword file reference pattern"),
                pattern_type: TagPatternType::AtKeyword,
                confidence: 0.85,
                file_group: 1,
            },
            // "tag" keyword: tag config.ts
            TagPattern {
                name: "tag_keyword",
                regex: Regex::new(r"\btag\s+([a-zA-Z0-9_\-./\\]+\.[a-zA-Z0-9]+)").expect("valid regex: tag-keyword file reference pattern"),
                pattern_type: TagPatternType::TagKeyword,
                confidence: 0.90,
                file_group: 1,
            },
            // "include" keyword: include package.json
            TagPattern {
                name: "include_keyword",
                regex: Regex::new(r"\binclude\s+([a-zA-Z0-9_\-./\\]+\.[a-zA-Z0-9]+)").expect("valid regex: include-keyword file reference pattern"),
                pattern_type: TagPatternType::IncludeKeyword,
                confidence: 0.85,
                file_group: 1,
            },
            // "from" keyword: from src/main.rs
            TagPattern {
                name: "from_keyword",
                regex: Regex::new(r"\bfrom\s+([a-zA-Z0-9_\-./\\]+\.[a-zA-Z0-9]+)").expect("valid regex: from-keyword file reference pattern"),
                pattern_type: TagPatternType::FromKeyword,
                confidence: 0.80,
                file_group: 1,
            },
            // "file" keyword: file config.ts, the file main.rs
            TagPattern {
                name: "file_keyword",
                regex: Regex::new(r"\bfile\s+([a-zA-Z0-9_\-./\\]+\.[a-zA-Z0-9]+)").expect("valid regex: file-keyword file reference pattern"),
                pattern_type: TagPatternType::FileKeyword,
                confidence: 0.80,
                file_group: 1,
            },
            // "in" keyword with file: in config.ts, in the main.rs file
            TagPattern {
                name: "in_keyword",
                regex: Regex::new(r"\bin\s+([a-zA-Z0-9_\-./\\]+\.[a-zA-Z0-9]+)").expect("valid regex: in-keyword file reference pattern"),
                pattern_type: TagPatternType::InKeyword,
                confidence: 0.70,
                file_group: 1,
            },
            // Direct path mention: src/components/Button.tsx
            TagPattern {
                name: "direct_path",
                regex: Regex::new(r"([a-zA-Z0-9_\-]+/[a-zA-Z0-9_\-./\\]+\.[a-zA-Z0-9]+)").expect("valid regex: direct path file reference pattern"),
                pattern_type: TagPatternType::DirectPath,
                confidence: 0.75,
                file_group: 1,
            },
            // Filename with common extensions
            TagPattern {
                name: "common_extension",
                regex: Regex::new(r"\b([a-zA-Z0-9_\-]+\.(ts|tsx|js|jsx|rs|py|go|java|cpp|c|h|hpp|json|yaml|yml|toml|md|txt|css|scss|html|xml|sql))\b").expect("valid regex: common file extension pattern"),
                pattern_type: TagPatternType::DirectPath,
                confidence: 0.70,
                file_group: 1,
            },
        ]
    }

    /// Build list of known file extensions
    fn build_known_extensions() -> Vec<&'static str> {
        vec![
            // TypeScript/JavaScript
            "ts", "tsx", "js", "jsx", "mjs", "cjs",
            // Rust
            "rs",
            // Python
            "py", "pyi", "pyw",
            // Go
            "go",
            // Java/Kotlin
            "java", "kt", "kts",
            // C/C++
            "c", "cpp", "cc", "cxx", "h", "hpp", "hxx",
            // C#
            "cs",
            // Ruby
            "rb",
            // PHP
            "php",
            // Swift
            "swift",
            // Config
            "json", "yaml", "yml", "toml", "ini", "xml", "env",
            // Markup
            "html", "htm", "md", "mdx", "tex",
            // Styles
            "css", "scss", "sass", "less", "styl",
            // Database
            "sql", "prisma",
            // Shell
            "sh", "bash", "zsh", "fish", "ps1",
            // Other
            "txt", "log", "lock", "dockerfile",
        ]
    }

    /// Detect file tags in text
    pub fn detect(&self, text: &str) -> Vec<DetectedFileTag> {
        let mut tags = Vec::new();
        let text_lower = text.to_lowercase();

        for pattern in &self.patterns {
            for capture in pattern.regex.captures_iter(&text_lower) {
                if let Some(file_match) = capture.get(pattern.file_group) {
                    let file_ref = file_match.as_str().to_string();

                    // Skip if doesn't look like a file
                    if !self.looks_like_file(&file_ref) {
                        continue;
                    }

                    // Calculate confidence
                    let mut confidence = pattern.confidence;

                    // Boost confidence if extension is known
                    if let Some(ext) = file_ref.split('.').last() {
                        if self.known_extensions.contains(&ext) {
                            confidence = (confidence + 0.1).min(1.0);
                        }
                    }

                    // Boost confidence if recently mentioned
                    if self.recent_files.contains(&file_ref) {
                        confidence = (confidence + 0.1).min(1.0);
                    }

                    // Get original text (preserve case)
                    let full_match = match capture.get(0) {
                        Some(m) => m,
                        None => continue,
                    };
                    let start = full_match.start();
                    let end = full_match.end();
                    let original_text = text[start..end].to_string();

                    tags.push(DetectedFileTag {
                        original_text,
                        file_ref,
                        resolved_path: None,
                        position: (start, end),
                        confidence,
                        pattern_type: pattern.pattern_type,
                    });
                }
            }
        }

        // Remove duplicates (keep highest confidence)
        self.deduplicate_tags(tags)
    }

    /// Check if a string looks like a file reference
    fn looks_like_file(&self, text: &str) -> bool {
        // Must have an extension
        if !text.contains('.') {
            return false;
        }

        // Must not be too short
        if text.len() < 3 {
            return false;
        }

        // Check if extension is valid
        if let Some(ext) = text.split('.').last() {
            // Extension should be alphanumeric and reasonable length
            if ext.len() > 10 || !ext.chars().all(|c| c.is_alphanumeric()) {
                return false;
            }
        }

        // Must not start with a number
        if text.chars().next().map_or(false, |c| c.is_numeric()) {
            return false;
        }

        true
    }

    /// Remove duplicate detections, keeping highest confidence
    fn deduplicate_tags(&self, mut tags: Vec<DetectedFileTag>) -> Vec<DetectedFileTag> {
        // Sort by confidence descending so we process highest confidence first
        tags.sort_by(|a, b| {
            b.confidence.partial_cmp(&a.confidence).unwrap_or(std::cmp::Ordering::Equal)
        });

        let mut result: Vec<DetectedFileTag> = Vec::new();

        for tag in tags {
            // Check if this tag overlaps with any already-accepted tag for the same file_ref
            let dominated = result.iter().any(|existing| {
                existing.file_ref == tag.file_ref && ranges_overlap(existing.position, tag.position)
            });
            if !dominated {
                result.push(tag);
            }
        }

        // Sort by position
        result.sort_by_key(|t| t.position.0);
        result
    }

    /// Add a file to recent files list (boosts confidence)
    pub fn add_recent_file(&mut self, file: String) {
        // Remove if already exists
        self.recent_files.retain(|f| f != &file);

        // Add to front
        self.recent_files.insert(0, file);

        // Trim to max size
        if self.recent_files.len() > self.max_recent {
            self.recent_files.truncate(self.max_recent);
        }
    }

    /// Clear recent files
    pub fn clear_recent_files(&mut self) {
        self.recent_files.clear();
    }

    /// Get recent files
    pub fn get_recent_files(&self) -> &[String] {
        &self.recent_files
    }

    /// Add a custom pattern
    pub fn add_pattern(&mut self, pattern: TagPattern) {
        self.patterns.push(pattern);
    }

    /// Extract just the file references (without metadata)
    pub fn extract_file_refs(&self, text: &str) -> Vec<String> {
        self.detect(text)
            .into_iter()
            .map(|t| t.file_ref)
            .collect()
    }

    /// Replace file tags with resolved paths in text
    pub fn replace_with_paths(&self, text: &str, tags: &[DetectedFileTag]) -> String {
        let mut result = text.to_string();

        // Sort by position descending to replace from end to start
        let mut sorted_tags: Vec<_> = tags.iter().filter(|t| t.resolved_path.is_some()).collect();
        sorted_tags.sort_by(|a, b| b.position.0.cmp(&a.position.0));

        for tag in sorted_tags {
            if let Some(ref path) = tag.resolved_path {
                let path_str = path.display().to_string();
                result.replace_range(tag.position.0..tag.position.1, &path_str);
            }
        }

        result
    }
}

impl Default for FileTagDetector {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_at_symbol_detection() {
        let detector = FileTagDetector::new();
        let text = "Check @config.ts for the settings";
        let tags = detector.detect(text);

        assert_eq!(tags.len(), 1);
        assert_eq!(tags[0].file_ref, "config.ts");
        assert_eq!(tags[0].pattern_type, TagPatternType::AtSymbol);
    }

    #[test]
    fn test_at_keyword_detection() {
        let detector = FileTagDetector::new();
        let text = "Look at config.ts for the settings";
        let tags = detector.detect(text);

        assert!(tags.iter().any(|t| t.file_ref == "config.ts"));
    }

    #[test]
    fn test_tag_keyword_detection() {
        let detector = FileTagDetector::new();
        let text = "Tag utils/helpers.rs for context";
        let tags = detector.detect(text);

        assert!(tags.iter().any(|t| t.file_ref == "utils/helpers.rs"));
    }

    #[test]
    fn test_include_keyword_detection() {
        let detector = FileTagDetector::new();
        let text = "Include package.json in the context";
        let tags = detector.detect(text);

        assert!(tags.iter().any(|t| t.file_ref == "package.json"));
    }

    #[test]
    fn test_path_detection() {
        let detector = FileTagDetector::new();
        let text = "The component is in src/components/Button.tsx";
        let tags = detector.detect(text);

        assert!(tags.iter().any(|t| t.file_ref == "src/components/button.tsx"));
    }

    #[test]
    fn test_multiple_tags() {
        let detector = FileTagDetector::new();
        let text = "Check @config.ts and include package.json";
        let tags = detector.detect(text);

        assert!(tags.len() >= 2);
    }

    #[test]
    fn test_no_false_positives() {
        let detector = FileTagDetector::new();
        let text = "The version is 1.2.3 and we met at noon";
        let tags = detector.detect(text);

        // Should not detect version numbers as files
        assert!(!tags.iter().any(|t| t.file_ref.contains("1.2.3")));
    }

    #[test]
    fn test_recent_files_boost() {
        let mut detector = FileTagDetector::new();
        detector.add_recent_file("config.ts".to_string());

        let text = "Check at config.ts";
        let tags = detector.detect(text);

        // Recent file should have boosted confidence
        assert!(tags.iter().any(|t| t.file_ref == "config.ts" && t.confidence > 0.85));
    }

    #[test]
    fn test_extract_file_refs() {
        let detector = FileTagDetector::new();
        let text = "Check @config.ts and @main.rs";
        let refs = detector.extract_file_refs(text);

        assert!(refs.contains(&"config.ts".to_string()));
        assert!(refs.contains(&"main.rs".to_string()));
    }
}
