#![allow(dead_code, unused_variables, unused_imports)]
// Pipeline Transformations - Advanced multi-agent workflow orchestration
// Provides composable pipeline stages with transformations, branching, and error handling

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use super::agent_protocol::{CodeChange, TaskContext, TaskResult, TaskStatus};
use super::enhanced_agents::EnhancedAgentAdapter;
use super::subagents::{SubagentManager, SubagentType};
use super::consensus::{find_consensus, ConsensusConfig};

// ============================================================================
// Pipeline Stage Traits
// ============================================================================

/// A transformation that can be applied to pipeline data
#[async_trait]
pub trait PipelineTransform: Send + Sync {
    /// Transform input data to output data
    async fn transform(&self, input: PipelineData) -> Result<PipelineData, PipelineError>;

    /// Get the name of this transform
    fn name(&self) -> &str;
}

/// Data flowing through the pipeline
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PipelineData {
    /// The task context
    pub context: TaskContext,
    /// Results from previous stages
    pub results: Vec<StageResult>,
    /// Metadata for the pipeline run
    pub metadata: HashMap<String, String>,
    /// Accumulated artifacts
    pub artifacts: Vec<PipelineArtifact>,
}

impl Default for PipelineData {
    fn default() -> Self {
        Self {
            context: TaskContext::default(),
            results: Vec::new(),
            metadata: HashMap::new(),
            artifacts: Vec::new(),
        }
    }
}

impl PipelineData {
    /// Create from a task context
    pub fn from_context(context: TaskContext) -> Self {
        Self {
            context,
            ..Default::default()
        }
    }

    /// Add a result to the pipeline
    pub fn add_result(&mut self, result: StageResult) {
        self.results.push(result);
    }

    /// Get the latest result
    pub fn latest_result(&self) -> Option<&StageResult> {
        self.results.last()
    }

    /// Get all outputs combined
    pub fn combined_output(&self) -> String {
        self.results
            .iter()
            .map(|r| format!("## {}\n\n{}", r.stage_name, r.output))
            .collect::<Vec<_>>()
            .join("\n\n---\n\n")
    }

    /// Set metadata
    pub fn with_metadata(mut self, key: &str, value: &str) -> Self {
        self.metadata.insert(key.to_string(), value.to_string());
        self
    }
}

/// Result from a pipeline stage
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StageResult {
    /// Stage name
    pub stage_name: String,
    /// Agent type that executed the stage
    pub agent_type: Option<SubagentType>,
    /// Output content
    pub output: String,
    /// Whether the stage succeeded
    pub success: bool,
    /// Error message if failed
    pub error: Option<String>,
    /// Execution time in milliseconds
    pub execution_time_ms: u64,
    /// Code changes produced
    pub code_changes: Vec<CodeChange>,
    /// Confidence score
    pub confidence: f32,
}

/// Artifact produced during pipeline execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PipelineArtifact {
    /// Generated code
    Code {
        language: String,
        content: String,
        file_path: Option<String>,
    },
    /// Documentation
    Documentation {
        format: String,
        content: String,
    },
    /// Test cases
    Tests {
        framework: String,
        test_code: String,
    },
    /// Analysis report
    Report {
        title: String,
        sections: Vec<ReportSection>,
    },
    /// Diff/patch
    Patch {
        file_path: String,
        diff: String,
    },
}

/// Section in a report artifact
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReportSection {
    pub heading: String,
    pub content: String,
    pub severity: Option<String>,
}

/// Pipeline execution error
#[derive(Debug, Clone)]
pub struct PipelineError {
    pub stage: String,
    pub message: String,
    pub recoverable: bool,
}

impl std::fmt::Display for PipelineError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "Pipeline error in '{}': {}", self.stage, self.message)
    }
}

impl std::error::Error for PipelineError {}

// ============================================================================
// Built-in Transforms
// ============================================================================

/// Identity transform - passes data through unchanged
pub struct IdentityTransform;

