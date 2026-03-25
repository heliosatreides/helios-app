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

  function addSub(e) {
    if (e) e.preventDefault();
    const name = form.name.trim();
    const cost = parseFloat(form.cost);
    if (!name) return;
    if (isNaN(cost) || cost <= 0) return;
    // Default next billing date to today if not set
    const nextDate = form.nextDate || new Date().toISOString().split('T')[0];
    setSubs(prev => [...prev, {
      id: Date.now().toString(),
      name,
      cost,
      cycle: form.cycle,
      nextDate,
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
        <h1 className="text-lg font-semibold text-foreground">Subscription Tracker</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-foreground text-background font-medium text-sm hover:bg-foreground/90 transition-colors">
          {showForm ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-background border border-border p-4">
          <div className="text-xs text-muted-foreground mb-1">Monthly Total</div>
          <div className="text-2xl font-bold text-foreground">{fmt(monthlyCost)}</div>
        </div>
        <div className="bg-background border border-border p-4">
          <div className="text-xs text-muted-foreground mb-1">Annual Total</div>
          <div className="text-2xl font-bold text-foreground">{fmt(annualCost)}</div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={addSub} className="bg-background border border-border p-5 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground">New Subscription</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Netflix" className="w-full bg-secondary border border-border px-3 py-2 text-foreground text-sm outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Cost ($)</label>
              <input type="number" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} placeholder="15.99" className="w-full bg-secondary border border-border px-3 py-2 text-foreground text-sm outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Billing Cycle</label>
              <select value={form.cycle} onChange={e => setForm(f => ({ ...f, cycle: e.target.value }))} className="w-full bg-secondary border border-border px-3 py-2 text-foreground text-sm outline-none focus:ring-1 focus:ring-ring">
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Next Billing Date</label>
              <input type="date" value={form.nextDate} onChange={e => setForm(f => ({ ...f, nextDate: e.target.value }))} className="w-full bg-secondary border border-border px-3 py-2 text-foreground text-sm outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-muted-foreground mb-1">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full bg-secondary border border-border px-3 py-2 text-foreground text-sm outline-none focus:ring-1 focus:ring-ring">
                {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_ICONS[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" className="w-full py-2.5 bg-foreground text-background font-medium hover:bg-foreground/90 transition-colors">Add Subscription</button>
        </form>
      )}

      {/* Controls */}
      {subs.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Sort:</span>
          <button onClick={() => setSortBy('cost')} className={`px-3 py-1 text-xs ${sortBy === 'cost' ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground'}`}>Cost ↓</button>
          <button onClick={() => setSortBy('nextDate')} className={`px-3 py-1 text-xs ${sortBy === 'nextDate' ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground'}`}>Next Date</button>
        </div>
      )}

      {/* List */}
      {sorted.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground/80">No subscriptions yet. Start tracking your recurring expenses!</div>
      ) : (
        <div className="space-y-3">
          {sorted.map(sub => {
            const days = daysUntil(sub.nextDate);
            const renewalSoon = days >= 0 && days <= 7;
            return (
              <div key={sub.id} className={`bg-secondary border p-4 flex items-center gap-4 ${renewalSoon ? 'border-foreground/30' : 'border-border'}`}>
                <span className="text-2xl">{CATEGORY_ICONS[sub.category]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{sub.name}</span>
                    {renewalSoon && <span className="text-xs text-foreground bg-secondary px-2 py-0.5 rounded-full">Renews in {days}d</span>}
                  </div>
                  <div className="text-sm text-muted-foreground">{fmt(sub.cost)}/{sub.cycle} · {sub.nextDate}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-foreground">{fmt(sub.cycle === 'annual' ? sub.cost / 12 : sub.cost)}/mo</div>
                  <div className="text-xs text-muted-foreground/80">{fmt(sub.cycle === 'monthly' ? sub.cost * 12 : sub.cost)}/yr</div>
                </div>
                <button onClick={() => deleteSub(sub.id)} className="text-muted-foreground/80 hover:text-red-400 ml-2">✕</button>
              </div>
            );
          })}
        </div>
      )}

      {/* AI */}
      {subs.length > 0 && (
        <div className="bg-background border border-border p-4 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">✨ AI Advisor</h2>
          <button onClick={suggestCancellations} disabled={loading} className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold hover:bg-purple-500 disabled:opacity-50">
            {loading ? 'Analyzing...' : 'Which should I cancel?'}
          </button>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {aiSuggestion && <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{aiSuggestion}</p>}
        </div>
      )}
    </div>
  );
}
