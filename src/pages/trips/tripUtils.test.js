import { generateDays, getDuration, formatDayHeader } from './tripUtils';

describe('generateDays', () => {
  test('returns empty array when no dates', () => {
    expect(generateDays('', '')).toEqual([]);
    expect(generateDays(null, null)).toEqual([]);
  });

  test('returns empty array when end before start', () => {
    expect(generateDays('2026-06-10', '2026-06-05')).toEqual([]);
  });

  test('returns single day when start equals end', () => {
    const days = generateDays('2026-06-02', '2026-06-02');
    expect(days).toHaveLength(1);
    expect(days[0].date).toBe('2026-06-02');
    expect(days[0].dayNum).toBe(1);
  });

  test('returns correct number of days for a range', () => {
    const days = generateDays('2026-06-01', '2026-06-05');
    expect(days).toHaveLength(5);
  });

  test('day labels include day number and formatted date', () => {
    const days = generateDays('2026-06-01', '2026-06-03');
    expect(days[0].label).toMatch(/Day 1/);
    expect(days[1].label).toMatch(/Day 2/);
    expect(days[2].label).toMatch(/Day 3/);
  });

  test('each day has correct date string', () => {
    const days = generateDays('2026-06-01', '2026-06-03');
    expect(days[0].date).toBe('2026-06-01');
    expect(days[1].date).toBe('2026-06-02');
    expect(days[2].date).toBe('2026-06-03');
  });

  test('day numbers start at 1 and increment', () => {
    const days = generateDays('2026-06-01', '2026-06-04');
    expect(days.map((d) => d.dayNum)).toEqual([1, 2, 3, 4]);
  });
});

describe('getDuration', () => {
  test('returns 0 when no dates', () => {
    expect(getDuration('', '')).toBe(0);
    expect(getDuration(null, null)).toBe(0);
  });

  test('returns 0 when end before start', () => {
    expect(getDuration('2026-06-10', '2026-06-05')).toBe(0);
  });

  test('returns 1 for same day', () => {
    expect(getDuration('2026-06-02', '2026-06-02')).toBe(1);
  });

  test('returns 5 for 5-day trip', () => {
    expect(getDuration('2026-06-01', '2026-06-05')).toBe(5);
  });

  test('returns 14 for two-week trip', () => {
    expect(getDuration('2026-04-01', '2026-04-14')).toBe(14);
  });
});

describe('formatDayHeader', () => {
  test('includes day number', () => {
    const date = new Date('2026-06-01T00:00:00');
    const label = formatDayHeader(date, 1);
    expect(label).toMatch(/Day 1/);
  });

  test('includes abbreviated weekday', () => {
    // 2026-06-01 is a Monday
    const date = new Date('2026-06-01T00:00:00');
    const label = formatDayHeader(date, 1);
    expect(label).toMatch(/Mon/);
  });
});
