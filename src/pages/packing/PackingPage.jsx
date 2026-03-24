import { useState } from 'react';
import { useIDB } from '../../hooks/useIDB';
import { useGemini } from '../../hooks/useGemini';
import { TEMPLATES } from './packingTemplates';

const CATEGORIES = ['Clothing', 'Toiletries', 'Electronics', 'Documents', 'Misc'];
const TEMPLATE_NAMES = Object.keys(TEMPLATES);

function buildFromTemplate(templateName) {
  const template = TEMPLATES[templateName];
  const items = [];
  for (const [cat, catItems] of Object.entries(template)) {
    for (const item of catItems) {
      items.push({ id: `${Date.now()}-${Math.random()}`, name: item, category: cat, checked: false });
    }
  }
  return items;
}

export function PackingPage() {
  const [lists, setLists] = useIDB('packing-lists', []);
  const [view, setView] = useState('list'); // 'list' | 'detail' | 'new'
  const [activeList, setActiveList] = useState(null);
  const { generate, loading, error } = useGemini();

  const [newListName, setNewListName] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemCat, setNewItemCat] = useState('Misc');
  const [aiDestination, setAiDestination] = useState('');
  const [aiTripType, setAiTripType] = useState('');
  const [aiDuration, setAiDuration] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [filterCat, setFilterCat] = useState('All');

  function createFromTemplate(templateName) {
    const list = {
      id: Date.now().toString(),
      name: templateName,
      items: buildFromTemplate(templateName),
      createdAt: new Date().toISOString(),
    };
    setLists(prev => [list, ...prev]);
    setActiveList(list);
    setView('detail');
  }

  function createBlank() {
    if (!newListName.trim()) return;
    const list = { id: Date.now().toString(), name: newListName.trim(), items: [], createdAt: new Date().toISOString() };
    setLists(prev => [list, ...prev]);
    setActiveList(list);
    setNewListName('');
    setView('detail');
  }

  function addItem() {
    if (!newItemName.trim() || !activeList) return;
    const item = { id: Date.now().toString(), name: newItemName.trim(), category: newItemCat, checked: false };
    const updated = { ...activeList, items: [...activeList.items, item] };
    setLists(prev => prev.map(l => l.id === updated.id ? updated : l));
    setActiveList(updated);
    setNewItemName('');
  }

  function toggleItem(itemId) {
    const updated = { ...activeList, items: activeList.items.map(i => i.id === itemId ? { ...i, checked: !i.checked } : i) };
    setLists(prev => prev.map(l => l.id === updated.id ? updated : l));
    setActiveList(updated);
  }

  function removeItem(itemId) {
    const updated = { ...activeList, items: activeList.items.filter(i => i.id !== itemId) };
    setLists(prev => prev.map(l => l.id === updated.id ? updated : l));
    setActiveList(updated);
  }

  function deleteList(id) {
    setLists(prev => prev.filter(l => l.id !== id));
    if (activeList?.id === id) { setView('list'); setActiveList(null); }
  }

  async function buildWithAI() {
    if (!aiDestination.trim()) return;
    const resp = await generate(`Create a packing list for a ${aiDuration || 'week-long'} ${aiTripType || 'trip'} to ${aiDestination}.\n\nOrganize items by categories: Clothing, Toiletries, Electronics, Documents, Misc.\nFormat as:\nClothing:\n- item 1\n- item 2\n...\nToiletries:\n- item 1\n...\n(etc)\n\nBe practical and concise. Include 5-8 items per category.`);
    setAiSuggestion(resp);
  }

  function importAISuggestion() {
    if (!aiSuggestion) return;
    const items = [];
    let currentCat = 'Misc';
    for (const line of aiSuggestion.split('\n')) {
      const trimmed = line.trim();
      const catMatch = CATEGORIES.find(c => trimmed.startsWith(c));
      if (catMatch) { currentCat = catMatch; continue; }
      if (trimmed.startsWith('-')) {
        items.push({ id: `${Date.now()}-${Math.random()}`, name: trimmed.replace(/^-\s*/, '').trim(), category: currentCat, checked: false });
      }
    }
    if (items.length > 0 && activeList) {
      const updated = { ...activeList, items: [...activeList.items, ...items] };
      setLists(prev => prev.map(l => l.id === updated.id ? updated : l));
      setActiveList(updated);
      setAiSuggestion('');
    } else {
      const list = {
        id: Date.now().toString(),
        name: `${aiDestination} Trip`,
        items,
        createdAt: new Date().toISOString(),
      };
      setLists(prev => [list, ...prev]);
      setActiveList(list);
      setAiSuggestion('');
      setView('detail');
    }
  }

  if (view === 'list') return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">Packing Lists</h1>
        <button onClick={() => setView('new')} className="px-4 py-2 bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400">+ New List</button>
      </div>

      {lists.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground/80">No packing lists yet. Create one or use a template!</div>
      ) : (
        <div className="space-y-3">
          {lists.map(list => {
            const done = list.items.filter(i => i.checked).length;
            return (
              <div key={list.id} className="bg-background border border-border p-4 flex items-center gap-4">
                <div className="flex-1 cursor-pointer" onClick={() => { setActiveList(list); setFilterCat('All'); setAiSuggestion(''); setView('detail'); }}>
                  <div className="font-semibold text-foreground">{list.name}</div>
                  <div className="text-sm text-muted-foreground">{done}/{list.items.length} items packed</div>
                  {list.items.length > 0 && (
                    <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${(done / list.items.length) * 100}%` }} />
                    </div>
                  )}
                </div>
                <button onClick={() => deleteList(list.id)} className="text-muted-foreground/80 hover:text-red-400">✕</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  if (view === 'new') return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center gap-3">
        <button onClick={() => setView('list')} className="text-muted-foreground hover:text-foreground">← Back</button>
        <h1 className="text-xl font-bold text-foreground">New Packing List</h1>
      </div>

      {/* Templates */}
      <div className="bg-background border border-border p-5 space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Use a Template</h2>
        <div className="grid grid-cols-2 gap-2">
          {TEMPLATE_NAMES.map(t => (
            <button key={t} onClick={() => createFromTemplate(t)} className="p-3 bg-secondary border border-border text-sm text-foreground hover:border-amber-500 text-left">{t}</button>
          ))}
        </div>
      </div>

      {/* Blank list */}
      <div className="bg-background border border-border p-5 space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Create from Scratch</h2>
        <div className="flex gap-2">
          <input value={newListName} onChange={e => setNewListName(e.target.value)} placeholder="List name" className="flex-1 bg-secondary border border-border px-3 py-2 text-foreground text-sm outline-none focus:border-amber-500" />
          <button onClick={createBlank} disabled={!newListName.trim()} className="px-4 py-2 bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400 disabled:opacity-50">Create</button>
        </div>
      </div>

      {/* AI builder */}
      <div className="bg-background border border-border p-5 space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">✨ AI Packing List Builder</h2>
        <div className="grid grid-cols-2 gap-2">
          <input value={aiDestination} onChange={e => setAiDestination(e.target.value)} placeholder="Destination (e.g., Bali)" className="bg-secondary border border-border px-3 py-2 text-foreground text-sm outline-none focus:border-amber-500" />
          <input value={aiTripType} onChange={e => setAiTripType(e.target.value)} placeholder="Trip type (e.g., beach)" className="bg-secondary border border-border px-3 py-2 text-foreground text-sm outline-none focus:border-amber-500" />
          <input value={aiDuration} onChange={e => setAiDuration(e.target.value)} placeholder="Duration (e.g., 7 days)" className="bg-secondary border border-border px-3 py-2 text-foreground text-sm outline-none focus:border-amber-500 col-span-2" />
        </div>
        <button onClick={buildWithAI} disabled={loading || !aiDestination.trim()} className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold hover:bg-purple-500 disabled:opacity-50">
          {loading ? 'Building...' : '✨ Build with AI'}
        </button>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        {aiSuggestion && (
          <div className="space-y-2">
            <pre className="text-sm text-muted-foreground bg-secondary p-3 whitespace-pre-wrap max-h-60 overflow-auto">{aiSuggestion}</pre>
            <button onClick={importAISuggestion} className="px-4 py-2 bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400">Import as List</button>
          </div>
        )}
      </div>
    </div>
  );

  // Detail view
  if (!activeList) return null;
  const filteredItems = filterCat === 'All' ? activeList.items : activeList.items.filter(i => i.category === filterCat);
  const done = activeList.items.filter(i => i.checked).length;

  return (
    <div className="space-y-5 max-w-lg">
      <div className="flex items-center gap-3">
        <button onClick={() => setView('list')} className="text-muted-foreground hover:text-foreground">← Lists</button>
        <h1 className="text-xl font-bold text-foreground">{activeList.name}</h1>
        <span className="text-sm text-muted-foreground ml-auto">{done}/{activeList.items.length}</span>
      </div>

      {/* Progress */}
      {activeList.items.length > 0 && (
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${(done / activeList.items.length) * 100}%` }} />
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {['All', ...CATEGORIES].map(c => (
          <button key={c} onClick={() => setFilterCat(c)} className={`px-3 py-1 text-xs ${filterCat === c ? 'bg-amber-500 text-black font-semibold' : 'bg-secondary text-muted-foreground'}`}>{c}</button>
        ))}
      </div>

      {/* Add item */}
      <div className="flex gap-2">
        <input value={newItemName} onChange={e => setNewItemName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem()} placeholder="Add item..." className="flex-1 bg-secondary border border-border px-3 py-2 text-foreground text-sm outline-none focus:border-amber-500" />
        <select value={newItemCat} onChange={e => setNewItemCat(e.target.value)} className="bg-secondary border border-border px-2 py-2 text-foreground text-sm outline-none focus:border-amber-500">
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={addItem} className="px-3 py-2 bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400">+</button>
      </div>

      {/* Items grouped by category */}
      {CATEGORIES.map(cat => {
        const catItems = filteredItems.filter(i => i.category === cat);
        if (catItems.length === 0) return null;
        return (
          <div key={cat} className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-widest">{cat}</h3>
            {catItems.map(item => (
              <div key={item.id} className="flex items-center gap-3 bg-background border border-border px-3 py-2.5">
                <input type="checkbox" checked={item.checked} onChange={() => toggleItem(item.id)} className="w-4 h-4 rounded accent-amber-500" />
                <span className={`flex-1 text-sm ${item.checked ? 'line-through text-muted-foreground/80' : 'text-foreground'}`}>{item.name}</span>
                <button onClick={() => removeItem(item.id)} className="text-muted-foreground/80 hover:text-red-400 text-xs">✕</button>
              </div>
            ))}
          </div>
        );
      })}

      {filteredItems.length === 0 && (
        <div className="text-center py-8 text-muted-foreground/80 text-sm">No items yet. Add some above!</div>
      )}
    </div>
  );
}
