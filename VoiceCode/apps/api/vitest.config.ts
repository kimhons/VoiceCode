import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Only run source tests. Without this, vitest also picks up compiled test
    // copies under dist/ (build output), which fail with "Vitest cannot be
    // imported in a CommonJS module using require()".
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
});
