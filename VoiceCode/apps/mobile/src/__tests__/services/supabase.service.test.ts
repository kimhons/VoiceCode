// VoiceCode Mobile - Supabase Service Tests
// Comprehensive tests for Supabase integration

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { getSupabaseService } from '../../services/supabase.service';
import { mockUsers, mockTranscripts, mockErrors } from '../setup/mockData';

const supabaseService = getSupabaseService();

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      resetPasswordForEmail: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        download: jest.fn(),
        remove: jest.fn(),
        getPublicUrl: jest.fn(),
      })),
    },
  })),
}));

describe('SupabaseService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should sign in with email and password', async () => {
      const mockResponse = {
        data: {
          user: mockUsers.standard,
          session: { access_token: 'mock-token' },
        },
        error: null,
      };

      // Mock implementation
      const signInMock = jest.fn().mockResolvedValue(mockResponse);
      (supabaseService as any).client.auth.signInWithPassword = signInMock;

      const result = await supabaseService.signIn('test@example.com', 'password123');

      expect(signInMock).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.data?.user).toEqual(mockUsers.standard);
    });

    it('should handle sign in errors', async () => {
      const mockResponse = {
        data: null,
        error: mockErrors.auth,
      };

      const signInMock = jest.fn().mockResolvedValue(mockResponse);
      (supabaseService as any).client.auth.signInWithPassword = signInMock;

      const result = await supabaseService.signIn('test@example.com', 'wrong-password');

      expect(result.error).toEqual(mockErrors.auth);
      expect(result.data).toBeNull();
    });

    it('should sign up new user', async () => {
      const mockResponse = {
        data: {
          user: mockUsers.standard,
          session: { access_token: 'mock-token' },
        },
        error: null,
      };

      const signUpMock = jest.fn().mockResolvedValue(mockResponse);
      (supabaseService as any).client.auth.signUp = signUpMock;

      const result = await supabaseService.signUp('new@example.com', 'password123');

      expect(signUpMock).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
      });
      expect(result.data?.user).toEqual(mockUsers.standard);
    });

    it('should sign out user', async () => {
      const signOutMock = jest.fn().mockResolvedValue({ error: null });
      (supabaseService as any).client.auth.signOut = signOutMock;

      await supabaseService.signOut();

      expect(signOutMock).toHaveBeenCalled();
    });

    it('should get current session', async () => {
      const mockSession = {
        access_token: 'mock-token',
        user: mockUsers.standard,
      };

      const getSessionMock = jest.fn().mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });
      (supabaseService as any).client.auth.getSession = getSessionMock;

      const result = await supabaseService.getSession();

      expect(result.data?.session).toEqual(mockSession);
    });

    it('should reset password', async () => {
      const resetMock = jest.fn().mockResolvedValue({
        data: {},
        error: null,
      });
      (supabaseService as any).client.auth.resetPasswordForEmail = resetMock;

      await supabaseService.resetPassword('test@example.com');

      expect(resetMock).toHaveBeenCalledWith('test@example.com');
    });
  });

  describe('Database Operations', () => {
    it('should fetch transcripts for user', async () => {
      const mockResponse = {
        data: mockTranscripts,
        error: null,
      };

      const fromMock = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue(mockResponse),
      }));
      (supabaseService as any).client.from = fromMock;

      const result = await supabaseService.getTranscripts('user-1');

      expect(fromMock).toHaveBeenCalledWith('transcripts');
      expect(result.data).toEqual(mockTranscripts);
    });

    it('should create new transcript', async () => {
      const newTranscript = {
        user_id: 'user-1',
        title: 'New Recording',
        content: 'Transcript content',
        duration: 120,
      };

      const mockResponse = {
        data: { ...newTranscript, id: 'new-id' },
        error: null,
      };

      const fromMock = jest.fn(() => ({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockResponse),
      }));
      (supabaseService as any).client.from = fromMock;

      const result = await supabaseService.createTranscript(newTranscript);

      expect(result.data).toHaveProperty('id');
      expect(result.data?.title).toBe('New Recording');
    });

    it('should update transcript', async () => {
      const updates = {
        title: 'Updated Title',
        content: 'Updated content',
      };

      const mockResponse = {
        data: { ...mockTranscripts[0], ...updates },
        error: null,
      };

      const fromMock = jest.fn(() => ({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockResponse),
      }));
      (supabaseService as any).client.from = fromMock;

      const result = await supabaseService.updateTranscript('transcript-1', updates);

      expect(result.data?.title).toBe('Updated Title');
    });

    it('should delete transcript', async () => {
      const mockResponse = {
        data: null,
        error: null,
      };

      const fromMock = jest.fn(() => ({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue(mockResponse),
      }));
      (supabaseService as any).client.from = fromMock;

      const result = await supabaseService.deleteTranscript('transcript-1');

      expect(result.error).toBeNull();
    });

    it('should handle database errors', async () => {
      const mockResponse = {
        data: null,
        error: mockErrors.server,
      };

      const fromMock = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue(mockResponse),
      }));
      (supabaseService as any).client.from = fromMock;

      const result = await supabaseService.getTranscripts('user-1');

      expect(result.error).toEqual(mockErrors.server);
      expect(result.data).toBeNull();
    });
  });

  describe('Storage Operations', () => {
    it('should upload audio file', async () => {
      const mockFile = {
        uri: 'file://path/to/audio.m4a',
        name: 'audio.m4a',
        type: 'audio/m4a',
      };

      const mockResponse = {
        data: { path: 'uploads/audio.m4a' },
        error: null,
      };

      const storageMock = {
        from: jest.fn(() => ({
          upload: jest.fn().mockResolvedValue(mockResponse),
        })),
      };
      (supabaseService as any).client.storage = storageMock;

      const result = await supabaseService.uploadAudio(mockFile, 'user-1');

      expect(result.data?.path).toBe('uploads/audio.m4a');
    });

    it('should get public URL for file', async () => {
      const mockResponse = {
        data: { publicUrl: 'https://example.com/file.m4a' },
      };

      const storageMock = {
        from: jest.fn(() => ({
          getPublicUrl: jest.fn().mockReturnValue(mockResponse),
        })),
      };
      (supabaseService as any).client.storage = storageMock;

      const url = await supabaseService.getPublicUrl('uploads/audio.m4a');

      expect(url).toBe('https://example.com/file.m4a');
    });

    it('should delete file from storage', async () => {
      const mockResponse = {
        data: null,
        error: null,
      };

      const storageMock = {
        from: jest.fn(() => ({
          remove: jest.fn().mockResolvedValue(mockResponse),
        })),
      };
      (supabaseService as any).client.storage = storageMock;

      const result = await supabaseService.deleteFile('uploads/audio.m4a');

      expect(result.error).toBeNull();
    });
  });

  describe('Real-time Subscriptions', () => {
    it('should subscribe to transcript changes', () => {
      const callback = jest.fn();
      const mockSubscription = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn(),
      };

      const fromMock = jest.fn(() => mockSubscription);
      (supabaseService as any).client.from = fromMock;

      supabaseService.subscribeToTranscripts('user-1', callback);

      expect(fromMock).toHaveBeenCalledWith('transcripts');
      expect(mockSubscription.on).toHaveBeenCalled();
    });

    it('should unsubscribe from changes', () => {
      const mockSubscription = {
        unsubscribe: jest.fn(),
      };

      supabaseService.unsubscribe(mockSubscription as any);

      expect(mockSubscription.unsubscribe).toHaveBeenCalled();
    });
  });
});
