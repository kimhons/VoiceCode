import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface VoiceMemo {
  id: string;
  title: string;
  duration: string;
  date: Date;
  isPlaying: boolean;
  hasTranscript: boolean;
}

const VoiceMemosScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [memos] = useState<VoiceMemo[]>([
    {
      id: '1',
      title: 'Project ideas',
      duration: '2:34',
      date: new Date(),
      isPlaying: false,
      hasTranscript: true,
    },
    {
      id: '2',
      title: 'Shopping list',
      duration: '0:45',
      date: new Date(Date.now() - 86400000),
      isPlaying: false,
      hasTranscript: true,
    },
    {
      id: '3',
      title: 'Book notes',
      duration: '5:12',
      date: new Date(Date.now() - 172800000),
      isPlaying: false,
      hasTranscript: false,
    },
    {
      id: '4',
      title: 'Meeting recap',
      duration: '8:30',
      date: new Date(Date.now() - 259200000),
      isPlaying: false,
      hasTranscript: true,
    },
  ]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Voice Memos</Text>
        <TouchableOpacity>
          <Ionicons name="folder-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search memos..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.recordSection}>
        <TouchableOpacity style={styles.recordButton}>
          <Ionicons name="mic" size={32} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.recordHint}>Tap to record new memo</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>All Memos ({memos.length})</Text>
        {memos.map(memo => (
          <View key={memo.id} style={styles.memoCard}>
            <TouchableOpacity style={styles.playButton}>
              <Ionicons name={memo.isPlaying ? 'pause' : 'play'} size={20} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.memoInfo}>
              <Text style={styles.memoTitle}>{memo.title}</Text>
              <View style={styles.memoMeta}>
                <Text style={styles.memoDuration}>{memo.duration}</Text>
                <Text style={styles.memoDate}>{memo.date.toLocaleDateString()}</Text>
                {memo.hasTranscript && (
                  <View style={styles.transcriptBadge}>
                    <Ionicons name="text" size={12} color="#34C759" />
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity style={styles.moreButton}>
              <Ionicons name="ellipsis-vertical" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: { fontSize: 20, fontWeight: '600', color: '#1A1A1A' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 15,
    color: '#1A1A1A',
  },
  recordSection: { alignItems: 'center', paddingVertical: 24 },
  recordButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordHint: { fontSize: 13, color: '#666', marginTop: 12 },
  content: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 12 },
  memoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memoInfo: { flex: 1 },
  memoTitle: { fontSize: 15, fontWeight: '500', color: '#1A1A1A' },
  memoMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  memoDuration: { fontSize: 12, color: '#007AFF', marginRight: 12 },
  memoDate: { fontSize: 12, color: '#666' },
  transcriptBadge: { marginLeft: 8 },
  moreButton: { padding: 8 },
});

export default VoiceMemosScreen;
