import { extractMatches, getHighlightSegments } from './regexUtils';

describe('extractMatches', () => {
  test('returns empty for empty pattern', () => {
    const { matches, error } = extractMatches('', 'g', 'hello world');
    expect(matches).toHaveLength(0);
    expect(error).toBeNull();
  });

  test('finds global matches', () => {
    const { matches } = extractMatches('\\d+', 'g', 'I have 42 apples and 7 oranges');
    expect(matches).toHaveLength(2);
    expect(matches[0].match).toBe('42');
    expect(matches[1].match).toBe('7');
  });

  test('finds single match without g flag', () => {
    const { matches } = extractMatches('\\d+', '', 'I have 42 apples and 7 oranges');
    expect(matches).toHaveLength(1);
    expect(matches[0].match).toBe('42');
  });

  test('captures groups', () => {
    const { matches } = extractMatches('(\\w+)@(\\w+)', 'g', 'test@example');
    expect(matches).toHaveLength(1);
    expect(matches[0].groups[0]).toBe('test');
    expect(matches[0].groups[1]).toBe('example');
  });

  test('case insensitive flag', () => {
    const { matches } = extractMatches('hello', 'gi', 'Hello HELLO hello');
    expect(matches).toHaveLength(3);
  });

  test('returns error for invalid regex', () => {
    const { matches, error } = extractMatches('[invalid', 'g', 'test');
    expect(matches).toHaveLength(0);
    expect(error).toBeTruthy();
  });

  test('returns correct match index', () => {
    const { matches } = extractMatches('world', 'g', 'hello world');
    expect(matches[0].index).toBe(6);
  });

  test('email pattern works', () => {
    const pattern = '[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}';
    const { matches } = extractMatches(pattern, 'g', 'Send to test@example.com and admin@site.org');
    expect(matches).toHaveLength(2);
    expect(matches[0].match).toBe('test@example.com');
    expect(matches[1].match).toBe('admin@site.org');
  });
});

describe('getHighlightSegments', () => {
  test('returns single non-highlighted segment when no match', () => {
    const segs = getHighlightSegments('xyz', 'g', 'hello world');
    expect(segs).toHaveLength(1);
    expect(segs[0].highlight).toBe(false);
    expect(segs[0].text).toBe('hello world');
  });

  test('highlights matched portions', () => {
    const segs = getHighlightSegments('world', 'g', 'hello world foo');
    const highlighted = segs.filter(s => s.highlight);
    expect(highlighted).toHaveLength(1);
    expect(highlighted[0].text).toBe('world');
  });

  test('returns non-highlighted segments around match', () => {
    const segs = getHighlightSegments('\\d+', 'g', 'abc 123 def');
    expect(segs.some(s => !s.highlight && s.text === 'abc ')).toBe(true);
    expect(segs.some(s => s.highlight && s.text === '123')).toBe(true);
    expect(segs.some(s => !s.highlight && s.text === ' def')).toBe(true);
  });

  test('handles multiple matches', () => {
    const segs = getHighlightSegments('\\d', 'g', '1a2b3');
    const highlighted = segs.filter(s => s.highlight);
    expect(highlighted).toHaveLength(3);
  });
});
