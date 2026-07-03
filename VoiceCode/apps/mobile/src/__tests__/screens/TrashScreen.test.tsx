// VoiceCode Mobile - Trash Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import TrashScreen from '../../screens/library/TrashScreen';

describe('TrashScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render trash screen', () => {
      const { getByTestId } = renderWithProviders(
        <TrashScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('trash-screen')).toBeTruthy();
    });

    it('should display deleted items list', () => {
      const { getByTestId } = renderWithProviders(
        <TrashScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('trash-list')).toBeTruthy();
    });
  });

  describe('Trash Items', () => {
    it('should display transcript title', () => {
      const { getByText } = renderWithProviders(
        <TrashScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/deleted transcript/i)).toBeTruthy();
    });

    it('should display deletion date', () => {
      const { getByText } = renderWithProviders(
        <TrashScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/deleted/i)).toBeTruthy();
    });

    it('should display days until permanent deletion', () => {
      const { getByText } = renderWithProviders(
        <TrashScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/days/i)).toBeTruthy();
    });
  });

  describe('Restore', () => {
    it('should restore transcript', async () => {
      const { getByTestId, queryByTestId, findByText } = renderWithProviders(
        <TrashScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('restore-1'));

      const message = await findByText(/restored/i);
      expect(message).toBeTruthy();
    });
  });

  describe('Permanent Delete', () => {
    it('should permanently delete transcript', async () => {
      const { getByTestId, queryByTestId, findByText } = renderWithProviders(
        <TrashScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('delete-permanently-1'));

      const confirmation = await findByText(/permanent/i);
      expect(confirmation).toBeTruthy();
    });
  });

  describe('Empty Trash', () => {
    it('should empty trash', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <TrashScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('empty-trash'));

      const confirmation = await findByText(/are you sure/i);
      expect(confirmation).toBeTruthy();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when trash is empty', () => {
      const { getByText } = renderWithProviders(
        <TrashScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/empty/i)).toBeTruthy();
    });
  });
});
