#![allow(dead_code, unused_variables, unused_imports)]
// External Documentation Indexer - Fetch and index package documentation
// Augment-style doc indexing for npm, crates.io, PyPI

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use serde::{Deserialize, Serialize};
use parking_lot::RwLock;

/// External documentation indexer
pub struct DocIndexer {
    cache_dir: PathBuf,
    indexed_packages: RwLock<HashMap<String, PackageDoc>>,
    http_client: reqwest::Client,
    config: DocIndexerConfig,
}

#[derive(Debug, Clone)]
pub struct DocIndexerConfig {
    pub cache_ttl_hours: u64,
    pub max_cached_packages: usize,
    pub fetch_timeout_seconds: u64,
    pub include_examples: bool,
}

impl Default for DocIndexerConfig {
    fn default() -> Self {
        Self {
            cache_ttl_hours: 168, // 1 week
            max_cached_packages: 500,
            fetch_timeout_seconds: 30,
            include_examples: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PackageDoc {
    pub name: String,
    pub version: String,
    pub registry: PackageRegistry,
    pub description: String,
    pub readme: Option<String>,
    pub api_docs: Vec<ApiDoc>,
    pub examples: Vec<CodeExample>,
    pub types: Vec<TypeDoc>,
    pub indexed_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PackageRegistry {
    Npm,
    Crates,
    PyPI,
    Go,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiDoc {
    pub name: String,
    pub kind: ApiKind,
    pub signature: String,
    pub description: String,
    pub parameters: Vec<ParamDoc>,
    pub returns: Option<String>,
    pub examples: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ApiKind {
    Function,
    Class,
    Method,
    Constant,
    Type,
    Interface,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParamDoc {
    pub name: String,
    pub param_type: Option<String>,
    pub description: String,
    pub optional: bool,
    pub default: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TypeDoc {
    pub name: String,
    pub definition: String,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodeExample {
    pub title: String,
    pub code: String,
    pub language: String,
}

impl DocIndexer {
    pub fn new(cache_dir: PathBuf, config: DocIndexerConfig) -> Self {
        Self {
            cache_dir,
            indexed_packages: RwLock::new(HashMap::new()),
            http_client: reqwest::Client::builder()
                .timeout(std::time::Duration::from_secs(config.fetch_timeout_seconds))
                .build()
                .unwrap_or_default(),
            config,
        }
    }

    /// Detect and index dependencies from a project
    pub async fn index_project_dependencies(&self, project_root: &Path) -> Result<Vec<String>, String> {
        let mut indexed = Vec::new();

        // Check for package.json (npm)
        let package_json = project_root.join("package.json");
        if package_json.exists() {
            let deps = self.parse_npm_deps(&package_json).await?;
            for (name, version) in deps {
                if self.index_npm_package(&name, &version).await.is_ok() {
                    indexed.push(format!("npm:{}", name));
                }
            }
        }

        // Check for Cargo.toml (Rust)
        let cargo_toml = project_root.join("Cargo.toml");
        if cargo_toml.exists() {
            let deps = self.parse_cargo_deps(&cargo_toml).await?;
            for (name, version) in deps {
                if self.index_crate(&name, &version).await.is_ok() {
                    indexed.push(format!("crates:{}", name));
                }
            }
        }

        // Check for requirements.txt or pyproject.toml (Python)
        let requirements = project_root.join("requirements.txt");
        if requirements.exists() {
            let deps = self.parse_python_deps(&requirements).await?;
            for (name, version) in deps {
                if self.index_pypi_package(&name, &version).await.is_ok() {
                    indexed.push(format!("pypi:{}", name));
                }
            }
        }

        Ok(indexed)
    }

    async fn parse_npm_deps(&self, path: &Path) -> Result<Vec<(String, String)>, String> {
        let content = tokio::fs::read_to_string(path).await
            .map_err(|e| format!("Read error: {}", e))?;
        
        let json: serde_json::Value = serde_json::from_str(&content)
            .map_err(|e| format!("Parse error: {}", e))?;

        let mut deps = Vec::new();
        
        for key in ["dependencies", "devDependencies"] {
            if let Some(obj) = json.get(key).and_then(|v| v.as_object()) {
                for (name, version) in obj {
                    let ver = version.as_str().unwrap_or("latest")
                        .trim_start_matches('^')
                        .trim_start_matches('~');
                    deps.push((name.clone(), ver.to_string()));
                }
            }
        }

        Ok(deps)
    }

    async fn parse_cargo_deps(&self, path: &Path) -> Result<Vec<(String, String)>, String> {
        let content = tokio::fs::read_to_string(path).await
            .map_err(|e| format!("Read error: {}", e))?;

        let mut deps = Vec::new();
        let mut in_deps = false;

        for line in content.lines() {
            if line.starts_with("[dependencies]") || line.starts_with("[dev-dependencies]") {
                in_deps = true;
                continue;
            }
            if line.starts_with('[') {
                in_deps = false;
                continue;
            }
            if in_deps && line.contains('=') {
                let parts: Vec<&str> = line.splitn(2, '=').collect();
                if parts.len() == 2 {
                    let name = parts[0].trim();
                    let version = parts[1].trim().trim_matches('"').trim_matches('\'');
                    // Handle both "1.0" and { version = "1.0" } formats
                    let ver = if version.starts_with('{') {
                        version.split("version").nth(1)
                            .and_then(|s| s.split('"').nth(1))
                            .unwrap_or("*")
                    } else {
                        version
                    };
                    deps.push((name.to_string(), ver.to_string()));
                }
            }
        }

        Ok(deps)
    }

    async fn parse_python_deps(&self, path: &Path) -> Result<Vec<(String, String)>, String> {
        let content = tokio::fs::read_to_string(path).await
            .map_err(|e| format!("Read error: {}", e))?;

        let mut deps = Vec::new();
        
        for line in content.lines() {
            let line = line.trim();
            if line.is_empty() || line.starts_with('#') {
                continue;
            }
            
            // Parse lines like "requests==2.28.0" or "requests>=2.0"
            let parts: Vec<&str> = line.split(&['=', '>', '<', '~', '!'][..]).collect();
            if !parts.is_empty() {
                let name = parts[0].trim();
                let version = if parts.len() > 1 {
                    parts.last().unwrap().trim()
                } else {
                    "*"
                };
                deps.push((name.to_string(), version.to_string()));
            }
        }

        Ok(deps)
    }

    /// Index an npm package
    pub async fn index_npm_package(&self, name: &str, version: &str) -> Result<PackageDoc, String> {
        // Check cache
        let cache_key = format!("npm:{}@{}", name, version);
        if let Some(doc) = self.indexed_packages.read().get(&cache_key) {
            if !self.is_cache_expired(doc.indexed_at) {
                return Ok(doc.clone());
            }
        }

        // Fetch from npm registry
        let url = format!("https://registry.npmjs.org/{}/{}", name, version);
        let resp = self.http_client.get(&url)
            .send().await
            .map_err(|e| format!("Fetch error: {}", e))?;

        if !resp.status().is_success() {
            return Err(format!("npm returned {}", resp.status()));
        }

        let data: serde_json::Value = resp.json().await
            .map_err(|e| format!("Parse error: {}", e))?;

        let doc = PackageDoc {
            name: name.to_string(),
            version: data["version"].as_str().unwrap_or(version).to_string(),
            registry: PackageRegistry::Npm,
            description: data["description"].as_str().unwrap_or("").to_string(),
            readme: data["readme"].as_str().map(String::from),
            api_docs: self.extract_npm_api(&data),
            examples: Vec::new(),
            types: Vec::new(),
            indexed_at: self.now(),
        };

        self.indexed_packages.write().insert(cache_key, doc.clone());
        Ok(doc)
    }

    /// Index a Rust crate
    pub async fn index_crate(&self, name: &str, version: &str) -> Result<PackageDoc, String> {
        let cache_key = format!("crates:{}@{}", name, version);
        if let Some(doc) = self.indexed_packages.read().get(&cache_key) {
            if !self.is_cache_expired(doc.indexed_at) {
                return Ok(doc.clone());
            }
        }

        let url = format!("https://crates.io/api/v1/crates/{}/{}", name, version);
        let resp = self.http_client.get(&url)
            .header("User-Agent", "VoiceCode (https://github.com/voicecode)")
            .send().await
            .map_err(|e| format!("Fetch error: {}", e))?;

        if !resp.status().is_success() {
            return Err(format!("crates.io returned {}", resp.status()));
        }

        let data: serde_json::Value = resp.json().await
            .map_err(|e| format!("Parse error: {}", e))?;

        let version_data = &data["version"];
        let doc = PackageDoc {
            name: name.to_string(),
            version: version_data["num"].as_str().unwrap_or(version).to_string(),
            registry: PackageRegistry::Crates,
            description: data["crate"]["description"].as_str().unwrap_or("").to_string(),
            readme: version_data["readme_path"].as_str().map(String::from),
            api_docs: Vec::new(), // Would need to fetch docs.rs
            examples: Vec::new(),
            types: Vec::new(),
            indexed_at: self.now(),
        };

        self.indexed_packages.write().insert(cache_key, doc.clone());
        Ok(doc)
    }

    /// Index a PyPI package
    pub async fn index_pypi_package(&self, name: &str, version: &str) -> Result<PackageDoc, String> {
        let cache_key = format!("pypi:{}@{}", name, version);
        if let Some(doc) = self.indexed_packages.read().get(&cache_key) {
            if !self.is_cache_expired(doc.indexed_at) {
                return Ok(doc.clone());
            }
        }

        let url = if version == "*" {
            format!("https://pypi.org/pypi/{}/json", name)
        } else {
            format!("https://pypi.org/pypi/{}/{}/json", name, version)
        };

        let resp = self.http_client.get(&url)
            .send().await
            .map_err(|e| format!("Fetch error: {}", e))?;

        if !resp.status().is_success() {
            return Err(format!("PyPI returned {}", resp.status()));
        }

        let data: serde_json::Value = resp.json().await
            .map_err(|e| format!("Parse error: {}", e))?;

        let info = &data["info"];
        let doc = PackageDoc {
            name: name.to_string(),
            version: info["version"].as_str().unwrap_or(version).to_string(),
            registry: PackageRegistry::PyPI,
            description: info["summary"].as_str().unwrap_or("").to_string(),
            readme: info["description"].as_str().map(String::from),
            api_docs: Vec::new(),
            examples: Vec::new(),
            types: Vec::new(),
            indexed_at: self.now(),
        };

        self.indexed_packages.write().insert(cache_key, doc.clone());
        Ok(doc)
    }

    fn extract_npm_api(&self, _data: &serde_json::Value) -> Vec<ApiDoc> {
        // In a full implementation, this would parse TypeScript definitions
        // from @types packages or inline types
        Vec::new()
    }

    /// Search indexed documentation
    pub fn search(&self, query: &str, limit: usize) -> Vec<SearchResult> {
        let packages = self.indexed_packages.read();
        let query_lower = query.to_lowercase();
        
        let mut results: Vec<SearchResult> = packages.values()
            .filter(|doc| {
                doc.name.to_lowercase().contains(&query_lower) ||
                doc.description.to_lowercase().contains(&query_lower)
            })
            .map(|doc| SearchResult {
                package: doc.name.clone(),
                version: doc.version.clone(),
                registry: doc.registry.clone(),
                snippet: doc.description.chars().take(200).collect(),
                relevance: if doc.name.to_lowercase() == query_lower { 1.0 } else { 0.5 },
            })
            .collect();

        results.sort_by(|a, b| b.relevance.partial_cmp(&a.relevance).unwrap());
        results.truncate(limit);
        results
    }

    /// Format docs for LLM prompt
    pub fn format_for_prompt(&self, package_name: &str) -> Option<String> {
        let packages = self.indexed_packages.read();
        
        // Find the package (any version)
        let doc = packages.values()
            .find(|d| d.name == package_name)?;

        let mut output = format!("## {} v{} ({:?})\n\n", doc.name, doc.version, doc.registry);
        output.push_str(&format!("{}\n\n", doc.description));

        if !doc.api_docs.is_empty() {
            output.push_str("### API\n\n");
            for api in &doc.api_docs {
                output.push_str(&format!("- `{}`: {}\n", api.signature, api.description));
            }
        }

        Some(output)
    }

    fn is_cache_expired(&self, indexed_at: u64) -> bool {
        let now = self.now();
        let ttl_seconds = self.config.cache_ttl_hours * 3600;
        now - indexed_at > ttl_seconds
    }

    fn now(&self) -> u64 {
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs()
    }

    pub fn indexed_count(&self) -> usize {
        self.indexed_packages.read().len()
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct SearchResult {
    pub package: String,
    pub version: String,
    pub registry: PackageRegistry,
    pub snippet: String,
    pub relevance: f32,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_indexer_creation() {
        let indexer = DocIndexer::new(PathBuf::from("/tmp/docs"), DocIndexerConfig::default());
        assert_eq!(indexer.indexed_count(), 0);
    }
}
