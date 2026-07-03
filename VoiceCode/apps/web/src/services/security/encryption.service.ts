/**
 * Encryption Service
 * Handles data encryption/decryption and cryptographic utilities
 *
 * Uses otplib for robust TOTP implementation (RFC 6238 compliant)
 */

import CryptoJS from 'crypto-js';
import { authenticator } from 'otplib';

// Configure otplib for better security
authenticator.options = {
  window: 1, // Allow 1 step before/after for clock drift
  step: 30,  // 30 second time step (default)
};

class EncryptionService {
  private encryptionKey: string;

  constructor() {
    const envKey = import.meta.env.VITE_ENCRYPTION_KEY;

    if (!envKey && import.meta.env.PROD) {
      console.error('[EncryptionService] CRITICAL: VITE_ENCRYPTION_KEY is required in production');
      this.encryptionKey = crypto.randomUUID();
    } else {
      this.encryptionKey = envKey || 'dev-only-key-not-for-production';
    }
  }

  encrypt(text: string): string {
    return CryptoJS.AES.encrypt(text, this.encryptionKey).toString();
  }

  decrypt(ciphertext: string): string {
    const bytes = CryptoJS.AES.decrypt(ciphertext, this.encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Generate a TOTP secret using otplib
   * Returns a base32 encoded secret suitable for authenticator apps
   */
  generateSecret(): string {
    return authenticator.generateSecret();
  }

  /**
   * Generate backup codes for account recovery
   */
  generateBackupCodes(count: number): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(CryptoJS.lib.WordArray.random(4).toString(CryptoJS.enc.Hex).toUpperCase());
    }
    return codes;
  }

  /**
   * Generate a secure session token
   */
  generateSessionToken(): string {
    return CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex);
  }

  /**
   * Verify a TOTP token using otplib
   * RFC 6238 compliant implementation
   */
  verifyTOTP(secret: string, token: string): boolean {
    try {
      return authenticator.verify({ token, secret });
    } catch {
      return false;
    }
  }

  /**
   * Generate a TOTP token for the current time (useful for testing)
   */
  generateTOTP(secret: string): string {
    return authenticator.generate(secret);
  }

  /**
   * Generate a key URI for QR code display in authenticator apps
   */
  generateKeyUri(secret: string, accountName: string, issuer: string = 'VoiceCode'): string {
    return authenticator.keyuri(accountName, issuer, secret);
  }

  /**
   * Check remaining seconds until next TOTP token
   */
  getTimeRemaining(): number {
    return authenticator.timeRemaining();
  }
}

let encryptionInstance: EncryptionService | null = null;

export function getEncryptionService(): EncryptionService {
  if (!encryptionInstance) {
    encryptionInstance = new EncryptionService();
  }
  return encryptionInstance;
}

export default EncryptionService;
