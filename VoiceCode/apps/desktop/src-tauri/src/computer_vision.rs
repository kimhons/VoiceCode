#![allow(dead_code, unused_variables, unused_imports)]
// Computer Vision Module - Screen Capture, OCR, and UI Understanding
// Provides capabilities to capture, analyze, and verbalize screen content

use image::{DynamicImage, GenericImageView, GrayImage, RgbaImage};
use imageproc::contrast::threshold;
use imageproc::edges::canny;
use imageproc::morphology::{dilate, erode};
use imageproc::distance_transform::Norm;
use screenshots::Screen;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Screen capture configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScreenCaptureConfig {
    /// Capture specific monitor (0 = primary)
    pub monitor_index: usize,
    /// Capture region (None = full screen)
    pub region: Option<CaptureRegion>,
    /// Scale factor for processing (0.5 = half resolution)
    pub scale_factor: f32,
    /// Enable preprocessing for OCR
    pub preprocess_for_ocr: bool,
    /// Output format for saved images
    pub output_format: ImageFormat,
}

impl Default for ScreenCaptureConfig {
    fn default() -> Self {
        Self {
            monitor_index: 0,
            region: None,
            scale_factor: 1.0,
            preprocess_for_ocr: true,
            output_format: ImageFormat::Png,
        }
    }
}

/// Capture region specification
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaptureRegion {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}

/// Image output format
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum ImageFormat {
    Png,
    Jpeg,
    Bmp,
}

/// Result of screen capture
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaptureResult {
    /// Path to saved image (if saved)
    pub file_path: Option<PathBuf>,
    /// Image dimensions
    pub width: u32,
    pub height: u32,
    /// Monitor index
    pub monitor_index: usize,
    /// Timestamp
    pub timestamp: u64,
}

/// Detected UI element type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum UIElementType {
    Button,
    TextField,
    Label,
    Link,
    Image,
    Icon,
    Menu,
    MenuItem,
    Tab,
    List,
    ListItem,
    Table,
    TableRow,
    Checkbox,
    RadioButton,
    Dropdown,
    Slider,
    ProgressBar,
    Window,
    Dialog,
    Toolbar,
    StatusBar,
    ScrollBar,
    Unknown,
}

/// Bounding box for detected elements
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BoundingBox {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}

impl BoundingBox {
    pub fn center(&self) -> (i32, i32) {
        (
            self.x + (self.width as i32 / 2),
            self.y + (self.height as i32 / 2),
        )
    }

    pub fn area(&self) -> u32 {
        self.width * self.height
    }

    pub fn contains(&self, x: i32, y: i32) -> bool {
        x >= self.x
            && x < self.x + self.width as i32
            && y >= self.y
            && y < self.y + self.height as i32
    }

    pub fn intersects(&self, other: &BoundingBox) -> bool {
        !(self.x + self.width as i32 <= other.x
            || other.x + other.width as i32 <= self.x
            || self.y + self.height as i32 <= other.y
            || other.y + other.height as i32 <= self.y)
    }
}

/// Detected UI element
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UIElement {
    /// Element type
    pub element_type: UIElementType,
    /// Bounding box
    pub bounds: BoundingBox,
    /// Extracted text content
    pub text: Option<String>,
    /// Confidence score (0.0 - 1.0)
    pub confidence: f32,
    /// Element state (enabled, focused, etc.)
    pub state: ElementState,
    /// Visual properties
    pub visual: VisualProperties,
    /// Child elements
    pub children: Vec<UIElement>,
}

/// Element state information
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ElementState {
    pub enabled: bool,
    pub focused: bool,
    pub selected: bool,
    pub checked: bool,
    pub expanded: bool,
    pub visible: bool,
}

/// Visual properties of an element
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VisualProperties {
    /// Dominant color (RGBA)
    pub dominant_color: [u8; 4],
    /// Background color
    pub background_color: Option<[u8; 4]>,
    /// Has border
    pub has_border: bool,
    /// Border color
    pub border_color: Option<[u8; 4]>,
    /// Estimated font size
    pub font_size: Option<u32>,
}

impl Default for VisualProperties {
    fn default() -> Self {
        Self {
            dominant_color: [128, 128, 128, 255],
            background_color: None,
            has_border: false,
            border_color: None,
            font_size: None,
        }
    }
}

/// OCR text block
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TextBlock {
    /// Extracted text
    pub text: String,
    /// Bounding box
    pub bounds: BoundingBox,
    /// Confidence score
    pub confidence: f32,
    /// Text direction (ltr, rtl)
    pub direction: TextDirection,
    /// Detected language
    pub language: Option<String>,
    /// Is this a header/title
    pub is_header: bool,
    /// Font size estimate
    pub font_size_estimate: u32,
}

