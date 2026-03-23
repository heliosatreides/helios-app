import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useGemini } from './useGemini';

// ---- storage mock ----
const storageMock = (() => {
  let store = {};
  return {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: storageMock, writable: true });

// ---- mock fetch ----
const mockFetch = vi.fn();
global.fetch = mockFetch;

const geminiOkResponse = (text = 'Here are some suggestions...') => ({
  ok: true,
  json: async () => ({
    candidates: [{
      content: { parts: [{ text }] },
      finishReason: 'STOP',
    }],
  }),
});

const geminiErrorResponse = (status = 400, msg = 'API key not valid') => ({
  ok: false,
  status,
  json: async () => ({ error: { code: status, message: msg, status: 'INVALID_ARGUMENT' } }),
});

beforeEach(() => {
  storageMock.clear();
  mockFetch.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useGemini', () => {
  it('hasKey is false when no key stored', () => {
    const { result } = renderHook(() => useGemini());
    expect(result.current.hasKey).toBe(false);
  });

  it('hasKey is true when key is set', () => {
    storageMock.setItem('helios-gemini-key', 'AIzaTest123');
    const { result } = renderHook(() => useGemini());
    expect(result.current.hasKey).toBe(true);
  });

  it('throws when no API key configured', async () => {
    const { result } = renderHook(() => useGemini());
    let threw = false;
    await act(async () => {
      try { await result.current.generate('hello'); }
      catch { threw = true; }
    });
    expect(threw).toBe(true);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns generated text on success', async () => {
    storageMock.setItem('helios-gemini-key', 'AIzaFake');
    mockFetch.mockResolvedValueOnce(geminiOkResponse('Activity 1, Activity 2, Activity 3'));

    const { result } = renderHook(() => useGemini());
    let text;
    await act(async () => {
      text = await result.current.generate('Suggest 3 activities for Tokyo');
    });

    expect(text).toBe('Activity 1, Activity 2, Activity 3');
    expect(result.current.error).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('gemini-2.0-flash:generateContent'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('sets error on API failure', async () => {
    storageMock.setItem('helios-gemini-key', 'AIzaFake');
    mockFetch.mockResolvedValueOnce(geminiErrorResponse(400, 'API key not valid'));

    const { result } = renderHook(() => useGemini());
    let threw = false;
    await act(async () => {
      try { await result.current.generate('test'); }
      catch { threw = true; }
    });

    expect(threw).toBe(true);
    expect(result.current.error).toMatch(/API key not valid/);
  });

  it('sets loading true while generating', async () => {
    storageMock.setItem('helios-gemini-key', 'AIzaFake');
    let resolvePromise;
    mockFetch.mockImplementationOnce(() => new Promise((res) => { resolvePromise = res; }));

    const { result } = renderHook(() => useGemini());
    let genPromise;
    act(() => { genPromise = result.current.generate('test'); });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolvePromise(geminiOkResponse('done'));
      await genPromise;
    });

    expect(result.current.loading).toBe(false);
  });

  it('includes API key in fetch URL', async () => {
    storageMock.setItem('helios-gemini-key', 'AIza_MY_KEY_XYZ');
    mockFetch.mockResolvedValueOnce(geminiOkResponse('response'));

    const { result } = renderHook(() => useGemini());
    await act(async () => {
      await result.current.generate('prompt');
    });

    const url = mockFetch.mock.calls[0][0];
    expect(url).toContain('key=AIza_MY_KEY_XYZ');
  });
});
