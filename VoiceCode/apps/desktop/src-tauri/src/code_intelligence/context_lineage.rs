#![allow(dead_code, unused_variables, unused_imports)]
// Context Lineage - Git History Intelligence
// Indexes commit history for "why" context (Augment-style)
// Enables queries like "Why was this changed?" and "Show similar commits"

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::Arc;
use serde::{Deserialize, Serialize};
use parking_lot::RwLock;
use chrono::{DateTime, Utc};
use uuid::Uuid;

use super::llm_client::{LLMClient, LLMRequest, Message};
use super::semantic_search::EmbeddingService;

/// A parsed git commit
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitCommit {
    pub hash: String,
    pub short_hash: String,
    pub author: String,
    pub author_email: String,
    pub date: DateTime<Utc>,
    pub message: String,
    pub body: Option<String>,
    pub files_changed: Vec<FileChange>,
    pub insertions: usize,
    pub deletions: usize,
    pub branch: Option<String>,
    pub tags: Vec<String>,
}

/// A file change in a commit
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileChange {
    pub path: PathBuf,
    pub change_type: ChangeType,
    pub insertions: usize,
    pub deletions: usize,
    pub old_path: Option<PathBuf>,
}

/// Type of file change
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum ChangeType {
    Added,
    Modified,
    Deleted,
    Renamed,
    Copied,
}

/// Summarized commit for indexing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommitSummary {
    pub id: String,
    pub commit_hash: String,
    pub date: DateTime<Utc>,
    pub author: String,
    /// LLM-generated summary of the change
    pub summary: String,
    /// Primary goal/purpose of the change
    pub goal: String,
    /// Key files touched
    pub key_files: Vec<String>,
    /// Technical terms for retrieval
    pub keywords: Vec<String>,
    /// Embedding vector for semantic search
    pub embedding: Option<Vec<f32>>,
    /// Original commit message
    pub original_message: String,
}

/// Configuration for context lineage
#[derive(Debug, Clone)]
pub struct LineageConfig {
    /// Maximum commits to index
    pub max_commits: usize,
    /// Days of history to consider
    pub history_days: u32,
    /// Branches to index
    pub branches: Vec<String>,
    /// Use LLM for summarization
    pub use_llm_summary: bool,
    /// Model for summarization
    pub summary_model: String,
    /// Embedding model
    pub embedding_model: String,
}

impl Default for LineageConfig {
    fn default() -> Self {
        Self {
            max_commits: 1000,
            history_days: 90,
            branches: vec!["main".to_string(), "master".to_string(), "HEAD".to_string()],
            use_llm_summary: true,
            summary_model: "gemini-2.0-flash".to_string(),
            embedding_model: "text-embedding-3-small".to_string(),
        }
    }
}

/// Context Lineage engine for git history intelligence
pub struct ContextLineage {
    config: LineageConfig,
    project_root: PathBuf,
    commits: RwLock<Vec<GitCommit>>,
    summaries: RwLock<Vec<CommitSummary>>,
    llm_client: Option<Arc<LLMClient>>,
    embedding_service: Option<Arc<EmbeddingService>>,
    /// File to commit hash mapping
    file_history: RwLock<HashMap<PathBuf, Vec<String>>>,
}

impl ContextLineage {
    pub fn new(project_root: PathBuf, config: LineageConfig) -> Self {
        Self {
            config,
            project_root,
            commits: RwLock::new(Vec::new()),
            summaries: RwLock::new(Vec::new()),
            llm_client: None,
            embedding_service: None,
            file_history: RwLock::new(HashMap::new()),
        }
    }

    pub fn with_llm(mut self, client: Arc<LLMClient>) -> Self {
        self.llm_client = Some(client);
        self
    }

    pub fn with_embeddings(mut self, service: Arc<EmbeddingService>) -> Self {
        self.embedding_service = Some(service);
        self
    }

