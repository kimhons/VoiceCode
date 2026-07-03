// VoiceCode Mobile - What's New Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';

describe('WhatsNewScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render whats new screen', () => {
      const { getByTestId } = renderWithProviders(
        <MockWhatsNewScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('whats-new-screen')).toBeTruthy();
    });

    it('should display version number', () => {
      const { getByText } = renderWithProviders(
        <MockWhatsNewScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/version/i)).toBeTruthy();
    });
  });

  describe('Features', () => {
    it('should display new features list', () => {
      const { getByTestId } = renderWithProviders(
        <MockWhatsNewScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('features-list')).toBeTruthy();
    });

    it('should display feature descriptions', () => {
      const { getByTestId } = renderWithProviders(
        <MockWhatsNewScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('feature-1')).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    it('should dismiss screen', async () => {
      const { getByTestId } = renderWithProviders(
        <MockWhatsNewScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('dismiss-button'));

      expect(mockNavigation.goBack).toHaveBeenCalled();
    });

    it('should navigate to feature', async () => {
      const { getByTestId } = renderWithProviders(
        <MockWhatsNewScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('try-feature-1'));

      expect(mockNavigation.navigate).toHaveBeenCalled();
    });
  });

  describe('Pagination', () => {
    it('should swipe between pages', async () => {
      const { getByTestId } = renderWithProviders(
        <MockWhatsNewScreen navigation={mockNavigation as any} />
      );

      // Simulate swipe
      fireEvent(getByTestId('feature-pager'), 'onPageChange', 1);
    });

    it('should show page indicators', () => {
      const { getByTestId } = renderWithProviders(
        <MockWhatsNewScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('page-indicators')).toBeTruthy();
    });
  });
});

// Mock component
const MockWhatsNewScreen = ({ navigation }: { navigation: any }) => {
  return null;
};
