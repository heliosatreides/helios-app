import { useState, useMemo } from 'react';
import { useTasks, getTodayStr } from '../../hooks/useTasks';
import { useTodaySchedule } from '../../hooks/useTodaySchedule';
import { getCalendarGrid, navigateMonth, formatMonthYear, getDaysInMonth } from './calendarUtils';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function DayPanel({ dateStr, onClose }) {
  const { tasks } = useTasks();
  const { schedule } = useTodaySchedule(dateStr);

  const dayTasks = tasks.filter((t) => t.dueDate === dateStr);

  return (
    <div className="bg-background border border-border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-foreground font-semibold text-sm">{dateStr}</h4>
        <button onClick={onClose} className="text-muted-foreground/80 hover:text-foreground text-sm">✕</button>
      </div>

      {/* Tasks */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 mb-2">Tasks</p>
        {dayTasks.length === 0 ? (
          <p className="text-muted-foreground/60 text-xs">No tasks</p>
        ) : (
          <div className="space-y-1">
            {dayTasks.map((t) => (
              <div key={t.id} className="flex items-center gap-2 text-xs">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.completed ? 'bg-[#3f3f46]' : t.priority === 'High' ? 'bg-red-400' : t.priority === 'Medium' ? 'bg-amber-400' : 'bg-zinc-400'}`} />
                <span className={t.completed ? 'line-through text-muted-foreground/80' : 'text-muted-foreground'}>{t.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 mb-2">Schedule</p>
        {schedule.length === 0 ? (
          <p className="text-muted-foreground/60 text-xs">No events</p>
        ) : (
          <div className="space-y-1">
            {schedule.map((e) => (
              <div key={e.id} className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground/80 w-12 shrink-0">{e.slotTime}</span>
                <span className="text-muted-foreground">{e.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function CalendarTab() {
  const today = getTodayStr();
  const todayDate = new Date(today + 'T00:00:00');

  const [viewYear, setViewYear] = useState(todayDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(todayDate.getMonth());
  const [selectedDay, setSelectedDay] = useState(null);

  const { tasks } = useTasks();

  const grid = useMemo(() => getCalendarGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  // Build a set of dates that have tasks
  const taskDates = useMemo(() => {
    const set = new Set();
    for (const t of tasks) {
      if (t.dueDate) set.add(t.dueDate);
    }
    return set;
  }, [tasks]);

  const handleNav = (dir) => {
    const { year, month } = navigateMonth(viewYear, viewMonth, dir);
    setViewYear(year);
    setViewMonth(month);
  };

  const handleDayClick = (dateStr) => {
    setSelectedDay(selectedDay === dateStr ? null : dateStr);
  };

  const handleToday = () => {
    setViewYear(todayDate.getFullYear());
    setViewMonth(todayDate.getMonth());
    setSelectedDay(today);
  };

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => handleNav(-1)}
          className="text-muted-foreground hover:text-foreground px-2 py-1 hover:bg-secondary transition-colors"
        >
          ←
        </button>
        <div className="flex items-center gap-3">
          <h3 className="text-foreground font-semibold">{formatMonthYear(viewYear, viewMonth)}</h3>
          <button
            onClick={handleToday}
            className="text-xs px-2 py-1 bg-secondary hover:bg-secondary/80 text-muted-foreground transition-colors"
          >
            Today
          </button>
        </div>
        <button
          onClick={() => handleNav(1)}
          className="text-muted-foreground hover:text-foreground px-2 py-1 hover:bg-secondary transition-colors"
        >
          →
        </button>
      </div>

      {/* Day of week headers */}
      <div className="grid grid-cols-7 gap-1">
        {DAYS_OF_WEEK.map((d) => (
          <div key={d} className="text-center text-muted-foreground/80 text-xs font-medium py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1">
        {grid.map((cell, idx) => {
          if (!cell.day) {
            return <div key={`empty-${idx}`} className="aspect-square" />;
          }

          const isToday = cell.dateStr === today;
          const isSelected = cell.dateStr === selectedDay;
          const hasTasks = taskDates.has(cell.dateStr);

          return (
            <button
              key={cell.dateStr}
              onClick={() => handleDayClick(cell.dateStr)}
              className={`aspect-square flex flex-col items-center justify-center text-sm relative transition-colors ${
                isSelected
                  ? 'bg-foreground text-background font-bold'
                  : isToday
                  ? 'bg-amber-500/20 text-amber-400 font-semibold ring-2 ring-amber-400 ring-offset-1 ring-offset-[#09090b]'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              {cell.day}
              {hasTasks && !isSelected && (
                <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isToday ? 'bg-amber-400' : 'bg-muted-foreground/40'}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Day detail panel */}
      {selectedDay && (
        <DayPanel dateStr={selectedDay} onClose={() => setSelectedDay(null)} />
      )}
    </div>
  );
}
