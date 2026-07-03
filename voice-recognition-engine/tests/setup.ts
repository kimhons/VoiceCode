/**
 * Test setup for VoiceFlow Pro Voice Recognition Engine
 */

import { jest } from '@jest/globals';

// Mock Web Speech API
global.SpeechRecognition = class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  maxAlternatives = 1;
  grammars: any = {};
  serviceURI = '';
  
  lang = 'en-US';
  
  onstart: ((this: any, ev: Event) => any) | null = null;
  onend: ((this: any, ev: Event) => any) | null = null;
  onresult: ((this: any, ev: any) => any) | null = null;
  onerror: ((this: any, ev: any) => any) | null = null;
  onsoundstart: ((this: any, ev: Event) => any) | null = null;
  onsoundend: ((this: any, ev: Event) => any) | null = null;
  onspeechstart: ((this: any, ev: Event) => any) | null = null;
  onspeechend: ((this: any, ev: Event) => any) | null = null;
  
  start(): void {
    setTimeout(() => {
      if (this.onstart) this.onstart(new Event('start'));
    }, 10);
  }
  
  stop(): void {
    setTimeout(() => {
      if (this.onend) this.onend(new Event('end'));
    }, 10);
  }
  
  abort(): void {
    if (this.onend) this.onend(new Event('end'));
  }
};

// Mock webkitSpeechRecognition as well
(global as any).webkitSpeechRecognition = global.SpeechRecognition;

// Mock getUserMedia
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: jest.fn().mockImplementation((constraints: MediaStreamConstraints): Promise<MediaStream> => {
      return Promise.resolve({
        getTracks: () => [{
          stop: jest.fn(),
          getSettings: jest.fn(() => ({}))
        }],
        getAudioTracks: () => [{
          stop: jest.fn(),
          getSettings: jest.fn(() => ({}))
        }]
      } as MediaStream);
    })
  }
});

// Mock AudioContext
global.AudioContext = class MockAudioContext {
  sampleRate = 44100;
  state = 'running';
  
  createMediaStreamSource = jest.fn().mockReturnValue({
    connect: jest.fn()
  });
  
  createAnalyser = jest.fn().mockReturnValue({
    fftSize: 2048,
    smoothingTimeConstant: 0.8,
    frequencyBinCount: 1024,
    getByteFrequencyData: jest.fn(),
    getByteTimeDomainData: jest.fn(),
    disconnect: jest.fn()
  });
  
  close = jest.fn().mockResolvedValue(undefined);
  resume = jest.fn().mockResolvedValue(undefined);
  suspend = jest.fn().mockResolvedValue(undefined);
};

// Mock HTMLCanvasElement for visualizer tests
(global as any).HTMLCanvasElement = class MockCanvasElement {
  width = 800;
  height = 600;
  getContext = jest.fn().mockReturnValue({
    fillStyle: '',
    fillRect: jest.fn(),
    strokeStyle: '',
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn()
  });
};

// Global test utilities
global.requestAnimationFrame = jest.fn().mockImplementation((callback: FrameRequestCallback) => {
  return setTimeout(callback, 16); // ~60fps
});

global.cancelAnimationFrame = jest.fn();

// Suppress console warnings during tests
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Set up test timeout
jest.setTimeout(30000); // 30 seconds for async operations