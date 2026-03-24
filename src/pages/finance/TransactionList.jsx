export function TransactionList({ transactions, accounts, onDelete, filterAccountId, filterCategory, filterDateFrom, filterDateTo }) {
  const accountMap = Object.fromEntries(accounts.map((a) => [a.id, a]));

  let filtered = transactions;
  if (filterAccountId) filtered = filtered.filter((t) => t.accountId === filterAccountId);
  if (filterCategory) filtered = filtered.filter((t) => t.category === filterCategory);
  if (filterDateFrom) filtered = filtered.filter((t) => t.date >= filterDateFrom);
  if (filterDateTo) filtered = filtered.filter((t) => t.date <= filterDateTo);

  // Sort by date descending, then by id descending for same-date stability
  filtered = [...filtered].sort((a, b) => {
    const dateDiff = b.date.localeCompare(a.date);
    if (dateDiff !== 0) return dateDiff;
    return (b.id || '').localeCompare(a.id || '');
  });

  // Compute running balance (oldest → newest, then reverse to show latest first)
  const ascending = [...filtered].reverse();
  let balance = 0;
  const balanceMap = {};
  ascending.forEach((tx) => {
    balance += tx.type === 'income' ? tx.amount : -tx.amount;
    balanceMap[tx.id] = balance;
  });

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
      {filtered.map((tx) => {
        const runningBalance = balanceMap[tx.id];
        return (
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
              <div className="text-right">
                <span className={`font-semibold tabular-nums block ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                  {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span
                  className={`text-xs tabular-nums ${runningBalance >= 0 ? 'text-[#52525b]' : 'text-red-400/60'}`}
                  data-testid={`running-balance-${tx.id}`}
                  aria-label={`Balance: ${runningBalance >= 0 ? '' : '-'}$${Math.abs(runningBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                >
                  bal:{runningBalance >= 0 ? '' : '-'}${Math.abs(runningBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <button
                data-testid={`delete-transaction-${tx.id}`}
                onClick={() => onDelete(tx.id)}
                className="text-[#71717a] hover:text-red-400 transition-colors text-sm px-2 py-1"
              >
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
