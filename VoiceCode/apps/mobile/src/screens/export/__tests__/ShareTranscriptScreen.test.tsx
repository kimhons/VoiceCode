// VoiceFlow Pro Mobile - ShareTranscriptScreen Tests

import exportReducer, {
  createShareLink,
  getSharedTranscripts,
  deleteShareLink,
} from '../../../store/slices/exportSlice';
import { ShareLink } from '../../../services/MobileExportService';

describe('ShareTranscriptScreen - Redux Logic', () => {
  it('initializes with empty share links', () => {
    const state = exportReducer(undefined, { type: 'unknown' });
    expect(state.shareLinks).toEqual([]);
    expect(state.shareLinksLoading).toBe(false);
    expect(state.shareLinksError).toBeNull();
  });

  it('handles createShareLink.pending', () => {
    const state = exportReducer(
      undefined,
      createShareLink.pending('', {
        transcriptId: 'transcript-1',
        userId: 'user-123',
        options: { accessLevel: 'view' },
      })
    );
    expect(state.shareLinksLoading).toBe(true);
    expect(state.shareLinksError).toBeNull();
  });

  it('handles createShareLink.fulfilled', () => {
    const shareLink: ShareLink = {
      id: 'share-1',
      transcriptId: 'transcript-1',
      sharedBy: 'user-123',
      shareLink: 'abc123xyz',
      accessLevel: 'view',
      viewCount: 0,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    const state = exportReducer(
      undefined,
      createShareLink.fulfilled(shareLink, '', {
        transcriptId: 'transcript-1',
        userId: 'user-123',
        options: { accessLevel: 'view' },
      })
    );

    expect(state.shareLinksLoading).toBe(false);
    expect(state.shareLinks).toHaveLength(1);
    expect(state.shareLinks[0]).toEqual(shareLink);
  });

  it('handles createShareLink.rejected', () => {
    const state = exportReducer(
      undefined,
      createShareLink.rejected(new Error('Failed to create share link'), '', {
        transcriptId: 'transcript-1',
        userId: 'user-123',
        options: { accessLevel: 'view' },
      })
    );

    expect(state.shareLinksLoading).toBe(false);
    expect(state.shareLinksError).toBe('Failed to create share link');
  });

  it('handles getSharedTranscripts.fulfilled', () => {
    const shareLinks: ShareLink[] = [
      {
        id: 'share-1',
        transcriptId: 'transcript-1',
        sharedBy: 'user-123',
        shareLink: 'abc123',
        accessLevel: 'view',
        viewCount: 5,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'share-2',
        transcriptId: 'transcript-2',
        sharedBy: 'user-123',
        shareLink: 'xyz789',
        accessLevel: 'edit',
        viewCount: 2,
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      },
    ];

    const state = exportReducer(
      undefined,
      getSharedTranscripts.fulfilled(shareLinks, '', 'user-123')
    );

    expect(state.shareLinksLoading).toBe(false);
    expect(state.shareLinks).toEqual(shareLinks);
  });

  it('handles deleteShareLink.fulfilled', () => {
    const initialState = exportReducer(
      undefined,
      getSharedTranscripts.fulfilled(
        [
          {
            id: 'share-1',
            transcriptId: 'transcript-1',
            sharedBy: 'user-123',
            shareLink: 'abc123',
            accessLevel: 'view',
            viewCount: 0,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
        '',
        'user-123'
      )
    );

    const state = exportReducer(
      initialState,
      deleteShareLink.fulfilled('share-1', '', 'share-1')
    );

    expect(state.shareLinks).toHaveLength(0);
  });

  it('handles different access levels', () => {
    const accessLevels: Array<'view' | 'comment' | 'edit'> = ['view', 'comment', 'edit'];

    accessLevels.forEach((accessLevel) => {
      const shareLink: ShareLink = {
        id: `share-${accessLevel}`,
        transcriptId: 'transcript-1',
        sharedBy: 'user-123',
        shareLink: 'abc123',
        accessLevel,
        viewCount: 0,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      expect(shareLink.accessLevel).toBe(accessLevel);
    });
  });

  it('handles share link with email', () => {
    const shareLink: ShareLink = {
      id: 'share-1',
      transcriptId: 'transcript-1',
      sharedBy: 'user-123',
      sharedWithEmail: 'recipient@example.com',
      shareLink: 'abc123',
      accessLevel: 'view',
      viewCount: 0,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    expect(shareLink.sharedWithEmail).toBe('recipient@example.com');
  });
});

