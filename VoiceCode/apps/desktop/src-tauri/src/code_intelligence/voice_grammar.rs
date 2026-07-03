#![allow(dead_code, unused_variables, unused_imports)]
// Voice Grammar System - Voice-First Command Parsing
// Parses natural language voice commands into structured coding actions
// VoiceCode's key differentiator: voice-first coding experience

use regex::Regex;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Parsed voice command structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VoiceCommand {
    pub id: String,
    pub raw_input: String,
    pub normalized_input: String,
    pub action: VoiceAction,
    pub target: Option<CommandTarget>,
    pub parameters: CommandParameters,
    pub confidence: f32,
    pub alternatives: Vec<VoiceCommand>,
    pub requires_confirmation: bool,
}

/// Voice action types
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum VoiceAction {
    // Code creation
    Create,
    Generate,
    Add,
    Write,

    // Code modification
    Edit,
    Modify,
    Change,
    Update,
    Rename,
    Replace,

    // Code deletion
    Delete,
    Remove,

    // Navigation
    GoTo,
    Navigate,
    Open,
    Find,
    Search,

    // Execution
    Run,
    Execute,
    Build,
    Test,
    Deploy,

    // Git operations
    Commit,
    Push,
    Pull,
    Merge,
    Branch,
    Checkout,

    // Code intelligence
    Explain,
    Document,
    Refactor,
    Fix,
    Debug,
    Optimize,

    // Selection/Cursor
    Select,
    Highlight,
    Copy,
    Cut,
    Paste,
    Undo,
    Redo,

    // File operations
    Save,
    Close,
    NewFile,

    // Control
    Stop,
    Cancel,

    // Unknown
    Unknown,
}

impl VoiceAction {
    pub fn from_verb(verb: &str) -> Self {
        match verb.to_lowercase().as_str() {
            "create" | "make" | "new" => Self::Create,
            "generate" | "gen" => Self::Generate,
            "add" | "insert" | "put" => Self::Add,
            "write" => Self::Write,

            "edit" => Self::Edit,
            "modify" | "change" | "alter" => Self::Modify,
            "update" => Self::Update,
            "rename" => Self::Rename,
            "replace" => Self::Replace,

            "delete" | "del" => Self::Delete,
            "remove" | "rm" => Self::Remove,

            "go" | "goto" | "jump" => Self::GoTo,
            "navigate" | "nav" => Self::Navigate,
            "open" => Self::Open,
            "find" | "search" | "look" => Self::Find,

            "run" | "start" => Self::Run,
            "execute" | "exec" => Self::Execute,
            "build" | "compile" => Self::Build,
            "test" => Self::Test,
            "deploy" => Self::Deploy,

            "commit" => Self::Commit,
            "push" => Self::Push,
            "pull" => Self::Pull,
            "merge" => Self::Merge,
            "branch" => Self::Branch,
            "checkout" | "switch" => Self::Checkout,

            "explain" | "what" | "how" | "why" => Self::Explain,
            "document" | "doc" | "comment" => Self::Document,
            "refactor" | "restructure" | "reorganize" => Self::Refactor,
            "fix" | "repair" | "solve" => Self::Fix,
            "debug" => Self::Debug,
            "optimize" | "improve" | "speed" => Self::Optimize,

            "select" => Self::Select,
            "highlight" => Self::Highlight,
            "copy" => Self::Copy,
            "cut" => Self::Cut,
            "paste" => Self::Paste,
            "undo" => Self::Undo,
            "redo" => Self::Redo,

            "save" => Self::Save,
            "close" => Self::Close,

            _ => Self::Unknown,
        }
    }

    pub fn is_destructive(&self) -> bool {
        matches!(
            self,
            Self::Delete | Self::Remove | Self::Replace | Self::Push | Self::Merge | Self::Deploy
        )
    }

    pub fn requires_confirmation(&self) -> bool {
        self.is_destructive() || matches!(self, Self::Commit | Self::Execute | Self::Run)
    }
}

/// Target of the command
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandTarget {
    pub target_type: TargetType,
    pub name: Option<String>,
    pub location: Option<TargetLocation>,
    pub modifiers: Vec<String>,
}

