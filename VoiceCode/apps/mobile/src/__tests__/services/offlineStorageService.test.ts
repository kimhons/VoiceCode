// VoiceCode Mobile - Offline Storage Service Tests
// The real service is IndexedDB-backed. The node test environment has no
// IndexedDB, so we provide a minimal in-memory shim (put/get/clear are the only
// primitives exercised) and test the real OfflineStorageService against it.

import { describe, it, expect, beforeEach } from '@jest/globals';
import { OfflineStorageService } from '../../services/offlineStorageService';

class FakeRequest {
  result: any = undefined;
  error: any = null;
  onsuccess: ((ev: any) => void) | null = null;
  onerror: ((ev: any) => void) | null = null;
  onupgradeneeded: ((ev: any) => void) | null = null;
}

function succeed(req: FakeRequest, result?: any) {
  req.result = result;
  queueMicrotask(() => req.onsuccess && req.onsuccess({ target: req }));
}

class FakeObjectStore {
  constructor(public keyPath: string, public data: Map<string, any>) {}
  createIndex() {}
  put(value: any) {
    const req = new FakeRequest();
    this.data.set(value[this.keyPath], value);
    succeed(req, value[this.keyPath]);
    return req;
  }
  get(key: string) {
    const req = new FakeRequest();
    succeed(req, this.data.get(key));
    return req;
  }
  clear() {
    const req = new FakeRequest();
    this.data.clear();
    succeed(req);
    return req;
  }
  index() {
    return { openCursor: () => new FakeRequest() };
  }
}

class FakeTransaction {
  oncomplete: (() => void) | null = null;
  onerror: (() => void) | null = null;
  error: any = null;
  constructor(private db: FakeDB) {
    queueMicrotask(() => this.oncomplete && this.oncomplete());
  }
  objectStore(name: string) {
    return this.db.stores[name];
  }
}

class FakeDB {
  stores: Record<string, FakeObjectStore> = {};
  objectStoreNames = { contains: (n: string) => n in this.stores };
  createObjectStore(name: string, opts: { keyPath: string }) {
    const store = new FakeObjectStore(opts.keyPath, new Map());
    this.stores[name] = store;
    return store;
  }
  transaction() {
    return new FakeTransaction(this);
  }
}

(global as any).indexedDB = {
  open() {
    const req = new FakeRequest();
    const db = new FakeDB();
    queueMicrotask(() => {
      req.onupgradeneeded && req.onupgradeneeded({ target: { result: db } });
      req.result = db;
      req.onsuccess && req.onsuccess({ target: req });
    });
    return req;
  },
};
(global as any).IDBKeyRange = { only: (v: any) => v };

const makeTranscript = (id: string) =>
  ({
    id,
    user_id: 'u1',
    audio_url: '',
    text: 'World',
    content: 'World',
    title: 'Hello',
    duration: 10,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }) as any;

describe('OfflineStorageService', () => {
  let storage: OfflineStorageService;

  beforeEach(() => {
    storage = new OfflineStorageService();
  });

  describe('saveTranscript / getTranscript', () => {
    it('round-trips a saved transcript', async () => {
      const transcript = makeTranscript('t1');

      await storage.saveTranscript(transcript);
      const result = await storage.getTranscript('t1');

      expect(result).toEqual(transcript);
    });

    it('returns null for a non-existent transcript', async () => {
      const result = await storage.getTranscript('does-not-exist');
      expect(result).toBeNull();
    });
  });

  describe('updateTranscript', () => {
    it('merges updates onto an existing transcript', async () => {
      await storage.saveTranscript(makeTranscript('t1'));

      await storage.updateTranscript('t1', { title: 'Changed' });
      const result = await storage.getTranscript('t1');

      expect(result?.title).toBe('Changed');
      expect(result?.content).toBe('World');
    });

    it('throws when updating a transcript that does not exist', async () => {
      await expect(storage.updateTranscript('ghost', { title: 'x' })).rejects.toThrow(
        'Transcript not found'
      );
    });
  });

  describe('deleteTranscript', () => {
    it('soft-deletes by setting is_deleted', async () => {
      await storage.saveTranscript(makeTranscript('t1'));

      await storage.deleteTranscript('t1');
      const result = await storage.getTranscript('t1');

      expect(result?.is_deleted).toBe(true);
    });
  });

  describe('metadata', () => {
    it('round-trips saved metadata', async () => {
      await storage.saveMetadata('lastSync', { at: 123 });
      const value = await storage.getMetadata('lastSync');

      expect(value).toEqual({ at: 123 });
    });

    it('returns null for a missing metadata key', async () => {
      const value = await storage.getMetadata('missing');
      expect(value).toBeNull();
    });
  });

  describe('clearAll', () => {
    it('removes stored transcripts', async () => {
      await storage.saveTranscript(makeTranscript('t1'));

      await storage.clearAll();
      const result = await storage.getTranscript('t1');

      expect(result).toBeNull();
    });
  });
});
