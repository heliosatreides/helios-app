import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock data stores
let mockIDBStores = {};
const mockSetIDB = vi.fn();

vi.mock('../hooks/useIDB', () => ({
  useIDB: (key, initial) => {
    const val = key in mockIDBStores ? mockIDBStores[key] : initial;
    return [val, mockSetIDB, true];
  },
}));

const mockTasks = [];
vi.mock('../hooks/useTasks', () => ({
  useTasks: () => ({ tasks: mockTasks }),
}));

const mockGenerate = vi.fn();
let mockHasKey = false;
vi.mock('../hooks/useGemini', () => ({
  useGemini: () => ({
    generate: mockGenerate,
    loading: false,
    error: null,
    hasKey: mockHasKey,
  }),
}));

// Mock date to a Monday
const MOCK_MONDAY = '2026-03-23';
vi.mock('../hooks/useProductivityStreak', async () => {
  const actual = await vi.importActual('../hooks/useProductivityStreak');
  return {
    ...actual,
    getTodayStr: () => MOCK_MONDAY,
  };
});

import { WeeklyDigest } from './WeeklyDigest';

beforeEach(() => {
  mockIDBStores = {};
  mockTasks.length = 0;
  mockSetIDB.mockReset();
  mockGenerate.mockReset();
  mockHasKey = false;
});

describe('WeeklyDigest', () => {
  it('renders on a Monday with basic stats', () => {
    render(<WeeklyDigest />);
    expect(screen.getByTestId('weekly-digest')).toBeInTheDocument();
    expect(screen.getByText('Weekly Digest')).toBeInTheDocument();
    expect(screen.getByText(/Mar 16 – Mar 22/)).toBeInTheDocument();
  });

  it('shows tasks completed count from last 7 days', () => {
    mockTasks.push(
      { id: '1', completed: true, completedAt: '2026-03-20T10:00:00Z', title: 'Task 1' },
      { id: '2', completed: true, completedAt: '2026-03-18T10:00:00Z', title: 'Task 2' },
      { id: '3', completed: true, completedAt: '2026-03-10T10:00:00Z', title: 'Old task' }, // outside range
      { id: '4', completed: false, title: 'Incomplete' },
    );
    render(<WeeklyDigest />);
    expect(screen.getByTestId('stat-tasks')).toHaveTextContent('2');
  });

  it('shows weekly spending from finance transactions', () => {
    mockIDBStores['finance-transactions'] = [
      { id: '1', type: 'expense', amount: 50, date: '2026-03-20', category: 'Food' },
      { id: '2', type: 'expense', amount: 100, date: '2026-03-17', category: 'Shopping' },
      { id: '3', type: 'expense', amount: 200, date: '2026-03-10', category: 'Old' }, // outside range
      { id: '4', type: 'income', amount: 5000, date: '2026-03-20', category: 'Salary' },
    ];
    render(<WeeklyDigest />);
    expect(screen.getByTestId('stat-spending')).toHaveTextContent('$150');
  });

  it('shows sleep entries count', () => {
    mockIDBStores['sleep-log'] = [
      { id: '1', date: '2026-03-20', hours: 7 },
      { id: '2', date: '2026-03-18', hours: 8 },
      { id: '3', date: '2026-03-10', hours: 6 }, // outside range
    ];
    render(<WeeklyDigest />);
    expect(screen.getByTestId('stat-sleep')).toHaveTextContent('2');
  });

  it('shows goals progress', () => {
    mockIDBStores['goals-objectives'] = [
      { id: '1', title: 'Goal 1', status: 'completed' },
      { id: '2', title: 'Goal 2', status: 'in-progress' },
      { id: '3', title: 'Goal 3', status: 'completed' },
    ];
    render(<WeeklyDigest />);
    expect(screen.getByTestId('stat-goals')).toHaveTextContent('2/3');
  });

  it('shows current productivity streak', () => {
    mockTasks.push(
      { id: '1', completed: true, completedAt: '2026-03-23T10:00:00Z', title: 'Today' },
      { id: '2', completed: true, completedAt: '2026-03-22T10:00:00Z', title: 'Yesterday' },
      { id: '3', completed: true, completedAt: '2026-03-21T10:00:00Z', title: 'Day before' },
    );
    render(<WeeklyDigest />);
    const streakEl = screen.getByTestId('stat-streak');
    expect(streakEl).toHaveTextContent('3');
  });

  it('can be dismissed', () => {
    render(<WeeklyDigest />);
    expect(screen.getByTestId('weekly-digest')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Dismiss'));
    expect(screen.queryByTestId('weekly-digest')).not.toBeInTheDocument();
  });

  it('generates AI narrative when API key exists', async () => {
    mockHasKey = true;
    mockGenerate.mockResolvedValue('Great week! You completed tasks and stayed on budget.');
    render(<WeeklyDigest />);
    await waitFor(() => {
      expect(mockGenerate).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getByTestId('digest-narrative')).toHaveTextContent('Great week!');
    });
  });

  it('uses cached digest if available for current week', () => {
    mockIDBStores['weekly-digest-cache'] = {
      weekStart: '2026-03-16',
      text: 'Cached narrative from earlier.',
      stats: {},
    };
    mockHasKey = true;
    render(<WeeklyDigest />);
    expect(screen.getByTestId('digest-narrative')).toHaveTextContent('Cached narrative');
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it('handles refresh button click', async () => {
    mockHasKey = true;
    mockIDBStores['weekly-digest-cache'] = {
      weekStart: '2026-03-16',
      text: 'Old cached text.',
      stats: {},
    };
    mockGenerate.mockResolvedValue('Fresh narrative!');
    render(<WeeklyDigest />);
    fireEvent.click(screen.getByText('Refresh'));
    await waitFor(() => {
      expect(mockGenerate).toHaveBeenCalled();
    });
  });

  it('renders nothing when not Monday and no cache', () => {
    // Override getTodayStr for this test — we need a non-Monday
    // The mock always returns Monday, so we test the cache path
    // For a proper non-Monday test, we check the isMonday prop
    const { container } = render(<WeeklyDigest forceShow={false} todayOverride="2026-03-25" />);
    // When todayOverride is a Wednesday and no cache exists, should not render
    expect(screen.queryByTestId('weekly-digest')).not.toBeInTheDocument();
  });

  it('shows on non-Monday when cache exists for previous week', () => {
    // 2026-03-25 is Wednesday, prevWeekStart = 2026-03-16
    mockIDBStores['weekly-digest-cache'] = {
      weekStart: '2026-03-16',
      text: 'This week summary.',
      stats: {},
    };
    render(<WeeklyDigest todayOverride="2026-03-25" />);
    expect(screen.getByTestId('weekly-digest')).toBeInTheDocument();
  });

  it('shows spending as $0 when no transactions', () => {
    render(<WeeklyDigest />);
    expect(screen.getByTestId('stat-spending')).toHaveTextContent('$0');
  });

  it('shows 0 for all stats when data is empty', () => {
    render(<WeeklyDigest />);
    expect(screen.getByTestId('stat-tasks')).toHaveTextContent('0');
    expect(screen.getByTestId('stat-spending')).toHaveTextContent('$0');
    expect(screen.getByTestId('stat-streak')).toHaveTextContent('0');
  });
});
