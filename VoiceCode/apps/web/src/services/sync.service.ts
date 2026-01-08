/**
 * Sync Service
 * Phase 2.3: Cloud Sync & Storage
 * 
 * Provides offline-first sync with conflict resolution
 */

import { getSupabaseService, Transcript } from './supabase.service';
import { EventEmitter } from 'eventemitter3';

// Sync events
export interface SyncEvents {
  'sync:start': () => void;
  'sync:progress': (progress: SyncProgress) => void;
  'sync:complete': (result: SyncResult) => void;
  'sync:error': (error: Error) => void;
  'sync:conflict': (conflict: SyncConflict) => void;
}

export interface SyncProgress {
  total: number;
  completed: number;
  current: string;
  percentage: number;
}

export interface SyncResult {
  uploaded: number;
  downloaded: number;
  conflicts: number;
  errors: number;
  duration: number;
}

export interface SyncConflict {
  id: string;
  local: Transcript;
  remote: Transcript;
  resolution?: 'local' | 'remote' | 'merge';
}

export interface SyncQueueItem {
  id: string;
  action: 'create' | 'update' | 'delete';
  data: Partial<Transcript>;
  timestamp: number;
  retries: number;
}

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncAt?: Date;
  nextSyncAt?: Date;
  pendingItems: number;
  autoSync: boolean;
}

/**
 * Sync Service Class
 */
export class SyncService extends EventEmitter<SyncEvents> {
  private supabase = getSupabaseService();
  private syncQueue: SyncQueueItem[] = [];
  private isSyncing: boolean = false;
  private autoSyncEnabled: boolean = true;
  private autoSyncInterval: number = 5 * 60 * 1000; // 5 minutes
  private autoSyncTimer: NodeJS.Timeout | null = null;
  private lastSyncAt: Date | null = null;

  constructor() {
    super();
    this.loadSyncQueue();
    this.startAutoSync();
  }

  /**
   * Load sync queue from local storage
   */
  private loadSyncQueue(): void {
    try {
      const stored = localStorage.getItem('voiceflow_sync_queue');
      if (stored) {
        this.syncQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
      this.syncQueue = [];
    }
  }

  /**
   * Save sync queue to local storage
   */
  private saveSyncQueue(): void {
    try {
      localStorage.setItem('voiceflow_sync_queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  /**
   * Add item to sync queue
   */
  addToQueue(action: 'create' | 'update' | 'delete', data: Partial<Transcript>): void {
    const item: SyncQueueItem = {
      id: data.id || crypto.randomUUID(),
      action,
      data,
      timestamp: Date.now(),
      retries: 0,
    };

    this.syncQueue.push(item);
    this.saveSyncQueue();

    // Trigger sync if auto-sync is enabled
    if (this.autoSyncEnabled && !this.isSyncing) {
      this.sync();
    }
  }

  /**
   * Start auto-sync
   */
  startAutoSync(): void {
    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer);
    }

    this.autoSyncTimer = setInterval(() => {
      if (this.autoSyncEnabled && !this.isSyncing && this.syncQueue.length > 0) {
        this.sync();
      }
    }, this.autoSyncInterval);
  }

  /**
   * Stop auto-sync
   */
  stopAutoSync(): void {
    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer);
      this.autoSyncTimer = null;
    }
  }

  /**
   * Enable/disable auto-sync
   */
  setAutoSync(enabled: boolean): void {
    this.autoSyncEnabled = enabled;
    if (enabled) {
      this.startAutoSync();
    } else {
      this.stopAutoSync();
    }
  }

  /**
   * Set auto-sync interval
   */
  setAutoSyncInterval(minutes: number): void {
    this.autoSyncInterval = minutes * 60 * 1000;
    if (this.autoSyncEnabled) {
      this.startAutoSync();
    }
  }

