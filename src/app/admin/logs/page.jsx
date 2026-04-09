"use client";

import { useEffect, useState } from "react";

export default function ApiLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/api-logs?limit=300");
      const data = await res.json();
      if (data.success) {
        setLogs(data.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">API Logs</h1>
          <p className="text-sm text-slate-500">Track success and failed API calls</p>
        </div>
        <button
          type="button"
          onClick={loadLogs}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Refresh
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-6 text-sm text-slate-600">Loading logs...</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-4 py-3 text-left">Time</th>
                <th className="px-4 py-3 text-left">Method</th>
                <th className="px-4 py-3 text-left">Path</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Result</th>
                <th className="px-4 py-3 text-left">Duration</th>
                <th className="px-4 py-3 text-left">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log._id}>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-700">{log.method}</td>
                  <td className="px-4 py-3 text-slate-700">{log.path}</td>
                  <td className="px-4 py-3 font-semibold">{log.status}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        log.success
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {log.success ? "Success" : "Failed"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{log.durationMs || 0} ms</td>
                  <td className="px-4 py-3 text-xs text-rose-600">{log.errorMessage || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
