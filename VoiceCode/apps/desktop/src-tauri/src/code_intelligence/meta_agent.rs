#![allow(dead_code, unused_variables, unused_imports)]
// Meta-Agent Orchestrator - VoiceCode as the orchestrator of orchestrators
// Enables delegation to external coding agents (Claude Code, Gemini CLI, Codex, Aider, etc.)
// Provides unified interface for multi-agent collaboration

use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::{Duration, Instant};
use serde::{Deserialize, Serialize};
use tokio::sync::{broadcast, RwLock};
use tokio::process::Command;
use uuid::Uuid;

use super::unified_context::{UnifiedContextEngine, UnifiedContextRequest};
use super::llm_client::LLMClient;

/// External agent types that VoiceCode can orchestrate
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ExternalAgentType {
    /// Anthropic's Claude Code CLI
    ClaudeCode,
    /// Google's Gemini CLI
    GeminiCLI,
    /// OpenAI's Codex CLI
    CodexCLI,
    /// Aider - AI pair programming
    Aider,
    /// GitHub Copilot CLI
    CopilotCLI,
    /// Cursor's AI
    Cursor,
    /// Sourcegraph Cody
    Cody,
    /// Amazon Q Developer
    AmazonQ,
    /// Custom/Generic CLI agent
    Custom(String),
}

impl ExternalAgentType {
    pub fn command(&self) -> &str {
        match self {
            Self::ClaudeCode => "claude",
            Self::GeminiCLI => "gemini",
            Self::CodexCLI => "codex",
            Self::Aider => "aider",
            Self::CopilotCLI => "gh copilot",
            Self::Cursor => "cursor",
            Self::Cody => "cody",
            Self::AmazonQ => "q",
            Self::Custom(cmd) => cmd,
        }
    }

    pub fn supports_streaming(&self) -> bool {
        matches!(self, Self::ClaudeCode | Self::Aider | Self::GeminiCLI | Self::CodexCLI)
    }

    pub fn supports_context_file(&self) -> bool {
        matches!(self, Self::ClaudeCode | Self::Aider | Self::Cursor)
    }
}

/// Configuration for an external agent
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExternalAgentConfig {
    pub agent_type: ExternalAgentType,
    pub enabled: bool,
    pub command_override: Option<String>,
    pub args: Vec<String>,
    pub env_vars: HashMap<String, String>,
    pub timeout_secs: u64,
    pub max_retries: u32,
    pub working_dir: Option<PathBuf>,
    pub api_key_env: Option<String>,
    pub model_override: Option<String>,
    pub capabilities: Vec<AgentCapability>,
}

impl Default for ExternalAgentConfig {
    fn default() -> Self {
        Self {
            agent_type: ExternalAgentType::ClaudeCode,
            enabled: true,
            command_override: None,
            args: Vec::new(),
            env_vars: HashMap::new(),
            timeout_secs: 300,
            max_retries: 2,
            working_dir: None,
            api_key_env: None,
            model_override: None,
            capabilities: vec![
                AgentCapability::CodeGeneration,
                AgentCapability::CodeReview,
                AgentCapability::Debugging,
                AgentCapability::Refactoring,
            ],
        }
    }
}

/// Capabilities that an agent can have
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AgentCapability {
    CodeGeneration,
    CodeReview,
    Debugging,
    Refactoring,
    Testing,
    Documentation,
    Explanation,
    Planning,
    Security,
    Performance,
    Architecture,
    FileOperations,
    GitOperations,
    ShellCommands,
}

/// Task to be executed by an agent
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentTask {
    pub id: String,
    pub task_type: TaskType,
    pub description: String,
    pub context: TaskContext,
    pub constraints: Vec<String>,
    pub priority: TaskPriority,
    pub timeout_secs: Option<u64>,
    pub created_at: u64,
}

/// Type of task
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum TaskType {
    Generate,
    Review,
    Fix,
    Refactor,
    Test,
    Document,
    Explain,
    Plan,
    Execute,
    Research,
}

