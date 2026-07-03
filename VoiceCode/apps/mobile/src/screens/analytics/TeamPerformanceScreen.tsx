/**
 * Team Performance Screen
 * Phase 3 Week 11 Day 71-72: Productivity Analytics
 * 
 * Team metrics and collaboration analytics with 5 tabs.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { LineChart, BarChart } from 'react-native-chart-kit';
import {
  fetchTeamMetrics,
  fetchMemberPerformance,
  fetchMeetingEffectiveness,
  fetchCollaborationPatterns,
  fetchBenchmarks,
  fetchTeamTrend,
  clearError,
} from '../../store/slices/teamPerformanceSlice';
import { RootState, AppDispatch } from '../../store';

const { width } = Dimensions.get('window');

export default function TeamPerformanceScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const {
    teamMetrics,
    memberPerformance,
    meetingEffectiveness,
    collaborationPatterns,
    benchmarks,
    teamTrend,
    loading,
    error,
  } = useSelector((state: RootState) => state.teamPerformance);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'members' | 'meetings' | 'collaboration' | 'benchmarks'>('dashboard');
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = () => {
    const teamId = 'team-1';
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    dispatch(fetchTeamMetrics({ teamId, period }));
    dispatch(fetchMemberPerformance({ teamId, period: period === 'day' ? 'week' : period }));
    dispatch(fetchMeetingEffectiveness({ teamId, startDate: weekAgo, endDate: today }));
    dispatch(fetchCollaborationPatterns(teamId));
    dispatch(fetchBenchmarks(teamId));
    dispatch(fetchTeamTrend({ teamId, days: 7 }));
  };

  const getQualityColor = (score: number): string => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    return '#F44336';
  };

  const getImpactColor = (impact: string): string => {
    switch (impact) {
      case 'positive': return '#4CAF50';
      case 'neutral': return '#FF9800';
      case 'negative': return '#F44336';
      default: return '#666';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'above_average': return '#4CAF50';
      case 'average': return '#FF9800';
      case 'below_average': return '#F44336';
      default: return '#666';
    }
  };

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'dashboard' && styles.activeTab]}
        onPress={() => setActiveTab('dashboard')}
      >
        <Ionicons name="speedometer" size={20} color={activeTab === 'dashboard' ? '#2196F3' : '#666'} />
        <Text style={[styles.tabText, activeTab === 'dashboard' && styles.activeTabText]}>Dashboard</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'members' && styles.activeTab]}
        onPress={() => setActiveTab('members')}
      >
        <Ionicons name="people" size={20} color={activeTab === 'members' ? '#2196F3' : '#666'} />
        <Text style={[styles.tabText, activeTab === 'members' && styles.activeTabText]}>Members</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'meetings' && styles.activeTab]}
        onPress={() => setActiveTab('meetings')}
      >
        <Ionicons name="calendar" size={20} color={activeTab === 'meetings' ? '#2196F3' : '#666'} />
        <Text style={[styles.tabText, activeTab === 'meetings' && styles.activeTabText]}>Meetings</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'collaboration' && styles.activeTab]}
        onPress={() => setActiveTab('collaboration')}
      >
        <Ionicons name="git-network" size={20} color={activeTab === 'collaboration' ? '#2196F3' : '#666'} />
        <Text style={[styles.tabText, activeTab === 'collaboration' && styles.activeTabText]}>Collab</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'benchmarks' && styles.activeTab]}
        onPress={() => setActiveTab('benchmarks')}
      >
        <Ionicons name="bar-chart" size={20} color={activeTab === 'benchmarks' ? '#2196F3' : '#666'} />
        <Text style={[styles.tabText, activeTab === 'benchmarks' && styles.activeTabText]}>Benchmarks</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDashboardTab = () => (
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

      {/* Team Metrics Overview */}
      {teamMetrics && (
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Team Productivity Score</Text>
          <View style={styles.scoreGauge}>
            <Text style={[styles.scoreValue, { color: getQualityColor(teamMetrics.average_productivity_score) }]}>
              {teamMetrics.average_productivity_score}
            </Text>
            <Text style={styles.scoreMax}>/100</Text>
          </View>
          <View style={styles.trendContainer}>
            <Ionicons
              name={teamMetrics.trend === 'improving' ? 'trending-up' : teamMetrics.trend === 'declining' ? 'trending-down' : 'remove'}
              size={20}
              color={teamMetrics.trend === 'improving' ? '#4CAF50' : teamMetrics.trend === 'declining' ? '#F44336' : '#FF9800'}
            />
            <Text style={styles.trendText}>{teamMetrics.trend}</Text>
          </View>
        </View>
      )}

      {/* Team Metrics Grid */}
      {teamMetrics && (
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Ionicons name="people" size={32} color="#2196F3" />
            <Text style={styles.metricValue}>{teamMetrics.member_count}</Text>
            <Text style={styles.metricLabel}>Team Members</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="document-text" size={32} color="#4CAF50" />
            <Text style={styles.metricValue}>{teamMetrics.total_transcriptions}</Text>
            <Text style={styles.metricLabel}>Transcriptions</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="time" size={32} color="#FF9800" />
            <Text style={styles.metricValue}>{Math.round(teamMetrics.total_meeting_time / 60)}h</Text>
            <Text style={styles.metricLabel}>Meeting Time</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="checkmark-circle" size={32} color="#9C27B0" />
            <Text style={styles.metricValue}>{teamMetrics.meeting_effectiveness}</Text>
            <Text style={styles.metricLabel}>Effectiveness</Text>
          </View>
        </View>
      )}

      {/* Team Trend Chart */}
      {teamTrend.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Team Performance Trend</Text>
          <LineChart
            data={{
              labels: teamTrend.map(t => new Date(t.date).getDate().toString()),
              datasets: [{
                data: teamTrend.map(t => t.score),
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
    </ScrollView>
  );

  const renderMembersTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Team Leaderboard</Text>
        {memberPerformance.length > 0 ? (
          memberPerformance.map((member) => (
            <View key={member.user_id} style={styles.memberCard}>
              <View style={styles.memberHeader}>
                <View style={styles.memberInfo}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>#{member.rank}</Text>
                  </View>
                  <Image source={{ uri: member.avatar_url }} style={styles.avatar} />
                  <View style={styles.memberDetails}>
                    <Text style={styles.memberName}>{member.user_name}</Text>
                    <View style={styles.ratingContainer}>
                      {[...Array(5)].map((_, i) => (
                        <Ionicons
                          key={i}
                          name={i < member.collaboration_rating ? 'star' : 'star-outline'}
                          size={16}
                          color="#FFD700"
                        />
                      ))}
                    </View>
                  </View>
                </View>
                <View style={[styles.scoreBadge, { backgroundColor: getQualityColor(member.productivity_score) }]}>
                  <Text style={styles.scoreBadgeText}>{member.productivity_score}</Text>
                </View>
              </View>
              <View style={styles.memberStats}>
                <View style={styles.memberStat}>
                  <Text style={styles.memberStatLabel}>Transcriptions</Text>
                  <Text style={styles.memberStatValue}>{member.transcription_count}</Text>
                </View>
                <View style={styles.memberStat}>
                  <Text style={styles.memberStatLabel}>Meeting Time</Text>
                  <Text style={styles.memberStatValue}>{Math.round(member.meeting_time / 60)}h</Text>
                </View>
                <View style={styles.memberStat}>
                  <Text style={styles.memberStatLabel}>Focus Time</Text>
                  <Text style={styles.memberStatValue}>{Math.round(member.focus_time / 60)}h</Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No team members found</Text>
        )}
      </View>
    </ScrollView>
  );

  const renderMeetingsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Meeting Effectiveness</Text>
        {meetingEffectiveness.length > 0 ? (
          meetingEffectiveness.map((meeting) => (
            <View key={meeting.meeting_id} style={styles.meetingCard}>
              <View style={styles.meetingHeader}>
                <Text style={styles.meetingTitle}>{meeting.title}</Text>
                <View style={[styles.effectivenessBadge, { backgroundColor: getQualityColor(meeting.effectiveness_score) }]}>
                  <Text style={styles.effectivenessBadgeText}>{meeting.effectiveness_score}</Text>
                </View>
              </View>
              <View style={styles.meetingDetails}>
                <View style={styles.meetingDetailRow}>
                  <Ionicons name="calendar" size={16} color="#666" />
                  <Text style={styles.meetingDetailText}>{new Date(meeting.date).toLocaleDateString()}</Text>
                </View>
                <View style={styles.meetingDetailRow}>
                  <Ionicons name="time" size={16} color="#666" />
                  <Text style={styles.meetingDetailText}>{meeting.duration} minutes</Text>
                </View>
                <View style={styles.meetingDetailRow}>
                  <Ionicons name="people" size={16} color="#666" />
                  <Text style={styles.meetingDetailText}>{meeting.participant_count} participants</Text>
                </View>
              </View>
              <View style={styles.actionItems}>
                <Text style={styles.actionItemsText}>
                  Action Items: {meeting.action_items_completed}/{meeting.action_items_created} completed
                </Text>
                {meeting.follow_up_required && (
                  <View style={styles.followUpBadge}>
                    <Ionicons name="alert-circle" size={16} color="#FF9800" />
                    <Text style={styles.followUpText}>Follow-up required</Text>
                  </View>
                )}
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No meetings found</Text>
        )}
      </View>
    </ScrollView>
  );

  const renderCollaborationTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Collaboration Patterns</Text>
        {collaborationPatterns.length > 0 ? (
          collaborationPatterns.map((pattern, index) => (
            <View key={index} style={styles.patternCard}>
              <View style={styles.patternHeader}>
                <Text style={styles.patternType}>{pattern.pattern_type.replace(/_/g, ' ').toUpperCase()}</Text>
                <View style={[styles.impactBadge, { backgroundColor: getImpactColor(pattern.impact) }]}>
                  <Text style={styles.impactBadgeText}>{pattern.impact}</Text>
                </View>
              </View>
              <Text style={styles.patternDescription}>{pattern.description}</Text>
              <View style={styles.patternDetails}>
                <View style={styles.patternDetailRow}>
                  <Ionicons name="people" size={16} color="#666" />
                  <Text style={styles.patternDetailText}>
                    {pattern.participants.length === 1 ? pattern.participants[0] : `${pattern.participants.length} participants`}
                  </Text>
                </View>
                <View style={styles.patternDetailRow}>
                  <Ionicons name="repeat" size={16} color="#666" />
                  <Text style={styles.patternDetailText}>Frequency: {pattern.frequency} times</Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No collaboration patterns found</Text>
        )}
      </View>
    </ScrollView>
  );

  const renderBenchmarksTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Benchmarks</Text>
        {benchmarks.length > 0 ? (
          benchmarks.map((benchmark, index) => (
            <View key={index} style={styles.benchmarkCard}>
              <View style={styles.benchmarkHeader}>
                <Text style={styles.benchmarkMetric}>{benchmark.metric}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(benchmark.status) }]}>
                  <Text style={styles.statusBadgeText}>{benchmark.status.replace(/_/g, ' ')}</Text>
                </View>
              </View>
              <View style={styles.benchmarkComparison}>
                <View style={styles.comparisonRow}>
                  <Text style={styles.comparisonLabel}>Your Team:</Text>
                  <Text style={[styles.comparisonValue, { color: getStatusColor(benchmark.status) }]}>
                    {benchmark.team_value}
                  </Text>
                </View>
                <View style={styles.comparisonRow}>
                  <Text style={styles.comparisonLabel}>Industry Avg:</Text>
                  <Text style={styles.comparisonValue}>{benchmark.industry_average}</Text>
                </View>
                <View style={styles.comparisonRow}>
                  <Text style={styles.comparisonLabel}>Top Quartile:</Text>
                  <Text style={styles.comparisonValue}>{benchmark.top_quartile}</Text>
                </View>
              </View>
              <View style={styles.percentileContainer}>
                <Text style={styles.percentileLabel}>Percentile Rank</Text>
                <View style={styles.percentileBar}>
                  <View style={[styles.percentileFill, { width: `${benchmark.percentile}%`, backgroundColor: getStatusColor(benchmark.status) }]} />
                </View>
                <Text style={styles.percentileText}>{benchmark.percentile}th percentile</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No benchmarks available</Text>
        )}
      </View>
    </ScrollView>
  );

  if (loading && !teamMetrics) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading team performance data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Team Performance</Text>
        <TouchableOpacity onPress={loadData}>
          <Ionicons name="refresh" size={24} color="#2196F3" />
        </TouchableOpacity>
      </View>

      {renderTabs()}

      {activeTab === 'dashboard' && renderDashboardTab()}
      {activeTab === 'members' && renderMembersTab()}
      {activeTab === 'meetings' && renderMeetingsTab()}
      {activeTab === 'collaboration' && renderCollaborationTab()}
      {activeTab === 'benchmarks' && renderBenchmarksTab()}
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
  },
  trendText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
    textTransform: 'capitalize',
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
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  memberCard: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 12,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  scoreBadgeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  memberStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  memberStat: {
    alignItems: 'center',
  },
  memberStatLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  memberStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  meetingCard: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 12,
  },
  meetingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  meetingTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 12,
  },
  effectivenessBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  effectivenessBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  meetingDetails: {
    gap: 8,
    marginBottom: 12,
  },
  meetingDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  meetingDetailText: {
    fontSize: 14,
    color: '#666',
  },
  actionItems: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionItemsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  followUpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  followUpText: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '600',
  },
  patternCard: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 12,
  },
  patternHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  patternType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
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
    textTransform: 'capitalize',
  },
  patternDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  patternDetails: {
    gap: 8,
  },
  patternDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  patternDetailText: {
    fontSize: 13,
    color: '#666',
  },
  benchmarkCard: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 12,
  },
  benchmarkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  benchmarkMetric: {
    fontSize: 16,
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
  benchmarkComparison: {
    marginBottom: 12,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  comparisonLabel: {
    fontSize: 14,
    color: '#666',
  },
  comparisonValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  percentileContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  percentileLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  percentileBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  percentileFill: {
    height: '100%',
  },
  percentileText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 24,
  },
});

