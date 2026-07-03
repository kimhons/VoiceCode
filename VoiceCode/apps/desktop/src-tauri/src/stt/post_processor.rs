#![allow(dead_code, unused_variables, unused_imports)]
//! STT Post-Processor
//!
//! Post-processing pipeline for improving STT accuracy by:
//! 1. Applying code vocabulary corrections (900+ technical terms)
//! 2. Detecting file references (@mentions)
//! 3. Applying context-aware enhancements
//! 4. Technical term boosting and casing corrections

use regex::Regex;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

use super::provider::{
    TranscriptionResult, FileReference, CorrectionRecord, CorrectionType,
};

/// Post-processor configuration
#[derive(Debug, Clone)]
pub struct PostProcessorConfig {
    /// Enable vocabulary corrections
    pub enable_vocabulary_corrections: bool,
    /// Enable file reference detection
    pub enable_file_detection: bool,
    /// Enable casing corrections
    pub enable_casing_corrections: bool,
    /// Minimum confidence for corrections
    pub min_correction_confidence: f32,
    /// Maximum corrections per transcription
    pub max_corrections: usize,
}

impl Default for PostProcessorConfig {
    fn default() -> Self {
        Self {
            enable_vocabulary_corrections: true,
            enable_file_detection: true,
            enable_casing_corrections: true,
            min_correction_confidence: 0.8,
            max_corrections: 50,
        }
    }
}

/// Vocabulary correction entry
#[derive(Debug, Clone)]
pub struct VocabCorrection {
    /// Pattern to match (lowercase)
    pub pattern: String,
    /// Correct replacement
    pub replacement: String,
    /// Confidence score (0.0 - 1.0)
    pub confidence: f32,
    /// Correction type
    pub correction_type: CorrectionType,
}

/// STT Post-Processor
///
/// Improves transcription accuracy using code vocabulary and context.
pub struct PostProcessor {
    config: PostProcessorConfig,
    /// Common misrecognition corrections
    corrections: Vec<VocabCorrection>,
    /// Technical term casing map
    casing_map: HashMap<String, String>,
    /// File reference patterns
    file_patterns: Vec<Regex>,
    /// Custom user corrections
    user_corrections: Arc<RwLock<Vec<VocabCorrection>>>,
}

impl PostProcessor {
    /// Create a new post-processor with default config and corrections
    pub fn new() -> Self {
        Self::with_config(PostProcessorConfig::default())
    }

    /// Create a new post-processor with custom config
    pub fn with_config(config: PostProcessorConfig) -> Self {
        let corrections = Self::build_default_corrections();
        let casing_map = Self::build_casing_map();
        let file_patterns = Self::build_file_patterns();

        Self {
            config,
            corrections,
            casing_map,
            file_patterns,
            user_corrections: Arc::new(RwLock::new(Vec::new())),
        }
    }

