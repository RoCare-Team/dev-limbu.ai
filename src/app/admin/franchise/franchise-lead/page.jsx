"use client";

import { useEffect, useState, useMemo } from "react";
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
} from "lucide-react";

/* ---------------- CONFIG ---------------- */
const PAGE_SIZE = 50;

const FORMS = [
  {
    id: "1213106820766164",
    label: "Franchise Leads",
  },
];

const STATUS_STEPS = [
  { label: "Active", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { label: "Follow Up", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { label: "Inactive", color: "bg-gray-100 text-gray-700 border-gray-200" },
  { label: "Onboard", color: "bg-green-100 text-green-700 border-green-200" },
];

/* ---------------- NORMALIZE LEAD ---------------- */
const normalizeLead = (lead) => {
  const obj = {
    id: lead.id,
    created_time: lead.created_time,
    status: lead.status || "Active",
    remarks: lead.remarks || [],
    assignedFranchiseAdmin: lead.assignedFranchiseAdmin,
  };

  if (lead.field_data) {
    lead.field_data.forEach((f) => {
      obj[f.name] = f.values?.[0] || "";
    });
  }

  return obj;
};

export default function FranchiseLeadsPage() {
  const [formId] = useState(FORMS[0].id);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalLeads, setTotalLeads] = useState(0);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLead, setSelectedLead] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [assigneeFilter, setAssigneeFilter] = useState("All");
  const [dateRange, setDateRange] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [error, setError] = useState(null);
  const [remarkModalLead, setRemarkModalLead] = useState(null);
  const [newRemark, setNewRemark] = useState("");
  const [remarkHistory, setRemarkHistory] = useState({});
  const [franchiseAdmins, setFranchiseAdmins] = useState([]);
  const [role, setRole] = useState("");

  /* ---------------- FETCH LEADS FROM API ---------------- */
  const fetchLeads = async () => {
    setLoading(true);
    setError(null);

    const userEmail = localStorage.getItem("email");

    try {
      const res = await fetch(
        `/api/franchise-leads?formId=${formId}&limit=1000&summary=true&email=${userEmail || ""}`
      );
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();

      if (data.success) {
        const normalizedLeads = data.leads.map(normalizeLead);
        setLeads(normalizedLeads);
        setTotalLeads(data.summary?.total_count || normalizedLeads.length);
        
        // Populate remark history from fetched leads
        const history = {};
        normalizedLeads.forEach(lead => {
          if (lead.remarks && lead.remarks.length > 0) {
            history[lead.id] = lead.remarks.map(r => ({
              text: r.text,
              timestamp: new Date(r.addedAt).toLocaleString(),
              user: r.addedBy
            })).reverse(); // Show newest first
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
  };

  /* ---------------- LOAD ON MOUNT ---------------- */
  useEffect(() => {
    fetchLeads();
  }, [formId]);

  /* ---------------- FETCH ADMINS & ROLE ---------------- */
  useEffect(() => {
    const userRole = localStorage.getItem("role");
    setRole(userRole);

    if (userRole === "superFranchiseAdmin") {
      fetch("/api/admin/franchise-admins")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setFranchiseAdmins(data.data);
        })
        .catch((err) => console.error("Error fetching admins:", err));
    }
  }, []);

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
      result = result.filter(lead => {
        if (!lead.created_time) return false;
        const leadDate = new Date(lead.created_time); // Lead date
        const leadDateOnly = new Date(leadDate.toDateString()); // Normalize to midnight
        const todayOnly = new Date(now.toDateString());
        
        if (dateRange === "today") return leadDateOnly.getTime() === todayOnly.getTime();
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

  const filteredLeads = useMemo(() => {
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
      result = result.filter(lead => lead.status === statusFilter);
    }

    // Assignee Filter
    if (assigneeFilter !== "All") {
      if (assigneeFilter === "Unassigned") {
        result = result.filter(lead => !lead.assignedFranchiseAdmin);
      } else {
        result = result.filter(lead => lead.assignedFranchiseAdmin?._id === assigneeFilter);
      }
    }

    return result;
  }, [dateFilteredLeads, search, statusFilter, assigneeFilter]);

  /* ---------------- ADMIN COUNTS ---------------- */
  const adminCounts = useMemo(() => {
    const counts = { Unassigned: 0 };
    franchiseAdmins.forEach(admin => counts[admin._id] = 0); // Initialize
    leads.forEach(lead => {
      const adminId = lead.assignedFranchiseAdmin?._id || "Unassigned";
      counts[adminId] = (counts[adminId] || 0) + 1;
    });
    return counts;
  }, [leads, franchiseAdmins]);

  /* ---------------- PAGINATION ---------------- */
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filteredLeads.slice(start, end);
  }, [filteredLeads, currentPage, PAGE_SIZE]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, dateRange, customStartDate, customEndDate, assigneeFilter]);

  /* ---------------- STATS ---------------- */
  const stats = useMemo(() => {
    const sourceData = dateFilteredLeads;

    const today = sourceData.filter((l) => {
      if (!l.created_time) return false;
      return new Date(l.created_time).toDateString() === new Date().toDateString();
    }).length;

    const activeCount = sourceData.filter(l => l.status === "Active").length;
    const followUpCount = sourceData.filter(l => l.status === "Follow Up").length;
    const onboardCount = sourceData.filter(l => l.status === "Onboard").length;
    const inactiveCount = sourceData.filter(l => l.status === "Inactive").length;

    return [
      { label: "Total Leads", value: sourceData.length, icon: Users, color: "text-blue-600" },
      { label: "New Today", value: today, icon: TrendingUp, color: "text-green-600" },
      { label: "Active", value: activeCount, icon: Activity, color: "text-blue-600" },
      { label: "Follow Up", value: followUpCount, icon: Clock, color: "text-yellow-600" },
      { label: "Onboard", value: onboardCount, icon: UserCheck, color: "text-green-600" },
      { label: "Inactive", value: inactiveCount, icon: UserX, color: "text-gray-600" },
    ];
  }, [dateFilteredLeads]);

  /* ---------------- STATUS CHANGE ---------------- */
  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/franchise-leads`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: id, status: newStatus })
      });
      
      if (res.ok) {
        setLeads((prev) =>
          prev.map((lead) =>
            lead.id === id ? { ...lead, status: newStatus } : lead
          )
        );
      } else {
        console.error("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  /* ---------------- ASSIGNMENT CHANGE ---------------- */
  const handleAssignChange = async (leadId, newAdminId) => {
    try {
      const res = await fetch("/api/franchise-leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, assignedFranchiseAdminId: newAdminId || null }),
      });
      const data = await res.json();

      if (data.success) {
        setLeads((prevLeads) =>
          prevLeads.map((lead) =>
            lead.id === leadId
              ? { ...lead, assignedFranchiseAdmin: data.lead.assignedFranchiseAdmin }
              : lead
          )
        );
      } else {
        alert(data.message || "Failed to assign lead");
      }
    } catch (error) {
      console.error("Assignment error:", error);
      alert("Something went wrong while assigning.");
    }
  };

  /* ---------------- REMARKS HANDLING ---------------- */
  const quickRemarks = [
    "Call Not Picked",
    "Not Interested",
    "Interested",
    "Call Back Later",
    "Wrong Number",
    "Switch Off",
    "Meeting Scheduled"
  ];

  const handleRemarkSubmit = async () => {
    if (!newRemark.trim() || !remarkModalLead) return;

    try {
      const res = await fetch(`/api/franchise-leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          leadId: remarkModalLead.id, 
          text: newRemark,
          addedBy: "Admin" 
        })
      });

      const data = await res.json();

      if (data.success) {
        const updatedRemarks = data.remarks.map(r => ({
          text: r.text,
          timestamp: new Date(r.addedAt).toLocaleString(),
          user: r.addedBy
        })).reverse();

        setRemarkHistory(prev => ({
          ...prev,
          [remarkModalLead.id]: updatedRemarks
        }));
        setNewRemark("");
      }
    } catch (error) {
      console.error("Error adding remark:", error);
    }
  };

  /* ---------------- EXPORT TO CSV ---------------- */
  const handleExport = () => {
    const headers = ["Name", "City", "Occupation", "Investment", "Phone", "Email", "Date", "Status"];
    const csvContent = [
      headers.join(","),
      ...filteredLeads.map(lead => [
        lead.full_name || "",
        lead.city || "",
        lead["what_is_your_current_occupation?"] || "",
        lead.mention_investment_rang || "",
        lead.phone_number || "",
        lead.email || "",
        lead.created_time ? new Date(lead.created_time).toLocaleDateString() : "",
        lead.status || ""
      ].map(field => `"${field}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `franchise-leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const totalPages = Math.ceil(filteredLeads.length / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6">
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
              <p className="text-gray-500 mt-2">Manage and track your franchise leads efficiently</p>
            </div>

            <div className="flex flex-wrap gap-2">

              {/* <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button> */}

              <button
                onClick={fetchLeads}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>


          {/* FILTERS */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Status</option>
              {STATUS_STEPS.map((s) => (
                <option key={s.label} value={s.label}>{s.label}</option>
              ))}
            </select>

            {role === "superFranchiseAdmin" && (
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Assignees</option>
                <option value="Unassigned">Unassigned</option>
                {franchiseAdmins.map((admin) => (
                  <option key={admin._id} value={admin._id}>{admin.fullName}</option>
                ))}
              </select>
            )}

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

            {(search || statusFilter !== "All" || dateRange !== "all") && (
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("All");
                  setAssigneeFilter("All");
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
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Error Loading Leads</h3>
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map((s, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
              <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
            </div>
          ))}
        </div>
        
        {/* ADMIN ASSIGNMENT SUMMARY (Only for Super Admin) */}
        {role === "superFranchiseAdmin" && franchiseAdmins.length > 0 && (
          <div className="flex flex-wrap gap-3 pb-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${getAvatarColor("Unassigned")}`}>
              <User className="w-3 h-3" />
              <span>Unassigned: {adminCounts["Unassigned"] || 0}</span>
            </div>
            {franchiseAdmins.map(admin => {
              const count = adminCounts[admin._id] || 0;
              if (count === 0) return null; // Optional: hide admins with 0 leads
              return (
                <div key={admin._id} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${getAvatarColor(admin.fullName)}`}>
                  <User className="w-3 h-3" />
                  <span>{admin.fullName}: {count}</span>
                </div>
              );
            })}
          </div>
        )}

          {/* SEARCH BAR */}
          <div className="mt-6 mb-2">
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

        {/* TABLE */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="max-h-[600px] overflow-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10 shadow-sm">
                  <tr>
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
                      Actions
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                      Last Remark
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
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="py-16 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                        <p className="text-sm text-gray-500 mt-3">Loading leads...</p>
                      </td>
                    </tr>
                  ) : paginatedLeads.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-16 text-center">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No leads found</p>
                        <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or search</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedLeads.map((lead, idx) => (
                      <tr key={lead.id} className="hover:bg-blue-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{lead.full_name || "Unknown"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            {lead.created_time ? new Date(lead.created_time).toLocaleDateString() : "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={lead.status}
                            onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                              STATUS_STEPS.find(s => s.label === lead.status)?.color || "bg-gray-100 text-gray-700 border-gray-200"
                            } cursor-pointer hover:shadow-sm transition-shadow`}
                          >
                            {STATUS_STEPS.map((s) => (
                              <option key={s.label} value={s.label}>{s.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {role === "superFranchiseAdmin" ? (
                            <div className={`relative inline-block rounded-lg border ${getAvatarColor(lead.assignedFranchiseAdmin?.fullName || "Unassigned")}`}>
                              <select
                                className="appearance-none bg-transparent px-3 py-1.5 pr-8 rounded-lg text-xs font-bold focus:outline-none w-full max-w-[160px] cursor-pointer"
                                value={lead.assignedFranchiseAdmin?._id || ""}
                                onChange={(e) => handleAssignChange(lead.id, e.target.value)}
                              >
                                <option value="" className="text-gray-500 bg-white">-- Unassigned --</option>
                                {franchiseAdmins.map((admin) => (
                                  <option key={admin._id} value={admin._id} className="text-gray-900 bg-white">
                                    {admin.fullName}
                                  </option>
                                ))}
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current">
                                <ChevronDown className="h-3 w-3" />
                              </div>
                            </div>
                          ) : (
                            <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${getAvatarColor(lead.assignedFranchiseAdmin?.fullName || "Unassigned")}`}>
                              {lead.assignedFranchiseAdmin?.fullName || "Unassigned"}
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
                              onClick={() => setSelectedLead(lead)}
                              className="p-2 hover:bg-blue-100 rounded-lg transition-colors group"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-[150px] truncate" title={remarkHistory[lead.id]?.[0]?.text || ""}>
                          {remarkHistory[lead.id]?.[0]?.text || "-"}
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
                            <span className="text-sm">{lead.mention_investment_rang || "-"}</span>
                          </div>
                        </td>
                    
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
          </div>

          {/* PAGINATION */}
          {!loading && paginatedLeads.length > 0 && (
            <div className="px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                Showing <span className="font-medium">{(currentPage - 1) * PAGE_SIZE + 1}</span> to{" "}
                <span className="font-medium">{Math.min(currentPage * PAGE_SIZE, filteredLeads.length)}</span> of{" "}
                <span className="font-medium">{filteredLeads.length}</span> leads
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
                  disabled={currentPage * PAGE_SIZE >= filteredLeads.length}
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSelectedLead(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold">{selectedLead.full_name}</h2>
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
                  <label className="text-xs text-gray-500 font-medium uppercase">City</label>
                  <p className="text-gray-900 mt-1 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {selectedLead.city || "-"}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium uppercase">Occupation</label>
                  <p className="text-gray-900 mt-1">{selectedLead["what_is_your_current_occupation?"] || "-"}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium uppercase">Investment Range</label>
                  <p className="text-gray-900 mt-1 flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-gray-400" />
                    {selectedLead.mention_investment_rang || "-"}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium uppercase">Status</label>
                  <p className={`mt-1 inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    STATUS_STEPS.find(s => s.label === selectedLead.status)?.color || "bg-gray-100 text-gray-700"
                  }`}>
                    {selectedLead.status}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <label className="text-xs text-gray-500 font-medium uppercase">Contact Information</label>
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
                <label className="text-xs text-gray-500 font-medium uppercase">Created Date</label>
                <p className="text-gray-900 mt-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {selectedLead.created_time ? new Date(selectedLead.created_time).toLocaleString() : "-"}
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setRemarkModalLead(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Remarks History</h2>
                <p className="text-gray-500 mt-1">{remarkModalLead.full_name}</p>
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
                  onKeyPress={(e) => e.key === 'Enter' && handleRemarkSubmit()}
                  placeholder="Type a new remark..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />

                <div className="flex flex-wrap gap-2">
                  {quickRemarks.map((remark) => (
                    <button
                      key={remark}
                      onClick={() => setNewRemark(remark)}
                      className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-purple-700 rounded-full transition-colors"
                    >
                      {remark}
                    </button>
                  ))}
                </div>

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
                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-4">Remark History</h3>
                
                {remarkHistory[remarkModalLead.id]?.length > 0 ? (
                  <div className="space-y-3">
                    {remarkHistory[remarkModalLead.id].map((remark, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border-2 ${
                          idx === 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-semibold text-gray-600 uppercase">Remark</span>
                          {idx === 0 && (
                            <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full font-medium">
                              Latest
                            </span>
                          )}
                        </div>
                        <p className="text-gray-900 font-medium mb-2">{remark.text}</p>
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
                    <p className="text-sm text-gray-400 mt-1">Add your first remark above</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}