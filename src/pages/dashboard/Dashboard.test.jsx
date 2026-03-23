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
