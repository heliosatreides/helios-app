import { useState, useEffect, useRef } from 'react';
import { useIDB } from '../../hooks/useIDB';
import { PageHeader } from '../../components/ui';
import {
  DEFAULT_CITIES,
  ALL_CITIES,
  getUtcOffset,
  isBusinessHours,
  formatTimeInZone,
  formatDateInZone,
} from './worldClockUtils';

// ── Clock card ─────────────────────────────────────────────────────────────

function ClockCard({ city, now, onRemove }) {
  const time = formatTimeInZone(city.timezone, now);
  const date = formatDateInZone(city.timezone, now);
  const offset = getUtcOffset(city.timezone, now);
  const business = isBusinessHours(city.timezone, now);

  return (
    <div className="bg-background border border-border p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${business ? 'bg-green-500' : 'bg-zinc-600'}`}
              title={business ? 'Business hours' : 'Outside business hours'}
            />
            <h3 className="text-foreground font-semibold text-sm">{city.name}</h3>
          </div>
          <p className="text-muted-foreground/80 text-xs mt-0.5 pl-4">{offset}</p>
        </div>
        <button
          type="button"
          onClick={() => onRemove(city.id)}
          className="text-muted-foreground/60 hover:text-red-400 text-xs transition-colors"
          aria-label={`Remove ${city.name}`}
        >
          ×
        </button>
      </div>
      <div className="pl-4">
        <p className="text-amber-400 text-2xl font-mono font-bold">{time}</p>
        <p className="text-muted-foreground text-xs mt-0.5">{date}</p>
      </div>
    </div>
  );
}

// ── Meeting planner ────────────────────────────────────────────────────────

function MeetingPlanner({ cities, now }) {
  const [localTime, setLocalTime] = useState(() => {
    const d = new Date(now);
    d.setSeconds(0, 0);
    return d.toISOString().slice(0, 16);
  });

  const meetingDate = localTime ? new Date(localTime) : null;

  return (
    <div className="bg-background border border-border p-4">
      <h3 className="text-foreground font-semibold text-sm mb-3">🗓️ Meeting Planner</h3>
      <div className="mb-4">
        <label className="text-muted-foreground text-xs block mb-1">Pick a time (your local)</label>
        <input
          type="datetime-local"
          value={localTime}
          onChange={(e) => setLocalTime(e.target.value)}
          className="bg-background border border-border px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
      {meetingDate && (
        <div className="space-y-2">
          {cities.map((city) => (
            <div key={city.id} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
              <span className="text-muted-foreground text-sm">{city.name}</span>
              <span className="text-amber-400 font-mono text-sm">
                {formatTimeInZone(city.timezone, meetingDate)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

export function WorldClockPage({ embedded } = {}) {
  const [savedCities, setSavedCities] = useIDB('world-clocks', DEFAULT_CITIES);
  const [now, setNow] = useState(new Date());
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const cities = savedCities || DEFAULT_CITIES;

  const addCity = (city) => {
    if (cities.find((c) => c.id === city.id)) return;
    setSavedCities([...cities, city]);
    setSearch('');
    setShowSearch(false);
  };

  const removeCity = (id) => {
    setSavedCities(cities.filter((c) => c.id !== id));
  };

  const filteredSearch = search.trim()
    ? ALL_CITIES.filter(
        (c) =>
          !cities.find((saved) => saved.id === c.id) &&
          c.name.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  return (
    <div className="space-y-5">
      {!embedded ? (
        <PageHeader title="World Clock" subtitle="Live time across time zones">
          <button
            type="button"
            onClick={() => setShowSearch((s) => !s)}
            className="bg-foreground hover:bg-foreground/90 text-background font-medium px-3 py-1.5 text-sm transition-colors"
          >
            + Add city
          </button>
        </PageHeader>
      ) : (
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setShowSearch((s) => !s)}
            className="bg-foreground hover:bg-foreground/90 text-background font-medium px-3 py-1.5 text-sm transition-colors"
          >
            + Add city
          </button>
        </div>
      )}

      {/* City search */}
      {showSearch && (
        <div className="bg-background border border-border p-3 space-y-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cities…"
            autoFocus
            className="w-full bg-background border border-border px-3 py-2 text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {filteredSearch.length > 0 && (
            <div className="max-h-40 overflow-y-auto space-y-0.5">
              {filteredSearch.map((city) => (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => addCity(city)}
                  className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  {city.name} <span className="text-muted-foreground/80 text-xs">({city.timezone})</span>
                </button>
              ))}
            </div>
          )}
          {search.trim() && filteredSearch.length === 0 && (
            <p className="text-muted-foreground/80 text-xs px-3">No cities found</p>
          )}
        </div>
      )}

      {/* Clock grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {cities.map((city) => (
          <ClockCard key={city.id} city={city} now={now} onRemove={removeCity} />
        ))}
      </div>

      {cities.length === 0 && (
        <p className="text-muted-foreground/80 text-sm text-center py-8">No cities added. Click "+ Add city" to start.</p>
      )}

      {/* Meeting planner */}
      {cities.length > 0 && (
        <MeetingPlanner cities={cities} now={now} />
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground/80">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          Business hours (9am–5pm)
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-zinc-600" />
          Outside business hours
        </div>
      </div>
    </div>
  );
}
