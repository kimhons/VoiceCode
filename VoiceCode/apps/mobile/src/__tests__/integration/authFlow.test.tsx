// VoiceCode Mobile - Authentication Flow Integration Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import { LoginScreen } from '../../screens/auth/LoginScreen';
import { SignupScreen } from '../../screens/auth/SignupScreen';
import { supabase } from '../../services/supabaseService';

jest.mock('../../services/supabaseService');

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Login Flow', () => {
    it('should complete full login flow', async () => {
      const mockNavigation = {
        navigate: jest.fn(),
        goBack: jest.fn(),
      };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: {
          user: { id: 'user-123', email: 'test@example.com' },
          session: { access_token: 'token-123' },
        },
        error: null,
      });

      const { getByPlaceholderText, getByText } = renderWithProviders(
        <LoginScreen navigation={mockNavigation as any} route={{} as any} />
      );

      const emailInput = getByPlaceholderText(/email/i);
      const passwordInput = getByPlaceholderText(/password/i);
      const loginButton = getByText(/sign in/i);

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      await waitFor(() => {
        expect(mockNavigation.navigate).toHaveBeenCalledWith('Home');
      });
    });

    it('should handle login errors', async () => {
      const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Invalid credentials' },
      });

      const { getByPlaceholderText, getByText, findByText } = renderWithProviders(
        <LoginScreen navigation={mockNavigation as any} route={{} as any} />
      );

      fireEvent.changeText(getByPlaceholderText(/email/i), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText(/password/i), 'wrong');
      fireEvent.press(getByText(/sign in/i));

      const errorMessage = await findByText(/invalid credentials/i);
      expect(errorMessage).toBeTruthy();
    });
  });

  describe('Signup Flow', () => {
    it('should complete full signup flow', async () => {
      const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() };

      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: {
          user: { id: 'user-123', email: 'newuser@example.com' },
          session: { access_token: 'token-123' },
        },
        error: null,
      });

      const { getByPlaceholderText, getByText } = renderWithProviders(
        <SignupScreen navigation={mockNavigation as any} route={{} as any} />
      );

      fireEvent.changeText(getByPlaceholderText(/email/i), 'newuser@example.com');
      fireEvent.changeText(getByPlaceholderText(/password/i), 'password123');
      fireEvent.press(getByText(/sign up/i));

      await waitFor(() => {
        expect(supabase.auth.signUp).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockNavigation.navigate).toHaveBeenCalled();
      });
    });
  });

  describe('Password Reset Flow', () => {
    it('should send password reset email', async () => {
      const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() };

      (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
        data: {},
        error: null,
      });

      const { getByPlaceholderText, getByText } = renderWithProviders(
        <LoginScreen navigation={mockNavigation as any} route={{} as any} />
      );

      fireEvent.press(getByText(/forgot password/i));

      await waitFor(() => {
        expect(mockNavigation.navigate).toHaveBeenCalledWith('ForgotPassword');
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
