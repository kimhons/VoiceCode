// VoiceCode Mobile - Privacy Settings Screen

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppSelector, useAppDispatch } from '../../store';
import { updatePrivacySettings } from '../../store/slices/settingsSlice';
import { Text, Card } from '../../components/common';

export const PrivacySettingsScreen: React.FC = () => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { privacy } = useAppSelector(state => state.settings);

  const [crashReporting, setCrashReporting] = useState(true);
  const [usageStatistics, setUsageStatistics] = useState(false);
  const [dataExportRequested, setDataExportRequested] = useState(false);
  const [deleteRequested, setDeleteRequested] = useState(false);

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
    actionRow: {
      paddingVertical: theme.spacing.md,
      minHeight: 44,
      justifyContent: 'center',
    },
    linkRow: {
      paddingVertical: theme.spacing.md,
      minHeight: 44,
      justifyContent: 'center',
    },
    inlineMessage: {
      marginTop: theme.spacing.sm,
    },
  });

  return (
    <View testID="privacy-settings-screen" style={styles.container}>
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
                testID="save-transcriptions-toggle"
                value={privacy.saveTranscriptions}
                onValueChange={(value) => {
                  dispatch(updatePrivacySettings({ saveTranscriptions: value }));
                }}
                trackColor={{ false: '#ccc', true: theme.colors.primary }}
              />
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text variant="h6" style={styles.sectionTitle}>
            Data Collection
          </Text>
          <Card>
            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text variant="body">Share Analytics</Text>
                <Text variant="caption" color={theme.colors.textSecondary}>
                  Help improve the app with usage data
                </Text>
              </View>
              <Switch
                testID="analytics-toggle"
                value={privacy.shareAnalytics}
                onValueChange={(value) => {
                  dispatch(updatePrivacySettings({ shareAnalytics: value }));
                }}
                trackColor={{ false: '#ccc', true: theme.colors.primary }}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text variant="body">Crash Reporting</Text>
                <Text variant="caption" color={theme.colors.textSecondary}>
                  Send crash logs to help fix problems
                </Text>
              </View>
              <Switch
                testID="crash-reporting-toggle"
                value={crashReporting}
                onValueChange={setCrashReporting}
                trackColor={{ false: '#ccc', true: theme.colors.primary }}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text variant="body">Usage Statistics</Text>
                <Text variant="caption" color={theme.colors.textSecondary}>
                  Collect anonymous feature usage statistics
                </Text>
              </View>
              <Switch
                testID="usage-stats-toggle"
                value={usageStatistics}
                onValueChange={setUsageStatistics}
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
                testID="encryption-toggle"
                value={privacy.encryption.enabled}
                onValueChange={(value) => {
                  dispatch(updatePrivacySettings({
                    encryption: { ...privacy.encryption, enabled: value },
                  }));
                }}
                trackColor={{ false: '#ccc', true: theme.colors.primary }}
              />
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text variant="h6" style={styles.sectionTitle}>
            Permissions
          </Text>
          <Card>
            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text variant="body">Microphone</Text>
                <Text variant="caption" color={theme.colors.textSecondary}>
                  Required to record and transcribe audio
                </Text>
              </View>
              <Text variant="caption" color={theme.colors.textSecondary}>
                Allowed
              </Text>
            </View>

            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text variant="body">Notifications</Text>
                <Text variant="caption" color={theme.colors.textSecondary}>
                  Alerts when transcriptions finish
                </Text>
              </View>
              <Text variant="caption" color={theme.colors.textSecondary}>
                Allowed
              </Text>
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text variant="h6" style={styles.sectionTitle}>
            Data Management
          </Text>
          <Card>
            <TouchableOpacity
              testID="download-data"
              style={styles.actionRow}
              onPress={() => setDataExportRequested(true)}
            >
              <Text variant="body">Download My Data</Text>
            </TouchableOpacity>
            {dataExportRequested && (
              <Text
                variant="caption"
                color={theme.colors.textSecondary}
                style={styles.inlineMessage}
              >
                Preparing your data export. We'll notify you when it's ready.
              </Text>
            )}

            <TouchableOpacity
              testID="delete-account"
              style={styles.actionRow}
              onPress={() => setDeleteRequested(true)}
            >
              <Text variant="body" color={theme.colors.error}>
                Delete Account
              </Text>
            </TouchableOpacity>
            {deleteRequested && (
              <Text
                variant="caption"
                color={theme.colors.error}
                style={styles.inlineMessage}
              >
                Are you sure? This permanently deletes your account and all data.
              </Text>
            )}
          </Card>
        </View>

        <View style={styles.section}>
          <Text variant="h6" style={styles.sectionTitle}>
            Legal
          </Text>
          <Card>
            <TouchableOpacity testID="privacy-policy-link" style={styles.linkRow}>
              <Text variant="body" color={theme.colors.primary}>
                Privacy Policy
              </Text>
            </TouchableOpacity>
            <TouchableOpacity testID="terms-of-service-link" style={styles.linkRow}>
              <Text variant="body" color={theme.colors.primary}>
                Terms of Service
              </Text>
            </TouchableOpacity>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
};
