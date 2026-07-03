# VoiceCode Vision Architecture

## Executive Summary

This document outlines the architecture for VoiceCode's advanced visual understanding system, enabling the AI to:

1. **See the screen** - Robust OCR and UI element detection
2. **Control the computer** - Mouse, keyboard, and application automation
3. **Browse the web** - Autonomous web navigation and interaction
4. **Manage files** - Safe file system operations with rollback
5. **Explain visually** - Show users what VoiceCode is doing in real-time

---

## 1. OCR Engine Selection

### Research Findings

| Engine | Accuracy | Speed | Languages | Layout Handling | GPU Required |
|--------|----------|-------|-----------|-----------------|--------------|
| **Tesseract 5** | Medium | Fast | 100+ | Poor | No |
| **EasyOCR** | Medium | Medium | 80+ | Medium | Optional |
| **PaddleOCR** | High | Medium | 80+ | Good | Recommended |
| **Surya OCR** | High | Medium | Multi-language | Excellent | Yes |
| **Qwen2.5-VL** | Excellent | Slow | Universal | Excellent | Yes |

### Recommended Approach: **Hybrid Multi-Engine**

```
┌─────────────────────────────────────────────────────────────┐
│                     OCR Pipeline                             │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │ Fast OCR │ -> │ Quality  │ -> │ LLM OCR  │              │
│  │(Tesseract)│    │(PaddleOCR)│   │(Qwen2.5-VL)│            │
│  └──────────┘    └──────────┘    └──────────┘              │
│       ↓               ↓               ↓                     │
│  Quick preview   Standard use   Complex docs                │
│  (< 100ms)       (< 500ms)      (< 2s)                      │
└─────────────────────────────────────────────────────────────┘
```

**Implementation Strategy:**
- **Tier 1 (Fast)**: Tesseract for real-time preview and simple text
- **Tier 2 (Accurate)**: PaddleOCR/Surya for code, tables, multi-column
- **Tier 3 (Semantic)**: Vision LLM (Qwen2.5-VL, GPT-4V) for handwriting, complex layouts

---

## 2. Screen Understanding with OmniParser

### Microsoft OmniParser V2 Integration

OmniParser converts screenshots into structured UI elements that any LLM can act upon.

```
Screenshot → OmniParser → Structured Elements → LLM → Actions
     ↓                         ↓
  [Image]              [
                         {id: 1, type: "button", text: "Submit", bbox: [100,200,50,30]},
                         {id: 2, type: "textfield", text: "", bbox: [100,150,200,25]},
                         {id: 3, type: "link", text: "Sign up", bbox: [300,250,60,20]}
                       ]
```

### OmniParser Components

1. **Icon Detection Model** (YOLO-based)
   - Detects interactable elements
   - Provides bounding boxes with high precision
   - License: AGPL

2. **Icon Caption Model** (Florence-based)
   - Describes what each element does
   - Semantic understanding of UI purpose
   - License: MIT

### Integration Architecture

```rust
pub struct OmniParserService {
    icon_detector: IconDetector,       // YOLO model
    icon_captioner: IconCaptioner,     // Florence model
    ocr_engine: OcrEngine,             // PaddleOCR/Surya
    cache: LruCache<ImageHash, ParsedScreen>,
}

pub struct ParsedScreen {
    pub elements: Vec<UIElement>,
    pub text_blocks: Vec<TextBlock>,
    pub layout: LayoutInfo,
    pub interactable_map: HashMap<usize, InteractionType>,
}

pub struct UIElement {
    pub id: usize,
    pub element_type: UIElementType,
    pub bounds: BoundingBox,
    pub text: Option<String>,
    pub caption: String,           // "Submit button for form"
    pub interactable: bool,
    pub interaction_type: Option<InteractionType>,
}

pub enum InteractionType {
    Click,
    DoubleClick,
    RightClick,
    Type { placeholder: Option<String> },
    Scroll { direction: ScrollDirection },
    Drag,
    Hover,
}
```

