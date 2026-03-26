import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTasks, groupTasks, getTodayStr } from '../../hooks/useTasks';
import { useTodaySchedule } from '../../hooks/useTodaySchedule';
import { useGemini } from '../../hooks/useGemini';
import { useIDB } from '../../hooks/useIDB';
import { isOverdue } from '../dashboard/NetworkingTab';
import { ProductivityStreak } from '../../components/ProductivityStreak';
import { WeeklyDigest } from '../../components/WeeklyDigest';
import { ProactiveAlerts } from '../../components/ProactiveAlerts';

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

function AiNudge({ hasKey, isEmpty }) {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem('helios-ai-nudge-dismissed') === '1'; } catch { return false; }
  });
  if (hasKey || isEmpty || dismissed) return null;
  return (
    <div className="border border-border p-4 flex items-center justify-between gap-3" data-testid="ai-nudge">
      <p className="text-muted-foreground text-sm flex-1">Unlock AI features — add your Gemini API key in Settings to enable morning briefs, AI insights, and smart suggestions.</p>
      <div className="flex items-center gap-2 shrink-0">
        <Link to="/settings" className="bg-foreground text-background px-3 py-1.5 text-xs font-medium min-h-[44px] flex items-center">Setup</Link>
        <button onClick={() => { setDismissed(true); try { localStorage.setItem('helios-ai-nudge-dismissed', '1'); } catch {} }}
          className="text-muted-foreground hover:text-foreground text-sm min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Dismiss AI nudge">&times;</button>
      </div>
    </div>
  );
}

function BackupNudge({ isEmpty }) {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem('helios-backup-nudge-dismissed') === '1'; } catch { return false; }
  });

  // Set first-use date on first render if not already set
  useEffect(() => {
    try {
      if (!localStorage.getItem('helios-first-use-date')) {
        localStorage.setItem('helios-first-use-date', new Date().toISOString().split('T')[0]);
      }
    } catch {}
  }, []);

  if (isEmpty || dismissed) return null;

  // Check if 3+ days since first use
  try {
    const firstUse = localStorage.getItem('helios-first-use-date');
    if (!firstUse) return null;
    const daysSince = Math.floor((new Date() - new Date(firstUse)) / 86400000);
    if (daysSince < 3) return null;
  } catch { return null; }

  return (
    <div className="border border-border p-4 flex items-center justify-between gap-3" data-testid="backup-nudge">
      <p className="text-muted-foreground text-sm flex-1">Your data lives only in this browser. Back it up to stay safe.</p>
      <div className="flex items-center gap-2 shrink-0">
        <Link to="/settings" className="bg-foreground text-background px-3 py-1.5 text-xs font-medium min-h-[44px] flex items-center">Back up now</Link>
        <button onClick={() => { setDismissed(true); try { localStorage.setItem('helios-backup-nudge-dismissed', '1'); } catch {} }}
          className="text-muted-foreground hover:text-foreground text-sm min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Dismiss backup nudge">&times;</button>
      </div>
    </div>
  );
}

