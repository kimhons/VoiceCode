// VoiceCode Mobile - Sync Settings Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import { SyncSettingsScreen } from '../../screens/settings/SyncSettingsScreen';

describe('SyncSettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render sync settings', () => {
      const { getByTestId } = renderWithProviders(<SyncSettingsScreen />);

      expect(getByTestId('sync-settings-screen')).toBeTruthy();
    });

    it('should display sync status', () => {
      const { getByTestId } = renderWithProviders(<SyncSettingsScreen />);

      expect(getByTestId('sync-status')).toBeTruthy();
    });
  });

  describe('Auto Sync', () => {
    it('should toggle auto sync', async () => {
      const { getByTestId } = renderWithProviders(<SyncSettingsScreen />);

      fireEvent(getByTestId('auto-sync-toggle'), 'valueChange', true);
    });
  });

  describe('WiFi Only', () => {
    it('should toggle WiFi only sync', async () => {
      const { getByTestId } = renderWithProviders(<SyncSettingsScreen />);

      fireEvent(getByTestId('wifi-only-toggle'), 'valueChange', true);
    });
  });

  describe('Manual Sync', () => {
    it('should trigger manual sync', async () => {
      const { getByTestId, findByText } = renderWithProviders(<SyncSettingsScreen />);

      fireEvent.press(getByTestId('sync-now-button'));

      const syncing = await findByText(/syncing/i);
      expect(syncing).toBeTruthy();
    });
  });

  describe('Last Sync', () => {
    it('should display last sync time', () => {
      const { getByText } = renderWithProviders(<SyncSettingsScreen />);

      expect(getByText(/last synced/i)).toBeTruthy();
    });
  });

  describe('Pending Changes', () => {
    it('should display pending changes count', () => {
      const { getByTestId } = renderWithProviders(<SyncSettingsScreen />);

      expect(getByTestId('pending-changes')).toBeTruthy();
    });
  });

  describe('Conflict Resolution', () => {
    it('should set conflict resolution strategy', async () => {
      const { getByTestId, getByText } = renderWithProviders(<SyncSettingsScreen />);

      fireEvent.press(getByTestId('conflict-strategy-selector'));
      fireEvent.press(getByText(/keep local/i));
    });
  });

  describe('Data Usage', () => {
    it('should display data usage', () => {
      const { getByText } = renderWithProviders(<SyncSettingsScreen />);

      expect(getByText(/data used/i)).toBeTruthy();
    });
  });
});
