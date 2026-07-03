// VoiceCode Mobile - Onboarding Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage');

describe('OnboardingScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    replace: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render first onboarding slide', () => {
      const { getByText } = renderWithProviders(
        <MockOnboardingScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/welcome/i)).toBeTruthy();
    });

    it('should display pagination dots', () => {
      const { getAllByTestId } = renderWithProviders(
        <MockOnboardingScreen navigation={mockNavigation as any} />
      );

      const dots = getAllByTestId(/pagination-dot/);
      expect(dots.length).toBeGreaterThan(1);
    });

    it('should show skip button', () => {
      const { getByText } = renderWithProviders(
        <MockOnboardingScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/skip/i)).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    it('should navigate to next slide on swipe', async () => {
      const { getByTestId, getByText } = renderWithProviders(
        <MockOnboardingScreen navigation={mockNavigation as any} />
      );

      // Swipe left to next slide
      const slider = getByTestId('onboarding-slider');
      fireEvent.scroll(slider, { nativeEvent: { contentOffset: { x: 400 } } });

      await waitFor(() => {
        expect(getByText(/record/i)).toBeTruthy();
      });
    });

    it('should navigate on next button press', async () => {
      const { getByTestId, getByText } = renderWithProviders(
        <MockOnboardingScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('next-button'));

      await waitFor(() => {
        expect(getByText(/record/i)).toBeTruthy();
      });
    });

    it('should skip to last slide', async () => {
      const { getByText, findByText } = renderWithProviders(
        <MockOnboardingScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByText(/skip/i));

      const getStarted = await findByText(/get started/i);
      expect(getStarted).toBeTruthy();
    });
  });

  describe('Completion', () => {
    it('should mark onboarding complete on get started', async () => {
      const { getByText, getByTestId } = renderWithProviders(
        <MockOnboardingScreen navigation={mockNavigation as any} />
      );

      // Navigate to last slide
      fireEvent.press(getByText(/skip/i));

      // Press get started
      fireEvent.press(getByTestId('get-started-button'));

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith('onboarding_complete', 'true');
      });
    });

    it('should navigate to auth screen', async () => {
      const { getByText, getByTestId } = renderWithProviders(
        <MockOnboardingScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByText(/skip/i));
      fireEvent.press(getByTestId('get-started-button'));

      await waitFor(() => {
        expect(mockNavigation.replace).toHaveBeenCalledWith('Auth');
      });
    });
  });

  describe('Slides Content', () => {
    it('should display slide 1 content - Welcome', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <MockOnboardingScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/welcome to voicecode/i)).toBeTruthy();
      expect(getByTestId('slide-1-image')).toBeTruthy();
    });

    it('should display slide 2 content - Recording', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <MockOnboardingScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('next-button'));

      const recordText = await findByText(/record with ease/i);
      expect(recordText).toBeTruthy();
    });

    it('should display slide 3 content - AI Features', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <MockOnboardingScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('next-button'));
      fireEvent.press(getByTestId('next-button'));

      const aiText = await findByText(/ai-powered/i);
      expect(aiText).toBeTruthy();
    });

    it('should display slide 4 content - Get Started', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <MockOnboardingScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('next-button'));
      fireEvent.press(getByTestId('next-button'));
      fireEvent.press(getByTestId('next-button'));

      const getStarted = await findByText(/get started/i);
      expect(getStarted).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible labels', () => {
      const { getByLabelText } = renderWithProviders(
        <MockOnboardingScreen navigation={mockNavigation as any} />
      );

      expect(getByLabelText(/next slide/i)).toBeTruthy();
      expect(getByLabelText(/skip onboarding/i)).toBeTruthy();
    });
  });
});

// Mock component
const MockOnboardingScreen = ({ navigation }: { navigation: any }) => {
  return null;
};
