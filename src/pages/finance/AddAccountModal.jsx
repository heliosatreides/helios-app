import { useState } from 'react';

const ACCOUNT_TYPES = ['Checking', 'Savings', 'Credit Card', 'Investment'];

export function AddAccountModal({ account, onSave, onClose }) {
  const [name, setName] = useState(account?.name || '');
  const [type, setType] = useState(account?.type || 'Checking');
  const [balance, setBalance] = useState(account?.balance !== undefined ? String(account.balance) : '0');
  const [currency, setCurrency] = useState(account?.currency || 'USD');

  function handleSubmit(e) {
    e.preventDefault();
    onSave({
      ...(account || {}),
      name,
      type,
      balance: parseFloat(balance) || 0,
      currency,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border p-6 w-full max-w-md">
        <h2 className="text-foreground text-lg font-semibold mb-5">
          {account ? 'Edit Account' : 'Add Account'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="account-name" className="block text-muted-foreground text-sm mb-1">Name</label>
            <input
              id="account-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-background border border-border px-3 py-2 text-foreground focus:outline-none focus:border-[#f59e0b]"
            />
          </div>
          <div>
            <label htmlFor="account-type" className="block text-muted-foreground text-sm mb-1">Type</label>
            <select
              id="account-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-background border border-border px-3 py-2 text-foreground focus:outline-none focus:border-[#f59e0b]"
            >
              {ACCOUNT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="account-balance" className="block text-muted-foreground text-sm mb-1">Balance</label>
            <input
              id="account-balance"
              type="number"
              step="0.01"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="w-full bg-background border border-border px-3 py-2 text-foreground focus:outline-none focus:border-[#f59e0b]"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-foreground hover:bg-foreground/90 text-black font-semibold transition-all shadow-sm shadow-amber-500/10"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
