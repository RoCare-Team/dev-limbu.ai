"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Power, Trash2, UserCheck, UserX, Users, UserCog, Layers, UserPlus, List, Filter } from "lucide-react";
import Lottie from "lottie-react";
import animationData from "@/assets/animation/Loading.json";

/* ----------------------------
   PERMISSION LABELS
---------------------------- */
const PERMISSION_LABELS = {
  manageUsers: "User Management",
  manageTeam: "Team Management",
  manageLeads: "Leads / Contact / FB / Demo",
  manageFranchise: "Franchise Leads",
  seeAnalytics: "Settings / Analytics",
};

export default function UsersPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("list");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  /** List filters — status (active/inactive) aur role. */
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  /** Per-admin assigned-lead counts (normal leads + franchise leads), keyed by admin _id. */
  const [agentStatsById, setAgentStatsById] = useState({});
  const [agentStatsTotals, setAgentStatsTotals] = useState({
    leads: 0,
    franchiseLeads: 0,
    total: 0,
  });

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "agent",
    permissions: {
      manageUsers: true,
      manageTeam: false,
      manageLeads: false,
      manageFranchise: false,
      seeAnalytics: false,
    },
  });

  /* ----------------------------
     FETCH USERS
  ---------------------------- */
  const fetchUsers = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/adminLogin");
      return;
    }

    fetch("/api/users/list", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setUsers(data.users || []);
        setLoading(false);
      });
  };

  /* ----------------------------
     FETCH PER-AGENT ASSIGNED-LEAD STATS
  ---------------------------- */
  const fetchAgentStats = () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("/api/admin/agent-lead-stats", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) return;
        const byId = {};
        (data.perAgent || []).forEach((a) => {
          byId[a._id] = a;
        });
        setAgentStatsById(byId);
        setAgentStatsTotals(
          data.totals || { leads: 0, franchiseLeads: 0, total: 0 },
        );
      })
      .catch(() => {});
  };

  const handleDelete = async (id) => {
      const token = localStorage.getItem("token");

  if (!confirm("Are you sure you want to delete this user?")) return;

  try {
    const res = await fetch(`/api/users/create?id=${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (data.success) {
      setUsers(prev => prev.filter(u => u._id !== id));
    } else {
      alert(data.message);
    }
  } catch (err) {
    console.error(err);
  }
};

const toggleStatus = async (id, currentStatus) => {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`/api/users/create?id=${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        isActive: !currentStatus,
      }),
    });

    const data = await res.json();

    if (data.success) {
      setUsers(prev =>
        prev.map(u =>
          u._id === id ? { ...u, isActive: !currentStatus } : u
        )
      );
    } else {
      alert(data.message);
    }
  } catch (err) {
    console.error(err);
  }
};

