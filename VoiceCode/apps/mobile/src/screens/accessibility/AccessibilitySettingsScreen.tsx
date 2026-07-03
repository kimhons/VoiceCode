import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const AccessibilitySettingsScreen: React.FC = () => {
  const [voiceOverEnabled, setVoiceOverEnabled] = useState(true);
  const [largeTextEnabled, setLargeTextEnabled] = useState(false);
  const [highContrastEnabled, setHighContrastEnabled] = useState(false);
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [audioDescriptions, setAudioDescriptions] = useState(false);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);
  const [colorBlindMode, setColorBlindMode] = useState('none');

  const colorBlindOptions = [
    { id: 'none', label: 'None' },
    { id: 'protanopia', label: 'Protanopia (Red-Weak)' },
    { id: 'deuteranopia', label: 'Deuteranopia (Green-Weak)' },
    { id: 'tritanopia', label: 'Tritanopia (Blue-Weak)' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Accessibility</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vision</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View style={[styles.settingIcon, { backgroundColor: '#007AFF20' }]}>
                  <Ionicons name="eye" size={20} color="#007AFF" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>VoiceOver Support</Text>
                  <Text style={styles.settingDesc}>Screen reader compatibility</Text>
                </View>
              </View>
              <Switch
                value={voiceOverEnabled}
                onValueChange={setVoiceOverEnabled}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View style={[styles.settingIcon, { backgroundColor: '#FF950020' }]}>
                  <Ionicons name="text" size={20} color="#FF9500" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Large Text</Text>
                  <Text style={styles.settingDesc}>Increase text size throughout app</Text>
                </View>
              </View>
              <Switch
                value={largeTextEnabled}
                onValueChange={setLargeTextEnabled}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View style={[styles.settingIcon, { backgroundColor: '#1C1C1E20' }]}>
                  <Ionicons name="contrast" size={20} color="#1C1C1E" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>High Contrast</Text>
                  <Text style={styles.settingDesc}>Increase color contrast</Text>
                </View>
              </View>
              <Switch
                value={highContrastEnabled}
                onValueChange={setHighContrastEnabled}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Color Blind Support</Text>
          <View style={styles.optionsCard}>
            {colorBlindOptions.map((option, idx) => (
              <View key={option.id}>
                <TouchableOpacity
                  style={styles.optionRow}
                  onPress={() => setColorBlindMode(option.id)}
                >
                  <Text style={styles.optionLabel}>{option.label}</Text>
                  <View
                    style={[
                      styles.radioOuter,
                      colorBlindMode === option.id && styles.radioOuterSelected,
                    ]}
                  >
                    {colorBlindMode === option.id && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
                {idx < colorBlindOptions.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Motion</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View style={[styles.settingIcon, { backgroundColor: '#AF52DE20' }]}>
                  <Ionicons name="pause" size={20} color="#AF52DE" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Reduce Motion</Text>
                  <Text style={styles.settingDesc}>Minimize animations and effects</Text>
                </View>
              </View>
              <Switch
                value={reduceMotionEnabled}
                onValueChange={setReduceMotionEnabled}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audio & Haptics</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View style={[styles.settingIcon, { backgroundColor: '#FF3B3020' }]}>
                  <Ionicons name="phone-portrait" size={20} color="#FF3B30" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Haptic Feedback</Text>
                  <Text style={styles.settingDesc}>Vibration for interactions</Text>
                </View>
              </View>
              <Switch
                value={hapticFeedback}
                onValueChange={setHapticFeedback}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View style={[styles.settingIcon, { backgroundColor: '#5856D620' }]}>
                  <Ionicons name="musical-notes" size={20} color="#5856D6" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Audio Descriptions</Text>
                  <Text style={styles.settingDesc}>Spoken descriptions of visual content</Text>
                </View>
              </View>
              <Switch
                value={audioDescriptions}
                onValueChange={setAudioDescriptions}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Captions & Subtitles</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View style={[styles.settingIcon, { backgroundColor: '#34C75920' }]}>
                  <Ionicons name="chatbox" size={20} color="#34C759" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Show Subtitles</Text>
                  <Text style={styles.settingDesc}>Display captions for audio content</Text>
                </View>
              </View>
              <Switch
                value={subtitlesEnabled}
                onValueChange={setSubtitlesEnabled}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View style={[styles.settingIcon, { backgroundColor: '#00C7BE20' }]}>
                  <Ionicons name="settings" size={20} color="#00C7BE" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Caption Style</Text>
                  <Text style={styles.settingDesc}>Customize appearance</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#007AFF" />
          <Text style={styles.infoText}>
            Some accessibility features require system-level settings. Visit your device settings
            for more options.
          </Text>
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
  placeholder: { width: 32 },
  content: { flex: 1 },
  section: { paddingHorizontal: 16, marginTop: 16, marginBottom: 8 },
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
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: { flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '500', color: '#1C1C1E' },
  settingDesc: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginHorizontal: 14 },
  optionsCard: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  optionRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  optionLabel: { flex: 1, fontSize: 15, color: '#1C1C1E' },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: { borderColor: '#007AFF' },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#007AFF' },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#007AFF10',
    margin: 16,
    borderRadius: 14,
    padding: 16,
  },
  infoText: { flex: 1, fontSize: 14, color: '#007AFF', marginLeft: 12, lineHeight: 20 },
  bottomPadding: { height: 40 },
});

export default AccessibilitySettingsScreen;
