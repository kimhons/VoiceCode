#![allow(dead_code, unused_variables, unused_imports)]
// Browser Agent - Web automation using Playwright MCP or direct control
// Provides navigation, interaction, and data extraction from websites

use std::collections::HashMap;
use std::path::PathBuf;
use std::process::Stdio;
use serde::{Deserialize, Serialize};
use parking_lot::RwLock;
use tokio::process::{Command, Child};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};

/// Browser mode
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum BrowserMode {
    Headless,     // No visible browser (fast, for automation)
    Visible,      // Visible browser (user can watch)
    Interactive,  // User can intervene at any time
}

/// Browser action types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BrowserAction {
    Navigate { url: String },
    Click { selector: ElementSelector },
    Type { selector: ElementSelector, text: String },
    Select { selector: ElementSelector, value: String },
    Scroll { direction: ScrollDirection, amount: i32 },
    Screenshot { full_page: bool },
    ExtractText { selector: Option<ElementSelector> },
    ExtractLinks,
    ExtractTables,
    WaitForElement { selector: String, timeout_ms: u64 },
    WaitForNavigation { timeout_ms: u64 },
    ExecuteJs { script: String },
    GoBack,
    GoForward,
    Refresh,
    Close,
}

/// Element selector types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ElementSelector {
    Css(String),
    XPath(String),
    Text(String),
    AiDescription(String),  // Natural language description
    Index(usize),           // Element by index from last extraction
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum ScrollDirection {
    Up,
    Down,
    Left,
    Right,
}

/// Browser action result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrowseResult {
    pub success: bool,
    pub action: BrowserAction,
    pub data: Option<BrowserData>,
    pub screenshot: Option<Vec<u8>>,
    pub error: Option<String>,
    pub current_url: Option<String>,
    pub page_title: Option<String>,
}

