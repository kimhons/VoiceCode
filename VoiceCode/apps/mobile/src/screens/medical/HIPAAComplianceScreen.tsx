import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface ComplianceItem {
  id: string;
  title: string;
  description: string;
  status: 'compliant' | 'warning' | 'action_required';
  lastChecked: Date;
}

const HIPAAComplianceScreen: React.FC = () => {
  const [autoEncrypt, setAutoEncrypt] = useState(true);
  const [auditLogging, setAuditLogging] = useState(true);
  const [autoLogout, setAutoLogout] = useState(true);
  const [biometricRequired, setBiometricRequired] = useState(false);

  const complianceItems: ComplianceItem[] = [
    {
      id: '1',
      title: 'Data Encryption',
      description: 'All PHI is encrypted at rest and in transit',
      status: 'compliant',
      lastChecked: new Date(),
    },
    {
      id: '2',
      title: 'Access Controls',
      description: 'Role-based access to patient data',
      status: 'compliant',
      lastChecked: new Date(),
    },
    {
      id: '3',
      title: 'Audit Trail',
      description: 'All data access is logged',
      status: 'compliant',
      lastChecked: new Date(),
    },
    {
      id: '4',
      title: 'Session Timeout',
      description: 'Auto-logout after 15 minutes',
      status: 'warning',
      lastChecked: new Date(),
    },
    {
      id: '5',
      title: 'Backup & Recovery',
      description: 'Automated backup procedures',
      status: 'compliant',
      lastChecked: new Date(),
    },
  ];

  const getStatusIcon = (status: ComplianceItem['status']) => {
    switch (status) {
      case 'compliant':
        return 'checkmark-circle';
      case 'warning':
        return 'warning';
      case 'action_required':
        return 'alert-circle';
      default:
        return 'help-circle';
    }
  };

  const getStatusColor = (status: ComplianceItem['status']) => {
    switch (status) {
      case 'compliant':
        return '#34C759';
      case 'warning':
        return '#FF9500';
      case 'action_required':
        return '#FF3B30';
      default:
        return '#666';
    }
  };

  const compliantCount = complianceItems.filter(i => i.status === 'compliant').length;
  const overallScore = Math.round((compliantCount / complianceItems.length) * 100);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>HIPAA Compliance</Text>
        <TouchableOpacity style={styles.refreshButton}>
          <Ionicons name="refresh" size={22} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.scoreCard}>
          <View style={styles.scoreCircle}>
            <Text
              style={[styles.scoreValue, { color: overallScore >= 80 ? '#34C759' : '#FF9500' }]}
            >
              {overallScore}%
            </Text>
            <Text style={styles.scoreLabel}>Compliant</Text>
          </View>
          <View style={styles.scoreDetails}>
            <Text style={styles.scoreTitle}>Compliance Status</Text>
            <Text style={styles.scoreSubtitle}>
              {compliantCount} of {complianceItems.length} requirements met
            </Text>
            <View style={styles.lastAudit}>
              <Ionicons name="time-outline" size={14} color="#666" />
              <Text style={styles.lastAuditText}>Last audit: Today at 2:30 PM</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security Settings</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="lock-closed" size={20} color="#007AFF" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingName}>Auto-Encrypt PHI</Text>
              <Text style={styles.settingDescription}>Encrypt all patient data automatically</Text>
            </View>
            <Switch
              value={autoEncrypt}
              onValueChange={setAutoEncrypt}
              trackColor={{ false: '#E0E0E0', true: '#34C759' }}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="document-text" size={20} color="#007AFF" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingName}>Audit Logging</Text>
              <Text style={styles.settingDescription}>Log all access to patient records</Text>
            </View>
            <Switch
              value={auditLogging}
              onValueChange={setAuditLogging}
              trackColor={{ false: '#E0E0E0', true: '#34C759' }}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="timer" size={20} color="#007AFF" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingName}>Auto-Logout</Text>
              <Text style={styles.settingDescription}>Logout after 15 min of inactivity</Text>
            </View>
            <Switch
              value={autoLogout}
              onValueChange={setAutoLogout}
              trackColor={{ false: '#E0E0E0', true: '#34C759' }}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="finger-print" size={20} color="#007AFF" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingName}>Biometric Required</Text>
              <Text style={styles.settingDescription}>Require Face ID/Touch ID for access</Text>
            </View>
            <Switch
              value={biometricRequired}
              onValueChange={setBiometricRequired}
              trackColor={{ false: '#E0E0E0', true: '#34C759' }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compliance Checklist</Text>
          {complianceItems.map(item => (
            <View key={item.id} style={styles.complianceItem}>
              <View
                style={[
                  styles.complianceIcon,
                  { backgroundColor: `${getStatusColor(item.status)}20` },
                ]}
              >
                <Ionicons
                  name={getStatusIcon(item.status) as any}
                  size={20}
                  color={getStatusColor(item.status)}
                />
              </View>
              <View style={styles.complianceInfo}>
                <Text style={styles.complianceTitle}>{item.title}</Text>
                <Text style={styles.complianceDescription}>{item.description}</Text>
              </View>
              <TouchableOpacity style={styles.complianceAction}>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="shield-checkmark" size={28} color="#007AFF" />
              <Text style={styles.actionCardText}>Run Audit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="document-attach" size={28} color="#007AFF" />
              <Text style={styles.actionCardText}>Export Report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="people" size={28} color="#007AFF" />
              <Text style={styles.actionCardText}>Access Logs</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="alert-circle" size={28} color="#007AFF" />
              <Text style={styles.actionCardText}>Report Issue</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#007AFF" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>HIPAA Training Required</Text>
            <Text style={styles.infoText}>
              Annual HIPAA training is due in 30 days. Complete the training module to maintain
              compliance.
            </Text>
            <TouchableOpacity style={styles.infoButton}>
              <Text style={styles.infoButtonText}>Start Training</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  refreshButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  scoreCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 12,
    padding: 20,
  },
  scoreCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 11,
    color: '#666',
  },
  scoreDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  scoreSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  lastAudit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  lastAuditText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  section: {
    backgroundColor: '#FFF',
    marginBottom: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  complianceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  complianceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  complianceInfo: {
    flex: 1,
  },
  complianceTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  complianceDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  complianceAction: {
    padding: 4,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    margin: '1%',
  },
  actionCardText: {
    fontSize: 13,
    color: '#1A1A1A',
    marginTop: 8,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    lineHeight: 18,
  },
  infoButton: {
    marginTop: 12,
  },
  infoButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
});

export default HIPAAComplianceScreen;
