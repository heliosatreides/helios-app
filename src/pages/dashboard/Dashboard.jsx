import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTasks, groupTasks, getTodayStr } from '../../hooks/useTasks';
import { useTodaySchedule } from '../../hooks/useTodaySchedule';
import { useGemini } from '../../hooks/useGemini';

function StatCard({ label, value, color = 'text-foreground', sub, linkTo }) {
  const content = (
    <div className="border border-border p-4 hover:bg-secondary/30 transition-colors">
      <p className="text-muted-foreground text-xs mb-2">{label}</p>
      <p className={`text-2xl font-semibold ${color}`}>{value}</p>
      {sub && <p className="text-muted-foreground/60 text-xs mt-1">{sub}</p>}
    </div>
  );
  if (linkTo) return <Link to={linkTo} className="block">{content}</Link>;
  return content;
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
    <div className="border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-foreground font-medium text-sm">Today's Focus</h3>
          {todayTasks.length > 0 && (
            <span className="text-xs text-muted-foreground">{todayTasks.length} due</span>
          )}
        </div>
        <Link to="/planner" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Open Planner</Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {firstBlocks.length > 0 && (
          <div>
            <p className="text-muted-foreground/60 text-[11px] font-medium uppercase tracking-wide mb-2">Schedule</p>
            <div className="space-y-1.5">
              {firstBlocks.map((b) => (
                <div key={b.id} className="flex gap-2 text-sm">
                  <span className="text-muted-foreground/60 w-12 shrink-0 font-mono text-xs">{b.slotTime}</span>
                  <span className="text-muted-foreground">{b.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {todayTasks.length > 0 && (
          <div>
            <p className="text-muted-foreground/60 text-[11px] font-medium uppercase tracking-wide mb-2">Tasks</p>
            <div className="space-y-1.5">
              {todayTasks.slice(0, 5).map((t) => (
                <div key={t.id} className="flex items-center gap-2 text-sm">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.priority === 'High' ? 'bg-red-500' : t.priority === 'Medium' ? 'bg-yellow-500' : 'bg-muted-foreground/30'}`} />
                  <span className="text-muted-foreground truncate">{t.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function Dashboard({ trips = [], accounts = [], transactions = [], budgets = [], portfolio = [], sportsGameCount = null }) {
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
  const monthlyExpenses = transactions.filter((t) => t.type === 'expense' && t.date.startsWith(currentMonth));
  const monthlySpend = monthlyExpenses.reduce((sum, t) => sum + t.amount, 0);

  const budgetHealth = budgets.length === 0 ? null : (() => {
    const within = budgets.filter((b) => {
      const spent = monthlyExpenses.filter((t) => t.category === b.category).reduce((s, t) => s + t.amount, 0);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm">{isEmpty ? 'Your personal command center' : "Here's what's happening"}</p>
        </div>
        {hasKey && !digest && (
          <button onClick={handleWeeklyDigest} disabled={aiLoading}
            className="border border-border text-muted-foreground text-xs px-3 py-1.5 hover:text-foreground hover:bg-secondary/50 transition-colors disabled:opacity-50"
            data-testid="weekly-digest-btn">
            {aiLoading ? 'Generating...' : 'Weekly Digest'}
          </button>
        )}
      </div>

      {digest && (
        <div className="border border-border p-4 animate-fadeIn" data-testid="digest-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-foreground">Weekly Digest</span>
            <button onClick={() => setDigest(null)} className="text-muted-foreground hover:text-foreground text-xs transition-colors">Dismiss</button>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">{digest}</p>
        </div>
      )}
      {digestError && <p className="text-red-400 text-xs">{digestError}</p>}

      {isEmpty && (
        <div className="border border-dashed border-border p-10 text-center">
          <h3 className="text-foreground font-medium mb-2">Welcome to Helios</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">Your dashboard will come alive as you add data. Start with a trip, set up your finances, or add investments.</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link to="/trips/new" className="px-3 py-1.5 border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">Plan a Trip</Link>
            <Link to="/finance" className="px-3 py-1.5 border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">Add Accounts</Link>
            <Link to="/planner" className="px-3 py-1.5 border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">Start Planning</Link>
          </div>
        </div>
      )}

      <TodayFocusCard />

      {!isEmpty && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border">
          <StatCard label="Upcoming Trips" value={upcomingTrips.length} sub={totalBudget > 0 ? `$${totalBudget.toLocaleString()} budget` : undefined} linkTo="/trips" />
          {accounts.length > 0 && (
            <StatCard label="Net Worth" value={`${netWorth < 0 ? '-' : ''}$${Math.abs(netWorth).toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
              color={netWorth >= 0 ? 'text-green-400' : 'text-red-400'}
              sub={`$${monthlySpend.toLocaleString('en-US', { maximumFractionDigits: 0 })} spent this month`} linkTo="/finance" />
          )}
          {portfolio.length > 0 && (
            <StatCard label="Portfolio" value={`$${portfolioValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
              sub={`${portfolioGainLoss >= 0 ? '+' : ''}$${portfolioGainLoss.toLocaleString('en-US', { maximumFractionDigits: 0 })} total`} linkTo="/investments" />
          )}
          {budgetHealth !== null && (
            <StatCard label="Budget Health" value={`${budgetHealth}%`}
              color={budgetHealth === 100 ? 'text-green-400' : budgetHealth >= 70 ? 'text-yellow-400' : 'text-red-400'}
              sub={`${budgets.length} categories tracked`} linkTo="/finance" />
          )}
        </div>
      )}

      <div className="border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-foreground font-medium text-sm">Sports</h3>
          <Link to="/sports" className="text-xs text-muted-foreground hover:text-foreground transition-colors">View</Link>
        </div>
        {sportsGameCount !== null ? (
          <div>
            <p className="text-2xl font-semibold text-green-400">{sportsGameCount}</p>
            <p className="text-muted-foreground/60 text-xs mt-1">games today</p>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Live scores, standings & favorites</p>
        )}
      </div>

      {trips.length > 0 && (
        <div className="border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-foreground font-medium text-sm">Recent Trips</h3>
            <Link to="/trips" className="text-xs text-muted-foreground hover:text-foreground transition-colors">View all</Link>
          </div>
          <div className="space-y-1">
            {recentTrips.map((trip) => (
              <Link key={trip.id} to={`/trips/${trip.id}`}
                className="flex items-center justify-between -mx-2 px-2 py-2 hover:bg-secondary/30 transition-colors">
                <div>
                  <p className="text-foreground text-sm">{trip.name}</p>
                  <p className="text-muted-foreground/60 text-xs">{trip.destination}</p>
                </div>
                <span className={`text-xs ${
                  trip.status === 'Completed' ? 'text-green-400' :
                  trip.status === 'Upcoming' ? 'text-foreground' : 'text-muted-foreground'
                }`}>{trip.status}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {trips.length === 0 && !isEmpty && (
        <div className="border border-border p-4 flex items-center justify-between">
          <p className="text-muted-foreground text-sm">No trips yet</p>
          <Link to="/trips/new" className="text-xs text-foreground hover:underline">Create one</Link>
        </div>
      )}
    </div>
  );
}
