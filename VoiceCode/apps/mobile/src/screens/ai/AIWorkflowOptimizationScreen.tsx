/**
 * AI Workflow Optimization Screen
 * Phase 3 Week 10 Day 68-69: Intelligent Automation
 * 
 * Workflow analytics and AI-suggested optimizations.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { RootState, AppDispatch } from '../../store';
import {
  fetchAnalytics,
  fetchOptimizations,
  applyOptimization,
  fetchMonitoring,
  fetchPerformanceMetrics,
  fetchExecutionHistory,
} from '../../store/slices/workflowOptimizationSlice';
import { fetchWorkflows } from '../../store/slices/automationSlice';

type TabType = 'analytics' | 'optimizations' | 'monitoring' | 'history' | 'templates';

const screenWidth = Dimensions.get('window').width;

export default function AIWorkflowOptimizationScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const {
    analytics,
    optimizations,
    monitoring,
    performanceMetrics,
    executionHistory,
    loading,
    error,
  } = useSelector((state: RootState) => state.workflowOptimization);
  const { workflows } = useSelector((state: RootState) => state.automation);

  const [activeTab, setActiveTab] = useState<TabType>('analytics');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchWorkflows('current-user'));
    dispatch(fetchPerformanceMetrics('current-user'));
    dispatch(fetchMonitoring('current-user'));
  }, [dispatch]);

  useEffect(() => {
    if (selectedWorkflowId) {
      dispatch(fetchAnalytics(selectedWorkflowId));
      dispatch(fetchOptimizations(selectedWorkflowId));
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      dispatch(fetchExecutionHistory({ workflowId: selectedWorkflowId, startDate, endDate }));
    }
  }, [selectedWorkflowId, dispatch]);

  const handleApplyOptimization = (optimizationId: string) => {
    dispatch(applyOptimization(optimizationId));
  };

  const renderAnalyticsTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Workflow Selector */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Workflow</Text>
        {workflows.map((workflow) => (
          <TouchableOpacity
            key={workflow.id}
            style={[
              styles.workflowOption,
              selectedWorkflowId === workflow.id && styles.workflowOptionActive
            ]}
            onPress={() => setSelectedWorkflowId(workflow.id)}
          >
            <View style={styles.workflowInfo}>
              <Text style={styles.workflowName}>{workflow.name}</Text>
              <Text style={styles.workflowStats}>
                {workflow.execution_count} executions • {workflow.success_count} successful
              </Text>
            </View>
            {selectedWorkflowId === workflow.id && (
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {analytics && (
        <>
          {/* Performance Overview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performance Overview</Text>
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
                <Text style={styles.metricValue}>{analytics.success_rate.toFixed(1)}%</Text>
                <Text style={styles.metricLabel}>Success Rate</Text>
              </View>
              <View style={styles.metricCard}>
                <Ionicons name="time" size={32} color="#2196F3" />
                <Text style={styles.metricValue}>{analytics.average_duration}ms</Text>
                <Text style={styles.metricLabel}>Avg Duration</Text>
              </View>
              <View style={styles.metricCard}>
                <Ionicons name="flash" size={32} color="#FF9800" />
                <Text style={styles.metricValue}>{analytics.total_executions}</Text>
                <Text style={styles.metricLabel}>Total Runs</Text>
              </View>
              <View style={styles.metricCard}>
                <Ionicons
                  name={
                    analytics.performance_trend === 'improving' ? 'trending-up' :
                    analytics.performance_trend === 'declining' ? 'trending-down' :
                    'remove'
                  }
                  size={32}
                  color={
                    analytics.performance_trend === 'improving' ? '#4CAF50' :
                    analytics.performance_trend === 'declining' ? '#F44336' :
                    '#666'
                  }
                />
                <Text style={styles.metricValue}>{analytics.performance_trend}</Text>
                <Text style={styles.metricLabel}>Trend</Text>
              </View>
            </View>
          </View>

          {/* Execution Timeline */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Execution Timeline (Last 7 Days)</Text>
            <LineChart
              data={{
                labels: analytics.executions_by_day.map(d => d.date.substring(5)),
                datasets: [{
                  data: analytics.executions_by_day.map(d => d.count),
                }],
              }}
              width={screenWidth - 32}
              height={220}
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
              }}
              bezier
              style={styles.chart}
            />
          </View>
        </>
      )}
    </ScrollView>
  );

  const renderOptimizationsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI-Suggested Optimizations</Text>
        {optimizations.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
            <Text style={styles.emptyStateText}>No optimizations needed!</Text>
            <Text style={styles.emptyStateSubtext}>Your workflow is running optimally</Text>
          </View>
        ) : (
          optimizations.map((opt) => (
            <View key={opt.id} style={styles.optimizationCard}>
              <View style={styles.optimizationHeader}>
                <View style={[
                  styles.impactBadge,
                  opt.impact === 'high' ? styles.impactHigh :
                  opt.impact === 'medium' ? styles.impactMedium :
                  styles.impactLow
                ]}>
                  <Text style={styles.impactText}>{opt.impact.toUpperCase()}</Text>
                </View>
                <View style={[
                  styles.typeBadge,
                  { backgroundColor: getOptimizationTypeColor(opt.type) }
                ]}>
                  <Text style={styles.typeText}>{opt.type}</Text>
                </View>
              </View>
              <Text style={styles.optimizationTitle}>{opt.title}</Text>
              <Text style={styles.optimizationDescription}>{opt.description}</Text>
              <View style={styles.optimizationMetrics}>
                <View style={styles.optimizationMetric}>
                  <Ionicons name="trending-up" size={16} color="#4CAF50" />
                  <Text style={styles.optimizationMetricText}>{opt.estimated_improvement}</Text>
                </View>
              </View>
              <Text style={styles.recommendationLabel}>Recommendation:</Text>
              <Text style={styles.recommendationText}>{opt.recommendation}</Text>
              {!opt.is_applied && (
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={() => handleApplyOptimization(opt.id)}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.applyButtonText}>Apply Optimization</Text>
                </TouchableOpacity>
              )}
              {opt.is_applied && (
                <View style={styles.appliedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  <Text style={styles.appliedText}>Applied</Text>
                </View>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );

  const renderMonitoringTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Workflows</Text>
        {monitoring.map((mon) => {
          const workflow = workflows.find(w => w.id === mon.workflow_id);
          return (
            <View key={mon.workflow_id} style={styles.monitoringCard}>
              <View style={styles.monitoringHeader}>
                <Text style={styles.monitoringName}>{workflow?.name || 'Unknown'}</Text>
                <View style={[
                  styles.statusBadge,
                  mon.status === 'running' ? styles.statusRunning :
                  mon.status === 'error' ? styles.statusError :
                  styles.statusIdle
                ]}>
                  <Text style={styles.statusText}>{mon.status.toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.monitoringStats}>
                <View style={styles.monitoringStat}>
                  <Ionicons name="alert-circle" size={16} color="#F44336" />
                  <Text style={styles.monitoringStatText}>{mon.error_count_24h} errors (24h)</Text>
                </View>
                {mon.next_scheduled_run && (
                  <View style={styles.monitoringStat}>
                    <Ionicons name="time" size={16} color="#2196F3" />
                    <Text style={styles.monitoringStatText}>
                      Next: {new Date(mon.next_scheduled_run).toLocaleTimeString()}
                    </Text>
                  </View>
                )}
              </View>
              {mon.last_error && (
                <View style={styles.errorBox}>
                  <Ionicons name="warning" size={16} color="#F44336" />
                  <Text style={styles.errorText}>{mon.last_error}</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {performanceMetrics && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>24-Hour Performance</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{performanceMetrics.total_executions_24h}</Text>
              <Text style={styles.metricLabel}>Total Executions</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{performanceMetrics.successful_executions_24h}</Text>
              <Text style={styles.metricLabel}>Successful</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{performanceMetrics.failed_executions_24h}</Text>
              <Text style={styles.metricLabel}>Failed</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{performanceMetrics.average_execution_time}ms</Text>
              <Text style={styles.metricLabel}>Avg Time</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Execution Timeline (24h)</Text>
          <BarChart
            data={{
              labels: performanceMetrics.execution_timeline.slice(0, 12).map(t => `${t.hour}h`),
              datasets: [{
                data: performanceMetrics.execution_timeline.slice(0, 12).map(t => t.count),
              }],
            }}
            width={screenWidth - 32}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
              style: {
                borderRadius: 16,
              },
            }}
            style={styles.chart}
          />
        </View>
      )}
    </ScrollView>
  );

  const renderHistoryTab = () => (
    <ScrollView style={styles.tabContent}>
      {executionHistory && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Execution History</Text>
          <View style={styles.historyStats}>
            <View style={styles.historyStat}>
              <Text style={styles.historyStatValue}>{executionHistory.total_count}</Text>
              <Text style={styles.historyStatLabel}>Total</Text>
            </View>
            <View style={styles.historyStat}>
              <Text style={[styles.historyStatValue, { color: '#4CAF50' }]}>
                {executionHistory.success_count}
              </Text>
              <Text style={styles.historyStatLabel}>Success</Text>
            </View>
            <View style={styles.historyStat}>
              <Text style={[styles.historyStatValue, { color: '#F44336' }]}>
                {executionHistory.failure_count}
              </Text>
              <Text style={styles.historyStatLabel}>Failed</Text>
            </View>
          </View>

          {executionHistory.executions.map((exec) => (
            <View key={exec.id} style={styles.executionCard}>
              <View style={styles.executionHeader}>
                <Ionicons
                  name={exec.status === 'completed' ? 'checkmark-circle' : 'close-circle'}
                  size={24}
                  color={exec.status === 'completed' ? '#4CAF50' : '#F44336'}
                />
                <View style={styles.executionInfo}>
                  <Text style={styles.executionStatus}>{exec.status.toUpperCase()}</Text>
                  <Text style={styles.executionTime}>
                    {new Date(exec.started_at).toLocaleString()}
                  </Text>
                </View>
                <Text style={styles.executionDuration}>{exec.duration}ms</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderTemplatesTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Workflow Templates</Text>
        <Text style={styles.sectionSubtitle}>
          Create new workflows from pre-built templates
        </Text>
        <View style={styles.emptyState}>
          <Ionicons name="albums" size={64} color="#2196F3" />
          <Text style={styles.emptyStateText}>Template management coming soon</Text>
        </View>
      </View>
    </ScrollView>
  );

  const getOptimizationTypeColor = (type: string): string => {
    switch (type) {
      case 'performance': return '#2196F3';
      case 'reliability': return '#4CAF50';
      case 'cost': return '#FF9800';
      case 'efficiency': return '#9C27B0';
      default: return '#666';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Workflow Optimization</Text>
        <Text style={styles.subtitle}>AI-powered analytics and insights</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'analytics' && styles.tabActive]}
          onPress={() => setActiveTab('analytics')}
        >
          <Ionicons
            name="stats-chart"
            size={20}
            color={activeTab === 'analytics' ? '#2196F3' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'analytics' && styles.tabTextActive]}>
            Analytics
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'optimizations' && styles.tabActive]}
          onPress={() => setActiveTab('optimizations')}
        >
          <Ionicons
            name="bulb"
            size={20}
            color={activeTab === 'optimizations' ? '#2196F3' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'optimizations' && styles.tabTextActive]}>
            Optimize
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'monitoring' && styles.tabActive]}
          onPress={() => setActiveTab('monitoring')}
        >
          <Ionicons
            name="pulse"
            size={20}
            color={activeTab === 'monitoring' ? '#2196F3' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'monitoring' && styles.tabTextActive]}>
            Monitor
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Ionicons
            name="time"
            size={20}
            color={activeTab === 'history' ? '#2196F3' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            History
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'templates' && styles.tabActive]}
          onPress={() => setActiveTab('templates')}
        >
          <Ionicons
            name="albums"
            size={20}
            color={activeTab === 'templates' ? '#2196F3' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'templates' && styles.tabTextActive]}>
            Templates
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      ) : (
        <>
          {activeTab === 'analytics' && renderAnalyticsTab()}
          {activeTab === 'optimizations' && renderOptimizationsTab()}
          {activeTab === 'monitoring' && renderMonitoringTab()}
          {activeTab === 'history' && renderHistoryTab()}
          {activeTab === 'templates' && renderTemplatesTab()}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 12,
    color: '#666',
  },
  tabTextActive: {
    color: '#2196F3',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  workflowOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
  },
  workflowOptionActive: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  workflowInfo: {
    flex: 1,
  },
  workflowName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  workflowStats: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  optimizationCard: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  optimizationHeader: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  impactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  impactHigh: {
    backgroundColor: '#FFEBEE',
  },
  impactMedium: {
    backgroundColor: '#FFF3E0',
  },
  impactLow: {
    backgroundColor: '#E8F5E9',
  },
  impactText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  optimizationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  optimizationDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  optimizationMetrics: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  optimizationMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  optimizationMetricText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  recommendationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  appliedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  appliedText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  monitoringCard: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  monitoringHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monitoringName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusRunning: {
    backgroundColor: '#E3F2FD',
  },
  statusError: {
    backgroundColor: '#FFEBEE',
  },
  statusIdle: {
    backgroundColor: '#F5F5F5',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  monitoringStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  monitoringStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  monitoringStatText: {
    fontSize: 12,
    color: '#666',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 8,
    borderRadius: 4,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#F44336',
  },
  historyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  historyStat: {
    alignItems: 'center',
  },
  historyStatValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  historyStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  executionCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  executionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  executionInfo: {
    flex: 1,
  },
  executionStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  executionTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  executionDuration: {
    fontSize: 12,
    color: '#666',
  },
});

