#![allow(dead_code, unused_variables, unused_imports)]
// Phase 1.1: TreeSitter AST Parser Integration
// Provides language-aware AST parsing with semantic extraction

use std::path::{Path, PathBuf};
use std::sync::Arc;
use serde::{Deserialize, Serialize};
use dashmap::DashMap;
use tree_sitter::{Parser, Tree, Node, Query};

/// Supported programming languages
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum Language {
    TypeScript,
    JavaScript,
    TSX,
    JSX,
    Python,
    Rust,
    Go,
    Java,
    C,
    Cpp,
    CSharp,
    Ruby,
    PHP,
    Swift,
    Kotlin,
    Scala,
    Html,
    Css,
    Scss,
    Json,
    Yaml,
    Toml,
    Markdown,
    Sql,
    Shell,
    Unknown,
}

impl Language {
    /// Detect language from file extension
    pub fn from_extension(ext: &str) -> Self {
        match ext.to_lowercase().as_str() {
            "ts" => Language::TypeScript,
            "tsx" => Language::TSX,
            "js" | "mjs" | "cjs" => Language::JavaScript,
            "jsx" => Language::JSX,
            "py" | "pyi" | "pyw" => Language::Python,
            "rs" => Language::Rust,
            "go" => Language::Go,
            "java" => Language::Java,
            "c" | "h" => Language::C,
            "cpp" | "cc" | "cxx" | "hpp" | "hxx" | "hh" => Language::Cpp,
            "cs" => Language::CSharp,
            "rb" | "rake" | "gemspec" => Language::Ruby,
            "php" => Language::PHP,
            "swift" => Language::Swift,
            "kt" | "kts" => Language::Kotlin,
            "scala" | "sc" => Language::Scala,
            "html" | "htm" => Language::Html,
            "css" => Language::Css,
            "scss" | "sass" => Language::Scss,
            "json" | "jsonc" => Language::Json,
            "yaml" | "yml" => Language::Yaml,
            "toml" => Language::Toml,
            "md" | "markdown" => Language::Markdown,
            "sql" => Language::Sql,
            "sh" | "bash" | "zsh" => Language::Shell,
            _ => Language::Unknown,
        }
    }

    /// Get the tree-sitter language for this language type
    pub fn tree_sitter_language(&self) -> Option<tree_sitter::Language> {
        match self {
            Language::TypeScript | Language::TSX => Some(tree_sitter_typescript::LANGUAGE_TYPESCRIPT.into()),
            Language::JavaScript | Language::JSX => Some(tree_sitter_javascript::LANGUAGE.into()),
            Language::Python => Some(tree_sitter_python::LANGUAGE.into()),
            Language::Rust => Some(tree_sitter_rust::LANGUAGE.into()),
            Language::Go => Some(tree_sitter_go::LANGUAGE.into()),
            Language::Json => Some(tree_sitter_json::LANGUAGE.into()),
            Language::Toml => Some(tree_sitter_toml_ng::language().into()),
            Language::Css | Language::Scss => Some(tree_sitter_css::LANGUAGE.into()),
            Language::Html => Some(tree_sitter_html::LANGUAGE.into()),
            // Languages without tree-sitter grammars in our deps
            _ => None,
        }
    }

    /// Get language name as string
    pub fn name(&self) -> &'static str {
        match self {
            Language::TypeScript => "typescript",
            Language::JavaScript => "javascript",
            Language::TSX => "tsx",
            Language::JSX => "jsx",
            Language::Python => "python",
            Language::Rust => "rust",
            Language::Go => "go",
            Language::Java => "java",
            Language::C => "c",
            Language::Cpp => "cpp",
            Language::CSharp => "csharp",
            Language::Ruby => "ruby",
            Language::PHP => "php",
            Language::Swift => "swift",
            Language::Kotlin => "kotlin",
            Language::Scala => "scala",
            Language::Html => "html",
            Language::Css => "css",
            Language::Scss => "scss",
            Language::Json => "json",
            Language::Yaml => "yaml",
            Language::Toml => "toml",
            Language::Markdown => "markdown",
            Language::Sql => "sql",
            Language::Shell => "shell",
            Language::Unknown => "unknown",
        }
    }
}

/// A parsed file with AST
#[derive(Debug)]
pub struct ParsedFile {
    pub path: PathBuf,
    pub language: Language,
    pub content: String,
    pub tree: Tree,
    pub line_offsets: Vec<usize>,
}

impl ParsedFile {
    /// Get line and column from byte offset
    pub fn position_from_offset(&self, offset: usize) -> (usize, usize) {
        let line = self.line_offsets.partition_point(|&o| o <= offset).saturating_sub(1);
        let col = offset.saturating_sub(self.line_offsets.get(line).copied().unwrap_or(0));
        (line + 1, col + 1) // 1-indexed
    }

    /// Get byte offset from line and column (1-indexed)
    pub fn offset_from_position(&self, line: usize, col: usize) -> Option<usize> {
        let line_idx = line.saturating_sub(1);
        self.line_offsets.get(line_idx).map(|&start| start + col.saturating_sub(1))
    }

    /// Get the text for a node
    pub fn node_text(&self, node: &Node) -> &str {
        &self.content[node.start_byte()..node.end_byte()]
    }
}

/// Range in source code
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SourceRange {
    pub start_line: usize,
    pub start_col: usize,
    pub end_line: usize,
    pub end_col: usize,
    pub start_byte: usize,
    pub end_byte: usize,
}

impl SourceRange {
    pub fn from_node(node: &Node) -> Self {
        let start = node.start_position();
        let end = node.end_position();
        Self {
            start_line: start.row + 1,
            start_col: start.column + 1,
            end_line: end.row + 1,
            end_col: end.column + 1,
            start_byte: node.start_byte(),
            end_byte: node.end_byte(),
        }
    }
}

/// Function/method definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FunctionDefinition {
    pub name: String,
    pub signature: String,
    pub parameters: Vec<Parameter>,
    pub return_type: Option<String>,
    pub range: SourceRange,
    pub body_range: Option<SourceRange>,
    pub docstring: Option<String>,
    pub is_async: bool,
    pub is_exported: bool,
    pub is_public: bool,
    pub visibility: Visibility,
    pub decorators: Vec<String>,
    pub complexity: u32,
}

impl FunctionDefinition {
    /// Get start line (convenience accessor)
    pub fn start_line(&self) -> usize {
        self.range.start_line
    }

    /// Get end line (convenience accessor)
    pub fn end_line(&self) -> usize {
        self.range.end_line
    }

    /// Get start column (convenience accessor)
    pub fn start_col(&self) -> usize {
        self.range.start_col
    }

    /// Get end column (convenience accessor)
    pub fn end_col(&self) -> usize {
        self.range.end_col
    }

    /// Get byte start (convenience accessor)
    pub fn byte_start(&self) -> usize {
        self.range.start_byte
    }

    /// Get byte end (convenience accessor)
    pub fn byte_end(&self) -> usize {
        self.range.end_byte
    }

    /// Get documentation (alias for docstring)
    pub fn documentation(&self) -> Option<&str> {
        self.docstring.as_deref()
    }

    /// Get references (placeholder - returns empty vec)
    pub fn references(&self) -> Vec<String> {
        Vec::new()
    }
}

/// Function parameter
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Parameter {
    pub name: String,
    pub type_annotation: Option<String>,
    pub default_value: Option<String>,
    pub is_optional: bool,
    pub is_rest: bool,
}

/// Visibility modifier
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Visibility {
    Public,
    Private,
    Protected,
    Internal,
    Default,
}

/// Class/struct/interface definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClassDefinition {
    pub name: String,
    pub kind: ClassKind,
    pub range: SourceRange,
    pub extends: Vec<String>,
    pub implements: Vec<String>,
    pub methods: Vec<FunctionDefinition>,
    pub properties: Vec<PropertyDefinition>,
    pub is_exported: bool,
    pub is_abstract: bool,
    pub docstring: Option<String>,
    pub decorators: Vec<String>,
    pub type_parameters: Vec<String>,
}

impl ClassDefinition {
    /// Get start line (convenience accessor)
    pub fn start_line(&self) -> usize {
        self.range.start_line
    }

    /// Get end line (convenience accessor)
    pub fn end_line(&self) -> usize {
        self.range.end_line
    }

    /// Get start column (convenience accessor)
    pub fn start_col(&self) -> usize {
        self.range.start_col
    }

    /// Get end column (convenience accessor)
    pub fn end_col(&self) -> usize {
        self.range.end_col
    }

    /// Get byte start (convenience accessor)
    pub fn byte_start(&self) -> usize {
        self.range.start_byte
    }

    /// Get byte end (convenience accessor)
    pub fn byte_end(&self) -> usize {
        self.range.end_byte
    }

    /// Get documentation (alias for docstring)
    pub fn documentation(&self) -> Option<&str> {
        self.docstring.as_deref()
    }

