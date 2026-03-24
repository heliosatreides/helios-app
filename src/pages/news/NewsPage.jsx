import { useState, useEffect, useCallback, useRef } from 'react';
import { useGemini } from '../../hooks/useGemini';
import { buildFeedUrl, formatRelativeTime, FEED_TOPICS, parseRssResponse } from './newsUtils';

const PAGE_SIZE = 10;
const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const INTERESTS_KEY = 'helios-news-interests';

// ── Loading skeleton ──────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-[#111113] border border-[#27272a] rounded-xl p-4 animate-pulse">
      <div className="h-4 bg-[#27272a] rounded w-3/4 mb-2" />
      <div className="h-3 bg-[#27272a] rounded w-1/4 mb-3" />
      <div className="h-3 bg-[#27272a] rounded w-full mb-1" />
      <div className="h-3 bg-[#27272a] rounded w-5/6" />
    </div>
  );
}

// ── News card ─────────────────────────────────────────────────────────────

function NewsCard({ article }) {
  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-[#111113] border border-[#27272a] hover:border-amber-500/40 rounded-xl p-4 transition-colors group"
    >
      <h3 className="text-[#e4e4e7] text-sm font-medium leading-snug group-hover:text-amber-400 transition-colors line-clamp-2 mb-1">
        {article.title}
      </h3>
      <div className="flex items-center gap-2 text-xs text-[#52525b] mb-2">
        <span className="text-[#71717a]">{article.source}</span>
        <span>·</span>
        <span>{formatRelativeTime(article.pubDate)}</span>
      </div>
      {article.excerpt && (
        <p className="text-[#71717a] text-xs leading-relaxed line-clamp-2">{article.excerpt}</p>
      )}
    </a>
  );
}

// ── AI result card ────────────────────────────────────────────────────────

function AiCard({ title, content, onDismiss }) {
  if (!content) return null;
  return (
    <div className="border border-amber-500/30 bg-amber-950/20 rounded-xl p-4 relative">
      <button
        type="button"
        onClick={onDismiss}
        className="absolute top-3 right-3 text-[#52525b] hover:text-[#e4e4e7] text-sm"
        aria-label="Dismiss"
      >
        ×
      </button>
      <p className="text-amber-400 text-xs font-semibold mb-2">✨ {title}</p>
      <p className="text-[#e4e4e7] text-sm leading-relaxed whitespace-pre-wrap pr-4">{content}</p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

export function NewsPage() {
  const [activeTopic, setActiveTopic] = useState(FEED_TOPICS[0].id);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [aiResult, setAiResult] = useState(null);
  const [aiTitle, setAiTitle] = useState('');
  const [aiError, setAiError] = useState(null);
  const { generate, loading: aiLoading, hasKey } = useGemini();
  const refreshTimer = useRef(null);

  const topic = FEED_TOPICS.find((t) => t.id === activeTopic) || FEED_TOPICS[0];

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    const all = [];

    for (const feedUrl of topic.feeds) {
      try {
        const res = await fetch(buildFeedUrl(feedUrl));
        if (!res.ok) continue;
        const data = await res.json();
        const parsed = parseRssResponse(data);
        all.push(...parsed);
      } catch {
        // graceful per-feed error
      }
    }

    let sorted = all.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    // Apply filter if topic has one (e.g., Show HN for startups)
    if (topic.filter) {
      sorted = sorted.filter(topic.filter);
    }

    if (sorted.length === 0) {
      setError('Could not load articles. Please try again later.');
    }
    setArticles(sorted);
    setLoading(false);
  }, [topic]);

  useEffect(() => {
    setPage(1);
    setArticles([]);
    setAiResult(null);
    fetchArticles();

    // Auto-refresh every 10 minutes
    refreshTimer.current = setInterval(fetchArticles, REFRESH_INTERVAL_MS);
    return () => clearInterval(refreshTimer.current);
  }, [fetchArticles]);

  const visibleArticles = articles.slice(0, page * PAGE_SIZE);
  const hasMore = visibleArticles.length < articles.length;

  const handleSummarize = async () => {
    const top5 = articles.slice(0, 5).map((a) => a.title).join('\n');
    setAiResult(null);
    setAiError(null);
    setAiTitle('Top Story Briefing');
    try {
      const text = await generate(
        `Here are the top 5 news headlines:\n${top5}\n\nWrite a concise 3-sentence news briefing summarizing these stories for a busy reader.`
      );
      setAiResult(text);
    } catch (err) {
      setAiError(err.message);
    }
  };

  const handleWhatToRead = async () => {
    setAiResult(null);
    setAiError(null);
    setAiTitle('Reading Recommendation');

    let interests = localStorage.getItem(INTERESTS_KEY);
    if (!interests) {
      interests = prompt('What topics interest you most? (e.g., technology, finance, sports, AI)') || '';
      if (interests) localStorage.setItem(INTERESTS_KEY, interests);
    }

    const titles = articles
      .slice(0, 10)
      .map((a, i) => `${i + 1}. ${a.title}`)
      .join('\n');

    try {
      const text = await generate(
        `The user's interests: ${interests || 'general news and technology'}.\n\nHere are current news articles:\n${titles}\n\nWhich article should they read first and why? Give a 2-sentence recommendation.`
      );
      setAiResult(text);
    } catch (err) {
      setAiError(err.message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#e4e4e7]">📰 News</h1>
          <p className="text-[#71717a] text-sm mt-0.5">Latest stories across topics</p>
        </div>
        {!loading && articles.length > 0 && (
          <button
            type="button"
            onClick={fetchArticles}
            className="text-[#52525b] hover:text-[#e4e4e7] text-xs transition-colors"
            title="Refresh"
          >
            ↻ Refresh
          </button>
        )}
      </div>

      {/* Topic pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {FEED_TOPICS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTopic(t.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
              activeTopic === t.id
                ? 'bg-amber-500 text-black'
                : 'bg-[#27272a] text-[#71717a] hover:text-[#e4e4e7]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* AI buttons */}
      {hasKey && articles.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleSummarize}
            disabled={aiLoading}
            className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {aiLoading ? '⏳ Thinking…' : '✨ Summarize top stories'}
          </button>
          <button
            type="button"
            onClick={handleWhatToRead}
            disabled={aiLoading}
            className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {aiLoading ? '⏳ Thinking…' : '✨ What should I read?'}
          </button>
        </div>
      )}

      {aiError && <p className="text-red-400 text-xs">❌ {aiError}</p>}
      {aiResult && (
        <AiCard title={aiTitle} content={aiResult} onDismiss={() => setAiResult(null)} />
      )}

      {/* Article list */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-4 text-center">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            type="button"
            onClick={fetchArticles}
            className="mt-2 text-xs text-[#71717a] hover:text-[#e4e4e7] transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && visibleArticles.length > 0 && (
        <>
          <div className="space-y-3">
            {visibleArticles.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                className="bg-[#27272a] hover:bg-[#3f3f46] text-[#a1a1aa] text-sm px-5 py-2 rounded-lg transition-colors"
              >
                Load more
              </button>
            </div>
          )}
        </>
      )}

      {!loading && !error && articles.length === 0 && (
        <p className="text-[#52525b] text-sm text-center py-8">No articles found.</p>
      )}
    </div>
  );
}
