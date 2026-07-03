/**
 * Audio processing and noise reduction module
 * Implements advanced noise reduction algorithms for better voice recognition
 */

import { AudioConfig, AudioMetrics } from '../types';

export class AudioProcessor {
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private microphoneNode: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private audioConfig: AudioConfig;
  private noiseProfile: Float32Array | null = null;
  private isInitialized = false;

  constructor(config: Partial<AudioConfig> = {}) {
    this.audioConfig = {
      sampleRate: 44100,
      channels: 1,
      bufferSize: 4096,
      noiseReductionLevel: 0.7,
      echoCancellation: true,
      autoGainControl: true,
      beamforming: false,
      ...config
    };
  }

  async initialize(): Promise<void> {
    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: this.audioConfig.sampleRate
      });

      // Request microphone access with specific constraints
      const constraints: MediaStreamConstraints = {
        audio: {
          sampleRate: this.audioConfig.sampleRate,
          channelCount: this.audioConfig.channels,
          echoCancellation: this.audioConfig.echoCancellation,
          autoGainControl: this.audioConfig.autoGainControl,
          noiseSuppression: this.audioConfig.noiseReductionLevel > 0,
          volume: 1.0
        },
        video: false
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Create audio nodes
      this.microphoneNode = this.audioContext.createMediaStreamSource(this.stream);
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 2048;
      this.analyserNode.smoothingTimeConstant = 0.8;

      // Connect nodes
      this.microphoneNode.connect(this.analyserNode);

      // Initialize noise profile
      await this.calibrateNoiseProfile();

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize audio processor:', error);
      throw new Error(`Audio initialization failed: ${error}`);
    }
  }

  private async calibrateNoiseProfile(duration: number = 2000): Promise<void> {
    if (!this.analyserNode) {
      throw new Error('Audio processor not initialized');
    }

    const bufferLength = this.analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const noiseProfile = new Float32Array(bufferLength);

    const startTime = Date.now();
    const sampleCount = Math.floor((duration / 1000) * (this.audioConfig.sampleRate / this.analyserNode.fftSize));

    for (let i = 0; i < sampleCount; i++) {
      this.analyserNode.getByteFrequencyData(dataArray);
      
      for (let j = 0; j < bufferLength; j++) {
        noiseProfile[j] += dataArray[j];
      }
    }

    // Average the noise profile
    for (let i = 0; i < bufferLength; i++) {
      noiseProfile[i] /= sampleCount;
    }

    this.noiseProfile = noiseProfile;
  }

  async startRecording(): Promise<MediaStream> {
    if (!this.stream) {
      throw new Error('Audio processor not initialized');
    }

    // Resume audio context if suspended
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }

    return this.stream;
  }

  stopRecording(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    this.cleanup();
  }

  getAudioMetrics(): AudioMetrics {
    if (!this.analyserNode) {
      throw new Error('Audio processor not initialized');
    }

    const bufferLength = this.analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const timeDataArray = new Uint8Array(this.analyserNode.fftSize);

    this.analyserNode.getByteFrequencyData(dataArray);
    this.analyserNode.getByteTimeDomainData(timeDataArray);

    // Calculate volume (RMS)
    let sum = 0;
    for (let i = 0; i < timeDataArray.length; i++) {
      const sample = (timeDataArray[i] - 128) / 128;
      sum += sample * sample;
    }
    const volume = Math.sqrt(sum / timeDataArray.length);

    // Calculate signal-to-noise ratio
    const snr = this.calculateSNR(dataArray);

    // Detect clipping
    const clipping = timeDataArray.some(sample => sample > 250 || sample < 5);

    // Calculate latency estimation
    const latency = this.estimateLatency(dataArray);

    // Check for buffer underrun
    const bufferUnderrun = this.detectBufferUnderrun(timeDataArray);

    return {
      volume,
      signalToNoiseRatio: snr,
      clipping,
      latency,
      bufferUnderrun
    };
  }

  private calculateSNR(frequencyData: Uint8Array): number {
    if (!this.noiseProfile) {
      return 0;
    }

    let signalPower = 0;
    let noisePower = 0;

    for (let i = 0; i < frequencyData.length; i++) {
      const signal = frequencyData[i] / 255;
      const noise = this.noiseProfile[i] / 255;
      
      signalPower += signal * signal;
      noisePower += noise * noise;
    }

    signalPower /= frequencyData.length;
    noisePower /= frequencyData.length;

    if (noisePower === 0) return Infinity;

    return 10 * Math.log10(signalPower / noisePower);
  }

  private estimateLatency(frequencyData: Uint8Array): number {
    // Simple latency estimation based on frequency content
    // Higher frequencies typically indicate higher latency
    let highFreqEnergy = 0;
    let totalEnergy = 0;

    for (let i = frequencyData.length * 0.7; i < frequencyData.length; i++) {
      highFreqEnergy += frequencyData[i];
    }

    for (let i = 0; i < frequencyData.length; i++) {
      totalEnergy += frequencyData[i];
    }

    const highFreqRatio = totalEnergy > 0 ? highFreqEnergy / totalEnergy : 0;
    
    // Estimate latency based on high frequency content (0-50ms range)
    return Math.min(50, highFreqRatio * 100);
  }

  private detectBufferUnderrun(timeData: Uint8Array): boolean {
    // Detect sudden drops in audio level that might indicate buffer issues
    let transitions = 0;
    const threshold = 20;

    for (let i = 1; i < timeData.length; i++) {
      const diff = Math.abs(timeData[i] - timeData[i - 1]);
      if (diff > threshold && timeData[i] < 50) {
        transitions++;
      }
    }

    return transitions > 5;
  }

  applyNoiseReduction(audioData: Float32Array): Float32Array {
    if (!this.noiseProfile || this.audioConfig.noiseReductionLevel === 0) {
      return audioData;
    }

    // Apply spectral subtraction noise reduction
    const fftSize = 2048;
    const hopLength = fftSize / 4;
    const processedData = new Float32Array(audioData.length);

    for (let i = 0; i < audioData.length - fftSize; i += hopLength) {
      const frame = audioData.slice(i, i + fftSize);
      const windowed = this.applyHannWindow(frame);
      const fft = this.computeFFT(windowed);
      
      const processedFFT = this.spectralSubtraction(fft);
      const timeDomain = this.computeIFFT(processedFFT);
      
      // Overlap-add
      for (let j = 0; j < timeDomain.length && i + j < processedData.length; j++) {
        processedData[i + j] += timeDomain[j] * 0.5; // Overlap factor
      }
    }

    return processedData;
  }

  private applyHannWindow(frame: Float32Array): Float32Array {
    const windowed = new Float32Array(frame.length);
    for (let i = 0; i < frame.length; i++) {
      const window = 0.5 * (1 - Math.cos(2 * Math.PI * i / (frame.length - 1)));
      windowed[i] = frame[i] * window;
    }
    return windowed;
  }

  private computeFFT(frame: Float32Array): ComplexArray {
    // Simple FFT implementation (in production, use a proper FFT library)
    const size = frame.length;
    const result = new ComplexArray(size);
    
    for (let k = 0; k < size; k++) {
      let real = 0;
      let imag = 0;
      
      for (let n = 0; n < size; n++) {
        const angle = -2 * Math.PI * k * n / size;
        real += frame[n] * Math.cos(angle);
        imag += frame[n] * Math.sin(angle);
      }
      
      result.set(k, { real, imag });
    }
    
    return result;
  }

  private computeIFFT(fft: ComplexArray): Float32Array {
    const size = fft.length;
    const result = new Float32Array(size);
    
    for (let n = 0; n < size; n++) {
      let real = 0;
      
      for (let k = 0; k < size; k++) {
        const angle = 2 * Math.PI * k * n / size;
        const complex = fft.get(k);
        real += complex.real * Math.cos(angle) - complex.imag * Math.sin(angle);
      }
      
      result[n] = real / size;
    }
    
    return result;
  }

  private spectralSubtraction(fft: ComplexArray): ComplexArray {
    if (!this.noiseProfile) return fft;

    const result = new ComplexArray(fft.length);
    const reduction = this.audioConfig.noiseReductionLevel;

    for (let i = 0; i < fft.length; i++) {
      const magnitude = Math.sqrt(fft.get(i).real * fft.get(i).real + fft.get(i).imag * fft.get(i).imag);
      const noise = (this.noiseProfile[i] || 0) / 255;
      
      // Spectral subtraction
      const enhancedMagnitude = Math.max(0, magnitude - reduction * noise * magnitude);
      const phase = Math.atan2(fft.get(i).imag, fft.get(i).real);
      
      result.set(i, {
        real: enhancedMagnitude * Math.cos(phase),
        imag: enhancedMagnitude * Math.sin(phase)
      });
    }

    return result;
  }

  async calibrateMicrophone(): Promise<void> {
    if (!this.stream) {
      throw new Error('No microphone stream available');
    }

    const settings = this.stream.getAudioTracks()[0].getSettings();
    
    // Check microphone capabilities
    if (!settings.echoCancellation && this.audioConfig.echoCancellation) {
      console.warn('Microphone does not support echo cancellation');
    }

    if (!settings.autoGainControl && this.audioConfig.autoGainControl) {
      console.warn('Microphone does not support auto gain control');
    }

    // Adjust settings based on capability
    if (settings.sampleRate) {
      this.audioConfig.sampleRate = Math.min(settings.sampleRate, this.audioConfig.sampleRate);
    }

    console.log('Microphone calibrated:', settings);
  }

  getAudioLevel(): number {
    if (!this.isInitialized) {
      return 0;
    }
    
    const metrics = this.getAudioMetrics();
    return metrics.volume;
  }

  getNoiseLevel(): number {
    if (!this.noiseProfile) {
      return 0;
    }
    
    const noiseSum = this.noiseProfile.reduce((sum, val) => sum + val, 0);
    return noiseSum / this.noiseProfile.length / 255;
  }

  isAudioActive(threshold: number = 0.01): boolean {
    return this.getAudioLevel() > threshold;
  }

  cleanup(): void {
    this.stopRecording();
    
    if (this.microphoneNode) {
      this.microphoneNode.disconnect();
    }

    if (this.analyserNode) {
      this.analyserNode.disconnect();
    }

    if (this.audioContext) {
      this.audioContext.close();
    }

    this.isInitialized = false;
  }

  dispose(): void {
    this.cleanup();
    this.noiseProfile = null;
  }
}

