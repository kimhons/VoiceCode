#![allow(dead_code, unused_variables, unused_imports)]
// MCP OAuth 2.0 + PKCE Implementation
// Secure authentication for MCP server connections

use std::collections::HashMap;
use std::time::{SystemTime, UNIX_EPOCH};
use serde::{Deserialize, Serialize};
use parking_lot::RwLock;
use sha2::{Sha256, Digest};
use base64::{Engine as _, engine::general_purpose::URL_SAFE_NO_PAD};
use rand::Rng;

/// OAuth 2.0 + PKCE Manager for MCP authentication
pub struct McpOAuthManager {
    configs: RwLock<HashMap<String, OAuthConfig>>,
    tokens: RwLock<HashMap<String, TokenData>>,
    pending_auth: RwLock<HashMap<String, PendingAuth>>,
    http_client: reqwest::Client,
}

/// OAuth configuration for an MCP server
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OAuthConfig {
    pub server_name: String,
    pub client_id: String,
    pub client_secret: Option<String>,
    pub auth_url: String,
    pub token_url: String,
    pub redirect_uri: String,
    pub scopes: Vec<String>,
    pub use_pkce: bool,
}

/// Stored token data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenData {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub token_type: String,
    pub expires_at: Option<u64>,
    pub scopes: Vec<String>,
}

/// Pending authentication state
#[derive(Debug, Clone)]
struct PendingAuth {
    state: String,
    code_verifier: Option<String>,
    created_at: u64,
}

/// OAuth authorization response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthorizationResponse {
    pub auth_url: String,
    pub state: String,
}

/// Token response from OAuth server
#[derive(Debug, Deserialize)]
struct TokenResponse {
    access_token: String,
    refresh_token: Option<String>,
    token_type: String,
    expires_in: Option<u64>,
    scope: Option<String>,
}

/// OAuth error
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OAuthError {
    pub error: String,
    pub error_description: Option<String>,
}

impl McpOAuthManager {
    pub fn new() -> Self {
        Self {
            configs: RwLock::new(HashMap::new()),
            tokens: RwLock::new(HashMap::new()),
            pending_auth: RwLock::new(HashMap::new()),
            http_client: reqwest::Client::new(),
        }
    }

    /// Register an OAuth configuration for an MCP server
    pub fn register_config(&self, config: OAuthConfig) {
        self.configs.write().insert(config.server_name.clone(), config);
    }

    /// Start OAuth authorization flow
    pub fn start_authorization(&self, server_name: &str) -> Result<AuthorizationResponse, String> {
        let configs = self.configs.read();
        let config = configs.get(server_name)
            .ok_or_else(|| format!("No OAuth config for server: {}", server_name))?;

        let state = self.generate_state();
        let (code_verifier, code_challenge) = if config.use_pkce {
            let verifier = self.generate_code_verifier();
            let challenge = self.generate_code_challenge(&verifier);
            (Some(verifier), Some(challenge))
        } else {
            (None, None)
        };

        // Build authorization URL
        let mut params = vec![
            ("response_type", "code".to_string()),
            ("client_id", config.client_id.clone()),
            ("redirect_uri", config.redirect_uri.clone()),
            ("state", state.clone()),
            ("scope", config.scopes.join(" ")),
        ];

        if let Some(ref challenge) = code_challenge {
            params.push(("code_challenge", challenge.clone()));
            params.push(("code_challenge_method", "S256".to_string()));
        }

        let query = params.iter()
            .map(|(k, v)| format!("{}={}", k, urlencoding::encode(v)))
            .collect::<Vec<_>>()
            .join("&");

        let auth_url = format!("{}?{}", config.auth_url, query);

        // Store pending auth
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        self.pending_auth.write().insert(state.clone(), PendingAuth {
            state: state.clone(),
            code_verifier,
            created_at: now,
        });

        Ok(AuthorizationResponse { auth_url, state })
    }

