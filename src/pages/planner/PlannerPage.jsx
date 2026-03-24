import { useState, useMemo } from 'react';
import { useIDB } from '../../hooks/useIDB';
import { TodayTab } from './TodayTab';
import { TasksTab } from './TasksTab';
import { CalendarTab } from './CalendarTab';
import { getTodayStr } from '../../hooks/useTasks';

const TABS = ['Today', 'Tasks', 'Calendar'];

export function PlannerPage() {
  const [activeTab, setActiveTab] = useState('Today');
  const today = getTodayStr();

  // Get trip activities for today (cross-app integration)
  const [trips] = useIDB('helios-trips', []);

  const todayTripActivities = useMemo(() => {
    if (!trips || trips.length === 0) return [];
    const activities = [];
    for (const trip of trips) {
      for (const act of trip.itinerary || []) {
        if (act.date === today) {
          activities.push({ ...act, tripName: trip.name });
        }
      }
    }
    return activities;
  }, [trips, today]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold text-[#e4e4e7]">Daily Planner 🗓️</h2>
        <p className="text-[#71717a] text-sm mt-1">{today}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0a0a0b] p-1 rounded-xl border border-[#27272a] w-fit">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-[#27272a] text-[#e4e4e7]'
                : 'text-[#71717a] hover:text-[#a1a1aa]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-[#111113] border border-[#27272a] rounded-xl p-5">
        {activeTab === 'Today' && (
          <TodayTab dateStr={today} tripActivities={todayTripActivities} />
        )}
        {activeTab === 'Tasks' && <TasksTab />}
        {activeTab === 'Calendar' && <CalendarTab />}
      </div>
    </div>
  );
}
