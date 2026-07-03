#![allow(dead_code, unused_variables, unused_imports)]
// Enhanced Subagent System - Specialized agents with model routing
// Implements Claude Code's subagent pattern with Plan/Explore/Code/Review agents

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

use super::agent_protocol::{AgentCapability, TaskContext};
use super::permissions::{OperationType, PermissionRequest, PermissionSystem};
use super::validation::{ContentType, ValidationContext, ValidationPipeline};

/// Built-in subagent types
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SubagentType {
    /// Planning agent - creates implementation plans
    Planner,
    /// Exploration agent - searches and analyzes codebase
    Explorer,
    /// Coding agent - writes and modifies code
    Coder,
    /// Review agent - reviews code for issues
    Reviewer,
    /// Test agent - generates and runs tests
    Tester,
    /// Documentation agent - writes docs and comments
    Documenter,
    /// Refactor agent - improves code structure
    Refactorer,
    /// Debug agent - diagnoses and fixes issues
    Debugger,
    /// Security agent - audits for vulnerabilities
    Security,
    /// General purpose agent
    General,
}

impl std::fmt::Display for SubagentType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Planner => write!(f, "planner"),
            Self::Explorer => write!(f, "explorer"),
            Self::Coder => write!(f, "coder"),
            Self::Reviewer => write!(f, "reviewer"),
            Self::Tester => write!(f, "tester"),
            Self::Documenter => write!(f, "documenter"),
            Self::Refactorer => write!(f, "refactorer"),
            Self::Debugger => write!(f, "debugger"),
            Self::Security => write!(f, "security"),
            Self::General => write!(f, "general"),
        }
    }
}

/// Model selection for subagents
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ModelTier {
    /// Fastest, cheapest - for simple tasks
    Fast,
    /// Balanced performance and capability
    Balanced,
    /// Most capable - for complex reasoning
    Advanced,
    /// Specialized for code
    Code,
}

impl Default for ModelTier {
    fn default() -> Self {
        Self::Balanced
    }
}

/// Model routing configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelRouter {
    /// Default model tier
    pub default_tier: ModelTier,
    /// Tier overrides by subagent type
    pub tier_overrides: HashMap<SubagentType, ModelTier>,
    /// Actual model names by tier
    pub models: HashMap<ModelTier, String>,
}

impl Default for ModelRouter {
    fn default() -> Self {
        let mut models = HashMap::new();
        models.insert(ModelTier::Fast, "claude-3-haiku".to_string());
        models.insert(ModelTier::Balanced, "claude-3-5-sonnet".to_string());
        models.insert(ModelTier::Advanced, "claude-opus-4".to_string());
        models.insert(ModelTier::Code, "claude-3-5-sonnet".to_string());

        let mut tier_overrides = HashMap::new();
        tier_overrides.insert(SubagentType::Explorer, ModelTier::Fast);
        tier_overrides.insert(SubagentType::Planner, ModelTier::Advanced);
        tier_overrides.insert(SubagentType::Coder, ModelTier::Code);
        tier_overrides.insert(SubagentType::Reviewer, ModelTier::Balanced);
        tier_overrides.insert(SubagentType::Security, ModelTier::Advanced);

        Self {
            default_tier: ModelTier::Balanced,
            tier_overrides,
            models,
        }
    }
}

impl ModelRouter {
    /// Get the model for a subagent type
    pub fn get_model(&self, agent_type: SubagentType) -> &str {
        let tier = self
            .tier_overrides
            .get(&agent_type)
            .unwrap_or(&self.default_tier);
        self.models
            .get(tier)
            .map(|s| s.as_str())
            .unwrap_or("claude-3-5-sonnet")
    }

    /// Override the model for a tier
    pub fn set_model(&mut self, tier: ModelTier, model: String) {
        self.models.insert(tier, model);
    }

    /// Override the tier for a subagent type
    pub fn set_tier_override(&mut self, agent_type: SubagentType, tier: ModelTier) {
        self.tier_overrides.insert(agent_type, tier);
    }
}

/// Subagent skill definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentSkill {
    /// Skill name
    pub name: String,
    /// Description
    pub description: String,
    /// Required capabilities
    pub required_capabilities: Vec<AgentCapability>,
    /// System prompt for this skill
    pub system_prompt: String,
    /// Example inputs
    pub examples: Vec<SkillExample>,
}

/// Example input/output for a skill
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillExample {
    pub input: String,
    pub output: String,
}

