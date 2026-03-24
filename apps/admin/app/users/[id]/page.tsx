'use client';

import { useParams } from 'next/navigation';
import { adminApi } from '../../../src/lib/api';
import { useState } from 'react';

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [banning, setBanning] = useState(false);
  const [banned, setBanned] = useState(false);

  const handleBan = async () => {
    if (!confirm('Are you sure you want to ban this user?')) return;
    setBanning(true);
    try {
      await adminApi.banUser(id);
      setBanned(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBanning(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">User Detail</h1>
      <p className="text-gray-500 font-mono text-sm mb-8">{id}</p>

      {banned && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6 font-medium">
          User has been banned.
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Profile</h2>
        <p className="text-gray-500">
          Full profile view would be populated from a dedicated admin user detail endpoint.
          This includes profile data, photos, encounter history, reports filed/received, and subscription status.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Reports</h2>
        <p className="text-gray-500">Reports involving this user would be listed here.</p>
      </div>

      <div className="flex gap-4">
        {!banned && (
          <button
            onClick={handleBan}
            disabled={banning}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
          >
            {banning ? 'Banning...' : 'Ban User'}
          </button>
        )}
      </div>
    </div>
  );
}
