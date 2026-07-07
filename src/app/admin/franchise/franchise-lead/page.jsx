"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  Users,
  Phone,
  Mail,
  MapPin,
  Clock,
  Banknote,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  ChevronDown,
  TrendingUp,
  UserCheck,
  UserX,
  Activity,
  Search,
  Download,
  Filter,
  X,
  Eye,
  Calendar,
  AlertCircle,
  MessageSquare,
  Send,
  ArrowUpDown,
  User,
  Plus,
  Trash2,
  MessageCircle,
  Flame,
  Sun,
  Snowflake,
  DollarSign,
  Upload,
  BadgeCheck,
  Edit3,
} from "lucide-react";
import { uploadToS3Action } from "@/app/actions/uploadS3Actions";
import toast, { Toaster } from "react-hot-toast";
import Lottie from "lottie-react";
import animationData from "@/assets/animation/Loading.json"; // if not using public
import { useFollowUpVoiceAlerts } from "@/hooks/useFollowUpVoiceAlerts";
import FollowUpDueAlertModal from "@/components/FollowUpDueAlertModal";

/* ---------------- CONFIG ---------------- */
const PAGE_SIZE = 50;

/** Stable string id for checkboxes + bulk actions (avoids ObjectId vs string mismatch). */
function franchiseLeadIdKey(id) {
  return id == null ? "" : String(id);
}

const FORMS = [
  {
    id: "1213106820766164",
    label: "Franchise Leads",
  },
];

