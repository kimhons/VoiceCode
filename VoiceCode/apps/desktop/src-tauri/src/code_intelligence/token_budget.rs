#![allow(dead_code, unused_variables, unused_imports)]
// Phase 3: Token Budget Management
// Intelligent token allocation and truncation for LLM context windows

use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use tiktoken_rs::{get_bpe_from_model, CoreBPE};

/// Supported LLM models and their context limits
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum LLMModel {
    /// GPT-4 Turbo (128K context)
    Gpt4Turbo,
    /// GPT-4 (8K context)
    Gpt4,
    /// GPT-4 32K
    Gpt432K,
    /// GPT-3.5 Turbo (16K context)
    Gpt35Turbo,
    /// GPT-3.5 Turbo 4K
    Gpt35Turbo4K,
    /// Claude 3 Opus (200K context)
    Claude3Opus,
    /// Claude 3 Sonnet (200K context)
    Claude3Sonnet,
    /// Claude 3 Haiku (200K context)
    Claude3Haiku,
    /// Claude 2 (100K context)
    Claude2,
    /// Custom model with specified limit
    Custom(usize),
}

impl LLMModel {
    /// Get maximum context window size in tokens
    pub fn max_tokens(&self) -> usize {
        match self {
            LLMModel::Gpt4Turbo => 128_000,
            LLMModel::Gpt4 => 8_192,
            LLMModel::Gpt432K => 32_768,
            LLMModel::Gpt35Turbo => 16_384,
            LLMModel::Gpt35Turbo4K => 4_096,
            LLMModel::Claude3Opus => 200_000,
            LLMModel::Claude3Sonnet => 200_000,
            LLMModel::Claude3Haiku => 200_000,
            LLMModel::Claude2 => 100_000,
            LLMModel::Custom(limit) => *limit,
        }
    }

    /// Get tiktoken model name for tokenization
    pub fn tiktoken_model(&self) -> &str {
        match self {
            LLMModel::Gpt4Turbo | LLMModel::Gpt4 | LLMModel::Gpt432K => "gpt-4",
            LLMModel::Gpt35Turbo | LLMModel::Gpt35Turbo4K => "gpt-3.5-turbo",
            // Claude uses cl100k_base similar to GPT-4
            LLMModel::Claude3Opus | LLMModel::Claude3Sonnet | LLMModel::Claude3Haiku | LLMModel::Claude2 => "gpt-4",
            LLMModel::Custom(_) => "gpt-4",
        }
    }
}

impl Default for LLMModel {
    fn default() -> Self {
        LLMModel::Claude3Sonnet
    }
}

/// Strategy for truncating content when over budget
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TruncationStrategy {
    /// Truncate from the end
    TruncateEnd,
    /// Truncate from the beginning
    TruncateStart,
    /// Truncate from the middle (keep start and end)
    TruncateMiddle,
    /// Smart truncation based on content type
    Smart,
    /// Keep only function signatures
    SignaturesOnly,
    /// Summarize (placeholder for future LLM summarization)
    Summarize,
}

impl Default for TruncationStrategy {
    fn default() -> Self {
        TruncationStrategy::Smart
    }
}

/// Content category for budget allocation
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ContentCategory {
    /// System prompt/instructions
    System,
    /// Current file context
    CurrentFile,
    /// Related files context
    RelatedFiles,
    /// Symbol definitions
    Definitions,
    /// Documentation
    Documentation,
    /// User query/input
    UserInput,
    /// Conversation history
    History,
    /// Tool/function definitions
    Tools,
    /// Output/response space
    Output,
    /// Retrieved context from search
    Retrieved,
}

impl ContentCategory {
    /// Get default priority (higher = more important, less likely to truncate)
    pub fn default_priority(&self) -> u8 {
        match self {
            ContentCategory::System => 100,
            ContentCategory::UserInput => 95,
            ContentCategory::CurrentFile => 90,
            ContentCategory::Definitions => 80,
            ContentCategory::Tools => 75,
            ContentCategory::RelatedFiles => 70,
            ContentCategory::Retrieved => 65,
            ContentCategory::Documentation => 50,
            ContentCategory::History => 40,
            ContentCategory::Output => 30,
        }
    }
}