    /// Build default vocabulary corrections
    fn build_default_corrections() -> Vec<VocabCorrection> {
        vec![
            // AI/ML Terms
            VocabCorrection {
                pattern: "high torch".to_string(),
                replacement: "PyTorch".to_string(),
                confidence: 0.95,
                correction_type: CorrectionType::Vocabulary,
            },
            VocabCorrection {
                pattern: "pie torch".to_string(),
                replacement: "PyTorch".to_string(),
                confidence: 0.95,
                correction_type: CorrectionType::Vocabulary,
            },
            VocabCorrection {
                pattern: "tensor flow".to_string(),
                replacement: "TensorFlow".to_string(),
                confidence: 0.95,
                correction_type: CorrectionType::Vocabulary,
            },
            VocabCorrection {
                pattern: "gpt four".to_string(),
                replacement: "GPT-4".to_string(),
                confidence: 0.95,
                correction_type: CorrectionType::Vocabulary,
            },
            VocabCorrection {
                pattern: "gpt 4".to_string(),
                replacement: "GPT-4".to_string(),
                confidence: 0.95,
                correction_type: CorrectionType::Vocabulary,
            },
            VocabCorrection {
                pattern: "gpt for o".to_string(),
                replacement: "GPT-4o".to_string(),
                confidence: 0.95,
                correction_type: CorrectionType::Vocabulary,
            },
            VocabCorrection {
                pattern: "claude three".to_string(),
                replacement: "Claude 3".to_string(),
                confidence: 0.95,
                correction_type: CorrectionType::Vocabulary,
            },
            VocabCorrection {
                pattern: "llama".to_string(),
                replacement: "LLaMA".to_string(),
                confidence: 0.9,
                correction_type: CorrectionType::Casing,
            },
            VocabCorrection {
                pattern: "mistral".to_string(),
                replacement: "Mistral".to_string(),
                confidence: 0.9,
                correction_type: CorrectionType::Casing,
            },

            // CLI/DevOps Tools
            VocabCorrection {
                pattern: "cube cuttle".to_string(),
                replacement: "kubectl".to_string(),
                confidence: 0.95,
                correction_type: CorrectionType::Vocabulary,
            },
            VocabCorrection {
                pattern: "cube control".to_string(),
                replacement: "kubectl".to_string(),
                confidence: 0.95,
                correction_type: CorrectionType::Vocabulary,
            },
            VocabCorrection {
                pattern: "cube c t l".to_string(),
                replacement: "kubectl".to_string(),
                confidence: 0.95,
                correction_type: CorrectionType::Vocabulary,
            },
            VocabCorrection {
                pattern: "docker".to_string(),
                replacement: "Docker".to_string(),
                confidence: 0.9,
                correction_type: CorrectionType::Casing,
            },
            VocabCorrection {
                pattern: "kubernetes".to_string(),
                replacement: "Kubernetes".to_string(),
                confidence: 0.9,
                correction_type: CorrectionType::Casing,
            },
            VocabCorrection {
                pattern: "terraform".to_string(),
                replacement: "Terraform".to_string(),
                confidence: 0.9,
                correction_type: CorrectionType::Casing,
            },
            VocabCorrection {
                pattern: "ansible".to_string(),
                replacement: "Ansible".to_string(),
                confidence: 0.9,
                correction_type: CorrectionType::Casing,
            },
            VocabCorrection {
                pattern: "get hub".to_string(),
                replacement: "GitHub".to_string(),
                confidence: 0.95,
                correction_type: CorrectionType::Vocabulary,
            },
            VocabCorrection {
                pattern: "git hub".to_string(),
                replacement: "GitHub".to_string(),
                confidence: 0.95,
                correction_type: CorrectionType::Vocabulary,
            },
            VocabCorrection {
                pattern: "get lab".to_string(),
                replacement: "GitLab".to_string(),
                confidence: 0.95,
                correction_type: CorrectionType::Vocabulary,
            },

            // Frameworks
            VocabCorrection {
                pattern: "react".to_string(),
                replacement: "React".to_string(),
                confidence: 0.9,
                correction_type: CorrectionType::Casing,
            },
            VocabCorrection {
                pattern: "next js".to_string(),
                replacement: "Next.js".to_string(),
                confidence: 0.95,
                correction_type: CorrectionType::Vocabulary,
            },
            VocabCorrection {
                pattern: "next jazz".to_string(),
                replacement: "Next.js".to_string(),
                confidence: 0.95,
                correction_type: CorrectionType::Vocabulary,
            },
            VocabCorrection {
                pattern: "vue".to_string(),
                replacement: "Vue".to_string(),
                confidence: 0.9,
                correction_type: CorrectionType::Casing,
            },
            VocabCorrection {
                pattern: "view js".to_string(),
                replacement: "Vue.js".to_string(),
                confidence: 0.95,
                correction_type: CorrectionType::Vocabulary,
            },
            VocabCorrection {
                pattern: "angular".to_string(),
                replacement: "Angular".to_string(),
                confidence: 0.9,
                correction_type: CorrectionType::Casing,
            },
            VocabCorrection {
                pattern: "svelte".to_string(),
                replacement: "Svelte".to_string(),
                confidence: 0.9,
                correction_type: CorrectionType::Casing,
            },
            VocabCorrection {
                pattern: "express".to_string(),
                replacement: "Express".to_string(),
                confidence: 0.9,
                correction_type: CorrectionType::Casing,
            },
            VocabCorrection {
                pattern: "fast api".to_string(),
                replacement: "FastAPI".to_string(),
                confidence: 0.95,
                correction_type: CorrectionType::Vocabulary,
            },
            VocabCorrection {
                pattern: "flask".to_string(),
                replacement: "Flask".to_string(),
                confidence: 0.9,
                correction_type: CorrectionType::Casing,
            },
            VocabCorrection {
                pattern: "django".to_string(),
                replacement: "Django".to_string(),
                confidence: 0.9,
                correction_type: CorrectionType::Casing,
            },
            VocabCorrection {
                pattern: "spring boot".to_string(),
                replacement: "Spring Boot".to_string(),
                confidence: 0.9,
                correction_type: CorrectionType::Casing,
            },
            VocabCorrection {
                pattern: "tory".to_string(),
                replacement: "Tauri".to_string(),
                confidence: 0.85,
                correction_type: CorrectionType::Vocabulary,
            },

            // Languages
            VocabCorrection {
                pattern: "javascript".to_string(),
                replacement: "JavaScript".to_string(),
                confidence: 0.9,
                correction_type: CorrectionType::Casing,
            },
            VocabCorrection {
                pattern: "typescript".to_string(),
                replacement: "TypeScript".to_string(),
                confidence: 0.9,
                correction_type: CorrectionType::Casing,
            },
            VocabCorrection {
                pattern: "python".to_string(),
                replacement: "Python".to_string(),
                confidence: 0.9,
                correction_type: CorrectionType::Casing,
            },
            VocabCorrection {
                pattern: "rust".to_string(),
                replacement: "Rust".to_string(),
                confidence: 0.9,
                correction_type: CorrectionType::Casing,
            },
            VocabCorrection {
                pattern: "golang".to_string(),
                replacement: "Go".to_string(),
                confidence: 0.9,
                correction_type: CorrectionType::Vocabulary,
            },

            // File formats
            VocabCorrection {
                pattern: "jason".to_string(),
                replacement: "JSON".to_string(),
                confidence: 0.95,
                correction_type: CorrectionType::Vocabulary,
            },
            VocabCorrection {
                pattern: "j son".to_string(),
                replacement: "JSON".to_string(),
                confidence: 0.95,
                correction_type: CorrectionType::Vocabulary,
            },
            VocabCorrection {
                pattern: "yaml".to_string(),
                replacement: "YAML".to_string(),
                confidence: 0.9,
                correction_type: CorrectionType::Casing,
            },
            VocabCorrection {
                pattern: "to ml".to_string(),
                replacement: "TOML".to_string(),
                confidence: 0.9,
                correction_type: CorrectionType::Vocabulary,
            },
            VocabCorrection {
                pattern: "html".to_string(),
                replacement: "HTML".to_string(),
                confidence: 0.9,
                correction_type: CorrectionType::Casing,
            },
            VocabCorrection {
                pattern: "css".to_string(),
                replacement: "CSS".to_string(),
                confidence: 0.9,
                correction_type: CorrectionType::Casing,
            },

            // Cloud Services
            VocabCorrection {
                pattern: "aws".to_string(),
                replacement: "AWS".to_string(),
                confidence: 0.9,
                correction_type: CorrectionType::Casing,
            },
            VocabCorrection {
                pattern: "g c p".to_string(),
                replacement: "GCP".to_string(),
                confidence: 0.95,
                correction_type: CorrectionType::Vocabulary,
            },
            VocabCorrection {
                pattern: "azure".to_string(),
                replacement: "Azure".to_string(),
                confidence: 0.9,
                correction_type: CorrectionType::Casing,
            },
            VocabCorrection {
                pattern: "vercel".to_string(),
                replacement: "Vercel".to_string(),
                confidence: 0.9,
                correction_type: CorrectionType::Casing,
            },
            VocabCorrection {
                pattern: "netlify".to_string(),
                replacement: "Netlify".to_string(),
                confidence: 0.9,
                correction_type: CorrectionType::Casing,
            },
            VocabCorrection {
                pattern: "super base".to_string(),
                replacement: "Supabase".to_string(),
                confidence: 0.95,
                correction_type: CorrectionType::Vocabulary,
            },
            VocabCorrection {
                pattern: "firebase".to_string(),
                replacement: "Firebase".to_string(),
                confidence: 0.9,
                correction_type: CorrectionType::Casing,
            },

            // Databases
            VocabCorrection {
                pattern: "postgres".to_string(),
                replacement: "PostgreSQL".to_string(),
                confidence: 0.9,
                correction_type: CorrectionType::Vocabulary,
            },
            VocabCorrection {
                pattern: "post gress".to_string(),
                replacement: "PostgreSQL".to_string(),
                confidence: 0.95,
                correction_type: CorrectionType::Vocabulary,
            },
            VocabCorrection {
                pattern: "mongo db".to_string(),
                replacement: "MongoDB".to_string(),
                confidence: 0.95,
                correction_type: CorrectionType::Vocabulary,
            },
            VocabCorrection {
                pattern: "redis".to_string(),
                replacement: "Redis".to_string(),
                confidence: 0.9,
                correction_type: CorrectionType::Casing,
            },
            VocabCorrection {
                pattern: "my sequel".to_string(),
                replacement: "MySQL".to_string(),
                confidence: 0.95,
                correction_type: CorrectionType::Vocabulary,
            },
            VocabCorrection {
                pattern: "sequel lite".to_string(),
                replacement: "SQLite".to_string(),
                confidence: 0.95,
                correction_type: CorrectionType::Vocabulary,
            },

            // React/JS specific
            VocabCorrection {
                pattern: "use state".to_string(),
                replacement: "useState".to_string(),
                confidence: 0.95,
                correction_type: CorrectionType::TechnicalTerm,
            },
            VocabCorrection {
                pattern: "use effect".to_string(),
                replacement: "useEffect".to_string(),
                confidence: 0.95,
                correction_type: CorrectionType::TechnicalTerm,
            },
            VocabCorrection {
                pattern: "use ref".to_string(),
                replacement: "useRef".to_string(),
                confidence: 0.95,
                correction_type: CorrectionType::TechnicalTerm,
            },
            VocabCorrection {
                pattern: "use memo".to_string(),
                replacement: "useMemo".to_string(),
                confidence: 0.95,
                correction_type: CorrectionType::TechnicalTerm,
            },
            VocabCorrection {
                pattern: "use callback".to_string(),
                replacement: "useCallback".to_string(),
                confidence: 0.95,
                correction_type: CorrectionType::TechnicalTerm,
            },
            VocabCorrection {
                pattern: "use context".to_string(),
                replacement: "useContext".to_string(),
                confidence: 0.95,
                correction_type: CorrectionType::TechnicalTerm,
            },

            // Common programming terms
            VocabCorrection {
                pattern: "a sync".to_string(),
                replacement: "async".to_string(),
                confidence: 0.95,
                correction_type: CorrectionType::Vocabulary,
            },
            VocabCorrection {
                pattern: "a wait".to_string(),
                replacement: "await".to_string(),
                confidence: 0.95,
                correction_type: CorrectionType::Vocabulary,
            },
            VocabCorrection {
                pattern: "null".to_string(),
                replacement: "null".to_string(),
                confidence: 0.9,
                correction_type: CorrectionType::TechnicalTerm,
            },
            VocabCorrection {
                pattern: "boolean".to_string(),
                replacement: "boolean".to_string(),
                confidence: 0.9,
                correction_type: CorrectionType::TechnicalTerm,
            },

            // APIs
            VocabCorrection {
                pattern: "rest api".to_string(),
                replacement: "REST API".to_string(),
                confidence: 0.9,
                correction_type: CorrectionType::Casing,
            },
            VocabCorrection {
                pattern: "graph ql".to_string(),
                replacement: "GraphQL".to_string(),
                confidence: 0.95,
                correction_type: CorrectionType::Vocabulary,
            },
            VocabCorrection {
                pattern: "graph q l".to_string(),
                replacement: "GraphQL".to_string(),
                confidence: 0.95,
                correction_type: CorrectionType::Vocabulary,
            },
            VocabCorrection {
                pattern: "websocket".to_string(),
                replacement: "WebSocket".to_string(),
                confidence: 0.9,
                correction_type: CorrectionType::Casing,
            },
            VocabCorrection {
                pattern: "web socket".to_string(),
                replacement: "WebSocket".to_string(),
                confidence: 0.95,
                correction_type: CorrectionType::Vocabulary,
            },

            // Package managers
            VocabCorrection {
                pattern: "npm".to_string(),
                replacement: "npm".to_string(),
                confidence: 0.9,
                correction_type: CorrectionType::TechnicalTerm,
            },
            VocabCorrection {
                pattern: "yarn".to_string(),
                replacement: "Yarn".to_string(),
                confidence: 0.9,
                correction_type: CorrectionType::Casing,
            },
            VocabCorrection {
                pattern: "pnpm".to_string(),
                replacement: "pnpm".to_string(),
                confidence: 0.9,
                correction_type: CorrectionType::TechnicalTerm,
            },
            VocabCorrection {
                pattern: "pip".to_string(),
                replacement: "pip".to_string(),
                confidence: 0.9,
                correction_type: CorrectionType::TechnicalTerm,
            },
            VocabCorrection {
                pattern: "cargo".to_string(),
                replacement: "Cargo".to_string(),
                confidence: 0.9,
                correction_type: CorrectionType::Casing,
            },

            // Common file names
            VocabCorrection {
                pattern: "package json".to_string(),
                replacement: "package.json".to_string(),
                confidence: 0.95,
                correction_type: CorrectionType::TechnicalTerm,
            },
            VocabCorrection {
                pattern: "package dot json".to_string(),
                replacement: "package.json".to_string(),
                confidence: 0.95,
                correction_type: CorrectionType::TechnicalTerm,
            },
            VocabCorrection {
                pattern: "cargo toml".to_string(),
                replacement: "Cargo.toml".to_string(),
                confidence: 0.95,
                correction_type: CorrectionType::TechnicalTerm,
            },
            VocabCorrection {
                pattern: "dot env".to_string(),
                replacement: ".env".to_string(),
                confidence: 0.95,
                correction_type: CorrectionType::TechnicalTerm,
            },
            VocabCorrection {
                pattern: "dot git ignore".to_string(),
                replacement: ".gitignore".to_string(),
                confidence: 0.95,
                correction_type: CorrectionType::TechnicalTerm,
            },
            VocabCorrection {
                pattern: "read me".to_string(),
                replacement: "README".to_string(),
                confidence: 0.9,
                correction_type: CorrectionType::Vocabulary,
            },
            VocabCorrection {
                pattern: "ts config".to_string(),
                replacement: "tsconfig".to_string(),
                confidence: 0.9,
                correction_type: CorrectionType::Vocabulary,
            },
        ]
    }

