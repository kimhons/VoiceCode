/**
 * AI Context Engine Screen
 * Phase 3 Week 10 Day 66-67: Real-Time AI Processing
 * 
 * Context understanding, topic detection, sentiment analysis,
 * entity recognition, and relationship mapping.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  analyzeContext,
  detectTopics,
  analyzeSentiment,
  extractEntities,
  mapRelationships,
  detectIntent,
  getContextSummary,
  clearContext,
} from '../../store/slices/contextEngineSlice';

// ============================================================================
// TYPES
// ============================================================================

type TabType = 'topics' | 'sentiment' | 'entities' | 'relationships' | 'summary';

// ============================================================================
// COMPONENT
// ============================================================================

export default function AIContextEngineScreen() {
  const dispatch = useAppDispatch();
  const {
    currentContext,
    detectedTopics,
    sentimentAnalysis,
    extractedEntities,
    relationships,
    intents,
    contextSummary,
    loading,
    error,
  } = useAppSelector((state) => state.contextEngine);

  const [activeTab, setActiveTab] = useState<TabType>('topics');
  const [inputText, setInputText] = useState('');
  const [sessionId, setSessionId] = useState('');

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleAnalyzeContext = async () => {
    if (!inputText.trim()) {
      Alert.alert('Error', 'Please enter some text to analyze');
      return;
    }

    try {
      await dispatch(analyzeContext({ text: inputText, sessionId: sessionId || undefined })).unwrap();
      Alert.alert('Success', 'Context analyzed successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to analyze context');
    }
  };

  const handleGetSummary = async () => {
    if (!sessionId.trim()) {
      Alert.alert('Error', 'Please enter a session ID');
      return;
    }

    try {
      await dispatch(getContextSummary(sessionId)).unwrap();
    } catch (error) {
      Alert.alert('Error', 'Failed to get context summary');
    }
  };

  // ============================================================================
  // RENDER TABS
  // ============================================================================

  const renderTabs = () => {
    const tabs: { key: TabType; label: string }[] = [
      { key: 'topics', label: 'Topics' },
      { key: 'sentiment', label: 'Sentiment' },
      { key: 'entities', label: 'Entities' },
      { key: 'relationships', label: 'Relationships' },
      { key: 'summary', label: 'Summary' },
    ];

    return (
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // ============================================================================
  // RENDER INPUT SECTION
  // ============================================================================

  const renderInputSection = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Analyze Text</Text>
        
        <TextInput
          style={styles.textInput}
          placeholder="Enter text to analyze..."
          value={inputText}
          onChangeText={setInputText}
          multiline
          numberOfLines={4}
        />

        <TextInput
          style={styles.sessionInput}
          placeholder="Session ID (optional)"
          value={sessionId}
          onChangeText={setSessionId}
        />

        <TouchableOpacity
          style={styles.analyzeButton}
          onPress={handleAnalyzeContext}
          disabled={loading}
        >
          <Text style={styles.analyzeButtonText}>
            {loading ? 'Analyzing...' : 'Analyze Context'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ============================================================================
  // RENDER TOPICS TAB
  // ============================================================================

  const renderTopicsTab = () => {
    return (
      <ScrollView style={styles.tabContent}>
        {renderInputSection()}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detected Topics</Text>
          <Text style={styles.sectionDescription}>
            Topics and themes identified in the text
          </Text>

          {detectedTopics.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No topics detected</Text>
              <Text style={styles.emptyStateSubtext}>
                Analyze some text to see detected topics
              </Text>
            </View>
          ) : (
            <View style={styles.topicsList}>
              {detectedTopics.map((topic) => (
                <View key={topic.id} style={styles.topicCard}>
                  <View style={styles.topicHeader}>
                    <Text style={styles.topicName}>{topic.name}</Text>
                    <View style={styles.topicConfidenceBadge}>
                      <Text style={styles.topicConfidenceBadgeText}>
                        {(topic.confidence * 100).toFixed(0)}%
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.topicCategory}>Category: {topic.category}</Text>

                  <View style={styles.topicMetrics}>
                    <View style={styles.topicMetric}>
                      <Text style={styles.topicMetricLabel}>Relevance</Text>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressBarFill, { width: `${topic.relevance * 100}%` }]} />
                      </View>
                      <Text style={styles.topicMetricValue}>{(topic.relevance * 100).toFixed(0)}%</Text>
                    </View>
                    <View style={styles.topicMetric}>
                      <Text style={styles.topicMetricLabel}>Mentions</Text>
                      <Text style={styles.topicMetricValue}>{topic.mention_count}</Text>
                    </View>
                  </View>

                  <View style={styles.topicKeywords}>
                    <Text style={styles.topicKeywordsLabel}>Keywords:</Text>
                    <View style={styles.keywordsList}>
                      {topic.keywords.map((keyword, index) => (
                        <View key={index} style={styles.keywordBadge}>
                          <Text style={styles.keywordText}>{keyword}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  // ============================================================================
  // RENDER SENTIMENT TAB
  // ============================================================================

  const renderSentimentTab = () => {
    return (
      <ScrollView style={styles.tabContent}>
        {renderInputSection()}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sentiment Analysis</Text>
          <Text style={styles.sectionDescription}>
            Emotional tone and sentiment detected in the text
          </Text>

          {!sentimentAnalysis ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No sentiment data</Text>
              <Text style={styles.emptyStateSubtext}>
                Analyze some text to see sentiment analysis
              </Text>
            </View>
          ) : (
            <View>
              {/* Overall Sentiment */}
              <View style={styles.sentimentCard}>
                <Text style={styles.sentimentCardTitle}>Overall Sentiment</Text>
                <View style={[
                  styles.sentimentBadge,
                  sentimentAnalysis.overall === 'positive' ? styles.sentimentPositive :
                  sentimentAnalysis.overall === 'negative' ? styles.sentimentNegative :
                  sentimentAnalysis.overall === 'neutral' ? styles.sentimentNeutral :
                  styles.sentimentMixed
                ]}>
                  <Text style={styles.sentimentBadgeText}>
                    {sentimentAnalysis.overall.toUpperCase()}
                  </Text>
                </View>

                <View style={styles.sentimentScore}>
                  <Text style={styles.sentimentScoreLabel}>Sentiment Score</Text>
                  <View style={styles.sentimentScoreBar}>
                    <View style={[
                      styles.sentimentScoreBarFill,
                      {
                        width: `${((sentimentAnalysis.score + 1) / 2) * 100}%`,
                        backgroundColor: sentimentAnalysis.score > 0 ? '#4CAF50' : sentimentAnalysis.score < 0 ? '#F44336' : '#9E9E9E'
                      }
                    ]} />
                  </View>
                  <View style={styles.sentimentScoreLabels}>
                    <Text style={styles.sentimentScoreLabelText}>Negative</Text>
                    <Text style={styles.sentimentScoreLabelText}>Neutral</Text>
                    <Text style={styles.sentimentScoreLabelText}>Positive</Text>
                  </View>
                  <Text style={styles.sentimentScoreValue}>
                    {sentimentAnalysis.score.toFixed(2)}
                  </Text>
                </View>

                <View style={styles.sentimentConfidence}>
                  <Text style={styles.sentimentConfidenceLabel}>Confidence</Text>
                  <Text style={styles.sentimentConfidenceValue}>
                    {(sentimentAnalysis.confidence * 100).toFixed(0)}%
                  </Text>
                </View>
              </View>

              {/* Emotions */}
              {sentimentAnalysis.emotions.length > 0 && (
                <View style={styles.emotionsCard}>
                  <Text style={styles.emotionsCardTitle}>Detected Emotions</Text>
                  {sentimentAnalysis.emotions.map((emotion, index) => (
                    <View key={index} style={styles.emotionItem}>
                      <View style={styles.emotionHeader}>
                        <Text style={styles.emotionType}>
                          {emotion.type.charAt(0).toUpperCase() + emotion.type.slice(1)}
                        </Text>
                        <Text style={styles.emotionConfidence}>
                          {(emotion.confidence * 100).toFixed(0)}%
                        </Text>
                      </View>
                      <View style={styles.emotionIntensityBar}>
                        <View style={[
                          styles.emotionIntensityBarFill,
                          { width: `${emotion.intensity * 100}%` }
                        ]} />
                      </View>
                      <Text style={styles.emotionIntensityText}>
                        Intensity: {(emotion.intensity * 100).toFixed(0)}%
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Sentiment Timeline */}
              {sentimentAnalysis.timeline.length > 0 && (
                <View style={styles.timelineCard}>
                  <Text style={styles.timelineCardTitle}>Sentiment Timeline</Text>
                  {sentimentAnalysis.timeline.map((point, index) => (
                    <View key={index} style={styles.timelineItem}>
                      <View style={[
                        styles.timelineDot,
                        point.sentiment === 'positive' ? styles.sentimentPositive :
                        point.sentiment === 'negative' ? styles.sentimentNegative :
                        styles.sentimentNeutral
                      ]} />
                      <View style={styles.timelineContent}>
                        <Text style={styles.timelineText}>{point.text_snippet}</Text>
                        <Text style={styles.timelineScore}>
                          Score: {point.score.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  // ============================================================================
  // RENDER ENTITIES TAB
  // ============================================================================

  const renderEntitiesTab = () => {
    return (
      <ScrollView style={styles.tabContent}>
        {renderInputSection()}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Named Entities</Text>
          <Text style={styles.sectionDescription}>
            People, organizations, locations, and other entities identified in the text
          </Text>

          {extractedEntities.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No entities detected</Text>
              <Text style={styles.emptyStateSubtext}>
                Analyze some text to see extracted entities
              </Text>
            </View>
          ) : (
            <View>
              {/* Entity Type Summary */}
              <View style={styles.entitySummary}>
                <Text style={styles.entitySummaryTitle}>Entity Types</Text>
                <View style={styles.entityTypeGrid}>
                  {['person', 'organization', 'location', 'date', 'product', 'event'].map((type) => {
                    const count = extractedEntities.filter(e => e.type === type).length;
                    if (count === 0) return null;
                    return (
                      <View key={type} style={styles.entityTypeCard}>
                        <Text style={styles.entityTypeCount}>{count}</Text>
                        <Text style={styles.entityTypeLabel}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Entity List */}
              <View style={styles.entitiesList}>
                {extractedEntities.map((entity) => (
                  <View key={entity.id} style={styles.entityCard}>
                    <View style={styles.entityHeader}>
                      <Text style={styles.entityText}>{entity.text}</Text>
                      <View style={[styles.entityTypeBadge, styles[`entityType${entity.type}`]]}>
                        <Text style={styles.entityTypeBadgeText}>
                          {entity.type.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.entityDetails}>
                      <View style={styles.entityDetail}>
                        <Text style={styles.entityDetailLabel}>Confidence:</Text>
                        <Text style={styles.entityDetailValue}>
                          {(entity.confidence * 100).toFixed(0)}%
                        </Text>
                      </View>
                      <View style={styles.entityDetail}>
                        <Text style={styles.entityDetailLabel}>Mentions:</Text>
                        <Text style={styles.entityDetailValue}>{entity.mentions}</Text>
                      </View>
                      <View style={styles.entityDetail}>
                        <Text style={styles.entityDetailLabel}>Position:</Text>
                        <Text style={styles.entityDetailValue}>
                          {entity.start_position}-{entity.end_position}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  // ============================================================================
  // RENDER RELATIONSHIPS TAB
  // ============================================================================

  const renderRelationshipsTab = () => {
    return (
      <ScrollView style={styles.tabContent}>
        {renderInputSection()}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Entity Relationships</Text>
          <Text style={styles.sectionDescription}>
            Relationships between entities identified in the text
          </Text>

          {relationships.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No relationships detected</Text>
              <Text style={styles.emptyStateSubtext}>
                Analyze some text to see entity relationships
              </Text>
            </View>
          ) : (
            <View style={styles.relationshipsList}>
              {relationships.map((relationship) => {
                const sourceEntity = extractedEntities.find(e => e.id === relationship.source_entity_id);
                const targetEntity = extractedEntities.find(e => e.id === relationship.target_entity_id);

                return (
                  <View key={relationship.id} style={styles.relationshipCard}>
                    <View style={styles.relationshipDiagram}>
                      <View style={styles.relationshipEntity}>
                        <Text style={styles.relationshipEntityText}>
                          {sourceEntity?.text || 'Unknown'}
                        </Text>
                      </View>
                      <View style={styles.relationshipArrow}>
                        <View style={[styles.relationshipTypeBadge, styles[`relType${relationship.type}`]]}>
                          <Text style={styles.relationshipTypeBadgeText}>
                            {relationship.type.replace(/_/g, ' ').toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.relationshipEntity}>
                        <Text style={styles.relationshipEntityText}>
                          {targetEntity?.text || 'Unknown'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.relationshipDetails}>
                      <Text style={styles.relationshipContext}>{relationship.context}</Text>
                      <View style={styles.relationshipMeta}>
                        <Text style={styles.relationshipConfidence}>
                          Confidence: {(relationship.confidence * 100).toFixed(0)}%
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  // ============================================================================
  // RENDER SUMMARY TAB
  // ============================================================================

  const renderSummaryTab = () => {
    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Context Summary</Text>
          <Text style={styles.sectionDescription}>
            Overall summary of context analysis for a session
          </Text>

          <TextInput
            style={styles.sessionInput}
            placeholder="Enter Session ID"
            value={sessionId}
            onChangeText={setSessionId}
          />

          <TouchableOpacity
            style={styles.analyzeButton}
            onPress={handleGetSummary}
            disabled={loading}
          >
            <Text style={styles.analyzeButtonText}>
              {loading ? 'Loading...' : 'Get Summary'}
            </Text>
          </TouchableOpacity>
        </View>

        {contextSummary && (
          <View>
            {/* Main Topics */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Main Topics</Text>
              <View style={styles.topicCloud}>
                {contextSummary.main_topics.map((topic, index) => (
                  <View key={index} style={styles.topicCloudItem}>
                    <Text style={styles.topicCloudText}>{topic}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Overall Sentiment */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Overall Sentiment</Text>
              <View style={[
                styles.summarysentimentBadge,
                contextSummary.overall_sentiment === 'positive' ? styles.sentimentPositive :
                contextSummary.overall_sentiment === 'negative' ? styles.sentimentNegative :
                styles.sentimentNeutral
              ]}>
                <Text style={styles.sentimentBadgeText}>
                  {contextSummary.overall_sentiment.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Key Metrics */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Key Metrics</Text>
              <View style={styles.metricsGrid}>
                <View style={styles.summaryMetricCard}>
                  <Text style={styles.summaryMetricValue}>{contextSummary.word_count}</Text>
                  <Text style={styles.summaryMetricLabel}>Total Words</Text>
                </View>
                <View style={styles.summaryMetricCard}>
                  <Text style={styles.summaryMetricValue}>{contextSummary.unique_entities}</Text>
                  <Text style={styles.summaryMetricLabel}>Unique Entities</Text>
                </View>
                <View style={styles.summaryMetricCard}>
                  <Text style={styles.summaryMetricValue}>
                    {(contextSummary.topic_diversity * 100).toFixed(0)}%
                  </Text>
                  <Text style={styles.summaryMetricLabel}>Topic Diversity</Text>
                </View>
                <View style={styles.summaryMetricCard}>
                  <Text style={styles.summaryMetricValue}>
                    {(contextSummary.sentiment_stability * 100).toFixed(0)}%
                  </Text>
                  <Text style={styles.summaryMetricLabel}>Sentiment Stability</Text>
                </View>
              </View>
            </View>

            {/* Key Entities */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Key Entities</Text>
              <View style={styles.keyEntitiesList}>
                {contextSummary.key_entities.slice(0, 5).map((entity, index) => (
                  <View key={index} style={styles.keyEntityItem}>
                    <Text style={styles.keyEntityText}>{entity.text}</Text>
                    <View style={[styles.entityTypeBadge, styles[`entityType${entity.type}`]]}>
                      <Text style={styles.entityTypeBadgeText}>
                        {entity.type.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Primary Intents */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Primary Intents</Text>
              <View style={styles.intentsList}>
                {contextSummary.primary_intents.map((intent, index) => (
                  <View key={index} style={styles.intentBadge}>
                    <Text style={styles.intentBadgeText}>
                      {intent.charAt(0).toUpperCase() + intent.slice(1)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <View style={styles.container}>
      {renderTabs()}

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {activeTab === 'topics' && renderTopicsTab()}
      {activeTab === 'sentiment' && renderSentimentTab()}
      {activeTab === 'entities' && renderEntitiesTab()}
      {activeTab === 'relationships' && renderRelationshipsTab()}
      {activeTab === 'summary' && renderSummaryTab()}
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  activeTabText: {
    color: '#2196F3',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#212121',
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  sessionInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#212121',
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  analyzeButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  analyzeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
  topicsList: {
    marginTop: 12,
  },
  topicCard: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  topicName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    flex: 1,
  },
  topicConfidenceBadge: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  topicConfidenceBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  topicCategory: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 12,
  },
  topicMetrics: {
    marginBottom: 12,
  },
  topicMetric: {
    marginBottom: 8,
  },
  topicMetricLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  topicMetricValue: {
    fontSize: 13,
    color: '#212121',
    fontWeight: '500',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  topicKeywords: {
    marginTop: 8,
  },
  topicKeywordsLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
  },
  keywordsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  keywordBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    margin: 4,
  },
  keywordText: {
    fontSize: 12,
    color: '#1976D2',
  },
  sentimentCard: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  sentimentCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  sentimentBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  sentimentBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sentimentPositive: {
    backgroundColor: '#4CAF50',
  },
  sentimentNegative: {
    backgroundColor: '#F44336',
  },
  sentimentNeutral: {
    backgroundColor: '#9E9E9E',
  },
  sentimentMixed: {
    backgroundColor: '#FF9800',
  },
  sentimentScore: {
    marginBottom: 16,
  },
  sentimentScoreLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  sentimentScoreBar: {
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  sentimentScoreBarFill: {
    height: '100%',
  },
  sentimentScoreLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sentimentScoreLabelText: {
    fontSize: 11,
    color: '#666666',
  },
  sentimentScoreValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    textAlign: 'center',
  },
  sentimentConfidence: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sentimentConfidenceLabel: {
    fontSize: 14,
    color: '#666666',
  },
  sentimentConfidenceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
  },
  emotionsCard: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  emotionsCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  emotionItem: {
    marginBottom: 16,
  },
  emotionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  emotionType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
  },
  emotionConfidence: {
    fontSize: 13,
    color: '#666666',
  },
  emotionIntensityBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  emotionIntensityBarFill: {
    height: '100%',
    backgroundColor: '#FF9800',
  },
  emotionIntensityText: {
    fontSize: 12,
    color: '#666666',
  },
  timelineCard: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  timelineCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineText: {
    fontSize: 13,
    color: '#212121',
    marginBottom: 4,
  },
  timelineScore: {
    fontSize: 12,
    color: '#666666',
  },
  entitySummary: {
    marginBottom: 16,
  },
  entitySummaryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  entityTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  entityTypeCard: {
    width: '30%',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    margin: '1.5%',
    alignItems: 'center',
  },
  entityTypeCount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2196F3',
    marginBottom: 4,
  },
  entityTypeLabel: {
    fontSize: 11,
    color: '#666666',
    textAlign: 'center',
  },
  entitiesList: {
    marginTop: 12,
  },
  entityCard: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  entityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  entityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    flex: 1,
  },
  entityTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  entityTypeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  entityTypeperson: {
    backgroundColor: '#2196F3',
  },
  entityTypeorganization: {
    backgroundColor: '#4CAF50',
  },
  entityTypelocation: {
    backgroundColor: '#FF9800',
  },
  entityTypedate: {
    backgroundColor: '#9C27B0',
  },
  entityTypeproduct: {
    backgroundColor: '#00BCD4',
  },
  entityTypeevent: {
    backgroundColor: '#FF5722',
  },
  entityTypeother: {
    backgroundColor: '#9E9E9E',
  },
  entityDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  entityDetail: {
    flexDirection: 'row',
    marginRight: 16,
    marginBottom: 4,
  },
  entityDetailLabel: {
    fontSize: 13,
    color: '#666666',
    marginRight: 4,
  },
  entityDetailValue: {
    fontSize: 13,
    color: '#212121',
    fontWeight: '500',
  },
  relationshipsList: {
    marginTop: 12,
  },
  relationshipCard: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  relationshipDiagram: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  relationshipEntity: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  relationshipEntityText: {
    fontSize: 13,
    color: '#212121',
    fontWeight: '500',
    textAlign: 'center',
  },
  relationshipArrow: {
    paddingHorizontal: 8,
  },
  relationshipTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  relationshipTypeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  relTypeworks_for: {
    backgroundColor: '#2196F3',
  },
  relTypelocated_in: {
    backgroundColor: '#4CAF50',
  },
  relTyperelated_to: {
    backgroundColor: '#FF9800',
  },
  relTypementioned_with: {
    backgroundColor: '#9C27B0',
  },
  relTypepart_of: {
    backgroundColor: '#00BCD4',
  },
  relationshipDetails: {
    marginTop: 8,
  },
  relationshipContext: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 8,
  },
  relationshipMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  relationshipConfidence: {
    fontSize: 12,
    color: '#666666',
  },
  topicCloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  topicCloudItem: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    margin: 4,
  },
  topicCloudText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '500',
  },
  summarysentimentBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  summaryMetricCard: {
    width: '48%',
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    margin: '1%',
    alignItems: 'center',
  },
  summaryMetricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2196F3',
    marginBottom: 4,
  },
  summaryMetricLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  keyEntitiesList: {
    marginTop: 12,
  },
  keyEntityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  keyEntityText: {
    fontSize: 14,
    color: '#212121',
    fontWeight: '500',
    flex: 1,
  },
  intentsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  intentBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    margin: 4,
  },
  intentBadgeText: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '500',
  },
  errorBanner: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FFCDD2',
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
    textAlign: 'center',
  },
});

