#![allow(dead_code, unused_variables, unused_imports)]
// Semantic Code Graph - Augment-style codebase understanding
// Builds a live semantic graph of the codebase for intelligent context retrieval

use std::collections::{HashMap, HashSet};
use std::path::{Path, PathBuf};
use std::sync::Arc;
use serde::{Deserialize, Serialize};
use parking_lot::RwLock;
use petgraph::graph::{DiGraph, NodeIndex};
use petgraph::Direction;
use uuid::Uuid;

use super::ast_engine::{ASTEngine, Language};
use super::symbol_table::SymbolTable;

/// Node types in the semantic code graph
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum GraphNodeType {
    /// A file in the codebase
    File,
    /// A module/package
    Module,
    /// A function or method
    Function,
    /// A class or struct
    Class,
    /// An interface or trait
    Interface,
    /// A type alias or typedef
    Type,
    /// A variable or constant
    Variable,
    /// An enum
    Enum,
    /// A namespace
    Namespace,
    /// External dependency
    ExternalDependency,
}

/// A node in the semantic code graph
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphNode {
    pub id: String,
    pub node_type: GraphNodeType,
    pub name: String,
    pub qualified_name: String,
    pub file_path: Option<PathBuf>,
    pub start_line: Option<usize>,
    pub end_line: Option<usize>,
    pub language: Option<Language>,
    pub visibility: Visibility,
    pub is_async: bool,
    pub is_static: bool,
    pub is_exported: bool,
    pub documentation: Option<String>,
    pub complexity: u32,
    pub metadata: HashMap<String, String>,
}

/// Visibility level
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Visibility {
    Public,
    Private,
    Protected,
    Internal,
    Unknown,
}

/// Edge types in the semantic code graph
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum GraphEdgeType {
    /// Function calls another function
    Calls,
    /// File/module imports another
    Imports,
    /// Class extends another
    Extends,
    /// Class/struct implements interface/trait
    Implements,
    /// Symbol uses/references another
    Uses,
    /// Symbol is defined in file/module
    DefinedIn,
    /// Symbol is member of class/module
    MemberOf,
    /// Type is generic parameter of
    TypeParameterOf,
    /// Return type relationship
    Returns,
    /// Parameter type relationship
    ParameterType,
    /// Variable has type
    HasType,
    /// Module re-exports symbol
    ReExports,
    /// Dependency relationship
    DependsOn,
    /// Test covers symbol
    Tests,
}

/// An edge in the semantic code graph
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphEdge {
    pub edge_type: GraphEdgeType,
    pub weight: f32,
    pub metadata: HashMap<String, String>,
}

/// The semantic code graph
pub struct CodeGraph {
    /// The underlying graph structure
    graph: DiGraph<GraphNode, GraphEdge>,
    /// Map from qualified name to node index
    name_to_node: HashMap<String, NodeIndex>,
    /// Map from file path to node indices
    file_to_nodes: HashMap<PathBuf, Vec<NodeIndex>>,
    /// AST engine for parsing
    ast_engine: Arc<ASTEngine>,
    /// Symbol table for lookups
    symbol_table: Arc<SymbolTable>,
    /// Graph version for cache invalidation
    version: u64,
    /// Project root
    project_root: PathBuf,
}

impl CodeGraph {
    pub fn new(
        project_root: PathBuf,
        ast_engine: Arc<ASTEngine>,
        symbol_table: Arc<SymbolTable>,
    ) -> Self {
        Self {
            graph: DiGraph::new(),
            name_to_node: HashMap::new(),
            file_to_nodes: HashMap::new(),
            ast_engine,
            symbol_table,
            version: 0,
            project_root,
        }
    }

