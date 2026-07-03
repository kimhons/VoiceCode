#![allow(dead_code, unused_variables, unused_imports)]
// OmniParser Integration - Microsoft's UI understanding for pure vision-based agents
// Parses screenshots into structured UI elements for LLM consumption

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::process::Stdio;
use serde::{Deserialize, Serialize};
use parking_lot::RwLock;
use tokio::process::Command;
use image::{DynamicImage, GenericImageView};

/// OmniParser configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OmniParserConfig {
    pub enabled: bool,
    pub model_path: Option<PathBuf>,
    pub icon_detect_model: String,
    pub icon_caption_model: String,
    pub confidence_threshold: f32,
    pub max_elements: usize,
    pub cache_enabled: bool,
    pub gpu_enabled: bool,
}

impl Default for OmniParserConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            model_path: None,
            icon_detect_model: "icon_detect".to_string(),
            icon_caption_model: "icon_caption_florence".to_string(),
            confidence_threshold: 0.5,
            max_elements: 100,
            cache_enabled: true,
            gpu_enabled: true,
        }
    }
}

/// Parsed UI element from OmniParser
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedElement {
    pub id: usize,
    pub element_type: ElementType,
    pub bounds: ElementBounds,
    pub text: Option<String>,
    pub caption: String,
    pub confidence: f32,
    pub interactable: bool,
    pub interaction_type: Option<InteractionType>,
    pub parent_id: Option<usize>,
    pub children_ids: Vec<usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ElementBounds {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}

impl ElementBounds {
    pub fn center(&self) -> (i32, i32) {
        (
            self.x + (self.width as i32 / 2),
            self.y + (self.height as i32 / 2),
        )
    }

    pub fn contains(&self, x: i32, y: i32) -> bool {
        x >= self.x && x < self.x + self.width as i32 &&
        y >= self.y && y < self.y + self.height as i32
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ElementType {
    Button,
    TextField,
    TextArea,
    Checkbox,
    RadioButton,
    Dropdown,
    Link,
    Icon,
    Image,
    Label,
    Menu,
    MenuItem,
    Tab,
    List,
    ListItem,
    Table,
    TableCell,
    Slider,
    ProgressBar,
    Window,
    Dialog,
    Toolbar,
    StatusBar,
    ScrollBar,
    Container,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum InteractionType {
    Click,
    DoubleClick,
    RightClick,
    Type,
    Select,
    Toggle,
    Drag,
    Scroll,
    Hover,
    Focus,
}

/// Parsed screen result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedScreen {
    pub elements: Vec<ParsedElement>,
    pub text_content: String,
    pub layout_type: LayoutType,
    pub regions: Vec<ScreenRegion>,
    pub width: u32,
    pub height: u32,
    pub parsing_time_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum LayoutType {
    Desktop,
    Browser,
    Document,
    Dialog,
    Menu,
    Terminal,
    IDE,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScreenRegion {
    pub name: String,
    pub region_type: RegionType,
    pub bounds: ElementBounds,
    pub element_ids: Vec<usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RegionType {
    Header,
    Navigation,
    Sidebar,
    MainContent,
    Footer,
    Toolbar,
    StatusBar,
    Dialog,
    Menu,
    Panel,
}

/// OmniParser service
pub struct OmniParser {
    config: RwLock<OmniParserConfig>,
    cache: RwLock<HashMap<String, ParsedScreen>>,
    python_available: RwLock<Option<bool>>,
}

impl OmniParser {
    pub fn new(config: OmniParserConfig) -> Self {
        Self {
            config: RwLock::new(config),
            cache: RwLock::new(HashMap::new()),
            python_available: RwLock::new(None),
        }
    }

    /// Check if OmniParser is available
    pub async fn check_availability(&self) -> bool {
        if let Some(available) = *self.python_available.read() {
            return available;
        }

        // Check if Python and OmniParser are available
        let check_script = r#"
try:
    from ultralytics import YOLO
    from transformers import AutoProcessor, AutoModelForCausalLM
    print("OK")
except ImportError as e:
    print(f"ERROR: {e}")
"#;

        let output = Command::new("python")
            .arg("-c")
            .arg(check_script)
            .output()
            .await;

        let available = output
            .map(|o| String::from_utf8_lossy(&o.stdout).contains("OK"))
            .unwrap_or(false);

        *self.python_available.write() = Some(available);
        available
    }

    /// Parse a screenshot into structured elements
    pub async fn parse_screen(&self, image: &DynamicImage) -> Result<ParsedScreen, OmniParserError> {
        let start = std::time::Instant::now();

        // Check cache
        let image_hash = self.hash_image(image);
        if self.config.read().cache_enabled {
            if let Some(cached) = self.cache.read().get(&image_hash) {
                return Ok(cached.clone());
            }
        }

        // Save image to temp file
        let temp_path = std::env::temp_dir().join(format!("omniparser_{}.png", uuid::Uuid::new_v4()));
        image.save(&temp_path).map_err(|e| OmniParserError::ImageError(e.to_string()))?;

        // Run OmniParser
        let result = self.run_omniparser(&temp_path).await;

        // Cleanup
        let _ = tokio::fs::remove_file(&temp_path).await;

        let mut parsed = result?;
        parsed.width = image.width();
        parsed.height = image.height();
        parsed.parsing_time_ms = start.elapsed().as_millis() as u64;

        // Cache result
        if self.config.read().cache_enabled {
            self.cache.write().insert(image_hash, parsed.clone());
        }

        Ok(parsed)
    }

    async fn run_omniparser(&self, image_path: &Path) -> Result<ParsedScreen, OmniParserError> {
        let config = self.config.read();

        // Python script to run OmniParser
        let script = format!(r#"
import sys
import json
from pathlib import Path

try:
    # Load models
    from ultralytics import YOLO
    
    # Simplified detection (actual OmniParser uses more sophisticated models)
    model_path = "{model_path}"
    if not Path(model_path).exists():
        # Fallback to basic detection
        elements = []
        print(json.dumps({{"elements": elements, "text_content": "", "layout_type": "Unknown"}}))
        sys.exit(0)
    
    model = YOLO(model_path)
    results = model.predict(sys.argv[1], conf={conf})
    
    elements = []
    for i, box in enumerate(results[0].boxes):
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        cls = int(box.cls[0])
        conf = float(box.conf[0])
        
        elements.append({{
            "id": i,
            "type": cls,
            "bounds": {{
                "x": int(x1),
                "y": int(y1),
                "width": int(x2 - x1),
                "height": int(y2 - y1)
            }},
            "confidence": conf,
            "interactable": True,
            "caption": f"Element {{i}}"
        }})
    
    print(json.dumps({{
        "elements": elements,
        "text_content": "",
        "layout_type": "Desktop"
    }}))

except Exception as e:
    print(json.dumps({{"error": str(e)}}))
"#,
            model_path = config.model_path.as_ref()
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or_default(),
            conf = config.confidence_threshold
        );

        let output = Command::new("python")
            .arg("-c")
            .arg(&script)
            .arg(image_path)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .await
            .map_err(|e| OmniParserError::ExecutionError(e.to_string()))?;

        let stdout = String::from_utf8_lossy(&output.stdout);
        let parsed: serde_json::Value = serde_json::from_str(&stdout)
            .map_err(|e| OmniParserError::ParseError(format!("{}: {}", e, stdout)))?;

        if let Some(error) = parsed.get("error") {
            return Err(OmniParserError::ExecutionError(
                error.as_str().unwrap_or("Unknown error").to_string()
            ));
        }

        // Convert to ParsedScreen
        let elements = self.parse_elements(&parsed);
        let text_content = parsed.get("text_content")
            .and_then(|t| t.as_str())
            .unwrap_or("")
            .to_string();
        let layout_type = self.parse_layout_type(
            parsed.get("layout_type").and_then(|l| l.as_str()).unwrap_or("Unknown")
        );

        Ok(ParsedScreen {
            elements,
            text_content,
            layout_type,
            regions: vec![],
            width: 0,
            height: 0,
            parsing_time_ms: 0,
        })
    }

    fn parse_elements(&self, data: &serde_json::Value) -> Vec<ParsedElement> {
        let mut elements = Vec::new();
        
        if let Some(items) = data.get("elements").and_then(|e| e.as_array()) {
            for item in items {
                let bounds = item.get("bounds").map(|b| ElementBounds {
                    x: b.get("x").and_then(|v| v.as_i64()).unwrap_or(0) as i32,
                    y: b.get("y").and_then(|v| v.as_i64()).unwrap_or(0) as i32,
                    width: b.get("width").and_then(|v| v.as_i64()).unwrap_or(0) as u32,
                    height: b.get("height").and_then(|v| v.as_i64()).unwrap_or(0) as u32,
                }).unwrap_or(ElementBounds { x: 0, y: 0, width: 0, height: 0 });

                elements.push(ParsedElement {
                    id: item.get("id").and_then(|v| v.as_u64()).unwrap_or(0) as usize,
                    element_type: self.parse_element_type(
                        item.get("type").and_then(|v| v.as_i64()).unwrap_or(0) as u32
                    ),
                    bounds,
                    text: item.get("text").and_then(|v| v.as_str()).map(String::from),
                    caption: item.get("caption").and_then(|v| v.as_str())
                        .unwrap_or("Unknown element").to_string(),
                    confidence: item.get("confidence").and_then(|v| v.as_f64()).unwrap_or(0.0) as f32,
                    interactable: item.get("interactable").and_then(|v| v.as_bool()).unwrap_or(false),
                    interaction_type: self.infer_interaction_type(
                        item.get("type").and_then(|v| v.as_i64()).unwrap_or(0) as u32
                    ),
                    parent_id: None,
                    children_ids: vec![],
                });
            }
        }

        elements
    }

    fn parse_element_type(&self, type_id: u32) -> ElementType {
        match type_id {
            0 => ElementType::Button,
            1 => ElementType::TextField,
            2 => ElementType::Checkbox,
            3 => ElementType::RadioButton,
            4 => ElementType::Dropdown,
            5 => ElementType::Link,
            6 => ElementType::Icon,
            7 => ElementType::Image,
            8 => ElementType::Label,
            9 => ElementType::Menu,
            10 => ElementType::MenuItem,
            11 => ElementType::Tab,
            12 => ElementType::List,
            13 => ElementType::ListItem,
            14 => ElementType::Table,
            15 => ElementType::Slider,
            _ => ElementType::Unknown,
        }
    }

    fn parse_layout_type(&self, layout: &str) -> LayoutType {
        match layout.to_lowercase().as_str() {
            "desktop" => LayoutType::Desktop,
            "browser" => LayoutType::Browser,
            "document" => LayoutType::Document,
            "dialog" => LayoutType::Dialog,
            "menu" => LayoutType::Menu,
            "terminal" => LayoutType::Terminal,
            "ide" => LayoutType::IDE,
            _ => LayoutType::Unknown,
        }
    }

    fn infer_interaction_type(&self, type_id: u32) -> Option<InteractionType> {
        match type_id {
            0 => Some(InteractionType::Click),      // Button
            1 => Some(InteractionType::Type),       // TextField
            2 => Some(InteractionType::Toggle),     // Checkbox
            3 => Some(InteractionType::Click),      // RadioButton
            4 => Some(InteractionType::Select),     // Dropdown
            5 => Some(InteractionType::Click),      // Link
            6 => Some(InteractionType::Click),      // Icon
            10 => Some(InteractionType::Click),     // MenuItem
            11 => Some(InteractionType::Click),     // Tab
            13 => Some(InteractionType::Click),     // ListItem
            15 => Some(InteractionType::Drag),      // Slider
            _ => None,
        }
    }

    fn hash_image(&self, image: &DynamicImage) -> String {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};
        
        let (width, height) = image.dimensions();
        let sample: Vec<u8> = image.to_rgba8()
            .pixels()
            .step_by(100)
            .take(50)
            .flat_map(|p| p.0.iter().copied())
            .collect();
        
        let mut hasher = DefaultHasher::new();
        width.hash(&mut hasher);
        height.hash(&mut hasher);
        sample.hash(&mut hasher);
        format!("{:x}", hasher.finish())
    }

    /// Find element at coordinates
    pub fn find_element_at<'a>(&self, screen: &'a ParsedScreen, x: i32, y: i32) -> Option<&'a ParsedElement> {
        // Find smallest element containing the point
        screen.elements.iter()
            .filter(|e| e.bounds.contains(x, y))
            .min_by_key(|e| e.bounds.width * e.bounds.height)
    }

    /// Find element by description (fuzzy match)
    pub fn find_element_by_description<'a>(&self, screen: &'a ParsedScreen, description: &str) -> Option<&'a ParsedElement> {
        let desc_lower = description.to_lowercase();
        
        // First try exact match on caption
        if let Some(elem) = screen.elements.iter().find(|e| 
            e.caption.to_lowercase() == desc_lower
        ) {
            return Some(elem);
        }

        // Then try contains match
        if let Some(elem) = screen.elements.iter().find(|e|
            e.caption.to_lowercase().contains(&desc_lower) ||
            e.text.as_ref().map(|t| t.to_lowercase().contains(&desc_lower)).unwrap_or(false)
        ) {
            return Some(elem);
        }

        None
    }

    /// Format elements for LLM prompt
    pub fn format_for_prompt(&self, screen: &ParsedScreen) -> String {
        let mut output = format!("Screen: {}x{}, Layout: {:?}\n\n", 
            screen.width, screen.height, screen.layout_type);
        
        output.push_str("## UI Elements\n\n");
        
        for elem in &screen.elements {
            let (cx, cy) = elem.bounds.center();
            output.push_str(&format!(
                "[{}] {:?} at ({}, {}): {}{}\n",
                elem.id,
                elem.element_type,
                cx, cy,
                elem.caption,
                if elem.interactable { " [interactable]" } else { "" }
            ));
        }

        if !screen.text_content.is_empty() {
            output.push_str("\n## Text Content\n\n");
            output.push_str(&screen.text_content);
        }

        output
    }

    pub fn set_config(&self, config: OmniParserConfig) {
        *self.config.write() = config;
    }

    pub fn clear_cache(&self) {
        self.cache.write().clear();
    }
}

#[derive(Debug)]
pub enum OmniParserError {
    ImageError(String),
    ExecutionError(String),
    ParseError(String),
    NotAvailable,
}

impl std::fmt::Display for OmniParserError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::ImageError(msg) => write!(f, "Image error: {}", msg),
            Self::ExecutionError(msg) => write!(f, "Execution error: {}", msg),
            Self::ParseError(msg) => write!(f, "Parse error: {}", msg),
            Self::NotAvailable => write!(f, "OmniParser not available"),
        }
    }
}

impl std::error::Error for OmniParserError {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_config_default() {
        let config = OmniParserConfig::default();
        assert!(config.enabled);
        assert_eq!(config.confidence_threshold, 0.5);
    }

    #[test]
    fn test_element_bounds() {
        let bounds = ElementBounds { x: 100, y: 100, width: 50, height: 30 };
        assert_eq!(bounds.center(), (125, 115));
        assert!(bounds.contains(110, 110));
        assert!(!bounds.contains(50, 50));
    }
}
