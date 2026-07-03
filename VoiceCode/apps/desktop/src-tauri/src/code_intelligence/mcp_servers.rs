#![allow(dead_code, unused_variables, unused_imports)]
// MCP Priority Server Adapters - GitHub, Linear, Slack
// Pre-built integrations for common development tools

use std::sync::Arc;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

use super::mcp_oauth::McpOAuthManager;

/// GitHub MCP Server Adapter
pub struct GitHubMcpServer {
    oauth: Arc<McpOAuthManager>,
    base_url: String,
    http_client: reqwest::Client,
}

impl GitHubMcpServer {
    pub fn new(oauth: Arc<McpOAuthManager>) -> Self {
        Self {
            oauth,
            base_url: "https://api.github.com".to_string(),
            http_client: reqwest::Client::new(),
        }
    }

    pub async fn list_tools(&self) -> Vec<McpTool> {
        vec![
            McpTool {
                name: "github_list_repos".to_string(),
                description: "List repositories for authenticated user".to_string(),
                parameters: json!({"type": "object", "properties": {}}),
            },
            McpTool {
                name: "github_get_issues".to_string(),
                description: "Get issues for a repository".to_string(),
                parameters: json!({
                    "type": "object",
                    "properties": {
                        "owner": {"type": "string"},
                        "repo": {"type": "string"},
                        "state": {"type": "string", "enum": ["open", "closed", "all"]}
                    },
                    "required": ["owner", "repo"]
                }),
            },
            McpTool {
                name: "github_create_issue".to_string(),
                description: "Create a new issue".to_string(),
                parameters: json!({
                    "type": "object",
                    "properties": {
                        "owner": {"type": "string"},
                        "repo": {"type": "string"},
                        "title": {"type": "string"},
                        "body": {"type": "string"}
                    },
                    "required": ["owner", "repo", "title"]
                }),
            },
            McpTool {
                name: "github_list_prs".to_string(),
                description: "List pull requests for a repository".to_string(),
                parameters: json!({
                    "type": "object",
                    "properties": {
                        "owner": {"type": "string"},
                        "repo": {"type": "string"},
                        "state": {"type": "string", "enum": ["open", "closed", "all"]}
                    },
                    "required": ["owner", "repo"]
                }),
            },
            McpTool {
                name: "github_get_pr_diff".to_string(),
                description: "Get diff for a pull request".to_string(),
                parameters: json!({
                    "type": "object",
                    "properties": {
                        "owner": {"type": "string"},
                        "repo": {"type": "string"},
                        "pr_number": {"type": "integer"}
                    },
                    "required": ["owner", "repo", "pr_number"]
                }),
            },
            McpTool {
                name: "github_get_workflow_runs".to_string(),
                description: "Get GitHub Actions workflow runs".to_string(),
                parameters: json!({
                    "type": "object",
                    "properties": {
                        "owner": {"type": "string"},
                        "repo": {"type": "string"}
                    },
                    "required": ["owner", "repo"]
                }),
            },
        ]
    }

    pub async fn call_tool(&self, name: &str, args: Value) -> Result<Value, String> {
        let token = self.oauth.get_valid_token("github").await?;
        
        match name {
            "github_list_repos" => self.list_repos(&token).await,
            "github_get_issues" => {
                let owner = args["owner"].as_str().ok_or("Missing owner")?;
                let repo = args["repo"].as_str().ok_or("Missing repo")?;
                let state = args["state"].as_str().unwrap_or("open");
                self.get_issues(&token, owner, repo, state).await
            }
            "github_create_issue" => {
                let owner = args["owner"].as_str().ok_or("Missing owner")?;
                let repo = args["repo"].as_str().ok_or("Missing repo")?;
                let title = args["title"].as_str().ok_or("Missing title")?;
                let body = args["body"].as_str().unwrap_or("");
                self.create_issue(&token, owner, repo, title, body).await
            }
            "github_list_prs" => {
                let owner = args["owner"].as_str().ok_or("Missing owner")?;
                let repo = args["repo"].as_str().ok_or("Missing repo")?;
                let state = args["state"].as_str().unwrap_or("open");
                self.list_prs(&token, owner, repo, state).await
            }
            "github_get_pr_diff" => {
                let owner = args["owner"].as_str().ok_or("Missing owner")?;
                let repo = args["repo"].as_str().ok_or("Missing repo")?;
                let pr_number = args["pr_number"].as_i64().ok_or("Missing pr_number")? as i32;
                self.get_pr_diff(&token, owner, repo, pr_number).await
            }
            "github_get_workflow_runs" => {
                let owner = args["owner"].as_str().ok_or("Missing owner")?;
                let repo = args["repo"].as_str().ok_or("Missing repo")?;
                self.get_workflow_runs(&token, owner, repo).await
            }
            _ => Err(format!("Unknown tool: {}", name)),
        }
    }