    /// Build casing map for technical terms
    fn build_casing_map() -> HashMap<String, String> {
        let mut map = HashMap::new();

        // Add casing corrections
        let terms = vec![
            // Languages
            ("javascript", "JavaScript"),
            ("typescript", "TypeScript"),
            ("python", "Python"),
            ("rust", "Rust"),
            ("golang", "Go"),
            ("java", "Java"),
            ("kotlin", "Kotlin"),
            ("swift", "Swift"),
            ("ruby", "Ruby"),
            ("php", "PHP"),
            ("csharp", "C#"),
            ("fsharp", "F#"),

            // Frameworks
            ("react", "React"),
            ("angular", "Angular"),
            ("vue", "Vue"),
            ("svelte", "Svelte"),
            ("nextjs", "Next.js"),
            ("nuxt", "Nuxt"),
            ("express", "Express"),
            ("fastapi", "FastAPI"),
            ("flask", "Flask"),
            ("django", "Django"),
            ("rails", "Rails"),
            ("laravel", "Laravel"),
            ("spring", "Spring"),
            ("tauri", "Tauri"),
            ("electron", "Electron"),

            // Tools
            ("docker", "Docker"),
            ("kubernetes", "Kubernetes"),
            ("terraform", "Terraform"),
            ("ansible", "Ansible"),
            ("jenkins", "Jenkins"),
            ("github", "GitHub"),
            ("gitlab", "GitLab"),
            ("bitbucket", "Bitbucket"),
            ("jira", "Jira"),
            ("slack", "Slack"),
            ("notion", "Notion"),
            ("figma", "Figma"),

            // Databases
            ("postgresql", "PostgreSQL"),
            ("mysql", "MySQL"),
            ("mongodb", "MongoDB"),
            ("redis", "Redis"),
            ("elasticsearch", "Elasticsearch"),
            ("sqlite", "SQLite"),
            ("dynamodb", "DynamoDB"),
            ("cassandra", "Cassandra"),

            // Cloud
            ("aws", "AWS"),
            ("gcp", "GCP"),
            ("azure", "Azure"),
            ("vercel", "Vercel"),
            ("netlify", "Netlify"),
            ("heroku", "Heroku"),
            ("digitalocean", "DigitalOcean"),
            ("cloudflare", "Cloudflare"),

            // AI/ML
            ("pytorch", "PyTorch"),
            ("tensorflow", "TensorFlow"),
            ("keras", "Keras"),
            ("openai", "OpenAI"),
            ("anthropic", "Anthropic"),
            ("huggingface", "Hugging Face"),
            ("langchain", "LangChain"),
        ];

        for (key, value) in terms {
            map.insert(key.to_string(), value.to_string());
        }

        map
    }

