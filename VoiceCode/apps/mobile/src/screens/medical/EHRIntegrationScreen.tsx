import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface EHRProvider {
  id: string;
  name: string;
  logo: string;
  status: 'connected' | 'disconnected' | 'pending';
  lastSync?: Date;
  version?: string;
  supportsFHIR: boolean;
  supportsHL7: boolean;
}

interface SyncSetting {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  icon: string;
}

const EHRIntegrationScreen: React.FC = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [syncOnSave, setSyncOnSave] = useState(true);
  const [twoWaySync, setTwoWaySync] = useState(false);

  const [providers] = useState<EHRProvider[]>([
    {
      id: 'epic',
      name: 'Epic MyChart',
      logo: 'medical',
      status: 'connected',
      lastSync: new Date(Date.now() - 300000),
      version: 'February 2025',
      supportsFHIR: true,
      supportsHL7: true,
    },
    {
      id: 'cerner',
      name: 'Oracle Cerner',
      logo: 'cloud',
      status: 'disconnected',
      supportsFHIR: true,
      supportsHL7: true,
    },
    {
      id: 'allscripts',
      name: 'Allscripts',
      logo: 'document-text',
      status: 'disconnected',
      supportsFHIR: true,
      supportsHL7: false,
    },
    {
      id: 'athena',
      name: 'athenahealth',
      logo: 'fitness',
      status: 'disconnected',
      supportsFHIR: true,
      supportsHL7: true,
    },
    {
      id: 'meditech',
      name: 'MEDITECH',
      logo: 'server',
      status: 'disconnected',
      supportsFHIR: false,
      supportsHL7: true,
    },
    {
      id: 'nextgen',
      name: 'NextGen Healthcare',
      logo: 'layers',
      status: 'disconnected',
      supportsFHIR: true,
      supportsHL7: true,
    },
  ]);

  const [syncSettings] = useState<SyncSetting[]>([
    {
      id: 'notes',
      name: 'Clinical Notes',
      description: 'SOAP notes, progress notes, discharge summaries',
      enabled: true,
      icon: 'document-text',
    },
    {
      id: 'diagnoses',
      name: 'Diagnoses & ICD-10',
      description: 'Sync diagnosis codes to problem list',
      enabled: true,
      icon: 'medkit',
    },
    {
      id: 'procedures',
      name: 'Procedures & CPT',
      description: 'Sync billing codes to encounter',
      enabled: true,
      icon: 'clipboard',
    },
    {
      id: 'vitals',
      name: 'Vital Signs',
      description: 'Import vitals from EHR',
      enabled: false,
      icon: 'pulse',
    },
    {
      id: 'labs',
      name: 'Lab Results',
      description: 'Import lab results for reference',
      enabled: false,
      icon: 'flask',
    },
    {
      id: 'meds',
      name: 'Medications',
      description: 'Sync medication lists',
      enabled: true,
      icon: 'medical',
    },
  ]);

  const [syncSettingsState, setSyncSettingsState] = useState<Record<string, boolean>>(
    syncSettings.reduce((acc, s) => ({ ...acc, [s.id]: s.enabled }), {})
  );

  const getStatusColor = (status: EHRProvider['status']): string => {
    switch (status) {
      case 'connected':
        return '#34C759';
      case 'pending':
        return '#FF9500';
      default:
        return '#8E8E93';
    }
  };

  const getStatusText = (status: EHRProvider['status']): string => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'pending':
        return 'Pending';
      default:
        return 'Not Connected';
    }
  };

  const handleConnect = (provider: EHRProvider) => {
    if (provider.status === 'connected') {
      Alert.alert('Disconnect EHR', `Are you sure you want to disconnect from ${provider.name}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disconnect', style: 'destructive', onPress: () => {} },
      ]);
    } else {
      setIsConnecting(true);
      setTimeout(() => {
        setIsConnecting(false);
        Alert.alert(
          'Connection Started',
          `Please complete authentication with ${provider.name} in the browser window.`
        );
      }, 1500);
    }
  };

  const formatLastSync = (date?: Date): string => {
    if (!date) return 'Never';
    const diff = Date.now() - date.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return date.toLocaleDateString();
  };

  const connectedProvider = providers.find(p => p.status === 'connected');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>EHR Integration</Text>
        <TouchableOpacity style={styles.helpButton}>
          <Ionicons name="help-circle-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {connectedProvider && (
          <View style={styles.connectedSection}>
            <View style={styles.connectedHeader}>
              <View style={styles.connectedStatus}>
                <View style={styles.statusDot} />
                <Text style={styles.connectedText}>Connected to EHR</Text>
              </View>
              <TouchableOpacity style={styles.syncNowButton}>
                <Ionicons name="sync" size={16} color="#007AFF" />
                <Text style={styles.syncNowText}>Sync Now</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.connectedCard}>
              <View style={styles.connectedProvider}>
                <View style={styles.providerIconLarge}>
                  <Ionicons name={connectedProvider.logo as any} size={28} color="#007AFF" />
                </View>
                <View style={styles.providerInfo}>
                  <Text style={styles.providerNameLarge}>{connectedProvider.name}</Text>
                  <Text style={styles.providerVersion}>Version: {connectedProvider.version}</Text>
                </View>
              </View>

              <View style={styles.syncInfo}>
                <View style={styles.syncInfoItem}>
                  <Ionicons name="time-outline" size={16} color="#8E8E93" />
                  <Text style={styles.syncInfoText}>
                    Last sync: {formatLastSync(connectedProvider.lastSync)}
                  </Text>
                </View>
                <View style={styles.syncInfoItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                  <Text style={styles.syncInfoText}>All notes synced</Text>
                </View>
              </View>

              <View style={styles.protocolBadges}>
                {connectedProvider.supportsFHIR && (
                  <View style={[styles.protocolBadge, styles.fhirBadge]}>
                    <Text style={styles.protocolText}>HL7 FHIR</Text>
                  </View>
                )}
                {connectedProvider.supportsHL7 && (
                  <View style={[styles.protocolBadge, styles.hl7Badge]}>
                    <Text style={styles.protocolText}>HL7 v2</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sync Settings</Text>

          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="sync-circle" size={22} color="#007AFF" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Auto-Sync</Text>
                  <Text style={styles.settingDescription}>Automatically sync when connected</Text>
                </View>
              </View>
              <Switch
                value={autoSync}
                onValueChange={setAutoSync}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="save-outline" size={22} color="#34C759" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Sync on Save</Text>
                  <Text style={styles.settingDescription}>Push notes immediately when saved</Text>
                </View>
              </View>
              <Switch
                value={syncOnSave}
                onValueChange={setSyncOnSave}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="swap-horizontal" size={22} color="#AF52DE" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Two-Way Sync</Text>
                  <Text style={styles.settingDescription}>Import data from EHR as well</Text>
                </View>
              </View>
              <Switch
                value={twoWaySync}
                onValueChange={setTwoWaySync}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data to Sync</Text>

          <View style={styles.settingsCard}>
            {syncSettings.map((setting, index) => (
              <React.Fragment key={setting.id}>
                {index > 0 && <View style={styles.divider} />}
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <View style={styles.dataTypeIcon}>
                      <Ionicons name={setting.icon as any} size={18} color="#666" />
                    </View>
                    <View style={styles.settingText}>
                      <Text style={styles.settingLabel}>{setting.name}</Text>
                      <Text style={styles.settingDescription}>{setting.description}</Text>
                    </View>
                  </View>
                  <Switch
                    value={syncSettingsState[setting.id]}
                    onValueChange={value =>
                      setSyncSettingsState(prev => ({ ...prev, [setting.id]: value }))
                    }
                    trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                    thumbColor="#FFF"
                  />
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available EHR Systems</Text>

          {providers.map(provider => (
            <TouchableOpacity
              key={provider.id}
              style={styles.providerCard}
              onPress={() => handleConnect(provider)}
            >
              <View style={styles.providerLeft}>
                <View
                  style={[
                    styles.providerIcon,
                    provider.status === 'connected' && styles.providerIconConnected,
                  ]}
                >
                  <Ionicons
                    name={provider.logo as any}
                    size={22}
                    color={provider.status === 'connected' ? '#007AFF' : '#666'}
                  />
                </View>
                <View style={styles.providerDetails}>
                  <Text style={styles.providerName}>{provider.name}</Text>
                  <View style={styles.providerMeta}>
                    <View
                      style={[
                        styles.statusIndicator,
                        { backgroundColor: getStatusColor(provider.status) },
                      ]}
                    />
                    <Text style={[styles.statusText, { color: getStatusColor(provider.status) }]}>
                      {getStatusText(provider.status)}
                    </Text>
                    {provider.supportsFHIR && (
                      <View style={styles.fhirTag}>
                        <Text style={styles.fhirTagText}>FHIR</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
              <View style={styles.providerRight}>
                {provider.status === 'connected' ? (
                  <Ionicons name="checkmark-circle" size={24} color="#34C759" />
                ) : (
                  <Ionicons name="chevron-forward" size={20} color="#CCC" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security & Compliance</Text>

          <View style={styles.complianceCard}>
            <View style={styles.complianceRow}>
              <View style={styles.complianceItem}>
                <Ionicons name="shield-checkmark" size={24} color="#34C759" />
                <Text style={styles.complianceLabel}>HIPAA</Text>
                <Text style={styles.complianceStatus}>Compliant</Text>
              </View>
              <View style={styles.complianceItem}>
                <Ionicons name="lock-closed" size={24} color="#34C759" />
                <Text style={styles.complianceLabel}>Encryption</Text>
                <Text style={styles.complianceStatus}>AES-256</Text>
              </View>
              <View style={styles.complianceItem}>
                <Ionicons name="document-lock" size={24} color="#34C759" />
                <Text style={styles.complianceLabel}>SOC 2</Text>
                <Text style={styles.complianceStatus}>Type II</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.auditButton}>
              <Ionicons name="list" size={18} color="#007AFF" />
              <Text style={styles.auditButtonText}>View Audit Log</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.customIntegrationButton}>
            <Ionicons name="code-slash" size={22} color="#FFF" />
            <View style={styles.customIntegrationText}>
              <Text style={styles.customIntegrationTitle}>Custom Integration</Text>
              <Text style={styles.customIntegrationDescription}>
                Connect to your EHR via FHIR or HL7
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {isConnecting && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Connecting to EHR...</Text>
          </View>
        </View>
      )}
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
  helpButton: { padding: 4 },
  content: { flex: 1 },
  connectedSection: { padding: 16 },
  connectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  connectedStatus: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#34C759', marginRight: 8 },
  connectedText: { fontSize: 15, fontWeight: '600', color: '#34C759' },
  syncNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF10',
    borderRadius: 8,
  },
  syncNowText: { fontSize: 13, fontWeight: '500', color: '#007AFF', marginLeft: 4 },
  connectedCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  connectedProvider: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  providerIconLarge: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#007AFF10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  providerInfo: {},
  providerNameLarge: { fontSize: 18, fontWeight: '600', color: '#1C1C1E' },
  providerVersion: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  syncInfo: { flexDirection: 'row', marginBottom: 14 },
  syncInfoItem: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  syncInfoText: { fontSize: 13, color: '#8E8E93', marginLeft: 6 },
  protocolBadges: { flexDirection: 'row' },
  protocolBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 8 },
  fhirBadge: { backgroundColor: '#FF950020' },
  hl7Badge: { backgroundColor: '#5856D620' },
  protocolText: { fontSize: 11, fontWeight: '600', color: '#666' },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 10,
    marginLeft: 4,
  },
  settingsCard: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  settingInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  settingText: { marginLeft: 12, flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '500', color: '#1C1C1E' },
  settingDescription: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  dataTypeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginHorizontal: 14 },
  providerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  providerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  providerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  providerIconConnected: { backgroundColor: '#007AFF10' },
  providerDetails: { flex: 1 },
  providerName: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  providerMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statusIndicator: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 12, marginRight: 8 },
  fhirTag: {
    backgroundColor: '#FF950020',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fhirTagText: { fontSize: 10, fontWeight: '600', color: '#FF9500' },
  providerRight: {},
  complianceCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 16 },
  complianceRow: { flexDirection: 'row', marginBottom: 16 },
  complianceItem: { flex: 1, alignItems: 'center' },
  complianceLabel: { fontSize: 12, color: '#8E8E93', marginTop: 6 },
  complianceStatus: { fontSize: 13, fontWeight: '600', color: '#34C759', marginTop: 2 },
  auditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  auditButtonText: { fontSize: 14, color: '#007AFF', marginLeft: 6 },
  customIntegrationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5856D6',
    borderRadius: 14,
    padding: 16,
  },
  customIntegrationText: { flex: 1, marginLeft: 12 },
  customIntegrationTitle: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  customIntegrationDescription: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  bottomPadding: { height: 40 },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 30, alignItems: 'center' },
  loadingText: { fontSize: 15, color: '#1C1C1E', marginTop: 16 },
});

export default EHRIntegrationScreen;
