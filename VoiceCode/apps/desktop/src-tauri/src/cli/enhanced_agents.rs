#![allow(dead_code, unused_variables, unused_imports)]
// Enhanced Agent Integration System
// Provides deep API-level integration with external CLI tools
// Beyond simple subprocess execution - uses MCP, direct APIs, and streaming

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::{mpsc, RwLock};

use super::agent_protocol::{
    AgentCapability, CodeChange, ChangeType, TaskContext, TaskStatus, TaskType,
};
use super::mcp::{
    McpClient, McpServerConfig, McpTool, TransportConfig, TransportType, ToolResult, ContentItem,
};

// ============================================================================
// Enhanced Agent Trait
// ============================================================================

/// Enhanced agent adapter with deep integration support
#[async_trait]
pub trait EnhancedAgentAdapter: Send + Sync {
    /// Get unique agent identifier
    fn id(&self) -> &str;

    /// Get agent display name
    fn name(&self) -> &str;

    /// Check if agent is available and properly configured
    async fn is_available(&self) -> bool;

    /// Get agent capabilities
    fn capabilities(&self) -> Vec<AgentCapability>;

    /// Get the integration type (MCP, API, CLI)
    fn integration_type(&self) -> IntegrationType;

    /// Execute a task
    async fn execute(&self, task: &EnhancedTask) -> Result<EnhancedResult, AgentError>;

    /// Execute with streaming output
    async fn execute_streaming(
        &self,
        task: &EnhancedTask,
        output_tx: mpsc::Sender<StreamChunk>,
    ) -> Result<EnhancedResult, AgentError>;

    /// Get agent health/status
    async fn health_check(&self) -> AgentHealth;

    /// Estimate cost for a task (if applicable)
    fn estimate_cost(&self, task: &EnhancedTask) -> Option<CostEstimate>;
}

/// Integration type for the agent
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum IntegrationType {
    /// Model Context Protocol (structured tool calls)
    Mcp,
    /// Direct API integration (REST/GraphQL)
    DirectApi,
    /// CLI subprocess execution (fallback)
    Cli,
    /// Hybrid (prefers API, falls back to CLI)
    Hybrid,
}

/// Enhanced task with richer context
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnhancedTask {
    pub id: String,
    pub task_type: TaskType,
    pub context: TaskContext,
    /// Additional semantic context
    pub semantic_context: Option<SemanticContext>,
    /// Preferred output format
    pub output_format: OutputFormat,
    /// Task constraints
    pub constraints: TaskConstraints,
    /// Parent task ID for decomposed tasks
    pub parent_task_id: Option<String>,
}

/// Semantic context for better task understanding
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct SemanticContext {
    /// Related symbols (functions, classes, etc.)
    pub related_symbols: Vec<String>,
    /// Dependency graph info
    pub dependencies: Vec<String>,
    /// Test coverage info
    pub test_coverage: Option<f32>,
    /// Recent changes to related code
    pub recent_changes: Vec<RecentChange>,
    /// Project patterns/conventions
    pub conventions: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecentChange {
    pub file: String,
    pub summary: String,
    pub timestamp: i64,
}

/// Output format preference
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
pub enum OutputFormat {
    #[default]
    Structured,
    Diff,
    FullFile,
    Explanation,
}

/// Task constraints
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct TaskConstraints {
    /// Maximum tokens to generate
    pub max_tokens: Option<usize>,
    /// Timeout in milliseconds
    pub timeout_ms: Option<u64>,
    /// Maximum cost allowed (in cents)
    pub max_cost_cents: Option<u32>,
    /// Required capabilities
    pub required_capabilities: Vec<AgentCapability>,
    /// Files that must not be modified
    pub protected_files: Vec<String>,
}

/// Enhanced result with metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnhancedResult {
    pub task_id: String,
    pub status: TaskStatus,
    pub output: String,
    pub code_changes: Vec<CodeChange>,
    /// Confidence in the result (0.0 - 1.0)
    pub confidence: f32,
    /// Explanation of the approach taken
    pub reasoning: Option<String>,
    /// Suggested follow-up tasks
    pub suggested_followups: Vec<String>,
    /// Metadata
    pub metadata: ResultMetadata,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ResultMetadata {
    pub tokens_used: Option<usize>,
    pub duration_ms: u64,
    pub model_used: Option<String>,
    pub cost_cents: Option<u32>,
    pub cache_hit: bool,
}

/// Streaming chunk
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum StreamChunk {
    /// Text content being generated
    Text(String),
    /// Code change being made
    CodeChange(CodeChange),
    /// Progress update
    Progress { step: String, percent: f32 },
    /// Thinking/reasoning (if model supports it)
    Thinking(String),
    /// Tool being called
    ToolCall { name: String, args: serde_json::Value },
    /// Completion
    Done,
    /// Error
    Error(String),
}

/// Agent health status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentHealth {
    pub available: bool,
    pub latency_ms: Option<u64>,
    pub error: Option<String>,
    pub rate_limit_remaining: Option<u32>,
    pub version: Option<String>,
}

