#![allow(dead_code, unused_variables, unused_imports)]
// Phase 5: Agentic Capabilities - Task Planner
// Plans multi-step coding tasks with execution strategy

use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use serde::{Deserialize, Serialize};
use parking_lot::RwLock;
use uuid::Uuid;

use super::context_builder::ProjectContext;
use super::intent_classifier::{ClassifiedIntent, CodingIntent};
use super::llm_client::{LLMClient, LLMRequest, Message};

/// A planned task step
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskStep {
    pub id: String,
    pub order: usize,
    pub action: StepAction,
    pub description: String,
    pub target: StepTarget,
    pub dependencies: Vec<String>,
    pub status: StepStatus,
    pub result: Option<StepResult>,
    pub rollback: Option<RollbackInfo>,
}

/// Type of action to perform
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum StepAction {
    /// Read file content
    ReadFile,
    /// Write/create file
    WriteFile,
    /// Modify existing code
    ModifyCode,
    /// Delete file or code
    Delete,
    /// Run command
    RunCommand,
    /// Search codebase
    Search,
    /// Generate code with LLM
    GenerateCode,
    /// Verify/test changes
    Verify,
    /// Analyze code
    Analyze,
    /// Create directory
    CreateDirectory,
    /// Move/rename file
    MoveFile,
    /// Install dependency
    InstallDependency,
}

/// Target of the step
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StepTarget {
    pub file_path: Option<PathBuf>,
    pub symbol_name: Option<String>,
    pub line_range: Option<(usize, usize)>,
    pub content: Option<String>,
    pub command: Option<String>,
}

/// Status of a step
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum StepStatus {
    Pending,
    InProgress,
    Completed,
    Failed,
    Skipped,
    RolledBack,
}

/// Result of executing a step
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StepResult {
    pub success: bool,
    pub output: Option<String>,
    pub error: Option<String>,
    pub artifacts: Vec<String>,
    pub duration_ms: u64,
}

/// Information for rolling back a step
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RollbackInfo {
    pub action: RollbackAction,
    pub original_content: Option<String>,
    pub backup_path: Option<PathBuf>,
}

/// How to rollback a step
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RollbackAction {
    RestoreContent,
    DeleteFile,
    RestoreFile,
    RunCommand(String),
    NoAction,
}

/// A complete task plan
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskPlan {
    pub id: String,
    pub name: String,
    pub description: String,
    pub intent: CodingIntent,
    pub steps: Vec<TaskStep>,
    pub status: PlanStatus,
    pub context: Option<ProjectContext>,
    pub created_at: u64,
    pub updated_at: u64,
    pub executed_steps: usize,
    pub total_duration_ms: u64,
}

/// Status of the overall plan
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum PlanStatus {
    Draft,
    Ready,
    Executing,
    Paused,
    Completed,
    Failed,
    RolledBack,
}

impl TaskPlan {
    pub fn new(name: impl Into<String>, description: impl Into<String>, intent: CodingIntent) -> Self {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        Self {
            id: Uuid::new_v4().to_string(),
            name: name.into(),
            description: description.into(),
            intent,
            steps: Vec::new(),
            status: PlanStatus::Draft,
            context: None,
            created_at: now,
            updated_at: now,
            executed_steps: 0,
            total_duration_ms: 0,
        }
    }

    pub fn add_step(&mut self, step: TaskStep) {
        self.steps.push(step);
        self.update_timestamp();
    }

    pub fn get_next_step(&self) -> Option<&TaskStep> {
        self.steps.iter().find(|s| s.status == StepStatus::Pending)
    }

    pub fn get_step_mut(&mut self, step_id: &str) -> Option<&mut TaskStep> {
        self.steps.iter_mut().find(|s| s.id == step_id)
    }

    fn update_timestamp(&mut self) {
        self.updated_at = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
    }

    pub fn is_complete(&self) -> bool {
        self.steps.iter().all(|s| {
            matches!(s.status, StepStatus::Completed | StepStatus::Skipped)
        })
    }

    pub fn can_rollback(&self) -> bool {
        self.steps.iter().any(|s| {
            s.status == StepStatus::Completed && s.rollback.is_some()
        })
    }
}

