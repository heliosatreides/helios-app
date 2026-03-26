import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

const mockGenerate = vi.fn();
let mockHasKey = false;

// Configurable IDB store — tests set data here before rendering
const idbStore = {};

vi.mock('../../hooks/useIDB', () => ({
  useIDB: (key, initial) => {
    const data = key in idbStore ? idbStore[key] : initial;
    return [data, vi.fn(), true]; // always ready
  },
}));

vi.mock('../../hooks/useGemini', () => ({
  useGemini: () => ({
    generate: mockGenerate,
    loading: false,
    error: null,
    hasKey: mockHasKey,
  }),
}));

// Must import Dashboard after mocks
const { Dashboard } = await import('./Dashboard');

const lsStore = {};
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: (key) => lsStore[key] ?? null,
    setItem: (key, value) => { lsStore[key] = String(value); },
    removeItem: (key) => { delete lsStore[key]; },
    clear: () => { for (const k in lsStore) delete lsStore[k]; },
  },
  writable: true,
  configurable: true,
});

/** Helper: set IDB store data for Dashboard tests */
function setIDB({ trips = [], accounts = [], transactions = [], budgets = [], portfolio = [] } = {}) {
  idbStore['helios-trips'] = trips;
  idbStore['finance-accounts'] = accounts;
  idbStore['finance-transactions'] = transactions;
  idbStore['finance-budgets'] = budgets;
  idbStore['investments-portfolio'] = portfolio;
}

beforeEach(() => {
  mockGenerate.mockReset();
  mockHasKey = false;
  for (const k in lsStore) delete lsStore[k];
  // Clear IDB store
  for (const k in idbStore) delete idbStore[k];
});

const mockTrips = [
  {
    id: '1',
    name: 'Tokyo Adventure',
    destination: 'Tokyo, Japan',
    startDate: '2026-04-01',
    endDate: '2026-04-14',
    budget: 5000,
    status: 'Upcoming',
    itinerary: [],
    expenses: [],
    notes: '',
  },
  {
    id: '2',
    name: 'Weekend Getaway',
    destination: 'Napa Valley',
    startDate: '2026-03-25',
    endDate: '2026-03-27',
    budget: 800,
    status: 'Planning',
    itinerary: [],
    expenses: [],
    notes: '',
  },
];

const mockAcct = [{ id: '1', name: 'Checking', balance: 1000 }];

test('Dashboard renders page header', () => {
  setIDB({ trips: mockTrips });
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  expect(screen.getByText('Dashboard')).toBeInTheDocument();
});

test('Dashboard shows upcoming trips stat', () => {
  setIDB({ trips: mockTrips });
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  expect(screen.getByText(/upcoming trips/i)).toBeInTheDocument();
});

test('Dashboard shows budget info in stat card', () => {
  setIDB({ trips: mockTrips });
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  expect(screen.getByText(/\$5,800 budget/i)).toBeInTheDocument();
});

test('Dashboard shows recent trips', () => {
  setIDB({ trips: mockTrips });
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  expect(screen.getByText('Tokyo Adventure')).toBeInTheDocument();
});

test('Dashboard shows portfolio stat when portfolio has holdings', () => {
  const portfolio = [
    { id: '1', ticker: 'AAPL', shares: 10, costBasis: 150, currentPrice: 200, assetClass: 'Stocks' },
  ];
  setIDB({ portfolio });
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  expect(screen.getByText(/portfolio/i)).toBeInTheDocument();
});

test('Dashboard shows empty state when no data', () => {
  setIDB();
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  expect(screen.getByText(/Welcome to Helios/i)).toBeInTheDocument();
});

test('Dashboard empty state renders feature discovery cards', () => {
  setIDB();
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  const cards = screen.getAllByTestId('feature-card');
  expect(cards.length).toBeGreaterThanOrEqual(6);
});

test('Dashboard feature cards link to correct routes', () => {
  setIDB();
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  const cards = screen.getAllByTestId('feature-card');
  const hrefs = cards.map((card) => card.getAttribute('href'));
  expect(hrefs).toContain('/planner');
  expect(hrefs).toContain('/finance');
  expect(hrefs).toContain('/goals');
  expect(hrefs).toContain('/flashcards');
  expect(hrefs).toContain('/networking');
});

test('Dashboard empty state shows privacy note', () => {
  setIDB();
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  expect(screen.getByText(/all data stays on your device/i)).toBeInTheDocument();
});

test('Dashboard empty state shows subtitle', () => {
  setIDB();
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  expect(screen.getByText(/27 features/i)).toBeInTheDocument();
});

// --- Gemini nudge tests ---

test('Gemini nudge shows when hasKey=false and dashboard has data', () => {
  mockHasKey = false;
  setIDB({ trips: mockTrips, accounts: mockAcct });
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  expect(screen.getByTestId('ai-nudge')).toBeInTheDocument();
  expect(screen.getByText(/Unlock AI features/)).toBeInTheDocument();
  expect(screen.getByText('Setup').closest('a')).toHaveAttribute('href', '/settings');
});

test('Gemini nudge does NOT show when hasKey=true', () => {
  mockHasKey = true;
  setIDB({ trips: mockTrips, accounts: mockAcct });
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  expect(screen.queryByTestId('ai-nudge')).not.toBeInTheDocument();
});

test('Gemini nudge does NOT show on empty dashboard', () => {
  mockHasKey = false;
  setIDB();
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  expect(screen.queryByTestId('ai-nudge')).not.toBeInTheDocument();
});