#[async_trait]
impl PipelineTransform for IdentityTransform {
    async fn transform(&self, input: PipelineData) -> Result<PipelineData, PipelineError> {
        Ok(input)
    }

    fn name(&self) -> &str {
        "identity"
    }
}

/// Map transform - applies a function to the context description
pub struct MapTransform {
    name: String,
    template: String,
}

impl MapTransform {
    pub fn new(name: &str, template: &str) -> Self {
        Self {
            name: name.to_string(),
            template: template.to_string(),
        }
    }
}

#[async_trait]
impl PipelineTransform for MapTransform {
    async fn transform(&self, mut input: PipelineData) -> Result<PipelineData, PipelineError> {
        let latest_output = input.latest_result()
            .map(|r| r.output.as_str())
            .unwrap_or("");

        let new_description = self.template
            .replace("{{output}}", latest_output)
            .replace("{{description}}", input.context.description.as_deref().unwrap_or(""));

        input.context.description = Some(new_description);
        Ok(input)
    }

    fn name(&self) -> &str {
        &self.name
    }
}

/// Filter transform - conditionally passes or blocks data
pub struct FilterTransform {
    name: String,
    predicate: Box<dyn Fn(&PipelineData) -> bool + Send + Sync>,
}

impl FilterTransform {
    pub fn new<F>(name: &str, predicate: F) -> Self
    where
        F: Fn(&PipelineData) -> bool + Send + Sync + 'static,
    {
        Self {
            name: name.to_string(),
            predicate: Box::new(predicate),
        }
    }

    /// Filter based on confidence threshold
    pub fn confidence_threshold(threshold: f32) -> Self {
        Self::new("confidence_filter", move |data| {
            data.latest_result()
                .map(|r| r.confidence >= threshold)
                .unwrap_or(true)
        })
    }

    /// Filter based on success
    pub fn success_only() -> Self {
        Self::new("success_filter", |data| {
            data.latest_result()
                .map(|r| r.success)
                .unwrap_or(true)
        })
    }
}

#[async_trait]
impl PipelineTransform for FilterTransform {
    async fn transform(&self, input: PipelineData) -> Result<PipelineData, PipelineError> {
        if (self.predicate)(&input) {
            Ok(input)
        } else {
            Err(PipelineError {
                stage: self.name.clone(),
                message: "Filter condition not met".to_string(),
                recoverable: true,
            })
        }
    }

    fn name(&self) -> &str {
        &self.name
    }
}

/// Aggregate transform - combines multiple results
pub struct AggregateTransform {
    name: String,
    separator: String,
}

impl AggregateTransform {
    pub fn new(name: &str, separator: &str) -> Self {
        Self {
            name: name.to_string(),
            separator: separator.to_string(),
        }
    }

    /// Combine all outputs into the description
    pub fn combine_outputs() -> Self {
        Self::new("combine", "\n\n---\n\n")
    }
}

#[async_trait]
impl PipelineTransform for AggregateTransform {
    async fn transform(&self, mut input: PipelineData) -> Result<PipelineData, PipelineError> {
        let combined = input.results
            .iter()
            .map(|r| r.output.as_str())
            .collect::<Vec<_>>()
            .join(&self.separator);

        input.context.description = Some(combined);
        Ok(input)
    }

    fn name(&self) -> &str {
        &self.name
    }
}

/// Extract transform - extracts specific content from results
pub struct ExtractTransform {
    name: String,
    pattern: ExtractPattern,
}

/// Pattern for extraction
pub enum ExtractPattern {
    /// Extract code blocks
    CodeBlocks,
    /// Extract specific language code
    LanguageCode(String),
    /// Extract lines matching regex
    Regex(String),
    /// Extract section by heading
    Section(String),
}

impl ExtractTransform {
    pub fn new(name: &str, pattern: ExtractPattern) -> Self {
        Self {
            name: name.to_string(),
            pattern,
        }
    }

