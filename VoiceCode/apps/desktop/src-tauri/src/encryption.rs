// PHASE 1.4: Data Encryption Implementation
// AES-256-GCM encryption for audio and transcription data

use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Nonce,
};
use argon2::{
    password_hash::{PasswordHasher, SaltString},
    Argon2,
};
use rand::RngCore;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use thiserror::Error;

/// Encryption errors
#[derive(Error, Debug)]
pub enum EncryptionError {
    #[error("Encryption failed: {0}")]
    EncryptionFailed(String),
    
    #[error("Decryption failed: {0}")]
    DecryptionFailed(String),
    
    #[error("Key derivation failed: {0}")]
    KeyDerivationFailed(String),
    
    #[error("Invalid key length")]
    InvalidKeyLength,
    
    #[error("Invalid nonce")]
    InvalidNonce,
}

/// Encrypted data container
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptedData {
    pub ciphertext: Vec<u8>,
    pub nonce: Vec<u8>,
    pub salt: Option<Vec<u8>>,
}

/// Encryption configuration
#[derive(Debug, Clone)]
pub struct EncryptionConfig {
    pub key: Vec<u8>,
    pub auto_encrypt: bool,
}

/// Encryption manager for handling all encryption operations
pub struct EncryptionManager {
    cipher: Arc<Aes256Gcm>,
    config: EncryptionConfig,
}

impl EncryptionManager {
    /// Create a new encryption manager with a provided key
    pub fn new(key: Vec<u8>) -> Result<Self, EncryptionError> {
        if key.len() != 32 {
            return Err(EncryptionError::InvalidKeyLength);
        }

        let cipher = Aes256Gcm::new_from_slice(&key)
            .map_err(|e| EncryptionError::EncryptionFailed(e.to_string()))?;

        Ok(Self {
            cipher: Arc::new(cipher),
            config: EncryptionConfig {
                key,
                auto_encrypt: true,
            },
        })
    }

    /// Create a new encryption manager with a password-derived key
    pub fn from_password(password: &str) -> Result<Self, EncryptionError> {
        let salt = SaltString::generate(&mut OsRng);
        let key = Self::derive_key_from_password(password, salt.as_str())?;
        Self::new(key)
    }

    /// Generate a random encryption key
    pub fn generate_key() -> Vec<u8> {
        let mut key = vec![0u8; 32];
        OsRng.fill_bytes(&mut key);
        key
    }

    /// Derive a key from a password using Argon2
    pub fn derive_key_from_password(password: &str, salt: &str) -> Result<Vec<u8>, EncryptionError> {
        let argon2 = Argon2::default();
        let salt_string = SaltString::from_b64(salt)
            .map_err(|e| EncryptionError::KeyDerivationFailed(e.to_string()))?;

        let password_hash = argon2
            .hash_password(password.as_bytes(), &salt_string)
            .map_err(|e| EncryptionError::KeyDerivationFailed(e.to_string()))?;

        let hash = password_hash.hash.ok_or_else(|| {
            EncryptionError::KeyDerivationFailed("No hash generated".to_string())
        })?;

        Ok(hash.as_bytes()[..32].to_vec())
    }

    /// Encrypt data
    pub fn encrypt(&self, plaintext: &[u8]) -> Result<EncryptedData, EncryptionError> {
        // Generate a random nonce
        let mut nonce_bytes = [0u8; 12];
        OsRng.fill_bytes(&mut nonce_bytes);
        let nonce = Nonce::from_slice(&nonce_bytes);

        // Encrypt the data
        let ciphertext = self
            .cipher
            .encrypt(nonce, plaintext)
            .map_err(|e| EncryptionError::EncryptionFailed(e.to_string()))?;

        Ok(EncryptedData {
            ciphertext,
            nonce: nonce_bytes.to_vec(),
            salt: None,
        })
    }

    /// Decrypt data
    pub fn decrypt(&self, encrypted: &EncryptedData) -> Result<Vec<u8>, EncryptionError> {
        if encrypted.nonce.len() != 12 {
            return Err(EncryptionError::InvalidNonce);
        }

        let nonce = Nonce::from_slice(&encrypted.nonce);

        let plaintext = self
            .cipher
            .decrypt(nonce, encrypted.ciphertext.as_ref())
            .map_err(|e| EncryptionError::DecryptionFailed(e.to_string()))?;

        Ok(plaintext)
    }

    /// Encrypt text (UTF-8 string)
    pub fn encrypt_text(&self, text: &str) -> Result<EncryptedData, EncryptionError> {
        self.encrypt(text.as_bytes())
    }

    /// Decrypt text (UTF-8 string)
    pub fn decrypt_text(&self, encrypted: &EncryptedData) -> Result<String, EncryptionError> {
        let plaintext = self.decrypt(encrypted)?;
        String::from_utf8(plaintext)
            .map_err(|e| EncryptionError::DecryptionFailed(format!("Invalid UTF-8: {}", e)))
    }

