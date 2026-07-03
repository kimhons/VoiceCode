import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Clip {
  id: string;
  title: string;
  duration: string;
}

interface ClipsScreenProps {
  navigation: { navigate: (screen: string, params?: object) => void; goBack: () => void };
  route: { params: { transcriptId: string } };
}

const INITIAL_CLIPS: Clip[] = [
  { id: '1', title: 'Opening remarks', duration: '0:32' },
  { id: '2', title: 'Closing thoughts', duration: '1:15' },
];

const ClipsScreen: React.FC<ClipsScreenProps> = ({ navigation, route }) => {
  const [clips, setClips] = useState<Clip[]>(INITIAL_CLIPS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const confirmDelete = () => {
    if (pendingDelete) setClips((prev) => prev.filter((c) => c.id !== pendingDelete));
    setPendingDelete(null);
  };

  const IconButton = ({
    icon,
    onPress,
    testID,
    color,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    testID: string;
    color?: string;
  }) => (
    <TouchableOpacity onPress={onPress} testID={testID} style={styles.iconButton}>
      <Ionicons name={icon} size={18} color={color ?? '#667eea'} />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} testID="clips-screen">
      <View style={styles.header}>
        <Text style={styles.title}>Highlights</Text>
        <TouchableOpacity onPress={() => setShowCreate(true)} testID="create-clip" style={styles.addButton}>
          <Ionicons name="add" size={24} color="#667eea" />
        </TouchableOpacity>
      </View>

      {status ? <Text style={styles.status}>{status}</Text> : null}

      <View style={styles.list} testID="clips-list">
        {clips.map((clip) => (
          <View key={clip.id} style={styles.item} testID={`clip-${clip.id}`}>
            <IconButton icon="play-circle" onPress={() => setStatus('Playing')} testID={`play-clip-${clip.id}`} />
            <View style={styles.itemBody}>
              <Text style={styles.itemTitle}>{clip.title}</Text>
              <Text style={styles.duration} testID={`clip-duration-${clip.id}`}>
                {clip.duration}
              </Text>
            </View>
            <View style={styles.itemActions}>
              <IconButton icon="create-outline" onPress={() => setEditingId(clip.id)} testID={`edit-clip-${clip.id}`} />
              <IconButton
                icon="download-outline"
                onPress={() => setStatus(`Exporting ${clip.duration} highlight…`)}
                testID={`export-clip-${clip.id}`}
              />
              <IconButton icon="share-outline" onPress={() => setStatus('Shared')} testID={`share-clip-${clip.id}`} />
              <IconButton
                icon="trash-outline"
                color="#e5484d"
                onPress={() => setPendingDelete(clip.id)}
                testID={`delete-clip-${clip.id}`}
              />
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.emptyHint}>No clips saved from other transcripts.</Text>

      {pendingDelete ? (
        <View style={styles.confirm} testID="delete-confirm">
          <Text style={styles.confirmText}>Delete this highlight?</Text>
          <View style={styles.confirmActions}>
            <TouchableOpacity onPress={() => setPendingDelete(null)}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={confirmDelete} testID="confirm-delete">
              <Text style={styles.danger}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {editingId ? (
        <View style={styles.modal} testID="edit-clip-modal">
          <Text style={styles.modalTitle}>Edit highlight</Text>
          <TouchableOpacity onPress={() => setEditingId(null)}>
            <Text style={styles.save}>Done</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {showCreate ? (
        <View style={styles.modal} testID="create-clip-modal">
          <Text style={styles.modalTitle}>New highlight</Text>
          <TouchableOpacity onPress={() => setShowCreate(false)}>
            <Text style={styles.save}>Done</Text>
          </TouchableOpacity>
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
  status: { textAlign: 'center', color: '#667eea', paddingVertical: 8 },
  list: { backgroundColor: '#fff', borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#e5e5ea' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
    gap: 8,
  },
  itemBody: { flex: 1 },
  itemTitle: { fontSize: 16, color: '#1a1a2e' },
  duration: { fontSize: 12, color: '#888', marginTop: 2 },
  itemActions: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { padding: 6 },
  emptyHint: { textAlign: 'center', color: '#aaa', fontSize: 13, paddingVertical: 20 },
  confirm: { backgroundColor: '#fff5f5', margin: 16, borderRadius: 12, padding: 16 },
  confirmText: { fontSize: 15, color: '#e5484d' },
  confirmActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 24, marginTop: 12 },
  cancel: { color: '#888', fontSize: 15 },
  danger: { color: '#e5484d', fontSize: 15, fontWeight: '600' },
  modal: { backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 16 },
  modalTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a2e', marginBottom: 12 },
  save: { color: '#667eea', fontSize: 15, fontWeight: '600' },
});

export default ClipsScreen;
