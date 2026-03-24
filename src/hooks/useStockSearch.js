import { useState, useCallback } from 'react';

const PROXY_URL = '/api/stock';

export function useStockSearch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const validate = useCallback(async (ticker) => {
    if (!ticker?.trim()) throw new Error('Ticker is required');
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${PROXY_URL}?symbol=${encodeURIComponent(ticker.trim().toUpperCase())}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Ticker not found`);
      }
      const data = await res.json();
      if (!data.price) throw new Error('No price data');
      return { price: data.price, name: data.name || ticker.toUpperCase() };
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
