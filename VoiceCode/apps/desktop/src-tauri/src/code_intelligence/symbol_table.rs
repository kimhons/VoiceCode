#![allow(dead_code, unused_variables, unused_imports)]
// Phase 1.2: Symbol Table & Cross-File Resolution
// Provides project-wide symbol indexing and reference resolution

use std::collections::{HashMap, HashSet};
use std::path::{Path, PathBuf};
use serde::{Deserialize, Serialize};
use dashmap::DashMap;
use parking_lot::RwLock;

use super::ast_engine::{
    Language, CodeStructure, SourceRange, FunctionDefinition,
    ClassDefinition, TypeDefinition, VariableDeclaration, ImportDeclaration, Visibility,
};

/// Kind of symbol
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SymbolKind {
    Function,
    Method,
    Class,
    Interface,
    Struct,
    Trait,
    Enum,
    EnumMember,
    Type,
    TypeAlias,
    Variable,
    Constant,
    Property,
    Field,
    Parameter,
    Module,
    Namespace,
    Import,
    Export,
}

impl SymbolKind {
    pub fn from_class_kind(kind: &super::ast_engine::ClassKind) -> Self {
        match kind {
            super::ast_engine::ClassKind::Class => SymbolKind::Class,
            super::ast_engine::ClassKind::Interface => SymbolKind::Interface,
            super::ast_engine::ClassKind::Struct => SymbolKind::Struct,
            super::ast_engine::ClassKind::Trait => SymbolKind::Trait,
            super::ast_engine::ClassKind::Enum => SymbolKind::Enum,
            super::ast_engine::ClassKind::TypeAlias => SymbolKind::TypeAlias,
        }
    }
}

/// A symbol in the codebase
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Symbol {
    /// Unique identifier
    pub id: String,
    /// Symbol name
    pub name: String,
    /// Qualified name (e.g., "MyClass.myMethod")
    pub qualified_name: String,
    /// Kind of symbol
    pub kind: SymbolKind,
    /// File path where defined
    pub file_path: PathBuf,
    /// Source range
    pub range: SourceRange,
    /// Signature (for functions/methods)
    pub signature: Option<String>,
    /// Type annotation
    pub type_annotation: Option<String>,
    /// Documentation
    pub documentation: Option<String>,
    /// Visibility
    pub visibility: Visibility,
    /// Is exported?
    pub is_exported: bool,
    /// Parent symbol (for nested symbols)
    pub parent: Option<String>,
    /// Children symbols
    pub children: Vec<String>,
    /// Language
    pub language: Language,
}

impl Symbol {
    /// Create from a function definition
    pub fn from_function(func: &FunctionDefinition, file_path: &Path, language: Language, parent: Option<&str>) -> Self {
        let qualified_name = if let Some(p) = parent {
            format!("{}.{}", p, func.name)
        } else {
            func.name.clone()
        };

        Self {
            id: format!("{}::{}", file_path.display(), qualified_name),
            name: func.name.clone(),
            qualified_name,
            kind: if parent.is_some() { SymbolKind::Method } else { SymbolKind::Function },
            file_path: file_path.to_path_buf(),
            range: func.range.clone(),
            signature: Some(func.signature.clone()),
            type_annotation: func.return_type.clone(),
            documentation: func.docstring.clone(),
            visibility: func.visibility,
            is_exported: func.is_exported,
            parent: parent.map(String::from),
            children: Vec::new(),
            language,
        }
    }

