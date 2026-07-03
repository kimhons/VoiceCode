import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface ScheduledRecording {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: number;
  platform: 'zoom' | 'teams' | 'meet' | 'manual';
  status: 'scheduled' | 'in_progress' | 'completed' | 'failed';
  participants?: number;
}

const ScheduledRecordingsScreen: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState('upcoming');

  const filters = [
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'completed', label: 'Completed' },
  ];

  const recordings: ScheduledRecording[] = [
    {
      id: '1',
      title: 'Weekly Team Standup',
      date: 'Today',
      time: '10:00 AM',
      duration: 30,
      platform: 'zoom',
      status: 'scheduled',
      participants: 8,
    },
    {
      id: '2',
      title: 'Product Review',
      date: 'Today',
      time: '2:00 PM',
      duration: 60,
      platform: 'teams',
      status: 'scheduled',
      participants: 12,
    },
    {
      id: '3',
      title: 'Client Call - Acme Corp',
      date: 'Tomorrow',
      time: '11:00 AM',
      duration: 45,
      platform: 'zoom',
      status: 'scheduled',
      participants: 5,
    },
    {
      id: '4',
      title: 'Engineering Sync',
      date: 'Tomorrow',
      time: '3:30 PM',
      duration: 30,
      platform: 'meet',
      status: 'scheduled',
      participants: 6,
    },
    {
      id: '5',
      title: 'Marketing Strategy',
      date: 'Jan 22',
      time: '9:00 AM',
      duration: 90,
      platform: 'teams',
      status: 'scheduled',
      participants: 15,
    },
    {
      id: '6',
      title: 'Quarterly Planning',
      date: 'Jan 25',
      time: '1:00 PM',
      duration: 120,
      platform: 'zoom',
      status: 'scheduled',
      participants: 20,
    },
  ];

  const getPlatformInfo = (platform: string): { icon: string; color: string; name: string } => {
    switch (platform) {
      case 'zoom':
        return { icon: 'videocam', color: '#2D8CFF', name: 'Zoom' };
      case 'teams':
        return { icon: 'people', color: '#6264A7', name: 'Teams' };
      case 'meet':
        return { icon: 'logo-google', color: '#00897B', name: 'Meet' };
      case 'manual':
        return { icon: 'mic', color: '#FF9500', name: 'Manual' };
      default:
        return { icon: 'calendar', color: '#8E8E93', name: 'Other' };
    }
  };

  const getStatusInfo = (status: string): { color: string; label: string } => {
    switch (status) {
      case 'scheduled':
        return { color: '#007AFF', label: 'Scheduled' };
      case 'in_progress':
        return { color: '#FF3B30', label: 'Recording' };
      case 'completed':
        return { color: '#34C759', label: 'Completed' };
      case 'failed':
        return { color: '#FF3B30', label: 'Failed' };
      default:
        return { color: '#8E8E93', label: 'Unknown' };
    }
  };

  const groupedRecordings = {
    today: recordings.filter(r => r.date === 'Today'),
    tomorrow: recordings.filter(r => r.date === 'Tomorrow'),
    later: recordings.filter(r => !['Today', 'Tomorrow'].includes(r.date)),
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Scheduled Recordings</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {filters.map(filter => (
            <TouchableOpacity
              key={filter.id}
              style={[styles.filterChip, selectedFilter === filter.id && styles.filterChipActive]}
              onPress={() => setSelectedFilter(filter.id)}
            >
              <Text
                style={[styles.filterText, selectedFilter === filter.id && styles.filterTextActive]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Ionicons name="calendar" size={18} color="#007AFF" />
          <Text style={styles.statValue}>{recordings.length}</Text>
          <Text style={styles.statLabel}>Scheduled</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="time" size={18} color="#FF9500" />
          <Text style={styles.statValue}>5h 45m</Text>
          <Text style={styles.statLabel}>Total Duration</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="today" size={18} color="#34C759" />
          <Text style={styles.statValue}>2</Text>
          <Text style={styles.statLabel}>Today</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {groupedRecordings.today.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today</Text>
            {groupedRecordings.today.map(recording => {
              const platformInfo = getPlatformInfo(recording.platform);
              const statusInfo = getStatusInfo(recording.status);

              return (
                <TouchableOpacity key={recording.id} style={styles.recordingCard}>
                  <View
                    style={[styles.platformIcon, { backgroundColor: platformInfo.color + '20' }]}
                  >
                    <Ionicons
                      name={platformInfo.icon as any}
                      size={22}
                      color={platformInfo.color}
                    />
                  </View>
                  <View style={styles.recordingInfo}>
                    <Text style={styles.recordingTitle}>{recording.title}</Text>
                    <View style={styles.recordingMeta}>
                      <Ionicons name="time-outline" size={12} color="#8E8E93" />
                      <Text style={styles.metaText}>{recording.time}</Text>
                      <Text style={styles.metaDot}>•</Text>
                      <Text style={styles.metaText}>{recording.duration} min</Text>
                      {recording.participants && (
                        <>
                          <Text style={styles.metaDot}>•</Text>
                          <Ionicons name="people-outline" size={12} color="#8E8E93" />
                          <Text style={styles.metaText}>{recording.participants}</Text>
                        </>
                      )}
                    </View>
                  </View>
                  <View style={styles.recordingActions}>
                    <View
                      style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}
                    >
                      <Text style={[styles.statusText, { color: statusInfo.color }]}>
                        {statusInfo.label}
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.moreButton}>
                      <Ionicons name="ellipsis-horizontal" size={18} color="#8E8E93" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {groupedRecordings.tomorrow.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tomorrow</Text>
            {groupedRecordings.tomorrow.map(recording => {
              const platformInfo = getPlatformInfo(recording.platform);
              const statusInfo = getStatusInfo(recording.status);

              return (
                <TouchableOpacity key={recording.id} style={styles.recordingCard}>
                  <View
                    style={[styles.platformIcon, { backgroundColor: platformInfo.color + '20' }]}
                  >
                    <Ionicons
                      name={platformInfo.icon as any}
                      size={22}
                      color={platformInfo.color}
                    />
                  </View>
                  <View style={styles.recordingInfo}>
                    <Text style={styles.recordingTitle}>{recording.title}</Text>
                    <View style={styles.recordingMeta}>
                      <Ionicons name="time-outline" size={12} color="#8E8E93" />
                      <Text style={styles.metaText}>{recording.time}</Text>
                      <Text style={styles.metaDot}>•</Text>
                      <Text style={styles.metaText}>{recording.duration} min</Text>
                    </View>
                  </View>
                  <View style={styles.recordingActions}>
                    <View
                      style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}
                    >
                      <Text style={[styles.statusText, { color: statusInfo.color }]}>
                        {statusInfo.label}
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.moreButton}>
                      <Ionicons name="ellipsis-horizontal" size={18} color="#8E8E93" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {groupedRecordings.later.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Later</Text>
            {groupedRecordings.later.map(recording => {
              const platformInfo = getPlatformInfo(recording.platform);

              return (
                <TouchableOpacity key={recording.id} style={styles.recordingCard}>
                  <View
                    style={[styles.platformIcon, { backgroundColor: platformInfo.color + '20' }]}
                  >
                    <Ionicons
                      name={platformInfo.icon as any}
                      size={22}
                      color={platformInfo.color}
                    />
                  </View>
                  <View style={styles.recordingInfo}>
                    <Text style={styles.recordingTitle}>{recording.title}</Text>
                    <View style={styles.recordingMeta}>
                      <Ionicons name="calendar-outline" size={12} color="#8E8E93" />
                      <Text style={styles.metaText}>{recording.date}</Text>
                      <Text style={styles.metaDot}>•</Text>
                      <Text style={styles.metaText}>{recording.time}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.moreButton}>
                    <Ionicons name="ellipsis-horizontal" size={18} color="#8E8E93" />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.scheduleButton}>
          <Ionicons name="add-circle" size={20} color="#FFF" />
          <Text style={styles.scheduleText}>Schedule Recording</Text>
        </TouchableOpacity>
      </View>
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
  filterBar: {
    backgroundColor: '#FFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filterScroll: { paddingHorizontal: 16 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 18,
    marginRight: 8,
  },
  filterChipActive: { backgroundColor: '#007AFF' },
  filterText: { fontSize: 14, color: '#8E8E93' },
  filterTextActive: { color: '#FFF', fontWeight: '500' },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '700', color: '#1C1C1E', marginTop: 4 },
  statLabel: { fontSize: 11, color: '#8E8E93', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#E5E5EA' },
  content: { flex: 1 },
  section: { padding: 16 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recordingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  platformIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recordingInfo: { flex: 1 },
  recordingTitle: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  recordingMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  metaText: { fontSize: 12, color: '#8E8E93', marginLeft: 4 },
  metaDot: { marginHorizontal: 6, color: '#8E8E93' },
  recordingActions: { alignItems: 'flex-end' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 6 },
  statusText: { fontSize: 11, fontWeight: '600' },
  moreButton: { padding: 4 },
  bottomPadding: { height: 100 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 14,
  },
  scheduleText: { fontSize: 17, fontWeight: '600', color: '#FFF', marginLeft: 8 },
});

export default ScheduledRecordingsScreen;
