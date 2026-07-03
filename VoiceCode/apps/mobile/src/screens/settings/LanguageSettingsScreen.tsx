import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Japanese',
  'Korean',
  'Mandarin',
];

type PickerTarget = 'app' | 'transcription' | 'translation';

interface LanguageSettingsScreenProps {
  navigation: { navigate: (screen: string, params?: object) => void; goBack: () => void };
}

const LanguageSettingsScreen: React.FC<LanguageSettingsScreenProps> = ({ navigation }) => {
  const [appLanguage, setAppLanguage] = useState('English');
  const [transcriptionLanguage, setTranscriptionLanguage] = useState('Auto-detect');
  const [translationLanguage, setTranslationLanguage] = useState('None');
  const [autoDetect, setAutoDetect] = useState(true);
  const [activePicker, setActivePicker] = useState<PickerTarget | null>(null);
  const [search, setSearch] = useState('');

  const select = (value: string) => {
    if (activePicker === 'app') setAppLanguage(value);
    if (activePicker === 'transcription') setTranscriptionLanguage(value);
    if (activePicker === 'translation') setTranslationLanguage(value);
    setActivePicker(null);
  };

  const searchResults = search
    ? LANGUAGES.filter((l) => l.toLowerCase().includes(search.toLowerCase()))
    : [];

  const Selector = ({ label, value, target, testID }: { label: string; value: string; target: PickerTarget; testID: string }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => setActivePicker((prev) => (prev === target ? null : target))}
      testID={testID}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
      <Ionicons name="chevron-forward" size={18} color="#bbb" />
    </TouchableOpacity>
  );

  const PickerList = ({ target }: { target: PickerTarget }) =>
    activePicker === target ? (
      <View style={styles.picker}>
        {LANGUAGES.map((lang) => (
          <TouchableOpacity key={lang} style={styles.pickerRow} onPress={() => select(lang)}>
            <Text style={styles.pickerLabel}>{lang}</Text>
          </TouchableOpacity>
        ))}
      </View>
    ) : null;

  return (
    <ScrollView style={styles.container} testID="language-settings-screen">
      <TextInput
        style={styles.search}
        value={search}
        onChangeText={setSearch}
        placeholder="Search languages"
        testID="language-search"
      />

      {searchResults.length > 0 ? (
        <View style={styles.picker}>
          {searchResults.map((lang) => (
            <TouchableOpacity
              key={lang}
              style={styles.pickerRow}
              onPress={() => {
                setAppLanguage(lang);
                setSearch('');
              }}
            >
              <Text style={styles.pickerLabel}>{lang}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>App Language</Text>
      <View style={styles.section}>
        <Selector label="Display Language" value={appLanguage} target="app" testID="app-language-selector" />
        <PickerList target="app" />
      </View>

      <Text style={styles.sectionTitle}>Transcription Language</Text>
      <View style={styles.section}>
        <Selector
          label="Default Language"
          value={transcriptionLanguage}
          target="transcription"
          testID="transcription-language-selector"
        />
        <PickerList target="transcription" />
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Auto-detect Language</Text>
          <Switch value={autoDetect} onValueChange={setAutoDetect} testID="auto-detect-toggle" />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Translation</Text>
      <View style={styles.section}>
        <Selector
          label="Default Translation"
          value={translationLanguage}
          target="translation"
          testID="translation-language-selector"
        />
        <PickerList target="translation" />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fa' },
  search: { backgroundColor: '#fff', margin: 16, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  sectionTitle: { fontSize: 13, color: '#888', textTransform: 'uppercase', marginHorizontal: 16, marginTop: 16, marginBottom: 8 },
  section: { backgroundColor: '#fff', borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#e5e5ea' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#eee' },
  rowLabel: { flex: 1, fontSize: 16, color: '#1a1a2e' },
  rowValue: { fontSize: 15, color: '#888', marginRight: 8 },
  picker: { backgroundColor: '#f2f2f7' },
  pickerRow: { paddingHorizontal: 32, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#e5e5ea' },
  pickerLabel: { fontSize: 15, color: '#1a1a2e' },
});

export default LanguageSettingsScreen;
