import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { TripList } from './TripList';
import { CreateTrip } from './CreateTrip';
import { TripDetail } from './TripDetail';
import { useIDB } from '../../hooks/useIDB';
import { ImportButton } from '../../components/ImportButton';
import { mergeById, csvRowToTrip } from '../../utils/importData';
import { useToast } from '../../components/Toast';

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
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Trips</h2>
              <Link
                to="/trips/new"
                className="bg-foreground hover:bg-foreground/90 text-background font-semibold px-4 py-2 transition-colors"
              >
                + New Trip
              </Link>
            </div>

            {/* Import buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
              <ImportButton
                mode="json"
                label="📥 Import Trips (JSON)"
                onImport={handleImportJSON}
              />
              <ImportButton
                mode="csv"
                label="📥 Import Trips (CSV)"
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
