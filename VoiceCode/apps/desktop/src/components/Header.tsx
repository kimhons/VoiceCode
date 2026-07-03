import React from 'react';
import {
  Mic,
  MicOff,
  FileText,
  FolderOpen,
  Save,
  Bot,
  Star,
  Globe,
  Settings,
} from 'lucide-react';

interface HeaderProps {
  isListening: boolean;
  isProcessing: boolean;
  isGlobalDictationActive: boolean;
  showAIPanel: boolean;
  onToggleListening: () => void;
  onToggleAIPanel: () => void;
  onOpenPricing: () => void;
  onOpenGlobalDictation: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isListening,
  isProcessing,
  isGlobalDictationActive,
  showAIPanel,
  onToggleListening,
  onToggleAIPanel,
  onOpenPricing,
  onOpenGlobalDictation,
  onOpenSettings,
}) => {
  return (
    <header className="dragon-header">
      <div className="dragon-logo">
        <div className="dragon-icon">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M16 4L4 10L16 16L28 10L16 4Z" fill="#FF6B35" />
            <path d="M4 16L16 22L28 16" stroke="#FF6B35" strokeWidth="2" />
            <path d="M4 22L16 28L28 22" stroke="#FF6B35" strokeWidth="2" />
          </svg>
        </div>
        <div className="dragon-title">
          <h1>VoiceFlow Pro</h1>
          <p>Professional Dictation & Voice Recognition</p>
        </div>
        {isGlobalDictationActive && (
          <div className="global-dictation-badge">
            <span className="badge-icon">🌍</span>
            <span className="badge-text">Global Dictation Active</span>
            <span className="badge-hotkey">Ctrl+Shift+D to stop</span>
          </div>
        )}
      </div>
      <div className="dragon-toolbar">
        <button
          className={`dragon-btn-primary ${isListening ? 'recording' : ''}`}
          onClick={onToggleListening}
          disabled={isProcessing}
          aria-label={isListening ? 'Stop Dictation' : 'Start Dictation'}
        >
          <span className="btn-icon">
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </span>
          <span className="btn-text">
            {isListening ? 'Stop Dictation' : 'Start Dictation'}
          </span>
        </button>
        <div className="dragon-divider" />
        <button
          className="dragon-btn-tool"
          title="New Document"
          aria-label="New Document"
        >
          <FileText size={18} />
        </button>
        <button className="dragon-btn-tool" title="Open" aria-label="Open">
          <FolderOpen size={18} />
        </button>
        <button className="dragon-btn-tool" title="Save" aria-label="Save">
          <Save size={18} />
        </button>
        <div className="dragon-divider" />
        <button
          className={`dragon-btn-tool ${showAIPanel ? 'active' : ''}`}
          onClick={onToggleAIPanel}
          title="AI Features (Ctrl+Shift+A)"
          aria-label="AI Features"
          aria-pressed={showAIPanel}
        >
          <Bot size={18} />
        </button>
        <button
          className="dragon-btn-tool"
          onClick={onOpenPricing}
          title="Upgrade"
          aria-label="Upgrade to Pro"
        >
          <Star size={18} />
        </button>
        <button
          className="dragon-btn-tool"
          onClick={onOpenGlobalDictation}
          title="Global Dictation Settings"
          aria-label="Global Dictation Settings"
        >
          <Globe size={18} />
        </button>
        <button
          className="dragon-btn-tool"
          onClick={onOpenSettings}
          title="Settings"
          aria-label="Settings"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
};

export default Header;
