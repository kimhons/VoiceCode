import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const MeetingInsightsScreen: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  const periods = [
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
    { id: 'quarter', label: 'Quarter' },
  ];

  const overviewStats = {
    totalMeetings: 47,
    totalHours: 38.5,
    avgDuration: 49,
    actionItems: 156,
  };

  const meetingTypes = [
    { type: 'Team Syncs', count: 18, hours: 9, color: '#007AFF' },
    { type: 'Client Calls', count: 12, hours: 14, color: '#34C759' },
    { type: 'One-on-Ones', count: 10, hours: 5, color: '#FF9500' },
    { type: 'All Hands', count: 4, hours: 6, color: '#AF52DE' },
    { type: 'Other', count: 3, hours: 4.5, color: '#8E8E93' },
  ];

  const topParticipants = [
    { name: 'Sarah Wilson', meetings: 23, avatar: 'SW' },
    { name: 'Mike Johnson', meetings: 19, avatar: 'MJ' },
    { name: 'Emily Chen', meetings: 15, avatar: 'EC' },
    { name: 'David Kim', meetings: 12, avatar: 'DK' },
  ];

  const peakTimes = [
    { time: '10:00 AM', meetings: 12 },
    { time: '2:00 PM', meetings: 10 },
    { time: '11:00 AM', meetings: 8 },
    { time: '3:00 PM', meetings: 7 },
  ];

  const maxMeetings = Math.max(...peakTimes.map(t => t.meetings));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Meeting Insights</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.periodSelector}>
        {periods.map(period => (
          <TouchableOpacity
            key={period.id}
            style={[styles.periodButton, selectedPeriod === period.id && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod(period.id)}
          >
            <Text
              style={[styles.periodText, selectedPeriod === period.id && styles.periodTextActive]}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#007AFF20' }]}>
              <Ionicons name="calendar" size={20} color="#007AFF" />
            </View>
            <Text style={styles.statValue}>{overviewStats.totalMeetings}</Text>
            <Text style={styles.statLabel}>Meetings</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#34C75920' }]}>
              <Ionicons name="time" size={20} color="#34C759" />
            </View>
            <Text style={styles.statValue}>{overviewStats.totalHours}h</Text>
            <Text style={styles.statLabel}>Total Time</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FF950020' }]}>
              <Ionicons name="hourglass" size={20} color="#FF9500" />
            </View>
            <Text style={styles.statValue}>{overviewStats.avgDuration}m</Text>
            <Text style={styles.statLabel}>Avg Duration</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#AF52DE20' }]}>
              <Ionicons name="checkbox" size={20} color="#AF52DE" />
            </View>
            <Text style={styles.statValue}>{overviewStats.actionItems}</Text>
            <Text style={styles.statLabel}>Action Items</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meeting Types</Text>
          <View style={styles.typesCard}>
            {meetingTypes.map((type, idx) => (
              <View key={idx} style={styles.typeRow}>
                <View style={[styles.typeDot, { backgroundColor: type.color }]} />
                <Text style={styles.typeName}>{type.type}</Text>
                <View style={styles.typeStats}>
                  <Text style={styles.typeCount}>{type.count}</Text>
                  <Text style={styles.typeHours}>{type.hours}h</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Peak Meeting Times</Text>
          <View style={styles.peakCard}>
            {peakTimes.map((item, idx) => (
              <View key={idx} style={styles.peakRow}>
                <Text style={styles.peakTime}>{item.time}</Text>
                <View style={styles.peakBar}>
                  <View
                    style={[styles.peakFill, { width: `${(item.meetings / maxMeetings) * 100}%` }]}
                  />
                </View>
                <Text style={styles.peakCount}>{item.meetings}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Collaborators</Text>
          <View style={styles.participantsCard}>
            {topParticipants.map((person, idx) => (
              <View key={idx} style={styles.participantRow}>
                <View style={styles.participantAvatar}>
                  <Text style={styles.avatarText}>{person.avatar}</Text>
                </View>
                <View style={styles.participantInfo}>
                  <Text style={styles.participantName}>{person.name}</Text>
                  <Text style={styles.participantMeetings}>
                    {person.meetings} meetings together
                  </Text>
                </View>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>#{idx + 1}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.insightCard}>
          <View style={styles.insightIcon}>
            <Ionicons name="bulb" size={24} color="#FF9500" />
          </View>
          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>Weekly Insight</Text>
            <Text style={styles.insightText}>
              You spent 23% more time in meetings this week compared to last week. Consider blocking
              focus time.
            </Text>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
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
  shareButton: { padding: 4 },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  periodButton: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
  periodButtonActive: { backgroundColor: '#007AFF' },
  periodText: { fontSize: 14, fontWeight: '500', color: '#8E8E93' },
  periodTextActive: { color: '#FFF' },
  content: { flex: 1 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12 },
  statCard: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    margin: '1%',
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: { fontSize: 24, fontWeight: '700', color: '#1C1C1E' },
  statLabel: { fontSize: 12, color: '#8E8E93', marginTop: 4 },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  typesCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 16 },
  typeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  typeDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  typeName: { flex: 1, fontSize: 15, color: '#1C1C1E' },
  typeStats: { flexDirection: 'row', alignItems: 'center' },
  typeCount: { fontSize: 14, fontWeight: '600', color: '#1C1C1E', marginRight: 12 },
  typeHours: { fontSize: 13, color: '#8E8E93', width: 40 },
  peakCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 16 },
  peakRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  peakTime: { fontSize: 13, color: '#8E8E93', width: 80 },
  peakBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 4,
    marginHorizontal: 12,
  },
  peakFill: { height: '100%', backgroundColor: '#007AFF', borderRadius: 4 },
  peakCount: { fontSize: 14, fontWeight: '600', color: '#1C1C1E', width: 24, textAlign: 'right' },
  participantsCard: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  participantInfo: { flex: 1 },
  participantName: { fontSize: 15, fontWeight: '500', color: '#1C1C1E' },
  participantMeetings: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  rankBadge: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  rankText: { fontSize: 12, fontWeight: '600', color: '#8E8E93' },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: '#FF950015',
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  insightIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF950020',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightContent: { flex: 1 },
  insightTitle: { fontSize: 14, fontWeight: '600', color: '#FF9500' },
  insightText: { fontSize: 14, color: '#8E8E93', marginTop: 4, lineHeight: 20 },
  bottomPadding: { height: 40 },
});

export default MeetingInsightsScreen;
