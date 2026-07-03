/**
 * AI Features Demo Component
 * Phase 3.3: AI-Powered Features
 * 
 * Demonstrates AI-powered transcript analysis features
 */

import React, { useState } from 'react';
import { AIFeaturesPanel } from './AIFeaturesPanel';
import { Transcript } from '../services/supabase.service';
import { useAIFeatures } from '../hooks/useAIFeatures';

export const AIFeaturesDemo: React.FC = () => {
  // Sample transcript for demo
  const [sampleTranscript] = useState<Transcript>({
    id: 'demo-1',
    user_id: 'demo-user',
    title: 'Product Planning Meeting',
    content: `Welcome everyone to our Q4 product planning meeting. Today we need to discuss our roadmap and prioritize features for the next quarter.

First, let's talk about the new dashboard feature. Sarah, you mentioned that the analytics dashboard is almost ready. That's great news! We should aim to launch it by the end of next month.

John, can you please review the user feedback we received last week? We need to address the performance issues that several customers reported. This should be our top priority.

Also, we need to schedule a meeting with the design team to finalize the UI mockups. Maria, could you coordinate that? Let's try to get that done by Friday.

On the technical side, we're seeing some scalability concerns with the current architecture. Tom, I'd like you to prepare a proposal for migrating to microservices. We'll need to present this to the executive team next month.

The marketing team wants to launch a new campaign in November. We need to make sure our product is ready for the increased traffic. Let's do a load testing session next week.

Overall, I'm very happy with the progress we're making. The team has done an excellent job this quarter. Keep up the great work!

Before we wrap up, does anyone have any questions or concerns? No? Okay, let's get back to work. Thank you everyone!`,
    language: 'en',
    professional_mode: 'business',
    duration: 180,
    word_count: 234,
    confidence: 0.92,
    metadata: {
      device: 'web-demo',
      platform: 'web',
      version: '1.0.0',
      source: 'demo',
      speakers: ['Host', 'Sarah', 'John', 'Maria', 'Tom'],
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_deleted: false,
  });

  const [selectedTranscript, setSelectedTranscript] = useState<Transcript>(sampleTranscript);
  const [autoAnalyze, setAutoAnalyze] = useState(true);
  const [showSmartSearch, setShowSmartSearch] = useState(false);

  // Smart search
  const { searchResults, smartSearch, isSearching } = useAIFeatures();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      await smartSearch(searchQuery, [sampleTranscript]);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🤖 AI-Powered Features Demo</h1>

      {/* Info Section */}
      <div style={{
        padding: '15px',
        marginBottom: '20px',
        backgroundColor: '#e7f3ff',
        border: '1px solid #b3d9ff',
        borderRadius: '5px',
      }}>
        <h3>✨ AI Features</h3>
        <ul style={{ marginBottom: 0 }}>
          <li><strong>📝 Summarization:</strong> Generate short, medium, and long summaries</li>
          <li><strong>🎯 Key Points:</strong> Extract the most important points</li>
          <li><strong>✅ Action Items:</strong> Detect tasks and action items</li>
          <li><strong>😊 Sentiment Analysis:</strong> Analyze emotional tone and sentiment</li>
          <li><strong>🏷️ Topic Detection:</strong> Identify main topics discussed</li>
          <li><strong>🔍 Smart Search:</strong> Semantic search across transcripts</li>
        </ul>
      </div>

      {/* Settings */}
      <div style={{
        padding: '15px',
        marginBottom: '20px',
        backgroundColor: '#fff',
        border: '1px solid #ddd',
        borderRadius: '5px',
      }}>
        <h3>⚙️ Settings</h3>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={autoAnalyze}
              onChange={(e) => setAutoAnalyze(e.target.checked)}
            />
            <span>Auto-analyze on load</span>
          </label>
          <button
            onClick={() => setShowSmartSearch(!showSmartSearch)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6f42c1',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            {showSmartSearch ? 'Hide' : 'Show'} Smart Search
          </button>
        </div>
      </div>

      {/* Smart Search */}
      {showSmartSearch && (
        <div style={{
          padding: '20px',
          marginBottom: '20px',
          backgroundColor: '#fff',
          border: '1px solid #ddd',
          borderRadius: '5px',
        }}>
          <h3>🔍 Smart Search</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search transcripts..."
              style={{
                flex: 1,
                padding: '10px',
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '5px',
              }}
            />
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: isSearching || !searchQuery.trim() ? 'not-allowed' : 'pointer',
                fontSize: '14px',
              }}
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div>
              <h4>Results ({searchResults.length})</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '15px',
                      backgroundColor: '#f8f9fa',
                      border: '1px solid #ddd',
                      borderRadius: '5px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <strong>Transcript: {result.transcriptId}</strong>
                      <span style={{
                        padding: '2px 8px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        borderRadius: '3px',
                        fontSize: '12px',
                      }}>
                        {(result.relevance * 100).toFixed(0)}% match
                      </span>
                    </div>
                    {result.matches.map((match, i) => (
                      <div key={i} style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                        {match.context}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sample Transcript */}
      <div style={{
        padding: '20px',
        marginBottom: '20px',
        backgroundColor: '#fff',
        border: '1px solid #ddd',
        borderRadius: '5px',
      }}>
        <h3>📄 Sample Transcript</h3>
        <div style={{
          padding: '15px',
          backgroundColor: '#f8f9fa',
          borderRadius: '5px',
          maxHeight: '300px',
          overflowY: 'auto',
        }}>
          <h4 style={{ margin: '0 0 10px 0' }}>{selectedTranscript.title}</h4>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>
            {selectedTranscript.word_count} words • {selectedTranscript.duration}s • {(selectedTranscript.confidence * 100).toFixed(0)}% confidence
          </div>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
            {selectedTranscript.content}
          </div>
        </div>
      </div>

      {/* AI Features Panel */}
      <AIFeaturesPanel
        transcript={selectedTranscript}
        autoAnalyze={autoAnalyze}
      />

      {/* How It Works */}
      <div style={{
        padding: '15px',
        marginTop: '20px',
        backgroundColor: '#d4edda',
        border: '1px solid #c3e6cb',
        borderRadius: '5px',
      }}>
        <h3>🔄 How It Works</h3>
        <ol style={{ marginBottom: 0 }}>
          <li><strong>Summarization:</strong> Uses GPT-4o-mini to generate concise summaries at different lengths</li>
          <li><strong>Key Points:</strong> Extracts the most important sentences and ideas</li>
          <li><strong>Action Items:</strong> Identifies tasks, assignments, and deadlines</li>
          <li><strong>Sentiment:</strong> Analyzes emotional tone using NLP techniques</li>
          <li><strong>Topics:</strong> Detects main themes and subjects discussed</li>
          <li><strong>Smart Search:</strong> Semantic search with relevance scoring</li>
        </ol>
      </div>

      {/* Technical Details */}
      <div style={{
        padding: '15px',
        marginTop: '20px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #ddd',
        borderRadius: '5px',
      }}>
        <h3>⚙️ Technical Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <div>
            <strong>AI Model:</strong> GPT-4o-mini
            <br />
            <span style={{ fontSize: '12px', color: '#666' }}>Fast, cost-effective, accurate</span>
          </div>
          <div>
            <strong>API Provider:</strong> AIML API
            <br />
            <span style={{ fontSize: '12px', color: '#666' }}>Unified AI API platform</span>
          </div>
          <div>
            <strong>Processing Time:</strong> 2-5 seconds
            <br />
            <span style={{ fontSize: '12px', color: '#666' }}>Per feature, per transcript</span>
          </div>
          <div>
            <strong>Accuracy:</strong> 85-95%
            <br />
            <span style={{ fontSize: '12px', color: '#666' }}>Depends on transcript quality</span>
          </div>
          <div>
            <strong>Fallback:</strong> Rule-based
            <br />
            <span style={{ fontSize: '12px', color: '#666' }}>Works offline with reduced accuracy</span>
          </div>
          <div>
            <strong>Caching:</strong> Enabled
            <br />
            <span style={{ fontSize: '12px', color: '#666' }}>Results cached for performance</span>
          </div>
        </div>
      </div>

      {/* Use Cases */}
      <div style={{
        padding: '15px',
        marginTop: '20px',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffc107',
        borderRadius: '5px',
      }}>
        <h3>💼 Use Cases</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <div>
            <strong>📊 Business Meetings:</strong>
            <br />
            <span style={{ fontSize: '12px', color: '#666' }}>Extract action items, decisions, and key points</span>
          </div>
          <div>
            <strong>🎓 Lectures & Courses:</strong>
            <br />
            <span style={{ fontSize: '12px', color: '#666' }}>Generate summaries and study notes</span>
          </div>
          <div>
            <strong>🎙️ Interviews:</strong>
            <br />
            <span style={{ fontSize: '12px', color: '#666' }}>Identify topics and sentiment analysis</span>
          </div>
          <div>
            <strong>📞 Customer Calls:</strong>
            <br />
            <span style={{ fontSize: '12px', color: '#666' }}>Detect issues, sentiment, and follow-ups</span>
          </div>
          <div>
            <strong>⚖️ Legal Proceedings:</strong>
            <br />
            <span style={{ fontSize: '12px', color: '#666' }}>Extract key arguments and decisions</span>
          </div>
          <div>
            <strong>🏥 Medical Consultations:</strong>
            <br />
            <span style={{ fontSize: '12px', color: '#666' }}>Identify diagnoses and treatment plans</span>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div style={{
        padding: '15px',
        marginTop: '20px',
        backgroundColor: '#e7f3ff',
        border: '1px solid #b3d9ff',
        borderRadius: '5px',
      }}>
        <h3>💡 Tips</h3>
        <ul style={{ marginBottom: 0 }}>
          <li>Enable auto-analyze to automatically process transcripts</li>
          <li>Longer transcripts provide more context for better analysis</li>
          <li>Professional modes improve vocabulary recognition</li>
          <li>Action items work best with clear task language ("need to", "should", "must")</li>
          <li>Sentiment analysis is more accurate with emotional language</li>
          <li>Smart search uses semantic matching, not just keywords</li>
        </ul>
      </div>
    </div>
  );
};

export default AIFeaturesDemo;

