import { useState } from 'react';
import { useIDB } from '../../hooks/useIDB';
import { useGemini } from '../../hooks/useGemini';

const CATEGORIES = ['streaming', 'software', 'fitness', 'food', 'other'];
const CATEGORY_ICONS = { streaming: '📺', software: '💻', fitness: '🏋️', food: '🍔', other: '📦' };

function fmt(n) { return `$${Number(n).toFixed(2)}`; }

function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return Math.round((d - today) / (1000 * 60 * 60 * 24));
}

export function SubscriptionsPage() {
  const [subs, setSubs] = useIDB('subscriptions', []);
  const [showForm, setShowForm] = useState(false);
  const [sortBy, setSortBy] = useState('nextDate'); // 'cost' | 'nextDate'
  const [aiSuggestion, setAiSuggestion] = useState('');
  const { generate, loading, error } = useGemini();

  const [form, setForm] = useState({
    name: '', cost: '', cycle: 'monthly', nextDate: '', category: 'streaming',
  });

  function addSub() {
    if (!form.name.trim() || !form.cost || !form.nextDate) return;
    setSubs(prev => [...prev, {
      id: Date.now().toString(),
      name: form.name.trim(),
      cost: parseFloat(form.cost),
      cycle: form.cycle,
      nextDate: form.nextDate,
      category: form.category,
    }]);
    setForm({ name: '', cost: '', cycle: 'monthly', nextDate: '', category: 'streaming' });
    setShowForm(false);
  }

  function deleteSub(id) {
    setSubs(prev => prev.filter(s => s.id !== id));
  }

  const monthlyCost = subs.reduce((acc, s) => acc + (s.cycle === 'annual' ? s.cost / 12 : s.cost), 0);
  const annualCost = subs.reduce((acc, s) => acc + (s.cycle === 'annual' ? s.cost : s.cost * 12), 0);

  const sorted = [...subs].sort((a, b) => {
    if (sortBy === 'cost') return b.cost - a.cost;
    return new Date(a.nextDate) - new Date(b.nextDate);
  });

  async function suggestCancellations() {
    const list = subs.map(s => `- ${s.name}: ${fmt(s.cost)}/${s.cycle} (${s.category})`).join('\n');
    const resp = await generate(`You are a personal finance advisor. Review this subscription list and suggest which 1-3 subscriptions are likely lowest value:\n${list}\n\nBe concise and direct. Give practical reasons. 3-4 sentences max.`);
    setAiSuggestion(resp);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#e4e4e7]">📋 Subscription Tracker</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-amber-500 text-black rounded-lg font-semibold text-sm hover:bg-amber-400">
          {showForm ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#0c0c0e] border border-[#1c1c20] rounded-xl p-4">
          <div className="text-xs text-[#71717a] mb-1">Monthly Total</div>
          <div className="text-2xl font-bold text-amber-400">{fmt(monthlyCost)}</div>
        </div>
        <div className="bg-[#0c0c0e] border border-[#1c1c20] rounded-xl p-4">
          <div className="text-xs text-[#71717a] mb-1">Annual Total</div>
          <div className="text-2xl font-bold text-amber-400">{fmt(annualCost)}</div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-[#0c0c0e] border border-[#1c1c20] rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-[#a1a1aa]">New Subscription</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#71717a] mb-1">Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Netflix" className="w-full bg-[#18181b] border border-[#1c1c20] rounded-lg px-3 py-2 text-[#e4e4e7] text-sm outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="block text-xs text-[#71717a] mb-1">Cost ($)</label>
              <input type="number" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} placeholder="15.99" className="w-full bg-[#18181b] border border-[#1c1c20] rounded-lg px-3 py-2 text-[#e4e4e7] text-sm outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="block text-xs text-[#71717a] mb-1">Billing Cycle</label>
              <select value={form.cycle} onChange={e => setForm(f => ({ ...f, cycle: e.target.value }))} className="w-full bg-[#18181b] border border-[#1c1c20] rounded-lg px-3 py-2 text-[#e4e4e7] text-sm outline-none focus:border-amber-500">
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#71717a] mb-1">Next Billing Date</label>
              <input type="date" value={form.nextDate} onChange={e => setForm(f => ({ ...f, nextDate: e.target.value }))} className="w-full bg-[#18181b] border border-[#1c1c20] rounded-lg px-3 py-2 text-[#e4e4e7] text-sm outline-none focus:border-amber-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-[#71717a] mb-1">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full bg-[#18181b] border border-[#1c1c20] rounded-lg px-3 py-2 text-[#e4e4e7] text-sm outline-none focus:border-amber-500">
                {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_ICONS[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <button onClick={addSub} className="w-full py-2.5 bg-amber-500 text-black font-semibold rounded-lg hover:bg-amber-400">Add Subscription</button>
        </div>
      )}

      {/* Controls */}
      {subs.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#71717a]">Sort:</span>
          <button onClick={() => setSortBy('cost')} className={`px-3 py-1 rounded-lg text-xs ${sortBy === 'cost' ? 'bg-amber-500 text-black' : 'bg-[#27272a] text-[#a1a1aa]'}`}>Cost ↓</button>
          <button onClick={() => setSortBy('nextDate')} className={`px-3 py-1 rounded-lg text-xs ${sortBy === 'nextDate' ? 'bg-amber-500 text-black' : 'bg-[#27272a] text-[#a1a1aa]'}`}>Next Date</button>
        </div>
      )}

      {/* List */}
      {sorted.length === 0 ? (
        <div className="text-center py-16 text-[#52525b]">No subscriptions yet. Start tracking your recurring expenses!</div>
      ) : (
        <div className="space-y-3">
          {sorted.map(sub => {
            const days = daysUntil(sub.nextDate);
            const renewalSoon = days >= 0 && days <= 7;
            return (
              <div key={sub.id} className={`bg-[#111113] border rounded-xl p-4 flex items-center gap-4 ${renewalSoon ? 'border-amber-500/50' : 'border-[#1c1c20]'}`}>
                <span className="text-2xl">{CATEGORY_ICONS[sub.category]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#e4e4e7]">{sub.name}</span>
                    {renewalSoon && <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">Renews in {days}d</span>}
                  </div>
                  <div className="text-sm text-[#71717a]">{fmt(sub.cost)}/{sub.cycle} · {sub.nextDate}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-amber-400">{fmt(sub.cycle === 'annual' ? sub.cost / 12 : sub.cost)}/mo</div>
                  <div className="text-xs text-[#52525b]">{fmt(sub.cycle === 'monthly' ? sub.cost * 12 : sub.cost)}/yr</div>
                </div>
                <button onClick={() => deleteSub(sub.id)} className="text-[#52525b] hover:text-red-400 ml-2">✕</button>
              </div>
            );
          })}
        </div>
      )}

      {/* AI */}
      {subs.length > 0 && (
        <div className="bg-[#0c0c0e] border border-[#1c1c20] rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold text-[#a1a1aa]">✨ AI Advisor</h2>
          <button onClick={suggestCancellations} disabled={loading} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-500 disabled:opacity-50">
            {loading ? 'Analyzing...' : 'Which should I cancel?'}
          </button>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {aiSuggestion && <p className="text-sm text-[#a1a1aa] leading-relaxed whitespace-pre-wrap">{aiSuggestion}</p>}
        </div>
      )}
    </div>
  );
}
