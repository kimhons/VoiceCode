// VoiceFlow Pro - Home Page (Main App)
import React, { useState, useRef, useEffect } from 'react';
import { Settings, Sun, Moon, Monitor, Globe, Mic } from 'lucide-react';
import {
  VoiceRecording,
  TranscriptionDisplay,
  LanguageSelector,
  AudioVisualization,
  SettingsPanel,
  LoadingState,
  ErrorBoundary,
  useErrorHandler,
  LazyComponent,
  LazyVoiceRecording,
  LazyTranscriptionDisplay,
  LazyLanguageSelector,
  LazyAudioVisualization,
  LazySettingsPanel,
} from '../components';
import { useComponentPreloader } from '../components/componentPreloadUtils';
import { useTheme } from '../contexts/ThemeContext';
import { useProfessionalMode } from '../contexts/ProfessionalModeContext';
import { TranscriptionSegment, AudioVisualizationData } from '../types';
import { useResponsive, useReducedMotion } from '../hooks';
import ProfessionalModeSelector from '../components/ProfessionalModeSelector';
import TemplateSelector from '../components/TemplateSelector';
import SmartNoteEditor from '../components/SmartNoteEditor';

export const HomePage: React.FC = () => {
  const { theme, resolvedTheme, setTheme, platform, colors, spacing, borderRadius, typography } = useTheme();
  const { isMobile, isTablet, isDesktop, width, height, currentBreakpoint, isTouchDevice } = useResponsive();
  const prefersReducedMotion = useReducedMotion();
  const { preloadComponents, isPreloading, preloadProgress } = useComponentPreloader();
  const handleError = useErrorHandler();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [useLazyLoading, setUseLazyLoading] = useState(true);
  const [isComponentsPreloaded, setIsComponentsPreloaded] = useState(false);

  const [recordingState, setRecordingState] = useState({
    isRecording: false,
    isPaused: false,
    duration: 0,
  });

  const [transcriptionSegments, setTranscriptionSegments] = useState<TranscriptionSegment[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [audioData, setAudioData] = useState<AudioVisualizationData>({
    waveform: Array(50).fill(0),
    frequencyData: Array(50).fill(0),
    volume: 0,
    pitch: 0,
  });

  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionProgress, setTranscriptionProgress] = useState(0);

  useEffect(() => {
    if (!isComponentsPreloaded) {
      preloadComponents(['voice-recording', 'transcription-display', 'audio-visualization']);
      setIsComponentsPreloaded(true);
    }
  }, [isComponentsPreloaded, preloadComponents]);

  const handleStartRecording = () => {
    setRecordingState({ ...recordingState, isRecording: true, isPaused: false });
    setIsTranscribing(true);
    setTranscriptionProgress(0);

    const progressInterval = setInterval(() => {
      setTranscriptionProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setIsTranscribing(false);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleStopRecording = () => {
    setRecordingState({ ...recordingState, isRecording: false, isPaused: false });
    setIsTranscribing(false);
  };

  const handlePauseRecording = () => {
    setRecordingState({ ...recordingState, isPaused: !recordingState.isPaused });
  };

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
  };

  const PlatformIndicator = () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing.xs,
        padding: `${spacing.xs} ${spacing.md}`,
        borderRadius: borderRadius.medium,
        backgroundColor: colors.backgroundSecondary,
        border: `1px solid ${colors.border}`,
        fontSize: typography.fontSize.sm,
        color: colors.textSecondary,
      }}
    >
      <Globe size={16} />
      <span>{platform}</span>
    </div>
  );

  const ThemeToggle = () => (
    <div
      style={{
        display: 'flex',
        gap: spacing.xs,
        padding: spacing.xs,
        borderRadius: borderRadius.medium,
        backgroundColor: colors.backgroundSecondary,
        border: `1px solid ${colors.border}`,
      }}
    >
      {[
        { value: 'light', icon: Sun, label: 'Light' },
        { value: 'dark', icon: Moon, label: 'Dark' },
        { value: 'auto', icon: Monitor, label: 'Auto' },
      ].map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value as 'light' | 'dark' | 'auto')}
          aria-label={`${label} theme`}
          style={{
            padding: spacing.sm,
            borderRadius: borderRadius.small,
            backgroundColor: theme === value ? colors.primary : 'transparent',
            color: theme === value ? '#ffffff' : colors.text,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            transition: 'all 0.2s ease',
          }}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  );

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: isMobile ? 'stretch' : 'center',
    justifyContent: 'space-between',
    marginBottom: isMobile ? spacing.lg : spacing.xl,
    gap: isMobile ? spacing.md : spacing.sm,
    position: isMobile ? 'sticky' : 'static',
    top: isMobile ? '0' : 'auto',
    zIndex: isMobile ? '50' : 'auto',
    backgroundColor: isMobile ? colors.background : 'transparent',
    paddingTop: isMobile ? spacing.sm : '0',
    paddingBottom: isMobile ? spacing.sm : '0',
  };

  const mainGridStyles: React.CSSProperties = {
    display: 'grid',
    gap: isMobile ? spacing.md : spacing.xl,
    gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr' : '1fr 1fr',
    maxWidth: isMobile ? '100%' : '1400px',
    margin: '0 auto',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: colors.background,
        color: colors.text,
        padding: isMobile ? spacing.md : spacing.xl,
        transition: prefersReducedMotion ? 'none' : 'background-color 0.3s ease, color 0.3s ease',
      }}
    >
      {isTranscribing && (
        <div className="fixed top-4 left-4 z-50 w-80">
          <LoadingState
            type="transcription"
            message="Processing speech with AI..."
            progress={transcriptionProgress}
            size="small"
            variant="primary"
          />
        </div>
      )}

      <header style={headerStyles}>
        <div className={isMobile ? 'text-center' : ''}>
          <h1
            style={{
              margin: 0,
              fontSize: isMobile ? typography.fontSize['2xl'] : typography.fontSize['3xl'],
              fontWeight: typography.fontWeight.bold,
              color: colors.text,
            }}
          >
            VoiceFlow Pro
          </h1>
          <p
            style={{
              margin: `${spacing.xs} 0 0 0`,
              fontSize: isMobile ? typography.fontSize.base : typography.fontSize.lg,
              color: colors.textSecondary,
            }}
          >
            AI-Powered Voice Transcription
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: spacing.sm,
            justifyContent: isMobile ? 'center' : 'flex-end',
          }}
        >
          <PlatformIndicator />
          <ThemeToggle />

          <button
            aria-label="Open settings"
            onClick={() => setIsSettingsOpen(true)}
            style={{
              padding: spacing.md,
              borderRadius: borderRadius.medium,
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.backgroundSecondary,
              color: colors.text,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
              transition: 'all 0.2s ease',
              minHeight: isMobile ? '44px' : 'auto',
            }}
          >
            <Settings size={18} />
            <span className={isMobile ? 'hidden' : 'inline'}>Settings</span>
          </button>
        </div>
      </header>

      <div style={mainGridStyles}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
          {useLazyLoading ? (
            <LazyVoiceRecording
              onRecordingStart={handleStartRecording}
              onRecordingStop={handleStopRecording}
              onRecordingPause={handlePauseRecording}
              size="medium"
              variant="primary"
            />
          ) : (
            <VoiceRecording
              onRecordingStart={handleStartRecording}
              onRecordingStop={handleStopRecording}
              onRecordingPause={handlePauseRecording}
              size="medium"
              variant="primary"
            />
          )}

          {useLazyLoading ? (
            <LazyAudioVisualization data={[audioData]} isRecording={recordingState.isRecording} />
          ) : (
            <AudioVisualization data={[audioData]} isRecording={recordingState.isRecording} />
          )}

          {useLazyLoading ? (
            <LazyLanguageSelector value={selectedLanguage} onChange={handleLanguageChange} />
          ) : (
            <LanguageSelector value={selectedLanguage} onChange={handleLanguageChange} />
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
          <ProfessionalModeSelector />
          <TemplateSelector />

          {useLazyLoading ? (
            <LazyTranscriptionDisplay segments={transcriptionSegments} />
          ) : (
            <TranscriptionDisplay segments={transcriptionSegments} />
          )}

          <SmartNoteEditor />
        </div>
      </div>

      {isSettingsOpen && (
        useLazyLoading ? (
          <LazySettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        ) : (
          <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        )
      )}
    </div>
  );
};

export default HomePage;

