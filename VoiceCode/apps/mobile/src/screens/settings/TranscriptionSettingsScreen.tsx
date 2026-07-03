// VoiceCode Mobile - Transcription Settings Screen
// Phase 0: Stub Screen

import React from 'react';
import { View, StyleSheet, ScrollView, Switch } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppSelector, useAppDispatch } from '../../store';
import { updateTranscriptionSettings } from '../../store/slices/settingsSlice';
import { Text, Card } from '../../components/common';

export const TranscriptionSettingsScreen: React.FC = () => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { transcription } = useAppSelector(state => state.settings);

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
            Transcription Features
          </Text>
          <Card>
            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text variant="body">Auto Punctuation</Text>
                <Text variant="caption" color={theme.colors.textSecondary}>
                  Automatically add punctuation to transcripts
                </Text>
              </View>
              <Switch
                value={transcription.autoPunctuation}
                onValueChange={(value) => {
                  dispatch(updateTranscriptionSettings({ autoPunctuation: value }));
                }}
                trackColor={{ false: '#ccc', true: theme.colors.primary }}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text variant="body">Smart Formatting</Text>
                <Text variant="caption" color={theme.colors.textSecondary}>
                  Format numbers, dates, and special terms
                </Text>
              </View>
              <Switch
                value={transcription.smartFormatting}
                onValueChange={(value) => {
                  dispatch(updateTranscriptionSettings({ smartFormatting: value }));
                }}
                trackColor={{ false: '#ccc', true: theme.colors.primary }}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text variant="body">Language Detection</Text>
                <Text variant="caption" color={theme.colors.textSecondary}>
                  Automatically detect spoken language
                </Text>
              </View>
              <Switch
                value={transcription.languageDetection}
                onValueChange={(value) => {
                  dispatch(updateTranscriptionSettings({ languageDetection: value }));
                }}
                trackColor={{ false: '#ccc', true: theme.colors.primary }}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text variant="body">Speaker Identification</Text>
                <Text variant="caption" color={theme.colors.textSecondary}>
                  Identify different speakers in conversations
                </Text>
              </View>
              <Switch
                value={transcription.speakerIdentification}
                onValueChange={(value) => {
                  dispatch(updateTranscriptionSettings({ speakerIdentification: value }));
                }}
                trackColor={{ false: '#ccc', true: theme.colors.primary }}
              />
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text variant="h6" style={styles.sectionTitle}>
            Quality Settings
          </Text>
          <Card>
            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text variant="body">Confidence Threshold</Text>
                <Text variant="caption" color={theme.colors.textSecondary}>
                  Minimum confidence: {transcription.confidenceThreshold}%
                </Text>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
};

