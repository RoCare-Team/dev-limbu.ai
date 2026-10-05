"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AccessPicker from "@/components/admin/AccessPicker";
import { ROLE_DEFAULT_ACCESS } from "@/lib/adminAccess";

/**
 * Create an admin user.
 *
 * Access is asked section-wise AT CREATION: picking a role only pre-fills the
 * sensible default, the ticked list is what actually reaches the database and
 * decides the sidebar + route guard (lib/adminAccess.js).
 */
const ROLES = [
  "superAdmin",
  "admin",
  "franchiseAdmin",
  "subadmin",
  "AccountManger",
  "agent",
  "support",
];

export default function AddUser() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "agent",
    access: ROLE_DEFAULT_ACCESS.agent,
  });

  const handleRoleChange = (role) => {
    // The role resets the ticks to that role's default — the admin can then
    // add or remove individual sections before saving.
    setForm((f) => ({ ...f, role, access: ROLE_DEFAULT_ACCESS[role] || [] }));
  };

  const submit = async () => {
    if (!form.fullName.trim() || !form.email.trim() || !form.password.trim()) {
      setError("Full name, email and password are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/users/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        throw new Error(data.message || data.error || "Could not create this user.");
      }
      router.push("/admin/rbac/users");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8">
      <div className="mx-auto w-full max-w-3xl rounded-xl bg-white p-8 shadow">
        <h2 className="text-2xl font-bold">Create New User</h2>
        <p className="mt-1 text-sm text-slate-500">
          Pick the role, then tick exactly which sections this user should see.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <input
            placeholder="Full Name"
            className="rounded border p-2"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
          <input
            placeholder="Email"
            className="rounded border p-2"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            type="password"
            placeholder="Password"
            className="rounded border p-2"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <select
            className="rounded border p-2 capitalize"
            value={form.role}
            onChange={(e) => handleRoleChange(e.target.value)}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-7 flex items-center justify-between">
          <h3 className="font-semibold">Section access</h3>
          <span className="text-xs text-slate-500">{form.access.length} selected</span>
        </div>
        <p className="mb-3 mt-1 text-xs text-slate-500">
          Only the ticked pages appear in this user&apos;s sidebar, and opening any other admin
          URL sends them back to their first allowed page.
        </p>

        <AccessPicker
          value={form.access}
          onChange={(access) => setForm((f) => ({ ...f, access }))}
          disabled={saving}
        />

        {error && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}

        <button
          onClick={submit}
          disabled={saving}
          className="mt-6 rounded bg-blue-600 px-6 py-2 text-white disabled:opacity-50"
        >
          {saving ? "Creating…" : "Create User"}
        </button>
      </div>
    </div>
  );
}
