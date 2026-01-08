/**
 * Vitest Test Setup File
 * 
 * This file runs before each test file and sets up the test environment.
 * It configures mocks for VSCode APIs and other global dependencies.
 */

import { vi, beforeEach, afterEach } from 'vitest';

// Setup global mocks that need to be available before tests run

// Mock console methods to reduce noise in tests (optional - comment out for debugging)
// vi.spyOn(console, 'log').mockImplementation(() => {});
// vi.spyOn(console, 'warn').mockImplementation(() => {});
// vi.spyOn(console, 'error').mockImplementation(() => {});

// Mock IndexedDB for browser-like APIs
class MockIDBFactory {
  open = vi.fn().mockImplementation((name: string, version?: number) => {
    const request = {
      result: null as any,
      error: null as any,
      onsuccess: null as any,
      onerror: null as any,
      onupgradeneeded: null as any,
    };
    
    // Simulate async open
    setTimeout(() => {
      if (request.onsuccess) {
        request.result = new MockIDBDatabase();
        request.onsuccess({ target: request });
      }
    }, 0);
    
    return request;
  });
  
  deleteDatabase = vi.fn().mockImplementation((name: string) => {
    const request = {
      onsuccess: null as any,
      onerror: null as any,
    };
    setTimeout(() => {
      if (request.onsuccess) {
        request.onsuccess({});
      }
    }, 0);
    return request;
  });
}

class MockIDBDatabase {
  objectStoreNames = {
    contains: vi.fn().mockReturnValue(false),
  };
  
  createObjectStore = vi.fn().mockReturnValue({
    createIndex: vi.fn(),
  });
  
  transaction = vi.fn().mockReturnValue({
    objectStore: vi.fn().mockReturnValue({
      get: vi.fn().mockReturnValue({
        onsuccess: null as any,
        onerror: null as any,
        result: null,
      }),
      put: vi.fn().mockReturnValue({
        onsuccess: null as any,
        onerror: null as any,
      }),
      delete: vi.fn().mockReturnValue({
        onsuccess: null as any,
        onerror: null as any,
      }),
      clear: vi.fn().mockReturnValue({
        onsuccess: null as any,
        onerror: null as any,
      }),
    }),
  });
  
  close = vi.fn();
}

// Set up IndexedDB mock globally
(globalThis as any).indexedDB = new MockIDBFactory();

// Mock fetch if needed
(globalThis as any).fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: vi.fn().mockResolvedValue({}),
  text: vi.fn().mockResolvedValue(''),
  blob: vi.fn().mockResolvedValue(new Blob()),
  arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
});

// Mock URL.createObjectURL and URL.revokeObjectURL
(globalThis as any).URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
(globalThis as any).URL.revokeObjectURL = vi.fn();

// Mock AudioContext for audio-related tests
class MockAudioContext {
  state = 'running';
  sampleRate = 16000;
  currentTime = 0;
  
  createMediaStreamSource = vi.fn().mockReturnValue({
    connect: vi.fn(),
    disconnect: vi.fn(),
  });
  
  createScriptProcessor = vi.fn().mockReturnValue({
    connect: vi.fn(),
    disconnect: vi.fn(),
    onaudioprocess: null,
  });
  
  createAnalyser = vi.fn().mockReturnValue({
    connect: vi.fn(),
    disconnect: vi.fn(),
    fftSize: 2048,
    getByteTimeDomainData: vi.fn(),
    getByteFrequencyData: vi.fn(),
  });
  
  resume = vi.fn().mockResolvedValue(undefined);
  suspend = vi.fn().mockResolvedValue(undefined);
  close = vi.fn().mockResolvedValue(undefined);
}

(globalThis as any).AudioContext = MockAudioContext;
(globalThis as any).webkitAudioContext = MockAudioContext;

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Export mocks for use in tests
export { MockIDBFactory, MockIDBDatabase, MockAudioContext };

