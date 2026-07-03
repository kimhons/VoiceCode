#![allow(dead_code, unused_variables, unused_imports)]
// External Agent Adapters - Integration with external CLI coding agents
// Provides adapters for Claude Code, Codex CLI, Gemini CLI, and others

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::process::Stdio;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::process::{Child, Command};

use super::agent_protocol::{CodeChange, TaskContext, TaskResult, TaskStatus, TaskType};

/// External agent type
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum ExternalAgentType {
    ClaudeCode,
    Codex,
    Gemini,
    Cursor,
    Aider,
    Cody,
    Copilot,
    Custom(String),
}

/// Configuration for an external agent
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExternalAgentConfig {
    pub agent_type: ExternalAgentType,
    pub executable_path: Option<PathBuf>,
    pub command: String,
    pub args: Vec<String>,
    pub env_vars: HashMap<String, String>,
    pub working_dir: Option<PathBuf>,
    pub timeout_ms: u64,
    pub supports_streaming: bool,
    pub supports_interactive: bool,
}

impl ExternalAgentConfig {
    pub fn claude_code() -> Self {
        Self {
            agent_type: ExternalAgentType::ClaudeCode,
            executable_path: None,
            command: "claude".to_string(),
            args: vec![],
            env_vars: HashMap::new(),
            working_dir: None,
            timeout_ms: 300000, // 5 minutes
            supports_streaming: true,
            supports_interactive: true,
        }
    }

    pub fn codex() -> Self {
        Self {
            agent_type: ExternalAgentType::Codex,
            executable_path: None,
            command: "codex".to_string(),
            args: vec![],
            env_vars: HashMap::new(),
            working_dir: None,
            timeout_ms: 120000,
            supports_streaming: true,
            supports_interactive: false,
        }
    }

    pub fn aider() -> Self {
        Self {
            agent_type: ExternalAgentType::Aider,
            executable_path: None,
            command: "aider".to_string(),
            args: vec!["--no-git".to_string()],
            env_vars: HashMap::new(),
            working_dir: None,
            timeout_ms: 300000,
            supports_streaming: true,
            supports_interactive: true,
        }
    }

    pub fn cody() -> Self {
        Self {
            agent_type: ExternalAgentType::Cody,
            executable_path: None,
            command: "cody".to_string(),
            args: vec![],
            env_vars: HashMap::new(),
            working_dir: None,
            timeout_ms: 120000,
            supports_streaming: true,
            supports_interactive: false,
        }
    }
}

/// External agent adapter trait
#[async_trait::async_trait]
pub trait ExternalAgentAdapter: Send + Sync {
    /// Get agent type
    fn agent_type(&self) -> ExternalAgentType;

    /// Check if the agent is available
    async fn is_available(&self) -> bool;

    /// Execute a task
    async fn execute(
        &self,
        task_type: TaskType,
        context: TaskContext,
    ) -> Result<TaskResult, String>;

    /// Execute with streaming output
    async fn execute_streaming(
        &self,
        task_type: TaskType,
        context: TaskContext,
        on_output: Box<dyn Fn(String) + Send>,
    ) -> Result<TaskResult, String>;

    /// Start interactive session
    async fn start_interactive(
        &self,
        working_dir: Option<PathBuf>,
    ) -> Result<InteractiveSession, String>;
}

/// Interactive session with an external agent
pub struct InteractiveSession {
    process: Child,
    config: ExternalAgentConfig,
}

impl InteractiveSession {
    pub fn new(process: Child, config: ExternalAgentConfig) -> Self {
        Self { process, config }
    }

    /// Send a message to the agent
    pub async fn send(&mut self, message: &str) -> Result<(), String> {
        if let Some(stdin) = self.process.stdin.as_mut() {
            stdin
                .write_all(format!("{}\n", message).as_bytes())
                .await
                .map_err(|e| format!("Failed to send message: {}", e))?;
            stdin
                .flush()
                .await
                .map_err(|e| format!("Failed to flush: {}", e))?;
        }
        Ok(())
    }

    /// Read response from the agent
    pub async fn read_response(&mut self) -> Result<String, String> {
        let stdout = self.process.stdout.take().ok_or("No stdout available")?;

        let mut reader = BufReader::new(stdout);
        let mut response = String::new();
        let mut line = String::new();

        while reader
            .read_line(&mut line)
            .await
            .map_err(|e| e.to_string())?
            > 0
        {
            if line.trim().is_empty() || line.contains(">>>") || line.contains("$") {
                break;
            }
            response.push_str(&line);
            line.clear();
        }

        // Put stdout back
        self.process.stdout = Some(reader.into_inner());

        Ok(response)
    }

