import { describe, it, expect } from 'vitest';
import {
  convertCurrency,
  convertLength,
  convertWeight,
  convertTemperature,
  convertData,
  convertTime,
} from './converterUtils';

// ── Currency conversion ───────────────────────────────────────────────────

describe('convertCurrency', () => {
  const rates = { EUR: 0.92, GBP: 0.79, JPY: 149.5, CAD: 1.36 };

  it('converts USD to EUR', () => {
    const result = convertCurrency(100, 'USD', 'EUR', rates);
    expect(result).toBeCloseTo(92, 1);
  });

  it('converts EUR to GBP', () => {
    const result = convertCurrency(100, 'EUR', 'GBP', rates);
    // 100 EUR -> USD: 100/0.92 -> GBP: * 0.79
    expect(result).toBeCloseTo((100 / 0.92) * 0.79, 1);
  });

  it('converts USD to USD (no change)', () => {
    expect(convertCurrency(50, 'USD', 'USD', rates)).toBeCloseTo(50, 1);
  });

  it('returns null for missing rates', () => {
    expect(convertCurrency(100, 'USD', 'EUR', null)).toBeNull();
  });

  it('returns null for NaN amount', () => {
    expect(convertCurrency(NaN, 'USD', 'EUR', rates)).toBeNull();
  });

  it('returns null for unknown currency', () => {
    expect(convertCurrency(100, 'USD', 'XYZ', rates)).toBeNull();
  });
});

// ── Length conversion ─────────────────────────────────────────────────────

describe('convertLength', () => {
  it('converts km to m', () => {
    expect(convertLength(1, 'km', 'm')).toBeCloseTo(1000, 1);
  });

  it('converts m to km', () => {
    expect(convertLength(1000, 'm', 'km')).toBeCloseTo(1, 3);
  });

  it('converts mi to km', () => {
    expect(convertLength(1, 'mi', 'km')).toBeCloseTo(1.609344, 3);
  });

  it('converts ft to m', () => {
    expect(convertLength(1, 'ft', 'm')).toBeCloseTo(0.3048, 4);
  });

  it('converts cm to in', () => {
    expect(convertLength(2.54, 'cm', 'in')).toBeCloseTo(1, 3);
  });

  it('returns null for NaN input', () => {
    expect(convertLength('abc', 'km', 'm')).toBeNull();
  });

  it('same unit returns same value', () => {
    expect(convertLength(5, 'm', 'm')).toBeCloseTo(5, 3);
  });
});

// ── Weight conversion ─────────────────────────────────────────────────────

describe('convertWeight', () => {
  it('converts kg to lb', () => {
    expect(convertWeight(1, 'kg', 'lb')).toBeCloseTo(2.2046, 3);
  });

  it('converts lb to kg', () => {
    expect(convertWeight(2.2046, 'lb', 'kg')).toBeCloseTo(1, 2);
  });

  it('converts oz to g', () => {
    expect(convertWeight(1, 'oz', 'g')).toBeCloseTo(28.3495, 2);
  });

  it('returns null for NaN input', () => {
    expect(convertWeight('bad', 'kg', 'lb')).toBeNull();
  });
});

// ── Temperature conversion ────────────────────────────────────────────────

describe('convertTemperature', () => {
  it('converts 0°C to 32°F', () => {
    expect(convertTemperature(0, 'C', 'F')).toBeCloseTo(32, 2);
  });

  it('converts 100°C to 212°F', () => {
    expect(convertTemperature(100, 'C', 'F')).toBeCloseTo(212, 2);
  });

  it('converts 32°F to 0°C', () => {
    expect(convertTemperature(32, 'F', 'C')).toBeCloseTo(0, 2);
  });

  it('converts 0°C to 273.15 K', () => {
    expect(convertTemperature(0, 'C', 'K')).toBeCloseTo(273.15, 2);
  });

  it('converts 273.15 K to 0°C', () => {
    expect(convertTemperature(273.15, 'K', 'C')).toBeCloseTo(0, 2);
  });

  it('same unit returns same value', () => {
    expect(convertTemperature(25, 'C', 'C')).toBeCloseTo(25, 2);
  });

  it('returns null for NaN input', () => {
    expect(convertTemperature('x', 'C', 'F')).toBeNull();
  });
});

// ── Data conversion ───────────────────────────────────────────────────────

describe('convertData', () => {
  it('converts 1 GB to MB', () => {
    expect(convertData(1, 'GB', 'MB')).toBeCloseTo(1024, 1);
  });

  it('converts 1024 MB to GB', () => {
    expect(convertData(1024, 'MB', 'GB')).toBeCloseTo(1, 3);
  });

  it('converts 1 TB to GB', () => {
    expect(convertData(1, 'TB', 'GB')).toBeCloseTo(1024, 1);
  });

  it('returns null for NaN input', () => {
    expect(convertData('bad', 'MB', 'GB')).toBeNull();
  });
});

// ── Time conversion ───────────────────────────────────────────────────────

describe('convertTime', () => {
  it('converts 1 hour to seconds', () => {
    expect(convertTime(1, 'hours', 'seconds')).toBeCloseTo(3600, 1);
  });

  it('converts 1 day to hours', () => {
    expect(convertTime(1, 'days', 'hours')).toBeCloseTo(24, 1);
  });

  it('converts 1 week to days', () => {
    expect(convertTime(1, 'weeks', 'days')).toBeCloseTo(7, 1);
  });

  it('converts minutes to seconds', () => {
    expect(convertTime(5, 'minutes', 'seconds')).toBeCloseTo(300, 1);
  });

  it('returns null for NaN input', () => {
    expect(convertTime('bad', 'hours', 'minutes')).toBeNull();
  });
});
