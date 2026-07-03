import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RecentItem {
  id: string;
  title: string;
  accessedAt: string;
}

interface RecentScreenProps {
  navigation: { navigate: (screen: string, params?: object) => void; goBack: () => void };
}

const INITIAL: RecentItem[] = [
  { id: '1', title: 'Team Meeting Notes', accessedAt: '2 hours ago' },
  { id: '2', title: 'Standup Sync', accessedAt: 'Yesterday' },
  { id: '3', title: 'Client Call', accessedAt: 'Mar 3' },
];

const RecentScreen: React.FC<RecentScreenProps> = ({ navigation }) => {
  const [items, setItems] = useState<RecentItem[]>(INITIAL);
  const [showConfirm, setShowConfirm] = useState(false);

  const clearHistory = () => {
    setItems([]);
    setShowConfirm(false);
  };

  const renderItem = ({ item }: { item: RecentItem }) => (
    <TouchableOpacity
      style={styles.item}
      testID={`recent-item-${item.id}`}
      onPress={() => navigation.navigate('TranscriptDetail', { id: item.id })}
    >
      <Ionicons name="document-text-outline" size={22} color="#667eea" style={styles.itemIcon} />
      <View style={styles.itemBody}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemTime}>{item.accessedAt}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#bbb" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container} testID="recent-screen">
      <View style={styles.header}>
        <Text style={styles.title}>Recent</Text>
        <TouchableOpacity testID="clear-history" onPress={() => setShowConfirm(true)}>
          <Text style={styles.clear}>Clear</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        testID="recent-list"
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        style={styles.list}
      />

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="time-outline" size={40} color="#c7c7cc" />
          <Text style={styles.emptyText}>No recent items</Text>
        </View>
      ) : (
        <Text style={styles.emptyHint}>No recent items are hidden from this list.</Text>
      )}

      {showConfirm ? (
        <View style={styles.modal} testID="clear-confirm-modal">
          <Text style={styles.modalTitle}>Are you sure you want to clear your history?</Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowConfirm(false)}>
              <Text style={styles.modalCancelText}>No</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalConfirm} onPress={clearHistory}>
              <Text style={styles.modalConfirmText}>Yes</Text>
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
  title: { fontSize: 20, fontWeight: '700', color: '#1a1a2e' },
  clear: { fontSize: 15, color: '#ef4444', fontWeight: '600' },
  list: { flex: 1 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#eee' },
  itemIcon: { marginRight: 12 },
  itemBody: { flex: 1 },
  itemTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a2e' },
  itemTime: { fontSize: 13, color: '#888', marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 17, fontWeight: '600', color: '#1a1a2e', marginTop: 12 },
  emptyHint: { textAlign: 'center', color: '#c7c7cc', fontSize: 12, paddingVertical: 10 },
  modal: { position: 'absolute', left: 24, right: 24, top: '40%', padding: 20, backgroundColor: '#fff', borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, elevation: 6 },
  modalTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a2e', textAlign: 'center' },
  modalButtons: { flexDirection: 'row', marginTop: 16 },
  modalCancel: { flex: 1, paddingVertical: 12, alignItems: 'center', marginRight: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e5e5ea' },
  modalCancelText: { fontSize: 15, color: '#555', fontWeight: '600' },
  modalConfirm: { flex: 1, paddingVertical: 12, alignItems: 'center', marginLeft: 8, borderRadius: 8, backgroundColor: '#ef4444' },
  modalConfirmText: { fontSize: 15, color: '#fff', fontWeight: '600' },
});

export default RecentScreen;
