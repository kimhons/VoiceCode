//! Input validation module for VoiceFlow Pro
//! Provides secure input validation for all user-provided data

use crate::errors::{AppError, ValidationError};
use regex::Regex;
use std::path::{Path, PathBuf};
use sanitize_filename::sanitize_with_options;
use sanitize_filename::Options;

/// Maximum length for text inputs
pub const MAX_TEXT_LENGTH: usize = 50000;
/// Minimum length for text inputs
pub const MIN_TEXT_LENGTH: usize = 1;
/// Maximum file size (10MB)
pub const MAX_FILE_SIZE: usize = 10 * 1024 * 1024;
/// Maximum path length
pub const MAX_PATH_LENGTH: usize = 4096;

/// Validates and sanitizes text input
pub fn validate_text(input: &str, min_length: Option<usize>, max_length: Option<usize>) -> Result<String, AppError> {
    // Check for empty input
    if input.trim().is_empty() {
        return Err(AppError::Validation(ValidationError::EmptyInput));
    }

    // Check minimum length
    let min_len = min_length.unwrap_or(MIN_TEXT_LENGTH);
    if input.len() < min_len {
        return Err(AppError::Validation(ValidationError::TextTooShort(input.len(), min_len)));
    }

    // Check maximum length
    let max_len = max_length.unwrap_or(MAX_TEXT_LENGTH);
    if input.len() > max_len {
        return Err(AppError::Validation(ValidationError::TextTooLong(input.len(), max_len)));
    }

    // Check for invalid characters
    if contains_invalid_characters(input) {
        return Err(AppError::Validation(ValidationError::InvalidCharacters(
            "Input contains invalid or dangerous characters".to_string()
        )));
    }

    Ok(input.to_string())
}

/// Validates and sanitizes file path
pub fn validate_file_path(path: &str) -> Result<PathBuf, AppError> {
    // Check path length
    if path.len() > MAX_PATH_LENGTH {
        return Err(AppError::Validation(ValidationError::InputTooLong(
            path.len(),
            MAX_PATH_LENGTH
        )));
    }

    // Check for path traversal attempts
    if path.contains("..") || path.contains("~/") {
        return Err(AppError::Validation(ValidationError::PathTraversal(
            "Path traversal detected".to_string()
        )));
    }

    // Sanitize the path
    let sanitized = sanitize_with_options(path, Options {
        windows: false,
        remove_trailing_dots: true,
        remove_trailing_spaces: true,
        ..Default::default()
    });

    // Check if sanitized path is different (indicating dangerous input)
    if sanitized != path {
        return Err(AppError::Validation(ValidationError::PathTraversal(
            "Path contained invalid characters".to_string()
        )));
    }

    Ok(PathBuf::from(sanitized))
}

/// Validates and sanitizes filename
pub fn validate_filename(filename: &str) -> Result<String, AppError> {
    if filename.is_empty() {
        return Err(AppError::Validation(ValidationError::EmptyInput));
    }

    if filename.len() > 255 {
        return Err(AppError::Validation(ValidationError::InputTooLong(
            filename.len(),
            255
        )));
    }

    let sanitized = sanitize_with_options(filename, Options {
        windows: true,
        remove_trailing_dots: true,
        remove_trailing_spaces: true,
        ..Default::default()
    });

    if sanitized != filename || sanitized.is_empty() {
        return Err(AppError::Validation(ValidationError::InvalidCharacters(
            "Invalid filename".to_string()
        )));
    }

    // Check for dangerous extensions
    let forbidden_extensions = [".exe", ".dll", ".so", ".dylib", ".bat", ".sh", ".ps1"];
    let extension = Path::new(filename)
        .extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("");

    if forbidden_extensions.iter().any(|ext| extension == &ext[1..]) {
        return Err(AppError::Validation(ValidationError::InvalidFileType(
            "Forbidden file type".to_string()
        )));
    }

    Ok(sanitized)
}

/// Validates language code
pub fn validate_language_code(code: &str) -> Result<String, AppError> {
    if code.is_empty() {
        return Err(AppError::Validation(ValidationError::InvalidCharacters(
            "Empty language code".to_string()
        )));
    }

    // Language code should be format like "en-US", "es-ES", etc.
    let language_regex = Regex::new(r"^[a-z]{2}(-[A-Z]{2})?$").unwrap();
    
    if !language_regex.is_match(code) {
        return Err(AppError::Validation(ValidationError::InvalidCharacters(
            "Invalid language code format".to_string()
        )));
    }

    Ok(code.to_string())
}

