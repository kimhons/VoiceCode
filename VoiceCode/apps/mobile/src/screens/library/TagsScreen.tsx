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

interface TagsScreenProps {
  navigation: { navigate: (screen: string, params?: object) => void; goBack: () => void };
}

interface Tag {
  id: string;
  name: string;
  color: string;
  count: number;
}

const TAG_COLORS = ['#667eea', '#e74c3c', '#27ae60', '#f39c12', '#9b59b6'];

const TagsScreen: React.FC<TagsScreenProps> = ({ navigation }) => {
  const [tags, setTags] = useState<Tag[]>([
    { id: '1', name: 'Work', color: '#667eea', count: 5 },
  ]);
  const [editing, setEditing] = useState<'new' | string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const openTag = (tag: Tag) => {
    navigation.navigate('Library', { filterTag: tag.name });
  };

  const startEdit = (id: string, name: string) => {
    setEditing(id);
    setDraftName(name);
  };

  const startCreate = () => {
    setEditing('new');
    setDraftName('');
  };

  const saveTag = () => {
    const name = draftName.trim() || 'Untitled';
    if (editing === 'new') {
      setTags((prev) => [
        ...prev,
        { id: String(Date.now()), name, color: TAG_COLORS[0], count: 0 },
      ]);
    } else if (editing) {
      setTags((prev) => prev.map((t) => (t.id === editing ? { ...t, name } : t)));
    }
    setEditing(null);
  };

  const applyColor = (color: string, id: string) => {
    setTags((prev) => prev.map((t) => (t.id === id ? { ...t, color } : t)));
    setShowColorPicker(false);
  };

  const deleteTag = (id: string) => {
    setTags((prev) => prev.filter((t) => t.id !== id));
    setConfirmingDelete(false);
  };

  return (
    <ScrollView style={styles.container} testID="tags-screen">
      <View style={styles.header}>
        <Text style={styles.title}>Tags</Text>
        <TouchableOpacity style={styles.addButton} onPress={startCreate} testID="add-tag">
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {editing !== null ? (
        <View style={styles.editRow}>
          <TextInput
            style={styles.input}
            value={draftName}
            onChangeText={setDraftName}
            placeholder="Tag name"
            testID="tag-name-input"
          />
          <TouchableOpacity style={styles.saveButton} onPress={saveTag} testID="save-tag">
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.list} testID="tag-list">
        {tags.map((tag) => (
          <View key={tag.id} style={styles.tagRow}>
            <TouchableOpacity
              style={styles.tagMain}
              onPress={() => openTag(tag)}
              testID={`tag-${tag.id}`}
            >
              <View style={[styles.dot, { backgroundColor: tag.color }]} />
              <View style={styles.tagText}>
                <Text style={styles.tagName}>{tag.name}</Text>
                <Text style={styles.tagCount}>{tag.count} transcripts</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.tagActions}>
              <TouchableOpacity
                onPress={() => startEdit(tag.id, tag.name)}
                testID="edit-tag"
                style={styles.iconButton}
              >
                <Ionicons name="pencil-outline" size={18} color="#667eea" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowColorPicker(true)}
                testID="change-color"
                style={styles.iconButton}
              >
                <Ionicons name="color-palette-outline" size={18} color="#667eea" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setConfirmingDelete(true)}
                testID="delete-tag"
                style={styles.iconButton}
              >
                <Ionicons name="trash-outline" size={18} color="#e74c3c" />
              </TouchableOpacity>
            </View>

            {showColorPicker ? (
              <View style={styles.colorPicker} testID="color-picker">
                {TAG_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[styles.colorSwatch, { backgroundColor: color }]}
                    onPress={() => applyColor(color, tag.id)}
                  />
                ))}
              </View>
            ) : null}

            {confirmingDelete ? (
              <TouchableOpacity
                style={styles.confirmDelete}
                onPress={() => deleteTag(tag.id)}
                testID="confirm-delete"
              >
                <Text style={styles.confirmDeleteText}>Confirm delete</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ))}
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
  title: { fontSize: 24, fontWeight: '700', color: '#1a1a2e' },
  addButton: {
    backgroundColor: '#667eea',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8 },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
  },
  saveButton: {
    marginLeft: 8,
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  saveText: { color: '#fff', fontWeight: '600' },
  list: { backgroundColor: '#fff', marginTop: 8 },
  tagRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
  },
  tagMain: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 14, height: 14, borderRadius: 7, marginRight: 12 },
  tagText: { flex: 1 },
  tagName: { fontSize: 16, color: '#1a1a2e' },
  tagCount: { fontSize: 12, color: '#888', marginTop: 2 },
  tagActions: { flexDirection: 'row', marginTop: 8 },
  iconButton: { padding: 8, marginRight: 8 },
  colorPicker: { flexDirection: 'row', marginTop: 8 },
  colorSwatch: { width: 28, height: 28, borderRadius: 14, marginRight: 10 },
  confirmDelete: {
    marginTop: 8,
    backgroundColor: '#e74c3c',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmDeleteText: { color: '#fff', fontWeight: '600' },
});

export default TagsScreen;
