// Phase 1.5: Natural Language Editing Commands
// Voice-based text manipulation like AquaVoice's "change X to Y" functionality

use std::sync::Arc;
use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use tokio::sync::RwLock;
use once_cell::sync::Lazy;
use regex::Regex;

/// Global command processor instance
static COMMAND_PROCESSOR: Lazy<Arc<NaturalLanguageCommandProcessor>> = Lazy::new(|| {
    Arc::new(NaturalLanguageCommandProcessor::new())
});

pub fn get_command_processor() -> Arc<NaturalLanguageCommandProcessor> {
    COMMAND_PROCESSOR.clone()
}

/// Types of commands that can be recognized
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum CommandType {
    /// Find and replace: "change X to Y", "replace X with Y"
    Replace,
    /// Delete text: "delete last sentence", "remove that"
    Delete,
    /// Format text: "make that a heading", "put that into bullet points"
    Format,
    /// Case transformation: "capitalize that", "make that lowercase"
    CaseTransform,
    /// Undo/redo: "undo that", "redo"
    UndoRedo,
    /// Selection: "select all", "select last paragraph"
    Selection,
    /// Navigation: "go to line 50", "go to end"
    Navigation,
    /// Insert: "insert new line", "add paragraph break"
    Insert,
    /// Not a command - regular dictation
    NotCommand,
}

/// A parsed natural language command
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedCommand {
    /// The type of command
    pub command_type: CommandType,
    /// Confidence score (0.0 - 1.0)
    pub confidence: f32,
    /// The original text
    pub original_text: String,
    /// Extracted parameters
    pub parameters: HashMap<String, String>,
    /// Can this command be executed?
    pub is_executable: bool,
    /// Human-readable description of what the command will do
    pub description: String,
}

impl Default for ParsedCommand {
    fn default() -> Self {
        Self {
            command_type: CommandType::NotCommand,
            confidence: 0.0,
            original_text: String::new(),
            parameters: HashMap::new(),
            is_executable: false,
            description: String::new(),
        }
    }
}

/// Result of executing a command
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandResult {
    /// Was the command successful?
    pub success: bool,
    /// The resulting text after command execution
    pub result_text: String,
    /// What changes were made
    pub changes_made: Vec<String>,
    /// Error message if failed
    pub error: Option<String>,
    /// Can be undone?
    pub undoable: bool,
}

/// Command pattern for matching
struct CommandPattern {
    /// Regex pattern
    pattern: Regex,
    /// Command type
    command_type: CommandType,
    /// Parameter extraction groups
    param_names: Vec<&'static str>,
    /// Base confidence for this pattern
    base_confidence: f32,
}

/// Natural language command processor
pub struct NaturalLanguageCommandProcessor {
    /// Registered command patterns
    patterns: Vec<CommandPattern>,
    /// Undo stack
    undo_stack: RwLock<Vec<UndoEntry>>,
    /// Redo stack
    redo_stack: RwLock<Vec<UndoEntry>>,
    /// Custom command aliases
    aliases: RwLock<HashMap<String, String>>,
    /// Command history
    history: RwLock<Vec<ParsedCommand>>,
}

#[derive(Debug, Clone)]
struct UndoEntry {
    before_text: String,
    after_text: String,
    command: ParsedCommand,
}

impl NaturalLanguageCommandProcessor {
    pub fn new() -> Self {
        let mut processor = Self {
            patterns: Vec::new(),
            undo_stack: RwLock::new(Vec::new()),
            redo_stack: RwLock::new(Vec::new()),
            aliases: RwLock::new(HashMap::new()),
            history: RwLock::new(Vec::new()),
        };

        processor.register_default_patterns();
        processor
    }

