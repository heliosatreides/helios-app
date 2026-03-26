import { useSportsScores } from '../../hooks/useSportsScores';
import { ScoreCard } from './ScoreCard';

const SPORTS = ['NBA', 'NFL', 'MLB', 'NHL', 'MLS'];

function SkeletonCard() {
  return (
    <div className="bg-background border border-border p-4 animate-pulse space-y-3">
      <div className="h-3 bg-secondary rounded w-16" />
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-secondary rounded-full" />
        <div className="h-3 bg-secondary rounded flex-1" />
        <div className="h-5 bg-secondary rounded w-6" />
      </div>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-secondary rounded-full" />
        <div className="h-3 bg-secondary rounded flex-1" />
        <div className="h-5 bg-secondary rounded w-6" />
      </div>
    </div>
  );
}

function SportContent({ sport }) {
  const { games, loading, error, refresh } = useSportsScores(sport);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background border border-border p-6 text-center">
        <p className="text-red-400 mb-2">Failed to load scores</p>
        <p className="text-muted-foreground text-sm mb-4">{error}</p>
        <button
          onClick={refresh}
          className="px-4 py-2 bg-amber-500 text-background text-sm font-medium hover:bg-amber-400 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-2xl mb-3">🏟️</p>
        <p className="font-medium">No games today</p>
        <p className="text-sm mt-1">Check back later for today's {sport} schedule.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {games.map((game) => (
        <ScoreCard key={game.id} game={game} />
      ))}
    </div>
  );
}

export function ScoresTab({ activeSport, onSportChange }) {
  return (
    <div className="space-y-4">
      {/* Sport pills */}
      <div className="flex flex-wrap gap-2">
        {SPORTS.map((sport) => (
          <button
            key={sport}
            onClick={() => onSportChange(sport)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeSport === sport
                ? 'bg-amber-500 text-background'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {sport}
          </button>
        ))}
      </div>

      {/* Scores */}
      <SportContent sport={activeSport} />
    </div>
  );
}
