// ── Password generator utility functions ──────────────────────────────────

const CHARS = {
  uppercase: 'ABCDEFGHJKLMNPQRSTUVWXYZ', // excludes I, O (ambiguous)
  uppercase_full: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghjkmnpqrstuvwxyz', // excludes i, l, o (ambiguous)
  lowercase_full: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '23456789', // excludes 0, 1 (ambiguous)
  numbers_full: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

/**
 * Generate a random password.
 * @param {object} opts
 * @param {number} opts.length - password length (8-64)
 * @param {boolean} opts.uppercase
 * @param {boolean} opts.lowercase
 * @param {boolean} opts.numbers
 * @param {boolean} opts.symbols
 * @param {boolean} opts.excludeAmbiguous
 */
export function generatePassword(opts) {
  const { length = 16, uppercase = true, lowercase = true, numbers = true, symbols = false, excludeAmbiguous = false } = opts || {};

  let charset = '';
  if (uppercase) charset += excludeAmbiguous ? CHARS.uppercase : CHARS.uppercase_full;
  if (lowercase) charset += excludeAmbiguous ? CHARS.lowercase : CHARS.lowercase_full;
  if (numbers) charset += excludeAmbiguous ? CHARS.numbers : CHARS.numbers_full;
  if (symbols) charset += CHARS.symbols;

  if (!charset) return '';

  const len = Math.max(8, Math.min(64, length));
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => charset[n % charset.length]).join('');
}

/**
 * Score password strength.
 * Returns: 'weak' | 'fair' | 'strong' | 'very strong'
 */
export function scorePasswordStrength(password) {
  if (!password || password.length < 8) return 'weak';

  let score = 0;
  // Length bonus
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (password.length >= 24) score++;

  // Character variety
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return 'weak';
  if (score <= 4) return 'fair';
  if (score <= 5) return 'strong';
  return 'very strong';
}

export const STRENGTH_COLORS = {
  weak: 'text-red-400',
  fair: 'text-orange-400',
  strong: 'text-yellow-400',
  'very strong': 'text-green-400',
};

export const STRENGTH_BAR_COLORS = {
  weak: 'bg-red-500',
  fair: 'bg-orange-500',
  strong: 'bg-yellow-500',
  'very strong': 'bg-green-500',
};

export const STRENGTH_BAR_WIDTH = {
  weak: '25%',
  fair: '50%',
  strong: '75%',
  'very strong': '100%',
};
