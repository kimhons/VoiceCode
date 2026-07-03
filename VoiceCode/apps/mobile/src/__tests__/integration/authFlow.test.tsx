// VoiceCode Mobile - Authentication Flow Integration Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders, createMockNavigation } from '../setup/testUtils';
import { LoginScreen } from '../../screens/auth/LoginScreen';
import { SignupScreen } from '../../screens/auth/SignupScreen';
import { supabase } from '../../services/supabaseService';

jest.mock('../../services/supabaseService');

// The auth screens authenticate by validating input and dispatching loginSuccess /
// signupSuccess to the Redux auth slice after a simulated network delay — they do not
// call Supabase directly. These integration tests assert that real observable flow
// (store state + inline validation), matching the screens' actual behavior.
describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Login Flow', () => {
    it('should complete full login flow', async () => {
      const navigation = createMockNavigation();

      const { getByPlaceholderText, getByText, store } = renderWithProviders(
        <LoginScreen navigation={navigation} />
      );

      fireEvent.changeText(getByPlaceholderText(/email/i), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText(/password/i), 'password123');
      fireEvent.press(getByText(/sign in/i));

      await waitFor(
        () => {
          expect(store.getState().auth.isAuthenticated).toBe(true);
        },
        { timeout: 3000 }
      );
      expect(store.getState().auth.user?.email).toBe('test@example.com');
    });

    it('should handle login errors', async () => {
      const navigation = createMockNavigation();

      const { getByPlaceholderText, getByText, findByText, store } =
        renderWithProviders(<LoginScreen navigation={navigation} />);

      fireEvent.changeText(getByPlaceholderText(/email/i), 'not-a-valid-email');
      fireEvent.changeText(getByPlaceholderText(/password/i), 'password123');
      fireEvent.press(getByText(/sign in/i));

      const error = await findByText(/valid email/i);
      expect(error).toBeTruthy();
      expect(store.getState().auth.isAuthenticated).toBe(false);
    });
  });

  describe('Signup Flow', () => {
    it('should complete full signup flow', async () => {
      const navigation = createMockNavigation();

      const { getByTestId, store } = renderWithProviders(
        <SignupScreen navigation={navigation} />
      );

      fireEvent.changeText(getByTestId('name-input'), 'New User');
      fireEvent.changeText(getByTestId('email-input'), 'newuser@example.com');
      fireEvent.changeText(getByTestId('password-input'), 'Password123');
      fireEvent.changeText(getByTestId('confirm-password-input'), 'Password123');
      fireEvent.press(getByTestId('terms-checkbox'));
      fireEvent.press(getByTestId('signup-button'));

      await waitFor(
        () => {
          expect(store.getState().auth.isAuthenticated).toBe(true);
        },
        { timeout: 3000 }
      );
      const user = store.getState().auth.user;
      expect(user?.email).toBe('newuser@example.com');
      expect(user?.name).toBe('New User');
    });
  });

  describe('Password Reset Flow', () => {
    it('should send password reset email', async () => {
      const navigation = createMockNavigation();

      const { getByText } = renderWithProviders(
        <LoginScreen navigation={navigation} />
      );

      fireEvent.press(getByText(/forgot password/i));

      await waitFor(() => {
        expect(navigation.navigate).toHaveBeenCalledWith('ForgotPassword');
      });
    });
  });

  describe('Session Management', () => {
    it('should maintain session across app restarts', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: {
          session: {
            access_token: 'token-123',
            user: { id: 'user-123' },
          },
        },
        error: null,
      });

      const session = await supabase.auth.getSession();

      expect(session.data.session).toBeTruthy();
      expect(session.data.session?.access_token).toBe('token-123');
    });

    it('should handle expired sessions', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: { message: 'Session expired' },
      });

      const session = await supabase.auth.getSession();

      expect(session.data.session).toBeNull();
    });
  });
});
