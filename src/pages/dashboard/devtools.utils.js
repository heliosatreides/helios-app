/**
 * Pure utility functions for Dev Tools tab.
 * Kept separate from components for testability.
 */

/** Map GitHub event type to a short human-readable badge label */
export function formatGitHubEventType(type) {
  const map = {
    PushEvent: 'Push',
    PullRequestEvent: 'PR',
    IssuesEvent: 'Issue',
    CreateEvent: 'Create',
    DeleteEvent: 'Delete',
    ForkEvent: 'Fork',
    WatchEvent: 'Star',
    IssueCommentEvent: 'Comment',
    PullRequestReviewEvent: 'Review',
    PullRequestReviewCommentEvent: 'Review',
    ReleaseEvent: 'Release',
    CommitCommentEvent: 'Comment',
    GollumEvent: 'Wiki',
    MemberEvent: 'Member',
    PublicEvent: 'Public',
  };
  return map[type] || type.replace('Event', '');
}

/** Return badge colour class for event type badge */
export function eventTypeBadgeClass(type) {
  const label = formatGitHubEventType(type);
  if (label === 'Push') return 'bg-blue-900/60 text-blue-300 ring-1 ring-blue-600/40';
  if (label === 'PR' || label === 'Review') return 'bg-purple-900/60 text-purple-300 ring-1 ring-purple-600/40';
  if (label === 'Issue' || label === 'Comment') return 'bg-green-900/60 text-green-300 ring-1 ring-green-600/40';
  if (label === 'Create' || label === 'Fork' || label === 'Star') return 'bg-amber-900/60 text-amber-300 ring-1 ring-amber-600/40';
  return 'bg-zinc-800 text-zinc-400 ring-1 ring-zinc-600/40';
}

/**
 * Search snippets by query string (title, language, notes).
 * Case-insensitive partial match.
 * @param {Array} snippets
 * @param {string} query
 * @param {string} [language] - optional language filter
 * @returns {Array}
 */
export function searchSnippets(snippets, query, language) {
  if (!snippets) return [];
  let result = snippets;
  if (language) {
    result = result.filter((s) => s.language === language);
  }
  if (!query || !query.trim()) return result;
  const q = query.trim().toLowerCase();
  return result.filter(
    (s) =>
      (s.title || '').toLowerCase().includes(q) ||
      (s.language || '').toLowerCase().includes(q) ||
      (s.notes || '').toLowerCase().includes(q)
  );
}

/** Get a list of unique languages from snippet array */
export function getSnippetLanguages(snippets) {
  if (!snippets) return [];
  const langs = new Set(snippets.map((s) => s.language).filter(Boolean));
  return Array.from(langs).sort();
}

/** Create a new snippet object */
export function createSnippet({ title, language, code, notes }) {
  return {
    id: Date.now().toString() + Math.random().toString(36).slice(2),
    title: title || '',
    language: language || '',
    code: code || '',
    notes: notes || '',
    createdAt: new Date().toISOString(),
  };
}
