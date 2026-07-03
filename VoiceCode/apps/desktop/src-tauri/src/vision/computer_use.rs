#![allow(dead_code, unused_variables, unused_imports)]
// Computer Use Agent - Autonomous desktop control with Claude-style agent loop
// Provides mouse, keyboard, and screen interaction with safety guardrails

use std::collections::HashMap;
use std::time::{Duration, Instant};
use serde::{Deserialize, Serialize};
use parking_lot::RwLock;
use tokio::sync::broadcast;

/// Computer action types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ComputerAction {
    // Mouse actions
    Click { x: i32, y: i32, button: MouseButton },
    DoubleClick { x: i32, y: i32 },
    RightClick { x: i32, y: i32 },
    MoveTo { x: i32, y: i32 },
    Drag { from_x: i32, from_y: i32, to_x: i32, to_y: i32 },
    Scroll { x: i32, y: i32, delta_x: i32, delta_y: i32 },
    
    // Keyboard actions
    Type { text: String },
    Key { key: String, modifiers: Vec<Modifier> },
    Hotkey { keys: Vec<String> },
    
    // Screen actions
    Screenshot { region: Option<ScreenRegion> },
    Wait { milliseconds: u64 },
    
    // High-level actions
    ClickElement { element_id: usize, description: String },
    TypeIntoField { element_id: usize, text: String },
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum MouseButton {
    Left,
    Right,
    Middle,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum Modifier {
    Ctrl,
    Alt,
    Shift,
    Meta,  // Windows key / Command
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScreenRegion {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}

/// Result of action execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActionResult {
    pub success: bool,
    pub action: ComputerAction,
    pub screenshot_after: Option<Vec<u8>>,
    pub error: Option<String>,
    pub duration_ms: u64,
    pub timestamp: u64,
}

/// Safety configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComputerUseSafety {
    pub enabled: bool,
    pub confirmation_level: ConfirmationLevel,
    pub max_actions_per_minute: u32,
    pub allowed_regions: Vec<ScreenRegion>,
    pub forbidden_regions: Vec<ScreenRegion>,
    pub forbidden_keys: Vec<String>,
    pub panic_hotkey: Vec<String>,
    pub require_screen_visible: bool,
}