const STATUS_STEPS = [
  { label: "Active", color: "bg-blue-100 text-blue-700 border-blue-200" },
  {
    label: "Follow Up",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  { label: "Inactive", color: "bg-gray-100 text-gray-700 border-gray-200" },
  { label: "Onboard", color: "bg-green-100 text-green-700 border-green-200" },
];

const LEAD_QUALITIES = [
  {
    label: "None",
    value: "None",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    icon: User,
  },
  {
    label: "Hot🔥",
    value: "Hot",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: Flame,
  },
  {
    label: "Warm☀️",
    value: "Warm",
    color: "bg-orange-100 text-orange-700 border-orange-200",
    icon: Sun,
  },
  {
    label: "Cold❄️",
    value: "Cold",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Snowflake,
  },
];

const QUICK_REMARKS = [
  "Call Not Picked",
  "Not Interested",
  "Interested",
  "Call Back Later",
  "Wrong Number",
  "Switch Off",
  "Meeting Scheduled",
];

/** Same as user-management: these open the follow-up date picker */
const FOLLOW_UP_REMARKS = ["Call Not Picked", "Call Back Later"];

/** IVR interest timestamp from API (ISO string) → readable India locale. */
function formatIvrInterestedAtDisplay(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Match `/api/admin/franchise-follow-up-stats` (Asia/Kolkata, no DST). */
function getFranchiseFuBucketBounds(filter) {
  if (filter === "all") return null;
  const parts = {};
  for (const { type, value } of new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date())) {
    if (type !== "literal") parts[type] = value;
  }
  const y = parts.year;
  const mo = parts.month;
  const da = parts.day;
  const ist = (yy, mm, dd, hh = 0, mi = 0) =>
    new Date(
      `${yy}-${mm}-${dd}T${String(hh).padStart(2, "0")}:${String(mi).padStart(2, "0")}:00+05:30`,
    );
  const todayStart = ist(y, mo, da, 0, 0);
  const tomorrowStart = new Date(todayStart.getTime() + 86400000);
  const tomorrowEnd = new Date(tomorrowStart.getTime() + 86400000);
  const next7DaysEnd = new Date(todayStart.getTime() + 7 * 86400000);
  const yNum = parseInt(y, 10);
  const mNum = parseInt(mo, 10);
  let nextM = mNum + 1;
  let nextY = yNum;
  if (nextM > 12) {
    nextM = 1;
    nextY += 1;
  }
  const thisMonthStart = ist(y, mo, "01", 0, 0);
  const thisMonthEnd = ist(
    String(nextY),
    String(nextM).padStart(2, "0"),
    "01",
    0,
    0,
  );
  switch (filter) {
    case "today":
      return { start: todayStart, end: tomorrowStart };
    case "tomorrow":
      return { start: tomorrowStart, end: tomorrowEnd };
    case "next7days":
      return { start: todayStart, end: next7DaysEnd };
    case "thisMonth":
      return { start: thisMonthStart, end: thisMonthEnd };
    default:
      return null;
  }
}

/* ---------------- NORMALIZE LEAD ---------------- */
const normalizeLead = (lead) => {
  // Treat "Cold" as "None" for backward compatibility
  const normalizedQuality =
    lead.lead_quality === "Cold" || !lead.lead_quality
      ? "None"
      : lead.lead_quality;

  const obj = {
    id: lead.id,
    created_time: lead.created_time,
    status: lead.status || "Active",
    remarks: lead.remarks || [],
    lead_quality: normalizedQuality,
    assignedFranchiseAdmin: lead.assignedFranchiseAdmin,
    whatsapp_count: lead.whatsapp_count || 0,
    source: lead.source || "meta",
    ivrMeInterested: lead.ivrMeInterested === true,
    ivrMeInterestedAt: lead.ivrMeInterestedAt || null,
  };

  if (lead.field_data) {
    lead.field_data.forEach((f) => {
      obj[f.name] = f.values?.[0] || "";
    });
  }

  obj.full_name =
    (obj.full_name || "").trim() || (lead.fullName || "").trim() || "";

  return obj;
};

export default function FranchiseLeadsPage() {
  const [formId] = useState(FORMS[0].id);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalLeads, setTotalLeads] = useState(0);
  const [dbStats, setDbStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    followup: 0,
    onboard: 0,
  });
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLead, setSelectedLead] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [assigneeFilter, setAssigneeFilter] = useState("All");
  const [remarkFilter, setRemarkFilter] = useState("All");
  const [remarkCountFilter, setRemarkCountFilter] = useState("All");
  const [filterLoading, setFilterLoading] = useState(false);
  const [qualityFilter, setQualityFilter] = useState("All");
  const remarkFilterMounted = useRef(false);
  /** Table view: all leads vs only IVR “Me interested” (mutually exclusive tabs). */
  const [ivrLeadTab, setIvrLeadTab] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [error, setError] = useState(null);
  const [remarkModalLead, setRemarkModalLead] = useState(null);
  const [newRemark, setNewRemark] = useState("");
  const [remarkHistory, setRemarkHistory] = useState({});
  const [franchiseAdmins, setFranchiseAdmins] = useState([]);
  const [role, setRole] = useState("");
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [bulkAssignee, setBulkAssignee] = useState("");
  const [sendingFranchiseMsg, setSendingFranchiseMsg] = useState(false);
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [newLead, setNewLead] = useState({ lead_quality: "None" });
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [meetingData, setMeetingData] = useState({
    date: "",
    link: "",
    meetingId: "",
    passcode: "",
  });

  const [selectedRows, setSelectedRows] = useState([]);
  const handleSelectRow = (rowId) => {
    setSelectedRows((prev) =>
      prev.includes(rowId) ? prev.filter((id) => id !== rowId) : [...prev, rowId]
    );
  };

  // State add karo component ke top me
  const [isWhatsappTemplateModalOpen, setIsWhatsappTemplateModalOpen] =
    useState(false);

  const handleFilterChange = (setter, value) => {
    setFilterLoading(true);
    setter(value);
  };

  const [followUpDateFranchise, setFollowUpDateFranchise] = useState("");
  const [followUpTimeFranchise, setFollowUpTimeFranchise] = useState("10:00");
  const [franchiseCallStats, setFranchiseCallStats] = useState(null);
  const [franchiseFollowUpStats, setFranchiseFollowUpStats] = useState({
    totalFollowUps: 0,
    todayFollowUps: 0,
    tomorrowFollowUps: 0,
    next7DaysFollowUps: 0,
    thisMonthFollowUps: 0,
    byAgent: [],
    leads: [],
  });
  const [franchiseFollowUpFilter, setFranchiseFollowUpFilter] = useState("all");
  /** All scheduled follow-ups (filter=all) for voice alerts + pending strip */
  const [franchiseFollowUpLeadsAll, setFranchiseFollowUpLeadsAll] = useState(
    [],
  );
  const [franchiseFollowUpLeadsAllLoaded, setFranchiseFollowUpLeadsAllLoaded] =
    useState(false);

  /** Narrow main table to follow-up bucket only when a period is selected (not "All time"). */
  const franchiseFollowUpTableActive = useMemo(
    () => franchiseFollowUpFilter !== "all",
    [franchiseFollowUpFilter],
  );
  const [franchiseFollowUpsLoading, setFranchiseFollowUpsLoading] =
    useState(false);
  const [franchiseByAgentOpen, setFranchiseByAgentOpen] = useState(false);
  const [franchiseFollowLeadsOpen, setFranchiseFollowLeadsOpen] =
    useState(false);
  /** franchiseAdmin: pending strip — Call Not Picked vs Call Back Later */
  const [franchisePendingRemarkTab, setFranchisePendingRemarkTab] =
    useState("call_not_picked");

  // Revenue state
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [revenueModalLead, setRevenueModalLead] = useState(null);
  const [revenueData, setRevenueData] = useState({
    amount: "",
    screenshot: null,
    notes: "",
  });
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [revenueCount, setRevenueCount] = useState(0);
  const [leadRevenueStatus, setLeadRevenueStatus] = useState({}); // Track which leads have paid
  const [fullViewImage, setFullViewImage] = useState(null);
  const [onboardBreakdown, setOnboardBreakdown] = useState([]);
  const [editingLeadId, setEditingLeadId] = useState(null);
  const [editNameValue, setEditNameValue] = useState("");
  const [followUpDueAlert, setFollowUpDueAlert] = useState(null);

  const franchiseFollowUpFilterLabel = useMemo(() => {
    const labels = {
      today: "Today",
      tomorrow: "Tomorrow",
      next7days: "Next 7 days",
      thisMonth: "This month",
      all: "All time",
    };
    return labels[franchiseFollowUpFilter] || franchiseFollowUpFilter;
  }, [franchiseFollowUpFilter]);

  const canSelectFranchiseLeads = useMemo(
    () =>
      ["superAdmin", "superFranchiseAdmin", "franchiseAdmin"].includes(role),
    [role],
  );

  const canBulkAssignLeads =
    role === "superFranchiseAdmin" || role === "superAdmin";

  const selectedLeadIdSet = useMemo(
    () => new Set(selectedLeads.map(franchiseLeadIdKey)),
    [selectedLeads],
  );

  const franchiseVoiceItems = useMemo(() => {
    const source = franchiseFollowUpLeadsAllLoaded
      ? franchiseFollowUpLeadsAll
      : franchiseFollowUpStats.leads || [];
    return source.map((l, idx) => ({
      kind: "franchise",
      id: `${l.leadId}-${idx}`,
      name: l.fullName || l.phone || String(l.leadId || "") || "Lead",
      phone: l.phone || "",
      leadId: l.leadId,
      followUpDate: l.followUpDate,
    }));
  }, [
    franchiseFollowUpLeadsAllLoaded,
    franchiseFollowUpLeadsAll,
    franchiseFollowUpStats.leads,
  ]);

  /** Due/overdue only, scoped to selected follow-up period (same buckets as summary cards). */
  const franchisePendingFollowUpsInView = useMemo(() => {
    if (role !== "franchiseAdmin") return [];
    const now = Date.now();
    const bounds = getFranchiseFuBucketBounds(franchiseFollowUpFilter);
    return (franchiseFollowUpLeadsAll || [])
      .filter((l) => {
        if (!l.followUpDate || new Date(l.followUpDate).getTime() > now)
          return false;
        if (!bounds) return true;
        const t = new Date(l.followUpDate).getTime();
        return t >= bounds.start.getTime() && t < bounds.end.getTime();
      })
      .sort(
        (a, b) =>
          new Date(a.followUpDate).getTime() -
          new Date(b.followUpDate).getTime(),
      );
  }, [role, franchiseFollowUpLeadsAll, franchiseFollowUpFilter]);

  const franchisePendingByRemark = useMemo(() => {
    const src = franchisePendingFollowUpsInView;
    return {
      call_not_picked: src.filter((l) =>
        /^Call Not Picked/i.test(l.remark || ""),
      ),
      call_back_later: src.filter((l) =>
        /^Call Back Later/i.test(l.remark || ""),
      ),
      other: src.filter(
        (l) =>
          !/^Call Not Picked/i.test(l.remark || "") &&
          !/^Call Back Later/i.test(l.remark || ""),
      ),
    };
  }, [franchisePendingFollowUpsInView]);

  const franchiseVoiceAlertsEnabled =
    role === "superAdmin" ||
    role === "superFranchiseAdmin" ||
    role === "franchiseAdmin";
  useFollowUpVoiceAlerts(franchiseVoiceItems, {
    enabled: franchiseVoiceAlertsEnabled,
    onDueAlert: setFollowUpDueAlert,
  });

  /* ---------------- FETCH REVENUE DATA ---------------- */
  const fetchRevenue = async () => {
    const userEmail = localStorage.getItem("email");
    const userRole = localStorage.getItem("role");

    if (!userEmail || !userRole) return;

    try {
      const res = await fetch(
        `/api/franchise-revenue?email=${userEmail}&role=${userRole}`,
      );

      console.log("frenchiese response: ", res);

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // For superAdmin, show only franchise revenue on this page
          if (userRole === "superAdmin" || userRole === "superFranchiseAdmin") {
            setTotalRevenue(data.totalFranchiseRevenue || 0);
            setRevenueCount(data.franchiseLeadCount || 0);
          } else {
            setTotalRevenue(data.totalRevenue || 0);
            setRevenueCount(data.count || 0);
          }

          // Check for paid leads and update status
          const status = {};
          if (data.revenue) {
            data.revenue
              .filter(
                (rev) => rev.type === "franchise_lead" && rev.paymentScreenshot,
              )
              .forEach((rev) => {
                if (!status[rev.leadId]) {
                  status[rev.leadId] = rev.paymentScreenshot;
                }
              });
            setLeadRevenueStatus(status);
          }

          // Calculate Onboard Leads Breakdown for super admins
          if (
            (userRole === "superAdmin" || userRole === "superFranchiseAdmin") &&
            data.revenue
          ) {
            const breakdown = data.revenue
              .filter((rev) => rev.type === "franchise_lead")
              .reduce((acc, rev) => {
                const adminId = rev.onboardedBy?._id;
                if (!adminId) return acc;

                if (!acc[adminId]) {
                  acc[adminId] = {
                    name: rev.onboardedBy.fullName || "Unknown Admin",
                    count: 0,
                    revenue: 0,
                  };
                }
                acc[adminId].count += 1;
                acc[adminId].revenue += rev.amount || 0;
                return acc;
              }, {});
            setOnboardBreakdown(
              Object.values(breakdown).sort((a, b) => b.revenue - a.revenue),
            );
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch revenue", err);
    }
  };

  /* ---------------- FETCH LEADS FROM API ---------------- */
  const fetchLeads = async () => {
    setLoading(true);
    setError(null);

    const userEmail = localStorage.getItem("email");

    // Dynamic Date Calculation on Frontend
    let startDateParam = "";
    let endDateParam = "";
    const now = new Date();

    if (dateRange === "today") {
      startDateParam = new Date(now.toDateString()).toISOString();
    } else if (dateRange === "week") {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      startDateParam = new Date(d.toDateString()).toISOString();
    } else if (dateRange === "month") {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      startDateParam = new Date(d.toDateString()).toISOString();
    } else if (dateRange === "custom" && customStartDate && customEndDate) {
      startDateParam = customStartDate;
      endDateParam = customEndDate;
    }

    try {
      const queryParams = new URLSearchParams({
        formId: formId,
        page: currentPage.toString(),
        limit: PAGE_SIZE.toString(),
        email: userEmail || "",
        status: statusFilter,
        assigneeId: assigneeFilter,
        lead_quality: qualityFilter,
        remarkFilter: remarkFilter,
        remarkCountFilter: remarkCountFilter,
        search: search,
        startDate: startDateParam,
        endDate: endDateParam,
      });

      const res = await fetch(`/api/franchise-leads?${queryParams.toString()}`);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        const normalizedLeads = data.leads.map(normalizeLead);
        setLeads(normalizedLeads);

        // Use filtered_count for active total pagination
        setTotalLeads(data.summary?.filtered_count || normalizedLeads.length);

        // Save overall database summary statistics
        if (data.summary) {
          setDbStats({
            total: data.summary.total_count || 0,
            active: data.summary.active_count || 0,
            inactive: data.summary.inactive_count || 0,
            followup: data.summary.followup_count || 0,
            onboard: data.summary.onboard_count || 0,
          });
        }

        // Populate remark history
        const history = {};
        normalizedLeads.forEach((lead) => {
          if (lead.remarks && lead.remarks.length > 0) {
            history[lead.id] = lead.remarks
              .map((r) => ({
                text: r.text,
                timestamp: new Date(r.addedAt).toLocaleString(),
                user: r.addedBy,
                followUpDate: r.followUpDate,
              }))
              .reverse();
          }
        });
        setRemarkHistory(history);
      } else {
        throw new Error(data.message || "Failed to fetch leads");
      }
    } catch (err) {
      console.error("Failed to fetch leads", err);
      setError(err.message);
    }

    setLoading(false);
    setFilterLoading(false);
  };

  const openFranchiseRemarkForLeadId = useCallback(
    async (leadId) => {
      const idStr = String(leadId);
      const found = leads.find((l) => String(l.id) === idStr);
      if (found) {
        setRemarkModalLead(found);
        return;
      }
      try {
        const res = await fetch(
          `/api/franchise-leads?leadId=${encodeURIComponent(idStr)}`,
        );
        const data = await res.json();
        if (!data.success || !data.lead) {
          toast.error("Lead not found");
          return;
        }
        const L = data.lead;
        setRemarkModalLead(
          normalizeLead({
            id: L.id,
            created_time: L.createdTime,
            status: L.status,
            remarks: L.remarks || [],
            lead_quality: L.lead_quality,
            assignedFranchiseAdmin: L.assignedFranchiseAdmin,
            ivrMeInterested: L.ivrMeInterested,
            ivrMeInterestedAt: L.ivrMeInterestedAt || null,
            source: "meta",
            field_data: [
              { name: "full_name", values: [L.fullName || ""] },
              { name: "email", values: [L.email || ""] },
              { name: "phone_number", values: [L.phone || ""] },
              { name: "city", values: [L.city || ""] },
              {
                name: "what_is_your_current_occupation?",
                values: [L.occupation || ""],
              },
              { name: "mention_investment_rang", values: [L.investment || ""] },
            ],
          }),
        );
      } catch {
        toast.error("Could not open lead");
      }
    },
    [leads],
  );

  const fetchFranchiseAdmins = useCallback(() => {
    const userRole = localStorage.getItem("role");
    if (userRole === "superFranchiseAdmin" || userRole === "superAdmin") {
      fetch("/api/admin/franchise-admins")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setFranchiseAdmins(data.data);
        })
        .catch((err) => console.error("Error fetching admins:", err));
    }
  }, []);

  /* ---------------- LOAD ON MOUNT ---------------- */
  useEffect(() => {
    fetchLeads();
    fetchRevenue();
    const userRole = localStorage.getItem("role");
    setRole(userRole);
    fetchFranchiseAdmins();
  }, [formId, fetchFranchiseAdmins]);

  // Re-fetch API whenever page or any filter parameter changes
  useEffect(() => {
    fetchLeads();
  }, [
    formId,
    currentPage,
    statusFilter,
    assigneeFilter,
    remarkFilter,
    remarkCountFilter,
    qualityFilter,
    search,
    dateRange,
    customStartDate,
    customEndDate,
  ]);

  /* ---------------- FETCH ADMINS & ROLE ---------------- */
  useEffect(() => {
    const userRole = localStorage.getItem("role");
    setRole(userRole);
    fetchFranchiseAdmins();
  }, []);

  useEffect(() => {
    if (
      (role === "superAdmin" || role === "superFranchiseAdmin") &&
      franchiseFollowUpFilter === "next7days"
    ) {
      setFranchiseFollowUpFilter("all");
    }
  }, [role, franchiseFollowUpFilter]);

  useEffect(() => {
    if (remarkModalLead) {
      setFollowUpDateFranchise("");
      setFollowUpTimeFranchise("10:00");
    }
  }, [remarkModalLead]);

  useEffect(() => {
    if (!FOLLOW_UP_REMARKS.some((r) => newRemark.startsWith(r))) {
      setFollowUpDateFranchise("");
      setFollowUpTimeFranchise("10:00");
    }
  }, [newRemark]);

  useEffect(() => {
    const email = localStorage.getItem("email");
    const r = localStorage.getItem("role");
    if (
      !email ||
      !["superAdmin", "superFranchiseAdmin", "franchiseAdmin"].includes(r || "")
    )
      return;
    (async () => {
      try {
        const cRes = await fetch(
          `/api/admin/franchise-call-stats?email=${encodeURIComponent(email)}`,
        );
        const cData = await cRes.json();
        if (cData.success) setFranchiseCallStats(cData.stats);
      } catch (e) {
        console.error("Franchise call stats fetch failed", e);
      }
    })();
  }, [leads.length, formId]);

  useEffect(() => {
    const email = localStorage.getItem("email");
    const r = localStorage.getItem("role");
    if (
      !email ||
      !["superAdmin", "superFranchiseAdmin", "franchiseAdmin"].includes(r || "")
    )
      return;
    let cancelled = false;
    (async () => {
      setFranchiseFollowUpsLoading(true);
      try {
        const res = await fetch(
          `/api/admin/franchise-follow-up-stats?email=${encodeURIComponent(email)}&filter=${franchiseFollowUpFilter}`,
        );
        const data = await res.json();
        if (!cancelled && data.success) {
          setFranchiseFollowUpStats((prev) => ({ ...prev, ...data.stats }));
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setFranchiseFollowUpsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [franchiseFollowUpFilter, leads.length]);

  useEffect(() => {
    const email = localStorage.getItem("email");
    const r = localStorage.getItem("role");
    if (
      !email ||
      !["superAdmin", "superFranchiseAdmin", "franchiseAdmin"].includes(r || "")
    ) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/admin/franchise-follow-up-stats?email=${encodeURIComponent(email)}&filter=all`,
        );
        const data = await res.json();
        if (!cancelled && data.success) {
          setFranchiseFollowUpLeadsAll(data.stats.leads || []);
          setFranchiseFollowUpLeadsAllLoaded(true);
        }
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [leads.length, role]);

  /* ---------------- HELPER: COLOR GENERATOR ---------------- */
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

  /* ---------------- FILTERS ---------------- */
  const dateFilteredLeads = useMemo(() => {
    let result = leads;

    // Date filter
    if (dateRange !== "all") {
      const now = new Date();
      result = result.filter((lead) => {
        if (!lead.created_time) return false;
        const leadDate = new Date(lead.created_time); // Lead date
        const leadDateOnly = new Date(leadDate.toDateString()); // Normalize to midnight
        const todayOnly = new Date(now.toDateString());

        if (dateRange === "today")
          return leadDateOnly.getTime() === todayOnly.getTime();
        if (dateRange === "week") {
          const diffTime = Math.abs(todayOnly - leadDateOnly);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays <= 7;
        }
        if (dateRange === "month") {
          const diffTime = Math.abs(todayOnly - leadDateOnly);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays <= 30;
        }
        if (dateRange === "custom" && customStartDate && customEndDate) {
          const start = new Date(customStartDate);
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999); // Include the end date fully
          return leadDate >= start && leadDate <= end;
        }
        return true;
      });
    }

    return result;
  }, [leads, dateRange, customStartDate, customEndDate]);

  const { baseFilteredLeads, filteredLeads } = useMemo(() => {
    let result = dateFilteredLeads;

    // Search filter
    if (search) {
      result = result.filter((lead) => {
        const text = `
          ${lead.full_name || ""}
          ${lead.phone_number || ""}
          ${lead.email || ""}
          ${lead.city || ""}
          ${lead["what_is_your_current_occupation?"] || ""}
        `.toLowerCase();
        return text.includes(search.toLowerCase());
      });
    }

    // Status filter
    if (statusFilter !== "All") {
      result = result.filter((lead) => lead.status === statusFilter);
    }

    // Assignee Filter
    if (assigneeFilter !== "All") {
      if (assigneeFilter === "Unassigned") {
        result = result.filter((lead) => !lead.assignedFranchiseAdmin);
      } else {
        result = result.filter(
          (lead) => lead.assignedFranchiseAdmin?._id === assigneeFilter,
        );
      }
    }

    // Remark Filter
    if (remarkFilter !== "All") {
      if (remarkFilter === "Has Remarks") {
        result = result.filter(
          (lead) => lead.remarks && lead.remarks.length > 0,
        );
      } else if (remarkFilter === "No Remarks") {
        result = result.filter(
          (lead) => !lead.remarks || lead.remarks.length === 0,
        );
      } else {
        result = result.filter((lead) =>
          lead.remarks?.some((r) => r.text === remarkFilter),
        );
      }
    }

    // Remark Count Filter
    if (remarkCountFilter !== "All") {
      if (remarkCountFilter === "1 Remark") {
        result = result.filter((lead) => lead.remarks?.length === 1);
      } else if (remarkCountFilter === "2 Remarks") {
        result = result.filter((lead) => lead.remarks?.length === 2);
      } else if (remarkCountFilter === "3 Remarks") {
        result = result.filter((lead) => lead.remarks?.length === 3);
      } else if (remarkCountFilter === "More than 3 Remarks") {
        result = result.filter((lead) => (lead.remarks?.length || 0) > 3);
      }
    }

    // Quality Filter
    if (qualityFilter !== "All") {
      result = result.filter((lead) => lead.lead_quality === qualityFilter);
    }

    // Follow-up bucket cards — narrow main table to leads in the selected window
    if (franchiseFollowUpTableActive) {
      const fuList = franchiseFollowUpStats.leads || [];
      const seen = new Set();
      const orderedIds = [];
      for (const l of fuList) {
        const id = l?.leadId != null ? String(l.leadId) : "";
        if (!id || seen.has(id)) continue;
        seen.add(id);
        orderedIds.push(id);
      }
      const order = new Map(orderedIds.map((id, i) => [id, i]));
      result = result.filter((lead) => order.has(String(lead.id)));
      result.sort(
        (a, b) =>
          (order.get(String(a.id)) ?? 999999) -
          (order.get(String(b.id)) ?? 999999),
      );
    }

    const baseFilteredLeads = result;
    if (ivrLeadTab === "ivr") {
      result = result.filter((lead) => lead.ivrMeInterested === true);
    }

    return { baseFilteredLeads, filteredLeads: result };
  }, [
    dateFilteredLeads,
    search,
    statusFilter,
    assigneeFilter,
    remarkFilter,
    qualityFilter,
    franchiseFollowUpFilter,
    franchiseFollowUpTableActive,
    franchiseFollowUpStats.leads,
    ivrLeadTab,
    role,
  ]);

  const ivrInterestedInBaseCount = useMemo(
    () => baseFilteredLeads.filter((l) => l.ivrMeInterested === true).length,
    [baseFilteredLeads],
  );

  /* ---------------- ADMIN COUNTS ---------------- */
  const adminCounts = useMemo(() => {
    const counts = { Unassigned: 0 };
    franchiseAdmins.forEach((admin) => (counts[admin._id] = 0)); // Initialize
    leads.forEach((lead) => {
      const adminId = lead.assignedFranchiseAdmin?._id || "Unassigned";
      counts[adminId] = (counts[adminId] || 0) + 1;
    });
    return counts;
  }, [leads, franchiseAdmins]);

  /* ---------------- PAGINATION ---------------- */
  const paginatedLeads = leads;

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    statusFilter,
    dateRange,
    customStartDate,
    customEndDate,
    assigneeFilter,
    remarkFilter,
    remarkCountFilter,
    qualityFilter,
    franchiseFollowUpFilter,
    ivrLeadTab,
  ]);

  /* ---------------- STATS ---------------- */
  const stats = useMemo(() => {
    const baseStats = [
      {
        label: "Total Leads",
        value: dbStats.total,
        icon: Users,
        color: "text-blue-600",
      },
      {
        label: "Active",
        value: dbStats.active,
        icon: Activity,
        color: "text-blue-600",
      },
      {
        label: "Follow Up",
        value: dbStats.followup,
        icon: Clock,
        color: "text-yellow-600",
      },
      {
        label: "Onboard",
        value: dbStats.onboard,
        icon: UserCheck,
        color: "text-green-600",
      },
      {
        label: "Inactive",
        value: dbStats.inactive,
        icon: UserX,
        color: "text-gray-600",
      },
    ];

    // Add Revenue stat
    baseStats.push({
      label: "Total Revenue",
      value: `₹${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-emerald-600",
      subtitle: `${revenueCount} Franchises`,
    });

    return baseStats;
  }, [dbStats, totalRevenue, revenueCount]);

  /* ---------------- STATUS CHANGE ---------------- */
  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/franchise-leads`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: id, status: newStatus }),
      });

      if (res.ok) {
        setLeads((prev) =>
          prev.map((lead) =>
            lead.id === id ? { ...lead, status: newStatus } : lead,
          ),
        );
      } else {
        console.error("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  /* ---------------- QUALITY CHANGE ---------------- */
  const handleQualityChange = async (id, newQuality) => {
    // Optimistic update
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === id ? { ...lead, lead_quality: newQuality } : lead,
      ),
    );

    try {
      await fetch(`/api/franchise-leads`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: id, lead_quality: newQuality }),
      });
    } catch (error) {
      console.error("Error updating quality:", error);
      toast.error("Failed to update quality");
    }
  };

  /* ---------------- ASSIGNMENT CHANGE ---------------- */
  const handleAssignChange = async (leadId, newAdminId) => {
    try {
      const res = await fetch("/api/franchise-leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          assignedFranchiseAdminId: newAdminId || null,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setLeads((prevLeads) =>
          prevLeads.map((lead) =>
            lead.id === leadId
              ? {
                  ...lead,
                  assignedFranchiseAdmin: data.lead.assignedFranchiseAdmin,
                }
              : lead,
          ),
        );
      } else {
        alert(data.message || "Failed to assign lead");
      }
    } catch (error) {
      console.error("Assignment error:", error);
      alert("Something went wrong while assigning.");
    }
  };

  /* ---------------- BULK SELECTION HANDLERS ---------------- */
  const handleSelectAll = (e) => {
    const pageIds = paginatedLeads.map((l) => franchiseLeadIdKey(l.id));
    const pageIdSet = new Set(pageIds);
    if (e.target.checked) {
      setSelectedLeads((prev) => {
        const next = new Set(prev.map(franchiseLeadIdKey));
        pageIds.forEach((id) => next.add(id));
        return [...next];
      });
    } else {
      setSelectedLeads((prev) =>
        prev.filter((id) => !pageIdSet.has(franchiseLeadIdKey(id))),
      );
    }
  };

  const handleSelectOne = (id) => {
    const key = franchiseLeadIdKey(id);
    setSelectedLeads((prev) => {
      const normalized = prev.map(franchiseLeadIdKey);
      return normalized.includes(key)
        ? normalized.filter((i) => i !== key)
        : [...normalized, key];
    });
  };

  /** One-click: all leads matching current filters (all pages), not only this page. */
  const handleSelectAllFiltered = () => {
    const ids = filteredLeads.map((l) => franchiseLeadIdKey(l.id));
    setSelectedLeads([...new Set(ids)]);
  };

  const handleBulkAssign = async () => {
    if (!bulkAssignee || selectedLeads.length === 0) return;
    if (!confirm(`Assign ${selectedLeads.length} leads to selected admin?`))
      return;

    setLoading(true);
    try {
      await Promise.all(
        selectedLeads.map((leadId) =>
          fetch("/api/franchise-leads", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              leadId,
              assignedFranchiseAdminId: bulkAssignee,
            }),
          }),
        ),
      );
      await fetchLeads();
      setSelectedLeads([]);
      setBulkAssignee("");
    } catch (err) {
      console.error(err);
      setError("Bulk assignment failed");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSendFranchiseMsg = async () => {
    if (selectedLeads.length === 0) return;

    const idSet = new Set(selectedLeads.map(franchiseLeadIdKey));
    const picked = leads.filter((l) => idSet.has(franchiseLeadIdKey(l.id)));
    if (picked.length === 0) {
      toast.error("Could not resolve selected leads");
      return;
    }

    const eligible = picked.filter((l) => l.status !== "Onboard");
    const skippedOnboard = picked.length - eligible.length;

    if (eligible.length === 0) {
      toast.error(
        skippedOnboard > 0
          ? "No recipients: Onboard leads are not sent this WhatsApp. Select other statuses or adjust filters."
          : "No eligible leads in selection",
      );
      return;
    }

    let confirmText = `Send franchise WhatsApp (franchise_msg) to ${eligible.length} lead(s)?`;
    if (skippedOnboard > 0) {
      confirmText += ` (${skippedOnboard} Onboard lead(s) will be skipped.)`;
    }
    if (!confirm(confirmText)) {
      return;
    }

    const recipients = [];
    for (const lead of eligible) {
      let phone = lead.phone_number;
      if (phone) {
        phone = String(phone).replace(/\D/g, "");
        if (phone.length === 10) phone = "91" + phone;
      }
      if (!phone || phone.length !== 12 || !phone.startsWith("91")) {
        continue;
      }
      recipients.push({
        phone,
        name: (lead.full_name || lead.fullName || "User").slice(0, 120),
      });
    }

    if (recipients.length === 0) {
      toast.error("No valid Indian mobile numbers in selection");
      return;
    }

    const chunkSize = 100;
    setSendingFranchiseMsg(true);
    try {
      let totalSent = 0;
      let totalFailed = 0;
      for (let i = 0; i < recipients.length; i += chunkSize) {
        const chunk = recipients.slice(i, i + chunkSize);
        const res = await fetch("/api/franchise-leads/send-franchise-msg", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipients: chunk }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.message || "Request failed");
          return;
        }
        totalSent += data.sent ?? 0;
        totalFailed += data.failed ?? 0;
      }
      if (totalFailed === 0) {
        let msg = `WhatsApp sent to ${totalSent} recipient(s)`;
        if (skippedOnboard > 0) {
          msg += ` (${skippedOnboard} Onboard skipped)`;
        }
        toast.success(msg);
        setSelectedLeads([]);
      } else {
        toast.error(
          `Sent ${totalSent}, failed ${totalFailed}. Check numbers or AiSensy response.`,
        );
      }
    } catch (err) {
      console.error(err);
      toast.error("WhatsApp send failed");
    } finally {
      setSendingFranchiseMsg(false);
    }
  };

  /* ---------------- MANUAL LEAD ADDITION ---------------- */
  const handleAddLead = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/franchise-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLead),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddLeadModal(false);
        setNewLead({ lead_quality: "None" });
        toast.success("Lead added successfully");
        fetchLeads();
      } else {
        toast.error(data.message || "Failed to add lead");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error adding lead");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UPLOAD SCREENSHOT TO S3 ---------------- */
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

  /* ---------------- HANDLE REVENUE SUBMISSION ---------------- */
  const handleRevenueSubmit = async () => {
    if (!revenueData.amount || !revenueData.screenshot) {
      toast.error("Please provide amount and payment screenshot");
      return;
    }

    setUploadingScreenshot(true);

    try {
      // Upload screenshot to S3
      const screenshotUrl = await uploadToS3(revenueData.screenshot);

      // Save revenue to database
      const res = await fetch("/api/franchise-revenue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: revenueModalLead.id,
          leadName: revenueModalLead.full_name,
          amount: parseFloat(revenueData.amount),
          paymentScreenshot: screenshotUrl,
          email: localStorage.getItem("email"),
          notes: revenueData.notes,
          type: "franchise_lead",
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Revenue added successfully!");
        setShowRevenueModal(false);
        setRevenueModalLead(null);
        setRevenueData({ amount: "", screenshot: null, notes: "" });
        fetchRevenue(); // Refresh revenue data
        // Optimistically update the UI to show the "Paid" tag
        setLeadRevenueStatus((prev) => ({
          ...prev,
          [revenueModalLead.id]: true,
        }));
      } else {
        toast.error(data.message || "Failed to add revenue");
      }
    } catch (error) {
      console.error("Error adding revenue:", error);
      toast.error("Error adding revenue");
    } finally {
      setUploadingScreenshot(false);
    }
  };

  /* ---------------- NAME EDIT HANDLERS ---------------- */
  const handleSaveName = async (leadId) => {
    if (!editNameValue.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    try {
      const res = await fetch("/api/franchise-leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, full_name: editNameValue.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        // Optimistic update already happened, but refresh to be safe
        toast.success("Name updated successfully");
        setLeads((prev) =>
          prev.map((lead) =>
            lead.id === leadId
              ? { ...lead, full_name: editNameValue.trim() }
              : lead,
          ),
        );
        handleCancelEdit();
      } else {
        toast.error(data.message || "Failed to update name");
        // Revert on error
        fetchLeads();
      }
    } catch (error) {
      console.error("Error saving name:", error);
      toast.error("Failed to update name");
      fetchLeads(); // Revert
    }
  };

  const handleCancelEdit = () => {
    setEditingLeadId(null);
    setEditNameValue("");
  };

  /* ---------------- DELETE LEAD ---------------- */
  const handleDeleteLead = async (id) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;

    try {
      const res = await fetch(`/api/franchise-leads?leadId=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        setLeads((prev) => prev.filter((l) => l.id !== id));
        setSelectedLeads((prev) =>
          prev.filter((i) => franchiseLeadIdKey(i) !== franchiseLeadIdKey(id)),
        );
        setTotalLeads((prev) => prev - 1);
      } else {
        alert(data.message || "Failed to delete lead");
      }
    } catch (error) {
      console.error("Error deleting lead:", error);
      alert("Error deleting lead");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLeads.length === 0) return;
    if (
      !confirm(
        `Are you sure you want to delete ${selectedLeads.length} leads? This cannot be undone.`,
      )
    )
      return;

    setLoading(true);
    try {
      await Promise.all(
        selectedLeads.map((leadId) =>
          fetch(`/api/franchise-leads?leadId=${leadId}`, {
            method: "DELETE",
          }),
        ),
      );
      await fetchLeads();
      setSelectedLeads([]);
    } catch (err) {
      console.error(err);
      setError("Bulk delete failed");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- NAME EDIT HANDLERS ---------------- */
  // const handleSaveName = async (leadId) => {
  //   if (!editNameValue.trim()) {
  //     toast.error("Name cannot be empty");
  //     return;
  //   }

  //   // Optimistic update
  //   setLeads(prev => prev.map(lead =>
  //     lead.id === leadId ? { ...lead, full_name: editNameValue.trim() } : lead
  //   ));

  //   try {
  //     const res = await fetch("/api/franchise-leads", {
  //       method: "PATCH",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ leadId, full_name: editNameValue.trim() })
  //     });

  //     if (!res.ok) {
  //       throw new Error("Failed to save name");
  //     }

  //     toast.success("Name updated successfully");
  //   } catch (error) {
  //     console.error("Error saving name:", error);
  //     toast.error("Failed to update name");
  //     // Revert optimistic update
  //     await fetchLeads();
  //   }

  //   handleCancelEdit();
  // };

  // const handleCancelEdit = () => {
  //   setEditingLeadId(null);
  //   setEditNameValue('');
  // };

  /* ---------------- REMARKS HANDLING ---------------- */
  const sendRemarkWhatsApp = async (lead, remarkType) => {
    // 🔥 UI REMARK → BACKEND REMARK
    const remarkMap = {
      "Call Not Picked": "call_not_picked",
      "Not Interested": "not_interested",
      Interested: "interested",
      "Call Back Later": "call_back",
      "Wrong Number": "wrong_number",
      "Switch Off": "switch_off",
      "Meeting Scheduled": "meeting_scheduled_online",
    };

    const remark = remarkMap[remarkType];
    if (!remark) {
      return false;
    }

    // 📞 Phone normalize
    let phone = lead.phone_number;
    if (phone) {
      phone = String(phone).replace(/\D/g, "");
      if (phone.length === 10) phone = "91" + phone;
    }
    if (!phone) {
      toast.error("Phone number missing");
      return false;
    }

    let executiveMobile = lead.assignedFranchiseAdmin?.mobileNumber;

    if (!executiveMobile && typeof window !== "undefined") {
      const adminName = (localStorage.getItem("adminName") || "").toLowerCase();
      const email = (localStorage.getItem("email") || "").toLowerCase();

      const adminMobileMap = {
        omprakash: "9355105058",
        karan: "9311203803",
        nagendra: "9311203803",
      };

      const matchedAdmin = Object.keys(adminMobileMap).find(
        (key) => adminName.includes(key) || email.includes(key),
      );

      if (matchedAdmin) {
        executiveMobile = adminMobileMap[matchedAdmin];
      }
    }

    const payload = {
      destination: phone,
      userName: lead.full_name || "User",
      enquiryId: lead.id,
      executiveName: lead.assignedFranchiseAdmin?.fullName || "Executive",
      executiveMobile: executiveMobile || "",
      remark: remark,
    };

    if (remarkType === "Meeting Scheduled" && meetingData.date) {
      payload.meetingDate = meetingData.date;
      payload.meetingLink = meetingData.link;
      payload.meetingId = meetingData.meetingId;
      payload.passcode = meetingData.passcode;
    }

    // --- SEND EMAIL NOTIFICATION ---
    if (lead.email) {
      const emailPayload = {
        email: lead.email,
        userName: lead.full_name || "User",
        enquiryId: lead.id,
        executiveName: lead.assignedFranchiseAdmin?.fullName || "Executive",
        remark: remark,
        meetingDate: payload.meetingDate,
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
        toast.success(
          "Success! Remark has been successfully sent to the user via WhatsApp.",
        );
        return true;
      } else {
        toast.error(`Failed: ${data.message}`);
        return false;
      }
    } catch (error) {
      console.error("Error sending WhatsApp:", error);
      toast.error("WhatsApp send failed");
      return false;
    }
  };

  const handleRemarkSubmit = async () => {
    if (!newRemark.trim() || !remarkModalLead) return;

    // Check and send WhatsApp message if applicable
    const remarkType = QUICK_REMARKS.find((r) => newRemark.startsWith(r));
    if (remarkType) {
      await sendRemarkWhatsApp(remarkModalLead, remarkType);
    }

    const agentId =
      remarkModalLead.assignedFranchiseAdmin?._id ||
      localStorage.getItem("adminId") ||
      localStorage.getItem("userId");
    const agentName =
      remarkModalLead.assignedFranchiseAdmin?.fullName ||
      localStorage.getItem("adminName") ||
      "Admin";

    let effectiveFollowUpIso = null;
    const trimmedNewRemark = newRemark.trim();
    const isFuFranchise = FOLLOW_UP_REMARKS.some((p) =>
      trimmedNewRemark.startsWith(p),
    );

    if (followUpDateFranchise) {
      const rawT =
        followUpTimeFranchise &&
        /^\d{1,2}:\d{2}$/.test(followUpTimeFranchise.trim())
          ? followUpTimeFranchise.trim()
          : "10:00";
      const [hh, mm] = rawT.split(":");
      const d = new Date(
        `${followUpDateFranchise}T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00`,
      );
      if (!Number.isNaN(d.getTime())) effectiveFollowUpIso = d.toISOString();
    }

    if (isFuFranchise && role === "franchiseAdmin") {
      if (!followUpDateFranchise || !effectiveFollowUpIso) {
        toast.error(
          "Select follow-up date and time for Call Not Picked / Call Back Later",
        );
        return;
      }
    }

    if (!effectiveFollowUpIso && isFuFranchise && role !== "franchiseAdmin") {
      const prev = [...(remarkModalLead.remarks || [])]
        .reverse()
        .find((r) => r.followUpDate);
      if (prev?.followUpDate) {
        effectiveFollowUpIso = new Date(prev.followUpDate).toISOString();
      } else {
        effectiveFollowUpIso = new Date(
          Date.now() + 60 * 60 * 1000,
        ).toISOString();
      }
    }

    try {
      const res = await fetch(`/api/franchise-leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: remarkModalLead.id,
          text: newRemark,
          addedBy: "Admin",
          agentId: agentId,
          agentName: agentName,
          adminEmail: localStorage.getItem("email") || undefined,
          ...(effectiveFollowUpIso
            ? { followUpDate: effectiveFollowUpIso }
            : {}),
        }),
      });

      const data = await res.json();

      if (data.success) {
        const updatedRemarks = data.remarks
          .map((r) => ({
            text: r.text,
            timestamp: new Date(r.addedAt).toLocaleString(),
            user: r.addedBy,
            followUpDate: r.followUpDate,
          }))
          .reverse();

        setRemarkHistory((prev) => ({
          ...prev,
          [remarkModalLead.id]: updatedRemarks,
        }));
        setNewRemark("");
        setFollowUpDateFranchise("");
        setFollowUpTimeFranchise("10:00");
        const email = localStorage.getItem("email");
        if (email) {
          fetch(
            `/api/admin/franchise-follow-up-stats?email=${encodeURIComponent(email)}&filter=${franchiseFollowUpFilter}`,
          )
            .then((r) => r.json())
            .then((d) => {
              if (d.success)
                setFranchiseFollowUpStats((prev) => ({ ...prev, ...d.stats }));
            })
            .catch(() => {});
          fetch(
            `/api/admin/franchise-follow-up-stats?email=${encodeURIComponent(email)}&filter=all`,
          )
            .then((r) => r.json())
            .then((d) => {
              if (d.success) {
                setFranchiseFollowUpLeadsAll(d.stats.leads || []);
                setFranchiseFollowUpLeadsAllLoaded(true);
              }
            })
            .catch(() => {});
          fetch(
            `/api/admin/franchise-call-stats?email=${encodeURIComponent(email)}`,
          )
            .then((r) => r.json())
            .then((d) => {
              if (d.success) setFranchiseCallStats(d.stats);
            })
            .catch(() => {});
        }
      }
    } catch (error) {
      console.error("Error adding remark:", error);
    }
  };

  const handleMeetingSubmit = async () => {
    if (!meetingData.date || !meetingData.link || !meetingData.meetingId) {
      toast.error("Please enter Date, Meeting Link and Meeting ID");
      return;
    }

    // Send WhatsApp
    await sendRemarkWhatsApp(remarkModalLead, "Meeting Scheduled");

    // Save Remark
    const remarkText = `Meeting Scheduled on ${meetingData.date}`;

    const agentId =
      remarkModalLead.assignedFranchiseAdmin?._id ||
      localStorage.getItem("adminId") ||
      localStorage.getItem("userId");
    const agentName =
      remarkModalLead.assignedFranchiseAdmin?.fullName ||
      localStorage.getItem("adminName") ||
      "Admin";

    try {
      const res = await fetch(`/api/franchise-leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: remarkModalLead.id,
          text: remarkText,
          addedBy: "Admin",
          agentId: agentId,
          agentName: agentName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const updatedRemarks = data.remarks
          .map((r) => ({
            text: r.text,
            timestamp: new Date(r.addedAt).toLocaleString(),
            user: r.addedBy,
            followUpDate: r.followUpDate,
          }))
          .reverse();
        setRemarkHistory((prev) => ({
          ...prev,
          [remarkModalLead.id]: updatedRemarks,
        }));
        setShowMeetingModal(false);
        setMeetingData({ date: "", link: "", meetingId: "", passcode: "" });
        const email = localStorage.getItem("email");
        if (email) {
          fetch(
            `/api/admin/franchise-call-stats?email=${encodeURIComponent(email)}`,
          )
            .then((r) => r.json())
            .then((d) => {
              if (d.success) setFranchiseCallStats(d.stats);
            })
            .catch(() => {});
        }
      }
    } catch (error) {
      console.error("Error adding meeting remark:", error);
    }
  };

  // Send Message button par click hote hi
  // selected lead ke phone_number par WhatsApp template chala jayega

  const handleSendTemplateMessage = async () => {
    if (!selectedLead && selectedLeads.length === 0) {
      toast.error("Please select at least one lead");
      return;
    }

    let leadToSend = selectedLead;

    if (!leadToSend && selectedLeads.length > 0) {
      const selectedId = franchiseLeadIdKey(selectedLeads[0]);
      leadToSend = leads.find(
        (lead) => franchiseLeadIdKey(lead.id) === selectedId,
      );
    }

    if (!leadToSend) {
      toast.error("Lead not found");
      return;
    }

    setSendingFranchiseMsg(true);

    try {
      const firstName = leadToSend.full_name?.split(" ")[0] || "firstname";

      const response = await fetch("/api/franchise-leads/send-template", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: leadToSend.phone_number,
          firstName: firstName,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Message sent to ${leadToSend.full_name}`);
        setIsWhatsappTemplateModalOpen(false);
        setSelectedLeads([]);
      } else {
        toast.error(data.message || "Failed to send message");
      }
    } catch (error) {
      console.error("WhatsApp send error:", error);
      toast.error("Failed to send WhatsApp template");
    } finally {
      setSendingFranchiseMsg(false);
    }
  };

  /* ---------------- EXPORT TO CSV ---------------- */
  const handleExport = () => {
    const headers = [
      "Name",
      "City",
      "Occupation",
      "Investment",
      "Phone",
      "Email",
      "Date",
      "Status",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredLeads.map((lead) =>
        [
          lead.full_name || "",
          lead.city || "",
          lead["what_is_your_current_occupation?"] || "",
          lead.mention_investment_rang || "",
          lead.phone_number || "",
          lead.email || "",
          lead.created_time
            ? new Date(lead.created_time).toLocaleDateString()
            : "",
          lead.status || "",
        ]
          .map((field) => `"${field}"`)
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `franchise-leads-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const totalPages = Math.ceil(totalLeads / PAGE_SIZE);

  const selectedIvrAtLabel = selectedLead
    ? formatIvrInterestedAtDisplay(selectedLead.ivrMeInterestedAt)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col lg:flex-row justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-xl">
                  <Users className="w-7 h-7 text-white" />
                </div>
                Franchise Leads Dashboard
              </h1>
              <p className="text-gray-500 mt-2">
                Manage and track your franchise leads efficiently
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {/* <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button> */}

              {(role === "superFranchiseAdmin" ||
                role === "superAdmin" ||
                role === "franchiseAdmin") && (
                <button
                  onClick={() => setShowAddLeadModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Lead
                </button>
              )}

              <button
                onClick={fetchLeads}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>
          </div>

          {/* FILTERS */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                Filters:
              </span>
            </div>

            {filterLoading && (
              <div className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 rounded-lg bg-blue-50 border border-blue-100">
                <Loader2 className="w-4 h-4 animate-spin" />
                Applying filter...
              </div>
            )}

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Status</option>
              {STATUS_STEPS.map((s) => (
                <option key={s.label} value={s.label}>
                  {s.label}
                </option>
              ))}
            </select>

            {(role === "superFranchiseAdmin" || role === "superAdmin") && (
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Assignees</option>
                <option value="Unassigned">Unassigned</option>
                {franchiseAdmins.map((admin) => (
                  <option key={admin._id} value={admin._id}>
                    {admin.fullName}
                  </option>
                ))}
              </select>
            )}

            <select
              value={remarkFilter}
              onChange={(e) =>
                handleFilterChange(setRemarkFilter, e.target.value)
              }
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Remarks</option>
              <option value="Has Remarks">Has Remarks</option>
              <option value="No Remarks">No Remarks</option>
              {QUICK_REMARKS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <select
              value={remarkCountFilter}
              onChange={(e) =>
                handleFilterChange(setRemarkCountFilter, e.target.value)
              }
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Remark Counts</option>
              <option value="1 Remark">1 Remark</option>
              <option value="2 Remarks">2 Remarks</option>
              <option value="3 Remarks">3 Remarks</option>
              <option value="More than 3 Remarks">More than 3 Remarks</option>
            </select>

            <select
              value={qualityFilter}
              onChange={(e) => setQualityFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Qualities</option>
              {LEAD_QUALITIES.map((q) => (
                <option key={q.value} value={q.value}>
                  {q.label}
                </option>
              ))}
            </select>

            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>

            {dateRange === "custom" && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {(search ||
              statusFilter !== "All" ||
              dateRange !== "all" ||
              remarkFilter !== "All" ||
              remarkCountFilter !== "All" ||
              qualityFilter !== "All" ||
              ivrLeadTab !== "all" ||
              assigneeFilter !== "All") && (
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("All");
                  setRemarkFilter("All");
                  setRemarkCountFilter("All");
                  setQualityFilter("All");
                  setAssigneeFilter("All");
                  setIvrLeadTab("all");
                  setDateRange("all");
                  setCustomStartDate("");
                  setCustomEndDate("");
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="w-3 h-3" />
                Clear Filters
              </button>
            )}
          </div>

          {/* All leads vs IVR interested — one active at a time */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 pt-4 mt-2 border-t border-gray-100">
            <span className="text-sm font-medium text-gray-600 shrink-0">
              Lead list
            </span>
            <div
              className="inline-flex flex-wrap p-1 bg-slate-100/90 rounded-xl gap-1 border border-slate-200/80"
              role="tablist"
              aria-label="Lead source"
            >
              <button
                type="button"
                role="tab"
                aria-selected={ivrLeadTab === "all"}
                onClick={() => setIvrLeadTab("all")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  ivrLeadTab === "all"
                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                All leads
                <span className="ml-1.5 tabular-nums text-slate-500 font-bold">
                  ({totalLeads})
                </span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={ivrLeadTab === "ivr"}
                onClick={() => setIvrLeadTab("ivr")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all inline-flex items-center gap-1.5 ${
                  ivrLeadTab === "ivr"
                    ? "bg-violet-600 text-white shadow-md ring-2 ring-violet-300"
                    : "text-violet-800 bg-violet-50/80 hover:bg-violet-100 border border-violet-200/80"
                }`}
              >
                <Phone className="w-3.5 h-3.5 shrink-0 opacity-90" />
                IVR interested
                <span
                  className={`tabular-nums font-bold ${ivrLeadTab === "ivr" ? "text-violet-100" : "text-violet-700"}`}
                >
                  ({ivrInterestedInBaseCount})
                </span>
              </button>
            </div>
            {ivrLeadTab === "ivr" && (
              <p className="text-xs text-violet-700/90 sm:ml-auto max-w-md leading-snug">
                Showing only leads marked IVR interested (press keys during
                IVR). Use <strong>All leads</strong> to see everyone with your
                current filters.
              </p>
            )}
          </div>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">
                Error Loading Leads
              </h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={fetchLeads}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
          {loading
            ? [...Array(7)].map((_, i) => (
                <div
                  key={`stat-skeleton-${i}`}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-pulse"
                >
                  <div className="w-12 h-12 bg-gray-200 rounded-xl mb-3 mx-auto" />
                  <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto mb-2" />
                  <div className="h-8 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-1/2 mt-2" />
                </div>
              ))
            : stats.map((s, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow"
                >
                  <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                    {s.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {s.value}
                  </p>
                  {s.subtitle && (
                    <p className="text-xs text-gray-400 mt-1">{s.subtitle}</p>
                  )}
                </div>
              ))}
        </div>

        {["superAdmin", "superFranchiseAdmin", "franchiseAdmin"].includes(
          role,
        ) && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 md:px-5 md:py-4 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white flex flex-wrap items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                <Phone className="text-indigo-600" size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base md:text-lg font-bold text-gray-900 leading-tight">
                  Calls &amp; follow-ups
                </h2>
                <p className="text-[11px] text-gray-500">
                  Franchise lead calls and scheduled follow-ups
                  {role === "franchiseAdmin"
                    ? " (your activity)"
                    : " (all agents)"}
                </p>
              </div>
              {(role === "superAdmin" || role === "superFranchiseAdmin") && (
                <div className="w-full sm:w-auto sm:ml-auto flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                  <span className="text-[10px] font-bold uppercase text-amber-800 tracking-wide">
                    Total follow-ups
                  </span>
                  <span className="text-lg font-black tabular-nums text-amber-900">
                    {franchiseFollowUpStats.totalFollowUps ?? 0}
                  </span>
                </div>
              )}
            </div>

            <div className="p-4 md:p-5 space-y-5">
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Calls
                </p>
                {role === "franchiseAdmin" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-3 border border-violet-100">
                      <p className="text-[10px] font-semibold uppercase text-violet-600">
                        Calls today
                      </p>
                      <p className="text-2xl font-bold text-violet-800 mt-1 tabular-nums">
                        {franchiseCallStats?.myCallsToday ?? "—"}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl p-3 border border-blue-100">
                      <p className="text-[10px] font-semibold uppercase text-blue-600">
                        Total calls
                      </p>
                      <p className="text-2xl font-bold text-blue-800 mt-1 tabular-nums">
                        {franchiseCallStats?.myCallsTotal ?? "—"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-stretch">
                    <div className="shrink-0 bg-blue-50 border border-blue-200 rounded-xl p-4 min-w-[140px] flex flex-col justify-center">
                      <span className="text-[11px] text-blue-700 font-semibold uppercase">
                        Total today
                      </span>
                      <span className="text-2xl font-bold text-blue-900 tabular-nums">
                        {franchiseCallStats?.totalCallsToday ?? "—"}
                      </span>
                      <span className="text-[10px] text-blue-600/80">
                        all agents
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 overflow-x-auto pb-1 -mx-1 px-1">
                      <div className="flex gap-2 min-w-min">
                        {(franchiseCallStats?.todayCallsByAgent || []).map(
                          (agent) => (
                            <div
                              key={agent.agentName || agent._id}
                              className="min-w-[112px] max-w-[140px] bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-col"
                            >
                              <span
                                className="text-[10px] text-gray-500 truncate capitalize"
                                title={agent.agentName}
                              >
                                {agent.agentName || "—"}
                              </span>
                              <span className="text-xl font-bold text-gray-900 tabular-nums">
                                {agent.count}
                              </span>
                              <span className="text-[9px] text-gray-400">
                                calls
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {role === "franchiseAdmin"
                    ? "Follow-ups — All leads shows your full list; a period narrows the table + pending strip"
                    : "Follow-ups (tap to filter main table)"}
                </p>
                <div
                  className={`grid grid-cols-2 gap-2 ${
                    role === "franchiseAdmin"
                      ? "md:grid-cols-3 lg:grid-cols-5"
                      : "md:grid-cols-4"
                  }`}
                >
                  {(role === "franchiseAdmin"
                    ? [
                        {
                          key: "all",
                          label: "All leads",
                          count: leads.length,
                          bg: "bg-gray-600",
                          ring: "ring-gray-400",
                        },
                        {
                          key: "today",
                          label: "Today",
                          count: franchiseFollowUpStats.todayFollowUps,
                          bg: "bg-amber-500",
                          ring: "ring-amber-400",
                        },
                        {
                          key: "tomorrow",
                          label: "Tomorrow",
                          count: franchiseFollowUpStats.tomorrowFollowUps,
                          bg: "bg-rose-500",
                          ring: "ring-rose-400",
                        },
                        {
                          key: "next7days",
                          label: "Next 7 Days",
                          count: franchiseFollowUpStats.next7DaysFollowUps,
                          bg: "bg-violet-500",
                          ring: "ring-violet-400",
                        },
                        {
                          key: "thisMonth",
                          label: "This Month",
                          count: franchiseFollowUpStats.thisMonthFollowUps,
                          bg: "bg-emerald-500",
                          ring: "ring-emerald-400",
                        },
                      ]
                    : [
                        {
                          key: "today",
                          label: "Today",
                          count: franchiseFollowUpStats.todayFollowUps,
                          bg: "bg-amber-500",
                          ring: "ring-amber-400",
                        },
                        {
                          key: "tomorrow",
                          label: "Tomorrow",
                          count: franchiseFollowUpStats.tomorrowFollowUps,
                          bg: "bg-rose-500",
                          ring: "ring-rose-400",
                        },
                        {
                          key: "thisMonth",
                          label: "This Month",
                          count: franchiseFollowUpStats.thisMonthFollowUps,
                          bg: "bg-emerald-500",
                          ring: "ring-emerald-400",
                        },
                        {
                          key: "all",
                          label: "All Time",
                          count: franchiseFollowUpStats.totalFollowUps,
                          bg: "bg-gray-600",
                          ring: "ring-gray-400",
                        },
                      ]
                  ).map(({ key, label, count, bg, ring }) => {
                    const active = franchiseFollowUpFilter === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFranchiseFollowUpFilter(key)}
                        className={`rounded-xl p-3 border-2 text-left transition-all ${
                          active
                            ? `${bg} text-white border-transparent ring-2 ${ring} shadow-md`
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        <p
                          className={`text-[10px] font-bold uppercase tracking-wide ${active ? "text-white/80" : "text-gray-500"}`}
                        >
                          Follow-ups
                        </p>
                        <p
                          className={`text-xl font-black mt-0.5 ${active ? "text-white" : "text-gray-800"}`}
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
              </div>

              {role === "franchiseAdmin" &&
                franchisePendingFollowUpsInView.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-50/80 p-3 md:p-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                      <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                        <AlertCircle
                          size={14}
                          className="text-orange-500 shrink-0"
                        />
                        Pending follow-ups (due or overdue)
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Period:{" "}
                        <span className="text-slate-800">
                          {franchiseFollowUpFilterLabel}
                        </span>
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-slate-100/80 border border-slate-200/80 mb-3">
                      {[
                        {
                          id: "call_not_picked",
                          label: "Call Not Picked",
                          count:
                            franchisePendingByRemark.call_not_picked.length,
                          activeClass:
                            "bg-orange-500 text-white shadow-md ring-2 ring-orange-300",
                          idleClass:
                            "bg-white text-orange-800 border-orange-200 hover:bg-orange-50",
                        },
                        {
                          id: "call_back_later",
                          label: "Call Back Later",
                          count:
                            franchisePendingByRemark.call_back_later.length,
                          activeClass:
                            "bg-teal-600 text-white shadow-md ring-2 ring-teal-300",
                          idleClass:
                            "bg-white text-teal-800 border-teal-200 hover:bg-teal-50",
                        },
                        ...(franchisePendingByRemark.other.length > 0
                          ? [
                              {
                                id: "other",
                                label: "Other",
                                count: franchisePendingByRemark.other.length,
                                activeClass:
                                  "bg-slate-600 text-white shadow-md ring-2 ring-slate-400",
                                idleClass:
                                  "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
                              },
                            ]
                          : []),
                      ].map((tab) => {
                        const active = franchisePendingRemarkTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setFranchisePendingRemarkTab(tab.id)}
                            className={`flex-1 min-w-[130px] sm:flex-none rounded-lg px-3 py-2 text-left border-2 transition-all ${
                              active ? tab.activeClass : tab.idleClass
                            }`}
                          >
                            <span
                              className={`block text-[10px] font-bold uppercase tracking-wide ${active ? "text-white/90" : ""}`}
                            >
                              {tab.label}
                            </span>
                            <span
                              className={`text-lg font-black tabular-nums ${active ? "text-white" : "text-gray-900"}`}
                            >
                              {tab.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {(() => {
                      const tabLeads =
                        franchisePendingRemarkTab === "call_not_picked"
                          ? franchisePendingByRemark.call_not_picked
                          : franchisePendingRemarkTab === "call_back_later"
                            ? franchisePendingByRemark.call_back_later
                            : franchisePendingByRemark.other;
                      const isCnp =
                        franchisePendingRemarkTab === "call_not_picked";
                      const isCbl =
                        franchisePendingRemarkTab === "call_back_later";
                      const cardBorder = isCnp
                        ? "border-orange-200 hover:border-orange-400 hover:bg-orange-50/50"
                        : isCbl
                          ? "border-teal-200 hover:border-teal-400 hover:bg-teal-50/50"
                          : "border-slate-200 hover:border-slate-400 hover:bg-slate-50";
                      const badgeBg = isCnp
                        ? "bg-orange-500"
                        : isCbl
                          ? "bg-teal-600"
                          : "bg-slate-500";
                      const dateCls = isCnp
                        ? "text-orange-800"
                        : isCbl
                          ? "text-teal-800"
                          : "text-slate-700";

                      if (tabLeads.length === 0) {
                        return (
                          <p className="text-xs text-slate-400 text-center py-6 border border-dashed border-slate-200 rounded-xl">
                            No leads in this tab for{" "}
                            <span className="font-semibold text-slate-600">
                              {franchiseFollowUpFilterLabel}
                            </span>
                            .
                          </p>
                        );
                      }

                      return (
                        <div className="flex flex-wrap gap-2">
                          {tabLeads.map((l) => (
                            <button
                              key={String(l.leadId)}
                              type="button"
                              onClick={() =>
                                openFranchiseRemarkForLeadId(l.leadId)
                              }
                              className={`relative inline-flex flex-col items-start gap-1 rounded-xl border-2 bg-white px-3 py-2.5 text-left text-xs shadow-sm hover:shadow-md transition-all max-w-[240px] ${cardBorder}`}
                            >
                              <span
                                className={`absolute top-0 right-2 -translate-y-1/2 text-[9px] font-semibold ${badgeBg} text-white px-2 py-0.5 rounded-full shadow-sm max-w-[120px] truncate`}
                                title={l.remark}
                              >
                                {l.remark || "—"}
                              </span>
                              <span className="font-semibold text-gray-900 truncate w-full pr-16">
                                {l.fullName || l.phone || l.leadId}
                              </span>
                              <span
                                className={`text-[10px] font-semibold tabular-nums ${dateCls}`}
                              >
                                {l.followUpDate
                                  ? new Date(l.followUpDate).toLocaleString(
                                      "en-IN",
                                      {
                                        day: "numeric",
                                        month: "short",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: true,
                                      },
                                    )
                                  : "—"}
                              </span>
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}

              {(role === "superAdmin" || role === "superFranchiseAdmin") &&
                (franchiseFollowUpStats.byAgent || []).length > 0 && (
                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setFranchiseByAgentOpen((o) => !o)}
                      className="w-full bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between hover:bg-gray-100 transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <UserCheck size={13} className="text-indigo-500" />
                        <span className="text-xs font-bold text-gray-700">
                          Follow-ups by agent
                        </span>
                        <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
                          {(franchiseFollowUpStats.byAgent || []).length} agents
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-500 group-hover:text-indigo-600">
                        <span>{franchiseByAgentOpen ? "Hide" : "Show"}</span>
                        <ChevronDown
                          size={14}
                          className={`transition-transform duration-200 ${franchiseByAgentOpen ? "rotate-180" : ""}`}
                        />
                      </div>
                    </button>
                    {franchiseByAgentOpen && (
                      <div className="overflow-x-auto max-h-[min(70vh,520px)] border-t border-gray-100">
                        <table className="w-full text-xs min-w-[640px]">
                          <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="text-gray-500 text-[10px] uppercase tracking-wide border-b border-gray-200 bg-gray-100">
                              <th className="px-4 py-2.5 text-center">
                                <input
                                  type="checkbox"
                                  checked={
                                    (franchiseFollowUpStats.byAgent || [])
                                      .length > 0 &&
                                    selectedRows.length ===
                                      (franchiseFollowUpStats.byAgent || [])
                                        .length
                                  }
                                  onChange={(e) =>
                                    handleSelectAll(e.target.checked)
                                  }
                                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                                />
                              </th>

                              <th className="px-4 py-2.5 text-left">Agent</th>
                              <th className="px-3 py-2.5 text-center text-sky-600">
                                Today
                              </th>
                              <th className="px-3 py-2.5 text-center text-rose-600">
                                Tomorrow
                              </th>
                              <th className="px-3 py-2.5 text-center text-violet-600">
                                7 Days
                              </th>
                              <th className="px-3 py-2.5 text-center text-green-600">
                                Month
                              </th>
                              <th className="px-3 py-2.5 text-center text-amber-600">
                                Total
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {(franchiseFollowUpStats.byAgent || []).map(
                              (agent, idx) => {
                                const colors = [
                                  "bg-indigo-500",
                                  "bg-teal-500",
                                  "bg-violet-500",
                                  "bg-rose-500",
                                  "bg-amber-500",
                                  "bg-blue-500",
                                ];
                                const c = colors[idx % colors.length];
                                const name = agent.agentName || "Unknown";
                                const rowId = agent._id || agent.agentName || String(idx);
                                return (
                                  <tr
                                    key={`franchise-fu-agent-${idx}`}
                                    className="hover:bg-gray-50 transition-colors"
                                  >
                                    {/* Row Checkbox */}
                                    <td className="px-4 py-2.5 text-center">
                                      <input
                                        type="checkbox"
                                        checked={selectedRows.includes(rowId)}
                                        onChange={() => handleSelectRow(rowId)}
                                        className="w-4 h-4 accent-blue-600 cursor-pointer"
                                      />
                                    </td>

                                    <td className="px-4 py-2.5">
                                      <div className="flex items-center gap-2">
                                        <div
                                          className={`w-6 h-6 rounded-full ${c} text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0`}
                                        >
                                          {String(name).charAt(0).toUpperCase()}
                                        </div>
                                        <span className="font-medium text-gray-800 capitalize truncate max-w-[140px]">
                                          {name}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-3 py-2.5 text-center">
                                      <span
                                        className={`font-bold ${agent.today > 0 ? "text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full" : "text-gray-300"}`}
                                      >
                                        {agent.today || 0}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2.5 text-center">
                                      <span
                                        className={`font-bold ${agent.tomorrow > 0 ? "text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full" : "text-gray-300"}`}
                                      >
                                        {agent.tomorrow || 0}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2.5 text-center">
                                      <span
                                        className={`font-bold ${agent.next7days > 0 ? "text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full" : "text-gray-300"}`}
                                      >
                                        {agent.next7days || 0}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2.5 text-center">
                                      <span
                                        className={`font-bold ${agent.thisMonth > 0 ? "text-green-700 bg-green-50 px-2 py-0.5 rounded-full" : "text-gray-300"}`}
                                      >
                                        {agent.thisMonth || 0}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2.5 text-center">
                                      <span className="font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                                        {agent.total || 0}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              },
                            )}
                            <tr className="bg-gray-50 font-bold border-t-2 border-gray-200">
                              <td className="px-4 py-2 text-xs text-gray-600 font-bold">
                                ALL AGENTS
                              </td>
                              <td className="px-3 py-2 text-center text-sky-700 font-black">
                                {franchiseFollowUpStats.todayFollowUps}
                              </td>
                              <td className="px-3 py-2 text-center text-rose-700 font-black">
                                {franchiseFollowUpStats.tomorrowFollowUps}
                              </td>
                              <td className="px-3 py-2 text-center text-violet-700 font-black">
                                {franchiseFollowUpStats.next7DaysFollowUps}
                              </td>
                              <td className="px-3 py-2 text-center text-green-700 font-black">
                                {franchiseFollowUpStats.thisMonthFollowUps}
                              </td>
                              <td className="px-3 py-2 text-center text-amber-700 font-black">
                                {franchiseFollowUpStats.totalFollowUps}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setFranchiseFollowLeadsOpen((o) => !o)}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200 hover:bg-gray-100 transition-colors text-left group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Calendar size={13} className="text-violet-500 shrink-0" />
                    <span className="text-xs font-bold text-gray-700 truncate">
                      Follow-up leads —{" "}
                      <span className="text-violet-600">
                        {
                          {
                            today: "Today",
                            tomorrow: "Tomorrow",
                            next7days: "Next 7 Days",
                            thisMonth: "This Month",
                            all: "All",
                          }[franchiseFollowUpFilter]
                        }
                      </span>
                    </span>
                    <span className="text-[10px] font-semibold bg-white text-gray-600 px-2 py-0.5 rounded-full border border-gray-200 shrink-0">
                      {(franchiseFollowUpStats.leads || []).length} leads
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-semibold text-gray-500 group-hover:text-violet-600 shrink-0 ml-2">
                    <span>{franchiseFollowLeadsOpen ? "Hide" : "Show"}</span>
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${franchiseFollowLeadsOpen ? "rotate-180" : ""}`}
                    />
                  </div>
                </button>
                {franchiseFollowLeadsOpen && (
                  <div className="max-h-[min(60vh,400px)] overflow-y-auto overflow-x-auto">
                    {franchiseFollowUpsLoading ? (
                      <div className="flex items-center justify-center py-8 text-gray-400 text-xs gap-2">
                        <Clock size={14} className="animate-spin" /> Loading…
                      </div>
                    ) : (franchiseFollowUpStats.leads || []).length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-gray-400 text-xs">
                        <MessageSquare size={22} className="mb-2 opacity-20" />
                        <p className="font-medium">No leads for this period</p>
                      </div>
                    ) : (
                      <table className="w-full text-xs min-w-[720px]">
                        <thead className="sticky top-0 bg-gray-100 border-b border-gray-200 z-[1]">
                          <tr className="text-left text-[10px] uppercase tracking-wide text-gray-500">
                            <th className="px-3 py-2 font-semibold">Lead</th>
                            <th className="px-3 py-2 font-semibold">Phone</th>
                            <th className="px-3 py-2 font-semibold">Agent</th>
                            <th className="px-3 py-2 font-semibold">Remark</th>
                            <th className="px-3 py-2 font-semibold text-right">
                              Follow-up
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {(franchiseFollowUpStats.leads || []).map(
                            (lead, idx) => (
                              <tr key={idx} className="hover:bg-violet-50/40">
                                <td className="px-3 py-2 font-medium text-gray-900 whitespace-nowrap">
                                  {lead.fullName || lead.leadId || "—"}
                                </td>
                                <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                                  {lead.phone || "—"}
                                </td>
                                <td className="px-3 py-2 text-gray-700 capitalize whitespace-nowrap">
                                  {lead.agentName || "—"}
                                </td>
                                <td
                                  className="px-3 py-2 text-gray-500 max-w-[200px] truncate"
                                  title={lead.remark}
                                >
                                  {lead.remark || "—"}
                                </td>
                                <td className="px-3 py-2 text-right whitespace-nowrap text-violet-700 font-semibold">
                                  {lead.followUpDate
                                    ? new Date(
                                        lead.followUpDate,
                                      ).toLocaleString("en-IN", {
                                        day: "numeric",
                                        month: "short",
                                        year: "digit",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: true,
                                      })
                                    : "—"}
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ADMIN ASSIGNMENT SUMMARY (Only for Super Admin) */}
        {(role === "superFranchiseAdmin" || role === "superAdmin") &&
          franchiseAdmins.length > 0 && (
            <div className="flex flex-wrap gap-3 pb-2">
              {/* Unassigned Count */}
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${getAvatarColor("Unassigned")}`}
              >
                <User className="w-3 h-3" />
                <span>Unassigned: {adminCounts["Unassigned"] || 0}</span>
              </div>

              {franchiseAdmins.map((admin) => {
                const count = adminCounts[admin._id] || 0;

                return (
                  <div
                    key={admin._id}
                    className={`flex items-center gap-3 px-4 py-2 rounded-xl border shadow-sm text-sm font-medium transition-all duration-200
            ${getAvatarColor(admin.fullName)} 
            ${!admin.isActive ? "opacity-60" : ""}`}
                  >
                    <User className="w-4 h-4" />
                    <span className="font-semibold">
                      {admin.fullName}: {count}
                    </span>

                    {/* STATUS TOGGLE BUTTON */}
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch(
                            "/api/admin/franchise-admins",
                            {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                adminId: admin._id,
                                isActive: !admin.isActive,
                              }),
                            },
                          );

                          const data = await res.json();

                          if (data.success) {
                            fetchFranchiseAdmins();
                          }
                        } catch (error) {
                          console.error("Error toggling admin status:", error);
                        }
                      }}
                      className={`ml-2 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer border
              ${
                admin.isActive
                  ? "bg-green-500 text-white hover:bg-green-600 border-green-600"
                  : "bg-red-500 text-white hover:bg-red-600 border-red-600"
              }`}
                    >
                      {admin.isActive ? (
                        <>
                          <UserCheck className="w-3 h-3" />
                          Active
                        </>
                      ) : (
                        <>
                          <UserX className="w-3 h-3" />
                          Inactive
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

        {/* SEARCH BAR */}
        <div className="mt-6 mb-2">
          {franchiseFollowUpTableActive && (
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold bg-gradient-to-r from-rose-50 via-indigo-50 to-indigo-50 text-indigo-900 border border-indigo-200/70 shadow-sm">
                <span className="text-indigo-600/90">Table filter:</span>
                <span className="text-rose-700">
                  {franchiseFollowUpFilterLabel}
                </span>
              </span>
              {franchiseFollowUpFilter !== "all" && (
                <button
                  type="button"
                  onClick={() => setFranchiseFollowUpFilter("all")}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear — all leads
                </button>
              )}
            </div>
          )}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search name, phone, email, city or occupation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-all shadow-sm"
            />
          </div>
        </div>

        {canSelectFranchiseLeads && filteredLeads.length > 0 && (
          <div className="mt-2 mb-1 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAllFiltered}
              disabled={loading}
              className="text-sm font-medium text-blue-700 hover:text-blue-900 underline-offset-2 hover:underline disabled:opacity-50"
            >
              Select all {filteredLeads.length} filtered lead
              {filteredLeads.length === 1 ? "" : "s"} (all pages)
            </button>
          </div>
        )}

        {/* BULK ACTIONS */}
        {canSelectFranchiseLeads && selectedLeads.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-blue-800">
                {selectedLeads.length} leads selected
              </span>
              <button
                onClick={() => setSelectedLeads([])}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Clear Selection
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {canBulkAssignLeads && (
                <>
                  <select
                    value={bulkAssignee}
                    onChange={(e) => setBulkAssignee(e.target.value)}
                    className="px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Select Admin to Assign</option>
                    {franchiseAdmins.map((admin) => (
                      <option key={admin._id} value={admin._id}>
                        {admin.fullName}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleBulkAssign}
                    disabled={!bulkAssignee || loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Assigning..." : "Assign Leads"}
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={handleBulkSendFranchiseMsg}
                disabled={loading || sendingFranchiseMsg}
                title="Onboard leads are never included in this send."
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {sendingFranchiseMsg ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Send to WhatsApp
              </button>

              {/* WhatsApp Template Button */}
              <button
                type="button"
                onClick={() => setIsWhatsappTemplateModalOpen(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium inline-flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                WhatsApp Template
              </button>

              {role === "superAdmin" && (
                <button
                  onClick={handleBulkDelete}
                  disabled={loading}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Delete Selected
                </button>
              )}
            </div>
          </div>
        )}

        {/* TABLE */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="max-h-[600px] overflow-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10 shadow-sm">
                <tr>
                  {canSelectFranchiseLeads && (
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        title="Select all on this page"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                        checked={
                          paginatedLeads.length > 0 &&
                          paginatedLeads.every((l) =>
                            selectedLeadIdSet.has(franchiseLeadIdKey(l.id)),
                          )
                        }
                        onChange={handleSelectAll}
                      />
                    </th>
                  )}
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                    <div className="flex items-center gap-2 cursor-pointer hover:text-blue-600 group">
                      Name
                      <ArrowUpDown className="w-3 h-3 text-gray-400 group-hover:text-blue-600" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                    <div className="flex items-center gap-2 cursor-pointer hover:text-blue-600 group">
                      Date
                      <ArrowUpDown className="w-3 h-3 text-gray-400 group-hover:text-blue-600" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                    Source
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                    Remarks
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                    <div className="flex items-center gap-2 cursor-pointer hover:text-blue-600 group">
                      Status
                      <ArrowUpDown className="w-3 h-3 text-gray-400 group-hover:text-blue-600" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                    Assign To
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                    WhatsApp
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                    <div className="flex items-center gap-2 cursor-pointer hover:text-blue-600 group">
                      City
                      <ArrowUpDown className="w-3 h-3 text-gray-400 group-hover:text-blue-600" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                    Occupation
                  </th>
                  <th className="px-2 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                    <div className="flex items-center gap-2 cursor-pointer hover:text-blue-600 group">
                      Investment
                      <ArrowUpDown className="w-3 h-3 text-gray-400 group-hover:text-blue-600" />
                    </div>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ||
                (franchiseFollowUpTableActive && franchiseFollowUpsLoading) ? (
                  <>
                    {[...Array(5)].map((_, i) => (
                      <tr key={`skeleton-${i}`} className="animate-pulse">
                        {canSelectFranchiseLeads && (
                          <td className="px-6 py-4">
                            <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                            <div className="space-y-2">
                              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                              <div className="h-2.5 bg-gray-200 rounded w-20 animate-pulse" />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-8 bg-gray-200 rounded w-24 animate-pulse" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-6 bg-gray-200 rounded w-16 animate-pulse" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-6 bg-gray-200 rounded w-28 animate-pulse" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-20 h-6 bg-gray-200 rounded-full animate-pulse" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
                            <div className="h-3 bg-gray-200 rounded w-20 animate-pulse" />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse ml-auto" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-28 animate-pulse" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 h-8">
                            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                            <Banknote className="w-3.5 h-3.5 text-transparent" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </>
                ) : paginatedLeads.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-16 text-center">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">
                        No leads found
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        Try adjusting your filters or search
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedLeads.map((lead, idx) => {
                    const ivrAtLabel = formatIvrInterestedAtDisplay(
                      lead.ivrMeInterestedAt,
                    );
                    return (
                      <tr
                        key={lead.id}
                        className="hover:bg-blue-50/50 transition-colors"
                      >
                        {canSelectFranchiseLeads && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              title="Select lead"
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                              checked={selectedLeadIdSet.has(
                                franchiseLeadIdKey(lead.id),
                              )}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleSelectOne(lead.id);
                              }}
                            />
                          </td>
                        )}
                        <td
                          className={`px-6 py-4 ${
                            editingLeadId === lead.id ? "" : "whitespace-nowrap"
                          }`}
                        >
                          {editingLeadId === lead.id ? (
                            <div className="flex flex-col gap-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editNameValue}
                                  onChange={(e) =>
                                    setEditNameValue(e.target.value)
                                  }
                                  className="flex-1 min-w-0 px-2 py-1 border border-blue-400 rounded-lg text-sm"
                                  autoFocus
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter")
                                      handleSaveName(lead.id);
                                    if (e.key === "Escape") handleCancelEdit();
                                  }}
                                />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSaveName(lead.id);
                                  }}
                                  className="p-1.5 shrink-0 bg-green-100 text-green-600 rounded-lg"
                                  type="button"
                                >
                                  <BadgeCheck className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelEdit();
                                  }}
                                  className="p-1.5 shrink-0 bg-red-100 text-red-600 rounded-lg"
                                  type="button"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              <p className="text-xs text-gray-500">
                                Joined:{" "}
                                {lead.created_time
                                  ? new Date(
                                      lead.created_time,
                                    ).toLocaleDateString("en-IN", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })
                                  : "—"}
                              </p>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 relative flex-wrap">
                              <span className="font-medium text-gray-900 min-w-0 flex-1 truncate">
                                {lead.full_name || lead.fullName || ""}
                              </span>
                              {lead.ivrMeInterested && (
                                <span
                                  className="shrink-0 inline-flex flex-col items-start gap-0 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-violet-100 text-violet-800 border border-violet-200 leading-tight"
                                  title={
                                    ivrAtLabel
                                      ? `IVR interest: ${ivrAtLabel}`
                                      : "IVR interested (date will appear after sync or next call)"
                                  }
                                >
                                  <span>IVR interested</span>
                                  {ivrAtLabel ? (
                                    <span className="text-[9px] font-medium text-violet-600/95 tabular-nums font-mono">
                                      {ivrAtLabel}
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-normal text-violet-600/70">
                                      date pending
                                    </span>
                                  )}
                                </span>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingLeadId(lead.id);
                                  setEditNameValue(
                                    lead.full_name || lead.fullName || "",
                                  );
                                }}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                                title="Edit Name"
                                type="button"
                              >
                                <Edit3
                                  size={14}
                                  className="text-gray-400 hover:text-blue-600"
                                />
                              </button>
                              {leadRevenueStatus[lead.id] && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFullViewImage(
                                      leadRevenueStatus[lead.id],
                                    );
                                  }}
                                  title="View Payment Screenshot"
                                  className="p-1 hover:bg-gray-100 rounded"
                                  type="button"
                                >
                                  <Eye
                                    size={14}
                                    className="text-gray-500 hover:text-gray-700"
                                  />
                                </button>
                              )}
                            </div>
                          )}
                          {leadRevenueStatus[lead.id] && (
                            <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                              Paid
                            </span>
                          )}
                          <div className="mt-1">
                            <select
                              value={lead.lead_quality}
                              onChange={(e) =>
                                handleQualityChange(lead.id, e.target.value)
                              }
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded border cursor-pointer focus:outline-none ${
                                LEAD_QUALITIES.find(
                                  (q) => q.value === lead.lead_quality,
                                )?.color ||
                                "bg-gray-100 text-gray-600 border-gray-200"
                              }`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {LEAD_QUALITIES.map((q) => (
                                <option key={q.value} value={q.value}>
                                  {q.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            {lead.created_time
                              ? new Date(lead.created_time).toLocaleString()
                              : "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${lead.source === "manual" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}
                          >
                            {lead.source === "manual" ? "Manual" : "Meta"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setRemarkModalLead(lead)}
                                className="relative p-2 hover:bg-purple-100 rounded-lg transition-colors group"
                                title="Add Remark"
                              >
                                <MessageSquare className="w-4 h-4 text-gray-400 group-hover:text-purple-600" />
                                {remarkHistory[lead.id]?.length > 0 && (
                                  <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                    {remarkHistory[lead.id].length}
                                  </span>
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  setRevenueModalLead(lead);
                                  setShowRevenueModal(true);
                                }}
                                className="p-2 hover:bg-emerald-100 rounded-lg transition-colors group"
                                title="OnBoarded Franchise"
                              >
                                <BadgeCheck className="w-4 h-4 text-gray-400 group-hover:text-emerald-600" />
                              </button>
                              <button
                                onClick={() => setSelectedLead(lead)}
                                className="p-2 hover:bg-blue-100 rounded-lg transition-colors group"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                              </button>
                              {role === "superAdmin" && (
                                <button
                                  onClick={() => handleDeleteLead(lead.id)}
                                  className="p-2 hover:bg-red-100 rounded-lg transition-colors group"
                                  title="Delete Lead"
                                >
                                  <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                                </button>
                              )}
                            </div>
                            <div
                              className={`text-[11px] px-2 py-1 rounded-md border max-w-[150px] truncate ${
                                remarkHistory[lead.id]?.[0]?.text
                                  ? "bg-blue-50 text-blue-800 border-blue-100"
                                  : "text-gray-400 border-transparent italic"
                              }`}
                              title={remarkHistory[lead.id]?.[0]?.text || ""}
                            >
                              {remarkHistory[lead.id]?.[0]?.text ||
                                "No remarks"}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={lead.status}
                            onChange={(e) =>
                              handleStatusChange(lead.id, e.target.value)
                            }
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                              STATUS_STEPS.find((s) => s.label === lead.status)
                                ?.color ||
                              "bg-gray-100 text-gray-700 border-gray-200"
                            } cursor-pointer hover:shadow-sm transition-shadow`}
                          >
                            {STATUS_STEPS.map((s) => (
                              <option key={s.label} value={s.label}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {role === "superFranchiseAdmin" ||
                          role === "superAdmin" ? (
                            <div
                              className={`relative inline-block rounded-lg border ${getAvatarColor(lead.assignedFranchiseAdmin?.fullName || "Unassigned")}`}
                            >
                              <select
                                className="appearance-none bg-transparent px-3 py-1.5 pr-8 rounded-lg text-xs font-bold focus:outline-none w-full max-w-[160px] cursor-pointer"
                                value={lead.assignedFranchiseAdmin?._id || ""}
                                onChange={(e) =>
                                  handleAssignChange(lead.id, e.target.value)
                                }
                              >
                                <option
                                  value=""
                                  className="text-gray-500 bg-white"
                                >
                                  -- Unassigned --
                                </option>
                                {franchiseAdmins.map((admin) => (
                                  <option
                                    key={admin._id}
                                    value={admin._id}
                                    className="text-gray-900 bg-white"
                                  >
                                    {admin.fullName}
                                  </option>
                                ))}
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current">
                                <ChevronDown className="h-3 w-3" />
                              </div>
                            </div>
                          ) : (
                            <span
                              className={`px-3 py-1.5 rounded-full text-xs font-bold border ${getAvatarColor(lead.assignedFranchiseAdmin?.fullName || "Unassigned")}`}
                            >
                              {lead.assignedFranchiseAdmin?.fullName ||
                                "Unassigned"}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                              <Phone className="w-3.5 h-3.5 text-gray-400" />
                              {lead.phone_number || "-"}
                            </div>
                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                              <Mail className="w-3.5 h-3.5 text-gray-400" />
                              {lead.email || "-"}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="relative group cursor-pointer">
                              <div
                                className={`p-2 rounded-full ${lead.whatsapp_count > 0 ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}
                              >
                                <MessageCircle className="w-5 h-5" />
                              </div>
                              {lead.whatsapp_count > 0 && (
                                <span className="absolute -top-1 -right-1 bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm">
                                  {lead.whatsapp_count}
                                </span>
                              )}
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                {lead.whatsapp_count} Messages Sent
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            {lead.city || "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                          {lead["what_is_your_current_occupation?"] || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Banknote className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-sm">
                              {lead.mention_investment_rang || "-"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {!loading && paginatedLeads.length > 0 && (
            <div className="px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                Showing{" "}
                <span className="font-medium">
                  {(currentPage - 1) * PAGE_SIZE + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(currentPage * PAGE_SIZE, totalLeads)}
                </span>{" "}
                of <span className="font-medium">{totalLeads}</span>{" "}
                leads
                {franchiseFollowUpTableActive && (
                  <span className="block text-xs text-indigo-600 font-medium mt-1">
                    Follow-up window: {franchiseFollowUpFilterLabel}
                  </span>
                )}
              </p>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex gap-1">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === pageNum
                            ? "bg-blue-600 text-white"
                            : "hover:bg-gray-100 text-gray-700"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  disabled={currentPage * PAGE_SIZE >= totalLeads}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* LEAD DETAIL MODAL */}
      {selectedLead && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedLead(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex justify-between items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-bold">
                    {selectedLead.full_name}
                  </h2>
                  {selectedLead.ivrMeInterested && (
                    <span className="inline-flex flex-col items-start gap-0.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/20 text-white border border-white/40">
                      <span>IVR interested</span>
                      {selectedIvrAtLabel ? (
                        <span className="text-[10px] font-medium text-white/90 tabular-nums">
                          {selectedIvrAtLabel}
                        </span>
                      ) : (
                        <span className="text-[10px] font-normal text-white/75">
                          Date pending — refresh leads
                        </span>
                      )}
                    </span>
                  )}
                </div>
                <p className="text-blue-100 mt-1">Lead Details</p>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 font-medium uppercase">
                    City
                  </label>
                  <p className="text-gray-900 mt-1 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {selectedLead.city || "-"}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium uppercase">
                    Occupation
                  </label>
                  <p className="text-gray-900 mt-1">
                    {selectedLead["what_is_your_current_occupation?"] || "-"}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium uppercase">
                    Investment Range
                  </label>
                  <p className="text-gray-900 mt-1 flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-gray-400" />
                    {selectedLead.mention_investment_rang || "-"}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium uppercase">
                    Status
                  </label>
                  <p
                    className={`mt-1 inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      STATUS_STEPS.find((s) => s.label === selectedLead.status)
                        ?.color || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {selectedLead.status}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <label className="text-xs text-gray-500 font-medium uppercase">
                  Contact Information
                </label>
                <div className="mt-3 space-y-2">
                  <p className="text-gray-900 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {selectedLead.phone_number || "-"}
                  </p>
                  <p className="text-gray-900 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    {selectedLead.email || "-"}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <label className="text-xs text-gray-500 font-medium uppercase">
                  Created Date
                </label>
                <p className="text-gray-900 mt-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {selectedLead.created_time
                    ? new Date(selectedLead.created_time).toLocaleString()
                    : "-"}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Contact Lead
                </button>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REMARKS MODAL */}
      {remarkModalLead && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setRemarkModalLead(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Remarks History
                </h2>
                <p className="text-gray-500 mt-1">
                  {remarkModalLead.full_name}
                </p>
              </div>
              <button
                onClick={() => setRemarkModalLead(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Input Section */}
              <div className="space-y-3">
                <input
                  type="text"
                  value={newRemark}
                  onChange={(e) => setNewRemark(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleRemarkSubmit()}
                  placeholder="Type a new remark..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />

                <div className="flex flex-wrap gap-2">
                  {QUICK_REMARKS.map((remark) => (
                    <button
                      key={remark}
                      onClick={() => {
                        if (remark === "Meeting Scheduled") {
                          setShowMeetingModal(true);
                        } else {
                          setNewRemark(remark);
                        }
                      }}
                      className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-purple-700 rounded-full transition-colors"
                    >
                      {remark}
                    </button>
                  ))}
                </div>

                {FOLLOW_UP_REMARKS.some((r) => newRemark.startsWith(r)) && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Calendar size={13} className="text-amber-600" />
                      <span className="text-xs font-bold text-amber-700">
                        Schedule Follow-up
                      </span>
                      {followUpDateFranchise && (
                        <span className="ml-auto text-[10px] bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-semibold max-w-[55%] truncate text-right">
                          {(() => {
                            const rawT =
                              followUpTimeFranchise &&
                              /^\d{1,2}:\d{2}$/.test(
                                followUpTimeFranchise.trim(),
                              )
                                ? followUpTimeFranchise.trim()
                                : "10:00";
                            const [hh, mm] = rawT.split(":");
                            const d = new Date(
                              `${followUpDateFranchise}T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00`,
                            );
                            return Number.isNaN(d.getTime())
                              ? followUpDateFranchise
                              : d.toLocaleString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                });
                          })()}
                        </span>
                      )}
                    </div>
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
                            d.setMonth(d.getMonth() + 1, 0);
                          } else {
                            d.setDate(d.getDate() + days);
                          }
                          return d.toISOString().split("T")[0];
                        };
                        const val = getDate();
                        const isActive = followUpDateFranchise === val;
                        return (
                          <button
                            key={label}
                            type="button"
                            onClick={() =>
                              setFollowUpDateFranchise(isActive ? "" : val)
                            }
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
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="date"
                        value={followUpDateFranchise}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) =>
                          setFollowUpDateFranchise(e.target.value)
                        }
                        className="flex-1 min-w-[140px] text-xs border border-amber-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-amber-400 outline-none bg-white"
                      />
                      <input
                        type="time"
                        value={followUpTimeFranchise}
                        onChange={(e) =>
                          setFollowUpTimeFranchise(e.target.value)
                        }
                        className="w-[120px] text-xs border border-amber-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-amber-400 outline-none bg-white"
                        title="Follow-up time"
                      />
                      {followUpDateFranchise && (
                        <button
                          type="button"
                          onClick={() => {
                            setFollowUpDateFranchise("");
                            setFollowUpTimeFranchise("10:00");
                          }}
                          className="text-amber-500 hover:text-red-500 transition-colors"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                    {role === "franchiseAdmin" && (
                      <p className="text-[10px] text-amber-800/90 mt-1">
                        Date and time are required when using Call Not Picked or
                        Call Back Later.
                      </p>
                    )}
                  </div>
                )}

                <button
                  onClick={handleRemarkSubmit}
                  disabled={!newRemark.trim()}
                  className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                >
                  <Send className="w-4 h-4" />
                  Submit
                </button>
              </div>

              {/* Remarks History */}
              <div className="border-t pt-6">
                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-4">
                  Remark History
                </h3>

                {remarkHistory[remarkModalLead.id]?.length > 0 ? (
                  <div className="space-y-3">
                    {remarkHistory[remarkModalLead.id].map((remark, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border-2 ${
                          idx === 0
                            ? "bg-green-50 border-green-200"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-semibold text-gray-600 uppercase">
                            Remark
                          </span>
                          {idx === 0 && (
                            <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full font-medium">
                              Latest
                            </span>
                          )}
                        </div>
                        <p className="text-gray-900 font-medium mb-2">
                          {remark.text}
                        </p>
                        {remark.followUpDate && (
                          <p className="text-[11px] text-amber-700 font-semibold mb-1.5 flex items-center gap-1">
                            <Calendar className="w-3 h-3 shrink-0" />
                            Follow-up:{" "}
                            {new Date(remark.followUpDate).toLocaleString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              },
                            )}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {remark.timestamp}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No remarks yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Add your first remark above
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD LEAD MODAL */}
      {showAddLeadModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setShowAddLeadModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Add New Lead</h2>
              <button
                onClick={() => setShowAddLeadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newLead.full_name || ""}
                    onChange={(e) =>
                      setNewLead({ ...newLead, full_name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newLead.phone_number || ""}
                    onChange={(e) =>
                      setNewLead({ ...newLead, phone_number: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newLead.email || ""}
                    onChange={(e) =>
                      setNewLead({ ...newLead, email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newLead.city || ""}
                    onChange={(e) =>
                      setNewLead({ ...newLead, city: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Occupation
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newLead.occupation || ""}
                    onChange={(e) =>
                      setNewLead({ ...newLead, occupation: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Investment Range
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newLead.investment_range || ""}
                    onChange={(e) =>
                      setNewLead({
                        ...newLead,
                        investment_range: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowAddLeadModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddLead}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Adding..." : "Add Lead"}
                </button>
              </div>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <button
                onClick={handleMeetingSubmit}
                className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium"
              >
                Schedule & Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OnBoarded Franchise Revenue Modal */}
      {showRevenueModal && revenueModalLead && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  OnBoarded Franchise
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {revenueModalLead.full_name}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowRevenueModal(false);
                  setRevenueModalLead(null);
                  setRevenueData({ amount: "", screenshot: null, notes: "" });
                }}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={revenueData.amount}
                  onChange={(e) =>
                    setRevenueData({ ...revenueData, amount: e.target.value })
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
                        setRevenueData({ ...revenueData, screenshot: file });
                      }
                    }}
                    className="hidden"
                    id="screenshot-upload"
                  />
                  <label
                    htmlFor="screenshot-upload"
                    className="flex flex-col items-center cursor-pointer"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">
                      {revenueData.screenshot
                        ? revenueData.screenshot.name
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
                  value={revenueData.notes}
                  onChange={(e) =>
                    setRevenueData({ ...revenueData, notes: e.target.value })
                  }
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                />
              </div>

              <button
                onClick={handleRevenueSubmit}
                disabled={
                  uploadingScreenshot ||
                  !revenueData.amount ||
                  !revenueData.screenshot
                }
                className="w-full py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploadingScreenshot ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <BadgeCheck className="w-5 h-5" />
                    Submit Revenue
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full View Image Modal */}
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

      {/* WhatsApp Template Modal */}
      {/* WhatsApp Template Modal */}
      {/* WhatsApp Template Modal */}
      {/* WhatsApp Template Modal */}
      {/* WhatsApp Template Modal */}
      {isWhatsappTemplateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 p-4">
          {/* Center the modal and keep viewport fixed */}
          <div className="h-full flex items-center justify-center">
            {/* Modal Box with internal scrolling */}
            <div className="w-full max-w-[430px] max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
              {/* Header (Fixed) */}
              <div className="bg-[#0b6e5e] px-4 py-3 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold">
                    W
                  </div>
                  <h2 className="text-white font-semibold text-lg">
                    WhatsApp Preview
                  </h2>
                </div>

                <button
                  onClick={() => setIsWhatsappTemplateModalOpen(false)}
                  className="text-white/90 hover:text-white text-3xl leading-none"
                >
                  ×
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto bg-[#f3efea] p-4">
                {/* Message Card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* Message Content */}
                  <div className="p-5 text-[14px] text-gray-700 leading-8">
                    <p className="mb-6">Hi {"{{1}}"},</p>

                    <p className="mb-6">
                      Your franchise enquiry details for Limbu AI are available.
                    </p>

                    <p className="mb-6">
                      This includes information related to franchise onboarding,
                      business operations, and account-related franchise
                      resources.
                    </p>

                    <p className="mb-6">
                      To access your franchise details and related information,
                      chat with the Limbu AI Assistant.
                    </p>

                    {/* Extra content for testing scroll */}
                    <p className="mb-6">
                      Additional message content can go here. If the content
                      becomes longer, only this middle section will scroll.
                    </p>

                    <p className="mb-6">
                      More content... More content... More content... More
                      content...
                    </p>

                    <div className="text-[12px] text-gray-400 text-right">
                      12:00 PM ✓✓
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <button
                    type="button"
                    className="w-full py-4 text-lg font-medium text-blue-600 border-t border-gray-200 hover:bg-gray-50"
                  >
                    Chat Now
                  </button>

                  <button
                    type="button"
                    className="w-full py-4 text-lg font-medium text-blue-600 border-t border-gray-200 hover:bg-gray-50"
                  >
                    Need Support
                  </button>
                </div>
              </div>

              {/* Footer (Fixed) */}
              <div className="p-4 bg-white border-t border-gray-200 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleSendTemplateMessage}
                  disabled={sendingFranchiseMsg}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-semibold text-xl flex items-center justify-center gap-3 transition-colors disabled:opacity-50"
                >
                  {sendingFranchiseMsg ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                  {sendingFranchiseMsg ? "Sending..." : "Send Message"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <FollowUpDueAlertModal
        alert={followUpDueAlert}
        onDismiss={() => setFollowUpDueAlert(null)}
        onVoiceCall={undefined}
      />
    </div>
  );
}