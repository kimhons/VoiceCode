// VoiceCode Mobile - Comments Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import CommentsScreen from '../../screens/collaboration/CommentsScreen';

describe('CommentsScreen', () => {
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
    it('should render comments screen', () => {
      const { getByTestId } = renderWithProviders(
        <CommentsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByTestId('comments-screen')).toBeTruthy();
    });

    it('should display comment list', () => {
      const { getByTestId } = renderWithProviders(
        <CommentsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByTestId('comment-list')).toBeTruthy();
    });
  });

  describe('Add Comment', () => {
    it('should add new comment', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <CommentsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.changeText(getByTestId('comment-input'), 'New comment');
      fireEvent.press(getByTestId('submit-comment'));

      const comment = await findByText('New comment');
      expect(comment).toBeTruthy();
    });

    it('should add comment at position', async () => {
      const { getByTestId, findByTestId } = renderWithProviders(
        <CommentsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('transcript-word-5'));
      fireEvent.changeText(getByTestId('comment-input'), 'Comment at position');
      fireEvent.press(getByTestId('submit-comment'));

      const positioned = await findByTestId('positioned-comment');
      expect(positioned).toBeTruthy();
    });
  });

  describe('Reply', () => {
    it('should reply to comment', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <CommentsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('reply-button-1'));
      fireEvent.changeText(getByTestId('comment-input'), 'Reply text');
      fireEvent.press(getByTestId('submit-comment'));

      const reply = await findByText('Reply text');
      expect(reply).toBeTruthy();
    });
  });

  describe('Edit Comment', () => {
    it('should edit own comment', async () => {
      const { getByTestId } = renderWithProviders(
        <CommentsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('edit-comment-1'));
      fireEvent.changeText(getByTestId('comment-input'), 'Edited comment');
      fireEvent.press(getByTestId('save-comment'));
    });
  });

  describe('Delete Comment', () => {
    it('should delete own comment', async () => {
      const { getByTestId, queryByTestId } = renderWithProviders(
        <CommentsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('delete-comment-1'));
      fireEvent.press(getByTestId('confirm-delete'));

      await waitFor(() => {
        expect(queryByTestId('comment-1')).toBeNull();
      });
    });
  });

  describe('Resolve', () => {
    it('should resolve comment thread', async () => {
      const { getByTestId } = renderWithProviders(
        <CommentsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('resolve-thread-1'));
    });

    it('should unresolve comment thread', async () => {
      const { getByTestId } = renderWithProviders(
        <CommentsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('unresolve-thread-1'));
    });
  });

  describe('Filter', () => {
    it('should filter by resolved status', async () => {
      const { getByTestId } = renderWithProviders(
        <CommentsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('filter-resolved'));
    });
  });
});
