#![allow(dead_code, unused_variables, unused_imports)]
// Offline Mode - Local model support for sensitive environments
// Uses Whisper.cpp for voice and llama.cpp for LLM

use std::path::{Path, PathBuf};
use std::process::Stdio;
use serde::{Deserialize, Serialize};
use parking_lot::RwLock;
use tokio::process::Command;

/// Offline mode manager
pub struct OfflineMode {
    config: OfflineModeConfig,
    state: RwLock<OfflineState>,
    models_dir: PathBuf,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OfflineModeConfig {
    pub enabled: bool,
    pub whisper_model: WhisperModel,
    pub llm_model: LlmModel,
    pub auto_fallback: bool,
    pub cache_responses: bool,
    pub max_cache_size_mb: u32,
}

impl Default for OfflineModeConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            whisper_model: WhisperModel::Base,
            llm_model: LlmModel::default(),
            auto_fallback: true,
            cache_responses: true,
            max_cache_size_mb: 500,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum WhisperModel {
    Tiny,
    Base,
    Small,
    Medium,
    Large,
}

impl WhisperModel {
    pub fn file_name(&self) -> &str {
        match self {
            WhisperModel::Tiny => "ggml-tiny.bin",
            WhisperModel::Base => "ggml-base.bin",
            WhisperModel::Small => "ggml-small.bin",
            WhisperModel::Medium => "ggml-medium.bin",
            WhisperModel::Large => "ggml-large.bin",
        }
    }