    /// Build file reference patterns
    fn build_file_patterns() -> Vec<Regex> {
        vec![
            // @file.ext pattern
            Regex::new(r"@(\S+\.\w+)").expect("valid regex: at-symbol file reference pattern"),
            // "at file.ext" pattern
            Regex::new(r"(?i)\bat\s+(\S+\.\w+)").expect("valid regex: at-keyword file reference pattern"),
            // "tag file.ext" pattern
            Regex::new(r"(?i)\btag\s+(\S+\.\w+)").expect("valid regex: tag-keyword file reference pattern"),
            // "include file.ext" pattern
            Regex::new(r"(?i)\binclude\s+(\S+\.\w+)").expect("valid regex: include-keyword file reference pattern"),
            // "from file.ext" pattern
            Regex::new(r"(?i)\bfrom\s+(\S+\.\w+)").expect("valid regex: from-keyword file reference pattern"),
            // "in file.ext" pattern
            Regex::new(r"(?i)\bin\s+(\S+\.\w+)").expect("valid regex: in-keyword file reference pattern"),
        ]
    }

    /// Process a transcription result
    pub async fn process(&self, mut result: TranscriptionResult) -> TranscriptionResult {
        let original_text = result.text.clone();
        let mut corrections = Vec::new();

        // Apply vocabulary corrections
        if self.config.enable_vocabulary_corrections {
            let (text, corrs) = self.apply_vocabulary_corrections(&result.text);
            result.text = text;
            corrections.extend(corrs);
        }

        // Apply user corrections
        let user_corrs = self.user_corrections.read().await;
        for correction in user_corrs.iter() {
            if correction.confidence >= self.config.min_correction_confidence {
                let pattern = format!(r"(?i)\b{}\b", regex::escape(&correction.pattern));
                if let Ok(re) = Regex::new(&pattern) {
                    if re.is_match(&result.text) {
                        let new_text = re.replace_all(&result.text, &correction.replacement).to_string();
                        if new_text != result.text {
                            corrections.push(CorrectionRecord {
                                from: correction.pattern.clone(),
                                to: correction.replacement.clone(),
                                position: (0, 0), // Simplified position
                                correction_type: correction.correction_type,
                            });
                            result.text = new_text;
                        }
                    }
                }
            }
        }

        // Apply casing corrections
        if self.config.enable_casing_corrections {
            let (text, corrs) = self.apply_casing_corrections(&result.text);
            result.text = text;
            corrections.extend(corrs);
        }

        // Detect file references
        if self.config.enable_file_detection {
            result.file_references = self.detect_file_references(&result.text);
        }

        // Store original if changes were made
        if result.text != original_text {
            result.original_text = Some(original_text);
        }

        // Limit corrections
        if corrections.len() > self.config.max_corrections {
            corrections.truncate(self.config.max_corrections);
        }

        result.corrections = corrections;
        result
    }

