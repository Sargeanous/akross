'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '../src/lib/api';

type Stats = {
  pendingReports: number;
  activeEvents: number;
  totalEvents: number;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ pendingReports: 0, activeEvents: 0, totalEvents: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [reports, events] = await Promise.all([
          adminApi.getReports({ status: 'PENDING' }),
          adminApi.getEvents(),
        ]);
        setStats({
          pendingReports: reports.length,
          activeEvents: events.filter((e: any) => e.status === 'ACTIVE').length,
          totalEvents: events.length,
        });
      } catch {
        // Not logged in or API error
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Pending Reports"
          value={loading ? '...' : String(stats.pendingReports)}
          color="red"
        />
        <StatCard
          title="Active Events"
          value={loading ? '...' : String(stats.activeEvents)}
          color="green"
        />
        <StatCard
          title="Total Events"
          value={loading ? '...' : String(stats.totalEvents)}
          color="blue"
        />
      </div>

      <div className="mt-8 bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="flex gap-4">
          <a href="/reports" className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium">
            Review Reports
          </a>
          <a href="/events/new" className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors font-medium">
            Create Event
          </a>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color }: { title: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    red: 'bg-red-50 text-red-700 border-red-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  return (
    <div className={`rounded-xl p-6 border ${colors[color]}`}>
      <p className="text-sm font-medium opacity-80">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}