/// Cost estimate
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CostEstimate {
    pub min_cents: u32,
    pub max_cents: u32,
    pub expected_cents: u32,
}

/// Agent error types
#[derive(Debug, Clone)]
pub enum AgentError {
    NotAvailable(String),
    ConnectionFailed(String),
    AuthenticationFailed(String),
    RateLimited { retry_after_ms: u64 },
    Timeout,
    InvalidInput(String),
    ExecutionFailed(String),
    CostExceeded { actual: u32, limit: u32 },
    CapabilityMissing(AgentCapability),
    ParseError(String),
}

impl std::fmt::Display for AgentError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AgentError::NotAvailable(msg) => write!(f, "Agent not available: {}", msg),
            AgentError::ConnectionFailed(msg) => write!(f, "Connection failed: {}", msg),
            AgentError::AuthenticationFailed(msg) => write!(f, "Auth failed: {}", msg),
            AgentError::RateLimited { retry_after_ms } => {
                write!(f, "Rate limited, retry after {}ms", retry_after_ms)
            }
            AgentError::Timeout => write!(f, "Request timed out"),
            AgentError::InvalidInput(msg) => write!(f, "Invalid input: {}", msg),
            AgentError::ExecutionFailed(msg) => write!(f, "Execution failed: {}", msg),
            AgentError::CostExceeded { actual, limit } => {
                write!(f, "Cost exceeded: {} cents vs {} limit", actual, limit)
            }
            AgentError::CapabilityMissing(cap) => write!(f, "Missing capability: {:?}", cap),
            AgentError::ParseError(msg) => write!(f, "Parse error: {}", msg),
        }
    }
}

impl std::error::Error for AgentError {}

// ============================================================================
// Claude Code MCP Agent - Deep Integration
// ============================================================================

/// Claude Code agent with MCP protocol integration
pub struct ClaudeCodeMcpAgent {
    id: String,
    mcp_client: Option<Arc<McpClient>>,
    config: ClaudeCodeConfig,
    available_tools: RwLock<Vec<McpTool>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClaudeCodeConfig {
    /// Path to claude CLI
    pub cli_path: String,
    /// Working directory
    pub working_dir: Option<PathBuf>,
    /// API key (for direct API calls)
    pub api_key: Option<String>,
    /// Prefer MCP over CLI
    pub prefer_mcp: bool,
    /// Model to use
    pub model: String,
    /// Max tokens per request
    pub max_tokens: usize,
    /// Permission mode
    pub permission_mode: String,
}

impl Default for ClaudeCodeConfig {
    fn default() -> Self {
        Self {
            cli_path: "claude".to_string(),
            working_dir: None,
            api_key: std::env::var("ANTHROPIC_API_KEY").ok(),
            prefer_mcp: true,
            model: "claude-sonnet-4-20250514".to_string(),
            max_tokens: 8192,
            permission_mode: "default".to_string(),
        }
    }
}

impl ClaudeCodeMcpAgent {
    pub fn new(config: ClaudeCodeConfig) -> Self {
        Self {
            id: "claude-code-mcp".to_string(),
            mcp_client: None,
            config,
            available_tools: RwLock::new(Vec::new()),
        }
    }

