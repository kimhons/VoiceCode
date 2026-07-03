/**
 * Productivity Dashboard Screen
 * Phase 3 Week 11 Day 71-72: Productivity Analytics
 * 
 * Personal productivity metrics and trends with 5 tabs.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { LineChart, BarChart } from 'react-native-chart-kit';
import {
  fetchProductivityMetrics,
  fetchTimeBreakdown,
  fetchFocusSessions,
  fetchProductivityTrend,
  fetchProductivityGoals,
  createGoal,
  fetchInsights,
  clearError,
} from '../../store/slices/productivitySlice';
import { RootState, AppDispatch } from '../../store';

const { width } = Dimensions.get('window');

export default function ProductivityDashboardScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const {
    metrics,
    timeBreakdown,
    focusSessions,
    trend,
    goals,
    insights,
    loading,
    error,
  } = useSelector((state: RootState) => state.productivity);

  const [activeTab, setActiveTab] = useState<'overview' | 'focus' | 'trends' | 'goals' | 'insights'>('overview');
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [newGoalType, setNewGoalType] = useState<'daily_focus' | 'weekly_transcriptions' | 'meeting_efficiency' | 'productivity_score'>('daily_focus');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalDeadline, setNewGoalDeadline] = useState('');

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = () => {
    const userId = 'current-user';
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    dispatch(fetchProductivityMetrics({ userId, period }));
    dispatch(fetchTimeBreakdown({ userId, date: today }));
    dispatch(fetchFocusSessions({ userId, startDate: weekAgo, endDate: today }));
    dispatch(fetchProductivityTrend({ userId, days: 30 }));
    dispatch(fetchProductivityGoals(userId));
    dispatch(fetchInsights(userId));
  };

  const handleCreateGoal = () => {
    if (!newGoalTarget || !newGoalDeadline) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    dispatch(createGoal({
      user_id: 'current-user',
      goal_type: newGoalType,
      target_value: parseFloat(newGoalTarget),
      deadline: newGoalDeadline,
      status: 'on_track',
    }));

    setNewGoalTarget('');
    setNewGoalDeadline('');
    Alert.alert('Success', 'Goal created successfully');
  };

  const getQualityColor = (score: number): string => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    return '#F44336';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'on_track': return '#4CAF50';
      case 'at_risk': return '#FF9800';
      case 'achieved': return '#2196F3';
      case 'missed': return '#F44336';
      default: return '#666';
    }
  };

  const getImpactColor = (impact: string): string => {
    switch (impact) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#666';
    }
  };

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
        onPress={() => setActiveTab('overview')}
      >
        <Ionicons name="speedometer" size={20} color={activeTab === 'overview' ? '#2196F3' : '#666'} />
        <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>Overview</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'focus' && styles.activeTab]}
        onPress={() => setActiveTab('focus')}
      >
        <Ionicons name="radio-button-on" size={20} color={activeTab === 'focus' ? '#2196F3' : '#666'} />
        <Text style={[styles.tabText, activeTab === 'focus' && styles.activeTabText]}>Focus</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'trends' && styles.activeTab]}
        onPress={() => setActiveTab('trends')}
      >
        <Ionicons name="trending-up" size={20} color={activeTab === 'trends' ? '#2196F3' : '#666'} />
        <Text style={[styles.tabText, activeTab === 'trends' && styles.activeTabText]}>Trends</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'goals' && styles.activeTab]}
        onPress={() => setActiveTab('goals')}
      >
        <Ionicons name="flag" size={20} color={activeTab === 'goals' ? '#2196F3' : '#666'} />
        <Text style={[styles.tabText, activeTab === 'goals' && styles.activeTabText]}>Goals</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'insights' && styles.activeTab]}
        onPress={() => setActiveTab('insights')}
      >
        <Ionicons name="bulb" size={20} color={activeTab === 'insights' ? '#2196F3' : '#666'} />
        <Text style={[styles.tabText, activeTab === 'insights' && styles.activeTabText]}>Insights</Text>
      </TouchableOpacity>
    </View>
  );

  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Period Selector */}
      <View style={styles.periodSelector}>
        <TouchableOpacity
          style={[styles.periodButton, period === 'day' && styles.activePeriodButton]}
          onPress={() => setPeriod('day')}
        >
          <Text style={[styles.periodButtonText, period === 'day' && styles.activePeriodButtonText]}>Day</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodButton, period === 'week' && styles.activePeriodButton]}
          onPress={() => setPeriod('week')}
        >
          <Text style={[styles.periodButtonText, period === 'week' && styles.activePeriodButtonText]}>Week</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodButton, period === 'month' && styles.activePeriodButton]}
          onPress={() => setPeriod('month')}
        >
          <Text style={[styles.periodButtonText, period === 'month' && styles.activePeriodButtonText]}>Month</Text>
        </TouchableOpacity>
      </View>

      {/* Productivity Score Card */}
      {metrics && (
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Productivity Score</Text>
          <View style={styles.scoreGauge}>
            <Text style={[styles.scoreValue, { color: getQualityColor(metrics.productivity_score) }]}>
              {metrics.productivity_score}
            </Text>
            <Text style={styles.scoreMax}>/100</Text>
          </View>
          <View style={styles.trendContainer}>
            <Ionicons
              name={metrics.trend === 'improving' ? 'trending-up' : metrics.trend === 'declining' ? 'trending-down' : 'remove'}
              size={20}
              color={metrics.trend === 'improving' ? '#4CAF50' : metrics.trend === 'declining' ? '#F44336' : '#FF9800'}
            />
            <Text style={styles.trendText}>{metrics.trend}</Text>
          </View>
          <View style={styles.ratingContainer}>
            {[...Array(5)].map((_, i) => (
              <Ionicons
                key={i}
                name={i < metrics.efficiency_rating ? 'star' : 'star-outline'}
                size={24}
                color="#FFD700"
              />
            ))}
          </View>
        </View>
      )}

      {/* Key Metrics Grid */}
      {metrics && (
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Ionicons name="time" size={32} color="#2196F3" />
            <Text style={styles.metricValue}>{Math.round(metrics.total_time / 60)}h</Text>
            <Text style={styles.metricLabel}>Total Time</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="radio-button-on" size={32} color="#4CAF50" />
            <Text style={styles.metricValue}>{Math.round(metrics.focus_time / 60)}h</Text>
            <Text style={styles.metricLabel}>Focus Time</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="people" size={32} color="#FF9800" />
            <Text style={styles.metricValue}>{Math.round(metrics.meeting_time / 60)}h</Text>
            <Text style={styles.metricLabel}>Meetings</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="document-text" size={32} color="#9C27B0" />
            <Text style={styles.metricValue}>{metrics.transcription_count}</Text>
            <Text style={styles.metricLabel}>Transcriptions</Text>
          </View>
        </View>
      )}

      {/* Time Breakdown */}
      {timeBreakdown.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Time Breakdown</Text>
          {timeBreakdown.map((item, index) => (
            <View key={index} style={styles.breakdownItem}>
              <View style={styles.breakdownHeader}>
                <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                <Text style={styles.breakdownCategory}>{item.category}</Text>
                <Text style={styles.breakdownPercentage}>{item.percentage}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${item.percentage}%`, backgroundColor: item.color }]} />
              </View>
              <Text style={styles.breakdownTime}>{Math.round(item.time / 60)}h {item.time % 60}m</Text>
            </View>
          ))}
        </View>
      )}

      {/* Quick Stats */}
      {metrics && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.statsRow}>
            <Text style={styles.statLabel}>Words Transcribed:</Text>
            <Text style={styles.statValue}>{metrics.words_transcribed.toLocaleString()}</Text>
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statLabel}>Efficiency Rating:</Text>
            <Text style={styles.statValue}>{metrics.efficiency_rating}/5</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );

  const renderFocusTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Focus Sessions List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Focus Sessions</Text>
        {focusSessions.length > 0 ? (
          focusSessions.map((session) => (
            <View key={session.id} style={styles.sessionCard}>
              <View style={styles.sessionHeader}>
                <Text style={styles.sessionActivity}>{session.activity_type}</Text>
                <View style={[styles.qualityBadge, { backgroundColor: getQualityColor(session.quality_score) }]}>
                  <Text style={styles.qualityBadgeText}>{session.quality_score}</Text>
                </View>
              </View>
              <View style={styles.sessionDetails}>
                <View style={styles.sessionDetailRow}>
                  <Ionicons name="time" size={16} color="#666" />
                  <Text style={styles.sessionDetailText}>
                    {new Date(session.start_time).toLocaleTimeString()} - {new Date(session.end_time).toLocaleTimeString()}
                  </Text>
                </View>
                <View style={styles.sessionDetailRow}>
                  <Ionicons name="hourglass" size={16} color="#666" />
                  <Text style={styles.sessionDetailText}>{session.duration} minutes</Text>
                </View>
                <View style={styles.sessionDetailRow}>
                  <Ionicons name="alert-circle" size={16} color="#666" />
                  <Text style={styles.sessionDetailText}>{session.interruptions} interruptions</Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No focus sessions recorded</Text>
        )}
      </View>

      {/* Focus Time Chart */}
      {trend.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Focus Time Trend (7 Days)</Text>
          <BarChart
            data={{
              labels: trend.slice(-7).map(t => new Date(t.date).getDate().toString()),
              datasets: [{
                data: trend.slice(-7).map(t => t.focus_time / 60),
              }],
            }}
            width={width - 40}
            height={220}
            yAxisLabel=""
            yAxisSuffix="h"
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
              style: { borderRadius: 16 },
            }}
            style={styles.chart}
          />
        </View>
      )}

      {/* Focus Insights */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Focus Insights</Text>
        <View style={styles.insightCard}>
          <Ionicons name="sunny" size={24} color="#FF9800" />
          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>Peak Focus Hours</Text>
            <Text style={styles.insightText}>You are most focused between 9 AM and 11 AM</Text>
          </View>
        </View>
        <View style={styles.insightCard}>
          <Ionicons name="timer" size={24} color="#2196F3" />
          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>Average Session</Text>
            <Text style={styles.insightText}>Your average focus session is 110 minutes</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderTrendsTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Productivity Trend Chart */}
      {trend.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>30-Day Productivity Trend</Text>
          <LineChart
            data={{
              labels: trend.filter((_, i) => i % 5 === 0).map(t => new Date(t.date).getDate().toString()),
              datasets: [{
                data: trend.map(t => t.score),
              }],
            }}
            width={width - 40}
            height={220}
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
              style: { borderRadius: 16 },
            }}
            bezier
            style={styles.chart}
          />
        </View>
      )}

      {/* Trend Analysis */}
      {metrics && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trend Analysis</Text>
          <View style={styles.trendAnalysisCard}>
            <View style={styles.trendAnalysisRow}>
              <Text style={styles.trendAnalysisLabel}>Current Trend:</Text>
              <View style={styles.trendBadge}>
                <Ionicons
                  name={metrics.trend === 'improving' ? 'trending-up' : metrics.trend === 'declining' ? 'trending-down' : 'remove'}
                  size={16}
                  color="#fff"
                />
                <Text style={styles.trendBadgeText}>{metrics.trend}</Text>
              </View>
            </View>
            <View style={styles.trendAnalysisRow}>
              <Text style={styles.trendAnalysisLabel}>Productivity Score:</Text>
              <Text style={[styles.trendAnalysisValue, { color: getQualityColor(metrics.productivity_score) }]}>
                {metrics.productivity_score}/100
              </Text>
            </View>
            <View style={styles.trendAnalysisRow}>
              <Text style={styles.trendAnalysisLabel}>Focus Time:</Text>
              <Text style={styles.trendAnalysisValue}>{Math.round(metrics.focus_time / 60)}h</Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );

  const renderGoalsTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Active Goals List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Goals</Text>
        {goals.length > 0 ? (
          goals.map((goal) => (
            <View key={goal.id} style={styles.goalCard}>
              <View style={styles.goalHeader}>
                <Text style={styles.goalType}>{goal.goal_type.replace(/_/g, ' ').toUpperCase()}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(goal.status) }]}>
                  <Text style={styles.statusBadgeText}>{goal.status.replace(/_/g, ' ')}</Text>
                </View>
              </View>
              <View style={styles.goalProgress}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${goal.progress}%`, backgroundColor: getStatusColor(goal.status) }]} />
                </View>
                <Text style={styles.progressText}>{goal.progress}%</Text>
              </View>
              <View style={styles.goalDetails}>
                <Text style={styles.goalDetailText}>
                  Current: {goal.current_value} / Target: {goal.target_value}
                </Text>
                <Text style={styles.goalDetailText}>
                  Deadline: {new Date(goal.deadline).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No active goals</Text>
        )}
      </View>

      {/* Create Goal Form */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Create New Goal</Text>
        <View style={styles.formCard}>
          <Text style={styles.formLabel}>Goal Type</Text>
          <View style={styles.goalTypeSelector}>
            <TouchableOpacity
              style={[styles.goalTypeButton, newGoalType === 'daily_focus' && styles.activeGoalTypeButton]}
              onPress={() => setNewGoalType('daily_focus')}
            >
              <Text style={[styles.goalTypeButtonText, newGoalType === 'daily_focus' && styles.activeGoalTypeButtonText]}>
                Daily Focus
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.goalTypeButton, newGoalType === 'weekly_transcriptions' && styles.activeGoalTypeButton]}
              onPress={() => setNewGoalType('weekly_transcriptions')}
            >
              <Text style={[styles.goalTypeButtonText, newGoalType === 'weekly_transcriptions' && styles.activeGoalTypeButtonText]}>
                Transcriptions
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.formLabel}>Target Value</Text>
          <TextInput
            style={styles.input}
            value={newGoalTarget}
            onChangeText={setNewGoalTarget}
            placeholder="Enter target value"
            keyboardType="numeric"
          />

          <Text style={styles.formLabel}>Deadline</Text>
          <TextInput
            style={styles.input}
            value={newGoalDeadline}
            onChangeText={setNewGoalDeadline}
            placeholder="YYYY-MM-DD"
          />

          <TouchableOpacity style={styles.createButton} onPress={handleCreateGoal}>
            <Text style={styles.createButtonText}>Create Goal</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderInsightsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Productivity Insights</Text>
        {insights.length > 0 ? (
          insights.map((insight) => (
            <View key={insight.id} style={styles.insightDetailCard}>
              <View style={styles.insightDetailHeader}>
                <Ionicons name={insight.icon as any} size={32} color="#2196F3" />
                <View style={[styles.impactBadge, { backgroundColor: getImpactColor(insight.impact) }]}>
                  <Text style={styles.impactBadgeText}>{insight.impact}</Text>
                </View>
              </View>
              <Text style={styles.insightDetailTitle}>{insight.title}</Text>
              <Text style={styles.insightDetailDescription}>{insight.description}</Text>
              <View style={styles.recommendationBox}>
                <Ionicons name="bulb-outline" size={20} color="#FF9800" />
                <Text style={styles.recommendationText}>{insight.recommendation}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No insights available</Text>
        )}
      </View>
    </ScrollView>
  );

  if (loading && !metrics) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading productivity data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Productivity Dashboard</Text>
        <TouchableOpacity onPress={loadData}>
          <Ionicons name="refresh" size={24} color="#2196F3" />
        </TouchableOpacity>
      </View>

      {renderTabs()}

      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'focus' && renderFocusTab()}
      {activeTab === 'trends' && renderTrendsTab()}
      {activeTab === 'goals' && renderGoalsTab()}
      {activeTab === 'insights' && renderInsightsTab()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  tabContainer: {
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
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  activeTabText: {
    color: '#2196F3',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  periodSelector: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  activePeriodButton: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#666',
  },
  activePeriodButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  scoreCard: {
    margin: 16,
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  scoreGauge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  scoreValue: {
    fontSize: 64,
    fontWeight: 'bold',
  },
  scoreMax: {
    fontSize: 24,
    color: '#999',
    marginLeft: 4,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  trendText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
    textTransform: 'capitalize',
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 8,
  },
  metricCard: {
    width: (width - 48) / 2,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  section: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  breakdownItem: {
    marginBottom: 16,
  },
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  breakdownCategory: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  breakdownPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
  },
  breakdownTime: {
    fontSize: 12,
    color: '#999',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
  sessionCard: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 12,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionActivity: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  qualityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  qualityBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  sessionDetails: {
    gap: 8,
  },
  sessionDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionDetailText: {
    fontSize: 14,
    color: '#666',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  insightCard: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 12,
  },
  insightContent: {
    flex: 1,
    marginLeft: 12,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  insightText: {
    fontSize: 12,
    color: '#666',
  },
  trendAnalysisCard: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  trendAnalysisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  trendAnalysisLabel: {
    fontSize: 14,
    color: '#666',
  },
  trendAnalysisValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#2196F3',
    borderRadius: 12,
    gap: 4,
  },
  trendBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'capitalize',
  },
  goalCard: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 12,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'capitalize',
  },
  goalProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  goalDetails: {
    gap: 4,
  },
  goalDetailText: {
    fontSize: 12,
    color: '#666',
  },
  formCard: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  goalTypeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  goalTypeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  activeGoalTypeButton: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  goalTypeButtonText: {
    fontSize: 12,
    color: '#666',
  },
  activeGoalTypeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  createButton: {
    paddingVertical: 12,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  insightDetailCard: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 12,
  },
  insightDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  impactBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  impactBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
  },
  insightDetailTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  insightDetailDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  recommendationBox: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    gap: 8,
  },
  recommendationText: {
    flex: 1,
    fontSize: 13,
    color: '#E65100',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 24,
  },
});

