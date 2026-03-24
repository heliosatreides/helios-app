import { useState } from 'react';
import { useGemini } from '../../hooks/useGemini';

export function BudgetView({ budgets, transactions, month }) {
  const { generate, loading: aiLoading, hasKey } = useGemini();
  const [savingsResult, setSavingsResult] = useState(null);
  const [savingsError, setSavingsError] = useState(null);

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

  const handleFindSavings = async () => {
    setSavingsResult(null);
    setSavingsError(null);
    const categories = budgets.map((b) => {
      const spent = monthlyExpenses
        .filter((t) => t.category === b.category)
        .reduce((sum, t) => sum + t.amount, 0);
      return `${b.category}: $${spent.toFixed(0)}`;
    }).join(', ');
    try {
      const text = await generate(
        `Here are my monthly spending totals by category: ${categories}. Suggest 3 specific ways I could reduce spending, with estimated savings.`
      );
      setSavingsResult(text);
    } catch (err) {
      setSavingsError(err.message);
    }
  };

  // Sort categories: over-budget first (by overage descending), then by % used descending
  const sortedBudgets = [...budgets].sort((a, b) => {
    const spentA = monthlyExpenses.filter((t) => t.category === a.category).reduce((s, t) => s + t.amount, 0);
    const spentB = monthlyExpenses.filter((t) => t.category === b.category).reduce((s, t) => s + t.amount, 0);
    const overA = spentA - a.limit;
    const overB = spentB - b.limit;
    // Over-budget items first
    if (overA > 0 && overB <= 0) return -1;
    if (overB > 0 && overA <= 0) return 1;
    // Both over or both under: sort by % used descending
    const pctA = a.limit > 0 ? spentA / a.limit : 0;
    const pctB = b.limit > 0 ? spentB / b.limit : 0;
    return pctB - pctA;
  });

  return (
    <div className="space-y-3">
      {hasKey && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleFindSavings}
            disabled={aiLoading}
            className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            data-testid="find-savings-btn"
          >
            {aiLoading ? '⏳ Analyzing…' : '✨ Find Savings'}
          </button>
        </div>
      )}

      {savingsError && (
        <p className="text-red-400 text-xs">❌ {savingsError}</p>
      )}

      {savingsResult && (
        <div className="border border-amber-500/20 bg-amber-500/5 rounded-2xl p-5" data-testid="savings-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-amber-400 text-sm font-semibold">✨ Savings Suggestions</span>
            <button
              type="button"
              onClick={() => setSavingsResult(null)}
              className="text-[#52525b] hover:text-[#e4e4e7] text-xs"
            >
              Dismiss
            </button>
          </div>
          <p className="text-[#e4e4e7] text-sm whitespace-pre-wrap">{savingsResult}</p>
        </div>
      )}

      {sortedBudgets.map((budget) => {
        const spent = monthlyExpenses
          .filter((t) => t.category === budget.category)
          .reduce((sum, t) => sum + t.amount, 0);
        const pct = budget.limit > 0 ? Math.min((spent / budget.limit) * 100, 100) : 0;
        const isOver = spent > budget.limit;

        return (
          <div
            key={budget.category}
            data-testid={`budget-row-${budget.category}`}
            className={`bg-[#111113] border rounded-xl p-4 ${isOver ? 'border-red-500/60 over-budget' : 'border-[#1c1c20]'}`}
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
