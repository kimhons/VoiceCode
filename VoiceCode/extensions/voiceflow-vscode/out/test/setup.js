"use strict";
/**
 * Vitest Test Setup File
 *
 * This file runs before each test file and sets up the test environment.
 * It configures mocks for VSCode APIs and other global dependencies.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockAudioContext = exports.MockIDBDatabase = exports.MockIDBFactory = void 0;
const vitest_1 = require("vitest");
// Setup global mocks that need to be available before tests run
// Mock console methods to reduce noise in tests (optional - comment out for debugging)
// vi.spyOn(console, 'log').mockImplementation(() => {});
// vi.spyOn(console, 'warn').mockImplementation(() => {});
// vi.spyOn(console, 'error').mockImplementation(() => {});
// Mock IndexedDB for browser-like APIs
class MockIDBFactory {
    open = vitest_1.vi.fn().mockImplementation((name, version) => {
        const request = {
            result: null,
            error: null,
            onsuccess: null,
            onerror: null,
            onupgradeneeded: null,
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
    deleteDatabase = vitest_1.vi.fn().mockImplementation((name) => {
        const request = {
            onsuccess: null,
            onerror: null,
        };
        setTimeout(() => {
            if (request.onsuccess) {
                request.onsuccess({});
            }
        }, 0);
        return request;
    });
}
exports.MockIDBFactory = MockIDBFactory;
class MockIDBDatabase {
    objectStoreNames = {
        contains: vitest_1.vi.fn().mockReturnValue(false),
    };
    createObjectStore = vitest_1.vi.fn().mockReturnValue({
        createIndex: vitest_1.vi.fn(),
    });
    transaction = vitest_1.vi.fn().mockReturnValue({
        objectStore: vitest_1.vi.fn().mockReturnValue({
            get: vitest_1.vi.fn().mockReturnValue({
                onsuccess: null,
                onerror: null,
                result: null,
            }),
            put: vitest_1.vi.fn().mockReturnValue({
                onsuccess: null,
                onerror: null,
            }),
            delete: vitest_1.vi.fn().mockReturnValue({
                onsuccess: null,
                onerror: null,
            }),
            clear: vitest_1.vi.fn().mockReturnValue({
                onsuccess: null,
                onerror: null,
            }),
        }),
    });
    close = vitest_1.vi.fn();
}
exports.MockIDBDatabase = MockIDBDatabase;
// Set up IndexedDB mock globally
globalThis.indexedDB = new MockIDBFactory();
// Mock fetch if needed
globalThis.fetch = vitest_1.vi.fn().mockResolvedValue({
    ok: true,
    json: vitest_1.vi.fn().mockResolvedValue({}),
    text: vitest_1.vi.fn().mockResolvedValue(''),
    blob: vitest_1.vi.fn().mockResolvedValue(new Blob()),
    arrayBuffer: vitest_1.vi.fn().mockResolvedValue(new ArrayBuffer(0)),
});
// Mock URL.createObjectURL and URL.revokeObjectURL
globalThis.URL.createObjectURL = vitest_1.vi.fn().mockReturnValue('blob:mock-url');
globalThis.URL.revokeObjectURL = vitest_1.vi.fn();
// Mock AudioContext for audio-related tests
class MockAudioContext {
    state = 'running';
    sampleRate = 16000;
    currentTime = 0;
    createMediaStreamSource = vitest_1.vi.fn().mockReturnValue({
        connect: vitest_1.vi.fn(),
        disconnect: vitest_1.vi.fn(),
    });
    createScriptProcessor = vitest_1.vi.fn().mockReturnValue({
        connect: vitest_1.vi.fn(),
        disconnect: vitest_1.vi.fn(),
        onaudioprocess: null,
    });
    createAnalyser = vitest_1.vi.fn().mockReturnValue({
        connect: vitest_1.vi.fn(),
        disconnect: vitest_1.vi.fn(),
        fftSize: 2048,
        getByteTimeDomainData: vitest_1.vi.fn(),
        getByteFrequencyData: vitest_1.vi.fn(),
    });
    resume = vitest_1.vi.fn().mockResolvedValue(undefined);
    suspend = vitest_1.vi.fn().mockResolvedValue(undefined);
    close = vitest_1.vi.fn().mockResolvedValue(undefined);
}
exports.MockAudioContext = MockAudioContext;
globalThis.AudioContext = MockAudioContext;
globalThis.webkitAudioContext = MockAudioContext;
// Reset mocks between tests
(0, vitest_1.beforeEach)(() => {
    vitest_1.vi.clearAllMocks();
});
(0, vitest_1.afterEach)(() => {
    vitest_1.vi.restoreAllMocks();
});
//# sourceMappingURL=setup.js.map