/// Type of target
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum TargetType {
    Function,
    Method,
    Class,
    Struct,
    Interface,
    Trait,
    Enum,
    Variable,
    Constant,
    Type,
    File,
    Line,
    Selection,
    Parameter,
    Import,
    Export,
    Test,
    Module,
    Package,
    Comment,
    All,
    This,
    Unknown,
}

impl TargetType {
    pub fn from_keyword(keyword: &str) -> Self {
        match keyword.to_lowercase().as_str() {
            "function" | "func" | "fn" | "method" | "def" => Self::Function,
            "class" => Self::Class,
            "struct" | "structure" => Self::Struct,
            "interface" => Self::Interface,
            "trait" => Self::Trait,
            "enum" | "enumeration" => Self::Enum,
            "variable" | "var" | "let" | "const" => Self::Variable,
            "constant" => Self::Constant,
            "type" | "typedef" => Self::Type,
            "file" => Self::File,
            "line" | "lines" => Self::Line,
            "selection" | "selected" | "this" => Self::Selection,
            "parameter" | "param" | "argument" | "arg" => Self::Parameter,
            "import" | "imports" => Self::Import,
            "export" | "exports" => Self::Export,
            "test" | "tests" | "spec" => Self::Test,
            "module" | "mod" => Self::Module,
            "package" | "pkg" => Self::Package,
            "comment" | "comments" => Self::Comment,
            "all" | "everything" => Self::All,
            _ => Self::Unknown,
        }
    }
}

/// Location specification
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TargetLocation {
    pub location_type: LocationType,
    pub value: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum LocationType {
    LineNumber,
    FileName,
    SymbolName,
    Relative, // "above", "below", "next", "previous"
}

/// Parameters extracted from the command
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct CommandParameters {
    pub name: Option<String>,
    pub new_name: Option<String>,
    pub return_type: Option<String>,
    pub parameters: Vec<ParameterDef>,
    pub modifiers: Vec<String>,
    pub language: Option<String>,
    pub message: Option<String>,
    pub count: Option<usize>,
    pub with_tests: bool,
    pub with_docs: bool,
    pub async_flag: bool,
    pub public_flag: bool,
    pub static_flag: bool,
    pub additional: HashMap<String, String>,
}

/// Parameter definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParameterDef {
    pub name: String,
    pub param_type: Option<String>,
    pub default_value: Option<String>,
    pub optional: bool,
}

/// Voice Grammar Parser
pub struct VoiceGrammarParser {
    action_patterns: Vec<ActionPattern>,
    target_patterns: Vec<TargetPattern>,
    parameter_patterns: Vec<ParameterPattern>,
    type_mappings: HashMap<String, String>,
    common_phrases: HashMap<String, String>,
}

struct ActionPattern {
    pattern: Regex,
    action: VoiceAction,
    priority: u8,
}

struct TargetPattern {
    pattern: Regex,
    target_type: TargetType,
}

struct ParameterPattern {
    pattern: Regex,
    extractor: fn(&regex::Captures) -> Option<(String, String)>,
}

impl VoiceGrammarParser {
    pub fn new() -> Self {
        let mut parser = Self {
            action_patterns: Vec::new(),
            target_patterns: Vec::new(),
            parameter_patterns: Vec::new(),
            type_mappings: HashMap::new(),
            common_phrases: HashMap::new(),
        };
        parser.initialize_patterns();
        parser
    }

