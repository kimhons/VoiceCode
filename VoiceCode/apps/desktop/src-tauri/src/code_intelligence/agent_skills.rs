#![allow(dead_code, unused_variables, unused_imports)]
// Agent Skills System - Reusable instruction bundles (YAML-based)
// Codex-style skills that can be triggered by voice or text

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use serde::{Deserialize, Serialize};
use parking_lot::RwLock;

/// Agent skills manager
pub struct SkillsManager {
    skills: RwLock<HashMap<String, Skill>>,
    skills_dir: PathBuf,
    trigger_index: RwLock<HashMap<String, Vec<String>>>,
}

/// A skill definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Skill {
    pub name: String,
    pub description: Option<String>,
    pub triggers: Vec<String>,
    pub model: Option<String>,
    pub temperature: Option<f32>,
    pub instructions: String,
    pub examples: Vec<SkillExample>,
    pub constraints: Vec<String>,
    pub file_patterns: Vec<String>,
    pub tags: Vec<String>,
    pub priority: u32,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillExample {
    pub input: String,
    pub output: String,
}

/// Result of skill matching
#[derive(Debug, Clone)]
pub struct SkillMatch {
    pub skill: Skill,
    pub trigger: String,
    pub confidence: f32,
}

impl SkillsManager {
    pub fn new(skills_dir: PathBuf) -> Self {
        Self {
            skills: RwLock::new(HashMap::new()),
            skills_dir,
            trigger_index: RwLock::new(HashMap::new()),
        }
    }

    /// Load skills from directory
    pub async fn load_skills(&self) -> Result<usize, String> {
        let mut count = 0;
        
        if !self.skills_dir.exists() {
            return Ok(0);
        }

        let entries = std::fs::read_dir(&self.skills_dir)
            .map_err(|e| format!("Failed to read skills directory: {}", e))?;

        for entry in entries.filter_map(|e| e.ok()) {
            let path = entry.path();
            if path.extension().map(|e| e == "md" || e == "yaml" || e == "yml").unwrap_or(false) {
                if let Ok(skill) = self.parse_skill_file(&path).await {
                    self.register_skill(skill);
                    count += 1;
                }
            }
        }

        Ok(count)
    }

    async fn parse_skill_file(&self, path: &Path) -> Result<Skill, String> {
        let content = tokio::fs::read_to_string(path).await
            .map_err(|e| format!("Failed to read skill file: {}", e))?;

        // Check for YAML frontmatter
        if content.starts_with("---") {
            self.parse_frontmatter_skill(&content)
        } else if path.extension().map(|e| e == "yaml" || e == "yml").unwrap_or(false) {
            self.parse_yaml_skill(&content)
        } else {
            Err("Unknown skill format".to_string())
        }
    }

    fn parse_frontmatter_skill(&self, content: &str) -> Result<Skill, String> {
        // Split frontmatter from content
        let parts: Vec<&str> = content.splitn(3, "---").collect();
        if parts.len() < 3 {
            return Err("Invalid frontmatter format".to_string());
        }

        let frontmatter = parts[1].trim();
        let instructions = parts[2].trim();

        // Parse YAML frontmatter
        let mut skill = self.parse_yaml_skill(frontmatter)?;
        skill.instructions = instructions.to_string();

        Ok(skill)
    }

    fn parse_yaml_skill(&self, yaml: &str) -> Result<Skill, String> {
        // Simple YAML parser for skill definitions
        let mut skill = Skill {
            name: String::new(),
            description: None,
            triggers: Vec::new(),
            model: None,
            temperature: None,
            instructions: String::new(),
            examples: Vec::new(),
            constraints: Vec::new(),
            file_patterns: Vec::new(),
            tags: Vec::new(),
            priority: 50,
            enabled: true,
        };

        for line in yaml.lines() {
            let line = line.trim();
            if line.is_empty() || line.starts_with('#') {
                continue;
            }

            if let Some((key, value)) = line.split_once(':') {
                let key = key.trim();
                let value = value.trim().trim_matches('"').trim_matches('\'');

                match key {
                    "name" => skill.name = value.to_string(),
                    "description" => skill.description = Some(value.to_string()),
                    "model" => skill.model = Some(value.to_string()),
                    "temperature" => skill.temperature = value.parse().ok(),
                    "priority" => skill.priority = value.parse().unwrap_or(50),
                    "enabled" => skill.enabled = value.parse().unwrap_or(true),
                    "triggers" => {
                        // Parse array format: [item1, item2]
                        let arr = value.trim_start_matches('[').trim_end_matches(']');
                        skill.triggers = arr.split(',')
                            .map(|s| s.trim().trim_matches('"').trim_matches('\'').to_string())
                            .filter(|s| !s.is_empty())
                            .collect();
                    }
                    "tags" => {
                        let arr = value.trim_start_matches('[').trim_end_matches(']');
                        skill.tags = arr.split(',')
                            .map(|s| s.trim().trim_matches('"').to_string())
                            .filter(|s| !s.is_empty())
                            .collect();
                    }
                    "file_patterns" => {
                        let arr = value.trim_start_matches('[').trim_end_matches(']');
                        skill.file_patterns = arr.split(',')
                            .map(|s| s.trim().trim_matches('"').to_string())
                            .filter(|s| !s.is_empty())
                            .collect();
                    }
                    "constraints" => {
                        let arr = value.trim_start_matches('[').trim_end_matches(']');
                        skill.constraints = arr.split(',')
                            .map(|s| s.trim().trim_matches('"').to_string())
                            .filter(|s| !s.is_empty())
                            .collect();
                    }
                    _ => {}
                }
            }
        }

        if skill.name.is_empty() {
            return Err("Skill must have a name".to_string());
        }

        Ok(skill)
    }