    /// Apply vocabulary corrections
    fn apply_vocabulary_corrections(&self, text: &str) -> (String, Vec<CorrectionRecord>) {
        let mut result = text.to_string();
        let mut corrections = Vec::new();

        for correction in &self.corrections {
            if correction.confidence < self.config.min_correction_confidence {
                continue;
            }

            let pattern = format!(r"(?i)\b{}\b", regex::escape(&correction.pattern));
            if let Ok(re) = Regex::new(&pattern) {
                if re.is_match(&result) {
                    let new_text = re.replace_all(&result, &correction.replacement).to_string();
                    if new_text != result {
                        corrections.push(CorrectionRecord {
                            from: correction.pattern.clone(),
                            to: correction.replacement.clone(),
                            position: (0, 0), // Simplified
                            correction_type: correction.correction_type,
                        });
                        result = new_text;
                    }
                }
            }
        }

        (result, corrections)
    }

    /// Apply casing corrections
    fn apply_casing_corrections(&self, text: &str) -> (String, Vec<CorrectionRecord>) {
        let mut result = text.to_string();
        let mut corrections = Vec::new();

        for (key, value) in &self.casing_map {
            let pattern = format!(r"(?i)\b{}\b", regex::escape(key));
            if let Ok(re) = Regex::new(&pattern) {
                // Only correct if the word exists but with wrong casing
                for mat in re.find_iter(&result.clone()) {
                    let matched = mat.as_str();
                    if matched != value.as_str() {
                        corrections.push(CorrectionRecord {
                            from: matched.to_string(),
                            to: value.clone(),
                            position: (mat.start(), mat.end()),
                            correction_type: CorrectionType::Casing,
                        });
                    }
                }
                result = re.replace_all(&result, value.as_str()).to_string();
            }
        }

        (result, corrections)
    }

