// AI ML API Integration Usage Examples
// Demonstrates how to use the implemented AI ML API integration layer

use std::collections::HashMap;
use serde_json::json;
use crate::integrations::ai_ml_api::*;

/// Example 1: Basic Text Enhancement with GPT-5 Pro
#[tokio::main]
async fn example_basic_text_enhancement() -> Result<(), AIMLError> {
    println!("=== Example 1: Basic Text Enhancement ===");
    
    // Create AI ML gateway
    let config = create_default_config();
    let gateway = AIMLAPIGateway::new(config).await?;
    gateway.initialize().await?;
    
    // Create enhanced text request
    let request = EnhancedTextRequest {
        id: "example-1".to_string(),
        text: "hey there! hows it goin? i was thinking we should maybe have a meetin about the project deadlines".to_string(),
        operations: vec![
            TextOperation::Enhance,
            TextOperation::ToneAdjust("professional".to_string()),
            TextOperation::GrammarCheck,
        ],
        source_language: Some("en".to_string()),
        target_language: Some("en".to_string()),
        context: EnhancedContext {
            user_intent: Some("business communication".to_string()),
            domain: Some("corporate".to_string()),
            audience: Some("colleagues".to_string()),
            purpose: Some("email".to_string()),
            constraints: vec!["professional tone".to_string(), "clear communication".to_string()],
            previous_messages: vec![],
            conversation_history: vec![],
            session_context: SessionContext {
                session_id: "session-123".to_string(),
                start_time: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
                interaction_count: 1,
                topic_transitions: vec![],
                current_focus: Some("project planning".to_string()),
                emotional_state: EmotionalState {
                    primary_emotion: "neutral".to_string(),
                    intensity: 0.5,
                    stability: 0.8,
                    trending: EmotionTrend::Stable,
                },
            },
            user_profile: UserProfile {
                language_preference: "en".to_string(),
                communication_style: CommunicationStyle::Professional,
                expertise_level: ExpertiseLevel::Advanced,
                cultural_background: Some("american".to_string()),
                accessibility_needs: vec![],
            },
        },
        options: EnhancedProcessingOptions {
            include_confidence_scores: true,
            include_suggestions: true,
            preserve_formatting: false,
            generate_alternatives: true,
            number_of_alternatives: 2,
            apply_multilingual_optimization: false,
            enable_real_time_processing: false,
        },
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
    };
    
    // Process the text
    match gateway.process_enhanced_text(request).await {
        AIMLResponse::Success(result) => {
            println!("Original: {}", result.original_text);
            println!("Enhanced: {}", result.processed_text);
            println!("Confidence: {:?}", result.confidence_scores);
            println!("Suggestions: {:?}", result.suggestions);
        },
        AIMLResponse::Partial(result, errors) => {
            println!("Partial success with errors: {:?}", errors);
            println!("Enhanced: {}", result.processed_text);
        },
        AIMLResponse::Failure(error) => {
            println!("Failed: {}", error);
        },
        AIMLResponse::Cached(result) => {
            println!("Cached result: {}", result.processed_text);
        }
    }
    
    Ok(())
}

/// Example 2: Voice Generation with Multiple Voices
#[tokio::main]
async fn example_voice_generation() -> Result<(), AIMLError> {
    println!("\n=== Example 2: Voice Generation ===");
    
    let config = create_default_config();
    let gateway = AIMLAPIGateway::new(config).await?;
    gateway.initialize().await?;
    
    // Create voice request with emotional variation
    let voice_request = EnhancedVoiceRequest {
        id: "voice-1".to_string(),
        text: "Welcome to VoiceFlow Pro! Your AI-powered productivity assistant is ready to help you achieve more.".to_string(),
        voice_config: VoiceConfiguration {
            model: "gpt-4o-mini-tts".to_string(),
            voice_id: Some("nova".to_string()),
            language_code: "en".to_string(),
            use_neural_voices: true,
            voice_characteristics: VoiceCharacteristics {
                speaking_rate: 1.0,
                pitch: 2.0,
                volume: 0.8,
                emphasis: 1.2,
                style: VoiceStyle::Assistant,
                emotion: VoiceEmotion::Friendly,
            },
            ssml_enabled: true,
        },
        language: "en".to_string(),
        emotion: Some("friendly".to_string()),
        speed: Some(1.0),
        pitch: Some(2.0),
        output_format: VoiceOutputFormat::MP3 { bitrate: Some(128) },
        post_processing: vec![
            VoicePostProcessing::NoiseReduction,
            VoicePostProcessing::AudioNormalization,
        ],
    };
    
    // Generate voice
    let voice_result = gateway.generate_enhanced_voice(voice_request).await?;
    
    println!("Voice generated successfully!");
    println!("Format: {:?}", voice_result.format);
    println!("Duration: {:.2} seconds", voice_result.duration_seconds);
    println!("Voice used: {}", voice_result.voice_used);
    println!("Quality score: {:.2}", voice_result.confidence_score);
    
    // Get available voices
    let generator = gateway.voice_generator.lock().await;
    let available_voices = generator.get_available_voices().await?;
    
    println!("Available voices: {}", available_voices.len());
    for voice in available_voices.iter().take(3) {
        println!("- {}: {} ({}, {})", voice.id, voice.name, voice.gender, voice.accent);
    }
    
    Ok(())
}

