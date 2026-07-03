import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface VoiceStyle {
  id: string;
  name: string;
  description: string;
}

interface WritingPreference {
  id: string;
  label: string;
  options: string[];
  selected: string;
}

const ScribePersonalizationScreen: React.FC = () => {
  const [autoCapitalize, setAutoCapitalize] = useState(true);
  const [smartPunctuation, setSmartPunctuation] = useState(true);
  const [medicalAbbreviations, setMedicalAbbreviations] = useState(true);
  const [selectedVoiceStyle, setSelectedVoiceStyle] = useState('formal');
  const [customPhrases, setCustomPhrases] = useState<string[]>([
    'The patient presents with...',
    'Upon examination, findings include...',
    'Plan of care includes...',
  ]);
  const [newPhrase, setNewPhrase] = useState('');

  const voiceStyles: VoiceStyle[] = [
    {
      id: 'formal',
      name: 'Formal Clinical',
      description: 'Professional medical documentation style',
    },
    { id: 'concise', name: 'Concise', description: 'Brief, to-the-point documentation' },
    { id: 'detailed', name: 'Detailed Narrative', description: 'Comprehensive patient narratives' },
    { id: 'conversational', name: 'Conversational', description: 'Natural, readable format' },
  ];

  const [writingPreferences, setWritingPreferences] = useState<WritingPreference[]>([
    {
      id: 'spelling',
      label: 'Spelling Convention',
      options: ['US English', 'UK English', 'Australian'],
      selected: 'US English',
    },
    {
      id: 'dateFormat',
      label: 'Date Format',
      options: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'],
      selected: 'MM/DD/YYYY',
    },
    {
      id: 'timeFormat',
      label: 'Time Format',
      options: ['12-hour', '24-hour'],
      selected: '24-hour',
    },
    {
      id: 'units',
      label: 'Measurement Units',
      options: ['Metric', 'Imperial', 'Both'],
      selected: 'Metric',
    },
  ]);

  const updatePreference = (id: string, value: string) => {
    setWritingPreferences(prev => prev.map(p => (p.id === id ? { ...p, selected: value } : p)));
  };

  const addCustomPhrase = () => {
    if (newPhrase.trim()) {
      setCustomPhrases(prev => [...prev, newPhrase.trim()]);
      setNewPhrase('');
    }
  };

  const removeCustomPhrase = (index: number) => {
    setCustomPhrases(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Scribe Personalization</Text>
        <TouchableOpacity style={styles.resetButton}>
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Writing Style</Text>
          <Text style={styles.sectionDescription}>Choose how your AI scribe formats notes</Text>

          <View style={styles.voiceStyleGrid}>
            {voiceStyles.map(style => (
              <TouchableOpacity
                key={style.id}
                style={[
                  styles.voiceStyleCard,
                  selectedVoiceStyle === style.id && styles.voiceStyleCardActive,
                ]}
                onPress={() => setSelectedVoiceStyle(style.id)}
              >
                <View style={styles.voiceStyleHeader}>
                  <Text
                    style={[
                      styles.voiceStyleName,
                      selectedVoiceStyle === style.id && styles.voiceStyleNameActive,
                    ]}
                  >
                    {style.name}
                  </Text>
                  {selectedVoiceStyle === style.id && (
                    <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
                  )}
                </View>
                <Text style={styles.voiceStyleDescription}>{style.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Formatting Preferences</Text>

          {writingPreferences.map(pref => (
            <View key={pref.id} style={styles.preferenceItem}>
              <Text style={styles.preferenceLabel}>{pref.label}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.optionsScroll}
              >
                {pref.options.map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.optionChip, pref.selected === option && styles.optionChipActive]}
                    onPress={() => updatePreference(pref.id, option)}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        pref.selected === option && styles.optionChipTextActive,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Auto-Formatting</Text>

          <View style={styles.toggleCard}>
            <View style={styles.toggleItem}>
              <View style={styles.toggleInfo}>
                <Ionicons name="text" size={20} color="#007AFF" />
                <View style={styles.toggleText}>
                  <Text style={styles.toggleLabel}>Auto-Capitalize</Text>
                  <Text style={styles.toggleDescription}>
                    Capitalize sentences and proper nouns
                  </Text>
                </View>
              </View>
              <Switch
                value={autoCapitalize}
                onValueChange={setAutoCapitalize}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.toggleItem}>
              <View style={styles.toggleInfo}>
                <Ionicons name="create" size={20} color="#FF9500" />
                <View style={styles.toggleText}>
                  <Text style={styles.toggleLabel}>Smart Punctuation</Text>
                  <Text style={styles.toggleDescription}>
                    Auto-insert periods, commas, and formatting
                  </Text>
                </View>
              </View>
              <Switch
                value={smartPunctuation}
                onValueChange={setSmartPunctuation}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.toggleItem}>
              <View style={styles.toggleInfo}>
                <Ionicons name="medical" size={20} color="#34C759" />
                <View style={styles.toggleText}>
                  <Text style={styles.toggleLabel}>Medical Abbreviations</Text>
                  <Text style={styles.toggleDescription}>Use standard medical abbreviations</Text>
                </View>
              </View>
              <Switch
                value={medicalAbbreviations}
                onValueChange={setMedicalAbbreviations}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Custom Phrases</Text>
          <Text style={styles.sectionDescription}>Quick phrases you use frequently</Text>

          <View style={styles.phrasesCard}>
            {customPhrases.map((phrase, index) => (
              <View key={index} style={styles.phraseItem}>
                <Text style={styles.phraseText} numberOfLines={1}>
                  {phrase}
                </Text>
                <TouchableOpacity
                  style={styles.removePhraseButton}
                  onPress={() => removeCustomPhrase(index)}
                >
                  <Ionicons name="close-circle" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.addPhraseContainer}>
              <TextInput
                style={styles.addPhraseInput}
                value={newPhrase}
                onChangeText={setNewPhrase}
                placeholder="Add a custom phrase..."
                placeholderTextColor="#999"
              />
              <TouchableOpacity style={styles.addPhraseButton} onPress={addCustomPhrase}>
                <Ionicons name="add" size={22} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.trainVoiceButton}>
            <Ionicons name="mic" size={22} color="#FFF" />
            <View style={styles.trainVoiceText}>
              <Text style={styles.trainVoiceTitle}>Train Voice Recognition</Text>
              <Text style={styles.trainVoiceDescription}>
                Improve accuracy by reading sample texts
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton}>
          <Ionicons name="checkmark" size={20} color="#FFF" />
          <Text style={styles.saveButtonText}>Save Preferences</Text>
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
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1C1C1E', marginBottom: 4 },
  sectionDescription: { fontSize: 13, color: '#8E8E93', marginBottom: 14 },
  voiceStyleGrid: {},
  voiceStyleCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  voiceStyleCardActive: { borderColor: '#007AFF', backgroundColor: '#007AFF08' },
  voiceStyleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  voiceStyleName: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  voiceStyleNameActive: { color: '#007AFF' },
  voiceStyleDescription: { fontSize: 13, color: '#8E8E93' },
  preferenceItem: { marginBottom: 16 },
  preferenceLabel: { fontSize: 14, fontWeight: '500', color: '#1C1C1E', marginBottom: 10 },
  optionsScroll: { marginHorizontal: -16, paddingHorizontal: 16 },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  optionChipActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  optionChipText: { fontSize: 13, color: '#666' },
  optionChipTextActive: { color: '#FFF', fontWeight: '500' },
  toggleCard: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  toggleItem: {
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
  phrasesCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 14 },
  phraseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  phraseText: { flex: 1, fontSize: 14, color: '#1C1C1E' },
  removePhraseButton: { padding: 4 },
  addPhraseContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  addPhraseInput: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1C1C1E',
    marginRight: 8,
  },
  addPhraseButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trainVoiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C759',
    borderRadius: 14,
    padding: 16,
  },
  trainVoiceText: { flex: 1, marginLeft: 12 },
  trainVoiceTitle: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  trainVoiceDescription: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  bottomPadding: { height: 100 },
  footer: { padding: 16, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E5E5EA' },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
  },
  saveButtonText: { fontSize: 16, fontWeight: '600', color: '#FFF', marginLeft: 8 },
});

export default ScribePersonalizationScreen;
