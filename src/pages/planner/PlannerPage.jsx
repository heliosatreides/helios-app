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
        if (act.date === today) activities.push({ ...act, tripName: trip.name });
      }
    }
    return activities;
  }, [trips, today]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Daily Planner</h1>
        <p className="text-muted-foreground text-sm">{today}</p>
      </div>

      <div className="flex gap-1 border border-border p-1 w-fit">
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
            }`}>
            {tab}
          </button>
        ))}
      </div>

      <div className="border border-border p-5">
        {activeTab === 'Today' && <TodayTab dateStr={today} tripActivities={todayTripActivities} />}
        {activeTab === 'Tasks' && <TasksTab />}
        {activeTab === 'Calendar' && <CalendarTab />}
      </div>
    </div>
  );
}
