import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SharedWithMeScreenProps {
  navigation: { navigate: (screen: string, params?: object) => void; goBack: () => void };
}

interface SharedItem {
  id: string;
  title: string;
  sharedBy: string;
  permission: 'View' | 'Edit';
}

const SharedWithMeScreen: React.FC<SharedWithMeScreenProps> = ({ navigation }) => {
  const [items, setItems] = useState<SharedItem[]>([
    { id: '1', title: 'Shared Transcript', sharedBy: 'Sarah Chen', permission: 'View' },
  ]);
  const [leaving, setLeaving] = useState<string | null>(null);

  const openItem = (item: SharedItem) => {
    navigation.navigate('TranscriptDetail', { transcriptId: item.id });
  };

  const confirmLeave = () => {
    if (leaving) {
      setItems((prev) => prev.filter((i) => i.id !== leaving));
      setLeaving(null);
    }
  };

  return (
    <ScrollView style={styles.container} testID="shared-with-me-screen">
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shared With Me</Text>
      </View>

      <View testID="shared-list">
        {items.map((item) => (
          <View key={item.id} style={styles.card}>
            <TouchableOpacity
              style={styles.cardMain}
              testID={`shared-item-${item.id}`}
              onPress={() => openItem(item)}
            >
              <View style={styles.iconBadge}>
                <Ionicons name="document-text-outline" size={22} color="#667eea" />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSharer}>Shared by {item.sharedBy}</Text>
                <Text style={styles.cardPermission}>{item.permission}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity testID={`leave-share-${item.id}`} onPress={() => setLeaving(item.id)}>
              <Ionicons name="exit-outline" size={22} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {leaving ? (
        <TouchableOpacity style={styles.confirmButton} onPress={confirmLeave}>
          <Text style={styles.confirmText}>Leave this share?</Text>
        </TouchableOpacity>
      ) : null}

      <Text style={styles.footerNote}>No shared items are archived yet.</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fa' },
  header: { paddingHorizontal: 16, paddingVertical: 20 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#1a1a2e' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    padding: 14,
  },
  cardMain: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#eef0ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a2e' },
  cardSharer: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  cardPermission: { fontSize: 12, color: '#667eea', marginTop: 4 },
  confirmButton: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  confirmText: { color: '#FF3B30', fontSize: 15, fontWeight: '600' },
  footerNote: { textAlign: 'center', color: '#8E8E93', fontSize: 13, paddingVertical: 24 },
});

export default SharedWithMeScreen;
