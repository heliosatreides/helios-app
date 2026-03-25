import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const PAGES = [
  { path: '/dashboard', label: 'Dashboard', keywords: 'home overview summary' },
  { path: '/planner', label: 'Daily Planner', keywords: 'schedule tasks today calendar' },
  { path: '/goals', label: 'Goals & OKRs', keywords: 'objectives key results progress' },
  { path: '/resume', label: 'Resume Builder', keywords: 'cv job career' },
  { path: '/trips', label: 'Trips', keywords: 'travel vacation itinerary' },
  { path: '/finance', label: 'Finance', keywords: 'money accounts transactions budget' },
  { path: '/investments', label: 'Investments', keywords: 'portfolio stocks crypto' },
  { path: '/sports', label: 'Sports Hub', keywords: 'scores standings nba nfl' },
  { path: '/health', label: 'Health & Wellness', keywords: 'water mood sleep tracker' },
  { path: '/meals', label: 'Meal Planner', keywords: 'food diet grocery' },
  { path: '/subscriptions', label: 'Subscriptions', keywords: 'recurring payments' },
  { path: '/ai', label: 'AI Chat', keywords: 'gemini assistant conversation' },
  { path: '/chat', label: 'P2P Chat', keywords: 'message encrypted peer' },
  { path: '/focus', label: 'Focus Mode', keywords: 'pomodoro timer habits' },
  { path: '/knowledge', label: 'Knowledge Base', keywords: 'reading books articles' },
  { path: '/networking', label: 'Networking / CRM', keywords: 'contacts follow-up' },
  { path: '/news', label: 'News', keywords: 'headlines articles feed' },
  { path: '/flashcards', label: 'Flashcards', keywords: 'study spaced repetition' },
  { path: '/music', label: 'Music', keywords: 'recommendations mood playlist' },
  { path: '/splitter', label: 'Expense Splitter', keywords: 'split bills friends' },
  { path: '/packing', label: 'Packing Lists', keywords: 'travel checklist' },
  { path: '/devtools', label: 'Dev Tools', keywords: 'github snippets standup' },
  { path: '/converter', label: 'Converter', keywords: 'currency units exchange' },
  { path: '/worldclock', label: 'World Clock', keywords: 'timezone meeting' },
  { path: '/apiplayground', label: 'API Playground', keywords: 'rest http request' },
  { path: '/colors', label: 'Color Palette', keywords: 'css design generate' },
  { path: '/wiki', label: 'Personal Wiki', keywords: 'notes markdown' },
  { path: '/regex', label: 'Regex Tester', keywords: 'pattern match test' },
  { path: '/calculator', label: 'Financial Calculator', keywords: 'loan interest retirement' },
  { path: '/settings', label: 'Settings', keywords: 'preferences api key' },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpen(p => !p); setQuery(''); setSelectedIndex(0); }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50); }, [open]);

  const filtered = useMemo(() => {
    if (!query.trim()) return PAGES;
    const q = query.toLowerCase();
    return PAGES.filter(p => p.label.toLowerCase().includes(q) || p.keywords.includes(q));
  }, [query]);

  useEffect(() => { setSelectedIndex(0); }, [filtered]);
  useEffect(() => { listRef.current?.children[selectedIndex]?.scrollIntoView({ block: 'nearest' }); }, [selectedIndex]);

  const select = useCallback((path) => { navigate(path); setOpen(false); setQuery(''); }, [navigate]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (filtered[selectedIndex]) select(filtered[selectedIndex].path); }
  }, [filtered, selectedIndex, select]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] px-4">
      <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-lg bg-background border border-border shadow-2xl overflow-hidden animate-slideUp">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-muted-foreground shrink-0">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Search pages..." className="flex-1 bg-transparent text-foreground text-sm placeholder-muted-foreground outline-none" />
          <kbd className="hidden sm:block text-[10px] text-muted-foreground/60 font-mono">ESC</kbd>
        </div>
        <div ref={listRef} className="max-h-[40vh] overflow-y-auto py-1">
          {filtered.length === 0 && <div className="px-4 py-8 text-center text-muted-foreground text-sm">No results for "{query}"</div>}
          {filtered.map((page, i) => (
            <button key={page.path} onClick={() => select(page.path)} onMouseEnter={() => setSelectedIndex(i)}
              className={`w-full flex items-center justify-between px-4 py-2 text-left text-sm transition-colors ${
                i === selectedIndex ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/50'
              }`}>
              <span>{page.label}</span>
              <span className="text-[10px] text-muted-foreground/40 font-mono">{page.path}</span>
            </button>
          ))}
        </div>
        <div className="px-4 py-2 border-t border-border flex items-center gap-4 text-[10px] text-muted-foreground/40">
          <span><kbd className="font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono">↵</kbd> open</span>
          <span><kbd className="font-mono">esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
