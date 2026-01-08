// Validation Layer - Hallucination prevention and context verification
// Implements multi-stage validation to ensure accuracy and prevent errors

use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::path::{Path, PathBuf};
use std::sync::{Arc, RwLock};

/// Validation result with confidence score
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationResult {
    /// Whether the content passed validation
    pub valid: bool,
    /// Confidence score (0.0 - 1.0)
    pub confidence: f32,
    /// Issues found during validation
    pub issues: Vec<ValidationIssue>,
    /// Suggestions for improvement
    pub suggestions: Vec<String>,
    /// Evidence supporting the validation
    pub evidence: Vec<ValidationEvidence>,
}

impl ValidationResult {
    pub fn passed() -> Self {
        Self {
            valid: true,
            confidence: 1.0,
            issues: Vec::new(),
            suggestions: Vec::new(),
            evidence: Vec::new(),
        }
    }

    pub fn failed(issues: Vec<ValidationIssue>) -> Self {
        Self {
            valid: false,
            confidence: 0.0,
            issues,
            suggestions: Vec::new(),
            evidence: Vec::new(),
        }
    }

    pub fn with_confidence(mut self, confidence: f32) -> Self {
        self.confidence = confidence.clamp(0.0, 1.0);
        self
    }

    pub fn with_evidence(mut self, evidence: Vec<ValidationEvidence>) -> Self {
        self.evidence = evidence;
        self
    }
}

/// A validation issue
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationIssue {
    /// Issue severity
    pub severity: IssueSeverity,
    /// Issue category
    pub category: IssueCategory,
    /// Human-readable message
    pub message: String,
    /// Location in the content (if applicable)
    pub location: Option<ContentLocation>,
    /// Suggested fix
    pub fix: Option<String>,
}

/// Issue severity levels
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum IssueSeverity {
    /// Critical issue - must be fixed
    Critical,
    /// Error - should be fixed
    Error,
    /// Warning - consider fixing
    Warning,
    /// Info - informational only
    Info,
}

/// Issue categories
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum IssueCategory {
    /// File path doesn't exist
    InvalidPath,
    /// Symbol (function, class, etc.) not found
    UnknownSymbol,
    /// Syntax error in code
    SyntaxError,
    /// Type mismatch
    TypeError,
    /// API usage error
    ApiError,
    /// Import/module not found
    MissingImport,
    /// Deprecated usage
    Deprecated,
    /// Security concern
    Security,
    /// Logical error
    Logic,
    /// Hallucinated content
    Hallucination,
}

/// Location in content
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContentLocation {
    /// File path (if applicable)
    pub file: Option<PathBuf>,
    /// Line number
    pub line: Option<usize>,
    /// Column number
    pub column: Option<usize>,
    /// Span of characters
    pub span: Option<(usize, usize)>,
}

/// Evidence supporting validation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationEvidence {
    /// Type of evidence
    pub evidence_type: EvidenceType,
    /// Source of evidence
    pub source: String,
    /// Actual evidence data
    pub data: String,
    /// How strongly this supports the validation
    pub weight: f32,
}

/// Types of validation evidence
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EvidenceType {
    /// File exists on disk
    FileExists,
    /// Symbol found in AST
    SymbolResolved,
    /// API documentation reference
    ApiDocumentation,
    /// Test case verification
    TestVerification,
    /// Type system confirmation
    TypeCheck,
    /// Web search result
    WebSource,
    /// Previous successful execution
    ExecutionHistory,
    /// User confirmation
    UserConfirmed,
}

/// Content to be validated
#[derive(Debug, Clone)]
pub struct ValidationContext {
    /// The content being validated
    pub content: String,
    /// Type of content
    pub content_type: ContentType,
    /// Related files
    pub related_files: Vec<PathBuf>,
    /// Working directory
    pub working_dir: PathBuf,
    /// Language (if code)
    pub language: Option<String>,
    /// Additional context
    pub metadata: HashMap<String, String>,
}

/// Types of content that can be validated
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ContentType {
    /// Source code
    Code,
    /// Shell command
    Command,
    /// File path reference
    FilePath,
    /// API call or usage
    ApiUsage,
    /// Natural language explanation
    Explanation,
    /// Configuration
    Config,
    /// Documentation
    Documentation,
}

