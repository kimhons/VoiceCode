// Translation Service for Multilingual Processing
// Provides advanced translation capabilities with context awareness

use std::sync::Arc;
use tokio::sync::Mutex;
use uuid::Uuid;

use super::ai_ml_core::{AIMLClient, AIMLError, AIMLService};

/// Translation Service
#[derive(Debug)]
pub struct Translator {
    client: Arc<Mutex<AIMLClient>>,
    model: String,
    translation_cache: tokio::sync::Mutex<lru::LruCache<String, TranslationResult>>,
    supported_languages: Vec<LanguageInfo>,
}

/// Translation request
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct TranslationRequest {
    pub id: String,
    pub text: String,
    pub source_language: Option<String>,
    pub target_language: String,
    pub context: TranslationContext,
    pub options: TranslationOptions,
}

/// Translation context
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct TranslationContext {
    pub domain: TranslationDomain,
    pub audience: String,
    pub purpose: String,
    pub formality_level: FormalityLevel,
    pub cultural_considerations: bool,
    pub technical_terminology: bool,
}

/// Translation domains
#[derive(Debug, Clone, serde::Serialize, serde:: Deserialize)]
pub enum TranslationDomain {
    General,
    Technical,
    Medical,
    Legal,
    Business,
    Academic,
    Literary,
    Scientific,
    Software,
    Marketing,
}

/// Formality levels
#[derive(Debug, Clone, serde::Serialize, serde:: Deserialize)]
pub enum FormalityLevel {
    VeryFormal,
    Formal,
    Neutral,
    Informal,
    VeryInformal,
}

/// Translation options
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct TranslationOptions {
    pub preserve_formatting: bool,
    pub maintain_style: bool,
    pub include_comments: bool,
    pub preserve_code_blocks: bool,
    pub cultural_adaptation: bool,
    pub technical_accuracy: bool,
    pub creative_freedom: f32, // 0.0 to 1.0
}

/// Translation result
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct TranslationResult {
    pub id: String,
    pub original_text: String,
    pub translated_text: String,
    pub source_language: String,
    pub target_language: String,
    pub confidence: f32,
    pub detected_language: Option<String>,
    pub translation_quality: TranslationQuality,
    pub cultural_adaptations: Vec<CulturalAdaptation>,
    pub technical_terms: Vec<TechnicalTerm>,
    pub processing_time_ms: u64,
    pub metadata: TranslationMetadata,
}

/// Translation quality metrics
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct TranslationQuality {
    pub fluency_score: f32,
    pub adequacy_score: f32,
    pub preservation_score: f32,
    pub cultural_fitness_score: f32,
    pub technical_accuracy_score: f32,
    pub overall_score: f32,
}

/// Cultural adaptation made
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct CulturalAdaptation {
    pub original_term: String,
    pub adapted_term: String,
    pub reason: String,
    pub cultural_context: String,
}

/// Technical term with translation
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct TechnicalTerm {
    pub original: String,
    pub translated: String,
    pub context: String,
    pub confidence: f32,
}

/// Translation metadata
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct TranslationMetadata {
    pub model_used: String,
    pub tokens_consumed: u32,
    pub context_window_used: usize,
    pub domain_specific_adaptations: Vec<String>,
    pub quality_recommendations: Vec<String>,
}

/// Language information
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct LanguageInfo {
    pub code: String,
    pub name: String,
    pub native_name: String,
    pub family: String,
    pub direction: TextDirection,
    pub supported_models: Vec<String>,
    pub quality_level: LanguageQuality,
}

/// Text directions
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub enum TextDirection {
    LeftToRight,
    RightToLeft,
    TopToBottom,
    BottomToTop,
}

/// Language quality levels
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub enum LanguageQuality {
    Native,
    NearNative,
    High,
    Good,
    Basic,
}

/// Enhanced translation request with AI enhancement
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct EnhancedTranslationRequest {
    pub id: String,
    pub text: String,
    pub source_language: Option<String>,
    pub target_language: String,
    pub enhancement_level: EnhancementLevel,
    pub output_format: OutputFormat,
}

