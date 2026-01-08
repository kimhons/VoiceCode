// VoiceFlow Pro Mobile - AI Settings Screen
// Phase 0: Stub Screen

import React from 'react';
import { View, StyleSheet, ScrollView, Switch } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppSelector, useAppDispatch } from '../../store';
import { updateAISettings } from '../../store/slices/settingsSlice';
import { Text, Card } from '../../components/common';

export const AISettingsScreen: React.FC = () => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { ai } = useAppSelector(state => state.settings);

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
            AI Processing
          </Text>
          <Card>
            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text variant="body">Auto Process</Text>
                <Text variant="caption" color={theme.colors.textSecondary}>
                  Automatically process transcripts with AI
                </Text>
              </View>
              <Switch
                value={ai.autoProcess}
                onValueChange={(value) => {
                  dispatch(updateAISettings({ autoProcess: value }));
                }}
                trackColor={{ false: '#ccc', true: theme.colors.primary }}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text variant="body">Remove Fillers</Text>
                <Text variant="caption" color={theme.colors.textSecondary}>
                  Remove "um", "uh", and other filler words
                </Text>
              </View>
              <Switch
                value={ai.removeFillers}
                onValueChange={(value) => {
                  dispatch(updateAISettings({ removeFillers: value }));
                }}
                trackColor={{ false: '#ccc', true: theme.colors.primary }}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text variant="body">Correct Grammar</Text>
                <Text variant="caption" color={theme.colors.textSecondary}>
                  Automatically fix grammar errors
                </Text>
              </View>
              <Switch
                value={ai.correctGrammar}
                onValueChange={(value) => {
                  dispatch(updateAISettings({ correctGrammar: value }));
                }}
                trackColor={{ false: '#ccc', true: theme.colors.primary }}
              />
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text variant="h6" style={styles.sectionTitle}>
            Default Settings
          </Text>
          <Card>
            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text variant="body">Default Tone</Text>
                <Text variant="caption" color={theme.colors.textSecondary}>
                  {ai.defaultTone}
                </Text>
              </View>
            </View>

            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text variant="body">Default Context</Text>
                <Text variant="caption" color={theme.colors.textSecondary}>
                  {ai.defaultContext}
                </Text>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
};

