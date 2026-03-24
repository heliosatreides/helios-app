import { useState, useMemo } from 'react';
import { useTodaySchedule } from '../../hooks/useTodaySchedule';
import { useGemini } from '../../hooks/useGemini';
import { buildPlanMyDayPrompt, parseScheduleResponse } from './geminiUtils';

const COLOR_CLASSES = {
  amber: 'bg-amber-500/20 border-amber-500/50 text-amber-300',
  blue: 'bg-blue-500/20 border-blue-500/50 text-blue-300',
  green: 'bg-green-500/20 border-green-500/50 text-green-300',
  red: 'bg-red-500/20 border-red-500/50 text-red-300',
};

const COLOR_OPTIONS = ['amber', 'blue', 'green', 'red'];
const DURATION_OPTIONS = [30, 60, 120];

function generateTimeSlots() {
  const slots = [];
  // 6:00 AM = 360 minutes, 11:00 PM = 1380 minutes (exclusive end)
  for (let mins = 360; mins < 1380; mins += 30) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const hh = String(h).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    const ampm = h < 12 ? 'AM' : 'PM';
    const label = `${hour12}:${mm} ${ampm}`;
    slots.push({ time: `${hh}:${mm}`, label, isHour: m === 0 });
  }
  return slots;
}

const TIME_SLOTS = generateTimeSlots();

