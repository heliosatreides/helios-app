import { useState } from 'react';
import { Modal } from '../../components/Modal';

const CATEGORIES = ['Food', 'Transport', 'Housing', 'Entertainment', 'Health', 'Shopping', 'Other'];

export function BudgetForm({ budget, onSave, onClose }) {
  const [category, setCategory] = useState(budget?.category || 'Food');
  const [limit, setLimit] = useState(budget?.limit !== undefined ? String(budget.limit) : '');

  function handleSubmit(e) {
    e.preventDefault();
    onSave({ category, limit: parseFloat(limit) || 0 });
  }

  return (
    <Modal open={true} onClose={onClose} className="max-w-sm">
      <h2 className="text-foreground text-lg font-semibold mb-5">
        {budget ? 'Edit Budget' : 'Set Budget'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="budget-category" className="block text-muted-foreground text-sm mb-1">Category</label>
          <select
            id="budget-category"
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
          <label htmlFor="budget-limit" className="block text-muted-foreground text-sm mb-1">Monthly Limit ($)</label>
          <input
            id="budget-limit"
            type="number"
            min="0"
            step="1"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            required
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
    </Modal>
  );
}
