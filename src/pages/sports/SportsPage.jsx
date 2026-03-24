import { useState } from 'react';
import { ScoresTab } from './ScoresTab';
import { StandingsTab } from './StandingsTab';
import { FavoritesTab } from './FavoritesTab';
import { useSportsScores } from '../../hooks/useSportsScores';

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

export function SportsPage() {
  const [activeTab, setActiveTab] = useState('scores');
  const [activeSport, setActiveSport] = useState('NBA');
  const allGames = useAllGames();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Sports Hub</h1>
        <p className="text-muted-foreground text-sm">Live scores, standings, and your favorites</p>
      </div>

      <div className="flex gap-1 border border-border p-1 w-fit">
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'scores' && <ScoresTab activeSport={activeSport} onSportChange={setActiveSport} />}
      {activeTab === 'standings' && <StandingsTab sport={activeSport} />}
      {activeTab === 'favorites' && <FavoritesTab allGames={allGames} />}
    </div>
  );
}
