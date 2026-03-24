import { useState, useEffect, useCallback } from 'react';
import { useIDB } from '../../hooks/useIDB';
import { useGemini } from '../../hooks/useGemini';

// ── Utils ─────────────────────────────────────────────────────────────────

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getDateStr(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export function calcSleepHours(bedtime, wakeTime) {
  if (!bedtime || !wakeTime) return null;
  const [bh, bm] = bedtime.split(':').map(Number);
  const [wh, wm] = wakeTime.split(':').map(Number);
  let mins = (wh * 60 + wm) - (bh * 60 + bm);
  if (mins < 0) mins += 24 * 60; // crossed midnight
  return parseFloat((mins / 60).toFixed(2));
}

export function sleepColor(hours) {
  if (hours === null) return 'text-[#71717a]';
  if (hours >= 7) return 'text-green-400';
  if (hours >= 6) return 'text-amber-400';
  return 'text-red-400';
}

export function calcWeeklyAvgSleep(sleepLog) {
  const now = new Date();
  const entries = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const entry = sleepLog[key];
    if (entry && entry.hours !== null && entry.hours !== undefined) {
      entries.push(entry.hours);
    }
  }
  if (entries.length === 0) return null;
  return parseFloat((entries.reduce((s, v) => s + v, 0) / entries.length).toFixed(2));
}

const MOOD_OPTIONS = [
  { value: 'great', label: '😄 Great', color: 'bg-green-500' },
  { value: 'good', label: '🙂 Good', color: 'bg-emerald-400' },
  { value: 'okay', label: '😐 Okay', color: 'bg-amber-400' },
  { value: 'low', label: '😔 Low', color: 'bg-orange-400' },
  { value: 'rough', label: '😣 Rough', color: 'bg-red-500' },
];

const MOOD_COLORS = {
  great: 'bg-green-500',
  good: 'bg-emerald-400',
  okay: 'bg-amber-400',
  low: 'bg-orange-400',
  rough: 'bg-red-500',
};

