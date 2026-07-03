/**
 * AI Quality Control Screen
 * Phase 3 Week 10 Day 70: AI Quality & Safety
 * 
 * AI quality monitoring, bias detection, hallucination prevention, and human review.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { RootState, AppDispatch } from '../../store';
import {
  fetchQualityMetrics,
  fetchBiasReports,
  fetchHallucinations,
  fetchPendingReviews,
  submitReview,
  fetchQualitySettings,
  updateQualitySettings,
} from '../../store/slices/aiQualitySlice';

type TabType = 'dashboard' | 'bias' | 'hallucination' | 'reviews' | 'settings';

const screenWidth = Dimensions.get('window').width;

export default function AIQualityControlScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const {
    qualityMetrics,
    biasReports,
    hallucinations,
    pendingReviews,
    settings,
    loading,
    error,
  } = useSelector((state: RootState) => state.aiQuality);

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewScore, setReviewScore] = useState(80);

  useEffect(() => {
    dispatch(fetchQualityMetrics('current-user'));
    dispatch(fetchBiasReports('current-user'));
    dispatch(fetchHallucinations('current-user'));
    dispatch(fetchPendingReviews('current-user'));
    dispatch(fetchQualitySettings('current-user'));
  }, [dispatch]);

  const handleSubmitReview = () => {
    if (!reviewFeedback.trim()) {
      Alert.alert('Error', 'Please provide feedback');
      return;
    }

    dispatch(submitReview({
      transcript_id: 'transcript-1',
      reviewer_id: 'current-user',
      reviewer_name: 'Current User',
      quality_score: reviewScore,
      accuracy_rating: Math.round(reviewScore / 20),
      issues_found: [],
      feedback: reviewFeedback,
      status: 'approved',
    }));

    setReviewFeedback('');
    setReviewScore(80);
    Alert.alert('Success', 'Review submitted successfully');
  };

  const handleUpdateSettings = (key: string, value: any) => {
    dispatch(updateQualitySettings({
      userId: 'current-user',
      settings: { [key]: value },
    }));
  };

  const getQualityColor = (score: number): string => {
    if (score >= 90) return '#4CAF50';
    if (score >= 75) return '#FF9800';
    return '#F44336';
  };

  const getBiasSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#666';
    }
  };

  const renderDashboardTab = () => (
    <ScrollView style={styles.tabContent}>
      {qualityMetrics && (
        <>
          {/* Overall Quality Score */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overall Quality Score</Text>
            <View style={styles.scoreContainer}>
              <View style={[
                styles.scoreCircle,
                { borderColor: getQualityColor(qualityMetrics.overall_score) }
              ]}>
                <Text style={[
                  styles.scoreValue,
                  { color: getQualityColor(qualityMetrics.overall_score) }
                ]}>
                  {qualityMetrics.overall_score.toFixed(1)}
                </Text>
                <Text style={styles.scoreLabel}>/ 100</Text>
              </View>
              <View style={styles.trendBadge}>
                <Ionicons
                  name={
                    qualityMetrics.trend === 'improving' ? 'trending-up' :
                    qualityMetrics.trend === 'declining' ? 'trending-down' :
                    'remove'
                  }
                  size={20}
                  color={
                    qualityMetrics.trend === 'improving' ? '#4CAF50' :
                    qualityMetrics.trend === 'declining' ? '#F44336' :
                    '#666'
                  }
                />
                <Text style={styles.trendText}>{qualityMetrics.trend}</Text>
              </View>
            </View>
          </View>

          {/* Key Metrics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Metrics</Text>
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
                <Text style={styles.metricValue}>{qualityMetrics.accuracy.toFixed(1)}%</Text>
                <Text style={styles.metricLabel}>Accuracy</Text>
              </View>
              <View style={styles.metricCard}>
                <Ionicons name="sync" size={32} color="#2196F3" />
                <Text style={styles.metricValue}>{qualityMetrics.consistency.toFixed(1)}%</Text>
                <Text style={styles.metricLabel}>Consistency</Text>
              </View>
              <View style={styles.metricCard}>
                <Ionicons name="star" size={32} color="#FF9800" />
                <Text style={styles.metricValue}>{qualityMetrics.relevance.toFixed(1)}%</Text>
                <Text style={styles.metricLabel}>Relevance</Text>
              </View>
              <View style={styles.metricCard}>
                <Ionicons name="shield-checkmark" size={32} color="#9C27B0" />
                <Text style={styles.metricValue}>{qualityMetrics.safety.toFixed(1)}%</Text>
                <Text style={styles.metricLabel}>Safety</Text>
              </View>
            </View>
          </View>

          {/* Quality Trend */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quality Trend (7 Days)</Text>
            <LineChart
              data={{
                labels: qualityMetrics.metrics_by_day.map(d => d.date.substring(5)),
                datasets: [{
                  data: qualityMetrics.metrics_by_day.map(d => d.score),
                }],
              }}
              width={screenWidth - 32}
              height={220}
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
              }}
              bezier
              style={styles.chart}
            />
          </View>

          {/* Recent Issues */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Issues</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{qualityMetrics.total_transcripts}</Text>
                <Text style={styles.statLabel}>Total Transcripts</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#F44336' }]}>
                  {qualityMetrics.flagged_transcripts}
                </Text>
                <Text style={styles.statLabel}>Flagged</Text>
              </View>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );

  const renderBiasTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bias Detection Results</Text>
        {biasReports.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
            <Text style={styles.emptyStateText}>No bias detected!</Text>
            <Text style={styles.emptyStateSubtext}>Your content is bias-free</Text>
          </View>
        ) : (
          biasReports.map((report) => (
            <View key={report.id} style={styles.biasCard}>
              <View style={styles.biasHeader}>
                <View style={[
                  styles.severityBadge,
                  { backgroundColor: getBiasSeverityColor(report.severity) }
                ]}>
                  <Text style={styles.severityText}>{report.severity.toUpperCase()}</Text>
                </View>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeText}>{report.bias_type}</Text>
                </View>
              </View>
              <Text style={styles.biasDescription}>{report.description}</Text>
              <View style={styles.examplesContainer}>
                <Text style={styles.examplesLabel}>Examples:</Text>
                {report.examples.map((example, index) => (
                  <Text key={index} style={styles.exampleText}>• {example}</Text>
                ))}
              </View>
              <View style={styles.mitigationContainer}>
                <Ionicons name="bulb" size={16} color="#FF9800" />
                <Text style={styles.mitigationText}>{report.mitigation}</Text>
              </View>
              {!report.is_resolved && (
                <TouchableOpacity style={styles.resolveButton}>
                  <Text style={styles.resolveButtonText}>Mark as Resolved</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );

  const renderHallucinationTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hallucination Detection</Text>
        {hallucinations.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
            <Text style={styles.emptyStateText}>No hallucinations detected!</Text>
            <Text style={styles.emptyStateSubtext}>All content is verified</Text>
          </View>
        ) : (
          hallucinations.map((hall) => (
            <View key={hall.id} style={styles.hallucinationCard}>
              <View style={styles.hallucinationHeader}>
                <View style={[
                  styles.factCheckBadge,
                  hall.fact_check_result === 'verified' ? styles.factCheckVerified :
                  hall.fact_check_result === 'false' ? styles.factCheckFalse :
                  styles.factCheckUnverified
                ]}>
                  <Text style={styles.factCheckText}>{hall.fact_check_result.toUpperCase()}</Text>
                </View>
                <Text style={styles.confidenceText}>
                  Confidence: {(hall.confidence * 100).toFixed(0)}%
                </Text>
              </View>
              <Text style={styles.hallucinationText}>{hall.text}</Text>
              {hall.correction && (
                <View style={styles.correctionContainer}>
                  <Ionicons name="create" size={16} color="#2196F3" />
                  <Text style={styles.correctionText}>{hall.correction}</Text>
                </View>
              )}
              {hall.sources.length > 0 && (
                <View style={styles.sourcesContainer}>
                  <Text style={styles.sourcesLabel}>Sources:</Text>
                  {hall.sources.map((source, index) => (
                    <Text key={index} style={styles.sourceText}>• {source}</Text>
                  ))}
                </View>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );

  const renderReviewsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Submit Review</Text>
        <View style={styles.reviewForm}>
          <Text style={styles.inputLabel}>Quality Score: {reviewScore}</Text>
          <View style={styles.scoreSlider}>
            <TouchableOpacity onPress={() => setReviewScore(Math.max(0, reviewScore - 5))}>
              <Ionicons name="remove-circle" size={32} color="#F44336" />
            </TouchableOpacity>
            <View style={styles.scoreDisplay}>
              <Text style={styles.scoreDisplayText}>{reviewScore}</Text>
            </View>
            <TouchableOpacity onPress={() => setReviewScore(Math.min(100, reviewScore + 5))}>
              <Ionicons name="add-circle" size={32} color="#4CAF50" />
            </TouchableOpacity>
          </View>

          <Text style={styles.inputLabel}>Feedback:</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Provide detailed feedback..."
            value={reviewFeedback}
            onChangeText={setReviewFeedback}
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmitReview}>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.submitButtonText}>Submit Review</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pending Reviews ({pendingReviews.length})</Text>
        {pendingReviews.map((review) => (
          <View key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Ionicons name="document-text" size={24} color="#2196F3" />
              <Text style={styles.reviewTranscript}>Transcript #{review.transcript_id.substring(0, 8)}</Text>
            </View>
            <Text style={styles.reviewStatus}>Status: {review.status}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderSettingsTab = () => (
    <ScrollView style={styles.tabContent}>
      {settings && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quality Settings</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Auto Review</Text>
                <Text style={styles.settingDescription}>Automatically review transcripts</Text>
              </View>
              <TouchableOpacity
                style={[styles.toggle, settings.auto_review_enabled && styles.toggleActive]}
                onPress={() => handleUpdateSettings('auto_review_enabled', !settings.auto_review_enabled)}
              >
                <View style={[styles.toggleThumb, settings.auto_review_enabled && styles.toggleThumbActive]} />
              </TouchableOpacity>
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Bias Detection</Text>
                <Text style={styles.settingDescription}>Detect potential bias in content</Text>
              </View>
              <TouchableOpacity
                style={[styles.toggle, settings.bias_detection_enabled && styles.toggleActive]}
                onPress={() => handleUpdateSettings('bias_detection_enabled', !settings.bias_detection_enabled)}
              >
                <View style={[styles.toggleThumb, settings.bias_detection_enabled && styles.toggleThumbActive]} />
              </TouchableOpacity>
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Hallucination Detection</Text>
                <Text style={styles.settingDescription}>Detect AI hallucinations</Text>
              </View>
              <TouchableOpacity
                style={[styles.toggle, settings.hallucination_detection_enabled && styles.toggleActive]}
                onPress={() => handleUpdateSettings('hallucination_detection_enabled', !settings.hallucination_detection_enabled)}
              >
                <View style={[styles.toggleThumb, settings.hallucination_detection_enabled && styles.toggleThumbActive]} />
              </TouchableOpacity>
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Fact Checking</Text>
                <Text style={styles.settingDescription}>Verify facts with external sources</Text>
              </View>
              <TouchableOpacity
                style={[styles.toggle, settings.fact_checking_enabled && styles.toggleActive]}
                onPress={() => handleUpdateSettings('fact_checking_enabled', !settings.fact_checking_enabled)}
              >
                <View style={[styles.toggleThumb, settings.fact_checking_enabled && styles.toggleThumbActive]} />
              </TouchableOpacity>
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Human Review Required</Text>
                <Text style={styles.settingDescription}>Require human review for all transcripts</Text>
              </View>
              <TouchableOpacity
                style={[styles.toggle, settings.human_review_required && styles.toggleActive]}
                onPress={() => handleUpdateSettings('human_review_required', !settings.human_review_required)}
              >
                <View style={[styles.toggleThumb, settings.human_review_required && styles.toggleThumbActive]} />
              </TouchableOpacity>
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Notifications</Text>
                <Text style={styles.settingDescription}>Receive quality alerts</Text>
              </View>
              <TouchableOpacity
                style={[styles.toggle, settings.notification_enabled && styles.toggleActive]}
                onPress={() => handleUpdateSettings('notification_enabled', !settings.notification_enabled)}
              >
                <View style={[styles.toggleThumb, settings.notification_enabled && styles.toggleThumbActive]} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quality Threshold</Text>
            <Text style={styles.thresholdValue}>{settings.quality_threshold}%</Text>
            <Text style={styles.thresholdDescription}>
              Transcripts below this threshold will be flagged for review
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>AI Quality Control</Text>
        <Text style={styles.subtitle}>Monitor and improve AI quality</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'dashboard' && styles.tabActive]}
          onPress={() => setActiveTab('dashboard')}
        >
          <Ionicons
            name="speedometer"
            size={20}
            color={activeTab === 'dashboard' ? '#2196F3' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'dashboard' && styles.tabTextActive]}>
            Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'bias' && styles.tabActive]}
          onPress={() => setActiveTab('bias')}
        >
          <Ionicons
            name="warning"
            size={20}
            color={activeTab === 'bias' ? '#2196F3' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'bias' && styles.tabTextActive]}>
            Bias
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'hallucination' && styles.tabActive]}
          onPress={() => setActiveTab('hallucination')}
        >
          <Ionicons
            name="alert-circle"
            size={20}
            color={activeTab === 'hallucination' ? '#2196F3' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'hallucination' && styles.tabTextActive]}>
            Hallucination
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'reviews' && styles.tabActive]}
          onPress={() => setActiveTab('reviews')}
        >
          <Ionicons
            name="people"
            size={20}
            color={activeTab === 'reviews' ? '#2196F3' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'reviews' && styles.tabTextActive]}>
            Reviews
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'settings' && styles.tabActive]}
          onPress={() => setActiveTab('settings')}
        >
          <Ionicons
            name="settings"
            size={20}
            color={activeTab === 'settings' ? '#2196F3' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'settings' && styles.tabTextActive]}>
            Settings
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
          {activeTab === 'dashboard' && renderDashboardTab()}
          {activeTab === 'bias' && renderBiasTab()}
          {activeTab === 'hallucination' && renderHallucinationTab()}
          {activeTab === 'reviews' && renderReviewsTab()}
          {activeTab === 'settings' && renderSettingsTab()}
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
    fontSize: 11,
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
  scoreContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  scoreCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 16,
    color: '#666',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 20,
  },
  trendText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textTransform: 'capitalize',
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
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
  biasCard: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  biasHeader: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  severityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#E3F2FD',
  },
  typeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  biasDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
  },
  examplesContainer: {
    marginBottom: 12,
  },
  examplesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  exampleText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  mitigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9C4',
    padding: 8,
    borderRadius: 4,
    gap: 8,
    marginBottom: 12,
  },
  mitigationText: {
    flex: 1,
    fontSize: 12,
    color: '#F57F17',
  },
  resolveButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  resolveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  hallucinationCard: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  hallucinationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  factCheckBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  factCheckVerified: {
    backgroundColor: '#E8F5E9',
  },
  factCheckFalse: {
    backgroundColor: '#FFEBEE',
  },
  factCheckUnverified: {
    backgroundColor: '#FFF3E0',
  },
  factCheckText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  confidenceText: {
    fontSize: 12,
    color: '#666',
  },
  hallucinationText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
  },
  correctionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 8,
    borderRadius: 4,
    gap: 8,
    marginBottom: 12,
  },
  correctionText: {
    flex: 1,
    fontSize: 12,
    color: '#2196F3',
  },
  sourcesContainer: {
    marginTop: 8,
  },
  sourcesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  sourceText: {
    fontSize: 12,
    color: '#2196F3',
    marginLeft: 8,
  },
  reviewForm: {
    gap: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  scoreSlider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 16,
  },
  scoreDisplay: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreDisplayText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  reviewCard: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  reviewTranscript: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  reviewStatus: {
    fontSize: 12,
    color: '#666',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ccc',
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#4CAF50',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  thresholdValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2196F3',
    textAlign: 'center',
    marginVertical: 16,
  },
  thresholdDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

