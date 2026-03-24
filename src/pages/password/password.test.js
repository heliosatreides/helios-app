import { describe, it, expect } from 'vitest';
import { generatePassword, scorePasswordStrength } from './passwordUtils';

// ── generatePassword ──────────────────────────────────────────────────────

describe('generatePassword', () => {
  it('generates a password with the requested length', () => {
    const pw = generatePassword({ length: 16, uppercase: true, lowercase: true });
    expect(pw.length).toBe(16);
  });

  it('clamps length to minimum 8', () => {
    const pw = generatePassword({ length: 3, lowercase: true });
    expect(pw.length).toBe(8);
  });

  it('clamps length to maximum 64', () => {
    const pw = generatePassword({ length: 100, lowercase: true });
    expect(pw.length).toBe(64);
  });

  it('includes uppercase chars when uppercase is true', () => {
    // Generate a long password to reduce flakiness
    const pw = generatePassword({ length: 64, uppercase: true, lowercase: false, numbers: false });
    expect(/[A-Z]/.test(pw)).toBe(true);
  });

  it('includes lowercase chars when lowercase is true', () => {
    const pw = generatePassword({ length: 64, uppercase: false, lowercase: true, numbers: false });
    expect(/[a-z]/.test(pw)).toBe(true);
  });

  it('includes numbers when numbers is true', () => {
    const pw = generatePassword({ length: 64, uppercase: false, lowercase: false, numbers: true });
    expect(/[0-9]/.test(pw)).toBe(true);
  });

  it('includes symbols when symbols is true', () => {
    const pw = generatePassword({ length: 64, uppercase: false, lowercase: false, numbers: false, symbols: true });
    expect(/[^A-Za-z0-9]/.test(pw)).toBe(true);
  });

  it('excludes ambiguous chars (0/O, 1/l/I) when excludeAmbiguous is true', () => {
    const pw = generatePassword({ length: 64, uppercase: true, lowercase: true, numbers: true, excludeAmbiguous: true });
    expect(pw).not.toMatch(/[0OIl1]/);
  });

  it('returns empty string when no character set selected', () => {
    const pw = generatePassword({ length: 16, uppercase: false, lowercase: false, numbers: false, symbols: false });
    expect(pw).toBe('');
  });

  it('generates different passwords on successive calls', () => {
    const pw1 = generatePassword({ length: 20, uppercase: true, lowercase: true, numbers: true });
    const pw2 = generatePassword({ length: 20, uppercase: true, lowercase: true, numbers: true });
    // Extremely unlikely to be equal
    expect(pw1).not.toBe(pw2);
  });
});

// ── scorePasswordStrength ─────────────────────────────────────────────────

describe('scorePasswordStrength', () => {
  it('returns "weak" for short password', () => {
    expect(scorePasswordStrength('abc')).toBe('weak');
  });

  it('returns "weak" for null/empty', () => {
    expect(scorePasswordStrength(null)).toBe('weak');
    expect(scorePasswordStrength('')).toBe('weak');
  });

  it('returns "fair" for moderate password', () => {
    // mix of upper+lower+numbers, short-ish
    expect(scorePasswordStrength('abcDEF123')).toBe('fair');
  });

  it('returns "strong" for good password', () => {
    expect(scorePasswordStrength('MyP@ssw0rd1234')).toBe('strong');
  });

  it('returns "very strong" for excellent password', () => {
    expect(scorePasswordStrength('X!9mQ2#kLpZ@vR$7nW3')).toBe('very strong');
  });

  it('upgrades strength with more character variety', () => {
    const simple = scorePasswordStrength('abcdefgh');
    const complex = scorePasswordStrength('aBcDeFgH1!');
    const scores = ['weak', 'fair', 'strong', 'very strong'];
    expect(scores.indexOf(complex)).toBeGreaterThanOrEqual(scores.indexOf(simple));
  });
});
