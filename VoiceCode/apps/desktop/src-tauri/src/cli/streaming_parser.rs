#![allow(dead_code, unused_variables, unused_imports)]
// Streaming Output Parser for External Agent CLIs
// Parses real-time output from Claude Code, Aider, Gemini CLI, Codex CLI, etc.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tokio::sync::mpsc;
use regex::Regex;
use once_cell::sync::Lazy;

use super::agent_protocol::{CodeChange, ChangeType};

// ============================================================================
// Streaming Event Types
// ============================================================================

/// Events parsed from streaming CLI output
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum StreamEvent {
    /// Raw text output
    Text(String),
    /// Thinking/reasoning block (Claude extended thinking, Gemini reasoning)
    Thinking(String),
    /// Tool being called
    ToolCall(ToolCallEvent),
    /// Tool result received
    ToolResult(ToolResultEvent),
    /// Code change detected
    CodeChange(CodeChangeEvent),
    /// File being read
    FileRead { path: String },
    /// File being written
    FileWrite { path: String, content: String },
    /// Command being executed
    CommandExec { command: String },
    /// Command output
    CommandOutput { output: String, exit_code: Option<i32> },
    /// Progress update
    Progress { message: String, percent: Option<f32> },
    /// Cost/token usage update
    Usage(UsageEvent),
    /// Error message
    Error { message: String, recoverable: bool },
    /// Task completion
    Complete { success: bool, summary: Option<String> },
    /// Parsing artifact (structured output detected)
    Artifact(ArtifactEvent),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolCallEvent {
    pub tool_name: String,
    pub arguments: HashMap<String, serde_json::Value>,
    pub id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolResultEvent {
    pub tool_name: String,
    pub result: serde_json::Value,
    pub is_error: bool,
    pub id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodeChangeEvent {
    pub file_path: String,
    pub change_type: ChangeType,
    pub content: String,
    pub line_start: Option<usize>,
    pub line_end: Option<usize>,
    /// Search/replace pattern for targeted edits
    pub search_pattern: Option<String>,
    pub replace_with: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UsageEvent {
    pub input_tokens: Option<usize>,
    pub output_tokens: Option<usize>,
    pub total_tokens: Option<usize>,
    pub cost_cents: Option<f32>,
    pub cache_read_tokens: Option<usize>,
    pub cache_write_tokens: Option<usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArtifactEvent {
    pub artifact_type: String,
    pub identifier: String,
    pub content: String,
    pub language: Option<String>,
}

// ============================================================================
// Parser State Machine
// ============================================================================

/// Parser state for tracking multi-line constructs
#[derive(Debug, Clone, Default)]
struct ParserState {
    /// Currently in a code block
    in_code_block: bool,
    /// Current code block language
    code_block_lang: Option<String>,
    /// Current code block file (if specified)
    code_block_file: Option<String>,
    /// Accumulated code block content
    code_block_content: String,
    /// In a thinking block
    in_thinking: bool,
    /// Accumulated thinking content
    thinking_content: String,
    /// In a tool call block
    in_tool_call: bool,
    /// Current tool name
    current_tool: Option<String>,
    /// Accumulated tool arguments
    tool_args_buffer: String,
    /// In diff/patch mode
    in_diff: bool,
    /// Diff file path
    diff_file: Option<String>,
    /// Accumulated diff content
    diff_content: String,
    /// In search/replace block
    in_search_replace: bool,
    /// Search pattern
    search_pattern: String,
    /// Replace content
    replace_content: String,
    /// Current search/replace phase (search or replace)
    search_replace_phase: SearchReplacePhase,
}

#[derive(Debug, Clone, Default, PartialEq)]
enum SearchReplacePhase {
    #[default]
    None,
    Search,
    Replace,
}

// ============================================================================
// Output Parser
// ============================================================================

/// Parser for different CLI output formats
pub struct StreamingParser {
    /// Parser state
    state: ParserState,
    /// Output channel
    event_tx: mpsc::Sender<StreamEvent>,
    /// Source CLI type
    source: CliSource,
}

/// Source CLI being parsed
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CliSource {
    ClaudeCode,
    Aider,
    GeminiCli,
    CodexCli,
    CopilotCli,
    Generic,
}

// Regex patterns for parsing
static CODE_BLOCK_START: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"^```(\w+)?(?:\s+(.+))?$").expect("valid regex: code block start")
});

static CODE_BLOCK_END: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"^```\s*$").expect("valid regex: code block end")
});

