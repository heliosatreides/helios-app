import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useStockQuote } from './useStockQuote';
import { useStockSearch } from './useStockSearch';

// ---- mock fetch ----
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Proxy response shape: { symbol, price, name }
const validProxyResponse = (symbol = 'AAPL', price = 182.5, name = 'Apple Inc.') => ({
  ok: true,
  json: async () => ({ symbol, price, name }),
});

const notFoundResponse = () => ({
  ok: false,
  status: 404,
  json: async () => ({ error: 'Ticker not found' }),
});

const httpErrorResponse = (status = 500) => ({
  ok: false,
  status,
  json: async () => ({ error: `HTTP ${status}` }),
});

beforeEach(() => {
  mockFetch.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useStockQuote', () => {
  it('starts with null price', () => {
    const { result } = renderHook(() => useStockQuote());
    expect(result.current.price).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('fetches price successfully', async () => {
    mockFetch.mockResolvedValueOnce(validProxyResponse('AAPL', 182.5, 'Apple Inc.'));
    const { result } = renderHook(() => useStockQuote());

    await act(async () => {
      await result.current.fetchQuote('AAPL');
    });

    expect(result.current.price).toBe(182.5);
    expect(result.current.name).toBe('Apple Inc.');
    expect(result.current.error).toBeNull();
    expect(result.current.lastUpdated).toBeTruthy();
    expect(mockFetch).toHaveBeenCalledWith('/api/stock?symbol=AAPL');
  });

  it('sets loading true while fetching', async () => {
    let resolvePromise;
    mockFetch.mockImplementationOnce(() => new Promise((res) => { resolvePromise = res; }));

    const { result } = renderHook(() => useStockQuote());
    let fetchPromise;
    act(() => { fetchPromise = result.current.fetchQuote('TSLA'); });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolvePromise(validProxyResponse('TSLA', 250, 'Tesla Inc.'));
      await fetchPromise;
    });

    expect(result.current.loading).toBe(false);
  });

  it('handles invalid ticker (404 from proxy)', async () => {
    mockFetch.mockResolvedValueOnce(notFoundResponse());
    const { result } = renderHook(() => useStockQuote());

    await act(async () => {
      try { await result.current.fetchQuote('INVALID_XYZ'); } catch {}
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.price).toBeNull();
  });

  it('handles HTTP error', async () => {
    mockFetch.mockResolvedValueOnce(httpErrorResponse(500));
    const { result } = renderHook(() => useStockQuote());

    await act(async () => {
      try { await result.current.fetchQuote('NOTREAL'); } catch {}
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.price).toBeNull();
  });

  it('uppercases ticker in request URL', async () => {
    mockFetch.mockResolvedValueOnce(validProxyResponse('MSFT', 300, 'Microsoft'));
    const { result } = renderHook(() => useStockQuote());

    await act(async () => {
      await result.current.fetchQuote('msft');
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/stock?symbol=MSFT');
  });
});

describe('useStockSearch', () => {
  it('validates a valid ticker', async () => {
    mockFetch.mockResolvedValueOnce(validProxyResponse('GOOG', 140, 'Alphabet Inc.'));
    const { result } = renderHook(() => useStockSearch());

    let res;
    await act(async () => {
      res = await result.current.validate('GOOG');
    });

    expect(res.price).toBe(140);
    expect(res.name).toBe('Alphabet Inc.');
    expect(result.current.error).toBeNull();
  });

  it('throws for invalid ticker', async () => {
    mockFetch.mockResolvedValueOnce(notFoundResponse());
    const { result } = renderHook(() => useStockSearch());

    let thrown = false;
    await act(async () => {
      try { await result.current.validate('FAKEXYZ'); }
      catch { thrown = true; }
    });

    expect(thrown).toBe(true);
    expect(result.current.error).toBeTruthy();
  });

  it('throws for empty ticker', async () => {
    const { result } = renderHook(() => useStockSearch());
    let thrown = false;
    await act(async () => {
      try { await result.current.validate(''); }
      catch { thrown = true; }
    });
    expect(thrown).toBe(true);
  });
});
