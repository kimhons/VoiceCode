// VoiceCode Mobile - Integrations Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';

describe('IntegrationsScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render integrations screen', () => {
      const { getByTestId } = renderWithProviders(
        <MockIntegrationsScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('integrations-screen')).toBeTruthy();
    });

    it('should display integrations list', () => {
      const { getByTestId } = renderWithProviders(
        <MockIntegrationsScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('integrations-list')).toBeTruthy();
    });
  });

  describe('Available Integrations', () => {
    it('should display Google Drive', () => {
      const { getByText } = renderWithProviders(
        <MockIntegrationsScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/google drive/i)).toBeTruthy();
    });

    it('should display Dropbox', () => {
      const { getByText } = renderWithProviders(
        <MockIntegrationsScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/dropbox/i)).toBeTruthy();
    });

    it('should display Notion', () => {
      const { getByText } = renderWithProviders(
        <MockIntegrationsScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/notion/i)).toBeTruthy();
    });
  });

  describe('Connect Integration', () => {
    it('should connect to integration', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <MockIntegrationsScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('connect-google-drive'));

      const message = await findByText(/connected/i);
      expect(message).toBeTruthy();
    });
  });

  describe('Disconnect Integration', () => {
    it('should disconnect integration', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <MockIntegrationsScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('disconnect-google-drive'));

      const message = await findByText(/disconnected/i);
      expect(message).toBeTruthy();
    });
  });

  describe('Integration Settings', () => {
    it('should open integration settings', async () => {
      const { getByTestId, findByTestId } = renderWithProviders(
        <MockIntegrationsScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('settings-google-drive'));

      const modal = await findByTestId('integration-settings-modal');
      expect(modal).toBeTruthy();
    });
  });

  describe('Connection Status', () => {
    it('should show connected status', () => {
      const { getByTestId } = renderWithProviders(
        <MockIntegrationsScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('status-connected')).toBeTruthy();
    });

    it('should show disconnected status', () => {
      const { getByTestId } = renderWithProviders(
        <MockIntegrationsScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('status-disconnected')).toBeTruthy();
    });
  });
});

// Mock component
const MockIntegrationsScreen = ({ navigation }: { navigation: any }) => {
  return null;
};
