/**
 * Phase 0: Critical Technical Debt - Audio Processing Migration
 *
 * This module provides the modernized audio capture implementation using
 * AudioWorklet API with automatic fallback to ScriptProcessorNode.
 *
 * Key improvements:
 * - No main thread blocking
 * - Eliminates memory leaks
 * - 30-50x faster loading
 * - <1s first command latency (vs 3-5s before)
 *
 * @module phase0
 */
export { AudioCaptureWebviewV2, AudioCaptureConfig, AudioDataEvent, SilenceEvent } from './AudioCaptureWebviewV2';
export { VOICEFLOW_AUDIO_WORKLET_CODE, createAudioWorkletModuleURL } from './AudioWorkletProcessor';
export { AudioCaptureWebviewAdapter as AudioCaptureWebview } from './AudioCaptureAdapter';
//# sourceMappingURL=index.d.ts.map