/**
 * useIDB tests
 * Note: idb is mocked globally in setupTests.js with __idbStore
 * Each test clears __idbStore via the global beforeEach in setupTests.js
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useIDB, idbGet, idbSet } from './useIDB';

// ---- localStorage mock ----
const lsStore = {};
const localStorageMock = {
  getItem: (k) => lsStore[k] ?? null,
  setItem: (k, v) => { lsStore[k] = String(v); },
  removeItem: (k) => { delete lsStore[k]; },
  clear: () => { Object.keys(lsStore).forEach((k) => delete lsStore[k]); },
};
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

beforeEach(() => {
  localStorageMock.clear();
});

// Helper: render hook and wait until ready
async function renderIDB(key, initial) {
  const hook = renderHook(() => useIDB(key, initial));
  await waitFor(() => {
    expect(hook.result.current[2]).toBe(true);
  }, { timeout: 3000 });
  return hook;
}

describe('useIDB', () => {
  it('starts with initial value', async () => {
    const { result } = await renderIDB('init-test', []);
    expect(result.current[0]).toEqual([]);
    expect(result.current[2]).toBe(true);
  });

  it('stores a value and retrieves it', async () => {
    const { result } = await renderIDB('store-test', []);

    await act(async () => {
      await result.current[1]([{ id: '1', name: 'Paris' }]);
    });

    expect(result.current[0]).toEqual([{ id: '1', name: 'Paris' }]);
  });

  it('supports functional updates', async () => {
    const { result } = await renderIDB('func-test', []);

    await act(async () => { await result.current[1]([1, 2]); });
    await act(async () => { await result.current[1]((prev) => [...prev, 3]); });

    expect(result.current[0]).toEqual([1, 2, 3]);
  });

  it('migrates data from localStorage on first load', async () => {
    localStorageMock.setItem('mig-test', JSON.stringify({ foo: 'bar' }));

    const { result } = await renderIDB('mig-test', null);

    expect(result.current[0]).toEqual({ foo: 'bar' });
    // localStorage should be cleared after migration
    expect(localStorageMock.getItem('mig-test')).toBeNull();
  });

  it('prefers IDB data over localStorage when IDB has a value', async () => {
    await idbSet('pref-test', ['IDB_DATA']);
    localStorageMock.setItem('pref-test', JSON.stringify(['LS_DATA']));

    const { result } = await renderIDB('pref-test', []);

    expect(result.current[0]).toEqual(['IDB_DATA']);
  });
});

describe('idbGet / idbSet utilities', () => {
  it('idbSet stores a value retrievable by idbGet', async () => {
    await idbSet('util-test', { x: 1 });
    const val = await idbGet('util-test');
    expect(val).toEqual({ x: 1 });
  });

  it('idbGet returns undefined for missing key', async () => {
    const val = await idbGet('missing-xyz-abc');
    expect(val).toBeUndefined();
  });

  it('idbSet overwrites existing value', async () => {
    await idbSet('overwrite-test', 'first');
    await idbSet('overwrite-test', 'second');
    expect(await idbGet('overwrite-test')).toBe('second');
  });
});
