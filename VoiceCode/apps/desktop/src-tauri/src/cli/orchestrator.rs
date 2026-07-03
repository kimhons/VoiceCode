#![allow(dead_code, unused_variables, unused_imports)]
// Agent Orchestrator - Coordinates task delegation across multiple agents
// Handles task decomposition, agent selection, parallel execution, and result aggregation

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::{mpsc, RwLock, Semaphore};

use super::agent_protocol::{
    AgentCapability, AgentMessage, AgentProtocol, TaskContext, TaskResult, TaskStatus,
    TaskType,
};
use super::agent_registry::{AgentInfo, AgentRegistry, AgentStatus, AgentType};

/// Orchestration strategy for task execution
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum OrchestrationStrategy {
    /// Use single best agent for task
    SingleAgent,
    /// Parallel execution across multiple agents, take first result
    RaceExecution,
    /// Parallel execution, aggregate all results
    Consensus,
    /// Sequential pipeline through multiple agents
    Pipeline,
    /// Decompose task and distribute to specialized agents
    Decomposition,
}

/// Task assignment to an agent
#[derive(Debug, Clone)]
pub struct TaskAssignment {
    pub task_id: String,
    pub agent_id: String,
    pub task_type: TaskType,
    pub context: TaskContext,
    pub priority: u8,
    pub deadline: Option<Instant>,
}

/// Result from a task execution
#[derive(Debug, Clone)]
pub struct ExecutionResult {
    pub task_id: String,
    pub agent_id: String,
    pub result: TaskResult,
    pub duration_ms: u64,
    pub success: bool,
}

/// Aggregated results from multiple agents
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AggregatedResult {
    pub task_id: String,
    pub strategy: OrchestrationStrategy,
    pub results: Vec<TaskResult>,
    pub consensus_result: Option<TaskResult>,
    pub total_duration_ms: u64,
    pub agents_used: Vec<String>,
}

/// Orchestrator configuration
#[derive(Debug, Clone)]
pub struct OrchestratorConfig {
    /// Maximum concurrent tasks
    pub max_concurrent_tasks: usize,
    /// Default timeout per task
    pub task_timeout_ms: u64,
    /// Enable automatic retries on failure
    pub auto_retry: bool,
    /// Maximum retry attempts
    pub max_retries: u32,
    /// Prefer local agents over remote
    pub prefer_local: bool,
    /// Minimum consensus threshold (0.0 - 1.0)
    pub consensus_threshold: f64,
}

impl Default for OrchestratorConfig {
    fn default() -> Self {
        // Allow override via environment variable for flexibility
        let max_concurrent = std::env::var("VOICECODE_MAX_CONCURRENT_TASKS")
            .ok()
            .and_then(|s| s.parse().ok())
            .unwrap_or(8); // Increased from 5 to match Cursor's capacity

        Self {
            max_concurrent_tasks: max_concurrent,
            task_timeout_ms: 60000,
            auto_retry: true,
            max_retries: 2,
            prefer_local: true,
            consensus_threshold: 0.6,
        }
    }
}

/// Agent Orchestrator - manages task distribution across agents
pub struct AgentOrchestrator {
    registry: Arc<AgentRegistry>,
    config: OrchestratorConfig,
    active_tasks: Arc<RwLock<HashMap<String, TaskAssignment>>>,
    task_semaphore: Arc<Semaphore>,
    protocols: Arc<RwLock<HashMap<String, AgentProtocol>>>,
    /// Optional multi-agent orchestrator for CLI subprocess execution
    multi_agent: Arc<RwLock<Option<Arc<super::multi_agent::MultiAgentOrchestrator>>>>,
}

impl AgentOrchestrator {
    pub fn new(registry: Arc<AgentRegistry>, config: OrchestratorConfig) -> Self {
        let semaphore = Arc::new(Semaphore::new(config.max_concurrent_tasks));

        Self {
            registry,
            config,
            active_tasks: Arc::new(RwLock::new(HashMap::new())),
            task_semaphore: semaphore,
            protocols: Arc::new(RwLock::new(HashMap::new())),
            multi_agent: Arc::new(RwLock::new(None)),
        }
    }

    /// Attach a MultiAgentOrchestrator for CLI-based external agent dispatch
    pub async fn set_multi_agent(&self, multi_agent: Arc<super::multi_agent::MultiAgentOrchestrator>) {
        *self.multi_agent.write().await = Some(multi_agent);
    }

