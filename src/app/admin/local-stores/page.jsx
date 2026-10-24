"use client";

import { useEffect, useState } from "react";
import { MapPin, Pencil, Plus, RefreshCw, Store, Trash2, X } from "lucide-react";

/**
 * Admin — "Our Store" entries.
 *
 * One store per city lights up that city's public pages:
 *   /bussiness/franchise-opportunities-<city>
 *   /services/google-bussiness-profile-management-<city>
 *   /services/local-seo-<city>
 */

const EMPTY_FORM = {
  id: "",
  city: "",
  name: "",
  address: "",
  whatsapp: "",
  phone: "",
  mapUrl: "",
  isActive: true,
  order: 0,
};

const slugify = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function LocalStoresPage() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const authHeaders = () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : "";
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/local-stores", {
        headers: authHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed");
      setStores(json.data || []);
    } catch (err) {
      setError(err.message || "Could not load stores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (store) => {
    setForm({
      id: String(store._id),
      city: store.cityName || store.citySlug,
      name: store.name || "",
      address: store.address || "",
      whatsapp: store.whatsapp || "",
      phone: store.phone || "",
      mapUrl: store.mapUrl || "",
      isActive: store.isActive !== false,
      order: store.order || 0,
    });
    setShowForm(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/local-stores", {
        method: form.id ? "PUT" : "POST",
        headers: authHeaders(),
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed");
      setShowForm(false);
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setError(err.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (store) => {
    if (!confirm(`Delete "${store.name}" (${store.citySlug})?`)) return;
    try {
      const res = await fetch(`/api/admin/local-stores?id=${store._id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed");
      await load();
    } catch (err) {
      setError(err.message || "Could not delete");
    }
  };

  const citySlug = slugify(form.city);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Store size={18} />
          </span>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Our Store</h1>
            <p className="text-sm text-gray-500">
              Franchise partners shown on the city pages. {stores.length} saved.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Plus size={14} />
            Add Store
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* List */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-[#1e293b] text-xs uppercase tracking-wider text-white">
                <th className="px-5 py-3 text-left font-semibold">City</th>
                <th className="px-5 py-3 text-left font-semibold">Store</th>
                <th className="px-5 py-3 text-left font-semibold">Address</th>
                <th className="px-5 py-3 text-left font-semibold">Contact</th>
                <th className="px-5 py-3 text-center font-semibold">Live</th>
                <th className="px-5 py-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-500">
                    Loading…
                  </td>
                </tr>
              ) : stores.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-500">
                    No stores yet. Add one to show it on that city&apos;s pages.
                  </td>
                </tr>
              ) : (
                stores.map((store) => (
                  <tr key={store._id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-gray-900">
                        {store.cityName || store.citySlug}
                      </div>
                      <div className="mt-0.5 text-xs text-gray-500">
                        {store.citySlug}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-semibold text-gray-800">
                      {store.name}
                    </td>
                    <td className="px-5 py-4 max-w-[280px] text-xs text-gray-600">
                      {store.address}
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-700">
                      {store.whatsapp && <div>WA: {store.whatsapp}</div>}
                      {store.phone && <div>Call: {store.phone}</div>}
                      {!store.whatsapp && !store.phone && "—"}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${
                          store.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {store.isActive ? "Live" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEdit(store)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                        >
                          <Pencil size={13} />
                          Edit
                        </button>
                        <button
                          onClick={() => remove(store)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={save}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-6 py-4">
              <h2 className="text-base font-bold text-gray-950">
                {form.id ? "Edit Store" : "Add Store"}
              </h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <Field
                label="City"
                hint={
                  citySlug
                    ? `Pages: /bussiness/franchise-opportunities-${citySlug} · /services/google-bussiness-profile-management-${citySlug} · /services/local-seo-${citySlug}`
                    : "e.g. Kanpur"
                }
              >
                <input
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Kanpur"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </Field>

              <Field label="Store Name">
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="AurenAI"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </Field>

              <Field label="Address">
                <textarea
                  required
                  rows={2}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="G-20, Site-3, Panki, Kanpur, Uttar Pradesh, India"
                  className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="WhatsApp">
                  <input
                    value={form.whatsapp}
                    onChange={(e) =>
                      setForm({ ...form, whatsapp: e.target.value })
                    }
                    placeholder="+91 95111 68671"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  />
                </Field>

                <Field label="Call Number (optional)">
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="0512 000 0000"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  />
                </Field>
              </div>

              <Field
                label="Map Embed URL (optional)"
                hint="Blank = map is built from the address automatically."
              >
                <input
                  value={form.mapUrl}
                  onChange={(e) => setForm({ ...form, mapUrl: e.target.value })}
                  placeholder="https://www.google.com/maps/embed?pb=..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </Field>

              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                Show on the website
              </label>
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={saving}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                <MapPin size={14} />
                {saving ? "Saving…" : "Save Store"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-gray-500">{hint}</p>}
    </div>
  );
}
