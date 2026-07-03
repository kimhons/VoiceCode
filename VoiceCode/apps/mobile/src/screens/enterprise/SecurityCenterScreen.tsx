/**
 * Security Center Screen
 * Phase 3 Week 9 Day 59-60: Advanced Security & Compliance
 * 
 * Comprehensive security dashboard with threat monitoring, access control, and E2EE
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Switch,
  Alert,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchSecurityEvents,
  fetchThreatAlerts,
  fetchSecurityPolicies,
  fetchSecurityStats,
  updateSecurityPolicy,
  updateThreatAlert,
} from '../../store/slices/securitySlice';
import { SecurityEvent, ThreatAlert, SecurityPolicy } from '../../services/securityService';

const { width } = Dimensions.get('window');

// ============================================================================
// TYPES
// ============================================================================

type TabType = 'dashboard' | 'threats' | 'access' | 'policies' | 'encryption' | 'audit';

interface FormData {
  policyId: string;
  enabled: boolean;
  settings: Record<string, any>;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SecurityCenterScreen() {
  const dispatch = useAppDispatch();
  const { events, threats, policies, stats, loading, error } = useAppSelector(
    (state) => state.security
  );
  const { currentOrganization } = useAppSelector((state) => state.organization);

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<SecurityPolicy | null>(null);

  // Load data on mount
  useEffect(() => {
    if (currentOrganization) {
      loadSecurityData();
    }
  }, [currentOrganization]);

  const loadSecurityData = useCallback(async () => {
    if (!currentOrganization) return;

    try {
      await Promise.all([
        dispatch(fetchSecurityEvents({ organizationId: currentOrganization.id })).unwrap(),
        dispatch(fetchThreatAlerts({ organizationId: currentOrganization.id })).unwrap(),
        dispatch(fetchSecurityPolicies(currentOrganization.id)).unwrap(),
        dispatch(fetchSecurityStats({ organizationId: currentOrganization.id })).unwrap(),
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load security data');
    }
  }, [currentOrganization, dispatch]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSecurityData();
    setRefreshing(false);
  }, [loadSecurityData]);

  const handleTogglePolicy = useCallback(async (policy: SecurityPolicy) => {
    try {
      await dispatch(updateSecurityPolicy({
        id: policy.id,
        updates: { enabled: !policy.enabled },
      })).unwrap();
      Alert.alert('Success', `Policy ${policy.enabled ? 'disabled' : 'enabled'}`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update policy');
    }
  }, [dispatch]);

  const handleResolveThreat = useCallback(async (threat: ThreatAlert) => {
    Alert.alert(
      'Resolve Threat',
      'Mark this threat as resolved?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resolve',
          onPress: async () => {
            try {
              await dispatch(updateThreatAlert({
                id: threat.id,
                updates: { status: 'resolved', resolved_at: new Date().toISOString() },
              })).unwrap();
              Alert.alert('Success', 'Threat marked as resolved');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to resolve threat');
            }
          },
        },
      ]
    );
  }, [dispatch]);

  const handleMarkFalsePositive = useCallback(async (threat: ThreatAlert) => {
    try {
      await dispatch(updateThreatAlert({
        id: threat.id,
        updates: { status: 'false_positive', resolved_at: new Date().toISOString() },
      })).unwrap();
      Alert.alert('Success', 'Threat marked as false positive');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update threat');
    }
  }, [dispatch]);

  // Filter events
  const filteredEvents = events.filter((event) =>
    event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.event_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render functions
  const renderHeader = () => (
    <View style={styles.header}>
      <View>
        <Text style={styles.headerTitle}>Security Center</Text>
        {currentOrganization && (
          <Text style={styles.headerSubtitle}>{currentOrganization.name}</Text>
        )}
      </View>
      <TouchableOpacity onPress={handleRefresh}>
        <Ionicons name="refresh" size={24} color="#007AFF" />
      </TouchableOpacity>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      {(['dashboard', 'threats', 'access', 'policies', 'encryption', 'audit'] as TabType[]).map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, activeTab === tab && styles.tabActive]}
          onPress={() => setActiveTab(tab)}
        >
          <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#FF3B30';
      case 'high': return '#FF9500';
      case 'medium': return '#FFCC00';
      case 'low': return '#34C759';
      default: return '#8E8E93';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return 'alert-circle';
      case 'high': return 'warning';
      case 'medium': return 'information-circle';
      case 'low': return 'checkmark-circle';
      default: return 'help-circle';
    }
  };

  const renderDashboardTab = () => {
    if (!currentOrganization) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="business-outline" size={64} color="#C7C7CC" />
          <Text style={styles.emptyStateText}>Select an organization first</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.tabContent}>
        {/* Security Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security Overview</Text>

          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { borderLeftColor: '#007AFF' }]}>
              <Ionicons name="shield-checkmark" size={32} color="#007AFF" />
              <Text style={styles.statValue}>{stats?.total_events || 0}</Text>
              <Text style={styles.statLabel}>Total Events</Text>
            </View>

            <View style={[styles.statCard, { borderLeftColor: '#FF3B30' }]}>
              <Ionicons name="alert-circle" size={32} color="#FF3B30" />
              <Text style={styles.statValue}>{stats?.critical_events || 0}</Text>
              <Text style={styles.statLabel}>Critical Events</Text>
            </View>

            <View style={[styles.statCard, { borderLeftColor: '#FF9500' }]}>
              <Ionicons name="warning" size={32} color="#FF9500" />
              <Text style={styles.statValue}>{stats?.active_threats || 0}</Text>
              <Text style={styles.statLabel}>Active Threats</Text>
            </View>

            <View style={[styles.statCard, { borderLeftColor: '#FFCC00' }]}>
              <Ionicons name="lock-closed" size={32} color="#FFCC00" />
              <Text style={styles.statValue}>{stats?.failed_logins || 0}</Text>
              <Text style={styles.statLabel}>Failed Logins</Text>
            </View>
          </View>
        </View>

        {/* Recent Threats */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Threats</Text>
            <TouchableOpacity onPress={() => setActiveTab('threats')}>
              <Text style={styles.sectionLink}>View All</Text>
            </TouchableOpacity>
          </View>

          {threats.slice(0, 3).map((threat) => (
            <View key={threat.id} style={styles.threatCard}>
              <View style={[styles.threatIcon, { backgroundColor: getSeverityColor(threat.severity) }]}>
                <Ionicons name={getSeverityIcon(threat.severity) as any} size={24} color="#FFFFFF" />
              </View>
              <View style={styles.threatInfo}>
                <Text style={styles.threatTitle}>{threat.threat_type.replace(/_/g, ' ').toUpperCase()}</Text>
                <Text style={styles.threatDescription}>{threat.description}</Text>
                <Text style={styles.threatTime}>
                  {new Date(threat.created_at).toLocaleString()}
                </Text>
              </View>
              <View style={[styles.threatBadge, { backgroundColor: getSeverityColor(threat.severity) }]}>
                <Text style={styles.threatBadgeText}>{threat.severity}</Text>
              </View>
            </View>
          ))}

          {threats.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="shield-checkmark-outline" size={48} color="#34C759" />
              <Text style={styles.emptyStateText}>No active threats</Text>
            </View>
          )}
        </View>

        {/* Security Policies Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security Policies</Text>

          {policies.slice(0, 5).map((policy) => (
            <View key={policy.id} style={styles.policyRow}>
              <View style={styles.policyLeft}>
                <Text style={styles.policyLabel}>
                  {policy.policy_type.replace(/_/g, ' ').toUpperCase()}
                </Text>
                <Text style={styles.policyStatus}>
                  {policy.enabled ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
              <Switch
                value={policy.enabled}
                onValueChange={() => handleTogglePolicy(policy)}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderThreatsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search threats..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#8E8E93"
        />
      </View>

      <FlatList
        data={threats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.threatDetailCard}>
            <View style={styles.threatDetailHeader}>
              <View style={[styles.threatIcon, { backgroundColor: getSeverityColor(item.severity) }]}>
                <Ionicons name={getSeverityIcon(item.severity) as any} size={24} color="#FFFFFF" />
              </View>
              <View style={styles.threatDetailInfo}>
                <Text style={styles.threatDetailTitle}>
                  {item.threat_type.replace(/_/g, ' ').toUpperCase()}
                </Text>
                <Text style={styles.threatDetailTime}>
                  {new Date(item.created_at).toLocaleString()}
                </Text>
              </View>
              <View style={[styles.threatBadge, { backgroundColor: getSeverityColor(item.severity) }]}>
                <Text style={styles.threatBadgeText}>{item.severity}</Text>
              </View>
            </View>

            <Text style={styles.threatDetailDescription}>{item.description}</Text>

            {item.affected_users && item.affected_users.length > 0 && (
              <View style={styles.threatDetailSection}>
                <Text style={styles.threatDetailLabel}>Affected Users:</Text>
                <Text style={styles.threatDetailValue}>{item.affected_users.length} users</Text>
              </View>
            )}

            {item.recommended_actions && item.recommended_actions.length > 0 && (
              <View style={styles.threatDetailSection}>
                <Text style={styles.threatDetailLabel}>Recommended Actions:</Text>
                {item.recommended_actions.map((action, index) => (
                  <Text key={index} style={styles.threatDetailAction}>• {action}</Text>
                ))}
              </View>
            )}

            <View style={styles.threatDetailActions}>
              {item.status === 'active' && (
                <>
                  <TouchableOpacity
                    style={[styles.threatActionButton, styles.resolveButton]}
                    onPress={() => handleResolveThreat(item)}
                  >
                    <Text style={styles.threatActionButtonText}>Resolve</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.threatActionButton, styles.falsePositiveButton]}
                    onPress={() => handleMarkFalsePositive(item)}
                  >
                    <Text style={styles.threatActionButtonText}>False Positive</Text>
                  </TouchableOpacity>
                </>
              )}

              {item.status !== 'active' && (
                <View style={styles.threatStatusBadge}>
                  <Text style={styles.threatStatusText}>
                    {item.status.replace(/_/g, ' ').toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="shield-checkmark-outline" size={64} color="#34C759" />
            <Text style={styles.emptyStateText}>No threats detected</Text>
          </View>
        }
      />
    </View>
  );

  const renderAccessTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Access Control Settings</Text>

        <View style={styles.accessCard}>
          <View style={styles.accessHeader}>
            <Ionicons name="key" size={24} color="#007AFF" />
            <Text style={styles.accessTitle}>Multi-Factor Authentication</Text>
          </View>
          <Text style={styles.accessDescription}>
            Require MFA for all users in this organization
          </Text>
          <Switch value={true} onValueChange={() => {}} />
        </View>

        <View style={styles.accessCard}>
          <View style={styles.accessHeader}>
            <Ionicons name="time" size={24} color="#007AFF" />
            <Text style={styles.accessTitle}>Session Timeout</Text>
          </View>
          <Text style={styles.accessDescription}>
            Automatically log out users after 30 minutes of inactivity
          </Text>
          <Switch value={true} onValueChange={() => {}} />
        </View>

        <View style={styles.accessCard}>
          <View style={styles.accessHeader}>
            <Ionicons name="location" size={24} color="#007AFF" />
            <Text style={styles.accessTitle}>IP Whitelisting</Text>
          </View>
          <Text style={styles.accessDescription}>
            Restrict access to specific IP addresses
          </Text>
          <Switch value={false} onValueChange={() => {}} />
        </View>

        <View style={styles.accessCard}>
          <View style={styles.accessHeader}>
            <Ionicons name="phone-portrait" size={24} color="#007AFF" />
            <Text style={styles.accessTitle}>Device Trust</Text>
          </View>
          <Text style={styles.accessDescription}>
            Only allow access from trusted devices
          </Text>
          <Switch value={false} onValueChange={() => {}} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SSO / SAML Configuration</Text>

        <TouchableOpacity style={styles.ssoCard}>
          <View style={styles.ssoLeft}>
            <Ionicons name="business" size={32} color="#007AFF" />
            <View style={styles.ssoInfo}>
              <Text style={styles.ssoTitle}>Azure AD</Text>
              <Text style={styles.ssoStatus}>Not configured</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.ssoCard}>
          <View style={styles.ssoLeft}>
            <Ionicons name="shield" size={32} color="#34C759" />
            <View style={styles.ssoInfo}>
              <Text style={styles.ssoTitle}>Okta</Text>
              <Text style={styles.ssoStatus}>Not configured</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.ssoCard}>
          <View style={styles.ssoLeft}>
            <Ionicons name="logo-google" size={32} color="#FF3B30" />
            <View style={styles.ssoInfo}>
              <Text style={styles.ssoTitle}>Google Workspace</Text>
              <Text style={styles.ssoStatus}>Not configured</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderPoliciesTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security Policies</Text>

        {policies.map((policy) => (
          <View key={policy.id} style={styles.policyCard}>
            <View style={styles.policyCardHeader}>
              <Text style={styles.policyCardTitle}>
                {policy.policy_type.replace(/_/g, ' ').toUpperCase()}
              </Text>
              <Switch
                value={policy.enabled}
                onValueChange={() => handleTogglePolicy(policy)}
              />
            </View>

            <Text style={styles.policyCardDescription}>
              {getPolicyDescription(policy.policy_type)}
            </Text>

            <TouchableOpacity
              style={styles.policyConfigButton}
              onPress={() => {
                setSelectedPolicy(policy);
                setShowPolicyModal(true);
              }}
            >
              <Text style={styles.policyConfigButtonText}>Configure</Text>
              <Ionicons name="chevron-forward" size={16} color="#007AFF" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderEncryptionTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>End-to-End Encryption</Text>

        <View style={styles.encryptionCard}>
          <View style={styles.encryptionHeader}>
            <Ionicons name="lock-closed" size={48} color="#34C759" />
            <Text style={styles.encryptionTitle}>E2EE Enabled</Text>
          </View>
          <Text style={styles.encryptionDescription}>
            All sensitive data is encrypted end-to-end using AES-256-GCM encryption.
            Only authorized users with the correct keys can decrypt the data.
          </Text>
        </View>

        <View style={styles.encryptionInfo}>
          <View style={styles.encryptionInfoRow}>
            <Text style={styles.encryptionInfoLabel}>Algorithm:</Text>
            <Text style={styles.encryptionInfoValue}>AES-256-GCM</Text>
          </View>
          <View style={styles.encryptionInfoRow}>
            <Text style={styles.encryptionInfoLabel}>Key Length:</Text>
            <Text style={styles.encryptionInfoValue}>256 bits</Text>
          </View>
          <View style={styles.encryptionInfoRow}>
            <Text style={styles.encryptionInfoLabel}>Key Storage:</Text>
            <Text style={styles.encryptionInfoValue}>Device Keychain</Text>
          </View>
          <View style={styles.encryptionInfoRow}>
            <Text style={styles.encryptionInfoLabel}>Last Key Rotation:</Text>
            <Text style={styles.encryptionInfoValue}>Never</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.rotateKeyButton}>
          <Ionicons name="refresh" size={20} color="#FFFFFF" />
          <Text style={styles.rotateKeyButtonText}>Rotate Encryption Keys</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Encrypted Data Types</Text>

        <View style={styles.dataTypeRow}>
          <Ionicons name="mic" size={24} color="#007AFF" />
          <Text style={styles.dataTypeLabel}>Audio Recordings</Text>
          <Ionicons name="checkmark-circle" size={24} color="#34C759" />
        </View>

        <View style={styles.dataTypeRow}>
          <Ionicons name="document-text" size={24} color="#007AFF" />
          <Text style={styles.dataTypeLabel}>Transcripts</Text>
          <Ionicons name="checkmark-circle" size={24} color="#34C759" />
        </View>

        <View style={styles.dataTypeRow}>
          <Ionicons name="person" size={24} color="#007AFF" />
          <Text style={styles.dataTypeLabel}>User Data</Text>
          <Ionicons name="checkmark-circle" size={24} color="#34C759" />
        </View>

        <View style={styles.dataTypeRow}>
          <Ionicons name="folder" size={24} color="#007AFF" />
          <Text style={styles.dataTypeLabel}>File Attachments</Text>
          <Ionicons name="checkmark-circle" size={24} color="#34C759" />
        </View>
      </View>
    </ScrollView>
  );

  const renderAuditTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search audit logs..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#8E8E93"
        />
      </View>

      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.auditCard}>
            <View style={[styles.auditIcon, { backgroundColor: getSeverityColor(item.severity) }]}>
              <Ionicons name={getSeverityIcon(item.severity) as any} size={20} color="#FFFFFF" />
            </View>
            <View style={styles.auditInfo}>
              <Text style={styles.auditType}>{item.event_type.replace(/_/g, ' ').toUpperCase()}</Text>
              <Text style={styles.auditDescription}>{item.description}</Text>
              <Text style={styles.auditTime}>{new Date(item.created_at).toLocaleString()}</Text>
              {item.ip_address && (
                <Text style={styles.auditMeta}>IP: {item.ip_address}</Text>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#C7C7CC" />
            <Text style={styles.emptyStateText}>No audit logs</Text>
          </View>
        }
      />
    </View>
  );

  const getPolicyDescription = (policyType: string): string => {
    const descriptions: Record<string, string> = {
      password: 'Enforce strong password requirements including length, complexity, and expiration',
      mfa: 'Require multi-factor authentication for all users',
      session: 'Configure session timeout and concurrent session limits',
      ip_whitelist: 'Restrict access to specific IP addresses or ranges',
      device_trust: 'Only allow access from trusted and registered devices',
    };
    return descriptions[policyType] || 'Security policy configuration';
  };

  // Main render
  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderTabs()}

      <View style={styles.content}>
        {!currentOrganization ? (
          <View style={styles.emptyState}>
            <Ionicons name="business-outline" size={64} color="#C7C7CC" />
            <Text style={styles.emptyStateText}>Select an organization first</Text>
          </View>
        ) : loading && events.length === 0 ? (
          <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
        ) : (
          <>
            {activeTab === 'dashboard' && renderDashboardTab()}
            {activeTab === 'threats' && renderThreatsTab()}
            {activeTab === 'access' && renderAccessTab()}
            {activeTab === 'policies' && renderPoliciesTab()}
            {activeTab === 'encryption' && renderEncryptionTab()}
            {activeTab === 'audit' && renderAuditTab()}
          </>
        )}
      </View>

      {/* Error Display */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  sectionLink: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  statCard: {
    width: (width - 64) / 2,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    margin: 8,
    borderLeftWidth: 4,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
    textAlign: 'center',
  },
  threatCard: {
    flexDirection: 'row',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  threatIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  threatInfo: {
    flex: 1,
  },
  threatTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  threatDescription: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  threatTime: {
    fontSize: 10,
    color: '#C7C7CC',
  },
  threatBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  threatBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  policyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  policyLeft: {
    flex: 1,
  },
  policyLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
  },
  policyStatus: {
    fontSize: 12,
    color: '#8E8E93',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    margin: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000000',
  },
  threatDetailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  threatDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  threatDetailInfo: {
    flex: 1,
    marginLeft: 12,
  },
  threatDetailTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  threatDetailTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  threatDetailDescription: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 12,
    lineHeight: 20,
  },
  threatDetailSection: {
    marginBottom: 12,
  },
  threatDetailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
  },
  threatDetailValue: {
    fontSize: 14,
    color: '#000000',
  },
  threatDetailAction: {
    fontSize: 14,
    color: '#000000',
    marginLeft: 8,
    marginTop: 4,
  },
  threatDetailActions: {
    flexDirection: 'row',
    marginTop: 12,
  },
  threatActionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  resolveButton: {
    backgroundColor: '#34C759',
  },
  falsePositiveButton: {
    backgroundColor: '#8E8E93',
  },
  threatActionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  threatStatusBadge: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  threatStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  accessCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  accessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  accessTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 12,
  },
  accessDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
    lineHeight: 20,
  },
  ssoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  ssoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ssoInfo: {
    marginLeft: 12,
  },
  ssoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  ssoStatus: {
    fontSize: 12,
    color: '#8E8E93',
  },
  policyCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  policyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  policyCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  policyCardDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
    lineHeight: 20,
  },
  policyConfigButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  policyConfigButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginRight: 4,
  },
  encryptionCard: {
    backgroundColor: '#F0FFF4',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  encryptionHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  encryptionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#34C759',
    marginTop: 8,
  },
  encryptionDescription: {
    fontSize: 14,
    color: '#000000',
    textAlign: 'center',
    lineHeight: 20,
  },
  encryptionInfo: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  encryptionInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  encryptionInfoLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  encryptionInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  rotateKeyButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rotateKeyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  dataTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  dataTypeLabel: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    marginLeft: 12,
  },
  auditCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  auditIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  auditInfo: {
    flex: 1,
  },
  auditType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  auditDescription: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  auditTime: {
    fontSize: 10,
    color: '#C7C7CC',
  },
  auditMeta: {
    fontSize: 10,
    color: '#C7C7CC',
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 16,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBanner: {
    backgroundColor: '#FF3B30',
    padding: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

