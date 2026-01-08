/**
 * AI Features Panel Component
 * Phase 3.3: AI-Powered Features
 * 
 * Displays AI-powered analysis of transcripts
 */

import React, { useEffect } from 'react';
import { useAIFeatures } from '../hooks/useAIFeatures';
import { Transcript } from '../services/supabase.service';

export interface AIFeaturesPanelProps {
  transcript: Transcript;
  autoAnalyze?: boolean;
}

export const AIFeaturesPanel: React.FC<AIFeaturesPanelProps> = ({
  transcript,
  autoAnalyze = false,
}) => {
  const {
    summary,
    generateSummary,
    isSummarizing,
    keyPoints,
    extractKeyPoints,
    isExtractingKeyPoints,
    actionItems,
    detectActionItems,
    isDetectingActionItems,
    toggleActionItem,
    sentiment,
    analyzeSentiment,
    isAnalyzingSentiment,
    topics,
    detectTopics,
    isDetectingTopics,
    error,
    clearError,
  } = useAIFeatures();

  // Auto-analyze on mount
  useEffect(() => {
    if (autoAnalyze && transcript) {
      generateSummary(transcript);
      extractKeyPoints(transcript);
      detectActionItems(transcript);
      analyzeSentiment(transcript);
      detectTopics(transcript);
    }
  }, [autoAnalyze, transcript]);

  // Get sentiment color
  const getSentimentColor = (sentiment: string): string => {
    switch (sentiment) {
      case 'positive': return '#28a745';
      case 'negative': return '#dc3545';
      default: return '#6c757d';
    }
  };

  // Get sentiment emoji
  const getSentimentEmoji = (sentiment: string): string => {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😞';
      default: return '😐';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high': return '#dc3545';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Error Message */}
      {error && (
        <div style={{
          padding: '15px',
          marginBottom: '20px',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '5px',
          color: '#721c24',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span><strong>Error:</strong> {error}</span>
          <button
            onClick={clearError}
            style={{
              padding: '5px 10px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px',
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Summary Section */}
      <div style={{
        padding: '20px',
        marginBottom: '20px',
        backgroundColor: '#fff',
        border: '1px solid #ddd',
        borderRadius: '8px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0 }}>📝 Summary</h3>
          <button
            onClick={() => generateSummary(transcript)}
            disabled={isSummarizing}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: isSummarizing ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            {isSummarizing ? 'Generating...' : 'Generate Summary'}
          </button>
        </div>

        {summary && (
          <div>
            <div style={{ marginBottom: '15px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>Short (1-2 sentences)</h4>
              <p style={{ margin: 0, padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
                {summary.short}
              </p>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>Medium (1 paragraph)</h4>
              <p style={{ margin: 0, padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
                {summary.medium}
              </p>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>Long (2-3 paragraphs)</h4>
              <p style={{ margin: 0, padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
                {summary.long}
              </p>
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Compression ratio: {(summary.compressionRatio * 100).toFixed(1)}%
            </div>
          </div>
        )}
      </div>

      {/* Key Points Section */}
      <div style={{
        padding: '20px',
        marginBottom: '20px',
        backgroundColor: '#fff',
        border: '1px solid #ddd',
        borderRadius: '8px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0 }}>🎯 Key Points</h3>
          <button
            onClick={() => extractKeyPoints(transcript)}
            disabled={isExtractingKeyPoints}
            style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: isExtractingKeyPoints ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            {isExtractingKeyPoints ? 'Extracting...' : 'Extract Key Points'}
          </button>
        </div>

        {keyPoints.length > 0 && (
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {keyPoints.map((point, index) => (
              <li key={point.id} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'start', gap: '10px' }}>
                  <span style={{
                    display: 'inline-block',
                    minWidth: '30px',
                    padding: '2px 8px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    borderRadius: '12px',
                    fontSize: '12px',
                    textAlign: 'center',
                  }}>
                    {index + 1}
                  </span>
                  <span>{point.text}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Action Items Section */}
      <div style={{
        padding: '20px',
        marginBottom: '20px',
        backgroundColor: '#fff',
        border: '1px solid #ddd',
        borderRadius: '8px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0 }}>✅ Action Items</h3>
          <button
            onClick={() => detectActionItems(transcript)}
            disabled={isDetectingActionItems}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ffc107',
              color: '#000',
              border: 'none',
              borderRadius: '5px',
              cursor: isDetectingActionItems ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            {isDetectingActionItems ? 'Detecting...' : 'Detect Action Items'}
          </button>
        </div>

        {actionItems.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {actionItems.map(item => (
              <div
                key={item.id}
                style={{
                  padding: '12px',
                  backgroundColor: item.completed ? '#d4edda' : '#f8f9fa',
                  border: `1px solid ${item.completed ? '#c3e6cb' : '#ddd'}`,
                  borderRadius: '5px',
                  display: 'flex',
                  alignItems: 'start',
                  gap: '10px',
                }}
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => toggleActionItem(item.id)}
                  style={{ marginTop: '3px', cursor: 'pointer' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{
                    textDecoration: item.completed ? 'line-through' : 'none',
                    color: item.completed ? '#666' : '#000',
                  }}>
                    {item.text}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '5px', fontSize: '12px' }}>
                    <span style={{
                      padding: '2px 8px',
                      backgroundColor: getPriorityColor(item.priority),
                      color: 'white',
                      borderRadius: '3px',
                    }}>
                      {item.priority}
                    </span>
                    {item.assignee && (
                      <span style={{ color: '#666' }}>👤 {item.assignee}</span>
                    )}
                    {item.dueDate && (
                      <span style={{ color: '#666' }}>📅 {item.dueDate}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>No action items detected</p>
        )}
      </div>

      {/* Sentiment Section */}
      <div style={{
        padding: '20px',
        marginBottom: '20px',
        backgroundColor: '#fff',
        border: '1px solid #ddd',
        borderRadius: '8px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0 }}>😊 Sentiment Analysis</h3>
          <button
            onClick={() => analyzeSentiment(transcript)}
            disabled={isAnalyzingSentiment}
            style={{
              padding: '8px 16px',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: isAnalyzingSentiment ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            {isAnalyzingSentiment ? 'Analyzing...' : 'Analyze Sentiment'}
          </button>
        </div>

        {sentiment && (
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              marginBottom: '20px',
              padding: '15px',
              backgroundColor: '#f8f9fa',
              borderRadius: '5px',
            }}>
              <span style={{ fontSize: '48px' }}>{getSentimentEmoji(sentiment.overall)}</span>
              <div>
                <div style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: getSentimentColor(sentiment.overall),
                  textTransform: 'capitalize',
                }}>
                  {sentiment.overall}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  Score: {sentiment.score.toFixed(2)} • Confidence: {(sentiment.confidence * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            <h4 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Emotion Breakdown</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(sentiment.emotions).map(([emotion, value]) => (
                <div key={emotion}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '14px' }}>
                    <span style={{ textTransform: 'capitalize' }}>{emotion}</span>
                    <span>{(value * 100).toFixed(0)}%</span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#e9ecef',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${value * 100}%`,
                      height: '100%',
                      backgroundColor: '#007bff',
                      transition: 'width 0.3s',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Topics Section */}
      <div style={{
        padding: '20px',
        backgroundColor: '#fff',
        border: '1px solid #ddd',
        borderRadius: '8px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0 }}>🏷️ Topics</h3>
          <button
            onClick={() => detectTopics(transcript)}
            disabled={isDetectingTopics}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6f42c1',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: isDetectingTopics ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            {isDetectingTopics ? 'Detecting...' : 'Detect Topics'}
          </button>
        </div>

        {topics.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {topics.map(topic => (
              <div
                key={topic.id}
                style={{
                  padding: '10px 15px',
                  backgroundColor: '#e7f3ff',
                  border: '1px solid #b3d9ff',
                  borderRadius: '20px',
                  fontSize: '14px',
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>{topic.name}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {(topic.confidence * 100).toFixed(0)}% confidence
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIFeaturesPanel;