/// Text direction
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum TextDirection {
    LeftToRight,
    RightToLeft,
    TopToBottom,
}

impl Default for TextDirection {
    fn default() -> Self {
        TextDirection::LeftToRight
    }
}

/// Screen analysis result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScreenAnalysis {
    /// Captured image info
    pub capture: CaptureResult,
    /// Detected UI elements
    pub elements: Vec<UIElement>,
    /// Extracted text blocks
    pub text_blocks: Vec<TextBlock>,
    /// Screen layout type
    pub layout_type: LayoutType,
    /// Content regions
    pub regions: Vec<ContentRegion>,
    /// Analysis timestamp
    pub timestamp: u64,
}

/// Screen layout type
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum LayoutType {
    SingleColumn,
    TwoColumn,
    ThreeColumn,
    Grid,
    Sidebar,
    Dashboard,
    Document,
    Code,
    Terminal,
    Dialog,
    Unknown,
}

/// Content region
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContentRegion {
    /// Region name/description
    pub name: String,
    /// Region type
    pub region_type: RegionType,
    /// Bounding box
    pub bounds: BoundingBox,
    /// Elements in this region
    pub element_indices: Vec<usize>,
    /// Text blocks in this region
    pub text_block_indices: Vec<usize>,
}

/// Region type
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
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
    Unknown,
}

/// Screen verbalization configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerbalizationConfig {
    /// Verbosity level
    pub verbosity: VerbosityLevel,
    /// Include element positions
    pub include_positions: bool,
    /// Include colors
    pub include_colors: bool,
    /// Maximum text length
    pub max_text_length: usize,
    /// Group similar elements
    pub group_similar: bool,
    /// Reading order
    pub reading_order: ReadingOrder,
}

impl Default for VerbalizationConfig {
    fn default() -> Self {
        Self {
            verbosity: VerbosityLevel::Normal,
            include_positions: false,
            include_colors: false,
            max_text_length: 500,
            group_similar: true,
            reading_order: ReadingOrder::TopToBottom,
        }
    }
}

/// Verbosity level for screen descriptions
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum VerbosityLevel {
    /// Just main content
    Minimal,
    /// Standard description
    Normal,
    /// Detailed with all elements
    Detailed,
    /// Developer-focused with technical details
    Technical,
}

/// Reading order for verbalization
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum ReadingOrder {
    TopToBottom,
    LeftToRight,
    Importance,
    Natural,
}

/// Computer vision error
#[derive(Debug)]
pub enum CVError {
    CaptureError(String),
    ProcessingError(String),
    OCRError(String),
    AnalysisError(String),
    IOError(String),
}

impl std::fmt::Display for CVError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::CaptureError(msg) => write!(f, "Screen capture error: {}", msg),
            Self::ProcessingError(msg) => write!(f, "Image processing error: {}", msg),
            Self::OCRError(msg) => write!(f, "OCR error: {}", msg),
            Self::AnalysisError(msg) => write!(f, "Analysis error: {}", msg),
            Self::IOError(msg) => write!(f, "I/O error: {}", msg),
        }
    }
}

impl std::error::Error for CVError {}

/// Computer Vision Service
pub struct ComputerVisionService {
    config: RwLock<ScreenCaptureConfig>,
    verbalization_config: RwLock<VerbalizationConfig>,
    last_analysis: RwLock<Option<ScreenAnalysis>>,
}

impl ComputerVisionService {
    /// Create a new computer vision service
    pub fn new() -> Self {
        Self {
            config: RwLock::new(ScreenCaptureConfig::default()),
            verbalization_config: RwLock::new(VerbalizationConfig::default()),
            last_analysis: RwLock::new(None),
        }
    }

    /// Set capture configuration
    pub async fn set_config(&self, config: ScreenCaptureConfig) {
        *self.config.write().await = config;
    }

    /// Set verbalization configuration
    pub async fn set_verbalization_config(&self, config: VerbalizationConfig) {
        *self.verbalization_config.write().await = config;
    }

