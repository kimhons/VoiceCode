/**
 * Modern Dashboard - VoiceCode
 * 3-Column Layout: Templates | Recording Center | Live Transcription
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  Settings,
  Globe,
  Sun,
  Moon,
  Monitor,
  FileText,
  Clock,
  Download,
  Share2,
  Copy,
  Sparkles,
  MessageSquare,
  Tag,
  Volume2,
  Languages,
  Bot,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useProfessionalMode } from '../contexts/ProfessionalModeContext';
import { useAuth } from '../contexts/AuthContext';
import { useAgentContext } from '../contexts/AgentContext';
import { TranscriptionSegment } from '../types';
import VoiceRecording from '../components/VoiceRecording';
import TranscriptionDisplay from '../components/TranscriptionDisplay';
import ProfessionalModeSelector from '../components/ProfessionalModeSelector';
import TemplateSelector from '../components/TemplateSelector';
import AudioVisualization from '../components/AudioVisualization';
import { AgentQuickActionsBar, AgentChatPanel } from '../components/agent';

export const ModernDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { theme, setTheme, colors, spacing } = useTheme();
  const { currentMode, modeConfig, templates, activeTemplate, selectTemplate } =
    useProfessionalMode();
  const { user } = useAuth();
  const { openCommandPalette } = useAgentContext();

  // State management
  const [transcriptionSegments, setTranscriptionSegments] = useState<
    TranscriptionSegment[]
  >([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [showAgentPanel, setShowAgentPanel] = useState(true);
  const [agentPanelWidth, setAgentPanelWidth] = useState(380);

  // Recording handlers
  const handleRecordingStart = useCallback(() => {
    setIsRecording(true);
    setRecordingDuration(0);
  }, []);

  const handleRecordingStop = useCallback(() => {
    setIsRecording(false);
  }, []);

  const handleTranscriptionUpdate = useCallback((segments: any[]) => {
    setTranscriptionSegments(segments);
  }, []);

  // AI Feature handlers
  const handleFormat = () => {
    console.log('Format text');
  };

  const handleSummarize = () => {
    console.log('Summarize text');
  };

  const handleExtract = () => {
    console.log('Extract entities');
  };

  const handleTTS = () => {
    console.log('Text-to-speech');
  };

  const handleTranslate = () => {
    console.log('Translate');
  };

  // Theme toggle
  const cycleTheme = () => {
    const themes: Array<'light' | 'dark' | 'auto'> = ['light', 'dark', 'auto'];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun size={20} />;
      case 'dark':
        return <Moon size={20} />;
      default:
        return <Monitor size={20} />;
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: colors.background,
        color: colors.text,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Navigation Bar */}
      <header
        style={{
          background: colors.surface,
          borderBottom: `1px solid ${colors.border}`,
          padding: `${spacing.md} ${spacing.xl}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.lg }}>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: '700',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
            }}
          >
            <Mic size={28} style={{ color: '#667eea' }} />
            VoiceCode
          </h1>

          <div style={{ minWidth: '250px' }}>
            <ProfessionalModeSelector compact={true} showDescription={false} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            style={{
              padding: `${spacing.sm} ${spacing.md}`,
              borderRadius: '8px',
              border: `1px solid ${colors.border}`,
              background: colors.background,
              color: colors.text,
              cursor: 'pointer',
            }}
          >
            <option value="en-US">🇺🇸 English (US)</option>
            <option value="es-ES">🇪🇸 Spanish</option>
            <option value="fr-FR">🇫🇷 French</option>
            <option value="de-DE">🇩🇪 German</option>
          </select>

          <button
            onClick={cycleTheme}
            style={{
              padding: spacing.sm,
              borderRadius: '8px',
              border: `1px solid ${colors.border}`,
              background: colors.background,
              color: colors.text,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Toggle theme"
          >
            {getThemeIcon()}
          </button>

          <button
            onClick={() => navigate('/chat')}
            style={{
              padding: `${spacing.sm} ${spacing.md}`,
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 500,
              fontSize: '14px',
            }}
            title="AI Chat"
          >
            <MessageSquare size={18} />
            Chat
          </button>

          <button
            onClick={openCommandPalette}
            style={{
              padding: `${spacing.sm} ${spacing.md}`,
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 500,
              fontSize: '14px',
            }}
            title="AI Agent (⌘K)"
          >
            <Bot size={18} />
            AI Agent
            <span
              style={{
                fontSize: '11px',
                opacity: 0.8,
                background: 'rgba(255,255,255,0.2)',
                padding: '2px 6px',
                borderRadius: '4px',
              }}
            >
              ⌘K
            </span>
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              padding: spacing.sm,
              borderRadius: '8px',
              border: `1px solid ${colors.border}`,
              background: colors.background,
              color: colors.text,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Settings"
          >
            <Settings size={20} />
          </button>

          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '600',
              fontSize: '16px',
            }}
          >
            {user?.email?.[0].toUpperCase() || 'U'}
          </div>
        </div>
      </header>

      {/* Main Content - 3 Column Layout */}
      <main
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '280px 1fr 350px',
          gap: 0,
          overflow: 'hidden',
        }}
      >
        {/* Left Sidebar - Templates & Recent */}
        <aside
          style={{
            background: colors.surface,
            borderRight: `1px solid ${colors.border}`,
            padding: spacing.lg,
            overflowY: 'auto',
          }}
        >
          <div style={{ marginBottom: spacing.xl }}>
            <h3
              style={{
                fontSize: '14px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: colors.textSecondary,
                marginBottom: spacing.md,
              }}
            >
              Templates
            </h3>

            <div style={{ marginBottom: spacing.lg }}>
              <TemplateSelector />
            </div>
          </div>

          <div>
            <h3
              style={{
                fontSize: '14px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: colors.textSecondary,
                marginBottom: spacing.md,
              }}
            >
              Recent Recordings
            </h3>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: spacing.sm,
              }}
            >
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    padding: spacing.md,
                    borderRadius: '8px',
                    background: colors.background,
                    border: `1px solid ${colors.border}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#667eea';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = colors.border;
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.sm,
                      marginBottom: '4px',
                    }}
                  >
                    <FileText
                      size={16}
                      style={{ color: colors.textSecondary }}
                    />
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>
                      Recording {i}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.xs,
                      fontSize: '12px',
                      color: colors.textSecondary,
                    }}
                  >
                    <Clock size={12} />
                    <span>
                      {i} hour{i > 1 ? 's' : ''} ago
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Center - Recording Section */}
        <section
          style={{
            padding: spacing.xl,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Professional Mode Info */}
          <div
            style={{
              width: '100%',
              maxWidth: '800px',
              marginBottom: spacing.xl,
              padding: spacing.lg,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
            }}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}
            >
              <span style={{ fontSize: '32px' }}>{modeConfig.icon}</span>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>
                  {modeConfig.displayName}
                </h2>
                <p
                  style={{
                    fontSize: '14px',
                    opacity: 0.9,
                    margin: '4px 0 0 0',
                  }}
                >
                  {modeConfig.description}
                </p>
              </div>
            </div>
          </div>

          {/* Recording Button & Controls */}
          <div
            style={{
              width: '100%',
              maxWidth: '600px',
              marginBottom: spacing.xl,
            }}
          >
            <VoiceRecording
              onRecordingStart={handleRecordingStart}
              onRecordingStop={handleRecordingStop}
              onTranscriptionUpdate={handleTranscriptionUpdate}
              size="large"
              variant="primary"
              showVolume={true}
              showSettings={false}
              enableAIProcessing={true}
            />
          </div>

          {/* Audio Visualization */}
          <div
            style={{
              width: '100%',
              maxWidth: '800px',
              marginBottom: spacing.xl,
            }}
          >
            <AudioVisualization
              isRecording={isRecording}
              showWaveform={true}
              showFrequency={false}
              height={120}
            />
          </div>

          {/* AI Features Panel */}
          <div
            style={{
              width: '100%',
              maxWidth: '800px',
            }}
          >
            <h3
              style={{
                fontSize: '16px',
                fontWeight: '600',
                marginBottom: spacing.md,
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
              }}
            >
              <Sparkles size={20} style={{ color: '#667eea' }} />
              AI Features
            </h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: spacing.md,
              }}
            >
              <button
                onClick={handleFormat}
                disabled={transcriptionSegments.length === 0}
                style={{
                  padding: spacing.md,
                  borderRadius: '8px',
                  border: `1px solid ${colors.border}`,
                  background: colors.surface,
                  color: colors.text,
                  cursor:
                    transcriptionSegments.length === 0
                      ? 'not-allowed'
                      : 'pointer',
                  opacity: transcriptionSegments.length === 0 ? 0.5 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: spacing.xs,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (transcriptionSegments.length > 0) {
                    e.currentTarget.style.borderColor = '#667eea';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = colors.border;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Sparkles size={20} />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>
                  Format
                </span>
              </button>

              <button
                onClick={handleSummarize}
                disabled={transcriptionSegments.length === 0}
                style={{
                  padding: spacing.md,
                  borderRadius: '8px',
                  border: `1px solid ${colors.border}`,
                  background: colors.surface,
                  color: colors.text,
                  cursor:
                    transcriptionSegments.length === 0
                      ? 'not-allowed'
                      : 'pointer',
                  opacity: transcriptionSegments.length === 0 ? 0.5 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: spacing.xs,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (transcriptionSegments.length > 0) {
                    e.currentTarget.style.borderColor = '#667eea';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = colors.border;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <MessageSquare size={20} />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>
                  Summarize
                </span>
              </button>

              <button
                onClick={handleExtract}
                disabled={transcriptionSegments.length === 0}
                style={{
                  padding: spacing.md,
                  borderRadius: '8px',
                  border: `1px solid ${colors.border}`,
                  background: colors.surface,
                  color: colors.text,
                  cursor:
                    transcriptionSegments.length === 0
                      ? 'not-allowed'
                      : 'pointer',
                  opacity: transcriptionSegments.length === 0 ? 0.5 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: spacing.xs,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (transcriptionSegments.length > 0) {
                    e.currentTarget.style.borderColor = '#667eea';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = colors.border;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Tag size={20} />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>
                  Extract
                </span>
              </button>

              <button
                onClick={handleTTS}
                disabled={transcriptionSegments.length === 0}
                style={{
                  padding: spacing.md,
                  borderRadius: '8px',
                  border: `1px solid ${colors.border}`,
                  background: colors.surface,
                  color: colors.text,
                  cursor:
                    transcriptionSegments.length === 0
                      ? 'not-allowed'
                      : 'pointer',
                  opacity: transcriptionSegments.length === 0 ? 0.5 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: spacing.xs,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (transcriptionSegments.length > 0) {
                    e.currentTarget.style.borderColor = '#667eea';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = colors.border;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Volume2 size={20} />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>TTS</span>
              </button>

              <button
                onClick={handleTranslate}
                disabled={transcriptionSegments.length === 0}
                style={{
                  padding: spacing.md,
                  borderRadius: '8px',
                  border: `1px solid ${colors.border}`,
                  background: colors.surface,
                  color: colors.text,
                  cursor:
                    transcriptionSegments.length === 0
                      ? 'not-allowed'
                      : 'pointer',
                  opacity: transcriptionSegments.length === 0 ? 0.5 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: spacing.xs,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (transcriptionSegments.length > 0) {
                    e.currentTarget.style.borderColor = '#667eea';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = colors.border;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Languages size={20} />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>
                  Translate
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* Right Sidebar - Live Transcription */}
        <aside
          style={{
            background: colors.surface,
            borderLeft: `1px solid ${colors.border}`,
            padding: spacing.lg,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: spacing.md,
            }}
          >
            <h3
              style={{
                fontSize: '16px',
                fontWeight: '600',
                margin: 0,
              }}
            >
              Live Transcription
            </h3>

            {isRecording && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                  color: '#ef4444',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#ef4444',
                    animation: 'pulse 2s infinite',
                  }}
                />
                Recording
              </div>
            )}
          </div>

          <div style={{ flex: 1, marginBottom: spacing.md }}>
            <TranscriptionDisplay
              segments={transcriptionSegments}
              showTimestamps={true}
              showConfidence={true}
              showSpeaker={modeConfig.formatting.includeSpeakerLabels}
              editable={true}
              autoScroll={true}
              maxHeight="calc(100vh - 300px)"
            />
          </div>

          {/* Export Actions */}
          {transcriptionSegments.length > 0 && (
            <div
              style={{
                display: 'flex',
                gap: spacing.sm,
                paddingTop: spacing.md,
                borderTop: `1px solid ${colors.border}`,
              }}
            >
              <button
                style={{
                  flex: 1,
                  padding: spacing.sm,
                  borderRadius: '8px',
                  border: `1px solid ${colors.border}`,
                  background: colors.background,
                  color: colors.text,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing.xs,
                  fontSize: '14px',
                }}
                title="Copy to clipboard"
              >
                <Copy size={16} />
                Copy
              </button>

              <button
                style={{
                  flex: 1,
                  padding: spacing.sm,
                  borderRadius: '8px',
                  border: `1px solid ${colors.border}`,
                  background: colors.background,
                  color: colors.text,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing.xs,
                  fontSize: '14px',
                }}
                title="Export"
              >
                <Download size={16} />
                Export
              </button>

              <button
                style={{
                  flex: 1,
                  padding: spacing.sm,
                  borderRadius: '8px',
                  border: `1px solid ${colors.border}`,
                  background: colors.background,
                  color: colors.text,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing.xs,
                  fontSize: '14px',
                }}
                title="Share"
              >
                <Share2 size={16} />
                Share
              </button>
            </div>
          )}
        </aside>
      </main>

      {/* Agent Chat Panel - Split View */}
      {showAgentPanel && (
        <div
          style={{
            width: `${agentPanelWidth}px`,
            minWidth: '320px',
            maxWidth: '500px',
            height: 'calc(100vh - 73px)',
            position: 'fixed',
            right: 0,
            top: '73px',
            zIndex: 50,
          }}
        >
          <AgentChatPanel
            transcriptContext={transcriptionSegments
              .map((s) => s.text)
              .join(' ')}
            isExpanded={showAgentPanel}
            onToggleExpand={() => setShowAgentPanel(!showAgentPanel)}
          />
        </div>
      )}

      {/* Toggle Agent Panel Button (when hidden) */}
      {!showAgentPanel && (
        <button
          onClick={() => setShowAgentPanel(true)}
          style={{
            position: 'fixed',
            right: '16px',
            bottom: '16px',
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            border: 'none',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
            zIndex: 100,
          }}
          title="Open AI Agent"
        >
          <Bot size={24} />
        </button>
      )}
    </div>
  );
};

export default ModernDashboard;