    /// Build the graph from indexed files
    pub fn build_from_index(&mut self, files: &[PathBuf]) -> Result<GraphStats, String> {
        let mut stats = GraphStats::default();

        for file_path in files {
            if let Ok(file_stats) = self.add_file(file_path) {
                stats.files_processed += 1;
                stats.nodes_created += file_stats.nodes_created;
                stats.edges_created += file_stats.edges_created;
            }
        }

        // Build cross-file relationships
        self.build_cross_file_edges()?;

        self.version += 1;
        stats.version = self.version;

        Ok(stats)
    }

    /// Add a single file to the graph
    pub fn add_file(&mut self, file_path: &Path) -> Result<FileGraphStats, String> {
        let mut stats = FileGraphStats::default();

        // Read and parse the file
        let content = std::fs::read_to_string(file_path)
            .map_err(|e| format!("Failed to read file: {}", e))?;

        let parsed = self.ast_engine.parse_file(file_path, &content)?;
        let structure = self.ast_engine.extract_structure(&parsed)?;

        // Create file node
        let file_node = self.add_node(GraphNode {
            id: Uuid::new_v4().to_string(),
            node_type: GraphNodeType::File,
            name: file_path.file_name().unwrap_or_default().to_string_lossy().to_string(),
            qualified_name: file_path.to_string_lossy().to_string(),
            file_path: Some(file_path.to_path_buf()),
            start_line: Some(1),
            end_line: Some(content.lines().count()),
            language: Some(structure.language.clone()),
            visibility: Visibility::Public,
            is_async: false,
            is_static: false,
            is_exported: true,
            documentation: structure.module_doc.clone(),
            complexity: structure.complexity_score,
            metadata: HashMap::new(),
        });
        stats.nodes_created += 1;

        // Process imports
        for import in &structure.imports {
            let import_node = self.get_or_create_node(GraphNode {
                id: Uuid::new_v4().to_string(),
                node_type: GraphNodeType::Module,
                name: import.source.clone(),
                qualified_name: import.source.clone(),
                file_path: None,
                start_line: None,
                end_line: None,
                language: Some(structure.language.clone()),
                visibility: Visibility::Public,
                is_async: false,
                is_static: false,
                is_exported: true,
                documentation: None,
                complexity: 0,
                metadata: HashMap::new(),
            });

            self.add_edge(file_node, import_node, GraphEdge {
                edge_type: GraphEdgeType::Imports,
                weight: 1.0,
                metadata: HashMap::from([
                    ("specifiers".to_string(), import.specifiers.iter()
                        .map(|s| s.alias.as_ref().unwrap_or(&s.name).clone())
                        .collect::<Vec<_>>()
                        .join(", ")),
                ]),
            });
            stats.edges_created += 1;
        }

        // Process functions
        for func in &structure.functions {
            let func_node = self.add_node(GraphNode {
                id: Uuid::new_v4().to_string(),
                node_type: GraphNodeType::Function,
                name: func.name.clone(),
                qualified_name: format!("{}::{}", file_path.to_string_lossy(), func.name),
                file_path: Some(file_path.to_path_buf()),
                start_line: Some(func.range.start_line),
                end_line: Some(func.range.end_line),
                language: Some(structure.language.clone()),
                visibility: self.convert_visibility(&func.visibility),
                is_async: func.is_async,
                is_static: false, // FunctionDefinition doesn't have is_static
                is_exported: func.is_exported,
                documentation: func.docstring.clone(),
                complexity: func.complexity,
                metadata: HashMap::from([
                    ("params".to_string(), func.parameters.iter()
                        .map(|p| format!("{}: {}", p.name, p.type_annotation.as_deref().unwrap_or("any")))
                        .collect::<Vec<_>>()
                        .join(", ")),
                    ("return_type".to_string(), func.return_type.clone().unwrap_or_default()),
                ]),
            });
            stats.nodes_created += 1;

            // Link function to file
            self.add_edge(func_node, file_node, GraphEdge {
                edge_type: GraphEdgeType::DefinedIn,
                weight: 1.0,
                metadata: HashMap::new(),
            });
            stats.edges_created += 1;

            // Process function references (calls)
            for reference in func.references() {
                let ref_node = self.get_or_create_placeholder(&reference, &structure.language);
                self.add_edge(func_node, ref_node, GraphEdge {
                    edge_type: GraphEdgeType::Calls,
                    weight: 0.8,
                    metadata: HashMap::new(),
                });
                stats.edges_created += 1;
            }
        }

        // Process classes
        for class in &structure.classes {
            let class_node = self.add_node(GraphNode {
                id: Uuid::new_v4().to_string(),
                node_type: GraphNodeType::Class,
                name: class.name.clone(),
                qualified_name: format!("{}::{}", file_path.to_string_lossy(), class.name),
                file_path: Some(file_path.to_path_buf()),
                start_line: Some(class.range.start_line),
                end_line: Some(class.range.end_line),
                language: Some(structure.language.clone()),
                visibility: if class.is_exported { Visibility::Public } else { Visibility::Unknown },
                is_async: false,
                is_static: false,
                is_exported: class.is_exported,
                documentation: class.docstring.clone(),
                complexity: class.methods.iter().map(|m| m.complexity).sum(),
                metadata: HashMap::new(),
            });
            stats.nodes_created += 1;

            // Link class to file
            self.add_edge(class_node, file_node, GraphEdge {
                edge_type: GraphEdgeType::DefinedIn,
                weight: 1.0,
                metadata: HashMap::new(),
            });
            stats.edges_created += 1;

            // Process extends
            for ext in &class.extends {
                let ext_node = self.get_or_create_placeholder(ext, &structure.language);
                self.add_edge(class_node, ext_node, GraphEdge {
                    edge_type: GraphEdgeType::Extends,
                    weight: 1.0,
                    metadata: HashMap::new(),
                });
                stats.edges_created += 1;
            }

            // Process implements
            for impl_name in &class.implements {
                let impl_node = self.get_or_create_placeholder(impl_name, &structure.language);
                self.add_edge(class_node, impl_node, GraphEdge {
                    edge_type: GraphEdgeType::Implements,
                    weight: 1.0,
                    metadata: HashMap::new(),
                });
                stats.edges_created += 1;
            }

            // Process methods
            for method in &class.methods {
                let method_node = self.add_node(GraphNode {
                    id: Uuid::new_v4().to_string(),
                    node_type: GraphNodeType::Function,
                    name: method.name.clone(),
                    qualified_name: format!("{}::{}::{}", 
                        file_path.to_string_lossy(), class.name, method.name),
                    file_path: Some(file_path.to_path_buf()),
                    start_line: Some(method.range.start_line),
                    end_line: Some(method.range.end_line),
                    language: Some(structure.language.clone()),
                    visibility: self.convert_visibility(&method.visibility),
                    is_async: method.is_async,
                    is_static: false, // Method doesn't have is_static field
                    is_exported: false,
                    documentation: method.docstring.clone(),
                    complexity: method.complexity,
                    metadata: HashMap::new(),
                });
                stats.nodes_created += 1;

                // Link method to class
                self.add_edge(method_node, class_node, GraphEdge {
                    edge_type: GraphEdgeType::MemberOf,
                    weight: 1.0,
                    metadata: HashMap::new(),
                });
                stats.edges_created += 1;
            }
        }

        // Process interfaces
        for interface in &structure.interfaces {
            let interface_node = self.add_node(GraphNode {
                id: Uuid::new_v4().to_string(),
                node_type: GraphNodeType::Interface,
                name: interface.name.clone(),
                qualified_name: format!("{}::{}", file_path.to_string_lossy(), interface.name),
                file_path: Some(file_path.to_path_buf()),
                start_line: Some(interface.range.start_line),
                end_line: Some(interface.range.end_line),
                language: Some(structure.language.clone()),
                visibility: Visibility::Public,
                is_async: false,
                is_static: false,
                is_exported: interface.is_exported,
                documentation: interface.docstring.clone(),
                complexity: 0,
                metadata: HashMap::new(),
            });
            stats.nodes_created += 1;

            self.add_edge(interface_node, file_node, GraphEdge {
                edge_type: GraphEdgeType::DefinedIn,
                weight: 1.0,
                metadata: HashMap::new(),
            });
            stats.edges_created += 1;
        }

        // Track file nodes
        let file_nodes: Vec<NodeIndex> = self.file_to_nodes
            .entry(file_path.to_path_buf())
            .or_default()
            .clone();
        
        Ok(stats)
    }