    /// Capture screen
    pub async fn capture_screen(&self) -> Result<(DynamicImage, CaptureResult), CVError> {
        let config = self.config.read().await.clone();

        // Get available screens
        let screens = Screen::all().map_err(|e| CVError::CaptureError(e.to_string()))?;

        if screens.is_empty() {
            return Err(CVError::CaptureError("No screens available".to_string()));
        }

        let screen_index = config.monitor_index.min(screens.len() - 1);
        let screen = &screens[screen_index];

        // Capture screen
        let capture = screen
            .capture()
            .map_err(|e| CVError::CaptureError(e.to_string()))?;

        let width = capture.width();
        let height = capture.height();

        // Get the raw RGBA buffer from the screenshot
        let rgba_data: Vec<u8> = capture
            .as_flat_samples()
            .samples
            .iter()
            .copied()
            .collect();

        let image = RgbaImage::from_raw(width, height, rgba_data)
            .ok_or_else(|| CVError::ProcessingError("Failed to create RGBA image".to_string()))?;

        let mut dynamic_image = DynamicImage::ImageRgba8(image);

        // Apply region crop if specified
        if let Some(region) = &config.region {
            dynamic_image = dynamic_image.crop_imm(
                region.x as u32,
                region.y as u32,
                region.width,
                region.height,
            );
        }

        // Scale if needed
        if config.scale_factor != 1.0 {
            let new_width = (dynamic_image.width() as f32 * config.scale_factor) as u32;
            let new_height = (dynamic_image.height() as f32 * config.scale_factor) as u32;
            dynamic_image = dynamic_image.resize(
                new_width,
                new_height,
                image::imageops::FilterType::Lanczos3,
            );
        }

        let result = CaptureResult {
            file_path: None,
            width: dynamic_image.width(),
            height: dynamic_image.height(),
            monitor_index: screen_index,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        };

        Ok((dynamic_image, result))
    }

    /// Capture and save screen to file
    pub async fn capture_and_save(&self, output_path: PathBuf) -> Result<CaptureResult, CVError> {
        let (image, mut result) = self.capture_screen().await?;

        image
            .save(&output_path)
            .map_err(|e| CVError::IOError(e.to_string()))?;

        result.file_path = Some(output_path);
        Ok(result)
    }

    /// Preprocess image for OCR
    pub fn preprocess_for_ocr(&self, image: &DynamicImage) -> GrayImage {
        // Convert to grayscale
        let gray = image.to_luma8();

        // Apply binary thresholding for better text detection
        let thresholded = threshold(&gray, 128, imageproc::contrast::ThresholdType::Binary);

        // Optional: denoise using morphological operations
        let kernel_size = 1;
        let eroded = erode(&thresholded, Norm::L1, kernel_size);
        let dilated = dilate(&eroded, Norm::L1, kernel_size);

        dilated
    }

    /// Detect edges for UI element detection
    pub fn detect_edges(&self, image: &DynamicImage) -> GrayImage {
        let gray = image.to_luma8();
        canny(&gray, 50.0, 100.0)
    }

    /// Analyze screen content
    pub async fn analyze_screen(&self) -> Result<ScreenAnalysis, CVError> {
        let (image, capture) = self.capture_screen().await?;

        // Detect UI elements
        let elements = self.detect_ui_elements(&image).await?;

        // Extract text blocks (OCR)
        let text_blocks = self.extract_text_blocks(&image).await?;

        // Determine layout type
        let layout_type = self.detect_layout_type(&image, &elements, &text_blocks);

        // Identify content regions
        let regions = self.identify_regions(&image, &elements, &text_blocks);

        let analysis = ScreenAnalysis {
            capture,
            elements,
            text_blocks,
            layout_type,
            regions,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        };

        // Store for later reference
        *self.last_analysis.write().await = Some(analysis.clone());

        Ok(analysis)
    }

    /// Detect UI elements in image
    async fn detect_ui_elements(&self, image: &DynamicImage) -> Result<Vec<UIElement>, CVError> {
        let mut elements = Vec::new();

        // Get image dimensions
        let (width, height) = image.dimensions();

        // Detect edges for element boundary detection
        let edges = self.detect_edges(image);

        // Find rectangular regions (potential UI elements)
        let rectangles = self.find_rectangles(&edges, width, height);

        for rect in rectangles {
            // Analyze the region to determine element type
            let region = image.crop_imm(
                rect.x as u32,
                rect.y as u32,
                rect.width.min(width - rect.x as u32),
                rect.height.min(height - rect.y as u32),
            );

            let element_type = self.classify_element(&region, &rect);
            let visual = self.extract_visual_properties(&region);

            elements.push(UIElement {
                element_type,
                bounds: rect,
                text: None, // Will be filled by OCR
                confidence: 0.7,
                state: ElementState {
                    enabled: true,
                    visible: true,
                    ..Default::default()
                },
                visual,
                children: Vec::new(),
            });
        }

        // Sort by position (top-left to bottom-right)
        elements.sort_by(|a, b| {
            let a_pos = a.bounds.y * 10000 + a.bounds.x;
            let b_pos = b.bounds.y * 10000 + b.bounds.x;
            a_pos.cmp(&b_pos)
        });

        Ok(elements)
    }

