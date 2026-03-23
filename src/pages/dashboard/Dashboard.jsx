import { Link } from 'react-router-dom';

export function Dashboard({ trips = [] }) {
  const upcomingTrips = trips.filter((t) => t.status === 'Upcoming' || t.status === 'Planning');
  const totalBudget = upcomingTrips.reduce((sum, t) => sum + t.budget, 0);
  const recentTrips = [...trips].slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome card */}
      <div className="bg-gradient-to-br from-amber-900/30 to-[#111113] border border-[#27272a] rounded-xl p-6">
        <h2 className="text-2xl font-bold text-[#e4e4e7] mb-1">Welcome back ☀️</h2>
        <p className="text-[#71717a]">Here's what's happening with your plans.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-5">
          <p className="text-[#71717a] text-sm mb-1">Upcoming Trips</p>
          <p className="text-3xl font-bold text-[#f59e0b]">{upcomingTrips.length}</p>
        </div>
        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-5">
          <p className="text-[#71717a] text-sm mb-1">Total Budget</p>
          <p className="text-3xl font-bold text-[#e4e4e7]">${totalBudget.toLocaleString()}</p>
        </div>
      </div>

      {/* Recent trips */}
      <div className="bg-[#111113] border border-[#27272a] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[#e4e4e7] font-semibold">Recent Trips</h3>
          <Link to="/trips" className="text-[#f59e0b] text-sm hover:underline">View all</Link>
        </div>
        {recentTrips.length === 0 ? (
          <p className="text-[#71717a] text-sm">No trips yet. <Link to="/trips/new" className="text-[#f59e0b] hover:underline">Create one</Link></p>
        ) : (
          <div className="space-y-3">
            {recentTrips.map((trip) => (
              <Link key={trip.id} to={`/trips/${trip.id}`} className="flex items-center justify-between hover:bg-[#0a0a0b] -mx-2 px-2 py-1 rounded-lg transition-colors">
                <div>
                  <p className="text-[#e4e4e7] text-sm font-medium">{trip.name}</p>
                  <p className="text-[#71717a] text-xs">{trip.destination}</p>
                </div>
                <span className="text-[#71717a] text-xs">{trip.status}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