// Helper class for complex number operations
class ComplexArray {
  private array: { real: number; imag: number }[] = [];

  constructor(size: number) {
    this.array = new Array(size).fill({ real: 0, imag: 0 });
  }

  get(index: number): { real: number; imag: number } {
    return this.array[index];
  }

  set(index: number, value: { real: number; imag: number }): void {
    this.array[index] = value;
  }

  get length(): number {
    return this.array.length;
  }
}

// Audio visualization utilities
export class AudioVisualizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private analyser: AnalyserNode;
  private animationId: number | null = null;

  constructor(canvas: HTMLCanvasElement, analyser: AnalyserNode) {
    this.canvas = canvas;
    this.analyser = analyser;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2D context from canvas');
    }
    this.ctx = context;
  }

  startVisualization(color: string = '#00ff88'): void {
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      this.animationId = requestAnimationFrame(draw);
      
      this.analyser.getByteFrequencyData(dataArray);

      // Clear canvas
      this.ctx.fillStyle = '#000000';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Draw frequency bars
      const barWidth = (this.canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * this.canvas.height;
        
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, this.canvas.height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
      }
    };

    draw();
  }

  stopVisualization(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  showWaveform(): void {
    const bufferLength = this.analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      this.animationId = requestAnimationFrame(draw);
      
      this.analyser.getByteTimeDomainData(dataArray);

      // Clear canvas
      this.ctx.fillStyle = '#000000';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Draw waveform
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = '#00ff88';
      this.ctx.beginPath();

      const sliceWidth = this.canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * this.canvas.height / 2;

        if (i === 0) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      this.ctx.stroke();
    };

    draw();
  }

  /**
   * Process audio data with optional noise reduction and normalization
   */
  async processAudio(
    audioData: Float32Array,
    options: {
      sampleRate?: number;
      enableNoiseReduction?: boolean;
      enableNormalization?: boolean;
    } = {}
  ): Promise<Float32Array> {
    let processed = new Float32Array(audioData);

    if (options.enableNoiseReduction !== false && this.audioConfig.noiseReductionLevel > 0) {
      processed = this.reduceNoise(processed, options.sampleRate || this.audioConfig.sampleRate);
    }

    if (options.enableNormalization) {
      processed = this.normalizeAudio(processed);
    }

    return processed;
  }

  /**
   * Reduce noise from audio using spectral subtraction
   */
  reduceNoise(audioData: Float32Array, sampleRate: number): Float32Array {
    const frameSize = Math.min(2048, audioData.length);
    const output = new Float32Array(audioData.length);

    for (let i = 0; i < audioData.length; i += frameSize) {
      const frame = audioData.slice(i, i + frameSize);
      const windowedFrame = this.applyHannWindow(frame);
      
      // Pad frame if necessary
      const paddedFrame = new Float32Array(frameSize);
      paddedFrame.set(windowedFrame.slice(0, Math.min(windowedFrame.length, frameSize)));

      // Apply FFT
      const fft = this.computeFFT(paddedFrame);
      
      // Apply spectral subtraction
      const cleanFFT = this.spectralSubtraction(fft);
      
      // Apply IFFT
      const cleanFrame = this.computeIFFT(cleanFFT);

      // Copy to output
      for (let j = 0; j < frameSize && i + j < output.length; j++) {
        output[i + j] = cleanFrame[j] * 0.5 + frame[j] * 0.5; // Blend with original
      }
    }

    return output;
  }

  /**
   * Detect voice activity in audio data
   */
  detectVoiceActivity(
    audioData: Float32Array,
    options: {
      threshold?: number;
      minDuration?: number;
      sampleRate?: number;
    } = {}
  ): {
    hasSpeech: boolean;
    speechSegments: Array<{ start: number; end: number }>;
  } {
    const threshold = options.threshold || 0.1;
    const minDuration = options.minDuration || 100; // ms
    const sampleRate = options.sampleRate || this.audioConfig.sampleRate;
    const frameSize = Math.floor(sampleRate * minDuration / 1000);
    
    const segments: Array<{ start: number; end: number }> = [];
    let inSpeech = false;
    let segmentStart = 0;

    for (let i = 0; i < audioData.length; i += frameSize) {
      const frame = audioData.slice(i, i + frameSize);
      const energy = this.calculateFrameEnergy(frame);

      if (energy > threshold && !inSpeech) {
        inSpeech = true;
        segmentStart = i;
      } else if (energy <= threshold && inSpeech) {
        inSpeech = false;
        if (i - segmentStart >= frameSize) {
          segments.push({
            start: segmentStart / sampleRate,
            end: i / sampleRate
          });
        }
      }
    }

    // Handle case where speech continues to the end
    if (inSpeech) {
      segments.push({
        start: segmentStart / sampleRate,
        end: audioData.length / sampleRate
      });
    }

    return {
      hasSpeech: segments.length > 0,
      speechSegments: segments
    };
  }

  /**
   * Normalize audio levels to prevent clipping
   */
  normalizeAudio(audioData: Float32Array, targetLevel: number = 0.8): Float32Array {
    let maxAmplitude = 0;
    
    // Find maximum amplitude
    for (let i = 0; i < audioData.length; i++) {
      const amplitude = Math.abs(audioData[i]);
      if (amplitude > maxAmplitude) {
        maxAmplitude = amplitude;
      }
    }

    if (maxAmplitude === 0) {
      return audioData;
    }

    // Calculate normalization factor
    const normalizationFactor = targetLevel / maxAmplitude;
    
    // Apply normalization
    const normalized = new Float32Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
      normalized[i] = audioData[i] * normalizationFactor;
    }

    return normalized;
  }

  /**
   * Calculate frame energy for voice activity detection
   */
  private calculateFrameEnergy(frame: Float32Array): number {
    let energy = 0;
    for (let i = 0; i < frame.length; i++) {
      energy += frame[i] * frame[i];
    }
    return Math.sqrt(energy / frame.length);
  }
}