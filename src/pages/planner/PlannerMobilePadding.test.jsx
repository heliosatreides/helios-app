import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

vi.mock('../../hooks/useIDB', () => ({
  useIDB: (key, defaultVal) => [defaultVal, vi.fn()],
}));

vi.mock('../../hooks/useTasks', () => ({
  getTodayStr: () => '2026-03-25',
  useTasks: () => ({ tasks: [], addTask: vi.fn(), updateTask: vi.fn(), deleteTask: vi.fn() }),
}));

vi.mock('./TodayTab', () => ({ TodayTab: () => <div data-testid="today-tab">Today</div> }));
vi.mock('./TasksTab', () => ({ TasksTab: () => <div data-testid="tasks-tab">Tasks</div> }));
vi.mock('./CalendarTab', () => ({ CalendarTab: () => <div data-testid="calendar-tab">Calendar</div> }));

import { PlannerPage } from './PlannerPage';

test('planner tab content renders without an extra border wrapper div', () => {
  const { container } = render(<MemoryRouter><PlannerPage /></MemoryRouter>);
  const todayTab = container.querySelector('[data-testid="today-tab"]');
  const parent = todayTab.parentElement;
  // Parent should be the top-level space-y-6 div, not a border wrapper
  expect(parent.className).toContain('space-y-6');
});

test('planner tab content has no double-padding wrapper on mobile', () => {
  const { container } = render(<MemoryRouter><PlannerPage /></MemoryRouter>);
  const todayTab = container.querySelector('[data-testid="today-tab"]');
  const parent = todayTab.parentElement;
  // Should NOT have the old border-0 md:border wrapper classes
  expect(parent.className).not.toContain('border-0');
  expect(parent.className).not.toContain('md:border');
  expect(parent.className).not.toContain('md:p-5');
});
