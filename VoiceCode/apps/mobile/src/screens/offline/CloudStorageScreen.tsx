// VoiceFlow Pro Mobile - Cloud Storage Integration Screen
// Week 7 Day 44-45: Comprehensive Cloud Storage Provider Integration
// Phase 2: Advanced Features - Offline & Cloud Integration

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  Animated,
  RefreshControl,
  ActivityIndicator,
  Switch,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../components/common';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// ============================================================================
// TypeScript Interfaces & Types
// ============================================================================

/**
 * Cloud storage provider types
 */
export type CloudProvider = 'icloud' | 'google-drive' | 'dropbox' | 'onedrive';

/**
 * Provider connection status
 */
export type ProviderStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

/**
 * Backup frequency options
 */
export type BackupFrequency = 'manual' | 'realtime' | '15min' | '30min' | '1hour' | '6hour' | '24hour';

/**
 * File sync status
 */
export type FileSyncStatus = 'synced' | 'syncing' | 'pending' | 'failed' | 'conflict';

/**
 * Conflict resolution strategy
 */
export type ConflictStrategy = 'keep-local' | 'keep-cloud' | 'keep-both' | 'ask-me';

/**
 * File organization strategy
 */
export type OrganizationStrategy = 'flat' | 'by-date' | 'by-type' | 'by-project';

/**
 * Cloud provider configuration
 */
export interface CloudProviderConfig {
  provider: CloudProvider;
  status: ProviderStatus;
  connected: boolean;
  accountEmail: string | null;
  accountName: string | null;
  connectedAt: string | null;
  lastSyncAt: string | null;
  autoBackup: boolean;
  backupFrequency: BackupFrequency;
  wifiOnly: boolean;
  encryptionEnabled: boolean;
  organizationStrategy: OrganizationStrategy;
  conflictStrategy: ConflictStrategy;
  folderPath: string;
}

/**
 * Storage quota information
 */
export interface StorageQuota {
  provider: CloudProvider;
  totalSpace: number; // bytes
  usedSpace: number; // bytes
  availableSpace: number; // bytes
  voiceflowUsage: number; // bytes
  lastUpdated: string;
}

/**
 * Cloud file item
 */
export interface CloudFile {
  id: string;
  name: string;
  type: 'recording' | 'transcript' | 'export';
  size: number; // bytes
  localPath: string;
  cloudPath: string;
  status: FileSyncStatus;
  lastModifiedLocal: string;
  lastModifiedCloud: string | null;
  uploadedAt: string | null;
  progress?: number;
  error?: string;
}

/**
 * Backup history item
 */
export interface BackupHistoryItem {
  id: string;
  timestamp: string;
  provider: CloudProvider;
  filesCount: number;
  totalSize: number; // bytes
  duration: number; // seconds
  success: boolean;
  error?: string;
}

/**
 * Sync conflict item
 */
export interface SyncConflict {
  id: string;
  fileName: string;
  type: 'recording' | 'transcript' | 'export';
  localVersion: {
    size: number;
    modifiedAt: string;
    preview: string;
  };
  cloudVersion: {
    size: number;
    modifiedAt: string;
    preview: string;
  };
  detectedAt: string;
  resolved: boolean;
  resolution?: ConflictStrategy;
}

/**
 * Component props
 */
export interface CloudStorageScreenProps {
  navigation: any;
}

// ============================================================================
// Constants
// ============================================================================

const BASE_UNIT = 4;
const SCREEN_WIDTH = Dimensions.get('window').width;

// AsyncStorage keys
const STORAGE_KEY = '@voiceflow_cloud_storage_config';
const QUOTA_KEY = '@voiceflow_cloud_quota';
const FILES_KEY = '@voiceflow_cloud_files';
const HISTORY_KEY = '@voiceflow_backup_history';
const CONFLICTS_KEY = '@voiceflow_sync_conflicts';

// Color palette
const colors = {
  light: {
    primary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#8b5cf6',
    background: '#FFFFFF',
    surface: '#F9FAFB',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    border: '#E5E7EB',
  },
};

// Elevation styles
const elevation = {
  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
    },
    android: {
      elevation: 2,
    },
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    android: {
      elevation: 4,
    },
  }),
};

// Cloud provider configurations
const CLOUD_PROVIDERS: Array<{
  id: CloudProvider;
  name: string;
  icon: string;
  color: string;
  description: string;
}> = [
  {
    id: 'icloud',
    name: 'iCloud',
    icon: 'cloud',
    color: '#007AFF',
    description: 'Apple iCloud Drive',
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    icon: 'logo-google',
    color: '#4285F4',
    description: 'Google Drive Storage',
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    icon: 'logo-dropbox',
    color: '#0061FF',
    description: 'Dropbox Cloud Storage',
  },
  {
    id: 'onedrive',
    name: 'OneDrive',
    icon: 'cloud-outline',
    color: '#0078D4',
    description: 'Microsoft OneDrive',
  },
];

// Backup frequency options
const BACKUP_FREQUENCIES: Array<{
  value: BackupFrequency;
  label: string;
  description: string;
}> = [
  { value: 'manual', label: 'Manual Only', description: 'Backup manually' },
  { value: 'realtime', label: 'Real-time', description: 'Instant sync' },
  { value: '15min', label: 'Every 15 Minutes', description: 'Frequent backups' },
  { value: '30min', label: 'Every 30 Minutes', description: 'Regular backups' },
  { value: '1hour', label: 'Every Hour', description: 'Hourly backups' },
  { value: '6hour', label: 'Every 6 Hours', description: 'Periodic backups' },
  { value: '24hour', label: 'Daily', description: 'Once per day' },
];

// Organization strategies
const ORGANIZATION_STRATEGIES: Array<{
  value: OrganizationStrategy;
  label: string;
  icon: string;
  description: string;
}> = [
  { value: 'flat', label: 'Flat', icon: 'list', description: 'All files in one folder' },
  { value: 'by-date', label: 'By Date', icon: 'calendar', description: 'Organize by date' },
  { value: 'by-type', label: 'By Type', icon: 'folder', description: 'Organize by file type' },
  { value: 'by-project', label: 'By Project', icon: 'briefcase', description: 'Organize by project' },
];

// Conflict resolution strategies
const CONFLICT_STRATEGIES: Array<{
  value: ConflictStrategy;
  label: string;
  icon: string;
  description: string;
}> = [
  { value: 'keep-local', label: 'Keep Local', icon: 'phone-portrait', description: 'Use local version' },
  { value: 'keep-cloud', label: 'Keep Cloud', icon: 'cloud', description: 'Use cloud version' },
  { value: 'keep-both', label: 'Keep Both', icon: 'copy', description: 'Save both versions' },
  { value: 'ask-me', label: 'Ask Me', icon: 'help-circle', description: 'Decide each time' },
];

// Default provider configuration
const DEFAULT_PROVIDER_CONFIG: CloudProviderConfig = {
  provider: 'icloud',
  status: 'disconnected',
  connected: false,
  accountEmail: null,
  accountName: null,
  connectedAt: null,
  lastSyncAt: null,
  autoBackup: true,
  backupFrequency: '30min',
  wifiOnly: true,
  encryptionEnabled: true,
  organizationStrategy: 'by-date',
  conflictStrategy: 'ask-me',
  folderPath: '/VoiceFlow Pro',
};

