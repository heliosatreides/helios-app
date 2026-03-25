import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  buildFeedUrl,
  formatRelativeTime,
  truncateExcerpt,
  parseRssResponse,
  parseRssXml,
  fetchFeed,
  FEED_TOPICS,
} from './newsUtils';

// ── buildFeedUrl ──────────────────────────────────────────────────────────

describe('buildFeedUrl', () => {
  it('encodes the RSS URL into the allorigins proxy base', () => {
    const url = buildFeedUrl('https://feeds.bbci.co.uk/news/rss.xml');
    expect(url).toContain('https://api.allorigins.win/raw?url=');
    expect(url).toContain(encodeURIComponent('https://feeds.bbci.co.uk/news/rss.xml'));
  });

  it('correctly encodes special characters', () => {
    const rss = 'https://example.com/feed?cat=news&lang=en';
    const url = buildFeedUrl(rss);
    expect(url).toContain(encodeURIComponent(rss));
  });
});

// ── formatRelativeTime ────────────────────────────────────────────────────

describe('formatRelativeTime', () => {
  let RealDate;
  beforeEach(() => {
    RealDate = Date;
    const now = new Date('2024-06-01T12:00:00Z').getTime();
    vi.spyOn(Date, 'now').mockReturnValue(now);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns "just now" for times less than 60 seconds ago', () => {
    const d = new Date(Date.now() - 30_000).toISOString();
    expect(formatRelativeTime(d)).toBe('just now');
  });

  it('returns "X minutes ago" for times within the last hour', () => {
    const d = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(formatRelativeTime(d)).toBe('5 minutes ago');
  });

  it('returns "1 minute ago" for singular', () => {
    const d = new Date(Date.now() - 61_000).toISOString();
    expect(formatRelativeTime(d)).toBe('1 minute ago');
  });

  it('returns "X hours ago" for times within the last day', () => {
    const d = new Date(Date.now() - 2 * 3600_000).toISOString();
    expect(formatRelativeTime(d)).toBe('2 hours ago');
  });

  it('returns "1 hour ago" for singular', () => {
    const d = new Date(Date.now() - 3601_000).toISOString();
    expect(formatRelativeTime(d)).toBe('1 hour ago');
  });

  it('returns "X days ago" for times within the last week', () => {
    const d = new Date(Date.now() - 3 * 86400_000).toISOString();
    expect(formatRelativeTime(d)).toBe('3 days ago');
  });

  it('returns "1 day ago" for singular', () => {
    const d = new Date(Date.now() - 86401_000).toISOString();
    expect(formatRelativeTime(d)).toBe('1 day ago');
  });

  it('returns "X weeks ago" for times > 1 week', () => {
    const d = new Date(Date.now() - 14 * 86400_000).toISOString();
    expect(formatRelativeTime(d)).toBe('2 weeks ago');
  });

  it('returns empty string for null/undefined', () => {
    expect(formatRelativeTime(null)).toBe('');
    expect(formatRelativeTime(undefined)).toBe('');
    expect(formatRelativeTime('')).toBe('');
  });

  it('returns empty string for invalid date', () => {
    expect(formatRelativeTime('not-a-date')).toBe('');
  });
});

// ── truncateExcerpt ───────────────────────────────────────────────────────

describe('truncateExcerpt', () => {
  it('returns the full text if shorter than maxLen', () => {
    expect(truncateExcerpt('Short text', 100)).toBe('Short text');
  });

  it('truncates to maxLen with ellipsis', () => {
    const long = 'a'.repeat(150);
    const result = truncateExcerpt(long, 100);
    expect(result.length).toBe(101); // 100 chars + '…'
    expect(result.endsWith('…')).toBe(true);
  });

  it('strips HTML tags from text', () => {
    const html = '<p>Hello <strong>world</strong>!</p>';
    expect(truncateExcerpt(html, 100)).toBe('Hello world!');
  });

  it('returns empty string for null/undefined', () => {
    expect(truncateExcerpt(null)).toBe('');
    expect(truncateExcerpt(undefined)).toBe('');
  });
});

// ── parseRssXml ───────────────────────────────────────────────────────────