/// Example 3: Multilingual Translation with Context
#[tokio::main]
async fn example_multilingual_translation() -> Result<(), AIMLError> {
    println!("\n=== Example 3: Multilingual Translation ===");
    
    let config = create_default_config();
    let gateway = AIMLAPIGateway::new(config).await?;
    gateway.initialize().await?;
    
    // English to Spanish business translation
    let english_text = "Good morning team! I hope you're all doing well. I wanted to touch base regarding our upcoming project deadlines and discuss any challenges we might be facing.";
    
    let translation = gateway.translate_with_enhancement(
        english_text.to_string(),
        Some("en".to_string()),
        "es".to_string()
    ).await?;
    
    println!("Original (English): {}", english_text);
    println!("Translated (Spanish): {}", translation.translated_text);
    println!("Confidence: {:.2}", translation.confidence);
    println!("Quality scores:");
    println!("  - Fluency: {:.2}", translation.translation_quality.fluency_score);
    println!("  - Adequacy: {:.2}", translation.translation_quality.adequacy_score);
    println!("  - Cultural Fitness: {:.2}", translation.translation_quality.cultural_fitness_score);
    
    // Show cultural adaptations
    if !translation.cultural_adaptations.is_empty() {
        println!("Cultural adaptations made:");
        for adaptation in &translation.cultural_adaptations {
            println!("  - '{}' → '{}' ({})", 
                adaptation.original_term, 
                adaptation.adapted_term, 
                adaptation.reason);
        }
    }
    
    // Get supported languages
    let translator = gateway.translator.lock().await;
    let supported_languages = translator.get_supported_languages().await;
    
    println!("\nSupported languages: {}", supported_languages.len());
    for lang in supported_languages.iter().take(5) {
        println!("- {}: {} ({})", lang.code, lang.name, lang.native_name);
    }
    
    Ok(())
}

/// Example 4: Context-Aware Processing
#[tokio::main]
async fn example_context_aware_processing() -> Result<(), AIMLError> {
    println!("\n=== Example 4: Context-Aware Processing ===");
    
    let config = create_default_config();
    let gateway = AIMLAPIGateway::new(config).await?;
    gateway.initialize().await?;
    
    // Create context-aware request
    let context_request = ContextAwareRequest {
        id: "context-1".to_string(),
        text: "I'm having trouble with the new machine learning algorithm implementation. The accuracy is lower than expected and I'm not sure if it's the data preprocessing or the model architecture.".to_string(),
        context: EnhancedContext {
            user_intent: Some("technical problem solving".to_string()),
            domain: Some("machine learning".to_string()),
            audience: Some("technical team".to_string()),
            purpose: Some("seeking help".to_string()),
            constraints: vec!["technical accuracy".to_string(), "detailed explanation".to_string()],
            previous_messages: vec![],
            conversation_history: vec![],
            session_context: SessionContext {
                session_id: "tech-session-456".to_string(),
                start_time: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
                interaction_count: 3,
                topic_transitions: vec!["project setup".to_string(), "algorithm debugging".to_string()],
                current_focus: Some("ML optimization".to_string()),
                emotional_state: EmotionalState {
                    primary_emotion: "frustrated".to_string(),
                    intensity: 0.7,
                    stability: 0.6,
                    trending: EmotionTrend::Volatile,
                },
            },
            user_profile: UserProfile {
                language_preference: "en".to_string(),
                communication_style: CommunicationStyle::Technical,
                expertise_level: ExpertiseLevel::Advanced,
                cultural_background: Some("international".to_string()),
                accessibility_needs: vec![],
            },
        },
        requires_understanding: true,
        include_sentiment: true,
        include_intent: true,
        memory_retention: true,
    };
    
    // Process with context
    let context_result = gateway.process_context_aware(context_request).await?;
    
    println!("Processing completed in {}ms", context_result.processing_time_ms);
    println!("Primary topic: {}", context_result.understanding.primary_topic);
    println!("Complexity level: {:?}", context_result.understanding.complexity_level);
    println!("Sentiment: {} (confidence: {:.2})", 
        context_result.sentiment.overall_polarity, 
        context_result.sentiment.confidence);
    println!("Primary intent: {:?}", context_result.intent.primary_intent);
    println!("Conversation coherence: {:.2}", 
        context_result.context_insights.conversation_flow.coherence_level);
    
    // Show suggestions
    if !context_result.suggestions.is_empty() {
        println!("\nSuggestions:");
        for suggestion in &context_result.suggestions {
            println!("  - {}: {} (priority: {:?})", 
                suggestion.category, 
                suggestion.description, 
                suggestion.priority);
        }
    }
    
    Ok(())
}

