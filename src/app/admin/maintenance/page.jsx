"use client";

import { useEffect, useState } from "react";

export default function MaintenancePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    "We are performing scheduled maintenance. Please check back shortly.",
  );

  const loadStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/system-status");
      const data = await res.json();
      if (data.success) {
        setMaintenanceMode(!!data.maintenanceMode);
        setMaintenanceMessage(data.maintenanceMessage || "");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const saveStatus = async () => {
    setSaving(true);
    try {
      await fetch("/api/admin/system-status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maintenanceMode,
          maintenanceMessage,
          updatedBy: (localStorage.getItem("adminEmail") || localStorage.getItem("email")) || "admin",
        }),
      });
      await loadStatus();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl p-4 sm:p-6">
      <h1 className="text-3xl font-bold text-slate-900">Maintenance Control</h1>
      <p className="mt-1 text-sm text-slate-500">
        Enable this to show maintenance page on `limbu.ai`.
      </p>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {loading ? (
          <p className="text-slate-600">Loading system status...</p>
        ) : (
          <>
            <label className="flex items-center gap-3 text-sm font-semibold text-slate-800">
              <input
                type="checkbox"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Maintenance Mode Active
            </label>

            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-slate-700">Maintenance Message</p>
              <textarea
                rows={4}
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <button
              type="button"
              onClick={saveStatus}
              disabled={saving}
              className="mt-4 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