    pub fn code_blocks() -> Self {
        Self::new("extract_code", ExtractPattern::CodeBlocks)
    }

    pub fn language(name: &str, lang: &str) -> Self {
        Self::new(name, ExtractPattern::LanguageCode(lang.to_string()))
    }
}

#[async_trait]
impl PipelineTransform for ExtractTransform {
    async fn transform(&self, mut input: PipelineData) -> Result<PipelineData, PipelineError> {
        let content = input.latest_result()
            .map(|r| r.output.as_str())
            .unwrap_or("");

        let extracted = match &self.pattern {
            ExtractPattern::CodeBlocks => {
                extract_code_blocks(content)
            }
            ExtractPattern::LanguageCode(lang) => {
                extract_language_code(content, lang)
            }
            ExtractPattern::Regex(pattern) => {
                extract_by_regex(content, pattern)
            }
            ExtractPattern::Section(heading) => {
                extract_section(content, heading)
            }
        };

        input.context.code_content = Some(extracted.clone());

        // Also add as artifact
        input.artifacts.push(PipelineArtifact::Code {
            language: "unknown".to_string(),
            content: extracted,
            file_path: None,
        });

        Ok(input)
    }

    fn name(&self) -> &str {
        &self.name
    }
}

fn extract_code_blocks(content: &str) -> String {
    let mut blocks = Vec::new();
    let mut in_block = false;
    let mut current_block = String::new();

    for line in content.lines() {
        if line.starts_with("```") {
            if in_block {
                blocks.push(current_block.clone());
                current_block.clear();
            }
            in_block = !in_block;
        } else if in_block {
            current_block.push_str(line);
            current_block.push('\n');
        }
    }

    blocks.join("\n\n")
}

fn extract_language_code(content: &str, lang: &str) -> String {
    let mut blocks = Vec::new();
    let mut in_block = false;
    let mut current_block = String::new();
    let marker = format!("```{}", lang);

    for line in content.lines() {
        if line.starts_with(&marker) {
            in_block = true;
        } else if line.starts_with("```") && in_block {
            blocks.push(current_block.clone());
            current_block.clear();
            in_block = false;
        } else if in_block {
            current_block.push_str(line);
            current_block.push('\n');
        }
    }

    blocks.join("\n\n")
}

fn extract_by_regex(content: &str, _pattern: &str) -> String {
    // Simple implementation - would use regex crate in production
    content.to_string()
}

fn extract_section(content: &str, heading: &str) -> String {
    let mut in_section = false;
    let mut section_content = String::new();
    let heading_marker = format!("## {}", heading);

    for line in content.lines() {
        if line.starts_with(&heading_marker) {
            in_section = true;
            continue;
        }
        if in_section {
            if line.starts_with("## ") {
                break;
            }
            section_content.push_str(line);
            section_content.push('\n');
        }
    }

    section_content.trim().to_string()
}

// ============================================================================
// Advanced Pipeline Builder
// ============================================================================

/// Pipeline configuration for building complex workflows
pub struct PipelineBuilder {
    stages: Vec<PipelineStageConfig>,
    error_handler: Option<Box<dyn Fn(PipelineError) -> ErrorAction + Send + Sync>>,
    timeout_ms: u64,
    max_retries: u32,
}

/// Configuration for a pipeline stage
pub struct PipelineStageConfig {
    pub name: String,
    pub stage_type: StageType,
    pub transform: Option<Box<dyn PipelineTransform>>,
    pub retry_on_failure: bool,
    pub skip_on_condition: Option<Box<dyn Fn(&PipelineData) -> bool + Send + Sync>>,
}