    fn register_default_patterns(&mut self) {
        // Replace/Change commands
        self.patterns.push(CommandPattern {
            pattern: Regex::new(r"(?i)^(?:change|replace)\s+(.+?)\s+(?:to|with)\s+(.+)$").expect("valid regex: change/replace command"),
            command_type: CommandType::Replace,
            param_names: vec!["from", "to"],
            base_confidence: 0.95,
        });

        self.patterns.push(CommandPattern {
            pattern: Regex::new(r"(?i)^(?:swap|switch)\s+(.+?)\s+(?:and|with)\s+(.+)$").expect("valid regex: swap/switch command"),
            command_type: CommandType::Replace,
            param_names: vec!["from", "to"],
            base_confidence: 0.90,
        });

        // Delete commands
        self.patterns.push(CommandPattern {
            pattern: Regex::new(r"(?i)^(?:delete|remove|erase)\s+(?:the\s+)?(?:last\s+)?(sentence|word|paragraph|line|character)$").expect("valid regex: delete-unit command"),
            command_type: CommandType::Delete,
            param_names: vec!["unit"],
            base_confidence: 0.95,
        });

        self.patterns.push(CommandPattern {
            pattern: Regex::new(r"(?i)^(?:delete|remove|erase)\s+(?:that|this)$").expect("valid regex: delete-this command"),
            command_type: CommandType::Delete,
            param_names: vec![],
            base_confidence: 0.90,
        });

        self.patterns.push(CommandPattern {
            pattern: Regex::new(r"(?i)^(?:delete|remove)\s+(?:the\s+)?last\s+(\d+)\s+(words?|sentences?|lines?|characters?)$").expect("valid regex: delete-count command"),
            command_type: CommandType::Delete,
            param_names: vec!["count", "unit"],
            base_confidence: 0.95,
        });

        // Format commands
        self.patterns.push(CommandPattern {
            pattern: Regex::new(r"(?i)^(?:make|convert|turn)\s+(?:that|this|it)\s+(?:into\s+)?(?:a\s+)?(heading|title|h1|h2|h3|header)$").expect("valid regex: heading format command"),
            command_type: CommandType::Format,
            param_names: vec!["format"],
            base_confidence: 0.95,
        });

        self.patterns.push(CommandPattern {
            pattern: Regex::new(r"(?i)^(?:put|convert|turn|format)\s+(?:that|this|it)\s+(?:into|as)\s+(?:a\s+)?(?:bulleted?\s+)?(?:list|bullet\s*points?|bullets?)$").expect("valid regex: bullet-list format command"),
            command_type: CommandType::Format,
            param_names: vec![],
            base_confidence: 0.95,
        });

        self.patterns.push(CommandPattern {
            pattern: Regex::new(r"(?i)^(?:put|convert|turn|format)\s+(?:that|this|it)\s+(?:into|as)\s+(?:a\s+)?(?:numbered?\s+)?list$").expect("valid regex: numbered-list format command"),
            command_type: CommandType::Format,
            param_names: vec![],
            base_confidence: 0.95,
        });

        self.patterns.push(CommandPattern {
            pattern: Regex::new(r"(?i)^(?:make|add)\s+(?:that|this|it)\s+bold$").expect("valid regex: bold format command"),
            command_type: CommandType::Format,
            param_names: vec![],
            base_confidence: 0.95,
        });

        self.patterns.push(CommandPattern {
            pattern: Regex::new(r"(?i)^(?:make|add)\s+(?:that|this|it)\s+italic$").expect("valid regex: italic format command"),
            command_type: CommandType::Format,
            param_names: vec![],
            base_confidence: 0.95,
        });

        self.patterns.push(CommandPattern {
            pattern: Regex::new(r"(?i)^(?:make|format)\s+(?:that|this|it)\s+(?:as\s+)?(?:a\s+)?code(?:\s+block)?$").expect("valid regex: code format command"),
            command_type: CommandType::Format,
            param_names: vec![],
            base_confidence: 0.95,
        });

        // Case transformation commands
        self.patterns.push(CommandPattern {
            pattern: Regex::new(r"(?i)^(?:capitalize|capitalise)\s+(?:that|this|it)$").expect("valid regex: capitalize command"),
            command_type: CommandType::CaseTransform,
            param_names: vec![],
            base_confidence: 0.95,
        });

        self.patterns.push(CommandPattern {
            pattern: Regex::new(r"(?i)^(?:make|convert)\s+(?:that|this|it)\s+(?:all\s+)?(?:upper\s*case|uppercase|caps)$").expect("valid regex: uppercase command"),
            command_type: CommandType::CaseTransform,
            param_names: vec![],
            base_confidence: 0.95,
        });

        self.patterns.push(CommandPattern {
            pattern: Regex::new(r"(?i)^(?:make|convert)\s+(?:that|this|it)\s+(?:all\s+)?(?:lower\s*case|lowercase)$").expect("valid regex: lowercase command"),
            command_type: CommandType::CaseTransform,
            param_names: vec![],
            base_confidence: 0.95,
        });

        self.patterns.push(CommandPattern {
            pattern: Regex::new(r"(?i)^(?:make|convert)\s+(?:that|this|it)\s+(?:title\s*case)$").expect("valid regex: title-case command"),
            command_type: CommandType::CaseTransform,
            param_names: vec![],
            base_confidence: 0.95,
        });

        // Undo/Redo commands
        self.patterns.push(CommandPattern {
            pattern: Regex::new(r"(?i)^(?:undo)(?:\s+that)?$").expect("valid regex: undo command"),
            command_type: CommandType::UndoRedo,
            param_names: vec![],
            base_confidence: 0.99,
        });

        self.patterns.push(CommandPattern {
            pattern: Regex::new(r"(?i)^(?:redo)(?:\s+that)?$").expect("valid regex: redo command"),
            command_type: CommandType::UndoRedo,
            param_names: vec![],
            base_confidence: 0.99,
        });

        // Selection commands
        self.patterns.push(CommandPattern {
            pattern: Regex::new(r"(?i)^(?:select)\s+all$").expect("valid regex: select-all command"),
            command_type: CommandType::Selection,
            param_names: vec![],
            base_confidence: 0.99,
        });

        self.patterns.push(CommandPattern {
            pattern: Regex::new(r"(?i)^(?:select)\s+(?:the\s+)?(?:last\s+)?(sentence|word|paragraph|line)$").expect("valid regex: select-unit command"),
            command_type: CommandType::Selection,
            param_names: vec!["unit"],
            base_confidence: 0.95,
        });

        // Navigation commands
        self.patterns.push(CommandPattern {
            pattern: Regex::new(r"(?i)^(?:go\s+to|move\s+to)\s+(?:line\s+)?(\d+)$").expect("valid regex: go-to-line command"),
            command_type: CommandType::Navigation,
            param_names: vec!["line"],
            base_confidence: 0.95,
        });

        self.patterns.push(CommandPattern {
            pattern: Regex::new(r"(?i)^(?:go\s+to|move\s+to)\s+(?:the\s+)?(beginning|start|end|top|bottom)$").expect("valid regex: go-to-position command"),
            command_type: CommandType::Navigation,
            param_names: vec!["position"],
            base_confidence: 0.95,
        });

        // Insert commands
        self.patterns.push(CommandPattern {
            pattern: Regex::new(r"(?i)^(?:insert|add)\s+(?:a\s+)?(?:new\s+)?line$").expect("valid regex: insert-line command"),
            command_type: CommandType::Insert,
            param_names: vec![],
            base_confidence: 0.95,
        });

        self.patterns.push(CommandPattern {
            pattern: Regex::new(r"(?i)^(?:insert|add)\s+(?:a\s+)?paragraph\s*break$").expect("valid regex: paragraph-break command"),
            command_type: CommandType::Insert,
            param_names: vec![],
            base_confidence: 0.95,
        });

        self.patterns.push(CommandPattern {
            pattern: Regex::new(r"(?i)^(?:new\s+)?(?:paragraph|para)$").expect("valid regex: new-paragraph command"),
            command_type: CommandType::Insert,
            param_names: vec![],
            base_confidence: 0.85,
        });
    }

