"use client";

// Website contact-form leads for the logged-in user (filtered by ownerUserId),
// shown in a table with inline status management: new → contacted → converted → spam.

import { useEffect, useMemo, useState, useCallback } from "react";
import toast from "react-hot-toast";
import {
  Inbox,
  RefreshCw,
  Search,
  Phone,
  Mail,
  Wrench,
  Building2,
  Clock,
  ChevronDown,
  X,
} from "lucide-react";

const STATUS_META = {
  new:       { label: "New",       chip: "bg-blue-50 text-blue-700 border-blue-200",   dot: "bg-blue-500" },
  contacted: { label: "Contacted", chip: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  converted: { label: "Converted", chip: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500" },
  spam:      { label: "Spam",      chip: "bg-red-50 text-red-700 border-red-200",       dot: "bg-red-500" },
};
const STATUS_KEYS = ["new", "contacted", "converted", "spam"];

function fmtDateTime(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

/* ── Status select (inline, table-friendly) ───────────────────── */
function StatusSelect({ value, busy, onChange }) {
  const meta = STATUS_META[value] || STATUS_META.new;
  return (
    <div className="relative inline-block">
      <select
        value={value}
        disabled={busy}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none cursor-pointer rounded-full border py-1 pl-3 pr-7 text-xs font-bold outline-none transition ${meta.chip} ${busy ? "opacity-60" : "hover:brightness-95"}`}
      >
        {STATUS_KEYS.map((k) => (
          <option key={k} value={k} className="bg-white text-slate-700">
            {STATUS_META[k].label}
          </option>
        ))}
      </select>
      {busy ? (
        <RefreshCw size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 animate-spin opacity-70" />
      ) : (
        <ChevronDown size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 opacity-70" />
      )}
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────── */
export default function WebsiteLeadsPage() {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    setUserId(typeof window !== "undefined" ? localStorage.getItem("userId") : null);
  }, []);

  const fetchLeads = useCallback(async () => {
    if (!userId) { setLoading(false); setError("User ID not found. Please log in again."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/website-leads?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to load leads");
      setLeads(Array.isArray(data.leads) ? data.leads : []);
    } catch (e) {
      setError(e.message || "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { if (userId !== null) fetchLeads(); }, [userId, fetchLeads]);

  const updateStatus = useCallback(async (lead, status) => {
    if (status === lead.status) return;
    const prev = lead.status;
    setSavingId(lead._id);
    setLeads((list) => list.map((l) => (l._id === lead._id ? { ...l, status } : l))); // optimistic
    try {
      const res = await fetch("/api/website-leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lead._id, userId, status }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Update failed");
      toast.success(`Marked as ${STATUS_META[status]?.label || status}`);
    } catch (e) {
      setLeads((list) => list.map((l) => (l._id === lead._id ? { ...l, status: prev } : l))); // revert
      toast.error(e.message || "Could not update status");
    } finally {
      setSavingId(null);
    }
  }, [userId]);

  const counts = useMemo(() => {
    const c = { all: leads.length, new: 0, contacted: 0, converted: 0, spam: 0 };
    for (const l of leads) c[l.status || "new"] = (c[l.status || "new"] || 0) + 1;
    return c;
  }, [leads]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (statusFilter !== "all" && (l.status || "new") !== statusFilter) return false;
      if (!q) return true;
      return [l.name, l.phone, l.email, l.service, l.message, l.businessName, l.slug]
        .filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
    });
  }, [leads, search, statusFilter]);

  return (
    <div className="mx-auto max-w-6xl px-1 pb-16">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-400 text-slate-900 shadow-sm">
            <Inbox size={22} />
          </span>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Website Leads</h1>
            <p className="text-[13px] text-slate-500">Enquiries from your Limbu website contact form.</p>
          </div>
        </div>
        <button
          onClick={fetchLeads}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-[13px] font-bold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stat / filter cards */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { key: "all", label: "Total", dot: "bg-slate-800" },
          ...STATUS_KEYS.map((k) => ({ key: k, label: STATUS_META[k].label, dot: STATUS_META[k].dot })),
        ].map((s) => {
          const active = statusFilter === s.key;
          return (
            <button
              key={s.key}
              onClick={() => setStatusFilter(s.key)}
              className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition ${active ? "border-yellow-400 ring-2 ring-yellow-200" : "border-slate-100 hover:border-slate-200"}`}
            >
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{s.label}</span>
              </div>
              <div className="mt-1 text-2xl font-extrabold text-slate-900">{counts[s.key] ?? 0}</div>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative mt-4">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, phone, email, service…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-700 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* Body */}
      {loading ? (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-white py-16 shadow-sm">
          <RefreshCw size={26} className="animate-spin text-yellow-500" />
          <span className="text-sm font-semibold text-slate-500">Loading leads…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-white py-16 text-center shadow-sm">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Inbox size={26} />
          </span>
          <div className="text-base font-bold text-slate-700">
            {leads.length === 0 ? "No leads yet" : "No leads match your filter"}
          </div>
          <div className="max-w-sm text-[13px] text-slate-400">
            {leads.length === 0
              ? "When someone submits your website contact form, it will show up here."
              : "Try clearing the search or status filter."}
          </div>
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-230 border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3 font-bold">Lead</th>
                  <th className="px-4 py-3 font-bold">Phone</th>
                  <th className="px-4 py-3 font-bold">Email</th>
                  <th className="px-4 py-3 font-bold">Service</th>
                  <th className="px-4 py-3 font-bold">Message</th>
                  <th className="px-4 py-3 font-bold">Business</th>
                  <th className="px-4 py-3 font-bold">Date</th>
                  <th className="px-4 py-3 text-right font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((l) => (
                  <tr key={l._id} className="align-top transition hover:bg-slate-50/60">
                    {/* Lead */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-yellow-400 to-amber-500 text-xs font-extrabold text-white">
                          {initials(l.name)}
                        </span>
                        <span className="font-bold text-slate-900">{l.name || "—"}</span>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-4 py-3">
                      {l.phone ? (
                        <a href={`tel:${l.phone}`} className="inline-flex items-center gap-1.5 font-semibold text-blue-600 hover:underline">
                          <Phone size={14} /> {l.phone}
                        </a>
                      ) : <span className="text-slate-300">—</span>}
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3">
                      {l.email ? (
                        <a href={`mailto:${l.email}`} className="inline-flex items-center gap-1.5 font-semibold text-blue-600 hover:underline">
                          <Mail size={14} /> <span className="max-w-45 truncate">{l.email}</span>
                        </a>
                      ) : <span className="text-slate-300">—</span>}
                    </td>

                    {/* Service */}
                    <td className="px-4 py-3">
                      {l.service ? (
                        <span className="inline-flex items-center gap-1.5 text-slate-600">
                          <Wrench size={14} className="text-slate-400" /> {l.service}
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>

                    {/* Message */}
                    <td className="px-4 py-3">
                      {l.message ? (
                        <span className="block max-w-60 truncate text-slate-600" title={l.message}>
                          {l.message}
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>

                    {/* Business */}
                    <td className="px-4 py-3">
                      {l.businessName ? (
                        <span className="inline-flex items-center gap-1.5 text-slate-600">
                          <Building2 size={14} className="text-slate-400" /> {l.businessName}
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                      {l.slug && <div className="mt-0.5 text-[11px] text-slate-300">/{l.slug}</div>}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-slate-500">
                        <Clock size={13} className="text-slate-400" /> {fmtDateTime(l.createdAt)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-right">
                      <StatusSelect
                        value={l.status || "new"}
                        busy={savingId === l._id}
                        onChange={(s) => updateStatus(l, s)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer count */}
          <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 text-[12px] font-medium text-slate-400">
            Showing {filtered.length} of {leads.length} lead{leads.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  );
}
