/**
 * Calendar utility functions for the month-view calendar.
 */

/**
 * Get the number of days in a month.
 * @param {number} year
 * @param {number} month - 0-indexed (0 = January)
 */
export function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Returns a flat array of calendar grid cells for a month.
 * Each cell: { day: number | null, dateStr: string | null }
 * Null cells are padding (days from prev/next month).
 * Week starts on Sunday.
 *
 * @param {number} year
 * @param {number} month - 0-indexed
 */
export function getCalendarGrid(year, month) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Sun

  const cells = [];

  // Leading empty cells
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push({ day: null, dateStr: null });
  }

  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ day: d, dateStr });
  }

  // Trailing empty cells to complete the last row
  const remainder = cells.length % 7;
  if (remainder !== 0) {
    for (let i = 0; i < 7 - remainder; i++) {
      cells.push({ day: null, dateStr: null });
    }
  }

  return cells;
}

/**
 * Navigate to next or previous month.
 * @param {number} year
 * @param {number} month - 0-indexed
 * @param {1 | -1} direction
 * @returns {{ year: number, month: number }}
 */
export function navigateMonth(year, month, direction) {
  let newMonth = month + direction;
  let newYear = year;
  if (newMonth > 11) {
    newMonth = 0;
    newYear += 1;
  } else if (newMonth < 0) {
    newMonth = 11;
    newYear -= 1;
  }
  return { year: newYear, month: newMonth };
}

/**
 * Format a month/year for display.
 * @param {number} year
 * @param {number} month - 0-indexed
 */
export function formatMonthYear(year, month) {
  return new Date(year, month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}
