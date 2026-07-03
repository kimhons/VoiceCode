#![allow(dead_code, unused_variables, unused_imports)]
// Tribal Knowledge Extraction - Extract patterns, conventions, and implicit knowledge
// Learns coding style, naming conventions, architectural patterns, and team practices

use std::collections::{HashMap, HashSet};
use std::path::PathBuf;
use std::sync::Arc;
use serde::{Deserialize, Serialize};
use parking_lot::RwLock;
use glob;

use super::ast_engine::{ASTEngine, Language};
use super::symbol_table::{SymbolTable, Symbol, SymbolKind};

/// Extracted tribal knowledge from a codebase
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct TribalKnowledge {
    pub naming_conventions: NamingConventions,
    pub code_style: CodeStylePatterns,
    pub architecture: ArchitecturePatterns,
    pub idioms: Vec<CodeIdiom>,
    pub error_handling: ErrorHandlingPatterns,
    pub testing_patterns: TestingPatterns,
    pub documentation_patterns: DocumentationPatterns,
    pub confidence: HashMap<String, f32>,
    pub updated_at: u64,
}

/// Naming conventions detected in the codebase
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct NamingConventions {
    pub function_style: NamingStyle,
    pub variable_style: NamingStyle,
    pub class_style: NamingStyle,
    pub constant_style: NamingStyle,
    pub file_style: NamingStyle,
    pub common_prefixes: Vec<(String, usize)>,
    pub common_suffixes: Vec<(String, usize)>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Default, Serialize, Deserialize)]
pub enum NamingStyle {
    #[default]
    Unknown,
    CamelCase,
    PascalCase,
    SnakeCase,
    ScreamingSnake,
    KebabCase,
    Mixed,
}