test('Gemini nudge dismiss button hides it and persists to localStorage', async () => {
  mockHasKey = false;
  setIDB({ trips: mockTrips, accounts: mockAcct });
  const { act } = await import('react');
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  expect(screen.getByTestId('ai-nudge')).toBeInTheDocument();
  const dismissBtn = screen.getByLabelText('Dismiss AI nudge');
  await act(() => { dismissBtn.click(); });
  expect(screen.queryByTestId('ai-nudge')).not.toBeInTheDocument();
  expect(localStorage.getItem('helios-ai-nudge-dismissed')).toBe('1');
});

// --- Sports card conditional tests ---

test('Sports card renders when sportsGameCount is provided', () => {
  setIDB({ trips: mockTrips });
  render(<MemoryRouter><Dashboard sportsGameCount={5} /></MemoryRouter>);
  expect(screen.getByTestId('sports-card')).toBeInTheDocument();
  expect(screen.getByText('5')).toBeInTheDocument();
});

test('Sports card does NOT render when sportsGameCount is null', () => {
  setIDB({ trips: mockTrips });
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  expect(screen.queryByTestId('sports-card')).not.toBeInTheDocument();
});

test('Morning brief auto-generates when no cache exists', async () => {
  mockHasKey = true;
  mockGenerate.mockResolvedValue('Your morning brief text here.');
  setIDB({ trips: mockTrips, accounts: mockAcct });
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  await waitFor(() => {
    expect(mockGenerate).toHaveBeenCalledTimes(1);
  });
  await waitFor(() => {
    expect(screen.getByTestId('morning-brief')).toBeInTheDocument();
    expect(screen.getByText('Your morning brief text here.')).toBeInTheDocument();
  });
});

test('Morning brief uses cache when today brief exists', async () => {
  mockHasKey = true;
  const todayStr = new Date().toISOString().slice(0, 10);
  idbStore['daily-brief'] = { date: todayStr, text: 'Cached brief for today.' };
  setIDB({ trips: mockTrips, accounts: mockAcct });
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  await waitFor(() => {
    expect(screen.getByTestId('morning-brief')).toBeInTheDocument();
    expect(screen.getByText('Cached brief for today.')).toBeInTheDocument();
  });
  expect(mockGenerate).not.toHaveBeenCalled();
});

// BackupNudge tests
test('renders backup nudge after 3 days of use with data present', () => {
  const threeDaysAgo = new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0];
  lsStore['helios-first-use-date'] = threeDaysAgo;
  setIDB({ trips: mockTrips, accounts: mockAcct });
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  expect(screen.getByTestId('backup-nudge')).toBeInTheDocument();
  expect(screen.getByText(/back it up to stay safe/i)).toBeInTheDocument();
  expect(screen.getByText('Back up now')).toBeInTheDocument();
});

test('does not render backup nudge when dismissed', () => {
  const threeDaysAgo = new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0];
  lsStore['helios-first-use-date'] = threeDaysAgo;
  lsStore['helios-backup-nudge-dismissed'] = '1';
  setIDB({ trips: mockTrips, accounts: mockAcct });
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  expect(screen.queryByTestId('backup-nudge')).not.toBeInTheDocument();
});

test('does not render backup nudge when isEmpty is true', () => {
  const threeDaysAgo = new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0];
  lsStore['helios-first-use-date'] = threeDaysAgo;
  setIDB();
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  expect(screen.queryByTestId('backup-nudge')).not.toBeInTheDocument();
});

test('does not render backup nudge before 3 days', () => {
  const today = new Date().toISOString().split('T')[0];
  lsStore['helios-first-use-date'] = today;
  setIDB({ trips: mockTrips, accounts: mockAcct });
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  expect(screen.queryByTestId('backup-nudge')).not.toBeInTheDocument();
});

test('backup nudge dismiss button sets localStorage and hides card', () => {
  const threeDaysAgo = new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0];
  lsStore['helios-first-use-date'] = threeDaysAgo;
  setIDB({ trips: mockTrips, accounts: mockAcct });
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  expect(screen.getByTestId('backup-nudge')).toBeInTheDocument();
  fireEvent.click(screen.getByLabelText('Dismiss backup nudge'));
  expect(screen.queryByTestId('backup-nudge')).not.toBeInTheDocument();
  expect(lsStore['helios-backup-nudge-dismissed']).toBe('1');
});

// --- Quick Start onboarding tests (UX Critical #1) ---

test('Quick Start shows API key badge on AI Assistant when no key', () => {
  mockHasKey = false;
  setIDB();
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  expect(screen.getByTestId('api-key-badge')).toBeInTheDocument();
  expect(screen.getByText('API key required')).toBeInTheDocument();
});

test('Quick Start hides API key badge on AI Assistant when key exists', () => {
  mockHasKey = true;
  setIDB();
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  expect(screen.queryByTestId('api-key-badge')).not.toBeInTheDocument();
});

test('Quick Start orders Planner and Finance before AI Assistant', () => {
  mockHasKey = false;
  setIDB();
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  const cards = screen.getAllByTestId('feature-card');
  const titles = cards.map((c) => c.querySelector('.text-sm.font-medium').textContent);
  const plannerIdx = titles.indexOf('Plan Your Day');
  const financeIdx = titles.indexOf('Track Finances');
  const aiIdx = titles.indexOf('AI Assistant');
  expect(plannerIdx).toBeLessThan(aiIdx);
  expect(financeIdx).toBeLessThan(aiIdx);
});

test('Morning brief does not show on empty dashboard', () => {
  mockHasKey = true;
  setIDB();
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  expect(screen.queryByTestId('morning-brief')).not.toBeInTheDocument();
});
