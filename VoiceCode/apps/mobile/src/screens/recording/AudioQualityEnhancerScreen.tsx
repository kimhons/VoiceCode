import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

interface AudioPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const AudioQualityEnhancerScreen: React.FC = () => {
  const [noiseReduction, setNoiseReduction] = useState(0.7);
  const [voiceEnhancement, setVoiceEnhancement] = useState(0.5);
  const [echoRemoval, setEchoRemoval] = useState(0.6);
  const [volumeNormalization, setVolumeNormalization] = useState(true);
  const [autoGainControl, setAutoGainControl] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState('meeting');
  const [isProcessing, setIsProcessing] = useState(false);

  const presets: AudioPreset[] = [
    {
      id: 'meeting',
      name: 'Meeting Room',
      description: 'Optimized for conference calls',
      icon: 'people',
    },
    { id: 'interview', name: 'Interview', description: 'Clear voice capture', icon: 'mic' },
    { id: 'lecture', name: 'Lecture Hall', description: 'Large room acoustics', icon: 'school' },
    { id: 'outdoor', name: 'Outdoor', description: 'Wind and ambient noise', icon: 'leaf' },
    { id: 'phone', name: 'Phone Call', description: 'Telephone audio cleanup', icon: 'call' },
    { id: 'custom', name: 'Custom', description: 'Your settings', icon: 'settings' },
  ];