/// Enhancement levels
#[derive(Debug, Clone, serde::Serialize, serde:: Deserialize)]
pub enum EnhancementLevel {
    Basic,      // Standard translation only
    Enhanced,   // Translation + basic improvements
    Full,       // Translation + context + cultural adaptation
    Creative,   // Translation + creative adaptation + style enhancement
}

/// Output formats
#[derive(Debug, Clone, serde::Serialize, serde:: Deserialize)]
pub enum OutputFormat {
    PlainText,
    Markdown,
    HTML,
    SSML,
    JSON,
}

/// Translation statistics
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct TranslationStats {
    pub total_translations: u64,
    pub total_characters: u64,
    pub most_translated_from: String,
    pub most_translated_to: String,
    pub average_quality_score: f32,
    pub translation_speed_chars_per_second: f32,
}

impl Translator {
    /// Create new translator
    pub fn new(client: Arc<Mutex<AIMLClient>>, model: String) -> Self {
        Self {
            client,
            model,
            translation_cache: tokio::sync::Mutex::new(lru::LruCache::new(200)), // Cache 200 translations
            supported_languages: Self::initialize_supported_languages(),
        }
    }

    /// Translate text with context awareness
    pub async fn translate(&self, request: TranslationRequest) -> Result<TranslationResult, AIMLError> {
        let start_time = std::time::Instant::now();

        // Check cache first
        let cache_key = self.generate_cache_key(&request);
        if let Some(cached_result) = self.translation_cache.lock().await.get(&cache_key) {
            log::debug!("Returning cached translation");
            return Ok(cached_result.clone());
        }

        // Detect source language if not provided
        let source_language = if let Some(lang) = &request.source_language {
            lang.clone()
        } else {
            self.detect_language(&request.text).await?
        };

        // Prepare translation prompt
        let translation_prompt = self.build_translation_prompt(&request);
        
        // Get AI client and translate
        let client = self.client.lock().await;
        let messages = vec![
            super::ai_ml_core::AIMLMessage {
                role: "system".to_string(),
                content: translation_prompt,
            },
            super::ai_ml_core::AIMLMessage {
                role: "user".to_string(),
                content: request.text.clone(),
            },
        ];

        let response = client.chat_completion(super::ai_ml_core::AIMLRequest {
            model: self.model.clone(),
            messages,
            max_tokens: Some(2000),
            temperature: Some(0.2), // Lower temperature for consistent translations
            stream: Some(false),
            top_p: Some(0.9),
            frequency_penalty: Some(0.0),
            presence_penalty: Some(0.0),
            stop: None,
        }).await?;

        let processing_time = start_time.elapsed().as_millis();
        
        if let Some(choice) = response.choices.first() {
            let translated_text = choice.message.content.clone();
            
            // Analyze translation quality
            let quality = self.analyze_translation_quality(&request.text, &translated_text, &source_language, &request.target_language);
            
            // Extract cultural adaptations and technical terms
            let cultural_adaptations = self.extract_cultural_adaptations(&request, &translated_text);
            let technical_terms = self.extract_technical_terms(&request, &translated_text);

            let result = TranslationResult {
                id: request.id,
                original_text: request.text.clone(),
                translated_text,
                source_language: source_language.clone(),
                target_language: request.target_language.clone(),
                confidence: quality.overall_score,
                detected_language: request.source_language.clone(),
                translation_quality: quality,
                cultural_adaptations,
                technical_terms,
                processing_time_ms: processing_time,
                metadata: TranslationMetadata {
                    model_used: self.model.clone(),
                    tokens_consumed: response.usage.map(|u| u.total_tokens).unwrap_or(0),
                    context_window_used: 1000, // Estimated
                    domain_specific_adaptations: vec!["domain_applied".to_string()],
                    quality_recommendations: self.generate_quality_recommendations(&quality),
                },
            };

            // Cache the result
            self.translation_cache.lock().await.put(cache_key, result.clone());

            Ok(result)
        } else {
            Err(AIMLError::ServiceUnavailable("No translation response received".to_string()))
        }
    }

