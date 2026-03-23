import { Link } from 'react-router-dom';

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
  if (!trips || trips.length === 0) {
    return (
      <div className="text-center py-16 text-[#71717a]">
        <p className="text-lg mb-2">No trips yet</p>
        <p className="text-sm">Create your first trip to get started</p>
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
