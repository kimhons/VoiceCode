//! File Tagging via Voice
//!
//! Detects file references in voice transcriptions (like AquaVoice's "@file" mentions).
//! Supports multiple patterns:
//! - "@filename" (e.g., "@config.ts")
//! - "at filename" (e.g., "at config.ts")
//! - "tag filename" (e.g., "tag utils/helpers.rs")
//! - "include filename" (e.g., "include package.json")
//! - "from filename" (e.g., "from src/main.rs")

pub mod detector;
pub mod fuzzy_search;

// Re-exports