---

## 3. Computer Use Agent Loop

### Claude Computer Use Pattern

Based on Anthropic's reference implementation:

```
┌────────────────────────────────────────────────────────────────┐
│                    Computer Use Agent Loop                      │
├────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User: "Fill out the form and submit"                           │
│          ↓                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 1. Capture Screenshot                                    │   │
│  │ 2. Parse with OmniParser → Get UI elements               │   │
│  │ 3. Send to LLM with action tools                         │   │
│  │ 4. LLM returns action: click(x, y)                       │   │
│  │ 5. Execute action via enigo/autopilot                    │   │
│  │ 6. Wait for UI update                                    │   │
│  │ 7. Loop back to step 1 until task complete               │   │
│  └─────────────────────────────────────────────────────────┘   │
│          ↓                                                       │
│  VoiceCode: "Form submitted successfully"                       │
│                                                                  │
└────────────────────────────────────────────────────────────────┘
```

### Action Types

```rust
pub enum ComputerAction {
    // Mouse actions
    Click { x: i32, y: i32, button: MouseButton },
    DoubleClick { x: i32, y: i32 },
    RightClick { x: i32, y: i32 },
    Move { x: i32, y: i32 },
    Drag { from: (i32, i32), to: (i32, i32) },
    Scroll { x: i32, y: i32, direction: ScrollDirection, amount: i32 },
    
    // Keyboard actions
    Type { text: String },
    Key { key: KeyCode, modifiers: Vec<Modifier> },
    Hotkey { keys: Vec<KeyCode> },
    
    // Screen actions
    Screenshot { region: Option<CaptureRegion> },
    Wait { milliseconds: u64 },
    
    // High-level actions
    ClickElement { element_id: usize },
    TypeIntoElement { element_id: usize, text: String },
}

pub struct ActionResult {
    pub success: bool,
    pub screenshot: Option<Vec<u8>>,  // Screenshot after action
    pub error: Option<String>,
    pub duration_ms: u64,
}
```

### Safety Guardrails

```rust
pub struct ComputerUseSafety {
    // Allowed regions (whitelist approach)
    allowed_regions: Vec<BoundingBox>,
    
    // Forbidden actions
    forbidden_patterns: Vec<ForbiddenPattern>,
    
    // Rate limiting
    max_actions_per_minute: u32,
    max_keystrokes_per_action: u32,
    
    // Confirmation requirements
    require_confirmation: ConfirmationLevel,
    
    // Emergency stop
    panic_hotkey: Vec<KeyCode>,  // e.g., Ctrl+Shift+Escape
}

pub enum ConfirmationLevel {
    None,                    // Fully autonomous
    DestructiveOnly,         // Confirm deletes, submits
    AllClicks,               // Confirm all clicks
    EveryAction,             // Confirm everything
}

pub struct ForbiddenPattern {
    pub description: String,
    pub detector: Box<dyn Fn(&ComputerAction, &ParsedScreen) -> bool>,
}
```

---

## 4. Browser Automation

### Playwright Integration

Using Playwright for robust browser automation:

```rust
pub struct BrowserAgent {
    browser: Browser,
    current_page: Option<Page>,
    mode: BrowserMode,
    recording: Option<SessionRecording>,
}

pub enum BrowserMode {
    Headless,           // Background operation
    Visible,            // User can watch
    Interactive,        // User can intervene
}

pub struct BrowserAction {
    pub action_type: BrowserActionType,
    pub target: Option<ElementSelector>,
    pub value: Option<String>,
}

pub enum BrowserActionType {
    Navigate { url: String },
    Click,
    Type { text: String },
    Select { value: String },
    Scroll { direction: ScrollDirection },
    Screenshot,
    ExtractText,
    ExtractLinks,
    WaitForElement { selector: String, timeout_ms: u64 },
    ExecuteJs { script: String },
}

pub enum ElementSelector {
    Css(String),
    XPath(String),
    Text(String),
    AiDescription(String),  // "the blue submit button"
}
```

