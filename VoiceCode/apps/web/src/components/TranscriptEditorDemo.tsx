/**
 * Transcript Editor Demo Component
 * Phase 3.1: Transcript Editor & Export
 * 
 * Demonstrates transcript editing and export functionality
 */

import React, { useState } from 'react';
import { TranscriptEditor } from './TranscriptEditor';
import { useCloudSync } from '../hooks/useCloudSync';
import { Transcript } from '../services/supabase.service';

export const TranscriptEditorDemo: React.FC = () => {
  const {
    transcripts,
    isLoading,
    error,
    updateTranscript,
  } = useCloudSync();

  const [selectedTranscript, setSelectedTranscript] = useState<Transcript | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  // Handle save
  const handleSave = async (content: string) => {
    if (!selectedTranscript) return;

    try {
      const wordCount = content.trim().split(/\s+/).length;
      await updateTranscript(selectedTranscript.id, {
        content,
        word_count: wordCount,
      });
      alert('Transcript saved successfully!');
    } catch (err) {
      console.error('Failed to save:', err);
      alert('Failed to save transcript');
    }
  };

  // Handle edit
  const handleEdit = (transcript: Transcript) => {
    setSelectedTranscript(transcript);
    setShowEditor(true);
  };

  // Handle close
  const handleClose = () => {
    setShowEditor(false);
    setSelectedTranscript(null);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>📝 Transcript Editor & Export Demo</h1>

      {showEditor && selectedTranscript ? (
        <div style={{ 
          border: '1px solid #ddd', 
          borderRadius: '8px', 
          overflow: 'hidden',
          height: '80vh',
          marginTop: '20px'
        }}>
          <TranscriptEditor
            transcript={selectedTranscript}
            onSave={handleSave}
            onClose={handleClose}
            autoSave={true}
            autoSaveInterval={5000}
          />
        </div>
      ) : (
        <>
          {/* Info Section */}
          <div style={{ 
            padding: '15px', 
            marginBottom: '20px', 
            backgroundColor: '#e7f3ff',
            border: '1px solid #b3d9ff',
            borderRadius: '5px'
          }}>
            <h3>✨ Features</h3>
            <ul style={{ marginBottom: 0 }}>
              <li><strong>Rich Text Editing:</strong> Bold, italic, underline, highlight, headings, lists</li>
              <li><strong>Auto-Save:</strong> Automatically saves changes every 5 seconds</li>
              <li><strong>Export Formats:</strong> PDF, DOCX, TXT, SRT, VTT, JSON</li>
              <li><strong>Export Options:</strong> Include/exclude timestamps, speakers, confidence, metadata</li>
              <li><strong>Undo/Redo:</strong> Full history support</li>
              <li><strong>Word Count:</strong> Real-time character and word counting</li>
            </ul>
          </div>

          {/* Export Format Guide */}
          <div style={{ 
            padding: '15px', 
            marginBottom: '20px', 
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '5px'
          }}>
            <h3>📄 Export Formats</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
              <div>
                <strong>PDF:</strong> Professional document format with formatting
              </div>
              <div>
                <strong>DOCX:</strong> Microsoft Word format for further editing
              </div>
              <div>
                <strong>TXT:</strong> Plain text format for universal compatibility
              </div>
              <div>
                <strong>SRT:</strong> Subtitle format for video players
              </div>
              <div>
                <strong>VTT:</strong> WebVTT format for web video
              </div>
              <div>
                <strong>JSON:</strong> Raw data format for developers
              </div>
            </div>
          </div>

          {/* Transcripts List */}
          <div>
            <h3>📄 Your Transcripts ({transcripts.length})</h3>
            {isLoading ? (
              <p>Loading transcripts...</p>
            ) : error ? (
              <p style={{ color: 'red' }}>Error: {error}</p>
            ) : transcripts.length === 0 ? (
              <div style={{ 
                padding: '40px', 
                textAlign: 'center', 
                backgroundColor: '#f8f9fa',
                border: '2px dashed #ddd',
                borderRadius: '8px'
              }}>
                <p style={{ fontSize: '18px', color: '#666' }}>
                  No transcripts yet. Create a transcript to get started!
                </p>
                <p style={{ fontSize: '14px', color: '#999' }}>
                  Go to the Cloud Sync Demo to create your first transcript.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '15px' }}>
                {transcripts.map(transcript => (
                  <div
                    key={transcript.id}
                    style={{
                      padding: '20px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      backgroundColor: '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                      e.currentTarget.style.borderColor = '#007bff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.borderColor = '#ddd';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>
                          {transcript.title}
                        </h4>
                        <p style={{ 
                          margin: '0 0 10px 0', 
                          fontSize: '14px', 
                          color: '#666',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}>
                          {transcript.content}
                        </p>
                        <div style={{ 
                          display: 'flex', 
                          gap: '15px', 
                          fontSize: '12px', 
                          color: '#999',
                          flexWrap: 'wrap'
                        }}>
                          <span>🌍 {transcript.language.toUpperCase()}</span>
                          <span>💼 {transcript.professional_mode}</span>
                          <span>📝 {transcript.word_count} words</span>
                          <span>⏱️ {Math.floor(transcript.duration / 60)}:{(transcript.duration % 60).toString().padStart(2, '0')}</span>
                          <span>✅ {(transcript.confidence * 100).toFixed(1)}%</span>
                          <span>📅 {new Date(transcript.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleEdit(transcript)}
                        style={{
                          padding: '10px 20px',
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          marginLeft: '20px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        ✏️ Edit & Export
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Usage Instructions */}
          <div style={{ 
            padding: '15px', 
            marginTop: '20px', 
            backgroundColor: '#d4edda',
            border: '1px solid #c3e6cb',
            borderRadius: '5px'
          }}>
            <h3>💡 How to Use</h3>
            <ol style={{ marginBottom: 0 }}>
              <li>Click "Edit & Export" on any transcript to open the editor</li>
              <li>Use the toolbar to format your text (bold, italic, highlight, etc.)</li>
              <li>Changes are auto-saved every 5 seconds, or click "Save" manually</li>
              <li>Click "Export" to choose a format and export options</li>
              <li>Select your preferred format (PDF, DOCX, TXT, SRT, VTT, JSON)</li>
              <li>Configure export options (timestamps, speakers, confidence, metadata)</li>
              <li>Click "Export [FORMAT]" to download the file</li>
            </ol>
          </div>

          {/* Keyboard Shortcuts */}
          <div style={{ 
            padding: '15px', 
            marginTop: '20px', 
            backgroundColor: '#f8f9fa',
            border: '1px solid #ddd',
            borderRadius: '5px'
          }}>
            <h3>⌨️ Keyboard Shortcuts</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <div><code>Ctrl+B</code> - Bold</div>
              <div><code>Ctrl+I</code> - Italic</div>
              <div><code>Ctrl+U</code> - Underline</div>
              <div><code>Ctrl+Z</code> - Undo</div>
              <div><code>Ctrl+Y</code> - Redo</div>
              <div><code>Ctrl+S</code> - Save (if enabled)</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TranscriptEditorDemo;