    /// Initialize MCP connection to Claude Code
    pub async fn connect_mcp(&mut self) -> Result<(), AgentError> {
        let transport = TransportConfig {
            transport_type: TransportType::Stdio,
            command: Some(self.config.cli_path.clone()),
            args: Some(vec!["mcp".to_string()]),
            env: None,
            url: None,
            headers: None,
            timeout_ms: Some(60000),
            reconnect_delay_ms: Some(1000),
        };

        let server_config = McpServerConfig {
            name: "claude-code".to_string(),
            description: Some("Claude Code CLI via MCP".to_string()),
            transport,
            oauth: None,
            auto_start: true,
            restart_on_failure: true,
            max_restarts: 3,
        };

        let client = McpClient::new(server_config)
            .await
            .map_err(|e| AgentError::ConnectionFailed(e.to_string()))?;

        client
            .connect()
            .await
            .map_err(|e| AgentError::ConnectionFailed(e.to_string()))?;

        // Cache available tools
        let tools = client.get_tools().await;
        *self.available_tools.write().await = tools;

        self.mcp_client = Some(Arc::new(client));
        Ok(())
    }

    /// Execute using MCP tools
    async fn execute_via_mcp(&self, task: &EnhancedTask) -> Result<EnhancedResult, AgentError> {
        let client = self
            .mcp_client
            .as_ref()
            .ok_or_else(|| AgentError::NotAvailable("MCP not connected".into()))?;

        let start = std::time::Instant::now();

        // Build tool call based on task type
        let (tool_name, arguments) = self.task_to_mcp_call(task)?;

        let result = client
            .call_tool(&tool_name, arguments)
            .await
            .map_err(|e| AgentError::ExecutionFailed(e.to_string()))?;

        let duration_ms = start.elapsed().as_millis() as u64;

        // Parse MCP result
        self.parse_mcp_result(task, result, duration_ms)
    }

    /// Convert task to MCP tool call
    fn task_to_mcp_call(
        &self,
        task: &EnhancedTask,
    ) -> Result<(String, serde_json::Value), AgentError> {
        match &task.task_type {
            TaskType::CodeGeneration { description, language } => {
                Ok(("code_generate".to_string(), serde_json::json!({
                    "prompt": description,
                    "language": language,
                    "context": task.context.code_content,
                    "file_path": task.context.file_path,
                })))
            }
            TaskType::CodeReview { focus_areas } => {
                Ok(("code_review".to_string(), serde_json::json!({
                    "code": task.context.code_content,
                    "file_path": task.context.file_path,
                    "focus_areas": focus_areas,
                })))
            }
            TaskType::BugFix { error_message, stack_trace } => {
                Ok(("bug_fix".to_string(), serde_json::json!({
                    "error": error_message,
                    "stack_trace": stack_trace,
                    "file_path": task.context.file_path,
                    "code": task.context.code_content,
                })))
            }
            TaskType::Refactoring { refactor_type, scope } => {
                Ok(("refactor".to_string(), serde_json::json!({
                    "type": refactor_type,
                    "scope": scope,
                    "file_path": task.context.file_path,
                    "code": task.context.code_content,
                })))
            }
            TaskType::TestGeneration { test_type, coverage_target } => {
                Ok(("generate_tests".to_string(), serde_json::json!({
                    "test_type": test_type,
                    "coverage_target": coverage_target,
                    "file_path": task.context.file_path,
                    "code": task.context.code_content,
                })))
            }
            TaskType::Documentation { doc_type, format } => {
                Ok(("generate_docs".to_string(), serde_json::json!({
                    "doc_type": doc_type,
                    "format": format,
                    "file_path": task.context.file_path,
                    "code": task.context.code_content,
                })))
            }
            TaskType::Explanation { detail_level } => {
                Ok(("explain_code".to_string(), serde_json::json!({
                    "detail_level": detail_level,
                    "code": task.context.code_content,
                    "file_path": task.context.file_path,
                })))
            }
            _ => {
                // Generic prompt for unsupported task types
                Ok(("prompt".to_string(), serde_json::json!({
                    "prompt": format!("{:?}", task.task_type),
                    "context": task.context.code_content,
                })))
            }
        }
    }

