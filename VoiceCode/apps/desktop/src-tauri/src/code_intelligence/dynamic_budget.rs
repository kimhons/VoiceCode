#![allow(dead_code, unused_variables, unused_imports)]
// Dynamic Context Budgeting - Adaptive token allocation based on task complexity
// Intelligently distributes context window across code, history, and memory

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Dynamic context budget manager
pub struct DynamicBudgetManager {
    model_limit: usize,
    reserved_output: usize,
    allocations: HashMap<ContextCategory, Allocation>,
    task_profile: TaskProfile,
}

/// Categories of context that consume tokens
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ContextCategory {
    SystemPrompt,
    ProjectMemory,
    CodeContext,
    GitHistory,
    SymbolDefinitions,
    Examples,
    UserQuery,
    TribalKnowledge,
    Citations,
}

/// Allocation for a category
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Allocation {
    pub min_tokens: usize,
    pub max_tokens: usize,
    pub priority: u8,
    pub current: usize,
    pub flexible: bool,
}

/// Task complexity profile
#[derive(Debug, Clone, Default)]
pub struct TaskProfile {
    pub task_type: TaskType,
    pub complexity: Complexity,
    pub scope: Scope,
    pub requires_history: bool,
    pub requires_examples: bool,
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub enum TaskType {
    #[default]
    Generate,
    Refactor,
    Debug,
    Explain,
    Review,
    Test,
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub enum Complexity {
    Simple,
    #[default]
    Medium,
    Complex,
    VeryComplex,
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub enum Scope {
    SingleFunction,
    SingleFile,
    #[default]
    MultiFile,
    Module,
    Project,
}

/// Budget calculation result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BudgetPlan {
    pub total_available: usize,
    pub allocations: HashMap<ContextCategory, usize>,
    pub overflow_strategy: OverflowStrategy,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum OverflowStrategy {
    TruncateLowestPriority,
    SummarizeCode,
    DropExamples,
    ReduceHistory,
}

impl DynamicBudgetManager {
    pub fn new(model_limit: usize) -> Self {
        let reserved_output = model_limit / 4; // Reserve 25% for output

        let mut allocations = HashMap::new();

        // Default allocations (percentages of available)
        allocations.insert(
            ContextCategory::SystemPrompt,
            Allocation {
                min_tokens: 500,
                max_tokens: 2000,
                priority: 10,
                current: 0,
                flexible: false,
            },
        );
        allocations.insert(
            ContextCategory::ProjectMemory,
            Allocation {
                min_tokens: 500,
                max_tokens: 3000,
                priority: 9,
                current: 0,
                flexible: true,
            },
        );
        allocations.insert(
            ContextCategory::CodeContext,
            Allocation {
                min_tokens: 2000,
                max_tokens: 50000,
                priority: 8,
                current: 0,
                flexible: true,
            },
        );
        allocations.insert(
            ContextCategory::SymbolDefinitions,
            Allocation {
                min_tokens: 500,
                max_tokens: 10000,
                priority: 7,
                current: 0,
                flexible: true,
            },
        );
        allocations.insert(
            ContextCategory::GitHistory,
            Allocation {
                min_tokens: 0,
                max_tokens: 5000,
                priority: 5,
                current: 0,
                flexible: true,
            },
        );
        allocations.insert(
            ContextCategory::Examples,
            Allocation {
                min_tokens: 0,
                max_tokens: 3000,
                priority: 4,
                current: 0,
                flexible: true,
            },
        );
        allocations.insert(
            ContextCategory::TribalKnowledge,
            Allocation {
                min_tokens: 200,
                max_tokens: 1500,
                priority: 6,
                current: 0,
                flexible: true,
            },
        );
        allocations.insert(
            ContextCategory::Citations,
            Allocation {
                min_tokens: 0,
                max_tokens: 5000,
                priority: 7,
                current: 0,
                flexible: true,
            },
        );
        allocations.insert(
            ContextCategory::UserQuery,
            Allocation {
                min_tokens: 100,
                max_tokens: 2000,
                priority: 10,
                current: 0,
                flexible: false,
            },
        );

        Self {
            model_limit,
            reserved_output,
            allocations,
            task_profile: TaskProfile::default(),
        }
    }

    /// Set task profile for context-aware budgeting
    pub fn set_task_profile(&mut self, profile: TaskProfile) {
        self.task_profile = profile;
        self.adjust_for_task();
    }

    /// Adjust allocations based on task type
    fn adjust_for_task(&mut self) {
        match self.task_profile.task_type {
            TaskType::Debug => {
                // Debugging needs more code context and history
                self.boost_category(ContextCategory::CodeContext, 1.5);
                self.boost_category(ContextCategory::GitHistory, 2.0);
            }
            TaskType::Refactor => {
                // Refactoring needs code and symbol definitions
                self.boost_category(ContextCategory::CodeContext, 1.3);
                self.boost_category(ContextCategory::SymbolDefinitions, 1.5);
            }
            TaskType::Explain => {
                // Explanations need less code, more context
                self.reduce_category(ContextCategory::CodeContext, 0.7);
                self.boost_category(ContextCategory::GitHistory, 1.5);
            }
            TaskType::Test => {
                // Testing needs examples
                self.boost_category(ContextCategory::Examples, 2.0);
                self.boost_category(ContextCategory::CodeContext, 1.2);
            }
            TaskType::Review => {
                // Reviews need history and tribal knowledge
                self.boost_category(ContextCategory::GitHistory, 1.5);
                self.boost_category(ContextCategory::TribalKnowledge, 1.5);
            }
            _ => {}
        }

        // Adjust for complexity
        match self.task_profile.complexity {
            Complexity::VeryComplex => {
                self.boost_category(ContextCategory::CodeContext, 1.5);
                self.boost_category(ContextCategory::SymbolDefinitions, 1.3);
            }
            Complexity::Complex => {
                self.boost_category(ContextCategory::CodeContext, 1.2);
            }
            Complexity::Simple => {
                self.reduce_category(ContextCategory::CodeContext, 0.7);
                self.reduce_category(ContextCategory::GitHistory, 0.5);
            }
            _ => {}
        }

        // Adjust for scope
        match self.task_profile.scope {
            Scope::Project => {
                self.boost_category(ContextCategory::SymbolDefinitions, 2.0);
                self.boost_category(ContextCategory::TribalKnowledge, 1.5);
            }
            Scope::Module => {
                self.boost_category(ContextCategory::SymbolDefinitions, 1.5);
            }
            Scope::SingleFunction => {
                self.reduce_category(ContextCategory::SymbolDefinitions, 0.5);
                self.reduce_category(ContextCategory::GitHistory, 0.5);
            }
            _ => {}
        }
    }

    fn boost_category(&mut self, category: ContextCategory, factor: f32) {
        if let Some(alloc) = self.allocations.get_mut(&category) {
            alloc.max_tokens = (alloc.max_tokens as f32 * factor) as usize;
        }
    }

    fn reduce_category(&mut self, category: ContextCategory, factor: f32) {
        if let Some(alloc) = self.allocations.get_mut(&category) {
            alloc.max_tokens = (alloc.max_tokens as f32 * factor) as usize;
        }
    }

    /// Calculate budget plan based on actual content sizes
    pub fn calculate_budget(&self, content_sizes: &HashMap<ContextCategory, usize>) -> BudgetPlan {
        let available = self.model_limit - self.reserved_output;
        let mut allocations = HashMap::new();
        let mut total_requested = 0;
        let mut total_min = 0;

        // Calculate totals
        for (category, size) in content_sizes {
            if let Some(alloc) = self.allocations.get(category) {
                let requested = (*size).min(alloc.max_tokens);
                total_requested += requested;
                total_min += alloc.min_tokens;
            }
        }

        // If we're under budget, allocate as requested
        if total_requested <= available {
            for (category, size) in content_sizes {
                if let Some(alloc) = self.allocations.get(category) {
                    allocations.insert(*category, (*size).min(alloc.max_tokens));
                }
            }
            return BudgetPlan {
                total_available: available,
                allocations,
                overflow_strategy: OverflowStrategy::TruncateLowestPriority,
            };
        }

        // We need to reduce - use priority-based allocation
        let overflow = total_requested - available;
        let reductions: Vec<(ContextCategory, usize, u8)> = Vec::new();

        // Sort by priority (lowest first for reduction)
        let mut sorted: Vec<_> = content_sizes
            .iter()
            .filter_map(|(cat, size)| {
                self.allocations
                    .get(cat)
                    .map(|a| (*cat, *size, a.priority, a.flexible))
            })
            .collect();
        sorted.sort_by_key(|(_, _, priority, _)| *priority);

        let mut remaining_reduction = overflow;
        for (category, size, _, flexible) in &sorted {
            if !flexible || remaining_reduction == 0 {
                allocations.insert(*category, *size);
                continue;
            }

            let alloc = self.allocations.get(category).unwrap();
            let can_reduce = size.saturating_sub(alloc.min_tokens);
            let reduction = can_reduce.min(remaining_reduction);

            allocations.insert(*category, size - reduction);
            remaining_reduction -= reduction;
        }

        BudgetPlan {
            total_available: available,
            allocations,
            overflow_strategy: self.determine_overflow_strategy(overflow),
        }
    }

    fn determine_overflow_strategy(&self, overflow: usize) -> OverflowStrategy {
        if overflow < 2000 {
            OverflowStrategy::TruncateLowestPriority
        } else if overflow < 5000 {
            OverflowStrategy::DropExamples
        } else if overflow < 10000 {
            OverflowStrategy::ReduceHistory
        } else {
            OverflowStrategy::SummarizeCode
        }
    }

    /// Get remaining budget for a category
    pub fn remaining_for(&self, category: ContextCategory) -> usize {
        self.allocations
            .get(&category)
            .map(|a| a.max_tokens.saturating_sub(a.current))
            .unwrap_or(0)
    }

    /// Record usage for a category
    pub fn record_usage(&mut self, category: ContextCategory, tokens: usize) {
        if let Some(alloc) = self.allocations.get_mut(&category) {
            alloc.current = tokens;
        }
    }

    /// Get total used tokens
    pub fn total_used(&self) -> usize {
        self.allocations.values().map(|a| a.current).sum()
    }

    /// Get available tokens
    pub fn available(&self) -> usize {
        self.model_limit - self.reserved_output - self.total_used()
    }

    /// Reset all usage tracking
    pub fn reset(&mut self) {
        for alloc in self.allocations.values_mut() {
            alloc.current = 0;
        }
    }

    /// Create optimal budget for different model sizes
    pub fn for_model(model: &str) -> Self {
        let limit = match model {
            "gpt-4-turbo" | "gpt-4-turbo-preview" => 128_000,
            "gpt-4" => 8_192,
            "gpt-4-32k" => 32_768,
            "gpt-3.5-turbo" => 16_384,
            "claude-3-opus" | "claude-3-sonnet" | "claude-3-haiku" => 200_000,
            "claude-2" => 100_000,
            "gemini-pro" => 32_000,
            "gemini-1.5-pro" => 1_000_000,
            _ => 16_000, // Conservative default
        };
        Self::new(limit)
    }
}

/// Estimates token count for content
pub fn estimate_tokens(content: &str) -> usize {
    // Rough estimate: ~4 chars per token for English
    // More accurate would use tiktoken
    content.len() / 4
}

/// Truncate content to fit token budget
pub fn truncate_to_budget(content: &str, max_tokens: usize) -> String {
    let estimated = estimate_tokens(content);
    if estimated <= max_tokens {
        return content.to_string();
    }

    // Calculate target character count
    let target_chars = max_tokens * 4;

    // Try to truncate at a natural boundary
    if let Some(truncated) = content.get(..target_chars) {
        // Find last complete line
        if let Some(last_newline) = truncated.rfind('\n') {
            return format!("{}...\n[truncated]", &truncated[..last_newline]);
        }
        return format!("{}...", truncated);
    }

    content.to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_budget_manager_creation() {
        let manager = DynamicBudgetManager::new(128_000);
        assert_eq!(manager.model_limit, 128_000);
        assert_eq!(manager.reserved_output, 32_000);
    }

    #[test]
    fn test_budget_calculation_under_limit() {
        let manager = DynamicBudgetManager::new(100_000);
        let mut sizes = HashMap::new();
        sizes.insert(ContextCategory::CodeContext, 5000);
        sizes.insert(ContextCategory::SystemPrompt, 1000);

        let plan = manager.calculate_budget(&sizes);
        assert_eq!(
            plan.allocations.get(&ContextCategory::CodeContext),
            Some(&5000)
        );
    }

    #[test]
    fn test_token_estimation() {
        let content = "Hello, world!"; // 13 chars
        let tokens = estimate_tokens(content);
        assert_eq!(tokens, 3); // 13 / 4 = 3
    }

    #[test]
    fn test_model_limits() {
        let claude = DynamicBudgetManager::for_model("claude-3-sonnet");
        assert_eq!(claude.model_limit, 200_000);

        let gpt4 = DynamicBudgetManager::for_model("gpt-4");
        assert_eq!(gpt4.model_limit, 8_192);
    }
}
