/**
 * Live AI Assistant Screen
 * Phase 3 Week 10 Day 66-67: Real-Time AI Processing
 * 
 * Real-time AI transcription with live suggestions, action item detection,
 * and contextual insights during recording.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  startRealTimeSession,
  stopRealTimeSession,
  sendAudioChunk,
  fetchLiveSuggestions,
  fetchContextualInsights,
  fetchRealTimeMetrics,
  applySuggestion,
  confirmActionItem,
  clearSession,
} from '../../store/slices/realTimeAISlice';
import { SessionConfig } from '../../services/realTimeAIService';

// ============================================================================
// TYPES
// ============================================================================

type TabType = 'live' | 'suggestions' | 'actions' | 'insights' | 'settings';

// ============================================================================
// COMPONENT
// ============================================================================

export default function LiveAIAssistantScreen() {
  const dispatch = useAppDispatch();
  const {
    activeSession,
    streamingTranscript,
    liveSuggestions,
    detectedActionItems,
    contextualInsights,
    metrics,
    isStreaming,
    loading,
    error,
  } = useAppSelector((state) => state.realTimeAI);

  const [activeTab, setActiveTab] = useState<TabType>('live');
  const [sessionConfig, setSessionConfig] = useState<SessionConfig>({
    language: 'en',
    model: 'whisper-1',
    enable_suggestions: true,
    enable_action_detection: true,
    enable_context_analysis: true,
    confidence_threshold: 0.7,
    suggestion_frequency: 'medium',
  });

  // Load metrics when session is active
  useEffect(() => {
    if (activeSession && isStreaming) {
      const interval = setInterval(() => {
        dispatch(fetchRealTimeMetrics(activeSession.id));
      }, 5000); // Update every 5 seconds

      return () => clearInterval(interval);
    }
  }, [activeSession, isStreaming, dispatch]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleStartSession = async () => {
    try {
      await dispatch(startRealTimeSession(sessionConfig)).unwrap();
      Alert.alert('Success', 'Real-time AI session started');
    } catch (error) {
      Alert.alert('Error', 'Failed to start session');
    }
  };

  const handleStopSession = async () => {
    try {
      await dispatch(stopRealTimeSession()).unwrap();
      Alert.alert('Success', 'Session ended');
    } catch (error) {
      Alert.alert('Error', 'Failed to stop session');
    }
  };

  const handleApplySuggestion = async (suggestionId: string) => {
    try {
      await dispatch(applySuggestion(suggestionId)).unwrap();
    } catch (error) {
      Alert.alert('Error', 'Failed to apply suggestion');
    }
  };

  const handleConfirmActionItem = async (actionItemId: string) => {
    try {
      await dispatch(confirmActionItem(actionItemId)).unwrap();
    } catch (error) {
      Alert.alert('Error', 'Failed to confirm action item');
    }
  };

  // ============================================================================
  // RENDER TABS
  // ============================================================================

  const renderTabs = () => {
    const tabs: { key: TabType; label: string }[] = [
      { key: 'live', label: 'Live' },
      { key: 'suggestions', label: 'Suggestions' },
      { key: 'actions', label: 'Actions' },
      { key: 'insights', label: 'Insights' },
      { key: 'settings', label: 'Settings' },
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
  // RENDER LIVE TAB
  // ============================================================================

  const renderLiveTab = () => {
    return (
      <ScrollView style={styles.tabContent}>
        {/* Session Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Controls</Text>
          <View style={styles.controlsContainer}>
            {!isStreaming ? (
              <TouchableOpacity
                style={[styles.button, styles.startButton]}
                onPress={handleStartSession}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Starting...' : 'Start Real-Time Session'}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.button, styles.stopButton]}
                onPress={handleStopSession}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Stopping...' : 'Stop Session'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Session Status */}
        {activeSession && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Session Status</Text>
            <View style={styles.statusCard}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Status:</Text>
                <View style={[styles.statusBadge, styles[`status${activeSession.status}`]]}>
                  <Text style={styles.statusBadgeText}>{activeSession.status.toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Duration:</Text>
                <Text style={styles.statusValue}>{Math.floor(activeSession.total_duration / 60)}m {activeSession.total_duration % 60}s</Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Chunks Processed:</Text>
                <Text style={styles.statusValue}>{activeSession.audio_chunks_processed}</Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Accuracy:</Text>
                <Text style={styles.statusValue}>{activeSession.transcription_accuracy.toFixed(1)}%</Text>
              </View>
            </View>
          </View>
        )}

        {/* Real-Time Metrics */}
        {metrics && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Real-Time Metrics</Text>
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{metrics.transcription_latency}ms</Text>
                <Text style={styles.metricLabel}>Transcription Latency</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{metrics.words_per_minute}</Text>
                <Text style={styles.metricLabel}>Words/Min</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{(metrics.confidence_average * 100).toFixed(0)}%</Text>
                <Text style={styles.metricLabel}>Avg Confidence</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{metrics.action_items_detected}</Text>
                <Text style={styles.metricLabel}>Action Items</Text>
              </View>
            </View>
          </View>
        )}

        {/* Streaming Transcript */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Live Transcription</Text>
          {streamingTranscript.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {isStreaming ? 'Listening...' : 'Start a session to see live transcription'}
              </Text>
            </View>
          ) : (
            <View style={styles.transcriptContainer}>
              {streamingTranscript.map((transcript, index) => (
                <View key={index} style={styles.transcriptItem}>
                  <View style={styles.transcriptHeader}>
                    <Text style={styles.transcriptTime}>
                      {Math.floor(transcript.timestamp / 1000)}s
                    </Text>
                    <View style={[
                      styles.confidenceBadge,
                      transcript.confidence > 0.8 ? styles.highConfidence :
                      transcript.confidence > 0.6 ? styles.mediumConfidence :
                      styles.lowConfidence
                    ]}>
                      <Text style={styles.confidenceBadgeText}>
                        {(transcript.confidence * 100).toFixed(0)}%
                      </Text>
                    </View>
                  </View>
                  <Text style={[
                    styles.transcriptText,
                    !transcript.is_final && styles.tentativeText
                  ]}>
                    {transcript.text}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  // ============================================================================
  // RENDER SUGGESTIONS TAB
  // ============================================================================

  const renderSuggestionsTab = () => {
    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Live Suggestions</Text>
          <Text style={styles.sectionDescription}>
            AI-powered suggestions to improve your transcription in real-time
          </Text>

          {liveSuggestions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No suggestions yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Suggestions will appear as you speak
              </Text>
            </View>
          ) : (
            <View style={styles.suggestionsList}>
              {liveSuggestions.map((suggestion) => (
                <View key={suggestion.id} style={styles.suggestionCard}>
                  <View style={styles.suggestionHeader}>
                    <View style={[styles.suggestionTypeBadge, styles[`type${suggestion.type}`]]}>
                      <Text style={styles.suggestionTypeBadgeText}>
                        {suggestion.type.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.suggestionConfidence}>
                      {(suggestion.confidence * 100).toFixed(0)}% confident
                    </Text>
                  </View>

                  <View style={styles.suggestionContent}>
                    <View style={styles.suggestionTextContainer}>
                      <Text style={styles.suggestionLabel}>Original:</Text>
                      <Text style={styles.suggestionOriginal}>{suggestion.original_text}</Text>
                    </View>
                    <View style={styles.suggestionTextContainer}>
                      <Text style={styles.suggestionLabel}>Suggested:</Text>
                      <Text style={styles.suggestionSuggested}>{suggestion.suggested_text}</Text>
                    </View>
                    <Text style={styles.suggestionReason}>{suggestion.reason}</Text>
                  </View>

                  {!suggestion.is_applied && (
                    <TouchableOpacity
                      style={styles.applySuggestionButton}
                      onPress={() => handleApplySuggestion(suggestion.id)}
                    >
                      <Text style={styles.applySuggestionButtonText}>Apply Suggestion</Text>
                    </TouchableOpacity>
                  )}
                  {suggestion.is_applied && (
                    <View style={styles.appliedBadge}>
                      <Text style={styles.appliedBadgeText}>✓ Applied</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  // ============================================================================
  // RENDER ACTIONS TAB
  // ============================================================================

  const renderActionsTab = () => {
    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detected Action Items</Text>
          <Text style={styles.sectionDescription}>
            Action items automatically detected from your conversation
          </Text>

          {detectedActionItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No action items detected</Text>
              <Text style={styles.emptyStateSubtext}>
                Action items will be detected automatically
              </Text>
            </View>
          ) : (
            <View style={styles.actionItemsList}>
              {detectedActionItems.map((item) => (
                <View key={item.id} style={styles.actionItemCard}>
                  <View style={styles.actionItemHeader}>
                    <View style={[styles.priorityBadge, styles[`priority${item.priority}`]]}>
                      <Text style={styles.priorityBadgeText}>
                        {item.priority.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.actionItemTime}>
                      {Math.floor(item.timestamp / 1000)}s
                    </Text>
                  </View>

                  <Text style={styles.actionItemText}>{item.text}</Text>

                  {item.assignee && (
                    <View style={styles.actionItemDetail}>
                      <Text style={styles.actionItemDetailLabel}>Assignee:</Text>
                      <Text style={styles.actionItemDetailValue}>{item.assignee}</Text>
                    </View>
                  )}

                  {item.due_date && (
                    <View style={styles.actionItemDetail}>
                      <Text style={styles.actionItemDetailLabel}>Due Date:</Text>
                      <Text style={styles.actionItemDetailValue}>{item.due_date}</Text>
                    </View>
                  )}

                  <View style={styles.actionItemDetail}>
                    <Text style={styles.actionItemDetailLabel}>Context:</Text>
                    <Text style={styles.actionItemDetailValue}>{item.context}</Text>
                  </View>

                  <View style={styles.actionItemDetail}>
                    <Text style={styles.actionItemDetailLabel}>Confidence:</Text>
                    <Text style={styles.actionItemDetailValue}>
                      {(item.confidence * 100).toFixed(0)}%
                    </Text>
                  </View>

                  {!item.is_confirmed && (
                    <TouchableOpacity
                      style={styles.confirmActionButton}
                      onPress={() => handleConfirmActionItem(item.id)}
                    >
                      <Text style={styles.confirmActionButtonText}>Confirm Action Item</Text>
                    </TouchableOpacity>
                  )}
                  {item.is_confirmed && (
                    <View style={styles.confirmedBadge}>
                      <Text style={styles.confirmedBadgeText}>✓ Confirmed</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  // ============================================================================
  // RENDER INSIGHTS TAB
  // ============================================================================

  const renderInsightsTab = () => {
    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contextual Insights</Text>
          <Text style={styles.sectionDescription}>
            AI-generated insights from your conversation
          </Text>

          {contextualInsights.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No insights yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Insights will be generated as you speak
              </Text>
            </View>
          ) : (
            <View style={styles.insightsList}>
              {contextualInsights.map((insight) => (
                <View key={insight.id} style={styles.insightCard}>
                  <View style={styles.insightHeader}>
                    <View style={[styles.insightTypeBadge, styles[`insightType${insight.type}`]]}>
                      <Text style={styles.insightTypeBadgeText}>
                        {insight.type.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.insightTime}>
                      {Math.floor(insight.timestamp / 1000)}s
                    </Text>
                  </View>

                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <Text style={styles.insightDescription}>{insight.description}</Text>

                  <View style={styles.insightDetail}>
                    <Text style={styles.insightDetailLabel}>Related Text:</Text>
                    <Text style={styles.insightDetailValue}>{insight.related_text}</Text>
                  </View>

                  <View style={styles.insightDetail}>
                    <Text style={styles.insightDetailLabel}>Relevance:</Text>
                    <View style={styles.relevanceBar}>
                      <View style={[styles.relevanceBarFill, { width: `${insight.relevance * 100}%` }]} />
                    </View>
                    <Text style={styles.relevanceText}>{(insight.relevance * 100).toFixed(0)}%</Text>
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
  // RENDER SETTINGS TAB
  // ============================================================================

  const renderSettingsTab = () => {
    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Real-Time AI Settings</Text>

          {/* Language */}
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Language</Text>
            <View style={styles.settingOptions}>
              {['en', 'es', 'fr', 'de', 'zh'].map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={[
                    styles.settingOption,
                    sessionConfig.language === lang && styles.settingOptionActive
                  ]}
                  onPress={() => setSessionConfig({ ...sessionConfig, language: lang })}
                >
                  <Text style={[
                    styles.settingOptionText,
                    sessionConfig.language === lang && styles.settingOptionTextActive
                  ]}>
                    {lang.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Model */}
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>AI Model</Text>
            <View style={styles.settingOptions}>
              {['whisper-1', 'gpt-4-turbo'].map((model) => (
                <TouchableOpacity
                  key={model}
                  style={[
                    styles.settingOption,
                    sessionConfig.model === model && styles.settingOptionActive
                  ]}
                  onPress={() => setSessionConfig({ ...sessionConfig, model })}
                >
                  <Text style={[
                    styles.settingOptionText,
                    sessionConfig.model === model && styles.settingOptionTextActive
                  ]}>
                    {model}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Suggestion Frequency */}
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Suggestion Frequency</Text>
            <View style={styles.settingOptions}>
              {(['low', 'medium', 'high'] as const).map((freq) => (
                <TouchableOpacity
                  key={freq}
                  style={[
                    styles.settingOption,
                    sessionConfig.suggestion_frequency === freq && styles.settingOptionActive
                  ]}
                  onPress={() => setSessionConfig({ ...sessionConfig, suggestion_frequency: freq })}
                >
                  <Text style={[
                    styles.settingOptionText,
                    sessionConfig.suggestion_frequency === freq && styles.settingOptionTextActive
                  ]}>
                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Toggle Settings */}
          <View style={styles.settingItem}>
            <TouchableOpacity
              style={styles.toggleSetting}
              onPress={() => setSessionConfig({
                ...sessionConfig,
                enable_suggestions: !sessionConfig.enable_suggestions
              })}
            >
              <Text style={styles.settingLabel}>Enable Live Suggestions</Text>
              <View style={[
                styles.toggle,
                sessionConfig.enable_suggestions && styles.toggleActive
              ]}>
                <View style={[
                  styles.toggleThumb,
                  sessionConfig.enable_suggestions && styles.toggleThumbActive
                ]} />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.settingItem}>
            <TouchableOpacity
              style={styles.toggleSetting}
              onPress={() => setSessionConfig({
                ...sessionConfig,
                enable_action_detection: !sessionConfig.enable_action_detection
              })}
            >
              <Text style={styles.settingLabel}>Enable Action Detection</Text>
              <View style={[
                styles.toggle,
                sessionConfig.enable_action_detection && styles.toggleActive
              ]}>
                <View style={[
                  styles.toggleThumb,
                  sessionConfig.enable_action_detection && styles.toggleThumbActive
                ]} />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.settingItem}>
            <TouchableOpacity
              style={styles.toggleSetting}
              onPress={() => setSessionConfig({
                ...sessionConfig,
                enable_context_analysis: !sessionConfig.enable_context_analysis
              })}
            >
              <Text style={styles.settingLabel}>Enable Context Analysis</Text>
              <View style={[
                styles.toggle,
                sessionConfig.enable_context_analysis && styles.toggleActive
              ]}>
                <View style={[
                  styles.toggleThumb,
                  sessionConfig.enable_context_analysis && styles.toggleThumbActive
                ]} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
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

      {activeTab === 'live' && renderLiveTab()}
      {activeTab === 'suggestions' && renderSuggestionsTab()}
      {activeTab === 'actions' && renderActionsTab()}
      {activeTab === 'insights' && renderInsightsTab()}
      {activeTab === 'settings' && renderSettingsTab()}
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
  controlsContainer: {
    marginTop: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statusCard: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 14,
    color: '#212121',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statusactive: {
    backgroundColor: '#4CAF50',
  },
  statusconnecting: {
    backgroundColor: '#FF9800',
  },
  statusidle: {
    backgroundColor: '#9E9E9E',
  },
  statusended: {
    backgroundColor: '#757575',
  },
  statuserror: {
    backgroundColor: '#F44336',
  },
  statuspaused: {
    backgroundColor: '#FF9800',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    marginHorizontal: -6,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    margin: '1%',
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2196F3',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  transcriptContainer: {
    marginTop: 12,
  },
  transcriptItem: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  transcriptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transcriptTime: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  confidenceBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  highConfidence: {
    backgroundColor: '#4CAF50',
  },
  mediumConfidence: {
    backgroundColor: '#FF9800',
  },
  lowConfidence: {
    backgroundColor: '#F44336',
  },
  transcriptText: {
    fontSize: 14,
    color: '#212121',
    lineHeight: 20,
  },
  tentativeText: {
    fontStyle: 'italic',
    color: '#666666',
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
  suggestionsList: {
    marginTop: 12,
  },
  suggestionCard: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  suggestionTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  suggestionTypeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  typecorrection: {
    backgroundColor: '#F44336',
  },
  typecompletion: {
    backgroundColor: '#2196F3',
  },
  typeclarification: {
    backgroundColor: '#FF9800',
  },
  typeformatting: {
    backgroundColor: '#9C27B0',
  },
  suggestionConfidence: {
    fontSize: 12,
    color: '#666666',
  },
  suggestionContent: {
    marginBottom: 12,
  },
  suggestionTextContainer: {
    marginBottom: 8,
  },
  suggestionLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
    marginBottom: 4,
  },
  suggestionOriginal: {
    fontSize: 14,
    color: '#F44336',
    textDecorationLine: 'line-through',
  },
  suggestionSuggested: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  suggestionReason: {
    fontSize: 13,
    color: '#666666',
    fontStyle: 'italic',
  },
  applySuggestionButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  applySuggestionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  appliedBadge: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  appliedBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  actionItemsList: {
    marginTop: 12,
  },
  actionItemCard: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  actionItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  prioritylow: {
    backgroundColor: '#4CAF50',
  },
  prioritymedium: {
    backgroundColor: '#FF9800',
  },
  priorityhigh: {
    backgroundColor: '#F44336',
  },
  actionItemTime: {
    fontSize: 12,
    color: '#666666',
  },
  actionItemText: {
    fontSize: 15,
    color: '#212121',
    fontWeight: '500',
    marginBottom: 12,
  },
  actionItemDetail: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  actionItemDetailLabel: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '500',
    marginRight: 8,
    minWidth: 80,
  },
  actionItemDetailValue: {
    fontSize: 13,
    color: '#212121',
    flex: 1,
  },
  confirmActionButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  confirmActionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmedBadge: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  confirmedBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  insightsList: {
    marginTop: 12,
  },
  insightCard: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  insightTypeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  insightTypesummary: {
    backgroundColor: '#2196F3',
  },
  insightTypekey_point: {
    backgroundColor: '#4CAF50',
  },
  insightTypequestion: {
    backgroundColor: '#FF9800',
  },
  insightTypedecision: {
    backgroundColor: '#9C27B0',
  },
  insightTyperisk: {
    backgroundColor: '#F44336',
  },
  insightTime: {
    fontSize: 12,
    color: '#666666',
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
  },
  insightDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
    lineHeight: 20,
  },
  insightDetail: {
    marginBottom: 8,
  },
  insightDetailLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
    marginBottom: 4,
  },
  insightDetailValue: {
    fontSize: 13,
    color: '#212121',
  },
  relevanceBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  relevanceBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  relevanceText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'right',
  },
  settingItem: {
    marginBottom: 24,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 12,
  },
  settingOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  settingOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    margin: 4,
  },
  settingOptionActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  settingOptionText: {
    fontSize: 14,
    color: '#666666',
  },
  settingOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  toggleSetting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0E0E0',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#4CAF50',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  toggleThumbActive: {
    transform: [{ translateX: 22 }],
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