/// Task priority
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
pub enum TaskPriority {
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4,
}

/// Context provided to the agent
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct TaskContext {
    pub project_root: Option<PathBuf>,
    pub current_file: Option<PathBuf>,
    pub cursor_position: Option<(usize, usize)>,
    pub selection: Option<String>,
    pub related_files: Vec<PathBuf>,
    pub unified_context: Option<String>,
    pub additional_instructions: Option<String>,
}

/// Result from an agent execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentResult {
    pub task_id: String,
    pub agent_type: ExternalAgentType,
    pub success: bool,
    pub output: String,
    pub code_changes: Vec<CodeChange>,
    pub suggestions: Vec<String>,
    pub error: Option<String>,
    pub execution_time_ms: u64,
    pub tokens_used: Option<u64>,
    pub cost_estimate: Option<f64>,
}

/// A code change produced by an agent
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodeChange {
    pub file_path: PathBuf,
    pub change_type: ChangeType,
    pub old_content: Option<String>,
    pub new_content: String,
    pub start_line: Option<usize>,
    pub end_line: Option<usize>,
    pub description: String,
}

/// Type of code change
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum ChangeType {
    Create,
    Modify,
    Delete,
    Rename,
}

/// Collaboration strategy for multi-agent tasks
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CollaborationStrategy {
    /// Use a single agent
    Single(ExternalAgentType),
    /// Try agents in sequence until one succeeds
    Fallback(Vec<ExternalAgentType>),
    /// Run agents in parallel, pick best result
    Competitive(Vec<ExternalAgentType>),
    /// Run agents in sequence, each building on previous
    Pipeline(Vec<PipelineStage>),
    /// One agent leads, others review
    LeadAndReview {
        lead: ExternalAgentType,
        reviewers: Vec<ExternalAgentType>,
    },
    /// Voting consensus among agents
    Ensemble {
        agents: Vec<ExternalAgentType>,
        min_agreement: f32,
    },
    /// VoiceCode decides based on task type
    Auto,
}

/// A stage in a pipeline
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PipelineStage {
    pub name: String,
    pub agent: ExternalAgentType,
    pub task_type: TaskType,
    pub transform_output: bool,
}

/// Events from the meta-agent orchestrator
#[derive(Debug, Clone)]
pub enum MetaAgentEvent {
    TaskQueued { task_id: String },
    AgentSelected { task_id: String, agent: ExternalAgentType },
    AgentStarted { task_id: String, agent: ExternalAgentType },
    AgentProgress { task_id: String, agent: ExternalAgentType, progress: String },
    AgentCompleted { task_id: String, agent: ExternalAgentType, success: bool },
    TaskCompleted { task_id: String, result: AgentResult },
    Error { task_id: String, error: String },
}

/// The Meta-Agent Orchestrator
pub struct MetaAgentOrchestrator {
    /// Available external agents
    agents: RwLock<HashMap<ExternalAgentType, ExternalAgentConfig>>,
    /// Unified context engine
    context_engine: Option<Arc<UnifiedContextEngine>>,
    /// LLM client for internal decisions
    llm_client: Option<Arc<LLMClient>>,
    /// Event broadcaster
    event_tx: broadcast::Sender<MetaAgentEvent>,
    /// Task queue
    task_queue: RwLock<Vec<AgentTask>>,
    /// Active tasks
    active_tasks: RwLock<HashMap<String, AgentTask>>,
    /// Task results
    results: RwLock<HashMap<String, AgentResult>>,
    /// Default working directory
    default_working_dir: PathBuf,
    /// Configuration
    config: MetaAgentConfig,
}

/// Configuration for the meta-agent orchestrator
#[derive(Debug, Clone)]
pub struct MetaAgentConfig {
    /// Default collaboration strategy
    pub default_strategy: CollaborationStrategy,
    /// Maximum concurrent agents
    pub max_concurrent: usize,
    /// Default timeout
    pub default_timeout_secs: u64,
    /// Auto-detect available agents
    pub auto_detect_agents: bool,
    /// Use context engine for all tasks
    pub use_context_engine: bool,
    /// Preferred agent for each task type
    pub task_preferences: HashMap<TaskType, ExternalAgentType>,
}