impl Default for ComputerUseSafety {
    fn default() -> Self {
        Self {
            enabled: true,
            confirmation_level: ConfirmationLevel::DestructiveOnly,
            max_actions_per_minute: 60,
            allowed_regions: vec![],
            forbidden_regions: vec![],
            forbidden_keys: vec!["Delete".to_string(), "F4".to_string()], // Alt+F4 prevention
            panic_hotkey: vec!["Ctrl".to_string(), "Shift".to_string(), "Escape".to_string()],
            require_screen_visible: true,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ConfirmationLevel {
    None,             // Fully autonomous
    DestructiveOnly,  // Confirm deletes, submits, sensitive actions
    AllClicks,        // Confirm all clicks
    EveryAction,      // Confirm everything
}

/// Agent loop state
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AgentState {
    Idle,
    Analyzing,
    Planning,
    Executing,
    WaitingForConfirmation,
    Paused,
    Error,
}

/// Agent event for subscribers
#[derive(Debug, Clone)]
pub enum AgentEvent {
    StateChanged(AgentState),
    ActionPlanned(ComputerAction),
    ActionExecuted(ActionResult),
    ConfirmationRequired(ComputerAction, String),
    Error(String),
    TaskCompleted(String),
}

/// Action executor trait
pub trait ActionExecutor: Send + Sync {
    fn execute(&self, action: &ComputerAction) -> Result<(), String>;
    fn get_cursor_position(&self) -> (i32, i32);
    fn is_available(&self) -> bool;
}

/// Stub executor for platforms where Enigo is not Send+Sync (e.g. macOS).
/// Reports not available; execute is a no-op.
pub struct NoopExecutor;

impl NoopExecutor {
    pub fn new() -> Self {
        Self
    }
}

impl ActionExecutor for NoopExecutor {
    fn execute(&self, _action: &ComputerAction) -> Result<(), String> {
        Ok(())
    }
    fn get_cursor_position(&self) -> (i32, i32) {
        (0, 0)
    }
    fn is_available(&self) -> bool {
        false
    }
}

/// Default action executor using enigo for real mouse/keyboard control (Windows).
#[cfg(windows)]
pub struct EnigoExecutor {
    enigo: parking_lot::Mutex<enigo::Enigo>,
}

#[cfg(windows)]
impl EnigoExecutor {
    pub fn new() -> Self {
        let enigo_instance = enigo::Enigo::new(&enigo::Settings::default())
            .expect("Failed to initialize enigo input simulator");
        Self {
            enigo: parking_lot::Mutex::new(enigo_instance),
        }
    }

    /// Map our Modifier enum to enigo Key presses
    fn press_modifiers(&self, enigo: &mut enigo::Enigo, modifiers: &[Modifier]) {
        use enigo::Keyboard as _;
        for m in modifiers {
            let key = match m {
                Modifier::Ctrl => enigo::Key::Control,
                Modifier::Alt => enigo::Key::Alt,
                Modifier::Shift => enigo::Key::Shift,
                Modifier::Meta => enigo::Key::Meta,
            };
            let _ = enigo.key(key, enigo::Direction::Press);
        }
    }

    /// Release modifier keys
    fn release_modifiers(&self, enigo: &mut enigo::Enigo, modifiers: &[Modifier]) {
        use enigo::Keyboard as _;
        for m in modifiers.iter().rev() {
            let key = match m {
                Modifier::Ctrl => enigo::Key::Control,
                Modifier::Alt => enigo::Key::Alt,
                Modifier::Shift => enigo::Key::Shift,
                Modifier::Meta => enigo::Key::Meta,
            };
            let _ = enigo.key(key, enigo::Direction::Release);
        }
    }

    /// Map a string key name to enigo Key
    fn parse_key(key_name: &str) -> enigo::Key {
        match key_name.to_lowercase().as_str() {
            "return" | "enter" => enigo::Key::Return,
            "tab" => enigo::Key::Tab,
            "space" => enigo::Key::Space,
            "backspace" => enigo::Key::Backspace,
            "delete" => enigo::Key::Delete,
            "escape" | "esc" => enigo::Key::Escape,
            "up" | "uparrow" => enigo::Key::UpArrow,
            "down" | "downarrow" => enigo::Key::DownArrow,
            "left" | "leftarrow" => enigo::Key::LeftArrow,
            "right" | "rightarrow" => enigo::Key::RightArrow,
            "home" => enigo::Key::Home,
            "end" => enigo::Key::End,
            "pageup" => enigo::Key::PageUp,
            "pagedown" => enigo::Key::PageDown,
            "f1" => enigo::Key::F1,
            "f2" => enigo::Key::F2,
            "f3" => enigo::Key::F3,
            "f4" => enigo::Key::F4,
            "f5" => enigo::Key::F5,
            "f6" => enigo::Key::F6,
            "f7" => enigo::Key::F7,
            "f8" => enigo::Key::F8,
            "f9" => enigo::Key::F9,
            "f10" => enigo::Key::F10,
            "f11" => enigo::Key::F11,
            "f12" => enigo::Key::F12,
            s if s.len() == 1 => enigo::Key::Unicode(s.chars().next().unwrap()),
            _ => enigo::Key::Unicode(key_name.chars().next().unwrap_or(' ')),
        }
    }

    /// Map our MouseButton to enigo Button
    fn map_button(button: &MouseButton) -> enigo::Button {
        match button {
            MouseButton::Left => enigo::Button::Left,
            MouseButton::Right => enigo::Button::Right,
            MouseButton::Middle => enigo::Button::Middle,
        }
    }
}

#[cfg(windows)]
impl ActionExecutor for EnigoExecutor {
    fn execute(&self, action: &ComputerAction) -> Result<(), String> {
        use enigo::{Keyboard as _, Mouse as _};
        let mut enigo = self.enigo.lock();

        match action {
            ComputerAction::Click { x, y, button } => {
                log::info!("Clicking at ({}, {}) with {:?} button", x, y, button);
                enigo.move_mouse(*x, *y, enigo::Coordinate::Abs)
                    .map_err(|e| format!("Mouse move failed: {}", e))?;
                enigo.button(Self::map_button(button), enigo::Direction::Click)
                    .map_err(|e| format!("Click failed: {}", e))?;
            }
            ComputerAction::DoubleClick { x, y } => {
                log::info!("Double clicking at ({}, {})", x, y);
                enigo.move_mouse(*x, *y, enigo::Coordinate::Abs)
                    .map_err(|e| format!("Mouse move failed: {}", e))?;
                enigo.button(enigo::Button::Left, enigo::Direction::Click)
                    .map_err(|e| format!("Click failed: {}", e))?;
                enigo.button(enigo::Button::Left, enigo::Direction::Click)
                    .map_err(|e| format!("Click failed: {}", e))?;
            }
            ComputerAction::RightClick { x, y } => {
                log::info!("Right clicking at ({}, {})", x, y);
                enigo.move_mouse(*x, *y, enigo::Coordinate::Abs)
                    .map_err(|e| format!("Mouse move failed: {}", e))?;
                enigo.button(enigo::Button::Right, enigo::Direction::Click)
                    .map_err(|e| format!("Click failed: {}", e))?;
            }
            ComputerAction::MoveTo { x, y } => {
                log::info!("Moving mouse to ({}, {})", x, y);
                enigo.move_mouse(*x, *y, enigo::Coordinate::Abs)
                    .map_err(|e| format!("Mouse move failed: {}", e))?;
            }
            ComputerAction::Drag { from_x, from_y, to_x, to_y } => {
                log::info!("Dragging from ({}, {}) to ({}, {})", from_x, from_y, to_x, to_y);
                enigo.move_mouse(*from_x, *from_y, enigo::Coordinate::Abs)
                    .map_err(|e| format!("Mouse move failed: {}", e))?;
                enigo.button(enigo::Button::Left, enigo::Direction::Press)
                    .map_err(|e| format!("Mouse press failed: {}", e))?;
                enigo.move_mouse(*to_x, *to_y, enigo::Coordinate::Abs)
                    .map_err(|e| format!("Mouse move failed: {}", e))?;
                enigo.button(enigo::Button::Left, enigo::Direction::Release)
                    .map_err(|e| format!("Mouse release failed: {}", e))?;
            }
            ComputerAction::Scroll { x, y, delta_x, delta_y } => {
                log::info!("Scrolling at ({}, {}) delta ({}, {})", x, y, delta_x, delta_y);
                enigo.move_mouse(*x, *y, enigo::Coordinate::Abs)
                    .map_err(|e| format!("Mouse move failed: {}", e))?;
                if *delta_y != 0 {
                    enigo.scroll(*delta_y, enigo::Axis::Vertical)
                        .map_err(|e| format!("Scroll failed: {}", e))?;
                }
                if *delta_x != 0 {
                    enigo.scroll(*delta_x, enigo::Axis::Horizontal)
                        .map_err(|e| format!("Scroll failed: {}", e))?;
                }
            }
            ComputerAction::Type { text } => {
                log::info!("Typing: {}", text);
                enigo.text(text)
                    .map_err(|e| format!("Type text failed: {}", e))?;
            }
            ComputerAction::Key { key, modifiers } => {
                log::info!("Pressing key: {} with modifiers: {:?}", key, modifiers);
                let enigo_key = Self::parse_key(key);
                self.press_modifiers(&mut enigo, modifiers);
                let result = enigo.key(enigo_key, enigo::Direction::Click);
                self.release_modifiers(&mut enigo, modifiers);
                result.map_err(|e| format!("Key press failed: {}", e))?;
            }
            ComputerAction::Hotkey { keys } => {
                log::info!("Hotkey: {:?}", keys);
                // Press all keys, then release in reverse order
                for key_name in keys {
                    let enigo_key = Self::parse_key(key_name);
                    enigo.key(enigo_key, enigo::Direction::Press)
                        .map_err(|e| format!("Key press failed: {}", e))?;
                }
                for key_name in keys.iter().rev() {
                    let enigo_key = Self::parse_key(key_name);
                    enigo.key(enigo_key, enigo::Direction::Release)
                        .map_err(|e| format!("Key release failed: {}", e))?;
                }
            }
            ComputerAction::Screenshot { .. } => {
                // Screenshots are handled by the agent, not the executor
                log::info!("Screenshot requested (handled by agent)");
            }
            ComputerAction::Wait { milliseconds } => {
                log::info!("Waiting {}ms", milliseconds);
                std::thread::sleep(Duration::from_millis(*milliseconds));
            }
            ComputerAction::ClickElement { element_id, description } => {
                // High-level action - requires OmniParser to resolve element_id to coordinates
                log::warn!("ClickElement({}, '{}') requires OmniParser resolution", element_id, description);
                return Err(format!("ClickElement requires OmniParser to resolve element {} ('{}')", element_id, description));
            }
            ComputerAction::TypeIntoField { element_id, text } => {
                log::warn!("TypeIntoField({}, '{}') requires OmniParser resolution", element_id, text);
                return Err(format!("TypeIntoField requires OmniParser to resolve element {}", element_id));
            }
        }
        Ok(())
    }

    fn get_cursor_position(&self) -> (i32, i32) {
        use enigo::Mouse as _;
        let enigo = self.enigo.lock();
        enigo.location().unwrap_or((0, 0))
    }

    fn is_available(&self) -> bool {
        true
    }
}

/// Returns the default action executor for this platform.
#[cfg(windows)]
fn default_executor() -> Box<dyn ActionExecutor> {
    Box::new(EnigoExecutor::new())
}

#[cfg(not(windows))]
fn default_executor() -> Box<dyn ActionExecutor> {
    Box::new(NoopExecutor::new())
}

/// Computer Use Agent
pub struct ComputerUseAgent {
    state: RwLock<AgentState>,
    safety: RwLock<ComputerUseSafety>,
    action_history: RwLock<Vec<ActionResult>>,
    action_count: RwLock<HashMap<u64, u32>>,  // Minute -> count
    event_tx: broadcast::Sender<AgentEvent>,
    executor: Box<dyn ActionExecutor>,
    pending_confirmation: RwLock<Option<ComputerAction>>,
}

impl ComputerUseAgent {
    pub fn new(safety: ComputerUseSafety) -> Self {
        let (event_tx, _) = broadcast::channel(100);
        
        Self {
            state: RwLock::new(AgentState::Idle),
            safety: RwLock::new(safety),
            action_history: RwLock::new(Vec::new()),
            action_count: RwLock::new(HashMap::new()),
            event_tx,
            executor: default_executor(),
            pending_confirmation: RwLock::new(None),
        }
    }

    /// Subscribe to agent events
    pub fn subscribe(&self) -> broadcast::Receiver<AgentEvent> {
        self.event_tx.subscribe()
    }

    /// Execute a single action
    pub async fn execute_action(&self, action: ComputerAction) -> Result<ActionResult, String> {
        let start = Instant::now();
        
        // Safety checks
        self.check_safety(&action)?;
        
        // Check if confirmation is required
        if self.requires_confirmation(&action) {
            *self.pending_confirmation.write() = Some(action.clone());
            self.set_state(AgentState::WaitingForConfirmation);
            self.emit_event(AgentEvent::ConfirmationRequired(
                action.clone(),
                self.describe_action(&action),
            ));
            return Err("Action requires confirmation".to_string());
        }

        // Rate limiting
        self.check_rate_limit()?;

        // Execute
        self.set_state(AgentState::Executing);
        let exec_result = self.executor.execute(&action);
        
        // Wait for UI to update
        tokio::time::sleep(Duration::from_millis(100)).await;
        
        // Capture screenshot after
        let screenshot = self.capture_screenshot().await.ok();

        let result = ActionResult {
            success: exec_result.is_ok(),
            action: action.clone(),
            screenshot_after: screenshot,
            error: exec_result.err(),
            duration_ms: start.elapsed().as_millis() as u64,
            timestamp: self.now(),
        };

        // Record
        self.action_history.write().push(result.clone());
        self.increment_action_count();
        
        self.emit_event(AgentEvent::ActionExecuted(result.clone()));
        self.set_state(AgentState::Idle);

        Ok(result)
    }

    /// Confirm pending action
    pub async fn confirm_action(&self) -> Result<ActionResult, String> {
        let action = self.pending_confirmation.write().take()
            .ok_or("No pending action")?;
        
        self.set_state(AgentState::Executing);
        
        // Force execute without confirmation check
        let start = Instant::now();
        let exec_result = self.executor.execute(&action);
        
        tokio::time::sleep(Duration::from_millis(100)).await;
        let screenshot = self.capture_screenshot().await.ok();

        let result = ActionResult {
            success: exec_result.is_ok(),
            action,
            screenshot_after: screenshot,
            error: exec_result.err(),
            duration_ms: start.elapsed().as_millis() as u64,
            timestamp: self.now(),
        };

        self.action_history.write().push(result.clone());
        self.emit_event(AgentEvent::ActionExecuted(result.clone()));
        self.set_state(AgentState::Idle);

        Ok(result)
    }

    /// Cancel pending action
    pub fn cancel_action(&self) {
        *self.pending_confirmation.write() = None;
        self.set_state(AgentState::Idle);
    }

    /// Run agent loop for a task
    pub async fn execute_task(&self, task: &str, max_iterations: u32) -> Result<String, String> {
        self.set_state(AgentState::Analyzing);
        
        for i in 0..max_iterations {
            // 1. Capture current screen
            let screenshot = self.capture_screenshot().await?;
            
            // 2. Analyze with LLM (placeholder)
            self.set_state(AgentState::Planning);
            let next_action = self.plan_next_action(task, &screenshot, i).await?;
            
            // 3. Check if task is complete
            if let Some(action) = next_action {
                // 4. Execute action
                let result = self.execute_action(action).await?;
                
                if !result.success {
                    return Err(format!("Action failed: {:?}", result.error));
                }
                
                // Wait for UI to settle
                tokio::time::sleep(Duration::from_millis(500)).await;
            } else {
                // No more actions needed - task complete
                self.set_state(AgentState::Idle);
                let summary = format!("Task '{}' completed in {} iterations", task, i + 1);
                self.emit_event(AgentEvent::TaskCompleted(summary.clone()));
                return Ok(summary);
            }
        }

        Err(format!("Max iterations ({}) reached without completing task", max_iterations))
    }

    async fn plan_next_action(&self, task: &str, screenshot: &[u8], iteration: u32) -> Result<Option<ComputerAction>, String> {
        use crate::code_intelligence::llm_client::{self, LLMRequest, Message};

        // Check if LLM is available; without it we can't plan
        if !llm_client::is_llm_available().await {
            return Err("LLM not available - computer use agent requires an API key".to_string());
        }

        // Decode screenshot and run OCR to get screen text
        let image = image::load_from_memory(screenshot)
            .map_err(|e| format!("Failed to decode screenshot: {}", e))?;
        let ocr = super::ocr_engine::MultiTierOcr::new(super::ocr_engine::OcrConfig::default());
        let ocr_result = ocr.extract_text(&image).await
            .map_err(|e| format!("OCR failed: {}", e))?;

        // Build action history summary
        let history = self.action_history.read();
        let history_summary: String = history.iter().rev().take(5).map(|r| {
            format!("- {} ({})", self.describe_action(&r.action), if r.success { "ok" } else { "failed" })
        }).collect::<Vec<_>>().join("\n");

        let system_prompt = r#"You are a computer use agent that controls a desktop computer to complete tasks.
You analyze the current screen content and decide what action to take next.

Respond with EXACTLY one of these JSON formats, or "DONE" if the task is complete:

{"action":"click","x":100,"y":200,"button":"left"}
{"action":"double_click","x":100,"y":200}
{"action":"right_click","x":100,"y":200}
{"action":"type","text":"hello world"}
{"action":"key","key":"enter","modifiers":[]}
{"action":"hotkey","keys":["ctrl","c"]}
{"action":"scroll","x":500,"y":300,"delta_x":0,"delta_y":-3}
{"action":"move","x":100,"y":200}
{"action":"wait","ms":1000}

If the task appears complete, respond with just: DONE"#;

        let user_message = format!(
            "Task: {}\nIteration: {}\n\nScreen content (via OCR):\n{}\n\nRecent actions:\n{}\n\nWhat is the next action?",
            task, iteration, ocr_result.full_text, history_summary
        );

        let request = LLMRequest::new(vec![
            Message::system(system_prompt),
            Message::user(user_message),
        ]);

        let response = llm_client::llm_complete(request).await
            .map_err(|e| format!("LLM planning failed: {}", e))?;

        let content = response.content.trim();

        // Check if task is done
        if content.eq_ignore_ascii_case("DONE") || content.contains("\"DONE\"") {
            return Ok(None);
        }

        // Parse the JSON action
        let parsed: serde_json::Value = serde_json::from_str(content)
            .map_err(|e| format!("Failed to parse LLM action response: {} (response: {})", e, content))?;

        let action_type = parsed.get("action")
            .and_then(|v| v.as_str())
            .ok_or("Missing 'action' field in LLM response")?;

        let action = match action_type {
            "click" => {
                let x = parsed["x"].as_i64().unwrap_or(0) as i32;
                let y = parsed["y"].as_i64().unwrap_or(0) as i32;
                let button = match parsed.get("button").and_then(|v| v.as_str()).unwrap_or("left") {
                    "right" => MouseButton::Right,
                    "middle" => MouseButton::Middle,
                    _ => MouseButton::Left,
                };
                ComputerAction::Click { x, y, button }
            }
            "double_click" => {
                let x = parsed["x"].as_i64().unwrap_or(0) as i32;
                let y = parsed["y"].as_i64().unwrap_or(0) as i32;
                ComputerAction::DoubleClick { x, y }
            }
            "right_click" => {
                let x = parsed["x"].as_i64().unwrap_or(0) as i32;
                let y = parsed["y"].as_i64().unwrap_or(0) as i32;
                ComputerAction::RightClick { x, y }
            }
            "type" => {
                let text = parsed["text"].as_str().unwrap_or("").to_string();
                ComputerAction::Type { text }
            }
            "key" => {
                let key = parsed["key"].as_str().unwrap_or("").to_string();
                let modifiers = parsed.get("modifiers")
                    .and_then(|v| v.as_array())
                    .map(|arr| arr.iter().filter_map(|m| {
                        match m.as_str()? {
                            "ctrl" | "control" => Some(Modifier::Ctrl),
                            "alt" => Some(Modifier::Alt),
                            "shift" => Some(Modifier::Shift),
                            "meta" | "win" | "cmd" => Some(Modifier::Meta),
                            _ => None,
                        }
                    }).collect())
                    .unwrap_or_default();
                ComputerAction::Key { key, modifiers }
            }
            "hotkey" => {
                let keys = parsed["keys"].as_array()
                    .map(|arr| arr.iter().filter_map(|k| k.as_str().map(String::from)).collect())
                    .unwrap_or_default();
                ComputerAction::Hotkey { keys }
            }
            "scroll" => {
                let x = parsed["x"].as_i64().unwrap_or(0) as i32;
                let y = parsed["y"].as_i64().unwrap_or(0) as i32;
                let delta_x = parsed["delta_x"].as_i64().unwrap_or(0) as i32;
                let delta_y = parsed["delta_y"].as_i64().unwrap_or(0) as i32;
                ComputerAction::Scroll { x, y, delta_x, delta_y }
            }
            "move" => {
                let x = parsed["x"].as_i64().unwrap_or(0) as i32;
                let y = parsed["y"].as_i64().unwrap_or(0) as i32;
                ComputerAction::MoveTo { x, y }
            }
            "wait" => {
                let ms = parsed["ms"].as_u64().unwrap_or(500);
                ComputerAction::Wait { milliseconds: ms }
            }
            _ => return Err(format!("Unknown action type: {}", action_type)),
        };

        self.emit_event(AgentEvent::ActionPlanned(action.clone()));
        Ok(Some(action))
    }

    async fn capture_screenshot(&self) -> Result<Vec<u8>, String> {
        let cv_service = crate::computer_vision::get_cv_service();
        let (image, _) = cv_service.capture_screen().await
            .map_err(|e| format!("Screenshot failed: {}", e))?;
        
        let mut buffer = std::io::Cursor::new(Vec::new());
        image.write_to(&mut buffer, image::ImageFormat::Png)
            .map_err(|e| format!("Image encode failed: {}", e))?;
        
        Ok(buffer.into_inner())
    }

    fn check_safety(&self, action: &ComputerAction) -> Result<(), String> {
        let safety = self.safety.read();
        
        if !safety.enabled {
            return Ok(());
        }

        // Check forbidden keys
        if let ComputerAction::Key { key, .. } = action {
            if safety.forbidden_keys.iter().any(|k| k.eq_ignore_ascii_case(key)) {
                return Err(format!("Key '{}' is forbidden", key));
            }
        }

        // Check position is within allowed regions (if specified)
        if !safety.allowed_regions.is_empty() {
            if let Some((x, y)) = self.get_action_position(action) {
                let in_allowed = safety.allowed_regions.iter().any(|r| {
                    x >= r.x && x < r.x + r.width as i32 &&
                    y >= r.y && y < r.y + r.height as i32
                });
                if !in_allowed {
                    return Err("Action outside allowed regions".to_string());
                }
            }
        }

        // Check position is not in forbidden regions
        if let Some((x, y)) = self.get_action_position(action) {
            let in_forbidden = safety.forbidden_regions.iter().any(|r| {
                x >= r.x && x < r.x + r.width as i32 &&
                y >= r.y && y < r.y + r.height as i32
            });
            if in_forbidden {
                return Err("Action in forbidden region".to_string());
            }
        }

        Ok(())
    }

    fn get_action_position(&self, action: &ComputerAction) -> Option<(i32, i32)> {
        match action {
            ComputerAction::Click { x, y, .. } => Some((*x, *y)),
            ComputerAction::DoubleClick { x, y } => Some((*x, *y)),
            ComputerAction::RightClick { x, y } => Some((*x, *y)),
            ComputerAction::MoveTo { x, y } => Some((*x, *y)),
            ComputerAction::Scroll { x, y, .. } => Some((*x, *y)),
            _ => None,
        }
    }

    fn requires_confirmation(&self, action: &ComputerAction) -> bool {
        let level = self.safety.read().confirmation_level;
        
        match level {
            ConfirmationLevel::None => false,
            ConfirmationLevel::EveryAction => true,
            ConfirmationLevel::AllClicks => matches!(
                action,
                ComputerAction::Click { .. } |
                ComputerAction::DoubleClick { .. } |
                ComputerAction::RightClick { .. }
            ),
            ConfirmationLevel::DestructiveOnly => {
                // Check for destructive actions
                match action {
                    ComputerAction::Key { key, modifiers } => {
                        // Delete key, or Alt+F4, etc.
                        key.eq_ignore_ascii_case("Delete") ||
                        (key.eq_ignore_ascii_case("F4") && modifiers.iter().any(|m| matches!(m, Modifier::Alt)))
                    }
                    ComputerAction::Type { text } => {
                        // Submitting forms (Enter in certain contexts)
                        text.contains('\n')
                    }
                    _ => false,
                }
            }
        }
    }

    fn check_rate_limit(&self) -> Result<(), String> {
        let max_per_minute = self.safety.read().max_actions_per_minute;
        let current_minute = self.now() / 60;
        
        let count = self.action_count.read()
            .get(&current_minute)
            .copied()
            .unwrap_or(0);
        
        if count >= max_per_minute {
            return Err(format!("Rate limit exceeded: {} actions/minute", max_per_minute));
        }
        
        Ok(())
    }

    fn increment_action_count(&self) {
        let current_minute = self.now() / 60;
        let mut counts = self.action_count.write();
        *counts.entry(current_minute).or_insert(0) += 1;
        
        // Cleanup old entries
        let keys_to_remove: Vec<_> = counts.keys()
            .filter(|&&k| k < current_minute - 5)
            .copied()
            .collect();
        for key in keys_to_remove {
            counts.remove(&key);
        }
    }

    fn describe_action(&self, action: &ComputerAction) -> String {
        match action {
            ComputerAction::Click { x, y, button } => {
                format!("{:?} click at ({}, {})", button, x, y)
            }
            ComputerAction::Type { text } => {
                if text.len() > 20 {
                    format!("Type: {}...", &text[..20])
                } else {
                    format!("Type: {}", text)
                }
            }
            ComputerAction::Key { key, modifiers } => {
                let mods: Vec<_> = modifiers.iter().map(|m| format!("{:?}", m)).collect();
                if mods.is_empty() {
                    format!("Press {}", key)
                } else {
                    format!("Press {} + {}", mods.join(" + "), key)
                }
            }
            _ => format!("{:?}", action),
        }
    }

    fn set_state(&self, state: AgentState) {
        *self.state.write() = state;
        self.emit_event(AgentEvent::StateChanged(state));
    }

    fn emit_event(&self, event: AgentEvent) {
        let _ = self.event_tx.send(event);
    }

    fn now(&self) -> u64 {
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs()
    }

    pub fn get_state(&self) -> AgentState {
        *self.state.read()
    }

    pub fn get_history(&self) -> Vec<ActionResult> {
        self.action_history.read().clone()
    }

    pub fn set_safety(&self, safety: ComputerUseSafety) {
        *self.safety.write() = safety;
    }

    /// Emergency stop
    pub fn stop(&self) {
        self.set_state(AgentState::Paused);
        *self.pending_confirmation.write() = None;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_agent_creation() {
        let agent = ComputerUseAgent::new(ComputerUseSafety::default());
        assert_eq!(agent.get_state(), AgentState::Idle);
    }

    #[test]
    fn test_action_description() {
        let agent = ComputerUseAgent::new(ComputerUseSafety::default());
        
        let desc = agent.describe_action(&ComputerAction::Click {
            x: 100,
            y: 200,
            button: MouseButton::Left,
        });
        assert!(desc.contains("100"));
        assert!(desc.contains("200"));
    }

    #[test]
    fn test_confirmation_levels() {
        let mut safety = ComputerUseSafety::default();
        safety.confirmation_level = ConfirmationLevel::AllClicks;
        let agent = ComputerUseAgent::new(safety);

        let click = ComputerAction::Click { x: 0, y: 0, button: MouseButton::Left };
        assert!(agent.requires_confirmation(&click));

        let type_action = ComputerAction::Type { text: "hello".to_string() };
        assert!(!agent.requires_confirmation(&type_action));
    }
}
