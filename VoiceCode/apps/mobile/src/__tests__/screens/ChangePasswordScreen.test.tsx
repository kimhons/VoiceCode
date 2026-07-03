// VoiceCode Mobile - Change Password Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import { supabase } from '../../services/supabaseService';

jest.mock('../../services/supabaseService');

describe('ChangePasswordScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render change password screen', () => {
      const { getByTestId } = renderWithProviders(
        <MockChangePasswordScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('change-password-screen')).toBeTruthy();
    });

    it('should display password inputs', () => {
      const { getByTestId } = renderWithProviders(
        <MockChangePasswordScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('current-password-input')).toBeTruthy();
      expect(getByTestId('new-password-input')).toBeTruthy();
      expect(getByTestId('confirm-password-input')).toBeTruthy();
    });
  });

  describe('Validation', () => {
    it('should validate empty current password', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <MockChangePasswordScreen navigation={mockNavigation as any} />
      );

      fireEvent.changeText(getByTestId('new-password-input'), 'NewPass123!');
      fireEvent.changeText(getByTestId('confirm-password-input'), 'NewPass123!');
      fireEvent.press(getByTestId('submit-button'));

      const error = await findByText(/current password/i);
      expect(error).toBeTruthy();
    });

    it('should validate password strength', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <MockChangePasswordScreen navigation={mockNavigation as any} />
      );

      fireEvent.changeText(getByTestId('current-password-input'), 'OldPass123!');
      fireEvent.changeText(getByTestId('new-password-input'), 'weak');
      fireEvent.changeText(getByTestId('confirm-password-input'), 'weak');
      fireEvent.press(getByTestId('submit-button'));

      const error = await findByText(/password.*characters/i);
      expect(error).toBeTruthy();
    });

    it('should validate password match', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <MockChangePasswordScreen navigation={mockNavigation as any} />
      );

      fireEvent.changeText(getByTestId('current-password-input'), 'OldPass123!');
      fireEvent.changeText(getByTestId('new-password-input'), 'NewPass123!');
      fireEvent.changeText(getByTestId('confirm-password-input'), 'Different123!');
      fireEvent.press(getByTestId('submit-button'));

      const error = await findByText(/passwords.*match/i);
      expect(error).toBeTruthy();
    });
  });

  describe('Password Change', () => {
    it('should change password successfully', async () => {
      (supabase.auth.updateUser as jest.Mock).mockResolvedValue({
        error: null,
      });

      const { getByTestId, findByText } = renderWithProviders(
        <MockChangePasswordScreen navigation={mockNavigation as any} />
      );

      fireEvent.changeText(getByTestId('current-password-input'), 'OldPass123!');
      fireEvent.changeText(getByTestId('new-password-input'), 'NewPass123!');
      fireEvent.changeText(getByTestId('confirm-password-input'), 'NewPass123!');
      fireEvent.press(getByTestId('submit-button'));

      const success = await findByText(/password changed/i);
      expect(success).toBeTruthy();
    });

    it('should handle wrong current password', async () => {
      (supabase.auth.updateUser as jest.Mock).mockResolvedValue({
        error: { message: 'Invalid password' },
      });

      const { getByTestId, findByText } = renderWithProviders(
        <MockChangePasswordScreen navigation={mockNavigation as any} />
      );

      fireEvent.changeText(getByTestId('current-password-input'), 'WrongPass!');
      fireEvent.changeText(getByTestId('new-password-input'), 'NewPass123!');
      fireEvent.changeText(getByTestId('confirm-password-input'), 'NewPass123!');
      fireEvent.press(getByTestId('submit-button'));

      const error = await findByText(/invalid password/i);
      expect(error).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    it('should go back on cancel', () => {
      const { getByTestId } = renderWithProviders(
        <MockChangePasswordScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('cancel-button'));

      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });
});

// Mock component
const MockChangePasswordScreen = ({ navigation }: { navigation: any }) => {
  return null;
};
