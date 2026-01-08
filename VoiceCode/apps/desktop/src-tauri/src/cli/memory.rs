// Memory System - Hierarchical persistent context management
// Inspired by Claude Code's CLAUDE.md, Codex's AGENTS.md, and Manus's file-based memory
// Provides zero-hallucination context through validated, persistent memories

use globset::{Glob, GlobSet, GlobSetBuilder};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};
use tokio::fs;

/// Memory file configuration
pub const MEMORY_FILE_NAME: &str = "VOICECODE.md";
pub const LOCAL_MEMORY_FILE_NAME: &str = "VOICECODE.local.md";
pub const MEMORY_DIR: &str = ".voicecode";
pub const RULES_DIR: &str = "rules";
pub const AGENTS_DIR: &str = "agents";
pub const MEMORIES_DIR: &str = "memories";

/// Maximum depth for @import resolution
pub const MAX_IMPORT_DEPTH: usize = 5;
/// Maximum bytes for memory files
pub const MAX_MEMORY_BYTES: usize = 32768; // 32 KiB

/// Hierarchical memory system
#[derive(Debug, Clone)]
pub struct MemorySystem {
    /// Enterprise-level policies (system-wide)
    enterprise_memory: Option<MemoryFile>,
    /// User-level preferences (~/.voicecode/)
    user_memory: Option<MemoryFile>,
    /// Project-level context (./.voicecode/)
    project_memory: Option<MemoryFile>,
    /// Local overrides (.voicecode/VOICECODE.local.md)
    local_memory: Option<MemoryFile>,
    /// Path-specific rules with glob patterns
    rules: Vec<PathRule>,
    /// Auto-generated memories (patterns, corrections, preferences)
    auto_memories: HashMap<AutoMemoryType, AutoMemory>,
    /// Current working directory
    working_dir: PathBuf,
}

/// A memory file with content and imports
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryFile {
    pub path: PathBuf,
    pub content: String,
    pub imports: Vec<Import>,
    pub last_modified: u64,
    pub scope: MemoryScope,
}

/// Memory scope levels
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum MemoryScope {
    Enterprise,
    User,
    Project,
    Local,
}

/// An import reference from a memory file
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Import {
    pub path: PathBuf,
    pub resolved_content: Option<String>,
    pub depth: usize,
}

/// Path-specific rule with glob patterns
#[derive(Debug, Clone)]
pub struct PathRule {
    pub source_file: PathBuf,
    pub glob_patterns: Vec<String>,
    pub content: String,
    pub compiled_globs: Option<GlobSet>,
}

/// Auto-generated memory types
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AutoMemoryType {
    /// Coding patterns learned from user
    Patterns,
    /// Corrections made by user
    Corrections,
    /// Inferred preferences
    Preferences,
    /// Frequently accessed files/symbols
    Hotspots,
    /// Error patterns to avoid
    ErrorPatterns,
}

/// Auto-generated memory entries
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutoMemory {
    pub memory_type: AutoMemoryType,
    pub entries: Vec<AutoMemoryEntry>,
    pub updated_at: u64,
}

/// Single auto-memory entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutoMemoryEntry {
    pub key: String,
    pub value: String,
    pub frequency: u32,
    pub last_used: u64,
    pub confidence: f32,
}

/// Result of memory loading
#[derive(Debug)]
pub struct LoadResult {
    pub memory_system: MemorySystem,
    pub warnings: Vec<String>,
    pub errors: Vec<String>,
}

impl MemorySystem {
    /// Create a new memory system
    pub fn new(working_dir: PathBuf) -> Self {
        Self {
            enterprise_memory: None,
            user_memory: None,
            project_memory: None,
            local_memory: None,
            rules: Vec::new(),
            auto_memories: HashMap::new(),
            working_dir,
        }
    }