/// Validator trait for implementing validation strategies
pub trait Validator: Send + Sync {
    /// Validate the given context
    fn validate(&self, context: &ValidationContext) -> ValidationResult;

    /// Get the validator name
    fn name(&self) -> &str;

    /// Get applicable content types
    fn applicable_types(&self) -> Vec<ContentType>;
}

/// File reference validator - checks if referenced files exist
pub struct FileReferenceValidator {
    /// Project root directory
    project_root: PathBuf,
    /// Cache of known files
    file_cache: RwLock<HashSet<PathBuf>>,
    /// Maximum depth for recursive search
    max_depth: usize,
}

impl FileReferenceValidator {
    pub fn new(project_root: PathBuf) -> Self {
        Self {
            project_root,
            file_cache: RwLock::new(HashSet::new()),
            max_depth: 10,
        }
    }

    /// Refresh the file cache
    pub fn refresh_cache(&self) {
        let mut cache = self.file_cache.write().unwrap();
        cache.clear();

        if let Ok(entries) = walkdir::WalkDir::new(&self.project_root)
            .max_depth(self.max_depth)
            .into_iter()
            .filter_entry(|e| !Self::is_ignored(e.path()))
        {
            for entry in entries.flatten() {
                if entry.file_type().is_file() {
                    cache.insert(entry.path().to_path_buf());
                }
            }
        }
    }

    /// Check if a path should be ignored
    fn is_ignored(path: &Path) -> bool {
        let ignored = [
            "node_modules",
            ".git",
            "target",
            "dist",
            "build",
            "__pycache__",
        ];
        path.components().any(|c| {
            if let std::path::Component::Normal(s) = c {
                ignored.iter().any(|i| s == std::ffi::OsStr::new(*i))
            } else {
                false
            }
        })
    }

    /// Extract file references from code
    fn extract_file_references(&self, content: &str) -> Vec<String> {
        let mut refs = Vec::new();

        // Common import patterns
        let patterns = [
            r#"(?:from|import)\s+['"]([\w./\-]+)['"]"#, // Python/JS imports
            r#"require\(['"]([\w./\-]+)['"]\)"#,        // CommonJS
            r#"#include\s+[<"]([\w./\-]+)[>"]"#,        // C/C++
            r#"use\s+([\w:]+)"#,                        // Rust
            r#"mod\s+(\w+)"#,                           // Rust modules
            r#"(?:open|read_file|File::open)\(['"]([\w./\-]+)['"]\)"#, // File operations
            r#"(?:src|href|path)\s*=\s*['"]([\w./\-]+)['"]\s*"#, // HTML/config
        ];

        for pattern in patterns {
            if let Ok(regex) = regex::Regex::new(pattern) {
                for cap in regex.captures_iter(content) {
                    if let Some(m) = cap.get(1) {
                        refs.push(m.as_str().to_string());
                    }
                }
            }
        }

        refs
    }

    /// Resolve a reference to a full path
    fn resolve_reference(&self, reference: &str, working_dir: &Path) -> Option<PathBuf> {
        // Try relative to working directory
        let relative = working_dir.join(reference);
        if relative.exists() {
            return Some(relative);
        }

        // Try with common extensions
        let extensions = ["", ".rs", ".ts", ".tsx", ".js", ".jsx", ".py", ".go"];
        for ext in extensions {
            let with_ext = working_dir.join(format!("{}{}", reference, ext));
            if with_ext.exists() {
                return Some(with_ext);
            }
        }

        // Try index files
        let index_names = ["index", "mod", "__init__"];
        for name in index_names {
            let index_path = working_dir.join(reference).join(name);
            for ext in &extensions[1..] {
                let with_ext = index_path.with_extension(&ext[1..]);
                if with_ext.exists() {
                    return Some(with_ext);
                }
            }
        }

        // Try project root
        let from_root = self.project_root.join(reference);
        if from_root.exists() {
            return Some(from_root);
        }

        None
    }
}