    /// Get visibility
    pub fn visibility(&self) -> Visibility {
        if self.is_exported {
            Visibility::Public
        } else {
            Visibility::Default
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ClassKind {
    Class,
    Interface,
    Struct,
    Trait,
    Enum,
    TypeAlias,
}

/// Property/field definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PropertyDefinition {
    pub name: String,
    pub type_annotation: Option<String>,
    pub default_value: Option<String>,
    pub visibility: Visibility,
    pub is_static: bool,
    pub is_readonly: bool,
    pub range: SourceRange,
}

/// Import declaration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportDeclaration {
    pub source: String,
    pub specifiers: Vec<ImportSpecifier>,
    pub is_type_only: bool,
    pub range: SourceRange,
}

impl ImportDeclaration {
    /// Get line number (convenience accessor)
    pub fn line(&self) -> usize {
        self.range.start_line
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportSpecifier {
    pub name: String,
    pub alias: Option<String>,
    pub is_default: bool,
    pub is_namespace: bool,
}

/// Export declaration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportDeclaration {
    pub name: String,
    pub alias: Option<String>,
    pub source: Option<String>,
    pub is_default: bool,
    pub is_type_only: bool,
    pub range: SourceRange,
}

/// Type definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TypeDefinition {
    pub name: String,
    pub kind: TypeKind,
    pub definition: String,
    pub range: SourceRange,
    pub is_exported: bool,
    pub type_parameters: Vec<String>,
    pub docstring: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TypeKind {
    TypeAlias,
    Interface,
    Enum,
    Union,
    Intersection,
    Generic,
}

/// Interface definition (alias for TypeDefinition with Interface kind)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InterfaceDefinition {
    pub name: String,
    pub extends: Vec<String>,
    pub methods: Vec<FunctionDefinition>,
    pub properties: Vec<PropertyDefinition>,
    pub range: SourceRange,
    pub is_exported: bool,
    pub docstring: Option<String>,
    pub type_parameters: Vec<String>,
}

impl InterfaceDefinition {
    pub fn line(&self) -> usize {
        self.range.start_line
    }

    pub fn start_line(&self) -> usize {
        self.range.start_line
    }

    pub fn end_line(&self) -> usize {
        self.range.end_line
    }
}

/// Type alias definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TypeAlias {
    pub name: String,
    pub definition: String,
    pub range: SourceRange,
    pub is_exported: bool,
    pub type_parameters: Vec<String>,
    pub docstring: Option<String>,
}

impl TypeAlias {
    pub fn line(&self) -> usize {
        self.range.start_line
    }
}

/// Variable declaration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VariableDeclaration {
    pub name: String,
    pub kind: VariableKind,
    pub type_annotation: Option<String>,
    pub initial_value: Option<String>,
    pub range: SourceRange,
    pub is_exported: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum VariableKind {
    Const,
    Let,
    Var,
    Static,
}

/// Comment/documentation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Comment {
    pub content: String,
    pub kind: CommentKind,
    pub range: SourceRange,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum CommentKind {
    Line,
    Block,
    Doc,
    JsDoc,
    PyDoc,
    RustDoc,
}

/// Complete code structure for a file
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodeStructure {
    pub file_path: PathBuf,
    pub language: Language,
    pub imports: Vec<ImportDeclaration>,
    pub exports: Vec<ExportDeclaration>,
    pub functions: Vec<FunctionDefinition>,
    pub classes: Vec<ClassDefinition>,
    pub types: Vec<TypeDefinition>,
    pub variables: Vec<VariableDeclaration>,
    pub comments: Vec<Comment>,
    pub complexity_score: u32,
    pub lines_of_code: u32,
    pub lines_of_comments: u32,
    // Additional fields for compatibility
    pub interfaces: Vec<InterfaceDefinition>,
    pub type_aliases: Vec<TypeAlias>,
    pub module_doc: Option<String>,
}

impl Default for CodeStructure {
    fn default() -> Self {
        Self {
            file_path: PathBuf::new(),
            language: Language::Unknown,
            imports: Vec::new(),
            exports: Vec::new(),
            functions: Vec::new(),
            classes: Vec::new(),
            types: Vec::new(),
            variables: Vec::new(),
            comments: Vec::new(),
            complexity_score: 0,
            lines_of_code: 0,
            lines_of_comments: 0,
            interfaces: Vec::new(),
            type_aliases: Vec::new(),
            module_doc: None,
        }
    }
}

/// AST parsing engine with language support
pub struct ASTEngine {
    /// Parser cache per language
    parsers: DashMap<Language, Parser>,
    /// Parsed file cache
    file_cache: DashMap<PathBuf, Arc<ParsedFile>>,
    /// Query cache per language
    query_cache: DashMap<(Language, String), Query>,
    /// Maximum cache size
    max_cache_size: usize,
}

impl std::fmt::Debug for ASTEngine {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("ASTEngine")
            .field("cached_languages", &self.parsers.len())
            .field("cached_files", &self.file_cache.len())
            .field("cached_queries", &self.query_cache.len())
            .field("max_cache_size", &self.max_cache_size)
            .finish()
    }
}

impl ASTEngine {
    pub fn new() -> Self {
        Self {
            parsers: DashMap::new(),
            file_cache: DashMap::new(),
            query_cache: DashMap::new(),
            max_cache_size: 500,
        }
    }

    /// Get or create a parser for a language
    /// Note: Parsers are not Clone, so we create a new one each time
    fn get_parser(&self, language: Language) -> Option<Parser> {
        // Check if we've seen this language before (cached the tree-sitter language)
        if self.parsers.contains_key(&language) {
            // We know this language is valid, create a fresh parser
            let ts_lang = language.tree_sitter_language()?;
            let mut parser = Parser::new();
            parser.set_language(&ts_lang).ok()?;
            return Some(parser);
        }

        // First time seeing this language - validate and cache
        let ts_lang = language.tree_sitter_language()?;
        let mut parser = Parser::new();
        parser.set_language(&ts_lang).ok()?;

        // Insert a placeholder parser to mark this language as valid
        let mut placeholder = Parser::new();
        let _ = placeholder.set_language(&ts_lang);
        self.parsers.insert(language, placeholder);

        Some(parser)
    }

    /// Compute line offsets for a source string
    fn compute_line_offsets(content: &str) -> Vec<usize> {
        let mut offsets = vec![0];
        for (i, c) in content.char_indices() {
            if c == '\n' {
                offsets.push(i + 1);
            }
        }
        offsets
    }

    /// Parse a file and return the parsed result
    pub fn parse_file(&self, path: &Path, content: &str) -> Result<Arc<ParsedFile>, String> {
        // Check cache first
        if let Some(cached) = self.file_cache.get(path) {
            // TODO: Check if content hash matches
            return Ok(cached.clone());
        }

        // Detect language from extension
        let ext = path.extension()
            .and_then(|e| e.to_str())
            .unwrap_or("");
        let language = Language::from_extension(ext);

        // Get parser for this language
        let mut parser = self.get_parser(language)
            .ok_or_else(|| format!("No parser available for language: {:?}", language))?;

        // Parse the content
        let tree = parser.parse(content, None)
            .ok_or_else(|| "Failed to parse file".to_string())?;

        let line_offsets = Self::compute_line_offsets(content);

        let parsed = Arc::new(ParsedFile {
            path: path.to_path_buf(),
            language,
            content: content.to_string(),
            tree,
            line_offsets,
        });

        // Cache the result
        self.file_cache.insert(path.to_path_buf(), parsed.clone());

        // Evict old entries if cache is too large
        if self.file_cache.len() > self.max_cache_size {
            // Simple eviction: remove first entry
            if let Some(key) = self.file_cache.iter().next().map(|r| r.key().clone()) {
                self.file_cache.remove(&key);
            }
        }

        Ok(parsed)
    }

    /// Parse and extract full code structure
    pub fn parse_structure(&self, path: &Path, content: &str) -> Result<CodeStructure, String> {
        let parsed = self.parse_file(path, content)?;
        self.extract_structure(&parsed)
    }

    /// Extract code structure from a parsed file
    pub fn extract_structure(&self, parsed: &ParsedFile) -> Result<CodeStructure, String> {
        let mut structure = CodeStructure {
            file_path: parsed.path.clone(),
            language: parsed.language,
            ..Default::default()
        };

        let root = parsed.tree.root_node();

        match parsed.language {
            Language::TypeScript | Language::TSX | Language::JavaScript | Language::JSX => {
                self.extract_typescript_structure(parsed, &root, &mut structure);
            }
            Language::Python => {
                self.extract_python_structure(parsed, &root, &mut structure);
            }
            Language::Rust => {
                self.extract_rust_structure(parsed, &root, &mut structure);
            }
            Language::Go => {
                self.extract_go_structure(parsed, &root, &mut structure);
            }
            _ => {
                // Generic extraction for unsupported languages
                self.extract_generic_structure(parsed, &root, &mut structure);
            }
        }

        // Calculate metrics
        structure.lines_of_code = parsed.content.lines().count() as u32;
        structure.lines_of_comments = structure.comments.len() as u32;
        structure.complexity_score = self.calculate_complexity(&structure);

        Ok(structure)
    }