    /// Load all memories for the current context
    pub async fn load(working_dir: &Path) -> LoadResult {
        let mut system = MemorySystem::new(working_dir.to_path_buf());
        let mut warnings = Vec::new();
        let mut errors = Vec::new();

        // 1. Load enterprise memory (if exists)
        if let Some(enterprise_path) = Self::get_enterprise_path() {
            match Self::load_memory_file(&enterprise_path, MemoryScope::Enterprise, 0).await {
                Ok(memory) => system.enterprise_memory = Some(memory),
                Err(e) => warnings.push(format!("Enterprise memory: {}", e)),
            }
        }

        // 2. Load user memory (~/.voicecode/VOICECODE.md)
        if let Some(user_dir) = dirs::home_dir() {
            let user_path = user_dir.join(MEMORY_DIR).join(MEMORY_FILE_NAME);
            match Self::load_memory_file(&user_path, MemoryScope::User, 0).await {
                Ok(memory) => system.user_memory = Some(memory),
                Err(e) => warnings.push(format!("User memory: {}", e)),
            }
        }

        // 3. Load project memory (walk up from working_dir to find .voicecode/)
        let project_paths = Self::find_project_memories(working_dir);
        for project_path in project_paths {
            match Self::load_memory_file(&project_path, MemoryScope::Project, 0).await {
                Ok(memory) => {
                    // Merge with existing project memory
                    if let Some(existing) = &mut system.project_memory {
                        existing.content.push_str("\n\n");
                        existing.content.push_str(&memory.content);
                        existing.imports.extend(memory.imports);
                    } else {
                        system.project_memory = Some(memory);
                    }
                }
                Err(e) => warnings.push(format!("Project memory at {:?}: {}", project_path, e)),
            }
        }

        // 4. Load local memory (.voicecode/VOICECODE.local.md)
        let local_path = working_dir.join(MEMORY_DIR).join(LOCAL_MEMORY_FILE_NAME);
        match Self::load_memory_file(&local_path, MemoryScope::Local, 0).await {
            Ok(memory) => system.local_memory = Some(memory),
            Err(_) => {} // Local memory is optional
        }

        // 5. Load path-specific rules
        match system.load_rules(working_dir).await {
            Ok(rules) => system.rules = rules,
            Err(e) => errors.push(format!("Rules loading: {}", e)),
        }

        // 6. Load auto-memories
        match system.load_auto_memories(working_dir).await {
            Ok(memories) => system.auto_memories = memories,
            Err(e) => warnings.push(format!("Auto-memories: {}", e)),
        }

        LoadResult {
            memory_system: system,
            warnings,
            errors,
        }
    }

    /// Get enterprise memory path based on OS
    fn get_enterprise_path() -> Option<PathBuf> {
        #[cfg(target_os = "macos")]
        {
            let path =
                PathBuf::from("/Library/Application Support/VoiceCode").join(MEMORY_FILE_NAME);
            if path.exists() {
                Some(path)
            } else {
                None
            }
        }
        #[cfg(target_os = "linux")]
        {
            let path = PathBuf::from("/etc/voicecode").join(MEMORY_FILE_NAME);
            if path.exists() {
                Some(path)
            } else {
                None
            }
        }
        #[cfg(target_os = "windows")]
        {
            let path = PathBuf::from(r"C:\Program Files\VoiceCode").join(MEMORY_FILE_NAME);
            if path.exists() {
                Some(path)
            } else {
                None
            }
        }
        #[cfg(not(any(target_os = "macos", target_os = "linux", target_os = "windows")))]
        {
            None
        }
    }

    /// Find project memory files by walking up the directory tree
    fn find_project_memories(start_dir: &Path) -> Vec<PathBuf> {
        let mut memories = Vec::new();
        let mut current = start_dir.to_path_buf();

        loop {
            let memory_path = current.join(MEMORY_DIR).join(MEMORY_FILE_NAME);
            if memory_path.exists() {
                memories.push(memory_path);
            }

            // Also check for VOICECODE.md in the directory root
            let alt_path = current.join(MEMORY_FILE_NAME);
            if alt_path.exists() && !memories.contains(&alt_path) {
                memories.push(alt_path);
            }

            if !current.pop() {
                break;
            }
        }

        // Reverse so root memories come first (lower priority)
        memories.reverse();
        memories
    }

