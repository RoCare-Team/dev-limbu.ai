"use client";
import { useEffect, useState } from "react";
import { Search, Users, UserPlus, Crown, Edit2, Trash2, Eye, Loader2, Phone, CheckCircle, XCircle, AlertCircle, X, Link2, MapPin } from "lucide-react";
import { LinkModal, AddModal, EditModal, DetailsModal } from "./TeamModals";

function StatCard({ title, value, icon: Icon, color, iconColor }) {
  return (
    <div className="bg-white rounded-2xl shadow p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-500">{title}</div>
      </div>
    </div>
  );
}

function RoleBadge({ role }) {
  const map = { superFranchiseAdmin: "bg-purple-100 text-purple-700", manager: "bg-blue-100 text-blue-700", agent: "bg-green-100 text-green-700" };
  const labels = { superFranchiseAdmin: "Super Admin", manager: "Manager", agent: "Agent" };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[role] || "bg-gray-100 text-gray-600"}`}>{labels[role] || role}</span>;
}

const EMPTY_FORM = { fullName: "", email: "", mobile: "", password: "", role: "agent", isActive: true, address: "", city: "" };

export default function TeamManagement() {
  const [team, setTeam] = useState([]);
  const [stats, setStats] = useState({ totalMembers: 0, activeMembers: 0, pendingMembers: 0, roleCounts: { superFranchiseAdmin: 0, manager: 0, agent: 0 } });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // "add" | "edit" | "details" | "link"
  const [selected, setSelected] = useState(null);
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [toast, setToast] = useState(null);
  const [franchiseCode, setFranchiseCode] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("franchise_user") || "null");
    if (user?.franchiseCode) setFranchiseCode(user.franchiseCode);
    fetchTeam();
  }, []);

  useEffect(() => { fetchTeam(); }, [search, roleFilter, statusFilter]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getToken = () => localStorage.getItem("franchise_token");
  const closeModal = () => { setModal(null); setSelected(null); setForm(EMPTY_FORM); };

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) return;
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (roleFilter !== "all") params.append("role", roleFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      const res = await fetch(`/api/franchise-panel/team?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) { setTeam(data.data); setStats(data.stats); }
      else showToast(data.message || "Failed to fetch team", "error");
    } catch { showToast("Error fetching team", "error"); }
    finally { setLoading(false); }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => showToast("Copied to clipboard!"))
      .catch(() => showToast("Copy failed", "error"));
  };

  const handleAdd = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await fetch("/api/franchise-panel/team", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) { showToast("Member added successfully!"); closeModal(); fetchTeam(); }
      else showToast(data.message || "Failed to add member", "error");
    } catch { showToast("Error adding member", "error"); }
    finally { setSaving(false); }
  };

  const handleEdit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { id: selected._id, fullName: form.fullName, mobile: form.mobile, role: form.role, isActive: form.isActive, address: form.address, city: form.city };
      if (form.password) payload.password = form.password;
      const res = await fetch("/api/franchise-panel/team", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) { showToast("Member updated!"); closeModal(); fetchTeam(); }
      else showToast(data.message || "Failed to update", "error");
    } catch { showToast("Error updating member", "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this team member?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/franchise-panel/team?id=${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      if (data.success) { showToast("Member deleted!"); fetchTeam(); }
      else showToast(data.message || "Failed to delete", "error");
    } catch { showToast("Error deleting member", "error"); }
    finally { setDeleting(null); }
  };

  const handleToggle = async (member) => {
    try {
      const res = await fetch("/api/franchise-panel/team", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ id: member._id, isActive: !member.isActive }),
      });
      const data = await res.json();
      if (data.success) { showToast(`Member ${!member.isActive ? "activated" : "deactivated"}!`); fetchTeam(); }
      else showToast(data.message || "Failed", "error");
    } catch { showToast("Error", "error"); }
  };

  const openEdit = (m) => {
    setSelected(m);
    setForm({ fullName: m.fullName, email: m.email, mobile: m.mobile, password: "", role: m.role, isActive: m.isActive, address: m.address || "", city: m.city || "" });
    setModal("edit");
  };

  return (
    <div className="space-y-6 p-6">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 min-w-[280px] ${toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
            {toast.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span className="text-sm font-medium">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-auto"><X size={16} /></button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-black text-white rounded-2xl p-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Team Management</h1>
          <p className="text-gray-400 text-sm mt-1">Add Sales Executives, share referral links, track leads</p>
        </div>
        <button
          onClick={() => { setForm(EMPTY_FORM); setModal("add"); }}
          className="bg-white text-black px-5 py-2 rounded-xl font-semibold hover:bg-gray-100 transition flex items-center gap-2 w-fit"
        >
          <UserPlus size={18} /> Add Member
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard title="Total"    value={stats.totalMembers}           icon={Users}        color="bg-blue-50"   iconColor="text-blue-600" />
        <StatCard title="Active"   value={stats.activeMembers}          icon={CheckCircle}  color="bg-green-50"  iconColor="text-green-600" />
        <StatCard title="Inactive" value={stats.pendingMembers}         icon={AlertCircle}  color="bg-yellow-50" iconColor="text-yellow-600" />
        <StatCard title="Managers" value={stats.roleCounts?.manager||0} icon={Crown}        color="bg-purple-50" iconColor="text-purple-600" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input
            type="text" placeholder="Search name, email, mobile..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border rounded-xl w-full text-sm focus:ring-2 focus:ring-black outline-none"
          />
        </div>
        <div className="flex gap-2">
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-black outline-none">
            <option value="all">All Roles</option>
            <option value="superFranchiseAdmin">Super Admin</option>
            <option value="manager">Manager</option>
            <option value="agent">Agent</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-black outline-none">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase border-b">
            <tr>
              {["Member", "Contact", "City", "Role", "Referral Code", "Status", "Joined", "Actions"].map((h) => (
                <th key={h} className="px-5 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="8" className="px-5 py-10 text-center text-gray-400">
                  <div className="flex justify-center gap-2"><Loader2 className="animate-spin" size={18} /> Loading...</div>
                </td>
              </tr>
            ) : team.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-5 py-10 text-center text-gray-400">
                  No team members found. Add your first Sales Executive!
                </td>
              </tr>
            ) : team.map((m) => (
              <tr key={m._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4">
                  <div className="font-medium text-gray-900">{m.fullName}</div>
                  <div className="text-xs text-gray-400">{m.email}</div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Phone size={11} className="text-gray-400" /> {m.mobile}
                  </div>
                </td>
                <td className="px-5 py-4">
                  {m.city
                    ? <div className="flex items-center gap-1 text-xs text-gray-600"><MapPin size={11} className="text-gray-400" />{m.city}</div>
                    : <span className="text-gray-300 text-xs">—</span>}
                </td>
                <td className="px-5 py-4"><RoleBadge role={m.role} /></td>
                <td className="px-5 py-4">
                  {m.referralCode ? (
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg font-bold tracking-wider">{m.referralCode}</span>
                      <button
                        onClick={() => { setSelected(m); setModal("link"); }}
                        className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition"
                        title="View & Copy Referral Link"
                      >
                        <Link2 size={14} />
                      </button>
                    </div>
                  ) : <span className="text-gray-300 text-xs">—</span>}
                </td>
                <td className="px-5 py-4">
                  <button
                    onClick={() => handleToggle(m)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition ${m.isActive ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200"}`}
                  >
                    {m.isActive ? <><CheckCircle size={11} /> Active</> : <><XCircle size={11} /> Inactive</>}
                  </button>
                </td>
                <td className="px-5 py-4 text-xs text-gray-400">
                  {new Date(m.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setSelected(m); setModal("details"); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Details"><Eye size={15} /></button>
                    <button onClick={() => openEdit(m)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Edit"><Edit2 size={15} /></button>
                    <button
                      onClick={() => handleDelete(m._id)}
                      disabled={deleting === m._id}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                      title="Delete"
                    >
                      {deleting === m._id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {modal === "link"    && selected && <LinkModal    member={selected} franchiseCode={franchiseCode} onClose={closeModal} onCopy={copyToClipboard} />}
      {modal === "add"                  && <AddModal     form={form} setForm={setForm} onSubmit={handleAdd}  onClose={closeModal} saving={saving} />}
      {modal === "edit"   && selected && <EditModal    form={form} setForm={setForm} onSubmit={handleEdit} onClose={closeModal} saving={saving} />}
      {modal === "details" && selected && <DetailsModal member={selected} onClose={closeModal} />}
    </div>
  );
}