    /// Extract TypeScript/JavaScript structure
    fn extract_typescript_structure(&self, parsed: &ParsedFile, root: &Node, structure: &mut CodeStructure) {
        let mut cursor = root.walk();

        // Traverse top-level nodes
        for child in root.children(&mut cursor) {
            match child.kind() {
                // Import statements
                "import_statement" => {
                    if let Some(import) = self.extract_ts_import(parsed, &child) {
                        structure.imports.push(import);
                    }
                }
                // Export statements (also extract exported functions/classes)
                "export_statement" => {
                    if let Some(export) = self.extract_ts_export(parsed, &child) {
                        structure.exports.push(export);
                    }
                    // Also extract any function/class declarations inside the export
                    let mut child_cursor = child.walk();
                    for export_child in child.children(&mut child_cursor) {
                        match export_child.kind() {
                            "function_declaration" => {
                                if let Some(mut func) = self.extract_ts_function(parsed, &export_child, false) {
                                    func.is_exported = true;
                                    structure.functions.push(func);
                                }
                            }
                            "class_declaration" => {
                                if let Some(mut class) = self.extract_ts_class(parsed, &export_child) {
                                    class.is_exported = true;
                                    structure.classes.push(class);
                                }
                            }
                            _ => {}
                        }
                    }
                }
                // Function declarations
                "function_declaration" | "arrow_function" | "function" => {
                    if let Some(func) = self.extract_ts_function(parsed, &child, false) {
                        structure.functions.push(func);
                    }
                }
                // Class declarations
                "class_declaration" => {
                    if let Some(class) = self.extract_ts_class(parsed, &child) {
                        structure.classes.push(class);
                    }
                }
                // Interface declarations
                "interface_declaration" => {
                    if let Some(iface) = self.extract_ts_interface(parsed, &child) {
                        structure.classes.push(iface);
                    }
                }
                // Type alias
                "type_alias_declaration" => {
                    if let Some(type_def) = self.extract_ts_type_alias(parsed, &child) {
                        structure.types.push(type_def);
                    }
                }
                // Variable declarations
                "lexical_declaration" | "variable_declaration" => {
                    let vars = self.extract_ts_variables(parsed, &child);
                    structure.variables.extend(vars);
                }
                // Comments
                "comment" => {
                    if let Some(comment) = self.extract_comment(parsed, &child) {
                        structure.comments.push(comment);
                    }
                }
                _ => {}
            }
        }
    }

    /// Extract TypeScript import
    fn extract_ts_import(&self, parsed: &ParsedFile, node: &Node) -> Option<ImportDeclaration> {
        let range = SourceRange::from_node(node);
        let mut specifiers = Vec::new();
        let mut source = String::new();
        let mut is_type_only = false;

        let mut cursor = node.walk();
        for child in node.children(&mut cursor) {
            match child.kind() {
                "import_clause" => {
                    let mut clause_cursor = child.walk();
                    for clause_child in child.children(&mut clause_cursor) {
                        match clause_child.kind() {
                            "identifier" => {
                                // Default import
                                specifiers.push(ImportSpecifier {
                                    name: parsed.node_text(&clause_child).to_string(),
                                    alias: None,
                                    is_default: true,
                                    is_namespace: false,
                                });
                            }
                            "named_imports" => {
                                // Named imports { a, b, c }
                                let mut named_cursor = clause_child.walk();
                                for import_spec in clause_child.children(&mut named_cursor) {
                                    if import_spec.kind() == "import_specifier" {
                                        let mut name = String::new();
                                        let mut alias = None;
                                        let mut spec_cursor = import_spec.walk();
                                        for spec_child in import_spec.children(&mut spec_cursor) {
                                            if spec_child.kind() == "identifier" {
                                                if name.is_empty() {
                                                    name = parsed.node_text(&spec_child).to_string();
                                                } else {
                                                    alias = Some(parsed.node_text(&spec_child).to_string());
                                                }
                                            }
                                        }
                                        if !name.is_empty() {
                                            specifiers.push(ImportSpecifier {
                                                name,
                                                alias,
                                                is_default: false,
                                                is_namespace: false,
                                            });
                                        }
                                    }
                                }
                            }
                            "namespace_import" => {
                                // * as name
                                if let Some(ident) = clause_child.child_by_field_name("alias") {
                                    specifiers.push(ImportSpecifier {
                                        name: parsed.node_text(&ident).to_string(),
                                        alias: None,
                                        is_default: false,
                                        is_namespace: true,
                                    });
                                }
                            }
                            _ => {}
                        }
                    }
                }
                "string" | "string_literal" => {
                    source = parsed.node_text(&child)
                        .trim_matches(|c| c == '"' || c == '\'' || c == '`')
                        .to_string();
                }
                "type" => {
                    is_type_only = true;
                }
                _ => {}
            }
        }

        if source.is_empty() {
            return None;
        }

        Some(ImportDeclaration {
            source,
            specifiers,
            is_type_only,
            range,
        })
    }

    /// Extract TypeScript export
    fn extract_ts_export(&self, parsed: &ParsedFile, node: &Node) -> Option<ExportDeclaration> {
        let range = SourceRange::from_node(node);
        let text = parsed.node_text(node);

        let is_default = text.contains("export default");
        let is_type_only = text.contains("export type");

        // Simple extraction - get the exported name
        let mut cursor = node.walk();
        for child in node.children(&mut cursor) {
            if child.kind() == "identifier" || child.kind() == "type_identifier" {
                return Some(ExportDeclaration {
                    name: parsed.node_text(&child).to_string(),
                    alias: None,
                    source: None,
                    is_default,
                    is_type_only,
                    range,
                });
            }
        }

        None
    }

    /// Extract TypeScript function
    fn extract_ts_function(&self, parsed: &ParsedFile, node: &Node, is_method: bool) -> Option<FunctionDefinition> {
        let range = SourceRange::from_node(node);
        let text = parsed.node_text(node);

        let mut name = String::new();
        let mut parameters = Vec::new();
        let mut return_type = None;
        let mut is_async = text.starts_with("async ");
        let mut body_range = None;

        let mut cursor = node.walk();
        for child in node.children(&mut cursor) {
            match child.kind() {
                "identifier" | "property_identifier" => {
                    if name.is_empty() {
                        name = parsed.node_text(&child).to_string();
                    }
                }
                "formal_parameters" => {
                    parameters = self.extract_ts_parameters(parsed, &child);
                }
                "type_annotation" => {
                    // Return type comes after parameters
                    if let Some(type_node) = child.child(1) {
                        return_type = Some(parsed.node_text(&type_node).to_string());
                    }
                }
                "statement_block" => {
                    body_range = Some(SourceRange::from_node(&child));
                }
                "async" => {
                    is_async = true;
                }
                _ => {}
            }
        }

        if name.is_empty() && !is_method {
            name = "<anonymous>".to_string();
        }

        // Build signature
        let params_str = parameters.iter()
            .map(|p| {
                let mut s = p.name.clone();
                if let Some(ref t) = p.type_annotation {
                    s.push_str(": ");
                    s.push_str(t);
                }
                s
            })
            .collect::<Vec<_>>()
            .join(", ");

        let signature = format!(
            "{}function {}({}){}",
            if is_async { "async " } else { "" },
            name,
            params_str,
            return_type.as_ref().map(|t| format!(": {}", t)).unwrap_or_default()
        );

        Some(FunctionDefinition {
            name,
            signature,
            parameters,
            return_type,
            range,
            body_range,
            docstring: None, // TODO: Extract from preceding comment
            is_async,
            is_exported: false,
            is_public: true,
            visibility: Visibility::Default,
            decorators: Vec::new(),
            complexity: 1,
        })
    }

    /// Extract TypeScript function parameters
    fn extract_ts_parameters(&self, parsed: &ParsedFile, node: &Node) -> Vec<Parameter> {
        let mut params = Vec::new();
        let mut cursor = node.walk();

        for child in node.children(&mut cursor) {
            if child.kind() == "required_parameter" || child.kind() == "optional_parameter" {
                let is_optional = child.kind() == "optional_parameter";
                let mut name = String::new();
                let mut type_annotation = None;
                let mut default_value = None;
                let is_rest = false;

                let mut param_cursor = child.walk();
                for param_child in child.children(&mut param_cursor) {
                    match param_child.kind() {
                        "identifier" => {
                            name = parsed.node_text(&param_child).to_string();
                        }
                        "type_annotation" => {
                            if let Some(type_node) = param_child.child(1) {
                                type_annotation = Some(parsed.node_text(&type_node).to_string());
                            }
                        }
                        _ => {
                            // Check for default value
                            if param_child.kind().ends_with("expression") {
                                default_value = Some(parsed.node_text(&param_child).to_string());
                            }
                        }
                    }
                }

                if !name.is_empty() {
                    params.push(Parameter {
                        name,
                        type_annotation,
                        default_value,
                        is_optional,
                        is_rest,
                    });
                }
            }
        }

        params
    }

