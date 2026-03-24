import { useState, useMemo } from 'react';
import { useIDB } from '../../hooks/useIDB';
import { useGemini } from '../../hooks/useGemini';

// ── Utils ─────────────────────────────────────────────────────────────────

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function getThisWeekStart() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
}

function getThisMonthStart() {
  return new Date().toISOString().slice(0, 7);
}

function getThisYearStart() {
  return new Date().getFullYear().toString();
}

// ── Shared Components ─────────────────────────────────────────────────────

function Card({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-[#0c0c0e] border border-[#1c1c20] rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#0a0a0b] transition-colors"
      >
        <span className="text-[#e4e4e7] font-semibold">{title}</span>
        <span className="text-[#52525b] text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

const ITEM_TYPES = ['Book', 'Article', 'Video', 'Podcast'];
const ITEM_STATUSES = ['Want to Read', 'Reading', 'Done'];
const STATUS_FILTER_TABS = ['All', 'Want to Read', 'Reading', 'Done'];

// ── Reading List ──────────────────────────────────────────────────────────

export function ReadingList() {
  const [items, setItems] = useIDB('reading-list', []);
  const { generate, loading: aiLoading, hasKey } = useGemini();

  const [filter, setFilter] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', author: '', url: '', type: 'Book', status: 'Want to Read' });

  const [aiQuery, setAiQuery] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState(null);

  const filtered = useMemo(() => {
    if (!items) return [];
    if (filter === 'All') return items.filter((i) => !i.archived);
    return items.filter((i) => !i.archived && i.status === filter);
  }, [items, filter]);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const newItem = { ...form, id: uid(), createdAt: new Date().toISOString(), archived: false };
    setItems((prev) => [newItem, ...(prev || [])]);
    setForm({ title: '', author: '', url: '', type: 'Book', status: 'Want to Read' });
    setShowForm(false);
  };

  const handleMarkDone = (id) => {
    setItems((prev) => (prev || []).map((i) => i.id === id ? { ...i, status: 'Done' } : i));
  };

  const handleArchive = (id) => {
    setItems((prev) => (prev || []).map((i) => i.id === id ? { ...i, archived: true } : i));
  };

  const handleDelete = (id) => {
    setItems((prev) => (prev || []).filter((i) => i.id !== id));
  };

  const handleShouldIRead = async () => {
    if (!aiQuery.trim()) return;
    setAiError(null);
    try {
      const text = await generate(`In one sentence, should I read/watch/listen to this? Be concise and opinionated: "${aiQuery}"`);
      setAiResult(text);
    } catch (err) {
      setAiError(err.message);
    }
  };

  const inputCls = 'bg-[#0a0a0b] border border-[#1c1c20] rounded-lg px-3 py-2 text-[#e4e4e7] text-sm placeholder-[#52525b] focus:outline-none focus:border-[#f59e0b] w-full';

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-[#1c1c20]">
        {STATUS_FILTER_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            data-testid={`reading-filter-${tab.toLowerCase().replace(/ /g, '-')}`}
            className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors ${
              filter === tab ? 'text-amber-400 border-b-2 border-amber-400' : 'text-[#71717a] hover:text-[#e4e4e7]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Add button */}
      <button
        onClick={() => setShowForm((v) => !v)}
        className="text-sm px-3 py-1.5 rounded-lg bg-[#27272a] hover:bg-[#3f3f46] text-[#e4e4e7] transition-colors"
      >
        + Add Item
      </button>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleAdd} className="bg-[#0a0a0b] border border-[#1c1c20] rounded-xl p-4 space-y-3">
          <input className={inputCls} placeholder="Title *" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} autoFocus />
          <input className={inputCls} placeholder="Author / Source" value={form.author} onChange={(e) => setForm((p) => ({ ...p, author: e.target.value }))} />
          <input className={inputCls} placeholder="URL (optional)" value={form.url} onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))} />
          <div className="flex gap-2">
            <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} className="bg-[#0a0a0b] border border-[#1c1c20] rounded-lg px-2 py-1.5 text-xs text-[#e4e4e7] focus:outline-none flex-1">
              {ITEM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className="bg-[#0a0a0b] border border-[#1c1c20] rounded-lg px-2 py-1.5 text-xs text-[#e4e4e7] focus:outline-none flex-1">
              {ITEM_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-1.5 text-sm bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg">Add</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm bg-[#27272a] hover:bg-[#3f3f46] text-[#a1a1aa] rounded-lg">Cancel</button>
          </div>
        </form>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <p className="text-[#52525b] text-sm text-center py-6">No items{filter !== 'All' ? ` in "${filter}"` : ''}.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <div key={item.id} data-testid={`reading-item-${item.id}`} className="bg-[#0a0a0b] border border-[#1c1c20] rounded-xl px-4 py-3 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`text-sm font-medium ${item.status === 'Done' ? 'text-[#52525b] line-through' : 'text-[#e4e4e7]'}`}>{item.title}</p>
                  <span className="text-xs text-[#52525b] bg-[#18181b] px-1.5 py-0.5 rounded">{item.type}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${item.status === 'Done' ? 'text-green-400 bg-green-400/10' : item.status === 'Reading' ? 'text-amber-400 bg-amber-400/10' : 'text-[#71717a] bg-[#27272a]'}`}>{item.status}</span>
                </div>
                {item.author && <p className="text-xs text-[#71717a] mt-0.5">{item.author}</p>}
                {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-amber-400/70 hover:text-amber-400 mt-0.5 block truncate">{item.url}</a>}
              </div>
              <div className="flex gap-1 shrink-0">
                {item.status !== 'Done' && (
                  <button onClick={() => handleMarkDone(item.id)} data-testid={`reading-done-${item.id}`} className="text-xs text-[#52525b] hover:text-green-400 transition-colors" title="Mark done">✓</button>
                )}
                <button onClick={() => handleArchive(item.id)} data-testid={`reading-archive-${item.id}`} className="text-xs text-[#52525b] hover:text-amber-400 transition-colors ml-1" title="Archive">📥</button>
                <button onClick={() => handleDelete(item.id)} data-testid={`reading-delete-${item.id}`} className="text-xs text-[#52525b] hover:text-red-400 transition-colors ml-1" title="Delete">×</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Should I read this? */}
      {hasKey && (
        <div className="space-y-2 pt-2 border-t border-[#1c1c20]">
          <p className="text-[#71717a] text-xs">✨ Should I read/watch this?</p>
          <div className="flex gap-2">
            <input
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder="Paste title or description…"
              className={inputCls}
              data-testid="reading-ai-input"
            />
            <button
              onClick={handleShouldIRead}
              disabled={aiLoading || !aiQuery.trim()}
              className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
              data-testid="reading-ai-btn"
            >
              {aiLoading ? '⏳' : '✨ Ask'}
            </button>
          </div>
          {aiResult && (
            <div className="border border-amber-500/30 bg-amber-950/20 rounded-lg p-3">
              <p className="text-[#e4e4e7] text-sm">{aiResult}</p>
              <button onClick={() => setAiResult(null)} className="text-[#52525b] text-xs mt-1 hover:text-[#e4e4e7]">Dismiss</button>
            </div>
          )}
          {aiError && <p className="text-red-400 text-xs">❌ {aiError}</p>}
        </div>
      )}
    </div>
  );
}

// ── TIL Log ───────────────────────────────────────────────────────────────

export function TILLog() {
  const [entries, setEntries] = useIDB('til-log', []);
  const { generate, loading: aiLoading, hasKey } = useGemini();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', note: '', tags: '' });
  const [tagFilter, setTagFilter] = useState('');
  const [connectResult, setConnectResult] = useState(null);
  const [connectError, setConnectError] = useState(null);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
    const entry = { id: uid(), title: form.title.trim(), note: form.note.trim(), tags, date: getTodayKey(), createdAt: new Date().toISOString() };
    setEntries((prev) => [entry, ...(prev || [])]);
    setForm({ title: '', note: '', tags: '' });
    setShowForm(false);
  };

  const handleDelete = (id) => {
    setEntries((prev) => (prev || []).filter((e) => e.id !== id));
  };

  const allTags = useMemo(() => {
    const set = new Set();
    (entries || []).forEach((e) => (e.tags || []).forEach((t) => set.add(t)));
    return [...set];
  }, [entries]);

  const filtered = useMemo(() => {
    if (!entries) return [];
    if (!tagFilter) return [...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return [...entries].filter((e) => (e.tags || []).includes(tagFilter)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [entries, tagFilter]);

  const handleConnectDots = async () => {
    if (!entries || entries.length === 0) return;
    setConnectError(null);
    const last5 = [...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
    const prompt = `Here are my last 5 "Today I Learned" entries:
${last5.map((e, i) => `${i + 1}. "${e.title}"${e.note ? ': ' + e.note : ''}`).join('\n')}

Find a common theme or suggest how these ideas connect in 2-3 sentences.`;
    try {
      const text = await generate(prompt);
      setConnectResult(text);
    } catch (err) {
      setConnectError(err.message);
    }
  };

  const inputCls = 'bg-[#0a0a0b] border border-[#1c1c20] rounded-lg px-3 py-2 text-[#e4e4e7] text-sm placeholder-[#52525b] focus:outline-none focus:border-[#f59e0b] w-full';

  return (
    <div className="space-y-4">
      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setTagFilter('')}
            className={`px-2 py-1 rounded-lg text-xs transition-colors ${!tagFilter ? 'bg-amber-500/20 text-amber-400' : 'bg-[#27272a] text-[#71717a] hover:text-[#e4e4e7]'}`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setTagFilter(tagFilter === tag ? '' : tag)}
              data-testid={`til-tag-${tag}`}
              className={`px-2 py-1 rounded-lg text-xs transition-colors ${tagFilter === tag ? 'bg-amber-500/20 text-amber-400' : 'bg-[#27272a] text-[#71717a] hover:text-[#e4e4e7]'}`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => setShowForm((v) => !v)}
        className="text-sm px-3 py-1.5 rounded-lg bg-[#27272a] hover:bg-[#3f3f46] text-[#e4e4e7] transition-colors"
      >
        + Add TIL
      </button>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-[#0a0a0b] border border-[#1c1c20] rounded-xl p-4 space-y-3">
          <input className={inputCls} placeholder="What did you learn? *" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} autoFocus />
          <textarea
            className="bg-[#0a0a0b] border border-[#1c1c20] rounded-lg px-3 py-2 text-[#e4e4e7] text-sm placeholder-[#52525b] focus:outline-none w-full resize-none"
            placeholder="Brief note (optional)…"
            value={form.note}
            onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
            rows={2}
          />
          <input className={inputCls} placeholder="Tags (comma-separated)" value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} />
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-1.5 text-sm bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg">Add</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm bg-[#27272a] hover:bg-[#3f3f46] text-[#a1a1aa] rounded-lg">Cancel</button>
          </div>
        </form>
      )}

      {/* Connect the dots AI */}
      {hasKey && entries && entries.length >= 2 && (
        <div className="space-y-2">
          {connectResult ? (
            <div className="border border-amber-500/30 bg-amber-950/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-amber-400 text-sm font-semibold">✨ Connect the Dots</span>
                <button onClick={() => setConnectResult(null)} className="text-[#52525b] hover:text-[#e4e4e7] text-xs">Dismiss</button>
              </div>
              <p className="text-[#e4e4e7] text-sm">{connectResult}</p>
            </div>
          ) : (
            <button
              onClick={handleConnectDots}
              disabled={aiLoading}
              data-testid="til-connect-btn"
              className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 transition-colors disabled:opacity-50"
            >
              {aiLoading ? '⏳ Thinking…' : '✨ Connect the Dots'}
            </button>
          )}
          {connectError && <p className="text-red-400 text-xs">❌ {connectError}</p>}
        </div>
      )}

      {/* Timeline */}
      {filtered.length === 0 ? (
        <p className="text-[#52525b] text-sm text-center py-6">No TIL entries{tagFilter ? ` tagged #${tagFilter}` : ''}.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((entry) => (
            <div key={entry.id} data-testid={`til-entry-${entry.id}`} className="bg-[#0a0a0b] border border-[#1c1c20] rounded-xl px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#e4e4e7]">{entry.title}</p>
                  {entry.note && <p className="text-xs text-[#71717a] mt-0.5">{entry.note}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[#52525b] text-xs">{entry.date}</span>
                    {(entry.tags || []).map((tag) => (
                      <span key={tag} className="text-xs bg-[#18181b] text-[#71717a] px-1.5 py-0.5 rounded">#{tag}</span>
                    ))}
                  </div>
                </div>
                <button onClick={() => handleDelete(entry.id)} className="text-[#3f3f46] hover:text-red-400 text-sm transition-colors shrink-0">×</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Knowledge Stats ───────────────────────────────────────────────────────

function KnowledgeStats({ readingItems, tilEntries }) {
  const items = readingItems || [];
  const entries = tilEntries || [];

  const yearStart = getThisYearStart();
  const monthStart = getThisMonthStart();
  const weekStart = getThisWeekStart();

  const booksRead = items.filter((i) => i.type === 'Book' && i.status === 'Done' && i.createdAt?.startsWith(yearStart)).length;
  const articlesThisMonth = items.filter((i) => i.type === 'Article' && i.status === 'Done' && i.createdAt?.startsWith(monthStart)).length;
  const tilThisWeek = entries.filter((e) => e.date >= weekStart).length;
  const tilThisMonth = entries.filter((e) => e.date?.startsWith(monthStart)).length;

  const stats = [
    { label: 'Books Read (Year)', value: booksRead, icon: '📚' },
    { label: 'Articles Done (Month)', value: articlesThisMonth, icon: '📰' },
    { label: 'TIL This Week', value: tilThisWeek, icon: '💡' },
    { label: 'TIL This Month', value: tilThisMonth, icon: '🗂️' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="bg-[#0a0a0b] border border-[#1c1c20] rounded-xl px-4 py-3">
          <p className="text-[#71717a] text-xs">{s.icon} {s.label}</p>
          <p className="text-2xl font-bold text-[#f59e0b] mt-1">{s.value}</p>
        </div>
      ))}
    </div>
  );
}

// ── Main KnowledgeTab ─────────────────────────────────────────────────────

export function KnowledgeTab() {
  const [readingItems] = useIDB('reading-list', []);
  const [tilEntries] = useIDB('til-log', []);

  return (
    <div className="space-y-4">
      <Card title="📊 Knowledge Stats">
        <KnowledgeStats readingItems={readingItems} tilEntries={tilEntries} />
      </Card>

      <Card title="📚 Reading List">
        <ReadingList />
      </Card>

      <Card title="💡 TIL — Today I Learned">
        <TILLog />
      </Card>
    </div>
  );
}
