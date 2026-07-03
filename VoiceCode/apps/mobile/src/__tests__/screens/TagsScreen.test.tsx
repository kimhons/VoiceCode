// VoiceCode Mobile - Tags Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import TagsScreen from '../../screens/library/TagsScreen';

describe('TagsScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render tags screen', () => {
      const { getByTestId } = renderWithProviders(
        <TagsScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('tags-screen')).toBeTruthy();
    });

    it('should display tag list', () => {
      const { getByTestId } = renderWithProviders(
        <TagsScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('tag-list')).toBeTruthy();
    });
  });

  describe('Tag Management', () => {
    it('should create new tag', async () => {
      const { getByTestId, findByTestId } = renderWithProviders(
        <TagsScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('add-tag'));

      const input = await findByTestId('tag-name-input');
      fireEvent.changeText(input, 'New Tag');
      fireEvent.press(getByTestId('save-tag'));
    });

    it('should edit tag name', async () => {
      const { getByTestId, findByTestId } = renderWithProviders(
        <TagsScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('tag-1'));
      fireEvent.press(getByTestId('edit-tag'));

      const input = await findByTestId('tag-name-input');
      fireEvent.changeText(input, 'Updated Tag');
      fireEvent.press(getByTestId('save-tag'));
    });

    it('should change tag color', async () => {
      const { getByTestId, findByTestId } = renderWithProviders(
        <TagsScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('tag-1'));
      fireEvent.press(getByTestId('change-color'));

      const colorPicker = await findByTestId('color-picker');
      expect(colorPicker).toBeTruthy();
    });

    it('should delete tag', async () => {
      const { getByTestId, queryByTestId } = renderWithProviders(
        <TagsScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('tag-1'));
      fireEvent.press(getByTestId('delete-tag'));
      fireEvent.press(getByTestId('confirm-delete'));

      await waitFor(() => {
        expect(queryByTestId('tag-1')).toBeNull();
      });
    });
  });

  describe('Tag Stats', () => {
    it('should display transcript count per tag', () => {
      const { getByText } = renderWithProviders(
        <TagsScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/transcripts/i)).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    it('should filter library by tag on tap', () => {
      const { getByTestId } = renderWithProviders(
        <TagsScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('tag-1'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith(
        'Library',
        expect.objectContaining({
          filterTag: expect.any(String),
        })
      );
    });
  });
});