    /// Execute a task with the specified strategy
    pub async fn execute_task(
        &self,
        task_type: TaskType,
        context: TaskContext,
        strategy: OrchestrationStrategy,
    ) -> Result<AggregatedResult, String> {
        let task_id = uuid::Uuid::new_v4().to_string();
        let start = Instant::now();

        let result = match strategy {
            OrchestrationStrategy::SingleAgent => {
                self.execute_single_agent(&task_id, task_type, context)
                    .await
            }
            OrchestrationStrategy::RaceExecution => {
                self.execute_race(&task_id, task_type, context).await
            }
            OrchestrationStrategy::Consensus => {
                self.execute_consensus(&task_id, task_type, context).await
            }
            OrchestrationStrategy::Pipeline => {
                self.execute_pipeline(&task_id, task_type, context).await
            }
            OrchestrationStrategy::Decomposition => {
                self.execute_decomposed(&task_id, task_type, context).await
            }
        };

        let duration_ms = start.elapsed().as_millis() as u64;

        result.map(|mut r| {
            r.total_duration_ms = duration_ms;
            r
        })
    }

    /// Execute task with single best agent
    async fn execute_single_agent(
        &self,
        task_id: &str,
        task_type: TaskType,
        context: TaskContext,
    ) -> Result<AggregatedResult, String> {
        let capability = self.task_type_to_capability(&task_type);
        let agent = self
            .registry
            .find_best_for_capability(&capability)
            .await
            .ok_or_else(|| format!("No agent available for {:?}", task_type))?;

        let result = self
            .dispatch_to_agent(task_id, &agent, task_type, context)
            .await?;

        Ok(AggregatedResult {
            task_id: task_id.to_string(),
            strategy: OrchestrationStrategy::SingleAgent,
            results: vec![result.result.clone()],
            consensus_result: Some(result.result),
            total_duration_ms: result.duration_ms,
            agents_used: vec![agent.id],
        })
    }

    /// Execute task across multiple agents, take first successful result
    async fn execute_race(
        &self,
        task_id: &str,
        task_type: TaskType,
        context: TaskContext,
    ) -> Result<AggregatedResult, String> {
        let capability = self.task_type_to_capability(&task_type);
        let agents = self.registry.find_by_capability(&capability).await;

        if agents.is_empty() {
            return Err(format!("No agents available for {:?}", task_type));
        }

        let (tx, mut rx) = mpsc::channel::<ExecutionResult>(agents.len());
        let mut handles = Vec::new();

        for agent in &agents {
            let tx = tx.clone();
            let task_id = task_id.to_string();
            let agent = agent.clone();
            let task_type = task_type.clone();
            let context = context.clone();
            let orchestrator = self.clone_for_spawn();

            let handle = tokio::spawn(async move {
                if let Ok(result) = orchestrator
                    .dispatch_to_agent(&task_id, &agent, task_type, context)
                    .await
                {
                    let _ = tx.send(result).await;
                }
            });

            handles.push(handle);
        }

        drop(tx);

        // Take first successful result
        let mut first_result = None;
        let mut agents_used = Vec::new();

        while let Some(result) = rx.recv().await {
            agents_used.push(result.agent_id.clone());
            if result.success && first_result.is_none() {
                first_result = Some(result);
                break;
            }
        }

        // Cancel remaining tasks
        for handle in handles {
            handle.abort();
        }

        let result = first_result.ok_or("All agents failed")?;

        Ok(AggregatedResult {
            task_id: task_id.to_string(),
            strategy: OrchestrationStrategy::RaceExecution,
            results: vec![result.result.clone()],
            consensus_result: Some(result.result),
            total_duration_ms: result.duration_ms,
            agents_used,
        })
    }

