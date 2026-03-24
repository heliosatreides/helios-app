import { describe, it, expect } from 'vitest';
import {
  getNextReviewDate,
  createCard,
  createDeck,
  getCardsDueToday,
  getMasteredCount,
  addCardToDeck,
} from './flashcardUtils';

// ── getNextReviewDate ─────────────────────────────────────────────────────

describe('getNextReviewDate', () => {
  const today = '2024-06-03';

  it('returns +7 days for Easy', () => {
    expect(getNextReviewDate('Easy', today)).toBe('2024-06-10');
  });

  it('returns +3 days for Good', () => {
    expect(getNextReviewDate('Good', today)).toBe('2024-06-06');
  });

  it('returns +1 day for Hard', () => {
    expect(getNextReviewDate('Hard', today)).toBe('2024-06-04');
  });

  it('returns same day for Again', () => {
    expect(getNextReviewDate('Again', today)).toBe('2024-06-03');
  });

  it('defaults to today for unknown rating', () => {
    expect(getNextReviewDate('Unknown', today)).toBe('2024-06-03');
  });

  it('uses real today when no date provided', () => {
    const result = getNextReviewDate('Easy');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // Easy should return a date 7 days from now
    // Compare using string math via explicit today calculation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expected = new Date(today);
    expected.setDate(expected.getDate() + 7);
    const expectedStr = expected.toISOString().slice(0, 10);
    expect(result).toBe(expectedStr);
  });
});

// ── createCard ────────────────────────────────────────────────────────────

describe('createCard', () => {
  it('creates a card with front and back', () => {
    const card = createCard({ front: 'What is 2+2?', back: '4' });
    expect(card.front).toBe('What is 2+2?');
    expect(card.back).toBe('4');
  });

  it('has a unique id', () => {
    const c1 = createCard({ front: 'Q1', back: 'A1' });
    const c2 = createCard({ front: 'Q2', back: 'A2' });
    expect(c1.id).not.toBe(c2.id);
  });

  it('defaults tags to empty array', () => {
    const card = createCard({ front: 'Q', back: 'A' });
    expect(card.tags).toEqual([]);
  });

  it('has nextReview set to today', () => {
    const card = createCard({ front: 'Q', back: 'A' });
    const today = new Date().toISOString().slice(0, 10);
    expect(card.nextReview).toBe(today);
  });

  it('has reviewCount of 0', () => {
    const card = createCard({ front: 'Q', back: 'A' });
    expect(card.reviewCount).toBe(0);
  });
});

// ── createDeck ────────────────────────────────────────────────────────────

describe('createDeck', () => {
  it('creates a deck with name', () => {
    const deck = createDeck({ name: 'Spanish Vocab' });
    expect(deck.name).toBe('Spanish Vocab');
  });

  it('has unique id', () => {
    const d1 = createDeck({ name: 'D1' });
    const d2 = createDeck({ name: 'D2' });
    expect(d1.id).not.toBe(d2.id);
  });

  it('defaults cards to empty array', () => {
    const deck = createDeck({ name: 'Test' });
    expect(deck.cards).toEqual([]);
  });

  it('uses provided color', () => {
    const deck = createDeck({ name: 'Test', color: '#ff0000' });
    expect(deck.color).toBe('#ff0000');
  });
});

// ── getCardsDueToday ──────────────────────────────────────────────────────

describe('getCardsDueToday', () => {
  const today = '2024-06-03';
  const cards = [
    { id: '1', nextReview: '2024-06-01' }, // overdue → due
    { id: '2', nextReview: '2024-06-03' }, // today → due
    { id: '3', nextReview: '2024-06-04' }, // future → not due
    { id: '4', nextReview: '2024-07-01' }, // far future → not due
  ];

  it('returns cards with nextReview <= today', () => {
    const due = getCardsDueToday(cards, today);
    expect(due).toHaveLength(2);
    expect(due.map((c) => c.id)).toContain('1');
    expect(due.map((c) => c.id)).toContain('2');
  });

  it('returns empty array for null input', () => {
    expect(getCardsDueToday(null, today)).toHaveLength(0);
  });

  it('returns empty array for empty cards', () => {
    expect(getCardsDueToday([], today)).toHaveLength(0);
  });
});

// ── getMasteredCount ──────────────────────────────────────────────────────

describe('getMasteredCount', () => {
  const today = '2024-06-03';

  it('counts cards with nextReview >= 7 days away as mastered', () => {
    const cards = [
      { nextReview: '2024-06-10' }, // 7 days → mastered
      { nextReview: '2024-06-12' }, // 9 days → mastered
      { nextReview: '2024-06-05' }, // 2 days → not mastered
      { nextReview: '2024-06-03' }, // today → not mastered
    ];
    expect(getMasteredCount(cards, today)).toBe(2);
  });

  it('returns 0 for null input', () => {
    expect(getMasteredCount(null, today)).toBe(0);
  });
});

// ── addCardToDeck ─────────────────────────────────────────────────────────

describe('addCardToDeck', () => {
  it('adds a card to the deck', () => {
    const deck = createDeck({ name: 'Test Deck' });
    const updated = addCardToDeck(deck, { front: 'Q', back: 'A' });
    expect(updated.cards).toHaveLength(1);
    expect(updated.cards[0].front).toBe('Q');
  });

  it('does not mutate the original deck', () => {
    const deck = createDeck({ name: 'Test Deck' });
    addCardToDeck(deck, { front: 'Q', back: 'A' });
    expect(deck.cards).toHaveLength(0);
  });

  it('appends to existing cards', () => {
    let deck = createDeck({ name: 'Deck' });
    deck = addCardToDeck(deck, { front: 'Q1', back: 'A1' });
    deck = addCardToDeck(deck, { front: 'Q2', back: 'A2' });
    expect(deck.cards).toHaveLength(2);
  });
});