impl Default for MetaAgentConfig {
    fn default() -> Self {
        Self {
            default_strategy: CollaborationStrategy::Auto,
            max_concurrent: 3,
            default_timeout_secs: 300,
            auto_detect_agents: true,
            use_context_engine: true,
            task_preferences: HashMap::from([
                (TaskType::Generate, ExternalAgentType::ClaudeCode),
                (TaskType::Review, ExternalAgentType::GeminiCLI),
                (TaskType::Fix, ExternalAgentType::ClaudeCode),
                (TaskType::Test, ExternalAgentType::CodexCLI),
                (TaskType::Explain, ExternalAgentType::GeminiCLI),
            ]),
        }
    }
}

impl MetaAgentOrchestrator {
    pub fn new(working_dir: PathBuf, config: MetaAgentConfig) -> Self {
        let (event_tx, _) = broadcast::channel(100);

        Self {
            agents: RwLock::new(HashMap::new()),
            context_engine: None,
            llm_client: None,
            event_tx,
            task_queue: RwLock::new(Vec::new()),
            active_tasks: RwLock::new(HashMap::new()),
            results: RwLock::new(HashMap::new()),
            default_working_dir: working_dir,
            config,
        }
    }

    pub fn with_context_engine(mut self, engine: Arc<UnifiedContextEngine>) -> Self {
        self.context_engine = Some(engine);
        self
    }

    pub fn with_llm(mut self, client: Arc<LLMClient>) -> Self {
        self.llm_client = Some(client);
        self
    }

    /// Subscribe to orchestrator events
    pub fn subscribe(&self) -> broadcast::Receiver<MetaAgentEvent> {
        self.event_tx.subscribe()
    }

    /// Detect and register available agents
    pub async fn detect_agents(&self) -> Vec<ExternalAgentType> {
        let mut available = Vec::new();

        let agents_to_check = vec![
            (ExternalAgentType::ClaudeCode, "claude"),
            (ExternalAgentType::GeminiCLI, "gemini"),
            (ExternalAgentType::CodexCLI, "codex"),
            (ExternalAgentType::Aider, "aider"),
            (ExternalAgentType::CopilotCLI, "gh"),
            (ExternalAgentType::Cody, "cody"),
        ];

        for (agent_type, command) in agents_to_check {
            if self.is_command_available(command).await {
                available.push(agent_type.clone());
                
                let config = ExternalAgentConfig {
                    agent_type: agent_type.clone(),
                    ..Default::default()
                };
                self.register_agent(config).await;
            }
        }

        available
    }

    /// Check if a command is available in PATH
    async fn is_command_available(&self, command: &str) -> bool {
        which::which(command).is_ok()
    }

    /// Register an external agent
    pub async fn register_agent(&self, config: ExternalAgentConfig) {
        self.agents.write().await.insert(config.agent_type.clone(), config);
    }

    /// Get registered agents
    pub async fn get_agents(&self) -> Vec<ExternalAgentType> {
        self.agents.read().await.keys().cloned().collect()
    }