    /// Extract TypeScript class
    fn extract_ts_class(&self, parsed: &ParsedFile, node: &Node) -> Option<ClassDefinition> {
        let range = SourceRange::from_node(node);
        let mut name = String::new();
        let mut extends = Vec::new();
        let mut implements = Vec::new();
        let mut methods = Vec::new();
        let mut properties = Vec::new();
        let mut type_parameters = Vec::new();

        let mut cursor = node.walk();
        for child in node.children(&mut cursor) {
            match child.kind() {
                "type_identifier" | "identifier" => {
                    if name.is_empty() {
                        name = parsed.node_text(&child).to_string();
                    }
                }
                "class_heritage" => {
                    let mut heritage_cursor = child.walk();
                    for heritage_child in child.children(&mut heritage_cursor) {
                        if heritage_child.kind() == "extends_clause" {
                            if let Some(type_node) = heritage_child.child_by_field_name("type") {
                                extends.push(parsed.node_text(&type_node).to_string());
                            }
                        }
                        if heritage_child.kind() == "implements_clause" {
                            // Extract implemented interfaces
                            let mut impl_cursor = heritage_child.walk();
                            for impl_child in heritage_child.children(&mut impl_cursor) {
                                if impl_child.kind() == "type_identifier" {
                                    implements.push(parsed.node_text(&impl_child).to_string());
                                }
                            }
                        }
                    }
                }
                "class_body" => {
                    let mut body_cursor = child.walk();
                    for body_child in child.children(&mut body_cursor) {
                        match body_child.kind() {
                            "method_definition" => {
                                if let Some(method) = self.extract_ts_function(parsed, &body_child, true) {
                                    methods.push(method);
                                }
                            }
                            "public_field_definition" | "field_definition" => {
                                if let Some(prop) = self.extract_ts_property(parsed, &body_child) {
                                    properties.push(prop);
                                }
                            }
                            _ => {}
                        }
                    }
                }
                "type_parameters" => {
                    let mut tp_cursor = child.walk();
                    for tp_child in child.children(&mut tp_cursor) {
                        if tp_child.kind() == "type_parameter" {
                            type_parameters.push(parsed.node_text(&tp_child).to_string());
                        }
                    }
                }
                _ => {}
            }
        }

        if name.is_empty() {
            return None;
        }

        Some(ClassDefinition {
            name,
            kind: ClassKind::Class,
            range,
            extends,
            implements,
            methods,
            properties,
            is_exported: false,
            is_abstract: false,
            docstring: None,
            decorators: Vec::new(),
            type_parameters,
        })
    }

    /// Extract TypeScript property
    fn extract_ts_property(&self, parsed: &ParsedFile, node: &Node) -> Option<PropertyDefinition> {
        let range = SourceRange::from_node(node);
        let mut name = String::new();
        let mut type_annotation = None;

        let mut cursor = node.walk();
        for child in node.children(&mut cursor) {
            match child.kind() {
                "property_identifier" | "identifier" => {
                    name = parsed.node_text(&child).to_string();
                }
                "type_annotation" => {
                    if let Some(type_node) = child.child(1) {
                        type_annotation = Some(parsed.node_text(&type_node).to_string());
                    }
                }
                _ => {}
            }
        }

        if name.is_empty() {
            return None;
        }

        Some(PropertyDefinition {
            name,
            type_annotation,
            default_value: None,
            visibility: Visibility::Public,
            is_static: false,
            is_readonly: false,
            range,
        })
    }

    /// Extract TypeScript interface
    fn extract_ts_interface(&self, parsed: &ParsedFile, node: &Node) -> Option<ClassDefinition> {
        let range = SourceRange::from_node(node);
        let mut name = String::new();
        let mut extends = Vec::new();
        let mut properties = Vec::new();
        let mut methods = Vec::new();

        let mut cursor = node.walk();
        for child in node.children(&mut cursor) {
            match child.kind() {
                "type_identifier" | "identifier" => {
                    if name.is_empty() {
                        name = parsed.node_text(&child).to_string();
                    }
                }
                "extends_type_clause" => {
                    let mut ext_cursor = child.walk();
                    for ext_child in child.children(&mut ext_cursor) {
                        if ext_child.kind() == "type_identifier" {
                            extends.push(parsed.node_text(&ext_child).to_string());
                        }
                    }
                }
                "object_type" | "interface_body" => {
                    let mut body_cursor = child.walk();
                    for body_child in child.children(&mut body_cursor) {
                        match body_child.kind() {
                            "property_signature" => {
                                if let Some(prop) = self.extract_ts_property(parsed, &body_child) {
                                    properties.push(prop);
                                }
                            }
                            "method_signature" => {
                                if let Some(method) = self.extract_ts_function(parsed, &body_child, true) {
                                    methods.push(method);
                                }
                            }
                            _ => {}
                        }
                    }
                }
                _ => {}
            }
        }

        if name.is_empty() {
            return None;
        }

        Some(ClassDefinition {
            name,
            kind: ClassKind::Interface,
            range,
            extends,
            implements: Vec::new(),
            methods,
            properties,
            is_exported: false,
            is_abstract: false,
            docstring: None,
            decorators: Vec::new(),
            type_parameters: Vec::new(),
        })
    }

    /// Extract TypeScript type alias
    fn extract_ts_type_alias(&self, parsed: &ParsedFile, node: &Node) -> Option<TypeDefinition> {
        let range = SourceRange::from_node(node);
        let mut name = String::new();
        let mut definition = String::new();

        let mut cursor = node.walk();
        for child in node.children(&mut cursor) {
            match child.kind() {
                "type_identifier" | "identifier" => {
                    if name.is_empty() {
                        name = parsed.node_text(&child).to_string();
                    }
                }
                _ => {
                    if child.kind().contains("type") {
                        definition = parsed.node_text(&child).to_string();
                    }
                }
            }
        }

        if name.is_empty() {
            return None;
        }

        Some(TypeDefinition {
            name,
            kind: TypeKind::TypeAlias,
            definition,
            range,
            is_exported: false,
            type_parameters: Vec::new(),
            docstring: None,
        })
    }

    /// Extract TypeScript variables
    fn extract_ts_variables(&self, parsed: &ParsedFile, node: &Node) -> Vec<VariableDeclaration> {
        let mut variables = Vec::new();
        let text = parsed.node_text(node);
        let kind = if text.starts_with("const") {
            VariableKind::Const
        } else if text.starts_with("let") {
            VariableKind::Let
        } else {
            VariableKind::Var
        };

        let mut cursor = node.walk();
        for child in node.children(&mut cursor) {
            if child.kind() == "variable_declarator" {
                let range = SourceRange::from_node(&child);
                let mut name = String::new();
                let mut type_annotation = None;
                let mut initial_value = None;

                let mut decl_cursor = child.walk();
                for decl_child in child.children(&mut decl_cursor) {
                    match decl_child.kind() {
                        "identifier" => {
                            name = parsed.node_text(&decl_child).to_string();
                        }
                        "type_annotation" => {
                            if let Some(type_node) = decl_child.child(1) {
                                type_annotation = Some(parsed.node_text(&type_node).to_string());
                            }
                        }
                        _ => {
                            if decl_child.kind().ends_with("expression") ||
                               decl_child.kind().ends_with("literal") ||
                               decl_child.kind() == "array" ||
                               decl_child.kind() == "object" {
                                initial_value = Some(parsed.node_text(&decl_child).to_string());
                            }
                        }
                    }
                }

                if !name.is_empty() {
                    variables.push(VariableDeclaration {
                        name,
                        kind,
                        type_annotation,
                        initial_value,
                        range,
                        is_exported: false,
                    });
                }
            }
        }

        variables
    }

    /// Extract Python structure
    fn extract_python_structure(&self, parsed: &ParsedFile, root: &Node, structure: &mut CodeStructure) {
        let mut cursor = root.walk();

        for child in root.children(&mut cursor) {
            match child.kind() {
                "import_statement" | "import_from_statement" => {
                    if let Some(import) = self.extract_python_import(parsed, &child) {
                        structure.imports.push(import);
                    }
                }
                "function_definition" => {
                    if let Some(func) = self.extract_python_function(parsed, &child) {
                        structure.functions.push(func);
                    }
                }
                "class_definition" => {
                    if let Some(class) = self.extract_python_class(parsed, &child) {
                        structure.classes.push(class);
                    }
                }
                "expression_statement" => {
                    // Could be a variable assignment
                    if let Some(assign) = child.child(0) {
                        if assign.kind() == "assignment" {
                            if let Some(var) = self.extract_python_variable(parsed, &assign) {
                                structure.variables.push(var);
                            }
                        }
                    }
                }
                "comment" => {
                    if let Some(comment) = self.extract_comment(parsed, &child) {
                        structure.comments.push(comment);
                    }
                }
                _ => {}
            }
        }
    }

