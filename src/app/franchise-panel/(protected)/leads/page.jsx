"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Edit2,
  Mail,
  MessageCircle,
  Phone,
  Search,
  Trash2,
  UserRound,
  Wallet,
} from "lucide-react";

import DashboardStats from "../../../../components/FranchiseLeads/DashboardStats";
import RemarksModal from "../../../../components/FranchiseLeads/RemarksModal";
import FienchiesePlanUpgradeModel from "../../components/FienchiesePlanUpgradeModel";
import FrienchieseServiceBookingModel from "../../components/FrienchieseServiceBookingModel";
import UpdateWalletModal from "../../components/UpdateWalletModal";
import AddLeadModal from "../../components/AddLeadModel";
import EditLeadModal from "../../components/EditLeadModel";
import DeleteLeadModal from "../../components/DeleteLeadModel";
import {
  canAccessBookings,
  canManageWallet,
  getFranchiseUserFromStorage,
} from "@/lib/franchiseAuth";
import toast, { Toaster } from "react-hot-toast";

const STAGES = ["Active", "Follow Up", "Inactive", "Onboard"];
const STATUSES = ["", "Hot", "Warm", "Cold"];

const statusClass = {
  Hot: "bg-red-50 text-red-700 border-red-200",
  Warm: "bg-amber-50 text-amber-700 border-amber-200",
  Cold: "bg-blue-50 text-blue-700 border-blue-200",
};

const stageClass = {
  Active: "bg-blue-50 text-blue-700 border-blue-200",
  "Follow Up": "bg-yellow-50 text-yellow-800 border-yellow-200",
  Inactive: "bg-gray-100 text-gray-700 border-gray-200",
  Onboard: "bg-green-50 text-green-700 border-green-200",
};

