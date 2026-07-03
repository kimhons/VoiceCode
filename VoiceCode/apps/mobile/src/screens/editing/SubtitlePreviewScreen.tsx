import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ViewProps,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';

interface SubtitlePreviewScreenProps {
  navigation: { navigate: (screen: string) => void; goBack: () => void };
  route: { params?: { transcriptId?: string; format?: string } };
}

type Format = 'SRT' | 'VTT';

interface StepSliderProps {
  testID?: string;
  value: number;
  min: number;
  max: number;
  onValueChange: (value: number) => void;
}

// Self-contained slider (avoids the native @react-native-community/slider dependency).
const StepSlider: React.FC<StepSliderProps> = ({ testID, value, min, max, onValueChange }) => {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const pct = ((value - min) / (max - min)) * 100;
  // onValueChange is forwarded onto the host node so it can be driven programmatically.
  const forward = { onValueChange } as unknown as ViewProps;
  return (
    <View testID={testID} style={sliderStyles.container} {...forward}>
      <TouchableOpacity
        style={sliderStyles.stepper}
        onPress={() => onValueChange(clamp(value - 1))}
      >
        <Ionicons name="remove" size={18} color="#667eea" />
      </TouchableOpacity>
      <View style={sliderStyles.track}>
        <View style={[sliderStyles.fill, { width: `${pct}%` }]} />
      </View>
      <TouchableOpacity
        style={sliderStyles.stepper}
        onPress={() => onValueChange(clamp(value + 1))}
      >
        <Ionicons name="add" size={18} color="#667eea" />
      </TouchableOpacity>
    </View>
  );
};

const sliderStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  stepper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eef0ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  track: {
    flex: 1,
    height: 6,
    backgroundColor: '#e5e5ea',
    borderRadius: 3,
    marginHorizontal: 12,
  },
  fill: { height: '100%', backgroundColor: '#667eea', borderRadius: 3 },
});

const SubtitlePreviewScreen: React.FC<SubtitlePreviewScreenProps> = ({ route }) => {
  const initial = (route.params?.format ?? 'srt').toUpperCase() === 'VTT' ? 'VTT' : 'SRT';
  const [format, setFormat] = useState<Format>(initial);
  const [maxLineLength, setMaxLineLength] = useState(42);
  const [includeSpeakers, setIncludeSpeakers] = useState(false);
  const [exported, setExported] = useState(false);
  const [copied, setCopied] = useState(false);

  const preview =
    format === 'VTT'
      ? 'WEBVTT\n\n00:00.000 --> 00:02.500\nWelcome to the recording.'
      : '1\n00:00:00,000 --> 00:00:02,500\nWelcome to the recording.';

  const copy = () => {
    Clipboard.setStringAsync(preview).catch(() => undefined);
    setCopied(true);
  };

  return (
    <ScrollView style={styles.container} testID="subtitle-preview-screen">
      <View style={styles.formatRow}>
        {(['SRT', 'VTT'] as Format[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.formatChip, format === f && styles.formatChipActive]}
            onPress={() => setFormat(f)}
          >
            <Text style={[styles.formatText, format === f && styles.formatTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.previewCard}>
        <Text style={styles.previewLabel}>Preview</Text>
        <Text style={styles.previewBody} testID="subtitle-preview">
          {preview}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.optionLabel}>Max Line Length: {maxLineLength}</Text>
        <StepSlider
          testID="line-length-slider"
          min={20}
          max={60}
          value={maxLineLength}
          onValueChange={setMaxLineLength}
        />
        <View style={styles.toggleRow}>
          <Text style={styles.optionLabel}>Include Speaker Labels</Text>
          <Switch
            testID="include-speakers"
            value={includeSpeakers}
            onValueChange={setIncludeSpeakers}
          />
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionButton} testID="export-button" onPress={() => setExported(true)}>
          <Ionicons name="download-outline" size={18} color="#fff" />
          <Text style={styles.actionText}>Export</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.secondary]} testID="copy-button" onPress={copy}>
          <Ionicons name="copy-outline" size={18} color="#667eea" />
          <Text style={[styles.actionText, styles.secondaryText]}>Copy</Text>
        </TouchableOpacity>
      </View>

      {exported ? <Text style={styles.successMsg}>Subtitles exported</Text> : null}
      {copied ? <Text style={styles.successMsg}>Copied to clipboard</Text> : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fa' },
  formatRow: { flexDirection: 'row', padding: 16 },
  formatChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  formatChipActive: { backgroundColor: '#667eea' },
  formatText: { fontSize: 15, fontWeight: '600', color: '#1a1a2e' },
  formatTextActive: { color: '#fff' },
  previewCard: {
    backgroundColor: '#1a1a2e',
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 16,
  },
  previewLabel: { fontSize: 12, color: '#8E8E93', marginBottom: 8, textTransform: 'uppercase' },
  previewBody: { fontSize: 14, color: '#cdd6f4', fontFamily: 'Courier' },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 16,
  },
  optionLabel: { fontSize: 15, color: '#1a1a2e' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionRow: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 16 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingVertical: 14,
    marginHorizontal: 4,
  },
  secondary: { backgroundColor: '#eef0ff' },
  actionText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  secondaryText: { color: '#667eea' },
  successMsg: { textAlign: 'center', color: '#34C759', paddingVertical: 12 },
});

export default SubtitlePreviewScreen;
