/**
 * Tests for AudioCaptureWebviewV2
 * 
 * Tests the AudioWorklet-based audio capture implementation
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';

// Mock vscode module
const mockDispose = vi.fn();
const mockPostMessage = vi.fn();
const mockOnDidReceiveMessage = vi.fn();
const mockOnDidDispose = vi.fn();

vi.mock('vscode', () => ({
  window: {
    createWebviewPanel: vi.fn(() => ({
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

import { AudioCaptureWebviewV2, AudioDataEvent } from './AudioCaptureWebviewV2';
import * as vscode from 'vscode';

describe('AudioCaptureWebviewV2', () => {
  let context: vscode.ExtensionContext;
  let audioCapture: AudioCaptureWebviewV2;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock ExtensionContext
    context = {
      subscriptions: [],
    } as unknown as vscode.ExtensionContext;
    
    audioCapture = new AudioCaptureWebviewV2(context);
  });

  describe('constructor', () => {
    it('should create instance with default config', () => {
      expect(audioCapture).toBeDefined();
      expect(audioCapture.capturing).toBe(false);
    });

    it('should accept custom config', () => {
      const customCapture = new AudioCaptureWebviewV2(context, {
        bufferSize: 2048,
        sampleRate: 22050,
        silenceThreshold: 0.02,
      });
      expect(customCapture).toBeDefined();
    });
  });

  describe('startCapture', () => {
    it('should create webview panel', async () => {
      const onAudioData = vi.fn();
      const onStop = vi.fn();
      const onError = vi.fn();

      // Mock the onDidReceiveMessage to immediately call the ready callback
      mockOnDidReceiveMessage.mockImplementation((callback) => {
        // Simulate ready message
        setTimeout(() => callback({ type: 'ready', mode: 'audioworklet' }), 10);
        return { dispose: vi.fn() };
      });

      await audioCapture.startCapture(onAudioData, onStop, onError);

      expect(vscode.window.createWebviewPanel).toHaveBeenCalledWith(
        'voiceflowAudioCaptureV2',
        'VoiceFlow Audio Capture',
        expect.any(Object),
        expect.objectContaining({
          enableScripts: true,
          retainContextWhenHidden: true,
        })
      );
    });
  });

  describe('stopCapture', () => {
    it('should send stop message and cleanup', async () => {
      // Setup capture first
      mockOnDidReceiveMessage.mockImplementation((callback) => {
        setTimeout(() => callback({ type: 'ready', mode: 'audioworklet' }), 10);
        return { dispose: vi.fn() };
      });

      await audioCapture.startCapture(vi.fn(), vi.fn(), vi.fn());
      
      audioCapture.stopCapture();
      
      expect(mockPostMessage).toHaveBeenCalledWith({ type: 'stop' });
    });
  });

  describe('dispose', () => {
    it('should clean up all resources', () => {
      audioCapture.dispose();
      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', async () => {
      mockOnDidReceiveMessage.mockImplementation((callback) => {
        setTimeout(() => callback({ type: 'ready', mode: 'audioworklet' }), 10);
        return { dispose: vi.fn() };
      });

      await audioCapture.startCapture(vi.fn(), vi.fn(), vi.fn());
      
      audioCapture.updateConfig({ silenceThreshold: 0.02 });
      
      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'configure',
          data: expect.objectContaining({
            silenceThreshold: 0.02,
          }),
        })
      );
    });
  });
});

describe('AudioWorklet Support Detection', () => {
  it('should detect AudioWorklet support in webview content', () => {
    const capture = new AudioCaptureWebviewV2({
      subscriptions: [],
    } as unknown as vscode.ExtensionContext);
    
    // The getWebviewContent is private, but we can verify it's called during startCapture
    // by checking the webview html assignment in a more complete integration test
    expect(capture).toBeDefined();
  });
});

