/**
 * Tests for productivity streak utilities.
 * We test pure functions only — no hook wiring needed since
 * the hook just composes these with useTasks.
 */
import { describe, it, expect } from 'vitest';
import {
  getProductiveDates,
  calcCurrentStreak,
  calcLongestStreak,
  getLastNDays,
  streakMessage,
} from './useProductivityStreak';

// ── getProductiveDates ──────────────────────────────────────────────────────

describe('getProductiveDates', () => {
  it('returns empty set for no tasks', () => {
    expect(getProductiveDates([])).toEqual(new Set());
  });

  it('ignores incomplete tasks', () => {
    const tasks = [{ completed: false, completedAt: '2026-03-20T12:00:00Z' }];
    expect(getProductiveDates(tasks).size).toBe(0);
  });

  it('ignores tasks with no completedAt', () => {
    const tasks = [{ completed: true, completedAt: null }];
    expect(getProductiveDates(tasks).size).toBe(0);
  });

  it('extracts date from completedAt for completed tasks', () => {
    const tasks = [{ completed: true, completedAt: '2026-03-20T15:30:00Z' }];
    const dates = getProductiveDates(tasks);
    expect(dates.has('2026-03-20')).toBe(true);
  });

  it('deduplicates multiple tasks on same day', () => {
    const tasks = [
      { completed: true, completedAt: '2026-03-20T08:00:00Z' },
      { completed: true, completedAt: '2026-03-20T20:00:00Z' },
      { completed: true, completedAt: '2026-03-21T10:00:00Z' },
    ];
    const dates = getProductiveDates(tasks);
    expect(dates.size).toBe(2);
    expect(dates.has('2026-03-20')).toBe(true);
    expect(dates.has('2026-03-21')).toBe(true);
  });

  it('mixes completed and incomplete correctly', () => {
    const tasks = [
      { completed: true, completedAt: '2026-03-20T10:00:00Z' },
      { completed: false, completedAt: '2026-03-21T10:00:00Z' },
      { completed: true, completedAt: '2026-03-22T10:00:00Z' },
    ];
    const dates = getProductiveDates(tasks);
    expect(dates.size).toBe(2);
    expect(dates.has('2026-03-20')).toBe(true);
    expect(dates.has('2026-03-21')).toBe(false);
    expect(dates.has('2026-03-22')).toBe(true);
  });
});

// ── calcCurrentStreak ──────────────────────────────────────────────────────

describe('calcCurrentStreak', () => {
  it('returns 0 for empty set', () => {
    expect(calcCurrentStreak(new Set(), '2026-03-24')).toBe(0);
  });

  it('returns 1 for only today being productive', () => {
    const dates = new Set(['2026-03-24']);
    expect(calcCurrentStreak(dates, '2026-03-24')).toBe(1);
  });

  it('returns 1 for only yesterday being productive (today not yet done)', () => {
    const dates = new Set(['2026-03-23']);
    expect(calcCurrentStreak(dates, '2026-03-24')).toBe(1);
  });

  it('counts consecutive days ending today', () => {
    const dates = new Set(['2026-03-22', '2026-03-23', '2026-03-24']);
    expect(calcCurrentStreak(dates, '2026-03-24')).toBe(3);
  });

  it('counts consecutive days ending yesterday when today not productive yet', () => {
    const dates = new Set(['2026-03-21', '2026-03-22', '2026-03-23']);
    expect(calcCurrentStreak(dates, '2026-03-24')).toBe(3);
  });

  it('stops at a gap', () => {
    // productive on 20, 21 — gap on 22 — productive on 23, 24
    const dates = new Set(['2026-03-20', '2026-03-21', '2026-03-23', '2026-03-24']);
    expect(calcCurrentStreak(dates, '2026-03-24')).toBe(2);
  });

  it('returns 0 when last productive day was 2+ days ago', () => {
    const dates = new Set(['2026-03-20', '2026-03-21']);
    expect(calcCurrentStreak(dates, '2026-03-24')).toBe(0);
  });
});

// ── calcLongestStreak ──────────────────────────────────────────────────────

describe('calcLongestStreak', () => {
  it('returns 0 for empty set', () => {
    expect(calcLongestStreak(new Set())).toBe(0);
  });

  it('returns 1 for single day', () => {
    expect(calcLongestStreak(new Set(['2026-03-24']))).toBe(1);
  });

  it('returns correct longest streak with gap', () => {
    // streak of 3, gap, streak of 2
    const dates = new Set(['2026-03-10', '2026-03-11', '2026-03-12', '2026-03-20', '2026-03-21']);
    expect(calcLongestStreak(dates)).toBe(3);
  });

  it('handles all consecutive days', () => {
    const dates = new Set(['2026-03-01', '2026-03-02', '2026-03-03', '2026-03-04', '2026-03-05']);
    expect(calcLongestStreak(dates)).toBe(5);
  });

  it('handles non-consecutive single days', () => {
    const dates = new Set(['2026-03-01', '2026-03-05', '2026-03-10']);
    expect(calcLongestStreak(dates)).toBe(1);
  });

  it('longer second streak wins', () => {
    // streak of 2 then streak of 4
    const dates = new Set([
      '2026-03-01', '2026-03-02',
      '2026-03-10', '2026-03-11', '2026-03-12', '2026-03-13',
    ]);
    expect(calcLongestStreak(dates)).toBe(4);
  });
});

// ── getLastNDays ───────────────────────────────────────────────────────────

describe('getLastNDays', () => {
  it('returns N items', () => {
    const result = getLastNDays(new Set(), 7, '2026-03-24');
    expect(result).toHaveLength(7);
  });

  it('marks productive days correctly', () => {
    const dates = new Set(['2026-03-22', '2026-03-24']);
    const result = getLastNDays(dates, 5, '2026-03-24');
    const byDate = Object.fromEntries(result.map((d) => [d.dateStr, d.productive]));
    expect(byDate['2026-03-20']).toBe(false);
    expect(byDate['2026-03-21']).toBe(false);
    expect(byDate['2026-03-22']).toBe(true);
    expect(byDate['2026-03-23']).toBe(false);
    expect(byDate['2026-03-24']).toBe(true);
  });

  it('results are in chronological order (oldest first)', () => {
    const result = getLastNDays(new Set(), 3, '2026-03-24');
    expect(result[0].dateStr).toBe('2026-03-22');
    expect(result[1].dateStr).toBe('2026-03-23');
    expect(result[2].dateStr).toBe('2026-03-24');
  });
});

// ── streakMessage ──────────────────────────────────────────────────────────

describe('streakMessage', () => {
  it('returns start message for 0 streak', () => {
    expect(streakMessage(0)).toMatch(/start/i);
  });

  it('returns 1 day message', () => {
    expect(streakMessage(1)).toMatch(/1 day/);
  });

  it('returns multi-day message with fire for short streaks', () => {
    const msg = streakMessage(5);
    expect(msg).toMatch(/5 day/);
    expect(msg).toContain('🔥');
  });

  it('returns double fire for week+ streaks', () => {
    const msg = streakMessage(10);
    expect(msg).toContain('🔥🔥');
  });

  it('returns triple fire for 30+ day streaks', () => {
    const msg = streakMessage(30);
    expect(msg).toContain('🔥🔥🔥');
  });
});