    /// Find rectangular regions in edge image
    fn find_rectangles(&self, edges: &GrayImage, width: u32, height: u32) -> Vec<BoundingBox> {
        let mut rectangles = Vec::new();

        // Simple contour finding: scan for connected components
        let min_size = 20u32;
        let max_rects = 100;

        // Grid-based detection for simplicity
        let grid_step = 50;

        for y in (0..height).step_by(grid_step) {
            for x in (0..width).step_by(grid_step) {
                // Check if this region has significant edge content
                let edge_count = self.count_edges_in_region(edges, x, y, grid_step as u32, grid_step as u32);

                if edge_count > (grid_step * grid_step / 10) as u32 {
                    // Expand to find actual bounds
                    if let Some(bounds) = self.expand_to_bounds(edges, x, y, width, height) {
                        if bounds.width >= min_size && bounds.height >= min_size {
                            // Check for overlap with existing rectangles
                            let overlaps = rectangles.iter().any(|r: &BoundingBox| r.intersects(&bounds));
                            if !overlaps && rectangles.len() < max_rects {
                                rectangles.push(bounds);
                            }
                        }
                    }
                }
            }
        }

        rectangles
    }

    /// Count edge pixels in a region
    fn count_edges_in_region(&self, edges: &GrayImage, x: u32, y: u32, w: u32, h: u32) -> u32 {
        let mut count = 0;
        let (img_w, img_h) = edges.dimensions();

        for dy in 0..h.min(img_h - y) {
            for dx in 0..w.min(img_w - x) {
                if edges.get_pixel(x + dx, y + dy).0[0] > 128 {
                    count += 1;
                }
            }
        }

        count
    }

    /// Expand from a point to find element bounds
    fn expand_to_bounds(&self, edges: &GrayImage, start_x: u32, start_y: u32, width: u32, height: u32) -> Option<BoundingBox> {
        let threshold = 128u8;

        // Find left edge
        let mut left = start_x;
        while left > 0 && self.has_vertical_edge(edges, left, start_y, 50, threshold) {
            left -= 1;
        }

        // Find right edge
        let mut right = start_x;
        while right < width - 1 && self.has_vertical_edge(edges, right, start_y, 50, threshold) {
            right += 1;
        }

        // Find top edge
        let mut top = start_y;
        while top > 0 && self.has_horizontal_edge(edges, left, top, right - left, threshold) {
            top -= 1;
        }

        // Find bottom edge
        let mut bottom = start_y;
        while bottom < height - 1 && self.has_horizontal_edge(edges, left, bottom, right - left, threshold) {
            bottom += 1;
        }

        let w = right.saturating_sub(left);
        let h = bottom.saturating_sub(top);

        if w > 10 && h > 10 {
            Some(BoundingBox {
                x: left as i32,
                y: top as i32,
                width: w,
                height: h,
            })
        } else {
            None
        }
    }

    fn has_vertical_edge(&self, edges: &GrayImage, x: u32, y: u32, height: u32, threshold: u8) -> bool {
        let (_, img_h) = edges.dimensions();
        let mut edge_count = 0;

        for dy in 0..height.min(img_h - y) {
            if edges.get_pixel(x, y + dy).0[0] > threshold {
                edge_count += 1;
            }
        }

        edge_count > height / 4
    }

    fn has_horizontal_edge(&self, edges: &GrayImage, x: u32, y: u32, width: u32, threshold: u8) -> bool {
        let (img_w, _) = edges.dimensions();
        let mut edge_count = 0;

        for dx in 0..width.min(img_w - x) {
            if edges.get_pixel(x + dx, y).0[0] > threshold {
                edge_count += 1;
            }
        }

        edge_count > width / 4
    }