### MCP Browser Server

Expose browser as MCP tool:

```json
{
  "name": "browser",
  "description": "Control a web browser to navigate, click, type, and extract information",
  "inputSchema": {
    "type": "object",
    "properties": {
      "action": {
        "type": "string",
        "enum": ["navigate", "click", "type", "scroll", "screenshot", "extract"]
      },
      "url": { "type": "string" },
      "selector": { "type": "string" },
      "text": { "type": "string" }
    }
  }
}
```

---

## 5. File System Agent

### Safe File Operations

```rust
pub struct FileSystemAgent {
    sandbox: SandboxManager,
    allowed_paths: Vec<PathBuf>,
    denied_paths: Vec<PathBuf>,
    operation_log: Vec<FileOperation>,
    undo_stack: Vec<UndoableOperation>,
}

pub enum FileOperation {
    Read { path: PathBuf },
    Write { path: PathBuf, content: Vec<u8> },
    Create { path: PathBuf },
    Delete { path: PathBuf },
    Move { from: PathBuf, to: PathBuf },
    Copy { from: PathBuf, to: PathBuf },
    Mkdir { path: PathBuf },
    List { path: PathBuf },
    Search { pattern: String, root: PathBuf },
}

pub struct UndoableOperation {
    pub operation: FileOperation,
    pub backup: Option<Vec<u8>>,
    pub timestamp: DateTime<Utc>,
}

impl FileSystemAgent {
    /// Check if operation is allowed
    pub fn validate_operation(&self, op: &FileOperation) -> Result<(), FileError> {
        // Check path is within allowed directories
        // Check not in denied list (system files, etc.)
        // Check operation type is permitted
    }
    
    /// Execute with automatic backup
    pub async fn execute(&mut self, op: FileOperation) -> Result<FileResult, FileError> {
        self.validate_operation(&op)?;
        
        // Create backup for undo
        let backup = self.create_backup(&op).await?;
        
        // Execute operation
        let result = self.do_execute(&op).await?;
        
        // Log and push to undo stack
        self.operation_log.push(op.clone());
        self.undo_stack.push(UndoableOperation {
            operation: op,
            backup,
            timestamp: Utc::now(),
        });
        
        Ok(result)
    }
    
    /// Undo last operation
    pub async fn undo(&mut self) -> Result<(), FileError> {
        if let Some(undoable) = self.undo_stack.pop() {
            self.restore_backup(&undoable).await?;
        }
        Ok(())
    }
}
```

---

## 6. Visual Explainability System

### Real-Time Action Visualization

```rust
pub struct VisualExplainer {
    overlay: ScreenOverlay,
    recorder: Option<ScreenRecorder>,
    action_history: Vec<VisualAction>,
    mode: ExplainabilityMode,
}

pub enum ExplainabilityMode {
    Hidden,              // No visual feedback
    Cursor,              // Show cursor movements
    Highlights,          // Highlight clicked elements
    Full,                // Full overlay with explanations
    Recording,           // Record to video
}

pub struct VisualAction {
    pub action: ComputerAction,
    pub timestamp: DateTime<Utc>,
    pub screenshot_before: Vec<u8>,
    pub screenshot_after: Option<Vec<u8>>,
    pub explanation: String,
    pub element_highlighted: Option<BoundingBox>,
}

pub struct ScreenOverlay {
    // Transparent window that sits on top of everything
    window: OverlayWindow,
    
    // Visual elements to draw
    cursor_trail: Vec<(i32, i32, DateTime<Utc>)>,
    highlights: Vec<HighlightBox>,
    tooltips: Vec<Tooltip>,
    progress_indicator: Option<ProgressRing>,
}

pub struct HighlightBox {
    pub bounds: BoundingBox,
    pub color: Color,
    pub label: Option<String>,
    pub animation: HighlightAnimation,
    pub duration_ms: u64,
}

pub enum HighlightAnimation {
    Pulse,
    Glow,
    Border,
    Fill,
    Arrow { from: (i32, i32) },
}
```