    /// Close the session
    pub async fn close(mut self) -> Result<(), String> {
        let _ = self.process.kill().await;
        Ok(())
    }
}

/// Claude Code adapter
pub struct ClaudeCodeAdapter {
    config: ExternalAgentConfig,
}

impl ClaudeCodeAdapter {
    pub fn new() -> Self {
        Self {
            config: ExternalAgentConfig::claude_code(),
        }
    }

    pub fn with_config(config: ExternalAgentConfig) -> Self {
        Self { config }
    }

    fn build_command(&self, task_type: &TaskType, context: &TaskContext) -> Vec<String> {
        let mut args = self.config.args.clone();

        // Add working directory
        if let Some(project_root) = &context.project_root {
            args.push("--cwd".to_string());
            args.push(project_root.clone());
        }

        // Build prompt based on task type
        let prompt = self.task_to_prompt(task_type, context);
        args.push("-p".to_string());
        args.push(prompt);

        // Add print mode for non-interactive
        args.push("--print".to_string());

        args
    }

    fn task_to_prompt(&self, task_type: &TaskType, context: &TaskContext) -> String {
        let file_context = context.file_path.as_deref().unwrap_or("");
        let code_context = context.code_content.as_deref().unwrap_or("");

        match task_type {
            TaskType::CodeGeneration {
                language,
                description,
            } => {
                format!(
                    "Generate {} code: {}{}",
                    language.as_deref().unwrap_or("auto"),
                    description,
                    if !file_context.is_empty() {
                        format!("\n\nContext file: {}", file_context)
                    } else {
                        String::new()
                    }
                )
            }
            TaskType::CodeReview { focus_areas } => {
                format!(
                    "Review the following code{}:\n\n```\n{}\n```",
                    if !focus_areas.is_empty() {
                        format!(" focusing on: {}", focus_areas.join(", "))
                    } else {
                        String::new()
                    },
                    code_context
                )
            }
            TaskType::BugFix {
                error_message,
                stack_trace,
            } => {
                format!(
                    "Fix the bug in {}:\nError: {}\n{}",
                    file_context,
                    error_message.as_deref().unwrap_or("Unknown error"),
                    stack_trace
                        .as_ref()
                        .map(|s| format!("Stack trace:\n{}", s))
                        .unwrap_or_default()
                )
            }
            TaskType::Refactoring {
                refactor_type,
                scope,
            } => {
                format!(
                    "Refactor the code in {} - Type: {}, Scope: {}",
                    file_context, refactor_type, scope.as_deref().unwrap_or("file")
                )
            }
            TaskType::TestGeneration {
                test_type,
                coverage_target,
            } => {
                format!(
                    "Generate {} tests for {} with {}% coverage target",
                    test_type, file_context, coverage_target.unwrap_or(80.0)
                )
            }
            TaskType::Documentation { doc_type, format } => {
                format!(
                    "Generate {} documentation in {} format for: {}",
                    doc_type, format.as_deref().unwrap_or("markdown"), file_context
                )
            }
            TaskType::Explanation { detail_level } => {
                format!(
                    "Explain the following code ({} detail):\n\n```\n{}\n```",
                    detail_level, code_context
                )
            }
            TaskType::Search { query, scope } => {
                format!("Search for '{}' in scope: {}", query, scope.as_deref().unwrap_or("project"))
            }
            TaskType::Custom { name, params } => {
                format!("{}: {:?}", name, params)
            }
            _ => format!("{:?}", task_type),
        }
    }

    fn parse_output(&self, output: &str) -> TaskResult {
        // Parse Claude Code output format
        let mut changes = Vec::new();
        let mut current_file: Option<String> = None;
        let mut current_content = String::new();
        let mut in_code_block = false;

        for line in output.lines() {
            if line.starts_with("```") {
                if in_code_block && current_file.is_some() {
                    changes.push(CodeChange {
                        file_path: current_file.take().unwrap(),
                        change_type: super::agent_protocol::ChangeType::Create,
                        old_content: None,
                        new_content: Some(current_content.clone()),
                        line_start: None,
                        line_end: None,
                        before: None,
                        after: None,
                        line_range: None,
                    });
                    current_content.clear();
                }
                in_code_block = !in_code_block;

                // Check for filename in code fence
                if in_code_block && line.len() > 3 {
                    let rest = &line[3..];
                    if rest.contains('.') {
                        current_file = Some(rest.trim().to_string());
                    }
                }
            } else if in_code_block {
                current_content.push_str(line);
                current_content.push('\n');
            }
        }

        TaskResult {
            status: TaskStatus::Completed,
            success: true,
            output: Some(output.to_string()),
            changes,
            ..Default::default()
        }
    }
}

