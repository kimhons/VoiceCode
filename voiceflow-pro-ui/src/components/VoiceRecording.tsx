// Voice Recording Component for VoiceFlow Pro - Enhanced with Loading States & Mobile Optimization

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Square, Pause, Play, Settings, Volume2, Loader2 } from 'lucide-react';
import { VoiceRecordingState, AccessibilityProps } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useResponsive, useReducedMotion } from '@/hooks/use-mobile';
import { useAIWorker } from '@/hooks/useAIWorker';
import { LoadingState, InlineLoading } from './LoadingState';
import { SimpleErrorBoundary } from './ErrorBoundary';
import { 
  getFocusStyles, 
  componentSizes, 
  announceToScreenReader, 
  generateAriaLabel 
} from '@/utils/accessibility';

interface VoiceRecordingProps extends AccessibilityProps {
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  onRecordingPause?: () => void;
  onRecordingResume?: () => void;
  onStateChange?: (state: VoiceRecordingState) => void;
  onTranscriptionUpdate?: (segments: any[]) => void;
  disabled?: boolean;
  showVolume?: boolean;
  showSettings?: boolean;
  enableAIProcessing?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'minimal';
  className?: string;
}

export const VoiceRecording: React.FC<VoiceRecordingProps> = ({
  onRecordingStart,
  onRecordingStop,
  onRecordingPause,
  onRecordingResume,
  onStateChange,
  onTranscriptionUpdate,
  disabled = false,
  showVolume = true,
  showSettings = true,
  enableAIProcessing = true,
  size = 'medium',
  variant = 'primary',
  className = '',
  ...accessibilityProps
}) => {
  const { colors, spacing, borderRadius, platform, platformConfig } = useTheme();
  const { settings } = useSettings();
  const { isMobile, isTouchDevice } = useResponsive();
  const prefersReducedMotion = useReducedMotion();
  
  const [state, setState] = useState<VoiceRecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    volume: 0,
    confidence: 1,
    language: settings.language,
  });
  
  // Enhanced state for loading and AI processing
  const [isInitializing, setIsInitializing] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [aiProcessingProgress, setAiProcessingProgress] = useState(0);
  const [showVolumeIndicator, setShowVolumeIndicator] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout>();
  const audioContextRef = useRef<AudioContext>();
  const analyserRef = useRef<AnalyserNode>();
  const micRef = useRef<MediaStreamAudioSourceNode>();
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  
  // AI Worker integration
  const {
    isReady: isAIReady,
    isProcessing: isAIProcessing,
    transcribeAudio,
    detectLanguage,
    enhanceAudio
  } = useAIWorker({
    onInit: (status) => {
      setIsInitializing(status.status === 'loading');
    },
    onTranscription: (segments, metadata) => {
      setIsProcessingAudio(false);
      setAiProcessingProgress(100);
      onTranscriptionUpdate?.(segments);
      announceToScreenReader('Transcription completed', 'polite');
    },
    onLanguageDetection: (language) => {
      setState(prev => ({ ...prev, language: language.code }));
      announceToScreenReader(`Language detected: ${language.name}`, 'polite');
    },
    onProgress: (progress, message) => {
      setAiProcessingProgress(progress);
    },
    onError: (error) => {
      console.error('AI Processing error:', error);
      setIsProcessingAudio(false);
      announceToScreenReader('AI processing failed', 'assertive');
    }
  });

  // Update parent component when state changes
  useEffect(() => {
    onStateChange?.(state);
  }, [state, onStateChange]);

  // Timer for recording duration
  useEffect(() => {
    if (state.isRecording && !state.isPaused) {
      intervalRef.current = setInterval(() => {
        setState(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isRecording, state.isPaused]);

  // Format duration for display
  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padFocusStyles(2, '0')}`;
  };

  // Enhanced recording functions with mobile optimization and AI integration
  const startRecording = useCallback(async () => {
    if (disabled || isInitializing) return;
    
    setIsInitializing(true);
    
    try {
      // Request microphone access with enhanced constraints for mobile
      const constraints: MediaStreamConstraints = { 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: isMobile ? 44100 : 48000,
          channelCount: 1,
          ...(isTouchDevice && {
            // Optimize for touch devices
            volume: 1.0,
            latency: 0
          })
        } 
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Set up audio analysis with mobile-friendly settings
      audioContextRef.current = new AudioContext({
        sampleRate: isMobile ? 44100 : 48000,
        latencyHint: 'interactive'
      });
      
      analyserRef.current = audioContextRef.current.createAnalyser();
      micRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      // Optimize FFT size for better performance on mobile
      analyserRef.current.fftSize = isMobile ? 128 : 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      
      micRef.current.connect(analyserRef.current);

      // Set up MediaRecorder for AI processing
      audioChunksRef.current = [];
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: isMobile ? 'audio/webm' : 'audio/wav'
      });
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Enhanced volume monitoring with performance optimization
      let animationFrameId: number;
      const updateVolume = () => {
        if (analyserRef.current && state.isRecording) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          const volume = average / 255;
          
          setState(prev => ({ 
            ...prev, 
            volume: Math.round(volume * 100) 
          }));
          
          // Throttle animation frame for better performance
          animationFrameId = requestAnimationFrame(updateVolume);
        }
      };
      
      updateVolume();

      setState(prev => ({ 
        ...prev, 
        isRecording: true, 
        isPaused: false, 
        duration: 0,
        error: undefined,
      }));

      setIsInitializing(false);
      onRecordingStart?.();
      announceToScreenReader('Recording started', 'assertive');
      
      // Start recording chunks for AI processing if enabled
      if (enableAIProcessing && isAIReady) {
        mediaRecorderRef.current.start(1000); // 1-second chunks
      }
      
    } catch (error) {
      setIsInitializing(false);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to access microphone. Please check permissions.',
      }));
      announceToScreenReader('Failed to access microphone', 'assertive');
    }
  }, [disabled, isInitializing, isMobile, isTouchDevice, enableAIProcessing, isAIReady, state.isRecording, onRecordingStart]);

  // Enhanced stop recording with AI processing
  const stopRecording = useCallback(() => {
    // Stop animation frame
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    // Stop MediaRecorder if active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    setState(prev => ({ 
      ...prev, 
      isRecording: false, 
      isPaused: false,
      volume: 0,
    }));

    onRecordingStop?.();
    announceToScreenReader('Recording stopped', 'assertive');
    
    // Process audio with AI if enabled and we have recorded data
    if (enableAIProcessing && isAIReady && audioChunksRef.current.length > 0) {
      setIsProcessingAudio(true);
      setAiProcessingProgress(0);
      
      // Create audio blob
      const audioBlob = new Blob(audioChunksRef.current, { 
        type: isMobile ? 'audio/webm' : 'audio/wav' 
      });
      
      // Process with AI worker
      const audioData = {
        duration: state.duration,
        chunks: ['chunk1', 'chunk2'], // Simplified for demo
        language: state.language,
        sampleRate: isMobile ? 44100 : 48000
      };
      
      transcribeAudio(audioData);
    }
  }, [enableAIProcessing, isAIReady, isMobile, state.duration, state.language, transcribeAudio, onRecordingStop]);

  // Pause/Resume recording
  const togglePause = () => {
    setState(prev => ({ 
      ...prev, 
      isPaused: !prev.isPaused,
    }));

    if (state.isPaused) {
      onRecordingResume?.();
      announceToScreenReader('Recording resumed', 'polite');
    } else {
      onRecordingPause?.();
      announceToScreenReader('Recording paused', 'polite');
    }
  };

  // Get component styles based on size and variant
  const buttonSize = componentSizes.button[size];
  const focusStyles = getFocusStyles(platform, settings.accessibility.highContrast);

  const baseStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: buttonSize.height,
    padding: buttonSize.padding,
    fontSize: buttonSize.fontSize,
    fontWeight: '500',
    borderRadius: platform === 'mac' ? borderRadius.medium : 
                  platform === 'windows' ? borderRadius.small : 
                  borderRadius.medium,
    transition: 'all 0.2s ease',
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    outline: 'none',
    position: 'relative',
    minWidth: size === 'small' ? '80px' : size === 'large' ? '120px' : '100px',
  };

  const variantStyles: React.CSSProperties = {
    primary: {
      backgroundColor: state.isRecording ? colors.error : colors.primary,
      color: '#ffffff',
      boxShadow: state.isRecording 
        ? `0 4px 12px ${colors.error}40`
        : `0 2px 8px ${colors.primary}30`,
    },
    secondary: {
      backgroundColor: 'transparent',
      color: state.isRecording ? colors.error : colors.text,
      border: `1px solid ${state.isRecording ? colors.error : colors.border}`,
    },
    minimal: {
      backgroundColor: 'transparent',
      color: state.isRecording ? colors.error : colors.textSecondary,
      border: 'none',
    },
  };

  const recordingPulseAnimation = state.isRecording ? {
    animation: 'recording-pulse 2s infinite',
  } : {};

  return (
    <SimpleErrorBoundary message="Failed to load voice recording component">
      <div className={`voice-recording ${className} ${isMobile ? 'mobile-optimized' : ''}`}>
        {/* AI Processing Status */}
        {isProcessingAudio && (
          <div className="mb-4">
            <LoadingState
              type="transcription"
              message="Processing audio with AI..."
              progress={aiProcessingProgress}
              size="small"
              variant="secondary"
            />
          </div>
        )}

        {/* Main recording button */}
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <button
            {...accessibilityProps}
            aria-label={generateAriaLabel(
              'voice recording',
              state.isRecording ? 'active' : 'inactive',
              state.isRecording ? 'click to stop' : 'click to start'
            )}
            disabled={disabled || isInitializing}
            onClick={state.isRecording ? stopRecording : startRecording}
            style={{
              ...baseStyles,
              ...variantStyles[variant],
              ...focusStyles,
              ...recordingPulseAnimation,
              opacity: disabled || isInitializing ? 0.6 : 1,
              // Enhanced touch targets for mobile
              minHeight: isMobile ? '44px' : buttonSize.height,
              minWidth: isMobile ? '120px' : (size === 'small' ? '80px' : size === 'large' ? '120px' : '100px'),
            }}
            onFocus={() => setShowVolumeIndicator(true)}
            onBlur={() => setShowVolumeIndicator(false)}
          >
            {/* Show loading state during initialization */}
            {isInitializing ? (
              <>
                <InlineLoading size={size === 'small' ? 'small' : 'medium'} className="text-current" />
                <span>Initializing...</span>
              </>
            ) : state.isRecording ? (
              <>
                <Square size={size === 'small' ? 16 : size === 'large' ? 24 : 20} />
                <span>Stop</span>
                {/* Recording duration */}
                <span 
                  style={{ 
                    fontSize: '12px', 
                    opacity: 0.8,
                    fontFamily: 'monospace',
                  }}
                  aria-live="polite"
                >
                  {formatDuration(state.duration)}
                </span>
              </>
            ) : (
              <>
                <Mic size={size === 'small' ? 16 : size === 'large' ? 24 : 20} />
                <span>Record</span>
              </>
            )}
          </button>

          {/* Pause/Resume button */}
          {state.isRecording && !isInitializing && (
            <button
              aria-label={state.isPaused ? 'Resume recording' : 'Pause recording'}
              onClick={togglePause}
              style={{
                ...baseStyles,
                backgroundColor: colors.secondary,
                color: colors.text,
                marginLeft: spacing.xs,
                minWidth: isMobile ? '80px' : '60px',
                minHeight: isMobile ? '44px' : 'auto',
                ...focusStyles,
              }}
            >
              {state.isPaused ? (
                <Play size={isMobile ? 18 : 16} />
              ) : (
                <Pause size={isMobile ? 18 : 16} />
              )}
              <span className="hidden sm:inline">
                {state.isPaused ? 'Resume' : 'Pause'}
              </span>
            </button>
          )}

          {/* Enhanced volume indicator with mobile optimization */}
          {showVolume && state.isRecording && (showVolumeIndicator || isMobile) && (
            <div
              style={{
                position: isMobile ? 'fixed' : 'absolute',
                top: isMobile ? 'auto' : '100%',
                bottom: isMobile ? '20px' : 'auto',
                left: isMobile ? '20px' : 0,
                right: isMobile ? '20px' : 0,
                marginTop: isMobile ? 0 : spacing.sm,
                backgroundColor: colors.backgroundSecondary,
                border: `1px solid ${colors.border}`,
                borderRadius: borderRadius.medium,
                padding: spacing.md,
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                zIndex: isMobile ? 1000 : 10,
                // Mobile-specific styles
                minHeight: isMobile ? '60px' : 'auto',
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: spacing.sm,
                flexDirection: isMobile ? 'row' : 'row'
              }}>
                <Volume2 size={isMobile ? 18 : 14} className={isMobile ? 'flex-shrink-0' : ''} />
                <div
                  style={{
                    flex: 1,
                    height: isMobile ? '6px' : '4px',
                    backgroundColor: colors.border,
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${state.volume}%`,
                      height: '100%',
                      backgroundColor: state.volume > 70 ? colors.error : colors.success,
                      transition: prefersReducedMotion ? 'none' : 'width 0.1s ease',
                    }}
                  />
                </div>
                <span style={{ 
                  fontSize: isMobile ? '14px' : '12px', 
                  color: colors.textSecondary,
                  fontWeight: '500',
                  minWidth: '40px',
                  textAlign: 'right'
                }}>
                  {state.volume}%
                </span>
              </div>
              
              {/* Mobile-specific recording status */}
              {isMobile && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                    <span>Recording...</span>
                    <span>{formatDuration(state.duration)}</span>
                  </div>
                </div>
              )}
            </div>
          )}
      </div>

      {/* Error display */}
      {state.error && (
        <div
          style={{
            color: colors.error,
            fontSize: '12px',
            marginTop: spacing.xs,
            textAlign: 'center',
          }}
          role="alert"
          aria-live="assertive"
        >
          {state.error}
        </div>
      )}

      {/* Enhanced CSS with mobile optimizations */}
      <style>{`
        @keyframes recording-pulse {
          0%, 100% { 
            transform: scale(1); 
          }
          50% { 
            transform: scale(1.05); 
          }
        }
        
        /* Mobile-specific animations */
        .voice-recording.mobile-optimized button {
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        
        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .voice-recording * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
        
        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .voice-recording button {
            border: 2px solid currentColor;
          }
        }
        
        /* Dark mode optimizations */
        @media (prefers-color-scheme: dark) {
          .voice-recording .volume-indicator {
            background-color: rgba(0, 0, 0, 0.8);
          }
        }
        
        .sr-only {
          position: absolute;
          left: -10000px;
          width: 1px;
          height: 1px;
          overflow: hidden;
        }
        
        /* Mobile-first responsive improvements */
        @media (max-width: 768px) {
          .voice-recording {
            padding: 1rem;
          }
          
          .voice-recording button {
            font-size: 16px; /* Prevent zoom on iOS */
          }
        }
        
        /* Touch device optimizations */
        @media (hover: none) and (pointer: coarse) {
          .voice-recording button:hover {
            background-color: var(--button-hover-bg);
          }
          
          .voice-recording button:active {
            transform: scale(0.98);
            transition: transform 0.1s ease;
          }
        }
      `}</style>
      </div>
    </SimpleErrorBoundary>
  );
};