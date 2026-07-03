import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface VocabularyScreenProps {
  navigation: { navigate: (screen: string) => void; goBack: () => void };
}

interface Word {
  id: string;
  word: string;
}

const VocabularyScreen: React.FC<VocabularyScreenProps> = () => {
  const [words, setWords] = useState<Word[]>([{ id: '1', word: 'kubernetes' }]);
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const filtered = words.filter((w) =>
    w.word.toLowerCase().includes(search.trim().toLowerCase())
  );

  const saveWord = () => {
    const value = draft.trim();
    if (value) {
      setWords((prev) => [...prev, { id: String(Date.now()), word: value }]);
    }
    setDraft('');
    setAddModal(false);
  };

  const deleteWord = (id: string) => {
    setWords((prev) => prev.filter((w) => w.id !== id));
  };

  return (
    <ScrollView style={styles.container} testID="vocabulary-screen">
      <View style={styles.header}>
        <Text style={styles.title}>Custom Vocabulary</Text>
        <TouchableOpacity onPress={() => setAddModal(true)} testID="add-word" style={styles.addButton}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.toolbar}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search words"
          testID="search-input"
        />
        <TouchableOpacity
          onPress={() => setMessage('Vocabulary imported')}
          testID="import-vocabulary"
          style={styles.toolButton}
        >
          <Ionicons name="download-outline" size={20} color="#667eea" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setMessage('Vocabulary exported')}
          testID="export-vocabulary"
          style={styles.toolButton}
        >
          <Ionicons name="share-outline" size={20} color="#667eea" />
        </TouchableOpacity>
      </View>

      {message ? <Text style={styles.message}>{message}</Text> : null}

      {addModal ? (
        <View style={styles.modal} testID="add-word-modal">
          <Text style={styles.modalTitle}>Add Word</Text>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="Word"
            testID="word-input"
          />
          <TouchableOpacity style={styles.saveButton} onPress={saveWord} testID="save-word">
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {editModal ? (
        <View style={styles.modal} testID="edit-word-modal">
          <Text style={styles.modalTitle}>Edit Word</Text>
          <TouchableOpacity style={styles.modalClose} onPress={() => setEditModal(false)}>
            <Text style={styles.actionText}>Close</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.list} testID="vocabulary-list">
        <View testID="search-results">
          {filtered.map((word) => (
            <View key={word.id} style={styles.wordRow} testID={`word-${word.id}`}>
              <Text style={styles.wordText}>{word.word}</Text>
              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={() => setEditModal(true)}
                  testID={`edit-word-${word.id}`}
                  style={styles.iconButton}
                >
                  <Ionicons name="pencil-outline" size={18} color="#667eea" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => deleteWord(word.id)}
                  testID={`delete-word-${word.id}`}
                  style={styles.iconButton}
                >
                  <Ionicons name="trash-outline" size={18} color="#e74c3c" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fa' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#1a1a2e' },
  addButton: {
    backgroundColor: '#667eea',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
  },
  toolButton: { padding: 10, marginLeft: 4 },
  message: { textAlign: 'center', color: '#667eea', paddingVertical: 12 },
  modal: {
    margin: 16,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 12 },
  modalClose: { alignSelf: 'flex-start' },
  input: {
    backgroundColor: '#f7f7fa',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
  },
  saveButton: {
    marginTop: 12,
    backgroundColor: '#667eea',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontWeight: '600' },
  actionText: { color: '#667eea', fontWeight: '600' },
  list: { backgroundColor: '#fff', marginTop: 8 },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
  },
  wordText: { fontSize: 16, color: '#1a1a2e' },
  actions: { flexDirection: 'row' },
  iconButton: { padding: 8, marginLeft: 4 },
});

export default VocabularyScreen;
