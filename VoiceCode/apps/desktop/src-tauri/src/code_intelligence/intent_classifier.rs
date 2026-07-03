#![allow(dead_code, unused_variables, unused_imports)]
// Phase 4.2: Intent Classifier
// Classifies voice commands into coding actions

use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use regex::Regex;

/// Coding intent types
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum CodingIntent {
    /// Create new code (function, class, file)
    Create,
    /// Modify existing code
    Modify,
    /// Delete code
    Delete,
    /// Explain code
    Explain,
    /// Fix a bug
    Fix,
    /// Refactor code
    Refactor,
    /// Add tests
    Test,
    /// Add documentation
    Document,
    /// Complete code at cursor
    Complete,
    /// Navigate to location
    Navigate,
    /// Search for code
    Search,
    /// Run command
    Run,
    /// Git operation
    Git,
    /// Unknown intent
    Unknown,
}

/// Classified intent with details
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClassifiedIntent {
    pub intent: CodingIntent,
    pub confidence: f32,
    pub target: Option<String>,
    pub action: Option<String>,
    pub parameters: HashMap<String, String>,
    pub original_text: String,
}

/// Code entity types
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum CodeEntity {
    Function,
    Class,
    Method,
    Variable,
    Import,
    File,
    Module,
    Test,
    Comment,
    Type,
    Interface,
    Enum,
    Struct,
    Line,
    Block,
    Parameter,
    Return,
}

/// Extracted entities from command
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtractedEntities {
    pub entity_type: Option<CodeEntity>,
    pub name: Option<String>,
    pub location: Option<String>,
    pub language: Option<String>,
    pub modifiers: Vec<String>,
}

/// Intent classifier for voice commands
pub struct IntentClassifier {
    intent_patterns: HashMap<CodingIntent, Vec<Regex>>,
    entity_patterns: HashMap<CodeEntity, Vec<Regex>>,
    action_verbs: HashMap<String, CodingIntent>,
    code_keywords: Vec<String>,
}

impl IntentClassifier {
    pub fn new() -> Self {
        let mut classifier = Self {
            intent_patterns: HashMap::new(),
            entity_patterns: HashMap::new(),
            action_verbs: HashMap::new(),
            code_keywords: Vec::new(),
        };

        classifier.initialize_patterns();
        classifier
    }

