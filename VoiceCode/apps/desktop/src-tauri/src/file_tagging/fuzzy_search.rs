#![allow(dead_code, unused_variables, unused_imports)]
//! Fuzzy File Search
//!
//! Workspace file search with fuzzy matching for resolving voice-detected file references.
//! Prioritizes recently accessed and currently open files.

use std::collections::{HashMap, HashSet, VecDeque};
use std::path::{Path, PathBuf};
use serde::{Deserialize, Serialize};
use tokio::sync::RwLock;
use walkdir::WalkDir;

/// Search configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchConfig {
    /// Maximum results to return
    pub max_results: usize,
    /// Minimum score threshold (0.0 - 1.0)
    pub min_score: f32,
    /// Boost for recently accessed files
    pub recent_boost: f32,
    /// Boost for currently open files
    pub open_boost: f32,
    /// Boost for exact filename match
    pub exact_match_boost: f32,
    /// Include hidden files (starting with .)
    pub include_hidden: bool,
    /// File patterns to ignore
    pub ignore_patterns: Vec<String>,
    /// Maximum directory depth
    pub max_depth: usize,
}

impl Default for SearchConfig {
    fn default() -> Self {
        Self {
            max_results: 10,
            min_score: 0.3,
            recent_boost: 0.2,
            open_boost: 0.15,
            exact_match_boost: 0.3,
            include_hidden: false,
            ignore_patterns: vec![
                "node_modules".to_string(),
                "target".to_string(),
                ".git".to_string(),
                "dist".to_string(),
                "build".to_string(),
                "__pycache__".to_string(),
                ".next".to_string(),
                ".nuxt".to_string(),
                "vendor".to_string(),
            ],
            max_depth: 10,
        }
    }
}

/// Search result with score
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    /// Absolute path to file
    pub path: PathBuf,
    /// Relative path from workspace root
    pub relative_path: String,
    /// Match score (0.0 - 1.0)
    pub score: f32,
    /// Filename only
    pub filename: String,
    /// Match type
    pub match_type: MatchType,
}

/// Type of match found
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum MatchType {
    /// Exact filename match
    Exact,
    /// Case-insensitive exact match
    CaseInsensitive,
    /// Prefix match
    Prefix,
    /// Contains match
    Contains,
    /// Fuzzy trigram match
    Fuzzy,
    /// Path segment match
    PathSegment,
}

/// File index entry
#[derive(Debug, Clone)]
struct FileEntry {
    /// Absolute path
    path: PathBuf,
    /// Relative path
    relative_path: String,
    /// Filename (lowercase)
    filename_lower: String,
    /// Path segments (lowercase)
    path_segments: Vec<String>,
    /// Trigrams of filename
    trigrams: HashSet<String>,
}

/// Fuzzy file search system
pub struct FuzzyFileSearch {
    /// Workspace root
    workspace_root: RwLock<Option<PathBuf>>,
    /// File index
    file_index: RwLock<Vec<FileEntry>>,
    /// Recently accessed files (most recent first)
    recent_files: RwLock<VecDeque<PathBuf>>,
    /// Currently open files
    open_files: RwLock<HashSet<PathBuf>>,
    /// Search configuration
    config: RwLock<SearchConfig>,
    /// Maximum recent files to track
    max_recent: usize,
}

impl FuzzyFileSearch {
    /// Create a new fuzzy file search instance
    pub fn new() -> Self {
        Self {
            workspace_root: RwLock::new(None),
            file_index: RwLock::new(Vec::new()),
            recent_files: RwLock::new(VecDeque::new()),
            open_files: RwLock::new(HashSet::new()),
            config: RwLock::new(SearchConfig::default()),
            max_recent: 100,
        }
    }

