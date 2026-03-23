import { useState, useEffect } from 'react';
import { ScoresTab } from './ScoresTab';
import { StandingsTab } from './StandingsTab';
import { FavoritesTab } from './FavoritesTab';
import { useSportsScores } from '../../hooks/useSportsScores';

const TABS = [
  { id: 'scores', label: 'Scores' },
  { id: 'standings', label: 'Standings' },
  { id: 'favorites', label: 'Favorites ⭐' },
];

const SPORTS = ['NBA', 'NFL', 'MLB', 'NHL', 'MLS'];

/**
 * Gather all games data for the Favorites tab.
 * We pre-load each sport silently so Favorites has data regardless of active sport.
 */
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
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#e4e4e7]">Sports Hub 🏆</h2>
        <p className="text-[#71717a] text-sm mt-1">Live scores, standings, and your favorites.</p>
      </div>

      {/* Main tabs */}
      <div className="flex gap-1 bg-[#111113] border border-[#27272a] rounded-xl p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-amber-500 text-black'
                : 'text-[#71717a] hover:text-[#e4e4e7]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
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
