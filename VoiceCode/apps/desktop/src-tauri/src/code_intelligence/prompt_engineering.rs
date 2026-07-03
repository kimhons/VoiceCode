#![allow(dead_code, unused_variables, unused_imports)]
// Prompt Engineering Layer - Few-shot, chain-of-thought, and structured prompting

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

pub struct PromptEngineer {
    templates: HashMap<PromptType, PromptTemplate>,
    few_shot_examples: HashMap<String, Vec<Example>>,
    system_prompt_base: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum PromptType {
    CodeGeneration,
    CodeRefactor,
    CodeReview,
    BugFix,
    Explanation,
    TestGeneration,
    Documentation,
    CodeCompletion,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PromptTemplate {
    pub name: String,
    pub system_prompt: String,
    pub user_template: String,
    pub chain_of_thought: bool,
    pub few_shot_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Example {
    pub input: String,
    pub output: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BuiltPrompt {
    pub system: String,
    pub user: String,
    pub examples: Vec<(String, String)>,
    pub estimated_tokens: usize,
}

impl PromptEngineer {
    pub fn new() -> Self {
        let mut engineer = Self {
            templates: HashMap::new(),
            few_shot_examples: HashMap::new(),
            system_prompt_base: Self::default_system_prompt(),
        };
        engineer.load_defaults();
        engineer
    }

    fn default_system_prompt() -> String {
        "You are an expert software engineer. Follow project conventions, cite existing code before modifications, never invent APIs.".to_string()
    }

    fn load_defaults(&mut self) {
        self.templates.insert(
            PromptType::CodeGeneration,
            PromptTemplate {
                name: "Code Generation".to_string(),
                system_prompt: "Generate clean, well-documented code following project patterns."
                    .to_string(),
                user_template: "## Task: {task}\n## Context\n{context}\n\nGenerate:".to_string(),
                chain_of_thought: true,
                few_shot_count: 1,
            },
        );

        self.templates.insert(
            PromptType::CodeRefactor,
            PromptTemplate {
                name: "Code Refactor".to_string(),
                system_prompt: "CITE existing code first, then refactor while preserving behavior."
                    .to_string(),
                user_template: "## Refactor: {task}\n## Current Code\n{code}\n\nRefactor:"
                    .to_string(),
                chain_of_thought: true,
                few_shot_count: 1,
            },
        );

        self.templates.insert(
            PromptType::BugFix,
            PromptTemplate {
                name: "Bug Fix".to_string(),
                system_prompt: "Analyze root cause, provide minimal fix, consider edge cases."
                    .to_string(),
                user_template: "## Bug: {description}\n## Error\n{error}\n## Code\n{code}\n\nFix:"
                    .to_string(),
                chain_of_thought: true,
                few_shot_count: 0,
            },
        );

        self.templates.insert(
            PromptType::TestGeneration,
            PromptTemplate {
                name: "Test Generation".to_string(),
                system_prompt: "Generate comprehensive tests: happy path, edge cases, errors."
                    .to_string(),
                user_template: "## Test: {target}\n## Code\n{code}\n\nTests:".to_string(),
                chain_of_thought: true,
                few_shot_count: 1,
            },
        );
    }

    pub fn build_prompt(
        &self,
        prompt_type: PromptType,
        vars: &HashMap<String, String>,
        context: Option<&str>,
    ) -> BuiltPrompt {
        let template = self
            .templates
            .get(&prompt_type)
            .cloned()
            .unwrap_or_else(|| PromptTemplate {
                name: "Default".to_string(),
                system_prompt: String::new(),
                user_template: "{task}".to_string(),
                chain_of_thought: false,
                few_shot_count: 0,
            });

        let system = format!("{}\n\n{}", self.system_prompt_base, template.system_prompt);
        let mut user = template.user_template.clone();
        for (k, v) in vars {
            user = user.replace(&format!("{{{}}}", k), v);
        }
        if let Some(ctx) = context {
            user = user.replace("{context}", ctx);
        }
        if template.chain_of_thought {
            user.push_str("\n\nThink step by step:");
        }

        BuiltPrompt {
            system,
            user,
            examples: Vec::new(),
            estimated_tokens: 0,
        }
    }

    pub fn citation_prompt(&self, symbols: &[String]) -> String {
        let mut p =
            "CITE existing code before modifications:\n```\n// @filepath:line\n```\n".to_string();
        if !symbols.is_empty() {
            p.push_str("\nMust cite: ");
            p.push_str(&symbols.join(", "));
        }
        p
    }

    pub fn anti_hallucination_prompt(&self) -> String {
        "NEVER invent APIs/methods. Verify all function calls exist. Say 'I need to verify' if unsure.".to_string()
    }
}

impl Default for PromptEngineer {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_prompt_build() {
        let eng = PromptEngineer::new();
        let mut vars = HashMap::new();
        vars.insert("task".to_string(), "test".to_string());
        let p = eng.build_prompt(PromptType::CodeGeneration, &vars, None);
        assert!(!p.system.is_empty());
    }
}
