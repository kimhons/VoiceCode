import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Tauri API
vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: vi.fn(),
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
  emit: vi.fn(),
}));

vi.mock('@tauri-apps/api/window', () => ({
  appWindow: {
    hide: vi.fn(),
    show: vi.fn(),
    minimize: vi.fn(),
    maximize: vi.fn(),
    close: vi.fn(),
  },
  Window: vi.fn(),
}));

// Mock Speech Recognition API
const mockSpeechRecognition = vi.fn().mockImplementation(() => ({
  start: vi.fn(),
  stop: vi.fn(),
  abort: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  onstart: null,
  onend: null,
  onerror: null,
  onresult: null,
  continuous: false,
  interimResults: false,
  lang: 'en-US',
}));

Object.defineProperty(window, 'SpeechRecognition', {
  writable: true,
  value: mockSpeechRecognition,
});

Object.defineProperty(window, 'webkitSpeechRecognition', {
  writable: true,
  value: mockSpeechRecognition,
});

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
  },
  writable: true,
});

// Mock matchMedia for theme detection
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
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

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock IndexedDB
const indexedDBMock = {
  open: vi.fn(),
};
Object.defineProperty(window, 'indexedDB', { value: indexedDBMock });
