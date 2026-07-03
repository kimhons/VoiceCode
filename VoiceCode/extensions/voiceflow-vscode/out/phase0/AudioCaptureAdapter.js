"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioCaptureWebviewAdapter = void 0;
const AudioCaptureWebviewV2_1 = require("./AudioCaptureWebviewV2");
/**
 * Backward-compatible adapter for AudioCaptureWebview
 *
 * Drop-in replacement for the legacy AudioCaptureWebview class.
 * Uses AudioWorklet internally but exposes the same API.
 */
class AudioCaptureWebviewAdapter {
    v2Instance;
    constructor(context) {
        this.v2Instance = new AudioCaptureWebviewV2_1.AudioCaptureWebviewV2(context);
    }
    /**
     * Start audio capture (legacy API)
     *
     * @param onAudioData - Callback for audio data (receives Float32Array)
     * @param onStop - Callback when capture stops
     * @param onError - Callback for errors
     */
    async startCapture(onAudioData, onStop, onError) {
        // Wrap the legacy callback to match new API
        const wrappedOnAudioData = (event) => {
            onAudioData(event.data);
        };
        await this.v2Instance.startCapture(wrappedOnAudioData, onStop, onError);
    }
    /**
     * Stop audio capture
     */
    stopCapture() {
        this.v2Instance.stopCapture();
    }
    /**
     * Dispose resources
     */
    dispose() {
        this.v2Instance.dispose();
    }
}
exports.AudioCaptureWebviewAdapter = AudioCaptureWebviewAdapter;
//# sourceMappingURL=AudioCaptureAdapter.js.map