    /// Parse MCP tool result
    fn parse_mcp_result(
        &self,
        task: &EnhancedTask,
        result: ToolResult,
        duration_ms: u64,
    ) -> Result<EnhancedResult, AgentError> {
        let mut output = String::new();
        let mut code_changes = Vec::new();

        for item in result.content {
            match item {
                ContentItem::Text { text } => {
                    output.push_str(&text);
                }
                ContentItem::Resource { resource } => {
                    // Resource content often contains code changes
                    if let Some(text) = resource.text {
                        code_changes.push(CodeChange {
                            file_path: resource.uri,
                            change_type: ChangeType::Modify,
                            old_content: None,
                            new_content: Some(text),
                            line_start: None,
                            line_end: None,
                            before: None,
                            after: None,
                            line_range: None,
                        });
                    }
                }
                _ => {}
            }
        }

        // Parse code blocks from output for additional changes
        let parsed_changes = self.parse_code_blocks(&output);
        code_changes.extend(parsed_changes);

        Ok(EnhancedResult {
            task_id: task.id.clone(),
            status: if result.is_error {
                TaskStatus::Failed
            } else {
                TaskStatus::Completed
            },
            output,
            code_changes,
            confidence: if result.is_error { 0.0 } else { 0.85 },
            reasoning: None,
            suggested_followups: Vec::new(),
            metadata: ResultMetadata {
                tokens_used: None,
                duration_ms,
                model_used: Some(self.config.model.clone()),
                cost_cents: None,
                cache_hit: false,
            },
        })
    }

    /// Parse code blocks from output text
    fn parse_code_blocks(&self, output: &str) -> Vec<CodeChange> {
        let mut changes = Vec::new();
        let mut in_block = false;
        let mut current_file: Option<String> = None;
        let mut current_content = String::new();

        for line in output.lines() {
            if line.starts_with("```") {
                if in_block {
                    // End of block
                    if let Some(file) = current_file.take() {
                        changes.push(CodeChange {
                            file_path: file,
                            change_type: ChangeType::Modify,
                            old_content: None,
                            new_content: Some(current_content.trim().to_string()),
                            line_start: None,
                            line_end: None,
                            before: None,
                            after: None,
                            line_range: None,
                        });
                    }
                    current_content.clear();
                    in_block = false;
                } else {
                    // Start of block - check for filename
                    in_block = true;
                    let rest = line.trim_start_matches('`').trim();
                    if rest.contains('.') || rest.contains('/') {
                        current_file = Some(rest.to_string());
                    }
                }
            } else if in_block {
                current_content.push_str(line);
                current_content.push('\n');
            }
        }

        changes
    }

    /// Execute via CLI fallback
    async fn execute_via_cli(&self, task: &EnhancedTask) -> Result<EnhancedResult, AgentError> {
        use tokio::process::Command;
        use std::process::Stdio;

        let start = std::time::Instant::now();

        let prompt = self.build_cli_prompt(task);

        let mut cmd = Command::new(&self.config.cli_path);
        cmd.arg("-p")
            .arg(&prompt)
            .arg("--print")
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        if let Some(ref dir) = self.config.working_dir {
            cmd.current_dir(dir);
        } else if let Some(ref root) = task.context.project_root {
            cmd.current_dir(root);
        }

        let timeout = task.constraints.timeout_ms.unwrap_or(300000);
        let output = tokio::time::timeout(
            std::time::Duration::from_millis(timeout),
            cmd.output(),
        )
        .await
        .map_err(|_| AgentError::Timeout)?
        .map_err(|e| AgentError::ExecutionFailed(e.to_string()))?;

        let duration_ms = start.elapsed().as_millis() as u64;

        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout).to_string();
            let code_changes = self.parse_code_blocks(&stdout);

