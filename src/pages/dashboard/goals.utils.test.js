/**
 * TDD tests for goals.utils.js
 *
 * Feature: OKR timeframe filtering + stats bar
 *  - filterObjectivesByTimeframe(objectives, timeframe)
 *  - getObjectiveStats(objectives)
 *  - getActiveTimeframes(objectives)
 */
import { describe, it, expect } from 'vitest';
import {
  filterObjectivesByTimeframe,
  getObjectiveStats,
  getActiveTimeframes,
} from './goals.utils';

// ── Fixtures ──────────────────────────────────────────────────────────────

const OBJ_Q1_DONE = {
  id: 'a',
  title: 'Launch MVP',
  timeframe: 'Q1 2026',
  color: 'green',
  keyResults: [
    { id: 'kr1', metricType: 'number', currentValue: 100, targetValue: 100 },
    { id: 'kr2', metricType: 'number', currentValue: 100, targetValue: 100 },
  ],
};

const OBJ_Q1_PARTIAL = {
  id: 'b',
  title: 'Build team',
  timeframe: 'Q1 2026',
  color: 'blue',
  keyResults: [
    { id: 'kr3', metricType: 'number', currentValue: 50, targetValue: 100 },
    { id: 'kr4', metricType: 'boolean', currentValue: false, targetValue: true },
  ],
};

const OBJ_Q2_ONGOING = {
  id: 'c',
  title: 'Grow revenue',
  timeframe: 'Q2 2026',
  color: 'amber',
  keyResults: [
    { id: 'kr5', metricType: 'number', currentValue: 20, targetValue: 100 },
  ],
};

const OBJ_ONGOING = {
  id: 'd',
  title: 'Ongoing health',
  timeframe: 'Ongoing',
  color: 'red',
  keyResults: [],
};

const ALL = [OBJ_Q1_DONE, OBJ_Q1_PARTIAL, OBJ_Q2_ONGOING, OBJ_ONGOING];

// ── filterObjectivesByTimeframe ───────────────────────────────────────────

describe('filterObjectivesByTimeframe', () => {
  it('returns all objectives for "All" timeframe', () => {
    expect(filterObjectivesByTimeframe(ALL, 'All')).toHaveLength(4);
  });

  it('filters by specific timeframe', () => {
    const result = filterObjectivesByTimeframe(ALL, 'Q1 2026');
    expect(result).toHaveLength(2);
    expect(result.map((o) => o.id)).toEqual(['a', 'b']);
  });

  it('filters single objective', () => {
    const result = filterObjectivesByTimeframe(ALL, 'Q2 2026');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('c');
  });

  it('returns empty array when no match', () => {
    expect(filterObjectivesByTimeframe(ALL, 'Q3 2026')).toHaveLength(0);
  });

  it('handles empty array', () => {
    expect(filterObjectivesByTimeframe([], 'Q1 2026')).toHaveLength(0);
  });

  it('handles null/undefined gracefully', () => {
    expect(filterObjectivesByTimeframe(null, 'Q1 2026')).toHaveLength(0);
    expect(filterObjectivesByTimeframe(undefined, 'Q1 2026')).toHaveLength(0);
  });
});

// ── getObjectiveStats ─────────────────────────────────────────────────────

describe('getObjectiveStats', () => {
  it('returns zero stats for empty array', () => {
    const stats = getObjectiveStats([]);
    expect(stats.total).toBe(0);
    expect(stats.onTrack).toBe(0);
    expect(stats.atRisk).toBe(0);
    expect(stats.behind).toBe(0);
    expect(stats.avgProgress).toBe(0);
  });

  it('counts objectives by health bucket (onTrack ≥70%, atRisk 40-69%, behind <40%)', () => {
    // OBJ_Q1_DONE → 100% → onTrack
    // OBJ_Q1_PARTIAL → avg(50%,0%) = 25% → behind
    // OBJ_Q2_ONGOING → 20% → behind
    // OBJ_ONGOING → 0 KRs → 0% → behind
    const stats = getObjectiveStats(ALL);
    expect(stats.total).toBe(4);
    expect(stats.onTrack).toBe(1);
    expect(stats.atRisk).toBe(0);
    expect(stats.behind).toBe(3);
  });

  it('correctly classifies atRisk (40-69%)', () => {
    const obj = {
      id: 'x',
      keyResults: [
        { metricType: 'number', currentValue: 50, targetValue: 100 },
        { metricType: 'number', currentValue: 60, targetValue: 100 },
      ],
    };
    const stats = getObjectiveStats([obj]);
    expect(stats.atRisk).toBe(1);
    expect(stats.onTrack).toBe(0);
    expect(stats.behind).toBe(0);
  });

  it('calculates avgProgress correctly', () => {
    // OBJ_Q1_DONE = 100%, OBJ_Q1_PARTIAL = 25% → avg = 62.5 → round = 63
    const stats = getObjectiveStats([OBJ_Q1_DONE, OBJ_Q1_PARTIAL]);
    expect(stats.avgProgress).toBe(63);
  });

  it('returns total count', () => {
    expect(getObjectiveStats(ALL).total).toBe(4);
  });

  it('handles null gracefully', () => {
    const stats = getObjectiveStats(null);
    expect(stats.total).toBe(0);
  });
});

// ── getActiveTimeframes ───────────────────────────────────────────────────

describe('getActiveTimeframes', () => {
  it('returns unique timeframes sorted', () => {
    const tfs = getActiveTimeframes(ALL);
    // should include Q1 2026, Q2 2026, Ongoing
    expect(tfs).toContain('Q1 2026');
    expect(tfs).toContain('Q2 2026');
    expect(tfs).toContain('Ongoing');
  });

  it('removes duplicates', () => {
    const tfs = getActiveTimeframes(ALL);
    const unique = [...new Set(tfs)];
    expect(tfs).toEqual(unique);
  });

  it('orders quarterly timeframes before Ongoing', () => {
    const tfs = getActiveTimeframes(ALL);
    const qIdx = tfs.indexOf('Q2 2026');
    const oIdx = tfs.indexOf('Ongoing');
    expect(qIdx).toBeLessThan(oIdx);
  });

  it('returns empty array for empty input', () => {
    expect(getActiveTimeframes([])).toEqual([]);
    expect(getActiveTimeframes(null)).toEqual([]);
  });

  it('preserves only timeframes that appear in objectives', () => {
    const tfs = getActiveTimeframes([OBJ_Q1_DONE]);
    expect(tfs).toHaveLength(1);
    expect(tfs[0]).toBe('Q1 2026');
  });
});
