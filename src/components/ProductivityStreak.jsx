/**
 * ProductivityStreak — shows current streak, longest streak,
 * and a 30-day heatmap grid derived from completed tasks.
 */
import { useMemo } from 'react';
import { useTasks } from '../hooks/useTasks';
import {
  getProductiveDates,
  calcCurrentStreak,
  calcLongestStreak,
  getLastNDays,
  streakMessage,
  getTodayStr,
} from '../hooks/useProductivityStreak';

export function ProductivityStreak() {
  const { tasks } = useTasks();
  const today = getTodayStr();

  const { productiveDates, currentStreak, longestStreak, last30 } = useMemo(() => {
    const productiveDates = getProductiveDates(tasks);
    return {
      productiveDates,
      currentStreak: calcCurrentStreak(productiveDates, today),
      longestStreak: calcLongestStreak(productiveDates),
      last30: getLastNDays(productiveDates, 30, today),
    };
  }, [tasks, today]);

  const completedToday = productiveDates.has(today);
  const message = streakMessage(currentStreak);

  return (
    <div className="bg-background border border-border p-5 space-y-4" data-testid="productivity-streak">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-foreground font-semibold text-sm">Productivity Streak</h3>
          <p className="text-muted-foreground text-xs mt-0.5" data-testid="streak-message">{message}</p>
        </div>
        {completedToday && (
          <span className="text-green-400 text-xs font-medium bg-green-500/10 border border-green-500/20 px-2 py-1">
            ✓ Done today
          </span>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-secondary border border-border px-4 py-3 text-center">
          <p className="text-2xl font-bold text-amber-400" data-testid="current-streak">{currentStreak}</p>
          <p className="text-muted-foreground text-xs mt-0.5">Current Streak</p>
        </div>
        <div className="bg-secondary border border-border px-4 py-3 text-center">
          <p className="text-2xl font-bold text-foreground" data-testid="longest-streak">{longestStreak}</p>
          <p className="text-muted-foreground text-xs mt-0.5">Longest Streak</p>
        </div>
      </div>

      {/* 30-day heatmap */}
      <div>
        <p className="text-muted-foreground/60 text-xs uppercase tracking-wider mb-2">Last 30 days</p>
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}
          data-testid="streak-heatmap"
        >
          {last30.map(({ dateStr, productive }) => (
            <div
              key={dateStr}
              title={dateStr}
              data-testid={`heatmap-day-${dateStr}`}
              className={`aspect-square rounded-sm transition-colors ${
                dateStr === today
                  ? productive
                    ? 'bg-amber-400 ring-1 ring-white/30'
                    : 'bg-secondary ring-1 ring-amber-500/40'
                  : productive
                  ? 'bg-amber-500/70'
                  : 'bg-[#27272a]'
              }`}
            />
          ))}
        </div>
        <div className="flex items-center justify-end gap-2 mt-2">
          <span className="text-muted-foreground/60 text-xs">Less</span>
          <div className="w-3 h-3 rounded-sm bg-[#27272a]" />
          <div className="w-3 h-3 rounded-sm bg-amber-500/40" />
          <div className="w-3 h-3 rounded-sm bg-amber-500/70" />
          <div className="w-3 h-3 rounded-sm bg-amber-400" />
          <span className="text-muted-foreground/60 text-xs">More</span>
        </div>
      </div>
    </div>
  );
}
