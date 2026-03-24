import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const PAGES = [
  { path: '/dashboard', label: 'Dashboard', icon: '⚡', keywords: 'home overview summary' },
  { path: '/planner', label: 'Daily Planner', icon: '🗓️', keywords: 'schedule tasks today calendar' },
  { path: '/goals', label: 'Goals & OKRs', icon: '🎯', keywords: 'objectives key results progress' },
  { path: '/resume', label: 'Resume Builder', icon: '📄', keywords: 'cv job career' },
  { path: '/trips', label: 'Trips', icon: '✈️', keywords: 'travel vacation itinerary' },
  { path: '/finance', label: 'Finance', icon: '💰', keywords: 'money accounts transactions budget' },
  { path: '/investments', label: 'Investments', icon: '📈', keywords: 'portfolio stocks crypto' },
  { path: '/sports', label: 'Sports Hub', icon: '🏆', keywords: 'scores standings nba nfl' },
  { path: '/health', label: 'Health & Wellness', icon: '🏥', keywords: 'water mood sleep tracker' },
  { path: '/meals', label: 'Meal Planner', icon: '🍽️', keywords: 'food diet grocery' },
  { path: '/subscriptions', label: 'Subscriptions', icon: '📋', keywords: 'recurring payments' },
  { path: '/chat', label: 'P2P Chat', icon: '💬', keywords: 'message encrypted peer' },
  { path: '/focus', label: 'Focus Mode', icon: '🔥', keywords: 'pomodoro timer habits' },
  { path: '/knowledge', label: 'Knowledge Base', icon: '📚', keywords: 'reading books articles' },
  { path: '/networking', label: 'Networking / CRM', icon: '🤝', keywords: 'contacts follow-up' },
  { path: '/news', label: 'News', icon: '📰', keywords: 'headlines articles feed' },
  { path: '/flashcards', label: 'Flashcards', icon: '🃏', keywords: 'study spaced repetition' },
  { path: '/music', label: 'Music', icon: '🎵', keywords: 'recommendations mood playlist' },
  { path: '/splitter', label: 'Expense Splitter', icon: '💸', keywords: 'split bills friends' },
  { path: '/packing', label: 'Packing Lists', icon: '🧳', keywords: 'travel checklist' },
  { path: '/devtools', label: 'Dev Tools', icon: '💻', keywords: 'github snippets standup' },
  { path: '/converter', label: 'Converter', icon: '🔄', keywords: 'currency units exchange' },
  { path: '/worldclock', label: 'World Clock', icon: '🕐', keywords: 'timezone meeting' },
  { path: '/apiplayground', label: 'API Playground', icon: '🔌', keywords: 'rest http request' },
  { path: '/colors', label: 'Color Palette', icon: '🎨', keywords: 'css design generate' },
  { path: '/wiki', label: 'Personal Wiki', icon: '📝', keywords: 'notes markdown' },
  { path: '/regex', label: 'Regex Tester', icon: '🔤', keywords: 'pattern match test' },
  { path: '/calculator', label: 'Financial Calculator', icon: '🧮', keywords: 'loan interest retirement' },
  { path: '/settings', label: 'Settings', icon: '⚙️', keywords: 'preferences api key' },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Open on Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
        setQuery('');
        setSelectedIndex(0);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const filtered = useMemo(() => {
    if (!query.trim()) return PAGES;
    const q = query.toLowerCase();
    return PAGES.filter((p) =>
      p.label.toLowerCase().includes(q) ||
      p.keywords.includes(q) ||
      p.path.includes(q)
    );
  }, [query]);

  // Reset selection on filter change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filtered]);

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.children[selectedIndex];
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const select = useCallback((path) => {
    navigate(path);
    setOpen(false);
    setQuery('');
  }, [navigate]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) select(filtered[selectedIndex].path);
    }
  }, [filtered, selectedIndex, select]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Palette */}
      <div className="relative w-full max-w-lg bg-[#0c0c0e] border border-[#1c1c20] rounded-2xl shadow-2xl shadow-black/40 overflow-hidden animate-slideUp">
        {/* Search input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1c1c20]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages…"
            className="flex-1 bg-transparent text-[#e4e4e7] text-sm placeholder-[#3f3f46] outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 text-[10px] text-[#3f3f46] bg-[#18181b] px-1.5 py-0.5 rounded-md border border-[#27272a] font-mono">ESC</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[40vh] overflow-y-auto py-2">
          {filtered.length === 0 && (
            <div className="px-5 py-8 text-center">
              <p className="text-[#3f3f46] text-sm">No pages match "{query}"</p>
            </div>
          )}
          {filtered.map((page, i) => (
            <button
              key={page.path}
              onClick={() => select(page.path)}
              onMouseEnter={() => setSelectedIndex(i)}
              className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${
                i === selectedIndex
                  ? 'bg-amber-500/10 text-amber-400'
                  : 'text-[#a1a1aa] hover:bg-[#111113]'
              }`}
            >
              <span className="text-base w-6 text-center shrink-0">{page.icon}</span>
              <span className="text-sm font-medium">{page.label}</span>
              <span className="text-[10px] text-[#3f3f46] ml-auto font-mono">{page.path}</span>
            </button>
          ))}
        </div>

        {/* Footer hint */}
        <div className="px-5 py-2.5 border-t border-[#1c1c20] flex items-center gap-4 text-[10px] text-[#3f3f46]">
          <span className="flex items-center gap-1">
            <kbd className="bg-[#18181b] px-1 py-0.5 rounded border border-[#27272a] font-mono">↑↓</kbd> navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-[#18181b] px-1 py-0.5 rounded border border-[#27272a] font-mono">↵</kbd> open
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-[#18181b] px-1 py-0.5 rounded border border-[#27272a] font-mono">esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}