/// Allocation rule for a content category
#[derive(Debug, Clone)]
pub struct AllocationRule {
    /// Category this rule applies to
    pub category: ContentCategory,
    /// Minimum tokens (guaranteed if available)
    pub min_tokens: usize,
    /// Maximum tokens (cap)
    pub max_tokens: usize,
    /// Percentage of total budget (0.0-1.0)
    pub percentage: f32,
    /// Priority for this category
    pub priority: u8,
    /// Whether this category can be truncated
    pub can_truncate: bool,
    /// Truncation strategy
    pub truncation: TruncationStrategy,
}

impl AllocationRule {
    pub fn new(category: ContentCategory) -> Self {
        Self {
            category,
            min_tokens: 0,
            max_tokens: usize::MAX,
            percentage: 0.1,
            priority: category.default_priority(),
            can_truncate: true,
            truncation: TruncationStrategy::Smart,
        }
    }

    pub fn min_tokens(mut self, tokens: usize) -> Self {
        self.min_tokens = tokens;
        self
    }

    pub fn max_tokens(mut self, tokens: usize) -> Self {
        self.max_tokens = tokens;
        self
    }

    pub fn percentage(mut self, pct: f32) -> Self {
        self.percentage = pct.clamp(0.0, 1.0);
        self
    }

    pub fn priority(mut self, priority: u8) -> Self {
        self.priority = priority;
        self
    }

    pub fn fixed(mut self) -> Self {
        self.can_truncate = false;
        self
    }

    pub fn truncation(mut self, strategy: TruncationStrategy) -> Self {
        self.truncation = strategy;
        self
    }
}

/// Token counting and management
pub struct TokenCounter {
    bpe: CoreBPE,
    model: LLMModel,
    cache: parking_lot::RwLock<HashMap<u64, usize>>,
}

impl TokenCounter {
    pub fn new(model: LLMModel) -> Result<Self, String> {
        let bpe = get_bpe_from_model(model.tiktoken_model())
            .map_err(|e| format!("Failed to load tokenizer: {}", e))?;

        Ok(Self {
            bpe,
            model,
            cache: parking_lot::RwLock::new(HashMap::new()),
        })
    }

    /// Count tokens in text
    pub fn count(&self, text: &str) -> usize {
        // Check cache first
        let hash = self.hash_content(text);
        if let Some(count) = self.cache.read().get(&hash) {
            return *count;
        }

        let count = self.bpe.encode_with_special_tokens(text).len();

        // Cache result
        self.cache.write().insert(hash, count);

        count
    }

    /// Count tokens with cache bypass
    pub fn count_uncached(&self, text: &str) -> usize {
        self.bpe.encode_with_special_tokens(text).len()
    }

    /// Estimate tokens (fast, less accurate)
    pub fn estimate(&self, text: &str) -> usize {
        // ~4 chars per token for English/code
        text.len() / 4
    }

    /// Truncate text to fit within token limit
    pub fn truncate(&self, text: &str, max_tokens: usize, strategy: TruncationStrategy) -> String {
        let current_tokens = self.count(text);
        if current_tokens <= max_tokens {
            return text.to_string();
        }

        match strategy {
            TruncationStrategy::TruncateEnd => self.truncate_end(text, max_tokens),
            TruncationStrategy::TruncateStart => self.truncate_start(text, max_tokens),
            TruncationStrategy::TruncateMiddle => self.truncate_middle(text, max_tokens),
            TruncationStrategy::Smart => self.truncate_smart(text, max_tokens),
            TruncationStrategy::SignaturesOnly => self.extract_signatures(text, max_tokens),
            TruncationStrategy::Summarize => {
                // For now, fall back to smart truncation
                // Future: LLM-based summarization
                self.truncate_smart(text, max_tokens)
            }
        }
    }

