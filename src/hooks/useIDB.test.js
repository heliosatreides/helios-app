import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// ---- Mock idb ----
const idbStore = {};
vi.mock('idb', () => ({
  openDB: vi.fn(async () => ({
    get: async (store, key) => idbStore[key],
    put: async (store, value, key) => { idbStore[key] = value; },
    objectStoreNames: { contains: () => true },
  })),
}));

import { useIDB, idbGet, idbSet } from './useIDB';

// ---- storage mock ----
const lsStore = {};
const localStorageMock = {
  getItem: (k) => lsStore[k] ?? null,
  setItem: (k, v) => { lsStore[k] = String(v); },
  removeItem: (k) => { delete lsStore[k]; },
  clear: () => { Object.keys(lsStore).forEach((k) => delete lsStore[k]); },
};
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

beforeEach(() => {
  Object.keys(idbStore).forEach((k) => delete idbStore[k]);
  localStorageMock.clear();
});

describe('useIDB', () => {
  it('returns initial value on first render', async () => {
    const { result } = renderHook(() => useIDB('test-key', []));
    // Initially shows initialValue
    expect(result.current[0]).toEqual([]);
    // Wait for ready
    await waitFor(() => result.current[2] === true);
    expect(result.current[0]).toEqual([]);
  });

  it('stores and retrieves a value', async () => {
    const { result } = renderHook(() => useIDB('trips', []));
    await waitFor(() => result.current[2] === true);

    await act(async () => {
      await result.current[1]([{ id: '1', name: 'Paris' }]);
    });

    expect(result.current[0]).toEqual([{ id: '1', name: 'Paris' }]);
    expect(idbStore['trips']).toEqual([{ id: '1', name: 'Paris' }]);
  });

  it('supports functional updates', async () => {
    const { result } = renderHook(() => useIDB('list', [1, 2]));
    await waitFor(() => result.current[2] === true);

    // Pre-seed
    await act(async () => {
      await result.current[1]([1, 2]);
    });

    await act(async () => {
      await result.current[1]((prev) => [...prev, 3]);
    });

    expect(result.current[0]).toEqual([1, 2, 3]);
  });

  it('migrates data from localStorage to IDB on first load', async () => {
    // Put data in localStorage
    localStorageMock.setItem('finance-accounts', JSON.stringify([{ id: 'a1', name: 'Checking' }]));

    const { result } = renderHook(() => useIDB('finance-accounts', []));
    await waitFor(() => result.current[2] === true);

    // Should have migrated data
    expect(result.current[0]).toEqual([{ id: 'a1', name: 'Checking' }]);
    // localStorage entry should be removed after migration
    expect(localStorageMock.getItem('finance-accounts')).toBeNull();
    // IDB should have the data
    expect(idbStore['finance-accounts']).toEqual([{ id: 'a1', name: 'Checking' }]);
  });

  it('does not overwrite IDB data with localStorage on subsequent loads', async () => {
    // Seed IDB directly
    idbStore['sports-favs'] = ['NBA', 'NFL'];
    // Also seed localStorage (simulating stale data)
    localStorageMock.setItem('sports-favs', JSON.stringify(['OLD']));

    const { result } = renderHook(() => useIDB('sports-favs', []));
    await waitFor(() => result.current[2] === true);

    // Should prefer IDB data
    expect(result.current[0]).toEqual(['NBA', 'NFL']);
  });

  it('returns ready=true after loading', async () => {
    const { result } = renderHook(() => useIDB('ready-test', null));
    await waitFor(() => result.current[2] === true);
    expect(result.current[2]).toBe(true);
  });
});

describe('idbGet / idbSet utilities', () => {
  it('idbSet stores a value', async () => {
    await idbSet('util-key', { foo: 'bar' });
    expect(idbStore['util-key']).toEqual({ foo: 'bar' });
  });

  it('idbGet retrieves a value', async () => {
    idbStore['get-test'] = 42;
    const val = await idbGet('get-test');
    expect(val).toBe(42);
  });

  it('idbGet returns undefined for missing key', async () => {
    const val = await idbGet('nonexistent-key-xyz');
    expect(val).toBeUndefined();
  });
});
