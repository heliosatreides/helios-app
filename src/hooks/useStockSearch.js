import { useState, useCallback } from 'react';

/**
 * Validates a ticker by attempting to fetch a quote.
 * Returns { validate } where validate(ticker) returns { price, name } or throws.
 */
export function useStockSearch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const validate = useCallback(async (ticker) => {
    if (!ticker?.trim()) throw new Error('Ticker is required');
    setLoading(true);
    setError(null);
    try {
      const url = `https://query2.finance.yahoo.com/v8/finance/chart/${ticker.trim().toUpperCase()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const result = data?.chart?.result?.[0];
      if (!result) throw new Error('Invalid ticker');
      const meta = result.meta;
      const price = meta?.regularMarketPrice;
      const name = meta?.shortName || meta?.longName || ticker.toUpperCase();
      if (price == null) throw new Error('No price data');
      return { price, name };
    } catch (err) {
      const msg = err.message || 'Invalid ticker';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return { validate, loading, error };
}
