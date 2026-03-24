import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { Dashboard } from './Dashboard';

vi.mock('../../hooks/useGemini', () => ({
  useGemini: () => ({
    generate: vi.fn(),
    loading: false,
    error: null,
    hasKey: false,
  }),
}));

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
