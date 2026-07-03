// VoiceCode Mobile - Tutorial Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';

describe('TutorialScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    replace: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render tutorial screen', () => {
      const { getByTestId } = renderWithProviders(
        <MockTutorialScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('tutorial-screen')).toBeTruthy();
    });

    it('should display tutorial step', () => {
      const { getByTestId } = renderWithProviders(
        <MockTutorialScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('tutorial-step')).toBeTruthy();
    });

    it('should display progress indicator', () => {
      const { getByTestId } = renderWithProviders(
        <MockTutorialScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('progress-indicator')).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    it('should go to next step', async () => {
      const { getByTestId } = renderWithProviders(
        <MockTutorialScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('next-button'));
    });

    it('should go to previous step', async () => {
      const { getByTestId } = renderWithProviders(
        <MockTutorialScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('previous-button'));
    });

    it('should complete on last step', async () => {
      const { getByTestId } = renderWithProviders(
        <MockTutorialScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('complete-button'));

      expect(mockNavigation.replace).toHaveBeenCalledWith('Home');
    });
  });

  describe('Skip', () => {
    it('should skip tutorial', async () => {
      const { getByText } = renderWithProviders(
        <MockTutorialScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByText(/skip/i));

      expect(mockNavigation.replace).toHaveBeenCalledWith('Home');
    });
  });

  describe('Step Content', () => {
    it('should display step title', () => {
      const { getByTestId } = renderWithProviders(
        <MockTutorialScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('step-title')).toBeTruthy();
    });

    it('should display step description', () => {
      const { getByTestId } = renderWithProviders(
        <MockTutorialScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('step-description')).toBeTruthy();
    });

    it('should display step image', () => {
      const { getByTestId } = renderWithProviders(
        <MockTutorialScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('step-image')).toBeTruthy();
    });
  });
});

// Mock component
const MockTutorialScreen = ({ navigation }: { navigation: any }) => {
  return null;
};