    fn initialize_patterns(&mut self) {
        // Create intent patterns
        self.intent_patterns.insert(CodingIntent::Create, vec![
            Regex::new(r"(?i)^create\s").expect("valid regex: create intent"),
            Regex::new(r"(?i)^add\s").expect("valid regex: add intent"),
            Regex::new(r"(?i)^make\s").expect("valid regex: make intent"),
            Regex::new(r"(?i)^new\s").expect("valid regex: new intent"),
            Regex::new(r"(?i)^generate\s").expect("valid regex: generate intent"),
            Regex::new(r"(?i)^write\s").expect("valid regex: write intent"),
            Regex::new(r"(?i)^implement\s").expect("valid regex: implement intent"),
        ]);

        self.intent_patterns.insert(CodingIntent::Modify, vec![
            Regex::new(r"(?i)^modify\s").expect("valid regex: modify intent"),
            Regex::new(r"(?i)^change\s").expect("valid regex: change intent"),
            Regex::new(r"(?i)^update\s").expect("valid regex: update intent"),
            Regex::new(r"(?i)^edit\s").expect("valid regex: edit intent"),
            Regex::new(r"(?i)^replace\s").expect("valid regex: replace intent"),
            Regex::new(r"(?i)^rename\s").expect("valid regex: rename intent"),
            Regex::new(r"(?i)^move\s").expect("valid regex: move intent"),
        ]);

        self.intent_patterns.insert(CodingIntent::Delete, vec![
            Regex::new(r"(?i)^delete\s").expect("valid regex: delete intent"),
            Regex::new(r"(?i)^remove\s").expect("valid regex: remove intent"),
            Regex::new(r"(?i)^drop\s").expect("valid regex: drop intent"),
            Regex::new(r"(?i)^clear\s").expect("valid regex: clear intent"),
        ]);

        self.intent_patterns.insert(CodingIntent::Explain, vec![
            Regex::new(r"(?i)^explain\s").expect("valid regex: explain intent"),
            Regex::new(r"(?i)^what\s+(is|does|are)").expect("valid regex: what-is intent"),
            Regex::new(r"(?i)^how\s+does").expect("valid regex: how-does intent"),
            Regex::new(r"(?i)^describe\s").expect("valid regex: describe intent"),
            Regex::new(r"(?i)^tell\s+me\s+about").expect("valid regex: tell-me intent"),
        ]);

        self.intent_patterns.insert(CodingIntent::Fix, vec![
            Regex::new(r"(?i)^fix\s").expect("valid regex: fix intent"),
            Regex::new(r"(?i)^debug\s").expect("valid regex: debug intent"),
            Regex::new(r"(?i)^repair\s").expect("valid regex: repair intent"),
            Regex::new(r"(?i)^solve\s").expect("valid regex: solve intent"),
            Regex::new(r"(?i)^resolve\s").expect("valid regex: resolve intent"),
            Regex::new(r"(?i)there('s| is)\s+a\s+(bug|error|issue)").expect("valid regex: bug-report intent"),
        ]);

        self.intent_patterns.insert(CodingIntent::Refactor, vec![
            Regex::new(r"(?i)^refactor\s").expect("valid regex: refactor intent"),
            Regex::new(r"(?i)^clean\s+up").expect("valid regex: clean-up intent"),
            Regex::new(r"(?i)^optimize\s").expect("valid regex: optimize intent"),
            Regex::new(r"(?i)^improve\s").expect("valid regex: improve intent"),
            Regex::new(r"(?i)^simplify\s").expect("valid regex: simplify intent"),
            Regex::new(r"(?i)^extract\s").expect("valid regex: extract intent"),
        ]);

        self.intent_patterns.insert(CodingIntent::Test, vec![
            Regex::new(r"(?i)^test\s").expect("valid regex: test intent"),
            Regex::new(r"(?i)^add\s+test").expect("valid regex: add-test intent"),
            Regex::new(r"(?i)^write\s+test").expect("valid regex: write-test intent"),
            Regex::new(r"(?i)^create\s+test").expect("valid regex: create-test intent"),
            Regex::new(r"(?i)^generate\s+test").expect("valid regex: generate-test intent"),
        ]);

        self.intent_patterns.insert(CodingIntent::Document, vec![
            Regex::new(r"(?i)^document\s").expect("valid regex: document intent"),
            Regex::new(r"(?i)^add\s+(comment|doc|documentation)").expect("valid regex: add-doc intent"),
            Regex::new(r"(?i)^write\s+(comment|doc|documentation)").expect("valid regex: write-doc intent"),
        ]);

        self.intent_patterns.insert(CodingIntent::Complete, vec![
            Regex::new(r"(?i)^complete\s").expect("valid regex: complete intent"),
            Regex::new(r"(?i)^finish\s").expect("valid regex: finish intent"),
            Regex::new(r"(?i)^continue\s").expect("valid regex: continue intent"),
            Regex::new(r"(?i)^autocomplete").expect("valid regex: autocomplete intent"),
        ]);

        self.intent_patterns.insert(CodingIntent::Navigate, vec![
            Regex::new(r"(?i)^go\s+to").expect("valid regex: go-to intent"),
            Regex::new(r"(?i)^navigate\s+to").expect("valid regex: navigate-to intent"),
            Regex::new(r"(?i)^jump\s+to").expect("valid regex: jump-to intent"),
            Regex::new(r"(?i)^open\s").expect("valid regex: open intent"),
            Regex::new(r"(?i)^show\s+me").expect("valid regex: show-me intent"),
        ]);

        self.intent_patterns.insert(CodingIntent::Search, vec![
            Regex::new(r"(?i)^search\s").expect("valid regex: search intent"),
            Regex::new(r"(?i)^find\s").expect("valid regex: find intent"),
            Regex::new(r"(?i)^look\s+for").expect("valid regex: look-for intent"),
            Regex::new(r"(?i)^where\s+(is|are)").expect("valid regex: where-is intent"),
        ]);

        self.intent_patterns.insert(CodingIntent::Run, vec![
            Regex::new(r"(?i)^run\s").expect("valid regex: run intent"),
            Regex::new(r"(?i)^execute\s").expect("valid regex: execute intent"),
            Regex::new(r"(?i)^build\s").expect("valid regex: build intent"),
            Regex::new(r"(?i)^compile\s").expect("valid regex: compile intent"),
            Regex::new(r"(?i)^start\s").expect("valid regex: start intent"),
        ]);

        self.intent_patterns.insert(CodingIntent::Git, vec![
            Regex::new(r"(?i)^git\s").expect("valid regex: git intent"),
            Regex::new(r"(?i)^commit\s").expect("valid regex: commit intent"),
            Regex::new(r"(?i)^push\s").expect("valid regex: push intent"),
            Regex::new(r"(?i)^pull\s").expect("valid regex: pull intent"),
            Regex::new(r"(?i)^merge\s").expect("valid regex: merge intent"),
            Regex::new(r"(?i)^checkout\s").expect("valid regex: checkout intent"),
            Regex::new(r"(?i)^branch\s").expect("valid regex: branch intent"),
        ]);

        // Entity patterns
        self.entity_patterns.insert(CodeEntity::Function, vec![
            Regex::new(r"(?i)function\s+(\w+)").expect("valid regex: function entity"),
            Regex::new(r"(?i)method\s+(\w+)").expect("valid regex: method entity"),
            Regex::new(r"(?i)fn\s+(\w+)").expect("valid regex: fn entity"),
            Regex::new(r"(?i)def\s+(\w+)").expect("valid regex: def entity"),
        ]);

        self.entity_patterns.insert(CodeEntity::Class, vec![
            Regex::new(r"(?i)class\s+(\w+)").expect("valid regex: class entity"),
            Regex::new(r"(?i)struct\s+(\w+)").expect("valid regex: struct entity"),
        ]);

        self.entity_patterns.insert(CodeEntity::Variable, vec![
            Regex::new(r"(?i)variable\s+(\w+)").expect("valid regex: variable entity"),
            Regex::new(r"(?i)const(ant)?\s+(\w+)").expect("valid regex: const entity"),
            Regex::new(r"(?i)let\s+(\w+)").expect("valid regex: let entity"),
            Regex::new(r"(?i)var\s+(\w+)").expect("valid regex: var entity"),
        ]);

        self.entity_patterns.insert(CodeEntity::File, vec![
            Regex::new(r"(?i)file\s+(\S+)").expect("valid regex: file entity"),
            Regex::new(r"(?i)in\s+(\S+\.\w+)").expect("valid regex: in-file entity"),
        ]);

        self.entity_patterns.insert(CodeEntity::Interface, vec![
            Regex::new(r"(?i)interface\s+(\w+)").expect("valid regex: interface entity"),
            Regex::new(r"(?i)trait\s+(\w+)").expect("valid regex: trait entity"),
        ]);

        self.entity_patterns.insert(CodeEntity::Type, vec![
            Regex::new(r"(?i)type\s+(\w+)").expect("valid regex: type entity"),
            Regex::new(r"(?i)typedef\s+(\w+)").expect("valid regex: typedef entity"),
        ]);

        // Action verbs mapping
        self.action_verbs.insert("create".to_string(), CodingIntent::Create);
        self.action_verbs.insert("add".to_string(), CodingIntent::Create);
        self.action_verbs.insert("make".to_string(), CodingIntent::Create);
        self.action_verbs.insert("new".to_string(), CodingIntent::Create);
        self.action_verbs.insert("generate".to_string(), CodingIntent::Create);
        self.action_verbs.insert("write".to_string(), CodingIntent::Create);
        self.action_verbs.insert("implement".to_string(), CodingIntent::Create);

        self.action_verbs.insert("modify".to_string(), CodingIntent::Modify);
        self.action_verbs.insert("change".to_string(), CodingIntent::Modify);
        self.action_verbs.insert("update".to_string(), CodingIntent::Modify);
        self.action_verbs.insert("edit".to_string(), CodingIntent::Modify);
        self.action_verbs.insert("replace".to_string(), CodingIntent::Modify);
        self.action_verbs.insert("rename".to_string(), CodingIntent::Modify);

        self.action_verbs.insert("delete".to_string(), CodingIntent::Delete);
        self.action_verbs.insert("remove".to_string(), CodingIntent::Delete);
        self.action_verbs.insert("drop".to_string(), CodingIntent::Delete);

        self.action_verbs.insert("explain".to_string(), CodingIntent::Explain);
        self.action_verbs.insert("describe".to_string(), CodingIntent::Explain);

        self.action_verbs.insert("fix".to_string(), CodingIntent::Fix);
        self.action_verbs.insert("debug".to_string(), CodingIntent::Fix);
        self.action_verbs.insert("repair".to_string(), CodingIntent::Fix);

        self.action_verbs.insert("refactor".to_string(), CodingIntent::Refactor);
        self.action_verbs.insert("optimize".to_string(), CodingIntent::Refactor);
        self.action_verbs.insert("improve".to_string(), CodingIntent::Refactor);
        self.action_verbs.insert("simplify".to_string(), CodingIntent::Refactor);

        self.action_verbs.insert("test".to_string(), CodingIntent::Test);
        self.action_verbs.insert("document".to_string(), CodingIntent::Document);
        self.action_verbs.insert("complete".to_string(), CodingIntent::Complete);

        // Code keywords for context detection
        self.code_keywords = vec![
            "function".to_string(),
            "class".to_string(),
            "method".to_string(),
            "variable".to_string(),
            "const".to_string(),
            "import".to_string(),
            "export".to_string(),
            "async".to_string(),
            "await".to_string(),
            "return".to_string(),
            "if".to_string(),
            "else".to_string(),
            "for".to_string(),
            "while".to_string(),
            "loop".to_string(),
            "match".to_string(),
            "switch".to_string(),
            "try".to_string(),
            "catch".to_string(),
            "throw".to_string(),
            "interface".to_string(),
            "type".to_string(),
            "struct".to_string(),
            "enum".to_string(),
            "trait".to_string(),
            "impl".to_string(),
        ];
    }