    /// Execute task across multiple agents and aggregate results
    async fn execute_consensus(
        &self,
        task_id: &str,
        task_type: TaskType,
        context: TaskContext,
    ) -> Result<AggregatedResult, String> {
        let capability = self.task_type_to_capability(&task_type);
        let agents = self.registry.find_by_capability(&capability).await;

        if agents.is_empty() {
            return Err(format!("No agents available for {:?}", task_type));
        }

        let mut handles = Vec::new();

        for agent in &agents {
            let task_id = task_id.to_string();
            let agent_cloned = agent.clone();
            let agent_id = agent.id.clone();
            let task_type = task_type.clone();
            let context = context.clone();
            let orchestrator = self.clone_for_spawn();

            let handle = tokio::spawn(async move {
                orchestrator
                    .dispatch_to_agent(&task_id, &agent_cloned, task_type, context)
                    .await
            });

            handles.push((agent_id, handle));
        }

        let mut results = Vec::new();
        let mut agents_used = Vec::new();

        for (agent_id, handle) in handles {
            if let Ok(Ok(result)) = handle.await {
                if result.success {
                    results.push(result.result);
                    agents_used.push(agent_id);
                }
            }
        }

        if results.is_empty() {
            return Err("All agents failed".to_string());
        }

        // Find consensus result (simple: take highest confidence or most common)
        let consensus = self.find_consensus(&results);

        Ok(AggregatedResult {
            task_id: task_id.to_string(),
            strategy: OrchestrationStrategy::Consensus,
            results,
            consensus_result: consensus,
            total_duration_ms: 0, // Will be filled by caller
            agents_used,
        })
    }

    /// Execute task as a pipeline through multiple agents
    async fn execute_pipeline(
        &self,
        task_id: &str,
        task_type: TaskType,
        mut context: TaskContext,
    ) -> Result<AggregatedResult, String> {
        let pipeline_stages = self.get_pipeline_stages(&task_type);
        let mut results = Vec::new();
        let mut agents_used = Vec::new();

        for (stage_capability, stage_transform) in pipeline_stages {
            let agent = self
                .registry
                .find_best_for_capability(&stage_capability)
                .await
                .ok_or_else(|| format!("No agent for pipeline stage {:?}", stage_capability))?;

            let stage_task_type = self.capability_to_task_type(&stage_capability);
            let result = self
                .dispatch_to_agent(task_id, &agent, stage_task_type, context.clone())
                .await?;

            agents_used.push(agent.id);
            results.push(result.result.clone());

            // Transform context for next stage
            context = stage_transform(context, &result.result);
        }

        let final_result = results.last().cloned();

        Ok(AggregatedResult {
            task_id: task_id.to_string(),
            strategy: OrchestrationStrategy::Pipeline,
            results,
            consensus_result: final_result,
            total_duration_ms: 0,
            agents_used,
        })
    }

    /// Decompose task and distribute to specialized agents
    async fn execute_decomposed(
        &self,
        task_id: &str,
        task_type: TaskType,
        context: TaskContext,
    ) -> Result<AggregatedResult, String> {
        let subtasks = self.decompose_task(&task_type, &context);
        let mut handles = Vec::new();
        let mut agents_used = Vec::new();

        for (subtask_type, subtask_context) in subtasks {
            let capability = self.task_type_to_capability(&subtask_type);

            if let Some(agent) = self.registry.find_best_for_capability(&capability).await {
                let task_id = task_id.to_string();
                let agent_clone = agent.clone();
                let orchestrator = self.clone_for_spawn();

                agents_used.push(agent.id);

                let handle = tokio::spawn(async move {
                    orchestrator
                        .dispatch_to_agent(&task_id, &agent_clone, subtask_type, subtask_context)
                        .await
                });

                handles.push(handle);
            }
        }

        let mut results = Vec::new();

        for handle in handles {
            if let Ok(Ok(result)) = handle.await {
                results.push(result.result);
            }
        }

        // Merge results from subtasks
        let merged = self.merge_subtask_results(&results);

        Ok(AggregatedResult {
            task_id: task_id.to_string(),
            strategy: OrchestrationStrategy::Decomposition,
            results,
            consensus_result: Some(merged),
            total_duration_ms: 0,
            agents_used,
        })
    }

