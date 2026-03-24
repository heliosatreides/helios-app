// ── Flashcard / Spaced Repetition utility functions ───────────────────────

/**
 * Calculate the next review date based on difficulty rating.
 * @param {'Easy'|'Good'|'Hard'|'Again'} rating
 * @param {string} [today] - YYYY-MM-DD (defaults to today)
 * @returns {string} YYYY-MM-DD
 */
export function getNextReviewDate(rating, today) {
  const base = today ? new Date(today + 'T00:00:00') : new Date();
  base.setHours(0, 0, 0, 0);

  let daysToAdd;
  switch (rating) {
    case 'Easy':
      daysToAdd = 7;
      break;
    case 'Good':
      daysToAdd = 3;
      break;
    case 'Hard':
      daysToAdd = 1;
      break;
    case 'Again':
    default:
      daysToAdd = 0; // review again today
      break;
  }

  const next = new Date(base);
  next.setDate(next.getDate() + daysToAdd);
  return next.toISOString().slice(0, 10);
}

/**
 * Create a new card object.
 */
export function createCard({ front, back, tags = [] }) {
  return {
    id: crypto.randomUUID(),
    front: front || '',
    back: back || '',
    tags,
    createdAt: new Date().toISOString(),
    nextReview: new Date().toISOString().slice(0, 10),
    reviewCount: 0,
    easeFactor: 2.5,
  };
}

/**
 * Create a new deck object.
 */
export function createDeck({ name, description = '', color = '#f59e0b' }) {
  return {
    id: crypto.randomUUID(),
    name: name || 'New Deck',
    description,
    color,
    createdAt: new Date().toISOString(),
    cards: [],
  };
}

/**
 * Get cards due for review today.
 * @param {Array} cards
 * @param {string} [today] - YYYY-MM-DD
 */
export function getCardsDueToday(cards, today) {
  const todayStr = today || new Date().toISOString().slice(0, 10);
  if (!Array.isArray(cards)) return [];
  return cards.filter((card) => card.nextReview <= todayStr);
}

/**
 * Count mastered cards (those with reviewCount >= 3 and Easy rating pattern).
 * Simple heuristic: nextReview is > 6 days from now = mastered.
 */
export function getMasteredCount(cards, today) {
  const todayStr = today || new Date().toISOString().slice(0, 10);
  if (!Array.isArray(cards)) return 0;
  return cards.filter((card) => {
    if (!card.nextReview) return false;
    const diff = Math.floor((new Date(card.nextReview) - new Date(todayStr)) / 86400000);
    return diff >= 7;
  }).length;
}

/**
 * Add a card to a deck (returns new deck with card appended).
 */
export function addCardToDeck(deck, cardData) {
  const card = createCard(cardData);
  return { ...deck, cards: [...(deck.cards || []), card] };
}