/// Example 5: Health Monitoring and Error Handling
#[tokio::main]
async fn example_health_monitoring() -> Result<(), AIMLError> {
    println!("\n=== Example 5: Health Monitoring ===");
    
    let config = create_default_config();
    let gateway = AIMLAPIGateway::new(config).await?;
    gateway.initialize().await?;
    
    // Check health status
    let health_status = gateway.check_health().await;
    
    println!("Overall health: {}", if health_status.overall_healthy { "Healthy" } else { "Issues detected" });
    println!("Last check: {}", health_status.last_check);
    println!("Service status:");
    println!("  - Text enhancement: {}", if health_status.text_enhancement_healthy { "✓" } else { "✗" });
    println!("  - Voice generation: {}", if health_status.voice_generation_healthy { "✓" } else { "✗" });
    println!("  - Translation: {}", if health_status.translation_healthy { "✓" } else { "✗" });
    println!("  - Context processing: {}", if health_status.context_processing_healthy { "✓" } else { "✗" });
    
    // Show response times
    if !health_status.response_times.is_empty() {
        println!("\nResponse times:");
        for (service, time) in &health_status.response_times {
            println!("  - {}: {}ms", service, time);
        }
    }
    
    // Show error counts
    if !health_status.error_counts.is_empty() {
        println!("\nError counts:");
        for (service, count) in &health_status.error_counts {
            println!("  - {}: {}", service, count);
        }
    }
    
    // Get service statistics
    let text_enhancer = gateway.text_enhancer.lock().await;
    let voice_stats = gateway.voice_generator.lock().await.get_stats().await;
    let translation_stats = gateway.translator.lock().await.get_stats().await;
    
    println!("\nService statistics:");
    println!("Voice generations: {} (total duration: {:.1}s)", 
        voice_stats.total_generations, voice_stats.total_duration_seconds);
    println!("Total translations: {} (speed: {:.1} chars/sec)", 
        translation_stats.total_translations, translation_stats.translation_speed_chars_per_second);
    
    Ok(())
}

/// Example 6: Batch Processing
#[tokio::main]
async fn example_batch_processing() -> Result<(), AIMLError> {
    println!("\n=== Example 6: Batch Processing ===");
    
    let config = create_default_config();
    let gateway = AIMLAPIGateway::new(config).await?;
    gateway.initialize().await?;
    
    // Create multiple voice generation requests
    let voice_requests = vec![
        EnhancedVoiceRequest {
            id: "batch-1".to_string(),
            text: "First message: Welcome to our service!".to_string(),
            voice_config: VoiceConfiguration {
                model: "gpt-4o-mini-tts".to_string(),
                voice_id: Some("nova".to_string()),
                language_code: "en".to_string(),
                use_neural_voices: true,
                voice_characteristics: VoiceCharacteristics {
                    speaking_rate: 1.0,
                    pitch: 0.0,
                    volume: 0.8,
                    emphasis: 1.0,
                    style: VoiceStyle::Neutral,
                    emotion: VoiceEmotion::Neutral,
                },
                ssml_enabled: false,
            },
            language: "en".to_string(),
            emotion: None,
            speed: None,
            pitch: None,
            output_format: VoiceOutputFormat::MP3 { bitrate: Some(128) },
            post_processing: vec![],
        },
        EnhancedVoiceRequest {
            id: "batch-2".to_string(),
            text: "Second message: How can I help you today?".to_string(),
            voice_config: VoiceConfiguration {
                model: "gpt-4o-mini-tts".to_string(),
                voice_id: Some("alloy".to_string()),
                language_code: "en".to_string(),
                use_neural_voices: true,
                voice_characteristics: VoiceCharacteristics {
                    speaking_rate: 1.0,
                    pitch: 0.0,
                    volume: 0.8,
                    emphasis: 1.0,
                    style: VoiceStyle::Neutral,
                    emotion: VoiceEmotion::Neutral,
                },
                ssml_enabled: false,
            },
            language: "en".to_string(),
            emotion: None,
            speed: None,
            pitch: None,
            output_format: VoiceOutputFormat::MP3 { bitrate: Some(128) },
            post_processing: vec![],
        },
        EnhancedVoiceRequest {
            id: "batch-3".to_string(),
            text: "Third message: Thank you for using VoiceFlow Pro!".to_string(),
            voice_config: VoiceConfiguration {
                model: "gpt-4o-mini-tts".to_string(),
                voice_id: Some("echo".to_string()),
                language_code: "en".to_string(),
                use_neural_voices: true,
                voice_characteristics: VoiceCharacteristics {
                    speaking_rate: 1.0,
                    pitch: 0.0,
                    volume: 0.8,
                    emphasis: 1.0,
                    style: VoiceStyle::Neutral,
                    emotion: VoiceEmotion::Neutral,
                },
                ssml_enabled: false,
            },
            language: "en".to_string(),
            emotion: None,
            speed: None,
            pitch: None,
            output_format: VoiceOutputFormat::MP3 { bitrate: Some(128) },
            post_processing: vec![],
        },
    ];
    
    // Process batch
    let generator = gateway.voice_generator.lock().await;
    let batch_results = generator.batch_synthesize(voice_requests).await?;
    
    println!("Batch processing completed!");
    println!("Generated {} voice files:", batch_results.len());
    for (i, result) in batch_results.iter().enumerate() {
        println!("  {}. Duration: {:.2}s, Voice: {}, Quality: {:.2}", 
            i + 1, result.duration_seconds, result.voice_used, result.confidence_score);
    }
    
    Ok(())
}

