// VoiceCode Mobile - Test Utilities
// Comprehensive testing utilities for React Native Testing Library

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { configureStore, PreloadedState } from '@reduxjs/toolkit';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { AuthProvider } from '../../contexts/AuthContext';
import { RootState, rootReducer } from '../../store';

/**
 * Custom render function that wraps components with all necessary providers
 */
interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: PreloadedState<RootState>;
  store?: ReturnType<typeof configureStore>;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState = {},
    store = configureStore({
      reducer: rootReducer,
      preloadedState,
    }),
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <SafeAreaProvider>
          <ThemeProvider>
            <AuthProvider>
              <NavigationContainer>{children}</NavigationContainer>
            </AuthProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </Provider>
    );
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

/**
 * Create a mock navigation object for testing
 */
export function createMockNavigation(overrides = {}) {
  return {
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
    setParams: jest.fn(),
    dispatch: jest.fn(),
    setOptions: jest.fn(),
    isFocused: jest.fn(() => true),
    canGoBack: jest.fn(() => true),
    getId: jest.fn(),
    getParent: jest.fn(),
    getState: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    ...overrides,
  };
}

/**
 * Create a mock route object for testing
 */
export function createMockRoute(params = {}, overrides = {}) {
  return {
    key: 'test-route',
    name: 'TestScreen',
    params,
    ...overrides,
  };
}

/**
 * Wait for async operations to complete
 */
export const waitForAsync = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Mock AsyncStorage
 */
export const mockAsyncStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
};

/**
 * Mock Supabase client
 */
export const mockSupabaseClient = {
  auth: {
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(),
    resetPasswordForEmail: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  })),
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(),
      download: jest.fn(),
      remove: jest.fn(),
      getPublicUrl: jest.fn(),
    })),
  },
};

/**
 * Create mock user for testing
 */
export function createMockUser(overrides = {}) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create mock transcript for testing
 */
export function createMockTranscript(overrides = {}) {
  return {
    id: 'test-transcript-id',
    user_id: 'test-user-id',
    title: 'Test Recording',
    content: 'This is a test transcript.',
    duration: 120,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Suppress console errors/warnings in tests
 */
export function suppressConsole() {
  const originalError = console.error;
  const originalWarn = console.warn;

  beforeAll(() => {
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
    console.warn = originalWarn;
  });
}

/**
 * Mock timers helper
 */
export function setupTimers() {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });
}

// Re-export everything from @testing-library/react-native
export * from '@testing-library/react-native';
