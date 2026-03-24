import { useState, useCallback } from 'react';

const PROXY_URL = '/api/stock';

export function useStockQuote() {
  const [price, setPrice] = useState(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchQuote = useCallback(async (ticker) => {
    if (!ticker) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${PROXY_URL}?symbol=${encodeURIComponent(ticker.toUpperCase())}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (!data.price) throw new Error('Price unavailable');
      setPrice(data.price);
      setName(data.name || ticker.toUpperCase());
      setLastUpdated(new Date().toISOString());
      return { price: data.price, name: data.name || ticker.toUpperCase() };
    } catch (err) {
      setError(err.message || 'Failed to fetch quote');
      setPrice(null);
      setName('');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { price, name, loading, error, lastUpdated, fetchQuote };
}
