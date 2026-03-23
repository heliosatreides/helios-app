import { useState } from 'react';
import { useIDB } from '../../hooks/useIDB';
import { ScoreCard } from './ScoreCard';

const SPORTS = ['NBA', 'NFL', 'MLB', 'NHL', 'MLS'];

/**
 * Collect all unique team names across all sports from allGames.
 */
function collectTeams(allGames) {
  const teams = [];
  for (const sport of SPORTS) {
    const games = allGames[sport] ?? [];
    for (const game of games) {
      const addTeam = (team) => {
        if (team.displayName && !teams.find((t) => t.name === team.displayName)) {
          teams.push({ name: team.displayName, sport });
        }
      };
      addTeam(game.homeTeam);
      addTeam(game.awayTeam);
    }
  }
  return teams;
}

/**
 * Filter games that feature at least one favorite team.
 */
function filterByFavorites(allGames, favorites) {
  const favSet = new Set(favorites);
  const result = [];
  for (const sport of SPORTS) {
    const games = allGames[sport] ?? [];
    for (const game of games) {
      if (favSet.has(game.homeTeam.displayName) || favSet.has(game.awayTeam.displayName)) {
        result.push({ ...game, sport });
      }
    }
  }
  return result;
}

export function FavoritesTab({ allGames }) {
  const [favorites, setFavorites] = useIDB('helios-sports-favorites', []);
  const [showPicker, setShowPicker] = useState(false);

  const teams = collectTeams(allGames);
  const favGames = filterByFavorites(allGames, favorites);

  const addFavorite = (teamName) => {
    if (!favorites.includes(teamName)) {
      setFavorites([...favorites, teamName]);
    }
    setShowPicker(false);
  };

  const removeFavorite = (teamName) => {
    setFavorites(favorites.filter((f) => f !== teamName));
  };

  return (
    <div className="space-y-4">
      {/* Favorites chips */}
      <div className="flex flex-wrap gap-2 items-center">
        {favorites.map((name) => (
          <span
            key={name}
            className="flex items-center gap-1.5 bg-[#27272a] text-[#e4e4e7] text-xs px-3 py-1.5 rounded-full"
          >
            {name}
            <button
              aria-label={`Remove ${name}`}
              onClick={() => removeFavorite(name)}
              className="text-[#71717a] hover:text-red-400 transition-colors ml-0.5"
            >
              ×
            </button>
          </span>
        ))}
        <button
          aria-label="Add favorite"
          onClick={() => setShowPicker((v) => !v)}
          className="text-xs px-3 py-1.5 rounded-full border border-dashed border-[#27272a] text-[#71717a] hover:text-[#e4e4e7] hover:border-[#71717a] transition-colors"
        >
          + Add favorite
        </button>
      </div>

      {/* Team picker */}
      {showPicker && (
        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-4 max-h-64 overflow-y-auto">
          {teams.length === 0 ? (
            <p className="text-[#71717a] text-sm">No teams available. Check the Scores tab first.</p>
          ) : (
            <div className="space-y-1">
              {teams.map((team) => (
                <button
                  key={team.name}
                  onClick={() => addFavorite(team.name)}
                  disabled={favorites.includes(team.name)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-[#e4e4e7] hover:bg-[#27272a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="text-[#71717a] mr-2 text-xs">{team.sport}</span>
                  {team.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Favorite games */}
      {favorites.length === 0 ? (
        <div className="text-center py-12 text-[#71717a]">
          <p className="text-2xl mb-3">⭐</p>
          <p className="font-medium">No favorites yet</p>
          <p className="text-sm mt-1">Add your favorite teams to see their games here.</p>
        </div>
      ) : favGames.length === 0 ? (
        <p className="text-[#71717a] text-sm text-center py-8">No games today for your favorite teams.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {favGames.map((game) => (
            <ScoreCard key={`${game.sport}-${game.id}`} game={game} />
          ))}
        </div>
      )}
    </div>
  );
}