  /**
   * Perform sync
   */
  async sync(): Promise<SyncResult> {
    if (this.isSyncing) {
      throw new Error('Sync already in progress');
    }

    if (!this.supabase.isAvailable()) {
      throw new Error('Supabase not available');
    }

    this.isSyncing = true;
    this.emit('sync:start');

    const startTime = Date.now();
    const result: SyncResult = {
      uploaded: 0,
      downloaded: 0,
      conflicts: 0,
      errors: 0,
      duration: 0,
    };

    try {
      // Process sync queue
      const total = this.syncQueue.length;
      let completed = 0;

      for (const item of [...this.syncQueue]) {
        try {
          this.emit('sync:progress', {
            total,
            completed,
            current: item.id,
            percentage: (completed / total) * 100,
          });

          await this.processSyncItem(item);
          
          // Remove from queue
          this.syncQueue = this.syncQueue.filter(i => i.id !== item.id);
          result.uploaded++;
          completed++;
        } catch (error) {
          console.error('Failed to sync item:', error);
          
          // Increment retries
          item.retries++;
          
          // Remove if max retries reached
          if (item.retries >= 3) {
            this.syncQueue = this.syncQueue.filter(i => i.id !== item.id);
            result.errors++;
          }
        }
      }

      this.saveSyncQueue();

      // Download remote changes
      // (In a real implementation, this would use timestamps to get only new/updated items)
      
      this.lastSyncAt = new Date();
      result.duration = Date.now() - startTime;

      this.emit('sync:complete', result);
      return result;
    } catch (error) {
      this.emit('sync:error', error as Error);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Process individual sync item
   */
  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    switch (item.action) {
      case 'create':
        await this.supabase.saveTranscript(item.data as any);
        break;
      case 'update':
        if (item.data.id) {
          await this.supabase.updateTranscript(item.data.id, item.data);
        }
        break;
      case 'delete':
        if (item.data.id) {
          await this.supabase.deleteTranscript(item.data.id);
        }
        break;
    }
  }

  /**
   * Resolve conflict
   */
  async resolveConflict(
    conflict: SyncConflict,
    resolution: 'local' | 'remote' | 'merge'
  ): Promise<void> {
    let resolved: Transcript;

    switch (resolution) {
      case 'local':
        resolved = conflict.local;
        break;
      case 'remote':
        resolved = conflict.remote;
        break;
      case 'merge':
        resolved = this.mergeTranscripts(conflict.local, conflict.remote);
        break;
    }

    // Update both local and remote
    await this.supabase.updateTranscript(resolved.id, resolved);
    this.saveLocalTranscript(resolved);
  }

  /**
   * Merge two transcripts (simple strategy)
   */
  private mergeTranscripts(local: Transcript, remote: Transcript): Transcript {
    // Use the most recent content
    const useLocal = new Date(local.updated_at) > new Date(remote.updated_at);

    return {
      ...remote,
      content: useLocal ? local.content : remote.content,
      title: useLocal ? local.title : remote.title,
      updated_at: new Date().toISOString(),
      metadata: {
        ...remote.metadata,
        ...local.metadata,
        merged: true,
        merge_timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Save transcript locally
   */
  private saveLocalTranscript(transcript: Transcript): void {
    try {
      const stored = localStorage.getItem('voiceflow_transcripts');
      const transcripts: Transcript[] = stored ? JSON.parse(stored) : [];
      
      const index = transcripts.findIndex(t => t.id === transcript.id);
      if (index >= 0) {
        transcripts[index] = transcript;
      } else {
        transcripts.push(transcript);
      }

      localStorage.setItem('voiceflow_transcripts', JSON.stringify(transcripts));
    } catch (error) {
      console.error('Failed to save local transcript:', error);
    }
  }

  /**
   * Get sync status
   */
  getStatus(): SyncStatus {
    return {
      isSyncing: this.isSyncing,
      lastSyncAt: this.lastSyncAt || undefined,
      nextSyncAt: this.autoSyncEnabled && this.lastSyncAt
        ? new Date(this.lastSyncAt.getTime() + this.autoSyncInterval)
        : undefined,
      pendingItems: this.syncQueue.length,
      autoSync: this.autoSyncEnabled,
    };
  }

  /**
   * Force sync now
   */
  async syncNow(): Promise<SyncResult> {
    return this.sync();
  }

  /**
   * Clear sync queue
   */
  clearQueue(): void {
    this.syncQueue = [];
    this.saveSyncQueue();
  }

  /**
   * Get pending items count
   */
  getPendingCount(): number {
    return this.syncQueue.length;
  }
}

// Export singleton instance
let syncInstance: SyncService | null = null;

export function getSyncService(): SyncService {
  if (!syncInstance) {
    syncInstance = new SyncService();
  }
  return syncInstance;
}

export default getSyncService;