/* ----------------------------
   LEAD ASSIGNMENT ON / OFF (sirf agents ke liye)
   OFF karne par is agent ko koi naya lead auto-assign nahi hoga.
---------------------------- */
const toggleLeads = async (id, currentlyEnabled) => {
  const token = localStorage.getItem("token");
  const nextValue = !currentlyEnabled;

  if (
    !confirm(
      nextValue
        ? "Is agent ko dobara naye leads milne lagenge. Continue?"
        : "Is agent ko naye leads milna band ho jayega. Continue?"
    )
  )
    return;

  try {
    const res = await fetch("/api/users/lead-status", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ agentId: id, leadsEnabled: nextValue }),
    });

    const data = await res.json();

    if (data.success) {
      setUsers(prev =>
        prev.map(u => (u._id === id ? { ...u, leadsEnabled: nextValue } : u))
      );
    } else {
      alert(data.message || "Could not update lead status");
    }
  } catch (err) {
    console.error(err);
    alert("Server error");
  }
};

  useEffect(() => {
    fetchUsers();
    fetchAgentStats();
  }, []);

  /* ----------------------------
     DASHBOARD SUMMARY CARDS
  ---------------------------- */
  const dashboardStats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.isActive).length;
    const inactive = total - active;
    const agents = users.filter((u) => u.role === "agent").length;
    return [
      { label: "Total Users", value: total, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
      { label: "Active", value: active, icon: UserCheck, color: "text-green-600", bg: "bg-green-50" },
      { label: "Inactive", value: inactive, icon: UserX, color: "text-red-600", bg: "bg-red-50" },
      { label: "Agents", value: agents, icon: UserCog, color: "text-indigo-600", bg: "bg-indigo-50" },
      {
        label: "Leads Assigned",
        value: agentStatsTotals.total,
        icon: Layers,
        color: "text-amber-600",
        bg: "bg-amber-50",
        subtitle: `${agentStatsTotals.leads} leads · ${agentStatsTotals.franchiseLeads} franchise`,
      },
    ];
  }, [users, agentStatsTotals]);

  /* ----------------------------
     ROLE OPTIONS — jo bhi roles data me actually maujood hain
  ---------------------------- */
  const roleOptions = useMemo(
    () => Array.from(new Set(users.map((u) => u.role).filter(Boolean))).sort(),
    [users],
  );

  /* ----------------------------
     FILTERED LIST — status + role
  ---------------------------- */
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (statusFilter === "active" && !u.isActive) return false;
      if (statusFilter === "inactive" && u.isActive) return false;
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      return true;
    });
  }, [users, statusFilter, roleFilter]);

  /* ----------------------------
     SUBMIT USER
  ---------------------------- */
  const submit = async () => {
    await fetch("/api/users/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(form),
    });

    alert("User Created Successfully");
    setActiveTab("list");
    fetchUsers();
  };

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8">

      {/* TABS */}
      <div className="max-w-5xl mx-auto mb-6">
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white border border-gray-200 shadow-sm">
          <button
            onClick={() => setActiveTab("list")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "list"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
            }`}
          >
            <List size={16} />
            Users List
          </button>

          <button
            onClick={() => setActiveTab("add")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "add"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
            }`}
          >
            <UserPlus size={16} />
            Add User
          </button>
        </div>
      </div>

      {/* USERS LIST TAB */}
      {activeTab === "list" && (
        <div className="max-w-8xl mx-auto bg-white rounded-2xl shadow-lg p-6">

          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Users List
          </h2>

          {/* DASHBOARD SUMMARY CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
            {dashboardStats.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-gray-200 p-4 flex items-start gap-3"
              >
                <div className={`p-2 rounded-lg ${s.bg}`}>
                  <s.icon size={18} className={s.color} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 font-medium truncate">
                    {s.label}
                  </p>
                  <p className="text-xl font-bold text-gray-800">{s.value}</p>
                  {s.subtitle && (
                    <p className="text-[11px] text-gray-400 truncate">
                      {s.subtitle}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* FILTERS — status + role */}
          <div className="flex flex-wrap items-center gap-3 mb-4 p-3 rounded-xl border border-gray-200 bg-gray-50">
            <div className="flex items-center gap-1.5 text-gray-500 text-xs font-semibold uppercase tracking-wide">
              <Filter size={14} />
              Filters
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border rounded-lg bg-white capitalize focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Roles</option>
              {roleOptions.map((role) => (
                <option key={role} value={role} className="capitalize">
                  {role}
                </option>
              ))}
            </select>

            {(statusFilter !== "all" || roleFilter !== "all") && (
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setRoleFilter("all");
                }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                Clear filters
              </button>
            )}

            <span className="ml-auto text-xs text-gray-500">
              Showing {filteredUsers.length} of {users.length}
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-24 h-24">
                <Lottie animationData={animationData} loop={true} />
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border px-4 py-2 text-left">Name</th>
                    <th className="border px-4 py-2 text-left">Email</th>
                    <th className="border px-4 py-2 text-left">Role</th>
                    <th className="border px-4 py-2 text-left">Status</th>
                    <th className="border px-4 py-2 text-left">Leads</th>
                    <th className="border px-4 py-2 text-left">Assigned</th>
                    <th className="border px-4 py-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="border px-4 py-8 text-center text-gray-400">
                        No users match the selected filters.
                      </td>
                    </tr>
                  )}
                  {filteredUsers.map(u => (
                    <tr key={u._id} className="hover:bg-gray-50">
                      <td className="border px-4 py-2">{u.fullName}</td>
                      <td className="border px-4 py-2">{u.email}</td>
                      <td className="border px-4 py-2 capitalize">{u.role}</td>
                      <td className="border px-4 py-2">
                        {u.isActive ? (
                          <span className="text-green-600 font-medium">Active</span>
                        ) : (
                          <span className="text-red-600 font-medium">Inactive</span>
                        )}
                      </td>
                      {/* LEAD ASSIGNMENT — sirf agents par lagu */}
                      <td className="border px-4 py-2">
                        {u.role === "agent" ? (
                          <button
                            onClick={() => toggleLeads(u._id, u.leadsEnabled !== false)}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                              u.leadsEnabled !== false
                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                : "bg-red-100 text-red-700 hover:bg-red-200"
                            }`}
                            title={
                              u.leadsEnabled !== false
                                ? "Leads ON — click to stop new leads"
                                : "Leads OFF — click to resume new leads"
                            }
                          >
                            {u.leadsEnabled !== false ? (
                              <>
                                <UserCheck size={14} /> Leads ON
                              </>
                            ) : (
                              <>
                                <UserX size={14} /> Leads OFF
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      {/* ASSIGNED — how many leads / franchise leads this admin currently holds */}
                      <td className="border px-4 py-2">
                        {(() => {
                          const s = agentStatsById[String(u._id)];
                          if (!s || s.total === 0) {
                            return <span className="text-gray-400">—</span>;
                          }
                          return (
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800"
                              title={`${s.leads} leads · ${s.franchiseLeads} franchise leads`}
                            >
                              {s.total}
                            </span>
                          );
                        })()}
                      </td>

                      <td className="border px-4 py-2">
  <div className="flex items-center gap-3">

    {/* Activate / Deactivate */}
    <button
      onClick={() => toggleStatus(u._id, u.isActive)}
      className={`p-2 rounded-full transition ${
        u.isActive
          ? "bg-green-100 text-green-600 hover:bg-green-200"
          : "bg-red-100 text-red-600 hover:bg-red-200"
      }`}
      title={u.isActive ? "Deactivate" : "Activate"}
    >
      <Power size={16} />
    </button>

    {/* Delete */}
    <button
      onClick={() => handleDelete(u._id)}
      className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 transition"
      title="Delete User"
    >
      <Trash2 size={16} />
    </button>

  </div>
</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ADD USER TAB */}
      {activeTab === "add" && (
        <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg p-8">

          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Create New User
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Add a user with role-based sidebar permissions
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>
              <label className="text-sm text-gray-600">Full Name</label>
              <input
                placeholder="John Doe"
                onChange={(e) =>
                  setForm({ ...form, fullName: e.target.value })
                }
                className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Email</label>
              <input
                placeholder="john@example.com"
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Role</label>
              <select
                onChange={(e) =>
                  setForm({ ...form, role: e.target.value })
                }
                className="w-full mt-1 px-4 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="superAdmin">Super Admin</option>
                <option value="superFranchiseAdmin">Super Franchise Admin</option>
                <option value="franchiseAdmin">Franchise Admin</option>
                <option value="admin">Admin</option>
                <option value="subadmin">Sub Admin</option>
                <option value="manager">Account Manager</option>
                <option value="agent">Agent</option>
                <option value="support">Support</option>
              </select>
            </div>
          </div>

          {/* PERMISSIONS */}
          <div className="mt-8">
            <h3 className="font-semibold text-gray-700 mb-4">
              Sidebar Permissions
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.keys(PERMISSION_LABELS).map((key) => (
                <label
                  key={key}
                  className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={form.permissions[key]}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        permissions: {
                          ...form.permissions,
                          [key]: e.target.checked,
                        },
                      })
                    }
                    className="w-5 h-5 text-blue-600"
                  />
                  <span className="text-gray-700">
                    {PERMISSION_LABELS[key]}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={submit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium shadow transition"
            >
              Create User
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
