// VoiceFlow Pro Mobile - Jest Configuration

module.exports = {
  preset: 'jest-expo',
  // Watchman can't crawl a repo under macOS ~/Documents (TCC denies it); the node
  // crawler works and keeps tests deterministic in CI/sandbox.
  watchman: false,
  // The optional `.pnpm/<pkg>@<ver>/node_modules/` prefix is required because pnpm
  // stores deps under node_modules/.pnpm/…; without it, react-native/expo packages
  // are matched as `.pnpm` (not in the allowlist) and left untransformed, which fails
  // on their Flow syntax (`SyntaxError: Unexpected identifier 'ErrorHandler'`).
  transformIgnorePatterns: [
    'node_modules/(?!(\\.pnpm/[^/]+/node_modules/)?((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg))',
  ],
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    '<rootDir>/jest.setup.js',
  ],
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
    '!src/**/__tests__/**',
    '!src/**/index.ts',
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'node',
};

