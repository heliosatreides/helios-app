import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { TripList } from './TripList';
import { CreateTrip } from './CreateTrip';
import { TripDetail } from './TripDetail';
import { useIDB } from '../../hooks/useIDB';
import { ImportButton } from '../../components/ImportButton';
import { mergeById, csvRowToTrip } from '../../utils/importData';
import { useToast } from '../../components/Toast';
import { ActionButton, PageHeader } from '../../components/ui';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function TripsPage() {
  const [trips, setTrips] = useIDB('helios-trips', []);
  const navigate = useNavigate();
  const toast = useToast();

  const handleCreate = (tripData) => {
    const newTrip = {
      ...tripData,
      id: generateId(),
      status: 'Planning',
      itinerary: [],
      expenses: [],
      notes: '',
    };
    setTrips((prev) => [newTrip, ...prev]);
    navigate('/trips');
  };

  const handleUpdate = (updatedTrip) => {
    setTrips((prev) => prev.map((t) => (t.id === updatedTrip.id ? updatedTrip : t)));
  };

  const handleImportJSON = (data) => {
    // Accept full helios export ({ trips: [...] }) or a trips-only array
    const incoming = Array.isArray(data) ? data : (data.trips || []);
    setTrips((prev) => {
      const { merged, imported, skipped } = mergeById(prev, incoming);
      toast.success(`Imported ${imported} trip${imported !== 1 ? 's' : ''} (${skipped} skipped as duplicates)`);
      return merged;
    });
  };

  const handleImportCSV = (rows) => {
    const incoming = rows.map(csvRowToTrip);
    setTrips((prev) => {
      const { merged, imported, skipped } = mergeById(prev, incoming);
      toast.success(`Imported ${imported} trip${imported !== 1 ? 's' : ''} (${skipped} skipped as duplicates)`);
      return merged;
    });
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="space-y-6">
            <PageHeader title="Trips" subtitle="Plan and track your adventures">
              <ActionButton variant="primary" onClick={() => navigate('/trips/new')}>
                + New Trip
              </ActionButton>
            </PageHeader>

            {/* Import buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
              <ImportButton
                mode="json"
                label="Import Trips (JSON)"
                onImport={handleImportJSON}
              />
              <ImportButton
                mode="csv"
                label="Import Trips (CSV)"
                onImport={handleImportCSV}
              />
            </div>

            <TripList trips={trips} />
          </div>
        }
      />
      <Route path="/new" element={<CreateTrip onSubmit={handleCreate} />} />
      <Route path="/:id" element={<TripDetail trips={trips} onUpdate={handleUpdate} />} />
    </Routes>
  );
}
