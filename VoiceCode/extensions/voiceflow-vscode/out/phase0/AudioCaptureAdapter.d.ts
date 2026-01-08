/**
 * Audio Capture Adapter
 *
 * Provides backward compatibility with the old AudioCaptureWebview API
 * while using the new AudioWorklet-based implementation internally.
 *
 * This allows existing code to continue working without changes
 * while benefiting from the performance improvements.
 *
 * @module phase0/AudioCaptureAdapter
 */
import * as vscode from 'vscode';
/**
 * Backward-compatible adapter for AudioCaptureWebview
 *
 * Drop-in replacement for the legacy AudioCaptureWebview class.
 * Uses AudioWorklet internally but exposes the same API.
 */
export declare class AudioCaptureWebviewAdapter implements vscode.Disposable {
    private v2Instance;
    constructor(context: vscode.ExtensionContext);
    /**
     * Start audio capture (legacy API)
     *
     * @param onAudioData - Callback for audio data (receives Float32Array)
     * @param onStop - Callback when capture stops
     * @param onError - Callback for errors
     */
    startCapture(onAudioData: (audioData: Float32Array) => void, onStop: () => void, onError: (error: Error) => void): Promise<void>;
    /**
     * Stop audio capture
     */
    stopCapture(): void;
    /**
     * Dispose resources
     */
    dispose(): void;
}
//# sourceMappingURL=AudioCaptureAdapter.d.ts.map