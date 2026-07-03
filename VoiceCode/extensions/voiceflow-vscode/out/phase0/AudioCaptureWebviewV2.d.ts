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
/**
 * Audio Capture Webview V2
 * Uses AudioWorklet API with automatic ScriptProcessorNode fallback
 */
export declare class AudioCaptureWebviewV2 implements vscode.Disposable {
    private context;
    private panel;
    private config;
    private disposables;
    private onAudioDataCallback;
    private onStopCallback;
    private onErrorCallback;
    private onSilenceCallback;
    private onReadyCallback;
    private isCapturing;
    private startTime;
    constructor(context: vscode.ExtensionContext, config?: AudioCaptureConfig);
    /**
     * Start audio capture with the provided callbacks
     */
    startCapture(onAudioData: (event: AudioDataEvent) => void, onStop: () => void, onError: (error: Error) => void, options?: {
        onSilence?: (event: SilenceEvent) => void;
        onReady?: () => void;
    }): Promise<void>;
    /**
     * Wait for webview to signal it's ready
     */
    private waitForReady;
    /**
     * Handle messages from webview
     */
    private handleWebviewMessage;
    /**
     * Stop audio capture
     */
    stopCapture(): void;
    /**
     * Update configuration while capturing
     */
    updateConfig(config: Partial<AudioCaptureConfig>): void;
    /**
     * Check if currently capturing
     */
    get capturing(): boolean;
    /**
     * Cleanup resources
     */
    private cleanup;
    /**
     * Dispose all resources
     */
    dispose(): void;
    /**
     * Escape string for safe embedding in template literal
     */
    private escapeForTemplate;
    /**
     * Generate webview HTML content with AudioWorklet and fallback
     */
    private getWebviewContent;
}
//# sourceMappingURL=AudioCaptureWebviewV2.d.ts.map