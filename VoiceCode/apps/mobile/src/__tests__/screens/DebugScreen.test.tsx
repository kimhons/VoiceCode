// VoiceCode Mobile - Debug Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import DebugScreen from '../../screens/developer/DebugScreen';

describe('DebugScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render debug screen', () => {
      const { getByTestId } = renderWithProviders(
        <DebugScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('debug-screen')).toBeTruthy();
    });
  });

  describe('Device Info', () => {
    it('should display device info', () => {
      const { getByText } = renderWithProviders(
        <DebugScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/device/i)).toBeTruthy();
    });

    it('should display OS version', () => {
      const { getByText } = renderWithProviders(
        <DebugScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/os/i)).toBeTruthy();
    });

    it('should display app version', () => {
      const { getByText } = renderWithProviders(
        <DebugScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/version/i)).toBeTruthy();
    });
  });

  describe('Logs', () => {
    it('should display logs', () => {
      const { getByTestId } = renderWithProviders(
        <DebugScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('logs-section')).toBeTruthy();
    });

    it('should export logs', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <DebugScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('export-logs'));

      const message = await findByText(/exported/i);
      expect(message).toBeTruthy();
    });

    it('should clear logs', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <DebugScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('clear-logs'));

      const message = await findByText(/cleared/i);
      expect(message).toBeTruthy();
    });
  });

  describe('Cache', () => {
    it('should display cache size', () => {
      const { getByText } = renderWithProviders(
        <DebugScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/cache/i)).toBeTruthy();
    });

    it('should clear cache', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <DebugScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('clear-cache'));

      const message = await findByText(/cleared/i);
      expect(message).toBeTruthy();
    });
  });

  describe('Test Crash', () => {
    it('should trigger test crash', async () => {
      const { getByTestId } = renderWithProviders(
        <DebugScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('test-crash'));
    });
  });
});