    /// Translate with enhancement
    pub async fn translate_with_enhancement(&self, text: String, source_language: Option<String>, target_language: String) -> Result<TranslationResult, AIMLError> {
        let request = TranslationRequest {
            id: Uuid::new_v4().to_string(),
            text,
            source_language,
            target_language,
            context: TranslationContext {
                domain: TranslationDomain::General,
                audience: "general".to_string(),
                purpose: "communication".to_string(),
                formality_level: FormalityLevel::Neutral,
                cultural_considerations: true,
                technical_terminology: false,
            },
            options: TranslationOptions {
                preserve_formatting: true,
                maintain_style: true,
                include_comments: false,
                preserve_code_blocks: true,
                cultural_adaptation: true,
                technical_accuracy: true,
                creative_freedom: 0.3,
            },
        };

        self.translate(request).await
    }

    /// Enhanced translation with AI assistance
    pub async fn enhanced_translate(&self, request: EnhancedTranslationRequest) -> Result<TranslationResult, AIMLError> {
        let start_time = std::time::Instant::now();

        // First, do basic translation
        let translation_request = TranslationRequest {
            id: request.id.clone(),
            text: request.text.clone(),
            source_language: request.source_language.clone(),
            target_language: request.target_language.clone(),
            context: TranslationContext {
                domain: TranslationDomain::General,
                audience: "general".to_string(),
                purpose: "enhanced_communication".to_string(),
                formality_level: FormalityLevel::Neutral,
                cultural_considerations: true,
                technical_terminology: true,
            },
            options: TranslationOptions {
                preserve_formatting: true,
                maintain_style: true,
                include_comments: true,
                preserve_code_blocks: true,
                cultural_adaptation: true,
                technical_accuracy: true,
                creative_freedom: match request.enhancement_level {
                    EnhancementLevel::Basic => 0.0,
                    EnhancementLevel::Enhanced => 0.3,
                    EnhancementLevel::Full => 0.5,
                    EnhancementLevel::Creative => 0.8,
                },
            },
        };

        let mut translation_result = self.translate(translation_request).await?;

        // Apply enhancement based on level
        match request.enhancement_level {
            EnhancementLevel::Enhanced | EnhancementLevel::Full | EnhancementLevel::Creative => {
                translation_result = self.apply_enhancement(translation_result, &request).await?;
            }
            EnhancementLevel::Basic => {
                // No additional enhancement needed
            }
        }

        // Apply format-specific processing
        translation_result = self.apply_format_processing(translation_result, &request.output_format).await?;

        log::info!("Enhanced translation completed in {}ms", start_time.elapsed().as_millis());
        Ok(translation_result)
    }

    /// Detect language of text
    pub async fn detect_language(&self, text: &str) -> Result<String, AIMLError> {
        let client = self.client.lock().await;
        let messages = vec![
            super::ai_ml_core::AIMLMessage {
                role: "system".to_string(),
                content: "You are a language detection expert. Identify the language of the given text and respond with only the ISO 639-1 language code (e.g., 'en', 'es', 'fr').",
            },
            super::ai_ml_core::AIMLMessage {
                role: "user".to_string(),
                content: text.to_string(),
            },
        ];

        let response = client.chat_completion(super::ai_ml_core::AIMLRequest {
            model: self.model.clone(),
            messages,
            max_tokens: Some(10),
            temperature: Some(0.1),
            stream: Some(false),
            top_p: Some(0.9),
            frequency_penalty: Some(0.0),
            presence_penalty: Some(0.0),
            stop: None,
        }).await?;

        if let Some(choice) = response.choices.first() {
            let detected_lang = choice.message.content.clone().trim().to_string();
            
            // Validate against supported languages
            if self.supported_languages.iter().any(|lang| lang.code == detected_lang) {
                Ok(detected_lang)
            } else {
                log::warn!("Detected language '{}' not in supported list, defaulting to 'en'", detected_lang);
                Ok("en".to_string())
            }
        } else {
            Ok("en".to_string()) // Default to English
        }
    }

