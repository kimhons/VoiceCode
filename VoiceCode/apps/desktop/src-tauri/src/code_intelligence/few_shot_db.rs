#![allow(dead_code, unused_variables, unused_imports)]
// Few-Shot Example Database - Store and retrieve similar code examples
// Learns from project patterns for better code generation

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use serde::{Deserialize, Serialize};
use parking_lot::RwLock;
use glob;

/// Few-Shot Example Database
pub struct FewShotDatabase {
    examples: RwLock<Vec<CodeExample>>,
    index: RwLock<HashMap<String, Vec<usize>>>,
    config: FewShotConfig,
    storage_path: Option<PathBuf>,
}

#[derive(Debug, Clone)]
pub struct FewShotConfig {
    pub max_examples: usize,
    pub similarity_threshold: f32,
    pub max_example_tokens: usize,
    pub categories: Vec<String>,
}

impl Default for FewShotConfig {
    fn default() -> Self {
        Self {
            max_examples: 1000,
            similarity_threshold: 0.7,
            max_example_tokens: 500,
            categories: vec![
                "function".to_string(), "class".to_string(), "test".to_string(),
                "error_handling".to_string(), "api_endpoint".to_string(),
                "component".to_string(), "hook".to_string(), "utility".to_string(),
            ],
        }
    }
}

/// A code example for few-shot learning
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodeExample {
    pub id: String,
    pub category: String,
    pub language: String,
    pub description: String,
    pub input_pattern: String,
    pub code: String,
    pub file_path: Option<String>,
    pub keywords: Vec<String>,
    pub quality_score: f32,
    pub usage_count: u32,
    pub created_at: u64,
    pub updated_at: u64,
}

/// Query for finding examples
#[derive(Debug, Clone)]
pub struct ExampleQuery {
    pub category: Option<String>,
    pub language: Option<String>,
    pub keywords: Vec<String>,
    pub description: Option<String>,
    pub limit: usize,
}

impl Default for ExampleQuery {
    fn default() -> Self {
        Self {
            category: None,
            language: None,
            keywords: Vec::new(),
            description: None,
            limit: 3,
        }
    }
}

/// Result of example search
#[derive(Debug, Clone)]
pub struct ExampleMatch {
    pub example: CodeExample,
    pub score: f32,
    pub match_reasons: Vec<String>,
}

impl FewShotDatabase {
    pub fn new(config: FewShotConfig) -> Self {
        Self {
            examples: RwLock::new(Vec::new()),
            index: RwLock::new(HashMap::new()),
            config,
            storage_path: None,
        }
    }

    pub fn with_storage(mut self, path: PathBuf) -> Self {
        self.storage_path = Some(path);
        self
    }

    /// Add a new example
    pub fn add_example(&self, example: CodeExample) -> Result<(), String> {
        let mut examples = self.examples.write();
        
        // Check for duplicates
        if examples.iter().any(|e| e.id == example.id) {
            return Err("Example already exists".to_string());
        }

        // Enforce max examples
        if examples.len() >= self.config.max_examples {
            // Remove lowest quality, least used example
            if let Some(idx) = examples.iter()
                .enumerate()
                .min_by(|(_, a), (_, b)| {
                    let score_a = a.quality_score * 0.5 + (a.usage_count as f32 * 0.01);
                    let score_b = b.quality_score * 0.5 + (b.usage_count as f32 * 0.01);
                    score_a.partial_cmp(&score_b).unwrap_or(std::cmp::Ordering::Equal)
                })
                .map(|(i, _)| i)
            {
                examples.remove(idx);
            }
        }

        let idx = examples.len();
        
        // Update index
        let mut index = self.index.write();
        for keyword in &example.keywords {
            index.entry(keyword.to_lowercase())
                .or_insert_with(Vec::new)
                .push(idx);
        }
        index.entry(example.category.to_lowercase())
            .or_insert_with(Vec::new)
            .push(idx);
        index.entry(example.language.to_lowercase())
            .or_insert_with(Vec::new)
            .push(idx);

        examples.push(example);
        Ok(())
    }

