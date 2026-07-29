"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Edit2,
  LogIn,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  UserRound,
  Wallet,
  X,
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
import { sourceBadgeClass, sourceLabel } from "@/lib/sourceBadge";
import toast, { Toaster } from "react-hot-toast";
import ScraperModal from "../../components/FrenchieseScrapeModel";

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

const DATE_RANGES = [
  "All Time",
  "Today",
  "Yesterday",
  "Last 7 Days",
  "Last 30 Days",
  "This Month",
  "Custom",
];

const EMPTY_FILTERS = {
  leadStage: "",
  leadStatus: "",
  source: "",
  assignedAgentId: "",
  dateRange: "All Time",
  startDate: "",
  endDate: "",
};

/** Turn the selected preset (or custom dates) into an ISO createdAt range. */
function resolveDateRange({ dateRange, startDate, endDate }) {
  const start = new Date();
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  switch (dateRange) {
    case "Today":
      start.setHours(0, 0, 0, 0);
      break;
    case "Yesterday":
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      break;
    case "Last 7 Days":
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      break;
    case "Last 30 Days":
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      break;
    case "This Month":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    case "Custom": {
      if (!startDate && !endDate) return { start: null, end: null };
      const customStart = startDate ? new Date(`${startDate}T00:00:00`) : null;
      const customEnd = endDate ? new Date(`${endDate}T23:59:59.999`) : null;
      return {
        start: customStart ? customStart.toISOString() : null,
        end: customEnd ? customEnd.toISOString() : null,
      };
    }
    default:
      return { start: null, end: null };
  }

  return { start: start.toISOString(), end: end.toISOString() };
}

function getInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