    /// Execute a task with the specified strategy
    pub async fn execute_task(
        &self,
        task: AgentTask,
        strategy: Option<CollaborationStrategy>,
    ) -> Result<AgentResult, String> {
        let strategy = strategy.unwrap_or_else(|| self.config.default_strategy.clone());
        let task_id = task.id.clone();

        let _ = self.event_tx.send(MetaAgentEvent::TaskQueued {
            task_id: task_id.clone(),
        });

        // Store task as active
        self.active_tasks.write().await.insert(task_id.clone(), task.clone());

        // Build context if engine available
        let enriched_task = if self.config.use_context_engine {
            self.enrich_task_context(task).await?
        } else {
            task
        };

        // Execute based on strategy
        let result = match strategy {
            CollaborationStrategy::Single(agent) => {
                self.execute_single(&enriched_task, agent).await
            }
            CollaborationStrategy::Fallback(agents) => {
                self.execute_fallback(&enriched_task, agents).await
            }
            CollaborationStrategy::Competitive(agents) => {
                self.execute_competitive(&enriched_task, agents).await
            }
            CollaborationStrategy::Pipeline(stages) => {
                self.execute_pipeline(&enriched_task, stages).await
            }
            CollaborationStrategy::LeadAndReview { lead, reviewers } => {
                self.execute_lead_review(&enriched_task, lead, reviewers).await
            }
            CollaborationStrategy::Ensemble { agents, min_agreement } => {
                self.execute_ensemble(&enriched_task, agents, min_agreement).await
            }
            CollaborationStrategy::Auto => {
                self.execute_auto(&enriched_task).await
            }
        };

        // Store result and clean up
        self.active_tasks.write().await.remove(&task_id);
        
        if let Ok(ref res) = result {
            self.results.write().await.insert(task_id.clone(), res.clone());
            let _ = self.event_tx.send(MetaAgentEvent::TaskCompleted {
                task_id,
                result: res.clone(),
            });
        }

        result
    }

    /// Enrich task context using the unified context engine
    async fn enrich_task_context(&self, mut task: AgentTask) -> Result<AgentTask, String> {
        if let Some(ref engine) = self.context_engine {
            let request = UnifiedContextRequest {
                current_file: task.context.current_file.clone(),
                cursor_position: task.context.cursor_position,
                selection: task.context.selection.clone(),
                query: Some(task.description.clone()),
                include_history: true,
                ..Default::default()
            };

            let context = engine.build_context(request).await?;
            task.context.unified_context = Some(engine.format_for_llm(&context));
        }

        Ok(task)
    }

    /// Execute with a single agent
    async fn execute_single(
        &self,
        task: &AgentTask,
        agent_type: ExternalAgentType,
    ) -> Result<AgentResult, String> {
        let _ = self.event_tx.send(MetaAgentEvent::AgentSelected {
            task_id: task.id.clone(),
            agent: agent_type.clone(),
        });

        let agents = self.agents.read().await;
        let config = agents.get(&agent_type)
            .ok_or_else(|| format!("Agent {:?} not registered", agent_type))?;

        self.invoke_agent(task, config).await
    }

    /// Execute with fallback - try agents until one succeeds
    async fn execute_fallback(
        &self,
        task: &AgentTask,
        agents: Vec<ExternalAgentType>,
    ) -> Result<AgentResult, String> {
        let mut last_error = String::new();

        for agent_type in agents {
            match self.execute_single(task, agent_type.clone()).await {
                Ok(result) if result.success => return Ok(result),
                Ok(result) => {
                    last_error = result.error.unwrap_or_else(|| "Unknown error".to_string());
                }
                Err(e) => {
                    last_error = e;
                }
            }
        }

        Err(format!("All agents failed. Last error: {}", last_error))
    }