    /// Build cross-file edges by resolving references
    fn build_cross_file_edges(&mut self) -> Result<(), String> {
        // Collect all placeholder nodes that need resolution
        let placeholders: Vec<(NodeIndex, String)> = self.graph
            .node_indices()
            .filter_map(|idx| {
                let node = &self.graph[idx];
                if node.file_path.is_none() && node.node_type != GraphNodeType::ExternalDependency {
                    Some((idx, node.name.clone()))
                } else {
                    None
                }
            })
            .collect();

        // Try to resolve each placeholder
        for (placeholder_idx, name) in placeholders {
            // Find definition by name - returns Vec<Symbol>, take first match
            let definitions = self.symbol_table.find_by_name(&name);
            if let Some(definition) = definitions.first() {
                // Find the node for this definition
                let qualified = format!("{}::{}", definition.file_path.to_string_lossy(), name);
                if let Some(&def_idx) = self.name_to_node.get(&qualified) {
                    // Redirect all edges from placeholder to actual definition
                    let incoming: Vec<_> = self.graph
                        .neighbors_directed(placeholder_idx, Direction::Incoming)
                        .collect();
                    
                    for source in incoming {
                        if let Some(edge_idx) = self.graph.find_edge(source, placeholder_idx) {
                            let edge = self.graph[edge_idx].clone();
                            self.graph.add_edge(source, def_idx, edge);
                        }
                    }
                }
            }
        }

        Ok(())
    }

