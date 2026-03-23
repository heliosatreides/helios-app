import { useState, useEffect, useCallback } from 'react';

const SPORT_URLS = {
  NBA: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
  NFL: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
  MLB: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard',
  NHL: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard',
  MLS: 'https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard',
};

export function transformGames(data) {
  const events = data?.events ?? [];
  return events.map((event) => {
    const competition = event.competitions?.[0] ?? {};
    const statusDesc = competition.status?.type?.description ?? 'Scheduled';
    const competitors = competition.competitors ?? [];
    const home = competitors.find((c) => c.homeAway === 'home') ?? competitors[0] ?? {};
    const away = competitors.find((c) => c.homeAway === 'away') ?? competitors[1] ?? {};

    return {
      id: event.id,
      name: event.name,
      date: event.date,
      status: statusDesc,
      homeTeam: {
        displayName: home.team?.displayName ?? '',
        logo: home.team?.logo ?? '',
        score: home.score ?? '0',
      },
      awayTeam: {
        displayName: away.team?.displayName ?? '',
        logo: away.team?.logo ?? '',
        score: away.score ?? '0',
      },
    };
  });
}

export function useSportsScores(sport) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchScores = useCallback(async () => {
    const url = SPORT_URLS[sport];
    if (!url) return;
    try {
      setError(null);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setGames(transformGames(data));
    } catch (err) {
      setError(err.message || 'Failed to fetch scores');
    } finally {
      setLoading(false);
    }
  }, [sport]);

  useEffect(() => {
    setLoading(true);
    setGames([]);
    fetchScores();
    const interval = setInterval(fetchScores, 60_000);
    return () => clearInterval(interval);
  }, [fetchScores]);

  return { games, loading, error, refresh: fetchScores };
}