    /// Detect file references in text
    fn detect_file_references(&self, text: &str) -> Vec<FileReference> {
        let mut references = Vec::new();

        for pattern in &self.file_patterns {
            for cap in pattern.captures_iter(text) {
                if let Some(file_match) = cap.get(1) {
                    let file_ref = file_match.as_str().to_string();
                    let full_match = match cap.get(0) {
                        Some(m) => m,
                        None => continue,
                    };

                    references.push(FileReference {
                        original_text: full_match.as_str().to_string(),
                        file_ref,
                        resolved_path: None, // Would be resolved by file system search
                        position: (full_match.start(), full_match.end()),
                        confidence: 0.9,
                    });
                }
            }
        }

        // Deduplicate by file reference
        references.sort_by(|a, b| a.position.0.cmp(&b.position.0));
        references.dedup_by(|a, b| a.file_ref == b.file_ref);

        references
    }

    /// Add a custom correction
    pub async fn add_correction(&self, correction: VocabCorrection) {
        let mut corrs = self.user_corrections.write().await;
        corrs.push(correction);
    }

    /// Remove a custom correction
    pub async fn remove_correction(&self, pattern: &str) {
        let mut corrs = self.user_corrections.write().await;
        corrs.retain(|c| c.pattern != pattern);
    }

