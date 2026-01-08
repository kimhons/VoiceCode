/**
 * Vitest Test Setup File
 *
 * This file runs before each test file and sets up the test environment.
 * It configures mocks for VSCode APIs and other global dependencies.
 */
declare class MockIDBFactory {
    open: import("vitest").Mock<(...args: any[]) => any>;
    deleteDatabase: import("vitest").Mock<(...args: any[]) => any>;
}
declare class MockIDBDatabase {
    objectStoreNames: {
        contains: import("vitest").Mock<(...args: any[]) => any>;
    };
    createObjectStore: import("vitest").Mock<(...args: any[]) => any>;
    transaction: import("vitest").Mock<(...args: any[]) => any>;
    close: import("vitest").Mock<(...args: any[]) => any>;
}
declare class MockAudioContext {
    state: string;
    sampleRate: number;
    currentTime: number;
    createMediaStreamSource: import("vitest").Mock<(...args: any[]) => any>;
    createScriptProcessor: import("vitest").Mock<(...args: any[]) => any>;
    createAnalyser: import("vitest").Mock<(...args: any[]) => any>;
    resume: import("vitest").Mock<(...args: any[]) => any>;
    suspend: import("vitest").Mock<(...args: any[]) => any>;
    close: import("vitest").Mock<(...args: any[]) => any>;
}
export { MockIDBFactory, MockIDBDatabase, MockAudioContext };
//# sourceMappingURL=setup.d.ts.map