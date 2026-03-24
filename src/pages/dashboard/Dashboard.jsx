import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTasks, groupTasks, getTodayStr } from '../../hooks/useTasks';
import { useTodaySchedule } from '../../hooks/useTodaySchedule';
import { useGemini } from '../../hooks/useGemini';
import { DevToolsTab } from './DevToolsTab';
import { FocusTab } from './FocusTab';
import { HealthTab } from './HealthTab';
import { KnowledgeTab } from './KnowledgeTab';
import { GoalsTab } from './GoalsTab';
import { NetworkingTab } from './NetworkingTab';

function TodayFocusCard() {
  const today = getTodayStr();
  const { tasks } = useTasks();
  const { schedule } = useTodaySchedule(today);
  const grouped = groupTasks(tasks, today);
  const todayTasks = [...grouped.overdue, ...grouped.today];
  const firstBlocks = schedule.slice(0, 2);

  if (todayTasks.length === 0 && firstBlocks.length === 0) return null;

  return (
    <div className="bg-[#111113] border border-[#27272a] rounded-xl p-5 h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-[#e4e4e7] font-semibold">Today's Focus 🗓️</h3>
          {todayTasks.length > 0 && (
            <span className="bg-amber-500/20 text-amber-400 text-xs font-bold px-2 py-0.5 rounded-full">
              {todayTasks.length}
            </span>
          )}
        </div>
        <Link to="/planner" className="text-[#f59e0b] text-sm hover:underline">Open Planner</Link>
      </div>
      {firstBlocks.length > 0 && (
        <div className="mb-3 space-y-1">
          <p className="text-[#52525b] text-xs uppercase tracking-wider mb-1">Schedule</p>
          {firstBlocks.map((b) => (
            <div key={b.id} className="flex gap-2 text-sm">
              <span className="text-[#52525b] w-12 shrink-0">{b.slotTime}</span>
              <span className="text-[#a1a1aa]">{b.title}</span>
            </div>
          ))}
        </div>
      )}
      {todayTasks.length > 0 && (
        <div className="space-y-1">
          <p className="text-[#52525b] text-xs uppercase tracking-wider mb-1">Tasks Due</p>
          {todayTasks.slice(0, 5).map((t) => (
            <div key={t.id} className="flex items-center gap-2 text-sm">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.priority === 'High' ? 'bg-red-400' : t.priority === 'Medium' ? 'bg-amber-400' : 'bg-zinc-400'}`} />
              <span className="text-[#a1a1aa]">{t.title}</span>
            </div>
          ))}
          {todayTasks.length > 5 && (
            <p className="text-[#52525b] text-xs">+{todayTasks.length - 5} more</p>
          )}
        </div>
      )}
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

  // Finance summary
  const netWorth = accounts.reduce((sum, a) => sum + a.balance, 0);

  // Investment summary
  const portfolioValue = portfolio.reduce((sum, h) => sum + h.shares * h.currentPrice, 0);
  const portfolioCost = portfolio.reduce((sum, h) => sum + h.shares * h.costBasis, 0);
  const portfolioGainLoss = portfolioValue - portfolioCost;

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
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyExpenses = transactions.filter((t) => t.type === 'expense' && t.date.startsWith(currentMonth));
    const totalSpend = monthlyExpenses.reduce((s, t) => s + t.amount, 0);
    const totalBudgetLimit = budgets.reduce((s, b) => s + b.limit, 0);
    const spendPct = totalBudgetLimit > 0 ? ((totalSpend / totalBudgetLimit) * 100).toFixed(0) : null;
    const portVal = portfolio.reduce((s, h) => s + h.shares * h.currentPrice, 0);
    const portCost = portfolio.reduce((s, h) => s + h.shares * h.costBasis, 0);
    const portPct = portCost > 0 ? (((portVal - portCost) / portCost) * 100).toFixed(1) : null;
    const prompt = `Give me a brief personalized weekly digest (3-4 sentences) based on these stats: ${upcomingTrips.length} upcoming trips, monthly spending ${spendPct !== null ? spendPct + '% of budget' : 'no budget set'}, portfolio ${portPct !== null ? portPct + '% gain/loss' : 'no investments'}, ${tasksThisWeek} tasks due this week.`;
    try {
      const text = await generate(prompt);
      setDigest(text);
    } catch (err) {
      setDigestError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Weekly Digest */}
      {hasKey && (
        <div>
          {digest ? (
            <div className="border border-amber-500/30 bg-amber-950/20 rounded-xl p-4" data-testid="digest-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-amber-400 text-sm font-semibold">✨ Weekly Digest</span>
                <button
                  type="button"
                  onClick={() => setDigest(null)}
                  className="text-[#52525b] hover:text-[#e4e4e7] text-xs"
                >
                  Dismiss
                </button>
              </div>
              <p className="text-[#e4e4e7] text-sm">{digest}</p>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleWeeklyDigest}
              disabled={aiLoading}
              className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              data-testid="weekly-digest-btn"
            >
              {aiLoading ? '⏳ Generating…' : '✨ Weekly Digest'}
            </button>
          )}
          {digestError && <p className="text-red-400 text-xs mt-1">❌ {digestError}</p>}
        </div>
      )}

      {/* Welcome card */}
      <div className="bg-gradient-to-br from-amber-900/30 to-[#111113] border border-[#27272a] rounded-xl p-6">
        <h2 className="text-2xl font-bold text-[#e4e4e7] mb-1">Welcome back ☀️</h2>
        {trips.length === 0 && accounts.length === 0 && portfolio.length === 0 ? (
          <p className="text-[#71717a]">Your dashboard is ready. Start by adding a trip, account, or investment to see your summary here.</p>
        ) : (
          <p className="text-[#71717a]">Here's what's happening with your plans.</p>
        )}
      </div>

      {/* Today's Focus */}
      <TodayFocusCard />

      {/* Stats cards — consistent height */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-5 flex flex-col justify-between min-h-[100px]">
          <p className="text-[#71717a] text-sm mb-1">Upcoming Trips</p>
          <p className="text-3xl font-bold text-[#f59e0b]">{upcomingTrips.length}</p>
        </div>
        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-5 flex flex-col justify-between min-h-[100px]">
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

      {/* Investment Summary Card */}
      {portfolio.length > 0 && (
        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#e4e4e7] font-semibold">Investment Portfolio</h3>
            <Link to="/investments" className="text-[#f59e0b] text-sm hover:underline">Manage</Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[#71717a] text-xs mb-1">Total Value</p>
              <p className="text-xl font-bold text-[#f59e0b]">
                ${portfolioValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div>
              <p className="text-[#71717a] text-xs mb-1">Total Gain/Loss</p>
              <p className={`text-xl font-bold ${portfolioGainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {portfolioGainLoss >= 0 ? '+' : ''}${portfolioGainLoss.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sports card */}
      <div className="bg-[#111113] border border-[#27272a] rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[#e4e4e7] font-semibold">Sports Hub 🏆</h3>
          <Link to="/sports" className="text-[#f59e0b] text-sm hover:underline">View</Link>
        </div>
        {sportsGameCount !== null ? (
          <div>
            <p className="text-3xl font-bold text-[#22c55e]">{sportsGameCount}</p>
            <p className="text-[#71717a] text-xs mt-1">games today</p>
          </div>
        ) : (
          <p className="text-[#71717a] text-sm">Live scores, standings &amp; favorites.</p>
        )}
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

const DASHBOARD_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'devtools', label: '⚙️ Dev Tools' },
  { id: 'focus', label: '🍅 Focus' },
  { id: 'health', label: '💚 Health' },
  { id: 'knowledge', label: '📚 Knowledge' },
  { id: 'goals', label: '🎯 Goals' },
  { id: 'networking', label: '🤝 Network' },
];

export function Dashboard({ trips = [], accounts = [], transactions = [], budgets = [], portfolio = [], sportsGameCount = null }) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-4">
      {/* Tab bar — sticky */}
      <div className="sticky top-0 z-10 bg-[#0a0a0b] pb-px">
        <div className="flex gap-1 border-b border-[#27272a] overflow-x-auto">
          {DASHBOARD_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              data-testid={`dashboard-tab-${tab.id}`}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-amber-400 border-b-[3px] border-amber-400'
                  : 'text-[#71717a] hover:text-[#e4e4e7]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <OverviewTab
          trips={trips}
          accounts={accounts}
          transactions={transactions}
          budgets={budgets}
          portfolio={portfolio}
          sportsGameCount={sportsGameCount}
        />
      )}
      {activeTab === 'devtools' && <DevToolsTab />}
      {activeTab === 'focus' && <FocusTab />}
      {activeTab === 'health' && <HealthTab />}
      {activeTab === 'knowledge' && <KnowledgeTab />}
      {activeTab === 'goals' && <GoalsTab trips={trips} budgets={budgets} />}
      {activeTab === 'networking' && <NetworkingTab />}
    </div>
  );
}