    /// Add a node to the graph
    fn add_node(&mut self, node: GraphNode) -> NodeIndex {
        let qualified_name = node.qualified_name.clone();
        let file_path = node.file_path.clone();
        let idx = self.graph.add_node(node);
        self.name_to_node.insert(qualified_name, idx);
        
        if let Some(path) = file_path {
            self.file_to_nodes.entry(path).or_default().push(idx);
        }
        
        idx
    }

    /// Get or create a node
    fn get_or_create_node(&mut self, node: GraphNode) -> NodeIndex {
        if let Some(&idx) = self.name_to_node.get(&node.qualified_name) {
            idx
        } else {
            self.add_node(node)
        }
    }

    /// Get or create a placeholder node for unresolved references
    fn get_or_create_placeholder(&mut self, name: &str, language: &Language) -> NodeIndex {
        let qualified_name = format!("__placeholder__::{}", name);
        
        if let Some(&idx) = self.name_to_node.get(&qualified_name) {
            idx
        } else {
            self.add_node(GraphNode {
                id: Uuid::new_v4().to_string(),
                node_type: GraphNodeType::Function, // Assume function by default
                name: name.to_string(),
                qualified_name,
                file_path: None,
                start_line: None,
                end_line: None,
                language: Some(language.clone()),
                visibility: Visibility::Unknown,
                is_async: false,
                is_static: false,
                is_exported: false,
                documentation: None,
                complexity: 0,
                metadata: HashMap::new(),
            })
        }
    }

    /// Add an edge to the graph
    fn add_edge(&mut self, from: NodeIndex, to: NodeIndex, edge: GraphEdge) {
        self.graph.add_edge(from, to, edge);
    }

    /// Convert AST visibility to graph visibility
    fn convert_visibility(&self, vis: &super::ast_engine::Visibility) -> Visibility {
        match vis {
            super::ast_engine::Visibility::Public => Visibility::Public,
            super::ast_engine::Visibility::Private => Visibility::Private,
            super::ast_engine::Visibility::Protected => Visibility::Protected,
            super::ast_engine::Visibility::Internal => Visibility::Internal,
            super::ast_engine::Visibility::Default => Visibility::Unknown,
        }
    }

