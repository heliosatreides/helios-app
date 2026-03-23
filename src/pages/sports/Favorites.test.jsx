import { render, screen, fireEvent } from '@testing-library/react';
import { FavoritesTab } from './FavoritesTab';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

beforeEach(() => localStorageMock.clear());

const allGames = {
  NBA: [
    {
      id: '1',
      name: 'Lakers at Pistons',
      date: '2026-03-23T23:00Z',
      status: 'Scheduled',
      homeTeam: { displayName: 'Detroit Pistons', logo: '', score: '0' },
      awayTeam: { displayName: 'Los Angeles Lakers', logo: '', score: '0' },
    },
    {
      id: '2',
      name: 'Heat at Celtics',
      date: '2026-03-23T20:00Z',
      status: 'Final',
      homeTeam: { displayName: 'Boston Celtics', logo: '', score: '112' },
      awayTeam: { displayName: 'Miami Heat', logo: '', score: '105' },
    },
  ],
  NFL: [],
  MLB: [],
  NHL: [],
  MLS: [],
};

test('shows message when no favorites are set', () => {
  render(<FavoritesTab allGames={allGames} />);
  expect(screen.getByText(/no favorites/i)).toBeInTheDocument();
});

test('can add a favorite team', () => {
  render(<FavoritesTab allGames={allGames} />);
  // click to show picker
  const addBtn = screen.getByRole('button', { name: /add favorite/i });
  fireEvent.click(addBtn);
  // pick Lakers
  const lakers = screen.getByText('Los Angeles Lakers');
  fireEvent.click(lakers);
  // Lakers game should now appear
  expect(screen.getByText('Lakers at Pistons')).toBeInTheDocument();
});

test('can remove a favorite team', () => {
  render(<FavoritesTab allGames={allGames} />);
  const addBtn = screen.getByRole('button', { name: /add favorite/i });
  fireEvent.click(addBtn);
  fireEvent.click(screen.getByText('Los Angeles Lakers'));
  // game is showing
  expect(screen.getByText('Lakers at Pistons')).toBeInTheDocument();

  // remove Lakers
  const removeBtn = screen.getByRole('button', { name: /remove los angeles lakers/i });
  fireEvent.click(removeBtn);
  expect(screen.queryByText('Lakers at Pistons')).not.toBeInTheDocument();
});

test('filters games by favorite teams across sports', () => {
  render(<FavoritesTab allGames={allGames} />);
  const addBtn = screen.getByRole('button', { name: /add favorite/i });
  fireEvent.click(addBtn);
  // add Celtics, not Lakers
  fireEvent.click(screen.getByText('Boston Celtics'));

  // only Celtics game should appear
  expect(screen.getByText('Heat at Celtics')).toBeInTheDocument();
  expect(screen.queryByText('Lakers at Pistons')).not.toBeInTheDocument();
});
