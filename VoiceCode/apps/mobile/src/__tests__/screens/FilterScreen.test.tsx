// VoiceCode Mobile - Filter Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import FilterScreen from '../../screens/search/FilterScreen';

describe('FilterScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render filter screen', () => {
      const { getByTestId } = renderWithProviders(
        <FilterScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('filter-screen')).toBeTruthy();
    });
  });

  describe('Date Filter', () => {
    it('should select date range', async () => {
      const { getByTestId, findByTestId } = renderWithProviders(
        <FilterScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('date-range-picker'));

      const picker = await findByTestId('date-picker');
      expect(picker).toBeTruthy();
    });

    it('should select preset date range', async () => {
      const { getByText } = renderWithProviders(
        <FilterScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByText(/last 7 days/i));
    });
  });

  describe('Tag Filter', () => {
    it('should select tags', async () => {
      const { getByTestId } = renderWithProviders(
        <FilterScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('tag-work'));
    });

    it('should select multiple tags', async () => {
      const { getByTestId } = renderWithProviders(
        <FilterScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('tag-work'));
      fireEvent.press(getByTestId('tag-meeting'));
    });
  });

  describe('Folder Filter', () => {
    it('should select folder', async () => {
      const { getByTestId, getByText } = renderWithProviders(
        <FilterScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('folder-selector'));
      fireEvent.press(getByText(/projects/i));
    });
  });

  describe('Duration Filter', () => {
    it('should set duration range', async () => {
      const { getByTestId } = renderWithProviders(
        <FilterScreen navigation={mockNavigation as any} />
      );

      fireEvent(getByTestId('duration-slider'), 'onValueChange', [0, 60]);
    });
  });

  describe('Apply Filters', () => {
    it('should apply filters', async () => {
      const { getByTestId } = renderWithProviders(
        <FilterScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('apply-filters'));

      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });

  describe('Clear Filters', () => {
    it('should clear all filters', async () => {
      const { getByTestId } = renderWithProviders(
        <FilterScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('clear-filters'));
    });
  });

  describe('Save Preset', () => {
    it('should save filter preset', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <FilterScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('save-preset'));

      const message = await findByText(/saved/i);
      expect(message).toBeTruthy();
    });
  });
});
