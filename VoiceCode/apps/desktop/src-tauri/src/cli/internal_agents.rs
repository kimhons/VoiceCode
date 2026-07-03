#![allow(dead_code, unused_variables, unused_imports)]
// Internal VoiceCode Agents - Native agent implementations
// These agents use VoiceCode's code intelligence modules directly

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::{mpsc, RwLock};

use super::agent_protocol::{
    AgentCapability, CodeChange, ChangeType, TaskResult, TaskStatus, TaskType,
};
use super::enhanced_agents::{
    AgentError, AgentHealth, CostEstimate, EnhancedAgentAdapter, EnhancedResult, EnhancedTask,
    IntegrationType, ResultMetadata, StreamChunk,
};
use super::subagents::SubagentType;
use super::consensus::{ConsensusConfig, find_consensus};

// ============================================================================
// VoiceCode Internal Agent
// ============================================================================

/// VoiceCode's internal agent using native code intelligence
pub struct VoiceCodeInternalAgent {
    id: String,
    config: VoiceCodeAgentConfig,
    /// Code intelligence integration
    code_intel: Arc<CodeIntelligence>,
    /// Execution cache
    cache: RwLock<HashMap<String, CachedResult>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VoiceCodeAgentConfig {
    /// Enable AST-based analysis
    pub use_ast_analysis: bool,
    /// Enable semantic search
    pub use_semantic_search: bool,
    /// Enable code structure caching
    pub enable_caching: bool,
    /// Cache TTL in seconds
    pub cache_ttl_secs: u64,
    /// Maximum context window
    pub max_context_tokens: usize,
    /// Working directory
    pub working_dir: Option<PathBuf>,
}

impl Default for VoiceCodeAgentConfig {
    fn default() -> Self {
        Self {
            use_ast_analysis: true,
            use_semantic_search: true,
            enable_caching: true,
            cache_ttl_secs: 300,
            max_context_tokens: 32000,
            working_dir: std::env::current_dir().ok(),
        }
    }
}

#[derive(Debug, Clone)]
struct CachedResult {
    result: EnhancedResult,
    cached_at: std::time::Instant,
}

/// Code intelligence wrapper for internal agent operations
pub struct CodeIntelligence {
    /// AST analysis enabled
    ast_enabled: bool,
    /// Symbol cache
    symbols: RwLock<HashMap<String, Vec<SymbolInfo>>>,
    /// File content cache
    file_cache: RwLock<HashMap<PathBuf, FileContent>>,
}

#[derive(Debug, Clone)]
pub struct SymbolInfo {
    pub name: String,
    pub kind: SymbolKind,
    pub file: PathBuf,
    pub line: usize,
    pub documentation: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SymbolKind {
    Function,
    Class,
    Struct,
    Enum,
    Interface,
    Variable,
    Constant,
    Module,
    Type,
}

#[derive(Debug, Clone)]
pub struct FileContent {
    pub path: PathBuf,
    pub content: String,
    pub language: Option<String>,
    pub last_modified: std::time::SystemTime,
}

impl CodeIntelligence {
    pub fn new(ast_enabled: bool) -> Self {
        Self {
            ast_enabled,
            symbols: RwLock::new(HashMap::new()),
            file_cache: RwLock::new(HashMap::new()),
        }
    }

    /// Analyze code structure
    pub async fn analyze_code(&self, content: &str, language: Option<&str>) -> CodeAnalysis {
        let mut analysis = CodeAnalysis::default();

        // Extract functions
        analysis.functions = self.extract_functions(content, language);

        // Extract classes/structs
        analysis.types = self.extract_types(content, language);

        // Extract imports
        analysis.imports = self.extract_imports(content, language);

        // Calculate complexity
        analysis.complexity = self.calculate_complexity(content);

        // Count lines
        analysis.line_count = content.lines().count();
        analysis.code_lines = content.lines()
            .filter(|l| {
                let trimmed = l.trim();
                !trimmed.is_empty() && !trimmed.starts_with("//") && !trimmed.starts_with("#")
            })
            .count();

        analysis
    }

