"use client";

import { useEffect, useState } from "react";
import { UserCheck, UserX } from "lucide-react";

/**
 * Agent apne dashboard se khud lead lena on/off kar sakta hai.
 * OFF hone par auto-assignment (signup / meta leads / demo booking / chatbot)
 * is agent ko skip kar deta hai — login aur baaki panel normal chalta rahega.
 */
export default function LeadToggleCard() {
  const [leadsEnabled, setLeadsEnabled] = useState(null); // null = loading
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!token) return;

    fetch("/api/users/lead-status", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setLeadsEnabled(data.leadsEnabled !== false);
        else setError(data.message || "Status load nahi hua");
      })
      .catch(() => setError("Server error"));
  }, [token]);

  const toggle = async () => {
    const next = !leadsEnabled;

    if (
      !confirm(
        next
          ? "Aapko dobara naye leads milne lagenge. Continue?"
          : "Aapko naye leads milna band ho jayenge. Continue?"
      )
    )
      return;

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/users/lead-status", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ leadsEnabled: next }),
      });

      const data = await res.json();

      if (data.success) setLeadsEnabled(data.leadsEnabled !== false);
      else setError(data.message || "Update fail ho gaya");
    } catch {
      setError("Server error");
    } finally {
      setSaving(false);
    }
  };

  if (leadsEnabled === null && !error) {
    return (
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm">
        Lead status load ho raha hai...
      </div>
    );
  }

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className={`rounded-full p-2 ${
            leadsEnabled
              ? "bg-green-100 text-green-600"
              : "bg-red-100 text-red-600"
          }`}
        >
          {leadsEnabled ? <UserCheck size={20} /> : <UserX size={20} />}
        </div>

        <div>
          <p className="font-semibold text-slate-800">Lead Assignment</p>
          <p className="text-sm text-slate-500">
            {leadsEnabled
              ? "Aapko naye leads mil rahe hain."
              : "Naye leads band hain — aapko koi lead assign nahi hoga."}
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </div>

      <button
        onClick={toggle}
        disabled={saving}
        className={`rounded-lg px-5 py-2 text-sm font-medium text-white transition disabled:opacity-60 ${
          leadsEnabled
            ? "bg-red-600 hover:bg-red-700"
            : "bg-green-600 hover:bg-green-700"
        }`}
      >
        {saving
          ? "Saving..."
          : leadsEnabled
            ? "Disable Leads"
            : "Enable Leads"}
      </button>
    </div>
  );
}