    /// Execute competitively - run in parallel, pick best
    async fn execute_competitive(
        &self,
        task: &AgentTask,
        agents: Vec<ExternalAgentType>,
    ) -> Result<AgentResult, String> {
        let mut handles = Vec::new();
        let agents_lock = self.agents.read().await;

        for agent_type in agents {
            if let Some(config) = agents_lock.get(&agent_type).cloned() {
                let task_clone = task.clone();
                let event_tx = self.event_tx.clone();
                let input = self.build_agent_input(&task_clone, &config);
                let working_dir = config.working_dir.clone()
                    .or_else(|| task_clone.context.project_root.clone())
                    .unwrap_or_else(|| self.default_working_dir.clone());

                let handle = tokio::spawn(async move {
                    let start = Instant::now();
                    let task_id = task_clone.id.clone();

                    let _ = event_tx.send(MetaAgentEvent::AgentStarted {
                        task_id: task_id.clone(),
                        agent: config.agent_type.clone(),
                    });

                    let command = config.command_override.as_deref()
                        .unwrap_or_else(|| config.agent_type.command());

                    let mut cmd = Command::new(command);
                    cmd.current_dir(&working_dir);
                    for arg in &config.args {
                        cmd.arg(arg);
                    }
                    for (key, value) in &config.env_vars {
                        cmd.env(key, value);
                    }
                    cmd.arg("--print");
                    cmd.arg(&input);

                    let timeout = Duration::from_secs(config.timeout_secs);
                    let output = tokio::time::timeout(timeout, cmd.output()).await;

                    let execution_time_ms = start.elapsed().as_millis() as u64;

                    match output {
                        Ok(Ok(output)) => {
                            let _ = event_tx.send(MetaAgentEvent::AgentCompleted {
                                task_id: task_id.clone(),
                                agent: config.agent_type.clone(),
                                success: output.status.success(),
                            });

                            let stdout = String::from_utf8_lossy(&output.stdout).to_string();
                            let stderr = String::from_utf8_lossy(&output.stderr).to_string();

                            if output.status.success() {
                                // Parse code changes from output
                                let code_changes = Self::parse_code_changes_static(&stdout);
                                AgentResult {
                                    task_id,
                                    agent_type: config.agent_type.clone(),
                                    success: true,
                                    output: stdout,
                                    code_changes,
                                    suggestions: Vec::new(),
                                    error: None,
                                    execution_time_ms,
                                    tokens_used: None,
                                    cost_estimate: None,
                                }
                            } else {
                                AgentResult {
                                    task_id,
                                    agent_type: config.agent_type.clone(),
                                    success: false,
                                    output: stdout,
                                    code_changes: Vec::new(),
                                    suggestions: Vec::new(),
                                    error: Some(if stderr.is_empty() { "Unknown error".to_string() } else { stderr }),
                                    execution_time_ms,
                                    tokens_used: None,
                                    cost_estimate: None,
                                }
                            }
                        }
                        Ok(Err(e)) => {
                            let _ = event_tx.send(MetaAgentEvent::AgentCompleted {
                                task_id: task_id.clone(),
                                agent: config.agent_type.clone(),
                                success: false,
                            });
                            AgentResult {
                                task_id,
                                agent_type: config.agent_type.clone(),
                                success: false,
                                output: String::new(),
                                code_changes: Vec::new(),
                                suggestions: Vec::new(),
                                error: Some(format!("Failed to execute agent: {}", e)),
                                execution_time_ms,
                                tokens_used: None,
                                cost_estimate: None,
                            }
                        }
                        Err(_) => {
                            let _ = event_tx.send(MetaAgentEvent::AgentCompleted {
                                task_id: task_id.clone(),
                                agent: config.agent_type.clone(),
                                success: false,
                            });
                            AgentResult {
                                task_id,
                                agent_type: config.agent_type.clone(),
                                success: false,
                                output: String::new(),
                                code_changes: Vec::new(),
                                suggestions: Vec::new(),
                                error: Some("Agent execution timed out".to_string()),
                                execution_time_ms,
                                tokens_used: None,
                                cost_estimate: None,
                            }
                        }
                    }
                });
                handles.push(handle);
            }
        }
        drop(agents_lock);

        // Wait for all to complete and collect results
        let mut results = Vec::new();
        for handle in handles {
            if let Ok(result) = handle.await {
                results.push(result);
            }
        }

        // Pick the best result: prefer successful with longest output (more thorough)
        results.sort_by(|a, b| {
            match (a.success, b.success) {
                (true, false) => std::cmp::Ordering::Less,
                (false, true) => std::cmp::Ordering::Greater,
                _ => b.output.len().cmp(&a.output.len()),
            }
        });

        results.into_iter()
            .next()
            .ok_or_else(|| "No agents available for competitive execution".to_string())
    }