    /// Extract Python import
    fn extract_python_import(&self, parsed: &ParsedFile, node: &Node) -> Option<ImportDeclaration> {
        let range = SourceRange::from_node(node);
        let mut source = String::new();
        let mut specifiers = Vec::new();

        if node.kind() == "import_statement" {
            // import module
            let mut cursor = node.walk();
            for child in node.children(&mut cursor) {
                if child.kind() == "dotted_name" {
                    source = parsed.node_text(&child).to_string();
                    specifiers.push(ImportSpecifier {
                        name: source.clone(),
                        alias: None,
                        is_default: true,
                        is_namespace: true,
                    });
                }
                if child.kind() == "aliased_import" {
                    if let Some(name_node) = child.child_by_field_name("name") {
                        source = parsed.node_text(&name_node).to_string();
                    }
                    if let Some(alias_node) = child.child_by_field_name("alias") {
                        specifiers.push(ImportSpecifier {
                            name: source.clone(),
                            alias: Some(parsed.node_text(&alias_node).to_string()),
                            is_default: true,
                            is_namespace: true,
                        });
                    }
                }
            }
        } else {
            // from module import ...
            let mut cursor = node.walk();
            for child in node.children(&mut cursor) {
                if child.kind() == "dotted_name" || child.kind() == "relative_import" {
                    source = parsed.node_text(&child).to_string();
                }
                if child.kind() == "import_list" {
                    let mut list_cursor = child.walk();
                    for list_child in child.children(&mut list_cursor) {
                        if list_child.kind() == "dotted_name" {
                            specifiers.push(ImportSpecifier {
                                name: parsed.node_text(&list_child).to_string(),
                                alias: None,
                                is_default: false,
                                is_namespace: false,
                            });
                        }
                        if list_child.kind() == "aliased_import" {
                            let mut name = String::new();
                            let mut alias = None;
                            if let Some(name_node) = list_child.child_by_field_name("name") {
                                name = parsed.node_text(&name_node).to_string();
                            }
                            if let Some(alias_node) = list_child.child_by_field_name("alias") {
                                alias = Some(parsed.node_text(&alias_node).to_string());
                            }
                            if !name.is_empty() {
                                specifiers.push(ImportSpecifier {
                                    name,
                                    alias,
                                    is_default: false,
                                    is_namespace: false,
                                });
                            }
                        }
                    }
                }
            }
        }

        if source.is_empty() && specifiers.is_empty() {
            return None;
        }

        Some(ImportDeclaration {
            source,
            specifiers,
            is_type_only: false,
            range,
        })
    }

    /// Extract Python function
    fn extract_python_function(&self, parsed: &ParsedFile, node: &Node) -> Option<FunctionDefinition> {
        let range = SourceRange::from_node(node);
        let mut name = String::new();
        let mut parameters = Vec::new();
        let mut return_type = None;
        let mut body_range = None;
        let mut docstring = None;
        let mut decorators = Vec::new();
        let is_async = node.kind() == "async_function_definition" ||
                       parsed.node_text(node).trim_start().starts_with("async");

        let mut cursor = node.walk();
        for child in node.children(&mut cursor) {
            match child.kind() {
                "identifier" => {
                    if name.is_empty() {
                        name = parsed.node_text(&child).to_string();
                    }
                }
                "parameters" => {
                    parameters = self.extract_python_parameters(parsed, &child);
                }
                "type" => {
                    return_type = Some(parsed.node_text(&child).to_string());
                }
                "block" => {
                    body_range = Some(SourceRange::from_node(&child));
                    // Check for docstring
                    if let Some(first_stmt) = child.child(0) {
                        if first_stmt.kind() == "expression_statement" {
                            if let Some(expr) = first_stmt.child(0) {
                                if expr.kind() == "string" {
                                    docstring = Some(parsed.node_text(&expr).to_string());
                                }
                            }
                        }
                    }
                }
                "decorator" => {
                    decorators.push(parsed.node_text(&child).to_string());
                }
                _ => {}
            }
        }

        if name.is_empty() {
            return None;
        }

        let params_str = parameters.iter()
            .map(|p| {
                let mut s = p.name.clone();
                if let Some(ref t) = p.type_annotation {
                    s.push_str(": ");
                    s.push_str(t);
                }
                s
            })
            .collect::<Vec<_>>()
            .join(", ");

        let signature = format!(
            "{}def {}({}){}",
            if is_async { "async " } else { "" },
            name,
            params_str,
            return_type.as_ref().map(|t| format!(" -> {}", t)).unwrap_or_default()
        );

        // Calculate visibility before moving name
        let is_public = !name.starts_with('_');
        let visibility = if name.starts_with("__") && !name.ends_with("__") {
            Visibility::Private
        } else if name.starts_with('_') {
            Visibility::Protected
        } else {
            Visibility::Public
        };

        Some(FunctionDefinition {
            name,
            signature,
            parameters,
            return_type,
            range,
            body_range,
            docstring,
            is_async,
            is_exported: true, // Python functions are public by default
            is_public,
            visibility,
            decorators,
            complexity: 1,
        })
    }

    /// Extract Python parameters
    fn extract_python_parameters(&self, parsed: &ParsedFile, node: &Node) -> Vec<Parameter> {
        let mut params = Vec::new();
        let mut cursor = node.walk();

        for child in node.children(&mut cursor) {
            match child.kind() {
                "identifier" => {
                    params.push(Parameter {
                        name: parsed.node_text(&child).to_string(),
                        type_annotation: None,
                        default_value: None,
                        is_optional: false,
                        is_rest: false,
                    });
                }
                "typed_parameter" | "typed_default_parameter" => {
                    let mut name = String::new();
                    let mut type_annotation = None;
                    let mut default_value = None;

                    let mut param_cursor = child.walk();
                    for param_child in child.children(&mut param_cursor) {
                        match param_child.kind() {
                            "identifier" => {
                                name = parsed.node_text(&param_child).to_string();
                            }
                            "type" => {
                                type_annotation = Some(parsed.node_text(&param_child).to_string());
                            }
                            _ => {
                                // Default value
                                if param_child.is_named() && param_child.kind() != "identifier" && param_child.kind() != "type" {
                                    default_value = Some(parsed.node_text(&param_child).to_string());
                                }
                            }
                        }
                    }

                    if !name.is_empty() {
                        params.push(Parameter {
                            name,
                            type_annotation,
                            default_value: default_value.clone(),
                            is_optional: default_value.is_some(),
                            is_rest: false,
                        });
                    }
                }
                "default_parameter" => {
                    let mut name = String::new();
                    let mut default_value = None;

                    let mut param_cursor = child.walk();
                    for param_child in child.children(&mut param_cursor) {
                        if param_child.kind() == "identifier" && name.is_empty() {
                            name = parsed.node_text(&param_child).to_string();
                        } else if param_child.is_named() && param_child.kind() != "identifier" {
                            default_value = Some(parsed.node_text(&param_child).to_string());
                        }
                    }

                    if !name.is_empty() {
                        params.push(Parameter {
                            name,
                            type_annotation: None,
                            default_value,
                            is_optional: true,
                            is_rest: false,
                        });
                    }
                }
                "list_splat_pattern" | "dictionary_splat_pattern" => {
                    if let Some(ident) = child.child(0) {
                        params.push(Parameter {
                            name: parsed.node_text(&ident).to_string(),
                            type_annotation: None,
                            default_value: None,
                            is_optional: true,
                            is_rest: true,
                        });
                    }
                }
                _ => {}
            }
        }

        params
    }

    /// Extract Python class
    fn extract_python_class(&self, parsed: &ParsedFile, node: &Node) -> Option<ClassDefinition> {
        let range = SourceRange::from_node(node);
        let mut name = String::new();
        let mut extends = Vec::new();
        let mut methods = Vec::new();
        let properties = Vec::new();
        let mut docstring = None;
        let mut decorators = Vec::new();

        let mut cursor = node.walk();
        for child in node.children(&mut cursor) {
            match child.kind() {
                "identifier" => {
                    if name.is_empty() {
                        name = parsed.node_text(&child).to_string();
                    }
                }
                "argument_list" => {
                    // Base classes
                    let mut arg_cursor = child.walk();
                    for arg_child in child.children(&mut arg_cursor) {
                        if arg_child.kind() == "identifier" || arg_child.kind() == "attribute" {
                            extends.push(parsed.node_text(&arg_child).to_string());
                        }
                    }
                }
                "block" => {
                    // Check for docstring
                    if let Some(first_stmt) = child.child(0) {
                        if first_stmt.kind() == "expression_statement" {
                            if let Some(expr) = first_stmt.child(0) {
                                if expr.kind() == "string" {
                                    docstring = Some(parsed.node_text(&expr).to_string());
                                }
                            }
                        }
                    }

                    // Extract methods
                    let mut block_cursor = child.walk();
                    for block_child in child.children(&mut block_cursor) {
                        if block_child.kind() == "function_definition" {
                            if let Some(method) = self.extract_python_function(parsed, &block_child) {
                                methods.push(method);
                            }
                        }
                    }
                }
                "decorator" => {
                    decorators.push(parsed.node_text(&child).to_string());
                }
                _ => {}
            }
        }

        if name.is_empty() {
            return None;
        }

        Some(ClassDefinition {
            name,
            kind: ClassKind::Class,
            range,
            extends,
            implements: Vec::new(),
            methods,
            properties,
            is_exported: true,
            is_abstract: decorators.iter().any(|d| d.contains("abstractmethod") || d.contains("ABC")),
            docstring,
            decorators,
            type_parameters: Vec::new(),
        })
    }

    /// Extract Python variable
    fn extract_python_variable(&self, parsed: &ParsedFile, node: &Node) -> Option<VariableDeclaration> {
        let range = SourceRange::from_node(node);
        let mut name = String::new();
        let mut type_annotation = None;
        let mut initial_value = None;

        let mut cursor = node.walk();
        for child in node.children(&mut cursor) {
            match child.kind() {
                "identifier" => {
                    if name.is_empty() {
                        name = parsed.node_text(&child).to_string();
                    }
                }
                "type" => {
                    type_annotation = Some(parsed.node_text(&child).to_string());
                }
                _ => {
                    if child.is_named() && child.kind() != "identifier" && child.kind() != "type" {
                        initial_value = Some(parsed.node_text(&child).to_string());
                    }
                }
            }
        }

        if name.is_empty() {
            return None;
        }

        Some(VariableDeclaration {
            name,
            kind: VariableKind::Var, // Python doesn't have const
            type_annotation,
            initial_value,
            range,
            is_exported: true,
        })
    }

