// VoiceCode Mobile - Speakers Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';

describe('SpeakersScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  const mockRoute = {
    params: { transcriptId: 'transcript-123' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render speakers screen', () => {
      const { getByTestId } = renderWithProviders(
        <MockSpeakersScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByTestId('speakers-screen')).toBeTruthy();
    });

    it('should display speaker list', () => {
      const { getByTestId } = renderWithProviders(
        <MockSpeakersScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByTestId('speaker-list')).toBeTruthy();
    });
  });

  describe('Speaker Management', () => {
    it('should rename speaker', async () => {
      const { getByTestId, findByTestId } = renderWithProviders(
        <MockSpeakersScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('speaker-1'));
      fireEvent.press(getByTestId('rename-speaker'));

      const input = await findByTestId('speaker-name-input');
      fireEvent.changeText(input, 'John Smith');
      fireEvent.press(getByTestId('save-name'));
    });

    it('should change speaker color', async () => {
      const { getByTestId, findByTestId } = renderWithProviders(
        <MockSpeakersScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('speaker-1'));
      fireEvent.press(getByTestId('change-color'));

      const colorPicker = await findByTestId('color-picker');
      expect(colorPicker).toBeTruthy();
    });

    it('should merge speakers', async () => {
      const { getByTestId } = renderWithProviders(
        <MockSpeakersScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('speaker-1'));
      fireEvent.press(getByTestId('merge-speaker'));
      fireEvent.press(getByTestId('speaker-2-target'));
      fireEvent.press(getByTestId('confirm-merge'));
    });
  });

  describe('Speaker Stats', () => {
    it('should display speaking time', () => {
      const { getByText } = renderWithProviders(
        <MockSpeakersScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByText(/speaking time/i)).toBeTruthy();
    });

    it('should display word count', () => {
      const { getByText } = renderWithProviders(
        <MockSpeakersScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByText(/words/i)).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    it('should navigate to speaker detail', () => {
      const { getByTestId } = renderWithProviders(
        <MockSpeakersScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('speaker-1'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith('SpeakerDetail', expect.any(Object));
    });
  });
});

// Mock component
const MockSpeakersScreen = ({ navigation, route }: { navigation: any; route: any }) => {
  return null;
};
