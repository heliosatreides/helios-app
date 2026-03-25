/**
 * Pure utility functions for Focus Mode tab.
 * Kept separate from components for testability.
 */

/**
 * Pomodoro timer state machine.
 * States: 'idle' | 'running' | 'paused' | 'break'
 */
export const POMODORO_STATES = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  BREAK: 'break',
};

/**
 * Compute the next pomodoro state given current state and action.
 * Actions: 'start' | 'pause' | 'resume' | 'reset' | 'finishWork' | 'finishBreak'
 */
export function pomodoroTransition(state, action) {
  const { IDLE, RUNNING, PAUSED, BREAK } = POMODORO_STATES;

  switch (action) {
    case 'start':
      if (state === IDLE || state === PAUSED) return RUNNING;
      return state;
    case 'pause':
      if (state === RUNNING) return PAUSED;
      return state;
    case 'resume':
      if (state === PAUSED) return RUNNING;
      return state;
    case 'reset':
      return IDLE;
    case 'finishWork':
      if (state === RUNNING) return BREAK;
      return state;
    case 'finishBreak':
      if (state === BREAK) return IDLE;
      return state;
    default:
      return state;
  }
}

/** Get today's date string YYYY-MM-DD */
export function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Calculate the streak for a habit given its completion log.
 * completions: Array of YYYY-MM-DD strings.
 * Returns number of consecutive days ending today (or yesterday).
 */
export function calculateStreak(completions) {
  if (!completions || completions.length === 0) return 0;

  // Deduplicate and sort descending
  const sorted = [...new Set(completions)].sort((a, b) => b.localeCompare(a));

  const today = getTodayKey();
  const todayDate = new Date(today + 'T00:00:00');

  let streak = 0;
  let expected = todayDate;

  for (const dateStr of sorted) {
    const d = new Date(dateStr + 'T00:00:00');
    const diffDays = Math.round((expected - d) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      streak++;
      expected = new Date(d);
      expected.setDate(expected.getDate() - 1);
    } else if (streak === 0 && diffDays === 1) {
      // Allow streak to start from yesterday if not done today
      streak++;
      expected = new Date(d);
      expected.setDate(expected.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Get the last 7 day keys ending today.
 */
export function getLast7Days() {
  const days = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

/**
 * Create a new habit object
 */
export function createHabit({ name, frequency = 'daily', color = '#f59e0b' }) {
  return {
    id: Date.now().toString() + Math.random().toString(36).slice(2),
    name: name || '',
    frequency,
    color,
    completions: [], // array of YYYY-MM-DD strings
    createdAt: new Date().toISOString(),
  };
}

/**
 * Toggle completion for a habit on a given date.
 */
export function toggleHabitCompletion(habit, dateStr) {
  const completions = habit.completions || [];
  if (completions.includes(dateStr)) {
    return { ...habit, completions: completions.filter((d) => d !== dateStr) };
  } else {
    return { ...habit, completions: [...completions, dateStr] };
  }
}

/**
 * Keyboard shortcuts help entries.
 * Each entry: { key: string, description: string }
 */
export const FOCUS_KEY_HELP = [
  { key: 'Space', description: 'Start / Pause timer' },
  { key: 'r', description: 'Reset timer' },
  { key: 's', description: 'Skip break' },
  { key: 'n', description: 'Next task' },
  { key: 'p', description: 'Previous task' },
  { key: '?', description: 'Show keyboard shortcuts' },
  { key: 'Esc', description: 'Dismiss overlay' },
];

/**
 * Map a keyboard event key + target tag name to a focus action string.
 *
 * Returns one of:
 *   'toggle-timer' | 'reset-timer' | 'skip-break' |
 *   'next-task'    | 'prev-task'   | 'show-help'  |
 *   'dismiss'      | null
 *
 * Returns null when the event originates from an interactive input field
 * (INPUT, TEXTAREA, SELECT) to avoid hijacking text entry, EXCEPT for
 * Escape which always works.
 */
export function getFocusKeyAction(key, targetTagName) {
  const tag = (targetTagName || '').toUpperCase();
  const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

  // Escape always works (dismiss modal/overlay)
  if (key === 'Escape') return 'dismiss';

  // All other shortcuts are suppressed while user is typing in a field
  if (isInput) return null;

  switch (key) {
    case ' ':
      return 'toggle-timer';
    case 'r':
      return 'reset-timer';
    case 's':
      return 'skip-break';
    case 'n':
      return 'next-task';
    case 'p':
      return 'prev-task';
    case '?':
      return 'show-help';
    default:
      return null;
  }
}

/**
 * Simple markdown-ish renderer: bold, italic, bullet list items.
 * Returns an array of { type, content } objects for rendering.
 */
export function parseMarkdownish(text) {
  if (!text) return [];
  const lines = text.split('\n');
  return lines.map((line) => {
    if (/^\s*[-*]\s/.test(line)) {
      return { type: 'bullet', content: line.replace(/^\s*[-*]\s/, '') };
    }
    return { type: 'paragraph', content: line };
  });
}
