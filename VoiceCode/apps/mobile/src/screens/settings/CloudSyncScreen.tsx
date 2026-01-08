// VoiceFlow Pro Mobile - Cloud Sync Screen
// Week 3 Day 19-20: Comprehensive Cloud Sync Management

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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Text } from '../../components/common';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { elevation, blurIntensity } from '../../theme';
import { getSyncService, SyncStatus, SyncProgress, SyncResult, SyncConflict } from '../../services/syncService';
import NetInfo from '@react-native-community/netinfo';

// TypeScript Interfaces
type CloudProvider = 'google-drive' | 'dropbox' | 'icloud';
type SyncFrequency = 'manual' | 'realtime' | '5min' | '15min' | '30min' | '1hour';
type ConflictResolution = 'local' | 'remote' | 'manual';

interface TranscriptSyncStatus {
  id: string;
  title: string;
  status: 'synced' | 'syncing' | 'pending' | 'conflict' | 'error';
  lastSyncAt?: string;
  progress?: number;
  error?: string;
}

interface SyncLog {
  id: string;
  timestamp: string;
  action: 'upload' | 'download' | 'conflict' | 'error';
  transcriptTitle: string;
  details: string;
  success: boolean;
}

interface ConnectedDevice {
  id: string;
  name: string;
  type: 'ios' | 'android' | 'web';
  lastSyncAt: string;
  status: 'active' | 'inactive';
  authorized: boolean;
}

interface CloudSyncScreenProps {
  navigation: any;
}

