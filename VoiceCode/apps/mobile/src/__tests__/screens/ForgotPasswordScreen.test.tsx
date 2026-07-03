// VoiceCode Mobile - Forgot Password Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import ForgotPasswordScreen from '../../screens/auth/ForgotPasswordScreen';

const mockResetPassword = jest.fn();

// The screen resolves resetPassword via useAuth(); mock the context it actually
// consumes (AuthProvider stays a passthrough so renderWithProviders still works).
jest.mock('../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({ resetPassword: mockResetPassword }),
}));

describe('ForgotPasswordScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render forgot password screen', () => {
      const { getByTestId } = renderWithProviders(
        <ForgotPasswordScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('forgot-password-screen')).toBeTruthy();
    });

    it('should display email input', () => {
      const { getByTestId } = renderWithProviders(
        <ForgotPasswordScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('email-input')).toBeTruthy();
    });

    it('should display reset button', () => {
      const { getByTestId } = renderWithProviders(
        <ForgotPasswordScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('reset-button')).toBeTruthy();
    });
  });

  describe('Validation', () => {
    it('should validate empty email', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <ForgotPasswordScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('reset-button'));

      const error = await findByText(/email is required/i);
      expect(error).toBeTruthy();
    });

    it('should validate email format', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <ForgotPasswordScreen navigation={mockNavigation as any} />
      );

      fireEvent.changeText(getByTestId('email-input'), 'invalid-email');
      fireEvent.press(getByTestId('reset-button'));

      const error = await findByText(/valid email/i);
      expect(error).toBeTruthy();
    });
  });

  describe('Reset Flow', () => {
    it('should send reset email successfully', async () => {
      mockResetPassword.mockResolvedValue(undefined);

      const { getByTestId, findByText } = renderWithProviders(
        <ForgotPasswordScreen navigation={mockNavigation as any} />
      );

      fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
      fireEvent.press(getByTestId('reset-button'));

      const success = await findByText(/email sent/i);
      expect(success).toBeTruthy();
    });

    it('should handle unknown email', async () => {
      mockResetPassword.mockRejectedValue(new Error('User not found'));

      const { getByTestId, findByText } = renderWithProviders(
        <ForgotPasswordScreen navigation={mockNavigation as any} />
      );

      fireEvent.changeText(getByTestId('email-input'), 'unknown@example.com');
      fireEvent.press(getByTestId('reset-button'));

      const error = await findByText(/not found/i);
      expect(error).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    it('should navigate back to login', () => {
      const { getByText } = renderWithProviders(
        <ForgotPasswordScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByText(/back to login/i));

      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });
});