impl Validator for FileReferenceValidator {
    fn validate(&self, context: &ValidationContext) -> ValidationResult {
        let references = self.extract_file_references(&context.content);

        if references.is_empty() {
            return ValidationResult::passed();
        }

        let mut issues = Vec::new();
        let mut evidence = Vec::new();

        for reference in references {
            match self.resolve_reference(&reference, &context.working_dir) {
                Some(path) => {
                    evidence.push(ValidationEvidence {
                        evidence_type: EvidenceType::FileExists,
                        source: "FileReferenceValidator".to_string(),
                        data: format!("File exists: {}", path.display()),
                        weight: 1.0,
                    });
                }
                None => {
                    issues.push(ValidationIssue {
                        severity: IssueSeverity::Error,
                        category: IssueCategory::InvalidPath,
                        message: format!("Referenced file not found: {}", reference),
                        location: None,
                        fix: Some(format!("Check if '{}' exists or fix the path", reference)),
                    });
                }
            }
        }

        if issues.is_empty() {
            ValidationResult::passed()
                .with_evidence(evidence)
                .with_confidence(1.0)
        } else {
            let confidence = 1.0 - (issues.len() as f32 / references.len() as f32);
            ValidationResult {
                valid: false,
                confidence,
                issues,
                suggestions: vec!["Verify file paths exist before referencing them".to_string()],
                evidence,
            }
        }
    }

    fn name(&self) -> &str {
        "FileReferenceValidator"
    }

    fn applicable_types(&self) -> Vec<ContentType> {
        vec![
            ContentType::Code,
            ContentType::Config,
            ContentType::FilePath,
        ]
    }
}

/// Symbol resolution validator - checks if symbols exist in the codebase
pub struct SymbolValidator {
    /// Symbol table cache
    symbols: RwLock<HashMap<String, SymbolInfo>>,
    /// Project root
    project_root: PathBuf,
}

/// Information about a resolved symbol
#[derive(Debug, Clone)]
pub struct SymbolInfo {
    pub name: String,
    pub kind: SymbolKind,
    pub file: PathBuf,
    pub line: usize,
    pub exported: bool,
}

/// Types of symbols
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SymbolKind {
    Function,
    Class,
    Struct,
    Interface,
    Type,
    Variable,
    Constant,
    Module,
    Enum,
    Trait,
}

impl SymbolValidator {
    pub fn new(project_root: PathBuf) -> Self {
        Self {
            symbols: RwLock::new(HashMap::new()),
            project_root,
        }
    }

    /// Register a symbol
    pub fn register_symbol(&self, symbol: SymbolInfo) {
        self.symbols
            .write()
            .unwrap()
            .insert(symbol.name.clone(), symbol);
    }

    /// Look up a symbol
    pub fn lookup(&self, name: &str) -> Option<SymbolInfo> {
        self.symbols.read().unwrap().get(name).cloned()
    }

    /// Extract symbol references from code
    fn extract_symbol_refs(&self, content: &str, language: Option<&str>) -> Vec<String> {
        let mut refs = Vec::new();

        // Function calls
        if let Ok(regex) = regex::Regex::new(r"\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(") {
            for cap in regex.captures_iter(content) {
                if let Some(m) = cap.get(1) {
                    refs.push(m.as_str().to_string());
                }
            }
        }

        // Type references (for typed languages)
        if language.map_or(false, |l| ["rust", "typescript", "go", "java"].contains(&l)) {
            if let Ok(regex) = regex::Regex::new(r":\s*([A-Z][a-zA-Z0-9_]*)") {
                for cap in regex.captures_iter(content) {
                    if let Some(m) = cap.get(1) {
                        refs.push(m.as_str().to_string());
                    }
                }
            }
        }

        // Filter out common keywords and builtins
        let builtins: HashSet<&str> = [
            "if",
            "else",
            "for",
            "while",
            "match",
            "return",
            "let",
            "const",
            "var",
            "fn",
            "function",
            "def",
            "class",
            "struct",
            "enum",
            "trait",
            "impl",
            "pub",
            "private",
            "public",
            "static",
            "async",
            "await",
            "try",
            "catch",
            "true",
            "false",
            "null",
            "None",
            "nil",
            "undefined",
            "String",
            "str",
            "int",
            "i32",
            "i64",
            "u32",
            "u64",
            "f32",
            "f64",
            "bool",
            "boolean",
            "number",
            "any",
            "void",
            "never",
            "Vec",
            "HashMap",
            "HashSet",
            "Option",
            "Result",
            "Box",
            "Arc",
            "Rc",
            "Array",
            "Object",
            "Map",
            "Set",
            "Promise",
            "Error",
            "print",
            "println",
            "console",
            "log",
            "debug",
            "error",
            "warn",
        ]
        .into_iter()
        .collect();

        refs.into_iter()
            .filter(|r| !builtins.contains(r.as_str()))
            .collect()
    }
}