/// Type of pipeline stage
pub enum StageType {
    /// Execute a single agent
    Agent(SubagentType),
    /// Execute multiple agents in parallel
    Parallel(Vec<SubagentType>),
    /// Execute agents in sequence
    Sequential(Vec<SubagentType>),
    /// Execute with consensus
    Consensus {
        agents: Vec<SubagentType>,
        config: ConsensusConfig,
    },
    /// Branch based on condition
    Branch {
        condition: Box<dyn Fn(&PipelineData) -> bool + Send + Sync>,
        true_stage: Box<StageType>,
        false_stage: Box<StageType>,
    },
    /// Custom transform only (no agent)
    Transform,
}

/// Action to take on error
pub enum ErrorAction {
    /// Stop the pipeline
    Stop,
    /// Continue to next stage
    Continue,
    /// Retry the current stage
    Retry,
    /// Skip to a specific stage
    SkipTo(String),
}

impl PipelineBuilder {
    pub fn new() -> Self {
        Self {
            stages: Vec::new(),
            error_handler: None,
            timeout_ms: 300_000, // 5 minutes default
            max_retries: 3,
        }
    }

    /// Add a single agent stage
    pub fn agent(mut self, name: &str, agent_type: SubagentType) -> Self {
        self.stages.push(PipelineStageConfig {
            name: name.to_string(),
            stage_type: StageType::Agent(agent_type),
            transform: None,
            retry_on_failure: false,
            skip_on_condition: None,
        });
        self
    }

    /// Add a transform stage
    pub fn transform<T: PipelineTransform + 'static>(mut self, transform: T) -> Self {
        self.stages.push(PipelineStageConfig {
            name: transform.name().to_string(),
            stage_type: StageType::Transform,
            transform: Some(Box::new(transform)),
            retry_on_failure: false,
            skip_on_condition: None,
        });
        self
    }

    /// Add parallel execution stage
    pub fn parallel(mut self, name: &str, agents: Vec<SubagentType>) -> Self {
        self.stages.push(PipelineStageConfig {
            name: name.to_string(),
            stage_type: StageType::Parallel(agents),
            transform: None,
            retry_on_failure: false,
            skip_on_condition: None,
        });
        self
    }

    /// Add consensus stage
    pub fn consensus(mut self, name: &str, agents: Vec<SubagentType>, config: ConsensusConfig) -> Self {
        self.stages.push(PipelineStageConfig {
            name: name.to_string(),
            stage_type: StageType::Consensus { agents, config },
            transform: None,
            retry_on_failure: false,
            skip_on_condition: None,
        });
        self
    }

    /// Set error handler
    pub fn on_error<F>(mut self, handler: F) -> Self
    where
        F: Fn(PipelineError) -> ErrorAction + Send + Sync + 'static,
    {
        self.error_handler = Some(Box::new(handler));
        self
    }

    /// Set timeout
    pub fn timeout(mut self, timeout_ms: u64) -> Self {
        self.timeout_ms = timeout_ms;
        self
    }

    /// Set max retries
    pub fn max_retries(mut self, max: u32) -> Self {
        self.max_retries = max;
        self
    }

    /// Build the pipeline
    pub fn build(self) -> AdvancedPipeline {
        AdvancedPipeline {
            stages: self.stages,
            error_handler: self.error_handler,
            timeout_ms: self.timeout_ms,
            max_retries: self.max_retries,
        }
    }
}

impl Default for PipelineBuilder {
    fn default() -> Self {
        Self::new()
    }
}

/// Advanced pipeline with full feature set
pub struct AdvancedPipeline {
    stages: Vec<PipelineStageConfig>,
    error_handler: Option<Box<dyn Fn(PipelineError) -> ErrorAction + Send + Sync>>,
    timeout_ms: u64,
    max_retries: u32,
}