### Action Replay

```rust
pub struct ActionReplay {
    actions: Vec<RecordedAction>,
    speed: f32,
    current_index: usize,
}

impl ActionReplay {
    /// Record an action for replay
    pub fn record(&mut self, action: &ComputerAction, result: &ActionResult, explanation: &str) {
        self.actions.push(RecordedAction {
            action: action.clone(),
            screenshot: result.screenshot.clone(),
            explanation: explanation.to_string(),
            timestamp: Utc::now(),
        });
    }
    
    /// Replay actions with visual feedback
    pub async fn replay(&self, explainer: &mut VisualExplainer) {
        for action in &self.actions {
            explainer.show_action(&action.action, &action.explanation).await;
            tokio::time::sleep(Duration::from_millis(
                (action.duration_ms as f32 / self.speed) as u64
            )).await;
        }
    }
    
    /// Export to video
    pub async fn export_video(&self, output_path: &Path) -> Result<(), ExportError> {
        // FFmpeg-based video generation from screenshots
    }
}
```

---

## 7. Unified Vision Service

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                      VoiceCode Vision Service                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Screen    │  │    OCR      │  │  OmniParser │  │   Action    │ │
│  │  Capture    │  │   Engine    │  │   Service   │  │  Executor   │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘ │
│         │                │                │                │         │
│         └────────────────┴────────────────┴────────────────┘         │
│                                   │                                   │
│                          ┌────────▼────────┐                         │
│                          │  Vision Agent   │                         │
│                          │    Orchestrator │                         │
│                          └────────┬────────┘                         │
│                                   │                                   │
│         ┌─────────────────────────┼─────────────────────────┐       │
│         │                         │                         │       │
│  ┌──────▼──────┐  ┌──────────────▼──────────────┐  ┌───────▼──────┐│
│  │   Browser   │  │      Computer Use           │  │    File      ││
│  │    Agent    │  │         Agent               │  │   System     ││
│  └─────────────┘  └─────────────────────────────┘  └──────────────┘│
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    Visual Explainability                        │ │
│  │  [Overlay] [Recording] [Replay] [Export]                       │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Main Service Interface

```rust
pub struct VisionService {
    // Core components
    screen_capture: ScreenCaptureService,
    ocr_engine: MultiTierOcrEngine,
    omniparser: OmniParserService,
    action_executor: ActionExecutor,
    
    // Agents
    browser_agent: BrowserAgent,
    computer_agent: ComputerUseAgent,
    file_agent: FileSystemAgent,
    
    // Explainability
    explainer: VisualExplainer,
    replay: ActionReplay,
    
    // Safety
    safety: ComputerUseSafety,
    
    // State
    current_task: Option<VisionTask>,
    task_history: Vec<CompletedTask>,
}

impl VisionService {
    /// Analyze current screen state
    pub async fn analyze_screen(&self) -> Result<ScreenAnalysis, VisionError>;
    
    /// Execute a high-level task using vision
    pub async fn execute_task(&mut self, task: &str) -> Result<TaskResult, VisionError>;
    
    /// Open browser and navigate
    pub async fn browse(&mut self, url: &str) -> Result<BrowseResult, VisionError>;
    
    /// Find and click an element by description
    pub async fn click_element(&mut self, description: &str) -> Result<ActionResult, VisionError>;
    
    /// Type text into focused element
    pub async fn type_text(&mut self, text: &str) -> Result<ActionResult, VisionError>;
    
    /// Read text from screen region
    pub async fn read_text(&self, region: Option<CaptureRegion>) -> Result<String, VisionError>;
    
    /// Manage files
    pub async fn file_operation(&mut self, op: FileOperation) -> Result<FileResult, VisionError>;
    
    /// Get replay of recent actions
    pub fn get_replay(&self) -> &ActionReplay;
    
    /// Enable/disable visual feedback
    pub fn set_explainability_mode(&mut self, mode: ExplainabilityMode);
}
```

