/**
 * Offline Storage Service
 * Phase 2.3: Cloud Sync & Storage
 * 
 * Provides offline-first storage using IndexedDB
 */

import { Transcript } from './supabase.service';

const DB_NAME = 'voiceflow_pro';
const DB_VERSION = 1;
const TRANSCRIPTS_STORE = 'transcripts';
const METADATA_STORE = 'metadata';

export interface StorageMetadata {
  key: string;
  value: any;
  updated_at: string;
}

/**
 * Offline Storage Service Class
 */
export class OfflineStorageService {
  private db: IDBDatabase | null = null;
  private isInitialized: boolean = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize IndexedDB
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create transcripts store
        if (!db.objectStoreNames.contains(TRANSCRIPTS_STORE)) {
          const transcriptsStore = db.createObjectStore(TRANSCRIPTS_STORE, {
            keyPath: 'id',
          });

          // Create indexes
          transcriptsStore.createIndex('user_id', 'user_id', { unique: false });
          transcriptsStore.createIndex('created_at', 'created_at', { unique: false });
          transcriptsStore.createIndex('updated_at', 'updated_at', { unique: false });
          transcriptsStore.createIndex('professional_mode', 'professional_mode', { unique: false });
          transcriptsStore.createIndex('language', 'language', { unique: false });
        }

        // Create metadata store
        if (!db.objectStoreNames.contains(METADATA_STORE)) {
          db.createObjectStore(METADATA_STORE, { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Ensure database is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  /**
   * Save transcript
   */
  async saveTranscript(transcript: Transcript): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([TRANSCRIPTS_STORE], 'readwrite');
      const store = transaction.objectStore(TRANSCRIPTS_STORE);
      const request = store.put(transcript);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get transcript by ID
   */
  async getTranscript(id: string): Promise<Transcript | null> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([TRANSCRIPTS_STORE], 'readonly');
      const store = transaction.objectStore(TRANSCRIPTS_STORE);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all transcripts
   */
  async getAllTranscripts(limit?: number, offset?: number): Promise<Transcript[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([TRANSCRIPTS_STORE], 'readonly');
      const store = transaction.objectStore(TRANSCRIPTS_STORE);
      const index = store.index('created_at');
      const request = index.openCursor(null, 'prev'); // Descending order

      const results: Transcript[] = [];
      let count = 0;
      const start = offset || 0;
      const max = limit || Infinity;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor && count < start + max) {
          if (count >= start && !cursor.value.is_deleted) {
            results.push(cursor.value);
          }
          count++;
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update transcript
   */
  async updateTranscript(id: string, updates: Partial<Transcript>): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const existing = await this.getTranscript(id);
    if (!existing) throw new Error('Transcript not found');

    const updated: Transcript = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    await this.saveTranscript(updated);
  }

  /**
   * Delete transcript (soft delete)
   */
  async deleteTranscript(id: string): Promise<void> {
    await this.updateTranscript(id, {
      is_deleted: true,
      updated_at: new Date().toISOString(),
    });
  }

  /**
   * Search transcripts
   */
  async searchTranscripts(query: string, limit: number = 20): Promise<Transcript[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const allTranscripts = await this.getAllTranscripts();
    const lowerQuery = query.toLowerCase();

    return allTranscripts
      .filter(t =>
        !t.is_deleted &&
        (t.title.toLowerCase().includes(lowerQuery) ||
         t.content.toLowerCase().includes(lowerQuery))
      )
      .slice(0, limit);
  }

  /**
   * Get transcripts by professional mode
   */
  async getTranscriptsByMode(mode: string, limit?: number): Promise<Transcript[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([TRANSCRIPTS_STORE], 'readonly');
      const store = transaction.objectStore(TRANSCRIPTS_STORE);
      const index = store.index('professional_mode');
      const request = index.openCursor(IDBKeyRange.only(mode), 'prev');

      const results: Transcript[] = [];
      let count = 0;
      const max = limit || Infinity;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor && count < max) {
          if (!cursor.value.is_deleted) {
            results.push(cursor.value);
            count++;
          }
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get transcripts by language
   */
  async getTranscriptsByLanguage(language: string, limit?: number): Promise<Transcript[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([TRANSCRIPTS_STORE], 'readonly');
      const store = transaction.objectStore(TRANSCRIPTS_STORE);
      const index = store.index('language');
      const request = index.openCursor(IDBKeyRange.only(language), 'prev');

      const results: Transcript[] = [];
      let count = 0;
      const max = limit || Infinity;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor && count < max) {
          if (!cursor.value.is_deleted) {
            results.push(cursor.value);
            count++;
          }
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<{
    total: number;
    byMode: Record<string, number>;
    byLanguage: Record<string, number>;
    totalSize: number;
  }> {
    const transcripts = await this.getAllTranscripts();
    
    const stats = {
      total: transcripts.length,
      byMode: {} as Record<string, number>,
      byLanguage: {} as Record<string, number>,
      totalSize: 0,
    };

    transcripts.forEach(t => {
      // Count by mode
      stats.byMode[t.professional_mode] = (stats.byMode[t.professional_mode] || 0) + 1;
      
      // Count by language
      stats.byLanguage[t.language] = (stats.byLanguage[t.language] || 0) + 1;
      
      // Estimate size
      stats.totalSize += JSON.stringify(t).length;
    });

    return stats;
  }

  /**
   * Clear all data
   */
  async clearAll(): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([TRANSCRIPTS_STORE, METADATA_STORE], 'readwrite');
      
      const transcriptsStore = transaction.objectStore(TRANSCRIPTS_STORE);
      const metadataStore = transaction.objectStore(METADATA_STORE);
      
      const clearTranscripts = transcriptsStore.clear();
      const clearMetadata = metadataStore.clear();

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Save metadata
   */
  async saveMetadata(key: string, value: any): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const metadata: StorageMetadata = {
      key,
      value,
      updated_at: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([METADATA_STORE], 'readwrite');
      const store = transaction.objectStore(METADATA_STORE);
      const request = store.put(metadata);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get metadata
   */
  async getMetadata(key: string): Promise<any> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([METADATA_STORE], 'readonly');
      const store = transaction.objectStore(METADATA_STORE);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result?.value || null);
      request.onerror = () => reject(request.error);
    });
  }
}

// Export singleton instance
let storageInstance: OfflineStorageService | null = null;

export function getOfflineStorageService(): OfflineStorageService {
  if (!storageInstance) {
    storageInstance = new OfflineStorageService();
  }
  return storageInstance;
}

export default getOfflineStorageService;

