import { useState } from 'react';
import { useIDB } from '../../hooks/useIDB';
import { useGemini } from '../../hooks/useGemini';
import {
  createDeck,
  createCard,
  addCardToDeck,
  getNextReviewDate,
  getCardsDueToday,
  getMasteredCount,
} from './flashcardUtils';

const DECK_COLORS = [
  '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#06b6d4',
];

// ── Deck list ─────────────────────────────────────────────────────────────

function DeckList({ decks, onSelect, onDelete, onCreate }) {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', color: DECK_COLORS[0] });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onCreate(form);
    setForm({ name: '', description: '', color: DECK_COLORS[0] });
    setShowCreate(false);
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[#e4e4e7] font-semibold">Your Decks</h2>
        <button
          type="button"
          onClick={() => setShowCreate((s) => !s)}
          className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-3 py-1.5 rounded-lg text-sm"
        >
          + New deck
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-[#0a0a0b] border border-[#1c1c20] rounded-xl p-4 space-y-3">
          <div>
            <label className="text-[#71717a] text-xs block mb-1">Deck name *</label>
            <input
              autoFocus
              className="bg-[#0c0c0e] border border-[#1c1c20] rounded-lg px-3 py-2 text-[#e4e4e7] text-sm focus:outline-none focus:border-[#f59e0b] w-full"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Spanish Vocabulary"
              required
            />
          </div>
          <div>
            <label className="text-[#71717a] text-xs block mb-1">Description</label>
            <input
              className="bg-[#0c0c0e] border border-[#1c1c20] rounded-lg px-3 py-2 text-[#e4e4e7] text-sm focus:outline-none focus:border-[#f59e0b] w-full"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Optional description"
            />
          </div>
          <div>
            <label className="text-[#71717a] text-xs block mb-1">Color</label>
            <div className="flex gap-2">
              {DECK_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, color }))}
                  className={`w-6 h-6 rounded-full transition-transform ${form.color === color ? 'scale-125 ring-2 ring-white/30' : ''}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-1.5 rounded-lg text-sm">Create</button>
            <button type="button" onClick={() => setShowCreate(false)} className="border border-[#1c1c20] text-[#71717a] hover:text-[#e4e4e7] px-3 py-1.5 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      )}

      {decks.length === 0 && !showCreate && (
        <div className="text-center py-10">
          <p className="text-[#52525b] text-sm">No decks yet.</p>
          <p className="text-[#3f3f46] text-xs mt-1">Create a deck to start studying.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {decks.map((deck) => {
          const due = getCardsDueToday(deck.cards, today).length;
          const mastered = getMasteredCount(deck.cards, today);
          return (
            <div
              key={deck.id}
              className="bg-[#0c0c0e] border border-[#1c1c20] rounded-xl p-4 cursor-pointer hover:border-amber-500/40 transition-colors group"
              onClick={() => onSelect(deck.id)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: deck.color }} />
                  <h3 className="text-[#e4e4e7] font-medium text-sm group-hover:text-amber-400 transition-colors">{deck.name}</h3>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDelete(deck.id); }}
                  className="text-[#3f3f46] hover:text-red-400 text-xs transition-colors"
                >
                  ×
                </button>
              </div>
              {deck.description && <p className="text-[#52525b] text-xs mb-3 truncate">{deck.description}</p>}
              <div className="flex gap-4 text-xs">
                <span className="text-[#71717a]">{deck.cards?.length || 0} cards</span>
                {due > 0 && <span className="text-amber-400">{due} due</span>}
                {mastered > 0 && <span className="text-green-400">{mastered} mastered</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Card manager ──────────────────────────────────────────────────────────

function CardManager({ deck, onUpdate, onBack }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ front: '', back: '', tags: '' });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiText, setAiText] = useState('');
  const [aiError, setAiError] = useState(null);
  const [studying, setStudying] = useState(false);
  const { generate, hasKey } = useGemini();

  const today = new Date().toISOString().slice(0, 10);
  const due = getCardsDueToday(deck.cards || [], today);

  const handleAddCard = (e) => {
    e.preventDefault();
    if (!form.front.trim() || !form.back.trim()) return;
    const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
    const updated = addCardToDeck(deck, { front: form.front, back: form.back, tags });
    onUpdate(updated);
    setForm({ front: '', back: '', tags: '' });
    setShowAdd(false);
  };

  const deleteCard = (cardId) => {
    const updated = { ...deck, cards: deck.cards.filter((c) => c.id !== cardId) };
    onUpdate(updated);
  };

  const handleGenerateAI = async () => {
    if (!aiText.trim()) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const raw = await generate(
        `Based on this content, generate exactly 5 flashcard question-answer pairs:\n\n${aiText}\n\nReturn ONLY a JSON array like: [{"front":"Q1","back":"A1"},{"front":"Q2","back":"A2"},...]`
      );
      const match = raw.match(/\[[\s\S]*\]/);
      if (!match) throw new Error('Could not parse response');
      const cards = JSON.parse(match[0]);
      let updatedDeck = deck;
      cards.slice(0, 5).forEach((c) => {
        updatedDeck = addCardToDeck(updatedDeck, { front: c.front, back: c.back });
      });
      onUpdate(updatedDeck);
      setAiText('');
    } catch (err) {
      setAiError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  if (studying && due.length > 0) {
    return <StudyMode deck={deck} dueCards={due} onUpdate={onUpdate} onExit={() => setStudying(false)} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} className="text-[#52525b] hover:text-[#e4e4e7] text-sm transition-colors">← Back</button>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: deck.color }} />
          <h2 className="text-[#e4e4e7] font-semibold">{deck.name}</h2>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm">
        <span className="text-[#71717a]">{deck.cards?.length || 0} total</span>
        {due.length > 0 && <span className="text-amber-400">{due.length} due today</span>}
        <span className="text-green-400">{getMasteredCount(deck.cards, today)} mastered</span>
      </div>

      {/* Study button */}
      {due.length > 0 && (
        <button
          type="button"
          onClick={() => setStudying(true)}
          className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold py-3 rounded-xl text-sm transition-colors"
        >
          🎓 Study {due.length} due card{due.length !== 1 ? 's' : ''}
        </button>
      )}
      {due.length === 0 && (deck.cards?.length || 0) > 0 && (
        <div className="bg-green-950/20 border border-green-500/30 rounded-xl p-3 text-center">
          <p className="text-green-400 text-sm">✅ All caught up! No cards due today.</p>
        </div>
      )}

      {/* Add card */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setShowAdd((s) => !s)}
          className="bg-[#27272a] hover:bg-[#3f3f46] text-[#e4e4e7] px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
        >
          + Add card
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAddCard} className="bg-[#0a0a0b] border border-[#1c1c20] rounded-xl p-4 space-y-3">
          <div>
            <label className="text-[#71717a] text-xs block mb-1">Front (question) *</label>
            <textarea
              className="bg-[#0c0c0e] border border-[#1c1c20] rounded-lg px-3 py-2 text-[#e4e4e7] text-sm focus:outline-none focus:border-[#f59e0b] w-full resize-none"
              rows={2}
              value={form.front}
              onChange={(e) => setForm((f) => ({ ...f, front: e.target.value }))}
              placeholder="Question or prompt"
              required
            />
          </div>
          <div>
            <label className="text-[#71717a] text-xs block mb-1">Back (answer) *</label>
            <textarea
              className="bg-[#0c0c0e] border border-[#1c1c20] rounded-lg px-3 py-2 text-[#e4e4e7] text-sm focus:outline-none focus:border-[#f59e0b] w-full resize-none"
              rows={2}
              value={form.back}
              onChange={(e) => setForm((f) => ({ ...f, back: e.target.value }))}
              placeholder="Answer or explanation"
              required
            />
          </div>
          <div>
            <label className="text-[#71717a] text-xs block mb-1">Tags (comma-separated)</label>
            <input
              className="bg-[#0c0c0e] border border-[#1c1c20] rounded-lg px-3 py-2 text-[#e4e4e7] text-sm focus:outline-none focus:border-[#f59e0b] w-full"
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              placeholder="e.g. vocab, verbs"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-1.5 rounded-lg text-sm">Add</button>
            <button type="button" onClick={() => setShowAdd(false)} className="border border-[#1c1c20] text-[#71717a] hover:text-[#e4e4e7] px-3 py-1.5 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      )}

      {/* AI generate */}
      {hasKey && (
        <div className="bg-[#0a0a0b] border border-[#1c1c20] rounded-xl p-4 space-y-3">
          <p className="text-amber-400 text-xs font-semibold">✨ Generate flashcards with AI</p>
          <textarea
            className="bg-[#0c0c0e] border border-[#1c1c20] rounded-lg px-3 py-2 text-[#e4e4e7] text-sm focus:outline-none focus:border-[#f59e0b] w-full resize-none"
            rows={3}
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
            placeholder="Paste any text or concept here…"
          />
          {aiError && <p className="text-red-400 text-xs">❌ {aiError}</p>}
          <button
            type="button"
            onClick={handleGenerateAI}
            disabled={aiLoading || !aiText.trim()}
            className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {aiLoading ? '⏳ Generating…' : '✨ Generate 5 flashcards'}
          </button>
        </div>
      )}

      {/* Card list */}
      {(deck.cards || []).length === 0 && (
        <p className="text-[#52525b] text-sm text-center py-6">No cards yet. Add some to get started!</p>
      )}
      <div className="space-y-2">
        {(deck.cards || []).map((card) => (
          <div key={card.id} className="bg-[#0c0c0e] border border-[#1c1c20] rounded-xl p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[#e4e4e7] text-sm font-medium truncate">{card.front}</p>
                <p className="text-[#71717a] text-xs mt-0.5 truncate">{card.back}</p>
                {card.tags?.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {card.tags.map((tag) => (
                      <span key={tag} className="bg-[#27272a] text-[#71717a] text-xs px-1.5 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[#3f3f46] text-xs">Due: {card.nextReview}</span>
                <button
                  type="button"
                  onClick={() => deleteCard(card.id)}
                  className="text-[#3f3f46] hover:text-red-400 text-xs transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Study mode ────────────────────────────────────────────────────────────

function StudyMode({ deck, dueCards, onUpdate, onExit }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);

  const card = dueCards[idx];

  const handleRate = (rating) => {
    const today = new Date().toISOString().slice(0, 10);
    const nextReview = getNextReviewDate(rating, today);
    const updatedCards = (deck.cards || []).map((c) =>
      c.id === card.id
        ? { ...c, nextReview, reviewCount: (c.reviewCount || 0) + 1 }
        : c
    );
    onUpdate({ ...deck, cards: updatedCards });

    const next = idx + 1;
    if (next >= dueCards.length) {
      setDone(true);
    } else {
      setIdx(next);
      setFlipped(false);
    }
  };

  if (done) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-4xl">🎉</p>
        <p className="text-[#e4e4e7] text-lg font-semibold">Session complete!</p>
        <p className="text-[#71717a] text-sm">You reviewed {dueCards.length} card{dueCards.length !== 1 ? 's' : ''}.</p>
        <button
          type="button"
          onClick={onExit}
          className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-6 py-2 rounded-xl text-sm transition-colors"
        >
          Back to deck
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onExit} className="text-[#52525b] hover:text-[#e4e4e7] text-sm">← Exit study</button>
        <span className="text-[#52525b] text-xs">{idx + 1} / {dueCards.length}</span>
      </div>

      {/* Card */}
      <div
        className="bg-[#0c0c0e] border border-[#1c1c20] rounded-2xl p-8 min-h-[200px] flex flex-col items-center justify-center cursor-pointer hover:border-amber-500/30 transition-colors"
        onClick={() => setFlipped((f) => !f)}
      >
        {!flipped ? (
          <div className="text-center">
            <p className="text-[#52525b] text-xs mb-3">Question — click to reveal answer</p>
            <p className="text-[#e4e4e7] text-lg font-medium">{card.front}</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-[#52525b] text-xs mb-3">Answer</p>
            <p className="text-amber-400 text-lg font-medium">{card.back}</p>
          </div>
        )}
      </div>

      {/* Rating buttons */}
      {flipped && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Again', sub: 'today', cls: 'border-red-500/30 text-red-400 hover:bg-red-950/20' },
            { label: 'Hard', sub: '+1 day', cls: 'border-orange-500/30 text-orange-400 hover:bg-orange-950/20' },
            { label: 'Good', sub: '+3 days', cls: 'border-yellow-500/30 text-yellow-400 hover:bg-yellow-950/20' },
            { label: 'Easy', sub: '+7 days', cls: 'border-green-500/30 text-green-400 hover:bg-green-950/20' },
          ].map(({ label, sub, cls }) => (
            <button
              key={label}
              type="button"
              onClick={() => handleRate(label)}
              className={`border rounded-xl py-2.5 text-sm font-semibold transition-colors ${cls}`}
            >
              {label}
              <span className="block text-xs opacity-60 font-normal">{sub}</span>
            </button>
          ))}
        </div>
      )}

      {!flipped && (
        <p className="text-center text-[#3f3f46] text-xs">Click the card to flip it</p>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export function FlashcardsPage() {
  const [decks, setDecks] = useIDB('flashcard-decks', []);
  const [selectedDeckId, setSelectedDeckId] = useState(null);

  const allDecks = decks || [];

  const handleCreate = (form) => {
    const deck = createDeck(form);
    setDecks([...allDecks, deck]);
  };

  const handleDelete = (id) => {
    setDecks(allDecks.filter((d) => d.id !== id));
  };

  const handleUpdateDeck = (updated) => {
    setDecks(allDecks.map((d) => (d.id === updated.id ? updated : d)));
  };

  const selectedDeck = allDecks.find((d) => d.id === selectedDeckId);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#e4e4e7]">🃏 Flashcards</h1>
        <p className="text-[#71717a] text-sm mt-0.5">Spaced repetition for better learning</p>
      </div>

      {selectedDeck ? (
        <CardManager
          deck={selectedDeck}
          onUpdate={handleUpdateDeck}
          onBack={() => setSelectedDeckId(null)}
        />
      ) : (
        <DeckList
          decks={allDecks}
          onSelect={setSelectedDeckId}
          onDelete={handleDelete}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}
