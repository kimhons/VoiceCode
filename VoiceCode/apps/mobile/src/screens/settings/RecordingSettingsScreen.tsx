// VoiceCode Mobile - Recording Settings Screen

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppSelector, useAppDispatch } from '../../store';
import { updateRecordingSettings } from '../../store/slices/settingsSlice';
import { Text, Card } from '../../components/common';

interface RecordingSettingsScreenProps {
  navigation?: {
    navigate: (screen: string) => void;
    goBack: () => void;
  };
}

type SelectorKey = 'format' | 'language' | 'retention';

const FORMAT_OPTIONS = ['MP3', 'M4A', 'WAV'];
const LANGUAGE_OPTIONS = ['English', 'Spanish', 'French', 'German'];
const RETENTION_OPTIONS = ['7 days', '30 days', '90 days', 'Forever'];
const QUALITY_OPTIONS: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];
const QUALITY_LABELS: Record<'low' | 'medium' | 'high', string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const RecordingSettingsScreen: React.FC<RecordingSettingsScreenProps> = () => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { recording } = useAppSelector(state => state.settings);

  const [openSelector, setOpenSelector] = useState<SelectorKey | null>(null);
  const [format, setFormat] = useState('MP3');
  const [autoPause, setAutoPause] = useState(false);
  const [speakerDetection, setSpeakerDetection] = useState(false);
  const [keepAudio, setKeepAudio] = useState(true);
  const [retention, setRetention] = useState('7 days');

  const toggleSelector = (key: SelectorKey) =>
    setOpenSelector(cur => (cur === key ? null : key));

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
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      paddingLeft: theme.spacing.md,
    },
  });

  const renderSelector = (
    testID: string,
    label: string,
    value: string,
    options: string[],
    key: SelectorKey,
    onSelect: (v: string) => void
  ) => (
    <View>
      <TouchableOpacity
        style={styles.settingRow}
        testID={testID}
        onPress={() => toggleSelector(key)}
      >
        <Text variant="body">{label}</Text>
        <Text variant="body" color={theme.colors.primary}>
          {value}
        </Text>
      </TouchableOpacity>
      {openSelector === key
        ? options.map(opt => (
            <TouchableOpacity
              key={opt}
              style={styles.optionRow}
              onPress={() => {
                onSelect(opt);
                setOpenSelector(null);
              }}
            >
              <Text variant="body">{opt}</Text>
              {value === opt ? (
                <Text variant="body" color={theme.colors.primary}>
                  ✓
                </Text>
              ) : null}
            </TouchableOpacity>
          ))
        : null}
    </View>
  );

  return (
    <View style={styles.container} testID="recording-settings-screen">
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text variant="h6" style={styles.sectionTitle}>
            Audio Quality
          </Text>
          <Card>
            {QUALITY_OPTIONS.map(q => (
              <TouchableOpacity
                key={q}
                style={styles.settingRow}
                testID={`quality-${q}`}
                onPress={() => {
                  dispatch(updateRecordingSettings({ audioQuality: q }));
                }}
              >
                <Text variant="body">{QUALITY_LABELS[q]}</Text>
                {recording.audioQuality === q ? (
                  <Text variant="body" color={theme.colors.primary}>
                    ✓
                  </Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </Card>
        </View>

        <View style={styles.section}>
          <Text variant="h6" style={styles.sectionTitle}>
            Format
          </Text>
          <Card>
            {renderSelector('format-selector', 'Audio Format', format, FORMAT_OPTIONS, 'format', setFormat)}
          </Card>
        </View>

        <View style={styles.section}>
          <Text variant="h6" style={styles.sectionTitle}>
            Language
          </Text>
          <Card>
            {renderSelector(
              'language-selector',
              'Default Language',
              recording.defaultLanguage,
              LANGUAGE_OPTIONS,
              'language',
              value => {
                dispatch(updateRecordingSettings({ defaultLanguage: value }));
              }
            )}
          </Card>
        </View>

        <View style={styles.section}>
          <Text variant="h6" style={styles.sectionTitle}>
            Processing
          </Text>
          <Card>
            <View style={styles.settingRow}>
              <Text variant="body">Noise Cancellation</Text>
              <Switch
                testID="noise-cancellation-toggle"
                value={recording.noiseReduction}
                onValueChange={value => {
                  dispatch(updateRecordingSettings({ noiseReduction: value }));
                }}
                trackColor={{ false: '#ccc', true: theme.colors.primary }}
              />
            </View>

            <View style={styles.settingRow}>
              <Text variant="body">Auto-Pause</Text>
              <Switch
                testID="auto-pause-toggle"
                value={autoPause}
                onValueChange={setAutoPause}
                trackColor={{ false: '#ccc', true: theme.colors.primary }}
              />
            </View>

            <View style={styles.settingRow}>
              <Text variant="body">Speaker Detection</Text>
              <Switch
                testID="speaker-detection-toggle"
                value={speakerDetection}
                onValueChange={setSpeakerDetection}
                trackColor={{ false: '#ccc', true: theme.colors.primary }}
              />
            </View>

            <View style={styles.settingRow}>
              <Text variant="body">Background Recording</Text>
              <Switch
                testID="background-recording-toggle"
                value={recording.backgroundRecording}
                onValueChange={value => {
                  dispatch(updateRecordingSettings({ backgroundRecording: value }));
                }}
                trackColor={{ false: '#ccc', true: theme.colors.primary }}
              />
            </View>

            <View style={styles.settingRow}>
              <Text variant="body">Auto Stop on Silence</Text>
              <Switch
                testID="auto-stop-toggle"
                value={recording.autoStop.enabled}
                onValueChange={value => {
                  dispatch(
                    updateRecordingSettings({
                      autoStop: { ...recording.autoStop, enabled: value },
                    })
                  );
                }}
                trackColor={{ false: '#ccc', true: theme.colors.primary }}
              />
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text variant="h6" style={styles.sectionTitle}>
            Storage
          </Text>
          <Card>
            <View style={styles.settingRow}>
              <Text variant="body">Keep Audio Files</Text>
              <Switch
                testID="keep-audio-toggle"
                value={keepAudio}
                onValueChange={setKeepAudio}
                trackColor={{ false: '#ccc', true: theme.colors.primary }}
              />
            </View>
            {renderSelector(
              'retention-selector',
              'Retention Period',
              retention,
              RETENTION_OPTIONS,
              'retention',
              setRetention
            )}
          </Card>
        </View>
      </ScrollView>
    </View>
  );
};