            Ok(EnhancedResult {
                task_id: task.id.clone(),
                status: TaskStatus::Completed,
                output: stdout,
                code_changes,
                confidence: 0.8,
                reasoning: None,
                suggested_followups: Vec::new(),
                metadata: ResultMetadata {
                    tokens_used: None,
                    duration_ms,
                    model_used: Some(self.config.model.clone()),
                    cost_cents: None,
                    cache_hit: false,
                },
            })
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();
            Err(AgentError::ExecutionFailed(stderr))
        }
    }

    fn build_cli_prompt(&self, task: &EnhancedTask) -> String {
        let base_prompt = match &task.task_type {
            TaskType::CodeGeneration { description, language } => {
                format!(
                    "Generate {} code: {}",
                    language.as_deref().unwrap_or(""),
                    description
                )
            }
            TaskType::CodeReview { focus_areas } => {
                let focus = if focus_areas.is_empty() {
                    String::new()
                } else {
                    format!(" focusing on: {}", focus_areas.join(", "))
                };
                format!(
                    "Review this code{}:\n\n```\n{}\n```",
                    focus,
                    task.context.code_content.as_deref().unwrap_or("")
                )
            }
            TaskType::BugFix { error_message, stack_trace } => {
                format!(
                    "Fix this bug:\nError: {}\n{}\n\nCode:\n```\n{}\n```",
                    error_message.as_deref().unwrap_or("Unknown error"),
                    stack_trace.as_ref().map(|s| format!("Stack trace:\n{}", s)).unwrap_or_default(),
                    task.context.code_content.as_deref().unwrap_or("")
                )
            }
            TaskType::Refactoring { refactor_type, scope } => {
                format!(
                    "Refactor ({}) in scope '{}' for:\n```\n{}\n```",
                    refactor_type,
                    scope.as_deref().unwrap_or("file"),
                    task.context.code_content.as_deref().unwrap_or("")
                )
            }
            TaskType::TestGeneration { test_type, coverage_target } => {
                format!(
                    "Generate {} tests targeting {}% coverage for:\n```\n{}\n```",
                    test_type,
                    coverage_target.unwrap_or(80.0),
                    task.context.code_content.as_deref().unwrap_or("")
                )
            }
            TaskType::Documentation { doc_type, format } => {
                format!(
                    "Generate {} documentation in {} format for:\n```\n{}\n```",
                    doc_type,
                    format.as_deref().unwrap_or("markdown"),
                    task.context.code_content.as_deref().unwrap_or("")
                )
            }
            TaskType::Explanation { detail_level } => {
                format!(
                    "Explain this code in {} detail:\n```\n{}\n```",
                    detail_level,
                    task.context.code_content.as_deref().unwrap_or("")
                )
            }
            _ => format!("{:?}", task.task_type),
        };

        // Add semantic context if available
        if let Some(ref semantic) = task.semantic_context {
            let mut enhanced = base_prompt;
            if !semantic.related_symbols.is_empty() {
                enhanced.push_str(&format!(
                    "\n\nRelated symbols: {}",
                    semantic.related_symbols.join(", ")
                ));
            }
            if !semantic.conventions.is_empty() {
                enhanced.push_str(&format!(
                    "\n\nFollow these conventions: {}",
                    semantic.conventions.join("; ")
                ));
            }
            enhanced
        } else {
            base_prompt
        }
    }
}

#[async_trait]
impl EnhancedAgentAdapter for ClaudeCodeMcpAgent {
    fn id(&self) -> &str {
        &self.id
    }

    fn name(&self) -> &str {
        "Claude Code"
    }

    async fn is_available(&self) -> bool {
        // Check CLI availability
        tokio::process::Command::new(&self.config.cli_path)
            .arg("--version")
            .output()
            .await
            .map(|o| o.status.success())
            .unwrap_or(false)
    }

    fn capabilities(&self) -> Vec<AgentCapability> {
        vec![
            AgentCapability::CodeGeneration,
            AgentCapability::CodeReview,
            AgentCapability::Refactoring,
            AgentCapability::TestGeneration,
            AgentCapability::Documentation,
            AgentCapability::BugFix,
            AgentCapability::Explanation,
            AgentCapability::FileOperations,
            AgentCapability::Git,
            AgentCapability::Terminal,
        ]
    }

    fn integration_type(&self) -> IntegrationType {
        if self.mcp_client.is_some() {
            IntegrationType::Mcp
        } else {
            IntegrationType::Cli
        }
    }

    async fn execute(&self, task: &EnhancedTask) -> Result<EnhancedResult, AgentError> {
        // Try MCP first if configured and connected
        if self.config.prefer_mcp && self.mcp_client.is_some() {
            match self.execute_via_mcp(task).await {
                Ok(result) => return Ok(result),
                Err(e) => {
                    eprintln!("MCP execution failed, falling back to CLI: {}", e);
                }
            }
        }

        // Fallback to CLI
        self.execute_via_cli(task).await
    }

