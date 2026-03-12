"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Phone,
  MessageCircle,
  Users,
  TrendingUp,
  UserCheck,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
} from "lucide-react";

const STATUS_COLORS = {
  pending:   "bg-yellow-100 text-yellow-700",
  contacted: "bg-blue-100 text-blue-700",
  converted: "bg-green-100 text-green-700",
  rejected:  "bg-red-100 text-red-700",
};

const SOURCE_COLORS = {
  franchise_code:   "bg-purple-100 text-purple-700",
  sales_executive:  "bg-indigo-100 text-indigo-700",
  direct:           "bg-gray-100 text-gray-600",
};

export default function SESILeadsPage() {
  const [leads, setLeads]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [userRole, setUserRole] = useState("");

  // Stats
  const total     = leads.length;
  const pending   = leads.filter((l) => l.status === "pending").length;
  const converted = leads.filter((l) => l.status === "converted").length;
  const fromSE    = leads.filter((l) => l.sourceType === "sales_executive").length;

  // Helper: resolve token + role from either admin or team localStorage keys
  const getAuthInfo = () => {
    // Franchise admin login stores: franchise_token + franchise_user
    const adminToken = localStorage.getItem("franchise_token");
    const adminUser  = JSON.parse(localStorage.getItem("franchise_user") || "null");

    // Team member login stores: franchise_team_token + franchise_team_user
    const teamToken  = localStorage.getItem("franchise_team_token");
    const teamUser   = JSON.parse(localStorage.getItem("franchise_team_user") || "null");

    if (adminToken && adminUser) {
      return { token: adminToken, role: adminUser.role || "franchise" };
    }
    if (teamToken && teamUser) {
      return { token: teamToken, role: teamUser.role || "agent" };
    }
    return { token: null, role: "" };
  };

  useEffect(() => {
    const { role } = getAuthInfo();
    setUserRole(role);
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch when filters change
  useEffect(() => {
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const { token, role } = getAuthInfo();
      if (!token) { setLeads([]); setLoading(false); return; }
      setUserRole(role);

      const params = new URLSearchParams();
      if (search)       params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(
        `/api/franchise-panel/sesi-leads?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await res.json();
      if (data.success) {
        setLeads(data.data || []);
      } else {
        setLeads([]);
      }
    } catch (err) {
      console.error("Fetch SESI leads error:", err);
      setLeads([]);
    }
    setLoading(false);
  };

  const updateStatus = async (id, status) => {
    try {
      const { token } = getAuthInfo();
      const res = await fetch("/api/franchise-panel/sesi-leads", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (data.success) {
        setLeads((prev) =>
          prev.map((l) => (l._id === id ? { ...l, status } : l))
        );
      }
    } catch (err) {
      console.error("Update status error:", err);
    }
  };

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SESI Leads</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {userRole === "agent"
              ? "Leads referred through your personal link"
              : "All franchise inquiry leads"}
          </p>
        </div>

        {/* Search + Filter */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search name, email, phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-56"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="contacted">Contacted</option>
              <option value="converted">Converted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Leads",    value: total,     icon: Users,      color: "blue"   },
          { label: "Pending",        value: pending,   icon: Clock,      color: "yellow" },
          { label: "Converted",      value: converted, icon: CheckCircle,color: "green"  },
          { label: "Via Sales Exec", value: fromSE,    icon: UserCheck,  color: "indigo" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm border p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-${color}-100 flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-5 h-5 text-${color}-600`} />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">{value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl shadow border overflow-x-auto">
        <table className="min-w-[1100px] w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase border-b">
            <tr>
              <th className="px-5 py-3 text-left">Date</th>
              <th className="px-5 py-3 text-left">Name</th>
              <th className="px-5 py-3 text-left">Contact</th>
              <th className="px-5 py-3 text-left">City</th>
              <th className="px-5 py-3 text-left">Source</th>
              <th className="px-5 py-3 text-left">Sales Executive</th>
              <th className="px-5 py-3 text-left">Plan / Amount</th>
              <th className="px-5 py-3 text-left">Status</th>
              <th className="px-5 py-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="9" className="px-5 py-10 text-center text-gray-400">
                  Loading leads…
                </td>
              </tr>
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-5 py-10 text-center text-gray-400">
                  No leads found
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead._id} className="hover:bg-gray-50 transition-colors">
                  {/* Date */}
                  <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(lead.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit", month: "short", year: "numeric",
                    })}
                  </td>

                  {/* Name */}
                  <td className="px-5 py-3 font-medium text-gray-900">
                    {lead.fullName}
                  </td>

                  {/* Contact */}
                  <td className="px-5 py-3">
                    <div className="text-gray-700">{lead.phone}</div>
                    <div className="text-xs text-gray-400">{lead.email}</div>
                  </td>

                  {/* City */}
                  <td className="px-5 py-3 text-gray-600">{lead.city || "—"}</td>

                  {/* Source */}
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SOURCE_COLORS[lead.sourceType] || SOURCE_COLORS.direct}`}>
                      {lead.sourceType === "franchise_code"
                        ? `FC: ${lead.franchiseCode}`
                        : lead.sourceType === "sales_executive"
                        ? "Sales Exec"
                        : "Direct"}
                    </span>
                  </td>

                  {/* Sales Executive */}
                  <td className="px-5 py-3">
                    {lead.salesExecutiveName ? (
                      <div>
                        <div className="font-medium text-gray-800">{lead.salesExecutiveName}</div>
                        <div className="text-xs text-gray-400 font-mono">
                          {lead.salesExecutiveReferralCode}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>

                  {/* Plan / Amount */}
                  <td className="px-5 py-3">
                    {lead.plan && (
                      <div className="text-xs font-medium text-gray-700 capitalize">{lead.plan}</div>
                    )}
                    {lead.amount ? (
                      <div className="text-sm font-semibold text-green-700">
                        ₹{lead.amount.toLocaleString("en-IN")}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>

                  {/* Status badge */}
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[lead.status] || STATUS_COLORS.pending}`}>
                      {lead.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {/* Call */}
                      <a
                        href={`tel:${lead.phone}`}
                        className="p-1.5 rounded-lg bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-600 transition"
                        title="Call"
                      >
                        <Phone size={14} />
                      </a>

                      {/* WhatsApp */}
                      <a
                        href={`https://wa.me/91${lead.phone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-gray-100 hover:bg-green-100 text-gray-600 hover:text-green-600 transition"
                        title="WhatsApp"
                      >
                        <MessageCircle size={14} />
                      </a>

                      {/* Status quick-update (franchise admin / manager only) */}
                      {userRole !== "agent" && (
                        <select
                          value={lead.status}
                          onChange={(e) => updateStatus(lead._id, e.target.value)}
                          className="text-xs border rounded px-1 py-0.5 bg-white focus:ring-1 focus:ring-blue-400 outline-none"
                        >
                          <option value="pending">Pending</option>
                          <option value="contacted">Contacted</option>
                          <option value="converted">Converted</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