export function Dashboard({ trips = [], accounts = [], transactions = [], budgets = [], portfolio = [], sportsGameCount = null }) {
  const { generate, loading: aiLoading, hasKey } = useGemini();
  const [briefCache, setBriefCache, briefReady] = useIDB('daily-brief', null);
  const [contacts] = useIDB('contacts', []);
  const [briefText, setBriefText] = useState(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefError, setBriefError] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const briefTriggered = useRef(false);

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
  const tasksDueToday = (() => {
    try {
      const grouped = groupTasks(tasks, today);
      return [...grouped.overdue, ...grouped.today].length;
    } catch { return 0; }
  })();

  const isEmpty = trips.length === 0 && accounts.length === 0 && portfolio.length === 0;

  const generateBrief = useCallback(async () => {
    setBriefError(null);
    setBriefLoading(true);
    try {
      const totalBudgetLimit = budgets.reduce((s, b) => s + b.limit, 0);
      const spendPct = totalBudgetLimit > 0 ? ((monthlySpend / totalBudgetLimit) * 100).toFixed(0) : null;
      const portPct = portfolioCost > 0 ? (((portfolioValue - portfolioCost) / portfolioCost) * 100).toFixed(1) : null;
      const nextTrip = upcomingTrips.sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
      const tripCountdown = nextTrip ? Math.ceil((new Date(nextTrip.startDate) - new Date(today)) / 86400000) : null;
      const overdueContacts = (contacts || []).filter(isOverdue);
      const prompt = `Give me a brief daily morning brief (3-4 sentences max) based on these stats: ${tasksDueToday} tasks due today, monthly spending ${spendPct !== null ? spendPct + '% of budget' : 'no budget set'}, portfolio ${portPct !== null ? portPct + '% gain/loss' : 'no investments'}${tripCountdown !== null ? `, next trip "${nextTrip.name}" in ${tripCountdown} days` : ''}${overdueContacts.length > 0 ? `, ${overdueContacts.length} overdue contact${overdueContacts.length > 1 ? 's' : ''} to follow up with` : ''}. Be concise and actionable.`;
      const text = await generate(prompt);
      setBriefText(text);
      await setBriefCache({ date: today, text });
    } catch (err) {
      setBriefError(err.message);
    } finally {
      setBriefLoading(false);
    }
  }, [generate, budgets, monthlySpend, portfolioCost, portfolioValue, upcomingTrips, today, tasksDueToday, contacts, setBriefCache]);

  // Auto-generate brief on mount — use IDB cache as primary guard instead of ref
  // to prevent re-firing when user navigates away and back on the same day (PM Fix Now #3).
  // The ref alone was insufficient because it resets on every remount.
  const briefGenerating = useRef(false);
  useEffect(() => {
    if (!briefReady || briefTriggered.current) return;
    if (!hasKey || isEmpty) return;
    if (briefCache && briefCache.date === today) {
      setBriefText(briefCache.text);
      briefTriggered.current = true;
      return;
    }
    // Prevent concurrent generation calls
    if (briefGenerating.current) return;
    briefTriggered.current = true;
    briefGenerating.current = true;
    generateBrief().finally(() => { briefGenerating.current = false; });
  }, [briefReady, hasKey, isEmpty, briefCache, today, generateBrief]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm">{isEmpty ? 'Your personal command center' : "Here's what's happening"}</p>
        </div>
      </div>

      <AiNudge hasKey={hasKey} isEmpty={isEmpty} />

      <BackupNudge isEmpty={isEmpty} />

      <ProactiveAlerts transactions={transactions} budgets={budgets} />

      {!dismissed && (briefText || briefLoading) && (
        <div className="border border-border p-4" data-testid="morning-brief">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-foreground">Morning Brief</span>
            <div className="flex items-center gap-2">
              <button onClick={() => generateBrief()} disabled={briefLoading}
                className="text-muted-foreground hover:text-foreground text-xs transition-colors disabled:opacity-50">Refresh</button>
              <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground text-xs transition-colors">Dismiss</button>
            </div>
          </div>
          {briefLoading ? (
            <div className="space-y-2" data-testid="brief-loading">
              <div className="h-3 bg-secondary animate-pulse w-3/4" />
              <div className="h-3 bg-secondary animate-pulse w-1/2" />
            </div>
          ) : (
            <p className="text-muted-foreground text-sm leading-relaxed">{briefText}</p>
          )}
        </div>
      )}
      {briefError && <p className="text-red-400 text-xs">{briefError}</p>}

      <WeeklyDigest />

      {isEmpty && (
        <div className="space-y-6">
          <div className="border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground" data-testid="onboarding-welcome">Welcome to Helios</h2>
            <p className="text-muted-foreground text-sm mt-1">Your personal command center — 27 features, all local, all private.</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">Quick Start</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-border">
              {[
                { title: 'Plan Your Day', desc: 'Schedule tasks, time blocks, and priorities', to: '/planner' },
                { title: 'Track Finances', desc: 'Accounts, budgets, and spending analytics', to: '/finance' },
                { title: 'Set Goals', desc: 'OKRs and goal tracking with progress metrics', to: '/goals' },
                { title: 'Build Habits', desc: 'Daily habit streaks and consistency tracking', to: '/health' },
                { title: 'Study with Flashcards', desc: 'Spaced repetition for learning anything', to: '/flashcards' },
                { title: 'Manage Contacts', desc: 'CRM-style networking and relationship notes', to: '/networking' },
                { title: 'AI Assistant', desc: 'Chat with AI connected to all your data', to: '/ai', needsKey: true },
                { title: 'Track Meals', desc: 'Nutrition and wellness logging', to: '/meals' },
              ].map((card) => (
                <Link key={card.to} to={card.to} data-testid="feature-card"
                  className="block bg-background p-4 min-h-[44px] hover:bg-secondary/30 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{card.title}</p>
                    {card.needsKey && !hasKey && (
                      <span className="text-[10px] text-muted-foreground border border-border px-1.5 py-0.5 shrink-0 whitespace-nowrap" data-testid="api-key-badge">API key required</span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs mt-1">{card.desc}</p>
                </Link>
              ))}
            </div>
          </div>

          <p className="text-muted-foreground text-xs text-center">All data stays on your device. Nothing leaves your browser.</p>
        </div>
      )}

      <TodayFocusCard />

      <ProductivityStreak />

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

      {sportsGameCount !== null && (
        <div className="border border-border p-4" data-testid="sports-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-foreground font-medium text-sm">Sports</h3>
            <Link to="/sports" className="text-xs text-muted-foreground hover:text-foreground transition-colors">View</Link>
          </div>
          <div>
            <p className="text-2xl font-semibold text-green-400">{sportsGameCount}</p>
            <p className="text-muted-foreground/60 text-xs mt-1">games today</p>
          </div>
        </div>
      )}

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
