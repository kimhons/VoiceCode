/**
 * AI Insights Dashboard Component
 * Phase 5.6: More AI Features
 * 
 * Comprehensive AI insights visualization
 */

import React, { useState, useEffect } from 'react';
import { useAdvancedAI } from '../hooks/useAdvancedAI';
import './AIInsightsDashboard.css';

interface AIInsightsDashboardProps {
  userId: string;
  transcriptId: string;
  transcriptText: string;
  transcriptTitle: string;
}

export const AIInsightsDashboard: React.FC<AIInsightsDashboardProps> = ({
  userId,
  transcriptId,
  transcriptText,
  transcriptTitle,
}) => {
  const {
    generateMeetingInsights,
    meetingInsights,
    categorizeTranscript,
    categories,
    detectEmotions,
    emotions,
    analyzeSpeakers,
    speakers,
    isLoading,
    error,
    clearError,
  } = useAdvancedAI({ userId });

  const [activeTab, setActiveTab] = useState<'insights' | 'categories' | 'emotions' | 'speakers'>('insights');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Auto-analyze on mount
  useEffect(() => {
    analyzeAll();
  }, [transcriptId]);

  const analyzeAll = async () => {
    setIsAnalyzing(true);
    try {
      await Promise.all([
        generateMeetingInsights(transcriptId, transcriptText),
        categorizeTranscript(transcriptText),
        detectEmotions(transcriptText),
        analyzeSpeakers(transcriptText),
      ]);
    } catch (err) {
      console.error('Failed to analyze:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return '#28a745';
      case 'negative': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getEmotionEmoji = (emotion: string) => {
    switch (emotion) {
      case 'joy': return '😊';
      case 'sadness': return '😢';
      case 'anger': return '😠';
      case 'fear': return '😨';
      case 'surprise': return '😲';
      default: return '😐';
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="ai-insights-dashboard">
      {/* Error Message */}
      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={clearError}>×</button>
        </div>
      )}

      {/* Header */}
      <div className="dashboard-header">
        <h1>🤖 AI Insights</h1>
        <p>{transcriptTitle}</p>
        <button
          className="btn-analyze"
          onClick={analyzeAll}
          disabled={isAnalyzing || isLoading}
        >
          {isAnalyzing ? '🔄 Analyzing...' : '🔍 Re-analyze'}
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={activeTab === 'insights' ? 'active' : ''}
          onClick={() => setActiveTab('insights')}
        >
          📊 Meeting Insights
        </button>
        <button
          className={activeTab === 'categories' ? 'active' : ''}
          onClick={() => setActiveTab('categories')}
        >
          🏷️ Categories
        </button>
        <button
          className={activeTab === 'emotions' ? 'active' : ''}
          onClick={() => setActiveTab('emotions')}
        >
          😊 Emotions
        </button>
        <button
          className={activeTab === 'speakers' ? 'active' : ''}
          onClick={() => setActiveTab('speakers')}
        >
          👥 Speakers
        </button>
      </div>

      {/* Content */}
      <div className="tab-content">
        {/* Meeting Insights */}
        {activeTab === 'insights' && meetingInsights && (
          <div className="insights-panel">
            {/* Overview */}
            <div className="insight-section">
              <h2>📋 Overview</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">⏱️</div>
                  <div className="stat-value">{formatDuration(meetingInsights.duration)}</div>
                  <div className="stat-label">Duration</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-value">{meetingInsights.speakerCount}</div>
                  <div className="stat-label">Speakers</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">😊</div>
                  <div className="stat-value" style={{ color: getSentimentColor(meetingInsights.sentiment.overall) }}>
                    {meetingInsights.sentiment.overall}
                  </div>
                  <div className="stat-label">Sentiment</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🎯</div>
                  <div className="stat-value">{Math.round(meetingInsights.engagement.score * 100)}%</div>
                  <div className="stat-label">Engagement</div>
                </div>
              </div>
            </div>

            {/* Top Topics */}
            <div className="insight-section">
              <h2>🎯 Top Topics</h2>
              <div className="topics-list">
                {meetingInsights.topTopics.map((topic, index) => (
                  <div key={index} className="topic-item">
                    <div className="topic-name">{topic.topic}</div>
                    <div className="topic-bar">
                      <div
                        className="topic-fill"
                        style={{ width: `${topic.relevance * 100}%` }}
                      />
                    </div>
                    <div className="topic-score">{Math.round(topic.relevance * 100)}%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Decisions */}
            <div className="insight-section">
              <h2>✅ Key Decisions</h2>
              <ul className="decisions-list">
                {meetingInsights.keyDecisions.map((decision, index) => (
                  <li key={index}>{decision}</li>
                ))}
              </ul>
            </div>

            {/* Action Items */}
            <div className="insight-section">
              <h2>📝 Action Items</h2>
              <div className="action-items">
                {meetingInsights.actionItems.map((item, index) => (
                  <div key={index} className="action-item">
                    <div className="action-checkbox">☐</div>
                    <div className="action-details">
                      <div className="action-task">{item.task}</div>
                      {item.assignee && (
                        <div className="action-meta">
                          👤 {item.assignee}
                          {item.deadline && ` • 📅 ${item.deadline}`}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Follow-up Suggestions */}
            <div className="insight-section">
              <h2>💡 Follow-up Suggestions</h2>
              <ul className="suggestions-list">
                {meetingInsights.followUpSuggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Categories */}
        {activeTab === 'categories' && (
          <div className="categories-panel">
            <h2>🏷️ Smart Categories</h2>
            <div className="categories-grid">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="category-card"
                  style={{ borderColor: category.color }}
                >
                  <div className="category-header">
                    <span className="category-icon">{category.icon}</span>
                    <span className="category-name">{category.name}</span>
                    <span className="category-confidence">
                      {Math.round(category.confidence * 100)}%
                    </span>
                  </div>
                  <p className="category-description">{category.description}</p>
                  <div className="category-keywords">
                    {category.keywords.map((keyword, index) => (
                      <span key={index} className="keyword-tag" style={{ backgroundColor: category.color + '20' }}>
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Emotions */}
        {activeTab === 'emotions' && emotions && (
          <div className="emotions-panel">
            <h2>😊 Emotion Analysis</h2>
            
            <div className="dominant-emotion">
              <h3>Dominant Emotion</h3>
              <div className="emotion-display">
                <span className="emotion-emoji">{getEmotionEmoji(emotions.dominantEmotion)}</span>
                <span className="emotion-name">{emotions.dominantEmotion}</span>
              </div>
            </div>

            <div className="emotions-timeline">
              <h3>Emotional Arc</h3>
              <div className="timeline">
                {emotions.emotionalArc.map((point, index) => (
                  <div key={index} className="timeline-point">
                    <div className="point-time">{formatDuration(point.time)}</div>
                    <div className="point-emotion">{getEmotionEmoji(point.emotion)}</div>
                    <div className="point-intensity" style={{ height: `${point.intensity * 100}px` }} />
                  </div>
                ))}
              </div>
            </div>

            <div className="emotions-breakdown">
              <h3>Emotion Distribution</h3>
              <div className="emotions-list">
                {emotions.emotions.map((emotion, index) => (
                  <div key={index} className="emotion-item">
                    <span className="emotion-emoji">{getEmotionEmoji(emotion.emotion)}</span>
                    <span className="emotion-label">{emotion.emotion}</span>
                    <div className="emotion-bar">
                      <div
                        className="emotion-fill"
                        style={{ width: `${emotion.confidence * 100}%` }}
                      />
                    </div>
                    <span className="emotion-confidence">{Math.round(emotion.confidence * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Speakers */}
        {activeTab === 'speakers' && (
          <div className="speakers-panel">
            <h2>👥 Speaker Analysis</h2>
            <div className="speakers-grid">
              {speakers.map((speaker) => (
                <div key={speaker.speakerId} className="speaker-card">
                  <div className="speaker-header">
                    <div className="speaker-avatar">👤</div>
                    <div className="speaker-info">
                      <h3>{speaker.name || speaker.speakerId}</h3>
                      <p className="speaker-style">{speaker.speakingStyle}</p>
                    </div>
                  </div>

                  <div className="speaker-stats">
                    <div className="speaker-stat">
                      <span className="stat-label">Talk Time</span>
                      <span className="stat-value">{formatDuration(speaker.talkTime)}</span>
                    </div>
                    <div className="speaker-stat">
                      <span className="stat-label">Words</span>
                      <span className="stat-value">{speaker.wordCount}</span>
                    </div>
                    <div className="speaker-stat">
                      <span className="stat-label">Unique Words</span>
                      <span className="stat-value">{speaker.vocabulary.uniqueWords}</span>
                    </div>
                    <div className="speaker-stat">
                      <span className="stat-label">Avg Sentence</span>
                      <span className="stat-value">{Math.round(speaker.averageSentenceLength)} words</span>
                    </div>
                  </div>

                  <div className="speaker-sentiment">
                    <h4>Sentiment</h4>
                    <div className="sentiment-bars">
                      <div className="sentiment-bar positive" style={{ width: `${speaker.sentiment.positive * 100}%` }}>
                        {Math.round(speaker.sentiment.positive * 100)}%
                      </div>
                      <div className="sentiment-bar neutral" style={{ width: `${speaker.sentiment.neutral * 100}%` }}>
                        {Math.round(speaker.sentiment.neutral * 100)}%
                      </div>
                      <div className="sentiment-bar negative" style={{ width: `${speaker.sentiment.negative * 100}%` }}>
                        {Math.round(speaker.sentiment.negative * 100)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {(isLoading || isAnalyzing) && (
          <div className="loading-overlay">
            <div className="spinner" />
            <p>Analyzing with AI...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsightsDashboard;