/// Task planner configuration
#[derive(Debug, Clone)]
pub struct PlannerConfig {
    /// Maximum steps per plan
    pub max_steps: usize,
    /// Allow destructive operations
    pub allow_destructive: bool,
    /// Require confirmation for each step
    pub require_confirmation: bool,
    /// Auto-rollback on failure
    pub auto_rollback: bool,
    /// Backup original files
    pub backup_files: bool,
    /// Backup directory
    pub backup_dir: Option<PathBuf>,
}

impl Default for PlannerConfig {
    fn default() -> Self {
        Self {
            max_steps: 20,
            allow_destructive: false,
            require_confirmation: true,
            auto_rollback: true,
            backup_files: true,
            backup_dir: None,
        }
    }
}

/// Task planner for breaking down coding tasks
pub struct TaskPlanner {
    config: PlannerConfig,
    llm_client: Option<Arc<LLMClient>>,
    active_plans: RwLock<HashMap<String, TaskPlan>>,
    templates: HashMap<CodingIntent, PlanTemplate>,
}

/// Template for common plan patterns
#[derive(Debug, Clone)]
pub struct PlanTemplate {
    pub name: String,
    pub steps: Vec<TemplateStep>,
}

#[derive(Debug, Clone)]
pub struct TemplateStep {
    pub action: StepAction,
    pub description: String,
    pub requires_target: bool,
}

impl TaskPlanner {
    pub fn new(config: PlannerConfig) -> Self {
        let mut planner = Self {
            config,
            llm_client: None,
            active_plans: RwLock::new(HashMap::new()),
            templates: HashMap::new(),
        };
        planner.initialize_templates();
        planner
    }

    pub fn with_llm(mut self, client: Arc<LLMClient>) -> Self {
        self.llm_client = Some(client);
        self
    }

    fn initialize_templates(&mut self) {
        // Create function template
        self.templates.insert(CodingIntent::Create, PlanTemplate {
            name: "Create Code".to_string(),
            steps: vec![
                TemplateStep {
                    action: StepAction::Analyze,
                    description: "Analyze project structure and dependencies".to_string(),
                    requires_target: false,
                },
                TemplateStep {
                    action: StepAction::GenerateCode,
                    description: "Generate the requested code".to_string(),
                    requires_target: true,
                },
                TemplateStep {
                    action: StepAction::WriteFile,
                    description: "Write code to file".to_string(),
                    requires_target: true,
                },
                TemplateStep {
                    action: StepAction::Verify,
                    description: "Verify code compiles/runs".to_string(),
                    requires_target: true,
                },
            ],
        });

        // Modify code template
        self.templates.insert(CodingIntent::Modify, PlanTemplate {
            name: "Modify Code".to_string(),
            steps: vec![
                TemplateStep {
                    action: StepAction::ReadFile,
                    description: "Read current file content".to_string(),
                    requires_target: true,
                },
                TemplateStep {
                    action: StepAction::Analyze,
                    description: "Analyze code to modify".to_string(),
                    requires_target: true,
                },
                TemplateStep {
                    action: StepAction::GenerateCode,
                    description: "Generate modified code".to_string(),
                    requires_target: true,
                },
                TemplateStep {
                    action: StepAction::ModifyCode,
                    description: "Apply modifications".to_string(),
                    requires_target: true,
                },
                TemplateStep {
                    action: StepAction::Verify,
                    description: "Verify changes work correctly".to_string(),
                    requires_target: true,
                },
            ],
        });

        // Fix bug template
        self.templates.insert(CodingIntent::Fix, PlanTemplate {
            name: "Fix Bug".to_string(),
            steps: vec![
                TemplateStep {
                    action: StepAction::ReadFile,
                    description: "Read file with bug".to_string(),
                    requires_target: true,
                },
                TemplateStep {
                    action: StepAction::Analyze,
                    description: "Analyze bug and root cause".to_string(),
                    requires_target: true,
                },
                TemplateStep {
                    action: StepAction::GenerateCode,
                    description: "Generate fix".to_string(),
                    requires_target: true,
                },
                TemplateStep {
                    action: StepAction::ModifyCode,
                    description: "Apply fix".to_string(),
                    requires_target: true,
                },
                TemplateStep {
                    action: StepAction::Verify,
                    description: "Verify bug is fixed".to_string(),
                    requires_target: true,
                },
            ],
        });

        // Refactor template
        self.templates.insert(CodingIntent::Refactor, PlanTemplate {
            name: "Refactor Code".to_string(),
            steps: vec![
                TemplateStep {
                    action: StepAction::ReadFile,
                    description: "Read code to refactor".to_string(),
                    requires_target: true,
                },
                TemplateStep {
                    action: StepAction::Analyze,
                    description: "Analyze code structure and dependencies".to_string(),
                    requires_target: true,
                },
                TemplateStep {
                    action: StepAction::GenerateCode,
                    description: "Generate refactored code".to_string(),
                    requires_target: true,
                },
                TemplateStep {
                    action: StepAction::ModifyCode,
                    description: "Apply refactoring".to_string(),
                    requires_target: true,
                },
                TemplateStep {
                    action: StepAction::Verify,
                    description: "Verify functionality preserved".to_string(),
                    requires_target: true,
                },
            ],
        });

        // Add tests template
        self.templates.insert(CodingIntent::Test, PlanTemplate {
            name: "Add Tests".to_string(),
            steps: vec![
                TemplateStep {
                    action: StepAction::ReadFile,
                    description: "Read code to test".to_string(),
                    requires_target: true,
                },
                TemplateStep {
                    action: StepAction::Analyze,
                    description: "Analyze code paths and edge cases".to_string(),
                    requires_target: true,
                },
                TemplateStep {
                    action: StepAction::GenerateCode,
                    description: "Generate test code".to_string(),
                    requires_target: true,
                },
                TemplateStep {
                    action: StepAction::WriteFile,
                    description: "Write test file".to_string(),
                    requires_target: true,
                },
                TemplateStep {
                    action: StepAction::RunCommand,
                    description: "Run tests".to_string(),
                    requires_target: false,
                },
            ],
        });
    }

