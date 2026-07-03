// VoiceCode Mobile - Sync Service Tests
// Tests the real SyncService API: queue management, sync execution, events,
// status reporting and conflict resolution.

import { describe, it, expect, jest, beforeEach, afterAll } from '@jest/globals';
import { getSyncService } from '../../services/syncService';

const syncService = getSyncService();

describe('SyncService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Keep tests deterministic: no background timer, no auto-trigger on enqueue.
    syncService.stopAutoSync();
    syncService.setAutoSync(false);
    syncService.clearQueue();
    (syncService as any).isSyncing = false;
  });

  afterAll(() => {
    syncService.stopAutoSync();
  });

  describe('getStatus', () => {
    it('reports an idle status with no pending items initially', () => {
      const status = syncService.getStatus();
      expect(status).toMatchObject({
        isSyncing: false,
        pendingItems: 0,
        autoSync: false,
      });
    });
  });

  describe('addToQueue / getPendingCount', () => {
    it('increments the pending count when auto-sync is disabled', () => {
      syncService.addToQueue('create', { id: 't1', title: 'A' });
      expect(syncService.getPendingCount()).toBe(1);
    });

    it('tracks multiple queued actions in the status report', () => {
      syncService.addToQueue('create', { id: 't1' });
      syncService.addToQueue('update', { id: 't2' });
      expect(syncService.getPendingCount()).toBe(2);
      expect(syncService.getStatus().pendingItems).toBe(2);
    });
  });

  describe('clearQueue', () => {
    it('removes all pending items from the queue', () => {
      syncService.addToQueue('create', { id: 't1' });
      syncService.addToQueue('create', { id: 't2' });
      syncService.clearQueue();
      expect(syncService.getPendingCount()).toBe(0);
    });
  });

  describe('sync', () => {
    it('processes queued items, empties the queue, and reports the uploaded count', async () => {
      syncService.addToQueue('create', { id: 't1', title: 'A' });

      const result = await syncService.sync();

      expect(result.uploaded).toBe(1);
      expect(result.errors).toBe(0);
      expect(result).toHaveProperty('duration');
      expect(syncService.getPendingCount()).toBe(0);
    });

    it('emits sync:start and sync:complete events during a sync', async () => {
      const onStart = jest.fn();
      const onComplete = jest.fn();
      syncService.on('sync:start', onStart);
      syncService.on('sync:complete', onComplete);

      await syncService.sync();

      expect(onStart).toHaveBeenCalledTimes(1);
      expect(onComplete).toHaveBeenCalledTimes(1);

      syncService.off('sync:start', onStart);
      syncService.off('sync:complete', onComplete);
    });

    it('rejects when a sync is already in progress', async () => {
      (syncService as any).isSyncing = true;

      await expect(syncService.sync()).rejects.toThrow('Sync already in progress');

      (syncService as any).isSyncing = false;
    });

    it('keeps a failing item queued for retry and reports zero uploads', async () => {
      const originalSupabase = (syncService as any).supabase;
      (syncService as any).supabase = {
        from: jest.fn(() => ({
          insert: jest.fn(() => Promise.reject(new Error('network error'))),
        })),
      };

      syncService.addToQueue('create', { id: 't-fail' });
      const result = await syncService.sync();

      expect(result.uploaded).toBe(0);
      expect(syncService.getPendingCount()).toBe(1);

      (syncService as any).supabase = originalSupabase;
      syncService.clearQueue();
    });
  });

  describe('syncNow', () => {
    it('delegates to sync and resolves with a result for an empty queue', async () => {
      const result = await syncService.syncNow();

      expect(result.uploaded).toBe(0);
      expect(result).toHaveProperty('duration');
    });
  });

  describe('setAutoSync', () => {
    it('reflects the auto-sync flag in the status report', () => {
      syncService.setAutoSync(true);
      expect(syncService.getStatus().autoSync).toBe(true);

      syncService.setAutoSync(false);
      expect(syncService.getStatus().autoSync).toBe(false);
    });
  });

  describe('resolveConflict', () => {
    it('writes the resolved transcript to the remote transcriptions table', async () => {
      const fromSpy = (syncService as any).supabase.from;
      const conflict = {
        id: '1',
        local: {
          id: '1',
          title: 'Local',
          content: 'Local content',
          updated_at: '2024-01-15T12:00:00Z',
          metadata: {},
        },
        remote: {
          id: '1',
          title: 'Remote',
          content: 'Remote content',
          updated_at: '2024-01-15T10:00:00Z',
          metadata: {},
        },
      };

      await syncService.resolveConflict(conflict as any, 'local');

      expect(fromSpy).toHaveBeenCalledWith('transcriptions');
    });
  });
});
