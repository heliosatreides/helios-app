/**
 * Extract regex matches from a test string.
 * @param {string} pattern - regex pattern
 * @param {string} flags - regex flags (e.g., 'gi')
 * @param {string} text - test string
 * @returns {{ matches: Array, error: string|null }}
 */
export function extractMatches(pattern, flags, text) {
  if (!pattern) return { matches: [], error: null };
  try {
    const regex = new RegExp(pattern, flags);
    const matches = [];
    let m;
    if (flags.includes('g')) {
      while ((m = regex.exec(text)) !== null) {
        matches.push({
          match: m[0],
          index: m.index,
          groups: m.slice(1),
          namedGroups: m.groups || {},
        });
        // Prevent infinite loop on zero-length matches
        if (m[0].length === 0) regex.lastIndex++;
      }
    } else {
      m = regex.exec(text);
      if (m) {
        matches.push({
          match: m[0],
          index: m.index,
          groups: m.slice(1),
          namedGroups: m.groups || {},
        });
      }
    }
    return { matches, error: null };
  } catch (err) {
    return { matches: [], error: err.message };
  }
}

/**
 * Highlight matches in text by returning segments.
 * @returns {Array<{ text: string, highlight: boolean }>}
 */
export function getHighlightSegments(pattern, flags, text) {
  const { matches, error } = extractMatches(pattern, flags, text);
  if (error || matches.length === 0) return [{ text, highlight: false }];

  const segments = [];
  let lastIndex = 0;
  for (const m of matches) {
    if (m.index > lastIndex) segments.push({ text: text.slice(lastIndex, m.index), highlight: false });
    segments.push({ text: m.match, highlight: true });
    lastIndex = m.index + m.match.length;
  }
  if (lastIndex < text.length) segments.push({ text: text.slice(lastIndex), highlight: false });
  return segments;
}

export const COMMON_PATTERNS = [
  { name: 'Email', pattern: '[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}', flags: 'g' },
  { name: 'URL', pattern: 'https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&\\/=]*)', flags: 'g' },
  { name: 'Phone (US)', pattern: '\\(?\\d{3}\\)?[\\s.\\-]?\\d{3}[\\s.\\-]?\\d{4}', flags: 'g' },
  { name: 'Date (YYYY-MM-DD)', pattern: '\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])', flags: 'g' },
  { name: 'IP Address', pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b', flags: 'g' },
  { name: 'Hex Color', pattern: '#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\\b', flags: 'g' },
  { name: 'Credit Card', pattern: '\\b\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}\\b', flags: 'g' },
];
