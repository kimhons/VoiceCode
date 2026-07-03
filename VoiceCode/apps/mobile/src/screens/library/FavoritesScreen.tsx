import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Favorite {
  id: number;
  title: string;
  addedAt: number;
}

interface FavoritesScreenProps {
  navigation: { navigate: (screen: string, params?: object) => void; goBack: () => void };
}

const INITIAL_FAVORITES: Favorite[] = [
  { id: 1, title: 'Design Review', addedAt: 2 },
  { id: 2, title: 'Weekly Sync', addedAt: 1 },
];

type SortMode = 'date' | 'title';

const FavoritesScreen: React.FC<FavoritesScreenProps> = ({ navigation }) => {
  const [favorites, setFavorites] = useState<Favorite[]>(INITIAL_FAVORITES);
  const [showSort, setShowSort] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('date');

  const openTranscript = (fav: Favorite) => {
    navigation.navigate('TranscriptDetail', { transcriptId: String(fav.id) });
  };

  const removeFavorite = (id: number) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  };

  const applySort = (mode: SortMode) => {
    setSortMode(mode);
    setShowSort(false);
    setFavorites((prev) =>
      [...prev].sort((a, b) =>
        mode === 'title' ? a.title.localeCompare(b.title) : b.addedAt - a.addedAt
      )
    );
  };

  const renderItem = ({ item }: { item: Favorite }) => (
    <TouchableOpacity style={styles.item} onPress={() => openTranscript(item)} testID={`favorite-item-${item.id}`}>
      <Ionicons name="star" size={20} color="#f59e0b" style={styles.star} testID={`favorite-icon-${item.id}`} />
      <Text style={styles.itemTitle}>{item.title}</Text>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeFavorite(item.id)}
        testID={`remove-favorite-${item.id}`}
      >
        <Ionicons name="close-circle-outline" size={22} color="#ef4444" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container} testID="favorites-screen">
      <View style={styles.header}>
        <Text style={styles.heading}>Favorite Transcripts</Text>
        <TouchableOpacity style={styles.sortButton} onPress={() => setShowSort((v) => !v)} testID="sort-button">
          <Ionicons name="swap-vertical" size={22} color="#667eea" />
        </TouchableOpacity>
      </View>

      {showSort ? (
        <View style={styles.sortMenu}>
          <TouchableOpacity
            style={[styles.sortOption, sortMode === 'date' && styles.sortOptionActive]}
            onPress={() => applySort('date')}
          >
            <Text style={styles.sortOptionText}>Date Added</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortOption, sortMode === 'title' && styles.sortOptionActive]}
            onPress={() => applySort('title')}
          >
            <Text style={styles.sortOptionText}>Title</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <FlatList
        testID="favorites-list"
        data={favorites}
        keyExtractor={(f) => String(f.id)}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="star-outline" size={40} color="#c7c7cc" />
            <Text style={styles.emptyText}>Nothing starred yet</Text>
          </View>
        }
      />

      <Text style={styles.footer}>No favorites are shared — they stay private to you.</Text>
    </View>
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
  heading: { fontSize: 24, fontWeight: '700', color: '#1a1a2e' },
  sortButton: { padding: 8 },
  sortMenu: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5ea',
  },
  sortOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
  },
  sortOptionActive: { backgroundColor: '#f0f2ff' },
  sortOptionText: { fontSize: 16, color: '#1a1a2e' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    padding: 14,
  },
  star: { marginRight: 12 },
  itemTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: '#1a1a2e' },
  removeButton: { padding: 4 },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { color: '#888', marginTop: 12, fontSize: 15 },
  footer: { textAlign: 'center', color: '#aaa', fontSize: 12, padding: 16 },
});

export default FavoritesScreen;
