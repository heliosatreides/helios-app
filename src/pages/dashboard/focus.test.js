import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  pomodoroTransition,
  POMODORO_STATES,
  calculateStreak,
  getLast7Days,
  toggleHabitCompletion,
  createHabit,
  parseMarkdownish,
} from './focus.utils';

// ── Pomodoro state transitions ─────────────────────────────────────────────

const { IDLE, RUNNING, PAUSED, BREAK } = POMODORO_STATES;

describe('pomodoroTransition', () => {
  it('start from idle → running', () => {
    expect(pomodoroTransition(IDLE, 'start')).toBe(RUNNING);
  });

  it('start from paused → running', () => {
    expect(pomodoroTransition(PAUSED, 'start')).toBe(RUNNING);
  });

  it('pause from running → paused', () => {
    expect(pomodoroTransition(RUNNING, 'pause')).toBe(PAUSED);
  });

  it('resume from paused → running', () => {
    expect(pomodoroTransition(PAUSED, 'resume')).toBe(RUNNING);
  });

  it('reset from any state → idle', () => {
    expect(pomodoroTransition(RUNNING, 'reset')).toBe(IDLE);
    expect(pomodoroTransition(PAUSED, 'reset')).toBe(IDLE);
    expect(pomodoroTransition(BREAK, 'reset')).toBe(IDLE);
  });

  it('finishWork from running → break', () => {
    expect(pomodoroTransition(RUNNING, 'finishWork')).toBe(BREAK);
  });

  it('finishBreak from break → idle', () => {
    expect(pomodoroTransition(BREAK, 'finishBreak')).toBe(IDLE);
  });

  it('invalid transition returns current state', () => {
    expect(pomodoroTransition(IDLE, 'pause')).toBe(IDLE);
    expect(pomodoroTransition(BREAK, 'pause')).toBe(BREAK);
  });
});

// ── Habit streak calculation ───────────────────────────────────────────────

describe('calculateStreak', () => {
  let now;

  beforeEach(() => {
    // Fix "today" to 2026-03-23
    now = new Date('2026-03-23T12:00:00Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns 0 for empty completions', () => {
    expect(calculateStreak([])).toBe(0);
  });

  it('returns 0 for null', () => {
    expect(calculateStreak(null)).toBe(0);
  });

  it('returns 1 for a single completion today', () => {
    expect(calculateStreak(['2026-03-23'])).toBe(1);
  });

  it('returns 1 for only yesterday', () => {
    expect(calculateStreak(['2026-03-22'])).toBe(1);
  });

  it('returns 7 for 7 consecutive days ending today', () => {
    const completions = [
      '2026-03-17', '2026-03-18', '2026-03-19',
      '2026-03-20', '2026-03-21', '2026-03-22',
      '2026-03-23',
    ];
    expect(calculateStreak(completions)).toBe(7);
  });

  it('breaks streak when there is a gap', () => {
    // Missing 2026-03-21
    const completions = [
      '2026-03-19', '2026-03-20',
      '2026-03-22', '2026-03-23',
    ];
    expect(calculateStreak(completions)).toBe(2);
  });

  it('ignores duplicates', () => {
    const completions = ['2026-03-23', '2026-03-23', '2026-03-22'];
    expect(calculateStreak(completions)).toBe(2);
  });
});

// ── getLast7Days ───────────────────────────────────────────────────────────

describe('getLast7Days', () => {
  it('returns exactly 7 dates', () => {
    expect(getLast7Days()).toHaveLength(7);
  });

  it('ends with today', () => {
    const days = getLast7Days();
    const today = new Date().toISOString().slice(0, 10);
    expect(days[days.length - 1]).toBe(today);
  });

  it('dates are in ascending order', () => {
    const days = getLast7Days();
    for (let i = 1; i < days.length; i++) {
      expect(days[i] > days[i - 1]).toBe(true);
    }
  });
});

// ── toggleHabitCompletion ──────────────────────────────────────────────────

describe('toggleHabitCompletion', () => {
  it('adds date if not present', () => {
    const habit = { id: '1', name: 'Read', completions: [] };
    const updated = toggleHabitCompletion(habit, '2026-03-23');
    expect(updated.completions).toContain('2026-03-23');
  });

  it('removes date if already present', () => {
    const habit = { id: '1', name: 'Read', completions: ['2026-03-23'] };
    const updated = toggleHabitCompletion(habit, '2026-03-23');
    expect(updated.completions).not.toContain('2026-03-23');
  });

  it('does not mutate original habit', () => {
    const habit = { id: '1', name: 'Read', completions: [] };
    const original = [...habit.completions];
    toggleHabitCompletion(habit, '2026-03-23');
    expect(habit.completions).toEqual(original);
  });
});

// ── createHabit ────────────────────────────────────────────────────────────

describe('createHabit', () => {
  it('creates a habit with default frequency', () => {
    const h = createHabit({ name: 'Exercise' });
    expect(h.name).toBe('Exercise');
    expect(h.frequency).toBe('daily');
    expect(h.completions).toEqual([]);
    expect(h.id).toBeTruthy();
  });

  it('uses provided color', () => {
    const h = createHabit({ name: 'Read', color: '#3b82f6' });
    expect(h.color).toBe('#3b82f6');
  });
});

// ── parseMarkdownish ───────────────────────────────────────────────────────

describe('parseMarkdownish', () => {
  it('returns empty array for null/empty', () => {
    expect(parseMarkdownish('')).toHaveLength(0);
    expect(parseMarkdownish(null)).toHaveLength(0);
  });

  it('returns paragraph type for normal text', () => {
    const result = parseMarkdownish('Hello world');
    expect(result[0]).toEqual({ type: 'paragraph', content: 'Hello world' });
  });

  it('returns bullet type for - lines', () => {
    const result = parseMarkdownish('- item one');
    expect(result[0]).toEqual({ type: 'bullet', content: 'item one' });
  });

  it('returns bullet type for * lines', () => {
    const result = parseMarkdownish('* another item');
    expect(result[0]).toEqual({ type: 'bullet', content: 'another item' });
  });

  it('handles mixed content', () => {
    const text = 'Intro\n- item\nnormal';
    const result = parseMarkdownish(text);
    expect(result).toHaveLength(3);
    expect(result[1].type).toBe('bullet');
  });
});
