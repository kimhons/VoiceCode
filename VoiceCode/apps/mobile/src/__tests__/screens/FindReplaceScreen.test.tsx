// VoiceCode Mobile - Find Replace Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';

describe('FindReplaceScreen', () => {
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
    it('should render find replace screen', () => {
      const { getByTestId } = renderWithProviders(
        <MockFindReplaceScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByTestId('find-replace-screen')).toBeTruthy();
    });

    it('should display find input', () => {
      const { getByTestId } = renderWithProviders(
        <MockFindReplaceScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByTestId('find-input')).toBeTruthy();
    });

    it('should display replace input', () => {
      const { getByTestId } = renderWithProviders(
        <MockFindReplaceScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByTestId('replace-input')).toBeTruthy();
    });
  });

  describe('Find', () => {
    it('should find matches', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <MockFindReplaceScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.changeText(getByTestId('find-input'), 'test');
      fireEvent.press(getByTestId('find-button'));

      const count = await findByText(/matches/i);
      expect(count).toBeTruthy();
    });

    it('should navigate to next match', async () => {
      const { getByTestId } = renderWithProviders(
        <MockFindReplaceScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.changeText(getByTestId('find-input'), 'test');
      fireEvent.press(getByTestId('next-button'));
    });

    it('should navigate to previous match', async () => {
      const { getByTestId } = renderWithProviders(
        <MockFindReplaceScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.changeText(getByTestId('find-input'), 'test');
      fireEvent.press(getByTestId('previous-button'));
    });
  });

  describe('Replace', () => {
    it('should replace current match', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <MockFindReplaceScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.changeText(getByTestId('find-input'), 'test');
      fireEvent.changeText(getByTestId('replace-input'), 'replaced');
      fireEvent.press(getByTestId('replace-button'));

      const message = await findByText(/replaced/i);
      expect(message).toBeTruthy();
    });

    it('should replace all matches', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <MockFindReplaceScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.changeText(getByTestId('find-input'), 'test');
      fireEvent.changeText(getByTestId('replace-input'), 'replaced');
      fireEvent.press(getByTestId('replace-all-button'));

      const message = await findByText(/replaced all/i);
      expect(message).toBeTruthy();
    });
  });

  describe('Options', () => {
    it('should toggle case sensitive', async () => {
      const { getByTestId } = renderWithProviders(
        <MockFindReplaceScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('case-sensitive-toggle'));
    });

    it('should toggle whole word', async () => {
      const { getByTestId } = renderWithProviders(
        <MockFindReplaceScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('whole-word-toggle'));
    });
  });

  describe('No Matches', () => {
    it('should show no matches message', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <MockFindReplaceScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.changeText(getByTestId('find-input'), 'xyznonexistent');
      fireEvent.press(getByTestId('find-button'));

      const message = await findByText(/no matches/i);
      expect(message).toBeTruthy();
    });
  });
});

// Mock component
const MockFindReplaceScreen = ({ navigation, route }: { navigation: any; route: any }) => {
  return null;
};