    /// Execute as pipeline - each stage builds on previous
    async fn execute_pipeline(
        &self,
        task: &AgentTask,
        stages: Vec<PipelineStage>,
    ) -> Result<AgentResult, String> {
        let mut current_task = task.clone();
        let mut final_result: Option<AgentResult> = None;

        for stage in stages {
            // Update task type for this stage
            current_task.task_type = stage.task_type;
            
            let result = self.execute_single(&current_task, stage.agent).await?;
            
            if !result.success {
                return Ok(result);
            }

            // Transform output for next stage if needed
            if stage.transform_output {
                current_task.context.additional_instructions = Some(result.output.clone());
            }

            final_result = Some(result);
        }

        final_result.ok_or_else(|| "Pipeline produced no results".to_string())
    }

    /// Execute with lead and review pattern
    async fn execute_lead_review(
        &self,
        task: &AgentTask,
        lead: ExternalAgentType,
        reviewers: Vec<ExternalAgentType>,
    ) -> Result<AgentResult, String> {
        // Lead generates the solution
        let lead_result = self.execute_single(task, lead).await?;
        
        if !lead_result.success {
            return Ok(lead_result);
        }

        // Create review task
        let review_task = AgentTask {
            id: Uuid::new_v4().to_string(),
            task_type: TaskType::Review,
            description: format!("Review this code:\n{}", lead_result.output),
            context: task.context.clone(),
            constraints: vec!["Focus on correctness and best practices".to_string()],
            priority: task.priority,
            timeout_secs: task.timeout_secs,
            created_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        };

        // Collect reviews
        let mut reviews = Vec::new();
        for reviewer in reviewers {
            if let Ok(review) = self.execute_single(&review_task, reviewer).await {
                reviews.push(review);
            }
        }

        // Combine lead result with review feedback
        let mut combined_suggestions: Vec<String> = lead_result.suggestions.clone();
        for review in &reviews {
            combined_suggestions.extend(review.suggestions.clone());
        }

        Ok(AgentResult {
            suggestions: combined_suggestions,
            ..lead_result
        })
    }

    /// Execute with ensemble voting
    async fn execute_ensemble(
        &self,
        task: &AgentTask,
        agents: Vec<ExternalAgentType>,
        min_agreement: f32,
    ) -> Result<AgentResult, String> {
        // Run all agents
        let results = self.execute_competitive(task, agents).await;
        
        // In a full implementation, we'd analyze results and vote
        // For now, just return the first successful result
        results
    }

    /// Auto-select strategy based on task type
    async fn execute_auto(&self, task: &AgentTask) -> Result<AgentResult, String> {
        // Get preferred agent for task type
        let preferred = self.config.task_preferences
            .get(&task.task_type)
            .cloned()
            .unwrap_or(ExternalAgentType::ClaudeCode);

        // Build fallback list
        let available = self.get_agents().await;
        let mut fallback: Vec<ExternalAgentType> = vec![preferred.clone()];
        
        for agent in available {
            if agent != preferred && !fallback.contains(&agent) {
                fallback.push(agent);
            }
        }

        self.execute_fallback(task, fallback).await
    }

