// Multi-Agent Collaboration System
// Enables collaborative and sequential task execution across external AI agents
// Supports Claude Code, Gemini CLI, Codex CLI, and custom agents

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::process::Command;
use tokio::sync::{mpsc, RwLock, Semaphore};

// ============================================================================
// External Agent Types
// ============================================================================

/// Supported external AI agents
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ExternalAgentType {
    /// Anthropic's Claude Code CLI
    ClaudeCode,
    /// Google's Gemini CLI
    GeminiCli,
    /// OpenAI's Codex CLI
    CodexCli,
    /// GitHub Copilot CLI
    CopilotCli,
    /// Aider (open source)
    Aider,
    /// Continue.dev
    ContinueDev,
    /// Custom/Generic CLI agent
    Custom,
}

impl ExternalAgentType {
    /// Get the default command for this agent type
    pub fn default_command(&self) -> &'static str {
        match self {
            ExternalAgentType::ClaudeCode => "claude",
            ExternalAgentType::GeminiCli => "gemini",
            ExternalAgentType::CodexCli => "codex",
            ExternalAgentType::CopilotCli => "gh copilot",
            ExternalAgentType::Aider => "aider",
            ExternalAgentType::ContinueDev => "continue",
            ExternalAgentType::Custom => "agent",
        }
    }

    /// Get agent capabilities
    pub fn capabilities(&self) -> Vec<AgentCapability> {
        match self {
            ExternalAgentType::ClaudeCode => vec![
                AgentCapability::CodeGeneration,
                AgentCapability::CodeReview,
                AgentCapability::Refactoring,
                AgentCapability::Testing,
                AgentCapability::Documentation,
                AgentCapability::Debugging,
                AgentCapability::Planning,
                AgentCapability::FileOperations,
                AgentCapability::GitOperations,
                AgentCapability::ShellExecution,
            ],
            ExternalAgentType::GeminiCli => vec![
                AgentCapability::CodeGeneration,
                AgentCapability::CodeReview,
                AgentCapability::Refactoring,
                AgentCapability::Documentation,
                AgentCapability::Planning,
                AgentCapability::WebSearch,
                AgentCapability::FileOperations,
                AgentCapability::GitOperations,
            ],
            ExternalAgentType::CodexCli => vec![
                AgentCapability::CodeGeneration,
                AgentCapability::CodeReview,
                AgentCapability::Refactoring,
                AgentCapability::Testing,
                AgentCapability::Debugging,
                AgentCapability::FileOperations,
                AgentCapability::ShellExecution,
            ],
            ExternalAgentType::CopilotCli => vec![
                AgentCapability::CodeGeneration,
                AgentCapability::ShellExecution,
                AgentCapability::GitOperations,
            ],
            ExternalAgentType::Aider => vec![
                AgentCapability::CodeGeneration,
                AgentCapability::Refactoring,
                AgentCapability::GitOperations,
                AgentCapability::FileOperations,
            ],
            ExternalAgentType::ContinueDev => vec![
                AgentCapability::CodeGeneration,
                AgentCapability::CodeReview,
                AgentCapability::Documentation,
            ],
            ExternalAgentType::Custom => vec![AgentCapability::CodeGeneration],
        }
    }

    /// Best use cases for each agent
    pub fn best_for(&self) -> Vec<TaskCategory> {
        match self {
            ExternalAgentType::ClaudeCode => vec![
                TaskCategory::ComplexRefactoring,
                TaskCategory::ArchitectureDesign,
                TaskCategory::CodeReview,
                TaskCategory::BugFixing,
                TaskCategory::Testing,
            ],
            ExternalAgentType::GeminiCli => vec![
                TaskCategory::Research,
                TaskCategory::Documentation,
                TaskCategory::CodeGeneration,
                TaskCategory::Planning,
            ],
            ExternalAgentType::CodexCli => vec![
                TaskCategory::CodeGeneration,
                TaskCategory::Scripting,
                TaskCategory::QuickFixes,
                TaskCategory::Testing,
            ],
            ExternalAgentType::CopilotCli => vec![
                TaskCategory::QuickFixes,
                TaskCategory::Scripting,
                TaskCategory::GitOperations,
            ],
            ExternalAgentType::Aider => vec![
                TaskCategory::CodeGeneration,
                TaskCategory::Refactoring,
                TaskCategory::GitOperations,
            ],
            ExternalAgentType::ContinueDev => {
                vec![TaskCategory::CodeGeneration, TaskCategory::Documentation]
            }
            ExternalAgentType::Custom => vec![],
        }
    }
}

/// Agent capabilities
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AgentCapability {
    CodeGeneration,
    CodeReview,
    Refactoring,
    Testing,
    Documentation,
    Debugging,
    Planning,
    WebSearch,
    FileOperations,
    GitOperations,
    ShellExecution,
    ImageAnalysis,
    VoiceInput,
}

/// Task categories for agent assignment
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TaskCategory {
    CodeGeneration,
    CodeReview,
    ComplexRefactoring,
    ArchitectureDesign,
    BugFixing,
    Testing,
    Documentation,
    Research,
    Planning,
    Scripting,
    QuickFixes,
    GitOperations,
    Security,
    Performance,
}

// ============================================================================
// Agent Configuration
// ============================================================================

/// Configuration for an external agent
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExternalAgentConfig {
    /// Agent identifier
    pub id: String,
    /// Agent type
    pub agent_type: ExternalAgentType,
    /// Display name
    pub name: String,
    /// Command to invoke the agent
    pub command: String,
    /// Default arguments
    pub default_args: Vec<String>,
    /// Environment variables
    pub env: HashMap<String, String>,
    /// Working directory (if different from project)
    pub working_dir: Option<PathBuf>,
    /// Timeout for agent responses (milliseconds)
    pub timeout_ms: u64,
    /// Whether agent supports streaming output
    pub supports_streaming: bool,
    /// Whether agent supports interactive mode
    pub supports_interactive: bool,
    /// Input format
    pub input_format: AgentInputFormat,
    /// Output parsing strategy
    pub output_parser: OutputParserType,
    /// Maximum concurrent instances
    pub max_instances: usize,
    /// Priority (higher = preferred)
    pub priority: i32,
    /// Whether agent is enabled
    pub enabled: bool,
}