static THINKING_START: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"^<thinking>|^\[thinking\]|^> Thinking\.\.\.").expect("valid regex: thinking start")
});

static THINKING_END: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"^</thinking>|^\[/thinking\]|^> Done thinking").expect("valid regex: thinking end")
});

static TOOL_CALL_START: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?i)^(?:Tool call|Using tool|Calling|Invoking):\s*(\w+)").expect("valid regex: tool call start")
});

static DIFF_HEADER: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"^(?:diff --git|---|\+\+\+) .*/(.+)$").expect("valid regex: diff header")
});

static FILE_PATH_PATTERN: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?:^|\s)([a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+)(?:\s|$|:)").expect("valid regex: file path pattern")
});

static TOKEN_USAGE: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?i)(?:tokens?:?\s*)?(\d+)\s*(?:input|in).*?(\d+)\s*(?:output|out)").expect("valid regex: token usage")
});

static COST_PATTERN: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?i)\$?([\d.]+)\s*(?:cents?|USD)?").expect("valid regex: cost pattern")
});

// Aider-specific patterns
static AIDER_EDIT_START: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"^<<<<<<< SEARCH$").expect("valid regex: aider search start")
});

static AIDER_EDIT_MIDDLE: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"^=======$").expect("valid regex: aider search middle")
});

static AIDER_EDIT_END: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"^>>>>>>> REPLACE$").expect("valid regex: aider replace end")
});

impl StreamingParser {
    pub fn new(source: CliSource, event_tx: mpsc::Sender<StreamEvent>) -> Self {
        Self {
            state: ParserState::default(),
            event_tx,
            source,
        }
    }

    /// Parse a line of output
    pub async fn parse_line(&mut self, line: &str) -> Result<(), String> {
        // Handle based on current state first
        if self.state.in_thinking {
            return self.handle_thinking_line(line).await;
        }

        if self.state.in_code_block {
            return self.handle_code_block_line(line).await;
        }

        if self.state.in_diff {
            return self.handle_diff_line(line).await;
        }

        if self.state.in_search_replace {
            return self.handle_search_replace_line(line).await;
        }

        if self.state.in_tool_call {
            return self.handle_tool_call_line(line).await;
        }

        // Check for state transitions
        if THINKING_START.is_match(line) {
            self.state.in_thinking = true;
            self.state.thinking_content.clear();
            return Ok(());
        }

        if let Some(caps) = CODE_BLOCK_START.captures(line) {
            self.state.in_code_block = true;
            self.state.code_block_lang = caps.get(1).map(|m| m.as_str().to_string());
            self.state.code_block_file = caps.get(2).map(|m| m.as_str().to_string());
            self.state.code_block_content.clear();
            return Ok(());
        }

        if DIFF_HEADER.is_match(line) {
            self.state.in_diff = true;
            if let Some(caps) = DIFF_HEADER.captures(line) {
                self.state.diff_file = caps.get(1).map(|m| m.as_str().to_string());
            }
            self.state.diff_content.clear();
            self.state.diff_content.push_str(line);
            self.state.diff_content.push('\n');
            return Ok(());
        }

        // Aider search/replace blocks
        if AIDER_EDIT_START.is_match(line) {
            self.state.in_search_replace = true;
            self.state.search_replace_phase = SearchReplacePhase::Search;
            self.state.search_pattern.clear();
            self.state.replace_content.clear();
            return Ok(());
        }

        if let Some(caps) = TOOL_CALL_START.captures(line) {
            self.state.in_tool_call = true;
            self.state.current_tool = caps.get(1).map(|m| m.as_str().to_string());
            self.state.tool_args_buffer.clear();
            return Ok(());
        }

        // Check for special patterns
        self.parse_special_patterns(line).await
    }

    /// Handle line while in thinking block
    async fn handle_thinking_line(&mut self, line: &str) -> Result<(), String> {
        if THINKING_END.is_match(line) {
            self.state.in_thinking = false;
            let content = std::mem::take(&mut self.state.thinking_content);
            self.emit(StreamEvent::Thinking(content)).await;
        } else {
            self.state.thinking_content.push_str(line);
            self.state.thinking_content.push('\n');
        }
        Ok(())
    }