    fn truncate_end(&self, text: &str, max_tokens: usize) -> String {
        let tokens = self.bpe.encode_with_special_tokens(text);
        if tokens.len() <= max_tokens {
            return text.to_string();
        }

        let truncated_tokens = &tokens[..max_tokens.saturating_sub(3)];
        let mut result = self.bpe.decode(truncated_tokens.to_vec())
            .unwrap_or_else(|_| text[..text.len() / 2].to_string());
        result.push_str("...");
        result
    }

    fn truncate_start(&self, text: &str, max_tokens: usize) -> String {
        let tokens = self.bpe.encode_with_special_tokens(text);
        if tokens.len() <= max_tokens {
            return text.to_string();
        }

        let start = tokens.len().saturating_sub(max_tokens.saturating_sub(3));
        let truncated_tokens = &tokens[start..];
        let mut result = "...".to_string();
        result.push_str(
            &self.bpe.decode(truncated_tokens.to_vec())
                .unwrap_or_else(|_| text[text.len() / 2..].to_string())
        );
        result
    }

    fn truncate_middle(&self, text: &str, max_tokens: usize) -> String {
        let tokens = self.bpe.encode_with_special_tokens(text);
        if tokens.len() <= max_tokens {
            return text.to_string();
        }

        let keep_each_side = (max_tokens.saturating_sub(5)) / 2;
        let start_tokens = &tokens[..keep_each_side];
        let end_tokens = &tokens[tokens.len().saturating_sub(keep_each_side)..];

        let start_text = self.bpe.decode(start_tokens.to_vec())
            .unwrap_or_else(|_| text[..text.len() / 4].to_string());
        let end_text = self.bpe.decode(end_tokens.to_vec())
            .unwrap_or_else(|_| text[text.len() * 3 / 4..].to_string());

        format!("{}\n... [truncated] ...\n{}", start_text, end_text)
    }

    fn truncate_smart(&self, text: &str, max_tokens: usize) -> String {
        let lines: Vec<&str> = text.lines().collect();
        if lines.is_empty() {
            return String::new();
        }

        // Priority: keep imports, class/function signatures, and most recent code
        let mut kept_lines: Vec<(usize, &str)> = Vec::new();
        let mut current_tokens = 0;

        // Categorize lines
        let mut imports: Vec<(usize, &str)> = Vec::new();
        let mut signatures: Vec<(usize, &str)> = Vec::new();
        let mut other: Vec<(usize, &str)> = Vec::new();

        for (i, line) in lines.iter().enumerate() {
            let trimmed = line.trim();
            if trimmed.starts_with("import ")
                || trimmed.starts_with("from ")
                || trimmed.starts_with("use ")
                || trimmed.starts_with("#include")
                || trimmed.starts_with("require(")
            {
                imports.push((i, *line));
            } else if trimmed.starts_with("fn ")
                || trimmed.starts_with("def ")
                || trimmed.starts_with("function ")
                || trimmed.starts_with("class ")
                || trimmed.starts_with("interface ")
                || trimmed.starts_with("struct ")
                || trimmed.starts_with("pub fn ")
                || trimmed.starts_with("async fn ")
                || trimmed.starts_with("export ")
            {
                signatures.push((i, *line));
            } else {
                other.push((i, *line));
            }
        }

        // Add imports first
        for (i, line) in &imports {
            let line_tokens = self.estimate(line);
            if current_tokens + line_tokens < max_tokens / 3 {
                kept_lines.push((*i, *line));
                current_tokens += line_tokens;
            }
        }

        // Add signatures
        for (i, line) in &signatures {
            let line_tokens = self.estimate(line);
            if current_tokens + line_tokens < max_tokens * 2 / 3 {
                kept_lines.push((*i, *line));
                current_tokens += line_tokens;
            }
        }

        // Fill remaining space with other lines (prefer later lines)
        for (i, line) in other.iter().rev() {
            let line_tokens = self.estimate(line);
            if current_tokens + line_tokens < max_tokens {
                kept_lines.push((*i, *line));
                current_tokens += line_tokens;
            }
        }

        // Sort by original line number and reconstruct
        kept_lines.sort_by_key(|(i, _)| *i);

        let mut result = String::new();
        let mut last_idx: Option<usize> = None;

        for (i, line) in kept_lines {
            if let Some(last) = last_idx {
                if i > last + 1 {
                    result.push_str("\n  // ... [truncated] ...\n");
                }
            }
            result.push_str(line);
            result.push('\n');
            last_idx = Some(i);
        }

        result
    }