    /// Parse a natural language command
    pub async fn parse(&self, text: &str) -> ParsedCommand {
        let trimmed = text.trim();

        // Check custom aliases first
        let resolved_text = {
            let aliases = self.aliases.read().await;
            aliases.get(trimmed).cloned().unwrap_or_else(|| trimmed.to_string())
        };

        // Try to match against patterns
        for pattern in &self.patterns {
            if let Some(captures) = pattern.pattern.captures(&resolved_text) {
                let mut params = HashMap::new();

                // Extract parameters
                for (i, param_name) in pattern.param_names.iter().enumerate() {
                    if let Some(value) = captures.get(i + 1) {
                        params.insert(param_name.to_string(), value.as_str().to_string());
                    }
                }

                let command = ParsedCommand {
                    command_type: pattern.command_type.clone(),
                    confidence: pattern.base_confidence,
                    original_text: text.to_string(),
                    parameters: params,
                    is_executable: true,
                    description: self.generate_description(&pattern.command_type, &captures),
                };

                // Add to history
                self.history.write().await.push(command.clone());

                return command;
            }
        }

        // No pattern matched - not a command
        ParsedCommand {
            command_type: CommandType::NotCommand,
            confidence: 0.0,
            original_text: text.to_string(),
            parameters: HashMap::new(),
            is_executable: false,
            description: "Regular dictation text".to_string(),
        }
    }

