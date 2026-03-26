import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTasks, groupTasks, getTodayStr } from '../hooks/useTasks';
import { useIDB } from '../hooks/useIDB';

function daysUntil(dateStr, todayStr) {
  // Use string-based date math to avoid timezone issues
  const todayParts = todayStr.split('-').map(Number);
  const dateParts = dateStr.split('-').map(Number);
  const todayMs = Date.UTC(todayParts[0], todayParts[1] - 1, todayParts[2]);
  const dateMs = Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2]);
  return Math.round((dateMs - todayMs) / (1000 * 60 * 60 * 24));
}

function AlertChip({ children, variant = 'default', to }) {
  const colors = {
    red: 'border-red-900 bg-red-950/50 text-red-400',
    amber: 'border-amber-900 bg-amber-950/50 text-amber-400',
    default: 'border-border bg-secondary/30 text-muted-foreground',
  };
  const cls = `inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border ${colors[variant] || colors.default}`;
  if (to) return <Link to={to} className={`${cls} hover:brightness-125 transition-all`}>{children}</Link>;
  return <span className={cls}>{children}</span>;
}

export function ProactiveAlerts({ transactions = [], budgets = [] }) {
  const { tasks } = useTasks();
  const [subs] = useIDB('subscriptions', []);
  const today = getTodayStr();

  const alerts = useMemo(() => {
    const items = [];

    // 1. Overdue tasks
    try {
      const grouped = groupTasks(tasks, today);
      const overdueCount = grouped.overdue.length;
      if (overdueCount > 0) {
        items.push({
          id: 'overdue-tasks',
          variant: 'red',
          to: '/planner',
          text: `${overdueCount} overdue task${overdueCount > 1 ? 's' : ''}`,
        });
      }
    } catch { /* no tasks yet */ }

    // 2. Subscriptions renewing within 3 days
    if (Array.isArray(subs)) {
      const upcoming = subs.filter((s) => {
        if (!s.nextDate) return false;
        const days = daysUntil(s.nextDate, today);
        return days >= 0 && days <= 3;
      });
      upcoming.forEach((s) => {
        const days = daysUntil(s.nextDate, today);
        const when = days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`;
        items.push({
          id: `sub-${s.id}`,
          variant: 'amber',
          to: '/subscriptions',
          text: `${s.name} renews ${when}`,
        });
      });
    }

    // 3. Budget categories over 80%
    if (budgets.length > 0 && transactions.length > 0) {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const monthlyExpenses = transactions.filter(
        (t) => t.type === 'expense' && t.date && t.date.startsWith(currentMonth)
      );
      budgets.forEach((b) => {
        if (!b.limit || b.limit <= 0) return;
        const spent = monthlyExpenses
          .filter((t) => t.category === b.category)
          .reduce((s, t) => s + t.amount, 0);
        const pct = Math.round((spent / b.limit) * 100);
        if (pct >= 80) {
          items.push({
            id: `budget-${b.category}`,
            variant: pct >= 100 ? 'red' : 'amber',
            to: '/finance?tab=Budget',
            text: `${b.category} budget at ${pct}%`,
          });
        }
      });
    }

    return items;
  }, [tasks, today, subs, transactions, budgets]);

  if (alerts.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2" data-testid="proactive-alerts">
      {alerts.map((a) => (
        <AlertChip key={a.id} variant={a.variant} to={a.to}>
          {a.text}
        </AlertChip>
      ))}
    </div>
  );
}
