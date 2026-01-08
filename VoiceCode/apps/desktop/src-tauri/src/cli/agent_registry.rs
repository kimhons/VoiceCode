// Agent Registry - Discovery and management of available agents
// Supports local, remote, and external agents (Claude Code, Codex, Gemini)

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tokio::net::TcpStream;
use tokio::sync::RwLock;

use super::agent_protocol::{AgentCapability, AgentMessage, AgentProtocol};

/// Agent status
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum AgentStatus {
    /// Agent is available
    Available,
    /// Agent is busy with a task
    Busy,
    /// Agent is offline
    Offline,
    /// Agent is in error state
    Error,
    /// Agent is connecting
    Connecting,
}

/// Agent type
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum AgentType {
    /// Built-in VoiceCode agent
    Internal,
    /// External CLI agent (Claude Code, Codex, etc.)
    External,
    /// Remote agent via network
    Remote,
    /// Plugin-based agent
    Plugin,
}

/// Information about a registered agent
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentInfo {
    pub id: String,
    pub name: String,
    pub agent_type: AgentType,
    pub version: String,
    pub capabilities: Vec<AgentCapability>,
    pub status: AgentStatus,
    pub endpoint: Option<String>,
    pub priority: u8, // Higher = prefer this agent
    pub last_seen: u64,
    pub tasks_completed: u64,
    pub avg_response_time_ms: u64,
    pub metadata: HashMap<String, String>,
}

impl AgentInfo {
    pub fn new(
        id: impl Into<String>,
        name: impl Into<String>,
        agent_type: AgentType,
        capabilities: Vec<AgentCapability>,
    ) -> Self {
        Self {
            id: id.into(),
            name: name.into(),
            agent_type,
            version: "1.0.0".to_string(),
            capabilities,
            status: AgentStatus::Available,
            endpoint: None,
            priority: 50,
            last_seen: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            tasks_completed: 0,
            avg_response_time_ms: 0,
            metadata: HashMap::new(),
        }
    }

    pub fn with_endpoint(mut self, endpoint: impl Into<String>) -> Self {
        self.endpoint = Some(endpoint.into());
        self
    }

    pub fn with_priority(mut self, priority: u8) -> Self {
        self.priority = priority;
        self
    }

    pub fn with_version(mut self, version: impl Into<String>) -> Self {
        self.version = version.into();
        self
    }

    pub fn has_capability(&self, capability: &AgentCapability) -> bool {
        self.capabilities.contains(capability)
    }

    pub fn update_last_seen(&mut self) {
        self.last_seen = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
    }

    pub fn record_task_completion(&mut self, duration_ms: u64) {
        self.tasks_completed += 1;
        // Calculate running average
        self.avg_response_time_ms = (self.avg_response_time_ms * (self.tasks_completed - 1)
            + duration_ms)
            / self.tasks_completed;
    }
}

/// Configuration for agent discovery
#[derive(Debug, Clone)]
pub struct DiscoveryConfig {
    /// Enable local agent discovery (same machine)
    pub local_discovery: bool,
    /// Enable network discovery
    pub network_discovery: bool,
    /// Ports to scan for agents
    pub discovery_ports: Vec<u16>,
    /// Discovery timeout
    pub timeout_ms: u64,
    /// Auto-register known external agents
    pub auto_register_external: bool,
    /// Known external agent endpoints
    pub external_endpoints: HashMap<String, String>,
}

impl Default for DiscoveryConfig {
    fn default() -> Self {
        let mut external_endpoints = HashMap::new();
        // Default endpoints for known agents
        external_endpoints.insert("claude-code".to_string(), "localhost:9877".to_string());
        external_endpoints.insert("codex".to_string(), "localhost:9878".to_string());
        external_endpoints.insert("gemini".to_string(), "localhost:9879".to_string());

        Self {
            local_discovery: true,
            network_discovery: false,
            discovery_ports: vec![9876, 9877, 9878, 9879, 9880],
            timeout_ms: 5000,
            auto_register_external: true,
            external_endpoints,
        }
    }
}

/// Agent Registry - manages all known agents
pub struct AgentRegistry {
    agents: Arc<RwLock<HashMap<String, AgentInfo>>>,
    config: DiscoveryConfig,
    self_agent: AgentInfo,
}

impl AgentRegistry {
    pub fn new(self_agent: AgentInfo, config: DiscoveryConfig) -> Self {
        let mut agents = HashMap::new();
        agents.insert(self_agent.id.clone(), self_agent.clone());

        Self {
            agents: Arc::new(RwLock::new(agents)),
            config,
            self_agent,
        }
    }

