/**
 * useCloudSync Hook
 * Phase 2.3: Cloud Sync & Storage
 * 
 * React hook for cloud sync and storage features
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getSupabaseService, Transcript, UserProfile } from '../services/supabase.service';
import { getSyncService, SyncStatus, SyncResult, SyncProgress } from '../services/sync.service';
import { getOfflineStorageService } from '../services/offline-storage.service';

export interface UseCloudSyncOptions {
  autoSync?: boolean;
  syncInterval?: number; // minutes
  offlineFirst?: boolean;
}

export interface UseCloudSyncReturn {
  // Authentication
  isAuthenticated: boolean;
  user: UserProfile | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;

  // Sync
  syncStatus: SyncStatus;
  syncProgress: SyncProgress | null;
  sync: () => Promise<SyncResult>;
  setAutoSync: (enabled: boolean) => void;
  setSyncInterval: (minutes: number) => void;

  // Transcripts
  transcripts: Transcript[];
  isLoading: boolean;
  error: string | null;
  saveTranscript: (transcript: Omit<Transcript, 'id' | 'created_at' | 'updated_at'>) => Promise<Transcript>;
  getTranscript: (id: string) => Promise<Transcript | null>;
  updateTranscript: (id: string, updates: Partial<Transcript>) => Promise<Transcript>;
  deleteTranscript: (id: string) => Promise<void>;
  searchTranscripts: (query: string) => Promise<Transcript[]>;
  refreshTranscripts: () => Promise<void>;

  // Offline
  isOnline: boolean;
  offlineCount: number;
  clearOfflineData: () => Promise<void>;
}

export function useCloudSync(options: UseCloudSyncOptions = {}): UseCloudSyncReturn {
  const {
    autoSync = true,
    syncInterval = 5,
    offlineFirst = true,
  } = options;

  // Services
  const supabase = useRef(getSupabaseService());
  const syncService = useRef(getSyncService());
  const offlineStorage = useRef(getOfflineStorageService());

  // State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(syncService.current.getStatus());
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineCount, setOfflineCount] = useState(0);

  // Initialize
  useEffect(() => {
    // Check authentication
    const currentUser = supabase.current.getCurrentUser();
    if (currentUser) {
      setIsAuthenticated(true);
      loadUserProfile();
    }

    // Load transcripts
    loadTranscripts();

    // Setup sync
    syncService.current.setAutoSync(autoSync);
    syncService.current.setAutoSyncInterval(syncInterval);

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      if (autoSync) {
        syncService.current.syncNow();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for sync events
    const handleSyncProgress = (progress: SyncProgress) => {
      setSyncProgress(progress);
    };

    const handleSyncComplete = (result: SyncResult) => {
      setSyncProgress(null);
      setSyncStatus(syncService.current.getStatus());
      loadTranscripts(); // Refresh transcripts after sync
    };

    const handleSyncError = (err: Error) => {
      setError(err.message);
      setSyncProgress(null);
    };

    syncService.current.on('sync:progress', handleSyncProgress);
    syncService.current.on('sync:complete', handleSyncComplete);
    syncService.current.on('sync:error', handleSyncError);

    // Update offline count
    updateOfflineCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      syncService.current.off('sync:progress', handleSyncProgress);
      syncService.current.off('sync:complete', handleSyncComplete);
      syncService.current.off('sync:error', handleSyncError);
    };
  }, [autoSync, syncInterval]);

  // Load user profile
  const loadUserProfile = useCallback(async () => {
    try {
      const profile = await supabase.current.getUserProfile();
      setUser(profile);
    } catch (err) {
      console.error('Failed to load user profile:', err);
    }
  }, []);

  // Load transcripts
  const loadTranscripts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let data: Transcript[];

      if (offlineFirst || !isOnline) {
        // Load from offline storage
        data = await offlineStorage.current.getAllTranscripts(50);
      } else if (isAuthenticated) {
        // Load from cloud
        data = await supabase.current.getTranscripts(50);
      } else {
        data = [];
      }

      setTranscripts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transcripts');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, isOnline, offlineFirst]);

  // Update offline count
  const updateOfflineCount = useCallback(async () => {
    const count = syncService.current.getPendingCount();
    setOfflineCount(count);
  }, []);

  // Sign in
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      await supabase.current.signIn(email, password);
      setIsAuthenticated(true);
      await loadUserProfile();
      await loadTranscripts();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to sign in');
    }
  }, [loadUserProfile, loadTranscripts]);

  // Sign up
  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    try {
      await supabase.current.signUp(email, password, fullName);
      setIsAuthenticated(true);
      await loadUserProfile();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to sign up');
    }
  }, [loadUserProfile]);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      await supabase.current.signOut();
      setIsAuthenticated(false);
      setUser(null);
      setTranscripts([]);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to sign out');
    }
  }, []);

  // Sync
  const sync = useCallback(async () => {
    const result = await syncService.current.syncNow();
    setSyncStatus(syncService.current.getStatus());
    await updateOfflineCount();
    return result;
  }, [updateOfflineCount]);

  // Set auto sync
  const setAutoSync = useCallback((enabled: boolean) => {
    syncService.current.setAutoSync(enabled);
    setSyncStatus(syncService.current.getStatus());
  }, []);

  // Set sync interval
  const setSyncInterval = useCallback((minutes: number) => {
    syncService.current.setAutoSyncInterval(minutes);
  }, []);

  // Save transcript
  const saveTranscript = useCallback(async (
    transcript: Omit<Transcript, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Transcript> => {
    const newTranscript: Transcript = {
      ...transcript,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Transcript;

    // Save offline first
    await offlineStorage.current.saveTranscript(newTranscript);

    // Add to sync queue
    if (isOnline && isAuthenticated) {
      syncService.current.addToQueue('create', newTranscript);
    }

    // Update local state
    setTranscripts(prev => [newTranscript, ...prev]);
    await updateOfflineCount();

    return newTranscript;
  }, [isOnline, isAuthenticated, updateOfflineCount]);

  // Get transcript
  const getTranscript = useCallback(async (id: string): Promise<Transcript | null> => {
    if (offlineFirst) {
      return offlineStorage.current.getTranscript(id);
    } else if (isAuthenticated) {
      return supabase.current.getTranscript(id);
    }
    return null;
  }, [isAuthenticated, offlineFirst]);

  // Update transcript
  const updateTranscript = useCallback(async (
    id: string,
    updates: Partial<Transcript>
  ): Promise<Transcript> => {
    // Update offline first
    await offlineStorage.current.updateTranscript(id, updates);

    // Add to sync queue
    if (isOnline && isAuthenticated) {
      syncService.current.addToQueue('update', { id, ...updates });
    }

    // Update local state
    const updated = await offlineStorage.current.getTranscript(id);
    if (updated) {
      setTranscripts(prev => prev.map(t => t.id === id ? updated : t));
    }

    await updateOfflineCount();
    return updated!;
  }, [isOnline, isAuthenticated, updateOfflineCount]);

  // Delete transcript
  const deleteTranscript = useCallback(async (id: string): Promise<void> => {
    // Delete offline first
    await offlineStorage.current.deleteTranscript(id);

    // Add to sync queue
    if (isOnline && isAuthenticated) {
      syncService.current.addToQueue('delete', { id });
    }

    // Update local state
    setTranscripts(prev => prev.filter(t => t.id !== id));
    await updateOfflineCount();
  }, [isOnline, isAuthenticated, updateOfflineCount]);

  // Search transcripts
  const searchTranscripts = useCallback(async (query: string): Promise<Transcript[]> => {
    if (offlineFirst) {
      return offlineStorage.current.searchTranscripts(query);
    } else if (isAuthenticated) {
      return supabase.current.searchTranscripts(query);
    }
    return [];
  }, [isAuthenticated, offlineFirst]);

  // Refresh transcripts
  const refreshTranscripts = useCallback(async () => {
    await loadTranscripts();
  }, [loadTranscripts]);

  // Clear offline data
  const clearOfflineData = useCallback(async () => {
    await offlineStorage.current.clearAll();
    syncService.current.clearQueue();
    setTranscripts([]);
    await updateOfflineCount();
  }, [updateOfflineCount]);

  return {
    // Authentication
    isAuthenticated,
    user,
    signIn,
    signUp,
    signOut,

    // Sync
    syncStatus,
    syncProgress,
    sync,
    setAutoSync,
    setSyncInterval,

    // Transcripts
    transcripts,
    isLoading,
    error,
    saveTranscript,
    getTranscript,
    updateTranscript,
    deleteTranscript,
    searchTranscripts,
    refreshTranscripts,

    // Offline
    isOnline,
    offlineCount,
    clearOfflineData,
  };
}

