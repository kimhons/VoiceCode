#![allow(dead_code, unused_variables, unused_imports)]
// Semantic Code Comparison and Consensus Algorithm
// Provides intelligent merging of results from multiple agents

use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use similar::{ChangeTag, TextDiff};

use super::agent_protocol::TaskResult;

// ============================================================================
// Consensus Configuration
// ============================================================================

/// Configuration for consensus finding
#[derive(Debug, Clone)]
pub struct ConsensusConfig {
    /// Minimum agreement threshold (0.0 - 1.0)
    pub agreement_threshold: f64,
    /// Weight for structural similarity
    pub structural_weight: f64,
    /// Weight for semantic similarity
    pub semantic_weight: f64,
    /// Weight for textual similarity
    pub textual_weight: f64,
    /// Prefer longer or shorter outputs
    pub prefer_comprehensive: bool,
    /// Minimum confidence to include in consensus
    pub min_confidence: f64,
}

impl Default for ConsensusConfig {
    fn default() -> Self {
        Self {
            agreement_threshold: 0.6,
            structural_weight: 0.4,
            semantic_weight: 0.35,
            textual_weight: 0.25,
            prefer_comprehensive: true,
            min_confidence: 0.5,
        }
    }
}

// ============================================================================
// Code Similarity Analysis
// ============================================================================

/// Analyze similarity between two code snippets
#[derive(Debug, Clone)]
pub struct SimilarityAnalysis {
    /// Overall similarity score (0.0 - 1.0)
    pub overall: f64,
    /// Structural similarity (AST-based)
    pub structural: f64,
    /// Semantic similarity (meaning-based)
    pub semantic: f64,
    /// Textual/lexical similarity
    pub textual: f64,
    /// Common lines
    pub common_lines: usize,
    /// Different lines
    pub different_lines: usize,
    /// Details of differences
    pub differences: Vec<CodeDifference>,
}

#[derive(Debug, Clone)]
pub struct CodeDifference {
    pub line_number: usize,
    pub diff_type: DifferenceType,
    pub left: Option<String>,
    pub right: Option<String>,
    pub significance: DifferenceSignificance,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DifferenceType {
    Added,
    Removed,
    Modified,
    Moved,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Ord, PartialOrd)]
pub enum DifferenceSignificance {
    /// Whitespace/formatting only
    Cosmetic,
    /// Variable naming differences
    Naming,
    /// Minor logic differences
    Minor,
    /// Significant structural differences
    Structural,
    /// Fundamental approach differences
    Fundamental,
}

/// Compare two code snippets
pub fn compare_code(left: &str, right: &str) -> SimilarityAnalysis {
    let textual = calculate_textual_similarity(left, right);
    let structural = calculate_structural_similarity(left, right);
    let semantic = calculate_semantic_similarity(left, right);

    let differences = find_differences(left, right);

    let common_lines = count_common_lines(left, right);
    let different_lines = differences.len();

    let overall = (textual * 0.25) + (structural * 0.4) + (semantic * 0.35);

    SimilarityAnalysis {
        overall,
        structural,
        semantic,
        textual,
        common_lines,
        different_lines,
        differences,
    }
}

/// Calculate textual similarity using diff
fn calculate_textual_similarity(left: &str, right: &str) -> f64 {
    if left == right {
        return 1.0;
    }

    if left.is_empty() || right.is_empty() {
        return 0.0;
    }

    let diff = TextDiff::from_lines(left, right);
    let mut same = 0;
    let mut total = 0;

    for change in diff.iter_all_changes() {
        match change.tag() {
            ChangeTag::Equal => {
                same += 1;
                total += 1;
            }
            _ => {
                total += 1;
            }
        }
    }

    if total == 0 {
        return 1.0;
    }

    same as f64 / total as f64
}

/// Calculate structural similarity (simplified AST comparison)
fn calculate_structural_similarity(left: &str, right: &str) -> f64 {
    // Extract structural patterns
    let left_patterns = extract_structural_patterns(left);
    let right_patterns = extract_structural_patterns(right);

    if left_patterns.is_empty() && right_patterns.is_empty() {
        return 1.0;
    }

    let intersection: HashSet<_> = left_patterns.intersection(&right_patterns).collect();
    let union: HashSet<_> = left_patterns.union(&right_patterns).collect();

    if union.is_empty() {
        return 1.0;
    }

    intersection.len() as f64 / union.len() as f64
}

