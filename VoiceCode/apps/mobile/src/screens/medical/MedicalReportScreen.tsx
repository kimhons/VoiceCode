import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Report {
  id: string;
  title: string;
  type: string;
  date: Date;
  status: 'draft' | 'final' | 'amended';
}

const MedicalReportScreen: React.FC = () => {
  const [selectedType, setSelectedType] = useState('all');
  const [reports] = useState<Report[]>([
    {
      id: '1',
      title: 'Annual Physical Report',
      type: 'Physical',
      date: new Date(),
      status: 'final',
    },
    {
      id: '2',
      title: 'Lab Results Summary',
      type: 'Lab',
      date: new Date(Date.now() - 86400000),
      status: 'final',
    },
    {
      id: '3',
      title: 'Radiology Report - Chest X-Ray',
      type: 'Radiology',
      date: new Date(Date.now() - 172800000),
      status: 'draft',
    },
    {
      id: '4',
      title: 'Cardiology Consultation',
      type: 'Consultation',
      date: new Date(Date.now() - 259200000),
      status: 'amended',
    },
  ]);

  const reportTypes = ['all', 'Physical', 'Lab', 'Radiology', 'Consultation', 'Procedure'];

  const getStatusColor = (status: Report['status']) => {
    switch (status) {
      case 'final':
        return '#34C759';
      case 'draft':
        return '#FF9500';
      case 'amended':
        return '#AF52DE';
      default:
        return '#666';
    }
  };

  const filteredReports =
    selectedType === 'all' ? reports : reports.filter(r => r.type === selectedType);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Medical Reports</Text>
        <TouchableOpacity style={styles.newButton}>
          <Ionicons name="add" size={20} color="#FFF" />
          <Text style={styles.newButtonText}>New</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {reportTypes.map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.filterChip, selectedType === type && styles.filterChipActive]}
              onPress={() => setSelectedType(type)}
            >
              <Text style={[styles.filterText, selectedType === type && styles.filterTextActive]}>
                {type === 'all' ? 'All Reports' : type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{reports.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#34C759' }]}>
            {reports.filter(r => r.status === 'final').length}
          </Text>
          <Text style={styles.statLabel}>Finalized</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#FF9500' }]}>
            {reports.filter(r => r.status === 'draft').length}
          </Text>
          <Text style={styles.statLabel}>Drafts</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="mic" size={24} color="#007AFF" />
            </View>
            <Text style={styles.quickActionText}>Dictate</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="document-attach" size={24} color="#007AFF" />
            </View>
            <Text style={styles.quickActionText}>Template</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="scan" size={24} color="#007AFF" />
            </View>
            <Text style={styles.quickActionText}>Scan</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="cloud-upload" size={24} color="#007AFF" />
            </View>
            <Text style={styles.quickActionText}>Import</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Recent Reports</Text>
        {filteredReports.map(report => (
          <TouchableOpacity key={report.id} style={styles.reportCard}>
            <View style={styles.reportIcon}>
              <Ionicons name="document-text" size={24} color="#007AFF" />
            </View>
            <View style={styles.reportInfo}>
              <Text style={styles.reportTitle}>{report.title}</Text>
              <View style={styles.reportMeta}>
                <Text style={styles.reportType}>{report.type}</Text>
                <Text style={styles.reportDate}>{report.date.toLocaleDateString()}</Text>
              </View>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: `${getStatusColor(report.status)}20` },
              ]}
            >
              <Text style={[styles.statusText, { color: getStatusColor(report.status) }]}>
                {report.status}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.templateSection}>
          <Text style={styles.sectionTitle}>Report Templates</Text>
          <View style={styles.templateGrid}>
            {[
              'Progress Note',
              'Consultation',
              'Procedure Note',
              'Discharge Summary',
              'H&P',
              'Op Note',
            ].map(template => (
              <TouchableOpacity key={template} style={styles.templateCard}>
                <Ionicons name="document" size={28} color="#007AFF" />
                <Text style={styles.templateName}>{template}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: { fontSize: 20, fontWeight: '600', color: '#1A1A1A' },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  newButtonText: { color: '#FFF', fontSize: 14, fontWeight: '500', marginLeft: 4 },
  filterSection: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
  },
  filterChipActive: { backgroundColor: '#007AFF' },
  filterText: { fontSize: 13, color: '#666' },
  filterTextActive: { color: '#FFF', fontWeight: '500' },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  statCard: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '600', color: '#007AFF' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  content: { flex: 1, padding: 16 },
  quickActions: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 24 },
  quickAction: { alignItems: 'center' },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  quickActionText: { fontSize: 12, color: '#666' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 12 },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  reportIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reportInfo: { flex: 1 },
  reportTitle: { fontSize: 15, fontWeight: '500', color: '#1A1A1A' },
  reportMeta: { flexDirection: 'row', marginTop: 4 },
  reportType: { fontSize: 12, color: '#007AFF', marginRight: 12 },
  reportDate: { fontSize: 12, color: '#666' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  templateSection: { marginTop: 24 },
  templateGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  templateCard: {
    width: '31%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    margin: '1%',
  },
  templateName: { fontSize: 12, color: '#1A1A1A', marginTop: 8, textAlign: 'center' },
});

export default MedicalReportScreen;