    /// Register a skill
    pub fn register_skill(&self, skill: Skill) {
        let name = skill.name.clone();
        let triggers = skill.triggers.clone();

        // Update trigger index
        let mut index = self.trigger_index.write();
        for trigger in &triggers {
            index.entry(trigger.to_lowercase())
                .or_insert_with(Vec::new)
                .push(name.clone());
        }

        self.skills.write().insert(name, skill);
    }

    /// Find skills matching input
    pub fn find_matching_skills(&self, input: &str) -> Vec<SkillMatch> {
        let input_lower = input.to_lowercase();
        let input_words: Vec<&str> = input_lower.split_whitespace().collect();
        let mut matches = Vec::new();

        let skills = self.skills.read();
        let index = self.trigger_index.read();

        // Check trigger index
        for (trigger, skill_names) in index.iter() {
            if input_lower.contains(trigger) {
                for skill_name in skill_names {
                    if let Some(skill) = skills.get(skill_name) {
                        if skill.enabled {
                            matches.push(SkillMatch {
                                skill: skill.clone(),
                                trigger: trigger.clone(),
                                confidence: 1.0,
                            });
                        }
                    }
                }
            }
        }

        // Fuzzy matching on skill names and tags
        for skill in skills.values() {
            if !skill.enabled {
                continue;
            }

            // Check if already matched
            if matches.iter().any(|m| m.skill.name == skill.name) {
                continue;
            }

            // Score based on word overlap
            let mut score: f32 = 0.0;
            
            // Check name words
            let name_lower = skill.name.to_lowercase();
            let name_words: Vec<&str> = name_lower.split(&['-', '_', ' '][..]).collect();
            for word in &input_words {
                if name_words.iter().any(|nw| nw.contains(word) || word.contains(nw)) {
                    score += 0.3;
                }
            }

            // Check tags
            for tag in &skill.tags {
                let tag_lower = tag.to_lowercase();
                if input_lower.contains(&tag_lower) {
                    score += 0.2;
                }
            }

            if score >= 0.3 {
                matches.push(SkillMatch {
                    skill: skill.clone(),
                    trigger: String::new(),
                    confidence: score.min(1.0_f32),
                });
            }
        }

        // Sort by confidence and priority
        matches.sort_by(|a, b| {
            let score_cmp = b.confidence.partial_cmp(&a.confidence).unwrap();
            if score_cmp == std::cmp::Ordering::Equal {
                b.skill.priority.cmp(&a.skill.priority)
            } else {
                score_cmp
            }
        });

        matches
    }

    /// Get skill by name
    pub fn get_skill(&self, name: &str) -> Option<Skill> {
        self.skills.read().get(name).cloned()
    }

    /// List all skills
    pub fn list_skills(&self) -> Vec<Skill> {
        self.skills.read().values().cloned().collect()
    }

    /// Format skill for LLM prompt
    pub fn format_skill_prompt(&self, skill: &Skill, context: &str) -> String {
        let mut prompt = String::new();

        if let Some(ref desc) = skill.description {
            prompt.push_str(&format!("## Task: {}\n\n", desc));
        }

        prompt.push_str("## Instructions\n\n");
        prompt.push_str(&skill.instructions);
        prompt.push_str("\n\n");

        if !skill.constraints.is_empty() {
            prompt.push_str("## Constraints\n\n");
            for constraint in &skill.constraints {
                prompt.push_str(&format!("- {}\n", constraint));
            }
            prompt.push_str("\n");
        }

        if !skill.examples.is_empty() {
            prompt.push_str("## Examples\n\n");
            for (i, example) in skill.examples.iter().enumerate() {
                prompt.push_str(&format!("### Example {}\n", i + 1));
                prompt.push_str(&format!("Input: {}\n", example.input));
                prompt.push_str(&format!("Output:\n```\n{}\n```\n\n", example.output));
            }
        }

        if !context.is_empty() {
            prompt.push_str("## Context\n\n");
            prompt.push_str(context);
            prompt.push_str("\n");
        }

        prompt
    }