/// Extract structural patterns from code
fn extract_structural_patterns(code: &str) -> HashSet<String> {
    let mut patterns = HashSet::new();

    for line in code.lines() {
        let trimmed = line.trim();

        // Function definitions
        if trimmed.starts_with("fn ") || trimmed.starts_with("def ")
            || trimmed.starts_with("function ") || trimmed.starts_with("async fn ")
            || trimmed.starts_with("pub fn ") || trimmed.starts_with("pub async fn ")
        {
            // Extract function name pattern
            if let Some(name_end) = trimmed.find('(') {
                let pattern = format!("func:{}", trimmed[..name_end].split_whitespace().last().unwrap_or(""));
                patterns.insert(pattern);
            }
        }

        // Class/struct definitions
        if trimmed.starts_with("class ") || trimmed.starts_with("struct ")
            || trimmed.starts_with("pub struct ") || trimmed.starts_with("interface ")
        {
            let parts: Vec<_> = trimmed.split_whitespace().collect();
            if parts.len() >= 2 {
                let pattern = format!("type:{}", parts[1].trim_end_matches(|c| c == '{' || c == ':'));
                patterns.insert(pattern);
            }
        }

        // Control flow patterns (check anywhere in line, not just start)
        if trimmed.contains("if ") || trimmed.contains("else if ") {
            patterns.insert("control:if".to_string());
        }
        if trimmed.starts_with("for ") || trimmed.contains(" for ") || trimmed.starts_with("while ") || trimmed.contains(" while ") {
            patterns.insert("control:loop".to_string());
        }
        if trimmed.starts_with("match ") || trimmed.contains(" match ") || trimmed.starts_with("switch ") || trimmed.contains(" switch ") {
            patterns.insert("control:match".to_string());
        }
        if trimmed.contains("return ") || trimmed.contains("return;") {
            patterns.insert("control:return".to_string());
        }

        // Import patterns
        if trimmed.starts_with("import ") || trimmed.starts_with("use ")
            || trimmed.starts_with("from ") || trimmed.starts_with("require(")
        {
            patterns.insert("import".to_string());
        }

        // Error handling
        if trimmed.starts_with("try ") || trimmed.contains("catch ")
            || trimmed.contains(".map_err(") || trimmed.contains("?")
        {
            patterns.insert("error_handling".to_string());
        }
    }

    patterns
}

/// Calculate semantic similarity (meaning-based)
fn calculate_semantic_similarity(left: &str, right: &str) -> f64 {
    // Extract semantic elements
    let left_semantics = extract_semantics(left);
    let right_semantics = extract_semantics(right);

    if left_semantics.is_empty() && right_semantics.is_empty() {
        return 1.0;
    }

    // Compare identifiers
    let left_ids: HashSet<_> = left_semantics.identifiers.iter().collect();
    let right_ids: HashSet<_> = right_semantics.identifiers.iter().collect();
    let id_similarity = jaccard_similarity(&left_ids, &right_ids);

    // Compare operations
    let left_ops: HashSet<_> = left_semantics.operations.iter().collect();
    let right_ops: HashSet<_> = right_semantics.operations.iter().collect();
    let op_similarity = jaccard_similarity(&left_ops, &right_ops);

    // Compare literals
    let left_lits: HashSet<_> = left_semantics.literals.iter().collect();
    let right_lits: HashSet<_> = right_semantics.literals.iter().collect();
    let lit_similarity = jaccard_similarity(&left_lits, &right_lits);

    // Weighted combination
    (id_similarity * 0.4) + (op_similarity * 0.4) + (lit_similarity * 0.2)
}

#[derive(Debug, Default)]
struct SemanticElements {
    identifiers: Vec<String>,
    operations: Vec<String>,
    literals: Vec<String>,
}

impl SemanticElements {
    fn is_empty(&self) -> bool {
        self.identifiers.is_empty() && self.operations.is_empty() && self.literals.is_empty()
    }
}

fn extract_semantics(code: &str) -> SemanticElements {
    let mut elements = SemanticElements::default();

    // Simple tokenization
    let tokens: Vec<&str> = code.split(|c: char| !c.is_alphanumeric() && c != '_')
        .filter(|s| !s.is_empty())
        .collect();

    for token in tokens {
        // Check if it's a number/literal
        if token.parse::<f64>().is_ok() {
            elements.literals.push(token.to_string());
        }
        // Check if it's a keyword/operation
        else if is_keyword_or_operation(token) {
            elements.operations.push(token.to_string());
        }
        // Otherwise it's an identifier
        else {
            elements.identifiers.push(token.to_string());
        }
    }

    // Extract string literals
    for (start, _) in code.match_indices('"') {
        if let Some(end) = code[start+1..].find('"') {
            let literal = &code[start..start+end+2];
            elements.literals.push(literal.to_string());
        }
    }

    elements
}

