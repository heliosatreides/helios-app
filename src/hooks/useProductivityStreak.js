/**
 * Productivity Streak Utilities & Hook
 *
 * A "productive day" = at least 1 task was completed that day.
 * Uses task.completedAt timestamps to infer per-day completion.
 */

/**
 * Given an array of completed tasks (with completedAt ISO strings),
 * return the set of unique date strings (YYYY-MM-DD) where ≥1 task was done.
 */
export function getProductiveDates(tasks) {
  const dates = new Set();
  for (const task of tasks) {
    if (task.completed && task.completedAt) {
      const dateStr = task.completedAt.slice(0, 10);
      dates.add(dateStr);
    }
  }
  return dates;
}

/**
 * Calculate the current streak (consecutive productive days ending today or yesterday).
 * Returns number of consecutive productive days going backwards from today.
 */
export function calcCurrentStreak(productiveDates, today = getTodayStr()) {
  let streak = 0;
  let cursor = today;

  // Allow streak to continue if today isn't done yet (check yesterday first)
  // We count today if it's productive, otherwise we start from yesterday.
  let started = false;

  for (let i = 0; i <= 365; i++) {
    const d = offsetDate(today, -i);
    if (productiveDates.has(d)) {
      streak++;
      started = true;
    } else {
      // If we haven't started yet and this is today, skip to yesterday
      if (!started && i === 0) {
        continue; // today might not be done yet, check yesterday
      }
      break; // gap in streak
    }
  }
  return streak;
}

/**
 * Calculate the longest streak ever from the productive dates set.
 */
export function calcLongestStreak(productiveDates) {
  if (productiveDates.size === 0) return 0;

  const sorted = Array.from(productiveDates).sort();
  let maxStreak = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const prevDate = new Date(prev + 'T00:00:00');
    const currDate = new Date(curr + 'T00:00:00');
    const diff = (currDate - prevDate) / (1000 * 60 * 60 * 24);

    if (diff === 1) {
      current++;
      if (current > maxStreak) maxStreak = current;
    } else {
      current = 1;
    }
  }

  return maxStreak;
}

/**
 * Return the last N days as an array of { dateStr, productive } objects.
 * Used for the heatmap display.
 */
export function getLastNDays(productiveDates, n = 30, today = getTodayStr()) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = offsetDate(today, -i);
    days.push({ dateStr: d, productive: productiveDates.has(d) });
  }
  return days;
}

/**
 * Get a human-readable streak message.
 */
export function streakMessage(currentStreak) {
  if (currentStreak === 0) return 'Start your streak today!';
  if (currentStreak === 1) return '1 day streak — keep it going!';
  if (currentStreak < 7) return `${currentStreak} day streak 🔥`;
  if (currentStreak < 30) return `${currentStreak} day streak 🔥🔥`;
  return `${currentStreak} day streak 🔥🔥🔥 incredible!`;
}

/**
 * Merge multiple sets of productive dates into one.
 * Accepts any number of Set<string> arguments.
 * A day is productive if it appears in ANY source set.
 */
export function mergeProductiveDates(...dateSets) {
  const merged = new Set();
  for (const s of dateSets) {
    if (s && s.size) {
      for (const d of s) merged.add(d);
    }
  }
  return merged;
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

function offsetDate(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
