//! STT (Speech-to-Text) Provider System
//!
//! Multi-provider STT system to achieve 97%+ accuracy on technical terms.
//! Supports Deepgram Nova-2, Whisper (API + local), and AssemblyAI.
//!
//! Features:
//! - Provider abstraction with fallback chain
//! - Post-processing pipeline with code vocabulary (900+ terms)
//! - File tagging detection (@mentions)
//! - Accuracy benchmarking

pub mod provider;
pub mod deepgram;
pub mod whisper;
pub mod post_processor;

// Re-exports
pub use provider::{
    SttProvider, SttProviderManager, SttConfig, AudioData, AudioFormat,
};
pub use deepgram::DeepgramProvider;
pub use whisper::WhisperProvider;
pub use post_processor::PostProcessor;
