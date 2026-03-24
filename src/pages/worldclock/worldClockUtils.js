// ── World Clock utility functions ─────────────────────────────────────────

export const DEFAULT_CITIES = [
  { id: 'new-york', name: 'New York', timezone: 'America/New_York' },
  { id: 'london', name: 'London', timezone: 'Europe/London' },
  { id: 'tokyo', name: 'Tokyo', timezone: 'Asia/Tokyo' },
  { id: 'mumbai', name: 'Mumbai', timezone: 'Asia/Kolkata' },
  { id: 'san-francisco', name: 'San Francisco', timezone: 'America/Los_Angeles' },
];

export const ALL_CITIES = [
  { id: 'new-york', name: 'New York', timezone: 'America/New_York' },
  { id: 'london', name: 'London', timezone: 'Europe/London' },
  { id: 'tokyo', name: 'Tokyo', timezone: 'Asia/Tokyo' },
  { id: 'mumbai', name: 'Mumbai', timezone: 'Asia/Kolkata' },
  { id: 'san-francisco', name: 'San Francisco', timezone: 'America/Los_Angeles' },
  { id: 'paris', name: 'Paris', timezone: 'Europe/Paris' },
  { id: 'berlin', name: 'Berlin', timezone: 'Europe/Berlin' },
  { id: 'sydney', name: 'Sydney', timezone: 'Australia/Sydney' },
  { id: 'singapore', name: 'Singapore', timezone: 'Asia/Singapore' },
  { id: 'dubai', name: 'Dubai', timezone: 'Asia/Dubai' },
  { id: 'toronto', name: 'Toronto', timezone: 'America/Toronto' },
  { id: 'chicago', name: 'Chicago', timezone: 'America/Chicago' },
  { id: 'los-angeles', name: 'Los Angeles', timezone: 'America/Los_Angeles' },
  { id: 'shanghai', name: 'Shanghai', timezone: 'Asia/Shanghai' },
  { id: 'seoul', name: 'Seoul', timezone: 'Asia/Seoul' },
  { id: 'hong-kong', name: 'Hong Kong', timezone: 'Asia/Hong_Kong' },
  { id: 'moscow', name: 'Moscow', timezone: 'Europe/Moscow' },
  { id: 'istanbul', name: 'Istanbul', timezone: 'Europe/Istanbul' },
  { id: 'cairo', name: 'Cairo', timezone: 'Africa/Cairo' },
  { id: 'sao-paulo', name: 'São Paulo', timezone: 'America/Sao_Paulo' },
  { id: 'mexico-city', name: 'Mexico City', timezone: 'America/Mexico_City' },
  { id: 'amsterdam', name: 'Amsterdam', timezone: 'Europe/Amsterdam' },
  { id: 'zurich', name: 'Zurich', timezone: 'Europe/Zurich' },
  { id: 'bangkok', name: 'Bangkok', timezone: 'Asia/Bangkok' },
  { id: 'jakarta', name: 'Jakarta', timezone: 'Asia/Jakarta' },
];

/**
 * Get the UTC offset string for a timezone at the given date (e.g. "UTC+5:30").
 */
export function getUtcOffset(timezone, date = new Date()) {
  try {
    // Use Intl to get the offset
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      timeZoneName: 'shortOffset',
    });
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    return tzPart ? tzPart.value : '';
  } catch {
    return '';
  }
}

/**
 * Check whether the given timezone is currently in business hours (9am-5pm local).
 */
export function isBusinessHours(timezone, date = new Date()) {
  try {
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const hourPart = parts.find((p) => p.type === 'hour');
    if (!hourPart) return false;
    const hour = parseInt(hourPart.value, 10);
    return hour >= 9 && hour < 17;
  } catch {
    return false;
  }
}

/**
 * Format a date in the given timezone as a time string (HH:MM:SS).
 */
export function formatTimeInZone(timezone, date = new Date()) {
  try {
    return new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    return '--:--:--';
  }
}

/**
 * Format a date in the given timezone as a date string.
 */
export function formatDateInZone(timezone, date = new Date()) {
  try {
    return new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return '';
  }
}

/**
 * Convert a local datetime string (YYYY-MM-DDTHH:MM) in fromTimezone 
 * and return what time it is in toTimezone.
 */
export function convertTimeBetweenZones(localDatetime, fromTimezone, toTimezone) {
  try {
    // Parse the local datetime as if it's in fromTimezone
    const date = new Date(localDatetime);
    if (isNaN(date.getTime())) return null;
    return formatTimeInZone(toTimezone, date);
  } catch {
    return null;
  }
}
