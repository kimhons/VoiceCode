// VoiceCode Mobile - Sync Service Tests

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { getSyncService } from '../../services/syncService';
import { supabase } from '../../services/supabaseService';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('../../services/supabaseService');
jest.mock('@react-native-async-storage/async-storage');

describe('SyncService', () => {
  const syncService = getSyncService();
  const mockUserId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('syncToCloud', () => {
    it('should sync local data to cloud', async () => {
      const localTranscripts = [
        { id: 'local-1', title: 'Local Transcript', synced: false },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(localTranscripts)
      );

      (supabase.from as jest.Mock).mockReturnValue({
        upsert: jest.fn().mockResolvedValue({ data: localTranscripts, error: null }),
      });

      const result = await syncService.syncToCloud(mockUserId);

      expect(result.synced).toBe(1);
      expect(result.failed).toBe(0);
    });

    it('should handle sync failures gracefully', async () => {
      const localTranscripts = [
        { id: 'local-1', title: 'Local Transcript', synced: false },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(localTranscripts)
      );

      (supabase.from as jest.Mock).mockReturnValue({
        upsert: jest.fn().mockResolvedValue({ data: null, error: new Error('Sync failed') }),
      });

      const result = await syncService.syncToCloud(mockUserId);

      expect(result.failed).toBe(1);
    });
  });

  describe('syncFromCloud', () => {
    it('should sync cloud data to local', async () => {
      const cloudTranscripts = [
        { id: 'cloud-1', title: 'Cloud Transcript', updated_at: '2024-01-15T10:00:00Z' },
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gt: jest.fn().mockResolvedValue({ data: cloudTranscripts, error: null }),
          }),
        }),
      });

      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const result = await syncService.syncFromCloud(mockUserId);

      expect(result.downloaded).toBe(1);
    });
  });

  describe('getLastSyncTime', () => {
    it('should return last sync timestamp', async () => {
      const lastSync = '2024-01-15T10:00:00Z';
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(lastSync);

      const result = await syncService.getLastSyncTime();

      expect(result).toBe(lastSync);
    });

    it('should return null if never synced', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await syncService.getLastSyncTime();

      expect(result).toBeNull();
    });
  });

  describe('setLastSyncTime', () => {
    it('should store sync timestamp', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await syncService.setLastSyncTime();

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('getPendingChanges', () => {
    it('should return unsynced local changes', async () => {
      const pendingChanges = [
        { id: 'local-1', title: 'Unsynced', synced: false },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(pendingChanges)
      );

      const result = await syncService.getPendingChanges();

      expect(result).toHaveLength(1);
      expect(result[0].synced).toBe(false);
    });
  });

  describe('resolveConflict', () => {
    it('should resolve conflict with local version', async () => {
      const localVersion = { id: '1', title: 'Local', updated_at: '2024-01-15T12:00:00Z' };
      const cloudVersion = { id: '1', title: 'Cloud', updated_at: '2024-01-15T10:00:00Z' };

      const result = await syncService.resolveConflict(localVersion, cloudVersion, 'local');

      expect(result.title).toBe('Local');
    });

    it('should resolve conflict with cloud version', async () => {
      const localVersion = { id: '1', title: 'Local', updated_at: '2024-01-15T10:00:00Z' };
      const cloudVersion = { id: '1', title: 'Cloud', updated_at: '2024-01-15T12:00:00Z' };

      const result = await syncService.resolveConflict(localVersion, cloudVersion, 'cloud');

      expect(result.title).toBe('Cloud');
    });

    it('should auto-resolve using latest version', async () => {
      const localVersion = { id: '1', title: 'Local', updated_at: '2024-01-15T10:00:00Z' };
      const cloudVersion = { id: '1', title: 'Cloud', updated_at: '2024-01-15T12:00:00Z' };

      const result = await syncService.resolveConflict(localVersion, cloudVersion, 'latest');

      expect(result.title).toBe('Cloud'); // Cloud is more recent
    });
  });

  describe('fullSync', () => {
    it('should perform full bidirectional sync', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('[]');
      
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gt: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
        upsert: jest.fn().mockResolvedValue({ data: [], error: null }),
      });

      const result = await syncService.fullSync(mockUserId);

      expect(result.success).toBe(true);
    });
  });

  describe('enableAutoSync', () => {
    it('should enable automatic sync', async () => {
      await syncService.enableAutoSync(mockUserId, 5 * 60 * 1000); // 5 minutes

      expect(syncService.isAutoSyncEnabled()).toBe(true);
    });
  });

  describe('disableAutoSync', () => {
    it('should disable automatic sync', async () => {
      await syncService.enableAutoSync(mockUserId, 5 * 60 * 1000);
      await syncService.disableAutoSync();

      expect(syncService.isAutoSyncEnabled()).toBe(false);
    });
  });
});
