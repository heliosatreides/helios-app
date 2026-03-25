import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { generateDays } from './tripUtils';
import { useGemini } from '../../hooks/useGemini';
import { AiSuggestion } from '../../components/AiSuggestion';

const STATUS_OPTIONS = ['Planning', 'Upcoming', 'Ongoing', 'Completed'];

const STATUS_COLORS = {
  Planning: 'bg-amber-900/60 text-amber-300',
  Upcoming: 'bg-blue-900/60 text-blue-300',
  Ongoing: 'bg-green-900/60 text-green-300',
  Completed: 'bg-zinc-800 text-zinc-400',
};

export function TripDetail({ trips, onUpdate }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const trip = trips?.find((t) => t.id === id);

  // Per-day new activity state: { [date]: { time, title, notes } }
  const [newActivity, setNewActivity] = useState({});
  const [newExpense, setNewExpense] = useState({ description: '', amount: '', category: '' });
  const [notes, setNotes] = useState(trip?.notes || '');
  const { generate, loading: aiLoading, error: aiError, hasKey } = useGemini();
  const [aiSuggestions, setAiSuggestions] = useState({});
  const [itineraryAi, setItineraryAi] = useState({ loading: false, result: null, error: null });

  if (!trip) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>Trip not found</p>
        <Link to="/trips" className="text-foreground hover:underline mt-2 inline-block">Back to trips</Link>
      </div>
    );
  }

  const totalSpent = (trip.expenses || []).reduce((sum, e) => sum + e.amount, 0);
  const budgetRemaining = trip.budget - totalSpent;

  // Auto-generate days from trip dates
  const days = generateDays(trip.startDate, trip.endDate);

  // Group activities by date
  const activitiesByDate = {};
  (trip.itinerary || []).forEach((act) => {
    if (!activitiesByDate[act.date]) activitiesByDate[act.date] = [];
    activitiesByDate[act.date].push(act);
  });

  const handleStatusChange = (status) => {
    onUpdate({ ...trip, status });
  };

  const getNewActivity = (date) =>
    newActivity[date] || { time: '', title: '', notes: '' };

  const handleActivityChange = (date, field, value) => {
    setNewActivity((prev) => ({
      ...prev,
      [date]: { ...getNewActivity(date), [field]: value },
    }));
  };

  const handleAddActivity = (e, date) => {
    e.preventDefault();
    const act = getNewActivity(date);
    if (!act.title.trim()) return;
    const newItem = {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      date,
      time: act.time,
      title: act.title,
      notes: act.notes,
    };
    onUpdate({
      ...trip,
      itinerary: [...(trip.itinerary || []), newItem],
    });
    setNewActivity((prev) => ({ ...prev, [date]: { time: '', title: '', notes: '' } }));
  };

  const handleRemoveActivity = (actId) => {
    onUpdate({
      ...trip,
      itinerary: (trip.itinerary || []).filter((a) => a.id !== actId),
    });
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!newExpense.description || !newExpense.amount) return;
    const updated = {
      ...trip,
      expenses: [
        ...(trip.expenses || []),
        { ...newExpense, amount: parseFloat(newExpense.amount), id: Date.now().toString() },
      ],
    };
    onUpdate(updated);
    setNewExpense({ description: '', amount: '', category: '' });
  };

  const handleRemoveExpense = (expId) => {
    if (!window.confirm('Delete this expense? This cannot be undone.')) return;
    onUpdate({
      ...trip,
      expenses: (trip.expenses || []).filter((e) => e.id !== expId),
    });
  };

  const handleNotesBlur = () => {
    onUpdate({ ...trip, notes });
  };

  const handleBuildItinerary = async () => {
    if (!window.confirm('This will add AI-suggested activities. Continue?')) return;
    setItineraryAi({ loading: true, result: null, error: null });
    try {
      const prompt = `Create a detailed day-by-day travel itinerary for a trip to ${trip.destination} from ${trip.startDate} to ${trip.endDate}. For each day, suggest 3-4 activities with brief descriptions. Format: Day 1 (Mon Jan 1): [activity 1] - [description]. Day 2...`;
      const text = await generate(prompt);
      setItineraryAi({ loading: false, result: text, error: null });
      // Parse and populate: match "Day N (label): activities"
      const dayBlocks = text.split(/(?=Day \d+)/g).filter(Boolean);
      const dateList = days.map((d) => d.date);
      const newActivities = [];
      dayBlocks.forEach((block, idx) => {
        const date = dateList[idx];
        if (!date) return;
        // Skip days already populated
        if ((activitiesByDate[date] || []).length > 0) return;
        const lines = block.split('\n').filter((l) => l.match(/^\s*[-•*]|^\s*\d+\./));
        lines.forEach((line) => {
          const clean = line.replace(/^\s*[-•*\d.]+\s*/, '').trim();
          if (!clean) return;
          const [title, ...rest] = clean.split(' - ');
          newActivities.push({
            id: Date.now().toString() + Math.random().toString(36).slice(2),
            date,
            time: '',
            title: title?.trim() || clean,
            notes: rest.join(' - ').trim(),
          });
        });
      });
      if (newActivities.length > 0) {
        onUpdate({ ...trip, itinerary: [...(trip.itinerary || []), ...newActivities] });
      }
    } catch (err) {
      setItineraryAi({ loading: false, result: null, error: err.message });
    }
  };

  const handleAiSuggest = async (date, label) => {
    setAiSuggestions((prev) => ({ ...prev, [date]: { loading: true, result: null, error: null } }));
    try {
      const prompt = `I'm planning a trip to ${trip.destination} on ${label} (${date}). Suggest 3 specific activities or experiences I can do that day. Be concise, one line each, numbered 1-3.`;
      const text = await generate(prompt);
      setAiSuggestions((prev) => ({ ...prev, [date]: { loading: false, result: text, error: null } }));
    } catch (err) {
      setAiSuggestions((prev) => ({ ...prev, [date]: { loading: false, result: null, error: err.message } }));
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link to="/trips" className="text-muted-foreground text-sm hover:text-foreground mb-2 inline-block">← Back to trips</Link>
          <h2 className="text-lg font-semibold text-foreground">{trip.name}</h2>
          <p className="text-muted-foreground mt-1">{trip.destination} · {trip.startDate} → {trip.endDate}</p>
        </div>
        <select
          value={trip.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border-0 cursor-pointer ${STATUS_COLORS[trip.status]}`}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s} className="bg-secondary text-foreground">{s}</option>
          ))}
        </select>
      </div>

      {/* AI Build Full Itinerary */}
      {hasKey && trip.startDate && trip.endDate && (
        <div>
          <button
            type="button"
            onClick={handleBuildItinerary}
            disabled={itineraryAi.loading}
            className="border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50 text-sm font-semibold px-4 py-2 transition-colors disabled:opacity-50"
            data-testid="build-itinerary-btn"
          >
            {itineraryAi.loading ? '⏳ Building…' : '✨ Build Full Itinerary'}
          </button>
          {itineraryAi.error && (
            <p className="text-red-400 text-xs mt-2">❌ {itineraryAi.error}</p>
          )}
          {itineraryAi.result && (
            <div className="mt-3 border border-border bg-secondary/50 p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-foreground text-xs font-medium">✨ AI Itinerary Generated</span>
                <button
                  type="button"
                  onClick={() => setItineraryAi({ loading: false, result: null, error: null })}
                  className="text-muted-foreground/80 hover:text-foreground text-xs"
                >
                  Dismiss
                </button>
              </div>
              <p className="text-muted-foreground text-xs">Activities have been added to your itinerary below.</p>
            </div>
          )}
        </div>
      )}

      {/* Budget Tracker */}
      {trip.budget > 0 && (
        <div className="bg-background border border-border p-6">
          <h3 className="text-foreground font-semibold mb-4">Budget Tracker</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-muted-foreground text-xs mb-1">Planned</p>
              <p className="text-foreground text-xl font-bold">${trip.budget.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Spent</p>
              <p className="text-red-400 text-xl font-bold">${totalSpent.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Remaining</p>
              <p className={`text-xl font-bold ${budgetRemaining >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${budgetRemaining.toLocaleString()}
              </p>
            </div>
          </div>
          {/* Progress bar */}
          {(() => {
            const pct = trip.budget > 0 ? (totalSpent / trip.budget) * 100 : 0;
            const barColor = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-green-500';
            const pctLabel = trip.budget > 0 ? `${Math.round(pct)}% used` : '';
            return (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-muted-foreground/80 text-xs">Budget used</span>
                  <span className={`text-xs font-semibold ${pct >= 90 ? 'text-red-400' : pct >= 70 ? 'text-amber-400' : 'text-green-400'}`}>
                    {pctLabel}
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${barColor}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>
            );
          })()}

          {/* Add expense */}
          <form onSubmit={handleAddExpense} className="mt-4 flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="Description"
              value={newExpense.description}
              onChange={(e) => setNewExpense((p) => ({ ...p, description: e.target.value }))}
              className="flex-1 min-w-[120px] bg-background border border-border px-3 py-2 text-sm text-foreground placeholder-[#52525b] focus:outline-none focus:border-[#f59e0b]"
            />
            <input
              type="number"
              placeholder="Amount"
              value={newExpense.amount}
              onChange={(e) => setNewExpense((p) => ({ ...p, amount: e.target.value }))}
              className="w-28 bg-background border border-border px-3 py-2 text-sm text-foreground placeholder-[#52525b] focus:outline-none focus:border-[#f59e0b]"
            />
            <button type="submit" className="bg-foreground hover:bg-[#d97706] text-black text-sm font-semibold px-4 py-2">
              Add
            </button>
          </form>

          {/* Expense list */}
          {(trip.expenses || []).length > 0 && (
            <div className="mt-3 space-y-1">
              {trip.expenses.map((exp) => (
                <div key={exp.id} className="flex items-center justify-between text-sm gap-2">
                  <span className="text-muted-foreground flex-1 min-w-0 truncate">{exp.description}</span>
                  <span className="text-foreground shrink-0">${exp.amount}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveExpense(exp.id)}
                    aria-label="Remove expense"
                    className="opacity-30 hover:opacity-100 focus:opacity-100 text-muted-foreground/80 hover:text-red-400 transition-opacity shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Itinerary */}
      <div className="bg-background border border-border p-6">
        <h3 className="text-foreground font-semibold mb-4">Itinerary</h3>

        {days.length === 0 ? (
          <p className="text-muted-foreground text-sm">Set start and end dates to generate the itinerary.</p>
        ) : (
          <div className="space-y-6">
            {days.map(({ date, label }) => {
              const acts = (activitiesByDate[date] || []).slice().sort((a, b) =>
                (a.time || '').localeCompare(b.time || '')
              );
              const act = getNewActivity(date);
              return (
                <div key={date}>
                  {/* Day header */}
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-foreground font-semibold text-sm">{label}</h4>
                    {hasKey && (
                      <button
                        type="button"
                        onClick={() => handleAiSuggest(date, label)}
                        disabled={aiSuggestions[date]?.loading}
                        className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
                      >
                        {aiSuggestions[date]?.loading ? '⏳' : '✨ Suggest activities'}
                      </button>
                    )}
                  </div>
                  {aiSuggestions[date] && (
                    <AiSuggestion
                      loading={aiSuggestions[date].loading}
                      result={aiSuggestions[date].result}
                      error={aiSuggestions[date].error}
                    />
                  )}

                  {/* Activities for this day */}
                  {acts.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {acts.map((a) => (
                        <div key={a.id} className="flex items-start gap-3 group text-sm">
                          {a.time && (
                            <span className="text-muted-foreground/80 w-12 shrink-0 pt-0.5">{a.time}</span>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-foreground font-medium">{a.title}</p>
                            {a.notes && <p className="text-muted-foreground text-xs mt-0.5">{a.notes}</p>}
                          </div>
                          <button
                            onClick={() => handleRemoveActivity(a.id)}
                            aria-label="Remove activity"
                            className="opacity-30 hover:opacity-100 focus:opacity-100 text-muted-foreground/80 hover:text-red-400 transition-opacity shrink-0"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add activity for this day */}
                  <form onSubmit={(e) => handleAddActivity(e, date)} className="flex flex-wrap gap-2">
                    <input
                      type="time"
                      value={act.time}
                      onChange={(e) => handleActivityChange(date, 'time', e.target.value)}
                      aria-label="Activity time"
                      className="w-28 bg-background border border-border px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-[#f59e0b]"
                    />
                    <input
                      type="text"
                      placeholder="Activity…"
                      value={act.title}
                      onChange={(e) => handleActivityChange(date, 'title', e.target.value)}
                      aria-label="Activity title"
                      className="flex-1 min-w-[120px] bg-background border border-border px-3 py-1.5 text-xs text-foreground placeholder-[#52525b] focus:outline-none focus:border-[#f59e0b]"
                    />
                    <input
                      type="text"
                      placeholder="Notes…"
                      value={act.notes}
                      onChange={(e) => handleActivityChange(date, 'notes', e.target.value)}
                      aria-label="Activity notes"
                      className="flex-1 min-w-[120px] bg-background border border-border px-3 py-1.5 text-xs text-foreground placeholder-[#52525b] focus:outline-none focus:border-[#f59e0b]"
                    />
                    <button
                      type="submit"
                      className="bg-secondary hover:bg-[#3f3f46] text-foreground text-xs font-semibold px-3 py-1.5"
                    >
                      + Add
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="bg-background border border-border p-6">
        <h3 className="text-foreground font-semibold mb-4">Notes</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleNotesBlur}
          placeholder="Add any notes about this trip..."
          rows={5}
          className="w-full bg-background border border-border px-4 py-3 text-foreground placeholder-[#52525b] focus:outline-none focus:border-[#f59e0b] resize-none"
        />
      </div>
    </div>
  );
}
