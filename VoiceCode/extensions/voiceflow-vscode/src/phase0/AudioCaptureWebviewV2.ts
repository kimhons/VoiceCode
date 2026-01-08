/**
 * Audio Capture Webview V2
 * 
 * Modern audio capture using AudioWorklet API with ScriptProcessorNode fallback.
 * 
 * Key improvements over V1:
 * - Uses AudioWorklet API (runs on dedicated audio thread)
 * - No main thread blocking
 * - Eliminates memory leaks from deprecated ScriptProcessorNode
 * - Automatic fallback for older browsers
 * - Configurable buffer size and silence detection
 * - Better error handling and resource cleanup
 * 
 * @module phase0/AudioCaptureWebviewV2
 */

import * as vscode from 'vscode';
import { VOICEFLOW_AUDIO_WORKLET_CODE } from './AudioWorkletProcessor';

/**
 * Audio capture configuration options
 */
export interface AudioCaptureConfig {
  /** Buffer size in samples (default: 4096) */
  bufferSize?: number;
  /** Sample rate in Hz (default: 16000) */
  sampleRate?: number;
  /** Silence threshold for voice activity detection (default: 0.01) */
  silenceThreshold?: number;
  /** Silence duration in ms before stopping (default: 2000) */
  silenceDurationMs?: number;
  /** Enable echo cancellation (default: true) */
  echoCancellation?: boolean;
  /** Enable noise suppression (default: true) */
  noiseSuppression?: boolean;
  /** Enable auto gain control (default: true) */
  autoGainControl?: boolean;
}

/**
 * Audio data event payload
 */
export interface AudioDataEvent {
  data: Float32Array;
  rms: number;
  timestamp: number;
}

/**
 * Silence event payload
 */
export interface SilenceEvent {
  duration: number;
  threshold: number;
  rms: number;
}

/** Default configuration */
const DEFAULT_CONFIG: Required<AudioCaptureConfig> = {
  bufferSize: 4096,
  sampleRate: 16000,
  silenceThreshold: 0.01,
  silenceDurationMs: 2000,
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};

/**
 * Audio Capture Webview V2
 * Uses AudioWorklet API with automatic ScriptProcessorNode fallback
 */
export class AudioCaptureWebviewV2 implements vscode.Disposable {
  private panel: vscode.WebviewPanel | null = null;
  private config: Required<AudioCaptureConfig>;
  private disposables: vscode.Disposable[] = [];
  
  // Callbacks
  private onAudioDataCallback: ((event: AudioDataEvent) => void) | null = null;
  private onStopCallback: (() => void) | null = null;
  private onErrorCallback: ((error: Error) => void) | null = null;
  private onSilenceCallback: ((event: SilenceEvent) => void) | null = null;
  private onReadyCallback: (() => void) | null = null;

  // State tracking
  private isCapturing = false;
  private startTime: number = 0;

  constructor(
    private context: vscode.ExtensionContext,
    config?: AudioCaptureConfig
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start audio capture with the provided callbacks
   */
  async startCapture(
    onAudioData: (event: AudioDataEvent) => void,
    onStop: () => void,
    onError: (error: Error) => void,
    options?: {
      onSilence?: (event: SilenceEvent) => void;
      onReady?: () => void;
    }
  ): Promise<void> {
    // Store callbacks
    this.onAudioDataCallback = onAudioData;
    this.onStopCallback = onStop;
    this.onErrorCallback = onError;
    this.onSilenceCallback = options?.onSilence || null;
    this.onReadyCallback = options?.onReady || null;

    // Create webview panel
    this.panel = vscode.window.createWebviewPanel(
      'voiceflowAudioCaptureV2',
      'VoiceFlow Audio Capture',
      { viewColumn: vscode.ViewColumn.One, preserveFocus: true },
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    // Set up message handler
    const messageHandler = this.panel.webview.onDidReceiveMessage(
      this.handleWebviewMessage.bind(this),
      undefined,
      this.context.subscriptions
    );
    this.disposables.push(messageHandler);

    // Handle panel disposal
    this.panel.onDidDispose(() => {
      this.cleanup();
    }, null, this.disposables);

    // Set webview content
    this.panel.webview.html = this.getWebviewContent();

    // Track start time for metrics
    this.startTime = Date.now();

    // Wait for webview to be ready
    await this.waitForReady();

    // Send start command
    this.panel.webview.postMessage({ type: 'start' });
    this.isCapturing = true;
  }

  /**
   * Wait for webview to signal it's ready
   */
  private waitForReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Webview initialization timeout'));
      }, 5000);

