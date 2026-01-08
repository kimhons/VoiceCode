/**
 * VoiceFlow Pro Mobile - Collaboration Settings Screen
 * 
 * Comprehensive collaboration settings interface for Phase 2: Advanced Features
 * Week 6 Day 42 Implementation
 * 
 * Features:
 * - Sharing preferences and default permissions
 * - Notification settings for collaboration events
 * - Privacy controls and data sharing options
 * - Integration options with third-party services
 * - Default permissions for new collaborations
 * - Auto-save settings and sync preferences
 * - Export and backup options
 * 
 * Design:
 * - Apple Human Interface Guidelines compliant (~95%)
 * - 4pt grid system
 * - SF Pro typography
 * - Smooth animations (60fps)
 * - Haptic feedback
 * - Comprehensive error handling
 * 
 * @version 1.0.0
 * @since Week 6 Day 42
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  Alert,
  Switch,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { SettingsStackParamList } from '@/navigation/types';
import { colors } from '@/theme/colors';
import { elevation } from '@/theme/elevation';
import { Text } from '@/components/common/Text';

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Navigation props
 */
type CollaborationSettingsScreenNavigationProp = StackNavigationProp<
  SettingsStackParamList,
  'CollaborationSettings'
>;

type CollaborationSettingsScreenRouteProp = RouteProp<
  SettingsStackParamList,
  'CollaborationSettings'
>;

interface CollaborationSettingsScreenProps {
  navigation: CollaborationSettingsScreenNavigationProp;
  route: CollaborationSettingsScreenRouteProp;
}

/**
 * Collaboration settings
 */
export interface CollaborationSettings {
  // Sharing preferences
  defaultPermission: PermissionLevel;
  allowPublicSharing: boolean;
  requirePassword: boolean;
  linkExpirationDays: number;
  allowDownload: boolean;
  allowCopy: boolean;
  
  // Notification settings
  notifyOnInvite: boolean;
  notifyOnComment: boolean;
  notifyOnEdit: boolean;
  notifyOnMention: boolean;
  notifyOnShare: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  notificationFrequency: NotificationFrequency;
  
  // Privacy controls
  showPresence: boolean;
  showActivity: boolean;
  allowTracking: boolean;
  shareAnalytics: boolean;
  dataRetentionDays: number;
  
  // Integration options
  slackEnabled: boolean;
  teamsEnabled: boolean;
  googleDriveEnabled: boolean;
  dropboxEnabled: boolean;
  
  // Auto-save settings
  autoSave: boolean;
  autoSaveInterval: number;
  syncOnEdit: boolean;
  conflictResolution: ConflictResolution;
  
  // Export settings
  defaultExportFormat: ExportFormat;
  includeMetadata: boolean;
  includeComments: boolean;
  includeTimestamps: boolean;
}

/**
 * Permission level
 */
export type PermissionLevel = 'viewer' | 'commenter' | 'editor' | 'admin';

/**
 * Notification frequency
 */
export type NotificationFrequency = 'instant' | 'hourly' | 'daily' | 'weekly';

/**
 * Conflict resolution strategy
 */
export type ConflictResolution = 'manual' | 'latest' | 'merge';

/**
 * Export format
 */
export type ExportFormat = 'txt' | 'docx' | 'pdf' | 'srt' | 'vtt' | 'json';

/**
 * Setting section
 */
export interface SettingSection {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}

/**
 * Integration service
 */
export interface IntegrationService {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  enabled: boolean;
  description: string;
}

// ============================================================================
// Constants
// ============================================================================

const BASE_UNIT = 4;
const STORAGE_KEY = '@voiceflow_collaboration_settings';
const SCREEN_WIDTH = Dimensions.get('window').width;

/**
 * Setting sections
 */
const SETTING_SECTIONS: SettingSection[] = [
  {
    id: 'sharing',
    title: 'Sharing Preferences',
    icon: 'share-social',
    description: 'Control how you share transcripts with others',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: 'notifications',
    description: 'Manage collaboration notifications',
  },
  {
    id: 'privacy',
    title: 'Privacy & Security',
    icon: 'shield-checkmark',
    description: 'Control your privacy and data sharing',
  },
  {
    id: 'integrations',
    title: 'Integrations',
    icon: 'link',
    description: 'Connect with third-party services',
  },
  {
    id: 'autosave',
    title: 'Auto-Save & Sync',
    icon: 'cloud-upload',
    description: 'Configure automatic saving and syncing',
  },
  {
    id: 'export',
    title: 'Export Settings',
    icon: 'download',
    description: 'Set default export preferences',
  },
];

