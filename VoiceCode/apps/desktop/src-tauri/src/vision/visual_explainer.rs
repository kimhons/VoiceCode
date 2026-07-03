#![allow(dead_code, unused_variables, unused_imports)]
// Visual Explainability - Show users what VoiceCode is doing in real-time
// Provides overlays, recordings, replays, and action explanations

use std::collections::VecDeque;
use std::path::PathBuf;
use std::time::{Duration, Instant};
use serde::{Deserialize, Serialize};
use parking_lot::RwLock;
use tokio::sync::broadcast;
use chrono::{DateTime, Utc};

/// Explainability mode
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ExplainabilityMode {
    Hidden,       // No visual feedback
    Cursor,       // Ghost cursor showing movements
    Highlights,   // Highlight clicked elements
    Full,         // Full overlay with explanations
    Recording,    // Record session to video
}

/// Visual action record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VisualAction {
    pub id: String,
    pub action_type: ActionType,
    pub description: String,
    pub target: Option<ActionTarget>,
    pub screenshot_before: Option<Vec<u8>>,
    pub screenshot_after: Option<Vec<u8>>,
    pub timestamp: DateTime<Utc>,
    pub duration_ms: u64,
    pub success: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ActionType {
    Click,
    DoubleClick,
    RightClick,
    Type,
    KeyPress,
    Scroll,
    Navigate,
    Wait,
    Screenshot,
    FileOperation,
    BrowserAction,
    Custom(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActionTarget {
    pub element_id: Option<usize>,
    pub description: String,
    pub bounds: Option<TargetBounds>,
    pub screenshot_region: Option<Vec<u8>>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct TargetBounds {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}

fn instant_now() -> Instant {
    Instant::now()
}

/// Highlight box for overlay
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HighlightBox {
    pub bounds: TargetBounds,
    pub color: HighlightColor,
    pub label: Option<String>,
    pub animation: HighlightAnimation,
    #[serde(skip, default = "instant_now")]
    pub start_time: Instant,
    pub duration_ms: u64,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum HighlightColor {
    Blue,
    Green,
    Red,
    Yellow,
    Purple,
    Custom(u8, u8, u8, u8),  // RGBA
}

impl HighlightColor {
    pub fn to_rgba(&self) -> [u8; 4] {
        match self {
            HighlightColor::Blue => [66, 133, 244, 180],
            HighlightColor::Green => [52, 168, 83, 180],
            HighlightColor::Red => [234, 67, 53, 180],
            HighlightColor::Yellow => [251, 188, 4, 180],
            HighlightColor::Purple => [103, 58, 183, 180],
            HighlightColor::Custom(r, g, b, a) => [*r, *g, *b, *a],
        }
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum HighlightAnimation {
    None,
    Pulse,
    Glow,
    Bounce,
    FadeIn,
    FadeOut,
}

/// Tooltip for overlay
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tooltip {
    pub text: String,
    pub position: TooltipPosition,
    pub x: i32,
    pub y: i32,
    #[serde(skip, default = "instant_now")]
    pub start_time: Instant,
    pub duration_ms: u64,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum TooltipPosition {
    Above,
    Below,
    Left,
    Right,
    Auto,
}

/// Cursor trail point
#[derive(Debug, Clone)]
pub struct CursorPoint {
    pub x: i32,
    pub y: i32,
    pub timestamp: Instant,
}

/// Overlay state
#[derive(Debug, Clone, Default)]
pub struct OverlayState {
    pub cursor_trail: VecDeque<CursorPoint>,
    pub highlights: Vec<HighlightBox>,
    pub tooltips: Vec<Tooltip>,
    pub progress: Option<ProgressIndicator>,
    pub status_text: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProgressIndicator {
    pub current: u32,
    pub total: u32,
    pub label: String,
    pub position: (i32, i32),
}

/// Explainer event for subscribers
#[derive(Debug, Clone)]
pub enum ExplainerEvent {
    ActionStarted(VisualAction),
    ActionCompleted(VisualAction),
    HighlightAdded(HighlightBox),
    TooltipShown(Tooltip),
    OverlayUpdated,
    RecordingStarted,
    RecordingStopped(PathBuf),
}

/// Action replay system
pub struct ActionReplay {
    actions: RwLock<Vec<VisualAction>>,
    current_index: RwLock<usize>,
    speed: RwLock<f32>,
    is_playing: RwLock<bool>,
}

impl ActionReplay {
    pub fn new() -> Self {
        Self {
            actions: RwLock::new(Vec::new()),
            current_index: RwLock::new(0),
            speed: RwLock::new(1.0),
            is_playing: RwLock::new(false),
        }
    }

    pub fn record(&self, action: VisualAction) {
        self.actions.write().push(action);
    }

    pub fn clear(&self) {
        self.actions.write().clear();
        *self.current_index.write() = 0;
    }

    pub fn set_speed(&self, speed: f32) {
        *self.speed.write() = speed.clamp(0.1, 10.0);
    }

    pub fn get_actions(&self) -> Vec<VisualAction> {
        self.actions.read().clone()
    }

    pub fn action_count(&self) -> usize {
        self.actions.read().len()
    }

    pub async fn play(&self, explainer: &VisualExplainer) -> Result<(), String> {
        *self.is_playing.write() = true;
        *self.current_index.write() = 0;

        let actions = self.actions.read().clone();
        let speed = *self.speed.read();

        for (i, action) in actions.iter().enumerate() {
            if !*self.is_playing.read() {
                break;
            }

            *self.current_index.write() = i;

            // Show the action
            explainer.show_action(action).await;

            // Wait for duration (adjusted by speed)
            let wait_ms = (action.duration_ms as f32 / speed) as u64;
            tokio::time::sleep(Duration::from_millis(wait_ms.max(100))).await;
        }

        *self.is_playing.write() = false;
        Ok(())
    }

    pub fn stop(&self) {
        *self.is_playing.write() = false;
    }

    pub fn is_playing(&self) -> bool {
        *self.is_playing.read()
    }

    pub fn current_index(&self) -> usize {
        *self.current_index.read()
    }

    /// Export replay to JSON
    pub fn export_json(&self) -> String {
        let actions = self.actions.read();
        serde_json::to_string_pretty(&*actions).unwrap_or_default()
    }

    /// Import replay from JSON
    pub fn import_json(&self, json: &str) -> Result<(), String> {
        let actions: Vec<VisualAction> = serde_json::from_str(json)
            .map_err(|e| format!("Parse error: {}", e))?;
        *self.actions.write() = actions;
        *self.current_index.write() = 0;
        Ok(())
    }
}

/// Visual Explainer service
pub struct VisualExplainer {
    mode: RwLock<ExplainabilityMode>,
    overlay: RwLock<OverlayState>,
    replay: ActionReplay,
    event_tx: broadcast::Sender<ExplainerEvent>,
    recording_path: RwLock<Option<PathBuf>>,
    recording_frames: RwLock<Vec<RecordingFrame>>,
    config: RwLock<ExplainerConfig>,
}

#[derive(Debug, Clone)]
pub struct ExplainerConfig {
    pub cursor_trail_length: usize,
    pub cursor_trail_fade_ms: u64,
    pub highlight_duration_ms: u64,
    pub tooltip_duration_ms: u64,
    pub screenshot_quality: u8,
    pub recording_fps: u8,
    pub max_recording_duration_s: u32,
}

impl Default for ExplainerConfig {
    fn default() -> Self {
        Self {
            cursor_trail_length: 50,
            cursor_trail_fade_ms: 1000,
            highlight_duration_ms: 2000,
            tooltip_duration_ms: 3000,
            screenshot_quality: 80,
            recording_fps: 30,
            max_recording_duration_s: 300,
        }
    }
}

#[derive(Debug, Clone)]
struct RecordingFrame {
    screenshot: Vec<u8>,
    timestamp: Instant,
    overlays: OverlayState,
}

impl VisualExplainer {
    pub fn new(config: ExplainerConfig) -> Self {
        let (event_tx, _) = broadcast::channel(100);
        
        Self {
            mode: RwLock::new(ExplainabilityMode::Highlights),
            overlay: RwLock::new(OverlayState::default()),
            replay: ActionReplay::new(),
            event_tx,
            recording_path: RwLock::new(None),
            recording_frames: RwLock::new(Vec::new()),
            config: RwLock::new(config),
        }
    }

    /// Subscribe to explainer events
    pub fn subscribe(&self) -> broadcast::Receiver<ExplainerEvent> {
        self.event_tx.subscribe()
    }

    /// Set explainability mode
    pub fn set_mode(&self, mode: ExplainabilityMode) {
        *self.mode.write() = mode;
        
        if mode == ExplainabilityMode::Recording {
            self.start_recording();
        } else if self.recording_path.read().is_some() {
            // Stop recording if we were recording
            let _ = self.stop_recording();
        }
    }

    pub fn get_mode(&self) -> ExplainabilityMode {
        *self.mode.read()
    }

    /// Record an action for replay
    pub fn record_action(&self, action: VisualAction) {
        self.replay.record(action.clone());
        let _ = self.event_tx.send(ExplainerEvent::ActionCompleted(action));
    }

    /// Show an action visually
    pub async fn show_action(&self, action: &VisualAction) {
        let mode = *self.mode.read();
        
        if mode == ExplainabilityMode::Hidden {
            return;
        }

        // Emit event
        let _ = self.event_tx.send(ExplainerEvent::ActionStarted(action.clone()));

        // Add highlight if there's a target
        if let Some(ref target) = action.target {
            if let Some(ref bounds) = target.bounds {
                self.add_highlight(HighlightBox {
                    bounds: bounds.clone(),
                    color: self.action_color(&action.action_type),
                    label: Some(action.description.clone()),
                    animation: HighlightAnimation::Pulse,
                    start_time: Instant::now(),
                    duration_ms: self.config.read().highlight_duration_ms,
                });
            }
        }

        // Add tooltip
        if mode == ExplainabilityMode::Full {
            self.add_tooltip(Tooltip {
                text: action.description.clone(),
                position: TooltipPosition::Auto,
                x: action.target.as_ref()
                    .and_then(|t| t.bounds.as_ref())
                    .map(|b| b.x + b.width as i32 / 2)
                    .unwrap_or(100),
                y: action.target.as_ref()
                    .and_then(|t| t.bounds.as_ref())
                    .map(|b| b.y - 30)
                    .unwrap_or(100),
                start_time: Instant::now(),
                duration_ms: self.config.read().tooltip_duration_ms,
            });
        }

        // Capture frame if recording
        if mode == ExplainabilityMode::Recording {
            self.capture_recording_frame().await;
        }
    }

    fn action_color(&self, action_type: &ActionType) -> HighlightColor {
        match action_type {
            ActionType::Click | ActionType::DoubleClick => HighlightColor::Blue,
            ActionType::Type => HighlightColor::Green,
            ActionType::Navigate => HighlightColor::Purple,
            ActionType::FileOperation => HighlightColor::Yellow,
            ActionType::RightClick => HighlightColor::Red,
            _ => HighlightColor::Blue,
        }
    }

    /// Add a highlight box
    pub fn add_highlight(&self, highlight: HighlightBox) {
        self.overlay.write().highlights.push(highlight.clone());
        let _ = self.event_tx.send(ExplainerEvent::HighlightAdded(highlight));
        let _ = self.event_tx.send(ExplainerEvent::OverlayUpdated);
    }

    /// Add a tooltip
    pub fn add_tooltip(&self, tooltip: Tooltip) {
        self.overlay.write().tooltips.push(tooltip.clone());
        let _ = self.event_tx.send(ExplainerEvent::TooltipShown(tooltip));
        let _ = self.event_tx.send(ExplainerEvent::OverlayUpdated);
    }

    /// Update cursor position
    pub fn update_cursor(&self, x: i32, y: i32) {
        if *self.mode.read() == ExplainabilityMode::Hidden {
            return;
        }

        let config = self.config.read();
        let mut overlay = self.overlay.write();
        
        overlay.cursor_trail.push_back(CursorPoint {
            x,
            y,
            timestamp: Instant::now(),
        });

        // Limit trail length
        while overlay.cursor_trail.len() > config.cursor_trail_length {
            overlay.cursor_trail.pop_front();
        }
    }

    /// Set progress indicator
    pub fn set_progress(&self, current: u32, total: u32, label: &str) {
        self.overlay.write().progress = Some(ProgressIndicator {
            current,
            total,
            label: label.to_string(),
            position: (50, 50),  // Top-left by default
        });
        let _ = self.event_tx.send(ExplainerEvent::OverlayUpdated);
    }

    /// Clear progress indicator
    pub fn clear_progress(&self) {
        self.overlay.write().progress = None;
        let _ = self.event_tx.send(ExplainerEvent::OverlayUpdated);
    }

    /// Set status text
    pub fn set_status(&self, status: &str) {
        self.overlay.write().status_text = Some(status.to_string());
        let _ = self.event_tx.send(ExplainerEvent::OverlayUpdated);
    }

    /// Clear status text
    pub fn clear_status(&self) {
        self.overlay.write().status_text = None;
        let _ = self.event_tx.send(ExplainerEvent::OverlayUpdated);
    }

    /// Clean up expired overlays
    pub fn cleanup_expired(&self) {
        let now = Instant::now();
        let mut overlay = self.overlay.write();
        let config = self.config.read();

        // Clean up expired highlights
        overlay.highlights.retain(|h| {
            now.duration_since(h.start_time).as_millis() < h.duration_ms as u128
        });

        // Clean up expired tooltips
        overlay.tooltips.retain(|t| {
            now.duration_since(t.start_time).as_millis() < t.duration_ms as u128
        });

        // Clean up old cursor trail points
        let fade_duration = Duration::from_millis(config.cursor_trail_fade_ms);
        while let Some(front) = overlay.cursor_trail.front() {
            if now.duration_since(front.timestamp) > fade_duration {
                overlay.cursor_trail.pop_front();
            } else {
                break;
            }
        }
    }

    /// Get current overlay state
    pub fn get_overlay_state(&self) -> OverlayState {
        self.cleanup_expired();
        self.overlay.read().clone()
    }

    /// Start recording
    fn start_recording(&self) {
        let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S");
        let path = std::env::temp_dir().join(format!("voicecode_recording_{}.mp4", timestamp));
        *self.recording_path.write() = Some(path);
        self.recording_frames.write().clear();
        let _ = self.event_tx.send(ExplainerEvent::RecordingStarted);
    }

    /// Stop recording and save
    pub fn stop_recording(&self) -> Result<PathBuf, String> {
        let path = self.recording_path.write().take()
            .ok_or("Not recording")?;

        // In production, this would use FFmpeg to encode frames
        // For now, just return the path
        let _ = self.event_tx.send(ExplainerEvent::RecordingStopped(path.clone()));
        
        Ok(path)
    }

    async fn capture_recording_frame(&self) {
        // Capture screenshot
        let cv_service = crate::computer_vision::get_cv_service();
        if let Ok((image, _)) = cv_service.capture_screen().await {
            let mut buffer = std::io::Cursor::new(Vec::new());
            if image.write_to(&mut buffer, image::ImageFormat::Png).is_ok() {
                let frame = RecordingFrame {
                    screenshot: buffer.into_inner(),
                    timestamp: Instant::now(),
                    overlays: self.overlay.read().clone(),
                };
                self.recording_frames.write().push(frame);
            }
        }
    }

    /// Get action replay
    pub fn get_replay(&self) -> &ActionReplay {
        &self.replay
    }

    /// Generate summary of session
    pub fn generate_summary(&self) -> SessionSummary {
        let actions = self.replay.get_actions();
        
        let mut action_counts: std::collections::HashMap<String, u32> = std::collections::HashMap::new();
        let mut total_duration = 0u64;
        let mut success_count = 0u32;
        let mut failure_count = 0u32;

        for action in &actions {
            let key = format!("{:?}", action.action_type);
            *action_counts.entry(key).or_insert(0) += 1;
            total_duration += action.duration_ms;
            if action.success {
                success_count += 1;
            } else {
                failure_count += 1;
            }
        }

        SessionSummary {
            total_actions: actions.len() as u32,
            action_counts,
            total_duration_ms: total_duration,
            success_count,
            failure_count,
            success_rate: if actions.is_empty() { 
                1.0 
            } else { 
                success_count as f32 / actions.len() as f32 
            },
        }
    }

    pub fn set_config(&self, config: ExplainerConfig) {
        *self.config.write() = config;
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionSummary {
    pub total_actions: u32,
    pub action_counts: std::collections::HashMap<String, u32>,
    pub total_duration_ms: u64,
    pub success_count: u32,
    pub failure_count: u32,
    pub success_rate: f32,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_explainer_creation() {
        let explainer = VisualExplainer::new(ExplainerConfig::default());
        assert_eq!(explainer.get_mode(), ExplainabilityMode::Highlights);
    }

    #[test]
    fn test_mode_switching() {
        let explainer = VisualExplainer::new(ExplainerConfig::default());
        
        explainer.set_mode(ExplainabilityMode::Full);
        assert_eq!(explainer.get_mode(), ExplainabilityMode::Full);
        
        explainer.set_mode(ExplainabilityMode::Hidden);
        assert_eq!(explainer.get_mode(), ExplainabilityMode::Hidden);
    }

    #[test]
    fn test_highlight_color() {
        assert_eq!(HighlightColor::Blue.to_rgba(), [66, 133, 244, 180]);
        assert_eq!(HighlightColor::Custom(255, 0, 0, 255).to_rgba(), [255, 0, 0, 255]);
    }

    #[test]
    fn test_action_replay() {
        let replay = ActionReplay::new();
        
        replay.record(VisualAction {
            id: "1".to_string(),
            action_type: ActionType::Click,
            description: "Test click".to_string(),
            target: None,
            screenshot_before: None,
            screenshot_after: None,
            timestamp: Utc::now(),
            duration_ms: 100,
            success: true,
        });

        assert_eq!(replay.action_count(), 1);
    }
}