    /// Create a plan from a classified intent
    pub fn create_plan(
        &self,
        intent: &ClassifiedIntent,
        context: Option<ProjectContext>,
    ) -> Result<TaskPlan, String> {
        let mut plan = TaskPlan::new(
            format!("{:?} task", intent.intent),
            intent.original_text.clone(),
            intent.intent.clone(),
        );
        plan.context = context;

        // Get template for intent
        if let Some(template) = self.templates.get(&intent.intent) {
            for (i, template_step) in template.steps.iter().enumerate() {
                let target = StepTarget {
                    file_path: intent.parameters.get("file").map(PathBuf::from),
                    symbol_name: intent.target.clone(),
                    line_range: None,
                    content: None,
                    command: None,
                };

                let step = TaskStep {
                    id: Uuid::new_v4().to_string(),
                    order: i,
                    action: template_step.action.clone(),
                    description: template_step.description.clone(),
                    target,
                    dependencies: if i > 0 {
                        vec![plan.steps[i - 1].id.clone()]
                    } else {
                        vec![]
                    },
                    status: StepStatus::Pending,
                    result: None,
                    rollback: None,
                };

                plan.add_step(step);
            }
        } else {
            // Generic plan for unknown intents
            plan.add_step(TaskStep {
                id: Uuid::new_v4().to_string(),
                order: 0,
                action: StepAction::Analyze,
                description: "Analyze request and context".to_string(),
                target: StepTarget {
                    file_path: None,
                    symbol_name: intent.target.clone(),
                    line_range: None,
                    content: Some(intent.original_text.clone()),
                    command: None,
                },
                dependencies: vec![],
                status: StepStatus::Pending,
                result: None,
                rollback: None,
            });

            plan.add_step(TaskStep {
                id: Uuid::new_v4().to_string(),
                order: 1,
                action: StepAction::GenerateCode,
                description: "Generate solution".to_string(),
                target: StepTarget {
                    file_path: None,
                    symbol_name: None,
                    line_range: None,
                    content: None,
                    command: None,
                },
                dependencies: vec![plan.steps[0].id.clone()],
                status: StepStatus::Pending,
                result: None,
                rollback: None,
            });
        }

        plan.status = PlanStatus::Ready;

        // Store plan
        self.active_plans.write().insert(plan.id.clone(), plan.clone());

        Ok(plan)
    }

