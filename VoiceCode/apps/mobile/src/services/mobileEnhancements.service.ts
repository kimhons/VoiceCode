/**
 * Mobile Enhancements Service
 * Phase 5.4: Mobile App Enhancements
 * 
 * Comprehensive mobile-specific features for React Native/Expo
 */

import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Task names
const BACKGROUND_SYNC_TASK = 'background-sync-task';
const BACKGROUND_RECORDING_TASK = 'background-recording-task';

// Types
export interface BackgroundSyncConfig {
  enabled: boolean;
  interval: number; // in minutes
  wifiOnly: boolean;
}

export interface BiometricAuthConfig {
  enabled: boolean;
  type: 'fingerprint' | 'face' | 'iris' | 'none';
  fallbackToPasscode: boolean;
}

export interface HapticFeedbackConfig {
  enabled: boolean;
  intensity: 'light' | 'medium' | 'heavy';
}

export interface OfflineModeConfig {
  enabled: boolean;
  maxStorageSize: number; // in MB
  autoSync: boolean;
}

export interface QuickAction {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  action: () => void;
}

// Mobile Enhancements Service
class MobileEnhancementsService {
  private isInitialized = false;
  private backgroundSyncConfig: BackgroundSyncConfig = {
    enabled: true,
    interval: 15,
    wifiOnly: true,
  };
  private biometricConfig: BiometricAuthConfig = {
    enabled: false,
    type: 'none',
    fallbackToPasscode: true,
  };
  private hapticConfig: HapticFeedbackConfig = {
    enabled: true,
    intensity: 'medium',
  };
  private offlineConfig: OfflineModeConfig = {
    enabled: true,
    maxStorageSize: 500,
    autoSync: true,
  };

  // Initialize service
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load configurations
      await this.loadConfigurations();

      // Setup notifications
      await this.setupNotifications();

      // Setup background tasks
      await this.setupBackgroundTasks();

      // Check biometric availability
      await this.checkBiometricAvailability();