const PAGE_SIZE = 25;

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);
  const [leadStats, setLeadStats] = useState(null);

  // Modal state
  const [openAddModal, setOpenAddModal] = useState(false);
  const [editModalUser, setEditModalUser] = useState(null);
  const [deleteModalUser, setDeleteModalUser] = useState(null);
  const [remarksUser, setRemarksUser] = useState(null);
  const [remarksHistory, setRemarksHistory] = useState([]);
  const [upgradeModalUser, setUpgradeModalUser] = useState(null);
  const [serviceModalUser, setServiceModalUser] = useState(null);
  const [walletModalUser, setWalletModalUser] = useState(null);

  // Edit form state (kept here so parent controls it alongside editModalUser)
  const [editFormData, setEditFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    leadStatus: "",
    source: "manual-upload",
  });

  // Loading states
  const [savingLead, setSavingLead] = useState(false);
  const [deletingLeadId, setDeletingLeadId] = useState("");
  const [savingStageId, setSavingStageId] = useState("");
  const [savingTagId, setSavingTagId] = useState("");
  const [savingAssigneeId, setSavingAssigneeId] = useState("");

  const [teamMembers, setTeamMembers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const canManageBookings = canAccessBookings(currentUser?.role);
  const canUpdateWallet = canManageWallet(currentUser?.role);

  useEffect(() => {
    setCurrentUser(getFranchiseUserFromStorage());
    fetchTeamMembers();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Convenience wrapper — keeps call sites unchanged
  const showToast = (msg, type = "success") => {
    if (type === "error") toast.error(msg);
    else toast.success(msg);
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem("franchise_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchUsers = useCallback(
    async (page = currentPage) => {
      setLoading(true);
      try {
        const franchiseCode = localStorage.getItem("franchise_code");
        if (!franchiseCode) {
          setUsers([]);
          setTotalLeads(0);
          setTotalPages(1);
          setLeadStats(null);
          return;
        }

        const params = new URLSearchParams({
          referCode: franchiseCode,
          page: String(page),
          limit: String(PAGE_SIZE),
        });
        if (debouncedSearch) params.set("search", debouncedSearch);

        const res = await fetch(
          `/api/franchise-panel/franchise-user?${params.toString()}`,
          { headers: getAuthHeaders() },
        );
        const data = await res.json();

        if (data.success) {
          setUsers(data.users || []);
          setTotalLeads(data.total || 0);
          setTotalPages(data.totalPages || 1);
          setLeadStats(data.stats || null);
          setCurrentPage(data.page || page);
        } else {
          setUsers([]);
          setTotalLeads(0);
          setTotalPages(1);
          setLeadStats(null);
        }
      } catch (error) {
        console.error("Fetch error:", error);
        setUsers([]);
        setTotalLeads(0);
        setTotalPages(1);
        setLeadStats(null);
      } finally {
        setLoading(false);
      }
    },
    [currentPage, debouncedSearch],
  );

  const fetchTeamMembers = async () => {
    try {
      const res = await fetch("/api/franchise-panel/team?status=active", {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      setTeamMembers(data.success ? data.data || [] : []);
    } catch (error) {
      console.error("Team fetch error:", error);
      setTeamMembers([]);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage);
  }, [fetchUsers, currentPage]);

  const goToPage = (page) => {
    const nextPage = Math.min(Math.max(1, page), totalPages);
    setCurrentPage(nextPage);
  };

  const pageStart = totalLeads === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(currentPage * PAGE_SIZE, totalLeads);

  // ── Stage update ──────────────────────────────────────────────
  const updateLeadStage = async (user, leadStage) => {
    setSavingStageId(user._id);
    try {
      const res = await fetch("/api/franchise-panel/franchise-user", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ userId: user._id, leadStage }),
      });
      const data = await res.json();

      if (data.success) {
        setUsers((prev) =>
          prev.map((item) => (item._id === data.user._id ? data.user : item)),
        );
        showToast("Lead stage updated");
        if (leadStage === "Onboard" && canAccessBookings(currentUser?.role)) {
          setUpgradeModalUser(user);
        }
      } else {
        showToast("Failed to update lead stage");
      }
    } catch (error) {
      console.error("Stage update error:", error);
      showToast("Failed to update lead stage");
    } finally {
      setSavingStageId("");
    }
  };

  // ── Tag update ────────────────────────────────────────────────
  const updateLeadTag = async (user, leadStatus) => {
    setSavingTagId(user._id);
    try {
      const res = await fetch("/api/franchise-panel/franchise-user", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ userId: user._id, leadStatus }),
      });
      const data = await res.json();

      if (data.success) {
        setUsers((prev) =>
          prev.map((item) => (item._id === data.user._id ? data.user : item)),
        );
        showToast("Lead tag updated");
      } else {
        showToast(data.message || "Failed to update lead tag");
      }
    } catch (error) {
      console.error("Tag update error:", error);
      showToast("Failed to update lead tag");
    } finally {
      setSavingTagId("");
    }
  };

  // ── Assignee update ───────────────────────────────────────────
  const updateAssignee = async (user, assignedAgentId) => {
    setSavingAssigneeId(user._id);
    try {
      const res = await fetch("/api/franchise-panel/franchise-user", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ userId: user._id, assignedAgentId }),
      });
      const data = await res.json();

      if (data.success) {
        setUsers((prev) =>
          prev.map((item) => (item._id === data.user._id ? data.user : item)),
        );
        showToast(assignedAgentId ? "Lead assigned" : "Lead unassigned");
      } else {
        showToast(data.message || "Failed to update assignee");
      }
    } catch (error) {
      console.error("Assignee update error:", error);
      showToast("Failed to update assignee");
    } finally {
      setSavingAssigneeId("");
    }
  };

  // ── Edit lead ─────────────────────────────────────────────────
  const openEditModal = (user) => {
    setEditModalUser(user);
    setEditFormData({
      fullName: user.fullName || "",
      email: user.email || "",
      phone: user.phone || "",
      leadStatus: user.leadStatus || "",
      source: user.source || "manual-upload",
    });
  };

  const handleEditLead = async () => {
    if (!editModalUser) return;
    if (!editFormData.fullName.trim() || !editFormData.email.trim()) {
      showToast("Please enter full name and email");
      return;
    }

    setSavingLead(true);
    try {
      const res = await fetch("/api/franchise-panel/franchise-user", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ userId: editModalUser._id, ...editFormData }),
      });
      const data = await res.json();

      if (!data.success) {
        showToast(data.message || "Failed to update lead");
        return;
      }

      showToast("Lead updated successfully");
      setEditModalUser(null);
      setUsers((prev) =>
        prev.map((item) => (item._id === data.user._id ? data.user : item)),
      );
    } catch (error) {
      console.error("Edit lead error:", error);
      showToast("Failed to update lead");
    } finally {
      setSavingLead(false);
    }
  };

  // ── Delete lead ───────────────────────────────────────────────
  const handleDeleteLead = async () => {
    if (!deleteModalUser) return;
    setDeletingLeadId(deleteModalUser._id);
    try {
      const res = await fetch(
        `/api/franchise-panel/franchise-user?userId=${deleteModalUser._id}`,
        { method: "DELETE", headers: getAuthHeaders() },
      );
      const data = await res.json();

      if (!data.success) {
        showToast(data.message || "Failed to delete lead");
        return;
      }

      showToast("Lead deleted successfully");
      setDeleteModalUser(null);
      const nextPage =
        users.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
      if (nextPage !== currentPage) {
        setCurrentPage(nextPage);
      } else {
        fetchUsers(currentPage);
      }
    } catch (error) {
      console.error("Delete lead error:", error);
      showToast("Failed to delete lead");
    } finally {
      setDeletingLeadId("");
    }
  };

  // ── Remarks ───────────────────────────────────────────────────
  const openRemarks = async (user) => {
    setRemarksUser(user);
    const userId = user?._id || user?.userId;
    if (!userId) return;

    const res = await fetch(
      `/api/franchise-panel/franchise-user?userId=${userId}&referCode=${encodeURIComponent(
        localStorage.getItem("franchise_code") || "",
      )}`,
      { headers: getAuthHeaders() },
    );
    const data = await res.json();

    if (data.success) {
      setRemarksUser(data.user);
      setRemarksHistory(data.user?.remarksHistory || []);
    }
  };

  const getAssignedId = (user) => {
    const assigned = user.referredByAgentId || user.assignedAgentId || "";
    if (!assigned) return "";
    if (typeof assigned === "object") return assigned._id || "";
    return String(assigned);
  };

  const getLeadDisplayCode = (user) => user.referCode || "-";

  return (
    <>
      <div className="p-2">
      {/* Toaster is rendered at root level below */}

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-950">User Management</h1>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search
                className="absolute left-3 top-2.5 text-gray-500"
                size={18}
              />
              <input
                type="text"
                placeholder="Search by name, email or refer code"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-80 rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 shadow-sm outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <button
              type="button"
              onClick={() => setOpenAddModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800"
            >
              <span className="text-lg leading-none">+</span>
              Add Lead
            </button>
          </div>
        </div>

        <DashboardStats stats={leadStats} />

        <RemarksModal
          user={remarksUser}
          onClose={() => setRemarksUser(null)}
          remarksHistory={remarksHistory}
          setRemarksHistory={setRemarksHistory}
          fetchUsers={fetchUsers}
          setUsers={setUsers}
          setRemarksUser={setRemarksUser}
          showToast={showToast}
        />

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[1450px] text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700">
              <tr>
                <th className="px-5 py-4 text-left">Joined</th>
                <th className="px-5 py-4 text-left">Lead</th>
                <th className="px-5 py-4 text-left">Contact</th>
                <th className="px-5 py-4 text-left">Tag</th>
                <th className="px-5 py-4 text-left">Source</th>
                <th className="px-5 py-4 text-left">Assigned To</th>
                <th className="px-5 py-4 text-left">Remarks</th>
                <th className="px-5 py-4 text-left">Stage</th>
                {canManageBookings && (
                  <th className="px-5 py-4 text-left">Service</th>
                )}
                <th className="px-5 py-4 text-left">Wallet</th>
                <th className="px-5 py-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="13" className="px-5 py-10 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="13" className="px-5 py-10 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user._id}
                    className="border-t border-gray-200 hover:bg-gray-50"
                  >
                    <td className="px-5 py-4 text-gray-700">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-gray-950">
                        {user.fullName}
                      </div>
                      <div className="mt-1 w-fit rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-800">
                        {getLeadDisplayCode(user)}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-gray-800">
                        <Mail size={14} className="text-gray-500" />
                        {user.email || "-"}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-gray-800">
                        <Phone size={14} className="text-gray-500" />
                        {user.phone || "-"}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={user.leadStatus || ""}
                        disabled={savingTagId === user._id}
                        onChange={(e) => updateLeadTag(user, e.target.value)}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold outline-none ${
                          statusClass[user.leadStatus] ||
                          "border-gray-200 bg-gray-50 text-gray-700"
                        }`}
                      >
                        {STATUSES.map((status) => (
                          <option key={status || "empty"} value={status}>
                            {status || "Untagged"}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium capitalize text-gray-800">
                        {user.source || "manual-upload"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="relative">
                        <UserRound
                          size={14}
                          className="pointer-events-none absolute left-3 top-2.5 text-violet-700"
                        />
                        <select
                          value={getAssignedId(user)}
                          disabled={savingAssigneeId === user._id}
                          onChange={(e) => updateAssignee(user, e.target.value)}
                          className="w-48 rounded-full border border-violet-100 bg-violet-50 py-2 pl-9 pr-3 text-xs font-semibold text-violet-700 outline-none"
                        >
                          <option value="">Unassigned</option>
                          {teamMembers.map((member) => (
                            <option key={member._id} value={member._id}>
                              {member.fullName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => openRemarks(user)}
                        className="inline-flex min-w-24 items-center justify-center gap-2 rounded-full bg-gray-200 px-4 py-2 text-gray-950 hover:bg-gray-300"
                      >
                        <MessageCircle size={15} />
                        {user?.remarksHistory?.length || 0}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={user.leadStage || "Active"}
                        disabled={savingStageId === user._id}
                        onChange={(e) => updateLeadStage(user, e.target.value)}
                        className={`rounded-lg border px-3 py-2 text-sm font-semibold outline-none ${
                          stageClass[user.leadStage || "Active"]
                        }`}
                      >
                        {STAGES.map((stage) => (
                          <option key={stage} value={stage}>
                            {stage}
                          </option>
                        ))}
                      </select>
                    </td>
                    {canManageBookings && (
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => setServiceModalUser(user)}
                          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                        >
                          Add Service
                        </button>
                      </td>
                    )}
                    <td className="px-5 py-4">
                      {canUpdateWallet ? (
                        <button
                          type="button"
                          onClick={() => setWalletModalUser(user)}
                          className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 font-bold text-emerald-700 transition hover:bg-emerald-100"
                          title="Update wallet"
                        >
                          <Wallet size={15} />
                          {user.wallet || 0}
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 font-bold text-emerald-700">
                          <Wallet size={15} />
                          {user.wallet || 0}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(user)}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-100"
                          title="Edit lead"
                        >
                          <Edit2 size={14} />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteModalUser(user)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                          title="Delete lead"
                        >
                          <Trash2 size={14} />
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

        {/* Pagination */}
        {!loading && totalLeads > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-sm text-gray-600">
              Showing{" "}
              <span className="font-semibold text-gray-900">
                {pageStart}-{pageEnd}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-900">{totalLeads}</span>{" "}
              leads
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft size={16} />
                Prev
              </button>

              <span className="min-w-24 text-center text-sm font-semibold text-gray-800">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────────── */}

      {openAddModal && (
        <AddLeadModal
          onClose={() => setOpenAddModal(false)}
          onSuccess={() => {
            setOpenAddModal(false);
            setCurrentPage(1);
            fetchUsers(1);
          }}
          getAuthHeaders={getAuthHeaders}
        />
      )}

      {/* react-hot-toast container — renders all toasts */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: "12px",
            fontWeight: "600",
            fontSize: "14px",
            padding: "12px 18px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          },
          success: {
            style: {
              background: "#f0fdf4",
              color: "#166534",
              border: "1px solid #bbf7d0",
            },
            iconTheme: { primary: "#16a34a", secondary: "#f0fdf4" },
          },
          error: {
            style: {
              background: "#fef2f2",
              color: "#991b1b",
              border: "1px solid #fecaca",
            },
            iconTheme: { primary: "#dc2626", secondary: "#fef2f2" },
          },
        }}
      />

      <EditLeadModal
        user={editModalUser}
        formData={editFormData}
        setFormData={setEditFormData}
        onClose={() => setEditModalUser(null)}
        onSave={handleEditLead}
        saving={savingLead}
      />

      <DeleteLeadModal
        user={deleteModalUser}
        onClose={() => setDeleteModalUser(null)}
        onConfirm={handleDeleteLead}
        deleting={deletingLeadId === deleteModalUser?._id}
      />

      {canManageBookings && upgradeModalUser && (
        <FienchiesePlanUpgradeModel
          selectedUser={upgradeModalUser}
          onClose={() => setUpgradeModalUser(null)}
          fetchUsers={fetchUsers}
        />
      )}

      {canManageBookings && serviceModalUser && (
        <FrienchieseServiceBookingModel
          selectedUser={serviceModalUser}
          onClose={() => setServiceModalUser(null)}
          fetchUsers={fetchUsers}
        />
      )}

      {canUpdateWallet && walletModalUser && (
        <UpdateWalletModal
          user={walletModalUser}
          onClose={() => setWalletModalUser(null)}
          onSuccess={(updatedUser) => {
            if (updatedUser?._id) {
              setUsers((prev) =>
                prev.map((item) =>
                  item._id === updatedUser._id ? updatedUser : item,
                ),
              );
            } else {
              fetchUsers();
            }
          }}
          showToast={showToast}
        />
      )}
    </>
  );
}