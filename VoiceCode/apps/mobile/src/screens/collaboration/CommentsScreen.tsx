import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Comment {
  id: string;
  author: string;
  text: string;
  resolved: boolean;
  position: number | null;
}

interface CommentsScreenProps {
  navigation: { navigate: (screen: string, params?: object) => void; goBack: () => void };
  route: { params: { transcriptId: string } };
}

const INITIAL_COMMENTS: Comment[] = [
  { id: '1', author: 'Priya Patel', text: 'Great point about latency here.', resolved: false, position: null },
  { id: '2', author: 'Marcus Lee', text: 'Can we double-check this number?', resolved: false, position: null },
];

const TRANSCRIPT_WORDS = ['We', 'shipped', 'the', 'new', 'streaming', 'pipeline', 'last', 'week'];

const CommentsScreen: React.FC<CommentsScreenProps> = ({ navigation, route }) => {
  const [comments, setComments] = useState<Comment[]>(INITIAL_COMMENTS);
  const [draft, setDraft] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState(true);

  const submitComment = () => {
    if (!draft.trim()) return;
    if (editingId) {
      setComments((prev) => prev.map((c) => (c.id === editingId ? { ...c, text: draft } : c)));
      setEditingId(null);
    } else {
      const id = String(Date.now());
      setComments((prev) => [
        ...prev,
        { id, author: 'You', text: draft, resolved: false, position: selectedPosition },
      ]);
    }
    setDraft('');
    setSelectedPosition(null);
  };

  const confirmDelete = () => {
    if (pendingDelete) setComments((prev) => prev.filter((c) => c.id !== pendingDelete));
    setPendingDelete(null);
  };

  const toggleResolved = (id: string, resolved: boolean) =>
    setComments((prev) => prev.map((c) => (c.id === id ? { ...c, resolved } : c)));

  const startEdit = (id: string, text: string) => {
    setEditingId(id);
    setDraft(text);
  };

  const visibleComments = showResolved ? comments : comments.filter((c) => !c.resolved);

  return (
    <ScrollView style={styles.container} testID="comments-screen">
      <View style={styles.transcript}>
        {TRANSCRIPT_WORDS.map((word, i) => (
          <TouchableOpacity key={i} onPress={() => setSelectedPosition(i)} testID={`transcript-word-${i}`}>
            <Text style={[styles.word, selectedPosition === i && styles.selectedWord]}>{word} </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.chip} onPress={() => setShowResolved((v) => !v)} testID="filter-resolved">
          <Ionicons name="filter-outline" size={16} color="#667eea" />
          <Text style={styles.chipText}>Resolved</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.list} testID="comment-list">
        {visibleComments.map((c) => (
          <View
            key={c.id}
            style={[styles.comment, c.resolved && styles.resolvedComment]}
            testID={c.position !== null ? 'positioned-comment' : `comment-${c.id}`}
          >
            <View style={styles.commentHeader}>
              <Text style={styles.author}>{c.author}</Text>
              {c.resolved ? <Text style={styles.resolvedTag}>Resolved</Text> : null}
            </View>
            <Text style={styles.commentText}>{c.text}</Text>
            <View style={styles.commentActions}>
              <TouchableOpacity onPress={() => setDraft('')} testID={`reply-button-${c.id}`}>
                <Text style={styles.action}>Reply</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => startEdit(c.id, c.text)} testID={`edit-comment-${c.id}`}>
                <Text style={styles.action}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setPendingDelete(c.id)} testID={`delete-comment-${c.id}`}>
                <Text style={styles.actionDanger}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => toggleResolved(c.id, true)} testID={`resolve-thread-${c.id}`}>
                <Text style={styles.action}>Resolve</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => toggleResolved(c.id, false)} testID={`unresolve-thread-${c.id}`}>
                <Text style={styles.action}>Reopen</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {pendingDelete ? (
        <View style={styles.confirm} testID="delete-confirm">
          <Text style={styles.confirmText}>Delete this comment?</Text>
          <View style={styles.confirmActions}>
            <TouchableOpacity onPress={() => setPendingDelete(null)}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={confirmDelete} testID="confirm-delete">
              <Text style={styles.actionDanger}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          testID="comment-input"
          value={draft}
          onChangeText={setDraft}
          placeholder={editingId ? 'Edit comment' : 'Add a comment'}
        />
        {editingId ? (
          <TouchableOpacity style={styles.sendButton} onPress={submitComment} testID="save-comment">
            <Ionicons name="checkmark" size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.sendButton} onPress={submitComment} testID="submit-comment">
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fa' },
  transcript: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, backgroundColor: '#fff' },
  word: { fontSize: 15, color: '#1a1a2e' },
  selectedWord: { backgroundColor: '#fff3bf' },
  toolbar: { flexDirection: 'row', padding: 12 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#eef0ff',
  },
  chipText: { fontSize: 13, color: '#667eea' },
  list: { backgroundColor: '#fff', borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#e5e5ea' },
  comment: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#eee' },
  resolvedComment: { opacity: 0.6 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  author: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  resolvedTag: { fontSize: 12, color: '#22c55e' },
  commentText: { fontSize: 15, color: '#333', marginTop: 4 },
  commentActions: { flexDirection: 'row', gap: 16, marginTop: 8 },
  action: { fontSize: 13, color: '#667eea' },
  actionDanger: { fontSize: 13, color: '#e5484d' },
  confirm: { backgroundColor: '#fff5f5', margin: 16, borderRadius: 12, padding: 16 },
  confirmText: { fontSize: 15, color: '#e5484d' },
  confirmActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 24, marginTop: 12 },
  cancel: { color: '#888', fontSize: 15 },
  composer: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8, backgroundColor: '#fff' },
  input: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 15,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CommentsScreen;
