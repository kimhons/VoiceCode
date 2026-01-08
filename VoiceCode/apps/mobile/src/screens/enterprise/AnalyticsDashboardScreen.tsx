/**
 * Analytics Dashboard Screen
 * Phase 3 Week 9 Day 61-63: Advanced Analytics & Reporting
 * 
 * Comprehensive analytics dashboard with 6 tabs:
 * - Overview: Key metrics and trends
 * - Usage: Transcription minutes, storage, API calls
 * - Performance: Team productivity, accuracy metrics
 * - Costs: Billing analysis, cost breakdown
 * - Activity: User activity logs, feature usage
 * - Insights: AI-powered insights and recommendations
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchDashboardMetrics,
  fetchUsageStats,
  fetchPerformanceMetrics,
  fetchCostBreakdown,
  fetchActivityLogs,
  fetchActivitySummary,
  fetchTopActivities,
  fetchInsights,
  fetchUsagePattern,
  setTimeRange,
} from '../../store/slices/analyticsSlice';

const { width } = Dimensions.get('window');

type TabType = 'overview' | 'usage' | 'performance' | 'costs' | 'activity' | 'insights';

export default function AnalyticsDashboardScreen() {
  const dispatch = useAppDispatch();
  const {
    dashboardMetrics,
    usageStats,
    performanceMetrics,
    costBreakdown,
    activityLogs,
    activitySummary,
    topActivities,
    insights,
    usagePattern,
    timeRange,
    loading,
    error,
  } = useAppSelector((state) => state.analytics);

  const [activeTab, setActiveTab] = useState<TabType>('overview');

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = () => {
    dispatch(fetchDashboardMetrics());
    
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }
    
    dispatch(fetchUsageStats({ startDate, endDate: now }));
    dispatch(fetchPerformanceMetrics({ startDate, endDate: now }));
    dispatch(fetchCostBreakdown({ startDate, endDate: now }));

    // Fetch activity and insights data
    const startDateStr = startDate.toISOString();
    const endDateStr = now.toISOString();
    dispatch(fetchActivityLogs({ startDate: startDateStr, endDate: endDateStr, limit: 50 }));
    dispatch(fetchActivitySummary({ startDate: startDateStr, endDate: endDateStr }));
    dispatch(fetchTopActivities({ startDate: startDateStr, endDate: endDateStr, limit: 10 }));
    dispatch(fetchInsights({ startDate: startDateStr, endDate: endDateStr, limit: 10 }));
    dispatch(fetchUsagePattern({ startDate: startDateStr, endDate: endDateStr }));
  };

  const renderTimeRangeSelector = () => (
    <View style={styles.timeRangeContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {(['today', 'week', 'month', 'quarter', 'year'] as const).map((range) => (
          <TouchableOpacity
            key={range}
            style={[styles.timeRangeButton, timeRange === range && styles.timeRangeButtonActive]}
            onPress={() => dispatch(setTimeRange(range))}
          >
            <Text style={[styles.timeRangeText, timeRange === range && styles.timeRangeTextActive]}>
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {(['overview', 'usage', 'performance', 'costs', 'activity', 'insights'] as TabType[]).map((tab) => (
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

  const renderOverviewTab = () => {
    if (!dashboardMetrics) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No data available</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Key Metrics</Text>
        
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{dashboardMetrics.thisMonth.transcripts}</Text>
            <Text style={styles.metricLabel}>Transcripts</Text>
            <Text style={styles.metricSubtext}>This Month</Text>
          </View>
          
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{Math.round(dashboardMetrics.thisMonth.minutes)}</Text>
            <Text style={styles.metricLabel}>Minutes</Text>
            <Text style={styles.metricSubtext}>This Month</Text>
          </View>
          
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{dashboardMetrics.thisMonth.exports}</Text>
            <Text style={styles.metricLabel}>Exports</Text>
            <Text style={styles.metricSubtext}>This Month</Text>
          </View>
          
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>${dashboardMetrics.thisMonth.cost.toFixed(2)}</Text>
            <Text style={styles.metricLabel}>Cost</Text>
            <Text style={styles.metricSubtext}>This Month</Text>
          </View>
        </View>

        {usageStats.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Usage Trends</Text>
            <LineChart
              data={{
                labels: usageStats.slice(-7).map((s) => new Date(s.date).getDate().toString()),
                datasets: [
                  {
                    data: usageStats.slice(-7).map((s) => s.total_minutes),
                  },
                ],
              }}
              width={width - 40}
              height={220}
              chartConfig={{
                backgroundColor: '#1E2923',
                backgroundGradientFrom: '#08130D',
                backgroundGradientTo: '#1E2923',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
              }}
              bezier
              style={styles.chart}
            />
          </>
        )}

        <Text style={styles.sectionTitle}>Total Statistics</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Transcripts:</Text>
            <Text style={styles.statValue}>{dashboardMetrics.total.transcripts}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Minutes:</Text>
            <Text style={styles.statValue}>{Math.round(dashboardMetrics.total.minutes)}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Words:</Text>
            <Text style={styles.statValue}>{dashboardMetrics.total.words.toLocaleString()}</Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderUsageTab = () => {
    if (usageStats.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No usage data available</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Transcription Minutes</Text>
        <LineChart
          data={{
            labels: usageStats.slice(-7).map((s) => new Date(s.date).getDate().toString()),
            datasets: [
              {
                data: usageStats.slice(-7).map((s) => s.total_minutes),
              },
            ],
          }}
          width={width - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#1E2923',
            backgroundGradientFrom: '#08130D',
            backgroundGradientTo: '#1E2923',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          bezier
          style={styles.chart}
        />

        <Text style={styles.sectionTitle}>Feature Usage</Text>
        <BarChart
          data={{
            labels: ['Transcripts', 'Uploads', 'Exports', 'AI Features'],
            datasets: [
              {
                data: [
                  usageStats.reduce((sum, s) => sum + s.transcripts_count, 0),
                  usageStats.reduce((sum, s) => sum + s.audio_uploads_count, 0),
                  usageStats.reduce((sum, s) => sum + s.exports_count, 0),
                  usageStats.reduce((sum, s) => sum + s.ai_features_count, 0),
                ],
              },
            ],
          }}
          width={width - 40}
          height={220}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={{
            backgroundColor: '#1E2923',
            backgroundGradientFrom: '#08130D',
            backgroundGradientTo: '#1E2923',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          style={styles.chart}
        />

        <Text style={styles.sectionTitle}>Usage Summary</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Transcripts:</Text>
            <Text style={styles.statValue}>
              {usageStats.reduce((sum, s) => sum + s.transcripts_count, 0)}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Minutes:</Text>
            <Text style={styles.statValue}>
              {Math.round(usageStats.reduce((sum, s) => sum + s.total_minutes, 0))}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Words:</Text>
            <Text style={styles.statValue}>
              {usageStats.reduce((sum, s) => sum + s.total_words, 0).toLocaleString()}
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderPerformanceTab = () => {
    if (performanceMetrics.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No performance data available</Text>
        </View>
      );
    }

    const avgAccuracy = performanceMetrics.reduce((sum, m) => sum + m.avg_accuracy, 0) / performanceMetrics.length;
    const avgLatency = performanceMetrics.reduce((sum, m) => sum + m.avg_latency, 0) / performanceMetrics.length;
    const totalSuccess = performanceMetrics.reduce((sum, m) => sum + m.success_count, 0);
    const totalErrors = performanceMetrics.reduce((sum, m) => sum + m.error_count, 0);

    return (
      <ScrollView style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Accuracy Trend</Text>
        <LineChart
          data={{
            labels: performanceMetrics.slice(-7).map((m) => new Date(m.date).getDate().toString()),
            datasets: [
              {
                data: performanceMetrics.slice(-7).map((m) => m.avg_accuracy * 100),
              },
            ],
          }}
          width={width - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#1E2923',
            backgroundGradientFrom: '#08130D',
            backgroundGradientTo: '#1E2923',
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          bezier
          style={styles.chart}
        />

        <Text style={styles.sectionTitle}>Performance Metrics</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{(avgAccuracy * 100).toFixed(1)}%</Text>
            <Text style={styles.metricLabel}>Avg Accuracy</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{avgLatency.toFixed(1)}s</Text>
            <Text style={styles.metricLabel}>Avg Latency</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{totalSuccess}</Text>
            <Text style={styles.metricLabel}>Successful</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{totalErrors}</Text>
            <Text style={styles.metricLabel}>Errors</Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderCostsTab = () => {
    if (costBreakdown.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No cost data available</Text>
        </View>
      );
    }

    const totalCost = costBreakdown.reduce((sum, c) => sum + c.total_cost, 0);
    const totalApiCost = costBreakdown.reduce((sum, c) => sum + c.api_cost, 0);
    const totalStorageCost = costBreakdown.reduce((sum, c) => sum + c.storage_cost, 0);
    const totalAiCost = costBreakdown.reduce((sum, c) => sum + c.ai_features_cost, 0);

    return (
      <ScrollView style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Cost Trend</Text>
        <LineChart
          data={{
            labels: costBreakdown.slice(-7).map((c) => new Date(c.date).getDate().toString()),
            datasets: [
              {
                data: costBreakdown.slice(-7).map((c) => c.total_cost),
              },
            ],
          }}
          width={width - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#1E2923',
            backgroundGradientFrom: '#08130D',
            backgroundGradientTo: '#1E2923',
            decimalPlaces: 2,
            color: (opacity = 1) => `rgba(255, 99, 71, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          bezier
          style={styles.chart}
        />

        <Text style={styles.sectionTitle}>Cost Breakdown</Text>
        <PieChart
          data={[
            {
              name: 'API',
              population: totalApiCost,
              color: '#FF6384',
              legendFontColor: '#7F7F7F',
              legendFontSize: 12,
            },
            {
              name: 'Storage',
              population: totalStorageCost,
              color: '#36A2EB',
              legendFontColor: '#7F7F7F',
              legendFontSize: 12,
            },
            {
              name: 'AI Features',
              population: totalAiCost,
              color: '#FFCE56',
              legendFontColor: '#7F7F7F',
              legendFontSize: 12,
            },
          ]}
          width={width - 40}
          height={220}
          chartConfig={{
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          style={styles.chart}
        />

        <Text style={styles.sectionTitle}>Cost Summary</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Cost:</Text>
            <Text style={styles.statValue}>${totalCost.toFixed(2)}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>API Cost:</Text>
            <Text style={styles.statValue}>${totalApiCost.toFixed(2)}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Storage Cost:</Text>
            <Text style={styles.statValue}>${totalStorageCost.toFixed(2)}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>AI Features Cost:</Text>
            <Text style={styles.statValue}>${totalAiCost.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderActivityTab = () => {
    const getActivityIcon = (type: string): string => {
      if (type.startsWith('recording_')) return '🎙️';
      if (type.startsWith('transcription_')) return '📝';
      if (type.startsWith('export_')) return '📤';
      if (type.startsWith('ai_')) return '🤖';
      if (type.startsWith('search_') || type.startsWith('filter_')) return '🔍';
      if (type.startsWith('share_') || type.startsWith('collaborate_')) return '👥';
      return '📊';
    };

    const getActivityLabel = (type: string): string => {
      return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    return (
      <ScrollView style={styles.tabContent}>
        {/* Engagement Score */}
        {activitySummary && (
          <View style={styles.engagementCard}>
            <Text style={styles.sectionTitle}>Engagement Score</Text>
            <View style={styles.engagementScoreContainer}>
              <View style={styles.engagementScoreCircle}>
                <Text style={styles.engagementScoreValue}>{activitySummary.engagement_score}</Text>
                <Text style={styles.engagementScoreLabel}>/ 100</Text>
              </View>
              <View style={styles.engagementDetails}>
                <Text style={styles.engagementText}>
                  {activitySummary.engagement_score >= 70 ? '🎉 Excellent engagement!' :
                   activitySummary.engagement_score >= 50 ? '👍 Good engagement' :
                   activitySummary.engagement_score >= 30 ? '📈 Moderate engagement' :
                   '💡 Low engagement - explore more features'}
                </Text>
                <Text style={styles.engagementSubtext}>
                  {activitySummary.total_activities} activities tracked
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Top Activities */}
        <Text style={styles.sectionTitle}>Top Activities</Text>
        {topActivities.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No activities yet</Text>
            <Text style={styles.emptyStateSubtext}>Start using features to see activity data</Text>
          </View>
        ) : (
          topActivities.map((activity, index) => (
            <View key={activity.activity_type} style={styles.activityCard}>
              <View style={styles.activityRank}>
                <Text style={styles.activityRankText}>#{index + 1}</Text>
              </View>
              <View style={styles.activityIcon}>
                <Text style={styles.activityIconText}>{getActivityIcon(activity.activity_type)}</Text>
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityName}>{getActivityLabel(activity.activity_type)}</Text>
                <Text style={styles.activityStats}>
                  {activity.count} times • {activity.percentage.toFixed(1)}%
                </Text>
              </View>
              <View style={styles.activityBar}>
                <View style={[styles.activityBarFill, { width: `${activity.percentage}%` }]} />
              </View>
            </View>
          ))
        )}

        {/* Recent Activity Timeline */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {activityLogs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No recent activity</Text>
          </View>
        ) : (
          activityLogs.slice(0, 20).map((log) => (
            <View key={log.id} style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <View style={styles.timelineHeader}>
                  <Text style={styles.timelineIcon}>{getActivityIcon(log.activity_type)}</Text>
                  <Text style={styles.timelineTitle}>{getActivityLabel(log.activity_type)}</Text>
                </View>
                <Text style={styles.timelineTime}>
                  {new Date(log.created_at).toLocaleString()}
                </Text>
              </View>
            </View>
          ))
        )}

        {/* Activity Heatmap Placeholder */}
        <Text style={styles.sectionTitle}>Activity Heatmap</Text>
        <View style={styles.heatmapPlaceholder}>
          <Text style={styles.heatmapPlaceholderText}>📊 Heatmap visualization coming soon</Text>
          <Text style={styles.heatmapPlaceholderSubtext}>
            See your activity patterns by hour and day
          </Text>
        </View>
      </ScrollView>
    );
  };

  const renderInsightsTab = () => {
    const getSeverityColor = (severity: string): string => {
      switch (severity) {
        case 'critical': return '#C62828';
        case 'warning': return '#F57C00';
        case 'success': return '#2E7D32';
        default: return '#1976D2';
      }
    };

    const getSeverityIcon = (severity: string): string => {
      switch (severity) {
        case 'critical': return '🚨';
        case 'warning': return '⚠️';
        case 'success': return '✅';
        default: return 'ℹ️';
      }
    };

    return (
      <ScrollView style={styles.tabContent}>
        {/* Usage Pattern */}
        {usagePattern && (
          <View style={styles.insightCard}>
            <Text style={styles.sectionTitle}>Usage Pattern</Text>
            <View style={styles.patternContainer}>
              <View style={styles.patternBadge}>
                <Text style={styles.patternBadgeText}>
                  {usagePattern.pattern_type.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.patternTrend}>
                Trend: {usagePattern.trend_percentage > 0 ? '📈' : '📉'}{' '}
                {Math.abs(usagePattern.trend_percentage).toFixed(1)}%
              </Text>
              <Text style={styles.patternConfidence}>
                Confidence: {usagePattern.confidence.toFixed(0)}%
              </Text>
              {usagePattern.prediction_next_week !== undefined && (
                <Text style={styles.patternPrediction}>
                  Predicted next week: {usagePattern.prediction_next_week.toFixed(0)} minutes
                </Text>
              )}
            </View>
          </View>
        )}

        {/* AI Insights */}
        <Text style={styles.sectionTitle}>AI-Powered Insights</Text>
        {insights.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No insights available</Text>
            <Text style={styles.emptyStateSubtext}>
              Insights will appear as we analyze your usage patterns
            </Text>
          </View>
        ) : (
          insights.map((insight) => (
            <View key={insight.id} style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(insight.severity) }]}>
                  <Text style={styles.severityIcon}>{getSeverityIcon(insight.severity)}</Text>
                  <Text style={styles.severityText}>{insight.severity.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.insightTitle}>{insight.title}</Text>
              <Text style={styles.insightDescription}>{insight.description}</Text>
              {insight.recommendation && (
                <View style={styles.recommendationBox}>
                  <Text style={styles.recommendationLabel}>💡 Recommendation:</Text>
                  <Text style={styles.recommendationText}>{insight.recommendation}</Text>
                </View>
              )}
              {insight.metric_value !== undefined && (
                <View style={styles.metricContainer}>
                  <Text style={styles.metricLabel}>Current Value:</Text>
                  <Text style={styles.metricValue}>
                    {insight.metric_value.toFixed(1)}
                    {insight.metric_change !== undefined && (
                      <Text style={[
                        styles.metricChange,
                        { color: insight.metric_change > 0 ? '#2E7D32' : '#C62828' }
                      ]}>
                        {' '}({insight.metric_change > 0 ? '+' : ''}{insight.metric_change.toFixed(1)}%)
                      </Text>
                    )}
                  </Text>
                </View>
              )}
            </View>
          ))
        )}

        {/* Quick Stats */}
        <Text style={styles.sectionTitle}>Quick Stats</Text>
        <View style={styles.quickStatsGrid}>
          <View style={styles.quickStatCard}>
            <Text style={styles.quickStatValue}>{insights.length}</Text>
            <Text style={styles.quickStatLabel}>Total Insights</Text>
          </View>
          <View style={styles.quickStatCard}>
            <Text style={styles.quickStatValue}>
              {insights.filter(i => i.severity === 'critical').length}
            </Text>
            <Text style={styles.quickStatLabel}>Critical</Text>
          </View>
          <View style={styles.quickStatCard}>
            <Text style={styles.quickStatValue}>
              {insights.filter(i => i.severity === 'warning').length}
            </Text>
            <Text style={styles.quickStatLabel}>Warnings</Text>
          </View>
          <View style={styles.quickStatCard}>
            <Text style={styles.quickStatValue}>
              {insights.filter(i => i.severity === 'success').length}
            </Text>
            <Text style={styles.quickStatLabel}>Success</Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'usage':
        return renderUsageTab();
      case 'performance':
        return renderPerformanceTab();
      case 'costs':
        return renderCostsTab();
      case 'activity':
        return renderActivityTab();
      case 'insights':
        return renderInsightsTab();
      default:
        return null;
    }
  };

  if (loading && !dashboardMetrics) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderTimeRangeSelector()}
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
  timeRangeContainer: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  timeRangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  timeRangeButtonActive: {
    backgroundColor: '#007AFF',
  },
  timeRangeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  timeRangeTextActive: {
    color: '#FFF',
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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginRight: '2%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  metricSubtext: {
    fontSize: 12,
    color: '#999',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  statsContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
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
  // Activity Tab Styles
  engagementCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  engagementScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  engagementScoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  engagementScoreValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#007AFF',
  },
  engagementScoreLabel: {
    fontSize: 14,
    color: '#666',
  },
  engagementDetails: {
    flex: 1,
  },
  engagementText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  engagementSubtext: {
    fontSize: 14,
    color: '#666',
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityRankText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#007AFF',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityIconText: {
    fontSize: 20,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  activityStats: {
    fontSize: 12,
    color: '#666',
  },
  activityBar: {
    width: 60,
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
    marginLeft: 12,
  },
  activityBarFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
    marginTop: 4,
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  timelineIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  timelineTime: {
    fontSize: 12,
    color: '#999',
  },
  heatmapPlaceholder: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    marginBottom: 16,
  },
  heatmapPlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  heatmapPlaceholderSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  // Insights Tab Styles
  insightCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightHeader: {
    marginBottom: 12,
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  severityIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  insightDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  recommendationBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  recommendationLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
  metricContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  metricChange: {
    fontSize: 14,
    fontWeight: '600',
  },
  patternContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
  },
  patternBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
  },
  patternBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  patternTrend: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  patternConfidence: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  patternPrediction: {
    fontSize: 13,
    color: '#666',
  },
  quickStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  quickStatCard: {
    width: '48%',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginRight: '2%',
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickStatValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
});