    /// Execute a command on the given text
    pub async fn execute(
        &self,
        command: &ParsedCommand,
        current_text: &str,
        selection: Option<(usize, usize)>,
    ) -> CommandResult {
        if !command.is_executable {
            return CommandResult {
                success: false,
                result_text: current_text.to_string(),
                changes_made: vec![],
                error: Some("Command is not executable".to_string()),
                undoable: false,
            };
        }

        let result = match &command.command_type {
            CommandType::Replace => {
                self.execute_replace(command, current_text).await
            }
            CommandType::Delete => {
                self.execute_delete(command, current_text, selection).await
            }
            CommandType::Format => {
                self.execute_format(command, current_text, selection).await
            }
            CommandType::CaseTransform => {
                self.execute_case_transform(command, current_text, selection).await
            }
            CommandType::UndoRedo => {
                self.execute_undo_redo(command, current_text).await
            }
            CommandType::Insert => {
                self.execute_insert(command, current_text, selection).await
            }
            _ => CommandResult {
                success: false,
                result_text: current_text.to_string(),
                changes_made: vec![],
                error: Some("Command type not implemented".to_string()),
                undoable: false,
            },
        };

        // Save to undo stack if successful and undoable
        if result.success && result.undoable {
            let entry = UndoEntry {
                before_text: current_text.to_string(),
                after_text: result.result_text.clone(),
                command: command.clone(),
            };
            self.undo_stack.write().await.push(entry);
            // Clear redo stack on new action
            self.redo_stack.write().await.clear();
        }

        result
    }

    async fn execute_replace(
        &self,
        command: &ParsedCommand,
        current_text: &str,
    ) -> CommandResult {
        let from = command.parameters.get("from").map(|s| s.as_str()).unwrap_or("");
        let to = command.parameters.get("to").map(|s| s.as_str()).unwrap_or("");

        if from.is_empty() {
            return CommandResult {
                success: false,
                result_text: current_text.to_string(),
                changes_made: vec![],
                error: Some("No 'from' text specified".to_string()),
                undoable: false,
            };
        }

        // Case-insensitive replacement
        let pattern = match Regex::new(&format!("(?i){}", regex::escape(from))) {
            Ok(re) => re,
            Err(_) => {
                return CommandResult {
                    success: false,
                    result_text: current_text.to_string(),
                    changes_made: vec![],
                    error: Some(format!("Invalid pattern for replacement: '{}'", from)),
                    undoable: false,
                };
            }
        };
        let count = pattern.find_iter(current_text).count();

        if count == 0 {
            return CommandResult {
                success: false,
                result_text: current_text.to_string(),
                changes_made: vec![],
                error: Some(format!("'{}' not found in text", from)),
                undoable: false,
            };
        }

        let result_text = pattern.replace_all(current_text, to).to_string();

        CommandResult {
            success: true,
            result_text,
            changes_made: vec![format!("Replaced {} occurrence(s) of '{}' with '{}'", count, from, to)],
            error: None,
            undoable: true,
        }
    }

    async fn execute_delete(
        &self,
        command: &ParsedCommand,
        current_text: &str,
        selection: Option<(usize, usize)>,
    ) -> CommandResult {
        // If we have a selection, delete that
        if let Some((start, end)) = selection {
            if start < current_text.len() && end <= current_text.len() && start < end {
                let mut result = current_text.to_string();
                result.replace_range(start..end, "");
                return CommandResult {
                    success: true,
                    result_text: result,
                    changes_made: vec!["Deleted selection".to_string()],
                    error: None,
                    undoable: true,
                };
            }
        }

        // Delete by unit
        let unit = command.parameters.get("unit").map(|s| s.as_str()).unwrap_or("word");
        let count: usize = command.parameters.get("count")
            .and_then(|s| s.parse().ok())
            .unwrap_or(1);

        let result_text = match unit {
            "word" | "words" => self.delete_last_words(current_text, count),
            "sentence" | "sentences" => self.delete_last_sentences(current_text, count),
            "line" | "lines" => self.delete_last_lines(current_text, count),
            "character" | "characters" => self.delete_last_characters(current_text, count),
            "paragraph" | "paragraphs" => self.delete_last_paragraphs(current_text, count),
            _ => current_text.to_string(),
        };

        CommandResult {
            success: true,
            result_text,
            changes_made: vec![format!("Deleted {} {}", count, unit)],
            error: None,
            undoable: true,
        }
    }

