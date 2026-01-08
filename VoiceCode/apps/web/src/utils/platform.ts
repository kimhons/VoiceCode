// Platform detection and cross-platform utilities for VoiceFlow Pro

import { PlatformType } from '@/types';

// Detect the current platform
export const detectPlatform = (): PlatformType => {
  if (typeof window === 'undefined') return 'linux';
  
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform.toLowerCase();
  
  if (userAgent.includes('mac') || platform.includes('mac')) return 'mac';
  if (userAgent.includes('win')) return 'windows';
  return 'linux';
};

// Check if running in Electron
export const isElectron = (): boolean => {
  return typeof window !== 'undefined' && 
         typeof window.navigator !== 'undefined' && 
         window.navigator.userAgent.includes('Electron');
};

// Check if running in a web browser
export const isWeb = (): boolean => {
  return typeof window !== 'undefined' && 
         typeof document !== 'undefined' && 
         !isElectron();
};

// Platform-specific configurations
export const getPlatformConfig = (platform: PlatformType) => {
  const baseConfig = {
    platform,
    isElectron: isElectron(),
    isWeb: isWeb(),
    hasNativeTitleBar: !isWeb(),
    supportsTray: !isWeb(),
    supportsShortcuts: true,
  };

  switch (platform) {
    case 'mac':
      return {
        ...baseConfig,
        titleBarStyle: 'hiddenInset',
        windowControls: 'left',
        systemTheme: 'auto',
        supportsTouchBar: true,
        nativeTheme: 'dark',
      };
    
    case 'windows':
      return {
        ...baseConfig,
        titleBarStyle: 'default',
        windowControls: 'right',
        systemTheme: 'light',
        supportsTouchBar: false,
        nativeTheme: 'light',
      };
    
    case 'linux':
      return {
        ...baseConfig,
        titleBarStyle: 'default',
        windowControls: 'right',
        systemTheme: 'dark',
        supportsTouchBar: false,
        nativeTheme: 'dark',
      };
    
    default:
      return baseConfig;
  }
};

// Get default hotkey for the platform
export const getDefaultHotkey = (platform: PlatformType): string => {
  switch (platform) {
    case 'mac':
      return 'Cmd+Space';
    case 'windows':
      return 'Ctrl+Space';
    case 'linux':
      return 'Ctrl+Space';
    default:
      return 'Ctrl+Space';
  }
};

// Platform-specific file paths
export const getConfigPath = (platform: PlatformType): string => {
  switch (platform) {
    case 'mac':
      return '~/Library/Application Support/VoiceFlow Pro';
    case 'windows':
      return '%APPDATA%\\VoiceFlow Pro';
    case 'linux':
      return '~/.config/voiceflow-pro';
    default:
      return './voiceflow-pro';
  }
};

// Get system color scheme preference
export const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  return mediaQuery.matches ? 'dark' : 'light';
};

// Check if system prefers reduced motion
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  return mediaQuery.matches;
};

// Check if system prefers high contrast
export const prefersHighContrast = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const mediaQuery = window.matchMedia('(prefers-contrast: high)');
  return mediaQuery.matches;
};

// Platform-specific keyboard event handling
export const normalizeKey = (event: KeyboardEvent): string => {
  const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
  
  // Handle special keys
  if (key === ' ') return 'Space';
  if (key === 'ArrowUp') return 'Up';
  if (key === 'ArrowDown') return 'Down';
  if (key === 'ArrowLeft') return 'Left';
  if (key === 'ArrowRight') return 'Right';
  if (key === 'Escape') return 'Escape';
  if (key === 'Enter') return 'Enter';
  if (key === 'Tab') return 'Tab';
  if (key === 'Backspace') return 'Backspace';
  if (key === 'Delete') return 'Delete';
  
  // Handle modifier keys
  const modifiers = [];
  if (ctrlKey) modifiers.push('Ctrl');
  if (metaKey) modifiers.push('Cmd');
  if (shiftKey) modifiers.push('Shift');
  if (altKey) modifiers.push('Alt');
  
  // Add the main key
  modifiers.push(key.length === 1 ? key.toUpperCase() : key);
  
  return modifiers.join('+');
};

// Convert hotkey string to platform-specific format
export const formatHotkey = (hotkey: string, platform: PlatformType): string => {
  if (platform === 'mac') {
    return hotkey
      .replace('Ctrl+', '⌘+')
      .replace('Cmd+', '⌘+')
      .replace('Shift+', '⇧+')
      .replace('Alt+', '⌥+')
      .replace('Space', 'Space');
  }
  
  return hotkey;
};

// Platform-specific notification types
export const getNotificationType = (platform: PlatformType): 'native' | 'custom' => {
  switch (platform) {
    case 'mac':
    case 'windows':
      return 'native';
    case 'linux':
      return 'custom';
    default:
      return 'custom';
  }
};

// Check if the platform supports native notifications
export const supportsNativeNotifications = (): boolean => {
  return 'Notification' in window;
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!supportsNativeNotifications()) return 'denied';
  
  if (Notification.permission === 'default') {
    return await Notification.requestPermission();
  }
  
  return Notification.permission;
};

// Show platform-appropriate notification
export const showNotification = (
  title: string,
  options?: NotificationOptions,
  platform?: PlatformType
): Notification | null => {
  if (!supportsNativeNotifications() || Notification.permission !== 'granted') {
    return null;
  }
  
  const notification = new Notification(title, {
    icon: '/favicon.ico',
    ...options,
  });
  
  return notification;
};

// Platform-specific storage locations
export const getStorageLocation = (platform: PlatformType): 'local' | 'session' | 'indexedDB' => {
  switch (platform) {
    case 'mac':
    case 'windows':
      return 'local';
    case 'linux':
      return 'local';
    default:
      return 'local';
  }
};

// Get optimal buffer size for audio processing based on platform
export const getOptimalBufferSize = (platform: PlatformType): number => {
  switch (platform) {
    case 'mac':
      return 4096; // Larger buffer for better quality on macOS
    case 'windows':
      return 2048; // Medium buffer for Windows
    case 'linux':
      return 1024; // Smaller buffer for Linux performance
    default:
      return 2048;
  }
};

// Platform-specific audio constraints
export const getAudioConstraints = (platform: PlatformType) => {
  const baseConstraints = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  };
  
  switch (platform) {
    case 'mac':
      return {
        ...baseConstraints,
        sampleRate: 48000,
        channelCount: 2,
      };
    case 'windows':
      return {
        ...baseConstraints,
        sampleRate: 44100,
        channelCount: 1,
      };
    case 'linux':
      return {
        ...baseConstraints,
        sampleRate: 44100,
        channelCount: 1,
      };
    default:
      return baseConstraints;
  }
};

// Get platform-appropriate MIME types for recording
export const getSupportedMimeTypes = (platform: PlatformType): string[] => {
  const baseTypes = [
    'audio/webm',
    'audio/ogg',
    'audio/wav',
  ];
  
  switch (platform) {
    case 'mac':
      return ['audio/mp4', ...baseTypes];
    case 'windows':
      return ['audio/mp3', ...baseTypes];
    case 'linux':
      return baseTypes;
    default:
      return baseTypes;
  }
};

// Select the best MIME type for the platform
export const getBestAudioMimeType = (platform: PlatformType): string => {
  const supportedTypes = getSupportedMimeTypes(platform);
  
  for (const type of supportedTypes) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  
  return 'audio/webm'; // Fallback
};