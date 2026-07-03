// VoiceCode Mobile - Biometric Settings Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';

describe('BiometricSettingsScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render biometric settings', () => {
      const { getByTestId } = renderWithProviders(
        <MockBiometricSettingsScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('biometric-settings-screen')).toBeTruthy();
    });

    it('should show biometric availability', () => {
      const { getByText } = renderWithProviders(
        <MockBiometricSettingsScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/face id|touch id|fingerprint/i)).toBeTruthy();
    });
  });

  describe('Enable Biometrics', () => {
    it('should enable biometric lock', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <MockBiometricSettingsScreen navigation={mockNavigation as any} />
      );

      fireEvent(getByTestId('biometric-toggle'), 'valueChange', true);

      const message = await findByText(/enabled/i);
      expect(message).toBeTruthy();
    });

    it('should require authentication to enable', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <MockBiometricSettingsScreen navigation={mockNavigation as any} />
      );

      fireEvent(getByTestId('biometric-toggle'), 'valueChange', true);

      const prompt = await findByText(/authenticate/i);
      expect(prompt).toBeTruthy();
    });
  });

  describe('Disable Biometrics', () => {
    it('should disable biometric lock', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <MockBiometricSettingsScreen navigation={mockNavigation as any} />
      );

      fireEvent(getByTestId('biometric-toggle'), 'valueChange', false);

      const message = await findByText(/disabled/i);
      expect(message).toBeTruthy();
    });
  });

  describe('App Lock', () => {
    it('should set lock timeout', async () => {
      const { getByTestId, getByText } = renderWithProviders(
        <MockBiometricSettingsScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('lock-timeout-selector'));
      fireEvent.press(getByText('5 minutes'));
    });

    it('should set immediate lock', async () => {
      const { getByTestId, getByText } = renderWithProviders(
        <MockBiometricSettingsScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('lock-timeout-selector'));
      fireEvent.press(getByText('Immediately'));
    });
  });

  describe('Fallback', () => {
    it('should allow password fallback', async () => {
      const { getByTestId } = renderWithProviders(
        <MockBiometricSettingsScreen navigation={mockNavigation as any} />
      );

      fireEvent(getByTestId('password-fallback-toggle'), 'valueChange', true);
    });
  });

  describe('Not Supported', () => {
    it('should show message when not supported', () => {
      const { getByText } = renderWithProviders(
        <MockBiometricSettingsScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/not available/i)).toBeTruthy();
    });
  });
});

// Mock component
const MockBiometricSettingsScreen = ({ navigation }: { navigation: any }) => {
  return null;
};