/// Subagent configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubagentConfig {
    /// Agent type
    pub agent_type: SubagentType,
    /// System prompt
    pub system_prompt: String,
    /// Maximum tokens for response
    pub max_tokens: usize,
    /// Temperature (0.0 - 1.0)
    pub temperature: f32,
    /// Whether agent can execute code
    pub can_execute: bool,
    /// Whether agent can modify files
    pub can_modify_files: bool,
    /// Skills this agent has
    pub skills: Vec<AgentSkill>,
    /// Timeout in seconds
    pub timeout_secs: u64,
}

impl SubagentConfig {
    /// Create a planner agent config
    pub fn planner() -> Self {
        Self {
            agent_type: SubagentType::Planner,
            system_prompt: r#"You are a planning agent that creates detailed implementation plans.

Your role is to:
1. Analyze the user's request thoroughly
2. Break down complex tasks into manageable steps
3. Identify files that need to be created or modified
4. Consider edge cases and potential issues
5. Provide clear, actionable steps

Output format:
- Use numbered steps
- Specify file paths for each change
- Describe what each step accomplishes
- Estimate complexity (low/medium/high) for each step

Do NOT write actual code - just plan the changes.
"#
            .to_string(),
            max_tokens: 4000,
            temperature: 0.3,
            can_execute: false,
            can_modify_files: false,
            skills: vec![],
            timeout_secs: 60,
        }
    }

    /// Create an explorer agent config
    pub fn explorer() -> Self {
        Self {
            agent_type: SubagentType::Explorer,
            system_prompt: r#"You are an exploration agent that searches and analyzes codebases.

Your role is to:
1. Search for relevant files and code patterns
2. Understand code structure and relationships
3. Find definitions and usages of symbols
4. Summarize findings concisely

You have access to search tools:
- grep: Search file contents
- glob: Find files by pattern
- read: Read file contents
- ast: Parse code structure

Be thorough but efficient - start broad and narrow down.
"#
            .to_string(),
            max_tokens: 2000,
            temperature: 0.1,
            can_execute: false,
            can_modify_files: false,
            skills: vec![],
            timeout_secs: 30,
        }
    }

    /// Create a coder agent config
    pub fn coder() -> Self {
        Self {
            agent_type: SubagentType::Coder,
            system_prompt: r#"You are a coding agent that implements features and fixes bugs.

Your role is to:
1. Write clean, idiomatic code
2. Follow existing patterns in the codebase
3. Include appropriate error handling
4. Add comments for complex logic
5. Keep changes minimal and focused

Best practices:
- Match the code style of surrounding code
- Use descriptive variable names
- Handle edge cases appropriately
- Avoid over-engineering

Always explain your changes briefly.
"#
            .to_string(),
            max_tokens: 8000,
            temperature: 0.2,
            can_execute: true,
            can_modify_files: true,
            skills: vec![],
            timeout_secs: 120,
        }
    }

    /// Create a reviewer agent config
    pub fn reviewer() -> Self {
        Self {
            agent_type: SubagentType::Reviewer,
            system_prompt:
                r#"You are a code review agent that identifies issues and suggests improvements.

Review categories:
1. **Correctness**: Logic errors, edge cases, null/undefined handling
2. **Security**: Injection, XSS, authentication issues
3. **Performance**: Inefficient algorithms, N+1 queries, memory leaks
4. **Maintainability**: Code clarity, naming, documentation
5. **Best Practices**: Language idioms, framework patterns

Output format:
- Severity: critical/high/medium/low
- Category: correctness/security/performance/maintainability/style
- Location: file:line
- Issue: Description
- Suggestion: How to fix

Be constructive and specific.
"#
                .to_string(),
            max_tokens: 4000,
            temperature: 0.2,
            can_execute: false,
            can_modify_files: false,
            skills: vec![],
            timeout_secs: 60,
        }
    }

    /// Create a tester agent config
    pub fn tester() -> Self {
        Self {
            agent_type: SubagentType::Tester,
            system_prompt: r#"You are a testing agent that generates comprehensive tests.

Your role is to:
1. Write unit tests for individual functions
2. Write integration tests for component interactions
3. Generate edge case tests
4. Create meaningful test assertions
5. Use appropriate mocking strategies

Test types to consider:
- Happy path tests
- Error condition tests
- Boundary value tests
- Null/empty input tests
- Concurrency tests (if applicable)

Match the testing framework used in the project.
"#
            .to_string(),
            max_tokens: 6000,
            temperature: 0.2,
            can_execute: true,
            can_modify_files: true,
            skills: vec![],
            timeout_secs: 90,
        }
    }

