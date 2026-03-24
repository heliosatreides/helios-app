import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parseJSONFile,
  parseCSVFile,
  mergeById,
  mergeByTicker,
  generateImportId,
  csvRowToTrip,
  csvRowToTransaction,
  csvRowToHolding,
} from './importData';

// Helper to create a mock File with FileReader support
function createMockFile(content, filename = 'test.json') {
  const file = new Blob([content], { type: 'text/plain' });
  file.name = filename;
  return file;
}

describe('generateImportId', () => {
  it('returns a non-empty string', () => {
    const id = generateImportId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 20 }, () => generateImportId()));
    expect(ids.size).toBe(20);
  });
});

describe('parseJSONFile', () => {
  it('parses valid JSON file', async () => {
    const data = { foo: 'bar', count: 42 };
    const file = createMockFile(JSON.stringify(data));
    const result = await parseJSONFile(file);
    expect(result).toEqual(data);
  });

  it('parses JSON array', async () => {
    const data = [{ id: '1', name: 'Trip A' }, { id: '2', name: 'Trip B' }];
    const file = createMockFile(JSON.stringify(data));
    const result = await parseJSONFile(file);
    expect(result).toEqual(data);
  });

  it('rejects on invalid JSON', async () => {
    const file = createMockFile('this is { not valid json !!');
    await expect(parseJSONFile(file)).rejects.toThrow('Invalid JSON file');
  });

  it('rejects on empty file (not valid JSON)', async () => {
    const file = createMockFile('');
    await expect(parseJSONFile(file)).rejects.toThrow('Invalid JSON file');
  });

  it('handles nested objects', async () => {
    const data = { trips: [{ id: '1' }], finance: { accounts: [] } };
    const file = createMockFile(JSON.stringify(data));
    const result = await parseJSONFile(file);
    expect(result.trips[0].id).toBe('1');
    expect(result.finance.accounts).toEqual([]);
  });
});

describe('parseCSVFile', () => {
  it('parses headers and rows correctly', async () => {
    const csv = 'name,destination,budget\nParis Trip,Paris,2000\nTokyo Adventure,Tokyo,3000';
    const file = createMockFile(csv, 'trips.csv');
    const rows = await parseCSVFile(file);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ name: 'Paris Trip', destination: 'Paris', budget: '2000' });
    expect(rows[1]).toEqual({ name: 'Tokyo Adventure', destination: 'Tokyo', budget: '3000' });
  });

  it('returns empty array for header-only CSV', async () => {
    const csv = 'name,destination,budget\n';
    const file = createMockFile(csv, 'trips.csv');
    const rows = await parseCSVFile(file);
    expect(rows).toEqual([]);
  });

  it('returns empty array for completely empty CSV', async () => {
    const file = createMockFile('', 'trips.csv');
    const rows = await parseCSVFile(file);
    expect(rows).toEqual([]);
  });

  it('handles quoted values with commas inside', async () => {
    const csv = 'name,description\n"Smith, John","Has a comma, inside"';
    const file = createMockFile(csv, 'data.csv');
    const rows = await parseCSVFile(file);
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('Smith, John');
    expect(rows[0].description).toBe('Has a comma, inside');
  });

  it('strips surrounding quotes from values', async () => {
    const csv = 'ticker,name\n"AAPL","Apple Inc."';
    const file = createMockFile(csv, 'portfolio.csv');
    const rows = await parseCSVFile(file);
    expect(rows[0].ticker).toBe('AAPL');
    expect(rows[0].name).toBe('Apple Inc.');
  });

  it('handles multiple rows', async () => {
    const csv = 'date,amount\n2024-01-01,100\n2024-01-02,200\n2024-01-03,300';
    const file = createMockFile(csv, 'data.csv');
    const rows = await parseCSVFile(file);
    expect(rows).toHaveLength(3);
  });
});