    /// Harvest commits from git history
    pub async fn harvest_commits(&self) -> Result<HarvestStats, String> {
        let mut stats = HarvestStats::default();

        // Get current branch
        let current_branch = self.get_current_branch()?;

        // Fetch commit list
        let commits = self.fetch_commits(&current_branch)?;
        stats.commits_found = commits.len();

        // Process each commit
        let mut processed_commits = Vec::new();
        let mut file_history: HashMap<PathBuf, Vec<String>> = HashMap::new();

        for commit in commits.into_iter().take(self.config.max_commits) {
            // Get detailed commit info
            if let Ok(detailed) = self.get_commit_details(&commit.hash) {
                // Track file history
                for file in &detailed.files_changed {
                    file_history
                        .entry(file.path.clone())
                        .or_default()
                        .push(detailed.hash.clone());
                }

                processed_commits.push(detailed);
                stats.commits_processed += 1;
            }
        }

        // Store commits
        *self.commits.write() = processed_commits;
        *self.file_history.write() = file_history;

        // Generate summaries if LLM available
        if self.config.use_llm_summary && self.llm_client.is_some() {
            let summaries = self.generate_summaries().await?;
            stats.summaries_generated = summaries.len();
            *self.summaries.write() = summaries;
        }

        Ok(stats)
    }

    /// Get current git branch
    fn get_current_branch(&self) -> Result<String, String> {
        let output = Command::new("git")
            .args(["rev-parse", "--abbrev-ref", "HEAD"])
            .current_dir(&self.project_root)
            .output()
            .map_err(|e| format!("Failed to get branch: {}", e))?;

        if output.status.success() {
            Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
        } else {
            Err("Failed to get current branch".to_string())
        }
    }

    /// Fetch commits from git log
    fn fetch_commits(&self, branch: &str) -> Result<Vec<GitCommit>, String> {
        let since = format!("--since={} days ago", self.config.history_days);
        
        let output = Command::new("git")
            .args([
                "log",
                branch,
                &since,
                "--format=%H|%h|%an|%ae|%aI|%s",
                &format!("-{}", self.config.max_commits),
            ])
            .current_dir(&self.project_root)
            .output()
            .map_err(|e| format!("Failed to run git log: {}", e))?;

        if !output.status.success() {
            return Err(format!(
                "Git log failed: {}",
                String::from_utf8_lossy(&output.stderr)
            ));
        }

        let commits: Vec<GitCommit> = String::from_utf8_lossy(&output.stdout)
            .lines()
            .filter_map(|line| {
                let parts: Vec<&str> = line.split('|').collect();
                if parts.len() >= 6 {
                    Some(GitCommit {
                        hash: parts[0].to_string(),
                        short_hash: parts[1].to_string(),
                        author: parts[2].to_string(),
                        author_email: parts[3].to_string(),
                        date: DateTime::parse_from_rfc3339(parts[4])
                            .map(|dt| dt.with_timezone(&Utc))
                            .unwrap_or_else(|_| Utc::now()),
                        message: parts[5..].join("|"),
                        body: None,
                        files_changed: Vec::new(),
                        insertions: 0,
                        deletions: 0,
                        branch: Some(branch.to_string()),
                        tags: Vec::new(),
                    })
                } else {
                    None
                }
            })
            .collect();

        Ok(commits)
    }

