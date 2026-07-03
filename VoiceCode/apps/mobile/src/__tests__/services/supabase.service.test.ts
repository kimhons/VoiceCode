// VoiceCode Mobile - Supabase Service Tests
// Tests the real SupabaseService class API (auth + transcript CRUD + search).
// The service reads env vars at construction; since they are absent in tests we
// inject a controllable mock client onto the instance.

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { getSupabaseService } from '../../services/supabaseService';

const service = getSupabaseService();

// A chainable query-builder whose terminal call resolves to `result`.
// Covers both `.single()` terminals and directly-awaited chains (`.range()`, `.eq()`, `.limit()`).
function queryResult(result: { data: any; error: any }) {
  const qb: any = {};
  ['select', 'insert', 'update', 'upsert', 'delete', 'eq', 'neq', 'or', 'order', 'range', 'limit'].forEach(
    (m) => {
      qb[m] = jest.fn(() => qb);
    }
  );
  qb.single = jest.fn(() => Promise.resolve(result));
  qb.then = (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject);
  return qb;
}

function mockClient() {
  return {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(() => Promise.resolve({ error: null })),
      onAuthStateChange: jest.fn(),
    },
    from: jest.fn(() => queryResult({ data: null, error: null })),
  } as any;
}

describe('SupabaseService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (service as any).client = null;
    (service as any).currentUser = null;
    (service as any).isInitialized = false;
  });

  describe('Authentication', () => {
    it('signs in, returns the session, and stores the current user', async () => {
      const session = { access_token: 'mock-token', user: { id: 'u1' } };
      const client = mockClient();
      client.auth.signInWithPassword = jest
        .fn()
        .mockResolvedValue({ data: { user: { id: 'u1' }, session }, error: null });
      (service as any).client = client;

      const result = await service.signIn('test@example.com', 'password123');

      expect(client.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result).toEqual(session);
      expect(service.getCurrentUser()).toEqual({ id: 'u1' });
    });

    it('throws when sign in returns an auth error', async () => {
      const client = mockClient();
      client.auth.signInWithPassword = jest
        .fn()
        .mockResolvedValue({ data: {}, error: new Error('Invalid login credentials') });
      (service as any).client = client;

      await expect(service.signIn('test@example.com', 'wrong')).rejects.toThrow(
        'Invalid login credentials'
      );
    });

    it('throws when sign in succeeds but no session is returned', async () => {
      const client = mockClient();
      client.auth.signInWithPassword = jest
        .fn()
        .mockResolvedValue({ data: { user: null, session: null }, error: null });
      (service as any).client = client;

      await expect(service.signIn('test@example.com', 'password123')).rejects.toThrow(
        'Failed to create session'
      );
    });

    it('signs up a new user and creates their profile', async () => {
      const client = mockClient();
      client.auth.signUp = jest
        .fn()
        .mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
      (service as any).client = client;

      const user = await service.signUp('new@example.com', 'password123', 'Neo');

      expect(client.auth.signUp).toHaveBeenCalled();
      expect(user).toEqual({ id: 'u1' });
      expect(client.from).toHaveBeenCalledWith('user_profiles');
    });

    it('throws when sign up returns an auth error', async () => {
      const client = mockClient();
      client.auth.signUp = jest
        .fn()
        .mockResolvedValue({ data: {}, error: new Error('Email already registered') });
      (service as any).client = client;

      await expect(service.signUp('new@example.com', 'password123')).rejects.toThrow(
        'Email already registered'
      );
    });

    it('signs out and clears the current user', async () => {
      const client = mockClient();
      client.auth.signOut = jest.fn().mockResolvedValue({ error: null });
      (service as any).client = client;
      (service as any).currentUser = { id: 'u1' };

      await service.signOut();

      expect(client.auth.signOut).toHaveBeenCalled();
      expect(service.getCurrentUser()).toBeNull();
    });

    it('reports availability based on initialization state', () => {
      (service as any).client = mockClient();
      (service as any).isInitialized = true;
      expect(service.isAvailable()).toBe(true);

      (service as any).isInitialized = false;
      expect(service.isAvailable()).toBe(false);
    });
  });

  describe('User profile', () => {
    it('fetches a user profile by id', async () => {
      const profile = { id: 'u1', email: 'test@example.com' };
      const client = mockClient();
      client.from = jest.fn(() => queryResult({ data: profile, error: null }));
      (service as any).client = client;

      const result = await service.getUserProfile('u1');

      expect(client.from).toHaveBeenCalledWith('user_profiles');
      expect(result).toEqual(profile);
    });

    it('throws when no user id is available', async () => {
      (service as any).client = mockClient();
      (service as any).currentUser = null;

      await expect(service.getUserProfile()).rejects.toThrow('No user ID provided');
    });
  });

  describe('Transcript operations', () => {
    it('saves a transcript for the current user', async () => {
      const saved = { id: 't1', title: 'New Recording', user_id: 'u1' };
      const client = mockClient();
      client.from = jest.fn(() => queryResult({ data: saved, error: null }));
      (service as any).client = client;
      (service as any).currentUser = { id: 'u1' };

      const result = await service.saveTranscript({ title: 'New Recording', content: 'x' } as any);

      expect(client.from).toHaveBeenCalledWith('transcripts');
      expect(result).toEqual(saved);
    });

    it('throws when saving a transcript with no user logged in', async () => {
      (service as any).client = mockClient();
      (service as any).currentUser = null;

      await expect(service.saveTranscript({} as any)).rejects.toThrow('No user logged in');
    });

    it('lists transcripts for the current user', async () => {
      const rows = [{ id: 't1' }, { id: 't2' }];
      const client = mockClient();
      client.from = jest.fn(() => queryResult({ data: rows, error: null }));
      (service as any).client = client;
      (service as any).currentUser = { id: 'u1' };

      const result = await service.getTranscripts();

      expect(client.from).toHaveBeenCalledWith('transcripts');
      expect(result).toEqual(rows);
    });

    it('fetches a single transcript by id', async () => {
      const row = { id: 't1', title: 'Hello' };
      const client = mockClient();
      client.from = jest.fn(() => queryResult({ data: row, error: null }));
      (service as any).client = client;

      const result = await service.getTranscript('t1');

      expect(result).toEqual(row);
    });

    it('throws when fetching a transcript hits a database error', async () => {
      const client = mockClient();
      client.from = jest.fn(() => queryResult({ data: null, error: new Error('DB unavailable') }));
      (service as any).client = client;

      await expect(service.getTranscript('t1')).rejects.toThrow('DB unavailable');
    });

    it('updates a transcript and returns the updated row', async () => {
      const updated = { id: 't1', title: 'Updated Title' };
      const client = mockClient();
      client.from = jest.fn(() => queryResult({ data: updated, error: null }));
      (service as any).client = client;

      const result = await service.updateTranscript('t1', { title: 'Updated Title' });

      expect(result).toEqual(updated);
    });

    it('soft-deletes a transcript without throwing', async () => {
      const client = mockClient();
      client.from = jest.fn(() => queryResult({ data: null, error: null }));
      (service as any).client = client;

      await expect(service.deleteTranscript('t1')).resolves.toBeUndefined();
      expect(client.from).toHaveBeenCalledWith('transcripts');
    });

    it('searches transcripts for the current user', async () => {
      const rows = [{ id: 't1', title: 'meeting notes' }];
      const client = mockClient();
      client.from = jest.fn(() => queryResult({ data: rows, error: null }));
      (service as any).client = client;
      (service as any).currentUser = { id: 'u1' };

      const result = await service.searchTranscripts('meeting');

      expect(result).toEqual(rows);
    });
  });
});
