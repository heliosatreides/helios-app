import { Link, useNavigate } from 'react-router-dom';

const STATUS_COLORS = {
  Planning: 'bg-blue-900 text-blue-300',
  Upcoming: 'bg-amber-900 text-amber-300',
  Ongoing: 'bg-green-900 text-green-300',
  Completed: 'bg-zinc-800 text-zinc-400',
};

function StatusBadge({ status }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] || 'bg-zinc-800 text-zinc-400'}`}>
      {status}
    </span>
  );
}

function TripCard({ trip }) {
  return (
    <Link to={`/trips/${trip.id}`} className="block">
      <div className="bg-[#111113] border border-[#27272a] rounded-xl p-5 hover:border-amber-500/50 transition-colors cursor-pointer">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-[#e4e4e7] font-semibold text-lg">{trip.name}</h3>
          <StatusBadge status={trip.status} />
        </div>
        <p className="text-[#71717a] text-sm mb-3">{trip.destination}</p>
        <div className="flex items-center justify-between text-sm text-[#71717a]">
          <span>{trip.startDate} → {trip.endDate}</span>
          <span className="text-[#f59e0b] font-medium">${trip.budget.toLocaleString()}</span>
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