function FilterField({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-600">
        {label}
      </span>
      {children}
    </label>
  );
}

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);
  const [leadStats, setLeadStats] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sourceOptions, setSourceOptions] = useState([]);

  //scrape model state
  const [isScraperOpen, setIsScraperOpen] = useState(false);

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
  const [impersonatingId, setImpersonatingId] = useState("");

  // Bulk selection / reassign
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAgentId, setBulkAgentId] = useState("");
  const [reassigning, setReassigning] = useState(false);

  const [teamMembers, setTeamMembers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const canManageBookings = canAccessBookings(currentUser?.role);
  const canUpdateWallet = canManageWallet(currentUser?.role);

  // Select, Lead, Contact, Tag, Stage, Source, Assigned To, Remarks, Wallet, Actions
  const COLUMN_COUNT = canManageBookings ? 11 : 10;

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

  const activeFilterCount = [
    filters.leadStage,
    filters.leadStatus,
    filters.source,
    filters.assignedAgentId,
    filters.dateRange !== "All Time" ? filters.dateRange : "",
  ].filter(Boolean).length;

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setSearch("");
    setCurrentPage(1);
  };

  // Stat cards act as stage tabs — clicking the active one clears the filter.
  const handleStageTab = (stage) => {
    updateFilter("leadStage", filters.leadStage === stage ? "" : stage);
  };

  const handleTodayTab = () => {
    setFilters((prev) => ({
      ...prev,
      dateRange: prev.dateRange === "Today" ? "All Time" : "Today",
      startDate: "",
      endDate: "",
    }));
    setCurrentPage(1);
  };

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
        if (filters.leadStage) params.set("leadStage", filters.leadStage);
        if (filters.leadStatus) params.set("leadStatus", filters.leadStatus);
        if (filters.source) params.set("source", filters.source);
        if (filters.assignedAgentId) {
          params.set("assignedAgentId", filters.assignedAgentId);
        }

        const { start, end } = resolveDateRange(filters);
        if (start) params.set("startDate", start);
        if (end) params.set("endDate", end);

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
          if (Array.isArray(data.sources)) setSourceOptions(data.sources);
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
    [currentPage, debouncedSearch, filters],
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

  // Selection is page-scoped — a hidden selected row would be a nasty surprise.
  useEffect(() => {
    setSelectedIds([]);
  }, [currentPage, debouncedSearch, filters]);

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

  // ── Bulk selection ────────────────────────────────────────────
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const allPageSelected =
    users.length > 0 && users.every((user) => selectedSet.has(user._id));

  const toggleRow = (id) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );

  const toggleAllOnPage = () =>
    setSelectedIds(allPageSelected ? [] : users.map((user) => user._id));

  const handleBulkReassign = async () => {
    if (!selectedIds.length) return;

    setReassigning(true);
    try {
      const res = await fetch("/api/franchise-panel/lead-assign", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          userIds: selectedIds,
          assignedAgentId: bulkAgentId || null,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        showToast(data.message || "Could not reassign leads", "error");
        return;
      }

      showToast(data.message);
      if (data.skipped > 0) {
        showToast(`${data.skipped} skipped — not in your franchise`, "error");
      }

      // Update in place so the table does not jump back to page 1.
      setUsers((prev) =>
        prev.map((user) =>
          selectedSet.has(user._id)
            ? {
                ...user,
                assignedAgentId: data.assignedAgentId,
                referredByAgentId: data.assignedAgentId,
                referredByAgentName: data.assignedAgentName,
              }
            : user,
        ),
      );
      setSelectedIds([]);
    } catch (error) {
      console.error("Bulk reassign error:", error);
      showToast("Could not reassign leads", "error");
    } finally {
      setReassigning(false);
    }
  };

  // ── Login as this lead ────────────────────────────────────────
  const handleLoginAsUser = async (user) => {
    if (!user.userId) {
      showToast("This lead has no user account yet", "error");
      return;
    }

    setImpersonatingId(user._id);
    try {
      const res = await fetch("/api/franchise-panel/login-as-user", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ userId: user.userId }),
      });
      const data = await res.json();

      if (!data.success || !data.token) {
        showToast(data.message || "Unable to log in as this user", "error");
        return;
      }

      // The handoff page writes the session in the new tab, so the franchise
      // admin's own session in this tab is untouched.
      const payload = encodeURIComponent(
        JSON.stringify({
          token: data.token,
          userId: data.user.userId,
          impersonatedUser: data.user.userId,
          impersonatedName: data.user.fullName,
          impersonatedEmail: data.user.email,
        }),
      );

      window.open(`/impersonate-login?data=${payload}`, "_blank", "noopener");
    } catch (error) {
      console.error("Login as user error:", error);
      showToast("Unable to log in as this user", "error");
    } finally {
      setImpersonatingId("");
    }
  };

  return (
    <>
      <div className="p-2">
        {/* Toaster is rendered at root level below */}

        {/* Header */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-950">
              User Management
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              {totalLeads} lead{totalLeads === 1 ? "" : "s"}
              {activeFilterCount > 0 || search ? " matching your filters" : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setOpenAddModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800"
            >
              <Plus size={16} />
              Add Lead
            </button>
            <button
              type="button"
              onClick={() => setIsScraperOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50"
            >
              <Download size={16} />
              Scrape Data
            </button>
          </div>
        </div>

        {/* Filters — always visible */}
        <div className="mb-5 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <SlidersHorizontal size={16} className="text-gray-500" />
              Filters
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-gray-900 px-2 py-0.5 text-xs font-bold text-white">
                  {activeFilterCount} active
                </span>
              )}
            </div>

            <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
              <div className="relative min-w-[260px] flex-1 sm:max-w-sm">
                <Search
                  className="absolute left-3 top-2.5 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search by name, email, phone or refer code"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-9 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-700"
                    title="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={clearFilters}
                disabled={activeFilterCount === 0 && !search}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <X size={15} />
                Clear all
              </button>
            </div>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <FilterField label="Stage">
                <select
                  value={filters.leadStage}
                  onChange={(e) => updateFilter("leadStage", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="">All Stages</option>
                  {STAGES.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>
              </FilterField>

              <FilterField label="Tag">
                <select
                  value={filters.leadStatus}
                  onChange={(e) => updateFilter("leadStatus", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="">All Tags</option>
                  <option value="Hot">Hot</option>
                  <option value="Warm">Warm</option>
                  <option value="Cold">Cold</option>
                  <option value="Untagged">Untagged</option>
                </select>
              </FilterField>

              <FilterField label="Source">
                <select
                  value={filters.source}
                  onChange={(e) => updateFilter("source", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="">All Sources</option>
                  {sourceOptions.map((option) => (
                    <option key={option} value={option}>
                      {sourceLabel(option)}
                    </option>
                  ))}
                </select>
              </FilterField>

              <FilterField label="Assigned To">
                <select
                  value={filters.assignedAgentId}
                  onChange={(e) =>
                    updateFilter("assignedAgentId", e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="">Everyone</option>
                  <option value="unassigned">Unassigned</option>
                  {teamMembers.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.fullName}
                    </option>
                  ))}
                </select>
              </FilterField>

              <FilterField label="Joined">
                <select
                  value={filters.dateRange}
                  onChange={(e) => updateFilter("dateRange", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900"
                >
                  {DATE_RANGES.map((range) => (
                    <option key={range} value={range}>
                      {range}
                    </option>
                  ))}
                </select>
              </FilterField>

              {filters.dateRange === "Custom" && (
                <>
                  <FilterField label="From">
                    <input
                      type="date"
                      value={filters.startDate}
                      max={filters.endDate || undefined}
                      onChange={(e) => updateFilter("startDate", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </FilterField>
                  <FilterField label="To">
                    <input
                      type="date"
                      value={filters.endDate}
                      min={filters.startDate || undefined}
                      onChange={(e) => updateFilter("endDate", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </FilterField>
                </>
              )}
            </div>
          </div>
        </div>

        <DashboardStats
          stats={leadStats}
          activeStage={filters.leadStage}
          onSelectStage={handleStageTab}
          todayActive={filters.dateRange === "Today"}
          onSelectToday={handleTodayTab}
        />

        <RemarksModal
          user={remarksUser}
          onClose={() => setRemarksUser(null)}
          remarksHistory={remarksHistory}
          setRemarksHistory={setRemarksHistory}
          fetchUsers={fetchUsers}
          setUsers={setUsers}
          setRemarksUser={setRemarksUser}
          showToast={showToast}
          getAuthHeaders={getAuthHeaders}
        />

        {/* Bulk actions — appears once rows are selected */}
        {selectedIds.length > 0 && (
          <div className="sticky top-2 z-20 mb-3 flex flex-wrap items-center gap-3 rounded-xl bg-gray-950 px-4 py-3 shadow-lg">
            <span className="text-sm font-semibold text-white">
              {selectedIds.length} lead{selectedIds.length === 1 ? "" : "s"}{" "}
              selected
            </span>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              <select
                value={bulkAgentId}
                onChange={(e) => setBulkAgentId(e.target.value)}
                className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-900 outline-none"
              >
                <option value="">Unassign</option>
                {teamMembers.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.fullName}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleBulkReassign}
                disabled={reassigning}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-bold text-gray-950 hover:bg-gray-100 disabled:opacity-60"
              >
                <UserRound size={15} />
                {reassigning ? "Reassigning..." : "Reassign"}
              </button>

              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-600 px-3 py-2 text-sm font-semibold text-gray-200 hover:bg-white/10"
              >
                <X size={15} />
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[1240px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold uppercase tracking-wide text-gray-500">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleAllOnPage}
                    aria-label="Select all leads on this page"
                    className="h-4 w-4 cursor-pointer accent-gray-900"
                  />
                </th>
                <th className="px-4 py-3 text-left">Lead</th>
                <th className="px-4 py-3 text-left">Contact</th>
                <th className="px-4 py-3 text-left">Tag</th>
                <th className="px-4 py-3 text-left">Stage</th>
                <th className="px-4 py-3 text-left">Source</th>
                <th className="px-4 py-3 text-left">Assigned To</th>
                <th className="px-4 py-3 text-center">Remarks</th>
                <th className="px-4 py-3 text-left">Wallet</th>
                {canManageBookings && (
                  <th className="px-4 py-3 text-left">Service</th>
                )}
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={COLUMN_COUNT} className="px-4 py-16 text-center">
                    <span className="inline-flex items-center gap-2 text-sm text-gray-500">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
                      Loading leads...
                    </span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={COLUMN_COUNT} className="px-4 py-16 text-center">
                    <p className="text-sm font-semibold text-gray-900">
                      No leads found
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {activeFilterCount > 0 || search
                        ? "Try changing or clearing your filters."
                        : "Add your first lead to get started."}
                    </p>
                    {(activeFilterCount > 0 || search) && (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        <X size={14} />
                        Clear filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user._id}
                    className={`transition ${
                      selectedSet.has(user._id)
                        ? "bg-gray-50"
                        : "hover:bg-gray-50/70"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedSet.has(user._id)}
                        onChange={() => toggleRow(user._id)}
                        aria-label={`Select ${user.fullName || "lead"}`}
                        className="h-4 w-4 cursor-pointer accent-gray-900"
                      />
                    </td>

                    {/* Lead */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">
                          {getInitials(user.fullName)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-950">
                            {user.fullName || "Unnamed lead"}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
                            <span className="font-mono">
                              {getLeadDisplayCode(user)}
                            </span>
                            <span className="text-gray-300">•</span>
                            <span>
                              {new Date(user.createdAt).toLocaleDateString(
                                "en-GB",
                                { day: "2-digit", month: "short", year: "numeric" },
                              )}
                            </span>
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-3">
                      <a
                        href={user.email ? `mailto:${user.email}` : undefined}
                        className="flex items-center gap-2 text-gray-800 hover:text-gray-950 hover:underline"
                      >
                        <Mail size={14} className="shrink-0 text-gray-400" />
                        <span className="truncate">{user.email || "-"}</span>
                      </a>
                      <a
                        href={user.phone ? `tel:${user.phone}` : undefined}
                        className="mt-1 flex items-center gap-2 text-gray-600 hover:text-gray-950 hover:underline"
                      >
                        <Phone size={14} className="shrink-0 text-gray-400" />
                        <span>{user.phone || "-"}</span>
                      </a>
                    </td>

                    {/* Tag */}
                    <td className="px-4 py-3">
                      <select
                        value={user.leadStatus || ""}
                        disabled={savingTagId === user._id}
                        onChange={(e) => updateLeadTag(user, e.target.value)}
                        className={`w-28 cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold outline-none transition disabled:opacity-60 ${
                          statusClass[user.leadStatus] ||
                          "border-gray-200 bg-gray-50 text-gray-600"
                        }`}
                      >
                        {STATUSES.map((status) => (
                          <option key={status || "empty"} value={status}>
                            {status || "Untagged"}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Stage */}
                    <td className="px-4 py-3">
                      <select
                        value={user.leadStage || "Active"}
                        disabled={savingStageId === user._id}
                        onChange={(e) => updateLeadStage(user, e.target.value)}
                        className={`w-32 cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold outline-none transition disabled:opacity-60 ${
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

                    {/* Source */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${sourceBadgeClass(
                          user.source,
                        )}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {sourceLabel(user.source)}
                      </span>
                    </td>

                    {/* Assigned To */}
                    <td className="px-4 py-3">
                      <div className="relative w-44">
                        <UserRound
                          size={14}
                          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-violet-600"
                        />
                        <select
                          value={getAssignedId(user)}
                          disabled={savingAssigneeId === user._id}
                          onChange={(e) => updateAssignee(user, e.target.value)}
                          className="w-full cursor-pointer truncate rounded-full border border-violet-200 bg-violet-50 py-1.5 pl-8 pr-2 text-xs font-semibold text-violet-700 outline-none transition disabled:opacity-60"
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

                    {/* Remarks */}
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => openRemarks(user)}
                        title="View remarks"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
                      >
                        <MessageCircle size={14} className="text-gray-500" />
                        {user?.remarksHistory?.length || 0}
                      </button>
                    </td>

                    {/* Wallet */}
                    <td className="px-4 py-3">
                      {canUpdateWallet ? (
                        <button
                          type="button"
                          onClick={() => setWalletModalUser(user)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                          title="Update wallet"
                        >
                          <Wallet size={14} />
                          {user.wallet || 0}
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                          <Wallet size={14} />
                          {user.wallet || 0}
                        </span>
                      )}
                    </td>

                    {/* Service */}
                    {canManageBookings && (
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setServiceModalUser(user)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700"
                        >
                          <Plus size={14} />
                          Service
                        </button>
                      </td>
                    )}

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleLoginAsUser(user)}
                          disabled={
                            impersonatingId === user._id || !user.userId
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-2 text-xs font-semibold text-violet-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-40"
                          title={
                            user.userId
                              ? `Open ${user.fullName || "this lead"}'s dashboard`
                              : "This lead has no user account yet"
                          }
                        >
                          <LogIn size={14} />
                          {impersonatingId === user._id ? "..." : "Login"}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(user)}
                          className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 transition hover:border-gray-400 hover:text-gray-950"
                          title="Edit lead"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteModalUser(user)}
                          className="rounded-lg border border-red-200 bg-white p-2 text-red-600 transition hover:bg-red-50"
                          title="Delete lead"
                        >
                          <Trash2 size={15} />
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

      <ScraperModal
        isOpen={isScraperOpen}
        onClose={() => setIsScraperOpen(false)}
        onScrapeComplete={() => {
          fetchUsers(1);
          setIsScraperOpen(false);
        }}
      />
    </>
  );
}
