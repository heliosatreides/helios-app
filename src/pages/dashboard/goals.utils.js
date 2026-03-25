/**
 * goals.utils.js — Pure utility functions for OKR filtering and stats
 *
 * Feature: Timeframe filtering tabs + summary stats bar for the Goals page.
 */

import { krProgress, objectiveProgress } from './GoalsTab';

// ── Canonical timeframe sort order ────────────────────────────────────────

const TIMEFRAME_ORDER = [
  'Q1 2026',
  'Q2 2026',
  'Q3 2026',
  'Q4 2026',
  'This Year',
  'Ongoing',
];

/**
 * Filter objectives by timeframe.
 * Pass 'All' to return everything.
 *
 * @param {Array|null|undefined} objectives
 * @param {string} timeframe
 * @returns {Array}
 */
export function filterObjectivesByTimeframe(objectives, timeframe) {
  if (!objectives) return [];
  if (timeframe === 'All') return objectives;
  return objectives.filter((o) => o.timeframe === timeframe);
}

/**
 * Compute summary stats for a list of objectives.
 *
 * Health buckets (based on objectiveProgress):
 *   onTrack : >= 70%
 *   atRisk  : 40–69%
 *   behind  : < 40%
 *
 * @param {Array|null|undefined} objectives
 * @returns {{ total: number, onTrack: number, atRisk: number, behind: number, avgProgress: number }}
 */
export function getObjectiveStats(objectives) {
  const empty = { total: 0, onTrack: 0, atRisk: 0, behind: 0, avgProgress: 0 };
  if (!objectives || objectives.length === 0) return empty;

  let onTrack = 0;
  let atRisk = 0;
  let behind = 0;
  let progressSum = 0;

  for (const obj of objectives) {
    const pct = objectiveProgress(obj);
    progressSum += pct;
    if (pct >= 70) onTrack++;
    else if (pct >= 40) atRisk++;
    else behind++;
  }

  const avgProgress = Math.round(progressSum / objectives.length);

  return { total: objectives.length, onTrack, atRisk, behind, avgProgress };
}

/**
 * Get the list of distinct timeframes present in the objectives list,
 * sorted by canonical order (quarterly first, then year, then ongoing).
 * Unknown timeframes are appended in insertion order.
 *
 * @param {Array|null|undefined} objectives
 * @returns {string[]}
 */
export function getActiveTimeframes(objectives) {
  if (!objectives || objectives.length === 0) return [];

  const seen = new Set();
  const unknown = [];

  for (const obj of objectives) {
    if (obj.timeframe && !seen.has(obj.timeframe)) {
      seen.add(obj.timeframe);
      if (!TIMEFRAME_ORDER.includes(obj.timeframe)) {
        unknown.push(obj.timeframe);
      }
    }
  }

  // Filter canonical order to only include present timeframes, then append unknowns
  return [...TIMEFRAME_ORDER.filter((t) => seen.has(t)), ...unknown];
}