impl Default for ClaudeCodeAdapter {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait::async_trait]
impl ExternalAgentAdapter for ClaudeCodeAdapter {
    fn agent_type(&self) -> ExternalAgentType {
        ExternalAgentType::ClaudeCode
    }

    async fn is_available(&self) -> bool {
        Command::new(&self.config.command)
            .arg("--version")
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status()
            .await
            .map(|s| s.success())
            .unwrap_or(false)
    }

    async fn execute(
        &self,
        task_type: TaskType,
        context: TaskContext,
    ) -> Result<TaskResult, String> {
        let args = self.build_command(&task_type, &context);

        let mut cmd = Command::new(&self.config.command);
        cmd.args(&args)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        if let Some(ref dir) = self.config.working_dir {
            cmd.current_dir(dir);
        } else if let Some(ref root) = context.project_root {
            cmd.current_dir(root);
        }

        for (key, value) in &self.config.env_vars {
            cmd.env(key, value);
        }

        let output = tokio::time::timeout(
            std::time::Duration::from_millis(self.config.timeout_ms),
            cmd.output(),
        )
        .await
        .map_err(|_| "Command timed out".to_string())?
        .map_err(|e| format!("Failed to execute command: {}", e))?;

        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            Ok(self.parse_output(&stdout))
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            Err(format!("Command failed: {}", stderr))
        }
    }

    async fn execute_streaming(
        &self,
        task_type: TaskType,
        context: TaskContext,
        on_output: Box<dyn Fn(String) + Send>,
    ) -> Result<TaskResult, String> {
        let args = self.build_command(&task_type, &context);

        let mut cmd = Command::new(&self.config.command);
        cmd.args(&args)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        if let Some(ref dir) = self.config.working_dir {
            cmd.current_dir(dir);
        }

        let mut child = cmd
            .spawn()
            .map_err(|e| format!("Failed to spawn process: {}", e))?;

        let stdout = child.stdout.take().ok_or("Failed to capture stdout")?;

        let mut reader = BufReader::new(stdout);
        let mut full_output = String::new();
        let mut line = String::new();

        while reader
            .read_line(&mut line)
            .await
            .map_err(|e| e.to_string())?
            > 0
        {
            full_output.push_str(&line);
            on_output(line.clone());
            line.clear();
        }

        let status = child
            .wait()
            .await
            .map_err(|e| format!("Process error: {}", e))?;

        if status.success() {
            Ok(self.parse_output(&full_output))
        } else {
            Err("Command failed".to_string())
        }
    }

    async fn start_interactive(
        &self,
        working_dir: Option<PathBuf>,
    ) -> Result<InteractiveSession, String> {
        let mut cmd = Command::new(&self.config.command);
        cmd.stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        if let Some(dir) = working_dir.or_else(|| self.config.working_dir.clone()) {
            cmd.current_dir(dir);
        }

        let child = cmd
            .spawn()
            .map_err(|e| format!("Failed to start interactive session: {}", e))?;

        Ok(InteractiveSession::new(child, self.config.clone()))
    }
}

/// Aider adapter (https://github.com/paul-gauthier/aider)
pub struct AiderAdapter {
    config: ExternalAgentConfig,
}

impl AiderAdapter {
    pub fn new() -> Self {
        Self {
            config: ExternalAgentConfig::aider(),
        }
    }

    fn build_args(&self, task_type: &TaskType, context: &TaskContext) -> Vec<String> {
        let mut args = self.config.args.clone();

        // Add files to watch
        if let Some(file) = &context.file_path {
            args.push(file.clone());
        }

        for file in &context.related_files {
            args.push(file.clone());
        }

        // Add message
        let message = self.task_to_message(task_type, context);
        args.push("--message".to_string());
        args.push(message);

        // Auto-commit off for safety
        args.push("--no-auto-commits".to_string());

        args
    }

