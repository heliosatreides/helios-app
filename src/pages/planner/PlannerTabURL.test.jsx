import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

// Mock heavy children
vi.mock('./TodayTab', () => ({ TodayTab: () => <div data-testid="today-tab" /> }));
vi.mock('./TasksTab', () => ({ TasksTab: () => <div data-testid="tasks-tab" /> }));
vi.mock('./CalendarTab', () => ({ CalendarTab: () => <div data-testid="calendar-tab" /> }));
vi.mock('../../hooks/useTasks', () => ({ getTodayStr: () => '2026-03-25' }));
vi.mock('../../hooks/useIDB', () => ({
  useIDB: (_key, def) => [def, vi.fn()],
}));

import { PlannerPage } from './PlannerPage';

describe('PlannerPage tab URL persistence', () => {
  it('defaults to Today tab when no query param', () => {
    render(
      <MemoryRouter initialEntries={['/planner']}>
        <PlannerPage />
      </MemoryRouter>
    );
    expect(screen.getByTestId('today-tab')).toBeTruthy();
  });

  it('opens Tasks tab when ?tab=Tasks', () => {
    render(
      <MemoryRouter initialEntries={['/planner?tab=Tasks']}>
        <PlannerPage />
      </MemoryRouter>
    );
    expect(screen.getByTestId('tasks-tab')).toBeTruthy();
  });

  it('opens Calendar tab when ?tab=Calendar', () => {
    render(
      <MemoryRouter initialEntries={['/planner?tab=Calendar']}>
        <PlannerPage />
      </MemoryRouter>
    );
    expect(screen.getByTestId('calendar-tab')).toBeTruthy();
  });

  it('falls back to Today for invalid tab param', () => {
    render(
      <MemoryRouter initialEntries={['/planner?tab=Bogus']}>
        <PlannerPage />
      </MemoryRouter>
    );
    expect(screen.getByTestId('today-tab')).toBeTruthy();
  });

  it('clicking Tasks tab switches content', () => {
    render(
      <MemoryRouter initialEntries={['/planner']}>
        <PlannerPage />
      </MemoryRouter>
    );
    expect(screen.getByTestId('today-tab')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /tasks/i }));
    expect(screen.getByTestId('tasks-tab')).toBeTruthy();
  });
});
