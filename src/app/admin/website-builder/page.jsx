"use client";

import { useCallback, useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  Globe,
  Search,
  Loader2,
  Pencil,
  X,
  ExternalLink,
  PhoneOff,
  Wand2,
  RefreshCw,
} from "lucide-react";

const PHONE_LABELS = {
  ok: { text: "OK", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  no_country_code: {
    text: "No +91",
    cls: "bg-amber-50 text-amber-800 border-amber-300",
  },
  invalid: { text: "Invalid", cls: "bg-red-50 text-red-700 border-red-200" },
  missing: { text: "Missing", cls: "bg-slate-100 text-slate-500 border-slate-200" },
};

const EMPTY_COUNTS = { ok: 0, no_country_code: 0, invalid: 0, missing: 0 };

export default function AdminWebsiteBuilderPage() {
  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [onlyIssues, setOnlyIssues] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [editing, setEditing] = useState(null);

  const authHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
    return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (search.trim()) qs.set("search", search.trim());
      if (onlyIssues) qs.set("issue", "phone");

      const res = await fetch(`/api/admin/website-builder?${qs.toString()}`, {
        headers: authHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to load sites");

      setRows(data.data || []);
      setCounts({ ...EMPTY_COUNTS, ...(data.counts || {}) });
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Could not load websites");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [search, onlyIssues]);

  // Debounced so typing in the search box doesn't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(load, 400);
    return () => clearTimeout(t);
  }, [load]);

  const fixAllPhones = async () => {
    const flagged = rows.filter((r) => r.phoneStatus === "no_country_code");
    if (!flagged.length) return toast.error("Koi number fix karne layak nahi mila.");

    const ok = window.confirm(
      `${flagged.length} live website(s) ka phone number +91 ke saath update hoga.\n\n` +
        `Ye change turant live sites par dikhega. Continue?`
    );
    if (!ok) return;

    setFixing(true);
    try {
      const res = await fetch("/api/admin/website-builder", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          action: "normalize-phones",
          ids: flagged.map((r) => r._id),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || "Bulk fix failed");

      toast.success(`${data.updated} number(s) updated with +91`);
      load();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Bulk fix failed");
    } finally {
      setFixing(false);
    }
  };

  const saveEdit = async (form) => {
    try {
      const res = await fetch("/api/admin/website-builder", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ id: editing._id, ...form }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || "Update failed");

      setRows((prev) => prev.map((r) => (r._id === data.data._id ? data.data : r)));
      toast.success("Website details updated");
      setEditing(null);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Update failed");
    }
  };

  const flaggedCount = counts.no_country_code || 0;

  return (
    <div>
      {/* No global Toaster in the admin layout — each page mounts its own. */}
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
            <Globe size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Website Builder</h1>
            <p className="text-xs text-slate-500">
              Builder se bani saari websites — basic details aur phone country code yahin se manage karein
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button
            onClick={fixAllPhones}
            disabled={fixing || !flaggedCount}
            className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {fixing ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
            Fix +91 on {flaggedCount} site{flaggedCount === 1 ? "" : "s"}
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <StatCard label="Phone OK" value={counts.ok} tone="emerald" />
        <StatCard label="Missing +91" value={counts.no_country_code} tone="amber" />
        <StatCard label="Invalid" value={counts.invalid} tone="red" />
        <StatCard label="No phone" value={counts.missing} tone="slate" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by business name, slug or user ID…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={onlyIssues}
            onChange={(e) => setOnlyIssues(e.target.checked)}
            className="accent-blue-600"
          />
          <PhoneOff size={14} className="text-amber-500" />
          Sirf phone issues
        </label>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Business</th>
              <th className="px-4 py-3 font-semibold">Phone</th>
              <th className="px-4 py-3 font-semibold">User ID</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  <Loader2 size={18} className="mx-auto mb-2 animate-spin" />
                  Loading websites…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  Koi website nahi mili
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const badge = PHONE_LABELS[row.phoneStatus] || PHONE_LABELS.missing;
                return (
                  <tr key={row._id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">
                        {row.title || "(no name)"}
                      </div>
                      <a
                        href={`/${row.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                      >
                        /{row.slug} <ExternalLink size={11} />
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-slate-700">
                        {row.phone || "—"}
                      </div>
                      <span
                        className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${badge.cls}`}
                      >
                        {badge.text}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{row.userId}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                          row.isPublished
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}
                      >
                        {row.isPublished ? "Live" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setEditing(row)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        <Pencil size={13} /> Edit
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <EditSiteModal site={editing} onClose={() => setEditing(null)} onSave={saveEdit} />
      )}
    </div>
  );
}

/* ---------------------------------------------- */

function StatCard({ label, value, tone }) {
  const tones = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    red: "border-red-200 bg-red-50 text-red-800",
    slate: "border-slate-200 bg-white text-slate-700",
  };
  return (
    <div className={`rounded-xl border px-4 py-3 ${tones[tone]}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className="text-xl font-black">{value ?? 0}</p>
    </div>
  );
}

function EditSiteModal({ site, onClose, onSave }) {
  const [form, setForm] = useState({
    title: site.title || "",
    phone: site.phone || "",
    email: site.email || "",
    websiteUri: site.websiteUri || "",
    locality: site.locality || "",
    isPublished: !!site.isPublished,
  });
  const [saving, setSaving] = useState(false);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
          <div className="min-w-0">
            <h2 className="truncate font-bold text-slate-900">{site.title || site.slug}</h2>
            <p className="truncate text-xs text-slate-500">/{site.slug}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 px-5 py-4">
          <Field label="Business Name">
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className="input"
            />
          </Field>

          <Field
            label="Primary Phone"
            hint="Country code ke bina daala to +91 apne aap lag jayega."
          >
            <input
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+919987183886"
              className="input font-mono"
            />
          </Field>

          <Field label="Locality">
            <input
              value={form.locality}
              onChange={(e) => set("locality", e.target.value)}
              className="input"
            />
          </Field>

          <Field label="Email">
            <input
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className="input"
            />
          </Field>

          <Field label="Official Website URL">
            <input
              value={form.websiteUri}
              onChange={(e) => set("websiteUri", e.target.value)}
              className="input"
            />
          </Field>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => set("isPublished", e.target.checked)}
              className="accent-blue-600"
            />
            Published (live)
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Save changes
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid #e2e8f0;
          padding: 0.55rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }
        .input:focus {
          border-color: #60a5fa;
          box-shadow: 0 0 0 3px #dbeafe;
        }
      `}</style>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-slate-700">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}
