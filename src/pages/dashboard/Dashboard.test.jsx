import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Dashboard } from './Dashboard';

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

test('Dashboard renders welcome card', () => {
  render(
    <MemoryRouter>
      <Dashboard trips={mockTrips} />
    </MemoryRouter>
  );
  expect(screen.getByText(/welcome/i)).toBeInTheDocument();
});

test('Dashboard shows upcoming trips stat', () => {
  render(
    <MemoryRouter>
      <Dashboard trips={mockTrips} />
    </MemoryRouter>
  );
  expect(screen.getByText(/upcoming trips/i)).toBeInTheDocument();
});

test('Dashboard shows total budget', () => {
  render(
    <MemoryRouter>
      <Dashboard trips={mockTrips} />
    </MemoryRouter>
  );
  expect(screen.getByText(/total budget/i)).toBeInTheDocument();
});

test('Dashboard shows recent trips', () => {
  render(
    <MemoryRouter>
      <Dashboard trips={mockTrips} />
    </MemoryRouter>
  );
  expect(screen.getByText('Tokyo Adventure')).toBeInTheDocument();
});

test('Dashboard shows investment summary card when portfolio has holdings', () => {
  const portfolio = [
    { id: '1', ticker: 'AAPL', shares: 10, costBasis: 150, currentPrice: 200, assetClass: 'Stocks' },
  ];
  render(
    <MemoryRouter>
      <Dashboard trips={[]} portfolio={portfolio} />
    </MemoryRouter>
  );
  expect(screen.getByText(/investment portfolio/i)).toBeInTheDocument();
  expect(screen.getByText(/total value/i)).toBeInTheDocument();
  expect(screen.getByText(/total gain\/loss/i)).toBeInTheDocument();
});

test('Dashboard hides investment card when portfolio is empty', () => {
  render(
    <MemoryRouter>
      <Dashboard trips={[]} portfolio={[]} />
    </MemoryRouter>
  );
  expect(screen.queryByText(/investment portfolio/i)).not.toBeInTheDocument();
});