    /// Load a single memory file with import resolution
    async fn load_memory_file(
        path: &Path,
        scope: MemoryScope,
        depth: usize,
    ) -> Result<MemoryFile, String> {
        if depth > MAX_IMPORT_DEPTH {
            return Err(format!(
                "Import depth exceeded {} at {:?}",
                MAX_IMPORT_DEPTH, path
            ));
        }

        let content = fs::read_to_string(path)
            .await
            .map_err(|e| format!("Failed to read {:?}: {}", path, e))?;

        if content.is_empty() {
            return Err("Memory file is empty".to_string());
        }

        if content.len() > MAX_MEMORY_BYTES {
            return Err(format!("Memory file exceeds {} bytes", MAX_MEMORY_BYTES));
        }

        let metadata = fs::metadata(path)
            .await
            .map_err(|e| format!("Failed to get metadata: {}", e))?;

        let last_modified = metadata
            .modified()
            .ok()
            .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
            .map(|d| d.as_secs())
            .unwrap_or(0);

        // Parse @imports
        let imports =
            Self::parse_imports(&content, path.parent().unwrap_or(Path::new(".")), depth).await;

        Ok(MemoryFile {
            path: path.to_path_buf(),
            content,
            imports,
            last_modified,
            scope,
        })
    }

    /// Parse @import references from content
    async fn parse_imports(content: &str, base_dir: &Path, depth: usize) -> Vec<Import> {
        let mut imports = Vec::new();
        let import_regex = regex::Regex::new(r"@([\w./\-_]+)").unwrap();

        for cap in import_regex.captures_iter(content) {
            let import_path_str = cap.get(1).unwrap().as_str();
            let import_path = base_dir.join(import_path_str);

            let resolved_content = if import_path.exists() && depth < MAX_IMPORT_DEPTH {
                fs::read_to_string(&import_path).await.ok()
            } else {
                None
            };

            imports.push(Import {
                path: import_path,
                resolved_content,
                depth: depth + 1,
            });
        }

        imports
    }

    /// Load path-specific rules
    async fn load_rules(&self, working_dir: &Path) -> Result<Vec<PathRule>, String> {
        let mut rules = Vec::new();

        // Load from project rules directory
        let rules_dir = working_dir.join(MEMORY_DIR).join(RULES_DIR);
        if rules_dir.exists() {
            let mut entries = fs::read_dir(&rules_dir)
                .await
                .map_err(|e| format!("Failed to read rules dir: {}", e))?;

            while let Some(entry) = entries.next_entry().await.map_err(|e| e.to_string())? {
                let path = entry.path();
                if path.extension().map(|e| e == "md").unwrap_or(false) {
                    if let Ok(rule) = Self::load_rule(&path).await {
                        rules.push(rule);
                    }
                }
            }
        }

        // Also load from user rules directory
        if let Some(user_dir) = dirs::home_dir() {
            let user_rules_dir = user_dir.join(MEMORY_DIR).join(RULES_DIR);
            if user_rules_dir.exists() {
                let mut entries = fs::read_dir(&user_rules_dir)
                    .await
                    .map_err(|e| format!("Failed to read user rules: {}", e))?;

                while let Some(entry) = entries.next_entry().await.map_err(|e| e.to_string())? {
                    let path = entry.path();
                    if path.extension().map(|e| e == "md").unwrap_or(false) {
                        if let Ok(rule) = Self::load_rule(&path).await {
                            rules.push(rule);
                        }
                    }
                }
            }
        }

        Ok(rules)
    }

    /// Load a single rule file with YAML frontmatter
    async fn load_rule(path: &Path) -> Result<PathRule, String> {
        let content = fs::read_to_string(path)
            .await
            .map_err(|e| format!("Failed to read rule {:?}: {}", path, e))?;

        let (frontmatter, body) = Self::parse_frontmatter(&content);

        // Extract paths from frontmatter
        let glob_patterns: Vec<String> = frontmatter
            .get("paths")
            .and_then(|v| v.as_sequence())
            .map(|seq| {
                seq.iter()
                    .filter_map(|v| v.as_str().map(String::from))
                    .collect()
            })
            .unwrap_or_default();

        // Compile globs
        let compiled_globs = if !glob_patterns.is_empty() {
            let mut builder = GlobSetBuilder::new();
            for pattern in &glob_patterns {
                if let Ok(glob) = Glob::new(pattern) {
                    builder.add(glob);
                }
            }
            builder.build().ok()
        } else {
            None
        };

        Ok(PathRule {
            source_file: path.to_path_buf(),
            glob_patterns,
            content: body,
            compiled_globs,
        })
    }

    /// Parse YAML frontmatter from markdown
    fn parse_frontmatter(content: &str) -> (serde_yaml::Value, String) {
        if content.starts_with("---") {
            if let Some(end) = content[3..].find("---") {
                let frontmatter_str = &content[3..3 + end];
                let body = &content[6 + end..];

                if let Ok(frontmatter) = serde_yaml::from_str(frontmatter_str) {
                    return (frontmatter, body.trim().to_string());
                }
            }
        }

        (serde_yaml::Value::Null, content.to_string())
    }