    /// Get detailed commit information including files changed
    fn get_commit_details(&self, hash: &str) -> Result<GitCommit, String> {
        // Get commit body
        let body_output = Command::new("git")
            .args(["log", "-1", "--format=%b", hash])
            .current_dir(&self.project_root)
            .output()
            .map_err(|e| format!("Failed to get commit body: {}", e))?;

        let body = String::from_utf8_lossy(&body_output.stdout).trim().to_string();

        // Get files changed with stats
        let files_output = Command::new("git")
            .args(["diff-tree", "--no-commit-id", "--name-status", "-r", hash])
            .current_dir(&self.project_root)
            .output()
            .map_err(|e| format!("Failed to get files: {}", e))?;

        let files_changed: Vec<FileChange> = String::from_utf8_lossy(&files_output.stdout)
            .lines()
            .filter_map(|line| {
                let parts: Vec<&str> = line.split('\t').collect();
                if parts.len() >= 2 {
                    let change_type = match parts[0].chars().next() {
                        Some('A') => ChangeType::Added,
                        Some('M') => ChangeType::Modified,
                        Some('D') => ChangeType::Deleted,
                        Some('R') => ChangeType::Renamed,
                        Some('C') => ChangeType::Copied,
                        _ => ChangeType::Modified,
                    };

                    Some(FileChange {
                        path: PathBuf::from(parts.last().unwrap()),
                        change_type,
                        insertions: 0,
                        deletions: 0,
                        old_path: if parts.len() > 2 {
                            Some(PathBuf::from(parts[1]))
                        } else {
                            None
                        },
                    })
                } else {
                    None
                }
            })
            .collect();

        // Get stats
        let stats_output = Command::new("git")
            .args(["diff-tree", "--no-commit-id", "--shortstat", hash])
            .current_dir(&self.project_root)
            .output()
            .map_err(|e| format!("Failed to get stats: {}", e))?;

        let stats_str = String::from_utf8_lossy(&stats_output.stdout);
        let (insertions, deletions) = self.parse_stats(&stats_str);

        // Get commit info
        let info_output = Command::new("git")
            .args(["log", "-1", "--format=%H|%h|%an|%ae|%aI|%s", hash])
            .current_dir(&self.project_root)
            .output()
            .map_err(|e| format!("Failed to get commit info: {}", e))?;

        let info_str = String::from_utf8_lossy(&info_output.stdout);
        let parts: Vec<&str> = info_str.trim().split('|').collect();

        if parts.len() < 6 {
            return Err("Invalid commit format".to_string());
        }

        Ok(GitCommit {
            hash: parts[0].to_string(),
            short_hash: parts[1].to_string(),
            author: parts[2].to_string(),
            author_email: parts[3].to_string(),
            date: DateTime::parse_from_rfc3339(parts[4])
                .map(|dt| dt.with_timezone(&Utc))
                .unwrap_or_else(|_| Utc::now()),
            message: parts[5..].join("|"),
            body: if body.is_empty() { None } else { Some(body) },
            files_changed,
            insertions,
            deletions,
            branch: None,
            tags: Vec::new(),
        })
    }

    /// Parse insertions/deletions from git shortstat
    fn parse_stats(&self, stats: &str) -> (usize, usize) {
        let mut insertions = 0;
        let mut deletions = 0;

        for part in stats.split(',') {
            let part = part.trim();
            if part.contains("insertion") {
                if let Some(num) = part.split_whitespace().next() {
                    insertions = num.parse().unwrap_or(0);
                }
            } else if part.contains("deletion") {
                if let Some(num) = part.split_whitespace().next() {
                    deletions = num.parse().unwrap_or(0);
                }
            }
        }

        (insertions, deletions)
    }