    /// Extract Rust structure
    fn extract_rust_structure(&self, parsed: &ParsedFile, root: &Node, structure: &mut CodeStructure) {
        let mut cursor = root.walk();

        for child in root.children(&mut cursor) {
            match child.kind() {
                "use_declaration" => {
                    if let Some(import) = self.extract_rust_use(parsed, &child) {
                        structure.imports.push(import);
                    }
                }
                "function_item" => {
                    if let Some(func) = self.extract_rust_function(parsed, &child) {
                        structure.functions.push(func);
                    }
                }
                "struct_item" => {
                    if let Some(class) = self.extract_rust_struct(parsed, &child) {
                        structure.classes.push(class);
                    }
                }
                "impl_item" => {
                    // Extract methods from impl blocks
                    self.extract_rust_impl(parsed, &child, structure);
                }
                "enum_item" => {
                    if let Some(enum_def) = self.extract_rust_enum(parsed, &child) {
                        structure.classes.push(enum_def);
                    }
                }
                "trait_item" => {
                    if let Some(trait_def) = self.extract_rust_trait(parsed, &child) {
                        structure.classes.push(trait_def);
                    }
                }
                "type_item" => {
                    if let Some(type_def) = self.extract_rust_type_alias(parsed, &child) {
                        structure.types.push(type_def);
                    }
                }
                "const_item" | "static_item" => {
                    if let Some(var) = self.extract_rust_const(parsed, &child) {
                        structure.variables.push(var);
                    }
                }
                "line_comment" | "block_comment" => {
                    if let Some(comment) = self.extract_comment(parsed, &child) {
                        structure.comments.push(comment);
                    }
                }
                _ => {}
            }
        }
    }

    /// Extract Rust use statement
    fn extract_rust_use(&self, parsed: &ParsedFile, node: &Node) -> Option<ImportDeclaration> {
        let range = SourceRange::from_node(node);
        let text = parsed.node_text(node);

        // Simple parsing - extract the path
        let source = text.trim_start_matches("use ")
            .trim_end_matches(';')
            .trim()
            .to_string();

        Some(ImportDeclaration {
            source: source.clone(),
            specifiers: vec![ImportSpecifier {
                name: source,
                alias: None,
                is_default: false,
                is_namespace: false,
            }],
            is_type_only: false,
            range,
        })
    }

    /// Extract Rust function
    fn extract_rust_function(&self, parsed: &ParsedFile, node: &Node) -> Option<FunctionDefinition> {
        let range = SourceRange::from_node(node);
        let mut name = String::new();
        let mut parameters = Vec::new();
        let mut return_type = None;
        let mut body_range = None;
        let is_async = parsed.node_text(node).contains("async fn");
        let is_pub = parsed.node_text(node).trim_start().starts_with("pub");

        let mut cursor = node.walk();
        for child in node.children(&mut cursor) {
            match child.kind() {
                "identifier" => {
                    if name.is_empty() {
                        name = parsed.node_text(&child).to_string();
                    }
                }
                "parameters" => {
                    parameters = self.extract_rust_parameters(parsed, &child);
                }
                "type_identifier" | "generic_type" | "reference_type" | "unit_type" => {
                    // Return type
                    if return_type.is_none() && child.prev_sibling().map(|s| s.kind() == "->").unwrap_or(false) {
                        return_type = Some(parsed.node_text(&child).to_string());
                    }
                }
                "block" => {
                    body_range = Some(SourceRange::from_node(&child));
                }
                _ => {}
            }
        }

        if name.is_empty() {
            return None;
        }

        let params_str = parameters.iter()
            .map(|p| {
                let mut s = p.name.clone();
                if let Some(ref t) = p.type_annotation {
                    s.push_str(": ");
                    s.push_str(t);
                }
                s
            })
            .collect::<Vec<_>>()
            .join(", ");

        let signature = format!(
            "{}{}fn {}({}){}",
            if is_pub { "pub " } else { "" },
            if is_async { "async " } else { "" },
            name,
            params_str,
            return_type.as_ref().map(|t| format!(" -> {}", t)).unwrap_or_default()
        );

        Some(FunctionDefinition {
            name,
            signature,
            parameters,
            return_type,
            range,
            body_range,
            docstring: None,
            is_async,
            is_exported: is_pub,
            is_public: is_pub,
            visibility: if is_pub { Visibility::Public } else { Visibility::Private },
            decorators: Vec::new(),
            complexity: 1,
        })
    }

    /// Extract Rust parameters
    fn extract_rust_parameters(&self, parsed: &ParsedFile, node: &Node) -> Vec<Parameter> {
        let mut params = Vec::new();
        let mut cursor = node.walk();

        for child in node.children(&mut cursor) {
            if child.kind() == "parameter" {
                let mut name = String::new();
                let mut type_annotation = None;

                let mut param_cursor = child.walk();
                for param_child in child.children(&mut param_cursor) {
                    match param_child.kind() {
                        "identifier" => {
                            name = parsed.node_text(&param_child).to_string();
                        }
                        "type_identifier" | "generic_type" | "reference_type" |
                        "primitive_type" | "array_type" | "tuple_type" => {
                            type_annotation = Some(parsed.node_text(&param_child).to_string());
                        }
                        _ => {}
                    }
                }

                if !name.is_empty() {
                    params.push(Parameter {
                        name,
                        type_annotation,
                        default_value: None,
                        is_optional: false,
                        is_rest: false,
                    });
                }
            } else if child.kind() == "self_parameter" {
                params.push(Parameter {
                    name: "self".to_string(),
                    type_annotation: Some(parsed.node_text(&child).to_string()),
                    default_value: None,
                    is_optional: false,
                    is_rest: false,
                });
            }
        }

        params
    }

    /// Extract Rust struct
    fn extract_rust_struct(&self, parsed: &ParsedFile, node: &Node) -> Option<ClassDefinition> {
        let range = SourceRange::from_node(node);
        let mut name = String::new();
        let mut properties = Vec::new();
        let is_pub = parsed.node_text(node).trim_start().starts_with("pub");

        let mut cursor = node.walk();
        for child in node.children(&mut cursor) {
            match child.kind() {
                "type_identifier" => {
                    if name.is_empty() {
                        name = parsed.node_text(&child).to_string();
                    }
                }
                "field_declaration_list" => {
                    let mut field_cursor = child.walk();
                    for field in child.children(&mut field_cursor) {
                        if field.kind() == "field_declaration" {
                            if let Some(prop) = self.extract_rust_field(parsed, &field) {
                                properties.push(prop);
                            }
                        }
                    }
                }
                _ => {}
            }
        }

        if name.is_empty() {
            return None;
        }

        Some(ClassDefinition {
            name,
            kind: ClassKind::Struct,
            range,
            extends: Vec::new(),
            implements: Vec::new(),
            methods: Vec::new(),
            properties,
            is_exported: is_pub,
            is_abstract: false,
            docstring: None,
            decorators: Vec::new(),
            type_parameters: Vec::new(),
        })
    }

    /// Extract Rust field
    fn extract_rust_field(&self, parsed: &ParsedFile, node: &Node) -> Option<PropertyDefinition> {
        let range = SourceRange::from_node(node);
        let mut name = String::new();
        let mut type_annotation = None;
        let is_pub = parsed.node_text(node).trim_start().starts_with("pub");

        let mut cursor = node.walk();
        for child in node.children(&mut cursor) {
            match child.kind() {
                "field_identifier" => {
                    name = parsed.node_text(&child).to_string();
                }
                "type_identifier" | "generic_type" | "reference_type" |
                "primitive_type" | "array_type" | "tuple_type" => {
                    type_annotation = Some(parsed.node_text(&child).to_string());
                }
                _ => {}
            }
        }

        if name.is_empty() {
            return None;
        }

        Some(PropertyDefinition {
            name,
            type_annotation,
            default_value: None,
            visibility: if is_pub { Visibility::Public } else { Visibility::Private },
            is_static: false,
            is_readonly: false,
            range,
        })
    }

    /// Extract Rust impl block
    fn extract_rust_impl(&self, parsed: &ParsedFile, node: &Node, structure: &mut CodeStructure) {
        let mut cursor = node.walk();

        for child in node.children(&mut cursor) {
            if child.kind() == "declaration_list" {
                let mut decl_cursor = child.walk();
                for decl in child.children(&mut decl_cursor) {
                    if decl.kind() == "function_item" {
                        if let Some(func) = self.extract_rust_function(parsed, &decl) {
                            structure.functions.push(func);
                        }
                    }
                }
            }
        }
    }

    /// Extract Rust enum
    fn extract_rust_enum(&self, parsed: &ParsedFile, node: &Node) -> Option<ClassDefinition> {
        let range = SourceRange::from_node(node);
        let mut name = String::new();
        let is_pub = parsed.node_text(node).trim_start().starts_with("pub");

        let mut cursor = node.walk();
        for child in node.children(&mut cursor) {
            if child.kind() == "type_identifier" {
                name = parsed.node_text(&child).to_string();
                break;
            }
        }

        if name.is_empty() {
            return None;
        }

        Some(ClassDefinition {
            name,
            kind: ClassKind::Enum,
            range,
            extends: Vec::new(),
            implements: Vec::new(),
            methods: Vec::new(),
            properties: Vec::new(),
            is_exported: is_pub,
            is_abstract: false,
            docstring: None,
            decorators: Vec::new(),
            type_parameters: Vec::new(),
        })
    }

