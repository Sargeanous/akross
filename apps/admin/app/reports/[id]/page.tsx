'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { adminApi } from '../../../src/lib/api';

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [resolution, setResolution] = useState('');
  const [updating, setUpdating] = useState(false);

  const handleAction = async (status: string) => {
    setUpdating(true);
    try {
      await adminApi.updateReport(id, {
        status,
        resolution: resolution.trim() || undefined,
      });
      router.push('/reports');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleBanReported = async () => {
    if (!confirm('Ban the reported user?')) return;
    try {
      // Would need the reported user ID from the report data
      // For now, show the pattern
      alert('Would ban the reported user. Requires fetching report details first.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Report Detail</h1>
      <p className="text-gray-500 font-mono text-sm mb-8">{id}</p>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Report Information</h2>
        <p className="text-gray-500">
          Full report details (reporter profile, reported profile, reason, description, screenshots)
          would be displayed here from the admin reports API.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Resolution</h2>
        <textarea
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
          placeholder="Add notes about your decision..."
          className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none resize-none"
          rows={3}
        />

        <div className="flex gap-3">
          <button
            onClick={() => handleAction('RESOLVED')}
            disabled={updating}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
          >
            Resolve
          </button>
          <button
            onClick={() => handleAction('DISMISSED')}
            disabled={updating}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium disabled:opacity-50"
          >
            Dismiss
          </button>
          <button
            onClick={handleBanReported}
            disabled={updating}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
          >
            Ban Reported User
          </button>
          <button
            onClick={() => handleAction('REVIEWING')}
            disabled={updating}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
          >
            Mark Reviewing
          </button>
        </div>
      </div>
    </div>
  );
}
