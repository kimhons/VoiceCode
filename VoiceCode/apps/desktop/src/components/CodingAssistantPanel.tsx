import React, { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import './CodingAssistantPanel.css';

interface VoiceCodingResponse {
  success: boolean;
  command_type: string;
  intent: string;
  confidence: number;
  code: string | null;
  explanation: string | null;
  error: string | null;
  detected_app: string;
  detected_language: string | null;
  detected_file: string | null;
  undoable: boolean;
  suggestions: string[];
}

interface CodingAssistantPanelProps {
  /** If provided, auto-submits this voice text on mount or change */
  voiceText?: string;
  /** Called when the panel wants to close */
  onClose?: () => void;
  /** Whether the panel is visible */
  visible?: boolean;
}

export const CodingAssistantPanel: React.FC<CodingAssistantPanelProps> = ({
  voiceText,
  onClose,
  visible = true,
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VoiceCodingResponse | null>(null);
  const [history, setHistory] = useState<VoiceCodingResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

  const executeCommand = useCallback(async (commandText: string) => {
    if (!commandText.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await invoke<VoiceCodingResponse>(
        'execute_voice_coding_command',
        { voiceText: commandText }
      );

      setResult(response);
      setHistory((prev) => [response, ...prev].slice(0, 20));

      if (!response.success && response.error) {
        setError(response.error);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-submit voice text when it changes
  React.useEffect(() => {
    if (voiceText && voiceText.trim()) {
      setInput(voiceText);
      executeCommand(voiceText);
    }
  }, [voiceText, executeCommand]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeCommand(input);
  };

  const handleUndo = async () => {
    try {
      const undoResult = await invoke<VoiceCodingResponse | null>(
        'undo_voice_coding_command'
      );
      if (undoResult) {
        setResult(undoResult);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleCopyCode = async () => {
    if (result?.code) {
      await navigator.clipboard.writeText(result.code);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    executeCommand(suggestion);
  };

  if (!visible) return null;

  return (
    <div className="coding-assistant-panel">
      <div className="cap-header">
        <div className="cap-title">
          <span className="cap-icon">&#60;/&#62;</span>
          <h3>Coding Assistant</h3>
        </div>
        <div className="cap-context">
          {result?.detected_app && (
            <span className="cap-badge">{result.detected_app}</span>
          )}
          {result?.detected_language && (
            <span className="cap-badge cap-badge-lang">
              {result.detected_language}
            </span>
          )}
          {result?.detected_file && (
            <span className="cap-badge cap-badge-file" title={result.detected_file}>
              {result.detected_file.split(/[/\\]/).pop()}
            </span>
          )}
        </div>
        {onClose && (
          <button className="cap-close" onClick={onClose} title="Close">
            x
          </button>
        )}
      </div>

      {/* Command input */}
      <form className="cap-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="cap-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Say or type: "create a function that validates email"'
          disabled={isLoading}
        />
        <button
          type="submit"
          className="cap-submit"
          disabled={isLoading || !input.trim()}
        >
          {isLoading ? '...' : 'Run'}
        </button>
      </form>

      {/* Error display */}
      {error && (
        <div className="cap-error">
          <span className="cap-error-icon">!</span>
          {error}
        </div>
      )}

      {/* Result display */}
      {result && (
        <div className="cap-result">
          <div className="cap-result-header">
            <span className={`cap-status ${result.success ? 'success' : 'fail'}`}>
              {result.success ? 'OK' : 'FAIL'}
            </span>
            <span className="cap-command-type">{result.command_type}</span>
            <span className="cap-confidence">
              {Math.round(result.confidence * 100)}%
            </span>
          </div>

          {/* Explanation */}
          {result.explanation && (
            <div className="cap-explanation">{result.explanation}</div>
          )}

          {/* Code output */}
          {result.code && (
            <div className="cap-code-container">
              <div className="cap-code-header">
                <span>Generated Code</span>
                <div className="cap-code-actions">
                  <button onClick={handleCopyCode} title="Copy code">
                    Copy
                  </button>
                  {result.undoable && (
                    <button onClick={handleUndo} title="Undo this change">
                      Undo
                    </button>
                  )}
                </div>
              </div>
              <pre className="cap-code">
                <code>{result.code}</code>
              </pre>
            </div>
          )}

          {/* Suggestions */}
          {result.suggestions.length > 0 && (
            <div className="cap-suggestions">
              <span className="cap-suggestions-label">Try next:</span>
              <div className="cap-suggestion-chips">
                {result.suggestions.map((s, i) => (
                  <button
                    key={i}
                    className="cap-suggestion-chip"
                    onClick={() => handleSuggestionClick(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* History */}
      {history.length > 1 && (
        <div className="cap-history">
          <h4>Recent Commands</h4>
          <div className="cap-history-list">
            {history.slice(1, 6).map((h, i) => (
              <div
                key={i}
                className="cap-history-item"
                onClick={() => handleSuggestionClick(h.intent)}
              >
                <span className={`cap-status-dot ${h.success ? 'success' : 'fail'}`} />
                <span className="cap-history-intent">{h.intent}</span>
                <span className="cap-history-type">{h.command_type}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