    /// Create from a class definition
    pub fn from_class(class: &ClassDefinition, file_path: &Path, language: Language) -> Self {
        let children: Vec<String> = class.methods.iter()
            .map(|m| format!("{}::{}.{}", file_path.display(), class.name, m.name))
            .chain(class.properties.iter().map(|p| {
                format!("{}::{}.{}", file_path.display(), class.name, p.name)
            }))
            .collect();

        Self {
            id: format!("{}::{}", file_path.display(), class.name),
            name: class.name.clone(),
            qualified_name: class.name.clone(),
            kind: SymbolKind::from_class_kind(&class.kind),
            file_path: file_path.to_path_buf(),
            range: class.range.clone(),
            signature: None,
            type_annotation: None,
            documentation: class.docstring.clone(),
            visibility: if class.is_exported { Visibility::Public } else { Visibility::Default },
            is_exported: class.is_exported,
            parent: None,
            children,
            language,
        }
    }

    /// Create from a type definition
    pub fn from_type(type_def: &TypeDefinition, file_path: &Path, language: Language) -> Self {
        Self {
            id: format!("{}::{}", file_path.display(), type_def.name),
            name: type_def.name.clone(),
            qualified_name: type_def.name.clone(),
            kind: SymbolKind::Type,
            file_path: file_path.to_path_buf(),
            range: type_def.range.clone(),
            signature: None,
            type_annotation: Some(type_def.definition.clone()),
            documentation: type_def.docstring.clone(),
            visibility: if type_def.is_exported { Visibility::Public } else { Visibility::Default },
            is_exported: type_def.is_exported,
            parent: None,
            children: Vec::new(),
            language,
        }
    }

    /// Create from a variable declaration
    pub fn from_variable(var: &VariableDeclaration, file_path: &Path, language: Language) -> Self {
        let kind = match var.kind {
            super::ast_engine::VariableKind::Const => SymbolKind::Constant,
            super::ast_engine::VariableKind::Static => SymbolKind::Constant,
            _ => SymbolKind::Variable,
        };

        Self {
            id: format!("{}::{}", file_path.display(), var.name),
            name: var.name.clone(),
            qualified_name: var.name.clone(),
            kind,
            file_path: file_path.to_path_buf(),
            range: var.range.clone(),
            signature: None,
            type_annotation: var.type_annotation.clone(),
            documentation: None,
            visibility: if var.is_exported { Visibility::Public } else { Visibility::Default },
            is_exported: var.is_exported,
            parent: None,
            children: Vec::new(),
            language,
        }
    }

    /// Get line number (convenience accessor)
    pub fn line(&self) -> usize {
        self.range.start_line
    }

    /// Get end line number (convenience accessor)
    pub fn end_line(&self) -> usize {
        self.range.end_line
    }
}

/// A reference to a symbol
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SymbolReference {
    /// The symbol being referenced
    pub symbol_id: String,
    /// File containing the reference
    pub file_path: PathBuf,
    /// Range of the reference
    pub range: SourceRange,
    /// Is this a write (mutation)?
    pub is_write: bool,
    /// Context (containing function/class)
    pub context: Option<String>,
}

/// Import resolution result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResolvedImport {
    /// Original import declaration
    pub import: ImportDeclaration,
    /// Resolved file path
    pub resolved_path: Option<PathBuf>,
    /// Resolved symbols
    pub resolved_symbols: Vec<String>,
    /// Is external package?
    pub is_external: bool,
}

/// Dependency edge in the graph
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DependencyEdge {
    /// Source file
    pub from: PathBuf,
    /// Target file
    pub to: PathBuf,
    /// Imported symbols
    pub symbols: Vec<String>,
    /// Is re-export?
    pub is_reexport: bool,
}

/// Symbol table for the project
pub struct SymbolTable {
    /// All symbols indexed by ID
    symbols_by_id: DashMap<String, Symbol>,
    /// Symbols indexed by name (for fuzzy search)
    symbols_by_name: DashMap<String, Vec<String>>,
    /// Symbols indexed by file
    symbols_by_file: DashMap<PathBuf, Vec<String>>,
    /// Exported symbols per file
    exports_by_file: DashMap<PathBuf, Vec<String>>,
    /// Import resolutions
    resolved_imports: DashMap<PathBuf, Vec<ResolvedImport>>,
    /// Dependency graph edges
    dependencies: RwLock<Vec<DependencyEdge>>,
    /// Project root
    project_root: RwLock<Option<PathBuf>>,
    /// References to symbols
    references: DashMap<String, Vec<SymbolReference>>,
}

