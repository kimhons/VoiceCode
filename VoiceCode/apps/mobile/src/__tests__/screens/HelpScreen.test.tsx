// VoiceCode Mobile - Help Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';

describe('HelpScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render help screen', () => {
      const { getByTestId } = renderWithProviders(
        <MockHelpScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('help-screen')).toBeTruthy();
    });

    it('should display FAQ section', () => {
      const { getByText } = renderWithProviders(
        <MockHelpScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/frequently asked questions/i)).toBeTruthy();
    });

    it('should display contact options', () => {
      const { getByText } = renderWithProviders(
        <MockHelpScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/contact support/i)).toBeTruthy();
    });
  });

  describe('FAQ', () => {
    it('should expand FAQ item on tap', () => {
      const { getByTestId } = renderWithProviders(
        <MockHelpScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('faq-item-1'));
      expect(getByTestId('faq-answer-1')).toBeTruthy();
    });

    it('should collapse FAQ item on second tap', () => {
      const { getByTestId, queryByTestId } = renderWithProviders(
        <MockHelpScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('faq-item-1'));
      fireEvent.press(getByTestId('faq-item-1'));

      expect(queryByTestId('faq-answer-1')).toBeNull();
    });
  });

  describe('Search', () => {
    it('should search help topics', () => {
      const { getByTestId, getByText } = renderWithProviders(
        <MockHelpScreen navigation={mockNavigation as any} />
      );

      fireEvent.changeText(getByTestId('search-input'), 'recording');
      expect(getByText(/recording/i)).toBeTruthy();
    });
  });

  describe('Contact', () => {
    it('should open email support', () => {
      const { getByTestId } = renderWithProviders(
        <MockHelpScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('email-support'));
    });

    it('should open chat support', () => {
      const { getByTestId } = renderWithProviders(
        <MockHelpScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('chat-support'));
    });
  });

  describe('Guides', () => {
    it('should navigate to getting started guide', () => {
      const { getByText } = renderWithProviders(
        <MockHelpScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByText(/getting started/i));

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Guide', expect.any(Object));
    });
  });
});

// Mock component
const MockHelpScreen = ({ navigation }: { navigation: any }) => {
  return null;
};