    /// Handle line while in code block
    async fn handle_code_block_line(&mut self, line: &str) -> Result<(), String> {
        if CODE_BLOCK_END.is_match(line) {
            self.state.in_code_block = false;

            let content = std::mem::take(&mut self.state.code_block_content);
            let lang = self.state.code_block_lang.take();
            let file = self.state.code_block_file.take();

            // Emit appropriate event
            if let Some(file_path) = file {
                self.emit(StreamEvent::CodeChange(CodeChangeEvent {
                    file_path,
                    change_type: ChangeType::Modify,
                    content,
                    line_start: None,
                    line_end: None,
                    search_pattern: None,
                    replace_with: None,
                })).await;
            } else {
                self.emit(StreamEvent::Artifact(ArtifactEvent {
                    artifact_type: "code".to_string(),
                    identifier: format!("code_{}", uuid::Uuid::new_v4()),
                    content,
                    language: lang,
                })).await;
            }
        } else {
            self.state.code_block_content.push_str(line);
            self.state.code_block_content.push('\n');
        }
        Ok(())
    }

    /// Handle line while in diff
    async fn handle_diff_line(&mut self, line: &str) -> Result<(), String> {
        // Diff ends with empty line or new diff header
        if line.is_empty() || (DIFF_HEADER.is_match(line) && !self.state.diff_content.is_empty()) {
            self.state.in_diff = false;

            let content = std::mem::take(&mut self.state.diff_content);
            let file = self.state.diff_file.take().unwrap_or_default();

            self.emit(StreamEvent::CodeChange(CodeChangeEvent {
                file_path: file,
                change_type: ChangeType::Modify, // Diffs are treated as Modify
                content,
                line_start: None,
                line_end: None,
                search_pattern: None,
                replace_with: None,
            })).await;

            // If new diff started, set up for it
            if DIFF_HEADER.is_match(line) {
                self.state.in_diff = true;
                if let Some(caps) = DIFF_HEADER.captures(line) {
                    self.state.diff_file = caps.get(1).map(|m| m.as_str().to_string());
                }
                self.state.diff_content.push_str(line);
                self.state.diff_content.push('\n');
            }
        } else {
            self.state.diff_content.push_str(line);
            self.state.diff_content.push('\n');
        }
        Ok(())
    }

    /// Handle Aider-style search/replace
    async fn handle_search_replace_line(&mut self, line: &str) -> Result<(), String> {
        if AIDER_EDIT_MIDDLE.is_match(line) {
            self.state.search_replace_phase = SearchReplacePhase::Replace;
            return Ok(());
        }

        if AIDER_EDIT_END.is_match(line) {
            self.state.in_search_replace = false;
            self.state.search_replace_phase = SearchReplacePhase::None;

            let search = std::mem::take(&mut self.state.search_pattern);
            let replace = std::mem::take(&mut self.state.replace_content);

            // Try to determine file from context
            let file_path = self.state.code_block_file.clone()
                .unwrap_or_else(|| "unknown".to_string());

            self.emit(StreamEvent::CodeChange(CodeChangeEvent {
                file_path,
                change_type: ChangeType::Replace, // SearchReplace uses Replace
                content: replace.clone(),
                line_start: None,
                line_end: None,
                search_pattern: Some(search),
                replace_with: Some(replace),
            })).await;
            return Ok(());
        }

        match self.state.search_replace_phase {
            SearchReplacePhase::Search => {
                self.state.search_pattern.push_str(line);
                self.state.search_pattern.push('\n');
            }
            SearchReplacePhase::Replace => {
                self.state.replace_content.push_str(line);
                self.state.replace_content.push('\n');
            }
            SearchReplacePhase::None => {}
        }
        Ok(())
    }

    /// Handle tool call content
    async fn handle_tool_call_line(&mut self, line: &str) -> Result<(), String> {
        // Tool call ends with empty line or new section
        if line.is_empty() || line.starts_with('#') || TOOL_CALL_START.is_match(line) {
            self.state.in_tool_call = false;

            let tool_name = self.state.current_tool.take().unwrap_or_default();
            let args_str = std::mem::take(&mut self.state.tool_args_buffer);

            // Try to parse arguments as JSON
            let arguments: HashMap<String, serde_json::Value> =
                serde_json::from_str(&args_str).unwrap_or_default();

            self.emit(StreamEvent::ToolCall(ToolCallEvent {
                tool_name,
                arguments,
                id: None,
            })).await;
        } else {
            self.state.tool_args_buffer.push_str(line);
            self.state.tool_args_buffer.push('\n');
        }
        Ok(())
    }

