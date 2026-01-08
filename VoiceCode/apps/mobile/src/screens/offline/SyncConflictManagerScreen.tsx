// VoiceFlow Pro Mobile - Sync Conflict Manager Screen
// Week 7 Day 46-47: Advanced Conflict Detection and Resolution
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
 * Conflict detection method
 */
export type ConflictDetectionMethod = 'timestamp' | 'checksum' | 'size' | 'content';

/**
 * Conflict severity level
 */
export type ConflictSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Conflict resolution strategy
 */
export type ConflictResolutionStrategy =
  | 'keep-local'
  | 'keep-cloud'
  | 'keep-both'
  | 'merge-auto'
  | 'merge-manual'
  | 'ask-me';

/**
 * Conflict status
 */
export type ConflictStatus = 'pending' | 'resolving' | 'resolved' | 'failed';

/**
 * File type for conflict
 */
export type ConflictFileType = 'recording' | 'transcript' | 'export' | 'settings' | 'metadata';

/**
 * Merge strategy for text files
 */
export type MergeStrategy = 'line-by-line' | 'paragraph' | 'section' | 'manual';

/**
 * File version information
 */
export interface FileVersion {
  path: string;
  size: number; // bytes
  modifiedAt: string;
  checksum: string;
  preview?: string;
  lineCount?: number;
  wordCount?: number;
  metadata?: Record<string, any>;
}

/**
 * Conflict difference information
 */
export interface ConflictDifference {
  type: 'added' | 'removed' | 'modified';
  location: string; // line number or section
  localContent: string;
  cloudContent: string;
  severity: ConflictSeverity;
}

/**
 * Sync conflict item
 */
export interface SyncConflict {
  id: string;
  fileName: string;
  fileType: ConflictFileType;
  localVersion: FileVersion;
  cloudVersion: FileVersion;
  detectedAt: string;
  detectionMethod: ConflictDetectionMethod;
  severity: ConflictSeverity;
  status: ConflictStatus;
  differences: ConflictDifference[];
  autoResolvable: boolean;
  recommendedStrategy: ConflictResolutionStrategy;
  resolution?: {
    strategy: ConflictResolutionStrategy;
    resolvedAt: string;
    resolvedBy: 'user' | 'auto';
    resultPath?: string;
  };
  error?: string;
}

/**
 * Conflict resolution rule
 */
export interface ConflictResolutionRule {
  id: string;
  name: string;
  enabled: boolean;
  fileType: ConflictFileType | 'all';
  condition: 'always' | 'size-diff' | 'time-diff' | 'content-diff';
  threshold?: number; // for size-diff or time-diff
  strategy: ConflictResolutionStrategy;
  priority: number;
}

/**
 * Conflict statistics
 */
export interface ConflictStatistics {
  total: number;
  pending: number;
  resolved: number;
  failed: number;
  autoResolved: number;
  manualResolved: number;
  byFileType: Record<ConflictFileType, number>;
  bySeverity: Record<ConflictSeverity, number>;
  averageResolutionTime: number; // seconds
}

/**
 * Conflict history item
 */
export interface ConflictHistoryItem {
  id: string;
  conflictId: string;
  fileName: string;
  fileType: ConflictFileType;
  detectedAt: string;
  resolvedAt: string;
  strategy: ConflictResolutionStrategy;
  resolvedBy: 'user' | 'auto';
  success: boolean;
  error?: string;
}

// ============================================================================
// Constants & Configuration
// ============================================================================

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_UNIT = 4;

/**
 * Conflict detection methods configuration
 */
const DETECTION_METHODS: Array<{
  id: ConflictDetectionMethod;
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  {
    id: 'timestamp',
    name: 'Timestamp',
    description: 'Compare file modification times',
    icon: 'time-outline',
  },
  {
    id: 'checksum',
    name: 'Checksum',
    description: 'Compare file content hashes',
    icon: 'shield-checkmark-outline',
  },
  {
    id: 'size',
    name: 'File Size',
    description: 'Compare file sizes',
    icon: 'resize-outline',
  },
  {
    id: 'content',
    name: 'Content',
    description: 'Deep content comparison',
    icon: 'document-text-outline',
  },
];

/**
 * Resolution strategies configuration
 */
const RESOLUTION_STRATEGIES: Array<{
  id: ConflictResolutionStrategy;
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}> = [
  {
    id: 'keep-local',
    name: 'Keep Local',
    description: 'Use local version, overwrite cloud',
    icon: 'phone-portrait-outline',
    color: '#3B82F6',
  },
  {
    id: 'keep-cloud',
    name: 'Keep Cloud',
    description: 'Use cloud version, overwrite local',
    icon: 'cloud-outline',
    color: '#10B981',
  },
  {
    id: 'keep-both',
    name: 'Keep Both',
    description: 'Rename and keep both versions',
    icon: 'copy-outline',
    color: '#F59E0B',
  },
  {
    id: 'merge-auto',
    name: 'Auto Merge',
    description: 'Automatically merge changes',
    icon: 'git-merge-outline',
    color: '#8b5cf6',
  },
  {
    id: 'merge-manual',
    name: 'Manual Merge',
    description: 'Manually review and merge',
    icon: 'create-outline',
    color: '#EC4899',
  },
  {
    id: 'ask-me',
    name: 'Ask Me',
    description: 'Prompt for each conflict',
    icon: 'help-circle-outline',
    color: '#6B7280',
  },
];

/**
 * Severity levels configuration
 */
const SEVERITY_LEVELS: Array<{
  id: ConflictSeverity;
  name: string;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { id: 'low', name: 'Low', color: '#10B981', icon: 'information-circle-outline' },
  { id: 'medium', name: 'Medium', color: '#F59E0B', icon: 'warning-outline' },
  { id: 'high', name: 'High', color: '#EF4444', icon: 'alert-circle-outline' },
  { id: 'critical', name: 'Critical', color: '#DC2626', icon: 'close-circle-outline' },
];

/**
 * File type icons
 */
const FILE_TYPE_ICONS: Record<ConflictFileType, keyof typeof Ionicons.glyphMap> = {
  recording: 'mic-outline',
  transcript: 'document-text-outline',
  export: 'download-outline',
  settings: 'settings-outline',
  metadata: 'information-circle-outline',
};

/**
 * Scan interval options
 */