    /// Extract Rust trait
    fn extract_rust_trait(&self, parsed: &ParsedFile, node: &Node) -> Option<ClassDefinition> {
        let range = SourceRange::from_node(node);
        let mut name = String::new();
        let mut methods = Vec::new();
        let is_pub = parsed.node_text(node).trim_start().starts_with("pub");

        let mut cursor = node.walk();
        for child in node.children(&mut cursor) {
            match child.kind() {
                "type_identifier" => {
                    if name.is_empty() {
                        name = parsed.node_text(&child).to_string();
                    }
                }
                "declaration_list" => {
                    let mut decl_cursor = child.walk();
                    for decl in child.children(&mut decl_cursor) {
                        if decl.kind() == "function_item" || decl.kind() == "function_signature_item" {
                            if let Some(func) = self.extract_rust_function(parsed, &decl) {
                                methods.push(func);
                            }
                        }
                    }
                }
                _ => {}
            }
        }

        if name.is_empty() {
            return None;
        }

        Some(ClassDefinition {
            name,
            kind: ClassKind::Trait,
            range,
            extends: Vec::new(),
            implements: Vec::new(),
            methods,
            properties: Vec::new(),
            is_exported: is_pub,
            is_abstract: true,
            docstring: None,
            decorators: Vec::new(),
            type_parameters: Vec::new(),
        })
    }

    /// Extract Rust type alias
    fn extract_rust_type_alias(&self, parsed: &ParsedFile, node: &Node) -> Option<TypeDefinition> {
        let range = SourceRange::from_node(node);
        let text = parsed.node_text(node);
        let is_pub = text.trim_start().starts_with("pub");

        let mut name = String::new();
        let mut cursor = node.walk();
        for child in node.children(&mut cursor) {
            if child.kind() == "type_identifier" {
                name = parsed.node_text(&child).to_string();
                break;
            }
        }

        if name.is_empty() {
            return None;
        }

        Some(TypeDefinition {
            name,
            kind: TypeKind::TypeAlias,
            definition: text.to_string(),
            range,
            is_exported: is_pub,
            type_parameters: Vec::new(),
            docstring: None,
        })
    }

    /// Extract Rust const/static
    fn extract_rust_const(&self, parsed: &ParsedFile, node: &Node) -> Option<VariableDeclaration> {
        let range = SourceRange::from_node(node);
        let text = parsed.node_text(node);
        let is_static = node.kind() == "static_item";
        let is_pub = text.trim_start().starts_with("pub");

        let mut name = String::new();
        let mut type_annotation = None;

        let mut cursor = node.walk();
        for child in node.children(&mut cursor) {
            match child.kind() {
                "identifier" => {
                    if name.is_empty() {
                        name = parsed.node_text(&child).to_string();
                    }
                }
                "type_identifier" | "generic_type" | "reference_type" | "primitive_type" => {
                    type_annotation = Some(parsed.node_text(&child).to_string());
                }
                _ => {}
            }
        }

        if name.is_empty() {
            return None;
        }

        Some(VariableDeclaration {
            name,
            kind: if is_static { VariableKind::Static } else { VariableKind::Const },
            type_annotation,
            initial_value: None,
            range,
            is_exported: is_pub,
        })
    }

    /// Extract Go structure
    fn extract_go_structure(&self, parsed: &ParsedFile, root: &Node, structure: &mut CodeStructure) {
        let mut cursor = root.walk();

        for child in root.children(&mut cursor) {
            match child.kind() {
                "import_declaration" => {
                    // Extract Go imports
                    let mut import_cursor = child.walk();
                    for import_child in child.children(&mut import_cursor) {
                        if import_child.kind() == "import_spec" || import_child.kind() == "interpreted_string_literal" {
                            let source = parsed.node_text(&import_child)
                                .trim_matches('"')
                                .to_string();
                            structure.imports.push(ImportDeclaration {
                                source: source.clone(),
                                specifiers: vec![ImportSpecifier {
                                    name: source,
                                    alias: None,
                                    is_default: false,
                                    is_namespace: false,
                                }],
                                is_type_only: false,
                                range: SourceRange::from_node(&import_child),
                            });
                        }
                    }
                }
                "function_declaration" | "method_declaration" => {
                    if let Some(func) = self.extract_go_function(parsed, &child) {
                        structure.functions.push(func);
                    }
                }
                "type_declaration" => {
                    // Could be struct or interface
                    let mut type_cursor = child.walk();
                    for type_child in child.children(&mut type_cursor) {
                        if type_child.kind() == "type_spec" {
                            if let Some(class) = self.extract_go_type_spec(parsed, &type_child) {
                                structure.classes.push(class);
                            }
                        }
                    }
                }
                "const_declaration" | "var_declaration" => {
                    // Variables/constants
                    let mut var_cursor = child.walk();
                    for var_child in child.children(&mut var_cursor) {
                        if var_child.kind() == "const_spec" || var_child.kind() == "var_spec" {
                            if let Some(var) = self.extract_go_var(parsed, &var_child, child.kind() == "const_declaration") {
                                structure.variables.push(var);
                            }
                        }
                    }
                }
                "comment" => {
                    if let Some(comment) = self.extract_comment(parsed, &child) {
                        structure.comments.push(comment);
                    }
                }
                _ => {}
            }
        }
    }

    /// Extract Go function
    fn extract_go_function(&self, parsed: &ParsedFile, node: &Node) -> Option<FunctionDefinition> {
        let range = SourceRange::from_node(node);
        let mut name = String::new();
        let mut parameters = Vec::new();
        let mut return_type = None;
        let mut body_range = None;

        let mut cursor = node.walk();
        for child in node.children(&mut cursor) {
            match child.kind() {
                "identifier" => {
                    if name.is_empty() {
                        name = parsed.node_text(&child).to_string();
                    }
                }
                "parameter_list" => {
                    parameters = self.extract_go_parameters(parsed, &child);
                }
                "result" | "simple_type" | "type_identifier" => {
                    if return_type.is_none() {
                        return_type = Some(parsed.node_text(&child).to_string());
                    }
                }
                "block" => {
                    body_range = Some(SourceRange::from_node(&child));
                }
                _ => {}
            }
        }

        if name.is_empty() {
            return None;
        }

        let is_exported = name.chars().next().map(|c| c.is_uppercase()).unwrap_or(false);

        let params_str = parameters.iter()
            .map(|p| {
                let mut s = p.name.clone();
                if let Some(ref t) = p.type_annotation {
                    s.push(' ');
                    s.push_str(t);
                }
                s
            })
            .collect::<Vec<_>>()
            .join(", ");

        let signature = format!(
            "func {}({}){}",
            name,
            params_str,
            return_type.as_ref().map(|t| format!(" {}", t)).unwrap_or_default()
        );

        Some(FunctionDefinition {
            name,
            signature,
            parameters,
            return_type,
            range,
            body_range,
            docstring: None,
            is_async: false,
            is_exported,
            is_public: is_exported,
            visibility: if is_exported { Visibility::Public } else { Visibility::Private },
            decorators: Vec::new(),
            complexity: 1,
        })
    }

    /// Extract Go parameters
    fn extract_go_parameters(&self, parsed: &ParsedFile, node: &Node) -> Vec<Parameter> {
        let mut params = Vec::new();
        let mut cursor = node.walk();

        for child in node.children(&mut cursor) {
            if child.kind() == "parameter_declaration" {
                let mut names = Vec::new();
                let mut type_annotation = None;

                let mut param_cursor = child.walk();
                for param_child in child.children(&mut param_cursor) {
                    match param_child.kind() {
                        "identifier" => {
                            names.push(parsed.node_text(&param_child).to_string());
                        }
                        "type_identifier" | "pointer_type" | "array_type" |
                        "slice_type" | "map_type" | "channel_type" | "qualified_type" => {
                            type_annotation = Some(parsed.node_text(&param_child).to_string());
                        }
                        _ => {}
                    }
                }

                for name in names {
                    params.push(Parameter {
                        name,
                        type_annotation: type_annotation.clone(),
                        default_value: None,
                        is_optional: false,
                        is_rest: false,
                    });
                }
            }
        }

        params
    }