    /// Find all symbols that call a given symbol
    pub fn find_callers(&self, symbol_name: &str) -> Vec<&GraphNode> {
        let mut callers = Vec::new();

        // Find the target node
        for (name, &idx) in &self.name_to_node {
            if name.ends_with(&format!("::{}", symbol_name)) || name == symbol_name {
                // Find all incoming Calls edges
                for neighbor in self.graph.neighbors_directed(idx, Direction::Incoming) {
                    if let Some(edge_idx) = self.graph.find_edge(neighbor, idx) {
                        if self.graph[edge_idx].edge_type == GraphEdgeType::Calls {
                            callers.push(&self.graph[neighbor]);
                        }
                    }
                }
            }
        }

        callers
    }

    /// Find all symbols that a given symbol calls
    pub fn find_callees(&self, symbol_name: &str) -> Vec<&GraphNode> {
        let mut callees = Vec::new();

        for (name, &idx) in &self.name_to_node {
            if name.ends_with(&format!("::{}", symbol_name)) || name == symbol_name {
                for neighbor in self.graph.neighbors_directed(idx, Direction::Outgoing) {
                    if let Some(edge_idx) = self.graph.find_edge(idx, neighbor) {
                        if self.graph[edge_idx].edge_type == GraphEdgeType::Calls {
                            callees.push(&self.graph[neighbor]);
                        }
                    }
                }
            }
        }

        callees
    }

    /// Find the full dependency path from one symbol to another
    pub fn find_path(&self, from: &str, to: &str) -> Option<Vec<&GraphNode>> {
        let from_idx = self.name_to_node.iter()
            .find(|(name, _)| name.ends_with(&format!("::{}", from)) || *name == from)
            .map(|(_, &idx)| idx)?;

        let to_idx = self.name_to_node.iter()
            .find(|(name, _)| name.ends_with(&format!("::{}", to)) || *name == to)
            .map(|(_, &idx)| idx)?;

        // Use BFS to find path
        use petgraph::algo::astar;
        
        let path = astar(
            &self.graph,
            from_idx,
            |finish| finish == to_idx,
            |_| 1,
            |_| 0,
        );

        path.map(|(_, nodes)| nodes.iter().map(|&idx| &self.graph[idx]).collect())
    }

    /// Find all files that depend on a given file
    pub fn find_dependents(&self, file_path: &Path) -> Vec<PathBuf> {
        let mut dependents = HashSet::new();

        if let Some(nodes) = self.file_to_nodes.get(file_path) {
            for &node_idx in nodes {
                // Find all incoming edges
                for neighbor in self.graph.neighbors_directed(node_idx, Direction::Incoming) {
                    if let Some(path) = &self.graph[neighbor].file_path {
                        if path != file_path {
                            dependents.insert(path.clone());
                        }
                    }
                }
            }
        }

        dependents.into_iter().collect()
    }

    /// Find all files that a given file depends on
    pub fn find_dependencies(&self, file_path: &Path) -> Vec<PathBuf> {
        let mut dependencies = HashSet::new();

        if let Some(nodes) = self.file_to_nodes.get(file_path) {
            for &node_idx in nodes {
                for neighbor in self.graph.neighbors_directed(node_idx, Direction::Outgoing) {
                    if let Some(path) = &self.graph[neighbor].file_path {
                        if path != file_path {
                            dependencies.insert(path.clone());
                        }
                    }
                }
            }
        }

        dependencies.into_iter().collect()
    }

