'use client';

import Link from 'next/link';

export default function ModerationPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Moderation Tools</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/reports" className="block">
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Report Queue</h2>
            <p className="text-gray-500">
              Review and resolve user reports. Pending reports should be reviewed within 24 hours.
            </p>
            <span className="inline-block mt-4 text-primary font-medium text-sm">View Reports →</span>
          </div>
        </Link>

        <Link href="/users" className="block">
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">User Management</h2>
            <p className="text-gray-500">
              Search for users, view profiles, review history, and manage bans.
            </p>
            <span className="inline-block mt-4 text-primary font-medium text-sm">Manage Users →</span>
          </div>
        </Link>

        <Link href="/events" className="block">
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Event Management</h2>
            <p className="text-gray-500">
              Create events, manage status, and monitor active sessions and encounters.
            </p>
            <span className="inline-block mt-4 text-primary font-medium text-sm">Manage Events →</span>
          </div>
        </Link>

        <div className="bg-white rounded-xl border border-gray-200 p-6 opacity-60">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Photo Moderation</h2>
          <p className="text-gray-500">
            AI-assisted photo review for inappropriate content. Coming soon — currently stubbed.
          </p>
          <span className="inline-block mt-4 text-gray-400 font-medium text-sm">Coming Soon</span>
        </div>
      </div>

      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <h3 className="text-md font-semibold text-yellow-800 mb-2">Moderation Guidelines</h3>
        <ul className="text-yellow-700 text-sm space-y-2">
          <li>Review pending reports within 24 hours.</li>
          <li>Always add resolution notes when resolving or dismissing reports.</li>
          <li>Ban users only for serious or repeated violations.</li>
          <li>Banning deactivates all sessions, matches, and chat threads.</li>
          <li>Contact the user before banning when possible.</li>
        </ul>
      </div>
    </div>
  );
}