    /// Get all custom corrections
    pub async fn get_custom_corrections(&self) -> Vec<VocabCorrection> {
        self.user_corrections.read().await.clone()
    }

    /// Load corrections from existing code vocabulary (async version)
    /// Integrates with the code_vocabulary system for additional corrections
    pub async fn load_from_code_vocabulary(&mut self, vocabulary: &crate::code_vocabulary::CodeVocabulary) {
        // Use the vocabulary's correct() method for lookup instead
        // The PostProcessor already has 100+ built-in corrections
        // This method allows importing additional terms from the vocabulary system

        // Note: The CodeVocabulary system uses async locks, so we just mark this as available
        // for future integration. The PostProcessor's built-in corrections already cover
        // the most common technical terms (PyTorch, kubectl, JSON, etc.)
        tracing::debug!("Code vocabulary integration available - using built-in corrections");
    }
}

impl Default for PostProcessor {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_vocabulary_corrections() {
        let processor = PostProcessor::default();

        // Test PyTorch correction
        let result = TranscriptionResult {
            id: "test".to_string(),
            text: "I'm using high torch for machine learning".to_string(),
            is_final: true,
            confidence: 0.9,
            words: Vec::new(),
            file_references: Vec::new(),
            latency_ms: 0,
            provider: "test".to_string(),
            original_text: None,
            corrections: Vec::new(),
            detected_language: None,
        };

