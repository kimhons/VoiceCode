import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StatisticsScreenProps {
  navigation: { navigate: (screen: string) => void; goBack: () => void };
}

type Period = 'Week' | 'Month' | 'Year';

const StatisticsScreen: React.FC<StatisticsScreenProps> = () => {
  const [period, setPeriod] = useState<Period>('Week');
  const [exported, setExported] = useState(false);

  const stats: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { label: 'Total Transcripts', value: '142', icon: 'document-text-outline' },
    { label: 'Recording Time', value: '38h 24m', icon: 'time-outline' },
    { label: 'Total Words', value: '284,910', icon: 'text-outline' },
    { label: 'Avg. Session', value: '16m', icon: 'stats-chart-outline' },
  ];

  return (
    <ScrollView style={styles.container} testID="statistics-screen">
      <View style={styles.periodRow}>
        {(['Week', 'Month', 'Year'] as Period[]).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodChip, period === p && styles.periodChipActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.grid}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <Ionicons name={stat.icon} size={22} color="#667eea" />
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Usage Over Time</Text>
        <View style={styles.chart} testID="usage-chart">
          {[40, 65, 30, 80, 55, 70, 45].map((h, i) => (
            <View key={i} style={[styles.bar, { height: `${h}%` }]} />
          ))}
        </View>
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Category Breakdown</Text>
        <View style={styles.chart} testID="category-chart">
          {[
            { label: 'Meetings', pct: 45, color: '#667eea' },
            { label: 'Notes', pct: 30, color: '#34C759' },
            { label: 'Ideas', pct: 25, color: '#FF9500' },
          ].map((c) => (
            <View key={c.label} style={styles.categoryRow}>
              <View style={[styles.categorySwatch, { backgroundColor: c.color }]} />
              <Text style={styles.categoryLabel}>{c.label}</Text>
              <Text style={styles.categoryPct}>{c.pct}%</Text>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={styles.exportButton}
        testID="export-stats"
        onPress={() => setExported(true)}
      >
        <Ionicons name="download-outline" size={18} color="#fff" />
        <Text style={styles.exportText}>Export Report</Text>
      </TouchableOpacity>

      {exported ? <Text style={styles.exportedMsg}>Report exported</Text> : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fa' },
  periodRow: { flexDirection: 'row', padding: 16 },
  periodChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  periodChipActive: { backgroundColor: '#667eea' },
  periodText: { fontSize: 14, color: '#1a1a2e' },
  periodTextActive: { color: '#fff', fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
  statCard: {
    width: '46%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    margin: '2%',
  },
  statValue: { fontSize: 24, fontWeight: '700', color: '#1a1a2e', marginTop: 8 },
  statLabel: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
  },
  chartTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a2e', marginBottom: 16 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 120 },
  bar: { flex: 1, backgroundColor: '#667eea', marginHorizontal: 3, borderRadius: 4 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  categorySwatch: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
  categoryLabel: { flex: 1, fontSize: 15, color: '#1a1a2e' },
  categoryPct: { fontSize: 15, fontWeight: '600', color: '#8E8E93' },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingVertical: 14,
    margin: 16,
  },
  exportText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  exportedMsg: { textAlign: 'center', color: '#34C759', paddingBottom: 24 },
});

export default StatisticsScreen;
