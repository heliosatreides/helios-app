import { useState, useEffect, useCallback } from 'react';

const STANDINGS_URLS = {
  NBA: 'https://site.api.espn.com/apis/v2/sports/basketball/nba/standings',
};

export function transformStandings(data) {
  const children = data?.children ?? [];
  const conferences = children.map((conf) => {
    const confName = conf.name ?? conf.abbreviation ?? 'Conference';
    const entries = (conf.standings?.entries ?? []).map((entry) => {
      const team = entry.team ?? {};
      const stats = entry.stats ?? [];
      const getStat = (name) => stats.find((s) => s.name === name)?.value ?? null;
      const getStatStr = (name) => stats.find((s) => s.name === name)?.displayValue ?? '';

      const wins = getStat('wins') ?? getStat('w') ?? 0;
      const losses = getStat('losses') ?? getStat('l') ?? 0;
      const winPct = getStat('winPercent') ?? getStat('winpercent') ?? (wins + losses > 0 ? wins / (wins + losses) : 0);

      return {
        teamId: team.id,
        teamName: team.displayName ?? team.name ?? '',
        teamAbbr: team.abbreviation ?? '',
        logo: team.logos?.[0]?.href ?? team.logo ?? '',
        wins: Math.round(wins),
        losses: Math.round(losses),
        winPct: typeof winPct === 'number' ? winPct : parseFloat(winPct) || 0,
        winPctDisplay: getStatStr('winPercent') || getStatStr('winpercent') || (winPct ? winPct.toFixed(3) : '.000'),
      };
    });
    return { name: confName, teams: entries };
  });
  return conferences;
}

export function useStandings(sport) {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStandings = useCallback(async () => {
    const url = STANDINGS_URLS[sport];
    if (!url) {
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStandings(transformStandings(data));
    } catch (err) {
      setError(err.message || 'Failed to fetch standings');
    } finally {
      setLoading(false);
    }
  }, [sport]);

  useEffect(() => {
    setLoading(true);
    setStandings([]);
    fetchStandings();
  }, [fetchStandings]);

  return { standings, loading, error };
}
