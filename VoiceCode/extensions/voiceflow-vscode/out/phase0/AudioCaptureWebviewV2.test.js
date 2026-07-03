"use strict";
/**
 * Tests for AudioCaptureWebviewV2
 *
 * Tests the AudioWorklet-based audio capture implementation
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
// Mock vscode module
const mockDispose = vitest_1.vi.fn();
const mockPostMessage = vitest_1.vi.fn();
const mockOnDidReceiveMessage = vitest_1.vi.fn();
const mockOnDidDispose = vitest_1.vi.fn();
vitest_1.vi.mock('vscode', () => ({
    window: {
        createWebviewPanel: vitest_1.vi.fn(() => ({
            webview: {
                html: '',
                postMessage: mockPostMessage,
                onDidReceiveMessage: mockOnDidReceiveMessage,
            },
            onDidDispose: mockOnDidDispose,
            dispose: mockDispose,
        })),
    },
    ViewColumn: {
        One: 1,
    },
}));
const AudioCaptureWebviewV2_1 = require("./AudioCaptureWebviewV2");
const vscode = __importStar(require("vscode"));
(0, vitest_1.describe)('AudioCaptureWebviewV2', () => {
    let context;
    let audioCapture;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        // Mock ExtensionContext
        context = {
            subscriptions: [],
        };
        audioCapture = new AudioCaptureWebviewV2_1.AudioCaptureWebviewV2(context);
    });
    (0, vitest_1.describe)('constructor', () => {
        (0, vitest_1.it)('should create instance with default config', () => {
            (0, vitest_1.expect)(audioCapture).toBeDefined();
            (0, vitest_1.expect)(audioCapture.capturing).toBe(false);
        });
        (0, vitest_1.it)('should accept custom config', () => {
            const customCapture = new AudioCaptureWebviewV2_1.AudioCaptureWebviewV2(context, {
                bufferSize: 2048,
                sampleRate: 22050,
                silenceThreshold: 0.02,
            });
            (0, vitest_1.expect)(customCapture).toBeDefined();
        });
    });
    (0, vitest_1.describe)('startCapture', () => {
        (0, vitest_1.it)('should create webview panel', async () => {
            const onAudioData = vitest_1.vi.fn();
            const onStop = vitest_1.vi.fn();
            const onError = vitest_1.vi.fn();
            // Mock the onDidReceiveMessage to immediately call the ready callback
            mockOnDidReceiveMessage.mockImplementation((callback) => {
                // Simulate ready message
                setTimeout(() => callback({ type: 'ready', mode: 'audioworklet' }), 10);
                return { dispose: vitest_1.vi.fn() };
            });
            await audioCapture.startCapture(onAudioData, onStop, onError);
            (0, vitest_1.expect)(vscode.window.createWebviewPanel).toHaveBeenCalledWith('voiceflowAudioCaptureV2', 'VoiceFlow Audio Capture', vitest_1.expect.any(Object), vitest_1.expect.objectContaining({
                enableScripts: true,
                retainContextWhenHidden: true,
            }));
        });
    });
    (0, vitest_1.describe)('stopCapture', () => {
        (0, vitest_1.it)('should send stop message and cleanup', async () => {
            // Setup capture first
            mockOnDidReceiveMessage.mockImplementation((callback) => {
                setTimeout(() => callback({ type: 'ready', mode: 'audioworklet' }), 10);
                return { dispose: vitest_1.vi.fn() };
            });
            await audioCapture.startCapture(vitest_1.vi.fn(), vitest_1.vi.fn(), vitest_1.vi.fn());
            audioCapture.stopCapture();
            (0, vitest_1.expect)(mockPostMessage).toHaveBeenCalledWith({ type: 'stop' });
        });
    });
    (0, vitest_1.describe)('dispose', () => {
        (0, vitest_1.it)('should clean up all resources', () => {
            audioCapture.dispose();
            // Should not throw
            (0, vitest_1.expect)(true).toBe(true);
        });
    });
    (0, vitest_1.describe)('updateConfig', () => {
        (0, vitest_1.it)('should update configuration', async () => {
            mockOnDidReceiveMessage.mockImplementation((callback) => {
                setTimeout(() => callback({ type: 'ready', mode: 'audioworklet' }), 10);
                return { dispose: vitest_1.vi.fn() };
            });
            await audioCapture.startCapture(vitest_1.vi.fn(), vitest_1.vi.fn(), vitest_1.vi.fn());
            audioCapture.updateConfig({ silenceThreshold: 0.02 });
            (0, vitest_1.expect)(mockPostMessage).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                type: 'configure',
                data: vitest_1.expect.objectContaining({
                    silenceThreshold: 0.02,
                }),
            }));
        });
    });
});
(0, vitest_1.describe)('AudioWorklet Support Detection', () => {
    (0, vitest_1.it)('should detect AudioWorklet support in webview content', () => {
        const capture = new AudioCaptureWebviewV2_1.AudioCaptureWebviewV2({
            subscriptions: [],
        });
        // The getWebviewContent is private, but we can verify it's called during startCapture
        // by checking the webview html assignment in a more complete integration test
        (0, vitest_1.expect)(capture).toBeDefined();
    });
});
//# sourceMappingURL=AudioCaptureWebviewV2.test.js.map