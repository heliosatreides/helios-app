import { Link, useNavigate } from 'react-router-dom';
import { getDuration } from './tripUtils';

const STATUS_COLORS = {
  Planning: 'bg-amber-900/60 text-amber-300 ring-1 ring-amber-600/40',
  Upcoming: 'bg-blue-900/60 text-blue-300 ring-1 ring-blue-600/40',
  Ongoing: 'bg-green-900/60 text-green-300 ring-1 ring-green-600/40',
  Completed: 'bg-zinc-800 text-zinc-400 ring-1 ring-zinc-600/40',
};

function StatusBadge({ status }) {
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[status] || 'bg-zinc-800 text-zinc-400'}`}>
      {status}
    </span>
  );
}

/**
 * Returns a progress indicator string for a trip:
 * - "Upcoming" / "Planning": "In X days"
 * - "Ongoing": "Day X of Y"
 * - "Completed": "X days ago"
 */
function getTripProgress(trip) {
  if (!trip.startDate || !trip.endDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(trip.startDate + 'T00:00:00');
  const end = new Date(trip.endDate + 'T00:00:00');

  const daysUntilStart = Math.round((start - today) / (1000 * 60 * 60 * 24));
  const totalDays = getDuration(trip.startDate, trip.endDate);

  if (today < start) {
    if (daysUntilStart === 0) return 'Starts today!';
    if (daysUntilStart === 1) return 'Tomorrow';
    return `In ${daysUntilStart} days`;
  } else if (today <= end) {
    const dayNum = Math.round((today - start) / (1000 * 60 * 60 * 24)) + 1;
    return `Day ${dayNum} of ${totalDays}`;
  } else {
    const daysAgo = Math.round((today - end) / (1000 * 60 * 60 * 24));
    return daysAgo === 0 ? 'Ended today' : `${daysAgo} days ago`;
  }
}

function TripCard({ trip }) {
  const duration = getDuration(trip.startDate, trip.endDate);
  const progress = getTripProgress(trip);

  return (
    <Link to={`/trips/${trip.id}`} className="block">
      <div className="bg-background border border-border p-5 hover:border-amber-500/50 transition-colors cursor-pointer">
        <div className="flex items-start justify-between mb-2 gap-2">
          <h3 className="text-foreground font-semibold text-lg leading-tight">{trip.name}</h3>
          <StatusBadge status={trip.status} />
        </div>
        <p className="text-muted-foreground text-sm mb-3">{trip.destination}</p>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>{trip.startDate} → {trip.endDate}</span>
            {duration > 0 && (
              <span className="text-muted-foreground/80">· {duration} day{duration !== 1 ? 's' : ''}</span>
            )}
          </div>
          {trip.budget > 0 && (
            <span className="text-foreground font-medium">${trip.budget.toLocaleString()}</span>
          )}
        </div>
        {progress && (
          <div className="mt-2 flex items-center gap-1.5">
            <span className="text-muted-foreground/60 text-xs">🕐</span>
            <span className="text-muted-foreground/80 text-xs font-medium">{progress}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

export function TripList({ trips }) {
  const navigate = useNavigate();

  if (!trips || trips.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <div className="text-5xl mb-4">✈️</div>
        <p className="text-lg mb-2 text-foreground">No trips yet. Plan your first adventure →</p>
        <p className="text-sm mb-6">Keep track of your travel plans, budget, and itinerary in one place.</p>
        <button
          onClick={() => navigate('/trips/new')}
          className="bg-foreground hover:bg-amber-400 text-black font-semibold px-5 py-2.5 text-sm transition-colors"
        >
          + Create Trip
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {trips.map((trip) => (
        <TripCard key={trip.id} trip={trip} />
      ))}
    </div>
  );
}