    /// Find similar examples
    pub fn find_examples(&self, query: &ExampleQuery) -> Vec<ExampleMatch> {
        let examples = self.examples.read();
        let index = self.index.read();
        
        let mut candidates: HashMap<usize, f32> = HashMap::new();
        let mut match_reasons: HashMap<usize, Vec<String>> = HashMap::new();

        // Score by category match
        if let Some(ref cat) = query.category {
            if let Some(indices) = index.get(&cat.to_lowercase()) {
                for &idx in indices {
                    *candidates.entry(idx).or_insert(0.0) += 0.3;
                    match_reasons.entry(idx).or_default().push(format!("category:{}", cat));
                }
            }
        }

        // Score by language match
        if let Some(ref lang) = query.language {
            if let Some(indices) = index.get(&lang.to_lowercase()) {
                for &idx in indices {
                    *candidates.entry(idx).or_insert(0.0) += 0.2;
                    match_reasons.entry(idx).or_default().push(format!("language:{}", lang));
                }
            }
        }

        // Score by keyword matches
        for keyword in &query.keywords {
            if let Some(indices) = index.get(&keyword.to_lowercase()) {
                for &idx in indices {
                    *candidates.entry(idx).or_insert(0.0) += 0.15;
                    match_reasons.entry(idx).or_default().push(format!("keyword:{}", keyword));
                }
            }
        }

        // Score by description similarity
        if let Some(ref desc) = query.description {
            let desc_words: Vec<&str> = desc.split_whitespace().collect();
            for (idx, example) in examples.iter().enumerate() {
                let example_words: Vec<&str> = example.description.split_whitespace().collect();
                let common = desc_words.iter()
                    .filter(|w| example_words.contains(w))
                    .count();
                if common > 0 {
                    let similarity = common as f32 / desc_words.len().max(1) as f32;
                    *candidates.entry(idx).or_insert(0.0) += similarity * 0.35;
                    if similarity > 0.3 {
                        match_reasons.entry(idx).or_default().push("description_match".to_string());
                    }
                }
            }
        }

        // Filter by threshold and sort
        let mut results: Vec<ExampleMatch> = candidates.into_iter()
            .filter(|(_, score)| *score >= self.config.similarity_threshold * 0.5)
            .map(|(idx, score)| ExampleMatch {
                example: examples[idx].clone(),
                score,
                match_reasons: match_reasons.remove(&idx).unwrap_or_default(),
            })
            .collect();

        results.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap_or(std::cmp::Ordering::Equal));
        results.truncate(query.limit);
        results
    }

    /// Extract examples from a codebase
    pub async fn extract_from_codebase(&self, root: &Path) -> Result<usize, String> {
        let mut count = 0;
        let extensions = ["ts", "js", "rs", "py", "go", "java"];

        for ext in &extensions {
            let pattern = format!("{}/**/*.{}", root.display(), ext);
            if let Ok(paths) = glob::glob(&pattern) {
                for entry in paths.filter_map(|e| e.ok()).take(100) {
                    if let Ok(content) = std::fs::read_to_string(&entry) {
                        let examples = self.extract_from_file(&entry, &content, ext);
                        for example in examples {
                            if self.add_example(example).is_ok() {
                                count += 1;
                            }
                        }
                    }
                }
            }
        }

        Ok(count)
    }

    fn extract_from_file(&self, path: &Path, content: &str, lang: &str) -> Vec<CodeExample> {
        let mut examples = Vec::new();
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        // Extract functions
        let func_patterns = match lang {
            "ts" | "js" => vec![
                (r"(?m)^(?:export\s+)?(?:async\s+)?function\s+(\w+)", "function"),
                (r"(?m)^(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>", "arrow_function"),
            ],
            "rs" => vec![
                (r"(?m)^(?:pub\s+)?(?:async\s+)?fn\s+(\w+)", "function"),
            ],
            "py" => vec![
                (r"(?m)^(?:async\s+)?def\s+(\w+)", "function"),
            ],
            _ => vec![],
        };

        for (pattern, category) in func_patterns {
            if let Ok(re) = regex::Regex::new(pattern) {
                for cap in re.captures_iter(content) {
                    if let Some(name) = cap.get(1) {
                        let name_str = name.as_str();
                        
                        // Extract function body (simplified)
                        let start = match cap.get(0) {
                            Some(m) => m.start(),
                            None => continue,
                        };
                        let code_slice = &content[start..];
                        let code = self.extract_block(code_slice, lang);
                        
                        if code.len() > 20 && code.len() < 2000 {
                            let keywords = self.extract_keywords(name_str, &code);
                            
                            examples.push(CodeExample {
                                id: format!("{}:{}:{}", path.display(), name_str, start),
                                category: category.to_string(),
                                language: lang.to_string(),
                                description: format!("{} from {}", name_str, path.file_name().unwrap_or_default().to_string_lossy()),
                                input_pattern: format!("create {} like {}", category, name_str),
                                code,
                                file_path: Some(path.to_string_lossy().to_string()),
                                keywords,
                                quality_score: 0.5,
                                usage_count: 0,
                                created_at: now,
                                updated_at: now,
                            });
                        }
                    }
                }
            }
        }

        examples
    }

    fn extract_block(&self, content: &str, lang: &str) -> String {
        let lines: Vec<&str> = content.lines().collect();
        let mut depth = 0;
        let mut end_line = 0;
        let open_char = if lang == "py" { ':' } else { '{' };
        let close_char = '}';

        for (i, line) in lines.iter().enumerate() {
            if lang == "py" {
                // Python: track indentation
                if i == 0 { continue; }
                if !line.trim().is_empty() && !line.starts_with(' ') && !line.starts_with('\t') {
                    end_line = i;
                    break;
                }
                end_line = i + 1;
            } else {
                // Brace-based languages
                depth += line.matches(open_char).count() as i32;
                depth -= line.matches(close_char).count() as i32;
                if depth <= 0 && i > 0 {
                    end_line = i + 1;
                    break;
                }
            }
            if i > 50 { break; } // Limit extraction
        }

        lines[..end_line.min(lines.len())].join("\n")
    }

    fn extract_keywords(&self, name: &str, code: &str) -> Vec<String> {
        let mut keywords = Vec::new();
        
        // Split name by case
        let mut current = String::new();
        for c in name.chars() {
            if c.is_uppercase() && !current.is_empty() {
                keywords.push(current.to_lowercase());
                current = String::new();
            }
            current.push(c);
        }
        if !current.is_empty() {
            keywords.push(current.to_lowercase());
        }

        // Extract common patterns
        if code.contains("async") { keywords.push("async".to_string()); }
        if code.contains("await") { keywords.push("await".to_string()); }
        if code.contains("Promise") { keywords.push("promise".to_string()); }
        if code.contains("Result") { keywords.push("result".to_string()); }
        if code.contains("Error") { keywords.push("error".to_string()); }
        if code.contains("test") || code.contains("Test") { keywords.push("test".to_string()); }
        if code.contains("fetch") || code.contains("http") { keywords.push("http".to_string()); }
        if code.contains("useState") || code.contains("useEffect") { keywords.push("hook".to_string()); }

        keywords.sort();
        keywords.dedup();
        keywords
    }

    /// Record usage of an example (for quality scoring)
    pub fn record_usage(&self, example_id: &str, was_helpful: bool) {
        let mut examples = self.examples.write();
        if let Some(example) = examples.iter_mut().find(|e| e.id == example_id) {
            example.usage_count += 1;
            if was_helpful {
                example.quality_score = (example.quality_score + 0.1).min(1.0);
            } else {
                example.quality_score = (example.quality_score - 0.05).max(0.0);
            }
            example.updated_at = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs();
        }
    }

    /// Format examples for LLM prompt
    pub fn format_for_prompt(&self, examples: &[ExampleMatch]) -> String {
        if examples.is_empty() {
            return String::new();
        }

        let mut output = String::from("## Similar Examples from This Project\n\n");
        
        for (i, m) in examples.iter().enumerate() {
            output.push_str(&format!("### Example {} - {}\n", i + 1, m.example.description));
            output.push_str(&format!("```{}\n{}\n```\n\n", m.example.language, m.example.code));
        }

        output
    }

    /// Save to disk
    pub async fn save(&self) -> Result<(), String> {
        if let Some(ref path) = self.storage_path {
            let examples = self.examples.read().clone();
            let json = serde_json::to_string_pretty(&examples)
                .map_err(|e| format!("Serialization error: {}", e))?;
            tokio::fs::write(path, json).await
                .map_err(|e| format!("Write error: {}", e))?;
        }
        Ok(())
    }

    /// Load from disk
    pub async fn load(&self) -> Result<(), String> {
        if let Some(ref path) = self.storage_path {
            if path.exists() {
                let json = tokio::fs::read_to_string(path).await
                    .map_err(|e| format!("Read error: {}", e))?;
                let loaded: Vec<CodeExample> = serde_json::from_str(&json)
                    .map_err(|e| format!("Parse error: {}", e))?;
                
                *self.examples.write() = loaded;
                self.rebuild_index();
            }
        }
        Ok(())
    }

    fn rebuild_index(&self) {
        let examples = self.examples.read();
        let mut index = self.index.write();
        index.clear();

        for (idx, example) in examples.iter().enumerate() {
            for keyword in &example.keywords {
                index.entry(keyword.to_lowercase())
                    .or_insert_with(Vec::new)
                    .push(idx);
            }
            index.entry(example.category.to_lowercase())
                .or_insert_with(Vec::new)
                .push(idx);
            index.entry(example.language.to_lowercase())
                .or_insert_with(Vec::new)
                .push(idx);
        }
    }

    pub fn example_count(&self) -> usize {
        self.examples.read().len()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_database_creation() {
        let db = FewShotDatabase::new(FewShotConfig::default());
        assert_eq!(db.example_count(), 0);
    }

    #[test]
    fn test_add_and_find_example() {
        let db = FewShotDatabase::new(FewShotConfig::default());
        
        let example = CodeExample {
            id: "test1".to_string(),
            category: "function".to_string(),
            language: "typescript".to_string(),
            description: "Validate email address".to_string(),
            input_pattern: "create function to validate email".to_string(),
            code: "function validateEmail(email: string): boolean { return true; }".to_string(),
            file_path: None,
            keywords: vec!["validate".to_string(), "email".to_string()],
            quality_score: 0.8,
            usage_count: 0,
            created_at: 0,
            updated_at: 0,
        };

        db.add_example(example).unwrap();
        assert_eq!(db.example_count(), 1);

        let query = ExampleQuery {
            category: Some("function".to_string()),
            keywords: vec!["validate".to_string()],
            ..Default::default()
        };

        let results = db.find_examples(&query);
        assert!(!results.is_empty());
    }
}