    fn task_to_message(&self, task_type: &TaskType, context: &TaskContext) -> String {
        match task_type {
            TaskType::CodeGeneration { description, .. } => description.clone(),
            TaskType::BugFix { error_message, .. } => {
                format!("Fix: {}", error_message.as_deref().unwrap_or("the bug"))
            }
            TaskType::Refactoring { refactor_type, .. } => {
                format!("Refactor: {}", refactor_type)
            }
            TaskType::TestGeneration { test_type, .. } => {
                format!("Generate {} tests", test_type)
            }
            _ => format!("{:?}", task_type),
        }
    }
}

impl Default for AiderAdapter {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait::async_trait]
impl ExternalAgentAdapter for AiderAdapter {
    fn agent_type(&self) -> ExternalAgentType {
        ExternalAgentType::Aider
    }

    async fn is_available(&self) -> bool {
        Command::new(&self.config.command)
            .arg("--version")
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status()
            .await
            .map(|s| s.success())
            .unwrap_or(false)
    }

    async fn execute(
        &self,
        task_type: TaskType,
        context: TaskContext,
    ) -> Result<TaskResult, String> {
        let args = self.build_args(&task_type, &context);

        let mut cmd = Command::new(&self.config.command);
        cmd.args(&args)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        if let Some(ref dir) = context.project_root {
            cmd.current_dir(dir);
        }

        let output = tokio::time::timeout(
            std::time::Duration::from_millis(self.config.timeout_ms),
            cmd.output(),
        )
        .await
        .map_err(|_| "Command timed out".to_string())?
        .map_err(|e| format!("Failed to execute: {}", e))?;

        let stdout = String::from_utf8_lossy(&output.stdout);

        Ok(TaskResult {
            status: if output.status.success() {
                TaskStatus::Completed
            } else {
                TaskStatus::Failed
            },
            success: output.status.success(),
            output: Some(stdout.to_string()),
            error: if !output.status.success() {
                Some(String::from_utf8_lossy(&output.stderr).to_string())
            } else {
                None
            },
            ..Default::default()
        })
    }

    async fn execute_streaming(
        &self,
        task_type: TaskType,
        context: TaskContext,
        on_output: Box<dyn Fn(String) + Send>,
    ) -> Result<TaskResult, String> {
        // Similar to ClaudeCodeAdapter
        self.execute(task_type, context).await
    }

    async fn start_interactive(
        &self,
        working_dir: Option<PathBuf>,
    ) -> Result<InteractiveSession, String> {
        let mut cmd = Command::new(&self.config.command);
        cmd.stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        if let Some(dir) = working_dir {
            cmd.current_dir(dir);
        }

        let child = cmd
            .spawn()
            .map_err(|e| format!("Failed to start aider: {}", e))?;

        Ok(InteractiveSession::new(child, self.config.clone()))
    }
}

/// Generic command-line agent adapter for any CLI tool
pub struct GenericCliAdapter {
    config: ExternalAgentConfig,
    prompt_template: String,
}

impl GenericCliAdapter {
    pub fn new(config: ExternalAgentConfig, prompt_template: String) -> Self {
        Self {
            config,
            prompt_template,
        }
    }

    fn render_prompt(&self, task_type: &TaskType, context: &TaskContext) -> String {
        let mut prompt = self.prompt_template.clone();

        prompt = prompt.replace("{{task_type}}", &format!("{:?}", task_type));
        prompt = prompt.replace("{{file_path}}", context.file_path.as_deref().unwrap_or(""));
        prompt = prompt.replace(
            "{{code_content}}",
            context.code_content.as_deref().unwrap_or(""),
        );
        prompt = prompt.replace(
            "{{project_root}}",
            context.project_root.as_deref().unwrap_or(""),
        );

        prompt
    }
}

#[async_trait::async_trait]
impl ExternalAgentAdapter for GenericCliAdapter {
    fn agent_type(&self) -> ExternalAgentType {
        self.config.agent_type.clone()
    }

    async fn is_available(&self) -> bool {
        Command::new(&self.config.command)
            .arg("--version")
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status()
            .await
            .map(|s| s.success())
            .unwrap_or(false)
    }