    /// Classify a voice command
    pub fn classify(&self, text: &str) -> ClassifiedIntent {
        let normalized = text.trim().to_lowercase();

        // Try pattern matching first
        for (intent, patterns) in &self.intent_patterns {
            for pattern in patterns {
                if pattern.is_match(&normalized) {
                    let entities = self.extract_entities(&normalized);
                    let parameters = self.extract_parameters(&normalized, intent);

                    return ClassifiedIntent {
                        intent: intent.clone(),
                        confidence: 0.9,
                        target: entities.name.clone(),
                        action: Some(self.extract_action(&normalized)),
                        parameters,
                        original_text: text.to_string(),
                    };
                }
            }
        }

        // Try first word as action verb
        let first_word = normalized.split_whitespace().next().unwrap_or("");
        if let Some(intent) = self.action_verbs.get(first_word) {
            let entities = self.extract_entities(&normalized);
            let parameters = self.extract_parameters(&normalized, intent);

            return ClassifiedIntent {
                intent: intent.clone(),
                confidence: 0.7,
                target: entities.name,
                action: Some(first_word.to_string()),
                parameters,
                original_text: text.to_string(),
            };
        }

        // Check for code keywords indicating code-related command
        let has_code_keywords = self.code_keywords.iter()
            .any(|kw| normalized.contains(kw));

        if has_code_keywords {
            // Likely a create/modify intent
            let entities = self.extract_entities(&normalized);
            return ClassifiedIntent {
                intent: CodingIntent::Create,
                confidence: 0.5,
                target: entities.name,
                action: None,
                parameters: HashMap::new(),
                original_text: text.to_string(),
            };
        }

        // Unknown intent
        ClassifiedIntent {
            intent: CodingIntent::Unknown,
            confidence: 0.3,
            target: None,
            action: None,
            parameters: HashMap::new(),
            original_text: text.to_string(),
        }
    }

