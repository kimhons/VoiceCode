/**
 * Security Utilities
 * Provides security-related helper functions for the mobile app
 */

import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';

// Secure Storage Keys
export const SECURE_KEYS = {
  AUTH_TOKEN: 'voicecode_auth_token',
  REFRESH_TOKEN: 'voicecode_refresh_token',
  ENCRYPTION_KEY: 'voicecode_encryption_key',
  BIOMETRIC_ENABLED: 'voicecode_biometric_enabled',
  PIN_HASH: 'voicecode_pin_hash',
  LAST_AUTH_TIME: 'voicecode_last_auth_time',
} as const;

/**
 * Secure Storage Operations
 */
export async function secureStore(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED,
    });
  } catch (error) {
    console.error('Secure store error:', error);
    throw new Error('Failed to store secure data');
  }
}

export async function secureRetrieve(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error('Secure retrieve error:', error);
    return null;
  }
}

export async function secureDelete(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.error('Secure delete error:', error);
  }
}

/**
 * Biometric Authentication
 */
export async function isBiometricAvailable(): Promise<boolean> {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return compatible && enrolled;
  } catch {
    return false;
  }
}

export async function getBiometricType(): Promise<string> {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Face ID';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'Touch ID';
    }
    return 'Biometric';
  } catch {
    return 'Biometric';
  }
}

export async function authenticateWithBiometrics(
  reason: string = 'Authenticate to continue'
): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: 'Use Passcode',
      disableDeviceFallback: false,
    });
    return result.success;
  } catch {
    return false;
  }
}

/**
 * Hashing Functions
 */
export async function hashString(input: string): Promise<string> {
  return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input);
}

export async function hashPassword(password: string, salt?: string): Promise<string> {
  const saltValue = salt || (await generateSecureRandom(16));
  const combined = `${saltValue}:${password}`;
  const hash = await hashString(combined);
  return `${saltValue}:${hash}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;

  const testHash = await hashString(`${salt}:${password}`);
  return hash === testHash;
}

/**
 * Random Generation
 */
export async function generateSecureRandom(length: number): Promise<string> {
  const randomBytes = await Crypto.getRandomBytesAsync(length);
  return Array.from(randomBytes as Uint8Array)
    .map((b: number) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function generateSessionId(): Promise<string> {
  return await generateSecureRandom(32);
}

/**
 * Token Validation
 */
export function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;

    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return false;

    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

export function getTokenExpiration(token: string): Date | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return null;

    return new Date(payload.exp * 1000);
  } catch {
    return null;
  }
}

/**
 * Input Sanitization
 */
export function sanitizeInput(input: string): string {
  return input
    .replaceAll(/[<>]/g, '') // Remove HTML brackets
    .replaceAll(/javascript:/gi, '') // Remove javascript: protocol
    .replaceAll(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isStrongPassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain an uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain a lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain a number');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain a special character');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Session Management
 */
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export async function updateLastAuthTime(): Promise<void> {
  await secureStore(SECURE_KEYS.LAST_AUTH_TIME, Date.now().toString());
}

export async function isSessionValid(): Promise<boolean> {
  const lastAuthTime = await secureRetrieve(SECURE_KEYS.LAST_AUTH_TIME);
  if (!lastAuthTime) return false;

  const elapsed = Date.now() - Number.parseInt(lastAuthTime, 10);
  return elapsed < SESSION_TIMEOUT;
}

export async function clearSession(): Promise<void> {
  await Promise.all([
    secureDelete(SECURE_KEYS.AUTH_TOKEN),
    secureDelete(SECURE_KEYS.REFRESH_TOKEN),
    secureDelete(SECURE_KEYS.LAST_AUTH_TIME),
  ]);
}

/**
 * Rate Limiting
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

export function resetRateLimit(key: string): void {
  rateLimitMap.delete(key);
}
