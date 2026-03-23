import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Global in-memory IDB mock for all tests
// Prevents "indexedDB is not defined" in jsdom environment
const _globalIdbStore = {};
globalThis.__idbStore = _globalIdbStore;

vi.mock('idb', () => ({
  openDB: vi.fn(async () => ({
    get: async (_store, key) => _globalIdbStore[key],
    put: async (_store, value, key) => { _globalIdbStore[key] = value; return value; },
    delete: async (_store, key) => { delete _globalIdbStore[key]; },
    objectStoreNames: { contains: () => true },
  })),
}));

// Clear before each test to prevent cross-test pollution
beforeEach(() => {
  Object.keys(_globalIdbStore).forEach((k) => delete _globalIdbStore[k]);
});