      const originalCallback = this.onReadyCallback;
      this.onReadyCallback = () => {
        clearTimeout(timeout);
        originalCallback?.();
        resolve();
      };
    });
  }

  /**
   * Handle messages from webview
   */
  private handleWebviewMessage(message: any): void {
    switch (message.type) {
      case 'audioData':
        if (this.onAudioDataCallback) {
          const audioData = new Float32Array(message.data);
          this.onAudioDataCallback({
            data: audioData,
            rms: message.rms || 0,
            timestamp: message.timestamp || Date.now(),
          });
        }
        break;

      case 'silenceTimeout':
      case 'stopped':
        this.isCapturing = false;
        if (this.onStopCallback) {
          this.onStopCallback();
        }
        break;

      case 'silence':
        if (this.onSilenceCallback) {
          this.onSilenceCallback({
            duration: message.duration,
            threshold: message.threshold,
            rms: message.rms,
          });
        }
        break;

      case 'error':
        if (this.onErrorCallback) {
          this.onErrorCallback(new Error(message.error));
        }
        break;

      case 'ready':
        console.log(`[VoiceFlow] Audio capture ready (mode: ${message.mode || 'unknown'})`);
        if (this.onReadyCallback) {
          this.onReadyCallback();
        }
        break;

      case 'metrics':
        console.log('[VoiceFlow] Audio capture metrics:', message.data);
        break;
    }
  }

  /**
   * Stop audio capture
   */
  stopCapture(): void {
    this.isCapturing = false;

    if (this.panel) {
      this.panel.webview.postMessage({ type: 'stop' });

      // Wait for cleanup before disposing
      setTimeout(() => {
        this.cleanup();
      }, 100);
    }
  }

  /**
   * Update configuration while capturing
   */
  updateConfig(config: Partial<AudioCaptureConfig>): void {
    this.config = { ...this.config, ...config };

    if (this.panel && this.isCapturing) {
      this.panel.webview.postMessage({
        type: 'configure',
        data: {
          silenceThreshold: this.config.silenceThreshold,
          silenceDurationMs: this.config.silenceDurationMs,
        },
      });
    }
  }

  /**
   * Check if currently capturing
   */
  get capturing(): boolean {
    return this.isCapturing;
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    if (this.panel) {
      this.panel.dispose();
      this.panel = null;
    }

    // Clear callbacks
    this.onAudioDataCallback = null;
    this.onStopCallback = null;
    this.onErrorCallback = null;
    this.onSilenceCallback = null;
    this.onReadyCallback = null;

    // Log metrics
    if (this.startTime > 0) {
      const duration = Date.now() - this.startTime;
      console.log(`[VoiceFlow] Audio capture session duration: ${duration}ms`);
      this.startTime = 0;
    }
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    this.stopCapture();

    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables = [];
  }

  /**
   * Escape string for safe embedding in template literal
   */
  private escapeForTemplate(str: string): string {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\$/g, '\\$');
  }

  /**
   * Generate webview HTML content with AudioWorklet and fallback
   */
  private getWebviewContent(): string {
    const config = this.config;
    const escapedWorkletCode = this.escapeForTemplate(VOICEFLOW_AUDIO_WORKLET_CODE);

    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VoiceFlow Audio Capture V2</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
        }
        .status { font-size: 14px; margin-bottom: 10px; }
        .indicator {
            width: 20px; height: 20px;
            border-radius: 50%;
            background-color: #f00;
            animation: pulse 1.5s ease-in-out infinite;
        }
        .mode { font-size: 12px; color: var(--vscode-descriptionForeground); margin-top: 8px; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    </style>
</head>
<body>
    <div class="status">🎤 Listening...</div>
    <div class="indicator"></div>
    <div class="mode" id="mode">Initializing...</div>

    <script>
        const vscode = acquireVsCodeApi();

        // Configuration from extension
        const CONFIG = {
            bufferSize: ${config.bufferSize},
            sampleRate: ${config.sampleRate},
            silenceThreshold: ${config.silenceThreshold},
            silenceDurationMs: ${config.silenceDurationMs},
            echoCancellation: ${config.echoCancellation},
            noiseSuppression: ${config.noiseSuppression},
            autoGainControl: ${config.autoGainControl}
        };

        // State
        let audioContext = null;
        let mediaStream = null;
        let workletNode = null;
        let scriptProcessor = null;
        let isCapturing = false;
        let useAudioWorklet = false;
        let silenceStartTime = null;
        let silenceTimeout = null;
        let buffer = new Float32Array(CONFIG.bufferSize);
        let bufferIndex = 0;

        // AudioWorklet processor code (inline)
        const workletCode = \`${escapedWorkletCode}\`;

        /**
         * Check if AudioWorklet is supported
         */
        function isAudioWorkletSupported() {
            return typeof AudioWorkletNode !== 'undefined' &&
                   typeof AudioContext !== 'undefined' &&
                   AudioContext.prototype.audioWorklet !== undefined;
        }

        /**
         * Create AudioWorklet module from inline code
         */
        async function createWorkletModule(ctx) {
            const blob = new Blob([workletCode], { type: 'application/javascript' });
            const url = URL.createObjectURL(blob);
            try {
                await ctx.audioWorklet.addModule(url);
                return true;
            } catch (error) {
                console.warn('[VoiceFlow] AudioWorklet module load failed:', error);
                return false;
            } finally {
                URL.revokeObjectURL(url);
            }
        }

        /**
         * Calculate RMS energy for voice activity detection
         */
        function calculateRMS(samples) {
            let sum = 0;
            for (let i = 0; i < samples.length; i++) {
                sum += samples[i] * samples[i];
            }
            return Math.sqrt(sum / samples.length);
        }

        /**
         * Start capture with AudioWorklet (modern, non-blocking)
         */
        async function startWithAudioWorklet(source) {
            const workletLoaded = await createWorkletModule(audioContext);
            if (!workletLoaded) {
                throw new Error('AudioWorklet module failed to load');
            }

            workletNode = new AudioWorkletNode(audioContext, 'voiceflow-audio-processor', {
                processorOptions: {
                    bufferSize: CONFIG.bufferSize,
                    silenceThreshold: CONFIG.silenceThreshold,
                    silenceDurationMs: CONFIG.silenceDurationMs
                }
            });

            // Handle messages from AudioWorklet
            workletNode.port.onmessage = (event) => {
                const { type, data, rms, timestamp, duration, threshold } = event.data;

                switch (type) {
                    case 'audioData':
                        vscode.postMessage({ type: 'audioData', data, rms, timestamp });
                        break;
                    case 'silence':
                        vscode.postMessage({ type: 'silence', duration, threshold, rms });
                        break;
                    case 'silenceTimeout':
                        stopCapture();
                        vscode.postMessage({ type: 'silenceTimeout' });
                        break;
                    case 'ready':
                        console.log('[VoiceFlow] AudioWorklet processor ready');
                        break;
                }
            };

            // Connect nodes
            source.connect(workletNode);
            workletNode.connect(audioContext.destination);

            useAudioWorklet = true;
            document.getElementById('mode').textContent = 'Mode: AudioWorklet (optimal)';
        }

        /**
         * Start capture with ScriptProcessor (fallback for older browsers)
         */
        function startWithScriptProcessor(source) {
            // ScriptProcessorNode is deprecated but provides fallback
            scriptProcessor = audioContext.createScriptProcessor(CONFIG.bufferSize, 1, 1);

            scriptProcessor.onaudioprocess = (event) => {
                if (!isCapturing) return;

                const inputData = event.inputBuffer.getChannelData(0);

                // Copy to buffer
                for (let i = 0; i < inputData.length; i++) {
                    buffer[bufferIndex++] = inputData[i];

                    if (bufferIndex >= CONFIG.bufferSize) {
                        processBuffer();
                        bufferIndex = 0;
                    }
                }
            };

            // Connect nodes
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContext.destination);

            useAudioWorklet = false;
            document.getElementById('mode').textContent = 'Mode: ScriptProcessor (fallback)';
        }

        /**
         * Process buffer for ScriptProcessor fallback
         */
        function processBuffer() {
            const rms = calculateRMS(buffer);
            const hasVoice = rms > CONFIG.silenceThreshold;
            const now = Date.now();

            if (hasVoice) {
                vscode.postMessage({
                    type: 'audioData',
                    data: Array.from(buffer),
                    rms: rms,
                    timestamp: now
                });

                silenceStartTime = null;
                if (silenceTimeout) {
                    clearTimeout(silenceTimeout);
                    silenceTimeout = null;
                }
            } else {
                if (silenceStartTime === null) {
                    silenceStartTime = now;
                }

                const silenceDuration = now - silenceStartTime;
                vscode.postMessage({ type: 'silence', duration: silenceDuration, threshold: CONFIG.silenceDurationMs, rms });

                if (!silenceTimeout && silenceDuration >= CONFIG.silenceDurationMs) {
                    stopCapture();
                    vscode.postMessage({ type: 'silenceTimeout' });
                }
            }
        }

        /**
         * Main start capture function
         */
        async function startCapture() {
            if (isCapturing) return;

            try {
                // Request microphone access
                mediaStream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: CONFIG.echoCancellation,
                        noiseSuppression: CONFIG.noiseSuppression,
                        autoGainControl: CONFIG.autoGainControl,
                        sampleRate: CONFIG.sampleRate,
                    }
                });

                // Create audio context
                audioContext = new (window.AudioContext || window.webkitAudioContext)({
                    sampleRate: CONFIG.sampleRate
                });

                const source = audioContext.createMediaStreamSource(mediaStream);

                // Try AudioWorklet first, fall back to ScriptProcessor
                if (isAudioWorkletSupported()) {
                    try {
                        await startWithAudioWorklet(source);
                    } catch (workletError) {
                        console.warn('[VoiceFlow] AudioWorklet failed, using ScriptProcessor:', workletError);
                        startWithScriptProcessor(source);
                    }
                } else {
                    console.log('[VoiceFlow] AudioWorklet not supported, using ScriptProcessor');
                    startWithScriptProcessor(source);
                }

                isCapturing = true;
                console.log('[VoiceFlow] Audio capture started');

            } catch (error) {
                console.error('[VoiceFlow] Failed to start audio capture:', error);
                vscode.postMessage({
                    type: 'error',
                    error: error.message || 'Failed to access microphone'
                });
            }
        }

        /**
         * Stop audio capture and cleanup
         */
        function stopCapture() {
            isCapturing = false;

            if (silenceTimeout) {
                clearTimeout(silenceTimeout);
                silenceTimeout = null;
            }

            if (workletNode) {
                workletNode.port.postMessage({ type: 'stop' });
                workletNode.disconnect();
                workletNode = null;
            }

            if (scriptProcessor) {
                scriptProcessor.disconnect();
                scriptProcessor = null;
            }

            if (audioContext) {
                audioContext.close().catch(console.error);
                audioContext = null;
            }

            if (mediaStream) {
                mediaStream.getTracks().forEach(track => track.stop());
                mediaStream = null;
            }

            console.log('[VoiceFlow] Audio capture stopped');
        }

        // Message handler for extension commands
        window.addEventListener('message', async (event) => {
            const message = event.data;

            switch (message.type) {
                case 'start':
                    await startCapture();
                    break;
                case 'stop':
                    stopCapture();
                    vscode.postMessage({ type: 'stopped' });
                    break;
                case 'configure':
                    if (message.data) {
                        Object.assign(CONFIG, message.data);
                        if (workletNode) {
                            workletNode.port.postMessage({ type: 'configure', data: message.data });
                        }
                    }
                    break;
            }
        });

        // Cleanup on unload
        window.addEventListener('beforeunload', stopCapture);

        // Notify extension that webview is ready
        vscode.postMessage({ type: 'ready', mode: isAudioWorkletSupported() ? 'audioworklet' : 'scriptprocessor' });
    </script>
</body>
</html>`;
  }
}