    /// Dispatch a task to a specific agent
    async fn dispatch_to_agent(
        &self,
        task_id: &str,
        agent: &AgentInfo,
        task_type: TaskType,
        context: TaskContext,
    ) -> Result<ExecutionResult, String> {
        let start = Instant::now();

        // Acquire semaphore permit
        let _permit = self
            .task_semaphore
            .clone()
            .acquire_owned()
            .await
            .map_err(|e| format!("Failed to acquire task permit: {}", e))?;

        // Record task assignment
        let assignment = TaskAssignment {
            task_id: task_id.to_string(),
            agent_id: agent.id.clone(),
            task_type: task_type.clone(),
            context: context.clone(),
            priority: 50,
            deadline: Some(Instant::now() + Duration::from_millis(self.config.task_timeout_ms)),
        };

        self.active_tasks
            .write()
            .await
            .insert(task_id.to_string(), assignment);

        // Update agent status
        self.registry
            .update_status(&agent.id, AgentStatus::Busy)
            .await;

        // Execute with timeout
        let timeout = Duration::from_millis(self.config.task_timeout_ms);
        let result = tokio::time::timeout(
            timeout,
            self.execute_on_agent(agent, task_id, task_type.clone(), context),
        )
        .await;

        // Update agent status
        self.registry
            .update_status(&agent.id, AgentStatus::Available)
            .await;

        // Remove from active tasks
        self.active_tasks.write().await.remove(task_id);

        let duration_ms = start.elapsed().as_millis() as u64;

        match result {
            Ok(Ok(task_result)) => {
                self.registry
                    .record_completion(&agent.id, duration_ms)
                    .await;
                Ok(ExecutionResult {
                    task_id: task_id.to_string(),
                    agent_id: agent.id.clone(),
                    result: task_result,
                    duration_ms,
                    success: true,
                })
            }
            Ok(Err(e)) => {
                if self.config.auto_retry {
                    // Could implement retry logic here
                }
                Err(e)
            }
            Err(_) => Err(format!("Task {} timed out", task_id)),
        }
    }

    /// Execute task on a specific agent (internal or external)
    async fn execute_on_agent(
        &self,
        agent: &AgentInfo,
        task_id: &str,
        task_type: TaskType,
        context: TaskContext,
    ) -> Result<TaskResult, String> {
        match &agent.endpoint {
            Some(endpoint) => {
                // External agent with endpoint - try TCP protocol first
                match self
                    .execute_remote(endpoint, task_id, task_type.clone(), context.clone())
                    .await
                {
                    Ok(result) => Ok(result),
                    Err(e) => {
                        tracing::warn!(
                            "TCP dispatch to {} failed ({}), trying CLI subprocess",
                            agent.name, e
                        );
                        // Fallback to CLI subprocess if MultiAgentOrchestrator is available
                        self.execute_via_cli(agent, task_id, task_type, context)
                            .await
                    }
                }
            }
            None if agent.agent_type == AgentType::External => {
                // External agent without endpoint - use CLI subprocess
                self.execute_via_cli(agent, task_id, task_type, context)
                    .await
            }
            None => {
                // Internal agent - direct LLM execution
                self.execute_internal(task_id, task_type, context).await
            }
        }
    }

    /// Execute task via CLI subprocess using MultiAgentOrchestrator
    async fn execute_via_cli(
        &self,
        agent: &AgentInfo,
        task_id: &str,
        task_type: TaskType,
        context: TaskContext,
    ) -> Result<TaskResult, String> {
        let multi_agent_guard = self.multi_agent.read().await;
        let multi_agent = match multi_agent_guard.as_ref() {
            Some(ma) => ma.clone(),
            None => {
                // No multi-agent orchestrator attached, fall back to internal
                return self.execute_internal(task_id, task_type, context).await;
            }
        };
        drop(multi_agent_guard);

        // Build a prompt from task type and context
        let prompt = self.build_cli_prompt(&task_type, &context);

        // Map agent name to task category
        let category = self.task_type_to_category(&task_type);

        // Map agent name to multi-agent config ID
        let agent_config_id = self.agent_name_to_config_id(&agent.name);

        // Build CollaborativeTask with Sequential mode (single agent)
        let collab_task = super::multi_agent::CollaborativeTask {
            id: task_id.to_string(),
            prompt,
            category,
            files: context
                .current_file
                .as_ref()
                .map(|f| vec![std::path::PathBuf::from(f)])
                .unwrap_or_default(),
            collaboration: super::multi_agent::CollaborationMode::Sequential(
                super::multi_agent::SequentialConfig {
                    agent_order: vec![agent_config_id],
                    pass_full_output: true,
                    stop_on_success: true,
                    max_iterations: 1,
                },
            ),
            context: super::multi_agent::TaskContext::default(),
            priority: agent.priority as i32,
            parent_id: None,
            dependencies: Vec::new(),
            deadline_ms: Some(self.config.task_timeout_ms),
            metadata: std::collections::HashMap::new(),
        };

        match multi_agent.execute_task(collab_task).await {
            Ok(result) => {
                // Convert multi_agent::TaskResult to agent_protocol::TaskResult
                Ok(TaskResult {
                    status: match result.status {
                        super::multi_agent::TaskStatus::Completed => TaskStatus::Completed,
                        super::multi_agent::TaskStatus::Failed => TaskStatus::Failed,
                        _ => TaskStatus::InProgress,
                    },
                    success: result.status == super::multi_agent::TaskStatus::Completed,
                    output: Some(result.output),
                    ..Default::default()
                })
            }
            Err(e) => {
                tracing::warn!("CLI dispatch to {} failed: {}", agent.name, e);
                // Final fallback to internal LLM execution
                self.execute_internal(task_id, task_type, context).await
            }
        }
    }

