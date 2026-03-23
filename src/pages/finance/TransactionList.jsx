export function TransactionList({ transactions, accounts, onDelete, filterAccountId, filterCategory, filterDateFrom, filterDateTo }) {
  const accountMap = Object.fromEntries(accounts.map((a) => [a.id, a]));

  let filtered = transactions;
  if (filterAccountId) filtered = filtered.filter((t) => t.accountId === filterAccountId);
  if (filterCategory) filtered = filtered.filter((t) => t.category === filterCategory);
  if (filterDateFrom) filtered = filtered.filter((t) => t.date >= filterDateFrom);
  if (filterDateTo) filtered = filtered.filter((t) => t.date <= filterDateTo);

  // Sort by date descending
  filtered = [...filtered].sort((a, b) => b.date.localeCompare(a.date));

  if (filtered.length === 0) {
    return (
      <div className="text-center py-12 text-[#71717a]">
        <p className="text-lg">No transactions yet.</p>
        <p className="text-sm mt-1">Log a transaction to see it here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {filtered.map((tx) => (
        <div
          key={tx.id}
          className="bg-[#111113] border border-[#27272a] rounded-xl p-4 flex items-center justify-between"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[#e4e4e7] font-medium truncate">{tx.description}</p>
              <span className="text-xs text-[#71717a] bg-[#0a0a0b] border border-[#27272a] rounded px-2 py-0.5 shrink-0">
                {tx.category}
              </span>
            </div>
            <p className="text-[#71717a] text-xs mt-1">
              {accountMap[tx.accountId]?.name || 'Unknown'} · {tx.date}
            </p>
          </div>
          <div className="flex items-center gap-3 ml-4">
            <span className={`font-semibold tabular-nums ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
              {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <button
              data-testid={`delete-transaction-${tx.id}`}
              onClick={() => onDelete(tx.id)}
              className="text-[#71717a] hover:text-red-400 transition-colors text-sm px-2 py-1"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
