// VoiceCode Mobile - Encryption Utilities
// End-to-end encryption for sensitive data

import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const ENCRYPTION_KEY_NAME = 'voicecode_encryption_key';

/**
 * Generate encryption key
 */
export async function generateEncryptionKey(): Promise<string> {
  const key = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    Math.random().toString(36) + Date.now().toString(36)
  );
  
  await SecureStore.setItemAsync(ENCRYPTION_KEY_NAME, key);
  return key;
}

/**
 * Get or create encryption key
 */
export async function getEncryptionKey(): Promise<string> {
  let key = await SecureStore.getItemAsync(ENCRYPTION_KEY_NAME);
  
  if (!key) {
    key = await generateEncryptionKey();
  }
  
  return key;
}

/**
 * Encrypt data
 */
export async function encryptData(data: string): Promise<string> {
  const key = await getEncryptionKey();
  
  // Simple XOR encryption for demo (use proper AES in production)
  const bytes = Buffer.from(data);
  const xored = Buffer.alloc(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    xored[i] = bytes[i] ^ key.charCodeAt(i % key.length);
  }
  return xored.toString('base64');
}

/**
 * Decrypt data
 */
export async function decryptData(encryptedData: string): Promise<string> {
  const key = await getEncryptionKey();
  
  // Simple XOR decryption for demo (use proper AES in production)
  const bytes = Buffer.from(encryptedData, 'base64');
  const xored = Buffer.alloc(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    xored[i] = bytes[i] ^ key.charCodeAt(i % key.length);
  }
  return xored.toString();
}

/**
 * Hash password
 */
export async function hashPassword(password: string): Promise<string> {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password
  );
}

/**
 * Verify password
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

/**
 * Generate random token
 */
export async function generateToken(length: number = 32): Promise<string> {
  const randomBytes = await Crypto.getRandomBytesAsync(length);
  return Buffer.from(randomBytes).toString('hex');
}

/**
 * Encrypt object
 */
export async function encryptObject(obj: any): Promise<string> {
  const json = JSON.stringify(obj);
  return await encryptData(json);
}

/**
 * Decrypt object
 */
export async function decryptObject<T>(encrypted: string): Promise<T> {
  const json = await decryptData(encrypted);
  return JSON.parse(json);
}