    /// Complete OAuth flow with authorization code
    pub async fn exchange_code(
        &self,
        server_name: &str,
        code: &str,
        state: &str,
    ) -> Result<TokenData, String> {
        // Verify state and get pending auth
        let pending = {
            let mut pending_auth = self.pending_auth.write();
            pending_auth.remove(state)
                .ok_or_else(|| "Invalid or expired state".to_string())?
        };

        let configs = self.configs.read();
        let config = configs.get(server_name)
            .ok_or_else(|| format!("No OAuth config for server: {}", server_name))?;

        // Build token request
        let mut params = vec![
            ("grant_type", "authorization_code".to_string()),
            ("code", code.to_string()),
            ("redirect_uri", config.redirect_uri.clone()),
            ("client_id", config.client_id.clone()),
        ];

        if let Some(ref secret) = config.client_secret {
            params.push(("client_secret", secret.clone()));
        }

        if let Some(verifier) = pending.code_verifier {
            params.push(("code_verifier", verifier));
        }

        let response = self.http_client
            .post(&config.token_url)
            .form(&params)
            .send()
            .await
            .map_err(|e| format!("Token request failed: {}", e))?;

        if !response.status().is_success() {
            let error: OAuthError = response.json().await
                .unwrap_or(OAuthError {
                    error: "unknown_error".to_string(),
                    error_description: None,
                });
            return Err(format!("Token error: {} - {:?}", error.error, error.error_description));
        }

        let token_response: TokenResponse = response.json().await
            .map_err(|e| format!("Failed to parse token response: {}", e))?;

        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        let token_data = TokenData {
            access_token: token_response.access_token,
            refresh_token: token_response.refresh_token,
            token_type: token_response.token_type,
            expires_at: token_response.expires_in.map(|e| now + e),
            scopes: token_response.scope
                .map(|s| s.split_whitespace().map(String::from).collect())
                .unwrap_or_else(|| config.scopes.clone()),
        };

        // Store token
        self.tokens.write().insert(server_name.to_string(), token_data.clone());

        Ok(token_data)
    }

    /// Refresh an expired token
    pub async fn refresh_token(&self, server_name: &str) -> Result<TokenData, String> {
        let refresh_token = {
            let tokens = self.tokens.read();
            tokens.get(server_name)
                .and_then(|t| t.refresh_token.clone())
                .ok_or_else(|| "No refresh token available".to_string())?
        };

        let configs = self.configs.read();
        let config = configs.get(server_name)
            .ok_or_else(|| format!("No OAuth config for server: {}", server_name))?;

        let mut params = vec![
            ("grant_type", "refresh_token".to_string()),
            ("refresh_token", refresh_token),
            ("client_id", config.client_id.clone()),
        ];

        if let Some(ref secret) = config.client_secret {
            params.push(("client_secret", secret.clone()));
        }

        let response = self.http_client
            .post(&config.token_url)
            .form(&params)
            .send()
            .await
            .map_err(|e| format!("Refresh request failed: {}", e))?;

        if !response.status().is_success() {
            return Err("Token refresh failed".to_string());
        }

        let token_response: TokenResponse = response.json().await
            .map_err(|e| format!("Failed to parse refresh response: {}", e))?;

        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        let token_data = TokenData {
            access_token: token_response.access_token,
            refresh_token: token_response.refresh_token,
            token_type: token_response.token_type,
            expires_at: token_response.expires_in.map(|e| now + e),
            scopes: token_response.scope
                .map(|s| s.split_whitespace().map(String::from).collect())
                .unwrap_or_default(),
        };

        self.tokens.write().insert(server_name.to_string(), token_data.clone());

        Ok(token_data)
    }

    /// Get a valid access token, refreshing if needed
    pub async fn get_valid_token(&self, server_name: &str) -> Result<String, String> {
        let token_data = {
            let tokens = self.tokens.read();
            tokens.get(server_name).cloned()
        };

        match token_data {
            Some(token) => {
                // Check if expired
                if let Some(expires_at) = token.expires_at {
                    let now = SystemTime::now()
                        .duration_since(UNIX_EPOCH)
                        .unwrap()
                        .as_secs();

                    if now >= expires_at - 60 {
                        // Token expired or expiring soon, refresh
                        let refreshed = self.refresh_token(server_name).await?;
                        return Ok(refreshed.access_token);
                    }
                }
                Ok(token.access_token)
            }
            None => Err(format!("No token for server: {}", server_name)),
        }
    }

