// VoiceCode Mobile - Delete Account Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import DeleteAccountScreen from '../../screens/security/DeleteAccountScreen';

describe('DeleteAccountScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render delete account screen', () => {
      const { getByTestId } = renderWithProviders(
        <DeleteAccountScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('delete-account-screen')).toBeTruthy();
    });

    it('should display warning message', () => {
      const { getByText } = renderWithProviders(
        <DeleteAccountScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/permanent/i)).toBeTruthy();
    });

    it('should display data that will be deleted', () => {
      const { getByText } = renderWithProviders(
        <DeleteAccountScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/transcripts/i)).toBeTruthy();
      expect(getByText(/recordings/i)).toBeTruthy();
    });
  });

  describe('Confirmation', () => {
    it('should require password confirmation', async () => {
      const { getByTestId } = renderWithProviders(
        <DeleteAccountScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('password-input')).toBeTruthy();
    });

    it('should require typing DELETE', async () => {
      const { getByTestId, getByPlaceholderText } = renderWithProviders(
        <DeleteAccountScreen navigation={mockNavigation as any} />
      );

      const input = getByPlaceholderText(/delete/i);
      expect(input).toBeTruthy();
    });

    it('should enable delete button only when confirmed', async () => {
      const { getByTestId, getByPlaceholderText } = renderWithProviders(
        <DeleteAccountScreen navigation={mockNavigation as any} />
      );

      const confirmInput = getByPlaceholderText(/delete/i);
      fireEvent.changeText(confirmInput, 'DELETE');

      const passwordInput = getByTestId('password-input');
      fireEvent.changeText(passwordInput, 'password123');

      const deleteButton = getByTestId('delete-button');
      expect(deleteButton.props.disabled).toBeFalsy();
    });
  });

  describe('Delete', () => {
    it('should delete account on confirm', async () => {
      const { getByTestId, getByPlaceholderText, findByText } = renderWithProviders(
        <DeleteAccountScreen navigation={mockNavigation as any} />
      );

      fireEvent.changeText(getByPlaceholderText(/delete/i), 'DELETE');
      fireEvent.changeText(getByTestId('password-input'), 'password123');
      fireEvent.press(getByTestId('delete-button'));

      const message = await findByText(/deleting/i);
      expect(message).toBeTruthy();
    });

    it('should handle wrong password', async () => {
      const { getByTestId, getByPlaceholderText, findByText } = renderWithProviders(
        <DeleteAccountScreen navigation={mockNavigation as any} />
      );

      fireEvent.changeText(getByPlaceholderText(/delete/i), 'DELETE');
      fireEvent.changeText(getByTestId('password-input'), 'wrongpassword');
      fireEvent.press(getByTestId('delete-button'));

      const error = await findByText(/incorrect/i);
      expect(error).toBeTruthy();
    });
  });

  describe('Cancel', () => {
    it('should go back on cancel', () => {
      const { getByTestId } = renderWithProviders(
        <DeleteAccountScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('cancel-button'));

      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });
});