impl Validator for SymbolValidator {
    fn validate(&self, context: &ValidationContext) -> ValidationResult {
        let refs = self.extract_symbol_refs(&context.content, context.language.as_deref());

        if refs.is_empty() {
            return ValidationResult::passed();
        }

        let mut issues = Vec::new();
        let mut evidence = Vec::new();

        for reference in &refs {
            if let Some(info) = self.lookup(reference) {
                evidence.push(ValidationEvidence {
                    evidence_type: EvidenceType::SymbolResolved,
                    source: "SymbolValidator".to_string(),
                    data: format!(
                        "Symbol '{}' found at {}:{}",
                        reference,
                        info.file.display(),
                        info.line
                    ),
                    weight: 1.0,
                });
            } else {
                // Not finding a symbol is only a warning since we may not have complete symbol table
                issues.push(ValidationIssue {
                    severity: IssueSeverity::Warning,
                    category: IssueCategory::UnknownSymbol,
                    message: format!("Symbol '{}' not found in symbol table", reference),
                    location: None,
                    fix: Some(format!(
                        "Verify '{}' is defined or imported correctly",
                        reference
                    )),
                });
            }
        }

        let error_count = issues
            .iter()
            .filter(|i| i.severity == IssueSeverity::Error)
            .count();

        if error_count == 0 {
            ValidationResult::passed()
                .with_evidence(evidence)
                .with_confidence(if issues.is_empty() { 1.0 } else { 0.8 })
        } else {
            ValidationResult {
                valid: false,
                confidence: 1.0 - (error_count as f32 / refs.len() as f32),
                issues,
                suggestions: vec!["Ensure all referenced symbols are properly defined".to_string()],
                evidence,
            }
        }
    }

    fn name(&self) -> &str {
        "SymbolValidator"
    }

    fn applicable_types(&self) -> Vec<ContentType> {
        vec![ContentType::Code]
    }
}

/// Syntax validator using tree-sitter
pub struct SyntaxValidator {
    /// Supported languages
    languages: HashMap<String, tree_sitter::Language>,
}

impl SyntaxValidator {
    pub fn new() -> Self {
        let mut languages = HashMap::new();

        // Register supported languages
        languages.insert("rust".to_string(), tree_sitter_rust::LANGUAGE.into());
        languages.insert(
            "javascript".to_string(),
            tree_sitter_javascript::LANGUAGE.into(),
        );
        languages.insert(
            "typescript".to_string(),
            tree_sitter_typescript::LANGUAGE_TYPESCRIPT.into(),
        );
        languages.insert(
            "tsx".to_string(),
            tree_sitter_typescript::LANGUAGE_TSX.into(),
        );
        languages.insert("python".to_string(), tree_sitter_python::LANGUAGE.into());
        languages.insert("go".to_string(), tree_sitter_go::LANGUAGE.into());
        languages.insert("json".to_string(), tree_sitter_json::LANGUAGE.into());

        Self { languages }
    }

    /// Parse and check syntax
    fn check_syntax(&self, code: &str, language: &str) -> Result<(), Vec<ValidationIssue>> {
        let lang = self.languages.get(language).ok_or_else(|| {
            vec![ValidationIssue {
                severity: IssueSeverity::Warning,
                category: IssueCategory::SyntaxError,
                message: format!("Unsupported language: {}", language),
                location: None,
                fix: None,
            }]
        })?;

        let mut parser = tree_sitter::Parser::new();
        parser.set_language(lang).map_err(|e| {
            vec![ValidationIssue {
                severity: IssueSeverity::Error,
                category: IssueCategory::SyntaxError,
                message: format!("Failed to set language: {}", e),
                location: None,
                fix: None,
            }]
        })?;

        let tree = parser.parse(code, None).ok_or_else(|| {
            vec![ValidationIssue {
                severity: IssueSeverity::Error,
                category: IssueCategory::SyntaxError,
                message: "Failed to parse code".to_string(),
                location: None,
                fix: None,
            }]
        })?;

        // Check for syntax errors
        let mut issues = Vec::new();
        Self::collect_errors(tree.root_node(), code, &mut issues);

        if issues.is_empty() {
            Ok(())
        } else {
            Err(issues)
        }
    }

