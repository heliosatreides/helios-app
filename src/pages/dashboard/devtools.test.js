import { describe, it, expect } from 'vitest';
import {
  formatGitHubEventType,
  eventTypeBadgeClass,
  searchSnippets,
  getSnippetLanguages,
  createSnippet,
} from './devtools.utils';

// ── GitHub event type formatting ───────────────────────────────────────────

describe('formatGitHubEventType', () => {
  it('maps PushEvent → Push', () => {
    expect(formatGitHubEventType('PushEvent')).toBe('Push');
  });

  it('maps PullRequestEvent → PR', () => {
    expect(formatGitHubEventType('PullRequestEvent')).toBe('PR');
  });

  it('maps IssuesEvent → Issue', () => {
    expect(formatGitHubEventType('IssuesEvent')).toBe('Issue');
  });

  it('maps CreateEvent → Create', () => {
    expect(formatGitHubEventType('CreateEvent')).toBe('Create');
  });

  it('maps WatchEvent → Star', () => {
    expect(formatGitHubEventType('WatchEvent')).toBe('Star');
  });

  it('strips "Event" suffix for unknown types', () => {
    expect(formatGitHubEventType('SomethingEvent')).toBe('Something');
  });

  it('maps ReleaseEvent → Release', () => {
    expect(formatGitHubEventType('ReleaseEvent')).toBe('Release');
  });
});

describe('eventTypeBadgeClass', () => {
  it('returns blue class for PushEvent', () => {
    const cls = eventTypeBadgeClass('PushEvent');
    expect(cls).toContain('blue');
  });

  it('returns purple class for PullRequestEvent', () => {
    const cls = eventTypeBadgeClass('PullRequestEvent');
    expect(cls).toContain('purple');
  });

  it('returns green class for IssuesEvent', () => {
    const cls = eventTypeBadgeClass('IssuesEvent');
    expect(cls).toContain('green');
  });

  it('returns amber class for CreateEvent', () => {
    const cls = eventTypeBadgeClass('CreateEvent');
    expect(cls).toContain('amber');
  });
});

// ── Snippet search/filter logic ────────────────────────────────────────────

const SNIPPETS = [
  { id: '1', title: 'Fetch API wrapper', language: 'javascript', code: 'fetch(...)', notes: 'reusable helper' },
  { id: '2', title: 'List comprehension', language: 'python', code: '[x for x in xs]', notes: 'filtering' },
  { id: '3', title: 'Array map', language: 'javascript', code: 'arr.map(fn)', notes: '' },
  { id: '4', title: 'SQL Join', language: 'sql', code: 'SELECT * FROM a JOIN b', notes: 'inner join example' },
];

describe('searchSnippets', () => {
  it('returns all snippets when query is empty', () => {
    expect(searchSnippets(SNIPPETS, '')).toHaveLength(4);
  });

  it('returns empty array for null input', () => {
    expect(searchSnippets(null, 'anything')).toHaveLength(0);
  });

  it('filters by title (case-insensitive)', () => {
    const res = searchSnippets(SNIPPETS, 'fetch');
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe('1');
  });

  it('filters by language in query', () => {
    const res = searchSnippets(SNIPPETS, 'python');
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe('2');
  });

  it('filters by language param', () => {
    const res = searchSnippets(SNIPPETS, '', 'javascript');
    expect(res).toHaveLength(2);
  });

  it('combines language filter + query', () => {
    const res = searchSnippets(SNIPPETS, 'map', 'javascript');
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe('3');
  });

  it('filters by notes content', () => {
    const res = searchSnippets(SNIPPETS, 'inner join');
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe('4');
  });

  it('returns empty array when no match', () => {
    expect(searchSnippets(SNIPPETS, 'xyznotfound')).toHaveLength(0);
  });
});

describe('getSnippetLanguages', () => {
  it('returns unique sorted languages', () => {
    const langs = getSnippetLanguages(SNIPPETS);
    expect(langs).toEqual(['javascript', 'python', 'sql']);
  });

  it('returns empty array for null input', () => {
    expect(getSnippetLanguages(null)).toHaveLength(0);
  });
});

describe('createSnippet', () => {
  it('creates a snippet with expected fields', () => {
    const s = createSnippet({ title: 'Test', language: 'js', code: 'const x = 1;', notes: 'note' });
    expect(s.title).toBe('Test');
    expect(s.language).toBe('js');
    expect(s.code).toBe('const x = 1;');
    expect(s.id).toBeTruthy();
    expect(s.createdAt).toBeTruthy();
  });

  it('handles missing optional fields', () => {
    const s = createSnippet({ title: 'Minimal' });
    expect(s.language).toBe('');
    expect(s.notes).toBe('');
  });
});
