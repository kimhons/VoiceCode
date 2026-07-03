import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FindReplaceScreenProps {
  navigation: { navigate: (screen: string) => void; goBack: () => void };
  route: { params: { transcriptId: string } };
}

const SOURCE_TEXT =
  'This is a test transcript. We test the recorder, then test playback and export the test results.';

const countMatches = (text: string, query: string, caseSensitive: boolean, wholeWord: boolean) => {
  if (!query) return 0;
  const flags = caseSensitive ? 'g' : 'gi';
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = wholeWord ? `\\b${escaped}\\b` : escaped;
  const matches = text.match(new RegExp(pattern, flags));
  return matches ? matches.length : 0;
};

const FindReplaceScreen: React.FC<FindReplaceScreenProps> = () => {
  const [content, setContent] = useState(SOURCE_TEXT);
  const [find, setFind] = useState('');
  const [replace, setReplace] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState<string | null>(null);

  const matchCount = useMemo(
    () => countMatches(content, find, caseSensitive, wholeWord),
    [content, find, caseSensitive, wholeWord]
  );

  const runFind = () => {
    setCurrentIndex(0);
    if (matchCount === 0) {
      setStatus('No matches found');
    } else {
      setStatus(`${matchCount} matches found`);
    }
  };

  const goNext = () => {
    if (matchCount === 0) return;
    setCurrentIndex((i) => (i + 1) % matchCount);
  };

  const goPrevious = () => {
    if (matchCount === 0) return;
    setCurrentIndex((i) => (i - 1 + matchCount) % matchCount);
  };

  const replaceCurrent = () => {
    if (matchCount === 0) {
      setStatus('No matches found');
      return;
    }
    const flags = caseSensitive ? '' : 'i';
    const escaped = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = wholeWord ? `\\b${escaped}\\b` : escaped;
    setContent(content.replace(new RegExp(pattern, flags), replace));
    setStatus('Replaced 1 match');
  };

  const replaceAll = () => {
    const count = matchCount;
    const flags = caseSensitive ? 'g' : 'gi';
    const escaped = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = wholeWord ? `\\b${escaped}\\b` : escaped;
    setContent(content.replace(new RegExp(pattern, flags), replace));
    setStatus(`Replaced all ${count} matches`);
  };

  return (
    <ScrollView style={styles.container} testID="find-replace-screen">
      <Text style={styles.heading}>Find & Replace</Text>

      <View style={styles.inputRow}>
        <TextInput
          testID="find-input"
          style={styles.input}
          value={find}
          onChangeText={setFind}
          placeholder="Find"
        />
        <TouchableOpacity style={styles.iconButton} onPress={goPrevious} testID="previous-button">
          <Ionicons name="chevron-up" size={20} color="#667eea" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={goNext} testID="next-button">
          <Ionicons name="chevron-down" size={20} color="#667eea" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.findButton} onPress={runFind} testID="find-button">
          <Text style={styles.findButtonText}>Find</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputRow}>
        <TextInput
          testID="replace-input"
          style={styles.input}
          value={replace}
          onChangeText={setReplace}
          placeholder="Replace with"
        />
        <TouchableOpacity style={styles.iconButton} onPress={replaceCurrent} testID="replace-button">
          <Ionicons name="swap-horizontal" size={20} color="#667eea" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.findButton} onPress={replaceAll} testID="replace-all-button">
          <Text style={styles.findButtonText}>All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.optionsRow}>
        <TouchableOpacity
          style={[styles.option, caseSensitive && styles.optionActive]}
          onPress={() => setCaseSensitive((v) => !v)}
          testID="case-sensitive-toggle"
        >
          <Text style={[styles.optionText, caseSensitive && styles.optionTextActive]}>Aa</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.option, wholeWord && styles.optionActive]}
          onPress={() => setWholeWord((v) => !v)}
          testID="whole-word-toggle"
        >
          <Text style={[styles.optionText, wholeWord && styles.optionTextActive]}>Word</Text>
        </TouchableOpacity>
      </View>

      {status ? <Text style={styles.status}>{status}</Text> : null}

      {currentIndex >= 0 && matchCount > 0 ? (
        <Text style={styles.position}>
          {currentIndex + 1} of {matchCount}
        </Text>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fa' },
  heading: { fontSize: 24, fontWeight: '700', color: '#1a1a2e', padding: 16 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5ea',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1a1a2e',
  },
  iconButton: { padding: 8, marginLeft: 4 },
  findButton: {
    backgroundColor: '#667eea',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginLeft: 4,
  },
  findButtonText: { color: '#fff', fontWeight: '600' },
  optionsRow: { flexDirection: 'row', paddingHorizontal: 12, marginTop: 4 },
  option: {
    borderWidth: 1,
    borderColor: '#667eea',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  optionActive: { backgroundColor: '#667eea' },
  optionText: { color: '#667eea', fontWeight: '600' },
  optionTextActive: { color: '#fff' },
  status: { paddingHorizontal: 16, paddingTop: 16, color: '#667eea', fontWeight: '600' },
  position: { paddingHorizontal: 16, paddingTop: 8, color: '#888' },
});

export default FindReplaceScreen;
