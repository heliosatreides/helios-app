import { useState } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { createWatchlistItem } from './investments.utils';

function AddWatchForm({ onAdd, onCancel }) {
  const [form, setForm] = useState({ ticker: '', name: '', targetPrice: '', notes: '' });
  const set = (f) => (e) => setForm((prev) => ({ ...prev, [f]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.ticker) return;
    onAdd(createWatchlistItem(form));
    setForm({ ticker: '', name: '', targetPrice: '', notes: '' });
  };

  const inputCls = 'bg-[#0a0a0b] border border-[#27272a] rounded-lg px-3 py-2 text-[#e4e4e7] text-sm placeholder-[#52525b] focus:outline-none focus:border-[#f59e0b] w-full';

  return (
    <form onSubmit={handleSubmit} className="bg-[#111113] border border-[#27272a] rounded-xl p-5 space-y-4">
      <h3 className="text-[#e4e4e7] font-semibold">Add to Watchlist</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[#71717a] text-xs mb-1 block">Ticker *</label>
          <input className={inputCls} placeholder="NVDA" value={form.ticker} onChange={set('ticker')} required />
        </div>
        <div>
          <label className="text-[#71717a] text-xs mb-1 block">Name</label>
          <input className={inputCls} placeholder="Nvidia" value={form.name} onChange={set('name')} />
        </div>
        <div>
          <label className="text-[#71717a] text-xs mb-1 block">Target Buy Price</label>
          <input className={inputCls} type="number" step="any" min="0" placeholder="500.00" value={form.targetPrice} onChange={set('targetPrice')} />
        </div>
        <div>
          <label className="text-[#71717a] text-xs mb-1 block">Notes</label>
          <input className={inputCls} placeholder="Why watching..." value={form.notes} onChange={set('notes')} />
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="submit" className="bg-[#f59e0b] hover:bg-amber-400 text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
          Add to Watchlist
        </button>
        <button type="button" onClick={onCancel} className="border border-[#27272a] text-[#71717a] hover:text-[#e4e4e7] px-4 py-2 rounded-lg text-sm transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}

export function Watchlist() {
  const [items, setItems] = useLocalStorage('investments-watchlist', []);
  const [showAdd, setShowAdd] = useState(false);

  const addItem = (item) => {
    setItems((prev) => [...prev, item]);
    setShowAdd(false);
  };

  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));

  const toggleStatus = (id) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, status: i.status === 'watching' ? 'bought' : 'watching' } : i
      )
    );
  };

  const watching = items.filter((i) => i.status === 'watching');
  const bought = items.filter((i) => i.status === 'bought');

  const ItemCard = ({ item }) => (
    <div className="bg-[#111113] border border-[#27272a] rounded-xl p-4 flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold text-[#f59e0b]">{item.ticker}</span>
          {item.name && <span className="text-[#71717a] text-sm">{item.name}</span>}
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ml-auto ${
            item.status === 'watching' ? 'bg-amber-900/30 text-amber-400' : 'bg-green-900/30 text-green-400'
          }`}>
            {item.status === 'watching' ? '👀 Watching' : '✅ Bought'}
          </span>
        </div>
        {item.targetPrice && (
          <p className="text-[#a1a1aa] text-xs">Target: ${Number(item.targetPrice).toFixed(2)}</p>
        )}
        {item.notes && <p className="text-[#71717a] text-xs mt-1 truncate">{item.notes}</p>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => toggleStatus(item.id)}
          className="text-xs border border-[#27272a] text-[#a1a1aa] hover:text-[#e4e4e7] px-2 py-1 rounded-lg transition-colors"
          title={item.status === 'watching' ? 'Mark as bought' : 'Mark as watching'}
        >
          {item.status === 'watching' ? 'Mark Bought' : 'Unmark'}
        </button>
        <button
          onClick={() => removeItem(item.id)}
          className="text-[#52525b] hover:text-red-400 text-xs transition-colors"
          aria-label={`Remove ${item.ticker}`}
        >
          ✕
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {showAdd ? (
        <AddWatchForm onAdd={addItem} onCancel={() => setShowAdd(false)} />
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="bg-[#f59e0b] hover:bg-amber-400 text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
        >
          + Add to Watchlist
        </button>
      )}

      {items.length === 0 ? (
        <div className="text-center py-10 text-[#71717a]">
          <div className="text-4xl mb-3">👀</div>
          <p className="text-[#e4e4e7] mb-1">Your watchlist is empty</p>
          <p className="text-sm">Add tickers to watch for your next investment opportunity.</p>
        </div>
      ) : (
        <>
          {watching.length > 0 && (
            <div>
              <h3 className="text-[#71717a] text-xs font-medium uppercase tracking-wider mb-3">
                Watching ({watching.length})
              </h3>
              <div className="space-y-2">
                {watching.map((i) => <ItemCard key={i.id} item={i} />)}
              </div>
            </div>
          )}
          {bought.length > 0 && (
            <div>
              <h3 className="text-[#71717a] text-xs font-medium uppercase tracking-wider mb-3">
                Bought ({bought.length})
              </h3>
              <div className="space-y-2">
                {bought.map((i) => <ItemCard key={i.id} item={i} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
