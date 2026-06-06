"use client";

import { useEffect, useState, useMemo } from "react";
import { useFollowUpVoiceAlerts } from "@/hooks/useFollowUpVoiceAlerts";
import { useRef } from "react";
import { Fragment } from "react";

/* user-management */
import {
  Search,

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
  CheckCircle,
  UserCheck,
  Upload,
  Send,
  Smartphone,
  MessageCircle,
  BarChart3,
  Globe2,
  QrCode,
  Activity,
  Facebook,
  Instagram,
  MoveRight,
} from "lucide-react";
import {
  USER_SOURCE_OPTIONS,
  userAcquisitionLabel,
  formatLeadTagLabel,
  leadTagPillClassName,
} from "@/lib/bookingSource";
import { META_FORM_SYNC_IDS } from "@/lib/metaFormLeadsConfig";
import { uploadToS3Action } from "@/app/actions/uploadS3Actions";
import { fetchFollowUpTableUsersByIds } from "@/lib/fetchFollowUpTableUsers";
import FollowUpDueAlertModal from "@/components/FollowUpDueAlertModal";
import Lottie from "lottie-react";
import animationData from "@/assets/animation/Loading.json"; // if not using public

import AdminServicepaneModal from "../../../components/modals/AdminServicePlaneModal";

import AddExpoLeadUserModal from "./components/AddExpoLeadUserModal";

import WhatsappModal from "./components/WhatsAppTemplateModel";
import ChatHistoryModal from "./components/ChatHistoryModal";
import ChatbotSummaryMetrics from "./components/ChatbotSummaryMetrics";

// import { uploadToS3Action } from "../../../app/actions/uploadS3Actions";

import {
  alpha,
  Box,
  Button,
  FormControl,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Stack,
  TableContainer,
  TextField,
  Typography,
} from "@mui/material";

const WHATSAPP_STAGE_CONTACTS_URL =
  "https://whatsapp.limbu.ai/api/external/contacts?after=2026-05-07";
const WHATSAPP_STAGE_API_KEY =
  "ws_2870c7f6bc8510381dc45e74df26a870d69f0512b17abade";
const WHATSAPP_STAGE_PAGE_LIMIT = 50;

export default function UserManagement() {
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

  useEffect(() => {
    if (planStartDate) {
      const date = new Date(planStartDate);
      date.setMonth(date.getMonth() + 1);

      setPlanExpiryDate(date.toISOString().split("T")[0]);
    }
  }, [planStartDate]);
  const [planScreenshot, setPlanScreenshot] = useState(null);
  const [chatStats, setChatStats] = useState({
    total: 0,
    today: 0,
    resolved: 0,
    data: [],
  });
  const [chatbotDayStats, setChatbotDayStats] = useState({
    loading: true,
    timeZone: "Asia/Kolkata",
    today: { count: 0, label: "" },
    yesterday: { count: 0, label: "" },
  });
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
  /** null | "today" | "yesterday" — filters main leads table */
  const [chatbotChatDayFilter, setChatbotChatDayFilter] = useState(null);
  const [issues, setIssues] = useState([]);
  const [showIssuesModal, setShowIssuesModal] = useState(false);
  const [role, setRole] = useState("");
  const [deleteUserModal, setDeleteUserModal] = useState(null);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [agents, setAgents] = useState([]);
  const [assigneeFilter, setAssigneeFilter] = useState("All");
  const [totalPostsCount, setTotalPostsCount] = useState(0);
  const [agentStats, setAgentStats] = useState({ Unassigned: 0 });
  const [detailedStats, setDetailedStats] = useState([]);
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
  const [conversationStageFilter, setConversationStageFilter] = useState("All");
  const [conversationStageCounts, setConversationStageCounts] = useState({});
  const [conversationStageOrder, setConversationStageOrder] = useState([]);
  const [conversationStageTotal, setConversationStageTotal] = useState(0);
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

  const [isOpen, setIsOpen] = useState(false);

  const [followUpFilter, setFollowUpFilter] = useState("all");
  const [followUpLeads, setFollowUpLeads] = useState([]);
  const [loadingFollowUps, setLoadingFollowUps] = useState(false);
  const [followUpTableUsers, setFollowUpTableUsers] = useState([]);
  const [loadingFollowUpTable, setLoadingFollowUpTable] = useState(false);
  const [followUpDueAlert, setFollowUpDueAlert] = useState(null);
  const [byAgentOpen, setByAgentOpen] = useState(false);

  // Revenue tracking state
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [revenueCount, setRevenueCount] = useState(0);

  // Revenue Users Modal state ✅ NEW

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
  
  const [uploadingPayment, setUploadingPayment] = useState(false);
  const [paidUsersStatus, setPaidUsersStatus] = useState({});

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDate, setFilterDate] = useState("All");
  const [leadSourceFilter, setLeadSourceFilter] = useState("All");
  const [remarkCountFilter, setRemarkCountFilter] = useState("All");
  const [franchiseLeadsFilter, setFranchiseLeadsFilter] = useState(false);
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
  const [templateWaSendingId, setTemplateWaSendingId] = useState("");
  const [bulkWaResult, setBulkWaResult] = useState(null);

  const [allUserIds, setAllUserIds] = useState([]);

  // remark
  const [planRemarks, setplanRemarks] = useState("");

  console.log("uses data in user-management:", users);


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

  const getLimbuBotHistoryUserId = (user = {}) => {
    const explicit =
      user.chatbotUserId ||
      user.whatsappUserId ||
      user.limbuBotUserId ||
      user.botUserId ||
      "";
    if (typeof explicit === "string" && explicit.trim()) {
      return explicit.trim().startsWith("wa_")
        ? explicit.trim()
        : `wa_${explicit.trim().replace(/\D/g, "")}`;
    }

    let phone = user.phone || user.mobileNumber || "";
    phone = String(phone).replace(/\D/g, "");
    if (!phone) return "";
    if (phone.length === 10) phone = `91${phone}`;
    return `wa_${phone}`;
  };

  const getConversationStageFromHistory = (history = [], user = {}) => {
    const steps = [];
    const assistantMessages = history.filter(
      (item) => String(item?.role || "").toLowerCase() === "assistant",
    );
    const inboundUserMessageCount = history.filter(
      (item) =>
        String(item?.role || "").toLowerCase() === "user" &&
        String(item?.content || "").trim() !== "",
    ).length;

    const hasText = (...keywords) =>
      assistantMessages.some((item) => {
        const content = String(item?.content || "").toLowerCase();
        return keywords.some((keyword) =>
          content.includes(keyword.toLowerCase()),
        );
      });

    const hasConnectedStage = hasText(
      "Congrats! Apka Account connect ho gaya!",
      "Badhaai ho! Account connect ho gaya!",
      "Account connect ho gaya",
    );
    const downstreamSteps = [];

    if (hasText("Full Health report")) downstreamSteps.push("GMB Health");
    if (hasText("Magic QR ready hai!")) downstreamSteps.push("Magic QR");
    if (hasText("Full Report (PDF)")) downstreamSteps.push("GMB Insight");
    if (hasText("Website URL")) downstreamSteps.push("Build Website");

    if (inboundUserMessageCount >= 2) steps.push("Initial Conversation");
    if (hasConnectedStage || downstreamSteps.length > 0) {
      steps.push("GMB Connected");
    }
    steps.push(...downstreamSteps);

    // Agar koi activity nahi hai
    if (steps.length === 0 && history.length === 0) {
      return { label: "Not started", steps: [] };
    }

    return {
      label: steps.join(" ➔ "),
      steps: steps, // Hum array bhi bhej rahe hain easy checking ke liye
    };
  };

  const getConversationStageKey = (user = {}) =>
    String(user.userId || getLimbuBotHistoryUserId(user) || user._id || "");

  const mapWhatsAppMessagesToHistory = (messages = []) =>
    (Array.isArray(messages) ? messages : []).map((message) => ({
      id: message.id,
      role:
        String(message.direction || "").toLowerCase() === "inbound"
          ? "user"
          : "assistant",
      type: message.type || "text",
      content: String(message.content || ""),
      status: message.status || "",
      time: message.sent_at || message.created_at || "",
      created_at: message.created_at || "",
    }));

  const normalizeWhatsAppPhone = (value) => {
    let digits = String(value || "").replace(/\D/g, "");
    if (digits.length === 10) digits = `91${digits}`;
    return digits;
  };

  const phoneToLocalMobile = (value) => {
    const digits = normalizeWhatsAppPhone(value);
    return digits.startsWith("91") && digits.length >= 12
      ? digits.slice(2)
      : digits;
  };

  const getLatestWhatsAppMessage = (messages = []) =>
    (Array.isArray(messages) ? [...messages] : []).sort((a, b) =>
      String(b?.sent_at || b?.created_at || "").localeCompare(
        String(a?.sent_at || a?.created_at || ""),
      ),
    )[0] || null;

 

  

  const hasGmbConnected = (user = {}) =>
    Boolean(
      user.isBusinessConnected ||
      user.connectedBusinessEmail ||
      user.gmbProjectId ||
      user.selectedBusiness?.name ||
      (Array.isArray(user.businessListings) &&
        user.businessListings.length > 0),
    );

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
    if (chatbotMetricTableActive) {
      return chatbotMetricUsers;
    }
    if (conversationStageTableActive) {
      return conversationStageUsers;
    }
    return preConversationFilteredUsers;
  }, [
    preConversationFilteredUsers,
    chatbotMetricTableActive,
    chatbotMetricUsers,
    conversationStageTableActive,
    conversationStageUsers,
  ]);

  const fetchAllUserIds = async () => {
    const adminEmail = localStorage.getItem("email");

  const params = new URLSearchParams({
    email: adminEmail,
    page: "1",
    limit: "10000",
    search: searchQuery || "",
  });

    if (filterDate !== "All") {
    if (filterDate === "Custom Range") {
      params.append("dateFilter", "Custom Range");

      if (customStartDate) {
        params.append("startDate", customStartDate);
      }

      if (customEndDate) {
        params.append("endDate", customEndDate);
      }
    } else {
      const ranges = getCalculatedDateRange(filterDate);

      if (ranges) {
        params.append("dateFilter", filterDate);
        params.append("startDate", ranges.startDate);
        params.append("endDate", ranges.endDate);
      }
    }
  }

  if (assigneeFilter !== "All") {
    params.append("assignedAgentId", assigneeFilter);
  }

  if (assigneeFilter !== "All") {
    params.append("assignedAgentId", assigneeFilter);
  }

  if (leadStatusFilter !== "All") {
    params.append("leadStatus", leadStatusFilter);
  }

  if (leadStageFilter !== "All") {
    params.append("leadStage", leadStageFilter);
  }

  if (leadSourceFilter !== "All") {
    params.append("source", leadSourceFilter);
  }

  if (conversationStageFilter !== "All") {
    params.append("conversationStage", conversationStageFilter);
  }

  if (remarkCountFilter !== "All") {
    params.append("remarkCount", remarkCountFilter);
  }

  const res = await fetch(`/api/users?${params.toString()}`);
  const data = await res.json();

  console.log("ALL IDS API", data.totalUsers);
console.log("ALL IDS USERS", data.users.length);

if (data.success) {
  const ids = data.users.map((u) => String(u.userId));

  setAllUserIds(ids);

  // filter change hone par purani selection hatao
  setBulkWaSelectedUserIds([]);
}
};

