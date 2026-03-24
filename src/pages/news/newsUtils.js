// ── News utility functions ────────────────────────────────────────────────

const RSS2JSON_BASE = 'https://api.rss2json.com/v1/api.json?rss_url=';

export function buildFeedUrl(rssUrl) {
  return RSS2JSON_BASE + encodeURIComponent(rssUrl);
}

/**
 * Format a date string as relative time ("2 hours ago", "3 days ago", etc.)
 */
export function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  const diffWk = Math.floor(diffDay / 7);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`;
  if (diffHr < 24) return diffHr === 1 ? '1 hour ago' : `${diffHr} hours ago`;
  if (diffDay < 7) return diffDay === 1 ? '1 day ago' : `${diffDay} days ago`;
  if (diffWk < 4) return diffWk === 1 ? '1 week ago' : `${diffWk} weeks ago`;
  return date.toLocaleDateString();
}

/**
 * Truncate text to maxLen characters, appending '…' if truncated.
 */
export function truncateExcerpt(text, maxLen = 100) {
  if (!text) return '';
  const clean = text.replace(/<[^>]*>/g, '').trim();
  if (clean.length <= maxLen) return clean;
  return clean.slice(0, maxLen).trimEnd() + '…';
}

export const FEED_TOPICS = [
  {
    id: 'general',
    label: '🌐 General',
    feeds: ['https://feeds.bbci.co.uk/news/rss.xml'],
  },
  {
    id: 'tech',
    label: '💻 Tech',
    feeds: [
      'https://feeds.feedburner.com/TechCrunch',
      'https://hnrss.org/frontpage',
    ],
  },
  {
    id: 'startups',
    label: '🚀 Startups',
    feeds: ['https://news.ycombinator.com/rss'],
    filter: (item) => item.title && item.title.startsWith('Show HN'),
  },
  {
    id: 'finance',
    label: '📈 Finance',
    feeds: ['https://feeds.reuters.com/reuters/businessNews'],
  },
  {
    id: 'crypto',
    label: '🪙 Crypto',
    feeds: [
      'https://cointelegraph.com/rss',
      'https://coindesk.com/arc/outboundfeeds/rss/',
    ],
  },
  {
    id: 'sports',
    label: '⚽ Sports',
    feeds: ['https://www.espn.com/espn/rss/news'],
  },
  {
    id: 'ai',
    label: '🤖 AI',
    feeds: ['https://techcrunch.com/tag/artificial-intelligence/feed/'],
  },
];

/**
 * Parse raw rss2json API response into normalized article objects.
 */
export function parseRssResponse(data, sourceLabel) {
  if (!data || data.status !== 'ok' || !Array.isArray(data.items)) return [];
  return data.items.map((item) => ({
    id: item.guid || item.link || item.title,
    title: item.title || '',
    link: item.link || '',
    source: sourceLabel || data.feed?.title || '',
    pubDate: item.pubDate || '',
    excerpt: truncateExcerpt(item.description || item.content || '', 100),
  }));
}
