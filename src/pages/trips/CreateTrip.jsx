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
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    // Clear the specific field error on change
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Trip name is required.';
    if (!form.destination.trim()) errs.destination = 'Destination is required.';
    if (!form.startDate) errs.startDate = 'Start date is required.';
    if (!form.endDate) errs.endDate = 'End date is required.';
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      errs.endDate = 'End date must be on or after start date.';
    }
    if (form.budget !== '' && (isNaN(parseFloat(form.budget)) || parseFloat(form.budget) <= 0)) {
      errs.budget = 'Budget must be a positive number.';
    }
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    const trip = {
      ...form,
      budget: form.budget !== '' ? parseFloat(form.budget) : 0,
    };
    if (onSubmit) onSubmit(trip);
    navigate('/trips');
  };

  const inputClass = (field) =>
    `w-full bg-secondary border px-4 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none transition-colors ${
      errors[field]
        ? 'border-red-500 focus:border-red-400'
        : 'border-border focus:ring-1 focus:ring-ring'
    }`;

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-xl font-semibold text-foreground mb-6">New Trip</h2>
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-muted-foreground mb-1">
            Trip Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            placeholder="Summer in Japan"
            className={inputClass('name')}
          />
          {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="destination" className="block text-sm font-medium text-muted-foreground mb-1">
            Destination
          </label>
          <input
            id="destination"
            name="destination"
            type="text"
            value={form.destination}
            onChange={handleChange}
            placeholder="Tokyo, Japan"
            className={inputClass('destination')}
          />
          {errors.destination && <p className="mt-1 text-xs text-red-400">{errors.destination}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-muted-foreground mb-1">
              Start Date
            </label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              value={form.startDate}
              onChange={handleChange}
              className={inputClass('startDate')}
            />
            {errors.startDate && <p className="mt-1 text-xs text-red-400">{errors.startDate}</p>}
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-muted-foreground mb-1">
              End Date
            </label>
            <input
              id="endDate"
              name="endDate"
              type="date"
              value={form.endDate}
              onChange={handleChange}
              className={inputClass('endDate')}
            />
            {errors.endDate && <p className="mt-1 text-xs text-red-400">{errors.endDate}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="budget" className="block text-sm font-medium text-muted-foreground mb-1">
            Budget ($) <span className="text-muted-foreground/80">optional</span>
          </label>
          <input
            id="budget"
            name="budget"
            type="number"
            min="0"
            step="0.01"
            value={form.budget}
            onChange={handleChange}
            placeholder="5000"
            className={inputClass('budget')}
          />
          {errors.budget && <p className="mt-1 text-xs text-red-400">{errors.budget}</p>}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="flex-1 bg-foreground hover:bg-foreground/90 text-background font-semibold py-2.5 transition-colors"
          >
            Create Trip
          </button>
          <button
            type="button"
            onClick={() => navigate('/trips')}
            className="flex-1 bg-background border border-border hover:border-muted-foreground text-muted-foreground font-medium py-2.5 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