    fn initialize_patterns(&mut self) {
        // Action patterns with priority
        self.action_patterns = vec![
            // Create patterns
            ActionPattern {
                pattern: Regex::new(r"(?i)^(create|make|add|new|write|generate)\s").expect("valid regex: create action"),
                action: VoiceAction::Create,
                priority: 10,
            },
            // Navigate patterns
            ActionPattern {
                pattern: Regex::new(r"(?i)^(go\s+to|goto|jump\s+to|navigate\s+to|open)\s").expect("valid regex: navigate action"),
                action: VoiceAction::GoTo,
                priority: 10,
            },
            // Edit patterns
            ActionPattern {
                pattern: Regex::new(r"(?i)^(edit|modify|change|update)\s").expect("valid regex: edit action"),
                action: VoiceAction::Edit,
                priority: 10,
            },
            // Delete patterns
            ActionPattern {
                pattern: Regex::new(r"(?i)^(delete|remove|drop)\s").expect("valid regex: delete action"),
                action: VoiceAction::Delete,
                priority: 10,
            },
            // Rename patterns
            ActionPattern {
                pattern: Regex::new(r"(?i)^rename\s").expect("valid regex: rename action"),
                action: VoiceAction::Rename,
                priority: 10,
            },
            // Explain patterns
            ActionPattern {
                pattern: Regex::new(r"(?i)^(explain|what\s+does|what\s+is|how\s+does)\s").expect("valid regex: explain action"),
                action: VoiceAction::Explain,
                priority: 10,
            },
            // Refactor patterns
            ActionPattern {
                pattern: Regex::new(r"(?i)^(refactor|extract|inline|optimize)\s").expect("valid regex: refactor action"),
                action: VoiceAction::Refactor,
                priority: 10,
            },
            // Fix patterns
            ActionPattern {
                pattern: Regex::new(r"(?i)^(fix|repair|debug|solve)\s").expect("valid regex: fix action"),
                action: VoiceAction::Fix,
                priority: 10,
            },
            // Test patterns
            ActionPattern {
                pattern: Regex::new(r"(?i)^(test|run\s+tests?|generate\s+tests?)\s").expect("valid regex: test action"),
                action: VoiceAction::Test,
                priority: 10,
            },
            // Run patterns
            ActionPattern {
                pattern: Regex::new(r"(?i)^(run|execute|start)\s").expect("valid regex: run action"),
                action: VoiceAction::Run,
                priority: 8,
            },
            // Git patterns
            ActionPattern {
                pattern: Regex::new(r"(?i)^(commit|push|pull|merge|checkout|branch)\s?").expect("valid regex: git action"),
                action: VoiceAction::Commit, // Will be refined
                priority: 10,
            },
            // Document patterns
            ActionPattern {
                pattern: Regex::new(r"(?i)^(document|add\s+docs?|add\s+comments?)\s").expect("valid regex: document action"),
                action: VoiceAction::Document,
                priority: 10,
            },
            // Find/Search patterns
            ActionPattern {
                pattern: Regex::new(r"(?i)^(find|search|look\s+for|where\s+is)\s").expect("valid regex: find action"),
                action: VoiceAction::Find,
                priority: 10,
            },
        ];

        // Target patterns
        self.target_patterns = vec![
            TargetPattern {
                pattern: Regex::new(r"(?i)\b(function|func|fn|method|def)\b").expect("valid regex: function target"),
                target_type: TargetType::Function,
            },
            TargetPattern {
                pattern: Regex::new(r"(?i)\bclass\b").expect("valid regex: class target"),
                target_type: TargetType::Class,
            },
            TargetPattern {
                pattern: Regex::new(r"(?i)\b(struct|structure)\b").expect("valid regex: struct target"),
                target_type: TargetType::Struct,
            },
            TargetPattern {
                pattern: Regex::new(r"(?i)\binterface\b").expect("valid regex: interface target"),
                target_type: TargetType::Interface,
            },
            TargetPattern {
                pattern: Regex::new(r"(?i)\b(variable|var|let|const)\b").expect("valid regex: variable target"),
                target_type: TargetType::Variable,
            },
            TargetPattern {
                pattern: Regex::new(r"(?i)\bfile\b").expect("valid regex: file target"),
                target_type: TargetType::File,
            },
            TargetPattern {
                pattern: Regex::new(r"(?i)\blines?\s+\d+").expect("valid regex: line target"),
                target_type: TargetType::Line,
            },
            TargetPattern {
                pattern: Regex::new(r"(?i)\b(this|selection|selected)\b").expect("valid regex: selection target"),
                target_type: TargetType::Selection,
            },
            TargetPattern {
                pattern: Regex::new(r"(?i)\btests?\b").expect("valid regex: test target"),
                target_type: TargetType::Test,
            },
            TargetPattern {
                pattern: Regex::new(r"(?i)\b(import|imports)\b").expect("valid regex: import target"),
                target_type: TargetType::Import,
            },
        ];

        // Type mappings for natural language to actual types
        self.type_mappings = HashMap::from([
            ("string".to_string(), "string".to_string()),
            ("text".to_string(), "string".to_string()),
            ("number".to_string(), "number".to_string()),
            ("integer".to_string(), "number".to_string()),
            ("int".to_string(), "number".to_string()),
            ("boolean".to_string(), "boolean".to_string()),
            ("bool".to_string(), "boolean".to_string()),
            ("true or false".to_string(), "boolean".to_string()),
            ("array".to_string(), "Array".to_string()),
            ("list".to_string(), "Array".to_string()),
            ("object".to_string(), "object".to_string()),
            ("nothing".to_string(), "void".to_string()),
            ("void".to_string(), "void".to_string()),
            ("promise".to_string(), "Promise".to_string()),
            ("async".to_string(), "Promise".to_string()),
        ]);

        // Common phrases and their normalized forms
        self.common_phrases = HashMap::from([
            ("called".to_string(), "named".to_string()),
            ("named".to_string(), "named".to_string()),
            ("that takes".to_string(), "with parameters".to_string()),
            ("which takes".to_string(), "with parameters".to_string()),
            ("and returns".to_string(), "returning".to_string()),
            ("that returns".to_string(), "returning".to_string()),
            ("which returns".to_string(), "returning".to_string()),
        ]);
    }