    /// Get context for a symbol (its neighborhood in the graph)
    pub fn get_symbol_context(&self, symbol_name: &str, depth: usize) -> SymbolContext {
        let mut context = SymbolContext::default();

        for (name, &idx) in &self.name_to_node {
            if name.ends_with(&format!("::{}", symbol_name)) || name == symbol_name {
                context.symbol = Some(self.graph[idx].clone());
                
                // Collect neighbors up to depth
                let mut visited = HashSet::new();
                let mut current_level = vec![idx];

                for _ in 0..depth {
                    let mut next_level = Vec::new();

                    for node_idx in current_level {
                        if visited.insert(node_idx) {
                            // Outgoing neighbors
                            for neighbor in self.graph.neighbors_directed(node_idx, Direction::Outgoing) {
                                if !visited.contains(&neighbor) {
                                    if let Some(edge_idx) = self.graph.find_edge(node_idx, neighbor) {
                                        context.outgoing.push(RelatedNode {
                                            node: self.graph[neighbor].clone(),
                                            relationship: self.graph[edge_idx].edge_type.clone(),
                                            distance: visited.len(),
                                        });
                                    }
                                    next_level.push(neighbor);
                                }
                            }

                            // Incoming neighbors
                            for neighbor in self.graph.neighbors_directed(node_idx, Direction::Incoming) {
                                if !visited.contains(&neighbor) {
                                    if let Some(edge_idx) = self.graph.find_edge(neighbor, node_idx) {
                                        context.incoming.push(RelatedNode {
                                            node: self.graph[neighbor].clone(),
                                            relationship: self.graph[edge_idx].edge_type.clone(),
                                            distance: visited.len(),
                                        });
                                    }
                                    next_level.push(neighbor);
                                }
                            }
                        }
                    }

                    current_level = next_level;
                }

                break;
            }
        }

        context
    }

    /// Search for nodes matching a pattern
    pub fn search(&self, query: &str, limit: usize) -> Vec<&GraphNode> {
        let query_lower = query.to_lowercase();
        
        let mut results: Vec<_> = self.graph
            .node_indices()
            .filter_map(|idx| {
                let node = &self.graph[idx];
                let name_lower = node.name.to_lowercase();
                
                if name_lower.contains(&query_lower) {
                    // Calculate relevance score
                    let score = if name_lower == query_lower {
                        1.0
                    } else if name_lower.starts_with(&query_lower) {
                        0.8
                    } else {
                        0.5
                    };
                    Some((node, score))
                } else {
                    None
                }
            })
            .collect();

        results.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());
        results.into_iter().take(limit).map(|(node, _)| node).collect()
    }

    /// Get graph statistics
    pub fn stats(&self) -> GraphStats {
        let mut stats = GraphStats {
            version: self.version,
            files_processed: self.file_to_nodes.len(),
            nodes_created: self.graph.node_count(),
            edges_created: self.graph.edge_count(),
            ..Default::default()
        };

        // Count by type
        for node in self.graph.node_weights() {
            match node.node_type {
                GraphNodeType::File => stats.file_count += 1,
                GraphNodeType::Function => stats.function_count += 1,
                GraphNodeType::Class => stats.class_count += 1,
                GraphNodeType::Interface => stats.interface_count += 1,
                _ => {}
            }
        }

        stats
    }

    /// Export graph to DOT format for visualization
    pub fn to_dot(&self) -> String {
        use petgraph::dot::{Dot, Config};
        format!("{:?}", Dot::with_config(&self.graph, &[Config::EdgeNoLabel]))
    }

    /// Remove a file from the graph
    pub fn remove_file(&mut self, file_path: &Path) {
        if let Some(nodes) = self.file_to_nodes.remove(file_path) {
            for node_idx in nodes {
                // Remove from name map
                if let Some(node) = self.graph.node_weight(node_idx) {
                    self.name_to_node.remove(&node.qualified_name);
                }
                // Note: petgraph doesn't support node removal easily
                // In production, we'd use a different approach or rebuild
            }
        }
        self.version += 1;
    }
}

/// Statistics about the graph
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct GraphStats {
    pub version: u64,
    pub files_processed: usize,
    pub nodes_created: usize,
    pub edges_created: usize,
    pub file_count: usize,
    pub function_count: usize,
    pub class_count: usize,
    pub interface_count: usize,
}

