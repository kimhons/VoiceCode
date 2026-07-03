import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const NoiseReductionScreen: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [reductionLevel, setReductionLevel] = useState(65);
  const [autoEnhance, setAutoEnhance] = useState(true);
  const [preserveVoice, setPreserveVoice] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewMode, setPreviewMode] = useState('after');

  const presets = [
    { id: 'light', name: 'Light', level: 30, desc: 'Minimal processing' },
    { id: 'moderate', name: 'Moderate', level: 50, desc: 'Balanced reduction' },
    { id: 'strong', name: 'Strong', level: 75, desc: 'Heavy filtering' },
    { id: 'custom', name: 'Custom', level: reductionLevel, desc: 'Your settings' },
  ];

  const noiseTypes = [
    { id: 'background', name: 'Background Noise', enabled: true, icon: 'volume-low' },
    { id: 'echo', name: 'Echo & Reverb', enabled: true, icon: 'radio' },
    { id: 'hum', name: 'Electrical Hum', enabled: false, icon: 'flash' },
    { id: 'wind', name: 'Wind Noise', enabled: false, icon: 'cloudy' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Noise Reduction</Text>
        <TouchableOpacity style={styles.applyButton}>
          <Text style={styles.applyText}>Apply</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.waveformCard}>
          <View style={styles.waveformHeader}>
            <Text style={styles.waveformTitle}>Preview</Text>
            <View style={styles.previewToggle}>
              <TouchableOpacity
                style={[styles.toggleBtn, previewMode === 'before' && styles.toggleBtnActive]}
                onPress={() => setPreviewMode('before')}
              >
                <Text
                  style={[styles.toggleText, previewMode === 'before' && styles.toggleTextActive]}
                >
                  Before
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, previewMode === 'after' && styles.toggleBtnActive]}
                onPress={() => setPreviewMode('after')}
              >
                <Text
                  style={[styles.toggleText, previewMode === 'after' && styles.toggleTextActive]}
                >
                  After
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.waveform}>
            {Array.from({ length: 40 }, (_, i) => (
              <View
                key={i}
                style={[styles.waveformBar, { height: `${20 + Math.random() * 60}%` }]}
              />
            ))}
          </View>
          <View style={styles.playbackControls}>
            <TouchableOpacity style={styles.skipButton}>
              <Ionicons name="play-back" size={24} color="#1C1C1E" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.playButton} onPress={() => setIsPlaying(!isPlaying)}>
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={28} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.skipButton}>
              <Ionicons name="play-forward" size={24} color="#1C1C1E" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Noise Reduction</Text>
            <Switch
              value={isEnabled}
              onValueChange={setIsEnabled}
              trackColor={{ false: '#E5E5EA', true: '#34C759' }}
              thumbColor="#FFF"
            />
          </View>

          {isEnabled && (
            <>
              <View style={styles.levelCard}>
                <View style={styles.levelHeader}>
                  <Text style={styles.levelLabel}>Reduction Level</Text>
                  <Text style={styles.levelValue}>{reductionLevel}%</Text>
                </View>
                <View style={styles.slider}>
                  <View style={[styles.sliderFill, { width: `${reductionLevel}%` }]} />
                  <View style={[styles.sliderHandle, { left: `${reductionLevel}%` }]} />
                </View>
              </View>

              <View style={styles.presetsCard}>
                <Text style={styles.presetsLabel}>Presets</Text>
                <View style={styles.presetsGrid}>
                  {presets.map(preset => (
                    <TouchableOpacity
                      key={preset.id}
                      style={[
                        styles.presetButton,
                        reductionLevel === preset.level && styles.presetButtonActive,
                      ]}
                      onPress={() => setReductionLevel(preset.level)}
                    >
                      <Text
                        style={[
                          styles.presetName,
                          reductionLevel === preset.level && styles.presetNameActive,
                        ]}
                      >
                        {preset.name}
                      </Text>
                      <Text
                        style={[
                          styles.presetDesc,
                          reductionLevel === preset.level && styles.presetDescActive,
                        ]}
                      >
                        {preset.desc}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Noise Types</Text>
          <View style={styles.typesCard}>
            {noiseTypes.map((type, idx) => (
              <View key={type.id}>
                <View style={styles.typeRow}>
                  <View style={styles.typeIcon}>
                    <Ionicons name={type.icon as any} size={20} color="#007AFF" />
                  </View>
                  <Text style={styles.typeName}>{type.name}</Text>
                  <Switch
                    value={type.enabled}
                    trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                    thumbColor="#FFF"
                  />
                </View>
                {idx < noiseTypes.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Advanced</Text>
          <View style={styles.advancedCard}>
            <View style={styles.advancedRow}>
              <View style={styles.advancedInfo}>
                <Text style={styles.advancedLabel}>Auto-Enhance Voice</Text>
                <Text style={styles.advancedDesc}>Boost vocal clarity</Text>
              </View>
              <Switch
                value={autoEnhance}
                onValueChange={setAutoEnhance}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.advancedRow}>
              <View style={styles.advancedInfo}>
                <Text style={styles.advancedLabel}>Preserve Voice Quality</Text>
                <Text style={styles.advancedDesc}>Protect voice characteristics</Text>
              </View>
              <Switch
                value={preserveVoice}
                onValueChange={setPreserveVoice}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </View>

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
  applyButton: { padding: 4 },
  applyText: { fontSize: 17, color: '#007AFF', fontWeight: '600' },
  content: { flex: 1 },
  waveformCard: { backgroundColor: '#1C1C1E', margin: 16, borderRadius: 16, padding: 16 },
  waveformHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  waveformTitle: { fontSize: 14, color: '#8E8E93' },
  previewToggle: { flexDirection: 'row', backgroundColor: '#3A3A3C', borderRadius: 8, padding: 2 },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  toggleBtnActive: { backgroundColor: '#007AFF' },
  toggleText: { fontSize: 12, color: '#8E8E93' },
  toggleTextActive: { color: '#FFF' },
  waveform: { flexDirection: 'row', alignItems: 'center', height: 80, marginBottom: 16 },
  waveformBar: { flex: 1, backgroundColor: '#007AFF', marginHorizontal: 1, borderRadius: 2 },
  playbackControls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  skipButton: { padding: 12 },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  levelCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, marginBottom: 12 },
  levelHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  levelLabel: { fontSize: 15, color: '#1C1C1E' },
  levelValue: { fontSize: 15, fontWeight: '600', color: '#007AFF' },
  slider: { height: 8, backgroundColor: '#F2F2F7', borderRadius: 4, position: 'relative' },
  sliderFill: { height: '100%', backgroundColor: '#007AFF', borderRadius: 4 },
  sliderHandle: {
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
  presetsCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 16 },
  presetsLabel: { fontSize: 13, color: '#8E8E93', marginBottom: 12 },
  presetsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  presetButton: {
    width: '48%',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 12,
    margin: '1%',
  },
  presetButtonActive: { backgroundColor: '#007AFF' },
  presetName: { fontSize: 14, fontWeight: '600', color: '#1C1C1E' },
  presetNameActive: { color: '#FFF' },
  presetDesc: { fontSize: 11, color: '#8E8E93', marginTop: 2 },
  presetDescActive: { color: '#FFF' },
  typesCard: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  typeRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#007AFF15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  typeName: { flex: 1, fontSize: 15, color: '#1C1C1E' },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginHorizontal: 14 },
  advancedCard: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  advancedRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  advancedInfo: { flex: 1 },
  advancedLabel: { fontSize: 15, color: '#1C1C1E' },
  advancedDesc: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  bottomPadding: { height: 40 },
});

export default NoiseReductionScreen;
