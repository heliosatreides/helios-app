import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Global in-memory IDB mock for tests
// This prevents "indexedDB is not defined" errors in jsdom
const _idbStore = {};

vi.mock('idb', () => ({
  openDB: vi.fn(async () => ({
    get: async (_store, key) => _idbStore[key],
    put: async (_store, value, key) => { _idbStore[key] = value; return value; },
    delete: async (_store, key) => { delete _idbStore[key]; },
    objectStoreNames: { contains: () => true },
  })),
}));

// Expose for test cleanup if needed
globalThis.__idbStore = _idbStore;
