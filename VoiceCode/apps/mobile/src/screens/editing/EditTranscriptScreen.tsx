import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EditTranscriptScreenProps {
  navigation: { navigate: (screen: string) => void; goBack: () => void; setOptions?: (o: object) => void };
  route: { params: { transcriptId: string } };
}

const INITIAL_TEXT = 'This is the current transcript content.';
const INITIAL_TITLE = 'Untitled recording';

const EditTranscriptScreen: React.FC<EditTranscriptScreenProps> = ({ navigation }) => {
  const [text, setText] = useState(INITIAL_TEXT);
  const [title, setTitle] = useState(INITIAL_TITLE);
  const [dirty, setDirty] = useState(false);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [showDiscard, setShowDiscard] = useState(false);

  const editText = (next: string) => {
    setUndoStack((prev) => [...prev, text]);
    setRedoStack([]);
    setText(next);
    setDirty(true);
    setSavedMessage(null);
  };

  const editTitle = (next: string) => {
    setTitle(next);
    setDirty(true);
    setSavedMessage(null);
  };

  const undo = () => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      const previous = prev[prev.length - 1];
      setRedoStack((r) => [...r, text]);
      setText(previous);
      return prev.slice(0, -1);
    });
  };

  const redo = () => {
    setRedoStack((prev) => {
      if (prev.length === 0) return prev;
      const next = prev[prev.length - 1];
      setUndoStack((u) => [...u, text]);
      setText(next);
      return prev.slice(0, -1);
    });
  };

  const save = () => {
    setSavedMessage('Changes saved');
    setDirty(false);
    navigation.goBack();
  };

  const cancel = () => {
    if (dirty) {
      setShowDiscard(true);
      return;
    }
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} testID="edit-transcript-screen">
      <View style={styles.header}>
        <TextInput
          testID="title-input"
          style={styles.titleInput}
          value={title}
          onChangeText={editTitle}
          placeholder="Title"
        />
        {dirty ? (
          <View style={styles.unsaved} testID="unsaved-indicator">
            <Ionicons name="ellipse" size={10} color="#f59e0b" />
            <Text style={styles.unsavedText}>Unsaved</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolButton} onPress={undo} testID="undo-button">
          <Ionicons name="arrow-undo" size={20} color="#667eea" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolButton} onPress={redo} testID="redo-button">
          <Ionicons name="arrow-redo" size={20} color="#667eea" />
        </TouchableOpacity>
      </View>

      <TextInput
        testID="transcript-editor"
        style={styles.editor}
        value={text}
        onChangeText={editText}
        multiline
        placeholder="Transcript"
      />

      {savedMessage ? <Text style={styles.saved}>{savedMessage}</Text> : null}

      {showDiscard ? (
        <View style={styles.discard}>
          <Text style={styles.discardText}>Discard unsaved changes?</Text>
          <View style={styles.discardActions}>
            <TouchableOpacity
              style={styles.discardKeep}
              onPress={() => setShowDiscard(false)}
              testID="keep-editing"
            >
              <Text style={styles.discardKeepText}>Keep editing</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.discardConfirm}
              onPress={() => {
                setShowDiscard(false);
                navigation.goBack();
              }}
              testID="confirm-discard"
            >
              <Text style={styles.discardConfirmText}>Leave</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={cancel} testID="cancel-button">
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={save} testID="save-button">
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fa' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  titleInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a2e',
    paddingVertical: 8,
  },
  unsaved: { flexDirection: 'row', alignItems: 'center' },
  unsavedText: { marginLeft: 4, color: '#f59e0b', fontSize: 12, fontWeight: '600' },
  toolbar: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8 },
  toolButton: { padding: 8, marginRight: 4 },
  editor: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5ea',
    padding: 12,
    minHeight: 200,
    textAlignVertical: 'top',
    fontSize: 16,
    color: '#1a1a2e',
  },
  saved: { textAlign: 'center', color: '#22c55e', paddingVertical: 12, fontWeight: '600' },
  discard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5ea',
  },
  discardText: { fontSize: 16, color: '#1a1a2e', marginBottom: 12 },
  discardActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  discardKeep: { paddingHorizontal: 16, paddingVertical: 8, marginRight: 8 },
  discardKeepText: { color: '#667eea', fontWeight: '600' },
  discardConfirm: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  discardConfirmText: { color: '#fff', fontWeight: '600' },
  footer: { flexDirection: 'row', padding: 16 },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#c7c7cc',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelText: { color: '#555', fontSize: 16, fontWeight: '600' },
  saveButton: {
    flex: 1,
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginLeft: 8,
  },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default EditTranscriptScreen;