    /// Classify UI element based on visual properties
    fn classify_element(&self, region: &DynamicImage, bounds: &BoundingBox) -> UIElementType {
        let aspect_ratio = bounds.width as f32 / bounds.height.max(1) as f32;
        let area = bounds.area();

        // Classify based on size and aspect ratio
        if aspect_ratio > 3.0 && bounds.height < 50 {
            // Wide and short - likely a text field or button
            if bounds.width > 200 {
                UIElementType::TextField
            } else {
                UIElementType::Button
            }
        } else if aspect_ratio < 0.5 && bounds.width < 50 {
            // Tall and narrow - likely a scrollbar
            UIElementType::ScrollBar
        } else if area < 2500 && aspect_ratio > 0.7 && aspect_ratio < 1.5 {
            // Small and square-ish - likely an icon or checkbox
            if area < 900 {
                UIElementType::Checkbox
            } else {
                UIElementType::Icon
            }
        } else if bounds.height < 40 && bounds.width > 100 {
            // Short horizontal bar - could be toolbar or status bar
            UIElementType::Toolbar
        } else if area > 50000 {
            // Large area - likely main content or panel
            UIElementType::Window
        } else {
            UIElementType::Unknown
        }
    }

    /// Extract visual properties from a region
    fn extract_visual_properties(&self, region: &DynamicImage) -> VisualProperties {
        let rgba = region.to_rgba8();
        let (width, height) = rgba.dimensions();

        // Calculate dominant color (simple average)
        let mut r_sum: u64 = 0;
        let mut g_sum: u64 = 0;
        let mut b_sum: u64 = 0;
        let pixel_count = (width * height) as u64;

        for pixel in rgba.pixels() {
            r_sum += pixel.0[0] as u64;
            g_sum += pixel.0[1] as u64;
            b_sum += pixel.0[2] as u64;
        }

        let dominant_color = if pixel_count > 0 {
            [
                (r_sum / pixel_count) as u8,
                (g_sum / pixel_count) as u8,
                (b_sum / pixel_count) as u8,
                255,
            ]
        } else {
            [128, 128, 128, 255]
        };

        // Check for border (edges have different color than center)
        let has_border = self.detect_border(&rgba);

        VisualProperties {
            dominant_color,
            background_color: Some(dominant_color),
            has_border,
            border_color: if has_border { Some([100, 100, 100, 255]) } else { None },
            font_size: None,
        }
    }

    /// Detect if region has a border
    fn detect_border(&self, image: &RgbaImage) -> bool {
        let (width, height) = image.dimensions();
        if width < 4 || height < 4 {
            return false;
        }

        // Sample edge pixels vs center pixels
        let edge_pixel = image.get_pixel(0, 0);
        let center_pixel = image.get_pixel(width / 2, height / 2);

        // Check if edge is significantly different from center
        let diff = (edge_pixel.0[0] as i32 - center_pixel.0[0] as i32).abs()
            + (edge_pixel.0[1] as i32 - center_pixel.0[1] as i32).abs()
            + (edge_pixel.0[2] as i32 - center_pixel.0[2] as i32).abs();

        diff > 100
    }

    /// Extract text blocks using OCR-like processing
    /// Note: This is a simplified version. For production, integrate with tesseract-rs or similar
    async fn extract_text_blocks(&self, image: &DynamicImage) -> Result<Vec<TextBlock>, CVError> {
        let mut text_blocks = Vec::new();

        // Preprocess for text detection
        let processed = self.preprocess_for_ocr(image);
        let (width, height) = processed.dimensions();

        // Simple text region detection based on horizontal projection
        let mut horizontal_projection = vec![0u32; height as usize];

        for y in 0..height {
            for x in 0..width {
                if processed.get_pixel(x, y).0[0] < 128 {
                    horizontal_projection[y as usize] += 1;
                }
            }
        }

        // Find text lines (regions with high pixel density)
        let threshold = width / 10;
        let mut in_text_region = false;
        let mut region_start = 0;

        for (y, &density) in horizontal_projection.iter().enumerate() {
            if density > threshold && !in_text_region {
                in_text_region = true;
                region_start = y;
            } else if density <= threshold && in_text_region {
                in_text_region = false;
                let region_height = y - region_start;

                if region_height > 5 {
                    // Found a text region
                    let font_size = self.estimate_font_size(region_height as u32);

                    text_blocks.push(TextBlock {
                        text: "[OCR placeholder - integrate tesseract for actual text]".to_string(),
                        bounds: BoundingBox {
                            x: 0,
                            y: region_start as i32,
                            width,
                            height: region_height as u32,
                        },
                        confidence: 0.5,
                        direction: TextDirection::LeftToRight,
                        language: Some("en".to_string()),
                        is_header: font_size > 20,
                        font_size_estimate: font_size,
                    });
                }
            }
        }

        Ok(text_blocks)
    }

    /// Estimate font size from text region height
    fn estimate_font_size(&self, region_height: u32) -> u32 {
        // Rough estimate: text height is roughly 70% of line height
        (region_height as f32 * 0.7) as u32
    }