    /// Recursively collect syntax errors from the parse tree
    fn collect_errors(node: tree_sitter::Node, code: &str, issues: &mut Vec<ValidationIssue>) {
        if node.is_error() || node.is_missing() {
            let start = node.start_position();
            let end = node.end_position();

            let context = code
                .lines()
                .nth(start.row)
                .map(|l| l.to_string())
                .unwrap_or_default();

            issues.push(ValidationIssue {
                severity: IssueSeverity::Error,
                category: IssueCategory::SyntaxError,
                message: format!(
                    "Syntax error at line {}, column {}: {}",
                    start.row + 1,
                    start.column + 1,
                    if node.is_missing() {
                        "missing token"
                    } else {
                        "unexpected token"
                    }
                ),
                location: Some(ContentLocation {
                    file: None,
                    line: Some(start.row + 1),
                    column: Some(start.column + 1),
                    span: Some((start.byte(), end.byte())),
                }),
                fix: Some(format!("Near: {}", context.trim())),
            });
        }

        // Recurse into children
        let mut cursor = node.walk();
        for child in node.children(&mut cursor) {
            Self::collect_errors(child, code, issues);
        }
    }
}

impl Default for SyntaxValidator {
    fn default() -> Self {
        Self::new()
    }
}

impl Validator for SyntaxValidator {
    fn validate(&self, context: &ValidationContext) -> ValidationResult {
        let language = match &context.language {
            Some(lang) => lang.as_str(),
            None => return ValidationResult::passed().with_confidence(0.5),
        };

        match self.check_syntax(&context.content, language) {
            Ok(()) => ValidationResult::passed().with_confidence(1.0),
            Err(issues) => ValidationResult {
                valid: false,
                confidence: 0.0,
                issues,
                suggestions: vec!["Fix syntax errors before proceeding".to_string()],
                evidence: Vec::new(),
            },
        }
    }

    fn name(&self) -> &str {
        "SyntaxValidator"
    }

    fn applicable_types(&self) -> Vec<ContentType> {
        vec![ContentType::Code]
    }
}

/// Command validator - checks shell commands for safety and correctness
pub struct CommandValidator {
    /// Known safe commands
    safe_commands: HashSet<String>,
    /// Known dangerous patterns
    dangerous_patterns: Vec<regex::Regex>,
}

impl CommandValidator {
    pub fn new() -> Self {
        let safe_commands: HashSet<String> = [
            "ls", "dir", "pwd", "cd", "cat", "head", "tail", "grep", "find", "echo", "printf",
            "date", "which", "whoami", "id", "git", "npm", "yarn", "pnpm", "cargo", "rustc",
            "python", "node", "make", "cmake", "go", "dotnet", "mvn", "gradle",
        ]
        .into_iter()
        .map(String::from)
        .collect();

        let dangerous_patterns = [
            r"rm\s+-rf\s+[/~]",
            r">\s*/dev/(sda|nvme|hd|disk)",
            r"dd\s+if=.+\s+of=/dev/",
            r"mkfs\.",
            r"chmod\s+-R\s+777\s+[/~]",
            r"\|\s*(bash|sh|zsh)\s*$",
            r"curl.*\|\s*(bash|sh)",
            r"wget.*\|\s*(bash|sh)",
            r"eval\s+\$",
            r"sudo\s+rm\s+-rf",
        ]
        .into_iter()
        .filter_map(|p| regex::Regex::new(p).ok())
        .collect();

        Self {
            safe_commands,
            dangerous_patterns,
        }
    }

