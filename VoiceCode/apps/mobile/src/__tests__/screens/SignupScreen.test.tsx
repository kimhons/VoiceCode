// VoiceCode Mobile - Signup Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import { supabase } from '../../services/supabaseService';

jest.mock('../../services/supabaseService');

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
        <MockSignupScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('name-input')).toBeTruthy();
      expect(getByTestId('email-input')).toBeTruthy();
      expect(getByTestId('password-input')).toBeTruthy();
      expect(getByTestId('confirm-password-input')).toBeTruthy();
    });

    it('should display signup button', () => {
      const { getByTestId } = renderWithProviders(
        <MockSignupScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('signup-button')).toBeTruthy();
    });

    it('should display social signup options', () => {
      const { getByTestId } = renderWithProviders(
        <MockSignupScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('google-signup')).toBeTruthy();
      expect(getByTestId('apple-signup')).toBeTruthy();
    });

    it('should show login link', () => {
      const { getByText } = renderWithProviders(
        <MockSignupScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/already have an account/i)).toBeTruthy();
    });
  });

  describe('Validation', () => {
    it('should validate empty name', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <MockSignupScreen navigation={mockNavigation as any} />
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
        <MockSignupScreen navigation={mockNavigation as any} />
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
        <MockSignupScreen navigation={mockNavigation as any} />
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
        <MockSignupScreen navigation={mockNavigation as any} />
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
    it('should signup successfully', async () => {
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });

      const { getByTestId } = renderWithProviders(
        <MockSignupScreen navigation={mockNavigation as any} />
      );

      fireEvent.changeText(getByTestId('name-input'), 'Test User');
      fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
      fireEvent.changeText(getByTestId('password-input'), 'Password123!');
      fireEvent.changeText(getByTestId('confirm-password-input'), 'Password123!');
      fireEvent.press(getByTestId('signup-button'));

      await waitFor(() => {
        expect(supabase.auth.signUp).toHaveBeenCalled();
      });
    });

    it('should show verification email message', async () => {
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });

      const { getByTestId, findByText } = renderWithProviders(
        <MockSignupScreen navigation={mockNavigation as any} />
      );

      fireEvent.changeText(getByTestId('name-input'), 'Test User');
      fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
      fireEvent.changeText(getByTestId('password-input'), 'Password123!');
      fireEvent.changeText(getByTestId('confirm-password-input'), 'Password123!');
      fireEvent.press(getByTestId('signup-button'));

      const message = await findByText(/verification email/i);
      expect(message).toBeTruthy();
    });

    it('should handle signup error', async () => {
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Email already in use' },
      });

      const { getByTestId, findByText } = renderWithProviders(
        <MockSignupScreen navigation={mockNavigation as any} />
      );

      fireEvent.changeText(getByTestId('name-input'), 'Test User');
      fireEvent.changeText(getByTestId('email-input'), 'existing@example.com');
      fireEvent.changeText(getByTestId('password-input'), 'Password123!');
      fireEvent.changeText(getByTestId('confirm-password-input'), 'Password123!');
      fireEvent.press(getByTestId('signup-button'));

      const error = await findByText(/already in use/i);
      expect(error).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    it('should navigate to login', () => {
      const { getByText } = renderWithProviders(
        <MockSignupScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByText(/already have an account/i));

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Login');
    });
  });

  describe('Terms and Privacy', () => {
    it('should require accepting terms', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <MockSignupScreen navigation={mockNavigation as any} />
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
        <MockSignupScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByText(/terms of service/i));

      expect(mockNavigation.navigate).toHaveBeenCalledWith('WebView', expect.any(Object));
    });
  });
});

// Mock component
const MockSignupScreen = ({ navigation }: { navigation: any }) => {
  return null;
};
