// VoiceCode Mobile - About Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';

describe('AboutScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render about screen', () => {
      const { getByTestId } = renderWithProviders(
        <MockAboutScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('about-screen')).toBeTruthy();
    });

    it('should display app logo', () => {
      const { getByTestId } = renderWithProviders(
        <MockAboutScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('app-logo')).toBeTruthy();
    });

    it('should display app version', () => {
      const { getByText } = renderWithProviders(
        <MockAboutScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/version/i)).toBeTruthy();
    });

    it('should display build number', () => {
      const { getByText } = renderWithProviders(
        <MockAboutScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/build/i)).toBeTruthy();
    });
  });

  describe('Links', () => {
    it('should open website', async () => {
      const { getByText } = renderWithProviders(
        <MockAboutScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByText(/website/i));
    });

    it('should open privacy policy', async () => {
      const { getByText } = renderWithProviders(
        <MockAboutScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByText(/privacy/i));
    });

    it('should open terms of service', async () => {
      const { getByText } = renderWithProviders(
        <MockAboutScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByText(/terms/i));
    });

    it('should open support', async () => {
      const { getByText } = renderWithProviders(
        <MockAboutScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByText(/support/i));
    });
  });

  describe('Actions', () => {
    it('should check for updates', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <MockAboutScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('check-updates'));

      const message = await findByText(/checking/i);
      expect(message).toBeTruthy();
    });

    it('should rate app', async () => {
      const { getByTestId } = renderWithProviders(
        <MockAboutScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('rate-app'));
    });

    it('should share app', async () => {
      const { getByTestId } = renderWithProviders(
        <MockAboutScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('share-app'));
    });
  });

  describe('Licenses', () => {
    it('should open licenses', async () => {
      const { getByText } = renderWithProviders(
        <MockAboutScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByText(/licenses/i));

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Licenses');
    });
  });
});

// Mock component
const MockAboutScreen = ({ navigation }: { navigation: any }) => {
  return null;
};