    fn extract_functions(&self, content: &str, _language: Option<&str>) -> Vec<FunctionInfo> {
        let mut functions = Vec::new();

        for (line_num, line) in content.lines().enumerate() {
            let trimmed = line.trim();

            // Rust/TypeScript function patterns
            if trimmed.starts_with("fn ") || trimmed.starts_with("pub fn ")
                || trimmed.starts_with("async fn ") || trimmed.starts_with("pub async fn ")
                || trimmed.starts_with("function ") || trimmed.starts_with("async function ")
            {
                if let Some(name) = self.extract_function_name(trimmed) {
                    functions.push(FunctionInfo {
                        name,
                        line: line_num + 1,
                        is_async: trimmed.contains("async"),
                        is_public: trimmed.starts_with("pub ") || !trimmed.starts_with("fn "),
                        parameters: self.extract_parameters(trimmed),
                    });
                }
            }

            // Python function pattern
            if trimmed.starts_with("def ") || trimmed.starts_with("async def ") {
                if let Some(name) = self.extract_function_name(trimmed) {
                    let is_public = !name.starts_with('_');
                    functions.push(FunctionInfo {
                        name,
                        line: line_num + 1,
                        is_async: trimmed.starts_with("async"),
                        is_public,
                        parameters: self.extract_parameters(trimmed),
                    });
                }
            }
        }

        functions
    }

    fn extract_function_name(&self, line: &str) -> Option<String> {
        // Find the function name between keywords and (
        let start_keywords = ["pub async fn ", "async fn ", "pub fn ", "fn ",
                             "async function ", "function ", "async def ", "def "];

        for keyword in start_keywords {
            if let Some(pos) = line.find(keyword) {
                let after_keyword = &line[pos + keyword.len()..];
                if let Some(paren_pos) = after_keyword.find('(') {
                    let name = after_keyword[..paren_pos].trim();
                    if !name.is_empty() {
                        return Some(name.to_string());
                    }
                }
            }
        }

        None
    }

    fn extract_parameters(&self, line: &str) -> Vec<String> {
        if let Some(start) = line.find('(') {
            if let Some(end) = line.find(')') {
                let params_str = &line[start + 1..end];
                return params_str
                    .split(',')
                    .map(|p| p.trim().to_string())
                    .filter(|p| !p.is_empty())
                    .collect();
            }
        }
        Vec::new()
    }

    fn extract_types(&self, content: &str, _language: Option<&str>) -> Vec<TypeInfo> {
        let mut types = Vec::new();

        for (line_num, line) in content.lines().enumerate() {
            let trimmed = line.trim();

            // Rust struct/enum
            if trimmed.starts_with("struct ") || trimmed.starts_with("pub struct ")
                || trimmed.starts_with("enum ") || trimmed.starts_with("pub enum ")
            {
                if let Some(name) = self.extract_type_name(trimmed) {
                    types.push(TypeInfo {
                        name,
                        kind: if trimmed.contains("enum") { "enum" } else { "struct" }.to_string(),
                        line: line_num + 1,
                        is_public: trimmed.starts_with("pub "),
                    });
                }
            }

            // TypeScript/JavaScript class/interface
            if trimmed.starts_with("class ") || trimmed.starts_with("export class ")
                || trimmed.starts_with("interface ") || trimmed.starts_with("export interface ")
            {
                if let Some(name) = self.extract_type_name(trimmed) {
                    types.push(TypeInfo {
                        name,
                        kind: if trimmed.contains("interface") { "interface" } else { "class" }.to_string(),
                        line: line_num + 1,
                        is_public: trimmed.starts_with("export "),
                    });
                }
            }

            // Python class
            if trimmed.starts_with("class ") {
                if let Some(name) = self.extract_type_name(trimmed) {
                    let is_public = !name.starts_with('_');
                    types.push(TypeInfo {
                        name,
                        kind: "class".to_string(),
                        line: line_num + 1,
                        is_public,
                    });
                }
            }
        }

        types
    }

