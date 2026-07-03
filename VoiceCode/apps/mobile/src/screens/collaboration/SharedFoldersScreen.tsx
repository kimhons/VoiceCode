import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Folder {
  id: string;
  name: string;
  itemCount: number;
  sharedWith: number;
  lastModified: string;
  color: string;
  isStarred: boolean;
}

const SharedFoldersScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');

  const folders: Folder[] = [
    {
      id: '1',
      name: 'Product Team',
      itemCount: 24,
      sharedWith: 8,
      lastModified: 'Today',
      color: '#007AFF',
      isStarred: true,
    },
    {
      id: '2',
      name: 'Client Meetings',
      itemCount: 156,
      sharedWith: 5,
      lastModified: 'Yesterday',
      color: '#34C759',
      isStarred: true,
    },
    {
      id: '3',
      name: 'Engineering Docs',
      itemCount: 89,
      sharedWith: 12,
      lastModified: '2 days ago',
      color: '#FF9500',
      isStarred: false,
    },
    {
      id: '4',
      name: 'HR Training',
      itemCount: 32,
      sharedWith: 25,
      lastModified: 'Last week',
      color: '#AF52DE',
      isStarred: false,
    },
    {
      id: '5',
      name: 'Marketing Assets',
      itemCount: 67,
      sharedWith: 6,
      lastModified: 'Last week',
      color: '#FF2D55',
      isStarred: false,
    },
    {
      id: '6',
      name: 'Legal Documents',
      itemCount: 18,
      sharedWith: 3,
      lastModified: '2 weeks ago',
      color: '#5856D6',
      isStarred: false,
    },
  ];

  const recentlyAccessed = folders.slice(0, 3);
  const starredFolders = folders.filter(f => f.isStarred);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Shared Folders</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search folders..."
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="funnel" size={18} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {starredFolders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="star" size={18} color="#FF9500" />
              <Text style={styles.sectionTitle}>Starred</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.starredScroll}
            >
              {starredFolders.map(folder => (
                <TouchableOpacity key={folder.id} style={styles.starredCard}>
                  <View style={[styles.folderIconLarge, { backgroundColor: folder.color + '20' }]}>
                    <Ionicons name="folder" size={32} color={folder.color} />
                  </View>
                  <Text style={styles.starredName} numberOfLines={1}>
                    {folder.name}
                  </Text>
                  <Text style={styles.starredMeta}>{folder.itemCount} items</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time" size={18} color="#8E8E93" />
            <Text style={styles.sectionTitle}>Recently Accessed</Text>
          </View>
          {recentlyAccessed.map(folder => (
            <TouchableOpacity key={folder.id} style={styles.folderCard}>
              <View style={[styles.folderIcon, { backgroundColor: folder.color + '20' }]}>
                <Ionicons name="folder" size={24} color={folder.color} />
              </View>
              <View style={styles.folderInfo}>
                <Text style={styles.folderName}>{folder.name}</Text>
                <View style={styles.folderMeta}>
                  <Text style={styles.metaText}>{folder.itemCount} items</Text>
                  <Text style={styles.metaDot}>•</Text>
                  <Text style={styles.metaText}>{folder.lastModified}</Text>
                </View>
              </View>
              <View style={styles.folderActions}>
                <View style={styles.sharedCount}>
                  <Ionicons name="people" size={14} color="#8E8E93" />
                  <Text style={styles.sharedText}>{folder.sharedWith}</Text>
                </View>
                <TouchableOpacity style={styles.moreButton}>
                  <Ionicons name="ellipsis-horizontal" size={18} color="#8E8E93" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="folder-open" size={18} color="#8E8E93" />
            <Text style={styles.sectionTitle}>All Folders</Text>
            <TouchableOpacity style={styles.sortButton}>
              <Text style={styles.sortText}>Sort: {sortBy}</Text>
              <Ionicons name="chevron-down" size={14} color="#007AFF" />
            </TouchableOpacity>
          </View>
          {folders.map(folder => (
            <TouchableOpacity key={folder.id} style={styles.folderCard}>
              <View style={[styles.folderIcon, { backgroundColor: folder.color + '20' }]}>
                <Ionicons name="folder" size={24} color={folder.color} />
              </View>
              <View style={styles.folderInfo}>
                <View style={styles.folderNameRow}>
                  <Text style={styles.folderName}>{folder.name}</Text>
                  {folder.isStarred && (
                    <Ionicons name="star" size={14} color="#FF9500" style={styles.starIcon} />
                  )}
                </View>
                <View style={styles.folderMeta}>
                  <Text style={styles.metaText}>{folder.itemCount} items</Text>
                  <Text style={styles.metaDot}>•</Text>
                  <Text style={styles.metaText}>{folder.lastModified}</Text>
                </View>
              </View>
              <View style={styles.folderActions}>
                <View style={styles.sharedCount}>
                  <Ionicons name="people" size={14} color="#8E8E93" />
                  <Text style={styles.sharedText}>{folder.sharedWith}</Text>
                </View>
                <TouchableOpacity style={styles.moreButton}>
                  <Ionicons name="ellipsis-horizontal" size={18} color="#8E8E93" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.storageSection}>
          <View style={styles.storageHeader}>
            <Ionicons name="cloud" size={20} color="#007AFF" />
            <Text style={styles.storageTitle}>Team Storage</Text>
          </View>
          <View style={styles.storageBar}>
            <View style={[styles.storageFill, { width: '45%' }]} />
          </View>
          <Text style={styles.storageText}>4.5 GB of 10 GB used</Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <TouchableOpacity style={styles.fab}>
        <Ionicons name="folder-open" size={24} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: { padding: 4 },
  title: { fontSize: 17, fontWeight: '600', color: '#1C1C1E' },
  addButton: { padding: 4 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 16, color: '#1C1C1E', marginLeft: 8 },
  filterButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  content: { flex: 1 },
  section: { padding: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1C1C1E', marginLeft: 8, flex: 1 },
  sortButton: { flexDirection: 'row', alignItems: 'center' },
  sortText: { fontSize: 13, color: '#007AFF', marginRight: 4 },
  starredScroll: { paddingRight: 16 },
  starredCard: {
    width: 120,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginRight: 10,
    alignItems: 'center',
  },
  folderIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  starredName: { fontSize: 14, fontWeight: '600', color: '#1C1C1E', textAlign: 'center' },
  starredMeta: { fontSize: 12, color: '#8E8E93', marginTop: 4 },
  folderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  folderIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  folderInfo: { flex: 1 },
  folderNameRow: { flexDirection: 'row', alignItems: 'center' },
  folderName: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  starIcon: { marginLeft: 6 },
  folderMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  metaText: { fontSize: 13, color: '#8E8E93' },
  metaDot: { marginHorizontal: 6, color: '#8E8E93' },
  folderActions: { flexDirection: 'row', alignItems: 'center' },
  sharedCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  sharedText: { fontSize: 12, color: '#8E8E93', marginLeft: 4 },
  moreButton: { padding: 4 },
  storageSection: { backgroundColor: '#FFF', margin: 16, borderRadius: 14, padding: 16 },
  storageHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  storageTitle: { fontSize: 15, fontWeight: '600', color: '#1C1C1E', marginLeft: 8 },
  storageBar: { height: 8, backgroundColor: '#E5E5EA', borderRadius: 4, marginBottom: 8 },
  storageFill: { height: '100%', backgroundColor: '#007AFF', borderRadius: 4 },
  storageText: { fontSize: 13, color: '#8E8E93' },
  bottomPadding: { height: 100 },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default SharedFoldersScreen;
