export function BudgetView({ budgets, transactions, month }) {
  if (budgets.length === 0) {
    return (
      <div className="text-center py-12 text-[#71717a]">
        <p className="text-lg">No budget set yet.</p>
        <p className="text-sm mt-1">Add a budget category to get started.</p>
      </div>
    );
  }

  // Only count expenses for the given month
  const monthlyExpenses = transactions.filter(
    (t) => t.type === 'expense' && t.date.startsWith(month)
  );

  return (
    <div className="space-y-3">
      {budgets.map((budget) => {
        const spent = monthlyExpenses
          .filter((t) => t.category === budget.category)
          .reduce((sum, t) => sum + t.amount, 0);
        const pct = budget.limit > 0 ? Math.min((spent / budget.limit) * 100, 100) : 0;
        const isOver = spent > budget.limit;

        return (
          <div
            key={budget.category}
            data-testid={`budget-row-${budget.category}`}
            className={`bg-[#111113] border rounded-xl p-4 ${isOver ? 'border-red-500/60 over-budget' : 'border-[#27272a]'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`font-medium ${isOver ? 'text-red-400' : 'text-[#e4e4e7]'}`}>
                {budget.category}
              </span>
              <span className="text-sm text-[#71717a]">
                <span className={isOver ? 'text-red-400 font-semibold' : 'text-[#e4e4e7]'}>
                  ${spent.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
                {' / '}
                <span>${budget.limit.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
              </span>
            </div>
            <div className="h-2 bg-[#27272a] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isOver ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-[#f59e0b]'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {isOver && (
              <p className="text-red-400 text-xs mt-1">
                Over budget by ${(spent - budget.limit).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
