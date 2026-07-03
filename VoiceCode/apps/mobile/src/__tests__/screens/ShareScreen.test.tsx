// VoiceCode Mobile - Share Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';

describe('ShareScreen', () => {
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
    it('should render share screen', () => {
      const { getByTestId } = renderWithProviders(
        <MockShareScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByTestId('share-screen')).toBeTruthy();
    });

    it('should display share options', () => {
      const { getByText } = renderWithProviders(
        <MockShareScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByText(/email/i)).toBeTruthy();
      expect(getByText(/link/i)).toBeTruthy();
    });
  });

  describe('Email Share', () => {
    it('should enter email address', async () => {
      const { getByTestId } = renderWithProviders(
        <MockShareScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.changeText(getByTestId('email-input'), 'user@example.com');
    });

    it('should validate email format', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <MockShareScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.changeText(getByTestId('email-input'), 'invalid');
      fireEvent.press(getByTestId('share-button'));

      const error = await findByText(/valid email/i);
      expect(error).toBeTruthy();
    });

    it('should select permission level', async () => {
      const { getByTestId, getByText } = renderWithProviders(
        <MockShareScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('permission-selector'));
      fireEvent.press(getByText(/edit/i));
    });

    it('should send share invitation', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <MockShareScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.changeText(getByTestId('email-input'), 'user@example.com');
      fireEvent.press(getByTestId('share-button'));

      const success = await findByText(/shared/i);
      expect(success).toBeTruthy();
    });
  });

  describe('Link Share', () => {
    it('should generate shareable link', async () => {
      const { getByTestId, findByTestId } = renderWithProviders(
        <MockShareScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('generate-link'));

      const link = await findByTestId('share-link');
      expect(link).toBeTruthy();
    });

    it('should copy link to clipboard', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <MockShareScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('copy-link'));

      const copied = await findByText(/copied/i);
      expect(copied).toBeTruthy();
    });

    it('should set link expiration', async () => {
      const { getByTestId, getByText } = renderWithProviders(
        <MockShareScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('expiration-selector'));
      fireEvent.press(getByText(/7 days/i));
    });
  });

  describe('Manage Shares', () => {
    it('should display existing shares', () => {
      const { getByTestId } = renderWithProviders(
        <MockShareScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByTestId('shares-list')).toBeTruthy();
    });

    it('should remove share', async () => {
      const { getByTestId, queryByTestId } = renderWithProviders(
        <MockShareScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('remove-share-1'));
      fireEvent.press(getByTestId('confirm-remove'));

      await waitFor(() => {
        expect(queryByTestId('share-1')).toBeNull();
      });
    });
  });
});

// Mock component
const MockShareScreen = ({ navigation, route }: { navigation: any; route: any }) => {
  return null;
};
