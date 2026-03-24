// Vercel serverless function — proxies Yahoo Finance to avoid CORS
export default async function handler(req, res) {
  const { symbol } = req.query;

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Missing symbol parameter' });
  }

  const ticker = symbol.toUpperCase().replace(/[^A-Z0-9.\-^]/g, '');
  if (!ticker) {
    return res.status(400).json({ error: 'Invalid symbol' });
  }

  try {
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${ticker}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Yahoo Finance returned ${response.status}` });
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];

    if (!result) {
      return res.status(404).json({ error: 'Ticker not found' });
    }

    const meta = result.meta;
    const price = meta?.regularMarketPrice;
    const name = meta?.shortName || meta?.longName || ticker;

    if (price == null) {
      return res.status(404).json({ error: 'No price data available' });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');
    return res.status(200).json({ symbol: ticker, price, name });

  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch stock data' });
  }
}
