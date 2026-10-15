"use client";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useFollowUpVoiceAlerts } from "@/hooks/useFollowUpVoiceAlerts";
import { META_FORM_SYNC_IDS } from "@/lib/metaFormLeadsConfig";
import { uploadToS3Action } from "@/app/actions/uploadS3Actions";
import { fetchFollowUpTableUsersByIds } from "@/lib/fetchFollowUpTableUsers";
import {
  getCalculatedDateRange,
  getConversationStageFromHistory,
  getConversationStageKey,
  getLimbuBotHistoryUserId,
  groupByDate,
  hasGmbConnected,
} from "./utils";

/** Filter query params shared by the paginated table fetch and the "select all"
 *  id fetch. Both must send the exact same filters — otherwise select-all picks
 *  up rows the current filters (date range, status, source…) exclude. */
function buildUserFilterParams(f) {
  const params = new URLSearchParams();

  if (f.assigneeFilter !== "All") {
    params.append("assignedAgentId", f.assigneeFilter);
  }

  if (f.filterStatus !== "All") {
    params.append("status", f.filterStatus);
  }

  if (f.filterDate !== "All") {
    if (f.filterDate === "Custom Range") {
      params.append("dateFilter", "Custom Range");
      if (f.customStartDate) params.append("startDate", f.customStartDate);
      if (f.customEndDate) params.append("endDate", f.customEndDate);
    } else {
      const ranges = getCalculatedDateRange(f.filterDate);
      if (ranges) {
        params.append("dateFilter", f.filterDate);
        params.append("startDate", ranges.startDate);
        params.append("endDate", ranges.endDate);
      }
    }
  }

  if (f.leadStatusFilter !== "All") {
    params.append("leadStatus", f.leadStatusFilter);
  }

  if (f.leadStageFilter !== "All") {
    params.append("leadStage", f.leadStageFilter);
  }

  if (f.leadSourceFilter !== "All") {
    params.append("source", f.leadSourceFilter);
  }

  if (!f.chatbotChatDayFilter && f.conversationStageFilter !== "All") {
    params.append("conversationStage", f.conversationStageFilter);
  }

  if (f.remarkCountFilter !== "All") {
    params.append("remarkCount", f.remarkCountFilter);
  }

  if (f.chatbotChatDayFilter) {
    params.append("chatbotChatDay", f.chatbotChatDayFilter);
  }

  if (f.franchiseLeadsFilter) {
    params.append("franchiseLeads", "true");
    if (f.franchiseCodeFilter && f.franchiseCodeFilter !== "All") {
      params.append("franchiseCode", f.franchiseCodeFilter);
    }
  }

  if (f.chatbotMetricFilter?.metricId) {
    params.append("metricId", f.chatbotMetricFilter.metricId);
    params.append("period", f.chatbotMetricFilter.period);
  }

  return params;
}

/** True while a custom range is picked but not fully entered — sending it would
 *  drop the date filter server-side and match every user. */
function isIncompleteCustomRange(filterDate, startDate, endDate) {
  return filterDate === "Custom Range" && (!startDate || !endDate);
}