    /// Build a prompt string from task type and context for CLI agents
    fn build_cli_prompt(&self, task_type: &TaskType, context: &TaskContext) -> String {
        let ctx_str = format!(
            "Project: {}\nFile: {}\n{}",
            context.project_root.as_deref().unwrap_or("unknown"),
            context.current_file.as_deref().unwrap_or("none"),
            context
                .selection
                .as_ref()
                .map(|s| format!("Code:\n{}", s))
                .unwrap_or_default(),
        );

        match task_type {
            TaskType::CodeGeneration {
                language,
                description,
            } => format!(
                "Generate {} code: {}\n\n{}",
                language.as_deref().unwrap_or(""),
                description,
                ctx_str
            ),
            TaskType::CodeReview { focus_areas } => format!(
                "Review the code. Focus on: {}\n\n{}",
                focus_areas.join(", "),
                ctx_str
            ),
            TaskType::BugFix {
                error_message,
                stack_trace,
            } => format!(
                "Fix this bug.\nError: {}\n{}\n\n{}",
                error_message.as_deref().unwrap_or("Unknown"),
                stack_trace.as_deref().unwrap_or(""),
                ctx_str
            ),
            TaskType::Refactoring {
                refactor_type,
                scope,
            } => format!(
                "Refactor: {}{}\n\n{}",
                refactor_type,
                scope
                    .as_ref()
                    .map(|s| format!(" (scope: {})", s))
                    .unwrap_or_default(),
                ctx_str
            ),
            TaskType::TestGeneration { test_type, .. } => {
                format!("Generate {} tests\n\n{}", test_type, ctx_str)
            }
            TaskType::Documentation { doc_type, .. } => {
                format!("Generate {} documentation\n\n{}", doc_type, ctx_str)
            }
            _ => format!("{:?}\n\n{}", task_type, ctx_str),
        }
    }

    /// Map task type to multi_agent TaskCategory
    fn task_type_to_category(
        &self,
        task_type: &TaskType,
    ) -> super::multi_agent::TaskCategory {
        match task_type {
            TaskType::CodeGeneration { .. } => super::multi_agent::TaskCategory::CodeGeneration,
            TaskType::CodeReview { .. } => super::multi_agent::TaskCategory::CodeReview,
            TaskType::BugFix { .. } => super::multi_agent::TaskCategory::BugFixing,
            TaskType::Refactoring { .. } => super::multi_agent::TaskCategory::ComplexRefactoring,
            TaskType::TestGeneration { .. } => super::multi_agent::TaskCategory::Testing,
            TaskType::Documentation { .. } => super::multi_agent::TaskCategory::Documentation,
            _ => super::multi_agent::TaskCategory::CodeGeneration,
        }
    }

    /// Map agent display name to multi-agent config ID
    fn agent_name_to_config_id(&self, name: &str) -> String {
        match name.to_lowercase().as_str() {
            s if s.contains("claude") => "claude-code".to_string(),
            s if s.contains("gemini") => "gemini-cli".to_string(),
            s if s.contains("codex") => "codex-cli".to_string(),
            s if s.contains("aider") => "aider".to_string(),
            s if s.contains("copilot") => "copilot-cli".to_string(),
            _ => name.to_lowercase().replace(' ', "-"),
        }
    }