// Mock data for demonstration
const MOCK_QUOTA: StorageQuota = {
  provider: 'icloud',
  totalSpace: 5 * 1024 * 1024 * 1024, // 5 GB
  usedSpace: 2.3 * 1024 * 1024 * 1024, // 2.3 GB
  availableSpace: 2.7 * 1024 * 1024 * 1024, // 2.7 GB
  voiceflowUsage: 450 * 1024 * 1024, // 450 MB
  lastUpdated: new Date().toISOString(),
};

const MOCK_FILES: CloudFile[] = [
  {
    id: '1',
    name: 'Team Meeting - Jan 7.m4a',
    type: 'recording',
    size: 12.5 * 1024 * 1024,
    localPath: '/recordings/team-meeting.m4a',
    cloudPath: '/VoiceFlow Pro/2026/01/team-meeting.m4a',
    status: 'synced',
    lastModifiedLocal: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    lastModifiedCloud: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    uploadedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    name: 'Interview Notes.txt',
    type: 'transcript',
    size: 45 * 1024,
    localPath: '/transcripts/interview-notes.txt',
    cloudPath: '/VoiceFlow Pro/2026/01/interview-notes.txt',
    status: 'syncing',
    lastModifiedLocal: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    lastModifiedCloud: null,
    uploadedAt: null,
    progress: 67,
  },
  {
    id: '3',
    name: 'Project Update.m4a',
    type: 'recording',
    size: 8.2 * 1024 * 1024,
    localPath: '/recordings/project-update.m4a',
    cloudPath: '/VoiceFlow Pro/2026/01/project-update.m4a',
    status: 'pending',
    lastModifiedLocal: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    lastModifiedCloud: null,
    uploadedAt: null,
  },
  {
    id: '4',
    name: 'Summary Export.pdf',
    type: 'export',
    size: 1.2 * 1024 * 1024,
    localPath: '/exports/summary.pdf',
    cloudPath: '/VoiceFlow Pro/2026/01/summary.pdf',
    status: 'failed',
    lastModifiedLocal: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    lastModifiedCloud: null,
    uploadedAt: null,
    error: 'Network timeout',
  },
];

const MOCK_HISTORY: BackupHistoryItem[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    provider: 'icloud',
    filesCount: 12,
    totalSize: 145 * 1024 * 1024,
    duration: 45,
    success: true,
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    provider: 'icloud',
    filesCount: 8,
    totalSize: 98 * 1024 * 1024,
    duration: 32,
    success: true,
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    provider: 'icloud',
    filesCount: 5,
    totalSize: 67 * 1024 * 1024,
    duration: 28,
    success: false,
    error: 'Insufficient storage',
  },
];

const MOCK_CONFLICTS: SyncConflict[] = [
  {
    id: '1',
    fileName: 'Team Meeting Notes.txt',
    type: 'transcript',
    localVersion: {
      size: 2.5 * 1024,
      modifiedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      preview: 'Updated with action items and next steps...',
    },
    cloudVersion: {
      size: 2.1 * 1024,
      modifiedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      preview: 'Original meeting notes without updates...',
    },
    detectedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    resolved: false,
  },
];

// ============================================================================
// Main Component
// ============================================================================

