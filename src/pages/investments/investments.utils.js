/**
 * Investment utility functions — pure, testable
 */

export const ASSET_CLASSES = ['Stocks', 'ETF', 'Crypto', 'Bonds', 'Real Estate', 'Cash'];

/**
 * Calculate per-holding metrics
 */
export function calculateHolding(holding) {
  const { shares, costBasis, currentPrice } = holding;
  const marketValue = shares * currentPrice;
  const totalCost = shares * costBasis;
  const gainLoss = marketValue - totalCost;
  const gainLossPercent = totalCost === 0 ? 0 : (gainLoss / totalCost) * 100;
  return { marketValue, totalCost, gainLoss, gainLossPercent };
}

/**
 * Calculate portfolio-level totals
 */
export function calculatePortfolioTotals(holdings) {
  if (!holdings || holdings.length === 0) {
    return { totalValue: 0, totalCost: 0, totalGainLoss: 0, totalGainLossPercent: 0 };
  }
  const totalValue = holdings.reduce((sum, h) => sum + h.shares * h.currentPrice, 0);
  const totalCost = holdings.reduce((sum, h) => sum + h.shares * h.costBasis, 0);
  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPercent = totalCost === 0 ? 0 : (totalGainLoss / totalCost) * 100;
  return { totalValue, totalCost, totalGainLoss, totalGainLossPercent };
}

/**
 * Calculate asset allocation as percentages by asset class
 */
export function calculateAssetAllocation(holdings) {
  const totals = {};
  const totalValue = holdings.reduce((sum, h) => sum + h.shares * h.currentPrice, 0);
  if (totalValue === 0) return [];

  for (const h of holdings) {
    const mv = h.shares * h.currentPrice;
    totals[h.assetClass] = (totals[h.assetClass] || 0) + mv;
  }

  return Object.entries(totals).map(([assetClass, value]) => ({
    assetClass,
    value,
    percent: (value / totalValue) * 100,
  }));
}

/**
 * Create a new holding object
 */
export function createHolding({ ticker, name, shares, costBasis, currentPrice, assetClass }) {
  return {
    id: crypto.randomUUID(),
    ticker: ticker.toUpperCase().trim(),
    name: name.trim(),
    shares: Number(shares),
    costBasis: Number(costBasis),
    currentPrice: Number(currentPrice),
    assetClass: assetClass || 'Stocks',
    addedAt: new Date().toISOString(),
  };
}

/**
 * Create a new watchlist item
 */
export function createWatchlistItem({ ticker, name, targetPrice, notes }) {
  return {
    id: crypto.randomUUID(),
    ticker: ticker.toUpperCase().trim(),
    name: (name || '').trim(),
    targetPrice: targetPrice ? Number(targetPrice) : null,
    notes: (notes || '').trim(),
    status: 'watching', // 'watching' | 'bought'
    addedAt: new Date().toISOString(),
  };
}
