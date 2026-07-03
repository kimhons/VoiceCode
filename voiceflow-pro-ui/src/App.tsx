// VoiceFlow Pro UI Demo Application - Enhanced with Lazy Loading & Mobile Optimization

import React, { useState, useRef, useEffect } from 'react';
import { Settings, Sun, Moon, Monitor, Globe, Mic } from 'lucide-react';
import {
  // Enhanced components with loading states and error boundaries
  VoiceRecording,
  TranscriptionDisplay,
  LanguageSelector,
  AudioVisualization,
  SettingsPanel,
  LoadingState,
  ErrorBoundary,
  useErrorHandler,
  // Lazy loading components
  LazyComponent,
  LazyVoiceRecording,
  LazyTranscriptionDisplay,
  LazyLanguageSelector,
  LazyAudioVisualization,
  LazySettingsPanel,
  useComponentPreloader,
} from './components';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { TranscriptionSegment, AudioVisualizationData } from './types';
// Enhanced hooks
import { useResponsive, useReducedMotion } from './hooks';

// Enhanced Demo App Content Component with Mobile Optimization
const AppContent: React.FC = () => {
  const { theme, resolvedTheme, setTheme, platform, colors, spacing, borderRadius, typography } = useTheme();
  const { isMobile, isTablet, isDesktop, width, height, currentBreakpoint, isTouchDevice } = useResponsive();
  const prefersReducedMotion = useReducedMotion();
  const { preloadComponents, isPreloading, preloadProgress } = useComponentPreloader();
  const handleError = useErrorHandler();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [useLazyLoading, setUseLazyLoading] = useState(true); // Toggle for demo
  const [isComponentsPreloaded, setIsComponentsPreloaded] = useState(false);

  const [recordingState, setRecordingState] = useState({
    isRecording: false,
    isPaused: false,
    duration: 0,
    volume: 0,
    confidence: 1,
    language: 'en',
  });
  
  const [transcriptionSegments, setTranscriptionSegments] = useState<TranscriptionSegment[]>([
    {
      id: '1',
      text: 'Welcome to VoiceFlow Pro, the next-generation voice-to-text productivity platform.',
      confidence: 0.95,
      startTime: 0,
      endTime: 3.5,
      isFinal: true,
      speaker: 'User',
    },
    {
      id: '2',
      text: 'This demo showcases our cross-platform UI components with accessibility features.',
      confidence: 0.92,
      startTime: 3.5,
      endTime: 6.8,
      isFinal: true,
      speaker: 'User',
    },
    {
      id: '3',
      text: 'Try recording your own voice or explore the settings panel.',
      confidence: 0.88,
      startTime: 6.8,
      endTime: 9.2,
      isFinal: false,
      speaker: 'User',
    },
  ]);
  
  const [audioData, setAudioData] = useState<AudioVisualizationData[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionProgress, setTranscriptionProgress] = useState(0);

  // Preload components on mount for better performance
  useEffect(() => {
    const preloadInitialComponents = async () => {
      try {
        // Preload critical components first
        await preloadComponents(['voice-recording', 'transcription-display']);
        setIsComponentsPreloaded(true);
      } catch (error) {
        console.warn('Failed to preload some components:', error);
        handleError(error as Error);
      }
    };

    // Small delay to ensure initial render is smooth
    const timeoutId = setTimeout(preloadInitialComponents, 100);
    return () => clearTimeout(timeoutId);
  }, [preloadComponents, handleError]);

  // Handle transcription updates from AI processing
  const handleTranscriptionUpdate = (segments: TranscriptionSegment[]) => {
    setTranscriptionSegments(prev => [...prev, ...segments]);
    setIsTranscribing(false);
    setTranscriptionProgress(100);
  };

  // Enhanced voice recording with AI processing
  const handleRecordingStateChange = (newState: any) => {
    setRecordingState(newState);
    
    // Handle AI processing start
    if (newState.isRecording && !recordingState.isRecording) {
      setIsTranscribing(false);
      setTranscriptionProgress(0);
    }
    
    // Handle recording stop - start AI processing
    if (!newState.isRecording && recordingState.isRecording) {
      setIsTranscribing(true);
      setTranscriptionProgress(10);
    }
  };

  // Handle preloading toggle
  const toggleLazyLoading = () => {
    setUseLazyLoading(!useLazyLoading);
    if (!useLazyLoading) {
      // When enabling lazy loading, preload next components
      setTimeout(() => {
        preloadComponents(['audio-visualization', 'language-selector']);
      }, 500);
    }
  };

  // Handle voice recording state changes
  const handleRecordingStateChange = (newState: any) => {
    setRecordingState(newState);
  };

  // Handle audio visualization data updates
  const handleAudioDataUpdate = (data: AudioVisualizationData) => {
    setAudioData(prev => [...prev.slice(-99), data]); // Keep last 100 data points
  };

  // Handle transcription segment editing
  const handleSegmentEdit = (segmentId: string, newText: string) => {
    setTranscriptionSegments(prev => 
      prev.map(segment => 
        segment.id === segmentId 
          ? { ...segment, text: newText, isFinal: true }
          : segment
      )
    );
  };

  // Theme toggle component
  const ThemeToggle: React.FC = () => (
    <div style={{ display: 'flex', gap: spacing.xs }}>
      {[
        { value: 'light', icon: <Sun size={16} />, label: 'Light' },
        { value: 'dark', icon: <Moon size={16} />, label: 'Dark' },
        { value: 'auto', icon: <Monitor size={16} />, label: 'Auto' },
      ].map(({ value, icon, label }) => (
        <button
          key={value}
          aria-label={`Switch to ${label} theme`}
          onClick={() => setTheme(value as any)}
          style={{
            padding: spacing.sm,
            border: theme === value ? `2px solid ${colors.primary}` : `1px solid ${colors.border}`,
            borderRadius: borderRadius.small,
            backgroundColor: theme === value ? `${colors.primary}10` : colors.background,
            color: colors.text,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
            transition: 'all 0.2s ease',
          }}
        >
          {icon}
          <span style={{ fontSize: '12px' }}>{label}</span>
        </button>
      ))}
    </div>
  );

  // Platform indicator
  const PlatformIndicator: React.FC = () => (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: spacing.xs,
        padding: `${spacing.xs} ${spacing.sm}`,
        backgroundColor: colors.backgroundTertiary,
        borderRadius: borderRadius.small,
        fontSize: '12px',
        color: colors.textSecondary,
      }}
    >
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: platform === 'mac' ? '#007AFF' : 
                           platform === 'windows' ? '#0078D4' : 
                           platform === 'linux' ? '#FF6B35' : colors.primary,
        }}
      />
      {platform.charAt(0).toUpperCase() + platform.slice(1)} detected
    </div>
  );

  // Enhanced responsive styles with mobile-first approach
  const containerStyles: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: colors.background,
    color: colors.text,
    fontFamily: typography.fontFamily,
    padding: isMobile ? spacing.md : spacing.xl,
    paddingBottom: isMobile ? '80px' : spacing.xl, // Extra space for mobile nav
  };

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

  const sectionStyles: React.CSSProperties = {
    backgroundColor: colors.background,
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.large,
    padding: isMobile ? spacing.md : spacing.xl,
    boxShadow: isMobile ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.05)',
    marginBottom: isMobile ? spacing.md : '0',
  };

  const titleStyles: React.CSSProperties = {
    margin: `0 0 ${spacing.lg} 0`,
    fontSize: isMobile ? typography.fontSize.xl : typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  };

  // Performance monitoring
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🎯 Responsive Debug:
        - Screen: ${width}x${height}
        - Breakpoint: ${currentBreakpoint}
        - Is Mobile: ${isMobile}
        - Is Tablet: ${isTablet}
        - Is Desktop: ${isDesktop}
        - Touch Device: ${isTouchDevice}
        - Lazy Loading: ${useLazyLoading}
        - Components Preloaded: ${isComponentsPreloaded}
      `);
    }
  }, [width, height, currentBreakpoint, isMobile, isTablet, isDesktop, isTouchDevice, useLazyLoading, isComponentsPreloaded]);

  return (
    <ErrorBoundary onError={handleError}>
      <div style={containerStyles} className={`voiceflow-app ${isMobile ? 'mobile-optimized' : ''}`}>
        {/* Loading overlay for preloading */}
        {isPreloading && (
          <div className="fixed top-4 right-4 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Preloading... {Math.round(preloadProgress)}%</span>
            </div>
          </div>
        )}

        {/* Transcription progress */}
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

        {/* Header */}
        <header style={headerStyles}>
          <div className={isMobile ? 'text-center' : ''}>
            <h1 style={{ 
              margin: 0, 
              fontSize: isMobile ? typography.fontSize['2xl'] : typography.fontSize['3xl'],
              fontWeight: typography.fontWeight.bold,
              color: colors.text,
            }}>
              VoiceFlow Pro UI Components
            </h1>
            <p style={{ 
              margin: `${spacing.xs} 0 0 0`,
              fontSize: isMobile ? typography.fontSize.base : typography.fontSize.lg,
              color: colors.textSecondary,
            }}>
              Cross-platform voice recording interface with AI processing
            </p>
          </div>
          
          <div className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center'} gap-`}>
            {/* Development controls for demo */}
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={toggleLazyLoading}
                className={`px-3 py-1 text-xs rounded border ${
                  useLazyLoading 
                    ? 'bg-green-100 text-green-800 border-green-300' 
                    : 'bg-gray-100 text-gray-800 border-gray-300'
                }`}
                title="Toggle lazy loading for demo"
              >
                {useLazyLoading ? 'Lazy ON' : 'Lazy OFF'}
              </button>
            )}
            
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
                minHeight: isMobile ? '44px' : 'auto', // Touch-friendly
              }}
            >
              <Settings size={18} />
              <span className={isMobile ? 'hidden' : 'inline'}>Settings</span>
            </button>
          </div>
        </header>

        {/* Main content grid */}
        <div style={mainGridStyles}>
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? spacing.md : spacing.xl }}>
            {/* Voice Recording Section */}
            <section style={sectionStyles}>
              <h2 style={titleStyles}>
                <Mic size={isMobile ? 20 : 24} />
                Voice Recording
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
                {useLazyLoading ? (
                  <LazyComponent
                    component={LazyVoiceRecording}
                    fallback={<LoadingState type="recording" message="Loading voice recording..." size="medium" />}
                  >
                    <VoiceRecording
                      onStateChange={handleRecordingStateChange}
                      onTranscriptionUpdate={handleTranscriptionUpdate}
                      onRecordingStart={() => console.log('Recording started')}
                      onRecordingStop={() => console.log('Recording stopped')}
                      onRecordingPause={() => console.log('Recording paused')}
                      onRecordingResume={() => console.log('Recording resumed')}
                      showVolume={true}
                      showSettings={false}
                      enableAIProcessing={true}
                      size={isMobile ? "medium" : "large"}
                      variant="primary"
                    />
                  </LazyComponent>
                ) : (
                  <VoiceRecording
                    onStateChange={handleRecordingStateChange}
                    onTranscriptionUpdate={handleTranscriptionUpdate}
                    onRecordingStart={() => console.log('Recording started')}
                    onRecordingStop={() => console.log('Recording stopped')}
                    onRecordingPause={() => console.log('Recording paused')}
                    onRecordingResume={() => console.log('Recording resumed')}
                    showVolume={true}
                    showSettings={false}
                    enableAIProcessing={true}
                    size={isMobile ? "medium" : "large"}
                    variant="primary"
                  />
                )}
              
              {/* Recording status */}
              <div
                style={{
                  padding: spacing.md,
                  backgroundColor: colors.backgroundSecondary,
                  borderRadius: borderRadius.medium,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <h4 style={{ margin: `0 0 ${spacing.sm} 0`, color: colors.text }}>
                  Recording Status
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: spacing.sm }}>
                  <div>
                    <span style={{ fontSize: '12px', color: colors.textSecondary }}>Status</span>
                    <div style={{ fontWeight: '500', color: recordingState.isRecording ? colors.error : colors.textSecondary }}>
                      {recordingState.isRecording ? (recordingState.isPaused ? 'Paused' : 'Recording') : 'Stopped'}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: colors.textSecondary }}>Volume</span>
                    <div style={{ fontWeight: '500', color: colors.text }}>
                      {recordingState.volume}%
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: colors.textSecondary }}>Language</span>
                    <div style={{ fontWeight: '500', color: colors.text }}>
                      <Globe size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                      {recordingState.language.toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Audio Visualization Section */}
          <section style={sectionStyles}>
            <h2 style={titleStyles}>
              Audio Visualization
            </h2>
            
            <AudioVisualization
              isRecording={recordingState.isRecording}
              onDataUpdate={handleAudioDataUpdate}
              data={audioData}
              visualizationType="frequency"
              showRecordingIndicator={true}
              showVolume={true}
              showFrequency={true}
              height={120}
            />
            
            <p style={{ 
              margin: `${spacing.md} 0 0 0`,
              fontSize: '14px',
              color: colors.textSecondary,
            }}>
              Real-time audio visualization with multiple display types and accessibility features.
            </p>
          </section>

          {/* Language Selection Section */}
          <section style={sectionStyles}>
            <h2 style={titleStyles}>
              <Globe size={24} />
              Language Selection
            </h2>
            
            <LanguageSelector
              onAutoDetect={() => console.log('Auto-detecting language...')}
              searchable={true}
              showNativeNames={true}
              showFlags={true}
              size="medium"
            />
            
            <p style={{ 
              margin: `${spacing.md} 0 0 0`,
              fontSize: '14px',
              color: colors.textSecondary,
            }}>
              Choose from 20+ supported languages with auto-detection and search functionality.
            </p>
          </section>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
          {/* Transcription Display Section */}
          <section style={sectionStyles}>
            <h2 style={titleStyles}>
              Transcription Display
            </h2>
            
            <TranscriptionDisplay
              segments={transcriptionSegments}
              onSegmentEdit={handleSegmentEdit}
              editable={true}
              showTimestamps={true}
              showConfidence={true}
              showSpeaker={true}
              autoScroll={true}
              maxHeight="500px"
            />
          </section>

          {/* Features Overview */}
          <section style={sectionStyles}>
            <h2 style={titleStyles}>
              Key Features
            </h2>
            
            <div style={{ display: 'grid', gap: spacing.lg }}>
              {[
                {
                  title: 'Cross-Platform Support',
                  description: `Optimized for ${platform.charAt(0).toUpperCase() + platform.slice(1)}, Windows, and Linux with platform-specific UI adaptations.`,
                },
                {
                  title: 'Accessibility First',
                  description: 'WCAG 2.1 AA compliant with screen reader support, keyboard navigation, and customizable accessibility options.',
                },
                {
                  title: 'Real-time Processing',
                  description: 'Live audio visualization and transcription with confidence indicators and smart formatting.',
                },
                {
                  title: 'Customizable Themes',
                  description: 'Light, dark, and auto themes with high contrast modes and platform-specific styling.',
                },
              ].map((feature, index) => (
                <div key={index} style={{ padding: spacing.md, border: `1px solid ${colors.border}`, borderRadius: borderRadius.medium }}>
                  <h4 style={{ margin: `0 0 ${spacing.xs} 0`, color: colors.text }}>{feature.title}</h4>
                  <p style={{ margin: 0, fontSize: '14px', color: colors.textSecondary }}>{feature.description}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={(settings) => {
          console.log('Settings saved:', settings);
        }}
      />
    </div>
  );
};

// Main App Component with Providers
const App: React.FC = () => {
  return (
    <ThemeProvider defaultTheme="auto">
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </ThemeProvider>
  );
};

export default App;
