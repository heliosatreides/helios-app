import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TripList } from './TripList';
import { CreateTrip } from './CreateTrip';

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

// ─── TripList ─────────────────────────────────────────────────────────────────

test('TripList renders trip cards', () => {
  render(
    <MemoryRouter>
      <TripList trips={mockTrips} />
    </MemoryRouter>
  );
  expect(screen.getByText('Tokyo Adventure')).toBeInTheDocument();
  expect(screen.getByText('Weekend Getaway')).toBeInTheDocument();
});

test('TripList shows status badges', () => {
  render(
    <MemoryRouter>
      <TripList trips={mockTrips} />
    </MemoryRouter>
  );
  expect(screen.getByText('Upcoming')).toBeInTheDocument();
  expect(screen.getByText('Planning')).toBeInTheDocument();
});

test('TripList shows destination', () => {
  render(
    <MemoryRouter>
      <TripList trips={mockTrips} />
    </MemoryRouter>
  );
  expect(screen.getByText('Tokyo, Japan')).toBeInTheDocument();
});

test('TripList shows trip duration', () => {
  render(
    <MemoryRouter>
      <TripList trips={mockTrips} />
    </MemoryRouter>
  );
  // Tokyo trip: Apr 1-14 = 14 days
  expect(screen.getByText('· 14 days')).toBeInTheDocument();
  // Weekend trip: Mar 25-27 = 3 days
  expect(screen.getByText('· 3 days')).toBeInTheDocument();
});

test('TripList shows budget when set', () => {
  render(
    <MemoryRouter>
      <TripList trips={mockTrips} />
    </MemoryRouter>
  );
  expect(screen.getByText('$5,000')).toBeInTheDocument();
  expect(screen.getByText('$800')).toBeInTheDocument();
});

// ─── CreateTrip ───────────────────────────────────────────────────────────────

test('CreateTrip form renders required fields', () => {
  const onSubmit = vi.fn();
  render(
    <MemoryRouter>
      <CreateTrip onSubmit={onSubmit} />
    </MemoryRouter>
  );
  expect(screen.getByLabelText(/trip name/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/destination/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/budget/i)).toBeInTheDocument();
});

test('CreateTrip calls onSubmit with valid form data', () => {
  const onSubmit = vi.fn();
  render(
    <MemoryRouter>
      <CreateTrip onSubmit={onSubmit} />
    </MemoryRouter>
  );

  fireEvent.change(screen.getByLabelText(/trip name/i), { target: { value: 'Test Trip' } });
  fireEvent.change(screen.getByLabelText(/destination/i), { target: { value: 'Paris' } });
  fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: '2026-05-01' } });
  fireEvent.change(screen.getByLabelText(/end date/i), { target: { value: '2026-05-07' } });
  fireEvent.change(screen.getByLabelText(/budget/i), { target: { value: '2000' } });

  fireEvent.click(screen.getByRole('button', { name: /create trip/i }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
    name: 'Test Trip',
    destination: 'Paris',
    startDate: '2026-05-01',
    endDate: '2026-05-07',
    budget: 2000,
  }));
});

test('CreateTrip shows error when name is missing', () => {
  const onSubmit = vi.fn();
  render(
    <MemoryRouter>
      <CreateTrip onSubmit={onSubmit} />
    </MemoryRouter>
  );
  // Fill other fields but leave name empty
  fireEvent.change(screen.getByLabelText(/destination/i), { target: { value: 'Paris' } });
  fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: '2026-05-01' } });
  fireEvent.change(screen.getByLabelText(/end date/i), { target: { value: '2026-05-07' } });

  fireEvent.click(screen.getByRole('button', { name: /create trip/i }));
  expect(onSubmit).not.toHaveBeenCalled();
  expect(screen.getByText(/trip name is required/i)).toBeInTheDocument();
});

test('CreateTrip shows error when destination is missing', () => {
  const onSubmit = vi.fn();
  render(
    <MemoryRouter>
      <CreateTrip onSubmit={onSubmit} />
    </MemoryRouter>
  );
  fireEvent.change(screen.getByLabelText(/trip name/i), { target: { value: 'Test Trip' } });
  fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: '2026-05-01' } });
  fireEvent.change(screen.getByLabelText(/end date/i), { target: { value: '2026-05-07' } });

  fireEvent.click(screen.getByRole('button', { name: /create trip/i }));
  expect(onSubmit).not.toHaveBeenCalled();
  expect(screen.getByText(/destination is required/i)).toBeInTheDocument();
});

test('CreateTrip shows error when end date is before start date', () => {
  const onSubmit = vi.fn();
  render(
    <MemoryRouter>
      <CreateTrip onSubmit={onSubmit} />
    </MemoryRouter>
  );
  fireEvent.change(screen.getByLabelText(/trip name/i), { target: { value: 'Test Trip' } });
  fireEvent.change(screen.getByLabelText(/destination/i), { target: { value: 'Paris' } });
  fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: '2026-05-10' } });
  fireEvent.change(screen.getByLabelText(/end date/i), { target: { value: '2026-05-05' } });

  fireEvent.click(screen.getByRole('button', { name: /create trip/i }));
  expect(onSubmit).not.toHaveBeenCalled();
  expect(screen.getByText(/end date must be on or after start date/i)).toBeInTheDocument();
});

test('CreateTrip shows error when budget is negative', () => {
  const onSubmit = vi.fn();
  render(
    <MemoryRouter>
      <CreateTrip onSubmit={onSubmit} />
    </MemoryRouter>
  );
  fireEvent.change(screen.getByLabelText(/trip name/i), { target: { value: 'Test Trip' } });
  fireEvent.change(screen.getByLabelText(/destination/i), { target: { value: 'Paris' } });
  fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: '2026-05-01' } });
  fireEvent.change(screen.getByLabelText(/end date/i), { target: { value: '2026-05-07' } });
  fireEvent.change(screen.getByLabelText(/budget/i), { target: { value: '-100' } });

  fireEvent.click(screen.getByRole('button', { name: /create trip/i }));
  expect(onSubmit).not.toHaveBeenCalled();
  expect(screen.getByText(/budget must be a positive number/i)).toBeInTheDocument();
});

test('CreateTrip allows empty budget (optional)', () => {
  const onSubmit = vi.fn();
  render(
    <MemoryRouter>
      <CreateTrip onSubmit={onSubmit} />
    </MemoryRouter>
  );
  fireEvent.change(screen.getByLabelText(/trip name/i), { target: { value: 'Test Trip' } });
  fireEvent.change(screen.getByLabelText(/destination/i), { target: { value: 'Paris' } });
  fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: '2026-05-01' } });
  fireEvent.change(screen.getByLabelText(/end date/i), { target: { value: '2026-05-07' } });
  // budget left empty

  fireEvent.click(screen.getByRole('button', { name: /create trip/i }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
    name: 'Test Trip',
    budget: 0,
  }));
});