    async fn execute_format(
        &self,
        command: &ParsedCommand,
        current_text: &str,
        selection: Option<(usize, usize)>,
    ) -> CommandResult {
        let text_to_format = if let Some((start, end)) = selection {
            &current_text[start..end.min(current_text.len())]
        } else {
            current_text
        };

        let original = &command.original_text.to_lowercase();

        let formatted = if original.contains("bullet") || original.contains("list") {
            self.format_as_bullet_list(text_to_format)
        } else if original.contains("numbered") {
            self.format_as_numbered_list(text_to_format)
        } else if original.contains("heading") || original.contains("title") || original.contains("header") {
            self.format_as_heading(text_to_format)
        } else if original.contains("bold") {
            format!("**{}**", text_to_format)
        } else if original.contains("italic") {
            format!("*{}*", text_to_format)
        } else if original.contains("code") {
            format!("```\n{}\n```", text_to_format)
        } else {
            text_to_format.to_string()
        };

        let result_text = if let Some((start, end)) = selection {
            let mut result = current_text.to_string();
            result.replace_range(start..end.min(current_text.len()), &formatted);
            result
        } else {
            formatted
        };

        CommandResult {
            success: true,
            result_text,
            changes_made: vec!["Applied formatting".to_string()],
            error: None,
            undoable: true,
        }
    }

    async fn execute_case_transform(
        &self,
        command: &ParsedCommand,
        current_text: &str,
        selection: Option<(usize, usize)>,
    ) -> CommandResult {
        let text_to_transform = if let Some((start, end)) = selection {
            &current_text[start..end.min(current_text.len())]
        } else {
            current_text
        };

        let original = &command.original_text.to_lowercase();

        let transformed = if original.contains("uppercase") || original.contains("caps") {
            text_to_transform.to_uppercase()
        } else if original.contains("lowercase") {
            text_to_transform.to_lowercase()
        } else if original.contains("capitalize") || original.contains("title") {
            self.to_title_case(text_to_transform)
        } else {
            text_to_transform.to_string()
        };

        let result_text = if let Some((start, end)) = selection {
            let mut result = current_text.to_string();
            result.replace_range(start..end.min(current_text.len()), &transformed);
            result
        } else {
            transformed
        };

        CommandResult {
            success: true,
            result_text,
            changes_made: vec!["Applied case transformation".to_string()],
            error: None,
            undoable: true,
        }
    }

    async fn execute_undo_redo(
        &self,
        command: &ParsedCommand,
        current_text: &str,
    ) -> CommandResult {
        let is_undo = command.original_text.to_lowercase().contains("undo");

        if is_undo {
            let mut undo_stack = self.undo_stack.write().await;
            if let Some(entry) = undo_stack.pop() {
                let mut redo_stack = self.redo_stack.write().await;
                redo_stack.push(UndoEntry {
                    before_text: entry.after_text.clone(),
                    after_text: entry.before_text.clone(),
                    command: entry.command.clone(),
                });

                return CommandResult {
                    success: true,
                    result_text: entry.before_text,
                    changes_made: vec!["Undone last change".to_string()],
                    error: None,
                    undoable: false,
                };
            } else {
                return CommandResult {
                    success: false,
                    result_text: current_text.to_string(),
                    changes_made: vec![],
                    error: Some("Nothing to undo".to_string()),
                    undoable: false,
                };
            }
        } else {
            let mut redo_stack = self.redo_stack.write().await;
            if let Some(entry) = redo_stack.pop() {
                let mut undo_stack = self.undo_stack.write().await;
                undo_stack.push(UndoEntry {
                    before_text: entry.after_text.clone(),
                    after_text: entry.before_text.clone(),
                    command: entry.command.clone(),
                });

                return CommandResult {
                    success: true,
                    result_text: entry.before_text,
                    changes_made: vec!["Redone last change".to_string()],
                    error: None,
                    undoable: false,
                };
            } else {
                return CommandResult {
                    success: false,
                    result_text: current_text.to_string(),
                    changes_made: vec![],
                    error: Some("Nothing to redo".to_string()),
                    undoable: false,
                };
            }
        }
    }

