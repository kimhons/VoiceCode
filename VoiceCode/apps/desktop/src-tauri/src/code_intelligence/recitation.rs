#![allow(dead_code, unused_variables, unused_imports)]
// Recitation Pattern - Anti-hallucination through code citations
// Forces LLM to quote existing code before modifications, preventing invented APIs

use parking_lot::RwLock;
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Arc;

use super::ast_engine::ASTEngine;
use super::symbol_table::{Symbol, SymbolTable};

/// Recitation validation result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecitationResult {
    pub valid: bool,
    pub citations: Vec<Citation>,
    pub missing_citations: Vec<MissingCitation>,
    pub hallucinations: Vec<Hallucination>,
    pub confidence: f32,
}

/// A citation referencing actual code
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Citation {
    pub file_path: PathBuf,
    pub start_line: usize,
    pub end_line: usize,
    pub quoted_code: String,
    pub symbol_name: Option<String>,
    pub citation_type: CitationType,
    pub verified: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum CitationType {
    FunctionDefinition,
    ClassDefinition,
    TypeDefinition,
    Import,
    Variable,
    CodeBlock,
    Comment,
}

/// A missing citation that should have been provided
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MissingCitation {
    pub symbol_name: String,
    pub reason: String,
    pub suggestion: Option<String>,
}

/// A detected hallucination (invented API/method)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Hallucination {
    pub invented_name: String,
    pub context: String,
    pub hallucination_type: HallucinationType,
    pub severity: Severity,
    pub similar_existing: Vec<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum HallucinationType {
    InventedFunction,
    InventedMethod,
    InventedClass,
    InventedType,
    InventedProperty,
    InventedImport,
    WrongSignature,
    WrongReturnType,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Severity {
    Low,
    Medium,
    High,
    Critical,
}

/// Recitation validator - ensures LLM output references real code
pub struct RecitationValidator {
    symbol_table: Arc<SymbolTable>,
    ast_engine: Arc<ASTEngine>,
    known_apis: RwLock<HashMap<String, ApiInfo>>,
    citation_cache: RwLock<HashMap<String, Citation>>,
}

/// Information about a known API
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiInfo {
    pub name: String,
    pub signature: Option<String>,
    pub return_type: Option<String>,
    pub parameters: Vec<String>,
    pub source: ApiSource,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ApiSource {
    Project,
    StandardLibrary,
    ExternalDependency,
}

impl RecitationValidator {
    pub fn new(symbol_table: Arc<SymbolTable>, ast_engine: Arc<ASTEngine>) -> Self {
        Self {
            symbol_table,
            ast_engine,
            known_apis: RwLock::new(HashMap::new()),
            citation_cache: RwLock::new(HashMap::new()),
        }
    }

    /// Validate LLM response for hallucinations
    pub fn validate_response(
        &self,
        response: &str,
        context_file: Option<&Path>,
    ) -> RecitationResult {
        let mut citations = Vec::new();
        let missing = Vec::new();
        let mut hallucinations = Vec::new();

        // Extract code blocks from response
        let code_blocks = self.extract_code_blocks(response);

        // Validate each code block
        for block in &code_blocks {
            let block_result = self.validate_code_block(block, context_file);
            citations.extend(block_result.citations);
            hallucinations.extend(block_result.hallucinations);
        }

        // Check for API references that need citations
        let api_refs = self.extract_api_references(response);
        for api_ref in &api_refs {
            if !self.is_cited(&api_ref, &citations) && !self.is_known_api(&api_ref) {
                if let Some(similar) = self.find_similar_symbol(&api_ref) {
                    hallucinations.push(Hallucination {
                        invented_name: api_ref.clone(),
                        context: "API reference without citation".to_string(),
                        hallucination_type: HallucinationType::InventedFunction,
                        severity: Severity::Medium,
                        similar_existing: vec![similar],
                    });
                }
            }
        }

        let valid = hallucinations.is_empty();
        let confidence = if valid {
            1.0
        } else {
            1.0 - (hallucinations.len() as f32 * 0.2).min(0.9)
        };

        RecitationResult {
            valid,
            citations,
            missing_citations: missing,
            hallucinations,
            confidence,
        }
    }

    /// Extract code blocks from markdown response
    fn extract_code_blocks(&self, response: &str) -> Vec<CodeBlock> {
        let mut blocks = Vec::new();
        let re = Regex::new(r"```(\w*)\n([\s\S]*?)```").unwrap();

        for cap in re.captures_iter(response) {
            let language = cap.get(1).map(|m| m.as_str().to_string());
            let code = cap
                .get(2)
                .map(|m| m.as_str().to_string())
                .unwrap_or_default();
            blocks.push(CodeBlock { language, code });
        }

        blocks
    }

    /// Validate a single code block
    fn validate_code_block(
        &self,
        block: &CodeBlock,
        context_file: Option<&Path>,
    ) -> BlockValidation {
        let mut citations = Vec::new();
        let mut hallucinations = Vec::new();

        // Extract function calls
        let calls = self.extract_function_calls(&block.code);

        for call in &calls {
            // Check if this function exists in the project
            if let Some(symbol) = self.find_symbol(call) {
                citations.push(Citation {
                    file_path: symbol.file_path.clone(),
                    start_line: symbol.range.start_line,
                    end_line: symbol.range.end_line,
                    quoted_code: String::new(),
                    symbol_name: Some(symbol.name.clone()),
                    citation_type: CitationType::FunctionDefinition,
                    verified: true,
                });
            } else if !self.is_builtin(call) && !self.is_known_api(call) {
                // Potential hallucination
                let similar = self.find_similar_symbols(call, 3);
                hallucinations.push(Hallucination {
                    invented_name: call.clone(),
                    context: block.code.lines().take(3).collect::<Vec<_>>().join("\n"),
                    hallucination_type: HallucinationType::InventedFunction,
                    severity: if similar.is_empty() {
                        Severity::High
                    } else {
                        Severity::Medium
                    },
                    similar_existing: similar,
                });
            }
        }

        // Extract type references
        let types = self.extract_type_references(&block.code);
        for type_ref in &types {
            if !self.type_exists(type_ref) && !self.is_builtin_type(type_ref) {
                let similar = self.find_similar_types(type_ref, 3);
                hallucinations.push(Hallucination {
                    invented_name: type_ref.clone(),
                    context: format!("Type reference: {}", type_ref),
                    hallucination_type: HallucinationType::InventedType,
                    severity: Severity::Medium,
                    similar_existing: similar,
                });
            }
        }

        BlockValidation {
            citations,
            hallucinations,
        }
    }

    /// Extract function calls from code
    fn extract_function_calls(&self, code: &str) -> Vec<String> {
        let mut calls = Vec::new();
        let re = Regex::new(r"(\w+)\s*\(").unwrap();

        for cap in re.captures_iter(code) {
            if let Some(name) = cap.get(1) {
                let name_str = name.as_str();
                // Filter out keywords
                if !self.is_keyword(name_str) {
                    calls.push(name_str.to_string());
                }
            }
        }

        calls
    }

    /// Extract type references from code
    fn extract_type_references(&self, code: &str) -> Vec<String> {
        let mut types = Vec::new();

        // TypeScript/Rust style: name: Type
        let re1 = Regex::new(r":\s*([A-Z]\w+)").unwrap();
        for cap in re1.captures_iter(code) {
            if let Some(t) = cap.get(1) {
                types.push(t.as_str().to_string());
            }
        }

        // Generic types: Type<T>
        let re2 = Regex::new(r"([A-Z]\w+)<").unwrap();
        for cap in re2.captures_iter(code) {
            if let Some(t) = cap.get(1) {
                types.push(t.as_str().to_string());
            }
        }

        types
    }

    /// Extract API references from text
    fn extract_api_references(&self, text: &str) -> Vec<String> {
        let mut refs = Vec::new();

        // Look for backtick references
        let re = Regex::new(r"`(\w+(?:\.\w+)*)`").unwrap();
        for cap in re.captures_iter(text) {
            if let Some(r) = cap.get(1) {
                refs.push(r.as_str().to_string());
            }
        }

        refs
    }

    fn is_cited(&self, name: &str, citations: &[Citation]) -> bool {
        citations
            .iter()
            .any(|c| c.symbol_name.as_deref() == Some(name))
    }

    fn is_known_api(&self, name: &str) -> bool {
        self.known_apis.read().contains_key(name)
    }

    fn find_symbol(&self, name: &str) -> Option<Symbol> {
        self.symbol_table.find_by_name(name).into_iter().next()
    }

    fn find_similar_symbol(&self, name: &str) -> Option<String> {
        self.find_similar_symbols(name, 1).into_iter().next()
    }

    fn find_similar_symbols(&self, name: &str, limit: usize) -> Vec<String> {
        self.symbol_table
            .search(name, limit)
            .into_iter()
            .map(|s| s.name)
            .collect()
    }

    fn find_similar_types(&self, name: &str, limit: usize) -> Vec<String> {
        self.symbol_table
            .search(name, limit * 2)
            .into_iter()
            .filter(|s| {
                matches!(
                    s.kind,
                    super::symbol_table::SymbolKind::Class
                        | super::symbol_table::SymbolKind::Interface
                        | super::symbol_table::SymbolKind::Type
                )
            })
            .take(limit)
            .map(|s| s.name)
            .collect()
    }

    fn type_exists(&self, name: &str) -> bool {
        !self
            .symbol_table
            .find_by_name(name)
            .into_iter()
            .filter(|s| {
                matches!(
                    s.kind,
                    super::symbol_table::SymbolKind::Class
                        | super::symbol_table::SymbolKind::Interface
                        | super::symbol_table::SymbolKind::Type
                )
            })
            .next()
            .is_none()
    }

    fn is_keyword(&self, name: &str) -> bool {
        const KEYWORDS: &[&str] = &[
            "if",
            "else",
            "for",
            "while",
            "return",
            "function",
            "const",
            "let",
            "var",
            "class",
            "interface",
            "type",
            "import",
            "export",
            "from",
            "async",
            "await",
            "try",
            "catch",
            "throw",
            "new",
            "this",
            "super",
            "extends",
            "implements",
            "fn",
            "pub",
            "struct",
            "enum",
            "impl",
            "trait",
            "use",
            "mod",
            "match",
            "def",
            "self",
            "None",
            "True",
            "False",
            "lambda",
            "pass",
            "raise",
        ];
        KEYWORDS.contains(&name)
    }

    fn is_builtin(&self, name: &str) -> bool {
        const BUILTINS: &[&str] = &[
            "console",
            "log",
            "error",
            "warn",
            "info",
            "debug",
            "print",
            "println",
            "printf",
            "format",
            "parseInt",
            "parseFloat",
            "String",
            "Number",
            "Boolean",
            "Array",
            "Object",
            "Map",
            "Set",
            "Promise",
            "Date",
            "JSON",
            "Math",
            "Error",
            "Vec",
            "HashMap",
            "HashSet",
            "Option",
            "Result",
            "Box",
            "Arc",
            "Rc",
            "len",
            "push",
            "pop",
            "map",
            "filter",
            "reduce",
            "forEach",
        ];
        BUILTINS.contains(&name)
    }

    fn is_builtin_type(&self, name: &str) -> bool {
        const BUILTIN_TYPES: &[&str] = &[
            "string",
            "String",
            "number",
            "Number",
            "boolean",
            "Boolean",
            "void",
            "null",
            "undefined",
            "any",
            "unknown",
            "never",
            "object",
            "i8",
            "i16",
            "i32",
            "i64",
            "i128",
            "isize",
            "u8",
            "u16",
            "u32",
            "u64",
            "u128",
            "usize",
            "f32",
            "f64",
            "bool",
            "char",
            "str",
            "int",
            "float",
            "bool",
            "str",
            "list",
            "dict",
            "tuple",
            "set",
            "Array",
            "Object",
            "Function",
            "Symbol",
            "BigInt",
            "Vec",
            "Option",
            "Result",
            "Box",
            "Arc",
            "Rc",
            "RefCell",
            "Mutex",
            "HashMap",
            "HashSet",
            "BTreeMap",
            "BTreeSet",
        ];
        BUILTIN_TYPES.contains(&name)
    }

    /// Register a known API
    pub fn register_api(&self, info: ApiInfo) {
        self.known_apis.write().insert(info.name.clone(), info);
    }

    /// Load standard library APIs for a language
    pub fn load_stdlib(&self, language: &str) {
        match language {
            "rust" => self.load_rust_stdlib(),
            "typescript" | "javascript" => self.load_js_stdlib(),
            "python" => self.load_python_stdlib(),
            _ => {}
        }
    }

    fn load_rust_stdlib(&self) {
        let apis = [
            ("println", "macro", "()"),
            ("format", "macro", "String"),
            ("vec", "macro", "Vec<T>"),
            ("unwrap", "method", "T"),
            ("expect", "method", "T"),
            ("map", "method", "Iterator"),
            ("filter", "method", "Iterator"),
            ("collect", "method", "Collection"),
        ];

        for (name, sig, ret) in &apis {
            self.register_api(ApiInfo {
                name: name.to_string(),
                signature: Some(sig.to_string()),
                return_type: Some(ret.to_string()),
                parameters: Vec::new(),
                source: ApiSource::StandardLibrary,
            });
        }
    }

    fn load_js_stdlib(&self) {
        let apis = [
            ("console.log", "function", "void"),
            ("JSON.parse", "function", "any"),
            ("JSON.stringify", "function", "string"),
            ("Array.from", "function", "Array"),
            ("Object.keys", "function", "string[]"),
            ("Promise.resolve", "function", "Promise"),
            ("fetch", "function", "Promise<Response>"),
        ];

        for (name, sig, ret) in &apis {
            self.register_api(ApiInfo {
                name: name.to_string(),
                signature: Some(sig.to_string()),
                return_type: Some(ret.to_string()),
                parameters: Vec::new(),
                source: ApiSource::StandardLibrary,
            });
        }
    }

    fn load_python_stdlib(&self) {
        let apis = [
            ("print", "function", "None"),
            ("len", "function", "int"),
            ("range", "function", "range"),
            ("str", "function", "str"),
            ("int", "function", "int"),
            ("list", "function", "list"),
            ("dict", "function", "dict"),
        ];

        for (name, sig, ret) in &apis {
            self.register_api(ApiInfo {
                name: name.to_string(),
                signature: Some(sig.to_string()),
                return_type: Some(ret.to_string()),
                parameters: Vec::new(),
                source: ApiSource::StandardLibrary,
            });
        }
    }

    /// Generate citation prompt for LLM
    pub fn generate_citation_prompt(&self, symbols: &[String]) -> String {
        let mut prompt =
            String::from("Before modifying code, you MUST cite the existing implementation.\n\n");
        prompt.push_str("Required citations format:\n");
        prompt.push_str("```citation\n");
        prompt.push_str("// File: path/to/file.ts:10-25\n");
        prompt.push_str("// Existing implementation of functionName\n");
        prompt.push_str("function functionName(...) {\n  // quoted code\n}\n");
        prompt.push_str("```\n\n");

        if !symbols.is_empty() {
            prompt.push_str("Symbols that MUST be cited before modification:\n");
            for symbol in symbols {
                prompt.push_str(&format!("- {}\n", symbol));
            }
        }

        prompt
    }
}

struct CodeBlock {
    language: Option<String>,
    code: String,
}

struct BlockValidation {
    citations: Vec<Citation>,
    hallucinations: Vec<Hallucination>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_function_calls() {
        let validator =
            RecitationValidator::new(Arc::new(SymbolTable::new()), Arc::new(ASTEngine::new()));

        let code = "const result = myFunction(arg1, arg2);\nconsole.log(result);";
        let calls = validator.extract_function_calls(code);

        assert!(calls.contains(&"myFunction".to_string()));
        assert!(calls.contains(&"log".to_string()));
    }

    #[test]
    fn test_is_builtin() {
        let validator =
            RecitationValidator::new(Arc::new(SymbolTable::new()), Arc::new(ASTEngine::new()));

        assert!(validator.is_builtin("console"));
        assert!(validator.is_builtin("println"));
        assert!(!validator.is_builtin("myCustomFunction"));
    }

    #[test]
    fn test_extract_type_references() {
        let validator =
            RecitationValidator::new(Arc::new(SymbolTable::new()), Arc::new(ASTEngine::new()));

        let code = "const x: MyType = getValue();\nlet y: Array<Item> = [];";
        let types = validator.extract_type_references(code);

        assert!(types.contains(&"MyType".to_string()));
        assert!(types.contains(&"Array".to_string()));
    }
}