    /// Check if a command is potentially dangerous
    fn is_dangerous(&self, command: &str) -> Option<&str> {
        for pattern in &self.dangerous_patterns {
            if pattern.is_match(command) {
                return Some("Matches dangerous command pattern");
            }
        }
        None
    }

    /// Extract the base command
    fn extract_base_command(&self, command: &str) -> Option<String> {
        let cmd = command.trim();

        // Handle sudo prefix
        let cmd = cmd.strip_prefix("sudo ").unwrap_or(cmd);

        // Get the first word (the command)
        cmd.split_whitespace().next().map(|s| s.to_string())
    }
}

impl Default for CommandValidator {
    fn default() -> Self {
        Self::new()
    }
}

impl Validator for CommandValidator {
    fn validate(&self, context: &ValidationContext) -> ValidationResult {
        let command = context.content.trim();

        // Check for dangerous patterns
        if let Some(reason) = self.is_dangerous(command) {
            return ValidationResult::failed(vec![ValidationIssue {
                severity: IssueSeverity::Critical,
                category: IssueCategory::Security,
                message: format!("Dangerous command detected: {}", reason),
                location: None,
                fix: Some("Review this command carefully before executing".to_string()),
            }]);
        }

        // Check if base command is known
        let issues = if let Some(base) = self.extract_base_command(command) {
            if self.safe_commands.contains(&base) {
                Vec::new()
            } else {
                vec![ValidationIssue {
                    severity: IssueSeverity::Info,
                    category: IssueCategory::Security,
                    message: format!("Command '{}' is not in safe list", base),
                    location: None,
                    fix: None,
                }]
            }
        } else {
            vec![ValidationIssue {
                severity: IssueSeverity::Warning,
                category: IssueCategory::SyntaxError,
                message: "Could not parse command".to_string(),
                location: None,
                fix: None,
            }]
        };

        if issues
            .iter()
            .any(|i| i.severity == IssueSeverity::Error || i.severity == IssueSeverity::Critical)
        {
            ValidationResult::failed(issues)
        } else {
            let confidence = if issues.is_empty() { 1.0 } else { 0.8 };
            ValidationResult {
                valid: true,
                confidence,
                issues,
                suggestions: Vec::new(),
                evidence: Vec::new(),
            }
        }
    }

    fn name(&self) -> &str {
        "CommandValidator"
    }

    fn applicable_types(&self) -> Vec<ContentType> {
        vec![ContentType::Command]
    }
}

/// Hallucination detector - identifies likely hallucinated content
pub struct HallucinationDetector {
    /// Known valid paths in the project
    known_paths: RwLock<HashSet<PathBuf>>,
    /// Known symbols
    known_symbols: RwLock<HashSet<String>>,
    /// Common hallucination patterns
    hallucination_patterns: Vec<regex::Regex>,
}

impl HallucinationDetector {
    pub fn new() -> Self {
        let hallucination_patterns = [
            // Made-up file extensions
            r"\.([a-z]{5,})\b",
            // Overly specific version numbers
            r"v\d{3,}\.\d{3,}\.\d{3,}",
            // Unlikely function names
            r"(doTheThingNow|makeMagicHappen|fixEverything)\s*\(",
            // Suspiciously long camelCase names
            r"[a-z]([A-Z][a-z]+){6,}",
        ]
        .into_iter()
        .filter_map(|p| regex::Regex::new(p).ok())
        .collect();

        Self {
            known_paths: RwLock::new(HashSet::new()),
            known_symbols: RwLock::new(HashSet::new()),
            hallucination_patterns,
        }
    }

    /// Register known paths from the project
    pub fn register_paths(&self, paths: Vec<PathBuf>) {
        let mut known = self.known_paths.write().unwrap();
        for path in paths {
            known.insert(path);
        }
    }

    /// Register known symbols
    pub fn register_symbols(&self, symbols: Vec<String>) {
        let mut known = self.known_symbols.write().unwrap();
        for symbol in symbols {
            known.insert(symbol);
        }
    }

