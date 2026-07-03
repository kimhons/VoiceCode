import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Bookmark {
  id: string;
  label: string;
  timestamp: string;
  positionMs: number;
}

interface BookmarksScreenProps {
  navigation: { navigate: (screen: string, params?: object) => void; goBack: () => void };
  route: { params: { transcriptId: string } };
}

const INITIAL_BOOKMARKS: Bookmark[] = [
  { id: '1', label: 'Introduction', timestamp: '0:14', positionMs: 14000 },
  { id: '2', label: 'Key decision', timestamp: '5:47', positionMs: 347000 },
];

const BookmarksScreen: React.FC<BookmarksScreenProps> = ({ navigation, route }) => {
  const { transcriptId } = route.params;
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(INITIAL_BOOKMARKS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftLabel, setDraftLabel] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLabel, setNewLabel] = useState('');

  const removeBookmark = (id: string) => setBookmarks((prev) => prev.filter((b) => b.id !== id));

  const saveLabel = (id: string) => {
    setBookmarks((prev) => prev.map((b) => (b.id === id ? { ...b, label: draftLabel || b.label } : b)));
    setEditingId(null);
  };

  const addBookmark = () => {
    const id = String(Date.now());
    setBookmarks((prev) => [...prev, { id, label: newLabel || 'New marker', timestamp: '0:00', positionMs: 0 }]);
    setNewLabel('');
    setShowAddModal(false);
  };

  return (
    <ScrollView style={styles.container} testID="bookmarks-screen">
      <View style={styles.header}>
        <Text style={styles.title}>Saved Positions</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)} testID="add-bookmark" style={styles.addButton}>
          <Ionicons name="add" size={24} color="#667eea" />
        </TouchableOpacity>
      </View>

      <View style={styles.list} testID="bookmark-list">
        {bookmarks.map((b) => (
          <TouchableOpacity
            key={b.id}
            style={styles.item}
            testID={`bookmark-${b.id}`}
            onPress={() => navigation.navigate('TranscriptDetail', { transcriptId, positionMs: b.positionMs })}
          >
            <View style={styles.itemBody}>
              <Ionicons name="bookmark" size={18} color="#667eea" style={styles.itemIcon} />
              {editingId === b.id ? (
                <TextInput
                  style={styles.labelInput}
                  testID="bookmark-label-input"
                  value={draftLabel}
                  onChangeText={setDraftLabel}
                  onSubmitEditing={() => saveLabel(b.id)}
                  placeholder="Label"
                  autoFocus
                />
              ) : (
                <View style={styles.labelWrap}>
                  <Text style={styles.itemLabel}>{b.label}</Text>
                  <Text style={styles.timestamp} testID={`bookmark-timestamp-${b.id}`}>
                    {b.timestamp}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.itemActions}>
              <TouchableOpacity
                onPress={() => {
                  setDraftLabel(b.label);
                  setEditingId(b.id);
                }}
                testID={`edit-bookmark-${b.id}`}
              >
                <Ionicons name="create-outline" size={18} color="#667eea" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => removeBookmark(b.id)} testID={`delete-bookmark-${b.id}`}>
                <Ionicons name="trash-outline" size={18} color="#e5484d" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.emptyHint}>No bookmarks yet? Tap the plus to save your place.</Text>

      {showAddModal ? (
        <View style={styles.modal} testID="add-bookmark-modal">
          <Text style={styles.modalTitle}>New marker</Text>
          <TextInput
            style={styles.labelInput}
            value={newLabel}
            onChangeText={setNewLabel}
            placeholder="Label"
            testID="new-bookmark-input"
          />
          <View style={styles.modalActions}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={addBookmark}>
              <Text style={styles.save}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fa' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#1a1a2e' },
  addButton: { padding: 4 },
  list: { backgroundColor: '#fff', borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#e5e5ea' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
  },
  itemBody: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  itemIcon: { marginRight: 12 },
  labelWrap: { flex: 1 },
  labelInput: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 15,
  },
  itemLabel: { fontSize: 16, color: '#1a1a2e' },
  timestamp: { fontSize: 12, color: '#888', marginTop: 2 },
  itemActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  emptyHint: { textAlign: 'center', color: '#aaa', fontSize: 13, paddingVertical: 20 },
  modal: { backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 16 },
  modalTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a2e', marginBottom: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 24, marginTop: 12 },
  cancel: { color: '#888', fontSize: 15 },
  save: { color: '#667eea', fontSize: 15, fontWeight: '600' },
});

export default BookmarksScreen;
