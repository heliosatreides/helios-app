/**
 * AI Integration Tests
 * Tests for Gemini AI features added to:
 * - TripDetail (Build Full Itinerary)
 * - BudgetView (Find Savings)
 * - Portfolio (Assess Risk)
 * - ScoreCard (Game Preview)
 * - Dashboard (Weekly Digest)
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockGenerate = vi.fn();

vi.mock('../hooks/useGemini', () => ({
  useGemini: () => ({
    generate: mockGenerate,
    loading: false,
    error: null,
    hasKey: true,
  }),
}));

vi.mock('../hooks/useTasks', () => ({
  useTasks: () => ({ tasks: [], setTasks: vi.fn() }),
  groupTasks: () => ({ overdue: [], today: [], upcoming: [], someday: [] }),
  getTodayStr: () => new Date().toISOString().slice(0, 10),
}));

vi.mock('../hooks/useTodaySchedule', () => ({
  useTodaySchedule: () => ({ schedule: [] }),
}));

vi.mock('../hooks/useStockQuote', () => ({
  useStockQuote: () => ({ fetchQuote: vi.fn(), loading: false }),
}));

vi.mock('../hooks/useStockSearch', () => ({
  useStockSearch: () => ({ validate: vi.fn(), loading: false }),
}));

vi.mock('../hooks/useIDB', () => ({
  useIDB: (key, initial) => [initial, vi.fn()],
}));

// ─── Import components ────────────────────────────────────────────────────────

import { TripDetail } from './trips/TripDetail';
import { BudgetView } from './finance/BudgetView';
import { Portfolio } from './investments/Portfolio';
import { ScoreCard } from './sports/ScoreCard';
import { Dashboard } from './dashboard/Dashboard';

// ─── Test data ────────────────────────────────────────────────────────────────

const trip = {
  id: 'trip-1',
  name: 'Tokyo Adventure',
  destination: 'Tokyo, Japan',
  startDate: '2026-04-01',
  endDate: '2026-04-03',
  budget: 5000,
  status: 'Upcoming',
  itinerary: [],
  expenses: [],
  notes: '',
};

const mockBudgets = [
  { category: 'Food', limit: 500 },
  { category: 'Transport', limit: 150 },
];

const mockTransactions = [
  { id: 't1', amount: 300, category: 'Food', type: 'expense', date: '2026-03-05' },
  { id: 't2', amount: 100, category: 'Transport', type: 'expense', date: '2026-03-10' },
];

const scheduledGame = {
  id: 'g1',
  name: 'Lakers at Pistons',
  sport: 'NBA',
  date: '2026-03-23T23:00Z',
  status: 'Scheduled',
  homeTeam: { displayName: 'Detroit Pistons', logo: '', score: '0' },
  awayTeam: { displayName: 'Los Angeles Lakers', logo: '', score: '0' },
};

function renderTripDetail() {
  return render(
    <MemoryRouter initialEntries={['/trips/trip-1']}>
      <Routes>
        <Route path="/trips/:id" element={<TripDetail trips={[trip]} onUpdate={vi.fn()} />} />
      </Routes>
    </MemoryRouter>
  );
}

// ─── TripDetail: Build Full Itinerary ─────────────────────────────────────────

describe('TripDetail - Build Full Itinerary', () => {
  beforeEach(() => {
    mockGenerate.mockReset();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('shows the Build Full Itinerary button when hasKey and dates are set', () => {
    renderTripDetail();
    expect(screen.getByTestId('build-itinerary-btn')).toBeInTheDocument();
    expect(screen.getByText(/Build Full Itinerary/i)).toBeInTheDocument();
  });

  it('sends correct prompt with destination and dates', async () => {
    mockGenerate.mockResolvedValue('Day 1 (Wed Apr 1): Visit Tokyo Tower - Great views.');
    renderTripDetail();
    fireEvent.click(screen.getByTestId('build-itinerary-btn'));
    await waitFor(() => expect(mockGenerate).toHaveBeenCalled());
    const prompt = mockGenerate.mock.calls[0][0];
    expect(prompt).toContain('Tokyo, Japan');
    expect(prompt).toContain('2026-04-01');
    expect(prompt).toContain('2026-04-03');
    expect(prompt).toContain('day-by-day travel itinerary');
  });

  it('shows confirm dialog before building itinerary', async () => {
    mockGenerate.mockResolvedValue('Day 1 (Wed Apr 1): Visit shrine - Peaceful.');
    renderTripDetail();
    fireEvent.click(screen.getByTestId('build-itinerary-btn'));
    expect(window.confirm).toHaveBeenCalledWith('This will add AI-suggested activities. Continue?');
  });

  it('does not call generate if user cancels confirm', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderTripDetail();
    fireEvent.click(screen.getByTestId('build-itinerary-btn'));
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it('shows AI itinerary generated card after success', async () => {
    mockGenerate.mockResolvedValue('Day 1 (Wed Apr 1):\n- Visit Tokyo Tower - Amazing view\n- Try ramen - Delicious');
    renderTripDetail();
    fireEvent.click(screen.getByTestId('build-itinerary-btn'));
    await waitFor(() => expect(screen.getByText(/AI Itinerary Generated/i)).toBeInTheDocument());
  });
});

// ─── BudgetView: Find Savings ─────────────────────────────────────────────────

describe('BudgetView - Find Savings', () => {
  beforeEach(() => mockGenerate.mockReset());

  it('shows Find Savings button when hasKey', () => {
    render(<BudgetView budgets={mockBudgets} transactions={mockTransactions} month="2026-03" />);
    expect(screen.getByTestId('find-savings-btn')).toBeInTheDocument();
  });

  it('sends prompt with category spending totals only', async () => {
    mockGenerate.mockResolvedValue('1. Cook at home more. 2. Use public transit. 3. Cancel subscriptions.');
    render(<BudgetView budgets={mockBudgets} transactions={mockTransactions} month="2026-03" />);
    fireEvent.click(screen.getByTestId('find-savings-btn'));
    await waitFor(() => expect(mockGenerate).toHaveBeenCalled());
    const prompt = mockGenerate.mock.calls[0][0];
    expect(prompt).toContain('monthly spending totals by category');
    expect(prompt).toContain('Food');
    expect(prompt).toContain('Transport');
    expect(prompt).toContain('Suggest 3 specific ways');
  });

  it('shows savings suggestion card after success', async () => {
    mockGenerate.mockResolvedValue('Cook more at home to save $100/month.');
    render(<BudgetView budgets={mockBudgets} transactions={mockTransactions} month="2026-03" />);
    fireEvent.click(screen.getByTestId('find-savings-btn'));
    await waitFor(() => expect(screen.getByTestId('savings-card')).toBeInTheDocument());
    expect(screen.getByText(/Cook more at home/i)).toBeInTheDocument();
  });

  it('dismisses savings card when Dismiss is clicked', async () => {
    mockGenerate.mockResolvedValue('Switch to cheaper phone plan.');
    render(<BudgetView budgets={mockBudgets} transactions={mockTransactions} month="2026-03" />);
    fireEvent.click(screen.getByTestId('find-savings-btn'));
    await waitFor(() => expect(screen.getByTestId('savings-card')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Dismiss'));
    expect(screen.queryByTestId('savings-card')).not.toBeInTheDocument();
  });
});

// ─── Portfolio: Assess Risk ────────────────────────────────────────────────────

const mockHoldings = [
  { id: 'h1', ticker: 'AAPL', name: 'Apple', shares: 10, costBasis: 150, currentPrice: 200, assetClass: 'Stocks' },
  { id: 'h2', ticker: 'MSFT', name: 'Microsoft', shares: 5, costBasis: 200, currentPrice: 420, assetClass: 'Stocks' },
];

vi.mock('../hooks/useIDB', () => ({
  useIDB: (key) => {
    if (key === 'investments-portfolio') return [mockHoldings, vi.fn()];
    return [[], vi.fn()];
  },
}));

describe('Portfolio - Assess Risk', () => {
  beforeEach(() => mockGenerate.mockReset());

  it('shows Assess Risk button when hasKey', () => {
    render(<Portfolio />);
    expect(screen.getByTestId('assess-risk-btn')).toBeInTheDocument();
  });

  it('sends prompt with ticker and allocation percentages', async () => {
    mockGenerate.mockResolvedValue('Your portfolio is Aggressive with high tech concentration.');
    render(<Portfolio />);
    fireEvent.click(screen.getByTestId('assess-risk-btn'));
    await waitFor(() => expect(mockGenerate).toHaveBeenCalled());
    const prompt = mockGenerate.mock.calls[0][0];
    expect(prompt).toContain('AAPL');
    expect(prompt).toContain('MSFT');
    expect(prompt).toContain('%');
    expect(prompt).toContain('concentration risks');
    expect(prompt).toContain('Conservative/Moderate/Aggressive');
  });

  it('shows risk assessment card after success', async () => {
    mockGenerate.mockResolvedValue('Moderate risk. Consider diversification.');
    render(<Portfolio />);
    fireEvent.click(screen.getByTestId('assess-risk-btn'));
    await waitFor(() => expect(screen.getByTestId('risk-card')).toBeInTheDocument());
    expect(screen.getByText(/Moderate risk/i)).toBeInTheDocument();
  });
});

// ─── ScoreCard: Game Preview ───────────────────────────────────────────────────

describe('ScoreCard - Game Preview', () => {
  beforeEach(() => mockGenerate.mockReset());

  it('shows Game Preview button for scheduled games when hasKey', () => {
    render(<ScoreCard game={scheduledGame} />);
    expect(screen.getByTestId('game-preview-btn')).toBeInTheDocument();
  });

  it('does NOT show Game Preview button for live games', () => {
    render(<ScoreCard game={{ ...scheduledGame, status: 'In Progress' }} />);
    expect(screen.queryByTestId('game-preview-btn')).not.toBeInTheDocument();
  });

  it('sends prompt with sport, teams and date', async () => {
    mockGenerate.mockResolvedValue('The Lakers visit the Pistons in a must-win game. Lakers should prevail.');
    render(<ScoreCard game={scheduledGame} />);
    fireEvent.click(screen.getByTestId('game-preview-btn'));
    await waitFor(() => expect(mockGenerate).toHaveBeenCalled());
    const prompt = mockGenerate.mock.calls[0][0];
    expect(prompt).toContain('NBA');
    expect(prompt).toContain('Los Angeles Lakers');
    expect(prompt).toContain('Detroit Pistons');
    expect(prompt).toContain('preview');
  });

  it('shows preview card with result after success', async () => {
    mockGenerate.mockResolvedValue('Lakers favored in this matchup.');
    render(<ScoreCard game={scheduledGame} />);
    fireEvent.click(screen.getByTestId('game-preview-btn'));
    await waitFor(() => expect(screen.getByTestId('game-preview-card')).toBeInTheDocument());
    expect(screen.getByText(/Lakers favored/i)).toBeInTheDocument();
  });
});

// ─── Dashboard: Weekly Digest ─────────────────────────────────────────────────

describe('Dashboard - Weekly Digest', () => {
  beforeEach(() => mockGenerate.mockReset());

  it('shows Weekly Digest button when hasKey', () => {
    render(
      <MemoryRouter>
        <Dashboard trips={[trip]} />
      </MemoryRouter>
    );
    expect(screen.getByTestId('weekly-digest-btn')).toBeInTheDocument();
  });

  it('sends prompt with summary stats', async () => {
    mockGenerate.mockResolvedValue('You have 1 trip coming up, spending is on track.');
    render(
      <MemoryRouter>
        <Dashboard trips={[trip]} transactions={mockTransactions} budgets={mockBudgets} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByTestId('weekly-digest-btn'));
    await waitFor(() => expect(mockGenerate).toHaveBeenCalled());
    const prompt = mockGenerate.mock.calls[0][0];
    expect(prompt).toContain('upcoming trips');
    expect(prompt).toContain('weekly digest');
  });

  it('shows digest card with result after success', async () => {
    mockGenerate.mockResolvedValue('Your week looks productive with 1 upcoming trip!');
    render(
      <MemoryRouter>
        <Dashboard trips={[trip]} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByTestId('weekly-digest-btn'));
    await waitFor(() => expect(screen.getByTestId('digest-card')).toBeInTheDocument());
    expect(screen.getByText(/Your week looks productive/i)).toBeInTheDocument();
  });

  it('hides digest button once digest is shown', async () => {
    mockGenerate.mockResolvedValue('Great week ahead!');
    render(
      <MemoryRouter>
        <Dashboard trips={[trip]} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByTestId('weekly-digest-btn'));
    await waitFor(() => expect(screen.getByTestId('digest-card')).toBeInTheDocument());
    expect(screen.queryByTestId('weekly-digest-btn')).not.toBeInTheDocument();
  });

  it('dismisses digest card when Dismiss clicked', async () => {
    mockGenerate.mockResolvedValue('All good this week!');
    render(
      <MemoryRouter>
        <Dashboard trips={[trip]} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByTestId('weekly-digest-btn'));
    await waitFor(() => screen.getByTestId('digest-card'));
    fireEvent.click(screen.getByText('Dismiss'));
    expect(screen.queryByTestId('digest-card')).not.toBeInTheDocument();
  });
});