// ── Collapsible card ──────────────────────────────────────────────────────
function Card({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-[#0c0c0e] border border-[#1c1c20] rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#0a0a0b] transition-colors"
      >
        <span className="text-[#e4e4e7] font-semibold">{title}</span>
        <span className="text-[#52525b] text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

// ── Water Tracker ─────────────────────────────────────────────────────────
export function WaterTracker({ goal = 8 }) {
  const todayKey = getTodayKey();
  const storageKey = `helios-water-${todayKey}`;

  const [glasses, setGlasses] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  });

  // Reset daily: if the stored date differs from today, clear
  useEffect(() => {
    // Purge old keys
    try {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith('helios-water-') && k !== storageKey);
      keys.forEach((k) => localStorage.removeItem(k));
    } catch { /* */ }
  }, [storageKey]);

  const increment = useCallback(() => {
    setGlasses((g) => {
      const next = Math.min(g + 1, goal * 2);
      localStorage.setItem(storageKey, String(next));
      return next;
    });
  }, [storageKey, goal]);

  const decrement = useCallback(() => {
    setGlasses((g) => {
      const next = Math.max(g - 1, 0);
      localStorage.setItem(storageKey, String(next));
      return next;
    });
  }, [storageKey]);

  const pct = Math.min(glasses / goal, 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[#e4e4e7] text-2xl font-bold">{glasses} <span className="text-[#71717a] text-base font-normal">/ {goal} glasses</span></p>
          <p className="text-[#71717a] text-xs mt-0.5">{Math.round(pct * 100)}% of daily goal</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={decrement}
            data-testid="water-decrement"
            disabled={glasses === 0}
            className="w-8 h-8 rounded-full bg-[#27272a] hover:bg-[#3f3f46] text-[#e4e4e7] font-bold disabled:opacity-30 transition-colors"
          >
            −
          </button>
          <button
            onClick={increment}
            data-testid="water-increment"
            className="w-8 h-8 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-bold transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* Glass icons */}
      <div className="flex gap-1.5 flex-wrap" data-testid="water-glasses">
        {Array.from({ length: goal }).map((_, i) => (
          <span key={i} className={`text-xl ${i < glasses ? 'opacity-100' : 'opacity-20'}`} title={i < glasses ? 'Done' : 'Remaining'}>
            🥤
          </span>
        ))}
      </div>

      {glasses >= goal && (
        <p className="text-green-400 text-xs font-semibold">🎉 Goal reached! Great hydration today.</p>
      )}
    </div>
  );
}

// ── Mood Journal ──────────────────────────────────────────────────────────
export function MoodJournal() {
  const [moodLog, setMoodLog] = useIDB('mood-journal', {});
  const today = getTodayKey();
  const [selectedMood, setSelectedMood] = useState('');
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  // Pre-fill from today's entry
  useEffect(() => {
    if (moodLog[today]) {
      setSelectedMood(moodLog[today].mood || '');
      setNote(moodLog[today].note || '');
    }
  }, [moodLog, today]);

  const handleSave = () => {
    if (!selectedMood) return;
    setMoodLog((prev) => ({
      ...prev,
      [today]: { mood: selectedMood, note: note.trim(), date: today },
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Last 14 days for history
  const history = Array.from({ length: 14 }, (_, i) => {
    const dateStr = getDateStr(-(13 - i));
    return { dateStr, entry: moodLog[dateStr] };
  });

  return (
    <div className="space-y-4">
      {/* Mood picker */}
      <div>
        <p className="text-[#71717a] text-xs mb-2">How are you feeling today?</p>
        <div className="flex gap-2 flex-wrap">
          {MOOD_OPTIONS.map((m) => (
            <button
              key={m.value}
              onClick={() => setSelectedMood(m.value)}
              data-testid={`mood-option-${m.value}`}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                selectedMood === m.value
                  ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                  : 'border-[#1c1c20] text-[#a1a1aa] hover:border-[#3f3f46]'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {selectedMood && (
        <div className="space-y-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note (1-2 sentences)…"
            rows={2}
            className="w-full bg-[#0a0a0b] border border-[#1c1c20] rounded-lg px-3 py-2 text-sm text-[#e4e4e7] placeholder-[#52525b] focus:outline-none resize-none"
          />
          <button
            onClick={handleSave}
            data-testid="mood-save"
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg text-sm transition-colors"
          >
            {saved ? '✓ Saved' : 'Save Mood'}
          </button>
        </div>
      )}

      {/* 14-day history */}
      <div>
        <p className="text-[#52525b] text-xs uppercase tracking-wider mb-2">14-Day History</p>
        <div className="flex gap-1.5 flex-wrap">
          {history.map(({ dateStr, entry }) => (
            <div key={dateStr} className="flex flex-col items-center gap-0.5" title={entry ? `${dateStr}: ${entry.mood}${entry.note ? ' — ' + entry.note : ''}` : dateStr}>
              <div
                data-testid={`mood-dot-${dateStr}`}
                className={`w-3 h-3 rounded-full ${entry ? MOOD_COLORS[entry.mood] || 'bg-zinc-500' : 'bg-[#27272a]'}`}
              />
              <span className="text-[#3f3f46] text-[9px]">{dateStr.slice(8)}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-3 flex-wrap mt-2">
          {MOOD_OPTIONS.map((m) => (
            <span key={m.value} className="flex items-center gap-1 text-xs text-[#52525b]">
              <span className={`w-2 h-2 rounded-full ${m.color}`} />
              {m.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Sleep Tracker ─────────────────────────────────────────────────────────
export function SleepTracker() {
  const [sleepLog, setSleepLog] = useIDB('sleep-log', {});
  const today = getTodayKey();
  const [bedtime, setBedtime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [saved, setSaved] = useState(false);

  // Pre-fill from today's entry
  useEffect(() => {
    if (sleepLog[today]) {
      setBedtime(sleepLog[today].bedtime || '23:00');
      setWakeTime(sleepLog[today].wakeTime || '07:00');
    }
  }, [sleepLog, today]);

  const hours = calcSleepHours(bedtime, wakeTime);
  const color = sleepColor(hours);
  const weeklyAvg = calcWeeklyAvgSleep(sleepLog);

  const handleSave = () => {
    setSleepLog((prev) => ({
      ...prev,
      [today]: { bedtime, wakeTime, hours, date: today },
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[#71717a] text-xs mb-1">Bedtime</label>
          <input
            type="time"
            value={bedtime}
            onChange={(e) => setBedtime(e.target.value)}
            data-testid="sleep-bedtime"
            className="w-full bg-[#0a0a0b] border border-[#1c1c20] rounded-lg px-3 py-2 text-sm text-[#e4e4e7] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[#71717a] text-xs mb-1">Wake Time</label>
          <input
            type="time"
            value={wakeTime}
            onChange={(e) => setWakeTime(e.target.value)}
            data-testid="sleep-waketime"
            className="w-full bg-[#0a0a0b] border border-[#1c1c20] rounded-lg px-3 py-2 text-sm text-[#e4e4e7] focus:outline-none"
          />
        </div>
      </div>

      {hours !== null && (
        <p className={`text-2xl font-bold ${color}`} data-testid="sleep-hours">
          {hours}h
          <span className="text-sm font-normal text-[#71717a] ml-2">
            {hours >= 7 ? '✓ Good sleep' : hours >= 6 ? '⚠ A bit short' : '⚠ Too little'}
          </span>
        </p>
      )}

      <button
        onClick={handleSave}
        data-testid="sleep-save"
        className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg text-sm transition-colors"
      >
        {saved ? '✓ Saved' : 'Log Sleep'}
      </button>

      {weeklyAvg !== null && (
        <div className="bg-[#0a0a0b] rounded-lg px-4 py-3">
          <p className="text-[#71717a] text-xs">7-Day Average</p>
          <p className={`text-xl font-bold mt-0.5 ${sleepColor(weeklyAvg)}`} data-testid="sleep-weekly-avg">{weeklyAvg}h</p>
        </div>
      )}
    </div>
  );
}

// ── Main HealthTab ────────────────────────────────────────────────────────
export function HealthTab() {
  const { generate, loading: aiLoading, hasKey } = useGemini();
  const [digest, setDigest] = useState(null);
  const [digestError, setDigestError] = useState(null);

  const [moodLog] = useIDB('mood-journal', {});
  const [sleepLog] = useIDB('sleep-log', {});

  const goal = parseInt(localStorage.getItem('settings-water-goal') || '8', 10) || 8;

  const handleWeeklyDigest = async () => {
    setDigestError(null);
    // Build last 7 days stats
    const avgSleep = calcWeeklyAvgSleep(sleepLog);
    const moodDist = {};
    let moodCount = 0;
    for (let i = 0; i < 7; i++) {
      const key = getDateStr(-i);
      if (moodLog[key]) {
        const m = moodLog[key].mood;
        moodDist[m] = (moodDist[m] || 0) + 1;
        moodCount++;
      }
    }
    // Water goal hit rate
    let waterHit = 0;
    let waterDays = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `helios-water-${d.toISOString().slice(0, 10)}`;
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        waterDays++;
        if (parseInt(stored, 10) >= goal) waterHit++;
      }
    }
    const waterRate = waterDays > 0 ? `${waterHit}/${waterDays} days` : 'no data';
    const moodSummary = Object.entries(moodDist).map(([m, n]) => `${m}: ${n}`).join(', ');

    const prompt = `Give me a brief, warm wellness insight (2-3 sentences) based on these stats from the past 7 days:
- Average sleep: ${avgSleep !== null ? avgSleep + ' hours' : 'no data'}
- Mood distribution: ${moodCount > 0 ? moodSummary : 'no data'}
- Water goal hit rate: ${waterRate} (goal: ${goal} glasses/day)
Be encouraging and specific.`;

    try {
      const text = await generate(prompt);
      setDigest(text);
    } catch (err) {
      setDigestError(err.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Weekly Health Digest */}
      {hasKey && (
        <div>
          {digest ? (
            <div className="border border-amber-500/20 bg-amber-500/5 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-amber-400 text-sm font-semibold">✨ Weekly Health Digest</span>
                <button type="button" onClick={() => setDigest(null)} className="text-[#52525b] hover:text-[#e4e4e7] text-xs">Dismiss</button>
              </div>
              <p className="text-[#e4e4e7] text-sm">{digest}</p>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleWeeklyDigest}
              disabled={aiLoading}
              data-testid="health-digest-btn"
              className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {aiLoading ? '⏳ Generating…' : '✨ Weekly Health Digest'}
            </button>
          )}
          {digestError && <p className="text-red-400 text-xs mt-1">❌ {digestError}</p>}
        </div>
      )}

      <Card title="💧 Water Tracker">
        <WaterTracker goal={goal} />
      </Card>

      <Card title="🧠 Mood Journal">
        <MoodJournal />
      </Card>

      <Card title="😴 Sleep Tracker">
        <SleepTracker />
      </Card>
    </div>
  );
}
