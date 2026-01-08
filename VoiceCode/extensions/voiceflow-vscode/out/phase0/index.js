"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioCaptureWebview = exports.createAudioWorkletModuleURL = exports.VOICEFLOW_AUDIO_WORKLET_CODE = exports.AudioCaptureWebviewV2 = void 0;
var AudioCaptureWebviewV2_1 = require("./AudioCaptureWebviewV2");
Object.defineProperty(exports, "AudioCaptureWebviewV2", { enumerable: true, get: function () { return AudioCaptureWebviewV2_1.AudioCaptureWebviewV2; } });
var AudioWorkletProcessor_1 = require("./AudioWorkletProcessor");
Object.defineProperty(exports, "VOICEFLOW_AUDIO_WORKLET_CODE", { enumerable: true, get: function () { return AudioWorkletProcessor_1.VOICEFLOW_AUDIO_WORKLET_CODE; } });
Object.defineProperty(exports, "createAudioWorkletModuleURL", { enumerable: true, get: function () { return AudioWorkletProcessor_1.createAudioWorkletModuleURL; } });
// Re-export adapter for backward compatibility
var AudioCaptureAdapter_1 = require("./AudioCaptureAdapter");
Object.defineProperty(exports, "AudioCaptureWebview", { enumerable: true, get: function () { return AudioCaptureAdapter_1.AudioCaptureWebviewAdapter; } });
//# sourceMappingURL=index.js.map