import React from 'react';
import { Sparkles, Copy, Download } from 'lucide-react';
import { ProcessingResult, TextProcessingSettings } from '../stores/appStore';

interface SidebarProps {
  transcript: string;
  response: string;
  confidence: number;
  processingResult: ProcessingResult | null;
  isProcessing: boolean;
  textProcessingSettings: TextProcessingSettings;
  onContextChange: (context: string) => void;
  onToneChange: (tone: string) => void;
  onEnhanceText: () => void;
  onCopyResponse: () => void;
  onExport: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  transcript,
  response,
  confidence,
  processingResult,
  isProcessing,
  textProcessingSettings,
  onContextChange,
  onToneChange,
  onEnhanceText,
  onCopyResponse,
  onExport,
}) => {
  return (
    <aside className="dragon-sidebar" aria-label="AI Enhancement Sidebar">
      <div className="sidebar-section">
        <h3>🤖 AI Enhancement</h3>
        <div className="enhancement-controls">
          <label>
            <span>Context:</span>
            <select
              value={textProcessingSettings.context}
              onChange={(e) => onContextChange(e.target.value)}
              aria-label="Select context"
            >
              <option value="email">📧 Email</option>
              <option value="document">📄 Document</option>
              <option value="medical">🏥 Medical</option>
              <option value="legal">⚖️ Legal</option>
              <option value="technical">💻 Technical</option>
            </select>
          </label>
          <label>
            <span>Tone:</span>
            <select
              value={textProcessingSettings.tone}
              onChange={(e) => onToneChange(e.target.value)}
              aria-label="Select tone"
            >
              <option value="professional">👔 Professional</option>
              <option value="friendly">😊 Friendly</option>
              <option value="formal">🎩 Formal</option>
              <option value="casual">👕 Casual</option>
            </select>
          </label>
          <button
            className="enhance-btn"
            onClick={onEnhanceText}
            disabled={!transcript || isProcessing}
            aria-label="Enhance text with AI"
          >
            <Sparkles size={16} />
            <span>Enhance Text</span>
          </button>
        </div>

        {response && (
          <div className="enhanced-result">
            <h4>Enhanced Version:</h4>
            <div className="enhanced-text" role="textbox" aria-readonly="true">
              {response}
            </div>
            <div className="result-actions">
              <button onClick={onCopyResponse} aria-label="Copy enhanced text">
                <Copy size={14} />
                <span>Copy</span>
              </button>
              <button onClick={onExport} aria-label="Save transcript">
                <Download size={14} />
                <span>Save</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="sidebar-section">
        <h3>🎯 Voice Commands</h3>
        <div className="commands-list" role="list">
          <div className="command-item" role="listitem">
            <span className="command-name">"New Line"</span>
            <span className="command-desc">Start new paragraph</span>
          </div>
          <div className="command-item" role="listitem">
            <span className="command-name">"Period"</span>
            <span className="command-desc">Add period</span>
          </div>
          <div className="command-item" role="listitem">
            <span className="command-name">"Comma"</span>
            <span className="command-desc">Add comma</span>
          </div>
          <div className="command-item" role="listitem">
            <span className="command-name">"Delete That"</span>
            <span className="command-desc">Remove last word</span>
          </div>
          <div className="command-item" role="listitem">
            <span className="command-name">"Select All"</span>
            <span className="command-desc">Select all text</span>
          </div>
        </div>
      </div>

      {processingResult && (
        <div className="sidebar-section">
          <h3>📊 Statistics</h3>
          <div className="stats-list">
            <div className="stat-row">
              <span>Processing Time:</span>
              <span>{processingResult.processing_time_ms}ms</span>
            </div>
            <div className="stat-row">
              <span>Changes Made:</span>
              <span>{processingResult.changes_made.length}</span>
            </div>
            <div className="stat-row">
              <span>Confidence:</span>
              <span>{Math.round(confidence * 100)}%</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