    async fn execute_insert(
        &self,
        command: &ParsedCommand,
        current_text: &str,
        selection: Option<(usize, usize)>,
    ) -> CommandResult {
        let insert_position = selection.map(|(_, end)| end).unwrap_or(current_text.len());
        let original = &command.original_text.to_lowercase();

        let to_insert = if original.contains("paragraph") {
            "\n\n"
        } else if original.contains("line") {
            "\n"
        } else {
            "\n"
        };

        let mut result = current_text.to_string();
        result.insert_str(insert_position.min(result.len()), to_insert);

        CommandResult {
            success: true,
            result_text: result,
            changes_made: vec!["Inserted break".to_string()],
            error: None,
            undoable: true,
        }
    }

    // Helper methods

    fn delete_last_words(&self, text: &str, count: usize) -> String {
        let words: Vec<&str> = text.split_whitespace().collect();
        if count >= words.len() {
            return String::new();
        }
        words[..words.len() - count].join(" ")
    }

    fn delete_last_sentences(&self, text: &str, count: usize) -> String {
        let sentence_pattern = Regex::new(r"[.!?]+\s*").expect("valid regex: sentence delimiter pattern");
        let sentences: Vec<&str> = sentence_pattern.split(text).filter(|s| !s.is_empty()).collect();
        if count >= sentences.len() {
            return String::new();
        }
        sentences[..sentences.len() - count].join(". ") + "."
    }

    fn delete_last_lines(&self, text: &str, count: usize) -> String {
        let lines: Vec<&str> = text.lines().collect();
        if count >= lines.len() {
            return String::new();
        }
        lines[..lines.len() - count].join("\n")
    }

    fn delete_last_characters(&self, text: &str, count: usize) -> String {
        let chars: Vec<char> = text.chars().collect();
        if count >= chars.len() {
            return String::new();
        }
        chars[..chars.len() - count].iter().collect()
    }

    fn delete_last_paragraphs(&self, text: &str, count: usize) -> String {
        let paragraphs: Vec<&str> = text.split("\n\n").filter(|s| !s.is_empty()).collect();
        if count >= paragraphs.len() {
            return String::new();
        }
        paragraphs[..paragraphs.len() - count].join("\n\n")
    }

    fn format_as_bullet_list(&self, text: &str) -> String {
        text.lines()
            .filter(|line| !line.trim().is_empty())
            .map(|line| format!("- {}", line.trim()))
            .collect::<Vec<_>>()
            .join("\n")
    }

    fn format_as_numbered_list(&self, text: &str) -> String {
        text.lines()
            .filter(|line| !line.trim().is_empty())
            .enumerate()
            .map(|(i, line)| format!("{}. {}", i + 1, line.trim()))
            .collect::<Vec<_>>()
            .join("\n")
    }

    fn format_as_heading(&self, text: &str) -> String {
        format!("# {}", text.trim())
    }

    fn to_title_case(&self, text: &str) -> String {
        text.split_whitespace()
            .map(|word| {
                let mut chars: Vec<char> = word.chars().collect();
                if let Some(first) = chars.first_mut() {
                    *first = first.to_uppercase().next().unwrap_or(*first);
                }
                chars.iter().collect::<String>()
            })
            .collect::<Vec<_>>()
            .join(" ")
    }

    fn generate_description(&self, command_type: &CommandType, captures: &regex::Captures) -> String {
        match command_type {
            CommandType::Replace => {
                let from = captures.get(1).map(|m| m.as_str()).unwrap_or("X");
                let to = captures.get(2).map(|m| m.as_str()).unwrap_or("Y");
                format!("Replace '{}' with '{}'", from, to)
            }
            CommandType::Delete => {
                if let Some(unit) = captures.get(1) {
                    format!("Delete last {}", unit.as_str())
                } else {
                    "Delete selection".to_string()
                }
            }
            CommandType::Format => {
                "Apply formatting".to_string()
            }
            CommandType::CaseTransform => {
                "Transform case".to_string()
            }
            CommandType::UndoRedo => {
                if captures.get(0).map(|m| m.as_str().to_lowercase().contains("undo")).unwrap_or(false) {
                    "Undo last change".to_string()
                } else {
                    "Redo last change".to_string()
                }
            }
            _ => "Execute command".to_string(),
        }
    }