useEffect(() => {
  setAllUserIds([]);
  setBulkWaSelectedUserIds([]);

  fetchAllUserIds();
}, [
  searchQuery,
  assigneeFilter,
  leadStatusFilter,
  leadStageFilter,
  leadSourceFilter,
  remarkCountFilter,
  conversationStageFilter,
  filterDate,
  customStartDate,
  customEndDate,
  franchiseLeadsFilter,
])

 

  

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
  ];

  

  const fetchChatHistoryForUser = async (user) => {
    const historyUserId = getLimbuBotHistoryUserId(user);
    if (Array.isArray(user.chatbotHistory)) {
      setChatHistoryModal({
        open: true,
        user,
        userId: historyUserId,
        history: user.chatbotHistory,
        loading: false,
        error: "",
      });
      return;
    }

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
    const email = localStorage.getItem("email");
    if (!email) return;

    const canSyncMeta = ["superAdmin", "admin"].includes(adminRole);

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
      (role === "superAdmin" ||
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
            data.metaLeadsCount ??
            data.totalMetaLeads ??
            data.totalMetaLeadUsers ??
            0,
          signupLeads:
            data.signupLeadsCount ??
            data.totalSignupUsers ??
            data.totalSignups ??
            0,
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
    leadSourceFilter,
    conversationStageFilter,
    remarkCountFilter,
    franchiseLeadsFilter,
  ]);

  const fetchUsers = async (silent = false, overrides = {}) => {
    if (!silent) setLoading(true);
    const adminEmail = localStorage.getItem("email");
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

    try {
      const params = new URLSearchParams({
        email: adminEmail, // 🔑 REQUIRED
        page: nextPage,
        search: nextSearchQuery.trim(),
        limit: 70,
      });

      if (nextAssigneeFilter !== "All") {
        params.append("assignedAgentId", nextAssigneeFilter);
      }

      if (nextFilterStatus !== "All") {
        params.append("status", nextFilterStatus);
      }

      if (nextFilterDate !== "All") {
        if (nextFilterDate === "Custom Range") {
          params.append("dateFilter", "Custom Range");
          if (nextCustomStartDate)
            params.append("startDate", nextCustomStartDate);
          if (nextCustomEndDate) params.append("endDate", nextCustomEndDate);
        } else {
          const ranges = getCalculatedDateRange(nextFilterDate);
          if (ranges) {
            params.append("dateFilter", nextFilterDate);
            params.append("startDate", ranges.startDate);
            params.append("endDate", ranges.endDate);
          }
        }
      }

      if (nextLeadStatusFilter !== "All") {
        params.append("leadStatus", nextLeadStatusFilter);
      }

      if (nextLeadStageFilter !== "All") {
        params.append("leadStage", nextLeadStageFilter);
      }

      if (nextLeadSourceFilter !== "All") {
        params.append("source", nextLeadSourceFilter);
      }

      if (!nextChatbotChatDayFilter && nextConversationStageFilter !== "All") {
        params.append("conversationStage", nextConversationStageFilter);
      }

      if (nextRemarkCountFilter !== "All") {
        params.append("remarkCount", nextRemarkCountFilter);
      }

      if (nextChatbotChatDayFilter) {
        params.append("chatbotChatDay", nextChatbotChatDayFilter);
      }

      if (nextFranchiseLeadsFilter) {
        params.append("franchiseLeads", "true");
      }

      const res = await fetch(`/api/users?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setUsers(data.users);

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
    if (filterDate === "Custom Range" && (!customStartDate || !customEndDate))
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

  // Fetch chatbot summary metrics after role is known so agent filter can apply
  useEffect(() => {
    if (!role) return;
    fetchChatbotSummaryMetrics();
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

  const syncWhatsAppUsersToDatabase = async () => {
    const adminEmail = localStorage.getItem("email");
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

  

  const fetchChatbotSummaryMetrics = async ({ showLoader = true } = {}) => {
    const adminEmail = localStorage.getItem("email");
    if (!adminEmail) return;
    if (showLoader) {
      setChatbotSummaryMetrics((prev) => ({ ...prev, loading: true }));
    }
    try {
      // include agent filter when role is agent
      const filterByAgent = role === "agent" ? encodeURIComponent(adminEmail) : null;
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
        setChatbotDayStats((prev) => ({
          ...prev,
          loading: false,
          timeZone: data.timeZone || prev.timeZone,
          today: {
            count: data.todayChats ?? data.today?.chatsCreated ?? 0,
            label: data.todayLabel || prev.today?.label || "Today",
          },
          yesterday: {
            count: data.yesterdayChats ?? prev.yesterday?.count ?? 0,
            label: data.yesterdayLabel || prev.yesterday?.label || "Yesterday",
          },
        }));
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
      const adminEmail = localStorage.getItem("email");
      const limit = 70;
      const params = new URLSearchParams({
        email: adminEmail,
        metricId: filter.metricId,
        period: filter.period,
        page: String(page),
        limit: String(limit),
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

      setConversationStageCounts(data.stageCounts || {});
      setConversationStageOrder(
        data.stageOrder || Object.keys(data.stageCounts || {}),
      );
      setConversationStageTotal(data.total || data.totalUsers || 0);
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
    setChatbotDayStats((prev) => ({ ...prev, loading: true }));
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
      setChatbotDayStats((prev) => ({ ...prev, loading: false }));
      setChatbotSummaryMetrics((prev) => ({ ...prev, loading: false }));
    }
  };

  const clearChatbotMetricFilter = () => {
    setChatbotMetricFilter(null);
    setChatbotMetricTableActive(false);
    setChatbotMetricUsers([]);
    setCurrentPage(1);
    fetchUsers(true);
  };

  const handleChatbotMetricCardClick = async ({
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

    // Set state first
    setChatbotMetricUsers([]);
    setChatbotMetricTableActive(true);
    setChatbotMetricFilter(newFilter);

    try {
      await fetchChatbotMetricUsers(newFilter, {
        page: 1,
        silent: true,
      });

      setCurrentPage(1);
    } catch (err) {
      console.error(
        "Error fetching chatbot metric users on card click:",
        err
      );
    }
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
      silent: true,
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
  }, [
    searchQuery,
    filterStatus,
    filterDate,
    assigneeFilter,
    leadStatusFilter,
    leadStageFilter,
    remarkCountFilter,
  ]);

 

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
    setGstNumber(""); // Reset amount

    setPlanAmount("");
    setPlanScreenshot(null); // Reset screenshot
  };

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

    setUpdating(selectedUser.userId);

    try {
      let screenshotUrl = null;
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
            amount: parseFloat(planAmount),
            paymentScreenshot: screenshotUrl,

            // ✅ Directly read email from the user record
            userEmail: selectedUser.email || "",

            // ✅ Directly read phone from the user record
            phone: selectedUser.phone || "",

            email: localStorage.getItem("email"),
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

        const revenueData = await revenueRes.json();
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

 const selectAllBulkWaOnPage = () => {
    console.log("allUserIds", allUserIds.length);
  if (!allUserIds.length) return;

    setBulkWaSelectedUserIds((prev) => {
      const allSelected = allUserIds.every((id) =>
        prev.includes(id)
      );

    return allSelected
      ? []
      : [...allUserIds];
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
    filteredUsers
      .filter((u) => bulkWaSelectedUserIds.includes(String(u.userId)))
      .map((u) => {
        let num = u.phone || u.mobileNumber;
        if (!num) return null;
        num = String(num).replace(/\D/g, "");
        if (num.length === 10) num = `91${num}`;
        if (num.length !== 12) return null;
        return {
          userId: u.userId,
          customer_no_with_prefix: num,
          name: u.fullName || u.name || "User",
        };
      })
      .filter(Boolean);

  const sendTemplateWhatsApp = async (template) => {
    if (role !== "superAdmin") return;

    const usersPayload = getSelectedWhatsAppUsersPayload();
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
        // 👇 Create new tab first
        const newTab = window.open("/dashboard", "_blank");

        // 👇 Wait until tab loads
        newTab.onload = () => {
          const impersonatedName = data.user.fullName || data.user.name || "";

          const impersonatedEmail = data.user.email || "";

          // 👇 Set data ONLY in new tab localStorage
          newTab.localStorage.setItem("userToken", data.token);
          newTab.localStorage.setItem("impersonatedUser", userId);
          newTab.localStorage.setItem("userId", data.user.userId);
          newTab.localStorage.setItem("impersonatedEmail", impersonatedEmail);
          newTab.localStorage.setItem("isImpersonating", "true");

          newTab.localStorage.setItem("userName", impersonatedName);
          newTab.localStorage.setItem("fullName", impersonatedName);
          newTab.localStorage.setItem("userEmail", impersonatedEmail);

          // 👇 Reload dashboard with new storage
          newTab.location.href = "/dashboard";
        };
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
              .catch(() => { });
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
    clearChatbotMetricFilter();
  };

  

  const handlePageChange = (newPage) => {
    if (newPage > 0 && pagination && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
    }
  };

  const groupByDate = (data) => {
    return data.reduce((acc, item) => {
      const date = new Date(item.createdAt).toLocaleDateString("en-IN");

      if (!acc[date]) {
        acc[date] = [];
      }

      acc[date].push(item);
      return acc;
    }, {});
  };

  const groupedUsers = groupByDate(filteredUsers); // 🔥 यही use होगा
  const currentLeadTotal =
    isAgent && followUpFilter !== "all"
      ? filteredUsers.length
      : (pagination?.totalUsers ?? filteredUsers.length);

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
    <>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-2 sm:p-3">
        {/* Toast Notification */}
        {toast && (
          <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-top-5">
            <div
              className={`px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px] ${toast.type === "success"
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
                    <p className={`text-lg font-bold mt-0.5 ${bold}`}>
                      {value}
                    </p>
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
                      className={`rounded-lg p-2 border-2 text-left transition-all ${active
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

          {(role === "superAdmin" ||
            role === "admin" ||
            role === "superfranchiseAdmin" ||
            role === "agent") && (
              <Box sx={{ mb: 1 }}>
                <ChatbotSummaryMetrics
                  totals={chatbotSummaryMetrics.totals}
                  today={chatbotSummaryMetrics.today}
                  loading={
                    chatbotSummaryMetrics.loading ||
                    chatbotMetricLoading ||
                    isRefreshingWhatsAppData
                  }
                  activeCardKey={chatbotMetricFilter?.cardKey || ""}
                  onRefresh={handleRefreshWhatsAppData}
                  onSelectCard={handleChatbotMetricCardClick}
                />
              </Box>
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
              borderRadius: "14px",
              p: { xs: 1, sm: 1.25 },
              mb: 1,
              backgroundColor: "#f8fafc",
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
                display: "flex",
                flexDirection: "column",
                gap: 1,
                "& .MuiOutlinedInput-root": {
                  height: 38,
                  borderRadius: "10px",
                  backgroundColor: "#fff",
                },
                "& .MuiInputBase-input": {
                  py: "7px",
                  fontSize: 14,
                },
                "& .MuiSelect-select": {
                  py: "7px",
                  fontSize: 14,
                },
              }}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "minmax(0, 3fr) minmax(150px, 1fr)",
                  },
                  alignItems: "stretch",
                  gap: 1,
                  width: "100%",
                  minWidth: 0,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Search email, ID, phone..."
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
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderTopRightRadius: 0,
                        borderBottomRightRadius: 0,
                      },
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleSearch}
                    aria-label="Search users"
                    sx={{
                      height: 38,
                      minWidth: { xs: 44, sm: 104 },
                      px: { xs: 1.25, sm: 2 },
                      borderRadius: "0 10px 10px 0",
                      textTransform: "none",
                      fontWeight: 800,
                      boxShadow: "none",
                      gap: 0.75,
                    }}
                  >
                    <Search size={16} />
                    <Box
                      component="span"
                      sx={{ display: { xs: "none", sm: "inline" } }}
                    >
                      Search
                    </Box>
                  </Button>
                </Box>

                <FormControl size="small" fullWidth>
                  <Select
                    displayEmpty
                    value={leadStageFilter}
                    onChange={(e) => setLeadStageFilter(e.target.value)}
                    renderValue={(selected) =>
                      selected === "All" ? "Stage: All" : `Stage: ${selected}`
                    }
                    inputProps={{ "aria-label": "Lead Stage" }}
                  >
                    <MenuItem value="All">All Stages</MenuItem>
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Follow Up">Follow Up</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                    <MenuItem value="Onboard">Onboard</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                    md: "repeat(4, minmax(0, 1fr))",
                    xl: "repeat(4, minmax(150px, 1fr)) auto",
                  },
                  gap: 1,
                  alignItems: "center",
                }}
              >
                {(role === "superAdmin" ||
                  role === "admin" ||
                  role === "superfranchiseAdmin") && (
                    <>
                      <FormControl size="small" fullWidth>
                        <Select
                          displayEmpty
                          value={assigneeFilter}
                          onChange={(e) => setAssigneeFilter(e.target.value)}
                          renderValue={(selected) => {
                            if (selected === "All") return "Agent: All";
                            if (selected === "Unassigned")
                              return "Agent: Unassigned";
                            const agent = agents.find((a) => a._id === selected);
                            return `Agent: ${agent?.fullName || "Selected"}`;
                          }}
                          inputProps={{ "aria-label": "Assign To" }}
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
                            <Select
                              displayEmpty
                              value={leadStatusFilter}
                              onChange={(e) => setLeadStatusFilter(e.target.value)}
                              renderValue={(selected) =>
                                selected === "All"
                                  ? "Status: All"
                                  : `Status: ${selected}`
                              }
                              inputProps={{ "aria-label": "Lead Status" }}
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
                  <Select
                    displayEmpty
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    renderValue={(selected) =>
                      selected === "All"
                        ? "Date: All Time"
                        : `Date: ${selected}`
                    }
                    inputProps={{ "aria-label": "Date Range" }}
                  >
                    <MenuItem value="All">All Time</MenuItem>
                    <MenuItem value="Today">Today</MenuItem>
                    <MenuItem value="Last 7 Days">Last 7 Days</MenuItem>
                    <MenuItem value="Last 30 Days">Last 30 Days</MenuItem>
                    <MenuItem value="This Month">This Month</MenuItem>
                    <MenuItem value="Custom Range">Custom Range</MenuItem>
                  </Select>
                </FormControl>

                <FormControl size="small" fullWidth>
                  <Select
                    displayEmpty
                    value={leadSourceFilter}
                    onChange={(e) => setLeadSourceFilter(e.target.value)}
                    renderValue={(selected) => {
                      if (selected === "All") return "Source: All";
                      const option = USER_SOURCE_OPTIONS.find(
                        (item) => item.value === selected,
                      );
                      return `Source: ${option?.label || selected}`;
                    }}
                    inputProps={{ "aria-label": "Lead Source" }}
                  >
                    <MenuItem value="All">All Sources</MenuItem>
                    {USER_SOURCE_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" fullWidth>
                  <Select
                    displayEmpty
                    value={remarkCountFilter}
                    onChange={(e) => setRemarkCountFilter(e.target.value)}
                    renderValue={(selected) => {
                      if (selected === "All") return "Remark: All";
                      if (selected === "None") return "Remark: 0";
                      if (selected === "More") return "Remark: More";
                      return `Remark: ${selected}`;
                    }}
                    inputProps={{ "aria-label": "Remark Count" }}
                  >
                    <MenuItem value="All">All Remarks</MenuItem>
                    <MenuItem value="None">No Remark</MenuItem>
                    <MenuItem value="1">Remark 1</MenuItem>
                    <MenuItem value="2">Remark 2</MenuItem>
                    <MenuItem value="3">Remark 3</MenuItem>
                    <MenuItem value="More">More</MenuItem>
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <Select
                    value={conversationStageFilter}
                    onChange={(e) =>
                      handleConversationStageFilterChange(e.target.value)
                    }
                    displayEmpty
                  >
                    <MenuItem value="All">All Stages</MenuItem>
                    {stageOptions.map((stage) => (
                      <MenuItem key={stage} value={stage}>
                        {stage}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    height: 38,
                    padding: "0 8px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    cursor: "pointer",
                    backgroundColor: franchiseLeadsFilter ? "#e3f2fd" : "transparent",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      backgroundColor: "#f5f5f5",
                    },
                  }}
                  onClick={() => setFranchiseLeadsFilter(!franchiseLeadsFilter)}
                >
                  <input
                    type="checkbox"
                    checked={franchiseLeadsFilter}
                    onChange={(e) => setFranchiseLeadsFilter(e.target.checked)}
                    style={{ cursor: "pointer", width: 18, height: 18 }}
                  />
                  <label style={{ cursor: "pointer", fontSize: "14px", margin: 0 }}>
                    Franchise Leads
                  </label>
                </Box>

                {filterDate === "Custom Range" && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      gridColumn: { xs: "1 / -1", md: "span 2" },
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
                  leadStatusFilter !== "All" ||
                  leadStageFilter !== "All" ||
                  leadSourceFilter !== "All" ||
                  conversationStageFilter !== "All" ||
                  remarkCountFilter !== "All" ||
                  franchiseLeadsFilter) && (
                  <Button
                    onClick={clearFilters}
                    variant="outlined"
                    color="inherit"
                    startIcon={<X size={16} />}
                    sx={{
                      height: 38,
                      borderRadius: "10px",
                      textTransform: "none",
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Clear
                  </Button>
                )}
              </Box>
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
              role === "admin" ||
              role === "agent" ||
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
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: 1,
                        fontWeight: 800,
                        letterSpacing: "-0.02em",
                        color: "text.primary",
                        lineHeight: 1.3,
                      }}
                    >
                      <span>Leads</span>
                      <Box
                        component="span"
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          minHeight: 22,
                          px: 1,
                          borderRadius: "999px",
                          bgcolor: (theme) =>
                            alpha(theme.palette.primary.main, 0.1),
                          border: "1px solid",
                          borderColor: (theme) =>
                            alpha(theme.palette.primary.main, 0.18),
                          color: "primary.main",
                          fontSize: 12,
                          fontWeight: 800,
                          lineHeight: 1,
                        }}
                      >
                        Total: {currentLeadTotal.toLocaleString("en-IN")}
                      </Box>
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mt: 0.25 }}
                    >
                      {chatbotChatDayFilter
                        ? `Chatbot chats · ${chatbotChatDayFilter === "today" ? "Today" : "Yesterday"}`
                        : "Manage records and sync from Meta"}
                    </Typography>
                  </Box>
                  <Stack
                    direction="row"
                    spacing={1.25}
                    alignItems="center"
                    flexWrap="wrap"
                    useFlexGap
                  >
                    <button
                      onClick={() => setShowAddExpoLeadModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg shadow hover:bg-blue-700"
                    >
                      + Add Expo Lead
                    </button>

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
                        boxShadow: (theme) =>
                          `0 4px 14px ${alpha(theme.palette.success.main, 0.35)}`,
                        background: (theme) =>
                          `linear-gradient(135deg, ${theme.palette.success.dark} 0%, ${theme.palette.success.main} 100%)`,
                        "&:hover": {
                          background: (theme) =>
                            `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.light} 100%)`,
                          boxShadow: (theme) =>
                            `0 6px 20px ${alpha(theme.palette.success.main, 0.4)}`,
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
                          bgcolor: (theme) =>
                            alpha(theme.palette.primary.main, 0.08),
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
            {chatbotMetricTableActive && chatbotMetricFilter && (
              <div className="mx-3 mt-2 mb-0 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-200/80 bg-blue-50/60 px-4 py-2.5">
                <p className="text-sm font-semibold text-blue-900">
                  Showing:{" "}
                  <span className="font-black">
                    {chatbotMetricFilter.title}
                  </span>
                  {pagination?.totalUsers != null && (
                    <span className="text-blue-700 font-bold">
                      {" "}
                      · {pagination.totalUsers} leads
                    </span>
                  )}
                </p>
                <button
                  type="button"
                  onClick={clearChatbotMetricFilter}
                  className="text-xs font-bold text-blue-800 hover:text-blue-950 underline"
                >
                  Clear
                </button>
              </div>
            )}
            {chatbotChatDayFilter && (
              <div className="mx-3 mt-2 mb-0 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200/80 bg-emerald-50/60 px-4 py-2.5">
                <p className="text-sm font-semibold text-emerald-900">
                  Filter:{" "}
                  <span className="font-black">
                    {chatbotChatDayFilter === "today" ? "Today" : "Yesterday"}
                  </span>
                  {pagination?.totalUsers != null && (
                    <span className="text-emerald-700 font-bold">
                      {" "}
                      · {pagination.totalUsers} leads
                    </span>
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => setChatbotChatDayFilter(null)}
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-950 underline"
                >
                  Clear
                </button>
              </div>
            )}
            {conversationStageTableActive && (
              <div className="mx-3 mt-2 mb-0 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-fuchsia-200/80 bg-fuchsia-50/60 px-4 py-2.5">
                <p className="text-sm font-semibold text-fuchsia-900">
                  Stage filter:{" "}
                  <span className="font-black">
                    {selectedConversationStage}
                  </span>
                  {pagination?.totalUsers != null && (
                    <span className="text-fuchsia-700 font-bold">
                      {" "}
                      · {pagination.totalUsers} WhatsApp leads
                    </span>
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setConversationStageTableActive(false);
                    setConversationStageUsers([]);
                    setSelectedConversationStage("All");
                  }}
                  className="text-xs font-bold text-fuchsia-800 hover:text-fuchsia-950 underline"
                >
                  Clear
                </button>
              </div>
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
                          onClick={() => setBulkDeleteModalOpen(true)}
                          className="group bg-white px-6 py-3 rounded-2xl
                            flex items-center gap-2 text-red-600 font-semibold
                            shadow-md hover:shadow-xl hover:-translate-y-1
                            hover:scale-105 active:scale-95
                            transition-all duration-300"
                        >
                          <Trash2
                            size={20}
                            className="group-hover:scale-110 transition"
                          />
                          Delete Selected
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsOpen(true)}
                          className="group bg-white px-6 py-3 rounded-2xl
                            flex items-center gap-2 text-green-600 font-semibold
                            shadow-md hover:shadow-xl hover:-translate-y-1
                            hover:scale-105 active:scale-95
                            transition-all duration-300"
                        >
                          <MessageCircle
                            size={20}
                            className="group-hover:rotate-12 transition"
                          />
                          WhatsApp
                        </button>

                        <button
                          className="group bg-white px-6 py-3 rounded-2xl
                                        flex items-center gap-2 text-blue-600 font-semibold
                                        shadow-md hover:shadow-xl hover:-translate-y-1
                                        hover:scale-105 active:scale-95
                                        transition-all duration-300"
                        >
                          <Send
                            size={20}
                            className="group-hover:-rotate-12 transition"
                          />
                          RCS
                        </button>

                        <button
                          className="group bg-white px-6 py-3 rounded-2xl
                                        flex items-center gap-2 text-purple-600 font-semibold
                                        shadow-md hover:shadow-xl hover:-translate-y-1
                                        hover:scale-105 active:scale-95
                                        transition-all duration-300"
                        >
                          <Mail
                            size={20}
                            className="group-hover:scale-110 transition"
                          />
                          Email
                        </button>

                        <button
                          className="group bg-white px-6 py-3 rounded-2xl
                                        flex items-center gap-2 text-orange-600 font-semibold
                                        shadow-md hover:shadow-xl hover:-translate-y-1
                                        hover:scale-105 active:scale-95
                                        transition-all duration-300"
                        >
                          <Smartphone
                            size={20}
                            className="group-hover:rotate-6 transition"
                          />
                          SMS
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <WhatsappModal
                  isOpen={isOpen}
                  setIsOpen={setIsOpen}
                  selectedCount={bulkWaSelectedUserIds.length}
                  bulkWaSendDate={bulkWaSendDate}
                  setBulkWaSendDate={setBulkWaSendDate}
                  onBulkSend={sendBulkUserManagementWhatsApp}
                  bulkWaSending={bulkWaSending}
                  onSendTemplate={sendTemplateWhatsApp}
                  sendingTemplateId={templateWaSendingId}
                />

                {bulkWaResult && (
                  <div
                    className={`mx-4 md:mx-8 mb-4 p-5 rounded-2xl shadow-lg border-l-4 ${bulkWaResult.success
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
                            . Messages sent: {bulkWaResult.sent}
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
              <div className="max-h-[500px] overflow-x-auto pb-1">
                <table className="min-w-full">
                  <thead className="sticky top-0 z-20 bg-slate-100/95 backdrop-blur">
                    <tr>
                      {role === "superAdmin" && (
                        <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200 w-14">
                          <input
                            type="checkbox"
                            title="Select all leads on this page"
                          checked={
  allUserIds.length > 0 &&
  allUserIds.every((id) =>
    bulkWaSelectedUserIds.includes(id)
  )
}
                            onChange={selectAllBulkWaOnPage}
                            className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                          />
                        </th>
                      )}
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200 min-w-[120px]">
                        {isAgent && followUpFilter !== "all"
                          ? "Follow-up"
                          : "Joined Date"}
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200 min-w-[180px]">
                        User Name
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200 min-w-[180px]">
                        Conversation
                      </th>
                      {/* <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                      Plan
                    </th> */}
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200 min-w-[150px]">
                        Assign To
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200 min-w-[150px]">
                        Remarks
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                        Lead Stage
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                        Contact
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                        Plan
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
                    {(loadingFollowUpTable &&
                      isAgent &&
                      followUpFilter !== "all") ||
                      (chatbotMetricLoading &&
                        chatbotMetricTableActive) ? (
                      <tr>
                        <td
                          colSpan={role === "superAdmin" ? 14 : 13}
                          className="text-center py-14"
                        >
                          <div className="flex flex-col items-center justify-center gap-2 text-indigo-600">
                            <RefreshCw
                              size={28}
                              className="animate-spin opacity-80"
                            />
                            <p className="text-sm font-semibold text-gray-700">
                              {chatbotMetricLoading &&
                                chatbotMetricTableActive
                                ? "Loading WhatsApp leads…"
                                : `Loading follow-ups (${agentFollowUpFilterLabel})…`}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <>
                        {Object.entries(groupedUsers).map(([date, users]) => {
                          return (
                            <Fragment key={date}>
                              {/* 🔥 DATE HEADING */}
                              <tr>
                                <td
                                  colSpan={role === "superAdmin" ? 14 : 13}
                                  className="bg-gray-100 font-bold px-6 py-3 text-gray-700"
                                >
                                  {date} (Total: {users.length})
                                </td>
                              </tr>
                              {/* 🔥 USERS */}
                              {users.map((user, rowIndex) => {
                                const postData = userPostsData[user.userId] || {
                                  total: 0,
                                  posted: 0,
                                  rejected: 0,
                                };

                                // --- CONVERSATION STEPS LOGIC ---
                                const stage = getConversationStageDisplay(user);
                                const botUserId =
                                  getLimbuBotHistoryUserId(user);

                                // 1. FIXED ROADMAP DEFINITION (Order as per your requirement)
                                const FIXED_JOURNEY_STEPS = [
                                  {
                                    id: "Initial Conversation",
                                    icon: <MessageCircle size={10} />,
                                  },
                                  {
                                    id: "GMB Connected",
                                    icon: <CheckCircle size={10} />,
                                  },
                                  {
                                    id: "GMB Health",
                                    icon: <Activity size={10} />,
                                  },
                                  {
                                    id: "Magic QR",
                                    icon: <QrCode size={10} />,
                                  },
                                  {
                                    id: "GMB Insight",
                                    icon: <BarChart3 size={10} />,
                                  },
                                  {
                                    id: "Build Website",
                                    icon: <Globe2 size={10} />,
                                  },
                                ];

                                // 2. PARSE COMPLETED STEPS FROM LABEL
                                const completedSteps = String(
                                  stage?.label || "",
                                )
                                  .split("➔")
                                  .map((item) => item.trim())
                                  .filter(
                                    (item) =>
                                      item &&
                                      item !== "No Activity" &&
                                      item !== "Not Loaded",
                                  );

                                const lastCompletedStep =
                                  completedSteps[completedSteps.length - 1];
                                const hasAnyProgress =
                                  completedSteps.length > 0;
                                // -------------------------------

                                return (
                                  <Fragment key={user._id || user.userId}>
                                    {/* 1. FIXED HORIZONTAL STEPS STRIP (Upper Row) */}
                                    {botUserId && (
                                      <tr
                                        className={`${rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}
                                      >
                                        <td
                                          colSpan={
                                            role === "superAdmin" ? 14 : 13
                                          }
                                          className="px-6 pt-3 pb-1 border-b-0"
                                        >
                                          <div className="flex items-center gap-3">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                              User Journey:
                                            </span>
                                            <div className="flex flex-wrap items-center gap-1.5">
                                              {FIXED_JOURNEY_STEPS.map(
                                                (step, index) => {
                                                  const isDone =
                                                    completedSteps.includes(
                                                      step.id,
                                                    );
                                                  const isLastActive =
                                                    step.id ===
                                                    lastCompletedStep;

                                                  return (
                                                    <Fragment key={step.id}>
                                                      <div
                                                        className={`
                            inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9px] font-bold shadow-sm transition-all
                            ${isDone
                                                            ? "border-emerald-200 bg-emerald-50 text-emerald-700" // GREEN if completed
                                                            : "border-blue-300 bg-blue-50 text-blue-600 opacity-80" // Blue if pending
                                                          }
                          `}
                                                      >
                                                        {step.icon}
                                                        <span>{step.id}</span>
                                                      </div>

                                                      {/* Arrow Logic */}
                                                      {index !==
                                                        FIXED_JOURNEY_STEPS.length -
                                                        1 && (
                                                          <MoveRight
                                                            size={10}
                                                            className={
                                                              isDone
                                                                ? "text-emerald-400"
                                                                : "text-slate-300"
                                                            }
                                                          />
                                                        )}
                                                    </Fragment>
                                                  );
                                                },
                                              )}
                                            </div>
                                          </div>
                                        </td>
                                      </tr>
                                    )}

                                    {/* 2. MAIN DATA ROW (Bottom Row) */}
                                    <tr
                                      onClick={() => handleViewPosts(user)}
                                      className={`cursor-pointer ${rowIndex % 2 === 0
                                          ? "bg-white"
                                          : "bg-slate-50/40"
                                        } ${botUserId ? "border-t-0" : ""}`}
                                    >
                                      {role === "superAdmin" && (
                                        <td
                                          className="px-3 py-5 w-14 align-middle"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={bulkWaSelectedUserIds.includes(
                                              String(user.userId),
                                            )}
                                            onChange={() =>
                                              toggleBulkWaUserId(user.userId)
                                            }
                                            className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                                          />
                                        </td>
                                      )}

                                      {/* DATE / FOLLOW UP */}
                                      <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                          <Calendar
                                            size={14}
                                            className="text-gray-400"
                                          />
                                          <div className="text-sm text-gray-700">
                                            {user.createdAt ? (
                                              <div className="font-medium">
                                                {new Date(
                                                  user.createdAt,
                                                ).toLocaleDateString("en-US", {
                                                  month: "short",
                                                  day: "numeric",
                                                  year: "numeric",
                                                })}
                                              </div>
                                            ) : (
                                              <span className="text-gray-400 italic">
                                                N/A
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </td>

                                      {/* USER INFO & STATUS */}
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
                                                      paidUsersStatus[
                                                      user.userId
                                                      ],
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
                                          <div
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <select
                                              value={user.leadStatus || ""}
                                              onChange={(e) =>
                                                handleLeadStatusChange(
                                                  user.userId,
                                                  e.target.value,
                                                )
                                              }
                                              className={`mt-1 px-2 py-0.5 rounded text-[10px] font-semibold border outline-none cursor-pointer transition-all ${user.leadStatus === "Hot"
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
                                          {!user.franchiseId && (
                                            <div
                                              onClick={(e) =>
                                                e.stopPropagation()
                                              }
                                            >
                                              <select
                                                value={
                                                  USER_SOURCE_OPTIONS.some(
                                                    (o) =>
                                                      o.value ===
                                                      (user.source || ""),
                                                  )
                                                    ? user.source || "signup"
                                                    : "signup"
                                                }
                                                onChange={(e) =>
                                                  handleUserSourceChange(
                                                    user.userId,
                                                    e.target.value,
                                                  )
                                                }
                                                className="mt-1 w-full max-w-[140px] px-2 py-0.5 rounded text-[10px] font-semibold border border-gray-200 bg-white text-gray-700 outline-none"
                                                title="Lead source (website, chatbot, manual upload, …)"
                                              >
                                                {USER_SOURCE_OPTIONS.map(
                                                  (o) => (
                                                    <option
                                                      key={o.value}
                                                      value={o.value}
                                                    >
                                                      {o.label}
                                                    </option>
                                                  ),
                                                )}
                                              </select>
                                            </div>
                                          )}{" "}

                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {user.franchiseId ? (
                                              <span className="inline-block px-2 py-0.5 text-[10px] font-semibold text-purple-700 bg-purple-100 rounded-full">
                                                Franchise: {user.franchiseId}
                                              </span>
                                            ) : (
                                              <span className="inline-block px-2 py-0.5 text-[10px] font-semibold text-slate-700 bg-slate-100 rounded-full">
                                                {userAcquisitionLabel(
                                                  user.source,
                                                )}
                                              </span>
                                            )}

                                            {user.paidPackage && (
                                              <span className="inline-block px-2 py-0.5 text-[10px] font-semibold text-amber-700 bg-amber-100 rounded-full">
                                                {user.paidPackage}
                                              </span>
                                            )}

                                            {Array.isArray(user.leadTags) &&
                                              user.leadTags.map((tag) => (
                                                <span
                                                  key={`${user.userId || user._id}-${tag}`}
                                                  className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full border ${leadTagPillClassName(tag)}`}
                                                >
                                                  {formatLeadTagLabel(tag)}
                                                </span>
                                              ))}
                                          </div>
                                        </div>
                                      </td>
                                      {/* CONTACT INFO */}
                                      <td className="px-6 py-5">
                                        <div className="text-xs space-y-1">
                                          <div className="flex items-center gap-2 text-gray-600">
                                            <Mail size={12} />{" "}
                                            {user.email || "N/A"}
                                          </div>
                                          <div className="flex items-center gap-2 text-gray-600">
                                            <Phone size={12} />{" "}
                                            {user.phone ||
                                              user.mobileNumber ||
                                              "N/A"}
                                          </div>
                                        </div>
                                      </td>

                                      {/* AGENT ASSIGNMENT */}
                                      <td
                                        className="px-6 py-5 whitespace-nowrap"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {role === "superAdmin" ||
                                          role === "admin" ||
                                          role === "superfranchiseAdmin" ? (
                                          <div
                                            className={`relative inline-flex items-center rounded-full border ${getAvatarColor(
                                              getAgentName(
                                                user.assignedAgentId,
                                              ),
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
                                              <option value="">
                                                -- Unassigned --
                                              </option>

                                              {agents.map((agent) => (
                                                <option
                                                  key={agent._id}
                                                  value={agent._id}
                                                >
                                                  {agent.fullName}
                                                </option>
                                              ))}
                                            </select>

                                            {!user.assignedAgentId && (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleRoundRobinAssign(
                                                    user.userId,
                                                  );
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
                                              getAgentName(
                                                user.assignedAgentId,
                                              ),
                                            )}`}
                                          >
                                            {getAgentName(user.assignedAgentId)}
                                          </span>
                                        )}
                                      </td>

                                      {/* REMARKS */}
                                      <td className="px-6 py-4">
                                        <div
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenRemarksModal(user);
                                          }}
                                          className="cursor-pointer"
                                        >
                                          <div className="flex items-center h-7 px-2.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 w-fit">
                                            <MessageSquare
                                              size={14}
                                              className="mr-1.5"
                                            />
                                            <span className="font-bold text-xs">
                                              {user.remarksHistory?.length || 0}
                                            </span>
                                          </div>
                                          {user.Remarks && (
                                            <div className="text-[10px] text-gray-500 truncate max-w-[150px] mt-1 italic">
                                              {user.Remarks}
                                            </div>
                                          )}
                                        </div>
                                      </td>

                                      {/* LEAD STAGE */}
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
                                          className="px-3 py-1.5 rounded-lg text-xs font-medium border bg-white"
                                        >
                                          <option value="Active">Active</option>
                                          <option value="Follow Up">
                                            Follow Up
                                          </option>
                                          <option value="Onboard">
                                            Onboard
                                          </option>
                                        </select>
                                      </td>

                                      {/* CHAT BUTTON & PROGRESS COUNT */}
                                      <td className="px-6 py-5">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            fetchChatHistoryForUser(user);
                                          }}
                                          disabled={!botUserId}
                                          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition shadow-sm disabled:opacity-40 ${hasAnyProgress
                                              ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                              : "border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                                            }`}
                                        >
                                          <MessageCircle size={14} />
                                          <span>Chat</span>
                                          {hasAnyProgress && (
                                            <div className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-200 px-1.5 text-[9px] font-bold text-emerald-800">
                                              {completedSteps.length}
                                            </div>
                                          )}
                                        </button>
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
                                          className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
                                          title="Add Service "
                                        >
                                          🛡️
                                        </button>
                                      </td>

                                      {/* WALLET */}
                                      <td className="px-6 py-5">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenWalletModal(user);
                                          }}
                                          className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100"
                                        >
                                          <Wallet size={14} />
                                          <span className="font-bold text-sm">
                                            {user.wallet || 0}
                                          </span>
                                        </button>
                                      </td>

                                      {/* POSTS DATA */}
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

                                      {/* LISTING INFO */}
                                      <td className="px-6 py-4">
                                        {user.businessListings?.[0] ? (
                                          <div className="text-xs font-medium max-w-[150px] truncate">
                                            {user.businessListings[0].title}
                                          </div>
                                        ) : (
                                          <span className="text-[10px] text-gray-400 italic">
                                            No Listing
                                          </span>
                                        )}
                                      </td>

                                      {/* ACTIONS */}
                                      <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              AdminPanelButton(user.userId);
                                            }}
                                            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold"
                                          >
                                            Login
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleVoiceCall(user.phone);
                                            }}
                                            className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"
                                          >
                                            <Phone size={14} />
                                          </button>
                                          {role === "superAdmin" && (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setDeleteUserModal(user);
                                              }}
                                              className="p-1.5 bg-red-50 text-red-600 rounded-lg"
                                            >
                                              <Trash2 size={14} />
                                            </button>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  </Fragment>
                                );
                              })}
                            </Fragment>
                          );
                        })}

                        {!loadingFollowUpTable &&
                          filteredUsers.length === 0 && (
                            <tr>
                              <td
                                colSpan={role === "superAdmin" ? 14 : 13}
                                className="text-center py-12"
                              >
                                No users found
                              </td>
                            </tr>
                          )}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </TableContainer>
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
                  <span className="font-semibold">
                    {pagination.currentPage}
                  </span>{" "}
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
                      className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${walletUpdate.type === "credit"
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
                      className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${walletUpdate.type === "debit"
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
                      setWalletUpdate({
                        ...walletUpdate,
                        amount: e.target.value,
                      })
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
                      setWalletUpdate({
                        ...walletUpdate,
                        reason: e.target.value,
                      })
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
                <h2 className="text-2xl font-bold text-gray-800">
                  Upgrade Plan
                </h2>
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${selectedCycle === cycle.cycle
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
                      className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${selectedPlan === planName
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

                {/* GST Number Field */}
                <div className="mt-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    GST Number
                  </label>

                  <input
                    type="text"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    placeholder="Enter GST Number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
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

        <ChatHistoryModal
          open={chatHistoryModal.open}
          onClose={closeChatHistoryModal}
          user={chatHistoryModal.user}
          userId={chatHistoryModal.userId}
          history={chatHistoryModal.history}
          loading={chatHistoryModal.loading}
          error={chatHistoryModal.error}
          onRetry={() =>
            chatHistoryModal.user &&
            fetchChatHistoryForUser(chatHistoryModal.user)
          }
        />

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
                          className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all ${isActive
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
                      ${isLatest
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
                              <CheckCircle
                                size={12}
                                className="text-green-500"
                              />
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
                  <h2 className="text-2xl font-bold text-gray-800">
                    User Posts
                  </h2>
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
                        : userPosts.filter((p) => p.status === "rejected")
                          .length}
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
                    <ImageIcon
                      size={48}
                      className="mx-auto mb-3 text-gray-300"
                    />
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
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${post.status === "posted"
                                  ? "bg-green-100 text-green-700 border border-green-300"
                                  : post.status === "rejected"
                                    ? "bg-red-100 text-red-700 border border-red-300"
                                    : "bg-yellow-100 text-yellow-700 border border-yellow-300"
                                }`}
                            >
                              <div
                                className={`w-2 h-2 rounded-full ${post.status === "posted"
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
                            className={`px-2 py-1 rounded-full text-xs font-medium ${issue.status === "resolved"
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

        {/* Bulk Delete Confirmation Modal */}
        {bulkDeleteModalOpen && bulkWaSelectedUserIds.length > 0 && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl transform transition-all animate-in zoom-in-95">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="text-red-600" size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Delete {bulkWaSelectedUserIds.length} lead
                  {bulkWaSelectedUserIds.length > 1 ? "s" : ""}?
                </h3>
                <p className="text-gray-500 text-sm mb-6">
                  Selected leads will be permanently removed from user management.
                  This action cannot be undone.
                </p>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setBulkDeleteModalOpen(false)}
                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmBulkDeleteUsers}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-medium disabled:opacity-70"
                  >
                    {isDeleting ? "Deleting..." : "Delete All"}
                  </button>
                </div>
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
                      setMeetingData({
                        ...meetingData,
                        passcode: e.target.value,
                      })
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
                      setMeetingData({
                        ...meetingData,
                        passcode: e.target.value,
                      })
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

      {viewingUserPosts && (
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
                {/* Total Posts */}
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Posts</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {loadingPosts
                      ? "..."
                      : userPostsData?.[viewingUserPosts?.userId]?.total ||
                      viewingUserPosts?.totalPosts ||
                      viewingUserPosts?.postsCount ||
                      userPosts.length ||
                      0}
                  </p>
                </div>

                {/* Posted */}
                <div>
                  <p className="text-sm text-gray-600 mb-1">Posted</p>
                  <p className="text-2xl font-bold text-green-600">
                    {loadingPosts
                      ? "..."
                      : userPostsData?.[viewingUserPosts?.userId]?.posted ||
                      userPosts.filter((p) => p.status === "posted").length ||
                      0}
                  </p>
                </div>
                {/* Rejected */}
                <div>
                  <p className="text-sm text-gray-600 mb-1">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">
                    {loadingPosts
                      ? "..."
                      : userPostsData?.[viewingUserPosts?.userId]?.rejected ||
                      userPosts.filter((p) => p.status === "rejected")
                        .length ||
                      0}
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
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${post.status === "posted"
                                ? "bg-green-100 text-green-700 border border-green-300"
                                : post.status === "rejected"
                                  ? "bg-red-100 text-red-700 border border-red-300"
                                  : "bg-yellow-100 text-yellow-700 border border-yellow-300"
                              }`}
                          >
                            <div
                              className={`w-2 h-2 rounded-full ${post.status === "posted"
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

      <AddExpoLeadUserModal
        open={showAddExpoLeadModal}
        onClose={() => setShowAddExpoLeadModal(false)}
        onSuccess={fetchUsers}
      />
    </>
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
