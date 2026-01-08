/**
 * Vitest Global Type Declarations
 *
 * This file provides TypeScript type definitions for vitest globals
 * when using globals: true in vitest.config.ts
 */

import type {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
  test,
  Mock,
  MockInstance,
  Mocked,
  MockedFunction,
  SpyInstance,
} from 'vitest';

declare global {
  // Test suite functions
  const describe: typeof import('vitest').describe;
  const it: typeof import('vitest').it;
  const test: typeof import('vitest').test;
  
  // Assertions
  const expect: typeof import('vitest').expect;
  
  // Lifecycle hooks
  const beforeEach: typeof import('vitest').beforeEach;
  const afterEach: typeof import('vitest').afterEach;
  const beforeAll: typeof import('vitest').beforeAll;
  const afterAll: typeof import('vitest').afterAll;
  
  // Mocking
  const vi: typeof import('vitest').vi;
  
  // Mock types
  type Mock<T = any, Y extends any[] = any[]> = import('vitest').Mock<T, Y>;
  type MockInstance<T = any, Y extends any[] = any[]> = import('vitest').MockInstance<T, Y>;
  type Mocked<T> = import('vitest').Mocked<T>;
  type MockedFunction<T extends (...args: any[]) => any> = import('vitest').MockedFunction<T>;
  type SpyInstance<T = any, Y extends any[] = any[]> = import('vitest').SpyInstance<T, Y>;
}

export {};