const SCAN_INTERVALS: Array<{
  id: 'manual' | '5min' | '15min' | '30min' | '1hour';
  name: string;
}> = [
  { id: 'manual', name: 'Manual Only' },
  { id: '5min', name: 'Every 5 minutes' },
  { id: '15min', name: 'Every 15 minutes' },
  { id: '30min', name: 'Every 30 minutes' },
  { id: '1hour', name: 'Every hour' },
];

// ============================================================================
// Main Component
// ============================================================================

export default function SyncConflictManagerScreen({ navigation }: any) {
  // ============================================================================
  // State Management
  // ============================================================================

  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [conflictHistory, setConflictHistory] = useState<ConflictHistoryItem[]>([]);
  const [resolutionRules, setResolutionRules] = useState<ConflictResolutionRule[]>([]);
  const [statistics, setStatistics] = useState<ConflictStatistics | null>(null);
  const [selectedConflict, setSelectedConflict] = useState<SyncConflict | null>(null);
  const [filterStatus, setFilterStatus] = useState<ConflictStatus | 'all'>('all');
  const [filterSeverity, setFilterSeverity] = useState<ConflictSeverity | 'all'>('all');
  const [filterFileType, setFilterFileType] = useState<ConflictFileType | 'all'>('all');
  const [isScanning, setIsScanning] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('conflicts');
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [showRulesPanel, setShowRulesPanel] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [autoResolveEnabled, setAutoResolveEnabled] = useState(true);
  const [scanInterval, setScanInterval] = useState<'manual' | '5min' | '15min' | '30min' | '1hour'>('15min');

  // ============================================================================
  // Refs & Animations
  // ============================================================================

  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const detailSlideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const rulesSlideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const historySlideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;


  // ============================================================================
  // Effects
  // ============================================================================

  /**
   * Entrance animation
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
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  /**
   * Load data on mount
   */
  useEffect(() => {
    loadConflicts();
    loadConflictHistory();
    loadResolutionRules();
    loadStatistics();
  }, []);

  /**
   * Detail panel animation
   */
  useEffect(() => {
    Animated.spring(detailSlideAnim, {
      toValue: showDetailPanel ? 0 : SCREEN_WIDTH,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [showDetailPanel]);

  /**
   * Rules panel animation
   */
  useEffect(() => {
    Animated.spring(rulesSlideAnim, {
      toValue: showRulesPanel ? 0 : SCREEN_WIDTH,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [showRulesPanel]);

  /**
   * History panel animation
   */
  useEffect(() => {
    Animated.spring(historySlideAnim, {
      toValue: showHistoryPanel ? 0 : SCREEN_WIDTH,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [showHistoryPanel]);

  // ============================================================================
  // Data Management Functions
  // ============================================================================

  /**
   * Load conflicts from storage
   */
  const loadConflicts = async () => {
    try {
      const stored = await AsyncStorage.getItem('@voiceflow_sync_conflicts');
      if (stored) {
        setConflicts(JSON.parse(stored));
      } else {
        // Mock data for demonstration
        const mockConflicts: SyncConflict[] = [
          {
            id: '1',
            fileName: 'Meeting_Notes_2026.txt',
            fileType: 'transcript',
            localVersion: {
              path: '/local/transcripts/meeting_notes_2026.txt',
              size: 15420,
              modifiedAt: '2026-01-07T14:30:00Z',
              checksum: 'abc123def456',
              preview: 'Meeting started at 2:00 PM...',
              lineCount: 245,
              wordCount: 1850,
            },
            cloudVersion: {
              path: '/cloud/transcripts/meeting_notes_2026.txt',
              size: 15680,
              modifiedAt: '2026-01-07T14:25:00Z',
              checksum: 'def456ghi789',
              preview: 'Meeting started at 2:00 PM...',
              lineCount: 250,
              wordCount: 1920,
            },
            detectedAt: '2026-01-07T14:35:00Z',
            detectionMethod: 'checksum',
            severity: 'medium',
            status: 'pending',
            differences: [
              {
                type: 'added',
                location: 'Line 120-125',
                localContent: 'Additional notes about project timeline',
                cloudContent: '',
                severity: 'low',
              },
              {
                type: 'modified',
                location: 'Line 200',
                localContent: 'Action items: Complete by Friday',
                cloudContent: 'Action items: Complete by Thursday',
                severity: 'medium',
              },
            ],
            autoResolvable: true,
            recommendedStrategy: 'merge-auto',
          },
          {
            id: '2',
            fileName: 'Interview_Recording.m4a',
            fileType: 'recording',
            localVersion: {
              path: '/local/recordings/interview.m4a',
              size: 5242880,
              modifiedAt: '2026-01-07T10:15:00Z',
              checksum: 'xyz789abc123',
            },
            cloudVersion: {
              path: '/cloud/recordings/interview.m4a',
              size: 5120000,
              modifiedAt: '2026-01-07T10:10:00Z',
              checksum: 'mno456pqr789',
            },
            detectedAt: '2026-01-07T10:20:00Z',
            detectionMethod: 'size',
            severity: 'high',
            status: 'pending',
            differences: [],
            autoResolvable: false,
            recommendedStrategy: 'keep-local',
          },
        ];
        setConflicts(mockConflicts);
      }
    } catch (error) {
      console.error('Error loading conflicts:', error);
    }
  };

  /**
   * Load conflict history from storage
   */
  const loadConflictHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem('@voiceflow_conflict_history');
      if (stored) {
        setConflictHistory(JSON.parse(stored));
      } else {
        // Mock data
        const mockHistory: ConflictHistoryItem[] = [
          {
            id: '1',
            conflictId: 'c1',
            fileName: 'Project_Notes.txt',
            fileType: 'transcript',
            detectedAt: '2026-01-06T15:00:00Z',
            resolvedAt: '2026-01-06T15:05:00Z',
            strategy: 'merge-auto',
            resolvedBy: 'auto',
            success: true,
          },
          {
            id: '2',
            conflictId: 'c2',
            fileName: 'Presentation.pdf',
            fileType: 'export',
            detectedAt: '2026-01-05T12:00:00Z',
            resolvedAt: '2026-01-05T12:10:00Z',
            strategy: 'keep-cloud',
            resolvedBy: 'user',
            success: true,
          },
        ];
        setConflictHistory(mockHistory);
      }
    } catch (error) {
      console.error('Error loading conflict history:', error);
    }
  };


  /**
   * Load resolution rules from storage
   */
  const loadResolutionRules = async () => {
    try {
      const stored = await AsyncStorage.getItem('@voiceflow_resolution_rules');
      if (stored) {
        setResolutionRules(JSON.parse(stored));
      } else {
        // Default rules
        const defaultRules: ConflictResolutionRule[] = [
          {
            id: '1',
            name: 'Auto-merge text files',
            enabled: true,
            fileType: 'transcript',
            condition: 'content-diff',
            strategy: 'merge-auto',
            priority: 1,
          },
          {
            id: '2',
            name: 'Keep newer recordings',
            enabled: true,
            fileType: 'recording',
            condition: 'time-diff',
            strategy: 'keep-local',
            priority: 2,
          },
          {
            id: '3',
            name: 'Keep both for exports',
            enabled: false,
            fileType: 'export',
            condition: 'always',
            strategy: 'keep-both',
            priority: 3,
          },
        ];
        setResolutionRules(defaultRules);
      }
    } catch (error) {
      console.error('Error loading resolution rules:', error);
    }
  };

  /**
   * Load statistics
   */
  const loadStatistics = async () => {
    try {
      const stored = await AsyncStorage.getItem('@voiceflow_conflict_statistics');
      if (stored) {
        setStatistics(JSON.parse(stored));
      } else {
        // Calculate from conflicts and history
        const mockStats: ConflictStatistics = {
          total: 15,
          pending: 2,
          resolved: 12,
          failed: 1,
          autoResolved: 8,
          manualResolved: 4,
          byFileType: {
            recording: 3,
            transcript: 8,
            export: 2,
            settings: 1,
            metadata: 1,
          },
          bySeverity: {
            low: 5,
            medium: 7,
            high: 2,
            critical: 1,
          },
          averageResolutionTime: 180, // 3 minutes
        };
        setStatistics(mockStats);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  /**
   * Save conflicts to storage
   */
  const saveConflicts = async (updatedConflicts: SyncConflict[]) => {
    try {
      await AsyncStorage.setItem('@voiceflow_sync_conflicts', JSON.stringify(updatedConflicts));
      setConflicts(updatedConflicts);
    } catch (error) {
      console.error('Error saving conflicts:', error);
    }
  };

  /**
   * Save resolution rules to storage
   */
  const saveResolutionRules = async (updatedRules: ConflictResolutionRule[]) => {
    try {
      await AsyncStorage.setItem('@voiceflow_resolution_rules', JSON.stringify(updatedRules));
      setResolutionRules(updatedRules);
    } catch (error) {
      console.error('Error saving resolution rules:', error);
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
      loadConflicts(),
      loadConflictHistory(),
      loadResolutionRules(),
      loadStatistics(),
    ]);
    setRefreshing(false);
  };

  /**
   * Handle scan for conflicts
   */
  const handleScanConflicts = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsScanning(true);

    // Simulate scanning process
    await new Promise(resolve => setTimeout(resolve, 2000));

    // In real implementation, this would scan local and cloud files
    await loadConflicts();

    setIsScanning(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Alert.alert(
      'Scan Complete',
      `Found ${conflicts.filter(c => c.status === 'pending').length} conflicts`,
      [{ text: 'OK' }]
    );
  };

  /**
   * Handle resolve conflict
   */
  const handleResolveConflict = async (
    conflictId: string,
    strategy: ConflictResolutionStrategy
  ) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsResolving(true);

    try {
      // Simulate resolution process
      await new Promise(resolve => setTimeout(resolve, 1500));

      const updatedConflicts = conflicts.map(c =>
        c.id === conflictId
          ? {
              ...c,
              status: 'resolved' as ConflictStatus,
              resolution: {
                strategy,
                resolvedAt: new Date().toISOString(),
                resolvedBy: 'user' as const,
                resultPath: `/resolved/${c.fileName}`,
              },
            }
          : c
      );

      await saveConflicts(updatedConflicts);

      // Add to history
      const conflict = conflicts.find(c => c.id === conflictId);
      if (conflict) {
        const historyItem: ConflictHistoryItem = {
          id: Date.now().toString(),
          conflictId,
          fileName: conflict.fileName,
          fileType: conflict.fileType,
          detectedAt: conflict.detectedAt,
          resolvedAt: new Date().toISOString(),
          strategy,
          resolvedBy: 'user',
          success: true,
        };
        const updatedHistory = [historyItem, ...conflictHistory];
        await AsyncStorage.setItem('@voiceflow_conflict_history', JSON.stringify(updatedHistory));
        setConflictHistory(updatedHistory);
      }

      setIsResolving(false);
      setShowDetailPanel(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        'Conflict Resolved',
        `Successfully resolved using "${RESOLUTION_STRATEGIES.find(s => s.id === strategy)?.name}" strategy`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      setIsResolving(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to resolve conflict', [{ text: 'OK' }]);
    }
  };

  /**
   * Handle auto-resolve all
   */
  const handleAutoResolveAll = async () => {
    const autoResolvableConflicts = conflicts.filter(c => c.autoResolvable && c.status === 'pending');

    if (autoResolvableConflicts.length === 0) {
      Alert.alert('No Auto-Resolvable Conflicts', 'All conflicts require manual resolution', [{ text: 'OK' }]);
      return;
    }

    Alert.alert(
      'Auto-Resolve Conflicts',
      `Automatically resolve ${autoResolvableConflicts.length} conflicts using recommended strategies?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resolve',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setIsResolving(true);

            for (const conflict of autoResolvableConflicts) {
              await handleResolveConflict(conflict.id, conflict.recommendedStrategy);
            }

            setIsResolving(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  /**
   * Handle toggle resolution rule
   */
  const handleToggleRule = async (ruleId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updatedRules = resolutionRules.map(r =>
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    );
    await saveResolutionRules(updatedRules);
  };

  /**
   * Handle view conflict details
   */
  const handleViewDetails = (conflict: SyncConflict) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedConflict(conflict);
    setShowDetailPanel(true);
  };

  /**
   * Handle toggle auto-resolve
   */
  const handleToggleAutoResolve = async (enabled: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAutoResolveEnabled(enabled);
    await AsyncStorage.setItem('@voiceflow_auto_resolve_enabled', JSON.stringify(enabled));
  };

  /**
   * Handle change scan interval
   */
  const handleChangeScanInterval = async (interval: typeof scanInterval) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setScanInterval(interval);
    await AsyncStorage.setItem('@voiceflow_scan_interval', interval);
  };

  // ============================================================================
  // Computed Values
  // ============================================================================

  const filteredConflicts = conflicts.filter(c => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (filterSeverity !== 'all' && c.severity !== filterSeverity) return false;
    if (filterFileType !== 'all' && c.fileType !== filterFileType) return false;
    return true;
  });

  const pendingConflicts = conflicts.filter(c => c.status === 'pending');
  const autoResolvableCount = pendingConflicts.filter(c => c.autoResolvable).length;

  // ============================================================================
  // Render Functions
  // ============================================================================

  /**
   * Render header
   */
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={handleBack}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={24} color="#111827" />
      </TouchableOpacity>

      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle}>Conflict Manager</Text>
        {pendingConflicts.length > 0 && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{pendingConflicts.length}</Text>
          </View>
        )}
      </View>

      <View style={styles.headerActions}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowRulesPanel(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={22} color="#3B82F6" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowHistoryPanel(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="time-outline" size={22} color="#3B82F6" />
        </TouchableOpacity>
      </View>
    </View>
  );

  /**
   * Render statistics
   */
  const renderStatistics = () => {
    if (!statistics) return null;

    return (
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => handleToggleSection('statistics')}
          activeOpacity={0.7}
        >
          <View style={styles.sectionHeaderLeft}>
            <View style={[styles.sectionIcon, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="stats-chart-outline" size={20} color="#3B82F6" />
            </View>
            <Text style={styles.sectionTitle}>Statistics</Text>
          </View>
          <Ionicons
            name={expandedSection === 'statistics' ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#6B7280"
          />
        </TouchableOpacity>

        {expandedSection === 'statistics' && (
          <View style={styles.sectionContent}>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{statistics.total}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: '#F59E0B' }]}>{statistics.pending}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: '#10B981' }]}>{statistics.resolved}</Text>
                <Text style={styles.statLabel}>Resolved</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statsRowItem}>
                <Ionicons name="flash-outline" size={16} color="#8b5cf6" />
                <Text style={styles.statsRowLabel}>Auto-resolved</Text>
                <Text style={styles.statsRowValue}>{statistics.autoResolved}</Text>
              </View>
              <View style={styles.statsRowItem}>
                <Ionicons name="hand-left-outline" size={16} color="#EC4899" />
                <Text style={styles.statsRowLabel}>Manual</Text>
                <Text style={styles.statsRowValue}>{statistics.manualResolved}</Text>
              </View>
            </View>

            <View style={styles.statsInfo}>
              <Ionicons name="time-outline" size={16} color="#6B7280" />
              <Text style={styles.statsInfoText}>
                Avg. resolution time: {Math.floor(statistics.averageResolutionTime / 60)}m {statistics.averageResolutionTime % 60}s
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };


  /**
   * Render scan settings
   */
  const renderScanSettings = () => (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => handleToggleSection('scan')}
        activeOpacity={0.7}
      >
        <View style={styles.sectionHeaderLeft}>
          <View style={[styles.sectionIcon, { backgroundColor: '#F0FDF4' }]}>
            <Ionicons name="scan-outline" size={20} color="#10B981" />
          </View>
          <Text style={styles.sectionTitle}>Conflict Detection</Text>
        </View>
        <Ionicons
          name={expandedSection === 'scan' ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#6B7280"
        />
      </TouchableOpacity>

      {expandedSection === 'scan' && (
        <View style={styles.sectionContent}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Auto-Resolve</Text>
              <Text style={styles.settingDescription}>
                Automatically resolve conflicts using rules
              </Text>
            </View>
            <Switch
              value={autoResolveEnabled}
              onValueChange={handleToggleAutoResolve}
              trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
              thumbColor={autoResolveEnabled ? '#3B82F6' : '#F3F4F6'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Scan Interval</Text>
              <Text style={styles.settingDescription}>
                How often to check for conflicts
              </Text>
            </View>
          </View>

          <View style={styles.intervalButtons}>
            {SCAN_INTERVALS.map(interval => (
              <TouchableOpacity
                key={interval.id}
                style={[
                  styles.intervalButton,
                  scanInterval === interval.id && styles.intervalButtonActive,
                ]}
                onPress={() => handleChangeScanInterval(interval.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.intervalButtonText,
                    scanInterval === interval.id && styles.intervalButtonTextActive,
                  ]}
                >
                  {interval.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.scanButton, isScanning && styles.scanButtonDisabled]}
            onPress={handleScanConflicts}
            disabled={isScanning}
            activeOpacity={0.7}
          >
            {isScanning ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Ionicons name="scan-outline" size={20} color="#FFFFFF" />
            )}
            <Text style={styles.scanButtonText}>
              {isScanning ? 'Scanning...' : 'Scan Now'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  /**
   * Render conflicts list
   */
  const renderConflictsList = () => (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => handleToggleSection('conflicts')}
        activeOpacity={0.7}
      >
        <View style={styles.sectionHeaderLeft}>
          <View style={[styles.sectionIcon, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="alert-circle-outline" size={20} color="#F59E0B" />
          </View>
          <Text style={styles.sectionTitle}>Active Conflicts</Text>
          {pendingConflicts.length > 0 && (
            <View style={styles.conflictBadge}>
              <Text style={styles.conflictBadgeText}>{pendingConflicts.length}</Text>
            </View>
          )}
        </View>
        <Ionicons
          name={expandedSection === 'conflicts' ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#6B7280"
        />
      </TouchableOpacity>

      {expandedSection === 'conflicts' && (
        <View style={styles.sectionContent}>
          {autoResolvableCount > 0 && (
            <TouchableOpacity
              style={styles.autoResolveButton}
              onPress={handleAutoResolveAll}
              activeOpacity={0.7}
            >
              <Ionicons name="flash-outline" size={18} color="#8b5cf6" />
              <Text style={styles.autoResolveButtonText}>
                Auto-Resolve {autoResolvableCount} Conflicts
              </Text>
            </TouchableOpacity>
          )}

          {/* Filters */}
          <View style={styles.filters}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.filterChip, filterStatus === 'all' && styles.filterChipActive]}
                onPress={() => setFilterStatus('all')}
              >
                <Text style={[styles.filterChipText, filterStatus === 'all' && styles.filterChipTextActive]}>
                  All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, filterStatus === 'pending' && styles.filterChipActive]}
                onPress={() => setFilterStatus('pending')}
              >
                <Text style={[styles.filterChipText, filterStatus === 'pending' && styles.filterChipTextActive]}>
                  Pending
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, filterStatus === 'resolved' && styles.filterChipActive]}
                onPress={() => setFilterStatus('resolved')}
              >
                <Text style={[styles.filterChipText, filterStatus === 'resolved' && styles.filterChipTextActive]}>
                  Resolved
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Conflicts */}
          {filteredConflicts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#10B981" />
              <Text style={styles.emptyStateTitle}>No Conflicts</Text>
              <Text style={styles.emptyStateDescription}>
                All files are in sync
              </Text>
            </View>
          ) : (
            filteredConflicts.map(conflict => (
              <TouchableOpacity
                key={conflict.id}
                style={styles.conflictItem}
                onPress={() => handleViewDetails(conflict)}
                activeOpacity={0.7}
              >
                <View style={styles.conflictItemHeader}>
                  <View style={styles.conflictItemIcon}>
                    <Ionicons
                      name={FILE_TYPE_ICONS[conflict.fileType]}
                      size={20}
                      color="#3B82F6"
                    />
                  </View>
                  <View style={styles.conflictItemInfo}>
                    <Text style={styles.conflictItemTitle}>{conflict.fileName}</Text>
                    <Text style={styles.conflictItemDescription}>
                      Detected {new Date(conflict.detectedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.severityBadge,
                      { backgroundColor: SEVERITY_LEVELS.find(s => s.id === conflict.severity)?.color + '20' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.severityBadgeText,
                        { color: SEVERITY_LEVELS.find(s => s.id === conflict.severity)?.color },
                      ]}
                    >
                      {conflict.severity.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.conflictItemDetails}>
                  <View style={styles.conflictItemDetail}>
                    <Ionicons name="phone-portrait-outline" size={14} color="#6B7280" />
                    <Text style={styles.conflictItemDetailText}>
                      {(conflict.localVersion.size / 1024).toFixed(1)} KB
                    </Text>
                  </View>
                  <View style={styles.conflictItemDetail}>
                    <Ionicons name="cloud-outline" size={14} color="#6B7280" />
                    <Text style={styles.conflictItemDetailText}>
                      {(conflict.cloudVersion.size / 1024).toFixed(1)} KB
                    </Text>
                  </View>
                  {conflict.autoResolvable && (
                    <View style={styles.conflictItemDetail}>
                      <Ionicons name="flash-outline" size={14} color="#8b5cf6" />
                      <Text style={[styles.conflictItemDetailText, { color: '#8b5cf6' }]}>
                        Auto-resolvable
                      </Text>
                    </View>
                  )}
                </View>
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
    if (!selectedConflict) return null;

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
          <Text style={styles.panelTitle}>Conflict Details</Text>
          <TouchableOpacity
            style={styles.panelCloseButton}
            onPress={() => setShowDetailPanel(false)}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.panelContent} showsVerticalScrollIndicator={false}>
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>FILE INFORMATION</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Name:</Text>
              <Text style={styles.detailValue}>{selectedConflict.fileName}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Type:</Text>
              <Text style={styles.detailValue}>{selectedConflict.fileType}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Detected:</Text>
              <Text style={styles.detailValue}>
                {new Date(selectedConflict.detectedAt).toLocaleString()}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Method:</Text>
              <Text style={styles.detailValue}>{selectedConflict.detectionMethod}</Text>
            </View>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>VERSION COMPARISON</Text>

            <View style={styles.versionCard}>
              <View style={styles.versionHeader}>
                <Ionicons name="phone-portrait-outline" size={18} color="#3B82F6" />
                <Text style={styles.versionTitle}>Local Version</Text>
              </View>
              <View style={styles.versionDetail}>
                <Text style={styles.versionLabel}>Size:</Text>
                <Text style={styles.versionValue}>
                  {(selectedConflict.localVersion.size / 1024).toFixed(2)} KB
                </Text>
              </View>
              <View style={styles.versionDetail}>
                <Text style={styles.versionLabel}>Modified:</Text>
                <Text style={styles.versionValue}>
                  {new Date(selectedConflict.localVersion.modifiedAt).toLocaleString()}
                </Text>
              </View>
              {selectedConflict.localVersion.preview && (
                <View style={styles.versionPreview}>
                  <Text style={styles.versionPreviewText}>
                    {selectedConflict.localVersion.preview}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.versionCard}>
              <View style={styles.versionHeader}>
                <Ionicons name="cloud-outline" size={18} color="#10B981" />
                <Text style={styles.versionTitle}>Cloud Version</Text>
              </View>
              <View style={styles.versionDetail}>
                <Text style={styles.versionLabel}>Size:</Text>
                <Text style={styles.versionValue}>
                  {(selectedConflict.cloudVersion.size / 1024).toFixed(2)} KB
                </Text>
              </View>
              <View style={styles.versionDetail}>
                <Text style={styles.versionLabel}>Modified:</Text>
                <Text style={styles.versionValue}>
                  {new Date(selectedConflict.cloudVersion.modifiedAt).toLocaleString()}
                </Text>
              </View>
              {selectedConflict.cloudVersion.preview && (
                <View style={styles.versionPreview}>
                  <Text style={styles.versionPreviewText}>
                    {selectedConflict.cloudVersion.preview}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {selectedConflict.differences.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>DIFFERENCES ({selectedConflict.differences.length})</Text>
              {selectedConflict.differences.map((diff, index) => (
                <View key={index} style={styles.differenceCard}>
                  <View style={styles.differenceHeader}>
                    <Text style={styles.differenceType}>{diff.type.toUpperCase()}</Text>
                    <Text style={styles.differenceLocation}>{diff.location}</Text>
                  </View>
                  {diff.localContent && (
                    <View style={styles.differenceContent}>
                      <Text style={styles.differenceLabel}>Local:</Text>
                      <Text style={styles.differenceText}>{diff.localContent}</Text>
                    </View>
                  )}
                  {diff.cloudContent && (
                    <View style={styles.differenceContent}>
                      <Text style={styles.differenceLabel}>Cloud:</Text>
                      <Text style={styles.differenceText}>{diff.cloudContent}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>RESOLUTION OPTIONS</Text>
            {RESOLUTION_STRATEGIES.map(strategy => (
              <TouchableOpacity
                key={strategy.id}
                style={[
                  styles.strategyButton,
                  selectedConflict.recommendedStrategy === strategy.id && styles.strategyButtonRecommended,
                ]}
                onPress={() => handleResolveConflict(selectedConflict.id, strategy.id)}
                disabled={isResolving}
                activeOpacity={0.7}
              >
                <View style={[styles.strategyIcon, { backgroundColor: strategy.color + '20' }]}>
                  <Ionicons name={strategy.icon} size={20} color={strategy.color} />
                </View>
                <View style={styles.strategyInfo}>
                  <Text style={styles.strategyName}>{strategy.name}</Text>
                  <Text style={styles.strategyDescription}>{strategy.description}</Text>
                </View>
                {selectedConflict.recommendedStrategy === strategy.id && (
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedBadgeText}>Recommended</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </Animated.View>
    );
  };


  /**
   * Render rules panel
   */
  const renderRulesPanel = () => (
    <Animated.View
      style={[
        styles.panel,
        {
          transform: [{ translateX: rulesSlideAnim }],
        },
      ]}
    >
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>Resolution Rules</Text>
        <TouchableOpacity
          style={styles.panelCloseButton}
          onPress={() => setShowRulesPanel(false)}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.panelContent} showsVerticalScrollIndicator={false}>
        {resolutionRules.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyStateTitle}>No Rules</Text>
            <Text style={styles.emptyStateDescription}>
              Create rules to automate conflict resolution
            </Text>
          </View>
        ) : (
          resolutionRules.map(rule => (
            <View key={rule.id} style={styles.ruleCard}>
              <View style={styles.ruleHeader}>
                <Text style={styles.ruleName}>{rule.name}</Text>
                <Switch
                  value={rule.enabled}
                  onValueChange={() => handleToggleRule(rule.id)}
                  trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
                  thumbColor={rule.enabled ? '#3B82F6' : '#F3F4F6'}
                />
              </View>
              <View style={styles.ruleDetails}>
                <View style={styles.ruleDetail}>
                  <Text style={styles.ruleDetailLabel}>File Type:</Text>
                  <Text style={styles.ruleDetailValue}>{rule.fileType}</Text>
                </View>
                <View style={styles.ruleDetail}>
                  <Text style={styles.ruleDetailLabel}>Condition:</Text>
                  <Text style={styles.ruleDetailValue}>{rule.condition}</Text>
                </View>
                <View style={styles.ruleDetail}>
                  <Text style={styles.ruleDetailLabel}>Strategy:</Text>
                  <Text style={styles.ruleDetailValue}>
                    {RESOLUTION_STRATEGIES.find(s => s.id === rule.strategy)?.name}
                  </Text>
                </View>
                <View style={styles.ruleDetail}>
                  <Text style={styles.ruleDetailLabel}>Priority:</Text>
                  <Text style={styles.ruleDetailValue}>{rule.priority}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </Animated.View>
  );

  /**
   * Render history panel
   */
  const renderHistoryPanel = () => (
    <Animated.View
      style={[
        styles.panel,
        {
          transform: [{ translateX: historySlideAnim }],
        },
      ]}
    >
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>Resolution History</Text>
        <TouchableOpacity
          style={styles.panelCloseButton}
          onPress={() => setShowHistoryPanel(false)}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.panelContent} showsVerticalScrollIndicator={false}>
        {conflictHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyStateTitle}>No History</Text>
            <Text style={styles.emptyStateDescription}>
              Resolved conflicts will appear here
            </Text>
          </View>
        ) : (
          conflictHistory.map(item => (
            <View key={item.id} style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <View style={styles.historyIcon}>
                  <Ionicons
                    name={FILE_TYPE_ICONS[item.fileType]}
                    size={18}
                    color={item.success ? '#10B981' : '#EF4444'}
                  />
                </View>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyFileName}>{item.fileName}</Text>
                  <Text style={styles.historyDate}>
                    {new Date(item.resolvedAt).toLocaleString()}
                  </Text>
                </View>
                <View
                  style={[
                    styles.historyBadge,
                    { backgroundColor: item.success ? '#D1FAE5' : '#FEE2E2' },
                  ]}
                >
                  <Text
                    style={[
                      styles.historyBadgeText,
                      { color: item.success ? '#10B981' : '#EF4444' },
                    ]}
                  >
                    {item.success ? 'Success' : 'Failed'}
                  </Text>
                </View>
              </View>
              <View style={styles.historyDetails}>
                <View style={styles.historyDetail}>
                  <Text style={styles.historyDetailLabel}>Strategy:</Text>
                  <Text style={styles.historyDetailValue}>
                    {RESOLUTION_STRATEGIES.find(s => s.id === item.strategy)?.name}
                  </Text>
                </View>
                <View style={styles.historyDetail}>
                  <Text style={styles.historyDetailLabel}>Resolved by:</Text>
                  <Text style={styles.historyDetailValue}>{item.resolvedBy}</Text>
                </View>
              </View>
              {item.error && (
                <View style={styles.historyError}>
                  <Ionicons name="alert-circle-outline" size={14} color="#EF4444" />
                  <Text style={styles.historyErrorText}>{item.error}</Text>
                </View>
              )}
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
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#3B82F6"
            />
          }
        >
          {renderStatistics()}
          {renderScanSettings()}
          {renderConflictsList()}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </Animated.View>

      {/* Panels */}
      {showDetailPanel && renderDetailPanel()}
      {showRulesPanel && renderRulesPanel()}
      {showHistoryPanel && renderHistoryPanel()}
    </View>
  );
}


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
  scrollViewContent: {
    paddingBottom: BASE_UNIT * 6,
  },
  bottomSpacer: {
    height: BASE_UNIT * 6,
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
    borderRadius: BASE_UNIT * 5.5,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: BASE_UNIT * 3,
  },
  headerTitle: {
    fontFamily: 'SF Pro Display',
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    letterSpacing: -0.3,
  },
  headerBadge: {
    marginLeft: BASE_UNIT * 2,
    paddingHorizontal: BASE_UNIT * 2,
    paddingVertical: BASE_UNIT,
    backgroundColor: '#FEF3C7',
    borderRadius: BASE_UNIT * 3,
  },
  headerBadgeText: {
    fontFamily: 'SF Pro Text',
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  headerActions: {
    flexDirection: 'row',
    gap: BASE_UNIT * 2,
  },
  headerButton: {
    width: BASE_UNIT * 11,
    height: BASE_UNIT * 11,
    borderRadius: BASE_UNIT * 5.5,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Section
  section: {
    marginTop: BASE_UNIT * 4,
    marginHorizontal: BASE_UNIT * 4,
    backgroundColor: '#FFFFFF',
    borderRadius: BASE_UNIT * 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: BASE_UNIT * 4,
    backgroundColor: '#F9FAFB',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BASE_UNIT * 3,
  },
  sectionIcon: {
    width: BASE_UNIT * 10,
    height: BASE_UNIT * 10,
    borderRadius: BASE_UNIT * 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontFamily: 'SF Pro Text',
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    letterSpacing: -0.2,
  },
  sectionContent: {
    padding: BASE_UNIT * 4,
  },

  // Statistics
  statsGrid: {
    flexDirection: 'row',
    gap: BASE_UNIT * 3,
    marginBottom: BASE_UNIT * 4,
  },
  statCard: {
    flex: 1,
    padding: BASE_UNIT * 4,
    backgroundColor: '#F9FAFB',
    borderRadius: BASE_UNIT * 2,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'SF Pro Display',
    fontSize: 28,
    fontWeight: '700',
    color: '#3B82F6',
    letterSpacing: -0.5,
    marginBottom: BASE_UNIT,
  },
  statLabel: {
    fontFamily: 'SF Pro Text',
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    gap: BASE_UNIT * 3,
    marginBottom: BASE_UNIT * 3,
  },
  statsRowItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: BASE_UNIT * 2,
    padding: BASE_UNIT * 3,
    backgroundColor: '#F9FAFB',
    borderRadius: BASE_UNIT * 2,
  },
  statsRowLabel: {
    flex: 1,
    fontFamily: 'SF Pro Text',
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  statsRowValue: {
    fontFamily: 'SF Pro Text',
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  statsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BASE_UNIT * 2,
    padding: BASE_UNIT * 3,
    backgroundColor: '#EEF2FF',
    borderRadius: BASE_UNIT * 2,
  },
  statsInfoText: {
    fontFamily: 'SF Pro Text',
    fontSize: 13,
    fontWeight: '500',
    color: '#3B82F6',
  },


  // Settings
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: BASE_UNIT * 3,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontFamily: 'SF Pro Text',
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: BASE_UNIT,
  },
  settingDescription: {
    fontFamily: 'SF Pro Text',
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 18,
  },

  // Interval Buttons
  intervalButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: BASE_UNIT * 2,
    marginTop: BASE_UNIT * 2,
    marginBottom: BASE_UNIT * 4,
  },
  intervalButton: {
    paddingHorizontal: BASE_UNIT * 4,
    paddingVertical: BASE_UNIT * 2.5,
    backgroundColor: '#F9FAFB',
    borderRadius: BASE_UNIT * 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  intervalButtonActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#3B82F6',
  },
  intervalButtonText: {
    fontFamily: 'SF Pro Text',
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  intervalButtonTextActive: {
    color: '#3B82F6',
  },

  // Scan Button
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: BASE_UNIT * 2,
    paddingVertical: BASE_UNIT * 3.5,
    backgroundColor: '#3B82F6',
    borderRadius: BASE_UNIT * 2,
  },
  scanButtonDisabled: {
    opacity: 0.6,
  },
  scanButtonText: {
    fontFamily: 'SF Pro Text',
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  // Conflicts
  conflictBadge: {
    marginLeft: BASE_UNIT * 2,
    paddingHorizontal: BASE_UNIT * 2,
    paddingVertical: BASE_UNIT * 0.5,
    backgroundColor: '#FEF3C7',
    borderRadius: BASE_UNIT * 2,
  },
  conflictBadgeText: {
    fontFamily: 'SF Pro Text',
    fontSize: 11,
    fontWeight: '700',
    color: '#F59E0B',
  },
  autoResolveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: BASE_UNIT * 2,
    paddingVertical: BASE_UNIT * 3,
    backgroundColor: '#F5F3FF',
    borderRadius: BASE_UNIT * 2,
    marginBottom: BASE_UNIT * 4,
  },
  autoResolveButtonText: {
    fontFamily: 'SF Pro Text',
    fontSize: 14,
    fontWeight: '600',
    color: '#8b5cf6',
  },

  // Filters
  filters: {
    marginBottom: BASE_UNIT * 4,
  },
  filterChip: {
    paddingHorizontal: BASE_UNIT * 4,
    paddingVertical: BASE_UNIT * 2,
    backgroundColor: '#F9FAFB',
    borderRadius: BASE_UNIT * 5,
    marginRight: BASE_UNIT * 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#3B82F6',
  },
  filterChipText: {
    fontFamily: 'SF Pro Text',
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#3B82F6',
  },

  // Conflict Item
  conflictItem: {
    padding: BASE_UNIT * 4,
    backgroundColor: '#F9FAFB',
    borderRadius: BASE_UNIT * 2,
    marginBottom: BASE_UNIT * 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  conflictItemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: BASE_UNIT * 3,
  },
  conflictItemIcon: {
    width: BASE_UNIT * 10,
    height: BASE_UNIT * 10,
    borderRadius: BASE_UNIT * 5,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: BASE_UNIT * 3,
  },
  conflictItemInfo: {
    flex: 1,
  },
  conflictItemTitle: {
    fontFamily: 'SF Pro Text',
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: BASE_UNIT,
  },
  conflictItemDescription: {
    fontFamily: 'SF Pro Text',
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
  },
  severityBadge: {
    paddingHorizontal: BASE_UNIT * 2.5,
    paddingVertical: BASE_UNIT,
    borderRadius: BASE_UNIT * 2,
    marginLeft: BASE_UNIT * 2,
  },
  severityBadgeText: {
    fontFamily: 'SF Pro Text',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  conflictItemDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: BASE_UNIT * 3,
  },
  conflictItemDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BASE_UNIT,
  },
  conflictItemDetailText: {
    fontFamily: 'SF Pro Text',
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },


  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: BASE_UNIT * 8,
  },
  emptyStateTitle: {
    fontFamily: 'SF Pro Text',
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    marginTop: BASE_UNIT * 3,
    marginBottom: BASE_UNIT,
  },
  emptyStateDescription: {
    fontFamily: 'SF Pro Text',
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
  },

  // Panel
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '100%',
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  panelTitle: {
    fontFamily: 'SF Pro Display',
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    letterSpacing: -0.3,
  },
  panelCloseButton: {
    width: BASE_UNIT * 11,
    height: BASE_UNIT * 11,
    borderRadius: BASE_UNIT * 5.5,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelContent: {
    flex: 1,
    padding: BASE_UNIT * 4,
  },

  // Detail Section
  detailSection: {
    marginBottom: BASE_UNIT * 6,
  },
  detailSectionTitle: {
    fontFamily: 'SF Pro Text',
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: BASE_UNIT * 3,
    textTransform: 'uppercase',
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: BASE_UNIT * 2,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontFamily: 'SF Pro Text',
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    width: 100,
  },
  detailValue: {
    flex: 1,
    fontFamily: 'SF Pro Text',
    fontSize: 14,
    fontWeight: '400',
    color: '#111827',
  },

  // Version Card
  versionCard: {
    padding: BASE_UNIT * 4,
    backgroundColor: '#F9FAFB',
    borderRadius: BASE_UNIT * 2,
    marginBottom: BASE_UNIT * 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  versionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BASE_UNIT * 2,
    marginBottom: BASE_UNIT * 3,
  },
  versionTitle: {
    fontFamily: 'SF Pro Text',
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  versionDetail: {
    flexDirection: 'row',
    paddingVertical: BASE_UNIT,
  },
  versionLabel: {
    fontFamily: 'SF Pro Text',
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    width: 80,
  },
  versionValue: {
    flex: 1,
    fontFamily: 'SF Pro Text',
    fontSize: 13,
    fontWeight: '400',
    color: '#111827',
  },
  versionPreview: {
    marginTop: BASE_UNIT * 2,
    padding: BASE_UNIT * 3,
    backgroundColor: '#FFFFFF',
    borderRadius: BASE_UNIT * 2,
  },
  versionPreviewText: {
    fontFamily: 'SF Mono',
    fontSize: 12,
    fontWeight: '400',
    color: '#374151',
    lineHeight: 18,
  },

  // Difference Card
  differenceCard: {
    padding: BASE_UNIT * 3,
    backgroundColor: '#F9FAFB',
    borderRadius: BASE_UNIT * 2,
    marginBottom: BASE_UNIT * 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  differenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: BASE_UNIT * 2,
  },
  differenceType: {
    fontFamily: 'SF Pro Text',
    fontSize: 11,
    fontWeight: '700',
    color: '#F59E0B',
    letterSpacing: 0.5,
  },
  differenceLocation: {
    fontFamily: 'SF Pro Text',
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
  },
  differenceContent: {
    marginTop: BASE_UNIT * 2,
  },
  differenceLabel: {
    fontFamily: 'SF Pro Text',
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: BASE_UNIT,
  },
  differenceText: {
    fontFamily: 'SF Mono',
    fontSize: 11,
    fontWeight: '400',
    color: '#374151',
    lineHeight: 16,
    padding: BASE_UNIT * 2,
    backgroundColor: '#FFFFFF',
    borderRadius: BASE_UNIT,
  },

  // Strategy Button
  strategyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: BASE_UNIT * 4,
    backgroundColor: '#F9FAFB',
    borderRadius: BASE_UNIT * 2,
    marginBottom: BASE_UNIT * 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  strategyButtonRecommended: {
    borderColor: '#3B82F6',
    borderWidth: 2,
  },
  strategyIcon: {
    width: BASE_UNIT * 10,
    height: BASE_UNIT * 10,
    borderRadius: BASE_UNIT * 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: BASE_UNIT * 3,
  },
  strategyInfo: {
    flex: 1,
  },
  strategyName: {
    fontFamily: 'SF Pro Text',
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: BASE_UNIT,
  },
  strategyDescription: {
    fontFamily: 'SF Pro Text',
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 18,
  },
  recommendedBadge: {
    paddingHorizontal: BASE_UNIT * 2.5,
    paddingVertical: BASE_UNIT,
    backgroundColor: '#EEF2FF',
    borderRadius: BASE_UNIT * 2,
    marginLeft: BASE_UNIT * 2,
  },
  recommendedBadgeText: {
    fontFamily: 'SF Pro Text',
    fontSize: 11,
    fontWeight: '700',
    color: '#3B82F6',
    letterSpacing: 0.3,
  },

  // Rule Card
  ruleCard: {
    padding: BASE_UNIT * 4,
    backgroundColor: '#F9FAFB',
    borderRadius: BASE_UNIT * 2,
    marginBottom: BASE_UNIT * 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  ruleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: BASE_UNIT * 3,
  },
  ruleName: {
    flex: 1,
    fontFamily: 'SF Pro Text',
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  ruleDetails: {
    gap: BASE_UNIT * 2,
  },
  ruleDetail: {
    flexDirection: 'row',
  },
  ruleDetailLabel: {
    fontFamily: 'SF Pro Text',
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    width: 100,
  },
  ruleDetailValue: {
    flex: 1,
    fontFamily: 'SF Pro Text',
    fontSize: 13,
    fontWeight: '400',
    color: '#111827',
  },

  // History Card
  historyCard: {
    padding: BASE_UNIT * 4,
    backgroundColor: '#F9FAFB',
    borderRadius: BASE_UNIT * 2,
    marginBottom: BASE_UNIT * 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: BASE_UNIT * 3,
  },
  historyIcon: {
    width: BASE_UNIT * 10,
    height: BASE_UNIT * 10,
    borderRadius: BASE_UNIT * 5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: BASE_UNIT * 3,
  },
  historyInfo: {
    flex: 1,
  },
  historyFileName: {
    fontFamily: 'SF Pro Text',
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: BASE_UNIT * 0.5,
  },
  historyDate: {
    fontFamily: 'SF Pro Text',
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
  },
  historyBadge: {
    paddingHorizontal: BASE_UNIT * 2.5,
    paddingVertical: BASE_UNIT,
    borderRadius: BASE_UNIT * 2,
    marginLeft: BASE_UNIT * 2,
  },
  historyBadgeText: {
    fontFamily: 'SF Pro Text',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  historyDetails: {
    gap: BASE_UNIT * 2,
  },
  historyDetail: {
    flexDirection: 'row',
  },
  historyDetailLabel: {
    fontFamily: 'SF Pro Text',
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    width: 100,
  },
  historyDetailValue: {
    flex: 1,
    fontFamily: 'SF Pro Text',
    fontSize: 13,
    fontWeight: '400',
    color: '#111827',
  },
  historyError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BASE_UNIT,
    marginTop: BASE_UNIT * 2,
    padding: BASE_UNIT * 2,
    backgroundColor: '#FEE2E2',
    borderRadius: BASE_UNIT,
  },
  historyErrorText: {
    flex: 1,
    fontFamily: 'SF Pro Text',
    fontSize: 12,
    fontWeight: '400',
    color: '#EF4444',
  },
});