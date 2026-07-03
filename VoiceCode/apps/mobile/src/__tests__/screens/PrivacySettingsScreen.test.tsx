// VoiceCode Mobile - Privacy Settings Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import { PrivacySettingsScreen } from '../../screens/settings/PrivacySettingsScreen';

describe('PrivacySettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render privacy settings', () => {
      const { getByTestId } = renderWithProviders(
        <PrivacySettingsScreen />
      );

      expect(getByTestId('privacy-settings-screen')).toBeTruthy();
    });
  });

  describe('Data Collection', () => {
    it('should toggle analytics', async () => {
      const { getByTestId } = renderWithProviders(
        <PrivacySettingsScreen />
      );

      fireEvent(getByTestId('analytics-toggle'), 'valueChange', false);
    });

    it('should toggle crash reporting', async () => {
      const { getByTestId } = renderWithProviders(
        <PrivacySettingsScreen />
      );

      fireEvent(getByTestId('crash-reporting-toggle'), 'valueChange', false);
    });

    it('should toggle usage statistics', async () => {
      const { getByTestId } = renderWithProviders(
        <PrivacySettingsScreen />
      );

      fireEvent(getByTestId('usage-stats-toggle'), 'valueChange', false);
    });
  });

  describe('Data Management', () => {
    it('should download data', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <PrivacySettingsScreen />
      );

      fireEvent.press(getByTestId('download-data'));

      const message = await findByText(/preparing/i);
      expect(message).toBeTruthy();
    });

    it('should delete account', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <PrivacySettingsScreen />
      );

      fireEvent.press(getByTestId('delete-account'));

      const confirmation = await findByText(/are you sure/i);
      expect(confirmation).toBeTruthy();
    });
  });

  describe('Legal', () => {
    it('should open privacy policy', async () => {
      const { getByText } = renderWithProviders(
        <PrivacySettingsScreen />
      );

      fireEvent.press(getByText(/privacy policy/i));
    });

    it('should open terms of service', async () => {
      const { getByText } = renderWithProviders(
        <PrivacySettingsScreen />
      );

      fireEvent.press(getByText(/terms of service/i));
    });
  });

  describe('Permissions', () => {
    it('should show microphone permission', async () => {
      const { getByText } = renderWithProviders(
        <PrivacySettingsScreen />
      );

      expect(getByText(/microphone/i)).toBeTruthy();
    });

    it('should show notification permission', async () => {
      const { getByText } = renderWithProviders(
        <PrivacySettingsScreen />
      );

      expect(getByText(/notifications/i)).toBeTruthy();
    });
  });
});
