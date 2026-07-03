import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SelectableItem {
  id: string;
  title: string;
}

interface SelectionScreenProps {
  navigation: { navigate: (screen: string) => void; goBack: () => void };
  route: { params?: { mode?: string; selectedIds?: string[] } };
}

const ITEMS: SelectableItem[] = [
  { id: '1', title: 'Team Meeting Notes' },
  { id: '2', title: 'Standup Sync' },
  { id: '3', title: 'Client Call' },
  { id: '4', title: 'Design Review' },
  { id: '5', title: 'Retrospective' },
];

const SelectionScreen: React.FC<SelectionScreenProps> = ({ navigation, route }) => {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(route.params?.selectedIds ?? [])
  );
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(ITEMS.map((i) => i.id)));
  const deselectAll = () => setSelected(new Set());

  const renderItem = ({ item }: { item: SelectableItem }) => {
    const isSelected = selected.has(item.id);
    return (
      <TouchableOpacity style={styles.item} testID={`item-${item.id}`} onPress={() => toggle(item.id)}>
        <Ionicons
          name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
          size={22}
          color={isSelected ? '#667eea' : '#c7c7cc'}
          style={styles.itemIcon}
        />
        <Text style={styles.itemTitle}>{item.title}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container} testID="selection-screen">
      <View style={styles.header}>
        <TouchableOpacity testID="cancel-selection" onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={styles.count}>{selected.size} selected</Text>
        <View style={styles.selectAllRow}>
          <TouchableOpacity testID="select-all" onPress={selectAll} style={styles.selectAllButton}>
            <Text style={styles.selectAllText}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="deselect-all" onPress={deselectAll} style={styles.selectAllButton}>
            <Text style={styles.selectAllText}>None</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        testID="selection-list"
        data={ITEMS}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        style={styles.list}
      />

      <View style={styles.actions}>
        <TouchableOpacity style={styles.action} testID="action-move" onPress={() => setShowFolderPicker(true)}>
          <Ionicons name="folder-outline" size={22} color="#667eea" />
          <Text style={styles.actionLabel}>Move</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action} testID="action-export" onPress={() => navigation.navigate('Export')}>
          <Ionicons name="share-outline" size={22} color="#667eea" />
          <Text style={styles.actionLabel}>Export</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action} testID="action-tag" onPress={() => setShowTagPicker(true)}>
          <Ionicons name="pricetag-outline" size={22} color="#667eea" />
          <Text style={styles.actionLabel}>Tag</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action} testID="action-delete" onPress={() => setShowDeleteConfirm(true)}>
          <Ionicons name="trash-outline" size={22} color="#ef4444" />
          <Text style={[styles.actionLabel, styles.removeLabel]}>Remove</Text>
        </TouchableOpacity>
      </View>

      {showFolderPicker ? (
        <View style={styles.modal} testID="folder-picker">
          <Text style={styles.modalTitle}>Choose a folder</Text>
        </View>
      ) : null}

      {showTagPicker ? (
        <View style={styles.modal} testID="tag-picker">
          <Text style={styles.modalTitle}>Choose tags</Text>
        </View>
      ) : null}

      {showDeleteConfirm ? (
        <View style={styles.modal} testID="delete-confirm-modal">
          <Text style={styles.modalTitle}>Delete the selected recordings?</Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowDeleteConfirm(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalConfirm} onPress={() => setShowDeleteConfirm(false)}>
              <Text style={styles.modalConfirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fa' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#e5e5ea' },
  count: { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
  selectAllRow: { flexDirection: 'row' },
  selectAllButton: { marginLeft: 12 },
  selectAllText: { fontSize: 14, color: '#667eea', fontWeight: '600' },
  list: { flex: 1 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#eee' },
  itemIcon: { marginRight: 12 },
  itemTitle: { fontSize: 16, color: '#1a1a2e' },
  actions: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, backgroundColor: '#fff', borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#e5e5ea' },
  action: { alignItems: 'center' },
  actionLabel: { fontSize: 12, color: '#667eea', marginTop: 4, fontWeight: '600' },
  removeLabel: { color: '#ef4444' },
  modal: { position: 'absolute', left: 24, right: 24, top: '40%', padding: 20, backgroundColor: '#fff', borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, elevation: 6 },
  modalTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a2e', textAlign: 'center' },
  modalButtons: { flexDirection: 'row', marginTop: 16 },
  modalCancel: { flex: 1, paddingVertical: 12, alignItems: 'center', marginRight: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e5e5ea' },
  modalCancelText: { fontSize: 15, color: '#555', fontWeight: '600' },
  modalConfirm: { flex: 1, paddingVertical: 12, alignItems: 'center', marginLeft: 8, borderRadius: 8, backgroundColor: '#ef4444' },
  modalConfirmText: { fontSize: 15, color: '#fff', fontWeight: '600' },
});

export default SelectionScreen;
