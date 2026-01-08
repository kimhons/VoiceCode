/**
 * Report Builder Screen
 * Phase 3 Week 9 Day 61-63: Advanced Analytics & Reporting
 * 
 * Comprehensive report builder with 5 tabs:
 * - Templates: Pre-built report templates
 * - Custom: Custom report builder
 * - Scheduled: Scheduled report management
 * - History: Report generation history
 * - Settings: Report preferences
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  generateReport,
  fetchScheduledReports,
  createScheduledReport,
  updateScheduledReport,
  deleteScheduledReport,
} from '../../store/slices/reportSlice';
import { ReportType, ExportFormat } from '../../services/analyticsService';

type TabType = 'templates' | 'custom' | 'scheduled' | 'history' | 'settings';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  icon: string;
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'daily-usage',
    name: 'Daily Usage Report',
    description: 'Daily summary of transcription usage and activity',
    type: 'daily',
    icon: '📊',
  },
  {
    id: 'weekly-performance',
    name: 'Weekly Performance Report',
    description: 'Weekly performance metrics and accuracy trends',
    type: 'weekly',
    icon: '📈',
  },
  {
    id: 'monthly-billing',
    name: 'Monthly Billing Report',
    description: 'Monthly cost breakdown and billing summary',
    type: 'monthly',
    icon: '💰',
  },
  {
    id: 'custom-analytics',
    name: 'Custom Analytics Report',
    description: 'Custom date range with all analytics data',
    type: 'custom',
    icon: '🔍',
  },
];

export default function ReportBuilderScreen() {
  const dispatch = useAppDispatch();
  const { reports, scheduledReports, currentReport, loading, error } = useAppSelector(
    (state) => state.report
  );

  const [activeTab, setActiveTab] = useState<TabType>('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [reportName, setReportName] = useState('');
  const [reportFormat, setReportFormat] = useState<ExportFormat>('json');
  const [scheduleFrequency, setScheduleFrequency] = useState<ReportType>('weekly');

  useEffect(() => {
    dispatch(fetchScheduledReports());
  }, []);

  const handleGenerateReport = async (template: ReportTemplate) => {
    const now = new Date();
    let startDate = new Date();

    switch (template.type) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
    }

    try {
      await dispatch(generateReport({ type: template.type, startDate, endDate: now })).unwrap();
      Alert.alert('Success', 'Report generated successfully');
    } catch (err) {
      Alert.alert('Error', 'Failed to generate report');
    }
  };

  const handleScheduleReport = async () => {
    if (!reportName.trim()) {
      Alert.alert('Error', 'Please enter a report name');
      return;
    }

    try {
      await dispatch(
        createScheduledReport({
          name: reportName,
          type: scheduleFrequency,
          format: reportFormat,
          recipients: [],
          schedule: scheduleFrequency,
          is_active: true,
        })
      ).unwrap();
      Alert.alert('Success', 'Report scheduled successfully');
      setReportName('');
    } catch (err) {
      Alert.alert('Error', 'Failed to schedule report');
    }
  };

  const handleToggleScheduledReport = async (id: string, isActive: boolean) => {
    try {
      await dispatch(updateScheduledReport({ id, updates: { is_active: !isActive } })).unwrap();
    } catch (err) {
      Alert.alert('Error', 'Failed to update scheduled report');
    }
  };

  const handleDeleteScheduledReport = async (id: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this scheduled report?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await dispatch(deleteScheduledReport(id)).unwrap();
          } catch (err) {
            Alert.alert('Error', 'Failed to delete scheduled report');
          }
        },
      },
    ]);
  };

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {(['templates', 'custom', 'scheduled', 'history', 'settings'] as TabType[]).map((tab) => (
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
      </ScrollView>
    </View>
  );

  const renderTemplatesTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Report Templates</Text>
      {REPORT_TEMPLATES.map((template) => (
        <TouchableOpacity
          key={template.id}
          style={styles.templateCard}
          onPress={() => handleGenerateReport(template)}
        >
          <View style={styles.templateIcon}>
            <Text style={styles.templateIconText}>{template.icon}</Text>
          </View>
          <View style={styles.templateInfo}>
            <Text style={styles.templateName}>{template.name}</Text>
            <Text style={styles.templateDescription}>{template.description}</Text>
          </View>
          <View style={styles.templateAction}>
            <Text style={styles.generateButton}>Generate</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderCustomTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Custom Report Builder</Text>
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>Custom report builder coming soon</Text>
        <Text style={styles.emptyStateSubtext}>
          Build custom reports with drag-and-drop interface
        </Text>
      </View>
    </ScrollView>
  );

  const renderScheduledTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Schedule New Report</Text>
      <View style={styles.formContainer}>
        <Text style={styles.label}>Report Name</Text>
        <TextInput
          style={styles.input}
          value={reportName}
          onChangeText={setReportName}
          placeholder="Enter report name"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Frequency</Text>
        <View style={styles.frequencyContainer}>
          {(['daily', 'weekly', 'monthly'] as ReportType[]).map((freq) => (
            <TouchableOpacity
              key={freq}
              style={[
                styles.frequencyButton,
                scheduleFrequency === freq && styles.frequencyButtonActive,
              ]}
              onPress={() => setScheduleFrequency(freq)}
            >
              <Text
                style={[
                  styles.frequencyText,
                  scheduleFrequency === freq && styles.frequencyTextActive,
                ]}
              >
                {freq.charAt(0).toUpperCase() + freq.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Export Format</Text>
        <View style={styles.frequencyContainer}>
          {(['json', 'csv'] as ExportFormat[]).map((format) => (
            <TouchableOpacity
              key={format}
              style={[
                styles.frequencyButton,
                reportFormat === format && styles.frequencyButtonActive,
              ]}
              onPress={() => setReportFormat(format)}
            >
              <Text
                style={[
                  styles.frequencyText,
                  reportFormat === format && styles.frequencyTextActive,
                ]}
              >
                {format.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.scheduleButton} onPress={handleScheduleReport}>
          <Text style={styles.scheduleButtonText}>Schedule Report</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Scheduled Reports</Text>
      {scheduledReports.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No scheduled reports</Text>
        </View>
      ) : (
        scheduledReports.map((report) => (
          <View key={report.id} style={styles.scheduledReportCard}>
            <View style={styles.scheduledReportInfo}>
              <Text style={styles.scheduledReportName}>{report.name}</Text>
              <Text style={styles.scheduledReportDetails}>
                {report.type} • {report.format.toUpperCase()}
              </Text>
              <Text style={styles.scheduledReportStatus}>
                {report.is_active ? '✓ Active' : '✗ Inactive'}
              </Text>
            </View>
            <View style={styles.scheduledReportActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleToggleScheduledReport(report.id, report.is_active)}
              >
                <Text style={styles.actionButtonText}>
                  {report.is_active ? 'Pause' : 'Resume'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDeleteScheduledReport(report.id)}
              >
                <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );

  const renderHistoryTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Report History</Text>
      {reports.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No reports generated yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Generate your first report from the Templates tab
          </Text>
        </View>
      ) : (
        reports.map((report) => (
          <View key={report.id} style={styles.reportCard}>
            <View style={styles.reportInfo}>
              <Text style={styles.reportType}>
                {report.type.charAt(0).toUpperCase() + report.type.slice(1)} Report
              </Text>
              <Text style={styles.reportDate}>
                {new Date(report.start_date).toLocaleDateString()} -{' '}
                {new Date(report.end_date).toLocaleDateString()}
              </Text>
              <Text style={styles.reportGenerated}>
                Generated: {new Date(report.generated_at).toLocaleString()}
              </Text>
            </View>
            <TouchableOpacity style={styles.viewButton}>
              <Text style={styles.viewButtonText}>View</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );

  const renderSettingsTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Report Settings</Text>
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>Report settings coming soon</Text>
        <Text style={styles.emptyStateSubtext}>
          Configure default report preferences and distribution settings
        </Text>
      </View>
    </ScrollView>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'templates':
        return renderTemplatesTab();
      case 'custom':
        return renderCustomTab();
      case 'scheduled':
        return renderScheduledTab();
      case 'history':
        return renderHistoryTab();
      case 'settings':
        return renderSettingsTab();
      default:
        return null;
    }
  };

  if (loading && reports.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading reports...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderTabs()}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      {renderTabContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  tabsContainer: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#E3F2FD',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    marginTop: 8,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  templateIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  templateIconText: {
    fontSize: 24,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 13,
    color: '#666',
  },
  templateAction: {
    marginLeft: 12,
  },
  generateButton: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  formContainer: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
  },
  frequencyContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
    alignItems: 'center',
  },
  frequencyButtonActive: {
    backgroundColor: '#007AFF',
  },
  frequencyText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  frequencyTextActive: {
    color: '#FFF',
  },
  scheduleButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  scheduleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  scheduledReportCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scheduledReportInfo: {
    flex: 1,
  },
  scheduledReportName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  scheduledReportDetails: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  scheduledReportStatus: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  scheduledReportActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#E3F2FD',
    marginLeft: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
  },
  deleteButtonText: {
    color: '#C62828',
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportInfo: {
    flex: 1,
  },
  reportType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  reportDate: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  reportGenerated: {
    fontSize: 12,
    color: '#999',
  },
  viewButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#E3F2FD',
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#BBB',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
  },
});