export function TodayTab({ dateStr, tasks = [], tripActivities = [] }) {
  const { schedule, addEvent, updateEvent, deleteEvent, setScheduleForDate } = useTodaySchedule(dateStr);
  const { generate, loading: aiLoading, hasKey } = useGemini();

  const [activeSlot, setActiveSlot] = useState(null); // slot time string or event id being edited
  const [editMode, setEditMode] = useState(null); // 'add' | 'edit'
  const [formData, setFormData] = useState({ title: '', duration: 30, color: 'blue' });
  const [aiSuggestion, setAiSuggestion] = useState(null); // pending AI schedule
  const [showConfirm, setShowConfirm] = useState(false);

  // Merge persisted events + read-only trip activities
  const allEvents = useMemo(() => {
    const tripBlocks = tripActivities.map((act) => ({
      id: `trip-${act.id}`,
      slotTime: act.time || '00:00',
      title: `✈️ ${act.tripName}`,
      subtitle: act.title,
      duration: 60,
      color: 'blue',
      readOnly: true,
    }));
    return [...schedule, ...tripBlocks];
  }, [schedule, tripActivities]);

  // Build a map of slot → events for quick lookup
  const slotEventMap = useMemo(() => {
    const map = {};
    for (const evt of allEvents) {
      if (!map[evt.slotTime]) map[evt.slotTime] = [];
      map[evt.slotTime].push(evt);
    }
    return map;
  }, [allEvents]);

  const handleSlotClick = (slotTime, evt) => {
    if (evt) {
      if (evt.readOnly) return;
      setActiveSlot(slotTime);
      setEditMode('edit');
      setFormData({ title: evt.title, duration: evt.duration, color: evt.color, editingId: evt.id });
    } else {
      setActiveSlot(slotTime);
      setEditMode('add');
      setFormData({ title: '', duration: 30, color: 'blue' });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    if (editMode === 'add') {
      addEvent({ slotTime: activeSlot, title: formData.title, duration: formData.duration, color: formData.color });
    } else if (editMode === 'edit' && formData.editingId) {
      updateEvent(formData.editingId, { title: formData.title, duration: formData.duration, color: formData.color });
    }
    setActiveSlot(null);
    setEditMode(null);
  };

  const handleDelete = (eventId) => {
    deleteEvent(eventId);
    setActiveSlot(null);
    setEditMode(null);
  };

  const handlePlanMyDay = async () => {
    try {
      const prompt = buildPlanMyDayPrompt(tasks, schedule);
      const raw = await generate(prompt);
      const events = parseScheduleResponse(raw);
      if (events.length > 0) {
        setAiSuggestion(events);
        setShowConfirm(true);
      }
    } catch {}
  };

  const handleApplyAI = () => {
    if (aiSuggestion) {
      setScheduleForDate(aiSuggestion.map((e) => ({
        ...e,
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        readOnly: false,
      })));
    }
    setShowConfirm(false);
    setAiSuggestion(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-foreground font-semibold">Today's Schedule</h3>
        {hasKey && (
          <button
            onClick={handlePlanMyDay}
            disabled={aiLoading}
            className="text-sm px-3 py-1.5 bg-secondary text-foreground hover:bg-amber-500/20 transition-colors disabled:opacity-40"
          >
            {aiLoading ? '⏳ Planning…' : '✨ Plan My Day'}
          </button>
        )}
      </div>

      {/* AI Confirm modal */}
      {showConfirm && aiSuggestion && (
        <div className="bg-secondary border border-amber-500/30 p-4 space-y-3">
          <p className="text-foreground text-sm font-medium">Apply AI schedule? ({aiSuggestion.length} blocks)</p>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {aiSuggestion.map((e, i) => (
              <div key={i} className="text-xs text-muted-foreground">
                <span className="text-amber-400">{e.slotTime}</span> — {e.title} ({e.duration}min)
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleApplyAI}
              className="px-3 py-1.5 text-sm bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            >
              Apply
            </button>
            <button
              onClick={() => { setShowConfirm(false); setAiSuggestion(null); }}
              className="px-3 py-1.5 text-sm bg-secondary hover:bg-[#3f3f46] text-foreground"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Time slots */}
      <div className="space-y-0.5">
        {TIME_SLOTS.map(({ time, label, isHour }, idx) => {
          const events = slotEventMap[time] || [];
          const isActive = activeSlot === time;

          return (
            <div key={time}>
              <div
                className={`flex gap-3 group min-h-[36px] ${isHour ? 'bg-[#0d0d0f]' : 'bg-background'} px-3 py-1 hover:bg-secondary cursor-pointer transition-colors`}
                onClick={() => events.length === 0 && handleSlotClick(time, null)}
              >
                {/* Time label */}
                <span className={`text-xs w-16 shrink-0 pt-1.5 ${isHour ? 'text-muted-foreground/80' : 'text-muted-foreground/60'}`}>
                  {label}
                </span>

                {/* Events or empty click zone */}
                <div className="flex-1 min-w-0 space-y-1 py-0.5">
                  {events.map((evt) => (
                    <div
                      key={evt.id}
                      onClick={(e) => { e.stopPropagation(); handleSlotClick(time, evt); }}
                      className={`border rounded-md px-2 py-1 text-xs cursor-pointer ${COLOR_CLASSES[evt.color] || COLOR_CLASSES.blue} ${evt.readOnly ? 'opacity-80' : 'hover:opacity-90'}`}
                    >
                      <span className="font-medium">{evt.title}</span>
                      {evt.subtitle && <span className="ml-1 opacity-70">· {evt.subtitle}</span>}
                      <span className="ml-1 opacity-60">{evt.duration}min</span>
                    </div>
                  ))}
                  {events.length === 0 && !isActive && (
                    <div className="h-5 opacity-0 group-hover:opacity-100 text-muted-foreground/60 text-xs pt-0.5 transition-opacity">
                      + Add event
                    </div>
                  )}
                </div>
              </div>

              {/* Inline add/edit form */}
              {isActive && (
                <form
                  onSubmit={handleSubmit}
                  className="bg-background border border-border p-3 mx-1 my-1 space-y-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="text"
                    placeholder="Event title…"
                    value={formData.title}
                    onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                    autoFocus
                    className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground placeholder-[#52525b] focus:outline-none focus:border-[#f59e0b]"
                  />
                  <div className="flex gap-2 flex-wrap">
                    {/* Duration */}
                    <select
                      value={formData.duration}
                      onChange={(e) => setFormData((p) => ({ ...p, duration: Number(e.target.value) }))}
                      className="bg-background border border-border px-2 py-1.5 text-xs text-foreground focus:outline-none"
                    >
                      {DURATION_OPTIONS.map((d) => (
                        <option key={d} value={d}>{d === 30 ? '30min' : d === 60 ? '1hr' : '2hr'}</option>
                      ))}
                    </select>
                    {/* Color */}
                    <div className="flex gap-1">
                      {COLOR_OPTIONS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setFormData((p) => ({ ...p, color: c }))}
                          className={`w-5 h-5 rounded-full border-2 ${formData.color === c ? 'border-white' : 'border-transparent'} ${
                            c === 'amber' ? 'bg-amber-400' : c === 'blue' ? 'bg-blue-400' : c === 'green' ? 'bg-green-400' : 'bg-red-400'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="px-3 py-1.5 text-xs bg-foreground hover:bg-[#d97706] text-black font-semibold">
                      {editMode === 'add' ? 'Add' : 'Save'}
                    </button>
                    {editMode === 'edit' && formData.editingId && (
                      <button
                        type="button"
                        onClick={() => handleDelete(formData.editingId)}
                        className="px-3 py-1.5 text-xs bg-red-900/40 hover:bg-red-900/60 text-red-400"
                      >
                        Delete
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => { setActiveSlot(null); setEditMode(null); }}
                      className="px-3 py-1.5 text-xs bg-secondary hover:bg-[#3f3f46] text-muted-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
