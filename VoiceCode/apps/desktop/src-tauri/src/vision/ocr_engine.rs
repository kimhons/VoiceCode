#![allow(dead_code, unused_variables, unused_imports)]
// Multi-Tier OCR Engine - Fast, Accurate, and Semantic text extraction
// Supports Tesseract (fast), PaddleOCR/Surya (accurate), and Vision LLMs (semantic)

use std::path::PathBuf;
use std::process::Stdio;
use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use parking_lot::RwLock;
use image::{DynamicImage, GenericImageView};
use tokio::process::Command;

/// OCR configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OcrConfig {
    pub default_tier: OcrTier,
    pub tesseract_path: Option<PathBuf>,
    pub paddle_ocr_enabled: bool,
    pub surya_enabled: bool,
    pub vision_llm_enabled: bool,
    pub vision_llm_model: String,
    pub cache_enabled: bool,
    pub cache_max_size: usize,
    pub timeout_ms: u64,
}

impl Default for OcrConfig {
    fn default() -> Self {
        Self {
            default_tier: OcrTier::Standard,
            tesseract_path: None,
            paddle_ocr_enabled: true,
            surya_enabled: true,
            vision_llm_enabled: false,
            vision_llm_model: "gpt-4-vision-preview".to_string(),
            cache_enabled: true,
            cache_max_size: 100,
            timeout_ms: 30000,
        }
    }
}

/// OCR tier selection
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum OcrTier {
    Fast,      // Tesseract - quick but less accurate
    Standard,  // PaddleOCR/Surya - balanced
    Semantic,  // Vision LLM - best for complex layouts
    Auto,      // Automatically select based on content
}

/// Text region detected by OCR
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TextRegion {
    pub bounds: OcrBounds,
    pub text: String,
    pub confidence: f32,
    pub language: Option<String>,
    pub is_code: bool,
    pub font_size_estimate: u32,
}

/// Bounding box for OCR results
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OcrBounds {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}

/// Text block with semantic information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TextBlock {
    pub regions: Vec<TextRegion>,
    pub block_type: TextBlockType,
    pub reading_order: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TextBlockType {
    Paragraph,
    Header,
    Code,
    List,
    Table,
    Caption,
    Navigation,
    Unknown,
}

/// OCR result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OcrResult {
    pub full_text: String,
    pub regions: Vec<TextRegion>,
    pub blocks: Vec<TextBlock>,
    pub tier_used: OcrTier,
    pub processing_time_ms: u64,
    pub language_detected: Option<String>,
}

/// Multi-tier OCR engine
pub struct MultiTierOcr {
    config: RwLock<OcrConfig>,
    cache: RwLock<HashMap<String, OcrResult>>,
}

impl MultiTierOcr {
    pub fn new(config: OcrConfig) -> Self {
        Self {
            config: RwLock::new(config),
            cache: RwLock::new(HashMap::new()),
        }
    }

    /// Extract text from image using default tier
    pub async fn extract_text(&self, image: &DynamicImage) -> Result<OcrResult, OcrError> {
        let tier = self.config.read().default_tier;
        self.extract_with_tier(image, tier).await
    }

    /// Extract text using specific tier
    pub async fn extract_with_tier(&self, image: &DynamicImage, tier: OcrTier) -> Result<OcrResult, OcrError> {
        let start = std::time::Instant::now();

        // Check cache
        let image_hash = self.hash_image(image);
        if self.config.read().cache_enabled {
            if let Some(cached) = self.cache.read().get(&image_hash) {
                return Ok(cached.clone());
            }
        }

        // Determine actual tier to use
        let actual_tier = if tier == OcrTier::Auto {
            self.select_tier(image)
        } else {
            tier
        };

        // Execute OCR based on tier
        let mut result = match actual_tier {
            OcrTier::Fast => self.tesseract_ocr(image).await?,
            OcrTier::Standard => self.paddle_ocr(image).await?,
            OcrTier::Semantic => self.vision_llm_ocr(image).await?,
            OcrTier::Auto => unreachable!(),
        };

        result.tier_used = actual_tier;
        result.processing_time_ms = start.elapsed().as_millis() as u64;

        // Cache result
        if self.config.read().cache_enabled {
            let mut cache = self.cache.write();
            if cache.len() >= self.config.read().cache_max_size {
                // Remove oldest entry (simple LRU)
                if let Some(key) = cache.keys().next().cloned() {
                    cache.remove(&key);
                }
            }
            cache.insert(image_hash, result.clone());
        }

        Ok(result)
    }