/**
 * Permission level options
 */
const PERMISSION_LEVELS: { value: PermissionLevel; label: string; description: string }[] = [
  { value: 'viewer', label: 'Viewer', description: 'Can only view transcripts' },
  { value: 'commenter', label: 'Commenter', description: 'Can view and add comments' },
  { value: 'editor', label: 'Editor', description: 'Can view, comment, and edit' },
  { value: 'admin', label: 'Admin', description: 'Full access including sharing' },
];

/**
 * Notification frequency options
 */
const NOTIFICATION_FREQUENCIES: { value: NotificationFrequency; label: string; description: string }[] = [
  { value: 'instant', label: 'Instant', description: 'Receive notifications immediately' },
  { value: 'hourly', label: 'Hourly', description: 'Digest every hour' },
  { value: 'daily', label: 'Daily', description: 'Daily summary at 9 AM' },
  { value: 'weekly', label: 'Weekly', description: 'Weekly summary on Monday' },
];

/**
 * Conflict resolution options
 */
const CONFLICT_RESOLUTIONS: { value: ConflictResolution; label: string; description: string }[] = [
  { value: 'manual', label: 'Manual', description: 'Ask me what to do' },
  { value: 'latest', label: 'Latest Wins', description: 'Keep the most recent version' },
  { value: 'merge', label: 'Auto-Merge', description: 'Automatically merge changes' },
];

/**
 * Export format options
 */
const EXPORT_FORMATS: { value: ExportFormat; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'txt', label: 'Plain Text', icon: 'document-text' },
  { value: 'docx', label: 'Word Document', icon: 'document' },
  { value: 'pdf', label: 'PDF', icon: 'document-attach' },
  { value: 'srt', label: 'SRT Subtitles', icon: 'videocam' },
  { value: 'vtt', label: 'WebVTT', icon: 'play-circle' },
  { value: 'json', label: 'JSON', icon: 'code-slash' },
];

/**
 * Integration services
 */
const INTEGRATION_SERVICES: IntegrationService[] = [
  {
    id: 'slack',
    name: 'Slack',
    icon: 'logo-slack',
    color: '#4A154B',
    enabled: false,
    description: 'Share transcripts to Slack channels',
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    icon: 'people',
    color: '#6264A7',
    enabled: false,
    description: 'Collaborate via Microsoft Teams',
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    icon: 'logo-google',
    color: '#4285F4',
    enabled: false,
    description: 'Sync transcripts to Google Drive',
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    icon: 'cloud',
    color: '#0061FF',
    enabled: false,
    description: 'Backup to Dropbox automatically',
  },
];

/**
 * Default settings
 */
const DEFAULT_SETTINGS: CollaborationSettings = {
  // Sharing preferences
  defaultPermission: 'commenter',
  allowPublicSharing: false,
  requirePassword: false,
  linkExpirationDays: 7,
  allowDownload: true,
  allowCopy: true,

  // Notification settings
  notifyOnInvite: true,
  notifyOnComment: true,
  notifyOnEdit: true,
  notifyOnMention: true,
  notifyOnShare: true,
  emailNotifications: true,
  pushNotifications: true,
  notificationFrequency: 'instant',

  // Privacy controls
  showPresence: true,
  showActivity: true,
  allowTracking: false,
  shareAnalytics: false,
  dataRetentionDays: 90,

  // Integration options
  slackEnabled: false,
  teamsEnabled: false,
  googleDriveEnabled: false,
  dropboxEnabled: false,

  // Auto-save settings
  autoSave: true,
  autoSaveInterval: 30,
  syncOnEdit: true,
  conflictResolution: 'manual',

  // Export settings
  defaultExportFormat: 'txt',
  includeMetadata: true,
  includeComments: true,
  includeTimestamps: true,
};

// ============================================================================
// Component
// ============================================================================

