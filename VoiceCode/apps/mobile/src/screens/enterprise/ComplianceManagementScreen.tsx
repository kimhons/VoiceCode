/**
 * Compliance Management Screen
 * Phase 3 Week 9 Day 59-60: Advanced Security & Compliance
 * 
 * Comprehensive compliance management for GDPR, HIPAA, SOC 2
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
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchComplianceConfigs,
  fetchDataRetentionPolicies,
  fetchComplianceReports,
  fetchComplianceStats,
  updateComplianceConfig,
  createComplianceConfig,
  updateDataRetentionPolicy,
  generateComplianceReport,
} from '../../store/slices/complianceSlice';
import {
  ComplianceConfig,
  ComplianceFramework,
  DataRetentionPolicy,
  ComplianceReport,
} from '../../services/complianceService';

const { width } = Dimensions.get('window');

// ============================================================================
// TYPES
// ============================================================================

type TabType = 'overview' | 'frameworks' | 'privacy' | 'reports' | 'tools';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ComplianceManagementScreen() {
  const dispatch = useAppDispatch();
  const { configs, retentionPolicies, reports, stats, loading, error } = useAppSelector(
    (state) => state.compliance
  );
  const { currentOrganization } = useAppSelector((state) => state.organization);
  const { user } = useAppSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load data on mount
  useEffect(() => {
    if (currentOrganization) {
      loadComplianceData();
    }
  }, [currentOrganization]);

  const loadComplianceData = useCallback(async () => {
    if (!currentOrganization) return;

    try {
      await Promise.all([
        dispatch(fetchComplianceConfigs(currentOrganization.id)).unwrap(),
        dispatch(fetchDataRetentionPolicies(currentOrganization.id)).unwrap(),
        dispatch(fetchComplianceReports({ organizationId: currentOrganization.id })).unwrap(),
        dispatch(fetchComplianceStats(currentOrganization.id)).unwrap(),
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load compliance data');
    }
  }, [currentOrganization, dispatch]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadComplianceData();
    setRefreshing(false);
  }, [loadComplianceData]);

  const handleToggleFramework = useCallback(async (config: ComplianceConfig) => {
    try {
      await dispatch(updateComplianceConfig({
        id: config.id,
        updates: { enabled: !config.enabled },
      })).unwrap();
      Alert.alert('Success', `${config.framework} ${config.enabled ? 'disabled' : 'enabled'}`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update framework');
    }
  }, [dispatch]);

  const handleEnableFramework = useCallback(async (framework: ComplianceFramework) => {
    try {
      await dispatch(createComplianceConfig({
        organizationId: currentOrganization!.id,
        framework,
      })).unwrap();
      Alert.alert('Success', `${framework} enabled`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to enable framework');
    }
  }, [currentOrganization, dispatch]);

  const handleGenerateReport = useCallback(async (framework: ComplianceFramework) => {
    if (!user) return;
    
    try {
      await dispatch(generateComplianceReport({
        organizationId: currentOrganization!.id,
        framework,
        reportType: 'audit',
        generatedBy: user.id,
      })).unwrap();
      Alert.alert('Success', 'Compliance report generated');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to generate report');
    }
  }, [currentOrganization, user, dispatch]);

  const handleUpdateRetentionPolicy = useCallback(async (
    policy: DataRetentionPolicy,
    updates: Partial<DataRetentionPolicy>
  ) => {
    try {
      await dispatch(updateDataRetentionPolicy({
        id: policy.id,
        updates,
      })).unwrap();
      Alert.alert('Success', 'Retention policy updated');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update policy');
    }
  }, [dispatch]);

  // Render functions
  const renderHeader = () => (
    <View style={styles.header}>
      <View>
        <Text style={styles.headerTitle}>Compliance Management</Text>
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
      {(['overview', 'frameworks', 'privacy', 'reports', 'tools'] as TabType[]).map((tab) => (
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

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return '#34C759';
      case 'non_compliant': return '#FF3B30';
      case 'in_progress': return '#FFCC00';
      case 'not_assessed': return '#8E8E93';
      default: return '#8E8E93';
    }
  };

  const getComplianceStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant': return 'checkmark-circle';
      case 'non_compliant': return 'close-circle';
      case 'in_progress': return 'time';
      case 'not_assessed': return 'help-circle';
      default: return 'help-circle';
    }
  };

  const renderOverviewTab = () => {
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
        {/* Compliance Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compliance Overview</Text>

          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { borderLeftColor: '#007AFF' }]}>
              <Ionicons name="shield-checkmark" size={32} color="#007AFF" />
              <Text style={styles.statValue}>{stats?.active_frameworks || 0}</Text>
              <Text style={styles.statLabel}>Active Frameworks</Text>
            </View>

            <View style={[styles.statCard, { borderLeftColor: '#34C759' }]}>
              <Ionicons name="checkmark-circle" size={32} color="#34C759" />
              <Text style={styles.statValue}>{stats?.compliant_frameworks || 0}</Text>
              <Text style={styles.statLabel}>Compliant</Text>
            </View>

            <View style={[styles.statCard, { borderLeftColor: '#FF9500' }]}>
              <Ionicons name="document-text" size={32} color="#FF9500" />
              <Text style={styles.statValue}>{stats?.pending_export_requests || 0}</Text>
              <Text style={styles.statLabel}>Export Requests</Text>
            </View>

            <View style={[styles.statCard, { borderLeftColor: '#FF3B30' }]}>
              <Ionicons name="trash" size={32} color="#FF3B30" />
              <Text style={styles.statValue}>{stats?.pending_deletion_requests || 0}</Text>
              <Text style={styles.statLabel}>Deletion Requests</Text>
            </View>
          </View>
        </View>

        {/* Active Frameworks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Frameworks</Text>

          {configs.filter((c) => c.enabled).map((config) => (
            <View key={config.id} style={styles.frameworkCard}>
              <View style={[
                styles.frameworkIcon,
                { backgroundColor: getComplianceStatusColor(config.compliance_status) }
              ]}>
                <Ionicons
                  name={getComplianceStatusIcon(config.compliance_status) as any}
                  size={24}
                  color="#FFFFFF"
                />
              </View>
              <View style={styles.frameworkInfo}>
                <Text style={styles.frameworkTitle}>{config.framework}</Text>
                <Text style={styles.frameworkStatus}>
                  {config.compliance_status.replace(/_/g, ' ').toUpperCase()}
                </Text>
                {config.last_audit_date && (
                  <Text style={styles.frameworkDate}>
                    Last audit: {new Date(config.last_audit_date).toLocaleDateString()}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => handleGenerateReport(config.framework)}>
                <Ionicons name="document-text-outline" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>
          ))}

          {configs.filter((c) => c.enabled).length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="shield-outline" size={48} color="#C7C7CC" />
              <Text style={styles.emptyStateText}>No active frameworks</Text>
            </View>
          )}
        </View>

        {/* Recent Reports */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Reports</Text>
            <TouchableOpacity onPress={() => setActiveTab('reports')}>
              <Text style={styles.sectionLink}>View All</Text>
            </TouchableOpacity>
          </View>

          {reports.slice(0, 3).map((report) => (
            <View key={report.id} style={styles.reportCard}>
              <Ionicons name="document-text" size={24} color="#007AFF" />
              <View style={styles.reportInfo}>
                <Text style={styles.reportTitle}>
                  {report.framework} {report.report_type.toUpperCase()}
                </Text>
                <Text style={styles.reportDate}>
                  {new Date(report.generated_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={[styles.reportBadge, { backgroundColor: getStatusColor(report.status) }]}>
                <Text style={styles.reportBadgeText}>{report.status}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'final': return '#34C759';
      case 'draft': return '#FFCC00';
      case 'submitted': return '#007AFF';
      default: return '#8E8E93';
    }
  };

  const renderFrameworksTab = () => {
    const availableFrameworks: ComplianceFramework[] = ['GDPR', 'HIPAA', 'SOC2', 'CCPA'];
    const enabledFrameworks = configs.filter((c) => c.enabled).map((c) => c.framework);

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Frameworks</Text>

          {availableFrameworks.map((framework) => {
            const config = configs.find((c) => c.framework === framework);
            const isEnabled = enabledFrameworks.includes(framework);

            return (
              <View key={framework} style={styles.frameworkDetailCard}>
                <View style={styles.frameworkDetailHeader}>
                  <Text style={styles.frameworkDetailTitle}>{framework}</Text>
                  <Switch
                    value={isEnabled}
                    onValueChange={() => {
                      if (config) {
                        handleToggleFramework(config);
                      } else {
                        handleEnableFramework(framework);
                      }
                    }}
                  />
                </View>

                <Text style={styles.frameworkDetailDescription}>
                  {getFrameworkDescription(framework)}
                </Text>

                {config && isEnabled && (
                  <View style={styles.frameworkDetailInfo}>
                    <View style={styles.frameworkDetailRow}>
                      <Text style={styles.frameworkDetailLabel}>Status:</Text>
                      <Text style={[
                        styles.frameworkDetailValue,
                        { color: getComplianceStatusColor(config.compliance_status) }
                      ]}>
                        {config.compliance_status.replace(/_/g, ' ').toUpperCase()}
                      </Text>
                    </View>

                    {config.last_audit_date && (
                      <View style={styles.frameworkDetailRow}>
                        <Text style={styles.frameworkDetailLabel}>Last Audit:</Text>
                        <Text style={styles.frameworkDetailValue}>
                          {new Date(config.last_audit_date).toLocaleDateString()}
                        </Text>
                      </View>
                    )}

                    {config.next_audit_date && (
                      <View style={styles.frameworkDetailRow}>
                        <Text style={styles.frameworkDetailLabel}>Next Audit:</Text>
                        <Text style={styles.frameworkDetailValue}>
                          {new Date(config.next_audit_date).toLocaleDateString()}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    );
  };

  const renderPrivacyTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Retention Policies</Text>

        {retentionPolicies.map((policy) => (
          <View key={policy.id} style={styles.retentionCard}>
            <View style={styles.retentionHeader}>
              <Text style={styles.retentionTitle}>
                {policy.data_type.replace(/_/g, ' ').toUpperCase()}
              </Text>
              <Switch
                value={policy.auto_delete}
                onValueChange={(value) => handleUpdateRetentionPolicy(policy, { auto_delete: value })}
              />
            </View>

            <View style={styles.retentionInfo}>
              <View style={styles.retentionRow}>
                <Text style={styles.retentionLabel}>Retention Period:</Text>
                <Text style={styles.retentionValue}>{policy.retention_days} days</Text>
              </View>

              <View style={styles.retentionRow}>
                <Text style={styles.retentionLabel}>Auto-Delete:</Text>
                <Text style={styles.retentionValue}>{policy.auto_delete ? 'Enabled' : 'Disabled'}</Text>
              </View>

              <View style={styles.retentionRow}>
                <Text style={styles.retentionLabel}>Legal Hold Exempt:</Text>
                <Text style={styles.retentionValue}>{policy.legal_hold_exempt ? 'Yes' : 'No'}</Text>
              </View>
            </View>
          </View>
        ))}

        {retentionPolicies.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={48} color="#C7C7CC" />
            <Text style={styles.emptyStateText}>No retention policies configured</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy Controls</Text>

        <View style={styles.privacyCard}>
          <View style={styles.privacyHeader}>
            <Ionicons name="eye-off" size={24} color="#007AFF" />
            <Text style={styles.privacyTitle}>Data Minimization</Text>
          </View>
          <Text style={styles.privacyDescription}>
            Only collect and process data necessary for business purposes
          </Text>
          <Switch value={true} onValueChange={() => {}} />
        </View>

        <View style={styles.privacyCard}>
          <View style={styles.privacyHeader}>
            <Ionicons name="lock-closed" size={24} color="#007AFF" />
            <Text style={styles.privacyTitle}>Consent Management</Text>
          </View>
          <Text style={styles.privacyDescription}>
            Require explicit consent before processing personal data
          </Text>
          <Switch value={true} onValueChange={() => {}} />
        </View>

        <View style={styles.privacyCard}>
          <View style={styles.privacyHeader}>
            <Ionicons name="shield-checkmark" size={24} color="#007AFF" />
            <Text style={styles.privacyTitle}>Right to Access</Text>
          </View>
          <Text style={styles.privacyDescription}>
            Allow users to request access to their personal data
          </Text>
          <Switch value={true} onValueChange={() => {}} />
        </View>

        <View style={styles.privacyCard}>
          <View style={styles.privacyHeader}>
            <Ionicons name="trash" size={24} color="#007AFF" />
            <Text style={styles.privacyTitle}>Right to Erasure</Text>
          </View>
          <Text style={styles.privacyDescription}>
            Allow users to request deletion of their personal data
          </Text>
          <Switch value={true} onValueChange={() => {}} />
        </View>
      </View>
    </ScrollView>
  );

  const renderReportsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search reports..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#8E8E93"
        />
      </View>

      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.reportDetailCard}>
            <View style={styles.reportDetailHeader}>
              <Ionicons name="document-text" size={32} color="#007AFF" />
              <View style={styles.reportDetailInfo}>
                <Text style={styles.reportDetailTitle}>
                  {item.framework} {item.report_type.toUpperCase()}
                </Text>
                <Text style={styles.reportDetailDate}>
                  Generated: {new Date(item.generated_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={[styles.reportBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.reportBadgeText}>{item.status}</Text>
              </View>
            </View>

            <View style={styles.reportFindings}>
              <Text style={styles.reportFindingsTitle}>Findings Summary:</Text>
              {item.findings.slice(0, 3).map((finding, index) => (
                <View key={index} style={styles.findingRow}>
                  <Ionicons
                    name={finding.status === 'pass' ? 'checkmark-circle' : finding.status === 'fail' ? 'close-circle' : 'warning'}
                    size={16}
                    color={finding.status === 'pass' ? '#34C759' : finding.status === 'fail' ? '#FF3B30' : '#FFCC00'}
                  />
                  <Text style={styles.findingText}>{finding.control}</Text>
                </View>
              ))}
              {item.findings.length > 3 && (
                <Text style={styles.findingMore}>
                  +{item.findings.length - 3} more findings
                </Text>
              )}
            </View>

            <TouchableOpacity style={styles.viewReportButton}>
              <Text style={styles.viewReportButtonText}>View Full Report</Text>
              <Ionicons name="chevron-forward" size={16} color="#007AFF" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#C7C7CC" />
            <Text style={styles.emptyStateText}>No compliance reports</Text>
          </View>
        }
      />
    </View>
  );

  const renderToolsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Subject Rights</Text>

        <TouchableOpacity style={styles.toolCard}>
          <View style={styles.toolLeft}>
            <Ionicons name="download" size={32} color="#007AFF" />
            <View style={styles.toolInfo}>
              <Text style={styles.toolTitle}>Data Export</Text>
              <Text style={styles.toolDescription}>
                Export user data (GDPR Right to Data Portability)
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.toolCard}>
          <View style={styles.toolLeft}>
            <Ionicons name="trash" size={32} color="#FF3B30" />
            <View style={styles.toolInfo}>
              <Text style={styles.toolTitle}>Data Deletion</Text>
              <Text style={styles.toolDescription}>
                Delete user data (GDPR Right to be Forgotten)
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.toolCard}>
          <View style={styles.toolLeft}>
            <Ionicons name="eye" size={32} color="#34C759" />
            <View style={styles.toolInfo}>
              <Text style={styles.toolTitle}>Data Access Request</Text>
              <Text style={styles.toolDescription}>
                View all data associated with a user
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Compliance Tools</Text>

        <TouchableOpacity style={styles.toolCard}>
          <View style={styles.toolLeft}>
            <Ionicons name="document-text" size={32} color="#007AFF" />
            <View style={styles.toolInfo}>
              <Text style={styles.toolTitle}>Generate Audit Report</Text>
              <Text style={styles.toolDescription}>
                Create a comprehensive compliance audit report
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.toolCard}>
          <View style={styles.toolLeft}>
            <Ionicons name="shield-checkmark" size={32} color="#34C759" />
            <View style={styles.toolInfo}>
              <Text style={styles.toolTitle}>Run Compliance Check</Text>
              <Text style={styles.toolDescription}>
                Verify compliance with active frameworks
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.toolCard}>
          <View style={styles.toolLeft}>
            <Ionicons name="analytics" size={32} color="#FF9500" />
            <View style={styles.toolInfo}>
              <Text style={styles.toolTitle}>Data Processing Inventory</Text>
              <Text style={styles.toolDescription}>
                View all data processing activities
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const getFrameworkDescription = (framework: ComplianceFramework): string => {
    const descriptions: Record<ComplianceFramework, string> = {
      GDPR: 'General Data Protection Regulation - EU data protection and privacy law',
      HIPAA: 'Health Insurance Portability and Accountability Act - US healthcare data protection',
      SOC2: 'Service Organization Control 2 - Security, availability, and confidentiality controls',
      CCPA: 'California Consumer Privacy Act - California data privacy law',
    };
    return descriptions[framework];
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
        ) : loading && configs.length === 0 ? (
          <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
        ) : (
          <>
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'frameworks' && renderFrameworksTab()}
            {activeTab === 'privacy' && renderPrivacyTab()}
            {activeTab === 'reports' && renderReportsTab()}
            {activeTab === 'tools' && renderToolsTab()}
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
  frameworkCard: {
    flexDirection: 'row',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  frameworkIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  frameworkInfo: {
    flex: 1,
  },
  frameworkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  frameworkStatus: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2,
  },
  frameworkDate: {
    fontSize: 10,
    color: '#C7C7CC',
  },
  reportCard: {
    flexDirection: 'row',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  reportInfo: {
    flex: 1,
    marginLeft: 12,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  reportDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  reportBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reportBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  frameworkDetailCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  frameworkDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  frameworkDetailTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  frameworkDetailDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
    lineHeight: 20,
  },
  frameworkDetailInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
  },
  frameworkDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  frameworkDetailLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  frameworkDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  retentionCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  retentionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  retentionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  retentionInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
  },
  retentionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  retentionLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  retentionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  privacyCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 12,
  },
  privacyDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
    lineHeight: 20,
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
  reportDetailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  reportDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportDetailInfo: {
    flex: 1,
    marginLeft: 12,
  },
  reportDetailTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  reportDetailDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  reportFindings: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  reportFindingsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  findingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  findingText: {
    fontSize: 14,
    color: '#000000',
    marginLeft: 8,
  },
  findingMore: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  viewReportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  viewReportButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginRight: 4,
  },
  toolCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  toolLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toolInfo: {
    marginLeft: 12,
    flex: 1,
  },
  toolTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  toolDescription: {
    fontSize: 12,
    color: '#8E8E93',
    lineHeight: 16,
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