    async fn list_repos(&self, token: &str) -> Result<Value, String> {
        let resp = self.http_client
            .get(format!("{}/user/repos", self.base_url))
            .header("Authorization", format!("Bearer {}", token))
            .header("Accept", "application/vnd.github.v3+json")
            .header("User-Agent", "VoiceCode")
            .send().await.map_err(|e| e.to_string())?;
        resp.json().await.map_err(|e| e.to_string())
    }

    async fn get_issues(&self, token: &str, owner: &str, repo: &str, state: &str) -> Result<Value, String> {
        let resp = self.http_client
            .get(format!("{}/repos/{}/{}/issues?state={}", self.base_url, owner, repo, state))
            .header("Authorization", format!("Bearer {}", token))
            .header("Accept", "application/vnd.github.v3+json")
            .header("User-Agent", "VoiceCode")
            .send().await.map_err(|e| e.to_string())?;
        resp.json().await.map_err(|e| e.to_string())
    }

    async fn create_issue(&self, token: &str, owner: &str, repo: &str, title: &str, body: &str) -> Result<Value, String> {
        let resp = self.http_client
            .post(format!("{}/repos/{}/{}/issues", self.base_url, owner, repo))
            .header("Authorization", format!("Bearer {}", token))
            .header("Accept", "application/vnd.github.v3+json")
            .header("User-Agent", "VoiceCode")
            .json(&json!({"title": title, "body": body}))
            .send().await.map_err(|e| e.to_string())?;
        resp.json().await.map_err(|e| e.to_string())
    }

    async fn list_prs(&self, token: &str, owner: &str, repo: &str, state: &str) -> Result<Value, String> {
        let resp = self.http_client
            .get(format!("{}/repos/{}/{}/pulls?state={}", self.base_url, owner, repo, state))
            .header("Authorization", format!("Bearer {}", token))
            .header("Accept", "application/vnd.github.v3+json")
            .header("User-Agent", "VoiceCode")
            .send().await.map_err(|e| e.to_string())?;
        resp.json().await.map_err(|e| e.to_string())
    }

    async fn get_pr_diff(&self, token: &str, owner: &str, repo: &str, pr_number: i32) -> Result<Value, String> {
        let resp = self.http_client
            .get(format!("{}/repos/{}/{}/pulls/{}", self.base_url, owner, repo, pr_number))
            .header("Authorization", format!("Bearer {}", token))
            .header("Accept", "application/vnd.github.v3.diff")
            .header("User-Agent", "VoiceCode")
            .send().await.map_err(|e| e.to_string())?;
        let diff = resp.text().await.map_err(|e| e.to_string())?;
        Ok(json!({"diff": diff}))
    }

    async fn get_workflow_runs(&self, token: &str, owner: &str, repo: &str) -> Result<Value, String> {
        let resp = self.http_client
            .get(format!("{}/repos/{}/{}/actions/runs", self.base_url, owner, repo))
            .header("Authorization", format!("Bearer {}", token))
            .header("Accept", "application/vnd.github.v3+json")
            .header("User-Agent", "VoiceCode")
            .send().await.map_err(|e| e.to_string())?;
        resp.json().await.map_err(|e| e.to_string())
    }
}

/// Linear MCP Server Adapter
pub struct LinearMcpServer {
    oauth: Arc<McpOAuthManager>,
    base_url: String,
    http_client: reqwest::Client,
}

impl LinearMcpServer {
    pub fn new(oauth: Arc<McpOAuthManager>) -> Self {
        Self {
            oauth,
            base_url: "https://api.linear.app".to_string(),
            http_client: reqwest::Client::new(),
        }
    }

    pub async fn list_tools(&self) -> Vec<McpTool> {
        vec![
            McpTool {
                name: "linear_list_issues".to_string(),
                description: "List issues assigned to me".to_string(),
                parameters: json!({"type": "object", "properties": {}}),
            },
            McpTool {
                name: "linear_create_issue".to_string(),
                description: "Create a new Linear issue".to_string(),
                parameters: json!({
                    "type": "object",
                    "properties": {
                        "title": {"type": "string"},
                        "description": {"type": "string"},
                        "teamId": {"type": "string"},
                        "priority": {"type": "integer", "minimum": 0, "maximum": 4}
                    },
                    "required": ["title", "teamId"]
                }),
            },
            McpTool {
                name: "linear_update_issue".to_string(),
                description: "Update an existing issue".to_string(),
                parameters: json!({
                    "type": "object",
                    "properties": {
                        "issueId": {"type": "string"},
                        "stateId": {"type": "string"},
                        "priority": {"type": "integer"}
                    },
                    "required": ["issueId"]
                }),
            },
            McpTool {
                name: "linear_list_teams".to_string(),
                description: "List all teams".to_string(),
                parameters: json!({"type": "object", "properties": {}}),
            },
        ]
    }

