// Text Enhancement Service using GPT-5 Pro integration
// Provides advanced text processing and enhancement capabilities

use std::sync::Arc;
use tokio::sync::Mutex;
use uuid::Uuid;

use super::ai_ml_core::{AIMLClient, AIMLError, AIMLMessage, AIMLService};

/// Text Enhancement Service
#[derive(Debug)]
pub struct TextEnhancer {
    client: Arc<Mutex<AIMLClient>>,
    model: String,
    enhancement_cache: tokio::sync::Mutex<lru::LruCache<String, EnhancementResult>>,
}

/// Text enhancement request
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct EnhancementRequest {
    pub id: String,
    pub text: String,
    pub context: EnhancementContext,
    pub tone: String,
    pub options: EnhancementOptions,
}

/// Enhancement context
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct EnhancementContext {
    pub domain: String,
    pub audience: String,
    pub purpose: String,
    pub format: String,
    pub constraints: Vec<String>,
    pub examples: Vec<String>,
}

/// Enhancement options
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct EnhancementOptions {
    pub improve_clarity: bool,
    pub fix_grammar: bool,
    pub enhance_style: bool,
    pub adjust_tone: bool,
    pub remove_redundancy: bool,
    pub improve_readability: bool,
    pub preserve_meaning: bool,
    pub maintain_length: bool,
}

/// Enhancement result
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct EnhancementResult {
    pub id: String,
    pub original_text: String,
    pub enhanced_text: String,
    pub confidence_score: f32,
    pub improvements: Vec<EnhancementImprovement>,
    pub processing_time_ms: u64,
    pub tokens_used: u32,
}

/// Individual improvement made
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct EnhancementImprovement {
    pub category: ImprovementCategory,
    pub description: String,
    pub original: String,
    pub improved: String,
    pub impact_score: f32,
}

/// Improvement categories
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub enum ImprovementCategory {
    Grammar,
    Spelling,
    Clarity,
    Style,
    Tone,
    Readability,
    Conciseness,
    Flow,
    Structure,
    WordChoice,
}