    /// Extract entities from command
    pub fn extract_entities(&self, text: &str) -> ExtractedEntities {
        let mut entities = ExtractedEntities {
            entity_type: None,
            name: None,
            location: None,
            language: None,
            modifiers: Vec::new(),
        };

        // Try to match entity patterns
        for (entity_type, patterns) in &self.entity_patterns {
            for pattern in patterns {
                if let Some(captures) = pattern.captures(text) {
                    entities.entity_type = Some(entity_type.clone());
                    if let Some(name) = captures.get(1) {
                        entities.name = Some(name.as_str().to_string());
                    }
                    break;
                }
            }
            if entities.entity_type.is_some() {
                break;
            }
        }

        // Extract language if mentioned
        let language_patterns = [
            (r"(?i)\bin\s+(typescript|ts)\b", "typescript"),
            (r"(?i)\bin\s+(javascript|js)\b", "javascript"),
            (r"(?i)\bin\s+(python|py)\b", "python"),
            (r"(?i)\bin\s+(rust|rs)\b", "rust"),
            (r"(?i)\bin\s+(go|golang)\b", "go"),
            (r"(?i)\bin\s+(java)\b", "java"),
            (r"(?i)\bin\s+(c\+\+|cpp)\b", "cpp"),
            (r"(?i)\bin\s+(c#|csharp)\b", "csharp"),
        ];

        for (pattern, lang) in &language_patterns {
            if let Ok(re) = Regex::new(pattern) {
                if re.is_match(text) {
                    entities.language = Some(lang.to_string());
                    break;
                }
            }
        }

        // Extract modifiers
        let modifiers = [
            "async", "static", "public", "private", "protected",
            "const", "readonly", "abstract", "virtual", "override",
        ];

        for modifier in &modifiers {
            if text.contains(modifier) {
                entities.modifiers.push(modifier.to_string());
            }
        }

        // Extract location
        if let Ok(re) = Regex::new(r"(?i)(?:in|at|on)\s+line\s+(\d+)") {
            if let Some(captures) = re.captures(text) {
                if let Some(line) = captures.get(1) {
                    entities.location = Some(format!("line:{}", line.as_str()));
                }
            }
        }

        if let Ok(re) = Regex::new(r"(?i)(?:in|at)\s+(\S+\.\w+)") {
            if let Some(captures) = re.captures(text) {
                if let Some(file) = captures.get(1) {
                    entities.location = Some(format!("file:{}", file.as_str()));
                }
            }
        }

        entities
    }

