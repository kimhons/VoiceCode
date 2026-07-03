/**
 * useMobileEnhancements Hook
 * Phase 5.4: Mobile App Enhancements
 * 
 * React hook for mobile-specific features
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { getMobileEnhancementsService } from '../services/mobileEnhancements.service';

export interface UseMobileEnhancementsOptions {
  autoInitialize?: boolean;
}

export interface UseMobileEnhancementsReturn {
  // Initialization
  isInitialized: boolean;
  initialize: () => Promise<void>;

  // Offline Mode
  isOfflineModeEnabled: boolean;
  enableOfflineMode: () => Promise<void>;
  disableOfflineMode: () => Promise<void>;
  offlineStorageSize: number;
  getOfflineStorageSize: () => Promise<void>;
  clearOfflineStorage: () => Promise<void>;

  // Background Recording
  isBackgroundRecording: boolean;
  startBackgroundRecording: () => Promise<void>;
  stopBackgroundRecording: () => Promise<void>;

  // Haptic Feedback
  isHapticsEnabled: boolean;
  triggerHaptic: (type: 'success' | 'warning' | 'error' | 'selection' | 'impact') => Promise<void>;
  enableHaptics: () => Promise<void>;
  disableHaptics: () => Promise<void>;

  // Biometric Authentication
  isBiometricEnabled: boolean;
  biometricType: string;
  authenticateWithBiometrics: () => Promise<boolean>;
  enableBiometricAuth: () => Promise<void>;
  disableBiometricAuth: () => Promise<void>;

  // Share Extensions
  shareTranscript: (title: string, content: string, format?: 'txt' | 'pdf' | 'docx') => Promise<void>;

  // State
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useMobileEnhancements(
  options: UseMobileEnhancementsOptions = {}
): UseMobileEnhancementsReturn {
  const { autoInitialize = true } = options;

  // Service
  const service = useRef(getMobileEnhancementsService());

  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOfflineModeEnabled, setIsOfflineModeEnabled] = useState(false);
  const [offlineStorageSize, setOfflineStorageSize] = useState(0);
  const [isBackgroundRecording, setIsBackgroundRecording] = useState(false);
  const [isHapticsEnabled, setIsHapticsEnabled] = useState(true);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState('none');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize
  const initialize = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      await service.current.initialize();
      setIsInitialized(true);
      setIsOfflineModeEnabled(service.current.isOfflineModeEnabled());
      setBiometricType(service.current.getBiometricType());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initialize';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Offline Mode
  const enableOfflineMode = useCallback(async () => {
    setError(null);
    try {
      await service.current.enableOfflineMode();
      setIsOfflineModeEnabled(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to enable offline mode';
      setError(message);
      throw err;
    }
  }, []);

  const disableOfflineMode = useCallback(async () => {
    setError(null);
    try {
      await service.current.disableOfflineMode();
      setIsOfflineModeEnabled(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to disable offline mode';
      setError(message);
      throw err;
    }
  }, []);

  const getOfflineStorageSize = useCallback(async () => {
    setError(null);
    try {
      const size = await service.current.getOfflineStorageSize();
      setOfflineStorageSize(size);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get storage size';
      setError(message);
      throw err;
    }
  }, []);

  const clearOfflineStorage = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      await service.current.clearOfflineStorage();
      setOfflineStorageSize(0);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to clear storage';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Background Recording
  const startBackgroundRecording = useCallback(async () => {
    setError(null);
    try {
      await service.current.startBackgroundRecording();
      setIsBackgroundRecording(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start background recording';
      setError(message);
      throw err;
    }
  }, []);

  const stopBackgroundRecording = useCallback(async () => {
    setError(null);
    try {
      await service.current.stopBackgroundRecording();
      setIsBackgroundRecording(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to stop background recording';
      setError(message);
      throw err;
    }
  }, []);

  // Haptic Feedback
  const triggerHaptic = useCallback(
    async (type: 'success' | 'warning' | 'error' | 'selection' | 'impact') => {
      setError(null);
      try {
        await service.current.triggerHaptic(type);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to trigger haptic';
        setError(message);
      }
    },
    []
  );

  const enableHaptics = useCallback(async () => {
    setError(null);
    try {
      await service.current.enableHaptics();
      setIsHapticsEnabled(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to enable haptics';
      setError(message);
      throw err;
    }
  }, []);

  const disableHaptics = useCallback(async () => {
    setError(null);
    try {
      await service.current.disableHaptics();
      setIsHapticsEnabled(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to disable haptics';
      setError(message);
      throw err;
    }
  }, []);

  // Biometric Authentication
  const authenticateWithBiometrics = useCallback(async (): Promise<boolean> => {
    setError(null);
    try {
      return await service.current.authenticateWithBiometrics();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      setError(message);
      return false;
    }
  }, []);

  const enableBiometricAuth = useCallback(async () => {
    setError(null);
    try {
      await service.current.enableBiometricAuth();
      setIsBiometricEnabled(true);
      setBiometricType(service.current.getBiometricType());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to enable biometric auth';
      setError(message);
      throw err;
    }
  }, []);

  const disableBiometricAuth = useCallback(async () => {
    setError(null);
    try {
      await service.current.disableBiometricAuth();
      setIsBiometricEnabled(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to disable biometric auth';
      setError(message);
      throw err;
    }
  }, []);

  // Share Extensions
  const shareTranscript = useCallback(
    async (title: string, content: string, format: 'txt' | 'pdf' | 'docx' = 'txt') => {
      setError(null);
      setIsLoading(true);
      try {
        await service.current.shareTranscript(title, content, format);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to share transcript';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-initialize
  useEffect(() => {
    if (autoInitialize && !isInitialized) {
      initialize();
    }
  }, [autoInitialize, isInitialized, initialize]);

  return {
    isInitialized,
    initialize,
    isOfflineModeEnabled,
    enableOfflineMode,
    disableOfflineMode,
    offlineStorageSize,
    getOfflineStorageSize,
    clearOfflineStorage,
    isBackgroundRecording,
    startBackgroundRecording,
    stopBackgroundRecording,
    isHapticsEnabled,
    triggerHaptic,
    enableHaptics,
    disableHaptics,
    isBiometricEnabled,
    biometricType,
    authenticateWithBiometrics,
    enableBiometricAuth,
    disableBiometricAuth,
    shareTranscript,
    isLoading,
    error,
    clearError,
  };
}