    fn extract_type_name(&self, line: &str) -> Option<String> {
        let keywords = ["export class ", "class ", "export interface ", "interface ",
                       "pub struct ", "struct ", "pub enum ", "enum "];

        for keyword in keywords {
            if let Some(pos) = line.find(keyword) {
                let after_keyword = &line[pos + keyword.len()..];
                // Get until space, brace, or colon
                let end = after_keyword.find(|c| c == ' ' || c == '{' || c == ':' || c == '(')
                    .unwrap_or(after_keyword.len());
                let name = after_keyword[..end].trim();
                if !name.is_empty() {
                    return Some(name.to_string());
                }
            }
        }

        None
    }

    fn extract_imports(&self, content: &str, _language: Option<&str>) -> Vec<String> {
        let mut imports = Vec::new();

        for line in content.lines() {
            let trimmed = line.trim();

            if trimmed.starts_with("import ") || trimmed.starts_with("use ")
                || trimmed.starts_with("from ") || trimmed.starts_with("require(")
            {
                imports.push(trimmed.to_string());
            }
        }

        imports
    }

    fn calculate_complexity(&self, content: &str) -> usize {
        let mut complexity = 1; // Base complexity

        for line in content.lines() {
            let trimmed = line.trim();

            // Control flow adds complexity
            if trimmed.starts_with("if ") || trimmed.starts_with("else if ")
                || trimmed.starts_with("elif ") {
                complexity += 1;
            }
            if trimmed.starts_with("for ") || trimmed.starts_with("while ")
                || trimmed.starts_with("loop ") {
                complexity += 1;
            }
            if trimmed.starts_with("match ") || trimmed.starts_with("switch ") {
                complexity += 1;
            }
            if trimmed.contains(" && ") || trimmed.contains(" || ") {
                complexity += 1;
            }
            if trimmed.contains("?") && trimmed.contains(":") {
                complexity += 1; // Ternary
            }
        }

        complexity
    }

    /// Search for symbols matching a query
    pub async fn search_symbols(&self, query: &str) -> Vec<SymbolInfo> {
        let symbols = self.symbols.read().await;
        let query_lower = query.to_lowercase();

        let mut results: Vec<SymbolInfo> = symbols.values()
            .flatten()
            .filter(|s| s.name.to_lowercase().contains(&query_lower))
            .cloned()
            .collect();

        // Sort by relevance (exact match first, then prefix match)
        results.sort_by(|a, b| {
            let a_exact = a.name.to_lowercase() == query_lower;
            let b_exact = b.name.to_lowercase() == query_lower;
            let a_prefix = a.name.to_lowercase().starts_with(&query_lower);
            let b_prefix = b.name.to_lowercase().starts_with(&query_lower);

            match (a_exact, b_exact) {
                (true, false) => std::cmp::Ordering::Less,
                (false, true) => std::cmp::Ordering::Greater,
                _ => match (a_prefix, b_prefix) {
                    (true, false) => std::cmp::Ordering::Less,
                    (false, true) => std::cmp::Ordering::Greater,
                    _ => a.name.cmp(&b.name),
                }
            }
        });

        results
    }

    /// Get file content with caching
    pub async fn get_file(&self, path: &PathBuf) -> Option<FileContent> {
        // Check cache first
        {
            let cache = self.file_cache.read().await;
            if let Some(cached) = cache.get(path) {
                // Check if file was modified
                if let Ok(metadata) = std::fs::metadata(path) {
                    if let Ok(modified) = metadata.modified() {
                        if modified <= cached.last_modified {
                            return Some(cached.clone());
                        }
                    }
                }
            }
        }

        // Read file
        if let Ok(content) = tokio::fs::read_to_string(path).await {
            let language = Self::detect_language(path);
            let last_modified = std::fs::metadata(path)
                .ok()
                .and_then(|m| m.modified().ok())
                .unwrap_or_else(std::time::SystemTime::now);

            let file_content = FileContent {
                path: path.clone(),
                content,
                language,
                last_modified,
            };

            // Update cache
            self.file_cache.write().await.insert(path.clone(), file_content.clone());

            Some(file_content)
        } else {
            None
        }
    }