impl std::fmt::Debug for SymbolTable {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("SymbolTable")
            .field("symbol_count", &self.symbols_by_id.len())
            .field("file_count", &self.symbols_by_file.len())
            .field("export_count", &self.exports_by_file.len())
            .finish()
    }
}

impl SymbolTable {
    pub fn new() -> Self {
        Self {
            symbols_by_id: DashMap::new(),
            symbols_by_name: DashMap::new(),
            symbols_by_file: DashMap::new(),
            exports_by_file: DashMap::new(),
            resolved_imports: DashMap::new(),
            dependencies: RwLock::new(Vec::new()),
            project_root: RwLock::new(None),
            references: DashMap::new(),
        }
    }

    /// Set project root
    pub fn set_project_root(&self, root: PathBuf) {
        *self.project_root.write() = Some(root);
    }

    /// Get project root
    pub fn project_root(&self) -> Option<PathBuf> {
        self.project_root.read().clone()
    }

    /// Index symbols from a code structure
    pub fn index_structure(&self, structure: &CodeStructure) {
        let file_path = &structure.file_path;
        let language = structure.language;

        // Clear existing symbols for this file
        self.remove_file_symbols(file_path);

        let mut file_symbols = Vec::new();
        let mut file_exports = Vec::new();

        // Index functions
        for func in &structure.functions {
            let symbol = Symbol::from_function(func, file_path, language, None);
            let symbol_id = symbol.id.clone();

            if symbol.is_exported {
                file_exports.push(symbol_id.clone());
            }

            self.add_symbol(symbol);
            file_symbols.push(symbol_id);
        }

        // Index classes
        for class in &structure.classes {
            let class_symbol = Symbol::from_class(class, file_path, language);
            let class_id = class_symbol.id.clone();

            if class_symbol.is_exported {
                file_exports.push(class_id.clone());
            }

            self.add_symbol(class_symbol);
            file_symbols.push(class_id.clone());

            // Index methods
            for method in &class.methods {
                let method_symbol = Symbol::from_function(method, file_path, language, Some(&class.name));
                let method_id = method_symbol.id.clone();
                self.add_symbol(method_symbol);
                file_symbols.push(method_id);
            }

            // Index properties
            for prop in &class.properties {
                let prop_symbol = Symbol {
                    id: format!("{}::{}.{}", file_path.display(), class.name, prop.name),
                    name: prop.name.clone(),
                    qualified_name: format!("{}.{}", class.name, prop.name),
                    kind: SymbolKind::Property,
                    file_path: file_path.clone(),
                    range: prop.range.clone(),
                    signature: None,
                    type_annotation: prop.type_annotation.clone(),
                    documentation: None,
                    visibility: prop.visibility,
                    is_exported: false,
                    parent: Some(class.name.clone()),
                    children: Vec::new(),
                    language,
                };
                let prop_id = prop_symbol.id.clone();
                self.add_symbol(prop_symbol);
                file_symbols.push(prop_id);
            }
        }

        // Index types
        for type_def in &structure.types {
            let symbol = Symbol::from_type(type_def, file_path, language);
            let symbol_id = symbol.id.clone();

            if symbol.is_exported {
                file_exports.push(symbol_id.clone());
            }

            self.add_symbol(symbol);
            file_symbols.push(symbol_id);
        }

        // Index variables
        for var in &structure.variables {
            let symbol = Symbol::from_variable(var, file_path, language);
            let symbol_id = symbol.id.clone();

            if symbol.is_exported {
                file_exports.push(symbol_id.clone());
            }

            self.add_symbol(symbol);
            file_symbols.push(symbol_id);
        }

        // Store file symbols
        self.symbols_by_file.insert(file_path.clone(), file_symbols);
        self.exports_by_file.insert(file_path.clone(), file_exports);

        // Resolve imports
        self.resolve_file_imports(file_path, &structure.imports);
    }