    /// Encrypt audio data
    pub fn encrypt_audio(&self, audio_data: &[u8]) -> Result<EncryptedData, EncryptionError> {
        self.encrypt(audio_data)
    }

    /// Decrypt audio data
    pub fn decrypt_audio(&self, encrypted: &EncryptedData) -> Result<Vec<u8>, EncryptionError> {
        self.decrypt(encrypted)
    }

    /// Encrypt and encode to base64 (for storage/transmission)
    pub fn encrypt_to_base64(&self, plaintext: &[u8]) -> Result<String, EncryptionError> {
        let encrypted = self.encrypt(plaintext)?;
        let json = serde_json::to_string(&encrypted)
            .map_err(|e| EncryptionError::EncryptionFailed(e.to_string()))?;
        Ok(base64::encode(json))
    }

    /// Decrypt from base64
    pub fn decrypt_from_base64(&self, base64_data: &str) -> Result<Vec<u8>, EncryptionError> {
        let json = base64::decode(base64_data)
            .map_err(|e| EncryptionError::DecryptionFailed(e.to_string()))?;
        let encrypted: EncryptedData = serde_json::from_slice(&json)
            .map_err(|e| EncryptionError::DecryptionFailed(e.to_string()))?;
        self.decrypt(&encrypted)
    }

    /// Get encryption configuration
    pub fn get_config(&self) -> &EncryptionConfig {
        &self.config
    }

    /// Enable/disable auto-encryption
    pub fn set_auto_encrypt(&mut self, enabled: bool) {
        self.config.auto_encrypt = enabled;
    }
}

/// Global encryption manager
static ENCRYPTION_MANAGER: once_cell::sync::OnceCell<Arc<std::sync::Mutex<EncryptionManager>>> =
    once_cell::sync::OnceCell::new();

/// Initialize global encryption manager
pub fn init_global_encryption(key: Vec<u8>) -> Result<(), EncryptionError> {
    let manager = EncryptionManager::new(key)?;
    ENCRYPTION_MANAGER
        .set(Arc::new(std::sync::Mutex::new(manager)))
        .map_err(|_| EncryptionError::EncryptionFailed("Already initialized".to_string()))?;
    Ok(())
}

/// Get global encryption manager
pub fn get_global_encryption() -> Option<Arc<std::sync::Mutex<EncryptionManager>>> {
    ENCRYPTION_MANAGER.get().cloned()
}

/// Encrypt data using global manager
pub fn encrypt_global(data: &[u8]) -> Result<EncryptedData, EncryptionError> {
    let manager = get_global_encryption()
        .ok_or_else(|| EncryptionError::EncryptionFailed("Not initialized".to_string()))?;
    let result = manager.lock().unwrap().encrypt(data);
    result
}

/// Decrypt data using global manager
pub fn decrypt_global(encrypted: &EncryptedData) -> Result<Vec<u8>, EncryptionError> {
    let manager = get_global_encryption()
        .ok_or_else(|| EncryptionError::DecryptionFailed("Not initialized".to_string()))?;
    let result = manager.lock().unwrap().decrypt(encrypted);
    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encryption_decryption() {
        let key = EncryptionManager::generate_key();
        let manager = EncryptionManager::new(key).unwrap();

        let plaintext = b"Hello, World!";
        let encrypted = manager.encrypt(plaintext).unwrap();
        let decrypted = manager.decrypt(&encrypted).unwrap();

        assert_eq!(plaintext, decrypted.as_slice());
    }

    #[test]
    fn test_text_encryption() {
        let key = EncryptionManager::generate_key();
        let manager = EncryptionManager::new(key).unwrap();

        let text = "Sensitive transcription data";
        let encrypted = manager.encrypt_text(text).unwrap();
        let decrypted = manager.decrypt_text(&encrypted).unwrap();

        assert_eq!(text, decrypted);
    }

    #[test]
    fn test_base64_encryption() {
        let key = EncryptionManager::generate_key();
        let manager = EncryptionManager::new(key).unwrap();

        let data = b"Audio data to encrypt";
        let base64_encrypted = manager.encrypt_to_base64(data).unwrap();
        let decrypted = manager.decrypt_from_base64(&base64_encrypted).unwrap();

        assert_eq!(data, decrypted.as_slice());
    }

    #[test]
    fn test_invalid_key_length() {
        let invalid_key = vec![0u8; 16]; // Wrong length
        let result = EncryptionManager::new(invalid_key);
        assert!(result.is_err());
    }

    #[test]
    fn test_password_derivation() {
        let password = "my_secure_password";
        let manager = EncryptionManager::from_password(password).unwrap();

        let text = "Test data";
        let encrypted = manager.encrypt_text(text).unwrap();
        let decrypted = manager.decrypt_text(&encrypted).unwrap();

        assert_eq!(text, decrypted);
    }
}

