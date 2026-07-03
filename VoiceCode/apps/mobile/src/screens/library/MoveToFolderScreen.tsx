import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Folder {
  id: string;
  name: string;
}

interface MoveToFolderScreenProps {
  navigation: { navigate: (screen: string) => void; goBack: () => void };
  route: { params?: { transcriptIds?: string[] } };
}

const FOLDERS: Folder[] = [
  { id: '1', name: 'Work' },
  { id: '2', name: 'Personal' },
  { id: '3', name: 'Meetings' },
];

const MoveToFolderScreen: React.FC<MoveToFolderScreenProps> = ({ navigation, route }) => {
  const transcriptIds = route.params?.transcriptIds ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState('All Recordings');
  const [showCreate, setShowCreate] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [movedMessage, setMovedMessage] = useState<string | null>(null);

  const move = () => {
    const target = FOLDERS.find((f) => f.id === selectedId);
    setMovedMessage(`Moved ${transcriptIds.length} item(s) to ${target?.name ?? 'folder'}`);
    navigation.goBack();
  };

  const renderFolder = ({ item }: { item: Folder }) => (
    <View style={styles.folderRow}>
      <TouchableOpacity
        style={styles.folderSelect}
        testID={`folder-${item.id}`}
        onPress={() => setSelectedId(item.id)}
      >
        <Ionicons
          name={selectedId === item.id ? 'folder-open' : 'folder-outline'}
          size={22}
          color="#667eea"
          style={styles.folderIcon}
        />
        <Text style={styles.folderName}>{item.name}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID={`folder-expand-${item.id}`}
        onPress={() => setCurrentLocation(item.name)}
        style={styles.expandButton}
      >
        <Ionicons name="chevron-forward" size={20} color="#bbb" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container} testID="move-to-folder-screen">
      <View style={styles.header}>
        <Text style={styles.title}>Move to Folder</Text>
        <Text style={styles.currentLocation}>Current location: {currentLocation}</Text>
      </View>

      <FlatList
        testID="folder-list"
        data={FOLDERS}
        keyExtractor={(item) => item.id}
        renderItem={renderFolder}
        style={styles.list}
      />

      {movedMessage ? <Text style={styles.moved}>{movedMessage}</Text> : null}

      <TouchableOpacity style={styles.createRow} testID="create-folder" onPress={() => setShowCreate(true)}>
        <Ionicons name="add-circle-outline" size={22} color="#667eea" style={styles.folderIcon} />
        <Text style={styles.createLabel}>New Folder</Text>
      </TouchableOpacity>

      {showCreate ? (
        <View style={styles.modal} testID="create-folder-modal">
          <Text style={styles.modalTitle}>Create Folder</Text>
          <TextInput
            style={styles.input}
            placeholder="Folder name"
            value={newFolderName}
            onChangeText={setNewFolderName}
            testID="new-folder-input"
          />
          <TouchableOpacity style={styles.modalButton} onPress={() => setShowCreate(false)}>
            <Text style={styles.modalButtonText}>Create</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} testID="cancel-button" onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.moveButton, !selectedId && styles.moveButtonDisabled]}
          testID="move-button"
          onPress={move}
        >
          <Text style={styles.moveText}>Move</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fa' },
  header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#e5e5ea' },
  title: { fontSize: 20, fontWeight: '700', color: '#1a1a2e' },
  currentLocation: { fontSize: 13, color: '#888', marginTop: 4 },
  list: { flex: 1 },
  folderRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#eee' },
  folderSelect: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  folderIcon: { marginRight: 12 },
  folderName: { fontSize: 16, color: '#1a1a2e' },
  expandButton: { paddingHorizontal: 16, paddingVertical: 14 },
  moved: { textAlign: 'center', color: '#22c55e', paddingVertical: 12, fontWeight: '600' },
  createRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#e5e5ea' },
  createLabel: { fontSize: 16, color: '#667eea', fontWeight: '600' },
  modal: { margin: 16, padding: 16, backgroundColor: '#fff', borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: '#e5e5ea' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#e5e5ea', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, marginBottom: 12 },
  modalButton: { backgroundColor: '#667eea', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  modalButtonText: { color: '#fff', fontWeight: '600' },
  footer: { flexDirection: 'row', padding: 16, backgroundColor: '#fff', borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#e5e5ea' },
  cancelButton: { flex: 1, paddingVertical: 14, alignItems: 'center', marginRight: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e5e5ea' },
  cancelText: { fontSize: 16, color: '#555', fontWeight: '600' },
  moveButton: { flex: 1, paddingVertical: 14, alignItems: 'center', marginLeft: 8, borderRadius: 8, backgroundColor: '#667eea' },
  moveButtonDisabled: { opacity: 0.5 },
  moveText: { fontSize: 16, color: '#fff', fontWeight: '600' },
});

export default MoveToFolderScreen;
