import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

const STATUS_OPTIONS = ['Planning', 'Upcoming', 'Ongoing', 'Completed'];

const STATUS_COLORS = {
  Planning: 'bg-blue-900 text-blue-300',
  Upcoming: 'bg-amber-900 text-amber-300',
  Ongoing: 'bg-green-900 text-green-300',
  Completed: 'bg-zinc-800 text-zinc-400',
};

export function TripDetail({ trips, onUpdate }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const trip = trips?.find((t) => t.id === id);

  const [newDay, setNewDay] = useState({ date: '', title: '', description: '' });
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

  const handleStatusChange = (status) => {
    onUpdate({ ...trip, status });
  };

  const handleAddDay = (e) => {
    e.preventDefault();
    if (!newDay.date || !newDay.title) return;
    const updated = {
      ...trip,
      itinerary: [...(trip.itinerary || []), { ...newDay, id: Date.now().toString() }],
    };
    onUpdate(updated);
    setNewDay({ date: '', title: '', description: '' });
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!newExpense.description || !newExpense.amount) return;
    const updated = {
      ...trip,
      expenses: [...(trip.expenses || []), { ...newExpense, amount: parseFloat(newExpense.amount), id: Date.now().toString() }],
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

      {/* Itinerary */}
      <div className="bg-[#111113] border border-[#27272a] rounded-xl p-6">
        <h3 className="text-[#e4e4e7] font-semibold mb-4">Itinerary</h3>

        {/* Add day */}
        <form onSubmit={handleAddDay} className="flex gap-2 mb-4">
          <input
            type="date"
            value={newDay.date}
            onChange={(e) => setNewDay((p) => ({ ...p, date: e.target.value }))}
            className="bg-[#0a0a0b] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-[#e4e4e7] focus:outline-none focus:border-[#f59e0b]"
          />
          <input
            type="text"
            placeholder="Activity title"
            value={newDay.title}
            onChange={(e) => setNewDay((p) => ({ ...p, title: e.target.value }))}
            className="flex-1 bg-[#0a0a0b] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-[#e4e4e7] placeholder-[#52525b] focus:outline-none focus:border-[#f59e0b]"
          />
          <button type="submit" className="bg-[#f59e0b] hover:bg-[#d97706] text-black text-sm font-semibold px-4 py-2 rounded-lg">
            Add Day
          </button>
        </form>

        {/* Day list */}
        {(trip.itinerary || []).length === 0 ? (
          <p className="text-[#71717a] text-sm">No itinerary yet. Add your first day above.</p>
        ) : (
          <div className="space-y-3">
            {[...trip.itinerary].sort((a, b) => a.date.localeCompare(b.date)).map((day) => (
              <div key={day.id} className="flex gap-4 text-sm">
                <span className="text-[#f59e0b] font-medium w-24 shrink-0">{day.date}</span>
                <div>
                  <p className="text-[#e4e4e7] font-medium">{day.title}</p>
                  {day.description && <p className="text-[#71717a] mt-0.5">{day.description}</p>}
                </div>
              </div>
            ))}
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
