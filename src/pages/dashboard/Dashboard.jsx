import { Link } from 'react-router-dom';

export function Dashboard({ trips = [], accounts = [], transactions = [], budgets = [] }) {
  const upcomingTrips = trips.filter((t) => t.status === 'Upcoming' || t.status === 'Planning');
  const totalBudget = upcomingTrips.reduce((sum, t) => sum + t.budget, 0);
  const recentTrips = [...trips].slice(0, 5);

  // Finance summary
  const netWorth = accounts.reduce((sum, a) => sum + a.balance, 0);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyExpenses = transactions.filter(
    (t) => t.type === 'expense' && t.date.startsWith(currentMonth)
  );
  const monthlySpend = monthlyExpenses.reduce((sum, t) => sum + t.amount, 0);

  // Budget health: % of categories within budget
  const budgetHealth = budgets.length === 0 ? null : (() => {
    const within = budgets.filter((b) => {
      const spent = monthlyExpenses
        .filter((t) => t.category === b.category)
        .reduce((s, t) => s + t.amount, 0);
      return spent <= b.limit;
    }).length;
    return Math.round((within / budgets.length) * 100);
  })();

  return (
    <div className="space-y-6">
      {/* Welcome card */}
      <div className="bg-gradient-to-br from-amber-900/30 to-[#111113] border border-[#27272a] rounded-xl p-6">
        <h2 className="text-2xl font-bold text-[#e4e4e7] mb-1">Welcome back ☀️</h2>
        <p className="text-[#71717a]">Here's what's happening with your plans.</p>
      </div>

      {/* Trip Stats */}
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

      {/* Finance Summary Card */}
      {accounts.length > 0 && (
        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#e4e4e7] font-semibold">Finance Summary</h3>
            <Link to="/finance" className="text-[#f59e0b] text-sm hover:underline">Manage</Link>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-[#71717a] text-xs mb-1">Net Worth</p>
              <p className={`text-xl font-bold ${netWorth >= 0 ? 'text-[#f59e0b]' : 'text-red-400'}`}>
                {netWorth < 0 ? '-' : ''}${Math.abs(netWorth).toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div>
              <p className="text-[#71717a] text-xs mb-1">Month Spend</p>
              <p className="text-xl font-bold text-[#e4e4e7]">
                ${monthlySpend.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div>
              <p className="text-[#71717a] text-xs mb-1">Budget Health</p>
              {budgetHealth === null ? (
                <p className="text-[#71717a] text-sm">No budget</p>
              ) : (
                <p className={`text-xl font-bold ${budgetHealth === 100 ? 'text-green-400' : budgetHealth >= 70 ? 'text-amber-400' : 'text-red-400'}`}>
                  {budgetHealth}%
                </p>
              )}
            </div>
          </div>
        </div>
      )}

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