impl NamingStyle {
    pub fn detect(name: &str) -> Self {
        if name.is_empty() { return Self::Unknown; }
        let has_underscore = name.contains('_');
        let has_hyphen = name.contains('-');
        let starts_upper = name.chars().next().map(|c| c.is_uppercase()).unwrap_or(false);
        let has_lower = name.chars().any(|c| c.is_lowercase());
        let all_upper = name.chars().filter(|c| c.is_alphabetic()).all(|c| c.is_uppercase());

        if has_hyphen { Self::KebabCase }
        else if has_underscore && all_upper { Self::ScreamingSnake }
        else if has_underscore { Self::SnakeCase }
        else if starts_upper && has_lower { Self::PascalCase }
        else if !starts_upper && has_lower { Self::CamelCase }
        else { Self::Unknown }
    }
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct CodeStylePatterns {
    pub indentation: IndentationStyle,
    pub max_line_length: Option<usize>,
    pub bracket_style: BracketStyle,
    pub trailing_commas: bool,
    pub quote_style: QuoteStyle,
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum IndentationStyle { #[default] Spaces2, Spaces4, Tabs, Mixed }

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum BracketStyle { #[default] SameLine, NextLine, Mixed }

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum QuoteStyle { Single, #[default] Double, Mixed }

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ArchitecturePatterns {
    pub layer_structure: Vec<String>,
    pub common_directories: Vec<(String, String)>,
    pub module_patterns: Vec<String>,
    pub dependency_direction: DependencyDirection,
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
pub enum DependencyDirection { #[default] Unknown, TopDown, BottomUp, Layered }

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodeIdiom {
    pub name: String,
    pub pattern: String,
    pub frequency: usize,
    pub examples: Vec<String>,
    pub language: Option<Language>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ErrorHandlingPatterns {
    pub style: ErrorHandlingStyle,
    pub common_error_types: Vec<String>,
    pub uses_result_type: bool,
    pub uses_exceptions: bool,
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
pub enum ErrorHandlingStyle { #[default] Unknown, ResultBased, ExceptionBased, Mixed }

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct TestingPatterns {
    pub framework: Option<String>,
    pub naming_pattern: Option<String>,
    pub directory_structure: Option<String>,
    pub coverage_threshold: Option<f32>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct DocumentationPatterns {
    pub doc_style: DocStyle,
    pub required_sections: Vec<String>,
    pub example_usage: bool,
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
pub enum DocStyle { #[default] Unknown, JSDoc, RustDoc, PyDoc, JavaDoc }

/// Tribal Knowledge Extractor
pub struct TribalKnowledgeExtractor {
    ast_engine: Arc<ASTEngine>,
    symbol_table: Arc<SymbolTable>,
    knowledge: RwLock<TribalKnowledge>,
    project_root: PathBuf,
}

impl TribalKnowledgeExtractor {
    pub fn new(
        project_root: PathBuf,
        ast_engine: Arc<ASTEngine>,
        symbol_table: Arc<SymbolTable>,
    ) -> Self {
        Self {
            ast_engine,
            symbol_table,
            knowledge: RwLock::new(TribalKnowledge::default()),
            project_root,
        }
    }

    /// Extract tribal knowledge from the indexed codebase
    pub async fn extract(&self) -> Result<TribalKnowledge, String> {
        let symbols = self.symbol_table.get_all_exports();
        
        // Extract naming conventions
        let naming = self.extract_naming_conventions(&symbols);
        
        // Extract code style
        let style = self.extract_code_style().await?;
        
        // Extract architecture patterns
        let architecture = self.extract_architecture_patterns();
        
        // Extract idioms
        let idioms = self.extract_idioms(&symbols);
        
        // Extract error handling patterns
        let error_handling = self.extract_error_handling(&symbols);
        
        // Extract testing patterns
        let testing = self.extract_testing_patterns();
        
        // Extract documentation patterns
        let documentation = self.extract_documentation_patterns(&symbols);

        let mut knowledge = self.knowledge.write();
        knowledge.naming_conventions = naming;
        knowledge.code_style = style;
        knowledge.architecture = architecture;
        knowledge.idioms = idioms;
        knowledge.error_handling = error_handling;
        knowledge.testing_patterns = testing;
        knowledge.documentation_patterns = documentation;
        knowledge.updated_at = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        Ok(knowledge.clone())
    }

    fn extract_naming_conventions(&self, symbols: &[Symbol]) -> NamingConventions {
        let mut func_styles: HashMap<NamingStyle, usize> = HashMap::new();
        let mut var_styles: HashMap<NamingStyle, usize> = HashMap::new();
        let mut class_styles: HashMap<NamingStyle, usize> = HashMap::new();
        let mut prefixes: HashMap<String, usize> = HashMap::new();
        let mut suffixes: HashMap<String, usize> = HashMap::new();

        for symbol in symbols {
            let style = NamingStyle::detect(&symbol.name);
            match symbol.kind {
                SymbolKind::Function | SymbolKind::Method => {
                    *func_styles.entry(style).or_insert(0) += 1;
                    self.extract_affixes(&symbol.name, &mut prefixes, &mut suffixes);
                }
                SymbolKind::Variable | SymbolKind::Parameter => {
                    *var_styles.entry(style).or_insert(0) += 1;
                }
                SymbolKind::Class | SymbolKind::Interface | SymbolKind::Struct => {
                    *class_styles.entry(style).or_insert(0) += 1;
                }
                _ => {}
            }
        }

        NamingConventions {
            function_style: Self::dominant_style(&func_styles),
            variable_style: Self::dominant_style(&var_styles),
            class_style: Self::dominant_style(&class_styles),
            constant_style: NamingStyle::ScreamingSnake,
            file_style: NamingStyle::Unknown,
            common_prefixes: Self::top_affixes(&prefixes, 10),
            common_suffixes: Self::top_affixes(&suffixes, 10),
        }
    }

    fn extract_affixes(&self, name: &str, prefixes: &mut HashMap<String, usize>, suffixes: &mut HashMap<String, usize>) {
        let common_prefixes = ["get", "set", "is", "has", "can", "should", "will", "on", "handle", "create", "delete", "update", "fetch", "load", "save", "validate", "parse", "format", "to", "from"];
        let common_suffixes = ["Handler", "Service", "Controller", "Manager", "Factory", "Builder", "Provider", "Repository", "Adapter", "Listener", "Observer", "Callback", "Error", "Exception", "Result", "Response", "Request"];

        for prefix in &common_prefixes {
            if name.to_lowercase().starts_with(&prefix.to_lowercase()) {
                *prefixes.entry(prefix.to_string()).or_insert(0) += 1;
            }
        }

        for suffix in &common_suffixes {
            if name.ends_with(suffix) {
                *suffixes.entry(suffix.to_string()).or_insert(0) += 1;
            }
        }
    }

    fn dominant_style(styles: &HashMap<NamingStyle, usize>) -> NamingStyle {
        styles.iter()
            .max_by_key(|(_, count)| *count)
            .map(|(style, _)| *style)
            .unwrap_or(NamingStyle::Unknown)
    }

    fn top_affixes(affixes: &HashMap<String, usize>, limit: usize) -> Vec<(String, usize)> {
        let mut sorted: Vec<_> = affixes.iter().map(|(k, v)| (k.clone(), *v)).collect();
        sorted.sort_by(|a, b| b.1.cmp(&a.1));
        sorted.into_iter().take(limit).collect()
    }

    async fn extract_code_style(&self) -> Result<CodeStylePatterns, String> {
        let mut indentation_counts: HashMap<IndentationStyle, usize> = HashMap::new();
        let mut bracket_counts: HashMap<BracketStyle, usize> = HashMap::new();
        let mut quote_counts: HashMap<QuoteStyle, usize> = HashMap::new();
        let mut max_lines: Vec<usize> = Vec::new();

        // Sample files for style analysis
        let extensions = ["ts", "js", "rs", "py", "go", "java"];
        for ext in &extensions {
            let pattern = format!("**/*.{}", ext);
            if let Ok(files) = glob::glob(&self.project_root.join(&pattern).to_string_lossy()) {
                for entry in files.filter_map(|e| e.ok()).take(20) {
                    if let Ok(content) = std::fs::read_to_string(&entry) {
                        self.analyze_file_style(&content, &mut indentation_counts, &mut bracket_counts, &mut quote_counts, &mut max_lines);
                    }
                }
            }
        }

        Ok(CodeStylePatterns {
            indentation: Self::dominant_indent(&indentation_counts),
            max_line_length: max_lines.iter().max().copied(),
            bracket_style: Self::dominant_bracket(&bracket_counts),
            trailing_commas: false,
            quote_style: Self::dominant_quote(&quote_counts),
        })
    }

    fn analyze_file_style(
        &self,
        content: &str,
        indentation: &mut HashMap<IndentationStyle, usize>,
        brackets: &mut HashMap<BracketStyle, usize>,
        quotes: &mut HashMap<QuoteStyle, usize>,
        max_lines: &mut Vec<usize>,
    ) {
        for line in content.lines() {
            max_lines.push(line.len());

            // Check indentation
            if line.starts_with("    ") {
                *indentation.entry(IndentationStyle::Spaces4).or_insert(0) += 1;
            } else if line.starts_with("  ") && !line.starts_with("    ") {
                *indentation.entry(IndentationStyle::Spaces2).or_insert(0) += 1;
            } else if line.starts_with('\t') {
                *indentation.entry(IndentationStyle::Tabs).or_insert(0) += 1;
            }

            // Check bracket style
            if line.contains(") {") || line.contains("=> {") {
                *brackets.entry(BracketStyle::SameLine).or_insert(0) += 1;
            } else if line.trim() == "{" {
                *brackets.entry(BracketStyle::NextLine).or_insert(0) += 1;
            }

            // Check quote style
            let single_count = line.matches('\'').count();
            let double_count = line.matches('"').count();
            if single_count > double_count {
                *quotes.entry(QuoteStyle::Single).or_insert(0) += 1;
            } else if double_count > single_count {
                *quotes.entry(QuoteStyle::Double).or_insert(0) += 1;
            }
        }
    }

    fn dominant_indent(counts: &HashMap<IndentationStyle, usize>) -> IndentationStyle {
        counts.iter().max_by_key(|(_, c)| *c).map(|(s, _)| *s).unwrap_or_default()
    }

    fn dominant_bracket(counts: &HashMap<BracketStyle, usize>) -> BracketStyle {
        counts.iter().max_by_key(|(_, c)| *c).map(|(s, _)| *s).unwrap_or_default()
    }

    fn dominant_quote(counts: &HashMap<QuoteStyle, usize>) -> QuoteStyle {
        counts.iter().max_by_key(|(_, c)| *c).map(|(s, _)| *s).unwrap_or_default()
    }

    fn extract_architecture_patterns(&self) -> ArchitecturePatterns {
        let mut layers = Vec::new();
        let mut directories: Vec<(String, String)> = Vec::new();

        // Common architectural directories
        let arch_dirs = [
            ("src", "Source code"),
            ("lib", "Library code"),
            ("app", "Application code"),
            ("api", "API layer"),
            ("services", "Business logic"),
            ("controllers", "Request handlers"),
            ("models", "Data models"),
            ("views", "View templates"),
            ("components", "UI components"),
            ("utils", "Utilities"),
            ("helpers", "Helper functions"),
            ("middleware", "Middleware"),
            ("routes", "Route definitions"),
            ("config", "Configuration"),
            ("tests", "Test files"),
            ("__tests__", "Jest tests"),
            ("spec", "Spec files"),
        ];

        for (dir, desc) in &arch_dirs {
            if self.project_root.join(dir).exists() {
                layers.push(dir.to_string());
                directories.push((dir.to_string(), desc.to_string()));
            }
        }

        ArchitecturePatterns {
            layer_structure: layers,
            common_directories: directories,
            module_patterns: Vec::new(),
            dependency_direction: DependencyDirection::Unknown,
        }
    }

    fn extract_idioms(&self, symbols: &[Symbol]) -> Vec<CodeIdiom> {
        let mut idioms = Vec::new();
        let mut pattern_counts: HashMap<String, usize> = HashMap::new();

        for symbol in symbols {
            // Detect common patterns
            if symbol.name.starts_with("use") && symbol.name.len() > 3 {
                *pattern_counts.entry("use_prefix_hooks".to_string()).or_insert(0) += 1;
            }
            if symbol.name.ends_with("Impl") {
                *pattern_counts.entry("impl_suffix".to_string()).or_insert(0) += 1;
            }
            if symbol.name.contains("Factory") {
                *pattern_counts.entry("factory_pattern".to_string()).or_insert(0) += 1;
            }
            if symbol.name.contains("Builder") {
                *pattern_counts.entry("builder_pattern".to_string()).or_insert(0) += 1;
            }
            if symbol.name.contains("Singleton") {
                *pattern_counts.entry("singleton_pattern".to_string()).or_insert(0) += 1;
            }
        }

        for (pattern, count) in pattern_counts {
            if count >= 2 {
                idioms.push(CodeIdiom {
                    name: pattern.clone(),
                    pattern: pattern,
                    frequency: count,
                    examples: Vec::new(),
                    language: None,
                });
            }
        }

        idioms
    }

    fn extract_error_handling(&self, symbols: &[Symbol]) -> ErrorHandlingPatterns {
        let mut uses_result = false;
        let mut uses_exceptions = false;
        let mut error_types: HashSet<String> = HashSet::new();

        for symbol in symbols {
            if symbol.name.contains("Result") || symbol.name.contains("Error") {
                uses_result = true;
            }
            if symbol.name.contains("Exception") || symbol.name.contains("throw") {
                uses_exceptions = true;
            }
            if symbol.name.ends_with("Error") || symbol.name.ends_with("Exception") {
                error_types.insert(symbol.name.clone());
            }
        }

        ErrorHandlingPatterns {
            style: if uses_result && !uses_exceptions {
                ErrorHandlingStyle::ResultBased
            } else if uses_exceptions && !uses_result {
                ErrorHandlingStyle::ExceptionBased
            } else if uses_result && uses_exceptions {
                ErrorHandlingStyle::Mixed
            } else {
                ErrorHandlingStyle::Unknown
            },
            common_error_types: error_types.into_iter().collect(),
            uses_result_type: uses_result,
            uses_exceptions,
        }
    }

    fn extract_testing_patterns(&self) -> TestingPatterns {
        let mut framework = None;
        let mut directory = None;

        // Detect testing framework
        if self.project_root.join("jest.config.js").exists() || 
           self.project_root.join("jest.config.ts").exists() {
            framework = Some("jest".to_string());
        } else if self.project_root.join("vitest.config.ts").exists() {
            framework = Some("vitest".to_string());
        } else if self.project_root.join("pytest.ini").exists() ||
                  self.project_root.join("pyproject.toml").exists() {
            framework = Some("pytest".to_string());
        }

        // Detect test directory
        for dir in &["tests", "__tests__", "test", "spec"] {
            if self.project_root.join(dir).exists() {
                directory = Some(dir.to_string());
                break;
            }
        }

        TestingPatterns {
            framework,
            naming_pattern: Some("test_*".to_string()),
            directory_structure: directory,
            coverage_threshold: None,
        }
    }

    fn extract_documentation_patterns(&self, symbols: &[Symbol]) -> DocumentationPatterns {
        let mut doc_style = DocStyle::Unknown;
        let mut has_examples = false;

        for symbol in symbols.iter().take(100) {
            if let Some(ref doc) = symbol.documentation {
                if doc.contains("@param") || doc.contains("@returns") {
                    doc_style = DocStyle::JSDoc;
                } else if doc.contains("///") || doc.contains("//!") {
                    doc_style = DocStyle::RustDoc;
                } else if doc.contains("\"\"\"") || doc.contains(":param") {
                    doc_style = DocStyle::PyDoc;
                }
                if doc.contains("example") || doc.contains("Example") {
                    has_examples = true;
                }
            }
        }

        DocumentationPatterns {
            doc_style,
            required_sections: Vec::new(),
            example_usage: has_examples,
        }
    }

    /// Get the current extracted knowledge
    pub fn get_knowledge(&self) -> TribalKnowledge {
        self.knowledge.read().clone()
    }

    /// Format tribal knowledge for LLM context
    pub fn format_for_llm(&self) -> String {
        let knowledge = self.knowledge.read();
        let mut output = String::from("# Project Coding Conventions\n\n");

        output.push_str("## Naming Conventions\n");
        output.push_str(&format!("- Functions: {}\n", knowledge.naming_conventions.function_style.to_example()));
        output.push_str(&format!("- Variables: {}\n", knowledge.naming_conventions.variable_style.to_example()));
        output.push_str(&format!("- Classes: {}\n", knowledge.naming_conventions.class_style.to_example()));
        
        if !knowledge.naming_conventions.common_prefixes.is_empty() {
            output.push_str("- Common prefixes: ");
            output.push_str(&knowledge.naming_conventions.common_prefixes.iter()
                .take(5)
                .map(|(p, _)| p.as_str())
                .collect::<Vec<_>>()
                .join(", "));
            output.push('\n');
        }

        output.push_str("\n## Code Style\n");
        output.push_str(&format!("- Indentation: {:?}\n", knowledge.code_style.indentation));
        output.push_str(&format!("- Brackets: {:?}\n", knowledge.code_style.bracket_style));
        output.push_str(&format!("- Quotes: {:?}\n", knowledge.code_style.quote_style));

        if !knowledge.architecture.layer_structure.is_empty() {
            output.push_str("\n## Architecture\n");
            output.push_str("- Layers: ");
            output.push_str(&knowledge.architecture.layer_structure.join(", "));
            output.push('\n');
        }

        output.push_str(&format!("\n## Error Handling: {:?}\n", knowledge.error_handling.style));
        
        if let Some(ref framework) = knowledge.testing_patterns.framework {
            output.push_str(&format!("\n## Testing: {}\n", framework));
        }

        output
    }
}

impl NamingStyle {
    pub fn to_example(&self) -> &'static str {
        match self {
            Self::CamelCase => "camelCase",
            Self::PascalCase => "PascalCase",
            Self::SnakeCase => "snake_case",
            Self::ScreamingSnake => "SCREAMING_SNAKE",
            Self::KebabCase => "kebab-case",
            _ => "mixed/unknown",
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_naming_style_detection() {
        assert_eq!(NamingStyle::detect("camelCase"), NamingStyle::CamelCase);
        assert_eq!(NamingStyle::detect("PascalCase"), NamingStyle::PascalCase);
        assert_eq!(NamingStyle::detect("snake_case"), NamingStyle::SnakeCase);
        assert_eq!(NamingStyle::detect("SCREAMING_SNAKE"), NamingStyle::ScreamingSnake);
        assert_eq!(NamingStyle::detect("kebab-case"), NamingStyle::KebabCase);
    }
}
