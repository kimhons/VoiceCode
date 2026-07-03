import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface SessionStat {
  label: string;
  value: string;
  change: number;
  icon: string;
  color: string;
}

interface DailySession {
  date: string;
  sessions: number;
  duration: number;
  notes: number;
}

const SessionAnalyticsScreen: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');

  const stats: SessionStat[] = [
    { label: 'Total Sessions', value: '127', change: 12, icon: 'mic', color: '#007AFF' },
    { label: 'Avg Duration', value: '18m', change: -5, icon: 'time', color: '#34C759' },
    { label: 'Notes Created', value: '312', change: 23, icon: 'document-text', color: '#FF9500' },
    { label: 'Words Transcribed', value: '45.2K', change: 18, icon: 'text', color: '#AF52DE' },
  ];

  const weeklyData: DailySession[] = [
    { date: 'Mon', sessions: 18, duration: 320, notes: 42 },
    { date: 'Tue', sessions: 22, duration: 410, notes: 55 },
    { date: 'Wed', sessions: 15, duration: 280, notes: 38 },
    { date: 'Thu', sessions: 25, duration: 480, notes: 62 },
    { date: 'Fri', sessions: 20, duration: 360, notes: 48 },
    { date: 'Sat', sessions: 8, duration: 140, notes: 22 },
    { date: 'Sun', sessions: 5, duration: 90, notes: 15 },
  ];

  const maxSessions = Math.max(...weeklyData.map(d => d.sessions));

  const topSpecialties = [
    { name: 'Internal Medicine', percentage: 35, color: '#007AFF' },
    { name: 'Cardiology', percentage: 22, color: '#FF3B30' },
    { name: 'Pediatrics', percentage: 18, color: '#FF9500' },
    { name: 'Orthopedics', percentage: 15, color: '#34C759' },
    { name: 'Other', percentage: 10, color: '#8E8E93' },
  ];

  const recentInsights = [
    {
      icon: 'trending-up',
      text: 'Your transcription speed improved by 15% this week',
      type: 'positive',
    },
    {
      icon: 'time',
      text: 'Average session duration is 3 minutes shorter than last month',
      type: 'neutral',
    },
    { icon: 'star', text: "You've maintained 98% transcription accuracy", type: 'positive' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Session Analytics</Text>
        <TouchableOpacity style={styles.exportButton}>
          <Ionicons name="share-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.timeRangeBar}>
        {(['week', 'month', 'year'] as const).map(range => (
          <TouchableOpacity
            key={range}
            style={[styles.timeRangeButton, timeRange === range && styles.timeRangeButtonActive]}
            onPress={() => setTimeRange(range)}
          >
            <Text style={[styles.timeRangeText, timeRange === range && styles.timeRangeTextActive]}>
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsGrid}>
          {stats.map((stat, idx) => (
            <View key={idx} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
                <Ionicons name={stat.icon as any} size={20} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <View style={styles.statChange}>
                <Ionicons
                  name={stat.change >= 0 ? 'arrow-up' : 'arrow-down'}
                  size={12}
                  color={stat.change >= 0 ? '#34C759' : '#FF3B30'}
                />
                <Text
                  style={[
                    styles.statChangeText,
                    { color: stat.change >= 0 ? '#34C759' : '#FF3B30' },
                  ]}
                >
                  {Math.abs(stat.change)}%
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sessions This Week</Text>
          <View style={styles.chartContainer}>
            <View style={styles.barChart}>
              {weeklyData.map((day, idx) => (
                <View key={idx} style={styles.barContainer}>
                  <View style={styles.barWrapper}>
                    <View style={[styles.bar, { height: (day.sessions / maxSessions) * 120 }]} />
                  </View>
                  <Text style={styles.barLabel}>{day.date}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Specialties</Text>
          <View style={styles.specialtiesCard}>
            {topSpecialties.map((specialty, idx) => (
              <View key={idx} style={styles.specialtyRow}>
                <View style={styles.specialtyInfo}>
                  <View style={[styles.specialtyDot, { backgroundColor: specialty.color }]} />
                  <Text style={styles.specialtyName}>{specialty.name}</Text>
                </View>
                <View style={styles.specialtyBarContainer}>
                  <View
                    style={[
                      styles.specialtyBar,
                      { width: `${specialty.percentage}%`, backgroundColor: specialty.color },
                    ]}
                  />
                </View>
                <Text style={styles.specialtyPercentage}>{specialty.percentage}%</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Insights</Text>
          {recentInsights.map((insight, idx) => (
            <View key={idx} style={styles.insightCard}>
              <View
                style={[
                  styles.insightIcon,
                  { backgroundColor: insight.type === 'positive' ? '#34C75920' : '#8E8E9320' },
                ]}
              >
                <Ionicons
                  name={insight.icon as any}
                  size={20}
                  color={insight.type === 'positive' ? '#34C759' : '#8E8E93'}
                />
              </View>
              <Text style={styles.insightText}>{insight.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Metrics</Text>
          <View style={styles.metricsCard}>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Transcription Accuracy</Text>
              <Text style={styles.metricValue}>98.2%</Text>
            </View>
            <View style={styles.metricProgress}>
              <View style={[styles.metricProgressFill, { width: '98.2%' }]} />
            </View>

            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Template Usage Rate</Text>
              <Text style={styles.metricValue}>76%</Text>
            </View>
            <View style={styles.metricProgress}>
              <View
                style={[styles.metricProgressFill, { width: '76%', backgroundColor: '#FF9500' }]}
              />
            </View>

            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Auto-Coding Adoption</Text>
              <Text style={styles.metricValue}>84%</Text>
            </View>
            <View style={styles.metricProgress}>
              <View
                style={[styles.metricProgressFill, { width: '84%', backgroundColor: '#AF52DE' }]}
              />
            </View>
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
  exportButton: { padding: 4 },
  timeRangeBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  timeRangeButton: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 8 },
  timeRangeButtonActive: { backgroundColor: '#007AFF' },
  timeRangeText: { fontSize: 14, fontWeight: '500', color: '#8E8E93' },
  timeRangeTextActive: { color: '#FFF' },
  content: { flex: 1 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12 },
  statCard: {
    width: (width - 40) / 2,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    margin: 4,
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
  statChange: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  statChangeText: { fontSize: 12, fontWeight: '600', marginLeft: 2 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1C1C1E', marginBottom: 12 },
  chartContainer: { backgroundColor: '#FFF', borderRadius: 14, padding: 16 },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
  },
  barContainer: { alignItems: 'center', flex: 1 },
  barWrapper: { height: 120, justifyContent: 'flex-end' },
  bar: { width: 24, backgroundColor: '#007AFF', borderRadius: 6 },
  barLabel: { fontSize: 12, color: '#8E8E93', marginTop: 8 },
  specialtiesCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 16 },
  specialtyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  specialtyInfo: { flexDirection: 'row', alignItems: 'center', width: 130 },
  specialtyDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  specialtyName: { fontSize: 14, color: '#1C1C1E' },
  specialtyBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 4,
    marginHorizontal: 10,
  },
  specialtyBar: { height: '100%', borderRadius: 4 },
  specialtyPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    width: 40,
    textAlign: 'right',
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightText: { flex: 1, fontSize: 14, color: '#1C1C1E', lineHeight: 20 },
  metricsCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 16 },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: { fontSize: 14, color: '#1C1C1E' },
  metricValue: { fontSize: 14, fontWeight: '600', color: '#1C1C1E' },
  metricProgress: { height: 8, backgroundColor: '#F2F2F7', borderRadius: 4, marginBottom: 16 },
  metricProgressFill: { height: '100%', backgroundColor: '#34C759', borderRadius: 4 },
  bottomPadding: { height: 40 },
});

export default SessionAnalyticsScreen;