    /// Add a symbol to the table
    fn add_symbol(&self, symbol: Symbol) {
        let id = symbol.id.clone();
        let name = symbol.name.clone();

        self.symbols_by_id.insert(id.clone(), symbol);

        self.symbols_by_name
            .entry(name.to_lowercase())
            .or_insert_with(Vec::new)
            .push(id);
    }

    /// Remove all symbols for a file
    pub fn remove_file_symbols(&self, file_path: &Path) {
        if let Some((_, symbol_ids)) = self.symbols_by_file.remove(file_path) {
            for id in symbol_ids {
                if let Some((_, symbol)) = self.symbols_by_id.remove(&id) {
                    // Remove from name index
                    let name_lower = symbol.name.to_lowercase();
                    if let Some(mut entry) = self.symbols_by_name.get_mut(&name_lower) {
                        entry.retain(|s| s != &id);
                    }
                }

                // Remove references
                self.references.remove(&id);
            }
        }

        self.exports_by_file.remove(file_path);
        self.resolved_imports.remove(file_path);
    }

    /// Resolve imports for a file
    fn resolve_file_imports(&self, file_path: &Path, imports: &[ImportDeclaration]) {
        let mut resolved = Vec::new();

        for import in imports {
            let resolved_import = self.resolve_import(file_path, import);
            resolved.push(resolved_import);
        }

        self.resolved_imports.insert(file_path.to_path_buf(), resolved);
    }

    /// Resolve a single import
    fn resolve_import(&self, from_file: &Path, import: &ImportDeclaration) -> ResolvedImport {
        let source = &import.source;

        // Check if external package
        let is_external = !source.starts_with('.') && !source.starts_with('/');

        if is_external {
            return ResolvedImport {
                import: import.clone(),
                resolved_path: None,
                resolved_symbols: Vec::new(),
                is_external: true,
            };
        }

        // Resolve relative path
        let resolved_path = self.resolve_relative_path(from_file, source);

        let resolved_symbols = if let Some(ref path) = resolved_path {
            // Get exported symbols from resolved file
            self.exports_by_file
                .get(path)
                .map(|exports| exports.clone())
                .unwrap_or_default()
        } else {
            Vec::new()
        };

        ResolvedImport {
            import: import.clone(),
            resolved_path,
            resolved_symbols,
            is_external: false,
        }
    }

    /// Resolve a relative import path
    fn resolve_relative_path(&self, from_file: &Path, source: &str) -> Option<PathBuf> {
        let from_dir = from_file.parent()?;

        // Common extensions to try
        let extensions = ["", ".ts", ".tsx", ".js", ".jsx", ".py", ".rs", "/index.ts", "/index.js"];

        for ext in &extensions {
            let candidate = from_dir.join(format!("{}{}", source, ext));
            if candidate.exists() {
                return Some(candidate);
            }
        }

        // Try exact path
        let exact = from_dir.join(source);
        if exact.exists() {
            return Some(exact);
        }

        None
    }

    /// Find a symbol by name
    pub fn find_by_name(&self, name: &str) -> Vec<Symbol> {
        let name_lower = name.to_lowercase();

        self.symbols_by_name
            .get(&name_lower)
            .map(|ids| {
                ids.iter()
                    .filter_map(|id| self.symbols_by_id.get(id).map(|s| s.clone()))
                    .collect()
            })
            .unwrap_or_default()
    }

    /// Find a symbol by ID
    pub fn find_by_id(&self, id: &str) -> Option<Symbol> {
        self.symbols_by_id.get(id).map(|s| s.clone())
    }