    /// Detect overall layout type
    fn detect_layout_type(
        &self,
        _image: &DynamicImage,
        elements: &[UIElement],
        text_blocks: &[TextBlock],
    ) -> LayoutType {
        if elements.is_empty() && text_blocks.is_empty() {
            return LayoutType::Unknown;
        }

        // Check for code layout (mono-spaced text, syntax patterns)
        let code_indicators = text_blocks.iter().filter(|b| {
            b.text.contains("fn ") || b.text.contains("def ") || b.text.contains("function") ||
            b.text.contains("{") || b.text.contains("=>")
        }).count();

        if code_indicators > 3 {
            return LayoutType::Code;
        }

        // Check for terminal (dark background, monospace)
        let dark_elements = elements.iter().filter(|e| {
            let color = e.visual.dominant_color;
            (color[0] as u32 + color[1] as u32 + color[2] as u32) < 150
        }).count();

        if dark_elements > elements.len() / 2 {
            return LayoutType::Terminal;
        }

        // Check for sidebar layout
        let left_elements = elements.iter().filter(|e| e.bounds.x < 250).count();
        if left_elements > 3 && left_elements < elements.len() / 3 {
            return LayoutType::Sidebar;
        }

        // Check for document layout (mostly text)
        if text_blocks.len() > elements.len() * 2 {
            return LayoutType::Document;
        }

        // Default to single column
        LayoutType::SingleColumn
    }

    /// Identify content regions
    fn identify_regions(
        &self,
        image: &DynamicImage,
        elements: &[UIElement],
        text_blocks: &[TextBlock],
    ) -> Vec<ContentRegion> {
        let mut regions = Vec::new();
        let (width, height) = image.dimensions();

        // Header region (top 10%)
        let header_height = height / 10;
        let header_elements: Vec<usize> = elements.iter().enumerate()
            .filter(|(_, e)| e.bounds.y < header_height as i32)
            .map(|(i, _)| i)
            .collect();
        let header_text: Vec<usize> = text_blocks.iter().enumerate()
            .filter(|(_, t)| t.bounds.y < header_height as i32)
            .map(|(i, _)| i)
            .collect();

        if !header_elements.is_empty() || !header_text.is_empty() {
            regions.push(ContentRegion {
                name: "Header".to_string(),
                region_type: RegionType::Header,
                bounds: BoundingBox {
                    x: 0,
                    y: 0,
                    width,
                    height: header_height,
                },
                element_indices: header_elements,
                text_block_indices: header_text,
            });
        }

        // Main content region
        let main_y = header_height;
        let main_height = height - header_height - height / 10;
        let main_elements: Vec<usize> = elements.iter().enumerate()
            .filter(|(_, e)| {
                e.bounds.y >= main_y as i32 && e.bounds.y < (main_y + main_height) as i32
            })
            .map(|(i, _)| i)
            .collect();
        let main_text: Vec<usize> = text_blocks.iter().enumerate()
            .filter(|(_, t)| {
                t.bounds.y >= main_y as i32 && t.bounds.y < (main_y + main_height) as i32
            })
            .map(|(i, _)| i)
            .collect();

        regions.push(ContentRegion {
            name: "Main Content".to_string(),
            region_type: RegionType::MainContent,
            bounds: BoundingBox {
                x: 0,
                y: main_y as i32,
                width,
                height: main_height,
            },
            element_indices: main_elements,
            text_block_indices: main_text,
        });

        regions
    }

    /// Generate natural language description of screen
    pub async fn verbalize_screen(&self) -> Result<String, CVError> {
        let analysis = self.analyze_screen().await?;
        self.verbalize_analysis(&analysis).await
    }

    /// Generate description from existing analysis
    pub async fn verbalize_analysis(&self, analysis: &ScreenAnalysis) -> Result<String, CVError> {
        let config = self.verbalization_config.read().await.clone();
        let mut description = Vec::new();

        // Layout overview
        description.push(format!(
            "Screen layout: {} ({} x {} pixels)",
            self.layout_type_name(analysis.layout_type),
            analysis.capture.width,
            analysis.capture.height
        ));

        // Region descriptions
        for region in &analysis.regions {
            let region_desc = self.describe_region(region, &analysis.elements, &analysis.text_blocks, &config);
            if !region_desc.is_empty() {
                description.push(region_desc);
            }
        }

        // Element summary
        if config.verbosity as u8 >= VerbosityLevel::Normal as u8 {
            let element_summary = self.summarize_elements(&analysis.elements, &config);
            if !element_summary.is_empty() {
                description.push(element_summary);
            }
        }

        // Text content
        if config.verbosity as u8 >= VerbosityLevel::Detailed as u8 {
            let text_summary = self.summarize_text(&analysis.text_blocks, &config);
            if !text_summary.is_empty() {
                description.push(format!("Text content: {}", text_summary));
            }
        }

        Ok(description.join("\n\n"))
    }

