/**
 * VoiceFlow Audio Worklet Processor
 * 
 * Modern audio processing using AudioWorklet API.
 * This runs on a separate audio rendering thread, preventing main thread blocking.
 * 
 * Benefits over ScriptProcessorNode:
 * - No main thread blocking
 * - Lower latency
 * - No memory leaks from deprecated API
 * - Better performance for continuous audio processing
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor
 */

/**
 * AudioWorklet processor code as a string.
 * This will be converted to a Blob and loaded as a module.
 * Note: AudioWorklet processors must be defined as a separate module.
 */
export const VOICEFLOW_AUDIO_WORKLET_CODE = `
/**
 * VoiceFlowAudioProcessor - AudioWorklet Processor
 * Processes audio in real-time on a dedicated audio thread.
 */
class VoiceFlowAudioProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    
    // Configuration
    this.bufferSize = options?.processorOptions?.bufferSize || 4096;
    this.silenceThreshold = options?.processorOptions?.silenceThreshold || 0.01;
    this.silenceDurationMs = options?.processorOptions?.silenceDurationMs || 2000;
    
    // State
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
    this.isActive = true;
    this.silenceStartTime = null;
    this.lastVoiceActivityTime = currentTime;
    
    // Listen for control messages from main thread
    this.port.onmessage = (event) => {
      const { type, data } = event.data;
      switch (type) {
        case 'stop':
          this.isActive = false;
          break;
        case 'start':
          this.isActive = true;
          this.silenceStartTime = null;
          break;
        case 'configure':
          if (data.silenceThreshold !== undefined) {
            this.silenceThreshold = data.silenceThreshold;
          }
          if (data.silenceDurationMs !== undefined) {
            this.silenceDurationMs = data.silenceDurationMs;
          }
          break;
      }
    };
    
    // Notify main thread that processor is ready
    this.port.postMessage({ type: 'ready' });
  }

  /**
   * Calculate RMS (Root Mean Square) energy for voice activity detection
   */
  calculateRMS(samples) {
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }
    return Math.sqrt(sum / samples.length);
  }

  /**
   * Process audio data
   * @param inputs - Array of input channels
   * @param outputs - Array of output channels
   * @param parameters - AudioParam values
   * @returns boolean - Return true to keep processor alive
   */
  process(inputs, outputs, parameters) {
    // Check if we should continue processing
    if (!this.isActive) {
      return true; // Keep processor alive but don't process
    }

    const input = inputs[0];
    if (!input || !input[0] || input[0].length === 0) {
      return true;
    }

    const inputChannel = input[0]; // Mono input
    const inputLength = inputChannel.length;

    // Copy input samples to buffer
    for (let i = 0; i < inputLength; i++) {
      this.buffer[this.bufferIndex++] = inputChannel[i];
      
      // When buffer is full, process and send
      if (this.bufferIndex >= this.bufferSize) {
        this.processBuffer();
        this.bufferIndex = 0;
      }
    }

    return true; // Keep processor running
  }

  /**
   * Process full buffer and send to main thread
   */
  processBuffer() {
    // Calculate RMS for voice activity detection
    const rms = this.calculateRMS(this.buffer);
    const hasVoiceActivity = rms > this.silenceThreshold;
    const currentTimeMs = currentTime * 1000;

    if (hasVoiceActivity) {
      // Voice detected - send audio data
      this.port.postMessage({
        type: 'audioData',
        data: Array.from(this.buffer), // Convert to regular array for transfer
        rms: rms,
        timestamp: currentTimeMs
      });
      
      // Reset silence tracking
      this.silenceStartTime = null;
      this.lastVoiceActivityTime = currentTimeMs;
      
    } else {
      // Silence detected - track duration
      if (this.silenceStartTime === null) {
        this.silenceStartTime = currentTimeMs;
      }
      
      const silenceDuration = currentTimeMs - this.silenceStartTime;
      
      // Notify about silence progress
      this.port.postMessage({
        type: 'silence',
        duration: silenceDuration,
        threshold: this.silenceDurationMs,
        rms: rms
      });
      
      // Check if silence duration exceeded
      if (silenceDuration >= this.silenceDurationMs) {
        this.port.postMessage({ type: 'silenceTimeout' });
        this.silenceStartTime = null;
      }
    }
  }
}

// Register the processor
registerProcessor('voiceflow-audio-processor', VoiceFlowAudioProcessor);
`;

/**
 * Creates a Blob URL for the AudioWorklet processor module
 * @returns URL string that can be used with audioWorklet.addModule()
 */
export function createAudioWorkletModuleURL(): string {
  const blob = new Blob([VOICEFLOW_AUDIO_WORKLET_CODE], { type: 'application/javascript' });
  return URL.createObjectURL(blob);
}

