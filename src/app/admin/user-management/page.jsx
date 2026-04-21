"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { useFollowUpVoiceAlerts } from "@/hooks/useFollowUpVoiceAlerts";
import Link from "next/link";
import { useRef } from "react";

/* user-management */
import {
  Search,
  Filter,
  X,
  Crown,
  Zap,
  Shield,
  Mail,
  Phone,
  Calendar,
  Edit2,
  Trash2,
  Plus,
  User,
  User2Icon,
  Image as ImageIcon,
  Eye,
  ZoomIn,
  Wallet,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  MessageSquare,
  AlertTriangle,
  ChevronDown,
  UserX,
  Rocket,
  Clock,
  CheckCircle,
  UserCheck,
  Globe,
  Bell,
  Upload,
  Send,
} from "lucide-react";
import { uploadToS3Action } from "@/app/actions/uploadS3Actions";
import { fetchFollowUpTableUsersByIds } from "@/lib/fetchFollowUpTableUsers";
import FollowUpDueAlertModal from "@/components/FollowUpDueAlertModal";
import AddAddUserActivity from "@/components/admin-add-activity";
import Lottie from "lottie-react";
import animationData from "@/assets/animation/Loading.json"; // if not using public

import AdminServicepaneModal from "../../../components/modals/AdminServicePlaneModal";

