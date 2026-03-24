import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getUtcOffset,
  isBusinessHours,
  formatTimeInZone,
  formatDateInZone,
  DEFAULT_CITIES,
} from './worldClockUtils';

// ── DEFAULT_CITIES ────────────────────────────────────────────────────────

describe('DEFAULT_CITIES', () => {
  it('has exactly 5 default cities', () => {
    expect(DEFAULT_CITIES).toHaveLength(5);
  });

  it('includes New York, London, Tokyo, Mumbai, San Francisco', () => {
    const names = DEFAULT_CITIES.map((c) => c.name);
    expect(names).toContain('New York');
    expect(names).toContain('London');
    expect(names).toContain('Tokyo');
    expect(names).toContain('Mumbai');
    expect(names).toContain('San Francisco');
  });

  it('each city has id, name, and timezone', () => {
    DEFAULT_CITIES.forEach((city) => {
      expect(city.id).toBeTruthy();
      expect(city.name).toBeTruthy();
      expect(city.timezone).toBeTruthy();
    });
  });
});

// ── getUtcOffset ──────────────────────────────────────────────────────────

describe('getUtcOffset', () => {
  it('returns a non-empty string for valid timezone', () => {
    const offset = getUtcOffset('America/New_York');
    expect(typeof offset).toBe('string');
    expect(offset.length).toBeGreaterThan(0);
  });

  it('returns GMT or UTC prefix for UTC timezone', () => {
    const offset = getUtcOffset('UTC');
    expect(offset).toMatch(/^(UTC|GMT)/);
  });

  it('returns a string for Asia/Kolkata (Mumbai)', () => {
    const offset = getUtcOffset('Asia/Kolkata');
    expect(typeof offset).toBe('string');
    expect(offset.length).toBeGreaterThan(0);
  });

  it('returns empty string for invalid timezone', () => {
    const offset = getUtcOffset('Invalid/Zone');
    expect(offset).toBe('');
  });
});

// ── isBusinessHours ───────────────────────────────────────────────────────

describe('isBusinessHours', () => {
  it('returns true at 10am in any timezone', () => {
    // Create a date that is 10am UTC
    // We'll test with UTC so the hour is predictable
    const date = new Date('2024-06-03T10:00:00Z'); // Monday 10am UTC
    expect(isBusinessHours('UTC', date)).toBe(true);
  });

  it('returns false at midnight', () => {
    const date = new Date('2024-06-03T00:00:00Z'); // midnight UTC
    expect(isBusinessHours('UTC', date)).toBe(false);
  });

  it('returns false at 9pm', () => {
    const date = new Date('2024-06-03T21:00:00Z'); // 9pm UTC
    expect(isBusinessHours('UTC', date)).toBe(false);
  });

  it('returns true exactly at 9am', () => {
    const date = new Date('2024-06-03T09:00:00Z');
    expect(isBusinessHours('UTC', date)).toBe(true);
  });

  it('returns false exactly at 5pm (17:00)', () => {
    const date = new Date('2024-06-03T17:00:00Z');
    expect(isBusinessHours('UTC', date)).toBe(false);
  });

  it('returns false for invalid timezone', () => {
    expect(isBusinessHours('Invalid/Zone', new Date())).toBe(false);
  });
});

// ── formatTimeInZone ──────────────────────────────────────────────────────

describe('formatTimeInZone', () => {
  it('formats time in HH:MM:SS format', () => {
    const date = new Date('2024-06-03T14:30:00Z');
    const result = formatTimeInZone('UTC', date);
    expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });

  it('returns correct hour in given timezone', () => {
    const date = new Date('2024-06-03T12:00:00Z'); // UTC noon
    // UTC should show 12:00:00
    const utcTime = formatTimeInZone('UTC', date);
    expect(utcTime).toBe('12:00:00');
  });

  it('returns --:--:-- for invalid timezone', () => {
    expect(formatTimeInZone('Invalid/Zone', new Date())).toBe('--:--:--');
  });
});

// ── formatDateInZone ──────────────────────────────────────────────────────

describe('formatDateInZone', () => {
  it('returns a non-empty date string', () => {
    const date = new Date('2024-06-03T12:00:00Z');
    const result = formatDateInZone('UTC', date);
    expect(result.length).toBeGreaterThan(0);
  });

  it('includes Mon abbreviation for a Monday', () => {
    const date = new Date('2024-06-03T12:00:00Z'); // Jun 3, 2024 is a Monday
    const result = formatDateInZone('UTC', date);
    expect(result).toContain('Mon');
  });

  it('returns empty string for invalid timezone', () => {
    expect(formatDateInZone('Invalid/Zone', new Date())).toBe('');
  });
});
