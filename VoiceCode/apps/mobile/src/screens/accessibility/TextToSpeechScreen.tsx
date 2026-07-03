import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const TextToSpeechScreen: React.FC = () => {
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [readTranscripts, setReadTranscripts] = useState(true);
  const [readNotifications, setReadNotifications] = useState(false);
  const [readSummaries, setReadSummaries] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState('samantha');
  const [speechRate, setSpeechRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);

  const voices = [
    { id: 'samantha', name: 'Samantha', language: 'English (US)', gender: 'Female' },
    { id: 'alex', name: 'Alex', language: 'English (US)', gender: 'Male' },
    { id: 'victoria', name: 'Victoria', language: 'English (UK)', gender: 'Female' },
    { id: 'daniel', name: 'Daniel', language: 'English (UK)', gender: 'Male' },
  ];

  const rateOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Text to Speech</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.mainToggle}>
          <View style={styles.toggleInfo}>
            <View
              style={[
                styles.toggleIcon,
                { backgroundColor: ttsEnabled ? '#007AFF20' : '#8E8E9320' },
              ]}
            >
              <Ionicons name="volume-high" size={24} color={ttsEnabled ? '#007AFF' : '#8E8E93'} />
            </View>
            <View style={styles.toggleText}>
              <Text style={styles.toggleTitle}>Text to Speech</Text>
              <Text style={styles.toggleDesc}>Read content aloud</Text>
            </View>
          </View>
          <Switch
            value={ttsEnabled}
            onValueChange={setTtsEnabled}
            trackColor={{ false: '#E5E5EA', true: '#34C759' }}
            thumbColor="#FFF"
          />
        </View>

        {ttsEnabled && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Read Aloud</Text>
              <View style={styles.settingsCard}>
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="document-text" size={20} color="#007AFF" />
                    <Text style={styles.settingLabel}>Transcripts</Text>
                  </View>
                  <Switch
                    value={readTranscripts}
                    onValueChange={setReadTranscripts}
                    trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                    thumbColor="#FFF"
                  />
                </View>
                <View style={styles.divider} />
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="notifications" size={20} color="#FF9500" />
                    <Text style={styles.settingLabel}>Notifications</Text>
                  </View>
                  <Switch
                    value={readNotifications}
                    onValueChange={setReadNotifications}
                    trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                    thumbColor="#FFF"
                  />
                </View>
                <View style={styles.divider} />
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="sparkles" size={20} color="#AF52DE" />
                    <Text style={styles.settingLabel}>AI Summaries</Text>
                  </View>
                  <Switch
                    value={readSummaries}
                    onValueChange={setReadSummaries}
                    trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                    thumbColor="#FFF"
                  />
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Voice</Text>
              <View style={styles.voicesCard}>
                {voices.map((voice, idx) => (
                  <View key={voice.id}>
                    <TouchableOpacity
                      style={styles.voiceRow}
                      onPress={() => setSelectedVoice(voice.id)}
                    >
                      <View style={styles.voiceInfo}>
                        <Text style={styles.voiceName}>{voice.name}</Text>
                        <Text style={styles.voiceMeta}>
                          {voice.language} • {voice.gender}
                        </Text>
                      </View>
                      {selectedVoice === voice.id ? (
                        <Ionicons name="checkmark-circle" size={22} color="#007AFF" />
                      ) : (
                        <Ionicons name="ellipse-outline" size={22} color="#C7C7CC" />
                      )}
                    </TouchableOpacity>
                    {idx < voices.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Speech Rate</Text>
              <View style={styles.rateCard}>
                <View style={styles.rateHeader}>
                  <Text style={styles.rateLabel}>Speed</Text>
                  <Text style={styles.rateValue}>{speechRate}x</Text>
                </View>
                <View style={styles.rateOptions}>
                  {rateOptions.map(rate => (
                    <TouchableOpacity
                      key={rate}
                      style={[styles.rateButton, speechRate === rate && styles.rateButtonActive]}
                      onPress={() => setSpeechRate(rate)}
                    >
                      <Text style={[styles.rateText, speechRate === rate && styles.rateTextActive]}>
                        {rate}x
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pitch</Text>
              <View style={styles.pitchCard}>
                <View style={styles.pitchLabels}>
                  <Text style={styles.pitchLabel}>Lower</Text>
                  <Text style={styles.pitchValue}>{pitch.toFixed(1)}</Text>
                  <Text style={styles.pitchLabel}>Higher</Text>
                </View>
                <View style={styles.pitchSlider}>
                  <View style={[styles.pitchFill, { width: `${pitch * 50}%` }]} />
                  <View style={[styles.pitchHandle, { left: `${pitch * 50}%` }]} />
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.previewButton}>
              <Ionicons name="play-circle" size={24} color="#FFF" />
              <Text style={styles.previewText}>Preview Voice</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: { padding: 4 },
  title: { fontSize: 17, fontWeight: '600', color: '#1C1C1E' },
  placeholder: { width: 32 },
  content: { flex: 1 },
  mainToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 14,
    padding: 16,
  },
  toggleInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  toggleIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  toggleText: { flex: 1 },
  toggleTitle: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  toggleDesc: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingsCard: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  settingInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  settingLabel: { fontSize: 15, color: '#1C1C1E', marginLeft: 12 },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginHorizontal: 14 },
  voicesCard: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  voiceRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  voiceInfo: { flex: 1 },
  voiceName: { fontSize: 15, fontWeight: '500', color: '#1C1C1E' },
  voiceMeta: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  rateCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 16 },
  rateHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  rateLabel: { fontSize: 15, color: '#1C1C1E' },
  rateValue: { fontSize: 15, fontWeight: '600', color: '#007AFF' },
  rateOptions: { flexDirection: 'row', justifyContent: 'space-between' },
  rateButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    marginHorizontal: 2,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  rateButtonActive: { backgroundColor: '#007AFF' },
  rateText: { fontSize: 14, fontWeight: '500', color: '#1C1C1E' },
  rateTextActive: { color: '#FFF' },
  pitchCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 16 },
  pitchLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  pitchLabel: { fontSize: 12, color: '#8E8E93' },
  pitchValue: { fontSize: 15, fontWeight: '600', color: '#007AFF' },
  pitchSlider: { height: 8, backgroundColor: '#F2F2F7', borderRadius: 4, position: 'relative' },
  pitchFill: { height: '100%', backgroundColor: '#007AFF', borderRadius: 4 },
  pitchHandle: {
    position: 'absolute',
    top: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#007AFF',
    marginLeft: -10,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 14,
  },
  previewText: { fontSize: 17, fontWeight: '600', color: '#FFF', marginLeft: 10 },
  bottomPadding: { height: 40 },
});

export default TextToSpeechScreen;
