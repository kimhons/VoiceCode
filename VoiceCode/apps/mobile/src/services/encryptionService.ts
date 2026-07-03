/**
 * Encryption Service
 * Phase 3 Week 9 Day 59-60: Advanced Security & Compliance
 * 
 * Handles End-to-End Encryption (E2EE) for sensitive data
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase.service';

// ============================================================================
// TYPES
// ============================================================================

export interface EncryptionKey {
  id: string;
  workspace_id: string;
  key_version: number;
  algorithm: 'AES-256-GCM';
  created_at: string;
  rotated_at?: string;
  status: 'active' | 'rotated' | 'revoked';
}

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  tag: string;
  key_version: number;
}

// ============================================================================
// ENCRYPTION SERVICE
// ============================================================================

class EncryptionService {
  private readonly STORAGE_KEY_PREFIX = '@VoiceCode_encryption_key_';

  /**
   * Generate a new encryption key for a workspace
   * In production, this would use native crypto APIs
   */
  async generateKey(workspaceId: string): Promise<EncryptionKey> {
    // In production, use: crypto.subtle.generateKey() or native modules
    // For now, we'll create a placeholder key record
    
    const { data, error } = await supabase
      .from('encryption_keys')
      .insert({
        workspace_id: workspaceId,
        key_version: 1,
        algorithm: 'AES-256-GCM',
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;

    // In production: Store the actual key securely in device keychain
    // For now, generate a random key and store in AsyncStorage (NOT SECURE - demo only)
    const keyMaterial = this.generateRandomKey();
    await this.storeKey(workspaceId, data.key_version, keyMaterial);

    return data;
  }

  /**
   * Get active encryption key for a workspace
   */
  async getActiveKey(workspaceId: string): Promise<EncryptionKey | null> {
    const { data, error } = await supabase
      .from('encryption_keys')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'active')
      .order('key_version', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Rotate encryption key
   */
  async rotateKey(workspaceId: string): Promise<EncryptionKey> {
    // Mark current key as rotated
    const currentKey = await this.getActiveKey(workspaceId);
    if (currentKey) {
      await supabase
        .from('encryption_keys')
        .update({ status: 'rotated', rotated_at: new Date().toISOString() })
        .eq('id', currentKey.id);
    }

    // Generate new key
    const newVersion = (currentKey?.key_version || 0) + 1;
    const { data, error } = await supabase
      .from('encryption_keys')
      .insert({
        workspace_id: workspaceId,
        key_version: newVersion,
        algorithm: 'AES-256-GCM',
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;

    // Store new key material
    const keyMaterial = this.generateRandomKey();
    await this.storeKey(workspaceId, newVersion, keyMaterial);

    return data;
  }

  /**
   * Encrypt data (placeholder - use native crypto in production)
   */
  async encrypt(workspaceId: string, plaintext: string): Promise<EncryptedData> {
    const key = await this.getActiveKey(workspaceId);
    if (!key) {
      throw new Error('No active encryption key found');
    }

    // In production: Use crypto.subtle.encrypt() or native crypto module
    // This is a PLACEHOLDER implementation for demo purposes
    const iv = this.generateRandomBytes(12);
    const tag = this.generateRandomBytes(16);
    
    // Simple base64 encoding as placeholder (NOT SECURE - demo only)
    const ciphertext = Buffer.from(plaintext).toString('base64');

    return {
      ciphertext,
      iv,
      tag,
      key_version: key.key_version,
    };
  }

  /**
   * Decrypt data (placeholder - use native crypto in production)
   */
  async decrypt(workspaceId: string, encrypted: EncryptedData): Promise<string> {
    // In production: Use crypto.subtle.decrypt() or native crypto module
    // This is a PLACEHOLDER implementation for demo purposes
    
    // Simple base64 decoding as placeholder (NOT SECURE - demo only)
    const plaintext = Buffer.from(encrypted.ciphertext, 'base64').toString('utf-8');
    
    return plaintext;
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private generateRandomKey(): string {
    // In production: Use crypto.getRandomValues() or native secure random
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private generateRandomBytes(length: number): string {
    // In production: Use crypto.getRandomValues()
    return Array.from({ length }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');
  }

  private async storeKey(workspaceId: string, version: number, keyMaterial: string): Promise<void> {
    // In production: Use device keychain (react-native-keychain)
    const storageKey = `${this.STORAGE_KEY_PREFIX}${workspaceId}_v${version}`;
    await AsyncStorage.setItem(storageKey, keyMaterial);
  }

  private async retrieveKey(workspaceId: string, version: number): Promise<string | null> {
    const storageKey = `${this.STORAGE_KEY_PREFIX}${workspaceId}_v${version}`;
    return await AsyncStorage.getItem(storageKey);
  }
}

export const encryptionService = new EncryptionService();