    async fn execute_streaming(
        &self,
        task: &EnhancedTask,
        output_tx: mpsc::Sender<StreamChunk>,
    ) -> Result<EnhancedResult, AgentError> {
        use tokio::io::{AsyncBufReadExt, BufReader};
        use tokio::process::Command;
        use std::process::Stdio;

        let start = std::time::Instant::now();
        let prompt = self.build_cli_prompt(task);

        let mut cmd = Command::new(&self.config.cli_path);
        cmd.arg("-p")
            .arg(&prompt)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        if let Some(ref dir) = self.config.working_dir {
            cmd.current_dir(dir);
        }

        let mut child = cmd
            .spawn()
            .map_err(|e| AgentError::ExecutionFailed(e.to_string()))?;

        let stdout = child.stdout.take().ok_or_else(|| {
            AgentError::ExecutionFailed("Failed to capture stdout".into())
        })?;

        let mut reader = BufReader::new(stdout).lines();
        let mut full_output = String::new();

        while let Some(line) = reader
            .next_line()
            .await
            .map_err(|e| AgentError::ExecutionFailed(e.to_string()))?
        {
            full_output.push_str(&line);
            full_output.push('\n');
            let _ = output_tx.send(StreamChunk::Text(line)).await;
        }

        let status = child
            .wait()
            .await
            .map_err(|e| AgentError::ExecutionFailed(e.to_string()))?;

        let _ = output_tx.send(StreamChunk::Done).await;

        let duration_ms = start.elapsed().as_millis() as u64;

        if status.success() {
            let code_changes = self.parse_code_blocks(&full_output);
            Ok(EnhancedResult {
                task_id: task.id.clone(),
                status: TaskStatus::Completed,
                output: full_output,
                code_changes,
                confidence: 0.8,
                reasoning: None,
                suggested_followups: Vec::new(),
                metadata: ResultMetadata {
                    tokens_used: None,
                    duration_ms,
                    model_used: Some(self.config.model.clone()),
                    cost_cents: None,
                    cache_hit: false,
                },
            })
        } else {
            Err(AgentError::ExecutionFailed("Command failed".into()))
        }
    }

    async fn health_check(&self) -> AgentHealth {
        let start = std::time::Instant::now();
        let available = self.is_available().await;
        let latency = start.elapsed().as_millis() as u64;

        AgentHealth {
            available,
            latency_ms: Some(latency),
            error: if available { None } else { Some("CLI not found".into()) },
            rate_limit_remaining: None,
            version: None,
        }
    }

    fn estimate_cost(&self, task: &EnhancedTask) -> Option<CostEstimate> {
        // Estimate based on input/output tokens
        let input_tokens = task.context.code_content.as_ref().map(|c| c.len() / 4).unwrap_or(0);
        let output_estimate = task.constraints.max_tokens.unwrap_or(4096);

        // Claude Sonnet pricing: ~$3/1M input, ~$15/1M output
        let input_cost = (input_tokens as f64 * 0.003) as u32;
        let output_cost = (output_estimate as f64 * 0.015) as u32;

        Some(CostEstimate {
            min_cents: input_cost,
            max_cents: input_cost + output_cost,
            expected_cents: input_cost + (output_cost / 2),
        })
    }
}

// ============================================================================
// Anthropic Direct API Agent
// ============================================================================

/// Direct Anthropic API agent (for when CLI is not available)
pub struct AnthropicApiAgent {
    id: String,
    config: AnthropicApiConfig,
    client: reqwest::Client,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnthropicApiConfig {
    pub api_key: String,
    pub base_url: String,
    pub model: String,
    pub max_tokens: usize,
}

impl Default for AnthropicApiConfig {
    fn default() -> Self {
        Self {
            api_key: std::env::var("ANTHROPIC_API_KEY").unwrap_or_default(),
            base_url: "https://api.anthropic.com".to_string(),
            model: "claude-sonnet-4-20250514".to_string(),
            max_tokens: 8192,
        }
    }
}

impl AnthropicApiAgent {
    pub fn new(config: AnthropicApiConfig) -> Self {
        Self {
            id: "anthropic-api".to_string(),
            config,
            client: reqwest::Client::new(),
        }
    }

