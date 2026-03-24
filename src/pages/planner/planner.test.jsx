/**
 * Daily Planner tests
 * Tests: useTasks, groupTasks, schedule utils, calendar utils, Gemini integration
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  groupTasks,
  applyCarryForward,
  getNextDueDate,
  getYesterdayStr,
  useTasks,
} from '../../hooks/useTasks';
import { useTodaySchedule } from '../../hooks/useTodaySchedule';
import {
  getDaysInMonth,
  getCalendarGrid,
  navigateMonth,
} from './calendarUtils';
import {
  buildPlanMyDayPrompt,
  buildPrioritizePrompt,
  buildBreakDownPrompt,
  parseScheduleResponse,
  parsePrioritizeResponse,
  parseBreakDownResponse,
} from './geminiUtils';

// ─── useTasks tests ─────────────────────────────────────────────────────────

describe('useTasks', () => {
  it('starts with empty task list', async () => {
    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.tasks).toBeDefined());
    expect(result.current.tasks).toEqual([]);
  });

  it('adds a task', async () => {
    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.tasks).toBeDefined());

    await act(async () => {
      result.current.addTask({ title: 'Buy groceries', priority: 'High' });
    });

    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0].title).toBe('Buy groceries');
    expect(result.current.tasks[0].priority).toBe('High');
    expect(result.current.tasks[0].completed).toBe(false);
  });

  it('toggles task completion', async () => {
    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.tasks).toBeDefined());

    let taskId;
    await act(async () => {
      const t = result.current.addTask({ title: 'Test task', recurring: 'None' });
      taskId = t.id;
    });

    expect(result.current.tasks[0].completed).toBe(false);

    await act(async () => {
      result.current.toggleComplete(taskId);
    });

    expect(result.current.tasks[0].completed).toBe(true);
  });

  it('deletes a task', async () => {
    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.tasks).toBeDefined());

    let taskId;
    await act(async () => {
      const t = result.current.addTask({ title: 'Delete me' });
      taskId = t.id;
    });

    expect(result.current.tasks).toHaveLength(1);

    await act(async () => {
      result.current.deleteTask(taskId);
    });

    expect(result.current.tasks).toHaveLength(0);
  });

  it('updates a task', async () => {
    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.tasks).toBeDefined());

    let taskId;
    await act(async () => {
      const t = result.current.addTask({ title: 'Original' });
      taskId = t.id;
    });

    await act(async () => {
      result.current.updateTask(taskId, { title: 'Updated', priority: 'Low' });
    });

    expect(result.current.tasks[0].title).toBe('Updated');
    expect(result.current.tasks[0].priority).toBe('Low');
  });

  it('recurring Daily: creates new instance when completed', async () => {
    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.tasks).toBeDefined());

    let taskId;
    await act(async () => {
      const t = result.current.addTask({
        title: 'Daily standup',
        recurring: 'Daily',
        dueDate: '2025-01-15',
      });
      taskId = t.id;
    });

    await act(async () => {
      result.current.toggleComplete(taskId);
    });

    // Should have the original (completed) + new recurring instance
    expect(result.current.tasks).toHaveLength(2);
    const recurring = result.current.tasks.find((t) => !t.completed);
    expect(recurring).toBeDefined();
    expect(recurring.dueDate).toBe('2025-01-16'); // next day
    expect(recurring.recurring).toBe('Daily');
  });

  it('recurring Weekly: creates new instance 7 days later', async () => {
    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.tasks).toBeDefined());

    let taskId;
    await act(async () => {
      const t = result.current.addTask({
        title: 'Weekly review',
        recurring: 'Weekly',
        dueDate: '2025-01-15',
      });
      taskId = t.id;
    });

    await act(async () => {
      result.current.toggleComplete(taskId);
    });

    const recurring = result.current.tasks.find((t) => !t.completed);
    expect(recurring.dueDate).toBe('2025-01-22');
  });
});

// ─── groupTasks tests ────────────────────────────────────────────────────────

describe('groupTasks', () => {
  const today = '2025-01-15';

  it('groups overdue tasks', () => {
    const tasks = [{ id: '1', title: 'Old', dueDate: '2025-01-10', completed: false }];
    const groups = groupTasks(tasks, today);
    expect(groups.overdue).toHaveLength(1);
    expect(groups.today).toHaveLength(0);
  });

  it('groups today tasks', () => {
    const tasks = [{ id: '1', title: 'Now', dueDate: today, completed: false }];
    const groups = groupTasks(tasks, today);
    expect(groups.today).toHaveLength(1);
    expect(groups.overdue).toHaveLength(0);
  });

  it('groups upcoming tasks', () => {
    const tasks = [{ id: '1', title: 'Future', dueDate: '2025-01-20', completed: false }];
    const groups = groupTasks(tasks, today);
    expect(groups.upcoming).toHaveLength(1);
  });

  it('groups tasks with no due date', () => {
    const tasks = [{ id: '1', title: 'Someday', dueDate: null, completed: false }];
    const groups = groupTasks(tasks, today);
    expect(groups.noDate).toHaveLength(1);
  });

  it('puts completed tasks in completed group', () => {
    const tasks = [
      { id: '1', title: 'Done', dueDate: today, completed: true },
      { id: '2', title: 'Active', dueDate: today, completed: false },
    ];
    const groups = groupTasks(tasks, today);
    expect(groups.completed).toHaveLength(1);
    expect(groups.today).toHaveLength(1);
  });
});

// ─── applyCarryForward tests ─────────────────────────────────────────────────

describe('applyCarryForward', () => {
  it('moves yesterday incomplete tasks to today', () => {
    const today = '2025-01-15';
    const tasks = [
      { id: '1', title: 'Yesterday task', dueDate: '2025-01-14', completed: false },
    ];
    const result = applyCarryForward(tasks, today);
    expect(result[0].dueDate).toBe(today);
  });

  it('does not move completed tasks', () => {
    const today = '2025-01-15';
    const tasks = [
      { id: '1', title: 'Done yesterday', dueDate: '2025-01-14', completed: true },
    ];
    const result = applyCarryForward(tasks, today);
    expect(result[0].dueDate).toBe('2025-01-14'); // unchanged
  });

  it('does not affect today or future tasks', () => {
    const today = '2025-01-15';
    const tasks = [
      { id: '2', title: 'Today task', dueDate: today, completed: false },
      { id: '3', title: 'Future task', dueDate: '2025-01-20', completed: false },
    ];
    const result = applyCarryForward(tasks, today);
    expect(result[0].dueDate).toBe(today);
    expect(result[1].dueDate).toBe('2025-01-20');
  });
});

// ─── useTodaySchedule tests ──────────────────────────────────────────────────

describe('useTodaySchedule', () => {
  it('starts with empty schedule', async () => {
    const { result } = renderHook(() => useTodaySchedule('2025-01-15'));
    await waitFor(() => expect(result.current.schedule).toBeDefined());
    expect(result.current.schedule).toEqual([]);
  });

  it('adds an event to a slot', async () => {
    const { result } = renderHook(() => useTodaySchedule('2025-01-15'));
    await waitFor(() => expect(result.current.schedule).toBeDefined());

    await act(async () => {
      result.current.addEvent({
        slotTime: '09:00',
        title: 'Morning meeting',
        duration: 60,
        color: 'blue',
      });
    });

    expect(result.current.schedule).toHaveLength(1);
    expect(result.current.schedule[0].title).toBe('Morning meeting');
    expect(result.current.schedule[0].slotTime).toBe('09:00');
  });

  it('deletes an event', async () => {
    const { result } = renderHook(() => useTodaySchedule('2025-01-15'));
    await waitFor(() => expect(result.current.schedule).toBeDefined());

    let eventId;
    await act(async () => {
      const e = result.current.addEvent({ slotTime: '10:00', title: 'Delete me' });
      eventId = e.id;
    });

    expect(result.current.schedule).toHaveLength(1);

    await act(async () => {
      result.current.deleteEvent(eventId);
    });

    expect(result.current.schedule).toHaveLength(0);
  });

  it('stores schedules keyed by date', async () => {
    const { result: r1 } = renderHook(() => useTodaySchedule('2025-01-15'));
    const { result: r2 } = renderHook(() => useTodaySchedule('2025-01-16'));

    await waitFor(() => expect(r1.current.schedule).toBeDefined());
    await waitFor(() => expect(r2.current.schedule).toBeDefined());

    await act(async () => {
      r1.current.addEvent({ slotTime: '09:00', title: 'Day 1 event' });
    });

    // r2 should still be empty
    expect(r2.current.schedule).toHaveLength(0);
    expect(r1.current.schedule).toHaveLength(1);
  });
});

// ─── Calendar utils tests ─────────────────────────────────────────────────────

describe('getDaysInMonth', () => {
  it('returns 31 days for January 2025', () => {
    expect(getDaysInMonth(2025, 0)).toBe(31); // 0=January
  });

  it('returns 28 days for Feb 2025 (non-leap)', () => {
    expect(getDaysInMonth(2025, 1)).toBe(28);
  });

  it('returns 29 days for Feb 2024 (leap year)', () => {
    expect(getDaysInMonth(2024, 1)).toBe(29);
  });

  it('returns 30 days for April', () => {
    expect(getDaysInMonth(2025, 3)).toBe(30);
  });
});

describe('getCalendarGrid', () => {
  it('generates a grid with the correct number of cells', () => {
    const grid = getCalendarGrid(2025, 0); // January 2025
    // Grid should have 6 rows × 7 cols = 42 cells (or 35 for 5 rows)
    expect(grid.length).toBeGreaterThanOrEqual(28);
    expect(grid.length % 7).toBe(0);
  });

  it('first day of January 2025 is Wednesday (index 3)', () => {
    const grid = getCalendarGrid(2025, 0);
    const firstDay = grid.find((d) => d.day === 1);
    // Jan 1, 2025 is a Wednesday
    expect(firstDay).toBeDefined();
    const idx = grid.indexOf(firstDay);
    expect(idx % 7).toBe(3); // 0=Sun, 3=Wed
  });
});

describe('navigateMonth', () => {
  it('goes to next month', () => {
    const { year, month } = navigateMonth(2025, 0, 1);
    expect(year).toBe(2025);
    expect(month).toBe(1);
  });

  it('wraps to next year from December', () => {
    const { year, month } = navigateMonth(2025, 11, 1);
    expect(year).toBe(2026);
    expect(month).toBe(0);
  });

  it('goes to previous month', () => {
    const { year, month } = navigateMonth(2025, 1, -1);
    expect(year).toBe(2025);
    expect(month).toBe(0);
  });

  it('wraps to previous year from January', () => {
    const { year, month } = navigateMonth(2025, 0, -1);
    expect(year).toBe(2024);
    expect(month).toBe(11);
  });
});

// ─── Gemini utils tests ───────────────────────────────────────────────────────

describe('buildPlanMyDayPrompt', () => {
  it('includes tasks in prompt', () => {
    const tasks = [{ title: 'Write report', priority: 'High', dueDate: '2025-01-15' }];
    const schedule = [{ slotTime: '09:00', title: 'Standup', duration: 30 }];
    const prompt = buildPlanMyDayPrompt(tasks, schedule);
    expect(prompt).toContain('Write report');
    expect(prompt).toContain('High');
    expect(prompt).toContain('Standup');
  });

  it('requests JSON output', () => {
    const prompt = buildPlanMyDayPrompt([], []);
    expect(prompt.toLowerCase()).toContain('json');
  });
});

describe('buildPrioritizePrompt', () => {
  it('includes all task titles', () => {
    const tasks = [
      { title: 'Alpha', priority: 'Low', dueDate: null },
      { title: 'Beta', priority: 'High', dueDate: '2025-01-15' },
    ];
    const prompt = buildPrioritizePrompt(tasks);
    expect(prompt).toContain('Alpha');
    expect(prompt).toContain('Beta');
  });
});

describe('buildBreakDownPrompt', () => {
  it('includes task title and notes', () => {
    const prompt = buildBreakDownPrompt('Launch website', 'Need to deploy and test');
    expect(prompt).toContain('Launch website');
    expect(prompt).toContain('Need to deploy and test');
  });

  it('requests 3-5 sub-tasks', () => {
    const prompt = buildBreakDownPrompt('Big task', '');
    expect(prompt).toMatch(/3.?5|subtask|sub-task|sub task/i);
  });
});

describe('parseScheduleResponse', () => {
  it('parses valid JSON schedule', () => {
    const raw = JSON.stringify([
      { slotTime: '09:00', title: 'Morning work', duration: 60, color: 'blue' },
      { slotTime: '10:00', title: 'Break', duration: 30, color: 'green' },
    ]);
    const events = parseScheduleResponse(raw);
    expect(events).toHaveLength(2);
    expect(events[0].slotTime).toBe('09:00');
    expect(events[1].title).toBe('Break');
  });

  it('returns empty array on invalid JSON', () => {
    const events = parseScheduleResponse('not json at all');
    expect(events).toEqual([]);
  });

  it('extracts JSON from markdown code blocks', () => {
    const raw = '```json\n[{"slotTime":"09:00","title":"Work","duration":60,"color":"amber"}]\n```';
    const events = parseScheduleResponse(raw);
    expect(events).toHaveLength(1);
    expect(events[0].title).toBe('Work');
  });
});

describe('parsePrioritizeResponse', () => {
  it('returns reordered IDs and reasoning', () => {
    const raw = JSON.stringify({
      order: ['id2', 'id1'],
      reasoning: ['id2 is urgent', 'id1 can wait'],
    });
    const result = parsePrioritizeResponse(raw);
    expect(result.order).toEqual(['id2', 'id1']);
    expect(result.reasoning).toHaveLength(2);
  });

  it('returns empty on invalid JSON', () => {
    const result = parsePrioritizeResponse('bad');
    expect(result).toEqual({ order: [], reasoning: [] });
  });
});

describe('parseBreakDownResponse', () => {
  it('parses array of sub-tasks', () => {
    const raw = JSON.stringify(['Step 1', 'Step 2', 'Step 3']);
    const subtasks = parseBreakDownResponse(raw);
    expect(subtasks).toHaveLength(3);
    expect(subtasks[0]).toBe('Step 1');
  });

  it('returns empty array on invalid JSON', () => {
    const subtasks = parseBreakDownResponse('invalid');
    expect(subtasks).toEqual([]);
  });

  it('extracts from markdown block', () => {
    const raw = '```json\n["Task A","Task B"]\n```';
    const subtasks = parseBreakDownResponse(raw);
    expect(subtasks).toHaveLength(2);
  });
});

// ─── getNextDueDate tests ─────────────────────────────────────────────────────

describe('getNextDueDate', () => {
  it('returns next day for Daily', () => {
    expect(getNextDueDate('2025-01-15', 'Daily')).toBe('2025-01-16');
  });

  it('returns 7 days later for Weekly', () => {
    expect(getNextDueDate('2025-01-15', 'Weekly')).toBe('2025-01-22');
  });

  it('returns null for None recurring', () => {
    expect(getNextDueDate('2025-01-15', 'None')).toBeNull();
  });

  it('handles month rollover', () => {
    expect(getNextDueDate('2025-01-31', 'Daily')).toBe('2025-02-01');
  });
});

describe('getYesterdayStr', () => {
  it('returns previous day', () => {
    expect(getYesterdayStr('2025-01-15')).toBe('2025-01-14');
  });

  it('handles month rollover', () => {
    expect(getYesterdayStr('2025-02-01')).toBe('2025-01-31');
  });
});