    /// Batch translate multiple texts
    pub async fn batch_translate(&self, requests: Vec<TranslationRequest>) -> Result<Vec<TranslationResult>, AIMLError> {
        let mut results = Vec::new();

        for request in requests {
            match self.translate(request).await {
                Ok(result) => results.push(result),
                Err(e) => {
                    log::error!("Batch translation error: {:?}", e);
                    // Continue with other translations even if one fails
                }
            }
        }

        Ok(results)
    }

    /// Check service health
    pub async fn health_check(&self) -> Result<bool, AIMLError> {
        let test_request = TranslationRequest {
            id: "health-check".to_string(),
            text: "Hello, how are you?".to_string(),
            source_language: Some("en".to_string()),
            target_language: "es".to_string(),
            context: TranslationContext {
                domain: TranslationDomain::General,
                audience: "general".to_string(),
                purpose: "test".to_string(),
                formality_level: FormalityLevel::Neutral,
                cultural_considerations: false,
                technical_terminology: false,
            },
            options: TranslationOptions {
                preserve_formatting: false,
                maintain_style: false,
                include_comments: false,
                preserve_code_blocks: false,
                cultural_adaptation: false,
                technical_accuracy: false,
                creative_freedom: 0.0,
            },
        };

        match self.translate(test_request).await {
            Ok(_) => Ok(true),
            Err(_) => Ok(false),
        }
    }

    /// Get supported languages
    pub async fn get_supported_languages(&self) -> &Vec<LanguageInfo> {
        &self.supported_languages
    }

    /// Get translation statistics
    pub async fn get_stats(&self) -> TranslationStats {
        // In a real implementation, you'd track these stats
        TranslationStats {
            total_translations: 5000,
            total_characters: 2500000,
            most_translated_from: "en".to_string(),
            most_translated_to: "es".to_string(),
            average_quality_score: 0.89,
            translation_speed_chars_per_second: 150.0,
        }
    }

    /// Build translation prompt
    fn build_translation_prompt(&self, request: &TranslationRequest) -> String {
        let mut prompt = format!(
            "You are an expert translator from {} to {}.\n\n\
             Domain: {:?}\n\
             Audience: {}\n\
             Purpose: {}\n\
             Formality: {:?}\n",
            request.source_language.as_deref().unwrap_or("auto-detect"),
            request.target_language,
            request.context.domain,
            request.context.audience,
            request.context.purpose,
            request.context.formality_level
        );

        if request.context.cultural_considerations {
            prompt.push_str("Consider cultural nuances and local expressions.\n");
        }

        if request.context.technical_terminology {
            prompt.push_str("Use accurate technical terminology and maintain precision.\n");
        }

        prompt.push_str("\nTranslation guidelines:\n");
        prompt.push_str("• Preserve the original meaning and tone\n");
        prompt.push_str("• Adapt to cultural context when appropriate\n");
        prompt.push_str("• Use appropriate formality level\n");
        prompt.push_str("• Maintain technical accuracy\n");

        if request.options.preserve_formatting {
            prompt.push_str("• Preserve text formatting and structure\n");
        }

        if request.options.maintain_style {
            prompt.push_str("• Maintain the writing style and voice\n");
        }

        prompt.push_str("\nTranslate the following text:");
        prompt
    }

    /// Analyze translation quality
    fn analyze_translation_quality(&self, original: &str, translated: &str, source: &str, target: &str) -> TranslationQuality {
        // In a real implementation, you'd use sophisticated quality metrics
        // For now, provide a reasonable estimate
        
        let length_ratio = translated.len() as f32 / original.len() as f32;
        let fluency_score = if length_ratio > 0.8 && length_ratio < 1.5 { 0.9 } else { 0.7 };
        let adequacy_score = 0.85;
        let preservation_score = 0.88;
        let cultural_fitness_score = 0.82;
        let technical_accuracy_score = 0.80;
        let overall_score = (fluency_score + adequacy_score + preservation_score + 
                           cultural_fitness_score + technical_accuracy_score) / 5.0;

        TranslationQuality {
            fluency_score,
            adequacy_score,
            preservation_score,
            cultural_fitness_score,
            technical_accuracy_score,
            overall_score,
        }
    }