impl Default for ExternalAgentConfig {
    fn default() -> Self {
        Self {
            id: "custom".to_string(),
            agent_type: ExternalAgentType::Custom,
            name: "Custom Agent".to_string(),
            command: "agent".to_string(),
            default_args: Vec::new(),
            env: HashMap::new(),
            working_dir: None,
            timeout_ms: 300000, // 5 minutes
            supports_streaming: false,
            supports_interactive: false,
            input_format: AgentInputFormat::PlainText,
            output_parser: OutputParserType::PlainText,
            max_instances: 1,
            priority: 0,
            enabled: true,
        }
    }
}

impl ExternalAgentConfig {
    /// Create Claude Code configuration
    pub fn claude_code() -> Self {
        Self {
            id: "claude-code".to_string(),
            agent_type: ExternalAgentType::ClaudeCode,
            name: "Claude Code".to_string(),
            command: "claude".to_string(),
            default_args: vec!["--print".to_string()],
            env: HashMap::new(),
            working_dir: None,
            timeout_ms: 600000, // 10 minutes
            supports_streaming: true,
            supports_interactive: true,
            input_format: AgentInputFormat::PlainText,
            output_parser: OutputParserType::ClaudeCode,
            max_instances: 3,
            priority: 100,
            enabled: true,
        }
    }

    /// Create Gemini CLI configuration
    pub fn gemini_cli() -> Self {
        Self {
            id: "gemini-cli".to_string(),
            agent_type: ExternalAgentType::GeminiCli,
            name: "Gemini CLI".to_string(),
            command: "gemini".to_string(),
            default_args: vec![],
            env: HashMap::new(),
            working_dir: None,
            timeout_ms: 300000,
            supports_streaming: true,
            supports_interactive: true,
            input_format: AgentInputFormat::PlainText,
            output_parser: OutputParserType::GeminiCli,
            max_instances: 3,
            priority: 90,
            enabled: true,
        }
    }

    /// Create Codex CLI configuration
    pub fn codex_cli() -> Self {
        Self {
            id: "codex-cli".to_string(),
            agent_type: ExternalAgentType::CodexCli,
            name: "Codex CLI".to_string(),
            command: "codex".to_string(),
            default_args: vec![],
            env: HashMap::new(),
            working_dir: None,
            timeout_ms: 300000,
            supports_streaming: true,
            supports_interactive: true,
            input_format: AgentInputFormat::PlainText,
            output_parser: OutputParserType::CodexCli,
            max_instances: 3,
            priority: 85,
            enabled: true,
        }
    }

    /// Create Aider configuration
    pub fn aider() -> Self {
        Self {
            id: "aider".to_string(),
            agent_type: ExternalAgentType::Aider,
            name: "Aider".to_string(),
            command: "aider".to_string(),
            default_args: vec!["--yes".to_string(), "--no-auto-commits".to_string()],
            env: HashMap::new(),
            working_dir: None,
            timeout_ms: 300000,
            supports_streaming: true,
            supports_interactive: true,
            input_format: AgentInputFormat::PlainText,
            output_parser: OutputParserType::Aider,
            max_instances: 1,
            priority: 70,
            enabled: true,
        }
    }
}

/// Input format for agent communication
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AgentInputFormat {
    PlainText,
    Markdown,
    Json,
    Xml,
}

/// Output parser types
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum OutputParserType {
    PlainText,
    ClaudeCode,
    GeminiCli,
    CodexCli,
    Aider,
    Json,
    Markdown,
}

// ============================================================================
// Collaboration Modes
// ============================================================================

