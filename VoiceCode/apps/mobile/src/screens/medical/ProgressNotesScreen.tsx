import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface ProgressNote {
  id: string;
  patientName: string;
  dateCreated: Date;
  status: 'draft' | 'completed' | 'signed';
  noteType: string;
  preview: string;
}

const ProgressNotesScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'completed' | 'signed'>('all');
  const [isRecording, setIsRecording] = useState(false);

  const notes: ProgressNote[] = [
    {
      id: '1',
      patientName: 'John Smith',
      dateCreated: new Date(),
      status: 'draft',
      noteType: 'Follow-up',
      preview: 'Patient returns for follow-up of hypertension...',
    },
    {
      id: '2',
      patientName: 'Maria Garcia',
      dateCreated: new Date(Date.now() - 3600000),
      status: 'completed',
      noteType: 'Post-op',
      preview: 'Day 2 post appendectomy. Vitals stable...',
    },
    {
      id: '3',
      patientName: 'Robert Johnson',
      dateCreated: new Date(Date.now() - 86400000),
      status: 'signed',
      noteType: 'Daily Round',
      preview: 'Patient continues to improve. O2 sats...',
    },
    {
      id: '4',
      patientName: 'Emily Chen',
      dateCreated: new Date(Date.now() - 172800000),
      status: 'signed',
      noteType: 'Consultation',
      preview: 'Cardiology consultation for chest pain...',
    },
  ];

  const getStatusColor = (status: ProgressNote['status']): string => {
    switch (status) {
      case 'draft':
        return '#FF9500';
      case 'completed':
        return '#007AFF';
      case 'signed':
        return '#34C759';
      default:
        return '#8E8E93';
    }
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return date.toLocaleDateString();
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.patientName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || note.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const renderNoteCard = ({ item }: { item: ProgressNote }) => (
    <TouchableOpacity style={styles.noteCard}>
      <View style={styles.noteHeader}>
        <View style={styles.noteInfo}>
          <Text style={styles.patientName}>{item.patientName}</Text>
          <View
            style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}
          >
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>
        <Text style={styles.noteDate}>{formatDate(item.dateCreated)}</Text>
      </View>
      <View style={styles.noteTypeRow}>
        <Ionicons name="document-text" size={14} color="#8E8E93" />
        <Text style={styles.noteType}>{item.noteType}</Text>
      </View>
      <Text style={styles.notePreview} numberOfLines={2}>
        {item.preview}
      </Text>
      <View style={styles.noteActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="create-outline" size={16} color="#007AFF" />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="mic-outline" size={16} color="#34C759" />
          <Text style={[styles.actionText, { color: '#34C759' }]}>Dictate</Text>
        </TouchableOpacity>
        {item.status === 'completed' && (
          <TouchableOpacity style={styles.signButton}>
            <Ionicons name="checkmark-circle" size={16} color="#FFF" />
            <Text style={styles.signText}>Sign</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Progress Notes</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search patients..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {(['all', 'draft', 'completed', 'signed'] as const).map(status => (
            <TouchableOpacity
              key={status}
              style={[styles.filterChip, filterStatus === status && styles.filterChipActive]}
              onPress={() => setFilterStatus(status)}
            >
              <Text style={[styles.filterText, filterStatus === status && styles.filterTextActive]}>
                {status === 'all' ? 'All Notes' : status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.quickRecordButton, isRecording && styles.quickRecordButtonActive]}
          onPress={() => setIsRecording(!isRecording)}
        >
          <Ionicons name={isRecording ? 'stop' : 'mic'} size={20} color="#FFF" />
          <Text style={styles.quickRecordText}>
            {isRecording ? 'Stop Recording' : 'Quick Dictation'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredNotes}
        renderItem={renderNoteCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.notesList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#CCC" />
            <Text style={styles.emptyTitle}>No Progress Notes</Text>
            <Text style={styles.emptyDescription}>Start a new note to begin documenting</Text>
          </View>
        }
      />
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
  searchSection: { padding: 16, backgroundColor: '#FFF' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: { flex: 1, fontSize: 16, color: '#1C1C1E', marginLeft: 8 },
  filterSection: {
    backgroundColor: '#FFF',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filterScroll: { paddingHorizontal: 16 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipActive: { backgroundColor: '#007AFF' },
  filterText: { fontSize: 14, color: '#666' },
  filterTextActive: { color: '#FFF', fontWeight: '500' },
  quickActions: { padding: 16 },
  quickRecordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    paddingVertical: 14,
    borderRadius: 12,
  },
  quickRecordButtonActive: { backgroundColor: '#FF3B30' },
  quickRecordText: { fontSize: 16, fontWeight: '600', color: '#FFF', marginLeft: 8 },
  notesList: { padding: 16 },
  noteCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, marginBottom: 12 },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  noteInfo: { flexDirection: 'row', alignItems: 'center' },
  patientName: { fontSize: 17, fontWeight: '600', color: '#1C1C1E', marginRight: 10 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 12, fontWeight: '600' },
  noteDate: { fontSize: 12, color: '#8E8E93' },
  noteTypeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  noteType: { fontSize: 13, color: '#8E8E93', marginLeft: 4 },
  notePreview: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 12 },
  noteActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    paddingTop: 12,
  },
  actionButton: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  actionText: { fontSize: 14, color: '#007AFF', marginLeft: 4 },
  signButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 'auto',
  },
  signText: { fontSize: 13, fontWeight: '600', color: '#FFF', marginLeft: 4 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1C1C1E', marginTop: 16 },
  emptyDescription: { fontSize: 14, color: '#8E8E93', marginTop: 8 },
});

export default ProgressNotesScreen;