impl AdvancedPipeline {
    /// Execute the pipeline
    pub async fn execute(
        &self,
        manager: &SubagentManager,
        initial_data: PipelineData,
    ) -> Result<PipelineData, PipelineError> {
        let mut data = initial_data;

        for stage in &self.stages {
            // Check skip condition
            if let Some(condition) = &stage.skip_on_condition {
                if condition(&data) {
                    continue;
                }
            }

            let mut retries = 0;
            let result = loop {
                let start = std::time::Instant::now();

                let stage_result = match &stage.stage_type {
                    StageType::Agent(agent_type) => {
                        self.execute_agent(manager, *agent_type, &data).await
                    }
                    StageType::Parallel(agents) => {
                        self.execute_parallel(manager, agents, &data).await
                    }
                    StageType::Sequential(agents) => {
                        self.execute_sequential(manager, agents, &data).await
                    }
                    StageType::Consensus { agents, config } => {
                        self.execute_consensus(manager, agents, config, &data).await
                    }
                    StageType::Branch { condition, true_stage, false_stage } => {
                        let branch = if condition(&data) { true_stage } else { false_stage };
                        self.execute_branch(manager, branch, &data).await
                    }
                    StageType::Transform => {
                        // Transform only, no agent execution
                        Ok(StageResult {
                            stage_name: stage.name.clone(),
                            agent_type: None,
                            output: String::new(),
                            success: true,
                            error: None,
                            execution_time_ms: start.elapsed().as_millis() as u64,
                            code_changes: Vec::new(),
                            confidence: 1.0,
                        })
                    }
                };

                match stage_result {
                    Ok(result) => break Ok(result),
                    Err(e) => {
                        if stage.retry_on_failure && retries < self.max_retries {
                            retries += 1;
                            continue;
                        }

                        if let Some(handler) = &self.error_handler {
                            match handler(e.clone()) {
                                ErrorAction::Continue => break Ok(StageResult {
                                    stage_name: stage.name.clone(),
                                    agent_type: None,
                                    output: format!("Error (continuing): {}", e.message),
                                    success: false,
                                    error: Some(e.message),
                                    execution_time_ms: start.elapsed().as_millis() as u64,
                                    code_changes: Vec::new(),
                                    confidence: 0.0,
                                }),
                                ErrorAction::Retry if retries < self.max_retries => {
                                    retries += 1;
                                    continue;
                                }
                                _ => break Err(e),
                            }
                        } else {
                            break Err(e);
                        }
                    }
                }
            };

            match result {
                Ok(stage_result) => {
                    data.add_result(stage_result);

                    // Apply transform if present
                    if let Some(transform) = &stage.transform {
                        data = transform.transform(data).await?;
                    }
                }
                Err(e) => return Err(e),
            }
        }

        Ok(data)
    }

    async fn execute_agent(
        &self,
        manager: &SubagentManager,
        agent_type: SubagentType,
        data: &PipelineData,
    ) -> Result<StageResult, PipelineError> {
        let start = std::time::Instant::now();

        match manager.execute(agent_type, data.context.clone()).await {
            Ok(result) => Ok(StageResult {
                stage_name: agent_type.to_string(),
                agent_type: Some(agent_type),
                output: result.content,
                success: result.validated,
                error: if result.validated { None } else { Some("Validation failed".to_string()) },
                execution_time_ms: start.elapsed().as_millis() as u64,
                code_changes: Vec::new(),
                confidence: if result.validated { 0.9 } else { 0.5 },
            }),
            Err(e) => Err(PipelineError {
                stage: agent_type.to_string(),
                message: e,
                recoverable: true,
            }),
        }
    }

    async fn execute_parallel(
        &self,
        manager: &SubagentManager,
        agents: &[SubagentType],
        data: &PipelineData,
    ) -> Result<StageResult, PipelineError> {
        let start = std::time::Instant::now();
        let mut handles = Vec::new();

        for &agent_type in agents {
            let context = data.context.clone();
            let manager_clone = manager; // Would need Arc in real implementation
            handles.push(async move {
                manager_clone.execute(agent_type, context).await
            });
        }

        // In real implementation, we'd use futures::join_all or similar
        // For now, execute sequentially as a placeholder
        let mut outputs = Vec::new();
        for &agent_type in agents {
            match manager.execute(agent_type, data.context.clone()).await {
                Ok(result) => outputs.push(result.content),
                Err(e) => outputs.push(format!("Error: {}", e)),
            }
        }

        Ok(StageResult {
            stage_name: "parallel".to_string(),
            agent_type: None,
            output: outputs.join("\n\n---\n\n"),
            success: true,
            error: None,
            execution_time_ms: start.elapsed().as_millis() as u64,
            code_changes: Vec::new(),
            confidence: 0.85,
        })
    }