    /// Parse special patterns in regular text
    async fn parse_special_patterns(&mut self, line: &str) -> Result<(), String> {
        // Check for token usage
        if let Some(caps) = TOKEN_USAGE.captures(line) {
            let input = caps.get(1).and_then(|m| m.as_str().parse().ok());
            let output = caps.get(2).and_then(|m| m.as_str().parse().ok());

            self.emit(StreamEvent::Usage(UsageEvent {
                input_tokens: input,
                output_tokens: output,
                total_tokens: input.zip(output).map(|(i, o)| i + o),
                cost_cents: None,
                cache_read_tokens: None,
                cache_write_tokens: None,
            })).await;
            return Ok(());
        }

        // Check for file operations
        let line_lower = line.to_lowercase();
        if line_lower.contains("reading") || line_lower.contains("read file") {
            if let Some(caps) = FILE_PATH_PATTERN.captures(line) {
                if let Some(path_match) = caps.get(1) {
                    self.emit(StreamEvent::FileRead {
                        path: path_match.as_str().to_string(),
                    }).await;
                    return Ok(());
                }
            }
        }

        if line_lower.contains("writing") || line_lower.contains("wrote") ||
           line_lower.contains("created") || line_lower.contains("updated") {
            if let Some(caps) = FILE_PATH_PATTERN.captures(line) {
                if let Some(path_match) = caps.get(1) {
                    self.emit(StreamEvent::FileWrite {
                        path: path_match.as_str().to_string(),
                        content: String::new(), // Content would come from code block
                    }).await;
                    return Ok(());
                }
            }
        }

        // Check for command execution
        if line.starts_with('$') || line.starts_with('>') || line_lower.starts_with("running") {
            let cmd = line.trim_start_matches(['$', '>', ' ']);
            if !cmd.is_empty() {
                self.emit(StreamEvent::CommandExec {
                    command: cmd.to_string(),
                }).await;
                return Ok(());
            }
        }

        // Check for errors
        if line_lower.contains("error") || line_lower.contains("failed") ||
           line_lower.contains("exception") {
            self.emit(StreamEvent::Error {
                message: line.to_string(),
                recoverable: !line_lower.contains("fatal") && !line_lower.contains("critical"),
            }).await;
            return Ok(());
        }

        // Check for completion
        if line_lower.contains("completed") || line_lower.contains("finished") ||
           line_lower.contains("done") || line_lower.contains("success") {
            self.emit(StreamEvent::Complete {
                success: true,
                summary: Some(line.to_string()),
            }).await;
            return Ok(());
        }

        // Default: emit as text
        self.emit(StreamEvent::Text(line.to_string())).await;
        Ok(())
    }

    /// Emit an event
    async fn emit(&self, event: StreamEvent) {
        let _ = self.event_tx.send(event).await;
    }

    /// Flush any remaining buffered content
    pub async fn flush(&mut self) -> Result<(), String> {
        // Emit any incomplete blocks
        if self.state.in_thinking && !self.state.thinking_content.is_empty() {
            let content = std::mem::take(&mut self.state.thinking_content);
            self.emit(StreamEvent::Thinking(content)).await;
            self.state.in_thinking = false;
        }

        if self.state.in_code_block && !self.state.code_block_content.is_empty() {
            let content = std::mem::take(&mut self.state.code_block_content);
            let lang = self.state.code_block_lang.take();

            self.emit(StreamEvent::Artifact(ArtifactEvent {
                artifact_type: "code".to_string(),
                identifier: format!("code_{}", uuid::Uuid::new_v4()),
                content,
                language: lang,
            })).await;
            self.state.in_code_block = false;
        }

        if self.state.in_diff && !self.state.diff_content.is_empty() {
            let content = std::mem::take(&mut self.state.diff_content);
            let file = self.state.diff_file.take().unwrap_or_default();

            self.emit(StreamEvent::CodeChange(CodeChangeEvent {
                file_path: file,
                change_type: ChangeType::Modify, // Diffs are treated as Modify
                content,
                line_start: None,
                line_end: None,
                search_pattern: None,
                replace_with: None,
            })).await;
            self.state.in_diff = false;
        }

        Ok(())
    }
}

// ============================================================================
// Stream Aggregator
// ============================================================================

/// Aggregates stream events into final results
pub struct StreamAggregator {
    /// Collected code changes
    pub code_changes: Vec<CodeChange>,
    /// Collected output text
    pub output_text: Vec<String>,
    /// Thinking content
    pub thinking: Vec<String>,
    /// Tool calls made
    pub tool_calls: Vec<ToolCallEvent>,
    /// Usage statistics
    pub usage: UsageEvent,
    /// Errors encountered
    pub errors: Vec<String>,
    /// Is completed
    pub completed: bool,
    /// Success status
    pub success: bool,
}