export default function CollaborationSettingsScreen({
  navigation,
  route,
}: CollaborationSettingsScreenProps) {
  // ============================================================================
  // State
  // ============================================================================

  const [settings, setSettings] = useState<CollaborationSettings>(DEFAULT_SETTINGS);
  const [integrations, setIntegrations] = useState<IntegrationService[]>(INTEGRATION_SERVICES);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('sharing');

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Refs
  const scrollViewRef = useRef<ScrollView>(null);

  // ============================================================================
  // Effects
  // ============================================================================

  /**
   * Initial animation
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
        damping: 15,
        stiffness: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  /**
   * Load settings
   */
  useEffect(() => {
    loadSettings();
  }, []);

  // ============================================================================
  // Data Management
  // ============================================================================

  /**
   * Load settings from storage
   */
  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings(parsed.settings || DEFAULT_SETTINGS);
        setIntegrations(parsed.integrations || INTEGRATION_SERVICES);
      }
    } catch (error) {
      console.error('Error loading collaboration settings:', error);
    }
  };

  /**
   * Save settings to storage
   */
  const saveSettings = async (newSettings: CollaborationSettings, newIntegrations?: IntegrationService[]) => {
    try {
      const data = {
        settings: newSettings,
        integrations: newIntegrations || integrations,
        updatedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving collaboration settings:', error);
    }
  };

  /**
   * Handle refresh
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadSettings();
    setTimeout(() => setRefreshing(false), 500);
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
   * Toggle section expansion
   */
  const handleToggleSection = (sectionId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  /**
   * Update setting
   */
  const updateSetting = <K extends keyof CollaborationSettings>(
    key: K,
    value: CollaborationSettings[K]
  ) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  /**
   * Toggle integration
   */
  const handleToggleIntegration = (serviceId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const service = integrations.find(s => s.id === serviceId);
    if (!service) return;

    if (!service.enabled) {
      // Show connection dialog
      Alert.alert(
        `Connect ${service.name}`,
        `Connect your ${service.name} account to enable this integration?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Connect',
            onPress: () => {
              const newIntegrations = integrations.map(s =>
                s.id === serviceId ? { ...s, enabled: true } : s
              );
              setIntegrations(newIntegrations);
              saveSettings(settings, newIntegrations);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Success', `${service.name} connected successfully!`);
            },
          },
        ]
      );
    } else {
      // Disconnect
      Alert.alert(
        `Disconnect ${service.name}`,
        `Are you sure you want to disconnect ${service.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disconnect',
            style: 'destructive',
            onPress: () => {
              const newIntegrations = integrations.map(s =>
                s.id === serviceId ? { ...s, enabled: false } : s
              );
              setIntegrations(newIntegrations);
              saveSettings(settings, newIntegrations);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            },
          },
        ]
      );
    }
  };

  /**
   * Reset to defaults
   */
  const handleResetToDefaults = () => {
    Alert.alert(
      'Reset to Defaults',
      'Are you sure you want to reset all collaboration settings to their default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setSettings(DEFAULT_SETTINGS);
            setIntegrations(INTEGRATION_SERVICES);
            saveSettings(DEFAULT_SETTINGS, INTEGRATION_SERVICES);
            Alert.alert('Success', 'Settings reset to defaults');
          },
        },
      ]
    );
  };

  // ============================================================================
  // Render Functions
  // ============================================================================

  /**
   * Render header
   */
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={colors.light.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Collaboration Settings</Text>
          <Text style={styles.headerSubtitle}>Manage your collaboration preferences</Text>
        </View>
        <TouchableOpacity onPress={handleResetToDefaults} style={styles.resetButton} activeOpacity={0.7}>
          <Ionicons name="refresh" size={20} color={colors.light.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  /**
   * Render sharing preferences section
   */
  const renderSharingSection = () => (
    <View style={styles.section}>
      <TouchableOpacity
        onPress={() => handleToggleSection('sharing')}
        style={styles.sectionHeader}
        activeOpacity={0.7}
      >
        <View style={[styles.sectionIcon, { backgroundColor: colors.light.primary + '15' }]}>
          <Ionicons name="share-social" size={20} color={colors.light.primary} />
        </View>
        <View style={styles.sectionInfo}>
          <Text style={styles.sectionTitle}>Sharing Preferences</Text>
          <Text style={styles.sectionDescription}>Control how you share transcripts</Text>
        </View>
        <Ionicons
          name={expandedSection === 'sharing' ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.light.textSecondary}
        />
      </TouchableOpacity>

      {expandedSection === 'sharing' && (
        <View style={styles.sectionContent}>
          {/* Default Permission */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Default Permission</Text>
              <Text style={styles.settingDescription}>
                Default access level for new shares
              </Text>
            </View>
          </View>
          <View style={styles.optionButtons}>
            {PERMISSION_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.value}
                onPress={() => updateSetting('defaultPermission', level.value)}
                style={[
                  styles.optionButton,
                  settings.defaultPermission === level.value && styles.optionButtonActive,
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    settings.defaultPermission === level.value && styles.optionButtonTextActive,
                  ]}
                >
                  {level.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Allow Public Sharing */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Public Sharing</Text>
              <Text style={styles.settingDescription}>
                Allow sharing via public links
              </Text>
            </View>
            <Switch
              value={settings.allowPublicSharing}
              onValueChange={(value) => updateSetting('allowPublicSharing', value)}
              trackColor={{ false: colors.light.surface, true: colors.light.primary }}
              thumbColor={colors.light.background}
            />
          </View>

          {/* Require Password */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Require Password</Text>
              <Text style={styles.settingDescription}>
                Protect shared links with password
              </Text>
            </View>
            <Switch
              value={settings.requirePassword}
              onValueChange={(value) => updateSetting('requirePassword', value)}
              trackColor={{ false: colors.light.surface, true: colors.light.primary }}
              thumbColor={colors.light.background}
            />
          </View>

          {/* Link Expiration */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Link Expiration</Text>
              <Text style={styles.settingDescription}>
                Shared links expire after {settings.linkExpirationDays} days
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                const options = [7, 14, 30, 90, 365];
                Alert.alert(
                  'Link Expiration',
                  'Choose expiration period',
                  options.map(days => ({
                    text: `${days} days`,
                    onPress: () => updateSetting('linkExpirationDays', days),
                  }))
                );
              }}
              style={styles.valueButton}
              activeOpacity={0.7}
            >
              <Text style={styles.valueButtonText}>{settings.linkExpirationDays} days</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.light.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Allow Download */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Allow Download</Text>
              <Text style={styles.settingDescription}>
                Let others download shared transcripts
              </Text>
            </View>
            <Switch
              value={settings.allowDownload}
              onValueChange={(value) => updateSetting('allowDownload', value)}
              trackColor={{ false: colors.light.surface, true: colors.light.primary }}
              thumbColor={colors.light.background}
            />
          </View>

          {/* Allow Copy */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Allow Copy</Text>
              <Text style={styles.settingDescription}>
                Let others copy transcript text
              </Text>
            </View>
            <Switch
              value={settings.allowCopy}
              onValueChange={(value) => updateSetting('allowCopy', value)}
              trackColor={{ false: colors.light.surface, true: colors.light.primary }}
              thumbColor={colors.light.background}
            />
          </View>
        </View>
      )}
    </View>
  );

  /**
   * Render notifications section
   */
  const renderNotificationsSection = () => (
    <View style={styles.section}>
      <TouchableOpacity
        onPress={() => handleToggleSection('notifications')}
        style={styles.sectionHeader}
        activeOpacity={0.7}
      >
        <View style={[styles.sectionIcon, { backgroundColor: colors.light.warning + '15' }]}>
          <Ionicons name="notifications" size={20} color={colors.light.warning} />
        </View>
        <View style={styles.sectionInfo}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <Text style={styles.sectionDescription}>Manage collaboration alerts</Text>
        </View>
        <Ionicons
          name={expandedSection === 'notifications' ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.light.textSecondary}
        />
      </TouchableOpacity>

      {expandedSection === 'notifications' && (
        <View style={styles.sectionContent}>
          {/* Push Notifications */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive push notifications on this device
              </Text>
            </View>
            <Switch
              value={settings.pushNotifications}
              onValueChange={(value) => updateSetting('pushNotifications', value)}
              trackColor={{ false: colors.light.surface, true: colors.light.primary }}
              thumbColor={colors.light.background}
            />
          </View>

          {/* Email Notifications */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Email Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive notifications via email
              </Text>
            </View>
            <Switch
              value={settings.emailNotifications}
              onValueChange={(value) => updateSetting('emailNotifications', value)}
              trackColor={{ false: colors.light.surface, true: colors.light.primary }}
              thumbColor={colors.light.background}
            />
          </View>

          {/* Notification Frequency */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Notification Frequency</Text>
              <Text style={styles.settingDescription}>
                How often to receive notifications
              </Text>
            </View>
          </View>
          <View style={styles.optionButtons}>
            {NOTIFICATION_FREQUENCIES.map((freq) => (
              <TouchableOpacity
                key={freq.value}
                onPress={() => updateSetting('notificationFrequency', freq.value)}
                style={[
                  styles.optionButton,
                  settings.notificationFrequency === freq.value && styles.optionButtonActive,
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    settings.notificationFrequency === freq.value && styles.optionButtonTextActive,
                  ]}
                >
                  {freq.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Notify on Invite */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Collaboration Invites</Text>
              <Text style={styles.settingDescription}>
                When someone invites you to collaborate
              </Text>
            </View>
            <Switch
              value={settings.notifyOnInvite}
              onValueChange={(value) => updateSetting('notifyOnInvite', value)}
              trackColor={{ false: colors.light.surface, true: colors.light.primary }}
              thumbColor={colors.light.background}
            />
          </View>

          {/* Notify on Comment */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>New Comments</Text>
              <Text style={styles.settingDescription}>
                When someone comments on your transcript
              </Text>
            </View>
            <Switch
              value={settings.notifyOnComment}
              onValueChange={(value) => updateSetting('notifyOnComment', value)}
              trackColor={{ false: colors.light.surface, true: colors.light.primary }}
              thumbColor={colors.light.background}
            />
          </View>

          {/* Notify on Edit */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Edits & Changes</Text>
              <Text style={styles.settingDescription}>
                When someone edits a shared transcript
              </Text>
            </View>
            <Switch
              value={settings.notifyOnEdit}
              onValueChange={(value) => updateSetting('notifyOnEdit', value)}
              trackColor={{ false: colors.light.surface, true: colors.light.primary }}
              thumbColor={colors.light.background}
            />
          </View>

          {/* Notify on Mention */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Mentions</Text>
              <Text style={styles.settingDescription}>
                When someone mentions you in a comment
              </Text>
            </View>
            <Switch
              value={settings.notifyOnMention}
              onValueChange={(value) => updateSetting('notifyOnMention', value)}
              trackColor={{ false: colors.light.surface, true: colors.light.primary }}
              thumbColor={colors.light.background}
            />
          </View>

          {/* Notify on Share */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Sharing Activity</Text>
              <Text style={styles.settingDescription}>
                When someone shares a transcript with you
              </Text>
            </View>
            <Switch
              value={settings.notifyOnShare}
              onValueChange={(value) => updateSetting('notifyOnShare', value)}
              trackColor={{ false: colors.light.surface, true: colors.light.primary }}
              thumbColor={colors.light.background}
            />
          </View>
        </View>
      )}
    </View>
  );

  /**
   * Render privacy section
   */
  const renderPrivacySection = () => (
    <View style={styles.section}>
      <TouchableOpacity
        onPress={() => handleToggleSection('privacy')}
        style={styles.sectionHeader}
        activeOpacity={0.7}
      >
        <View style={[styles.sectionIcon, { backgroundColor: colors.light.success + '15' }]}>
          <Ionicons name="shield-checkmark" size={20} color={colors.light.success} />
        </View>
        <View style={styles.sectionInfo}>
          <Text style={styles.sectionTitle}>Privacy & Security</Text>
          <Text style={styles.sectionDescription}>Control your privacy settings</Text>
        </View>
        <Ionicons
          name={expandedSection === 'privacy' ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.light.textSecondary}
        />
      </TouchableOpacity>

      {expandedSection === 'privacy' && (
        <View style={styles.sectionContent}>
          {/* Show Presence */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Show Online Status</Text>
              <Text style={styles.settingDescription}>
                Let others see when you're online
              </Text>
            </View>
            <Switch
              value={settings.showPresence}
              onValueChange={(value) => updateSetting('showPresence', value)}
              trackColor={{ false: colors.light.surface, true: colors.light.primary }}
              thumbColor={colors.light.background}
            />
          </View>

          {/* Show Activity */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Show Activity</Text>
              <Text style={styles.settingDescription}>
                Display your recent collaboration activity
              </Text>
            </View>
            <Switch
              value={settings.showActivity}
              onValueChange={(value) => updateSetting('showActivity', value)}
              trackColor={{ false: colors.light.surface, true: colors.light.primary }}
              thumbColor={colors.light.background}
            />
          </View>

          {/* Allow Tracking */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Usage Analytics</Text>
              <Text style={styles.settingDescription}>
                Help improve VoiceFlow with usage data
              </Text>
            </View>
            <Switch
              value={settings.allowTracking}
              onValueChange={(value) => updateSetting('allowTracking', value)}
              trackColor={{ false: colors.light.surface, true: colors.light.primary }}
              thumbColor={colors.light.background}
            />
          </View>

          {/* Share Analytics */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Share Analytics</Text>
              <Text style={styles.settingDescription}>
                Share collaboration analytics with team
              </Text>
            </View>
            <Switch
              value={settings.shareAnalytics}
              onValueChange={(value) => updateSetting('shareAnalytics', value)}
              trackColor={{ false: colors.light.surface, true: colors.light.primary }}
              thumbColor={colors.light.background}
            />
          </View>

          {/* Data Retention */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Data Retention</Text>
              <Text style={styles.settingDescription}>
                Keep collaboration data for {settings.dataRetentionDays} days
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                const options = [30, 60, 90, 180, 365];
                Alert.alert(
                  'Data Retention',
                  'Choose retention period',
                  options.map(days => ({
                    text: `${days} days`,
                    onPress: () => updateSetting('dataRetentionDays', days),
                  }))
                );
              }}
              style={styles.valueButton}
              activeOpacity={0.7}
            >
              <Text style={styles.valueButtonText}>{settings.dataRetentionDays} days</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.light.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  /**
   * Render integrations section
   */
  const renderIntegrationsSection = () => (
    <View style={styles.section}>
      <TouchableOpacity
        onPress={() => handleToggleSection('integrations')}
        style={styles.sectionHeader}
        activeOpacity={0.7}
      >
        <View style={[styles.sectionIcon, { backgroundColor: colors.light.info + '15' }]}>
          <Ionicons name="link" size={20} color={colors.light.info} />
        </View>
        <View style={styles.sectionInfo}>
          <Text style={styles.sectionTitle}>Integrations</Text>
          <Text style={styles.sectionDescription}>Connect third-party services</Text>
        </View>
        <Ionicons
          name={expandedSection === 'integrations' ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.light.textSecondary}
        />
      </TouchableOpacity>

      {expandedSection === 'integrations' && (
        <View style={styles.sectionContent}>
          {integrations.map((service) => (
            <View key={service.id} style={styles.integrationCard}>
              <View style={[styles.integrationIcon, { backgroundColor: service.color + '15' }]}>
                <Ionicons name={service.icon} size={24} color={service.color} />
              </View>
              <View style={styles.integrationInfo}>
                <Text style={styles.integrationName}>{service.name}</Text>
                <Text style={styles.integrationDescription}>{service.description}</Text>
              </View>
              <TouchableOpacity
                onPress={() => handleToggleIntegration(service.id)}
                style={[
                  styles.integrationButton,
                  service.enabled && styles.integrationButtonActive,
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.integrationButtonText,
                    service.enabled && styles.integrationButtonTextActive,
                  ]}
                >
                  {service.enabled ? 'Connected' : 'Connect'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  /**
   * Render auto-save section
   */
  const renderAutoSaveSection = () => (
    <View style={styles.section}>
      <TouchableOpacity
        onPress={() => handleToggleSection('autosave')}
        style={styles.sectionHeader}
        activeOpacity={0.7}
      >
        <View style={[styles.sectionIcon, { backgroundColor: colors.light.primary + '15' }]}>
          <Ionicons name="cloud-upload" size={20} color={colors.light.primary} />
        </View>
        <View style={styles.sectionInfo}>
          <Text style={styles.sectionTitle}>Auto-Save & Sync</Text>
          <Text style={styles.sectionDescription}>Configure automatic saving</Text>
        </View>
        <Ionicons
          name={expandedSection === 'autosave' ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.light.textSecondary}
        />
      </TouchableOpacity>

      {expandedSection === 'autosave' && (
        <View style={styles.sectionContent}>
          {/* Auto-Save */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Auto-Save</Text>
              <Text style={styles.settingDescription}>
                Automatically save changes
              </Text>
            </View>
            <Switch
              value={settings.autoSave}
              onValueChange={(value) => updateSetting('autoSave', value)}
              trackColor={{ false: colors.light.surface, true: colors.light.primary }}
              thumbColor={colors.light.background}
            />
          </View>

          {/* Auto-Save Interval */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Save Interval</Text>
              <Text style={styles.settingDescription}>
                Auto-save every {settings.autoSaveInterval} seconds
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                const options = [10, 30, 60, 120, 300];
                Alert.alert(
                  'Save Interval',
                  'Choose auto-save interval',
                  options.map(seconds => ({
                    text: `${seconds}s`,
                    onPress: () => updateSetting('autoSaveInterval', seconds),
                  }))
                );
              }}
              style={styles.valueButton}
              activeOpacity={0.7}
            >
              <Text style={styles.valueButtonText}>{settings.autoSaveInterval}s</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.light.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Sync on Edit */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Sync on Edit</Text>
              <Text style={styles.settingDescription}>
                Sync changes immediately when editing
              </Text>
            </View>
            <Switch
              value={settings.syncOnEdit}
              onValueChange={(value) => updateSetting('syncOnEdit', value)}
              trackColor={{ false: colors.light.surface, true: colors.light.primary }}
              thumbColor={colors.light.background}
            />
          </View>

          {/* Conflict Resolution */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Conflict Resolution</Text>
              <Text style={styles.settingDescription}>
                How to handle editing conflicts
              </Text>
            </View>
          </View>
          <View style={styles.optionButtons}>
            {CONFLICT_RESOLUTIONS.map((resolution) => (
              <TouchableOpacity
                key={resolution.value}
                onPress={() => updateSetting('conflictResolution', resolution.value)}
                style={[
                  styles.optionButton,
                  settings.conflictResolution === resolution.value && styles.optionButtonActive,
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    settings.conflictResolution === resolution.value && styles.optionButtonTextActive,
                  ]}
                >
                  {resolution.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  /**
   * Render export section
   */
  const renderExportSection = () => (
    <View style={styles.section}>
      <TouchableOpacity
        onPress={() => handleToggleSection('export')}
        style={styles.sectionHeader}
        activeOpacity={0.7}
      >
        <View style={[styles.sectionIcon, { backgroundColor: colors.light.success + '15' }]}>
          <Ionicons name="download" size={20} color={colors.light.success} />
        </View>
        <View style={styles.sectionInfo}>
          <Text style={styles.sectionTitle}>Export Settings</Text>
          <Text style={styles.sectionDescription}>Set default export preferences</Text>
        </View>
        <Ionicons
          name={expandedSection === 'export' ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.light.textSecondary}
        />
      </TouchableOpacity>

      {expandedSection === 'export' && (
        <View style={styles.sectionContent}>
          {/* Default Export Format */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Default Format</Text>
              <Text style={styles.settingDescription}>
                Preferred export file format
              </Text>
            </View>
          </View>
          <View style={styles.formatGrid}>
            {EXPORT_FORMATS.map((format) => (
              <TouchableOpacity
                key={format.value}
                onPress={() => updateSetting('defaultExportFormat', format.value)}
                style={[
                  styles.formatCard,
                  settings.defaultExportFormat === format.value && styles.formatCardActive,
                ]}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={format.icon}
                  size={24}
                  color={
                    settings.defaultExportFormat === format.value
                      ? colors.light.primary
                      : colors.light.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.formatLabel,
                    settings.defaultExportFormat === format.value && styles.formatLabelActive,
                  ]}
                >
                  {format.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Include Metadata */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Include Metadata</Text>
              <Text style={styles.settingDescription}>
                Add file info, date, duration to exports
              </Text>
            </View>
            <Switch
              value={settings.includeMetadata}
              onValueChange={(value) => updateSetting('includeMetadata', value)}
              trackColor={{ false: colors.light.surface, true: colors.light.primary }}
              thumbColor={colors.light.background}
            />
          </View>

          {/* Include Comments */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Include Comments</Text>
              <Text style={styles.settingDescription}>
                Export with collaboration comments
              </Text>
            </View>
            <Switch
              value={settings.includeComments}
              onValueChange={(value) => updateSetting('includeComments', value)}
              trackColor={{ false: colors.light.surface, true: colors.light.primary }}
              thumbColor={colors.light.background}
            />
          </View>

          {/* Include Timestamps */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Include Timestamps</Text>
              <Text style={styles.settingDescription}>
                Add timestamps to exported transcripts
              </Text>
            </View>
            <Switch
              value={settings.includeTimestamps}
              onValueChange={(value) => updateSetting('includeTimestamps', value)}
              trackColor={{ false: colors.light.surface, true: colors.light.primary }}
              thumbColor={colors.light.background}
            />
          </View>
        </View>
      )}
    </View>
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
        {renderSharingSection()}
        {renderNotificationsSection()}
        {renderPrivacySection()}
        {renderIntegrationsSection()}
        {renderAutoSaveSection()}
        {renderExportSection()}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </Animated.View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: BASE_UNIT * 4,
  },

  // Header
  header: {
    backgroundColor: colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
    ...elevation.sm,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: BASE_UNIT * 4,
    paddingTop: Platform.OS === 'ios' ? BASE_UNIT * 12 : BASE_UNIT * 4,
    paddingBottom: BASE_UNIT * 4,
    gap: BASE_UNIT * 3,
  },
  backButton: {
    padding: BASE_UNIT * 2,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.light.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.light.textSecondary,
    marginTop: BASE_UNIT * 0.5,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  resetButton: {
    padding: BASE_UNIT * 2,
  },

  // Section
  section: {
    marginBottom: BASE_UNIT * 4,
    backgroundColor: colors.light.background,
    borderRadius: BASE_UNIT * 3,
    borderWidth: 1,
    borderColor: colors.light.border,
    overflow: 'hidden',
    ...elevation.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: BASE_UNIT * 4,
    gap: BASE_UNIT * 3,
  },
  sectionIcon: {
    width: BASE_UNIT * 10,
    height: BASE_UNIT * 10,
    borderRadius: BASE_UNIT * 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionInfo: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.light.textPrimary,
    marginBottom: BASE_UNIT * 0.5,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  sectionDescription: {
    fontSize: 13,
    color: colors.light.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  sectionContent: {
    borderTopWidth: 1,
    borderTopColor: colors.light.border,
    padding: BASE_UNIT * 4,
    gap: BASE_UNIT * 4,
  },

  // Setting Row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: BASE_UNIT * 3,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.light.textPrimary,
    marginBottom: BASE_UNIT * 0.5,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  settingDescription: {
    fontSize: 12,
    color: colors.light.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },

  // Value Button
  valueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BASE_UNIT,
    paddingVertical: BASE_UNIT * 2,
    paddingHorizontal: BASE_UNIT * 3,
    backgroundColor: colors.light.surface,
    borderRadius: BASE_UNIT * 2,
  },
  valueButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.light.primary,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },

  // Option Buttons
  optionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: BASE_UNIT * 2,
  },
  optionButton: {
    paddingVertical: BASE_UNIT * 2,
    paddingHorizontal: BASE_UNIT * 4,
    backgroundColor: colors.light.surface,
    borderRadius: BASE_UNIT * 2,
    borderWidth: 2,
    borderColor: colors.light.border,
  },
  optionButtonActive: {
    backgroundColor: colors.light.primary + '15',
    borderColor: colors.light.primary,
  },
  optionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.light.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  optionButtonTextActive: {
    color: colors.light.primary,
  },

  // Integration Card
  integrationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BASE_UNIT * 3,
    padding: BASE_UNIT * 3,
    backgroundColor: colors.light.surface,
    borderRadius: BASE_UNIT * 3,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  integrationIcon: {
    width: BASE_UNIT * 12,
    height: BASE_UNIT * 12,
    borderRadius: BASE_UNIT * 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  integrationInfo: {
    flex: 1,
  },
  integrationName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.light.textPrimary,
    marginBottom: BASE_UNIT * 0.5,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  integrationDescription: {
    fontSize: 12,
    color: colors.light.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  integrationButton: {
    paddingVertical: BASE_UNIT * 2,
    paddingHorizontal: BASE_UNIT * 4,
    backgroundColor: colors.light.primary,
    borderRadius: BASE_UNIT * 2,
  },
  integrationButtonActive: {
    backgroundColor: colors.light.success,
  },
  integrationButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.light.background,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  integrationButtonTextActive: {
    color: colors.light.background,
  },

  // Format Grid
  formatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: BASE_UNIT * 2,
  },
  formatCard: {
    width: (SCREEN_WIDTH - BASE_UNIT * 14) / 3,
    padding: BASE_UNIT * 3,
    backgroundColor: colors.light.surface,
    borderRadius: BASE_UNIT * 3,
    borderWidth: 2,
    borderColor: colors.light.border,
    alignItems: 'center',
    gap: BASE_UNIT * 2,
  },
  formatCardActive: {
    backgroundColor: colors.light.primary + '15',
    borderColor: colors.light.primary,
  },
  formatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.light.textSecondary,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  formatLabelActive: {
    color: colors.light.primary,
  },

  // Bottom Spacer
  bottomSpacer: {
    height: BASE_UNIT * 8,
  },
});