  const applyEnhancements = () => {
    setIsProcessing(true);
    setTimeout(() => setIsProcessing(false), 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Audio Enhancement</Text>
        <TouchableOpacity style={styles.resetButton}>
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.waveformPreview}>
          <View style={styles.waveformHeader}>
            <Text style={styles.waveformLabel}>Before</Text>
            <Text style={styles.waveformLabel}>After</Text>
          </View>
          <View style={styles.waveformComparison}>
            <View style={styles.waveformOriginal}>
              {[0.3, 0.6, 0.4, 0.8, 0.5, 0.7, 0.3, 0.9, 0.4, 0.6].map((h, i) => (
                <View
                  key={i}
                  style={[styles.waveBar, { height: 40 * h, backgroundColor: '#8E8E93' }]}
                />
              ))}
            </View>
            <View style={styles.waveformDivider}>
              <Ionicons name="arrow-forward" size={20} color="#007AFF" />
            </View>
            <View style={styles.waveformEnhanced}>
              {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 0.4, 0.95, 0.5, 0.7].map((h, i) => (
                <View
                  key={i}
                  style={[styles.waveBar, { height: 40 * h, backgroundColor: '#34C759' }]}
                />
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Presets</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presetsScroll}
          >
            {presets.map(preset => (
              <TouchableOpacity
                key={preset.id}
                style={[styles.presetCard, selectedPreset === preset.id && styles.presetCardActive]}
                onPress={() => setSelectedPreset(preset.id)}
              >
                <View
                  style={[
                    styles.presetIcon,
                    selectedPreset === preset.id && styles.presetIconActive,
                  ]}
                >
                  <Ionicons
                    name={preset.icon as any}
                    size={24}
                    color={selectedPreset === preset.id ? '#FFF' : '#007AFF'}
                  />
                </View>
                <Text
                  style={[
                    styles.presetName,
                    selectedPreset === preset.id && styles.presetNameActive,
                  ]}
                >
                  {preset.name}
                </Text>
                <Text style={styles.presetDescription}>{preset.description}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fine Tuning</Text>
          <View style={styles.slidersCard}>
            <View style={styles.sliderRow}>
              <View style={styles.sliderHeader}>
                <Ionicons name="volume-mute" size={20} color="#FF3B30" />
                <Text style={styles.sliderLabel}>Noise Reduction</Text>
                <Text style={styles.sliderValue}>{Math.round(noiseReduction * 100)}%</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                value={noiseReduction}
                onValueChange={setNoiseReduction}
                minimumTrackTintColor="#FF3B30"
                maximumTrackTintColor="#E5E5EA"
                thumbTintColor="#FF3B30"
              />
            </View>

            <View style={styles.sliderRow}>
              <View style={styles.sliderHeader}>
                <Ionicons name="mic" size={20} color="#007AFF" />
                <Text style={styles.sliderLabel}>Voice Enhancement</Text>
                <Text style={styles.sliderValue}>{Math.round(voiceEnhancement * 100)}%</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                value={voiceEnhancement}
                onValueChange={setVoiceEnhancement}
                minimumTrackTintColor="#007AFF"
                maximumTrackTintColor="#E5E5EA"
                thumbTintColor="#007AFF"
              />
            </View>

            <View style={styles.sliderRow}>
              <View style={styles.sliderHeader}>
                <Ionicons name="radio" size={20} color="#AF52DE" />
                <Text style={styles.sliderLabel}>Echo Removal</Text>
                <Text style={styles.sliderValue}>{Math.round(echoRemoval * 100)}%</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                value={echoRemoval}
                onValueChange={setEchoRemoval}
                minimumTrackTintColor="#AF52DE"
                maximumTrackTintColor="#E5E5EA"
                thumbTintColor="#AF52DE"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Automatic Processing</Text>
          <View style={styles.togglesCard}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Ionicons name="trending-up" size={20} color="#34C759" />
                <View style={styles.toggleText}>
                  <Text style={styles.toggleLabel}>Volume Normalization</Text>
                  <Text style={styles.toggleDescription}>Balance audio levels across speakers</Text>
                </View>
              </View>
              <Switch
                value={volumeNormalization}
                onValueChange={setVolumeNormalization}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Ionicons name="options" size={20} color="#FF9500" />
                <View style={styles.toggleText}>
                  <Text style={styles.toggleLabel}>Auto Gain Control</Text>
                  <Text style={styles.toggleDescription}>Automatically adjust input levels</Text>
                </View>
              </View>
              <Switch
                value={autoGainControl}
                onValueChange={setAutoGainControl}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.qualityMetrics}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>92%</Text>
              <Text style={styles.metricLabel}>Clarity Score</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>-18dB</Text>
              <Text style={styles.metricLabel}>Noise Floor</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>Good</Text>
              <Text style={styles.metricLabel}>Quality</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.previewButton}>
          <Ionicons name="play" size={20} color="#007AFF" />
          <Text style={styles.previewText}>Preview</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.applyButton, isProcessing && styles.applyButtonProcessing]}
          onPress={applyEnhancements}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Text style={styles.applyText}>Processing...</Text>
          ) : (
            <>
              <Ionicons name="sparkles" size={20} color="#FFF" />
              <Text style={styles.applyText}>Apply Enhancements</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
  resetButton: { padding: 4 },
  resetText: { fontSize: 15, color: '#FF3B30' },
  content: { flex: 1 },
  waveformPreview: { backgroundColor: '#1C1C1E', padding: 20, margin: 16, borderRadius: 16 },
  waveformHeader: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  waveformLabel: { fontSize: 13, color: '#8E8E93', fontWeight: '500' },
  waveformComparison: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  waveformOriginal: { flexDirection: 'row', alignItems: 'center', height: 50 },
  waveformDivider: { marginHorizontal: 16 },
  waveformEnhanced: { flexDirection: 'row', alignItems: 'center', height: 50 },
  waveBar: { width: 6, borderRadius: 3, marginHorizontal: 2 },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1C1C1E', marginBottom: 12 },
  presetsScroll: { paddingRight: 16 },
  presetCard: {
    width: 120,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginRight: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetCardActive: { borderColor: '#007AFF', backgroundColor: '#007AFF08' },
  presetIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF10',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  presetIconActive: { backgroundColor: '#007AFF' },
  presetName: { fontSize: 14, fontWeight: '600', color: '#1C1C1E', textAlign: 'center' },
  presetNameActive: { color: '#007AFF' },
  presetDescription: { fontSize: 11, color: '#8E8E93', textAlign: 'center', marginTop: 4 },
  slidersCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 16 },
  sliderRow: { marginBottom: 20 },
  sliderHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  sliderLabel: { fontSize: 15, color: '#1C1C1E', marginLeft: 10, flex: 1 },
  sliderValue: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  slider: { width: '100%', height: 40 },
  togglesCard: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  toggleInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  toggleText: { marginLeft: 12, flex: 1 },
  toggleLabel: { fontSize: 15, fontWeight: '500', color: '#1C1C1E' },
  toggleDescription: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginHorizontal: 14 },
  qualityMetrics: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 14, padding: 16 },
  metricItem: { flex: 1, alignItems: 'center' },
  metricValue: { fontSize: 20, fontWeight: '700', color: '#34C759' },
  metricLabel: { fontSize: 12, color: '#8E8E93', marginTop: 4 },
  metricDivider: { width: 1, backgroundColor: '#E5E5EA' },
  bottomPadding: { height: 100 },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    marginRight: 10,
  },
  previewText: { fontSize: 15, fontWeight: '600', color: '#007AFF', marginLeft: 6 },
  applyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
  },
  applyButtonProcessing: { backgroundColor: '#8E8E93' },
  applyText: { fontSize: 16, fontWeight: '600', color: '#FFF', marginLeft: 8 },
});

export default AudioQualityEnhancerScreen;
