import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface ClinicalNote {
  id: string;
  patientName: string;
  mrn: string;
  noteType: string;
  date: Date;
  status: 'draft' | 'pending_review' | 'signed' | 'amended';
  provider: string;
}

const ClinicalNotesScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'draft' | 'pending' | 'signed'>(
    'all'
  );
  const [notes, setNotes] = useState<ClinicalNote[]>([
    {
      id: '1',
      patientName: 'John Smith',
      mrn: 'MRN-12345',
      noteType: 'Progress Note',
      date: new Date(),
      status: 'draft',
      provider: 'Dr. Williams',
    },
    {
      id: '2',
      patientName: 'Mary Johnson',
      mrn: 'MRN-23456',
      noteType: 'SOAP Note',
      date: new Date(Date.now() - 86400000),
      status: 'pending_review',
      provider: 'Dr. Williams',
    },
    {
      id: '3',
      patientName: 'Robert Brown',
      mrn: 'MRN-34567',
      noteType: 'Discharge Summary',
      date: new Date(Date.now() - 172800000),
      status: 'signed',
      provider: 'Dr. Williams',
    },
    {
      id: '4',
      patientName: 'Sarah Davis',
      mrn: 'MRN-45678',
      noteType: 'Consultation',
      date: new Date(Date.now() - 259200000),
      status: 'amended',
      provider: 'Dr. Williams',
    },
  ]);

  const getStatusColor = (status: ClinicalNote['status']) => {
    switch (status) {
      case 'draft':
        return '#FF9500';
      case 'pending_review':
        return '#007AFF';
      case 'signed':
        return '#34C759';
      case 'amended':
        return '#AF52DE';
      default:
        return '#666';
    }
  };

  const getStatusLabel = (status: ClinicalNote['status']) => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'pending_review':
        return 'Pending Review';
      case 'signed':
        return 'Signed';
      case 'amended':
        return 'Amended';
      default:
        return status;
    }
  };

  const filteredNotes = notes
    .filter(note => {
      if (selectedFilter === 'all') return true;
      if (selectedFilter === 'draft') return note.status === 'draft';
      if (selectedFilter === 'pending') return note.status === 'pending_review';
      if (selectedFilter === 'signed') return note.status === 'signed' || note.status === 'amended';
      return true;
    })
    .filter(
      note =>
        note.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.mrn.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Clinical Notes</Text>
        <TouchableOpacity style={styles.newNoteButton}>
          <Ionicons name="add" size={20} color="#FFF" />
          <Text style={styles.newNoteText}>New Note</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by patient name or MRN..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(['all', 'draft', 'pending', 'signed'] as const).map(filter => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterButton, selectedFilter === filter && styles.filterButtonActive]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text
                style={[styles.filterText, selectedFilter === filter && styles.filterTextActive]}
              >
                {filter === 'all'
                  ? 'All Notes'
                  : filter === 'pending'
                    ? 'Pending Review'
                    : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{notes.filter(n => n.status === 'draft').length}</Text>
          <Text style={styles.statLabel}>Drafts</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {notes.filter(n => n.status === 'pending_review').length}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{notes.filter(n => n.status === 'signed').length}</Text>
          <Text style={styles.statLabel}>Signed Today</Text>
        </View>
      </View>

      <ScrollView style={styles.notesList}>
        {filteredNotes.map(note => (
          <TouchableOpacity key={note.id} style={styles.noteCard}>
            <View style={styles.noteHeader}>
              <View style={styles.patientInfo}>
                <Text style={styles.patientName}>{note.patientName}</Text>
                <Text style={styles.mrn}>{note.mrn}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: `${getStatusColor(note.status)}20` },
                ]}
              >
                <Text style={[styles.statusText, { color: getStatusColor(note.status) }]}>
                  {getStatusLabel(note.status)}
                </Text>
              </View>
            </View>
            <View style={styles.noteDetails}>
              <View style={styles.noteType}>
                <Ionicons name="document-text" size={14} color="#666" />
                <Text style={styles.noteTypeText}>{note.noteType}</Text>
              </View>
              <View style={styles.noteDate}>
                <Ionicons name="calendar" size={14} color="#666" />
                <Text style={styles.noteDateText}>{note.date.toLocaleDateString()}</Text>
              </View>
            </View>
            <View style={styles.noteActions}>
              <TouchableOpacity style={styles.noteAction}>
                <Ionicons name="mic" size={16} color="#007AFF" />
                <Text style={styles.noteActionText}>Dictate</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.noteAction}>
                <Ionicons name="create" size={16} color="#007AFF" />
                <Text style={styles.noteActionText}>Edit</Text>
              </TouchableOpacity>
              {note.status === 'draft' && (
                <TouchableOpacity style={styles.noteAction}>
                  <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                  <Text style={[styles.noteActionText, { color: '#34C759' }]}>Sign</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickAction}>
          <View style={styles.quickActionIcon}>
            <Ionicons name="mic" size={24} color="#007AFF" />
          </View>
          <Text style={styles.quickActionText}>Quick Dictate</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <View style={styles.quickActionIcon}>
            <Ionicons name="scan" size={24} color="#007AFF" />
          </View>
          <Text style={styles.quickActionText}>Scan Document</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <View style={styles.quickActionIcon}>
            <Ionicons name="document-attach" size={24} color="#007AFF" />
          </View>
          <Text style={styles.quickActionText}>Templates</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  newNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  newNoteText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  searchSection: {
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
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
  filterSection: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 13,
    color: '#666',
  },
  filterTextActive: {
    color: '#FFF',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  notesList: {
    flex: 1,
    padding: 16,
  },
  noteCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  mrn: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  noteDetails: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  noteType: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  noteTypeText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  noteDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteDateText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  noteActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  noteAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  noteActionText: {
    fontSize: 13,
    color: '#007AFF',
    marginLeft: 4,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFF',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  quickAction: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  quickActionText: {
    fontSize: 11,
    color: '#666',
  },
});

export default ClinicalNotesScreen;
