import React from 'react';
import { Trash2, Copy, Download, Mic } from 'lucide-react';

interface DictationPanelProps {
  transcript: string;
  interimTranscript: string;
  isProcessing: boolean;
  confidence: number;
  onClear: () => void;
  onCopy: () => void;
  onExport: () => void;
}

export const DictationPanel: React.FC<DictationPanelProps> = ({
  transcript,
  interimTranscript,
  isProcessing,
  confidence,
  onClear,
  onCopy,
  onExport,
}) => {
  const wordCount = transcript
    ? transcript.split(/\s+/).filter(Boolean).length
    : 0;
  const charCount = transcript.length;

  return (
    <section className="dragon-dictation-panel" aria-label="Dictation Panel">
      <div className="panel-header">
        <h3>📝 Dictation Window</h3>
        <div className="panel-tools">
          <button
            className="tool-btn"
            title="Clear"
            onClick={onClear}
            disabled={!transcript}
            aria-label="Clear transcript"
          >
            <Trash2 size={16} />
          </button>
          <button
            className="tool-btn"
            title="Copy"
            onClick={onCopy}
            disabled={!transcript}
            aria-label="Copy transcript"
          >
            <Copy size={16} />
          </button>
          <button
            className="tool-btn"
            title="Export"
            onClick={onExport}
            disabled={!transcript}
            aria-label="Export transcript"
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      <div className="dragon-dictation-area">
        <div
          className="dictation-editor"
          role="textbox"
          aria-readonly="true"
          aria-label="Transcribed text"
        >
          {!transcript && !interimTranscript ? (
            <div className="dictation-placeholder">
              <div className="placeholder-icon">
                <Mic size={48} />
              </div>
              <h2>Ready to Dictate</h2>
              <p>Click "Start Dictation" or press the hotkey to begin</p>
              <div className="quick-tips">
                <h4>Quick Tips:</h4>
                <ul>
                  <li>Speak clearly and naturally</li>
                  <li>Say "comma", "period", "new line" for punctuation</li>
                  <li>Use voice commands like "select all", "delete that"</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="dictation-text">
              {transcript}
              {interimTranscript && (
                <span className="interim-text">
                  {transcript ? ' ' : ''}
                  {interimTranscript}
                </span>
              )}
              {isProcessing && (
                <span className="processing-cursor" aria-hidden="true">
                  |
                </span>
              )}
            </div>
          )}
        </div>

        {transcript && (
          <div className="dictation-stats" aria-label="Transcript statistics">
            <div className="stat">
              <span className="stat-label">Words:</span>
              <span className="stat-value">{wordCount}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Characters:</span>
              <span className="stat-value">{charCount}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Accuracy:</span>
              <span className="stat-value">
                {Math.round(confidence * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default DictationPanel;