/// Statistics for a single file
#[derive(Debug, Clone, Default)]
pub struct FileGraphStats {
    pub nodes_created: usize,
    pub edges_created: usize,
}

/// Context for a symbol including its relationships
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct SymbolContext {
    pub symbol: Option<GraphNode>,
    pub incoming: Vec<RelatedNode>,
    pub outgoing: Vec<RelatedNode>,
}

/// A related node with relationship info
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RelatedNode {
    pub node: GraphNode,
    pub relationship: GraphEdgeType,
    pub distance: usize,
}

/// Thread-safe wrapper for CodeGraph
pub struct CodeGraphManager {
    graph: RwLock<CodeGraph>,
    ast_engine: Arc<ASTEngine>,
    symbol_table: Arc<SymbolTable>,
}

impl CodeGraphManager {
    pub fn new(
        project_root: PathBuf,
        ast_engine: Arc<ASTEngine>,
        symbol_table: Arc<SymbolTable>,
    ) -> Self {
        let graph = CodeGraph::new(project_root, Arc::clone(&ast_engine), Arc::clone(&symbol_table));
        Self {
            graph: RwLock::new(graph),
            ast_engine,
            symbol_table,
        }
    }

    pub fn build(&self, files: &[PathBuf]) -> Result<GraphStats, String> {
        self.graph.write().build_from_index(files)
    }

    pub fn find_callers(&self, symbol: &str) -> Vec<GraphNode> {
        self.graph.read().find_callers(symbol).into_iter().cloned().collect()
    }

    pub fn find_callees(&self, symbol: &str) -> Vec<GraphNode> {
        self.graph.read().find_callees(symbol).into_iter().cloned().collect()
    }

    pub fn get_context(&self, symbol: &str, depth: usize) -> SymbolContext {
        self.graph.read().get_symbol_context(symbol, depth)
    }

    pub fn search(&self, query: &str, limit: usize) -> Vec<GraphNode> {
        self.graph.read().search(query, limit).into_iter().cloned().collect()
    }

    pub fn stats(&self) -> GraphStats {
        self.graph.read().stats()
    }

    pub fn update_file(&self, file_path: &Path) -> Result<(), String> {
        let mut graph = self.graph.write();
        graph.remove_file(file_path);
        graph.add_file(file_path)?;
        graph.build_cross_file_edges()?;
        Ok(())
    }
}

// Tauri commands

#[tauri::command]
pub async fn build_code_graph(project_root: String) -> Result<GraphStats, String> {
    // Would need to access the manager instance
    Err("Code graph manager not initialized".to_string())
}

#[tauri::command]
pub fn search_code_graph(query: String, limit: usize) -> Result<Vec<GraphNode>, String> {
    Err("Code graph manager not initialized".to_string())
}

pub fn get_symbol_context(symbol: String, depth: usize) -> Result<SymbolContext, String> {
    Err("Code graph manager not initialized".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_graph_node_creation() {
        let node = GraphNode {
            id: "test".to_string(),
            node_type: GraphNodeType::Function,
            name: "myFunction".to_string(),
            qualified_name: "test.ts::myFunction".to_string(),
            file_path: Some(PathBuf::from("test.ts")),
            start_line: Some(1),
            end_line: Some(10),
            language: Some(Language::TypeScript),
            visibility: Visibility::Public,
            is_async: true,
            is_static: false,
            is_exported: true,
            documentation: Some("A test function".to_string()),
            complexity: 5,
            metadata: HashMap::new(),
        };

        assert_eq!(node.name, "myFunction");
        assert_eq!(node.node_type, GraphNodeType::Function);
    }

    #[test]
    fn test_graph_stats_default() {
        let stats = GraphStats::default();
        assert_eq!(stats.version, 0);
        assert_eq!(stats.nodes_created, 0);
    }
}
