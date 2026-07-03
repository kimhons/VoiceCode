import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const UsageAnalyticsScreen: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  const periods = [
    { id: 'day', label: 'Today' },
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
    { id: 'year', label: 'Year' },
  ];

  const stats = {
    totalRecordings: 156,
    totalHours: 234.5,
    avgDuration: 28,
    transcriptsGenerated: 142,
  };

  const weeklyData = [
    { day: 'Mon', recordings: 8, hours: 4.2 },
    { day: 'Tue', recordings: 12, hours: 6.5 },
    { day: 'Wed', recordings: 6, hours: 3.1 },
    { day: 'Thu', recordings: 15, hours: 8.2 },
    { day: 'Fri', recordings: 10, hours: 5.4 },
    { day: 'Sat', recordings: 2, hours: 1.0 },
    { day: 'Sun', recordings: 1, hours: 0.5 },
  ];

  const topCategories = [
    { name: 'Team Meetings', count: 45, percentage: 35, color: '#007AFF' },
    { name: 'Client Calls', count: 32, percentage: 25, color: '#34C759' },
    { name: 'Interviews', count: 25, percentage: 20, color: '#FF9500' },
    { name: 'Training', count: 15, percentage: 12, color: '#AF52DE' },
    { name: 'Other', count: 10, percentage: 8, color: '#8E8E93' },
  ];

  const maxRecordings = Math.max(...weeklyData.map(d => d.recordings));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Usage Analytics</Text>
        <TouchableOpacity style={styles.exportButton}>
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
              <Ionicons name="mic" size={20} color="#007AFF" />
            </View>
            <Text style={styles.statValue}>{stats.totalRecordings}</Text>
            <Text style={styles.statLabel}>Recordings</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#34C75920' }]}>
              <Ionicons name="time" size={20} color="#34C759" />
            </View>
            <Text style={styles.statValue}>{stats.totalHours}h</Text>
            <Text style={styles.statLabel}>Total Hours</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FF950020' }]}>
              <Ionicons name="hourglass" size={20} color="#FF9500" />
            </View>
            <Text style={styles.statValue}>{stats.avgDuration}m</Text>
            <Text style={styles.statLabel}>Avg Duration</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#AF52DE20' }]}>
              <Ionicons name="document-text" size={20} color="#AF52DE" />
            </View>
            <Text style={styles.statValue}>{stats.transcriptsGenerated}</Text>
            <Text style={styles.statLabel}>Transcripts</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recording Activity</Text>
          <View style={styles.chartCard}>
            <View style={styles.barChart}>
              {weeklyData.map((data, idx) => (
                <View key={idx} style={styles.barContainer}>
                  <View style={styles.barWrapper}>
                    <View
                      style={[
                        styles.bar,
                        { height: `${(data.recordings / maxRecordings) * 100}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{data.day}</Text>
                </View>
              ))}
            </View>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#007AFF' }]} />
                <Text style={styles.legendText}>Recordings</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <View style={styles.categoriesCard}>
            {topCategories.map((cat, idx) => (
              <View key={idx} style={styles.categoryRow}>
                <View style={styles.categoryInfo}>
                  <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
                  <Text style={styles.categoryName}>{cat.name}</Text>
                </View>
                <View style={styles.categoryStats}>
                  <View style={styles.categoryBar}>
                    <View
                      style={[
                        styles.categoryFill,
                        { width: `${cat.percentage}%`, backgroundColor: cat.color },
                      ]}
                    />
                  </View>
                  <Text style={styles.categoryCount}>{cat.count}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Insights</Text>
          <View style={styles.insightsCard}>
            <View style={styles.insightItem}>
              <View style={[styles.insightIcon, { backgroundColor: '#34C75920' }]}>
                <Ionicons name="trending-up" size={20} color="#34C759" />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Recording time up 23%</Text>
                <Text style={styles.insightDesc}>Compared to last week</Text>
              </View>
            </View>
            <View style={styles.insightDivider} />
            <View style={styles.insightItem}>
              <View style={[styles.insightIcon, { backgroundColor: '#007AFF20' }]}>
                <Ionicons name="calendar" size={20} color="#007AFF" />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Busiest day: Thursday</Text>
                <Text style={styles.insightDesc}>15 recordings on average</Text>
              </View>
            </View>
            <View style={styles.insightDivider} />
            <View style={styles.insightItem}>
              <View style={[styles.insightIcon, { backgroundColor: '#FF950020' }]}>
                <Ionicons name="time" size={20} color="#FF9500" />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Peak hours: 10AM - 2PM</Text>
                <Text style={styles.insightDesc}>60% of recordings during this time</Text>
              </View>
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
  chartCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 16 },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 150,
    marginBottom: 12,
  },
  barContainer: { flex: 1, alignItems: 'center' },
  barWrapper: {
    flex: 1,
    width: 24,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: { width: '100%', backgroundColor: '#007AFF', borderRadius: 12 },
  barLabel: { fontSize: 11, color: '#8E8E93', marginTop: 6 },
  chartLegend: { flexDirection: 'row', justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  legendText: { fontSize: 12, color: '#8E8E93' },
  categoriesCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 16 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  categoryInfo: { flexDirection: 'row', alignItems: 'center', width: 120 },
  categoryDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  categoryName: { fontSize: 14, color: '#1C1C1E' },
  categoryStats: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  categoryBar: { flex: 1, height: 8, backgroundColor: '#F2F2F7', borderRadius: 4, marginRight: 10 },
  categoryFill: { height: '100%', borderRadius: 4 },
  categoryCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    width: 30,
    textAlign: 'right',
  },
  insightsCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 16 },
  insightItem: { flexDirection: 'row', alignItems: 'center' },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightContent: { flex: 1 },
  insightTitle: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  insightDesc: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  insightDivider: { height: 1, backgroundColor: '#F2F2F7', marginVertical: 12 },
  bottomPadding: { height: 40 },
});

export default UsageAnalyticsScreen;
