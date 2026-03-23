import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { generateDays } from './tripUtils';

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

  if (!trip) {
    return (
      <div className="text-center py-16 text-[#71717a]">
        <p>Trip not found</p>
        <Link to="/trips" className="text-[#f59e0b] hover:underline mt-2 inline-block">Back to trips</Link>
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

  const handleNotesBlur = () => {
    onUpdate({ ...trip, notes });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link to="/trips" className="text-[#71717a] text-sm hover:text-[#f59e0b] mb-2 inline-block">← Back to trips</Link>
          <h2 className="text-2xl font-bold text-[#e4e4e7]">{trip.name}</h2>
          <p className="text-[#71717a] mt-1">{trip.destination} · {trip.startDate} → {trip.endDate}</p>
        </div>
        <select
          value={trip.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border-0 cursor-pointer ${STATUS_COLORS[trip.status]}`}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s} className="bg-[#111113] text-[#e4e4e7]">{s}</option>
          ))}
        </select>
      </div>

      {/* Budget Tracker */}
      {trip.budget > 0 && (
        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-6">
          <h3 className="text-[#e4e4e7] font-semibold mb-4">Budget Tracker</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-[#71717a] text-xs mb-1">Planned</p>
              <p className="text-[#e4e4e7] text-xl font-bold">${trip.budget.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[#71717a] text-xs mb-1">Spent</p>
              <p className="text-red-400 text-xl font-bold">${totalSpent.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[#71717a] text-xs mb-1">Remaining</p>
              <p className={`text-xl font-bold ${budgetRemaining >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${budgetRemaining.toLocaleString()}
              </p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-[#27272a] rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${totalSpent / trip.budget > 0.9 ? 'bg-red-500' : 'bg-amber-500'}`}
              style={{ width: `${Math.min((totalSpent / trip.budget) * 100, 100)}%` }}
            />
          </div>

          {/* Add expense */}
          <form onSubmit={handleAddExpense} className="mt-4 flex gap-2">
            <input
              type="text"
              placeholder="Description"
              value={newExpense.description}
              onChange={(e) => setNewExpense((p) => ({ ...p, description: e.target.value }))}
              className="flex-1 bg-[#0a0a0b] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-[#e4e4e7] placeholder-[#52525b] focus:outline-none focus:border-[#f59e0b]"
            />
            <input
              type="number"
              placeholder="Amount"
              value={newExpense.amount}
              onChange={(e) => setNewExpense((p) => ({ ...p, amount: e.target.value }))}
              className="w-28 bg-[#0a0a0b] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-[#e4e4e7] placeholder-[#52525b] focus:outline-none focus:border-[#f59e0b]"
            />
            <button type="submit" className="bg-[#f59e0b] hover:bg-[#d97706] text-black text-sm font-semibold px-4 py-2 rounded-lg">
              Add
            </button>
          </form>

          {/* Expense list */}
          {(trip.expenses || []).length > 0 && (
            <div className="mt-3 space-y-1">
              {trip.expenses.map((exp) => (
                <div key={exp.id} className="flex justify-between text-sm">
                  <span className="text-[#a1a1aa]">{exp.description}</span>
                  <span className="text-[#e4e4e7]">${exp.amount}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Itinerary */}
      <div className="bg-[#111113] border border-[#27272a] rounded-xl p-6">
        <h3 className="text-[#e4e4e7] font-semibold mb-4">Itinerary</h3>

        {days.length === 0 ? (
          <p className="text-[#71717a] text-sm">Set start and end dates to generate the itinerary.</p>
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
                  <h4 className="text-[#f59e0b] font-semibold text-sm mb-2">{label}</h4>

                  {/* Activities for this day */}
                  {acts.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {acts.map((a) => (
                        <div key={a.id} className="flex items-start gap-3 group text-sm">
                          {a.time && (
                            <span className="text-[#52525b] w-12 shrink-0 pt-0.5">{a.time}</span>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-[#e4e4e7] font-medium">{a.title}</p>
                            {a.notes && <p className="text-[#71717a] text-xs mt-0.5">{a.notes}</p>}
                          </div>
                          <button
                            onClick={() => handleRemoveActivity(a.id)}
                            aria-label="Remove activity"
                            className="opacity-0 group-hover:opacity-100 text-[#52525b] hover:text-red-400 transition-opacity shrink-0"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add activity for this day */}
                  <form onSubmit={(e) => handleAddActivity(e, date)} className="flex gap-2">
                    <input
                      type="time"
                      value={act.time}
                      onChange={(e) => handleActivityChange(date, 'time', e.target.value)}
                      aria-label="Activity time"
                      className="w-28 bg-[#0a0a0b] border border-[#27272a] rounded-lg px-2 py-1.5 text-xs text-[#e4e4e7] focus:outline-none focus:border-[#f59e0b]"
                    />
                    <input
                      type="text"
                      placeholder="Activity…"
                      value={act.title}
                      onChange={(e) => handleActivityChange(date, 'title', e.target.value)}
                      aria-label="Activity title"
                      className="flex-1 bg-[#0a0a0b] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-[#e4e4e7] placeholder-[#52525b] focus:outline-none focus:border-[#f59e0b]"
                    />
                    <input
                      type="text"
                      placeholder="Notes…"
                      value={act.notes}
                      onChange={(e) => handleActivityChange(date, 'notes', e.target.value)}
                      aria-label="Activity notes"
                      className="flex-1 bg-[#0a0a0b] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-[#e4e4e7] placeholder-[#52525b] focus:outline-none focus:border-[#f59e0b]"
                    />
                    <button
                      type="submit"
                      className="bg-[#27272a] hover:bg-[#3f3f46] text-[#e4e4e7] text-xs font-semibold px-3 py-1.5 rounded-lg"
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
      <div className="bg-[#111113] border border-[#27272a] rounded-xl p-6">
        <h3 className="text-[#e4e4e7] font-semibold mb-4">Notes</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleNotesBlur}
          placeholder="Add any notes about this trip..."
          rows={5}
          className="w-full bg-[#0a0a0b] border border-[#27272a] rounded-lg px-4 py-3 text-[#e4e4e7] placeholder-[#52525b] focus:outline-none focus:border-[#f59e0b] resize-none"
        />
      </div>
    </div>
  );
}
