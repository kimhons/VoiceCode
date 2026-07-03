#![allow(dead_code, unused_variables, unused_imports)]
// Team Knowledge Sharing - Share memories and patterns across team
// Enterprise feature for collaborative learning

use std::path::Path;
use serde::{Deserialize, Serialize};
use parking_lot::RwLock;
use glob;

/// Team knowledge sharing system
pub struct TeamKnowledge {
    config: TeamConfig,
    shared_memories: RwLock<Vec<SharedMemory>>,
    best_practices: RwLock<Vec<BestPractice>>,
    team_patterns: RwLock<Vec<TeamPattern>>,
    sync_state: RwLock<SyncState>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TeamConfig {
    pub team_id: String,
    pub team_name: String,
    pub sync_url: Option<String>,
    pub auto_sync: bool,
    pub sync_interval_minutes: u32,
    pub share_corrections: bool,
    pub share_patterns: bool,
    pub share_preferences: bool,
}

impl Default for TeamConfig {
    fn default() -> Self {
        Self {
            team_id: String::new(),
            team_name: String::new(),
            sync_url: None,
            auto_sync: false,
            sync_interval_minutes: 60,
            share_corrections: true,
            share_patterns: true,
            share_preferences: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SharedMemory {
    pub id: String,
    pub title: String,
    pub content: String,
    pub category: MemoryCategory,
    pub author: String,
    pub votes: i32,
    pub usage_count: u32,
    pub created_at: u64,
    pub updated_at: u64,
    pub tags: Vec<String>,
    pub file_patterns: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MemoryCategory {
    CodingStandard,
    Architecture,
    Security,
    Performance,
    Testing,
    Documentation,
    Workflow,
    Custom(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BestPractice {
    pub id: String,
    pub title: String,
    pub description: String,
    pub good_example: String,
    pub bad_example: Option<String>,
    pub rationale: String,
    pub category: String,
    pub severity: Severity,
    pub auto_detect: bool,
    pub detection_pattern: Option<String>,
    pub votes: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Severity {
    Info,
    Warning,
    Error,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TeamPattern {
    pub id: String,
    pub name: String,
    pub description: String,
    pub pattern_type: PatternType,
    pub example: String,
    pub frequency: u32,
    pub contributors: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PatternType {
    Naming,
    Structure,
    ErrorHandling,
    Testing,
    Api,
    Component,
    Other,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
struct SyncState {
    last_sync: Option<u64>,
    pending_uploads: Vec<String>,
    pending_downloads: Vec<String>,
    sync_errors: Vec<String>,
}

impl TeamKnowledge {
    pub fn new(config: TeamConfig) -> Self {
        Self {
            config,
            shared_memories: RwLock::new(Vec::new()),
            best_practices: RwLock::new(Vec::new()),
            team_patterns: RwLock::new(Vec::new()),
            sync_state: RwLock::new(SyncState::default()),
        }
    }

    /// Add a shared memory
    pub fn add_memory(&self, memory: SharedMemory) {
        self.shared_memories.write().push(memory);
    }

    /// Add a best practice
    pub fn add_best_practice(&self, practice: BestPractice) {
        self.best_practices.write().push(practice);
    }

    /// Add a team pattern
    pub fn add_pattern(&self, pattern: TeamPattern) {
        self.team_patterns.write().push(pattern);
    }

    /// Vote on a memory
    pub fn vote_memory(&self, memory_id: &str, upvote: bool) {
        let mut memories = self.shared_memories.write();
        if let Some(memory) = memories.iter_mut().find(|m| m.id == memory_id) {
            memory.votes += if upvote { 1 } else { -1 };
        }
    }

    /// Get memories relevant to current context
    pub fn get_relevant_memories(&self, file_path: Option<&Path>, tags: &[String]) -> Vec<SharedMemory> {
        let memories = self.shared_memories.read();
        
        memories.iter()
            .filter(|m| {
                // Match by file pattern
                if let Some(path) = file_path {
                    let path_str = path.to_string_lossy();
                    if m.file_patterns.iter().any(|p| {
                        glob::Pattern::new(p).map(|pat| pat.matches(&path_str)).unwrap_or(false)
                    }) {
                        return true;
                    }
                }
                
                // Match by tags
                if !tags.is_empty() && m.tags.iter().any(|t| tags.contains(t)) {
                    return true;
                }

                false
            })
            .cloned()
            .collect()
    }

    /// Get best practices for a category
    pub fn get_best_practices(&self, category: Option<&str>) -> Vec<BestPractice> {
        let practices = self.best_practices.read();
        
        match category {
            Some(cat) => practices.iter()
                .filter(|p| p.category.eq_ignore_ascii_case(cat))
                .cloned()
                .collect(),
            None => practices.clone(),
        }
    }

    /// Format team knowledge for LLM prompt
    pub fn format_for_prompt(&self, file_path: Option<&Path>) -> String {
        let mut output = String::from("## Team Knowledge & Standards\n\n");

        // Add relevant memories
        let relevant = self.get_relevant_memories(file_path, &[]);
        if !relevant.is_empty() {
            output.push_str("### Team Guidelines\n\n");
            for memory in relevant.iter().take(3) {
                output.push_str(&format!("**{}**\n{}\n\n", memory.title, memory.content));
            }
        }

        // Add top-voted best practices
        let practices = self.best_practices.read();
        let top_practices: Vec<_> = practices.iter()
            .filter(|p| p.votes > 0)
            .take(3)
            .collect();

        if !top_practices.is_empty() {
            output.push_str("### Best Practices\n\n");
            for practice in top_practices {
                output.push_str(&format!("- **{}**: {}\n", practice.title, practice.description));
            }
            output.push('\n');
        }

        output
    }

    /// Sync with remote server
    pub async fn sync(&self) -> Result<SyncResult, String> {
        let sync_url = self.config.sync_url.as_ref()
            .ok_or("No sync URL configured")?;

        // In a full implementation, this would:
        // 1. Upload pending local changes
        // 2. Download remote changes
        // 3. Merge conflicts
        // 4. Update sync state

        let mut state = self.sync_state.write();
        state.last_sync = Some(self.now());
        state.pending_uploads.clear();
        state.pending_downloads.clear();

        Ok(SyncResult {
            uploaded: 0,
            downloaded: 0,
            conflicts: 0,
        })
    }

    /// Export team knowledge to file
    pub async fn export(&self, path: &Path) -> Result<(), String> {
        let data = TeamKnowledgeExport {
            config: self.config.clone(),
            memories: self.shared_memories.read().clone(),
            practices: self.best_practices.read().clone(),
            patterns: self.team_patterns.read().clone(),
            exported_at: self.now(),
        };

        let json = serde_json::to_string_pretty(&data)
            .map_err(|e| format!("Serialization error: {}", e))?;

        tokio::fs::write(path, json).await
            .map_err(|e| format!("Write error: {}", e))
    }

    /// Import team knowledge from file
    pub async fn import(&self, path: &Path) -> Result<ImportResult, String> {
        let json = tokio::fs::read_to_string(path).await
            .map_err(|e| format!("Read error: {}", e))?;

        let data: TeamKnowledgeExport = serde_json::from_str(&json)
            .map_err(|e| format!("Parse error: {}", e))?;

        let mut memories = self.shared_memories.write();
        let mut practices = self.best_practices.write();
        let mut patterns = self.team_patterns.write();

        let mut imported = ImportResult::default();

        for memory in data.memories {
            if !memories.iter().any(|m| m.id == memory.id) {
                memories.push(memory);
                imported.memories += 1;
            }
        }

        for practice in data.practices {
            if !practices.iter().any(|p| p.id == practice.id) {
                practices.push(practice);
                imported.practices += 1;
            }
        }

        for pattern in data.patterns {
            if !patterns.iter().any(|p| p.id == pattern.id) {
                patterns.push(pattern);
                imported.patterns += 1;
            }
        }

        Ok(imported)
    }

    fn now(&self) -> u64 {
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs()
    }

    pub fn memory_count(&self) -> usize {
        self.shared_memories.read().len()
    }

    pub fn practice_count(&self) -> usize {
        self.best_practices.read().len()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct TeamKnowledgeExport {
    config: TeamConfig,
    memories: Vec<SharedMemory>,
    practices: Vec<BestPractice>,
    patterns: Vec<TeamPattern>,
    exported_at: u64,
}

#[derive(Debug, Clone, Default)]
pub struct SyncResult {
    pub uploaded: usize,
    pub downloaded: usize,
    pub conflicts: usize,
}

#[derive(Debug, Clone, Default)]
pub struct ImportResult {
    pub memories: usize,
    pub practices: usize,
    pub patterns: usize,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_team_knowledge_creation() {
        let tk = TeamKnowledge::new(TeamConfig::default());
        assert_eq!(tk.memory_count(), 0);
    }

    #[test]
    fn test_add_memory() {
        let tk = TeamKnowledge::new(TeamConfig::default());
        
        tk.add_memory(SharedMemory {
            id: "test1".to_string(),
            title: "Test Memory".to_string(),
            content: "Test content".to_string(),
            category: MemoryCategory::CodingStandard,
            author: "test".to_string(),
            votes: 0,
            usage_count: 0,
            created_at: 0,
            updated_at: 0,
            tags: vec!["test".to_string()],
            file_patterns: vec![],
        });

        assert_eq!(tk.memory_count(), 1);
    }

    #[test]
    fn test_voting() {
        let tk = TeamKnowledge::new(TeamConfig::default());
        
        tk.add_memory(SharedMemory {
            id: "test1".to_string(),
            title: "Test".to_string(),
            content: "Content".to_string(),
            category: MemoryCategory::CodingStandard,
            author: "test".to_string(),
            votes: 0,
            usage_count: 0,
            created_at: 0,
            updated_at: 0,
            tags: vec![],
            file_patterns: vec![],
        });

        tk.vote_memory("test1", true);
        tk.vote_memory("test1", true);
        tk.vote_memory("test1", false);

        let memories = tk.shared_memories.read();
        assert_eq!(memories[0].votes, 1);
    }
}
