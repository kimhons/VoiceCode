#![allow(dead_code, unused_variables, unused_imports)]
// Multi-Repo Context Awareness - Cross-repository understanding and context
// Supports monorepos, workspaces, and linked repositories

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use serde::{Deserialize, Serialize};
use parking_lot::RwLock;


/// Multi-repository context manager
pub struct MultiRepoManager {
    repos: RwLock<HashMap<String, Repository>>,
    workspace_root: Option<PathBuf>,
    cross_references: RwLock<Vec<CrossReference>>,
    shared_dependencies: RwLock<HashMap<String, Vec<String>>>,
}

/// A repository in the workspace
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Repository {
    pub name: String,
    pub path: PathBuf,
    pub repo_type: RepoType,
    pub package_name: Option<String>,
    pub dependencies: Vec<String>,
    pub dependents: Vec<String>,
    pub language: Option<String>,
    pub indexed: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum RepoType {
    Standalone,
    MonorepoPackage,
    WorkspaceMember,
    GitSubmodule,
    LinkedRepo,
}

/// Cross-reference between repositories
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CrossReference {
    pub from_repo: String,
    pub from_file: PathBuf,
    pub to_repo: String,
    pub to_symbol: String,
    pub reference_type: ReferenceType,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ReferenceType {
    Import,
    TypeReference,
    FunctionCall,
    Inheritance,
    Dependency,
}

/// Workspace configuration
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct WorkspaceConfig {
    pub packages: Vec<PackageConfig>,
    pub shared_configs: Vec<PathBuf>,
    pub build_order: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PackageConfig {
    pub name: String,
    pub path: PathBuf,
    pub dependencies: Vec<String>,
}

impl MultiRepoManager {
    pub fn new() -> Self {
        Self {
            repos: RwLock::new(HashMap::new()),
            workspace_root: None,
            cross_references: RwLock::new(Vec::new()),
            shared_dependencies: RwLock::new(HashMap::new()),
        }
    }

    /// Detect workspace type and discover repositories
    pub async fn discover_workspace(&mut self, root: &Path) -> Result<WorkspaceInfo, String> {
        self.workspace_root = Some(root.to_path_buf());
        
        let workspace_type = self.detect_workspace_type(root)?;
        let repos = match workspace_type {
            WorkspaceType::NpmWorkspace => self.discover_npm_workspace(root).await?,
            WorkspaceType::YarnWorkspace => self.discover_yarn_workspace(root).await?,
            WorkspaceType::PnpmWorkspace => self.discover_pnpm_workspace(root).await?,
            WorkspaceType::CargoWorkspace => self.discover_cargo_workspace(root).await?,
            WorkspaceType::GoWorkspace => self.discover_go_workspace(root).await?,
            WorkspaceType::Monorepo => self.discover_monorepo(root).await?,
            WorkspaceType::Single => vec![self.create_single_repo(root)],
        };

        for repo in &repos {
            self.repos.write().insert(repo.name.clone(), repo.clone());
        }

        // Analyze cross-references
        self.analyze_cross_references().await;

        Ok(WorkspaceInfo {
            workspace_type,
            root: root.to_path_buf(),
            repos,
            total_packages: self.repos.read().len(),
        })
    }

    fn detect_workspace_type(&self, root: &Path) -> Result<WorkspaceType, String> {
        // Check for various workspace indicators
        if root.join("pnpm-workspace.yaml").exists() {
            return Ok(WorkspaceType::PnpmWorkspace);
        }
        if root.join("lerna.json").exists() || self.has_workspaces_in_package_json(root) {
            return Ok(WorkspaceType::NpmWorkspace);
        }
        if root.join("Cargo.toml").exists() && self.is_cargo_workspace(root) {
            return Ok(WorkspaceType::CargoWorkspace);
        }
        if root.join("go.work").exists() {
            return Ok(WorkspaceType::GoWorkspace);
        }
        if self.looks_like_monorepo(root) {
            return Ok(WorkspaceType::Monorepo);
        }
        Ok(WorkspaceType::Single)
    }

    fn has_workspaces_in_package_json(&self, root: &Path) -> bool {
        let pkg_path = root.join("package.json");
        if let Ok(content) = std::fs::read_to_string(&pkg_path) {
            content.contains("\"workspaces\"")
        } else {
            false
        }
    }

    fn is_cargo_workspace(&self, root: &Path) -> bool {
        let cargo_path = root.join("Cargo.toml");
        if let Ok(content) = std::fs::read_to_string(&cargo_path) {
            content.contains("[workspace]")
        } else {
            false
        }
    }

    fn looks_like_monorepo(&self, root: &Path) -> bool {
        let indicators = ["packages", "apps", "libs", "services", "modules"];
        indicators.iter().any(|dir| {
            let path = root.join(dir);
            path.exists() && path.is_dir()
        })
    }

    async fn discover_npm_workspace(&self, root: &Path) -> Result<Vec<Repository>, String> {
        let mut repos = Vec::new();
        let pkg_path = root.join("package.json");
        
        if let Ok(content) = std::fs::read_to_string(&pkg_path) {
            if let Ok(pkg) = serde_json::from_str::<serde_json::Value>(&content) {
                if let Some(workspaces) = pkg.get("workspaces") {
                    let patterns = self.extract_workspace_patterns(workspaces);
                    for pattern in patterns {
                        repos.extend(self.find_packages_by_pattern(root, &pattern)?);
                    }
                }
            }
        }
        
        Ok(repos)
    }

    async fn discover_yarn_workspace(&self, root: &Path) -> Result<Vec<Repository>, String> {
        // Yarn workspaces use same format as npm
        self.discover_npm_workspace(root).await
    }

    async fn discover_pnpm_workspace(&self, root: &Path) -> Result<Vec<Repository>, String> {
        let mut repos = Vec::new();
        let workspace_path = root.join("pnpm-workspace.yaml");
        
        if let Ok(content) = std::fs::read_to_string(&workspace_path) {
            // Parse YAML for packages
            for line in content.lines() {
                if line.trim().starts_with("- ") {
                    let pattern = line.trim().trim_start_matches("- ").trim_matches('\'').trim_matches('"');
                    repos.extend(self.find_packages_by_pattern(root, pattern)?);
                }
            }
        }
        
        Ok(repos)
    }

    async fn discover_cargo_workspace(&self, root: &Path) -> Result<Vec<Repository>, String> {
        let mut repos = Vec::new();
        let cargo_path = root.join("Cargo.toml");
        
        if let Ok(content) = std::fs::read_to_string(&cargo_path) {
            let mut in_members = false;
            for line in content.lines() {
                if line.contains("members") && line.contains("=") {
                    in_members = true;
                    continue;
                }
                if in_members {
                    if line.trim() == "]" {
                        break;
                    }
                    let member = line.trim().trim_matches(|c| c == '"' || c == '\'' || c == ',');
                    if !member.is_empty() && !member.starts_with('#') {
                        let member_path = root.join(member);
                        if member_path.exists() {
                            repos.push(Repository {
                                name: member.to_string(),
                                path: member_path,
                                repo_type: RepoType::WorkspaceMember,
                                package_name: Some(member.to_string()),
                                dependencies: Vec::new(),
                                dependents: Vec::new(),
                                language: Some("rust".to_string()),
                                indexed: false,
                            });
                        }
                    }
                }
            }
        }
        
        Ok(repos)
    }

    async fn discover_go_workspace(&self, root: &Path) -> Result<Vec<Repository>, String> {
        let mut repos = Vec::new();
        let work_path = root.join("go.work");
        
        if let Ok(content) = std::fs::read_to_string(&work_path) {
            for line in content.lines() {
                if line.trim().starts_with("use ") || line.trim().starts_with("./") {
                    let module = line.trim().trim_start_matches("use ").trim();
                    let module_path = root.join(module);
                    if module_path.exists() {
                        repos.push(Repository {
                            name: module.to_string(),
                            path: module_path,
                            repo_type: RepoType::WorkspaceMember,
                            package_name: None,
                            dependencies: Vec::new(),
                            dependents: Vec::new(),
                            language: Some("go".to_string()),
                            indexed: false,
                        });
                    }
                }
            }
        }
        
        Ok(repos)
    }

    async fn discover_monorepo(&self, root: &Path) -> Result<Vec<Repository>, String> {
        let mut repos = Vec::new();
        let dirs = ["packages", "apps", "libs", "services", "modules"];
        
        for dir in &dirs {
            let dir_path = root.join(dir);
            if dir_path.exists() && dir_path.is_dir() {
                if let Ok(entries) = std::fs::read_dir(&dir_path) {
                    for entry in entries.filter_map(|e| e.ok()) {
                        let path = entry.path();
                        if path.is_dir() && self.is_package_directory(&path) {
                            let name = path.file_name()
                                .and_then(|n| n.to_str())
                                .unwrap_or("unknown")
                                .to_string();
                            repos.push(Repository {
                                name: name.clone(),
                                path,
                                repo_type: RepoType::MonorepoPackage,
                                package_name: Some(name),
                                dependencies: Vec::new(),
                                dependents: Vec::new(),
                                language: None,
                                indexed: false,
                            });
                        }
                    }
                }
            }
        }
        
        Ok(repos)
    }

    fn create_single_repo(&self, root: &Path) -> Repository {
        let name = root.file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("project")
            .to_string();
        
        Repository {
            name: name.clone(),
            path: root.to_path_buf(),
            repo_type: RepoType::Standalone,
            package_name: Some(name),
            dependencies: Vec::new(),
            dependents: Vec::new(),
            language: None,
            indexed: false,
        }
    }

    fn extract_workspace_patterns(&self, workspaces: &serde_json::Value) -> Vec<String> {
        let mut patterns = Vec::new();
        
        match workspaces {
            serde_json::Value::Array(arr) => {
                for item in arr {
                    if let Some(s) = item.as_str() {
                        patterns.push(s.to_string());
                    }
                }
            }
            serde_json::Value::Object(obj) => {
                if let Some(pkgs) = obj.get("packages") {
                    return self.extract_workspace_patterns(pkgs);
                }
            }
            _ => {}
        }
        
        patterns
    }

    fn find_packages_by_pattern(&self, root: &Path, pattern: &str) -> Result<Vec<Repository>, String> {
        let mut repos = Vec::new();
        
        // Handle glob patterns like "packages/*"
        let base_pattern = pattern.trim_end_matches("/*").trim_end_matches("/**");
        let search_dir = root.join(base_pattern);
        
        if search_dir.exists() && search_dir.is_dir() {
            if let Ok(entries) = std::fs::read_dir(&search_dir) {
                for entry in entries.filter_map(|e| e.ok()) {
                    let path = entry.path();
                    if path.is_dir() && self.is_package_directory(&path) {
                        let name = path.file_name()
                            .and_then(|n| n.to_str())
                            .unwrap_or("unknown")
                            .to_string();
                        repos.push(Repository {
                            name: name.clone(),
                            path,
                            repo_type: RepoType::MonorepoPackage,
                            package_name: Some(name),
                            dependencies: Vec::new(),
                            dependents: Vec::new(),
                            language: None,
                            indexed: false,
                        });
                    }
                }
            }
        }
        
        Ok(repos)
    }

    fn is_package_directory(&self, path: &Path) -> bool {
        path.join("package.json").exists() ||
        path.join("Cargo.toml").exists() ||
        path.join("go.mod").exists() ||
        path.join("pyproject.toml").exists() ||
        path.join("setup.py").exists()
    }

    async fn analyze_cross_references(&self) {
        let repos = self.repos.read().clone();
        let mut cross_refs = Vec::new();
        
        for (name, repo) in &repos {
            // Analyze imports/dependencies
            let refs = self.find_cross_refs_in_repo(repo, &repos);
            cross_refs.extend(refs);
        }
        
        *self.cross_references.write() = cross_refs;
    }

    fn find_cross_refs_in_repo(&self, repo: &Repository, all_repos: &HashMap<String, Repository>) -> Vec<CrossReference> {
        let mut refs = Vec::new();
        
        // Check package.json dependencies
        let pkg_path = repo.path.join("package.json");
        if let Ok(content) = std::fs::read_to_string(&pkg_path) {
            if let Ok(pkg) = serde_json::from_str::<serde_json::Value>(&content) {
                for dep_field in &["dependencies", "devDependencies", "peerDependencies"] {
                    if let Some(deps) = pkg.get(dep_field).and_then(|d| d.as_object()) {
                        for (dep_name, _) in deps {
                            // Check if dependency is another workspace package
                            if all_repos.contains_key(dep_name) {
                                refs.push(CrossReference {
                                    from_repo: repo.name.clone(),
                                    from_file: pkg_path.clone(),
                                    to_repo: dep_name.clone(),
                                    to_symbol: dep_name.clone(),
                                    reference_type: ReferenceType::Dependency,
                                });
                            }
                        }
                    }
                }
            }
        }
        
        refs
    }

    /// Get all repositories
    pub fn get_repos(&self) -> Vec<Repository> {
        self.repos.read().values().cloned().collect()
    }

    /// Get a specific repository
    pub fn get_repo(&self, name: &str) -> Option<Repository> {
        self.repos.read().get(name).cloned()
    }

    /// Get cross-references for a repository
    pub fn get_cross_refs(&self, repo_name: &str) -> Vec<CrossReference> {
        self.cross_references.read()
            .iter()
            .filter(|r| r.from_repo == repo_name || r.to_repo == repo_name)
            .cloned()
            .collect()
    }

    /// Get dependency graph
    pub fn get_dependency_graph(&self) -> HashMap<String, Vec<String>> {
        let mut graph = HashMap::new();
        
        for xref in self.cross_references.read().iter() {
            if xref.reference_type == ReferenceType::Dependency {
                graph.entry(xref.from_repo.clone())
                    .or_insert_with(Vec::new)
                    .push(xref.to_repo.clone());
            }
        }
        
        graph
    }

    /// Format workspace context for LLM
    pub fn format_for_llm(&self) -> String {
        let repos = self.repos.read();
        let mut output = String::from("# Workspace Structure\n\n");
        
        output.push_str(&format!("Total packages: {}\n\n", repos.len()));
        
        for (name, repo) in repos.iter() {
            output.push_str(&format!("## {}\n", name));
            output.push_str(&format!("- Path: {}\n", repo.path.display()));
            output.push_str(&format!("- Type: {:?}\n", repo.repo_type));
            if let Some(ref lang) = repo.language {
                output.push_str(&format!("- Language: {}\n", lang));
            }
            output.push('\n');
        }
        
        // Add dependency info
        let deps = self.get_dependency_graph();
        if !deps.is_empty() {
            output.push_str("## Dependencies\n\n");
            for (from, to_list) in &deps {
                output.push_str(&format!("- {} depends on: {}\n", from, to_list.join(", ")));
            }
        }
        
        output
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum WorkspaceType {
    Single,
    NpmWorkspace,
    YarnWorkspace,
    PnpmWorkspace,
    CargoWorkspace,
    GoWorkspace,
    Monorepo,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceInfo {
    pub workspace_type: WorkspaceType,
    pub root: PathBuf,
    pub repos: Vec<Repository>,
    pub total_packages: usize,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_multi_repo_manager_creation() {
        let manager = MultiRepoManager::new();
        assert!(manager.repos.read().is_empty());
    }

    #[test]
    fn test_is_package_directory() {
        let manager = MultiRepoManager::new();
        // This would need actual filesystem tests
    }
}
