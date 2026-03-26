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

test('planner content wrapper uses responsive padding (p-3 md:p-5) instead of fixed p-5', () => {
  const { container } = render(<MemoryRouter><PlannerPage /></MemoryRouter>);
  const contentWrapper = container.querySelector('[data-testid="today-tab"]').parentElement;
  // Should have responsive padding, not a fixed border+p-5
  expect(contentWrapper.className).toMatch(/p-3/);
  expect(contentWrapper.className).toMatch(/md:p-5/);
});

test('planner content wrapper removes border on mobile', () => {
  const { container } = render(<MemoryRouter><PlannerPage /></MemoryRouter>);
  const contentWrapper = container.querySelector('[data-testid="today-tab"]').parentElement;
  expect(contentWrapper.className).toMatch(/border-0|md:border/);
});
