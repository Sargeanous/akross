'use client';

import { useState } from 'react';
import { adminApi } from '../../src/lib/api';

export default function UsersPage() {
  const [searchId, setSearchId] = useState('');
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState('');
  const [banning, setBanning] = useState(false);

  const handleSearch = async () => {
    setError('');
    setUser(null);
    if (!searchId.trim()) return;
    try {
      // Use the profile endpoint to look up user data
      // In a full admin build, you'd have a dedicated admin user search endpoint
      setUser({ id: searchId.trim(), note: 'Full user search requires a dedicated admin endpoint.' });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleBan = async (userId: string) => {
    if (!confirm('Are you sure you want to ban this user? This will deactivate their sessions, matches, and chats.')) return;
    setBanning(true);
    try {
      await adminApi.banUser(userId);
      setUser((u: any) => ({ ...u, isBanned: true }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBanning(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Users</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Search User</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="Enter user ID..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
          />
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
          >
            Search
          </button>
        </div>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </div>

      {user && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">User Detail</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">ID</span>
              <span className="font-mono text-sm">{user.id}</span>
            </div>
            {user.isBanned && (
              <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm font-medium">
                This user is banned.
              </div>
            )}
            <p className="text-gray-500 text-sm">{user.note}</p>
          </div>

          <div className="mt-6 flex gap-4">
            <a
              href={`/users/${user.id}`}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              View Full Profile
            </a>
            {!user.isBanned && (
              <button
                onClick={() => handleBan(user.id)}
                disabled={banning}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
              >
                {banning ? 'Banning...' : 'Ban User'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
