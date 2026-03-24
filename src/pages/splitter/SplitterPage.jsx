import { useState } from 'react';
import { useIDB } from '../../hooks/useIDB';
import { useGemini } from '../../hooks/useGemini';
import { calcEqualSplit, calcItemizedSplit, calcSettleUp } from './splitterUtils';

function fmt(n) { return `$${Number(n).toFixed(2)}`; }

export function SplitterPage() {
  const [bills, setBills] = useIDB('expense-splits', []);
  const [view, setView] = useState('list'); // 'list' | 'new' | 'detail'
  const [activeBill, setActiveBill] = useState(null);
  const { generate, loading, error } = useGemini();

  // New bill form
  const [title, setTitle] = useState('');
  const [totalAmt, setTotalAmt] = useState('');
  const [participants, setParticipants] = useState('');
  const [paidBy, setPaidBy] = useState('');

  // Items for detail view
  const [itemName, setItemName] = useState('');
  const [itemCost, setItemCost] = useState('');
  const [itemAssignee, setItemAssignee] = useState('shared');
  const [splitType, setSplitType] = useState('equal');
  const [settleView, setSettleView] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');

  function createBill() {
    if (!title.trim() || !totalAmt || !participants.trim()) return;
    const parts = participants.split(',').map(p => p.trim()).filter(Boolean);
    const bill = {
      id: Date.now().toString(),
      title: title.trim(),
      total: parseFloat(totalAmt),
      participants: parts,
      paidBy: paidBy || parts[0],
      items: [],
      createdAt: new Date().toISOString(),
    };
    setBills(prev => [bill, ...prev]);
    setTitle(''); setTotalAmt(''); setParticipants(''); setPaidBy('');
    setView('detail');
    setActiveBill(bill);
  }

  function addItem() {
    if (!itemName.trim() || !itemCost) return;
    const updated = {
      ...activeBill,
      items: [...activeBill.items, {
        id: Date.now().toString(),
        name: itemName.trim(),
        cost: parseFloat(itemCost),
        assignedTo: itemAssignee === 'shared' ? null : itemAssignee,
      }],
    };
    setBills(prev => prev.map(b => b.id === updated.id ? updated : b));
    setActiveBill(updated);
    setItemName(''); setItemCost(''); setItemAssignee('shared');
  }

  function removeItem(itemId) {
    const updated = { ...activeBill, items: activeBill.items.filter(i => i.id !== itemId) };
    setBills(prev => prev.map(b => b.id === updated.id ? updated : b));
    setActiveBill(updated);
  }

  function deleteBill(id) {
    setBills(prev => prev.filter(b => b.id !== id));
    if (activeBill?.id === id) { setView('list'); setActiveBill(null); }
  }

  async function suggestSplit() {
    if (!activeBill) return;
    const desc = `Bill: ${activeBill.title}\nTotal: $${activeBill.total}\nParticipants: ${activeBill.participants.join(', ')}\nItems:\n${
      activeBill.items.map(i => `- ${i.name}: $${i.cost} (${i.assignedTo || 'shared'})`).join('\n')
    }`;
    const resp = await generate(`You are a bill-splitting advisor. Based on this expense breakdown, recommend the fairest split method (equal or itemized) and explain why:\n${desc}\nKeep your response concise (3-4 sentences).`);
    setAiSuggestion(resp);
  }

  const getShares = (bill) => {
    if (!bill) return {};
    if (splitType === 'equal') return calcEqualSplit(bill.total, bill.participants);
    return calcItemizedSplit(bill.items, bill.participants);
  };

  if (view === 'list') return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#e4e4e7]">💸 Expense Splitter</h1>
        <button onClick={() => setView('new')} className="px-4 py-2 bg-amber-500 text-black rounded-lg font-semibold text-sm hover:bg-amber-400">+ New Bill</button>
      </div>
      {bills.length === 0 ? (
        <div className="text-center py-16 text-[#52525b]">No bills yet. Create one to split expenses with friends!</div>
      ) : (
        <div className="space-y-3">
          {bills.map(bill => (
            <div key={bill.id} className="bg-[#0c0c0e] border border-[#1c1c20] rounded-xl p-4 flex items-center justify-between gap-4">
              <div>
                <div className="font-semibold text-[#e4e4e7]">{bill.title}</div>
                <div className="text-sm text-[#71717a]">{bill.participants.join(', ')} · {fmt(bill.total)}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setActiveBill(bill); setSplitType('equal'); setSettleView(false); setAiSuggestion(''); setView('detail'); }} className="px-3 py-1.5 bg-[#27272a] text-[#e4e4e7] rounded-lg text-sm hover:bg-[#3f3f46]">Open</button>
                <button onClick={() => deleteBill(bill.id)} className="px-3 py-1.5 text-red-400 hover:text-red-300 text-sm">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (view === 'new') return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center gap-3">
        <button onClick={() => setView('list')} className="text-[#71717a] hover:text-[#e4e4e7]">← Back</button>
        <h1 className="text-xl font-bold text-[#e4e4e7]">New Bill</h1>
      </div>
      <div className="bg-[#0c0c0e] border border-[#1c1c20] rounded-xl p-5 space-y-4">
        <div>
          <label className="block text-sm text-[#a1a1aa] mb-1">Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Dinner at Nobu..." className="w-full bg-[#18181b] border border-[#1c1c20] rounded-lg px-3 py-2 text-[#e4e4e7] text-sm outline-none focus:border-amber-500" />
        </div>
        <div>
          <label className="block text-sm text-[#a1a1aa] mb-1">Total Amount ($)</label>
          <input type="number" value={totalAmt} onChange={e => setTotalAmt(e.target.value)} placeholder="120.00" className="w-full bg-[#18181b] border border-[#1c1c20] rounded-lg px-3 py-2 text-[#e4e4e7] text-sm outline-none focus:border-amber-500" />
        </div>
        <div>
          <label className="block text-sm text-[#a1a1aa] mb-1">Participants (comma-separated)</label>
          <input value={participants} onChange={e => setParticipants(e.target.value)} placeholder="Alice, Bob, Carol" className="w-full bg-[#18181b] border border-[#1c1c20] rounded-lg px-3 py-2 text-[#e4e4e7] text-sm outline-none focus:border-amber-500" />
        </div>
        <div>
          <label className="block text-sm text-[#a1a1aa] mb-1">Paid By</label>
          <input value={paidBy} onChange={e => setPaidBy(e.target.value)} placeholder="Alice (leave blank for first participant)" className="w-full bg-[#18181b] border border-[#1c1c20] rounded-lg px-3 py-2 text-[#e4e4e7] text-sm outline-none focus:border-amber-500" />
        </div>
        <button onClick={createBill} className="w-full py-2.5 bg-amber-500 text-black font-semibold rounded-lg hover:bg-amber-400">Create Bill</button>
      </div>
    </div>
  );

  // Detail view
  if (!activeBill) return null;
  const shares = getShares(activeBill);
  const transactions = calcSettleUp(shares, activeBill.total, activeBill.paidBy);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <button onClick={() => { setView('list'); setAiSuggestion(''); }} className="text-[#71717a] hover:text-[#e4e4e7]">← Bills</button>
        <h1 className="text-xl font-bold text-[#e4e4e7]">{activeBill.title}</h1>
        <span className="text-[#71717a] text-sm ml-auto">Total: {fmt(activeBill.total)}</span>
      </div>

      {/* Add item */}
      <div className="bg-[#0c0c0e] border border-[#1c1c20] rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-semibold text-[#a1a1aa]">Add Item</h2>
        <div className="grid grid-cols-3 gap-2">
          <input value={itemName} onChange={e => setItemName(e.target.value)} placeholder="Item name" className="bg-[#18181b] border border-[#1c1c20] rounded-lg px-3 py-2 text-[#e4e4e7] text-sm outline-none focus:border-amber-500" />
          <input type="number" value={itemCost} onChange={e => setItemCost(e.target.value)} placeholder="Cost" className="bg-[#18181b] border border-[#1c1c20] rounded-lg px-3 py-2 text-[#e4e4e7] text-sm outline-none focus:border-amber-500" />
          <select value={itemAssignee} onChange={e => setItemAssignee(e.target.value)} className="bg-[#18181b] border border-[#1c1c20] rounded-lg px-3 py-2 text-[#e4e4e7] text-sm outline-none focus:border-amber-500">
            <option value="shared">Shared</option>
            {activeBill.participants.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <button onClick={addItem} className="px-4 py-2 bg-amber-500 text-black rounded-lg text-sm font-semibold hover:bg-amber-400">Add</button>
      </div>

      {/* Items list */}
      {activeBill.items.length > 0 && (
        <div className="bg-[#0c0c0e] border border-[#1c1c20] rounded-xl p-4 space-y-2">
          <h2 className="text-sm font-semibold text-[#a1a1aa] mb-2">Items</h2>
          {activeBill.items.map(item => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <span className="text-[#e4e4e7]">{item.name}</span>
              <span className="text-[#71717a]">{item.assignedTo || 'shared'}</span>
              <span className="text-amber-400">{fmt(item.cost)}</span>
              <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-300 ml-2">✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Split type + shares */}
      <div className="bg-[#0c0c0e] border border-[#1c1c20] rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-[#a1a1aa]">Split Method</h2>
          <div className="flex gap-2 ml-auto">
            <button onClick={() => setSplitType('equal')} className={`px-3 py-1 rounded-lg text-xs font-semibold ${splitType === 'equal' ? 'bg-amber-500 text-black' : 'bg-[#27272a] text-[#a1a1aa]'}`}>Equal</button>
            <button onClick={() => setSplitType('itemized')} className={`px-3 py-1 rounded-lg text-xs font-semibold ${splitType === 'itemized' ? 'bg-amber-500 text-black' : 'bg-[#27272a] text-[#a1a1aa]'}`}>Itemized</button>
          </div>
        </div>
        {activeBill.participants.map(p => (
          <div key={p} className="flex items-center justify-between">
            <span className="text-[#e4e4e7] text-sm">{p}{p === activeBill.paidBy ? ' 💳' : ''}</span>
            <span className="font-semibold text-amber-400">{fmt(shares[p] || 0)}</span>
          </div>
        ))}
      </div>

      {/* Settle up */}
      <div className="bg-[#0c0c0e] border border-[#1c1c20] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#a1a1aa]">Settle Up</h2>
          <button onClick={() => setSettleView(!settleView)} className="text-xs text-amber-400 hover:text-amber-300">{settleView ? 'Hide' : 'Show'}</button>
        </div>
        {settleView && (
          transactions.length === 0
            ? <p className="text-sm text-[#71717a]">All settled! 🎉</p>
            : transactions.map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="text-red-400">{t.from}</span>
                <span className="text-[#71717a]">→</span>
                <span className="text-green-400">{t.to}</span>
                <span className="ml-auto font-semibold text-[#e4e4e7]">{fmt(t.amount)}</span>
              </div>
            ))
        )}
      </div>

      {/* AI suggestion */}
      <div className="bg-[#0c0c0e] border border-[#1c1c20] rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-semibold text-[#a1a1aa]">✨ AI Suggestion</h2>
        <button onClick={suggestSplit} disabled={loading} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-500 disabled:opacity-50">
          {loading ? 'Thinking...' : 'Suggest how to split'}
        </button>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        {aiSuggestion && <p className="text-sm text-[#a1a1aa] leading-relaxed whitespace-pre-wrap">{aiSuggestion}</p>}
      </div>
    </div>
  );
}
