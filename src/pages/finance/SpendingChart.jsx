/**
 * SpendingChart — Monthly spending breakdown by category
 * Pure CSS bar chart, no external deps.
 */

const CATEGORY_COLORS = [
  '#f59e0b', // amber
  '#3b82f6', // blue
  '#10b981', // emerald
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#ef4444', // red
  '#06b6d4', // cyan
  '#f97316', // orange
  '#a3e635', // lime
  '#e879f9', // fuchsia
];

/**
 * Aggregate expenses by category for a given month (YYYY-MM).
 * Returns array sorted descending by amount, each row:
 *   { category, amount, pct }
 */
export function buildCategorySpend(transactions, month) {
  const totals = {};
  for (const tx of transactions) {
    if (tx.type !== 'expense') continue;
    if (!tx.date.startsWith(month)) continue;
    totals[tx.category] = (totals[tx.category] || 0) + tx.amount;
  }

  const rows = Object.entries(totals).map(([category, amount]) => ({ category, amount }));
  rows.sort((a, b) => b.amount - a.amount);

  const max = rows.length > 0 ? rows[0].amount : 0;
  return rows.map((r) => ({
    ...r,
    pct: max > 0 ? Math.round((r.amount / max) * 100) : 0,
  }));
}

/**
 * SpendingChart component
 * Props:
 *   transactions: array
 *   month: string YYYY-MM
 *   budgets: optional array of { category, limit }
 */
export function SpendingChart({ transactions = [], month, budgets = [] }) {
  const rows = buildCategorySpend(transactions, month);
  const budgetMap = Object.fromEntries((budgets || []).map((b) => [b.category, b.limit]));

  if (rows.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-10 text-center"
        data-testid="spending-chart-empty"
      >
        <div className="text-4xl mb-3">📊</div>
        <p className="text-muted-foreground text-sm">No expense data for this month.</p>
        <p className="text-muted-foreground/60 text-xs mt-1">Add transactions to see your spending breakdown.</p>
      </div>
    );
  }

  const total = rows.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm font-medium">Spending by category</p>
        <p className="text-foreground font-bold tabular-nums" data-testid="total-spend">
          ${total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </p>
      </div>

      {/* Bars */}
      <div className="space-y-3">
        {rows.map((row, i) => {
          const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
          const limit = budgetMap[row.category];
          const isOver = limit != null && row.amount > limit;

          return (
            <div
              key={row.category}
              className="space-y-1"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{row.category}</span>
                <div className="flex items-center gap-2">
                  {isOver && (
                    <span className="text-red-400 text-xs">over budget</span>
                  )}
                  <span className="text-foreground font-medium tabular-nums">
                    ${row.amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-muted-foreground/60 text-xs w-8 text-right">{row.pct}%</span>
                </div>
              </div>

              {/* Bar track */}
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  data-testid={`spend-bar-${row.category}`}
                  className={`h-full rounded-full transition-all ${isOver ? 'over-budget' : ''}`}
                  style={{
                    width: `${row.pct}%`,
                    backgroundColor: isOver ? '#ef4444' : color,
                  }}
                />
              </div>

              {/* Budget marker line if budget exists */}
              {limit != null && (
                <div className="relative h-0">
                  {/* Show budget position as a thin marker */}
                  <div
                    className="absolute top-[-10px] w-0.5 h-3 bg-amber-400/70 rounded"
                    style={{
                      left: `${Math.min(100, Math.round((limit / rows[0].amount) * 100))}%`,
                    }}
                    title={`Budget: $${limit}`}
                    aria-label={`Budget limit: $${limit}`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mini legend note */}
      {budgets.length > 0 && (
        <p className="text-muted-foreground/50 text-xs">
          <span className="inline-block w-2 h-2 bg-amber-400/70 rounded mr-1 align-middle" />
          Budget limit marker
        </p>
      )}
    </div>
  );
}
