// VoiceFlow Pro Mobile - Sync Settings Screen
// Phase 0: Stub Screen

import React from 'react';
import { View, StyleSheet, ScrollView, Switch } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppSelector, useAppDispatch } from '../../store';
import { updateSyncSettings } from '../../store/slices/settingsSlice';
import { Text, Card } from '../../components/common';

export const SyncSettingsScreen: React.FC = () => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { sync } = useAppSelector(state => state.settings);

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
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
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
      </ScrollView>
    </View>
  );
};

