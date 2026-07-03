import React from 'react';
import { Language } from '../stores/appStore';

interface StatusBarProps {
  isListening: boolean;
  isProcessing: boolean;
  error: string | null;
  confidence: number;
  language: string;
  supportedLanguages: Language[];
  onLanguageChange?: (language: string) => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  isListening,
  isProcessing,
  error,
  confidence,
  language,
  supportedLanguages,
  onLanguageChange,
}) => {
  const getStatusLabel = () => {
    if (error) return 'Error';
    if (isListening) return 'Listening...';
    if (isProcessing) return 'Processing...';
    return 'Ready';
  };

  return (
    <div className="dragon-status-bar" role="status" aria-live="polite">
      <div className="status-left">
        <div
          className={`status-indicator ${isListening ? 'active' : ''} ${error ? 'error' : ''}`}
        >
          <span className="status-dot" aria-hidden="true" />
          <span className="status-label">{getStatusLabel()}</span>
        </div>
        <div
          className="audio-level"
          aria-label={`Audio level: ${isListening ? 'Active' : 'Inactive'}`}
        >
          <span className="audio-label">Audio Level:</span>
          <div className="audio-bars" aria-hidden="true">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className={`audio-bar ${isListening && i < 7 ? 'active' : ''}`}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="status-right">
        <div
          className="accuracy-display"
          aria-label={`Accuracy: ${Math.round(confidence * 100)}%`}
        >
          <span>Accuracy: {Math.round(confidence * 100)}%</span>
        </div>
        <select
          className="dragon-language-select"
          value={language}
          disabled={isListening}
          onChange={(e) => onLanguageChange?.(e.target.value)}
          aria-label="Select language"
        >
          {supportedLanguages.slice(0, 5).map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.flag} {lang.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default StatusBar;