    /// Generate LLM summaries for commits
    async fn generate_summaries(&self) -> Result<Vec<CommitSummary>, String> {
        let llm = self.llm_client.as_ref().ok_or("LLM client not configured")?;
        let commits = self.commits.read().clone();
        let mut summaries = Vec::new();

        for commit in commits.iter().take(100) {
            // Skip merge commits
            if commit.message.starts_with("Merge") {
                continue;
            }

            let diff_context = self.get_commit_diff(&commit.hash, 500)?;

            let prompt = format!(
                r#"Summarize this git commit concisely for a code search index.

Commit: {} ({})
Author: {}
Date: {}
Message: {}
{}
Files changed:
{}

Diff preview:
{}

Respond with JSON:
{{
    "summary": "2-3 sentence summary of what changed and why",
    "goal": "Primary goal of this change (one phrase)",
    "keywords": ["keyword1", "keyword2", "..."]
}}"#,
                commit.short_hash,
                commit.hash,
                commit.author,
                commit.date.format("%Y-%m-%d"),
                commit.message,
                commit.body.as_deref().unwrap_or(""),
                commit
                    .files_changed
                    .iter()
                    .map(|f| format!("  {:?}: {}", f.change_type, f.path.display()))
                    .collect::<Vec<_>>()
                    .join("\n"),
                diff_context,
            );

            let request = LLMRequest::new(vec![
                Message::system("You are a code analyst that summarizes git commits for search indexing. Be concise and focus on the technical changes and their purpose."),
                Message::user(prompt),
            ]);

            match llm.complete(request).await {
                Ok(response) => {
                    // Parse JSON response
                    if let Ok(parsed) = serde_json::from_str::<SummaryResponse>(&response.content) {
                        let summary = CommitSummary {
                            id: Uuid::new_v4().to_string(),
                            commit_hash: commit.hash.clone(),
                            date: commit.date,
                            author: commit.author.clone(),
                            summary: parsed.summary,
                            goal: parsed.goal,
                            key_files: commit
                                .files_changed
                                .iter()
                                .map(|f| f.path.to_string_lossy().to_string())
                                .collect(),
                            keywords: parsed.keywords,
                            embedding: None,
                            original_message: commit.message.clone(),
                        };
                        summaries.push(summary);
                    }
                }
                Err(_) => {
                    // Create basic summary without LLM
                    summaries.push(CommitSummary {
                        id: Uuid::new_v4().to_string(),
                        commit_hash: commit.hash.clone(),
                        date: commit.date,
                        author: commit.author.clone(),
                        summary: commit.message.clone(),
                        goal: commit.message.split(':').next().unwrap_or(&commit.message).to_string(),
                        key_files: commit
                            .files_changed
                            .iter()
                            .map(|f| f.path.to_string_lossy().to_string())
                            .collect(),
                        keywords: extract_keywords(&commit.message),
                        embedding: None,
                        original_message: commit.message.clone(),
                    });
                }
            }
        }

        // Generate embeddings if service available
        if let Some(embedding_service) = &self.embedding_service {
            for summary in &mut summaries {
                let text = format!("{} {} {}", summary.summary, summary.goal, summary.keywords.join(" "));
                if let Ok(embedding) = embedding_service.embed(&text).await {
                    summary.embedding = Some(embedding);
                }
            }
        }

        Ok(summaries)
    }

    /// Get commit diff (truncated)
    fn get_commit_diff(&self, hash: &str, max_lines: usize) -> Result<String, String> {
        let output = Command::new("git")
            .args(["show", "--stat", "--patch", hash])
            .current_dir(&self.project_root)
            .output()
            .map_err(|e| format!("Failed to get diff: {}", e))?;

        let diff = String::from_utf8_lossy(&output.stdout);
        let lines: Vec<&str> = diff.lines().take(max_lines).collect();
        
        if diff.lines().count() > max_lines {
            Ok(format!("{}\n... (truncated)", lines.join("\n")))
        } else {
            Ok(lines.join("\n"))
        }
    }

