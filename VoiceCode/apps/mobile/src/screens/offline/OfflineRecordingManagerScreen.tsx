// VoiceFlow Pro Mobile - Offline Recording Manager Screen
// Week 7 Day 48-49: Offline Recording Management and Upload Queue
// Phase 2: Advanced Features - Offline & Cloud Integration

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  Animated,
  RefreshControl,
  ActivityIndicator,
  Switch,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { SettingsStackParamList } from '../../navigation/types';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// Types & Interfaces
// ============================================================================

type OfflineRecordingManagerScreenProps = {
  navigation: StackNavigationProp<SettingsStackParamList, 'OfflineRecordingManager'>;
};

/**
 * Offline recording with metadata
 */
export interface OfflineRecording {
  id: string;
  fileName: string;
  title: string;
  duration: number; // seconds
  size: number; // bytes
  recordedAt: string; // ISO timestamp
  localPath: string;
  format: RecordingFormat;
  quality: RecordingQuality;
  status: RecordingStatus;
  uploadStatus: UploadStatus;
  uploadProgress?: number; // 0-100
  uploadAttempts: number;
  lastUploadAttempt?: string; // ISO timestamp
  uploadError?: string;
  metadata: RecordingMetadata;
  transcriptionStatus: TranscriptionStatus;
  transcriptionProgress?: number; // 0-100
}

/**
 * Recording metadata
 */
export interface RecordingMetadata {
  deviceId: string;
  deviceName: string;
  appVersion: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  tags: string[];
  notes?: string;
  speakerCount?: number;
  language: string;
}

/**
 * Upload queue item
 */
export interface UploadQueueItem {
  id: string;
  recordingId: string;
  priority: UploadPriority;
  addedAt: string; // ISO timestamp
  scheduledFor?: string; // ISO timestamp
  retryCount: number;
  maxRetries: number;
  status: UploadStatus;
  progress: number; // 0-100
  error?: string;
}

/**
 * Upload statistics
 */
export interface UploadStatistics {
  totalRecordings: number;
  pendingUploads: number;
  uploadingCount: number;
  completedUploads: number;
  failedUploads: number;
  totalSize: number; // bytes
  uploadedSize: number; // bytes
  averageUploadSpeed: number; // bytes/second
  estimatedTimeRemaining: number; // seconds
}

/**
 * Storage optimization settings
 */
export interface StorageOptimizationSettings {
  autoDeleteAfterUpload: boolean;
  deleteAfterDays: number;
  maxLocalStorage: number; // MB
  compressBeforeUpload: boolean;
  uploadOnlyOnWiFi: boolean;
  uploadOnlyWhenCharging: boolean;
}

// Type Aliases
export type RecordingFormat = 'm4a' | 'wav' | 'mp3' | 'aac';
export type RecordingQuality = 'low' | 'medium' | 'high' | 'lossless';
export type RecordingStatus = 'recording' | 'paused' | 'completed' | 'error';
export type UploadStatus = 'pending' | 'queued' | 'uploading' | 'completed' | 'failed' | 'cancelled';
export type UploadPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TranscriptionStatus = 'pending' | 'processing' | 'completed' | 'failed';

// ============================================================================
// Constants
// ============================================================================

const BASE_UNIT = 4;

const RECORDING_FORMATS: Array<{ id: RecordingFormat; name: string; icon: string; extension: string }> = [
  { id: 'm4a', name: 'M4A (AAC)', icon: 'musical-notes-outline', extension: '.m4a' },
  { id: 'wav', name: 'WAV', icon: 'analytics-outline', extension: '.wav' },
  { id: 'mp3', name: 'MP3', icon: 'disc-outline', extension: '.mp3' },
  { id: 'aac', name: 'AAC', icon: 'radio-outline', extension: '.aac' },
];

const QUALITY_LEVELS: Array<{ id: RecordingQuality; name: string; bitrate: string; color: string }> = [
  { id: 'low', name: 'Low', bitrate: '64 kbps', color: '#9CA3AF' },
  { id: 'medium', name: 'Medium', bitrate: '128 kbps', color: '#3B82F6' },
  { id: 'high', name: 'High', bitrate: '256 kbps', color: '#10B981' },
  { id: 'lossless', name: 'Lossless', bitrate: '1411 kbps', color: '#8b5cf6' },
];

const UPLOAD_PRIORITIES: Array<{ id: UploadPriority; name: string; icon: string; color: string }> = [
  { id: 'low', name: 'Low', icon: 'arrow-down-outline', color: '#9CA3AF' },
  { id: 'normal', name: 'Normal', icon: 'arrow-forward-outline', color: '#3B82F6' },
  { id: 'high', name: 'High', icon: 'arrow-up-outline', color: '#EF4444' },
];

const STATUS_COLORS: Record<UploadStatus, string> = {
  pending: '#F59E0B',
  queued: '#9CA3AF',
  uploading: '#3B82F6',
  completed: '#10B981',
  failed: '#EF4444',
  cancelled: '#6B7280',
};

