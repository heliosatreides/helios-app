export function AccountList({ accounts, onEdit, onDelete }) {
  const netWorth = accounts.reduce((sum, a) => sum + a.balance, 0);

  const typeColors = {
    Checking: 'text-blue-400',
    Savings: 'text-green-400',
    'Credit Card': 'text-red-400',
    Investment: 'text-purple-400',
  };

  if (accounts.length === 0) {
    return (
      <div className="text-center py-12 text-[#71717a]">
        <div className="text-5xl mb-4">💰</div>
        <p className="text-lg text-[#e4e4e7] mb-2">Add your first account to get started</p>
        <p className="text-sm">Track checking, savings, credit cards, and more.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Net Worth */}
      <div className="bg-gradient-to-br from-amber-900/20 to-[#111113] border border-[#27272a] rounded-xl p-5">
        <p className="text-[#71717a] text-sm mb-1">Net Worth</p>
        <p className={`text-3xl font-bold ${netWorth >= 0 ? 'text-[#f59e0b]' : 'text-red-400'}`}>
          {netWorth < 0 ? '-' : ''}${Math.abs(netWorth).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>

      {/* Account list */}
      <div className="space-y-2">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="bg-[#111113] border border-[#27272a] rounded-xl p-4 flex items-center justify-between"
          >
            <div>
              <p className="text-[#e4e4e7] font-medium">{account.name}</p>
              <p className={`text-sm ${typeColors[account.type] || 'text-[#71717a]'}`}>{account.type}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`font-semibold ${account.balance < 0 ? 'text-red-400' : 'text-[#e4e4e7]'}`}>
                {account.balance < 0 ? '-' : ''}${Math.abs(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <button
                data-testid={`edit-account-${account.id}`}
                onClick={() => onEdit(account)}
                className="text-[#71717a] hover:text-[#f59e0b] transition-colors text-sm px-2 py-1"
              >
                Edit
              </button>
              <button
                data-testid={`delete-account-${account.id}`}
                onClick={() => onDelete(account.id)}
                className="text-[#71717a] hover:text-red-400 transition-colors text-sm px-2 py-1"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
