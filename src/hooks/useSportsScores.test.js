import { renderHook, waitFor, act } from '@testing-library/react';
import { vi, beforeAll, beforeEach, afterEach, test, expect } from 'vitest';
import { useSportsScores, transformGames } from './useSportsScores';

// ---- mock fetch ----
const mockFetch = vi.fn();
beforeAll(() => {
  global.fetch = mockFetch;
});
beforeEach(() => {
  mockFetch.mockReset();
});

const sampleResponse = {
  events: [
    {
      id: '1',
      name: 'Lakers at Pistons',
      date: '2026-03-23T23:00Z',
      competitions: [
        {
          status: { type: { description: 'Scheduled' } },
          competitors: [
            {
              homeAway: 'home',
              score: '0',
              team: { displayName: 'Detroit Pistons', logo: 'https://example.com/pistons.png' },
            },
            {
              homeAway: 'away',
              score: '0',
              team: { displayName: 'Los Angeles Lakers', logo: 'https://example.com/lakers.png' },
            },
          ],
        },
      ],
    },
    {
      id: '2',
      name: 'Heat at Celtics',
      date: '2026-03-23T20:00Z',
      competitions: [
        {
          status: { type: { description: 'Final' } },
          competitors: [
            {
              homeAway: 'home',
              score: '112',
              team: { displayName: 'Boston Celtics', logo: 'https://example.com/celtics.png' },
            },
            {
              homeAway: 'away',
              score: '105',
              team: { displayName: 'Miami Heat', logo: 'https://example.com/heat.png' },
            },
          ],
        },
      ],
    },
  ],
};

// ---- transformGames unit tests ----

test('transformGames returns empty array for empty events', () => {
  expect(transformGames({})).toEqual([]);
  expect(transformGames({ events: [] })).toEqual([]);
});

test('transformGames extracts home and away teams correctly', () => {
  const games = transformGames(sampleResponse);
  expect(games).toHaveLength(2);

  expect(games[0].homeTeam.displayName).toBe('Detroit Pistons');
  expect(games[0].awayTeam.displayName).toBe('Los Angeles Lakers');
  expect(games[0].status).toBe('Scheduled');

  expect(games[1].homeTeam.displayName).toBe('Boston Celtics');
  expect(games[1].awayTeam.displayName).toBe('Miami Heat');
  expect(games[1].homeTeam.score).toBe('112');
  expect(games[1].status).toBe('Final');
});

test('transformGames includes logo URLs', () => {
  const games = transformGames(sampleResponse);
  expect(games[0].homeTeam.logo).toBe('https://example.com/pistons.png');
  expect(games[0].awayTeam.logo).toBe('https://example.com/lakers.png');
});

// ---- useSportsScores hook tests ----

test('useSportsScores starts in loading state', () => {
  // Return a promise that never resolves so we can inspect loading state
  mockFetch.mockImplementation(() => new Promise(() => {}));
  const { result } = renderHook(() => useSportsScores('NBA'));
  expect(result.current.loading).toBe(true);
  expect(result.current.games).toEqual([]);
});

test('useSportsScores returns games after successful fetch', async () => {
  mockFetch.mockResolvedValueOnce({ ok: true, json: async () => sampleResponse });
  const { result } = renderHook(() => useSportsScores('NBA'));

  await waitFor(() => expect(result.current.loading).toBe(false));

  expect(result.current.error).toBeNull();
  expect(result.current.games).toHaveLength(2);
  expect(result.current.games[0].name).toBe('Lakers at Pistons');
});

test('useSportsScores sets error on network failure', async () => {
  mockFetch.mockRejectedValueOnce(new Error('Network error'));
  const { result } = renderHook(() => useSportsScores('NBA'));

  await waitFor(() => expect(result.current.loading).toBe(false));

  expect(result.current.error).toBe('Network error');
  expect(result.current.games).toEqual([]);
});

test('useSportsScores sets error on non-ok HTTP response', async () => {
  mockFetch.mockResolvedValueOnce({ ok: false, status: 503 });
  const { result } = renderHook(() => useSportsScores('NBA'));

  await waitFor(() => expect(result.current.loading).toBe(false));

  expect(result.current.error).toBe('HTTP 503');
});

test('useSportsScores auto-refreshes after 60 seconds', async () => {
  vi.useFakeTimers();
  mockFetch.mockResolvedValue({ ok: true, json: async () => sampleResponse });

  const { result } = renderHook(() => useSportsScores('NBA'));

  await act(async () => {
    await Promise.resolve();
  });

  const callsBefore = mockFetch.mock.calls.length;
  expect(callsBefore).toBeGreaterThanOrEqual(1);

  await act(async () => {
    vi.advanceTimersByTime(60_000);
    await Promise.resolve();
  });

  expect(mockFetch.mock.calls.length).toBeGreaterThan(callsBefore);
  vi.useRealTimers();
});

test('useSportsScores resets games when sport changes', async () => {
  mockFetch.mockResolvedValue({ ok: true, json: async () => sampleResponse });
  const { result, rerender } = renderHook(({ sport }) => useSportsScores(sport), {
    initialProps: { sport: 'NBA' },
  });

  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.games).toHaveLength(2);

  rerender({ sport: 'NFL' });
  expect(result.current.games).toEqual([]);
});