    /// Check if a path reference is likely hallucinated
    fn is_hallucinated_path(&self, path: &str) -> bool {
        let known = self.known_paths.read().unwrap();

        // If we have known paths and this isn't one of them, might be hallucinated
        if !known.is_empty() {
            let path_buf = PathBuf::from(path);
            if !known.contains(&path_buf) {
                // Check if any known path contains this as a substring
                let is_partial_match = known.iter().any(|p| {
                    p.to_string_lossy().contains(path)
                        || path.contains(&p.to_string_lossy().to_string())
                });
                return !is_partial_match;
            }
        }

        false
    }

    /// Calculate hallucination score (0.0 = definitely real, 1.0 = definitely hallucinated)
    fn hallucination_score(&self, content: &str) -> f32 {
        let mut score = 0.0;
        let mut checks = 0;

        // Check for hallucination patterns
        for pattern in &self.hallucination_patterns {
            checks += 1;
            if pattern.is_match(content) {
                score += 0.3;
            }
        }

        // Check for referenced paths
        if let Ok(path_regex) = regex::Regex::new(r#"['"]([\w./\-]+\.\w+)['"]"#) {
            for cap in path_regex.captures_iter(content) {
                if let Some(m) = cap.get(1) {
                    checks += 1;
                    if self.is_hallucinated_path(m.as_str()) {
                        score += 0.4;
                    }
                }
            }
        }

        if checks > 0 {
            (score / checks as f32).clamp(0.0, 1.0)
        } else {
            0.0
        }
    }
}

impl Default for HallucinationDetector {
    fn default() -> Self {
        Self::new()
    }
}

impl Validator for HallucinationDetector {
    fn validate(&self, context: &ValidationContext) -> ValidationResult {
        let score = self.hallucination_score(&context.content);

        if score > 0.7 {
            ValidationResult::failed(vec![ValidationIssue {
                severity: IssueSeverity::Warning,
                category: IssueCategory::Hallucination,
                message: format!(
                    "Content may be hallucinated (confidence: {:.0}%)",
                    score * 100.0
                ),
                location: None,
                fix: Some("Verify all references against actual project files".to_string()),
            }])
        } else if score > 0.3 {
            ValidationResult {
                valid: true,
                confidence: 1.0 - score,
                issues: vec![ValidationIssue {
                    severity: IssueSeverity::Info,
                    category: IssueCategory::Hallucination,
                    message: "Some content could not be verified".to_string(),
                    location: None,
                    fix: None,
                }],
                suggestions: vec!["Consider verifying file paths and symbols".to_string()],
                evidence: Vec::new(),
            }
        } else {
            ValidationResult::passed().with_confidence(1.0 - score)
        }
    }

    fn name(&self) -> &str {
        "HallucinationDetector"
    }

    fn applicable_types(&self) -> Vec<ContentType> {
        vec![
            ContentType::Code,
            ContentType::Explanation,
            ContentType::Documentation,
        ]
    }
}

/// Composite validator that runs multiple validators
pub struct ValidationPipeline {
    validators: Vec<Box<dyn Validator>>,
    /// Minimum confidence threshold
    confidence_threshold: f32,
    /// Whether to fail on first error
    fail_fast: bool,
}

impl ValidationPipeline {
    pub fn new() -> Self {
        Self {
            validators: Vec::new(),
            confidence_threshold: 0.7,
            fail_fast: false,
        }
    }

    /// Create a default pipeline with all validators
    pub fn default_pipeline(project_root: PathBuf) -> Self {
        let mut pipeline = Self::new();

        pipeline.add_validator(Box::new(FileReferenceValidator::new(project_root.clone())));
        pipeline.add_validator(Box::new(SymbolValidator::new(project_root)));
        pipeline.add_validator(Box::new(SyntaxValidator::new()));
        pipeline.add_validator(Box::new(CommandValidator::new()));
        pipeline.add_validator(Box::new(HallucinationDetector::new()));

        pipeline
    }

    /// Add a validator to the pipeline
    pub fn add_validator(&mut self, validator: Box<dyn Validator>) {
        self.validators.push(validator);
    }

    /// Set confidence threshold
    pub fn with_threshold(mut self, threshold: f32) -> Self {
        self.confidence_threshold = threshold;
        self
    }

    /// Set fail-fast mode
    pub fn with_fail_fast(mut self, fail_fast: bool) -> Self {
        self.fail_fast = fail_fast;
        self
    }

