import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const AccessibilityScreen: React.FC = () => {
  const [voiceControl, setVoiceControl] = useState(true);
  const [screenReader, setScreenReader] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);

  const voiceCommands = [
    { command: '"Start recording"', action: 'Begins voice recording' },
    { command: '"Stop"', action: 'Stops current action' },
    { command: '"Go back"', action: 'Navigate to previous screen' },
    { command: '"Read transcript"', action: 'Reads aloud current transcript' },
    { command: '"Save"', action: 'Saves current document' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Accessibility</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Voice Settings</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="mic" size={22} color="#007AFF" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingName}>Voice Control</Text>
              <Text style={styles.settingDescription}>Navigate using voice commands</Text>
            </View>
            <Switch
              value={voiceControl}
              onValueChange={setVoiceControl}
              trackColor={{ false: '#E0E0E0', true: '#34C759' }}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="speedometer" size={22} color="#007AFF" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingName}>Voice Speed</Text>
              <Text style={styles.settingDescription}>{voiceSpeed}x playback speed</Text>
            </View>
            <View style={styles.speedControl}>
              <TouchableOpacity onPress={() => setVoiceSpeed(Math.max(0.5, voiceSpeed - 0.25))}>
                <Ionicons name="remove-circle" size={28} color="#007AFF" />
              </TouchableOpacity>
              <Text style={styles.speedValue}>{voiceSpeed}x</Text>
              <TouchableOpacity onPress={() => setVoiceSpeed(Math.min(2.0, voiceSpeed + 0.25))}>
                <Ionicons name="add-circle" size={28} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visual Settings</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="eye" size={22} color="#007AFF" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingName}>Screen Reader Support</Text>
              <Text style={styles.settingDescription}>VoiceOver/TalkBack compatibility</Text>
            </View>
            <Switch
              value={screenReader}
              onValueChange={setScreenReader}
              trackColor={{ false: '#E0E0E0', true: '#34C759' }}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="text" size={22} color="#007AFF" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingName}>Large Text</Text>
              <Text style={styles.settingDescription}>Increase text size throughout app</Text>
            </View>
            <Switch
              value={largeText}
              onValueChange={setLargeText}
              trackColor={{ false: '#E0E0E0', true: '#34C759' }}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="contrast" size={22} color="#007AFF" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingName}>High Contrast</Text>
              <Text style={styles.settingDescription}>Enhance visual contrast</Text>
            </View>
            <Switch
              value={highContrast}
              onValueChange={setHighContrast}
              trackColor={{ false: '#E0E0E0', true: '#34C759' }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Haptic & Audio</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="phone-portrait" size={22} color="#007AFF" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingName}>Haptic Feedback</Text>
              <Text style={styles.settingDescription}>Vibration for interactions</Text>
            </View>
            <Switch
              value={hapticFeedback}
              onValueChange={setHapticFeedback}
              trackColor={{ false: '#E0E0E0', true: '#34C759' }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Voice Commands</Text>
          <Text style={styles.sectionDescription}>
            Available voice commands when Voice Control is enabled
          </Text>

          {voiceCommands.map(cmd => (
            <View key={cmd.command} style={styles.commandItem}>
              <Text style={styles.commandPhrase}>{cmd.command}</Text>
              <Text style={styles.commandAction}>{cmd.action}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: { fontSize: 20, fontWeight: '600', color: '#1A1A1A' },
  content: { flex: 1 },
  section: { backgroundColor: '#FFF', marginBottom: 16, paddingVertical: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionDescription: { fontSize: 13, color: '#666', paddingHorizontal: 16, marginBottom: 12 },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingInfo: { flex: 1, marginRight: 12 },
  settingName: { fontSize: 15, fontWeight: '500', color: '#1A1A1A' },
  settingDescription: { fontSize: 12, color: '#666', marginTop: 2 },
  speedControl: { flexDirection: 'row', alignItems: 'center' },
  speedValue: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginHorizontal: 12 },
  commandItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  commandPhrase: { fontSize: 14, fontWeight: '500', color: '#007AFF' },
  commandAction: { fontSize: 13, color: '#666', marginTop: 2 },
});

export default AccessibilityScreen;
