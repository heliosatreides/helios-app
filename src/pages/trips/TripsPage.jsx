import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { TripList } from './TripList';
import { CreateTrip } from './CreateTrip';
import { TripDetail } from './TripDetail';
import { useIDB } from '../../hooks/useIDB';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function TripsPage() {
  const [trips, setTrips] = useIDB('helios-trips', []);
  const navigate = useNavigate();

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

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#e4e4e7]">Trips</h2>
              <Link
                to="/trips/new"
                className="bg-[#f59e0b] hover:bg-[#d97706] text-black font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                + New Trip
              </Link>
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