    fn extract_signatures(&self, text: &str, max_tokens: usize) -> String {
        let mut signatures = Vec::new();
        let mut current_tokens = 0;

        for line in text.lines() {
            let trimmed = line.trim();

            // Check if line looks like a signature
            let is_signature = trimmed.starts_with("fn ")
                || trimmed.starts_with("def ")
                || trimmed.starts_with("function ")
                || trimmed.starts_with("class ")
                || trimmed.starts_with("interface ")
                || trimmed.starts_with("struct ")
                || trimmed.starts_with("enum ")
                || trimmed.starts_with("type ")
                || trimmed.starts_with("pub fn ")
                || trimmed.starts_with("async fn ")
                || trimmed.starts_with("export function")
                || trimmed.starts_with("export class")
                || trimmed.starts_with("export interface")
                || trimmed.starts_with("export type")
                || (trimmed.contains("(") && trimmed.contains(")") && !trimmed.starts_with("//"));

            if is_signature {
                let line_tokens = self.estimate(line);
                if current_tokens + line_tokens < max_tokens {
                    signatures.push(line);
                    current_tokens += line_tokens;
                }
            }
        }

        signatures.join("\n")
    }

    fn hash_content(&self, content: &str) -> u64 {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};

        let mut hasher = DefaultHasher::new();
        content.hash(&mut hasher);
        hasher.finish()
    }

    /// Clear the token cache
    pub fn clear_cache(&self) {
        self.cache.write().clear();
    }

    /// Get the model this counter is for
    pub fn model(&self) -> LLMModel {
        self.model
    }
}

/// Token budget for a complete request
pub struct TokenBudget {
    model: LLMModel,
    counter: TokenCounter,
    rules: HashMap<ContentCategory, AllocationRule>,
    allocations: HashMap<ContentCategory, usize>,
    used: HashMap<ContentCategory, usize>,
    reserved_output: usize,
}

impl TokenBudget {
    pub fn new(model: LLMModel) -> Result<Self, String> {
        let counter = TokenCounter::new(model)?;

        Ok(Self {
            model,
            counter,
            rules: Self::default_rules(),
            allocations: HashMap::new(),
            used: HashMap::new(),
            reserved_output: 4096,
        })
    }

    /// Create with default rules for coding assistant
    pub fn for_coding_assistant(model: LLMModel) -> Result<Self, String> {
        let mut budget = Self::new(model)?;

        // Configure rules for coding context
        budget.set_rule(
            AllocationRule::new(ContentCategory::System)
                .min_tokens(500)
                .max_tokens(2000)
                .percentage(0.05)
                .fixed(),
        );

        budget.set_rule(
            AllocationRule::new(ContentCategory::UserInput)
                .min_tokens(100)
                .max_tokens(4000)
                .percentage(0.10)
                .fixed(),
        );

        budget.set_rule(
            AllocationRule::new(ContentCategory::CurrentFile)
                .min_tokens(1000)
                .max_tokens(32000)
                .percentage(0.30)
                .truncation(TruncationStrategy::Smart),
        );

        budget.set_rule(
            AllocationRule::new(ContentCategory::Definitions)
                .min_tokens(500)
                .max_tokens(16000)
                .percentage(0.15)
                .truncation(TruncationStrategy::SignaturesOnly),
        );

        budget.set_rule(
            AllocationRule::new(ContentCategory::RelatedFiles)
                .min_tokens(500)
                .max_tokens(24000)
                .percentage(0.20)
                .truncation(TruncationStrategy::Smart),
        );

        budget.set_rule(
            AllocationRule::new(ContentCategory::Retrieved)
                .min_tokens(0)
                .max_tokens(16000)
                .percentage(0.10)
                .truncation(TruncationStrategy::TruncateEnd),
        );

        budget.set_rule(
            AllocationRule::new(ContentCategory::History)
                .min_tokens(0)
                .max_tokens(8000)
                .percentage(0.05)
                .truncation(TruncationStrategy::TruncateStart),
        );

        budget.set_rule(
            AllocationRule::new(ContentCategory::Tools)
                .min_tokens(500)
                .max_tokens(4000)
                .percentage(0.05)
                .fixed(),
        );

        budget.recalculate_allocations();
        Ok(budget)
    }

