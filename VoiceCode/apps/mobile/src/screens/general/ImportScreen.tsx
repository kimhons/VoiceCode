import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Portuguese', 'Japanese'];

interface ImportScreenProps {
  navigation: { navigate: (screen: string, params?: object) => void; goBack: () => void };
}

const ImportScreen: React.FC<ImportScreenProps> = ({ navigation }) => {
  const [selectedAudio, setSelectedAudio] = useState<string | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [showTextPreview, setShowTextPreview] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);
  const [language, setLanguage] = useState('English');

  const Option = ({
    label,
    icon,
    onPress,
    testID,
  }: {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    testID: string;
  }) => (
    <TouchableOpacity style={styles.option} onPress={onPress} testID={testID}>
      <Ionicons name={icon} size={22} color="#667eea" style={styles.rowIcon} />
      <Text style={styles.optionLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#bbb" />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} testID="import-screen">
      <Text style={styles.sectionTitle}>Import Source</Text>
      <View style={styles.section}>
        <Option label="Import from Files" icon="folder-outline" onPress={() => setShowTextPreview(true)} testID="import-text" />
        <Option label="Import Audio" icon="musical-notes-outline" onPress={() => setSelectedAudio('audio.m4a')} testID="import-audio" />
      </View>

      {selectedAudio ? (
        <View style={styles.panel}>
          <Text style={styles.fileName}>{selectedAudio}</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => setTranscribing(true)} testID="start-transcription">
            <Text style={styles.primaryButtonText}>Start Transcription</Text>
          </TouchableOpacity>
          {transcribing ? <Text style={styles.progress}>Transcribing {selectedAudio}…</Text> : null}
        </View>
      ) : null}

      {showTextPreview ? (
        <View style={styles.panel} testID="text-preview">
          <Text style={styles.previewTitle}>Preview</Text>
          <Text style={styles.previewBody}>The imported document contents appear here before you confirm the import.</Text>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Import from Cloud</Text>
      <View style={styles.section}>
        <Option label="Google Drive" icon="cloud-outline" onPress={() => navigation.navigate('Integrations')} testID="import-google-drive" />
        <Option label="Dropbox" icon="cloud-outline" onPress={() => navigation.navigate('Integrations')} testID="import-dropbox" />
      </View>

      <Text style={styles.sectionTitle}>Settings</Text>
      <View style={styles.section}>
        <TouchableOpacity style={styles.option} onPress={() => setShowLanguages((v) => !v)} testID="language-selector">
          <Ionicons name="language-outline" size={22} color="#667eea" style={styles.rowIcon} />
          <Text style={styles.optionLabel}>Language</Text>
          <Text style={styles.optionValue}>{language}</Text>
        </TouchableOpacity>
        {showLanguages
          ? LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang}
                style={styles.languageRow}
                onPress={() => {
                  setLanguage(lang);
                  setShowLanguages(false);
                }}
              >
                <Text style={styles.languageLabel}>{lang}</Text>
              </TouchableOpacity>
            ))
          : null}
      </View>

      <Text style={styles.caption}>Unsupported file formats will be skipped during import.</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fa' },
  sectionTitle: { fontSize: 13, color: '#888', textTransform: 'uppercase', marginHorizontal: 16, marginTop: 24, marginBottom: 8 },
  section: { backgroundColor: '#fff', borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#e5e5ea' },
  option: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#eee' },
  rowIcon: { marginRight: 12 },
  optionLabel: { flex: 1, fontSize: 16, color: '#1a1a2e' },
  optionValue: { fontSize: 15, color: '#888' },
  languageRow: { paddingHorizontal: 52, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#f0f0f0' },
  languageLabel: { fontSize: 15, color: '#1a1a2e' },
  panel: { backgroundColor: '#fff', margin: 16, padding: 16, borderRadius: 12 },
  fileName: { fontSize: 15, fontWeight: '600', color: '#1a1a2e', marginBottom: 12 },
  primaryButton: { backgroundColor: '#667eea', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '600' },
  progress: { textAlign: 'center', color: '#667eea', marginTop: 12 },
  previewTitle: { fontSize: 15, fontWeight: '600', color: '#1a1a2e', marginBottom: 8 },
  previewBody: { fontSize: 14, color: '#555', lineHeight: 20 },
  caption: { fontSize: 13, color: '#888', margin: 16 },
});

export default ImportScreen;
