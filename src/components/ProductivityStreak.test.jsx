/**
 * Tests for the ProductivityStreak component.
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ProductivityStreak } from './ProductivityStreak';

// Mock useTasks
const mockTasks = vi.fn();
vi.mock('../hooks/useTasks', () => ({
  useTasks: () => ({ tasks: mockTasks() }),
}));

// Mock useIDB for pomodoro-completed-dates
const mockPomodoroDates = vi.fn();
vi.mock('../hooks/useIDB', () => ({
  useIDB: (key, defaultVal) => {
    if (key === 'pomodoro-completed-dates') {
      return [mockPomodoroDates() ?? defaultVal, vi.fn(), true];
    }
    return [defaultVal, vi.fn(), true];
  },
}));

function renderStreak() {
  return render(
    <MemoryRouter>
      <ProductivityStreak />
    </MemoryRouter>
  );
}

beforeEach(() => {
  mockTasks.mockReturnValue([]);
  mockPomodoroDates.mockReturnValue([]);
});

describe('ProductivityStreak component', () => {
  it('renders the streak widget', () => {
    renderStreak();
    expect(screen.getByTestId('productivity-streak')).toBeInTheDocument();
  });

  it('shows 0 current streak with no tasks', () => {
    renderStreak();
    expect(screen.getByTestId('current-streak').textContent).toBe('0');
  });

  it('shows 0 longest streak with no tasks', () => {
    renderStreak();
    expect(screen.getByTestId('longest-streak').textContent).toBe('0');
  });

  it('shows "Start your streak today!" message when streak is 0', () => {
    renderStreak();
    expect(screen.getByTestId('streak-message').textContent).toMatch(/start/i);
  });

  it('renders 30 heatmap cells', () => {
    renderStreak();
    expect(screen.getByTestId('streak-heatmap').children).toHaveLength(30);
  });

  it('shows correct streak when tasks were completed recently', () => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = (() => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return d.toISOString().slice(0, 10);
    })();

    mockTasks.mockReturnValue([
      { completed: true, completedAt: `${today}T10:00:00Z` },
      { completed: true, completedAt: `${yesterday}T10:00:00Z` },
    ]);

    renderStreak();
    const currentStreak = parseInt(screen.getByTestId('current-streak').textContent, 10);
    expect(currentStreak).toBeGreaterThanOrEqual(2);
  });

  it('longest streak matches or exceeds current streak', () => {
    const today = new Date().toISOString().slice(0, 10);
    const d = (offset) => {
      const dt = new Date(today + 'T00:00:00');
      dt.setDate(dt.getDate() + offset);
      return dt.toISOString().slice(0, 10);
    };

    // Old 5-day streak 2 weeks ago, plus 2-day current streak
    mockTasks.mockReturnValue([
      { completed: true, completedAt: `${d(-14)}T10:00:00Z` },
      { completed: true, completedAt: `${d(-13)}T10:00:00Z` },
      { completed: true, completedAt: `${d(-12)}T10:00:00Z` },
      { completed: true, completedAt: `${d(-11)}T10:00:00Z` },
      { completed: true, completedAt: `${d(-10)}T10:00:00Z` },
      { completed: true, completedAt: `${d(-1)}T10:00:00Z` },
      { completed: true, completedAt: `${today}T10:00:00Z` },
    ]);

    renderStreak();
    const current = parseInt(screen.getByTestId('current-streak').textContent, 10);
    const longest = parseInt(screen.getByTestId('longest-streak').textContent, 10);
    expect(longest).toBeGreaterThanOrEqual(current);
    expect(longest).toBe(5);
    expect(current).toBe(2);
  });

  it('shows "Done today" badge when tasks completed today', () => {
    const today = new Date().toISOString().slice(0, 10);
    mockTasks.mockReturnValue([
      { completed: true, completedAt: `${today}T09:00:00Z` },
    ]);
    renderStreak();
    expect(screen.getByText(/done today/i)).toBeInTheDocument();
  });

  it('does not show "Done today" badge when no tasks completed today', () => {
    mockTasks.mockReturnValue([]);
    renderStreak();
    expect(screen.queryByText(/done today/i)).not.toBeInTheDocument();
  });

  it('counts pomodoro-only days in streak', () => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = (() => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return d.toISOString().slice(0, 10);
    })();

    // No tasks completed, but pomodoro sessions done yesterday and today
    mockTasks.mockReturnValue([]);
    mockPomodoroDates.mockReturnValue([yesterday, today]);

    renderStreak();
    const currentStreak = parseInt(screen.getByTestId('current-streak').textContent, 10);
    expect(currentStreak).toBeGreaterThanOrEqual(2);
  });

  it('merges task and pomodoro dates for combined streak', () => {
    const today = new Date().toISOString().slice(0, 10);
    const d = (offset) => {
      const dt = new Date(today + 'T00:00:00');
      dt.setDate(dt.getDate() + offset);
      return dt.toISOString().slice(0, 10);
    };

    // Task completed 2 days ago, pomodoro yesterday, task today
    mockTasks.mockReturnValue([
      { completed: true, completedAt: `${d(-2)}T10:00:00Z` },
      { completed: true, completedAt: `${today}T10:00:00Z` },
    ]);
    mockPomodoroDates.mockReturnValue([d(-1)]);

    renderStreak();
    const currentStreak = parseInt(screen.getByTestId('current-streak').textContent, 10);
    expect(currentStreak).toBe(3); // 3 consecutive days
  });

  it('shows "Done today" when only pomodoro completed today (no tasks)', () => {
    const today = new Date().toISOString().slice(0, 10);
    mockTasks.mockReturnValue([]);
    mockPomodoroDates.mockReturnValue([today]);

    renderStreak();
    expect(screen.getByText(/done today/i)).toBeInTheDocument();
  });
});
