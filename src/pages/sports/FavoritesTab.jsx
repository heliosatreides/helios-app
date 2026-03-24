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
            className="flex items-center gap-1.5 bg-secondary text-foreground text-xs px-3 py-1.5 rounded-full"
          >
            {name}
            <button
              aria-label={`Remove ${name}`}
              onClick={() => removeFavorite(name)}
              className="text-muted-foreground hover:text-red-400 transition-colors ml-0.5"
            >
              ×
            </button>
          </span>
        ))}
        <button
          aria-label="Add favorite"
          onClick={() => setShowPicker((v) => !v)}
          className="text-xs px-3 py-1.5 rounded-full border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-[#71717a] transition-colors"
        >
          + Add favorite
        </button>
      </div>

      {/* Team picker */}
      {showPicker && (
        <div className="bg-background border border-border p-4 max-h-64 overflow-y-auto">
          {teams.length === 0 ? (
            <p className="text-muted-foreground text-sm">No teams available. Check the Scores tab first.</p>
          ) : (
            <div className="space-y-1">
              {teams.map((team) => (
                <button
                  key={team.name}
                  onClick={() => addFavorite(team.name)}
                  disabled={favorites.includes(team.name)}
                  className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="text-muted-foreground mr-2 text-xs">{team.sport}</span>
                  {team.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Favorite games */}
      {favorites.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-2xl mb-3">⭐</p>
          <p className="font-medium">No favorites yet</p>
          <p className="text-sm mt-1">Add your favorite teams to see their games here.</p>
        </div>
      ) : favGames.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">No games today for your favorite teams.</p>
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
