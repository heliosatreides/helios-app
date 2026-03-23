import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function CreateTrip({ onSubmit }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    destination: '',
    startDate: '',
    endDate: '',
    budget: '',
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trip = {
      ...form,
      budget: parseFloat(form.budget),
    };
    if (onSubmit) onSubmit(trip);
    navigate('/trips');
  };

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-xl font-semibold text-[#e4e4e7] mb-6">New Trip</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-[#a1a1aa] mb-1">
            Trip Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={form.name}
            onChange={handleChange}
            placeholder="Summer in Japan"
            className="w-full bg-[#111113] border border-[#27272a] rounded-lg px-4 py-2.5 text-[#e4e4e7] placeholder-[#52525b] focus:outline-none focus:border-[#f59e0b] transition-colors"
          />
        </div>

        <div>
          <label htmlFor="destination" className="block text-sm font-medium text-[#a1a1aa] mb-1">
            Destination
          </label>
          <input
            id="destination"
            name="destination"
            type="text"
            required
            value={form.destination}
            onChange={handleChange}
            placeholder="Tokyo, Japan"
            className="w-full bg-[#111113] border border-[#27272a] rounded-lg px-4 py-2.5 text-[#e4e4e7] placeholder-[#52525b] focus:outline-none focus:border-[#f59e0b] transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-[#a1a1aa] mb-1">
              Start Date
            </label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              required
              value={form.startDate}
              onChange={handleChange}
              className="w-full bg-[#111113] border border-[#27272a] rounded-lg px-4 py-2.5 text-[#e4e4e7] focus:outline-none focus:border-[#f59e0b] transition-colors"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-[#a1a1aa] mb-1">
              End Date
            </label>
            <input
              id="endDate"
              name="endDate"
              type="date"
              required
              value={form.endDate}
              onChange={handleChange}
              className="w-full bg-[#111113] border border-[#27272a] rounded-lg px-4 py-2.5 text-[#e4e4e7] focus:outline-none focus:border-[#f59e0b] transition-colors"
            />
          </div>
        </div>

        <div>
          <label htmlFor="budget" className="block text-sm font-medium text-[#a1a1aa] mb-1">
            Budget ($)
          </label>
          <input
            id="budget"
            name="budget"
            type="number"
            required
            min="0"
            step="0.01"
            value={form.budget}
            onChange={handleChange}
            placeholder="5000"
            className="w-full bg-[#111113] border border-[#27272a] rounded-lg px-4 py-2.5 text-[#e4e4e7] placeholder-[#52525b] focus:outline-none focus:border-[#f59e0b] transition-colors"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="flex-1 bg-[#f59e0b] hover:bg-[#d97706] text-black font-semibold py-2.5 rounded-lg transition-colors"
          >
            Create Trip
          </button>
          <button
            type="button"
            onClick={() => navigate('/trips')}
            className="flex-1 bg-[#111113] border border-[#27272a] hover:border-[#52525b] text-[#a1a1aa] font-medium py-2.5 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
