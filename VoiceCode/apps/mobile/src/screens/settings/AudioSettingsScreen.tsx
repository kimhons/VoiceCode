import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AudioSettingsScreenProps {
  navigation: { navigate: (screen: string) => void; goBack: () => void };
}

type SelectorKey = 'speed' | 'skip' | 'quality' | 'format' | null;

const SPEED_OPTIONS = ['0.5x', '1x', '1.5x', '2x'];
const SKIP_OPTIONS = ['10 seconds', '15 seconds', '30 seconds'];
const QUALITY_OPTIONS = ['Low', 'Medium', 'High'];
const FORMAT_OPTIONS = ['MP3', 'M4A', 'WAV'];

const AudioSettingsScreen: React.FC<AudioSettingsScreenProps> = ({ navigation }) => {
  const [openSelector, setOpenSelector] = useState<SelectorKey>(null);
  const [speed, setSpeed] = useState('1x');
  const [skipInterval, setSkipInterval] = useState('10 seconds');
  const [quality, setQuality] = useState('Medium');
  const [format, setFormat] = useState('MP3');
  const [autoPlay, setAutoPlay] = useState(false);
  const [noiseCancellation, setNoiseCancellation] = useState(false);
  const [backgroundPlayback, setBackgroundPlayback] = useState(false);
  const [lockScreenControls, setLockScreenControls] = useState(false);

  const toggleSelector = (key: SelectorKey) =>
    setOpenSelector((cur) => (cur === key ? null : key));

  const Selector = ({
    testID,
    label,
    value,
    options,
    selectorKey,
    onSelect,
  }: {
    testID: string;
    label: string;
    value: string;
    options: string[];
    selectorKey: SelectorKey;
    onSelect: (v: string) => void;
  }) => (
    <View style={styles.selectorGroup}>
      <TouchableOpacity style={styles.row} onPress={() => toggleSelector(selectorKey)} testID={testID}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
        <Ionicons name="chevron-forward" size={18} color="#bbb" />
      </TouchableOpacity>
      {openSelector === selectorKey ? (
        <View style={styles.options}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={styles.option}
              onPress={() => {
                onSelect(opt);
                setOpenSelector(null);
              }}
            >
              <Text style={styles.optionText}>{opt}</Text>
              {value === opt ? <Ionicons name="checkmark" size={18} color="#667eea" /> : null}
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );

  const ToggleRow = ({
    testID,
    label,
    value,
    onValueChange,
  }: {
    testID: string;
    label: string;
    value: boolean;
    onValueChange: (v: boolean) => void;
  }) => (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch testID={testID} value={value} onValueChange={onValueChange} />
    </View>
  );

  return (
    <ScrollView style={styles.container} testID="audio-settings-screen">
      <Text style={styles.sectionTitle}>Playback</Text>
      <View style={styles.section}>
        <Selector
          testID="speed-selector"
          label="Default Speed"
          value={speed}
          options={SPEED_OPTIONS}
          selectorKey="speed"
          onSelect={setSpeed}
        />
        <ToggleRow testID="auto-play-toggle" label="Auto-play" value={autoPlay} onValueChange={setAutoPlay} />
        <Selector
          testID="skip-interval-selector"
          label="Skip Interval"
          value={skipInterval}
          options={SKIP_OPTIONS}
          selectorKey="skip"
          onSelect={setSkipInterval}
        />
      </View>

      <Text style={styles.sectionTitle}>Recording</Text>
      <View style={styles.section}>
        <Selector
          testID="quality-selector"
          label="Audio Quality"
          value={quality}
          options={QUALITY_OPTIONS}
          selectorKey="quality"
          onSelect={setQuality}
        />
        <Selector
          testID="format-selector"
          label="Audio Format"
          value={format}
          options={FORMAT_OPTIONS}
          selectorKey="format"
          onSelect={setFormat}
        />
        <ToggleRow
          testID="noise-cancellation-toggle"
          label="Noise Cancellation"
          value={noiseCancellation}
          onValueChange={setNoiseCancellation}
        />
      </View>

      <Text style={styles.sectionTitle}>Background</Text>
      <View style={styles.section}>
        <ToggleRow
          testID="background-playback-toggle"
          label="Background Playback"
          value={backgroundPlayback}
          onValueChange={setBackgroundPlayback}
        />
        <ToggleRow
          testID="lock-screen-controls-toggle"
          label="Lock Screen Controls"
          value={lockScreenControls}
          onValueChange={setLockScreenControls}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fa' },
  sectionTitle: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  section: {
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5ea',
  },
  selectorGroup: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
  },
  rowLabel: { flex: 1, fontSize: 16, color: '#1a1a2e' },
  rowValue: { fontSize: 15, color: '#667eea', marginRight: 8 },
  options: { backgroundColor: '#fafafe' },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
  },
  optionText: { fontSize: 15, color: '#1a1a2e' },
});

export default AudioSettingsScreen;