    /// Execute on remote agent via protocol
    async fn execute_remote(
        &self,
        endpoint: &str,
        task_id: &str,
        task_type: TaskType,
        context: TaskContext,
    ) -> Result<TaskResult, String> {
        let mut protocols = self.protocols.write().await;

        let protocol = if let Some(p) = protocols.get_mut(endpoint) {
            p
        } else {
            let mut new_protocol = AgentProtocol::new(
                self.registry.self_agent().name.clone(),
                self.registry.self_agent().capabilities.clone(),
            );
            new_protocol.connect(endpoint).await?;
            protocols.insert(endpoint.to_string(), new_protocol);
            protocols.get_mut(endpoint).unwrap()
        };

        protocol
            .send_task_request(task_id.to_string(), task_type, context)
            .await?;

        // Wait for response
        let timeout = Duration::from_millis(self.config.task_timeout_ms);
        let deadline = Instant::now() + timeout;

        while Instant::now() < deadline {
            if let Some(message) = protocol.receive().await? {
                match message {
                    AgentMessage::TaskComplete {
                        task_id: tid,
                        result,
                        agent_id: _,
                    } if tid == task_id => {
                        return Ok(result);
                    }
                    AgentMessage::TaskFailed {
                        task_id: tid,
                        error,
                        ..
                    } if tid == task_id => {
                        return Err(error);
                    }
                    AgentMessage::Progress {
                        task_id: tid,
                        progress,
                        message: msg,
                        agent_id: _,
                    } if tid == task_id => {
                        tracing::debug!("Task {} progress: {}% - {}", tid, progress, msg);
                    }
                    _ => {}
                }
            }
            tokio::time::sleep(Duration::from_millis(100)).await;
        }

        Err(format!("Task {} timed out waiting for response", task_id))
    }

    /// Execute internally (VoiceCode agent) via LLM
    async fn execute_internal(
        &self,
        task_id: &str,
        task_type: TaskType,
        context: TaskContext,
    ) -> Result<TaskResult, String> {
        tracing::info!("Executing internal task {}: {:?}", task_id, task_type);

        use crate::code_intelligence::llm_client::{
            self as llm, Message, LLMRequest, CodePrompts,
        };

        // Build context string from TaskContext
        let ctx_str = format!(
            "Project: {}\nFile: {}\nSelection:\n{}",
            context.project_root.as_deref().unwrap_or("unknown"),
            context.current_file.as_deref().unwrap_or("none"),
            context.selection.as_deref().unwrap_or("none"),
        );

        // Build task-specific prompt
        let user_prompt = match &task_type {
            TaskType::CodeGeneration { language, description } => {
                format!(
                    "Generate {} code for: {}\n\nContext:\n{}",
                    language.as_deref().unwrap_or(""), description, ctx_str
                )
            }
            TaskType::CodeReview { focus_areas } => {
                let code = context.selection.as_deref().unwrap_or("No code provided");
                format!(
                    "Review the following code. Focus on: {}\n\nCode:\n```\n{}\n```\n\nContext:\n{}",
                    focus_areas.join(", "), code, ctx_str
                )
            }
            TaskType::BugFix { error_message, stack_trace } => {
                let code = context.selection.as_deref().unwrap_or("No code provided");
                let err = error_message.as_deref().unwrap_or("Unknown error");
                let trace = stack_trace.as_deref().unwrap_or("");
                CodePrompts::bug_fix(&ctx_str, code, &format!("{}\n{}", err, trace))
            }
            TaskType::Refactoring { refactor_type, scope } => {
                let code = context.selection.as_deref().unwrap_or("No code provided");
                let goal = format!("{}{}", refactor_type, scope.as_ref().map(|s| format!(" (scope: {})", s)).unwrap_or_default());
                CodePrompts::refactor(&ctx_str, code, &goal)
            }
            TaskType::TestGeneration { test_type, .. } => {
                let code = context.selection.as_deref().unwrap_or("No code provided");
                format!("Generate {} tests for:\n```\n{}\n```\n\nContext:\n{}", test_type, code, ctx_str)
            }
            TaskType::Documentation { doc_type, format } => {
                let code = context.selection.as_deref().unwrap_or("No code provided");
                format!(
                    "Generate {} documentation{} for:\n```\n{}\n```",
                    doc_type,
                    format.as_ref().map(|f| format!(" in {} format", f)).unwrap_or_default(),
                    code
                )
            }
            TaskType::Explanation { detail_level } => {
                let code = context.selection.as_deref().unwrap_or("No code provided");
                CodePrompts::code_explanation(&ctx_str, code)
            }
            _ => {
                format!("Task: {:?}\n\nContext:\n{}", task_type, ctx_str)
            }
        };

        // Try LLM execution
        if llm::is_llm_available().await {
            let request = LLMRequest::new(vec![
                Message::system(CodePrompts::code_generation_system()),
                Message::user(user_prompt),
            ]);

            match llm::llm_complete(request).await {
                Ok(response) => {
                    let mut metadata = HashMap::new();
                    metadata.insert("tokens_used".to_string(), response.usage.total_tokens.to_string());
                    metadata.insert("model".to_string(), response.model);
                    metadata.insert("latency_ms".to_string(), response.latency_ms.to_string());

                    return Ok(TaskResult {
                        status: TaskStatus::Completed,
                        success: true,
                        output: Some(response.content),
                        metadata,
                        ..Default::default()
                    });
                }
                Err(e) => {
                    tracing::warn!("LLM failed for internal task {}: {}", task_id, e);
                }
            }
        }

        // Fallback: descriptive placeholder
        Ok(TaskResult {
            status: TaskStatus::Completed,
            success: true,
            output: Some(format!(
                "Task {:?} acknowledged. Configure an LLM API key for AI-powered execution.",
                task_type
            )),
            ..Default::default()
        })
    }