export const CloudStorageScreen: React.FC<CloudStorageScreenProps> = ({ navigation }) => {
  // ============================================================================
  // State Management
  // ============================================================================

  const [providerConfig, setProviderConfig] = useState<CloudProviderConfig>(DEFAULT_PROVIDER_CONFIG);
  const [quota, setQuota] = useState<StorageQuota>(MOCK_QUOTA);
  const [files, setFiles] = useState<CloudFile[]>(MOCK_FILES);
  const [backupHistory, setBackupHistory] = useState<BackupHistoryItem[]>(MOCK_HISTORY);
  const [conflicts, setConflicts] = useState<SyncConflict[]>(MOCK_CONFLICTS);
  const [isOnline, setIsOnline] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('provider');
  const [showFilesPanel, setShowFilesPanel] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [showConflictsPanel, setShowConflictsPanel] = useState(false);

  // ============================================================================
  // Refs & Animations
  // ============================================================================

  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const filesSlide = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const historySlide = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const conflictsSlide = useRef(new Animated.Value(SCREEN_WIDTH)).current;

  // ============================================================================
  // Effects
  // ============================================================================

  /**
   * Initial entrance animation
   */
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  /**
   * Load saved configuration and data
   */
  useEffect(() => {
    loadConfiguration();
    loadQuota();
    loadFiles();
    loadHistory();
    loadConflicts();
  }, []);

  /**
   * Monitor network status
   */
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });
    return () => unsubscribe();
  }, []);

  /**
   * Animate panel slides
   */
  useEffect(() => {
    Animated.spring(filesSlide, {
      toValue: showFilesPanel ? 0 : SCREEN_WIDTH,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [showFilesPanel]);

  useEffect(() => {
    Animated.spring(historySlide, {
      toValue: showHistoryPanel ? 0 : SCREEN_WIDTH,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [showHistoryPanel]);

  useEffect(() => {
    Animated.spring(conflictsSlide, {
      toValue: showConflictsPanel ? 0 : SCREEN_WIDTH,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [showConflictsPanel]);

  // ============================================================================
  // Data Management Functions
  // ============================================================================

  /**
   * Load provider configuration from storage
   */
  const loadConfiguration = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        setProviderConfig(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
    }
  };

  /**
   * Save provider configuration to storage
   */
  const saveConfiguration = async (config: CloudProviderConfig) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      setProviderConfig(config);
    } catch (error) {
      console.error('Failed to save configuration:', error);
    }
  };

  /**
   * Load storage quota
   */
  const loadQuota = async () => {
    try {
      const saved = await AsyncStorage.getItem(QUOTA_KEY);
      if (saved) {
        setQuota(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load quota:', error);
    }
  };

  /**
   * Load cloud files
   */
  const loadFiles = async () => {
    try {
      const saved = await AsyncStorage.getItem(FILES_KEY);
      if (saved) {
        setFiles(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load files:', error);
    }
  };

  /**
   * Load backup history
   */
  const loadHistory = async () => {
    try {
      const saved = await AsyncStorage.getItem(HISTORY_KEY);
      if (saved) {
        setBackupHistory(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  /**
   * Load sync conflicts
   */
  const loadConflicts = async () => {
    try {
      const saved = await AsyncStorage.getItem(CONFLICTS_KEY);
      if (saved) {
        setConflicts(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load conflicts:', error);
    }
  };

  /**
   * Refresh all data
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    await Promise.all([
      loadConfiguration(),
      loadQuota(),
      loadFiles(),
      loadHistory(),
      loadConflicts(),
    ]);

    setTimeout(() => setRefreshing(false), 1000);
  };

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Navigate back
   */
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  /**
   * Toggle section expansion
   */
  const handleToggleSection = (section: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedSection(expandedSection === section ? null : section);
  };

  /**
   * Update provider configuration
   */
  const updateConfig = async <K extends keyof CloudProviderConfig>(
    key: K,
    value: CloudProviderConfig[K]
  ) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = { ...providerConfig, [key]: value };
    await saveConfiguration(updated);
  };

  /**
   * Connect to cloud provider
   */
  const handleConnectProvider = async (provider: CloudProvider) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Simulate authentication flow
    Alert.alert(
      `Connect to ${CLOUD_PROVIDERS.find(p => p.id === provider)?.name}`,
      'This will open the authentication flow.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Connect',
          onPress: async () => {
            const updated: CloudProviderConfig = {
              ...providerConfig,
              provider,
              status: 'connecting',
            };
            await saveConfiguration(updated);

            // Simulate connection
            setTimeout(async () => {
              const connected: CloudProviderConfig = {
                ...updated,
                status: 'connected',
                connected: true,
                accountEmail: 'user@example.com',
                accountName: 'John Doe',
                connectedAt: new Date().toISOString(),
              };
              await saveConfiguration(connected);
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }, 2000);
          },
        },
      ]
    );
  };

  /**
   * Disconnect from provider
   */
  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Provider',
      'Are you sure you want to disconnect? Local files will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            const updated: CloudProviderConfig = {
              ...DEFAULT_PROVIDER_CONFIG,
              provider: providerConfig.provider,
            };
            await saveConfiguration(updated);
          },
        },
      ]
    );
  };

  /**
   * Start manual backup
   */
  const handleManualBackup = async () => {
    if (!providerConfig.connected) {
      Alert.alert('Not Connected', 'Please connect to a cloud provider first.');
      return;
    }

    if (!isOnline) {
      Alert.alert('Offline', 'Cannot backup while offline.');
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsBackingUp(true);
    setBackupProgress(0);

    // Simulate backup process
    const interval = setInterval(() => {
      setBackupProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsBackingUp(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          // Add to history
          const newHistoryItem: BackupHistoryItem = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            provider: providerConfig.provider,
            filesCount: files.length,
            totalSize: files.reduce((sum, f) => sum + f.size, 0),
            duration: 35,
            success: true,
          };
          setBackupHistory([newHistoryItem, ...backupHistory]);

          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  /**
   * Retry failed file upload
   */
  const handleRetryFile = (fileId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setFiles(files.map(f =>
      f.id === fileId
        ? { ...f, status: 'syncing', progress: 0, error: undefined }
        : f
    ));

    // Simulate upload
    setTimeout(() => {
      setFiles(files.map(f =>
        f.id === fileId
          ? {
              ...f,
              status: 'synced',
              uploadedAt: new Date().toISOString(),
              lastModifiedCloud: new Date().toISOString(),
            }
          : f
      ));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 2000);
  };

  /**
   * Resolve sync conflict
   */
  const handleResolveConflict = (conflictId: string, strategy: ConflictStrategy) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Resolve Conflict',
      `Are you sure you want to ${strategy.replace('-', ' ')}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            setConflicts(conflicts.map(c =>
              c.id === conflictId
                ? { ...c, resolved: true, resolution: strategy }
                : c
            ));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  /**
   * Delete file from cloud
   */
  const handleDeleteFile = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    Alert.alert(
      'Delete File',
      `Delete "${file.name}" from cloud storage?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setFiles(files.filter(f => f.id !== fileId));
          },
        },
      ]
    );
  };

  // ============================================================================
  // Render Functions
  // ============================================================================

  /**
   * Render screen header
   */
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={colors.light.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Cloud Storage</Text>
          <Text style={styles.headerSubtitle}>
            {providerConfig.connected
              ? `Connected to ${CLOUD_PROVIDERS.find(p => p.id === providerConfig.provider)?.name}`
              : 'Not connected'}
          </Text>
        </View>
        {files.filter(f => f.status === 'pending' || f.status === 'syncing').length > 0 && (
          <TouchableOpacity
            onPress={() => setShowFilesPanel(true)}
            style={styles.filesButton}
            activeOpacity={0.7}
          >
            <Ionicons name="cloud-upload" size={24} color={colors.light.primary} />
            <View style={styles.filesBadge}>
              <Text style={styles.filesBadgeText}>
                {files.filter(f => f.status === 'pending' || f.status === 'syncing').length}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  /**
   * Render provider selection section
   */
  const renderProviderSelection = () => (
    <View style={styles.section}>
      <TouchableOpacity
        onPress={() => handleToggleSection('provider')}
        style={styles.sectionHeader}
        activeOpacity={0.7}
      >
        <View style={[styles.sectionIcon, { backgroundColor: colors.light.primary + '15' }]}>
          <Ionicons name="cloud" size={20} color={colors.light.primary} />
        </View>
        <View style={styles.sectionInfo}>
          <Text style={styles.sectionTitle}>Cloud Provider</Text>
          <Text style={styles.sectionDescription}>
            {providerConfig.connected
              ? `${CLOUD_PROVIDERS.find(p => p.id === providerConfig.provider)?.name} - ${providerConfig.accountEmail}`
              : 'Select and connect a provider'}
          </Text>
        </View>
        <Ionicons
          name={expandedSection === 'provider' ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.light.textSecondary}
        />
      </TouchableOpacity>

      {expandedSection === 'provider' && (
        <View style={styles.sectionContent}>
          {/* Provider Cards */}
          <View style={styles.providerGrid}>
            {CLOUD_PROVIDERS.map((provider) => (
              <TouchableOpacity
                key={provider.id}
                onPress={() => !providerConfig.connected && handleConnectProvider(provider.id)}
                style={[
                  styles.providerCard,
                  providerConfig.provider === provider.id && styles.providerCardActive,
                  providerConfig.connected && providerConfig.provider !== provider.id && styles.providerCardDisabled,
                ]}
                activeOpacity={0.7}
                disabled={providerConfig.connected && providerConfig.provider !== provider.id}
              >
                <View style={[styles.providerIcon, { backgroundColor: provider.color + '15' }]}>
                  <Ionicons name={provider.icon as any} size={28} color={provider.color} />
                </View>
                <Text style={styles.providerName}>{provider.name}</Text>
                <Text style={styles.providerDescription}>{provider.description}</Text>
                {providerConfig.provider === provider.id && providerConfig.connected && (
                  <View style={styles.connectedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.light.success} />
                    <Text style={styles.connectedBadgeText}>Connected</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Connection Status */}
          {providerConfig.connected && (
            <View style={styles.connectionInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Account</Text>
                <Text style={styles.infoValue}>{providerConfig.accountName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{providerConfig.accountEmail}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Connected</Text>
                <Text style={styles.infoValue}>
                  {new Date(providerConfig.connectedAt!).toLocaleDateString()}
                </Text>
              </View>
              {providerConfig.lastSyncAt && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Last Sync</Text>
                  <Text style={styles.infoValue}>
                    {new Date(providerConfig.lastSyncAt).toLocaleString()}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                onPress={handleDisconnect}
                style={styles.disconnectButton}
                activeOpacity={0.7}
              >
                <Ionicons name="log-out" size={18} color={colors.light.error} />
                <Text style={styles.disconnectButtonText}>Disconnect</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Connecting State */}
          {providerConfig.status === 'connecting' && (
            <View style={styles.connectingState}>
              <ActivityIndicator size="small" color={colors.light.primary} />
              <Text style={styles.connectingText}>Connecting...</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  /**
   * Render storage quota section
   */
  const renderStorageQuota = () => {
    const usagePercent = (quota.usedSpace / quota.totalSpace) * 100;
    const voiceflowPercent = (quota.voiceflowUsage / quota.totalSpace) * 100;
    const usageColor =
      usagePercent > 90
        ? colors.light.error
        : usagePercent > 70
        ? colors.light.warning
        : colors.light.success;

    return (
      <View style={styles.section}>
        <TouchableOpacity
          onPress={() => handleToggleSection('quota')}
          style={styles.sectionHeader}
          activeOpacity={0.7}
        >
          <View style={[styles.sectionIcon, { backgroundColor: colors.light.info + '15' }]}>
            <Ionicons name="pie-chart" size={20} color={colors.light.info} />
          </View>
          <View style={styles.sectionInfo}>
            <Text style={styles.sectionTitle}>Storage Quota</Text>
            <Text style={styles.sectionDescription}>
              {(quota.voiceflowUsage / 1024 / 1024).toFixed(0)} MB used by VoiceFlow
            </Text>
          </View>
          <Ionicons
            name={expandedSection === 'quota' ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.light.textSecondary}
          />
        </TouchableOpacity>

        {expandedSection === 'quota' && (
          <View style={styles.sectionContent}>
            {/* Total Storage Bar */}
            <View style={styles.quotaBar}>
              <View style={styles.quotaBarBackground}>
                <View
                  style={[
                    styles.quotaBarFill,
                    { width: `${usagePercent}%`, backgroundColor: usageColor },
                  ]}
                />
                <View
                  style={[
                    styles.quotaBarVoiceflow,
                    { width: `${voiceflowPercent}%`, backgroundColor: colors.light.primary },
                  ]}
                />
              </View>
              <View style={styles.quotaLegend}>
                <View style={styles.quotaLegendItem}>
                  <View style={[styles.quotaLegendDot, { backgroundColor: usageColor }]} />
                  <Text style={styles.quotaLegendText}>
                    Total: {(quota.usedSpace / 1024 / 1024 / 1024).toFixed(2)} GB
                  </Text>
                </View>
                <View style={styles.quotaLegendItem}>
                  <View style={[styles.quotaLegendDot, { backgroundColor: colors.light.primary }]} />
                  <Text style={styles.quotaLegendText}>
                    VoiceFlow: {(quota.voiceflowUsage / 1024 / 1024).toFixed(0)} MB
                  </Text>
                </View>
              </View>
            </View>

            {/* Storage Stats */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {(quota.totalSpace / 1024 / 1024 / 1024).toFixed(0)} GB
                </Text>
                <Text style={styles.statLabel}>Total Space</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {(quota.availableSpace / 1024 / 1024 / 1024).toFixed(2)} GB
                </Text>
                <Text style={styles.statLabel}>Available</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: usageColor }]}>
                  {Math.round(usagePercent)}%
                </Text>
                <Text style={styles.statLabel}>Used</Text>
              </View>
            </View>

            {/* Last Updated */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Last Updated</Text>
              <Text style={styles.infoValue}>
                {new Date(quota.lastUpdated).toLocaleString()}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };


  /**
   * Render backup settings section
   */
  const renderBackupSettings = () => (
    <View style={styles.section}>
      <TouchableOpacity
        onPress={() => handleToggleSection('backup')}
        style={styles.sectionHeader}
        activeOpacity={0.7}
      >
        <View style={[styles.sectionIcon, { backgroundColor: colors.light.success + '15' }]}>
          <Ionicons name="cloud-upload" size={20} color={colors.light.success} />
        </View>
        <View style={styles.sectionInfo}>
          <Text style={styles.sectionTitle}>Backup Settings</Text>
          <Text style={styles.sectionDescription}>
            {providerConfig.autoBackup ? `Auto backup every ${providerConfig.backupFrequency}` : 'Manual backup only'}
          </Text>
        </View>
        <Ionicons
          name={expandedSection === 'backup' ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.light.textSecondary}
        />
      </TouchableOpacity>

      {expandedSection === 'backup' && (
        <View style={styles.sectionContent}>
          {/* Auto Backup */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Auto Backup</Text>
              <Text style={styles.settingDescription}>
                Automatically backup files to cloud
              </Text>
            </View>
            <Switch
              value={providerConfig.autoBackup}
              onValueChange={(value) => updateConfig('autoBackup', value)}
              trackColor={{ false: colors.light.surface, true: colors.light.primary }}
              thumbColor={colors.light.background}
              disabled={!providerConfig.connected}
            />
          </View>

          {/* WiFi Only */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>WiFi Only</Text>
              <Text style={styles.settingDescription}>
                Only backup when connected to WiFi
              </Text>
            </View>
            <Switch
              value={providerConfig.wifiOnly}
              onValueChange={(value) => updateConfig('wifiOnly', value)}
              trackColor={{ false: colors.light.surface, true: colors.light.primary }}
              thumbColor={colors.light.background}
              disabled={!providerConfig.connected}
            />
          </View>

          {/* Encryption */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Encryption</Text>
              <Text style={styles.settingDescription}>
                Encrypt files before uploading
              </Text>
            </View>
            <Switch
              value={providerConfig.encryptionEnabled}
              onValueChange={(value) => updateConfig('encryptionEnabled', value)}
              trackColor={{ false: colors.light.surface, true: colors.light.primary }}
              thumbColor={colors.light.background}
              disabled={!providerConfig.connected}
            />
          </View>

          {/* Manual Backup Button */}
          <TouchableOpacity
            onPress={handleManualBackup}
            style={[
              styles.backupButton,
              (!providerConfig.connected || isBackingUp) && styles.backupButtonDisabled,
            ]}
            activeOpacity={0.7}
            disabled={!providerConfig.connected || isBackingUp}
          >
            {isBackingUp ? (
              <>
                <ActivityIndicator size="small" color={colors.light.background} />
                <Text style={styles.backupButtonText}>{backupProgress}% Complete</Text>
              </>
            ) : (
              <>
                <Ionicons name="cloud-upload" size={20} color={colors.light.background} />
                <Text style={styles.backupButtonText}>Backup Now</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Backup History Link */}
          <TouchableOpacity
            onPress={() => setShowHistoryPanel(true)}
            style={styles.linkButton}
            activeOpacity={0.7}
          >
            <Ionicons name="time" size={18} color={colors.light.primary} />
            <Text style={styles.linkButtonText}>View Backup History</Text>
            <Text style={styles.linkButtonBadge}>
              {backupHistory.length}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  /**
   * Render conflict resolution section
   */
  const renderConflictResolution = () => (
    <View style={styles.section}>
      <TouchableOpacity
        onPress={() => handleToggleSection('conflicts')}
        style={styles.sectionHeader}
        activeOpacity={0.7}
      >
        <View style={[styles.sectionIcon, { backgroundColor: colors.light.error + '15' }]}>
          <Ionicons name="git-merge" size={20} color={colors.light.error} />
        </View>
        <View style={styles.sectionInfo}>
          <Text style={styles.sectionTitle}>Conflict Resolution</Text>
          <Text style={styles.sectionDescription}>
            {conflicts.filter(c => !c.resolved).length} unresolved conflicts
          </Text>
        </View>
        {conflicts.filter(c => !c.resolved).length > 0 && (
          <TouchableOpacity
            onPress={() => setShowConflictsPanel(true)}
            style={styles.viewButton}
            activeOpacity={0.7}
          >
            <Text style={styles.viewButtonText}>View</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {expandedSection === 'conflicts' && (
        <View style={styles.sectionContent}>
          {/* Default Strategy */}
          <Text style={styles.subsectionTitle}>Default Strategy</Text>
          <View style={styles.strategyButtons}>
            {CONFLICT_STRATEGIES.map((strategy) => (
              <TouchableOpacity
                key={strategy.value}
                onPress={() => updateConfig('conflictStrategy', strategy.value)}
                style={[
                  styles.strategyButton,
                  providerConfig.conflictStrategy === strategy.value && styles.strategyButtonActive,
                ]}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={strategy.icon as any}
                  size={20}
                  color={
                    providerConfig.conflictStrategy === strategy.value
                      ? colors.light.primary
                      : colors.light.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.strategyButtonText,
                    providerConfig.conflictStrategy === strategy.value && styles.strategyButtonTextActive,
                  ]}
                >
                  {strategy.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );


  /**
   * Render files panel
   */
  const renderFilesPanel = () => (
    <Animated.View
      style={[
        styles.panel,
        {
          transform: [{ translateX: filesSlide }],
        },
      ]}
    >
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>Cloud Files</Text>
        <TouchableOpacity
          onPress={() => setShowFilesPanel(false)}
          style={styles.panelCloseButton}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color={colors.light.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.panelContent} showsVerticalScrollIndicator={false}>
        {files.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cloud-done" size={64} color={colors.light.success} />
            <Text style={styles.emptyStateTitle}>No Files</Text>
            <Text style={styles.emptyStateDescription}>
              No files in cloud storage
            </Text>
          </View>
        ) : (
          files.map((file) => (
            <View key={file.id} style={styles.fileItem}>
              <View style={styles.fileItemHeader}>
                <View
                  style={[
                    styles.fileItemIcon,
                    {
                      backgroundColor:
                        file.status === 'synced'
                          ? colors.light.success + '15'
                          : file.status === 'failed'
                          ? colors.light.error + '15'
                          : file.status === 'syncing'
                          ? colors.light.primary + '15'
                          : colors.light.warning + '15',
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      file.type === 'recording'
                        ? 'mic'
                        : file.type === 'transcript'
                        ? 'document-text'
                        : 'document'
                    }
                    size={20}
                    color={
                      file.status === 'synced'
                        ? colors.light.success
                        : file.status === 'failed'
                        ? colors.light.error
                        : file.status === 'syncing'
                        ? colors.light.primary
                        : colors.light.warning
                    }
                  />
                </View>
                <View style={styles.fileItemInfo}>
                  <Text style={styles.fileItemTitle}>{file.name}</Text>
                  <Text style={styles.fileItemDescription}>
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </Text>
                </View>
                <View
                  style={[
                    styles.fileItemBadge,
                    {
                      backgroundColor:
                        file.status === 'synced'
                          ? colors.light.success
                          : file.status === 'failed'
                          ? colors.light.error
                          : file.status === 'syncing'
                          ? colors.light.primary
                          : colors.light.warning,
                    },
                  ]}
                >
                  <Text style={styles.fileItemBadgeText}>
                    {file.status === 'synced'
                      ? 'Synced'
                      : file.status === 'failed'
                      ? 'Failed'
                      : file.status === 'syncing'
                      ? `${file.progress}%`
                      : 'Pending'}
                  </Text>
                </View>
              </View>

              {file.error && (
                <View style={styles.fileItemError}>
                  <Ionicons name="warning" size={16} color={colors.light.error} />
                  <Text style={styles.fileItemErrorText}>{file.error}</Text>
                </View>
              )}

              {file.status === 'failed' && (
                <View style={styles.fileItemActions}>
                  <TouchableOpacity
                    onPress={() => handleRetryFile(file.id)}
                    style={styles.fileItemActionButton}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="refresh" size={16} color={colors.light.primary} />
                    <Text style={styles.fileItemActionText}>Retry</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteFile(file.id)}
                    style={[styles.fileItemActionButton, styles.fileItemActionButtonDanger]}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash" size={16} color={colors.light.error} />
                    <Text style={[styles.fileItemActionText, styles.fileItemActionTextDanger]}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </Animated.View>
  );

  /**
   * Render backup history panel
   */
  const renderHistoryPanel = () => (
    <Animated.View
      style={[
        styles.panel,
        {
          transform: [{ translateX: historySlide }],
        },
      ]}
    >
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>Backup History</Text>
        <TouchableOpacity
          onPress={() => setShowHistoryPanel(false)}
          style={styles.panelCloseButton}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color={colors.light.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.panelContent} showsVerticalScrollIndicator={false}>
        {backupHistory.map((item) => (
          <View key={item.id} style={styles.historyItem}>
            <View style={styles.historyItemHeader}>
              <Ionicons
                name={item.success ? 'checkmark-circle' : 'close-circle'}
                size={24}
                color={item.success ? colors.light.success : colors.light.error}
              />
              <View style={styles.historyItemInfo}>
                <Text style={styles.historyItemTitle}>
                  {item.success ? 'Backup Successful' : 'Backup Failed'}
                </Text>
                <Text style={styles.historyItemDescription}>
                  {new Date(item.timestamp).toLocaleString()}
                </Text>
              </View>
            </View>
            <View style={styles.historyItemStats}>
              <View style={styles.historyItemStat}>
                <Text style={styles.historyItemStatLabel}>Files</Text>
                <Text style={styles.historyItemStatValue}>{item.filesCount}</Text>
              </View>
              <View style={styles.historyItemStat}>
                <Text style={styles.historyItemStatLabel}>Size</Text>
                <Text style={styles.historyItemStatValue}>
                  {(item.totalSize / 1024 / 1024).toFixed(0)} MB
                </Text>
              </View>
              <View style={styles.historyItemStat}>
                <Text style={styles.historyItemStatLabel}>Duration</Text>
                <Text style={styles.historyItemStatValue}>{item.duration}s</Text>
              </View>
            </View>
            {item.error && (
              <View style={styles.historyItemError}>
                <Ionicons name="warning" size={16} color={colors.light.error} />
                <Text style={styles.historyItemErrorText}>{item.error}</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </Animated.View>
  );

  /**
   * Render conflicts panel
   */
  const renderConflictsPanel = () => (
    <Animated.View
      style={[
        styles.panel,
        {
          transform: [{ translateX: conflictsSlide }],
        },
      ]}
    >
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>Sync Conflicts</Text>
        <TouchableOpacity
          onPress={() => setShowConflictsPanel(false)}
          style={styles.panelCloseButton}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color={colors.light.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.panelContent} showsVerticalScrollIndicator={false}>
        {conflicts.filter(c => !c.resolved).length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={64} color={colors.light.success} />
            <Text style={styles.emptyStateTitle}>No Conflicts!</Text>
            <Text style={styles.emptyStateDescription}>
              All files are in sync
            </Text>
          </View>
        ) : (
          conflicts.filter(c => !c.resolved).map((conflict) => (
            <View key={conflict.id} style={styles.conflictItem}>
              <View style={styles.conflictHeader}>
                <Ionicons name="git-merge" size={24} color={colors.light.error} />
                <Text style={styles.conflictTitle}>{conflict.fileName}</Text>
              </View>

              {/* Local Version */}
              <View style={styles.conflictVersion}>
                <View style={styles.conflictVersionHeader}>
                  <Ionicons name="phone-portrait" size={20} color={colors.light.primary} />
                  <Text style={styles.conflictVersionTitle}>Local Version</Text>
                </View>
                <Text style={styles.conflictVersionMeta}>
                  Modified {new Date(conflict.localVersion.modifiedAt).toLocaleString()}
                </Text>
                <Text style={styles.conflictVersionMeta}>
                  Size: {(conflict.localVersion.size / 1024).toFixed(2)} KB
                </Text>
                <Text style={styles.conflictVersionPreview}>
                  {conflict.localVersion.preview}
                </Text>
              </View>

              {/* Cloud Version */}
              <View style={styles.conflictVersion}>
                <View style={styles.conflictVersionHeader}>
                  <Ionicons name="cloud" size={20} color={colors.light.success} />
                  <Text style={styles.conflictVersionTitle}>Cloud Version</Text>
                </View>
                <Text style={styles.conflictVersionMeta}>
                  Modified {new Date(conflict.cloudVersion.modifiedAt).toLocaleString()}
                </Text>
                <Text style={styles.conflictVersionMeta}>
                  Size: {(conflict.cloudVersion.size / 1024).toFixed(2)} KB
                </Text>
                <Text style={styles.conflictVersionPreview}>
                  {conflict.cloudVersion.preview}
                </Text>
              </View>

              {/* Resolution Actions */}
              <View style={styles.conflictActions}>
                <TouchableOpacity
                  onPress={() => handleResolveConflict(conflict.id, 'keep-local')}
                  style={styles.conflictActionButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.conflictActionText}>Keep Local</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleResolveConflict(conflict.id, 'keep-cloud')}
                  style={styles.conflictActionButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.conflictActionText}>Keep Cloud</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleResolveConflict(conflict.id, 'keep-both')}
                  style={[styles.conflictActionButton, styles.conflictActionButtonPrimary]}
                  activeOpacity={0.7}
                >
                  <Text style={styles.conflictActionText}>Keep Both</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </Animated.View>
  );

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {renderHeader()}

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.light.primary}
            colors={[colors.light.primary]}
          />
        }
      >
        {renderProviderSelection()}
        {renderStorageQuota()}
        {renderBackupSettings()}
        {renderConflictResolution()}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Files Panel */}
      {renderFilesPanel()}

      {/* History Panel */}
      {renderHistoryPanel()}

      {/* Conflicts Panel */}
      {renderConflictsPanel()}
    </Animated.View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: BASE_UNIT * 20,
  },

  // Header
  header: {
    backgroundColor: colors.light.background,
    ...elevation.sm,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: BASE_UNIT * 4,
    paddingTop: BASE_UNIT * 12,
    paddingBottom: BASE_UNIT * 4,
  },
  backButton: {
    width: BASE_UNIT * 11,
    height: BASE_UNIT * 11,
    borderRadius: BASE_UNIT * 5.5,
    backgroundColor: colors.light.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: BASE_UNIT * 3,
  },
  headerTitle: {
    fontFamily: 'SF Pro Display',
    fontSize: 22,
    fontWeight: '700',
    color: colors.light.textPrimary,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontFamily: 'SF Pro Text',
    fontSize: 14,
    fontWeight: '400',
    color: colors.light.textSecondary,
    marginTop: BASE_UNIT * 0.5,
  },
  filesButton: {
    width: BASE_UNIT * 11,
    height: BASE_UNIT * 11,
    borderRadius: BASE_UNIT * 5.5,
    backgroundColor: colors.light.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filesBadge: {
    position: 'absolute',
    top: -BASE_UNIT,
    right: -BASE_UNIT,
    backgroundColor: colors.light.error,
    borderRadius: BASE_UNIT * 2.5,
    minWidth: BASE_UNIT * 5,
    height: BASE_UNIT * 5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: BASE_UNIT,
  },
  filesBadgeText: {
    fontFamily: 'SF Pro Text',
    fontSize: 11,
    fontWeight: '700',
    color: colors.light.background,
  },

  // Section
  section: {
    marginTop: BASE_UNIT * 4,
    marginHorizontal: BASE_UNIT * 4,
    backgroundColor: colors.light.background,
    borderRadius: BASE_UNIT * 3,
    ...elevation.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: BASE_UNIT * 4,
  },
  sectionIcon: {
    width: BASE_UNIT * 10,
    height: BASE_UNIT * 10,
    borderRadius: BASE_UNIT * 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionInfo: {
    flex: 1,
    marginLeft: BASE_UNIT * 3,
  },
  sectionTitle: {
    fontFamily: 'SF Pro Text',
    fontSize: 17,
    fontWeight: '600',
    color: colors.light.textPrimary,
    letterSpacing: -0.2,
  },
  sectionDescription: {
    fontFamily: 'SF Pro Text',
    fontSize: 14,
    fontWeight: '400',
    color: colors.light.textSecondary,
    marginTop: BASE_UNIT * 0.5,
  },
  sectionContent: {
    paddingHorizontal: BASE_UNIT * 4,
    paddingBottom: BASE_UNIT * 4,
  },
  viewButton: {
    paddingHorizontal: BASE_UNIT * 3,
    paddingVertical: BASE_UNIT * 1.5,
    backgroundColor: colors.light.primary,
    borderRadius: BASE_UNIT * 2,
  },
  viewButtonText: {
    fontFamily: 'SF Pro Text',
    fontSize: 14,
    fontWeight: '600',
    color: colors.light.background,
    letterSpacing: 0.2,
  },

  // Provider Grid
  providerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -BASE_UNIT * 2,
  },
  providerCard: {
    width: (SCREEN_WIDTH - BASE_UNIT * 20) / 2,
    margin: BASE_UNIT * 2,
    padding: BASE_UNIT * 4,
    backgroundColor: colors.light.surface,
    borderRadius: BASE_UNIT * 3,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  providerCardActive: {
    borderColor: colors.light.primary,
    backgroundColor: colors.light.primary + '08',
  },
  providerCardDisabled: {
    opacity: 0.5,
  },
  providerIcon: {
    width: BASE_UNIT * 14,
    height: BASE_UNIT * 14,
    borderRadius: BASE_UNIT * 3.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: BASE_UNIT * 2,
  },
  providerName: {
    fontFamily: 'SF Pro Text',
    fontSize: 16,
    fontWeight: '600',
    color: colors.light.textPrimary,
    marginBottom: BASE_UNIT,
  },
  providerDescription: {
    fontFamily: 'SF Pro Text',
    fontSize: 13,
    fontWeight: '400',
    color: colors.light.textSecondary,
    textAlign: 'center',
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: BASE_UNIT * 2,
    paddingHorizontal: BASE_UNIT * 2,
    paddingVertical: BASE_UNIT,
    backgroundColor: colors.light.success + '15',
    borderRadius: BASE_UNIT * 2,
  },
  connectedBadgeText: {
    fontFamily: 'SF Pro Text',
    fontSize: 12,
    fontWeight: '600',
    color: colors.light.success,
    marginLeft: BASE_UNIT,
  },


  // Connection Info
  connectionInfo: {
    marginTop: BASE_UNIT * 3,
    padding: BASE_UNIT * 3,
    backgroundColor: colors.light.surface,
    borderRadius: BASE_UNIT * 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: BASE_UNIT * 2,
  },
  infoLabel: {
    fontFamily: 'SF Pro Text',
    fontSize: 14,
    fontWeight: '500',
    color: colors.light.textSecondary,
  },
  infoValue: {
    fontFamily: 'SF Pro Text',
    fontSize: 14,
    fontWeight: '600',
    color: colors.light.textPrimary,
  },
  disconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: BASE_UNIT * 3,
    paddingVertical: BASE_UNIT * 2.5,
    backgroundColor: colors.light.error + '15',
    borderRadius: BASE_UNIT * 2,
  },
  disconnectButtonText: {
    fontFamily: 'SF Pro Text',
    fontSize: 15,
    fontWeight: '600',
    color: colors.light.error,
    marginLeft: BASE_UNIT,
    letterSpacing: 0.2,
  },
  connectingState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: BASE_UNIT * 4,
  },
  connectingText: {
    fontFamily: 'SF Pro Text',
    fontSize: 15,
    fontWeight: '500',
    color: colors.light.textSecondary,
    marginLeft: BASE_UNIT * 2,
  },

  // Storage Quota
  quotaBar: {
    marginBottom: BASE_UNIT * 3,
  },
  quotaBarBackground: {
    height: BASE_UNIT * 3,
    backgroundColor: colors.light.surface,
    borderRadius: BASE_UNIT * 1.5,
    overflow: 'hidden',
    position: 'relative',
  },
  quotaBarFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: BASE_UNIT * 1.5,
  },
  quotaBarVoiceflow: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: BASE_UNIT * 1.5,
  },
  quotaLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: BASE_UNIT * 2,
  },
  quotaLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quotaLegendDot: {
    width: BASE_UNIT * 2,
    height: BASE_UNIT * 2,
    borderRadius: BASE_UNIT,
    marginRight: BASE_UNIT,
  },
  quotaLegendText: {
    fontFamily: 'SF Pro Text',
    fontSize: 13,
    fontWeight: '500',
    color: colors.light.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    marginBottom: BASE_UNIT * 3,
    marginHorizontal: -BASE_UNIT,
  },
  statCard: {
    flex: 1,
    margin: BASE_UNIT,
    padding: BASE_UNIT * 3,
    backgroundColor: colors.light.surface,
    borderRadius: BASE_UNIT * 2,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'SF Pro Display',
    fontSize: 20,
    fontWeight: '700',
    color: colors.light.textPrimary,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontFamily: 'SF Pro Text',
    fontSize: 12,
    fontWeight: '500',
    color: colors.light.textSecondary,
    marginTop: BASE_UNIT,
  },

  // Settings
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: BASE_UNIT * 3,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  settingInfo: {
    flex: 1,
    marginRight: BASE_UNIT * 3,
  },
  settingLabel: {
    fontFamily: 'SF Pro Text',
    fontSize: 16,
    fontWeight: '600',
    color: colors.light.textPrimary,
  },
  settingDescription: {
    fontFamily: 'SF Pro Text',
    fontSize: 13,
    fontWeight: '400',
    color: colors.light.textSecondary,
    marginTop: BASE_UNIT * 0.5,
  },
  valueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: BASE_UNIT * 2,
    paddingVertical: BASE_UNIT,
    backgroundColor: colors.light.surface,
    borderRadius: BASE_UNIT * 2,
  },
  valueButtonText: {
    fontFamily: 'SF Pro Text',
    fontSize: 14,
    fontWeight: '600',
    color: colors.light.primary,
    marginRight: BASE_UNIT,
  },
  subsectionTitle: {
    fontFamily: 'SF Pro Text',
    fontSize: 14,
    fontWeight: '600',
    color: colors.light.textSecondary,
    marginTop: BASE_UNIT * 2,
    marginBottom: BASE_UNIT * 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },


  // Strategy Buttons
  strategyButtons: {
    marginTop: BASE_UNIT * 2,
  },
  strategyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: BASE_UNIT * 3,
    marginBottom: BASE_UNIT * 2,
    backgroundColor: colors.light.surface,
    borderRadius: BASE_UNIT * 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  strategyButtonActive: {
    borderColor: colors.light.primary,
    backgroundColor: colors.light.primary + '08',
  },
  strategyButtonText: {
    fontFamily: 'SF Pro Text',
    fontSize: 15,
    fontWeight: '600',
    color: colors.light.textPrimary,
    marginLeft: BASE_UNIT * 2,
    flex: 1,
  },
  strategyButtonTextActive: {
    color: colors.light.primary,
  },
  strategyButtonDescription: {
    fontFamily: 'SF Pro Text',
    fontSize: 13,
    fontWeight: '400',
    color: colors.light.textSecondary,
    marginLeft: BASE_UNIT * 7,
    marginTop: BASE_UNIT * 0.5,
  },

  // Backup Button
  backupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: BASE_UNIT * 3.5,
    backgroundColor: colors.light.primary,
    borderRadius: BASE_UNIT * 3,
    marginTop: BASE_UNIT * 3,
  },
  backupButtonDisabled: {
    opacity: 0.5,
  },
  backupButtonText: {
    fontFamily: 'SF Pro Text',
    fontSize: 16,
    fontWeight: '600',
    color: colors.light.background,
    marginLeft: BASE_UNIT * 2,
    letterSpacing: 0.2,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: BASE_UNIT * 2.5,
    marginTop: BASE_UNIT * 2,
  },
  linkButtonText: {
    fontFamily: 'SF Pro Text',
    fontSize: 15,
    fontWeight: '600',
    color: colors.light.primary,
    marginLeft: BASE_UNIT,
  },
  linkButtonBadge: {
    fontFamily: 'SF Pro Text',
    fontSize: 13,
    fontWeight: '700',
    color: colors.light.textSecondary,
    marginLeft: BASE_UNIT,
  },

  // Panel
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: SCREEN_WIDTH * 0.9,
    backgroundColor: colors.light.background,
    ...elevation.md,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: BASE_UNIT * 4,
    paddingTop: BASE_UNIT * 12,
    paddingBottom: BASE_UNIT * 4,
    backgroundColor: colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  panelTitle: {
    fontFamily: 'SF Pro Display',
    fontSize: 20,
    fontWeight: '700',
    color: colors.light.textPrimary,
    letterSpacing: -0.3,
  },
  panelCloseButton: {
    width: BASE_UNIT * 11,
    height: BASE_UNIT * 11,
    borderRadius: BASE_UNIT * 5.5,
    backgroundColor: colors.light.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelContent: {
    flex: 1,
    padding: BASE_UNIT * 4,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: BASE_UNIT * 12,
  },
  emptyStateTitle: {
    fontFamily: 'SF Pro Display',
    fontSize: 20,
    fontWeight: '700',
    color: colors.light.textPrimary,
    marginTop: BASE_UNIT * 3,
    letterSpacing: -0.3,
  },
  emptyStateDescription: {
    fontFamily: 'SF Pro Text',
    fontSize: 15,
    fontWeight: '400',
    color: colors.light.textSecondary,
    marginTop: BASE_UNIT,
    textAlign: 'center',
  },

  // File Item
  fileItem: {
    padding: BASE_UNIT * 3,
    backgroundColor: colors.light.surface,
    borderRadius: BASE_UNIT * 3,
    marginBottom: BASE_UNIT * 3,
  },
  fileItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileItemIcon: {
    width: BASE_UNIT * 10,
    height: BASE_UNIT * 10,
    borderRadius: BASE_UNIT * 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileItemInfo: {
    flex: 1,
    marginLeft: BASE_UNIT * 3,
  },
  fileItemTitle: {
    fontFamily: 'SF Pro Text',
    fontSize: 15,
    fontWeight: '600',
    color: colors.light.textPrimary,
  },
  fileItemDescription: {
    fontFamily: 'SF Pro Text',
    fontSize: 13,
    fontWeight: '400',
    color: colors.light.textSecondary,
    marginTop: BASE_UNIT * 0.5,
  },
  fileItemBadge: {
    paddingHorizontal: BASE_UNIT * 2,
    paddingVertical: BASE_UNIT,
    borderRadius: BASE_UNIT * 2,
  },
  fileItemBadgeText: {
    fontFamily: 'SF Pro Text',
    fontSize: 12,
    fontWeight: '700',
    color: colors.light.background,
  },
  fileItemError: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: BASE_UNIT * 2,
    padding: BASE_UNIT * 2,
    backgroundColor: colors.light.error + '15',
    borderRadius: BASE_UNIT * 2,
  },
  fileItemErrorText: {
    fontFamily: 'SF Pro Text',
    fontSize: 13,
    fontWeight: '500',
    color: colors.light.error,
    marginLeft: BASE_UNIT,
    flex: 1,
  },
  fileItemActions: {
    flexDirection: 'row',
    marginTop: BASE_UNIT * 2,
    marginHorizontal: -BASE_UNIT,
  },
  fileItemActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: BASE_UNIT * 2,
    margin: BASE_UNIT,
    backgroundColor: colors.light.primary + '15',
    borderRadius: BASE_UNIT * 2,
  },
  fileItemActionButtonDanger: {
    backgroundColor: colors.light.error + '15',
  },
  fileItemActionText: {
    fontFamily: 'SF Pro Text',
    fontSize: 14,
    fontWeight: '600',
    color: colors.light.primary,
    marginLeft: BASE_UNIT,
  },
  fileItemActionTextDanger: {
    color: colors.light.error,
  },

  // History Item
  historyItem: {
    padding: BASE_UNIT * 3,
    backgroundColor: colors.light.surface,
    borderRadius: BASE_UNIT * 3,
    marginBottom: BASE_UNIT * 3,
  },
  historyItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: BASE_UNIT * 2,
  },
  historyItemInfo: {
    flex: 1,
    marginLeft: BASE_UNIT * 2,
  },
  historyItemTitle: {
    fontFamily: 'SF Pro Text',
    fontSize: 15,
    fontWeight: '600',
    color: colors.light.textPrimary,
  },
  historyItemDescription: {
    fontFamily: 'SF Pro Text',
    fontSize: 13,
    fontWeight: '400',
    color: colors.light.textSecondary,
    marginTop: BASE_UNIT * 0.5,
  },
  historyItemStats: {
    flexDirection: 'row',
    marginHorizontal: -BASE_UNIT,
  },
  historyItemStat: {
    flex: 1,
    margin: BASE_UNIT,
    padding: BASE_UNIT * 2,
    backgroundColor: colors.light.background,
    borderRadius: BASE_UNIT * 2,
    alignItems: 'center',
  },
  historyItemStatLabel: {
    fontFamily: 'SF Pro Text',
    fontSize: 11,
    fontWeight: '500',
    color: colors.light.textSecondary,
    marginBottom: BASE_UNIT * 0.5,
  },
  historyItemStatValue: {
    fontFamily: 'SF Pro Text',
    fontSize: 15,
    fontWeight: '700',
    color: colors.light.textPrimary,
  },
  historyItemError: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: BASE_UNIT * 2,
    padding: BASE_UNIT * 2,
    backgroundColor: colors.light.error + '15',
    borderRadius: BASE_UNIT * 2,
  },
  historyItemErrorText: {
    fontFamily: 'SF Pro Text',
    fontSize: 13,
    fontWeight: '500',
    color: colors.light.error,
    marginLeft: BASE_UNIT,
    flex: 1,
  },


  // Conflict Item
  conflictItem: {
    padding: BASE_UNIT * 4,
    backgroundColor: colors.light.surface,
    borderRadius: BASE_UNIT * 3,
    marginBottom: BASE_UNIT * 3,
  },
  conflictHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: BASE_UNIT * 3,
  },
  conflictTitle: {
    fontFamily: 'SF Pro Text',
    fontSize: 16,
    fontWeight: '700',
    color: colors.light.textPrimary,
    marginLeft: BASE_UNIT * 2,
    flex: 1,
  },
  conflictVersion: {
    padding: BASE_UNIT * 3,
    backgroundColor: colors.light.background,
    borderRadius: BASE_UNIT * 2,
    marginBottom: BASE_UNIT * 2,
  },
  conflictVersionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: BASE_UNIT * 2,
  },
  conflictVersionTitle: {
    fontFamily: 'SF Pro Text',
    fontSize: 15,
    fontWeight: '600',
    color: colors.light.textPrimary,
    marginLeft: BASE_UNIT,
  },
  conflictVersionMeta: {
    fontFamily: 'SF Pro Text',
    fontSize: 13,
    fontWeight: '400',
    color: colors.light.textSecondary,
    marginBottom: BASE_UNIT * 0.5,
  },
  conflictVersionPreview: {
    fontFamily: 'SF Mono',
    fontSize: 12,
    fontWeight: '400',
    color: colors.light.textPrimary,
    marginTop: BASE_UNIT,
    padding: BASE_UNIT * 2,
    backgroundColor: colors.light.surface,
    borderRadius: BASE_UNIT,
  },
  conflictActions: {
    flexDirection: 'row',
    marginHorizontal: -BASE_UNIT,
  },
  conflictActionButton: {
    flex: 1,
    paddingVertical: BASE_UNIT * 2.5,
    margin: BASE_UNIT,
    backgroundColor: colors.light.surface,
    borderRadius: BASE_UNIT * 2,
    borderWidth: 1,
    borderColor: colors.light.border,
    alignItems: 'center',
  },
  conflictActionButtonPrimary: {
    backgroundColor: colors.light.primary,
    borderColor: colors.light.primary,
  },
  conflictActionText: {
    fontFamily: 'SF Pro Text',
    fontSize: 14,
    fontWeight: '600',
    color: colors.light.textPrimary,
  },

  // Bottom Spacer
  bottomSpacer: {
    height: BASE_UNIT * 8,
  },
});