    /// Load auto-generated memories
    async fn load_auto_memories(
        &self,
        working_dir: &Path,
    ) -> Result<HashMap<AutoMemoryType, AutoMemory>, String> {
        let mut memories = HashMap::new();

        let memories_dir = working_dir.join(MEMORY_DIR).join(MEMORIES_DIR);
        if !memories_dir.exists() {
            return Ok(memories);
        }

        for memory_type in [
            AutoMemoryType::Patterns,
            AutoMemoryType::Corrections,
            AutoMemoryType::Preferences,
            AutoMemoryType::Hotspots,
            AutoMemoryType::ErrorPatterns,
        ] {
            let filename = match memory_type {
                AutoMemoryType::Patterns => "patterns.json",
                AutoMemoryType::Corrections => "corrections.json",
                AutoMemoryType::Preferences => "preferences.json",
                AutoMemoryType::Hotspots => "hotspots.json",
                AutoMemoryType::ErrorPatterns => "error_patterns.json",
            };

            let path = memories_dir.join(filename);
            if path.exists() {
                if let Ok(content) = fs::read_to_string(&path).await {
                    if let Ok(memory) = serde_json::from_str::<AutoMemory>(&content) {
                        memories.insert(memory_type, memory);
                    }
                }
            }
        }

        Ok(memories)
    }

    /// Build the complete system prompt from all memories
    pub fn build_system_prompt(&self, current_file: Option<&Path>) -> String {
        let mut prompt = String::new();

        // Add scope labels for clarity
        if let Some(enterprise) = &self.enterprise_memory {
            prompt.push_str("# Enterprise Guidelines\n\n");
            prompt.push_str(&self.expand_imports(&enterprise.content, &enterprise.imports));
            prompt.push_str("\n\n");
        }

        if let Some(user) = &self.user_memory {
            prompt.push_str("# User Preferences\n\n");
            prompt.push_str(&self.expand_imports(&user.content, &user.imports));
            prompt.push_str("\n\n");
        }

        if let Some(project) = &self.project_memory {
            prompt.push_str("# Project Context\n\n");
            prompt.push_str(&self.expand_imports(&project.content, &project.imports));
            prompt.push_str("\n\n");
        }

        if let Some(local) = &self.local_memory {
            prompt.push_str("# Local Overrides\n\n");
            prompt.push_str(&self.expand_imports(&local.content, &local.imports));
            prompt.push_str("\n\n");
        }

        // Add applicable path-specific rules
        if let Some(file_path) = current_file {
            let applicable_rules = self.get_applicable_rules(file_path);
            if !applicable_rules.is_empty() {
                prompt.push_str("# Path-Specific Rules\n\n");
                for rule in applicable_rules {
                    prompt.push_str(&rule.content);
                    prompt.push_str("\n\n");
                }
            }
        }

        // Add relevant auto-memories
        let auto_context = self.build_auto_memory_context();
        if !auto_context.is_empty() {
            prompt.push_str("# Learned Patterns\n\n");
            prompt.push_str(&auto_context);
        }

        prompt
    }

    /// Expand @import references in content
    fn expand_imports(&self, content: &str, imports: &[Import]) -> String {
        let mut expanded = content.to_string();

        for import in imports {
            if let Some(ref resolved) = import.resolved_content {
                let pattern = format!("@{}", import.path.display());
                expanded = expanded.replace(&pattern, resolved);
            }
        }

        expanded
    }

    /// Get rules applicable to the given file path
    fn get_applicable_rules(&self, file_path: &Path) -> Vec<&PathRule> {
        self.rules
            .iter()
            .filter(|rule| {
                if let Some(ref globs) = rule.compiled_globs {
                    globs.is_match(file_path)
                } else {
                    // No glob patterns = applies to all
                    rule.glob_patterns.is_empty()
                }
            })
            .collect()
    }