    /// Set workspace root and index files
    pub async fn set_workspace(&self, root: PathBuf) -> Result<usize, String> {
        let config = self.config.read().await.clone();

        // Build file index
        let mut entries = Vec::new();

        for entry in WalkDir::new(&root)
            .max_depth(config.max_depth)
            .into_iter()
            .filter_entry(|e| {
                let name = e.file_name().to_string_lossy();

                // Skip hidden if not configured
                if !config.include_hidden && name.starts_with('.') {
                    return false;
                }

                // Skip ignored patterns
                for pattern in &config.ignore_patterns {
                    if name.contains(pattern) {
                        return false;
                    }
                }

                true
            })
        {
            if let Ok(entry) = entry {
                if entry.file_type().is_file() {
                    let path = entry.path().to_path_buf();
                    let relative = path
                        .strip_prefix(&root)
                        .map(|p| p.to_string_lossy().to_string())
                        .unwrap_or_else(|_| path.to_string_lossy().to_string());

                    let filename = entry
                        .file_name()
                        .to_string_lossy()
                        .to_string();

                    let filename_lower = filename.to_lowercase();

                    // Build path segments
                    let path_segments: Vec<String> = relative
                        .to_lowercase()
                        .split(['/', '\\'])
                        .map(|s| s.to_string())
                        .collect();

                    // Build trigrams
                    let trigrams = Self::compute_trigrams(&filename_lower);

                    entries.push(FileEntry {
                        path,
                        relative_path: relative,
                        filename_lower,
                        path_segments,
                        trigrams,
                    });
                }
            }
        }

        let count = entries.len();

        // Update index
        *self.file_index.write().await = entries;
        *self.workspace_root.write().await = Some(root);

        Ok(count)
    }

    /// Search for files matching a query
    pub async fn search(&self, query: &str) -> Vec<SearchResult> {
        let config = self.config.read().await.clone();
        let index = self.file_index.read().await;
        let recent = self.recent_files.read().await;
        let open = self.open_files.read().await;

        if query.is_empty() {
            return Vec::new();
        }

        let query_lower = query.to_lowercase();
        let query_trigrams = Self::compute_trigrams(&query_lower);

        let mut results: Vec<SearchResult> = Vec::new();

        for entry in index.iter() {
            let mut score = 0.0f32;
            let mut match_type = MatchType::Fuzzy;

            // Exact match
            if entry.filename_lower == query_lower {
                score = 1.0 + config.exact_match_boost;
                match_type = MatchType::Exact;
            }
            // Case-insensitive exact (different casing)
            else if entry.filename_lower == query_lower {
                score = 0.95;
                match_type = MatchType::CaseInsensitive;
            }
            // Prefix match
            else if entry.filename_lower.starts_with(&query_lower) {
                score = 0.8 + (query_lower.len() as f32 / entry.filename_lower.len() as f32) * 0.15;
                match_type = MatchType::Prefix;
            }
            // Contains match
            else if entry.filename_lower.contains(&query_lower) {
                score = 0.6 + (query_lower.len() as f32 / entry.filename_lower.len() as f32) * 0.2;
                match_type = MatchType::Contains;
            }
            // Path segment match
            else if entry.path_segments.iter().any(|s| s.contains(&query_lower)) {
                score = 0.5;
                match_type = MatchType::PathSegment;
            }
            // Trigram fuzzy match
            else if !query_trigrams.is_empty() {
                let intersection: HashSet<_> = query_trigrams
                    .intersection(&entry.trigrams)
                    .collect();

                if !intersection.is_empty() {
                    let similarity = intersection.len() as f32
                        / query_trigrams.len().max(entry.trigrams.len()) as f32;

                    if similarity >= 0.3 {
                        score = similarity * 0.6;
                        match_type = MatchType::Fuzzy;
                    }
                }
            }

            // Apply boosts
            if score > 0.0 {
                // Recent file boost
                if recent.contains(&entry.path) {
                    let position = recent.iter().position(|p| p == &entry.path).unwrap_or(0);
                    let recency_factor = 1.0 - (position as f32 / recent.len() as f32);
                    score += config.recent_boost * recency_factor;
                }

                // Open file boost
                if open.contains(&entry.path) {
                    score += config.open_boost;
                }

                // Filter by minimum score
                if score >= config.min_score {
                    let filename = entry.path
                        .file_name()
                        .map(|n| n.to_string_lossy().to_string())
                        .unwrap_or_default();

                    results.push(SearchResult {
                        path: entry.path.clone(),
                        relative_path: entry.relative_path.clone(),
                        score,
                        filename,
                        match_type,
                    });
                }
            }
        }

        // Sort by score descending
        results.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap());

        // Limit results
        results.truncate(config.max_results);