    /// Extract Go type spec (struct/interface)
    fn extract_go_type_spec(&self, parsed: &ParsedFile, node: &Node) -> Option<ClassDefinition> {
        let range = SourceRange::from_node(node);
        let mut name = String::new();
        let mut kind = ClassKind::Struct;
        let mut properties = Vec::new();
        let mut methods = Vec::new();

        let mut cursor = node.walk();
        for child in node.children(&mut cursor) {
            match child.kind() {
                "type_identifier" => {
                    name = parsed.node_text(&child).to_string();
                }
                "struct_type" => {
                    kind = ClassKind::Struct;
                    // Extract fields
                    let mut struct_cursor = child.walk();
                    for struct_child in child.children(&mut struct_cursor) {
                        if struct_child.kind() == "field_declaration_list" {
                            let mut field_cursor = struct_child.walk();
                            for field in struct_child.children(&mut field_cursor) {
                                if field.kind() == "field_declaration" {
                                    if let Some(prop) = self.extract_go_field(parsed, &field) {
                                        properties.push(prop);
                                    }
                                }
                            }
                        }
                    }
                }
                "interface_type" => {
                    kind = ClassKind::Interface;
                    // Extract method signatures
                    let mut iface_cursor = child.walk();
                    for iface_child in child.children(&mut iface_cursor) {
                        if iface_child.kind() == "method_spec" {
                            if let Some(method) = self.extract_go_function(parsed, &iface_child) {
                                methods.push(method);
                            }
                        }
                    }
                }
                _ => {}
            }
        }

        if name.is_empty() {
            return None;
        }

        let is_exported = name.chars().next().map(|c| c.is_uppercase()).unwrap_or(false);

        Some(ClassDefinition {
            name,
            kind,
            range,
            extends: Vec::new(),
            implements: Vec::new(),
            methods,
            properties,
            is_exported,
            is_abstract: kind == ClassKind::Interface,
            docstring: None,
            decorators: Vec::new(),
            type_parameters: Vec::new(),
        })
    }

    /// Extract Go field
    fn extract_go_field(&self, parsed: &ParsedFile, node: &Node) -> Option<PropertyDefinition> {
        let range = SourceRange::from_node(node);
        let mut name = String::new();
        let mut type_annotation = None;

        let mut cursor = node.walk();
        for child in node.children(&mut cursor) {
            match child.kind() {
                "field_identifier" => {
                    name = parsed.node_text(&child).to_string();
                }
                "type_identifier" | "pointer_type" | "array_type" |
                "slice_type" | "map_type" | "qualified_type" => {
                    type_annotation = Some(parsed.node_text(&child).to_string());
                }
                _ => {}
            }
        }

        if name.is_empty() {
            return None;
        }

        let is_exported = name.chars().next().map(|c| c.is_uppercase()).unwrap_or(false);

        Some(PropertyDefinition {
            name,
            type_annotation,
            default_value: None,
            visibility: if is_exported { Visibility::Public } else { Visibility::Private },
            is_static: false,
            is_readonly: false,
            range,
        })
    }

    /// Extract Go variable
    fn extract_go_var(&self, parsed: &ParsedFile, node: &Node, is_const: bool) -> Option<VariableDeclaration> {
        let range = SourceRange::from_node(node);
        let mut name = String::new();
        let mut type_annotation = None;

        let mut cursor = node.walk();
        for child in node.children(&mut cursor) {
            match child.kind() {
                "identifier" => {
                    if name.is_empty() {
                        name = parsed.node_text(&child).to_string();
                    }
                }
                "type_identifier" | "pointer_type" | "array_type" => {
                    type_annotation = Some(parsed.node_text(&child).to_string());
                }
                _ => {}
            }
        }

        if name.is_empty() {
            return None;
        }

        let is_exported = name.chars().next().map(|c| c.is_uppercase()).unwrap_or(false);

        Some(VariableDeclaration {
            name,
            kind: if is_const { VariableKind::Const } else { VariableKind::Var },
            type_annotation,
            initial_value: None,
            range,
            is_exported,
        })
    }

    /// Generic structure extraction for unsupported languages
    fn extract_generic_structure(&self, parsed: &ParsedFile, root: &Node, structure: &mut CodeStructure) {
        // Just extract comments
        fn walk_for_comments(parsed: &ParsedFile, node: &Node, comments: &mut Vec<Comment>) {
            if node.kind() == "comment" || node.kind().contains("comment") {
                let range = SourceRange::from_node(node);
                let content = parsed.node_text(node).to_string();
                let kind = if content.starts_with("//") {
                    CommentKind::Line
                } else {
                    CommentKind::Block
                };
                comments.push(Comment { content, kind, range });
            }

            let mut cursor = node.walk();
            for child in node.children(&mut cursor) {
                walk_for_comments(parsed, &child, comments);
            }
        }

        walk_for_comments(parsed, root, &mut structure.comments);
    }

    /// Extract comment
    fn extract_comment(&self, parsed: &ParsedFile, node: &Node) -> Option<Comment> {
        let range = SourceRange::from_node(node);
        let content = parsed.node_text(node).to_string();

        let kind = match node.kind() {
            "line_comment" => CommentKind::Line,
            "block_comment" => CommentKind::Block,
            "comment" => {
                if content.starts_with("//") {
                    if content.starts_with("///") || content.starts_with("//!") {
                        CommentKind::RustDoc
                    } else {
                        CommentKind::Line
                    }
                } else if content.starts_with("/**") {
                    CommentKind::JsDoc
                } else if content.starts_with("/*") {
                    CommentKind::Block
                } else if content.starts_with("#") {
                    CommentKind::Line
                } else if content.starts_with("'''") || content.starts_with("\"\"\"") {
                    CommentKind::PyDoc
                } else {
                    CommentKind::Line
                }
            }
            _ => CommentKind::Line,
        };

        Some(Comment { content, kind, range })
    }

    /// Calculate complexity score for a code structure
    fn calculate_complexity(&self, structure: &CodeStructure) -> u32 {
        let mut score = 0u32;

        // Base complexity from function count
        score += structure.functions.len() as u32 * 2;

        // Class complexity
        for class in &structure.classes {
            score += 3; // Base class complexity
            score += class.methods.len() as u32 * 2;
            score += class.properties.len() as u32;
        }

        // Import complexity
        score += structure.imports.len() as u32;

        // Type complexity
        score += structure.types.len() as u32 * 2;

        score
    }

    /// Get function at a specific position
    pub fn get_function_at_position(&self, parsed: &ParsedFile, line: usize, col: usize) -> Option<FunctionDefinition> {
        let structure = self.extract_structure(parsed).ok()?;

        for func in structure.functions {
            if line >= func.range.start_line && line <= func.range.end_line {
                return Some(func);
            }
        }

        // Check methods in classes
        for class in structure.classes {
            for method in class.methods {
                if line >= method.range.start_line && line <= method.range.end_line {
                    return Some(method);
                }
            }
        }

        None
    }

    /// Get class at a specific position
    pub fn get_class_at_position(&self, parsed: &ParsedFile, line: usize) -> Option<ClassDefinition> {
        let structure = self.extract_structure(parsed).ok()?;

        for class in structure.classes {
            if line >= class.range.start_line && line <= class.range.end_line {
                return Some(class);
            }
        }

        None
    }

    /// Clear the file cache
    pub fn clear_cache(&self) {
        self.file_cache.clear();
    }

    /// Remove a specific file from cache
    pub fn invalidate_file(&self, path: &Path) {
        self.file_cache.remove(path);
    }
}

impl Default for ASTEngine {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_language_detection() {
        assert_eq!(Language::from_extension("ts"), Language::TypeScript);
        assert_eq!(Language::from_extension("tsx"), Language::TSX);
        assert_eq!(Language::from_extension("py"), Language::Python);
        assert_eq!(Language::from_extension("rs"), Language::Rust);
        assert_eq!(Language::from_extension("go"), Language::Go);
        assert_eq!(Language::from_extension("unknown"), Language::Unknown);
    }

    #[test]
    fn test_parse_typescript() {
        let engine = ASTEngine::new();
        let code = r#"
import { foo } from './bar';

export function hello(name: string): string {
    return `Hello, ${name}!`;
}

export class Greeter {
    constructor(private name: string) {}

    greet(): string {
        return `Hello, ${this.name}!`;
    }
}
"#;

        let path = Path::new("test.ts");
        let structure = engine.parse_structure(path, code).unwrap();

        assert_eq!(structure.language, Language::TypeScript);
        assert!(!structure.imports.is_empty());
        assert!(!structure.functions.is_empty());
        assert!(!structure.classes.is_empty());
    }

    #[test]
    fn test_parse_python() {
        let engine = ASTEngine::new();
        let code = r#"
from typing import List

def hello(name: str) -> str:
    """Say hello to someone."""
    return f"Hello, {name}!"

class Greeter:
    """A greeter class."""

    def __init__(self, name: str):
        self.name = name

    def greet(self) -> str:
        return f"Hello, {self.name}!"
"#;

        let path = Path::new("test.py");
        let structure = engine.parse_structure(path, code).unwrap();

        assert_eq!(structure.language, Language::Python);
        assert!(!structure.imports.is_empty());
        assert!(!structure.functions.is_empty());
        assert!(!structure.classes.is_empty());
    }

    #[test]
    fn test_parse_rust() {
        let engine = ASTEngine::new();
        let code = r#"
use std::fmt;

pub fn hello(name: &str) -> String {
    format!("Hello, {}!", name)
}

pub struct Greeter {
    name: String,
}

impl Greeter {
    pub fn new(name: String) -> Self {
        Self { name }
    }

    pub fn greet(&self) -> String {
        format!("Hello, {}!", self.name)
    }
}
"#;

        let path = Path::new("test.rs");
        let structure = engine.parse_structure(path, code).unwrap();

        assert_eq!(structure.language, Language::Rust);
        assert!(!structure.imports.is_empty());
        assert!(!structure.functions.is_empty());
        assert!(!structure.classes.is_empty());
    }
}
