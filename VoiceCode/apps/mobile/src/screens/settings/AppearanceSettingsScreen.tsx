// VoiceFlow Pro Mobile - Appearance Settings Screen
// Phase 0: Stub Screen

import React from 'react';
import { View, StyleSheet, ScrollView, Switch } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppSelector, useAppDispatch } from '../../store';
import { updateAppearanceSettings } from '../../store/slices/settingsSlice';
import { Text, Card } from '../../components/common';

export const AppearanceSettingsScreen: React.FC = () => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { appearance } = useAppSelector(state => state.settings);

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
            Theme
          </Text>
          <Card>
            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text variant="body">Theme Mode</Text>
                <Text variant="caption" color={theme.colors.textSecondary}>
                  Current: {appearance.theme}
                </Text>
              </View>
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text variant="h6" style={styles.sectionTitle}>
            Display
          </Text>
          <Card>
            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text variant="body">Font Size</Text>
                <Text variant="caption" color={theme.colors.textSecondary}>
                  {appearance.fontSize}
                </Text>
              </View>
            </View>

            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text variant="body">High Contrast</Text>
                <Text variant="caption" color={theme.colors.textSecondary}>
                  Increase contrast for better readability
                </Text>
              </View>
              <Switch
                value={appearance.highContrast}
                onValueChange={(value) => {
                  dispatch(updateAppearanceSettings({ highContrast: value }));
                }}
                trackColor={{ false: '#ccc', true: theme.colors.primary }}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text variant="body">Reduce Animations</Text>
                <Text variant="caption" color={theme.colors.textSecondary}>
                  Minimize motion for accessibility
                </Text>
              </View>
              <Switch
                value={appearance.reduceAnimations}
                onValueChange={(value) => {
                  dispatch(updateAppearanceSettings({ reduceAnimations: value }));
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

