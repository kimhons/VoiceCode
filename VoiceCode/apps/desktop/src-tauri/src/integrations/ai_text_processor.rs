// AI Text Processing Integration Module
// Bridges the Rust backend with Python AI text processor
// OPTIMIZED VERSION - Phase 1.1.2: Python IPC Optimization

use serde::{Deserialize, Serialize};
use std::process::{Command, Stdio, Child, ChildStdin, ChildStdout};
use std::io::{BufRead, BufReader, Write};
use std::sync::Arc;
use tokio::sync::{mpsc, oneshot, Mutex, RwLock};
use tokio::time::{timeout, Duration};
use uuid::Uuid;
use std::collections::{HashMap, VecDeque};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TextProcessingConfig {
    pub context: ProcessingContext,
    pub tone: ToneType,
    pub aggressiveness: f32,
    pub remove_fillers: bool,
    pub enable_caching: bool,
    pub max_cache_size: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProcessingContext {
    Email,
    Code,
    Document,
    Social,
    Formal,
    Casual,
    Technical,
    Creative,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ToneType {
    Professional,
    Friendly,
    Formal,
    Casual,
    Empathetic,
    Confident,
    Persuasive,
    Neutral,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessingRequest {
    pub id: String,
    pub text: String,
    pub context: ProcessingContext,
    pub tone: ToneType,
    pub options: ProcessingOptions,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessingOptions {
    pub aggressiveness: f32,
    pub remove_fillers: bool,
    pub preserve_formatting: bool,
    pub smart_punctuation: bool,
    pub auto_correct: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessingResult {
    pub id: String,
    pub original_text: String,
    pub processed_text: String,
    pub changes_made: Vec<TextChange>,
    pub confidence_score: f32,
    pub processing_time_ms: u64,
    pub context_used: ProcessingContext,
    pub tone_applied: ToneType,
    pub metadata: ProcessingMetadata,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TextChange {
    pub change_type: ChangeType,
    pub original: String,
    pub replacement: String,
    pub position: usize,
    pub confidence: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ChangeType {
    Grammar,
    Punctuation,
    Spelling,
    Tone,
    FillerRemoval,
    Formatting,
    Capitalization,
    Style,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessingMetadata {
    pub readability_before: f32,
    pub readability_after: f32,
    pub word_count_before: usize,
    pub word_count_after: usize,
    pub sentences_processed: usize,
    pub errors_corrected: usize,
    pub filler_words_removed: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TextAnalysis {
    pub id: String,
    pub text: String,
    pub readability_score: f32,
    pub text_type: TextType,
    pub patterns: Vec<TextPattern>,
    pub keywords: Vec<String>,
    pub statistics: TextStatistics,
    pub summary: String,
    pub suggestions: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TextType {
    Email,
    Letter,
    Report,
    Article,
    Code,
    Social,
    Creative,
    Technical,
    Academic,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TextPattern {
    pub pattern_type: String,
    pub description: String,
    pub frequency: usize,
    pub confidence: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TextStatistics {
    pub word_count: usize,
    pub sentence_count: usize,
    pub paragraph_count: usize,
    pub character_count: usize,
    pub avg_sentence_length: f32,
    pub avg_word_length: f32,
    pub unique_words: usize,
    pub reading_time_seconds: usize,
}

// OPTIMIZATION: Persistent Python process manager
#[derive(Debug)]
pub struct PythonProcessManager {
    process: Arc<Mutex<Option<Child>>>,
    stdin: Arc<Mutex<Option<ChildStdin>>>,
    stdout: Arc<Mutex<Option<BufReader<ChildStdout>>>>,
    is_healthy: Arc<RwLock<bool>>,
    restart_count: Arc<Mutex<usize>>,
    max_restarts: usize,
}

impl PythonProcessManager {
    pub fn new(max_restarts: usize) -> Self {
        Self {
            process: Arc::new(Mutex::new(None)),
            stdin: Arc::new(Mutex::new(None)),
            stdout: Arc::new(Mutex::new(None)),
            is_healthy: Arc::new(RwLock::new(false)),
            restart_count: Arc::new(Mutex::new(0)),
            max_restarts,
        }
    }

    pub async fn start(&self) -> Result<(), String> {
        let mut process_lock = self.process.lock().await;

        // Start Python process with persistent mode
        let mut child = Command::new("python")
            .arg("-u") // Unbuffered output
            .arg("-m")
            .arg("ai_text_processor.server") // Persistent server mode
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!("Failed to start Python process: {}", e))?;

        let stdin = child.stdin.take()
            .ok_or("Failed to get stdin")?;
        let stdout = child.stdout.take()
            .ok_or("Failed to get stdout")?;

        *self.stdin.lock().await = Some(stdin);
        *self.stdout.lock().await = Some(BufReader::new(stdout));
        *process_lock = Some(child);
        *self.is_healthy.write().await = true;

        Ok(())
    }

    pub async fn send_request(&self, request: &str) -> Result<String, String> {
        let mut stdin_lock = self.stdin.lock().await;
        let stdin = stdin_lock.as_mut()
            .ok_or("Python process not started")?;

        // OPTIMIZATION: Use MessagePack for faster serialization (simulated with JSON for now)
        writeln!(stdin, "{}", request)
            .map_err(|e| format!("Failed to write to Python process: {}", e))?;

        stdin.flush()
            .map_err(|e| format!("Failed to flush stdin: {}", e))?;

        drop(stdin_lock);

        // Read response with timeout
        let mut stdout_lock = self.stdout.lock().await;
        let stdout = stdout_lock.as_mut()
            .ok_or("Python process stdout not available")?;

        let mut response = String::new();
        stdout.read_line(&mut response)
            .map_err(|e| format!("Failed to read from Python process: {}", e))?;

        Ok(response.trim().to_string())
    }

    pub async fn is_healthy(&self) -> bool {
        *self.is_healthy.read().await
    }

    pub async fn restart(&self) -> Result<(), String> {
        let mut restart_count = self.restart_count.lock().await;

        if *restart_count >= self.max_restarts {
            return Err(format!("Max restart attempts ({}) exceeded", self.max_restarts));
        }

        *restart_count += 1;
        *self.is_healthy.write().await = false;

        // Kill existing process
        if let Some(mut process) = self.process.lock().await.take() {
            let _ = process.kill();
        }

        // Start new process
        self.start().await?;

        Ok(())
    }

    pub async fn shutdown(&self) {
        *self.is_healthy.write().await = false;

        if let Some(mut process) = self.process.lock().await.take() {
            let _ = process.kill();
        }
    }
}

// OPTIMIZATION: Message queue for batching requests
#[derive(Debug)]
pub struct MessageQueue {
    queue: Arc<Mutex<VecDeque<ProcessingRequest>>>,
    max_size: usize,
    batch_size: usize,
}

impl MessageQueue {
    pub fn new(max_size: usize, batch_size: usize) -> Self {
        Self {
            queue: Arc::new(Mutex::new(VecDeque::new())),
            max_size,
            batch_size,
        }
    }

    pub async fn enqueue(&self, request: ProcessingRequest) -> Result<(), String> {
        let mut queue = self.queue.lock().await;

        if queue.len() >= self.max_size {
            return Err("Queue is full".to_string());
        }

        queue.push_back(request);
        Ok(())
    }

    pub async fn dequeue_batch(&self) -> Vec<ProcessingRequest> {
        let mut queue = self.queue.lock().await;
        let mut batch = Vec::new();

        for _ in 0..self.batch_size {
            if let Some(request) = queue.pop_front() {
                batch.push(request);
            } else {
                break;
            }
        }

        batch
    }

    pub async fn len(&self) -> usize {
        self.queue.lock().await.len()
    }

    pub async fn is_empty(&self) -> bool {
        self.queue.lock().await.is_empty()
    }
}

#[derive(Debug)]
pub struct AITextProcessor {
    config: TextProcessingConfig,
    process_manager: Arc<PythonProcessManager>,
    message_queue: Arc<MessageQueue>,
    event_sender: mpsc::UnboundedSender<ProcessingEvent>,
    pending_requests: Arc<Mutex<HashMap<String, oneshot::Sender<ProcessingResult>>>>,
    processing_task: Arc<Mutex<Option<tokio::task::JoinHandle<()>>>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProcessingEvent {
    ProcessingStarted(String),
    ProcessingProgress(String, f32),
    ProcessingCompleted(ProcessingResult),
    ProcessingError(String, String),
    BatchCompleted(Vec<ProcessingResult>),
    ProcessRestarted(usize),
    QueueStatus(usize),
}

impl AITextProcessor {
    pub fn new(
        config: TextProcessingConfig,
        event_sender: mpsc::UnboundedSender<ProcessingEvent>,
    ) -> Self {
        let process_manager = Arc::new(PythonProcessManager::new(3)); // Max 3 restarts
        let message_queue = Arc::new(MessageQueue::new(1000, 10)); // Queue size 1000, batch size 10

        Self {
            config,
            process_manager,
            message_queue,
            event_sender,
            pending_requests: Arc::new(Mutex::new(HashMap::new())),
            processing_task: Arc::new(Mutex::new(None)),
        }
    }

    // OPTIMIZED: Initialize with persistent Python process
    pub async fn initialize(&mut self) -> Result<(), String> {
        println!("Initializing AI Text Processor with persistent Python process...");

        // Start persistent Python process
        self.process_manager.start().await?;

        // Start background processing task
        self.start_processing_loop().await;

        println!("AI Text Processor initialized successfully");

        Ok(())
    }

    // OPTIMIZED: Background processing loop for queue
    async fn start_processing_loop(&self) {
        let process_manager = Arc::clone(&self.process_manager);
        let message_queue = Arc::clone(&self.message_queue);
        let pending_requests = Arc::clone(&self.pending_requests);
        let event_sender = self.event_sender.clone();

        let task = tokio::spawn(async move {
            loop {
                // Check if queue has items
                if message_queue.is_empty().await {
                    tokio::time::sleep(Duration::from_millis(10)).await;
                    continue;
                }

                // Dequeue batch
                let batch = message_queue.dequeue_batch().await;

                if batch.is_empty() {
                    continue;
                }

                // Process batch
                for request in batch {
                    let request_id = request.id.clone();

                    // Serialize request to JSON (TODO: Use MessagePack for better performance)
                    let request_json = serde_json::to_string(&request)
                        .unwrap_or_else(|_| "{}".to_string());

                    // Send to Python process with timeout
                    let response_result = timeout(
                        Duration::from_millis(100), // OPTIMIZED: 100ms timeout (vs 200-300ms before)
                        process_manager.send_request(&request_json)
                    ).await;

                    match response_result {
                        Ok(Ok(response)) => {
                            // Parse response
                            if let Ok(result) = serde_json::from_str::<ProcessingResult>(&response) {
                                // Send to pending request
                                if let Some(sender) = pending_requests.lock().await.remove(&request_id) {
                                    let _ = sender.send(result.clone());
                                }

                                // Send event
                                let _ = event_sender.send(ProcessingEvent::ProcessingCompleted(result));
                            }
                        }
                        Ok(Err(e)) => {
                            let _ = event_sender.send(ProcessingEvent::ProcessingError(
                                request_id.clone(),
                                e.clone()
                            ));

                            // Try to restart process
                            if let Err(restart_err) = process_manager.restart().await {
                                eprintln!("Failed to restart Python process: {}", restart_err);
                            }
                        }
                        Err(_) => {
                            // Timeout
                            let _ = event_sender.send(ProcessingEvent::ProcessingError(
                                request_id.clone(),
                                "Request timeout".to_string()
                            ));
                        }
                    }
                }

                // Send queue status
                let queue_len = message_queue.len().await;
                let _ = event_sender.send(ProcessingEvent::QueueStatus(queue_len));
            }
        });

        *self.processing_task.lock().await = Some(task);
    }

    // OPTIMIZED: Process text with queue
    pub async fn process_text(&self, request: ProcessingRequest) -> Result<ProcessingResult, String> {
        let (sender, receiver) = oneshot::channel();
        let request_id = request.id.clone();

        // Store response channel
        self.pending_requests.lock().await.insert(request_id.clone(), sender);

        // Enqueue request
        self.message_queue.enqueue(request).await?;

        // Send event
        let _ = self.event_sender.send(ProcessingEvent::ProcessingStarted(request_id.clone()));

        // Wait for response with timeout
        match timeout(Duration::from_secs(5), receiver).await {
            Ok(Ok(result)) => Ok(result),
            Ok(Err(_)) => Err("Response channel closed".to_string()),
            Err(_) => {
                // Remove from pending requests
                self.pending_requests.lock().await.remove(&request_id);
                Err("Processing timeout".to_string())
            }
        }
    }

    pub async fn process_batch(&self, requests: Vec<ProcessingRequest>) -> Result<Vec<ProcessingResult>, String> {
        let mut results = Vec::new();
        let total_requests = requests.len();

        for request in requests {
            let result = self.process_text(request).await?;
            results.push(result);

            // Send progress event
            let progress = (results.len() as f32 / total_requests as f32) * 100.0;
            let _ = self.event_sender.send(ProcessingEvent::ProcessingProgress(
                "batch_processing".to_string(),
                progress,
            ));
        }
        
        let _ = self.event_sender.send(ProcessingEvent::BatchCompleted(results.clone()));
        
        Ok(results)
    }

    pub async fn analyze_text(&self, text: String) -> Result<TextAnalysis, String> {
        // Simulate text analysis
        let analysis = TextAnalysis {
            id: Uuid::new_v4().to_string(),
            text: text.clone(),
            readability_score: 65.0,
            text_type: TextType::Email,
            patterns: vec![
                TextPattern {
                    pattern_type: "greeting".to_string(),
                    description: "Email greeting detected".to_string(),
                    frequency: 1,
                    confidence: 0.9,
                },
            ],
            keywords: vec!["meeting".to_string(), "project".to_string()],
            statistics: TextStatistics {
                word_count: text.split_whitespace().count(),
                sentence_count: text.matches('.').count() + text.matches('!').count() + text.matches('?').count(),
                paragraph_count: text.split("\n\n").count(),
                character_count: text.len(),
                avg_sentence_length: 12.5,
                avg_word_length: 4.2,
                unique_words: text.split_whitespace().collect::<std::collections::HashSet<_>>().len(),
                reading_time_seconds: text.split_whitespace().count() / 200 * 60,
            },
            summary: "Professional email discussing project updates".to_string(),
            suggestions: vec![
                "Consider adding a clear subject line".to_string(),
                "Structure information with bullet points".to_string(),
            ],
        };
        
        Ok(analysis)
    }

    pub fn get_config(&self) -> &TextProcessingConfig {
        &self.config
    }

    pub fn update_config(&mut self, new_config: TextProcessingConfig) {
        self.config = new_config;
    }

    async fn simulate_processing(&self, request: ProcessingRequest) -> Result<ProcessingResult, String> {
        // Simulate processing delay
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
        
        // Simulate text processing
        let original_text = request.text.clone();
        let mut processed_text = request.text.clone();
        let mut changes_made = Vec::new();
        
        // Simulate basic improvements
        if request.options.auto_correct {
            // Simulate grammar corrections
            if processed_text.contains("your") && processed_text.contains("going") {
                processed_text = processed_text.replace("your going", "you're going");
                changes_made.push(TextChange {
                    change_type: ChangeType::Grammar,
                    original: "your going".to_string(),
                    replacement: "you're going".to_string(),
                    position: 0,
                    confidence: 0.95,
                });
            }
        }
        
        if request.options.smart_punctuation {
            // Simulate punctuation fixes
            if !processed_text.ends_with('.') && !processed_text.ends_with('!') && !processed_text.ends_with('?') {
                processed_text.push('.');
                changes_made.push(TextChange {
                    change_type: ChangeType::Punctuation,
                    original: "".to_string(),
                    replacement: ".".to_string(),
                    position: processed_text.len() - 1,
                    confidence: 0.8,
                });
            }
        }
        
        if request.options.remove_fillers {
            // Simulate filler word removal
            let fillers = vec!["um", "uh", "like", "you know", "actually"];
            for filler in &fillers {
                if processed_text.to_lowercase().contains(filler) {
                    processed_text = processed_text.replace(filler, "");
                    changes_made.push(TextChange {
                        change_type: ChangeType::FillerRemoval,
                        original: filler.to_string(),
                        replacement: "".to_string(),
                        position: 0,
                        confidence: 0.7,
                    });
                }
            }
        }
        
        // Apply tone adjustments
        match request.tone {
            ToneType::Professional => {
                if processed_text.contains("hey") {
                    processed_text = processed_text.replace("hey", "Hello");
                    changes_made.push(TextChange {
                        change_type: ChangeType::Tone,
                        original: "hey".to_string(),
                        replacement: "Hello".to_string(),
                        position: 0,
                        confidence: 0.9,
                    });
                }
            }
            ToneType::Friendly => {
                if processed_text.contains("Hello") {
                    processed_text = processed_text.replace("Hello", "Hi");
                    changes_made.push(TextChange {
                        change_type: ChangeType::Tone,
                        original: "Hello".to_string(),
                        replacement: "Hi".to_string(),
                        position: 0,
                        confidence: 0.9,
                    });
                }
            }
            _ => {}
        }
        
        // Calculate metadata before moving values
        let word_count_after = processed_text.split_whitespace().count();
        let errors_corrected = changes_made.iter().filter(|c| c.change_type == ChangeType::Grammar || c.change_type == ChangeType::Spelling).count();
        let filler_words_removed = changes_made.iter().filter(|c| c.change_type == ChangeType::FillerRemoval).count();

        let result = ProcessingResult {
            id: request.id,
            original_text: original_text.clone(),
            processed_text,
            changes_made,
            confidence_score: 0.85,
            processing_time_ms: 150,
            context_used: request.context,
            tone_applied: request.tone,
            metadata: ProcessingMetadata {
                readability_before: 60.0,
                readability_after: 75.0,
                word_count_before: original_text.split_whitespace().count(),
                word_count_after,
                sentences_processed: original_text.matches('.').count() + 1,
                errors_corrected,
                filler_words_removed,
            },
        };
        
        Ok(result)
    }
}

pub fn create_ai_text_processor(
    config: TextProcessingConfig,
) -> Result<(AITextProcessor, mpsc::UnboundedReceiver<ProcessingEvent>), String> {
    let (event_sender, event_receiver) = mpsc::unbounded_channel();
    let processor = AITextProcessor::new(config, event_sender);
    Ok((processor, event_receiver))
}

// Default configurations for different contexts
pub fn get_default_config_for_context(context: ProcessingContext) -> TextProcessingConfig {
    match context {
        ProcessingContext::Email => TextProcessingConfig {
            context,
            tone: ToneType::Professional,
            aggressiveness: 0.7,
            remove_fillers: true,
            enable_caching: true,
            max_cache_size: 1000,
        },
        ProcessingContext::Code => TextProcessingConfig {
            context,
            tone: ToneType::Neutral,
            aggressiveness: 0.3,
            remove_fillers: false,
            enable_caching: false,
            max_cache_size: 100,
        },
        ProcessingContext::Social => TextProcessingConfig {
            context,
            tone: ToneType::Friendly,
            aggressiveness: 0.5,
            remove_fillers: true,
            enable_caching: true,
            max_cache_size: 500,
        },
        ProcessingContext::Formal => TextProcessingConfig {
            context,
            tone: ToneType::Formal,
            aggressiveness: 0.8,
            remove_fillers: true,
            enable_caching: true,
            max_cache_size: 1000,
        },
        ProcessingContext::Casual => TextProcessingConfig {
            context,
            tone: ToneType::Casual,
            aggressiveness: 0.4,
            remove_fillers: false,
            enable_caching: true,
            max_cache_size: 500,
        },
        ProcessingContext::Technical => TextProcessingConfig {
            context,
            tone: ToneType::Neutral,
            aggressiveness: 0.6,
            remove_fillers: true,
            enable_caching: true,
            max_cache_size: 1000,
        },
        ProcessingContext::Creative => TextProcessingConfig {
            context,
            tone: ToneType::Neutral,
            aggressiveness: 0.2,
            remove_fillers: false,
            enable_caching: false,
            max_cache_size: 100,
        },
        ProcessingContext::Document => TextProcessingConfig {
            context,
            tone: ToneType::Professional,
            aggressiveness: 0.7,
            remove_fillers: true,
            enable_caching: true,
            max_cache_size: 1000,
        },
    }
}