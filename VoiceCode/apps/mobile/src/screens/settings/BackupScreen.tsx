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

const BASE_UNIT = 4;

// TypeScript Interfaces
type BackupFrequency = 'manual' | 'daily' | 'weekly' | 'monthly';
type BackupStatus = 'idle' | 'backing-up' | 'restoring' | 'verifying' | 'success' | 'error';
type CloudProvider = 'icloud' | 'google-drive' | 'dropbox' | 'local';
type EncryptionLevel = 'none' | 'standard' | 'high';

interface BackupItem {
  id: string;
  name: string;
  date: string;
  size: number; // in bytes
  encrypted: boolean;
  verified: boolean;
  cloudProvider: CloudProvider;
  transcriptCount: number;
  status: 'complete' | 'partial' | 'corrupted';
}

interface StorageBreakdown {
  transcripts: number;
  audio: number;
  settings: number;
  cache: number;
  total: number;
}

interface BackupProgress {
  percentage: number;
  currentFile: string;
  filesProcessed: number;
  totalFiles: number;
  estimatedTimeRemaining: number; // in seconds
}

export const BackupScreen: React.FC = () => {
  const { theme } = useTheme();

  // State Management
  const [backupStatus, setBackupStatus] = useState<BackupStatus>('idle');
  const [backupFrequency, setBackupFrequency] = useState<BackupFrequency>('weekly');
  const [autoBackup, setAutoBackup] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<CloudProvider>('icloud');
  const [encryptionLevel, setEncryptionLevel] = useState<EncryptionLevel>('standard');
  const [encryptionPassword, setEncryptionPassword] = useState('');
  const [backupHistory, setBackupHistory] = useState<BackupItem[]>([]);
  const [storageBreakdown, setStorageBreakdown] = useState<StorageBreakdown>({
    transcripts: 0,
    audio: 0,
    settings: 0,
    cache: 0,
    total: 0,
  });
  const [backupProgress, setBackupProgress] = useState<BackupProgress | null>(null);
  const [selectedBackup, setSelectedBackup] = useState<BackupItem | null>(null);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [showStoragePanel, setShowStoragePanel] = useState(false);
  const [showEncryptionPanel, setShowEncryptionPanel] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);
  const [nextScheduledBackup, setNextScheduledBackup] = useState<string | null>(null);

  // Animation Values
  const historySlide = useRef(new Animated.Value(600)).current;
  const storageSlide = useRef(new Animated.Value(600)).current;
  const encryptionSlide = useRef(new Animated.Value(600)).current;
  const backupButtonScale = useRef(new Animated.Value(1)).current;

  /**
   * Load backup data
   */
  const loadBackupData = useCallback(async () => {
    // Mock data - replace with actual service calls
    const mockBackups: BackupItem[] = [
      {
        id: '1',
        name: 'Auto Backup - Dec 28',
        date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        size: 45 * 1024 * 1024, // 45 MB
        encrypted: true,
        verified: true,
        cloudProvider: 'icloud',
        transcriptCount: 127,
        status: 'complete',
      },
      {
        id: '2',
        name: 'Manual Backup - Dec 25',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        size: 42 * 1024 * 1024, // 42 MB
        encrypted: true,
        verified: true,
        cloudProvider: 'google-drive',
        transcriptCount: 120,
        status: 'complete',
      },
      {
        id: '3',
        name: 'Auto Backup - Dec 21',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        size: 38 * 1024 * 1024, // 38 MB
        encrypted: true,
        verified: false,
        cloudProvider: 'icloud',
        transcriptCount: 110,
        status: 'complete',
      },
      {
        id: '4',
        name: 'Manual Backup - Dec 15',
        date: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
        size: 35 * 1024 * 1024, // 35 MB
        encrypted: false,
        verified: true,
        cloudProvider: 'dropbox',
        transcriptCount: 95,
        status: 'partial',
      },
    ];

    setBackupHistory(mockBackups);
    setLastBackupDate(mockBackups[0].date);
    setNextScheduledBackup(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString());

    // Mock storage breakdown
    setStorageBreakdown({
      transcripts: 25 * 1024 * 1024, // 25 MB
      audio: 15 * 1024 * 1024, // 15 MB
      settings: 2 * 1024 * 1024, // 2 MB
      cache: 3 * 1024 * 1024, // 3 MB
      total: 45 * 1024 * 1024, // 45 MB
    });
  }, []);

  /**
   * Initialize data on mount
   */
  useEffect(() => {
    loadBackupData();
  }, [loadBackupData]);

  /**
   * Handle refresh
   */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBackupData();
    setRefreshing(false);
  }, [loadBackupData]);

  /**
   * Handle create backup
   */
  const handleCreateBackup = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Animate button
    Animated.sequence([
      Animated.timing(backupButtonScale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(backupButtonScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    setBackupStatus('backing-up');

    // Simulate backup progress
    const totalFiles = 127;
    let filesProcessed = 0;

    const interval = setInterval(() => {
      filesProcessed += Math.floor(Math.random() * 5) + 1;
      if (filesProcessed >= totalFiles) {
        filesProcessed = totalFiles;
        clearInterval(interval);

        setTimeout(() => {
          setBackupStatus('success');
          setBackupProgress(null);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          // Add new backup to history
          const newBackup: BackupItem = {
            id: Date.now().toString(),
            name: `Manual Backup - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
            date: new Date().toISOString(),
            size: 45 * 1024 * 1024,
            encrypted: encryptionLevel !== 'none',
            verified: false,
            cloudProvider: selectedProvider,
            transcriptCount: totalFiles,
            status: 'complete',
          };

          setBackupHistory(prev => [newBackup, ...prev]);
          setLastBackupDate(newBackup.date);

          setTimeout(() => {
            setBackupStatus('idle');
          }, 2000);
        }, 500);
      } else {
        const percentage = (filesProcessed / totalFiles) * 100;
        setBackupProgress({
          percentage,
          currentFile: `Transcript_${filesProcessed}.txt`,
          filesProcessed,
          totalFiles,
          estimatedTimeRemaining: Math.ceil(((totalFiles - filesProcessed) / 5) * 0.5),
        });
      }
    }, 500);
  }, [backupButtonScale, encryptionLevel, selectedProvider]);

  /**
   * Handle restore backup
   */
  const handleRestoreBackup = useCallback(async (backup: BackupItem) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Restore Backup',
      `Are you sure you want to restore "${backup.name}"? This will replace your current data.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            setBackupStatus('restoring');
            setSelectedBackup(backup);

            // Simulate restore
            setTimeout(() => {
              setBackupStatus('success');
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Success', 'Backup restored successfully!');

              setTimeout(() => {
                setBackupStatus('idle');
                setSelectedBackup(null);
              }, 2000);
            }, 3000);
          },
        },
      ]
    );
  }, []);

  /**
   * Handle verify backup
   */
  const handleVerifyBackup = useCallback(async (backupId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setBackupStatus('verifying');

    // Simulate verification
    setTimeout(() => {
      setBackupHistory(prev =>
        prev.map(b => (b.id === backupId ? { ...b, verified: true } : b))
      );
      setBackupStatus('success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setTimeout(() => {
        setBackupStatus('idle');
      }, 2000);
    }, 2000);
  }, []);

  /**
   * Handle delete backup
   */
  const handleDeleteBackup = useCallback(async (backupId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert('Delete Backup', 'Are you sure you want to delete this backup? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setBackupHistory(prev => prev.filter(b => b.id !== backupId));
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  }, []);

  /**
   * Handle frequency change
   */
  const handleFrequencyChange = useCallback(async (frequency: BackupFrequency) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBackupFrequency(frequency);

    // Update next scheduled backup based on frequency
    const now = Date.now();
    let nextBackup: Date;

    switch (frequency) {
      case 'daily':
        nextBackup = new Date(now + 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        nextBackup = new Date(now + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        nextBackup = new Date(now + 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        nextBackup = new Date(now);
    }

    setNextScheduledBackup(frequency === 'manual' ? null : nextBackup.toISOString());
  }, []);

  /**
   * Handle auto backup toggle
   */
  const handleAutoBackupToggle = useCallback(async (value: boolean) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAutoBackup(value);

    if (!value) {
      setNextScheduledBackup(null);
    } else {
      handleFrequencyChange(backupFrequency);
    }
  }, [backupFrequency, handleFrequencyChange]);

  /**
   * Handle provider selection
   */
  const handleSelectProvider = useCallback(async (provider: CloudProvider) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedProvider(provider);
  }, []);

  /**
   * Handle encryption level change
   */
  const handleEncryptionLevelChange = useCallback(async (level: EncryptionLevel) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEncryptionLevel(level);

    if (level !== 'none' && !encryptionPassword) {
      setShowEncryptionPanel(true);
      Animated.spring(encryptionSlide, {
        toValue: 0,
        damping: 15,
        stiffness: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [encryptionPassword, encryptionSlide]);

  /**
   * Handle show history panel
   */
  const handleShowHistory = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowHistoryPanel(true);
    Animated.spring(historySlide, {
      toValue: 0,
      damping: 15,
      stiffness: 150,
      useNativeDriver: true,
    }).start();
  }, [historySlide]);

  /**
   * Handle hide history panel
   */
  const handleHideHistory = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(historySlide, {
      toValue: 600,
      damping: 15,
      stiffness: 150,
      useNativeDriver: true,
    }).start(() => {
      setShowHistoryPanel(false);
    });
  }, [historySlide]);

  /**
   * Handle show storage panel
   */
  const handleShowStorage = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowStoragePanel(true);
    Animated.spring(storageSlide, {
      toValue: 0,
      damping: 15,
      stiffness: 150,
      useNativeDriver: true,
    }).start();
  }, [storageSlide]);

  /**
   * Handle hide storage panel
   */
  const handleHideStorage = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(storageSlide, {
      toValue: 600,
      damping: 15,
      stiffness: 150,
      useNativeDriver: true,
    }).start(() => {
      setShowStoragePanel(false);
    });
  }, [storageSlide]);

  /**
   * Handle show encryption panel
   */
  const handleShowEncryption = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowEncryptionPanel(true);
    Animated.spring(encryptionSlide, {
      toValue: 0,
      damping: 15,
      stiffness: 150,
      useNativeDriver: true,
    }).start();
  }, [encryptionSlide]);

  /**
   * Handle hide encryption panel
   */
  const handleHideEncryption = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(encryptionSlide, {
      toValue: 600,
      damping: 15,
      stiffness: 150,
      useNativeDriver: true,
    }).start(() => {
      setShowEncryptionPanel(false);
    });
  }, [encryptionSlide]);

  /**
   * Handle save encryption password
   */
  const handleSaveEncryptionPassword = useCallback(async () => {
    if (!encryptionPassword || encryptionPassword.length < 8) {
      Alert.alert('Invalid Password', 'Password must be at least 8 characters long.');
      return;
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Success', 'Encryption password saved securely.');
    handleHideEncryption();
  }, [encryptionPassword, handleHideEncryption]);

  // Helper Functions

  /**
   * Format bytes to human-readable size
   */
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  /**
   * Format relative time
   */
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  /**
   * Get status icon
   */
  const getStatusIcon = (status: BackupStatus): string => {
    switch (status) {
      case 'backing-up':
        return 'cloud-upload-outline';
      case 'restoring':
        return 'cloud-download-outline';
      case 'verifying':
        return 'checkmark-circle-outline';
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'alert-circle';
      default:
        return 'cloud-outline';
    }
  };

  /**
   * Get status color
   */
  const getStatusColor = (status: BackupStatus): string => {
    switch (status) {
      case 'backing-up':
      case 'restoring':
      case 'verifying':
        return '#667eea';
      case 'success':
        return '#10b981';
      case 'error':
        return '#ef4444';
      default:
        return theme.colors.textSecondary;
    }
  };

  /**
   * Get provider icon
   */
  const getProviderIcon = (provider: CloudProvider): string => {
    switch (provider) {
      case 'icloud':
        return 'cloud';
      case 'google-drive':
        return 'logo-google';
      case 'dropbox':
        return 'water';
      case 'local':
        return 'phone-portrait';
      default:
        return 'cloud-outline';
    }
  };

  /**
   * Get provider color
   */
  const getProviderColor = (provider: CloudProvider): string => {
    switch (provider) {
      case 'icloud':
        return '#007AFF';
      case 'google-drive':
        return '#4285F4';
      case 'dropbox':
        return '#0061FF';
      case 'local':
        return theme.colors.textSecondary;
      default:
        return theme.colors.textSecondary;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Status Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.statusHeader}>
            <Ionicons
              name={getStatusIcon(backupStatus) as any}
              size={32}
              color={getStatusColor(backupStatus)}
            />
            <View style={styles.statusTextContainer}>
              <Text variant="h6" style={styles.statusTitle}>
                {backupStatus === 'idle' && 'Ready to Backup'}
                {backupStatus === 'backing-up' && 'Backing Up...'}
                {backupStatus === 'restoring' && 'Restoring...'}
                {backupStatus === 'verifying' && 'Verifying...'}
                {backupStatus === 'success' && 'Success!'}
                {backupStatus === 'error' && 'Error'}
              </Text>
              {lastBackupDate && (
                <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
                  Last backup: {formatRelativeTime(lastBackupDate)}
                </Text>
              )}
            </View>
          </View>

          {/* Backup Progress */}
          {backupProgress && (
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text variant="body" style={{ color: theme.colors.textPrimary }}>
                  {backupProgress.currentFile}
                </Text>
                <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
                  {backupProgress.filesProcessed} / {backupProgress.totalFiles}
                </Text>
              </View>
              <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${backupProgress.percentage}%`, backgroundColor: '#667eea' },
                  ]}
                />
              </View>
              <Text variant="caption" style={{ color: theme.colors.textSecondary, marginTop: BASE_UNIT }}>
                {Math.round(backupProgress.percentage)}% • {backupProgress.estimatedTimeRemaining}s remaining
              </Text>
            </View>
          )}
        </View>

        {/* Cloud Provider Selection */}
        <View style={styles.section}>
          <Text variant="h6" style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            Backup Location
          </Text>
          <View style={styles.providerGrid}>
            {(['icloud', 'google-drive', 'dropbox', 'local'] as CloudProvider[]).map(provider => (
              <TouchableOpacity
                key={provider}
                style={[
                  styles.providerChip,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: selectedProvider === provider ? getProviderColor(provider) : theme.colors.border,
                    borderWidth: selectedProvider === provider ? 2 : 1,
                  },
                ]}
                onPress={() => handleSelectProvider(provider)}
              >
                <Ionicons name={getProviderIcon(provider) as any} size={24} color={getProviderColor(provider)} />
                <Text
                  variant="caption"
                  style={{
                    color: selectedProvider === provider ? theme.colors.textPrimary : theme.colors.textSecondary,
                    marginTop: BASE_UNIT,
                    fontWeight: selectedProvider === provider ? '600' : '400',
                  }}
                >
                  {provider === 'icloud' && 'iCloud'}
                  {provider === 'google-drive' && 'Google Drive'}
                  {provider === 'dropbox' && 'Dropbox'}
                  {provider === 'local' && 'Local'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Backup Settings */}
        <View style={styles.section}>
          <Text variant="h6" style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            Backup Settings
          </Text>
          <View style={[styles.settingCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.settingRow}>
              <Text variant="body" style={{ color: theme.colors.textPrimary }}>
                Auto Backup
              </Text>
              <Switch
                value={autoBackup}
                onValueChange={handleAutoBackupToggle}
                trackColor={{ false: theme.colors.border, true: '#667eea' }}
                thumbColor={Platform.OS === 'ios' ? undefined : '#ffffff'}
              />
            </View>
          </View>

          {/* Frequency Selection */}
          {autoBackup && (
            <View style={styles.frequencyContainer}>
              <Text variant="body" style={[styles.frequencyLabel, { color: theme.colors.textSecondary }]}>
                Backup Frequency
              </Text>
              <View style={styles.frequencyGrid}>
                {(['daily', 'weekly', 'monthly'] as BackupFrequency[]).map(freq => (
                  <TouchableOpacity
                    key={freq}
                    style={[
                      styles.frequencyChip,
                      {
                        backgroundColor: backupFrequency === freq ? '#667eea' : theme.colors.surface,
                        borderColor: backupFrequency === freq ? '#667eea' : theme.colors.border,
                      },
                    ]}
                    onPress={() => handleFrequencyChange(freq)}
                  >
                    <Text
                      variant="caption"
                      style={{
                        color: backupFrequency === freq ? '#ffffff' : theme.colors.textPrimary,
                        fontWeight: backupFrequency === freq ? '600' : '400',
                      }}
                    >
                      {freq.charAt(0).toUpperCase() + freq.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {nextScheduledBackup && (
                <Text variant="caption" style={{ color: theme.colors.textSecondary, marginTop: BASE_UNIT * 2 }}>
                  Next backup: {formatRelativeTime(nextScheduledBackup)}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Encryption Settings */}
        <View style={styles.section}>
          <Text variant="h6" style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            Encryption
          </Text>
          <View style={styles.encryptionGrid}>
            {(['none', 'standard', 'high'] as EncryptionLevel[]).map(level => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.encryptionChip,
                  {
                    backgroundColor: encryptionLevel === level ? '#667eea' : theme.colors.surface,
                    borderColor: encryptionLevel === level ? '#667eea' : theme.colors.border,
                  },
                ]}
                onPress={() => handleEncryptionLevelChange(level)}
              >
                <Ionicons
                  name={level === 'none' ? 'lock-open-outline' : level === 'standard' ? 'lock-closed-outline' : 'shield-checkmark'}
                  size={20}
                  color={encryptionLevel === level ? '#ffffff' : theme.colors.textPrimary}
                />
                <Text
                  variant="caption"
                  style={{
                    color: encryptionLevel === level ? '#ffffff' : theme.colors.textPrimary,
                    marginTop: BASE_UNIT,
                    fontWeight: encryptionLevel === level ? '600' : '400',
                  }}
                >
                  {level === 'none' && 'None'}
                  {level === 'standard' && 'Standard'}
                  {level === 'high' && 'High'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {encryptionLevel !== 'none' && (
            <TouchableOpacity
              style={[styles.encryptionButton, { backgroundColor: theme.colors.surface }]}
              onPress={handleShowEncryption}
            >
              <Ionicons name="key-outline" size={20} color="#667eea" />
              <Text variant="body" style={{ color: '#667eea', marginLeft: BASE_UNIT * 2 }}>
                {encryptionPassword ? 'Change Encryption Password' : 'Set Encryption Password'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={[styles.quickActionCard, { backgroundColor: theme.colors.surface }]}
              onPress={handleShowHistory}
            >
              <Ionicons name="time-outline" size={32} color="#667eea" />
              <Text variant="body" style={[styles.quickActionTitle, { color: theme.colors.textPrimary }]}>
                Backup History
              </Text>
              <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
                {backupHistory.length} backups
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionCard, { backgroundColor: theme.colors.surface }]}
              onPress={handleShowStorage}
            >
              <Ionicons name="pie-chart-outline" size={32} color="#667eea" />
              <Text variant="body" style={[styles.quickActionTitle, { color: theme.colors.textPrimary }]}>
                Storage Usage
              </Text>
              <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
                {formatBytes(storageBreakdown.total)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Create Backup Button */}
        <Animated.View style={{ transform: [{ scale: backupButtonScale }] }}>
          <TouchableOpacity
            style={[
              styles.backupButton,
              {
                backgroundColor: backupStatus === 'backing-up' || backupStatus === 'restoring' ? theme.colors.border : '#667eea',
              },
            ]}
            onPress={handleCreateBackup}
            disabled={backupStatus === 'backing-up' || backupStatus === 'restoring'}
          >
            {backupStatus === 'backing-up' || backupStatus === 'restoring' ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={24} color="#ffffff" />
                <Text variant="body" style={styles.backupButtonText}>
                  Create Backup Now
                </Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Recent Backups Preview */}
        <View style={styles.section}>
          <Text variant="h6" style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            Recent Backups
          </Text>
          {backupHistory.slice(0, 3).map(backup => (
            <View key={backup.id} style={[styles.backupCard, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.backupHeader}>
                <Ionicons name={getProviderIcon(backup.cloudProvider) as any} size={24} color={getProviderColor(backup.cloudProvider)} />
                <View style={styles.backupInfo}>
                  <Text variant="body" style={{ color: theme.colors.textPrimary, fontWeight: '600' }}>
                    {backup.name}
                  </Text>
                  <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
                    {formatRelativeTime(backup.date)} • {formatBytes(backup.size)} • {backup.transcriptCount} transcripts
                  </Text>
                </View>
              </View>
              <View style={styles.backupBadges}>
                {backup.encrypted && (
                  <View style={[styles.badge, { backgroundColor: '#10b98120' }]}>
                    <Ionicons name="lock-closed" size={12} color="#10b981" />
                    <Text variant="caption" style={{ color: '#10b981', marginLeft: BASE_UNIT }}>
                      Encrypted
                    </Text>
                  </View>
                )}
                {backup.verified && (
                  <View style={[styles.badge, { backgroundColor: '#667eea20' }]}>
                    <Ionicons name="checkmark-circle" size={12} color="#667eea" />
                    <Text variant="caption" style={{ color: '#667eea', marginLeft: BASE_UNIT }}>
                      Verified
                    </Text>
                  </View>
                )}
                {backup.status === 'partial' && (
                  <View style={[styles.badge, { backgroundColor: '#f59e0b20' }]}>
                    <Ionicons name="warning" size={12} color="#f59e0b" />
                    <Text variant="caption" style={{ color: '#f59e0b', marginLeft: BASE_UNIT }}>
                      Partial
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.backupActions}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#667eea20' }]}
                  onPress={() => handleRestoreBackup(backup)}
                >
                  <Ionicons name="cloud-download-outline" size={16} color="#667eea" />
                  <Text variant="caption" style={{ color: '#667eea', marginLeft: BASE_UNIT }}>
                    Restore
                  </Text>
                </TouchableOpacity>
                {!backup.verified && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#10b98120' }]}
                    onPress={() => handleVerifyBackup(backup.id)}
                  >
                    <Ionicons name="checkmark-circle-outline" size={16} color="#10b981" />
                    <Text variant="caption" style={{ color: '#10b981', marginLeft: BASE_UNIT }}>
                      Verify
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
          {backupHistory.length > 3 && (
            <TouchableOpacity style={styles.viewAllButton} onPress={handleShowHistory}>
              <Text variant="body" style={{ color: '#667eea', fontWeight: '600' }}>
                View All Backups ({backupHistory.length})
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#667eea" />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Backup History Panel */}
      {showHistoryPanel && (
        <Animated.View
          style={[
            styles.panel,
            {
              transform: [{ translateY: historySlide }],
            },
          ]}
        >
          {Platform.OS === 'ios' ? (
            <BlurView intensity={blurIntensity.strong} tint="light" style={styles.panelContent}>
              <View style={styles.panelHeader}>
                <Text variant="h6" style={{ color: theme.colors.textPrimary }}>
                  Backup History
                </Text>
                <TouchableOpacity onPress={handleHideHistory}>
                  <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.panelScroll}>
                {backupHistory.map(backup => (
                  <View key={backup.id} style={[styles.historyItem, { backgroundColor: theme.colors.surface }]}>
                    <View style={styles.historyHeader}>
                      <Ionicons name={getProviderIcon(backup.cloudProvider) as any} size={24} color={getProviderColor(backup.cloudProvider)} />
                      <View style={styles.historyInfo}>
                        <Text variant="body" style={{ color: theme.colors.textPrimary, fontWeight: '600' }}>
                          {backup.name}
                        </Text>
                        <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
                          {formatRelativeTime(backup.date)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.historyDetails}>
                      <View style={styles.historyDetailRow}>
                        <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
                          Size:
                        </Text>
                        <Text variant="caption" style={{ color: theme.colors.textPrimary }}>
                          {formatBytes(backup.size)}
                        </Text>
                      </View>
                      <View style={styles.historyDetailRow}>
                        <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
                          Transcripts:
                        </Text>
                        <Text variant="caption" style={{ color: theme.colors.textPrimary }}>
                          {backup.transcriptCount}
                        </Text>
                      </View>
                      <View style={styles.historyDetailRow}>
                        <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
                          Status:
                        </Text>
                        <Text variant="caption" style={{ color: theme.colors.textPrimary }}>
                          {backup.status.charAt(0).toUpperCase() + backup.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.historyBadges}>
                      {backup.encrypted && (
                        <View style={[styles.badge, { backgroundColor: '#10b98120' }]}>
                          <Ionicons name="lock-closed" size={12} color="#10b981" />
                          <Text variant="caption" style={{ color: '#10b981', marginLeft: BASE_UNIT }}>
                            Encrypted
                          </Text>
                        </View>
                      )}
                      {backup.verified && (
                        <View style={[styles.badge, { backgroundColor: '#667eea20' }]}>
                          <Ionicons name="checkmark-circle" size={12} color="#667eea" />
                          <Text variant="caption" style={{ color: '#667eea', marginLeft: BASE_UNIT }}>
                            Verified
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.historyActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#667eea20', flex: 1 }]}
                        onPress={() => {
                          handleHideHistory();
                          setTimeout(() => handleRestoreBackup(backup), 300);
                        }}
                      >
                        <Ionicons name="cloud-download-outline" size={16} color="#667eea" />
                        <Text variant="caption" style={{ color: '#667eea', marginLeft: BASE_UNIT }}>
                          Restore
                        </Text>
                      </TouchableOpacity>
                      {!backup.verified && (
                        <TouchableOpacity
                          style={[styles.actionButton, { backgroundColor: '#10b98120', flex: 1, marginLeft: BASE_UNIT * 2 }]}
                          onPress={() => {
                            handleHideHistory();
                            setTimeout(() => handleVerifyBackup(backup.id), 300);
                          }}
                        >
                          <Ionicons name="checkmark-circle-outline" size={16} color="#10b981" />
                          <Text variant="caption" style={{ color: '#10b981', marginLeft: BASE_UNIT }}>
                            Verify
                          </Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#ef444420', marginLeft: BASE_UNIT * 2 }]}
                        onPress={() => {
                          handleHideHistory();
                          setTimeout(() => handleDeleteBackup(backup.id), 300);
                        }}
                      >
                        <Ionicons name="trash-outline" size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </BlurView>
          ) : (
            <View style={[styles.panelContent, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.panelHeader}>
                <Text variant="h6" style={{ color: theme.colors.textPrimary }}>
                  Backup History
                </Text>
                <TouchableOpacity onPress={handleHideHistory}>
                  <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.panelScroll}>
                {backupHistory.map(backup => (
                  <View key={backup.id} style={[styles.historyItem, { backgroundColor: theme.colors.background }]}>
                    <View style={styles.historyHeader}>
                      <Ionicons name={getProviderIcon(backup.cloudProvider) as any} size={24} color={getProviderColor(backup.cloudProvider)} />
                      <View style={styles.historyInfo}>
                        <Text variant="body" style={{ color: theme.colors.textPrimary, fontWeight: '600' }}>
                          {backup.name}
                        </Text>
                        <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
                          {formatRelativeTime(backup.date)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.historyDetails}>
                      <View style={styles.historyDetailRow}>
                        <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
                          Size:
                        </Text>
                        <Text variant="caption" style={{ color: theme.colors.textPrimary }}>
                          {formatBytes(backup.size)}
                        </Text>
                      </View>
                      <View style={styles.historyDetailRow}>
                        <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
                          Transcripts:
                        </Text>
                        <Text variant="caption" style={{ color: theme.colors.textPrimary }}>
                          {backup.transcriptCount}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.historyActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#667eea20', flex: 1 }]}
                        onPress={() => {
                          handleHideHistory();
                          setTimeout(() => handleRestoreBackup(backup), 300);
                        }}
                      >
                        <Ionicons name="cloud-download-outline" size={16} color="#667eea" />
                        <Text variant="caption" style={{ color: '#667eea', marginLeft: BASE_UNIT }}>
                          Restore
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </Animated.View>
      )}

      {/* Storage Analytics Panel */}
      {showStoragePanel && (
        <Animated.View
          style={[
            styles.panel,
            {
              transform: [{ translateY: storageSlide }],
            },
          ]}
        >
          {Platform.OS === 'ios' ? (
            <BlurView intensity={blurIntensity.strong} tint="light" style={styles.panelContent}>
              <View style={styles.panelHeader}>
                <Text variant="h6" style={{ color: theme.colors.textPrimary }}>
                  Storage Usage
                </Text>
                <TouchableOpacity onPress={handleHideStorage}>
                  <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.panelScroll}>
                {/* Total Storage */}
                <View style={[styles.storageCard, { backgroundColor: theme.colors.surface }]}>
                  <Text variant="h3" style={{ color: theme.colors.textPrimary, fontWeight: '700' }}>
                    {formatBytes(storageBreakdown.total)}
                  </Text>
                  <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
                    Total Backup Size
                  </Text>
                </View>

                {/* Storage Breakdown */}
                <View style={[styles.storageBreakdown, { backgroundColor: theme.colors.surface }]}>
                  <Text variant="body" style={{ color: theme.colors.textPrimary, fontWeight: '600', marginBottom: BASE_UNIT * 3 }}>
                    Storage Breakdown
                  </Text>

                  {/* Transcripts */}
                  <View style={styles.storageItem}>
                    <View style={styles.storageItemHeader}>
                      <View style={styles.storageItemLabel}>
                        <View style={[styles.storageColorDot, { backgroundColor: '#667eea' }]} />
                        <Text variant="body" style={{ color: theme.colors.textPrimary }}>
                          Transcripts
                        </Text>
                      </View>
                      <Text variant="body" style={{ color: theme.colors.textPrimary, fontWeight: '600' }}>
                        {formatBytes(storageBreakdown.transcripts)}
                      </Text>
                    </View>
                    <View style={[styles.storageBar, { backgroundColor: theme.colors.border }]}>
                      <View
                        style={[
                          styles.storageBarFill,
                          {
                            width: `${(storageBreakdown.transcripts / storageBreakdown.total) * 100}%`,
                            backgroundColor: '#667eea',
                          },
                        ]}
                      />
                    </View>
                    <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
                      {Math.round((storageBreakdown.transcripts / storageBreakdown.total) * 100)}% of total
                    </Text>
                  </View>

                  {/* Audio */}
                  <View style={styles.storageItem}>
                    <View style={styles.storageItemHeader}>
                      <View style={styles.storageItemLabel}>
                        <View style={[styles.storageColorDot, { backgroundColor: '#10b981' }]} />
                        <Text variant="body" style={{ color: theme.colors.textPrimary }}>
                          Audio Files
                        </Text>
                      </View>
                      <Text variant="body" style={{ color: theme.colors.textPrimary, fontWeight: '600' }}>
                        {formatBytes(storageBreakdown.audio)}
                      </Text>
                    </View>
                    <View style={[styles.storageBar, { backgroundColor: theme.colors.border }]}>
                      <View
                        style={[
                          styles.storageBarFill,
                          {
                            width: `${(storageBreakdown.audio / storageBreakdown.total) * 100}%`,
                            backgroundColor: '#10b981',
                          },
                        ]}
                      />
                    </View>
                    <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
                      {Math.round((storageBreakdown.audio / storageBreakdown.total) * 100)}% of total
                    </Text>
                  </View>

                  {/* Settings */}
                  <View style={styles.storageItem}>
                    <View style={styles.storageItemHeader}>
                      <View style={styles.storageItemLabel}>
                        <View style={[styles.storageColorDot, { backgroundColor: '#f59e0b' }]} />
                        <Text variant="body" style={{ color: theme.colors.textPrimary }}>
                          Settings
                        </Text>
                      </View>
                      <Text variant="body" style={{ color: theme.colors.textPrimary, fontWeight: '600' }}>
                        {formatBytes(storageBreakdown.settings)}
                      </Text>
                    </View>
                    <View style={[styles.storageBar, { backgroundColor: theme.colors.border }]}>
                      <View
                        style={[
                          styles.storageBarFill,
                          {
                            width: `${(storageBreakdown.settings / storageBreakdown.total) * 100}%`,
                            backgroundColor: '#f59e0b',
                          },
                        ]}
                      />
                    </View>
                    <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
                      {Math.round((storageBreakdown.settings / storageBreakdown.total) * 100)}% of total
                    </Text>
                  </View>

                  {/* Cache */}
                  <View style={styles.storageItem}>
                    <View style={styles.storageItemHeader}>
                      <View style={styles.storageItemLabel}>
                        <View style={[styles.storageColorDot, { backgroundColor: '#ef4444' }]} />
                        <Text variant="body" style={{ color: theme.colors.textPrimary }}>
                          Cache
                        </Text>
                      </View>
                      <Text variant="body" style={{ color: theme.colors.textPrimary, fontWeight: '600' }}>
                        {formatBytes(storageBreakdown.cache)}
                      </Text>
                    </View>
                    <View style={[styles.storageBar, { backgroundColor: theme.colors.border }]}>
                      <View
                        style={[
                          styles.storageBarFill,
                          {
                            width: `${(storageBreakdown.cache / storageBreakdown.total) * 100}%`,
                            backgroundColor: '#ef4444',
                          },
                        ]}
                      />
                    </View>
                    <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
                      {Math.round((storageBreakdown.cache / storageBreakdown.total) * 100)}% of total
                    </Text>
                  </View>
                </View>
              </ScrollView>
            </BlurView>
          ) : (
            <View style={[styles.panelContent, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.panelHeader}>
                <Text variant="h6" style={{ color: theme.colors.textPrimary }}>
                  Storage Usage
                </Text>
                <TouchableOpacity onPress={handleHideStorage}>
                  <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.panelScroll}>
                <View style={[styles.storageCard, { backgroundColor: theme.colors.background }]}>
                  <Text variant="h3" style={{ color: theme.colors.textPrimary, fontWeight: '700' }}>
                    {formatBytes(storageBreakdown.total)}
                  </Text>
                  <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
                    Total Backup Size
                  </Text>
                </View>
              </ScrollView>
            </View>
          )}
        </Animated.View>
      )}

      {/* Encryption Settings Panel */}
      {showEncryptionPanel && (
        <Animated.View
          style={[
            styles.panel,
            {
              transform: [{ translateY: encryptionSlide }],
            },
          ]}
        >
          {Platform.OS === 'ios' ? (
            <BlurView intensity={blurIntensity.strong} tint="light" style={styles.panelContent}>
              <View style={styles.panelHeader}>
                <Text variant="h6" style={{ color: theme.colors.textPrimary }}>
                  Encryption Settings
                </Text>
                <TouchableOpacity onPress={handleHideEncryption}>
                  <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.panelScroll}>
                <View style={[styles.encryptionCard, { backgroundColor: theme.colors.surface }]}>
                  <Ionicons name="shield-checkmark" size={48} color="#667eea" />
                  <Text variant="body" style={{ color: theme.colors.textPrimary, marginTop: BASE_UNIT * 3, textAlign: 'center' }}>
                    Set a strong password to encrypt your backups. This password will be required to restore encrypted backups.
                  </Text>
                  <Text variant="caption" style={{ color: theme.colors.textSecondary, marginTop: BASE_UNIT * 2, textAlign: 'center' }}>
                    ⚠️ Keep this password safe. If you lose it, you won&apos;t be able to restore your backups.
                  </Text>

                  <TextInput
                    style={[
                      styles.passwordInput,
                      {
                        backgroundColor: theme.colors.background,
                        color: theme.colors.textPrimary,
                        borderColor: theme.colors.border,
                      },
                    ]}
                    placeholder="Enter encryption password"
                    placeholderTextColor={theme.colors.textSecondary}
                    secureTextEntry
                    value={encryptionPassword}
                    onChangeText={setEncryptionPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />

                  <TouchableOpacity
                    style={[
                      styles.savePasswordButton,
                      {
                        backgroundColor: encryptionPassword.length >= 8 ? '#667eea' : theme.colors.border,
                      },
                    ]}
                    onPress={handleSaveEncryptionPassword}
                    disabled={encryptionPassword.length < 8}
                  >
                    <Text variant="body" style={{ color: '#ffffff', fontWeight: '600' }}>
                      Save Password
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.passwordRequirements}>
                    <Text variant="caption" style={{ color: theme.colors.textSecondary, fontWeight: '600' }}>
                      Password Requirements:
                    </Text>
                    <View style={styles.requirementRow}>
                      <Ionicons
                        name={encryptionPassword.length >= 8 ? 'checkmark-circle' : 'ellipse-outline'}
                        size={16}
                        color={encryptionPassword.length >= 8 ? '#10b981' : theme.colors.textSecondary}
                      />
                      <Text variant="caption" style={{ color: theme.colors.textSecondary, marginLeft: BASE_UNIT }}>
                        At least 8 characters
                      </Text>
                    </View>
                  </View>
                </View>
              </ScrollView>
            </BlurView>
          ) : (
            <View style={[styles.panelContent, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.panelHeader}>
                <Text variant="h6" style={{ color: theme.colors.textPrimary }}>
                  Encryption Settings
                </Text>
                <TouchableOpacity onPress={handleHideEncryption}>
                  <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.panelScroll}>
                <View style={[styles.encryptionCard, { backgroundColor: theme.colors.background }]}>
                  <Ionicons name="shield-checkmark" size={48} color="#667eea" />
                  <Text variant="body" style={{ color: theme.colors.textPrimary, marginTop: BASE_UNIT * 3, textAlign: 'center' }}>
                    Set a strong password to encrypt your backups.
                  </Text>

                  <TextInput
                    style={[
                      styles.passwordInput,
                      {
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.textPrimary,
                        borderColor: theme.colors.border,
                      },
                    ]}
                    placeholder="Enter encryption password"
                    placeholderTextColor={theme.colors.textSecondary}
                    secureTextEntry
                    value={encryptionPassword}
                    onChangeText={setEncryptionPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />

                  <TouchableOpacity
                    style={[
                      styles.savePasswordButton,
                      {
                        backgroundColor: encryptionPassword.length >= 8 ? '#667eea' : theme.colors.border,
                      },
                    ]}
                    onPress={handleSaveEncryptionPassword}
                    disabled={encryptionPassword.length < 8}
                  >
                    <Text variant="body" style={{ color: '#ffffff', fontWeight: '600' }}>
                      Save Password
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          )}
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: BASE_UNIT * 4,
    paddingBottom: BASE_UNIT * 20,
  },
  section: {
    marginBottom: BASE_UNIT * 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: BASE_UNIT * 3,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: BASE_UNIT * 4,
  },
  statusTextContainer: {
    marginLeft: BASE_UNIT * 3,
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
  },
  progressContainer: {
    padding: BASE_UNIT * 4,
    paddingTop: 0,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: BASE_UNIT * 2,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  providerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: BASE_UNIT * 3,
  },
  providerChip: {
    flex: 1,
    minWidth: '45%',
    padding: BASE_UNIT * 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.xs,
  },
  settingCard: {
    borderRadius: 12,
    padding: BASE_UNIT * 4,
    ...elevation.xs,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  frequencyContainer: {
    marginTop: BASE_UNIT * 3,
  },
  frequencyLabel: {
    marginBottom: BASE_UNIT * 2,
  },
  frequencyGrid: {
    flexDirection: 'row',
    gap: BASE_UNIT * 2,
  },
  frequencyChip: {
    flex: 1,
    padding: BASE_UNIT * 3,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  encryptionGrid: {
    flexDirection: 'row',
    gap: BASE_UNIT * 3,
  },
  encryptionChip: {
    flex: 1,
    padding: BASE_UNIT * 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    ...elevation.xs,
  },
  encryptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: BASE_UNIT * 4,
    borderRadius: 12,
    marginTop: BASE_UNIT * 3,
    ...elevation.xs,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: BASE_UNIT * 3,
  },
  quickActionCard: {
    flex: 1,
    padding: BASE_UNIT * 4,
    borderRadius: 12,
    alignItems: 'center',
    ...elevation.xs,
  },
  quickActionTitle: {
    marginTop: BASE_UNIT * 2,
    fontWeight: '600',
  },
  backupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: BASE_UNIT * 4,
    borderRadius: 12,
    marginHorizontal: BASE_UNIT * 4,
    marginBottom: BASE_UNIT * 6,
    ...elevation.sm,
  },
  backupButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: BASE_UNIT * 2,
  },
  backupCard: {
    borderRadius: 12,
    padding: BASE_UNIT * 4,
    marginBottom: BASE_UNIT * 3,
    ...elevation.xs,
  },
  backupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: BASE_UNIT * 2,
  },
  backupInfo: {
    marginLeft: BASE_UNIT * 3,
    flex: 1,
  },
  backupBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: BASE_UNIT * 2,
    marginBottom: BASE_UNIT * 3,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: BASE_UNIT * 2,
    paddingVertical: BASE_UNIT,
    borderRadius: 6,
  },
  backupActions: {
    flexDirection: 'row',
    gap: BASE_UNIT * 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: BASE_UNIT * 3,
    paddingVertical: BASE_UNIT * 2,
    borderRadius: 8,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: BASE_UNIT * 3,
    marginTop: BASE_UNIT * 2,
  },
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    ...elevation.xl,
  },
  panelContent: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: BASE_UNIT * 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  panelScroll: {
    flex: 1,
    padding: BASE_UNIT * 4,
  },
  historyItem: {
    borderRadius: 12,
    padding: BASE_UNIT * 4,
    marginBottom: BASE_UNIT * 3,
    ...elevation.xs,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: BASE_UNIT * 3,
  },
  historyInfo: {
    marginLeft: BASE_UNIT * 3,
    flex: 1,
  },
  historyDetails: {
    marginBottom: BASE_UNIT * 3,
  },
  historyDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: BASE_UNIT,
  },
  historyBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: BASE_UNIT * 2,
    marginBottom: BASE_UNIT * 3,
  },
  historyActions: {
    flexDirection: 'row',
    gap: BASE_UNIT * 2,
  },
  storageCard: {
    borderRadius: 12,
    padding: BASE_UNIT * 6,
    alignItems: 'center',
    marginBottom: BASE_UNIT * 4,
    ...elevation.xs,
  },
  storageBreakdown: {
    borderRadius: 12,
    padding: BASE_UNIT * 4,
    ...elevation.xs,
  },
  storageItem: {
    marginBottom: BASE_UNIT * 4,
  },
  storageItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: BASE_UNIT * 2,
  },
  storageItemLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storageColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: BASE_UNIT * 2,
  },
  storageBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: BASE_UNIT,
  },
  storageBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  encryptionCard: {
    borderRadius: 12,
    padding: BASE_UNIT * 6,
    alignItems: 'center',
    ...elevation.xs,
  },
  passwordInput: {
    width: '100%',
    padding: BASE_UNIT * 3,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: BASE_UNIT * 4,
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  savePasswordButton: {
    width: '100%',
    padding: BASE_UNIT * 3,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: BASE_UNIT * 3,
  },
  passwordRequirements: {
    width: '100%',
    marginTop: BASE_UNIT * 4,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: BASE_UNIT * 2,
  },
});

