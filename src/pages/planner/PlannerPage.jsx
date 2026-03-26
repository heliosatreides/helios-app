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

      <div className="border-0 md:border md:border-border p-3 md:p-5">
        {activeTab === 'Today' && <TodayTab dateStr={today} tripActivities={todayTripActivities} />}
        {activeTab === 'Tasks' && <TasksTab />}
        {activeTab === 'Calendar' && <CalendarTab />}
      </div>
    </div>
  );
}