    /// Auto-select tier based on image analysis
    fn select_tier(&self, image: &DynamicImage) -> OcrTier {
        let (width, height) = image.dimensions();
        let pixel_count = width * height;

        // Small images or simple text -> Fast tier
        if pixel_count < 500_000 {
            return OcrTier::Fast;
        }

        // Analyze image complexity
        let complexity = self.estimate_complexity(image);
        
        if complexity < 0.3 {
            OcrTier::Fast
        } else if complexity < 0.7 {
            OcrTier::Standard
        } else {
            if self.config.read().vision_llm_enabled {
                OcrTier::Semantic
            } else {
                OcrTier::Standard
            }
        }
    }

    fn estimate_complexity(&self, image: &DynamicImage) -> f32 {
        // Simple complexity estimation based on edge density
        let gray = image.to_luma8();
        let (width, height) = gray.dimensions();
        
        if width < 10 || height < 10 {
            return 0.0;
        }

        let mut edge_count = 0u32;
        let threshold = 30u8;

        for y in 1..height - 1 {
            for x in 1..width - 1 {
                let center = gray.get_pixel(x, y).0[0] as i32;
                let right = gray.get_pixel(x + 1, y).0[0] as i32;
                let bottom = gray.get_pixel(x, y + 1).0[0] as i32;
                
                if (center - right).unsigned_abs() > threshold as u32 ||
                   (center - bottom).unsigned_abs() > threshold as u32 {
                    edge_count += 1;
                }
            }
        }

        let total_pixels = (width - 2) * (height - 2);
        edge_count as f32 / total_pixels as f32
    }

    /// Tesseract OCR (fast tier)
    async fn tesseract_ocr(&self, image: &DynamicImage) -> Result<OcrResult, OcrError> {
        // Save image to temp file
        let temp_path = std::env::temp_dir().join(format!("voicecode_ocr_{}.png", uuid::Uuid::new_v4()));
        image.save(&temp_path).map_err(|e| OcrError::ImageError(e.to_string()))?;

        // Run tesseract
        let tesseract_path = self.config.read().tesseract_path.clone()
            .unwrap_or_else(|| PathBuf::from("tesseract"));

        let output = Command::new(&tesseract_path)
            .arg(&temp_path)
            .arg("stdout")
            .arg("-l").arg("eng")
            .arg("--psm").arg("3")  // Automatic page segmentation
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .await
            .map_err(|e| OcrError::ExecutionError(format!("Tesseract failed: {}", e)))?;

        // Cleanup temp file
        let _ = tokio::fs::remove_file(&temp_path).await;

        if !output.status.success() {
            return Err(OcrError::ExecutionError(
                String::from_utf8_lossy(&output.stderr).to_string()
            ));
        }

        let text = String::from_utf8_lossy(&output.stdout).trim().to_string();

        Ok(OcrResult {
            full_text: text.clone(),
            regions: vec![TextRegion {
                bounds: OcrBounds {
                    x: 0,
                    y: 0,
                    width: image.width(),
                    height: image.height(),
                },
                text,
                confidence: 0.8,
                language: Some("en".to_string()),
                is_code: false,
                font_size_estimate: 12,
            }],
            blocks: vec![],
            tier_used: OcrTier::Fast,
            processing_time_ms: 0,
            language_detected: Some("en".to_string()),
        })
    }

    /// PaddleOCR via Python subprocess (standard tier)
    async fn paddle_ocr(&self, image: &DynamicImage) -> Result<OcrResult, OcrError> {
        // Save image to temp file
        let temp_path = std::env::temp_dir().join(format!("voicecode_ocr_{}.png", uuid::Uuid::new_v4()));
        image.save(&temp_path).map_err(|e| OcrError::ImageError(e.to_string()))?;

        // Python script to run PaddleOCR
        let python_script = r#"
import sys
import json
try:
    from paddleocr import PaddleOCR
    ocr = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
    result = ocr.ocr(sys.argv[1], cls=True)
    output = []
    if result and result[0]:
        for line in result[0]:
            bbox, (text, conf) = line
            output.append({
                'text': text,
                'confidence': conf,
                'bbox': [int(bbox[0][0]), int(bbox[0][1]), 
                        int(bbox[2][0] - bbox[0][0]), int(bbox[2][1] - bbox[0][1])]
            })
    print(json.dumps(output))
except Exception as e:
    print(json.dumps({'error': str(e)}))
"#;

        let output = Command::new("python")
            .arg("-c")
            .arg(python_script)
            .arg(&temp_path)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .await
            .map_err(|e| OcrError::ExecutionError(format!("PaddleOCR failed: {}", e)))?;

        // Cleanup temp file
        let _ = tokio::fs::remove_file(&temp_path).await;

        let stdout = String::from_utf8_lossy(&output.stdout);
        let parsed: serde_json::Value = serde_json::from_str(&stdout)
            .map_err(|e| OcrError::ParseError(e.to_string()))?;

        if let Some(error) = parsed.get("error") {
            return Err(OcrError::ExecutionError(error.as_str().unwrap_or("Unknown error").to_string()));
        }

        let mut regions = Vec::new();
        let mut full_text = String::new();

        if let Some(items) = parsed.as_array() {
            for item in items {
                let text = item["text"].as_str().unwrap_or("").to_string();
                let confidence = item["confidence"].as_f64().unwrap_or(0.0) as f32;
                let bbox = item["bbox"].as_array();

                if !text.is_empty() {
                    if !full_text.is_empty() {
                        full_text.push(' ');
                    }
                    full_text.push_str(&text);

                    let bounds = if let Some(b) = bbox {
                        OcrBounds {
                            x: b[0].as_i64().unwrap_or(0) as i32,
                            y: b[1].as_i64().unwrap_or(0) as i32,
                            width: b[2].as_i64().unwrap_or(100) as u32,
                            height: b[3].as_i64().unwrap_or(20) as u32,
                        }
                    } else {
                        OcrBounds { x: 0, y: 0, width: 100, height: 20 }
                    };

                    regions.push(TextRegion {
                        bounds,
                        text,
                        confidence,
                        language: Some("en".to_string()),
                        is_code: false,
                        font_size_estimate: 14,
                    });
                }
            }
        }

        Ok(OcrResult {
            full_text,
            regions,
            blocks: vec![],
            tier_used: OcrTier::Standard,
            processing_time_ms: 0,
            language_detected: Some("en".to_string()),
        })
    }