    /// Create a debugger agent config
    pub fn debugger() -> Self {
        Self {
            agent_type: SubagentType::Debugger,
            system_prompt: r#"You are a debugging agent that diagnoses and fixes issues.

Debugging approach:
1. Understand the error message/behavior
2. Trace the code path that leads to the issue
3. Identify the root cause (not just symptoms)
4. Propose a fix that addresses the root cause
5. Verify the fix doesn't introduce new issues

When analyzing:
- Look for off-by-one errors
- Check for null/undefined values
- Verify type assumptions
- Examine async/await flow
- Check resource cleanup

Provide clear explanation of the bug and fix.
"#
            .to_string(),
            max_tokens: 4000,
            temperature: 0.1,
            can_execute: true,
            can_modify_files: true,
            skills: vec![],
            timeout_secs: 90,
        }
    }

    /// Create a security agent config
    pub fn security() -> Self {
        Self {
            agent_type: SubagentType::Security,
            system_prompt: r#"You are a security agent that audits code for vulnerabilities.

Check for:
1. **Injection**: SQL, command, XSS, LDAP
2. **Authentication**: Weak passwords, session management
3. **Authorization**: Privilege escalation, IDOR
4. **Data Exposure**: Logging secrets, error messages
5. **Dependencies**: Known vulnerabilities

OWASP Top 10 checklist:
- A01: Broken Access Control
- A02: Cryptographic Failures
- A03: Injection
- A04: Insecure Design
- A05: Security Misconfiguration
- A06: Vulnerable Components
- A07: Authentication Failures
- A08: Data Integrity Failures
- A09: Logging Failures
- A10: Server-Side Request Forgery

Report with severity and remediation steps.
"#
            .to_string(),
            max_tokens: 4000,
            temperature: 0.1,
            can_execute: false,
            can_modify_files: false,
            skills: vec![],
            timeout_secs: 60,
        }
    }
}

/// Subagent execution result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubagentResult {
    /// Agent that produced the result
    pub agent_type: SubagentType,
    /// Model used
    pub model: String,
    /// Result content
    pub content: String,
    /// Execution time in milliseconds
    pub execution_time_ms: u64,
    /// Token usage
    pub tokens_used: TokenUsage,
    /// Whether result was validated
    pub validated: bool,
    /// Validation result
    pub validation_issues: Vec<String>,
    /// Artifacts produced (file changes, etc.)
    pub artifacts: Vec<SubagentArtifact>,
}

/// Token usage statistics
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct TokenUsage {
    pub input_tokens: usize,
    pub output_tokens: usize,
    pub total_tokens: usize,
}

/// Artifact produced by a subagent
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SubagentArtifact {
    /// File modification
    FileChange {
        path: String,
        change_type: String,
        content: Option<String>,
    },
    /// Generated test
    Test {
        path: String,
        test_name: String,
        content: String,
    },
    /// Plan/documentation
    Plan { steps: Vec<String> },
    /// Code snippet
    CodeSnippet { language: String, code: String },
}

/// Subagent manager
pub struct SubagentManager {
    /// Model router
    router: ModelRouter,
    /// Subagent configurations
    configs: HashMap<SubagentType, SubagentConfig>,
    /// Permission system
    permissions: Arc<PermissionSystem>,
    /// Validation pipeline
    validation: Arc<ValidationPipeline>,
    /// Execution history
    history: RwLock<Vec<SubagentResult>>,
    /// Active subagent sessions
    active_sessions: RwLock<HashMap<String, SubagentSession>>,
}

/// Active subagent session
#[derive(Debug)]
pub struct SubagentSession {
    pub session_id: String,
    pub agent_type: SubagentType,
    pub started_at: chrono::DateTime<chrono::Utc>,
    pub messages: Vec<SessionMessage>,
    pub context: TaskContext,
}

