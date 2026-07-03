// VoiceCode Mobile - Appearance Settings Screen

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppSelector, useAppDispatch } from '../../store';
import { updateAppearanceSettings } from '../../store/slices/settingsSlice';
import { Text, Card } from '../../components/common';

type ThemeOption = { key: 'light' | 'dark' | 'auto'; label: string; testID: string };

const THEME_OPTIONS: ThemeOption[] = [
  { key: 'light', label: 'Light', testID: 'theme-light' },
  { key: 'dark', label: 'Dark', testID: 'theme-dark' },
  { key: 'auto', label: 'System', testID: 'theme-system' },
];

const ACCENT_COLORS = [
  { key: 'blue', value: '#3B82F6' },
  { key: 'green', value: '#10B981' },
  { key: 'purple', value: '#8B5CF6' },
  { key: 'red', value: '#EF4444' },
] as const;

const DENSITY_OPTIONS = ['Compact', 'Comfortable'] as const;

const FONT_STEPS = [12, 14, 16, 18, 20, 22, 24];

const fontSizeToValue = (size: 'small' | 'medium' | 'large'): number =>
  size === 'small' ? 14 : size === 'large' ? 20 : 16;

const valueToFontSize = (value: number): 'small' | 'medium' | 'large' =>
  value < 15 ? 'small' : value >= 19 ? 'large' : 'medium';

interface FontSizeSliderProps {
  testID: string;
  value: number;
  minimumTrackTintColor: string;
  trackColor: string;
  onValueChange: (value: number) => void;
}

const FontSizeSlider: React.FC<FontSizeSliderProps> = ({
  testID,
  value,
  minimumTrackTintColor,
  trackColor,
  onValueChange,
}) => (
  <View
    testID={testID}
    accessibilityRole="adjustable"
    accessibilityValue={{ min: FONT_STEPS[0], max: FONT_STEPS[FONT_STEPS.length - 1], now: value }}
    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}
  >
    {FONT_STEPS.map(step => {
      const active = value >= step;
      return (
        <TouchableOpacity
          key={step}
          accessibilityRole="button"
          accessibilityLabel={`font size ${step}`}
          onPress={() => onValueChange(step)}
          style={{
            flex: 1,
            height: 8,
            marginHorizontal: 1,
            borderRadius: 4,
            backgroundColor: active ? minimumTrackTintColor : trackColor,
          }}
        />
      );
    })}
  </View>
);

export const AppearanceSettingsScreen: React.FC = () => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { appearance } = useAppSelector(state => state.settings);

  const [accentColor, setAccentColor] = useState<string>('blue');
  const [density, setDensity] = useState<(typeof DENSITY_OPTIONS)[number]>('Comfortable');
  const [boldText, setBoldText] = useState(false);
  const [fontValue, setFontValue] = useState<number>(fontSizeToValue(appearance.fontSize));

  const selectedAccent =
    ACCENT_COLORS.find(c => c.key === accentColor)?.value ?? theme.colors.primary;

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
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.sm,
    },
    optionButton: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    optionButtonSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    colorSwatch: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    colorSwatchSelected: {
      borderColor: theme.colors.textPrimary,
    },
    colorPreview: {
      height: 48,
      borderRadius: 8,
      marginTop: theme.spacing.sm,
    },
  });

  return (
    <View style={styles.container} testID="appearance-settings-screen">
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text variant="h6" style={styles.sectionTitle}>
            Theme
          </Text>
          <Card>
            <View style={styles.optionRow}>
              {THEME_OPTIONS.map(option => {
                const selected = appearance.theme === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    testID={option.testID}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={[styles.optionButton, selected && styles.optionButtonSelected]}
                    onPress={() => dispatch(updateAppearanceSettings({ theme: option.key }))}
                  >
                    <Text
                      variant="body"
                      color={selected ? theme.colors.background : theme.colors.textPrimary}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text variant="h6" style={styles.sectionTitle}>
            Accent Color
          </Text>
          <Card>
            <View style={styles.optionRow}>
              {ACCENT_COLORS.map(color => {
                const selected = accentColor === color.key;
                return (
                  <TouchableOpacity
                    key={color.key}
                    testID={`color-${color.key}`}
                    accessibilityRole="button"
                    accessibilityLabel={`${color.key} accent color`}
                    accessibilityState={{ selected }}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: color.value },
                      selected && styles.colorSwatchSelected,
                    ]}
                    onPress={() => setAccentColor(color.key)}
                  />
                );
              })}
            </View>
            <View
              testID="color-preview"
              style={[styles.colorPreview, { backgroundColor: selectedAccent }]}
            />
          </Card>
        </View>

        <View style={styles.section}>
          <Text variant="h6" style={styles.sectionTitle}>
            Font Size
          </Text>
          <Card>
            <Text testID="font-preview" variant="body" style={{ fontSize: fontValue }}>
              The quick brown fox
            </Text>
            <FontSizeSlider
              testID="font-size-slider"
              value={fontValue}
              minimumTrackTintColor={theme.colors.primary}
              trackColor={theme.colors.border}
              onValueChange={value => {
                setFontValue(value);
                dispatch(updateAppearanceSettings({ fontSize: valueToFontSize(value) }));
              }}
            />
          </Card>
        </View>

        <View style={styles.section}>
          <Text variant="h6" style={styles.sectionTitle}>
            Display Density
          </Text>
          <Card>
            <View style={styles.optionRow}>
              {DENSITY_OPTIONS.map(option => {
                const selected = density === option;
                return (
                  <TouchableOpacity
                    key={option}
                    testID={`density-${option.toLowerCase()}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={[styles.optionButton, selected && styles.optionButtonSelected]}
                    onPress={() => setDensity(option)}
                  >
                    <Text
                      variant="body"
                      color={selected ? theme.colors.background : theme.colors.textPrimary}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text variant="h6" style={styles.sectionTitle}>
            Accessibility
          </Text>
          <Card>
            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text variant="body">High Contrast</Text>
                <Text variant="caption" color={theme.colors.textSecondary}>
                  Increase contrast for better readability
                </Text>
              </View>
              <Switch
                value={appearance.highContrast}
                onValueChange={value => {
                  dispatch(updateAppearanceSettings({ highContrast: value }));
                }}
                trackColor={{ false: '#ccc', true: theme.colors.primary }}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text variant="body">Reduce Motion</Text>
                <Text variant="caption" color={theme.colors.textSecondary}>
                  Minimize motion for accessibility
                </Text>
              </View>
              <Switch
                testID="reduce-motion-toggle"
                value={appearance.reduceAnimations}
                onValueChange={value => {
                  dispatch(updateAppearanceSettings({ reduceAnimations: value }));
                }}
                trackColor={{ false: '#ccc', true: theme.colors.primary }}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text variant="body">Bold Text</Text>
                <Text variant="caption" color={theme.colors.textSecondary}>
                  Use heavier font weights throughout the app
                </Text>
              </View>
              <Switch
                testID="bold-text-toggle"
                value={boldText}
                onValueChange={setBoldText}
                trackColor={{ false: '#ccc', true: theme.colors.primary }}
              />
            </View>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
};