    fn default_rules() -> HashMap<ContentCategory, AllocationRule> {
        let mut rules = HashMap::new();

        rules.insert(ContentCategory::System, AllocationRule::new(ContentCategory::System));
        rules.insert(ContentCategory::UserInput, AllocationRule::new(ContentCategory::UserInput));
        rules.insert(ContentCategory::CurrentFile, AllocationRule::new(ContentCategory::CurrentFile));
        rules.insert(ContentCategory::Definitions, AllocationRule::new(ContentCategory::Definitions));
        rules.insert(ContentCategory::RelatedFiles, AllocationRule::new(ContentCategory::RelatedFiles));
        rules.insert(ContentCategory::History, AllocationRule::new(ContentCategory::History));
        rules.insert(ContentCategory::Tools, AllocationRule::new(ContentCategory::Tools));
        rules.insert(ContentCategory::Output, AllocationRule::new(ContentCategory::Output));
        rules.insert(ContentCategory::Retrieved, AllocationRule::new(ContentCategory::Retrieved));
        rules.insert(ContentCategory::Documentation, AllocationRule::new(ContentCategory::Documentation));

        rules
    }

    /// Set allocation rule for a category
    pub fn set_rule(&mut self, rule: AllocationRule) {
        self.rules.insert(rule.category, rule);
    }

    /// Set reserved tokens for output
    pub fn reserve_output(&mut self, tokens: usize) {
        self.reserved_output = tokens;
        self.recalculate_allocations();
    }

    /// Recalculate allocations based on rules
    pub fn recalculate_allocations(&mut self) {
        let available = self.model.max_tokens().saturating_sub(self.reserved_output);
        self.allocations.clear();

        // First pass: allocate minimums
        let mut remaining = available;
        for (category, rule) in &self.rules {
            let min = rule.min_tokens.min(remaining);
            self.allocations.insert(*category, min);
            remaining = remaining.saturating_sub(min);
        }

        // Second pass: distribute by percentage
        if remaining > 0 {
            let total_percentage: f32 = self.rules.values().map(|r| r.percentage).sum();
            let scale = if total_percentage > 0.0 { 1.0 / total_percentage } else { 1.0 };

            for (category, rule) in &self.rules {
                let current = *self.allocations.get(category).unwrap_or(&0);
                let additional = ((remaining as f32) * rule.percentage * scale) as usize;
                let new_alloc = (current + additional).min(rule.max_tokens);
                self.allocations.insert(*category, new_alloc);
            }
        }
    }

    /// Get allocated tokens for a category
    pub fn get_allocation(&self, category: ContentCategory) -> usize {
        *self.allocations.get(&category).unwrap_or(&0)
    }

    /// Get remaining tokens for a category
    pub fn remaining(&self, category: ContentCategory) -> usize {
        let allocated = self.get_allocation(category);
        let used = *self.used.get(&category).unwrap_or(&0);
        allocated.saturating_sub(used)
    }

    /// Total remaining tokens across all categories
    pub fn total_remaining(&self) -> usize {
        let total_used: usize = self.used.values().sum();
        let available = self.model.max_tokens().saturating_sub(self.reserved_output);
        available.saturating_sub(total_used)
    }

