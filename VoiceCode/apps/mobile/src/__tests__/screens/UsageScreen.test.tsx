// VoiceCode Mobile - Usage Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import UsageScreen from '../../screens/profile/UsageScreen';

describe('UsageScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render usage screen', () => {
      const { getByTestId } = renderWithProviders(
        <UsageScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('usage-screen')).toBeTruthy();
    });
  });

  describe('Current Usage', () => {
    it('should display transcription minutes used', () => {
      const { getByText } = renderWithProviders(
        <UsageScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/minutes/i)).toBeTruthy();
    });

    it('should display storage used', () => {
      const { getByText } = renderWithProviders(
        <UsageScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/storage/i)).toBeTruthy();
    });

    it('should display AI features used', () => {
      const { getByText } = renderWithProviders(
        <UsageScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/ai/i)).toBeTruthy();
    });
  });

  describe('Limits', () => {
    it('should show plan limits', () => {
      const { getByTestId } = renderWithProviders(
        <UsageScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('plan-limits')).toBeTruthy();
    });

    it('should show usage progress bars', () => {
      const { getByTestId } = renderWithProviders(
        <UsageScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('usage-progress')).toBeTruthy();
    });
  });

  describe('History', () => {
    it('should display usage history', () => {
      const { getByTestId } = renderWithProviders(
        <UsageScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('usage-history')).toBeTruthy();
    });

    it('should filter by time period', async () => {
      const { getByTestId, getByText } = renderWithProviders(
        <UsageScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('period-selector'));
      fireEvent.press(getByText(/month/i));
    });
  });

  describe('Upgrade', () => {
    it('should show upgrade prompt when near limit', () => {
      const { getByText } = renderWithProviders(
        <UsageScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/upgrade/i)).toBeTruthy();
    });

    it('should navigate to subscription', async () => {
      const { getByTestId } = renderWithProviders(
        <UsageScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('upgrade-button'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Subscription');
    });
  });

  describe('Reset Date', () => {
    it('should show usage reset date', () => {
      const { getByText } = renderWithProviders(
        <UsageScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/resets/i)).toBeTruthy();
    });
  });
});
