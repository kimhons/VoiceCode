/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Vitest Configuration for VoiceFlow PRO VSCode Extension
 *
 * Optimized for VSCode extension testing with:
 * - jsdom environment for DOM simulation
 * - Proper module resolution for VSCode APIs
 * - Coverage reporting with v8 provider
 * - Extended timeouts for extension operations
 */
export default defineConfig({
  test: {
    // Use jsdom for DOM environment simulation (required for webview testing)
    environment: 'jsdom',

    // Enable global test functions (describe, it, expect, vi) without imports
    globals: true,

    // Test file patterns
    include: [
      'src/**/*.{test,spec}.{js,ts}',
    ],

    // Exclude directories
    exclude: [
      'node_modules/**',
      'dist/**',
      'out/**',
      'coverage/**',
      '.vscode-test/**',
    ],

    // Test timeout - extended for VSCode extension operations
    testTimeout: 30000,

    // Hook timeout for setup/teardown
    hookTimeout: 15000,

    // Setup files to run before tests
    setupFiles: ['./src/test/setup.ts'],

    // Mock reset behavior
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,

    // Reporter configuration
    reporters: ['default'],

    // Coverage configuration
    coverage: {
      enabled: false, // Enable with --coverage flag
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'dist/**',
        'out/**',
        'coverage/**',
        '.vscode-test/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/*.benchmark.ts',
      ],
      thresholds: {
        // Coverage thresholds - adjust as needed
        global: {
          branches: 60,
          functions: 60,
          lines: 60,
          statements: 60,
        },
      },
    },

    // Pool configuration for test isolation
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
      },
    },
  },

  // Path resolution aliases
  resolve: {
    alias: {
      // Mock vscode module - it's a host-only module not available in tests
      'vscode': path.resolve(__dirname, './src/test/__mocks__/vscode.ts'),
      // Alias for source directory
      '@': path.resolve(__dirname, './src'),
      '@services': path.resolve(__dirname, './src/services'),
      '@providers': path.resolve(__dirname, './src/providers'),
      '@types': path.resolve(__dirname, './src/types'),
      '@controllers': path.resolve(__dirname, './src/controllers'),
      '@managers': path.resolve(__dirname, './src/managers'),
      '@ui': path.resolve(__dirname, './src/ui'),
    },
  },

  // esbuild configuration for TypeScript
  esbuild: {
    target: 'node18',
  },
});

