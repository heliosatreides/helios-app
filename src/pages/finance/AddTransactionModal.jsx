import { useState } from 'react';
import { Modal } from '../../components/Modal';

const CATEGORIES = ['Food', 'Transport', 'Housing', 'Entertainment', 'Health', 'Shopping', 'Salary', 'Other'];

export function AddTransactionModal({ accounts, onSave, onClose }) {
  const today = new Date().toISOString().slice(0, 10);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState(today);
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [type, setType] = useState('expense');

  function handleSubmit(e) {
    e.preventDefault();
    onSave({
      amount: parseFloat(amount) || 0,
      description,
      category,
      date,
      accountId,
      type,
    });
  }

  return (
    <Modal open={true} onClose={onClose}>
      <h2 className="text-foreground text-lg font-semibold mb-5">Add Transaction</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="tx-amount" className="block text-muted-foreground text-sm mb-1">Amount</label>
          <input
            id="tx-amount"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="w-full bg-background border border-border px-3 py-2 text-foreground focus:outline-none focus:border-[#f59e0b]"
          />
        </div>
        <div>
          <label htmlFor="tx-description" className="block text-muted-foreground text-sm mb-1">Description</label>
          <input
            id="tx-description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="w-full bg-background border border-border px-3 py-2 text-foreground focus:outline-none focus:border-[#f59e0b]"
          />
        </div>
        <div>
          <label htmlFor="tx-category" className="block text-muted-foreground text-sm mb-1">Category</label>
          <select
            id="tx-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-background border border-border px-3 py-2 text-foreground focus:outline-none focus:border-[#f59e0b]"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="tx-account" className="block text-muted-foreground text-sm mb-1">Account</label>
          <select
            id="tx-account"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full bg-background border border-border px-3 py-2 text-foreground focus:outline-none focus:border-[#f59e0b]"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="tx-date" className="block text-muted-foreground text-sm mb-1">Date</label>
          <input
            id="tx-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-background border border-border px-3 py-2 text-foreground focus:outline-none focus:border-[#f59e0b]"
          />
        </div>
        <div>
          <label htmlFor="tx-type" className="block text-muted-foreground text-sm mb-1">Type</label>
          <select
            id="tx-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full bg-background border border-border px-3 py-2 text-foreground focus:outline-none focus:border-[#f59e0b]"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
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
    </Modal>
  );
}
