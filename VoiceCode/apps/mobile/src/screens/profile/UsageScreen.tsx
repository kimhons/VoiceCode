import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface UsageScreenProps {
  navigation: { navigate: (screen: string) => void; goBack: () => void };
}

interface Metric {
  key: string;
  label: string;
  used: number;
  limit: number;
}

const PERIODS = ['This Week', 'This Month', 'This Year'];

const METRICS: Metric[] = [
  { key: 'minutes', label: 'Transcription', used: 540, limit: 600 },
  { key: 'storage', label: 'Storage', used: 8, limit: 10 },
  { key: 'ai', label: 'AI Features', used: 45, limit: 50 },
];

const UsageScreen: React.FC<UsageScreenProps> = ({ navigation }) => {
  const [periodOpen, setPeriodOpen] = useState(false);
  const [period, setPeriod] = useState(PERIODS[0]);

  return (
    <ScrollView style={styles.container} testID="usage-screen">
      <Text style={styles.title}>Usage</Text>

      <View style={styles.card} testID="plan-limits">
        <Text style={styles.cardTitle}>Plan Limits</Text>
        <View testID="usage-progress">
          {METRICS.map((metric) => {
            const pct = Math.min(100, Math.round((metric.used / metric.limit) * 100));
            return (
              <View key={metric.key} style={styles.metric}>
                <View style={styles.metricHeader}>
                  <Text style={styles.metricLabel}>{metric.label}</Text>
                  <Text style={styles.metricValue}>
                    {metric.key === 'minutes'
                      ? `${metric.used} / ${metric.limit} minutes`
                      : metric.key === 'storage'
                      ? `${metric.used} / ${metric.limit} GB`
                      : `${metric.used} / ${metric.limit} credits`}
                  </Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${pct}%` }]} />
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.card} testID="usage-history">
        <View style={styles.historyHeader}>
          <Text style={styles.cardTitle}>History</Text>
          <TouchableOpacity
            style={styles.periodButton}
            onPress={() => setPeriodOpen(true)}
            testID="period-selector"
          >
            <Text style={styles.periodText}>{period}</Text>
            <Ionicons name="chevron-down" size={16} color="#667eea" />
          </TouchableOpacity>
        </View>
        {periodOpen ? (
          <View style={styles.periodMenu}>
            {PERIODS.map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.periodOption}
                onPress={() => {
                  setPeriod(option);
                  setPeriodOpen(false);
                }}
              >
                <Text style={styles.periodOptionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
        <Text style={styles.historyRow}>Jan 1 — 90 recordings</Text>
        <Text style={styles.historyRow}>Jan 2 — 120 recordings</Text>
      </View>

      <Text style={styles.resetNote}>Resets on Feb 1</Text>

      <View style={styles.upgradeCard}>
        <Text style={styles.upgradeCopy}>You're close to your plan limit.</Text>
        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={() => navigation.navigate('Subscription')}
          testID="upgrade-button"
        >
          <Text style={styles.upgradeText}>Upgrade Now</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fa' },
  title: { fontSize: 24, fontWeight: '700', color: '#1a1a2e', padding: 16 },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 12 },
  metric: { marginBottom: 16 },
  metricHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  metricLabel: { fontSize: 14, color: '#444' },
  metricValue: { fontSize: 13, color: '#888' },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: '#eef0ff', overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: '#667eea' },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  periodButton: { flexDirection: 'row', alignItems: 'center' },
  periodText: { color: '#667eea', fontWeight: '600', marginRight: 4 },
  periodMenu: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5ea',
    borderRadius: 8,
    marginBottom: 12,
  },
  periodOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
  },
  periodOptionText: { color: '#1a1a2e', fontSize: 14 },
  historyRow: { fontSize: 14, color: '#555', paddingVertical: 4 },
  resetNote: { textAlign: 'center', color: '#888', marginBottom: 16 },
  upgradeCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 32,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  upgradeCopy: { fontSize: 14, color: '#444', marginBottom: 12, textAlign: 'center' },
  upgradeButton: {
    backgroundColor: '#667eea',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 10,
  },
  upgradeText: { color: '#fff', fontWeight: '700' },
});

export default UsageScreen;
