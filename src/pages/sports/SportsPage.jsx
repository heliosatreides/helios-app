import { useState } from 'react';
import { ScoresTab } from './ScoresTab';
import { StandingsTab } from './StandingsTab';
import { FavoritesTab } from './FavoritesTab';
import { useSportsScores } from '../../hooks/useSportsScores';

const TABS = [
  { id: 'scores', label: '📊 Scores' },
  { id: 'standings', label: '🏅 Standings' },
  { id: 'favorites', label: '⭐ Favorites' },
];

function useAllGames() {
  const nba = useSportsScores('NBA');
  const nfl = useSportsScores('NFL');
  const mlb = useSportsScores('MLB');
  const nhl = useSportsScores('NHL');
  const mls = useSportsScores('MLS');

  return {
    NBA: nba.games,
    NFL: nfl.games,
    MLB: mlb.games,
    NHL: nhl.games,
    MLS: mls.games,
  };
}

export function SportsPage() {
  const [activeTab, setActiveTab] = useState('scores');
  const [activeSport, setActiveSport] = useState('NBA');
  const allGames = useAllGames();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#e4e4e7]">Sports Hub</h1>
        <p className="text-[#52525b] text-sm mt-0.5">Live scores, standings, and your favorites</p>
      </div>

      {/* Segmented tabs */}
      <div className="flex gap-1 bg-[#0a0a0b] border border-[#1c1c20] rounded-xl p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'text-[#52525b] hover:text-[#a1a1aa] border border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'scores' && (
        <ScoresTab activeSport={activeSport} onSportChange={setActiveSport} />
      )}
      {activeTab === 'standings' && (
        <StandingsTab sport={activeSport} />
      )}
      {activeTab === 'favorites' && (
        <FavoritesTab allGames={allGames} />
      )}
    </div>
  );
}
