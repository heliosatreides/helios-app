import { EmptyState } from '../../components/ui';

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
      <EmptyState title="Add your first account to get started" description="Track checking, savings, credit cards, and more." />
    );
  }

  return (
    <div className="space-y-4">
      {/* Net Worth */}
      <div className="bg-gradient-to-br from-amber-900/20 to-[#111113] border border-border p-5">
        <p className="text-muted-foreground text-sm mb-1">Net Worth</p>
        <p className={`text-3xl font-bold ${netWorth >= 0 ? 'text-foreground' : 'text-red-400'}`}>
          {netWorth < 0 ? '-' : ''}${Math.abs(netWorth).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>

      {/* Account list */}
      <div className="space-y-2">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="bg-background border border-border p-4 flex items-center justify-between"
          >
            <div>
              <p className="text-foreground font-medium">{account.name}</p>
              <p className={`text-sm ${typeColors[account.type] || 'text-muted-foreground'}`}>{account.type}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`font-semibold ${account.balance < 0 ? 'text-red-400' : 'text-foreground'}`}>
                {account.balance < 0 ? '-' : ''}${Math.abs(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <button
                data-testid={`edit-account-${account.id}`}
                onClick={() => onEdit(account)}
                className="text-muted-foreground hover:text-foreground transition-colors text-sm px-2 py-1"
              >
                Edit
              </button>
              <button
                data-testid={`delete-account-${account.id}`}
                onClick={() => onDelete(account.id)}
                className="text-muted-foreground hover:text-red-400 transition-colors text-sm px-2 py-1"
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