    /// Convert task type to required capability
    fn task_type_to_capability(&self, task_type: &TaskType) -> AgentCapability {
        match task_type {
            TaskType::CodeGeneration { .. } => AgentCapability::CodeGeneration,
            TaskType::CodeReview { .. } => AgentCapability::CodeReview,
            TaskType::BugFix { .. } => AgentCapability::BugFix,
            TaskType::Refactoring { .. } => AgentCapability::Refactoring,
            TaskType::TestGeneration { .. } => AgentCapability::TestGeneration,
            TaskType::Documentation { .. } => AgentCapability::Documentation,
            TaskType::Explanation { .. } => AgentCapability::Explanation,
            TaskType::Completion { .. } => AgentCapability::Completion,
            TaskType::Search { .. } => AgentCapability::Search,
            TaskType::FileOperation { .. } => AgentCapability::FileOperations,
            TaskType::Terminal { .. } => AgentCapability::Terminal,
            TaskType::Git { .. } => AgentCapability::Git,
            TaskType::Custom { .. } => AgentCapability::Custom("custom".to_string()),
            // Legacy unit variants - map to appropriate capabilities
            _ => AgentCapability::CodeGeneration,
        }
    }

    /// Convert capability back to task type (for pipeline stages)
    fn capability_to_task_type(&self, capability: &AgentCapability) -> TaskType {
        match capability {
            AgentCapability::CodeGeneration => TaskType::CodeGeneration {
                language: Some("auto".to_string()),
                description: String::new(),
            },
            AgentCapability::CodeReview => TaskType::CodeReview {
                focus_areas: vec![],
            },
            _ => TaskType::Custom {
                name: format!("{:?}", capability),
                params: HashMap::new(),
            },
        }
    }

    /// Get pipeline stages for a task type
    fn get_pipeline_stages(
        &self,
        task_type: &TaskType,
    ) -> Vec<(AgentCapability, fn(TaskContext, &TaskResult) -> TaskContext)> {
        match task_type {
            TaskType::CodeGeneration { .. } => {
                vec![
                    (AgentCapability::CodeGeneration, |ctx, _| ctx),
                    (AgentCapability::CodeReview, |mut ctx, result| {
                        if let Some(output) = &result.output {
                            ctx.code_content = Some(output.clone());
                        }
                        ctx
                    }),
                ]
            }
            TaskType::BugFix { .. } => {
                vec![
                    (AgentCapability::BugFix, |ctx, _| ctx),
                    (AgentCapability::TestGeneration, |mut ctx, result| {
                        for change in &result.changes {
                            if let Some(ref content) = change.new_content {
                                ctx.code_content = Some(content.clone());
                            }
                        }
                        ctx
                    }),
                ]
            }
            _ => vec![(self.task_type_to_capability(task_type), |ctx, _| ctx)],
        }
    }

