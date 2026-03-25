import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useIDB } from '../hooks/useIDB';
import { useTasks } from '../hooks/useTasks';
import { useGemini } from '../hooks/useGemini';
import {
  getProductiveDates,
  calcCurrentStreak,
  getTodayStr,
} from '../hooks/useProductivityStreak';

/**
 * Get the Monday (start) of the week containing the given date.
 */
function getWeekStart(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d.toISOString().split('T')[0];
}

/**
 * Get the Sunday (end) of the previous week given a date.
 */
function getPrevWeekEnd(dateStr) {
  const weekStart = getWeekStart(dateStr);
  const d = new Date(weekStart + 'T00:00:00');
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

/**
 * Get the Monday of the previous week given a date.
 */
function getPrevWeekStart(dateStr) {
  const weekStart = getWeekStart(dateStr);
  const d = new Date(weekStart + 'T00:00:00');
  d.setDate(d.getDate() - 7);
  return d.toISOString().split('T')[0];
}

/**
 * Check if a date string falls within [start, end] inclusive.
 */
function isInRange(dateStr, start, end) {
  return dateStr >= start && dateStr <= end;
}

/**
 * Format a date string as "Mar 16" style.
 */
function formatShort(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function StatCell({ label, value, testId }) {
  return (
    <div className="bg-secondary border border-border px-3 py-2.5 text-center min-h-[44px]">
      <p className="text-lg font-semibold text-foreground" data-testid={testId}>{value}</p>
      <p className="text-muted-foreground text-xs mt-0.5">{label}</p>
    </div>
  );
}

export function WeeklyDigest({ todayOverride, forceShow }) {
  const today = todayOverride || getTodayStr();
  const isMonday = new Date(today + 'T00:00:00').getDay() === 1;

  const prevWeekStart = getPrevWeekStart(today);
  const prevWeekEnd = getPrevWeekEnd(today);

  const { tasks } = useTasks();
  const { generate, hasKey } = useGemini();
  const [transactions] = useIDB('finance-transactions', []);
  const [sleepLog] = useIDB('sleep-log', []);
  const [goals] = useIDB('goals-objectives', []);
  const [digestCache, setDigestCache] = useIDB('weekly-digest-cache', null);

  const [narrative, setNarrative] = useState(null);
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const narrativeTriggered = useRef(false);

  // Compute stats from previous week
  const stats = useMemo(() => {
    const tasksCompleted = tasks.filter(
      (t) => t.completed && t.completedAt && isInRange(t.completedAt.slice(0, 10), prevWeekStart, prevWeekEnd)
    ).length;

    const weeklyExpenses = (transactions || []).filter(
      (t) => t.type === 'expense' && isInRange(t.date, prevWeekStart, prevWeekEnd)
    );
    const spending = weeklyExpenses.reduce((sum, t) => sum + t.amount, 0);

    const sleepEntries = (sleepLog || []).filter(
      (s) => s.date && isInRange(s.date, prevWeekStart, prevWeekEnd)
    ).length;

    const goalsCompleted = (goals || []).filter((g) => g.status === 'completed').length;
    const goalsTotal = (goals || []).length;

    const productiveDates = getProductiveDates(tasks);
    const streak = calcCurrentStreak(productiveDates, today);

    return { tasksCompleted, spending, sleepEntries, goalsCompleted, goalsTotal, streak };
  }, [tasks, transactions, sleepLog, goals, today, prevWeekStart, prevWeekEnd]);

  // Check if we should show the card
  const hasCacheForWeek = digestCache && digestCache.weekStart === prevWeekStart;
  const shouldShow = forceShow !== undefined
    ? forceShow
    : (isMonday || hasCacheForWeek);

  // Load cached narrative
  useEffect(() => {
    if (hasCacheForWeek && digestCache.text) {
      setNarrative(digestCache.text);
    }
  }, [hasCacheForWeek, digestCache]);

  const generateNarrative = useCallback(async () => {
    setNarrativeLoading(true);
    try {
      const prompt = `Give me a 2-3 sentence weekly summary based on these stats from last week (${formatShort(prevWeekStart)} – ${formatShort(prevWeekEnd)}): ${stats.tasksCompleted} tasks completed, $${stats.spending} spent, ${stats.sleepEntries} sleep entries logged, ${stats.goalsCompleted}/${stats.goalsTotal} goals completed, ${stats.streak}-day productivity streak. Be concise, encouraging, and actionable.`;
      const text = await generate(prompt);
      setNarrative(text);
      await setDigestCache({ weekStart: prevWeekStart, text, stats });
    } catch {
      // Silent fail for AI narrative — stats still show
    } finally {
      setNarrativeLoading(false);
    }
  }, [generate, prevWeekStart, prevWeekEnd, stats, setDigestCache]);

  // Auto-generate narrative on mount (if key and no cache)
  useEffect(() => {
    if (narrativeTriggered.current) return;
    if (!shouldShow || !hasKey) return;
    if (hasCacheForWeek) return; // already cached
    narrativeTriggered.current = true;
    generateNarrative();
  }, [shouldShow, hasKey, hasCacheForWeek, generateNarrative]);

  if (!shouldShow || dismissed) return null;

  return (
    <div className="border border-border p-5" data-testid="weekly-digest">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-foreground font-medium text-sm">Weekly Digest</h3>
          <p className="text-muted-foreground text-xs mt-0.5">
            {formatShort(prevWeekStart)} – {formatShort(prevWeekEnd)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasKey && (
            <button
              onClick={() => { narrativeTriggered.current = false; generateNarrative(); }}
              disabled={narrativeLoading}
              className="text-muted-foreground hover:text-foreground text-xs transition-colors disabled:opacity-50"
            >
              Refresh
            </button>
          )}
          <button
            onClick={() => setDismissed(true)}
            className="text-muted-foreground hover:text-foreground text-xs transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
        <StatCell label="Tasks Done" value={stats.tasksCompleted} testId="stat-tasks" />
        <StatCell
          label="Spent"
          value={`$${stats.spending.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
          testId="stat-spending"
        />
        <StatCell label="Streak" value={`${stats.streak}d`} testId="stat-streak" />
        <StatCell label="Sleep Logged" value={stats.sleepEntries} testId="stat-sleep" />
        <StatCell
          label="Goals"
          value={stats.goalsTotal > 0 ? `${stats.goalsCompleted}/${stats.goalsTotal}` : '0'}
          testId="stat-goals"
        />
      </div>

      {narrativeLoading && (
        <div className="space-y-2" data-testid="digest-loading">
          <div className="h-3 bg-secondary animate-pulse w-3/4" />
          <div className="h-3 bg-secondary animate-pulse w-1/2" />
        </div>
      )}

      {narrative && !narrativeLoading && (
        <p className="text-muted-foreground text-sm leading-relaxed" data-testid="digest-narrative">
          {narrative}
        </p>
      )}
    </div>
  );
}
