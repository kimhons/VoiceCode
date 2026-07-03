// VoiceCode Mobile - Sync Settings Screen

import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppSelector, useAppDispatch } from '../../store';
import { updateSyncSettings } from '../../store/slices/settingsSlice';
import { Text, Card, Button } from '../../components/common';

type ConflictStrategy = 'newest' | 'local' | 'remote';

const CONFLICT_OPTIONS: { value: ConflictStrategy; label: string }[] = [
  { value: 'newest', label: 'Newest Wins' },
  { value: 'local', label: 'Keep Local' },
  { value: 'remote', label: 'Keep Remote' },
];

const formatLastSynced = (date: Date | null): string => {
  if (!date) return 'Last synced: never';
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return 'Last synced: just now';
  if (minutes === 1) return 'Last synced: 1 minute ago';
  return `Last synced: ${minutes} minutes ago`;
};

export const SyncSettingsScreen: React.FC = () => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { sync } = useAppSelector(state => state.settings);

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date>(() => new Date());
  const [pendingChanges, setPendingChanges] = useState(3);
  const [conflictStrategy, setConflictStrategy] = useState<ConflictStrategy>('newest');
  const [showConflictOptions, setShowConflictOptions] = useState(false);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
  }, []);

  const handleSyncNow = () => {
    setIsSyncing(true);
    syncTimer.current = setTimeout(() => {
      setIsSyncing(false);
      setLastSynced(new Date());
      setPendingChanges(0);
    }, 1500);
  };

  const selectStrategy = (strategy: ConflictStrategy) => {
    setConflictStrategy(strategy);
    setShowConflictOptions(false);
  };

  const currentStrategyLabel =
    CONFLICT_OPTIONS.find(option => option.value === conflictStrategy)?.label ?? 'Newest Wins';

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      padding: theme.spacing.md,
    },
    section: {
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      marginBottom: theme.spacing.sm,
    },
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
    },
    optionRow: {
      paddingVertical: theme.spacing.sm,
    },
    selector: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
    },
  });

  return (
    <View testID="sync-settings-screen" style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text variant="h6" style={styles.sectionTitle}>
            Sync Status
          </Text>
          <Card>
            <View testID="sync-status" style={styles.settingRow}>
              <Text variant="body">
                {isSyncing ? 'Syncing…' : sync.enabled ? 'Sync enabled' : 'Sync disabled'}
              </Text>
            </View>
            <View style={styles.settingRow}>
              <Text variant="caption" color={theme.colors.textSecondary}>
                {formatLastSynced(lastSynced)}
              </Text>
            </View>
            <View testID="pending-changes" style={styles.settingRow}>
              <Text variant="caption" color={theme.colors.textSecondary}>
                {`Pending changes: ${pendingChanges}`}
              </Text>
            </View>
            <Button testID="sync-now-button" onPress={handleSyncNow} loading={isSyncing} fullWidth>
              Sync Now
            </Button>
          </Card>
        </View>

        <View style={styles.section}>
          <Text variant="h6" style={styles.sectionTitle}>
            Cloud Sync
          </Text>
          <Card>
            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text variant="body">Enable Sync</Text>
                <Text variant="caption" color={theme.colors.textSecondary}>
                  Sync recordings and transcripts to cloud
                </Text>
              </View>
              <Switch
                testID="auto-sync-toggle"
                value={sync.enabled}
                onValueChange={(value) => {
                  dispatch(updateSyncSettings({ enabled: value }));
                }}
                trackColor={{ false: '#ccc', true: theme.colors.primary }}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text variant="body">WiFi Only</Text>
                <Text variant="caption" color={theme.colors.textSecondary}>
                  Only sync when connected to WiFi
                </Text>
              </View>
              <Switch
                testID="wifi-only-toggle"
                value={sync.wifiOnly}
                onValueChange={(value) => {
                  dispatch(updateSyncSettings({ wifiOnly: value }));
                }}
                trackColor={{ false: '#ccc', true: theme.colors.primary }}
              />
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text variant="h6" style={styles.sectionTitle}>
            Conflict Resolution
          </Text>
          <Card>
            <TouchableOpacity
              testID="conflict-strategy-selector"
              style={styles.selector}
              onPress={() => setShowConflictOptions(prev => !prev)}
            >
              <Text variant="body">Conflict Strategy</Text>
              <Text variant="caption" color={theme.colors.textSecondary}>
                {currentStrategyLabel}
              </Text>
            </TouchableOpacity>
            {showConflictOptions &&
              CONFLICT_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.optionRow}
                  onPress={() => selectStrategy(option.value)}
                >
                  <Text variant="body">{option.label}</Text>
                </TouchableOpacity>
              ))}
          </Card>
        </View>

        <View style={styles.section}>
          <Text variant="h6" style={styles.sectionTitle}>
            Sync Frequency
          </Text>
          <Card>
            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text variant="body">Frequency</Text>
                <Text variant="caption" color={theme.colors.textSecondary}>
                  {sync.frequency}
                </Text>
              </View>
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text variant="h6" style={styles.sectionTitle}>
            Data Usage
          </Text>
          <Card>
            <View style={styles.settingRow}>
              <Text variant="caption" color={theme.colors.textSecondary}>
                Data used: 12.4 MB this month
              </Text>
            </View>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
};