    /// Invoke an external agent
    async fn invoke_agent(
        &self,
        task: &AgentTask,
        config: &ExternalAgentConfig,
    ) -> Result<AgentResult, String> {
        let start = Instant::now();
        let task_id = task.id.clone();

        let _ = self.event_tx.send(MetaAgentEvent::AgentStarted {
            task_id: task_id.clone(),
            agent: config.agent_type.clone(),
        });

        // Build command
        let command = config.command_override.as_ref()
            .map(|s| s.as_str())
            .unwrap_or_else(|| config.agent_type.command());

        let working_dir = config.working_dir.as_ref()
            .or(task.context.project_root.as_ref())
            .unwrap_or(&self.default_working_dir);

        // Build prompt/input for the agent
        let input = self.build_agent_input(task, config);

        // Execute command
        let mut cmd = Command::new(command);
        cmd.current_dir(working_dir);
        
        // Add arguments
        for arg in &config.args {
            cmd.arg(arg);
        }

        // Add environment variables
        for (key, value) in &config.env_vars {
            cmd.env(key, value);
        }

        // Add the prompt/task
        cmd.arg("--print"); // Many CLI agents have a print mode
        cmd.arg(&input);

        // Set timeout
        let timeout = Duration::from_secs(config.timeout_secs);

        // Execute with timeout
        let output = tokio::time::timeout(timeout, cmd.output())
            .await
            .map_err(|_| "Agent execution timed out".to_string())?
            .map_err(|e| format!("Failed to execute agent: {}", e))?;

        let execution_time_ms = start.elapsed().as_millis() as u64;

        let _ = self.event_tx.send(MetaAgentEvent::AgentCompleted {
            task_id: task_id.clone(),
            agent: config.agent_type.clone(),
            success: output.status.success(),
        });

        // Parse output
        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();

        if output.status.success() {
            let code_changes = self.parse_code_changes(&stdout);
            
            Ok(AgentResult {
                task_id,
                agent_type: config.agent_type.clone(),
                success: true,
                output: stdout,
                code_changes,
                suggestions: Vec::new(),
                error: None,
                execution_time_ms,
                tokens_used: None,
                cost_estimate: None,
            })
        } else {
            Ok(AgentResult {
                task_id,
                agent_type: config.agent_type.clone(),
                success: false,
                output: stdout,
                code_changes: Vec::new(),
                suggestions: Vec::new(),
                error: Some(if stderr.is_empty() { "Unknown error".to_string() } else { stderr }),
                execution_time_ms,
                tokens_used: None,
                cost_estimate: None,
            })
        }
    }

    /// Build input for an external agent
    fn build_agent_input(&self, task: &AgentTask, _config: &ExternalAgentConfig) -> String {
        let mut input = String::new();

        // Add context if available
        if let Some(ref context) = task.context.unified_context {
            input.push_str(context);
            input.push_str("\n\n");
        }

        // Add task description
        input.push_str(&format!("Task: {}\n", task.description));

        // Add constraints
        if !task.constraints.is_empty() {
            input.push_str("\nConstraints:\n");
            for constraint in &task.constraints {
                input.push_str(&format!("- {}\n", constraint));
            }
        }

        // Add current file context
        if let Some(ref file) = task.context.current_file {
            input.push_str(&format!("\nCurrent file: {}\n", file.display()));
        }

        // Add selection
        if let Some(ref selection) = task.context.selection {
            input.push_str(&format!("\nSelected code:\n```\n{}\n```\n", selection));
        }

        input
    }

    /// Parse code changes from agent output
    fn parse_code_changes(&self, output: &str) -> Vec<CodeChange> {
        Self::parse_code_changes_static(output)
    }

    /// Parse code changes from agent output (static version for use in spawned tasks)
    fn parse_code_changes_static(output: &str) -> Vec<CodeChange> {
        let mut changes = Vec::new();

        // Look for common patterns in agent output
        // Pattern: ```filename\n...code...\n```
        let re = regex::Regex::new(r"```(\S+)\n([\s\S]*?)```").ok();

        if let Some(re) = re {
            for cap in re.captures_iter(output) {
                if let (Some(filename), Some(content)) = (cap.get(1), cap.get(2)) {
                    changes.push(CodeChange {
                        file_path: PathBuf::from(filename.as_str()),
                        change_type: ChangeType::Modify,
                        old_content: None,
                        new_content: content.as_str().to_string(),
                        start_line: None,
                        end_line: None,
                        description: "Generated by agent".to_string(),
                    });
                }
            }
        }

        changes
    }

    /// Create a simple task
    pub fn create_task(
        &self,
        task_type: TaskType,
        description: &str,
        current_file: Option<PathBuf>,
    ) -> AgentTask {
        AgentTask {
            id: Uuid::new_v4().to_string(),
            task_type,
            description: description.to_string(),
            context: TaskContext {
                project_root: Some(self.default_working_dir.clone()),
                current_file,
                ..Default::default()
            },
            constraints: Vec::new(),
            priority: TaskPriority::Medium,
            timeout_secs: Some(self.config.default_timeout_secs),
            created_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        }
    }