    /// Check if we have a valid token for a server
    pub fn has_valid_token(&self, server_name: &str) -> bool {
        let tokens = self.tokens.read();
        if let Some(token) = tokens.get(server_name) {
            if let Some(expires_at) = token.expires_at {
                let now = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs();
                return now < expires_at;
            }
            return true;
        }
        false
    }

    /// Revoke a token
    pub fn revoke_token(&self, server_name: &str) {
        self.tokens.write().remove(server_name);
    }

    fn generate_state(&self) -> String {
        let mut rng = rand::thread_rng();
        let bytes: [u8; 32] = rng.gen();
        URL_SAFE_NO_PAD.encode(bytes)
    }

    fn generate_code_verifier(&self) -> String {
        let mut rng = rand::thread_rng();
        let bytes: [u8; 32] = rng.gen();
        URL_SAFE_NO_PAD.encode(bytes)
    }

    fn generate_code_challenge(&self, verifier: &str) -> String {
        let mut hasher = Sha256::new();
        hasher.update(verifier.as_bytes());
        let result = hasher.finalize();
        URL_SAFE_NO_PAD.encode(result)
    }

    /// Clean up expired pending authorizations
    pub fn cleanup_expired(&self) {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        self.pending_auth.write().retain(|_, v| now - v.created_at < 600);
    }
}

impl Default for McpOAuthManager {
    fn default() -> Self {
        Self::new()
    }
}

/// Pre-configured OAuth settings for common providers
pub mod providers {
    use super::OAuthConfig;

    pub fn github(client_id: &str, client_secret: Option<&str>) -> OAuthConfig {
        OAuthConfig {
            server_name: "github".to_string(),
            client_id: client_id.to_string(),
            client_secret: client_secret.map(String::from),
            auth_url: "https://github.com/login/oauth/authorize".to_string(),
            token_url: "https://github.com/login/oauth/access_token".to_string(),
            redirect_uri: "http://localhost:9876/callback".to_string(),
            scopes: vec!["repo".to_string(), "read:user".to_string()],
            use_pkce: false,
        }
    }

    pub fn linear(client_id: &str) -> OAuthConfig {
        OAuthConfig {
            server_name: "linear".to_string(),
            client_id: client_id.to_string(),
            client_secret: None,
            auth_url: "https://linear.app/oauth/authorize".to_string(),
            token_url: "https://api.linear.app/oauth/token".to_string(),
            redirect_uri: "http://localhost:9876/callback".to_string(),
            scopes: vec!["read".to_string(), "write".to_string()],
            use_pkce: true,
        }
    }

    pub fn slack(client_id: &str, client_secret: &str) -> OAuthConfig {
        OAuthConfig {
            server_name: "slack".to_string(),
            client_id: client_id.to_string(),
            client_secret: Some(client_secret.to_string()),
            auth_url: "https://slack.com/oauth/v2/authorize".to_string(),
            token_url: "https://slack.com/api/oauth.v2.access".to_string(),
            redirect_uri: "http://localhost:9876/callback".to_string(),
            scopes: vec!["chat:write".to_string(), "channels:read".to_string()],
            use_pkce: false,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_oauth_manager_creation() {
        let manager = McpOAuthManager::new();
        assert!(!manager.has_valid_token("test"));
    }

    #[test]
    fn test_code_challenge_generation() {
        let manager = McpOAuthManager::new();
        let verifier = manager.generate_code_verifier();
        let challenge = manager.generate_code_challenge(&verifier);
        
        assert!(!verifier.is_empty());
        assert!(!challenge.is_empty());
        assert_ne!(verifier, challenge);
    }

    #[test]
    fn test_state_generation() {
        let manager = McpOAuthManager::new();
        let state1 = manager.generate_state();
        let state2 = manager.generate_state();
        
        assert!(!state1.is_empty());
        assert_ne!(state1, state2);
    }
}