    fn layout_type_name(&self, layout: LayoutType) -> &'static str {
        match layout {
            LayoutType::SingleColumn => "Single column",
            LayoutType::TwoColumn => "Two columns",
            LayoutType::ThreeColumn => "Three columns",
            LayoutType::Grid => "Grid",
            LayoutType::Sidebar => "Sidebar layout",
            LayoutType::Dashboard => "Dashboard",
            LayoutType::Document => "Document",
            LayoutType::Code => "Code editor",
            LayoutType::Terminal => "Terminal",
            LayoutType::Dialog => "Dialog",
            LayoutType::Unknown => "Unknown",
        }
    }

    fn describe_region(
        &self,
        region: &ContentRegion,
        elements: &[UIElement],
        text_blocks: &[TextBlock],
        config: &VerbalizationConfig,
    ) -> String {
        let mut parts = Vec::new();

        parts.push(format!("{} region", region.name));

        // Count element types
        let mut type_counts: HashMap<UIElementType, usize> = HashMap::new();
        for &idx in &region.element_indices {
            if idx < elements.len() {
                *type_counts.entry(elements[idx].element_type).or_insert(0) += 1;
            }
        }

        if !type_counts.is_empty() {
            let type_desc: Vec<String> = type_counts
                .iter()
                .filter(|(_, &count)| count > 0)
                .map(|(t, count)| {
                    if *count > 1 {
                        format!("{} {}s", count, self.element_type_name(*t))
                    } else {
                        self.element_type_name(*t).to_string()
                    }
                })
                .collect();

            if !type_desc.is_empty() {
                parts.push(format!("contains {}", type_desc.join(", ")));
            }
        }

        // Text content in region
        if !region.text_block_indices.is_empty() && config.verbosity as u8 >= VerbosityLevel::Normal as u8 {
            let text_count = region.text_block_indices.len();
            parts.push(format!("with {} text block{}", text_count, if text_count > 1 { "s" } else { "" }));
        }

        if config.include_positions {
            parts.push(format!(
                "at ({}, {}) size {}x{}",
                region.bounds.x, region.bounds.y, region.bounds.width, region.bounds.height
            ));
        }

        parts.join(" ")
    }

    fn element_type_name(&self, element_type: UIElementType) -> &'static str {
        match element_type {
            UIElementType::Button => "button",
            UIElementType::TextField => "text field",
            UIElementType::Label => "label",
            UIElementType::Link => "link",
            UIElementType::Image => "image",
            UIElementType::Icon => "icon",
            UIElementType::Menu => "menu",
            UIElementType::MenuItem => "menu item",
            UIElementType::Tab => "tab",
            UIElementType::List => "list",
            UIElementType::ListItem => "list item",
            UIElementType::Table => "table",
            UIElementType::TableRow => "table row",
            UIElementType::Checkbox => "checkbox",
            UIElementType::RadioButton => "radio button",
            UIElementType::Dropdown => "dropdown",
            UIElementType::Slider => "slider",
            UIElementType::ProgressBar => "progress bar",
            UIElementType::Window => "window",
            UIElementType::Dialog => "dialog",
            UIElementType::Toolbar => "toolbar",
            UIElementType::StatusBar => "status bar",
            UIElementType::ScrollBar => "scrollbar",
            UIElementType::Unknown => "element",
        }
    }

    fn summarize_elements(&self, elements: &[UIElement], config: &VerbalizationConfig) -> String {
        if elements.is_empty() {
            return String::new();
        }

        let mut type_counts: HashMap<UIElementType, usize> = HashMap::new();
        for elem in elements {
            *type_counts.entry(elem.element_type).or_insert(0) += 1;
        }

        let summary: Vec<String> = type_counts
            .iter()
            .filter(|(t, _)| **t != UIElementType::Unknown)
            .map(|(t, count)| {
                if *count > 1 {
                    format!("{} {}s", count, self.element_type_name(*t))
                } else {
                    format!("1 {}", self.element_type_name(*t))
                }
            })
            .collect();

        if summary.is_empty() {
            return String::new();
        }

        format!("UI elements: {}", summary.join(", "))
    }

    fn summarize_text(&self, text_blocks: &[TextBlock], config: &VerbalizationConfig) -> String {
        if text_blocks.is_empty() {
            return String::new();
        }

        let mut combined = String::new();
        let mut char_count = 0;

        for block in text_blocks {
            if char_count >= config.max_text_length {
                combined.push_str("...");
                break;
            }

            let remaining = config.max_text_length - char_count;
            if block.text.len() > remaining {
                combined.push_str(&block.text[..remaining]);
                combined.push_str("...");
                break;
            }

            if !combined.is_empty() {
                combined.push(' ');
            }
            combined.push_str(&block.text);
            char_count = combined.len();
        }

        combined
    }

    /// Get element at specific coordinates
    pub async fn get_element_at(&self, x: i32, y: i32) -> Option<UIElement> {
        let analysis = self.last_analysis.read().await;
        if let Some(ref a) = *analysis {
            for element in &a.elements {
                if element.bounds.contains(x, y) {
                    return Some(element.clone());
                }
            }
        }
        None
    }

    /// Describe what's at a specific location
    pub async fn describe_location(&self, x: i32, y: i32) -> String {
        if let Some(element) = self.get_element_at(x, y).await {
            let mut desc = format!("{}", self.element_type_name(element.element_type));

            if let Some(text) = &element.text {
                desc.push_str(&format!(" with text '{}'", text));
            }

            desc
        } else {
            "Empty area".to_string()
        }
    }
}