export const CloudSyncScreen: React.FC<CloudSyncScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const syncService = getSyncService();

  // State Management
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<CloudProvider>('google-drive');
  const [syncFrequency, setSyncFrequency] = useState<SyncFrequency>('15min');
  const [autoSync, setAutoSync] = useState(true);
  const [wifiOnly, setWifiOnly] = useState(true);
  const [transcriptStatuses, setTranscriptStatuses] = useState<TranscriptSyncStatus[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>([]);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [selectedConflict, setSelectedConflict] = useState<SyncConflict | null>(null);
  const [showConflictPanel, setShowConflictPanel] = useState(false);
  const [showLogsPanel, setShowLogsPanel] = useState(false);
  const [showDevicesPanel, setShowDevicesPanel] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentSyncProgress, setCurrentSyncProgress] = useState<SyncProgress | null>(null);

  // Animation Values
  const conflictSlide = useRef(new Animated.Value(600)).current;
  const logsSlide = useRef(new Animated.Value(600)).current;
  const devicesSlide = useRef(new Animated.Value(600)).current;
  const syncButtonScale = useRef(new Animated.Value(1)).current;

  // 4pt Grid System
  const BASE_UNIT = 4;

  /**
   * Load sync status and data
   */
  const loadSyncData = useCallback(async () => {
    try {
      // Get sync status
      const status = syncService.getStatus();
      setSyncStatus(status);

      // Load mock transcript statuses
      setTranscriptStatuses([
        {
          id: '1',
          title: 'Team Meeting Notes',
          status: 'synced',
          lastSyncAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          title: 'Project Discussion',
          status: 'syncing',
          progress: 65,
        },
        {
          id: '3',
          title: 'Client Call Recording',
          status: 'pending',
        },
        {
          id: '4',
          title: 'Lecture Notes',
          status: 'conflict',
          lastSyncAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        },
        {
          id: '5',
          title: 'Interview Transcript',
          status: 'error',
          error: 'Network timeout',
          lastSyncAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
      ]);

      // Load mock sync logs
      setSyncLogs([
        {
          id: '1',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          action: 'upload',
          transcriptTitle: 'Team Meeting Notes',
          details: 'Successfully uploaded to Google Drive',
          success: true,
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          action: 'download',
          transcriptTitle: 'Project Discussion',
          details: 'Downloaded from cloud',
          success: true,
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          action: 'conflict',
          transcriptTitle: 'Lecture Notes',
          details: 'Conflict detected - manual resolution required',
          success: false,
        },
      ]);

      // Load mock connected devices
      setConnectedDevices([
        {
          id: '1',
          name: 'iPhone 15 Pro',
          type: 'ios',
          lastSyncAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          status: 'active',
          authorized: true,
        },
        {
          id: '2',
          name: 'iPad Air',
          type: 'ios',
          lastSyncAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          status: 'inactive',
          authorized: true,
        },
        {
          id: '3',
          name: 'Web Browser',
          type: 'web',
          lastSyncAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          status: 'inactive',
          authorized: true,
        },
      ]);

      // Load mock conflicts
      // In real implementation, this would come from syncService
    } catch (error) {
      console.error('Failed to load sync data:', error);
    }
  }, [syncService]);

  /**
   * Monitor network connectivity
   */
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Listen to sync events
   */
  useEffect(() => {
    const handleSyncProgress = (progress: SyncProgress) => {
      setCurrentSyncProgress(progress);
    };

    const handleSyncComplete = (result: SyncResult) => {
      setCurrentSyncProgress(null);
      loadSyncData();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const handleSyncError = (error: Error) => {
      setCurrentSyncProgress(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Sync Error', error.message);
    };

    const handleSyncConflict = (conflict: SyncConflict) => {
      setConflicts(prev => [...prev, conflict]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    };

    syncService.on('sync:progress', handleSyncProgress);
    syncService.on('sync:complete', handleSyncComplete);
    syncService.on('sync:error', handleSyncError);
    syncService.on('sync:conflict', handleSyncConflict);

    return () => {
      syncService.off('sync:progress', handleSyncProgress);
      syncService.off('sync:complete', handleSyncComplete);
      syncService.off('sync:error', handleSyncError);
      syncService.off('sync:conflict', handleSyncConflict);
    };
  }, [syncService, loadSyncData]);

  /**
   * Initial load
   */
  useEffect(() => {
    loadSyncData();
  }, [loadSyncData]);

  /**
   * Handle manual sync
   */
  const handleSyncNow = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Animate button
    Animated.sequence([
      Animated.timing(syncButtonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(syncButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (!isOnline) {
      Alert.alert('Offline', 'Cannot sync while offline. Changes will be synced when connection is restored.');
      return;
    }

    try {
      await syncService.syncNow();
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }, [syncService, isOnline, syncButtonScale]);

  /**
   * Handle refresh
   */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSyncData();
    setRefreshing(false);
  }, [loadSyncData]);

  /**
   * Handle provider selection
   */
  const handleSelectProvider = useCallback(async (provider: CloudProvider) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedProvider(provider);
    // TODO: Integrate with actual cloud provider SDK
  }, []);

  /**
   * Handle frequency change
   */
  const handleFrequencyChange = useCallback(async (frequency: SyncFrequency) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSyncFrequency(frequency);

    if (frequency === 'manual') {
      syncService.setAutoSync(false);
    } else if (frequency === 'realtime') {
      syncService.setAutoSync(true);
      syncService.setAutoSyncInterval(1);
    } else {
      syncService.setAutoSync(true);
      const minutes = parseInt(frequency.replace('min', '').replace('hour', '')) * (frequency.includes('hour') ? 60 : 1);
      syncService.setAutoSyncInterval(minutes);
    }
  }, [syncService]);

  /**
   * Handle auto-sync toggle
   */
  const handleAutoSyncToggle = useCallback(async (value: boolean) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAutoSync(value);
    syncService.setAutoSync(value);
  }, [syncService]);

  /**
   * Handle WiFi-only toggle
   */
  const handleWifiOnlyToggle = useCallback(async (value: boolean) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWifiOnly(value);
    // TODO: Implement WiFi-only sync logic
  }, []);

  /**
   * Show conflict resolution panel
   */
  const handleShowConflict = useCallback(async (conflict: SyncConflict) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedConflict(conflict);
    setShowConflictPanel(true);

    Animated.spring(conflictSlide, {
      toValue: 0,
      damping: 15,
      stiffness: 150,
      useNativeDriver: true,
    }).start();
  }, [conflictSlide]);

  /**
   * Hide conflict resolution panel
   */
  const handleHideConflict = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.spring(conflictSlide, {
      toValue: 600,
      damping: 15,
      stiffness: 150,
      useNativeDriver: true,
    }).start(() => {
      setShowConflictPanel(false);
      setSelectedConflict(null);
    });
  }, [conflictSlide]);

  /**
   * Resolve conflict
   */
  const handleResolveConflict = useCallback(async (resolution: ConflictResolution) => {
    if (!selectedConflict) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (resolution === 'manual') {
        // Navigate to manual merge screen
        Alert.alert('Manual Merge', 'Manual merge UI would open here');
      } else {
        await syncService.resolveConflict(selectedConflict, resolution);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Remove from conflicts list
        setConflicts(prev => prev.filter(c => c.id !== selectedConflict.id));

        // Update transcript status
        setTranscriptStatuses(prev =>
          prev.map(t =>
            t.id === selectedConflict.id
              ? { ...t, status: 'synced', lastSyncAt: new Date().toISOString() }
              : t
          )
        );

        handleHideConflict();
      }
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to resolve conflict. Please try again.');
    }
  }, [selectedConflict, syncService, handleHideConflict]);

  /**
   * Show sync logs panel
   */
  const handleShowLogs = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowLogsPanel(true);

    Animated.spring(logsSlide, {
      toValue: 0,
      damping: 15,
      stiffness: 150,
      useNativeDriver: true,
    }).start();
  }, [logsSlide]);

  /**
   * Hide sync logs panel
   */
  const handleHideLogs = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.spring(logsSlide, {
      toValue: 600,
      damping: 15,
      stiffness: 150,
      useNativeDriver: true,
    }).start(() => {
      setShowLogsPanel(false);
    });
  }, [logsSlide]);

  /**
   * Show devices panel
   */
  const handleShowDevices = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowDevicesPanel(true);

    Animated.spring(devicesSlide, {
      toValue: 0,
      damping: 15,
      stiffness: 150,
      useNativeDriver: true,
    }).start();
  }, [devicesSlide]);

  /**
   * Hide devices panel
   */
  const handleHideDevices = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.spring(devicesSlide, {
      toValue: 600,
      damping: 15,
      stiffness: 150,
      useNativeDriver: true,
    }).start(() => {
      setShowDevicesPanel(false);
    });
  }, [devicesSlide]);

  /**
   * Deauthorize device
   */
  const handleDeauthorizeDevice = useCallback(async (deviceId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Deauthorize Device',
      'Are you sure you want to deauthorize this device? It will no longer be able to sync.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deauthorize',
          style: 'destructive',
          onPress: async () => {
            setConnectedDevices(prev =>
              prev.map(d => (d.id === deviceId ? { ...d, authorized: false, status: 'inactive' as const } : d))
            );
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  }, []);

  /**
   * Retry failed sync
   */
  const handleRetrySync = useCallback(async (transcriptId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setTranscriptStatuses(prev =>
      prev.map(t => (t.id === transcriptId ? { ...t, status: 'syncing' as const, progress: 0, error: undefined } : t))
    );

    // Simulate sync
    setTimeout(() => {
      setTranscriptStatuses(prev =>
        prev.map(t =>
          t.id === transcriptId ? { ...t, status: 'synced' as const, lastSyncAt: new Date().toISOString() } : t
        )
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 2000);
  }, []);

  /**
   * Format relative time
   */
  const formatRelativeTime = (timestamp: string): string => {
    const now = Date.now();
    const then = new Date(timestamp).getTime();
    const diff = now - then;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  /**
   * Get status icon
   */
  const getStatusIcon = (status: TranscriptSyncStatus['status']): string => {
    switch (status) {
      case 'synced':
        return 'checkmark-circle';
      case 'syncing':
        return 'sync';
      case 'pending':
        return 'time';
      case 'conflict':
        return 'warning';
      case 'error':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  /**
   * Get status color
   */
  const getStatusColor = (status: TranscriptSyncStatus['status']): string => {
    switch (status) {
      case 'synced':
        return '#10b981';
      case 'syncing':
        return theme.colors.primary;
      case 'pending':
        return '#f59e0b';
      case 'conflict':
        return '#f59e0b';
      case 'error':
        return '#ef4444';
      default:
        return theme.colors.textSecondary;
    }
  };

  // Styles
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      padding: BASE_UNIT * 4,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: BASE_UNIT * 6,
    },
    headerLeft: {
      flex: 1,
    },
    headerActions: {
      flexDirection: 'row',
      gap: BASE_UNIT * 2,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: BASE_UNIT * 3,
      paddingVertical: BASE_UNIT * 1.5,
      borderRadius: 16,
      gap: BASE_UNIT * 1.5,
      marginTop: BASE_UNIT * 2,
    },
    section: {
      marginBottom: BASE_UNIT * 6,
    },
    sectionTitle: {
      marginBottom: BASE_UNIT * 3,
    },
    providerGrid: {
      flexDirection: 'row',
      gap: BASE_UNIT * 3,
      marginBottom: BASE_UNIT * 4,
    },
    providerButton: {
      flex: 1,
      height: 100,
      borderRadius: BASE_UNIT * 3,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
      gap: BASE_UNIT * 2,
      ...elevation.xs,
    },
    settingCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: BASE_UNIT * 3,
      padding: BASE_UNIT * 4,
      marginBottom: BASE_UNIT * 3,
      ...elevation.xs,
    },
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: BASE_UNIT * 2,
    },
    settingInfo: {
      flex: 1,
      marginRight: BASE_UNIT * 3,
    },
    frequencyChips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: BASE_UNIT * 2,
      marginTop: BASE_UNIT * 2,
    },
    frequencyChip: {
      paddingHorizontal: BASE_UNIT * 3,
      paddingVertical: BASE_UNIT * 2,
      borderRadius: 16,
      borderWidth: 1,
      minHeight: 36,
    },
    syncButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: BASE_UNIT * 2,
      padding: BASE_UNIT * 4,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: BASE_UNIT * 2,
      marginBottom: BASE_UNIT * 4,
      ...elevation.sm,
    },
    transcriptCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: BASE_UNIT * 3,
      padding: BASE_UNIT * 3,
      marginBottom: BASE_UNIT * 2,
      ...elevation.xs,
    },
    transcriptHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: BASE_UNIT * 2,
    },
    transcriptInfo: {
      flex: 1,
      marginRight: BASE_UNIT * 2,
    },
    transcriptStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: BASE_UNIT * 1.5,
    },
    progressBar: {
      height: 4,
      backgroundColor: theme.colors.border,
      borderRadius: 2,
      overflow: 'hidden',
      marginTop: BASE_UNIT * 2,
    },
    progressFill: {
      height: '100%',
      backgroundColor: theme.colors.primary,
    },
    actionButton: {
      paddingHorizontal: BASE_UNIT * 3,
      paddingVertical: BASE_UNIT * 1.5,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      marginTop: BASE_UNIT * 2,
    },
    panel: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 500,
      borderTopLeftRadius: BASE_UNIT * 5,
      borderTopRightRadius: BASE_UNIT * 5,
      overflow: 'hidden',
      ...elevation.xl,
    },
    panelContent: {
      flex: 1,
      padding: BASE_UNIT * 4,
    },
    panelHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: BASE_UNIT * 4,
    },
    conflictComparison: {
      flexDirection: 'row',
      gap: BASE_UNIT * 3,
      marginBottom: BASE_UNIT * 4,
    },
    conflictSide: {
      flex: 1,
      backgroundColor: theme.colors.background,
      borderRadius: BASE_UNIT * 2,
      padding: BASE_UNIT * 3,
    },
    conflictActions: {
      flexDirection: 'row',
      gap: BASE_UNIT * 2,
    },
    conflictButton: {
      flex: 1,
      padding: BASE_UNIT * 3,
      borderRadius: BASE_UNIT * 2,
      alignItems: 'center',
      ...elevation.sm,
    },
    logItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: BASE_UNIT * 3,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      gap: BASE_UNIT * 3,
    },
    logIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logInfo: {
      flex: 1,
    },
    deviceCard: {
      backgroundColor: theme.colors.background,
      borderRadius: BASE_UNIT * 3,
      padding: BASE_UNIT * 3,
      marginBottom: BASE_UNIT * 2,
      flexDirection: 'row',
      alignItems: 'center',
      gap: BASE_UNIT * 3,
    },
    deviceIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    deviceInfo: {
      flex: 1,
    },
    deviceActions: {
      flexDirection: 'row',
      gap: BASE_UNIT * 2,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text variant="h3" style={{ fontFamily: 'SF-Pro-Display-Bold' }}>
              Cloud Sync
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: isOnline ? '#10b98120' : '#ef444420' }]}>
              <Ionicons name={isOnline ? 'cloud-done' : 'cloud-offline'} size={16} color={isOnline ? '#10b981' : '#ef4444'} />
              <Text variant="caption" style={{ color: isOnline ? '#10b981' : '#ef4444', fontWeight: '600' }}>
                {isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleShowLogs}>
              <Ionicons name="list" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShowDevices}>
              <Ionicons name="phone-portrait" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Cloud Provider Selection */}
        <View style={styles.section}>
          <Text variant="h6" style={styles.sectionTitle}>
            Cloud Provider
          </Text>
          <View style={styles.providerGrid}>
            <TouchableOpacity
              style={[
                styles.providerButton,
                {
                  borderColor: selectedProvider === 'google-drive' ? '#4285F4' : theme.colors.border,
                  backgroundColor: selectedProvider === 'google-drive' ? '#4285F410' : theme.colors.surface,
                },
              ]}
              onPress={() => handleSelectProvider('google-drive')}
            >
              <Ionicons name="logo-google" size={32} color="#4285F4" />
              <Text variant="caption" style={{ fontWeight: '600' }}>
                Google Drive
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.providerButton,
                {
                  borderColor: selectedProvider === 'dropbox' ? '#0061FF' : theme.colors.border,
                  backgroundColor: selectedProvider === 'dropbox' ? '#0061FF10' : theme.colors.surface,
                },
              ]}
              onPress={() => handleSelectProvider('dropbox')}
            >
              <Ionicons name="logo-dropbox" size={32} color="#0061FF" />
              <Text variant="caption" style={{ fontWeight: '600' }}>
                Dropbox
              </Text>
            </TouchableOpacity>

            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={[
                  styles.providerButton,
                  {
                    borderColor: selectedProvider === 'icloud' ? '#007AFF' : theme.colors.border,
                    backgroundColor: selectedProvider === 'icloud' ? '#007AFF10' : theme.colors.surface,
                  },
                ]}
                onPress={() => handleSelectProvider('icloud')}
              >
                <Ionicons name="cloud" size={32} color="#007AFF" />
                <Text variant="caption" style={{ fontWeight: '600' }}>
                  iCloud
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Sync Settings */}
        <View style={styles.section}>
          <Text variant="h6" style={styles.sectionTitle}>
            Sync Settings
          </Text>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text variant="body" style={{ fontWeight: '600' }}>
                  Auto Sync
                </Text>
                <Text variant="caption" color={theme.colors.textSecondary}>
                  Automatically sync changes
                </Text>
              </View>
              <Switch
                value={autoSync}
                onValueChange={handleAutoSyncToggle}
                trackColor={{ false: '#ccc', true: theme.colors.primary }}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text variant="body" style={{ fontWeight: '600' }}>
                  WiFi Only
                </Text>
                <Text variant="caption" color={theme.colors.textSecondary}>
                  Only sync when connected to WiFi
                </Text>
              </View>
              <Switch
                value={wifiOnly}
                onValueChange={handleWifiOnlyToggle}
                trackColor={{ false: '#ccc', true: theme.colors.primary }}
              />
            </View>
          </View>

          <View style={styles.settingCard}>
            <Text variant="body" style={{ fontWeight: '600', marginBottom: BASE_UNIT * 2 }}>
              Sync Frequency
            </Text>
            <View style={styles.frequencyChips}>
              {(['manual', 'realtime', '5min', '15min', '30min', '1hour'] as SyncFrequency[]).map(freq => (
                <TouchableOpacity
                  key={freq}
                  style={[
                    styles.frequencyChip,
                    {
                      backgroundColor: syncFrequency === freq ? theme.colors.primary : theme.colors.surface,
                      borderColor: syncFrequency === freq ? theme.colors.primary : theme.colors.border,
                    },
                  ]}
                  onPress={() => handleFrequencyChange(freq)}
                >
                  <Text
                    variant="caption"
                    style={{
                      color: syncFrequency === freq ? '#fff' : theme.colors.textPrimary,
                      fontWeight: '600',
                    }}
                  >
                    {freq === 'manual'
                      ? 'Manual'
                      : freq === 'realtime'
                      ? 'Real-time'
                      : freq.replace('min', ' min').replace('hour', ' hour')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Sync Now Button */}
        <Animated.View style={{ transform: [{ scale: syncButtonScale }] }}>
          <TouchableOpacity
            style={styles.syncButton}
            onPress={handleSyncNow}
            disabled={!isOnline || syncStatus?.isSyncing}
          >
            {syncStatus?.isSyncing ? (
              <>
                <ActivityIndicator color="#fff" />
                <Text variant="body" style={{ color: '#fff', fontWeight: '600' }}>
                  Syncing... {currentSyncProgress ? `${Math.round(currentSyncProgress.percentage)}%` : ''}
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="sync" size={20} color="#fff" />
                <Text variant="body" style={{ color: '#fff', fontWeight: '600' }}>
                  Sync Now
                </Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Sync Status */}
        {syncStatus && (
          <View style={styles.settingCard}>
            <Text variant="body" style={{ fontWeight: '600', marginBottom: BASE_UNIT * 3 }}>
              Sync Status
            </Text>
            <View style={{ gap: BASE_UNIT * 2 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="caption" color={theme.colors.textSecondary}>
                  Last Sync
                </Text>
                <Text variant="caption" style={{ fontWeight: '600' }}>
                  {syncStatus.lastSyncAt ? formatRelativeTime(syncStatus.lastSyncAt.toISOString()) : 'Never'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="caption" color={theme.colors.textSecondary}>
                  Pending Items
                </Text>
                <Text variant="caption" style={{ fontWeight: '600' }}>
                  {syncStatus.pendingItems}
                </Text>
              </View>
              {syncStatus.nextSyncAt && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text variant="caption" color={theme.colors.textSecondary}>
                    Next Sync
                  </Text>
                  <Text variant="caption" style={{ fontWeight: '600' }}>
                    {formatRelativeTime(syncStatus.nextSyncAt.toISOString())}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Transcript Sync Status */}
        <View style={styles.section}>
          <Text variant="h6" style={styles.sectionTitle}>
            Transcript Status
          </Text>
          {transcriptStatuses.map(transcript => (
            <View key={transcript.id} style={styles.transcriptCard}>
              <View style={styles.transcriptHeader}>
                <View style={styles.transcriptInfo}>
                  <Text variant="body" style={{ fontWeight: '600', marginBottom: BASE_UNIT }}>
                    {transcript.title}
                  </Text>
                  {transcript.lastSyncAt && (
                    <Text variant="caption" color={theme.colors.textSecondary}>
                      {formatRelativeTime(transcript.lastSyncAt)}
                    </Text>
                  )}
                  {transcript.error && (
                    <Text variant="caption" style={{ color: '#ef4444', marginTop: BASE_UNIT }}>
                      {transcript.error}
                    </Text>
                  )}
                </View>
                <View style={styles.transcriptStatus}>
                  <Ionicons name={getStatusIcon(transcript.status) as any} size={20} color={getStatusColor(transcript.status)} />
                  <Text variant="caption" style={{ color: getStatusColor(transcript.status), fontWeight: '600' }}>
                    {transcript.status.charAt(0).toUpperCase() + transcript.status.slice(1)}
                  </Text>
                </View>
              </View>

              {transcript.status === 'syncing' && transcript.progress !== undefined && (
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${transcript.progress}%` }]} />
                </View>
              )}

              {transcript.status === 'conflict' && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    const conflict: SyncConflict = {
                      id: transcript.id,
                      local: { id: transcript.id, title: transcript.title } as any,
                      remote: { id: transcript.id, title: transcript.title } as any,
                    };
                    handleShowConflict(conflict);
                  }}
                >
                  <Text variant="caption" style={{ color: theme.colors.primary, fontWeight: '600', textAlign: 'center' }}>
                    Resolve Conflict
                  </Text>
                </TouchableOpacity>
              )}

              {transcript.status === 'error' && (
                <TouchableOpacity style={styles.actionButton} onPress={() => handleRetrySync(transcript.id)}>
                  <Text variant="caption" style={{ color: theme.colors.primary, fontWeight: '600', textAlign: 'center' }}>
                    Retry Sync
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Conflict Resolution Panel */}
      {showConflictPanel && selectedConflict && (
        <Animated.View style={[styles.panel, { transform: [{ translateY: conflictSlide }] }]}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={blurIntensity.strong} tint="light" style={{ flex: 1 }}>
              <View style={styles.panelContent}>
                <View style={styles.panelHeader}>
                  <Text variant="h6" style={{ fontFamily: 'SF-Pro-Display-Bold' }}>
                    Resolve Conflict
                  </Text>
                  <TouchableOpacity onPress={handleHideConflict}>
                    <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
                  </TouchableOpacity>
                </View>

                <Text variant="body" style={{ marginBottom: BASE_UNIT * 4, color: theme.colors.textSecondary }}>
                  This transcript has conflicting changes. Choose which version to keep:
                </Text>

                <View style={styles.conflictComparison}>
                  <View style={styles.conflictSide}>
                    <Text variant="caption" style={{ fontWeight: '600', marginBottom: BASE_UNIT * 2 }}>
                      Local Version
                    </Text>
                    <Text variant="body" style={{ marginBottom: BASE_UNIT }}>
                      {selectedConflict.local.title}
                    </Text>
                    <Text variant="caption" color={theme.colors.textSecondary}>
                      Modified: {formatRelativeTime(selectedConflict.local.updated_at)}
                    </Text>
                  </View>

                  <View style={styles.conflictSide}>
                    <Text variant="caption" style={{ fontWeight: '600', marginBottom: BASE_UNIT * 2 }}>
                      Cloud Version
                    </Text>
                    <Text variant="body" style={{ marginBottom: BASE_UNIT }}>
                      {selectedConflict.remote.title}
                    </Text>
                    <Text variant="caption" color={theme.colors.textSecondary}>
                      Modified: {formatRelativeTime(selectedConflict.remote.updated_at)}
                    </Text>
                  </View>
                </View>

                <View style={styles.conflictActions}>
                  <TouchableOpacity
                    style={[styles.conflictButton, { backgroundColor: theme.colors.primary }]}
                    onPress={() => handleResolveConflict('local')}
                  >
                    <Text variant="body" style={{ color: '#fff', fontWeight: '600' }}>
                      Keep Local
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.conflictButton, { backgroundColor: theme.colors.primary }]}
                    onPress={() => handleResolveConflict('remote')}
                  >
                    <Text variant="body" style={{ color: '#fff', fontWeight: '600' }}>
                      Keep Cloud
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.conflictButton, { backgroundColor: theme.colors.surface, marginTop: BASE_UNIT * 2 }]}
                  onPress={() => handleResolveConflict('manual')}
                >
                  <Text variant="body" style={{ color: theme.colors.primary, fontWeight: '600' }}>
                    Manual Merge
                  </Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          ) : (
            <View style={[styles.panelContent, { backgroundColor: theme.colors.surface }]}>
              {/* Same content as iOS but without BlurView */}
            </View>
          )}
        </Animated.View>
      )}

      {/* Sync Logs Panel */}
      {showLogsPanel && (
        <Animated.View style={[styles.panel, { transform: [{ translateY: logsSlide }] }]}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={blurIntensity.strong} tint="light" style={{ flex: 1 }}>
              <View style={styles.panelContent}>
                <View style={styles.panelHeader}>
                  <Text variant="h6" style={{ fontFamily: 'SF-Pro-Display-Bold' }}>
                    Sync Logs
                  </Text>
                  <TouchableOpacity onPress={handleHideLogs}>
                    <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {syncLogs.map(log => (
                    <View key={log.id} style={styles.logItem}>
                      <View
                        style={[
                          styles.logIcon,
                          {
                            backgroundColor: log.success
                              ? '#10b98120'
                              : log.action === 'conflict'
                              ? '#f59e0b20'
                              : '#ef444420',
                          },
                        ]}
                      >
                        <Ionicons
                          name={
                            log.action === 'upload'
                              ? 'cloud-upload'
                              : log.action === 'download'
                              ? 'cloud-download'
                              : log.action === 'conflict'
                              ? 'warning'
                              : 'close-circle'
                          }
                          size={20}
                          color={log.success ? '#10b981' : log.action === 'conflict' ? '#f59e0b' : '#ef4444'}
                        />
                      </View>
                      <View style={styles.logInfo}>
                        <Text variant="body" style={{ fontWeight: '600', marginBottom: BASE_UNIT }}>
                          {log.transcriptTitle}
                        </Text>
                        <Text variant="caption" color={theme.colors.textSecondary} style={{ marginBottom: BASE_UNIT }}>
                          {log.details}
                        </Text>
                        <Text variant="caption" color={theme.colors.textSecondary}>
                          {formatRelativeTime(log.timestamp)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </BlurView>
          ) : (
            <View style={[styles.panelContent, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.panelHeader}>
                <Text variant="h6" style={{ fontFamily: 'SF-Pro-Display-Bold' }}>
                  Sync Logs
                </Text>
                <TouchableOpacity onPress={handleHideLogs}>
                  <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {syncLogs.map(log => (
                  <View key={log.id} style={styles.logItem}>
                    <View
                      style={[
                        styles.logIcon,
                        {
                          backgroundColor: log.success
                            ? '#10b98120'
                            : log.action === 'conflict'
                            ? '#f59e0b20'
                            : '#ef444420',
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          log.action === 'upload'
                            ? 'cloud-upload-outline'
                            : log.action === 'download'
                            ? 'cloud-download-outline'
                            : log.action === 'conflict'
                            ? 'warning-outline'
                            : 'close-circle-outline'
                        }
                        size={20}
                        color={log.success ? '#10b981' : log.action === 'conflict' ? '#f59e0b' : '#ef4444'}
                      />
                    </View>
                    <View style={styles.logInfo}>
                      <Text variant="body" style={{ fontWeight: '600', marginBottom: BASE_UNIT }}>
                        {log.transcriptTitle}
                      </Text>
                      <Text variant="caption" color={theme.colors.textSecondary} style={{ marginBottom: BASE_UNIT }}>
                        {log.details}
                      </Text>
                      <Text variant="caption" color={theme.colors.textSecondary}>
                        {formatRelativeTime(log.timestamp)}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </Animated.View>
      )}

      {/* Connected Devices Panel */}
      {showDevicesPanel && (
        <Animated.View style={[styles.panel, { transform: [{ translateY: devicesSlide }] }]}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={blurIntensity.strong} tint="light" style={{ flex: 1 }}>
              <View style={styles.panelContent}>
                <View style={styles.panelHeader}>
                  <Text variant="h6" style={{ fontFamily: 'SF-Pro-Display-Bold' }}>
                    Connected Devices
                  </Text>
                  <TouchableOpacity onPress={handleHideDevices}>
                    <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {connectedDevices.map(device => (
                    <View key={device.id} style={styles.deviceCard}>
                      <View style={styles.deviceIcon}>
                        <Ionicons
                          name={
                            device.type === 'ios'
                              ? 'phone-portrait'
                              : device.type === 'android'
                              ? 'phone-portrait'
                              : 'desktop'
                          }
                          size={24}
                          color={theme.colors.primary}
                        />
                      </View>
                      <View style={styles.deviceInfo}>
                        <Text variant="body" style={{ fontWeight: '600', marginBottom: BASE_UNIT }}>
                          {device.name}
                        </Text>
                        <Text variant="caption" color={theme.colors.textSecondary}>
                          Last sync: {formatRelativeTime(device.lastSyncAt)}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: BASE_UNIT, marginTop: BASE_UNIT }}>
                          <View
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: device.status === 'active' ? '#10b981' : '#9ca3af',
                            }}
                          />
                          <Text variant="caption" style={{ color: device.status === 'active' ? '#10b981' : '#9ca3af' }}>
                            {device.status === 'active' ? 'Active' : 'Inactive'}
                          </Text>
                        </View>
                      </View>
                      {device.authorized && (
                        <TouchableOpacity onPress={() => handleDeauthorizeDevice(device.id)}>
                          <Ionicons name="trash-outline" size={20} color="#ef4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </ScrollView>
              </View>
            </BlurView>
          ) : (
            <View style={[styles.panelContent, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.panelHeader}>
                <Text variant="h6" style={{ fontFamily: 'SF-Pro-Display-Bold' }}>
                  Connected Devices
                </Text>
                <TouchableOpacity onPress={handleHideDevices}>
                  <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {connectedDevices.map(device => (
                  <View key={device.id} style={styles.deviceCard}>
                    <View style={styles.deviceIcon}>
                      <Ionicons
                        name={
                          device.type === 'ios'
                            ? 'phone-portrait'
                            : device.type === 'android'
                            ? 'phone-portrait'
                            : 'desktop'
                        }
                        size={24}
                        color={theme.colors.primary}
                      />
                    </View>
                    <View style={styles.deviceInfo}>
                      <Text variant="body" style={{ fontWeight: '600', marginBottom: BASE_UNIT }}>
                        {device.name}
                      </Text>
                      <Text variant="caption" color={theme.colors.textSecondary}>
                        Last sync: {formatRelativeTime(device.lastSyncAt)}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: BASE_UNIT, marginTop: BASE_UNIT }}>
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: device.status === 'active' ? '#10b981' : '#9ca3af',
                          }}
                        />
                        <Text variant="caption" style={{ color: device.status === 'active' ? '#10b981' : '#9ca3af' }}>
                          {device.status === 'active' ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                    </View>
                    {device.authorized && (
                      <TouchableOpacity onPress={() => handleDeauthorizeDevice(device.id)}>
                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </Animated.View>
      )}
    </View>
  );
};