    fn detect_language(path: &PathBuf) -> Option<String> {
        path.extension()
            .and_then(|ext| ext.to_str())
            .map(|ext| match ext {
                "rs" => "rust",
                "ts" | "tsx" => "typescript",
                "js" | "jsx" => "javascript",
                "py" => "python",
                "go" => "go",
                "java" => "java",
                "c" | "h" => "c",
                "cpp" | "hpp" | "cc" => "cpp",
                "rb" => "ruby",
                "php" => "php",
                "swift" => "swift",
                "kt" => "kotlin",
                "scala" => "scala",
                "cs" => "csharp",
                _ => ext,
            }.to_string())
    }
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct CodeAnalysis {
    pub functions: Vec<FunctionInfo>,
    pub types: Vec<TypeInfo>,
    pub imports: Vec<String>,
    pub complexity: usize,
    pub line_count: usize,
    pub code_lines: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FunctionInfo {
    pub name: String,
    pub line: usize,
    pub is_async: bool,
    pub is_public: bool,
    pub parameters: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TypeInfo {
    pub name: String,
    pub kind: String,
    pub line: usize,
    pub is_public: bool,
}

impl VoiceCodeInternalAgent {
    pub fn new(config: VoiceCodeAgentConfig) -> Self {
        Self {
            id: "voicecode-internal".to_string(),
            code_intel: Arc::new(CodeIntelligence::new(config.use_ast_analysis)),
            cache: RwLock::new(HashMap::new()),
            config,
        }
    }

    /// Execute code analysis
    async fn analyze_task(&self, task: &EnhancedTask) -> Result<EnhancedResult, AgentError> {
        let start = std::time::Instant::now();

        let code = task.context.code_content.as_deref().unwrap_or("");
        let analysis = self.code_intel.analyze_code(
            code,
            task.context.language.as_deref(),
        ).await;

        let mut output = String::new();
        output.push_str("# Code Analysis\n\n");

        // Summary
        output.push_str(&format!("**Lines**: {} total, {} code\n",
            analysis.line_count, analysis.code_lines));
        output.push_str(&format!("**Complexity**: {}\n", analysis.complexity));
        output.push_str(&format!("**Functions**: {}\n", analysis.functions.len()));
        output.push_str(&format!("**Types**: {}\n\n", analysis.types.len()));

        // Functions
        if !analysis.functions.is_empty() {
            output.push_str("## Functions\n\n");
            for func in &analysis.functions {
                let visibility = if func.is_public { "pub " } else { "" };
                let async_str = if func.is_async { "async " } else { "" };
                output.push_str(&format!("- `{}{}fn {}` (line {})\n",
                    visibility, async_str, func.name, func.line));
            }
            output.push('\n');
        }

        // Types
        if !analysis.types.is_empty() {
            output.push_str("## Types\n\n");
            for type_info in &analysis.types {
                let visibility = if type_info.is_public { "pub " } else { "" };
                output.push_str(&format!("- `{}{} {}` (line {})\n",
                    visibility, type_info.kind, type_info.name, type_info.line));
            }
            output.push('\n');
        }

        // Imports
        if !analysis.imports.is_empty() {
            output.push_str("## Imports\n\n");
            for import in &analysis.imports {
                output.push_str(&format!("- `{}`\n", import));
            }
        }

        let duration_ms = start.elapsed().as_millis() as u64;

        Ok(EnhancedResult {
            task_id: task.id.clone(),
            status: TaskStatus::Completed,
            output,
            code_changes: Vec::new(),
            confidence: 0.95,
            reasoning: Some("Used native code analysis".to_string()),
            suggested_followups: vec![
                "Review the complex functions".to_string(),
                "Add tests for public functions".to_string(),
            ],
            metadata: ResultMetadata {
                tokens_used: None,
                duration_ms,
                model_used: Some("voicecode-analyzer".to_string()),
                cost_cents: Some(0), // Free - local analysis
                cache_hit: false,
            },
        })
    }

    /// Execute code generation task
    async fn generate_code(&self, task: &EnhancedTask) -> Result<EnhancedResult, AgentError> {
        let start = std::time::Instant::now();

        // This would integrate with the actual LLM in production
        // For now, provide template-based generation
        let (description, language) = match &task.task_type {
            TaskType::CodeGeneration { description, language } => {
                (description.clone(), language.clone())
            }
            _ => return Err(AgentError::InvalidInput("Expected CodeGeneration task".into())),
        };

        let lang = language.as_deref().unwrap_or("rust");
        let template = self.get_code_template(lang, &description);

        let duration_ms = start.elapsed().as_millis() as u64;

        Ok(EnhancedResult {
            task_id: task.id.clone(),
            status: TaskStatus::Completed,
            output: format!("Generated {} code:\n\n```{}\n{}\n```", lang, lang, template),
            code_changes: vec![CodeChange {
                file_path: format!("generated.{}", Self::lang_extension(lang)),
                change_type: ChangeType::Create,
                old_content: None,
                new_content: Some(template),
                line_start: None,
                line_end: None,
                before: None,
                after: None,
                line_range: None,
            }],
            confidence: 0.7,
            reasoning: Some("Template-based generation".to_string()),
            suggested_followups: vec![
                "Review and customize the generated code".to_string(),
                "Add error handling".to_string(),
                "Write tests".to_string(),
            ],
            metadata: ResultMetadata {
                tokens_used: None,
                duration_ms,
                model_used: Some("voicecode-generator".to_string()),
                cost_cents: Some(0),
                cache_hit: false,
            },
        })
    }

    fn get_code_template(&self, language: &str, description: &str) -> String {
        match language {
            "rust" => format!(r#"/// {}
///
/// # Example
/// ```
/// // TODO: Add example
/// ```
pub fn generated_function() -> Result<(), Box<dyn std::error::Error>> {{
    // TODO: Implement {}

    Ok(())
}}

#[cfg(test)]
mod tests {{
    use super::*;

    #[test]
    fn test_generated_function() {{
        let result = generated_function();
        assert!(result.is_ok());
    }}
}}"#, description, description),

            "typescript" | "javascript" => format!(r#"/**
 * {}
 *
 * @example
 * // TODO: Add example
 */
export function generatedFunction(): void {{
    // TODO: Implement {}
}}

// Tests
if (import.meta.vitest) {{
    const {{ describe, it, expect }} = import.meta.vitest;

    describe('generatedFunction', () => {{
        it('should work correctly', () => {{
            expect(() => generatedFunction()).not.toThrow();
        }});
    }});
}}"#, description, description),

            "python" => format!(r#""""
{}
"""

def generated_function():
    """
    TODO: Implement {}

    Example:
        >>> generated_function()
    """
    pass


if __name__ == "__main__":
    import doctest
    doctest.testmod()

    # Manual test
    generated_function()
    print("Function executed successfully")"#, description, description),

            _ => format!("// TODO: Implement {}\n// Language: {}", description, language),
        }
    }

    fn lang_extension(lang: &str) -> &'static str {
        match lang {
            "rust" => "rs",
            "typescript" => "ts",
            "javascript" => "js",
            "python" => "py",
            "go" => "go",
            "java" => "java",
            _ => "txt",
        }
    }

    /// Execute code review task
    async fn review_code(&self, task: &EnhancedTask) -> Result<EnhancedResult, AgentError> {
        let start = std::time::Instant::now();

        let code = task.context.code_content.as_deref().unwrap_or("");
        let analysis = self.code_intel.analyze_code(
            code,
            task.context.language.as_deref(),
        ).await;

        let mut output = String::new();
        output.push_str("# Code Review\n\n");

        // Complexity warnings
        if analysis.complexity > 10 {
            output.push_str("## ⚠️ High Complexity Warning\n\n");
            output.push_str(&format!("Cyclomatic complexity: {} (recommended: < 10)\n\n", analysis.complexity));
            output.push_str("Consider breaking down complex functions into smaller units.\n\n");
        }

        // Function analysis
        output.push_str("## Function Analysis\n\n");
        for func in &analysis.functions {
            output.push_str(&format!("### `{}`\n", func.name));

            // Check naming conventions
            if func.name.len() > 30 {
                output.push_str("- ⚠️ Function name is quite long\n");
            }

            // Check parameter count
            if func.parameters.len() > 5 {
                output.push_str(&format!("- ⚠️ Many parameters ({}) - consider using a struct\n", func.parameters.len()));
            }

            // Public without async consideration
            if func.is_public && func.is_async {
                output.push_str("- ℹ️ Public async function - ensure proper error handling\n");
            }

            output.push('\n');
        }

        // Best practices
        output.push_str("## Recommendations\n\n");
        output.push_str("1. Ensure all public functions have documentation\n");
        output.push_str("2. Add unit tests for critical paths\n");
        output.push_str("3. Consider adding error handling for edge cases\n");

        let duration_ms = start.elapsed().as_millis() as u64;

        Ok(EnhancedResult {
            task_id: task.id.clone(),
            status: TaskStatus::Completed,
            output,
            code_changes: Vec::new(),
            confidence: 0.85,
            reasoning: Some("Static analysis review".to_string()),
            suggested_followups: vec![
                "Address high complexity areas".to_string(),
                "Add missing documentation".to_string(),
            ],
            metadata: ResultMetadata {
                tokens_used: None,
                duration_ms,
                model_used: Some("voicecode-reviewer".to_string()),
                cost_cents: Some(0),
                cache_hit: false,
            },
        })
    }

    /// Find symbol definitions
    async fn find_definition(&self, task: &EnhancedTask) -> Result<EnhancedResult, AgentError> {
        let start = std::time::Instant::now();

        // Extract symbol to find from task
        let symbol = task.context.description.as_deref()
            .and_then(|d| d.split_whitespace().last())
            .unwrap_or("");

        let results = self.code_intel.search_symbols(symbol).await;

        let mut output = String::new();
        output.push_str(&format!("# Symbol Search: `{}`\n\n", symbol));

        if results.is_empty() {
            output.push_str("No symbols found matching the query.\n");
        } else {
            output.push_str(&format!("Found {} results:\n\n", results.len()));

            for result in results.iter().take(20) {
                output.push_str(&format!("- **{}** ({:?})\n", result.name, result.kind));
                output.push_str(&format!("  - File: {}\n", result.file.display()));
                output.push_str(&format!("  - Line: {}\n", result.line));
                if let Some(ref doc) = result.documentation {
                    output.push_str(&format!("  - Doc: {}\n", doc));
                }
                output.push('\n');
            }
        }

        let duration_ms = start.elapsed().as_millis() as u64;

        Ok(EnhancedResult {
            task_id: task.id.clone(),
            status: TaskStatus::Completed,
            output,
            code_changes: Vec::new(),
            confidence: 0.9,
            reasoning: Some("Symbol search".to_string()),
            suggested_followups: Vec::new(),
            metadata: ResultMetadata {
                tokens_used: None,
                duration_ms,
                model_used: Some("voicecode-explorer".to_string()),
                cost_cents: Some(0),
                cache_hit: false,
            },
        })
    }
}

#[async_trait]
impl EnhancedAgentAdapter for VoiceCodeInternalAgent {
    fn id(&self) -> &str {
        &self.id
    }

    fn name(&self) -> &str {
        "VoiceCode Internal"
    }

    async fn is_available(&self) -> bool {
        true // Always available - it's internal
    }

    fn capabilities(&self) -> Vec<AgentCapability> {
        vec![
            AgentCapability::CodeGeneration,
            AgentCapability::CodeReview,
            AgentCapability::Refactoring,
            AgentCapability::TestGeneration,
            AgentCapability::Documentation,
            AgentCapability::Explanation,
            AgentCapability::FileOperations,
            AgentCapability::Search,
        ]
    }

    fn integration_type(&self) -> IntegrationType {
        IntegrationType::Cli // Native integration
    }

    async fn execute(&self, task: &EnhancedTask) -> Result<EnhancedResult, AgentError> {
        // Check cache first
        if self.config.enable_caching {
            let cache = self.cache.read().await;
            if let Some(cached) = cache.get(&task.id) {
                let age = cached.cached_at.elapsed().as_secs();
                if age < self.config.cache_ttl_secs {
                    let mut result = cached.result.clone();
                    result.metadata.cache_hit = true;
                    return Ok(result);
                }
            }
        }

        // Route to appropriate handler
        let result = match &task.task_type {
            TaskType::CodeGeneration { .. } => self.generate_code(task).await?,
            TaskType::CodeReview { .. } => self.review_code(task).await?,
            TaskType::Explanation { .. } => self.analyze_task(task).await?,
            TaskType::Search { .. } => self.find_definition(task).await?,
            _ => self.analyze_task(task).await?, // Default to analysis
        };

        // Update cache
        if self.config.enable_caching {
            self.cache.write().await.insert(task.id.clone(), CachedResult {
                result: result.clone(),
                cached_at: std::time::Instant::now(),
            });
        }

        Ok(result)
    }

    async fn execute_streaming(
        &self,
        task: &EnhancedTask,
        output_tx: mpsc::Sender<StreamChunk>,
    ) -> Result<EnhancedResult, AgentError> {
        // Execute normally and stream the result
        let result = self.execute(task).await?;

        // Stream output in chunks
        for line in result.output.lines() {
            let _ = output_tx.send(StreamChunk::Text(line.to_string())).await;
        }
        let _ = output_tx.send(StreamChunk::Done).await;

        Ok(result)
    }

    async fn health_check(&self) -> AgentHealth {
        AgentHealth {
            available: true,
            latency_ms: Some(1),
            error: None,
            rate_limit_remaining: None,
            version: Some("1.0.0".to_string()),
        }
    }

    fn estimate_cost(&self, _task: &EnhancedTask) -> Option<CostEstimate> {
        // Internal agent is free
        Some(CostEstimate {
            min_cents: 0,
            max_cents: 0,
            expected_cents: 0,
        })
    }
}

// ============================================================================
// Multi-Agent Coordinator
// ============================================================================

/// Coordinates multiple internal agents for complex tasks
pub struct InternalAgentCoordinator {
    /// Available internal agents by type
    agents: HashMap<SubagentType, Arc<dyn EnhancedAgentAdapter>>,
    /// Consensus configuration
    consensus_config: ConsensusConfig,
}

impl InternalAgentCoordinator {
    pub fn new() -> Self {
        let mut agents: HashMap<SubagentType, Arc<dyn EnhancedAgentAdapter>> = HashMap::new();

        // Register the VoiceCode internal agent for different roles
        let internal_agent = Arc::new(VoiceCodeInternalAgent::new(VoiceCodeAgentConfig::default()));

        agents.insert(SubagentType::Explorer, internal_agent.clone());
        agents.insert(SubagentType::Reviewer, internal_agent.clone());
        agents.insert(SubagentType::Coder, internal_agent.clone());
        agents.insert(SubagentType::Documenter, internal_agent);

        Self {
            agents,
            consensus_config: ConsensusConfig::default(),
        }
    }

    /// Execute with multiple agents and find consensus
    pub async fn execute_with_consensus(
        &self,
        task: EnhancedTask,
        agent_types: Vec<SubagentType>,
    ) -> Result<EnhancedResult, AgentError> {
        let mut results = Vec::new();

        for agent_type in agent_types {
            if let Some(agent) = self.agents.get(&agent_type) {
                if let Ok(result) = agent.execute(&task).await {
                    // Convert to TaskResult for consensus
                    results.push(TaskResult {
                        status: result.status.clone(),
                        success: result.status == TaskStatus::Completed,
                        output: Some(result.output.clone()),
                        changes: result.code_changes.clone(),
                        ..Default::default()
                    });
                }
            }
        }

        if results.is_empty() {
            return Err(AgentError::ExecutionFailed("No agents produced results".into()));
        }

        // Find consensus
        let consensus = find_consensus(&results, &self.consensus_config);

        Ok(EnhancedResult {
            task_id: task.id,
            status: consensus.result.status,
            output: consensus.result.output.unwrap_or_default(),
            code_changes: consensus.result.changes,
            confidence: consensus.confidence as f32,
            reasoning: Some(format!("Consensus from {} agents using {:?} strategy",
                consensus.contributing_agents, consensus.strategy_used)),
            suggested_followups: Vec::new(),
            metadata: ResultMetadata {
                tokens_used: None,
                duration_ms: 0,
                model_used: Some("voicecode-consensus".to_string()),
                cost_cents: Some(0),
                cache_hit: false,
            },
        })
    }

    /// Execute a pipeline of agents
    pub async fn execute_pipeline(
        &self,
        task: EnhancedTask,
        stages: Vec<(SubagentType, String)>, // (agent_type, stage_name)
    ) -> Result<Vec<EnhancedResult>, AgentError> {
        let mut results = Vec::new();
        let mut current_task = task;

        for (agent_type, stage_name) in stages {
            if let Some(agent) = self.agents.get(&agent_type) {
                match agent.execute(&current_task).await {
                    Ok(result) => {
                        // Update task context with result for next stage
                        if let Some(ref output) = Some(&result.output) {
                            current_task.context.code_content = Some(output.to_string());
                        }
                        results.push(result);
                    }
                    Err(e) => {
                        return Err(AgentError::ExecutionFailed(
                            format!("Stage '{}' failed: {}", stage_name, e)
                        ));
                    }
                }
            } else {
                return Err(AgentError::NotAvailable(
                    format!("Agent type {:?} not available", agent_type)
                ));
            }
        }

        Ok(results)
    }
}

impl Default for InternalAgentCoordinator {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_code_analysis() {
        let intel = CodeIntelligence::new(true);

        let code = r#"
pub fn hello() {
    println!("Hello");
}

pub async fn fetch_data() -> Result<String, Error> {
    Ok("data".to_string())
}

struct User {
    name: String,
}
"#;

        let analysis = intel.analyze_code(code, Some("rust")).await;

        assert_eq!(analysis.functions.len(), 2);
        assert_eq!(analysis.types.len(), 1);
        assert!(analysis.functions.iter().any(|f| f.name == "hello"));
        assert!(analysis.functions.iter().any(|f| f.is_async && f.name == "fetch_data"));
    }

    #[tokio::test]
    async fn test_internal_agent_available() {
        let agent = VoiceCodeInternalAgent::new(VoiceCodeAgentConfig::default());
        assert!(agent.is_available().await);
    }

    #[tokio::test]
    async fn test_internal_agent_capabilities() {
        let agent = VoiceCodeInternalAgent::new(VoiceCodeAgentConfig::default());
        let caps = agent.capabilities();
        assert!(caps.contains(&AgentCapability::CodeGeneration));
        assert!(caps.contains(&AgentCapability::CodeReview));
    }
}
