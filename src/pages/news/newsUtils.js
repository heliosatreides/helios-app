// ── News utility functions ────────────────────────────────────────────────

const ALLORIGINS_BASE = 'https://api.allorigins.win/raw?url=';

export function buildFeedUrl(rssUrl) {
  return ALLORIGINS_BASE + encodeURIComponent(rssUrl);
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
    feeds: [
      'https://feeds.marketwatch.com/marketwatch/topstories/',
      'https://www.cnbc.com/id/100003114/device/rss/rss.html',
    ],
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
 * Parse raw RSS 2.0 or Atom XML text into normalized article objects.
 * Uses DOMParser (browser-native, no dependencies).
 */
export function parseRssXml(xmlText, sourceLabel) {
  if (!xmlText || typeof xmlText !== 'string') return [];

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'application/xml');

    // Check for parse errors
    const parseError = doc.querySelector('parsererror');
    if (parseError) return [];

    // Try RSS 2.0 first (<item> elements)
    const rssItems = doc.querySelectorAll('item');
    if (rssItems.length > 0) {
      const feedTitle = sourceLabel || doc.querySelector('channel > title')?.textContent || '';
      return Array.from(rssItems).map((item) => {
        const title = item.querySelector('title')?.textContent || '';
        const link = item.querySelector('link')?.textContent || '';
        const guid = item.querySelector('guid')?.textContent || link || title;
        const pubDate = item.querySelector('pubDate')?.textContent || '';
        const description = item.querySelector('description')?.textContent || '';
        return {
          id: guid,
          title,
          link,
          source: feedTitle,
          pubDate,
          excerpt: truncateExcerpt(description, 100),
        };
      });
    }

    // Try Atom (<entry> elements)
    const atomEntries = doc.querySelectorAll('entry');
    if (atomEntries.length > 0) {
      const feedTitle = sourceLabel || doc.querySelector('feed > title')?.textContent || '';
      return Array.from(atomEntries).map((entry) => {
        const title = entry.querySelector('title')?.textContent || '';
        const linkEl = entry.querySelector('link[href]');
        const link = linkEl ? linkEl.getAttribute('href') : '';
        const id = entry.querySelector('id')?.textContent || link || title;
        const pubDate = entry.querySelector('published')?.textContent
          || entry.querySelector('updated')?.textContent || '';
        const description = entry.querySelector('summary')?.textContent
          || entry.querySelector('content')?.textContent || '';
        return {
          id,
          title,
          link,
          source: feedTitle,
          pubDate,
          excerpt: truncateExcerpt(description, 100),
        };
      });
    }

    return [];
  } catch {
    return [];
  }
}

/**
 * Legacy: Parse rss2json API response. Kept for backward compatibility.
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

/**
 * Fetch and parse a single RSS feed URL via CORS proxy.
 * Returns normalized article array (same shape as parseRssResponse output).
 */
export async function fetchFeed(feedUrl) {
  const proxyUrl = buildFeedUrl(feedUrl);
  const res = await fetch(proxyUrl);
  if (!res.ok) return [];
  const xmlText = await res.text();
  return parseRssXml(xmlText);
}