    /// Get task result by ID
    pub async fn get_result(&self, task_id: &str) -> Option<AgentResult> {
        self.results.read().await.get(task_id).cloned()
    }
}

/// Presets for common collaboration patterns
pub struct CollaborationPresets;

impl CollaborationPresets {
    /// Quality assurance pipeline: Claude generates, Gemini reviews, Codex tests
    pub fn qa_pipeline() -> CollaborationStrategy {
        CollaborationStrategy::Pipeline(vec![
            PipelineStage {
                name: "Generate".to_string(),
                agent: ExternalAgentType::ClaudeCode,
                task_type: TaskType::Generate,
                transform_output: true,
            },
            PipelineStage {
                name: "Review".to_string(),
                agent: ExternalAgentType::GeminiCLI,
                task_type: TaskType::Review,
                transform_output: true,
            },
            PipelineStage {
                name: "Test".to_string(),
                agent: ExternalAgentType::CodexCLI,
                task_type: TaskType::Test,
                transform_output: false,
            },
        ])
    }

    /// Research then implement: Gemini researches, Claude implements
    pub fn research_implement() -> CollaborationStrategy {
        CollaborationStrategy::Pipeline(vec![
            PipelineStage {
                name: "Research".to_string(),
                agent: ExternalAgentType::GeminiCLI,
                task_type: TaskType::Research,
                transform_output: true,
            },
            PipelineStage {
                name: "Implement".to_string(),
                agent: ExternalAgentType::ClaudeCode,
                task_type: TaskType::Generate,
                transform_output: false,
            },
        ])
    }

    /// Code review with multiple reviewers
    pub fn multi_review() -> CollaborationStrategy {
        CollaborationStrategy::LeadAndReview {
            lead: ExternalAgentType::ClaudeCode,
            reviewers: vec![
                ExternalAgentType::GeminiCLI,
                ExternalAgentType::CodexCLI,
            ],
        }
    }

    /// Competitive generation - best result wins
    pub fn competitive() -> CollaborationStrategy {
        CollaborationStrategy::Competitive(vec![
            ExternalAgentType::ClaudeCode,
            ExternalAgentType::GeminiCLI,
            ExternalAgentType::CodexCLI,
        ])
    }
}

// Tauri commands

pub async fn detect_external_agents() -> Result<Vec<String>, String> {
    let orchestrator = MetaAgentOrchestrator::new(
        std::env::current_dir().unwrap_or_default(),
        MetaAgentConfig::default(),
    );
    
    let agents = orchestrator.detect_agents().await;
    Ok(agents.into_iter().map(|a| format!("{:?}", a)).collect())
}

#[tauri::command]
pub async fn execute_with_agent(
    agent: String,
    task_description: String,
    current_file: Option<String>,
) -> Result<AgentResult, String> {
    Err("Meta-agent orchestrator not initialized".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_agent_type_command() {
        assert_eq!(ExternalAgentType::ClaudeCode.command(), "claude");
        assert_eq!(ExternalAgentType::GeminiCLI.command(), "gemini");
        assert_eq!(ExternalAgentType::Aider.command(), "aider");
    }

    #[test]
    fn test_collaboration_presets() {
        let qa = CollaborationPresets::qa_pipeline();
        match qa {
            CollaborationStrategy::Pipeline(stages) => {
                assert_eq!(stages.len(), 3);
            }
            _ => panic!("Expected Pipeline strategy"),
        }
    }

    #[test]
    fn test_task_creation() {
        let orchestrator = MetaAgentOrchestrator::new(
            PathBuf::from("/tmp"),
            MetaAgentConfig::default(),
        );

        let task = orchestrator.create_task(
            TaskType::Generate,
            "Create a hello world function",
            None,
        );

        assert!(!task.id.is_empty());
        assert_eq!(task.task_type, TaskType::Generate);
    }
}