    pub async fn call_tool(&self, name: &str, args: Value) -> Result<Value, String> {
        let token = self.oauth.get_valid_token("linear").await?;

        match name {
            "linear_list_issues" => self.list_my_issues(&token).await,
            "linear_create_issue" => {
                let title = args["title"].as_str().ok_or("Missing title")?;
                let team_id = args["teamId"].as_str().ok_or("Missing teamId")?;
                let description = args["description"].as_str().unwrap_or("");
                let priority = args["priority"].as_i64().map(|p| p as i32);
                self.create_issue(&token, title, description, team_id, priority).await
            }
            "linear_update_issue" => {
                let issue_id = args["issueId"].as_str().ok_or("Missing issueId")?;
                self.update_issue(&token, issue_id, &args).await
            }
            "linear_list_teams" => self.list_teams(&token).await,
            _ => Err(format!("Unknown tool: {}", name)),
        }
    }

    async fn graphql(&self, token: &str, query: &str, variables: Value) -> Result<Value, String> {
        let resp = self.http_client
            .post(format!("{}/graphql", self.base_url))
            .header("Authorization", format!("Bearer {}", token))
            .header("Content-Type", "application/json")
            .json(&json!({"query": query, "variables": variables}))
            .send().await.map_err(|e| e.to_string())?;
        resp.json().await.map_err(|e| e.to_string())
    }

    async fn list_my_issues(&self, token: &str) -> Result<Value, String> {
        let query = r#"
            query { 
                viewer { 
                    assignedIssues { 
                        nodes { 
                            id title state { name } priority 
                        } 
                    } 
                } 
            }
        "#;
        self.graphql(token, query, json!({})).await
    }

    async fn create_issue(&self, token: &str, title: &str, description: &str, team_id: &str, priority: Option<i32>) -> Result<Value, String> {
        let query = r#"
            mutation CreateIssue($input: IssueCreateInput!) {
                issueCreate(input: $input) {
                    success
                    issue { id title }
                }
            }
        "#;
        let mut input = json!({
            "title": title,
            "description": description,
            "teamId": team_id
        });
        if let Some(p) = priority {
            input["priority"] = json!(p);
        }
        self.graphql(token, query, json!({"input": input})).await
    }

    async fn update_issue(&self, token: &str, issue_id: &str, updates: &Value) -> Result<Value, String> {
        let query = r#"
            mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) {
                issueUpdate(id: $id, input: $input) {
                    success
                    issue { id title state { name } }
                }
            }
        "#;
        let mut input = json!({});
        if let Some(state_id) = updates["stateId"].as_str() {
            input["stateId"] = json!(state_id);
        }
        if let Some(priority) = updates["priority"].as_i64() {
            input["priority"] = json!(priority);
        }
        self.graphql(token, query, json!({"id": issue_id, "input": input})).await
    }

    async fn list_teams(&self, token: &str) -> Result<Value, String> {
        let query = r#"query { teams { nodes { id name } } }"#;
        self.graphql(token, query, json!({})).await
    }
}

/// Slack MCP Server Adapter
pub struct SlackMcpServer {
    oauth: Arc<McpOAuthManager>,
    base_url: String,
    http_client: reqwest::Client,
}

impl SlackMcpServer {
    pub fn new(oauth: Arc<McpOAuthManager>) -> Self {
        Self {
            oauth,
            base_url: "https://slack.com/api".to_string(),
            http_client: reqwest::Client::new(),
        }
    }

    pub async fn list_tools(&self) -> Vec<McpTool> {
        vec![
            McpTool {
                name: "slack_post_message".to_string(),
                description: "Post a message to a Slack channel".to_string(),
                parameters: json!({
                    "type": "object",
                    "properties": {
                        "channel": {"type": "string"},
                        "text": {"type": "string"}
                    },
                    "required": ["channel", "text"]
                }),
            },
            McpTool {
                name: "slack_list_channels".to_string(),
                description: "List Slack channels".to_string(),
                parameters: json!({"type": "object", "properties": {}}),
            },
            McpTool {
                name: "slack_get_channel_history".to_string(),
                description: "Get recent messages from a channel".to_string(),
                parameters: json!({
                    "type": "object",
                    "properties": {
                        "channel": {"type": "string"},
                        "limit": {"type": "integer", "default": 10}
                    },
                    "required": ["channel"]
                }),
            },
        ]
    }