describe('parseRssXml', () => {
  const rss2xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>BBC News</title>
    <item>
      <guid>guid-1</guid>
      <title>Breaking news headline</title>
      <link>https://bbc.com/article/1</link>
      <pubDate>Sat, 01 Jun 2024 10:00:00 GMT</pubDate>
      <description>&lt;p&gt;Some description text here.&lt;/p&gt;</description>
    </item>
    <item>
      <guid>guid-2</guid>
      <title>Another article</title>
      <link>https://bbc.com/article/2</link>
      <pubDate>Sat, 01 Jun 2024 09:00:00 GMT</pubDate>
      <description>Plain text description.</description>
    </item>
  </channel>
</rss>`;

  const atomXml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Atom Feed</title>
  <entry>
    <id>atom-1</id>
    <title>Atom article one</title>
    <link href="https://example.com/atom/1" />
    <published>2024-06-01T10:00:00Z</published>
    <summary>Atom summary text.</summary>
  </entry>
  <entry>
    <id>atom-2</id>
    <title>Atom article two</title>
    <link href="https://example.com/atom/2" />
    <updated>2024-06-01T09:00:00Z</updated>
    <content>Atom content text.</content>
  </entry>
</feed>`;

  it('returns empty array for null/undefined', () => {
    expect(parseRssXml(null)).toHaveLength(0);
    expect(parseRssXml(undefined)).toHaveLength(0);
    expect(parseRssXml('')).toHaveLength(0);
  });

  it('returns empty array for non-string input', () => {
    expect(parseRssXml(42)).toHaveLength(0);
    expect(parseRssXml({})).toHaveLength(0);
  });

  it('returns empty array for invalid XML', () => {
    expect(parseRssXml('not xml at all <><>')).toHaveLength(0);
  });

  it('parses RSS 2.0 items correctly', () => {
    const result = parseRssXml(rss2xml);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('guid-1');
    expect(result[0].title).toBe('Breaking news headline');
    expect(result[0].link).toBe('https://bbc.com/article/1');
    expect(result[0].source).toBe('BBC News');
    expect(result[0].pubDate).toBe('Sat, 01 Jun 2024 10:00:00 GMT');
    expect(result[0].excerpt).toContain('Some description text here');
    expect(result[0].excerpt).not.toContain('<p>');
  });

  it('uses sourceLabel override for RSS 2.0', () => {
    const result = parseRssXml(rss2xml, 'Custom Source');
    expect(result[0].source).toBe('Custom Source');
  });

  it('parses Atom entries correctly', () => {
    const result = parseRssXml(atomXml);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('atom-1');
    expect(result[0].title).toBe('Atom article one');
    expect(result[0].link).toBe('https://example.com/atom/1');
    expect(result[0].source).toBe('Atom Feed');
    expect(result[0].pubDate).toBe('2024-06-01T10:00:00Z');
    expect(result[0].excerpt).toBe('Atom summary text.');
  });

  it('falls back to updated date for Atom entries without published', () => {
    const result = parseRssXml(atomXml);
    expect(result[1].pubDate).toBe('2024-06-01T09:00:00Z');
  });

  it('falls back to content when summary is missing in Atom', () => {
    const result = parseRssXml(atomXml);
    expect(result[1].excerpt).toBe('Atom content text.');
  });

  it('uses sourceLabel override for Atom', () => {
    const result = parseRssXml(atomXml, 'Custom Atom');
    expect(result[0].source).toBe('Custom Atom');
  });

  it('returns empty array for XML with no items or entries', () => {
    const emptyRss = `<?xml version="1.0"?><rss><channel><title>Empty</title></channel></rss>`;
    expect(parseRssXml(emptyRss)).toHaveLength(0);
  });
});

// ── fetchFeed ─────────────────────────────────────────────────────────────

describe('fetchFeed', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches via allorigins proxy and parses XML', async () => {
    const xml = `<?xml version="1.0"?><rss version="2.0"><channel><title>Test</title>
      <item><title>Article 1</title><link>https://example.com/1</link><pubDate>2024-06-01</pubDate><description>Desc</description></item>
    </channel></rss>`;

    fetch.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(xml) });

    const result = await fetchFeed('https://example.com/feed.xml');
    expect(fetch).toHaveBeenCalledWith(
      'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://example.com/feed.xml')
    );
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Article 1');
    expect(result[0].source).toBe('Test');
  });

  it('returns empty array on fetch failure', async () => {
    fetch.mockResolvedValueOnce({ ok: false });
    const result = await fetchFeed('https://example.com/feed.xml');
    expect(result).toHaveLength(0);
  });

  it('returns empty array on network error', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));
    await expect(fetchFeed('https://example.com/feed.xml')).rejects.toThrow('Network error');
  });
});

// ── parseRssResponse (legacy, backward compat) ───────────────────────────

describe('parseRssResponse', () => {
  const mockData = {
    status: 'ok',
    feed: { title: 'BBC News' },
    items: [
      {
        guid: 'guid-1',
        title: 'Breaking news headline',
        link: 'https://bbc.com/article/1',
        pubDate: '2024-06-01T10:00:00Z',
        description: '<p>Some description text here.</p>',
      },
      {
        guid: 'guid-2',
        title: 'Another article',
        link: 'https://bbc.com/article/2',
        pubDate: '2024-06-01T09:00:00Z',
        description: 'Plain text description.',
      },
    ],
  };

  it('returns empty array for null data', () => {
    expect(parseRssResponse(null)).toHaveLength(0);
  });

  it('returns empty array when status is not ok', () => {
    expect(parseRssResponse({ status: 'error', items: [] })).toHaveLength(0);
  });

  it('parses items correctly', () => {
    const result = parseRssResponse(mockData, 'BBC');
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('guid-1');
    expect(result[0].title).toBe('Breaking news headline');
    expect(result[0].source).toBe('BBC');
    expect(result[0].link).toBe('https://bbc.com/article/1');
  });

  it('strips HTML from excerpt', () => {
    const result = parseRssResponse(mockData);
    expect(result[0].excerpt).not.toContain('<p>');
    expect(result[0].excerpt).toContain('Some description text here');
  });

  it('falls back to feed title as source when not provided', () => {
    const result = parseRssResponse(mockData);
    expect(result[0].source).toBe('BBC News');
  });
});

// ── FEED_TOPICS ───────────────────────────────────────────────────────────

describe('FEED_TOPICS', () => {
  it('has 7 topics', () => {
    expect(FEED_TOPICS).toHaveLength(7);
  });

  it('each topic has id, label, and feeds array', () => {
    FEED_TOPICS.forEach((topic) => {
      expect(topic.id).toBeTruthy();
      expect(topic.label).toBeTruthy();
      expect(Array.isArray(topic.feeds)).toBe(true);
      expect(topic.feeds.length).toBeGreaterThan(0);
    });
  });

  it('startups topic has a filter function', () => {
    const startups = FEED_TOPICS.find((t) => t.id === 'startups');
    expect(typeof startups.filter).toBe('function');
    expect(startups.filter({ title: 'Show HN: My project' })).toBe(true);
    expect(startups.filter({ title: 'Regular post' })).toBe(false);
  });
});
