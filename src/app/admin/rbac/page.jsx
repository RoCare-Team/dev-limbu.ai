"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Power, Trash2, UserCheck, UserX, Users, UserCog, Layers, UserPlus, List, Filter, Eye, EyeOff, KeyRound, Copy, Check, X, ShieldAlert, Pencil } from "lucide-react";
import Lottie from "lottie-react";
import animationData from "@/assets/animation/Loading.json";
import AccessPicker from "@/components/admin/AccessPicker";
import { ROLE_DEFAULT_ACCESS, canManageRole } from "@/lib/adminAccess";

/** Roles in rank order — Create and Edit both pick from this list. */
const ROLE_OPTIONS = [
  { value: "superAdmin", label: "Super Admin" },
  { value: "seniorManager", label: "Senior Manager" },
  { value: "superFranchiseAdmin", label: "Super Franchise Admin" },
  { value: "franchiseAdmin", label: "Franchise Admin" },
  { value: "admin", label: "Admin" },
  { value: "subadmin", label: "Sub Admin" },
  { value: "manager", label: "Account Manager" },
  { value: "agent", label: "Agent" },
  { value: "support", label: "Support" },
];
const roleLabel = (role) => ROLE_OPTIONS.find((r) => r.value === role)?.label || role;

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

  /* ----------------------------
     PASSWORD REVEAL — passkey ke baad hi password dikhta hai.
     Purane accounts ka sirf bcrypt hash hai (reverse nahi ho sakta),
     to unke liye modal naya password set karne ka option deta hai.
  ---------------------------- */
  const [pwTarget, setPwTarget] = useState(null);
  const [passkey, setPasskey] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [needsReset, setNeedsReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [revealed, setRevealed] = useState({});
  const [visible, setVisible] = useState({});
  const [copiedId, setCopiedId] = useState(null);

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
    // Section-wise menu access (lib/adminAccess.js). Picking a role pre-fills
    // this; whatever is ticked here is what the user actually gets.
    access: ROLE_DEFAULT_ACCESS.agent,
  });

  /** Role change resets the ticks to that role's default, then it stays editable. */
  const handleRoleChange = (role) =>
    setForm((f) => ({ ...f, role, access: ROLE_DEFAULT_ACCESS[role] || [] }));

  /** Logged-in admin's role — decides who they may edit and which roles they may give. */
  const [myRole, setMyRole] = useState("");
  useEffect(() => {
    setMyRole(localStorage.getItem("role") || "");
  }, []);
  const canEditUsers = myRole === "superAdmin" || myRole === "seniorManager";
  const assignableRoles = ROLE_OPTIONS.filter((r) => canManageRole(myRole, r.value));

  /* ----------------------------
     EDIT USER
  ---------------------------- */
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState("");

  const openEdit = (u) => {
    setEditTarget(u);
    setEditError("");
    setEditForm({
      fullName: u.fullName || "",
      email: u.email || "",
      mobile: u.mobile || "",
      role: u.role,
      password: "",
      access: u.access?.length ? u.access : ROLE_DEFAULT_ACCESS[u.role] || [],
    });
  };

  const closeEdit = () => {
    if (editBusy) return;
    setEditTarget(null);
    setEditForm(null);
  };

  const saveEdit = async () => {
    if (!editForm.fullName.trim() || !editForm.email.trim()) {
      setEditError("Name and email are required");
      return;
    }
    if (editForm.password && editForm.password.trim().length < 6) {
      setEditError("New password must be at least 6 characters");
      return;
    }
    setEditBusy(true);
    setEditError("");
    const body = {
      fullName: editForm.fullName.trim(),
      email: editForm.email.trim(),
      mobile: editForm.mobile.trim(),
      role: editForm.role,
      access: editForm.access,
    };
    if (editForm.password.trim()) body.password = editForm.password.trim();
    try {
      const res = await fetch(`/api/users/create?id=${editTarget._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) {
        setEditError(data.message || "Could not update user");
        return;
      }
      setUsers((prev) => prev.map((u) => (u._id === editTarget._id ? { ...u, ...data.user } : u)));
      // A changed password invalidates any copy shown in the table.
      if (body.password) {
        setRevealed((r) => ({ ...r, [editTarget._id]: undefined }));
        setVisible((v) => ({ ...v, [editTarget._id]: false }));
      }
      setEditTarget(null);
      setEditForm(null);
    } catch {
      setEditError("Network error, please try again");
    } finally {
      setEditBusy(false);
    }
  };

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

/* ----------------------------
   PASSWORD REVEAL HANDLERS
---------------------------- */
const openPasskeyModal = (user) => {
  // Is session me pehle se unlock hai → sirf show/hide toggle karo.
  if (revealed[user._id]) {
    setVisible(prev => ({ ...prev, [user._id]: !prev[user._id] }));
    return;
  }

  setPwTarget(user);
  setPasskey("");
  setPwError("");
  setNeedsReset(false);
  setNewPassword("");
};

const closePasskeyModal = () => {
  setPwTarget(null);
  setPasskey("");
  setPwError("");
  setNeedsReset(false);
  setNewPassword("");
};

const applyRevealedPassword = (id, value) => {
  setRevealed(prev => ({ ...prev, [id]: value }));
  setVisible(prev => ({ ...prev, [id]: true }));
  closePasskeyModal();
};

const revealPassword = async () => {
  if (!pwTarget) return;

  try {
    setPwBusy(true);
    setPwError("");

    const res = await fetch("/api/users/password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ id: pwTarget._id, passkey }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Unable to reveal password");
    }

    if (data.data.needsReset) {
      setNeedsReset(true);
      return;
    }

    applyRevealedPassword(pwTarget._id, data.data.password);
  } catch (err) {
    setPwError(err.message || "Unable to reveal password");
  } finally {
    setPwBusy(false);
  }
};

const savePassword = async () => {
  if (!pwTarget) return;

  try {
    setPwBusy(true);
    setPwError("");

    const res = await fetch("/api/users/password", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ id: pwTarget._id, passkey, newPassword }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Unable to update password");
    }

    applyRevealedPassword(pwTarget._id, data.data.password);
  } catch (err) {
    setPwError(err.message || "Unable to update password");
  } finally {
    setPwBusy(false);
  }
};

const copyPassword = async (id) => {
  try {
    await navigator.clipboard.writeText(revealed[id]);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  } catch {
    /* clipboard blocked — ignore */
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
                    <th className="border px-4 py-2 text-left">Password</th>
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
                      <td colSpan={8} className="border px-4 py-8 text-center text-gray-400">
                        No users match the selected filters.
                      </td>
                    </tr>
                  )}
                  {filteredUsers.map(u => (
                    <tr key={u._id} className="hover:bg-gray-50">
                      <td className="border px-4 py-2">{u.fullName}</td>
                      <td className="border px-4 py-2">{u.email}</td>

                      {/* PASSWORD — passkey ke baad hi visible */}
                      <td className="border px-4 py-2">
                        <div className="inline-flex items-center gap-1.5">
                          <span
                            className={`font-mono text-xs px-2.5 py-1.5 rounded-lg border min-w-[7.5rem] inline-block ${
                              revealed[u._id] && visible[u._id]
                                ? "bg-blue-50 border-blue-200 text-blue-800 select-all"
                                : "bg-gray-50 border-gray-200 text-gray-400 tracking-[0.2em]"
                            }`}
                          >
                            {revealed[u._id] && visible[u._id]
                              ? revealed[u._id]
                              : "••••••••"}
                          </span>

                          <button
                            onClick={() => openPasskeyModal(u)}
                            title={
                              revealed[u._id]
                                ? visible[u._id]
                                  ? "Hide password"
                                  : "Show password"
                                : "Show password — passkey required"
                            }
                            className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition"
                          >
                            {revealed[u._id] && visible[u._id] ? (
                              <EyeOff size={15} />
                            ) : (
                              <Eye size={15} />
                            )}
                          </button>

                          {revealed[u._id] && visible[u._id] && (
                            <button
                              onClick={() => copyPassword(u._id)}
                              title="Copy password"
                              className="p-1.5 rounded-lg text-gray-500 hover:text-green-600 hover:bg-green-50 transition"
                            >
                              {copiedId === u._id ? (
                                <Check size={15} className="text-green-600" />
                              ) : (
                                <Copy size={15} />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="border px-4 py-2">{roleLabel(u.role)}</td>
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

    {/* Edit — superAdmin / seniorManager; only a superAdmin edits a superAdmin */}
    {canEditUsers && canManageRole(myRole, u.role) && (
      <button
        onClick={() => openEdit(u)}
        className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
        title="Edit User"
      >
        <Pencil size={16} />
      </button>
    )}

    {/* Activate / Deactivate + Delete — hidden on superAdmin rows for a seniorManager (the API refuses them) */}
    {canManageRole(myRole, u.role) && (
      <>
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

        <button
          onClick={() => handleDelete(u._id)}
          className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 transition"
          title="Delete User"
        >
          <Trash2 size={16} />
        </button>
      </>
    )}

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
                value={form.role}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="w-full mt-1 px-4 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {assignableRoles.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* SECTION ACCESS — decides the sidebar and the route guard */}
          <div className="mt-8">
            <div className="mb-1 flex items-center justify-between">
              <h3 className="font-semibold text-gray-700">Section access</h3>
              <span className="text-xs text-gray-500">
                {form.access.length} selected
              </span>
            </div>
            <p className="mb-4 text-xs text-gray-500">
              Only ticked pages show in this user&apos;s sidebar; any other admin URL
              redirects them back to their first allowed page.
            </p>

            <AccessPicker
              value={form.access}
              onChange={(access) => setForm((f) => ({ ...f, access }))}
            />
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

      {/* EDIT USER MODAL */}
      {editTarget && editForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4"
          onClick={closeEdit}
        >
          <div
            className="w-full max-w-3xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 px-6 pt-5 pb-4 border-b border-gray-100">
              <div className="p-2.5 rounded-xl bg-blue-50">
                <Pencil size={20} className="text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-gray-800">Edit user</h3>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {editTarget.fullName} · {editTarget.email}
                </p>
              </div>
              <button
                onClick={closeEdit}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-5">
              {editError && (
                <div className="mb-4 flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <ShieldAlert size={15} className="mt-0.5 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Full Name</label>
                  <input
                    value={editForm.fullName}
                    onChange={(e) => setEditForm((f) => ({ ...f, fullName: e.target.value }))}
                    className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Email</label>
                  <input
                    value={editForm.email}
                    onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Mobile</label>
                  <input
                    value={editForm.mobile}
                    onChange={(e) => setEditForm((f) => ({ ...f, mobile: e.target.value }))}
                    placeholder="Optional"
                    className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => {
                      const role = e.target.value;
                      setEditForm((f) => ({ ...f, role, access: ROLE_DEFAULT_ACCESS[role] || [] }));
                    }}
                    className="w-full mt-1 px-4 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {assignableRoles.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                    {/* Legacy role not in the list (e.g. old data) — keep it selectable so saving doesn't silently change it */}
                    {!assignableRoles.some((r) => r.value === editTarget.role) && (
                      <option value={editTarget.role}>{roleLabel(editTarget.role)}</option>
                    )}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-gray-600">New Password</label>
                  <input
                    type="text"
                    value={editForm.password}
                    onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="Leave empty to keep the current password"
                    className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-1 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-700">Section access</h3>
                  <span className="text-xs text-gray-500">{editForm.access.length} selected</span>
                </div>
                <p className="mb-4 text-xs text-gray-500">
                  Changing the role resets these ticks to that role&apos;s default.
                  {editForm.role === "seniorManager" &&
                    " Senior Manager starts without Leads and Franchise; tick them to give those sections."}
                </p>
                <AccessPicker
                  value={editForm.access}
                  onChange={(access) => setEditForm((f) => ({ ...f, access }))}
                  disabled={editBusy}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
              <button
                onClick={closeEdit}
                disabled={editBusy}
                className="px-4 py-2 text-sm font-semibold text-gray-600 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={editBusy}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 transition disabled:opacity-50"
              >
                {editBusy ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PASSWORD PASSKEY MODAL */}
      {pwTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4"
          onClick={closePasskeyModal}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 px-5 pt-5 pb-4">
              <div
                className={`p-2.5 rounded-xl ${
                  needsReset ? "bg-amber-50" : "bg-blue-50"
                }`}
              >
                {needsReset ? (
                  <ShieldAlert size={20} className="text-amber-600" />
                ) : (
                  <KeyRound size={20} className="text-blue-600" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-gray-800">
                  {needsReset ? "Set a new password" : "Enter passkey"}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {pwTarget.fullName} · {pwTarget.email}
                </p>
              </div>

              <button
                onClick={closePasskeyModal}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-5 pb-5">
              <p className="text-sm text-gray-600 mb-3">
                {needsReset
                  ? "This account's password is stored as a one-way hash, so it can't be shown. Set a new password to make it viewable from here."
                  : "Enter the passkey to view this user's password."}
              </p>

              {pwError && (
                <div className="mb-3 flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <ShieldAlert size={15} className="mt-0.5 shrink-0" />
                  <span>{pwError}</span>
                </div>
              )}

              {needsReset ? (
                <>
                  <input
                    autoFocus
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !pwBusy) savePassword();
                    }}
                    placeholder="New password (min 6 characters)"
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <p className="text-[11px] text-gray-400 mt-1.5">
                    The user will need this new password to log in.
                  </p>
                </>
              ) : (
                <input
                  autoFocus
                  type="password"
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !pwBusy) revealPassword();
                  }}
                  placeholder="Enter passkey"
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              )}

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  onClick={closePasskeyModal}
                  disabled={pwBusy}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={needsReset ? savePassword : revealPassword}
                  disabled={
                    pwBusy ||
                    (needsReset ? newPassword.trim().length < 6 : !passkey)
                  }
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {pwBusy
                    ? needsReset
                      ? "Saving..."
                      : "Verifying..."
                    : needsReset
                      ? "Save & show"
                      : "Show password"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
