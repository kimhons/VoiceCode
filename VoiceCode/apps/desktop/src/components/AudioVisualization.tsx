import React, { useEffect, useRef, useCallback } from 'react';

interface AudioVisualizationProps {
  isActive: boolean;
  width?: number;
  height?: number;
  barCount?: number;
  barColor?: string;
  backgroundColor?: string;
}

export const AudioVisualization: React.FC<AudioVisualizationProps> = ({
  isActive,
  width = 200,
  height = 60,
  barCount = 32,
  barColor = '#FF6B35',
  backgroundColor = 'transparent',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyzer = analyzerRef.current;
    const dataArray = dataArrayRef.current;

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    if (!isActive || !analyzer || !dataArray) {
      // Draw idle state
      const barWidth = width / barCount;
      const idleHeight = 2;
      ctx.fillStyle = barColor;

      for (let i = 0; i < barCount; i++) {
        const x = i * barWidth;
        const y = (height - idleHeight) / 2;
        ctx.fillRect(x + 1, y, barWidth - 2, idleHeight);
      }
      return;
    }

    analyzer.getByteFrequencyData(dataArray as Uint8Array<ArrayBuffer>);

    const barWidth = width / barCount;

    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor((i / barCount) * dataArray.length);
      const value = dataArray[dataIndex];
      const barHeight = (value / 255) * height * 0.9;

      const x = i * barWidth;
      const y = (height - barHeight) / 2;

      // Create gradient effect
      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
      gradient.addColorStop(0, barColor);
      gradient.addColorStop(0.5, barColor);
      gradient.addColorStop(1, `${barColor}80`);

      ctx.fillStyle = gradient;
      ctx.fillRect(x + 1, y, barWidth - 2, barHeight);
    }

    animationRef.current = requestAnimationFrame(draw);
  }, [isActive, width, height, barCount, barColor, backgroundColor]);

  useEffect(() => {
    const initAudio = async () => {
      if (!isActive) {
        // Cleanup when not active
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        if (audioContextRef.current) {
          await audioContextRef.current.close();
          audioContextRef.current = null;
        }
        analyzerRef.current = null;
        dataArrayRef.current = null;
        draw();
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        streamRef.current = stream;

        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;

        const analyzer = audioContext.createAnalyser();
        analyzer.fftSize = 256;
        analyzer.smoothingTimeConstant = 0.8;
        analyzerRef.current = analyzer;

        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyzer);

        const bufferLength = analyzer.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);

        draw();
      } catch (error) {
        console.error('Failed to initialize audio visualization:', error);
        draw();
      }
    };

    initAudio();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [isActive, draw]);

  return (
    <div
      className="audio-visualization"
      aria-label={
        isActive ? 'Audio visualization active' : 'Audio visualization idle'
      }
      role="img"
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ display: 'block' }}
      />
    </div>
  );
};

export default AudioVisualization;
