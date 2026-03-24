// ── Currency & Unit Converter utility functions ───────────────────────────

/**
 * Convert amount from one currency to another using a rates map (base = USD).
 * rates: { EUR: 0.92, GBP: 0.79, ... } (all relative to USD)
 */
export function convertCurrency(amount, from, to, rates) {
  if (!rates || typeof amount !== 'number' || isNaN(amount)) return null;
  // Convert to USD first, then to target
  const fromRate = from === 'USD' ? 1 : rates[from];
  const toRate = to === 'USD' ? 1 : rates[to];
  if (!fromRate || !toRate) return null;
  const usd = amount / fromRate;
  return usd * toRate;
}

// ── Unit conversion ───────────────────────────────────────────────────────

// All length in meters
const LENGTH_TO_METERS = {
  m: 1,
  km: 1000,
  mi: 1609.344,
  ft: 0.3048,
  in: 0.0254,
  cm: 0.01,
};

export function convertLength(value, from, to) {
  const v = Number(value);
  if (isNaN(v)) return null;
  const inMeters = v * (LENGTH_TO_METERS[from] ?? 1);
  return inMeters / (LENGTH_TO_METERS[to] ?? 1);
}

// All weight in grams
const WEIGHT_TO_GRAMS = {
  g: 1,
  kg: 1000,
  lb: 453.592,
  oz: 28.3495,
  ton: 1_000_000,
};

export function convertWeight(value, from, to) {
  const v = Number(value);
  if (isNaN(v)) return null;
  const inGrams = v * (WEIGHT_TO_GRAMS[from] ?? 1);
  return inGrams / (WEIGHT_TO_GRAMS[to] ?? 1);
}

export function convertTemperature(value, from, to) {
  const v = Number(value);
  if (isNaN(v)) return null;
  if (from === to) return v;
  // Convert to Celsius first
  let celsius;
  if (from === 'C') celsius = v;
  else if (from === 'F') celsius = (v - 32) * (5 / 9);
  else if (from === 'K') celsius = v - 273.15;
  else return null;
  // Convert from Celsius to target
  if (to === 'C') return celsius;
  if (to === 'F') return celsius * (9 / 5) + 32;
  if (to === 'K') return celsius + 273.15;
  return null;
}

// All data in bytes
const DATA_TO_BYTES = {
  B: 1,
  KB: 1024,
  MB: 1024 ** 2,
  GB: 1024 ** 3,
  TB: 1024 ** 4,
};

export function convertData(value, from, to) {
  const v = Number(value);
  if (isNaN(v)) return null;
  const inBytes = v * (DATA_TO_BYTES[from] ?? 1);
  return inBytes / (DATA_TO_BYTES[to] ?? 1);
}

// All time in seconds
const TIME_TO_SECONDS = {
  seconds: 1,
  minutes: 60,
  hours: 3600,
  days: 86400,
  weeks: 604800,
};

export function convertTime(value, from, to) {
  const v = Number(value);
  if (isNaN(v)) return null;
  const inSeconds = v * (TIME_TO_SECONDS[from] ?? 1);
  return inSeconds / (TIME_TO_SECONDS[to] ?? 1);
}

export const UNIT_CATEGORIES = {
  Length: {
    units: ['m', 'km', 'mi', 'ft', 'in', 'cm'],
    convert: convertLength,
  },
  Weight: {
    units: ['kg', 'lb', 'oz', 'g', 'ton'],
    convert: convertWeight,
  },
  Temperature: {
    units: ['C', 'F', 'K'],
    convert: convertTemperature,
    labels: { C: '°C', F: '°F', K: 'K' },
  },
  Data: {
    units: ['B', 'KB', 'MB', 'GB', 'TB'],
    convert: convertData,
  },
  Time: {
    units: ['seconds', 'minutes', 'hours', 'days', 'weeks'],
    convert: convertTime,
  },
};

export const POPULAR_PAIRS = [
  { from: 'USD', to: 'EUR' },
  { from: 'USD', to: 'GBP' },
  { from: 'USD', to: 'JPY' },
  { from: 'USD', to: 'CAD' },
];

export const CACHE_KEY = 'helios-exchange-rates';
export const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export function getCachedRates() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { rates, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL_MS) return null;
    return rates;
  } catch {
    return null;
  }
}

export function setCachedRates(rates) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ rates, timestamp: Date.now() }));
  } catch {}
}