    /// Find symbols in a file
    pub fn find_in_file(&self, file_path: &Path) -> Vec<Symbol> {
        self.symbols_by_file
            .get(file_path)
            .map(|ids| {
                ids.iter()
                    .filter_map(|id| self.symbols_by_id.get(id).map(|s| s.clone()))
                    .collect()
            })
            .unwrap_or_default()
    }

    /// Search symbols with a query (fuzzy matching)
    pub fn search(&self, query: &str, limit: usize) -> Vec<Symbol> {
        let query_lower = query.to_lowercase();
        let mut results = Vec::new();
        let mut seen = HashSet::new();

        // Exact match first
        if let Some(ids) = self.symbols_by_name.get(&query_lower) {
            for id in ids.iter() {
                if let Some(symbol) = self.symbols_by_id.get(id) {
                    if seen.insert(id.clone()) {
                        results.push(symbol.clone());
                    }
                }
            }
        }

        // Prefix match
        for entry in self.symbols_by_name.iter() {
            if entry.key().starts_with(&query_lower) {
                for id in entry.value().iter() {
                    if let Some(symbol) = self.symbols_by_id.get(id) {
                        if seen.insert(id.clone()) {
                            results.push(symbol.clone());
                        }
                    }
                }
            }

            if results.len() >= limit {
                break;
            }
        }

        // Contains match
        if results.len() < limit {
            for entry in self.symbols_by_name.iter() {
                if entry.key().contains(&query_lower) {
                    for id in entry.value().iter() {
                        if let Some(symbol) = self.symbols_by_id.get(id) {
                            if seen.insert(id.clone()) {
                                results.push(symbol.clone());
                            }
                        }
                    }
                }

                if results.len() >= limit {
                    break;
                }
            }
        }

        results.truncate(limit);
        results
    }

