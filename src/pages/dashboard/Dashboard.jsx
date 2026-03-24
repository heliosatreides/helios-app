import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTasks, groupTasks, getTodayStr } from '../../hooks/useTasks';
import { useTodaySchedule } from '../../hooks/useTodaySchedule';
import { useGemini } from '../../hooks/useGemini';

function StatCard({ label, value, color = 'text-[#e4e4e7]', sub, linkTo, linkLabel }) {
  return (
    <div className="bg-[#0c0c0e] border border-[#1c1c20] rounded-2xl p-5 hover:border-[#1c1c20] transition-colors">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[#52525b] text-xs font-medium uppercase tracking-wider">{label}</p>
        {linkTo && (
          <Link to={linkTo} className="text-amber-400/70 hover:text-amber-400 text-xs transition-colors">{linkLabel || 'View'} →</Link>
        )}
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-[#3f3f46] text-xs mt-1">{sub}</p>}
    </div>
  );
}

function TodayFocusCard() {
  const today = getTodayStr();
  const { tasks } = useTasks();
  const { schedule } = useTodaySchedule(today);
  const grouped = groupTasks(tasks, today);
  const todayTasks = [...grouped.overdue, ...grouped.today];
  const firstBlocks = schedule.slice(0, 3);

  if (todayTasks.length === 0 && firstBlocks.length === 0) return null;

  return (
    <div className="bg-[#0c0c0e] border border-[#1c1c20] rounded-2xl p-6 hover:border-[#1c1c20] transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span className="text-base">🗓️</span>
          <h3 className="text-[#e4e4e7] font-semibold text-sm">Today's Focus</h3>
          {todayTasks.length > 0 && (
            <span className="bg-amber-500/15 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {todayTasks.length} due
            </span>
          )}
        </div>
        <Link to="/planner" className="text-amber-400/70 hover:text-amber-400 text-xs transition-colors">Open Planner →</Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {firstBlocks.length > 0 && (
          <div>
            <p className="text-[#3f3f46] text-[10px] font-semibold uppercase tracking-wider mb-2">Schedule</p>
            <div className="space-y-1.5">
              {firstBlocks.map((b) => (
                <div key={b.id} className="flex gap-2.5 text-sm">
                  <span className="text-[#3f3f46] w-12 shrink-0 font-mono text-xs mt-0.5">{b.slotTime}</span>
                  <span className="text-[#a1a1aa]">{b.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {todayTasks.length > 0 && (
          <div>
            <p className="text-[#3f3f46] text-[10px] font-semibold uppercase tracking-wider mb-2">Tasks</p>
            <div className="space-y-1.5">
              {todayTasks.slice(0, 5).map((t) => (
                <div key={t.id} className="flex items-center gap-2 text-sm">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.priority === 'High' ? 'bg-red-400' : t.priority === 'Medium' ? 'bg-amber-400' : 'bg-zinc-500'}`} />
                  <span className="text-[#a1a1aa] truncate">{t.title}</span>
                </div>
              ))}
              {todayTasks.length > 5 && (
                <p className="text-[#3f3f46] text-xs pl-3.5">+{todayTasks.length - 5} more</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function OverviewTab({ trips = [], accounts = [], transactions = [], budgets = [], portfolio = [], sportsGameCount = null }) {
  const { generate, loading: aiLoading, hasKey } = useGemini();
  const [digest, setDigest] = useState(null);
  const [digestError, setDigestError] = useState(null);

  const upcomingTrips = trips.filter((t) => t.status === 'Upcoming' || t.status === 'Planning');
  const totalBudget = upcomingTrips.reduce((sum, t) => sum + t.budget, 0);
  const recentTrips = [...trips].slice(0, 5);

  const netWorth = accounts.reduce((sum, a) => sum + a.balance, 0);
  const portfolioValue = portfolio.reduce((sum, h) => sum + h.shares * h.currentPrice, 0);
  const portfolioCost = portfolio.reduce((sum, h) => sum + h.shares * h.costBasis, 0);
  const portfolioGainLoss = portfolioValue - portfolioCost;

  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyExpenses = transactions.filter(
    (t) => t.type === 'expense' && t.date.startsWith(currentMonth)
  );
  const monthlySpend = monthlyExpenses.reduce((sum, t) => sum + t.amount, 0);

  const budgetHealth = budgets.length === 0 ? null : (() => {
    const within = budgets.filter((b) => {
      const spent = monthlyExpenses
        .filter((t) => t.category === b.category)
        .reduce((s, t) => s + t.amount, 0);
      return spent <= b.limit;
    }).length;
    return Math.round((within / budgets.length) * 100);
  })();

  const { tasks } = useTasks();
  const today = getTodayStr();
  const tasksThisWeek = (() => {
    try {
      const d = new Date(today);
      const end = new Date(d);
      end.setDate(d.getDate() + 7);
      const endStr = end.toISOString().slice(0, 10);
      return (tasks || []).filter((t) => !t.done && t.dueDate >= today && t.dueDate <= endStr).length;
    } catch { return 0; }
  })();

  const handleWeeklyDigest = async () => {
    setDigestError(null);
    const totalBudgetLimit = budgets.reduce((s, b) => s + b.limit, 0);
    const spendPct = totalBudgetLimit > 0 ? ((monthlySpend / totalBudgetLimit) * 100).toFixed(0) : null;
    const portPct = portfolioCost > 0 ? (((portfolioValue - portfolioCost) / portfolioCost) * 100).toFixed(1) : null;
    const prompt = `Give me a brief personalized weekly digest (3-4 sentences) based on these stats: ${upcomingTrips.length} upcoming trips, monthly spending ${spendPct !== null ? spendPct + '% of budget' : 'no budget set'}, portfolio ${portPct !== null ? portPct + '% gain/loss' : 'no investments'}, ${tasksThisWeek} tasks due this week.`;
    try {
      const text = await generate(prompt);
      setDigest(text);
    } catch (err) {
      setDigestError(err.message);
    }
  };

  const isEmpty = trips.length === 0 && accounts.length === 0 && portfolio.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#e4e4e7]">Dashboard</h1>
          <p className="text-[#52525b] text-sm mt-0.5">
            {isEmpty ? 'Your personal command center' : "Here's what's happening"}
          </p>
        </div>
        {hasKey && !digest && (
          <button
            type="button"
            onClick={handleWeeklyDigest}
            disabled={aiLoading}
            className="bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 text-amber-400 text-xs font-medium px-3.5 py-2 rounded-xl transition-all disabled:opacity-50"
            data-testid="weekly-digest-btn"
          >
            {aiLoading ? '⏳ Generating…' : '✨ Weekly Digest'}
          </button>
        )}
      </div>

      {/* AI Digest */}
      {digest && (
        <div className="border border-amber-500/20 bg-amber-500/5 rounded-2xl p-5 animate-fadeIn" data-testid="digest-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-amber-400 text-xs font-semibold">✨ Weekly Digest</span>
            <button onClick={() => setDigest(null)} className="text-[#3f3f46] hover:text-[#71717a] text-xs transition-colors">Dismiss</button>
          </div>
          <p className="text-[#a1a1aa] text-sm leading-relaxed">{digest}</p>
        </div>
      )}
      {digestError && <p className="text-red-400 text-xs">❌ {digestError}</p>}

      {/* Empty state */}
      {isEmpty && (
        <div className="bg-[#0c0c0e] border border-[#1c1c20] border-dashed rounded-2xl p-10 text-center">
          <span className="text-4xl mb-4 block">☀️</span>
          <h3 className="text-[#e4e4e7] font-semibold mb-2">Welcome to Helios</h3>
          <p className="text-[#52525b] text-sm max-w-md mx-auto mb-6">
            Your dashboard will come alive as you add data. Start with a trip, set up your finances, or add investments.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/trips/new" className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium hover:bg-amber-500/15 transition-colors">
              ✈️ Plan a Trip
            </Link>
            <Link to="/finance" className="px-4 py-2 rounded-xl bg-[#111113] border border-[#1c1c20] text-[#a1a1aa] text-sm font-medium hover:border-[#1c1c20] transition-colors">
              💰 Add Accounts
            </Link>
            <Link to="/planner" className="px-4 py-2 rounded-xl bg-[#111113] border border-[#1c1c20] text-[#a1a1aa] text-sm font-medium hover:border-[#1c1c20] transition-colors">
              🗓️ Start Planning
            </Link>
          </div>
        </div>
      )}

      {/* Today's Focus */}
      <TodayFocusCard />

      {/* Stats grid */}
      {!isEmpty && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Upcoming Trips"
            value={upcomingTrips.length}
            color="text-amber-400"
            sub={totalBudget > 0 ? `$${totalBudget.toLocaleString()} budget` : undefined}
            linkTo="/trips"
            linkLabel="Plan"
          />
          {accounts.length > 0 && (
            <StatCard
              label="Net Worth"
              value={`${netWorth < 0 ? '-' : ''}$${Math.abs(netWorth).toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
              color={netWorth >= 0 ? 'text-emerald-400' : 'text-red-400'}
              sub={`$${monthlySpend.toLocaleString('en-US', { maximumFractionDigits: 0 })} spent this month`}
              linkTo="/finance"
              linkLabel="Manage"
            />
          )}
          {portfolio.length > 0 && (
            <StatCard
              label="Portfolio"
              value={`$${portfolioValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
              color="text-amber-400"
              sub={`${portfolioGainLoss >= 0 ? '+' : ''}$${portfolioGainLoss.toLocaleString('en-US', { maximumFractionDigits: 0 })} total`}
              linkTo="/investments"
              linkLabel="Invest"
            />
          )}
          {budgetHealth !== null && (
            <StatCard
              label="Budget Health"
              value={`${budgetHealth}%`}
              color={budgetHealth === 100 ? 'text-emerald-400' : budgetHealth >= 70 ? 'text-amber-400' : 'text-red-400'}
              sub={`${budgets.length} categories tracked`}
              linkTo="/finance"
            />
          )}
        </div>
      )}

      {/* Sports */}
      <div className="bg-[#0c0c0e] border border-[#1c1c20] rounded-2xl p-5 hover:border-[#1c1c20] transition-colors">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span>🏆</span>
            <h3 className="text-[#e4e4e7] font-semibold text-sm">Sports Hub</h3>
          </div>
          <Link to="/sports" className="text-amber-400/70 hover:text-amber-400 text-xs transition-colors">View →</Link>
        </div>
        {sportsGameCount !== null ? (
          <div>
            <p className="text-2xl font-bold text-emerald-400">{sportsGameCount}</p>
            <p className="text-[#3f3f46] text-xs mt-1">games today</p>
          </div>
        ) : (
          <p className="text-[#52525b] text-sm">Live scores, standings & favorites</p>
        )}
      </div>

      {/* Recent trips */}
      {trips.length > 0 && (
        <div className="bg-[#0c0c0e] border border-[#1c1c20] rounded-2xl p-6 hover:border-[#1c1c20] transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#e4e4e7] font-semibold text-sm">Recent Trips</h3>
            <Link to="/trips" className="text-amber-400/70 hover:text-amber-400 text-xs transition-colors">View all →</Link>
          </div>
          <div className="space-y-2">
            {recentTrips.map((trip) => (
              <Link
                key={trip.id}
                to={`/trips/${trip.id}`}
                className="flex items-center justify-between -mx-2 px-3 py-2.5 rounded-xl hover:bg-[#111113] transition-colors group"
              >
                <div>
                  <p className="text-[#e4e4e7] text-sm font-medium group-hover:text-amber-400 transition-colors">{trip.name}</p>
                  <p className="text-[#3f3f46] text-xs">{trip.destination}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  trip.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' :
                  trip.status === 'Upcoming' ? 'bg-amber-500/10 text-amber-400' :
                  'bg-[#1c1c20] text-[#52525b]'
                }`}>{trip.status}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick links for empty states */}
      {trips.length === 0 && !isEmpty && (
        <div className="bg-[#0c0c0e] border border-[#1c1c20] rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>✈️</span>
              <p className="text-[#52525b] text-sm">No trips yet</p>
            </div>
            <Link to="/trips/new" className="text-amber-400 text-xs font-medium hover:text-amber-300 transition-colors">
              Create one →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export function Dashboard({ trips = [], accounts = [], transactions = [], budgets = [], portfolio = [], sportsGameCount = null }) {
  return (
    <OverviewTab
      trips={trips}
      accounts={accounts}
      transactions={transactions}
      budgets={budgets}
      portfolio={portfolio}
      sportsGameCount={sportsGameCount}
    />
  );
}
