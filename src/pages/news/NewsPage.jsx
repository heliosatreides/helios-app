import { useState, useEffect, useCallback, useRef } from 'react';
import { useGemini } from '../../hooks/useGemini';
import { buildFeedUrl, formatRelativeTime, FEED_TOPICS, parseRssResponse } from './newsUtils';

const PAGE_SIZE = 10;
const REFRESH_INTERVAL_MS = 10 * 60 * 1000;
const INTERESTS_KEY = 'helios-news-interests';

function SkeletonCard() {
  return (
    <div className="bg-[#0c0c0e] border border-[#1c1c20] rounded-2xl p-5 animate-pulse">
      <div className="h-4 bg-[#1c1c20] rounded-lg w-3/4 mb-2.5" />
      <div className="h-3 bg-[#1c1c20] rounded-lg w-1/4 mb-3" />
      <div className="h-3 bg-[#1c1c20] rounded-lg w-full mb-1.5" />
      <div className="h-3 bg-[#1c1c20] rounded-lg w-5/6" />
    </div>
  );
}

function NewsCard({ article }) {
  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-[#0c0c0e] border border-[#1c1c20] hover:border-amber-500/30 rounded-2xl p-5 transition-all duration-200 group hover:shadow-lg hover:shadow-amber-500/5"
    >
      <h3 className="text-[#e4e4e7] text-sm font-medium leading-snug group-hover:text-amber-400 transition-colors line-clamp-2 mb-2">
        {article.title}
      </h3>
      <div className="flex items-center gap-2 text-xs text-[#3f3f46] mb-2">
        <span className="text-[#52525b] font-medium">{article.source}</span>
        <span className="w-1 h-1 rounded-full bg-[#27272a]" />
        <span>{formatRelativeTime(article.pubDate)}</span>
      </div>
      {article.excerpt && (
        <p className="text-[#52525b] text-xs leading-relaxed line-clamp-2">{article.excerpt}</p>
      )}
    </a>
  );
}

function AiCard({ title, content, onDismiss }) {
  if (!content) return null;
  return (
    <div className="border border-amber-500/20 bg-amber-500/5 rounded-2xl p-5 relative animate-fadeIn">
      <button
        type="button"
        onClick={onDismiss}
        className="absolute top-4 right-4 text-[#3f3f46] hover:text-[#71717a] text-sm transition-colors"
        aria-label="Dismiss"
      >
        ×
      </button>
      <p className="text-amber-400 text-xs font-semibold mb-2">✨ {title}</p>
      <p className="text-[#a1a1aa] text-sm leading-relaxed whitespace-pre-wrap pr-6">{content}</p>
    </div>
  );
}

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#e4e4e7]">News</h1>
          <p className="text-[#52525b] text-sm mt-0.5">Latest stories across topics</p>
        </div>
        {!loading && articles.length > 0 && (
          <button
            type="button"
            onClick={fetchArticles}
            className="text-[#3f3f46] hover:text-[#71717a] text-xs transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[#111113]"
            title="Refresh"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M1 4v6h6" /><path d="M23 20v-6h-6" />
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
            </svg>
            Refresh
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
            className={`shrink-0 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTopic === t.id
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm shadow-amber-500/5'
                : 'bg-[#0c0c0e] text-[#52525b] border border-[#1c1c20] hover:text-[#a1a1aa] hover:border-[#27272a]'
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
            className="bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 text-amber-400 text-xs font-medium px-3.5 py-2 rounded-xl transition-all disabled:opacity-50"
          >
            {aiLoading ? '⏳ Thinking…' : '✨ Summarize top stories'}
          </button>
          <button
            type="button"
            onClick={handleWhatToRead}
            disabled={aiLoading}
            className="bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 text-amber-400 text-xs font-medium px-3.5 py-2 rounded-xl transition-all disabled:opacity-50"
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
        <div className="bg-red-400/5 border border-red-400/20 rounded-2xl p-6 text-center">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            type="button"
            onClick={fetchArticles}
            className="mt-3 text-xs text-[#52525b] hover:text-[#a1a1aa] transition-colors"
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
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                className="bg-[#0c0c0e] hover:bg-[#111113] border border-[#1c1c20] hover:border-[#27272a] text-[#71717a] text-sm px-6 py-2.5 rounded-xl transition-all"
              >
                Load more
              </button>
            </div>
          )}
        </>
      )}

      {!loading && !error && articles.length === 0 && (
        <p className="text-[#3f3f46] text-sm text-center py-12">No articles found.</p>
      )}
    </div>
  );
}
