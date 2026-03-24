import { useIDB } from './useIDB';
import { useCallback } from 'react';

const SCHEDULE_KEY = 'planner-schedule';

/**
 * Returns schedule for a specific date (YYYY-MM-DD).
 * Schedule is stored as: { [date]: [event, ...] }
 *
 * Each event: { id, slotTime, title, duration, color }
 * slotTime: "HH:MM" (e.g. "09:00")
 * duration: 30 | 60 | 120 (minutes)
 * color: "amber" | "blue" | "green" | "red"
 */
export function useTodaySchedule(dateStr) {
  const [allSchedules, setAllSchedules] = useIDB(SCHEDULE_KEY, {});

  const scheduleForDate = (allSchedules || {})[dateStr] || [];

  const addEvent = useCallback(
    (event) => {
      const newEvent = {
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        slotTime: '',
        title: '',
        duration: 30,
        color: 'blue',
        readOnly: false,
        ...event,
      };
      setAllSchedules((prev) => {
        const prevSchedules = prev || {};
        return {
          ...prevSchedules,
          [dateStr]: [...(prevSchedules[dateStr] || []), newEvent],
        };
      });
      return newEvent;
    },
    [dateStr, setAllSchedules]
  );

  const updateEvent = useCallback(
    (eventId, updates) => {
      setAllSchedules((prev) => {
        const prevSchedules = prev || {};
        return {
          ...prevSchedules,
          [dateStr]: (prevSchedules[dateStr] || []).map((e) =>
            e.id === eventId ? { ...e, ...updates } : e
          ),
        };
      });
    },
    [dateStr, setAllSchedules]
  );

  const deleteEvent = useCallback(
    (eventId) => {
      setAllSchedules((prev) => {
        const prevSchedules = prev || {};
        return {
          ...prevSchedules,
          [dateStr]: (prevSchedules[dateStr] || []).filter((e) => e.id !== eventId),
        };
      });
    },
    [dateStr, setAllSchedules]
  );

  const setScheduleForDate = useCallback(
    (events) => {
      setAllSchedules((prev) => ({
        ...(prev || {}),
        [dateStr]: events,
      }));
    },
    [dateStr, setAllSchedules]
  );

  return {
    schedule: scheduleForDate,
    addEvent,
    updateEvent,
    deleteEvent,
    setScheduleForDate,
    allSchedules: allSchedules || {},
  };
}