    pub async fn call_tool(&self, name: &str, args: Value) -> Result<Value, String> {
        let token = self.oauth.get_valid_token("slack").await?;

        match name {
            "slack_post_message" => {
                let channel = args["channel"].as_str().ok_or("Missing channel")?;
                let text = args["text"].as_str().ok_or("Missing text")?;
                self.post_message(&token, channel, text).await
            }
            "slack_list_channels" => self.list_channels(&token).await,
            "slack_get_channel_history" => {
                let channel = args["channel"].as_str().ok_or("Missing channel")?;
                let limit = args["limit"].as_i64().unwrap_or(10) as i32;
                self.get_channel_history(&token, channel, limit).await
            }
            _ => Err(format!("Unknown tool: {}", name)),
        }
    }

    async fn post_message(&self, token: &str, channel: &str, text: &str) -> Result<Value, String> {
        let resp = self.http_client
            .post(format!("{}/chat.postMessage", self.base_url))
            .header("Authorization", format!("Bearer {}", token))
            .json(&json!({"channel": channel, "text": text}))
            .send().await.map_err(|e| e.to_string())?;
        resp.json().await.map_err(|e| e.to_string())
    }

    async fn list_channels(&self, token: &str) -> Result<Value, String> {
        let resp = self.http_client
            .get(format!("{}/conversations.list", self.base_url))
            .header("Authorization", format!("Bearer {}", token))
            .send().await.map_err(|e| e.to_string())?;
        resp.json().await.map_err(|e| e.to_string())
    }

    async fn get_channel_history(&self, token: &str, channel: &str, limit: i32) -> Result<Value, String> {
        let resp = self.http_client
            .get(format!("{}/conversations.history?channel={}&limit={}", self.base_url, channel, limit))
            .header("Authorization", format!("Bearer {}", token))
            .send().await.map_err(|e| e.to_string())?;
        resp.json().await.map_err(|e| e.to_string())
    }
}

/// MCP Tool definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpTool {
    pub name: String,
    pub description: String,
    pub parameters: Value,
}

/// Unified MCP Server Manager
pub struct McpServerRegistry {
    oauth: Arc<McpOAuthManager>,
    github: Option<GitHubMcpServer>,
    linear: Option<LinearMcpServer>,
    slack: Option<SlackMcpServer>,
}

impl McpServerRegistry {
    pub fn new() -> Self {
        Self {
            oauth: Arc::new(McpOAuthManager::new()),
            github: None,
            linear: None,
            slack: None,
        }
    }

    pub fn register_github(&mut self, client_id: &str, client_secret: Option<&str>) {
        let config = super::mcp_oauth::providers::github(client_id, client_secret);
        self.oauth.register_config(config);
        self.github = Some(GitHubMcpServer::new(Arc::clone(&self.oauth)));
    }

    pub fn register_linear(&mut self, client_id: &str) {
        let config = super::mcp_oauth::providers::linear(client_id);
        self.oauth.register_config(config);
        self.linear = Some(LinearMcpServer::new(Arc::clone(&self.oauth)));
    }

    pub fn register_slack(&mut self, client_id: &str, client_secret: &str) {
        let config = super::mcp_oauth::providers::slack(client_id, client_secret);
        self.oauth.register_config(config);
        self.slack = Some(SlackMcpServer::new(Arc::clone(&self.oauth)));
    }

    pub fn oauth_manager(&self) -> Arc<McpOAuthManager> {
        Arc::clone(&self.oauth)
    }

    pub async fn list_all_tools(&self) -> Vec<McpTool> {
        let mut tools = Vec::new();
        if let Some(ref gh) = self.github { tools.extend(gh.list_tools().await); }
        if let Some(ref li) = self.linear { tools.extend(li.list_tools().await); }
        if let Some(ref sl) = self.slack { tools.extend(sl.list_tools().await); }
        tools
    }

    pub async fn call_tool(&self, name: &str, args: Value) -> Result<Value, String> {
        if name.starts_with("github_") {
            self.github.as_ref().ok_or("GitHub not configured")?.call_tool(name, args).await
        } else if name.starts_with("linear_") {
            self.linear.as_ref().ok_or("Linear not configured")?.call_tool(name, args).await
        } else if name.starts_with("slack_") {
            self.slack.as_ref().ok_or("Slack not configured")?.call_tool(name, args).await
        } else {
            Err(format!("Unknown tool: {}", name))
        }
    }
}

impl Default for McpServerRegistry {
    fn default() -> Self { Self::new() }
}
