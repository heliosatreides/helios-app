/**
 * Tests for HealthTab components:
 * - WaterTracker: increment, decrement, daily reset logic
 * - MoodJournal: add entry, retrieve by date, 14-day history
 * - SleepTracker: hours calculation, weekly average
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import {
  calcSleepHours,
  sleepColor,
  calcWeeklyAvgSleep,
  WaterTracker,
  MoodJournal,
  SleepTracker,
} from './HealthTab';

// localStorage mock — supports Object.keys() via Proxy
const _lsStore = {};
const localStorageMock = new Proxy({
  getItem: (k) => _lsStore[k] ?? null,
  setItem: (k, v) => { _lsStore[k] = String(v); },
  removeItem: (k) => { delete _lsStore[k]; },
  clear: () => { Object.keys(_lsStore).forEach((k) => delete _lsStore[k]); },
  get length() { return Object.keys(_lsStore).length; },
}, {
  ownKeys: () => Object.keys(_lsStore),
  getOwnPropertyDescriptor: (target, prop) => {
    if (Object.prototype.hasOwnProperty.call(_lsStore, prop)) {
      return { enumerable: true, configurable: true, writable: true, value: _lsStore[prop] };
    }
    return Object.getOwnPropertyDescriptor(target, prop);
  },
});
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true, configurable: true });

// ── Pure utility tests ────────────────────────────────────────────────────

describe('calcSleepHours', () => {
  it('calculates hours when wake after midnight bedtime', () => {
    expect(calcSleepHours('23:00', '07:00')).toBe(8);
  });

  it('calculates hours same-day (no midnight crossing)', () => {
    expect(calcSleepHours('22:30', '06:30')).toBe(8);
  });

  it('handles midnight crossing correctly', () => {
    // bedtime 11pm, wake 5am = 6 hours
    expect(calcSleepHours('23:00', '05:00')).toBe(6);
  });

  it('handles fractional hours', () => {
    // 22:00 -> 06:30 = 8.5 hours
    expect(calcSleepHours('22:00', '06:30')).toBe(8.5);
  });

  it('returns null for missing bedtime', () => {
    expect(calcSleepHours('', '07:00')).toBeNull();
  });

  it('returns null for missing wake time', () => {
    expect(calcSleepHours('23:00', '')).toBeNull();
  });
});

describe('sleepColor', () => {
  it('returns green for ≥ 7 hours', () => {
    expect(sleepColor(7)).toBe('text-green-400');
    expect(sleepColor(8)).toBe('text-green-400');
    expect(sleepColor(9)).toBe('text-green-400');
  });

  it('returns amber for 6-7 hours', () => {
    expect(sleepColor(6)).toBe('text-amber-400');
    expect(sleepColor(6.5)).toBe('text-amber-400');
  });

  it('returns red for < 6 hours', () => {
    expect(sleepColor(5)).toBe('text-red-400');
    expect(sleepColor(4)).toBe('text-red-400');
  });

  it('returns gray for null', () => {
    expect(sleepColor(null)).toBe('text-[#71717a]');
  });
});

describe('calcWeeklyAvgSleep', () => {
  it('returns null for empty log', () => {
    expect(calcWeeklyAvgSleep({})).toBeNull();
  });

  it('averages entries in the last 7 days', () => {
    const today = new Date();
    const log = {};
    // Add entries for last 3 days: 8, 6, 7 = avg 7
    for (let i = 0; i < 3; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      log[key] = { hours: [8, 6, 7][i] };
    }
    expect(calcWeeklyAvgSleep(log)).toBe(7);
  });

  it('excludes entries older than 7 days', () => {
    const old = new Date();
    old.setDate(old.getDate() - 10);
    const key = old.toISOString().slice(0, 10);
    expect(calcWeeklyAvgSleep({ [key]: { hours: 8 } })).toBeNull();
  });
});

// ── Component tests ───────────────────────────────────────────────────────

// Mock useIDB so we don't need IndexedDB in tests
vi.mock('../../hooks/useIDB', () => ({
  useIDB: vi.fn((key, defaultVal) => {
    const { useState } = require('react');
    return useState(defaultVal);
  }),
  _resetDBPromise: vi.fn(),
}));

vi.mock('../../hooks/useGemini', () => ({
  useGemini: () => ({ generate: vi.fn(), loading: false, hasKey: false }),
}));

describe('WaterTracker', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders with default 0 glasses', () => {
    render(<WaterTracker goal={8} />);
    // "0 / 8 glasses" — number is in a bold span, rest in a span
    expect(screen.getByText('0')).toBeTruthy();
    expect(screen.getByText(/\/\s*8 glasses/)).toBeTruthy();
  });

  it('increments glasses on + click', () => {
    render(<WaterTracker goal={8} />);
    fireEvent.click(screen.getByTestId('water-increment'));
    expect(screen.getByText('1')).toBeTruthy();
  });

  it('decrements glasses on - click', () => {
    render(<WaterTracker goal={8} />);
    // Increment twice
    fireEvent.click(screen.getByTestId('water-increment'));
    fireEvent.click(screen.getByTestId('water-increment'));
    fireEvent.click(screen.getByTestId('water-decrement'));
    expect(screen.getByText('1')).toBeTruthy();
  });

  it('decrement is disabled at 0', () => {
    render(<WaterTracker goal={8} />);
    expect(screen.getByTestId('water-decrement')).toBeDisabled();
  });

  it('shows goal reached message when at goal', () => {
    // Start with goal already in localStorage
    const todayKey = new Date().toISOString().slice(0, 10);
    localStorage.setItem(`helios-water-${todayKey}`, '8');
    render(<WaterTracker goal={8} />);
    expect(screen.getByText(/Goal reached/i)).toBeTruthy();
  });

  it('stores value in localStorage on increment', () => {
    render(<WaterTracker goal={8} />);
    fireEvent.click(screen.getByTestId('water-increment'));
    const todayKey = new Date().toISOString().slice(0, 10);
    expect(localStorage.getItem(`helios-water-${todayKey}`)).toBe('1');
  });

  it('daily reset: old date keys are purged', async () => {
    // Simulate a yesterday key
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey = `helios-water-${yesterday.toISOString().slice(0, 10)}`;
    localStorage.setItem(yKey, '5');

    await act(async () => { render(<WaterTracker goal={8} />); });

    // After render + effects, old key should be removed
    expect(localStorage.getItem(yKey)).toBeNull();
  });
});

describe('MoodJournal', () => {
  it('renders mood options', () => {
    render(<MoodJournal />);
    expect(screen.getByTestId('mood-option-great')).toBeTruthy();
    expect(screen.getByTestId('mood-option-good')).toBeTruthy();
    expect(screen.getByTestId('mood-option-okay')).toBeTruthy();
    expect(screen.getByTestId('mood-option-low')).toBeTruthy();
    expect(screen.getByTestId('mood-option-rough')).toBeTruthy();
  });

  it('shows note textarea when mood is selected', () => {
    render(<MoodJournal />);
    fireEvent.click(screen.getByTestId('mood-option-good'));
    expect(screen.getByPlaceholderText(/optional note/i)).toBeTruthy();
  });

  it('shows 14 mood dots in history', () => {
    render(<MoodJournal />);
    // Find all mood-dot elements
    const today = new Date();
    const day14 = new Date(today);
    day14.setDate(today.getDate() - 13);
    const day14Str = day14.toISOString().slice(0, 10);
    expect(screen.getByTestId(`mood-dot-${day14Str}`)).toBeTruthy();
  });
});

describe('SleepTracker', () => {
  it('renders bedtime and wake time inputs', () => {
    render(<SleepTracker />);
    expect(screen.getByTestId('sleep-bedtime')).toBeTruthy();
    expect(screen.getByTestId('sleep-waketime')).toBeTruthy();
  });

  it('shows calculated hours', () => {
    render(<SleepTracker />);
    // Default values are 23:00 and 07:00 = 8h
    expect(screen.getByTestId('sleep-hours')).toBeTruthy();
    expect(screen.getByTestId('sleep-hours').textContent).toContain('8');
  });

  it('updates hours when bedtime changes', () => {
    render(<SleepTracker />);
    fireEvent.change(screen.getByTestId('sleep-bedtime'), { target: { value: '22:00' } });
    // 22:00 to 07:00 = 9 hours
    expect(screen.getByTestId('sleep-hours').textContent).toContain('9');
  });

  it('has save button', () => {
    render(<SleepTracker />);
    expect(screen.getByTestId('sleep-save')).toBeTruthy();
  });
});
