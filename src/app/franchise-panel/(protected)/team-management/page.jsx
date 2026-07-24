"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  Users,
  UserPlus,
  Crown,
  ShieldCheck,
  Edit2,
  Trash2,
  X,
  Eye,
  EyeOff,
  Loader2,
  Phone,
  Mail,
  Copy,
  Link2,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

export default function TeamManagement() {
  const [team, setTeam] = useState([]);
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    pendingMembers: 0,
    roleCounts: { superFranchiseAdmin: 0, manager: 0, agent: 0 },
  });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [toast, setToast] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    password: "",
    role: "agent",
    isActive: true,
    address: "",
  });

  useEffect(() => {
    fetchTeam();
  }, [search, roleFilter, statusFilter]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getToken = () => {
    return localStorage.getItem("franchise_token");
  };

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showToast("Please login first", "error");
        return;
      }

      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (roleFilter !== "all") params.append("role", roleFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await fetch(`/api/franchise-panel/team?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (data.success) {
        setTeam(data.data);
        setStats(data.stats);
      } else {
        showToast(data.message || "Failed to fetch team", "error");
      }
    } catch (error) {
      console.error("Error fetching team:", error);
      showToast("Error fetching team", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = getToken();
      const res = await fetch("/api/franchise-panel/team", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        showToast("Team member added successfully!", "success");
        setShowAddModal(false);
        resetForm();
        fetchTeam();
      } else {
        showToast(data.message || "Failed to add team member", "error");
      }
    } catch (error) {
      console.error("Error adding team member:", error);
      showToast("Error adding team member", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateMember = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = getToken();
      const res = await fetch("/api/franchise-panel/team", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: selectedMember._id,
          fullName: formData.fullName,
          mobile: formData.mobile,
          role: formData.role,
          isActive: formData.isActive,
          address: formData.address,
          ...(formData.password?.trim()
            ? { password: formData.password.trim() }
            : {}),
        }),
      });

      const data = await res.json();

      if (data.success) {
        showToast("Team member updated successfully!", "success");
        setShowEditModal(false);
        setSelectedMember(null);
        resetForm();
        fetchTeam();
      } else {
        showToast(data.message || "Failed to update team member", "error");
      }
    } catch (error) {
      console.error("Error updating team member:", error);
      showToast("Error updating team member", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMember = async (id) => {
    if (!confirm("Are you sure you want to delete this team member?")) return;

    setDeleting(id);
    try {
      const token = getToken();
      const res = await fetch(`/api/franchise-panel/team?id=${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (data.success) {
        showToast("Team member deleted successfully!", "success");
        fetchTeam();
      } else {
        showToast(data.message || "Failed to delete team member", "error");
      }
    } catch (error) {
      console.error("Error deleting team member:", error);
      showToast("Error deleting team member", "error");
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleStatus = async (member) => {
    try {
      const token = getToken();
      const res = await fetch("/api/franchise-panel/team", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: member._id,
          isActive: !member.isActive,
        }),
      });

      const data = await res.json();

      if (data.success) {
        showToast(
          `Team member ${!member.isActive ? "activated" : "deactivated"} successfully!`,
          "success"
        );
        fetchTeam();
      } else {
        showToast(data.message || "Failed to update status", "error");
      }
    } catch (error) {
      console.error("Error toggling status:", error);
      showToast("Error updating status", "error");
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      email: "",
      mobile: "",
      password: "",
      role: "agent",
      isActive: true,
      address: "",
    });
  };

  const openEditModal = (member) => {
    setSelectedMember(member);
    setFormData({
      fullName: member.fullName,
      email: member.email,
      mobile: member.mobile,
      password: "",
      role: member.role,
      isActive: member.isActive,
      address: member.address || "",
    });
    setShowEditModal(true);
  };

  const openDetailsModal = (member) => {
    setSelectedMember(member);
    setShowDetailsModal(true);
  };

  const filteredTeam = team;

  const getMemberReferralLink = (member) => {
    const storedUser = localStorage.getItem("franchise_user");
    const franchiseUser = storedUser ? JSON.parse(storedUser) : null;
    const franchiseCode =
      franchiseUser?.franchiseCode ||
      localStorage.getItem("franchise_code") ||
      member.franchiseId;
    const baseUrl =
      typeof window !== "undefined" ? window.location.origin : "https://limbu.ai";
    const params = new URLSearchParams({ refer: franchiseCode });
    if (member.referralCode) params.set("agent", member.referralCode);
    return `${baseUrl}/login?${params.toString()}`;
  };

  const copyMemberReferralLink = async (member) => {
    if (!member.referralCode) return;
    await navigator.clipboard.writeText(getMemberReferralLink(member));
    showToast("Agent referral link copied!", "success");
  };

  return (
    <div className="space-y-8">
      {/* Toast Notification — rendered into document.body so `fixed` positions
          relative to the viewport (top), not the scrollable <main> ancestor. */}
      {mounted && toast &&
        createPortal(
          <div className="fixed top-4 right-4 z-[9999] animate-in slide-in-from-top-5">
            <div
              className={`px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px] ${
                toast.type === "success"
                  ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                  : "bg-gradient-to-r from-red-500 to-rose-500 text-white"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle size={20} />
              ) : (
                <AlertCircle size={20} />
              )}
              <p className="font-semibold text-sm">{toast.message}</p>
              <button onClick={() => setToast(null)} className="ml-auto hover:bg-white/10 rounded-full p-1">
                <X size={16} />
              </button>
            </div>
          </div>,
          document.body,
        )}

      {/* Header */}
      <div className="bg-black text-white rounded-2xl p-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users />
            <span className="uppercase text-sm tracking-wide text-gray-400">
              Team Management
            </span>
          </div>

          <h1 className="text-3xl font-bold text-white">Manage Your Team</h1>

          <p className="text-gray-400 mt-1">
            View & control franchise and agent network
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="mt-4 md:mt-0 bg-white text-black px-6 py-2 rounded-xl font-semibold hover:bg-gray-100 transition flex items-center gap-2"
        >
          <UserPlus size={18} />
          Add Member
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <StatCard
          title="Total Members"
          value={stats.totalMembers}
          icon={Users}
          color="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Active Members"
          value={stats.activeMembers}
          icon={CheckCircle}
          color="bg-green-50"
          iconColor="text-green-600"
        />
        <StatCard
          title="Pending Members"
          value={stats.pendingMembers}
          icon={AlertCircle}
          color="bg-yellow-50"
          iconColor="text-yellow-600"
        />
        <StatCard
          title="Managers"
          value={stats.roleCounts.manager}
          icon={Crown}
          color="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, email, mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-xl w-full focus:ring-2 focus:ring-black"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border rounded-xl focus:ring-2 focus:ring-black"
          >
            <option value="all">All Roles</option>
            <option value="superFranchiseAdmin">Super Admin</option>
            <option value="manager">Manager</option>
            <option value="agent">Agent</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-xl focus:ring-2 focus:ring-black"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="px-6 py-3 text-left">Member Details</th>
              <th className="px-6 py-3 text-left">Contact</th>
              <th className="px-6 py-3 text-left">Role</th>
              <th className="px-6 py-3 text-left">Agent Refer</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Joined</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center">
                  <div className="flex justify-center items-center gap-2">
                    <Loader2 className="animate-spin" />
                    Loading...
                  </div>
                </td>
              </tr>
            ) : filteredTeam.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  className="px-6 py-8 text-center text-gray-500"
                >
                  No team members found
                </td>
              </tr>
            ) : (
              filteredTeam.map((member) => (
                <tr key={member._id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium">{member.fullName}</div>
                    <div className="text-xs text-gray-500">
                      {member.email}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Phone size={12} />
                        {member.mobile}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <RoleBadge role={member.role} />
                  </td>

                  <td className="px-6 py-4">
                    {member.referralCode ? (
                      <div className="flex max-w-56 items-center gap-2">
                        <Link2 size={14} className="shrink-0 text-indigo-600" />
                        <div className="min-w-0">
                          <p className="font-mono text-xs font-semibold text-indigo-700">
                            {member.referralCode}
                          </p>
                          <p className="truncate text-[11px] text-gray-500">
                            {getMemberReferralLink(member)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyMemberReferralLink(member)}
                          className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100"
                          title="Copy agent referral link"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleStatus(member)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs ${
                        member.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {member.isActive ? (
                        <>
                          <CheckCircle size={12} />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle size={12} />
                          Inactive
                        </>
                      )}
                    </button>
                  </td>

                  <td className="px-6 py-4 text-gray-500">
                    {new Date(member.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openDetailsModal(member)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => openEditModal(member)}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteMember(member._id)}
                        disabled={deleting === member._id}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                        title="Delete"
                      >
                        {deleting === member._id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
              <h2 className="text-lg font-bold text-gray-800 sm:text-xl">Add Team Member</h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-full p-2 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="flex min-h-0 flex-1 flex-col">
              <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto px-5 py-4 sm:grid-cols-2 sm:px-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-black"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-black"
                  placeholder="Enter email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.mobile}
                  onChange={(e) =>
                    setFormData({ ...formData, mobile: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-black"
                  placeholder="Enter mobile number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-black"
                  placeholder="Enter password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-black"
                >
                  <option value="agent">Agent</option>
                  <option value="manager">Manager</option>
                  <option value="superFranchiseAdmin">Super Franchise Admin</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-black"
                  placeholder="Enter address (optional)"
                  rows={2}
                />
              </div>
              </div>

              <div className="flex shrink-0 flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:px-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 rounded-xl bg-gray-100 px-4 py-3 text-gray-700 transition hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-white transition hover:bg-gray-800 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Add Member"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {showEditModal && selectedMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Edit Team Member</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.mobile}
                  onChange={(e) =>
                    setFormData({ ...formData, mobile: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password (leave blank to keep current)
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-black"
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-black"
                >
                  <option value="agent">Agent</option>
                  <option value="manager">Manager</option>
                  <option value="superFranchiseAdmin">Super Franchise Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-black"
                  rows={2}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  Active Account
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Update Member"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Team Member Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-600">
                    {selectedMember.fullName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold">{selectedMember.fullName}</h3>
                  <RoleBadge role={selectedMember.role} />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium">{selectedMember.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Mobile</p>
                    <p className="text-sm font-medium">{selectedMember.mobile}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar size={18} className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Joined Date</p>
                    <p className="text-sm font-medium">
                      {new Date(selectedMember.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <ShieldCheck size={18} className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                        selectedMember.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {selectedMember.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                {selectedMember.lastLogin && (
                  <div className="flex items-center gap-3">
                    <Eye size={18} className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Last Login</p>
                      <p className="text-sm font-medium">
                        {new Date(selectedMember.lastLogin).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

{selectedMember.address && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500 mb-1">Address</p>
                    <p className="text-sm">{selectedMember.address}</p>
                  </div>
                )}

                {selectedMember.referralCode && (
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={18} className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Referral Code</p>
                      <p className="text-sm font-bold text-indigo-600">{selectedMember.referralCode}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    openEditModal(selectedMember);
                  }}
                  className="flex-1 px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition flex justify-center items-center gap-2"
                >
                  <Edit2 size={16} />
                  Edit
                </button>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleDeleteMember(selectedMember._id);
                  }}
                  className="px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition flex justify-center items-center gap-2"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------- Components ----------------- */

function StatCard({ title, value, icon: Icon, color, iconColor }) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
          <Icon className={iconColor} size={24} />
        </div>
      </div>
    </div>
  );
}

function RoleBadge({ role }) {
  const map = {
    superFranchiseAdmin: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Super Admin" },
    manager: { bg: "bg-blue-100", text: "text-blue-700", label: "Manager" },
    agent: { bg: "bg-purple-100", text: "text-purple-700", label: "Agent" },
  };

  const style = map[role] || { bg: "bg-gray-100", text: "text-gray-700", label: role };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
}