/// Validates hotkey combination
pub fn validate_hotkey(hotkey: &str) -> Result<String, AppError> {
    if hotkey.is_empty() {
        return Err(AppError::Validation(ValidationError::InvalidHotkey(
            "Empty hotkey".to_string()
        )));
    }

    if hotkey.len() > 50 {
        return Err(AppError::Validation(ValidationError::InvalidHotkey(
            "Hotkey too long".to_string()
        )));
    }

    // Basic hotkey validation - should contain recognized modifiers and keys
    let valid_modifiers = ["Ctrl", "Alt", "Shift", "Cmd", "CmdOrCtrl"];
    let valid_keys = ["Space", "Enter", "Escape", "Tab", "F1", "F2", "F3", "F4", "F5", "F6", 
                     "F7", "F8", "F9", "F10", "F11", "F12", "A", "B", "C", "D", "E", "F", 
                     "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", 
                     "T", "U", "V", "W", "X", "Y", "Z", "0", "1", "2", "3", "4", "5", 
                     "6", "7", "8", "9"];

    // Check if hotkey contains at least one recognized key
    let has_valid_key = valid_keys.iter().any(|key| hotkey.contains(key));
    if !has_valid_key {
        return Err(AppError::Validation(ValidationError::InvalidHotkey(
            "Hotkey must contain a valid key".to_string()
        )));
    }

    Ok(hotkey.to_string())
}

/// Validates configuration values
pub fn validate_config_value(value: &str, config_type: &str) -> Result<String, AppError> {
    if value.is_empty() {
        return Err(AppError::Validation(ValidationError::InvalidConfigValue(
            format!("Empty {} value", config_type)
        )));
    }

    match config_type {
        "language" => validate_language_code(value),
        "theme" => {
            let valid_themes = ["light", "dark", "auto"];
            if !valid_themes.iter().any(|&theme| theme == value) {
                return Err(AppError::Validation(ValidationError::InvalidConfigValue(
                    format!("Invalid theme: {}. Valid themes: {:?}", value, valid_themes)
                )));
            }
            Ok(value.to_string())
        }
        "tone" => {
            let valid_tones = ["professional", "friendly", "formal", "casual", "empathetic", 
                              "confident", "persuasive", "neutral"];
            if !valid_tones.iter().any(|&tone| tone == value) {
                return Err(AppError::Validation(ValidationError::InvalidConfigValue(
                    format!("Invalid tone: {}. Valid tones: {:?}", value, valid_tones)
                )));
            }
            Ok(value.to_string())
        }
        "context" => {
            let valid_contexts = ["email", "code", "document", "social", "formal", 
                                 "casual", "technical", "creative"];
            if !valid_contexts.iter().any(|&context| context == value) {
                return Err(AppError::Validation(ValidationError::InvalidConfigValue(
                    format!("Invalid context: {}. Valid contexts: {:?}", value, valid_contexts)
                )));
            }
            Ok(value.to_string())
        }
        _ => {
            if value.len() > 1000 {
                return Err(AppError::Validation(ValidationError::InputTooLong(
                    value.len(),
                    1000
                )));
            }
            Ok(value.to_string())
        }
    }
}

/// Checks if input contains invalid characters
fn contains_invalid_characters(input: &str) -> bool {
    // Check for control characters (except tabs and newlines)
    for (i, ch) in input.char_indices() {
        if ch.is_control() && ch != '\t' && ch != '\n' {
            return true;
        }
    }

    // Check for script injection patterns
    let script_patterns = [
        "<script", "</script", "javascript:", "data:", "vbscript:", 
        "onload", "onerror", "onclick", "onmouseover"
    ];
    
    let lower_input = input.to_lowercase();
    script_patterns.iter().any(|pattern| lower_input.contains(pattern))
}

/// Validates numeric value is within range
pub fn validate_numeric_value<T: PartialOrd + std::fmt::Display>(
    value: T,
    min: T,
    max: T,
    value_name: &str
) -> Result<T, AppError> {
    if value < min || value > max {
        return Err(AppError::Validation(ValidationError::InvalidConfigValue(
            format!("{} must be between {} and {}, got {}", value_name, min, max, value)
        )));
    }
    Ok(value)
}

/// Validates audio file metadata
pub fn validate_audio_metadata(duration: f32, sample_rate: u32, channels: u32) -> Result<(), AppError> {
    // Check duration (max 1 hour)
    if duration > 3600.0 {
        return Err(AppError::Validation(ValidationError::InvalidConfigValue(
            "Audio duration cannot exceed 1 hour".to_string()
        )));
    }

    // Check sample rate (reasonable range)
    if sample_rate < 8000 || sample_rate > 192000 {
        return Err(AppError::Validation(ValidationError::InvalidConfigValue(
            format!("Invalid sample rate: {} (must be between 8000 and 192000)", sample_rate)
        )));
    }

    // Check channels (mono or stereo)
    if channels < 1 || channels > 2 {
        return Err(AppError::Validation(ValidationError::InvalidConfigValue(
            format!("Invalid number of channels: {} (must be 1 or 2)", channels)
        )));
    }

    Ok(())
}

/// Validates file size
pub fn validate_file_size(size: u64) -> Result<u64, AppError> {
    if size == 0 {
        return Err(AppError::Validation(ValidationError::EmptyInput));
    }

    if size > MAX_FILE_SIZE as u64 {
        return Err(AppError::Validation(ValidationError::FileTooLarge(
            size,
            MAX_FILE_SIZE as u64
        )));
    }

    Ok(size)
}

/// Secure string sanitization for HTML output
pub fn sanitize_for_html(input: &str) -> String {
    input
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&#x27;")
}