    /// Parse a voice command into structured form
    pub fn parse(&self, input: &str) -> VoiceCommand {
        let normalized = self.normalize_input(input);
        let action = self.extract_action(&normalized);
        let target = self.extract_target_with_original(&normalized, input);
        let parameters = self.extract_parameters_with_original(&normalized, input, &action, &target);
        let confidence = self.calculate_confidence(&normalized, &action, &target);

        VoiceCommand {
            id: uuid::Uuid::new_v4().to_string(),
            raw_input: input.to_string(),
            normalized_input: normalized,
            action: action.clone(),
            target,
            parameters,
            confidence,
            alternatives: Vec::new(),
            requires_confirmation: action.requires_confirmation(),
        }
    }

    /// Normalize input for consistent parsing
    fn normalize_input(&self, input: &str) -> String {
        let mut result = input.trim().to_lowercase();

        // Apply common phrase replacements
        for (phrase, replacement) in &self.common_phrases {
            result = result.replace(phrase, replacement);
        }

        // Remove filler words
        let fillers = [
            "please",
            "kindly",
            "can you",
            "could you",
            "would you",
            "i want to",
            "i need to",
        ];
        for filler in &fillers {
            result = result.replace(filler, "");
        }

        // Normalize whitespace
        result = result.split_whitespace().collect::<Vec<_>>().join(" ");

        result
    }

    /// Extract the primary action from the command
    fn extract_action(&self, input: &str) -> VoiceAction {
        // Try pattern matching first
        for pattern in &self.action_patterns {
            if pattern.pattern.is_match(input) {
                return pattern.action.clone();
            }
        }

        // Try first word as verb
        if let Some(first_word) = input.split_whitespace().next() {
            let action = VoiceAction::from_verb(first_word);
            if action != VoiceAction::Unknown {
                return action;
            }
        }

        VoiceAction::Unknown
    }

    /// Extract the target of the command (uses normalized input only)
    fn extract_target(&self, input: &str) -> Option<CommandTarget> {
        self.extract_target_with_original(input, input)
    }