const STATUS_ICONS: Record<UploadStatus, any> = {
  pending: 'time-outline',
  queued: 'list-outline',
  uploading: 'cloud-upload-outline',
  completed: 'checkmark-circle-outline',
  failed: 'alert-circle-outline',
  cancelled: 'close-circle-outline',
};

// ============================================================================
// Component
// ============================================================================

const OfflineRecordingManagerScreen: React.FC<OfflineRecordingManagerScreenProps> = ({ navigation }) => {
  // ============================================================================
  // State
  // ============================================================================

  const [recordings, setRecordings] = useState<OfflineRecording[]>([]);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [statistics, setStatistics] = useState<UploadStatistics | null>(null);
  const [optimizationSettings, setOptimizationSettings] = useState<StorageOptimizationSettings>({
    autoDeleteAfterUpload: false,
    deleteAfterDays: 30,
    maxLocalStorage: 1024, // 1GB
    compressBeforeUpload: true,
    uploadOnlyOnWiFi: false,
    uploadOnlyWhenCharging: false,
  });
  const [selectedRecording, setSelectedRecording] = useState<OfflineRecording | null>(null);
  const [filterStatus, setFilterStatus] = useState<UploadStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'size' | 'duration' | 'name'>('date');
  const [isUploading, setIsUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('recordings');
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [autoUploadEnabled, setAutoUploadEnabled] = useState(true);

  // ============================================================================
  // Refs & Animations
  // ============================================================================

  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const detailSlideAnim = useRef(new Animated.Value(Dimensions.get('window').width)).current;
  const settingsSlideAnim = useRef(new Animated.Value(Dimensions.get('window').width)).current;

  // ============================================================================
  // Effects
  // ============================================================================

  /**
   * Initialize screen with entrance animation
   */
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    loadRecordings();
    loadUploadQueue();
    loadStatistics();
    loadOptimizationSettings();
  }, []);

  /**
   * Animate detail panel
   */
  useEffect(() => {
    Animated.timing(detailSlideAnim, {
      toValue: showDetailPanel ? 0 : Dimensions.get('window').width,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showDetailPanel]);

  /**
   * Animate settings panel
   */
  useEffect(() => {
    Animated.timing(settingsSlideAnim, {
      toValue: showSettingsPanel ? 0 : Dimensions.get('window').width,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showSettingsPanel]);

  /**
   * Auto-upload when enabled and connected
   */
  useEffect(() => {
    if (autoUploadEnabled && !isUploading) {
      const pendingItems = uploadQueue.filter(item => item.status === 'pending' || item.status === 'queued');
      if (pendingItems.length > 0) {
        // Start upload process
        handleStartUpload();
      }
    }
  }, [autoUploadEnabled, uploadQueue]);

  // ============================================================================
  // Data Management Functions
  // ============================================================================

  /**
   * Load recordings from storage
   */
  const loadRecordings = async () => {
    try {
      const stored = await AsyncStorage.getItem('@voiceflow_offline_recordings');
      if (stored) {
        setRecordings(JSON.parse(stored));
      } else {
        // Mock data for demonstration
        const mockRecordings: OfflineRecording[] = [
          {
            id: '1',
            fileName: 'meeting_2026_01_07.m4a',
            title: 'Team Meeting - Q1 Planning',
            duration: 3600, // 1 hour
            size: 45 * 1024 * 1024, // 45 MB
            recordedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            localPath: '/recordings/meeting_2026_01_07.m4a',
            format: 'm4a',
            quality: 'high',
            status: 'completed',
            uploadStatus: 'pending',
            uploadAttempts: 0,
            metadata: {
              deviceId: 'device-123',
              deviceName: 'iPhone 15 Pro',
              appVersion: '1.0.0',
              tags: ['meeting', 'planning', 'q1'],
              language: 'en-US',
            },
            transcriptionStatus: 'pending',
          },
          {
            id: '2',
            fileName: 'interview_2026_01_06.m4a',
            title: 'Customer Interview - Product Feedback',
            duration: 1800, // 30 minutes
            size: 22 * 1024 * 1024, // 22 MB
            recordedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            localPath: '/recordings/interview_2026_01_06.m4a',
            format: 'm4a',
            quality: 'high',
            status: 'completed',
            uploadStatus: 'uploading',
            uploadProgress: 65,
            uploadAttempts: 1,
            metadata: {
              deviceId: 'device-123',
              deviceName: 'iPhone 15 Pro',
              appVersion: '1.0.0',
              tags: ['interview', 'customer', 'feedback'],
              language: 'en-US',
            },
            transcriptionStatus: 'pending',
          },
          {
            id: '3',
            fileName: 'lecture_2026_01_05.m4a',
            title: 'University Lecture - Machine Learning',
            duration: 5400, // 90 minutes
            size: 67 * 1024 * 1024, // 67 MB
            recordedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
            localPath: '/recordings/lecture_2026_01_05.m4a',
            format: 'm4a',
            quality: 'high',
            status: 'completed',
            uploadStatus: 'completed',
            uploadProgress: 100,
            uploadAttempts: 1,
            metadata: {
              deviceId: 'device-123',
              deviceName: 'iPhone 15 Pro',
              appVersion: '1.0.0',
              tags: ['lecture', 'education', 'ml'],
              language: 'en-US',
            },
            transcriptionStatus: 'completed',
            transcriptionProgress: 100,
          },
        ];
        setRecordings(mockRecordings);
      }
    } catch (error) {
      console.error('Error loading recordings:', error);
    }
  };


  /**
   * Load upload queue from storage
   */
  const loadUploadQueue = async () => {
    try {
      const stored = await AsyncStorage.getItem('@voiceflow_upload_queue');
      if (stored) {
        setUploadQueue(JSON.parse(stored));
      } else {
        // Mock queue data
        const mockQueue: UploadQueueItem[] = [
          {
            id: 'q1',
            recordingId: '1',
            priority: 'normal',
            addedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            retryCount: 0,
            maxRetries: 3,
            status: 'pending',
            progress: 0,
          },
          {
            id: 'q2',
            recordingId: '2',
            priority: 'high',
            addedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            retryCount: 1,
            maxRetries: 3,
            status: 'uploading',
            progress: 65,
          },
        ];
        setUploadQueue(mockQueue);
      }
    } catch (error) {
      console.error('Error loading upload queue:', error);
    }
  };

  /**
   * Load statistics
   */
  const loadStatistics = async () => {
    try {
      const stored = await AsyncStorage.getItem('@voiceflow_upload_statistics');
      if (stored) {
        setStatistics(JSON.parse(stored));
      } else {
        // Calculate statistics from recordings
        const stats: UploadStatistics = {
          totalRecordings: 3,
          pendingUploads: 1,
          uploadingCount: 1,
          completedUploads: 1,
          failedUploads: 0,
          totalSize: 134 * 1024 * 1024, // 134 MB
          uploadedSize: 81 * 1024 * 1024, // 81 MB
          averageUploadSpeed: 512 * 1024, // 512 KB/s
          estimatedTimeRemaining: 104, // seconds
        };
        setStatistics(stats);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  /**
   * Load optimization settings
   */
  const loadOptimizationSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem('@voiceflow_optimization_settings');
      if (stored) {
        setOptimizationSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading optimization settings:', error);
    }
  };

  /**
   * Save recordings to storage
   */
  const saveRecordings = async (newRecordings: OfflineRecording[]) => {
    try {
      await AsyncStorage.setItem('@voiceflow_offline_recordings', JSON.stringify(newRecordings));
      setRecordings(newRecordings);
    } catch (error) {
      console.error('Error saving recordings:', error);
    }
  };

  /**
   * Save upload queue to storage
   */
  const saveUploadQueue = async (newQueue: UploadQueueItem[]) => {
    try {
      await AsyncStorage.setItem('@voiceflow_upload_queue', JSON.stringify(newQueue));
      setUploadQueue(newQueue);
    } catch (error) {
      console.error('Error saving upload queue:', error);
    }
  };

  /**
   * Save optimization settings
   */
  const saveOptimizationSettings = async (newSettings: StorageOptimizationSettings) => {
    try {
      await AsyncStorage.setItem('@voiceflow_optimization_settings', JSON.stringify(newSettings));
      setOptimizationSettings(newSettings);
    } catch (error) {
      console.error('Error saving optimization settings:', error);
    }
  };

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Handle back navigation
   */
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  /**
   * Handle section toggle
   */
  const handleToggleSection = (section: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedSection(expandedSection === section ? null : section);
  };

  /**
   * Handle refresh
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadRecordings(),
      loadUploadQueue(),
      loadStatistics(),
    ]);
    setRefreshing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  /**
   * Handle start upload
   */
  const handleStartUpload = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsUploading(true);

    // Simulate upload process
    setTimeout(() => {
      setIsUploading(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Upload Started', 'Recordings are being uploaded in the background.');
    }, 1500);
  };

  /**
   * Handle pause upload
   */
  const handlePauseUpload = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsUploading(false);
    Alert.alert('Upload Paused', 'Upload process has been paused.');
  };


  /**
   * Handle retry upload for a specific recording
   */
  const handleRetryUpload = (recordingId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const updatedRecordings = recordings.map(rec =>
      rec.id === recordingId
        ? { ...rec, uploadStatus: 'queued' as UploadStatus, uploadError: undefined }
        : rec
    );
    saveRecordings(updatedRecordings);

    Alert.alert('Upload Queued', 'Recording has been added to the upload queue.');
  };

  /**
   * Handle cancel upload
   */
  const handleCancelUpload = (recordingId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Cancel Upload',
      'Are you sure you want to cancel this upload?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => {
            const updatedRecordings = recordings.map(rec =>
              rec.id === recordingId
                ? { ...rec, uploadStatus: 'cancelled' as UploadStatus }
                : rec
            );
            saveRecordings(updatedRecordings);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  /**
   * Handle delete recording
   */
  const handleDeleteRecording = (recordingId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Delete Recording',
      'Are you sure you want to delete this recording? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedRecordings = recordings.filter(rec => rec.id !== recordingId);
            saveRecordings(updatedRecordings);
            setSelectedRecording(null);
            setShowDetailPanel(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  /**
   * Handle view recording details
   */
  const handleViewDetails = (recording: OfflineRecording) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedRecording(recording);
    setShowDetailPanel(true);
  };

  /**
   * Handle close detail panel
   */
  const handleCloseDetailPanel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowDetailPanel(false);
    setTimeout(() => setSelectedRecording(null), 300);
  };

  /**
   * Handle open settings panel
   */
  const handleOpenSettings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowSettingsPanel(true);
  };

  /**
   * Handle close settings panel
   */
  const handleCloseSettingsPanel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowSettingsPanel(false);
  };

  /**
   * Handle toggle auto-upload
   */
  const handleToggleAutoUpload = (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAutoUploadEnabled(value);
  };

  /**
   * Handle update optimization setting
   */
  const handleUpdateOptimizationSetting = (key: keyof StorageOptimizationSettings, value: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newSettings = { ...optimizationSettings, [key]: value };
    saveOptimizationSettings(newSettings);
  };

  /**
   * Handle change priority
   */
  const handleChangePriority = (recordingId: string, priority: UploadPriority) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const updatedQueue = uploadQueue.map(item =>
      item.recordingId === recordingId ? { ...item, priority } : item
    );
    saveUploadQueue(updatedQueue);
  };

  /**
   * Handle clear completed uploads
   */
  const handleClearCompleted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Clear Completed',
      'Remove all completed uploads from the list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: () => {
            const updatedQueue = uploadQueue.filter(item => item.status !== 'completed');
            saveUploadQueue(updatedQueue);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  // ============================================================================
  // Computed Values
  // ============================================================================

  const filteredRecordings = recordings
    .filter(rec => filterStatus === 'all' || rec.uploadStatus === filterStatus)
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime();
        case 'size':
          return b.size - a.size;
        case 'duration':
          return b.duration - a.duration;
        case 'name':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  const pendingCount = recordings.filter(r => r.uploadStatus === 'pending').length;
  const uploadingCount = recordings.filter(r => r.uploadStatus === 'uploading').length;
  const completedCount = recordings.filter(r => r.uploadStatus === 'completed').length;


  // ============================================================================
  // Utility Functions
  // ============================================================================

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatSpeed = (bytesPerSecond: number): string => {
    if (bytesPerSecond < 1024) return `${bytesPerSecond} B/s`;
    if (bytesPerSecond < 1024 * 1024) return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
    return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
  };

  // ============================================================================
  // Render Functions
  // ============================================================================

  /**
   * Render header
   */
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={handleBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#111827" />
      </TouchableOpacity>
      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle}>Offline Recordings</Text>
        {pendingCount > 0 && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{pendingCount}</Text>
          </View>
        )}
      </View>
      <TouchableOpacity onPress={handleOpenSettings} style={styles.headerAction}>
        <Ionicons name="settings-outline" size={24} color="#111827" />
      </TouchableOpacity>
    </View>
  );

  /**
   * Render statistics
   */
  const renderStatistics = () => {
    if (!statistics) return null;

    const uploadProgress = statistics.totalSize > 0
      ? (statistics.uploadedSize / statistics.totalSize) * 100
      : 0;

    return (
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => handleToggleSection('statistics')}
          activeOpacity={0.7}
        >
          <View style={styles.sectionHeaderLeft}>
            <Ionicons name="stats-chart-outline" size={20} color="#3B82F6" />
            <Text style={styles.sectionTitle}>Upload Statistics</Text>
          </View>
          <Ionicons
            name={expandedSection === 'statistics' ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#6B7280"
          />
        </TouchableOpacity>

        {expandedSection === 'statistics' && (
          <View style={styles.sectionContent}>
            {/* Statistics Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{statistics.totalRecordings}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: '#F59E0B' }]}>{statistics.pendingUploads}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: '#10B981' }]}>{statistics.completedUploads}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
            </View>

            {/* Upload Progress */}
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Overall Progress</Text>
                <Text style={styles.progressValue}>{uploadProgress.toFixed(0)}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${uploadProgress}%` }
                  ]}
                />
              </View>
            </View>

            {/* Additional Stats */}
            <View style={styles.additionalStats}>
              <View style={styles.statRow}>
                <Text style={styles.statRowLabel}>Total Size:</Text>
                <Text style={styles.statRowValue}>{formatFileSize(statistics.totalSize)}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statRowLabel}>Uploaded:</Text>
                <Text style={styles.statRowValue}>{formatFileSize(statistics.uploadedSize)}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statRowLabel}>Avg. Speed:</Text>
                <Text style={styles.statRowValue}>{formatSpeed(statistics.averageUploadSpeed)}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statRowLabel}>Est. Time:</Text>
                <Text style={styles.statRowValue}>{formatDuration(statistics.estimatedTimeRemaining)}</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };
  /**
   * Render upload controls
   */
  const renderUploadControls = () => (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => handleToggleSection('controls')}
        activeOpacity={0.7}
      >
        <View style={styles.sectionHeaderLeft}>
          <Ionicons name="cloud-upload-outline" size={20} color="#3B82F6" />
          <Text style={styles.sectionTitle}>Upload Controls</Text>
        </View>
        <Ionicons
          name={expandedSection === 'controls' ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#6B7280"
        />
      </TouchableOpacity>

      {expandedSection === 'controls' && (
        <View style={styles.sectionContent}>
          {/* Auto-Upload Toggle */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="flash-outline" size={20} color="#3B82F6" />
              <Text style={styles.settingLabel}>Auto-Upload</Text>
            </View>
            <Switch
              value={autoUploadEnabled}
              onValueChange={handleToggleAutoUpload}
              trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
              thumbColor={autoUploadEnabled ? '#3B82F6' : '#F9FAFB'}
              ios_backgroundColor="#E5E7EB"
            />
          </View>

          {/* Upload Buttons */}
          <View style={styles.uploadButtons}>
            {!isUploading ? (
              <TouchableOpacity
                style={[styles.uploadButton, styles.uploadButtonPrimary]}
                onPress={handleStartUpload}
                activeOpacity={0.7}
              >
                <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
                <Text style={styles.uploadButtonText}>Start Upload</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.uploadButton, styles.uploadButtonSecondary]}
                onPress={handlePauseUpload}
                activeOpacity={0.7}
              >
                <Ionicons name="pause-outline" size={20} color="#3B82F6" />
                <Text style={[styles.uploadButtonText, { color: '#3B82F6' }]}>Pause Upload</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.uploadButton, styles.uploadButtonOutline]}
              onPress={handleClearCompleted}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={20} color="#6B7280" />
              <Text style={[styles.uploadButtonText, { color: '#6B7280' }]}>Clear Completed</Text>
            </TouchableOpacity>
          </View>

          {/* Upload Status */}
          {isUploading && (
            <View style={styles.uploadStatus}>
              <ActivityIndicator size="small" color="#3B82F6" />
              <Text style={styles.uploadStatusText}>Uploading recordings...</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  /**
   * Render recordings list
   */
  const renderRecordingsList = () => (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => handleToggleSection('recordings')}
        activeOpacity={0.7}
      >
        <View style={styles.sectionHeaderLeft}>
          <Ionicons name="folder-outline" size={20} color="#3B82F6" />
          <Text style={styles.sectionTitle}>Recordings ({filteredRecordings.length})</Text>
        </View>
        <Ionicons
          name={expandedSection === 'recordings' ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#6B7280"
        />
      </TouchableOpacity>

      {expandedSection === 'recordings' && (
        <View style={styles.sectionContent}>
          {/* Filters */}
          <View style={styles.filters}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {(['all', 'pending', 'uploading', 'completed', 'failed'] as const).map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterChip,
                    filterStatus === status && styles.filterChipActive,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setFilterStatus(status);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      filterStatus === status && styles.filterChipTextActive,
                    ]}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Sort Options */}
          <View style={styles.sortContainer}>
            <Text style={styles.sortLabel}>Sort by:</Text>
            <View style={styles.sortOptions}>
              {(['date', 'size', 'duration', 'name'] as const).map((sort) => (
                <TouchableOpacity
                  key={sort}
                  style={[
                    styles.sortOption,
                    sortBy === sort && styles.sortOptionActive,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSortBy(sort);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.sortOptionText,
                      sortBy === sort && styles.sortOptionTextActive,
                    ]}
                  >
                    {sort.charAt(0).toUpperCase() + sort.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Recordings */}
          {filteredRecordings.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="folder-open-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateTitle}>No Recordings</Text>
              <Text style={styles.emptyStateText}>
                {filterStatus === 'all'
                  ? 'No offline recordings found'
                  : `No ${filterStatus} recordings`}
              </Text>
            </View>
          ) : (
            filteredRecordings.map((recording) => (
              <TouchableOpacity
                key={recording.id}
                style={styles.recordingCard}
                onPress={() => handleViewDetails(recording)}
                activeOpacity={0.7}
              >
                <View style={styles.recordingHeader}>
                  <View style={styles.recordingIcon}>
                    <Ionicons name="mic-outline" size={24} color="#3B82F6" />
                  </View>
                  <View style={styles.recordingInfo}>
                    <Text style={styles.recordingTitle} numberOfLines={1}>
                      {recording.title}
                    </Text>
                    <Text style={styles.recordingMeta}>
                      {formatDate(recording.recordedAt)} • {formatDuration(recording.duration)} • {formatFileSize(recording.size)}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[recording.uploadStatus] }]}>
                    <Ionicons name={STATUS_ICONS[recording.uploadStatus]} size={16} color="#FFFFFF" />
                  </View>
                </View>

                {/* Upload Progress */}
                {recording.uploadStatus === 'uploading' && recording.uploadProgress !== undefined && (
                  <View style={styles.recordingProgress}>
                    <View style={styles.recordingProgressBar}>
                      <View
                        style={[
                          styles.recordingProgressFill,
                          { width: `${recording.uploadProgress}%` }
                        ]}
                      />
                    </View>
                    <Text style={styles.recordingProgressText}>{recording.uploadProgress}%</Text>
                  </View>
                )}

                {/* Error Message */}
                {recording.uploadStatus === 'failed' && recording.uploadError && (
                  <View style={styles.recordingError}>
                    <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
                    <Text style={styles.recordingErrorText} numberOfLines={1}>
                      {recording.uploadError}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      )}
    </View>
  );
  /**
   * Render detail panel
   */
  const renderDetailPanel = () => {
    if (!selectedRecording) return null;

    return (
      <Animated.View
        style={[
          styles.panel,
          {
            transform: [{ translateX: detailSlideAnim }],
          },
        ]}
      >
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Recording Details</Text>
          <TouchableOpacity onPress={handleCloseDetailPanel} style={styles.panelClose}>
            <Ionicons name="close" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.panelContent} showsVerticalScrollIndicator={false}>
          {/* File Information */}
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>FILE INFORMATION</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Title:</Text>
              <Text style={styles.detailValue}>{selectedRecording.title}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>File Name:</Text>
              <Text style={styles.detailValue}>{selectedRecording.fileName}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Format:</Text>
              <Text style={styles.detailValue}>{selectedRecording.format.toUpperCase()}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Quality:</Text>
              <Text style={styles.detailValue}>{selectedRecording.quality.charAt(0).toUpperCase() + selectedRecording.quality.slice(1)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Duration:</Text>
              <Text style={styles.detailValue}>{formatDuration(selectedRecording.duration)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Size:</Text>
              <Text style={styles.detailValue}>{formatFileSize(selectedRecording.size)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Recorded:</Text>
              <Text style={styles.detailValue}>{formatDate(selectedRecording.recordedAt)}</Text>
            </View>
          </View>

          {/* Upload Status */}
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>UPLOAD STATUS</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[selectedRecording.uploadStatus] }]}>
                <Ionicons name={STATUS_ICONS[selectedRecording.uploadStatus]} size={14} color="#FFFFFF" />
                <Text style={styles.statusBadgeText}>{selectedRecording.uploadStatus.toUpperCase()}</Text>
              </View>
            </View>
            {selectedRecording.uploadProgress !== undefined && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Progress:</Text>
                <Text style={styles.detailValue}>{selectedRecording.uploadProgress}%</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Attempts:</Text>
              <Text style={styles.detailValue}>{selectedRecording.uploadAttempts}</Text>
            </View>
            {selectedRecording.uploadError && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Error:</Text>
                <Text style={[styles.detailValue, { color: '#EF4444' }]}>{selectedRecording.uploadError}</Text>
              </View>
            )}
          </View>

          {/* Metadata */}
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>METADATA</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Device:</Text>
              <Text style={styles.detailValue}>{selectedRecording.metadata.deviceName}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Language:</Text>
              <Text style={styles.detailValue}>{selectedRecording.metadata.language}</Text>
            </View>
            {selectedRecording.metadata.tags.length > 0 && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tags:</Text>
                <View style={styles.tagContainer}>
                  {selectedRecording.metadata.tags.map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles.detailActions}>
            {selectedRecording.uploadStatus === 'failed' && (
              <TouchableOpacity
                style={[styles.detailButton, styles.detailButtonPrimary]}
                onPress={() => handleRetryUpload(selectedRecording.id)}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh-outline" size={20} color="#FFFFFF" />
                <Text style={styles.detailButtonText}>Retry Upload</Text>
              </TouchableOpacity>
            )}
            {selectedRecording.uploadStatus === 'uploading' && (
              <TouchableOpacity
                style={[styles.detailButton, styles.detailButtonSecondary]}
                onPress={() => handleCancelUpload(selectedRecording.id)}
                activeOpacity={0.7}
              >
                <Ionicons name="close-outline" size={20} color="#F59E0B" />
                <Text style={[styles.detailButtonText, { color: '#F59E0B' }]}>Cancel Upload</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.detailButton, styles.detailButtonDanger]}
              onPress={() => handleDeleteRecording(selectedRecording.id)}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
              <Text style={[styles.detailButtonText, { color: '#EF4444' }]}>Delete Recording</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>
    );
  };
  /**
   * Render settings panel
   */
  const renderSettingsPanel = () => (
    <Animated.View
      style={[
        styles.panel,
        {
          transform: [{ translateX: settingsSlideAnim }],
        },
      ]}
    >
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>Storage Optimization</Text>
        <TouchableOpacity onPress={handleCloseSettingsPanel} style={styles.panelClose}>
          <Ionicons name="close" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.panelContent} showsVerticalScrollIndicator={false}>
        {/* Auto-Delete After Upload */}
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Ionicons name="trash-outline" size={20} color="#3B82F6" />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Auto-Delete After Upload</Text>
              <Text style={styles.settingDescription}>Remove local files after successful upload</Text>
            </View>
          </View>
          <Switch
            value={optimizationSettings.autoDeleteAfterUpload}
            onValueChange={(value) => handleUpdateOptimizationSetting('autoDeleteAfterUpload', value)}
            trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
            thumbColor={optimizationSettings.autoDeleteAfterUpload ? '#3B82F6' : '#F9FAFB'}
            ios_backgroundColor="#E5E7EB"
          />
        </View>

        {/* Compress Before Upload */}
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Ionicons name="archive-outline" size={20} color="#3B82F6" />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Compress Before Upload</Text>
              <Text style={styles.settingDescription}>Reduce file size before uploading</Text>
            </View>
          </View>
          <Switch
            value={optimizationSettings.compressBeforeUpload}
            onValueChange={(value) => handleUpdateOptimizationSetting('compressBeforeUpload', value)}
            trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
            thumbColor={optimizationSettings.compressBeforeUpload ? '#3B82F6' : '#F9FAFB'}
            ios_backgroundColor="#E5E7EB"
          />
        </View>

        {/* Upload Only on WiFi */}
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Ionicons name="wifi-outline" size={20} color="#3B82F6" />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Upload Only on WiFi</Text>
              <Text style={styles.settingDescription}>Prevent uploads on cellular data</Text>
            </View>
          </View>
          <Switch
            value={optimizationSettings.uploadOnlyOnWiFi}
            onValueChange={(value) => handleUpdateOptimizationSetting('uploadOnlyOnWiFi', value)}
            trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
            thumbColor={optimizationSettings.uploadOnlyOnWiFi ? '#3B82F6' : '#F9FAFB'}
            ios_backgroundColor="#E5E7EB"
          />
        </View>

        {/* Upload Only When Charging */}
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Ionicons name="battery-charging-outline" size={20} color="#3B82F6" />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Upload Only When Charging</Text>
              <Text style={styles.settingDescription}>Save battery by uploading while charging</Text>
            </View>
          </View>
          <Switch
            value={optimizationSettings.uploadOnlyWhenCharging}
            onValueChange={(value) => handleUpdateOptimizationSetting('uploadOnlyWhenCharging', value)}
            trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
            thumbColor={optimizationSettings.uploadOnlyWhenCharging ? '#3B82F6' : '#F9FAFB'}
            ios_backgroundColor="#E5E7EB"
          />
        </View>

        {/* Delete After Days */}
        <View style={styles.settingSection}>
          <Text style={styles.settingSectionTitle}>STORAGE CLEANUP</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="calendar-outline" size={20} color="#3B82F6" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Delete After Days</Text>
                <Text style={styles.settingDescription}>Auto-delete recordings older than {optimizationSettings.deleteAfterDays} days</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Max Local Storage */}
        <View style={styles.settingSection}>
          <Text style={styles.settingSectionTitle}>STORAGE LIMIT</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="server-outline" size={20} color="#3B82F6" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Max Local Storage</Text>
                <Text style={styles.settingDescription}>{optimizationSettings.maxLocalStorage} MB maximum</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );

  /**
   * Main render
   */
  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
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
              tintColor="#3B82F6"
              colors={['#3B82F6']}
            />
          }
        >
          {renderStatistics()}
          {renderUploadControls()}
          {renderRecordingsList()}
        </ScrollView>
      </Animated.View>

      {/* Panels */}
      {renderDetailPanel()}
      {renderSettingsPanel()}
    </View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: BASE_UNIT * 6,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: BASE_UNIT * 4,
    paddingTop: Platform.OS === 'ios' ? BASE_UNIT * 14 : BASE_UNIT * 4,
    paddingBottom: BASE_UNIT * 3,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  backButton: {
    width: BASE_UNIT * 11,
    height: BASE_UNIT * 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: BASE_UNIT * 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
    letterSpacing: -0.3,
  },
  headerBadge: {
    backgroundColor: '#EF4444',
    borderRadius: BASE_UNIT * 3,
    paddingHorizontal: BASE_UNIT * 2,
    paddingVertical: BASE_UNIT,
    minWidth: BASE_UNIT * 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  headerAction: {
    width: BASE_UNIT * 11,
    height: BASE_UNIT * 11,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Section
  section: {
    marginTop: BASE_UNIT * 4,
    marginHorizontal: BASE_UNIT * 4,
    backgroundColor: '#F9FAFB',
    borderRadius: BASE_UNIT * 3,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: BASE_UNIT * 4,
    backgroundColor: '#FFFFFF',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BASE_UNIT * 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    letterSpacing: -0.2,
  },
  sectionContent: {
    padding: BASE_UNIT * 4,
    paddingTop: 0,
  },
  // Statistics
  statsGrid: {
    flexDirection: 'row',
    gap: BASE_UNIT * 3,
    marginBottom: BASE_UNIT * 4,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: BASE_UNIT * 2,
    padding: BASE_UNIT * 3,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
    letterSpacing: -0.5,
    marginBottom: BASE_UNIT,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressContainer: {
    marginBottom: BASE_UNIT * 4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: BASE_UNIT * 2,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  progressBar: {
    height: BASE_UNIT * 2,
    backgroundColor: '#E5E7EB',
    borderRadius: BASE_UNIT,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: BASE_UNIT,
  },
  additionalStats: {
    gap: BASE_UNIT * 2,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: BASE_UNIT,
  },
  statRowLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  statRowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },

  // Upload Controls
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: BASE_UNIT * 3,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BASE_UNIT * 3,
    flex: 1,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    marginBottom: BASE_UNIT / 2,
  },
  settingDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: BASE_UNIT * 3,
    marginTop: BASE_UNIT * 4,
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: BASE_UNIT * 2,
    paddingVertical: BASE_UNIT * 3,
    borderRadius: BASE_UNIT * 2,
    minHeight: BASE_UNIT * 11,
  },
  uploadButtonPrimary: {
    backgroundColor: '#3B82F6',
  },
  uploadButtonSecondary: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  uploadButtonOutline: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  uploadButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    letterSpacing: 0.2,
  },
  uploadStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BASE_UNIT * 2,
    marginTop: BASE_UNIT * 3,
    padding: BASE_UNIT * 3,
    backgroundColor: '#EFF6FF',
    borderRadius: BASE_UNIT * 2,
  },
  uploadStatusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },

  // Filters & Sort
  filters: {
    marginBottom: BASE_UNIT * 3,
  },
  filterChip: {
    paddingHorizontal: BASE_UNIT * 4,
    paddingVertical: BASE_UNIT * 2,
    borderRadius: BASE_UNIT * 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: BASE_UNIT * 2,
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  sortContainer: {
    marginBottom: BASE_UNIT * 4,
  },
  sortLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    marginBottom: BASE_UNIT * 2,
  },
  sortOptions: {
    flexDirection: 'row',
    gap: BASE_UNIT * 2,
  },
  sortOption: {
    paddingHorizontal: BASE_UNIT * 3,
    paddingVertical: BASE_UNIT * 2,
    borderRadius: BASE_UNIT * 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sortOptionActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  sortOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  sortOptionTextActive: {
    color: '#3B82F6',
  },

  // Recordings
  recordingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BASE_UNIT * 2,
    padding: BASE_UNIT * 3,
    marginBottom: BASE_UNIT * 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  recordingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BASE_UNIT * 3,
  },
  recordingIcon: {
    width: BASE_UNIT * 10,
    height: BASE_UNIT * 10,
    borderRadius: BASE_UNIT * 2,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingInfo: {
    flex: 1,
  },
  recordingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    marginBottom: BASE_UNIT,
  },
  recordingMeta: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BASE_UNIT,
    paddingHorizontal: BASE_UNIT * 2,
    paddingVertical: BASE_UNIT,
    borderRadius: BASE_UNIT * 2,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  recordingProgress: {
    marginTop: BASE_UNIT * 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: BASE_UNIT * 2,
  },
  recordingProgressBar: {
    flex: 1,
    height: BASE_UNIT * 2,
    backgroundColor: '#E5E7EB',
    borderRadius: BASE_UNIT,
    overflow: 'hidden',
  },
  recordingProgressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: BASE_UNIT,
  },
  recordingProgressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    minWidth: BASE_UNIT * 10,
    textAlign: 'right',
  },
  recordingError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BASE_UNIT * 2,
    marginTop: BASE_UNIT * 2,
    padding: BASE_UNIT * 2,
    backgroundColor: '#FEF2F2',
    borderRadius: BASE_UNIT,
  },
  recordingErrorText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: '#EF4444',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: BASE_UNIT * 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
    marginTop: BASE_UNIT * 3,
    marginBottom: BASE_UNIT,
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    textAlign: 'center',
  },

  // Panel
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: Dimensions.get('window').width,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: -2, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: BASE_UNIT * 4,
    paddingTop: Platform.OS === 'ios' ? BASE_UNIT * 14 : BASE_UNIT * 4,
    paddingBottom: BASE_UNIT * 3,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
    letterSpacing: -0.3,
  },
  panelClose: {
    width: BASE_UNIT * 11,
    height: BASE_UNIT * 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelContent: {
    flex: 1,
    padding: BASE_UNIT * 4,
  },

  // Detail Panel
  detailSection: {
    marginBottom: BASE_UNIT * 6,
  },
  detailSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    letterSpacing: 0.5,
    marginBottom: BASE_UNIT * 3,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: BASE_UNIT * 2,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    flex: 2,
    textAlign: 'right',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: BASE_UNIT * 2,
    flex: 2,
    justifyContent: 'flex-end',
  },
  tag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: BASE_UNIT * 2,
    paddingVertical: BASE_UNIT,
    borderRadius: BASE_UNIT,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3B82F6',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  detailActions: {
    gap: BASE_UNIT * 3,
    marginTop: BASE_UNIT * 4,
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: BASE_UNIT * 2,
    paddingVertical: BASE_UNIT * 3,
    borderRadius: BASE_UNIT * 2,
    minHeight: BASE_UNIT * 11,
  },
  detailButtonPrimary: {
    backgroundColor: '#3B82F6',
  },
  detailButtonSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  detailButtonDanger: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  detailButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    letterSpacing: 0.2,
  },

  // Settings Panel
  settingSection: {
    marginTop: BASE_UNIT * 4,
  },
  settingSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    letterSpacing: 0.5,
    marginBottom: BASE_UNIT * 2,
  },
});

export default OfflineRecordingManagerScreen;

