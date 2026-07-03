import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface TranslationScreenProps {
  navigation?: {
    navigate: (screen: string, params?: Record<string, unknown>) => void;
    goBack: () => void;
  };
  route?: {
    params?: { transcriptId?: string };
  };
}

const TranslationScreen: React.FC<TranslationScreenProps> = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [sourceLanguage, setSourceLanguage] = useState('English');
  const [targetLanguage, setTargetLanguage] = useState('French');
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [showLanguages, setShowLanguages] = useState(false);
  const [showSideBySide, setShowSideBySide] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const translateTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (translateTimeout.current) {
        clearTimeout(translateTimeout.current);
      }
    },
    []
  );

  const languages = [
    'English',
    'Spanish',
    'French',
    'German',
    'Chinese',
    'Japanese',
    'Korean',
    'Portuguese',
  ];

  const swapLanguages = () => {
    const temp = sourceLanguage;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(temp);
  };

  const selectTargetLanguage = (language: string) => {
    setTargetLanguage(language);
    setShowLanguages(false);
  };

  const handleTranslate = () => {
    setIsTranslating(true);
    const source = inputText.trim().length > 0 ? inputText.trim() : 'Hello, how are you?';
    translateTimeout.current = setTimeout(() => {
      setTranslatedText(`[${targetLanguage}] ${source}`);
      setIsTranslating(false);
    }, 300);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container} testID="translation-screen">
      <View style={styles.header}>
        <Text style={styles.title}>Voice Translation</Text>
        <TouchableOpacity>
          <Ionicons name="settings-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.languageSelector}>
        <TouchableOpacity style={styles.languageButton}>
          <Text style={styles.languageLabel}>{sourceLanguage}</Text>
          <Ionicons name="chevron-down" size={16} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.swapButton} onPress={swapLanguages}>
          <Ionicons name="swap-horizontal" size={24} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.languageButton}
          testID="language-selector"
          onPress={() => setShowLanguages(true)}
        >
          <Text style={styles.languageLabel}>{targetLanguage}</Text>
          <Ionicons name="chevron-down" size={16} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {showLanguages && (
        <View style={styles.languageList} testID="language-list">
          {languages.map(language => (
            <TouchableOpacity
              key={language}
              style={styles.languageOption}
              onPress={() => selectTargetLanguage(language)}
            >
              <Text style={styles.languageOptionText}>{language}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView style={styles.content}>
        <View style={styles.inputSection}>
          <View style={styles.inputHeader}>
            <Text style={styles.inputLabel}>{sourceLanguage}</Text>
            <TouchableOpacity>
              <Ionicons name="copy-outline" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.textInput}
            testID="source-text"
            placeholder="Type or speak to translate..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            testID="translate-button"
            onPress={handleTranslate}
          >
            <Ionicons name="language" size={18} color="#007AFF" />
            <Text style={styles.actionButtonText}>Translate</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            testID="toggle-side-by-side"
            onPress={() => setShowSideBySide(prev => !prev)}
          >
            <Ionicons name="git-compare" size={18} color="#007AFF" />
            <Text style={styles.actionButtonText}>Side by Side</Text>
          </TouchableOpacity>
        </View>

        {isTranslating && (
          <Text style={styles.progressText} testID="translation-progress">
            Translating...
          </Text>
        )}

        <View style={styles.voiceSection}>
          <TouchableOpacity
            style={[styles.voiceButton, isRecording && styles.voiceButtonActive]}
            onPress={() => setIsRecording(!isRecording)}
          >
            <Ionicons name={isRecording ? 'stop' : 'mic'} size={32} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.voiceHint}>{isRecording ? 'Listening...' : 'Tap to speak'}</Text>
        </View>

        {translatedText.length > 0 && (
          <View style={styles.outputSection}>
            <View style={styles.outputHeader}>
              <Text style={styles.outputLabel}>{targetLanguage}</Text>
              <View style={styles.outputActions}>
                <TouchableOpacity style={styles.outputAction}>
                  <Ionicons name="volume-high" size={20} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.outputAction}>
                  <Ionicons name="copy-outline" size={20} color="#007AFF" />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.translatedText} testID="translated-text">
              {translatedText}
            </Text>
          </View>
        )}

        {showSideBySide && (
          <View style={styles.sideBySide} testID="side-by-side-view">
            <View style={styles.sideColumn}>
              <Text style={styles.outputLabel}>{sourceLanguage}</Text>
              <Text style={styles.translatedText}>
                {inputText.trim().length > 0 ? inputText.trim() : 'Hello, how are you?'}
              </Text>
            </View>
            <View style={styles.sideColumn}>
              <Text style={styles.outputLabel}>{targetLanguage}</Text>
              <Text style={styles.translatedText}>{translatedText || '—'}</Text>
            </View>
          </View>
        )}

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            testID="copy-translation"
            onPress={() => setStatusMessage('Copied to clipboard')}
          >
            <Ionicons name="copy" size={18} color="#007AFF" />
            <Text style={styles.actionButtonText}>Copy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            testID="save-translation"
            onPress={() => setStatusMessage('Saved')}
          >
            <Ionicons name="bookmark" size={18} color="#007AFF" />
            <Text style={styles.actionButtonText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            testID="export-translation"
            onPress={() => setStatusMessage('Exported')}
          >
            <Ionicons name="share-outline" size={18} color="#007AFF" />
            <Text style={styles.actionButtonText}>Export</Text>
          </TouchableOpacity>
        </View>

        {statusMessage.length > 0 && (
          <Text style={styles.statusMessage} testID="status-message">
            {statusMessage}
          </Text>
        )}

        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Recent Translations</Text>
          {[1, 2, 3].map(i => (
            <TouchableOpacity key={i} style={styles.historyItem}>
              <View style={styles.historyLanguages}>
                <Text style={styles.historyLang}>EN → ES</Text>
              </View>
              <Text style={styles.historyText} numberOfLines={1}>
                Hello, how are you?
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: { fontSize: 20, fontWeight: '600', color: '#1A1A1A' },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  languageButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  languageLabel: { fontSize: 16, fontWeight: '500', color: '#1A1A1A', marginRight: 4 },
  swapButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  languageList: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 8,
  },
  languageOption: { paddingVertical: 12, paddingHorizontal: 16 },
  languageOptionText: { fontSize: 16, color: '#1A1A1A' },
  content: { flex: 1 },
  inputSection: { backgroundColor: '#FFF', padding: 16, marginBottom: 8 },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#666' },
  textInput: { fontSize: 16, color: '#1A1A1A', minHeight: 80 },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 12,
    marginBottom: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionButtonText: { fontSize: 14, fontWeight: '500', color: '#007AFF', marginLeft: 6 },
  progressText: {
    fontSize: 14,
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  voiceSection: { alignItems: 'center', paddingVertical: 24 },
  voiceButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButtonActive: { backgroundColor: '#FF3B30' },
  voiceHint: { fontSize: 14, color: '#666', marginTop: 12 },
  outputSection: { backgroundColor: '#E3F2FD', padding: 16, marginBottom: 8 },
  outputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  outputLabel: { fontSize: 14, fontWeight: '600', color: '#007AFF' },
  outputActions: { flexDirection: 'row' },
  outputAction: { marginLeft: 16 },
  translatedText: { fontSize: 16, color: '#1A1A1A', lineHeight: 24 },
  sideBySide: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 8,
  },
  sideColumn: { flex: 1, paddingHorizontal: 8 },
  statusMessage: {
    fontSize: 14,
    color: '#34C759',
    textAlign: 'center',
    marginBottom: 8,
  },
  historySection: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 12 },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  historyLanguages: { marginRight: 12 },
  historyLang: { fontSize: 12, color: '#007AFF', fontWeight: '600' },
  historyText: { flex: 1, fontSize: 14, color: '#1A1A1A' },
});

export default TranslationScreen;