import {
  alpha,
  Box,
  Button,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TableContainer,
  TextField,
  Typography,
} from "@mui/material";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [addingUser, setAddingUser] = useState(false);
  const [newUser, setNewUser] = useState({
    userId: "",
    email: "",
    phone: "",
    plan: "Basic",
  });
  const [viewingUserPosts, setViewingUserPosts] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [fullViewImage, setFullViewImage] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [connectedBusinessUsers, setConnectedBusinessUsers] = useState([]);
  const [updatingWallet, setUpdatingWallet] = useState(false);
  const [walletModalUser, setWalletModalUser] = useState(null);
  const [walletUpdate, setWalletUpdate] = useState({
    amount: "",
    type: "credit",
    reason: "",
  });
  const [toast, setToast] = useState(null);
  const [userPostsData, setUserPostsData] = useState({});
  const [mergedUsers, setMergedUsers] = useState([]);
  const [impersonatingUser, setImpersonatingUser] = useState(null);
  const [remarksModalUser, setRemarksModalUser] = useState(null);
  const [remarksInput, setRemarksInput] = useState("");
  const [remarksHistory, setRemarksHistory] = useState([]);
  const [loadingRemarks, setLoadingRemarks] = useState(false);

  const [subscriptionPlans, setSubscriptionPlans] = useState(null);
  const [selectedCycle, setSelectedCycle] = useState("monthly");
  const [planStartDate, setPlanStartDate] = useState("");
  const [utrNumber, setUtrNumber] = useState("");
  const [planAmount, setPlanAmount] = useState("");
  const [planExpiryDate, setPlanExpiryDate] = useState("");
  const [planScreenshot, setPlanScreenshot] = useState(null);
  const [chatStats, setChatStats] = useState({
    total: 0,
    today: 0,
    resolved: 0,
    data: [],
  });
  const [showChatStatsModal, setShowChatStatsModal] = useState(false);
  const [chatModalFilter, setChatModalFilter] = useState("all");
  const [issues, setIssues] = useState([]);
  const [showIssuesModal, setShowIssuesModal] = useState(false);
  const [role, setRole] = useState("");
  const [deleteUserModal, setDeleteUserModal] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [agents, setAgents] = useState([]);
  const [assigneeFilter, setAssigneeFilter] = useState("All");
  const [totalPostsCount, setTotalPostsCount] = useState(0);
  const [agentStats, setAgentStats] = useState({ Unassigned: 0 });
  const [detailedStats, setDetailedStats] = useState([]);
  const [stageModal, setStageModal] = useState(null); // { stage: "Follow Up" }
  const [stageStats, setStageStats] = useState({});
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [meetingData, setMeetingData] = useState({
    date: "",
    link: "",
    meetingId: "",
    passcode: "",
  });
  const [todayStats, setTodayStats] = useState({ count: 0, assignments: [] });
  const [agentTodayLeads, setAgentTodayLeads] = useState(0);
  const [leadSourceStats, setLeadSourceStats] = useState({
    metaLeads: 0,
    signupLeads: 0,
  });
  const [todayUsersCount, setTodayUsersCount] = useState(0);
  const [todayUsersMetaLeads, setTodayUsersMetaLeads] = useState(0);
  const [todayUsersSignups, setTodayUsersSignups] = useState(0);
  /** Matches API getTodayUsersCount (Asia/Kolkata / APP_TIMEZONE calendar day). */
  const [todayLeadWindowLabel, setTodayLeadWindowLabel] = useState("");
  const [leadStatusStats, setLeadStatusStats] = useState({
    Hot: 0,
    Warm: 0,
    Cold: 0,
  });
  const [leadStatusFilter, setLeadStatusFilter] = useState("All");
  const [leadStageFilter, setLeadStageFilter] = useState("All");
  const [selectedLeadStatus, setSelectedLeadStatus] = useState("");
  const [callStats, setCallStats] = useState(null);
  const [showAgentCallModal, setShowAgentCallModal] = useState(false);
  const [agentCallHistory, setAgentCallHistory] = useState([]);
  const [callingUserId, setCallingUserId] = useState(null);
  const [followUpDate, setFollowUpDate] = useState("");
  /** HH:mm — combined with followUpDate when saving follow-up */
  const [followUpTime, setFollowUpTime] = useState("09:00");
  const [followUpStats, setFollowUpStats] = useState({
    totalFollowUps: 0,
    todayFollowUps: 0,
    tomorrowFollowUps: 0,
    next7DaysFollowUps: 0,
    thisMonthFollowUps: 0,
    byAgent: [],
    leads: [],
  });
  const [followUpFilter, setFollowUpFilter] = useState("all");
  const [followUpLeads, setFollowUpLeads] = useState([]);
  const [loadingFollowUps, setLoadingFollowUps] = useState(false);
  const [followUpTableUsers, setFollowUpTableUsers] = useState([]);
  const [loadingFollowUpTable, setLoadingFollowUpTable] = useState(false);
  const [followUpDueAlert, setFollowUpDueAlert] = useState(null);
  const [byAgentOpen, setByAgentOpen] = useState(false);
  const [adminFollowUpLeadsOpen, setAdminFollowUpLeadsOpen] = useState(false);

  // Revenue tracking state
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [revenueCount, setRevenueCount] = useState(0);
  const [userOnboardCount, setUserOnboardCount] = useState(0);
  const [franchiseLeadCount, setFranchiseLeadCount] = useState(0);

  // Revenue Users Modal state ✅ NEW
  const [showRevenueUsersModal, setShowRevenueUsersModal] = useState(false);
  const [revenueUsersList, setRevenueUsersList] = useState([]);
  const [loadingRevenueUsers, setLoadingRevenueUsers] = useState(false);

  // Onboarded Client state
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [onboardModalUser, setOnboardModalUser] = useState(null);
  const [onboardData, setOnboardData] = useState({
    plan: "",
    amount: "",
    screenshot: null,
    notes: "",
  });
  const [uploadingOnboard, setUploadingOnboard] = useState(false);

  // Payment Screenshot Upload state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentModalUser, setPaymentModalUser] = useState(null);
  const [paymentData, setPaymentData] = useState({
    amount: "",
    screenshot: null,
    notes: "",
    plan: "",
  });
  const [uploadingPayment, setUploadingPayment] = useState(false);
  const [paidUsersStatus, setPaidUsersStatus] = useState({});

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDate, setFilterDate] = useState("All");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [currentAgentId, setCurrentAgentId] = useState(null);

  // sercvice modal
  // const [openServiceModal, setOpenServiceModal] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [serviceUser, setServiceUser] = useState(null);

  const [isRefreshingMetaLeads, setIsRefreshingMetaLeads] = useState(false);

  /** SuperAdmin only — bulk Tata-style WhatsApp (same campaign as Tata Dialer). */
  const [bulkWaSelectedUserIds, setBulkWaSelectedUserIds] = useState([]);
  const [bulkWaShowPanel, setBulkWaShowPanel] = useState(false);
  const [bulkWaSendDate, setBulkWaSendDate] = useState("");
  const [bulkWaSending, setBulkWaSending] = useState(false);
  const [bulkWaResult, setBulkWaResult] = useState(null);

  // remark
  const [planRemarks, setplanRemarks] = useState("");

  const isServiceModalOpen = activeModal === "service";

  const tableRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    const table = tableRef.current;
    const bottom = bottomRef.current;

    if (!table || !bottom) return;

    const handleScroll = () => {
      bottom.scrollLeft = table.scrollLeft;
    };

    table.addEventListener("scroll", handleScroll);

    return () => table.removeEventListener("scroll", handleScroll);
  }, []);

  const handleOpenServiceModal = (user) => {
    setViewingUserPosts(null);
    setServiceUser(user);
    setActiveModal("service");
  };

  const isAgent = role === "agent";
  const isManager = role === "manager";

  const displayTodayUsersCount = useMemo(() => {
    // For agents the API now returns todayLeads scoped to that agent directly
    if (isAgent) return agentTodayLeads;
    if (isManager && currentAgentId) {
      const assignment = todayStats.assignments.find(
        (a) => String(a._id) === String(currentAgentId),
      );
      return assignment ? assignment.count : 0;
    }
    return todayUsersCount;
  }, [
    isAgent,
    isManager,
    currentAgentId,
    agentTodayLeads,
    todayStats,
    todayUsersCount,
  ]);

  const displayTotalChatsCount = useMemo(() => {
    if (isAgent || isManager) {
      const scopeUsers =
        isAgent && followUpFilter !== "all" ? followUpTableUsers : users;
      return chatStats.data.filter((chat) =>
        scopeUsers.some((u) => u.userId === chat.userId),
      ).length;
    }
    return chatStats.total;
  }, [
    isAgent,
    isManager,
    chatStats,
    users,
    followUpFilter,
    followUpTableUsers,
  ]);

  /** Agent: table rows loaded via byUserIds (paginated `users` often omits follow-up leads) */
  const filteredUsers = useMemo(() => {
    let list =
      !isAgent || followUpFilter === "all" ? users : followUpTableUsers;
    if (isAgent && followUpFilter !== "all" && searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((u) => {
        const hay =
          `${u.email || ""} ${u.userId || ""} ${u.phone || ""} ${u.mobileNumber || ""} ${u.fullName || ""}`.toLowerCase();
        return hay.includes(q);
      });
    }
    return list;
  }, [users, isAgent, followUpFilter, followUpTableUsers, searchQuery]);

  const bulkWaEligibleIdsOnPage = useMemo(() => {
    if (role !== "superAdmin") return [];
    return filteredUsers
      .filter((u) => u.phone || u.mobileNumber)
      .map((u) => String(u.userId));
  }, [role, filteredUsers]);

  const followUpMetaByUserId = useMemo(() => {
    const m = new Map();
    for (const l of followUpLeads) {
      if (!l?.userId) continue;
      const k = String(l.userId);
      if (!m.has(k)) m.set(k, l.followUpDate);
    }
    return m;
  }, [followUpLeads]);

  const agentFollowUpFilterLabel = useMemo(() => {
    const labels = {
      today: "Today",
      tomorrow: "Tomorrow",
      next7days: "Next 7 days",
      thisMonth: "This month",
      all: "All time",
    };
    return labels[followUpFilter] || followUpFilter;
  }, [followUpFilter]);

  const followUpVoiceItems = useMemo(
    () =>
      (followUpLeads || []).map((l, idx) => ({
        kind: "user",
        id: `${l.userId}-${idx}`,
        name: l.fullName || l.phone || String(l.userId || "") || "User",
        phone: l.phone || "",
        userId: l.userId,
        followUpDate: l.followUpDate,
      })),
    [followUpLeads],
  );
  useFollowUpVoiceAlerts(followUpVoiceItems, {
    enabled: Boolean(isAgent),
    onDueAlert: setFollowUpDueAlert,
  });

  const defaultRemarks = [
    "Call Not Picked",
    "Not Interested",
    "Interested",
    "Call Back Later",
    "Wrong Number",
    "Switch Off",
    "Meeting Scheduled",
  ];

  const FOLLOW_UP_REMARKS = ["Call Not Picked", "Call Back Later"];

  const handleDefaultRemarkClick = (remark) => {
    if (remark === "Meeting Scheduled") {
      setShowMeetingModal(true);
      return;
    }
    const adminName = localStorage.getItem("adminName") || "Admin";
    setRemarksInput(`${remark} - ${adminName}`);
    if (!FOLLOW_UP_REMARKS.some((r) => remark.startsWith(r))) {
      setFollowUpDate("");
      setFollowUpTime("09:00");
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSearch = () => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      fetchUsers();
    }
  };

  const handleRefreshMetaLeads = async ({ silent = false } = {}) => {
    const adminRole = localStorage.getItem("role");
    if (!["superAdmin", "admin"].includes(adminRole)) return;

    const email = localStorage.getItem("email");
    if (!email) return;

    if (!silent) setIsRefreshingMetaLeads(true);

    try {
      const res = await fetch(
        `/api/meta-leads-import?formId=1393275835835157&email=${encodeURIComponent(email)}`,
      );

      const data = await res.json();

      if (data.success) {
        if (!silent) {
          showToast("Meta Leads refreshed successfully!", "success");
        }
        fetchUsers();
      } else {
        if (!silent) {
          showToast(data.error || "Failed to refresh Meta Leads", "error");
        } else {
          console.warn("Meta leads sync:", data.error || data);
        }
      }
    } catch (error) {
      console.error("Error refreshing Meta Leads:", error);
      if (!silent) showToast("Error refreshing Meta Leads", "error");
    } finally {
      if (!silent) setIsRefreshingMetaLeads(false);
    }
  };

  const [stats, setStats] = useState({
    total: 0,
    basic: 0,
    standard: 0,
    premium: 0,
    active: 0,
    todayMetaLeads: 0,
    todaySignups: 0,
    leadStageActive: 0,
    leadStageFollowUp: 0,
    leadStageInactive: 0,
    leadStageOnboard: 0,
  });

  const getCalculatedDateRange = (filter) => {
    const today = new Date();
    let start = new Date(today);
    let end = new Date(today);

    if (filter === "Today") {
      // start is today
    } else if (filter === "Last 7 Days") {
      start.setDate(today.getDate() - 7);
    } else if (filter === "Last 30 Days") {
      start.setDate(today.getDate() - 30);
    } else if (filter === "This Month") {
      start.setDate(1);
    } else {
      return null;
    }

    const toLocalYMD = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    return { startDate: toLocalYMD(start), endDate: toLocalYMD(end) };
  };

  useEffect(() => {
    setRole(localStorage.getItem("role"));
    setCurrentAgentId(
      localStorage.getItem("adminId") || localStorage.getItem("userId"),
    );
  }, []);

  useEffect(() => {
    if (
      role === "superAdmin" ||
      role === "admin" ||
      role === "superfranchiseAdmin"
    ) {
      fetch("/api/admin/user-agent")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setAgents(data.data);
        })
        .catch((err) => console.error("Error fetching agents:", err));
    }
  }, [role]);

  useEffect(() => {
    if (role && role !== "superAdmin") {
      setBulkWaSelectedUserIds([]);
      setBulkWaShowPanel(false);
      setBulkWaResult(null);
    }
  }, [role]);

  useEffect(() => {
    if (bulkWaSelectedUserIds.length === 0) setBulkWaShowPanel(false);
  }, [bulkWaSelectedUserIds.length]);

  useEffect(() => {
    const fetchTotalPosts = async () => {
      try {
        // Build date filter params
        let url = "/api/post-status";
        if (filterDate !== "All") {
          if (
            filterDate === "Custom Range" &&
            customStartDate &&
            customEndDate
          ) {
            url += `?startDate=${customStartDate}&endDate=${customEndDate}`;
          } else if (filterDate !== "Custom Range") {
            const ranges = getCalculatedDateRange(filterDate);
            if (ranges) {
              url += `?startDate=${ranges.startDate}&endDate=${ranges.endDate}`;
            }
          }
        }

        const res = await fetch(url);
        const data = await res.json();
        if (data.success) {
          setTotalPostsCount(data.count || 0);
        }
      } catch (error) {
        console.error("Error fetching total posts:", error);
      }
    };

    // Don't fetch if custom range is selected but dates are not set
    if (filterDate === "Custom Range" && (!customStartDate || !customEndDate)) {
      return;
    }

    fetchTotalPosts();
  }, [filterDate, customStartDate, customEndDate]);

  useEffect(() => {
    const fetchCallStats = async () => {
      const adminEmail = localStorage.getItem("email");
      if (!adminEmail || !["superAdmin", "admin", "agent"].includes(role))
        return;

      try {
        const [callRes, followUpRes] = await Promise.all([
          fetch(
            `/api/admin/call-stats?email=${encodeURIComponent(adminEmail)}`,
          ),
          fetch(
            `/api/admin/follow-up-stats?email=${encodeURIComponent(adminEmail)}&filter=all`,
          ),
        ]);
        const callData = await callRes.json();
        const followUpData = await followUpRes.json();

        if (callData.success) setCallStats(callData.stats);
        if (followUpData.success) setFollowUpStats(followUpData.stats);
      } catch (error) {
        console.error("Failed to fetch call/follow-up stats:", error);
      }
    };

    fetchCallStats();
  }, [role, users]);

  // Fetch follow-up leads when filter tab changes
  useEffect(() => {
    const fetchFollowUpLeads = async () => {
      const adminEmail = localStorage.getItem("email");
      if (!adminEmail || !["superAdmin", "admin", "agent"].includes(role))
        return;

      setLoadingFollowUps(true);
      try {
        const res = await fetch(
          `/api/admin/follow-up-stats?email=${encodeURIComponent(adminEmail)}&filter=${followUpFilter}`,
        );
        const data = await res.json();
        if (data.success) {
          setFollowUpLeads(data.stats.leads || []);
          // Update bucket counts without overwriting leads
          setFollowUpStats((prev) => ({ ...prev, ...data.stats }));
        }
      } catch (err) {
        console.error("Failed to fetch follow-up leads:", err);
      } finally {
        setLoadingFollowUps(false);
      }
    };

    fetchFollowUpLeads();
  }, [role, followUpFilter]);

  useEffect(() => {
    if (!isAgent || followUpFilter === "all") {
      setFollowUpTableUsers([]);
      setLoadingFollowUpTable(false);
      return;
    }
    const adminEmail = localStorage.getItem("email");
    const uniqueIds = [
      ...new Set(
        followUpLeads
          .map((l) => l?.userId)
          .filter(Boolean)
          .map(String),
      ),
    ];
    if (!adminEmail || uniqueIds.length === 0) {
      setFollowUpTableUsers([]);
      setLoadingFollowUpTable(false);
      return;
    }

    let cancelled = false;
    setLoadingFollowUpTable(true);
    fetchFollowUpTableUsersByIds(adminEmail, uniqueIds)
      .then((merged) => {
        if (!cancelled) setFollowUpTableUsers(merged);
      })
      .catch((e) => {
        console.error("Follow-up table users fetch failed:", e);
        if (!cancelled) setFollowUpTableUsers([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingFollowUpTable(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAgent, followUpFilter, followUpLeads]);

  useEffect(() => {
    const total = pagination?.totalUsers ?? 0; // Use 0 if pagination is not yet available
    // Calculate basic, standard, premium from the currently loaded users
    const basic = users.filter((u) => u.subscription?.plan === "Basic").length;
    const standard = users.filter(
      (u) => u.subscription?.plan === "Standard",
    ).length;
    const premium = users.filter(
      (u) => u.subscription?.plan === "Premium",
    ).length;
    const active = connectedBusinessUsers.length;
    const isMetaLeadSource = (src) =>
      src === "bulk-upload" || src === "Meta Leads" || src === "Meta";
    const isTodayLocalBrowser = (createdAt) =>
      new Date(createdAt).toDateString() === new Date().toDateString();
    const useApiTodayBreakdown =
      (role === "superAdmin" ||
        role === "admin" ||
        role === "superfranchiseAdmin") &&
      !isAgent &&
      !isManager;
    const todayMetaLeads = useApiTodayBreakdown
      ? todayUsersMetaLeads
      : users.filter(
          (u) => isMetaLeadSource(u.source) && isTodayLocalBrowser(u.createdAt),
        ).length;
    const todaySignups = useApiTodayBreakdown
      ? todayUsersSignups
      : users.filter(
          (u) => u.source === "signup" && isTodayLocalBrowser(u.createdAt),
        ).length;

    setStats({
      total,
      basic,
      standard,
      premium,
      active,
      todayMetaLeads,
      todaySignups,
    });
  }, [
    pagination,
    users,
    connectedBusinessUsers,
    role,
    isAgent,
    isManager,
    todayUsersMetaLeads,
    todayUsersSignups,
  ]);

  const fetchAgentStats = async () => {
    const adminEmail = localStorage.getItem("email");
    if (!adminEmail) return;
    try {
      const params = new URLSearchParams({
        email: adminEmail,
        getAgentStats: "true",
      });

      if (filterStatus !== "All") params.append("status", filterStatus);
      if (filterDate !== "All") {
        if (filterDate === "Custom Range") {
          params.append("dateFilter", "Custom Range");
          if (customStartDate) params.append("startDate", customStartDate);
          if (customEndDate) params.append("endDate", customEndDate);
        } else {
          const ranges = getCalculatedDateRange(filterDate);
          if (ranges) {
            params.append("dateFilter", filterDate);
            params.append("startDate", ranges.startDate);
            params.append("endDate", ranges.endDate);
          }
        }
      }
      if (assigneeFilter !== "All")
        params.append("assignedAgentId", assigneeFilter);
      if (leadStatusFilter !== "All")
        params.append("leadStatus", leadStatusFilter);
      if (leadStageFilter !== "All")
        params.append("leadStage", leadStageFilter);

      const res = await fetch(`/api/users?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setAgentStats(data.stats);
        setStageStats(data.stageStats || {});
        setDetailedStats(data.detailedStats || []);
        setLeadStatusStats(
          data.leadStatusStats || { Hot: 0, Warm: 0, Cold: 0 },
        );

        if (data.todayLeads !== undefined) {
          setTodayStats({
            count: data.todayLeads,
            assignments: data.todayAgentAssignments || [],
          });
          // For agents, API returns todayLeads scoped to their own assignments
          if (isAgent) setAgentTodayLeads(data.todayLeads);
        }

        setLeadSourceStats({
          metaLeads:
            data.metaLeadsCount ?? data.totalMetaLeads ?? data.totalMetaLeadUsers ?? 0,
          signupLeads:
            data.signupLeadsCount ?? data.totalSignupUsers ?? data.totalSignups ?? 0,
        });
      }
    } catch (error) {
      console.error("Error fetching agent stats:", error);
    }
  };

  useEffect(() => {
    if (filterDate === "Custom Range" && (!customStartDate || !customEndDate))
      return;
    fetchAgentStats();
  }, [
    users,
    filterDate,
    filterStatus,
    assigneeFilter,
    customStartDate,
    customEndDate,
    leadStatusFilter,
    leadStageFilter,
  ]);

  const fetchUsers = async (silent = false) => {
    if (!silent) setLoading(true);
    const adminEmail = localStorage.getItem("email");

    try {
      const params = new URLSearchParams({
        email: adminEmail, // 🔑 REQUIRED
        page: currentPage,
        search: searchQuery.trim(),
        limit: 70,
      });

      if (assigneeFilter !== "All") {
        params.append("assignedAgentId", assigneeFilter);
      }

      if (filterStatus !== "All") {
        params.append("status", filterStatus);
      }

      if (filterDate !== "All") {
        if (filterDate === "Custom Range") {
          params.append("dateFilter", "Custom Range");
          if (customStartDate) params.append("startDate", customStartDate);
          if (customEndDate) params.append("endDate", customEndDate);
        } else {
          const ranges = getCalculatedDateRange(filterDate);
          if (ranges) {
            params.append("dateFilter", filterDate);
            params.append("startDate", ranges.startDate);
            params.append("endDate", ranges.endDate);
          }
        }
      }

      if (leadStatusFilter !== "All") {
        params.append("leadStatus", leadStatusFilter);
      }

      if (leadStageFilter !== "All") {
        params.append("leadStage", leadStageFilter);
      }

      const res = await fetch(`/api/users?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setUsers(data.users);

        setPagination({
          totalUsers: data.totalUsers,
          currentPage: data.currentPage || currentPage,
          totalPages: data.totalPages || Math.ceil(data.totalUsers / 70),
          limit: 70,
        });

        return data.users;
      }

      return [];
    } catch (err) {
      console.error("Error fetching users:", err);
      return [];
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (filterDate === "Custom Range" && (!customStartDate || !customEndDate))
      return;
    fetchUsers();
  }, [
    currentPage,
    filterStatus,
    filterDate,
    assigneeFilter,
    customStartDate,
    customEndDate,
    leadStatusFilter,
    leadStageFilter,
  ]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch("/api/home-data?type=subscriptionPlans");
        const data = await res.json();
        setSubscriptionPlans(data);
      } catch (err) {
        console.error("Error fetching plans:", err);
      }
    };
    fetchPlans();
  }, []);

  useEffect(() => {
    fetchAllUserPostsCounts();
  }, [users]); // Trigger when users (current page) change

  useEffect(() => {
    fetchChatStats();
    fetchIssues();
    fetchTodayUsersCount();
    fetchRevenue();
  }, []);

  /* ---------------- UPLOAD TO S3 ---------------- */
  const uploadToS3 = async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const result = await uploadToS3Action(formData);

      if (!result.success) {
        throw new Error(result.error || "Failed to upload to S3");
      }

      return result.url;
    } catch (error) {
      console.error("S3 upload error:", error);
      throw error;
    }
  };

  /* ---------------- FETCH REVENUE USERS LIST ✅ NEW ---------------- */
  const fetchRevenueUsers = async () => {
    setLoadingRevenueUsers(true);
    const userEmail = localStorage.getItem("email");
    const userRole = localStorage.getItem("role");

    try {
      const params = new URLSearchParams({
        type: "user_onboard",
        email: userEmail,
        role: userRole,
      });
      const res = await fetch(`/api/franchise-revenue?${params.toString()}`);
      const data = await res.json();

      if (data.success && data.revenue) {
        setRevenueUsersList(data.revenue);
      } else {
        setRevenueUsersList([]);
        showToast(data.error || "No onboarded users found", "info");
      }
    } catch (err) {
      console.error("Failed to fetch revenue users:", err);
      setRevenueUsersList([]);
      showToast("Failed to load onboarded users", "error");
    } finally {
      setLoadingRevenueUsers(false);
    }
  };

  /* ---------------- FETCH REVENUE DATA ---------------- */
  const fetchRevenue = async () => {
    const userEmail = localStorage.getItem("email");
    const userRole = localStorage.getItem("role");

    if (!userEmail || !userRole) return;

    try {
      const res = await fetch(
        `/api/franchise-revenue?email=${userEmail}&role=${userRole}`,
      );

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // On this page, we only care about user onboarding revenue.
          if (userRole === "superAdmin" || userRole === "superFranchiseAdmin") {
            setTotalRevenue(data.totalUserOnboardRevenue || 0);
            setRevenueCount(data.userOnboardCount || 0);
          } else if (userRole === "agent") {
            // For agents, totalRevenue from API is already just their user_onboard revenue
            setTotalRevenue(data.totalRevenue || 0);
            setRevenueCount(data.userOnboardCount || 0);
          } else {
            // For other roles like franchiseAdmin, they have no user_onboard revenue
            setTotalRevenue(0);
            setRevenueCount(0);
          }

          // Create a map of paid users from 'user_onboard' type revenue entries
          const paidStatus = {};
          if (data.revenue) {
            data.revenue
              .filter((rev) => rev.type === "user_onboard")
              .forEach((rev) => {
                // Since data is sorted by date descending, the first one we see for a user is the latest.
                // Store the screenshot URL if it exists.
                if (!paidStatus[rev.leadId] && rev.paymentScreenshot) {
                  paidStatus[rev.leadId] = rev.paymentScreenshot;
                }
              });
            setPaidUsersStatus(paidStatus);
          } else {
            setRevenueCount(data.userOnboardCount || 0);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch revenue", err);
    }
  };

  const fetchAllUserPostsCounts = async () => {
    if (users.length === 0) return;

    try {
      const userIds = users.map((user) => user.userId);
      const res = await fetch("/api/post-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds }),
      });
      const result = await res.json();

      if (result.success) {
        const countsData = result.data;
        // Ensure all users have an entry, even if they have 0 posts
        const fullPostData = userIds.reduce((acc, userId) => {
          acc[userId] = countsData[userId] || {
            total: 0,
            posted: 0,
            approved: 0,
            rejected: 0,
            pending: 0,
          };
          return acc;
        }, {});

        setUserPostsData(fullPostData);
      } else {
        // Handle error case, maybe set all to 0
        const zeroData = userIds.reduce((acc, userId) => {
          acc[userId] = {
            total: 0,
            posted: 0,
            approved: 0,
            rejected: 0,
            pending: 0,
          };
          return acc;
        }, {});
        setUserPostsData(zeroData);
        console.error("Failed to fetch bulk post counts:", result.error);
      }
    } catch (err) {
      console.error("Error fetching posts counts:", err);
    }
  };

  const fetchChatStats = async () => {
    try {
      const res = await fetch("/api/issue-check");
      const result = await res.json();
      if (result.success) {
        const chats = result.data || [];
        const total = chats.length;
        const todayDate = new Date();
        const today = chats.filter((c) => {
          if (!c.createdAt) return false;
          const chatDate = new Date(c.createdAt);
          return (
            chatDate.getDate() === todayDate.getDate() &&
            chatDate.getMonth() === todayDate.getMonth() &&
            chatDate.getFullYear() === todayDate.getFullYear()
          );
        }).length;
        const resolved = chats.filter((c) => c.status === "resolved").length;
        setChatStats({ total, today, resolved, data: chats });
      }
    } catch (error) {
      console.error("Error fetching chat stats:", error);
    }
  };

  const fetchIssues = async () => {
    try {
      const res = await fetch("/api/issue-check");
      const result = await res.json();
      if (result.success) {
        setIssues(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching issues:", error);
    }
  };

  const fetchTodayUsersCount = async () => {
    const adminEmail = localStorage.getItem("email");
    if (!adminEmail) return;
    try {
      const params = new URLSearchParams({
        email: adminEmail,
        getTodayUsersCount: "true",
      });
      const res = await fetch(`/api/users?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setTodayUsersCount(data.todayUsersCount || 0);
        setTodayUsersMetaLeads(data.todayMetaLeads || 0);
        setTodayUsersSignups(data.todaySignups || 0);
        setTodayLeadWindowLabel(data.todayWindow?.displayLabel || "");
      }
    } catch (error) {
      console.error("Error fetching today's users count:", error);
    }
  };

  const handleResolveIssue = async (id) => {
    try {
      const res = await fetch("/api/issue-check", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "resolved" }),
      });
      const data = await res.json();
      if (data.success) {
        fetchChatStats();
        fetchIssues();
      }
    } catch (error) {
      console.error("Error resolving issue:", error);
    }
  };

  const handleAssignChange = async (userId, newAgentId) => {
    try {
      console.log("🔄 Assign request started");

      // 1️⃣ Update Assigned Agent
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          assignedAgentId: newAgentId || null,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast(data.error || "Failed to assign agent", "error");
        return;
      }

      showToast("Agent assigned successfully", "success");

      const updatedAgent = data.user?.assignedAgentId || newAgentId;
      console.log("agentsagents", agents);

      // 2️⃣ Send WhatsApp Notification (ONLY if agent selected)
      if (newAgentId) {
        const agent = agents.find((a) => a._id === newAgentId);
        const user = users.find((u) => u.userId === userId);

        if (!agent || !user) {
          console.warn("Agent or User not found");
          return;
        }

        const payload = {
          firstName: user.fullName || "User",
          enquiryNo: user.userId,
          executiveName: agent.fullName || "Executive",
          executiveMobile: agent.mobile,
          userMobile: user.phone || user.mobileNumber,
        };

        try {
          const waRes = await fetch("/api/admin/assign-lead-whatsapp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          const waData = await waRes.json();

          if (!waRes.ok || !waData.success) {
            console.error("WhatsApp send failed:", waData);
          } else {
            console.log("✅ WhatsApp sent successfully");
          }
        } catch (err) {
          console.error("WhatsApp API error:", err);
        }
      }

      // 3️⃣ Update local state immediately
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.userId === userId
            ? { ...user, assignedAgentId: updatedAgent }
            : user,
        ),
      );

      // Update agent stats locally
      if (newAgentId) {
        setAgentStats((prev) => ({
          ...prev,
          [newAgentId]: (prev[newAgentId] || 0) + 1,
          unassigned: Math.max(0, (prev.unassigned || 0) - 1),
        }));
      }

      // fetchUsers(true); // Optional: refresh in background if needed
    } catch (error) {
      console.error("🚨 Assignment error:", error);
      showToast("Something went wrong while assigning.", "error");
    }
  };

  const handleRoundRobinAssign = (userId) => {
    if (agents.length === 0) {
      showToast("No agents available", "error");
      return;
    }

    // Find agent with minimum leads (Load Balancing)
    let minLeads = Infinity;
    let targetAgentId = agents[0]._id;

    agents.forEach((agent) => {
      const count = agentStats[agent._id] || 0;
      if (count < minLeads) {
        minLeads = count;
        targetAgentId = agent._id;
      }
    });

    handleAssignChange(userId, targetAgentId);
  };

  const handleLeadStageChange = async (userId, newStage) => {
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          leadStage: newStage,
        }),
      });

      const data = await res.json();

      if (data.success) {
        showToast("Lead stage updated successfully", "success");
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.userId === userId ? { ...user, leadStage: newStage } : user,
          ),
        );
      } else {
        showToast(data.error || "Failed to update lead stage", "error");
      }
    } catch (error) {
      console.error("Update lead stage error:", error);
      showToast("Something went wrong", "error");
    }
  };

  const handleLeadStatusChange = async (userId, newStatus) => {
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          leadStatus: newStatus,
        }),
      });

      const data = await res.json();

      if (data.success) {
        showToast("Lead status updated successfully", "success");
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.userId === userId ? { ...user, leadStatus: newStatus } : user,
          ),
        );
      } else {
        showToast(data.error || "Failed to update lead status", "error");
      }
    } catch (error) {
      console.error("Update lead status error:", error);
      showToast("Something went wrong", "error");
    }
  };

  const getAvatarColor = (name) => {
    if (!name) return "bg-gray-100 text-gray-600 border-gray-200";
    const colors = [
      "bg-red-50 text-red-700 border-red-200",
      "bg-orange-50 text-orange-700 border-orange-200",
      "bg-amber-50 text-amber-700 border-amber-200",
      "bg-green-50 text-green-700 border-green-200",
      "bg-emerald-50 text-emerald-700 border-emerald-200",
      "bg-teal-50 text-teal-700 border-teal-200",
      "bg-cyan-50 text-cyan-700 border-cyan-200",
      "bg-blue-50 text-blue-700 border-blue-200",
      "bg-indigo-50 text-indigo-700 border-indigo-200",
      "bg-violet-50 text-violet-700 border-violet-200",
      "bg-purple-50 text-purple-700 border-purple-200",
      "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
      "bg-pink-50 text-pink-700 border-pink-200",
      "bg-rose-50 text-rose-700 border-rose-200",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // ✅ Helper to safely get agent name from populated object or string ID
  const getAgentName = (assignedAgentId) => {
    // console.log("assignedAgentIdassignedAgentId", assignedAgentId);

    if (!assignedAgentId) return "Unassigned";

    // If it's a populated object with fullName
    if (typeof assignedAgentId === "object" && assignedAgentId?.fullName) {
      return assignedAgentId.fullName;
    }

    // If it's a string ID, try to find agent name in agents array
    if (typeof assignedAgentId === "string") {
      const agent = agents.find((a) => a._id === assignedAgentId);
      return agent?.fullName || "Unassigned";
    }

    return "Unassigned";
  };

  // When filters change, reset to the first page
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, filterDate, assigneeFilter]);

  const isUserConnected = (email) => {
    return connectedBusinessUsers.some(
      (connectedUser) =>
        connectedUser.email?.toLowerCase() === email?.toLowerCase(),
    );
  };

  useEffect(() => {
    if (planStartDate) {
      const start = new Date(planStartDate);
      const end = new Date(start);

      if (selectedCycle === "monthly") {
        end.setMonth(end.getMonth() + 1);
      } else if (selectedCycle === "quarterly") {
        end.setMonth(end.getMonth() + 3);
      } else if (selectedCycle === "half-yearly") {
        end.setMonth(end.getMonth() + 6);
      } else if (selectedCycle === "yearly") {
        end.setFullYear(end.getFullYear() + 1);
      }

      if (!isNaN(end.getTime())) {
        setPlanExpiryDate(end.toISOString().split("T")[0]);
      }
    }
  }, [planStartDate, selectedCycle]);

  const handleUpgradePlan = (user) => {
    setSelectedUser(user);
    setSelectedPlan(user.paidPackage || "Basic Plan");
    setSelectedCycle(user.planDuration || "monthly");
    const start = user.packageStartDate
      ? new Date(user.packageStartDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];
    setPlanStartDate(start);
    setUtrNumber("");
    setPlanAmount(""); // Reset amount
    setPlanScreenshot(null); // Reset screenshot
  };

 const confirmPlanChange = async () => {
    if (!selectedUser || !selectedPlan) return;

    // If amount is entered, screenshot is mandatory
    if (planAmount && parseFloat(planAmount) > 0 && !planScreenshot) {
      showToast(
        "Payment screenshot is required when amount is entered.",
        "error",
      );
      return;
    }

    setUpdating(selectedUser.userId);

    try {
      let screenshotUrl = null;
      // 1. Handle revenue recording if amount is provided
      if (planAmount && parseFloat(planAmount) > 0) {
        screenshotUrl = await uploadToCloudinary(planScreenshot);
        console.log("SENDING DATA:", {
          planRemarks: planRemarks,
          selectedPlan,
          amount: planAmount,
        });

        const revenueRes = await fetch("/api/franchise-revenue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            leadId: selectedUser.userId,
            leadName: selectedUser.fullName,
            amount: parseFloat(planAmount),
            paymentScreenshot: screenshotUrl,
            email: localStorage.getItem("email"),
            plan: selectedPlan,
            notes: `Plan upgrade to ${selectedPlan}`, // auto
            planRemarks: planRemarks,
            type: selectedPlan.toLowerCase().includes("seo")
              ? "selectedPlan"
              : "user_onboard",
          }),
        });

        const revenueData = await revenueRes.json();
        if (!revenueData.success) {
          throw new Error(revenueData.message || "Failed to record revenue.");
        }
      } else if (planScreenshot) {
        // If no amount but screenshot is there, just upload it for the user record
        screenshotUrl = await uploadToCloudinary(planScreenshot);
      }

      // 2. Update user plan details
      const userUpdateRes = await fetch(`/api/users`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.userId,
          isServiceBooked: true,
          paidPackage: selectedPlan,
          planDuration: selectedCycle,
          packageStartDate: planStartDate,
          packageExpiryDate: planExpiryDate,
          ...(screenshotUrl && { paymentScreenshot: screenshotUrl }),
          ...(utrNumber && { utrNumber: utrNumber }),
        }),
      });
      const userUpdateData = await userUpdateRes.json();
      if (userUpdateData.success) {
        showToast("User plan updated successfully!", "success");
        fetchUsers();
        if (planAmount && parseFloat(planAmount) > 0) {
          fetchRevenue(); // Refresh revenue only if it was added
        }
        setSelectedUser(null);
        setPlanScreenshot(null); // Reset after successful upload
        setPlanAmount("");
      } else {
        throw new Error(userUpdateData.error || "Failed to update plan");
      }
    } catch (err) {
      console.error("Error updating plan:", err);
      showToast(err.message, "error");
    } finally {
      setUpdating(null);
    }
  };

  const confirmDeleteUser = async () => {
    if (!deleteUserModal) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/users`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: deleteUserModal.userId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("User deleted successfully");
        fetchUsers();
        setDeleteUserModal(null);
      } else {
        showToast(data.error || "Failed to delete user", "error");
      }
    } catch (err) {
      console.error("Error deleting user:", err);
      showToast("Error deleting user", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // Function to send subscription expired notification via WhatsApp
  const sendSubscriptionExpiredNotification = async (user) => {
    try {
      // Normalize phone number
      let phone = user.phone || user.mobileNumber;
      if (phone) {
        phone = String(phone).replace(/\D/g, "");
        if (phone.length === 10) phone = "91" + phone;
      }

      if (!phone) {
        showToast("Phone number not found for user", "error");
        return;
      }

      const payload = {
        destination: phone,
        userName: user.fullName || "User",
        enquiryId: user.userId,
        expiryDate: user.packageExpiryDate
          ? new Date(user.packageExpiryDate).toLocaleDateString()
          : "N/A",
        plan: user.paidPackage || user.subscription?.plan || "N/A",
      };

      const res = await fetch("/api/admin/whatsapp-send-remarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          remark: "subscription_expired_new",
        }),
      });

      const data = await res.json();

      if (data.success) {
        showToast(
          "Subscription expiry notification sent via WhatsApp!",
          "success",
        );
      } else {
        showToast(`Failed: ${data.message}`, "error");
      }
    } catch (error) {
      console.error("Error sending WhatsApp:", error);
      showToast("Failed to send notification", "error");
    }
  };

  const getBulkWaCampaignByDate = (dateStr) => {
    const day = new Date(dateStr).getDay();
    if (day === 0) return null;
    return "demo_session_confirmation1";
  };

  const toggleBulkWaUserId = (userId) => {
    const id = String(userId);
    setBulkWaSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const selectAllBulkWaOnPage = () => {
    if (!bulkWaEligibleIdsOnPage.length) return;
    setBulkWaSelectedUserIds((prev) => {
      const allSelected = bulkWaEligibleIdsOnPage.every((id) =>
        prev.includes(id),
      );
      return allSelected ? [] : [...bulkWaEligibleIdsOnPage];
    });
  };

  const sendBulkUserManagementWhatsApp = async () => {
    if (role !== "superAdmin") return;
    if (!bulkWaSendDate) {
      setBulkWaResult({
        success: false,
        message: "Please select a date for scheduling",
      });
      return;
    }
    const campaignName = getBulkWaCampaignByDate(bulkWaSendDate);
    if (!campaignName) {
      setBulkWaResult({
        success: false,
        message: "WhatsApp sending is disabled on Sunday",
      });
      return;
    }

    const usersPayload = filteredUsers
      .filter((u) => bulkWaSelectedUserIds.includes(String(u.userId)))
      .map((u) => {
        let num = u.phone || u.mobileNumber;
        if (!num) return null;
        num = String(num).replace(/\D/g, "");
        if (num.length === 10) num = `91${num}`;
        if (num.length !== 12) return null;
        return {
          customer_no_with_prefix: num,
          name: u.fullName || "User",
        };
      })
      .filter(Boolean);

    if (!usersPayload.length) {
      setBulkWaResult({
        success: false,
        message: "No valid phone numbers in selection",
      });
      return;
    }

    const adminEmail = localStorage.getItem("email");
    if (!adminEmail) {
      setBulkWaResult({ success: false, message: "Not logged in" });
      return;
    }

    setBulkWaSending(true);
    setBulkWaResult(null);
    try {
      const response = await fetch("/api/admin/user-management-bulk-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminEmail,
          users: usersPayload,
          campaignName,
          scheduleDate: bulkWaSendDate,
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        setBulkWaResult({
          success: false,
          message: json?.message || "Server error occurred",
        });
      } else {
        setBulkWaResult({
          success: json.success,
          message: json.message || "Message processed",
          sent: json.sent ?? 0,
        });
        if (json.success) {
          setBulkWaSelectedUserIds([]);
          setBulkWaShowPanel(false);
        }
      }
    } catch (error) {
      console.error("Bulk WhatsApp error:", error);
      setBulkWaResult({
        success: false,
        message: "Something went wrong while sending",
      });
    } finally {
      setBulkWaSending(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.fullName || !newUser.email) {
      alert("Please enter Full Name and Email");
      return;
    }

    try {
      const res = await fetch("/api/users/add", {
        method: "POST" /*  */,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      });

      const data = await res.json();

      if (data.success) {
        alert("User created successfully!");

        setNewUser({
          fullName: "",
          email: "",
          phone: "",
          plan: "Free",
        });

        setAddingUser(false);
        fetchUsers();
      } else {
        alert(data.error || "Failed to add user");
      }
    } catch (error) {
      console.error("Add user error:", error);
    }
  };

  const handleViewPosts = async (user) => {
    setServiceUser(null); // 🔥 IMPORTANT
    setViewingUserPosts(user);
    setActiveModal("posts");
    try {
      const res = await fetch(`/api/post-status?userId=${user.userId}`);
      const data = await res.json();
      if (data.success) {
        setUserPosts(data.data || []);
      } else {
        setUserPosts([]);
      }
    } catch (err) {
      console.error("Error fetching user posts:", err);
      setUserPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleOpenWalletModal = (user) => {
    setWalletModalUser(user);
    setWalletUpdate({ amount: "", type: "credit", reason: "" });
  };

  const handleUpdateWallet = async () => {
    if (!walletModalUser || !walletUpdate.amount || !walletUpdate.reason) {
      showToast("Please fill in all fields", "error");
      return;
    }

    const amount = parseFloat(walletUpdate.amount);
    if (isNaN(amount) || amount <= 0) {
      showToast("Please enter a valid amount", "error");
      return;
    }

    setUpdatingWallet(true);

    try {
      const walletRes = await fetch(
        `/api/auth/signup?userId=${walletModalUser.userId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: amount,
            type: walletUpdate.type === "credit" ? "add" : "deduct",
            reason: walletUpdate.reason,
          }),
        },
      );

      const walletData = await walletRes.json();

      if (walletData.message || walletData.success) {
        const newBalance = walletData.wallet || walletData.newBalance;
        showToast(
          `${walletData.message || "Wallet updated successfully"}! New balance: ${newBalance} coins`,
          "success",
        );
        setWalletModalUser(null);
        setWalletUpdate({ amount: "", type: "credit", reason: "" });
        fetchUsers();
      } else {
        showToast(walletData.error || "Failed to update wallet", "error");
      }
    } catch (err) {
      console.error("Error updating wallet:", err);
      showToast("An error occurred while updating the wallet", "error");
    } finally {
      setUpdatingWallet(false);
    }
  };
  const AdminPanelButton = async (userId) => {
    const adminToken = localStorage.getItem("token"); // 👈 tumhara existing token

    const res = await fetch("/api/admin/login-as-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`, // 👈 MUST
      },
      body: JSON.stringify({ userId }),
    });

    const data = await res.json();

    if (data.token) {
      localStorage.setItem("userToken", data.token);
      localStorage.setItem("impersonatedUser", userId);
      localStorage.setItem("userId", data.user.userId);
      localStorage.setItem("isImpersonating", "true");
      window.location.href = "/dashboard";
    }
  };

  const handleOpenRemarksModal = async (user) => {
    setRemarksModalUser(user);
    setRemarksInput("");
    setLoadingRemarks(true);
    try {
      const res = await fetch(`/api/users?userId=${user.userId}`);
      const data = await res.json();
      if (data.success && data.user) {
        setRemarksHistory(data.user.remarksHistory || []);
      } else {
        setRemarksHistory([]);
      }
    } catch (error) {
      console.error("Error fetching remarks:", error);
    } finally {
      setLoadingRemarks(false);
    }
  };

  const sendRemarkWhatsApp = async (user, remarkType) => {
    // 🔥 UI REMARK → BACKEND REMARK
    const remarkMap = {
      "Call Not Picked": "call_not_picked",
      "Not Interested": "not_interested",
      Interested: "interested",
      "Call Back Later": "call_back",
      "Wrong Number": "wrong_number_update",
      "Switch Off": "switch_off",
      "Meeting Scheduled": "meeting_scheduled_online",
    };

    const remark = remarkMap[remarkType];
    if (!remark) {
      console.warn("Invalid remark:", remarkType);
      return;
    }

    // 📞 Phone normalize
    let phone = user.phone || user.mobileNumber;
    if (phone) {
      phone = String(phone).replace(/\D/g, "");
      if (phone.length === 10) phone = "91" + phone;
    }
    if (!phone) {
      console.warn("Phone number missing");
      return;
    }

    let executiveMobile =
      user.assignedAgentId?.mobile || user.assignedAgentId?.mobileNumber;

    if (!executiveMobile && typeof window !== "undefined") {
      const adminName = (localStorage.getItem("adminName") || "").toLowerCase();
      const email = (localStorage.getItem("email") || "").toLowerCase();

      if (adminName.includes("aman") || email.includes("aman")) {
        executiveMobile = "919311587741";
      } else if (adminName.includes("moni") || email.includes("moni")) {
        executiveMobile = "917065021272";
      }
    }

    const payload = {
      destination: phone,
      userName: user.fullName || "User",
      enquiryId: user.userId,
      executiveName: user.assignedAgentId?.fullName || "Executive",
      executiveMobile: executiveMobile || "",
      remark: remark,
    };

    if (remarkType === "Meeting Scheduled" && meetingData.date) {
      payload.meetingDate = meetingData.date;
      payload.meetingTime = meetingData.date.split("T")[1];
      payload.meetingLink = meetingData.link;
      payload.meetingId = meetingData.meetingId;
      payload.passcode = meetingData.passcode;
    }

    // --- SEND EMAIL NOTIFICATION ---
    if (user.email) {
      const emailPayload = {
        email: user.email,
        userName: user.fullName || "User",
        enquiryId: user.userId,
        executiveName: user.assignedAgentId?.fullName || "Executive",
        executiveMobile: executiveMobile || "",
        remark: remark,
        meetingDate: payload.meetingDate,
        meetingTime: payload.meetingTime,
        meetingLink: payload.meetingLink,
        meetingId: payload.meetingId,
        passcode: payload.passcode,
      };
      fetch("/api/admin/email-send-remarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailPayload),
      }).catch((err) => console.error("Email send failed", err));
    }

    try {
      const res = await fetch("/api/admin/whatsapp-send-remarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        showToast(
          "Success! Remark has been successfully sent to the user via WhatsApp.",
          "success",
        );
        return true;
      } else {
        showToast(`Failed: ${data.message}`, "error");
        return false;
      }
    } catch (error) {
      console.error("Error sending WhatsApp:", error);
      showToast("WhatsApp send failed", "error");
      return false;
    }
  };

  const handleAddRemark = async () => {
    if (!remarksModalUser || !remarksInput.trim()) return;

    let messageSent = false;
    const remarkType = defaultRemarks.find((r) => remarksInput.startsWith(r));

    if (remarkType) {
      messageSent = await sendRemarkWhatsApp(remarksModalUser, remarkType);
    }

    // Get current admin info for call tracking
    const adminId = localStorage.getItem("adminId");
    const adminName = localStorage.getItem("adminName") || "Admin";

    let followUpIso = null;
    if (followUpDate) {
      const rawT =
        followUpTime && /^\d{1,2}:\d{2}$/.test(followUpTime.trim())
          ? followUpTime.trim()
          : "09:00";
      const [hh, mm] = rawT.split(":");
      const d = new Date(
        `${followUpDate}T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00`,
      );
      if (!Number.isNaN(d.getTime())) followUpIso = d.toISOString();
    }
    const hasValidPickerFu =
      Boolean(followUpIso) && !Number.isNaN(new Date(followUpIso).getTime());
    if (!hasValidPickerFu) {
      const trimmed = String(remarksInput).trim();
      const isFu = FOLLOW_UP_REMARKS.some((r) => trimmed.startsWith(r));
      if (isFu) {
        const prev = [...(remarksModalUser.remarksHistory || [])]
          .reverse()
          .find((r) => r.followUpDate);
        if (prev?.followUpDate) {
          followUpIso = new Date(prev.followUpDate).toISOString();
        } else {
          followUpIso = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        }
      } else {
        followUpIso = null;
      }
    }

    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: remarksModalUser.userId,
          remark: remarksInput,
          messageSent,
          agentId: adminId,
          agentName: adminName,
          ...(followUpIso &&
            !Number.isNaN(new Date(followUpIso).getTime()) && {
              followUpDate: followUpIso,
            }),
        }),
      });
      const data = await res.json();
      if (data.success) {
        const updatedUser = data.user;
        // Update in-memory list without full refetch
        setUsers((prev) =>
          prev.map((u) =>
            u.userId === updatedUser.userId ? { ...u, ...updatedUser } : u,
          ),
        );
        setRemarksHistory(updatedUser.remarksHistory || []);
        setRemarksInput("");
        setFollowUpDate("");
        setFollowUpTime("09:00");
        showToast("Remark added successfully", "success");
        setRemarksModalUser(null);
        const trimmedR = remarksInput.trim();
        const refreshFu =
          (followUpIso && !Number.isNaN(new Date(followUpIso).getTime())) ||
          FOLLOW_UP_REMARKS.some((r) => trimmedR.startsWith(r));
        if (refreshFu) {
          const adminEmail = localStorage.getItem("email");
          if (adminEmail) {
            fetch(
              `/api/admin/follow-up-stats?email=${encodeURIComponent(adminEmail)}&filter=${followUpFilter}`,
            )
              .then((r) => r.json())
              .then((d) => {
                if (d.success) {
                  setFollowUpLeads(d.stats.leads || []);
                  setFollowUpStats((prev) => ({ ...prev, ...d.stats }));
                }
              })
              .catch(() => {});
          }
        }
      } else {
        showToast(data.error || "Failed to add remark", "error");
      }
    } catch (error) {
      console.error("Error adding remark:", error);
      showToast("Error adding remark", "error");
    }
  };

  const handleVoiceCall = async (phone) => {
    if (!phone) {
      showToast("Phone number not found", "error");
      return;
    }

    setCallingUserId(phone);

    try {
      const res = await fetch("/api/twillo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to initiate call");
      }

      showToast("📞 Voice call initiated successfully!", "success");
    } catch (error) {
      console.error("Voice Call Error:", error);
      showToast(error.message || "Error initiating call", "error");
    } finally {
      setCallingUserId(null);
    }
  };
  const handleMeetingSubmit = async () => {
    if (!meetingData.date || !meetingData.link || !meetingData.meetingId) {
      showToast("Please enter Date, Meeting Link and Meeting ID", "error");
      return;
    }

    const adminName = localStorage.getItem("adminName") || "Admin";
    const remarkText = `Meeting Scheduled on ${meetingData.date} - ${adminName}`;

    // Send WhatsApp with meeting details
    const messageSent = await sendRemarkWhatsApp(
      remarksModalUser,
      "Meeting Scheduled",
    );

    // Get current admin info for call tracking
    const adminId = localStorage.getItem("userId");
    const adminNameForCall = localStorage.getItem("adminName") || "Admin";

    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: remarksModalUser.userId,
          remark: remarkText,
          messageSent,
          agentId: adminId,
          agentName: adminNameForCall,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const updatedUser = data.user;
        setUsers((prev) =>
          prev.map((u) =>
            u.userId === updatedUser.userId ? { ...u, ...updatedUser } : u,
          ),
        );
        setRemarksHistory(updatedUser.remarksHistory || []);
        setRemarksInput("");
        showToast("Meeting scheduled successfully", "success");
        setShowMeetingModal(false);
        setMeetingData({ date: "", link: "", meetingId: "", passcode: "" });
      } else {
        showToast(data.error || "Failed to save remark", "error");
      }
    } catch (error) {
      console.error("Error saving meeting remark:", error);
      showToast("Error saving meeting remark", "error");
    }
  };

  /* ---------------- HANDLE ONBOARD CLIENT SUBMISSION ---------------- */
  const handleOnboardSubmit = async () => {
    if (!onboardData.plan || !onboardData.amount || !onboardData.screenshot) {
      showToast("Please provide plan, amount and payment screenshot", "error");
      return;
    }

    setUploadingOnboard(true);

    try {
      // Upload screenshot to Cloudinary
      const screenshotUrl = await uploadToCloudinary(onboardData.screenshot);

      // Save onboard data to database
      const res = await fetch("/api/franchise-revenue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: onboardModalUser.userId,
          leadName: onboardModalUser.fullName,
          amount: parseFloat(onboardData.amount),
          paymentScreenshot: screenshotUrl,
          email: localStorage.getItem("email"),
          notes: onboardData.notes,
          plan: onboardData.plan,
          type: "user_onboard",
        }),
      });

      const data = await res.json();

      if (data.success) {
        showToast("Client onboarded successfully!", "success");
        setShowOnboardModal(false);
        setOnboardModalUser(null);
        setOnboardData({ plan: "", amount: "", screenshot: null, notes: "" });
        fetchRevenue(); // Refresh revenue data
      } else {
        showToast(data.message || "Failed to onboard client", "error");
      }
    } catch (error) {
      console.error("Error onboarding client:", error);
      showToast("Error onboarding client", "error");
    } finally {
      setUploadingOnboard(false);
    }
  };

  const handleUpdateRemarks = async () => {
    if (!remarksModalUser) return;

    try {
      const res = await fetch(`/api/users`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: remarksModalUser.userId,
          remarks: remarksInput,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.user) {
          setUsers((prev) =>
            prev.map((u) =>
              u.userId === data.user.userId ? { ...u, ...data.user } : u,
            ),
          );
        }
        showToast("Remarks updated successfully", "success");
        setRemarksModalUser(null);
      } else {
        showToast(data.error || "Failed to update remarks", "error");
      }
    } catch (err) {
      console.error("Error updating remarks:", err);
      showToast("Error updating remarks", "error");
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilterStatus("All");
    setFilterDate("All");
    setCustomStartDate("");
    setCustomEndDate("");
    setAssigneeFilter("All");
    setLeadStatusFilter("All");
    setLeadStageFilter("All");
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && pagination && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="w-84 h-84 mx-auto">
            <Lottie animationData={animationData} loop={true} />
          </div>
          {/* <p className="text-gray-600 font-medium">Loading users.</p> */}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-2 sm:p-3">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-top-5">
          <div
            className={`px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px] ${
              toast.type === "success"
                ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                : "bg-gradient-to-r from-red-500 to-rose-500 text-white"
            }`}
          >
            {toast.type === "success" ? (
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
            <div className="flex-1">
              <p className="font-semibold text-sm">{toast.message}</p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="hover:bg-white/10 rounded-full p-1 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-[98vw] mx-auto">
        {/* ── Agent Performance Dashboard ──────────────────────────────── */}
        {isAgent && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 mb-2 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Phone className="text-indigo-600" size={16} />
                </div>
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                  My Performance
                </h3>
              </div>
              <span className="text-xs text-gray-400">
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>

            {/* ── Row 1: Leads & Calls ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                {
                  label: "Today's Leads",
                  value: agentTodayLeads,
                  sub: "assigned today",
                  from: "from-teal-50",
                  to: "to-cyan-50",
                  border: "border-teal-100",
                  text: "text-teal-600",
                  bold: "text-teal-800",
                },
                {
                  label: "Total Leads",
                  value: stats.total ?? 0,
                  sub: "all-time assigned",
                  from: "from-indigo-50",
                  to: "to-blue-50",
                  border: "border-indigo-100",
                  text: "text-indigo-600",
                  bold: "text-indigo-800",
                },
                {
                  label: "Calls Today",
                  value: callStats?.myCallsToday ?? 0,
                  sub: "handled today",
                  from: "from-violet-50",
                  to: "to-purple-50",
                  border: "border-violet-100",
                  text: "text-violet-600",
                  bold: "text-violet-800",
                },
                {
                  label: "Total Calls",
                  value: callStats?.myCallsTotal ?? 0,
                  sub: "all-time calls",
                  from: "from-blue-50",
                  to: "to-sky-50",
                  border: "border-blue-100",
                  text: "text-blue-600",
                  bold: "text-blue-800",
                },
              ].map(({ label, value, sub, from, to, border, text, bold }) => (
                <div
                  key={label}
                  className={`bg-gradient-to-br ${from} ${to} rounded-lg p-2 border ${border}`}
                >
                  <p
                    className={`text-[10px] font-semibold uppercase tracking-wide ${text}`}
                  >
                    {label}
                  </p>
                  <p className={`text-lg font-bold mt-0.5 ${bold}`}>{value}</p>
                  <p className={`text-[10px] mt-0.5 ${text} opacity-70`}>
                    {sub}
                  </p>
                </div>
              ))}
            </div>

            {/* ── Row 2: Follow-up quick stats (clickable → filter leads below) ── */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {[
                {
                  key: "today",
                  label: "Today",
                  count: followUpStats.todayFollowUps,
                  bg: "bg-amber-500",
                  ring: "ring-amber-400",
                },
                {
                  key: "tomorrow",
                  label: "Tomorrow",
                  count: followUpStats.tomorrowFollowUps,
                  bg: "bg-rose-500",
                  ring: "ring-rose-400",
                },
                {
                  key: "next7days",
                  label: "Next 7 days",
                  count: followUpStats.next7DaysFollowUps,
                  bg: "bg-violet-500",
                  ring: "ring-violet-400",
                },
                {
                  key: "thisMonth",
                  label: "This Month",
                  count: followUpStats.thisMonthFollowUps,
                  bg: "bg-emerald-500",
                  ring: "ring-emerald-400",
                },
                {
                  key: "all",
                  label: "All Time",
                  count: followUpStats.totalFollowUps,
                  bg: "bg-gray-600",
                  ring: "ring-gray-400",
                },
              ].map(({ key, label, count, bg, ring }) => {
                const active = followUpFilter === key;
                return (
                  <button
                    key={key}
                    onClick={() => setFollowUpFilter(key)}
                    className={`rounded-lg p-2 border-2 text-left transition-all ${
                      active
                        ? `${bg} text-white border-transparent ring-2 ${ring} shadow-md`
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    <p
                      className={`text-[9px] font-bold uppercase tracking-wide ${active ? "text-white/80" : "text-gray-500"}`}
                    >
                      Follow-ups
                    </p>
                    <p
                      className={`text-lg font-black mt-0.5 ${active ? "text-white" : "text-gray-800"}`}
                    >
                      {count}
                    </p>
                    <p
                      className={`text-[10px] mt-0.5 ${active ? "text-white/70" : "text-gray-400"}`}
                    >
                      {label}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Pending follow-ups — same bucket as the table filter */}

            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Stages &amp; temperature
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  {
                    label: "Active",
                    v: stageStats["Active"] ?? 0,
                    cls: "bg-green-50 text-green-800 border-green-200",
                  },
                  {
                    label: "Follow Up",
                    v: stageStats["Follow Up"] ?? 0,
                    cls: "bg-amber-50 text-amber-900 border-amber-200",
                  },
                  {
                    label: "Inactive",
                    v: stageStats["Inactive"] ?? 0,
                    cls: "bg-gray-50 text-gray-800 border-gray-200",
                  },
                  {
                    label: "Onboard",
                    v: stageStats["Onboard"] ?? 0,
                    cls: "bg-blue-50 text-blue-800 border-blue-200",
                  },
                  {
                    label: "Hot",
                    v: leadStatusStats.Hot ?? 0,
                    cls: "bg-red-50 text-red-800 border-red-200",
                  },
                  {
                    label: "Warm",
                    v: leadStatusStats.Warm ?? 0,
                    cls: "bg-orange-50 text-orange-800 border-orange-200",
                  },
                  {
                    label: "Cold",
                    v: leadStatusStats.Cold ?? 0,
                    cls: "bg-sky-50 text-sky-800 border-sky-200",
                  },
                ].map(({ label, v, cls }) => (
                  <div
                    key={label}
                    className={`rounded-md border px-2 py-1 text-center min-w-[3.1rem] ${cls}`}
                  >
                    <p className="text-[8px] font-bold uppercase opacity-80 leading-tight">
                      {label}
                    </p>
                    <p className="text-sm font-black leading-tight tabular-nums">
                      {v}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Chat stats + revenue (My Revenue / User Onboard Revenue in this row for agent & superAdmin) */}

        {/* ── Today's Lead Assignments per Agent (superAdmin / admin) ───── */}
        {false &&
          (role === "superAdmin" || role === "admin") &&
          todayStats.assignments.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-2 mb-0.5">
              {/* Header */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1">
                  <div className="w-6 h-6 bg-teal-100 rounded-md flex items-center justify-center">
                    <UserCheck className="text-teal-600" size={12} />
                  </div>
                  <h3 className="text-[11px] font-semibold text-gray-700 uppercase">
                    Today Lead Assignments
                  </h3>
                </div>

                <span className="bg-teal-50 text-teal-700 text-[10px] font-medium px-2 py-[2px] rounded-full border border-teal-200">
                  {todayStats.assignments.reduce(
                    (s, a) => s + (a.count || 0),
                    0,
                  )}
                </span>
              </div>

              {/* Cards */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {todayStats.assignments
                  .slice()
                  .sort((a, b) => (b.count || 0) - (a.count || 0))
                  .map((agent, idx) => {
                    const colors = [
                      ["bg-indigo-100", "text-indigo-800", "bg-indigo-500"],
                      ["bg-teal-100", "text-teal-800", "bg-teal-500"],
                      ["bg-blue-100", "text-blue-800", "bg-blue-500"],
                      ["bg-purple-100", "text-purple-800", "bg-purple-500"],
                    ];
                    const [bg, text, badge] = colors[idx % colors.length];

                    return (
                      <div
                        key={agent._id || idx}
                        className={`min-w-[98px] rounded-md px-2 py-1 border ${bg} flex flex-col`}
                      >
                        <div className="flex items-center gap-1">
                          <div
                            className={`w-4 h-4 rounded-full ${badge} flex items-center justify-center text-white text-[9px]`}
                          >
                            {(agent.agentName || "?")[0]}
                          </div>
                          <span className={`text-[9px] truncate ${text}`}>
                            {agent.agentName}
                          </span>
                        </div>

                        <span
                          className={`text-xs font-bold leading-tight ${text}`}
                        >
                          {agent.count || 0}
                        </span>

                        <span className="text-[9px] text-gray-400 leading-none">
                          leads
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

        <Paper
          elevation={0}
          sx={{
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
            p: 2,
            mb: 1,
          }}
        >
          {isAgent && followUpFilter !== "all" && (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold bg-gradient-to-r from-rose-50 via-indigo-50 to-indigo-50 text-indigo-900 border border-indigo-200/70 shadow-sm">
                <span className="text-indigo-600/90">Table filter:</span>
                <span className="text-rose-700">
                  {agentFollowUpFilterLabel}
                </span>
              </span>
            </div>
          )}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                xl: "2fr repeat(4, minmax(0, 1fr)) auto",
              },
              gap: 1.5,
              alignItems: "center",
            }}
          >
            <TextField
              size="small"
              fullWidth
              placeholder="Search by email, user ID, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={16} />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              startIcon={<Search size={16} />}
              sx={{ height: 40, textTransform: "none", fontWeight: 700 }}
            >
              Search
            </Button>

            <FormControl size="small" fullWidth>
              <InputLabel id="lead-stage-filter-label">Lead Stage</InputLabel>
              <Select
                labelId="lead-stage-filter-label"
                value={leadStageFilter}
                label="Lead Stage"
                onChange={(e) => setLeadStageFilter(e.target.value)}
              >
                <MenuItem value="All">All Stages</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Follow Up">Follow Up</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
                <MenuItem value="Onboard">Onboard</MenuItem>
              </Select>
            </FormControl>

            {(role === "superAdmin" ||
              role === "admin" ||
              role === "superfranchiseAdmin") && (
              <>
                <FormControl size="small" fullWidth>
                  <InputLabel id="assignee-filter-label">Assign To</InputLabel>
                  <Select
                    labelId="assignee-filter-label"
                    value={assigneeFilter}
                    label="Assign To"
                    onChange={(e) => setAssigneeFilter(e.target.value)}
                  >
                    <MenuItem value="All">All Agents</MenuItem>
                    <MenuItem value="Unassigned">Unassigned</MenuItem>
                    {agents.map((agent) => (
                      <MenuItem key={agent._id} value={agent._id}>
                        {agent.fullName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {(role === "superAdmin" ||
                  role === "admin" ||
                  role === "superfranchiseAdmin") && (
                  <FormControl size="small" fullWidth>
                    <InputLabel id="lead-status-filter-label">
                      Lead Status
                    </InputLabel>
                    <Select
                      labelId="lead-status-filter-label"
                      value={leadStatusFilter}
                      label="Lead Status"
                      onChange={(e) => setLeadStatusFilter(e.target.value)}
                    >
                      <MenuItem value="All">All Lead Status</MenuItem>
                      <MenuItem value="Hot">Hot Leads</MenuItem>
                      <MenuItem value="Warm">Warm Leads</MenuItem>
                      <MenuItem value="Cold">Cold Leads</MenuItem>
                      <MenuItem value="Untagged">None</MenuItem>
                    </Select>
                  </FormControl>
                )}
              </>
            )}

            <FormControl size="small" fullWidth>
              <InputLabel id="date-filter-label">Date Range</InputLabel>
              <Select
                labelId="date-filter-label"
                value={filterDate}
                label="Date Range"
                onChange={(e) => setFilterDate(e.target.value)}
              >
                <MenuItem value="All">All Time</MenuItem>
                <MenuItem value="Today">Today</MenuItem>
                <MenuItem value="Last 7 Days">Last 7 Days</MenuItem>
                <MenuItem value="Last 30 Days">Last 30 Days</MenuItem>
                <MenuItem value="This Month">This Month</MenuItem>
                <MenuItem value="Custom Range">Custom Range</MenuItem>
              </Select>
            </FormControl>

            {filterDate === "Custom Range" && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  gridColumn: { xs: "1 / -1", xl: "1 / span 2" },
                }}
              >
                <TextField
                  size="small"
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  fullWidth
                />
                <span className="text-sm text-gray-500">to</span>
                <TextField
                  size="small"
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  fullWidth
                />
              </Box>
            )}

            {(searchQuery ||
              filterStatus !== "All" ||
              filterDate !== "All" ||
              assigneeFilter !== "All" ||
              leadStatusFilter !== "All") && (
              <Button
                onClick={clearFilters}
                variant="outlined"
                color="inherit"
                startIcon={<X size={16} />}
                sx={{ height: 40, textTransform: "none", fontWeight: 600 }}
              >
                Clear
              </Button>
            )}
          </Box>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            border: "1px solid #dbe1ea",
            borderRadius: "16px",
            overflow: "hidden",
            backgroundColor: "#fff",
          }}
        >
             {(role === "superAdmin" ||
                      role === "admin" || role === "agent" ||
                      role === "superfranchiseAdmin") && (
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 2,
                          px: { xs: 2, sm: 2.5 },
                          py: { xs: 1.75, sm: 2 },
                          borderBottom: "1px solid",
                          borderColor: "divider",
                          background: (theme) =>
                            `linear-gradient(120deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(theme.palette.success.main, 0.05)} 50%, ${alpha(theme.palette.primary.main, 0.04)} 100%)`,
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: 800,
                              letterSpacing: "-0.02em",
                              color: "text.primary",
                              lineHeight: 1.3,
                            }}
                          >
                            Leads
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                            Manage records and sync from Meta
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap" useFlexGap>
                          <Button
                            variant="contained"
                            onClick={() => setAddingUser(true)}
                            startIcon={<Plus size={18} strokeWidth={2.5} />}
                            sx={{
                              textTransform: "none",
                              fontWeight: 700,
                              borderRadius: 2,
                              px: 2.5,
                              py: 1,
                              boxShadow: (theme) => `0 4px 14px ${alpha(theme.palette.success.main, 0.35)}`,
                              background: (theme) =>
                                `linear-gradient(135deg, ${theme.palette.success.dark} 0%, ${theme.palette.success.main} 100%)`,
                              "&:hover": {
                                background: (theme) =>
                                  `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.light} 100%)`,
                                boxShadow: (theme) => `0 6px 20px ${alpha(theme.palette.success.main, 0.4)}`,
                              },
                            }}
                          >
                            Add Lead
                          </Button>
                          <Button
                            variant="outlined"
                            disabled={isRefreshingMetaLeads}
                            onClick={() => handleRefreshMetaLeads({ silent: false })}
                            startIcon={
                              <RefreshCw
                                size={16}
                                className={isRefreshingMetaLeads ? "animate-spin" : ""}
                              />
                            }
                            sx={{
                              textTransform: "none",
                              fontWeight: 700,
                              borderRadius: 2,
                              px: 2.25,
                              py: 1,
                              borderWidth: 2,
                              borderColor: "primary.main",
                              color: "primary.main",
                              "&:hover": {
                                borderWidth: 2,
                                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                                borderColor: "primary.dark",
                              },
                              "&.Mui-disabled": {
                                borderWidth: 2,
                              },
                            }}
                          >
                            Refresh
                          </Button>
                        </Stack>
                      </Box>
                    )}
          {role === "superAdmin" && (
            <>
              {bulkWaSelectedUserIds.length > 0 && (
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-5 md:px-8 border-b border-white/10">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex items-center gap-3 text-white">
                      <div className="bg-white/20 rounded-full p-3">
                        <MessageSquare className="text-white" size={24} />
                      </div>
                      <div>
                        <p className="text-sm opacity-90">Selected leads</p>
                        <p className="text-2xl font-bold">
                          {bulkWaSelectedUserIds.length}
                        </p>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => setBulkWaShowPanel(true)}
                        className="flex items-center justify-center gap-2 bg-white text-green-600 px-4 py-3 rounded-lg font-medium hover:bg-green-50 transition shadow-md min-w-[160px]"
                      >
                        <MessageSquare size={20} />
                        WhatsApp
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {bulkWaShowPanel && bulkWaSelectedUserIds.length > 0 && (
                <div className="bg-white px-4 py-6 md:px-8 border-b border-indigo-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <MessageSquare className="text-green-600" size={22} />
                      Send WHATSAPP to {bulkWaSelectedUserIds.length} leads
                    </h3>
                    <button
                      type="button"
                      onClick={() => setBulkWaShowPanel(false)}
                      className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100"
                      aria-label="Close"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Schedule Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                        value={bulkWaSendDate}
                        onChange={(e) => setBulkWaSendDate(e.target.value)}
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={sendBulkUserManagementWhatsApp}
                        disabled={bulkWaSending}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-2.5 rounded-lg font-medium transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {bulkWaSending ? (
                          <>
                            <RefreshCw size={18} className="animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send size={18} />
                            Send WHATSAPP
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {bulkWaResult && (
                <div
                  className={`mx-4 md:mx-8 mb-4 p-5 rounded-2xl shadow-lg border-l-4 ${
                    bulkWaResult.success
                      ? "bg-green-50 text-green-800 border-green-500"
                      : "bg-red-50 text-red-800 border-red-500"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className="font-bold text-lg mb-1">
                        {bulkWaResult.success ? "✓ Success" : "✗ Error"}
                      </p>
                      <p>{bulkWaResult.message}</p>
                      {bulkWaResult.sent !== undefined && (
                        <p className="mt-2 font-semibold">
                          Messages sent: {bulkWaResult.sent}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setBulkWaResult(null)}
                      className="text-gray-500 hover:text-gray-700 p-1"
                      aria-label="Dismiss"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          <TableContainer
            sx={{
              maxHeight: { xs: "60vh", md: "72vh" },
              overflowX: "auto",
            }}
          >
            <div ref={tableRef} className="max-h-[500px] overflow-x-auto pb-1">
              <table className="min-w-full">
                <thead className="sticky top-0 z-20 bg-slate-100/95 backdrop-blur"> 
                  <tr>
                    {role === "superAdmin" && (
                      <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200 w-14">
                        <input
                          type="checkbox"
                          title="Select all leads with phone on this page"
                          checked={
                            bulkWaEligibleIdsOnPage.length > 0 &&
                            bulkWaEligibleIdsOnPage.every((id) =>
                              bulkWaSelectedUserIds.includes(id),
                            )
                          }
                          onChange={selectAllBulkWaOnPage}
                          className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                        />
                      </th>
                    )}
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                      {isAgent && followUpFilter !== "all"
                        ? "Follow-up"
                        : "Joined Date"}
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                      User Name
                    </th>
                    {/* <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                    Plan
                  </th> */}
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                      Assign To
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                      Remarks
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                      Lead Stage
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                      Contact
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                      Chat
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                      Service
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                      Wallet
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                      Posts
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                      Business Name
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {loadingFollowUpTable &&
                  isAgent &&
                  followUpFilter !== "all" ? (
                    <tr>
                      <td
                        colSpan={role === "superAdmin" ? 13 : 12}
                        className="text-center py-14"
                      >
                        <div className="flex flex-col items-center justify-center gap-2 text-indigo-600">
                          <RefreshCw
                            size={28}
                            className="animate-spin opacity-80"
                          />
                          <p className="text-sm font-semibold text-gray-700">
                            Loading follow-ups ({agentFollowUpFilterLabel})…
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <>
                      {filteredUsers.map((user, rowIndex) => {
                        const postData = userPostsData[user.userId] || {
                          total: 0,
                          posted: 0,
                          rejected: 0,
                        };
                        return (
                          <tr
                            key={user._id}
                            className={`cursor-pointer transition-colors ${
                              rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                            } hover:bg-indigo-50/50`}
                            onClick={() => handleViewPosts(user)}
                          >
                            {role === "superAdmin" && (
                              <td
                                className="px-3 py-5 w-14 align-middle"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="checkbox"
                                  disabled={!(user.phone || user.mobileNumber)}
                                  title={
                                    user.phone || user.mobileNumber
                                      ? "Select for WhatsApp"
                                      : "No phone on record"
                                  }
                                  checked={bulkWaSelectedUserIds.includes(
                                    String(user.userId),
                                  )}
                                  onChange={() => toggleBulkWaUserId(user.userId)}
                                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                />
                              </td>
                            )}
                            <td className="px-6 py-5">
                              {isAgent && followUpFilter !== "all" ? (
                                (() => {
                                  const raw = followUpMetaByUserId.get(
                                    String(user.userId),
                                  );
                                  const d = raw ? new Date(raw) : null;
                                  const valid = d && !Number.isNaN(d.getTime());
                                  const now = new Date();
                                  const tmr = new Date(now);
                                  tmr.setDate(tmr.getDate() + 1);
                                  const sameDay = (a, b) =>
                                    valid &&
                                    a.getFullYear() === b.getFullYear() &&
                                    a.getMonth() === b.getMonth() &&
                                    a.getDate() === b.getDate();
                                  const isFuToday = sameDay(d, now);
                                  const isFuTomorrow = sameDay(d, tmr);
                                  return (
                                    <div className="flex items-center gap-2">
                                      <Clock
                                        size={14}
                                        className="text-gray-400 shrink-0"
                                      />
                                      <div className="text-sm text-gray-700">
                                        {valid ? (
                                          <>
                                            <div className="font-medium">
                                              {d.toLocaleString("en-IN", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                hour12: true,
                                              })}
                                            </div>
                                            <div className="flex flex-wrap gap-1 mt-0.5">
                                              {isFuToday && (
                                                <span className="inline-block px-2 py-0.5 text-[10px] text-sky-800 bg-sky-100 rounded-full font-semibold">
                                                  Today
                                                </span>
                                              )}
                                              {isFuTomorrow && (
                                                <span className="inline-block px-2 py-0.5 text-[10px] text-rose-800 bg-rose-100 rounded-full font-semibold">
                                                  Tomorrow
                                                </span>
                                              )}
                                            </div>
                                          </>
                                        ) : (
                                          <span className="text-gray-400 italic">
                                            N/A
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })()
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Calendar
                                    size={14}
                                    className="text-gray-400"
                                  />
                                  <div className="text-sm text-gray-700">
                                    {user.createdAt ? (
                                      <>
                                        <div className="font-medium">
                                          {new Date(
                                            user.createdAt,
                                          ).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                          })}
                                        </div>
                                        {new Date(
                                          user.createdAt,
                                        ).toDateString() ===
                                          new Date().toDateString() && (
                                          <span className="inline-block mt-0.5 px-2 py-0.5 text-xs text-blue-700 bg-blue-100 rounded-full font-semibold">
                                            Today
                                          </span>
                                        )}
                                      </>
                                    ) : (
                                      <span className="text-gray-400 italic">
                                        N/A
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </td>

                            <td className="px-6 py-5">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  {user.fullName && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                      <User2Icon
                                        size={14}
                                        className="text-gray-400"
                                      />
                                      {user.fullName}
                                    </div>
                                  )}
                                  {paidUsersStatus[user.userId] && ( // A URL exists for this user
                                    <>
                                      <span className="inline-block px-2 py-0.5 text-[10px] font-semibold text-green-700 bg-green-100 rounded-full border border-green-200">
                                        Paid
                                      </span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setFullViewImage(
                                            paidUsersStatus[user.userId],
                                          );
                                        }}
                                        className="p-1 hover:bg-gray-200 rounded-full"
                                        title="View Payment Screenshot"
                                      >
                                        <Eye
                                          size={14}
                                          className="text-gray-500"
                                        />
                                      </button>
                                    </>
                                  )}
                                </div>

                                <div onClick={(e) => e.stopPropagation()}>
                                  <select
                                    value={user.leadStatus || ""}
                                    onChange={(e) =>
                                      handleLeadStatusChange(
                                        user.userId,
                                        e.target.value,
                                      )
                                    }
                                    className={`mt-1 px-2 py-0.5 rounded text-[10px] font-semibold border outline-none cursor-pointer transition-all ${
                                      user.leadStatus === "Hot"
                                        ? "bg-red-50 text-red-700 border-red-200"
                                        : user.leadStatus === "Warm"
                                          ? "bg-orange-50 text-orange-700 border-orange-200"
                                          : user.leadStatus === "Cold"
                                            ? "bg-blue-50 text-blue-700 border-blue-200"
                                            : "bg-gray-50 text-gray-600 border-gray-200"
                                    }`}
                                  >
                                    <option value="">Untagged</option>
                                    <option value="Hot">Hot</option>
                                    <option value="Warm">Warm</option>
                                    <option value="Cold">Cold</option>
                                  </select>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {(user.source === "bulk-upload" ||
                                    user.source === "Meta Leads") && (
                                    <span className="inline-block px-2 py-0.5 text-[10px] font-semibold text-blue-700 bg-blue-100 rounded-full">
                                      Meta Leads
                                    </span>
                                  )}
                                  {user.paidPackage && (
                                    <span className="inline-block px-2 py-0.5 text-[10px] font-semibold text-amber-700 bg-amber-100 rounded-full">
                                      {user.paidPackage}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td
                              className="px-6 py-5 whitespace-nowrap"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {role === "superAdmin" ||
                              role === "admin" ||
                              role === "superfranchiseAdmin" ? (
                                <div
                                  className={`relative inline-flex items-center rounded-full border ${getAvatarColor(
                                    getAgentName(user.assignedAgentId),
                                  )}`}
                                >
                                  <select
                                    className="
                             appearance-none bg-transparent 
                             px-4 py-1.5 pr-8 
                             text-xs font-bold 
                             focus:outline-none 
                             cursor-pointer
                                            "
                                    value={
                                      // ✅ Handle populated object, string ID, null, and undefined
                                      user.assignedAgentId?._id ||
                                      (typeof user.assignedAgentId ===
                                        "string" &&
                                        user.assignedAgentId) ||
                                      ""
                                    }
                                    onChange={(e) =>
                                      handleAssignChange(
                                        user.userId,
                                        e.target.value,
                                      )
                                    }
                                  >
                                    <option value="">-- Unassigned --</option>

                                    {agents.map((agent) => (
                                      <option key={agent._id} value={agent._id}>
                                        {agent.fullName}
                                      </option>
                                    ))}
                                  </select>

                                  {!user.assignedAgentId && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRoundRobinAssign(user.userId);
                                      }}
                                      className="absolute -right-8 p-1 bg-indigo-100 text-indigo-600 rounded-full hover:bg-indigo-200 transition-colors"
                                      title="Auto Assign (Round Robin)"
                                    >
                                      <RefreshCw size={12} />
                                    </button>
                                  )}

                                  <span className="pointer-events-none absolute right-2 flex items-center">
                                    <ChevronDown className="h-3 w-3" />
                                  </span>
                                </div>
                              ) : (
                                <span
                                  className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold border ${getAvatarColor(
                                    getAgentName(user.assignedAgentId),
                                  )}`}
                                >
                                  {getAgentName(user.assignedAgentId)}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenRemarksModal(user);
                                }}
                                className="group cursor-pointer flex flex-col items-start gap-1.5"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center justify-center h-7 px-2.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 group-hover:bg-indigo-100 group-hover:border-indigo-200 transition-all shadow-sm">
                                    <MessageSquare
                                      size={14}
                                      className="mr-1.5"
                                    />
                                    <span className="font-bold text-xs">
                                      {user.remarksHistory?.length || 0}
                                    </span>
                                  </div>
                                </div>

                                {user.Remarks ? (
                                  <div className="text-[11px] leading-tight text-white-600 bg-green-100 px-2 py-1.5 rounded-md border border-gray-100 max-w-[180px] truncate group-hover:bg-green group-hover:shadow-sm transition-all flex items-center">
                                    <span className="font-semibold text-gray-800 mr-1">
                                      Latest:
                                    </span>
                                    <span className="truncate">
                                      {user.Remarks}
                                    </span>
                                    {user.remarksHistory &&
                                      user.remarksHistory.length > 0 &&
                                      user.remarksHistory[
                                        user.remarksHistory.length - 1
                                      ].messageSent && (
                                        <CheckCircle
                                          size={12}
                                          className="text-green-600 ml-1 flex-shrink-0"
                                        />
                                      )}
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-gray-400 italic pl-1">
                                    Tap to add...
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="px-6 py-5">
                              <select
                                value={user.leadStage || "Active"}
                                onChange={(e) =>
                                  handleLeadStageChange(
                                    user.userId,
                                    e.target.value,
                                  )
                                }
                                onClick={(e) => e.stopPropagation()}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border outline-none cursor-pointer transition-all ${
                                  user.leadStage === "Active"
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : user.leadStage === "Follow Up"
                                      ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                      : user.leadStage === "Onboard"
                                        ? "bg-blue-50 text-blue-700 border-blue-200"
                                        : "bg-gray-50 text-gray-700 border-gray-200"
                                }`}
                              >
                                <option value="Active">Active</option>
                                <option value="Follow Up">Follow Up</option>
                                <option value="Inactive">Inactive</option>
                                <option value="Onboard">Onboard</option>
                              </select>
                            </td>

                            <td className="px-6 py-5">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                  <Mail size={14} className="text-gray-400" />
                                  {user.email}
                                </div>
                                {user.phone && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Phone
                                      size={14}
                                      className="text-gray-400"
                                    />
                                    {user.phone}
                                  </div>
                                )}
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpgradePlan(user);
                                }}
                                className="p-1.5 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-all"
                                title="Change Plan"
                              >
                                <Crown size={16} />
                              </button>
                            </td>

                            <td className="px-6 py-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();

                                  handleOpenServiceModal(user);
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                                title="Add Service"
                              >
                                🛡️
                              </button>
                            </td>

                            <td className="px-6 py-5">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenWalletModal(user);
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 rounded-lg hover:from-emerald-100 hover:to-green-100 transition-all border border-emerald-200"
                                >
                                  <Wallet size={16} />
                                  <span className="font-bold text-base">
                                    {user.wallet || 0}
                                  </span>
                                  <span className="text-xs font-medium">
                                    coins
                                  </span>
                                </button>
                              </div>
                            </td>

                            <td className="px-6 py-5">
                              <div className="flex items-center gap-2">
                                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg px-3 py-2 border border-indigo-200">
                                  <div className="flex items-center gap-3">
                                    <div className="text-center">
                                      <p className="text-xs text-gray-600">
                                        Total
                                      </p>
                                      <p className="text-lg font-bold text-indigo-600">
                                        {postData.total}
                                      </p>
                                    </div>
                                    <div className="w-px h-8 bg-gray-300"></div>
                                    <div className="text-center">
                                      <p className="text-xs text-green-600">
                                        Posted
                                      </p>
                                      <p className="text-lg font-bold text-green-600">
                                        {postData.posted}
                                      </p>
                                    </div>
                                    <div className="w-px h-8 bg-gray-300"></div>
                                    <div className="text-center">
                                      <p className="text-xs text-red-600">
                                        Rejected
                                      </p>
                                      <p className="text-lg font-bold text-red-600">
                                        {postData.rejected}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-5">
                              <div onClick={(e) => e.stopPropagation()}>
                                <AddAddUserActivity userId={user.userId} />
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              {user.businessListings &&
                              user.businessListings.length > 0 ? (
                                <div>
                                  <div className="font-semibold text-gray-800">
                                    {user.businessListings[0].title}{" "}
                                    {user.businessListings[0].address.locality}
                                  </div>
                                  {user.businessListings.length > 1 && (
                                    <Link
                                      href={`/admin/user-listings?userId=${user.userId}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-xs text-blue-600 hover:underline mt-1"
                                    >
                                      View More (
                                      {user.businessListings.length - 1})
                                    </Link>
                                  )}
                                </div>
                              ) : (
                                <div className="text-xs text-gray-500 italic">
                                  Waiting......
                                </div>
                              )}
                            </td>

                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    AdminPanelButton(user.userId);
                                  }}
                                  disabled={impersonatingUser === user.userId}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap disabled:bg-blue-400"
                                >
                                  {impersonatingUser === user.userId ? (
                                    <div className="flex justify-center items-center">
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                    </div>
                                  ) : (
                                    "Login"
                                  )}
                                </button>
                                {(role === "superAdmin" ||
                                  role === "agent") && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOnboardModalUser(user);
                                      setShowOnboardModal(true);
                                    }}
                                    className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-all"
                                    title="Onboard Client"
                                  >
                                    <CheckCircle size={16} />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    sendSubscriptionExpiredNotification(user);
                                  }}
                                  className="p-1.5 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-all"
                                  title="Send Expiry Notification"
                                >
                                  <Bell size={16} />
                                </button>
                                {role === "superAdmin" && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteUserModal(user);
                                    }}
                                    className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all"
                                    title="Delete User"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleVoiceCall(
                                      user.phone || user.mobileNumber,
                                    );
                                  }}
                                  disabled={callingUserId === user.userId}
                                  className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all disabled:opacity-50"
                                  title="Voice Call"
                                >
                                  {callingUserId === user.userId ? (
                                    <RefreshCw
                                      size={16}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Phone size={16} />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {!loadingFollowUpTable && filteredUsers.length === 0 && (
                        <tr>
                          <td
                            colSpan={role === "superAdmin" ? 13 : 12}
                            className="text-center py-12"
                          >
                            <div className="text-gray-400">
                              <Search
                                size={48}
                                className="mx-auto mb-3 opacity-50"
                              />
                              <p className="text-lg font-medium">
                                No users found
                              </p>
                              <p className="text-sm">
                                Try adjusting your search or filters
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </TableContainer>

          <div
  ref={bottomRef}
  className="overflow-x-auto h-[15px]"
  onScroll={() => {
    if (tableRef.current && bottomRef.current) {
      tableRef.current.scrollLeft = bottomRef.current.scrollLeft;
    }
  }}
>
  <div
    style={{
      width: tableRef.current?.scrollWidth || "2000px"
    }}
    className="h-[1px]"
  />
</div>
          


        </Paper>
        {/* Pagination Controls */}
        {isAgent && followUpFilter !== "all" ? (
          <div className="mt-2 flex items-center justify-center sm:justify-between gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
              <span className="font-semibold text-gray-800">
                Showing {filteredUsers.length} users
              </span>
              <span className="text-gray-400"> · </span>
              <span className="text-indigo-700 font-medium">
                follow-up: {agentFollowUpFilterLabel}
              </span>
            </p>
          </div>
        ) : (
          pagination &&
          pagination.totalPages > 1 && (
            <div className="mt-2 flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
              <span className="text-sm text-gray-600">
                Page{" "}
                <span className="font-semibold">{pagination.currentPage}</span>{" "}
                of{" "}
                <span className="font-semibold">{pagination.totalPages}</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.totalPages}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
              <span className="text-sm text-gray-600">
                Total Users:{" "}
                <span className="font-semibold">{pagination.totalUsers}</span>
              </span>
            </div>
          )
        )}
      </div>

      {/* Wallet Update Modal */}
      {walletModalUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl transform transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg">
                  <Wallet className="text-white" size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-800">
                  Update Wallet
                </h2>
              </div>
              <button
                onClick={() => setWalletModalUser(null)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-0.5">User</p>
              <p className="font-semibold text-sm text-gray-800">
                {walletModalUser.email}
              </p>
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-600">Current Balance</p>
                <p className="text-xl font-bold text-emerald-600">
                  {walletModalUser.wallet || 0} coins
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Transaction Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      walletUpdate.type === "credit"
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value="credit"
                      checked={walletUpdate.type === "credit"}
                      onChange={(e) =>
                        setWalletUpdate({
                          ...walletUpdate,
                          type: e.target.value,
                        })
                      }
                      className="sr-only"
                    />
                    <div className="text-center">
                      <Plus
                        className={`mx-auto mb-0.5 ${walletUpdate.type === "credit" ? "text-green-600" : "text-gray-400"}`}
                        size={18}
                      />
                      <span
                        className={`text-sm font-semibold ${walletUpdate.type === "credit" ? "text-green-700" : "text-gray-600"}`}
                      >
                        Add
                      </span>
                    </div>
                  </label>
                  <label
                    className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      walletUpdate.type === "debit"
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value="debit"
                      checked={walletUpdate.type === "debit"}
                      onChange={(e) =>
                        setWalletUpdate({
                          ...walletUpdate,
                          type: e.target.value,
                        })
                      }
                      className="sr-only"
                    />
                    <div className="text-center">
                      <X
                        className={`mx-auto mb-0.5 ${walletUpdate.type === "debit" ? "text-red-600" : "text-gray-400"}`}
                        size={18}
                      />
                      <span
                        className={`text-sm font-semibold ${walletUpdate.type === "debit" ? "text-red-700" : "text-gray-600"}`}
                      >
                        Deduct
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Amount (Coins)
                </label>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={walletUpdate.amount}
                  onChange={(e) =>
                    setWalletUpdate({ ...walletUpdate, amount: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Reason
                </label>
                <input
                  type="text"
                  placeholder="e.g., admin add by bonus"
                  value={walletUpdate.reason}
                  onChange={(e) =>
                    setWalletUpdate({ ...walletUpdate, reason: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
                />
              </div>

              {walletUpdate.amount && (
                <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-0.5">
                    New Balance Preview
                  </p>
                  <p className="text-lg font-bold text-indigo-600">
                    {walletUpdate.type === "credit"
                      ? (
                          parseFloat(walletModalUser.wallet || 0) +
                          parseFloat(walletUpdate.amount || 0)
                        ).toFixed(2)
                      : (
                          parseFloat(walletModalUser.wallet || 0) -
                          parseFloat(walletUpdate.amount || 0)
                        ).toFixed(2)}{" "}
                    coins
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setWalletModalUser(null)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateWallet}
                disabled={updatingWallet}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {updatingWallet ? "Updating..." : "Update Wallet"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-10 overflow-y-auto">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl transform transition-all max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Upgrade Plan</h2>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
              <p className="text-sm text-gray-600 mb-1">User</p>
              <p className="font-semibold text-gray-800">
                {selectedUser.email}
              </p>
            </div>

            {subscriptionPlans && (
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar">
                {subscriptionPlans.billingCycles.map((cycle) => (
                  <button
                    key={cycle.cycle}
                    onClick={() => setSelectedCycle(cycle.cycle)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      selectedCycle === cycle.cycle
                        ? "bg-indigo-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {cycle.label}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-3 mb-6 max-h-[40vh] overflow-y-auto pr-1">
              {(subscriptionPlans
                ? subscriptionPlans.billingCycles.find(
                    (c) => c.cycle === selectedCycle,
                  )?.plans
                : ["Basic Plan", "Professional Plan", "Premium Plan"].map(
                    (p) => ({
                      title: p,
                    }),
                  )
              ).map((plan) => {
                const planName = plan.title || plan;
                return (
                  <label
                    key={planName}
                    className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      selectedPlan === planName
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <input
                        type="radio"
                        name="plan"
                        value={planName}
                        checked={selectedPlan === planName}
                        onChange={(e) => setSelectedPlan(e.target.value)}
                        className="w-4 h-4 text-indigo-600 shrink-0"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {planName.includes("Premium") && (
                            <Crown size={18} className="text-purple-600" />
                          )}
                          {planName.includes("Professional") && (
                            <Zap size={18} className="text-blue-600" />
                          )}
                          {planName.includes("Basic") && (
                            <Shield size={18} className="text-gray-600" />
                          )}
                          <span className="font-semibold text-gray-800">
                            {planName}
                          </span>
                        </div>

                        {plan.totalAmount && (
                          <div className="text-xs text-gray-500 mt-1 ml-7">
                            ₹{plan.totalAmount} / {plan.duration}
                          </div>
                        )}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Amount (₹){" "}
                  <span className="text-gray-400">(for new revenue)</span>
                </label>
                <input
                  type="number"
                  placeholder="e.g., 5000"
                  value={planAmount}
                  onChange={(e) => setPlanAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Start Date
                </label>
                <input
                  type="date"
                  value={planStartDate}
                  onChange={(e) => setPlanStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={planExpiryDate}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 outline-none text-sm cursor-not-allowed"
                />
              </div>
            </div>

            {/* Payment Screenshot Upload */}
            <div className="mb-6">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Payment Screenshot{" "}
                <span className="text-gray-400">(if amount entered)</span>
              </label>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-indigo-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setPlanScreenshot(file);
                    }
                  }}
                  className="hidden"
                  id="plan-screenshot-upload"
                />

                <label
                  htmlFor="plan-screenshot-upload"
                  className="flex flex-col items-center cursor-pointer"
                >
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />

                  <span className="text-sm text-gray-600">
                    {planScreenshot
                      ? planScreenshot.name
                      : "Click to upload payment screenshot"}
                  </span>

                  <span className="text-xs text-gray-400 mt-1">
                    PNG, JPG up to 10MB
                  </span>
                </label>
              </div>

              {/* UTR Number Field */}
              <div className="mt-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  UTR Number
                </label>

                <input
                  type="text"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  placeholder="Enter UTR / Transaction ID"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>

              {/* Remark Field */}
              <div className="mt-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Remark
                </label>

                <textarea
                  value={planRemarks}
                  onChange={(e) => setplanRemarks(e.target.value)}
                  placeholder="Enter remark..."
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedUser(null)}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium"
              >
                Cancel
              </button>

              <button
                onClick={confirmPlanChange}
                disabled={updating === selectedUser.userId}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-medium disabled:opacity-50"
              >
                {updating === selectedUser.userId ? "Updating..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remarks Modal */}
      {remarksModalUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-md shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-800">
                Remarks History
              </h2>
              <button
                onClick={() => setRemarksModalUser(null)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Add Remark Section (Input + Button in one line) */}
            <div className="flex items-center gap-2 mb-3">
              <input
                type="text"
                value={remarksInput}
                onChange={(e) => setRemarksInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddRemark()}
                className="flex-1 px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="Type a new remark..."
              />
              <button
                onClick={handleAddRemark}
                disabled={!remarksInput.trim()}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm font-medium text-sm whitespace-nowrap"
              >
                Submit
              </button>
            </div>

            {/* Follow-up date picker — shown when remark requires a callback */}
            {FOLLOW_UP_REMARKS.some((r) => remarksInput.startsWith(r)) && (
              <div className="mb-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Calendar size={13} className="text-amber-600" />
                  <span className="text-xs font-bold text-amber-700">
                    Schedule Follow-up
                  </span>
                  {followUpDate && (
                    <span className="ml-auto text-[10px] bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-semibold tabular-nums">
                      {new Date(
                        `${followUpDate}T${(followUpTime && /^\d{1,2}:\d{2}$/.test(followUpTime.trim()) ? followUpTime.trim() : "09:00").padStart(5, "0")}:00`,
                      ).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
                {/* Quick date buttons */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    { label: "Today", days: 0 },
                    { label: "Tomorrow", days: 1 },
                    { label: "Next 7 Days", days: 7 },
                    { label: "This Month", days: null },
                  ].map(({ label, days }) => {
                    const getDate = () => {
                      const d = new Date();
                      if (days === null) {
                        // last day of this month
                        d.setMonth(d.getMonth() + 1, 0);
                      } else {
                        d.setDate(d.getDate() + days);
                      }
                      return d.toISOString().split("T")[0];
                    };
                    const val = getDate();
                    const isActive = followUpDate === val;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setFollowUpDate(isActive ? "" : val)}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all ${
                          isActive
                            ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                            : "bg-white text-amber-700 border-amber-300 hover:bg-amber-100"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                {/* Custom date + time */}
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="date"
                    value={followUpDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="flex-1 min-w-[8rem] text-xs border border-amber-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-amber-400 outline-none bg-white"
                  />
                  <input
                    type="time"
                    value={followUpTime}
                    onChange={(e) => setFollowUpTime(e.target.value)}
                    disabled={!followUpDate}
                    className="text-xs border border-amber-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-amber-400 outline-none bg-white disabled:opacity-40"
                  />
                  {followUpDate && (
                    <button
                      type="button"
                      onClick={() => {
                        setFollowUpDate("");
                        setFollowUpTime("09:00");
                      }}
                      className="text-amber-500 hover:text-red-500 transition-colors"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Default Remarks */}
            <div className="flex flex-wrap gap-2 mb-3">
              {defaultRemarks.map((remark, idx) => (
                <button
                  key={idx}
                  onClick={() => handleDefaultRemarkClick(remark)}
                  className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-md hover:bg-indigo-100 hover:text-indigo-700 transition-colors border border-gray-200"
                >
                  {remark}
                </button>
              ))}
            </div>

            {/* Remarks List */}
            <div className="max-h-[300px] overflow-y-auto space-y-3 pr-1">
              {loadingRemarks ? (
                <div className="text-center py-6 text-gray-500 text-xs">
                  Loading history...
                </div>
              ) : !remarksHistory || remarksHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs flex flex-col items-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <MessageSquare size={20} className="mb-1 opacity-20" />
                  No remarks found
                </div>
              ) : (
                remarksHistory
                  .slice()
                  .reverse()
                  .map((r, idx) => {
                    const isLatest = idx === 0;

                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border transition-all shadow-sm
                    ${
                      isLatest
                        ? "bg-green-50 border-green-300"
                        : "bg-white border-gray-200"
                    }`}
                      >
                        {/* Top Row */}
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-semibold text-gray-600">
                            Remark
                          </span>

                          {isLatest && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-500 text-white font-bold">
                              Latest
                            </span>
                          )}
                        </div>

                        {/* Remark Text */}
                        <p className="text-sm text-gray-800 leading-relaxed">
                          {r.text}
                        </p>

                        {r.messageSent && (
                          <div className="flex items-center gap-1 mt-1">
                            <CheckCircle size={12} className="text-green-500" />
                            <span className="text-[10px] text-green-600 font-medium">
                              Message Sent
                            </span>
                          </div>
                        )}

                        {r.followUpDate && (
                          <div className="flex items-center gap-1 mt-1 bg-amber-50 rounded-lg px-2 py-0.5 w-fit">
                            <Calendar size={10} className="text-amber-500" />
                            <span className="text-[10px] text-amber-700 font-semibold">
                              Follow-up:{" "}
                              {new Date(r.followUpDate).toLocaleString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </span>
                          </div>
                        )}

                        {/* Timestamp */}
                        <p className="text-[9px] text-gray-400 mt-1 flex items-center justify-end gap-1">
                          <Calendar size={9} />
                          {new Date(r.createdAt).toLocaleString([], {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      )}

      {addingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 w-full max-w-md shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Add New User
              </h2>
              <button
                onClick={() => setAddingUser(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-700 dark:text-gray-300" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4 mb-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={newUser.fullName}
                  onChange={(e) =>
                    setNewUser({ ...newUser, fullName: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 
                       bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 
                       rounded-xl focus:ring-2 focus:ring-indigo-500 
                       focus:border-transparent outline-none"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 
                       bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 
                       rounded-xl focus:ring-2 focus:ring-indigo-500 
                       focus:border-transparent outline-none"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  placeholder="+91 9876543210"
                  value={newUser.phone}
                  onChange={(e) =>
                    setNewUser({ ...newUser, phone: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 
                       bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 
                       rounded-xl focus:ring-2 focus:ring-indigo-500 
                       focus:border-transparent outline-none"
                />
              </div>

              {/* Plan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Plan
                </label>
                <select
                  value={newUser.plan}
                  onChange={(e) =>
                    setNewUser({ ...newUser, plan: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 
                       bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 
                       rounded-xl focus:ring-2 focus:ring-indigo-500 
                       focus:border-transparent outline-none"
                >
                  <option value="Free">Free</option>
                  <option value="Basic">Basic</option>
                  <option value="Standard">Standard</option>
                  <option value="Premium">Premium</option>
                </select>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setAddingUser(false)}
                className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-800 
                     text-gray-700 dark:text-gray-200 rounded-xl 
                     hover:bg-gray-200 dark:hover:bg-gray-700 transition-all font-medium"
              >
                Cancel
              </button>

              <button
                onClick={handleAddUser}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 
                     text-white rounded-xl hover:from-green-700 hover:to-emerald-700 
                     transition-all font-medium"
              >
                Add User
              </button>
            </div>
          </div>
        </div>
      )}
      {activeModal === "posts" && viewingUserPosts && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">User Posts</h2>
                <p className="text-gray-600 text-sm mt-1">
                  {viewingUserPosts.email}
                </p>
              </div>
              <button
                onClick={() => {
                  setViewingUserPosts(null);
                  setActiveModal(null);
                  setUserPosts([]);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-6">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Wallet Balance</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {viewingUserPosts.wallet || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Posts</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {loadingPosts ? "..." : userPosts.length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Posted</p>
                  <p className="text-2xl font-bold text-green-600">
                    {loadingPosts
                      ? "..."
                      : userPosts.filter((p) => p.status === "posted").length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">
                    {loadingPosts
                      ? "..."
                      : userPosts.filter((p) => p.status === "rejected").length}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingPosts ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
                </div>
              ) : userPosts.length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500 font-medium">No posts yet</p>
                  <p className="text-gray-400 text-sm">
                    This user hasn't created any posts
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userPosts.map((post, index) => (
                    <div
                      key={post._id || index}
                      className="relative group bg-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition-all"
                    >
                      <div className="aspect-square relative">
                        <img
                          src={post.aiOutput}
                          alt={`Post ${index + 1}`}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => setFullViewImage(post.aiOutput)}
                          onError={(e) => {
                            e.target.src =
                              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23f3f4f6' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' font-size='16' text-anchor='middle' dy='.3em' fill='%239ca3af'%3ENo Image%3C/text%3E%3C/svg%3E";
                          }}
                        />

                        <div className="absolute top-2 right-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                              post.status === "posted"
                                ? "bg-green-100 text-green-700 border border-green-300"
                                : post.status === "rejected"
                                  ? "bg-red-100 text-red-700 border border-red-300"
                                  : "bg-yellow-100 text-yellow-700 border border-yellow-300"
                            }`}
                          >
                            <div
                              className={`w-2 h-2 rounded-full ${
                                post.status === "posted"
                                  ? "bg-green-500"
                                  : post.status === "rejected"
                                    ? "bg-red-500"
                                    : "bg-yellow-500"
                              }`}
                            ></div>
                            {post.status === "posted"
                              ? "Posted"
                              : post.status === "rejected"
                                ? "Rejected"
                                : "Pending"}
                          </span>
                        </div>

                        <button
                          onClick={() => setFullViewImage(post.aiOutput)}
                          className="absolute top-2 left-2 p-2 bg-white/90 hover:bg-white rounded-full transition-all opacity-0 group-hover:opacity-100"
                        >
                          <ZoomIn size={16} className="text-gray-700" />
                        </button>
                      </div>

                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-500">
                            Post #{index + 1}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {post.promat && (
                          <p className="text-sm text-gray-700 line-clamp-2">
                            <span className="font-bold">Prompt:</span>{" "}
                            {post.promat}
                          </p>
                        )}
                        {post.status === "rejected" && post.rejectReason && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-xs font-semibold text-red-700 mb-1">
                              Rejection Reason:
                            </p>
                            <p className="text-xs text-red-600">
                              {post.rejectReason}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setViewingUserPosts(null);
                  setUserPosts([]);
                }}
                className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {fullViewImage && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
          onClick={() => setFullViewImage(null)}
        >
          <div className="relative max-w-7xl max-h-[95vh] w-full h-full flex items-center justify-center">
            <button
              onClick={() => setFullViewImage(null)}
              className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-sm z-10"
            >
              <X size={24} />
            </button>
            <img
              src={fullViewImage}
              alt="Full view"
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {showIssuesModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-5xl max-h-[80vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Reported Issues
              </h2>
              <button
                onClick={() => setShowIssuesModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Issue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {issues.map((issue, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(issue.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800 font-medium">
                        <div>{issue.fullName || "Unknown"}</div>
                        <div className="text-xs text-gray-500">
                          {issue.mobile}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-md">
                        {issue.issue}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            issue.status === "resolved"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {issue.status || "open"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {issues.length === 0 && (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        No issues found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {deleteUserModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl transform transition-all animate-in zoom-in-95">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Delete User?
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                Are you sure you want to delete{" "}
                <strong>
                  {deleteUserModal.fullName || deleteUserModal.email}
                </strong>
                ? This action cannot be undone.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setDeleteUserModal(null)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteUser}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-medium disabled:opacity-70"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Onboard Revenue Details Modal ✅ NEW */}

      {/* Onboard Client Modal */}
      {showOnboardModal && onboardModalUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Onboard Client
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {onboardModalUser.fullName}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowOnboardModal(false);
                  setOnboardModalUser(null);
                  setOnboardData({
                    plan: "",
                    amount: "",
                    screenshot: null,
                    notes: "",
                  });
                }}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plan <span className="text-red-500">*</span>
                </label>
                <select
                  value={onboardData.plan}
                  onChange={(e) =>
                    setOnboardData({ ...onboardData, plan: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="">Select Plan</option>
                  <option value="Basic Plan">Basic Plan</option>
                  <option value="Professional Plan">Professional Plan</option>
                  <option value="Premium Plan">Premium Plan</option>
                  <option value="Enterprise Plan">Enterprise Plan</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={onboardData.amount}
                  onChange={(e) =>
                    setOnboardData({ ...onboardData, amount: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Screenshot <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-emerald-500 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setOnboardData({ ...onboardData, screenshot: file });
                      }
                    }}
                    className="hidden"
                    id="onboard-screenshot-upload"
                  />
                  <label
                    htmlFor="onboard-screenshot-upload"
                    className="flex flex-col items-center cursor-pointer"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">
                      {onboardData.screenshot
                        ? onboardData.screenshot.name
                        : "Click to upload screenshot"}
                    </span>
                    <span className="text-xs text-gray-400 mt-1">
                      PNG, JPG up to 10MB
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  placeholder="Add any additional notes..."
                  value={onboardData.notes}
                  onChange={(e) =>
                    setOnboardData({ ...onboardData, notes: e.target.value })
                  }
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                />
              </div>

              <button
                onClick={handleOnboardSubmit}
                disabled={
                  uploadingOnboard ||
                  !onboardData.plan ||
                  !onboardData.amount ||
                  !onboardData.screenshot
                }
                className="w-full py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploadingOnboard ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Onboard Client
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Schedule Modal */}
      {showMeetingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Schedule Meeting
              </h2>
              <button
                onClick={() => setShowMeetingModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={meetingData.date}
                  onChange={(e) =>
                    setMeetingData({ ...meetingData, date: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Link
                </label>
                <input
                  type="text"
                  placeholder="https://zoom.us/..."
                  value={meetingData.link}
                  onChange={(e) =>
                    setMeetingData({ ...meetingData, link: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting ID
                </label>
                <input
                  type="text"
                  placeholder="Meeting ID"
                  value={meetingData.meetingId}
                  onChange={(e) =>
                    setMeetingData({
                      ...meetingData,
                      meetingId: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Passcode (Optional)
                </label>
                <input
                  type="text"
                  placeholder="123456"
                  value={meetingData.passcode}
                  onChange={(e) =>
                    setMeetingData({ ...meetingData, passcode: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <button
                onClick={handleMeetingSubmit}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-medium"
              >
                Schedule & Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 💰 USER ONBOARD REVENUE USERS MODAL ✅ NEW */}
      {/* Meeting Schedule Modal */}
      {showMeetingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Schedule Meeting
              </h2>
              <button
                onClick={() => setShowMeetingModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={meetingData.date}
                  onChange={(e) =>
                    setMeetingData({ ...meetingData, date: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Link
                </label>
                <input
                  type="text"
                  placeholder="https://zoom.us/..."
                  value={meetingData.link}
                  onChange={(e) =>
                    setMeetingData({ ...meetingData, link: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting ID
                </label>
                <input
                  type="text"
                  placeholder="Meeting ID"
                  value={meetingData.meetingId}
                  onChange={(e) =>
                    setMeetingData({
                      ...meetingData,
                      meetingId: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Passcode (Optional)
                </label>
                <input
                  type="text"
                  placeholder="123456"
                  value={meetingData.passcode}
                  onChange={(e) =>
                    setMeetingData({ ...meetingData, passcode: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <button
                onClick={handleMeetingSubmit}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-medium"
              >
                Schedule & Send
              </button>
            </div>
          </div>
        </div>
      )}

      <FollowUpDueAlertModal
        alert={followUpDueAlert}
        onDismiss={() => setFollowUpDueAlert(null)}
        onVoiceCall={
          followUpDueAlert?.kind === "user" ? handleVoiceCall : undefined
        }
      />

      {activeModal === "service" && serviceUser && (
        <AdminServicepaneModal
          service={serviceUser}
          onClose={() => {
            setActiveModal(null);
            setServiceUser(null);
          }}
        />
      )}
    </div>
  );
}

export const getTodayUsersData = async () => {
  const adminEmail = localStorage.getItem("email");
  if (!adminEmail) return null;

  try {
    const res = await fetch(
      `/api/users?email=${adminEmail}&getTodayUsersCount=true`,
    );
    const data = await res.json();

    return data; // 🔥 yaha return kar rahe
  } catch (err) {
    console.error(err);
    return null;
  }
};
