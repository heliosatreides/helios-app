import { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ScoresTab } from './ScoresTab';
import { StandingsTab } from './StandingsTab';
import { FavoritesTab } from './FavoritesTab';
import { useSportsScores } from '../../hooks/useSportsScores';
import { PageHeader, TabBar } from '../../components/ui';

const TABS = [
  { id: 'scores', label: 'Scores' },
  { id: 'standings', label: 'Standings' },
  { id: 'favorites', label: 'Favorites' },
];

function useAllGames() {
  const nba = useSportsScores('NBA');
  const nfl = useSportsScores('NFL');
  const mlb = useSportsScores('MLB');
  const nhl = useSportsScores('NHL');
  const mls = useSportsScores('MLS');
  return { NBA: nba.games, NFL: nfl.games, MLB: mlb.games, NHL: nhl.games, MLS: mls.games };
}

const TAB_IDS = TABS.map(t => t.id);

export function SportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab = TAB_IDS.includes(tabParam) ? tabParam : 'scores';
  const setActiveTab = useCallback((tab) => {
    setSearchParams(tab === 'scores' ? {} : { tab }, { replace: true });
  }, [setSearchParams]);
  const [activeSport, setActiveSport] = useState('NBA');
  const allGames = useAllGames();

  return (
    <div className="space-y-6">
      <PageHeader title="Sports Hub" subtitle="Live scores, standings, and your favorites" />

      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'scores' && <ScoresTab activeSport={activeSport} onSportChange={setActiveSport} />}
      {activeTab === 'standings' && <StandingsTab sport={activeSport} />}
      {activeTab === 'favorites' && <FavoritesTab allGames={allGames} />}
    </div>
  );
}
