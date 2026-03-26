import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useIDB } from '../../hooks/useIDB';
import { TodayTab } from './TodayTab';
import { TasksTab } from './TasksTab';
import { CalendarTab } from './CalendarTab';
import { getTodayStr } from '../../hooks/useTasks';
import { PageHeader, TabBar } from '../../components/ui';

const TABS = ['Today', 'Tasks', 'Calendar'];

export function PlannerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab = TABS.includes(tabParam) ? tabParam : 'Today';
  const setActiveTab = useCallback((tab) => {
    setSearchParams(tab === 'Today' ? {} : { tab }, { replace: true });
  }, [setSearchParams]);
  const today = getTodayStr();
  const [trips] = useIDB('helios-trips', []);
  const [objectives] = useIDB('goals-objectives', []);

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
      <PageHeader title="Daily Planner" subtitle={today} />

      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'Today' && <TodayTab dateStr={today} tripActivities={todayTripActivities} />}
      {activeTab === 'Tasks' && <TasksTab objectives={objectives || []} />}
      {activeTab === 'Calendar' && <CalendarTab />}
    </div>
  );
}