    /// Build context string from auto-memories
    fn build_auto_memory_context(&self) -> String {
        let mut context = String::new();

        if let Some(patterns) = self.auto_memories.get(&AutoMemoryType::Patterns) {
            if !patterns.entries.is_empty() {
                context.push_str("## Coding Patterns\n");
                for entry in patterns.entries.iter().take(10) {
                    if entry.confidence > 0.7 {
                        context.push_str(&format!("- {}: {}\n", entry.key, entry.value));
                    }
                }
                context.push('\n');
            }
        }

        if let Some(corrections) = self.auto_memories.get(&AutoMemoryType::Corrections) {
            if !corrections.entries.is_empty() {
                context.push_str("## User Corrections\n");
                for entry in corrections.entries.iter().take(5) {
                    context.push_str(&format!("- Prefer: {} over {}\n", entry.value, entry.key));
                }
                context.push('\n');
            }
        }

        if let Some(error_patterns) = self.auto_memories.get(&AutoMemoryType::ErrorPatterns) {
            if !error_patterns.entries.is_empty() {
                context.push_str("## Patterns to Avoid\n");
                for entry in error_patterns.entries.iter().take(5) {
                    context.push_str(&format!("- Avoid: {}\n", entry.key));
                }
                context.push('\n');
            }
        }

        context
    }

    /// Record an interaction for auto-memory learning
    pub async fn record_interaction(&mut self, interaction: &Interaction) {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        match interaction {
            Interaction::Correction {
                original,
                corrected,
                context,
            } => {
                self.record_correction(original, corrected, context, now);
            }
            Interaction::CodeGenerated {
                code,
                language,
                pattern,
            } => {
                self.record_pattern(pattern, code, language, now);
            }
            Interaction::FileAccess { path } => {
                self.record_hotspot(path, now);
            }
            Interaction::ErrorEncountered { error, resolution } => {
                self.record_error_pattern(error, resolution, now);
            }
        }
    }

    fn record_correction(&mut self, original: &str, corrected: &str, _context: &str, now: u64) {
        let memory = self
            .auto_memories
            .entry(AutoMemoryType::Corrections)
            .or_insert_with(|| AutoMemory {
                memory_type: AutoMemoryType::Corrections,
                entries: Vec::new(),
                updated_at: now,
            });

        // Check if we already have this correction
        if let Some(entry) = memory.entries.iter_mut().find(|e| e.key == original) {
            entry.frequency += 1;
            entry.last_used = now;
            entry.confidence = (entry.confidence * 0.9 + 0.1).min(1.0);
        } else {
            memory.entries.push(AutoMemoryEntry {
                key: original.to_string(),
                value: corrected.to_string(),
                frequency: 1,
                last_used: now,
                confidence: 0.5,
            });
        }

        memory.updated_at = now;
    }

    fn record_pattern(&mut self, pattern: &str, _code: &str, _language: &str, now: u64) {
        let memory = self
            .auto_memories
            .entry(AutoMemoryType::Patterns)
            .or_insert_with(|| AutoMemory {
                memory_type: AutoMemoryType::Patterns,
                entries: Vec::new(),
                updated_at: now,
            });

        if let Some(entry) = memory.entries.iter_mut().find(|e| e.key == pattern) {
            entry.frequency += 1;
            entry.last_used = now;
        } else {
            memory.entries.push(AutoMemoryEntry {
                key: pattern.to_string(),
                value: "observed".to_string(),
                frequency: 1,
                last_used: now,
                confidence: 0.5,
            });
        }

        memory.updated_at = now;
    }

    fn record_hotspot(&mut self, path: &Path, now: u64) {
        let memory = self
            .auto_memories
            .entry(AutoMemoryType::Hotspots)
            .or_insert_with(|| AutoMemory {
                memory_type: AutoMemoryType::Hotspots,
                entries: Vec::new(),
                updated_at: now,
            });

        let path_str = path.to_string_lossy().to_string();
        if let Some(entry) = memory.entries.iter_mut().find(|e| e.key == path_str) {
            entry.frequency += 1;
            entry.last_used = now;
        } else {
            memory.entries.push(AutoMemoryEntry {
                key: path_str,
                value: "accessed".to_string(),
                frequency: 1,
                last_used: now,
                confidence: 0.5,
            });
        }

        memory.updated_at = now;
    }

    fn record_error_pattern(&mut self, error: &str, resolution: &str, now: u64) {
        let memory = self
            .auto_memories
            .entry(AutoMemoryType::ErrorPatterns)
            .or_insert_with(|| AutoMemory {
                memory_type: AutoMemoryType::ErrorPatterns,
                entries: Vec::new(),
                updated_at: now,
            });

        memory.entries.push(AutoMemoryEntry {
            key: error.to_string(),
            value: resolution.to_string(),
            frequency: 1,
            last_used: now,
            confidence: 0.7,
        });

        memory.updated_at = now;
    }

