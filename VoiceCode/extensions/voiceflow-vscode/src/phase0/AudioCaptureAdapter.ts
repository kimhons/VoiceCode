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
import { AudioCaptureWebviewV2, AudioDataEvent } from './AudioCaptureWebviewV2';

/**
 * Backward-compatible adapter for AudioCaptureWebview
 * 
 * Drop-in replacement for the legacy AudioCaptureWebview class.
 * Uses AudioWorklet internally but exposes the same API.
 */
export class AudioCaptureWebviewAdapter implements vscode.Disposable {
  private v2Instance: AudioCaptureWebviewV2;

  constructor(context: vscode.ExtensionContext) {
    this.v2Instance = new AudioCaptureWebviewV2(context);
  }

  /**
   * Start audio capture (legacy API)
   * 
   * @param onAudioData - Callback for audio data (receives Float32Array)
   * @param onStop - Callback when capture stops
   * @param onError - Callback for errors
   */
  async startCapture(
    onAudioData: (audioData: Float32Array) => void,
    onStop: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    // Wrap the legacy callback to match new API
    const wrappedOnAudioData = (event: AudioDataEvent) => {
      onAudioData(event.data);
    };

    await this.v2Instance.startCapture(
      wrappedOnAudioData,
      onStop,
      onError
    );
  }

  /**
   * Stop audio capture
   */
  stopCapture(): void {
    this.v2Instance.stopCapture();
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.v2Instance.dispose();
  }
}