    /// Create a detailed plan using LLM
    pub async fn create_detailed_plan(
        &self,
        intent: &ClassifiedIntent,
        context: &ProjectContext,
    ) -> Result<TaskPlan, String> {
        let llm = self.llm_client.as_ref()
            .ok_or("LLM client not configured")?;

        // Build prompt for plan generation
        let prompt = format!(
            r#"Create a detailed step-by-step plan for the following coding task.

Task: {}
Intent: {:?}
Target: {:?}

Project Context:
- Files: {} files indexed
- Current file: {:?}

Output a JSON plan with steps. Each step should have:
- action: one of [ReadFile, WriteFile, ModifyCode, Delete, RunCommand, Search, GenerateCode, Verify, Analyze]
- description: what the step does
- target: file path or symbol name if applicable

Keep the plan focused and actionable. Maximum {} steps."#,
            intent.original_text,
            intent.intent,
            intent.target,
            context.stats.files_included,
            context.current_file,
            self.config.max_steps,
        );

        let request = LLMRequest::new(vec![
            Message::system("You are a coding assistant that creates detailed task plans."),
            Message::user(prompt),
        ]);

        let response = llm.complete(request).await?;

        // Parse LLM response into plan
        // For now, create a basic plan and enhance it
        let plan = self.create_plan(intent, Some(context.clone()))?;

        // Could parse LLM response to add more detailed steps
        // This is a simplified version

        Ok(plan)
    }

    /// Get a plan by ID
    pub fn get_plan(&self, plan_id: &str) -> Option<TaskPlan> {
        self.active_plans.read().get(plan_id).cloned()
    }

    /// Update a plan
    pub fn update_plan(&self, plan: TaskPlan) {
        self.active_plans.write().insert(plan.id.clone(), plan);
    }

    /// Remove a plan
    pub fn remove_plan(&self, plan_id: &str) -> Option<TaskPlan> {
        self.active_plans.write().remove(plan_id)
    }

    /// List all active plans
    pub fn list_plans(&self) -> Vec<TaskPlan> {
        self.active_plans.read().values().cloned().collect()
    }

    /// Validate a plan before execution
    pub fn validate_plan(&self, plan: &TaskPlan) -> Result<(), String> {
        if plan.steps.is_empty() {
            return Err("Plan has no steps".to_string());
        }

        if plan.steps.len() > self.config.max_steps {
            return Err(format!(
                "Plan has too many steps ({} > {})",
                plan.steps.len(),
                self.config.max_steps
            ));
        }

        // Check for circular dependencies
        for step in &plan.steps {
            for dep_id in &step.dependencies {
                let dep = plan.steps.iter().find(|s| &s.id == dep_id);
                if let Some(dep_step) = dep {
                    if dep_step.order >= step.order {
                        return Err(format!(
                            "Circular dependency: step {} depends on step {} which comes later",
                            step.order, dep_step.order
                        ));
                    }
                } else {
                    return Err(format!("Unknown dependency: {}", dep_id));
                }
            }
        }

        // Check for destructive operations
        if !self.config.allow_destructive {
            for step in &plan.steps {
                if matches!(step.action, StepAction::Delete) {
                    return Err("Destructive operations not allowed".to_string());
                }
            }
        }

        Ok(())
    }
}

/// Step executor for running plan steps
pub struct StepExecutor {
    planner: Arc<TaskPlanner>,
    llm_client: Option<Arc<LLMClient>>,
}

impl StepExecutor {
    pub fn new(planner: Arc<TaskPlanner>) -> Self {
        Self {
            planner,
            llm_client: None,
        }
    }

    pub fn with_llm(mut self, client: Arc<LLMClient>) -> Self {
        self.llm_client = Some(client);
        self
    }