    /// Extract action from command
    fn extract_action(&self, text: &str) -> String {
        text.split_whitespace()
            .next()
            .unwrap_or("")
            .to_string()
    }

    /// Extract parameters based on intent
    fn extract_parameters(&self, text: &str, intent: &CodingIntent) -> HashMap<String, String> {
        let mut params = HashMap::new();

        match intent {
            CodingIntent::Create | CodingIntent::Modify => {
                // Extract "that does X" or "which does X"
                if let Ok(re) = Regex::new(r"(?i)(?:that|which)\s+(.+)$") {
                    if let Some(captures) = re.captures(text) {
                        if let Some(desc) = captures.get(1) {
                            params.insert("description".to_string(), desc.as_str().to_string());
                        }
                    }
                }

                // Extract "with X"
                if let Ok(re) = Regex::new(r"(?i)with\s+(.+?)(?:\s+(?:that|which|and)|$)") {
                    if let Some(captures) = re.captures(text) {
                        if let Some(prop) = captures.get(1) {
                            params.insert("properties".to_string(), prop.as_str().to_string());
                        }
                    }
                }

                // Extract return type
                if let Ok(re) = Regex::new(r"(?i)(?:returns?|returning)\s+(\w+)") {
                    if let Some(captures) = re.captures(text) {
                        if let Some(ret) = captures.get(1) {
                            params.insert("return_type".to_string(), ret.as_str().to_string());
                        }
                    }
                }

                // Extract "to X" for rename operations (Rename is an alias for Modify)
                if let Ok(re) = Regex::new(r"(?i)\s+to\s+(\w+)") {
                    if let Some(captures) = re.captures(text) {
                        if let Some(new_name) = captures.get(1) {
                            params.insert("new_name".to_string(), new_name.as_str().to_string());
                        }
                    }
                }
            }
            CodingIntent::Fix => {
                // Extract error description
                if let Ok(re) = Regex::new(r"(?i)(?:error|bug|issue)(?:\s+with)?\s+(.+)$") {
                    if let Some(captures) = re.captures(text) {
                        if let Some(error) = captures.get(1) {
                            params.insert("error".to_string(), error.as_str().to_string());
                        }
                    }
                }
            }
            CodingIntent::Search => {
                // Extract search query
                if let Ok(re) = Regex::new(r"(?i)(?:search|find|look\s+for)\s+(.+)$") {
                    if let Some(captures) = re.captures(text) {
                        if let Some(query) = captures.get(1) {
                            params.insert("query".to_string(), query.as_str().to_string());
                        }
                    }
                }
            }
            _ => {}
        }

        params
    }