---

## 8. Implementation Phases

### Phase 1: Enhanced OCR (Week 1-2)
- [ ] Integrate PaddleOCR via Python bridge
- [ ] Add Surya OCR for complex layouts
- [ ] Implement multi-tier OCR selection logic
- [ ] Add OCR caching and optimization

### Phase 2: OmniParser Integration (Week 2-3)
- [ ] Set up OmniParser Python service
- [ ] Create Rust FFI bridge
- [ ] Implement UI element parsing pipeline
- [ ] Add element caching and diffing

### Phase 3: Computer Use Agent (Week 3-4)
- [ ] Implement action executor (enigo/autopilot)
- [ ] Create agent loop with LLM integration
- [ ] Add safety guardrails
- [ ] Implement undo/rollback

### Phase 4: Browser Automation (Week 4-5)
- [ ] Playwright MCP server integration
- [ ] Browser agent implementation
- [ ] Web scraping and interaction
- [ ] Cookie/session management

### Phase 5: File System Agent (Week 5-6)
- [ ] Safe file operations with backup
- [ ] Path validation and sandboxing
- [ ] Undo stack implementation
- [ ] Integration with existing sandbox module

### Phase 6: Visual Explainability (Week 6-7)
- [ ] Screen overlay implementation (Tauri window)
- [ ] Action recording and replay
- [ ] Video export (FFmpeg)
- [ ] Real-time cursor tracking

### Phase 7: Integration & Testing (Week 7-8)
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Documentation
- [ ] User feedback integration

---

## 9. Dependencies

### Rust Crates
```toml
# Screen capture
screenshots = "0.8"
image = "0.25"
imageproc = "0.24"

# Input automation
enigo = "0.2"

# OCR (via FFI)
tesseract = "0.14"

# Browser automation (via subprocess)
# Playwright runs as separate Node.js process

# Video encoding
ffmpeg-next = "6.0"

# Overlay window
# Uses Tauri's transparent window feature
```

### Python Services (via subprocess/socket)
```python
# OCR
paddleocr>=2.7
surya-ocr>=0.4

# OmniParser
torch>=2.0
transformers>=4.35
ultralytics>=8.0  # YOLO for icon detection

# Browser (alternative to Playwright MCP)
browser-use>=1.0
```

---

## 10. Security Considerations

1. **Sandboxing**: All file operations go through sandbox module
2. **Rate Limiting**: Max actions per minute to prevent runaway
3. **Confirmation**: Destructive actions require user confirmation
4. **Audit Log**: All actions logged for review
5. **Emergency Stop**: Hotkey to immediately halt all automation
6. **Path Restrictions**: Whitelist of allowed directories
7. **Network Restrictions**: URL whitelist for browser automation
8. **Credential Handling**: Never store or transmit passwords

---

## 11. Visual Explainability Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| **Hidden** | No visual feedback | Headless automation |
| **Cursor** | Ghost cursor showing movements | Lightweight feedback |
| **Highlights** | Box around clicked elements | Standard use |
| **Full** | Overlay with explanations | Learning/debugging |
| **Recording** | Save to video file | Documentation/sharing |

---

## Conclusion

This architecture provides VoiceCode with state-of-the-art visual understanding capabilities:

- **Multi-tier OCR** for fast and accurate text extraction
- **OmniParser** for robust UI element detection
- **Computer Use Agent** for autonomous desktop control
- **Browser Agent** for web automation
- **File System Agent** for safe file management
- **Visual Explainability** for transparency and trust

The modular design allows incremental implementation and easy extension.