impl StreamAggregator {
    pub fn new() -> Self {
        Self {
            code_changes: Vec::new(),
            output_text: Vec::new(),
            thinking: Vec::new(),
            tool_calls: Vec::new(),
            usage: UsageEvent {
                input_tokens: None,
                output_tokens: None,
                total_tokens: None,
                cost_cents: None,
                cache_read_tokens: None,
                cache_write_tokens: None,
            },
            errors: Vec::new(),
            completed: false,
            success: false,
        }
    }

    /// Process a stream event
    pub fn process(&mut self, event: StreamEvent) {
        match event {
            StreamEvent::Text(text) => {
                self.output_text.push(text);
            }
            StreamEvent::Thinking(content) => {
                self.thinking.push(content);
            }
            StreamEvent::ToolCall(call) => {
                self.tool_calls.push(call);
            }
            StreamEvent::CodeChange(change) => {
                self.code_changes.push(CodeChange {
                    file_path: change.file_path,
                    change_type: change.change_type,
                    old_content: change.search_pattern,
                    new_content: Some(change.content),
                    line_start: change.line_start,
                    line_end: change.line_end,
                    before: None,
                    after: None,
                    line_range: None,
                });
            }
            StreamEvent::FileWrite { path, content } => {
                if !content.is_empty() {
                    self.code_changes.push(CodeChange {
                        file_path: path,
                        change_type: ChangeType::Create,
                        old_content: None,
                        new_content: Some(content),
                        line_start: None,
                        line_end: None,
                        before: None,
                        after: None,
                        line_range: None,
                    });
                }
            }
            StreamEvent::Usage(usage) => {
                // Merge usage stats
                if usage.input_tokens.is_some() {
                    self.usage.input_tokens = usage.input_tokens;
                }
                if usage.output_tokens.is_some() {
                    self.usage.output_tokens = usage.output_tokens;
                }
                if usage.total_tokens.is_some() {
                    self.usage.total_tokens = usage.total_tokens;
                }
                if usage.cost_cents.is_some() {
                    self.usage.cost_cents = usage.cost_cents;
                }
            }
            StreamEvent::Error { message, .. } => {
                self.errors.push(message);
            }
            StreamEvent::Complete { success, .. } => {
                self.completed = true;
                self.success = success;
            }
            _ => {}
        }
    }

    /// Get combined output text
    pub fn get_output(&self) -> String {
        self.output_text.join("\n")
    }
}

impl Default for StreamAggregator {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// Helper Functions
// ============================================================================

/// Create a parser and aggregator pair for streaming
pub fn create_stream_processor(
    source: CliSource,
) -> (StreamingParser, mpsc::Receiver<StreamEvent>, StreamAggregator) {
    let (tx, rx) = mpsc::channel(100);
    let parser = StreamingParser::new(source, tx);
    let aggregator = StreamAggregator::new();
    (parser, rx, aggregator)
}

/// Parse a complete output string (non-streaming)
pub async fn parse_output(
    source: CliSource,
    output: &str,
) -> Result<StreamAggregator, String> {
    let (mut parser, mut rx, mut aggregator) = create_stream_processor(source);

    // Parse all lines
    for line in output.lines() {
        parser.parse_line(line).await?;
    }
    parser.flush().await?;

    // Collect all events
    drop(parser);
    while let Some(event) = rx.recv().await {
        aggregator.process(event);
    }

    Ok(aggregator)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_code_block_parsing() {
        let output = r#"Here's the code:

```rust main.rs
fn main() {
    println!("Hello, world!");
}
```

Done!"#;

        let result = parse_output(CliSource::ClaudeCode, output).await.unwrap();
        assert_eq!(result.code_changes.len(), 1);
        assert_eq!(result.code_changes[0].file_path, "main.rs");
    }

    #[tokio::test]
    async fn test_aider_search_replace() {
        let output = r#"<<<<<<< SEARCH
old code
=======
new code
>>>>>>> REPLACE"#;

        let result = parse_output(CliSource::Aider, output).await.unwrap();
        assert_eq!(result.code_changes.len(), 1);
        assert_eq!(result.code_changes[0].change_type, ChangeType::Replace);
    }

    #[tokio::test]
    async fn test_thinking_block() {
        let output = r#"<thinking>
I need to analyze this code carefully.
Let me think about the approach.
</thinking>

Here's my response."#;

        let result = parse_output(CliSource::ClaudeCode, output).await.unwrap();
        assert_eq!(result.thinking.len(), 1);
        assert!(result.thinking[0].contains("analyze"));
    }
}
