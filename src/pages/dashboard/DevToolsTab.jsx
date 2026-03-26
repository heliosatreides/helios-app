import { useState, useEffect, useCallback } from 'react';
import { useIDB } from '../../hooks/useIDB';
import { useGemini } from '../../hooks/useGemini';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { EmptyState } from '../../components/ui';
import { formatGitHubEventType, eventTypeBadgeClass, searchSnippets, getSnippetLanguages, createSnippet } from './devtools.utils';
import { PasswordGenerator } from '../password/PasswordGenerator';

const GITHUB_USERNAME_KEY = 'devtools-github-username';

// ── Shared AI result card ─────────────────────────────────────────────────

function AiResultCard({ title, content, onDismiss }) {
  if (!content) return null;
  return (
    <div className="border border-border bg-secondary/50 p-5 relative animate-fadeIn">
      <button
        type="button"
        onClick={onDismiss}
        className="absolute top-4 right-4 text-muted-foreground/60 hover:text-muted-foreground text-xs transition-colors"
        aria-label="Dismiss"
      >
        Dismiss
      </button>
      <span className="text-foreground text-xs font-medium">✨ {title}</span>
      <p className="text-muted-foreground text-sm mt-2 whitespace-pre-wrap pr-8 leading-relaxed">{content}</p>
    </div>
  );
}

// ── Collapsible card wrapper ──────────────────────────────────────────────