// All state, effects and handlers for the user-management admin page.
// Extracted verbatim from page.jsx (the UserManagement component body, minus the
// final JSX). Behaviour is unchanged — page.jsx now consumes this via destructure.
export default function useUserManagementLogic() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [addingUser, setAddingUser] = useState(false);
  const [showAddExpoLeadModal, setShowAddExpoLeadModal] = useState(false);
  const [newUser, setNewUser] = useState({
    userId: "",
    email: "",
    phone: "",
    plan: "Basic",
    // "" = leave unassigned (the Add User modal's default)
    assignedAgentId: "",
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

  const [remarksModalUser, setRemarksModalUser] = useState(null);
  const [remarksInput, setRemarksInput] = useState("");
  const [remarksHistory, setRemarksHistory] = useState([]);
  const [loadingRemarks, setLoadingRemarks] = useState(false);
  const [chatHistoryModal, setChatHistoryModal] = useState({
    open: false,
    user: null,
    userId: "",
    history: [],
    loading: false,
    error: "",
  });
  const [conversationStages, setConversationStages] = useState({});

  const [subscriptionPlans, setSubscriptionPlans] = useState(null);
  const [selectedCycle, setSelectedCycle] = useState("monthly");
  const [planStartDate, setPlanStartDate] = useState("");
  const [utrNumber, setUtrNumber] = useState("");
  const [planAmount, setPlanAmount] = useState("");
  const [planExpiryDate, setPlanExpiryDate] = useState("");

  const [gstNumber, setGstNumber] = useState("");
  // Client's business name, captured on the plan/onboarding form.
  const [planBusinessName, setPlanBusinessName] = useState("");

  useEffect(() => {
    if (planStartDate) {
      const date = new Date(planStartDate);
      date.setMonth(date.getMonth() + 1);

      setPlanExpiryDate(date.toISOString().split("T")[0]);
    }
  }, [planStartDate]);
  const [planScreenshot, setPlanScreenshot] = useState(null);

  const [chatbotSummaryMetrics, setChatbotSummaryMetrics] = useState({
    loading: true,
    totals: {},
    today: {},
  });
  const [chatbotMetricFilter, setChatbotMetricFilter] = useState(null);
  const [chatbotMetricUsers, setChatbotMetricUsers] = useState([]);
  const [chatbotMetricTableActive, setChatbotMetricTableActive] =
    useState(false);
  const [chatbotMetricLoading, setChatbotMetricLoading] = useState(false);
  const [agentTodayDemos, setAgentTodayDemos] = useState({
    loading: false,
    count: 0,
    demos: [],
    calendarDate: "",
  });
  /** null | "today" | "yesterday" — filters main leads table */
  const [chatbotChatDayFilter, setChatbotChatDayFilter] = useState(null);
  const [issues, setIssues] = useState([]);
  const [showIssuesModal, setShowIssuesModal] = useState(false);
  const [role, setRole] = useState("");
  const [deleteUserModal, setDeleteUserModal] = useState(null);
  const [editUserModal, setEditUserModal] = useState(null);
  const [reportModalUser, setReportModalUser] = useState(null);
  const [editUserData, setEditUserData] = useState({
    fullName: "",
    email: "",
    phone: "",
    gstNumber: "",
  });
  const [savingEditUser, setSavingEditUser] = useState(false);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [agents, setAgents] = useState([]);
  const [assigneeFilter, setAssigneeFilter] = useState("All");

  const [agentStats, setAgentStats] = useState({ Unassigned: 0 });

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

  const [todayUsersMetaLeads, setTodayUsersMetaLeads] = useState(0);
  const [todayUsersSignups, setTodayUsersSignups] = useState(0);
  /** Matches API getTodayUsersCount (Asia/Kolkata / APP_TIMEZONE calendar day). */

  const [leadStatusStats, setLeadStatusStats] = useState({
    Hot: 0,
    Warm: 0,
    Cold: 0,
  });
  const [leadStatusFilter, setLeadStatusFilter] = useState("All");
  const [leadStageFilter, setLeadStageFilter] = useState("All");
  const [conversationStageFilter, setConversationStageFilter] = useState("All");

  const [conversationStageUsers, setConversationStageUsers] = useState([]);
  const [conversationStageCardsLoading, setConversationStageCardsLoading] =
    useState(false);
  const [selectedConversationStage, setSelectedConversationStage] =
    useState("All");
  const [conversationStageTableActive, setConversationStageTableActive] =
    useState(false);
  const [isRefreshingWhatsAppData, setIsRefreshingWhatsAppData] =
    useState(false);
  const [callStats, setCallStats] = useState(null);
  const [callStatsLoading, setCallStatsLoading] = useState(false);

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

  const [allSelectedUsers, setAllSelectedUsers] = useState([]);

  const [isOpen, setIsOpen] = useState(false);

  const [followUpFilter, setFollowUpFilter] = useState("all");
  const [followUpLeads, setFollowUpLeads] = useState([]);

  const [followUpTableUsers, setFollowUpTableUsers] = useState([]);
  const [loadingFollowUpTable, setLoadingFollowUpTable] = useState(false);
  const [followUpDueAlert, setFollowUpDueAlert] = useState(null);

  // Revenue tracking state

  // Revenue Users Modal state ✅ NEW

  // Onboarded Client state
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [onboardModalUser, setOnboardModalUser] = useState(null);
  const [onboardData, setOnboardData] = useState({
    plan: "",
    businessName: "",
    amount: "",
    screenshot: null,
    notes: "",
  });
  const [uploadingOnboard, setUploadingOnboard] = useState(false);

  // Payment Screenshot Upload state

  const [paidUsersStatus, setPaidUsersStatus] = useState({});

  /** Which leads on this page already have a saved AI business analysis. */
  const [aiAnalysisStatusMap, setAiAnalysisStatusMap] = useState({});
  const [aiAnalysisModalUser, setAiAnalysisModalUser] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDate, setFilterDate] = useState("All");
  const [leadSourceFilter, setLeadSourceFilter] = useState("All");
  const [remarkCountFilter, setRemarkCountFilter] = useState("All");
  const [franchiseLeadsFilter, setFranchiseLeadsFilter] = useState(false);
  // Franchise-wise narrowing inside the franchise leads view ("All" = every franchise)
  const [franchiseCodeFilter, setFranchiseCodeFilter] = useState("All");
  const [franchiseOptions, setFranchiseOptions] = useState([]);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

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
  const [templateWaSendingId, setTemplateWaSendingId] = useState("");
  const [bulkWaResult, setBulkWaResult] = useState(null);

  /** SuperAdmin only — bulk email campaigns via mail.limbutech.in. */
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailSendingId, setEmailSendingId] = useState("");

  const [allUserIds, setAllUserIds] = useState([]);
  /** Bumped per select-all id request so late responses can be discarded. */
  const allUserIdsReqRef = useRef(0);

  // remark
  const [planRemarks, setplanRemarks] = useState("");

  // console.log("uses data in user-management:", users);

  const tableRef = useRef(null);
  const bottomRef = useRef(null);
  const fetchingConversationStageKeysRef = useRef(new Set());

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

  const fetchConversationStagesOnLoad = async () => {
    try {
      const usersWithAttachedMessages = preConversationFilteredUsers.filter(
        (user) =>
          Array.isArray(user.chatbotHistory) ||
          Array.isArray(user.conversationStages),
      );

      if (!usersWithAttachedMessages.length) return;

      const updatedStages = {};

      usersWithAttachedMessages.forEach((user) => {
        const key = getConversationStageKey(user);
        if (!key) return;

        const history = Array.isArray(user.chatbotHistory)
          ? user.chatbotHistory
          : [];
        const steps = Array.isArray(user.conversationStages)
          ? user.conversationStages.filter((stage) => stage !== "No Activity")
          : getConversationStageFromHistory(history, user).steps || [];

        updatedStages[key] = {
          loading: false,
          historyCount: history.length,
          stage: {
            label: steps.length ? steps.join(" ➔ ") : "Not started",
            steps,
          },
        };
      });

      if (Object.keys(updatedStages).length) {
        setConversationStages((prev) => ({
          ...prev,
          ...updatedStages,
        }));
      }
    } catch (error) {
      console.log(error);
    }
  };
  const getConversationStageDisplay = (user = {}) => {
    const key = getConversationStageKey(user);
    const cached = key ? conversationStages[key] : null;

    // Pehle steps nikalte hain history se
    let steps =
      cached?.stage?.steps ||
      (Array.isArray(user.conversationStages)
        ? user.conversationStages.filter((stage) => stage !== "No Activity")
        : []);

    // Agar GMB connected hai toh manual step ko correct order mein add karte hain
    if (hasGmbConnected(user)) {
      if (!steps.includes("GMB Connected")) {
        const initialIndex = steps.indexOf("Initial Conversation");
        const insertAt = initialIndex >= 0 ? initialIndex + 1 : 0;
        steps = [
          ...steps.slice(0, insertAt),
          "GMB Connected",
          ...steps.slice(insertAt),
        ];
      }
    }

    if (cached?.loading) {
      return {
        label: "Checking...",
        steps: steps,
        className: "bg-amber-50 text-amber-700 border-amber-200",
      };
    }

    if (steps.length > 0) {
      // Jo sabse aakhri step hai wahi label dikhao
      const lastStep = steps[steps.length - 1];
      return {
        label: steps.join(" ➔ "),
        steps: steps,
        className: "bg-green-50 text-green-700 border-green-200",
      };
    }

    if (!getLimbuBotHistoryUserId(user)) {
      return {
        label: "No WhatsApp",
        steps: [],
        className: "bg-slate-50 text-slate-500 border-slate-200",
      };
    }

    return {
      label: "Not started",
      steps: [],
      className: "bg-gray-50 text-gray-600 border-gray-200",
    };
  };

  const isAgent = role === "agent";
  const isManager = role === "manager";

  /** Agent: table rows loaded via byUserIds (paginated `users` often omits follow-up leads) */
  const preConversationFilteredUsers = useMemo(() => {
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

    if (remarkCountFilter !== "All") {
      list = list.filter((u) => {
        const remarkCount = Array.isArray(u.remarksHistory)
          ? u.remarksHistory.length
          : 0;

        if (remarkCountFilter === "None") return remarkCount === 0;
        if (remarkCountFilter === "More") return remarkCount > 3;
        return remarkCount === Number(remarkCountFilter);
      });
    }

    return list;
  }, [
    users,
    isAgent,
    followUpFilter,
    followUpTableUsers,
    searchQuery,
    remarkCountFilter,
  ]);

  const filteredUsers = useMemo(() => {
    const applySearch = (list) => {
      if (!searchQuery.trim()) return list;
      const q = searchQuery.trim().toLowerCase();
      return list.filter((u) => {
        const hay =
          `${u.email || ""} ${u.userId || ""} ${u.phone || ""} ${u.mobileNumber || ""} ${u.fullName || ""}`.toLowerCase();
        return hay.includes(q);
      });
    };

    if (chatbotMetricTableActive) return applySearch(chatbotMetricUsers);
    if (conversationStageTableActive)
      return applySearch(conversationStageUsers);
    return preConversationFilteredUsers;
  }, [
    preConversationFilteredUsers,
    chatbotMetricTableActive,
    chatbotMetricUsers,
    conversationStageTableActive,
    conversationStageUsers,
    searchQuery, // 👈 sirf ye add hua
  ]);

  const fetchAllUserIds = async () => {
    const adminEmail = (localStorage.getItem("adminEmail") || localStorage.getItem("email"));

    // Half-entered custom range: the API would ignore the dates and hand back
    // every user, so keep the select-all pool empty until both dates are in.
    if (isIncompleteCustomRange(filterDate, customStartDate, customEndDate)) {
      setAllUserIds([]);
      setAllSelectedUsers([]);
      setBulkWaSelectedUserIds([]);
      return;
    }

    // Each filter change starts a new request; only the newest one may write
    // the ids. Without this an earlier (unfiltered, slower) response could land
    // last and leave every user selected.
    const reqId = ++allUserIdsReqRef.current;

    const params = buildUserFilterParams({
      assigneeFilter,
      filterStatus,
      filterDate,
      customStartDate,
      customEndDate,
      leadStatusFilter,
      leadStageFilter,
      leadSourceFilter,
      conversationStageFilter,
      remarkCountFilter,
      chatbotChatDayFilter,
      franchiseLeadsFilter,
      franchiseCodeFilter,
      chatbotMetricFilter,
    });
    params.set("email", adminEmail);
    params.set("page", "1");
    params.set("limit", "10000");
    params.set("search", (searchQuery || "").trim());

    try {
      const res = await fetch(`/api/users?${params.toString()}`);
      const data = await res.json();

      if (reqId !== allUserIdsReqRef.current) return; // stale response

      if (data.success) {
        const ids = data.users.map((u) => String(u.userId));

        setAllUserIds(ids);
        setAllSelectedUsers(data.users);

        // filter change hone par purani selection hatao
        setBulkWaSelectedUserIds([]);
      }
    } catch (err) {
      if (reqId === allUserIdsReqRef.current) {
        console.error("Error fetching all user ids:", err);
      }
    }
  };

  useEffect(() => {
    setAllUserIds([]);
    setBulkWaSelectedUserIds([]);

    fetchAllUserIds();
  }, [
    searchQuery,
    assigneeFilter,
    filterStatus,
    leadStatusFilter,
    leadStageFilter,
    leadSourceFilter,
    remarkCountFilter,
    conversationStageFilter,
    chatbotChatDayFilter,
    chatbotMetricFilter,
    filterDate,
    customStartDate,
    customEndDate,
    franchiseLeadsFilter,
    franchiseCodeFilter,
  ]);

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

  useEffect(() => {
    if (preConversationFilteredUsers?.length) {
      fetchConversationStagesOnLoad();
    }
  }, [preConversationFilteredUsers]);

  useEffect(() => {
    const usersNeedingStage = preConversationFilteredUsers
      .filter((user) => {
        const key = getConversationStageKey(user);
        return (
          key &&
          !conversationStages[key] &&
          !Array.isArray(user.chatbotHistory) &&
          !Array.isArray(user.conversationStages) &&
          getLimbuBotHistoryUserId(user)
        );
      })
      .slice(0, 10);

    if (!usersNeedingStage.length) return;

    usersNeedingStage.forEach((user) => {
      const key = getConversationStageKey(user);
      if (fetchingConversationStageKeysRef.current.has(key)) return;
      fetchingConversationStageKeysRef.current.add(key);

      setConversationStages((prev) => ({
        ...prev,
        [key]: {
          loading: true,
          historyCount: 0,
          stage: { label: "Checking...", steps: [] },
        },
      }));

      fetchWhatsAppHistoryForUser(user)
        .then(({ history }) => {
          updateConversationStageCache(user, history);
        })
        .catch(() => {
          setConversationStages((prev) => ({
            ...prev,
            [key]: {
              loading: false,
              historyCount: 0,
              stage: { label: "Not started", steps: [] },
            },
          }));
        })
        .finally(() => {
          fetchingConversationStageKeysRef.current.delete(key);
        });
    });
  }, [preConversationFilteredUsers, conversationStages]);

  const stageOptions = [
    "Initial Conversation",
    "GMB Connected",
    "GMB Health",
    "Magic QR",
    "GMB Insight",
    "Build Website",
    "Demo Booked",
  ];

  const fetchChatHistoryForUser = async (user) => {
    const historyUserId = getLimbuBotHistoryUserId(user);

    if (!historyUserId || historyUserId === "wa_") {
      showToast("No WhatsApp number found for this user", "error");
      return;
    }

    setChatHistoryModal({
      open: true,
      user,
      userId: historyUserId,
      history: [],
      loading: true,
      error: "",
    });

    try {
      const { historyUserId: resolvedUserId, history } =
        await fetchWhatsAppHistoryForUser(user);
      setChatHistoryModal({
        open: true,
        user,
        userId: resolvedUserId,
        history,
        loading: false,
        error: "",
      });
    } catch (error) {
      setChatHistoryModal((prev) => ({
        ...prev,
        loading: false,
        error: error.message || "Failed to load WhatsApp chat history.",
      }));
      showToast(
        error.message || "Failed to load WhatsApp chat history",
        "error",
      );
    }
  };

  const updateConversationStageCache = (user, history = []) => {
    const stageKey = getConversationStageKey(user);
    if (!stageKey) return;

    setConversationStages((prev) => ({
      ...prev,
      [stageKey]: {
        loading: false,
        historyCount: history.length,
        stage: getConversationStageFromHistory(history, user),
      },
    }));
  };

  const fetchWhatsAppHistoryForUser = async (user) => {
    const historyUserId = getLimbuBotHistoryUserId(user);
    if (!historyUserId || historyUserId === "wa_") {
      throw new Error("No WhatsApp number found for this user");
    }

    const response = await fetch(
      `/api/limbubot/history?user_id=${encodeURIComponent(historyUserId)}`,
      { cache: "no-store" },
    );
    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.success === false) {
      throw new Error(data.error || "Failed to load WhatsApp chat history");
    }

    return {
      historyUserId: data.user_id || historyUserId,
      history: Array.isArray(data.history) ? data.history : [],
      contact: data.contact || null,
    };
  };

  const closeChatHistoryModal = () => {
    setChatHistoryModal({
      open: false,
      user: null,
      userId: "",
      history: [],
      loading: false,
      error: "",
    });
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
    const email = (localStorage.getItem("adminEmail") || localStorage.getItem("email"));
    if (!email) return;

    const canSyncMeta = ["superAdmin", "seniorManager", "admin"].includes(adminRole);

    if (!silent) setIsRefreshingMetaLeads(true);

    try {
      if (canSyncMeta) {
        const formIds = META_FORM_SYNC_IDS.join(",");
        const res = await fetch(
          `/api/meta-leads-import?formIds=${encodeURIComponent(formIds)}&email=${encodeURIComponent(email)}`,
        );

        const data = await res.json();
        console.log("[Meta Leads Fetch]", {
          success: data.success,
          forms: data.forms,
          stats: data.stats,
          formErrors: data.formErrors,
          error: data.error,
        });

        if (data.success) {
          if (!silent) {
            const inserted = data.stats?.inserted ?? 0;
            const msg =
              inserted > 0
                ? `Meta Leads refreshed — ${inserted} new lead(s) added`
                : data.formErrors?.length
                  ? "Leads refreshed (some Meta forms had errors)"
                  : "Meta Leads refreshed successfully!";
            showToast(msg, data.formErrors?.length ? "warning" : "success");
          }
        } else if (!silent) {
          showToast(data.error || "Failed to refresh Meta Leads", "error");
        } else {
          console.warn("Meta leads sync:", data.error || data);
        }
      }

      await fetchUsers(true);
    } catch (error) {
      console.error("Error refreshing Meta Leads:", error);
      if (!silent) showToast("Error refreshing leads", "error");
      await fetchUsers(true);
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

  useEffect(() => {
    setRole(localStorage.getItem("role"));
  }, []);

  useEffect(() => {
    if (!role) return;

    if (
      (role === "superAdmin" || role === "seniorManager") ||
      role === "admin" ||
      role === "superfranchiseAdmin"
    ) {
      fetch("/api/admin/user-agent")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setAgents(data.data);
        })
        .catch((err) => console.error("Error fetching agents:", err));
      return;
    }

    // Everyone else (agents, support, managers) may not list the whole team —
    // /api/admin/user-agent is admin-only — but they must still be able to take
    // a lead for themselves, so the only option offered is their own account.
    const selfId = localStorage.getItem("adminId");
    if (!selfId) {
      setAgents([]);
      return;
    }
    setAgents([
      {
        _id: selfId,
        fullName: localStorage.getItem("adminName") || "Me",
        email:
          localStorage.getItem("adminEmail") || localStorage.getItem("email") || "",
        role,
        isSelf: true,
      },
    ]);
  }, [role]);

  useEffect(() => {
    if (role && (role !== "superAdmin" && role !== "seniorManager")) {
      setBulkWaSelectedUserIds([]);
      setBulkWaShowPanel(false);
      setBulkWaResult(null);
    }
  }, [role]);

  useEffect(() => {
    if (bulkWaSelectedUserIds.length === 0) setBulkWaShowPanel(false);
  }, [bulkWaSelectedUserIds.length]);

  const fetchCallStats = useCallback(async () => {
    const adminEmail = (localStorage.getItem("adminEmail") || localStorage.getItem("email"));
    if (!adminEmail || !["superAdmin", "seniorManager", "admin", "agent"].includes(role)) return;

    setCallStatsLoading(true);
    try {
      const [callRes, followUpRes] = await Promise.all([
        fetch(`/api/admin/call-stats?email=${encodeURIComponent(adminEmail)}`),
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
    } finally {
      setCallStatsLoading(false);
    }
  }, [role]);

  useEffect(() => {
    fetchCallStats();
  }, [fetchCallStats, users]);

  // Fetch follow-up leads when filter tab changes
  useEffect(() => {
    const fetchFollowUpLeads = async () => {
      const adminEmail = (localStorage.getItem("adminEmail") || localStorage.getItem("email"));
      if (!adminEmail || !["superAdmin", "seniorManager", "admin", "agent"].includes(role))
        return;

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
    const adminEmail = (localStorage.getItem("adminEmail") || localStorage.getItem("email"));
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
    fetchFollowUpTableUsersByIds(adminEmail, uniqueIds, conversationStageFilter)
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
  }, [isAgent, followUpFilter, followUpLeads, conversationStageFilter]);

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
    const isMetaLeadSource = (src, leadTags = []) =>
      [
        "bulk-upload",
        "manual-upload",
        "csv-import",
        "excel-import",
        "Meta Lead",
        "Meta Leads",
        "Meta",
        "Real estate leads",
      ].includes(String(src || "").trim()) ||
      (Array.isArray(leadTags) &&
        leadTags.some((tag) =>
          ["metaleads", "real-estate-lead"].includes(
            String(tag || "")
              .trim()
              .toLowerCase(),
          ),
        ));
    const isTodayLocalBrowser = (createdAt) =>
      new Date(createdAt).toDateString() === new Date().toDateString();
    const useApiTodayBreakdown =
      ((role === "superAdmin" || role === "seniorManager") ||
        role === "admin" ||
        role === "superfranchiseAdmin") &&
      !isAgent &&
      !isManager;
    const todayMetaLeads = useApiTodayBreakdown
      ? todayUsersMetaLeads
      : users.filter(
          (u) =>
            isMetaLeadSource(u.source, u.leadTags) &&
            isTodayLocalBrowser(u.createdAt),
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
    const adminEmail = (localStorage.getItem("adminEmail") || localStorage.getItem("email"));
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
      if (leadSourceFilter !== "All") params.append("source", leadSourceFilter);
      if (conversationStageFilter !== "All")
        params.append("conversationStage", conversationStageFilter);
      if (remarkCountFilter !== "All")
        params.append("remarkCount", remarkCountFilter);

      const res = await fetch(`/api/users?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setAgentStats(data.stats);
        setStageStats(data.stageStats || {});

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
      }
    } catch (error) {
      console.error("Error fetching agent stats:", error);
    }
  };

  useEffect(() => {
    if (isIncompleteCustomRange(filterDate, customStartDate, customEndDate))
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
    leadSourceFilter,
    conversationStageFilter,
    remarkCountFilter,
    franchiseLeadsFilter,
  ]);

  const fetchUsers = async (silent = false, overrides = {}) => {
    if (!silent) setLoading(true);
    const adminEmail = (localStorage.getItem("adminEmail") || localStorage.getItem("email"));
    const nextPage = overrides.currentPage ?? currentPage;
    const nextSearchQuery = overrides.searchQuery ?? searchQuery;
    const nextAssigneeFilter = overrides.assigneeFilter ?? assigneeFilter;
    const nextFilterStatus = overrides.filterStatus ?? filterStatus;
    const nextFilterDate = overrides.filterDate ?? filterDate;
    const nextCustomStartDate = overrides.customStartDate ?? customStartDate;
    const nextCustomEndDate = overrides.customEndDate ?? customEndDate;
    const nextLeadStatusFilter = overrides.leadStatusFilter ?? leadStatusFilter;
    const nextLeadStageFilter = overrides.leadStageFilter ?? leadStageFilter;
    const nextLeadSourceFilter = overrides.leadSourceFilter ?? leadSourceFilter;
    const nextConversationStageFilter =
      overrides.conversationStageFilter ?? conversationStageFilter;
    const nextRemarkCountFilter =
      overrides.remarkCountFilter ?? remarkCountFilter;
    const nextChatbotChatDayFilter =
      overrides.chatbotChatDayFilter ?? chatbotChatDayFilter;
    const nextFranchiseLeadsFilter =
      overrides.franchiseLeadsFilter ?? franchiseLeadsFilter;
    const nextFranchiseCodeFilter =
      overrides.franchiseCodeFilter ?? franchiseCodeFilter;

    const nextChatbotMetricFilter =
      overrides.chatbotMetricFilter ?? chatbotMetricFilter;

    try {
      // Same builder the select-all id fetch uses, so both always agree.
      const params = buildUserFilterParams({
        assigneeFilter: nextAssigneeFilter,
        filterStatus: nextFilterStatus,
        filterDate: nextFilterDate,
        customStartDate: nextCustomStartDate,
        customEndDate: nextCustomEndDate,
        leadStatusFilter: nextLeadStatusFilter,
        leadStageFilter: nextLeadStageFilter,
        leadSourceFilter: nextLeadSourceFilter,
        conversationStageFilter: nextConversationStageFilter,
        remarkCountFilter: nextRemarkCountFilter,
        chatbotChatDayFilter: nextChatbotChatDayFilter,
        franchiseLeadsFilter: nextFranchiseLeadsFilter,
        franchiseCodeFilter: nextFranchiseCodeFilter,
        chatbotMetricFilter: nextChatbotMetricFilter,
      });
      params.set("email", adminEmail); // 🔑 REQUIRED
      params.set("page", nextPage);
      params.set("search", nextSearchQuery.trim());
      params.set("limit", 70);

      const res = await fetch(`/api/users?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setUsers(data.users);

        if (Array.isArray(data.franchiseOptions)) {
          setFranchiseOptions(data.franchiseOptions);
        }

        setPagination({
          totalUsers: data.totalUsers,
          currentPage: data.currentPage || nextPage,
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
    if (conversationStageTableActive || chatbotMetricTableActive) return;
    if (isIncompleteCustomRange(filterDate, customStartDate, customEndDate))
      return;
    fetchUsers();
  }, [
    conversationStageTableActive,
    chatbotMetricTableActive,
    currentPage,
    filterStatus,
    filterDate,
    assigneeFilter,
    customStartDate,
    customEndDate,
    leadStatusFilter,
    leadStageFilter,
    leadSourceFilter,
    conversationStageFilter,
    remarkCountFilter,
    chatbotChatDayFilter,
    franchiseLeadsFilter,
    franchiseCodeFilter,
  ]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch("/api/home-data?type=subscriptionPlans");
        const data = await res.json();
        setSubscriptionPlans(data);

        // The catalog only carries the cycles that are actually on sale (today:
        // quarterly and yearly). Pointing at a cycle that isn't there leaves the
        // Upgrade Plan modal with no plans to show, so fall back to the first.
        const cycles = Array.isArray(data?.billingCycles) ? data.billingCycles : [];
        if (cycles.length) {
          setSelectedCycle((prev) =>
            cycles.some((c) => c.cycle === prev) ? prev : cycles[0].cycle
          );
        }
      } catch (err) {
        console.error("Error fetching plans:", err);
      }
    };
    fetchPlans();
  }, []);

  useEffect(() => {
    fetchAllUserPostsCounts();
    fetchAiAnalysisStatuses();
  }, [users]); // Trigger when users (current page) change

  useEffect(() => {
    fetchIssues();
    fetchTodayUsersCount();
    fetchRevenue();
  }, []);

  // Fetch chatbot summary metrics after role is known so agent filter can apply
  useEffect(() => {
    if (!role) return;
    fetchChatbotSummaryMetrics();
    if (role === "agent") {
      fetchAgentTodayDemos();
    }
  }, [role]);

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

  /* ---------------- FETCH REVENUE DATA ---------------- */
  const fetchRevenue = async () => {
    const userEmail = (localStorage.getItem("adminEmail") || localStorage.getItem("email"));
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
          if ((userRole === "superAdmin" || userRole === "seniorManager") || userRole === "superFranchiseAdmin") {
          } else if (userRole === "agent") {
            // For agents, totalRevenue from API is already just their user_onboard revenue
          } else {
            // For other roles like franchiseAdmin, they have no user_onboard revenue
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

  /**
   * Bulk-checks which leads on the current page already have an AI analysis,
   * so the table can show the "AI Analysis" button next to "Generate".
   */
  const fetchAiAnalysisStatuses = async () => {
    if (users.length === 0) return;

    try {
      const userIds = users.map((user) => user.userId).filter(Boolean);
      const res = await fetch("/api/admin/business-report/ai-analysis/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds }),
      });
      const result = await res.json();
      if (result.success) setAiAnalysisStatusMap(result.data || {});
    } catch (err) {
      console.error("Error fetching AI analysis statuses:", err);
    }
  };

  const handleOpenAiAnalysisModal = (user) => setAiAnalysisModalUser(user);

  const syncWhatsAppUsersToDatabase = async () => {
    const adminEmail = (localStorage.getItem("adminEmail") || localStorage.getItem("email"));
    if (!adminEmail) return null;

    const res = await fetch(
      `/api/cron/chatbot-users-sync?email=${encodeURIComponent(adminEmail)}&limit=100`,
      { cache: "no-store" },
    );
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to sync WhatsApp users");
    }
    return data.stats;
  };

  const fetchAgentTodayDemos = async () => {
    const adminEmail = (localStorage.getItem("adminEmail") || localStorage.getItem("email"));
    if (!adminEmail || role !== "agent") return;

    setAgentTodayDemos((prev) => ({ ...prev, loading: true }));
    try {
      const res = await fetch(
        `/api/admin/today-demo-bookings?email=${encodeURIComponent(adminEmail)}`,
        { cache: "no-store" },
      );
      const data = await res.json();
      if (data.success) {
        setAgentTodayDemos({
          loading: false,
          count: data.count || 0,
          demos: data.demos || [],
          calendarDate: data.calendarDate || "",
        });
      } else {
        setAgentTodayDemos((prev) => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error("Error fetching agent today demos:", error);
      setAgentTodayDemos((prev) => ({ ...prev, loading: false }));
    }
  };

  const fetchChatbotSummaryMetrics = async ({ showLoader = true } = {}) => {
    const adminEmail = (localStorage.getItem("adminEmail") || localStorage.getItem("email"));
    if (!adminEmail) return;
    if (showLoader) {
      setChatbotSummaryMetrics((prev) => ({ ...prev, loading: true }));
    }
    try {
      // include agent filter when role is agent
      const filterByAgent =
        role === "agent" ? encodeURIComponent(adminEmail) : null;
      const url = filterByAgent
        ? `/api/admin/chatbot-summary-metrics?email=${encodeURIComponent(adminEmail)}&filterByAgent=${filterByAgent}`
        : `/api/admin/chatbot-summary-metrics?email=${encodeURIComponent(adminEmail)}`;

      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setChatbotSummaryMetrics({
          loading: false,
          totals: data.totals || {},
          today: data.today || {},
        });
      } else {
        setChatbotSummaryMetrics((prev) => ({ ...prev, loading: false }));
        console.error("chatbot-summary-metrics:", data.error);
      }
    } catch (error) {
      console.error("Error fetching chatbot summary metrics:", error);
      setChatbotSummaryMetrics((prev) => ({ ...prev, loading: false }));
    }
  };

  const fetchChatbotMetricUsers = async (filter, options = {}) => {
    if (!filter?.metricId || !filter?.period) {
      setChatbotMetricUsers([]);
      setChatbotMetricTableActive(false);
      return;
    }

    const page = options.page ?? currentPage;
    if (!options.silent) setChatbotMetricLoading(true);
    try {
      const adminEmail = (localStorage.getItem("adminEmail") || localStorage.getItem("email"));
      const limit = 70;
      const params = new URLSearchParams({
        email: adminEmail,
        metricId: filter.metricId,
        period: filter.period,
        page: String(page),
        limit: String(limit),
        search: searchQuery.trim(),
      });

      // If user is an agent, only show their own data
      if (role === "agent") {
        params.append("filterByAgent", adminEmail);
      }

      const res = await fetch(`/api/admin/chatbot-metric-users?${params}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to load metric users");
      }

      setChatbotMetricUsers(data.users || []);
      if (filter.metricId === "demoBooked" && data.calendarDate) {
        setChatbotMetricFilter((prev) =>
          prev?.cardKey === filter.cardKey
            ? { ...prev, calendarDate: data.calendarDate }
            : prev,
        );
      }
      setPagination({
        totalUsers: data.totalUsers || 0,
        currentPage: data.currentPage || currentPage,
        totalPages: data.totalPages || 1,
        limit: data.limit || limit,
      });
    } catch (error) {
      setChatbotMetricUsers([]);
      console.error("Error fetching chatbot metric users:", error);
    } finally {
      if (!options.silent) setChatbotMetricLoading(false);
    }
  };

  const fetchConversationStageUsers = async (stage, options = {}) => {
    if (!stage) {
      setConversationStageUsers([]);
      setConversationStageTableActive(false);
      return;
    }

    if (!options.silent) setConversationStageCardsLoading(true);
    try {
      const limit = 70;
      const params = new URLSearchParams({
        stage,
        page: String(currentPage),
        limit: String(limit),
      });
      const res = await fetch(`/api/conversation-stages?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to load stage users");
      }

      setConversationStageUsers(data.users || []);
      setPagination({
        totalUsers: data.totalUsers || 0,
        currentPage: data.currentPage || currentPage,
        totalPages: data.totalPages || 1,
        limit: data.limit || limit,
      });
    } catch (error) {
      setConversationStageUsers([]);
      console.error("Error fetching conversation stage users:", error);
    } finally {
      if (!options.silent) setConversationStageCardsLoading(false);
    }
  };

  const handleRefreshWhatsAppData = async () => {
    setIsRefreshingWhatsAppData(true);

    setChatbotSummaryMetrics((prev) => ({ ...prev, loading: true }));
    try {
      const syncStats = await syncWhatsAppUsersToDatabase();
      await Promise.all([
        fetchChatbotSummaryMetrics({ showLoader: false }),
        chatbotMetricTableActive && chatbotMetricFilter
          ? fetchChatbotMetricUsers(chatbotMetricFilter, {
              silent: true,
              page: currentPage,
            })
          : Promise.resolve(),
        fetchAgentStats(),
        role === "agent" ? fetchAgentTodayDemos() : Promise.resolve(),
      ]);
      showToast(
        `WhatsApp data refreshed. ${syncStats?.inserted || 0} new, ${syncStats?.assigned || 0} assigned.`,
        "success",
      );
    } catch (error) {
      console.error("Error refreshing WhatsApp data:", error);
      showToast(error.message || "Failed to refresh WhatsApp data", "error");
    } finally {
      setIsRefreshingWhatsAppData(false);

      setChatbotSummaryMetrics((prev) => ({ ...prev, loading: false }));
    }
  };

  const clearChatbotMetricFilter = () => {
    setChatbotMetricFilter(null);
    setChatbotMetricTableActive(false);
    setChatbotMetricUsers([]);
    setChatbotMetricLoading(false);
    setCurrentPage(1);
    fetchUsers(true);
  };

  const handleChatbotMetricCardClick = ({
    metricId,
    period,
    title,
    cardKey,
  }) => {
    if (chatbotMetricFilter?.cardKey === cardKey) {
      clearChatbotMetricFilter();
      return;
    }

    setCurrentPage(1);
    setChatbotChatDayFilter(null);
    setConversationStageTableActive(false);
    setConversationStageUsers([]);
    setSelectedConversationStage("All");
    setConversationStageFilter("All");

    const newFilter = { metricId, period, title, cardKey };

    setChatbotMetricUsers([]);
    setChatbotMetricLoading(true);
    setChatbotMetricTableActive(true);
    setChatbotMetricFilter(newFilter);
  };

  const handleConversationStageFilterChange = (stage) => {
    setCurrentPage(1);
    setChatbotChatDayFilter(null);
    setChatbotMetricFilter(null);
    setChatbotMetricTableActive(false);
    setChatbotMetricUsers([]);
    setConversationStageTableActive(false);
    setConversationStageUsers([]);
    setSelectedConversationStage("All");
    setConversationStageFilter(stage);
  };

  useEffect(() => {
    if (!conversationStageTableActive) {
      setConversationStageUsers([]);
      return;
    }
    fetchConversationStageUsers(selectedConversationStage || "All", {
      silent: true,
    });
  }, [conversationStageTableActive, selectedConversationStage, currentPage]);

  useEffect(() => {
    if (!chatbotMetricTableActive || !chatbotMetricFilter) {
      if (!chatbotMetricTableActive) setChatbotMetricUsers([]);
      return;
    }
    fetchChatbotMetricUsers(chatbotMetricFilter, {
      page: currentPage,
    });
  }, [chatbotMetricTableActive, chatbotMetricFilter, currentPage]);

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
    const adminEmail = (localStorage.getItem("adminEmail") || localStorage.getItem("email"));
    if (!adminEmail) return;
    try {
      const params = new URLSearchParams({
        email: adminEmail,
        getTodayUsersCount: "true",
      });
      const res = await fetch(`/api/users?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setTodayUsersMetaLeads(data.todayMetaLeads || 0);
        setTodayUsersSignups(data.todaySignups || 0);
      }
    } catch (error) {
      console.error("Error fetching today's users count:", error);
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
      }

      // 3️⃣ Update local state immediately
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.userId === userId
            ? { ...user, assignedAgentId: updatedAgent }
            : user,
        ),
      );

      // ✅ FIX: Update chatbot metric users list
      setChatbotMetricUsers((prev) =>
        prev.map((user) =>
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

  const handleOpenEditUserModal = (user) => {
    setEditUserModal(user);
    setEditUserData({
      fullName: user.fullName || "",
      email: user.email || "",
      phone: user.phone || user.mobileNumber || "",
      gstNumber: user.GstNumber || "",
    });
  };

  const handleUpdateUserInfo = async () => {
    if (!editUserModal) return;

    const fullName = String(editUserData.fullName || "").trim();
    const email = String(editUserData.email || "").trim();
    const phone = String(editUserData.phone || "").trim();
    const gstNumber = String(editUserData.gstNumber || "").trim();

    if (!fullName) {
      showToast("Name cannot be empty", "error");
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast("Please enter a valid email", "error");
      return;
    }
    if (phone && !/^\d{10}$/.test(phone.replace(/\D/g, ""))) {
      showToast("Please enter a valid 10-digit phone number", "error");
      return;
    }

    const userId = editUserModal.userId;
    setSavingEditUser(true);
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, fullName, email, phone, gstNumber }),
      });
      const data = await res.json();

      if (data.success) {
        showToast("User updated successfully", "success");
        const patch = {
          fullName,
          email,
          phone,
          mobileNumber: phone,
          GstNumber: gstNumber,
        };
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.userId === userId ? { ...user, ...patch } : user,
          ),
        );
        setChatbotMetricUsers((prev) =>
          prev.map((user) =>
            user.userId === userId ? { ...user, ...patch } : user,
          ),
        );
        setConversationStageUsers((prev) =>
          prev.map((user) =>
            user.userId === userId ? { ...user, ...patch } : user,
          ),
        );
        setFollowUpTableUsers((prev) =>
          prev.map((user) =>
            user.userId === userId ? { ...user, ...patch } : user,
          ),
        );
        setEditUserModal(null);
      } else {
        showToast(data.error || "Failed to update user", "error");
      }
    } catch (error) {
      console.error("Update user info error:", error);
      showToast("Something went wrong", "error");
    } finally {
      setSavingEditUser(false);
    }
  };

  const handleSendReportWhatsApp = async (user) => {
    try {
      const res = await fetch("/api/admin/business-report/send-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.userId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Report sent on WhatsApp", "success");
      } else {
        showToast(data.error || "Failed to send on WhatsApp", "error");
      }
    } catch (error) {
      console.error("Send report WhatsApp error:", error);
      showToast("Something went wrong", "error");
    }
  };

  /** Reflect a freshly generated report in the table without a full refetch. */
  const applyUserReport = (userId, pdfUrl) => {
    const patch = (list) =>
      list.map((u) =>
        u.userId === userId
          ? {
              ...u,
              businessReport: {
                ...(u.businessReport || {}),
                pdfUrl,
                fetchedAt: new Date(),
              },
            }
          : u,
      );
    setUsers(patch);
    setChatbotMetricUsers(patch);
    setConversationStageUsers(patch);
    setFollowUpTableUsers(patch);
  };

  const handleUserSourceChange = async (userId, newSource) => {
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, source: newSource }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Source updated", "success");
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.userId === userId ? { ...user, source: newSource } : user,
          ),
        );
      } else {
        showToast(data.error || "Failed to update source", "error");
      }
    } catch (error) {
      console.error("Update source error:", error);
      showToast("Something went wrong", "error");
    }
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
  }, [
    searchQuery,
    filterStatus,
    filterDate,
    assigneeFilter,
    leadStatusFilter,
    leadStageFilter,
    remarkCountFilter,
    franchiseLeadsFilter,
    franchiseCodeFilter,
  ]);

  // Leaving the franchise view drops the franchise-wise selection
  useEffect(() => {
    if (!franchiseLeadsFilter && franchiseCodeFilter !== "All") {
      setFranchiseCodeFilter("All");
    }
  }, [franchiseLeadsFilter, franchiseCodeFilter]);

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
    // ✅ Naya plan add karte waqt hamesha TODAY ki date aaye (purani date nahi),
    //    taki galat/purani date wali entry na ho. Expiry auto = today + duration.
    const start = new Date().toISOString().split("T")[0];
    setPlanStartDate(start);
    setUtrNumber("");
    setGstNumber(""); // Reset amount

    setPlanAmount("");
    setPlanScreenshot(null); // Reset screenshot
  };

  // When the plan modal opens, offer the business name we already have for this
  // user so the admin only types it the first time.
  useEffect(() => {
    if (!selectedUser) return;
    setPlanBusinessName(
      selectedUser.businessName ||
        selectedUser.selectedBusiness?.name ||
        selectedUser.businessReport?.businessName ||
        "",
    );
  }, [selectedUser]);

  const confirmPlanChange = async () => {
    const packageStartDate = planStartDate || "";
    const packageExpiryDate = planExpiryDate || "";

    console.log("Start:", packageStartDate);
    console.log("Expiry:", packageExpiryDate);
    if (!selectedUser || !selectedPlan) return;

    // If amount is entered, screenshot is mandatory
    if (planAmount && parseFloat(planAmount) > 0 && !planScreenshot) {
      showToast(
        "Payment screenshot is required when amount is entered.",
        "error",
      );
      return;
    }

    // An amount means a revenue row is about to be written — that row is the
    // onboarding record, so it must carry the client's business name.
    if (planAmount && parseFloat(planAmount) > 0 && !planBusinessName.trim()) {
      showToast("Business name is required when amount is entered.", "error");
      return;
    }

    setUpdating(selectedUser.userId);

    try {
      let screenshotUrl = null;
      let revenueData = null;
      // 1. Handle revenue recording if amount is provided
      if (planAmount && parseFloat(planAmount) > 0) {
        screenshotUrl = await uploadToS3(planScreenshot);
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
            businessName: planBusinessName.trim(),
            amount: parseFloat(planAmount),
            paymentScreenshot: screenshotUrl,

            // ✅ Directly read email from the user record
            userEmail: selectedUser.email || "",

            // ✅ Directly read phone from the user record
            phone: selectedUser.phone || "",

            email: (localStorage.getItem("adminEmail") || localStorage.getItem("email")),
            plan: selectedPlan,
            // ✅ comma जरूरी

            packageStartDate: planStartDate, // ✅
            packageExpiryDate: planExpiryDate, // ✅

            notes: `Plan upgrade to ${selectedPlan}`,
            planRemarks: planRemarks,
            utrNumber: utrNumber,
            gstNumber: gstNumber,
            type: selectedPlan.toLowerCase().includes("seo")
              ? "selectedPlan"
              : "user_onboard",
          }),
        });

        revenueData = await revenueRes.json();
        if (!revenueData.success) {
          throw new Error(revenueData.message || "Failed to record revenue.");
        }
      } else if (planScreenshot) {
        // If no amount but screenshot is there, just upload it for the user record
        screenshotUrl = await uploadToS3(planScreenshot);
      }

      const packageStartDate = planStartDate;
      const packageExpiryDate = planExpiryDate;
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
          ...(gstNumber && { gstNumber: gstNumber }),
        }),
      });

      const userUpdateData = await userUpdateRes.json();
      if (userUpdateData.success) {
        // ==============================
        // Send Email
        // ==============================
        try {
          const emailRes = await fetch("/api/admin/send-onboarding-email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: selectedUser.email,

              customerName:
                selectedUser.fullName || selectedUser.name || "Customer",

              planName: selectedPlan,
              amount: planAmount || 0,

              startDate: planStartDate,
              expiryDate: planExpiryDate,

              type: "package",
            }),
          });

          const emailData = await emailRes.json();
          console.log("📧 Email Response:", emailData);

          // ==============================
          // Auto Send Invoice PDF Email
          // ==============================
          try {
            if (!revenueData) {
              console.log("Revenue data not found");
            } else {
              const invoiceRes = await fetch("/api/admin/send-invoice-email", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  revenueId: revenueData?.revenue?._id || revenueData?._id,
                }),
              });

              const invoiceData = await invoiceRes.json();

              console.log("📄 Invoice Email Response:", invoiceData);
            }
          } catch (invoiceErr) {
            console.error("Invoice email failed:", invoiceErr);
          }
        } catch (emailErr) {
          console.error("Email send failed:", emailErr);
        }

        // ==============================
        // Send WhatsApp Template
        // ==============================
        try {
          const whatsappRes = await fetch(
            "/api/admin/package-booking-template",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                phone:
                  selectedUser.phone ||
                  selectedUser.mobile ||
                  selectedUser.whatsappNumber ||
                  selectedUser.contactNumber ||
                  "",

                firstName:
                  selectedUser.fullName || selectedUser.name || "Customer",

                planName: selectedPlan || "Package",
                amount: planAmount || "0",
                startDate: planStartDate || "-",
                expiryDate: planExpiryDate || "-",
              }),
            },
          );

          const whatsappData = await whatsappRes.json();
          console.log("WhatsApp Response:", whatsappData);
        } catch (whatsappErr) {
          console.error("WhatsApp template send failed:", whatsappErr);
        }

        // ==============================
        // Auto Send Invoice PDF WhatsApp
        // ==============================
        try {
          if (revenueData) {
            const invoiceWhatsappRes = await fetch(
              "/api/admin/send-invoice-whatsapp",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  revenueId: revenueData?.revenue?._id || revenueData?._id,
                }),
              },
            );

            const invoiceWhatsappData = await invoiceWhatsappRes.json();

            console.log("📲 Invoice WhatsApp Response:", invoiceWhatsappData);
          }
        } catch (err) {
          console.error("Invoice WhatsApp failed:", err);
        }

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
        setBulkWaSelectedUserIds((prev) =>
          prev.filter((id) => id !== String(deleteUserModal.userId)),
        );
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

  const confirmBulkDeleteUsers = async () => {
    const userIds = bulkWaSelectedUserIds.map(String).filter(Boolean);
    if (!userIds.length) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/users`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          `${data.deletedCount ?? userIds.length} user(s) deleted successfully`,
        );
        setBulkWaSelectedUserIds([]);
        setBulkDeleteModalOpen(false);
        fetchUsers();
      } else {
        showToast(data.error || "Failed to delete users", "error");
      }
    } catch (err) {
      console.error("Error bulk deleting users:", err);
      showToast("Error deleting users", "error");
    } finally {
      setIsDeleting(false);
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

  /** Selects every lead matching the current filters (across all pages). */
  const selectAllBulkWaOnPage = () => {
    if (!allUserIds.length) return;

    setBulkWaSelectedUserIds((prev) => {
      const allSelected = allUserIds.every((id) => prev.includes(id));

      return allSelected ? [] : [...allUserIds];
    });
  };

  const sendBulkUserManagementWhatsApp = async () => {
    if ((role !== "superAdmin" && role !== "seniorManager")) return;
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

    const adminEmail = (localStorage.getItem("adminEmail") || localStorage.getItem("email"));
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
          setIsOpen(false);
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

  const getSelectedWhatsAppUsersPayload = () =>
    allSelectedUsers
      .filter((u) => bulkWaSelectedUserIds.includes(String(u.userId)))
      .map((u) => {
        let num = u.phone || u.mobileNumber;

        if (!num) return null;

        num = String(num).replace(/\D/g, "");

        if (num.length === 10) {
          num = `91${num}`;
        }

        if (num.length !== 12) {
          return null;
        }

        return {
          userId: u.userId,
          customer_no_with_prefix: num,
          name: u.fullName || u.name || "User",
        };
      })
      .filter(Boolean);
  /**
   * @param template  modal se chuna gaya template
   * @param extras    template-specific data, jaise { webinarDateTime }
   */
  const sendTemplateWhatsApp = async (template, extras = {}) => {
    if ((role !== "superAdmin" && role !== "seniorManager")) return;

    console.log("SELECTED IDS COUNT", bulkWaSelectedUserIds.length);

    const usersPayload = getSelectedWhatsAppUsersPayload();

    console.log("Selected IDs", bulkWaSelectedUserIds.length);
    // console.log("All Users", allSelectedUsers.length);
    // console.log("Payload", usersPayload.length);

    // console.log("FIRST 10 USERS", usersPayload.slice(0, 10));

    if (!usersPayload.length) {
      setBulkWaResult({
        success: false,
        message: "No valid phone numbers in selection",
      });
      return;
    }

    const adminEmail = (localStorage.getItem("adminEmail") || localStorage.getItem("email"));
    if (!adminEmail) {
      setBulkWaResult({ success: false, message: "Not logged in" });
      return;
    }

    setTemplateWaSendingId(template.id);
    setBulkWaResult(null);
    try {
      const response = await fetch(
        "/api/admin/user-management-template-whatsapp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            adminEmail,
            users: usersPayload,
            templateId: template.id,
            // Webinar template ke liye admin ka chuna hua date & time
            ...(extras.webinarDateTime
              ? { webinarDateTime: extras.webinarDateTime }
              : {}),
          }),
        },
      );
      const json = await response.json();

      setBulkWaResult({
        success: response.ok && json.success,
        message:
          json.message ||
          (response.ok ? "Message processed" : "Server error occurred"),
        sent: json.sent ?? 0,
      });

      if (response.ok && json.success) {
        setBulkWaSelectedUserIds([]);
        setIsOpen(false);
      }
    } catch (error) {
      console.error("Template WhatsApp error:", error);
      setBulkWaResult({
        success: false,
        message: "Something went wrong while sending",
      });
    } finally {
      setTemplateWaSendingId("");
    }
  };

  const getSelectedEmailUsersPayload = () =>
    allSelectedUsers
      .filter((u) => bulkWaSelectedUserIds.includes(String(u.userId)))
      .map((u) => {
        const email = String(u.email || "").trim();
        if (!email) return null;
        return {
          userId: u.userId,
          email,
          name: u.fullName || u.name || "there",
        };
      })
      .filter(Boolean);

  /** Sends one of the built-in email templates (or a custom one) to the selection. */
  const sendTemplateEmail = async (template) => {
    if ((role !== "superAdmin" && role !== "seniorManager")) return;

    const usersPayload = getSelectedEmailUsersPayload();

    if (!usersPayload.length) {
      setBulkWaResult({
        success: false,
        message: "No valid email addresses in selection",
      });
      return;
    }

    const adminEmail =
      localStorage.getItem("adminEmail") || localStorage.getItem("email");
    if (!adminEmail) {
      setBulkWaResult({ success: false, message: "Not logged in" });
      return;
    }

    setEmailSendingId(template.id);
    setBulkWaResult(null);
    try {
      const response = await fetch("/api/admin/user-management-bulk-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminEmail,
          users: usersPayload,
          templateId: template.id,
          customSubject: template.customSubject,
          customMessage: template.customMessage,
        }),
      });
      const json = await response.json();

      setBulkWaResult({
        success: response.ok && json.success,
        message:
          json.message ||
          (response.ok ? "Email processed" : "Server error occurred"),
        sent: json.sent ?? 0,
      });

      if (response.ok && json.success) {
        setBulkWaSelectedUserIds([]);
        setIsEmailModalOpen(false);
      }
    } catch (error) {
      console.error("Template email error:", error);
      setBulkWaResult({
        success: false,
        message: "Something went wrong while sending",
      });
    } finally {
      setEmailSendingId("");
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
          assignedAgentId: "",
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

  // ✅ Is function ko UserManagement component ke andar replace karo
  // ✅ handleViewPosts ko is code se replace karo
  // Problem: API response me posts `data.posts` me aa rahe hain,
  // lekin tum `data.data` read kar rahe the.

  const handleViewPosts = async (user) => {
    // Loading start
    setLoadingPosts(true);

    // Purana data clear
    setUserPosts([]);

    // Service modal close
    setServiceUser(null);

    try {
      // API call
      const res = await fetch(`/api/post-status?userId=${user.userId}`);
      // console.log("handle post view res: ",res)
      const data = await res.json();

      // Modal open
      setViewingUserPosts(user);
      setActiveModal("posts");

      // ✅ API se jo bhi array aaye use set karo
      const posts =
        data.posts || // agar API { posts: [...] } return kar rahi hai
        data.data || // agar API { data: [...] } return kar rahi hai
        data.result || // fallback
        [];

      setUserPosts(Array.isArray(posts) ? posts : []);
    } catch (error) {
      console.error("Error fetching user posts:", error);

      // Error hone par bhi modal open rahe
      setViewingUserPosts(user);
      setActiveModal("posts");
      setUserPosts([]);
    } finally {
      // Loading stop
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
    try {
      const adminToken = localStorage.getItem("token");

      const res = await fetch("/api/admin/login-as-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (data.token) {
        // Handoff `/impersonate-login` page ke through — wahi tareeka jo
        // franchise panel pehle se use karta hai.
        //
        // Pehle yahan `window.open("/dashboard")` karke `newTab.onload` me
        // localStorage bhara jata tha. Wo do wajah se toota tha:
        //   • `onload` cross-document navigation par aksar chalta hi nahi, aur
        //     tab tak /dashboard ek baar bina impersonation data ke render ho
        //     chuka hota — user ko "logged out" jaisa page milta.
        //   • data set hone se pehle hi dashboard ki API calls nikal jaati thi,
        //     jo galat identity (ya bina identity) ke server par jaati thi.
        // `/impersonate-login` page pehle storage bharta hai, PHIR dashboard par
        // bhejta hai — koi race nahi.
        const payload = encodeURIComponent(
          JSON.stringify({
            token: data.token,
            userId: data.user.userId,
            impersonatedUser: userId,
            impersonatedEmail: data.user.email || "",
            impersonatedName: data.user.fullName || data.user.name || "",
          }),
        );
        window.open(`/impersonate-login?data=${payload}`, "_blank", "noopener");
      }
    } catch (error) {
      console.error(error);
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
      const email = ((localStorage.getItem("adminEmail") || localStorage.getItem("email")) || "").toLowerCase();

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

        // Update normal users list
        setUsers((prev) =>
          prev.map((u) =>
            u.userId === updatedUser.userId ? { ...u, ...updatedUser } : u,
          ),
        );

        // ✅ FIX: Update chatbot metric users list for real-time remark count
        setChatbotMetricUsers((prev) =>
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
          const adminEmail = (localStorage.getItem("adminEmail") || localStorage.getItem("email"));
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
    // `adminId` pehle — `userId` impersonation ke waqt impersonated user ka ho
    // jata hai, jisse call tracking galat admin par log hoti thi.
    const adminId =
      localStorage.getItem("adminId") || localStorage.getItem("userId");
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
    if (
      !onboardData.plan ||
      !onboardData.businessName?.trim() ||
      !onboardData.amount ||
      !onboardData.screenshot
    ) {
      showToast(
        "Please provide plan, business name, amount and payment screenshot",
        "error",
      );
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
          businessName: onboardData.businessName.trim(),
          amount: parseFloat(onboardData.amount),
          paymentScreenshot: screenshotUrl,
          email: (localStorage.getItem("adminEmail") || localStorage.getItem("email")),
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
        setOnboardData({
          plan: "",
          businessName: "",
          amount: "",
          screenshot: null,
          notes: "",
        });
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

  const clearFilters = () => {
    setSearchQuery("");
    setFilterStatus("All");
    setFilterDate("All");
    setCustomStartDate("");
    setCustomEndDate("");
    setAssigneeFilter("All");
    setLeadStatusFilter("All");
    setLeadStageFilter("All");
    setLeadSourceFilter("All");
    setConversationStageFilter("All");
    setSelectedConversationStage("All");
    setConversationStageTableActive(false);
    setConversationStageUsers([]);
    setRemarkCountFilter("All");
    setChatbotChatDayFilter(null);
    setFranchiseLeadsFilter(false);
    setFranchiseCodeFilter("All");
    clearChatbotMetricFilter();
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && pagination && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
    }
  };

  const groupedUsers = groupByDate(filteredUsers); // 🔥 यही use होगा
  const currentLeadTotal =
    isAgent && followUpFilter !== "all"
      ? filteredUsers.length
      : (pagination?.totalUsers ?? filteredUsers.length);

  return {
    users,
    setUsers,
    loading,
    setLoading,
    updating,
    setUpdating,
    selectedUser,
    setSelectedUser,
    selectedPlan,
    setSelectedPlan,
    addingUser,
    setAddingUser,
    showAddExpoLeadModal,
    setShowAddExpoLeadModal,
    newUser,
    setNewUser,
    viewingUserPosts,
    setViewingUserPosts,
    userPosts,
    setUserPosts,
    loadingPosts,
    setLoadingPosts,
    fullViewImage,
    setFullViewImage,
    pagination,
    setPagination,
    connectedBusinessUsers,
    setConnectedBusinessUsers,
    updatingWallet,
    setUpdatingWallet,
    walletModalUser,
    setWalletModalUser,
    walletUpdate,
    setWalletUpdate,
    toast,
    setToast,
    userPostsData,
    setUserPostsData,
    remarksModalUser,
    setRemarksModalUser,
    remarksInput,
    setRemarksInput,
    remarksHistory,
    setRemarksHistory,
    loadingRemarks,
    setLoadingRemarks,
    chatHistoryModal,
    setChatHistoryModal,
    conversationStages,
    setConversationStages,
    subscriptionPlans,
    setSubscriptionPlans,
    selectedCycle,
    setSelectedCycle,
    planStartDate,
    setPlanStartDate,
    utrNumber,
    setUtrNumber,
    planAmount,
    setPlanAmount,
    planExpiryDate,
    setPlanExpiryDate,
    gstNumber,
    setGstNumber,
    planBusinessName,
    setPlanBusinessName,
    planScreenshot,
    setPlanScreenshot,
    chatbotSummaryMetrics,
    setChatbotSummaryMetrics,
    chatbotMetricFilter,
    setChatbotMetricFilter,
    chatbotMetricUsers,
    setChatbotMetricUsers,
    chatbotMetricTableActive,
    setChatbotMetricTableActive,
    chatbotMetricLoading,
    setChatbotMetricLoading,
    agentTodayDemos,
    setAgentTodayDemos,
    chatbotChatDayFilter,
    setChatbotChatDayFilter,
    issues,
    setIssues,
    showIssuesModal,
    setShowIssuesModal,
    role,
    setRole,
    deleteUserModal,
    setDeleteUserModal,
    editUserModal,
    setEditUserModal,
    reportModalUser,
    setReportModalUser,
    editUserData,
    setEditUserData,
    savingEditUser,
    setSavingEditUser,
    bulkDeleteModalOpen,
    setBulkDeleteModalOpen,
    isDeleting,
    setIsDeleting,
    agents,
    setAgents,
    assigneeFilter,
    setAssigneeFilter,
    agentStats,
    setAgentStats,
    stageStats,
    setStageStats,
    showMeetingModal,
    setShowMeetingModal,
    meetingData,
    setMeetingData,
    todayStats,
    setTodayStats,
    agentTodayLeads,
    setAgentTodayLeads,
    todayUsersMetaLeads,
    setTodayUsersMetaLeads,
    todayUsersSignups,
    setTodayUsersSignups,
    leadStatusStats,
    setLeadStatusStats,
    leadStatusFilter,
    setLeadStatusFilter,
    leadStageFilter,
    setLeadStageFilter,
    conversationStageFilter,
    setConversationStageFilter,
    conversationStageUsers,
    setConversationStageUsers,
    conversationStageCardsLoading,
    setConversationStageCardsLoading,
    selectedConversationStage,
    setSelectedConversationStage,
    conversationStageTableActive,
    setConversationStageTableActive,
    isRefreshingWhatsAppData,
    setIsRefreshingWhatsAppData,
    callStats,
    setCallStats,
    callStatsLoading,
    refreshCallStats: fetchCallStats,
    followUpDate,
    setFollowUpDate,
    followUpTime,
    setFollowUpTime,
    followUpStats,
    setFollowUpStats,
    allSelectedUsers,
    setAllSelectedUsers,
    isOpen,
    setIsOpen,
    followUpFilter,
    setFollowUpFilter,
    followUpLeads,
    setFollowUpLeads,
    followUpTableUsers,
    setFollowUpTableUsers,
    loadingFollowUpTable,
    setLoadingFollowUpTable,
    followUpDueAlert,
    setFollowUpDueAlert,
    showOnboardModal,
    setShowOnboardModal,
    onboardModalUser,
    setOnboardModalUser,
    onboardData,
    setOnboardData,
    uploadingOnboard,
    setUploadingOnboard,
    paidUsersStatus,
    aiAnalysisStatusMap,
    aiAnalysisModalUser,
    setAiAnalysisModalUser,
    handleOpenAiAnalysisModal,
    fetchAiAnalysisStatuses,
    setPaidUsersStatus,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    filterDate,
    setFilterDate,
    leadSourceFilter,
    setLeadSourceFilter,
    remarkCountFilter,
    setRemarkCountFilter,
    franchiseLeadsFilter,
    setFranchiseLeadsFilter,
    franchiseCodeFilter,
    setFranchiseCodeFilter,
    franchiseOptions,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    currentPage,
    setCurrentPage,
    activeModal,
    setActiveModal,
    serviceUser,
    setServiceUser,
    isRefreshingMetaLeads,
    setIsRefreshingMetaLeads,
    bulkWaSelectedUserIds,
    setBulkWaSelectedUserIds,
    bulkWaShowPanel,
    setBulkWaShowPanel,
    bulkWaSendDate,
    setBulkWaSendDate,
    bulkWaSending,
    setBulkWaSending,
    templateWaSendingId,
    setTemplateWaSendingId,
    bulkWaResult,
    setBulkWaResult,
    allUserIds,
    setAllUserIds,
    planRemarks,
    setplanRemarks,
    tableRef,
    bottomRef,
    fetchingConversationStageKeysRef,
    handleOpenServiceModal,
    fetchConversationStagesOnLoad,
    getConversationStageDisplay,
    isAgent,
    isManager,
    preConversationFilteredUsers,
    filteredUsers,
    fetchAllUserIds,
    agentFollowUpFilterLabel,
    followUpVoiceItems,
    defaultRemarks,
    FOLLOW_UP_REMARKS,
    handleDefaultRemarkClick,
    showToast,
    stageOptions,
    fetchChatHistoryForUser,
    updateConversationStageCache,
    fetchWhatsAppHistoryForUser,
    closeChatHistoryModal,
    handleSearch,
    handleRefreshMetaLeads,
    stats,
    setStats,
    fetchAgentStats,
    fetchUsers,
    uploadToS3,
    fetchRevenue,
    fetchAllUserPostsCounts,
    syncWhatsAppUsersToDatabase,
    fetchAgentTodayDemos,
    fetchChatbotSummaryMetrics,
    fetchChatbotMetricUsers,
    fetchConversationStageUsers,
    handleRefreshWhatsAppData,
    clearChatbotMetricFilter,
    handleChatbotMetricCardClick,
    handleConversationStageFilterChange,
    fetchIssues,
    fetchTodayUsersCount,
    handleAssignChange,
    handleRoundRobinAssign,
    handleLeadStageChange,
    handleLeadStatusChange,
    handleOpenEditUserModal,
    handleUpdateUserInfo,
    handleSendReportWhatsApp,
    applyUserReport,
    handleUserSourceChange,
    getAgentName,
    handleUpgradePlan,
    confirmPlanChange,
    confirmDeleteUser,
    confirmBulkDeleteUsers,
    getBulkWaCampaignByDate,
    toggleBulkWaUserId,
    selectAllBulkWaOnPage,
    sendBulkUserManagementWhatsApp,
    getSelectedWhatsAppUsersPayload,
    sendTemplateWhatsApp,
    isEmailModalOpen,
    setIsEmailModalOpen,
    emailSendingId,
    sendTemplateEmail,
    handleAddUser,
    handleViewPosts,
    handleOpenWalletModal,
    handleUpdateWallet,
    AdminPanelButton,
    handleOpenRemarksModal,
    sendRemarkWhatsApp,
    handleAddRemark,
    handleVoiceCall,
    handleMeetingSubmit,
    handleOnboardSubmit,
    clearFilters,
    handlePageChange,
    groupedUsers,
    currentLeadTotal,
  };
}