/// Data extracted from browser
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BrowserData {
    Text(String),
    Links(Vec<LinkInfo>),
    Tables(Vec<TableData>),
    Elements(Vec<ElementInfo>),
    JsResult(serde_json::Value),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LinkInfo {
    pub text: String,
    pub href: String,
    pub title: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TableData {
    pub headers: Vec<String>,
    pub rows: Vec<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ElementInfo {
    pub tag: String,
    pub id: Option<String>,
    pub classes: Vec<String>,
    pub text: Option<String>,
    pub attributes: HashMap<String, String>,
}

/// Browser configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrowserConfig {
    pub mode: BrowserMode,
    pub default_timeout_ms: u64,
    pub viewport_width: u32,
    pub viewport_height: u32,
    pub user_agent: Option<String>,
    pub proxy: Option<String>,
    pub allowed_domains: Vec<String>,
    pub blocked_domains: Vec<String>,
    pub download_dir: Option<PathBuf>,
    pub cookies_file: Option<PathBuf>,
}

impl Default for BrowserConfig {
    fn default() -> Self {
        Self {
            mode: BrowserMode::Visible,
            default_timeout_ms: 30000,
            viewport_width: 1280,
            viewport_height: 720,
            user_agent: None,
            proxy: None,
            allowed_domains: vec![],
            blocked_domains: vec![
                "malware.com".to_string(),
                "phishing.com".to_string(),
            ],
            download_dir: None,
            cookies_file: None,
        }
    }
}

/// Browser agent state
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BrowserState {
    Closed,
    Starting,
    Ready,
    Navigating,
    Executing,
    Error,
}

/// Browser Agent
pub struct BrowserAgent {
    config: RwLock<BrowserConfig>,
    state: RwLock<BrowserState>,
    playwright_process: RwLock<Option<Child>>,
    current_url: RwLock<Option<String>>,
    page_title: RwLock<Option<String>>,
    last_elements: RwLock<Vec<ElementInfo>>,
    action_history: RwLock<Vec<BrowseResult>>,
}

impl BrowserAgent {
    pub fn new(config: BrowserConfig) -> Self {
        Self {
            config: RwLock::new(config),
            state: RwLock::new(BrowserState::Closed),
            playwright_process: RwLock::new(None),
            current_url: RwLock::new(None),
            page_title: RwLock::new(None),
            last_elements: RwLock::new(Vec::new()),
            action_history: RwLock::new(Vec::new()),
        }
    }

    /// Start the browser
    pub async fn start(&self) -> Result<(), String> {
        if *self.state.read() != BrowserState::Closed {
            return Ok(());  // Already started
        }

        *self.state.write() = BrowserState::Starting;

        let config = self.config.read().clone();
        
        // Start Playwright via MCP or direct subprocess
        let headless = matches!(config.mode, BrowserMode::Headless);
        
        // Python script to start Playwright browser
        let script = format!(r#"
import asyncio
import json
import sys
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless={})
        context = await browser.new_context(
            viewport={{'width': {}, 'height': {}}}
        )
        page = await context.new_page()
        
        # Read commands from stdin, write results to stdout
        while True:
            try:
                line = input()
                cmd = json.loads(line)
                result = await handle_command(page, cmd)
                print(json.dumps(result))
                sys.stdout.flush()
            except EOFError:
                break
            except Exception as e:
                print(json.dumps({{'error': str(e)}}))
                sys.stdout.flush()
        
        await browser.close()

async def handle_command(page, cmd):
    action = cmd.get('action')
    
    if action == 'navigate':
        await page.goto(cmd['url'], timeout=30000)
        return {{'success': True, 'url': page.url, 'title': await page.title()}}
    
    elif action == 'click':
        await page.click(cmd['selector'])
        return {{'success': True}}
    
    elif action == 'type':
        await page.fill(cmd['selector'], cmd['text'])
        return {{'success': True}}
    
    elif action == 'screenshot':
        data = await page.screenshot(full_page=cmd.get('full_page', False))
        import base64
        return {{'success': True, 'data': base64.b64encode(data).decode()}}
    
    elif action == 'extract_text':
        selector = cmd.get('selector', 'body')
        text = await page.inner_text(selector)
        return {{'success': True, 'text': text}}
    
    elif action == 'extract_links':
        links = await page.eval_on_selector_all('a[href]', '''
            elements => elements.map(el => ({{
                text: el.innerText.trim(),
                href: el.href,
                title: el.title || null
            }}))
        ''')
        return {{'success': True, 'links': links}}
    
    elif action == 'wait':
        await page.wait_for_selector(cmd['selector'], timeout=cmd.get('timeout', 10000))
        return {{'success': True}}
    
    elif action == 'js':
        result = await page.evaluate(cmd['script'])
        return {{'success': True, 'result': result}}
    
    elif action == 'back':
        await page.go_back()
        return {{'success': True}}
    
    elif action == 'forward':
        await page.go_forward()
        return {{'success': True}}
    
    elif action == 'refresh':
        await page.reload()
        return {{'success': True}}
    
    return {{'error': 'Unknown action'}}

asyncio.run(main())
"#, 
            if headless { "True" } else { "False" },
            config.viewport_width,
            config.viewport_height
        );

        // Start Python process
        let child = Command::new("python")
            .arg("-c")
            .arg(&script)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!("Failed to start browser: {}", e))?;

        *self.playwright_process.write() = Some(child);
        *self.state.write() = BrowserState::Ready;

        Ok(())
    }

    /// Execute a browser action
    pub async fn execute(&self, action: BrowserAction) -> Result<BrowseResult, String> {
        // Ensure browser is started
        if *self.state.read() == BrowserState::Closed {
            self.start().await?;
        }

        // Validate action
        self.validate_action(&action)?;

        *self.state.write() = BrowserState::Executing;

        let result = self.send_command(&action).await;
        
        *self.state.write() = BrowserState::Ready;

        // Update state based on result
        if let Ok(ref r) = result {
            if let Some(ref url) = r.current_url {
                *self.current_url.write() = Some(url.clone());
            }
            if let Some(ref title) = r.page_title {
                *self.page_title.write() = Some(title.clone());
            }
            self.action_history.write().push(r.clone());
        }

        result
    }

    async fn send_command(&self, action: &BrowserAction) -> Result<BrowseResult, String> {
        let mut process_guard = self.playwright_process.write();
        let process = process_guard.as_mut()
            .ok_or("Browser not started")?;

        let stdin = process.stdin.as_mut()
            .ok_or("Failed to get stdin")?;
        let stdout = process.stdout.as_mut()
            .ok_or("Failed to get stdout")?;

        // Convert action to JSON command
        let cmd = self.action_to_command(action);
        let cmd_json = serde_json::to_string(&cmd)
            .map_err(|e| format!("Serialization error: {}", e))?;

        // Send command
        stdin.write_all(cmd_json.as_bytes()).await
            .map_err(|e| format!("Write error: {}", e))?;
        stdin.write_all(b"\n").await
            .map_err(|e| format!("Write error: {}", e))?;
        stdin.flush().await
            .map_err(|e| format!("Flush error: {}", e))?;

        // Read response
        let mut reader = BufReader::new(stdout);
        let mut line = String::new();
        reader.read_line(&mut line).await
            .map_err(|e| format!("Read error: {}", e))?;

        // Parse response
        let response: serde_json::Value = serde_json::from_str(&line)
            .map_err(|e| format!("Parse error: {}", e))?;

        if let Some(error) = response.get("error") {
            return Ok(BrowseResult {
                success: false,
                action: action.clone(),
                data: None,
                screenshot: None,
                error: Some(error.as_str().unwrap_or("Unknown error").to_string()),
                current_url: None,
                page_title: None,
            });
        }

        let data = self.parse_response_data(&response, action);
        let screenshot = response.get("data")
            .and_then(|d| d.as_str())
            .and_then(|s| base64::Engine::decode(&base64::engine::general_purpose::STANDARD, s).ok());

        Ok(BrowseResult {
            success: true,
            action: action.clone(),
            data,
            screenshot,
            error: None,
            current_url: response.get("url").and_then(|u| u.as_str()).map(String::from),
            page_title: response.get("title").and_then(|t| t.as_str()).map(String::from),
        })
    }

    fn action_to_command(&self, action: &BrowserAction) -> serde_json::Value {
        match action {
            BrowserAction::Navigate { url } => {
                serde_json::json!({ "action": "navigate", "url": url })
            }
            BrowserAction::Click { selector } => {
                serde_json::json!({ "action": "click", "selector": self.selector_to_string(selector) })
            }
            BrowserAction::Type { selector, text } => {
                serde_json::json!({ "action": "type", "selector": self.selector_to_string(selector), "text": text })
            }
            BrowserAction::Screenshot { full_page } => {
                serde_json::json!({ "action": "screenshot", "full_page": full_page })
            }
            BrowserAction::ExtractText { selector } => {
                let sel = selector.as_ref().map(|s| self.selector_to_string(s)).unwrap_or_else(|| "body".to_string());
                serde_json::json!({ "action": "extract_text", "selector": sel })
            }
            BrowserAction::ExtractLinks => {
                serde_json::json!({ "action": "extract_links" })
            }
            BrowserAction::WaitForElement { selector, timeout_ms } => {
                serde_json::json!({ "action": "wait", "selector": selector, "timeout": timeout_ms })
            }
            BrowserAction::ExecuteJs { script } => {
                serde_json::json!({ "action": "js", "script": script })
            }
            BrowserAction::GoBack => {
                serde_json::json!({ "action": "back" })
            }
            BrowserAction::GoForward => {
                serde_json::json!({ "action": "forward" })
            }
            BrowserAction::Refresh => {
                serde_json::json!({ "action": "refresh" })
            }
            _ => serde_json::json!({ "action": "unknown" })
        }
    }

    fn selector_to_string(&self, selector: &ElementSelector) -> String {
        match selector {
            ElementSelector::Css(s) => s.clone(),
            ElementSelector::XPath(s) => format!("xpath={}", s),
            ElementSelector::Text(s) => format!("text={}", s),
            ElementSelector::AiDescription(s) => format!("text={}", s),  // Simplified
            ElementSelector::Index(i) => format!("[{}]", i),
        }
    }

    fn parse_response_data(&self, response: &serde_json::Value, action: &BrowserAction) -> Option<BrowserData> {
        match action {
            BrowserAction::ExtractText { .. } => {
                response.get("text")
                    .and_then(|t| t.as_str())
                    .map(|s| BrowserData::Text(s.to_string()))
            }
            BrowserAction::ExtractLinks => {
                response.get("links")
                    .and_then(|l| l.as_array())
                    .map(|links| {
                        let link_infos: Vec<LinkInfo> = links.iter().filter_map(|l| {
                            Some(LinkInfo {
                                text: l.get("text")?.as_str()?.to_string(),
                                href: l.get("href")?.as_str()?.to_string(),
                                title: l.get("title").and_then(|t| t.as_str()).map(String::from),
                            })
                        }).collect();
                        BrowserData::Links(link_infos)
                    })
            }
            BrowserAction::ExecuteJs { .. } => {
                response.get("result").map(|r| BrowserData::JsResult(r.clone()))
            }
            _ => None
        }
    }

    fn validate_action(&self, action: &BrowserAction) -> Result<(), String> {
        let config = self.config.read();

        // Check domain restrictions for navigation
        if let BrowserAction::Navigate { url } = action {
            // Parse URL to get domain
            if let Ok(parsed) = url::Url::parse(url) {
                if let Some(domain) = parsed.host_str() {
                    // Check blocked domains
                    if config.blocked_domains.iter().any(|d| domain.contains(d)) {
                        return Err(format!("Domain {} is blocked", domain));
                    }

                    // Check allowed domains (if any specified)
                    if !config.allowed_domains.is_empty() {
                        if !config.allowed_domains.iter().any(|d| domain.contains(d)) {
                            return Err(format!("Domain {} is not in allowed list", domain));
                        }
                    }
                }
            }
        }

        Ok(())
    }

    /// Navigate to URL (convenience method)
    pub async fn navigate(&self, url: &str) -> Result<BrowseResult, String> {
        self.execute(BrowserAction::Navigate { url: url.to_string() }).await
    }

    /// Click element (convenience method)
    pub async fn click(&self, selector: &str) -> Result<BrowseResult, String> {
        self.execute(BrowserAction::Click { 
            selector: ElementSelector::Css(selector.to_string()) 
        }).await
    }

    /// Type text (convenience method)
    pub async fn type_text(&self, selector: &str, text: &str) -> Result<BrowseResult, String> {
        self.execute(BrowserAction::Type { 
            selector: ElementSelector::Css(selector.to_string()),
            text: text.to_string(),
        }).await
    }

    /// Get page text (convenience method)
    pub async fn get_text(&self) -> Result<String, String> {
        let result = self.execute(BrowserAction::ExtractText { selector: None }).await?;
        match result.data {
            Some(BrowserData::Text(text)) => Ok(text),
            _ => Err("Failed to extract text".to_string())
        }
    }

    /// Close browser
    pub async fn close(&self) -> Result<(), String> {
        if let Some(mut process) = self.playwright_process.write().take() {
            process.kill().await.ok();
        }
        *self.state.write() = BrowserState::Closed;
        *self.current_url.write() = None;
        *self.page_title.write() = None;
        Ok(())
    }

    pub fn get_state(&self) -> BrowserState {
        *self.state.read()
    }

    pub fn get_current_url(&self) -> Option<String> {
        self.current_url.read().clone()
    }

    pub fn get_page_title(&self) -> Option<String> {
        self.page_title.read().clone()
    }

    pub fn get_history(&self) -> Vec<BrowseResult> {
        self.action_history.read().clone()
    }
}

impl Drop for BrowserAgent {
    fn drop(&mut self) {
        // Cleanup: kill the process if still running
        if let Some(mut process) = self.playwright_process.write().take() {
            let _ = process.start_kill();
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_browser_config_default() {
        let config = BrowserConfig::default();
        assert_eq!(config.mode, BrowserMode::Visible);
        assert_eq!(config.viewport_width, 1280);
    }

    #[test]
    fn test_selector_to_string() {
        let agent = BrowserAgent::new(BrowserConfig::default());
        
        assert_eq!(
            agent.selector_to_string(&ElementSelector::Css("#my-button".to_string())),
            "#my-button"
        );
        assert_eq!(
            agent.selector_to_string(&ElementSelector::Text("Click me".to_string())),
            "text=Click me"
        );
    }
}