    /// Check if text is likely a coding command
    pub fn is_coding_command(&self, text: &str) -> bool {
        let normalized = text.trim().to_lowercase();

        // Check for intent patterns
        for patterns in self.intent_patterns.values() {
            for pattern in patterns {
                if pattern.is_match(&normalized) {
                    return true;
                }
            }
        }

        // Check for code keywords
        self.code_keywords.iter().any(|kw| normalized.contains(kw))
    }
}

/// Rename intent (additional)
impl CodingIntent {
    #[allow(non_upper_case_globals)]
    pub const Rename: CodingIntent = CodingIntent::Modify;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_classify_create() {
        let classifier = IntentClassifier::new();

        let result = classifier.classify("create a function called calculate_total");
        assert_eq!(result.intent, CodingIntent::Create);
        assert!(result.confidence > 0.5);
    }

    #[test]
    fn test_classify_fix() {
        let classifier = IntentClassifier::new();

        let result = classifier.classify("fix the bug in the login function");
        assert_eq!(result.intent, CodingIntent::Fix);
    }

    #[test]
    fn test_classify_explain() {
        let classifier = IntentClassifier::new();

        let result = classifier.classify("explain what this function does");
        assert_eq!(result.intent, CodingIntent::Explain);
    }

    #[test]
    fn test_extract_entities() {
        let classifier = IntentClassifier::new();

        let entities = classifier.extract_entities("create a function processOrder");
        assert_eq!(entities.entity_type, Some(CodeEntity::Function));
    }

    #[test]
    fn test_is_coding_command() {
        let classifier = IntentClassifier::new();

        assert!(classifier.is_coding_command("create a new function"));
        assert!(classifier.is_coding_command("add a class User"));
        assert!(!classifier.is_coding_command("what's the weather"));
    }
}