impl Default for ComputerVisionService {
    fn default() -> Self {
        Self::new()
    }
}

/// Global computer vision service
static CV_SERVICE: once_cell::sync::Lazy<Arc<ComputerVisionService>> =
    once_cell::sync::Lazy::new(|| Arc::new(ComputerVisionService::new()));

/// Get the computer vision service instance
pub fn get_cv_service() -> Arc<ComputerVisionService> {
    CV_SERVICE.clone()
}

// Tauri commands

/// Capture screen and save to file
#[tauri::command]
pub async fn capture_screen(output_path: Option<String>) -> Result<CaptureResult, String> {
    let service = get_cv_service();

    if let Some(path) = output_path {
        service
            .capture_and_save(PathBuf::from(path))
            .await
            .map_err(|e| e.to_string())
    } else {
        let (_, result) = service.capture_screen().await.map_err(|e| e.to_string())?;
        Ok(result)
    }
}

/// Analyze current screen
#[tauri::command]
pub async fn analyze_screen() -> Result<ScreenAnalysis, String> {
    get_cv_service()
        .analyze_screen()
        .await
        .map_err(|e| e.to_string())
}

/// Get natural language description of screen
#[tauri::command]
pub async fn verbalize_screen() -> Result<String, String> {
    get_cv_service()
        .verbalize_screen()
        .await
        .map_err(|e| e.to_string())
}

/// Describe element at coordinates
#[tauri::command]
pub async fn describe_location(x: i32, y: i32) -> Result<String, String> {
    Ok(get_cv_service().describe_location(x, y).await)
}

/// Set screen capture configuration
#[tauri::command]
pub async fn set_capture_config(config: ScreenCaptureConfig) -> Result<(), String> {
    get_cv_service().set_config(config).await;
    Ok(())
}

/// Set verbalization configuration
#[tauri::command]
pub async fn set_verbalization_config(config: VerbalizationConfig) -> Result<(), String> {
    get_cv_service().set_verbalization_config(config).await;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_bounding_box() {
        let bbox = BoundingBox {
            x: 10,
            y: 20,
            width: 100,
            height: 50,
        };

        assert_eq!(bbox.center(), (60, 45));
        assert_eq!(bbox.area(), 5000);
        assert!(bbox.contains(50, 40));
        assert!(!bbox.contains(0, 0));
    }

    #[test]
    fn test_bounding_box_intersection() {
        let bbox1 = BoundingBox {
            x: 0,
            y: 0,
            width: 100,
            height: 100,
        };
        let bbox2 = BoundingBox {
            x: 50,
            y: 50,
            width: 100,
            height: 100,
        };
        let bbox3 = BoundingBox {
            x: 200,
            y: 200,
            width: 50,
            height: 50,
        };

        assert!(bbox1.intersects(&bbox2));
        assert!(!bbox1.intersects(&bbox3));
    }

    #[test]
    fn test_visual_properties_default() {
        let props = VisualProperties::default();
        assert_eq!(props.dominant_color, [128, 128, 128, 255]);
        assert!(!props.has_border);
    }

    #[tokio::test]
    async fn test_cv_service_creation() {
        let service = ComputerVisionService::new();
        // Just ensure it creates without panic
        assert!(true);
    }
}
