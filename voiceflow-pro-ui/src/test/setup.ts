/**
 * Test setup for VoiceFlow Pro UI Components
 */

import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock Web Audio API
global.AudioContext = class MockAudioContext {
  sampleRate = 44100;
  state = 'running';
  
  createMediaStreamSource = () => ({
    connect: () => ({})
  });
  
  createAnalyser = () => ({
    fftSize: 2048,
    smoothingTimeConstant: 0.8,
    frequencyBinCount: 1024,
    getByteFrequencyData: () => {},
    getByteTimeDomainData: () => {},
    disconnect: () => {}
  });
  
  createGain = () => ({
    connect: () => {},
    disconnect: () => {},
    gain: { value: 1 }
  });
  
  close = () => Promise.resolve();
  resume = () => Promise.resolve();
  suspend = () => Promise.resolve();
};

// Mock MediaRecorder
global.MediaRecorder = class MockMediaRecorder {
  static isTypeSupported = vi.fn().mockReturnValue(true);
  
  state = 'inactive';
  stream: MediaStream;
  
  constructor(stream: MediaStream) {
    this.stream = stream;
  }
  
  start = vi.fn();
  stop = vi.fn();
  pause = vi.fn();
  resume = vi.fn();
  
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
};

// Mock getUserMedia
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn(), getSettings: vi.fn() }],
      getAudioTracks: () => [{ stop: vi.fn(), getSettings: vi.fn() }]
    }),
    enumerateDevices: vi.fn().mockResolvedValue([]),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }
});

// Mock speech synthesis
global.speechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  getVoices: () => [],
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
};

// Mock Web Speech API
global.SpeechRecognition = class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  maxAlternatives = 1;
  lang = 'en-US';
  
  onstart: ((ev: Event) => void) | null = null;
  onend: ((ev: Event) => void) | null = null;
  onresult: ((ev: any) => void) | null = null;
  onerror: ((ev: any) => void) | null = null;
  
  start(): void {
    setTimeout(() => {
      this.onstart?.(new Event('start'));
      // Simulate recognition result
      const mockResult = {
        resultIndex: 0,
        results: {
          length: 1,
          [0]: {
            length: 1,
            [0]: {
              transcript: 'Hello world',
              confidence: 0.9
            },
            isFinal: true
          }
        }
      };
      this.onresult?.(mockResult);
      setTimeout(() => this.onend?.(new Event('end')), 100);
    }, 50);
  }
  
  stop(): void {
    this.onend?.(new Event('end'));
  }
  
  abort(): void {
    this.onend?.(new Event('end'));
  }
};

// Mock CSS.escape
global.CSS = {
  ...global.CSS,
  escape: (str: string) => str.replace(/[^a-zA-Z0-9_-]/g, '\\$&')
};

// Mock window.HTMLMediaElement
(global as any).HTMLMediaElement = class MockHTMLMediaElement {
  src = '';
  currentTime = 0;
  duration = 0;
  paused = true;
  volume = 1;
  
  play = vi.fn().mockResolvedValue(undefined);
  pause = vi.fn();
  load = vi.fn();
  
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
};

// Mock canvas elements
(global as any).HTMLCanvasElement = class MockCanvasElement {
  width = 800;
  height = 600;
  getContext = vi.fn().mockReturnValue({
    fillStyle: '',
    fillRect: vi.fn(),
    strokeStyle: '',
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    clearRect: vi.fn()
  });
};

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn().mockImplementation((callback: FrameRequestCallback) => {
  return setTimeout(callback, 16); // ~60fps
});

global.cancelAnimationFrame = vi.fn();

// Mock performance.now
global.performance = {
  now: () => Date.now(),
} as any;

// Suppress console warnings during tests
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  console.warn = vi.fn();
  console.error = vi.fn();
});

afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});

// Clean up after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Add custom matchers for audio testing
expect.extend({
  toBeValidAudioLevel(received: number) {
    const pass = received >= 0 && received <= 1 && typeof received === 'number';
    return {
      message: () => `expected ${received} to be a valid audio level (0-1)`,
      pass
    };
  },
  
  toBeValidFrequency(received: number) {
    const pass = received >= 0 && received <= 22050 && typeof received === 'number';
    return {
      message: () => `expected ${received} to be a valid frequency (0-22050 Hz)`,
      pass
    };
  }
});