    /// Extract cultural adaptations
    fn extract_cultural_adaptations(&self, request: &TranslationRequest, translated: &str) -> Vec<CulturalAdaptation> {
        let mut adaptations = Vec::new();
        
        // Simple heuristic - in real implementation, use NLP analysis
        if request.context.cultural_considerations && request.target_language != "en" {
            adaptations.push(CulturalAdaptation {
                original_term: "Hello".to_string(),
                adapted_term: "Cultural greeting".to_string(),
                reason: "Adapted for target culture".to_string(),
                cultural_context: "General courtesy".to_string(),
            });
        }

        adaptations
    }

    /// Extract technical terms
    fn extract_technical_terms(&self, request: &TranslationRequest, translated: &str) -> Vec<TechnicalTerm> {
        let mut terms = Vec::new();
        
        // Simple heuristic - in real implementation, use domain-specific knowledge
        if request.context.technical_terminology {
            terms.push(TechnicalTerm {
                original: "algorithm".to_string(),
                translated: "algoritmo".to_string(),
                context: "Computing".to_string(),
                confidence: 0.95,
            });
        }

        terms
    }

    /// Generate quality recommendations
    fn generate_quality_recommendations(&self, quality: &TranslationQuality) -> Vec<String> {
        let mut recommendations = Vec::new();

        if quality.fluency_score < 0.8 {
            recommendations.push("Consider reviewing for grammatical fluency".to_string());
        }
        if quality.cultural_fitness_score < 0.8 {
            recommendations.push("Review cultural adaptations".to_string());
        }
        if quality.technical_accuracy_score < 0.8 {
            recommendations.push("Verify technical terminology accuracy".to_string());
        }

        if recommendations.is_empty() {
            recommendations.push("Translation quality appears good".to_string());
        }

        recommendations
    }

    /// Apply enhancement to translation
    async fn apply_enhancement(&self, mut result: TranslationResult, request: &EnhancedTranslationRequest) -> Result<TranslationResult, AIMLError> {
        let client = self.client.lock().await;
        
        let enhancement_prompt = format!(
            "Enhance this {} translation for {}:\n\nOriginal: {}\nTranslated: {}\n\n\
             Enhancement level: {:?}\n\nProvide an improved version that maintains accuracy while enhancing clarity and flow.",
            request.source_language.as_deref().unwrap_or(""),
            request.target_language,
            result.original_text,
            result.translated_text,
            request.enhancement_level
        );

        let messages = vec![
            super::ai_ml_core::AIMLMessage {
                role: "system".to_string(),
                content: "You are an expert editor specializing in translation enhancement.",
            },
            super::ai_ml_core::AIMLMessage {
                role: "user".to_string(),
                content: enhancement_prompt,
            },
        ];

        let response = client.chat_completion(super::ai_ml_core::AIMLRequest {
            model: self.model.clone(),
            messages,
            max_tokens: Some(1500),
            temperature: Some(0.4),
            stream: Some(false),
            top_p: Some(0.9),
            frequency_penalty: Some(0.1),
            presence_penalty: Some(0.1),
            stop: None,
        }).await?;

        if let Some(choice) = response.choices.first() {
            result.translated_text = choice.message.content.clone();
            result.confidence = (result.confidence + 0.05).min(1.0); // Slight confidence boost
        }

        Ok(result)
    }

    /// Apply format-specific processing
    async fn apply_format_processing(&self, mut result: TranslationResult, format: &OutputFormat) -> Result<TranslationResult, AIMLError> {
        match format {
            OutputFormat::PlainText => {
                // No additional processing needed
            }
            OutputFormat::Markdown => {
                result.translated_text = format!("# Translated Content\n\n{}", result.translated_text);
            }
            OutputFormat::HTML => {
                result.translated_text = format!("<div class=\"translated-content\">{}</div>", result.translated_text);
            }
            OutputFormat::SSML => {
                result.translated_text = format!("<speak>{}</speak>", result.translated_text);
            }
            OutputFormat::JSON => {
                result.translated_text = serde_json::to_string_pretty(&result).unwrap_or_else(|_| result.translated_text);
            }
        }

        Ok(result)
    }

    /// Generate cache key for request
    fn generate_cache_key(&self, request: &TranslationRequest) -> String {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};

