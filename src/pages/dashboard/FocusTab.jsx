import { useState, useEffect, useRef } from 'react';
import { useIDB } from '../../hooks/useIDB';
import { useGemini } from '../../hooks/useGemini';
import { useTasks, getTodayStr } from '../../hooks/useTasks';
import {
  pomodoroTransition,
  POMODORO_STATES,
  calculateStreak,
  getLast7Days,
  createHabit,
  toggleHabitCompletion,
  parseMarkdownish,
} from './focus.utils';

const { IDLE, RUNNING, PAUSED, BREAK } = POMODORO_STATES;

// ── Shared AI result card ─────────────────────────────────────────────────

function AiResultCard({ title, content, onDismiss }) {
  if (!content) return null;
  return (
    <div className="border border-amber-500/30 bg-amber-950/20 rounded-xl p-4 relative">
      <button
        type="button"
        onClick={onDismiss}
        className="absolute top-3 right-3 text-[#52525b] hover:text-[#e4e4e7] text-sm leading-none"
        aria-label="Dismiss"
      >
        ×
      </button>
      <span className="text-amber-400 text-sm font-semibold">✨ {title}</span>
      <p className="text-[#e4e4e7] text-sm mt-2 whitespace-pre-wrap pr-4">{content}</p>
    </div>
  );
}

// ── Collapsible card wrapper ──────────────────────────────────────────────

