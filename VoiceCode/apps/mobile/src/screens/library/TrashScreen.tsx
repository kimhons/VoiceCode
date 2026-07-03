import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TrashScreenProps {
  navigation: { navigate: (screen: string) => void; goBack: () => void };
}

interface TrashItem {
  id: string;
  title: string;
  removedLabel: string;
}

const TrashScreen: React.FC<TrashScreenProps> = () => {
  const [items, setItems] = useState<TrashItem[]>([
    { id: '1', title: 'Deleted Transcript', removedLabel: 'Removed 5 days ago · 25 days left' },
  ]);
  const [message, setMessage] = useState<string | null>(null);

  const restore = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setMessage('Transcript restored');
  };

  const deletePermanently = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setMessage('Permanently deleted');
  };

  const emptyTrash = () => {
    setMessage('Are you sure? This cannot be undone');
  };

  return (
    <ScrollView style={styles.container} testID="trash-screen">
      <View style={styles.header}>
        <Text style={styles.title}>Trash</Text>
        <TouchableOpacity onPress={emptyTrash} testID="empty-trash" style={styles.emptyButton}>
          <Ionicons name="trash-outline" size={16} color="#e74c3c" />
          <Text style={styles.emptyButtonText}>Empty Trash</Text>
        </TouchableOpacity>
      </View>

      {message ? <Text style={styles.message}>{message}</Text> : null}

      <View style={styles.list} testID="trash-list">
        {items.map((item) => (
          <View key={item.id} style={styles.itemRow} testID={`trash-item-${item.id}`}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemMeta}>{item.removedLabel}</Text>
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => restore(item.id)}
                testID={`restore-${item.id}`}
                style={styles.actionButton}
              >
                <Text style={styles.actionText}>Restore</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => deletePermanently(item.id)}
                testID={`delete-permanently-${item.id}`}
                style={styles.actionButton}
              >
                <Text style={styles.deleteText}>Delete Forever</Text>
              </TouchableOpacity>
            </View>
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
  emptyButton: { flexDirection: 'row', alignItems: 'center' },
  emptyButtonText: { color: '#e74c3c', fontWeight: '600', marginLeft: 6 },
  message: { textAlign: 'center', color: '#667eea', paddingVertical: 12 },
  list: { backgroundColor: '#fff', marginTop: 8 },
  itemRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
  },
  itemTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a2e' },
  itemMeta: { fontSize: 12, color: '#888', marginTop: 4 },
  actions: { flexDirection: 'row', marginTop: 10 },
  actionButton: { marginRight: 16 },
  actionText: { color: '#27ae60', fontWeight: '600' },
  deleteText: { color: '#e74c3c', fontWeight: '600' },
});

export default TrashScreen;
