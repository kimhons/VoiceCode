// VoiceCode Mobile - Feedback Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';

describe('FeedbackScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render feedback screen', () => {
      const { getByTestId } = renderWithProviders(
        <MockFeedbackScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('feedback-screen')).toBeTruthy();
    });

    it('should display feedback form', () => {
      const { getByTestId } = renderWithProviders(
        <MockFeedbackScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('feedback-form')).toBeTruthy();
    });
  });

  describe('Feedback Type', () => {
    it('should select bug report', async () => {
      const { getByTestId } = renderWithProviders(
        <MockFeedbackScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('type-bug'));
    });

    it('should select feature request', async () => {
      const { getByTestId } = renderWithProviders(
        <MockFeedbackScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('type-feature'));
    });

    it('should select general feedback', async () => {
      const { getByTestId } = renderWithProviders(
        <MockFeedbackScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('type-general'));
    });
  });

  describe('Rating', () => {
    it('should select rating', async () => {
      const { getByTestId } = renderWithProviders(
        <MockFeedbackScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('rating-5'));
    });
  });

  describe('Message', () => {
    it('should enter feedback message', async () => {
      const { getByTestId } = renderWithProviders(
        <MockFeedbackScreen navigation={mockNavigation as any} />
      );

      fireEvent.changeText(getByTestId('feedback-message'), 'Great app!');
    });

    it('should validate required message', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <MockFeedbackScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('submit-feedback'));

      const error = await findByText(/required/i);
      expect(error).toBeTruthy();
    });
  });

  describe('Attachments', () => {
    it('should attach screenshot', async () => {
      const { getByTestId, findByTestId } = renderWithProviders(
        <MockFeedbackScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('attach-screenshot'));

      const attachment = await findByTestId('attachment-1');
      expect(attachment).toBeTruthy();
    });

    it('should remove attachment', async () => {
      const { getByTestId, queryByTestId } = renderWithProviders(
        <MockFeedbackScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('attach-screenshot'));
      fireEvent.press(getByTestId('remove-attachment-1'));

      await waitFor(() => {
        expect(queryByTestId('attachment-1')).toBeNull();
      });
    });
  });

  describe('Submit', () => {
    it('should submit feedback', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <MockFeedbackScreen navigation={mockNavigation as any} />
      );

      fireEvent.changeText(getByTestId('feedback-message'), 'Great app!');
      fireEvent.press(getByTestId('submit-feedback'));

      const success = await findByText(/thank you/i);
      expect(success).toBeTruthy();
    });
  });
});

// Mock component
const MockFeedbackScreen = ({ navigation }: { navigation: any }) => {
  return null;
};
