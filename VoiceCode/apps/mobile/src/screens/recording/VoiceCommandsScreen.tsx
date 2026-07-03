import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface VoiceCommand {
  id: string;
  phrase: string;
  action: string;
  category: string;
  isCustom: boolean;
  isEnabled: boolean;
}

const VoiceCommandsScreen: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [voiceCommandsEnabled, setVoiceCommandsEnabled] = useState(true);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'recording', label: 'Recording' },
    { id: 'navigation', label: 'Navigation' },
    { id: 'editing', label: 'Editing' },
    { id: 'custom', label: 'Custom' },
  ];

  const [commands, setCommands] = useState<VoiceCommand[]>([
    {
      id: '1',
      phrase: 'Start recording',
      action: 'Begin audio capture',
      category: 'recording',
      isCustom: false,
      isEnabled: true,
    },
    {
      id: '2',
      phrase: 'Stop recording',
      action: 'End audio capture',
      category: 'recording',
      isCustom: false,
      isEnabled: true,
    },
    {
      id: '3',
      phrase: 'Pause',
      action: 'Pause current recording',
      category: 'recording',
      isCustom: false,
      isEnabled: true,
    },
    {
      id: '4',
      phrase: 'Resume',
      action: 'Resume paused recording',
      category: 'recording',
      isCustom: false,
      isEnabled: true,
    },
    {
      id: '5',
      phrase: 'Add bookmark',
      action: 'Insert bookmark at current time',
      category: 'recording',
      isCustom: false,
      isEnabled: true,
    },
    {
      id: '6',
      phrase: 'Go to library',
      action: 'Navigate to recordings library',
      category: 'navigation',
      isCustom: false,
      isEnabled: true,
    },
    {
      id: '7',
      phrase: 'Open settings',
      action: 'Navigate to settings',
      category: 'navigation',
      isCustom: false,
      isEnabled: true,
    },
    {
      id: '8',
      phrase: 'Search transcripts',
      action: 'Open transcript search',
      category: 'navigation',
      isCustom: false,
      isEnabled: true,
    },
    {
      id: '9',
      phrase: 'Delete last word',
      action: 'Remove last transcribed word',
      category: 'editing',
      isCustom: false,
      isEnabled: true,
    },
    {
      id: '10',
      phrase: 'New paragraph',
      action: 'Insert paragraph break',
      category: 'editing',
      isCustom: false,
      isEnabled: true,
    },
    {
      id: '11',
      phrase: 'Undo',
      action: 'Undo last action',
      category: 'editing',
      isCustom: false,
      isEnabled: true,
    },
    {
      id: '12',
      phrase: 'Hey VoiceCode, take notes',
      action: 'Start quick note capture',
      category: 'custom',
      isCustom: true,
      isEnabled: true,
    },
    {
      id: '13',
      phrase: 'Send to patient file',
      action: 'Export to EHR',
      category: 'custom',
      isCustom: true,
      isEnabled: true,
    },
  ]);

  const filteredCommands = commands.filter(
    cmd => selectedCategory === 'all' || cmd.category === selectedCategory
  );

  const toggleCommand = (id: string) => {
    setCommands(prev =>
      prev.map(cmd => (cmd.id === id ? { ...cmd, isEnabled: !cmd.isEnabled } : cmd))
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Voice Commands</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.listeningCard}>
          <TouchableOpacity
            style={[styles.listenButton, isListening && styles.listenButtonActive]}
            onPress={() => setIsListening(!isListening)}
          >
            <View
              style={[styles.listenIconContainer, isListening && styles.listenIconContainerActive]}
            >
              <Ionicons name="mic" size={32} color={isListening ? '#FFF' : '#007AFF'} />
            </View>
            <Text style={[styles.listenText, isListening && styles.listenTextActive]}>
              {isListening ? 'Listening...' : 'Tap to Test'}
            </Text>
          </TouchableOpacity>
          {isListening && (
            <View style={styles.waveform}>
              {[0.3, 0.6, 0.4, 0.8, 0.5, 0.7, 0.4, 0.9, 0.5].map((h, i) => (
                <View key={i} style={[styles.waveBar, { height: 30 * h }]} />
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="mic-circle" size={22} color="#007AFF" />
                <Text style={styles.settingLabel}>Voice Commands</Text>
              </View>
              <Switch
                value={voiceCommandsEnabled}
                onValueChange={setVoiceCommandsEnabled}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="volume-high" size={22} color="#FF9500" />
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingLabel}>Wake Word</Text>
                  <Text style={styles.settingSubtext}>&quot;Hey VoiceCode&quot;</Text>
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
            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="language" size={22} color="#AF52DE" />
                <Text style={styles.settingLabel}>Language</Text>
              </View>
              <View style={styles.settingValue}>
                <Text style={styles.settingValueText}>English (US)</Text>
                <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Commands</Text>
            <Text style={styles.commandCount}>
              {commands.filter(c => c.isEnabled).length} active
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === cat.id && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === cat.id && styles.categoryTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.commandsList}>
            {filteredCommands.map(command => (
              <View key={command.id} style={styles.commandCard}>
                <View style={styles.commandContent}>
                  <View style={styles.commandHeader}>
                    <Text style={styles.commandPhrase}>&quot;{command.phrase}&quot;</Text>
                    {command.isCustom && (
                      <View style={styles.customBadge}>
                        <Text style={styles.customBadgeText}>Custom</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.commandAction}>{command.action}</Text>
                </View>
                <Switch
                  value={command.isEnabled}
                  onValueChange={() => toggleCommand(command.id)}
                  trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                  thumbColor="#FFF"
                />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.trainButton}>
            <Ionicons name="school" size={22} color="#FFF" />
            <View style={styles.trainTextContainer}>
              <Text style={styles.trainTitle}>Train Voice Recognition</Text>
              <Text style={styles.trainSubtext}>Improve accuracy with your voice</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
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
  addButton: { padding: 4 },
  content: { flex: 1 },
  listeningCard: {
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  listenButton: { alignItems: 'center' },
  listenButtonActive: {},
  listenIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  listenIconContainerActive: { backgroundColor: '#007AFF' },
  listenText: { fontSize: 16, fontWeight: '500', color: '#8E8E93' },
  listenTextActive: { color: '#007AFF' },
  waveform: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  waveBar: { width: 4, backgroundColor: '#007AFF', borderRadius: 2, marginHorizontal: 3 },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1C1C1E', marginBottom: 12 },
  commandCount: { fontSize: 13, color: '#8E8E93' },
  settingsCard: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  settingInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  settingTextContainer: { marginLeft: 12 },
  settingLabel: { fontSize: 15, color: '#1C1C1E', marginLeft: 12 },
  settingSubtext: { fontSize: 12, color: '#8E8E93', marginLeft: 12, marginTop: 2 },
  settingValue: { flexDirection: 'row', alignItems: 'center' },
  settingValueText: { fontSize: 15, color: '#8E8E93', marginRight: 4 },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginHorizontal: 14 },
  categoriesScroll: { marginBottom: 12 },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipActive: { backgroundColor: '#007AFF' },
  categoryText: { fontSize: 14, color: '#8E8E93' },
  categoryTextActive: { color: '#FFF', fontWeight: '500' },
  commandsList: {},
  commandCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  commandContent: { flex: 1 },
  commandHeader: { flexDirection: 'row', alignItems: 'center' },
  commandPhrase: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  customBadge: {
    backgroundColor: '#AF52DE20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  customBadgeText: { fontSize: 11, fontWeight: '600', color: '#AF52DE' },
  commandAction: { fontSize: 13, color: '#8E8E93', marginTop: 4 },
  trainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5856D6',
    borderRadius: 14,
    padding: 16,
  },
  trainTextContainer: { flex: 1, marginLeft: 12 },
  trainTitle: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  trainSubtext: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  bottomPadding: { height: 40 },
});

export default VoiceCommandsScreen;
