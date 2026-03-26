import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProactiveAlerts } from './ProactiveAlerts';

// Mock state containers
let mockTasks = [];
let mockSubs = [];

vi.mock('../hooks/useTasks', () => ({
  useTasks: () => ({ tasks: mockTasks }),
  groupTasks: (tasks, today) => {
    const overdue = [];
    const todayTasks = [];
    const upcoming = [];
    const noDate = [];
    const completed = [];
    tasks.forEach((t) => {
      if (t.completed) { completed.push(t); return; }
      if (!t.dueDate) { noDate.push(t); return; }
      if (t.dueDate < today) { overdue.push(t); }
      else if (t.dueDate === today) { todayTasks.push(t); }
      else { upcoming.push(t); }
    });
    return { overdue, today: todayTasks, upcoming, noDate, completed };
  },
  getTodayStr: () => '2026-03-26',
}));

vi.mock('../hooks/useIDB', () => ({
  useIDB: (key) => {
    if (key === 'subscriptions') return [mockSubs];
    return [[]];
  },
}));

function renderAlerts(props = {}) {
  return render(
    <MemoryRouter>
      <ProactiveAlerts transactions={[]} budgets={[]} {...props} />
    </MemoryRouter>
  );
}

describe('ProactiveAlerts', () => {
  beforeEach(() => {
    mockTasks = [];
    mockSubs = [];
  });

  it('renders nothing when there are no alerts', () => {
    const { container } = renderAlerts();
    expect(container.querySelector('[data-testid="proactive-alerts"]')).toBeNull();
  });

  it('shows overdue tasks alert', () => {
    mockTasks.push(
      { id: '1', title: 'Old task', dueDate: '2026-03-20', completed: false },
      { id: '2', title: 'Old task 2', dueDate: '2026-03-24', completed: false },
    );
    renderAlerts();
    expect(screen.getByText('2 overdue tasks')).toBeTruthy();
  });

  it('does not show completed overdue tasks', () => {
    mockTasks.push(
      { id: '1', title: 'Done', dueDate: '2026-03-20', completed: true },
    );
    const { container } = renderAlerts();
    expect(container.querySelector('[data-testid="proactive-alerts"]')).toBeNull();
  });

  it('shows subscription renewal alerts', () => {
    mockSubs.push(
      { id: 's1', name: 'Netflix', nextDate: '2026-03-26', cost: 15 },
      { id: 's2', name: 'Spotify', nextDate: '2026-03-28', cost: 10 },
    );
    renderAlerts();
    expect(screen.getByText('Netflix renews today')).toBeTruthy();
    expect(screen.getByText('Spotify renews in 2 days')).toBeTruthy();
  });

  it('does not show subscriptions renewing in 4+ days', () => {
    mockSubs.push(
      { id: 's1', name: 'Far Away', nextDate: '2026-04-05', cost: 20 },
    );
    const { container } = renderAlerts();
    expect(container.querySelector('[data-testid="proactive-alerts"]')).toBeNull();
  });

  it('shows budget over 80% alerts', () => {
    const budgets = [
      { category: 'Food', limit: 500 },
      { category: 'Fun', limit: 100 },
    ];
    const transactions = [
      { type: 'expense', category: 'Food', amount: 450, date: '2026-03-10' },
      { type: 'expense', category: 'Fun', amount: 60, date: '2026-03-15' },
    ];
    renderAlerts({ budgets, transactions });
    expect(screen.getByText('Food budget at 90%')).toBeTruthy();
    // Fun at 60% — should NOT show
    expect(screen.queryByText(/Fun budget/)).toBeNull();
  });

  it('shows budget at 100%+ as red variant', () => {
    const budgets = [{ category: 'Dining', limit: 200 }];
    const transactions = [
      { type: 'expense', category: 'Dining', amount: 220, date: '2026-03-05' },
    ];
    renderAlerts({ budgets, transactions });
    expect(screen.getByText('Dining budget at 110%')).toBeTruthy();
  });

  it('shows combined alerts from all sources', () => {
    mockTasks.push({ id: '1', title: 'Late', dueDate: '2026-03-20', completed: false });
    mockSubs.push({ id: 's1', name: 'Netflix', nextDate: '2026-03-27', cost: 15 });
    const budgets = [{ category: 'Food', limit: 100 }];
    const transactions = [
      { type: 'expense', category: 'Food', amount: 95, date: '2026-03-10' },
    ];
    renderAlerts({ budgets, transactions });
    expect(screen.getByText('1 overdue task')).toBeTruthy();
    expect(screen.getByText('Netflix renews tomorrow')).toBeTruthy();
    expect(screen.getByText('Food budget at 95%')).toBeTruthy();
  });

  it('links overdue tasks to planner', () => {
    mockTasks.push({ id: '1', title: 'Late', dueDate: '2026-03-20', completed: false });
    renderAlerts();
    const link = screen.getByText('1 overdue task').closest('a');
    expect(link.getAttribute('href')).toBe('/planner');
  });

  it('links subscriptions to subscriptions page', () => {
    mockSubs.push({ id: 's1', name: 'Hulu', nextDate: '2026-03-26', cost: 10 });
    renderAlerts();
    const link = screen.getByText('Hulu renews today').closest('a');
    expect(link.getAttribute('href')).toBe('/subscriptions');
  });
});
