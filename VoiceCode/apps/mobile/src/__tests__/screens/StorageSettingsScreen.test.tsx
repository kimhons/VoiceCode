// VoiceCode Mobile - Storage Settings Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import StorageSettingsScreen from '../../screens/settings/StorageSettingsScreen';

describe('StorageSettingsScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render storage settings', () => {
      const { getByTestId } = renderWithProviders(
        <StorageSettingsScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('storage-settings-screen')).toBeTruthy();
    });

    it('should display storage usage', () => {
      const { getByTestId } = renderWithProviders(
        <StorageSettingsScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('storage-usage')).toBeTruthy();
    });
  });

  describe('Storage Breakdown', () => {
    it('should show audio storage', () => {
      const { getByText } = renderWithProviders(
        <StorageSettingsScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/audio/i)).toBeTruthy();
    });

    it('should show transcript storage', () => {
      const { getByText } = renderWithProviders(
        <StorageSettingsScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/transcripts/i)).toBeTruthy();
    });

    it('should show cache storage', () => {
      const { getByText } = renderWithProviders(
        <StorageSettingsScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/cache/i)).toBeTruthy();
    });
  });

  describe('Clear Cache', () => {
    it('should clear cache', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <StorageSettingsScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('clear-cache'));

      const message = await findByText(/cleared/i);
      expect(message).toBeTruthy();
    });
  });

  describe('Clear Audio', () => {
    it('should clear all audio', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <StorageSettingsScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('clear-audio'));

      const confirmation = await findByText(/are you sure/i);
      expect(confirmation).toBeTruthy();
    });
  });

  describe('Offline Storage', () => {
    it('should set offline storage limit', async () => {
      const { getByTestId, getByText } = renderWithProviders(
        <StorageSettingsScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('offline-limit-selector'));
      fireEvent.press(getByText('1 GB'));
    });

    it('should toggle auto-download', async () => {
      const { getByTestId } = renderWithProviders(
        <StorageSettingsScreen navigation={mockNavigation as any} />
      );

      fireEvent(getByTestId('auto-download-toggle'), 'valueChange', true);
    });
  });

  describe('Auto-Delete', () => {
    it('should set auto-delete period', async () => {
      const { getByTestId, getByText } = renderWithProviders(
        <StorageSettingsScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('auto-delete-selector'));
      fireEvent.press(getByText('30 days'));
    });

    it('should disable auto-delete', async () => {
      const { getByTestId, getByText } = renderWithProviders(
        <StorageSettingsScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('auto-delete-selector'));
      fireEvent.press(getByText('Never'));
    });
  });
});