    /// Find definition of a symbol used at a location
    pub fn find_definition(&self, file_path: &Path, name: &str) -> Option<Symbol> {
        // First, check if it's a local symbol in the same file
        if let Some(ids) = self.symbols_by_file.get(file_path) {
            for id in ids.iter() {
                if let Some(symbol) = self.symbols_by_id.get(id) {
                    if symbol.name == name {
                        return Some(symbol.clone());
                    }
                }
            }
        }

        // Check imported symbols
        if let Some(imports) = self.resolved_imports.get(file_path) {
            for resolved in imports.iter() {
                for specifier in &resolved.import.specifiers {
                    let matched_name = specifier.alias.as_ref().unwrap_or(&specifier.name);
                    if matched_name == name {
                        // Find the symbol in the resolved file
                        if let Some(ref resolved_path) = resolved.resolved_path {
                            if let Some(ids) = self.symbols_by_file.get(resolved_path) {
                                for id in ids.iter() {
                                    if let Some(symbol) = self.symbols_by_id.get(id) {
                                        if symbol.name == specifier.name {
                                            return Some(symbol.clone());
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Global search
        let matches = self.find_by_name(name);
        if matches.len() == 1 {
            return Some(matches.into_iter().next().unwrap());
        }

        // Return first exported match
        matches.into_iter().find(|s| s.is_exported)
    }

    /// Find all references to a symbol
    pub fn find_references(&self, symbol_id: &str) -> Vec<SymbolReference> {
        self.references
            .get(symbol_id)
            .map(|refs| refs.clone())
            .unwrap_or_default()
    }

    /// Add a reference to a symbol
    pub fn add_reference(&self, symbol_id: String, reference: SymbolReference) {
        self.references
            .entry(symbol_id)
            .or_insert_with(Vec::new)
            .push(reference);
    }

    /// Get dependency graph edges
    pub fn get_dependencies(&self) -> Vec<DependencyEdge> {
        self.dependencies.read().clone()
    }

    /// Add a dependency edge
    pub fn add_dependency(&self, from: PathBuf, to: PathBuf, symbols: Vec<String>, is_reexport: bool) {
        self.dependencies.write().push(DependencyEdge {
            from,
            to,
            symbols,
            is_reexport,
        });
    }

    /// Get files that import a given file
    pub fn get_importers(&self, file_path: &Path) -> Vec<PathBuf> {
        self.dependencies
            .read()
            .iter()
            .filter(|e| e.to == file_path)
            .map(|e| e.from.clone())
            .collect()
    }

    /// Get files that a given file imports
    pub fn get_imports(&self, file_path: &Path) -> Vec<PathBuf> {
        self.dependencies
            .read()
            .iter()
            .filter(|e| e.from == file_path)
            .map(|e| e.to.clone())
            .collect()
    }

    /// Get all exported symbols
    pub fn get_all_exports(&self) -> Vec<Symbol> {
        let mut exports = Vec::new();

        for entry in self.exports_by_file.iter() {
            for id in entry.value().iter() {
                if let Some(symbol) = self.symbols_by_id.get(id) {
                    exports.push(symbol.clone());
                }
            }
        }

        exports
    }

    /// Get symbol count
    pub fn symbol_count(&self) -> usize {
        self.symbols_by_id.len()
    }

    /// Get file count
    pub fn file_count(&self) -> usize {
        self.symbols_by_file.len()
    }

    /// Clear all symbols
    pub fn clear(&self) {
        self.symbols_by_id.clear();
        self.symbols_by_name.clear();
        self.symbols_by_file.clear();
        self.exports_by_file.clear();
        self.resolved_imports.clear();
        self.dependencies.write().clear();
        self.references.clear();
    }

    /// Get statistics
    pub fn stats(&self) -> SymbolTableStats {
        let mut kind_counts = HashMap::new();

        for entry in self.symbols_by_id.iter() {
            *kind_counts.entry(entry.kind).or_insert(0) += 1;
        }

        SymbolTableStats {
            total_symbols: self.symbols_by_id.len(),
            total_files: self.symbols_by_file.len(),
            total_exports: self.get_all_exports().len(),
            total_dependencies: self.dependencies.read().len(),
            symbols_by_kind: kind_counts,
        }
    }
}

impl Default for SymbolTable {
    fn default() -> Self {
        Self::new()
    }
}

/// Statistics about the symbol table
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SymbolTableStats {
    pub total_symbols: usize,
    pub total_files: usize,
    pub total_exports: usize,
    pub total_dependencies: usize,
    pub symbols_by_kind: HashMap<SymbolKind, usize>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::code_intelligence::ast_engine::ASTEngine;

    #[test]
    fn test_symbol_table_basic() {
        let table = SymbolTable::new();
        let engine = ASTEngine::new();

        let code = r#"
export function hello(name: string): string {
    return `Hello, ${name}!`;
}

export class Greeter {
    greet(): string {
        return "Hello!";
    }
}
"#;

        let path = Path::new("test.ts");
        let structure = engine.parse_structure(path, code).unwrap();
        table.index_structure(&structure);

        // Check symbol count
        assert!(table.symbol_count() > 0);

        // Find by name
        let hello = table.find_by_name("hello");
        assert!(!hello.is_empty());
        assert_eq!(hello[0].kind, SymbolKind::Function);

        let greeter = table.find_by_name("Greeter");
        assert!(!greeter.is_empty());
        assert_eq!(greeter[0].kind, SymbolKind::Class);
    }

    #[test]
    fn test_symbol_search() {
        let table = SymbolTable::new();
        let engine = ASTEngine::new();

        let code = r#"
export function getUserById(id: string): User {}
export function getUserByName(name: string): User {}
export function createUser(data: UserData): User {}
"#;

        let path = Path::new("test.ts");
        let structure = engine.parse_structure(path, code).unwrap();
        table.index_structure(&structure);

        // Search for "user"
        let results = table.search("user", 10);
        assert!(results.len() >= 2);

        // Search for "getuser"
        let results = table.search("getuser", 10);
        assert!(results.len() >= 2);
    }
}