    /// Add a custom command alias
    pub async fn add_alias(&self, alias: &str, command: &str) {
        self.aliases.write().await.insert(alias.to_lowercase(), command.to_string());
    }

    /// Get command history
    pub async fn get_history(&self) -> Vec<ParsedCommand> {
        self.history.read().await.clone()
    }

    /// Clear command history
    pub async fn clear_history(&self) {
        self.history.write().await.clear();
        self.undo_stack.write().await.clear();
        self.redo_stack.write().await.clear();
    }
}

// Tauri commands

#[tauri::command]
pub async fn parse_natural_language_command(text: String) -> Result<ParsedCommand, String> {
    Ok(get_command_processor().parse(&text).await)
}

#[tauri::command]
pub async fn execute_natural_language_command(
    command: ParsedCommand,
    current_text: String,
    selection_start: Option<usize>,
    selection_end: Option<usize>,
) -> Result<CommandResult, String> {
    let selection = match (selection_start, selection_end) {
        (Some(start), Some(end)) => Some((start, end)),
        _ => None,
    };

    Ok(get_command_processor().execute(&command, &current_text, selection).await)
}

#[tauri::command]
pub async fn add_command_alias(alias: String, command: String) -> Result<(), String> {
    get_command_processor().add_alias(&alias, &command).await;
    Ok(())
}

#[tauri::command]
pub async fn get_command_history() -> Result<Vec<ParsedCommand>, String> {
    Ok(get_command_processor().get_history().await)
}

#[tauri::command]
pub async fn clear_command_history() -> Result<(), String> {
    get_command_processor().clear_history().await;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_parse_replace_command() {
        let processor = NaturalLanguageCommandProcessor::new();

        let command = processor.parse("change hello to goodbye").await;
        assert_eq!(command.command_type, CommandType::Replace);
        assert_eq!(command.parameters.get("from").unwrap(), "hello");
        assert_eq!(command.parameters.get("to").unwrap(), "goodbye");
    }

    #[tokio::test]
    async fn test_parse_delete_command() {
        let processor = NaturalLanguageCommandProcessor::new();

        let command = processor.parse("delete last sentence").await;
        assert_eq!(command.command_type, CommandType::Delete);
        assert_eq!(command.parameters.get("unit").unwrap(), "sentence");
    }

    #[tokio::test]
    async fn test_parse_format_command() {
        let processor = NaturalLanguageCommandProcessor::new();

        let command = processor.parse("put that into bullet points").await;
        assert_eq!(command.command_type, CommandType::Format);
    }

    #[tokio::test]
    async fn test_execute_replace() {
        let processor = NaturalLanguageCommandProcessor::new();

        let command = processor.parse("change hello to goodbye").await;
        let result = processor.execute(&command, "hello world", None).await;

        assert!(result.success);
        assert_eq!(result.result_text, "goodbye world");
    }

    #[tokio::test]
    async fn test_execute_delete_word() {
        let processor = NaturalLanguageCommandProcessor::new();

        let command = processor.parse("delete last word").await;
        let result = processor.execute(&command, "hello world foo", None).await;

        assert!(result.success);
        assert_eq!(result.result_text, "hello world");
    }

    #[tokio::test]
    async fn test_execute_format_bullet_list() {
        let processor = NaturalLanguageCommandProcessor::new();

        let command = processor.parse("put that into bullet points").await;
        let result = processor.execute(&command, "item one\nitem two\nitem three", None).await;

        assert!(result.success);
        assert!(result.result_text.contains("- item one"));
        assert!(result.result_text.contains("- item two"));
    }

    #[tokio::test]
    async fn test_undo_redo() {
        let processor = NaturalLanguageCommandProcessor::new();

        // Make a change
        let replace_cmd = processor.parse("change foo to bar").await;
        let result = processor.execute(&replace_cmd, "foo baz", None).await;
        assert_eq!(result.result_text, "bar baz");

        // Undo
        let undo_cmd = processor.parse("undo").await;
        let result = processor.execute(&undo_cmd, "bar baz", None).await;
        assert!(result.success);
        assert_eq!(result.result_text, "foo baz");

        // Redo
        let redo_cmd = processor.parse("redo").await;
        let result = processor.execute(&redo_cmd, "foo baz", None).await;
        assert!(result.success);
        assert_eq!(result.result_text, "bar baz");
    }
}
