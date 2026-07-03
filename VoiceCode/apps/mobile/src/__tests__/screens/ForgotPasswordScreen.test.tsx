// VoiceCode Mobile - Forgot Password Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import { supabase } from '../../services/supabaseService';

jest.mock('../../services/supabaseService');

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
        <MockForgotPasswordScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('forgot-password-screen')).toBeTruthy();
    });

    it('should display email input', () => {
      const { getByTestId } = renderWithProviders(
        <MockForgotPasswordScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('email-input')).toBeTruthy();
    });

    it('should display reset button', () => {
      const { getByTestId } = renderWithProviders(
        <MockForgotPasswordScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('reset-button')).toBeTruthy();
    });
  });

  describe('Validation', () => {
    it('should validate empty email', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <MockForgotPasswordScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('reset-button'));

      const error = await findByText(/email is required/i);
      expect(error).toBeTruthy();
    });

    it('should validate email format', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <MockForgotPasswordScreen navigation={mockNavigation as any} />
      );

      fireEvent.changeText(getByTestId('email-input'), 'invalid-email');
      fireEvent.press(getByTestId('reset-button'));

      const error = await findByText(/valid email/i);
      expect(error).toBeTruthy();
    });
  });

  describe('Reset Flow', () => {
    it('should send reset email successfully', async () => {
      (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
        error: null,
      });

      const { getByTestId, findByText } = renderWithProviders(
        <MockForgotPasswordScreen navigation={mockNavigation as any} />
      );

      fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
      fireEvent.press(getByTestId('reset-button'));

      const success = await findByText(/email sent/i);
      expect(success).toBeTruthy();
    });

    it('should handle unknown email', async () => {
      (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
        error: { message: 'User not found' },
      });

      const { getByTestId, findByText } = renderWithProviders(
        <MockForgotPasswordScreen navigation={mockNavigation as any} />
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
        <MockForgotPasswordScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByText(/back to login/i));

      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });
});

// Mock component
const MockForgotPasswordScreen = ({ navigation }: { navigation: any }) => {
  return null;
};
