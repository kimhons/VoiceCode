// VoiceFlow Pro Mobile - Recording Settings Screen
// Phase 0: Stub Screen

import React from 'react';
import { View, StyleSheet, ScrollView, Switch } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppSelector, useAppDispatch } from '../../store';
import { updateRecordingSettings } from '../../store/slices/settingsSlice';
import { Text, Card } from '../../components/common';

export const RecordingSettingsScreen: React.FC = () => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { recording } = useAppSelector(state => state.settings);

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
            Audio Quality
          </Text>
          <Card>
            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text variant="body">Quality: {recording.audioQuality}</Text>
                <Text variant="caption" color={theme.colors.textSecondary}>
                  Higher quality uses more storage
                </Text>
              </View>
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text variant="h6" style={styles.sectionTitle}>
            Recording Options
          </Text>
          <Card>
            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text variant="body">Background Recording</Text>
                <Text variant="caption" color={theme.colors.textSecondary}>
                  Continue recording when app is in background
                </Text>
              </View>
              <Switch
                value={recording.backgroundRecording}
                onValueChange={(value) => {
                  dispatch(updateRecordingSettings({ backgroundRecording: value }));
                }}
                trackColor={{ false: '#ccc', true: theme.colors.primary }}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text variant="body">Noise Reduction</Text>
                <Text variant="caption" color={theme.colors.textSecondary}>
                  Reduce background noise during recording
                </Text>
              </View>
              <Switch
                value={recording.noiseReduction}
                onValueChange={(value) => {
                  dispatch(updateRecordingSettings({ noiseReduction: value }));
                }}
                trackColor={{ false: '#ccc', true: theme.colors.primary }}
              />
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text variant="h6" style={styles.sectionTitle}>
            Auto Stop
          </Text>
          <Card>
            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text variant="body">Enable Auto Stop</Text>
                <Text variant="caption" color={theme.colors.textSecondary}>
                  Automatically stop recording after silence
                </Text>
              </View>
              <Switch
                value={recording.autoStop.enabled}
                onValueChange={(value) => {
                  dispatch(updateRecordingSettings({ 
                    autoStop: { ...recording.autoStop, enabled: value } 
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