    async fn execute_sequential(
        &self,
        manager: &SubagentManager,
        agents: &[SubagentType],
        data: &PipelineData,
    ) -> Result<StageResult, PipelineError> {
        let start = std::time::Instant::now();
        let mut context = data.context.clone();
        let mut outputs = Vec::new();

        for &agent_type in agents {
            match manager.execute(agent_type, context.clone()).await {
                Ok(result) => {
                    // Pass output to next stage
                    context.description = Some(format!(
                        "Previous output:\n{}\n\nContinue from here:",
                        result.content
                    ));
                    outputs.push(result.content);
                }
                Err(e) => {
                    return Err(PipelineError {
                        stage: agent_type.to_string(),
                        message: e,
                        recoverable: true,
                    });
                }
            }
        }

        Ok(StageResult {
            stage_name: "sequential".to_string(),
            agent_type: None,
            output: outputs.join("\n\n---\n\n"),
            success: true,
            error: None,
            execution_time_ms: start.elapsed().as_millis() as u64,
            code_changes: Vec::new(),
            confidence: 0.9,
        })
    }

    async fn execute_consensus(
        &self,
        manager: &SubagentManager,
        agents: &[SubagentType],
        config: &ConsensusConfig,
        data: &PipelineData,
    ) -> Result<StageResult, PipelineError> {
        let start = std::time::Instant::now();
        let mut results = Vec::new();

        for &agent_type in agents {
            if let Ok(result) = manager.execute(agent_type, data.context.clone()).await {
                results.push(TaskResult {
                    status: if result.validated { TaskStatus::Completed } else { TaskStatus::Failed },
                    success: result.validated,
                    output: Some(result.content),
                    changes: Vec::new(),
                    ..Default::default()
                });
            }
        }

        if results.is_empty() {
            return Err(PipelineError {
                stage: "consensus".to_string(),
                message: "No agents produced results".to_string(),
                recoverable: false,
            });
        }

        let consensus = find_consensus(&results, config);

        Ok(StageResult {
            stage_name: "consensus".to_string(),
            agent_type: None,
            output: consensus.result.output.unwrap_or_default(),
            success: consensus.result.success,
            error: if consensus.confidence < 0.5 {
                Some("Low confidence consensus".to_string())
            } else {
                None
            },
            execution_time_ms: start.elapsed().as_millis() as u64,
            code_changes: consensus.result.changes,
            confidence: consensus.confidence as f32,
        })
    }

    async fn execute_branch(
        &self,
        manager: &SubagentManager,
        branch: &StageType,
        data: &PipelineData,
    ) -> Result<StageResult, PipelineError> {
        match branch {
            StageType::Agent(agent_type) => {
                self.execute_agent(manager, *agent_type, data).await
            }
            StageType::Parallel(agents) => {
                self.execute_parallel(manager, agents, data).await
            }
            StageType::Sequential(agents) => {
                self.execute_sequential(manager, agents, data).await
            }
            _ => Err(PipelineError {
                stage: "branch".to_string(),
                message: "Invalid branch type".to_string(),
                recoverable: false,
            }),
        }
    }
}

// ============================================================================
// Preset Pipelines
// ============================================================================

/// Collection of preset pipelines for common workflows
pub struct PipelinePresets;