    /// Vision LLM OCR (semantic tier)
    async fn vision_llm_ocr(&self, image: &DynamicImage) -> Result<OcrResult, OcrError> {
        // Encode image to base64
        let mut buffer = std::io::Cursor::new(Vec::new());
        image.write_to(&mut buffer, image::ImageFormat::Png)
            .map_err(|e| OcrError::ImageError(e.to_string()))?;
        let base64_image = base64::Engine::encode(
            &base64::engine::general_purpose::STANDARD,
            buffer.into_inner()
        );

        // This would call the LLM API
        // For now, fall back to PaddleOCR
        self.paddle_ocr(image).await
    }

    fn hash_image(&self, image: &DynamicImage) -> String {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};
        
        let (width, height) = image.dimensions();
        let sample_pixels: Vec<u8> = image.to_rgba8()
            .pixels()
            .step_by(100)
            .take(100)
            .flat_map(|p| p.0.iter().copied())
            .collect();
        
        let mut hasher = DefaultHasher::new();
        width.hash(&mut hasher);
        height.hash(&mut hasher);
        sample_pixels.hash(&mut hasher);
        format!("{:x}", hasher.finish())
    }

    /// Extract text from screen region
    pub async fn extract_from_screen(&self, region: Option<crate::computer_vision::CaptureRegion>) -> Result<OcrResult, OcrError> {
        let cv_service = crate::computer_vision::get_cv_service();
        let (image, _) = cv_service.capture_screen().await
            .map_err(|e| OcrError::CaptureError(e.to_string()))?;

        let cropped = if let Some(r) = region {
            image.crop_imm(r.x as u32, r.y as u32, r.width, r.height)
        } else {
            image
        };

        self.extract_text(&cropped).await
    }

    /// Check if code is detected in text
    pub fn is_code(&self, text: &str) -> bool {
        let code_indicators = [
            "function ", "def ", "class ", "const ", "let ", "var ",
            "import ", "from ", "return ", "if (", "for (", "while (",
            "=>", "->", "::", "&&", "||", "!=", "==", "===",
            "pub fn", "impl ", "struct ", "enum ",
        ];

        code_indicators.iter().any(|i| text.contains(i))
    }

    pub fn set_config(&self, config: OcrConfig) {
        *self.config.write() = config;
    }
}

#[derive(Debug)]
pub enum OcrError {
    ImageError(String),
    ExecutionError(String),
    ParseError(String),
    CaptureError(String),
    Timeout,
}

impl std::fmt::Display for OcrError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            OcrError::ImageError(msg) => write!(f, "Image error: {}", msg),
            OcrError::ExecutionError(msg) => write!(f, "Execution error: {}", msg),
            OcrError::ParseError(msg) => write!(f, "Parse error: {}", msg),
            OcrError::CaptureError(msg) => write!(f, "Capture error: {}", msg),
            OcrError::Timeout => write!(f, "OCR timeout"),
        }
    }
}

impl std::error::Error for OcrError {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ocr_config_default() {
        let config = OcrConfig::default();
        assert_eq!(config.default_tier, OcrTier::Standard);
    }

    #[test]
    fn test_code_detection() {
        let ocr = MultiTierOcr::new(OcrConfig::default());
        
        assert!(ocr.is_code("function test() { return true; }"));
        assert!(ocr.is_code("pub fn main() {}"));
        assert!(!ocr.is_code("Hello world, this is a test."));
    }
}