    /// Execute a single step
    pub async fn execute_step(
        &self,
        plan: &mut TaskPlan,
        step_id: &str,
    ) -> Result<StepResult, String> {
        // First, check if step exists and get dependencies
        let (dependencies, target, action) = {
            let step = plan.steps.iter().find(|s| s.id == step_id)
                .ok_or("Step not found")?;
            (step.dependencies.clone(), step.target.clone(), step.action.clone())
        };

        // Check dependencies
        for dep_id in &dependencies {
            if let Some(dep_step) = plan.steps.iter().find(|s| &s.id == dep_id) {
                if dep_step.status != StepStatus::Completed {
                    return Err(format!("Dependency {} not completed", dep_id));
                }
            }
        }

        // Set status to in progress
        if let Some(step) = plan.steps.iter_mut().find(|s| s.id == step_id) {
            step.status = StepStatus::InProgress;
        }

        let start = std::time::Instant::now();
        let context = plan.context.clone();

        let result = match action {
            StepAction::ReadFile => self.execute_read_file(&target).await,
            StepAction::WriteFile => self.execute_write_file(&target).await,
            StepAction::ModifyCode => self.execute_modify_code(&target, context.as_ref()).await,
            StepAction::Delete => self.execute_delete(&target).await,
            StepAction::RunCommand => self.execute_run_command(&target).await,
            StepAction::Search => self.execute_search(&target).await,
            StepAction::GenerateCode => self.execute_generate_code(&target, context.as_ref()).await,
            StepAction::Verify => self.execute_verify(&target).await,
            StepAction::Analyze => self.execute_analyze(&target).await,
            StepAction::CreateDirectory => self.execute_create_directory(&target).await,
            StepAction::MoveFile => self.execute_move_file(&target).await,
            StepAction::InstallDependency => self.execute_install_dep(&target).await,
        };

        let duration = start.elapsed().as_millis() as u64;

        match result {
            Ok(output) => {
                let step_result = StepResult {
                    success: true,
                    output: Some(output),
                    error: None,
                    artifacts: vec![],
                    duration_ms: duration,
                };
                if let Some(step) = plan.steps.iter_mut().find(|s| s.id == step_id) {
                    step.status = StepStatus::Completed;
                    step.result = Some(step_result.clone());
                }
                plan.executed_steps += 1;
                plan.total_duration_ms += duration;
                Ok(step_result)
            }
            Err(error) => {
                if let Some(step) = plan.steps.iter_mut().find(|s| s.id == step_id) {
                    step.status = StepStatus::Failed;
                    step.result = Some(StepResult {
                        success: false,
                        output: None,
                        error: Some(error.clone()),
                        artifacts: vec![],
                        duration_ms: duration,
                    });
                }
                plan.status = PlanStatus::Failed;
                Err(error)
            }
        }
    }

    /// Execute all steps in plan
    pub async fn execute_plan(&self, plan: &mut TaskPlan) -> Result<(), String> {
        self.planner.validate_plan(plan)?;
        plan.status = PlanStatus::Executing;

        let step_ids: Vec<String> = plan.steps.iter().map(|s| s.id.clone()).collect();

        for step_id in step_ids {
            if let Err(e) = self.execute_step(plan, &step_id).await {
                if self.planner.config.auto_rollback {
                    self.rollback_plan(plan).await?;
                }
                return Err(e);
            }
        }

        plan.status = PlanStatus::Completed;
        Ok(())
    }

    /// Rollback executed steps
    pub async fn rollback_plan(&self, plan: &mut TaskPlan) -> Result<(), String> {
        // Rollback in reverse order
        let completed_steps: Vec<String> = plan.steps.iter()
            .filter(|s| s.status == StepStatus::Completed && s.rollback.is_some())
            .map(|s| s.id.clone())
            .rev()
            .collect();

        for step_id in completed_steps {
            if let Some(step) = plan.get_step_mut(&step_id) {
                if let Some(rollback) = &step.rollback {
                    match &rollback.action {
                        RollbackAction::RestoreContent => {
                            if let (Some(path), Some(content)) = (&step.target.file_path, &rollback.original_content) {
                                std::fs::write(path, content)
                                    .map_err(|e| format!("Rollback failed: {}", e))?;
                            }
                        }
                        RollbackAction::DeleteFile => {
                            if let Some(path) = &step.target.file_path {
                                std::fs::remove_file(path)
                                    .map_err(|e| format!("Rollback failed: {}", e))?;
                            }
                        }
                        RollbackAction::RestoreFile => {
                            if let (Some(backup), Some(target)) = (&rollback.backup_path, &step.target.file_path) {
                                std::fs::copy(backup, target)
                                    .map_err(|e| format!("Rollback failed: {}", e))?;
                            }
                        }
                        RollbackAction::RunCommand(cmd) => {
                            // Execute rollback command
                            std::process::Command::new("sh")
                                .args(["-c", cmd])
                                .output()
                                .map_err(|e| format!("Rollback command failed: {}", e))?;
                        }
                        RollbackAction::NoAction => {}
                    }
                    step.status = StepStatus::RolledBack;
                }
            }
        }

        plan.status = PlanStatus::RolledBack;
        Ok(())
    }

    // Step execution implementations

