// VoiceCode Mobile - App Root Smoke Test

import { describe, it, expect } from '@jest/globals';
import App from './App';
import { store } from './src/store';

// A full render of <App /> is impractical under jest: jest.setup.js replaces
// @react-navigation's NavigationContainer with a passthrough, so the real
// navigators AppNavigator mounts cannot register. This smoke test instead
// exercises the root module graph — importing App.tsx pulls in the store, the
// theme/onboarding providers, Stripe, and AppNavigator, so any import-time crash
// in that wiring fails here — and confirms the root component and store are wired.

describe('App', () => {
  it('exposes the root component from the app entry module', () => {
    expect(typeof App).toBe('function');
    expect(App.name).toBe('App');
  });

  it('wires up the Redux store with the auth slice the app depends on', () => {
    expect(store.getState()).toHaveProperty('auth');
    expect(store.getState().auth).toHaveProperty('isAuthenticated');
  });
});
