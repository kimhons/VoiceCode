// PHASE 1.4: Data Encryption Commands
// Tauri commands for encryption/decryption operations

use base64::{Engine as _, engine::general_purpose::STANDARD};
use crate::encryption::{
    EncryptedData, EncryptionManager, get_global_encryption,
};
use serde::{Deserialize, Serialize};
use tauri::command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptionResult {
    pub success: bool,
    pub data: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptionStatus {
    pub initialized: bool,
    pub auto_encrypt: bool,
}

/// Initialize encryption with a generated key
#[command]
pub async fn init_encryption() -> Result<EncryptionResult, String> {
    let key = EncryptionManager::generate_key();
    
    match crate::encryption::init_global_encryption(key.clone()) {
        Ok(_) => {
            tracing::info!("Encryption initialized successfully");
            Ok(EncryptionResult {
                success: true,
                data: Some(STANDARD.encode(&key)),
                error: None,
            })
        }
        Err(e) => {
            tracing::error!("Failed to initialize encryption: {}", e);
            Ok(EncryptionResult {
                success: false,
                data: None,
                error: Some(e.to_string()),
            })
        }
    }
}

/// Initialize encryption with a password
#[command]
pub async fn init_encryption_with_password(password: String) -> Result<EncryptionResult, String> {
    match EncryptionManager::from_password(&password) {
        Ok(manager) => {
            let key = manager.get_config().key.clone();
            match crate::encryption::init_global_encryption(key) {
                Ok(_) => {
                    tracing::info!("Encryption initialized with password");
                    Ok(EncryptionResult {
                        success: true,
                        data: None,
                        error: None,
                    })
                }
                Err(e) => Ok(EncryptionResult {
                    success: false,
                    data: None,
                    error: Some(e.to_string()),
                })
            }
        }
        Err(e) => Ok(EncryptionResult {
            success: false,
            data: None,
            error: Some(e.to_string()),
        })
    }
}

/// Encrypt text data
#[command]
pub async fn encrypt_text(text: String) -> Result<EncryptionResult, String> {
    let manager = get_global_encryption()
        .ok_or_else(|| "Encryption not initialized".to_string())?;

    let result = {
        let guard = manager.lock().unwrap();
        guard.encrypt_text(&text)
    };

    match result {
        Ok(encrypted) => {
            let json = serde_json::to_string(&encrypted)
                .map_err(|e| e.to_string())?;
            let base64_data = STANDARD.encode(json);

            Ok(EncryptionResult {
                success: true,
                data: Some(base64_data),
                error: None,
            })
        }
        Err(e) => Ok(EncryptionResult {
            success: false,
            data: None,
            error: Some(e.to_string()),
        })
    }
}

/// Decrypt text data
#[command]
pub async fn decrypt_text(encrypted_base64: String) -> Result<EncryptionResult, String> {
    let manager = get_global_encryption()
        .ok_or_else(|| "Encryption not initialized".to_string())?;
    
    // Decode base64
    let json = STANDARD.decode(&encrypted_base64)
        .map_err(|e| e.to_string())?;
    
    // Parse encrypted data
    let encrypted: EncryptedData = serde_json::from_slice(&json)
        .map_err(|e| e.to_string())?;

    let result = {
        let guard = manager.lock().unwrap();
        guard.decrypt_text(&encrypted)
    };

    match result {
        Ok(text) => Ok(EncryptionResult {
            success: true,
            data: Some(text),
            error: None,
        }),
        Err(e) => Ok(EncryptionResult {
            success: false,
            data: None,
            error: Some(e.to_string()),
        })
    }
}

/// Encrypt audio data (base64 encoded)
#[command]
pub async fn encrypt_audio(audio_base64: String) -> Result<EncryptionResult, String> {
    let manager = get_global_encryption()
        .ok_or_else(|| "Encryption not initialized".to_string())?;
    
    // Decode audio data
    let audio_data = STANDARD.decode(&audio_base64)
        .map_err(|e| e.to_string())?;

    let result = {
        let guard = manager.lock().unwrap();
        guard.encrypt_audio(&audio_data)
    };

    match result {
        Ok(encrypted) => {
            let json = serde_json::to_string(&encrypted)
                .map_err(|e| e.to_string())?;
            let base64_data = STANDARD.encode(json);

            tracing::info!("Audio data encrypted, size: {} bytes", audio_data.len());

            Ok(EncryptionResult {
                success: true,
                data: Some(base64_data),
                error: None,
            })
        }
        Err(e) => Ok(EncryptionResult {
            success: false,
            data: None,
            error: Some(e.to_string()),
        })
    }
}

/// Decrypt audio data (returns base64 encoded)
#[command]
pub async fn decrypt_audio(encrypted_base64: String) -> Result<EncryptionResult, String> {
    let manager = get_global_encryption()
        .ok_or_else(|| "Encryption not initialized".to_string())?;
    
    // Decode base64
    let json = STANDARD.decode(&encrypted_base64)
        .map_err(|e| e.to_string())?;
    
    // Parse encrypted data
    let encrypted: EncryptedData = serde_json::from_slice(&json)
        .map_err(|e| e.to_string())?;

    let result = {
        let guard = manager.lock().unwrap();
        guard.decrypt_audio(&encrypted)
    };

    match result {
        Ok(audio_data) => {
            let base64_audio = STANDARD.encode(&audio_data);

            tracing::info!("Audio data decrypted, size: {} bytes", audio_data.len());

            Ok(EncryptionResult {
                success: true,
                data: Some(base64_audio),
                error: None,
            })
        }
        Err(e) => Ok(EncryptionResult {
            success: false,
            data: None,
            error: Some(e.to_string()),
        })
    }
}

/// Get encryption status
#[command]
pub async fn get_encryption_status() -> Result<EncryptionStatus, String> {
    let initialized = get_global_encryption().is_some();
    
    let auto_encrypt = if let Some(manager) = get_global_encryption() {
        manager.lock().unwrap().get_config().auto_encrypt
    } else {
        false
    };
    
    Ok(EncryptionStatus {
        initialized,
        auto_encrypt,
    })
}

/// Enable/disable auto-encryption
#[command]
pub async fn set_auto_encrypt(enabled: bool) -> Result<EncryptionResult, String> {
    let manager = get_global_encryption()
        .ok_or_else(|| "Encryption not initialized".to_string())?;
    
    manager.lock().unwrap().set_auto_encrypt(enabled);
    
    tracing::info!("Auto-encryption set to: {}", enabled);
    
    Ok(EncryptionResult {
        success: true,
        data: None,
        error: None,
    })
}

/// Generate a new encryption key
#[command]
pub async fn generate_encryption_key() -> Result<String, String> {
    let key = EncryptionManager::generate_key();
    Ok(STANDARD.encode(&key))
}

/// Encrypt transcription data
#[command]
pub async fn encrypt_transcription(
    transcription: String,
    metadata: Option<String>,
) -> Result<EncryptionResult, String> {
    let manager = get_global_encryption()
        .ok_or_else(|| "Encryption not initialized".to_string())?;
    
    // Combine transcription and metadata
    let data = if let Some(meta) = metadata {
        format!("{}|{}", transcription, meta)
    } else {
        transcription
    };

    let result = {
        let guard = manager.lock().unwrap();
        guard.encrypt_text(&data)
    };

    match result {
        Ok(encrypted) => {
            let json = serde_json::to_string(&encrypted)
                .map_err(|e| e.to_string())?;
            let base64_data = STANDARD.encode(json);

            tracing::info!("Transcription encrypted");

            Ok(EncryptionResult {
                success: true,
                data: Some(base64_data),
                error: None,
            })
        }
        Err(e) => Ok(EncryptionResult {
            success: false,
            data: None,
            error: Some(e.to_string()),
        })
    }
}

/// Decrypt transcription data
#[command]
pub async fn decrypt_transcription(encrypted_base64: String) -> Result<EncryptionResult, String> {
    decrypt_text(encrypted_base64).await
}