    /// Extract the target, using original input to preserve identifier casing
    fn extract_target_with_original(&self, input: &str, original: &str) -> Option<CommandTarget> {
        let mut target_type = TargetType::Unknown;
        let mut name = None;
        let mut modifiers = Vec::new();

        // Find target type
        for pattern in &self.target_patterns {
            if pattern.pattern.is_match(input) {
                target_type = pattern.target_type.clone();
                break;
            }
        }

        // Extract name from ORIGINAL input to preserve casing (e.g., "validateEmail")
        let name_pattern = Regex::new(r"(?i)(?:named|called)\s+([a-zA-Z_][a-zA-Z0-9_]*)").ok();
        if let Some(ref pattern) = name_pattern {
            if let Some(caps) = pattern.captures(original) {
                name = caps.get(1).map(|m| m.as_str().to_string());
            }
        }

        // If no "named" pattern, try to extract identifier after target type
        if name.is_none() {
            let id_pattern =
                Regex::new(r"(?i)(?:function|class|variable|method)\s+([a-zA-Z_][a-zA-Z0-9_]*)")
                    .ok();
            if let Some(ref pattern) = id_pattern {
                if let Some(caps) = pattern.captures(original) {
                    name = caps.get(1).map(|m| m.as_str().to_string());
                }
            }
        }

        // Extract modifiers
        if input.contains("async") || input.contains("asynchronous") {
            modifiers.push("async".to_string());
        }
        if input.contains("public") {
            modifiers.push("public".to_string());
        }
        if input.contains("private") {
            modifiers.push("private".to_string());
        }
        if input.contains("static") {
            modifiers.push("static".to_string());
        }
        if input.contains("exported") || input.contains("export") {
            modifiers.push("export".to_string());
        }

        if target_type != TargetType::Unknown || name.is_some() {
            Some(CommandTarget {
                target_type,
                name,
                location: self.extract_location(input),
                modifiers,
            })
        } else {
            None
        }
    }

    /// Extract location from input
    fn extract_location(&self, input: &str) -> Option<TargetLocation> {
        // Line number pattern
        let line_pattern = Regex::new(r"(?i)line\s+(\d+)").ok()?;
        if let Some(caps) = line_pattern.captures(input) {
            return Some(TargetLocation {
                location_type: LocationType::LineNumber,
                value: caps.get(1)?.as_str().to_string(),
            });
        }

        // File pattern
        let file_pattern = Regex::new(r"(?i)(?:file|in)\s+([a-zA-Z0-9_./\\-]+\.\w+)").ok()?;
        if let Some(caps) = file_pattern.captures(input) {
            return Some(TargetLocation {
                location_type: LocationType::FileName,
                value: caps.get(1)?.as_str().to_string(),
            });
        }

        // Relative position
        if input.contains("above") || input.contains("before") {
            return Some(TargetLocation {
                location_type: LocationType::Relative,
                value: "above".to_string(),
            });
        }
        if input.contains("below") || input.contains("after") {
            return Some(TargetLocation {
                location_type: LocationType::Relative,
                value: "below".to_string(),
            });
        }

        None
    }

    /// Extract parameters from the command (uses normalized input only)
    fn extract_parameters(
        &self,
        input: &str,
        action: &VoiceAction,
        target: &Option<CommandTarget>,
    ) -> CommandParameters {
        self.extract_parameters_with_original(input, input, action, target)
    }

