import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useStockQuote } from './useStockQuote';
import { useStockSearch } from './useStockSearch';

// ---- mock fetch ----
const mockFetch = vi.fn();
global.fetch = mockFetch;

const validYahooResponse = (symbol = 'AAPL', price = 182.5, name = 'Apple Inc.') => ({
  ok: true,
  json: async () => ({
    chart: {
      result: [{
        meta: {
          regularMarketPrice: price,
          shortName: name,
          symbol,
        },
        timestamp: [1234567890],
        indicators: { quote: [{}] },
      }],
      error: null,
    },
  }),
});

const notFoundResponse = () => ({
  ok: true,
  json: async () => ({
    chart: {
      result: null,
      error: { code: 'Not Found', description: 'No fundamentals data found' },
    },
  }),
});

const httpErrorResponse = (status = 404) => ({
  ok: false,
  status,
  json: async () => ({}),
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
    mockFetch.mockResolvedValueOnce(validYahooResponse('AAPL', 182.5, 'Apple Inc.'));
    const { result } = renderHook(() => useStockQuote());

    await act(async () => {
      await result.current.fetchQuote('AAPL');
    });

    expect(result.current.price).toBe(182.5);
    expect(result.current.name).toBe('Apple Inc.');
    expect(result.current.error).toBeNull();
    expect(result.current.lastUpdated).toBeTruthy();
    expect(mockFetch).toHaveBeenCalledWith(
      'https://query2.finance.yahoo.com/v8/finance/chart/AAPL'
    );
  });

  it('sets loading true while fetching', async () => {
    let resolvePromise;
    mockFetch.mockImplementationOnce(() => new Promise((res) => { resolvePromise = res; }));

    const { result } = renderHook(() => useStockQuote());
    let fetchPromise;
    act(() => { fetchPromise = result.current.fetchQuote('TSLA'); });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolvePromise(validYahooResponse('TSLA', 250, 'Tesla Inc.'));
      await fetchPromise;
    });

    expect(result.current.loading).toBe(false);
  });

  it('handles invalid ticker (null result)', async () => {
    mockFetch.mockResolvedValueOnce(notFoundResponse());
    const { result } = renderHook(() => useStockQuote());

    await act(async () => {
      try { await result.current.fetchQuote('INVALID_XYZ'); } catch {}
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.price).toBeNull();
  });

  it('handles HTTP error', async () => {
    mockFetch.mockResolvedValueOnce(httpErrorResponse(404));
    const { result } = renderHook(() => useStockQuote());

    await act(async () => {
      try { await result.current.fetchQuote('NOTREAL'); } catch {}
    });

    expect(result.current.error).toMatch(/HTTP 404/);
    expect(result.current.price).toBeNull();
  });

  it('uppercases ticker in request URL', async () => {
    mockFetch.mockResolvedValueOnce(validYahooResponse('MSFT', 300, 'Microsoft'));
    const { result } = renderHook(() => useStockQuote());

    await act(async () => {
      await result.current.fetchQuote('msft');
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://query2.finance.yahoo.com/v8/finance/chart/MSFT'
    );
  });
});

describe('useStockSearch', () => {
  it('validates a valid ticker', async () => {
    mockFetch.mockResolvedValueOnce(validYahooResponse('GOOG', 140, 'Alphabet Inc.'));
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
