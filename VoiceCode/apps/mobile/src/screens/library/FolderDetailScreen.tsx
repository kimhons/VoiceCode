import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabaseService';

const FOLDER_COLORS = ['#667eea', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#ec4899'];

interface Folder {
  id: string;
  name: string;
  color: string;
  transcript_count: number;
}

interface TranscriptItem {
  id: string;
  title: string;
  created_at: string;
}

interface FolderDetailScreenProps {
  navigation: { navigate: (screen: string, params?: object) => void; goBack: () => void; setOptions?: (opts: object) => void };
  route: { params: { folderId: string } };
}

const FolderDetailScreen: React.FC<FolderDetailScreenProps> = ({ navigation, route }) => {
  const { folderId } = route.params;

  const [folder, setFolder] = useState<Folder | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState(FOLDER_COLORS[0]);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([
    { id: 'transcript-1', title: 'Meeting 1', created_at: '2024-01-15T10:00:00Z' },
    { id: 'transcript-2', title: 'Meeting 2', created_at: '2024-01-14T09:00:00Z' },
  ]);
  const [sortMode, setSortMode] = useState<'date' | 'name'>('date');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [showRename, setShowRename] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('folders')
        .select('*')
        .eq('id', folderId)
        .single();
      if (active && data) {
        setFolder(data as Folder);
        setName((data as Folder).name);
        setColor((data as Folder).color);
      }
    })();
    return () => {
      active = false;
    };
  }, [folderId]);

  const sortedTranscripts = useMemo(() => {
    const list = [...transcripts];
    if (sortMode === 'name') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      list.sort((a, b) => b.created_at.localeCompare(a.created_at));
    }
    return list;
  }, [transcripts, sortMode]);

  const saveName = async () => {
    const table = supabase.from('folders');
    await table.update?.({ name })?.eq?.('id', folderId);
    setFolder((prev) => (prev ? { ...prev, name } : prev));
    setShowRename(false);
  };

  const applyColor = async (next: string) => {
    setColor(next);
    const table = supabase.from('folders');
    await table.update?.({ color: next })?.eq?.('id', folderId);
    setFolder((prev) => (prev ? { ...prev, color: next } : prev));
    setShowColorPicker(false);
  };

  const deleteFolder = async () => {
    const table = supabase.from('folders');
    await table.delete?.()?.eq?.('id', folderId);
    navigation.goBack();
  };

  const removeFromFolder = async (transcriptId: string) => {
    const table = supabase.from('folder_transcripts');
    await table.delete?.()?.eq?.('transcript_id', transcriptId);
    setTranscripts((prev) => prev.filter((t) => t.id !== transcriptId));
    setSelectedId(null);
  };

  return (
    <ScrollView style={styles.container} testID="folder-detail-screen">
      {folder ? (
        <View style={[styles.header, { backgroundColor: color }]} testID="folder-header">
          <Text style={styles.folderName}>{folder.name}</Text>
          <Text style={styles.folderMeta}>{folder.transcript_count} transcripts</Text>
        </View>
      ) : null}

      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolButton} onPress={() => setShowRename(true)} testID="rename-folder">
          <Ionicons name="create-outline" size={20} color="#667eea" />
          <Text style={styles.toolLabel}>Rename</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolButton} onPress={() => setShowColorPicker(true)} testID="change-color">
          <Ionicons name="color-palette-outline" size={20} color="#667eea" />
          <Text style={styles.toolLabel}>Color</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolButton} onPress={() => setShowAddModal(true)} testID="add-transcripts">
          <Ionicons name="add-circle-outline" size={20} color="#667eea" />
          <Text style={styles.toolLabel}>Add</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolButton} onPress={() => setShowDeleteConfirm(true)} testID="delete-folder">
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
          <Text style={styles.toolLabel}>Delete</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sortBar}>
        <TouchableOpacity style={styles.sortButton} onPress={() => setSortMode('date')} testID="sort-by-date">
          <Text style={styles.sortLabel}>Sort by Date</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sortButton} onPress={() => setSortMode('name')} testID="sort-by-name">
          <Text style={styles.sortLabel}>Sort by Name</Text>
        </TouchableOpacity>
      </View>

      {showRename ? (
        <View style={styles.panel}>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Folder name"
            testID="folder-name-input"
          />
          <TouchableOpacity style={styles.primaryButton} onPress={saveName} testID="save-name">
            <Text style={styles.primaryButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {showColorPicker ? (
        <View style={styles.panel} testID="color-picker">
          <View style={styles.swatchRow}>
            {FOLDER_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.swatch, { backgroundColor: c }]}
                onPress={() => applyColor(c)}
                testID={`color-${c}`}
              />
            ))}
          </View>
        </View>
      ) : null}

      {showDeleteConfirm ? (
        <View style={styles.panel}>
          <Text style={styles.confirmText}>Delete this folder?</Text>
          <TouchableOpacity style={styles.dangerButton} onPress={deleteFolder} testID="confirm-delete">
            <Text style={styles.primaryButtonText}>Delete Folder</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {selectedId ? (
        <View style={styles.panel}>
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={() => removeFromFolder(selectedId)}
            testID="remove-from-folder"
          >
            <Text style={styles.primaryButtonText}>Remove from Folder</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.list}>
        {sortedTranscripts.map((t) => (
          <View key={t.id} style={styles.transcriptRow}>
            <Ionicons name="document-text-outline" size={20} color="#667eea" style={styles.rowIcon} />
            <Text
              style={styles.transcriptTitle}
              onPress={() => navigation.navigate('TranscriptDetail', { transcriptId: t.id })}
              onLongPress={() => setSelectedId(t.id)}
              testID={`transcript-${t.id}`}
            >
              {t.title}
            </Text>
          </View>
        ))}
      </View>

      <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard} testID="add-transcripts-modal">
            <Text style={styles.modalTitle}>Add Transcripts</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => setShowAddModal(false)}>
              <Text style={styles.primaryButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fa' },
  header: { padding: 24, alignItems: 'center' },
  folderName: { fontSize: 24, fontWeight: '700', color: '#fff' },
  folderMeta: { fontSize: 14, color: '#fff', marginTop: 4, opacity: 0.9 },
  toolbar: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#fff', paddingVertical: 12 },
  toolButton: { alignItems: 'center' },
  toolLabel: { fontSize: 12, color: '#555', marginTop: 4 },
  sortBar: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, gap: 12 },
  sortButton: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#eef0ff', borderRadius: 8 },
  sortLabel: { fontSize: 13, color: '#667eea' },
  panel: { backgroundColor: '#fff', margin: 16, padding: 16, borderRadius: 12 },
  input: { borderWidth: StyleSheet.hairlineWidth, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 12 },
  primaryButton: { backgroundColor: '#667eea', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '600' },
  dangerButton: { backgroundColor: '#ef4444', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  confirmText: { fontSize: 15, color: '#1a1a2e', marginBottom: 12 },
  swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  swatch: { width: 40, height: 40, borderRadius: 20 },
  list: { backgroundColor: '#fff', marginTop: 8 },
  transcriptRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#eee' },
  rowIcon: { marginRight: 12 },
  transcriptTitle: { flex: 1, fontSize: 16, color: '#1a1a2e' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 16 },
});

export default FolderDetailScreen;