      this.isInitialized = true;
      console.log('Mobile enhancements initialized');
    } catch (error) {
      console.error('Failed to initialize mobile enhancements:', error);
      throw error;
    }
  }

  // =====================================================
  // OFFLINE MODE
  // =====================================================

  async enableOfflineMode(): Promise<void> {
    this.offlineConfig.enabled = true;
    await this.saveConfiguration('offline', this.offlineConfig);
  }

  async disableOfflineMode(): Promise<void> {
    this.offlineConfig.enabled = false;
    await this.saveConfiguration('offline', this.offlineConfig);
  }

  isOfflineModeEnabled(): boolean {
    return this.offlineConfig.enabled;
  }

  async getOfflineStorageSize(): Promise<number> {
    try {
      const info = await FileSystem.getInfoAsync(FileSystem.documentDirectory || '');
      return (info as any).size ? (info as any).size / (1024 * 1024) : 0; // Convert to MB
    } catch (error) {
      console.error('Failed to get offline storage size:', error);
      return 0;
    }
  }

  async clearOfflineStorage(): Promise<void> {
    try {
      const directory = FileSystem.documentDirectory;
      if (!directory) return;

      const files = await FileSystem.readDirectoryAsync(directory);
      for (const file of files) {
        await FileSystem.deleteAsync(`${directory}${file}`, { idempotent: true });
      }
    } catch (error) {
      console.error('Failed to clear offline storage:', error);
      throw error;
    }
  }

  // =====================================================
  // BACKGROUND RECORDING
  // =====================================================

  async startBackgroundRecording(): Promise<void> {
    try {
      // Request permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Notification permissions required for background recording');
      }

      // Show persistent notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Recording in Progress',
          body: 'VoiceCode is recording in the background',
          sticky: true,
        },
        trigger: null,
      });

      console.log('Background recording started');
    } catch (error) {
      console.error('Failed to start background recording:', error);
      throw error;
    }
  }

  async stopBackgroundRecording(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
      console.log('Background recording stopped');
    } catch (error) {
      console.error('Failed to stop background recording:', error);
      throw error;
    }
  }

  // =====================================================
  // HAPTIC FEEDBACK
  // =====================================================

  async triggerHaptic(type: 'success' | 'warning' | 'error' | 'selection' | 'impact'): Promise<void> {
    if (!this.hapticConfig.enabled) return;

    try {
      switch (type) {
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case 'selection':
          await Haptics.selectionAsync();
          break;
        case 'impact': {
          const intensity = this.hapticConfig.intensity === 'light'
            ? Haptics.ImpactFeedbackStyle.Light
            : this.hapticConfig.intensity === 'heavy'
            ? Haptics.ImpactFeedbackStyle.Heavy
            : Haptics.ImpactFeedbackStyle.Medium;
          await Haptics.impactAsync(intensity);
          break;
        }
      }
    } catch (error) {
      console.error('Failed to trigger haptic feedback:', error);
    }
  }

  async enableHaptics(): Promise<void> {
    this.hapticConfig.enabled = true;
    await this.saveConfiguration('haptic', this.hapticConfig);
  }

  async disableHaptics(): Promise<void> {
    this.hapticConfig.enabled = false;
    await this.saveConfiguration('haptic', this.hapticConfig);
  }

  // =====================================================
  // BIOMETRIC AUTHENTICATION
  // =====================================================

  async checkBiometricAvailability(): Promise<void> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        this.biometricConfig.type = 'none';
        return;
      }

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        this.biometricConfig.type = 'none';
        return;
      }

      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        this.biometricConfig.type = 'face';
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        this.biometricConfig.type = 'fingerprint';
      } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        this.biometricConfig.type = 'iris';
      }
    } catch (error) {
      console.error('Failed to check biometric availability:', error);
    }
  }

  async authenticateWithBiometrics(): Promise<boolean> {
    if (!this.biometricConfig.enabled || this.biometricConfig.type === 'none') {
      return false;
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access VoiceCode',
        fallbackLabel: this.biometricConfig.fallbackToPasscode ? 'Use Passcode' : undefined,
        disableDeviceFallback: !this.biometricConfig.fallbackToPasscode,
      });

      return result.success;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  }

  async enableBiometricAuth(): Promise<void> {
    await this.checkBiometricAvailability();
    if (this.biometricConfig.type !== 'none') {
      this.biometricConfig.enabled = true;
      await this.saveConfiguration('biometric', this.biometricConfig);
    }
  }

  async disableBiometricAuth(): Promise<void> {
    this.biometricConfig.enabled = false;
    await this.saveConfiguration('biometric', this.biometricConfig);
  }

  getBiometricType(): string {
    return this.biometricConfig.type;
  }

  // =====================================================
  // SHARE EXTENSIONS
  // =====================================================

  async shareTranscript(title: string, content: string, format: 'txt' | 'pdf' | 'docx' = 'txt'): Promise<void> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Sharing is not available on this device');
      }

      // Create temporary file
      const fileName = `${title.replace(/[^a-z0-9]/gi, '_')}.${format}`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(fileUri, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Share file
      await Sharing.shareAsync(fileUri, {
        mimeType: format === 'txt' ? 'text/plain' : 'application/octet-stream',
        dialogTitle: `Share ${title}`,
      });

      // Clean up
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    } catch (error) {
      console.error('Failed to share transcript:', error);
      throw error;
    }
  }

  // =====================================================
  // BACKGROUND SYNC
  // =====================================================

  private async setupBackgroundTasks(): Promise<void> {
    try {
      // Define background sync task
      TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
        try {
          console.log('Running background sync...');
          // Sync logic would go here
          return BackgroundFetch.BackgroundFetchResult.NewData;
        } catch (error) {
          console.error('Background sync failed:', error);
          return BackgroundFetch.BackgroundFetchResult.Failed;
        }
      });

      // Register background sync
      if (this.backgroundSyncConfig.enabled) {
        await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
          minimumInterval: this.backgroundSyncConfig.interval * 60,
          stopOnTerminate: false,
          startOnBoot: true,
        });
      }
    } catch (error) {
      console.error('Failed to setup background tasks:', error);
    }
  }

  // =====================================================
  // NOTIFICATIONS
  // =====================================================

  private async setupNotifications(): Promise<void> {
    try {
      await Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
    } catch (error) {
      console.error('Failed to setup notifications:', error);
    }
  }

  // =====================================================
  // CONFIGURATION
  // =====================================================

  private async loadConfigurations(): Promise<void> {
    try {
      const configs = await AsyncStorage.multiGet([
        'mobile_background_sync',
        'mobile_biometric',
        'mobile_haptic',
        'mobile_offline',
      ]);

      configs.forEach(([key, value]) => {
        if (!value) return;
        const config = JSON.parse(value);
        
        switch (key) {
          case 'mobile_background_sync':
            this.backgroundSyncConfig = config;
            break;
          case 'mobile_biometric':
            this.biometricConfig = config;
            break;
          case 'mobile_haptic':
            this.hapticConfig = config;
            break;
          case 'mobile_offline':
            this.offlineConfig = config;
            break;
        }
      });
    } catch (error) {
      console.error('Failed to load configurations:', error);
    }
  }

  private async saveConfiguration(type: string, config: any): Promise<void> {
    try {
      await AsyncStorage.setItem(`mobile_${type}`, JSON.stringify(config));
    } catch (error) {
      console.error(`Failed to save ${type} configuration:`, error);
    }
  }
}

// Singleton instance
let mobileEnhancementsInstance: MobileEnhancementsService | null = null;

export function getMobileEnhancementsService(): MobileEnhancementsService {
  if (!mobileEnhancementsInstance) {
    mobileEnhancementsInstance = new MobileEnhancementsService();
  }
  return mobileEnhancementsInstance;
}

export default MobileEnhancementsService;