/// Text summarization request/result
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct SummarizationRequest {
    pub id: String,
    pub text: String,
    pub max_length: Option<usize>,
    pub style: SummarizationStyle,
    pub include_key_points: bool,
    pub preserve_citations: bool,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub enum SummarizationStyle {
    Executive,
    Technical,
    Academic,
    Creative,
    BulletPoints,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct SummarizationResult {
    pub id: String,
    pub summary: String,
    pub key_points: Vec<String>,
    pub compression_ratio: f32,
    pub confidence_score: f32,
    pub estimated_reading_time_seconds: u32,
}

/// Text analysis request/result
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct TextAnalysisRequest {
    pub id: String,
    pub text: String,
    pub analysis_type: AnalysisType,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub enum AnalysisType {
    Comprehensive,
    Readability,
    Grammar,
    Sentiment,
    Structure,
    Language,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct TextAnalysis {
    pub id: String,
    pub text: String,
    pub readability_score: f32,
    pub complexity_level: ComplexityLevel,
    pub sentiment: SentimentAnalysis,
    pub language_detection: LanguageInfo,
    pub structure_analysis: StructureAnalysis,
    pub grammar_issues: Vec<GrammarIssue>,
    pub suggestions: Vec<TextSuggestion>,
    pub statistics: TextStatistics,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ComplexityLevel {
    pub level: String,
    pub score: f32,
    pub description: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct SentimentAnalysis {
    pub overall: String,
    pub confidence: f32,
    pub emotions: Vec<Emotion>,
    pub tone: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Emotion {
    pub name: String,
    pub intensity: f32,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct LanguageInfo {
    pub detected_language: String,
    pub confidence: f32,
    pub is_multilingual: bool,
    pub supported_languages: Vec<String>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct StructureAnalysis {
    pub paragraph_count: usize,
    pub sentence_count: usize,
    pub avg_sentence_length: f32,
    pub transitions: Vec<String>,
    pub coherence_score: f32,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct GrammarIssue {
    pub issue_type: String,
    pub description: String,
    pub position: usize,
    pub suggestion: String,
    pub confidence: f32,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct TextSuggestion {
    pub category: String,
    pub description: String,
    pub priority: u8,
    pub impact: String,
}

#[derive(Debug, Clone, serde::Serialize, serde:: Deserialize)]
pub struct TextStatistics {
    pub word_count: usize,
    pub character_count: usize,
    pub sentence_count: usize,
    pub paragraph_count: usize,
    pub avg_word_length: f32,
    pub unique_words: usize,
    pub estimated_reading_time_minutes: f32,
    pub complexity_metrics: ComplexityMetrics,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ComplexityMetrics {
    pub flesch_reading_ease: f32,
    pub flesch_kincaid_grade: f32,
    pub automated_readability_index: f32,
    pub gunning_fog: f32,
    pub smog_index: f32,
}

impl TextEnhancer {
    /// Create new text enhancer
    pub fn new(client: Arc<Mutex<AIMLClient>>, model: String) -> Self {
        Self {
            client,
            model,
            enhancement_cache: tokio::sync::Mutex::new(lru::LruCache::new(100)), // Cache 100 results
        }
    }

    /// Enhance text with AI assistance
    pub async fn enhance_text(&self, request: EnhancementRequest) -> Result<EnhancementResult, AIMLError> {
        let start_time = std::time::Instant::now();

        // Check cache first
        let cache_key = self.generate_cache_key(&request);
        if let Some(cached_result) = self.enhancement_cache.lock().await.get(&cache_key) {
            log::debug!("Returning cached enhancement result");
            return Ok(cached_result.clone());
        }

        // Prepare enhancement instructions
        let instructions = self.build_enhancement_instructions(&request);
        
        // Create system prompt
        let system_prompt = format!(
            "You are an expert text enhancement AI using GPT-5 Pro. Your role is to enhance text while preserving its original meaning and purpose.\n\n\
             Context: {}\n\
             Domain: {}\n\
             Audience: {}\n\
             Purpose: {}\n\
             Format: {}\n\n\
             Enhancement Instructions:\n{}\n\n\
             Always provide the enhanced text first, followed by a JSON analysis of improvements made.",
            request.context.domain,
            request.context.domain,
            request.context.audience,
            request.context.purpose,
            request.context.format,
            instructions
        );

        // Get AI client and send request
        let client = self.client.lock().await;
        let messages = vec![
            AIMLMessage {
                role: "system".to_string(),
                content: system_prompt,
            },
            AIMLMessage {
                role: "user".to_string(),
                content: request.text,
            },
        ];

        let response = client.chat_completion(super::ai_ml_core::AIMLRequest {
            model: self.model.clone(),
            messages,
            max_tokens: Some(2000),
            temperature: Some(0.3), // Lower temperature for consistent enhancements
            stream: Some(false),
            top_p: Some(0.9),
            frequency_penalty: Some(0.1),
            presence_penalty: Some(0.1),
            stop: None,
        }).await?;

        let processing_time = start_time.elapsed().as_millis();
        
        if let Some(choice) = response.choices.first() {
            let content = &choice.message.content;
            
            // Parse response to extract enhanced text and improvements
            let (enhanced_text, improvements) = self.parse_enhancement_response(content)?;
            
            let result = EnhancementResult {
                id: request.id,
                original_text: request.text,
                enhanced_text,
                confidence_score: self.calculate_confidence_score(&improvements),
                improvements,
                processing_time_ms: processing_time,
                tokens_used: response.usage.map(|u| u.total_tokens).unwrap_or(0),
            };

            // Cache the result
            let cache_key = self.generate_cache_key(&request);
            self.enhancement_cache.lock().await.put(cache_key, result.clone());

            Ok(result)
        } else {
            Err(AIMLError::ServiceUnavailable("No enhancement response received".to_string()))
        }
    }

    /// Summarize text using AI
    pub async fn summarize_text(&self, text: String) -> Result<SummarizationResult, AIMLError> {
        let start_time = std::time::Instant::now();
        
        let client = self.client.lock().await;
        let messages = vec![
            AIMLMessage {
                role: "system".to_string(),
                content: "You are an expert summarizer. Create a concise, informative summary that captures the main points and key details. Format the summary clearly and include bullet points for key insights.",
            },
            AIMLMessage {
                role: "user".to_string(),
                content: format!("Please summarize the following text:\n\n{}", text),
            },
        ];

        let response = client.chat_completion(super::ai_ml_core::AIMLRequest {
            model: self.model.clone(),
            messages,
            max_tokens: Some(800),
            temperature: Some(0.4),
            stream: Some(false),
            top_p: Some(0.9),
            frequency_penalty: Some(0.0),
            presence_penalty: Some(0.0),
            stop: None,
        }).await?;

        let processing_time = start_time.elapsed().as_millis();
        
        if let Some(choice) = response.choices.first() {
            let summary = choice.message.content.clone();
            let key_points = self.extract_key_points(&summary);
            
            Ok(SummarizationResult {
                id: Uuid::new_v4().to_string(),
                summary,
                key_points,
                compression_ratio: 1.0 - (summary.len() as f32 / text.len() as f32),
                confidence_score: 0.85,
                estimated_reading_time_seconds: (summary.len() / 200) as u32, // Assuming 200 chars per minute
            })
        } else {
            Err(AIMLError::ServiceUnavailable("No summary response received".to_string()))
        }
    }

    /// Analyze text comprehensively
    pub async fn analyze_text(&self, text: String) -> Result<TextAnalysis, AIMLError> {
        let start_time = std::time::Instant::now();
        
        let client = self.client.lock().await;
        let messages = vec![
            AIMLMessage {
                role: "system".to_string(),
                content: "You are a text analysis expert. Analyze the given text and provide detailed insights about readability, grammar, structure, sentiment, and suggestions for improvement. Return your analysis in a structured JSON format.",
            },
            AIMLMessage {
                role: "user".to_string(),
                content: format!("Analyze this text:\n\n{}", text),
            },
        ];

        let response = client.chat_completion(super::ai_ml_core::AIMLRequest {
            model: self.model.clone(),
            messages,
            max_tokens: Some(1500),
            temperature: Some(0.2),
            stream: Some(false),
            top_p: Some(0.9),
            frequency_penalty: Some(0.0),
            presence_penalty: Some(0.0),
            stop: None,
        }).await?;

        let processing_time = start_time.elapsed().as_millis();
        
        if let Some(choice) = response.choices.first() {
            let analysis_text = &choice.message.content;
            
            // Try to parse as structured analysis, fallback to basic analysis
            match self.parse_text_analysis(analysis_text, &text) {
                Ok(analysis) => Ok(analysis),
                Err(_) => {
                    // Fallback to basic statistical analysis
                    Ok(self.basic_text_analysis(text, processing_time))
                }
            }
        } else {
            Err(AIMLError::ServiceUnavailable("No analysis response received".to_string()))
        }
    }

    /// Rewrite text with different style/tone
    pub async fn rewrite_text(&self, request: EnhancementRequest) -> Result<EnhancementResult, AIMLError> {
        // Similar to enhance_text but with rewrite focus
        let rewrite_request = EnhancementRequest {
            id: request.id,
            text: request.text,
            context: request.context,
            tone: request.tone,
            options: EnhancementOptions {
                improve_clarity: true,
                fix_grammar: true,
                enhance_style: true,
                adjust_tone: true,
                remove_redundancy: true,
                improve_readability: true,
                preserve_meaning: true,
                maintain_length: false, // Allow length changes for rewriting
            },
        };

        self.enhance_text(rewrite_request).await
    }

    /// Adjust tone of text
    pub async fn adjust_tone(&self, request: EnhancementRequest) -> Result<EnhancementResult, AIMLError> {
        let tone_request = EnhancementRequest {
            id: request.id,
            text: request.text,
            context: request.context,
            tone: request.tone,
            options: EnhancementOptions {
                improve_clarity: true,
                fix_grammar: true,
                enhance_style: true,
                adjust_tone: true,
                remove_redundancy: false,
                improve_readability: true,
                preserve_meaning: true,
                maintain_length: true,
            },
        };

        self.enhance_text(tone_request).await
    }

    /// Check grammar only
    pub async fn check_grammar(&self, text: String) -> Result<EnhancementResult, AIMLError> {
        let grammar_request = EnhancementRequest {
            id: Uuid::new_v4().to_string(),
            text,
            context: EnhancementContext {
                domain: "general".to_string(),
                audience: "general".to_string(),
                purpose: "communication".to_string(),
                format: "text".to_string(),
                constraints: vec![],
                examples: vec![],
            },
            tone: "neutral".to_string(),
            options: EnhancementOptions {
                improve_clarity: false,
                fix_grammar: true,
                enhance_style: false,
                adjust_tone: false,
                remove_redundancy: false,
                improve_readability: false,
                preserve_meaning: true,
                maintain_length: true,
            },
        };

        self.enhance_text(grammar_request).await
    }

    /// Improve writing style
    pub async fn improve_style(&self, request: EnhancementRequest) -> Result<EnhancementResult, AIMLError> {
        let style_request = EnhancementRequest {
            id: request.id,
            text: request.text,
            context: request.context,
            tone: request.tone,
            options: EnhancementOptions {
                improve_clarity: true,
                fix_grammar: true,
                enhance_style: true,
                adjust_tone: false,
                remove_redundancy: true,
                improve_readability: true,
                preserve_meaning: true,
                maintain_length: false,
            },
        };

        self.enhance_text(style_request).await
    }

    /// Check service health
    pub async fn health_check(&self) -> Result<bool, AIMLError> {
        let client = self.client.lock().await;
        client.health_check().await
    }

    /// Build enhancement instructions based on options
    fn build_enhancement_instructions(&self, request: &EnhancementRequest) -> String {
        let mut instructions = Vec::new();

        if request.options.improve_clarity {
            instructions.push("• Improve clarity by rephrasing complex sentences and eliminating ambiguity");
        }
        if request.options.fix_grammar {
            instructions.push("• Fix grammar, punctuation, and spelling errors");
        }
        if request.options.enhance_style {
            instructions.push("• Enhance writing style to be more engaging and professional");
        }
        if request.options.adjust_tone {
            instructions.push(&format!("• Adjust tone to be more {}", request.tone));
        }
        if request.options.remove_redundancy {
            instructions.push("• Remove redundant and repetitive content");
        }
        if request.options.improve_readability {
            instructions.push("• Improve readability through better sentence structure and word choice");
        }
        if request.options.preserve_meaning {
            instructions.push("• Preserve the original meaning and intent");
        }

        if request.context.constraints.len() > 0 {
            instructions.push(&format!("• Respect these constraints: {}", request.context.constraints.join(", ")));
        }

        instructions.join("\n")
    }

    /// Parse enhancement response from AI
    fn parse_enhancement_response(&self, response: &str) -> Result<(String, Vec<EnhancementImprovement>), AIMLError> {
        // Simple parsing - split on common delimiters
        let parts: Vec<&str> = response.split("\n\n").collect();
        
        let enhanced_text = if !parts.is_empty() {
            parts[0].to_string()
        } else {
            response.to_string()
        };

        // Create basic improvement entries (in a real implementation, you'd parse structured data)
        let improvements = vec![
            EnhancementImprovement {
                category: ImprovementCategory::Grammar,
                description: "Applied grammar corrections".to_string(),
                original: "N/A".to_string(),
                improved: "Applied".to_string(),
                impact_score: 0.8,
            }
        ];

        Ok((enhanced_text, improvements))
    }

    /// Calculate confidence score based on improvements
    fn calculate_confidence_score(&self, improvements: &[EnhancementImprovement]) -> f32 {
        if improvements.is_empty() {
            return 0.5;
        }

        let avg_impact: f32 = improvements.iter()
            .map(|imp| imp.impact_score)
            .sum::<f32>() / improvements.len() as f32;

        (avg_impact + 0.2).min(1.0) // Boost confidence slightly
    }

    /// Generate cache key for request
    fn generate_cache_key(&self, request: &EnhancementRequest) -> String {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};

        let mut hasher = DefaultHasher::new();
        request.text.hash(&mut hasher);
        request.context.domain.hash(&mut hasher);
        request.tone.hash(&mut hasher);
        format!("{:x}", hasher.finish())
    }

    /// Extract key points from summary
    fn extract_key_points(&self, summary: &str) -> Vec<String> {
        // Simple heuristic extraction - in real implementation, use NLP
        summary.lines()
            .filter(|line| line.trim().starts_with("•") || line.trim().starts_with("-"))
            .map(|line| line.trim().to_string())
            .collect()
    }

    /// Parse text analysis from AI response
    fn parse_text_analysis(&self, response: &str, original_text: &str) -> Result<TextAnalysis, AIMLError> {
        // Try to parse as JSON, fallback to basic analysis
        match serde_json::from_str::<serde_json::Value>(response) {
            Ok(json_value) => {
                // Extract values from JSON and build TextAnalysis
                // This is a simplified implementation
                Ok(self.basic_text_analysis(original_text.to_string(), 100))
            }
            Err(_) => {
                Ok(self.basic_text_analysis(original_text.to_string(), 100))
            }
        }
    }

    /// Basic text analysis when AI parsing fails
    fn basic_text_analysis(&self, text: String, processing_time_ms: u64) -> TextAnalysis {
        let word_count = text.split_whitespace().count();
        let char_count = text.len();
        let sentence_count = text.matches('.').count() + text.matches('!').count() + text.matches('?').count();
        let paragraph_count = text.split("\n\n").count();
        let avg_word_length = text.split_whitespace().map(|w| w.len()).sum::<usize>() as f32 / word_count.max(1) as f32;
        let avg_sentence_length = word_count as f32 / sentence_count.max(1) as f32;
        let unique_words = text.split_whitespace().collect::<std::collections::HashSet<_>>().len();

        TextAnalysis {
            id: Uuid::new_v4().to_string(),
            text,
            readability_score: self.calculate_readability_score(avg_sentence_length, avg_word_length),
            complexity_level: ComplexityLevel {
                level: if avg_sentence_length > 20.0 { "Complex" } else if avg_sentence_length > 15.0 { "Medium" } else { "Simple" }.to_string(),
                score: 0.5,
                description: "Based on sentence and word length analysis".to_string(),
            },
            sentiment: SentimentAnalysis {
                overall: "neutral".to_string(),
                confidence: 0.5,
                emotions: vec![],
                tone: "neutral".to_string(),
            },
            language_detection: LanguageInfo {
                detected_language: "en".to_string(),
                confidence: 0.9,
                is_multilingual: false,
                supported_languages: vec!["en".to_string()],
            },
            structure_analysis: StructureAnalysis {
                paragraph_count,
                sentence_count,
                avg_sentence_length,
                transitions: vec![],
                coherence_score: 0.7,
            },
            grammar_issues: vec![],
            suggestions: vec![],
            statistics: TextStatistics {
                word_count,
                character_count,
                sentence_count,
                paragraph_count,
                avg_word_length,
                unique_words,
                estimated_reading_time_minutes: word_count as f32 / 200.0, // 200 WPM average
                complexity_metrics: ComplexityMetrics {
                    flesch_reading_ease: self.calculate_readability_score(avg_sentence_length, avg_word_length),
                    flesch_kincaid_grade: (avg_sentence_length * 0.39 + avg_word_length * 11.8) / 15.0,
                    automated_readability_index: (avg_sentence_length + avg_word_length) / 2.0,
                    gunning_fog: (avg_sentence_length * 0.4) + 2.0,
                    smog_index: avg_sentence_length * 0.3,
                },
            },
        }
    }

    /// Calculate basic readability score
    fn calculate_readability_score(&self, avg_sentence_length: f32, avg_word_length: f32) -> f32 {
        // Simplified Flesch Reading Ease calculation
        let score = 206.835 - (1.015 * avg_sentence_length) - (84.6 * avg_word_length / 100.0);
        (score / 206.835).max(0.0).min(1.0) * 100.0
    }
}
