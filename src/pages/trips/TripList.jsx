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

function TripCard({ trip }) {
  const duration = getDuration(trip.startDate, trip.endDate);
  return (
    <Link to={`/trips/${trip.id}`} className="block">
      <div className="bg-[#111113] border border-[#27272a] rounded-xl p-5 hover:border-amber-500/50 transition-colors cursor-pointer">
        <div className="flex items-start justify-between mb-2 gap-2">
          <h3 className="text-[#e4e4e7] font-semibold text-lg leading-tight">{trip.name}</h3>
          <StatusBadge status={trip.status} />
        </div>
        <p className="text-[#71717a] text-sm mb-3">{trip.destination}</p>
        <div className="flex items-center justify-between text-sm text-[#71717a]">
          <div className="flex items-center gap-2">
            <span>{trip.startDate} → {trip.endDate}</span>
            {duration > 0 && (
              <span className="text-[#52525b]">· {duration} day{duration !== 1 ? 's' : ''}</span>
            )}
          </div>
          {trip.budget > 0 && (
            <span className="text-[#f59e0b] font-medium">${trip.budget.toLocaleString()}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function TripList({ trips }) {
  const navigate = useNavigate();

  if (!trips || trips.length === 0) {
    return (
      <div className="text-center py-16 text-[#71717a]">
        <div className="text-5xl mb-4">✈️</div>
        <p className="text-lg mb-2 text-[#e4e4e7]">No trips yet. Plan your first adventure →</p>
        <p className="text-sm mb-6">Keep track of your travel plans, budget, and itinerary in one place.</p>
        <button
          onClick={() => navigate('/trips/new')}
          className="bg-[#f59e0b] hover:bg-amber-400 text-black font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
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