    /// Create default skills
    pub fn create_default_skills(&self) {
        let default_skills = vec![
            Skill {
                name: "create-api-endpoint".to_string(),
                description: Some("Create a REST API endpoint".to_string()),
                triggers: vec!["create endpoint".to_string(), "add route".to_string(), "new api".to_string()],
                model: Some("sonnet".to_string()),
                temperature: Some(0.3),
                instructions: r#"When creating API endpoints:
1. Follow RESTful conventions (GET for read, POST for create, PUT for update, DELETE for remove)
2. Add input validation using the project's validation library
3. Include proper error handling with meaningful error messages
4. Add appropriate HTTP status codes
5. Create TypeScript/Zod types for request/response bodies
6. Add JSDoc/TSDoc documentation"#.to_string(),
                examples: vec![],
                constraints: vec!["Use async/await".to_string(), "Return JSON responses".to_string()],
                file_patterns: vec!["**/routes/**".to_string(), "**/api/**".to_string()],
                tags: vec!["api".to_string(), "rest".to_string(), "backend".to_string()],
                priority: 80,
                enabled: true,
            },
            Skill {
                name: "create-react-component".to_string(),
                description: Some("Create a React component".to_string()),
                triggers: vec!["create component".to_string(), "new component".to_string(), "add component".to_string()],
                model: Some("sonnet".to_string()),
                temperature: Some(0.3),
                instructions: r#"When creating React components:
1. Use functional components with TypeScript
2. Define proper prop types with interfaces
3. Use hooks appropriately (useState, useEffect, useCallback, useMemo)
4. Follow the project's styling approach (CSS modules, Tailwind, styled-components)
5. Make components accessible (proper aria labels, keyboard navigation)
6. Export component as default"#.to_string(),
                examples: vec![],
                constraints: vec!["Use TypeScript".to_string(), "Follow React best practices".to_string()],
                file_patterns: vec!["**/components/**".to_string(), "**/*.tsx".to_string()],
                tags: vec!["react".to_string(), "component".to_string(), "frontend".to_string()],
                priority: 80,
                enabled: true,
            },
            Skill {
                name: "write-unit-test".to_string(),
                description: Some("Write unit tests".to_string()),
                triggers: vec!["write test".to_string(), "add test".to_string(), "create test".to_string(), "unit test".to_string()],
                model: Some("sonnet".to_string()),
                temperature: Some(0.2),
                instructions: r#"When writing unit tests:
1. Test the public API of the module
2. Include happy path and edge cases
3. Mock external dependencies
4. Use descriptive test names that explain the scenario
5. Follow AAA pattern (Arrange, Act, Assert)
6. Keep tests focused and independent"#.to_string(),
                examples: vec![],
                constraints: vec!["One assertion per test when possible".to_string()],
                file_patterns: vec!["**/*.test.*".to_string(), "**/*.spec.*".to_string()],
                tags: vec!["test".to_string(), "unit-test".to_string(), "testing".to_string()],
                priority: 70,
                enabled: true,
            },
            Skill {
                name: "refactor-function".to_string(),
                description: Some("Refactor a function for better readability/performance".to_string()),
                triggers: vec!["refactor".to_string(), "clean up".to_string(), "improve".to_string(), "optimize".to_string()],
                model: Some("opus".to_string()),
                temperature: Some(0.2),
                instructions: r#"When refactoring code:
1. Preserve existing behavior (no functional changes unless requested)
2. Improve naming for clarity
3. Extract repeated code into helper functions
4. Reduce nesting with early returns
5. Add/improve type annotations
6. Remove dead code and unused variables
7. Ensure all existing tests still pass"#.to_string(),
                examples: vec![],
                constraints: vec!["Do not change behavior".to_string(), "Maintain test coverage".to_string()],
                file_patterns: vec![],
                tags: vec!["refactor".to_string(), "cleanup".to_string(), "maintenance".to_string()],
                priority: 60,
                enabled: true,
            },
        ];

        for skill in default_skills {
            self.register_skill(skill);
        }
    }

    pub fn skill_count(&self) -> usize {
        self.skills.read().len()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_skills_manager_creation() {
        let manager = SkillsManager::new(PathBuf::from(".voicecode/skills"));
        assert_eq!(manager.skill_count(), 0);
    }

    #[test]
    fn test_default_skills() {
        let manager = SkillsManager::new(PathBuf::from(".voicecode/skills"));
        manager.create_default_skills();
        assert!(manager.skill_count() >= 4);
    }

    #[test]
    fn test_skill_matching() {
        let manager = SkillsManager::new(PathBuf::from(".voicecode/skills"));
        manager.create_default_skills();

        let matches = manager.find_matching_skills("create a new api endpoint");
        assert!(!matches.is_empty());
        assert!(matches[0].skill.name.contains("api") || matches[0].skill.triggers.iter().any(|t| t.contains("endpoint")));
    }

    #[test]
    fn test_yaml_parsing() {
        let manager = SkillsManager::new(PathBuf::from(".voicecode/skills"));
        
        let yaml = r#"
name: test-skill
description: A test skill
triggers: ["test", "demo"]
model: sonnet
priority: 80
tags: ["testing"]
"#;

        let skill = manager.parse_yaml_skill(yaml).unwrap();
        assert_eq!(skill.name, "test-skill");
        assert_eq!(skill.triggers.len(), 2);
    }
}
