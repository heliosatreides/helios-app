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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#e4e4e7]">Daily Planner</h1>
          <p className="text-[#52525b] text-sm mt-0.5">{today}</p>
        </div>
      </div>

      {/* Segmented tabs */}
      <div className="flex gap-1 bg-[#0a0a0b] p-1 rounded-xl border border-[#1c1c20] w-fit">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'text-[#52525b] hover:text-[#a1a1aa] border border-transparent'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-[#0c0c0e] border border-[#1c1c20] rounded-2xl p-5">
        {activeTab === 'Today' && (
          <TodayTab dateStr={today} tripActivities={todayTripActivities} />
        )}
        {activeTab === 'Tasks' && <TasksTab />}
        {activeTab === 'Calendar' && <CalendarTab />}
      </div>
    </div>
  );
}