    /// Search commits by query
    pub fn search_commits(&self, query: &str, limit: usize) -> Vec<CommitSearchResult> {
        let query_lower = query.to_lowercase();
        let summaries = self.summaries.read();

        let mut results: Vec<CommitSearchResult> = summaries
            .iter()
            .filter_map(|summary| {
                let mut score = 0.0;

                // Match in summary
                if summary.summary.to_lowercase().contains(&query_lower) {
                    score += 0.4;
                }

                // Match in goal
                if summary.goal.to_lowercase().contains(&query_lower) {
                    score += 0.3;
                }

                // Match in keywords
                for keyword in &summary.keywords {
                    if keyword.to_lowercase().contains(&query_lower) {
                        score += 0.2;
                        break;
                    }
                }

                // Match in original message
                if summary.original_message.to_lowercase().contains(&query_lower) {
                    score += 0.1;
                }

                if score > 0.0 {
                    Some(CommitSearchResult {
                        summary: summary.clone(),
                        score,
                        matched_in: self.find_match_locations(&query_lower, summary),
                    })
                } else {
                    None
                }
            })
            .collect();

        results.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap());
        results.into_iter().take(limit).collect()
    }

    /// Find where the query matched
    fn find_match_locations(&self, query: &str, summary: &CommitSummary) -> Vec<String> {
        let mut locations = Vec::new();

        if summary.summary.to_lowercase().contains(query) {
            locations.push("summary".to_string());
        }
        if summary.goal.to_lowercase().contains(query) {
            locations.push("goal".to_string());
        }
        if summary.original_message.to_lowercase().contains(query) {
            locations.push("message".to_string());
        }
        for keyword in &summary.keywords {
            if keyword.to_lowercase().contains(query) {
                locations.push("keywords".to_string());
                break;
            }
        }

        locations
    }

    /// Semantic search using embeddings
    pub async fn semantic_search(&self, query: &str, limit: usize) -> Result<Vec<CommitSearchResult>, String> {
        let embedding_service = self.embedding_service.as_ref()
            .ok_or("Embedding service not configured")?;

        let query_embedding = embedding_service.embed(query).await?;
        let summaries = self.summaries.read();

        let mut results: Vec<CommitSearchResult> = summaries
            .iter()
            .filter_map(|summary| {
                summary.embedding.as_ref().map(|emb| {
                    let score = cosine_similarity(&query_embedding, emb);
                    CommitSearchResult {
                        summary: summary.clone(),
                        score,
                        matched_in: vec!["semantic".to_string()],
                    }
                })
            })
            .collect();

        results.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap());
        Ok(results.into_iter().take(limit).collect())
    }

    /// Get commit history for a specific file
    pub fn get_file_history(&self, file_path: &Path) -> Vec<GitCommit> {
        let file_history = self.file_history.read();
        let commits = self.commits.read();

        if let Some(hashes) = file_history.get(file_path) {
            hashes
                .iter()
                .filter_map(|hash| commits.iter().find(|c| &c.hash == hash).cloned())
                .collect()
        } else {
            Vec::new()
        }
    }

    /// Explain why a file/function was changed
    pub async fn explain_change(&self, file_path: &Path, symbol: Option<&str>) -> Result<ChangeExplanation, String> {
        let history = self.get_file_history(file_path);

        if history.is_empty() {
            return Err("No history found for file".to_string());
        }

        // Get relevant commits
        let relevant: Vec<_> = if let Some(sym) = symbol {
            history
                .iter()
                .filter(|c| {
                    c.message.to_lowercase().contains(&sym.to_lowercase())
                        || c.body
                            .as_ref()
                            .map(|b| b.to_lowercase().contains(&sym.to_lowercase()))
                            .unwrap_or(false)
                })
                .take(5)
                .cloned()
                .collect()
        } else {
            history.into_iter().take(5).collect()
        };

        if relevant.is_empty() {
            return Err("No relevant commits found".to_string());
        }

        // Get summaries for these commits
        let summaries = self.summaries.read();
        let relevant_summaries: Vec<_> = relevant
            .iter()
            .filter_map(|c| summaries.iter().find(|s| s.commit_hash == c.hash).cloned())
            .collect();

        let total = relevant.len();
        Ok(ChangeExplanation {
            file_path: file_path.to_path_buf(),
            symbol: symbol.map(|s| s.to_string()),
            commits: relevant,
            summaries: relevant_summaries,
            total_changes: total,
        })
    }

    /// Find similar commits (for pattern matching)
    pub async fn find_similar_commits(&self, description: &str, limit: usize) -> Result<Vec<CommitSearchResult>, String> {
        // Try semantic search first
        if self.embedding_service.is_some() {
            self.semantic_search(description, limit).await
        } else {
            // Fall back to keyword search
            Ok(self.search_commits(description, limit))
        }
    }

    /// Get commits that introduced a specific pattern
    pub fn find_pattern_introduction(&self, pattern: &str) -> Vec<GitCommit> {
        let commits = self.commits.read();
        
        commits
            .iter()
            .filter(|c| {
                c.message.contains(pattern)
                    || c.body.as_ref().map(|b| b.contains(pattern)).unwrap_or(false)
                    || c.files_changed.iter().any(|f| {
                        f.path.to_string_lossy().contains(pattern)
                    })
            })
            .cloned()
            .collect()
    }

    /// Get recent commits for a branch
    pub fn get_recent_commits(&self, limit: usize) -> Vec<GitCommit> {
        self.commits.read().iter().take(limit).cloned().collect()
    }

    /// Get statistics
    pub fn stats(&self) -> LineageStats {
        let commits = self.commits.read();
        let summaries = self.summaries.read();
        let file_history = self.file_history.read();

        LineageStats {
            total_commits: commits.len(),
            total_summaries: summaries.len(),
            files_tracked: file_history.len(),
            authors: commits.iter().map(|c| c.author.clone()).collect::<std::collections::HashSet<_>>().len(),
            date_range: if commits.is_empty() {
                None
            } else {
                Some((
                    commits.last().map(|c| c.date).unwrap_or_else(Utc::now),
                    commits.first().map(|c| c.date).unwrap_or_else(Utc::now),
                ))
            },
        }
    }
}