function CollapsibleCard({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-background border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-background transition-colors"
      >
        <span className="text-foreground font-semibold">{title}</span>
        <span className="text-muted-foreground/80 text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

// ── GitHub Activity ───────────────────────────────────────────────────────

function GitHubActivity() {
  const { generate, loading: aiLoading, hasKey } = useGemini();
  const [username, setUsername] = useState(() => localStorage.getItem(GITHUB_USERNAME_KEY) || '');
  const [inputVal, setInputVal] = useState(username);
  const [events, setEvents] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState(null);

  const fetchEvents = useCallback(async (uname) => {
    if (!uname.trim()) return;
    setFetchLoading(true);
    setFetchError(null);
    setEvents([]);
    try {
      const res = await fetch(`https://api.github.com/users/${encodeURIComponent(uname.trim())}/events?per_page=10`);
      if (!res.ok) throw new Error(`GitHub API: ${res.status}`);
      const data = await res.json();
      setEvents(data.slice(0, 5));
    } catch (err) {
      setFetchError(err.message);
    } finally {
      setFetchLoading(false);
    }
  }, []);

  const handleSetUsername = (e) => {
    e.preventDefault();
    const val = inputVal.trim();
    if (!val) return;
    localStorage.setItem(GITHUB_USERNAME_KEY, val);
    setUsername(val);
    fetchEvents(val);
  };

  useEffect(() => {
    if (username) fetchEvents(username);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSummarize = async () => {
    if (!events.length) return;
    setAiResult(null);
    setAiError(null);
    const summary = events.map((e) => {
      const type = formatGitHubEventType(e.type);
      const repo = e.repo?.name || 'unknown';
      return `${type} on ${repo}`;
    }).join(', ');
    try {
      const text = await generate(`Here are my recent GitHub activities: ${summary}. Write a 2-3 sentence summary of my development activity this week. Be encouraging and specific.`);
      setAiResult(text);
    } catch (err) {
      setAiError(err.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Username input */}
      <form onSubmit={handleSetUsername} className="flex gap-2">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="GitHub username"
          className="flex-1 bg-background border border-border px-3 py-2 text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          type="submit"
          className="bg-secondary hover:bg-secondary/80 text-foreground px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap"
        >
          Load
        </button>
      </form>

      {fetchLoading && <p className="text-muted-foreground text-sm">Loading events…</p>}
      {fetchError && <p className="text-red-400 text-xs">❌ {fetchError}</p>}

      {events.length > 0 && (
        <div className="space-y-2">
          {events.map((event) => {
            const type = formatGitHubEventType(event.type);
            const repo = event.repo?.name || 'unknown';
            const ts = event.created_at ? new Date(event.created_at).toLocaleDateString() : '';
            return (
              <div key={event.id} className="flex items-center gap-3 py-1.5 border-b border-border/40 last:border-0">
                <span className={`px-2 py-0.5 rounded text-xs font-semibold shrink-0 ${eventTypeBadgeClass(event.type)}`}>
                  {type}
                </span>
                <span className="text-muted-foreground text-sm truncate flex-1">{repo}</span>
                <span className="text-muted-foreground/80 text-xs shrink-0">{ts}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* AI summarize */}
      {hasKey && events.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleSummarize}
            disabled={aiLoading}
            className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-foreground text-xs font-medium px-3 py-1.5 transition-colors disabled:opacity-50"
          >
            {aiLoading ? '⏳ Analyzing…' : '✨ Summarize my week'}
          </button>
        </div>
      )}
      {aiError && <p className="text-red-400 text-xs">❌ {aiError}</p>}
      {aiResult && <AiResultCard title="Dev Activity Summary" content={aiResult} onDismiss={() => setAiResult(null)} />}
    </div>
  );
}

// ── Code Snippet Manager ──────────────────────────────────────────────────

function SnippetManager() {
  const [snippets, setSnippets] = useIDB('devtools-snippets', []);
  const { generate, loading: aiLoading, hasKey } = useGemini();
  const [query, setQuery] = useState('');
  const [langFilter, setLangFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', language: '', code: '', notes: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [aiResults, setAiResults] = useState({});
  const [copied, setCopied] = useState(null);

  const languages = getSnippetLanguages(snippets);
  const filtered = searchSnippets(snippets, query, langFilter);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.code.trim()) return;
    setSnippets((prev) => [...(prev || []), createSnippet(form)]);
    setForm({ title: '', language: '', code: '', notes: '' });
    setShowAdd(false);
  };

  const handleDelete = (id) => {
    setDeleteTarget(id);
  };
  const confirmDelete = () => {
    setSnippets((prev) => (prev || []).filter((s) => s.id !== deleteTarget));
    setDeleteTarget(null);
  };

  const handleCopy = async (id, code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  };

  const handleExplain = async (snippet) => {
    setAiResults((prev) => ({ ...prev, [snippet.id]: { loading: true, result: null } }));
    try {
      const text = await generate(`Explain what this ${snippet.language || 'code'} snippet does in plain English (2-4 sentences):\n\n${snippet.code}`);
      setAiResults((prev) => ({ ...prev, [snippet.id]: { loading: false, result: text } }));
    } catch (err) {
      setAiResults((prev) => ({ ...prev, [snippet.id]: { loading: false, result: null } }));
    }
  };

  const inputCls = 'bg-background border border-border px-3 py-2 text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring w-full';

  return (
    <div className="space-y-4">
      {/* Search/filter bar */}
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search snippets…"
          className="flex-1 bg-background border border-border px-3 py-2 text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {languages.length > 0 && (
          <select
            value={langFilter}
            onChange={(e) => setLangFilter(e.target.value)}
            className="bg-background border border-border px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All languages</option>
            {languages.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        )}
        <button
          type="button"
          onClick={() => setShowAdd((s) => !s)}
          className="bg-foreground hover:bg-foreground/90 text-background font-medium px-3 py-2 text-sm whitespace-nowrap"
        >
          + Add
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="bg-background border border-border p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-muted-foreground text-xs block mb-1">Title *</label>
              <input className={inputCls} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="My snippet" required />
            </div>
            <div>
              <label className="text-muted-foreground text-xs block mb-1">Language</label>
              <input className={inputCls} value={form.language} onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))} placeholder="javascript" />
            </div>
          </div>
          <div>
            <label className="text-muted-foreground text-xs block mb-1">Code *</label>
            <textarea
              className={inputCls + ' font-mono resize-none'}
              rows={4}
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              placeholder="// your code here"
              required
            />
          </div>
          <div>
            <label className="text-muted-foreground text-xs block mb-1">Notes</label>
            <input className={inputCls} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-foreground hover:bg-foreground/90 text-background font-medium px-3 py-1.5 text-sm">Save</button>
            <button type="button" onClick={() => setShowAdd(false)} className="border border-border text-muted-foreground hover:text-foreground px-3 py-1.5 text-sm">Cancel</button>
          </div>
        </form>
      )}

      {/* Snippet list */}
      {filtered.length === 0 ? (
        <EmptyState title="No snippets yet" description="Add one to get started." />
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => {
            const ai = aiResults[s.id];
            return (
              <div key={s.id} className="bg-background border border-border p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-foreground font-medium truncate">{s.title}</span>
                    {s.language && (
                      <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded shrink-0">{s.language}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopy(s.id, s.code)}
                      className="text-muted-foreground/80 hover:text-amber-400 text-xs transition-colors"
                      title="Copy code"
                    >
                      {copied === s.id ? '✓' : '📋'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(s.id)}
                      className="text-muted-foreground/80 hover:text-red-400 text-xs transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <pre className="text-muted-foreground text-xs font-mono bg-secondary p-3 overflow-x-auto whitespace-pre-wrap break-all">{s.code}</pre>
                {s.notes && <p className="text-muted-foreground/80 text-xs mt-2">{s.notes}</p>}
                {hasKey && (
                  <button
                    type="button"
                    onClick={() => handleExplain(s)}
                    disabled={aiLoading || ai?.loading}
                    className="mt-2 text-muted-foreground hover:text-foreground text-xs transition-colors disabled:opacity-50"
                  >
                    {ai?.loading ? '⏳ Explaining…' : '✨ Explain this snippet'}
                  </button>
                )}
                {ai?.result && (
                  <div className="mt-2">
                    <AiResultCard title="Explanation" content={ai.result} onDismiss={() => setAiResults((prev) => ({ ...prev, [s.id]: { loading: false, result: null } }))} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete snippet?"
        message="This will permanently delete this entry."
      />
    </div>
  );
}

// ── Daily Dev Log ─────────────────────────────────────────────────────────

function DevLog() {
  const today = new Date().toISOString().slice(0, 10);
  const [logs, setLogs] = useIDB('devtools-log', {});
  const { generate, loading: aiLoading, hasKey } = useGemini();
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState(null);

  const todayLog = (logs && logs[today]) || '';

  const handleChange = (val) => {
    setLogs((prev) => ({ ...(prev || {}), [today]: val }));
  };

  const handleStandup = async () => {
    if (!todayLog.trim()) return;
    setAiResult(null);
    setAiError(null);
    try {
      const text = await generate(`Turn this dev log into a concise standup message (What I did, blockers, plan for tomorrow). Dev log:\n\n${todayLog}`);
      setAiResult(text);
    } catch (err) {
      setAiError(err.message);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground/80 text-xs">Today — {today}</p>
      <textarea
        value={todayLog}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="What did you ship today? What are you stuck on?"
        rows={5}
        className="w-full bg-background border border-border px-4 py-3 text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
      />
      <div className="flex gap-2 flex-wrap">
        {hasKey && (
          <button
            type="button"
            onClick={handleStandup}
            disabled={aiLoading || !todayLog.trim()}
            className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-foreground text-xs font-medium px-3 py-1.5 transition-colors disabled:opacity-50"
          >
            {aiLoading ? '⏳ Writing…' : '✨ Write standup'}
          </button>
        )}
      </div>
      {aiError && <p className="text-red-400 text-xs">❌ {aiError}</p>}
      {aiResult && <AiResultCard title="Standup Message" content={aiResult} onDismiss={() => setAiResult(null)} />}
    </div>
  );
}

// ── DevToolsTab ───────────────────────────────────────────────────────────

export function DevToolsTab() {
  return (
    <div className="space-y-4">
      <CollapsibleCard title="🐙 GitHub Activity">
        <GitHubActivity />
      </CollapsibleCard>
      <CollapsibleCard title="📌 Code Snippets">
        <SnippetManager />
      </CollapsibleCard>
      <CollapsibleCard title="📝 Daily Dev Log">
        <DevLog />
      </CollapsibleCard>
      <CollapsibleCard title="🔐 Password Generator" defaultOpen={false}>
        <PasswordGenerator />
      </CollapsibleCard>
    </div>
  );
}