    pub fn size_mb(&self) -> u32 {
        match self {
            WhisperModel::Tiny => 75,
            WhisperModel::Base => 142,
            WhisperModel::Small => 466,
            WhisperModel::Medium => 1500,
            WhisperModel::Large => 3000,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LlmModel {
    pub name: String,
    pub path: Option<PathBuf>,
    pub context_size: u32,
    pub gpu_layers: u32,
    pub threads: u32,
}

impl Default for LlmModel {
    fn default() -> Self {
        Self {
            name: "codellama-7b-instruct".to_string(),
            path: None,
            context_size: 4096,
            gpu_layers: 0,
            threads: 4,
        }
    }
}

#[derive(Debug, Clone, Default)]
struct OfflineState {
    is_online: bool,
    whisper_available: bool,
    llm_available: bool,
    last_check: Option<u64>,
    cached_responses: Vec<CachedResponse>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct CachedResponse {
    query_hash: String,
    response: String,
    created_at: u64,
    hit_count: u32,
}

impl OfflineMode {
    pub fn new(models_dir: PathBuf, config: OfflineModeConfig) -> Self {
        Self {
            config,
            state: RwLock::new(OfflineState::default()),
            models_dir,
        }
    }

    /// Check if offline mode is available
    pub async fn check_availability(&self) -> OfflineStatus {
        let mut state = self.state.write();
        
        // Check whisper
        let whisper_path = self.models_dir.join("whisper").join(self.config.whisper_model.file_name());
        state.whisper_available = whisper_path.exists() && self.check_whisper_binary().await;

        // Check LLM
        let llm_path = self.config.llm_model.path.clone()
            .unwrap_or_else(|| self.models_dir.join("llm").join(&self.config.llm_model.name));
        state.llm_available = llm_path.exists() && self.check_llm_binary().await;

        state.last_check = Some(self.now());

        OfflineStatus {
            available: state.whisper_available && state.llm_available,
            whisper_ready: state.whisper_available,
            llm_ready: state.llm_available,
            whisper_model: format!("{:?}", self.config.whisper_model),
            llm_model: self.config.llm_model.name.clone(),
        }
    }

    async fn check_whisper_binary(&self) -> bool {
        // Check if whisper.cpp binary is available
        let result = Command::new("whisper")
            .arg("--help")
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status()
            .await;
        
        result.map(|s| s.success()).unwrap_or(false)
    }

    async fn check_llm_binary(&self) -> bool {
        // Check if llama.cpp binary is available
        let result = Command::new("llama")
            .arg("--help")
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status()
            .await;
        
        result.map(|s| s.success()).unwrap_or(false)
    }

    /// Transcribe audio using local Whisper
    pub async fn transcribe(&self, audio_path: &Path) -> Result<TranscriptionResult, String> {
        if !self.state.read().whisper_available {
            return Err("Whisper not available".to_string());
        }

        let model_path = self.models_dir.join("whisper").join(self.config.whisper_model.file_name());
        
        let output = Command::new("whisper")
            .arg("-m").arg(&model_path)
            .arg("-f").arg(audio_path)
            .arg("--output-txt")
            .arg("--no-timestamps")
            .output()
            .await
            .map_err(|e| format!("Whisper failed: {}", e))?;

        if !output.status.success() {
            return Err(format!("Whisper error: {}", String::from_utf8_lossy(&output.stderr)));
        }

        let text = String::from_utf8_lossy(&output.stdout).trim().to_string();
        
        Ok(TranscriptionResult {
            text,
            confidence: 0.9, // Local models don't provide confidence
            language: "en".to_string(),
            duration_ms: 0,
        })
    }

    /// Generate completion using local LLM
    pub async fn complete(&self, prompt: &str, max_tokens: u32) -> Result<CompletionResult, String> {
        if !self.state.read().llm_available {
            return Err("LLM not available".to_string());
        }

        // Check cache first
        if self.config.cache_responses {
            let hash = self.hash_prompt(prompt);
            let state = self.state.read();
            if let Some(cached) = state.cached_responses.iter().find(|c| c.query_hash == hash) {
                return Ok(CompletionResult {
                    text: cached.response.clone(),
                    tokens_used: 0,
                    from_cache: true,
                });
            }
        }

        let model_path = self.config.llm_model.path.clone()
            .unwrap_or_else(|| self.models_dir.join("llm").join(&self.config.llm_model.name));

        let output = Command::new("llama")
            .arg("-m").arg(&model_path)
            .arg("-c").arg(self.config.llm_model.context_size.to_string())
            .arg("-n").arg(max_tokens.to_string())
            .arg("-t").arg(self.config.llm_model.threads.to_string())
            .arg("--temp").arg("0.3")
            .arg("-p").arg(prompt)
            .output()
            .await
            .map_err(|e| format!("LLM failed: {}", e))?;

        if !output.status.success() {
            return Err(format!("LLM error: {}", String::from_utf8_lossy(&output.stderr)));
        }

        let text = String::from_utf8_lossy(&output.stdout).trim().to_string();

        // Cache response
        if self.config.cache_responses {
            let hash = self.hash_prompt(prompt);
            let mut state = self.state.write();
            state.cached_responses.push(CachedResponse {
                query_hash: hash,
                response: text.clone(),
                created_at: self.now(),
                hit_count: 0,
            });

            // Limit cache size
            while state.cached_responses.len() > 1000 {
                state.cached_responses.remove(0);
            }
        }

        Ok(CompletionResult {
            text,
            tokens_used: max_tokens,
            from_cache: false,
        })
    }

    /// Download required models
    pub async fn download_models(&self, progress_callback: impl Fn(DownloadProgress)) -> Result<(), String> {
        // Create directories
        let whisper_dir = self.models_dir.join("whisper");
        let llm_dir = self.models_dir.join("llm");
        
        tokio::fs::create_dir_all(&whisper_dir).await.ok();
        tokio::fs::create_dir_all(&llm_dir).await.ok();

        // Download Whisper model
        let whisper_url = format!(
            "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/{}",
            self.config.whisper_model.file_name()
        );
        let whisper_path = whisper_dir.join(self.config.whisper_model.file_name());
        
        if !whisper_path.exists() {
            progress_callback(DownloadProgress {
                model: "whisper".to_string(),
                progress: 0.0,
                total_mb: self.config.whisper_model.size_mb(),
                status: "Downloading...".to_string(),
            });

            self.download_file(&whisper_url, &whisper_path, |p| {
                progress_callback(DownloadProgress {
                    model: "whisper".to_string(),
                    progress: p,
                    total_mb: self.config.whisper_model.size_mb(),
                    status: format!("Downloading... {:.0}%", p * 100.0),
                });
            }).await?;
        }

        progress_callback(DownloadProgress {
            model: "whisper".to_string(),
            progress: 1.0,
            total_mb: self.config.whisper_model.size_mb(),
            status: "Complete".to_string(),
        });

        Ok(())
    }

    async fn download_file(&self, url: &str, path: &Path, _progress: impl Fn(f32)) -> Result<(), String> {
        let client = reqwest::Client::new();
        let response = client.get(url)
            .send()
            .await
            .map_err(|e| format!("Download failed: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Download failed: {}", response.status()));
        }

        let bytes = response.bytes().await
            .map_err(|e| format!("Download failed: {}", e))?;

        tokio::fs::write(path, &bytes).await
            .map_err(|e| format!("Write failed: {}", e))?;

        Ok(())
    }

    fn hash_prompt(&self, prompt: &str) -> String {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};
        
        let mut hasher = DefaultHasher::new();
        prompt.hash(&mut hasher);
        format!("{:x}", hasher.finish())
    }

    fn now(&self) -> u64 {
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs()
    }

    pub fn is_enabled(&self) -> bool {
        self.config.enabled
    }

    pub fn enable(&mut self) {
        self.config.enabled = true;
    }

    pub fn disable(&mut self) {
        self.config.enabled = false;
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OfflineStatus {
    pub available: bool,
    pub whisper_ready: bool,
    pub llm_ready: bool,
    pub whisper_model: String,
    pub llm_model: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranscriptionResult {
    pub text: String,
    pub confidence: f32,
    pub language: String,
    pub duration_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompletionResult {
    pub text: String,
    pub tokens_used: u32,
    pub from_cache: bool,
}

#[derive(Debug, Clone)]
pub struct DownloadProgress {
    pub model: String,
    pub progress: f32,
    pub total_mb: u32,
    pub status: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_offline_mode_creation() {
        let offline = OfflineMode::new(
            PathBuf::from("/tmp/models"),
            OfflineModeConfig::default(),
        );
        assert!(!offline.is_enabled());
    }

    #[test]
    fn test_whisper_model_info() {
        assert_eq!(WhisperModel::Base.file_name(), "ggml-base.bin");
        assert_eq!(WhisperModel::Base.size_mb(), 142);
    }
}