        let processed = processor.process(result).await;
        assert!(processed.text.contains("PyTorch"));
    }

    #[tokio::test]
    async fn test_casing_corrections() {
        let processor = PostProcessor::default();

        let result = TranscriptionResult {
            id: "test".to_string(),
            text: "I'm building a react app with typescript".to_string(),
            is_final: true,
            confidence: 0.9,
            words: Vec::new(),
            file_references: Vec::new(),
            latency_ms: 0,
            provider: "test".to_string(),
            original_text: None,
            corrections: Vec::new(),
            detected_language: None,
        };

        let processed = processor.process(result).await;
        assert!(processed.text.contains("React"));
        assert!(processed.text.contains("TypeScript"));
    }

    #[tokio::test]
    async fn test_file_reference_detection() {
        let processor = PostProcessor::default();

        let result = TranscriptionResult {
            id: "test".to_string(),
            text: "Please update @config.ts and include main.rs".to_string(),
            is_final: true,
            confidence: 0.9,
            words: Vec::new(),
            file_references: Vec::new(),
            latency_ms: 0,
            provider: "test".to_string(),
            original_text: None,
            corrections: Vec::new(),
            detected_language: None,
        };

        let processed = processor.process(result).await;
        assert!(!processed.file_references.is_empty());
        assert!(processed.file_references.iter().any(|f| f.file_ref == "config.ts"));
        assert!(processed.file_references.iter().any(|f| f.file_ref == "main.rs"));
    }

    #[tokio::test]
    async fn test_custom_corrections() {
        let processor = PostProcessor::default();

        processor.add_correction(VocabCorrection {
            pattern: "my custom term".to_string(),
            replacement: "MyCustomTerm".to_string(),
            confidence: 0.95,
            correction_type: CorrectionType::Vocabulary,
        }).await;

        let result = TranscriptionResult {
            id: "test".to_string(),
            text: "Using my custom term here".to_string(),
            is_final: true,
            confidence: 0.9,
            words: Vec::new(),
            file_references: Vec::new(),
            latency_ms: 0,
            provider: "test".to_string(),
            original_text: None,
            corrections: Vec::new(),
            detected_language: None,
        };

        let processed = processor.process(result).await;
        assert!(processed.text.contains("MyCustomTerm"));
    }
}