/// Message in a subagent session
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionMessage {
    pub role: String,
    pub content: String,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

impl SubagentManager {
    /// Create a new subagent manager
    pub fn new(permissions: Arc<PermissionSystem>, validation: Arc<ValidationPipeline>) -> Self {
        let mut configs = HashMap::new();

        // Register default configs
        configs.insert(SubagentType::Planner, SubagentConfig::planner());
        configs.insert(SubagentType::Explorer, SubagentConfig::explorer());
        configs.insert(SubagentType::Coder, SubagentConfig::coder());
        configs.insert(SubagentType::Reviewer, SubagentConfig::reviewer());
        configs.insert(SubagentType::Tester, SubagentConfig::tester());
        configs.insert(SubagentType::Debugger, SubagentConfig::debugger());
        configs.insert(SubagentType::Security, SubagentConfig::security());

        Self {
            router: ModelRouter::default(),
            configs,
            permissions,
            validation,
            history: RwLock::new(Vec::new()),
            active_sessions: RwLock::new(HashMap::new()),
        }
    }

    /// Get the appropriate subagent for a task
    pub fn select_agent(&self, task: &TaskContext) -> SubagentType {
        // Analyze task to select best agent
        let task_lower = task.description.as_deref().unwrap_or("").to_lowercase();

        if task_lower.contains("plan")
            || task_lower.contains("design")
            || task_lower.contains("architect")
        {
            SubagentType::Planner
        } else if task_lower.contains("search")
            || task_lower.contains("find")
            || task_lower.contains("where")
        {
            SubagentType::Explorer
        } else if task_lower.contains("review")
            || task_lower.contains("check")
            || task_lower.contains("audit")
        {
            if task_lower.contains("security") || task_lower.contains("vulnerab") {
                SubagentType::Security
            } else {
                SubagentType::Reviewer
            }
        } else if task_lower.contains("test") || task_lower.contains("spec") {
            SubagentType::Tester
        } else if task_lower.contains("debug")
            || task_lower.contains("fix")
            || task_lower.contains("error")
            || task_lower.contains("bug")
        {
            SubagentType::Debugger
        } else if task_lower.contains("refactor")
            || task_lower.contains("improve")
            || task_lower.contains("clean")
        {
            SubagentType::Refactorer
        } else if task_lower.contains("document")
            || task_lower.contains("comment")
            || task_lower.contains("explain")
        {
            SubagentType::Documenter
        } else {
            // Default to coder for implementation tasks
            SubagentType::Coder
        }
    }

    /// Get config for a subagent type
    pub fn get_config(&self, agent_type: SubagentType) -> Option<&SubagentConfig> {
        self.configs.get(&agent_type)
    }

    /// Update config for a subagent type
    pub fn set_config(&mut self, config: SubagentConfig) {
        self.configs.insert(config.agent_type, config);
    }

    /// Get model for a subagent type
    pub fn get_model(&self, agent_type: SubagentType) -> &str {
        self.router.get_model(agent_type)
    }

    /// Create a new session for a subagent
    pub async fn create_session(&self, agent_type: SubagentType, context: TaskContext) -> String {
        let session_id = uuid::Uuid::new_v4().to_string();

        let session = SubagentSession {
            session_id: session_id.clone(),
            agent_type,
            started_at: chrono::Utc::now(),
            messages: Vec::new(),
            context,
        };

        self.active_sessions
            .write()
            .await
            .insert(session_id.clone(), session);
        session_id
    }

    /// Add message to session
    pub async fn add_message(&self, session_id: &str, role: &str, content: &str) {
        if let Some(session) = self.active_sessions.write().await.get_mut(session_id) {
            session.messages.push(SessionMessage {
                role: role.to_string(),
                content: content.to_string(),
                timestamp: chrono::Utc::now(),
            });
        }
    }

    /// Get session messages
    pub async fn get_messages(&self, session_id: &str) -> Vec<SessionMessage> {
        self.active_sessions
            .read()
            .await
            .get(session_id)
            .map(|s| s.messages.clone())
            .unwrap_or_default()
    }

    /// Close a session
    pub async fn close_session(&self, session_id: &str) {
        self.active_sessions.write().await.remove(session_id);
    }

    /// Execute a subagent task with validation
    pub async fn execute(
        &self,
        agent_type: SubagentType,
        context: TaskContext,
    ) -> Result<SubagentResult, String> {
        let config = self
            .configs
            .get(&agent_type)
            .ok_or_else(|| format!("No config for agent type: {}", agent_type))?;

        let start_time = std::time::Instant::now();

        // Check permissions if agent can modify files
        if config.can_modify_files {
            for file in &context.files {
                let request = PermissionRequest {
                    operation: OperationType::FileWrite,
                    target: file.clone(),
                    description: format!("{} agent modifying file", agent_type),
                    agent_id: agent_type.to_string(),
                    risk_level: 3,
                    reversible: true,
                    preview: None,
                };

                let decision = self.permissions.check_permission(&request);
                if decision != super::permissions::PermissionDecision::Allow {
                    return Err(format!("Permission denied for file: {}", file));
                }
            }
        }

        // Build the prompt (placeholder - actual LLM integration would go here)
        let _prompt = self.build_prompt(config, &context);

        // Simulate execution (actual LLM call would go here)
        let content = format!(
            "[{} agent response]\n\nTask: {}\n\nThis is a placeholder response. \
            In production, this would contain the actual LLM response based on the \
            agent's system prompt and the task context.",
            agent_type, context.description.as_deref().unwrap_or("(no description)")
        );

        let execution_time_ms = start_time.elapsed().as_millis() as u64;

        // Validate the result
        let validation_context = ValidationContext {
            content: content.clone(),
            content_type: match agent_type {
                SubagentType::Coder | SubagentType::Tester | SubagentType::Refactorer => {
                    ContentType::Code
                }
                SubagentType::Planner | SubagentType::Documenter => ContentType::Documentation,
                _ => ContentType::Explanation,
            },
            related_files: context.files.iter().map(|s| s.into()).collect(),
            working_dir: std::env::current_dir().unwrap_or_default(),
            language: context.language.clone(),
            metadata: HashMap::new(),
        };

        let validation_result = self.validation.validate(&validation_context);

        let result = SubagentResult {
            agent_type,
            model: self.router.get_model(agent_type).to_string(),
            content,
            execution_time_ms,
            tokens_used: TokenUsage::default(),
            validated: validation_result.valid,
            validation_issues: validation_result
                .issues
                .iter()
                .map(|i| i.message.clone())
                .collect(),
            artifacts: Vec::new(),
        };

        // Record in history
        self.history.write().await.push(result.clone());

        Ok(result)
    }

    /// Build the prompt for a subagent
    fn build_prompt(&self, config: &SubagentConfig, context: &TaskContext) -> String {
        let mut prompt = String::new();

        // System prompt
        prompt.push_str(&config.system_prompt);
        prompt.push_str("\n\n---\n\n");

        // Context
        if !context.files.is_empty() {
            prompt.push_str("## Relevant Files\n");
            for file in &context.files {
                prompt.push_str(&format!("- {}\n", file));
            }
            prompt.push('\n');
        }

        if let Some(lang) = &context.language {
            prompt.push_str(&format!("## Language: {}\n\n", lang));
        }

        // Task
        prompt.push_str("## Task\n");
        if let Some(desc) = &context.description {
            prompt.push_str(desc);
        }

        prompt
    }

    /// Get execution history
    pub async fn get_history(&self) -> Vec<SubagentResult> {
        self.history.read().await.clone()
    }

    /// Clear execution history
    pub async fn clear_history(&self) {
        self.history.write().await.clear();
    }
}

/// Subagent pipeline for complex multi-agent workflows
pub struct SubagentPipeline {
    /// Stages in the pipeline
    stages: Vec<PipelineStage>,
    /// Whether to stop on error
    fail_fast: bool,
}

/// A stage in the subagent pipeline
pub struct PipelineStage {
    /// Stage name
    pub name: String,
    /// Agent type for this stage
    pub agent_type: SubagentType,
    /// Transform function to prepare context for next stage
    pub transform: Option<Box<dyn Fn(SubagentResult) -> TaskContext + Send + Sync>>,
    /// Condition to run this stage
    pub condition: Option<Box<dyn Fn(&TaskContext) -> bool + Send + Sync>>,
}

impl SubagentPipeline {
    /// Create a new pipeline
    pub fn new() -> Self {
        Self {
            stages: Vec::new(),
            fail_fast: true,
        }
    }

    /// Add a stage to the pipeline
    pub fn add_stage(mut self, stage: PipelineStage) -> Self {
        self.stages.push(stage);
        self
    }

    /// Set fail-fast mode
    pub fn fail_fast(mut self, fail_fast: bool) -> Self {
        self.fail_fast = fail_fast;
        self
    }

    /// Create a plan-implement-review pipeline
    pub fn plan_implement_review() -> Self {
        Self::new()
            .add_stage(PipelineStage {
                name: "Plan".to_string(),
                agent_type: SubagentType::Planner,
                transform: Some(Box::new(|result| TaskContext {
                    description: Some(format!("Implement the following plan:\n{}", result.content)),
                    ..Default::default()
                })),
                condition: None,
            })
            .add_stage(PipelineStage {
                name: "Implement".to_string(),
                agent_type: SubagentType::Coder,
                transform: Some(Box::new(|result| TaskContext {
                    description: Some(format!(
                        "Review the following implementation:\n{}",
                        result.content
                    )),
                    ..Default::default()
                })),
                condition: None,
            })
            .add_stage(PipelineStage {
                name: "Review".to_string(),
                agent_type: SubagentType::Reviewer,
                transform: None,
                condition: None,
            })
    }

    /// Create an explore-plan-implement pipeline
    pub fn explore_plan_implement() -> Self {
        Self::new()
            .add_stage(PipelineStage {
                name: "Explore".to_string(),
                agent_type: SubagentType::Explorer,
                transform: Some(Box::new(|result| TaskContext {
                    description: Some(format!(
                        "Based on this exploration:\n{}\n\nCreate an implementation plan.",
                        result.content
                    )),
                    ..Default::default()
                })),
                condition: None,
            })
            .add_stage(PipelineStage {
                name: "Plan".to_string(),
                agent_type: SubagentType::Planner,
                transform: Some(Box::new(|result| TaskContext {
                    description: Some(format!("Implement this plan:\n{}", result.content)),
                    ..Default::default()
                })),
                condition: None,
            })
            .add_stage(PipelineStage {
                name: "Implement".to_string(),
                agent_type: SubagentType::Coder,
                transform: None,
                condition: None,
            })
    }

    /// Execute the pipeline
    pub async fn execute(
        &self,
        manager: &SubagentManager,
        initial_context: TaskContext,
    ) -> Result<Vec<SubagentResult>, String> {
        let mut results = Vec::new();
        let mut current_context = initial_context;

        for stage in &self.stages {
            // Check condition
            if let Some(condition) = &stage.condition {
                if !condition(&current_context) {
                    continue;
                }
            }

            // Execute stage
            match manager
                .execute(stage.agent_type, current_context.clone())
                .await
            {
                Ok(result) => {
                    // Transform for next stage
                    if let Some(transform) = &stage.transform {
                        current_context = transform(result.clone());
                    }
                    results.push(result);
                }
                Err(e) => {
                    if self.fail_fast {
                        return Err(format!("Stage '{}' failed: {}", stage.name, e));
                    }
                }
            }
        }

        Ok(results)
    }
}

impl Default for SubagentPipeline {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn test_model_router() {
        let router = ModelRouter::default();

        // Explorer should use fast model
        assert_eq!(router.get_model(SubagentType::Explorer), "claude-3-haiku");

        // Planner should use advanced model
        assert_eq!(router.get_model(SubagentType::Planner), "claude-opus-4");

        // Coder should use code model
        assert_eq!(router.get_model(SubagentType::Coder), "claude-3-5-sonnet");
    }

    #[test]
    fn test_agent_selection() {
        let permissions = Arc::new(PermissionSystem::new(PathBuf::from(".")));
        let validation = Arc::new(ValidationPipeline::default_pipeline(PathBuf::from(".")));
        let manager = SubagentManager::new(permissions, validation);

        let plan_task = TaskContext {
            description: Some("Plan the implementation of a new feature".to_string()),
            ..Default::default()
        };
        assert_eq!(manager.select_agent(&plan_task), SubagentType::Planner);

        let search_task = TaskContext {
            description: Some("Find where the user authentication is handled".to_string()),
            ..Default::default()
        };
        assert_eq!(manager.select_agent(&search_task), SubagentType::Explorer);

        let debug_task = TaskContext {
            description: Some("Fix the bug in the login flow".to_string()),
            ..Default::default()
        };
        assert_eq!(manager.select_agent(&debug_task), SubagentType::Debugger);

        let security_task = TaskContext {
            description: Some("Review for security vulnerabilities".to_string()),
            ..Default::default()
        };
        assert_eq!(manager.select_agent(&security_task), SubagentType::Security);
    }

    #[test]
    fn test_subagent_configs() {
        let planner = SubagentConfig::planner();
        assert!(!planner.can_execute);
        assert!(!planner.can_modify_files);

        let coder = SubagentConfig::coder();
        assert!(coder.can_execute);
        assert!(coder.can_modify_files);

        let reviewer = SubagentConfig::reviewer();
        assert!(!reviewer.can_execute);
        assert!(!reviewer.can_modify_files);
    }
}