    async fn execute_read_file(&self, target: &StepTarget) -> Result<String, String> {
        let path = target.file_path.as_ref()
            .ok_or("No file path specified")?;

        std::fs::read_to_string(path)
            .map_err(|e| format!("Failed to read file: {}", e))
    }

    async fn execute_write_file(&self, target: &StepTarget) -> Result<String, String> {
        let path = target.file_path.as_ref()
            .ok_or("No file path specified")?;
        let content = target.content.as_ref()
            .ok_or("No content to write")?;

        std::fs::write(path, content)
            .map_err(|e| format!("Failed to write file: {}", e))?;

        Ok(format!("Wrote {} bytes to {:?}", content.len(), path))
    }

    async fn execute_modify_code(&self, target: &StepTarget, context: Option<&ProjectContext>) -> Result<String, String> {
        // Would use LLM to generate modifications
        Ok("Code modification placeholder".to_string())
    }

    async fn execute_delete(&self, target: &StepTarget) -> Result<String, String> {
        if let Some(path) = &target.file_path {
            std::fs::remove_file(path)
                .map_err(|e| format!("Failed to delete: {}", e))?;
            Ok(format!("Deleted {:?}", path))
        } else {
            Err("No target to delete".to_string())
        }
    }

    async fn execute_run_command(&self, target: &StepTarget) -> Result<String, String> {
        let cmd = target.command.as_ref()
            .ok_or("No command specified")?;

        let output = std::process::Command::new("sh")
            .args(["-c", cmd])
            .output()
            .map_err(|e| format!("Command failed: {}", e))?;

        if output.status.success() {
            Ok(String::from_utf8_lossy(&output.stdout).to_string())
        } else {
            Err(String::from_utf8_lossy(&output.stderr).to_string())
        }
    }

    async fn execute_search(&self, target: &StepTarget) -> Result<String, String> {
        Ok("Search results placeholder".to_string())
    }

    async fn execute_generate_code(&self, target: &StepTarget, context: Option<&ProjectContext>) -> Result<String, String> {
        let llm = self.llm_client.as_ref()
            .ok_or("LLM client not configured")?;

        let prompt = target.content.as_ref()
            .ok_or("No generation prompt")?;

        let request = LLMRequest::new(vec![
            Message::system("You are an expert programmer. Generate clean, efficient code."),
            Message::user(prompt.clone()),
        ]);

        let response = llm.complete(request).await?;
        Ok(response.content)
    }

    async fn execute_verify(&self, target: &StepTarget) -> Result<String, String> {
        // Run tests or type check
        Ok("Verification placeholder".to_string())
    }

    async fn execute_analyze(&self, target: &StepTarget) -> Result<String, String> {
        Ok("Analysis placeholder".to_string())
    }

    async fn execute_create_directory(&self, target: &StepTarget) -> Result<String, String> {
        let path = target.file_path.as_ref()
            .ok_or("No directory path specified")?;

        std::fs::create_dir_all(path)
            .map_err(|e| format!("Failed to create directory: {}", e))?;

        Ok(format!("Created directory {:?}", path))
    }

    async fn execute_move_file(&self, target: &StepTarget) -> Result<String, String> {
        Err("Move file not yet implemented".to_string())
    }

    async fn execute_install_dep(&self, target: &StepTarget) -> Result<String, String> {
        Err("Install dependency not yet implemented".to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_task_plan_creation() {
        let plan = TaskPlan::new("Test Plan", "A test plan", CodingIntent::Create);
        assert_eq!(plan.status, PlanStatus::Draft);
        assert!(plan.steps.is_empty());
    }

    #[test]
    fn test_planner_create_plan() {
        let planner = TaskPlanner::new(PlannerConfig::default());
        let intent = ClassifiedIntent {
            intent: CodingIntent::Create,
            confidence: 0.9,
            target: Some("myFunction".to_string()),
            action: Some("create".to_string()),
            parameters: HashMap::new(),
            original_text: "create a function myFunction".to_string(),
        };

        let plan = planner.create_plan(&intent, None).unwrap();
        assert!(!plan.steps.is_empty());
        assert_eq!(plan.status, PlanStatus::Ready);
    }

    #[test]
    fn test_plan_validation() {
        let planner = TaskPlanner::new(PlannerConfig::default());
        let plan = TaskPlan::new("Empty Plan", "No steps", CodingIntent::Create);

        assert!(planner.validate_plan(&plan).is_err());
    }
}
