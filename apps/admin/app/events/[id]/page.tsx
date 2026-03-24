'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { adminApi } from '../../../src/lib/api';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [updating, setUpdating] = useState(false);

  const handleStatusChange = async (status: string) => {
    if (!confirm(`Change event status to ${status}?`)) return;
    setUpdating(true);
    try {
      await adminApi.updateEvent(id, { status });
      router.push('/events');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Event Detail</h1>
      <p className="text-gray-500 font-mono text-sm mb-8">{id}</p>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Event Info</h2>
        <p className="text-gray-500">
          Full event details (name, venue, dates, participant list, encounter stats)
          would be populated from the admin events API.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Participants</h2>
        <p className="text-gray-500">
          List of users with active sessions at this event would be displayed here.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => handleStatusChange('ACTIVE')}
          disabled={updating}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
        >
          Activate
        </button>
        <button
          onClick={() => handleStatusChange('ENDED')}
          disabled={updating}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
        >
          End Event
        </button>
        <button
          onClick={() => handleStatusChange('CANCELLED')}
          disabled={updating}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
        >
          Cancel Event
        </button>
      </div>
    </div>
  );
}
