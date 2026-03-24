'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '../../src/lib/api';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  REVIEWING: 'bg-blue-100 text-blue-800',
  RESOLVED: 'bg-green-100 text-green-800',
  DISMISSED: 'bg-gray-100 text-gray-600',
};

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminApi
      .getReports(filter ? { status: filter } : undefined)
      .then(setReports)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Reports</h1>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['', 'PENDING', 'REVIEWING', 'RESOLVED', 'DISMISSED'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {status || 'All'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Reporter</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Reported</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Reason</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Status</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Date</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-400">Loading...</td>
              </tr>
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-400">No reports found.</td>
              </tr>
            ) : (
              reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-xs">{report.reporterId?.slice(0, 12)}...</td>
                  <td className="px-6 py-4 font-mono text-xs">{report.reportedId?.slice(0, 12)}...</td>
                  <td className="px-6 py-4 text-sm">{report.reason}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[report.status] ?? ''}`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/reports/${report.id}`}
                      className="text-primary hover:underline text-sm font-medium"
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