    /// Extract parameters, using original input to preserve identifier casing
    fn extract_parameters_with_original(
        &self,
        input: &str,
        original: &str,
        action: &VoiceAction,
        target: &Option<CommandTarget>,
    ) -> CommandParameters {
        let mut params = CommandParameters::default();

        // Extract name from target
        if let Some(ref t) = target {
            params.name = t.name.clone();
        }

        // Extract rename target from ORIGINAL input to preserve casing
        let rename_pattern = Regex::new(r"(?i)(?:to|into)\s+([a-zA-Z_][a-zA-Z0-9_]*)").ok();
        if let Some(ref pattern) = rename_pattern {
            if let Some(caps) = pattern.captures(original) {
                params.new_name = caps.get(1).map(|m| m.as_str().to_string());
            }
        }

        // Extract return type
        let return_pattern =
            Regex::new(r"(?i)(?:returning?|returns?)\s+(?:a\s+)?([a-zA-Z_][a-zA-Z0-9_<>,\s]*)")
                .ok();
        if let Some(ref pattern) = return_pattern {
            if let Some(caps) = pattern.captures(input) {
                let raw_type = caps.get(1).map(|m| m.as_str().trim().to_string());
                params.return_type = raw_type.and_then(|t| self.normalize_type(&t));
            }
        }

        // Extract function parameters
        let params_pattern = Regex::new(
            r"(?i)(?:with\s+parameters?|that\s+takes?|taking)\s+(.+?)(?:\s+(?:returning|and\s+returns?)|\s*$)"
        ).ok();
        if let Some(ref pattern) = params_pattern {
            if let Some(caps) = pattern.captures(input) {
                if let Some(params_str) = caps.get(1) {
                    params.parameters = self.parse_parameter_list(params_str.as_str());
                }
            }
        }

        // Extract language
        let lang_pattern =
            Regex::new(r"(?i)(?:in|using)\s+(typescript|javascript|python|rust|go|java)").ok();
        if let Some(ref pattern) = lang_pattern {
            if let Some(caps) = pattern.captures(input) {
                params.language = caps.get(1).map(|m| m.as_str().to_string());
            }
        }

        // Extract commit message
        if matches!(action, VoiceAction::Commit) {
            let msg_pattern =
                Regex::new(r#"(?i)(?:with\s+message|message)\s+["\']?(.+?)["\']?$"#).ok();
            if let Some(ref pattern) = msg_pattern {
                if let Some(caps) = pattern.captures(input) {
                    params.message = caps.get(1).map(|m| m.as_str().to_string());
                }
            }
        }

        // Extract flags
        params.with_tests = input.contains("with test") || input.contains("and test");
        params.with_docs = input.contains("with doc") || input.contains("documented");
        params.async_flag = input.contains("async") || input.contains("asynchronous");
        params.public_flag = input.contains("public") || input.contains("exported");
        params.static_flag = input.contains("static");

        params
    }

    /// Parse a parameter list like "a string and a number" or "name: string, age: number"
    fn parse_parameter_list(&self, input: &str) -> Vec<ParameterDef> {
        let mut params = Vec::new();

        // Try typed format first: "name: type, name2: type2"
        let typed_pattern =
            Regex::new(r"([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*([a-zA-Z_][a-zA-Z0-9_<>[\]]*)").ok();
        if let Some(ref pattern) = typed_pattern {
            for caps in pattern.captures_iter(input) {
                if let (Some(name), Some(type_str)) = (caps.get(1), caps.get(2)) {
                    params.push(ParameterDef {
                        name: name.as_str().to_string(),
                        param_type: self.normalize_type(type_str.as_str()),
                        default_value: None,
                        optional: input.contains("optional"),
                    });
                }
            }
        }

        if !params.is_empty() {
            return params;
        }

        // Try natural language format: "a string called name and a number called age"
        let natural_pattern = Regex::new(
            r"(?i)(?:a|an)\s+([a-zA-Z]+)(?:\s+(?:called|named)\s+([a-zA-Z_][a-zA-Z0-9_]*))?",
        )
        .ok();
        if let Some(ref pattern) = natural_pattern {
            for caps in pattern.captures_iter(input) {
                if let Some(type_str) = caps.get(1) {
                    let name = caps
                        .get(2)
                        .map(|m| m.as_str().to_string())
                        .unwrap_or_else(|| format!("param{}", params.len() + 1));

                    params.push(ParameterDef {
                        name,
                        param_type: self.normalize_type(type_str.as_str()),
                        default_value: None,
                        optional: false,
                    });
                }
            }
        }

        params
    }

    /// Normalize a type name from natural language
    fn normalize_type(&self, type_str: &str) -> Option<String> {
        let lower = type_str.trim().to_lowercase();

        // Check type mappings first
        if let Some(mapped) = self.type_mappings.get(&lower) {
            return Some(mapped.clone());
        }

        // Return as-is if it looks like a valid type
        if type_str
            .chars()
            .next()
            .map(|c| c.is_alphabetic())
            .unwrap_or(false)
        {
            return Some(type_str.to_string());
        }

        None
    }

    /// Calculate confidence score for the parsed command
    fn calculate_confidence(
        &self,
        input: &str,
        action: &VoiceAction,
        target: &Option<CommandTarget>,
    ) -> f32 {
        let mut confidence: f32 = 0.0;

        // Action confidence
        if *action != VoiceAction::Unknown {
            confidence += 0.4;
        }

        // Target confidence
        if let Some(ref t) = target {
            if t.target_type != TargetType::Unknown {
                confidence += 0.2;
            }
            if t.name.is_some() {
                confidence += 0.2;
            }
        }

        // Input length/clarity
        let word_count = input.split_whitespace().count();
        if word_count >= 3 && word_count <= 20 {
            confidence += 0.1;
        }

        // Has specific patterns
        if input.contains("named") || input.contains("called") {
            confidence += 0.1;
        }

        confidence.min(1.0_f32)
    }

    /// Generate confirmation prompt for the command
    pub fn generate_confirmation(&self, command: &VoiceCommand) -> String {
        let action_str = format!("{:?}", command.action).to_lowercase();

        let target_str = command
            .target
            .as_ref()
            .map(|t| {
                let type_str = format!("{:?}", t.target_type).to_lowercase();
                if let Some(ref name) = t.name {
                    format!("{} '{}'", type_str, name)
                } else {
                    type_str
                }
            })
            .unwrap_or_else(|| "code".to_string());

        let params_str = if let Some(ref ret) = command.parameters.return_type {
            format!(" returning {}", ret)
        } else {
            String::new()
        };

        let capitalized_action = if action_str.is_empty() {
            "Unknown".to_string()
        } else {
            let mut chars = action_str.chars();
            let first = chars.next().unwrap_or_default();
            first.to_uppercase().to_string() + chars.as_str()
        };

        format!(
            "{} {}{}. Correct?",
            capitalized_action,
            target_str,
            params_str
        )
    }
}

impl Default for VoiceGrammarParser {
    fn default() -> Self {
        Self::new()
    }
}

// Tauri commands

pub fn parse_voice_command(input: String) -> Result<VoiceCommand, String> {
    let parser = VoiceGrammarParser::new();
    Ok(parser.parse(&input))
}

#[tauri::command]
pub fn get_voice_command_confirmation(command: VoiceCommand) -> String {
    let parser = VoiceGrammarParser::new();
    parser.generate_confirmation(&command)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_create_function() {
        let parser = VoiceGrammarParser::new();
        let cmd = parser.parse(
            "create a function called validateEmail that takes a string and returns a boolean",
        );

        assert_eq!(cmd.action, VoiceAction::Create);
        assert!(cmd.target.is_some());

        let target = cmd.target.unwrap();
        assert_eq!(target.target_type, TargetType::Function);
        assert_eq!(target.name, Some("validateEmail".to_string()));

        assert_eq!(cmd.parameters.return_type, Some("boolean".to_string()));
    }

    #[test]
    fn test_parse_goto() {
        let parser = VoiceGrammarParser::new();
        let cmd = parser.parse("go to line 42");

        assert_eq!(cmd.action, VoiceAction::GoTo);
        assert!(cmd.target.is_some());

        let target = cmd.target.unwrap();
        assert_eq!(target.target_type, TargetType::Line);
    }

    #[test]
    fn test_parse_rename() {
        let parser = VoiceGrammarParser::new();
        let cmd = parser.parse("rename variable oldName to newName");

        assert_eq!(cmd.action, VoiceAction::Rename);
        assert_eq!(cmd.parameters.new_name, Some("newName".to_string()));
    }

    #[test]
    fn test_parse_commit() {
        let parser = VoiceGrammarParser::new();
        let cmd = parser.parse("commit with message 'fix authentication bug'");

        assert_eq!(cmd.action, VoiceAction::Commit);
        assert!(cmd.parameters.message.is_some());
    }

    #[test]
    fn test_voice_action_from_verb() {
        assert_eq!(VoiceAction::from_verb("create"), VoiceAction::Create);
        assert_eq!(VoiceAction::from_verb("make"), VoiceAction::Create);
        assert_eq!(VoiceAction::from_verb("delete"), VoiceAction::Delete);
        assert_eq!(VoiceAction::from_verb("refactor"), VoiceAction::Refactor);
    }

    #[test]
    fn test_confirmation_generation() {
        let parser = VoiceGrammarParser::new();
        let cmd = parser.parse("create function validateEmail");
        let confirmation = parser.generate_confirmation(&cmd);

        assert!(confirmation.contains("Create"));
        assert!(confirmation.contains("Correct?"));
    }
}