        results
    }

    /// Resolve a file reference to an absolute path
    pub async fn resolve(&self, file_ref: &str) -> Option<PathBuf> {
        let results = self.search(file_ref).await;
        results.into_iter().next().map(|r| r.path)
    }

    /// Resolve multiple file references
    pub async fn resolve_all(&self, file_refs: &[String]) -> HashMap<String, Option<PathBuf>> {
        let mut resolved = HashMap::new();

        for file_ref in file_refs {
            let path = self.resolve(file_ref).await;
            resolved.insert(file_ref.clone(), path);
        }

        resolved
    }

    /// Mark a file as recently accessed
    pub async fn mark_accessed(&self, path: PathBuf) {
        let mut recent = self.recent_files.write().await;

        // Remove if already exists
        recent.retain(|p| p != &path);

        // Add to front
        recent.push_front(path);

        // Trim to max size
        while recent.len() > self.max_recent {
            recent.pop_back();
        }
    }

    /// Mark a file as open
    pub async fn mark_open(&self, path: PathBuf) {
        self.open_files.write().await.insert(path);
    }

    /// Mark a file as closed
    pub async fn mark_closed(&self, path: &Path) {
        self.open_files.write().await.remove(path);
    }

    /// Get list of open files
    pub async fn get_open_files(&self) -> Vec<PathBuf> {
        self.open_files.read().await.iter().cloned().collect()
    }

    /// Get list of recent files
    pub async fn get_recent_files(&self) -> Vec<PathBuf> {
        self.recent_files.read().await.iter().cloned().collect()
    }

    /// Update search configuration
    pub async fn set_config(&self, config: SearchConfig) {
        *self.config.write().await = config;
    }

    /// Get current configuration
    pub async fn get_config(&self) -> SearchConfig {
        self.config.read().await.clone()
    }

    /// Refresh the file index
    pub async fn refresh(&self) -> Result<usize, String> {
        let root = self.workspace_root.read().await.clone();

        if let Some(root) = root {
            self.set_workspace(root).await
        } else {
            Err("No workspace set".to_string())
        }
    }

    /// Compute trigrams for a string
    fn compute_trigrams(s: &str) -> HashSet<String> {
        let mut trigrams = HashSet::new();

        if s.len() < 3 {
            // For short strings, use the whole thing
            trigrams.insert(s.to_string());
            return trigrams;
        }

        let chars: Vec<char> = s.chars().collect();
        for window in chars.windows(3) {
            trigrams.insert(window.iter().collect());
        }

        trigrams
    }

    /// Get the number of indexed files
    pub async fn file_count(&self) -> usize {
        self.file_index.read().await.len()
    }

    /// Check if workspace is set
    pub async fn has_workspace(&self) -> bool {
        self.workspace_root.read().await.is_some()
    }
}

impl Default for FuzzyFileSearch {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_trigram_computation() {
        let trigrams = FuzzyFileSearch::compute_trigrams("config");
        assert!(trigrams.contains("con"));
        assert!(trigrams.contains("onf"));
        assert!(trigrams.contains("nfi"));
        assert!(trigrams.contains("fig"));
    }

    #[test]
    fn test_trigram_similarity() {
        let t1 = FuzzyFileSearch::compute_trigrams("config");
        let t2 = FuzzyFileSearch::compute_trigrams("konfig");

        let intersection: HashSet<_> = t1.intersection(&t2).collect();
        let union_size = t1.len().max(t2.len());
        let similarity = intersection.len() as f32 / union_size as f32;

        // Should have some similarity
        assert!(similarity > 0.0);
    }

    #[tokio::test]
    async fn test_search_config() {
        let search = FuzzyFileSearch::new();

        let config = SearchConfig {
            max_results: 5,
            min_score: 0.5,
            ..Default::default()
        };

        search.set_config(config.clone()).await;

        let retrieved = search.get_config().await;
        assert_eq!(retrieved.max_results, 5);
        assert_eq!(retrieved.min_score, 0.5);
    }

    #[tokio::test]
    async fn test_recent_files() {
        let search = FuzzyFileSearch::new();

        search.mark_accessed(PathBuf::from("/test/file1.ts")).await;
        search.mark_accessed(PathBuf::from("/test/file2.ts")).await;

        let recent = search.get_recent_files().await;
        assert_eq!(recent.len(), 2);
        assert_eq!(recent[0], PathBuf::from("/test/file2.ts")); // Most recent first
    }

    #[tokio::test]
    async fn test_open_files() {
        let search = FuzzyFileSearch::new();

        search.mark_open(PathBuf::from("/test/file1.ts")).await;
        search.mark_open(PathBuf::from("/test/file2.ts")).await;

        let open = search.get_open_files().await;
        assert_eq!(open.len(), 2);

        search.mark_closed(&PathBuf::from("/test/file1.ts")).await;

        let open = search.get_open_files().await;
        assert_eq!(open.len(), 1);
    }
}
