import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Draft {
  id: number;
  title: string;
  modified: string;
}

interface DraftsScreenProps {
  navigation: { navigate: (screen: string, params?: object) => void; goBack: () => void };
}

const INITIAL_DRAFTS: Draft[] = [
  { id: 1, title: 'Team standup notes', modified: 'Edited 2 hours ago' },
  { id: 2, title: 'Product roadmap sync', modified: 'Edited yesterday' },
];

const DraftsScreen: React.FC<DraftsScreenProps> = ({ navigation }) => {
  const [drafts, setDrafts] = useState<Draft[]>(INITIAL_DRAFTS);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const continueDraft = (draft: Draft) => {
    navigation.navigate('EditTranscript', { transcriptId: String(draft.id) });
  };

  const publishDraft = (id: number) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
    setStatus('Published successfully');
  };

  const confirmDelete = () => {
    if (confirmId === null) return;
    setDrafts((prev) => prev.filter((d) => d.id !== confirmId));
    setConfirmId(null);
  };

  const renderItem = ({ item }: { item: Draft }) => (
    <TouchableOpacity style={styles.item} onPress={() => continueDraft(item)} testID={`draft-${item.id}`}>
      <View style={styles.itemBody}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemModified} testID={`draft-modified-${item.id}`}>
          {item.modified}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.iconButton}
        onPress={() => publishDraft(item.id)}
        testID={`publish-draft-${item.id}`}
      >
        <Ionicons name="cloud-upload-outline" size={20} color="#667eea" />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.iconButton}
        onPress={() => setConfirmId(item.id)}
        testID={`delete-draft-${item.id}`}
      >
        <Ionicons name="trash-outline" size={20} color="#ef4444" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container} testID="drafts-screen">
      <Text style={styles.heading}>Continue Editing</Text>

      {confirmId !== null ? (
        <View style={styles.confirmBar}>
          <Text style={styles.confirmText}>Delete this item?</Text>
          <View style={styles.confirmActions}>
            <TouchableOpacity onPress={() => setConfirmId(null)} style={styles.confirmCancel} testID="cancel-delete">
              <Text style={styles.confirmCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={confirmDelete} style={styles.confirmDelete} testID="confirm-delete">
              <Text style={styles.confirmDeleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {status ? <Text style={styles.status}>{status}</Text> : null}

      <FlatList
        testID="drafts-list"
        data={drafts}
        keyExtractor={(d) => String(d.id)}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-outline" size={40} color="#c7c7cc" />
            <Text style={styles.emptyText}>You're all caught up</Text>
          </View>
        }
      />

      <Text style={styles.footer}>No drafts leave your device until you publish them.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fa' },
  heading: { fontSize: 28, fontWeight: '700', color: '#1a1a2e', padding: 16 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    padding: 14,
  },
  itemBody: { flex: 1 },
  itemTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a2e' },
  itemModified: { fontSize: 13, color: '#888', marginTop: 4 },
  iconButton: { padding: 8, marginLeft: 4 },
  confirmBar: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5ea',
  },
  confirmText: { fontSize: 16, color: '#1a1a2e', marginBottom: 12 },
  confirmActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  confirmCancel: { paddingHorizontal: 16, paddingVertical: 8, marginRight: 8 },
  confirmCancelText: { color: '#667eea', fontWeight: '600' },
  confirmDelete: { backgroundColor: '#ef4444', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  confirmDeleteText: { color: '#fff', fontWeight: '600' },
  status: { textAlign: 'center', color: '#22c55e', paddingBottom: 12, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { color: '#888', marginTop: 12, fontSize: 15 },
  footer: { textAlign: 'center', color: '#aaa', fontSize: 12, padding: 16 },
});

export default DraftsScreen;
