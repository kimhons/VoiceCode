// VoiceFlow Pro Mobile - Privacy Settings Screen
// Phase 0: Stub Screen

import React from 'react';
import { View, StyleSheet, ScrollView, Switch } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppSelector, useAppDispatch } from '../../store';
import { updatePrivacySettings } from '../../store/slices/settingsSlice';
import { Text, Card } from '../../components/common';

export const PrivacySettingsScreen: React.FC = () => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { privacy } = useAppSelector(state => state.settings);

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
            Data Privacy
          </Text>
          <Card>
            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text variant="body">Save Transcriptions</Text>
                <Text variant="caption" color={theme.colors.textSecondary}>
                  Store transcriptions on device and cloud
                </Text>
              </View>
              <Switch
                value={privacy.saveTranscriptions}
                onValueChange={(value) => {
                  dispatch(updatePrivacySettings({ saveTranscriptions: value }));
                }}
                trackColor={{ false: '#ccc', true: theme.colors.primary }}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text variant="body">Share Analytics</Text>
                <Text variant="caption" color={theme.colors.textSecondary}>
                  Help improve the app with usage data
                </Text>
              </View>
              <Switch
                value={privacy.shareAnalytics}
                onValueChange={(value) => {
                  dispatch(updatePrivacySettings({ shareAnalytics: value }));
                }}
                trackColor={{ false: '#ccc', true: theme.colors.primary }}
              />
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text variant="h6" style={styles.sectionTitle}>
            Encryption
          </Text>
          <Card>
            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text variant="body">Enable Encryption</Text>
                <Text variant="caption" color={theme.colors.textSecondary}>
                  Encrypt recordings and transcripts
                </Text>
              </View>
              <Switch
                value={privacy.encryption.enabled}
                onValueChange={(value) => {
                  dispatch(updatePrivacySettings({ 
                    encryption: { ...privacy.encryption, enabled: value } 
                  }));
                }}
                trackColor={{ false: '#ccc', true: theme.colors.primary }}
              />
            </View>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
};