impl PipelinePresets {
    /// Full code review pipeline: explore -> analyze -> review -> report
    pub fn code_review() -> AdvancedPipeline {
        PipelineBuilder::new()
            .agent("explore", SubagentType::Explorer)
            .transform(MapTransform::new(
                "prepare_review",
                "Based on exploration:\n{{output}}\n\nReview this code for issues.",
            ))
            .agent("review", SubagentType::Reviewer)
            .transform(MapTransform::new(
                "prepare_security",
                "Code review findings:\n{{output}}\n\nNow check for security issues.",
            ))
            .agent("security", SubagentType::Security)
            .transform(AggregateTransform::combine_outputs())
            .build()
    }

    /// Feature implementation pipeline: plan -> implement -> test -> review
    pub fn implement_feature() -> AdvancedPipeline {
        PipelineBuilder::new()
            .agent("plan", SubagentType::Planner)
            .transform(MapTransform::new(
                "prepare_impl",
                "Implementation plan:\n{{output}}\n\nNow implement this plan.",
            ))
            .agent("implement", SubagentType::Coder)
            .transform(MapTransform::new(
                "prepare_test",
                "Implementation:\n{{output}}\n\nWrite tests for this code.",
            ))
            .agent("test", SubagentType::Tester)
            .transform(MapTransform::new(
                "prepare_review",
                "Implementation and tests:\n{{output}}\n\nReview for issues.",
            ))
            .agent("review", SubagentType::Reviewer)
            .build()
    }

    /// Bug fix pipeline: debug -> fix -> test -> verify
    pub fn fix_bug() -> AdvancedPipeline {
        PipelineBuilder::new()
            .agent("diagnose", SubagentType::Debugger)
            .transform(MapTransform::new(
                "prepare_fix",
                "Bug diagnosis:\n{{output}}\n\nImplement the fix.",
            ))
            .agent("fix", SubagentType::Coder)
            .transform(MapTransform::new(
                "prepare_test",
                "Bug fix:\n{{output}}\n\nWrite regression tests.",
            ))
            .agent("test", SubagentType::Tester)
            .agent("verify", SubagentType::Reviewer)
            .build()
    }

    /// Consensus code generation: multiple coders + consensus
    pub fn consensus_coding() -> AdvancedPipeline {
        PipelineBuilder::new()
            .agent("plan", SubagentType::Planner)
            .consensus(
                "multi_impl",
                vec![SubagentType::Coder, SubagentType::Coder, SubagentType::Coder],
                ConsensusConfig::default(),
            )
            .agent("review", SubagentType::Reviewer)
            .build()
    }

    /// Documentation pipeline: explore -> document -> review
    pub fn generate_docs() -> AdvancedPipeline {
        PipelineBuilder::new()
            .agent("explore", SubagentType::Explorer)
            .transform(MapTransform::new(
                "prepare_docs",
                "Code structure:\n{{output}}\n\nGenerate documentation.",
            ))
            .agent("document", SubagentType::Documenter)
            .agent("review", SubagentType::Reviewer)
            .build()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pipeline_data() {
        let mut data = PipelineData::default();

        data.add_result(StageResult {
            stage_name: "test".to_string(),
            agent_type: None,
            output: "test output".to_string(),
            success: true,
            error: None,
            execution_time_ms: 100,
            code_changes: Vec::new(),
            confidence: 0.9,
        });

        assert_eq!(data.results.len(), 1);
        assert_eq!(data.latest_result().unwrap().output, "test output");
    }

    #[test]
    fn test_extract_code_blocks() {
        let content = r#"
Here is some code:
```rust
fn main() {
    println!("Hello");
}
```
And more:
```python
print("world")
```
"#;
        let extracted = extract_code_blocks(content);
        assert!(extracted.contains("fn main()"));
        assert!(extracted.contains("print(\"world\")"));
    }

    #[test]
    fn test_pipeline_builder() {
        let pipeline = PipelineBuilder::new()
            .agent("test", SubagentType::Coder)
            .transform(IdentityTransform)
            .timeout(60000)
            .build();

        assert_eq!(pipeline.stages.len(), 2);
        assert_eq!(pipeline.timeout_ms, 60000);
    }
}