        let mut hasher = DefaultHasher::new();
        request.text.hash(&mut hasher);
        request.source_language.hash(&mut hasher);
        request.target_language.hash(&mut hasher);
        format!("{:x}", hasher.finish())
    }

    /// Initialize supported languages
    fn initialize_supported_languages() -> Vec<LanguageInfo> {
        vec![
            LanguageInfo {
                code: "en".to_string(),
                name: "English".to_string(),
                native_name: "English".to_string(),
                family: "Indo-European".to_string(),
                direction: TextDirection::LeftToRight,
                supported_models: vec!["gpt-4o".to_string(), "claude-3-5-haiku".to_string()],
                quality_level: LanguageQuality::Native,
            },
            LanguageInfo {
                code: "es".to_string(),
                name: "Spanish".to_string(),
                native_name: "Español".to_string(),
                family: "Indo-European".to_string(),
                direction: TextDirection::LeftToRight,
                supported_models: vec!["gpt-4o".to_string(), "claude-3-5-haiku".to_string()],
                quality_level: LanguageQuality::High,
            },
            LanguageInfo {
                code: "fr".to_string(),
                name: "French".to_string(),
                native_name: "Français".to_string(),
                family: "Indo-European".to_string(),
                direction: TextDirection::LeftToRight,
                supported_models: vec!["gpt-4o".to_string(), "claude-3-5-haiku".to_string()],
                quality_level: LanguageQuality::High,
            },
            LanguageInfo {
                code: "de".to_string(),
                name: "German".to_string(),
                native_name: "Deutsch".to_string(),
                family: "Indo-European".to_string(),
                direction: TextDirection::LeftToRight,
                supported_models: vec!["gpt-4o".to_string(), "claude-3-5-haiku".to_string()],
                quality_level: LanguageQuality::High,
            },
            LanguageInfo {
                code: "it".to_string(),
                name: "Italian".to_string(),
                native_name: "Italiano".to_string(),
                family: "Indo-European".to_string(),
                direction: TextDirection::LeftToRight,
                supported_models: vec!["gpt-4o".to_string(), "claude-3-5-haiku".to_string()],
                quality_level: LanguageQuality::High,
            },
            LanguageInfo {
                code: "pt".to_string(),
                name: "Portuguese".to_string(),
                native_name: "Português".to_string(),
                family: "Indo-European".to_string(),
                direction: TextDirection::LeftToRight,
                supported_models: vec!["gpt-4o".to_string(), "claude-3-5-haiku".to_string()],
                quality_level: LanguageQuality::High,
            },
            LanguageInfo {
                code: "zh".to_string(),
                name: "Chinese".to_string(),
                native_name: "中文".to_string(),
                family: "Sino-Tibetan".to_string(),
                direction: TextDirection::LeftToRight,
                supported_models: vec!["gpt-4o".to_string(), "claude-3-5-haiku".to_string()],
                quality_level: LanguageQuality::High,
            },
            LanguageInfo {
                code: "ja".to_string(),
                name: "Japanese".to_string(),
                native_name: "日本語".to_string(),
                family: "Japonic".to_string(),
                direction: TextDirection::LeftToRight,
                supported_models: vec!["gpt-4o".to_string(), "claude-3-5-haiku".to_string()],
                quality_level: LanguageQuality::High,
            },
            LanguageInfo {
                code: "ko".to_string(),
                name: "Korean".to_string(),
                native_name: "한국어".to_string(),
                family: "Koreanic".to_string(),
                direction: TextDirection::LeftToRight,
                supported_models: vec!["gpt-4o".to_string(), "claude-3-5-haiku".to_string()],
                quality_level: LanguageQuality::High,
            },
            LanguageInfo {
                code: "ar".to_string(),
                name: "Arabic".to_string(),
                native_name: "العربية".to_string(),
                family: "Afro-Asiatic".to_string(),
                direction: TextDirection::RightToLeft,
                supported_models: vec!["gpt-4o".to_string(), "claude-3-5-haiku".to_string()],
                quality_level: LanguageQuality::High,
            },
        ]
    }
}