function CollapsibleCard({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-[#111113] border border-[#27272a] rounded-xl overflow-hidden">
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

// ── Pomodoro Timer ────────────────────────────────────────────────────────

const POMO_SESSION_KEY = 'helios-pomodoro-session';

function PomodoroTimer() {
  const { tasks } = useTasks();
  const today = getTodayStr();
  const todayTasks = (tasks || []).filter((t) => !t.done && t.dueDate === today);

  // Load/save session from localStorage (resets daily)
  const [sessionData, setSessionData] = useState(() => {
    try {
      const raw = localStorage.getItem(POMO_SESSION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed.date !== today) return null;
      return parsed;
    } catch { return null; }
  });

  const [workMins, setWorkMins] = useState(sessionData?.workMins ?? 25);
  const [breakMins, setBreakMins] = useState(sessionData?.breakMins ?? 5);
  const [timerState, setTimerState] = useState(IDLE);
  const [secondsLeft, setSecondsLeft] = useState((sessionData?.workMins ?? 25) * 60);
  const [sessionCount, setSessionCount] = useState(sessionData?.sessionCount ?? 0);
  const [currentTaskIdx, setCurrentTaskIdx] = useState(0);
  const intervalRef = useRef(null);

  // Persist session data
  useEffect(() => {
    const data = { date: today, workMins, breakMins, sessionCount };
    localStorage.setItem(POMO_SESSION_KEY, JSON.stringify(data));
  }, [today, workMins, breakMins, sessionCount]);

  // Timer interval
  useEffect(() => {
    if (timerState === RUNNING || timerState === BREAK) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            if (timerState === RUNNING) {
              setSessionCount((c) => c + 1);
              setTimerState(BREAK);
              return breakMins * 60;
            } else {
              setTimerState(IDLE);
              return workMins * 60;
            }
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [timerState, workMins, breakMins]);

  const handleStart = () => {
    const next = pomodoroTransition(timerState, 'start');
    setTimerState(next);
  };

  const handlePause = () => {
    const next = pomodoroTransition(timerState, 'pause');
    setTimerState(next);
  };

  const handleReset = () => {
    clearInterval(intervalRef.current);
    setTimerState(IDLE);
    setSecondsLeft(workMins * 60);
  };

  const mins = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
  const secs = (secondsLeft % 60).toString().padStart(2, '0');
  const isBreak = timerState === BREAK;
  const currentTask = todayTasks[currentTaskIdx];

  return (
    <div className="space-y-4">
      {/* Timer display */}
      <div className="text-center">
        <div className={`text-6xl font-mono font-bold tabular-nums ${isBreak ? 'text-green-400' : timerState === RUNNING ? 'text-amber-400' : 'text-[#e4e4e7]'}`}>
          {mins}:{secs}
        </div>
        <p className="text-[#71717a] text-sm mt-1">
          {isBreak ? '☕ Break time' : timerState === PAUSED ? '⏸ Paused' : timerState === RUNNING ? '🔥 Focus' : '⏱ Ready'}
        </p>
        {sessionCount > 0 && (
          <p className="text-[#52525b] text-xs mt-1">🍅 {sessionCount} session{sessionCount !== 1 ? 's' : ''} today</p>
        )}
      </div>

      {/* Current task */}
      {currentTask && (
        <div className="bg-[#0a0a0b] border border-[#27272a] rounded-lg px-4 py-2.5 text-sm">
          <p className="text-[#52525b] text-xs mb-0.5">Current task</p>
          <p className="text-[#e4e4e7] font-medium">{currentTask.title}</p>
          {todayTasks.length > 1 && (
            <div className="flex gap-2 mt-1">
              <button
                type="button"
                onClick={() => setCurrentTaskIdx((i) => Math.max(0, i - 1))}
                disabled={currentTaskIdx === 0}
                className="text-[#52525b] hover:text-[#a1a1aa] text-xs disabled:opacity-30"
              >
                ← prev
              </button>
              <span className="text-[#3f3f46] text-xs">{currentTaskIdx + 1}/{todayTasks.length}</span>
              <button
                type="button"
                onClick={() => setCurrentTaskIdx((i) => Math.min(todayTasks.length - 1, i + 1))}
                disabled={currentTaskIdx >= todayTasks.length - 1}
                className="text-[#52525b] hover:text-[#a1a1aa] text-xs disabled:opacity-30"
              >
                next →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2 justify-center">
        {timerState === IDLE && (
          <button
            type="button"
            onClick={handleStart}
            className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
          >
            ▶ Start
          </button>
        )}
        {timerState === RUNNING && (
          <button
            type="button"
            onClick={handlePause}
            className="bg-[#27272a] hover:bg-[#3f3f46] text-[#e4e4e7] font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
          >
            ⏸ Pause
          </button>
        )}
        {timerState === PAUSED && (
          <button
            type="button"
            onClick={handleStart}
            className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
          >
            ▶ Resume
          </button>
        )}
        {timerState === BREAK && (
          <button
            type="button"
            onClick={handleReset}
            className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
          >
            Skip break
          </button>
        )}
        {timerState !== IDLE && (
          <button
            type="button"
            onClick={handleReset}
            className="border border-[#27272a] text-[#71717a] hover:text-[#e4e4e7] px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Duration settings */}
      <div className="flex gap-4 text-xs text-[#71717a]">
        <label className="flex items-center gap-2">
          Work:
          <input
            type="number"
            min="1"
            max="60"
            value={workMins}
            onChange={(e) => { const v = Number(e.target.value); setWorkMins(v); if (timerState === IDLE) setSecondsLeft(v * 60); }}
            className="w-12 bg-[#0a0a0b] border border-[#27272a] rounded px-2 py-1 text-[#e4e4e7] focus:outline-none focus:border-[#f59e0b]"
          />
          min
        </label>
        <label className="flex items-center gap-2">
          Break:
          <input
            type="number"
            min="1"
            max="30"
            value={breakMins}
            onChange={(e) => setBreakMins(Number(e.target.value))}
            className="w-12 bg-[#0a0a0b] border border-[#27272a] rounded px-2 py-1 text-[#e4e4e7] focus:outline-none focus:border-[#f59e0b]"
          />
          min
        </label>
      </div>
    </div>
  );
}

// ── Habit Tracker ─────────────────────────────────────────────────────────

function HabitTracker() {
  const [habits, setHabits] = useIDB('habits', []);
  const { generate, loading: aiLoading, hasKey } = useGemini();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', frequency: 'daily', color: '#f59e0b' });
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [goalsInput, setGoalsInput] = useState('');
  const [showGoalsInput, setShowGoalsInput] = useState(false);
  const today = getTodayStr();
  const last7 = getLast7Days();

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setHabits((prev) => [...(prev || []), createHabit(form)]);
    setForm({ name: '', frequency: 'daily', color: '#f59e0b' });
    setShowAdd(false);
  };

  const handleToggle = (habitId) => {
    setHabits((prev) =>
      (prev || []).map((h) => h.id === habitId ? toggleHabitCompletion(h, today) : h)
    );
  };

  const handleDelete = (id) => {
    setHabits((prev) => (prev || []).filter((h) => h.id !== id));
  };

  const handleSuggest = async () => {
    if (!goalsInput.trim()) return;
    setAiResult(null);
    setAiError(null);
    try {
      const text = await generate(`My goals: ${goalsInput}. Suggest 3 specific daily habits that would help me achieve these goals. For each habit: name, why it matters, and a tip to build the habit. Be practical and concise.`);
      setAiResult(text);
    } catch (err) {
      setAiError(err.message);
    }
  };

  const inputCls = 'bg-[#0a0a0b] border border-[#27272a] rounded-lg px-3 py-2 text-[#e4e4e7] text-sm placeholder-[#52525b] focus:outline-none focus:border-[#f59e0b] w-full';

  return (
    <div className="space-y-4">
      {/* Habit list */}
      {(!habits || habits.length === 0) ? (
        <p className="text-[#71717a] text-sm">No habits yet. Add one to start tracking.</p>
      ) : (
        <div className="space-y-3">
          {habits.map((habit) => {
            const completions = habit.completions || [];
            const streak = calculateStreak(completions);
            const doneToday = completions.includes(today);
            return (
              <div key={habit.id} className="bg-[#0a0a0b] border border-[#27272a] rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggle(habit.id)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${doneToday ? 'bg-opacity-100 border-opacity-100' : 'bg-transparent border-[#3f3f46]'}`}
                      style={doneToday ? { backgroundColor: habit.color, borderColor: habit.color } : {}}
                      aria-label={doneToday ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {doneToday && <span className="text-white text-xs">✓</span>}
                    </button>
                    <div>
                      <p className={`text-sm font-medium ${doneToday ? 'text-[#71717a] line-through' : 'text-[#e4e4e7]'}`}>{habit.name}</p>
                      <p className="text-[#52525b] text-xs">{habit.frequency} · 🔥 {streak} day streak</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(habit.id)}
                    className="text-[#3f3f46] hover:text-red-400 text-xs transition-colors"
                  >
                    ✕
                  </button>
                </div>
                {/* 7-day grid */}
                <div className="flex gap-1 mt-2">
                  {last7.map((day) => {
                    const done = completions.includes(day);
                    const isToday = day === today;
                    return (
                      <div
                        key={day}
                        title={day}
                        className={`flex-1 h-2 rounded-sm ${done ? 'opacity-100' : 'opacity-20'} ${isToday ? 'ring-1 ring-white/20' : ''}`}
                        style={{ backgroundColor: done ? habit.color : '#3f3f46' }}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add habit form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="bg-[#0a0a0b] border border-[#27272a] rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-[#71717a] text-xs block mb-1">Habit name *</label>
              <input className={inputCls} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Exercise, Read, Meditate…" required />
            </div>
            <div>
              <label className="text-[#71717a] text-xs block mb-1">Frequency</label>
              <select className={inputCls} value={form.frequency} onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div>
              <label className="text-[#71717a] text-xs block mb-1">Color</label>
              <div className="flex gap-2 flex-wrap mt-1">
                {['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#ec4899'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, color: c }))}
                    className={`w-6 h-6 rounded-full transition-all ${form.color === c ? 'ring-2 ring-white scale-110' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-3 py-1.5 rounded-lg text-sm">Add Habit</button>
            <button type="button" onClick={() => setShowAdd(false)} className="border border-[#27272a] text-[#71717a] hover:text-[#e4e4e7] px-3 py-1.5 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      )}

      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setShowAdd((s) => !s)}
          className="border border-[#27272a] text-[#71717a] hover:text-[#e4e4e7] px-3 py-1.5 rounded-lg text-sm transition-colors"
        >
          + Add habit
        </button>
        {hasKey && (
          <button
            type="button"
            onClick={() => setShowGoalsInput((s) => !s)}
            className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            ✨ Suggest habits
          </button>
        )}
      </div>

      {showGoalsInput && (
        <div className="space-y-2">
          <input
            type="text"
            value={goalsInput}
            onChange={(e) => setGoalsInput(e.target.value)}
            placeholder="What are your main goals? (e.g. get fit, read more, learn coding)"
            className="w-full bg-[#0a0a0b] border border-[#27272a] rounded-lg px-3 py-2 text-[#e4e4e7] text-sm placeholder-[#52525b] focus:outline-none focus:border-[#f59e0b]"
          />
          <button
            type="button"
            onClick={handleSuggest}
            disabled={aiLoading || !goalsInput.trim()}
            className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {aiLoading ? '⏳ Thinking…' : '✨ Suggest for me'}
          </button>
        </div>
      )}

      {aiError && <p className="text-red-400 text-xs">❌ {aiError}</p>}
      {aiResult && <AiResultCard title="Habit Suggestions" content={aiResult} onDismiss={() => setAiResult(null)} />}
    </div>
  );
}

// ── Quick Notes ───────────────────────────────────────────────────────────

function QuickNotes({ onAddTasks }) {
  const [notes, setNotes] = useIDB('quick-notes', '');
  const { generate, loading: aiLoading, hasKey } = useGemini();
  const [aiResult, setAiResult] = useState(null);
  const [aiResultTitle, setAiResultTitle] = useState('');
  const [aiError, setAiError] = useState(null);

  const parsed = parseMarkdownish(notes || '');

  const handleSummarize = async () => {
    if (!notes?.trim()) return;
    setAiResult(null);
    setAiError(null);
    setAiResultTitle('Summary');
    try {
      const text = await generate(`Summarize these notes into 3-5 key points:\n\n${notes}`);
      setAiResult(text);
    } catch (err) {
      setAiError(err.message);
    }
  };

  const handleCreateTasks = async () => {
    if (!notes?.trim()) return;
    setAiResult(null);
    setAiError(null);
    setAiResultTitle('Action Items');
    try {
      const text = await generate(`Extract all action items and tasks from these notes. Format as a simple numbered list, one per line:\n\n${notes}`);
      setAiResult(text);
    } catch (err) {
      setAiError(err.message);
    }
  };

  return (
    <div className="space-y-3">
      <textarea
        value={notes || ''}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Start writing… (auto-saved)"
        rows={8}
        className="w-full bg-[#0a0a0b] border border-[#27272a] rounded-lg px-4 py-3 text-[#e4e4e7] text-sm placeholder-[#52525b] focus:outline-none focus:border-[#f59e0b] resize-none font-mono"
      />

      {/* Markdown-ish preview */}
      {notes && notes.trim() && (
        <div className="bg-[#0a0a0b] border border-[#27272a] rounded-lg px-4 py-3 text-sm space-y-1 max-h-32 overflow-y-auto">
          <p className="text-[#3f3f46] text-xs mb-2">Preview</p>
          {parsed.map((line, i) => (
            line.type === 'bullet' ? (
              <div key={i} className="flex gap-2">
                <span className="text-[#52525b] shrink-0">•</span>
                <span className="text-[#a1a1aa]" dangerouslySetInnerHTML={{ __html: line.content.replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#e4e4e7]">$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>') }} />
              </div>
            ) : (
              <p key={i} className="text-[#a1a1aa]" dangerouslySetInnerHTML={{ __html: line.content.replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#e4e4e7]">$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>') }} />
            )
          ))}
        </div>
      )}

      {hasKey && (
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleSummarize}
            disabled={aiLoading || !notes?.trim()}
            className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {aiLoading ? '⏳…' : '✨ Summarize'}
          </button>
          <button
            type="button"
            onClick={handleCreateTasks}
            disabled={aiLoading || !notes?.trim()}
            className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {aiLoading ? '⏳…' : '✨ Create tasks from notes'}
          </button>
        </div>
      )}

      {aiError && <p className="text-red-400 text-xs">❌ {aiError}</p>}
      {aiResult && <AiResultCard title={aiResultTitle} content={aiResult} onDismiss={() => setAiResult(null)} />}
    </div>
  );
}

// ── FocusTab ──────────────────────────────────────────────────────────────

export function FocusTab() {
  return (
    <div className="space-y-4">
      <CollapsibleCard title="🍅 Pomodoro Timer">
        <PomodoroTimer />
      </CollapsibleCard>
      <CollapsibleCard title="✅ Habit Tracker">
        <HabitTracker />
      </CollapsibleCard>
      <CollapsibleCard title="📓 Quick Notes">
        <QuickNotes />
      </CollapsibleCard>
    </div>
  );
}