fn is_keyword_or_operation(token: &str) -> bool {
    const KEYWORDS: &[&str] = &[
        "fn", "function", "def", "let", "const", "var", "mut", "pub", "async", "await",
        "return", "if", "else", "for", "while", "loop", "match", "switch", "case",
        "struct", "class", "enum", "trait", "impl", "interface", "type",
        "import", "use", "from", "export", "module",
        "try", "catch", "throw", "raises",
        "true", "false", "null", "None", "undefined",
        "self", "this", "super",
        "and", "or", "not", "in", "is",
    ];
    KEYWORDS.contains(&token)
}

fn jaccard_similarity<T: std::cmp::Eq + std::hash::Hash>(a: &HashSet<&T>, b: &HashSet<&T>) -> f64 {
    if a.is_empty() && b.is_empty() {
        return 1.0;
    }

    let intersection = a.intersection(b).count();
    let union = a.union(b).count();

    if union == 0 {
        return 1.0;
    }

    intersection as f64 / union as f64
}

/// Find detailed differences between two code snippets
fn find_differences(left: &str, right: &str) -> Vec<CodeDifference> {
    let mut differences = Vec::new();

    let diff = TextDiff::from_lines(left, right);
    let mut line_num = 0;

    for change in diff.iter_all_changes() {
        match change.tag() {
            ChangeTag::Delete => {
                let significance = assess_significance(change.value());
                differences.push(CodeDifference {
                    line_number: line_num,
                    diff_type: DifferenceType::Removed,
                    left: Some(change.value().to_string()),
                    right: None,
                    significance,
                });
            }
            ChangeTag::Insert => {
                let significance = assess_significance(change.value());
                differences.push(CodeDifference {
                    line_number: line_num,
                    diff_type: DifferenceType::Added,
                    left: None,
                    right: Some(change.value().to_string()),
                    significance,
                });
            }
            ChangeTag::Equal => {
                line_num += 1;
            }
        }
    }

    differences
}

fn assess_significance(line: &str) -> DifferenceSignificance {
    let trimmed = line.trim();

    // Empty or whitespace only
    if trimmed.is_empty() {
        return DifferenceSignificance::Cosmetic;
    }

    // Comments
    if trimmed.starts_with("//") || trimmed.starts_with("#")
        || trimmed.starts_with("/*") || trimmed.starts_with("*")
    {
        return DifferenceSignificance::Cosmetic;
    }

    // Control flow changes are structural
    if trimmed.starts_with("if ") || trimmed.starts_with("for ")
        || trimmed.starts_with("while ") || trimmed.starts_with("match ")
    {
        return DifferenceSignificance::Structural;
    }

    // Function/type definitions are fundamental
    if trimmed.starts_with("fn ") || trimmed.starts_with("pub fn ")
        || trimmed.starts_with("struct ") || trimmed.starts_with("class ")
    {
        return DifferenceSignificance::Fundamental;
    }

    // Return statements are significant
    if trimmed.starts_with("return ") {
        return DifferenceSignificance::Structural;
    }

    // Variable declarations
    if trimmed.starts_with("let ") || trimmed.starts_with("const ")
        || trimmed.starts_with("var ") || trimmed.starts_with("mut ")
    {
        return DifferenceSignificance::Minor;
    }

    DifferenceSignificance::Minor
}

fn count_common_lines(left: &str, right: &str) -> usize {
    let left_lines: HashSet<&str> = left.lines().map(|l| l.trim()).collect();
    let right_lines: HashSet<&str> = right.lines().map(|l| l.trim()).collect();

    left_lines.intersection(&right_lines).count()
}

// ============================================================================
// Consensus Finding
// ============================================================================

