"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const PERMISSION_LABELS = {
  manageUsers: "User Management",
  manageTeam: "Team Management",
  manageLeads: "Leads / Contact / FB / Demo",
  manageFranchise: "Franchise Leads",
  seeAnalytics: "Settings / Analytics",
};

const ROLE_PRESETS = {
  superAdmin: {
    manageUsers: true,
    manageTeam: true,
    manageLeads: true,
    manageFranchise: true,
    seeAnalytics: true,
  },
  franchiseAdmin: {
    manageUsers: false,
    manageTeam: false,
    manageLeads: false,
    manageFranchise: true,
    seeAnalytics: false,
  },
  admin: {
    manageUsers: true,
    manageTeam: true,
    manageLeads: true,
    manageFranchise: false,
    seeAnalytics: true,
  },
  subadmin: {
    manageUsers: true,
    manageTeam: true,
    manageLeads: true,
    manageFranchise: false,
    seeAnalytics: false,
  },
  AccountManger: {
    manageUsers: true,
    manageTeam: true,
    manageLeads: true,
    manageFranchise: false,
    seeAnalytics: false,
  },
  agent: {
    manageUsers: false,
    manageTeam: false,
    manageLeads: true,
    manageFranchise: false,
    seeAnalytics: false,
  },
  support: {
    manageUsers: false,
    manageTeam: false,
    manageLeads: true,
    manageFranchise: false,
    seeAnalytics: false,
  },
};

export default function AddUser() {
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "agent",
    permissions: ROLE_PRESETS.agent,
  });

  const handleRoleChange = (role) => {
    setForm({ ...form, role, permissions: ROLE_PRESETS[role] });
  };

  const submit = async () => {
    await fetch("/api/users/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(form),
    });

    alert("User Created");
    router.push("/admin/rbac/users");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center px-4">
      <div className="bg-white p-8 rounded-xl shadow w-full max-w-3xl">

        <h2 className="text-2xl font-bold mb-4">Create New User</h2>

        <div className="grid md:grid-cols-2 gap-4">
          <input placeholder="Full Name" className="border p-2 rounded"
            onChange={e => setForm({ ...form, fullName: e.target.value })} />

          <input placeholder="Email" className="border p-2 rounded"
            onChange={e => setForm({ ...form, email: e.target.value })} />

          <input type="password" placeholder="Password" className="border p-2 rounded"
            onChange={e => setForm({ ...form, password: e.target.value })} />

          <select className="border p-2 rounded"
            onChange={e => handleRoleChange(e.target.value)}>
            {Object.keys(ROLE_PRESETS).map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <h3 className="mt-6 font-semibold">Permissions</h3>

        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          {Object.keys(PERMISSION_LABELS).map(key => (
            <label key={key} className="flex gap-2 border p-3 rounded">
              <input type="checkbox" checked={form.permissions[key]}
                onChange={e =>
                  setForm({
                    ...form,
                    permissions: { ...form.permissions, [key]: e.target.checked }
                  })
                } />
              {PERMISSION_LABELS[key]}
            </label>
          ))}
        </div>

        <button
          onClick={submit}
          className="mt-6 bg-blue-600 text-white px-6 py-2 rounded">
          Create User
        </button>
      </div>
    </div>
  );
}