describe('mergeById', () => {
  it('merges new items into existing list', () => {
    const existing = [{ id: '1', name: 'Existing' }];
    const incoming = [{ id: '2', name: 'New' }];
    const { merged, imported, skipped } = mergeById(existing, incoming);
    expect(merged).toHaveLength(2);
    expect(imported).toBe(1);
    expect(skipped).toBe(0);
  });

  it('skips duplicates by id', () => {
    const existing = [{ id: '1', name: 'Existing' }];
    const incoming = [{ id: '1', name: 'Duplicate' }];
    const { merged, imported, skipped } = mergeById(existing, incoming);
    expect(merged).toHaveLength(1);
    expect(merged[0].name).toBe('Existing'); // original preserved
    expect(imported).toBe(0);
    expect(skipped).toBe(1);
  });

  it('items without id get new ids assigned', () => {
    const existing = [];
    const incoming = [{ name: 'No ID Item' }];
    const { merged, imported } = mergeById(existing, incoming);
    expect(merged).toHaveLength(1);
    expect(merged[0].id).toBeDefined();
    expect(typeof merged[0].id).toBe('string');
    expect(merged[0].id.length).toBeGreaterThan(0);
    expect(imported).toBe(1);
  });

  it('handles mix of duplicates, new items, and items without id', () => {
    const existing = [
      { id: 'a', name: 'Alpha' },
      { id: 'b', name: 'Beta' },
    ];
    const incoming = [
      { id: 'a', name: 'Alpha Duplicate' },   // skip
      { id: 'c', name: 'Gamma' },             // new
      { name: 'No ID' },                       // new with generated id
    ];
    const { merged, imported, skipped } = mergeById(existing, incoming);
    expect(merged).toHaveLength(4);
    expect(imported).toBe(2);
    expect(skipped).toBe(1);
  });

  it('preserves order: existing first, then new items', () => {
    const existing = [{ id: '1', name: 'First' }];
    const incoming = [{ id: '2', name: 'Second' }];
    const { merged } = mergeById(existing, incoming);
    expect(merged[0].id).toBe('1');
    expect(merged[1].id).toBe('2');
  });

  it('returns correct counts with all duplicates', () => {
    const existing = [{ id: 'x' }, { id: 'y' }];
    const incoming = [{ id: 'x' }, { id: 'y' }];
    const { merged, imported, skipped } = mergeById(existing, incoming);
    expect(merged).toHaveLength(2);
    expect(imported).toBe(0);
    expect(skipped).toBe(2);
  });
});

describe('mergeByTicker', () => {
  it('skips duplicate tickers (case-insensitive)', () => {
    const existing = [{ id: '1', ticker: 'AAPL', name: 'Apple' }];
    const incoming = [{ ticker: 'aapl', name: 'Apple Duplicate' }];
    const { merged, imported, skipped } = mergeByTicker(existing, incoming);
    expect(merged).toHaveLength(1);
    expect(imported).toBe(0);
    expect(skipped).toBe(1);
  });

  it('adds new tickers', () => {
    const existing = [{ id: '1', ticker: 'AAPL' }];
    const incoming = [{ ticker: 'MSFT', name: 'Microsoft' }];
    const { merged, imported, skipped } = mergeByTicker(existing, incoming);
    expect(merged).toHaveLength(2);
    expect(imported).toBe(1);
    expect(skipped).toBe(0);
  });

  it('assigns id to items without one', () => {
    const existing = [];
    const incoming = [{ ticker: 'GOOG' }];
    const { merged } = mergeByTicker(existing, incoming);
    expect(merged[0].id).toBeDefined();
  });
});

describe('csvRowToTrip', () => {
  it('maps CSV row to trip object', () => {
    const row = {
      name: 'Paris',
      destination: 'France',
      startDate: '2024-06-01',
      endDate: '2024-06-10',
      budget: '2000',
      status: 'Planning',
    };
    const trip = csvRowToTrip(row);
    expect(trip.name).toBe('Paris');
    expect(trip.destination).toBe('France');
    expect(trip.budget).toBe(2000);
    expect(trip.status).toBe('Planning');
    expect(trip.id).toBeDefined();
    expect(trip.itinerary).toEqual([]);
    expect(trip.expenses).toEqual([]);
  });

  it('defaults status to Planning when missing', () => {
    const trip = csvRowToTrip({ name: 'Test' });
    expect(trip.status).toBe('Planning');
  });
});

describe('csvRowToTransaction', () => {
  it('maps CSV row to transaction object', () => {
    const row = {
      date: '2024-01-15',
      description: 'Coffee',
      amount: '5.50',
      type: 'expense',
      category: 'Food',
      account: 'Checking',
    };
    const tx = csvRowToTransaction(row);
    expect(tx.date).toBe('2024-01-15');
    expect(tx.description).toBe('Coffee');
    expect(tx.amount).toBe(5.5);
    expect(tx.type).toBe('expense');
    expect(tx.category).toBe('Food');
    expect(tx.id).toBeDefined();
  });
});

describe('csvRowToHolding', () => {
  it('maps CSV row to holding object with uppercase ticker', () => {
    const row = {
      ticker: 'aapl',
      name: 'Apple Inc.',
      assetClass: 'Stocks',
      shares: '10',
      costBasis: '150.00',
      currentPrice: '180.00',
    };
    const holding = csvRowToHolding(row);
    expect(holding.ticker).toBe('AAPL');
    expect(holding.name).toBe('Apple Inc.');
    expect(holding.shares).toBe(10);
    expect(holding.costBasis).toBe(150);
    expect(holding.currentPrice).toBe(180);
    expect(holding.id).toBeDefined();
  });
});