    async fn execute(
        &self,
        task_type: TaskType,
        context: TaskContext,
    ) -> Result<TaskResult, String> {
        let prompt = self.render_prompt(&task_type, &context);

        let mut cmd = Command::new(&self.config.command);
        cmd.args(&self.config.args)
            .arg(&prompt)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        if let Some(ref dir) = self.config.working_dir {
            cmd.current_dir(dir);
        }

        let output = cmd
            .output()
            .await
            .map_err(|e| format!("Failed to execute: {}", e))?;

        Ok(TaskResult {
            success: output.status.success(),
            status: if output.status.success() {
                TaskStatus::Completed
            } else {
                TaskStatus::Failed
            },
            output: Some(String::from_utf8_lossy(&output.stdout).to_string()),
            ..Default::default()
        })
    }

    async fn execute_streaming(
        &self,
        task_type: TaskType,
        context: TaskContext,
        _on_output: Box<dyn Fn(String) + Send>,
    ) -> Result<TaskResult, String> {
        self.execute(task_type, context).await
    }

    async fn start_interactive(
        &self,
        working_dir: Option<PathBuf>,
    ) -> Result<InteractiveSession, String> {
        let mut cmd = Command::new(&self.config.command);
        cmd.stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        if let Some(dir) = working_dir {
            cmd.current_dir(dir);
        }

        let child = cmd.spawn().map_err(|e| format!("Failed to start: {}", e))?;

        Ok(InteractiveSession::new(child, self.config.clone()))
    }
}

/// Factory for creating external agent adapters
pub struct ExternalAgentFactory;

impl ExternalAgentFactory {
    pub fn create(agent_type: ExternalAgentType) -> Box<dyn ExternalAgentAdapter> {
        match agent_type {
            ExternalAgentType::ClaudeCode => Box::new(ClaudeCodeAdapter::new()),
            ExternalAgentType::Aider => Box::new(AiderAdapter::new()),
            ExternalAgentType::Codex => Box::new(GenericCliAdapter::new(
                ExternalAgentConfig::codex(),
                "{{task_type}}: {{code_content}}".to_string(),
            )),
            ExternalAgentType::Cody => Box::new(GenericCliAdapter::new(
                ExternalAgentConfig::cody(),
                "{{task_type}}: {{code_content}}".to_string(),
            )),
            ExternalAgentType::Custom(name) => Box::new(GenericCliAdapter::new(
                ExternalAgentConfig {
                    agent_type: ExternalAgentType::Custom(name.clone()),
                    executable_path: None,
                    command: name,
                    args: vec![],
                    env_vars: HashMap::new(),
                    working_dir: None,
                    timeout_ms: 120000,
                    supports_streaming: false,
                    supports_interactive: false,
                },
                "{{task_type}}".to_string(),
            )),
            _ => Box::new(GenericCliAdapter::new(
                ExternalAgentConfig {
                    agent_type,
                    executable_path: None,
                    command: "echo".to_string(),
                    args: vec![],
                    env_vars: HashMap::new(),
                    working_dir: None,
                    timeout_ms: 10000,
                    supports_streaming: false,
                    supports_interactive: false,
                },
                "Unsupported agent".to_string(),
            )),
        }
    }

    /// Detect available external agents on the system
    pub async fn detect_available() -> Vec<ExternalAgentType> {
        let agents = vec![
            ExternalAgentType::ClaudeCode,
            ExternalAgentType::Codex,
            ExternalAgentType::Aider,
            ExternalAgentType::Cody,
        ];

        let mut available = Vec::new();

        for agent_type in agents {
            let adapter = Self::create(agent_type.clone());
            if adapter.is_available().await {
                available.push(agent_type);
            }
        }

        available
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_claude_code_adapter_creation() {
        let adapter = ClaudeCodeAdapter::new();
        assert_eq!(adapter.agent_type(), ExternalAgentType::ClaudeCode);
    }

    #[tokio::test]
    async fn test_task_to_prompt() {
        let adapter = ClaudeCodeAdapter::new();
        let context = TaskContext {
            file_path: Some("test.rs".to_string()),
            code_content: Some("fn main() {}".to_string()),
            ..Default::default()
        };

        let task = TaskType::CodeGeneration {
            language: Some("rust".to_string()),
            description: "Add error handling".to_string(),
        };

        let prompt = adapter.task_to_prompt(&task, &context);
        assert!(prompt.contains("rust"));
        assert!(prompt.contains("error handling"));
    }

    #[test]
    fn test_external_agent_config_defaults() {
        let claude = ExternalAgentConfig::claude_code();
        assert_eq!(claude.command, "claude");
        assert!(claude.supports_streaming);

        let aider = ExternalAgentConfig::aider();
        assert_eq!(aider.command, "aider");
    }
}
