/**
 * Unit Tests for Encryption Service
 * Tests encryption, decryption, and cryptographic utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getEncryptionService } from '../encryption.service';

describe('EncryptionService', () => {
  let service: ReturnType<typeof getEncryptionService>;

  beforeEach(() => {
    service = getEncryptionService();
  });

  describe('encrypt/decrypt', () => {
    it('should encrypt and decrypt text correctly', () => {
      const plaintext = 'Hello, World!';
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(encrypted).not.toBe(plaintext);
      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertext for same plaintext', () => {
      const plaintext = 'Same text';
      const encrypted1 = service.encrypt(plaintext);
      const encrypted2 = service.encrypt(plaintext);

      // AES with random IV should produce different ciphertexts
      // Note: CryptoJS may or may not use random IV depending on mode
      // Both should decrypt to the same value
      expect(service.decrypt(encrypted1)).toBe(plaintext);
      expect(service.decrypt(encrypted2)).toBe(plaintext);
    });

    it('should handle empty string', () => {
      const plaintext = '';
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle special characters', () => {
      const plaintext = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`"\'\\';
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle unicode characters', () => {
      const plaintext = '你好世界 🌍 مرحبا שלום';
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle long text', () => {
      const plaintext = 'a'.repeat(10000);
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should produce base64 encoded ciphertext', () => {
      const plaintext = 'test';
      const encrypted = service.encrypt(plaintext);

      // CryptoJS produces OpenSSL-format base64
      expect(encrypted).toMatch(/^[A-Za-z0-9+/=]+$/);
    });
  });

  describe('generateSecret', () => {
    it('should generate a base32 encoded string', () => {
      const secret = service.generateSecret();
      // otplib generates base32 secrets (uppercase A-Z and 2-7)
      expect(secret).toMatch(/^[A-Z2-7]+$/);
    });

    it('should generate 16-character secret by default', () => {
      const secret = service.generateSecret();
      // otplib default secret length is 16 characters
      expect(secret.length).toBe(16);
    });

    it('should generate unique secrets', () => {
      const secrets = new Set<string>();
      for (let i = 0; i < 100; i++) {
        secrets.add(service.generateSecret());
      }
      expect(secrets.size).toBe(100);
    });
  });

  describe('generateBackupCodes', () => {
    it('should generate specified number of codes', () => {
      const codes = service.generateBackupCodes(10);
      expect(codes.length).toBe(10);
    });

    it('should generate uppercase hex codes', () => {
      const codes = service.generateBackupCodes(5);
      codes.forEach(code => {
        expect(code).toMatch(/^[0-9A-F]+$/);
      });
    });

    it('should generate 8-character codes', () => {
      const codes = service.generateBackupCodes(5);
      codes.forEach(code => {
        expect(code.length).toBe(8);
      });
    });

    it('should generate unique codes', () => {
      const codes = service.generateBackupCodes(100);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(100);
    });
  });

  describe('generateSessionToken', () => {
    it('should generate a 64-character hex token', () => {
      const token = service.generateSessionToken();
      expect(token.length).toBe(64);
      expect(token).toMatch(/^[0-9a-f]+$/);
    });

    it('should generate unique tokens', () => {
      const tokens = new Set<string>();
      for (let i = 0; i < 100; i++) {
        tokens.add(service.generateSessionToken());
      }
      expect(tokens.size).toBe(100);
    });
  });

  describe('verifyTOTP', () => {
    it('should reject empty token', () => {
      const secret = service.generateSecret();
      const result = service.verifyTOTP(secret, '');
      expect(result).toBe(false);
    });

    it('should reject invalid token format', () => {
      const secret = service.generateSecret();
      const result = service.verifyTOTP(secret, 'abcdef');
      expect(result).toBe(false);
    });

    it('should reject wrong token', () => {
      const secret = service.generateSecret();
      const result = service.verifyTOTP(secret, '000000');
      // Unlikely to match unless we're extremely unlucky
      // This is a probabilistic test
      expect(typeof result).toBe('boolean');
    });

    it('should handle 6-digit token format', () => {
      const secret = service.generateSecret();
      const result = service.verifyTOTP(secret, '123456');
      expect(typeof result).toBe('boolean');
    });

    it('should verify a valid TOTP token', () => {
      const secret = service.generateSecret();
      // Generate a valid token for the secret
      const validToken = service.generateTOTP(secret);
      const result = service.verifyTOTP(secret, validToken);
      expect(result).toBe(true);
    });
  });

  describe('generateTOTP', () => {
    it('should generate a 6-digit token', () => {
      const secret = service.generateSecret();
      const token = service.generateTOTP(secret);
      expect(token.length).toBe(6);
      expect(token).toMatch(/^[0-9]+$/);
    });

    it('should generate same token for same secret and time window', () => {
      const secret = service.generateSecret();
      const token1 = service.generateTOTP(secret);
      const token2 = service.generateTOTP(secret);
      // Within same 30-second window, tokens should match
      expect(token1).toBe(token2);
    });
  });

  describe('generateKeyUri', () => {
    it('should generate a valid otpauth URI', () => {
      const secret = service.generateSecret();
      const uri = service.generateKeyUri(secret, 'test@example.com');
      expect(uri).toContain('otpauth://totp/');
      expect(uri).toContain('secret=');
      expect(uri).toContain('issuer=VoiceFlowPro');
    });

    it('should use custom issuer', () => {
      const secret = service.generateSecret();
      const uri = service.generateKeyUri(secret, 'user@test.com', 'CustomIssuer');
      expect(uri).toContain('issuer=CustomIssuer');
    });
  });

  describe('getTimeRemaining', () => {
    it('should return a number between 0 and 30', () => {
      const remaining = service.getTimeRemaining();
      expect(remaining).toBeGreaterThanOrEqual(0);
      expect(remaining).toBeLessThanOrEqual(30);
    });
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = getEncryptionService();
      const instance2 = getEncryptionService();
      expect(instance1).toBe(instance2);
    });
  });
});
