import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface VoiceCommand {
  id: string;
  phrase: string;
  action: string;
  isEnabled: boolean;
}

const VoiceControlSettingsScreen: React.FC = () => {
  const [voiceControlEnabled, setVoiceControlEnabled] = useState(true);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(true);
  const [feedbackEnabled, setFeedbackEnabled] = useState(true);
  const [continuousListening, setContinuousListening] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');

  const [commands, setCommands] = useState<VoiceCommand[]>([
    { id: '1', phrase: '"Start recording"', action: 'Begin new recording', isEnabled: true },
    { id: '2', phrase: '"Stop recording"', action: 'End current recording', isEnabled: true },
    { id: '3', phrase: '"Pause"', action: 'Pause recording/playback', isEnabled: true },
    { id: '4', phrase: '"Resume"', action: 'Resume recording/playback', isEnabled: true },
    {
      id: '5',
      phrase: '"Add bookmark"',
      action: 'Create bookmark at current time',
      isEnabled: true,
    },
    { id: '6', phrase: '"Take note"', action: 'Start voice note', isEnabled: false },
    { id: '7', phrase: '"Generate summary"', action: 'Create AI summary', isEnabled: true },
  ]);

  const languages = [
    { id: 'en-US', name: 'English (US)', flag: '🇺🇸' },
    { id: 'en-GB', name: 'English (UK)', flag: '🇬🇧' },
    { id: 'es-ES', name: 'Spanish', flag: '🇪🇸' },
    { id: 'fr-FR', name: 'French', flag: '🇫🇷' },
    { id: 'de-DE', name: 'German', flag: '🇩🇪' },
  ];

  const toggleCommand = (id: string) => {
    setCommands(prev => prev.map(c => (c.id === id ? { ...c, isEnabled: !c.isEnabled } : c)));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Voice Control</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statusCard}>
          <View
            style={[
              styles.statusIcon,
              { backgroundColor: voiceControlEnabled ? '#34C75920' : '#8E8E9320' },
            ]}
          >
            <Ionicons name="mic" size={32} color={voiceControlEnabled ? '#34C759' : '#8E8E93'} />
          </View>
          <Text style={styles.statusTitle}>
            Voice Control is {voiceControlEnabled ? 'On' : 'Off'}
          </Text>
          <Text style={styles.statusDesc}>
            {voiceControlEnabled
              ? 'Say "Hey VoiceCode" to activate'
              : 'Enable to use voice commands'}
          </Text>
          <Switch
            value={voiceControlEnabled}
            onValueChange={setVoiceControlEnabled}
            trackColor={{ false: '#E5E5EA', true: '#34C759' }}
            thumbColor="#FFF"
            style={styles.mainSwitch}
          />
        </View>

        {voiceControlEnabled && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Settings</Text>
              <View style={styles.settingsCard}>
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="radio" size={20} color="#FF9500" />
                    <View style={styles.settingText}>
                      <Text style={styles.settingLabel}>Wake Word</Text>
                      <Text style={styles.settingDesc}>&quot;Hey VoiceCode&quot; activation</Text>
                    </View>
                  </View>
                  <Switch
                    value={wakeWordEnabled}
                    onValueChange={setWakeWordEnabled}
                    trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                    thumbColor="#FFF"
                  />
                </View>
                <View style={styles.divider} />
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="volume-high" size={20} color="#007AFF" />
                    <View style={styles.settingText}>
                      <Text style={styles.settingLabel}>Audio Feedback</Text>
                      <Text style={styles.settingDesc}>Play sound when command recognized</Text>
                    </View>
                  </View>
                  <Switch
                    value={feedbackEnabled}
                    onValueChange={setFeedbackEnabled}
                    trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                    thumbColor="#FFF"
                  />
                </View>
                <View style={styles.divider} />
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="ear" size={20} color="#AF52DE" />
                    <View style={styles.settingText}>
                      <Text style={styles.settingLabel}>Continuous Listening</Text>
                      <Text style={styles.settingDesc}>Always listen for commands</Text>
                    </View>
                  </View>
                  <Switch
                    value={continuousListening}
                    onValueChange={setContinuousListening}
                    trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                    thumbColor="#FFF"
                  />
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Language</Text>
              <View style={styles.languageCard}>
                {languages.map((lang, idx) => (
                  <View key={lang.id}>
                    <TouchableOpacity
                      style={styles.languageRow}
                      onPress={() => setSelectedLanguage(lang.id)}
                    >
                      <Text style={styles.languageFlag}>{lang.flag}</Text>
                      <Text style={styles.languageName}>{lang.name}</Text>
                      {selectedLanguage === lang.id && (
                        <Ionicons name="checkmark" size={20} color="#007AFF" />
                      )}
                    </TouchableOpacity>
                    {idx < languages.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Voice Commands</Text>
                <TouchableOpacity>
                  <Text style={styles.customizeText}>Customize</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.commandsCard}>
                {commands.map((cmd, idx) => (
                  <View key={cmd.id}>
                    <View style={styles.commandRow}>
                      <View style={styles.commandInfo}>
                        <Text style={styles.commandPhrase}>{cmd.phrase}</Text>
                        <Text style={styles.commandAction}>{cmd.action}</Text>
                      </View>
                      <Switch
                        value={cmd.isEnabled}
                        onValueChange={() => toggleCommand(cmd.id)}
                        trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                        thumbColor="#FFF"
                      />
                    </View>
                    {idx < commands.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </View>
              <TouchableOpacity style={styles.addCommandButton}>
                <Ionicons name="add" size={20} color="#007AFF" />
                <Text style={styles.addCommandText}>Add Custom Command</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.testButton}>
              <Ionicons name="mic-circle" size={24} color="#FFF" />
              <Text style={styles.testButtonText}>Test Voice Commands</Text>
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
  statusCard: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 16,
    padding: 24,
  },
  statusIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: { fontSize: 20, fontWeight: '700', color: '#1C1C1E' },
  statusDesc: { fontSize: 14, color: '#8E8E93', marginTop: 8, textAlign: 'center' },
  mainSwitch: { marginTop: 16, transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  customizeText: { fontSize: 14, color: '#007AFF' },
  settingsCard: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  settingInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  settingText: { marginLeft: 12, flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '500', color: '#1C1C1E' },
  settingDesc: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginHorizontal: 14 },
  languageCard: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  languageRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  languageFlag: { fontSize: 24, marginRight: 12 },
  languageName: { flex: 1, fontSize: 15, color: '#1C1C1E' },
  commandsCard: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  commandRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  commandInfo: { flex: 1 },
  commandPhrase: { fontSize: 15, fontWeight: '600', color: '#007AFF' },
  commandAction: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  addCommandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  addCommandText: { fontSize: 15, color: '#007AFF', marginLeft: 8 },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 14,
  },
  testButtonText: { fontSize: 17, fontWeight: '600', color: '#FFF', marginLeft: 10 },
  bottomPadding: { height: 40 },
});

export default VoiceControlSettingsScreen;