/// Example 7: Error Handling and Fallbacks
#[tokio::main]
async fn example_error_handling() -> Result<(), AIMLError> {
    println!("\n=== Example 7: Error Handling ===");
    
    let config = create_default_config();
    let gateway = AIMLAPIGateway::new(config).await?;
    gateway.initialize().await?;
    
    // Example of handling different types of responses
    let test_cases = vec![
        ("Basic enhancement", "Hello world".to_string()),
        ("Complex processing", "This is a very long text that might require multiple processing steps and could potentially timeout if not handled properly. Let's see how the system handles this.".to_string()),
    ];
    
    for (case_name, text) in test_cases {
        println!("\nTesting: {}", case_name);
        
        let request = EnhancedTextRequest {
            id: format!("test-{}", case_name.replace(" ", "-")),
            text,
            operations: vec![TextOperation::Enhance],
            source_language: Some("en".to_string()),
            target_language: None,
            context: EnhancedContext {
                user_intent: None,
                domain: None,
                audience: None,
                purpose: None,
                constraints: vec![],
                previous_messages: vec![],
                conversation_history: vec![],
                session_context: SessionContext {
                    session_id: "test-session".to_string(),
                    start_time: std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)
                        .unwrap()
                        .as_secs(),
                    interaction_count: 1,
                    topic_transitions: vec![],
                    current_focus: None,
                    emotional_state: EmotionalState {
                        primary_emotion: "neutral".to_string(),
                        intensity: 0.5,
                        stability: 0.8,
                        trending: EmotionTrend::Stable,
                    },
                },
                user_profile: UserProfile {
                    language_preference: "en".to_string(),
                    communication_style: CommunicationStyle::Casual,
                    expertise_level: ExpertiseLevel::Intermediate,
                    cultural_background: None,
                    accessibility_needs: vec![],
                },
            },
            options: EnhancedProcessingOptions {
                include_confidence_scores: true,
                include_suggestions: false,
                preserve_formatting: true,
                generate_alternatives: false,
                number_of_alternatives: 1,
                apply_multilingual_optimization: false,
                enable_real_time_processing: false,
            },
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        };
        
        match gateway.process_enhanced_text(request).await {
            AIMLResponse::Success(result) => {
                println!("  ✓ Success: {}", result.processed_text);
            },
            AIMLResponse::Partial(result, errors) => {
                println!("  ⚠ Partial success: {} (errors: {:?})", 
                    result.processed_text, errors);
            },
            AIMLResponse::Failure(error) => {
                println!("  ✗ Failed: {}", error);
            },
            AIMLResponse::Cached(result) => {
                println!("  📦 Cached: {}", result.processed_text);
            }
        }
    }
    
    Ok(())
}

/// Main function to run all examples
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("VoiceFlow Pro AI ML API Integration Examples");
    println!("==========================================");
    
    // Set up logging
    env_logger::init();
    
    // Run all examples
    let examples = vec![
        ("Basic Text Enhancement", example_basic_text_enhancement),
        ("Voice Generation", example_voice_generation),
        ("Multilingual Translation", example_multilingual_translation),
        ("Context-Aware Processing", example_context_aware_processing),
        ("Health Monitoring", example_health_monitoring),
        ("Batch Processing", example_batch_processing),
        ("Error Handling", example_error_handling),
    ];
    
    for (name, example_fn) in examples {
        println!("\n{}", "=".repeat(60));
        match example_fn().await {
            Ok(_) => println!("✓ {} completed successfully", name),
            Err(e) => println!("✗ {} failed: {}", name, e),
        }
    }
    
    println!("\n{}", "=".repeat(60));
    println!("All examples completed!");
    
    Ok(())
}