    /// Run validation pipeline
    pub fn validate(&self, context: &ValidationContext) -> ValidationResult {
        let mut all_issues = Vec::new();
        let mut all_evidence = Vec::new();
        let mut confidences = Vec::new();

        for validator in &self.validators {
            // Check if validator applies to this content type
            if !validator.applicable_types().contains(&context.content_type) {
                continue;
            }

            let result = validator.validate(context);

            all_issues.extend(result.issues.clone());
            all_evidence.extend(result.evidence);
            confidences.push(result.confidence);

            // Fail fast if requested and validation failed
            if self.fail_fast && !result.valid {
                return ValidationResult {
                    valid: false,
                    confidence: result.confidence,
                    issues: all_issues,
                    suggestions: vec![format!("Validation failed at stage: {}", validator.name())],
                    evidence: all_evidence,
                };
            }
        }

        // Calculate aggregate confidence
        let avg_confidence = if confidences.is_empty() {
            1.0
        } else {
            confidences.iter().sum::<f32>() / confidences.len() as f32
        };

        // Check for critical/error issues
        let has_critical = all_issues
            .iter()
            .any(|i| i.severity == IssueSeverity::Critical || i.severity == IssueSeverity::Error);

        ValidationResult {
            valid: !has_critical && avg_confidence >= self.confidence_threshold,
            confidence: avg_confidence,
            issues: all_issues,
            suggestions: if has_critical {
                vec!["Fix critical issues before proceeding".to_string()]
            } else {
                Vec::new()
            },
            evidence: all_evidence,
        }
    }
}

impl Default for ValidationPipeline {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_file_reference_extraction() {
        let validator = FileReferenceValidator::new(PathBuf::from("."));

        let code = r#"
            import { foo } from './utils/helper';
            const config = require('../config.json');
            use crate::module::something;
        "#;

        let refs = validator.extract_file_references(code);
        assert!(refs.contains(&"./utils/helper".to_string()));
        assert!(refs.contains(&"../config.json".to_string()));
    }

    #[test]
    fn test_syntax_validation() {
        let validator = SyntaxValidator::new();

        // Valid Rust
        let context = ValidationContext {
            content: "fn main() { println!(\"Hello\"); }".to_string(),
            content_type: ContentType::Code,
            related_files: Vec::new(),
            working_dir: PathBuf::from("."),
            language: Some("rust".to_string()),
            metadata: HashMap::new(),
        };

        let result = validator.validate(&context);
        assert!(result.valid);

        // Invalid Rust
        let context = ValidationContext {
            content: "fn main( { println!(\"Hello\"); }".to_string(),
            content_type: ContentType::Code,
            related_files: Vec::new(),
            working_dir: PathBuf::from("."),
            language: Some("rust".to_string()),
            metadata: HashMap::new(),
        };

        let result = validator.validate(&context);
        assert!(!result.valid);
    }

    #[test]
    fn test_command_validation() {
        let validator = CommandValidator::new();

        // Safe command
        let context = ValidationContext {
            content: "ls -la".to_string(),
            content_type: ContentType::Command,
            related_files: Vec::new(),
            working_dir: PathBuf::from("."),
            language: None,
            metadata: HashMap::new(),
        };

        let result = validator.validate(&context);
        assert!(result.valid);

        // Dangerous command
        let context = ValidationContext {
            content: "rm -rf /".to_string(),
            content_type: ContentType::Command,
            related_files: Vec::new(),
            working_dir: PathBuf::from("."),
            language: None,
            metadata: HashMap::new(),
        };

        let result = validator.validate(&context);
        assert!(!result.valid);
    }

    #[test]
    fn test_hallucination_detection() {
        let detector = HallucinationDetector::new();
        detector.register_paths(vec![
            PathBuf::from("src/main.rs"),
            PathBuf::from("src/lib.rs"),
        ]);

        // Content with known paths
        let context = ValidationContext {
            content: r#"Open the file "src/main.rs" and edit it"#.to_string(),
            content_type: ContentType::Explanation,
            related_files: Vec::new(),
            working_dir: PathBuf::from("."),
            language: None,
            metadata: HashMap::new(),
        };

        let result = detector.validate(&context);
        assert!(result.confidence >= 0.7);
    }
}