/// Result of consensus analysis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConsensusResult {
    /// The consensus result (merged best output)
    pub result: TaskResult,
    /// Confidence in the consensus (0.0 - 1.0)
    pub confidence: f64,
    /// Agreement level among agents
    pub agreement: f64,
    /// Number of agents that contributed
    pub contributing_agents: usize,
    /// Conflicts that were resolved
    pub conflicts_resolved: Vec<ConflictResolution>,
    /// Explanation of consensus strategy used
    pub strategy_used: ConsensusStrategy,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConflictResolution {
    pub location: String,
    pub options: Vec<String>,
    pub chosen: String,
    pub reason: String,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum ConsensusStrategy {
    /// All agents agreed
    Unanimous,
    /// Majority vote
    Majority,
    /// Best quality selection
    BestQuality,
    /// Merged from multiple sources
    Merged,
    /// Single agent (fallback)
    SingleAgent,
}

/// Find consensus among multiple task results
pub fn find_consensus(results: &[TaskResult], config: &ConsensusConfig) -> ConsensusResult {
    if results.is_empty() {
        return ConsensusResult {
            result: TaskResult::default(),
            confidence: 0.0,
            agreement: 0.0,
            contributing_agents: 0,
            conflicts_resolved: Vec::new(),
            strategy_used: ConsensusStrategy::SingleAgent,
        };
    }

    if results.len() == 1 {
        return ConsensusResult {
            result: results[0].clone(),
            confidence: 0.8,
            agreement: 1.0,
            contributing_agents: 1,
            conflicts_resolved: Vec::new(),
            strategy_used: ConsensusStrategy::SingleAgent,
        };
    }

    // Check for unanimous agreement
    if check_unanimous(results, config) {
        return ConsensusResult {
            result: results[0].clone(),
            confidence: 1.0,
            agreement: 1.0,
            contributing_agents: results.len(),
            conflicts_resolved: Vec::new(),
            strategy_used: ConsensusStrategy::Unanimous,
        };
    }

    // Calculate pairwise similarities
    let similarities = calculate_pairwise_similarities(results);
    let avg_similarity = similarities.iter().sum::<f64>() / similarities.len() as f64;

    // If high agreement, use majority vote
    if avg_similarity >= config.agreement_threshold {
        return find_majority_consensus(results, config);
    }

    // Otherwise, merge best elements
    merge_results(results, config)
}

/// Check if all results are essentially the same
fn check_unanimous(results: &[TaskResult], config: &ConsensusConfig) -> bool {
    if results.len() < 2 {
        return true;
    }

    let first_output = results[0].output.as_deref().unwrap_or("");

    for result in &results[1..] {
        let output = result.output.as_deref().unwrap_or("");
        let analysis = compare_code(first_output, output);

        if analysis.overall < config.agreement_threshold {
            return false;
        }
    }

    true
}

/// Calculate pairwise similarities between all results
fn calculate_pairwise_similarities(results: &[TaskResult]) -> Vec<f64> {
    let mut similarities = Vec::new();

    for i in 0..results.len() {
        for j in (i+1)..results.len() {
            let left = results[i].output.as_deref().unwrap_or("");
            let right = results[j].output.as_deref().unwrap_or("");
            let analysis = compare_code(left, right);
            similarities.push(analysis.overall);
        }
    }

    similarities
}

/// Find consensus using majority vote
fn find_majority_consensus(results: &[TaskResult], config: &ConsensusConfig) -> ConsensusResult {
    // Group similar results
    let mut groups: Vec<Vec<usize>> = Vec::new();

    for i in 0..results.len() {
        let mut found_group = false;

        for group in &mut groups {
            let representative = &results[group[0]];
            let current = &results[i];

            let left = representative.output.as_deref().unwrap_or("");
            let right = current.output.as_deref().unwrap_or("");
            let analysis = compare_code(left, right);

            if analysis.overall >= config.agreement_threshold {
                group.push(i);
                found_group = true;
                break;
            }
        }

        if !found_group {
            groups.push(vec![i]);
        }
    }

    // Find largest group
    let default_group = vec![0];
    let largest_group = groups.iter()
        .max_by_key(|g| g.len())
        .unwrap_or(&default_group);

    let agreement = largest_group.len() as f64 / results.len() as f64;

    // Pick best result from largest group
    let best_idx = largest_group.iter()
        .max_by(|&&a, &&b| {
            let score_a = score_result(&results[a]);
            let score_b = score_result(&results[b]);
            score_a.partial_cmp(&score_b).unwrap_or(std::cmp::Ordering::Equal)
        })
        .copied()
        .unwrap_or(0);

    ConsensusResult {
        result: results[best_idx].clone(),
        confidence: agreement,
        agreement,
        contributing_agents: largest_group.len(),
        conflicts_resolved: Vec::new(),
        strategy_used: ConsensusStrategy::Majority,
    }
}

/// Score a result for quality
fn score_result(result: &TaskResult) -> f64 {
    let mut score = 0.0;

    // Success bonus
    if result.success {
        score += 10.0;
    }

    // Output length (but not too much)
    if let Some(ref output) = result.output {
        let len = output.len();
        if len > 0 && len < 10000 {
            score += (len as f64).ln();
        }
    }

    // Code changes completeness
    if !result.changes.is_empty() {
        score += result.changes.len() as f64 * 2.0;

        // Penalize incomplete changes
        for change in &result.changes {
            if change.new_content.is_some() {
                score += 1.0;
            }
        }
    }

    score
}

/// Merge multiple results into a consensus
fn merge_results(results: &[TaskResult], config: &ConsensusConfig) -> ConsensusResult {
    // Start with the best individual result
    let best_idx = (0..results.len())
        .max_by(|&a, &b| {
            score_result(&results[a])
                .partial_cmp(&score_result(&results[b]))
                .unwrap_or(std::cmp::Ordering::Equal)
        })
        .unwrap_or(0);

    let mut merged = results[best_idx].clone();
    let mut conflicts_resolved = Vec::new();

    // Merge code changes from other results
    let mut seen_files: HashSet<String> = HashSet::new();

    for change in &merged.changes {
        seen_files.insert(change.file_path.clone());
    }

    for (idx, result) in results.iter().enumerate() {
        if idx == best_idx {
            continue;
        }

        for change in &result.changes {
            if !seen_files.contains(&change.file_path) {
                // Add new file changes
                merged.changes.push(change.clone());
                seen_files.insert(change.file_path.clone());
            } else {
                // Compare with existing change
                if let Some(existing) = merged.changes.iter().find(|c| c.file_path == change.file_path) {
                    let existing_content = existing.new_content.as_deref().unwrap_or("");
                    let new_content = change.new_content.as_deref().unwrap_or("");

                    let analysis = compare_code(existing_content, new_content);

                    if analysis.overall < config.agreement_threshold {
                        // Record conflict resolution
                        conflicts_resolved.push(ConflictResolution {
                            location: change.file_path.clone(),
                            options: vec![
                                format!("Option 1 (kept): {} chars", existing_content.len()),
                                format!("Option 2 (rejected): {} chars", new_content.len()),
                            ],
                            chosen: "Option 1".to_string(),
                            reason: format!("Higher quality score (similarity: {:.2})", analysis.overall),
                        });
                    }
                }
            }
        }
    }

    // Calculate overall agreement
    let similarities = calculate_pairwise_similarities(results);
    let agreement = if similarities.is_empty() {
        1.0
    } else {
        similarities.iter().sum::<f64>() / similarities.len() as f64
    };

    ConsensusResult {
        result: merged,
        confidence: agreement * 0.8 + 0.2, // Boost confidence slightly for merge
        agreement,
        contributing_agents: results.len(),
        conflicts_resolved,
        strategy_used: ConsensusStrategy::Merged,
    }
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_identical_code() {
        let code = "fn main() {\n    println!(\"Hello\");\n}";
        let analysis = compare_code(code, code);
        assert_eq!(analysis.overall, 1.0);
    }

    #[test]
    fn test_similar_code() {
        let left = "fn main() {\n    println!(\"Hello\");\n}";
        let right = "fn main() {\n    println!(\"World\");\n}";
        let analysis = compare_code(left, right);
        assert!(analysis.overall > 0.5);
    }

    #[test]
    fn test_different_code() {
        let left = "fn main() { println!(\"Hello\"); }";
        let right = "class Foo { bar() { return 42; } }";
        let analysis = compare_code(left, right);
        assert!(analysis.overall < 0.5);
    }

    #[test]
    fn test_structural_patterns() {
        let code = "fn foo() { if x > 0 { return true; } }";
        let patterns = extract_structural_patterns(code);
        assert!(patterns.contains("control:if"));
        assert!(patterns.contains("control:return"));
    }

    #[test]
    fn test_consensus_single_result() {
        let results = vec![TaskResult {
            success: true,
            output: Some("Hello".to_string()),
            ..Default::default()
        }];

        let consensus = find_consensus(&results, &ConsensusConfig::default());
        assert_eq!(consensus.contributing_agents, 1);
        assert!(matches!(consensus.strategy_used, ConsensusStrategy::SingleAgent));
    }

    #[test]
    fn test_consensus_unanimous() {
        let output = "fn main() { println!(\"Hello\"); }";
        let results = vec![
            TaskResult { success: true, output: Some(output.to_string()), ..Default::default() },
            TaskResult { success: true, output: Some(output.to_string()), ..Default::default() },
            TaskResult { success: true, output: Some(output.to_string()), ..Default::default() },
        ];

        let consensus = find_consensus(&results, &ConsensusConfig::default());
        assert_eq!(consensus.agreement, 1.0);
        assert!(matches!(consensus.strategy_used, ConsensusStrategy::Unanimous));
    }
}