    /// Save auto-memories to disk
    pub async fn save_auto_memories(&self, working_dir: &Path) -> Result<(), String> {
        let memories_dir = working_dir.join(MEMORY_DIR).join(MEMORIES_DIR);
        fs::create_dir_all(&memories_dir)
            .await
            .map_err(|e| format!("Failed to create memories dir: {}", e))?;

        for (memory_type, memory) in &self.auto_memories {
            let filename = match memory_type {
                AutoMemoryType::Patterns => "patterns.json",
                AutoMemoryType::Corrections => "corrections.json",
                AutoMemoryType::Preferences => "preferences.json",
                AutoMemoryType::Hotspots => "hotspots.json",
                AutoMemoryType::ErrorPatterns => "error_patterns.json",
            };

            let path = memories_dir.join(filename);
            let content = serde_json::to_string_pretty(memory)
                .map_err(|e| format!("Failed to serialize memory: {}", e))?;

            fs::write(&path, content)
                .await
                .map_err(|e| format!("Failed to write memory: {}", e))?;
        }

        Ok(())
    }

    /// Get the working directory
    pub fn working_dir(&self) -> &Path {
        &self.working_dir
    }
}

/// Interaction types for learning
#[derive(Debug, Clone)]
pub enum Interaction {
    /// User corrected AI output
    Correction {
        original: String,
        corrected: String,
        context: String,
    },
    /// Code was generated successfully
    CodeGenerated {
        code: String,
        language: String,
        pattern: String,
    },
    /// File was accessed
    FileAccess { path: PathBuf },
    /// Error was encountered and resolved
    ErrorEncountered { error: String, resolution: String },
}

/// Initialize memory directory structure
pub async fn initialize_memory_dir(path: &Path) -> Result<(), String> {
    let memory_dir = path.join(MEMORY_DIR);
    fs::create_dir_all(&memory_dir)
        .await
        .map_err(|e| format!("Failed to create memory dir: {}", e))?;

    // Create subdirectories
    fs::create_dir_all(memory_dir.join(RULES_DIR))
        .await
        .map_err(|e| format!("Failed to create rules dir: {}", e))?;
    fs::create_dir_all(memory_dir.join(AGENTS_DIR))
        .await
        .map_err(|e| format!("Failed to create agents dir: {}", e))?;
    fs::create_dir_all(memory_dir.join(MEMORIES_DIR))
        .await
        .map_err(|e| format!("Failed to create memories dir: {}", e))?;

    // Create default VOICECODE.md if not exists
    let memory_file = memory_dir.join(MEMORY_FILE_NAME);
    if !memory_file.exists() {
        let default_content = r#"# VoiceCode Project Context

## Project Overview
<!-- Describe your project here -->

## Code Style
<!-- Define your coding conventions -->
- Use 2-space indentation
- Prefer explicit type annotations
- Write descriptive variable names

## Architecture
<!-- Describe your architecture patterns -->

## Testing
<!-- Testing guidelines -->

## Dependencies
<!-- Key dependencies and their usage -->

## Custom Commands
<!-- Define project-specific voice commands -->
"#;
        fs::write(&memory_file, default_content)
            .await
            .map_err(|e| format!("Failed to create default memory file: {}", e))?;
    }

    // Add VOICECODE.local.md to .gitignore
    let gitignore_path = memory_dir.join(".gitignore");
    if !gitignore_path.exists() {
        fs::write(&gitignore_path, format!("{}\n", LOCAL_MEMORY_FILE_NAME))
            .await
            .map_err(|e| format!("Failed to create .gitignore: {}", e))?;
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_frontmatter() {
        let content = r#"---
paths:
  - "src/**/*.rs"
  - "tests/*.rs"
---

# Rust Rules

Use proper error handling.
"#;

        let (frontmatter, body) = MemorySystem::parse_frontmatter(content);
        assert!(frontmatter.get("paths").is_some());
        assert!(body.contains("Rust Rules"));
    }

    #[test]
    fn test_new_memory_system() {
        let system = MemorySystem::new(PathBuf::from("/test"));
        assert!(system.enterprise_memory.is_none());
        assert!(system.user_memory.is_none());
        assert!(system.rules.is_empty());
    }
}
