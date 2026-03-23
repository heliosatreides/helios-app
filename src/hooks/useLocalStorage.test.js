import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

beforeEach(() => {
  localStorageMock.clear();
});

test('returns initial value when key not in storage', () => {
  const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
  expect(result.current[0]).toBe('initial');
});

test('updates stored value', () => {
  const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
  act(() => {
    result.current[1]('updated');
  });
  expect(result.current[0]).toBe('updated');
});

test('persists value to localStorage', () => {
  const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
  act(() => {
    result.current[1]('persisted');
  });
  expect(localStorage.getItem('test-key')).toBe(JSON.stringify('persisted'));
});

test('reads existing value from localStorage', () => {
  localStorage.setItem('test-key', JSON.stringify('existing'));
  const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
  expect(result.current[0]).toBe('existing');
});

test('returns initial value when stored value is corrupted JSON', () => {
  localStorage.setItem('test-key', 'not-valid-json{{{');
  const { result } = renderHook(() => useLocalStorage('test-key', 'fallback'));
  expect(result.current[0]).toBe('fallback');
});

test('returns initial array when stored value is corrupted JSON', () => {
  localStorage.setItem('my-array', '[[invalid');
  const { result } = renderHook(() => useLocalStorage('my-array', []));
  expect(result.current[0]).toEqual([]);
});

test('supports functional updates', () => {
  const { result } = renderHook(() => useLocalStorage('count', 0));
  act(() => {
    result.current[1]((prev) => prev + 1);
  });
  expect(result.current[0]).toBe(1);
});
