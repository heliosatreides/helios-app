import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { Dashboard } from './Dashboard';

const mockGenerate = vi.fn();
let mockHasKey = false;

vi.mock('../../hooks/useGemini', () => ({
  useGemini: () => ({
    generate: mockGenerate,
    loading: false,
    error: null,
    hasKey: mockHasKey,
  }),
}));

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

beforeEach(() => {
  mockGenerate.mockReset();
  mockHasKey = false;
  for (const k in lsStore) delete lsStore[k];
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

test('Dashboard renders page header', () => {
  render(
    <MemoryRouter>
      <Dashboard trips={mockTrips} />
    </MemoryRouter>
  );
  expect(screen.getByText('Dashboard')).toBeInTheDocument();
});

test('Dashboard shows upcoming trips stat', () => {
  render(
    <MemoryRouter>
      <Dashboard trips={mockTrips} />
    </MemoryRouter>
  );
  expect(screen.getByText(/upcoming trips/i)).toBeInTheDocument();
});

test('Dashboard shows budget info in stat card', () => {
  render(
    <MemoryRouter>
      <Dashboard trips={mockTrips} />
    </MemoryRouter>
  );
  // Budget appears as sub-text under Upcoming Trips
  expect(screen.getByText(/\$5,800 budget/i)).toBeInTheDocument();
});

test('Dashboard shows recent trips', () => {
  render(
    <MemoryRouter>
      <Dashboard trips={mockTrips} />
    </MemoryRouter>
  );
  expect(screen.getByText('Tokyo Adventure')).toBeInTheDocument();
});

test('Dashboard shows portfolio stat when portfolio has holdings', () => {
  const portfolio = [
    { id: '1', ticker: 'AAPL', shares: 10, costBasis: 150, currentPrice: 200, assetClass: 'Stocks' },
  ];
  render(
    <MemoryRouter>
      <Dashboard trips={[]} portfolio={portfolio} />
    </MemoryRouter>
  );
  expect(screen.getByText(/portfolio/i)).toBeInTheDocument();
});

test('Dashboard shows empty state when no data', () => {
  render(
    <MemoryRouter>
      <Dashboard trips={[]} portfolio={[]} accounts={[]} />
    </MemoryRouter>
  );
  expect(screen.getByText(/Welcome to Helios/i)).toBeInTheDocument();
});

test('Dashboard empty state renders feature discovery cards', () => {
  render(
    <MemoryRouter>
      <Dashboard trips={[]} portfolio={[]} accounts={[]} />
    </MemoryRouter>
  );
  const cards = screen.getAllByTestId('feature-card');
  expect(cards.length).toBeGreaterThanOrEqual(6);
});

test('Dashboard feature cards link to correct routes', () => {
  render(
    <MemoryRouter>
      <Dashboard trips={[]} portfolio={[]} accounts={[]} />
    </MemoryRouter>
  );
  const cards = screen.getAllByTestId('feature-card');
  const hrefs = cards.map((card) => card.getAttribute('href'));
  expect(hrefs).toContain('/planner');
  expect(hrefs).toContain('/finance');
  expect(hrefs).toContain('/goals');
  expect(hrefs).toContain('/flashcards');
  expect(hrefs).toContain('/networking');
});

test('Dashboard empty state shows privacy note', () => {
  render(
    <MemoryRouter>
      <Dashboard trips={[]} portfolio={[]} accounts={[]} />
    </MemoryRouter>
  );
  expect(screen.getByText(/all data stays on your device/i)).toBeInTheDocument();
});

test('Dashboard empty state shows subtitle', () => {
  render(
    <MemoryRouter>
      <Dashboard trips={[]} portfolio={[]} accounts={[]} />
    </MemoryRouter>
  );
  expect(screen.getByText(/27 features/i)).toBeInTheDocument();
});

// --- Gemini nudge tests ---

test('Gemini nudge shows when hasKey=false and dashboard has data', () => {
  mockHasKey = false;
  render(
    <MemoryRouter>
      <Dashboard trips={mockTrips} accounts={[{ id: '1', name: 'Checking', balance: 1000 }]} />
    </MemoryRouter>
  );
  expect(screen.getByTestId('ai-nudge')).toBeInTheDocument();
  expect(screen.getByText(/Unlock AI features/)).toBeInTheDocument();
  expect(screen.getByText('Setup').closest('a')).toHaveAttribute('href', '/settings');
});

test('Gemini nudge does NOT show when hasKey=true', () => {
  mockHasKey = true;
  render(
    <MemoryRouter>
      <Dashboard trips={mockTrips} accounts={[{ id: '1', name: 'Checking', balance: 1000 }]} />
    </MemoryRouter>
  );
  expect(screen.queryByTestId('ai-nudge')).not.toBeInTheDocument();
});

test('Gemini nudge does NOT show on empty dashboard', () => {
  mockHasKey = false;
  render(
    <MemoryRouter>
      <Dashboard trips={[]} portfolio={[]} accounts={[]} />
    </MemoryRouter>
  );
  expect(screen.queryByTestId('ai-nudge')).not.toBeInTheDocument();
});

test('Gemini nudge dismiss button hides it and persists to localStorage', async () => {
  mockHasKey = false;
  const { act } = await import('react');
  render(
    <MemoryRouter>
      <Dashboard trips={mockTrips} accounts={[{ id: '1', name: 'Checking', balance: 1000 }]} />
    </MemoryRouter>
  );
  expect(screen.getByTestId('ai-nudge')).toBeInTheDocument();
  const dismissBtn = screen.getByLabelText('Dismiss AI nudge');
  await act(() => { dismissBtn.click(); });
  expect(screen.queryByTestId('ai-nudge')).not.toBeInTheDocument();
  expect(localStorage.getItem('helios-ai-nudge-dismissed')).toBe('1');
});

// --- Sports card conditional tests ---

test('Sports card renders when sportsGameCount is provided', () => {
  render(
    <MemoryRouter>
      <Dashboard trips={mockTrips} sportsGameCount={5} />
    </MemoryRouter>
  );
  expect(screen.getByTestId('sports-card')).toBeInTheDocument();
  expect(screen.getByText('5')).toBeInTheDocument();
});

test('Sports card does NOT render when sportsGameCount is null', () => {
  render(
    <MemoryRouter>
      <Dashboard trips={mockTrips} sportsGameCount={null} />
    </MemoryRouter>
  );
  expect(screen.queryByTestId('sports-card')).not.toBeInTheDocument();
});

test('Morning brief auto-generates when no cache exists', async () => {
  mockHasKey = true;
  mockGenerate.mockResolvedValue('Your morning brief text here.');
  render(
    <MemoryRouter>
      <Dashboard trips={mockTrips} accounts={[{ id: '1', name: 'Checking', balance: 1000 }]} />
    </MemoryRouter>
  );
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
  globalThis.__idbStore['daily-brief'] = { date: todayStr, text: 'Cached brief for today.' };
  render(
    <MemoryRouter>
      <Dashboard trips={mockTrips} accounts={[{ id: '1', name: 'Checking', balance: 1000 }]} />
    </MemoryRouter>
  );
  await waitFor(() => {
    expect(screen.getByTestId('morning-brief')).toBeInTheDocument();
    expect(screen.getByText('Cached brief for today.')).toBeInTheDocument();
  });
  expect(mockGenerate).not.toHaveBeenCalled();
});

test('Morning brief does not show on empty dashboard', () => {
  mockHasKey = true;
  render(
    <MemoryRouter>
      <Dashboard trips={[]} portfolio={[]} accounts={[]} />
    </MemoryRouter>
  );
  expect(screen.queryByTestId('morning-brief')).not.toBeInTheDocument();
});