    /// Create with default VoiceCode agent
    pub fn with_voicecode_agent() -> Self {
        let self_agent = AgentInfo::new(
            uuid::Uuid::new_v4().to_string(),
            "VoiceCode",
            AgentType::Internal,
            vec![
                AgentCapability::CodeGeneration,
                AgentCapability::CodeReview,
                AgentCapability::BugFix,
                AgentCapability::Refactoring,
                AgentCapability::TestGeneration,
                AgentCapability::Documentation,
                AgentCapability::Explanation,
                AgentCapability::FileOperations,
                AgentCapability::Terminal,
                AgentCapability::Git,
                AgentCapability::Search,
                AgentCapability::MultiFileEdit,
                AgentCapability::Completion,
                AgentCapability::VoiceInput,
                AgentCapability::ContextUnderstanding,
                AgentCapability::TaskPlanning,
                AgentCapability::AgenticExecution,
            ],
        )
        .with_priority(100)
        .with_version(env!("CARGO_PKG_VERSION"));

        Self::new(self_agent, DiscoveryConfig::default())
    }

    /// Register a new agent
    pub async fn register(&self, agent: AgentInfo) -> Result<(), String> {
        let mut agents = self.agents.write().await;

        if agents.contains_key(&agent.id) {
            return Err(format!("Agent {} already registered", agent.id));
        }

        tracing::info!("Registered agent: {} ({})", agent.name, agent.id);
        agents.insert(agent.id.clone(), agent);
        Ok(())
    }

    /// Unregister an agent
    pub async fn unregister(&self, agent_id: &str) -> Option<AgentInfo> {
        let mut agents = self.agents.write().await;
        let removed = agents.remove(agent_id);
        if let Some(ref agent) = removed {
            tracing::info!("Unregistered agent: {} ({})", agent.name, agent_id);
        }
        removed
    }

    /// Get agent by ID
    pub async fn get(&self, agent_id: &str) -> Option<AgentInfo> {
        self.agents.read().await.get(agent_id).cloned()
    }

    /// Get all agents
    pub async fn list(&self) -> Vec<AgentInfo> {
        self.agents.read().await.values().cloned().collect()
    }

    /// Get available agents
    pub async fn list_available(&self) -> Vec<AgentInfo> {
        self.agents
            .read()
            .await
            .values()
            .filter(|a| a.status == AgentStatus::Available)
            .cloned()
            .collect()
    }

    /// Find agents with specific capability
    pub async fn find_by_capability(&self, capability: &AgentCapability) -> Vec<AgentInfo> {
        self.agents
            .read()
            .await
            .values()
            .filter(|a| a.has_capability(capability) && a.status == AgentStatus::Available)
            .cloned()
            .collect()
    }

    /// Find best agent for a capability (by priority and performance)
    pub async fn find_best_for_capability(
        &self,
        capability: &AgentCapability,
    ) -> Option<AgentInfo> {
        self.find_by_capability(capability)
            .await
            .into_iter()
            .max_by(|a, b| {
                // Compare by priority first, then by avg response time (lower is better)
                a.priority
                    .cmp(&b.priority)
                    .then_with(|| b.avg_response_time_ms.cmp(&a.avg_response_time_ms))
            })
    }

    /// Update agent status
    pub async fn update_status(&self, agent_id: &str, status: AgentStatus) {
        let mut agents = self.agents.write().await;
        if let Some(agent) = agents.get_mut(agent_id) {
            agent.status = status;
            agent.update_last_seen();
        }
    }

    /// Record task completion
    pub async fn record_completion(&self, agent_id: &str, duration_ms: u64) {
        let mut agents = self.agents.write().await;
        if let Some(agent) = agents.get_mut(agent_id) {
            agent.record_task_completion(duration_ms);
        }
    }

    /// Discover agents on the network
    pub async fn discover(&self) -> Vec<AgentInfo> {
        let mut discovered = Vec::new();

        if !self.config.local_discovery {
            return discovered;
        }

        // Try known external endpoints
        if self.config.auto_register_external {
            for (name, endpoint) in &self.config.external_endpoints {
                if let Some(agent) = self.probe_endpoint(name, endpoint).await {
                    discovered.push(agent);
                }
            }
        }

        // Scan discovery ports
        for port in &self.config.discovery_ports {
            let endpoint = format!("127.0.0.1:{}", port);
            if let Some(agent) = self.probe_endpoint("unknown", &endpoint).await {
                if !discovered.iter().any(|a| a.id == agent.id) {
                    discovered.push(agent);
                }
            }
        }

        // Register discovered agents
        for agent in &discovered {
            let _ = self.register(agent.clone()).await;
        }

        discovered
    }

    /// Probe an endpoint to discover an agent
    async fn probe_endpoint(&self, name: &str, endpoint: &str) -> Option<AgentInfo> {
        let timeout = Duration::from_millis(self.config.timeout_ms);

        match tokio::time::timeout(timeout, TcpStream::connect(endpoint)).await {
            Ok(Ok(_stream)) => {
                // Connection successful, create agent info
                // In production, would exchange protocol messages here
                Some(
                    AgentInfo::new(
                        format!("{}_{}", name, endpoint.replace([':', '.'], "_")),
                        name,
                        AgentType::External,
                        vec![AgentCapability::CodeGeneration, AgentCapability::CodeReview],
                    )
                    .with_endpoint(endpoint),
                )
            }
            _ => None,
        }
    }

