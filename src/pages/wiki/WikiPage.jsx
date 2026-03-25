import { useState, useMemo } from 'react';
import { useIDB } from '../../hooks/useIDB';
import { useGemini } from '../../hooks/useGemini';
import { EmptyState } from '../../components/ui';

function parseMarkdown(text) {
  // Basic markdown: headings, bold, italic, code, bullets
  return text
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold text-foreground mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-foreground mt-4 mb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-foreground mt-4 mb-2">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-muted-foreground italic">$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-secondary text-amber-400 px-1 rounded text-xs font-mono">$1</code>')
    .replace(/^- (.+)$/gm, '<li class="text-muted-foreground ml-4 list-disc">$1</li>')
    .replace(/\n/g, '<br>');
}

function renderWikiLinks(content, pages, onNavigate) {
  // [[page title]] -> clickable link
  return content.replace(/\[\[([^\]]+)\]\]/g, (_, title) => {
    const page = pages.find(p => p.title.toLowerCase() === title.toLowerCase());
    if (page) {
      return `<button onclick="window.wikiNavigate('${page.id}')" class="text-foreground hover:underline underline">[[${title}]]</button>`;
    }
    return `<span class="text-muted-foreground/80">[[${title}]]</span>`;
  });
}

export function WikiPage() {
  const [pages, setPages] = useIDB('wiki-pages', []);
  const [view, setView] = useState('list'); // 'list' | 'edit' | 'read'
  const [activePage, setActivePage] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ title: '', content: '', category: '' });
  const [aiSummary, setAiSummary] = useState('');
  const [aiRelated, setAiRelated] = useState('');
  const { generate, loading, error } = useGemini();

  // Register wiki navigation globally
  if (typeof window !== 'undefined') {
    window.wikiNavigate = (id) => {
      const page = pages.find(p => p.id === id);
      if (page) { setActivePage(page); setView('read'); }
    };
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return pages;
    const q = search.toLowerCase();
    return pages.filter(p => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q));
  }, [pages, search]);

  const categories = [...new Set(pages.map(p => p.category).filter(Boolean))];

  function createPage() {
    if (!form.title.trim()) return;
    const page = {
      id: Date.now().toString(),
      title: form.title.trim(),
      content: form.content,
      category: form.category.trim() || 'General',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setPages(prev => [page, ...prev]);
    setActivePage(page);
    setView('read');
    setForm({ title: '', content: '', category: '' });
  }

  function updatePage() {
    if (!form.title.trim() || !activePage) return;
    const updated = { ...activePage, title: form.title.trim(), content: form.content, category: form.category || 'General', updatedAt: new Date().toISOString() };
    setPages(prev => prev.map(p => p.id === activePage.id ? updated : p));
    setActivePage(updated);
    setView('read');
  }

  function deletePage(id) {
    setPages(prev => prev.filter(p => p.id !== id));
    if (activePage?.id === id) { setView('list'); setActivePage(null); }
  }

  function openEdit(page) {
    setActivePage(page);
    setForm({ title: page.title, content: page.content, category: page.category });
    setAiSummary('');
    setAiRelated('');
    setView('edit');
  }

  async function summarize() {
    if (!activePage) return;
    const resp = await generate(`Summarize this wiki page in 2-3 sentences:\n\nTitle: ${activePage.title}\n\n${activePage.content}`);
    setAiSummary(resp);
  }

  async function findRelated() {
    if (!activePage) return;
    const otherTitles = pages.filter(p => p.id !== activePage.id).map(p => p.title).join(', ');
    const resp = await generate(`Based on this wiki page, suggest related topics to explore. Existing pages: ${otherTitles || 'none'}.\n\nPage title: ${activePage.title}\nContent: ${activePage.content.slice(0, 500)}\n\nSuggest 3-5 related topics (briefly, one line each).`);
    setAiRelated(resp);
  }

  const renderContent = (content) => {
    const withLinks = renderWikiLinks(content, pages, (id) => {
      const page = pages.find(p => p.id === id);
      if (page) { setActivePage(page); setView('read'); }
    });
    return parseMarkdown(withLinks);
  };

  if (view === 'edit') return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center gap-3">
        <button onClick={() => setView(activePage ? 'read' : 'list')} className="text-muted-foreground hover:text-foreground">← Back</button>
        <h1 className="text-xl font-bold text-foreground">{activePage ? 'Edit Page' : 'New Page'}</h1>
      </div>
      <div className="space-y-3">
        <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Page title" className="w-full bg-secondary border border-border px-3 py-2 text-foreground text-sm outline-none focus:border-amber-500 font-semibold" />
        <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Category (e.g., Projects, References)" list="wiki-cats" className="w-full bg-secondary border border-border px-3 py-2 text-foreground text-sm outline-none focus:border-amber-500" />
        <datalist id="wiki-cats">{categories.map(c => <option key={c} value={c} />)}</datalist>
        <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Write your page content... Supports # headings, **bold**, *italic*, `code`, - bullets, and [[Page Links]]" rows={16} className="w-full bg-secondary border border-border px-3 py-2 text-foreground text-sm outline-none focus:border-amber-500 font-mono resize-none" />
        <div className="flex gap-2">
          <button onClick={activePage ? updatePage : createPage} className="px-4 py-2 bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400">
            {activePage ? 'Update' : 'Create'}
          </button>
          <button onClick={() => setView(activePage ? 'read' : 'list')} className="px-4 py-2 bg-secondary text-muted-foreground text-sm hover:bg-[#3f3f46]">Cancel</button>
        </div>
      </div>
    </div>
  );

  if (view === 'read' && activePage) return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => setView('list')} className="text-muted-foreground hover:text-foreground text-sm">← Wiki</button>
        <span className="text-muted-foreground/80 text-sm">/</span>
        <span className="text-xs text-muted-foreground/80 bg-secondary px-2 py-0.5 rounded">{activePage.category}</span>
        <div className="ml-auto flex gap-2">
          <button onClick={() => openEdit(activePage)} className="px-3 py-1.5 bg-secondary text-muted-foreground text-sm hover:bg-[#3f3f46]">Edit</button>
          <button onClick={() => deletePage(activePage.id)} className="px-3 py-1.5 text-red-400 hover:text-red-300 text-sm">Delete</button>
        </div>
      </div>
      <h1 className="text-lg font-semibold text-foreground">{activePage.title}</h1>
      <div className="bg-background border border-border p-5 prose prose-invert max-w-none text-sm text-muted-foreground leading-relaxed"
        dangerouslySetInnerHTML={{ __html: renderContent(activePage.content) }} />

      {/* AI panel */}
      <div className="bg-background border border-border p-4 space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">✨ AI Tools</h3>
        <div className="flex gap-2">
          <button onClick={summarize} disabled={loading} className="px-3 py-2 bg-purple-600 text-white text-sm hover:bg-purple-500 disabled:opacity-50">Summarize</button>
          <button onClick={findRelated} disabled={loading} className="px-3 py-2 bg-purple-600 text-white text-sm hover:bg-purple-500 disabled:opacity-50">What's related?</button>
        </div>
        {loading && <p className="text-sm text-muted-foreground">Thinking...</p>}
        {error && <p className="text-red-400 text-sm">{error}</p>}
        {aiSummary && <div className="text-sm text-muted-foreground bg-secondary p-3 leading-relaxed"><strong className="text-foreground">Summary:</strong> {aiSummary}</div>}
        {aiRelated && <div className="text-sm text-muted-foreground bg-secondary p-3 leading-relaxed whitespace-pre-wrap"><strong className="text-foreground">Related topics:</strong><br />{aiRelated}</div>}
      </div>
    </div>
  );

  // List view
  const grouped = categories.length > 0
    ? categories.reduce((acc, cat) => { acc[cat] = filtered.filter(p => p.category === cat); return acc; }, {})
    : { All: filtered };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">Personal Wiki</h1>
        <button onClick={() => { setActivePage(null); setForm({ title: '', content: '', category: '' }); setView('edit'); }} className="px-4 py-2 bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400">+ New Page</button>
      </div>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search pages..." className="w-full bg-secondary border border-border px-3 py-2 text-foreground text-sm outline-none focus:border-amber-500" />

      {pages.length === 0 ? (
        <EmptyState title="Your wiki is empty" description="Create your first page to start building your knowledge base." />
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground/80">No pages match "{search}"</div>
      ) : (
        Object.entries(grouped).map(([cat, catPages]) => catPages.length > 0 && (
          <div key={cat} className="space-y-2">
            <h2 className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-widest">{cat}</h2>
            {catPages.map(page => (
              <div key={page.id} className="bg-background border border-border p-4 flex items-start gap-4 cursor-pointer hover:border-[#3f3f46]" onClick={() => { setActivePage(page); setAiSummary(''); setAiRelated(''); setView('read'); }}>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground">{page.title}</div>
                  <div className="text-sm text-muted-foreground truncate mt-0.5">{page.content.replace(/[#*`\[\]]/g, '').slice(0, 100)}...</div>
                </div>
                <button onClick={e => { e.stopPropagation(); openEdit(page); }} className="text-xs text-muted-foreground/80 hover:text-amber-400 shrink-0">Edit</button>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
