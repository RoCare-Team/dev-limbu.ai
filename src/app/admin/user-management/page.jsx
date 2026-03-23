"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import Link from "next/link";
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
  Globe,
  Bell,
  Upload,
} from "lucide-react";
import AddAddUserActivity from "@/components/admin-add-activity";
import Lottie from "lottie-react";
import animationData from "@/assets/animation/Loading.json"; // if not using public

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
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
  const [isRefreshingMetaLeads, setIsRefreshingMetaLeads] = useState(false);
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
  const [leadSourceStats, setLeadSourceStats] = useState({
    metaLeads: 0,
    signupLeads: 0,
  });
  const [todayUsersCount, setTodayUsersCount] = useState(0);
  const [todayUsersMetaLeads, setTodayUsersMetaLeads] = useState(0);
  const [todayUsersSignups, setTodayUsersSignups] = useState(0);
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

  const filterLabel = useMemo(() => {
    if (filterDate === "All") return null;
    if (filterDate === "Custom Range") {
      if (customStartDate && customEndDate) {
        return `${new Date(customStartDate).toLocaleDateString()} - ${new Date(customEndDate).toLocaleDateString()}`;
      }
      return "Custom Range";
    }
    return filterDate;
  }, [filterDate, customStartDate, customEndDate]);

  const isAgent = role === "agent";
  const isManager = role === "manager";

  const displayTodayUsersCount = useMemo(() => {
    if ((isAgent || isManager) && currentAgentId) {
      const assignment = todayStats.assignments.find(
        (a) => a._id === currentAgentId,
      );
      return assignment ? assignment.count : 0;
    }
    return todayUsersCount;
  }, [isAgent, isManager, currentAgentId, todayStats, todayUsersCount]);

  const displayTotalChatsCount = useMemo(() => {
    if (isAgent || isManager) {
      // Filter chats for agent's/users (based on loaded users for now, consistent with modal)
      // Ideally backend should provide this count
      return chatStats.data.filter((chat) =>
        users.some((u) => u.userId === chat.userId),
      ).length;
    }
    return chatStats.total;
  }, [isAgent, isManager, chatStats, users]);

  const defaultRemarks = [
    "Call Not Picked",
    "Not Interested",
    "Interested",
    "Call Back Later",
    "Wrong Number",
    "Switch Off",
    "Meeting Scheduled",
  ];

  const handleDefaultRemarkClick = (remark) => {
    if (remark === "Meeting Scheduled") {
      setShowMeetingModal(true);
      return;
    }
    const adminName = localStorage.getItem("adminName") || "Admin";
    setRemarksInput(`${remark} - ${adminName}`);
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

  const handleRefreshMetaLeads = async (manual = false) => {
    if (manual) setIsRefreshingMetaLeads(true);
    try {
      const res = await fetch("/api/meta-leads-import?formId=1393275835835157");
      const data = await res.json();
      if (data.success) {
        if (manual) {
          showToast("Meta Leads refreshed successfully!", "success");
          fetchUsers();
        } else if (data.stats?.inserted > 0) {
          fetchUsers(true);
        }
      } else {
        if (manual)
          showToast(data.error || "Failed to refresh Meta Leads", "error");
      }
    } catch (error) {
      console.error("Error refreshing Meta Leads:", error);
      if (manual) showToast("Error refreshing Meta Leads", "error");
    } finally {
      if (manual) setIsRefreshingMetaLeads(false);
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
    setCurrentAgentId(localStorage.getItem("userId"));
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
      if (!adminEmail || (role !== "superAdmin" && role !== "admin")) return;

      try {
        const res = await fetch(`/api/admin/call-stats?email=${adminEmail}`);
        const data = await res.json();
        if (data.success) {
          setCallStats(data.stats);
        }
      } catch (error) {
        console.error("Failed to fetch call stats:", error);
      }
    };

    fetchCallStats();
  }, [role, users]); // Refetch on role change or when user data updates

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
    const todayMetaLeads = users.filter(
      (u) =>
        (u.source === "bulk-upload" || u.source === "Meta Leads") &&
        new Date(u.createdAt).toDateString() === new Date().toDateString(),
    ).length;
    const todaySignups = users.filter(
      (u) => new Date(u.createdAt).toDateString() === new Date().toDateString(),
    ).length;
    console.log("usersusers", users);

    setStats({
      total,
      basic,
      standard,
      premium,
      active,
      todayMetaLeads,
      todaySignups,
    });
  }, [pagination, users, connectedBusinessUsers, role]);

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

        if (data.todayLeads !== undefined) {
          setTodayStats({
            count: data.todayLeads,
            assignments: data.todayAgentAssignments || [],
          });
        }

        setLeadSourceStats({
          metaLeads: data.metaLeadsCount || 0,
          signupLeads: data.signupLeadsCount || 0,
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
    handleRefreshMetaLeads(false);

    const interval = setInterval(() => {
      handleRefreshMetaLeads(false);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchChatStats();
    fetchIssues();
    fetchTodayUsersCount();
    fetchRevenue();
  }, []);

  /* ---------------- UPLOAD TO CLOUDINARY ---------------- */
  const uploadToCloudinary = async (file) => {
    try {
      // Get signature from server
      const { getCloudinarySignatureAction } =
        await import("@/app/actions/uploadCloudinary");
      const signatureData = await getCloudinarySignatureAction();

      if (!signatureData.success) {
        throw new Error("Failed to get Cloudinary signature");
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", signatureData.apiKey);
      formData.append("timestamp", signatureData.timestamp);
      formData.append("signature", signatureData.signature);
      formData.append("folder", signatureData.folder);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error("Cloudinary upload failed");
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error("Cloudinary upload error:", error);
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
    console.log("assignedAgentIdassignedAgentId", assignedAgentId);

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
            type: "user_onboard",
            notes: `Plan upgrade to ${selectedPlan}`,
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
    setViewingUserPosts(user);
    setLoadingPosts(true);
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
    const adminId = localStorage.getItem("userId");
    const adminName = localStorage.getItem("adminName") || "Admin";

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
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRemarksHistory(data.user.remarksHistory || []);

        setRemarksInput("");
        showToast("Remark added successfully", "success");
        fetchUsers();
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
        setRemarksHistory(data.user.remarksHistory || []);
        setRemarksInput("");
        showToast("Meeting scheduled successfully", "success");
        fetchUsers();
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
        showToast("Remarks updated successfully", "success");
        setRemarksModalUser(null);
        fetchUsers();
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

  // Since we are doing server-side filtering, filteredUsers is just users.
  useEffect(() => {
    setFilteredUsers(users);
  }, [users]);

  console.log("agentsagents", agents);
  console.log("agentStatsagentStatsagentStats", stageStats);
  console.log("callStats", callStats);

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
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

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
          {/* LEFT SIDE (Assignments) */}
          {(role === "superAdmin" ||
            role === "admin" ||
            role === "superfranchiseAdmin") &&
            agents.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-700">
                  Total Assignments
                </h3>

                <div className="flex flex-wrap gap-3">
                  {/* Unassigned */}
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${getAvatarColor("Unassigned")}`}
                  >
                    <User className="w-3 h-3" />
                    <span>Unassigned: {agentStats.unassigned || 0}</span>
                  </div>

                  {/* Assigned Agents */}
                  {agents.map((agent) => {
                    const count = agentStats[agent._id.toString()] || 0;
                    if (count === 0) return null;

                    return (
                      <div
                        key={agent._id}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${getAvatarColor(agent.fullName)}`}
                      >
                        <User className="w-3 h-3" />
                        <span>
                          {agent.fullName}: {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          {/* RIGHT SIDE BUTTONS */}
          <div className="flex gap-3 ml-auto">
            <button
              onClick={() => handleRefreshMetaLeads(true)}
              disabled={isRefreshingMetaLeads}
              className="
        flex items-center gap-2 px-6 py-3 
        bg-white text-indigo-600 
        border border-indigo-200
        hover:bg-indigo-50 
        rounded-xl shadow-sm hover:shadow-md 
        transition-all font-medium
      "
            >
              <RefreshCw
                size={20}
                className={isRefreshingMetaLeads ? "animate-spin" : ""}
              />
              {isRefreshingMetaLeads ? "Refreshing..." : "Refresh Leads"}
            </button>

            <button
              onClick={() => setAddingUser(true)}
              className="
        flex items-center gap-2 px-6 py-3 
        bg-gradient-to-r from-indigo-600 to-purple-600 
        hover:from-indigo-700 hover:to-purple-700 
        text-white 
        rounded-xl shadow-lg 
        hover:shadow-xl 
        transition-all
      "
            >
              <Plus size={20} className="text-white" />
              Add User
            </button>
          </div>
        </div>

        {/* Call Stats */}

        {/* Main Stats Cards - Size Reduced */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-2">
          {/* Total Users */}
          <div className="bg-white w-50 h-15 rounded-lg p-3  shadow-sm border border-gray-200 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wide">
                  Total Users
                </p>
                <p className="text-lg font-bold text-indigo-800 mt-1">
                  {stats.total}
                </p>
              </div>
              <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
                <User className="text-indigo-600" size={18} />
              </div>
            </div>
            {filterLabel && (
              <div className="mt-1 pt-1 border-t border-gray-100 text-xs text-gray-500 flex items-center gap-1">
                <Calendar size={11} />
                {filterLabel}
              </div>
            )}
          </div>

          {/* Active Users */}
          {!isAgent && !isManager && (
            <div className="bg-white w-50 h-15 rounded-lg p-2.5 shadow-sm border border-gray-200 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-600 font-semibold uppercase tracking-wide">
                    Active Users
                  </p>
                  <p className="text-lg font-bold text-green-800 mt-1">
                    {stageStats["Active"] || 0}
                  </p>
                </div>
                <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="text-green-600" size={18} />
                </div>
              </div>
            </div>
          )}

          {/* Follow Up */}
          {!isAgent && (
            <div
              className="bg-white w-50 h-15 rounded-lg p-2.5 shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer"
              onClick={() => setStageModal("Follow Up")}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-yellow-600 font-semibold uppercase tracking-wide">
                    Follow Up
                  </p>
                  <p className="text-lg font-bold text-yellow-800 mt-1">
                    {stageStats["Follow Up"] || 0}
                  </p>
                </div>
                <div className="w-9 h-9 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="text-yellow-600" size={18} />
                </div>
              </div>
            </div>
          )}

          {/* Inactive */}
          {!isAgent && (
            <div
              className="bg-white w-50 h-15 rounded-lg p-2.5 shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer"
              onClick={() => setStageModal("Inactive")}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">
                    Inactive
                  </p>
                  <p className="text-lg font-bold text-gray-800 mt-1">
                    {stageStats["Inactive"] || 0}
                  </p>
                </div>
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                  <UserX className="text-gray-600" size={18} />
                </div>
              </div>
            </div>
          )}

          {/* Onboarded */}
          {!isAgent && (
            <div
              className="bg-white w-50 h-15 rounded-lg p-2.5 shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer"
              onClick={() => setStageModal("Onboard")}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">
                    Onboarded
                  </p>
                  <p className="text-lg font-bold text-blue-800 mt-1">
                    {stageStats["Onboard"] || 0}
                  </p>
                </div>
                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Rocket className="text-blue-600" size={18} />
                </div>
              </div>
            </div>
          )}

          {/* Total Posts */}
          {!isAgent && (
            <div className="bg-white w-50 h-15  rounded-lg p-2.5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 font-medium">
                    Total Posts
                  </p>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {totalPostsCount}
                  </p>
                </div>
                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ImageIcon className="text-blue-600" size={18} />
                </div>
              </div>
              {filterLabel && (
                <div className="mt-1 pt-1 border-t border-gray-100 text-xs text-gray-500 flex items-center gap-1">
                  <Calendar size={11} />
                  {filterLabel}
                </div>
              )}
            </div>
          )}

          {/* Users Today */}
          <div className="bg-gradient-to-br w-50 h-15 rounded-lg p-2.5 shadow-sm border border-teal-200 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-teal-700 font-medium">Users Today</p>
                <p className="text-lg font-bold text-teal-800 ">
                  {displayTodayUsersCount}
                </p>
              </div>
              <div className="w-9 h-9 bg-teal-200 rounded-lg flex items-center justify-center">
                <User className="text-teal-700" size={18} />
              </div>
            </div>
          </div>

          {/* Total Revenue - Role-based visibility */}
          {(role === "superAdmin" ||
            role === "franchiseAdmin" ||
            role === "agent") && (
            <div
              className=" w-50 h-15 bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-2.5 shadow-sm border border-emerald-200 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => {
                fetchRevenueUsers();
                setShowRevenueUsersModal(true);
              }}
              title="Click to view onboarded users details"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-emerald-700 font-medium group-hover:underline">
                    {role === "superAdmin" || role === "superFranchiseAdmin"
                      ? "User Onboard Revenue"
                      : "My Revenue"}
                  </p>
                  <p className="text-lg font-bold text-emerald-800 mt-1">
                    ₹{totalRevenue.toLocaleString()}
                  </p>
                </div>
                <div className="w-9 h-9 bg-emerald-200 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Wallet className="text-emerald-700" size={18} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Stats Cards - Separate Row */}
        <div className="grid grid-cols-2 md:grid-cols-5  mb-6">
          {/* Total Chats */}
          <div
            className=" w-50 h-15 bg-white rounded-lg p-3 pt-2  shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer"
            onClick={() => {
              setChatModalFilter("all");
              setShowChatStatsModal(true);
              fetchChatStats();
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Chats</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {displayTotalChatsCount}
                </p>
              </div>
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="text-orange-600" size={20} />
              </div>
            </div>
          </div>

          {/* Chats Today */}
          {!isAgent && (
            <div
              className="w-50 h-15  bg-white rounded-lg p-3 pt-2 pt-2  shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer"
              onClick={() => {
                setChatModalFilter("today");
                setShowChatStatsModal(true);
                fetchChatStats();
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">
                    Chats Today
                  </p>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {chatStats.today}
                  </p>
                </div>
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="text-teal-600" size={20} />
                </div>
              </div>
            </div>
          )}

          {/* Resolved */}
          {!isAgent && (
            <div
              className="w-50 h-15 bg-white rounded-lg p-3 pt-2 pt-2 shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer"
              onClick={() => {
                setChatModalFilter("resolved");
                setShowChatStatsModal(true);
                fetchChatStats();
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Resolved</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {chatStats.resolved}
                  </p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Shield className="text-green-600" size={20} />
                </div>
              </div>
            </div>
          )}

          {/* <div 
            className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 shadow-lg border border-red-200 cursor-pointer hover:shadow-xl transition-all"
            onClick={() => setShowIssuesModal(true)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-700 text-sm font-medium">Reported Issues</p>
                <p className="text-3xl font-bold text-red-800 mt-1">{issues.length}</p>
              </div>
              <Shield className="text-red-600" size={24} />
            </div>
          </div> */}
        </div>
        {callStats && (role === "superAdmin" || role === "admin") && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Call Performance
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {/* Total Calls */}
              <div className="bg-blue-50 w-40 h-15 border border-blue-200 rounded-xl p-3 flex flex-col">
                <span className="text-xs text-blue-700 font-medium">
                  Total Calls Today
                </span>
                <span className="text-lg font-bold text-blue-800">
                  {callStats.totalCallsToday}
                </span>
              </div>

              {/* Agent Calls */}
              {callStats.todayCallsByAgent.map((agent) => (
                <div
                  key={agent.agentId || agent.agentName}
                  className="bg-gray-50 w-40 h-15 border border-gray-200 rounded-xl p-2 flex flex-col"
                >
                  <span className="text-xs text-gray-600 truncate">
                    {agent.agentName}
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    {agent.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6 border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 flex items-center gap-2">
              <div className="relative flex-grow">
                <Search
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search by email, user ID, or phone number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-5 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-semibold flex items-center gap-2"
              >
                <Search size={18} />
                <span>Search</span>
              </button>
            </div>

            <div className="relative">
              <select
                value={leadStageFilter}
                onChange={(e) => setLeadStageFilter(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none appearance-none bg-white cursor-pointer min-w-[150px]"
              >
                <option value="All">All Stages</option>
                <option value="Active">Active</option>
                <option value="Follow Up">Follow Up</option>
                <option value="Inactive">Inactive</option>
                <option value="Onboard">Onboard</option>
              </select>
            </div>

            {(role === "superAdmin" ||
              role === "admin" ||
              role === "superfranchiseAdmin") && (
              <>
                <div className="relative">
                  <select
                    value={assigneeFilter}
                    onChange={(e) => setAssigneeFilter(e.target.value)}
                    className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none appearance-none bg-white cursor-pointer min-w-[150px]"
                  >
                    <option value="All">All Agents</option>
                    <option value="Unassigned">Unassigned</option>
                    {agents.map((agent) => (
                      <option key={agent._id} value={agent._id}>
                        {agent.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                {(role === "superAdmin" ||
                  role === "admin" ||
                  role === "superfranchiseAdmin") && (
                  <div className="relative">
                    <select
                      value={leadStatusFilter}
                      onChange={(e) => setLeadStatusFilter(e.target.value)}
                      className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none appearance-none bg-white cursor-pointer min-w-[150px]"
                    >
                      <option value="All">All Lead Status</option>
                      <option value="Hot">Hot Leads</option>
                      <option value="Warm">Warm Leads</option>
                      <option value="Cold">Cold Leads</option>
                      <option value="Untagged">None</option>
                    </select>
                  </div>
                )}
              </>
            )}

            <div className="relative">
              <Calendar
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="pl-11 pr-8 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none appearance-none bg-white cursor-pointer min-w-[180px]"
              >
                <option value="All">All Time</option>
                <option value="Today">Today</option>
                <option value="Last 7 Days">Last 7 Days</option>
                <option value="Last 30 Days">Last 30 Days</option>
                <option value="This Month">This Month</option>
                <option value="Custom Range">Custom Range</option>
              </select>
            </div>

            {filterDate === "Custom Range" && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="Start Date"
                />
                <span className="text-gray-400">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="End Date"
                />
              </div>
            )}

            {(searchQuery ||
              filterStatus !== "All" ||
              filterDate !== "All" ||
              assigneeFilter !== "All" ||
              leadStatusFilter !== "All") && (
              <button
                onClick={clearFilters}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all flex items-center gap-2 whitespace-nowrap"
              >
                <X size={18} />
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col max-h-[100vh]">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-indigo-50 to-purple-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Joined Date
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    User Name
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Assign To
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Remarks
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Lead Stage
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Chat
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Wallet
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Posts
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Business Name
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
            </table>
          </div>
          <div className="overflow-y-auto flex-grow">
            <table className="min-w-full">
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => {
                  const postData = userPostsData[user.userId] || {
                    total: 0,
                    posted: 0,
                    rejected: 0,
                  };
                  return (
                    <tr
                      key={user._id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleViewPosts(user)}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          <div className="text-sm text-gray-700">
                            {user.createdAt ? (
                              <>
                                <div className="font-medium">
                                  {new Date(user.createdAt).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    },
                                  )}
                                </div>
                                {new Date(user.createdAt).toDateString() ===
                                  new Date().toDateString() && (
                                  <span className="inline-block mt-0.5 px-2 py-0.5 text-xs text-blue-700 bg-blue-100 rounded-full font-semibold">
                                    Today
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-gray-400 italic">N/A</span>
                            )}
                          </div>
                        </div>
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
                                  <Eye size={14} className="text-gray-500" />
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
                                (typeof user.assignedAgentId === "string" &&
                                  user.assignedAgentId) ||
                                ""
                              }
                              onChange={(e) =>
                                handleAssignChange(user.userId, e.target.value)
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
                              <MessageSquare size={14} className="mr-1.5" />
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
                              <span className="truncate">{user.Remarks}</span>
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
                            handleLeadStageChange(user.userId, e.target.value)
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
                              <Phone size={14} className="text-gray-400" />
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
                            <span className="text-xs font-medium">coins</span>
                          </button>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg px-3 py-2 border border-indigo-200">
                            <div className="flex items-center gap-3">
                              <div className="text-center">
                                <p className="text-xs text-gray-600">Total</p>
                                <p className="text-lg font-bold text-indigo-600">
                                  {postData.total}
                                </p>
                              </div>
                              <div className="w-px h-8 bg-gray-300"></div>
                              <div className="text-center">
                                <p className="text-xs text-green-600">Posted</p>
                                <p className="text-lg font-bold text-green-600">
                                  {postData.posted}
                                </p>
                              </div>
                              <div className="w-px h-8 bg-gray-300"></div>
                              <div className="text-center">
                                <p className="text-xs text-red-600">Rejected</p>
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
                                View More ({user.businessListings.length - 1})
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
                          {(role === "superAdmin" || role === "agent") && (
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
                              handleVoiceCall(user.phone || user.mobileNumber);
                            }}
                            disabled={callingUserId === user.userId}
                            className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all disabled:opacity-50"
                            title="Voice Call"
                          >
                            {callingUserId === user.userId ? (
                              <RefreshCw size={16} className="animate-spin" />
                            ) : (
                              <Phone size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="10" className="text-center py-12">
                      <div className="text-gray-400">
                        <Search size={48} className="mx-auto mb-3 opacity-50" />
                        <p className="text-lg font-medium">No users found</p>
                        <p className="text-sm">
                          Try adjusting your search or filters
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* Pagination Controls */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-3 bg-white rounded-b-2xl border-t border-gray-200">
            <span className="text-sm text-gray-600">
              Page{" "}
              <span className="font-semibold">{pagination.currentPage}</span> of{" "}
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
            <div className="flex items-center gap-2 mb-4">
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

      {showChatStatsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-4xl max-h-[80vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
              <h2 className="text-2xl font-bold text-gray-800">
                {chatModalFilter === "today"
                  ? "Chats Today"
                  : chatModalFilter === "resolved"
                    ? "Resolved Chats"
                    : "All Chats"}
              </h2>
              <button
                onClick={() => setShowChatStatsModal(false)}
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
                  {chatStats.data
                    .filter((chat) => {
                      // Filter for agents: only show chats from their assigned users
                      if (role === "agent") {
                        // Check if the chat's user is in the currently fetched users list (which is filtered for the agent)
                        if (!users.some((u) => u.userId === chat.userId))
                          return false;
                      }

                      if (chatModalFilter === "today") {
                        if (!chat.createdAt) return false;
                        const chatDate = new Date(chat.createdAt);
                        const todayDate = new Date();
                        return (
                          chatDate.getDate() === todayDate.getDate() &&
                          chatDate.getMonth() === todayDate.getMonth() &&
                          chatDate.getFullYear() === todayDate.getFullYear()
                        );
                      }
                      if (chatModalFilter === "resolved") {
                        return chat.status === "resolved";
                      }
                      return true;
                    })
                    .map((chat, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(chat.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-800 font-medium">
                          <div>{chat.user?.fullName || "Unknown"}</div>
                          <div className="text-xs text-gray-500">
                            {chat?.user?.fullName}
                          </div>
                          <div>{chat.fullName || "Unknown"}</div>
                          <div className="text-xs text-gray-500">
                            {chat.mobile}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                          {chat.issue || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              chat.status === "resolved"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {chat.status || "open"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  {chatStats.data.filter((chat) => {
                    if (role === "agent") {
                      if (!users.some((u) => u.userId === chat.userId))
                        return false;
                    }

                    if (chatModalFilter === "today") {
                      if (!chat.createdAt) return false;
                      const chatDate = new Date(chat.createdAt);
                      const todayDate = new Date();
                      return (
                        chatDate.getDate() === todayDate.getDate() &&
                        chatDate.getMonth() === todayDate.getMonth() &&
                        chatDate.getFullYear() === todayDate.getFullYear()
                      );
                    }
                    if (chatModalFilter === "resolved") {
                      return chat.status === "resolved";
                    }
                    return true;
                  }).length === 0 && (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        No chats found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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

      {/* Stage Breakdown Modal */}
      {stageModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl transform transition-all">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h2 className="text-xl font-bold text-gray-800">
                {stageModal} Leads Breakdown
              </h2>
              <button
                onClick={() => setStageModal(null)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto pr-2">
              <table className="w-full">
                {role === "agent" ? (
                  // Agent View: Show List of Users
                  <>
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                          User Name
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase">
                          Phone
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {users
                        .filter((u) => (u.leadStage || "Active") === stageModal)
                        .map((user, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                              {user.fullName || "Unknown"}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 text-right">
                              {user.phone || user.mobileNumber || "N/A"}
                            </td>
                          </tr>
                        ))}
                      {users.filter(
                        (u) => (u.leadStage || "Active") === stageModal,
                      ).length === 0 && (
                        <tr>
                          <td
                            colSpan="2"
                            className="text-center py-4 text-gray-500 text-sm"
                          >
                            No users found on this page
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </>
                ) : (
                  // Admin View: Show Agent Breakdown
                  <>
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                          Agent
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase">
                          Count
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {Object.values(
                        detailedStats
                          .filter((item) => item.stage === stageModal)
                          .reduce((acc, item) => {
                            const agentName =
                              item.agentId === "Unassigned"
                                ? "Unassigned"
                                : agents.find((a) => a._id === item.agentId)
                                    ?.fullName || "Unknown Agent";

                            if (!acc[agentName]) {
                              acc[agentName] = { agentName, count: 0 };
                            }

                            acc[agentName].count += item.count;

                            return acc;
                          }, {}),
                      )
                        .sort((a, b) => b.count - a.count)
                        .map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                              {item.agentName}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-800 text-right font-bold">
                              {item.count}
                            </td>
                          </tr>
                        ))}

                      {detailedStats.filter((item) => item.stage === stageModal)
                        .length === 0 && (
                        <tr>
                          <td
                            colSpan="2"
                            className="text-center py-4 text-gray-500 text-sm"
                          >
                            No leads in this stage
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* User Onboard Revenue Details Modal ✅ NEW */}
      {showRevenueUsersModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-6xl max-h-[90vh] w-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-green-50">
              <div>
                <h2 className="text-2xl font-bold text-emerald-800">
                  User Onboard Revenue Details
                </h2>
                <p className="text-sm text-emerald-700 mt-1">
                  All users with `type: user_onboard` revenue entries
                </p>
              </div>
              <button
                onClick={() => {
                  setShowRevenueUsersModal(false);
                  setRevenueUsersList([]);
                }}
                className="p-2 hover:bg-emerald-200 rounded-xl transition-all"
              >
                <X size={20} className="text-emerald-700" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingRevenueUsers ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center text-center">
                    <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
                    <p className="text-gray-600 font-medium">
                      Loading onboarded users...
                    </p>
                  </div>
                </div>
              ) : revenueUsersList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-gray-500">
                  <Wallet className="w-16 h-16 mx-auto mb-4 opacity-40" />
                  <h3 className="text-xl font-semibold mb-2 text-gray-600">
                    No Onboarded Users Yet
                  </h3>
                  <p className="text-gray-500">
                    No users with `user_onboard` revenue entries found for your
                    account.
                  </p>
                  <p className="text-sm mt-1 text-gray-400">
                    Onboard users using the ✅ button in the user table
                  </p>
                </div>
              ) : (
                <>
                  {/* Table */}
                  <div className="overflow-x-auto rounded-2xl border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Plan
                          </th>
                          <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Screenshot
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Notes
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {revenueUsersList.map((revenue, index) => (
                          <tr
                            key={revenue._id || index}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="font-semibold text-gray-900">
                                {revenue.leadName}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {revenue.leadId}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                UTR: {revenue.utrNumber || "N/A"}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex px-3 py-1 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full">
                                {revenue.plan || "N/A"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="text-xl font-bold text-emerald-700">
                                ₹{revenue.amount?.toLocaleString() || 0}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">
                                {new Date(revenue.createdAt).toLocaleDateString(
                                  "en-IN",
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(revenue.createdAt).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {revenue.paymentScreenshot ? (
                                <button
                                  onClick={() =>
                                    setFullViewImage(revenue.paymentScreenshot)
                                  }
                                  className="flex items-center gap-2 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-all text-sm font-medium"
                                >
                                  <Eye size={14} />
                                  View Proof
                                </button>
                              ) : (
                                <span className="text-sm text-gray-400 italic">
                                  No screenshot
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 max-w-xs">
                              <div className="text-sm text-gray-900 line-clamp-2">
                                {revenue.notes || "No notes"}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Footer Totals */}
                  <div className="mt-6 pt-6 border-t border-gray-200 bg-emerald-50/50 rounded-2xl p-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <p className="text-sm text-gray-600">
                          Total Onboarded Users:
                        </p>
                        <p className="text-2xl font-bold text-emerald-800">
                          {revenueUsersList.length}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Total Revenue:</p>
                        <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                          ₹
                          {revenueUsersList
                            .reduce((sum, r) => sum + (r.amount || 0), 0)
                            .toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

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
      {showRevenueUsersModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Onboarded Users Revenue
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  Total: ₹{totalRevenue.toLocaleString()} from {revenueCount}{" "}
                  users
                </p>
              </div>

              <button
                onClick={() => setShowRevenueUsersModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              {loadingRevenueUsers ? (
                <div className="flex items-center justify-center py-12 text-gray-500">
                  <RefreshCw className="w-8 h-8 animate-spin mr-3" />
                  <span>Loading onboarded users...</span>
                </div>
              ) : revenueUsersList.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Wallet className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <h3 className="text-xl font-semibold mb-2 text-gray-500">
                    No onboarded users yet
                  </h3>
                  <p className="text-gray-400">
                    Use the onboard button next to users to record revenue
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          User
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          Plan
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          Screenshot
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          Notes
                        </th>
                      </tr>
                    </thead>

                    <tbody className="bg-white divide-y divide-gray-200">
                      {revenueUsersList.map((revenue, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-gray-900">
                              {revenue.leadName}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {revenue.leadId}
                            </div>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <div className="text-lg font-bold text-emerald-600">
                              ₹{revenue.amount?.toLocaleString()}
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className="px-3 py-1 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full">
                              {revenue.plan || "N/A"}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-sm text-gray-600">
                            {new Date(revenue.createdAt).toLocaleDateString()}
                          </td>

                          <td className="px-6 py-4">
                            {revenue.paymentScreenshot ? (
                              <button
                                onClick={() =>
                                  setFullViewImage(revenue.paymentScreenshot)
                                }
                                className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-all text-sm font-medium"
                              >
                                <Eye size={14} />
                                View Proof
                              </button>
                            ) : (
                              <span className="text-sm text-gray-400 italic">
                                No screenshot
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            <div
                              className="text-sm text-gray-700 max-w-xs truncate"
                              title={revenue.notes}
                            >
                              {revenue.notes || "N/A"}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 bg-gray-50 rounded-b-3xl p-4">
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>
                  Total Onboarded Users:
                  <span className="font-bold text-gray-900">
                    {revenueUsersList.length}
                  </span>
                </span>

                <span>
                  Total Revenue:
                  <span className="font-bold text-emerald-600">
                    ₹{totalRevenue.toLocaleString()}
                  </span>
                </span>
              </div>

              <button
                onClick={() => setShowRevenueUsersModal(false)}
                className="w-full mt-4 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-semibold"
              >
                Close
              </button>
            </div>
          </div>

          {/* 🔥 Payment Screenshot Viewer */}
          {fullViewImage && (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[999] p-6">
              <button
                onClick={() => setFullViewImage(null)}
                className="absolute top-8 right-8 text-white bg-black/60 hover:bg-black/80 p-3 rounded-full"
              >
                <X size={28} />
              </button>

              <img
                src={fullViewImage}
                alt="Payment Proof"
                className="max-h-[90vh] max-w-[90vw] rounded-xl shadow-2xl"
              />
            </div>
          )}
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
    </div>
  );
}
