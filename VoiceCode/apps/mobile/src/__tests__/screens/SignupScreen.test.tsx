// VoiceCode Mobile - Signup Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import { SignupScreen } from '../../screens/auth/SignupScreen';

describe('SignupScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    replace: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render signup form', () => {
      const { getByTestId } = renderWithProviders(
        <SignupScreen navigation={mockNavigation} />
      );

      expect(getByTestId('name-input')).toBeTruthy();
      expect(getByTestId('email-input')).toBeTruthy();
      expect(getByTestId('password-input')).toBeTruthy();
      expect(getByTestId('confirm-password-input')).toBeTruthy();
    });

    it('should display signup button', () => {
      const { getByTestId } = renderWithProviders(
        <SignupScreen navigation={mockNavigation} />
      );

      expect(getByTestId('signup-button')).toBeTruthy();
    });

    it('should display social signup options', () => {
      const { getByTestId } = renderWithProviders(
        <SignupScreen navigation={mockNavigation} />
      );

      expect(getByTestId('google-signup')).toBeTruthy();
      expect(getByTestId('apple-signup')).toBeTruthy();
    });

    it('should show login link', () => {
      const { getByText } = renderWithProviders(
        <SignupScreen navigation={mockNavigation} />
      );

      expect(getByText(/already have an account/i)).toBeTruthy();
    });
  });

  describe('Validation', () => {
    it('should validate empty name', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <SignupScreen navigation={mockNavigation} />
      );

      fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
      fireEvent.changeText(getByTestId('password-input'), 'Password123!');
      fireEvent.changeText(getByTestId('confirm-password-input'), 'Password123!');
      fireEvent.press(getByTestId('signup-button'));

      const error = await findByText(/name is required/i);
      expect(error).toBeTruthy();
    });

    it('should validate email format', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <SignupScreen navigation={mockNavigation} />
      );

      fireEvent.changeText(getByTestId('name-input'), 'Test User');
      fireEvent.changeText(getByTestId('email-input'), 'invalid-email');
      fireEvent.changeText(getByTestId('password-input'), 'Password123!');
      fireEvent.changeText(getByTestId('confirm-password-input'), 'Password123!');
      fireEvent.press(getByTestId('signup-button'));

      const error = await findByText(/valid email/i);
      expect(error).toBeTruthy();
    });

    it('should validate password strength', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <SignupScreen navigation={mockNavigation} />
      );

      fireEvent.changeText(getByTestId('name-input'), 'Test User');
      fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
      fireEvent.changeText(getByTestId('password-input'), 'weak');
      fireEvent.changeText(getByTestId('confirm-password-input'), 'weak');
      fireEvent.press(getByTestId('signup-button'));

      const error = await findByText(/password.*characters/i);
      expect(error).toBeTruthy();
    });

    it('should validate password match', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <SignupScreen navigation={mockNavigation} />
      );

      fireEvent.changeText(getByTestId('name-input'), 'Test User');
      fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
      fireEvent.changeText(getByTestId('password-input'), 'Password123!');
      fireEvent.changeText(getByTestId('confirm-password-input'), 'Different123!');
      fireEvent.press(getByTestId('signup-button'));

      const error = await findByText(/passwords.*match/i);
      expect(error).toBeTruthy();
    });
  });

  describe('Signup Flow', () => {
    // NOTE: The screen's real signup logic (handleSignup) validates the form and,
    // on success, dispatches signupSuccess to the Redux auth slice — it does not
    // call Supabase, so these tests assert the screen's actual observable behavior
    // (auth state) rather than a Supabase client that the screen never invokes.
    it('should authenticate the user on successful signup', async () => {
      const { getByTestId, store } = renderWithProviders(
        <SignupScreen navigation={mockNavigation} />
      );

      fireEvent.changeText(getByTestId('name-input'), 'Test User');
      fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
      fireEvent.changeText(getByTestId('password-input'), 'Password123!');
      fireEvent.changeText(getByTestId('confirm-password-input'), 'Password123!');
      fireEvent.press(getByTestId('terms-checkbox'));
      fireEvent.press(getByTestId('signup-button'));

      await waitFor(
        () => {
          expect(store.getState().auth.isAuthenticated).toBe(true);
        },
        { timeout: 3000 }
      );
    });

    it('should store the entered account details on signup', async () => {
      const { getByTestId, store } = renderWithProviders(
        <SignupScreen navigation={mockNavigation} />
      );

      fireEvent.changeText(getByTestId('name-input'), 'Test User');
      fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
      fireEvent.changeText(getByTestId('password-input'), 'Password123!');
      fireEvent.changeText(getByTestId('confirm-password-input'), 'Password123!');
      fireEvent.press(getByTestId('terms-checkbox'));
      fireEvent.press(getByTestId('signup-button'));

      await waitFor(
        () => {
          const user = store.getState().auth.user;
          expect(user?.email).toBe('test@example.com');
          expect(user?.name).toBe('Test User');
        },
        { timeout: 3000 }
      );
    });

    // The screen has no server-side signup error path; its only error handling is
    // client-side validation, which must block signup and surface an inline error.
    it('should not authenticate when the form is invalid', async () => {
      const { getByTestId, findByText, store } = renderWithProviders(
        <SignupScreen navigation={mockNavigation} />
      );

      fireEvent.changeText(getByTestId('name-input'), 'Test User');
      fireEvent.changeText(getByTestId('email-input'), 'not-an-email');
      fireEvent.changeText(getByTestId('password-input'), 'Password123!');
      fireEvent.changeText(getByTestId('confirm-password-input'), 'Password123!');
      fireEvent.press(getByTestId('terms-checkbox'));
      fireEvent.press(getByTestId('signup-button'));

      const error = await findByText(/valid email/i);
      expect(error).toBeTruthy();
      expect(store.getState().auth.isAuthenticated).toBe(false);
    });
  });

  describe('Navigation', () => {
    it('should navigate to login', () => {
      const { getByText } = renderWithProviders(
        <SignupScreen navigation={mockNavigation} />
      );

      fireEvent.press(getByText(/already have an account/i));

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Login');
    });
  });

  describe('Terms and Privacy', () => {
    it('should require accepting terms', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <SignupScreen navigation={mockNavigation} />
      );

      fireEvent.changeText(getByTestId('name-input'), 'Test User');
      fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
      fireEvent.changeText(getByTestId('password-input'), 'Password123!');
      fireEvent.changeText(getByTestId('confirm-password-input'), 'Password123!');
      // Don't accept terms
      fireEvent.press(getByTestId('signup-button'));

      const error = await findByText(/accept.*terms/i);
      expect(error).toBeTruthy();
    });

    it('should open terms of service', () => {
      const { getByText } = renderWithProviders(
        <SignupScreen navigation={mockNavigation} />
      );

      fireEvent.press(getByText(/terms of service/i));

      expect(mockNavigation.navigate).toHaveBeenCalledWith('WebView', expect.any(Object));
    });
  });
});