    /// Add content to a category, truncating if necessary
    pub fn add_content(&mut self, category: ContentCategory, content: &str) -> String {
        let max_tokens = self.remaining(category);
        let rule = self.rules.get(&category).cloned().unwrap_or(AllocationRule::new(category));

        let processed = if rule.can_truncate {
            self.counter.truncate(content, max_tokens, rule.truncation)
        } else {
            content.to_string()
        };

        let tokens_used = self.counter.count(&processed);
        *self.used.entry(category).or_insert(0) += tokens_used;

        processed
    }

    /// Check if content fits in category
    pub fn fits(&self, category: ContentCategory, content: &str) -> bool {
        let tokens = self.counter.count(content);
        tokens <= self.remaining(category)
    }

    /// Count tokens for content
    pub fn count_tokens(&self, content: &str) -> usize {
        self.counter.count(content)
    }

    /// Estimate tokens for content (faster but less accurate)
    pub fn estimate_tokens(&self, content: &str) -> usize {
        self.counter.estimate(content)
    }

    /// Reset usage tracking
    pub fn reset(&mut self) {
        self.used.clear();
    }

    /// Get usage statistics
    pub fn stats(&self) -> BudgetStats {
        let total_allocated: usize = self.allocations.values().sum();
        let total_used: usize = self.used.values().sum();

        BudgetStats {
            model: self.model,
            max_tokens: self.model.max_tokens(),
            reserved_output: self.reserved_output,
            total_allocated,
            total_used,
            remaining: self.total_remaining(),
            category_stats: self.allocations
                .iter()
                .map(|(cat, alloc)| {
                    let used = *self.used.get(cat).unwrap_or(&0);
                    CategoryStats {
                        category: *cat,
                        allocated: *alloc,
                        used,
                        remaining: alloc.saturating_sub(used),
                    }
                })
                .collect(),
        }
    }

    /// Get the token counter
    pub fn counter(&self) -> &TokenCounter {
        &self.counter
    }
}

/// Statistics for a single category
#[derive(Debug, Clone, Serialize)]
pub struct CategoryStats {
    pub category: ContentCategory,
    pub allocated: usize,
    pub used: usize,
    pub remaining: usize,
}

/// Overall budget statistics
#[derive(Debug, Clone, Serialize)]
pub struct BudgetStats {
    pub model: LLMModel,
    pub max_tokens: usize,
    pub reserved_output: usize,
    pub total_allocated: usize,
    pub total_used: usize,
    pub remaining: usize,
    pub category_stats: Vec<CategoryStats>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_llm_model_limits() {
        assert_eq!(LLMModel::Gpt4Turbo.max_tokens(), 128_000);
        assert_eq!(LLMModel::Claude3Sonnet.max_tokens(), 200_000);
        assert_eq!(LLMModel::Custom(50_000).max_tokens(), 50_000);
    }

    #[test]
    fn test_token_counter() {
        let counter = TokenCounter::new(LLMModel::Gpt4).unwrap();
        let text = "Hello, world!";
        let count = counter.count(text);
        assert!(count > 0 && count < 10);
    }

    #[test]
    fn test_truncation_end() {
        let counter = TokenCounter::new(LLMModel::Gpt4).unwrap();
        let long_text = "word ".repeat(1000);
        let truncated = counter.truncate(&long_text, 100, TruncationStrategy::TruncateEnd);
        let new_count = counter.count(&truncated);
        assert!(new_count <= 103); // 100 + "..."
    }

    #[test]
    fn test_budget_allocation() {
        let budget = TokenBudget::for_coding_assistant(LLMModel::Gpt4Turbo).unwrap();
        let stats = budget.stats();
        assert!(stats.total_allocated > 0);
        assert!(stats.remaining > 0);
    }

    #[test]
    fn test_content_category_priority() {
        assert!(ContentCategory::System.default_priority() > ContentCategory::History.default_priority());
        assert!(ContentCategory::CurrentFile.default_priority() > ContentCategory::Documentation.default_priority());
    }
}
