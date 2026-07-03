import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface ComplianceItem {
  id: string;
  name: string;
  description: string;
  status: 'compliant' | 'warning' | 'action_required';
  lastChecked: string;
}

interface Certification {
  id: string;
  name: string;
  icon: string;
  validUntil: string;
  status: 'active' | 'expiring' | 'expired';
}

const ComplianceDashboardScreen: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'requirements' | 'reports'>(
    'overview'
  );

  const complianceScore = 94;

  const certifications: Certification[] = [
    { id: '1', name: 'HIPAA', icon: 'medical', validUntil: 'Dec 2026', status: 'active' },
    { id: '2', name: 'GDPR', icon: 'shield', validUntil: 'Mar 2026', status: 'active' },
    {
      id: '3',
      name: 'SOC 2 Type II',
      icon: 'checkmark-circle',
      validUntil: 'Jun 2026',
      status: 'active',
    },
    { id: '4', name: 'ISO 27001', icon: 'ribbon', validUntil: 'Feb 2026', status: 'expiring' },
  ];

  const complianceItems: ComplianceItem[] = [
    {
      id: '1',
      name: 'Data Encryption',
      description: 'All data encrypted at rest and in transit',
      status: 'compliant',
      lastChecked: '2 hours ago',
    },
    {
      id: '2',
      name: 'Access Controls',
      description: 'Role-based access control implemented',
      status: 'compliant',
      lastChecked: '2 hours ago',
    },
    {
      id: '3',
      name: 'Audit Logging',
      description: 'Complete audit trail for all actions',
      status: 'compliant',
      lastChecked: '2 hours ago',
    },
    {
      id: '4',
      name: 'Data Retention',
      description: 'Automated data retention policies',
      status: 'warning',
      lastChecked: '1 day ago',
    },
    {
      id: '5',
      name: 'Backup & Recovery',
      description: 'Regular backups with tested recovery',
      status: 'compliant',
      lastChecked: '2 hours ago',
    },
    {
      id: '6',
      name: 'Consent Management',
      description: 'User consent tracking and management',
      status: 'action_required',
      lastChecked: '3 days ago',
    },
  ];

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'compliant':
      case 'active':
        return '#34C759';
      case 'warning':
      case 'expiring':
        return '#FF9500';
      case 'action_required':
      case 'expired':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'compliant':
      case 'active':
        return 'checkmark-circle';
      case 'warning':
      case 'expiring':
        return 'alert-circle';
      case 'action_required':
      case 'expired':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Compliance</Text>
        <TouchableOpacity style={styles.reportButton}>
          <Ionicons name="document-text-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabsContainer}>
        {(['overview', 'requirements', 'reports'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && styles.tabActive]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.scoreCard}>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreValue}>{complianceScore}%</Text>
            <Text style={styles.scoreLabel}>Compliant</Text>
          </View>
          <View style={styles.scoreDetails}>
            <View style={styles.scoreItem}>
              <View style={[styles.scoreIndicator, { backgroundColor: '#34C759' }]} />
              <Text style={styles.scoreItemLabel}>Passing</Text>
              <Text style={styles.scoreItemValue}>12</Text>
            </View>
            <View style={styles.scoreItem}>
              <View style={[styles.scoreIndicator, { backgroundColor: '#FF9500' }]} />
              <Text style={styles.scoreItemLabel}>Warnings</Text>
              <Text style={styles.scoreItemValue}>2</Text>
            </View>
            <View style={styles.scoreItem}>
              <View style={[styles.scoreIndicator, { backgroundColor: '#FF3B30' }]} />
              <Text style={styles.scoreItemLabel}>Action Req.</Text>
              <Text style={styles.scoreItemValue}>1</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Certifications</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.certsScroll}
          >
            {certifications.map(cert => (
              <View key={cert.id} style={styles.certCard}>
                <View
                  style={[styles.certIcon, { backgroundColor: getStatusColor(cert.status) + '20' }]}
                >
                  <Ionicons name={cert.icon as any} size={24} color={getStatusColor(cert.status)} />
                </View>
                <Text style={styles.certName}>{cert.name}</Text>
                <View
                  style={[
                    styles.certStatus,
                    { backgroundColor: getStatusColor(cert.status) + '20' },
                  ]}
                >
                  <Text style={[styles.certStatusText, { color: getStatusColor(cert.status) }]}>
                    {cert.status === 'active'
                      ? 'Active'
                      : cert.status === 'expiring'
                        ? 'Expiring Soon'
                        : 'Expired'}
                  </Text>
                </View>
                <Text style={styles.certExpiry}>Valid until {cert.validUntil}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Compliance Checks</Text>
            <TouchableOpacity style={styles.runButton}>
              <Ionicons name="refresh" size={16} color="#007AFF" />
              <Text style={styles.runText}>Run Check</Text>
            </TouchableOpacity>
          </View>

          {complianceItems.map(item => (
            <TouchableOpacity key={item.id} style={styles.complianceCard}>
              <View
                style={[
                  styles.complianceIcon,
                  { backgroundColor: getStatusColor(item.status) + '20' },
                ]}
              >
                <Ionicons
                  name={getStatusIcon(item.status) as any}
                  size={20}
                  color={getStatusColor(item.status)}
                />
              </View>
              <View style={styles.complianceInfo}>
                <Text style={styles.complianceName}>{item.name}</Text>
                <Text style={styles.complianceDesc}>{item.description}</Text>
                <Text style={styles.complianceChecked}>Last checked: {item.lastChecked}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="document-text" size={24} color="#007AFF" />
              <Text style={styles.actionText}>Generate Report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="shield-checkmark" size={24} color="#34C759" />
              <Text style={styles.actionText}>Run Audit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="download" size={24} color="#FF9500" />
              <Text style={styles.actionText}>Export Data</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="settings" size={24} color="#AF52DE" />
              <Text style={styles.actionText}>Configure</Text>
            </TouchableOpacity>
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
  reportButton: { padding: 4 },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#007AFF' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#8E8E93' },
  tabTextActive: { color: '#007AFF' },
  content: { flex: 1 },
  scoreCard: {
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#34C75920',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreValue: { fontSize: 32, fontWeight: '700', color: '#34C759' },
  scoreLabel: { fontSize: 12, color: '#34C759' },
  scoreDetails: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
  scoreItem: { alignItems: 'center' },
  scoreIndicator: { width: 12, height: 12, borderRadius: 6, marginBottom: 4 },
  scoreItemLabel: { fontSize: 12, color: '#8E8E93' },
  scoreItemValue: { fontSize: 18, fontWeight: '700', color: '#1C1C1E', marginTop: 2 },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  runButton: { flexDirection: 'row', alignItems: 'center' },
  runText: { fontSize: 14, color: '#007AFF', marginLeft: 4 },
  certsScroll: { paddingRight: 16 },
  certCard: {
    width: 140,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginRight: 10,
    alignItems: 'center',
  },
  certIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  certName: { fontSize: 14, fontWeight: '600', color: '#1C1C1E', marginBottom: 6 },
  certStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginBottom: 6 },
  certStatusText: { fontSize: 10, fontWeight: '600' },
  certExpiry: { fontSize: 10, color: '#8E8E93' },
  complianceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  complianceIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  complianceInfo: { flex: 1 },
  complianceName: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  complianceDesc: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  complianceChecked: { fontSize: 11, color: '#8E8E93', marginTop: 4 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  actionCard: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    margin: '1%',
    alignItems: 'center',
  },
  actionText: { fontSize: 13, fontWeight: '500', color: '#1C1C1E', marginTop: 8 },
  bottomPadding: { height: 40 },
});

export default ComplianceDashboardScreen;