    async fn call_api(&self, messages: Vec<ApiMessage>) -> Result<ApiResponse, AgentError> {
        let request = serde_json::json!({
            "model": self.config.model,
            "max_tokens": self.config.max_tokens,
            "messages": messages,
        });

        let response = self.client
            .post(format!("{}/v1/messages", self.config.base_url))
            .header("x-api-key", &self.config.api_key)
            .header("anthropic-version", "2023-06-01")
            .header("content-type", "application/json")
            .json(&request)
            .send()
            .await
            .map_err(|e| AgentError::ConnectionFailed(e.to_string()))?;

        if response.status() == 429 {
            let retry_after = response
                .headers()
                .get("retry-after")
                .and_then(|v| v.to_str().ok())
                .and_then(|s| s.parse().ok())
                .unwrap_or(60000);
            return Err(AgentError::RateLimited { retry_after_ms: retry_after });
        }

        if !response.status().is_success() {
            let error = response.text().await.unwrap_or_default();
            return Err(AgentError::ExecutionFailed(error));
        }

        response
            .json::<ApiResponse>()
            .await
            .map_err(|e| AgentError::ParseError(e.to_string()))
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ApiMessage {
    role: String,
    content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ApiResponse {
    content: Vec<ApiContent>,
    usage: Option<ApiUsage>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ApiContent {
    #[serde(rename = "type")]
    content_type: String,
    text: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ApiUsage {
    input_tokens: usize,
    output_tokens: usize,
}

#[async_trait]
impl EnhancedAgentAdapter for AnthropicApiAgent {
    fn id(&self) -> &str {
        &self.id
    }

    fn name(&self) -> &str {
        "Anthropic API"
    }

    async fn is_available(&self) -> bool {
        !self.config.api_key.is_empty()
    }

    fn capabilities(&self) -> Vec<AgentCapability> {
        vec![
            AgentCapability::CodeGeneration,
            AgentCapability::CodeReview,
            AgentCapability::Refactoring,
            AgentCapability::Documentation,
            AgentCapability::Explanation,
        ]
    }

    fn integration_type(&self) -> IntegrationType {
        IntegrationType::DirectApi
    }

    async fn execute(&self, task: &EnhancedTask) -> Result<EnhancedResult, AgentError> {
        let start = std::time::Instant::now();

        let prompt = format!("{:?}\n\nContext:\n{}",
            task.task_type,
            task.context.code_content.as_deref().unwrap_or("")
        );

        let messages = vec![ApiMessage {
            role: "user".to_string(),
            content: prompt,
        }];

        let response = self.call_api(messages).await?;
        let duration_ms = start.elapsed().as_millis() as u64;

        let output = response.content
            .iter()
            .filter_map(|c| c.text.clone())
            .collect::<Vec<_>>()
            .join("\n");

        let tokens_used = response.usage.map(|u| u.input_tokens + u.output_tokens);

        Ok(EnhancedResult {
            task_id: task.id.clone(),
            status: TaskStatus::Completed,
            output,
            code_changes: Vec::new(),
            confidence: 0.85,
            reasoning: None,
            suggested_followups: Vec::new(),
            metadata: ResultMetadata {
                tokens_used,
                duration_ms,
                model_used: Some(self.config.model.clone()),
                cost_cents: None,
                cache_hit: false,
            },
        })
    }

    async fn execute_streaming(
        &self,
        task: &EnhancedTask,
        output_tx: mpsc::Sender<StreamChunk>,
    ) -> Result<EnhancedResult, AgentError> {
        // For now, use non-streaming API and send as single chunk
        let result = self.execute(task).await?;
        let _ = output_tx.send(StreamChunk::Text(result.output.clone())).await;
        let _ = output_tx.send(StreamChunk::Done).await;
        Ok(result)
    }

    async fn health_check(&self) -> AgentHealth {
        AgentHealth {
            available: self.is_available().await,
            latency_ms: None,
            error: None,
            rate_limit_remaining: None,
            version: Some(self.config.model.clone()),
        }
    }

    fn estimate_cost(&self, task: &EnhancedTask) -> Option<CostEstimate> {
        let input_tokens = task.context.code_content.as_ref().map(|c| c.len() / 4).unwrap_or(0);
        let output_estimate = task.constraints.max_tokens.unwrap_or(4096);

        let input_cost = (input_tokens as f64 * 0.003) as u32;
        let output_cost = (output_estimate as f64 * 0.015) as u32;

        Some(CostEstimate {
            min_cents: input_cost,
            max_cents: input_cost + output_cost,
            expected_cents: input_cost + (output_cost / 2),
        })
    }
}

// ============================================================================
// Agent Registry
// ============================================================================

/// Registry for managing enhanced agents
pub struct EnhancedAgentRegistry {
    agents: RwLock<HashMap<String, Arc<dyn EnhancedAgentAdapter>>>,
    default_agent: RwLock<Option<String>>,
}

impl EnhancedAgentRegistry {
    pub fn new() -> Self {
        Self {
            agents: RwLock::new(HashMap::new()),
            default_agent: RwLock::new(None),
        }
    }

    /// Register an agent
    pub async fn register(&self, agent: Arc<dyn EnhancedAgentAdapter>) {
        let id = agent.id().to_string();
        self.agents.write().await.insert(id, agent);
    }

    /// Set default agent
    pub async fn set_default(&self, agent_id: &str) {
        *self.default_agent.write().await = Some(agent_id.to_string());
    }

    /// Get an agent by ID
    pub async fn get(&self, agent_id: &str) -> Option<Arc<dyn EnhancedAgentAdapter>> {
        self.agents.read().await.get(agent_id).cloned()
    }

    /// Get the default agent
    pub async fn get_default(&self) -> Option<Arc<dyn EnhancedAgentAdapter>> {
        let default_id = self.default_agent.read().await.clone()?;
        self.get(&default_id).await
    }

    /// Find best agent for task
    pub async fn find_best_for(&self, task: &EnhancedTask) -> Option<Arc<dyn EnhancedAgentAdapter>> {
        let required_caps = &task.constraints.required_capabilities;
        let agents = self.agents.read().await;

        // Find agents with required capabilities
        let mut candidates: Vec<_> = agents
            .values()
            .filter(|agent| {
                let caps = agent.capabilities();
                required_caps.iter().all(|rc| caps.contains(rc))
            })
            .collect();

        if candidates.is_empty() {
            return None;
        }

        // Prefer MCP/API over CLI
        candidates.sort_by_key(|a| match a.integration_type() {
            IntegrationType::Mcp => 0,
            IntegrationType::DirectApi => 1,
            IntegrationType::Hybrid => 2,
            IntegrationType::Cli => 3,
        });

        candidates.first().map(|a| Arc::clone(a))
    }

    /// List all registered agents
    pub async fn list(&self) -> Vec<Arc<dyn EnhancedAgentAdapter>> {
        self.agents.read().await.values().cloned().collect()
    }

    /// Check health of all agents
    pub async fn health_check_all(&self) -> HashMap<String, AgentHealth> {
        let agents = self.agents.read().await;
        let mut results = HashMap::new();

        for (id, agent) in agents.iter() {
            results.insert(id.clone(), agent.health_check().await);
        }

        results
    }
}

impl Default for EnhancedAgentRegistry {
    fn default() -> Self {
        Self::new()
    }
}

/// Initialize registry with default agents
pub async fn create_default_registry() -> EnhancedAgentRegistry {
    let registry = EnhancedAgentRegistry::new();

    // Add Claude Code MCP agent
    let claude_config = ClaudeCodeConfig::default();
    let claude_agent = Arc::new(ClaudeCodeMcpAgent::new(claude_config));
    registry.register(claude_agent).await;

    // Add Anthropic API agent (fallback)
    let api_config = AnthropicApiConfig::default();
    if !api_config.api_key.is_empty() {
        let api_agent = Arc::new(AnthropicApiAgent::new(api_config));
        registry.register(api_agent).await;
    }

    // Set Claude Code as default
    registry.set_default("claude-code-mcp").await;

    registry
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_registry_creation() {
        let registry = EnhancedAgentRegistry::new();
        let agents = registry.list().await;
        assert!(agents.is_empty());
    }

    #[tokio::test]
    async fn test_claude_config_default() {
        let config = ClaudeCodeConfig::default();
        assert_eq!(config.cli_path, "claude");
        assert!(config.prefer_mcp);
    }
}
