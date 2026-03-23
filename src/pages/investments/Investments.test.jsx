import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import {
  calculateHolding,
  calculatePortfolioTotals,
  calculateAssetAllocation,
  createHolding,
  createWatchlistItem,
  ASSET_CLASSES,
} from './investments.utils';

// ─── Pure utility tests ────────────────────────────────────────────────────────

describe('calculateHolding', () => {
  it('calculates market value correctly', () => {
    const result = calculateHolding({ shares: 10, costBasis: 100, currentPrice: 150 });
    expect(result.marketValue).toBe(1500);
  });

  it('calculates gain/loss dollar amount', () => {
    const result = calculateHolding({ shares: 10, costBasis: 100, currentPrice: 150 });
    expect(result.gainLoss).toBe(500); // 1500 - 1000
  });

  it('calculates gain/loss percentage', () => {
    const result = calculateHolding({ shares: 10, costBasis: 100, currentPrice: 150 });
    expect(result.gainLossPercent).toBeCloseTo(50); // 50% gain
  });

  it('calculates negative gain/loss for losses', () => {
    const result = calculateHolding({ shares: 5, costBasis: 200, currentPrice: 100 });
    expect(result.gainLoss).toBe(-500);
    expect(result.gainLossPercent).toBeCloseTo(-50);
  });

  it('returns 0% gain when costBasis is 0', () => {
    const result = calculateHolding({ shares: 10, costBasis: 0, currentPrice: 100 });
    expect(result.gainLossPercent).toBe(0);
  });
});

describe('calculatePortfolioTotals', () => {
  it('returns zeros for empty portfolio', () => {
    const result = calculatePortfolioTotals([]);
    expect(result.totalValue).toBe(0);
    expect(result.totalGainLoss).toBe(0);
    expect(result.totalGainLossPercent).toBe(0);
  });

  it('sums market values across holdings', () => {
    const holdings = [
      { shares: 10, costBasis: 100, currentPrice: 150 },
      { shares: 5, costBasis: 200, currentPrice: 220 },
    ];
    const result = calculatePortfolioTotals(holdings);
    expect(result.totalValue).toBe(1500 + 1100); // 2600
  });

  it('calculates total gain/loss correctly', () => {
    const holdings = [
      { shares: 10, costBasis: 100, currentPrice: 150 }, // +500
      { shares: 5, costBasis: 200, currentPrice: 180 },  // -100
    ];
    const result = calculatePortfolioTotals(holdings);
    expect(result.totalGainLoss).toBe(400); // 500 - 100
  });

  it('calculates total gain/loss percent', () => {
    const holdings = [
      { shares: 10, costBasis: 100, currentPrice: 200 }, // cost=1000, value=2000
    ];
    const result = calculatePortfolioTotals(holdings);
    expect(result.totalGainLossPercent).toBeCloseTo(100);
  });
});

describe('calculateAssetAllocation', () => {
  it('returns empty array for no holdings', () => {
    expect(calculateAssetAllocation([])).toEqual([]);
  });

  it('groups holdings by asset class', () => {
    const holdings = [
      { shares: 10, costBasis: 100, currentPrice: 100, assetClass: 'Stocks' },
      { shares: 5, costBasis: 100, currentPrice: 100, assetClass: 'ETF' },
    ];
    const result = calculateAssetAllocation(holdings);
    expect(result.length).toBe(2);
    const stocks = result.find((r) => r.assetClass === 'Stocks');
    expect(stocks.percent).toBeCloseTo(66.67, 1);
  });

  it('merges same asset class holdings', () => {
    const holdings = [
      { shares: 10, costBasis: 100, currentPrice: 100, assetClass: 'Stocks' },
      { shares: 10, costBasis: 100, currentPrice: 100, assetClass: 'Stocks' },
    ];
    const result = calculateAssetAllocation(holdings);
    expect(result.length).toBe(1);
    expect(result[0].percent).toBeCloseTo(100);
  });
});

describe('createHolding', () => {
  it('uppercases the ticker', () => {
    const h = createHolding({ ticker: 'aapl', name: 'Apple', shares: 1, costBasis: 100, currentPrice: 150, assetClass: 'Stocks' });
    expect(h.ticker).toBe('AAPL');
  });

  it('converts numeric strings to numbers', () => {
    const h = createHolding({ ticker: 'BTC', name: 'Bitcoin', shares: '2', costBasis: '30000', currentPrice: '45000', assetClass: 'Crypto' });
    expect(h.shares).toBe(2);
    expect(h.costBasis).toBe(30000);
    expect(h.currentPrice).toBe(45000);
  });

  it('assigns a unique id', () => {
    const h1 = createHolding({ ticker: 'A', name: 'A', shares: 1, costBasis: 1, currentPrice: 1, assetClass: 'Stocks' });
    const h2 = createHolding({ ticker: 'B', name: 'B', shares: 1, costBasis: 1, currentPrice: 1, assetClass: 'Stocks' });
    expect(h1.id).not.toBe(h2.id);
  });
});

describe('createWatchlistItem', () => {
  it('defaults status to watching', () => {
    const item = createWatchlistItem({ ticker: 'tsla', name: 'Tesla', targetPrice: 250, notes: '' });
    expect(item.status).toBe('watching');
    expect(item.ticker).toBe('TSLA');
  });

  it('stores target price as number', () => {
    const item = createWatchlistItem({ ticker: 'MSFT', name: 'Microsoft', targetPrice: '380', notes: '' });
    expect(item.targetPrice).toBe(380);
  });

  it('assigns unique ids to watchlist items', () => {
    const a = createWatchlistItem({ ticker: 'A', name: '', targetPrice: 0, notes: '' });
    const b = createWatchlistItem({ ticker: 'B', name: '', targetPrice: 0, notes: '' });
    expect(a.id).not.toBe(b.id);
  });
});

describe('ASSET_CLASSES', () => {
  it('includes required asset classes', () => {
    expect(ASSET_CLASSES).toContain('Stocks');
    expect(ASSET_CLASSES).toContain('ETF');
    expect(ASSET_CLASSES).toContain('Crypto');
    expect(ASSET_CLASSES).toContain('Bonds');
    expect(ASSET_CLASSES).toContain('Real Estate');
    expect(ASSET_CLASSES).toContain('Cash');
  });
});
