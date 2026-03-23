/**
 * Trip utility helpers shared across trip components and tests.
 */

/**
 * Generate an array of day objects between startDate and endDate (inclusive).
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate   - YYYY-MM-DD
 * @returns {{ date: string, dayNum: number, label: string }[]}
 */
export function generateDays(startDate, endDate) {
  if (!startDate || !endDate) return [];
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  if (isNaN(start) || isNaN(end) || end < start) return [];

  const days = [];
  const current = new Date(start);
  let dayNum = 1;
  while (current <= end) {
    const dateStr = current.toISOString().slice(0, 10);
    days.push({
      date: dateStr,
      dayNum,
      label: formatDayHeader(current, dayNum),
    });
    current.setDate(current.getDate() + 1);
    dayNum++;
  }
  return days;
}

/**
 * Format a date as "Day N — Mon, Jun 2"
 * @param {Date} date
 * @param {number} dayNum
 */
export function formatDayHeader(date, dayNum) {
  const formatted = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  return `Day ${dayNum} — ${formatted}`;
}

/**
 * Return trip duration in whole days (inclusive of start and end).
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate   - YYYY-MM-DD
 * @returns {number}
 */
export function getDuration(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  if (isNaN(start) || isNaN(end) || end < start) return 0;
  return Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
}
