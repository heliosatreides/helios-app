import { useState, useCallback } from 'react';

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
      const url = `https://query2.finance.yahoo.com/v8/finance/chart/${ticker.toUpperCase()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const result = data?.chart?.result?.[0];
      if (!result) throw new Error('Ticker not found');
      const meta = result.meta;
      const fetchedPrice = meta?.regularMarketPrice;
      const fetchedName = meta?.shortName || meta?.longName || ticker.toUpperCase();
      if (fetchedPrice == null) throw new Error('Price unavailable');
      setPrice(fetchedPrice);
      setName(fetchedName);
      setLastUpdated(new Date().toISOString());
      return { price: fetchedPrice, name: fetchedName };
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