/// Response from LLM summarization
#[derive(Debug, Deserialize)]
struct SummaryResponse {
    summary: String,
    goal: String,
    keywords: Vec<String>,
}

/// Statistics from harvesting
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct HarvestStats {
    pub commits_found: usize,
    pub commits_processed: usize,
    pub summaries_generated: usize,
}

/// Commit search result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommitSearchResult {
    pub summary: CommitSummary,
    pub score: f32,
    pub matched_in: Vec<String>,
}

/// Explanation for why something changed
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChangeExplanation {
    pub file_path: PathBuf,
    pub symbol: Option<String>,
    pub commits: Vec<GitCommit>,
    pub summaries: Vec<CommitSummary>,
    pub total_changes: usize,
}

/// Statistics about the lineage index
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LineageStats {
    pub total_commits: usize,
    pub total_summaries: usize,
    pub files_tracked: usize,
    pub authors: usize,
    pub date_range: Option<(DateTime<Utc>, DateTime<Utc>)>,
}

/// Extract keywords from a commit message
fn extract_keywords(message: &str) -> Vec<String> {
    let stop_words: std::collections::HashSet<&str> = [
        "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
        "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
        "being", "have", "has", "had", "do", "does", "did", "will", "would",
        "could", "should", "may", "might", "must", "this", "that", "these",
        "those", "it", "its",
    ].into_iter().collect();

    message
        .split(|c: char| !c.is_alphanumeric() && c != '_')
        .filter(|word| {
            let lower = word.to_lowercase();
            word.len() > 2 && !stop_words.contains(lower.as_str())
        })
        .take(10)
        .map(|s| s.to_string())
        .collect()
}

/// Calculate cosine similarity between two vectors
fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
    if a.len() != b.len() || a.is_empty() {
        return 0.0;
    }

    let dot: f32 = a.iter().zip(b.iter()).map(|(x, y)| x * y).sum();
    let norm_a: f32 = a.iter().map(|x| x * x).sum::<f32>().sqrt();
    let norm_b: f32 = b.iter().map(|x| x * x).sum::<f32>().sqrt();

    if norm_a == 0.0 || norm_b == 0.0 {
        0.0
    } else {
        dot / (norm_a * norm_b)
    }
}

// Tauri commands

#[tauri::command]
pub async fn harvest_git_history(project_root: String) -> Result<HarvestStats, String> {
    let lineage = ContextLineage::new(PathBuf::from(project_root), LineageConfig::default());
    lineage.harvest_commits().await
}

pub fn search_git_history(query: String, limit: usize) -> Result<Vec<CommitSearchResult>, String> {
    Err("Context lineage not initialized".to_string())
}

#[tauri::command]
pub fn explain_file_changes(file_path: String) -> Result<ChangeExplanation, String> {
    Err("Context lineage not initialized".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_keywords() {
        let message = "feat: Add user authentication with JWT tokens";
        let keywords = extract_keywords(message);
        
        assert!(keywords.contains(&"feat".to_string()) || keywords.contains(&"Add".to_string()));
        assert!(keywords.contains(&"user".to_string()) || keywords.contains(&"authentication".to_string()));
    }

    #[test]
    fn test_cosine_similarity() {
        let a = vec![1.0, 0.0, 0.0];
        let b = vec![1.0, 0.0, 0.0];
        assert!((cosine_similarity(&a, &b) - 1.0).abs() < 0.001);

        let c = vec![0.0, 1.0, 0.0];
        assert!((cosine_similarity(&a, &c)).abs() < 0.001);
    }

    #[test]
    fn test_lineage_config_default() {
        let config = LineageConfig::default();
        assert_eq!(config.max_commits, 1000);
        assert_eq!(config.history_days, 90);
    }
}
