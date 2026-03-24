'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '../../../src/lib/api';

export default function CreateEventPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    description: '',
    venueName: '',
    latitude: '',
    longitude: '',
    startsAt: '',
    endsAt: '',
    maxParticipants: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const update = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      await adminApi.createEvent({
        name: form.name,
        description: form.description || undefined,
        venueName: form.venueName,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
        maxParticipants: form.maxParticipants ? parseInt(form.maxParticipants) : undefined,
      });
      router.push('/events');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Create Event</h1>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Event Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none resize-none"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Venue Name</label>
            <input
              type="text"
              value={form.venueName}
              onChange={(e) => update('venueName', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
              <input
                type="number"
                step="any"
                value={form.latitude}
                onChange={(e) => update('latitude', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
              <input
                type="number"
                step="any"
                value={form.longitude}
                onChange={(e) => update('longitude', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Starts At</label>
              <input
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => update('startsAt', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ends At</label>
              <input
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) => update('endsAt', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Max Participants (optional)</label>
            <input
              type="number"
              value={form.maxParticipants}
              onChange={(e) => update('maxParticipants', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
              min="1"
            />
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create Event'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/events')}
            className="px-8 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