/// How agents collaborate on tasks
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CollaborationMode {
    /// Agents work on same task sequentially (output of one feeds next)
    Sequential(SequentialConfig),
    /// Agents work on different parts simultaneously
    Parallel(ParallelConfig),
    /// One agent leads, others review/QC
    LeadAndReview(LeadReviewConfig),
    /// Agents compete, best result wins
    Competitive(CompetitiveConfig),
    /// Specialized roles (planner, coder, reviewer, tester)
    Pipeline(PipelineConfig),
    /// Ensemble voting on decisions
    Ensemble(EnsembleConfig),
    /// Round-robin assignment
    RoundRobin(RoundRobinConfig),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SequentialConfig {
    /// Order of agents
    pub agent_order: Vec<String>,
    /// Pass full output or summary between agents
    pub pass_full_output: bool,
    /// Stop on first success
    pub stop_on_success: bool,
    /// Maximum iterations
    pub max_iterations: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParallelConfig {
    /// Agents to run in parallel
    pub agents: Vec<String>,
    /// How to merge results
    pub merge_strategy: MergeStrategy,
    /// Wait for all or first success
    pub wait_strategy: WaitStrategy,
    /// File/directory partitioning
    pub partition: Option<PartitionStrategy>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LeadReviewConfig {
    /// Primary agent doing the work
    pub lead_agent: String,
    /// Agents reviewing the work
    pub reviewers: Vec<String>,
    /// Require all reviewers to approve
    pub require_all_approvals: bool,
    /// Number of review iterations
    pub max_review_rounds: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompetitiveConfig {
    /// Competing agents
    pub agents: Vec<String>,
    /// How to select winner
    pub selection_criteria: SelectionCriteria,
    /// Timeout for competition
    pub timeout_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PipelineConfig {
    /// Pipeline stages with assigned agents
    pub stages: Vec<PipelineStage>,
    /// Allow parallel execution within stage
    pub parallel_within_stage: bool,
    /// Rollback on failure
    pub rollback_on_failure: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PipelineStage {
    pub name: String,
    pub agent: String,
    pub task_type: TaskCategory,
    pub required: bool,
    pub timeout_ms: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnsembleConfig {
    /// Agents in ensemble
    pub agents: Vec<String>,
    /// Voting threshold (0.0 - 1.0)
    pub threshold: f32,
    /// Weight per agent
    pub weights: HashMap<String, f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoundRobinConfig {
    /// Agents in rotation
    pub agents: Vec<String>,
    /// Tasks per agent before rotation
    pub tasks_per_agent: usize,
    /// Skip unavailable agents
    pub skip_unavailable: bool,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MergeStrategy {
    /// Concatenate all outputs
    Concatenate,
    /// Use AI to merge intelligently
    AiMerge,
    /// Take first successful
    FirstSuccess,
    /// Vote on conflicts
    Vote,
    /// Manual review required
    ManualReview,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum WaitStrategy {
    /// Wait for all agents to complete
    All,
    /// Return when first agent succeeds
    FirstSuccess,
    /// Return when majority complete
    Majority,
    /// Return after timeout
    Timeout,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PartitionStrategy {
    /// Partition by file
    ByFile(Vec<FileAssignment>),
    /// Partition by directory
    ByDirectory(Vec<DirectoryAssignment>),
    /// Partition by task type
    ByTaskType(HashMap<TaskCategory, String>),
    /// Automatic partitioning
    Auto,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileAssignment {
    pub pattern: String,
    pub agent: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DirectoryAssignment {
    pub path: PathBuf,
    pub agent: String,
    pub recursive: bool,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SelectionCriteria {
    /// First to complete successfully
    FirstComplete,
    /// Best quality score
    BestQuality,
    /// Shortest output (for refactoring)
    Shortest,
    /// Most comprehensive
    MostComprehensive,
    /// User selection
    UserChoice,
}

// ============================================================================
// Task Definition
// ============================================================================

/// A task to be executed by agents
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CollaborativeTask {
    /// Unique task ID
    pub id: String,
    /// Task description/prompt
    pub prompt: String,
    /// Task category
    pub category: TaskCategory,
    /// Files involved
    pub files: Vec<PathBuf>,
    /// Collaboration mode
    pub collaboration: CollaborationMode,
    /// Context to provide
    pub context: TaskContext,
    /// Priority (higher = more urgent)
    pub priority: i32,
    /// Parent task ID (for subtasks)
    pub parent_id: Option<String>,
    /// Dependencies (task IDs that must complete first)
    pub dependencies: Vec<String>,
    /// Deadline (optional)
    pub deadline: Option<Instant>,
    /// Metadata
    pub metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct TaskContext {
    /// Project description
    pub project_description: Option<String>,
    /// Relevant file contents
    pub file_contents: HashMap<PathBuf, String>,
    /// Previous task results
    pub previous_results: Vec<TaskResult>,
    /// User preferences
    pub preferences: HashMap<String, String>,
    /// Constraints
    pub constraints: Vec<String>,
}

/// Result from a task execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskResult {
    pub task_id: String,
    pub agent_id: String,
    pub status: TaskStatus,
    pub output: String,
    pub file_changes: Vec<FileChange>,
    pub duration_ms: u64,
    pub tokens_used: Option<u64>,
    pub quality_score: Option<f32>,
    pub review_comments: Vec<ReviewComment>,
    pub error: Option<String>,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TaskStatus {
    Pending,
    Running,
    Completed,
    Failed,
    Cancelled,
    NeedsReview,
    Approved,
    Rejected,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileChange {
    pub path: PathBuf,
    pub change_type: FileChangeType,
    pub old_content: Option<String>,
    pub new_content: Option<String>,
    pub diff: Option<String>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum FileChangeType {
    Created,
    Modified,
    Deleted,
    Renamed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReviewComment {
    pub reviewer: String,
    pub comment: String,
    pub severity: ReviewSeverity,
    pub file: Option<PathBuf>,
    pub line: Option<usize>,
    pub suggestion: Option<String>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ReviewSeverity {
    Info,
    Warning,
    Error,
    Critical,
}

// ============================================================================
// Agent Instance
// ============================================================================

/// Running instance of an external agent
pub struct AgentInstance {
    pub id: String,
    pub config: ExternalAgentConfig,
    pub status: RwLock<AgentInstanceStatus>,
    pub current_task: RwLock<Option<String>>,
    pub output_buffer: RwLock<String>,
    pub start_time: Instant,
    pub process_handle: RwLock<Option<tokio::process::Child>>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AgentInstanceStatus {
    Idle,
    Running,
    Waiting,
    Error,
    Terminated,
}

impl AgentInstance {
    pub fn new(config: ExternalAgentConfig) -> Self {
        Self {
            id: format!("{}-{}", config.id, uuid::Uuid::new_v4()),
            config,
            status: RwLock::new(AgentInstanceStatus::Idle),
            current_task: RwLock::new(None),
            output_buffer: RwLock::new(String::new()),
            start_time: Instant::now(),
            process_handle: RwLock::new(None),
        }
    }

    /// Execute a prompt
    pub async fn execute(&self, prompt: &str, working_dir: &PathBuf) -> Result<String, AgentError> {
        *self.status.write().await = AgentInstanceStatus::Running;

        let mut cmd = Command::new(&self.config.command);
        cmd.args(&self.config.default_args);
        cmd.current_dir(working_dir);

        // Set environment variables
        for (key, value) in &self.config.env {
            cmd.env(key, value);
        }

        // Prepare input
        let input = match self.config.input_format {
            AgentInputFormat::PlainText => prompt.to_string(),
            AgentInputFormat::Markdown => format!("```\n{}\n```", prompt),
            AgentInputFormat::Json => serde_json::json!({ "prompt": prompt }).to_string(),
            AgentInputFormat::Xml => format!("<prompt>{}</prompt>", prompt),
        };

        // For CLI agents, we typically pass as argument or stdin
        cmd.arg(&input);

        cmd.stdin(std::process::Stdio::piped());
        cmd.stdout(std::process::Stdio::piped());
        cmd.stderr(std::process::Stdio::piped());

        let output =
            tokio::time::timeout(Duration::from_millis(self.config.timeout_ms), cmd.output())
                .await
                .map_err(|_| AgentError::Timeout)?
                .map_err(|e| AgentError::ExecutionFailed(e.to_string()))?;

        *self.status.write().await = AgentInstanceStatus::Idle;

        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout).to_string();
            *self.output_buffer.write().await = stdout.clone();
            Ok(stdout)
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();
            Err(AgentError::ExecutionFailed(stderr))
        }
    }

    /// Check if agent is available
    pub async fn is_available(&self) -> bool {
        *self.status.read().await == AgentInstanceStatus::Idle
    }

    /// Terminate the agent
    pub async fn terminate(&self) -> Result<(), AgentError> {
        if let Some(mut handle) = self.process_handle.write().await.take() {
            handle
                .kill()
                .await
                .map_err(|e| AgentError::ExecutionFailed(e.to_string()))?;
        }
        *self.status.write().await = AgentInstanceStatus::Terminated;
        Ok(())
    }
}

#[derive(Debug, Clone)]
pub enum AgentError {
    NotFound(String),
    NotAvailable(String),
    ExecutionFailed(String),
    Timeout,
    ConfigurationError(String),
    CommunicationError(String),
    ParseError(String),
}

impl std::fmt::Display for AgentError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AgentError::NotFound(name) => write!(f, "Agent not found: {}", name),
            AgentError::NotAvailable(name) => write!(f, "Agent not available: {}", name),
            AgentError::ExecutionFailed(msg) => write!(f, "Execution failed: {}", msg),
            AgentError::Timeout => write!(f, "Agent execution timed out"),
            AgentError::ConfigurationError(msg) => write!(f, "Configuration error: {}", msg),
            AgentError::CommunicationError(msg) => write!(f, "Communication error: {}", msg),
            AgentError::ParseError(msg) => write!(f, "Parse error: {}", msg),
        }
    }
}

impl std::error::Error for AgentError {}

// ============================================================================
// Multi-Agent Orchestrator
// ============================================================================

/// Orchestrates multiple external agents for collaborative work
pub struct MultiAgentOrchestrator {
    /// Agent configurations
    configs: RwLock<HashMap<String, ExternalAgentConfig>>,
    /// Running agent instances
    instances: RwLock<HashMap<String, Arc<AgentInstance>>>,
    /// Task queue
    task_queue: RwLock<Vec<CollaborativeTask>>,
    /// Task results
    results: RwLock<HashMap<String, TaskResult>>,
    /// Concurrency limiter
    semaphore: Arc<Semaphore>,
    /// Event channel
    event_tx: mpsc::Sender<OrchestratorEvent>,
    event_rx: RwLock<Option<mpsc::Receiver<OrchestratorEvent>>>,
    /// Working directory
    working_dir: RwLock<PathBuf>,
    /// Auto-select agents based on task
    auto_assign: RwLock<bool>,
}

#[derive(Debug, Clone)]
pub enum OrchestratorEvent {
    TaskQueued(String),
    TaskStarted(String, String), // task_id, agent_id
    TaskCompleted(String, TaskStatus),
    AgentStarted(String),
    AgentStopped(String),
    ReviewRequired(String, String),        // task_id, reviewer_id
    ConflictDetected(String, Vec<String>), // task_id, conflicting agents
    Error(String, String),                 // task_id, error message
}

impl MultiAgentOrchestrator {
    pub fn new() -> Self {
        let (event_tx, event_rx) = mpsc::channel(100);

        Self {
            configs: RwLock::new(HashMap::new()),
            instances: RwLock::new(HashMap::new()),
            task_queue: RwLock::new(Vec::new()),
            results: RwLock::new(HashMap::new()),
            semaphore: Arc::new(Semaphore::new(10)), // Max 10 concurrent agents
            event_tx,
            event_rx: RwLock::new(Some(event_rx)),
            working_dir: RwLock::new(std::env::current_dir().unwrap_or_default()),
            auto_assign: RwLock::new(true),
        }
    }

    /// Register default agents
    pub async fn register_defaults(&self) {
        self.register_agent(ExternalAgentConfig::claude_code())
            .await;
        self.register_agent(ExternalAgentConfig::gemini_cli()).await;
        self.register_agent(ExternalAgentConfig::codex_cli()).await;
        self.register_agent(ExternalAgentConfig::aider()).await;
    }

    /// Register an agent configuration
    pub async fn register_agent(&self, config: ExternalAgentConfig) {
        self.configs.write().await.insert(config.id.clone(), config);
    }

    /// Unregister an agent
    pub async fn unregister_agent(&self, agent_id: &str) {
        self.configs.write().await.remove(agent_id);
    }

    /// Set working directory
    pub async fn set_working_dir(&self, path: PathBuf) {
        *self.working_dir.write().await = path;
    }

    /// Get available agents for a task category
    pub async fn get_agents_for_category(
        &self,
        category: TaskCategory,
    ) -> Vec<ExternalAgentConfig> {
        let configs = self.configs.read().await;
        let mut suitable: Vec<_> = configs
            .values()
            .filter(|c| c.enabled && c.agent_type.best_for().contains(&category))
            .cloned()
            .collect();

        suitable.sort_by(|a, b| b.priority.cmp(&a.priority));
        suitable
    }

    /// Auto-select best agent for a task
    pub async fn select_best_agent(&self, task: &CollaborativeTask) -> Option<String> {
        let agents = self.get_agents_for_category(task.category).await;
        agents.first().map(|a| a.id.clone())
    }

    /// Submit a task for execution
    pub async fn submit_task(&self, task: CollaborativeTask) -> Result<String, AgentError> {
        let task_id = task.id.clone();
        self.task_queue.write().await.push(task);
        let _ = self
            .event_tx
            .send(OrchestratorEvent::TaskQueued(task_id.clone()))
            .await;
        Ok(task_id)
    }

    /// Execute a task with specified collaboration mode
    pub async fn execute_task(&self, task: CollaborativeTask) -> Result<TaskResult, AgentError> {
        let task_id = task.id.clone();
        let working_dir = self.working_dir.read().await.clone();

        match &task.collaboration {
            CollaborationMode::Sequential(config) => {
                self.execute_sequential(&task, config, &working_dir).await
            }
            CollaborationMode::Parallel(config) => {
                self.execute_parallel(&task, config, &working_dir).await
            }
            CollaborationMode::LeadAndReview(config) => {
                self.execute_lead_review(&task, config, &working_dir).await
            }
            CollaborationMode::Pipeline(config) => {
                self.execute_pipeline(&task, config, &working_dir).await
            }
            CollaborationMode::Competitive(config) => {
                self.execute_competitive(&task, config, &working_dir).await
            }
            CollaborationMode::Ensemble(config) => {
                self.execute_ensemble(&task, config, &working_dir).await
            }
            CollaborationMode::RoundRobin(config) => {
                self.execute_round_robin(&task, config, &working_dir).await
            }
        }
    }

    /// Sequential execution: agents work one after another
    async fn execute_sequential(
        &self,
        task: &CollaborativeTask,
        config: &SequentialConfig,
        working_dir: &PathBuf,
    ) -> Result<TaskResult, AgentError> {
        let start = Instant::now();
        let mut current_output = task.prompt.clone();
        let mut all_changes = Vec::new();
        let mut last_agent = String::new();

        for (iteration, agent_id) in config.agent_order.iter().enumerate() {
            if iteration >= config.max_iterations {
                break;
            }

            let instance = self.get_or_create_instance(agent_id).await?;
            last_agent = agent_id.clone();

            let _ = self
                .event_tx
                .send(OrchestratorEvent::TaskStarted(
                    task.id.clone(),
                    agent_id.clone(),
                ))
                .await;

            let prompt = if config.pass_full_output || iteration == 0 {
                current_output.clone()
            } else {
                // Summarize previous output
                format!(
                    "Previous agent output summary:\n{}\n\nContinue with: {}",
                    self.summarize_output(&current_output),
                    task.prompt
                )
            };

            match instance.execute(&prompt, working_dir).await {
                Ok(output) => {
                    current_output = output;
                    // Parse file changes from output
                    let changes = self.parse_file_changes(&current_output);
                    all_changes.extend(changes);

                    if config.stop_on_success {
                        break;
                    }
                }
                Err(e) => {
                    if !config.stop_on_success {
                        continue; // Try next agent
                    }
                    return Err(e);
                }
            }
        }

        Ok(TaskResult {
            task_id: task.id.clone(),
            agent_id: last_agent,
            status: TaskStatus::Completed,
            output: current_output,
            file_changes: all_changes,
            duration_ms: start.elapsed().as_millis() as u64,
            tokens_used: None,
            quality_score: None,
            review_comments: Vec::new(),
            error: None,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        })
    }

    /// Parallel execution: agents work simultaneously
    async fn execute_parallel(
        &self,
        task: &CollaborativeTask,
        config: &ParallelConfig,
        working_dir: &PathBuf,
    ) -> Result<TaskResult, AgentError> {
        let start = Instant::now();
        let mut handles = Vec::new();

        for agent_id in &config.agents {
            let instance = self.get_or_create_instance(agent_id).await?;
            let prompt = task.prompt.clone();
            let wd = working_dir.clone();
            let task_id = task.id.clone();
            let aid = agent_id.clone();
            let tx = self.event_tx.clone();

            let handle = tokio::spawn(async move {
                let _ = tx
                    .send(OrchestratorEvent::TaskStarted(task_id, aid.clone()))
                    .await;
                let result = instance.execute(&prompt, &wd).await;
                (aid, result)
            });

            handles.push(handle);
        }

        // Collect results based on wait strategy
        let mut results = Vec::new();
        for handle in handles {
            if let Ok((agent_id, result)) = handle.await {
                results.push((agent_id, result));

                match config.wait_strategy {
                    WaitStrategy::FirstSuccess => {
                        if results.last().map(|(_, r)| r.is_ok()).unwrap_or(false) {
                            break;
                        }
                    }
                    WaitStrategy::Majority => {
                        let success_count = results.iter().filter(|(_, r)| r.is_ok()).count();
                        if success_count > config.agents.len() / 2 {
                            break;
                        }
                    }
                    _ => {}
                }
            }
        }

        // Merge results
        let merged_output = self.merge_results(&results, &config.merge_strategy);
        let all_changes: Vec<FileChange> = results
            .iter()
            .filter_map(|(_, r)| r.as_ref().ok())
            .flat_map(|o| self.parse_file_changes(o))
            .collect();

        Ok(TaskResult {
            task_id: task.id.clone(),
            agent_id: "parallel".to_string(),
            status: TaskStatus::Completed,
            output: merged_output,
            file_changes: all_changes,
            duration_ms: start.elapsed().as_millis() as u64,
            tokens_used: None,
            quality_score: None,
            review_comments: Vec::new(),
            error: None,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        })
    }

    /// Lead and review: one agent does work, others review
    async fn execute_lead_review(
        &self,
        task: &CollaborativeTask,
        config: &LeadReviewConfig,
        working_dir: &PathBuf,
    ) -> Result<TaskResult, AgentError> {
        let start = Instant::now();
        let mut current_output;
        let mut review_comments = Vec::new();

        // Lead agent does the work
        let lead_instance = self.get_or_create_instance(&config.lead_agent).await?;
        current_output = lead_instance.execute(&task.prompt, working_dir).await?;

        // Review rounds
        for round in 0..config.max_review_rounds {
            let mut approvals = 0;
            let mut round_comments = Vec::new();

            for reviewer_id in &config.reviewers {
                let reviewer = self.get_or_create_instance(reviewer_id).await?;
                let review_prompt = format!(
                    "Review the following code/output and provide feedback:\n\n{}\n\n\
                     Original task: {}\n\n\
                     Respond with APPROVED if acceptable, or provide specific improvement suggestions.",
                    current_output,
                    task.prompt
                );

                if let Ok(review) = reviewer.execute(&review_prompt, working_dir).await {
                    if review.to_uppercase().contains("APPROVED") {
                        approvals += 1;
                    } else {
                        round_comments.push(ReviewComment {
                            reviewer: reviewer_id.clone(),
                            comment: review.clone(),
                            severity: ReviewSeverity::Warning,
                            file: None,
                            line: None,
                            suggestion: Some(review),
                        });
                    }
                }
            }

            review_comments.extend(round_comments.clone());

            // Check approval
            let needed = if config.require_all_approvals {
                config.reviewers.len()
            } else {
                (config.reviewers.len() + 1) / 2
            };

            if approvals >= needed {
                break;
            }

            // If not approved and more rounds available, revise
            if round < config.max_review_rounds - 1 && !round_comments.is_empty() {
                let revision_prompt = format!(
                    "Revise based on these review comments:\n{}\n\nOriginal output:\n{}",
                    round_comments
                        .iter()
                        .map(|c| &c.comment)
                        .cloned()
                        .collect::<Vec<_>>()
                        .join("\n"),
                    current_output
                );
                current_output = lead_instance.execute(&revision_prompt, working_dir).await?;
            }
        }

        Ok(TaskResult {
            task_id: task.id.clone(),
            agent_id: config.lead_agent.clone(),
            status: TaskStatus::Completed,
            output: current_output.clone(),
            file_changes: self.parse_file_changes(&current_output),
            duration_ms: start.elapsed().as_millis() as u64,
            tokens_used: None,
            quality_score: None,
            review_comments,
            error: None,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        })
    }

    /// Pipeline execution: specialized stages
    async fn execute_pipeline(
        &self,
        task: &CollaborativeTask,
        config: &PipelineConfig,
        working_dir: &PathBuf,
    ) -> Result<TaskResult, AgentError> {
        let start = Instant::now();
        let mut current_context = task.prompt.clone();
        let mut all_changes = Vec::new();
        let mut completed_stages = Vec::new();

        for stage in &config.stages {
            let instance = self.get_or_create_instance(&stage.agent).await?;

            let stage_prompt = format!(
                "Stage: {}\nTask Type: {:?}\n\nContext:\n{}\n\nOriginal Request: {}",
                stage.name, stage.task_type, current_context, task.prompt
            );

            let timeout = stage.timeout_ms.unwrap_or(300000);
            let result = tokio::time::timeout(
                Duration::from_millis(timeout),
                instance.execute(&stage_prompt, working_dir),
            )
            .await;

            match result {
                Ok(Ok(output)) => {
                    current_context = output.clone();
                    all_changes.extend(self.parse_file_changes(&output));
                    completed_stages.push(stage.name.clone());
                }
                Ok(Err(e)) | Err(_) => {
                    if stage.required {
                        if config.rollback_on_failure {
                            // Rollback logic would go here
                        }
                        return Err(AgentError::ExecutionFailed(format!(
                            "Required stage '{}' failed",
                            stage.name
                        )));
                    }
                }
            }
        }

        Ok(TaskResult {
            task_id: task.id.clone(),
            agent_id: "pipeline".to_string(),
            status: TaskStatus::Completed,
            output: current_context,
            file_changes: all_changes,
            duration_ms: start.elapsed().as_millis() as u64,
            tokens_used: None,
            quality_score: None,
            review_comments: Vec::new(),
            error: None,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        })
    }

    /// Competitive execution: agents race, best wins
    async fn execute_competitive(
        &self,
        task: &CollaborativeTask,
        config: &CompetitiveConfig,
        working_dir: &PathBuf,
    ) -> Result<TaskResult, AgentError> {
        let start = Instant::now();
        let mut handles = Vec::new();

        for agent_id in &config.agents {
            let instance = self.get_or_create_instance(agent_id).await?;
            let prompt = task.prompt.clone();
            let wd = working_dir.clone();
            let aid = agent_id.clone();

            let handle = tokio::spawn(async move {
                let result = instance.execute(&prompt, &wd).await;
                (aid, result, Instant::now())
            });

            handles.push(handle);
        }

        // Collect all results
        let mut results = Vec::new();
        let timeout = Duration::from_millis(config.timeout_ms);

        for handle in handles {
            if let Ok(result) = tokio::time::timeout(timeout, handle).await {
                if let Ok(r) = result {
                    results.push(r);
                }
            }
        }

        // Select winner based on criteria
        let winner = match config.selection_criteria {
            SelectionCriteria::FirstComplete => results
                .into_iter()
                .filter(|(_, r, _)| r.is_ok())
                .min_by_key(|(_, _, t)| *t),
            SelectionCriteria::Shortest => results
                .into_iter()
                .filter(|(_, r, _)| r.is_ok())
                .min_by_key(|(_, r, _)| r.as_ref().map(|s| s.len()).unwrap_or(usize::MAX)),
            SelectionCriteria::MostComprehensive => results
                .into_iter()
                .filter(|(_, r, _)| r.is_ok())
                .max_by_key(|(_, r, _)| r.as_ref().map(|s| s.len()).unwrap_or(0)),
            _ => results.into_iter().find(|(_, r, _)| r.is_ok()),
        };

        match winner {
            Some((agent_id, Ok(output), _)) => Ok(TaskResult {
                task_id: task.id.clone(),
                agent_id,
                status: TaskStatus::Completed,
                output: output.clone(),
                file_changes: self.parse_file_changes(&output),
                duration_ms: start.elapsed().as_millis() as u64,
                tokens_used: None,
                quality_score: None,
                review_comments: Vec::new(),
                error: None,
                timestamp: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
            }),
            _ => Err(AgentError::ExecutionFailed(
                "No agent completed successfully".into(),
            )),
        }
    }

    /// Ensemble execution: voting/consensus
    async fn execute_ensemble(
        &self,
        task: &CollaborativeTask,
        config: &EnsembleConfig,
        working_dir: &PathBuf,
    ) -> Result<TaskResult, AgentError> {
        let start = Instant::now();
        let mut votes: HashMap<String, f32> = HashMap::new();
        let mut outputs: HashMap<String, String> = HashMap::new();

        for agent_id in &config.agents {
            let instance = self.get_or_create_instance(agent_id).await?;
            let weight = config.weights.get(agent_id).copied().unwrap_or(1.0);

            if let Ok(output) = instance.execute(&task.prompt, working_dir).await {
                outputs.insert(agent_id.clone(), output.clone());

                // Simple voting: hash the output to group similar responses
                let vote_key = self.hash_output(&output);
                *votes.entry(vote_key).or_insert(0.0) += weight;
            }
        }

        // Find consensus
        let total_weight: f32 = config.weights.values().sum();
        let threshold_weight = total_weight * config.threshold;

        let consensus = votes
            .iter()
            .find(|(_, &weight)| weight >= threshold_weight)
            .map(|(k, _)| k.clone());

        // Get output matching consensus
        let final_output = if let Some(consensus_hash) = consensus {
            outputs
                .iter()
                .find(|(_, o)| self.hash_output(o) == consensus_hash)
                .map(|(_, o)| o.clone())
                .unwrap_or_default()
        } else {
            // No consensus - use highest voted
            outputs.values().next().cloned().unwrap_or_default()
        };

        Ok(TaskResult {
            task_id: task.id.clone(),
            agent_id: "ensemble".to_string(),
            status: TaskStatus::Completed,
            output: final_output.clone(),
            file_changes: self.parse_file_changes(&final_output),
            duration_ms: start.elapsed().as_millis() as u64,
            tokens_used: None,
            quality_score: None,
            review_comments: Vec::new(),
            error: None,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        })
    }

    /// Round-robin execution
    async fn execute_round_robin(
        &self,
        task: &CollaborativeTask,
        config: &RoundRobinConfig,
        working_dir: &PathBuf,
    ) -> Result<TaskResult, AgentError> {
        // For single task, just use first available agent
        for agent_id in &config.agents {
            if let Ok(instance) = self.get_or_create_instance(agent_id).await {
                if instance.is_available().await {
                    let output = instance.execute(&task.prompt, working_dir).await?;
                    return Ok(TaskResult {
                        task_id: task.id.clone(),
                        agent_id: agent_id.clone(),
                        status: TaskStatus::Completed,
                        output: output.clone(),
                        file_changes: self.parse_file_changes(&output),
                        duration_ms: 0,
                        tokens_used: None,
                        quality_score: None,
                        review_comments: Vec::new(),
                        error: None,
                        timestamp: std::time::SystemTime::now()
                            .duration_since(std::time::UNIX_EPOCH)
                            .unwrap()
                            .as_secs(),
                    });
                }
            }
        }

        Err(AgentError::NotAvailable("No agents available".into()))
    }

    /// Get or create an agent instance
    async fn get_or_create_instance(
        &self,
        agent_id: &str,
    ) -> Result<Arc<AgentInstance>, AgentError> {
        // Check existing instances
        if let Some(instance) = self.instances.read().await.get(agent_id) {
            if instance.is_available().await {
                return Ok(instance.clone());
            }
        }

        // Get config
        let config = self
            .configs
            .read()
            .await
            .get(agent_id)
            .cloned()
            .ok_or_else(|| AgentError::NotFound(agent_id.to_string()))?;

        // Create new instance
        let instance = Arc::new(AgentInstance::new(config));
        self.instances
            .write()
            .await
            .insert(agent_id.to_string(), instance.clone());

        Ok(instance)
    }

    /// Helper: summarize output for context passing
    fn summarize_output(&self, output: &str) -> String {
        if output.len() <= 500 {
            output.to_string()
        } else {
            format!(
                "{}...[truncated]...{}",
                &output[..250],
                &output[output.len() - 250..]
            )
        }
    }

    /// Helper: parse file changes from output
    fn parse_file_changes(&self, _output: &str) -> Vec<FileChange> {
        // TODO: Implement actual parsing based on agent output format
        Vec::new()
    }

    /// Helper: merge results from parallel execution
    fn merge_results(
        &self,
        results: &[(String, Result<String, AgentError>)],
        strategy: &MergeStrategy,
    ) -> String {
        match strategy {
            MergeStrategy::Concatenate => results
                .iter()
                .filter_map(|(id, r)| r.as_ref().ok().map(|o| format!("=== {} ===\n{}", id, o)))
                .collect::<Vec<_>>()
                .join("\n\n"),
            MergeStrategy::FirstSuccess => results
                .iter()
                .find_map(|(_, r)| r.as_ref().ok().cloned())
                .unwrap_or_default(),
            _ => {
                // Default to concatenate for other strategies
                results
                    .iter()
                    .filter_map(|(_, r)| r.as_ref().ok())
                    .cloned()
                    .collect::<Vec<_>>()
                    .join("\n\n")
            }
        }
    }

    /// Helper: hash output for voting
    fn hash_output(&self, output: &str) -> String {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};

        // Normalize output for comparison
        let normalized = output.trim().to_lowercase();
        let mut hasher = DefaultHasher::new();
        normalized.hash(&mut hasher);
        format!("{:x}", hasher.finish())
    }

    /// Get task result
    pub async fn get_result(&self, task_id: &str) -> Option<TaskResult> {
        self.results.read().await.get(task_id).cloned()
    }

    /// List registered agents
    pub async fn list_agents(&self) -> Vec<ExternalAgentConfig> {
        self.configs.read().await.values().cloned().collect()
    }

    /// Check if agent is available
    pub async fn is_agent_available(&self, agent_id: &str) -> bool {
        if let Some(config) = self.configs.read().await.get(agent_id) {
            // Check if command exists
            which::which(&config.command).is_ok()
        } else {
            false
        }
    }

    /// Detect installed agents
    pub async fn detect_installed_agents(&self) -> Vec<ExternalAgentType> {
        let mut installed = Vec::new();

        let checks = vec![
            (ExternalAgentType::ClaudeCode, "claude"),
            (ExternalAgentType::GeminiCli, "gemini"),
            (ExternalAgentType::CodexCli, "codex"),
            (ExternalAgentType::CopilotCli, "gh"),
            (ExternalAgentType::Aider, "aider"),
        ];

        for (agent_type, cmd) in checks {
            if which::which(cmd).is_ok() {
                installed.push(agent_type);
            }
        }

        installed
    }
}

impl Default for MultiAgentOrchestrator {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// Preset Collaboration Workflows
// ============================================================================

/// Pre-built collaboration workflows
pub struct CollaborationPresets;

impl CollaborationPresets {
    /// QC Pipeline: Claude codes, Gemini reviews, Codex tests
    pub fn qc_pipeline() -> CollaborationMode {
        CollaborationMode::Pipeline(PipelineConfig {
            stages: vec![
                PipelineStage {
                    name: "Implementation".to_string(),
                    agent: "claude-code".to_string(),
                    task_type: TaskCategory::CodeGeneration,
                    required: true,
                    timeout_ms: Some(600000),
                },
                PipelineStage {
                    name: "Code Review".to_string(),
                    agent: "gemini-cli".to_string(),
                    task_type: TaskCategory::CodeReview,
                    required: true,
                    timeout_ms: Some(300000),
                },
                PipelineStage {
                    name: "Testing".to_string(),
                    agent: "codex-cli".to_string(),
                    task_type: TaskCategory::Testing,
                    required: false,
                    timeout_ms: Some(300000),
                },
            ],
            parallel_within_stage: false,
            rollback_on_failure: true,
        })
    }

    /// Research & Implement: Gemini researches, Claude implements
    pub fn research_implement() -> CollaborationMode {
        CollaborationMode::Sequential(SequentialConfig {
            agent_order: vec!["gemini-cli".to_string(), "claude-code".to_string()],
            pass_full_output: true,
            stop_on_success: false,
            max_iterations: 2,
        })
    }

    /// Parallel development: Multiple agents work simultaneously
    pub fn parallel_dev(agents: Vec<String>) -> CollaborationMode {
        CollaborationMode::Parallel(ParallelConfig {
            agents,
            merge_strategy: MergeStrategy::AiMerge,
            wait_strategy: WaitStrategy::All,
            partition: Some(PartitionStrategy::Auto),
        })
    }

    /// Code review with multiple reviewers
    pub fn multi_reviewer(lead: &str, reviewers: Vec<String>) -> CollaborationMode {
        CollaborationMode::LeadAndReview(LeadReviewConfig {
            lead_agent: lead.to_string(),
            reviewers,
            require_all_approvals: false,
            max_review_rounds: 3,
        })
    }

    /// Competitive: best solution wins
    pub fn competitive(agents: Vec<String>) -> CollaborationMode {
        CollaborationMode::Competitive(CompetitiveConfig {
            agents,
            selection_criteria: SelectionCriteria::BestQuality,
            timeout_ms: 300000,
        })
    }

    /// Ensemble voting
    pub fn ensemble_vote(agents: Vec<String>) -> CollaborationMode {
        let weights: HashMap<String, f32> = agents.iter().map(|a| (a.clone(), 1.0)).collect();

        CollaborationMode::Ensemble(EnsembleConfig {
            agents,
            threshold: 0.5,
            weights,
        })
    }

    /// Full software development lifecycle
    pub fn sdlc_pipeline() -> CollaborationMode {
        CollaborationMode::Pipeline(PipelineConfig {
            stages: vec![
                PipelineStage {
                    name: "Requirements Analysis".to_string(),
                    agent: "gemini-cli".to_string(),
                    task_type: TaskCategory::Planning,
                    required: true,
                    timeout_ms: Some(300000),
                },
                PipelineStage {
                    name: "Architecture Design".to_string(),
                    agent: "claude-code".to_string(),
                    task_type: TaskCategory::ArchitectureDesign,
                    required: true,
                    timeout_ms: Some(300000),
                },
                PipelineStage {
                    name: "Implementation".to_string(),
                    agent: "claude-code".to_string(),
                    task_type: TaskCategory::CodeGeneration,
                    required: true,
                    timeout_ms: Some(600000),
                },
                PipelineStage {
                    name: "Testing".to_string(),
                    agent: "codex-cli".to_string(),
                    task_type: TaskCategory::Testing,
                    required: true,
                    timeout_ms: Some(300000),
                },
                PipelineStage {
                    name: "Security Review".to_string(),
                    agent: "claude-code".to_string(),
                    task_type: TaskCategory::Security,
                    required: false,
                    timeout_ms: Some(300000),
                },
                PipelineStage {
                    name: "Documentation".to_string(),
                    agent: "gemini-cli".to_string(),
                    task_type: TaskCategory::Documentation,
                    required: false,
                    timeout_ms: Some(300000),
                },
            ],
            parallel_within_stage: false,
            rollback_on_failure: false,
        })
    }
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_agent_type_capabilities() {
        let claude = ExternalAgentType::ClaudeCode;
        assert!(claude
            .capabilities()
            .contains(&AgentCapability::CodeGeneration));
        assert!(claude.capabilities().contains(&AgentCapability::CodeReview));
    }

    #[test]
    fn test_agent_config_defaults() {
        let config = ExternalAgentConfig::claude_code();
        assert_eq!(config.id, "claude-code");
        assert_eq!(config.agent_type, ExternalAgentType::ClaudeCode);
        assert!(config.enabled);
    }

    #[test]
    fn test_collaboration_presets() {
        let qc = CollaborationPresets::qc_pipeline();
        if let CollaborationMode::Pipeline(config) = qc {
            assert_eq!(config.stages.len(), 3);
        } else {
            panic!("Expected Pipeline mode");
        }
    }

    #[tokio::test]
    async fn test_orchestrator_creation() {
        let orchestrator = MultiAgentOrchestrator::new();
        orchestrator.register_defaults().await;

        let agents = orchestrator.list_agents().await;
        assert!(!agents.is_empty());
    }

    #[test]
    fn test_task_categories() {
        let claude = ExternalAgentType::ClaudeCode;
        assert!(claude.best_for().contains(&TaskCategory::CodeReview));
        assert!(claude
            .best_for()
            .contains(&TaskCategory::ComplexRefactoring));
    }
}