    /// Decompose a complex task into subtasks
    fn decompose_task(
        &self,
        task_type: &TaskType,
        context: &TaskContext,
    ) -> Vec<(TaskType, TaskContext)> {
        match task_type {
            TaskType::Refactoring {
                refactor_type,
                scope: _,
            } => {
                // Split large refactoring into file-level tasks
                if !context.related_files.is_empty() {
                    context.related_files
                        .iter()
                        .map(|file| {
                            let mut sub_context = context.clone();
                            sub_context.file_path = Some(file.clone());
                            sub_context.related_files = vec![file.clone()];

                            (
                                TaskType::Refactoring {
                                    refactor_type: refactor_type.clone(),
                                    scope: Some("file".to_string()),
                                },
                                sub_context,
                            )
                        })
                        .collect()
                } else {
                    vec![(task_type.clone(), context.clone())]
                }
            }
            TaskType::TestGeneration {
                test_type,
                coverage_target,
            } => {
                // Generate tests for multiple files in parallel
                if !context.related_files.is_empty() {
                    context.related_files
                        .iter()
                        .map(|file| {
                            let mut sub_context = context.clone();
                            sub_context.file_path = Some(file.clone());

                            (
                                TaskType::TestGeneration {
                                    test_type: test_type.clone(),
                                    coverage_target: *coverage_target,
                                },
                                sub_context,
                            )
                        })
                        .collect()
                } else {
                    vec![(task_type.clone(), context.clone())]
                }
            }
            _ => vec![(task_type.clone(), context.clone())],
        }
    }

    /// Find consensus among multiple results
    fn find_consensus(&self, results: &[TaskResult]) -> Option<TaskResult> {
        if results.is_empty() {
            return None;
        }

        // Simple strategy: take result from agent with most changes if code task,
        // or longest output otherwise
        results
            .iter()
            .max_by_key(|r| {
                if !r.changes.is_empty() {
                    r.changes.iter().map(|c| c.new_content.as_ref().map(|s| s.len()).unwrap_or(0)).sum::<usize>()
                } else {
                    r.output.as_ref().map(|o| o.len()).unwrap_or(0)
                }
            })
            .cloned()
    }

    /// Merge results from multiple subtasks
    fn merge_subtask_results(&self, results: &[TaskResult]) -> TaskResult {
        let mut merged_changes = Vec::new();
        let mut merged_output = Vec::new();
        let mut all_succeeded = true;

        for result in results {
            if result.status != TaskStatus::Completed {
                all_succeeded = false;
            }
            merged_changes.extend(result.changes.clone());
            if let Some(output) = &result.output {
                merged_output.push(output.clone());
            }
        }

        TaskResult {
            success: all_succeeded,
            status: if all_succeeded {
                TaskStatus::Completed
            } else {
                TaskStatus::PartiallyCompleted
            },
            output: if merged_output.is_empty() {
                None
            } else {
                Some(merged_output.join("\n\n"))
            },
            changes: merged_changes,
            ..Default::default()
        }
    }

    /// Clone self for spawning async tasks
    fn clone_for_spawn(&self) -> Self {
        Self {
            registry: Arc::clone(&self.registry),
            config: self.config.clone(),
            active_tasks: Arc::clone(&self.active_tasks),
            task_semaphore: Arc::clone(&self.task_semaphore),
            protocols: Arc::clone(&self.protocols),
            multi_agent: Arc::clone(&self.multi_agent),
        }
    }

    /// Get current active tasks
    pub async fn active_tasks(&self) -> Vec<TaskAssignment> {
        self.active_tasks.read().await.values().cloned().collect()
    }

    /// Cancel a running task
    pub async fn cancel_task(&self, task_id: &str) -> bool {
        self.active_tasks.write().await.remove(task_id).is_some()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_orchestrator_creation() {
        let registry = Arc::new(AgentRegistry::with_voicecode_agent());
        let config = OrchestratorConfig::default();
        let orchestrator = AgentOrchestrator::new(registry, config);

        let active = orchestrator.active_tasks().await;
        assert!(active.is_empty());
    }

    #[tokio::test]
    async fn test_single_agent_execution() {
        let registry = Arc::new(AgentRegistry::with_voicecode_agent());
        let orchestrator = AgentOrchestrator::new(registry, OrchestratorConfig::default());

        let context = TaskContext {
            file_path: Some("test.rs".to_string()),
            ..Default::default()
        };

        let result = orchestrator
            .execute_task(
                TaskType::CodeGeneration {
                    language: Some("rust".to_string()),
                    description: "Hello world function".to_string(),
                },
                context,
                OrchestrationStrategy::SingleAgent,
            )
            .await;

        assert!(result.is_ok());
        let agg = result.unwrap();
        assert_eq!(agg.strategy, OrchestrationStrategy::SingleAgent);
        assert!(!agg.results.is_empty());
    }
}
