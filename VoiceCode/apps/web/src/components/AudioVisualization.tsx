// Real-time Audio Visualization Component for VoiceFlow Pro
// OPTIMIZED VERSION - Phase 1.1.3: UI Rendering Optimization

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Mic, MicOff, Volume2, Activity } from 'lucide-react';
import { AudioVisualizationData, AccessibilityProps } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useReducedMotion } from '@/utils/accessibility';

interface AudioVisualizationProps extends AccessibilityProps {
  isRecording?: boolean;
  data?: AudioVisualizationData[];
  onDataUpdate?: (data: AudioVisualizationData) => void;
  visualizationType?: 'waveform' | 'frequency' | 'circular' | 'bars';
  showRecordingIndicator?: boolean;
  showVolume?: boolean;
  showFrequency?: boolean;
  height?: number;
  width?: number;
  color?: string;
  backgroundColor?: string;
  className?: string;
}

// OPTIMIZATION: Memoized component to prevent unnecessary re-renders
export const AudioVisualization: React.FC<AudioVisualizationProps> = React.memo(({
  isRecording = false,
  data = [],
  onDataUpdate,
  visualizationType = 'waveform',
  showRecordingIndicator = true,
  showVolume = false,
  showFrequency = false,
  height = 100,
  width,
  color,
  backgroundColor,
  className = '',
  ...accessibilityProps
}) => {
  const { colors, spacing, borderRadius } = useTheme();
  const { settings } = useSettings();
  const prefersReducedMotion = useReducedMotion();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext>();
  const analyserRef = useRef<AnalyserNode>();
  const microphoneRef = useRef<MediaStreamAudioSourceNode>();
  const animationFrameRef = useRef<number>();
  const bufferLengthRef = useRef<number>(0);
  const dataArrayRef = useRef<Uint8Array>();

  // Audio context setup for real-time visualization
  useEffect(() => {
    if (!isRecording) {
      cleanup();
      return;
    }

    const initializeAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: { 
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          } 
        });

        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
        
        analyserRef.current.fftSize = 256;
        bufferLengthRef.current = analyserRef.current.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLengthRef.current);
        
        microphoneRef.current.connect(analyserRef.current);
        
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
        
        startVisualization();
        
      } catch (error) {
        console.error('Error initializing audio visualization:', error);
      }
    };

    initializeAudio();

    return () => {
      cleanup();
    };
  }, [isRecording]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    if (microphoneRef.current) {
      microphoneRef.current.disconnect();
    }
  }, []);

  // OPTIMIZATION: Throttle data updates to reduce parent re-renders
  const lastUpdateTimeRef = useRef<number>(0);
  const UPDATE_INTERVAL = 50; // Update parent every 50ms (20 FPS for data updates)

  // Start the visualization animation
  const startVisualization = useCallback(() => {
    if (!analyserRef.current || !canvasRef.current || !dataArrayRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // OPTIMIZATION: Use requestAnimationFrame for smooth 60 FPS rendering
    const draw = () => {
      if (!isRecording) return;

      analyserRef.current!.getByteFrequencyData(dataArrayRef.current!);

      // OPTIMIZATION: Throttle data updates to parent component
      const now = Date.now();
      if (now - lastUpdateTimeRef.current >= UPDATE_INTERVAL) {
        // Calculate volume and frequency data
        const volume = dataArrayRef.current!.reduce((sum, value) => sum + value, 0) / dataArrayRef.current!.length;
        const frequency = Array.from(dataArrayRef.current!).slice(0, 32); // Take first 32 frequency bins

        // Update data for parent component
        const visualizationData: AudioVisualizationData = {
          timestamp: now,
          amplitude: volume / 255,
          frequency,
        };

        onDataUpdate?.(visualizationData);
        lastUpdateTimeRef.current = now;
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw visualization based on type
      switch (visualizationType) {
        case 'waveform':
          drawWaveform(ctx, dataArrayRef.current, canvas.width, canvas.height);
          break;
        case 'frequency':
          drawFrequencyBars(ctx, dataArrayRef.current, canvas.width, canvas.height);
          break;
        case 'circular':
          drawCircular(ctx, dataArrayRef.current, canvas.width, canvas.height);
          break;
        case 'bars':
          drawVerticalBars(ctx, dataArrayRef.current, canvas.width, canvas.height);
          break;
      }

      // OPTIMIZATION: requestAnimationFrame ensures smooth 60 FPS
      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
  }, [isRecording, visualizationType, onDataUpdate]);

  // Waveform visualization
  const drawWaveform = (
    ctx: CanvasRenderingContext2D, 
    dataArray: Uint8Array, 
    canvasWidth: number, 
    canvasHeight: number
  ) => {
    const centerY = canvasHeight / 2;
    const sliceWidth = canvasWidth / dataArray.length;
    
    ctx.lineWidth = 2;
    ctx.strokeStyle = color || colors.primary;
    ctx.beginPath();
    
    let x = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const v = dataArray[i] / 128.0;
      const y = v * centerY;
      
      if (i === 0) {
        ctx.moveTo(x, centerY - y);
      } else {
        ctx.lineTo(x, centerY - y);
      }
      
      x += sliceWidth;
    }
    
    ctx.stroke();
  };

  // Frequency bars visualization
  const drawFrequencyBars = (
    ctx: CanvasRenderingContext2D, 
    dataArray: Uint8Array, 
    canvasWidth: number, 
    canvasHeight: number
  ) => {
    const barWidth = canvasWidth / dataArray.length;
    
    for (let i = 0; i < dataArray.length; i++) {
      const barHeight = (dataArray[i] / 255) * canvasHeight;
      
      ctx.fillStyle = `rgba(${parseInt(color?.slice(1, 3) || '59, 130, 246', 16)}, ${parseInt(color?.slice(3, 5) || '130, 246', 16)}, ${parseInt(color?.slice(5, 7) || '246', 16)}, ${(dataArray[i] / 255) * 0.8 + 0.2})`;
      
      ctx.fillRect(
        i * barWidth,
        canvasHeight - barHeight,
        barWidth - 1,
        barHeight
      );
    }
  };

  // Circular visualization
  const drawCircular = (
    ctx: CanvasRenderingContext2D, 
    dataArray: Uint8Array, 
    canvasWidth: number, 
    canvasHeight: number
  ) => {
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const radius = Math.min(canvasWidth, canvasHeight) / 3;
    
    ctx.strokeStyle = color || colors.primary;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let i = 0; i < dataArray.length; i++) {
      const angle = (i / dataArray.length) * 2 * Math.PI;
      const amplitude = (dataArray[i] / 255) * 30;
      
      const x = centerX + Math.cos(angle) * (radius + amplitude);
      const y = centerY + Math.sin(angle) * (radius + amplitude);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.closePath();
    ctx.stroke();
  };

  // Vertical bars visualization
  const drawVerticalBars = (
    ctx: CanvasRenderingContext2D, 
    dataArray: Uint8Array, 
    canvasWidth: number, 
    canvasHeight: number
  ) => {
    const barCount = Math.min(dataArray.length, 32);
    const barWidth = canvasWidth / barCount;
    
    for (let i = 0; i < barCount; i++) {
      const barHeight = (dataArray[i] / 255) * canvasHeight;
      const hue = (i / barCount) * 360;
      
      ctx.fillStyle = `hsla(${hue}, 70%, 60%, ${(dataArray[i] / 255) * 0.8 + 0.2})`;
      
      ctx.fillRect(
        i * barWidth,
        canvasHeight - barHeight,
        barWidth - 2,
        barHeight
      );
    }
  };

  // Get current volume and frequency for display
  const currentVolume = data.length > 0 ? data[data.length - 1].amplitude : 0;
  const currentFrequency = data.length > 0 ? data[data.length - 1].frequency : [];

  const canvasStyles: React.CSSProperties = {
    width: width || '100%',
    height: `${height}px`,
    borderRadius: borderRadius.medium,
    backgroundColor: backgroundColor || colors.backgroundTertiary,
    border: `1px solid ${colors.border}`,
  };

  return (
    <div 
      {...accessibilityProps}
      className={`audio-visualization ${className}`}
      style={{ position: 'relative', width: '100%' }}
    >
      {/* Canvas for visualization */}
      <canvas
        ref={canvasRef}
        width={width || 400}
        height={height}
        style={{
          ...canvasStyles,
          display: 'block',
        }}
        aria-label="Audio visualization"
        role="img"
      />

      {/* Recording indicator */}
      {showRecordingIndicator && (
        <div
          style={{
            position: 'absolute',
            top: spacing.sm,
            left: spacing.sm,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
            backgroundColor: isRecording ? colors.error : colors.textTertiary,
            color: '#ffffff',
            padding: `${spacing.xs} ${spacing.sm}`,
            borderRadius: borderRadius.small,
            fontSize: '12px',
            fontWeight: '500',
          }}
        >
          {isRecording ? (
            <>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  animation: prefersReducedMotion ? 'none' : 'pulse 1s infinite',
                }}
              />
              Recording
            </>
          ) : (
            <>
              <MicOff size={12} />
              Not recording
            </>
          )}
        </div>
      )}

      {/* Volume and frequency display */}
      {(showVolume || showFrequency) && isRecording && (
        <div
          style={{
            position: 'absolute',
            bottom: spacing.sm,
            right: spacing.sm,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            backgroundColor: `${colors.background}80`,
            backdropFilter: 'blur(4px)',
            padding: spacing.sm,
            borderRadius: borderRadius.small,
            fontSize: '12px',
          }}
        >
          {showVolume && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Volume2 size={12} />
              {Math.round(currentVolume * 100)}%
            </div>
          )}
          
          {showFrequency && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Activity size={12} />
              {currentFrequency.length > 0 ? 
                `${currentFrequency.slice(0, 3).reduce((a, b) => a + b, 0) / 3 | 0}Hz` : 
                '0Hz'
              }
            </div>
          )}
        </div>
      )}

      {/* No recording state */}
      {!isRecording && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: spacing.sm,
            color: colors.textTertiary,
            fontSize: '14px',
          }}
        >
          <Mic size={32} />
          <span>Start recording to see visualization</span>
        </div>
      )}

      {/* CSS animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}, (prevProps, nextProps) => {
  // OPTIMIZATION: Custom comparison function to prevent unnecessary re-renders
  // Only re-render if these specific props change
  return (
    prevProps.isRecording === nextProps.isRecording &&
    prevProps.visualizationType === nextProps.visualizationType &&
    prevProps.height === nextProps.height &&
    prevProps.width === nextProps.width &&
    prevProps.color === nextProps.color &&
    prevProps.backgroundColor === nextProps.backgroundColor &&
    prevProps.showRecordingIndicator === nextProps.showRecordingIndicator &&
    prevProps.showVolume === nextProps.showVolume &&
    prevProps.showFrequency === nextProps.showFrequency
  );
});

// Default export for lazy loading
export default AudioVisualization;