    /// Get self agent info
    pub fn self_agent(&self) -> &AgentInfo {
        &self.self_agent
    }

    /// Health check all agents
    pub async fn health_check(&self) {
        let agents = self.agents.read().await.clone();

        for (id, agent) in agents {
            if agent.agent_type == AgentType::Internal {
                continue;
            }

            if let Some(endpoint) = &agent.endpoint {
                let is_available = self.probe_endpoint(&agent.name, endpoint).await.is_some();
                self.update_status(
                    &id,
                    if is_available {
                        AgentStatus::Available
                    } else {
                        AgentStatus::Offline
                    },
                )
                .await;
            }
        }
    }

    /// Start periodic health checks
    pub fn start_health_checker(self: Arc<Self>) {
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_secs(30));

            loop {
                interval.tick().await;
                self.health_check().await;
            }
        });
    }
}

/// Well-known external agents
pub mod known_agents {
    use super::*;

    pub fn claude_code() -> AgentInfo {
        AgentInfo::new(
            "claude-code",
            "Claude Code",
            AgentType::External,
            vec![
                AgentCapability::CodeGeneration,
                AgentCapability::CodeReview,
                AgentCapability::BugFix,
                AgentCapability::Refactoring,
                AgentCapability::TestGeneration,
                AgentCapability::Documentation,
                AgentCapability::Explanation,
                AgentCapability::FileOperations,
                AgentCapability::Terminal,
                AgentCapability::Git,
                AgentCapability::Search,
                AgentCapability::MultiFileEdit,
                AgentCapability::TaskPlanning,
                AgentCapability::AgenticExecution,
            ],
        )
        .with_endpoint("localhost:9877")
        .with_priority(90)
    }

    pub fn codex() -> AgentInfo {
        AgentInfo::new(
            "codex",
            "OpenAI Codex",
            AgentType::External,
            vec![
                AgentCapability::CodeGeneration,
                AgentCapability::Completion,
                AgentCapability::Explanation,
                AgentCapability::BugFix,
            ],
        )
        .with_endpoint("localhost:9878")
        .with_priority(70)
    }

    pub fn gemini() -> AgentInfo {
        AgentInfo::new(
            "gemini",
            "Google Gemini",
            AgentType::External,
            vec![
                AgentCapability::CodeGeneration,
                AgentCapability::CodeReview,
                AgentCapability::Explanation,
                AgentCapability::Documentation,
                AgentCapability::Search,
            ],
        )
        .with_endpoint("localhost:9879")
        .with_priority(70)
    }

    pub fn cursor() -> AgentInfo {
        AgentInfo::new(
            "cursor",
            "Cursor",
            AgentType::External,
            vec![
                AgentCapability::CodeGeneration,
                AgentCapability::Completion,
                AgentCapability::MultiFileEdit,
                AgentCapability::ContextUnderstanding,
            ],
        )
        .with_endpoint("localhost:9880")
        .with_priority(80)
    }

    pub fn augment() -> AgentInfo {
        AgentInfo::new(
            "augment",
            "Augment Code",
            AgentType::External,
            vec![
                AgentCapability::CodeGeneration,
                AgentCapability::ContextUnderstanding,
                AgentCapability::MultiFileEdit,
                AgentCapability::Search,
            ],
        )
        .with_endpoint("localhost:9881")
        .with_priority(80)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_registry_creation() {
        let registry = AgentRegistry::with_voicecode_agent();
        let agents = registry.list().await;
        assert_eq!(agents.len(), 1);
        assert_eq!(agents[0].name, "VoiceCode");
    }

    #[tokio::test]
    async fn test_register_agent() {
        let registry = AgentRegistry::with_voicecode_agent();
        let agent = AgentInfo::new(
            "test-agent",
            "Test Agent",
            AgentType::External,
            vec![AgentCapability::CodeGeneration],
        );

        registry.register(agent).await.unwrap();
        let agents = registry.list().await;
        assert_eq!(agents.len(), 2);
    }

    #[tokio::test]
    async fn test_find_by_capability() {
        let registry = AgentRegistry::with_voicecode_agent();

        let found = registry
            .find_by_capability(&AgentCapability::CodeGeneration)
            .await;
        assert!(!found.is_empty());

        let found = registry
            .find_by_capability(&AgentCapability::Custom("nonexistent".to_string()))
            .await;
        assert!(found.is_empty());
    }

    #[test]
    fn test_known_agents() {
        let claude = known_agents::claude_code();
        assert!(claude.has_capability(&AgentCapability::AgenticExecution));

        let codex = known_agents::codex();
        assert!(codex.has_capability(&AgentCapability::Completion));
    }
}
